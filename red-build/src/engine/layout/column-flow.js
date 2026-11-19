// src/engine/layout/column-flow.js — Column geometry + block→column flow (S4 consumers registration)
// צרכנים אמיתיים: grid-col-width-pct, grid-gutter-pct, grid-block-gap-pct
'use strict';

const { buildPageTemplate } = require('./page-templates');

/**
 * רוחב טור יחיד בפיקסלים מתוך settings (מקור־האמת יחיד שמשמש גם dp-planner וגם pipeline).
 * grid-col-width-pct: אחוז רוחב טור מתוך שטח התוכן (צמוד ל‑PT-01..PT-10).
 * grid-gutter-pct: בולטה בין הטורים.
 */
function columnWidths(settings, pageWidthPx, contentWidthPx) {
  const gutter = (contentWidthPx * settings['grid-gutter-pct']) / 100;
  const cw = (contentWidthPx * settings['grid-col-width-pct']) / 100;
  return { colW: cw, gutter, totalUsed: cw * 2 + gutter, pageWidthPx };
}

/**
 * מרווח אנכי בין בלוקים בתוך טור (פסקה↔פסקה). נצרך ע"י flowing: כל בלוק חדש
 * בטור פותח ב‑gap הזה אלא אם הוא הראשון בטור.
 */
function blockGapPx(settings, lineH) {
  // grid-block-gap-pct נתון באחוזי גובה־שורת־גוף כדי שיישאר פרופורציונלי לגודל דפוס
  return Math.round((Number(settings['grid-block-gap-pct']) || 0) / 100 * lineH * 10);
}

/**
 * האם בלוק חוסם מעבר טור רגיל (full-width headings H1/H2 לפי mode).
 */
function isFullWidthBlock(block, settings) {
  if (block.kind === 'heading') {
    const mode = settings[`heading-${block.level}-mode`];
    return mode === 'full-width' || mode === 'new-page';
  }
  return block.fullWidth === true;
}

/**
 * **FX-6 (שלב 5 פרוסה 2) — נרמול פערים אחרי שינוי מבני של טור:**
 * שורה שהפכה לראש הטור (איזון/הזזה/פיצול) אינה נושאת עוד פער-כניסה —
 * GAP_HEAD_POLICY (constraint-matrix): דיכוי בראש טור. החלפת הייחוס בעותק
 * שומרת על אובייקטי השורה המשותפים (rollback/צילומי-מצב) ללא מוטציה.
 * @param {Array} col - טור (מערך שורות ממוקמות)
 */
function normalizeColumnGaps(col) {
  if (col.length && col[0].gapBeforePx) col[0] = { ...col[0], gapBeforePx: 0 };
}

/**
 * **S5.2 (P-2 — איחוד חישוב קיבולת טור):** המקור היחיד לקיבולת האפקטיבית
 * של טור בעמוד DP: גובה תיבת התוכן מהתבנית, בהפחתת:
 *  - הפס החוצה־טורים (spanning band, FWD-1) — הטורים מתחילים מתחתיו;
 *  - תקציב ההערות של העמוד (fnReservedHeightPx, F-17) — חוצה־רוחב (R3-C2);
 *  - **(פרוסה 2)** שמורות אחידות (`page.reservations`) — מנגנון ההרחבה
 *    של שלב 6: כל אזור שמקטין את שטח הגוף (ריהוט, עיטור שמזמין מקום,
 *    אזור שמור לפריט בלתי-ניתן לפיצול) נרשם כאן פעם אחת ומופחת מכל
 *    הטורים (scope:'all-columns') או מהטור האחרון בלבד (scope:'last-column')
 *    — ללא שינוי ליבת המתכנן.
 *
 * **מודל הקיבולת המיוצג (§2.6 בביקורת):** `capacityReservationsOf(page)`
 * מפרט במפורש כל גורם שמקטין את שטח הגוף — margins/headers/folio כבר
 * מיוצגים בתיבת התוכן של התבנית (page-templates), הפס החוצה־טורים ותקציב
 * ההערות כאן, עיטורי H2/סגנונות בתוך גבהי השורות עצמן (F-08) והשאר —
 * דרך ה-reservations. מקור אחד, ייצוג אחד, ללא חישובים מקביליים.
 *
 * @param {object} page - עמוד DP: template.contentBox, spanning?, fnReservedHeightPx?, reservations?, columns
 * @param {{colIndex?:number, fnBudget?:boolean}} [opts]
 *  - colIndex: הטור שאליו שייכת הקיבולת (ברירת מחדל: האחרון — המחמיר);
 *    שמורות last-column מופחתות ממנו בלבד.
 *  - fnBudget:false — ביטול הפחתת תקציב ההערות (למי שמודד usage כולל
 *    התקציב בעצמו — כמו usedHeight של dp-planner או extraLast של optimalSplit).
 */
