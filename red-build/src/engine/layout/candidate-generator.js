// src/engine/layout/candidate-generator.js — Split-candidate scoring with capacity evidence (S5.1.2 core, registered S4)
// עקרון אנטי־טלאי: overflow = HARD reject (לא ×2000 soft כ ב‑V1), כל דחייה נרשמת ל‑ledger עם נימוס.
'use strict';

const { blockGapPx } = require('./column-flow');
const { MIN_LINES_PER_SIDE } = require('./constraint-matrix'); // **S78 (D-107):** חלון הפיצול — מקור יחיד

/**
 * מחזיר מועמדי פיצול לבלוק בתוך טור:
 *  - נקודות שבירה = סוף שורה (L3 line boxes)
 *  - scoring = f(Δ height, capacityBefore/capacityAfter justify, next-block context)
 *  - ladder עונשין: whole-paragraph moves > line moves > leading > para-spacing
 *
 * **S78 (D-107 — תיקון שורש: מועמד מוגבל למקום הפנוי):** עד כאן פרמטר `cur`
 * (maxFit — השורות שנכנסות במקום הפנוי) היה **מת**: המועמד המנוצח נבחר
 * לפי איזון בלבד ויכול היה לחרוג מהמקום הפנוי ⇒ pushLines פלט את העודף
 * בפליטה מרומזת ⇒ עמוד כמעט-ריק באמצע הספר (נמדד: עמד עם 4+4
 * שורות בלבד בספר-האמת; מקורו cut=16 מול maxFit≈8). כעת מועמד שחורג
 * מ-maxFit נדחה HARD עם רישום סיבה — כמו דחיית ה-overflow (D-11).
 *
 * @param {object} blk        בלוק עם .lines (נמדדו)
 * @param {number} cur        maxFit — שורות שנכנסות במקום הפנוי (חוטר החלון — S78)
 * @param {number} colCapacityPx
 * @param {object} settings
 * @param {object} ledger     Ledger (core/ledger) — כתיבת סיבה לכל דחייה (S5.1.10)
 */
function generateCandidates(blk, cur, colCapacityPx, settings, ledger) {
  const maxFit = Number(cur) || 0; // **S78 (D-107):** maxFit חי — גבול עליון חוקי למועמדים
  const out = [];
  const lineH = blk.lineHeightPx || 20;
  const gap = blockGapPx(settings, lineH);
  for (let cut = MIN_LINES_PER_SIDE; cut < blk.lines.length; cut++) {
    // HARD reject: חיתוך שחורג מהמקום הפנוי — החלק הראשון לא ייכנס לעמוד (S78, D-107)
    if (cut > maxFit) {
      if (ledger) ledger.create('candidate-rejected', `${blk.tokenId}@${cut}`, null, { why: 'exceeds-free-space', cut, maxFit }, 'candidate-gen');
      continue;
    }
    const before = blk.lines.slice(0, cut).reduce((s, l) => s + (l.heightPx || lineH), 0) + gap;
    const after = blk.lines.slice(cut).reduce((s, l) => s + (l.heightPx || lineH), 0);
    // HARD reject: overflow אינו נענש במשקל אלא נפסל לחלוטין (D-11)
    if (before > colCapacityPx) {
      if (ledger) ledger.create('candidate-rejected', `${blk.tokenId}@${cut}`, null, { why: 'overflow-before', before, cap: colCapacityPx }, 'candidate-gen');
      continue;
    }
    // justify capability: האם הטור שלפני יכול להצדיק (להגיע לקצה) — p376-class reasoning
    const capacityBefore = colCapacityPx - before;
    const score = Math.abs(capacityBefore - (colCapacityPx - after))
      + (settings['widow-strictness'] === 'strict' && cut < 2 ? 1e9 : 0);
    out.push({ cut, before, after, capacityBefore, capacityAfter: colCapacityPx - after, score });
  }
  out.sort((a, b) => a.score - b.score);
  return out;
}

module.exports = { generateCandidates };
