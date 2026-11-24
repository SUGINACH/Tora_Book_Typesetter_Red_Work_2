// red-build/tests/unit/text-item-shaping-plan.test.js
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { createTextItemShapingPlan } = require('../../src/engine/typography/text-item-shaping-plan');

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
      return { text, utf16Length: text.length, graphemes, scriptRuns,
        sourceRuns: enrichedSourceRuns,
        nonShapingRuns: enrichedSourceRuns.filter((run) => run.kind !== 'shape') };
    }
  };
}

function makeResolver() {
  const records = {
    'Frank Ruhl Libre': { fontId: 'fnt-11111111111111', sourceHash: '1'.repeat(64), unitsPerEm: 1000, font: { unitsPerEm: 1000, bytes: Uint8Array.from([1, 2, 3]) } },
    'David Libre': { fontId: 'fnt-22222222222222', sourceHash: '2'.repeat(64), unitsPerEm: 2048, font: { unitsPerEm: 2048, bytes: Uint8Array.from([4, 5, 6]) } }
  };
  return {
    resolveFont(alias, options) {
      const configuredFallback = options && Array.isArray(options.fallbacks)
        ? options.fallbacks.find((family) => records[family])
        : null;
      const actual = records[alias] ? alias : (configuredFallback || (options && options.defaultFamily));
      if (!actual || !records[actual]) return { ok: false, code: 'font-unavailable', message: 'missing test font' };
      const fallbackUsed = actual !== alias;
      return { ok: true, fontId: records[actual].fontId, record: records[actual], fallbackUsed,
        fallbackChain: [{ alias, chosen: false }, { alias: actual, chosen: true }],
        diagnostics: fallbackUsed ? [{ code: 'font-not-registered', alias }] : [] };
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
      fontResolver: { resolveFont() { resolveCalls++; return { ok: false, code: 'font-unavailable' }; } },
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
