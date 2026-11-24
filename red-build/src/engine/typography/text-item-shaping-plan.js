// red-build/src/engine/typography/text-item-shaping-plan.js
// Paragraph-level itemization + font/style run projection, before word splitting.
'use strict';

const PLAN_VERSION = 'text-item-shaping-plan-v1';

function fail(code, message) {
  const error = new TypeError(message);
  error.code = code;
  throw error;
}

function isRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function requireRecord(value, code, label) {
  if (!isRecord(value)) fail(code, label + ' must be a plain object');
  return value;
}

function requireString(value, code, label) {
  if (typeof value !== 'string' || !value.length) fail(code, label + ' must be a non-empty string');
  return value;
}

function requireRange(value, label, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) fail('invalid-source-range', label + ' is invalid');
  return value;
}

function normalizeFeatures(value, script) {
  if (!Array.isArray(value)) {
    fail('missing-script-features', 'An explicit feature array (possibly []) is required for Script ' + script);
  }
  const seen = new Set();
  return value.map((feature, index) => {
    requireRecord(feature, 'invalid-open-type-feature', 'featuresByScript.' + script + '[' + index + ']');
    const tag = requireString(feature.tag, 'invalid-open-type-feature', 'feature.tag');
    if (!/^[A-Za-z0-9]{4}$/.test(tag) || seen.has(tag)) {
      fail('invalid-open-type-feature', 'OpenType feature tag must be unique and exactly four ASCII characters');
    }
    seen.add(tag);
    if (!Number.isFinite(feature.value)) {
      fail('invalid-open-type-feature', 'OpenType feature value must be finite');
    }
    return { tag, value: feature.value };
  });
}

function normalizeAxes(value, fontId) {
  if (!Array.isArray(value)) {
    fail('missing-variation-axes', 'An explicit variation-axis array (possibly []) is required for font ' + fontId);
  }
  const seen = new Set();
  return value.map((axis, index) => {
    requireRecord(axis, 'invalid-variation-axis', 'variationAxesByFontId.' + fontId + '[' + index + ']');
    const tag = requireString(axis.tag, 'invalid-variation-axis', 'variation axis tag');
    if (!/^[A-Za-z0-9]{4}$/.test(tag) || seen.has(tag) || !Number.isFinite(axis.value)) {
      fail('invalid-variation-axis', 'Variation axes require unique four-character tags and finite values');
    }
    seen.add(tag);
    return { tag, value: axis.value };
  });
}

function normalizeStyleRuns(item, text) {
  const input = item.payload && item.payload.runs;
  if (!Array.isArray(input) || !input.length) {
    fail('text-item-no-style-runs', 'TextItem must contain one or more inline style/font runs');
  }
  const firstSourceStart = Number.isSafeInteger(input[0].sourceStart) ? input[0].sourceStart : 0;
  let expectedLocalStart = 0;
  return input.map((entry, index) => {
    const run = requireRecord(entry, 'invalid-inline-style-run', 'payload.runs[' + index + ']');
    const runText = String(run.text == null ? '' : run.text);
    if (!runText.length) fail('empty-inline-style-run', 'Empty inline style runs are not valid in a TextItem');
    const sourceStart = run.sourceStart == null ? firstSourceStart + expectedLocalStart : requireRange(run.sourceStart, 'run.sourceStart');
    const sourceEnd = run.sourceEnd == null ? sourceStart + runText.length : requireRange(run.sourceEnd, 'run.sourceEnd', 1);
    const localStart = sourceStart - firstSourceStart;
    const localEnd = sourceEnd - firstSourceStart;
    if (localStart !== expectedLocalStart || localEnd - localStart !== runText.length ||
        text.slice(localStart, localEnd) !== runText) {
      fail('inline-style-source-partition', 'Inline style runs must form an exact ordered partition of TextItem.text');
    }
    expectedLocalStart = localEnd;
    return {
      index,
      localStart,
      localEnd,
      text: runText,
      fontFamily: run.fontFamily == null ? null : requireString(run.fontFamily, 'invalid-font-family', 'fontFamily')
    };
  }).map((run, index, all) => {
    if (index === all.length - 1 && run.localEnd !== text.length) {
      fail('inline-style-incomplete-coverage', 'Inline style runs do not cover TextItem.text');
    }
    return run;
  });
}

