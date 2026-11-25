// red-build/tests/unit/production-typography-runtime.test.js
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { describe, it, assert, assertEq, report } = require('../harness');
const {
  loadProductionTypographyRuntime,
  EXPECTED_FILES
} = require('../../src/engine/typography/production-typography-runtime');
const { buildDocumentModel } = require('../../src/engine/model/document-model');
const { createTextItemShapingPlan } = require('../../src/engine/typography/text-item-shaping-plan');
const { isShapedRun } = require('../../src/engine/typography/shaped-run');
const fontResolver = require('../../src/engine/typography/font-resolver');

const RED_BUILD = path.join(__dirname, '..', '..');
const ASSET_ROOT = path.join(RED_BUILD, 'ui', 'assets', 'shaping-runtime');
const BASE_URL = 'https://red-runtime.test/ui/assets/shaping-runtime/';

function assetBytes(relativePath) {
  return fs.readFileSync(path.join(ASSET_ROOT, relativePath));
}

function createFetch(overrides = {}) {
  const requests = [];
  const fetchImpl = async (url, requestOptions) => {
    requests.push({ url: String(url), requestOptions });
    const parsed = new URL(String(url));
    const marker = '/ui/assets/shaping-runtime/';
    const index = parsed.pathname.indexOf(marker);
    if (index < 0) return { ok: false, status: 404 };
    const relativePath = decodeURIComponent(parsed.pathname.slice(index + marker.length));
    let bytes = overrides[relativePath] || assetBytes(relativePath);
    if (typeof bytes === 'function') bytes = bytes();
    const data = Buffer.from(bytes);
    return {
      ok: true,
      status: 200,
      arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
    };
  };
  return { fetchImpl, requests };
}

function createImportModule(counter) {
  return async (specifier) => {
    counter.count++;
    assert(specifier === BASE_URL + 'harfbuzzjs/dist/index.mjs', 'only the pinned local HarfBuzz entry may be imported');
    const localPath = path.join(ASSET_ROOT, 'harfbuzzjs', 'dist', 'index.mjs');
    return import(pathToFileURL(localPath).href);
  };
}

