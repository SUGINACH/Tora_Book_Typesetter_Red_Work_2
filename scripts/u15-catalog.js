// scripts/u15-catalog.js — U-15: קטלוג מלא של שורות kind=heading עם align=justify
// (המקור המודלי של HEAD_JUSTIFIED באודיט — text-align נגזר מ-ml.align)
// שימוש: node scripts/u15-catalog.js [fixture]
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
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u15' });
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
const t0 = Date.now();
const r = typeset(text, imudSettings, envExtras);
const ms = Date.now() - t0;

// סריקת ה-PageModel: שורות kind=heading עם align=justify
const findings = [];
let totalHeadLines = 0;
let headJustified = 0;
let headCenter = 0;
let headOther = {};
for (const pml of (r.pageModel && r.pageModel.pages) || []) {
  const pg = { index: pml.index, type: pml.type };
  const lines = pml.lines || [];
  for (const ml of lines) {
    if (ml.kind !== 'heading') continue;
    totalHeadLines++;
    const words = (ml.words || []).length;
    if (ml.align === 'justify') headJustified++;
    else if (ml.align === 'center') headCenter++;
    else headOther[ml.align] = (headOther[ml.align] || 0) + 1;
    if (ml.align === 'justify' && words >= 2) {
      // המרכז הגיאומטרי של הדיו מול מרכז הטור/תיבה — לקטלוג
      const ws = ml.words || [];
      const inkR = Math.max(...ws.map(w => w.x + w.w));
      const inkL = Math.min(...ws.map(w => w.x));
      findings.push({
        page: pg.index, pageType: pg.type, text: ws.map(w => w.text).join(' ').slice(0, 40),
        words, x: Math.round(ml.x * 10) / 10, w: Math.round(ml.w * 10) / 10,
        inkL: Math.round(inkL * 10) / 10, inkR: Math.round(inkR * 10) / 10,
        asymFromCenter: Math.round((Math.abs((inkL + inkR) / 2 - (ml.x + ml.w / 2))) * 10) / 10,
        isLast: !!ml.isLast, sizePt: ml.sizePt
      });
    }
  }
}

console.log(`fixture: ${path.basename(fixture)} | pages: ${r.pages.length} | ${ms}ms`);
console.log(`שורות heading בסה"כ: ${totalHeadLines} | justify: ${headJustified} | center: ${headCenter} | אחר: ${JSON.stringify(headOther)}`);
console.log(`HEAD_JUSTIFIED (justify, מילים>=2): ${findings.length}`);
const byPage = {};
for (const f of findings) byPage[f.page] = (byPage[f.page] || 0) + 1;
console.log(`לפי עמוד: ${JSON.stringify(byPage)}`);
const byType = {};
for (const f of findings) byType[f.pageType] = (byType[f.pageType] || 0) + 1;
console.log(`לפי סוג עמוד: ${JSON.stringify(byType)}`);
console.log('--- הממצאים (עד 40) ---');
for (const f of findings.slice(0, 40)) console.log(JSON.stringify(f));
fs.writeFileSync('/tmp/u15-catalog.json', JSON.stringify({ fixture: path.basename(fixture), pages: r.pages.length, findings, totalHeadLines, headJustified, headCenter }, null, 1), 'utf8');
console.log('נשמר: /tmp/u15-catalog.json');
