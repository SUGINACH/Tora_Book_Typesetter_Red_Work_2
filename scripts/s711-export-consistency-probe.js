// scripts/s711-export-consistency-probe.js — ניסוי אמפירי (S71.1, בדיקה כפולה):
// הוכחה שנתיב הייצוא בפועל (exportPdf) מקרין במדידה עקבית עם המודל.
//
// שלב א' (לפני התיקון — מתועד בהערות הקומיט): typeset רץ ב-impl B (מטריקות
// אמת) אך projectDocument בנה לעצמו MeasureAPI(settings,'table') ⇒
//   Frank Ruhl Libre: 168/546 שורות חרגו מגבולות הטור (מקס 32.5px);
//   97.8% מהמילים סטו מהתצוגה (ממוצע 111.8px, מקס 643.7px).
// שלב ב' (אחרי התיקון): export-api מעביר להקרנה את אותו מימוש מדידה.
// כאן נבדק הנתיב האמיתי: exportPdf → exp.projected — אפס חריגות טור.
'use strict';

const fs = require('fs');
const path = require('path');
const RB = path.join(__dirname, '..', 'red-build');
const { exportPdf } = require(path.join(RB, 'src/engine/output/export-api'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));

const FONT = process.env.PROBE_FONT || path.join(RB, 'ui/assets/imud/fonts/FrankRuhlLibre-Regular.ttf');
const PROFILE = process.env.PROBE_PROFILE || 'Frank Ruhl Libre';
const bytes = fs.readFileSync(FONT);
const doc = fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8');

const exp = exportPdf(doc, getDefaultSettings(), bytes, PROFILE);
if (!exp.ok) { console.error('export failed:', exp.error); process.exit(2); }

let lines = 0, overflow = 0, maxExcess = 0, worst = null;
for (let pi = 0; pi < exp.projected.pages.length; pi++) {
  const pg = exp.projected.pages[pi];
  for (let li = 0; li < pg.lines.length; li++) {
    const ln = pg.lines[li];
    if (!ln.words || !ln.words.length) continue;
    lines++;
    const wSum = ln.words.reduce((a, w) => a + w.w, 0);
    const excess = wSum - ln.w;
    if (excess > 1) {
      overflow++;
      if (excess > maxExcess) { maxExcess = excess; worst = { page: pi, line: li, excessPx: Math.round(excess * 10) / 10 }; }
    }
  }
}

// דטרמיניזם ייצוא כפול (בתים זהים) — נשאר מובטח גם אחרי התיקון
const again = exportPdf(doc, getDefaultSettings(), bytes, PROFILE);
const detBytes = again.ok && Buffer.compare(exp.bytes, again.bytes) === 0;

console.log(JSON.stringify({
  font: path.basename(FONT),
  pages: exp.result.pages.length,
  projectedLines: lines,
  columnOverflowLines: overflow,
  maxExcessPx: Math.round(maxExcess * 10) / 10,
  worst,
  exportByteDeterminism: detBytes,
  verdict: overflow === 0 && detBytes ? 'PASS — ההקרנה עקבית עם המודל' : 'FAIL',
}, null, 2));
process.exit(overflow === 0 && detBytes ? 0 : 1);