describe('Production typography runtime — pinned local assets', () => {
  it('loads and verifies the exact HarfBuzz 15 + Unicode 18 assets and itemizes full UTF-16 source', async () => {
    const fetchState = createFetch();
    const importState = { count: 0 };
    const runtime = await loadProductionTypographyRuntime({
      baseUrl: BASE_URL,
      fetchImpl: fetchState.fetchImpl,
      importModule: createImportModule(importState)
    });
    assertEq(runtime.harfbuzz.versionString(), '15.0.0');
    assertEq(runtime.unicode.unicodeVersion, '18.0.0');
    assertEq(Object.keys(runtime.assetDigests).sort(), Object.keys(EXPECTED_FILES).sort());
    assertEq(importState.count, 1);
    assertEq(fetchState.requests.length, Object.keys(EXPECTED_FILES).length + 1,
      'manifest plus every pinned runtime file is fetched and verified');
    assert(fetchState.requests.every((entry) =>
      entry.requestOptions.credentials === 'same-origin' && entry.requestOptions.cache === 'force-cache'),
    'runtime fetches are same-origin and cacheable');

    const source = 'שָׁלוֹם';
    const itemized = runtime.itemize(source, 'rtl');
    assertEq(itemized.itemization.text, source);
    assertEq(itemized.itemization.utf16Length, source.length);
    assert(itemized.itemization.graphemes.every((grapheme) =>
      Array.isArray(grapheme.scalars) && grapheme.scalars.every((scalar) =>
        typeof scalar.isDefaultIgnorable === 'boolean')),
    'Unicode 18 scalar records retain Default_Ignorable_Code_Point metadata');

    const shaper = runtime.createShaper({ resolveFontById() {
      return { ok: false, code: 'font-not-registered' };
    } });
    assertEq(typeof shaper.shapeTextItemPlan, 'function');
  });


  it('builds and shapes a source-mapped plan from a real DocumentModel inline-font TextItem', async () => {
    const raw = 'כותרת 1 - חלק\nש<Frank Ruhl Libre>לום</>\n';
    const model = buildDocumentModel(raw, {
      inlineOptions: { knownFamilies: ['David Libre', 'Frank Ruhl Libre'] }
    });
    const paragraph = model.blocks.find((block) => block.kind === 'paragraph');
    assert(paragraph, 'DocumentModel must produce the source paragraph');
    const item = paragraph.items.find((entry) => entry.kind === 'text');
    assert(item, 'DocumentModel must produce a canonical TextItem');
    assertEq(item.payload.runs.map((run) => run.text), ['ש', 'לום']);
    assertEq(item.payload.runs.map((run) => run.fontFamily), [null, 'Frank Ruhl Libre']);

    fontResolver.clearFontResolver();
    try {
      const davidBytes = fs.readFileSync(path.join(RED_BUILD, 'ui', 'assets', 'imud', 'fonts', 'DavidLibre-Regular.ttf'));
      const frankBytes = fs.readFileSync(path.join(RED_BUILD, 'ui', 'assets', 'imud', 'fonts', 'FrankRuhlLibre-Regular.ttf'));
      const david = fontResolver.registerFont('David Libre', davidBytes, { source: 'document-model-source-map-proof' });
      const frank = fontResolver.registerFont('Frank Ruhl Libre', frankBytes, { source: 'document-model-source-map-proof' });
      assert(david.ok && frank.ok, 'both actual repository fonts must register in the canonical resolver');

      const fetchState = createFetch();
      const importState = { count: 0 };
      const runtime = await loadProductionTypographyRuntime({
        baseUrl: BASE_URL,
        fetchImpl: fetchState.fetchImpl,
        importModule: createImportModule(importState)
      });
      const plan = createTextItemShapingPlan(item, {
        bidiRuntime: runtime.unicode,
        fontResolver,
        direction: 'rtl',
        defaultFamily: 'David Libre',
        languageByScript: { Hebr: 'he' },
        featuresByScript: {
          Hebr: [
            { tag: 'kern', value: 1 },
            { tag: 'mark', value: 1 },
            { tag: 'mkmk', value: 1 },
            { tag: 'rlig', value: 1 }
          ]
        },
        variationAxesByFontId: {
          [david.fontId]: [],
          [frank.fontId]: []
        }
      });

      assertEq(plan.text, 'שלום');
      assertEq(plan.unicodeVersion, '18.0.0');
      assertEq(plan.sourceSegments.length, 2, 'removed inline-font syntax must remain a source-map gap');
      assertEq(plan.sourceSegments.map((segment) => segment.localRange), [
        { start: 0, end: 1 }, { start: 1, end: 4 }
      ]);
      assertEq(plan.sourceSegments.map((segment) => [
        segment.sourceRange.start, segment.sourceRange.end
      ]), [
        [raw.indexOf('ש'), raw.indexOf('ש') + 1],
        [raw.indexOf('לום'), raw.indexOf('לום') + 3]
      ]);
      assert(plan.sourceSegments[1].sourceRange.start > plan.sourceSegments[0].sourceRange.end,
        'the inline-font marker must be represented as a real source gap');
      assertEq(plan.scriptRuns.map((run) => run.font.fontId), [david.fontId, frank.fontId]);
      assertEq(plan.scriptRuns.map((run) => run.localRange), [
        { start: 0, end: 1 }, { start: 1, end: 4 }
      ]);

      const shaped = runtime.createShaper(fontResolver).shapeTextItemPlan(plan);
      assertEq(shaped.kind, 'ShapedTextItem');
      assertEq(shaped.shapedRuns.length, 2, 'font identity and non-contiguous source mapping keep the shaping runs separate');
      assert(shaped.shapedRuns.every(isShapedRun), 'every output run must satisfy the immutable ShapedRun contract');
      assertEq(shaped.shapedRuns.map((run) => [
        run.sourceRange.start, run.sourceRange.end, run.font.sourceHash
      ]), plan.scriptRuns.map((run) => [
        run.sourceRange.start, run.sourceRange.end, run.font.sourceHash
      ]));
      assert(shaped.shapedRuns.every((run) =>
        run.glyphs.length > 0 && run.glyphs.every((glyph) => glyph.gid > 0)),
      'real HarfBuzz output must contain covered GIDs for both source-mapped runs');
    } finally {
      fontResolver.clearFontResolver();
    }
  });

  it('rejects a tampered WASM asset before importing or initializing HarfBuzz', async () => {
    const original = assetBytes('harfbuzzjs/dist/harfbuzz.wasm');
    const altered = Buffer.from(original);
    altered[0] ^= 0x01;
    const fetchState = createFetch({ 'harfbuzzjs/dist/harfbuzz.wasm': altered });
    const importState = { count: 0 };
    let error = null;
    try {
      await loadProductionTypographyRuntime({
        baseUrl: BASE_URL,
        fetchImpl: fetchState.fetchImpl,
        importModule: createImportModule(importState)
      });
    } catch (caught) {
      error = caught;
    }
    assert(error instanceof Error, 'tampered binary must be rejected');
    assertEq(error.code, 'runtime-asset-hash-mismatch');
    assertEq(importState.count, 0, 'no executable module is imported before all asset hashes pass');
  });

  it('rejects a manifest that changes the pinned package or Unicode identity', async () => {
    const changed = JSON.parse(assetBytes('manifest.json').toString('utf8'));
    changed.harfbuzz.version = '1.6.5';
    const altered = Buffer.from(JSON.stringify(changed));
    const fetchState = createFetch({ 'manifest.json': altered });
    const importState = { count: 0 };
    let error = null;
    try {
      await loadProductionTypographyRuntime({
        baseUrl: BASE_URL,
        fetchImpl: fetchState.fetchImpl,
        importModule: createImportModule(importState)
      });
    } catch (caught) {
      error = caught;
    }
    assert(error instanceof Error, 'manifest drift must be rejected');
    assertEq(error.code, 'invalid-runtime-manifest');
    assertEq(importState.count, 0);
  });
});

report('production-typography-runtime');
