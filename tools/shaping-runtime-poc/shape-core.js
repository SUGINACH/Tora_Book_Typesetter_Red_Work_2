'use strict';

(function expose(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HarfBuzzRuntimePoc = api;
})(typeof self !== 'undefined' ? self : globalThis, function createApi() {
  const CASES = Object.freeze([
    'שָׁלוֹם',
    'בְּרֵאשִׁית',
    'תּוֹרָה',
    'מִצְוָה',
    'יִשְׂרָאֵל'
  ]);
  const FEATURE_TAGS = Object.freeze(['kern', 'mark', 'mkmk', 'rlig']);

  function hexCodepoint(cp) {
    return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
  }

  // Map HarfBuzz cluster starts to logical UTF-16 source intervals. Glyph order
  // is visual for RTL and can be descending/repeated; never infer an end from
  // the next glyph in the returned array.
  function clusterSourceRanges(text, clusters, sourceStart = 0) {
    text = String(text);
    if (!Number.isSafeInteger(sourceStart) || sourceStart < 0) {
      throw new TypeError('sourceStart must be a non-negative safe integer');
    }
    if (!Array.isArray(clusters) || !clusters.length) {
      throw new TypeError('clusters must be a non-empty array');
    }
    const scalarBoundaries = new Set([text.length]);
    for (let offset = 0; offset < text.length;) {
      scalarBoundaries.add(offset);
      const cp = text.codePointAt(offset);
      offset += cp > 0xFFFF ? 2 : 1;
    }
    const uniqueStarts = Array.from(new Set(clusters.map(Number))).sort((a, b) => a - b);
    for (const start of uniqueStarts) {
      if (!Number.isInteger(start) || start < 0 || start >= text.length) {
        throw new RangeError('cluster out of source range: ' + start + ' / ' + text.length);
      }
      if (!scalarBoundaries.has(start)) {
        throw new Error('cluster splits a UTF-16 surrogate pair at offset ' + start);
      }
    }
    const endByStart = new Map();
    for (let i = 0; i < uniqueStarts.length; i++) {
      const start = uniqueStarts[i];
      const end = i + 1 < uniqueStarts.length ? uniqueStarts[i + 1] : text.length;
      if (!scalarBoundaries.has(end)) {
        throw new Error('cluster range end splits a UTF-16 surrogate pair at offset ' + end);
      }
      endByStart.set(start, end);
    }
    const counts = new Map();
    for (const cluster of clusters) counts.set(Number(cluster), (counts.get(Number(cluster)) || 0) + 1);
    const ranges = clusters.map((cluster) => {
      const start = Number(cluster);
      return { start: sourceStart + start, end: sourceStart + endByStart.get(start) };
    });
    return {
      ranges,
      uniqueStarts,
      uniqueClusterCount: uniqueStarts.length,
      multiGlyphClusterCount: Array.from(counts.values()).filter((count) => count > 1).length,
      repeatedClusterGlyphCount: clusters.length - uniqueStarts.length,
      sourceStart,
      sourceEnd: sourceStart + text.length,
      uncoveredPrefixLength: uniqueStarts[0],
      coversFullSource: uniqueStarts[0] === 0
    };
  }

  function clustersMonotone(clusters, direction) {
    for (let i = 1; i < clusters.length; i++) {
      if (direction === 'rtl' && clusters[i] > clusters[i - 1]) return false;
      if (direction === 'ltr' && clusters[i] < clusters[i - 1]) return false;
    }
    return true;
  }

  function cubicValue(p0, p1, p2, p3, t) {
    const mt = 1 - t;
    return mt * mt * mt * p0 +
      3 * mt * mt * t * p1 +
      3 * mt * t * t * p2 +
      t * t * t * p3;
  }

  function cubicDerivativeRoots(p0, p1, p2, p3) {
    // Solve derivative/3 = a*t^2 + b*t + c = 0.
    const a = -p0 + 3 * p1 - 3 * p2 + p3;
    const b = 2 * (p0 - 2 * p1 + p2);
    const c = p1 - p0;
    const scale = Math.max(1, Math.abs(a), Math.abs(b), Math.abs(c));
    const epsilon = Number.EPSILON * scale * 32;

    if (Math.abs(a) <= epsilon) {
      if (Math.abs(b) <= epsilon) return [];
      const root = -c / b;
      return root > 0 && root < 1 ? [root] : [];
    }

    let discriminant = b * b - 4 * a * c;
    if (discriminant < -epsilon * scale) return [];
    if (discriminant < 0) discriminant = 0;
    const squareRoot = Math.sqrt(discriminant);
    if (squareRoot === 0) {
      const root = -b / (2 * a);
      return root > 0 && root < 1 ? [root] : [];
    }

    // Numerically stable quadratic formula; the second root uses c/q.
    const q = -0.5 * (b + (b >= 0 ? squareRoot : -squareRoot));
    const candidates = q === 0
      ? [-b / (2 * a)]
      : [q / a, c / q];
    return candidates.filter((root, index) =>
      root > 0 && root < 1 && candidates.indexOf(root) === index
    );
  }

  // Exact axis-aligned bounds of SVG M/L/C/Z paths. Cubic Bézier extrema
  // are solved analytically; control points are never mistaken for ink.
  // Unknown commands fail closed so a new outline syntax cannot silently
  // produce an incomplete or misleading bound.
  function pathBoundsFromSvgPath(path) {
    if (typeof path !== 'string') throw new TypeError('SVG path must be a string');
    if (!path.trim()) return null;

    const tokens = [];
    const tokenPattern = /([A-Za-z])|([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
    let cursor = 0;
    let match;
    while ((match = tokenPattern.exec(path)) !== null) {
      const separator = path.slice(cursor, match.index);
      if (!/^[\s,]*$/.test(separator)) {
        throw new Error('Unsupported SVG path syntax near: ' + separator);
      }
      tokens.push(match[1] || Number(match[2]));
      cursor = tokenPattern.lastIndex;
    }
    if (!/^[\s,]*$/.test(path.slice(cursor))) {
      throw new Error('Unsupported trailing SVG path syntax');
    }

    let bounds = null;
    function includePoint(px, py) {
      if (!Number.isFinite(px) || !Number.isFinite(py)) {
        throw new Error('Non-finite SVG path coordinate');
      }
      if (!bounds) {
        bounds = { xMin: px, yMin: py, xMax: px, yMax: py };
        return;
      }
      bounds.xMin = Math.min(bounds.xMin, px);
      bounds.yMin = Math.min(bounds.yMin, py);
      bounds.xMax = Math.max(bounds.xMax, px);
      bounds.yMax = Math.max(bounds.yMax, py);
    }

    function includeCubic(p0, p1, p2, p3) {
      includePoint(p0[0], p0[1]);
      includePoint(p3[0], p3[1]);
      const xRoots = cubicDerivativeRoots(p0[0], p1[0], p2[0], p3[0]);
      const yRoots = cubicDerivativeRoots(p0[1], p1[1], p2[1], p3[1]);
      for (const t of xRoots) {
        includePoint(
          cubicValue(p0[0], p1[0], p2[0], p3[0], t),
          cubicValue(p0[1], p1[1], p2[1], p3[1], t)
        );
      }
      for (const t of yRoots) {
        includePoint(
          cubicValue(p0[0], p1[0], p2[0], p3[0], t),
          cubicValue(p0[1], p1[1], p2[1], p3[1], t)
        );
      }
    }

    let index = 0;
    let command = null;
    let x = 0;
    let y = 0;
    let subpathX = 0;
    let subpathY = 0;

    while (index < tokens.length) {
      if (typeof tokens[index] === 'string') {
        command = tokens[index++];
        const upper = command.toUpperCase();
        if (!'MLCZ'.includes(upper)) {
          throw new Error('Unsupported SVG path command: ' + command);
        }
        if (upper === 'Z') {
          includePoint(x, y);
          includePoint(subpathX, subpathY);
          x = subpathX;
          y = subpathY;
          command = null;
        }
        continue;
      }

      if (!command) throw new Error('SVG path numbers without a command');
      const upper = command.toUpperCase();
      const relative = command !== upper;
      const groupSize = upper === 'C' ? 6 : 2;
      if (index + groupSize > tokens.length ||
          tokens.slice(index, index + groupSize).some((value) => typeof value !== 'number')) {
        throw new Error('Malformed SVG path command: ' + command);
      }
      const values = tokens.slice(index, index + groupSize);
      index += groupSize;

      if (upper === 'M') {
        x = values[0] + (relative ? x : 0);
        y = values[1] + (relative ? y : 0);
        subpathX = x;
        subpathY = y;
        includePoint(x, y);
        // Additional coordinate pairs after moveto are implicit lineto.
        command = relative ? 'l' : 'L';
      } else if (upper === 'L') {
        x = values[0] + (relative ? x : 0);
        y = values[1] + (relative ? y : 0);
        includePoint(x, y);
      } else if (upper === 'C') {
        const baseX = x;
        const baseY = y;
        const p0 = [baseX, baseY];
        const p1 = [values[0] + (relative ? baseX : 0), values[1] + (relative ? baseY : 0)];
        const p2 = [values[2] + (relative ? baseX : 0), values[3] + (relative ? baseY : 0)];
        const p3 = [values[4] + (relative ? baseX : 0), values[5] + (relative ? baseY : 0)];
        includeCubic(p0, p1, p2, p3);
        x = p3[0];
        y = p3[1];
      }
    }
    return bounds;
  }

  // JavaScript source ranges in the engine are UTF-16 code-unit offsets.
  // HarfBuzzJS 1.6.4 Buffer.addText uses hb_buffer_add_utf16; pin that contract
  // with one supplementary-plane scalar between two BMP characters.
  const UTF16_CLUSTER_PROBE_TEXT = 'A\u{1F600}B';
  function probeUtf16ClusterOffsets(hb, font, face, fixture) {
    if (!fixture || fixture.name !== 'DejaVuSans.ttf') return null;
    const expectedCodepoints = [0x41, 0x1F600, 0x42];
    const supported = new Set(Array.from(face.collectUnicodes(), Number));
    const missing = expectedCodepoints.filter((cp) => !supported.has(cp)).map(hexCodepoint);
    if (missing.length) {
      throw new Error('DejaVuSans UTF-16 cluster probe is missing codepoints: ' + missing.join(', '));
    }
    const expectedGlyphIds = expectedCodepoints.map((cp) => Number(font.glyph(cp)));
    if (expectedGlyphIds.some((gid) => !Number.isInteger(gid) || gid <= 0)) {
      throw new Error('DejaVuSans UTF-16 cluster probe resolved a missing glyph: ' + JSON.stringify(expectedGlyphIds));
    }

    const buffer = new hb.Buffer();
    buffer.addText(UTF16_CLUSTER_PROBE_TEXT);
    buffer.setDirection(hb.Direction.LTR);
    buffer.setScript('Latn');
    buffer.setLanguage('en');
    buffer.setClusterLevel(hb.ClusterLevel.MONOTONE_GRAPHEMES);
    hb.shape(font, buffer, []);

    const infos = buffer.getGlyphInfos();
    const actualClusters = infos.map((info) => Number(info.cluster));
    const actualGlyphIds = infos.map((info) => Number(info.codepoint));
    const expectedClusters = [0, 1, 3]; // A=0, supplementary scalar=1..2, B=3
    if (infos.length !== expectedClusters.length ||
        JSON.stringify(actualClusters) !== JSON.stringify(expectedClusters) ||
        JSON.stringify(actualGlyphIds) !== JSON.stringify(expectedGlyphIds)) {
      throw new Error('HarfBuzz UTF-16 cluster contract mismatch: ' + JSON.stringify({
        text: UTF16_CLUSTER_PROBE_TEXT,
        expectedClusters,
        actualClusters,
        expectedGlyphIds,
        actualGlyphIds
      }));
    }
    const sourceStart = 37;
    const sourceRangeAudit = clusterSourceRanges(UTF16_CLUSTER_PROBE_TEXT, actualClusters, sourceStart);
    const expectedSourceRanges = [
      { start: 37, end: 38 },
      { start: 38, end: 40 },
      { start: 40, end: 41 }
    ];
    if (JSON.stringify(sourceRangeAudit.ranges) !== JSON.stringify(expectedSourceRanges) ||
        sourceRangeAudit.coversFullSource !== true) {
      throw new Error('UTF-16 absolute source-range mapping mismatch: ' + JSON.stringify(sourceRangeAudit));
    }
    return {
      text: UTF16_CLUSTER_PROBE_TEXT,
      utf16Length: UTF16_CLUSTER_PROBE_TEXT.length,
      unicodeScalarCount: Array.from(UTF16_CLUSTER_PROBE_TEXT).length,
      expectedClusters,
      actualClusters,
      expectedGlyphIds,
      actualGlyphIds,
      clusterUnit: 'utf16-code-unit',
      clustersUseUtf16CodeUnitOffsets: true,
      sourceStart,
      expectedSourceRanges,
      actualSourceRanges: sourceRangeAudit.ranges,
      sourceRangesDoNotSplitSurrogatePairs: true
    };
  }


  // Build HarfBuzz input with clusters supplied by the canonical itemizer.
  // The caller provides the resolved ScriptRun plus its source graphemes;
  // HarfBuzz must not run a second Unicode grapheme segmentation pass.
  function buildExplicitClusterInput(sourceText, run, graphemes) {
    sourceText = String(sourceText);
    if (!run || !Number.isSafeInteger(run.start) || !Number.isSafeInteger(run.end) ||
        run.start < 0 || run.end <= run.start || run.end > sourceText.length ||
        typeof run.text !== 'string' || sourceText.slice(run.start, run.end) !== run.text) {
      throw new TypeError('ScriptRun must identify an exact UTF-16 source range and text');
    }
    if (typeof run.script !== 'string' || !run.script ||
        !['ltr', 'rtl'].includes(run.direction) ||
        !Number.isSafeInteger(run.bidiLevel) || run.bidiLevel < 0 ||
        (run.bidiLevel % 2 === 1) !== (run.direction === 'rtl')) {
      throw new TypeError('ScriptRun requires explicit Script, direction, and consistent Bidi embedding level');
    }
    if (!Number.isSafeInteger(run.graphemeStart) || !Number.isSafeInteger(run.graphemeEnd) ||
        run.graphemeStart < 0 || run.graphemeEnd <= run.graphemeStart ||
        !Array.isArray(graphemes) || run.graphemeEnd > graphemes.length) {
      throw new TypeError('ScriptRun grapheme indices are invalid');
    }
    if (run.start > 0xFFFFFFFF || run.end > 0xFFFFFFFF) {
      throw new RangeError('HarfBuzz cluster indices exceed the uint32 cluster domain');
    }

    const runGraphemes = graphemes.slice(run.graphemeStart, run.graphemeEnd);
    let expectedStart = run.start;
    const scalarBoundaries = new Set([0, run.text.length]);
    for (let offset = 0; offset < run.text.length;) {
      scalarBoundaries.add(offset);
      const codePoint = run.text.codePointAt(offset);
      if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
        throw new TypeError('ScriptRun contains ill-formed UTF-16 at offset ' + offset);
      }
      offset += codePoint > 0xFFFF ? 2 : 1;
    }

    const graphemeStarts = [];
    for (let index = 0; index < runGraphemes.length; index++) {
      const grapheme = runGraphemes[index];
      if (!grapheme || grapheme.start !== expectedStart ||
          !Number.isSafeInteger(grapheme.end) || grapheme.end <= grapheme.start ||
          grapheme.end > run.end ||
          !scalarBoundaries.has(grapheme.start - run.start) ||
          !scalarBoundaries.has(grapheme.end - run.start) ||
          sourceText.slice(grapheme.start, grapheme.end) !== grapheme.text ||
          grapheme.shapeable !== true || grapheme.containsBidiControl ||
          grapheme.isBidiControl ||
          (Array.isArray(grapheme.scalars) && grapheme.scalars.some((scalar) => scalar.isBidiControl)) ||
          grapheme.script !== run.script ||
          grapheme.direction !== run.direction ||
          grapheme.bidiLevel !== run.bidiLevel) {
        throw new Error('Itemizer grapheme is not a contiguous shapeable member of the ScriptRun at index ' + index);
      }
      graphemeStarts.push(grapheme.start);
      expectedStart = grapheme.end;
    }
    if (expectedStart !== run.end) {
      throw new Error('Itemizer graphemes do not cover the complete ScriptRun');
    }

    const codepoints = [];
    let offset = 0;
    let graphemeIndex = 0;
    while (offset < run.text.length) {
      while (graphemeIndex + 1 < runGraphemes.length &&
          offset + run.start >= runGraphemes[graphemeIndex].end) {
        graphemeIndex++;
      }
      const codePoint = run.text.codePointAt(offset);
      if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
        throw new TypeError('Invalid Unicode scalar in ScriptRun at UTF-16 offset ' + offset);
      }
      codepoints.push({
        codePoint,
        cluster: graphemeStarts[graphemeIndex],
        relativeOffset: offset
      });
      offset += codePoint > 0xFFFF ? 2 : 1;
    }
    if (codepoints.length === 0 || codepoints[0].cluster !== run.start) {
      throw new Error('Explicit HarfBuzz cluster input does not start at the ScriptRun boundary');
    }
    return {
      text: run.text,
      sourceRange: { start: run.start, end: run.end },
      script: run.script,
      direction: run.direction,
      bidiLevel: run.bidiLevel,
      graphemeStarts,
      codepoints
    };
  }

  // Shape one already-itemized run. Cluster starts are supplied per scalar
  // from the engine's graphemes and are validated on HarfBuzz output.
  function shapeWithExplicitGraphemeClusters(hb, font, sourceText, run, graphemes, options = {}) {
    if (!hb || typeof hb.shape !== 'function' || !hb.Buffer || !hb.ClusterLevel) {
      throw new TypeError('A fully initialized HarfBuzzJS module is required');
    }
    if (!font || !Number.isSafeInteger(font.ptr)) {
      throw new TypeError('An initialized HarfBuzz Font instance is required');
    }
    const language = options.language;
    if (typeof language !== 'string' || !language.trim()) {
      throw new TypeError('Language must be supplied explicitly; it is never inferred from Script');
    }
    if (!Array.isArray(options.features)) {
      throw new TypeError('OpenType features must be supplied explicitly as an array');
    }
    const input = buildExplicitClusterInput(sourceText, run, graphemes);
    const buffer = new hb.Buffer();
    for (const item of input.codepoints) {
      buffer.add(item.codePoint, item.cluster);
    }
    buffer.setDirection(run.direction === 'rtl' ? hb.Direction.RTL : hb.Direction.LTR);
    buffer.setScript(run.script);
    buffer.setLanguage(language);
    // MONOTONE_CHARACTERS prevents HarfBuzz from discovering graphemes again.
    // Every scalar already carries the canonical itemizer's EGC start.
    buffer.setClusterLevel(hb.ClusterLevel.MONOTONE_CHARACTERS);
    buffer.setFlags(Number.isSafeInteger(options.bufferFlags)
      ? options.bufferFlags
      : hb.BufferFlag.DEFAULT);
    hb.shape(font, buffer, options.features);

    const infos = buffer.getGlyphInfos();
    const positions = buffer.getGlyphPositions();
    if (!infos.length || infos.length !== positions.length) {
      throw new Error('HarfBuzz returned an empty or inconsistent glyph/position result');
    }
    const allowedStarts = new Set(input.graphemeStarts);
    const outputClusters = infos.map((info) => Number(info.cluster));
    const invalidClusters = outputClusters.filter((cluster) =>
      !Number.isSafeInteger(cluster) || !allowedStarts.has(cluster));
    if (invalidClusters.length) {
      throw new Error('HarfBuzz produced cluster starts inside or outside supplied grapheme boundaries: ' +
        JSON.stringify({ invalidClusters, allowedStarts: input.graphemeStarts }));
    }
    if (!clustersMonotone(outputClusters, run.direction)) {
      throw new Error('HarfBuzz output clusters are not monotone in the ScriptRun direction');
    }
    const localClusters = outputClusters.map((cluster) => cluster - run.start);
    const clusterRanges = clusterSourceRanges(run.text, localClusters, run.start);
    if (!clusterRanges.coversFullSource || clusterRanges.uncoveredPrefixLength !== 0) {
      throw new Error('HarfBuzz shaped clusters do not cover the complete ScriptRun source range: ' +
        JSON.stringify(clusterRanges));
    }
    const glyphs = infos.map((info, index) => {
      const position = positions[index];
      const gid = Number(info.codepoint);
      const rawExtents = font.glyphExtents(gid);
      const extents = rawExtents ? {
        xBearing: Number(rawExtents.xBearing),
        yBearing: Number(rawExtents.yBearing),
        width: Number(rawExtents.width),
        height: Number(rawExtents.height)
      } : null;
      const outline = font.glyphToPath(gid);
      if (!Number.isSafeInteger(gid) || gid < 0 || typeof outline !== 'string') {
        throw new Error('HarfBuzz returned an invalid glyph or missing outline for GID ' + gid);
      }
      if (extents && Object.values(extents).some((value) => !Number.isFinite(value))) {
        throw new Error('HarfBuzz returned non-finite glyph extents for GID ' + gid);
      }
      return {
        gid,
        cluster: outputClusters[index],
        sourceRange: clusterRanges.ranges[index],
        flags: Number(info.flags),
        xAdvance: Number(position.xAdvance),
        yAdvance: Number(position.yAdvance),
        xOffset: Number(position.xOffset),
        yOffset: Number(position.yOffset),
        glyphExtents: extents,
        outline
      };
    });
    return {
      sourceRange: input.sourceRange,
      text: input.text,
      script: run.script,
      direction: run.direction,
      bidiLevel: run.bidiLevel,
      language,
      featureTags: options.featureTags || [],
      clusterPolicy: 'canonical grapheme starts supplied via Buffer.add(codePoint, absoluteUtf16Cluster); HarfBuzz MONOTONE_CHARACTERS',
      inputGraphemeStarts: input.graphemeStarts,
      inputCodepointClusters: input.codepoints.map((item) => item.cluster),
      outputClusters,
      allOutputClustersAreInputGraphemeStarts: invalidClusters.length === 0,
      clusterAudit: {
        uniqueClusterCount: clusterRanges.uniqueClusterCount,
        multiGlyphClusterCount: clusterRanges.multiGlyphClusterCount,
        repeatedClusterGlyphCount: clusterRanges.repeatedClusterGlyphCount,
        coversFullSource: clusterRanges.coversFullSource,
        sourceStart: clusterRanges.sourceStart,
        sourceEnd: clusterRanges.sourceEnd
      },
      glyphs
    };
  }

  function shapeWithHarfBuzz(hb, fontBytes, fixture) {
    if (!hb || typeof hb.shape !== 'function') throw new TypeError('HarfBuzz module is not initialized');
    if (!(fontBytes instanceof ArrayBuffer) && !ArrayBuffer.isView(fontBytes)) {
      throw new TypeError('fontBytes must be an ArrayBuffer or typed array');
    }
    fixture = fixture || {};
    const blob = new hb.Blob(fontBytes);
    const face = new hb.Face(blob, 0);
    const font = new hb.Font(face);
    const axisInfos = face.getAxisInfos();
    const axes = Object.keys(axisInfos).sort().map((tag) => ({
      tag,
      min: Number(axisInfos[tag].min),
      default: Number(axisInfos[tag].default),
      max: Number(axisInfos[tag].max)
    }));
    let appliedVariations = [];
    if (fixture.variationMode === 'max') {
      if (!axes.length) throw new Error('Expected a variable font with at least one axis: ' + fixture.name);
      appliedVariations = axes.map((axis) => ({ tag: axis.tag, value: axis.max }));
      font.setVariations(appliedVariations.map((item) => new hb.Variation(item.tag, item.value)));
    } else if (fixture.variationMode === 'min') {
      if (!axes.length) throw new Error('Expected a variable font with at least one axis: ' + fixture.name);
      appliedVariations = axes.map((axis) => ({ tag: axis.tag, value: axis.min }));
      font.setVariations(appliedVariations.map((item) => new hb.Variation(item.tag, item.value)));
    }

    const supported = new Set(Array.from(face.collectUnicodes(), Number));
    const utf16ClusterProbe = probeUtf16ClusterOffsets(hb, font, face, fixture);
    const textCodepoints = new Set();
    const baseCodepoints = new Set();
    const markCodepoints = new Set();
    for (const text of CASES) {
      for (const char of Array.from(text)) {
        const cp = char.codePointAt(0);
        textCodepoints.add(cp);
        if (cp >= 0x05D0 && cp <= 0x05EA) baseCodepoints.add(cp);
        if (cp >= 0x0591 && cp <= 0x05C7) markCodepoints.add(cp);
      }
    }
    const missingCodepoints = Array.from(textCodepoints)
      .filter((cp) => !supported.has(cp))
      .sort((a, b) => a - b)
      .map(hexCodepoint);
    const missingBaseCodepoints = Array.from(baseCodepoints)
      .filter((cp) => !supported.has(cp))
      .sort((a, b) => a - b)
      .map(hexCodepoint);
    const missingMarkCodepoints = Array.from(markCodepoints)
      .filter((cp) => !supported.has(cp))
      .sort((a, b) => a - b)
      .map(hexCodepoint);

    const features = FEATURE_TAGS.map((tag) => new hb.Feature(tag, 1));
    let explicitClusterProbe = null;
    if (missingCodepoints.length === 0) {
      const explicitText = CASES[0];
      const explicitRanges = [[0, 3], [3, 4], [4, 6], [6, 7]];
      const explicitSourceStart = 37;
      const explicitSource = 'x'.repeat(explicitSourceStart) + explicitText + 'tail';
      const explicitGraphemes = explicitRanges.map(([start, end]) => ({
        start: explicitSourceStart + start,
        end: explicitSourceStart + end,
        text: explicitText.slice(start, end),
        script: 'Hebr',
        direction: 'rtl',
        bidiLevel: 1,
        shapeable: true,
        containsBidiControl: false,
        isBidiControl: false,
        scalars: []
      }));
      const explicitRun = {
        start: explicitSourceStart,
        end: explicitSourceStart + explicitText.length,
        text: explicitText,
        script: 'Hebr',
        direction: 'rtl',
        bidiLevel: 1,
        graphemeStart: 0,
        graphemeEnd: explicitGraphemes.length
      };
      explicitClusterProbe = shapeWithExplicitGraphemeClusters(
        hb, font, explicitSource, explicitRun, explicitGraphemes,
        { language: 'he', features, featureTags: FEATURE_TAGS.slice() }
      );
    }
    const shapedCases = [];
    let notdefGlyphCount = 0;
    for (const text of CASES) {
      const buffer = new hb.Buffer();
      buffer.addText(text);
      buffer.setDirection(hb.Direction.RTL);
      buffer.setScript('Hebr');
      buffer.setLanguage('he');
      buffer.setClusterLevel(hb.ClusterLevel.MONOTONE_GRAPHEMES);
      hb.shape(font, buffer, features);

      const infos = buffer.getGlyphInfos();
      const positions = buffer.getGlyphPositions();
      if (infos.length !== positions.length) {
        throw new Error('HarfBuzz returned ' + infos.length + ' infos but ' + positions.length + ' positions');
      }
      if (!infos.length) throw new Error('HarfBuzz returned no glyphs for ' + JSON.stringify(text));

      const rawClusters = infos.map((info) => Number(info.cluster));
      const clusterRanges = clusterSourceRanges(text, rawClusters, Number(fixture.sourceStart) || 0);
      const monotoneClusters = clustersMonotone(rawClusters, 'rtl');
      if (!monotoneClusters || !clusterRanges.coversFullSource) {
        throw new Error('RTL cluster/source-range contract failed for ' + JSON.stringify(text) + ': ' +
          JSON.stringify({ rawClusters, clusterRanges, monotoneClusters }));
      }
      const glyphs = infos.map((info, index) => {
        const position = positions[index];
        const gid = Number(info.codepoint);
        const cluster = Number(info.cluster);
        const outline = font.glyphToPath(gid);
        const rawExtents = font.glyphExtents(gid);
        const glyphExtents = rawExtents ? {
          xBearing: Number(rawExtents.xBearing),
          yBearing: Number(rawExtents.yBearing),
          width: Number(rawExtents.width),
          height: Number(rawExtents.height)
        } : null;
        if (gid === 0) notdefGlyphCount++;
        if (!Number.isInteger(gid) || gid < 0) throw new Error('Invalid glyph ID ' + gid);
        if (!Number.isInteger(cluster) || cluster < 0 || cluster >= text.length) {
          throw new Error('Invalid source cluster ' + cluster + ' for ' + JSON.stringify(text));
        }
        if (typeof outline !== 'string') throw new Error('Missing outline path for GID ' + gid);
        if (glyphExtents && Object.values(glyphExtents).some((value) => !Number.isFinite(value))) {
          throw new Error('Non-finite HarfBuzz glyph extents for GID ' + gid);
        }
        return {
          gid,
          cluster,
          sourceRange: clusterRanges.ranges[index],
          flags: Number(info.flags),
          xAdvance: Number(position.xAdvance),
          yAdvance: Number(position.yAdvance),
          xOffset: Number(position.xOffset),
          yOffset: Number(position.yOffset),
          glyphExtents,
          outline
        };
      });
      shapedCases.push({
        text,
        direction: 'rtl',
        glyphs,
        clusterAudit: {
          clusterOrderMonotone: monotoneClusters,
          uniqueClusterCount: clusterRanges.uniqueClusterCount,
          multiGlyphClusterCount: clusterRanges.multiGlyphClusterCount,
          repeatedClusterGlyphCount: clusterRanges.repeatedClusterGlyphCount,
          sourceStart: clusterRanges.sourceStart,
          sourceEnd: clusterRanges.sourceEnd,
          uncoveredPrefixLength: clusterRanges.uncoveredPrefixLength,
          coversFullSource: clusterRanges.coversFullSource
        }
      });
    }

    let outlineSweep = null;
    if (fixture.sourceOutlineFormat === 'CFF' || fixture.sourceOutlineFormat === 'CFF2') {
      const maxp = face.referenceTable('maxp');
      if (!maxp || maxp.length < 6) throw new Error('CFF font is missing a valid maxp table: ' + fixture.name);
      const maxGlyphs = (maxp[4] << 8) | maxp[5];
      if (!Number.isInteger(maxGlyphs) || maxGlyphs <= 0) throw new Error('Invalid maxp.numGlyphs for ' + fixture.name);
      let outlineGlyphCount = 0;
      let emptyOutlineGlyphCount = 0;
      let exactPathBoundsGlyphCount = 0;
      let emptyPathBoundsGlyphCount = 0;
      let totalOutlinePathChars = 0;
      let digest = 2166136261;
      const outlinePaths = fixture.captureOutlinePaths ? [] : null;
      for (let gid = 0; gid < maxGlyphs; gid++) {
        const path = font.glyphToPath(gid);
        if (typeof path !== 'string') {
          throw new Error('CFF glyphToPath returned a non-string for ' + fixture.name + ' GID ' + gid);
        }
        const exactInkBounds = pathBoundsFromSvgPath(path);
        if (exactInkBounds) exactPathBoundsGlyphCount++; else emptyPathBoundsGlyphCount++;
        const rawExtents = font.glyphExtents(gid);
        const glyphExtents = rawExtents ? {
          xBearing: Number(rawExtents.xBearing),
          yBearing: Number(rawExtents.yBearing),
          width: Number(rawExtents.width),
          height: Number(rawExtents.height)
        } : null;
        if (glyphExtents && Object.values(glyphExtents).some((value) => !Number.isFinite(value))) {
          throw new Error('Non-finite CFF glyph extents for ' + fixture.name + ' GID ' + gid);
        }
        if (outlinePaths) outlinePaths.push({ gid, path, glyphExtents, exactInkBounds });
        if (path.length) outlineGlyphCount++; else emptyOutlineGlyphCount++;
        totalOutlinePathChars += path.length;
        digest ^= gid & 0xff;
        digest = Math.imul(digest, 16777619);
        digest ^= (gid >>> 8) & 0xff;
        digest = Math.imul(digest, 16777619);
        for (let i = 0; i < path.length; i++) {
          const code = path.charCodeAt(i);
          digest ^= code & 0xff;
          digest = Math.imul(digest, 16777619);
          digest ^= (code >>> 8) & 0xff;
          digest = Math.imul(digest, 16777619);
        }
      }
      outlineSweep = {
        outlineFormat: fixture.sourceOutlineFormat,
        glyphCount: maxGlyphs,
        outlineGlyphCount,
        emptyOutlineGlyphCount,
        exactPathBoundsGlyphCount,
        emptyPathBoundsGlyphCount,
        pathBoundsMethod: 'analytic-svg-cubic-extrema-v1',
        totalOutlinePathChars,
        outlineDigest: (digest >>> 0).toString(16).padStart(8, '0'),
        outlinePaths
      };
    }
    return {
      fontName: fixture.name || 'unnamed',
      fontFormat: fixture.format || 'unknown',
      normalizedFrom: fixture.normalizedFrom || null,
      sourceOutlineFormat: fixture.sourceOutlineFormat || null,
      utf16ClusterProbe,
      outlineSweep,
      unitsPerEm: Number(face.upem),
      harfBuzzVersion: hb.versionString(),
      featureTags: FEATURE_TAGS.slice(),
      direction: 'rtl',
      script: 'Hebr',
      language: 'he',
      clusterLevel: 'MONOTONE_GRAPHEMES',
      variationMode: fixture.variationMode || 'default',
      axisInfos: axes,
      appliedVariations,
      explicitClusterProbe,
      missingCodepoints,
      missingBaseCodepoints,
      missingMarkCodepoints,
      notdefGlyphCount,
      coverageStatus: missingBaseCodepoints.length === baseCodepoints.size
        ? 'none'
        : (missingCodepoints.length ? 'partial' : 'complete'),
      cases: shapedCases
    };
  }

  return {
    CASES, FEATURE_TAGS, UTF16_CLUSTER_PROBE_TEXT,
    clusterSourceRanges, clustersMonotone, pathBoundsFromSvgPath,
    buildExplicitClusterInput, shapeWithExplicitGraphemeClusters, shapeWithHarfBuzz
  };
});
