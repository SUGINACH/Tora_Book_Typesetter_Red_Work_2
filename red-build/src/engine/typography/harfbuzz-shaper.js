// red-build/src/engine/typography/harfbuzz-shaper.js
// Production HarfBuzz adapter. It consumes a canonical TextItemShapingPlan;
// it never resolves Bidi/Script/graphemes or measures Unicode independently.
'use strict';

const { sha256Hex } = require('../assets/hash256');
const { createShapedRun } = require('./shaped-run');

const SHAPED_TEXT_ITEM_VERSION = 'shaped-text-item-v1';
const MAX_HARFBUZZ_CLUSTER = 0xFFFFFFFF;

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

function requireFinite(value, code, label) {
  if (!Number.isFinite(value)) fail(code, label + ' must be finite');
  return value;
}

function requireInteger(value, min, code, label) {
  if (!Number.isSafeInteger(value) || value < min) fail(code, label + ' must be an integer >= ' + min);
  return value;
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], seen);
  return Object.freeze(value);
}

function normalizeExtents(raw, gid) {
  if (raw == null) return null;
  const xBearing = requireFinite(Number(raw.xBearing), 'invalid-glyph-extents', 'glyph ' + gid + ' xBearing');
  const yBearing = requireFinite(Number(raw.yBearing), 'invalid-glyph-extents', 'glyph ' + gid + ' yBearing');
  const width = requireFinite(Number(raw.width), 'invalid-glyph-extents', 'glyph ' + gid + ' width');
  const height = requireFinite(Number(raw.height), 'invalid-glyph-extents', 'glyph ' + gid + ' height');
  const xOther = xBearing + width;
  const yOther = yBearing + height;
  return {
    xMin: Math.min(xBearing, xOther),
    yMin: Math.min(yBearing, yOther),
    xMax: Math.max(xBearing, xOther),
    yMax: Math.max(yBearing, yOther)
  };
}

