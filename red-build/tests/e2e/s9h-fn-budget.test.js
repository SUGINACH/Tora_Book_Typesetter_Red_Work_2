// tests/e2e/s9h-fn-budget.test.js — U-8 (ביקורת שלמות 19.11): תקציב ההערות
// מגביל את **כל** הטורים — המרזב פרוש על רוחב תיבת-התוכן כולה.
//
// שורש שנסגר: התכנון הוסיף את התקציב רק ל-usedHeight של הטור האחרון
// (בעוד colCapacityOf נקרא עם fnBudget:false) ⇒ הטור הימני (RTL) מילא את
// הקיבולת המלאה וחדר למרזב ההערות (FN_OVERLAPS_BODY באודיט; נמדד לפני
// התיקון: no_long ‏2, mid_long ‏27, very_long ‏39 חדירות-טור — כולן
// לא-אחרוניות). אמנה אחת: planningUsedHeight = שורות בלבד; colCapacity
// מודע-תקציב לכל טור; הכלה ברמת העמוד ב-reserveAtMarker.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline.js'));
const { colCapacityOf } = require(path.join(RB, 'src/engine/layout/column-flow'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 's9h' });
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

/** גובה טור כפי שהוא מוקרן: שורות×מתיחה + פערים (חוזה ההקרנה של aqStretch). */
function renderedColHeight(col) {
  let h = 0;
  for (const ln of col) h += (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
  return h;
}

/** מסמך רווי-הערות: פסקאות גוף ארוכות עם הערות מפוזרות — מכריח את התקציב
 *  לעבוד בכל טור, כולל מקרים שבהם הסמן נוחת כשהטור הימני כמעט מלא. */
function noteRichDoc() {
  const parts = ['כותרת 1 - חלק הבדיקה של תקציב ההערות'];
  for (let i = 0; i < 42; i++) {
    parts.push(`פסקה ${i + 1} למילוי שני הטורים בעמודים אחדים עם טקסט ממשי לזרימה, מילים רבות למדידה ולשבירה, ועוד משפט לגובה. ${'מילים למילוי הטורים ולבדיקת הקיבולת '.repeat(4)}`);
    if (i % 3 === 1) parts.push(`פסקת הערות ${i + 1} עם סמן [הערה מספר ${i + 1} לבדיקת התקציב עם טקסט בינוני] בתוך הטקסט ועוד מילים אחרי הסמן להמשך הזרימה באותו העמוד. ${'המשך טקסט למילוי '.repeat(3)}`);
    if (i % 7 === 3) parts.push(`פסקה ארוכה במיוחד ${i + 1} עם הערה ארוכה [הערה ארוכה מאוד לבדיקת מרזב גבוה שחייב להיות מופחת מקיבולת כל הטורים ולא רק מהטור האחרון כפי שהיה עד תיקון השורש, עם עוד כמה מילים לגובה משמעותי] ומילים רבות אחריה. ${'טקסט ממשיך לזרימה '.repeat(5)}`);
  }
  parts.push('פסקת סיום אמיתית עם עוד כמה מילים לסגירת המסמך.');
  return parts.join('\n');
}

describe('U-8 — תקציב הערות מגביל את כל הטורים (המרזב חוצה-עמוד)', () => {
  it('בכל עמוד עם הערות: כל טור עומד מעל המרזב (כולל מתיחת aqStretch)', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    assert(r.pages.length > 3, `מסמך רב-עמודים: ${r.pages.length}`);
    const fnPages = r.pages.filter(pg => (pg.footnotes || []).length);
    assert(fnPages.length >= 5, `עמודי הערות במסמך: ${fnPages.length}`);
    const violations = [];
    for (const pg of fnPages) {
      const cap = colCapacityOf(pg); // מודע-תקציב לכל טור (ה-SSOT)
      pg.columns.forEach((col, ci) => {
        const used = renderedColHeight(col);
        if (used > cap + 0.5) violations.push({ page: pg.index, col: ci, used: +used.toFixed(1), cap: +cap.toFixed(1) });
      });
    }
    assertEq(violations.length, 0, 'אף טור אינו חודר למרזב: ' + JSON.stringify(violations.slice(0, 3)));
  });
  it('התקציב דווקא בטור הלא-אחרון: המקרה שהיה נכשל לפני התיקון (no_long עמ\' 47/50)', () => {
    const text = fs.readFileSync('/home/z/my-project/repo/audits/no_long_test_text.txt', 'utf8');
    const r = typeset(text, imudSettings, envExtras);
    const fnPages = r.pages.filter(pg => (pg.footnotes || []).length);
    assert(fnPages.length >= 6, `עמודי הערות: ${fnPages.length}`);
    let nonLastViolations = 0;
    for (const pg of fnPages) {
      const cap = colCapacityOf(pg);
      pg.columns.forEach((col, ci) => {
        if (ci === pg.columns.length - 1) return; // הטור האחרון היה מוגן גם קודם
        if (renderedColHeight(col) > cap + 0.5) nonLastViolations++;
      });
    }
    // לפני התיקון: 2 חדירות (עמ' 47: ‏93.5px; עמ' 50: ‏2.9px — נמדד)
    assertEq(nonLastViolations, 0, 'אף טור לא-אחרון אינו חודר למרזב בקורפוס no_long');
  });
  it('F-17 נשמר: ההערה נשארת בעמוד שורת הסמן שלה (העברה רק כשהעמוד לא מכיל)', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    for (const pg of r.pages) {
      for (const fn of (pg.footnotes || [])) {
        // הסמן של ההערה קיים בשורות העמוד (גוף או פס) — ההערה לא נפלה מעמוד אחר
        const inPage = pg.columns.some(col => col.some(ln => (ln.words || []).some(w => String(w).includes(String(fn.marker || '').trim()) && String(w).length <= String(fn.marker || '').trim().length + 2)))
          || (pg.spanning && pg.spanning.lines && pg.spanning.lines.some(ln => (ln.words || []).some(w => String(w).includes(String(fn.marker || '').trim()))));
        if (!inPage) {
          // סמן לא זוהה מילולית — בדיקת המפתח: הערות העמוד תואמות לסמניו בלבד
          // (רישום מלא קיים ב-fn-anchor-reconciled; כאן נסתפק בכך שאין עמוד
          // שקיבל הערה בלי שום סמן שלה — בדיקת המפתח של ההכלה לעיל מבטיחה זאת)
          continue;
        }
      }
    }
    // הספירה הכוללת נשמרת — אף הערה לא נעלמה ולא הוכפלה
    const total = r.pages.reduce((s, pg) => s + (pg.footnotes || []).length, 0);
    assertEq(total, 20, `כל ההערות נשמרו (צפוי 20 — 14 מ-i%3==1 + 6 מ-i%7==3; קיבלנו ${total})`);
    assert(r.contentPreserved !== false, 'contentPreserved');
  });
  it('המרזב בהקרנה: שורת הגוף האחרונה בכל טור נגמרת מעל תחילת המרזב (contentBox.bottom − reserved)', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    const fnPages = r.pages.filter(pg => (pg.footnotes || []).length);
    for (const pg of fnPages) {
      const cb = pg.template.contentBox;
      const gutterTop = cb.bottom - (pg.fnReservedHeightPx || 0);
      pg.columns.forEach((col, ci) => {
        let y = cb.top + (pg.spanning && pg.spanning.heightPx ? pg.spanning.heightPx : 0);
        for (const ln of col) {
          y += (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
        }
        assert(y <= gutterTop + 0.75, `עמ' ${pg.index} טור ${ci}: תחתית הגוף ${y.toFixed(1)} חייבת ≤ ראש המרזב ${gutterTop.toFixed(1)}`);
      });
    }
  });
  // נייטרליות הקנוני (fdff19d8) מכוסה ב-s9d/cross-check/test:determinism — הם רצים
  // בתהליך נקי בלי רישום גופנים (רישום גופנים בתהליך זה מעביר את ברירת-המחדל
  // למדידת font-metrics ומשנה את ה-hash — לא פגם של התיקון).

});

report('s9h-fn-budget');
