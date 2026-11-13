// src/engine/layout/constraint-matrix.js — מטריצת האילוצים הטיפוגרפיים המאוחדת (S78, D-107)
'use strict';

/**
 * **מקור-אמת יחיד למדיניות שלמות-הפריסה** — האילוצים שהיו עד כאן פזורים
 * בין ארבעה מודולים (dp-planner / candidate-generator / balancing /
 * protections-matrix) מתנסחים כאן פעם אחת, והצרכנים קוראים מכאן בלבד:
 *
 *  1. **חלון פיצול חוקי** — `MIN_LINES_PER_SIDE`: לכל צד של נקודת החיתוך
 *     (שורות שנשארות בעמוד מול שורות שעוברות) דרושות לפחות 2 שורות
 *     (SRS §5.1 — מניעת יתום/אלמנה בגבול התפר). עד כאן הכלל חי בשני
 *     העתקים: `findSplit` (dp-planner: `maxFit < 2 || lines−maxFit < 2`)
 *     ו-`generateCandidates` (candidate-generator: לולאת `cut = 2`).
 *
 *  2. **תפר נקי** — `seamIsClean(seq, k)`: הפרדת גבול-טורים בין שתי שורות
 *     של אותה פסקה חוקית רק אם לפחות 2 שורות מכל צד (ווידוא-תחתית /
 *     ווידוא-ראש). עד כאן חי בתוך `optimalSplit` (balancing) בלבד — כעת
 *     זמין גם למאבחן (protections) ולמועמדי הפיצול.
 *
 *  3. **דגלי ווידוא/יתום** — `widowOrphanPolicy(settings)`: קריאה אחת
 *     של חמשת מפתחות המדיניות (במקום גישות מפוזרות בגוף הבדיקות).
 *
 *  4. **ליווי כותרת** — `escortNeedLines(headingLines, followingLines)`:
 *     כותרת + min(2, שורות-העוקבות) שורות ליווי באותו טור (REQ-BAL-10).
 *     עד כאן נוסחאת הצורך הייתה מוטבעת בלולאת הבלוקים של dp-planner.
 *
 * החוזה: פונקציות טהורות, אפס מצב, אפס תלות — מודול עלים שכל מודולי
 * הפריסה רשאים לדרוש (אין תלות מעגלית).
 */

/** מספר שורות מינימלי לכל צד של חיתוך פסקה (SRS §5.1; איסור יתום/אלמנה בגבול). */
const MIN_LINES_PER_SIDE = 2;

/**
 * חלון הפיצול החוקי של בלוק בן `linesCount` שורות כשמתאימות `maxFit`
 * שורות במקום הפנוי: חיתוך חוקי רק ב-[lo..hi] כאשר lo = 2 (שתי שורות
 * לפחות יישארו) ו-hi = linesCount − 2 (שתיים לפחות יעברו).
 * @returns {{lo:number, hi:number}|null} — null אם אין חלון חוקי כלל
 *   (הבלוק קצר מדי או שהמקום הפנוי קטן מדי ⇒ ההזזה מלאה, לא פיצול).
 */
function legalSplitWindow(linesCount, maxFit) {
  if (maxFit < MIN_LINES_PER_SIDE) return null;
  if (linesCount - maxFit < MIN_LINES_PER_SIDE) return null;
  const lo = MIN_LINES_PER_SIDE;
  const hi = linesCount - MIN_LINES_PER_SIDE;
  return hi >= lo ? { lo, hi } : null;
}

/**
 * תפר נקי בין טורים: הגבול k (col0 = seq[0..k), col1 = seq[k..n)) כאשר
 * הפסקה ממשיכה מעבר לו — חוקי רק אם מכל צד יש לפחות 2 שורות של אותה
 * פסקה (ווידוא-תחתית: השורה שלפני הגבול אינה ראשונת הריצה; ווידוא-ראש:
 * השורה שאחרי הגבול אינה אחרונת הריצה). זהות פסקה לפי ריצות tokenId
 * ב-meta — לא לפי דגלי part (שאינם מעידים על מיקום בבלוק; נלכד בניפוי EXT-8).
 * @param {Array} seq - רצף הקריאה המלא של העמוד ([...col0, ...col1])
 * @param {number} k - נקודת הגבול הנבדקת
 * @returns {boolean}
 */
function seamIsClean(seq, k) {
  const n = seq.length;
  if (k > 0 && k < n) {
    const lt = seq[k - 1].meta && seq[k - 1].meta.tokenId;
    const rt = seq[k].meta && seq[k].meta.tokenId;
    if (lt != null && lt === rt) { // הבלוק ממשיך מעבר לגבול
      if (k - 2 < 0 || (seq[k - 2].meta && seq[k - 2].meta.tokenId) !== lt) return false; // widow-bottom
      if (k + 1 >= n || (seq[k + 1].meta && seq[k + 1].meta.tokenId) !== rt) return false; // widow-top
    }
  }
  return true;
}

/**
 * דגלי מדיניות ווידוא/יתום — קריאה מרוכזת אחת (מקור: settings-registry).
 * @returns {{preventWidowsTop:boolean, preventWidowsBottom:boolean,
 *            preventOrphansTop:boolean, preventOrphansBottom:boolean,
 *            strictness:string}}
 */
function widowOrphanPolicy(settings) {
  return {
    preventWidowsTop: settings['prevent-widows-top'] === true,
    preventWidowsBottom: settings['prevent-widows-bottom'] === true,
    preventOrphansTop: settings['prevent-orphans-top'] === true,
    preventOrphansBottom: settings['prevent-orphans-bottom'] === true,
    strictness: settings['widow-strictness'] || 'standard'
  };
}

/**
 * מספר השורות שחייבות להיכנס יחד עם כותרת לטור (REQ-BAL-10):
 * הכותרת + עד 2 שורות ליווי (או כמה שיש אם העוקב קצר).
 * @param {number} headingLines - שורות הכותרת עצמה (בדרך כלל 1)
 * @param {number} followingLines - שורות הבלוק העוקב (0 אם אין)
 */
function escortNeedLines(headingLines, followingLines) {
  return headingLines + Math.min(MIN_LINES_PER_SIDE, Math.max(0, followingLines));
}

module.exports = { MIN_LINES_PER_SIDE, legalSplitWindow, seamIsClean, widowOrphanPolicy, escortNeedLines };
