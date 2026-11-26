// tests/unit/pdf-mark-policy.test.js — **S74: בדיקת יחידה למדיניות ניקוד משולב ב-PDF**
'use strict';

/**
 * נועל את חוזה מודול pdf-mark-policy: בפרופיל המאוחד גליפי ניקוד משולב (Mn)
 * מקבלים רוחב 0 במערך /W של הכותב — כך שה-PDF מקרין את רוחב המילה שהמודל
 * תכנן (measure-api RC-M4 מודד סימנים אלו ב-0). שליטה שלילית: תווים
 * רגילים אינם מושפעים, ואובייקט גופן-כותב חסר/ללא סימנים מוחזר כמו שהוא.
 *
 * הערת סנכרון: רשימת הטווחים מוגדרת ב-pdf-mark-policy וב-measure-api
 * (RC-M4) — שינוי באחת מהן הוא שינוי חוזה שחייב להיכנס לשתיהן; השער
 * הפונקציונלי להלן נועל את הסיווג על ניקודי שְׁמַע (שווא/שין-סין/פתח)
 * ועל סימנים משולבים נציגים מכל טווח מרכזי.
 */

const { COMBINING_MARK_RE, isCombiningMark, applyCombinedMarkPolicy } = require('../../src/engine/output/pdf-mark-policy');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  FAIL: ' + msg); }
}

// ---- 1. ניקודי שְׁמַע (שווא U+05B0, שין-סין U+05C1, פתח U+05B7) ----
ok(isCombiningMark('ְ') && isCombiningMark('ׁ') && isCombiningMark('ַ'), 'sheva/shin-dot/patach classified as combining marks');
ok(!isCombiningMark('ש') && !isCombiningMark('מ') && !isCombiningMark('ע'), 'base letters are not marks');

// ---- 2. נציגים מהטווחים המרכזיים (סנכרון מול measure-api RC-M4) ----
// Latin (U+0300s), Cyrillic (U+0483), Hebrew (U+0591), Arabic (U+064B)
ok(COMBINING_MARK_RE.test('́'), 'latin combining acute classified');
ok(COMBINING_MARK_RE.test('҃'), 'cyrillic titlo classified');
ok(COMBINING_MARK_RE.test('֑'), 'hebrew etnachta classified');
ok(COMBINING_MARK_RE.test('ً'), 'arabic fathatan classified');
ok(!COMBINING_MARK_RE.test('a') && !COMBINING_MARK_RE.test('א') && !COMBINING_MARK_RE.test('1'), 'plain characters never classified');

// ---- 3. החלת המדיניות על גופן-כותב מדומה (חוזה export-api→writer) ----
{
  const font = {
    widthsUnits: new Map([[1, 3275], [2, 1793], [3, 1793]]),
    unitsPerEm: 2048,
    charToGidEntries: () => [['ְ', 2], ['ׁ', 3], ['ש', 1]]
  };
  const out = applyCombinedMarkPolicy(font);
  ok(out !== font, 'returns a copy — original untouched');
  ok(out.widthsUnits.get(2) === 0 && out.widthsUnits.get(3) === 0, 'mark widths zeroed');
  ok(out.widthsUnits.get(1) === 3275, 'base width unaffected');
  ok(font.widthsUnits.get(2) === 1793, 'purity: original keeps raw width');
  ok(out.unitsPerEm === 2048 && typeof out.charToGidEntries === 'function', 'rest of contract preserved');
}

// ---- 4. שליטות שליליות ----
ok(applyCombinedMarkPolicy(null) === null, 'null passthrough');
{
  const noMarks = { widthsUnits: new Map([[1, 100]]), unitsPerEm: 1000, charToGidEntries: () => [['א', 1]] };
  ok(applyCombinedMarkPolicy(noMarks) === noMarks, 'font without marks returned as-is (zero overhead)');
}
{
  const noContract = { widthsUnits: new Map([[1, 100]]) };
  ok(applyCombinedMarkPolicy(noContract) === noContract, 'object missing contract not broken');
}

console.log('pdf-mark-policy: ' + pass + ' passed, ' + fail + ' failed');
if (fail > 0) process.exit(1);
