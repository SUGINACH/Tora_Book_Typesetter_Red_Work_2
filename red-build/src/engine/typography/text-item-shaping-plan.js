// red-build/src/engine/typography/text-item-shaping-plan.js
// Paragraph-level itemization + font/style run projection, before word splitting.
'use strict';

const PLAN_VERSION = 'text-item-shaping-plan-v3-source-map';

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

function normalizeStyleRuns(item, text, sourceRange) {
  const input = item.payload && item.payload.runs;
  if (!Array.isArray(input) || !input.length) {
    fail('text-item-no-style-runs', 'TextItem must contain one or more inline style/font runs');
  }
  if (!isRecord(input[0])) fail('invalid-inline-style-run', 'payload.runs[0] must be a plain object');
  const firstSourceStart = input[0].sourceStart == null
    ? 0 : requireRange(input[0].sourceStart, 'run.sourceStart');
  const documentBase = sourceRange.start - firstSourceStart;
  let localCursor = 0;
  let previousSourceEnd = firstSourceStart;
  const normalized = input.map((entry, index) => {
    const run = requireRecord(entry, 'invalid-inline-style-run', 'payload.runs[' + index + ']');
    if (typeof run.text !== 'string') fail('invalid-inline-style-run-text', 'Inline style run text must be a string');
    const runText = run.text;
    if (!runText.length) fail('empty-inline-style-run', 'Empty inline style runs are not valid in a TextItem');
    const sourceStart = run.sourceStart == null
      ? previousSourceEnd : requireRange(run.sourceStart, 'run.sourceStart');
    const sourceEnd = run.sourceEnd == null
      ? sourceStart + runText.length : requireRange(run.sourceEnd, 'run.sourceEnd', 1);
    if (sourceStart < previousSourceEnd || sourceEnd - sourceStart !== runText.length ||
        text.slice(localCursor, localCursor + runText.length) !== runText) {
      fail('inline-style-source-partition',
        'Inline style runs must form an ordered local-text partition with monotone, length-preserving source ranges');
    }
    const localStart = localCursor;
    const localEnd = localStart + runText.length;
    const absoluteStart = documentBase + sourceStart;
    const absoluteEnd = documentBase + sourceEnd;
    if (absoluteStart < sourceRange.start || absoluteEnd > sourceRange.end) {
      fail('inline-style-source-outside-item',
        'Inline style source range falls outside the TextItem source envelope at run ' + index);
    }
    localCursor = localEnd;
    previousSourceEnd = sourceEnd;
    return {
      index, localStart, localEnd,
      sourceRange: { start: absoluteStart, end: absoluteEnd },
      text: runText,
      fontFamily: run.fontFamily == null ? null : requireString(run.fontFamily, 'invalid-font-family', 'fontFamily')
    };
  });
  if (localCursor !== text.length) {
    fail('inline-style-incomplete-coverage', 'Inline style runs do not cover TextItem.text');
  }
  return normalized;
}

function mapLocalRangeToSourceSegments(styleRuns, localStart, localEnd) {
  if (!Number.isSafeInteger(localStart) || !Number.isSafeInteger(localEnd) ||
      localStart < 0 || localEnd <= localStart) {
    fail('invalid-local-source-map-range', 'Local source-map range must be a non-empty UTF-16 range');
  }
  const mapped = [];
  let expectedLocal = localStart;
  for (const run of styleRuns) {
    const start = Math.max(localStart, run.localStart);
    const end = Math.min(localEnd, run.localEnd);
    if (end <= start) continue;
    if (start !== expectedLocal) {
      fail('incomplete-local-source-map', 'Inline style runs leave a local source-map gap at ' + expectedLocal);
    }
    const sourceStart = run.sourceRange.start + (start - run.localStart);
    const sourceEnd = run.sourceRange.start + (end - run.localStart);
    const previous = mapped[mapped.length - 1];
    if (previous && previous.localRange.end === start && previous.sourceRange.end === sourceStart) {
      previous.localRange.end = end;
      previous.sourceRange.end = sourceEnd;
      previous.styleRunIndexes.push(run.index);
    } else {
      mapped.push({
        localRange: { start, end },
        sourceRange: { start: sourceStart, end: sourceEnd },
        styleRunIndexes: [run.index]
      });
    }
    expectedLocal = end;
  }
  if (expectedLocal !== localEnd) {
    fail('incomplete-local-source-map', 'Inline style runs do not map the complete local range');
  }
  return mapped;
}

