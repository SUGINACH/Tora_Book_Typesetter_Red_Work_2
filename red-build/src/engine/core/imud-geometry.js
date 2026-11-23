// src/engine/core/imud-geometry.js — חוזה גאומטריית IMUD המכוילת (מקור אמת יחיד)
'use strict';

/**
 * **שלב ההעברה למנוע המאוחד — מקטע 1 (גאומטריית עמוד וטורים).**
 *
 * עד כאן חיו הקבועים הללו רק בתוך `layout/legacy-imud-flow.js` — והמנוע
 * המאוחד בנה גריד גנרי מאחוזים (grid-col-width-pct וכו') שאין לו מיפוי
 * מפתחות IMUD. התוצאה הנמדדת: חור מרכזי של 134.9px בין הטורים מול מרזב
 * 13.48px במקור (דוח חקירת האתר החי, 19.11, ג.10).
 *
 * כעת הגאומטריה המכוילת מהייחוס היא **מודול חוזה משותף** — בדיוק כמו
 * `core/h3-contract.js` שכבר משותף לשני המנועים. שני הצרכנים:
 *   1. `layout/legacy-imud-flow.js` — מייבא את אותם הערכים (אפס שינוי
 *      התנהגות; מוכח ב-digest זהה של הקורפוסים).
 *   2. `layout/page-templates.js` — כשפרופיל IMUD פעיל (הגדרות שמקורן
 *      ב-default_settings.json של המקור), תבנית העמוד נבנית מהחוזה
 *      הזה ולא מהאחוזים הגנריים.
 *
 * החוזה המלא (מיקומים, גדלים, פורמטים): audits/ENGINE_CONTRACT_9C3.md.
 * יחידות: px @96dpi; PDF = px×0.75.
 */

// ---------- גיאומטריית עמוד (מכויל מהייחוס המסומן) ----------
const GEO = {
  PAGE_W: 793.7, PAGE_H: 1122.5,               // A4
  COL_W: 269.41,                                // רוחב טור (col:right 269 בתגיות המקור)
  COL_R_X: 403.61, COL_L_X: 120.72,             // שפות טורים (ימני/שמאלי)
  MARGIN_R_X: 686.3, MARGIN_L_X: 56.7, MARGIN_W: 50.5, // טורי שוליים (margin-col)
  FLOW_TOP: 107.2,                              // ראשית זרימת הגוף בעמוד רגיל
  FLOW_H: 915,
  LINE_H: 21.44,
  H2_SPACER: 180,                               // h2-spacer לפני סימן+כותרת
  HEADER_BASELINE: 71.9,                        // פס כותרת: גליפים 42.56–57.56pt
  FOLIO_BASELINE: 1054.5,                       // עמודון: y0=783.82pt (גליף ~1045px), ממורכז
  FN_AREA_TOP: 969.5,                           // תחילת מרזב ההערות (y0=727.1pt בייחוס)
  FN_PITCH: 16.7,                               // פס שורות הערה (8.5pt × 1.5 × 4/3)
  TOC_NUM_X: 66.1,                              // מספרי תוכן-עניינים בשמאל (x0≈49.6pt)
  TOC_TITLE_X1: 727.4,                          // שפה ימנית של כותרות תוכן-עניינים (545.6pt)
  TOC_STAIR: 8,                                 // מדרגת כניסה לפי רמה (padding-right 8px)
  MN_PITCH: 9.6                                  // פס שורות הערת-צד (8px × 1.2)
};

