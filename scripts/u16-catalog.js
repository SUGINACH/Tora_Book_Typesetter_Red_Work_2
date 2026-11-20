// scripts/u16-catalog.js — U-16: קטלוג שורות אחרונות ממורכזות עם אסימטריה
// (המקור המודלי של LAST_NOT_CENTERED באודיט — האודיט מודד דיו מול תיבת הטור)
'use strict';
const fs = require('fs');
const path = require('path');

const RB = path.resolve(__dirname, '..', 'red-build');
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u16' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
const imudSettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics', '_engine-force-unified': true };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

const fixture = process.argv[2] || path.join(RB, '..', 'audits', 'very_long_test_text.txt');
const text = fs.readFileSync(fixture, 'utf8');
const r = typeset(text, imudSettings, envExtras);

// שורות אחרונות ממורכזות (מילים>=2): אסימטריית דיו מול תיבת הטור — כמו האודיט
const findings = [];
let totalLastCenter = 0;
const asymBuckets = { '0-1': 0, '1-3': 0, '3-6': 0, '6+': 0 };
for (const pml of r.pageModel.pages) {
  for (const ml of pml.lines) {
    if (!ml.isLast || (ml.words || []).length < 2) continue;
    if (ml.align !== 'center') continue;
    totalLastCenter++;
    const ws = ml.words || [];
    const inkL = Math.min(...ws.map(w => w.x));
    const inkR = Math.max(...ws.map(w => w.x + w.w));
    const asym = Math.abs((inkL - ml.x) - (ml.x + ml.w - inkR));
    if (asym <= 1) asymBuckets['0-1']++;
    else if (asym <= 3) asymBuckets['1-3']++;
    else if (asym <= 6) asymBuckets['3-6']++;
    else asymBuckets['6+']++;
    if (asym > 3) {
      findings.push({
        page: pml.index, type: pml.type, area: ml.area || 'col',
        text: ws.map(w => w.text).join(' ').slice(0, 40),
        words: ws.length, asym: Math.round(asym * 10) / 10,
        Lgap: Math.round((inkL - ml.x) * 10) / 10, Rgap: Math.round((ml.x + ml.w - inkR) * 10) / 10,
        wordSizes: ws.map(w => w.sizePt || ml.sizePt).join(','), kind: ml.kind
      });
    }
  }
}
console.log(`fixture: ${path.basename(fixture)} | pages: ${r.pages.length}`);
console.log(`שורות אחרונות ממורכזות (מילים>=2): ${totalLastCenter} | דליי אסימטריה: ${JSON.stringify(asymBuckets)}`);
console.log(`ממצאים >3px במודל: ${findings.length}`);
for (const f of findings.slice(0, 20)) console.log(JSON.stringify(f));
fs.writeFileSync('/tmp/u16-catalog.json', JSON.stringify({ findings, totalLastCenter }, null, 1), 'utf8');
