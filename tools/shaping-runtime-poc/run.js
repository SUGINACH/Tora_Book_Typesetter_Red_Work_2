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
const BIDI_WASM_PATH = process.env.BIDI_POC_WASM || '';
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
  if (!BIDI_WASM_PATH || !fs.existsSync(BIDI_WASM_PATH)) throw new Error('BIDI_POC_WASM must point to the pinned Unicode 18 itemizer WASM');
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
    // Export exact runtime assets separately; this does not enable production shaping.
    const runtimeDir = process.env.HB_POC_RUNTIME_DIR || '/tmp/shaping-runtime-poc-runtime';
    fs.rmSync(runtimeDir, { recursive: true, force: true });
    fs.mkdirSync(runtimeDir, { recursive: true });
    const stagedRuntimeFiles = [];
    const stageRuntimeFile = (source, relative) => {
      const target = path.join(runtimeDir, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
      const bytes = fs.readFileSync(target);
      stagedRuntimeFiles.push({ path: relative.split(path.sep).join('/'), bytes: bytes.length,
        sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
    };
    const harfbuzzPackageJson = JSON.parse(fs.readFileSync(path.join(temp, 'package', 'package.json'), 'utf8'));
    if (harfbuzzPackageJson.name !== 'harfbuzzjs' || harfbuzzPackageJson.version !== VERSION) {
      throw new Error('Unexpected extracted HarfBuzz package identity');
    }
    for (const file of ['index.mjs', 'harfbuzz.js', 'harfbuzz.wasm']) {
      stageRuntimeFile(path.join(dist, file), path.join('harfbuzzjs', 'dist', file));
    }
    stageRuntimeFile(path.join(temp, 'package', 'package.json'), path.join('harfbuzzjs', 'package.json'));
    const licenseCandidate = ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'COPYING'].find((name) =>
      fs.existsSync(path.join(temp, 'package', name)));
    if (licenseCandidate) stageRuntimeFile(path.join(temp, 'package', licenseCandidate), path.join('harfbuzzjs', licenseCandidate));
    stageRuntimeFile(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'unicode18-bidi-runtime.js'), 'unicode18-bidi-runtime.js');
    stageRuntimeFile(BIDI_WASM_PATH, 'unicode18-bidi-runtime.wasm');
    const runtimeReadme = [
      '# RED shaping runtime assets', '',
      'Hash-locked assets exported by the Node/classic-Worker compatibility build.',
      'This staged artifact does not activate shaping in the RED production engine.', '',
      '- HarfBuzzJS package: harfbuzzjs@' + VERSION + '; pinned dist files only.',
      '- Unicode itemizer: Unicode 18.0.0 from servo/unicode-bidi revision 9a8c7b03be01def5cf7014b89d5af90f7382fdad.',
      '- No fonts are included. Production FontResolver must supply bytes and verify full source hashes.',
      '- Raw WOFF2 shaping remains unsupported; normalize to SFNT first.',
      '- Tight ink bounds are not included; control bounds must not be presented as ink bounds.',
      '- Current analytic outline proof covers cubic CFF M/L/C/Z; quadratic outlines remain unproven.', ''
    ].join('\\n');
    fs.writeFileSync(path.join(runtimeDir, 'README.md'), runtimeReadme, 'utf8');
    const runtimeManifest = {
      schemaVersion: 1, artifactKind: 'staged-runtime-assets-not-production-enabled',
      harfbuzz: { package: harfbuzzPackageJson.name, version: harfbuzzPackageJson.version,
        license: harfbuzzPackageJson.license || null, packageEngines: harfbuzzPackageJson.engines || null },
      unicode: { version: '18.0.0', upstream: 'servo/unicode-bidi',
        revision: '9a8c7b03be01def5cf7014b89d5af90f7382fdad',
        runtimeModule: 'unicode18-bidi-runtime.js', wasmModule: 'unicode18-bidi-runtime.wasm' },
      files: stagedRuntimeFiles.sort((a, b) => a.path.localeCompare(b.path))
    };
    fs.writeFileSync(path.join(runtimeDir, 'manifest.json'), JSON.stringify(runtimeManifest, null, 2) + '\\n', 'utf8');
    report.stagedRuntimeAssets = { status: 'passed', fileCount: stagedRuntimeFiles.length, files: runtimeManifest.files };

    for (const file of ['index.html', 'classic-worker.js', 'shape-core.js']) {
      fs.copyFileSync(path.join(__dirname, file), path.join(site, file));
    }
    fs.copyFileSync(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'unicode18-bidi-runtime.js'), path.join(site, 'bidi-api.js'));
    fs.copyFileSync(BIDI_WASM_PATH, path.join(site, 'bidi-runtime.wasm'));

    const hbUrl = pathToFileURL(path.join(site, 'harfbuzzjs', 'dist', 'index.mjs')).href;
    const hb = await import(hbUrl);
    const shapeCore = require('./shape-core.js');
    const bidiApi = require(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'unicode18-bidi-runtime.js'));
    const bidiRuntime = await bidiApi.instantiate(fs.readFileSync(BIDI_WASM_PATH));
    if (bidiRuntime.unicodeVersion !== '18.0.0') throw new Error('Expected Unicode 18 itemizer; got ' + bidiRuntime.unicodeVersion);
    const sharedSourceText = String.fromCodePoint(
      0x05E9, 0x05B8, 0x05C1, 0x05DC, 0x05D5, 0x05B9, 0x05DD,
      0x202B, 0x05D2, 0x05D3, 0x202C, 0x05D4, 0x05D5
    );
    const sharedItemizationResult = bidiRuntime.itemizeScripts(sharedSourceText, bidiRuntime.resolve(sharedSourceText, 'rtl'));
    const sharedExpectedRuns = [
      { start: 0, end: 7, text: String.fromCodePoint(0x05E9, 0x05B8, 0x05C1, 0x05DC, 0x05D5, 0x05B9, 0x05DD), level: 1 },
      { start: 8, end: 10, text: String.fromCodePoint(0x05D2, 0x05D3), level: 3 },
      { start: 11, end: 13, text: String.fromCodePoint(0x05D4, 0x05D5), level: 1 }
    ];
    const actualRuns = sharedItemizationResult.scriptRuns.map((x) => ({ start: x.start, end: x.end, text: x.text, level: x.bidiLevel }));
    const controlRuns = sharedItemizationResult.nonShapingRuns.filter((x) => x.kind === 'bidi-control');
    if (JSON.stringify(actualRuns) !== JSON.stringify(sharedExpectedRuns) || controlRuns.length !== 2 ||
        controlRuns.map((x) => x.text).join('') !== String.fromCodePoint(0x202B, 0x202C) ||
        sharedItemizationResult.sourceRuns.length < 5) {
      throw new Error('Unexpected Unicode 18 itemization: ' + JSON.stringify({
        scriptRuns: actualRuns, controlRuns, sourceRuns: sharedItemizationResult.sourceRuns
      }));
    }
    const sharedItemizationConfig = {
      sourceText: sharedSourceText,
      baseDirection: 'rtl',
      languageByScript: { Hebr: 'he' },
      featureTagsByScript: { Hebr: shapeCore.FEATURE_TAGS.slice() }
    };
    const sharedItemization = {
      sourceText: sharedSourceText, itemization: sharedItemizationResult,
      languageByScript: sharedItemizationConfig.languageByScript,
      featureTagsByScript: sharedItemizationConfig.featureTagsByScript
    };
    fs.writeFileSync(path.join(site, 'shared-itemization-input.json'), JSON.stringify(sharedItemizationConfig), 'utf8');
    report.sharedItemizationInput = {
      unicodeVersion: bidiRuntime.unicodeVersion, sourceText: sharedSourceText,
      utf16Length: sharedSourceText.length, sourceRuns: sharedItemizationResult.sourceRuns,
      scriptRuns: sharedItemizationResult.scriptRuns,
      nonShapingRuns: sharedItemizationResult.nonShapingRuns,
      expectedBidiLevels: [1, 3, 1],
      languageByScript: sharedItemizationConfig.languageByScript,
      featureTagsByScript: sharedItemizationConfig.featureTagsByScript
    };
    const pathBoundsUnitCases = [
      { path: 'M0 0 C0 100 100 100 100 0', expected: { xMin: 0, yMin: 0, xMax: 100, yMax: 75 } },
      { path: 'M0 0 C100 0 100 100 0 100', expected: { xMin: 0, yMin: 0, xMax: 75, yMax: 100 } },
      { path: 'm0 0 c0 100 100 100 100 0', expected: { xMin: 0, yMin: 0, xMax: 100, yMax: 75 } },
      { path: 'M1 2 L11 2 L11 12 Z', expected: { xMin: 1, yMin: 2, xMax: 11, yMax: 12 } },
      { path: 'M5 5 Z', expected: { xMin: 5, yMin: 5, xMax: 5, yMax: 5 } },
      { path: 'M0 0 C0 0 0 0 0 0', expected: { xMin: 0, yMin: 0, xMax: 0, yMax: 0 } },
      { path: 'M10 -2.5 C10 20 30 20 30 -2.5 M40 0 L45 5', expected: { xMin: 10, yMin: -2.5, xMax: 45, yMax: 14.375 } }
    ];
    for (const testCase of pathBoundsUnitCases) {
      const actual = shapeCore.pathBoundsFromSvgPath(testCase.path);
      for (const key of ['xMin', 'yMin', 'xMax', 'yMax']) {
        if (!actual || Math.abs(actual[key] - testCase.expected[key]) > 1e-10) {
          throw new Error('Analytic SVG path-bounds unit test failed: ' +
            JSON.stringify({ testCase, actual }));
        }
      }
    }
    let unsupportedSvgCommandRejected = false;
    try {
      shapeCore.pathBoundsFromSvgPath('M0 0 Q10 20 20 0');
    } catch (error) {
      unsupportedSvgCommandRejected = /Unsupported SVG path command/.test(error.message);
    }
    if (!unsupportedSvgCommandRejected) {
      throw new Error('Analytic SVG path bounds did not reject unsupported quadratic command');
    }
    report.svgPathBoundsUnitTests = {
      passed: pathBoundsUnitCases.length,
      unsupportedQuadraticCommandRejected: unsupportedSvgCommandRejected,
      algorithm: 'analytic-cubic-bezier-extrema-v1'
    };
    const expected = [];
    for (const fixture of shapeFixtures) {
      const bytes = fs.readFileSync(fixture.source);
      const fontArrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      expected.push(shapeCore.shapeWithHarfBuzz(hb, fontArrayBuffer, Object.assign({}, fixture, { sharedItemization })));
    }
    const sharedItemizationProbeFontCount = expected.filter((x) => x.sharedItemizationProbe && x.sharedItemizationProbe.status === 'passed').length;
    const sharedItemizationProbeFailures = expected.filter((x) => x.coverageStatus === 'complete' && (
      !x.sharedItemizationProbe || x.sharedItemizationProbe.status !== 'passed' ||
      x.sharedItemizationProbe.shapedRunCount !== 3 || x.sharedItemizationProbe.nonShapingRunCount !== 2 ||
      x.sharedItemizationProbe.bidiControlRunCount !== 2 ||
      JSON.stringify(x.sharedItemizationProbe.bidiLevels) !== JSON.stringify([1, 3, 1]) ||
      x.sharedItemizationProbe.controlsExcludedFromShaping !== true ||
      x.sharedItemizationProbe.everyOutputClusterIsAnEngineGraphemeStart !== true ||
      x.sharedItemizationProbe.everyScriptRunHasFullSourceCoverage !== true
    ));
    if (!sharedItemizationProbeFontCount || sharedItemizationProbeFailures.length) {
      throw new Error('ICU4X-to-HarfBuzz shaping contract failed: ' + JSON.stringify({
        passedFontCount: sharedItemizationProbeFontCount,
        failures: sharedItemizationProbeFailures.map((x) => ({ fontName: x.fontName, probe: x.sharedItemizationProbe }))
      }));
    }
    // Exercise the production FontResolver -> TextItemShapingPlan ->
    // HarfBuzzShaper -> immutable ShapedRun chain with an actual RED font file.
    // Compare its GIDs and positions with the already-passing direct POC path.
    const productionFontName = 'DavidLibre-Regular.ttf';
    const productionFontPath = path.join(FONT_DIR, productionFontName);
    const productionFontBytes = new Uint8Array(fs.readFileSync(productionFontPath));
    const fontResolver = require(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'font-resolver'));
    const { createTextItemShapingPlan } = require(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'text-item-shaping-plan'));
    const { createHarfBuzzShaper } = require(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'harfbuzz-shaper'));
    const { isShapedRun } = require(path.join(REPO_ROOT, 'red-build', 'src', 'engine', 'typography', 'shaped-run'));
    fontResolver.clearFontResolver();
    const productionRegistration = fontResolver.registerFont(
      'David Libre', productionFontBytes, { source: 'shaping-runtime-production-adapter-proof' }
    );
    if (!productionRegistration.ok) {
      throw new Error('Production FontResolver rejected ' + productionFontName + ': ' +
        JSON.stringify(productionRegistration));
    }
    const productionFontRecord = productionRegistration.record;
    const productionFontFace = new hb.Face(new hb.Blob(productionFontBytes), 0);
    const productionVariationAxes = Object.entries(productionFontFace.getAxisInfos())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, info]) => ({ tag, value: Number(info.default) }));
    const productionSourceStart = 100;
    const productionTextItem = {
      id: 'production-shaper-proof-item',
      kind: 'text',
      sourceRange: {
        coordinateSpace: 'document-utf16',
        start: productionSourceStart,
        end: productionSourceStart + sharedSourceText.length,
        docId: 'shaping-runtime-proof',
        blockId: 'mixed-level-hebrew-paragraph'
      },
      payload: {
        text: sharedSourceText,
        runs: [{
          text: sharedSourceText,
          sourceStart: 0,
          sourceEnd: sharedSourceText.length,
          fontFamily: 'David Libre'
        }]
      }
    };
    const productionPlan = createTextItemShapingPlan(productionTextItem, {
      bidiRuntime,
      fontResolver,
      direction: 'rtl',
      defaultFamily: 'David Libre',
      languageByScript: { Hebr: 'he' },
      featuresByScript: {
        Hebr: shapeCore.FEATURE_TAGS.map((tag) => ({ tag, value: 1 }))
      },
      variationAxesByFontId: {
        [productionRegistration.fontId]: productionVariationAxes
      },
      faceIndexByFontId: { [productionRegistration.fontId]: 0 }
    });
    const productionShaper = createHarfBuzzShaper({
      hb,
      fontResolver,
      engineVersion: '15.0.0'
    });
    const productionShapedItem = productionShaper.shapeTextItemPlan(productionPlan);
    const productionReference = expected.find((item) => item.fontName === productionFontName);
    if (!productionReference || !productionReference.sharedItemizationProbe ||
        productionReference.sharedItemizationProbe.status !== 'passed') {
      throw new Error('No direct HarfBuzz reference result exists for ' + productionFontName);
    }
    const referenceRuns = productionReference.sharedItemizationProbe.shapedRuns;
    const shapedRuns = productionShapedItem.shapedRuns;
    const signature = (glyphs, clusterBase) => glyphs.map((glyph) => [
      glyph.gid,
      glyph.cluster - clusterBase,
      glyph.xAdvance,
      glyph.yAdvance,
      glyph.xOffset,
      glyph.yOffset
    ]);
    const productionRunComparisons = shapedRuns.map((run, index) => {
      const referenceRun = referenceRuns[index];
      const actualGlyphs = signature(run.glyphs, productionSourceStart);
      const referenceGlyphs = signature(referenceRun.glyphs, 0);
      return {
        index,
        sourceRange: [run.sourceRange.start, run.sourceRange.end],
        bidiLevel: run.shaping.bidiLevel,
        glyphCount: run.glyphs.length,
        exactGidClusterPositionParity: JSON.stringify(actualGlyphs) === JSON.stringify(referenceGlyphs),
        actual: actualGlyphs,
        reference: referenceGlyphs
      };
    });
    const productionShaperFailures = [];
    if (productionShapedItem.kind !== 'ShapedTextItem' ||
        productionShapedItem.shapedRuns.length !== 3 ||
        productionShapedItem.nonShapingRuns.filter((run) => run.kind === 'bidi-control').length !== 2 ||
        JSON.stringify(shapedRuns.map((run) => run.shaping.bidiLevel)) !== JSON.stringify([1, 3, 1]) ||
        shapedRuns.some((run) => !isShapedRun(run)) ||
        productionRunComparisons.some((item) => !item.exactGidClusterPositionParity)) {
      productionShaperFailures.push({
        kind: productionShapedItem.kind,
        shapedRunCount: shapedRuns.length,
        nonShapingRuns: productionShapedItem.nonShapingRuns,
        bidiLevels: shapedRuns.map((run) => run.shaping.bidiLevel),
        comparisons: productionRunComparisons
      });
    }
    if (productionShaperFailures.length) {
      throw new Error('Production HarfBuzzShaper does not match the proven direct HarfBuzz path: ' +
        JSON.stringify(productionShaperFailures).slice(0, 5000));
    }
    report.productionShaperProof = {
      status: 'passed',
      fontName: productionFontName,
      fontId: productionRegistration.fontId,
      sourceHash: productionFontRecord.sourceHash,
      unitsPerEm: productionFontRecord.unitsPerEm,
      variationAxes: productionVariationAxes,
      unicodeVersion: productionPlan.unicodeVersion,
      sourceRange: [productionSourceStart, productionSourceStart + sharedSourceText.length],
      shapedRuns: shapedRuns.map((run) => ({
        id: run.id,
        sourceRange: [run.sourceRange.start, run.sourceRange.end],
        script: run.shaping.script,
        language: run.shaping.language,
        direction: run.shaping.direction,
        bidiLevel: run.shaping.bidiLevel,
        bot: run.shaping.bot,
        eot: run.shaping.eot,
        glyphCount: run.glyphs.length,
        advance: run.advance,
        clusters: run.glyphs.map((glyph) => glyph.cluster),
        allInkBoundsExplicitlyUnknown: run.glyphs.every((glyph) => glyph.inkBounds === null)
      })),
      nonShapingRuns: productionShapedItem.nonShapingRuns,
      diagnostics: productionShapedItem.diagnostics,
      directPocParity: productionRunComparisons.map((item) => ({
        runIndex: item.index,
        bidiLevel: item.bidiLevel,
        glyphCount: item.glyphCount,
        exactGidClusterPositionParity: item.exactGidClusterPositionParity
      })),
      fontResolverSourceHashVerified: productionRegistration.record.sourceHash === productionPlan.scriptRuns[0].font.sourceHash,
      complete: true
    };
    fontResolver.clearFontResolver();

    const utf16ClusterProbe = expected.find((item) => item.utf16ClusterProbe)?.utf16ClusterProbe || null;
    if (!utf16ClusterProbe ||
        utf16ClusterProbe.clustersUseUtf16CodeUnitOffsets !== true ||
        utf16ClusterProbe.utf16Length !== 4 ||
        utf16ClusterProbe.unicodeScalarCount !== 3 ||
        JSON.stringify(utf16ClusterProbe.actualClusters) !== JSON.stringify([0, 1, 3]) ||
        JSON.stringify(utf16ClusterProbe.actualSourceRanges) !== JSON.stringify([
          { start: 37, end: 38 }, { start: 38, end: 40 }, { start: 40, end: 41 }
        ])) {
      throw new Error('UTF-16 source-cluster proof failed: ' + JSON.stringify(utf16ClusterProbe));
    }
    const clusterCases = expected.flatMap((item) =>
      item.cases.map((testCase) => ({ fontName: item.fontName, ...testCase }))
    );
    const invalidClusterSourceRanges = clusterCases.flatMap((testCase) =>
      testCase.glyphs.filter((glyph) =>
        !glyph.sourceRange ||
        !Number.isSafeInteger(glyph.sourceRange.start) ||
        !Number.isSafeInteger(glyph.sourceRange.end) ||
        glyph.sourceRange.start < 0 ||
        glyph.sourceRange.end <= glyph.sourceRange.start ||
        glyph.sourceRange.end > testCase.clusterAudit.sourceEnd
      ).map((glyph) => ({ fontName: testCase.fontName, text: testCase.text, gid: glyph.gid, cluster: glyph.cluster, sourceRange: glyph.sourceRange }))
    );
    const rtlClusterOrderFailures = clusterCases.filter((testCase) =>
      testCase.direction !== 'rtl' || testCase.clusterAudit.clusterOrderMonotone !== true
    );
    const incompleteClusterCoverage = clusterCases.filter((testCase) =>
      testCase.clusterAudit.coversFullSource !== true ||
      testCase.clusterAudit.uncoveredPrefixLength !== 0 ||
      testCase.glyphs.some((glyph) => glyph.sourceRange.start < testCase.clusterAudit.sourceStart ||
        glyph.sourceRange.end > testCase.clusterAudit.sourceEnd)
    );
    const clusterSourceRangeAudit = {
      caseCount: clusterCases.length,
      glyphCount: clusterCases.reduce((sum, item) => sum + item.glyphs.length, 0),
      rtlCases: clusterCases.filter((item) => item.direction === 'rtl').length,
      rtlMonotoneCases: clusterCases.filter((item) => item.clusterAudit.clusterOrderMonotone).length,
      uniqueClusterCount: clusterCases.reduce((sum, item) => sum + item.clusterAudit.uniqueClusterCount, 0),
      multiGlyphClusterGroups: clusterCases.reduce((sum, item) => sum + item.clusterAudit.multiGlyphClusterCount, 0),
      repeatedClusterGlyphCount: clusterCases.reduce((sum, item) => sum + item.clusterAudit.repeatedClusterGlyphCount, 0),
      invalidSourceRanges: invalidClusterSourceRanges.length,
      rtlClusterOrderFailures: rtlClusterOrderFailures.length,
      incompleteSourceCoverageCases: incompleteClusterCoverage.length,
      sourceRangeUnit: 'absolute-utf16-code-unit-offsets'
    };
    if (invalidClusterSourceRanges.length || rtlClusterOrderFailures.length || incompleteClusterCoverage.length ||
        clusterSourceRangeAudit.multiGlyphClusterGroups === 0) {
      throw new Error('Shaped cluster-to-source-range contract failed: ' + JSON.stringify({
        audit: clusterSourceRangeAudit,
        invalidRanges: invalidClusterSourceRanges.slice(0, 8),
        rtlOrderFailures: rtlClusterOrderFailures.slice(0, 8).map((x) => ({ fontName: x.fontName, text: x.text, clusters: x.glyphs.map((g) => g.cluster) })),
        incompleteCoverage: incompleteClusterCoverage.slice(0, 8).map((x) => ({ fontName: x.fontName, text: x.text, audit: x.clusterAudit }))
      }));
    }
    const shapedGlyphs = expected.flatMap((item) =>
      item.cases.flatMap((testCase) => testCase.glyphs)
    );
    const outlinedGlyphs = shapedGlyphs.filter((glyph) => glyph.outline.length > 0);
    const glyphsMissingInkExtents = outlinedGlyphs.filter((glyph) => !glyph.glyphExtents);
    const invalidGlyphExtents = shapedGlyphs.filter((glyph) =>
      glyph.glyphExtents && Object.values(glyph.glyphExtents).some((value) => !Number.isFinite(value))
    );
    if (glyphsMissingInkExtents.length || invalidGlyphExtents.length) {
      throw new Error('HarfBuzz glyph-extents contract failed: ' + JSON.stringify({
        shapedGlyphCount: shapedGlyphs.length,
        outlinedGlyphCount: outlinedGlyphs.length,
        missingInkExtents: glyphsMissingInkExtents.length,
        invalidExtents: invalidGlyphExtents.length
      }));
    }
    report.utf16ClusterProbe = utf16ClusterProbe;
    report.clusterSourceRangeAudit = clusterSourceRangeAudit;
    report.glyphExtentsAudit = {
      unit: 'font-units',
      shapedGlyphCount: shapedGlyphs.length,
      outlinedGlyphCount: outlinedGlyphs.length,
      glyphsWithExtents: shapedGlyphs.filter((glyph) => glyph.glyphExtents).length,
      glyphsWithoutExtents: shapedGlyphs.filter((glyph) => !glyph.glyphExtents).length,
      outlinedGlyphsMissingExtents: glyphsMissingInkExtents.length,
      invalidExtents: invalidGlyphExtents.length
    };
    const cffOutlineInputs = expected.filter((item) => item.outlineSweep && item.outlineSweep.outlinePaths)
      .map((item) => {
        const normalizedFixture = shapeFixtures.find((candidate) => candidate.name === item.fontName);
        if (!normalizedFixture) throw new Error('No normalized SFNT for CFF outline reference: ' + item.fontName);
        const sourceFixture = normalizedFixture.normalizedFrom
          ? shapeFixtures.find((candidate) =>
              candidate.name === normalizedFixture.normalizedFrom && candidate.format === 'woff2')
          : normalizedFixture;
        if (!sourceFixture) {
          throw new Error('No original font source for normalized CFF fixture: ' +
            normalizedFixture.name + ' <- ' + normalizedFixture.normalizedFrom);
        }
        return {
          fontName: item.fontName,
          sourceFontName: sourceFixture.name,
          sourceFontPath: sourceFixture.source,
          normalizedFontName: normalizedFixture.name,
          normalizedFontPath: normalizedFixture.source,
          glyphPaths: item.outlineSweep.outlinePaths
        };
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
      font.sourceReference !== 'original-source-font' ||
      font.sourceGlyphOrderMatchesNormalized !== true ||
      font.sourceOutlineFormat !== font.normalizedOutlineFormat ||
      font.sourceGlyphCount !== font.normalizedGlyphCount ||
      font.unitsPerEmMatches !== true ||
      font.operationSequenceMismatches !== 0 ||
      font.coordinateMismatches !== 0 ||
      font.coordinateMatchesWithinTolerance !== font.glyphCount ||
      font.emptySourceOutlines !== font.emptyHarfBuzzOutlines ||
      font.emptyOutlineAgreements !== font.emptySourceOutlines ||
      font.maxCoordinateDeltaFontUnits > 1e-5 ||
      font.glyphExtentsControlBoundMismatches !== 0 ||
      font.glyphExtentsMissingHarfBuzz !== 0 ||
      font.glyphExtentsControlBoundMatches !== font.glyphCount ||
      font.maxGlyphExtentsControlBoundDeltaFontUnits > 1e-5 ||
      font.svgPathBoundsMismatches !== 0 ||
      font.svgPathBoundsMissing !== 0 ||
      font.svgPathBoundsMatches !== font.glyphCount ||
      font.maxSvgPathBoundsDeltaFontUnits > 1e-5
    );
    if (invalidCffComparisons.length ||
        cffComparison.coordinateMismatches !== 0 ||
        cffComparison.coordinateMatchesWithinTolerance !== cffComparison.glyphCount ||
        cffComparison.glyphExtentsControlBoundMismatches !== 0 ||
        cffComparison.glyphExtentsMissingHarfBuzz !== 0 ||
        cffComparison.glyphExtentsControlBoundMatches !== cffComparison.glyphCount ||
        cffComparison.svgPathBoundsMismatches !== 0 ||
        cffComparison.svgPathBoundsMissing !== 0 ||
        cffComparison.svgPathBoundsMatches !== cffComparison.glyphCount ||
        cffComparison.maxSvgPathBoundsDeltaFontUnits > 1e-5) {
      throw new Error('CFF outlines do not match fontTools source geometry: ' +
        JSON.stringify({
          summary: {
            glyphCount: cffComparison.glyphCount,
            coordinateMatchesWithinTolerance: cffComparison.coordinateMatchesWithinTolerance,
            coordinateMismatches: cffComparison.coordinateMismatches,
            operationSequenceMismatches: cffComparison.operationSequenceMismatches,
            glyphExtentsCurveBoundMatches: cffComparison.glyphExtentsCurveBoundMatches,
            glyphExtentsCurveBoundDisagreements: cffComparison.glyphExtentsCurveBoundDisagreements,
            glyphExtentsControlBoundMatches: cffComparison.glyphExtentsControlBoundMatches,
            glyphExtentsControlBoundMismatches: cffComparison.glyphExtentsControlBoundMismatches,
            maxGlyphExtentsCurveBoundDeltaFontUnits: cffComparison.maxGlyphExtentsCurveBoundDeltaFontUnits,
            maxGlyphExtentsControlBoundDeltaFontUnits: cffComparison.maxGlyphExtentsControlBoundDeltaFontUnits,
            svgPathBoundsMatches: cffComparison.svgPathBoundsMatches,
            svgPathBoundsMismatches: cffComparison.svgPathBoundsMismatches,
            svgPathBoundsMissing: cffComparison.svgPathBoundsMissing,
            maxSvgPathBoundsDeltaFontUnits: cffComparison.maxSvgPathBoundsDeltaFontUnits
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
        utf16ClusterProbe: item.utf16ClusterProbe,
        explicitClusterProbe: item.explicitClusterProbe
          ? {
            sourceRange: item.explicitClusterProbe.sourceRange,
            inputGraphemeStarts: item.explicitClusterProbe.inputGraphemeStarts,
            inputCodepointClusters: item.explicitClusterProbe.inputCodepointClusters,
            outputClusters: item.explicitClusterProbe.outputClusters,
            allOutputClustersAreInputGraphemeStarts: item.explicitClusterProbe.allOutputClustersAreInputGraphemeStarts,
            clusterAudit: item.explicitClusterProbe.clusterAudit,
            glyphs: item.explicitClusterProbe.glyphs.map((glyph) => ({
              gid: glyph.gid, cluster: glyph.cluster, sourceRange: glyph.sourceRange,
              xAdvance: glyph.xAdvance, yAdvance: glyph.yAdvance,
              xOffset: glyph.xOffset, yOffset: glyph.yOffset
            }))
          } : null,
        glyphExtentsCount: item.cases.reduce((count, testCase) =>
          count + testCase.glyphs.filter((glyph) => glyph.glyphExtents).length, 0),
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
        clusters: item.cases.map((testCase) => testCase.glyphs.map((glyph) => glyph.cluster)),
        sourceRanges: item.cases.map((testCase) => testCase.glyphs.map((glyph) => glyph.sourceRange)),
        clusterAudits: item.cases.map((testCase) => testCase.clusterAudit)
      }))
    };
    const invalidExplicitClusterFixtures = expected.filter((item) =>
      item.coverageStatus === 'complete' && (
        !item.explicitClusterProbe ||
        item.explicitClusterProbe.allOutputClustersAreInputGraphemeStarts !== true ||
        item.explicitClusterProbe.clusterAudit.coversFullSource !== true ||
        item.explicitClusterProbe.inputGraphemeStarts.join(',') !== '37,40,41,43' ||
        item.explicitClusterProbe.inputCodepointClusters.join(',') !== '37,37,37,40,41,41,43'
      )
    );
    if (invalidExplicitClusterFixtures.length) {
      throw new Error('HarfBuzz did not preserve engine-supplied grapheme clusters: ' +
        JSON.stringify(invalidExplicitClusterFixtures.map((item) => ({
          fontName: item.fontName, explicitClusterProbe: item.explicitClusterProbe
        }))));
    }
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
    report.nodeReference.explicitClusterProbeFontCount = expected.filter((item) => item.explicitClusterProbe).length;
    report.nodeReference.sharedItemizationProbeFontCount = sharedItemizationProbeFontCount;
    report.nodeReference.sharedItemizationProbePassed = true;
    report.nodeReference.explicitClusterProbePassed = invalidExplicitClusterFixtures.length === 0;
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
        browserResult.wasmLoaded !== true || browserResult.bidiWasmLoaded !== true || browserResult.bidiUnicodeVersion !== '18.0.0' || browserResult.sharedItemizationProbeFontCount !== sharedItemizationProbeFontCount || browserResult.sharedItemizationProbePassed !== true || browserResult.fontCount !== shapeFixtures.length) {
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
