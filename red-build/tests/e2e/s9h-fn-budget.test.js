// tests/e2e/s9h-fn-budget.test.js — U-8 (ביקורת שלמות 19.11/20.11): תקציב ההערות
// מגביל את **כל** הטורים — המרזב פרוש על רוחב תיבת-התוכן כולה.
//
// שורש שנסגר בענף העבודה: התכנון הוסיף את התקציב רק ל-usedHeight של הטור
// האחרון (planningUsedHeight) בעוד colCapacityOf נקרא עם fnBudget:false ⇒
// הטור הימני (RTL) מילא את הקיבולת המלאה וחדר למרזב ההערות החוצה-רוחב.
// הוכחה לפני התיקון (מדידה מוקרנת כולל מתיחת aqStretch, ענף העבודה):
//   no_long ‏2 טורים חודרים (p58:‏ 44.5px; p62:‏ 3.4px), mid_long ‏27 (עד
//   520.5px) — **כולם** לא-אחרונים; הטור האחרון: אפס (החתימה הדטרמיניסטית
//   של האמנה החצויה). H-2: ב-28 עמודים הוצב סמן בטור בעוד טור אחר באותו
//   עמוד כבר חרג מגבול המרזב.
// אמנה אחת: planningUsedHeight = שורות בלבד; הקיבולת (colCapacityOf)
// מודעת-תקציב לכל טור; הכלה ברמת העמוד ב-reserveAtMarker (pageFitsNoteBudget).
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
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

