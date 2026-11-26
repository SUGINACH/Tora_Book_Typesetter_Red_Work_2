// tests/unit/pdf-mark-policy.test.js — **S74: בדיקת יחידה למדיניות ניקוד משולב ב-PDF**
'use strict';

const { COMBINING_MARK_RE, isCombiningMark, applyCombinedMarkPolicy } = require('../../src/engine/output/pdf-mark-policy');
const { COMBINING_MARK_RE: MEASURE_RE } = require('../../src/engine/typography/measure-api');

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  FAIL: ' + msg); }
}

// 1. זהות ביט-לביט מול הסמכות (measure-api RC-M4)
ok(COMBINING_MARK_RE.source === MEASURE_RE.source,
  'COMBINING_MARK_RE identical to measure-api (contract change must land in both)');

// 2. סיווג ניקודי שמע (U+05B0 sheva, U+05C1 shin-dot, U+05B7 patach)
ok(isCombiningMark('ְ') && isCombiningMark('ׁ') && isCombiningMark('ַ'), 'sheva/shin-dot/patach classified as combining marks');
ok(!isCombiningMark('ש') && !isCombiningMark('מ') && !isCombiningMark('ע'), 'base letters are not marks');

// 3. החלת המדיניות על גופן-כותב מדומה
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

// 4. שליטות שליליות
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
