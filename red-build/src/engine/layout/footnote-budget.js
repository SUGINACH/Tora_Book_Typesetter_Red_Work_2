// src/engine/layout/footnote-budget.js — Footnote reservation (REQ-FN-01/02/07)
'use strict';

const { assignFootnoteLanes } = require('./footnote-lanes'); // **שלב 5 (חילוץ שורש מ-PR #16):** מקור-אמת יחיד לחלוקת נתיבי המרזב
const NM = require('./notes-model'); // **שלב 6 פרוסה 2:** ליבת השבירה/החותמת האחידה + SSOT פקטורי הגופן

/**
 * **מקור־הסמכות היחיד לתקציב המרזב** (תיקון P1-1): הן probe הן reservation
 * עוברים כאן — getFootnotesReservedHeight — וה‑dp-planner קורא לזה בלבד
 * (בעבר היו שני מימושים מקבילים: כאן ו‑recomputeFnBudget מקומי, והבדיקה
 * probe==reserved רצה על מודול שהמנוע לא השתמש בו).
 * כולל הערות של הפסקה הנמדדת כעת (לקח V2/V4).
 * מדיניות הערה ארוכה (split/move-whole/reject-to-body) מיושמת ב‑dp-planner
 * **בזמן ההצבה** — המודול הזה אינו מחזיק עוד מימוש תאום מת (באג S6).
 */

/** פרופילי רוחב גופן לגוף ההערה (f-note-body-font) — **SSOT ב-notes-model (פרוסה 2)**; מיוצא הלאה לצרכנים הקיימים. */
const NOTE_FONT_FACTORS = NM.NOTE_FONT_FACTORS;

/** **שלב 5 (חילוץ שורש מ-PR #16 — מדדי ההערה, מקור יחיד):** גודל גוף-ההערה
 * (0.8× הגוף — כמו .footnotes{font-size:.8em} ב-DOM) ופיץ' השורה שלו (1.25 —
 * כמו המרזב בשני הרנדרים). עד כאן הנוסחה שוכפלה בשלושה אתרים (כאן, פיצול
 * ההערה-הארוכה ב-dp-planner, הקרנת המרזב ב-geometry-projector) — כל
 * נגזרת שהתרחקה מחברותיה הזיזה את התקציב מול ההקרנה. */
function noteMetrics(settings) {
  const sizePt = settings['body-font-size-pt'] * 0.8;
  const lineHeightPx = Math.round(sizePt * (96 / 72) * 1.25);
  return { sizePt, lineHeightPx };
}

function noteHeight(note, settings, measure) {
  // **פרוסה 2 (מדידה אחת — §2.3 בביקורת):** צריכת החותמת קודמת לחישוב —
  // הערה שנמדדה פעם אחת (ביצירתה, CP2) אינה נמדדת שוב לאף החלטת הצבה.
  if (note && note.heightPx != null) return note.heightPx;
  return noteRowsOf(note, settings, measure).heightPx;
}

/**
 * **פרוסה 2 — שבירת שורות ההערה + מדדיה (מקור יחיד, חד-פעמי):**
 * אותו אלגוריתם גרידי ברוחב הנתיב (כמו שהיה ב-noteHeight) — אך מוחזר
 * כמבנה שורות מלא: `{ rows, heightPx, linesCount, lineH, words }`, כאשר כל
 * שורה היא `{ wFrom, wTo, widthPx }` (טווח מילים + רוחב). השורות כוללות את
 * הסמן ורווח ההמשך בשורה הראשונה — כמו שמצויר בפועל (R3-C3).
 * הצרכנים: התקציב (noteHeight), הפיצול של הערה ארוכה (dp-planner —
 * חיתוך בגבול שורה מוחלט, בלי מדידת מילים מחדש) והקרנת המרזב (עתיד
 * שלב 6/7 — אותן שורות בדיוק). ההטבעה עצמה — stampNoteMetrics להלן.
 */
// **פרוסה 2 (טוהר מדידה — חשבונאות בדיקה, דפוס api.cacheStats):** מונה פנימי
// להפעלות שבירת השורות של ההערה. הבדיקות מוכיחות באמצעותו שכל הערה נמדדת
// בדיוק פעם אחת (החותמת) — ושההמשכים מטיצול הם הטקסטים החדשים היחידים.
const _rowsStats = { calls: [] };
function __resetRowsStats() { _rowsStats.calls.length = 0; }
function __rowsStats() {
  const perKey = Object.create(null);
  for (const k of _rowsStats.calls) perKey[k] = (perKey[k] || 0) + 1;
  return { total: _rowsStats.calls.length, keys: _rowsStats.calls.slice(), perKey };
}

