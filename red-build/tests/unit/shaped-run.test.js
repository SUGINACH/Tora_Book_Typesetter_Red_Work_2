// red-build/tests/unit/shaped-run.test.js — immutable production ShapedRun contract.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const {
  SHAPED_RUN_CONTRACT_VERSION,
  CLUSTER_LEVEL,
  createShapedRun,
  sliceShapedRun,
  isShapedRun,
  isShapedClusterBoundary
} = require('../../src/engine/typography/shaped-run');

function validInput(overrides = {}) {
  const text = 'שָׁלוֹם';
  return {
    id: 'shaped-run:block-1:item-1:100-107:font-1',
    text,
    sourceRange: { docId: 'doc-1', blockId: 'block-1', itemId: 'item-1', runIndex: 0, start: 100, end: 107 },
    font: {
      fontId: 'fnt-1234567890abcd',
      sourceHash: 'a'.repeat(64),
      faceIndex: 0,
      unitsPerEm: 1000
    },
    shaping: {
      engine: 'harfbuzz',
      engineVersion: '15.0.0',
      unicodeVersion: '18.0.0',
      script: 'Hebr',
      language: 'he',
      direction: 'rtl',
      bidiLevel: 1,
      bot: true,
      eot: true,
      clusterLevel: CLUSTER_LEVEL,
      variationAxes: [{ tag: 'wght', value: 700 }],
      features: [{ tag: 'rlig', value: 1 }, { tag: 'mark', value: 1 }]
    },
    graphemes: [
      { start: 100, end: 103, text: 'שָׁ' },
      { start: 103, end: 104, text: 'ל' },
      { start: 104, end: 106, text: 'וֹ' },
      { start: 106, end: 107, text: 'ם' }
    ],
    glyphs: [
      { gid: 40, cluster: 106, xAdvance: 520, yAdvance: 0, xOffset: 0, yOffset: 0, flags: 0 },
      { gid: 30, cluster: 104, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0, flags: 0 },
      { gid: 20, cluster: 103, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0, flags: 1 },
      { gid: 10, cluster: 100, xAdvance: 530, yAdvance: 0, xOffset: 12, yOffset: 35,
        flags: 1, controlBounds: { xMin: 0, yMin: -10, xMax: 490, yMax: 720 },
        inkBounds: { xMin: 8, yMin: -5, xMax: 475, yMax: 690 } }
    ],
    diagnostics: [],
    ...overrides
  };
}

function throwsCode(fn, code, label) {
  let error = null;
  try { fn(); } catch (caught) { error = caught; }
  assert(error instanceof Error, label + ': expected an error');
  assertEq(error.code, code, label + ': error code');
}

function assertDeepFrozen(root, label) {
  const seen = new Set();
  const stack = [root];
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    assert(Object.isFrozen(value), label + ': nested value is not frozen');
    for (const key of Object.keys(value)) stack.push(value[key]);
  }
}

