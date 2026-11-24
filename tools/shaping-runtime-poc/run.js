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
const REPORT = process.env.HB_POC_REPORT || '/tmp/shaping-runtime-poc-report.json';
const AGENT_BROWSER = process.env.AGENT_BROWSER || 'agent-browser';
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const FONT_DIR = path.join(REPO_ROOT, 'red-build', 'ui', 'assets', 'imud', 'fonts');
const FONT_FIXTURES = [
  { name: 'DejaVuSans.ttf', format: 'ttf', source: '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf' },
  { name: 'FrankRuhlLibre-Regular.ttf', format: 'ttf', source: path.join(FONT_DIR, 'FrankRuhlLibre-Regular.ttf') },
  { name: 'Frank-Re-Regular.ttf', format: 'ttf', source: path.join(FONT_DIR, 'Frank-Re-Regular.ttf') },
  { name: 'DavidLibre-Regular.ttf', format: 'ttf', source: path.join(FONT_DIR, 'DavidLibre-Regular.ttf') },
  { name: 'Guttman-Rashi-Normal.ttf', format: 'ttf', source: path.join(FONT_DIR, 'Guttman-Rashi-Normal.ttf') },
  { name: 'Narkisim-Regular.ttf', format: 'ttf', source: path.join(FONT_DIR, 'Narkisim-Regular.ttf') },
  { name: 'FrankRuhlLibre-VF.ttf', format: 'ttf-variable', source: path.join(FONT_DIR, 'FrankRuhlLibre-VF.ttf'), variationMode: 'max' },
  { name: 'Ambivalenti-Regular.woff2', format: 'woff2', source: path.join(FONT_DIR, 'Ambivalenti-Regular.woff2'), allowUnsupported: true },
  { name: 'FrankBasic-1-regular.woff2', format: 'woff2', source: path.join(FONT_DIR, 'FrankBasic-1-regular.woff2'), allowUnsupported: true },
  { name: 'Mixtape-Bold.woff2', format: 'woff2', source: path.join(FONT_DIR, 'Mixtape-Bold.woff2'), allowUnsupported: true },
  { name: 'Mixtape-Regular.woff2', format: 'woff2', source: path.join(FONT_DIR, 'Mixtape-Regular.woff2'), allowUnsupported: true }
];

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
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

