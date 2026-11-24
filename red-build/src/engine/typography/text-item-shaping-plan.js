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
  if (!isRecord(input[0])) fail('invalid-inline-style-run', 'payload.runs[0] must be a plain object');
  const firstSourceStart = input[0].sourceStart == null ? 0 : requireRange(input[0].sourceStart, 'run.sourceStart');
  let expectedLocalStart = 0;
  return input.map((entry, index) => {
    const run = requireRecord(entry, 'invalid-inline-style-run', 'payload.runs[' + index + ']');
    if (typeof run.text !== 'string') fail('invalid-inline-style-run-text', 'Inline style run text must be a string');
    const runText = run.text;
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
    const g = result.graphemes[index];
    if (!g || g.start !== expected || !Number.isSafeInteger(g.end) || g.end <= g.start ||
        g.end > text.length || g.text !== text.slice(g.start,g.end) || typeof g.shapeable !== 'boolean') {
      fail('invalid-grapheme-partition', 'Itemizer graphemes are not an exact contiguous UTF-16 partition at index ' + index);
    }
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
  // Only style runs that own shapeable graphemes need a registered font.
  const requiredStyleRunIndexes = new Set();
  for (let gi=0;gi<itemization.graphemes.length;gi++) {
    if (itemization.graphemes[gi].shapeable) requiredStyleRunIndexes.add(graphemeStyleIndexes[gi]);
  }
  const resolvedStyleRuns = new Array(styleRuns.length).fill(null);
  for (const styleRunIndex of requiredStyleRunIndexes) {
    const styleRun=styleRuns[styleRunIndex];
    const requestedFamily=styleRun.fontFamily||options.defaultFamily||null;
    const fallbacks=requestedFamily&&Array.isArray(fallbacksByFamily[requestedFamily])?fallbacksByFamily[requestedFamily]:[];
    const resolution=fontResolver.resolveFont(requestedFamily,{defaultFamily:options.defaultFamily||null,fallbacks});
    if(!resolution.ok||!resolution.record||!resolution.record.font||
       !resolution.record.font.bytes||!resolution.record.font.bytes.length){
      fail('font-unavailable-for-shaping','Cannot create a ShapedRun for inline style run '+styleRun.index+': '+(resolution.message||'font bytes are unavailable'));
    }
    const fontId=requireString(resolution.fontId,'invalid-resolved-font','resolved fontId');
    const unitsPerEm=requireRange(resolution.record.unitsPerEm,'resolved font unitsPerEm',1);
    if(resolution.record.font.unitsPerEm!==unitsPerEm)
      fail('font-units-per-em-mismatch','FontResolver record and parsed font UPEM disagree for '+fontId);
    const variationAxes=normalizeAxes(variationAxesByFontId[fontId],fontId);
    const faceIndex=faceIndexByFontId[fontId]==null?0:requireRange(faceIndexByFontId[fontId],'faceIndexByFontId.'+fontId);
    resolvedStyleRuns[styleRunIndex]={
      ...styleRun,requestedFamily,fontId,faceIndex,unitsPerEm,variationAxes,
      fallbackUsed:!!resolution.fallbackUsed,
      fallbackChain:resolution.fallbackChain||[],
      diagnostics:resolution.diagnostics||[]
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
        fallbackChains: group.fallbackChains
      });
      group = null;
    };

    for (let graphemeIndex = scriptRun.graphemeStart; graphemeIndex < scriptRun.graphemeEnd; graphemeIndex++) {
      const styleRunIndex = graphemeStyleIndexes[graphemeIndex];
      const styleRun = resolvedStyleRuns[styleRunIndex];
      if (!styleRun) fail('missing-font-for-shapeable-grapheme',
        'A shapeable grapheme has no resolved font identity at index ' + graphemeIndex);
      const canMerge = group &&
        group.graphemeEnd === graphemeIndex &&
        group.fontId === styleRun.fontId &&
        group.faceIndex === styleRun.faceIndex &&
        JSON.stringify(group.variationAxes) === JSON.stringify(styleRun.variationAxes);
      if (!canMerge) {
        flush();
        group = {
          styleRunIndexes: [styleRunIndex],
          fontId: styleRun.fontId, faceIndex: styleRun.faceIndex, unitsPerEm: styleRun.unitsPerEm,
          variationAxes: styleRun.variationAxes,
          fallbackUsed: styleRun.fallbackUsed,
          fallbackChains: styleRun.fallbackUsed ? [styleRun.fallbackChain] : [],
          graphemeStart: graphemeIndex, graphemeEnd: graphemeIndex + 1
        };
      } else {
        group.graphemeEnd = graphemeIndex + 1;
        if (!group.styleRunIndexes.includes(styleRunIndex)) group.styleRunIndexes.push(styleRunIndex);
        if (styleRun.fallbackUsed) group.fallbackUsed = true;
        if (styleRun.fallbackUsed &&
            !group.fallbackChains.some((chain) => JSON.stringify(chain) === JSON.stringify(styleRun.fallbackChain))) {
          group.fallbackChains.push(styleRun.fallbackChain);
        }
      }
    }
    flush();
  }

  const diagnostics = [];
  for (const run of resolvedStyleRuns) {
    if (run && run.fallbackUsed) {
      diagnostics.push({
        code: 'font-fallback', itemId: item.id, styleRunIndex: run.index,
        requestedFamily: run.requestedFamily, fontId: run.fontId,
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
