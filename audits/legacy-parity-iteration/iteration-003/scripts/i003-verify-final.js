// i003-verify-final.js — full-book verification on the pushed HEAD (2702834):
// runs the exact app repro path (fonts via resolver, IMUD import, Kit 40, unified engine)
// and prints contentPreserved + mismatch summary + pages + layoutHash.
'use strict';
const fs = require('fs');
const path = require('path');
const RB = '/home/z/my-project/repo/red-build';
process.env.RED_UNIFIED_IMUD = '1';
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const catalog = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/imud-fonts.json'), 'utf8'));
const byFamily = new Map(catalog.map(e => [e.family, e.file]));
for (const fam of ['Guttman Rashi','FrankReal','David HB','Frank Ruhl Libre','אסיסטנט קל מאוד','ליבורנה מודגש','AlphaBlack','Lia Sgula','Alpha','AlphaLight','Noto Serif Hebrew','Hadassah Friedlaender','Livorna','David Libre']) {
  const file = byFamily.get(fam); if (!file) continue;
  fontResolver.registerFont(fam, fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts', file)), { source: 'i003-verify' });
}
fontResolver.registerFont('DavidLibre-Bold', fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/DavidLibre-Bold.ttf')), { source: 'i003-verify' });
const text = fs.readFileSync('/home/z/my-project/work/ref-pdfs/source-text.txt', 'utf8');
const rawDefaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
const regKeys = new Set(getSettingDefs().map(r => r.id));
const imp = importImudSettings(rawDefaults, regKeys, { contentHeightPx: 1040, availableFonts: new Set(byFamily.keys()) });
const settings = { ...getDefaultSettings(), ...imp.settings, 'measure-impl': 'font-metrics' };
const { registerAssets } = require(path.join(RB, 'src/engine/decoration/asset-registry'));
for (const [collection, colFile, setting] of [['shaar-main','shaar_main','imud-shaar-main'],['shaar-sub','shaar_sub','imud-shaar-sub'],['shaar-back','shaar_back','imud-shaar-back']]) {
  const idx = JSON.parse(fs.readFileSync(path.join(RB, `ui/assets/imud/${colFile}.index.json`), 'utf8'));
  const hit = idx.find(it => new RegExp('^\\s*40\\s+').test(String(it.name || '')));
  const full = JSON.parse(fs.readFileSync(path.join(RB, `ui/assets/imud/${colFile}.json`), 'utf8'));
  const items = full instanceof Array ? full : (full.items || []);
  const item = items.find(x => x.id === hit.id);
  registerAssets(collection, [{ id: item.id, name: item.name, svg: item.svg, box: item.box }]);
  settings[setting] = `imud:${collection}:${item.id}`;
}
const t0 = Date.now();
const result = typeset(text, settings, { noRecommendations: true });
const md = result.mismatchDetail || [];
// page-type tally from the page model (structure inventory)
const model = result.pageModel || result;
const pages = model.pages || result.pages;
const typeTally = {};
let chapterOpenings = 0;
for (const pg of pages) {
  const t = pg.type || 'unknown';
  typeTally[t] = (typeTally[t] || 0) + 1;
  if (pg.chapterOpening) chapterOpenings++;
}
const out = {
  pages: result.pages.length,
  layoutHash: result.layoutHash,
  profile: result.legacyProfile ? 'imud-legacy' : 'dp',
  contentPreserved: result.contentPreserved,
  mismatchKinds: md.length,
  pageTypes: typeTally,
  chapterOpenings,
  ms: Date.now() - t0,
};
console.log(JSON.stringify(out, null, 1));
if (md.length) console.log('MISMATCH DETAIL (first 10):', JSON.stringify(md.slice(0, 10), null, 1));
