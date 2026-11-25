// red-build/tests/unit/harfbuzz-shaper.test.js
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { createHarfBuzzShaper } = require('../../src/engine/typography/harfbuzz-shaper');
const { sha256Hex } = require('../../src/engine/assets/hash256');

const FONT_BYTES = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7]);
const SOURCE_HASH = sha256Hex(FONT_BYTES);
const FONT_ID = 'fnt-' + SOURCE_HASH.slice(0, 14);

function makePlan(overrides = {}) {
  const text = 'שָׁלוֹם';
  const graphemes = [
    { start: 100, end: 103, text: 'שָׁ' },
    { start: 103, end: 104, text: 'ל' },
    { start: 104, end: 106, text: 'וֹ' },
    { start: 106, end: 107, text: 'ם' }
  ];
  const scriptRun = {
    id: 'text-1#shape:100-107:' + FONT_ID,
    sourceRange: { coordinateSpace: 'document-utf16', start: 100, end: 107, docId: 'doc-1', blockId: 'block-1', itemId: 'text-1' },
    localRange: { start: 0, end: 7 },
    text,
    script: 'Hebr',
    language: 'he',
    direction: 'rtl',
    bidiLevel: 1,
    bot: true,
    eot: true,
    graphemeStart: 0,
    graphemeEnd: 4,
    graphemes,
    font: { fontId: FONT_ID, sourceHash: SOURCE_HASH, faceIndex: 0, unitsPerEm: 1000, variationAxes: [] },
    features: [{ tag: 'mark', value: 1 }, { tag: 'mkmk', value: 1 }, { tag: 'rlig', value: 1 }],
    styleRunIndexes: [0],
    fallbackUsed: false,
    fallbackChains: []
  };
  return {
    kind: 'TextItemShapingPlan',
    version: 'text-item-shaping-plan-v1',
    itemId: 'text-1',
    text,
    sourceRange: { coordinateSpace: 'document-utf16', start: 100, end: 107, docId: 'doc-1', blockId: 'block-1' },
    unicodeVersion: '18.0.0',
    direction: 'rtl',
    graphemes,
    scriptRuns: [scriptRun],
    nonShapingRuns: [],
    sourceRuns: [{
      kind: 'shape', start: 100, end: 107, text,
      script: 'Hebr', direction: 'rtl', bidiLevel: 1,
      graphemeStart: 0, graphemeEnd: 4
    }],
    diagnostics: [],
    ...overrides
  };
}