function codePointForScalarRange(text, start, end, label) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end <= start || end > text.length) {
    fail('invalid-grapheme-scalar-partition', label + ' has an invalid UTF-16 scalar range');
  }
  const codePoint = text.codePointAt(start);
  const expectedWidth = codePoint > 0xFFFF ? 2 : 1;
  if (end - start !== expectedWidth) {
    fail('invalid-grapheme-scalar-partition', label + ' does not describe exactly one Unicode scalar');
  }
  const scalarText = text.slice(start, end);
  if (scalarText.length !== expectedWidth ||
      (expectedWidth === 2 && !(scalarText.charCodeAt(0) >= 0xD800 && scalarText.charCodeAt(0) <= 0xDBFF &&
        scalarText.charCodeAt(1) >= 0xDC00 && scalarText.charCodeAt(1) <= 0xDFFF)) ||
      (expectedWidth === 1 && scalarText.charCodeAt(0) >= 0xD800 && scalarText.charCodeAt(0) <= 0xDFFF)) {
    fail('invalid-grapheme-scalar-partition', label + ' contains an invalid or split UTF-16 scalar');
  }
  return codePoint;
}

function requiredCodePointsForGrapheme(text, grapheme, graphemeIndex) {
  if (!Array.isArray(grapheme.scalars) || !grapheme.scalars.length) {
    fail('missing-grapheme-scalars',
      'Unicode itemizer must provide scalar-level Default_Ignorable_Code_Point data for EGC ' + graphemeIndex);
  }
  const required = [];
  let expected = grapheme.start;
  for (let scalarIndex = 0; scalarIndex < grapheme.scalars.length; scalarIndex++) {
    const scalar = grapheme.scalars[scalarIndex];
    if (!scalar || scalar.start !== expected || !Number.isSafeInteger(scalar.end) ||
        scalar.end <= scalar.start || scalar.end > grapheme.end ||
        typeof scalar.isDefaultIgnorable !== 'boolean') {
      fail('invalid-grapheme-scalar-partition',
        'Unicode scalar records are not an exact contiguous partition of EGC ' + graphemeIndex +
        ' at scalar ' + scalarIndex);
    }
    const codePoint = codePointForScalarRange(
      text, scalar.start, scalar.end, 'EGC ' + graphemeIndex + ' scalar ' + scalarIndex
    );
    if (scalar.isDefaultIgnorable !== true) required.push(codePoint);
    expected = scalar.end;
  }
  if (expected !== grapheme.end) {
    fail('invalid-grapheme-scalar-partition',
      'Unicode scalar records do not cover the complete EGC ' + graphemeIndex);
  }
  return required;
}