/** תחתית גוף מוקרנת מ-y ההתחלה של הטור — אותה גיאומטריה כמו materialize. */
function projectedBodyBottom(pg, col) {
  const cb = pg.template.contentBox;
  let y = cb.top + (pg.spanning && pg.spanning.heightPx ? pg.spanning.heightPx : 0);
  for (const ln of col) y += (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
  return y;
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

describe('U-8 — תקציב ההערות מגביל את כל הטורים (המרזב חוצה-עמוד)', () => {
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

  it('התקציב דווקא בטור הלא-אחרון: המקרה שנכשל לפני התיקון (no_long — נמדד p58/p62)', () => {
    const text = fs.readFileSync(path.join(RB, '..', 'audits', 'no_long_test_text.txt'), 'utf8');
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
    // לפני התיקון: 2 חדירות בטור הלא-אחרון (עמ' 58:‏ 44.5px; עמ' 62:‏ 3.4px — נמדד)
    assertEq(nonLastViolations, 0, 'אף טור לא-אחרון אינו חודר למרזב בקורפוס no_long');
  });

  it('H-2 — הכלה ברמת העמוד: אין עמוד שבו סמן הוצב בעוד טור אחר חורג מהמרזב', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    const MARK_TAG = '\uE102';
    let bad = [];
    for (const pg of r.pages) {
      const fns = pg.footnotes || [];
      if (!fns.length) continue;
      const cb = pg.template.contentBox;
      const gutterTop = cb.bottom - (pg.fnReservedHeightPx > 0 ? pg.fnReservedHeightPx : fns.reduce((s, n) => s + (n.heightPx || 0), 0));
      const exceeds = pg.columns.some(col => projectedBodyBottom(pg, col) > gutterTop + 0.5);
      const hasMarker = pg.columns.some(col => col.some(ln => (ln.words || []).some(w => String(w).includes(MARK_TAG))));
      if (exceeds && hasMarker) bad.push(pg.index);
    }
    // לפני התיקון: 2 עמודים כאלה ב-no_long ו-26 ב-mid_long (נמדד)
    assertEq(bad.length, 0, 'עמודים שבהם הוצב סמן לצד חדירת טור: ' + JSON.stringify(bad.slice(0, 5)));
  });

  it('F-17 נשמר: כל ההערות נשמרות ואף מילה לא אבדה (contentPreserved)', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    // הספירה הכוללת נשמרת — אף הערה לא נעלמה ולא הוכפלה
    const total = r.pages.reduce((s, pg) => s + (pg.footnotes || []).length, 0);
    assertEq(total, 20, `כל ההערות נשמרו (צפוי 20 — 14 מ-i%3==1 + 6 מ-i%7==3; קיבלנו ${total})`);
    assert(r.contentPreserved !== false, 'contentPreserved');
  });

  it('המרזב בהקרנה: תחתית הגוף בכל טור מעל ראש המרזב (contentBox.bottom − reserved)', () => {
    const r = typeset(noteRichDoc(), imudSettings, envExtras);
    const fnPages = r.pages.filter(pg => (pg.footnotes || []).length);
    for (const pg of fnPages) {
      const cb = pg.template.contentBox;
      const gutterTop = cb.bottom - (pg.fnReservedHeightPx || 0);
      pg.columns.forEach((col, ci) => {
        const y = projectedBodyBottom(pg, col);
        assert(y <= gutterTop + 0.75, `עמ' ${pg.index} טור ${ci}: תחתית הגוף ${y.toFixed(1)} חייבת ≤ ראש המרזב ${gutterTop.toFixed(1)}`);
      });
    }
  });

  it('הערה חוצת-עמודים: פיצול/העברה שלמה — הכלה בכל עמוד מעורב ושימור מלא (S75)', () => {
    const doc = [
      'כותרת 1 - חלק ההערות החוצות-עמודים',
      'פסקת פתיחה למילוי ראש העמוד. ' + 'תוכן למילוי ראש העמוד ולזרימה רציפה '.repeat(30),
      `פסקה עם הערה בינונית-חוצה [${Array.from({ length: 200 }, (_, i) => `הערה_חוצה_${i}`).join(' ')}] והמשך הטקסט אחריה.`,
      'פסקת סיום עם עוד תוכן לזרימה. ' + 'סיום למילוי '.repeat(40)
    ].join('\n');
    // שני מצבים חוקיים: (א) ברירת מחדל — הערה שלמה עוברת עם הסמן לעמוד שמכיל
    // אותה; (ב) block+barMax — פיצול אמיתי עם המשכים. בשניהם: אף עמוד מעורב
    // אינו חודר למרזב, כל מילות ההערה נשמרות בדיוק פעם אחת, והתוכן שלם.
    for (const mode of [
      { label: 'default-move-whole', settings: {} },
      { label: 'block-split-barMax', settings: { 'fn-layout-mode': 'block', 'fn-bar-max-height-px': 300 } }
    ]) {
      const r = typeset(doc, { ...imudSettings, ...mode.settings }, envExtras);
      assert(r.pages.length >= 2, `[${mode.label}] מסמך רב-עמודים: ${r.pages.length}`);
      const pagesWithTheNote = r.pages.filter(pg => (pg.footnotes || []).some(n => String(n.text || '').includes('הערה_חוצה_')));
      assert(pagesWithTheNote.length >= 1, `[${mode.label}] ההערה קיימת במודל`);
      for (const pg of pagesWithTheNote) {
        const cap = colCapacityOf(pg);
        pg.columns.forEach((col, ci) => {
          const used = renderedColHeight(col);
          assert(used <= cap + 0.5, `[${mode.label}] עמ' ${pg.index} טור ${ci}: ${used.toFixed(1)} > cap ${cap.toFixed(1)}`);
        });
      }
      const totalNoteWords = pagesWithTheNote.reduce((s, pg) => s + (pg.footnotes || []).reduce((a, n) => a + String(n.text || '').split(/\s+/).filter(Boolean).length, 0), 0);
      assert(totalNoteWords >= 200, `[${mode.label}] מילות ההערה נשמרו במלואן (צפוי ≥200; קיבלנו ${totalNoteWords})`);
      assert(r.contentPreserved !== false, `[${mode.label}] contentPreserved`);
      if (mode.label === 'block-split-barMax') {
        const conts = pagesWithTheNote.reduce((s, pg) => s + (pg.footnotes || []).filter(n => n.isContinuation).length, 0);
        assert(conts >= 1, `[${mode.label}] פיצול אמיתי עם המשך (קיבלנו ${conts})`);
        for (const pg of pagesWithTheNote) {
          for (const n of (pg.footnotes || [])) {
            assert((n.heightPx || 0) <= 305, `[${mode.label}] חלק ההערה עובר את תקרת המרזב: ${n.heightPx}`);
          }
        }
      }
    }
  });

  it('טור מלא + סמן בטור הפנוי: הצבת הסמן אינה חודרת למרזב שנוצר', () => {
    // פסקה ארוכה בלי הערות ממלאת את הטור הימני עד תחתית הקיבולת; אחריה
    // פסקה קצרה עם הערה שהסמן שלה נוחת בטור השמאלי (הפנוי) — התקציב שנוצר
    // חייב להיכלל בשני הטורים כבר בזמן ההחלטה (לא רק בפוסט-בדיקה).
    const doc = [
      'כותרת 1 - חלק טור-מלא-וסמן-בפנוי',
      'פסקה ראשונה ארוכה במיוחד בלי הערות שממלאת את הטור הימני עד תחתיתו. ' + 'מילוי רציף של הטור הימני לבדיקת הקיבולת '.repeat(60),
      'פסקה שנייה קצרה עם הערה [הערה של הפסקה השנייה לבדיקת סמן בטור פנוי] וסיום קצר.',
      'פסקה שלישית להמשך הזרימה. ' + 'עוד תוכן לזרימה '.repeat(30)
    ].join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    for (const pg of r.pages) {
      if (!(pg.footnotes || []).length) continue;
      const cap = colCapacityOf(pg);
      pg.columns.forEach((col, ci) => {
        const used = renderedColHeight(col);
        assert(used <= cap + 0.5, `עמ' ${pg.index} טור ${ci}: ${used.toFixed(1)} > cap ${cap.toFixed(1)} (טור מלא)`);
      });
    }
    assert(r.contentPreserved !== false, 'contentPreserved');
    const noteTotal = r.pages.reduce((s, pg) => s + (pg.footnotes || []).length, 0);
    assertEq(noteTotal, 1, 'ההערה היחידה נשמרה בדיוק פעם אחת');
  });
});

report('s9h-fn-budget');
