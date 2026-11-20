// scripts/u15-legacy-catalog.js — U-15: אותו קטלוג במנוע המורשת (הייחוס)
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
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u15l' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
// מנוע המורשת — בלי _engine-force-unified
const legacySettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics' };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

const fixture = process.argv[2] || path.join(RB, '..', 'audits', 'very_long_test_text.txt');
const text = fs.readFileSync(fixture, 'utf8');
const t0 = Date.now();
const r = typeset(text, legacySettings, envExtras);
const ms = Date.now() - t0;

let totalHead = 0, justify = 0, center = 0, right = 0, other = {};
const findings = [];
for (const pg of r.pages) {
  for (const ln of (pg.columns ? pg.columns.flat() : [])) {
    if (ln.kind !== 'heading') continue;
    totalHead++;
    // במורשת ה-shaar/preface heading יושבים ב-band/spanning — בדיקת align של שורות הטור
  }
}
// המורשת מקרינה דרך legacy-projector — בודקים את מודל ההקרנה
const { projectLegacyDocument } = require(path.join(RB, 'src/engine/output/legacy-projector'));
let model = null;
try { model = projectLegacyDocument(r, legacySettings, {}); } catch (e) { console.log('projectLegacyDocument נכשל:', e.message); }
if (model) {
  for (const pml of model.pages || []) {
    for (const ml of pml.lines || []) {
      if (ml.kind !== 'heading') continue;
      totalHead++;
      if (ml.align === 'justify') justify++; else if (ml.align === 'center') center++; else if (ml.align === 'right') right++; else other[ml.align] = (other[ml.align] || 0) + 1;
      const ws = ml.words || [];
      if (ml.align === 'justify' && ws.length >= 2) {
        const inkR = Math.max(...ws.map(w => w.x + w.w));
        const inkL = Math.min(...ws.map(w => w.x));
        findings.push({ page: pml.index, type: pml.type, text: ws.map(w => w.text).join(' ').slice(0, 40), words: ws.length, x: ml.x, w: ml.w, inkL: Math.round(inkL * 10) / 10, inkR: Math.round(inkR * 10) / 10 });
      }
    }
  }
}
console.log(`fixture: ${path.basename(fixture)} | pages: ${r.pages.length} | ${ms}ms`);
console.log(`שורות heading בהקרנת המורשת: ${totalHead} | justify: ${justify} | center: ${center} | right: ${right} | אחר: ${JSON.stringify(other)}`);
console.log(`ממצאי justify במורשת: ${findings.length}`);
for (const f of findings.slice(0, 10)) console.log(JSON.stringify(f));
