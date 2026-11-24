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
      let totalOutlinePathChars = 0;
      let digest = 2166136261;
      const outlinePaths = fixture.captureOutlinePaths ? [] : null;
      for (let gid = 0; gid < maxGlyphs; gid++) {
        const path = font.glyphToPath(gid);
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
        if (outlinePaths) outlinePaths.push({ gid, path, glyphExtents });
        if (typeof path !== 'string') throw new Error('CFF glyphToPath returned a non-string for ' + fixture.name + ' GID ' + gid);
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

  return { CASES, FEATURE_TAGS, UTF16_CLUSTER_PROBE_TEXT, clusterSourceRanges, clustersMonotone, shapeWithHarfBuzz };
});
