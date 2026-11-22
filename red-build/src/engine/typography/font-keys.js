// src/engine/typography/font-keys.js — מפתח משפחת גופן רשומה ⇒ תת-גופן ייצוא (S73)
'use strict';

/**
 * **מקור יחיד למיפוי משפחה→מפתח גופן** (הוצא מכפילות: עד כאן היו שני עותקים
 * זהים — core/materialize.js ו-layout/structural-stamps.js — ועותק שלישי
 * במקרן המורשת שייסגר בשלב 9). המיפוי טהור: בדיקת רישום בלבד (registeredFonts),
 * בלי מדידה ובלי תלות ברנדרר.
 *
 * משפחה רשומה ⇒ המשפחה עצמה כמפתח (תת-גופן ייעודי בייצוא); אחרת null
 * (=גוף הטקסט /F1). התפקידים הפונקציונליים (window/fnbody/margin/heading)
 * ממופים לשמות הקצרים של תתי-הגופנים ב-pdf-writer.
 */

const { registeredFonts } = require('./measure-api');

/** @param {string} fam — שם משפחה מההגדרות (heading-N-font וכו'); ריק ⇒ null */
function familyFontKeyOf(fam) {
  if (!fam || !registeredFonts.has(fam)) return null;
  if (fam === 'Frank Ruhl Libre') return 'fnbody';
  if (fam === 'Hadassah Friedlaender') return 'margin';
  if (fam === 'FrankReal-Bold' || fam === 'FrankReal') return 'window';
  if (fam === 'David Libre' || fam === 'DavidLibre-Bold') return 'heading';
  return fam;
}

/** **Iteration-003 (parity משקל בשערים):** בקשת משפחה מילולית — המשפחה הרשומה
 * עצמה היא המפתח, בלי המנהרות התפקידיות. למשל 'David Libre' ⇒ תת-הגופן
 * הרגיל (DavidLibre-Regular) ולא מפתח ה-heading (DavidLibre-Bold).
 * משמש את חותמת השערים בפרופיל IMUD: שורות המהדורה/המחבר/המשך-כותרת-
 * המשנה מופיעות בייחוס ב-David Libre רגיל (נמדד ב-PDF הייחוס:
 * ToraEx4 = "David Libre Regular"), בעוד כותרות ההערות/ה-TOC — שם
 * המנהרה ל-heading נכונה — נשארות ב-familyFontKeyOf. */
function literalFamilyKeyOf(fam) {
  if (!fam || !registeredFonts.has(fam)) return null;
  return fam;
}

/** **פרוסה 3 (§2.2 — זהות גופן מהמודל):** היפוך המיפוי לצורך הקרנה —
 * מפתח גופן (על שורות/מילים ב-PageModel) ⇒ שם משפחה לתצוגה. משפחה רשומה
 * היא המפתח עצמו; המפתחות הפונקציונליים ממופים למשפחה הקנונית שיצרה אותם
 * (אותה טבלה, כיוון אחד — אין עותק שני של הידע). */
const KEY_FAMILY = {
  fnbody: 'Frank Ruhl Libre',
  margin: 'Hadassah Friedlaender',
  window: 'FrankReal',
  heading: 'DavidLibre-Bold'
};

/** @param {string} key — מפתח מהמודל; null ⇒ null (גוף הטקסט — ירושת שורש) */
function familyOfFontKey(key) {
  if (!key) return null;
  if (key === 'body') return null;
  return KEY_FAMILY[key] || key;
}

module.exports = { familyFontKeyOf, literalFamilyKeyOf, familyOfFontKey };
