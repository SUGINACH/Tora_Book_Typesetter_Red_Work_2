#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const REPORT = process.env.BIDI_POC_REPORT || '/tmp/bidi-runtime-poc-report.json';
const AGENT_BROWSER = process.env.AGENT_BROWSER || 'agent-browser';

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
    case '.json': return 'application/json; charset=utf-8';
    case '.wasm': return 'application/wasm';
    default: return 'application/octet-stream';
  }
}

async function main() {
  const wasmPath = process.argv[2];
  if (!wasmPath || !fs.existsSync(wasmPath)) {
    throw new Error('usage: node tools/bidi-runtime-poc/run.js /path/to/red-bidi-runtime-poc.wasm');
  }
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'red-bidi-runtime-poc-'));
  const report = {
    project: 'Tora_Book_Typesetter_Red_Work_2',
    runtime: 'servo/unicode-bidi 0.3.18 UTF-16 API',
    expectedUnicodeVersion: '18.0.0',
    wasmBytes: fs.statSync(wasmPath).size,
    nodeVersion: process.version,
    startedAt: new Date().toISOString()
  };
  let server = null;
  let browserOpened = false;

  try {
    for (const file of ['index.html', 'bidi-api.js', 'bidi-worker.js', 'fixtures.json']) {
      fs.copyFileSync(path.join(__dirname, file), path.join(site, file));
    }
    fs.copyFileSync(wasmPath, path.join(site, 'bidi-runtime.wasm'));

    const api = require('./bidi-api.js');
    const wasmBytes = fs.readFileSync(wasmPath);
    const runtime = await api.instantiate(wasmBytes);
    const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures.json'), 'utf8'));

    const malformedUtf16Probe = { unpairedHighRejected: false, unpairedLowRejected: false };
    try {
      runtime.resolve('\uD800A', 'auto');
    } catch (error) {
      malformedUtf16Probe.unpairedHighRejected = /unpaired high surrogate/.test(error.message);
    }
    try {
      runtime.resolve('\uDC00', 'auto');
    } catch (error) {
      malformedUtf16Probe.unpairedLowRejected = /unpaired low surrogate/.test(error.message);
    }
    if (!malformedUtf16Probe.unpairedHighRejected || !malformedUtf16Probe.unpairedLowRejected) {
      throw new Error('Bidi UTF-16 adapter accepted an unpaired surrogate: ' +
        JSON.stringify(malformedUtf16Probe));
    }

    const utf16ProbeText = 'A😀B';
    const utf16Probe = runtime.resolve(utf16ProbeText, 'ltr');
    if (utf16Probe.utf16Length !== 4 || utf16Probe.levels.length !== 4) {
      throw new Error('UTF-16 probe did not preserve four UTF-16 code units for A😀B');
    }
    const emojiOnlyLine = runtime.lineVisualRuns(utf16ProbeText, 'ltr', 1, 3);
    if (emojiOnlyLine.levels.length !== 2 ||
        emojiOnlyLine.visualRuns.length !== 1 ||
        emojiOnlyLine.visualRuns[0].start !== 1 ||
        emojiOnlyLine.visualRuns[0].end !== 3) {
      throw new Error('UTF-16 emoji-only line range [1,3) was not preserved');
    }
    let surrogateSplitRejected = false;
    try {
      runtime.lineVisualRuns(utf16ProbeText, 'ltr', 2, 3);
    } catch (error) {
      surrogateSplitRejected = /surrogate pair/.test(error.message);
    }
    if (!surrogateSplitRejected) {
      throw new Error('Bidi line API accepted an offset inside the A😀B surrogate pair');
    }

    const autoRtl = runtime.resolve('שלום ABC', 'auto').paragraphs[0];
    const autoLtr = runtime.resolve('ABC שלום', 'auto').paragraphs[0];
    const forcedLtr = runtime.resolve('שלום', 'ltr').paragraphs[0];
    const forcedRtl = runtime.resolve('ABC', 'rtl').paragraphs[0];
    if (autoRtl.level !== 1 || autoLtr.level !== 0 ||
        forcedLtr.level !== 0 || forcedRtl.level !== 1) {
      throw new Error('Bidi paragraph base-direction contract failed: ' + JSON.stringify({
        autoRtl: autoRtl.level, autoLtr: autoLtr.level,
        forcedLtr: forcedLtr.level, forcedRtl: forcedRtl.level
      }));
    }

    const emptyDocument = runtime.resolve('', 'auto');
    const emptyDocumentLine = runtime.lineVisualRuns('', 'auto', 0, 0);
    const emptyLine = runtime.lineVisualRuns(utf16ProbeText, 'ltr', 1, 1);
    if (emptyDocument.utf16Length !== 0 || emptyDocument.levels.length !== 0 ||
        emptyDocument.paragraphs.length !== 0 ||
        emptyDocumentLine.levels.length !== 0 || emptyDocumentLine.visualRuns.length !== 0 ||
        emptyLine.levels.length !== 0 || emptyLine.visualRuns.length !== 0) {
      throw new Error('Empty document/line Bidi contract failed: ' + JSON.stringify({
        emptyDocument, emptyDocumentLine, emptyLine
      }));
    }

    const l1ProbeText = 'אבג ABC   ';
    const l1Probe = runtime.lineVisualRuns(l1ProbeText, 'rtl', 0, l1ProbeText.length);
    const trailingL1Levels = l1Probe.levels.slice(-3);
    if (trailingL1Levels.length !== 3 || trailingL1Levels.some((level) => level !== 1)) {
      throw new Error('UAX #9 L1 did not reset trailing whitespace to paragraph level: ' +
        JSON.stringify(trailingL1Levels));
    }

    const hebrewMarkedText = 'שָׁלוֹם';
    const hebrewMarked = runtime.itemizeScripts(hebrewMarkedText);
    const firstHebrewGrapheme = hebrewMarked.graphemes[0];
    if (!firstHebrewGrapheme || firstHebrewGrapheme.start !== 0 ||
        firstHebrewGrapheme.end < 3 || firstHebrewGrapheme.scalars.length < 2 ||
        firstHebrewGrapheme.script !== 'Hebr') {
      throw new Error('Hebrew niqqud grapheme was not kept intact and assigned to Hebr: ' +
        JSON.stringify(firstHebrewGrapheme));
    }

    const familyEmoji = '👨‍👩‍👧‍👦';
    const familyItemization = runtime.itemizeScripts(familyEmoji);
    const flagItemization = runtime.itemizeScripts('🇮🇱');
    const combiningLatin = runtime.itemizeScripts('e\u0301');
    if (familyItemization.graphemes.length !== 1 ||
        familyItemization.graphemes[0].text !== familyEmoji ||
        flagItemization.graphemes.length !== 1 ||
        flagItemization.graphemes[0].text !== '🇮🇱' ||
        combiningLatin.graphemes.length !== 1 ||
        combiningLatin.graphemes[0].text !== 'e\u0301') {
      throw new Error('Extended grapheme cluster handling failed for ZWJ emoji, flag, or combining mark');
    }

    const mixedScriptText = 'שלום ABC';
    const mixedScriptBidi = runtime.resolve(mixedScriptText, 'auto');
    const mixedScriptItemization = runtime.itemizeScripts(mixedScriptText, mixedScriptBidi);
    const seenScripts = new Set(mixedScriptItemization.scriptRuns.map((run) => run.script));
    if (!seenScripts.has('Hebr') || !seenScripts.has('Latn') ||
        !mixedScriptItemization.scriptRuns.some((run) => run.script === 'Hebr' && run.direction === 'rtl') ||
        !mixedScriptItemization.scriptRuns.some((run) => run.script === 'Latn' && run.direction === 'ltr')) {
      throw new Error('Hebrew/Latin Script and Bidi itemization did not produce separate directional runs: ' +
        JSON.stringify(mixedScriptItemization.scriptRuns));
    }

    const arabicCommaText = 'مرحبا،عالم';
    const arabicCommaItemization = runtime.itemizeScripts(
      arabicCommaText,
      runtime.resolve(arabicCommaText, 'rtl')
    );
    const arabicCommaGrapheme = arabicCommaItemization.graphemes.find((item) => item.text === '،');
    if (!arabicCommaGrapheme || !arabicCommaGrapheme.candidates.includes('Arab') ||
        arabicCommaGrapheme.script !== 'Arab' ||
        arabicCommaGrapheme.status !== 'context-both-sides') {
      throw new Error('Arabic comma Script_Extensions did not resolve to Arab from both neighbors: ' +
        JSON.stringify(arabicCommaGrapheme));
    }

    const badFontBoundary = runtime.validateFontBoundaries(hebrewMarkedText, [
      { start: 0, end: 1, fontId: 'font-a' },
      { start: 1, end: hebrewMarked.utf16Length, fontId: 'font-b' }
    ]);
    const goodFontBoundary = runtime.validateFontBoundaries(hebrewMarkedText, [
      { start: 0, end: firstHebrewGrapheme.end, fontId: 'font-a' },
      { start: firstHebrewGrapheme.end, end: hebrewMarked.utf16Length, fontId: 'font-b' }
    ]);
    if (badFontBoundary.ok ||
        !badFontBoundary.diagnostics.some((item) => item.code === 'font-boundary-splits-grapheme') ||
        !goodFontBoundary.ok) {
      throw new Error('Font-run boundary validation did not reject only the grapheme-splitting range: ' +
        JSON.stringify({ badFontBoundary, goodFontBoundary }));
    }

    const allFixtureItemizationsAreComplete = (items) => items.every((item) => {
      const clusters = item.itemization && item.itemization.graphemes;
      if (!Array.isArray(clusters)) return false;
      let next = 0;
      for (const cluster of clusters) {
        if (cluster.start !== next || cluster.end <= cluster.start ||
            cluster.end > item.utf16Length) return false;
        if (cluster.text !== item.text.slice(cluster.start, cluster.end)) return false;
        if (cluster.scalars[0].start !== cluster.start ||
            cluster.scalars[cluster.scalars.length - 1].end !== cluster.end) return false;
        next = cluster.end;
      }
      return next === item.utf16Length;
    });

    report.itemizerContractProbe = {
      unicodeVersion: hebrewMarked.unicodeVersion,
      hebrewNiqqud: {
        text: hebrewMarkedText,
        firstGrapheme: firstHebrewGrapheme,
        graphemeCount: hebrewMarked.graphemes.length
      },
      extendedGraphemes: {
        familyEmojiCount: familyItemization.graphemes.length,
        flagCount: flagItemization.graphemes.length,
        combiningLatinCount: combiningLatin.graphemes.length
      },
      mixedScriptRuns: mixedScriptItemization.scriptRuns,
      arabicScriptExtensions: arabicCommaGrapheme,
      fontBoundaryProbe: { bad: badFontBoundary, good: goodFontBoundary },
      fixtureItemizationsComplete: allFixtureItemizationsAreComplete(
        runtime.analyzeFixtures(fixtures).fixtures
      )
    };
    report.runtimeContractProbe = {
      unicodeVersion: runtime.unicodeVersion,
      utf16: {
        text: utf16ProbeText,
        utf16Length: utf16Probe.utf16Length,
        levelsLength: utf16Probe.levels.length,
        emojiLineRange: [1, 3],
        emojiLineRun: emojiOnlyLine.visualRuns[0],
        surrogateSplitRejected,
        malformedUtf16Probe,
        emptyDocument: {
          utf16Length: emptyDocument.utf16Length,
          paragraphCount: emptyDocument.paragraphs.length
        },
        emptyDocumentLineRunCount: emptyDocumentLine.visualRuns.length,
        emptyLineWithinDocumentRunCount: emptyLine.visualRuns.length
      },
      paragraphBaseLevels: {
        autoRtl: autoRtl.level,
        autoLtr: autoLtr.level,
        forcedLtr: forcedLtr.level,
        forcedRtl: forcedRtl.level
      },
      lineL1: {
        text: l1ProbeText,
        trailingWhitespaceLevels: trailingL1Levels,
        resetToParagraphLevel: trailingL1Levels.every((level) => level === 1)
      }
    };
    const nodeResult = runtime.analyzeFixtures(fixtures);
    const nodeJson = JSON.stringify(nodeResult);
    report.nodeReference = {
      unicodeVersion: runtime.unicodeVersion,
      fixtureCount: fixtures.length,
      paragraphCount: nodeResult.fixtures.reduce((sum, item) => sum + item.paragraphs.length, 0),
      logicalBidiRunCount: nodeResult.fixtures.reduce((sum, item) =>
        sum + item.paragraphs.reduce((subtotal, para) => subtotal + para.logicalRuns.length, 0), 0),
      lineProbeCount: nodeResult.fixtures.reduce((sum, item) =>
        sum + item.paragraphs.reduce((subtotal, para) => subtotal + para.lines.length, 0), 0),
      outputSha256: crypto.createHash('sha256').update(nodeJson).digest('hex'),
      fixtures: nodeResult.fixtures.map((item) => ({
        id: item.id,
        baseDirection: item.baseDirection,
        utf16Length: item.utf16Length,
        levels: item.levels,
        paragraphs: item.paragraphs
      }))
    };
    if (runtime.unicodeVersion !== report.expectedUnicodeVersion) {
      throw new Error('Bidi Unicode data version is not Unicode 18.0.0: ' + runtime.unicodeVersion);
    }
    report.invariants = {
      levelsMatchUtf16Length: nodeResult.fixtures.every((item) => item.levels.length === item.utf16Length),
      allParagraphRangesAreCovered: nodeResult.fixtures.every((item) =>
        item.paragraphs.every((para) => para.start <= para.end && para.end <= item.utf16Length)),
      allLineVisualRunsCoverSource: nodeResult.fixtures.every((item) =>
        item.paragraphs.every((para) => para.lines.every((line) => {
          const ordered = line.visualRuns.slice().sort((a, b) => a.start - b.start);
          let next = line.lineStart;
          for (const run of ordered) {
            if (run.start !== next) return false;
            next = run.end;
          }
          return next === line.lineEnd;
        }))),
      allRunDirectionsMatchEmbeddingParity: nodeResult.fixtures.every((item) =>
        item.paragraphs.every((para) =>
          para.logicalRuns.every((run) => run.direction === (run.level % 2 ? 'rtl' : 'ltr')) &&
          para.lines.every((line) =>
            line.visualRuns.every((run) => run.direction === (run.level % 2 ? 'rtl' : 'ltr'))))),
      fixtureIdsUnique: new Set(nodeResult.fixtures.map((item) => item.id)).size === fixtures.length,
      autoDirectionChoosesBothParagraphDirections: autoRtl.level === 1 && autoLtr.level === 0,
      forcedDirectionControlsParagraphBase: forcedLtr.level === 0 && forcedRtl.level === 1,
      surrogatePairBoundariesAreEnforced: surrogateSplitRejected,
      malformedSurrogatesAreRejected: malformedUtf16Probe.unpairedHighRejected &&
        malformedUtf16Probe.unpairedLowRejected,
      lineL1ResetsTrailingWhitespace: trailingL1Levels.every((level) => level === 1),
      emptyTextAndLinesAreSupported: emptyDocument.levels.length === 0 &&
        emptyDocument.paragraphs.length === 0 &&
        emptyDocumentLine.visualRuns.length === 0 && emptyLine.visualRuns.length === 0,
      itemizerUsesUnicode18: hebrewMarked.unicodeVersion === '18.0.0',
      hebrewNiqqudStaysInOneGrapheme: firstHebrewGrapheme.scalars.length >= 2 &&
        firstHebrewGrapheme.script === 'Hebr',
      extendedGraphemesRemainWhole: familyItemization.graphemes.length === 1 &&
        flagItemization.graphemes.length === 1 && combiningLatin.graphemes.length === 1,
      mixedScriptAndDirectionAreSeparated: seenScripts.has('Hebr') && seenScripts.has('Latn') &&
        mixedScriptItemization.scriptRuns.some((run) => run.script === 'Hebr' && run.direction === 'rtl') &&
        mixedScriptItemization.scriptRuns.some((run) => run.script === 'Latn' && run.direction === 'ltr'),
      scriptExtensionsResolveFromContext: arabicCommaGrapheme.candidates.includes('Arab') &&
        arabicCommaGrapheme.script === 'Arab' &&
        arabicCommaGrapheme.status === 'context-both-sides',
      fontRunCannotSplitGrapheme: !badFontBoundary.ok &&
        badFontBoundary.diagnostics.some((item) => item.code === 'font-boundary-splits-grapheme') &&
        goodFontBoundary.ok,
      fixtureItemizationsCoverSource: allFixtureItemizationsAreComplete(nodeResult.fixtures)
    };
    if (Object.values(report.invariants).some((passed) => passed !== true)) {
      throw new Error('Bidi UTF-16/run invariants failed: ' + JSON.stringify(report.invariants));
    }

    server = http.createServer((request, response) => {
      const parsed = new URL(request.url, 'http://127.0.0.1');
      const relative = parsed.pathname === '/' ? 'index.html' : decodeURIComponent(parsed.pathname).replace(/^\/+/, '');
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
    while (Date.now() - started < 90000) {
      const raw = await runAgent(['eval', 'JSON.stringify(window.__bidiPoc || {state:"missing"})'], 15000);
      const state = unwrapAgentJson(raw);
      if (state && typeof state === 'object' && state.state !== 'running') {
        browserResult = state;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    if (!browserResult) throw new Error('Timed out waiting for classic Worker Bidi WASM conformance fixtures');
    report.browserWorker = {
      state: browserResult.state,
      unicodeVersion: browserResult.unicodeVersion,
      error: browserResult.error || null
    };
    if (browserResult.state !== 'passed' || !browserResult.report) {
      throw new Error('Browser classic Worker Bidi execution failed: ' + JSON.stringify(browserResult).slice(0, 5000));
    }
    const browserJson = JSON.stringify(browserResult.report);
    report.browserWorker.outputSha256 = crypto.createHash('sha256').update(browserJson).digest('hex');
    report.exactNodeParity = browserJson === nodeJson;
    if (!report.exactNodeParity) {
      throw new Error('Node/classic Worker Bidi output differs: ' + JSON.stringify({
        nodeSha256: report.nodeReference.outputSha256,
        workerSha256: report.browserWorker.outputSha256
      }));
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
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(site, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error && error.stack || error);
  process.exitCode = 1;
});