function validatePlan(plan) {
  requireRecord(plan, 'invalid-text-item-shaping-plan', 'TextItemShapingPlan');
  if (plan.kind !== 'TextItemShapingPlan' || plan.version !== 'text-item-shaping-plan-v2-grapheme-coverage') {
    fail('invalid-text-item-shaping-plan', 'Unsupported TextItemShapingPlan kind/version');
  }
  const text = requireString(plan.text, 'invalid-text-item-shaping-plan', 'plan.text');
  requireString(plan.itemId, 'invalid-text-item-shaping-plan', 'plan.itemId');
  requireString(plan.unicodeVersion, 'invalid-text-item-shaping-plan', 'plan.unicodeVersion');
  const sourceRange = requireRecord(plan.sourceRange, 'invalid-text-item-source-range', 'plan.sourceRange');
  const sourceStart = requireInteger(sourceRange.start, 0, 'invalid-text-item-source-range', 'plan.sourceRange.start');
  const sourceEnd = requireInteger(sourceRange.end, sourceStart + 1, 'invalid-text-item-source-range', 'plan.sourceRange.end');
  if (sourceEnd - sourceStart !== text.length) {
    fail('text-item-source-length-mismatch', 'TextItemShapingPlan sourceRange does not cover its text');
  }
  if (!Array.isArray(plan.scriptRuns) || !Array.isArray(plan.sourceRuns) ||
      !Array.isArray(plan.nonShapingRuns)) {
    fail('invalid-text-item-shaping-plan', 'Plan must provide ScriptRuns and lossless source projections');
  }
  let expected = sourceStart;
  for (let index = 0; index < plan.sourceRuns.length; index++) {
    const run = plan.sourceRuns[index];
    if (!run || run.start !== expected || !Number.isSafeInteger(run.end) ||
        run.end <= run.start || run.end > sourceEnd ||
        run.text !== text.slice(run.start - sourceStart, run.end - sourceStart)) {
      fail('invalid-plan-source-partition', 'Plan sourceRuns are not a contiguous source partition at index ' + index);
    }
    expected = run.end;
  }
  if (expected !== sourceEnd) fail('incomplete-plan-source-coverage', 'Plan sourceRuns do not cover the TextItem');

  let previousEnd = sourceStart;
  for (let index = 0; index < plan.scriptRuns.length; index++) {
    const run = plan.scriptRuns[index];
    requireRecord(run, 'invalid-planned-script-run', 'plan.scriptRuns[' + index + ']');
    requireString(run.id, 'invalid-planned-script-run', 'run.id');
    const range = requireRecord(run.sourceRange, 'invalid-planned-script-run', 'run.sourceRange');
    const start = requireInteger(range.start, sourceStart, 'invalid-planned-script-run', 'run.sourceRange.start');
    const end = requireInteger(range.end, start + 1, 'invalid-planned-script-run', 'run.sourceRange.end');
    if (start < previousEnd || end > sourceEnd || end - start !== run.text.length ||
        run.text !== text.slice(start - sourceStart, end - sourceStart)) {
      fail('invalid-planned-script-run-range', 'Planned ScriptRuns overlap or do not match TextItem source at index ' + index);
    }
    if ((run.bot !== true && run.bot !== false) || (run.eot !== true && run.eot !== false) ||
        run.bot !== (start === sourceStart) || run.eot !== (end === sourceEnd)) {
      fail('invalid-planned-run-boundary-flags', 'BOT/EOT must describe actual TextItem boundaries at ScriptRun ' + index);
    }
    if (!Array.isArray(run.graphemes) || !run.graphemes.length) {
      fail('invalid-planned-run-graphemes', 'Every shaping run must contain its canonical EGC slice');
    }
    let graphemeExpected = start;
    for (let gi = 0; gi < run.graphemes.length; gi++) {
      const grapheme = run.graphemes[gi];
      if (!grapheme || grapheme.start !== graphemeExpected ||
          !Number.isSafeInteger(grapheme.end) || grapheme.end <= grapheme.start ||
          grapheme.end > end || grapheme.end - grapheme.start !== grapheme.text.length ||
          grapheme.text !== run.text.slice(grapheme.start - start, grapheme.end - start)) {
        fail('invalid-planned-run-graphemes', 'ScriptRun EGCs do not partition the run at index ' + gi);
      }
      if (!Array.isArray(grapheme.coverageCodePoints) || grapheme.coverageCodePoints.some((codePoint) =>
          !Number.isSafeInteger(codePoint) || codePoint < 0 || codePoint > 0x10FFFF ||
          (codePoint >= 0xD800 && codePoint <= 0xDFFF))) {
        fail('invalid-planned-grapheme-coverage',
          'Every planned EGC must retain its Unicode-scalar coverageCodePoints from the Unicode itemizer');
      }
      graphemeExpected = grapheme.end;
    }
    if (graphemeExpected !== end) {
      fail('incomplete-planned-run-graphemes', 'ScriptRun EGCs do not cover the full shaping run');
    }
    requireRecord(run.font, 'invalid-planned-font', 'run.font');
    requireString(run.font.fontId, 'invalid-planned-font', 'run.font.fontId');
    if (!/^[0-9a-f]{64}$/i.test(run.font.sourceHash || '')) {
      fail('invalid-planned-font-hash', 'run.font.sourceHash must be a full SHA-256');
    }
    requireInteger(run.font.faceIndex, 0, 'invalid-planned-font', 'run.font.faceIndex');
    requireInteger(run.font.unitsPerEm, 1, 'invalid-planned-font', 'run.font.unitsPerEm');
    if (!Array.isArray(run.font.variationAxes) || !Array.isArray(run.features)) {
      fail('invalid-planned-font-policy', 'Variation axes and OpenType features must be explicit arrays');
    }
    if (!/^[A-Za-z]{4}$/.test(run.script || '') ||
        !['ltr', 'rtl'].includes(run.direction) ||
        !Number.isSafeInteger(run.bidiLevel) || run.bidiLevel < 0 ||
        ((run.bidiLevel % 2 === 1) !== (run.direction === 'rtl'))) {
      fail('invalid-planned-shaping-context', 'Script/direction/Bidi-level policy is invalid');
    }
    requireString(run.language, 'invalid-planned-shaping-context', 'run.language');
    previousEnd = end;
  }
  return { text, sourceRange, sourceStart, sourceEnd };
}

