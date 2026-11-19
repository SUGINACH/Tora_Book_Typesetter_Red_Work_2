// tests/e2e/s9g-sign-open-stack.test.js — מקבץ פתיחת-סימן: שער + H3 + זרימה באותו עמוד
//
// סוגר את הכשל המרכזי שנמצא בחקירת 19.11 (full-math על very_long):
// עמוד פתיחת-סימן שסעיפו נפתח בכותרת-רוחבית (H3) נותר כמעט ריק — סעיף
// ה-H3 במתכנן ראה \"טורים לא-ריקים\" (שורות השער שהוצבו בטור עם הליווי)
// והחליף עמוד. במורשת (flowSection) פס ה-H3 נבנה **מתחת לשער באותו עמוד**
// והזרימה ממשיכה שם. תוצאת הכשל ב-unified: 7,873 מילים ב-88 עמודי
// sign-open מול 36,027 במורשת; 851 עמודים מול 699.
//
// התיקון: מקבץ פתיחת-סימן — כשהעמוד הוא chapterOpening מסוג sign-open
// שטוריו מכילים רק שורות שער, השער נבלע בפס יחד עם ה-H3 (ערימה:
// שער → H3 → טורים) ואין החלפת עמוד. מיקום השער אינו משתנה (contentBox.top).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { typeset } = require('../../src/engine/core/pipeline');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { registerFont } = require('../../src/engine/typography/measure-api');

function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const { getSettingDefs } = require('../../src/engine/core/settings-registry');
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  return importImudSettings(legacy, regKeys, { availableFonts: families }).settings;
}
function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'],
  ];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
}
function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf'),
  };
}
const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

describe('s9g — מקבץ פתיחת-סימן: שער + H3 באותו עמוד (כמו flowSection של המורשת)', () => {
  const settings = liveSettings();
  registerLiveFonts();
  const raw = fs.readFileSync(path.join(RB, '..', 'audits', 'no_long_test_text.txt'), 'utf8');
  const res = typeset(raw, { ...settings, '_engine-force-unified': true }, { env: typesetEnvExtras() });
  const pm = res.pageModel;

  it('עמוד פתיחת-סימן שאחריו H3: השער וה-H3 באותו עמוד, והזרימה ממשיכה מתחת', () => {
    // הפרק הראשון: \"כותרת 2 ... קדושת יום השבת\" ואז \"כותרת 3 ... מהות השבת\"
    const so = pm.pages.find(p => p.type === 'sign-open'
      && (p.lines || []).some(l => l.area === 'spanning'));
    assert(so, 'קיים עמוד sign-open עם פס מוקבץ');
    const span = (so.lines || []).filter(l => l.area === 'spanning');
    const texts = span.map(l => (l.words || []).map(w => w.text).join(' '));
    assertEq(span.length, 2, 'שער + H3 בפס (2 שורות)');
    assert(/קדושת יום השבת/.test(texts[0] || ''), 'שורת השער ראשונה בפס');
    assert(/מהות השבת/.test(texts[1] || ''), 'שורת ה-H3 שנייה בפס');
    const colLines = (so.lines || []).filter(l => l.area === 'column');
    assert(colLines.length >= 15, `הזרימה ממשיכה בעמוד (${colLines.length} שורות גוף; לפני התיקון: 1)`);
  });

  it('מיקום השער לא השתנה: שורת הפס הראשונה ב-contentBox.top (287.2) — כמו קודם', () => {
    const so = pm.pages.find(p => p.type === 'sign-open'
      && (p.lines || []).some(l => l.area === 'spanning'));
    const first = (so.lines || []).find(l => l.area === 'spanning');
    assertEq(first.y, 287.2, 'y של שורת השער');
  });

  it('אין עמודי sign-open ריקים: לכל פתיחת-סימן יש שורות (פס או טורים)', () => {
    const sos = pm.pages.filter(p => p.type === 'sign-open');
    assert(sos.length >= 3, `עמודי sign-open: ${sos.length}`);
    for (const p of sos) {
      const n = (p.lines || []).filter(l => l.area === 'column' || l.area === 'spanning').length;
      assert(n >= 1, `עמוד ${p.index}: לפחות שורה אחת (התקבל ${n})`);
    }
  });

  it('שלילת חתימת הכשל: אין עמוד sign-open עם פס שער שאין מתחתיו זרימה', () => {
    // חתימת הבאג המקורי: עמוד פתיחה עם שער (פס או שורת כותרת) ואפס שורות גוף —
    // התוכן נדחק לעמוד הבא. עכשיו: כל פתיחה עם שער בפס חייבת לשאת גם זרימה
    // (אלא אם זה סוף-ספר אמיתי — שורת הגוף האחרונה במסמך).
    const sos = pm.pages.filter(p => p.type === 'sign-open');
    for (const p of sos) {
      const hasBand = (p.lines || []).some(l => l.area === 'spanning');
      if (!hasBand) continue; // שער בטור — נבדק בבדיקה הקודמת
      const colLines = (p.lines || []).filter(l => l.area === 'column').length;
      assert(colLines >= 5, `עמוד ${p.index}: פס שער עם ${colLines} שורות גוף בלבד (חתימת הכשל הישן: 0-1)`);
    }
  });

  it('שלילה: H2 שאחריו פסקה (בלי H3) — התנהגות העמוד הקודמת נשתמרה (שער בטור, מילוי רגיל)', () => {
    // פתיחת הסימן השני בקורפוס נפתחת בפסקה — השער בטור והעמוד מתמלא כרגיל
    const sos = pm.pages.filter(p => p.type === 'sign-open');
    const withoutSpan = sos.filter(p => !(p.lines || []).some(l => l.area === 'spanning'));
    assert(withoutSpan.length >= 1, 'קיימת פתיחת-סימן בלי H3 מיד אחרי השער');
    for (const p of withoutSpan) {
      const gateInCol = (p.lines || []).some(l => l.area === 'column' && l.kind === 'heading');
      assert(gateInCol, `עמוד ${p.index}: השער בטור (התנהגות קודמת)`);
    }
  });

  it('אירועי התכנון: h2-gate-h3-stack נפלט עבור הפרק שנפתח ב-H3', () => {
    const ev = (res.events && res.events.events) || [];
    const stackEvents = ev.filter(e => e.label === 'h2-gate-h3-stack');
    assert(stackEvents.length >= 1, `אירועי מקבץ: ${stackEvents.length}`);
  });
});

report();
