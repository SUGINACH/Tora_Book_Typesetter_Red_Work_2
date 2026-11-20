// scripts/u15-legacy-signs2.js — איפה הכותרת הגדולה של עמודי הסימן/ההקדמה במורשת
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
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u15s2' });
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

// סוגי העמודים במורשת
const types = {};
for (const p of r.pages) types[p.type] = (types[p.type] || 0) + 1;
console.log('סוגי עמודים במורשת:', JSON.stringify(types));

// מציאת עמודי sign-open והצצה למבנה שלהם
let shown = 0;
for (const p of r.pages) {
  if (p.type !== 'sign-open' || shown >= 2) continue;
  shown++;
  console.log(`\n=== sign-open עמ' ${p.index} ===`);
  const keys = Object.keys(p).filter(k => !['columns'].includes(k));
  console.log('שדות:', keys.join(', '));
  if (p.title) console.log('title:', JSON.stringify(p.title).slice(0, 200));
  if (p.signTitle) console.log('signTitle:', JSON.stringify(p.signTitle).slice(0, 200));
  if (p.spanning) console.log('spanning:', JSON.stringify(p.spanning).slice(0, 300));
  if (p.bands) console.log('bands:', JSON.stringify(p.bands).slice(0, 300));
  // השורה הראשונה של כל טור
  (p.columns || []).forEach((col, ci) => {
    if (col.length) {
      const ln = col[0];
      console.log(`טור ${ci} שורה ראשונה: kind=${ln.kind} level=${ln.level} isLast=${!!ln.isLast} sizePt=${ln.sizePt} words=${(ln.words || []).length} text=${(ln.words || []).join(' ').slice(0, 50)}`);
    }
  });
}

// עמודי preface
shown = 0;
for (const p of r.pages) {
  if (p.type !== 'preface' || shown >= 2) continue;
  shown++;
  console.log(`\n=== preface עמ' ${p.index} ===`);
  const keys = Object.keys(p).filter(k => !['columns'].includes(k));
  console.log('שדות:', keys.join(', '));
  (p.columns || []).forEach((col, ci) => {
    col.slice(0, 3).forEach((ln, li) => {
      console.log(`טור ${ci} שורה ${li}: kind=${ln.kind} level=${ln.level} isLast=${!!ln.isLast} sizePt=${ln.sizePt} text=${(ln.words || []).join(' ').slice(0, 50)}`);
    });
  });
}