function makeFakeHarfBuzz(options = {}) {
  const state = { blobCount: 0, faceCount: 0, fontCount: 0, shapeCount: 0, buffers: [], variations: [], scales: [] };
  class Blob {
    constructor(bytes) { this.bytes = bytes; state.blobCount++; }
  }
  class Face {
    constructor(blob, faceIndex) {
      this.blob = blob;
      this.faceIndex = faceIndex;
      this.upem = 1000;
      this.axes = options.axes || {};
      state.faceCount++;
    }
    getAxisInfos() { return this.axes; }
  }
  class Font {
    constructor(face) { this.face = face; this.ptr = state.fontCount + 100; state.fontCount++; }
    setScale(x, y) { state.scales.push([x, y]); }
    setVariations(variations) { state.variations.push(variations.map((v) => ({ tag: v.tag, value: v.value }))); }
    glyphExtents(gid) { return { xBearing: gid * 2, yBearing: 700, width: 480, height: -680 }; }
  }
  class Feature { constructor(tag, value) { this.tag = tag; this.value = value; } }
  class Variation { constructor(tag, value) { this.tag = tag; this.value = value; } }
  class Buffer {
    constructor() {
      this.items = [];
      this.direction = null;
      this.script = null;
      this.language = null;
      this.level = null;
      this.flags = null;
      state.buffers.push(this);
    }
    add(codePoint, cluster) { this.items.push({ codePoint, cluster }); }
    setDirection(value) { this.direction = value; }
    setScript(value) { this.script = value; }
    setLanguage(value) { this.language = value; }
    setClusterLevel(value) { this.level = value; }
    setFlags(value) { this.flags = value; }
    getGlyphInfos() { return this.infos || []; }
    getGlyphPositions() { return this.positions || []; }
  }
  const hb = {
    Blob, Face, Font, Feature, Variation, Buffer,
    Direction: { LTR: 4, RTL: 5 },
    ClusterLevel: { MONOTONE_CHARACTERS: 1 },
    BufferFlag: { DEFAULT: 0, BOT: 1, EOT: 2 },
    shape(font, buffer, features) {
      state.shapeCount++;
      buffer.features = features;
      const unique = Array.from(new Set(buffer.items.map((item) => item.cluster))).sort((a, b) => a - b);
      let clusters = unique;
      if (options.mergeFirstTwo && unique.length > 1) clusters = [unique[0], ...unique.slice(2)];
      if (buffer.direction === hb.Direction.RTL) clusters = clusters.slice().reverse();
      if (options.invalidCluster) clusters[0] += 1;
      if (options.nonMonotone && clusters.length > 1) [clusters[0], clusters[1]] = [clusters[1], clusters[0]];
      buffer.infos = clusters.map((cluster, index) => ({ codepoint: index + 10, cluster, flags: index ? 0 : 1 }));
      if (options.notdef && buffer.infos.length) buffer.infos[0].codepoint = 0;
      buffer.positions = clusters.map(() => ({ xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0 }));
    }
  };
  return { hb, state };
}

function makeResolver(overrides = {}) {
  const state = { calls: 0 };
  return {
    state,
    resolveFontById(fontId) {
      state.calls++;
      if (overrides.fail) return { ok: false, code: 'unknown-font-id' };
      return {
        ok: true,
        fontId,
        record: {
          fontId,
          sourceHash: overrides.sourceHash || SOURCE_HASH,
          unitsPerEm: overrides.unitsPerEm || 1000,
          font: {
            unitsPerEm: overrides.unitsPerEm || 1000,
            bytes: overrides.bytes || FONT_BYTES
          }
        }
      };
    }
  };
}

function makeShaper(fake, resolver, extra = {}) {
  return createHarfBuzzShaper({
    hb: fake.hb,
    fontResolver: resolver,
    engineVersion: '15.0.0',
    ...extra
  });
}