function createHarfBuzzShaper(options = {}) {
  const hb = options.hb;
  const fontResolver = options.fontResolver;
  const engineVersion = options.engineVersion;
  const inkBoundsProvider = options.inkBoundsProvider || null;
  const requireInkBounds = options.requireInkBounds === true;
  if (!hb || typeof hb.shape !== 'function' || !hb.Blob || !hb.Face || !hb.Font ||
      !hb.Buffer || !hb.Feature || !hb.Variation || !hb.ClusterLevel || !hb.BufferFlag || !hb.Direction) {
    fail('harfbuzz-runtime-not-ready', 'A fully initialized HarfBuzzJS runtime is required');
  }
  if (!fontResolver || typeof fontResolver.resolveFontById !== 'function') {
    fail('font-resolver-not-ready', 'Canonical FontResolver with resolveFontById is required');
  }
  requireString(engineVersion, 'missing-harfbuzz-version', 'engineVersion');
  if (requireInkBounds && typeof inkBoundsProvider !== 'function') {
    fail('ink-bounds-provider-required', 'Exact ink bounds were requested but no validated bounds provider was supplied');
  }

  const fontCache = new Map();

  function resolveFontInstance(fontSpec) {
    const resolution = fontResolver.resolveFontById(fontSpec.fontId);
    if (!resolution || !resolution.ok || !resolution.record || !resolution.record.font) {
      fail('font-id-not-resolved', 'FontResolver cannot resolve planned fontId ' + fontSpec.fontId);
    }
    const record = resolution.record;
    if (record.sourceHash !== fontSpec.sourceHash) {
      fail('font-source-hash-mismatch', 'FontResolver content hash changed after TextItem shaping plan creation');
    }
    const bytes = record.font.bytes;
    if (!bytes || !bytes.length || sha256Hex(bytes) !== fontSpec.sourceHash) {
      fail('font-bytes-integrity-failure', 'Font bytes no longer match their canonical SHA-256 identity');
    }
    if (record.unitsPerEm !== fontSpec.unitsPerEm || record.font.unitsPerEm !== fontSpec.unitsPerEm) {
      fail('font-units-per-em-mismatch', 'Planned font UPEM differs from FontResolver parsed metrics');
    }

    const cacheKey = JSON.stringify([
      fontSpec.fontId, fontSpec.sourceHash, fontSpec.faceIndex, fontSpec.variationAxes
    ]);
    const cached = fontCache.get(cacheKey);
    if (cached) return cached;

    const blob = new hb.Blob(bytes);
    const face = new hb.Face(blob, fontSpec.faceIndex);
    if (!Number.isSafeInteger(face.upem) || face.upem !== fontSpec.unitsPerEm) {
      fail('harfbuzz-face-upem-mismatch', 'HarfBuzz Face UPEM differs from FontResolver parsed UPEM');
    }
    if (typeof face.getAxisInfos !== 'function') {
      fail('harfbuzz-variation-api-missing', 'HarfBuzzJS Face.getAxisInfos is required for explicit axis validation');
    }
    const axisInfos = face.getAxisInfos();
    const variations = fontSpec.variationAxes.map((axis) => {
      const info = axisInfos && axisInfos[axis.tag];
      if (!info) fail('unsupported-font-variation-axis', 'Font ' + fontSpec.fontId + ' has no variation axis ' + axis.tag);
      if (!Number.isFinite(info.min) || !Number.isFinite(info.max) ||
          axis.value < info.min || axis.value > info.max) {
        fail('font-variation-axis-out-of-range',
          'Variation axis ' + axis.tag + ' value ' + axis.value + ' is outside [' + info.min + ',' + info.max + ']');
      }
      return new hb.Variation(axis.tag, axis.value);
    });
    const font = new hb.Font(face);
    // HarfBuzz positions are kept in font units; pixel scaling happens only at
    // the layout boundary after the line-breaker has consumed these advances.
    font.setScale(face.upem, face.upem);
    if (variations.length) font.setVariations(variations);
    const instance = { blob, face, font, sourceHash: fontSpec.sourceHash };
    fontCache.set(cacheKey, instance);
    return instance;
  }

  function shapeRun(planRun, plan) {
    const instance = resolveFontInstance(planRun.font);
    const inputCodepoints = [];
    const graphemeStarts = [];
    for (const grapheme of planRun.graphemes) graphemeStarts.push(grapheme.start);
    const allowedStarts = new Set(graphemeStarts);
    let offset = 0;
    let graphemeIndex = 0;
    while (offset < planRun.text.length) {
      const absoluteOffset = planRun.sourceRange.start + offset;
      while (graphemeIndex + 1 < planRun.graphemes.length &&
          absoluteOffset >= planRun.graphemes[graphemeIndex].end) graphemeIndex++;
      const codePoint = planRun.text.codePointAt(offset);
      if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
        fail('invalid-plan-utf16', 'TextItemShapingPlan contains an unpaired surrogate in a shaping run');
      }
      const cluster = graphemeStarts[graphemeIndex];
      if (cluster > MAX_HARFBUZZ_CLUSTER) {
        fail('harfbuzz-cluster-domain-overflow', 'Document UTF-16 offset exceeds HarfBuzz uint32 cluster domain');
      }
      inputCodepoints.push({ codePoint, cluster });
      offset += codePoint > 0xFFFF ? 2 : 1;
    }
    if (!inputCodepoints.length || inputCodepoints[0].cluster !== planRun.sourceRange.start) {
      fail('invalid-plan-codepoint-map', 'Shaping run does not begin with its first canonical grapheme cluster');
    }

    const buffer = new hb.Buffer();
    for (const input of inputCodepoints) buffer.add(input.codePoint, input.cluster);
    buffer.setDirection(planRun.direction === 'rtl' ? hb.Direction.RTL : hb.Direction.LTR);
    buffer.setScript(planRun.script);
    buffer.setLanguage(planRun.language);
    buffer.setClusterLevel(hb.ClusterLevel.MONOTONE_CHARACTERS);
    let flags = hb.BufferFlag.DEFAULT;
    if (planRun.bot) flags |= hb.BufferFlag.BOT;
    if (planRun.eot) flags |= hb.BufferFlag.EOT;
    buffer.setFlags(flags);

    const features = planRun.features.map((feature) => new hb.Feature(feature.tag, feature.value));
    hb.shape(instance.font, buffer, features);
    const infos = buffer.getGlyphInfos();
    const positions = buffer.getGlyphPositions();
    if (!Array.isArray(infos) || !Array.isArray(positions) || !infos.length || infos.length !== positions.length) {
      fail('invalid-harfbuzz-output', 'HarfBuzz returned an empty or inconsistent glyph/position sequence');
    }

    const outputClusters = infos.map((info) => Number(info.cluster));
    for (const cluster of outputClusters) {
      if (!Number.isSafeInteger(cluster) || !allowedStarts.has(cluster)) {
        fail('invalid-output-cluster', 'HarfBuzz output cluster is not a canonical EGC start: ' + cluster);
      }
    }
    for (let i = 1; i < outputClusters.length; i++) {
      const monotone = planRun.direction === 'rtl'
        ? outputClusters[i] <= outputClusters[i - 1]
        : outputClusters[i] >= outputClusters[i - 1];
      if (!monotone) fail('non-monotone-glyph-clusters', 'HarfBuzz output clusters violate MONOTONE_CHARACTERS');
    }

    const sortedStarts = Array.from(new Set(outputClusters)).sort((a, b) => a - b);
    if (sortedStarts[0] !== planRun.sourceRange.start) {
      fail('incomplete-shaped-source-prefix',
        'HarfBuzz emitted no cluster for the beginning of the shaping run; source mapping cannot be inferred safely');
    }
    const clusterEndByStart = new Map();
    for (let i = 0; i < sortedStarts.length; i++) {
      clusterEndByStart.set(sortedStarts[i],
        i + 1 < sortedStarts.length ? sortedStarts[i + 1] : planRun.sourceRange.end);
    }

    const diagnostics = [];
    const glyphs = infos.map((info, index) => {
      const gid = requireInteger(Number(info.codepoint), 1, 'missing-glyph-coverage', 'HarfBuzz GID (.notdef is not valid coverage)');
      const cluster = outputClusters[index];
      const position = positions[index];
      const controlBounds = normalizeExtents(instance.font.glyphExtents(gid), gid);
      const inkBounds = typeof inkBoundsProvider === 'function'
        ? inkBoundsProvider({
            font: instance.font, face: instance.face, fontId: planRun.font.fontId,
            sourceHash: planRun.font.sourceHash, faceIndex: planRun.font.faceIndex,
            variationAxes: planRun.font.variationAxes, gid
          })
        : null;
      if (requireInkBounds && inkBounds == null) {
        fail('ink-bounds-unavailable',
          'A required tight ink-bounds provider returned no bounds for font ' + planRun.font.fontId + ', GID ' + gid);
      }
      return {
        gid,
        cluster,
        xAdvance: requireFinite(Number(position.xAdvance), 'invalid-harfbuzz-position', 'xAdvance'),
        yAdvance: requireFinite(Number(position.yAdvance), 'invalid-harfbuzz-position', 'yAdvance'),
        xOffset: requireFinite(Number(position.xOffset), 'invalid-harfbuzz-position', 'xOffset'),
        yOffset: requireFinite(Number(position.yOffset), 'invalid-harfbuzz-position', 'yOffset'),
        flags: requireInteger(Number(info.flags || 0), 0, 'invalid-harfbuzz-glyph-flags', 'glyph flags'),
        controlBounds,
        inkBounds
      };
    });
    if (!inkBoundsProvider) {
      diagnostics.push({
        code: 'tight-ink-bounds-not-computed',
        message: 'No validated ink-bounds provider was supplied; control bounds are preserved separately',
        severity: 'warning'
      });
    }

    return createShapedRun({
      id: planRun.id,
      text: planRun.text,
      sourceRange: planRun.sourceRange,
      font: planRun.font,
      shaping: {
        engine: 'harfbuzz',
        engineVersion,
        unicodeVersion: plan.unicodeVersion,
        script: planRun.script,
        language: planRun.language,
        direction: planRun.direction,
        bidiLevel: planRun.bidiLevel,
        bot: planRun.bot,
        eot: planRun.eot,
        clusterLevel: 'monotone-characters',
        variationAxes: planRun.font.variationAxes,
        features: planRun.features
      },
      graphemes: planRun.graphemes,
      glyphs,
      diagnostics
    });
  }

  function shapeTextItemPlan(plan) {
    const validated = validatePlan(plan);
    const shapedRuns = plan.scriptRuns.map((run) => shapeRun(run, plan));
    const diagnostics = (Array.isArray(plan.diagnostics) ? plan.diagnostics.slice() : [])
      .concat(...shapedRuns.map((run) => run.diagnostics));
    return deepFreeze({
      kind: 'ShapedTextItem',
      version: SHAPED_TEXT_ITEM_VERSION,
      itemId: plan.itemId,
      text: validated.text,
      sourceRange: { ...validated.sourceRange },
      unicodeVersion: plan.unicodeVersion,
      sourceRuns: plan.sourceRuns,
      nonShapingRuns: plan.nonShapingRuns,
      shapedRuns,
      diagnostics
    });
  }

  function clearFontCache() {
    fontCache.clear();
  }

  return Object.freeze({
    shapeTextItemPlan,
    clearFontCache,
    getFontCacheSize: () => fontCache.size
  });
}

module.exports = { SHAPED_TEXT_ITEM_VERSION, createHarfBuzzShaper };
