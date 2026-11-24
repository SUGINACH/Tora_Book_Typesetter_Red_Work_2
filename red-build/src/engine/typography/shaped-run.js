// red-build/src/engine/typography/shaped-run.js
// Canonical immutable ShapedRun/ShapedGlyph contract — production model layer.
'use strict';

const SHAPED_RUN_CONTRACT_VERSION = 'shaped-run-v1';
const CLUSTER_LEVEL = 'monotone-characters';

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
  if (typeof value !== 'string' || value.length === 0) {
    fail(code, label + ' must be a non-empty string');
  }
  return value;
}

function requireInteger(value, min, code, label) {
  if (!Number.isSafeInteger(value) || value < min) {
    fail(code, label + ' must be an integer >= ' + min);
  }
  return value;
}

function requireFinite(value, code, label) {
  if (!Number.isFinite(value)) fail(code, label + ' must be finite');
  return value;
}

function assertWellFormedUtf16(text, label) {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit >= 0xD800 && unit <= 0xDBFF) {
      if (i + 1 >= text.length) fail('invalid-utf16', label + ' ends with an unpaired high surrogate');
      const next = text.charCodeAt(i + 1);
      if (next < 0xDC00 || next > 0xDFFF) {
        fail('invalid-utf16', label + ' contains an unpaired high surrogate at UTF-16 offset ' + i);
      }
      i++;
    } else if (unit >= 0xDC00 && unit <= 0xDFFF) {
      fail('invalid-utf16', label + ' contains an unpaired low surrogate at UTF-16 offset ' + i);
    }
  }
}

function normalizeSourceRange(input, text) {
  const range = requireRecord(input, 'invalid-source-range', 'sourceRange');
  const start = requireInteger(range.start, 0, 'invalid-source-range', 'sourceRange.start');
  const end = requireInteger(range.end, 1, 'invalid-source-range', 'sourceRange.end');
  if (end <= start || end - start !== text.length) {
    fail('source-range-length-mismatch', 'sourceRange must cover the text exactly in UTF-16 code units');
  }
  const out = { coordinateSpace: 'document-utf16', start, end };
  for (const key of ['docId', 'blockId', 'itemId']) {
    if (range[key] != null) out[key] = requireString(String(range[key]), 'invalid-source-range', 'sourceRange.' + key);
  }
  if (range.runIndex != null) {
    out.runIndex = requireInteger(range.runIndex, 0, 'invalid-source-range', 'sourceRange.runIndex');
  }
  return out;
}

function normalizeFont(input) {
  const font = requireRecord(input, 'invalid-font-identity', 'font');
  const fontId = requireString(font.fontId, 'invalid-font-identity', 'font.fontId');
  const faceIndex = font.faceIndex == null
    ? 0
    : requireInteger(font.faceIndex, 0, 'invalid-font-identity', 'font.faceIndex');
  const unitsPerEm = requireInteger(font.unitsPerEm, 1, 'invalid-font-identity', 'font.unitsPerEm');

  const out = { fontId, faceIndex, unitsPerEm };
  for (const key of ['sourceHash', 'normalizedHash']) {
    if (font[key] != null) {
      if (typeof font[key] !== 'string' || !/^[0-9a-f]{64}$/i.test(font[key])) {
        fail('invalid-font-hash', 'font.' + key + ' must be a 64-character hexadecimal SHA-256');
      }
      out[key] = font[key].toLowerCase();
    }
  }
  return out;
}

function normalizeTagValueList(input, code, label) {
  if (!Array.isArray(input)) fail(code, label + ' must be an array (use [] when empty)');
  const seen = new Set();
  return input.map((item, index) => {
    const rec = requireRecord(item, code, label + '[' + index + ']');
    const tag = requireString(rec.tag, code, label + '[' + index + '].tag');
    if (!/^[A-Za-z0-9]{4}$/.test(tag)) {
      fail(code, label + '[' + index + '].tag must be a four-character OpenType tag');
    }
    if (seen.has(tag)) fail(code, label + ' contains duplicate tag ' + tag);
    seen.add(tag);
    return { tag, value: requireFinite(rec.value, code, label + '[' + index + '].value') };
  });
}