describe('HarfBuzzShaper — canonical plan to immutable ShapedRun', () => {
  it('shapes Hebrew niqqud with absolute ICU4X grapheme clusters and preserves visual/logical maps', () => {
    const fake = makeFakeHarfBuzz();
    const resolver = makeResolver();
    const shaper = makeShaper(fake, resolver);
    const result = shaper.shapeTextItemPlan(makePlan());
    assertEq(result.shapedRuns.length, 1);
    const run = result.shapedRuns[0];
    assertEq(run.text, 'שָׁלוֹם');
    assertEq(run.sourceRange.start, 100);
    assertEq(run.glyphs.map((glyph) => glyph.cluster), [106, 104, 103, 100]);
    assertEq(run.clusters.map((cluster) => [cluster.start, cluster.end]),
      [[100, 103], [103, 104], [104, 106], [106, 107]]);
    assertEq(run.advance, { x: 2000, y: 0 });
    assertEq(run.glyphs[3].controlBounds, { xMin: 26, yMin: 20, xMax: 506, yMax: 700 });
    assertEq(run.glyphs[3].inkBounds, null);
    assert(run.diagnostics.some((item) => item.code === 'tight-ink-bounds-not-computed'));
    assertEq(fake.state.buffers[0].items.map((item) => item.cluster),
      [100, 100, 100, 103, 104, 104, 106]);
    assertEq(fake.state.buffers[0].direction, fake.hb.Direction.RTL);
    assertEq(fake.state.buffers[0].script, 'Hebr');
    assertEq(fake.state.buffers[0].language, 'he');
    assertEq(fake.state.buffers[0].level, fake.hb.ClusterLevel.MONOTONE_CHARACTERS);
    assertEq(fake.state.buffers[0].flags, fake.hb.BufferFlag.BOT | fake.hb.BufferFlag.EOT);
    assertEq(run.shaping.engineVersion, '15.0.0');
  });

  it('applies validated variable-font axes and caches one face/font per content identity and instance', () => {
    const fake = makeFakeHarfBuzz({ axes: { wght: { min: 100, max: 900, default: 400 } } });
    const resolver = makeResolver();
    const plan = makePlan();
    plan.scriptRuns[0].font.variationAxes = [{ tag: 'wght', value: 700 }];
    const shaper = makeShaper(fake, resolver);
    shaper.shapeTextItemPlan(plan);
    shaper.shapeTextItemPlan(plan);
    assertEq(fake.state.faceCount, 1);
    assertEq(fake.state.fontCount, 1);
    assertEq(fake.state.scales, [[1000, 1000]]);
    assertEq(fake.state.variations, [[{ tag: 'wght', value: 700 }]]);
    assertEq(resolver.state.calls, 2, 'font bytes/hash are revalidated on every shaping call');
    assertEq(shaper.getFontCacheSize(), 1);
  });

  it('rejects GID 0 instead of returning a ShapedRun containing .notdef', () => {
    const fake = makeFakeHarfBuzz({ notdef: true });
    const shaper = makeShaper(fake, makeResolver());
    let error;
    try { shaper.shapeTextItemPlan(makePlan()); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'missing-glyph-coverage');
  });

  it('requires real ink bounds when requireInkBounds is enabled', () => {
    const fake = makeFakeHarfBuzz();
    const shaper = makeShaper(fake, makeResolver(), {
      requireInkBounds: true,
      inkBoundsProvider: () => null
    });
    let error;
    try { shaper.shapeTextItemPlan(makePlan()); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'ink-bounds-unavailable');
  });

  it('rejects a variation axis that the font does not expose', () => {
    const fake = makeFakeHarfBuzz();
    const plan = makePlan();
    plan.scriptRuns[0].font.variationAxes = [{ tag: 'opsz', value: 12 }];
    const shaper = makeShaper(fake, makeResolver());
    let error;
    try { shaper.shapeTextItemPlan(plan); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'unsupported-font-variation-axis');
  });

  it('rejects HarfBuzz clusters that are not canonical grapheme starts', () => {
    const fake = makeFakeHarfBuzz({ invalidCluster: true });
    const shaper = makeShaper(fake, makeResolver());
    let error;
    try { shaper.shapeTextItemPlan(makePlan()); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'invalid-output-cluster');
  });

  it('rejects non-monotone HarfBuzz output rather than repairing its order', () => {
    const fake = makeFakeHarfBuzz({ nonMonotone: true });
    const shaper = makeShaper(fake, makeResolver());
    let error;
    try { shaper.shapeTextItemPlan(makePlan()); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'non-monotone-glyph-clusters');
  });

  it('preserves non-shaping source spans and does not resolve fonts for them', () => {
    const base = makePlan();
    const control = String.fromCodePoint(0x202B);
    base.text = control;
    base.sourceRange = { coordinateSpace: 'document-utf16', start: 100, end: 101, docId: 'doc-1' };
    base.graphemes = [{ start: 100, end: 101, text: control, shapeable: false, isBidiControl: true, containsBidiControl: true }];
    base.scriptRuns = [];
    base.sourceRuns = [{ kind: 'bidi-control', start: 100, end: 101, text: control }];
    base.nonShapingRuns = base.sourceRuns.slice();
    const resolver = makeResolver();
    const result = makeShaper(makeFakeHarfBuzz(), resolver).shapeTextItemPlan(base);
    assertEq(resolver.state.calls, 0);
    assertEq(result.shapedRuns.length, 0);
    assertEq(result.nonShapingRuns[0].text, control);
  });
});

report('HarfBuzzShaper');
