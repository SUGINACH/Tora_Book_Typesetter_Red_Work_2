// scripts/stage1-forensic-linemodel.js
// Deep dive: what does the LineModel (inside result.pages columns lines, and its
// `lineModel` field) carry — fragments, font identity, sizePt, paraId lineage?
// And what does meta/seq carry? This resolves TX-06/TY-01 classification.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = '/home/z/my-project/repo';
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

function main() {
  const corpus = process.argv[2] || path.join(AUD, 'no_long_test_text.txt');
  const text = fs.readFileSync(corpus, 'utf8');
  process.env.RED_ENABLE_STRETCH_RECLAIM = '1';
  process.env.RED_UNIFIED_IMUD = '1';

  const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
  const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
  const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const imp = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families });
  for (const [fam, file] of [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['David Libre', 'DavidLibre-Regular.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf']
  ]) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
  const settings = { ...getDefaultSettings(), ...imp.settings, 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
  const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
  const result = typeset(text, settings, {
    noRecommendations: true,
    marginFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Hadassah-Friedlaender-Regular.ttf')),
    windowFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankReal-Bold.ttf')),
    prefaceFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankRuhlLibre-VF.ttf')),
    headingFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/DavidLibre-Bold.ttf'))
  });

  // ---- inspect the LineModel inside a body column line ----
  const out = { lineModelSamples: [], metaSamples: [], lineModelStats: null };
  const stats = { lines: 0, hasLineModel: 0, lmKeys: {}, lmFragments: 0, fragKeys: {}, fragHasFont: 0, fragHasSize: 0, metaKeys: {}, lmWordsTypeString: 0, lmWordsTypeObj: 0 };
  let samplesTaken = 0;
  for (const pg of result.pages) {
    for (const col of (pg.columns || [])) {
      for (const ln of col) {
        stats.lines++;
        if (ln.lineModel) {
          stats.hasLineModel++;
          for (const k of Object.keys(ln.lineModel)) stats.lmKeys[k] = (stats.lmKeys[k] || 0) + 1;
          const frags = ln.lineModel.fragments || ln.lineModel.items || null;
          if (Array.isArray(frags)) {
            stats.lmFragments += frags.length;
            for (const f of frags) {
              for (const k of Object.keys(f)) stats.fragKeys[k] = (stats.fragKeys[k] || 0) + 1;
              if (f.fontKey != null || f.font != null) stats.fragHasFont++;
              if (f.sizePt != null || f.size != null) stats.fragHasSize++;
            }
          }
          const w0 = ln.lineModel.words && ln.lineModel.words[0];
          if (typeof w0 === 'string') stats.lmWordsTypeString++;
          else if (w0 && typeof w0 === 'object') stats.lmWordsTypeObj++;
          if (ln.meta) for (const k of Object.keys(ln.meta)) stats.metaKeys[k] = (stats.metaKeys[k] || 0) + 1;
          if (samplesTaken < 3) {
            out.lineModelSamples.push({
              page: pg.index, kind: ln.kind, level: ln.level,
              lineModel: JSON.parse(JSON.stringify(ln.lineModel, (k, v) => (k === 'words' && Array.isArray(v)) ? v.slice(0, 3).map(x => typeof x === 'object' ? x : x) : v)),
              meta: ln.meta ? JSON.parse(JSON.stringify(ln.meta)) : null,
              topLineWords: (ln.words || []).slice(0, 3)
            });
            samplesTaken++;
          }
        }
      }
    }
  }
  out.lineModelStats = stats;
  fs.writeFileSync('/home/z/my-project/scripts/forensic-linemodel-no_long.json', JSON.stringify(out, null, 2));
  console.error(JSON.stringify({
    lines: stats.lines, hasLineModel: stats.hasLineModel,
    lmKeys: stats.lmKeys, lmFragments: stats.lmFragments, fragKeys: stats.fragKeys,
    fragHasFont: stats.fragHasFont, fragHasSize: stats.fragHasSize,
    metaKeys: stats.metaKeys, wordsString: stats.lmWordsTypeString, wordsObj: stats.lmWordsTypeObj
  }, null, 2));
}
main();
