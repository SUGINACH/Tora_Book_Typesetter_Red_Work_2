// red-build/tests/unit/text-item-shaping-plan.test.js
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { createTextItemShapingPlan } = require('../../src/engine/typography/text-item-shaping-plan');


const DEFAULT_IGNORABLE_FOR_FIXTURES = new Set([
  0x00AD, 0x034F, 0x061C, 0x115F, 0x1160, 0x17B4, 0x17B5,
  0x180B, 0x180C, 0x180D, 0x180E, 0x200B, 0x200C, 0x200D,
  0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E,
  0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0x2066, 0x2067,
  0x2068, 0x2069, 0xFE00, 0xFE01, 0xFE02, 0xFE03, 0xFE04,
  0xFE05, 0xFE06, 0xFE07, 0xFE08, 0xFE09, 0xFE0A, 0xFE0B,
  0xFE0C, 0xFE0D, 0xFE0E, 0xFE0F, 0xFEFF, 0xE0100
]);
function scalarRecordsOf(grapheme) {
  let offset = grapheme.start;
  return Array.from(grapheme.text, (character) => {
    const start = offset;
    offset += character.length;
    const codePoint = character.codePointAt(0);
    return {
      start, end: offset,
      isDefaultIgnorable: DEFAULT_IGNORABLE_FOR_FIXTURES.has(codePoint),
      isBidiControl: (codePoint >= 0x202A && codePoint <= 0x202E) ||
        (codePoint >= 0x2066 && codePoint <= 0x2069) ||
        codePoint === 0x061C || codePoint === 0x200E || codePoint === 0x200F
    };
  });
}

function fakeItemizer(text, graphemes, scriptRuns, sourceRuns) {
  return {
    unicodeVersion: '18.0.0',
    resolve(input, direction) {
      assertEq(input, text, 'one complete TextItem is resolved');
      assert(direction === 'rtl' || direction === 'ltr', 'explicit base direction');
      return { text: input, direction };
    },
    itemizeScripts(input, resolved) {
      assertEq(input, text, 'same complete TextItem is itemized');
      assertEq(resolved.text, text);
      const enrichedSourceRuns = sourceRuns.map((sourceRun) => {
        if (sourceRun.kind !== 'shape') return sourceRun;
        const scriptRun = scriptRuns.find((candidate) =>
          candidate.start === sourceRun.start && candidate.end === sourceRun.end);
        return scriptRun ? {
          ...sourceRun, script: scriptRun.script, direction: scriptRun.direction,
          bidiLevel: scriptRun.bidiLevel, graphemeStart: scriptRun.graphemeStart,
          graphemeEnd: scriptRun.graphemeEnd
        } : sourceRun;
      });
      const withScalars = graphemes.map((grapheme) => ({
        ...grapheme, scalars: grapheme.scalars || scalarRecordsOf(grapheme)
      }));
      return { text, utf16Length: text.length, graphemes: withScalars, scriptRuns,
        sourceRuns: enrichedSourceRuns,
        nonShapingRuns: enrichedSourceRuns.filter((run) => run.kind !== 'shape') };
    }
  };
}

function makeResolver(options = {}) {
  const coveredCodePoints = Array.from({ length: 0x05EA - 0x0591 + 1 }, (_, index) => 0x0591 + index);
  const createRecord = (family, fontId, sourceHash, unitsPerEm, bytes) => {
    const charToGlyph = new Map(coveredCodePoints.map((codePoint, index) => [codePoint, index + 1]));
    for (const codePoint of (options.missingByFamily && options.missingByFamily[family]) || []) {
      charToGlyph.delete(codePoint);
    }
    return {
      fontId, sourceHash, unitsPerEm, numGlyphs: 128,
      font: { unitsPerEm, bytes: Uint8Array.from(bytes), charToGlyph }
    };
  };
  const records = {
    'Frank Ruhl Libre': createRecord('Frank Ruhl Libre', 'fnt-11111111111111', '1'.repeat(64), 1000, [1, 2, 3]),
    'David Libre': createRecord('David Libre', 'fnt-22222222222222', '2'.repeat(64), 2048, [4, 5, 6])
  };
  return {
    resolveFontForGrapheme(alias, requiredCodePoints, resolverOptions) {
      const candidates = [];
      const seen = new Set();
      const add = (family) => {
        if (family != null && !seen.has(family)) { seen.add(family); candidates.push(family); }
      };
      add(alias);
      for (const family of (resolverOptions && resolverOptions.fallbacks) || []) add(family);
      add(resolverOptions && resolverOptions.defaultFamily);
      const fallbackChain = [];
      for (const family of candidates) {
        const record = records[family];
        if (!record) {
          fallbackChain.push({ alias: family, fontId: null, chosen: false, reason: 'not-registered' });
          continue;
        }
        const missingCodePoints = requiredCodePoints.filter((codePoint) => !record.font.charToGlyph.has(codePoint));
        if (missingCodePoints.length) {
          fallbackChain.push({ alias: family, fontId: record.fontId, chosen: false, reason: 'missing-grapheme-coverage', missingCodePoints });
          continue;
        }
        fallbackChain.push({ alias: family, fontId: record.fontId, chosen: true, reason: family === alias ? 'direct' : 'grapheme-coverage-fallback' });
        return {
          ok: true, fontId: record.fontId, record,
          fallbackUsed: family !== alias,
          fallbackChain,
          diagnostics: fallbackChain.slice(0, -1).map((entry) => ({ code: 'font-missing-grapheme-coverage', ...entry }))
        };
      }
      return { ok: false, code: 'grapheme-font-coverage-unavailable', message: 'no test font covers the complete EGC', fallbackChain, diagnostics: [] };
    }
  };
}