describe('ShapedRun v1 — source mapping, cluster safety and immutability', () => {
  it('builds an immutable RTL Hebrew ShapedRun with absolute UTF-16 clusters', () => {
    const run = createShapedRun(validInput());
    assert(isShapedRun(run), 'run has the canonical ShapedRun marker');
    assertEq(run.contractVersion, SHAPED_RUN_CONTRACT_VERSION);
    assertEq(run.sourceRange.coordinateSpace, 'document-utf16');
    assertEq(run.sourceRange.start, 100);
    assertEq(run.sourceRange.end, 107);
    assertEq(run.advance, { x: 2050, y: 0 });
    assertEq(run.glyphs.map((glyph) => glyph.cluster), [106, 104, 103, 100],
      'glyph array keeps HarfBuzz visual order');
    assertEq(run.clusters.map((cluster) => [cluster.start, cluster.end]),
      [[100, 103], [103, 104], [104, 106], [106, 107]],
      'cluster map is sorted in logical source order');
    assertEq(run.clusters.map((cluster) => cluster.glyphIndices),
      [[3], [2], [1], [0]],
      'logical cluster map points back to visual glyph indices');
    assertEq(run.glyphs[3].sourceRange, { start: 100, end: 103 });
    assertEq(run.glyphs[3].controlBounds.xMax, 490);
    assertEq(run.glyphs[3].inkBounds.xMax, 475);
    assert(isShapedClusterBoundary(run, 103), 'EGC/cluster boundary');
    assert(!isShapedClusterBoundary(run, 102), 'inside a cluster is not a legal break boundary');
    assertDeepFrozen(run, 'ShapedRun');
  });

  it('merges multiple source graphemes into one ligature cluster without losing text mapping', () => {
    const input = validInput();
    input.glyphs = [
      { gid: 40, cluster: 106, xAdvance: 520, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 30, cluster: 104, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 11, cluster: 100, xAdvance: 900, yAdvance: 0, xOffset: 0, yOffset: 0 }
    ];
    const run = createShapedRun(input);
    assertEq(run.clusters.map((cluster) => ({
      start: cluster.start, end: cluster.end, text: cluster.text,
      graphemeStart: cluster.graphemeStart, graphemeEnd: cluster.graphemeEnd
    })), [
      { start: 100, end: 104, text: 'שָׁל', graphemeStart: 0, graphemeEnd: 2 },
      { start: 104, end: 106, text: 'וֹ', graphemeStart: 2, graphemeEnd: 3 },
      { start: 106, end: 107, text: 'ם', graphemeStart: 3, graphemeEnd: 4 }
    ]);
    assert(!isShapedClusterBoundary(run, 103),
      'a break between graphemes merged into one ligature cluster is forbidden');
    assert(isShapedClusterBoundary(run, 104), 'next shaped cluster boundary is legal');
  });

  it('slices only at shaped-cluster boundaries and preserves original shaping context', () => {
    const whole = createShapedRun(validInput());
    const tail = sliceShapedRun(whole, 103, 107);
    assertEq(tail.text, 'לוֹם');
    assertEq(tail.sourceRange.start, 103);
    assertEq(tail.sourceRange.end, 107);
    assertEq(tail.glyphs.map((glyph) => glyph.cluster), [106, 104, 103],
      'RTL visual order is preserved in the slice');
    assertEq(tail.advance, { x: 1520, y: 0 });
    assertEq(tail.shaping.bot, true,
      'slice retains the original shaping-context BOT; it is not silently reshaped');
    assertEq(tail.shaping.eot, true);
    assertDeepFrozen(tail, 'ShapedRun slice');

    const ligatureInput = validInput();
    ligatureInput.glyphs = [
      { gid: 40, cluster: 106, xAdvance: 520, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 30, cluster: 104, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 11, cluster: 100, xAdvance: 900, yAdvance: 0, xOffset: 0, yOffset: 0 }
    ];
    const ligatureRun = createShapedRun(ligatureInput);
    throwsCode(() => sliceShapedRun(ligatureRun, 100, 103),
      'slice-splits-shaped-cluster',
      'EGC boundary inside a ligature cluster is not a legal slice');
    const safe = sliceShapedRun(ligatureRun, 100, 104);
    assertEq(safe.text, 'שָׁל');
    assertEq(safe.clusters.length, 1);
    assertEq(safe.clusters[0].graphemeEnd - safe.clusters[0].graphemeStart, 2);
  });

  it('rejects non-monotone HarfBuzz output clusters in the selected run direction', () => {
    const rtl = validInput();
    rtl.glyphs = [
      { gid: 10, cluster: 100, xAdvance: 530, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 40, cluster: 106, xAdvance: 520, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 30, cluster: 104, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0 },
      { gid: 20, cluster: 103, xAdvance: 500, yAdvance: 0, xOffset: 0, yOffset: 0 }
    ];
    throwsCode(() => createShapedRun(rtl), 'non-monotone-glyph-clusters', 'RTL cluster order');

    const ltr = validInput();
    ltr.shaping.direction = 'ltr';
    ltr.shaping.bidiLevel = 0;
    ltr.glyphs = ltr.glyphs.slice().reverse();
    assert(isShapedRun(createShapedRun(ltr)), 'ascending LTR cluster order is accepted');
  });

  it('rejects clusters that split an extended grapheme or have incomplete source coverage', () => {
    const splitEgc = validInput();
    splitEgc.glyphs[3].cluster = 101;
    throwsCode(() => createShapedRun(splitEgc), 'invalid-glyph-cluster', 'cluster inside EGC');

    const missingPrefix = validInput();
    missingPrefix.glyphs = missingPrefix.glyphs.filter((glyph) => glyph.cluster !== 100);
    throwsCode(() => createShapedRun(missingPrefix), 'incomplete-shaped-source-prefix', 'missing source prefix');

    const badPartition = validInput();
    badPartition.graphemes[1].start = 102;
    throwsCode(() => createShapedRun(badPartition), 'invalid-grapheme-partition', 'overlapping graphemes');
  });

  it('rejects GID 0 because .notdef is not valid font coverage', () => {
    const input = validInput();
    input.glyphs[0].gid = 0;
    throwsCode(() => createShapedRun(input), 'missing-glyph-coverage', 'GID 0 must not enter a canonical ShapedRun');
  });

  it('rejects invalid source, UTF-16, direction/level and glyph-position input', () => {
    const badRange = validInput();
    badRange.sourceRange.end = 108;
    throwsCode(() => createShapedRun(badRange), 'source-range-length-mismatch', 'source range length');

    const badUtf16 = validInput();
    badUtf16.text = 'x\uD800';
    throwsCode(() => createShapedRun(badUtf16), 'invalid-utf16', 'unpaired surrogate');

    const badBidi = validInput();
    badBidi.shaping.bidiLevel = 2;
    throwsCode(() => createShapedRun(badBidi), 'bidi-level-direction-mismatch', 'Bidi parity');

    const badAdvance = validInput();
    badAdvance.glyphs[0].xAdvance = Number.NaN;
    throwsCode(() => createShapedRun(badAdvance), 'invalid-glyph-position', 'non-finite advance');

    const badBounds = validInput();
    badBounds.glyphs[0].controlBounds = { xMin: 10, yMin: 0, xMax: 2, yMax: 20 };
    throwsCode(() => createShapedRun(badBounds), 'invalid-glyph-bounds', 'inverted control bounds');
  });

  it('requires explicit features and variation axes; defaults only face index and empty axes', () => {
    const input = validInput();
    delete input.shaping.features;
    throwsCode(() => createShapedRun(input), 'invalid-open-type-features', 'missing feature array');

    const duplicateFeature = validInput();
    duplicateFeature.shaping.features = [{ tag: 'kern', value: 1 }, { tag: 'kern', value: 0 }];
    throwsCode(() => createShapedRun(duplicateFeature), 'invalid-open-type-features', 'duplicate feature');

    const missingAxes = validInput();
    delete missingAxes.shaping.variationAxes;
    throwsCode(() => createShapedRun(missingAxes), 'invalid-variation-axes', 'missing explicit variation-axis array');

    const malformedDiagnostics = validInput();
    malformedDiagnostics.diagnostics = { code: 'ignored' };
    throwsCode(() => createShapedRun(malformedDiagnostics), 'invalid-shaped-run-diagnostic', 'malformed diagnostics are not silently discarded');

    const run = createShapedRun(validInput());
    assertEq(run.font.faceIndex, 0, 'face-index default');
    assertEq(run.shaping.variationAxes, [{ tag: 'wght', value: 700 }]);
  });

  it('does not mutate its caller-owned input and rejects later mutation through output', () => {
    const input = validInput();
    const before = JSON.stringify(input);
    const run = createShapedRun(input);
    assertEq(JSON.stringify(input), before, 'input object is not mutated');
    let threw = false;
    try { run.glyphs[0].xAdvance = 999; } catch (error) { threw = error instanceof TypeError; }
    assert(threw || run.glyphs[0].xAdvance !== 999, 'glyph metrics are immutable');
    assertDeepFrozen(run, 'frozen run');
  });
});

report('ShapedRun v1');
