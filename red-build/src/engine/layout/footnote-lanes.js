// src/engine/layout/footnote-lanes.js — מקור-אמת יחיד לחלוקת נתיבי מרזב ההערות (S78, D-107)
'use strict';

/**
 * **חלוקת LPT דטרמיניסטית — מימוש אחד, שלושה צרכנים.**
 *
 * עד כאן היו שלושה העתקים מקבילים של אותו אלגוריתם:
 *  1. `footnote-budget.getFootnotesReservedHeight` — התקציב בזמן ההצבה
 *     (סכום גבהים ממוין ⇐ מקסימום שני הנתיבים);
 *  2. `geometry-projector.projectFootnoteGutter` — הקרנת ה-PDF;
 *  3. `dom-renderer.renderFootnoteArea` — התצוגה החיה.
 *
 * מחלקת הכשל (ההיסטוריה של S70/S71.1): כל העתק שאינו מתוחזק בדיוק כמו
 * חבריו מייצרת מצב "תקציב ≠ תצוגה ≠ ייצוא" — ההערה מתוקצבת בנתיב אחד
 * ומוצגת בנתיב אחר. כעת: הצרכנים קוראים `assignFootnoteLanes` בלבד.
 *
 * האלגוריתם (זהה מתמטית לשלושת המימושים הקודמים — נעול בבדיקת שקילות):
 *  - סדר עיבוד: לפי גובה יורד; שווי-גובה לפי אינדקס עולה (סדר מסמך).
 *  - הצבה חמדנית: כל הערה נכנסת לנתיב שסכומו המצטבר הנמוך; תיקו ⇒ נתיב 0
 *    (הנתיב הימני ב-RTL — "הראשון").
 *  - הסדר הפנימי בכל נתיב נשמר (סדר מסמך).
 *
 * @param {Array} notes - רשימת הערות (כל אובייקט; הגובה נקרא דרך heightOf)
 * @param {(n:object, i:number)=>number} [heightOf] - גובה אפקטיבי;
 *   ברירת מחדל (n) => n.heightPx || 0 (כמו המקרנים). התקציב מעביר נפילה
 *   ל-noteHeight — שקילות המימושים נשמרת כי בעמודי DP כל הערה חתומה
 *   ב-heightPx (ראה תיקון הניקוז בסוף המסמך ב-dp-planner, D-107).
 * @returns {{lanes:[number[], number[]], totals:[number, number]}}
 *   lanes[i] = אינדקסים ברשימת הקלט (בסדר מסמך) שהוקצו לנתיב i.
 */
function assignFootnoteLanes(notes, heightOf) {
  const h = typeof heightOf === 'function' ? heightOf : (n) => (n && n.heightPx) || 0;
  const n = (notes || []).length;
  const lanes = [[], []];
  const totals = [0, 0];
  if (!n) return { lanes, totals };
  const order = notes.map((note, i) => ({ i, h: h(note, i) }))
    .sort((a, b) => (b.h - a.h) || (a.i - b.i));
  for (const s of order) {
    const li = totals[0] <= totals[1] ? 0 : 1;
    lanes[li].push(s.i);
    totals[li] += s.h;
  }
  return { lanes, totals };
}

module.exports = { assignFootnoteLanes };