function validateItemization(text, result) {
  if (!result || result.text !== text || result.utf16Length !== text.length ||
      !Array.isArray(result.graphemes) || !Array.isArray(result.scriptRuns) ||
      !Array.isArray(result.sourceRuns) || !Array.isArray(result.nonShapingRuns)) {
    fail('invalid-itemizer-result', 'Canonical Unicode itemizer returned an incomplete or mismatched result');
  }

  let expected = 0;
  for (let index = 0; index < result.graphemes.length; index++) {
    const grapheme = result.graphemes[index];
    if (!grapheme || grapheme.start !== expected || !Number.isSafeInteger(grapheme.end) ||
        grapheme.end <= grapheme.start || grapheme.end > text.length ||
        grapheme.text !== text.slice(grapheme.start, grapheme.end)) {
      fail('invalid-grapheme-partition', 'Itemizer graphemes are not an exact contiguous UTF-16 partition at index ' + index);
    }
    expected = grapheme.end;
  }
  if (expected !== text.length) fail('incomplete-grapheme-coverage', 'Itemizer graphemes do not cover the complete TextItem');

  expected = 0;
  for (let index = 0; index < result.sourceRuns.length; index++) {
    const run = result.sourceRuns[index];
    if (!run || run.start !== expected || !Number.isSafeInteger(run.end) ||
        run.end <= run.start || run.end > text.length ||
        run.text !== text.slice(run.start, run.end)) {
      fail('invalid-source-partition', 'Itemizer sourceRuns are not a lossless contiguous partition at index ' + index);
    }
    if (!['shape', 'bidi-control', 'non-shaping-bidi-mixed', 'unresolved'].includes(run.kind)) {
      fail('invalid-source-run-kind', 'Itemizer returned an unknown source run kind: ' + run.kind);
    }
    expected = run.end;
  }
  if (expected !== text.length) fail('incomplete-source-coverage', 'Itemizer sourceRuns do not cover the complete TextItem');

  for (let index = 0; index < result.scriptRuns.length; index++) {
    const run = result.scriptRuns[index];
    if (!run || !Number.isSafeInteger(run.start) || !Number.isSafeInteger(run.end) ||
        run.start < 0 || run.end <= run.start || run.end > text.length ||
        !Number.isSafeInteger(run.graphemeStart) || !Number.isSafeInteger(run.graphemeEnd) ||
        run.graphemeStart < 0 || run.graphemeEnd <= run.graphemeStart ||
        run.graphemeEnd > result.graphemes.length ||
        run.text !== text.slice(run.start, run.end) ||
        result.graphemes[run.graphemeStart].start !== run.start ||
        result.graphemes[run.graphemeEnd - 1].end !== run.end) {
      fail('invalid-script-run', 'Itemizer ScriptRun has an invalid source or grapheme range at index ' + index);
    }
    for (let gi = run.graphemeStart; gi < run.graphemeEnd; gi++) {
      const grapheme = result.graphemes[gi];
      if (grapheme.shapeable !== true || grapheme.containsBidiControl || grapheme.isBidiControl) {
        fail('non-shapeable-in-script-run', 'A non-shapeable grapheme entered ScriptRun ' + index);
      }
    }
  }
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

/**
 * Build the paragraph-level shaping plan before splitTextItem.
 * No glyph metrics are generated here. The output is the deterministic,
 * source-mapped plan consumed by the initialized HarfBuzz runtime.
 */
function createTextItemShapingPlan(item, options = {}) {
  requireRecord(item, 'invalid-text-item', 'TextItem');
  if (item.kind !== 'text') fail('invalid-text-item-kind', 'Shaping plan accepts only TextItem');
  const bidiRuntime = options.bidiRuntime;
  if (!bidiRuntime || typeof bidiRuntime.resolve !== 'function' ||
      typeof bidiRuntime.itemizeScripts !== 'function') {
    fail('missing-unicode-runtime', 'Pinned Bidi/Grapheme runtime is required');
  }
  const fontResolver = options.fontResolver;
  if (!fontResolver || typeof fontResolver.resolveFont !== 'function') {
    fail('missing-font-resolver', 'Canonical fontResolver is required');
  }

  const runs = item.payload && item.payload.runs;
  const text = Array.isArray(runs) ? runs.map((run) => String(run.text == null ? '' : run.text)).join('') : '';
  if (!text.length) fail('empty-text-item', 'TextItem has no shaping text');
  const source = requireRecord(item.sourceRange, 'invalid-text-item-source-range', 'TextItem.sourceRange');
  const sourceStart = requireRange(source.start, 'TextItem.sourceRange.start');
  const sourceEnd = requireRange(source.end, 'TextItem.sourceRange.end', 1);
  if (sourceEnd - sourceStart !== text.length) {
    fail('text-item-source-length-mismatch', 'TextItem sourceRange must cover its concatenated inline runs in UTF-16 units');
  }

  const styleRuns = normalizeStyleRuns(item, text);
  const direction = options.direction;
  if (direction !== 'ltr' && direction !== 'rtl') {
    fail('missing-base-direction', 'Base paragraph direction must be explicit (ltr or rtl)');
  }
  const languageByScript = requireRecord(options.languageByScript, 'missing-script-languages', 'languageByScript');
  const featuresByScript = requireRecord(options.featuresByScript, 'missing-script-features', 'featuresByScript');
  const variationAxesByFontId = requireRecord(options.variationAxesByFontId, 'missing-variation-axes', 'variationAxesByFontId');
  const faceIndexByFontId = options.faceIndexByFontId == null
    ? Object.create(null)
    : requireRecord(options.faceIndexByFontId, 'invalid-face-index-map', 'faceIndexByFontId');
  const fallbacksByFamily = options.fallbacksByFamily == null
    ? Object.create(null)
    : requireRecord(options.fallbacksByFamily, 'invalid-font-fallback-map', 'fallbacksByFamily');
  const resolved = bidiRuntime.resolve(text, direction);
  const itemization = bidiRuntime.itemizeScripts(text, resolved);
  validateItemization(text, itemization);

  const resolvedStyleRuns = styleRuns.map((styleRun) => {
    const requestedFamily = styleRun.fontFamily || options.defaultFamily || null;
    const fallbacks = requestedFamily && Array.isArray(fallbacksByFamily[requestedFamily])
      ? fallbacksByFamily[requestedFamily]
      : [];
    const resolution = fontResolver.resolveFont(requestedFamily, {
      defaultFamily: options.defaultFamily || null,
      fallbacks
    });
    if (!resolution.ok || !resolution.record || !resolution.record.font ||
        !resolution.record.font.bytes || !resolution.record.font.bytes.length) {
      fail('font-unavailable-for-shaping',
        'Cannot create a ShapedRun for inline style run ' + styleRun.index + ': ' +
        (resolution.message || 'font bytes are unavailable'));
    }
    const fontId = requireString(resolution.fontId, 'invalid-resolved-font', 'resolved fontId');
    const variationAxes = normalizeAxes(variationAxesByFontId[fontId], fontId);
    const faceIndex = faceIndexByFontId[fontId] == null
      ? 0
      : requireRange(faceIndexByFontId[fontId], 'faceIndexByFontId.' + fontId);
    return {
      ...styleRun,
      requestedFamily,
      fontId,
      faceIndex,
      unitsPerEm: resolution.record.unitsPerEm,
      variationAxes,
      fallbackUsed: !!resolution.fallbackUsed,
      fallbackChain: resolution.fallbackChain || [],
      diagnostics: resolution.diagnostics || []
    };
  });

  const graphemeStyleIndexes = itemization.graphemes.map((grapheme, graphemeIndex) => {
    const matches = resolvedStyleRuns.filter((run) =>
      run.localStart <= grapheme.start && grapheme.end <= run.localEnd);
    if (matches.length !== 1) {
      const overlaps = resolvedStyleRuns.filter((run) =>
        run.localStart < grapheme.end && grapheme.start < run.localEnd);
      if (overlaps.length > 1) {
        fail('style-boundary-splits-grapheme',
          'Inline font/style boundary falls inside extended grapheme ' + graphemeIndex +
          ' [' + grapheme.start + ',' + grapheme.end + ')');
      }
      fail('grapheme-without-font-run',
        'Extended grapheme ' + graphemeIndex + ' is not covered by exactly one font/style run');
    }
    return matches[0].index;
  });

  const plannedRuns = [];
  for (let scriptRunIndex = 0; scriptRunIndex < itemization.scriptRuns.length; scriptRunIndex++) {
    const scriptRun = itemization.scriptRuns[scriptRunIndex];
    const language = languageByScript[scriptRun.script];
    if (typeof language !== 'string' || !language.trim()) {
      fail('missing-script-language', 'No explicit language provided for Script ' + scriptRun.script);
    }
    const features = normalizeFeatures(featuresByScript[scriptRun.script], scriptRun.script);
    let group = null;
    const flush = () => {
      if (!group) return;
      const first = itemization.graphemes[group.graphemeStart];
      const last = itemization.graphemes[group.graphemeEnd - 1];
      const localStart = first.start;
      const localEnd = last.end;
      plannedRuns.push({
        id: item.id + '#shape:' + (sourceStart + localStart) + '-' + (sourceStart + localEnd) + ':' + group.fontId,
        sourceRange: {
          coordinateSpace: 'document-utf16',
          start: sourceStart + localStart,
          end: sourceStart + localEnd,
          ...(source.docId != null ? { docId: source.docId } : {}),
          ...(source.blockId != null ? { blockId: source.blockId } : {}),
          itemId: item.id,
          runIndex: group.styleRunIndex
        },
        localRange: { start: localStart, end: localEnd },
        text: text.slice(localStart, localEnd),
        script: scriptRun.script,
        language,
        direction: scriptRun.direction,
        bidiLevel: scriptRun.bidiLevel,
        bot: localStart === 0,
        eot: localEnd === text.length,
        graphemeStart: group.graphemeStart,
        graphemeEnd: group.graphemeEnd,
        graphemes: itemization.graphemes.slice(group.graphemeStart, group.graphemeEnd).map((grapheme) => ({
          start: sourceStart + grapheme.start,
          end: sourceStart + grapheme.end,
          text: grapheme.text
        })),
        font: {
          fontId: group.fontId,
          faceIndex: group.faceIndex,
          unitsPerEm: group.unitsPerEm,
          variationAxes: group.variationAxes
        },
        features,
        fallbackUsed: group.fallbackUsed,
        fallbackChain: group.fallbackChain
      });
      group = null;
    };

    for (let graphemeIndex = scriptRun.graphemeStart; graphemeIndex < scriptRun.graphemeEnd; graphemeIndex++) {
      const styleRunIndex = graphemeStyleIndexes[graphemeIndex];
      const styleRun = resolvedStyleRuns[styleRunIndex];
      const canMerge = group &&
        group.graphemeEnd === graphemeIndex &&
        group.fontId === styleRun.fontId &&
        group.faceIndex === styleRun.faceIndex &&
        JSON.stringify(group.variationAxes) === JSON.stringify(styleRun.variationAxes);
      if (!canMerge) {
        flush();
        group = {
          styleRunIndex,
          fontId: styleRun.fontId,
          faceIndex: styleRun.faceIndex,
          unitsPerEm: styleRun.unitsPerEm,
          variationAxes: styleRun.variationAxes,
          fallbackUsed: styleRun.fallbackUsed,
          fallbackChain: styleRun.fallbackChain,
          graphemeStart: graphemeIndex,
          graphemeEnd: graphemeIndex + 1
        };
      } else {
        group.graphemeEnd = graphemeIndex + 1;
        if (styleRunIndex !== group.styleRunIndex) group.styleRunIndex = styleRunIndex;
      }
    }
    flush();
  }

  const diagnostics = [];
  for (const run of resolvedStyleRuns) {
    if (run.fallbackUsed) {
      diagnostics.push({
        code: 'font-fallback',
        itemId: item.id,
        requestedFamily: run.requestedFamily,
        fontId: run.fontId,
        fallbackChain: run.fallbackChain
      });
    }
  }
  const nonShapingRuns = itemization.nonShapingRuns.map((run) => ({
    ...run,
    start: sourceStart + run.start,
    end: sourceStart + run.end
  }));
  const sourceRuns = itemization.sourceRuns.map((run) => ({
    ...run,
    start: sourceStart + run.start,
    end: sourceStart + run.end
  }));

  return deepFreeze({
    kind: 'TextItemShapingPlan',
    version: PLAN_VERSION,
    itemId: item.id,
    text,
    sourceRange: { ...source, coordinateSpace: 'document-utf16' },
    unicodeVersion: itemization.unicodeVersion,
    direction,
    graphemes: itemization.graphemes.map((grapheme) => ({
      start: sourceStart + grapheme.start,
      end: sourceStart + grapheme.end,
      text: grapheme.text,
      script: grapheme.script || null,
      status: grapheme.status,
      direction: grapheme.direction || null,
      bidiLevel: grapheme.bidiLevel,
      shapeable: grapheme.shapeable === true,
      containsBidiControl: !!grapheme.containsBidiControl,
      isBidiControl: !!grapheme.isBidiControl
    })),
    scriptRuns: plannedRuns,
    nonShapingRuns,
    sourceRuns,
    diagnostics
  });
}

module.exports = { PLAN_VERSION, createTextItemShapingPlan };
