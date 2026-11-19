// scripts/stage1-forensic-typeseq.js
// Exact unified typeSeq + per-page-type column geometry from PageModel, vs baseline.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = '/home/z/my-project/repo';
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

function main() {
  const text = fs.readFileSync(path.join(AUD, 'no_long_test_text.txt'), 'utf8');
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

  const typeSeq = result.pages.map(p => p.type);
  const counts = {};
  for (const t of typeSeq) counts[t] = (counts[t] || 0) + 1;

  // per-type column geometry from PageModel geometry.columns
  const geoByType = {};
  for (const pg of result.pageModel.pages) {
    const t = pg.type || '?';
    if (!geoByType[t]) geoByType[t] = { pages: 0, columnsSeen: {} };
    geoByType[t].pages++;
    const g = pg.geometry || {};
    for (const c of (g.columns || [])) {
      const key = `x=${c.x},w=${c.w}`;
      geoByType[t].columnsSeen[key] = (geoByType[t].columnsSeen[key] || 0) + 1;
    }
    if (t === 'toc-detail' && !geoByType[t].sample) geoByType[t].sample = { index: pg.index, lines: (pg.lines || []).length, firstLine: (pg.lines || [])[0] ? { id: (pg.lines[0] || {}).id, kind: (pg.lines[0] || {}).kind, sizePt: (pg.lines[0] || {}).sizePt, words: ((pg.lines[0] || {}).words || []).slice(0, 3).map(w => w.text) } : null };
  }
  // shaar pages structure
  const shaarPages = result.pageModel.pages.filter(p => String(p.type).startsWith('shaar')).map(p => ({ index: p.index, type: p.type, shaar: p.shaar || null, lines: (p.lines || []).length, firstLines: (p.lines || []).slice(0, 6).map(l => ({ id: l.id, sizePt: l.sizePt, words: (l.words || []).slice(0, 4).map(w => w.text).join(' ') })) }));

  console.error(JSON.stringify({ typeSeq: counts, geoByType, shaarPages }, null, 1));
  fs.writeFileSync('/home/z/my-project/scripts/forensic-typeseq-no_long.json', JSON.stringify({ typeSeq, counts, geoByType, shaarPages }, null, 2));
}
main();
