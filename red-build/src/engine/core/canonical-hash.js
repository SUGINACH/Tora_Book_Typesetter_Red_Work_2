// src/engine/core/canonical-hash.js — האש קנוני אינקרמנטלי (תיקון "Invalid string length")
'use strict';

/**
 * **שורש התקלה "engine: Invalid string length" במסמכים גדולים:**
 * כל פונקציות ה-hash הקנוניות (contentHash, layoutHash, bodyGeometryHash,
 * geometryHashOf, contentHashOf) מירטיאלזו את הצורה הקנונית של המסמך כולו
 * למחרוזת JSON אחת באמצעות JSON.stringify(array) — ואז הזינו אותה ל-sha256.
 * V8 מגביל אורך מחרוזת ל-2^29-24 תווים (~512MB): מסמך גדול חוצה את הגבול
 * והעימוד כולו קורס ב-RangeError אחרי דקות של עבודת פריסה.
 *
 * הפתרון: אותם בתים בדיוק — בלי מחרוזת ענקית. JSON.stringify של מערך הוא
 * '[' + JSON.stringify(e1) + ',' + JSON.stringify(e2) + ... + ']' — ולכן הזנה
 * איבר-איבר ל-createHash מניבה זהות בתים מלאה עם הייצוג הישן, בזיכרון O(איבר)
 * במקום O(מסמך). כל הנעילות (baseline hashes, locks) נשמרות ללא שינוי ערך.
 *
 * @param {Iterable<*>} elems — האיברים הקנוניים (מומלץ generator: בלי לבנות
 *   מערך ביניים). איבר חייב להיות ניתן ל-JSON (אובייקט/מערך/פרימיטיב).
 *   undefined → null, בדיוק כמו JSON.stringify בתוך מערך.
 * @returns {string} hex sha256 — זהה לחלוטין ל-sha256(JSON.stringify([...elems]))
 */
const crypto = require('crypto');

function sha256OfJsonArrayElements(elems) {
  const h = crypto.createHash('sha256');
  h.update('[', 'utf8');
  let first = true;
  for (const elem of elems) {
    if (!first) h.update(',', 'utf8');
    // זהות בתים עם JSON.stringify(array): undefined/function בתוך מערך
    // מוצגים כ-null. בפועל הקנונים כאן איבריהם תמיד אובייקטים/מערכים — אך
    // השמירה על הכלל הופכת את העזר לנאמנה גם לשימוש עתידי.
    h.update(elem === undefined || typeof elem === 'function' ? 'null' : JSON.stringify(elem), 'utf8');
    first = false;
  }
  h.update(']', 'utf8');
  return h.digest('hex');
}

module.exports = { sha256OfJsonArrayElements };
