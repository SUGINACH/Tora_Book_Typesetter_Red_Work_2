// scripts/u17-catalog.js — U-17: שחזור בדיקת MARKER_NOTE_MATCH על ה-PageModel
// (מולטיסט סמני-גוף מול פתיחות-הערה, לפי טקסט הסמן — כמו האודיט)
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
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 'u17' });
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

// איסוף: סמני גוף (מילים mk בשורות טור) מול פתיחות-הערה (מילים mk בשורות אזור ההערות)
const bodyMk = {}, fnMk = {};
const bodyDetail = {}, fnDetail = {};
for (const pml of r.pageModel.pages) {
  // סמני גוף: מילים mk בשורות הטורים (כמו .w--fnmarker בגוף באודיט)
  for (const ml of pml.lines) {
    if (ml.area && ml.area !== 'column') continue;
    for (const w of (ml.words || [])) {
      if (!w.mk) continue;
      bodyMk[w.text] = (bodyMk[w.text] || 0) + 1;
      (bodyDetail[w.text] = bodyDetail[w.text] || []).push(pml.index);
    }
  }
  // פתיחות-הערה: רשומות ההערה במודל (marker קיים רק בפתיחה; המשכים נטולי-סמן)
  for (const n of (pml.footnotes || [])) {
    if (n.continuationOf || n.isContinuation) continue;
    const k = n.marker;
    if (k == null || k === '') continue;
    fnMk[k] = (fnMk[k] || 0) + 1;
    (fnDetail[k] = fnDetail[k] || []).push(pml.index);
  }
}
console.log(`fixture: ${path.basename(fixture)} | pages: ${r.pages.length}`);
console.log(`סמני גוף: ${Object.keys(bodyMk).length} מפתחות, סה"כ ${Object.values(bodyMk).reduce((a,b)=>a+b,0)}`);
console.log(`פתיחות הערה: ${Object.keys(fnMk).length} מפתחות, סה"כ ${Object.values(fnMk).reduce((a,b)=>a+b,0)}`);
let problems = 0, reDisplayed = 0;
for (const k of new Set([...Object.keys(bodyMk), ...Object.keys(fnMk)])) {
  const b = bodyMk[k] || 0, f = fnMk[k] || 0;
  if (b === 0 && f === 0) continue;
  if (b > 0 && f === 0) { problems++; console.log(`[אבודה] סמן '${k}' בגוף ×${b} (עמ' ${bodyDetail[k].join(',')}) — אין פתיחה`); }
  else if (f > 0 && b === 0) { problems++; console.log(`[יתומה] פתיחה '${k}' ×${f} (עמ' ${fnDetail[k].join(',')}) — אין סמן בגוף`); }
  else if (f < b) { problems++; console.log(`[חסרה] '${k}': גוף ×${b} (עמ' ${bodyDetail[k].join(',')}) > פתיחות ×${f} (עמ' ${fnDetail[k].join(',')})`); }
  else if (f > b) { reDisplayed += f - b; }
}
console.log(`ממצאים: ${problems} | הצגות חוזרות חוקיות: ${reDisplayed}`);