function noteRowsOf(note, settings, measure) {
  if (note && note.text != null) {
    _rowsStats.calls.push(`${note.tokenId || ''}#${note.noteIndex != null ? note.noteIndex : ''}#${String(note.text).slice(0, 24)}`);
  }
  // **שלב 6 פרוסה 2:** השבירה עצמה עברה לליבה היחידה (notes-model.wrapNoteWords)
  // — אותה אריתמטיקה בדיוק; כאן נשארת התצפית הלא-משנה (legacy view, בלי מוטציה).
  const probe = { text: note.text, marker: note.marker, isContinuation: note.isContinuation, mode: note.mode };
  NM.stampNote(probe, settings, measure, NM.NOTE_KINDS.FOOTNOTE);
  return {
    rows: probe.noteRows, heightPx: probe.heightPx, linesCount: probe.linesCount,
    lineH: probe.lineH, words: probe.noteWords, markerW: probe.markerW, spaceW: probe.spaceW
  };
}

/**
 * **פרוסה 2 (§2.3 — מדידה אחת לכל פריט):** הטבעת מדדי ההערה על אובייקט
 * ההערה עצמו, ברגע יצירתה (CP2 ב-pipeline). מרגע זה כל הצרכנים — תקציב,
 * הצבה, פיצול, ניקוז זנב — קוראים את החותמת ואינם מודדים שוב. הערה שנוצרה
 * בפיצול (המשך) היא טקסט חדש — מוטבעת אף היא פעם אחת בלבד.
 * @param {object} note - { text, marker, ... } — מוטציה באתר (המקור בידי ה-pipeline)
 * @returns {object} ה-note עצמו (שרשרת)
 */
function stampNoteMetrics(note, settings, measure) {
  if (note && note.text != null) {
    _rowsStats.calls.push(`${note.tokenId || ''}#${note.noteIndex != null ? note.noteIndex : ''}#${String(note.text).slice(0, 24)}`);
  }
  // **שלב 6 פרוסה 2:** ההטבעה עוברת דרך ה-SSOT של מודל ההערות (notes-model)
  // — אותן שורות/מדדים בדיוק, ובנוסף: רוחב סימון-ההמשך בתקציב שורה 0 (§9 —
  // בעבר ההמשכים נמדדו בלי '(המשך)' בזמן שהרנדרים ציירו אותו ⇒ תקציב<הקרנה),
  // markerGlyphW להקרנה, ו-stampCtx לזיהוי הקשר המדידה. מי שכבר חתום בהקשר
  // המרזב אינה נמדד שוב.
  NM.stampNote(note, settings, measure, NM.NOTE_KINDS.FOOTNOTE);
  return note;
}

function laneWidth(settings) {
  const base = settings._fnColWidthPx || 200;
  return settings['footnote-columns'] === 2 ? base : base;
  // _fnColWidthPx כבר מכוין לפי המספר טורים במרזב (הpipeline מזרים) — נשמר כאן כפשוטו.
}

/**
 * **S75 (בקשה 1 — 12.11) · פורט המנוע המאוחד (29.11): מדדי תקרת body-first —
 * מקור יחיד.** מקביל ל-FN_BODY_FIRST_CAP_PX/FN_FULL_CAP_PX של המנוע הישן
 * (legacy-imud-flow, 2ae45b9^), מותאם לחוזה הקיבולת המאוחד (usableH = תיבת
 * התוכן בהפחתת פס חוצה-טורים; אין קבוע מפריד 38.5 — המרזב המאוחד אינו
 * שומר גובה למפריד, החוט מצויר בראש המרזב עצמו).
 * - fullCapPx: קיבולת פיזית מלאה של המרזב — תמיד נותרת שורת-גוף אחת לפחות
 *   (legacy: FN_FULL_CAP_PX = ⌊(FLOW_H − 38.5 − שורת-גוף)/PITCH⌋·PITCH).
 * - relCapPx: התקרה היחסית בזמן המילוי — ערך מפורש של fn-bar-max-height-px
 *   (אם חיובי, חתוך ל-fullCap), ואחרת **50% מגובה הזרימה** בכפולות שורת-הערה
 *   (החלטת S75: "המרזב נכנס בחלל שמתחת לגוף עד תקרה יחסית — 50%").
 */
function bodyFirstCaps(settings, usableHeightPx, bodyLinePx) {
  const lineH = noteMetrics(settings).lineHeightPx;
  const fullCapPx = Math.max(lineH, Math.floor((usableHeightPx - bodyLinePx) / lineH) * lineH);
  const explicit = Number(settings['fn-bar-max-height-px']);
  const relCapPx = (Number.isFinite(explicit) && explicit > 0)
    ? Math.min(explicit, fullCapPx)
    : Math.min(fullCapPx, Math.max(lineH, Math.floor((usableHeightPx * 0.5) / lineH) * lineH));
  return { lineH, fullCapPx, relCapPx };
}