function normalizeShaping(input) {
  const shaping = requireRecord(input, 'invalid-shaping-context', 'shaping');
  const script = requireString(shaping.script, 'invalid-shaping-context', 'shaping.script');
  if (!/^[A-Za-z]{4}$/.test(script)) {
    fail('invalid-shaping-context', 'shaping.script must be a four-letter ISO 15924 tag');
  }
  const language = requireString(shaping.language, 'invalid-shaping-context', 'shaping.language');
  const direction = shaping.direction;
  if (direction !== 'ltr' && direction !== 'rtl') {
    fail('invalid-shaping-context', 'shaping.direction must be ltr or rtl');
  }
  const bidiLevel = requireInteger(shaping.bidiLevel, 0, 'invalid-shaping-context', 'shaping.bidiLevel');
  if ((bidiLevel % 2 === 1) !== (direction === 'rtl')) {
    fail('bidi-level-direction-mismatch', 'Bidi level parity does not match shaping direction');
  }
  const engine = requireString(shaping.engine || 'harfbuzz', 'invalid-shaping-context', 'shaping.engine');
  const engineVersion = requireString(shaping.engineVersion, 'invalid-shaping-context', 'shaping.engineVersion');
  const unicodeVersion = requireString(shaping.unicodeVersion, 'invalid-shaping-context', 'shaping.unicodeVersion');
  if (shaping.bot !== true && shaping.bot !== false) {
    fail('invalid-shaping-context', 'shaping.bot must be explicit boolean');
  }
  if (shaping.eot !== true && shaping.eot !== false) {
    fail('invalid-shaping-context', 'shaping.eot must be explicit boolean');
  }
  if (shaping.clusterLevel !== CLUSTER_LEVEL) {
    fail('invalid-cluster-level', 'ShapedRun requires MONOTONE_CHARACTERS cluster semantics');
  }

  const variationAxes = normalizeTagValueList(
    shaping.variationAxes == null ? [] : shaping.variationAxes,
    'invalid-variation-axes',
    'shaping.variationAxes'
  );
  const features = normalizeTagValueList(
    shaping.features,
    'invalid-open-type-features',
    'shaping.features'
  );

  return {
    engine,
    engineVersion,
    unicodeVersion,
    script,
    language,
    direction,
    bidiLevel,
    bot: shaping.bot,
    eot: shaping.eot,
    clusterLevel: CLUSTER_LEVEL,
    variationAxes,
    features
  };
}

function normalizeGraphemes(input, sourceRange, text) {
  if (!Array.isArray(input) || input.length === 0) {
    fail('invalid-graphemes', 'graphemes must be a non-empty array from the canonical itemizer');
  }
  let expectedStart = sourceRange.start;
  return input.map((item, index) => {
    const grapheme = requireRecord(item, 'invalid-graphemes', 'graphemes[' + index + ']');
    const start = requireInteger(grapheme.start, sourceRange.start, 'invalid-graphemes', 'graphemes[' + index + '].start');
    const end = requireInteger(grapheme.end, sourceRange.start + 1, 'invalid-graphemes', 'graphemes[' + index + '].end');
    const value = requireString(grapheme.text, 'invalid-graphemes', 'graphemes[' + index + '].text');
    if (start !== expectedStart || end <= start || end > sourceRange.end ||
        end - start !== value.length ||
        value !== text.slice(start - sourceRange.start, end - sourceRange.start)) {
      fail('invalid-grapheme-partition', 'graphemes must be an exact contiguous UTF-16 partition of the ShapedRun source');
    }
    assertWellFormedUtf16(value, 'graphemes[' + index + '].text');
    expectedStart = end;
    return { start, end, text: value };
  }).map((grapheme, index, all) => {
    if (index === all.length - 1 && grapheme.end !== sourceRange.end) {
      fail('incomplete-grapheme-coverage', 'graphemes do not cover the complete ShapedRun source range');
    }
    return grapheme;
  });
}