const AXES = {
  'fnt-11111111111111': [],
  'fnt-22222222222222': [{ tag: 'wght', value: 600 }]
};
const LANGUAGES = { Hebr: 'he' };
const FEATURES = { Hebr: [{ tag: 'kern', value: 1 }, { tag: 'mark', value: 1 }, { tag: 'mkmk', value: 1 }, { tag: 'rlig', value: 1 }] };

function makeOptions(text, graphemes, scriptRuns, sourceRuns, extra = {}) {
  return {
    bidiRuntime: fakeItemizer(text, graphemes, scriptRuns, sourceRuns),
    fontResolver: makeResolver(),
    direction: 'rtl',
    defaultFamily: 'Frank Ruhl Libre',
    languageByScript: { ...LANGUAGES },
    featuresByScript: Object.fromEntries(Object.entries(FEATURES).map(([script, features]) =>
      [script, features.map((feature) => ({ ...feature }))])),
    variationAxesByFontId: Object.fromEntries(Object.entries(AXES).map(([fontId, axes]) =>
      [fontId, axes.map((axis) => ({ ...axis }))])),
    ...extra
  };
}

function baseItem(runs, text, start = 100) {
  return {
    id: 'text-1',
    kind: 'text',
    sourceRange: { start, end: start + text.length, docId: 'doc-1', blockId: 'block-1' },
    payload: { text, runs }
  };
}