function colCapacityOf(page, opts = {}) {
  if (!page || !page.template || !page.template.contentBox) return 0;
  let cap = page.template.contentBox.height;
  if (page.spanning && page.spanning.heightPx) cap -= page.spanning.heightPx;
  const fn = opts.fnBudget !== false && page.fnReservedHeightPx > 0 ? page.fnReservedHeightPx : 0;
  // **S6.0 (R3-C2 — מרזב חוצה-טורים):** אזור ההערות נמשך לרוחב תיבת
  // התוכן כולה בשני המרנדרים (DOM ו-PDF) — לכן התקציב מופחת מ**כל**
  // הטורים. בעבר הופחת רק מהטור האחרון ⇒ טור ימני (RTL) חדר עד 44px
  // לתוך אזור ההערות בכל עמוד רווי-הערות, והגנת containment הייתה עיוורת
  // לזה (אותה נוסחה).
  if (fn) cap -= fn;
  // **פרוסה 2 — reservations אחידים (§2.6):** הפחתה חד-פעמית לפי scope.
  const res = page.reservations;
  if (res && res.length) {
    const lastCol = page.columns ? page.columns.length - 1 : 0;
    const ci = opts.colIndex != null ? opts.colIndex : lastCol;
    for (const r of res) {
      if (!r || !(r.px > 0)) continue;
      if (r.scope === 'last-column') { if (ci === lastCol) cap -= r.px; }
      else cap -= r.px; // 'all-columns' (ברירת המחדל)
    }
  }
  return cap;
}

/**
 * **פרוסה 2 (§2.6 — מודל הקיבולת המיוצג):** רשימה תיאורית של כל הגורמים
 * שמקטינים את שטח הגוף בעמוד — לחוזה ה-PagePlan, לאבחון ולבדיקות.
 * טהור: קריאה בלבד; אותם מספרים ש-colCapacityOf מפחית בפועל.
 */
function capacityReservationsOf(page, opts = {}) {
  if (!page || !page.template || !page.template.contentBox) return [];
  const out = [
    { kind: 'content-box', scope: 'all-columns', px: page.template.contentBox.height, detail: 'margins/header/folio excluded by template' },
    { kind: 'spanning-band', scope: 'all-columns', px: (page.spanning && page.spanning.heightPx) || 0, detail: 'cross-column band (FWD-1)' },
    { kind: 'notes-budget', scope: 'all-columns', px: (opts.fnBudget !== false && page.fnReservedHeightPx > 0) ? page.fnReservedHeightPx : 0, detail: 'footnote gutter budget (F-17, R3-C2)' }
  ];
  for (const r of (page.reservations || [])) {
    if (r && r.px > 0) out.push({ kind: r.kind || 'reservation', scope: r.scope || 'all-columns', px: r.px, detail: r.reason || '' });
  }
  return out;
}

/**
 * **שלב 5 (חילוץ שורש מ-PR #16, S78/D-107 — גובה תפוס בזמן תכנון, מקור יחיד):**
 * Σ גבהי שורות + פערי בלוקים (FX-6: `gapBeforePx` — הפער נצבר כאן בפועל,
 * לא רק בשער הכניסה) + יתרת תקציב ההערות של העמוד — נרשם על הטור האחרון (F-17).
 * זו סמנטיקת ה-**תכנון** (לפני AQ — בלי מקדם מתיחה); סמנטיקת ה-**רינדור**
 * (עם aqStretch) חיה ב-balancing.usedHeight. עד כאן היו שני מימושים מקבילים
 * באותו שם בשני מודולים (dp-planner מקומי מול זה) — כעת צרכן יחיד.
 */
function planningUsedHeight(col, page) {
  // **U-8 (19.11, ביקורת שלמות):** מדידת שורות בלבד. תקציב ההערות אינו
  // נכנס לכאן עוד — הוא נכנס לקיבולת (colCapacityOf) עבור **כל** הטורים,
  // כמו המרזב המוקרן שפרוש על רוחב תיבת-התוכן כולה (S6.0/R3-C2). בעבר
  // נוסף רק לטור האחרון ⇒ הטור הימני (RTL) חדר למרזב ההערות
  // (FN_OVERLAPS_BODY; נמדד: no_long ‏2, mid_long ‏27, very_long ‏39 טורים
  // חודרים — כולם לא-אחרונים). הצרכנים שהסתמכו על הכפיל הישן הותאמו
  // באותו תיקון (dp-planner: extraLast הוסר; plan-model: capPx מודע-תקציב).
  void page;
  let h = 0;
  for (const ln of col) h += (ln.heightPx || 0) + (ln.gapBeforePx || 0);
  return h;
}

module.exports = {
  columnWidths, blockGapPx, isFullWidthBlock, colCapacityOf, capacityReservationsOf,
  planningUsedHeight, normalizeColumnGaps, buildPageTemplate
};