function normalizeBounds(input, code, label) {
  if (input == null) return null;
  const bounds = requireRecord(input, code, label);
  const out = {
    xMin: requireFinite(bounds.xMin, code, label + '.xMin'),
    yMin: requireFinite(bounds.yMin, code, label + '.yMin'),
    xMax: requireFinite(bounds.xMax, code, label + '.xMax'),
    yMax: requireFinite(bounds.yMax, code, label + '.yMax')
  };
  if (out.xMax < out.xMin || out.yMax < out.yMin) {
    fail(code, label + ' has inverted bounds');
  }
  return out;
}

function normalizeGlyphs(input, sourceRange, graphemes) {
  if (!Array.isArray(input) || input.length === 0) {
    fail('empty-glyph-output', 'A non-shaping or empty run cannot be represented as ShapedRun');
  }
  const graphemeStarts = new Set(graphemes.map((item) => item.start));
  const glyphs = input.map((item, index) => {
    const glyph = requireRecord(item, 'invalid-glyph', 'glyphs[' + index + ']');
    const gid = requireInteger(glyph.gid, 0, 'invalid-glyph', 'glyphs[' + index + '].gid');
    const cluster = requireInteger(glyph.cluster, sourceRange.start, 'invalid-glyph-cluster', 'glyphs[' + index + '].cluster');
    if (cluster >= sourceRange.end || !graphemeStarts.has(cluster)) {
      fail('invalid-glyph-cluster', 'glyph cluster must be an absolute UTF-16 start of an input grapheme');
    }
    const xAdvance = requireFinite(glyph.xAdvance, 'invalid-glyph-position', 'glyphs[' + index + '].xAdvance');
    const yAdvance = requireFinite(glyph.yAdvance, 'invalid-glyph-position', 'glyphs[' + index + '].yAdvance');
    const xOffset = requireFinite(glyph.xOffset, 'invalid-glyph-position', 'glyphs[' + index + '].xOffset');
    const yOffset = requireFinite(glyph.yOffset, 'invalid-glyph-position', 'glyphs[' + index + '].yOffset');
    const flags = glyph.flags == null ? 0 : requireInteger(glyph.flags, 0, 'invalid-glyph', 'glyphs[' + index + '].flags');
    return {
      gid, cluster, xAdvance, yAdvance, xOffset, yOffset, flags,
      controlBounds: normalizeBounds(glyph.controlBounds, 'invalid-glyph-bounds', 'glyphs[' + index + '].controlBounds'),
      inkBounds: normalizeBounds(glyph.inkBounds, 'invalid-glyph-bounds', 'glyphs[' + index + '].inkBounds')
    };
  });

  const starts = Array.from(new Set(glyphs.map((glyph) => glyph.cluster))).sort((a, b) => a - b);
  if (starts[0] !== sourceRange.start) {
    fail('incomplete-shaped-source-prefix', 'first shaped cluster must begin at the ShapedRun source start');
  }
  const graphemeIndexByStart = new Map(graphemes.map((item, index) => [item.start, index]));
  const clusters = starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : sourceRange.end;
    const graphemeStart = graphemeIndexByStart.get(start);
    const graphemeEnd = end === sourceRange.end
      ? graphemes.length
      : graphemeIndexByStart.get(end);
    if (graphemeStart == null || graphemeEnd == null || graphemeEnd <= graphemeStart) {
      fail('invalid-shaped-cluster-range', 'shaped cluster boundaries must align to canonical grapheme boundaries');
    }
    const glyphIndices = [];
    for (let glyphIndex = 0; glyphIndex < glyphs.length; glyphIndex++) {
      if (glyphs[glyphIndex].cluster === start) glyphIndices.push(glyphIndex);
    }
    if (!glyphIndices.length) fail('empty-shaped-cluster', 'every shaped cluster must reference at least one glyph');
    return {
      start, end,
      text: graphemes.slice(graphemeStart, graphemeEnd).map((item) => item.text).join(''),
      graphemeStart, graphemeEnd,
      glyphIndices
    };
  });

  const clusterByStart = new Map(clusters.map((cluster, index) => [cluster.start, { cluster, index }]));
  const shapedGlyphs = glyphs.map((glyph) => {
    const entry = clusterByStart.get(glyph.cluster);
    if (!entry) fail('orphan-shaped-glyph', 'glyph references a missing shaped cluster');
    return {
      ...glyph,
      sourceRange: { start: entry.cluster.start, end: entry.cluster.end },
      clusterIndex: entry.index
    };
  });

  return { clusters, glyphs: shapedGlyphs };
}

