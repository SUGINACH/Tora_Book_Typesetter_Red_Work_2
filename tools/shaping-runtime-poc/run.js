#!/usr/bin/env node
'use strict';

const { spawn, spawnSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const VERSION = '1.6.4';
const FONT_SOURCE = process.env.HB_POC_FONT || '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const REPORT = process.env.HB_POC_REPORT || '/tmp/shaping-runtime-poc-report.json';
const AGENT_BROWSER = process.env.AGENT_BROWSER || 'agent-browser';

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(command + ' ' + args.join(' ') + ' exited ' + result.status + ': ' +
      (result.stderr || result.stdout || '').slice(-2000));
  }
  return result.stdout.trim();
}

function runAgent(args, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const child = spawn(AGENT_BROWSER, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('agent-browser ' + args[0] + ' timed out after ' + timeoutMs + 'ms'));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error('agent-browser could not start: ' + error.message));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error('agent-browser ' + args.join(' ') + ' exited ' + code + ': ' +
        (stderr || stdout).slice(-2000)));
      else resolve(stdout.trim());
    });
  });
}

function unwrapAgentJson(output) {
  let value = output.trim();
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'string') { value = parsed; continue; }
      return parsed;
    } catch (_) {
      return value;
    }
  }
  return value;
}

function mimeType(file) {
  switch (path.extname(file).toLowerCase()) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.mjs': return 'text/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.wasm': return 'application/wasm';
    case '.ttf': return 'font/ttf';
    default: return 'application/octet-stream';
  }
}

async function main() {
  if (!fs.existsSync(FONT_SOURCE)) throw new Error('Required test font is missing: ' + FONT_SOURCE);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'harfbuzz-runtime-poc-'));
  const site = path.join(temp, 'site');
  const report = { package: 'harfbuzzjs@' + VERSION, nodeVersion: process.version, startedAt: new Date().toISOString() };
  let server;
  let browserOpened = false;

  try {
    fs.mkdirSync(path.join(site, 'harfbuzzjs'), { recursive: true });
    fs.mkdirSync(path.join(site, 'fonts'), { recursive: true });
    const packedName = runCommand('npm', ['pack', 'harfbuzzjs@' + VERSION, '--silent', '--pack-destination', temp]);
    const tarballName = packedName.split(/\r?\n/).at(-1).trim();
    const tarball = path.join(temp, tarballName);
    if (!fs.existsSync(tarball)) throw new Error('npm pack did not create tarball: ' + tarball);
    runCommand('tar', ['-xzf', tarball, '-C', temp]);
    const dist = path.join(temp, 'package', 'dist');
    for (const file of ['index.mjs', 'harfbuzz.js', 'harfbuzz.wasm']) {
      if (!fs.existsSync(path.join(dist, file))) {
        throw new Error('Pinned HarfBuzz package missing required asset: ' + file);
      }
    }
    fs.cpSync(dist, path.join(site, 'harfbuzzjs', 'dist'), { recursive: true });
    fs.copyFileSync(FONT_SOURCE, path.join(site, 'fonts', 'DejaVuSans.ttf'));
    for (const file of ['index.html', 'classic-worker.js', 'shape-core.js']) {
      fs.copyFileSync(path.join(__dirname, file), path.join(site, file));
    }

    const hbUrl = pathToFileURL(path.join(site, 'harfbuzzjs', 'dist', 'index.mjs')).href;
    const hb = await import(hbUrl);
    const shapeCore = require('./shape-core.js');
    const fontBytes = fs.readFileSync(FONT_SOURCE);
    const fontArrayBuffer = fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength);
    const expected = shapeCore.shapeWithHarfBuzz(hb, fontArrayBuffer);
    const expectedJson = JSON.stringify(expected);
    report.nodeReference = {
      harfBuzzVersion: expected.harfBuzzVersion,
      caseCount: expected.cases.length,
      glyphCount: expected.cases.reduce((sum, item) => sum + item.glyphs.length, 0),
      outputSha256: crypto.createHash('sha256').update(expectedJson).digest('hex'),
      glyphIds: expected.cases.map(item => item.glyphs.map(glyph => glyph.gid)),
      clusters: expected.cases.map(item => item.glyphs.map(glyph => glyph.cluster))
    };
    fs.writeFileSync(path.join(site, 'expected.json'), expectedJson, 'utf8');

    server = http.createServer((request, response) => {
      const parsed = new URL(request.url, 'http://127.0.0.1');
      const pathname = decodeURIComponent(parsed.pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const target = path.resolve(site, relative);
      if (target !== site && !target.startsWith(site + path.sep)) {
        response.writeHead(403); response.end('forbidden'); return;
      }
      fs.readFile(target, (error, data) => {
        if (error) { response.writeHead(404); response.end('not found'); return; }
        response.writeHead(200, {
          'Content-Type': mimeType(target),
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        });
        response.end(data);
      });
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    await runAgent(['open', 'http://127.0.0.1:' + address.port + '/'], 60000);
    browserOpened = true;
    await runAgent(['wait', '1000'], 10000);

    const started = Date.now();
    let browserResult = null;
    while (Date.now() - started < 70000) {
      const raw = await runAgent(['eval', 'JSON.stringify(window.__hbPoc || {state:"missing"})'], 15000);
      const state = unwrapAgentJson(raw);
      if (state && typeof state === 'object' && state.state !== 'running') {
        browserResult = state;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!browserResult) throw new Error('Timed out waiting for classic Worker ESM/WASM shaping');
    report.browserWorker = browserResult;
    if (browserResult.state !== 'passed' || browserResult.exactNodeParity !== true ||
        browserResult.classicWorker !== true || browserResult.dynamicImport !== true ||
        browserResult.wasmLoaded !== true) {
      throw new Error('Classic Worker compatibility proof failed: ' + JSON.stringify(browserResult).slice(0, 5000));
    }

    report.result = 'passed';
    report.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.result = 'failed';
    report.error = String(error && error.stack || error);
    report.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(REPORT), { recursive: true });
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf8');
    throw error;
  } finally {
    if (browserOpened) {
      try { await runAgent(['close'], 15000); } catch (_) { /* preserve primary result */ }
    }
    if (server) await new Promise(resolve => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