function validateItemization(text, result) {
  if (!result || result.text !== text || result.utf16Length !== text.length ||
      !Array.isArray(result.graphemes) || !Array.isArray(result.scriptRuns) ||
      !Array.isArray(result.sourceRuns) || !Array.isArray(result.nonShapingRuns)) {
    fail('invalid-itemizer-result', 'Canonical Unicode itemizer returned an incomplete or mismatched result');
  }
  let expected = 0;
  for (let index = 0; index < result.graphemes.length; index++) {
    const g = result.graphemes[index];
    if (!g || g.start !== expected || !Number.isSafeInteger(g.end) || g.end <= g.start ||
        g.end > text.length || g.text !== text.slice(g.start,g.end) || typeof g.shapeable !== 'boolean') {
      fail('invalid-grapheme-partition', 'Itemizer graphemes are not an exact contiguous UTF-16 partition at index ' + index);
    }
    requiredCodePointsForGrapheme(text, g, index);
    if (g.shapeable && (g.containsBidiControl || g.isBidiControl)) {
      fail('invalid-shapeable-bidi-control', 'Bidi_Control grapheme cannot be shapeable');
    }
    expected = g.end;
  }
  if (!result.graphemes.length || expected !== text.length) {
    fail('incomplete-grapheme-coverage', 'Itemizer graphemes do not cover the complete TextItem');
  }
  expected = 0;
  const projectedShape = [], projectedNonShaping = [];
  for (let index=0; index<result.sourceRuns.length; index++) {
    const run=result.sourceRuns[index];
    if (!run || run.start!==expected || !Number.isSafeInteger(run.end) ||
        run.end<=run.start || run.end>text.length || run.text!==text.slice(run.start,run.end)) {
      fail('invalid-source-partition', 'Itemizer sourceRuns are not a lossless contiguous partition at index '+index);
    }
    if (run.kind==='shape') projectedShape.push(run);
    else if (['bidi-control','non-shaping-bidi-mixed','unresolved'].includes(run.kind)) projectedNonShaping.push(run);
    else fail('invalid-source-run-kind','Itemizer returned an unknown source run kind: '+run.kind);
    expected=run.end;
  }
  if (expected!==text.length) fail('incomplete-source-coverage','Itemizer sourceRuns do not cover the complete TextItem');
  if (projectedNonShaping.length!==result.nonShapingRuns.length) {
    fail('non-shaping-run-projection-mismatch','nonShapingRuns must be the non-shape projection of sourceRuns');
  }
  for(let i=0;i<projectedNonShaping.length;i++){
    const a=projectedNonShaping[i],b=result.nonShapingRuns[i];
    if(!b||a.start!==b.start||a.end!==b.end||a.kind!==b.kind||a.text!==b.text)
      fail('non-shaping-run-projection-mismatch','nonShapingRuns differ from sourceRuns at index '+i);
  }
  const covered=new Set();
  let previousEnd=0;
  for(let index=0;index<result.scriptRuns.length;index++){
    const r=result.scriptRuns[index];
    if(!r||!Number.isSafeInteger(r.start)||!Number.isSafeInteger(r.end)||
       r.start<previousEnd||r.end<=r.start||r.end>text.length||
       !/^[A-Za-z]{4}$/.test(r.script||'')||
       !['ltr','rtl'].includes(r.direction)||
       !Number.isSafeInteger(r.bidiLevel)||r.bidiLevel<0||
       ((r.bidiLevel%2===1)!==(r.direction==='rtl'))||
       !Number.isSafeInteger(r.graphemeStart)||!Number.isSafeInteger(r.graphemeEnd)||
       r.graphemeStart<0||r.graphemeEnd<=r.graphemeStart||r.graphemeEnd>result.graphemes.length||
       r.text!==text.slice(r.start,r.end)||
       result.graphemes[r.graphemeStart].start!==r.start||
       result.graphemes[r.graphemeEnd-1].end!==r.end){
      fail('invalid-script-run','Itemizer ScriptRun has an invalid source, Script, direction or Bidi range at index '+index);
    }
    for(let gi=r.graphemeStart;gi<r.graphemeEnd;gi++){
      const g=result.graphemes[gi];
      if(!g.shapeable||g.containsBidiControl||g.isBidiControl||covered.has(gi))
        fail('non-shapeable-in-script-run','Non-shapeable or duplicate grapheme entered ScriptRun '+index);
      covered.add(gi);
    }
    previousEnd=r.end;
  }
  for(let i=0;i<result.graphemes.length;i++){
    if(result.graphemes[i].shapeable!==covered.has(i))
      fail('script-run-coverage-mismatch','ScriptRuns do not cover exactly the shapeable EGCs; grapheme '+i);
  }
  if(projectedShape.length!==result.scriptRuns.length)
    fail('script-run-projection-mismatch','scriptRuns must be the shape projection of sourceRuns');
  for(let i=0;i<projectedShape.length;i++){
    const a=projectedShape[i],b=result.scriptRuns[i];
    if(a.start!==b.start||a.end!==b.end||a.text!==b.text||
       a.script!==b.script||a.direction!==b.direction||a.bidiLevel!==b.bidiLevel||
       a.graphemeStart!==b.graphemeStart||a.graphemeEnd!==b.graphemeEnd)
      fail('script-run-projection-mismatch','scriptRuns differ from sourceRuns at index '+i);
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
  if (!fontResolver || typeof fontResolver.resolveFontForGrapheme !== 'function') {
    fail('missing-font-resolver', 'Canonical fontResolver with whole-grapheme coverage resolution is required');
  }

  const runs = item.payload && item.payload.runs;
  const text = Array.isArray(runs) ? runs.map((run) => String(run.text == null ? '' : run.text)).join('') : '';
  if (!text.length) fail('empty-text-item', 'TextItem has no shaping text');
  const source = requireRecord(item.sourceRange, 'invalid-text-item-source-range', 'TextItem.sourceRange');
  const sourceStart = requireRange(source.start, 'TextItem.sourceRange.start');
  const sourceEnd = requireRange(source.end, 'TextItem.sourceRange.end', 1);
  if (sourceEnd <= sourceStart) {
    fail('text-item-source-length-mismatch', 'TextItem sourceRange must be a non-empty document UTF-16 envelope');
  }

  const styleRuns = normalizeStyleRuns(item, text, source);
  const sourceSegments = styleRuns.map((run) => ({
    localRange: { start: run.localStart, end: run.localEnd },
    sourceRange: { ...run.sourceRange },
    styleRunIndexes: [run.index]
  }));
  const mapLocalRange = (start, end) => mapLocalRangeToSourceSegments(styleRuns, start, end);
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

  // Validate all shaping policies before resolving or opening font faces.
  // A malformed/missing language/feature policy must fail independently of
  // whether the requested font is installed in this runtime.
  const shapingConfigByScript = new Map();
  for (const scriptRun of itemization.scriptRuns) {
    if (!shapingConfigByScript.has(scriptRun.script)) {
      const language = languageByScript[scriptRun.script];
      if (typeof language !== 'string' || !language.trim()) {
        fail('missing-script-language', 'No explicit language provided for Script ' + scriptRun.script);
      }
      shapingConfigByScript.set(scriptRun.script, {
        language,
        features: normalizeFeatures(featuresByScript[scriptRun.script], scriptRun.script)
      });
    }
  }

  const graphemeStyleIndexes = itemization.graphemes.map((grapheme, graphemeIndex) => {
    const matches = styleRuns.filter((run) => run.localStart <= grapheme.start && grapheme.end <= run.localEnd);
    if (matches.length !== 1) {
      const overlaps = styleRuns.filter((run) => run.localStart < grapheme.end && grapheme.start < run.localEnd);
      if (overlaps.length > 1) {
        fail('style-boundary-splits-grapheme',
          'Inline font/style boundary falls inside extended grapheme ' + graphemeIndex +
          ' [' + grapheme.start + ',' + grapheme.end + ')');
      }
      fail('grapheme-without-font-run','Extended grapheme ' + graphemeIndex + ' is not covered by exactly one inline style run');
    }
    return matches[0].index;
  });
  const graphemeSourceRanges = itemization.graphemes.map((grapheme, graphemeIndex) => {
    const mapped = mapLocalRange(grapheme.start, grapheme.end);
    if (mapped.length !== 1) {
      fail('grapheme-source-range-discontiguous',
        'A single EGC must map to one contiguous document source range; grapheme ' + graphemeIndex);
    }
    return {
      localRange: { start: grapheme.start, end: grapheme.end },
      sourceRange: { ...mapped[0].sourceRange },
      styleRunIndexes: mapped[0].styleRunIndexes.slice()
    };
  });

  // Resolve each shapeable EGC independently. A font transition may occur only
  // between EGCs; no base/mark/ZWJ sequence is ever split to satisfy cmap.
  const resolvedGraphemeFonts = new Array(itemization.graphemes.length).fill(null);
  for (let graphemeIndex = 0; graphemeIndex < itemization.graphemes.length; graphemeIndex++) {
    const grapheme = itemization.graphemes[graphemeIndex];
    if (!grapheme.shapeable) continue;
    const styleRunIndex = graphemeStyleIndexes[graphemeIndex];
    const styleRun = styleRuns[styleRunIndex];
    const requestedFamily = styleRun.fontFamily || options.defaultFamily || null;
    const configuredFallbacks = requestedFamily == null ? null : fallbacksByFamily[requestedFamily];
    if (configuredFallbacks != null && !Array.isArray(configuredFallbacks)) {
      fail('invalid-font-fallback-map', 'Fallbacks for family ' + requestedFamily + ' must be an ordered array');
    }
    const fallbacks = configuredFallbacks || [];
    const coverageCodePoints = requiredCodePointsForGrapheme(text, grapheme, graphemeIndex);
    const resolution = fontResolver.resolveFontForGrapheme(requestedFamily, coverageCodePoints, {
      defaultFamily: options.defaultFamily || null,
      fallbacks
    });
    if (!resolution.ok || !resolution.record || !resolution.record.font ||
        !resolution.record.font.bytes || !resolution.record.font.bytes.length) {
      fail('font-unavailable-for-grapheme',
        'No registered font covers every required scalar in EGC ' + graphemeIndex +
        ' [' + graphemeSourceRanges[graphemeIndex].sourceRange.start + ',' + graphemeSourceRanges[graphemeIndex].sourceRange.end + '): ' +
        (resolution.message || 'font bytes are unavailable'));
    }
    const fontId = requireString(resolution.fontId, 'invalid-resolved-font', 'resolved fontId');
    const sourceHash = requireString(resolution.record.sourceHash, 'missing-font-source-hash', 'resolved font SHA-256');
    if (!/^[0-9a-f]{64}$/i.test(sourceHash)) {
      fail('invalid-font-source-hash', 'Resolved font sourceHash must be a 64-character SHA-256');
    }
    const unitsPerEm = requireRange(resolution.record.unitsPerEm, 'resolved font unitsPerEm', 1);
    if (resolution.record.font.unitsPerEm !== unitsPerEm) {
      fail('font-units-per-em-mismatch', 'FontResolver record and parsed font UPEM disagree for ' + fontId);
    }
    const variationAxes = normalizeAxes(variationAxesByFontId[fontId], fontId);
    const faceIndex = faceIndexByFontId[fontId] == null
      ? 0 : requireRange(faceIndexByFontId[fontId], 'faceIndexByFontId.' + fontId);
    resolvedGraphemeFonts[graphemeIndex] = {
      localRange: graphemeSourceRanges[graphemeIndex].localRange,
      sourceRange: graphemeSourceRanges[graphemeIndex].sourceRange,
      styleRunIndex,
      requestedFamily,
      fontId,
      sourceHash: sourceHash.toLowerCase(),
      faceIndex,
      unitsPerEm,
      variationAxes,
      coverageCodePoints,
      fallbackUsed: resolution.fallbackUsed === true,
      fallbackChain: resolution.fallbackChain || [],
      diagnostics: resolution.diagnostics || []
    };
  }

  const plannedRuns = [];
  for (let scriptRunIndex = 0; scriptRunIndex < itemization.scriptRuns.length; scriptRunIndex++) {
    const scriptRun = itemization.scriptRuns[scriptRunIndex];
    const shapingConfig = shapingConfigByScript.get(scriptRun.script);
    const language = shapingConfig.language;
    const features = shapingConfig.features;
    let group = null;
    const flush = () => {
      if (!group) return;
      const first = resolvedGraphemeFonts[group.graphemeStart];
      const last = resolvedGraphemeFonts[group.graphemeEnd - 1];
      const localStart = first.localRange.start;
      const localEnd = last.localRange.end;
      const absoluteStart = first.sourceRange.start;
      const absoluteEnd = last.sourceRange.end;
      plannedRuns.push({
        id: item.id + '#shape:' + absoluteStart + '-' + absoluteEnd + ':' + group.fontId,
        sourceRange: {
          coordinateSpace: 'document-utf16',
          start: absoluteStart,
          end: absoluteEnd,
          ...(source.docId != null ? { docId: source.docId } : {}),
          ...(source.blockId != null ? { blockId: source.blockId } : {}),
          itemId: item.id
        },
        styleRunIndexes: group.styleRunIndexes.slice(),
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
        graphemes: Array.from({ length: group.graphemeEnd - group.graphemeStart }, (_, index) => {
          const graphemeIndex = group.graphemeStart + index;
          const grapheme = itemization.graphemes[graphemeIndex];
          const resolved = resolvedGraphemeFonts[graphemeIndex];
          return {
            start: resolved.sourceRange.start,
            end: resolved.sourceRange.end,
            localRange: { ...resolved.localRange },
            text: grapheme.text,
            coverageCodePoints: resolved.coverageCodePoints.slice()
          };
        }),
        font: {
          fontId: group.fontId,
          sourceHash: group.sourceHash,
          faceIndex: group.faceIndex,
          unitsPerEm: group.unitsPerEm,
          variationAxes: group.variationAxes
        },
        features,
        fallbackUsed: group.fallbackUsed,
        fallbackChains: group.fallbackChains
      });
      group = null;
    };
    for (let graphemeIndex = scriptRun.graphemeStart; graphemeIndex < scriptRun.graphemeEnd; graphemeIndex++) {
      const resolvedFont = resolvedGraphemeFonts[graphemeIndex];
      if (!resolvedFont) fail('missing-font-for-shapeable-grapheme',
        'A shapeable grapheme has no resolved font identity at index ' + graphemeIndex);
      const canMerge = group &&
        group.graphemeEnd === graphemeIndex &&
        group.lastSourceEnd === resolvedFont.sourceRange.start &&
        group.fontId === resolvedFont.fontId &&
        group.sourceHash === resolvedFont.sourceHash &&
        group.faceIndex === resolvedFont.faceIndex &&
        JSON.stringify(group.variationAxes) === JSON.stringify(resolvedFont.variationAxes);
      if (!canMerge) {
        flush();
        group = {
          styleRunIndexes: [resolvedFont.styleRunIndex],
          fontId: resolvedFont.fontId,
          sourceHash: resolvedFont.sourceHash,
          faceIndex: resolvedFont.faceIndex,
          unitsPerEm: resolvedFont.unitsPerEm,
          variationAxes: resolvedFont.variationAxes,
          fallbackUsed: resolvedFont.fallbackUsed,
          fallbackChains: resolvedFont.fallbackUsed ? [resolvedFont.fallbackChain] : [],
          graphemeStart: graphemeIndex,
          graphemeEnd: graphemeIndex + 1,
          lastSourceEnd: resolvedFont.sourceRange.end
        };
      } else {
        group.graphemeEnd = graphemeIndex + 1;
        group.lastSourceEnd = resolvedFont.sourceRange.end;
        if (!group.styleRunIndexes.includes(resolvedFont.styleRunIndex)) {
          group.styleRunIndexes.push(resolvedFont.styleRunIndex);
        }
        if (resolvedFont.fallbackUsed) group.fallbackUsed = true;
        if (resolvedFont.fallbackUsed &&
            !group.fallbackChains.some((chain) => JSON.stringify(chain) === JSON.stringify(resolvedFont.fallbackChain))) {
          group.fallbackChains.push(resolvedFont.fallbackChain);
        }
      }
    }
    flush();
  }

  const diagnostics = [];
  for (let graphemeIndex = 0; graphemeIndex < resolvedGraphemeFonts.length; graphemeIndex++) {
    const resolvedFont = resolvedGraphemeFonts[graphemeIndex];
    if (resolvedFont && resolvedFont.fallbackUsed) {
      const grapheme = itemization.graphemes[graphemeIndex];
      diagnostics.push({
        code: 'font-fallback',
        itemId: item.id,
        styleRunIndex: resolvedFont.styleRunIndex,
        graphemeRange: { ...resolvedFont.sourceRange },
        graphemeText: grapheme.text,
        requiredCodePoints: resolvedFont.coverageCodePoints,
        requestedFamily: resolvedFont.requestedFamily,
        fontId: resolvedFont.fontId,
        fallbackChain: resolvedFont.fallbackChain
      });
    }
  }
  const projectSourceRun = (run) => ({
    ...run,
    sourceRanges: mapLocalRange(run.start, run.end).map((segment) => ({
      localRange: { ...segment.localRange },
      sourceRange: { ...segment.sourceRange }
    }))
  });
  const nonShapingRuns = itemization.nonShapingRuns.map(projectSourceRun);
  const sourceRuns = itemization.sourceRuns.map(projectSourceRun);

  return deepFreeze({
    kind: 'TextItemShapingPlan',
    version: PLAN_VERSION,
    itemId: item.id,
    text,
    sourceRange: { ...source, coordinateSpace: 'document-utf16' },
    sourceSegments,
    unicodeVersion: itemization.unicodeVersion,
    direction,
    graphemes: itemization.graphemes.map((grapheme, index) => ({
      start: graphemeSourceRanges[index].sourceRange.start,
      end: graphemeSourceRanges[index].sourceRange.end,
      localRange: { ...graphemeSourceRanges[index].localRange },
      text: grapheme.text,
      script: grapheme.script || null,
      status: grapheme.status,
      direction: grapheme.direction || null,
      bidiLevel: grapheme.bidiLevel,
      shapeable: grapheme.shapeable === true,
      containsBidiControl: !!grapheme.containsBidiControl,
      isBidiControl: !!grapheme.isBidiControl,
      coverageCodePoints: requiredCodePointsForGrapheme(text, grapheme, index),
      font: resolvedGraphemeFonts[index]
        ? {
            fontId: resolvedGraphemeFonts[index].fontId,
            sourceHash: resolvedGraphemeFonts[index].sourceHash,
            faceIndex: resolvedGraphemeFonts[index].faceIndex,
            variationAxes: resolvedGraphemeFonts[index].variationAxes
          }
        : null
    })),
    scriptRuns: plannedRuns,
    nonShapingRuns,
    sourceRuns,
    diagnostics
  });
}

module.exports = { PLAN_VERSION, createTextItemShapingPlan };