describe('TextItem Shaping Plan — paragraph itemization before word splitting', () => {
  it('itemizes the complete TextItem once, then projects font/style boundaries onto EGC-safe ScriptRuns', () => {
    const text = 'שָׁלוֹם';
    const graphemes = [
      { start: 0, end: 3, text: 'שָׁ', script: 'Hebr', status: 'combining-sequence-script-inheritance', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 3, end: 4, text: 'ל', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 4, end: 6, text: 'וֹ', script: 'Hebr', status: 'combining-sequence-script-inheritance', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 6, end: 7, text: 'ם', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 7, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 4 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 7, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 4 }];
    const item = baseItem([
      { text: 'שָׁ', sourceStart: 500, sourceEnd: 503, fontFamily: 'Frank Ruhl Libre' },
      { text: 'ל', sourceStart: 503, sourceEnd: 504, fontFamily: 'Frank Ruhl Libre' },
      { text: 'וֹם', sourceStart: 504, sourceEnd: 507, fontFamily: 'Frank Ruhl Libre' }
    ], text);
    const plan = createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    assertEq(plan.scriptRuns.length, 1, 'equal resolved font runs coalesce');
    assertEq(plan.scriptRuns[0].sourceRange, {
      coordinateSpace: 'document-utf16', start: 100, end: 107,
      docId: 'doc-1', blockId: 'block-1', itemId: 'text-1'
    });
    assertEq(plan.scriptRuns[0].styleRunIndexes, [0, 1, 2],
      'coalesced shaping run preserves all original inline style run indexes');
    assertEq(plan.scriptRuns[0].text, text);
    assertEq(plan.scriptRuns[0].font.fontId, 'fnt-11111111111111');
    assertEq(plan.scriptRuns[0].font.sourceHash, '1'.repeat(64));
    assertEq(plan.scriptRuns[0].features, FEATURES.Hebr);
    assertEq(plan.scriptRuns[0].graphemes.map((x) => [x.start, x.end]), [[100, 103], [103, 104], [104, 106], [106, 107]]);
    assertEq(plan.direction, 'rtl');
  });

  it('splits ScriptRuns at a real font identity transition without splitting an EGC', () => {
    const text = 'שָׁל';
    const graphemes = [
      { start: 0, end: 3, text: 'שָׁ', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 3, end: 4, text: 'ל', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 4, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 4, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1 }];
    const item = baseItem([
      { text: 'שָׁ', sourceStart: 700, sourceEnd: 703, fontFamily: 'Frank Ruhl Libre' },
      { text: 'ל', sourceStart: 703, sourceEnd: 704, fontFamily: 'David Libre' }
    ], text, 50);
    const plan = createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    assertEq(plan.scriptRuns.map((run) => [run.localRange.start, run.localRange.end, run.font.fontId]),
      [[0, 3, 'fnt-11111111111111'], [3, 4, 'fnt-22222222222222']]);
  });

  it('rejects an inline font boundary inside one canonical extended grapheme', () => {
    const text = 'שָׁל';
    const graphemes = [
      { start: 0, end: 3, text: 'שָׁ', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 3, end: 4, text: 'ל', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 4, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 4, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1 }];
    const item = baseItem([
      { text: 'ש', sourceStart: 1, sourceEnd: 2, fontFamily: 'Frank Ruhl Libre' },
      { text: 'ָׁל', sourceStart: 2, sourceEnd: 5, fontFamily: 'David Libre' }
    ], text);
    let error;
    try {
      createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    } catch (caught) { error = caught; }
    assert(error instanceof Error, 'style boundary inside EGC must be rejected');
    assertEq(error.code, 'style-boundary-splits-grapheme');
  });

  it('keeps same-Script runs at different Bidi levels separate and preserves Bidi_Control source spans', () => {
    const text = String.fromCodePoint(0x05D0, 0x05D1, 0x202B, 0x05D2, 0x05D3, 0x202C, 0x05D4, 0x05D5);
    const graphemes = [];
    const add = (start, end, script, level, shapeable, isControl = false) => {
      graphemes.push({ start, end, text: text.slice(start, end), script, status: isControl ? 'bidi-control' : 'strong', direction: level % 2 ? 'rtl' : 'ltr', bidiLevel: level, shapeable, isBidiControl: isControl, containsBidiControl: isControl });
    };
    add(0, 1, 'Hebr', 1, true); add(1, 2, 'Hebr', 1, true);
    add(2, 3, null, 1, false, true);
    add(3, 4, 'Hebr', 3, true); add(4, 5, 'Hebr', 3, true);
    add(5, 6, null, 1, false, true);
    add(6, 7, 'Hebr', 1, true); add(7, 8, 'Hebr', 1, true);
    const scriptRuns = [
      { start: 0, end: 2, text: text.slice(0, 2), script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 },
      { start: 3, end: 5, text: text.slice(3, 5), script: 'Hebr', direction: 'rtl', bidiLevel: 3, graphemeStart: 3, graphemeEnd: 5 },
      { start: 6, end: 8, text: text.slice(6, 8), script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 6, graphemeEnd: 8 }
    ];
    const sourceRuns = [
      { kind: 'shape', start: 0, end: 2, text: text.slice(0, 2) },
      { kind: 'bidi-control', start: 2, end: 3, text: text.slice(2, 3) },
      { kind: 'shape', start: 3, end: 5, text: text.slice(3, 5) },
      { kind: 'bidi-control', start: 5, end: 6, text: text.slice(5, 6) },
      { kind: 'shape', start: 6, end: 8, text: text.slice(6, 8) }
    ];
    const item = baseItem([{ text, sourceStart: 900, sourceEnd: 908, fontFamily: 'Frank Ruhl Libre' }], text);
    const plan = createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    assertEq(plan.scriptRuns.map((run) => run.bidiLevel), [1, 3, 1]);
    assertEq(plan.nonShapingRuns.map((run) => [run.start, run.end, run.kind]), [
      [102, 103, 'bidi-control'], [105, 106, 'bidi-control']
    ]);
  });

  it('rejects missing language, feature or variation policies rather than guessing', () => {
    const text = 'אב';
    const graphemes = [
      { start: 0, end: 1, text: 'א', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 1, end: 2, text: 'ב', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 2, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 2, text }];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 102, fontFamily: 'Frank Ruhl Libre' }], text);
    const options = makeOptions(text, graphemes, scriptRuns, sourceRuns);
    delete options.languageByScript.Hebr;
    let error;
    try { createTextItemShapingPlan(item, options); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'missing-script-language');
  });

  it('does not require a font for a TextItem made only of Bidi_Control characters', () => {
    const text = String.fromCodePoint(0x202B, 0x202C);
    const graphemes = [
      { start: 0, end: 1, text: text[0], status: 'bidi-control', direction: 'rtl', bidiLevel: 1, shapeable: false, containsBidiControl: true, isBidiControl: true },
      { start: 1, end: 2, text: text[1], status: 'bidi-control', direction: 'rtl', bidiLevel: 1, shapeable: false, containsBidiControl: true, isBidiControl: true }
    ];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 102, fontFamily: 'NoFontRegistered' }], text);
    let resolveCalls = 0;
    const options = makeOptions(text, graphemes, [], [
      { kind: 'bidi-control', start: 0, end: 1, text: text[0] },
      { kind: 'bidi-control', start: 1, end: 2, text: text[1] }
    ], {
      fontResolver: { resolveFontForGrapheme() { resolveCalls++; return { ok: false, code: 'font-unavailable' }; } },
      variationAxesByFontId: {}
    });
    const plan = createTextItemShapingPlan(item, options);
    assertEq(resolveCalls, 0);
    assertEq(plan.scriptRuns.length, 0);
    assertEq(plan.nonShapingRuns.map((run) => run.kind), ['bidi-control', 'bidi-control']);
  });

  it('rejects ScriptRuns whose direction parity conflicts with their Bidi level', () => {
    const text = 'אב';
    const graphemes = [
      { start: 0, end: 1, text: 'א', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 1, end: 2, text: 'ב', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 2, text, script: 'Hebr', direction: 'ltr', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 2, text, script: 'Hebr', direction: 'ltr', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 102, fontFamily: 'Frank Ruhl Libre' }], text);
    let error;
    try { createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns)); }
    catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'invalid-script-run');
  });


  it('preserves discontinuous inline-font source ranges without shifting local UTF-16 clusters', () => {
    const text = 'אבגד';
    const graphemes = Array.from(text, (character, index) => ({
      start: index, end: index + 1, text: character,
      script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true
    }));
    const scriptRuns = [{
      start: 0, end: text.length, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1,
      graphemeStart: 0, graphemeEnd: text.length
    }];
    const sourceRuns = [{
      kind: 'shape', start: 0, end: text.length, text, script: 'Hebr',
      direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: text.length
    }];
    const item = {
      id: 'gapped-source-item',
      kind: 'text',
      sourceRange: { start: 100, end: 116, docId: 'doc-1', blockId: 'block-1' },
      payload: {
        text,
        runs: [
          { text: 'אב', sourceStart: 10, sourceEnd: 12, fontFamily: 'Frank Ruhl Libre' },
          { text: 'ג', sourceStart: 20, sourceEnd: 21, fontFamily: 'David Libre' },
          { text: 'ד', sourceStart: 25, sourceEnd: 26, fontFamily: 'Frank Ruhl Libre' }
        ]
      }
    };
    const plan = createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    assertEq(plan.version, 'text-item-shaping-plan-v3-source-map');
    assertEq(plan.sourceSegments, [
      { localRange: { start: 0, end: 2 }, sourceRange: { start: 100, end: 102 }, styleRunIndexes: [0] },
      { localRange: { start: 2, end: 3 }, sourceRange: { start: 110, end: 111 }, styleRunIndexes: [1] },
      { localRange: { start: 3, end: 4 }, sourceRange: { start: 115, end: 116 }, styleRunIndexes: [2] }
    ]);
    assertEq(plan.graphemes.map((grapheme) => ({
      local: grapheme.localRange, source: [grapheme.start, grapheme.end]
    })), [
      { local: { start: 0, end: 1 }, source: [100, 101] },
      { local: { start: 1, end: 2 }, source: [101, 102] },
      { local: { start: 2, end: 3 }, source: [110, 111] },
      { local: { start: 3, end: 4 }, source: [115, 116] }
    ]);
    assertEq(plan.scriptRuns.map((run) => ({
      local: run.localRange, source: [run.sourceRange.start, run.sourceRange.end],
      text: run.text, fontId: run.font.fontId
    })), [
      { local: { start: 0, end: 2 }, source: [100, 102], text: 'אב', fontId: 'fnt-11111111111111' },
      { local: { start: 2, end: 3 }, source: [110, 111], text: 'ג', fontId: 'fnt-22222222222222' },
      { local: { start: 3, end: 4 }, source: [115, 116], text: 'ד', fontId: 'fnt-11111111111111' }
    ]);
    assertEq(plan.sourceRuns[0].sourceRanges, [
      { localRange: { start: 0, end: 2 }, sourceRange: { start: 100, end: 102 } },
      { localRange: { start: 2, end: 3 }, sourceRange: { start: 110, end: 111 } },
      { localRange: { start: 3, end: 4 }, sourceRange: { start: 115, end: 116 } }
    ]);
  });

  it('chooses fallback for the complete Hebrew EGC when the primary font lacks one niqqud scalar', () => {
    const text = 'שָׁ';
    const graphemes = [
      { start: 0, end: text.length, text, script: 'Hebr', status: 'combining-sequence-script-inheritance', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: text.length, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 1 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: text.length, text }];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 100 + text.length, fontFamily: 'Frank Ruhl Libre' }], text);
    const options = makeOptions(text, graphemes, scriptRuns, sourceRuns, {
      fontResolver: makeResolver({ missingByFamily: { 'Frank Ruhl Libre': [0x05C1] } }),
      fallbacksByFamily: { 'Frank Ruhl Libre': ['David Libre'] }
    });
    const plan = createTextItemShapingPlan(item, options);
    const expectedCoverage = [0x05E9, 0x05B8, 0x05C1];
    assertEq(plan.graphemes[0].coverageCodePoints, expectedCoverage);
    assertEq(plan.graphemes[0].font.fontId, 'fnt-22222222222222');
    assertEq(plan.scriptRuns.length, 1, 'one EGC remains one ShapedRun');
    assertEq(plan.scriptRuns[0].graphemes[0].coverageCodePoints, expectedCoverage);
    assertEq(plan.diagnostics[0].graphemeRange, { start: 100, end: 103 });
    assertEq(plan.diagnostics[0].requiredCodePoints, expectedCoverage);
    assertEq(plan.diagnostics[0].fallbackChain[0].missingCodePoints, [0x05C1]);
  });

  it('rejects a grapheme when no configured font covers all of its required scalars', () => {
    const text = 'שָׁ';
    const graphemes = [
      { start: 0, end: text.length, text, script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: text.length, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 1 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: text.length, text }];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 103, fontFamily: 'Frank Ruhl Libre' }], text);
    const options = makeOptions(text, graphemes, scriptRuns, sourceRuns, {
      fontResolver: makeResolver({
        missingByFamily: { 'Frank Ruhl Libre': [0x05C1], 'David Libre': [0x05C1] }
      }),
      fallbacksByFamily: { 'Frank Ruhl Libre': ['David Libre'] }
    });
    let error;
    try { createTextItemShapingPlan(item, options); } catch (caught) { error = caught; }
    assert(error instanceof Error);
    assertEq(error.code, 'font-unavailable-for-grapheme');
  });

  it('excludes Default_Ignorable ZWJ from cmap coverage without removing it from the shaped source', () => {
    const text = 'א\u200D';
    const graphemes = [
      { start: 0, end: text.length, text, script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: text.length, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 1 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: text.length, text }];
    const item = baseItem([{ text, sourceStart: 200, sourceEnd: 200 + text.length, fontFamily: 'Frank Ruhl Libre' }], text, 200);
    const plan = createTextItemShapingPlan(item, makeOptions(text, graphemes, scriptRuns, sourceRuns));
    assertEq(plan.graphemes[0].coverageCodePoints, [0x05D0]);
    assertEq(plan.graphemes[0].text, text);
    assertEq(plan.scriptRuns[0].text, text);
    assertEq(plan.scriptRuns[0].graphemes[0].coverageCodePoints, [0x05D0]);
  });

  it('retains an explicit diagnostic when the font resolver uses its configured fallback', () => {
    const text = 'אב';
    const graphemes = [
      { start: 0, end: 1, text: 'א', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true },
      { start: 1, end: 2, text: 'ב', script: 'Hebr', status: 'strong', direction: 'rtl', bidiLevel: 1, shapeable: true }
    ];
    const scriptRuns = [{ start: 0, end: 2, text, script: 'Hebr', direction: 'rtl', bidiLevel: 1, graphemeStart: 0, graphemeEnd: 2 }];
    const sourceRuns = [{ kind: 'shape', start: 0, end: 2, text }];
    const item = baseItem([{ text, sourceStart: 100, sourceEnd: 102, fontFamily: 'NotRegistered' }], text);
    const options = makeOptions(text, graphemes, scriptRuns, sourceRuns, {
      fallbacksByFamily: { NotRegistered: ['David Libre'] },
      defaultFamily: 'Frank Ruhl Libre'
    });
    const plan = createTextItemShapingPlan(item, options);
    assertEq(plan.scriptRuns[0].font.fontId, 'fnt-22222222222222');
    assertEq(plan.diagnostics[0].code, 'font-fallback');
  });
});

report('TextItem Shaping Plan');
