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

      const glyphs = infos.map((info, index) => {
        const position = positions[index];
        const gid = Number(info.codepoint);
        const cluster = Number(info.cluster);
        const outline = font.glyphToPath(gid);
        if (gid === 0) notdefGlyphCount++;
        if (!Number.isInteger(gid) || gid < 0) throw new Error('Invalid glyph ID ' + gid);
        if (!Number.isInteger(cluster) || cluster < 0 || cluster >= text.length) {
          throw new Error('Invalid source cluster ' + cluster + ' for ' + JSON.stringify(text));
        }
        if (typeof outline !== 'string') throw new Error('Missing outline path for GID ' + gid);
        return {
          gid,
          cluster,
          flags: Number(info.flags),
          xAdvance: Number(position.xAdvance),
          yAdvance: Number(position.yAdvance),
          xOffset: Number(position.xOffset),
          yOffset: Number(position.yOffset),
          outline
        };
      });
      shapedCases.push({ text, glyphs });
    }

    return {
      fontName: fixture.name || 'unnamed',
      fontFormat: fixture.format || 'unknown',
      normalizedFrom: fixture.normalizedFrom || null,
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

  return { CASES, FEATURE_TAGS, shapeWithHarfBuzz };
});