async function main() {
  const missingFiles = FONT_FIXTURES.filter((fixture) => !fs.existsSync(fixture.source));
  if (missingFiles.length) throw new Error('Missing repository font fixtures: ' +
    missingFiles.map((fixture) => fixture.name + ' at ' + fixture.source).join(', '));

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'harfbuzz-runtime-poc-'));
  const site = path.join(temp, 'site');
  const normalizedDir = path.join(temp, 'normalized-sfnt');
  const report = {
    package: 'harfbuzzjs@' + VERSION,
    nodeVersion: process.version,
    fixtures: FONT_FIXTURES.map(({ name, format, variationMode }) => ({ name, format, variationMode: variationMode || 'default' })),
    normalization: [],
    startedAt: new Date().toISOString()
  };
  let server;
  let browserOpened = false;

  try {
    fs.mkdirSync(path.join(site, 'harfbuzzjs'), { recursive: true });
    fs.mkdirSync(path.join(site, 'fonts'), { recursive: true });
    fs.mkdirSync(normalizedDir, { recursive: true });
    const shapeFixtures = [];
    for (const fixture of FONT_FIXTURES) {
      const originalSitePath = path.join(site, 'fonts', fixture.name);
      fs.copyFileSync(fixture.source, originalSitePath);
      shapeFixtures.push(Object.assign({}, fixture, { source: fixture.source }));
      if (fixture.format === 'woff2') {
        const normalizedName = fixture.name.replace(/\.woff2$/i, '') + '.normalized.sfnt';
        const normalizedPath = path.join(normalizedDir, normalizedName);
        const python = process.env.HB_POC_PYTHON || 'python3';
        const normalizationInfo = JSON.parse(runCommand(python, [
          path.join(__dirname, 'normalize_woff2.py'),
          fixture.source,
          normalizedPath
        ]).split(/\r?\n/).at(-1));
        // Determinism gate: normalize the same source a second time and compare the
        // actual SFNT bytes, not just parsed metadata or glyph outputs.
        const repeatPath = path.join(normalizedDir, normalizedName + '.repeat');
        const repeatInfo = JSON.parse(runCommand(python, [
          path.join(__dirname, 'normalize_woff2.py'),
          fixture.source,
          repeatPath
        ]).split(/\r?\n/).at(-1));
        const normalizedBytes = fs.readFileSync(normalizedPath);
        const repeatBytes = fs.readFileSync(repeatPath);
        const normalizedSha256 = crypto.createHash('sha256').update(normalizedBytes).digest('hex');
        const repeatSha256 = crypto.createHash('sha256').update(repeatBytes).digest('hex');
        const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(fixture.source)).digest('hex');
        if (normalizedSha256 !== repeatSha256 || !normalizedBytes.equals(repeatBytes) ||
            normalizationInfo.outlineFormat !== repeatInfo.outlineFormat ||
            normalizationInfo.glyphCount !== repeatInfo.glyphCount ||
            normalizationInfo.unitsPerEm !== repeatInfo.unitsPerEm) {
          throw new Error('WOFF2 normalization is not byte-deterministic for ' + fixture.name +
            ': ' + normalizedSha256 + ' != ' + repeatSha256);
        }
        fs.rmSync(repeatPath, { force: true });
        fs.copyFileSync(normalizedPath, path.join(site, 'fonts', normalizedName));
        shapeFixtures.push({
          name: normalizedName,
          format: 'sfnt-normalized-from-woff2',
          normalizedFrom: fixture.name,
          sourceOutlineFormat: normalizationInfo.outlineFormat,
          captureOutlinePaths: normalizationInfo.outlineFormat === 'CFF' || normalizationInfo.outlineFormat === 'CFF2',
          source: normalizedPath
        });
        report.normalization.push({
          source: fixture.name,
          normalized: normalizedName,
          method: 'fontTools.ttLib.TTFont; flavor=None; Brotli decoder',
          outputBytes: fs.statSync(normalizedPath).size,
          sourceSha256,
          normalizedSha256,
          repeatSha256,
          outlineFormat: normalizationInfo.outlineFormat,
          tableTags: normalizationInfo.tableTags,
          glyphCount: normalizationInfo.glyphCount,
          unitsPerEm: normalizationInfo.unitsPerEm,
          signatureHex: normalizationInfo.signatureHex,
          deterministicBytes: normalizedSha256 === repeatSha256 &&
            normalizationInfo.outlineFormat === repeatInfo.outlineFormat &&
            normalizationInfo.glyphCount === repeatInfo.glyphCount &&
            normalizationInfo.unitsPerEm === repeatInfo.unitsPerEm
        });
      }
    }
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
    for (const file of ['index.html', 'classic-worker.js', 'shape-core.js']) {
      fs.copyFileSync(path.join(__dirname, file), path.join(site, file));
    }

    const hbUrl = pathToFileURL(path.join(site, 'harfbuzzjs', 'dist', 'index.mjs')).href;
    const hb = await import(hbUrl);
    const shapeCore = require('./shape-core.js');
    const expected = [];
    for (const fixture of shapeFixtures) {
      const bytes = fs.readFileSync(fixture.source);
      const fontArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      expected.push(shapeCore.shapeWithHarfBuzz(hb, fontArrayBuffer, fixture));
    }
    const cffOutlineInputs = expected.filter((item) => item.outlineSweep && item.outlineSweep.outlinePaths)
      .map((item) => {
        const fixture = shapeFixtures.find((candidate) => candidate.name === item.fontName);
        if (!fixture) throw new Error('No source SFNT for CFF outline reference: ' + item.fontName);
        return { fontName: item.fontName, fontPath: fixture.source, glyphPaths: item.outlineSweep.outlinePaths };
      });
    const cffOutlineInputPath = path.join(temp, 'cff-outline-reference-input.json');
    fs.writeFileSync(cffOutlineInputPath, JSON.stringify(cffOutlineInputs), 'utf8');
    const outlineComparisonStdout = runCommand(process.env.HB_POC_PYTHON || 'python3', [
      path.join(__dirname, 'compare_cff_outlines.py'),
      cffOutlineInputPath
    ]);
    report.cffSourceOutlineComparison = JSON.parse(outlineComparisonStdout.split(/\r?\n/).at(-1));
    const cffComparison = report.cffSourceOutlineComparison;
    const invalidCffComparisons = (cffComparison.fonts || []).filter((font) =>
      font.operationSequenceMismatches !== 0 ||
      font.coordinateMismatches !== 0 ||
      font.coordinateMatchesWithinTolerance !== font.glyphCount ||
      font.emptySourceOutlines !== font.emptyHarfBuzzOutlines ||
      font.emptyOutlineAgreements !== font.emptySourceOutlines ||
      font.maxCoordinateDeltaFontUnits > 1e-5
    );
    if (invalidCffComparisons.length ||
        cffComparison.coordinateMismatches !== 0 ||
        cffComparison.coordinateMatchesWithinTolerance !== cffComparison.glyphCount) {
      throw new Error('CFF outlines do not match fontTools source geometry: ' +
        JSON.stringify({
          summary: {
            glyphCount: cffComparison.glyphCount,
            coordinateMatchesWithinTolerance: cffComparison.coordinateMatchesWithinTolerance,
            coordinateMismatches: cffComparison.coordinateMismatches,
            operationSequenceMismatches: cffComparison.operationSequenceMismatches
          },
          fonts: invalidCffComparisons
        }));
    }
    report.cffSourceOutlineComparison.passed = true;
    const expectedJson = JSON.stringify(expected);
    report.nodeReference = {
      harfBuzzVersion: expected[0].harfBuzzVersion,
      fontCount: expected.length,
      caseCountPerFont: expected[0].cases.length,
      totalGlyphCount: expected.reduce((sum, item) =>
        sum + item.cases.reduce((subtotal, testCase) => subtotal + testCase.glyphs.length, 0), 0),
      outputSha256: crypto.createHash('sha256').update(expectedJson).digest('hex'),
      fonts: expected.map((item) => ({
        name: item.fontName,
        format: item.fontFormat,
        normalizedFrom: item.normalizedFrom,
        sourceOutlineFormat: item.sourceOutlineFormat,
        outlineSweep: item.outlineSweep,
        unitsPerEm: item.unitsPerEm,
        variationMode: item.variationMode,
        axisInfos: item.axisInfos,
        appliedVariations: item.appliedVariations,
        missingCodepoints: item.missingCodepoints,
        missingBaseCodepoints: item.missingBaseCodepoints,
        missingMarkCodepoints: item.missingMarkCodepoints,
        notdefGlyphCount: item.notdefGlyphCount,
        coverageStatus: item.coverageStatus,
        glyphCount: item.cases.reduce((sum, testCase) => sum + testCase.glyphs.length, 0),
        glyphIds: item.cases.map((testCase) => testCase.glyphs.map((glyph) => glyph.gid)),
        clusters: item.cases.map((testCase) => testCase.glyphs.map((glyph) => glyph.cluster))
      }))
    };
    const unsupportedFontFixtures = [];
    const invalidCoverageFixtures = [];
    for (let i = 0; i < expected.length; i++) {
      const item = expected[i];
      const fixture = shapeFixtures[i];
      if (item.unitsPerEm <= 0 || item.notdefGlyphCount > 0) {
        if (fixture.format === 'woff2' && fixture.allowUnsupported && item.coverageStatus === 'none') {
          unsupportedFontFixtures.push(item.fontName);
        } else {
          invalidCoverageFixtures.push({
            font: item.fontName,
            format: fixture.format,
            upem: item.unitsPerEm,
            coverageStatus: item.coverageStatus,
            notdefGlyphCount: item.notdefGlyphCount,
            missingBaseCodepoints: item.missingBaseCodepoints
          });
        }
      } else if (item.coverageStatus !== 'complete') {
        invalidCoverageFixtures.push({
          font: item.fontName,
          format: fixture.format,
          coverageStatus: item.coverageStatus,
          missingBaseCodepoints: item.missingBaseCodepoints,
          missingMarkCodepoints: item.missingMarkCodepoints
        });
      }
      if ((item.sourceOutlineFormat === 'CFF' || item.sourceOutlineFormat === 'CFF2') &&
          (!item.outlineSweep || item.outlineSweep.glyphCount <= 0 ||
           item.outlineSweep.outlineGlyphCount + item.outlineSweep.emptyOutlineGlyphCount !== item.outlineSweep.glyphCount)) {
        invalidCoverageFixtures.push({ font: item.fontName, error: 'CFF full-glyph outline sweep is incomplete', outlineSweep: item.outlineSweep });
      }
      if (fixture.variationMode && !item.appliedVariations.length) {
        invalidCoverageFixtures.push({ font: item.fontName, error: 'variation axis was not applied' });
      }
    }
    if (invalidCoverageFixtures.length) {
      throw new Error('Unexpected incomplete Hebrew shaping fixtures: ' + JSON.stringify(invalidCoverageFixtures));
    }
    report.nodeReference.unsupportedFontFixtures = unsupportedFontFixtures;
    report.nodeReference.unsupportedFontCount = unsupportedFontFixtures.length;
    report.nodeReference.normalizedWoff2Fixtures = expected.filter((item) => item.normalizedFrom).map((item) => item.fontName);
    report.nodeReference.normalizedWoff2Count = report.nodeReference.normalizedWoff2Fixtures.length;
    report.limitations = unsupportedFontFixtures.length
      ? ['HarfBuzzJS@' + VERSION + ' did not expose Hebrew cmap coverage for raw WOFF2 assets: ' + unsupportedFontFixtures.join(', ') +
         '. The same files are separately decoded to SFNT by the existing fontTools/Brotli normalization path and shaped successfully as SFNT. The RED build/asset pipeline must supply normalized SFNT bytes to HarfBuzz; raw WOFF2 must not be passed as if HarfBuzz parsed it.']
      : [];
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
    while (Date.now() - started < 100000) {
      const raw = await runAgent(['eval', 'JSON.stringify(window.__hbPoc || {state:"missing"})'], 15000);
      const state = unwrapAgentJson(raw);
      if (state && typeof state === 'object' && state.state !== 'running') {
        browserResult = state;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!browserResult) throw new Error('Timed out waiting for multi-font classic Worker ESM/WASM shaping');
    report.browserWorker = browserResult;
    if (browserResult.state !== 'passed' || browserResult.exactNodeParity !== true ||
        browserResult.classicWorker !== true || browserResult.dynamicImport !== true ||
        browserResult.wasmLoaded !== true || browserResult.fontCount !== shapeFixtures.length) {
      throw new Error('Classic Worker multi-font compatibility proof failed: ' +
        JSON.stringify(browserResult).slice(0, 5000));
    }

    report.result = report.nodeReference.unsupportedFontCount
      ? 'passed_with_raw_woff2_limitations; normalized_sfnt_supported' : 'passed';
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
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