/**
 * **S75 — רצפת ההתחלות:** גובה המרזב עד שורת הפתיחה של ההערה הטרייה האחרונה
 * בתור (סכום הגבהים שלפניה + שורת-הערה אחת). עדיפות 2 של המשתמש: "כל הערה
 * טרייה מתחילה בעמוד שבו הסמן שלה הוצב". הרצפה חתוכה בהמשך לקיבולת ולצורך
 * (legacy: fnBodyFirstLines → starts, במודל הבלוקים המאוחד — סכום מונוטוני
 * על סדר התור; שמרני גם במרזב דו-טורי: שמורה במודל חד-טורי).
 */
function bodyFirstStartsFloorPx(pageNotes, settings, measure) {
  if (!pageNotes || !pageNotes.length) return 0;
  const lineH = noteMetrics(settings).lineHeightPx;
  let lastFresh = -1;
  for (let i = 0; i < pageNotes.length; i++) {
    const n = pageNotes[i];
    const isCont = n && (n.isContinuation === true || n.mode === 'split-rest' || n.continuationOf != null);
    if (!isCont) lastFresh = i;
  }
  if (lastFresh < 0) return 0;
  let before = 0;
  for (let i = 0; i < lastFresh; i++) {
    before += pageNotes[i] && pageNotes[i].heightPx != null ? pageNotes[i].heightPx : noteHeight(pageNotes[i], settings, measure);
  }
  return before + lineH;
}

/**
 * **S75 — תקציב המילוי של body-first (מקור יחיד; מקביל ל-fnReserveFor+applyFnReserve
 * של המנוע הישן):** מה שהמרזב תובע בזמן מילוי הגוף —
 *   soft = max(min(need, relCap), min(startsFloor, fullCap, need))
 *   budget = min(soft, clamp), clamp = max(lineH, usableH − maxUsed − bodyLine)
 * ה-clamp מבטיח שהגוף **לעולם אינו נדחק** לעמוד הבא בגלל גודל ההערות: התקציב
 * אינו חורג מהחלל שמתחת לגוף שכבר הונח, פחות שורת-גוף אחת. התקציב דינמי —
 * הוא מחושב מחדש מול ה-used הנוכחי בכל שאילתת קיבולת (dp-planner).
 */
function bodyFirstBudgetPx(pageNotes, settings, measure, usableHeightPx, bodyLinePx, maxUsedPx, clampPxOverride) {
  if (!pageNotes || !pageNotes.length) return 0;
  const caps = bodyFirstCaps(settings, usableHeightPx, bodyLinePx);
  const needPx = getFootnotesReservedHeight(pageNotes, settings, measure);
  const startsPx = Math.min(bodyFirstStartsFloorPx(pageNotes, settings, measure), caps.fullCapPx, needPx);
  const soft = Math.max(Math.min(needPx, caps.relCapPx), startsPx);
  // **clamp — קפוא בזמן ההתחייבות (כמו applyFnReserve של המנוע הישן):** התקציב
  // תובע את החלל שמתחת לגוף ברגע שסמני ההערות הוצבו — ואינו מצטמק ככל שהגוף
  // ממשיך למלא; כך רצפת ההתחלות שרדה את המילוי. clampPxOverride — הערך הקפוא
  // מהעמוד (dp-planner); בלעדיו — clamp חי (בזמן ההתחייבות עצמה).
  const clampPx = clampPxOverride != null && Number.isFinite(clampPxOverride)
    ? clampPxOverride
    : Math.max(caps.lineH, usableHeightPx - Math.max(0, maxUsedPx) - bodyLinePx);
  return Math.max(0, Math.min(soft, clampPx));
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
  // 2 טורים: חלוקה שווה־גובה — **שלב 5 (חילוץ שורש מ-PR #16):** מקור יחיד
  // (footnote-lanes). שקול מתמטית למימוש הקודם (סדר גובה-יורד/אינדקס-עולה,
  // חמדני לנמוך) — נעול בבדיקת שקילות; מעתה תקציב/הקרנה/תצוגה משתפים את
  // אותה חלוקה ממקור אחד.
  const { totals } = assignFootnoteLanes(pageNotes, (n, i) => heights[i]);
  return Math.max(totals[0], totals[1]);
}

module.exports = { getFootnotesReservedHeight, noteHeight, noteRowsOf, stampNoteMetrics, noteMetrics, laneWidth, NOTE_FONT_FACTORS, bodyFirstCaps, bodyFirstStartsFloorPx, bodyFirstBudgetPx, __resetRowsStats, __rowsStats };
