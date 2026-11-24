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

  function shapeWithHarfBuzz(hb, fontBytes, texts = CASES) {
    if (!hb || typeof hb.shape !== 'function') throw new TypeError('HarfBuzz module is not initialized');
    if (!(fontBytes instanceof ArrayBuffer) && !ArrayBuffer.isView(fontBytes)) {
      throw new TypeError('fontBytes must be an ArrayBuffer or typed array');
    }

    const blob = new hb.Blob(fontBytes);
    const face = new hb.Face(blob, 0);
    const font = new hb.Font(face);
    const features = FEATURE_TAGS.map((tag) => new hb.Feature(tag, 1));
    const shapedCases = [];

    for (const text of texts) {
      if (typeof text !== 'string' || !text.length) throw new TypeError('shaping fixture text must be non-empty');
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
      harfBuzzVersion: hb.versionString(),
      featureTags: FEATURE_TAGS.slice(),
      direction: 'rtl',
      script: 'Hebr',
      language: 'he',
      clusterLevel: 'MONOTONE_GRAPHEMES',
      cases: shapedCases
    };
  }

  return { CASES, FEATURE_TAGS, shapeWithHarfBuzz };
});