function deepFreeze(value, seen) {
  if (!value || typeof value !== 'object') return value;
  const visited = seen || new Set();
  if (visited.has(value)) return value;
  visited.add(value);
  for (const key of Object.keys(value)) deepFreeze(value[key], visited);
  return Object.freeze(value);
}

/**
 * Create an immutable ShapedRun from actual HarfBuzz output plus canonical
 * itemizer graphemes. Offsets and clusters use absolute document UTF-16 units;
 * advances and bounds remain in font units.
 */
function createShapedRun(input) {
  const data = requireRecord(input, 'invalid-shaped-run', 'ShapedRun input');
  const id = requireString(data.id, 'invalid-shaped-run', 'ShapedRun.id');
  const text = requireString(data.text, 'invalid-shaped-run', 'ShapedRun.text');
  assertWellFormedUtf16(text, 'ShapedRun.text');
  const sourceRange = normalizeSourceRange(data.sourceRange, text);
  const font = normalizeFont(data.font);
  const shaping = normalizeShaping(data.shaping);
  const graphemes = normalizeGraphemes(data.graphemes, sourceRange, text);
  const normalizedGlyphs = normalizeGlyphs(data.glyphs, sourceRange, graphemes);
  const advance = normalizedGlyphs.glyphs.reduce((sum, glyph) => ({
    x: sum.x + glyph.xAdvance,
    y: sum.y + glyph.yAdvance
  }), { x: 0, y: 0 });
  if (!Number.isFinite(advance.x) || !Number.isFinite(advance.y)) {
    fail('invalid-run-advance', 'sum of shaped glyph advances must remain finite');
  }

  const diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics.map((item, index) => {
    const diagnostic = requireRecord(item, 'invalid-shaped-run-diagnostic', 'diagnostics[' + index + ']');
    return {
      code: requireString(diagnostic.code, 'invalid-shaped-run-diagnostic', 'diagnostics[' + index + '].code'),
      message: requireString(diagnostic.message, 'invalid-shaped-run-diagnostic', 'diagnostics[' + index + '].message'),
      ...(diagnostic.severity != null ? { severity: String(diagnostic.severity) } : {})
    };
  }) : [];

  return deepFreeze({
    kind: 'ShapedRun',
    contractVersion: SHAPED_RUN_CONTRACT_VERSION,
    id,
    sourceRange,
    text,
    font,
    shaping,
    graphemes,
    clusters: normalizedGlyphs.clusters,
    glyphs: normalizedGlyphs.glyphs,
    advance,
    diagnostics
  });
}

function isShapedRun(value) {
  return !!(value && value.kind === 'ShapedRun' &&
    value.contractVersion === SHAPED_RUN_CONTRACT_VERSION &&
    Object.isFrozen(value) &&
    Object.isFrozen(value.glyphs) &&
    Object.isFrozen(value.clusters));
}

/** Only output-cluster boundaries are legal shaping/line-break slice points. */
function isShapedClusterBoundary(shapedRun, absoluteOffset) {
  if (!isShapedRun(shapedRun) || !Number.isSafeInteger(absoluteOffset)) return false;
  if (absoluteOffset === shapedRun.sourceRange.start || absoluteOffset === shapedRun.sourceRange.end) return true;
  return shapedRun.clusters.some((cluster) =>
    cluster.start === absoluteOffset || cluster.end === absoluteOffset);
}

module.exports = {
  SHAPED_RUN_CONTRACT_VERSION,
  CLUSTER_LEVEL,
  createShapedRun,
  isShapedRun,
  isShapedClusterBoundary
};