// ---------- קבועים אנכיים נגזרים ----------
const FLOW_BOTTOM = GEO.FLOW_TOP + GEO.FLOW_H; // 1022.2px — תחתית הזרימה האמיתית
const H2_AREA_H = 284.25;   // אזור h2: מרווח-עליון 22% + סימן + כותרת + שוליים (S4.19)
// **G3/RC-3 (i004 — S4.19 הכיול הכפול של המורשת, מקור יחיד לשני המנועים החיים):**
// עמוד פתיחת-סימן שהמקטע שלו נפתח בכותרת-רוחבית (h3-span — HEADING_MODES[3]=
// span_1col) משתמש באזור מוקצק ובעוגנים מורמים: נמדדו מהייחוס (עמ' 11 מול
// 24/38). כל הקבועים ב-px מקור.
const H2_SPAN_AREA_H = 261.3; // אזור h2 בפתיחה עם span — הטורים מתחילים ב-368.5px
const H2_SIMAN_Y = 307.88;    // עוגן פס הסימן (פתיחה רגילה)
const H2_SIMAN_Y_SPAN = 284.9; // עוגן פס הסימן (פתיחה עם span — מורם ב-22.98px)
const H2_TITLE_Y = 344.05;    // עוגן כותרת ה-h2 (פתיחה רגילה)
const H2_TITLE_Y_SPAN = 321.1; // עוגן כותרת ה-h2 (פתיחה עם span)
// **Iteration-006 (G3/RC-C1 — מסלול שורות כותרת-h2 עטופות):** כל שורה עטופה
// של כותרת ה-h2 מעבר לראשונה דוחפת את ראש הזרימה בפס שלה — הרווח התחתון
// המוגדר של האזור נשמר (מורשת flowSection: top = FLOW_TOP + areaH +
// (h2Lines−1)×30; פסי הכותרת y = עוגן + li×30, h=30). נמדד בייחוס p278
// «בגדר פסול דלמעלה מעשרים אמה / בנר חנוכה»: ה-H3 שאחרי כותרת דו-שורתית
// ב-315.8pt = 421.45px = FLOW_TOP+284.25+30 במדויק — בלי הדחיפה ה-H3 עולה
// ל-391.45px (נמדד במאוחד לפני התיקון) ונוגע בשורת-הכותרת השנייה
// (374.05–404.05px). מקור יחיד לשני המנועים.
const H2_TITLE_LINE_PITCH_PX = 30;
const H0_AREA_H = 249.2;    // זרימת ההקדמה מתחילה ב-356.4px (S4.19)
const SINGLE_W = 552.3;     // .single-wide-col = 2×269.41+13.48 (grid)
const TITLE_W_PCT = 0.6;    // תיבת כותרת 2/3 — 60% מרוחב הפס (S74)
const H23_TITLE_W = SINGLE_W * TITLE_W_PCT; // 331.38px
const H0_LINE_H = 20.55;    // פס שורת ההקדמה (11.5pt×1.34×4/3 — S4.13)
const H0_TITLE_Y = 309.0;   // מיקום כותרת ההקדמה (S4.24)
const TOC_TITLE_BLOCK_H = 213;
// גיאומטריית עמודי תוכן-העניינים — אבסולוטית ונפרדת מזרימת הגוף (S4.14)
const TOC_FIRST_TOP = 370.7;
const TOC_CONT_TOP = 113.7;
const TOC_STRETCH_BOTTOM = 1005.7;

// ---------- מתיחת סוף-עמוד + משיכת זנב-יתום (העתק נאמן מ-v21-glm, S4.17) ----------
const PAGE_STRETCH_MAX = 48;      // v21: תקרת מתיחת הבלוק האחרון בעמוד (px)
const JUSTIFY_MAX_GAP = 9;        // v21: תקרת ריווח (padding) שמתווסף אחרי פסקה
const JUSTIFY_MAX_LH_EXTRA = 3;   // v21: תקרת תוספת גובה-שורה במתיחת עמוד (px)
const ORPHAN_RECLAIM_BUFFER = 12; // v21: באפר "חירום" בתחתית העמוד למשיכת יתום
const RECLAIM_BELOW_BASE = 2;     // v21: היתר כיווץ מתחת לבסיס לשורה (px)

// ---------- גדלי גופן (pt — כמו הגדרות המקור; פיקסלים = pt×4/3) ----------
// ליבה סטטית בלבד: legacy-imud-flow מוטט חלק מהשדות מההגדרות (S6.3) —
// המוטציה נשארת שם; המנוע המאוחד קורא את ערכי ברירת המחדל מכאן.
const SZ_CORE = {
  body: 12, h0Title: 17, h0Body: 11.5, h2: 17, siman: 20, h3: 13.5,
  h4: 12.5, h5: 11.5, h6: 10.5, parenDelta: -2,
  fnBody: 8.5, fnMarker: 8, marginNote: 6, folio: 10.5,
  hdrR: 15, hdrC: 11, hdrL: 15, divider: 6.75,
  tocNum: 10.5, tocTitle: 17,
  tocLevel: { 1: 12, 2: 11, 3: 10.5, 4: 10, 5: 9.5, 6: 9, 7: 8.8 }
};

module.exports = {
  GEO,
  FLOW_BOTTOM, H2_AREA_H, H0_AREA_H, SINGLE_W, TITLE_W_PCT, H23_TITLE_W,
  H2_SPAN_AREA_H, H2_SIMAN_Y, H2_SIMAN_Y_SPAN, H2_TITLE_Y, H2_TITLE_Y_SPAN,
  H2_TITLE_LINE_PITCH_PX,
  H0_LINE_H, H0_TITLE_Y,
  TOC_TITLE_BLOCK_H, TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM,
  PAGE_STRETCH_MAX, JUSTIFY_MAX_GAP, JUSTIFY_MAX_LH_EXTRA, ORPHAN_RECLAIM_BUFFER, RECLAIM_BELOW_BASE,
  SZ_CORE
};
