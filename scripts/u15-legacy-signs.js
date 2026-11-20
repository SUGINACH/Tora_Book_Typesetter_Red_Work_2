// scripts/u15-legacy-signs.js — איפה ואיך המורשת מניחה את כותרות הסימן/ההקדמה
// (השוואת גיאומטריה מול 28 הממצאים ב-unified)
'use strict';
const fs = require('fs');
const path = require('path');

const RB = path.resolve(__dirname, '..', 'red-build');
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { projectLegacyDocument } = require(path.join(RB, 'src/engine/output/legacy-projector'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u15s' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
const legacySettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics' };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

const fixture = process.argv[2] || path.join(RB, '..', 'audits', 'very_long_test_text.txt');
const text = fs.readFileSync(fixture, 'utf8');
const r = typeset(text, legacySettings, envExtras);
const model = projectLegacyDocument(r, legacySettings, {});

// חיפוש הטקסטים של 28 הממצאים בהקרנת המורשת — איפה הם ומה הגיאומטריה
const targets = ['בחלקי ואופני', 'בגדר פסול דלמעלה', 'קורה בתוך עשרים ומקצת', 'חוד קורה', 'שבו איש', 'ההפרדה וההגדרה', 'הקדמות וכללים'];
console.log('=== חיפוש בהקרנת המורשת ===');
for (const t of targets) {
  let found = 0;
  for (const pml of model.pages || []) {
    for (const ml of pml.lines || []) {
      const full = (ml.words || []).map(w => w.text).join(' ');
      if (full.includes(t)) {
        found++;
        if (found <= 2) {
          const ws = ml.words || [];
          const inkL = ws.length ? Math.min(...ws.map(w => w.x)) : null;
          const inkR = ws.length ? Math.max(...ws.map(w => w.x + w.w)) : null;
          console.log(JSON.stringify({ target: t, page: pml.index, type: pml.type, kind: ml.kind, align: ml.align, words: ws.length, x: Math.round((ml.x||0)*10)/10, w: Math.round((ml.w||0)*10)/10, inkL: inkL != null ? Math.round(inkL*10)/10 : null, inkR: inkR != null ? Math.round(inkR*10)/10 : null, sizePt: ml.sizePt, text: full.slice(0, 50) }));
        }
      }
    }
    // גם bands
    for (const b of pml.bands || []) {
      const full = (b.words || []).map(w => w.text).join(' ');
      if (full.includes(t)) {
        console.log(JSON.stringify({ target: t, page: pml.index, type: pml.type, BAND: true, align: b.align, text: full.slice(0, 50), x: b.x, w: b.w }));
      }
    }
  }
  if (!found) console.log(JSON.stringify({ target: t, note: 'לא נמצא בשורות הטור של ההקרנה' }));
}
