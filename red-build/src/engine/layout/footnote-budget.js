// src/engine/layout/footnote-budget.js — Footnote reservation (REQ-FN-01/02/07)
'use strict';

const { assignFootnoteLanes } = require('./footnote-lanes'); // **S78 (D-107):** מקור-אמת יחיד לחלוקת נתיבי המרזב

/**
 * **מקור־הסמכות היחיד לתקציב המרזב** (תיקון P1-1): הן probe הן reservation
 * עוברים כאן — getFootnotesReservedHeight — וה‑dp-planner קורא לזה בלבד
 * (בעבר היו שני מימושים מקבילים: כאן ו‑recomputeFnBudget מקומי, והבדיקה
 * probe==reserved רצה על מודול שהמנוע לא השתמש בו).
 * כולל הערות של הפסקה הנמדדת כעת (לקח V2/V4).
 * מדיניות הערה ארוכה (split/move-whole/reject-to-body) מיושמת ב‑dp-planner
 * **בזמן ההצבה** — המודול הזה אינו מחזיק עוד מימוש תאום מת (באג S6).
 */

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font). */
const NOTE_FONT_FACTORS = { 'David HB': 1.06, 'David': 1.04, 'Narkisim': 1.10, 'Nachlieli': 0.96, 'Alef': 1.02, 'Rubin': 1.05 };

/** **S78 (D-107 — מדדי ההערה, מקור יחיד):** גודל גוף-ההערה (0.8× הגוף —
 * כמו .footnotes{font-size:.8em} ב-DOM) ופיץ' השורה שלו (1.25 — כמו המרזב
 * בשני הרנדרים). עד כאן הנוסחה שוכפלה בשלושה אתרים (כאן, פיצול
 * ההערה-הארוכה ב-dp-planner, הקרנת המרזב ב-geometry-projector) — כל
 * נגזרת שהתרחקה מחברותיה הזיזה את התקציב מול ההקרנה. */
function noteMetrics(settings) {
  const sizePt = settings['body-font-size-pt'] * 0.8;
  const lineHeightPx = Math.round(sizePt * (96 / 72) * 1.25);
  return { sizePt, lineHeightPx };
}

function noteHeight(note, settings, measure) {
  const { sizePt, lineHeightPx: lh } = noteMetrics(settings); // **S78:** מקור יחיד לגודל/פיץ'
  const words = String(note.text).replace(/\uE000/g, ' ').split(/\s+/).filter(Boolean);
  const colW = laneWidth(settings);
  // **S70 (R7-M4):** הפקטור מתקן את טבלת impl A בלבד; ב-impl B
  // (font-metrics) המטריקות מדויקות והכפלה הייתה מנפיחת את תקציב ההערות.
  const factor = (measure && measure.impl === 'font-metrics')
    ? 1 : (NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1);
  // **S6.0 (R3-C3 — אומדן ללא רווחים):** ההקרנה (wrapNoteTokens) שוברת
  // את ההערה **עם** רוחבי רווח בין מילים — האומדן כאן סכם מילים בלבד
  // ⇒ כל הערה הגובלת בשבירת-שורה נמדדה שורה אחת פחות (19–21px) וההערה
  // שאחריה חפפה אותה (32% מ-230 הערות בדגימה). נכללים גם הסמן ורווח
  // ההמשך בשורה הראשונה — כמו שמצויר בפועל.
  const spaceW = measure(' ', sizePt) * factor;
  const mkTxt = note && note.marker != null ? String(note.marker) : '';
  const mkW = mkTxt ? measure(mkTxt, sizePt) * factor + spaceW : 0;
  let lines = 1, w = Math.min(mkW, colW);
  for (const word of words) {
    const ww = measure(word, sizePt) * factor;
    const addW = (w > 0 ? spaceW : 0) + ww;
    if (w + addW > colW && w > 0) { lines++; w = ww; } else w += addW;
  }
  return lines * lh;
}

/**
 * רוחב נתיב אחד במרזב לפי footnote-columns.
 * **S5.2 (P-4):** _fnColWidthPx מכוין כעת ב-pipeline מהגיאומטריה —
 * 1 ⇒ רוחב תיבת התוכן המלא (674.90px בברירת המחדל; כמו שמוקרן בגיאומטריה:
 * x=colLeftOf, w=colWidthOf); 2 ⇒ (רוחב מלא − מרזב התבנית)/2. הפונקציה
 * נשארת פשוטה — ההכוונה נעשתה במקור היחיד (pipeline) ולא כאן.
 */
function laneWidth(settings) {
  const base = settings._fnColWidthPx || 200;
  return settings['footnote-columns'] === 2 ? base : base;
  // _fnColWidthPx כבר מכוין לפי המספר טורים במרזב (הpipeline מזרים) — נשמר כאן כפשוטו.
}

/**
 * getFootnotesReservedHeight — הזהה ל‑probe (BRZ: no divergence):
 * @param {Array} pageNotes - [{text, marker}]
 */
function getFootnotesReservedHeight(pageNotes, settings, measure) {
  if (!settings['footnotes-enabled']) return 0;
  if (!pageNotes || !pageNotes.length) return 0;
  const cols = settings['footnote-columns'];
  const heights = pageNotes.map(n => n.heightPx != null ? n.heightPx : noteHeight(n, settings, measure));
  if (cols === 1) return heights.reduce((a, b) => a + b, 0);
  // 2 טורים: חלוקה שווה־גובה (greedy LPT דטרמיניסטית)
  // **S78 (D-107):** חלוקת הנתיבים — מקור יחיד (footnote-lanes). שקול מתמטית למימוש
  // הקודם (סדר גובה-יורד/אינדקס-עולה, חמדני לנמוך) — נעול בבדיקת שקילות; מעתה
  // תקציב/הקרנה/תצוגה משתפים את אותה חלוקה ממקור אחד.
  const { totals } = assignFootnoteLanes(pageNotes, (n, i) => heights[i]);
  return Math.max(totals[0], totals[1]);
}

module.exports = { getFootnotesReservedHeight, noteHeight, noteMetrics, laneWidth, NOTE_FONT_FACTORS };
