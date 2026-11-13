// src/engine/typography/kp-linebreak.js — Knuth-Plass optimal line breaking (REQ-LB-02/03/07)
'use strict';

/**
 * מימוש KP: boxes/glues/penalties, badness³, עונשי runt/widow/orphan, active-list DP.
 * - אין מקף סוף־שורה (no hyphenation — אסור בספרות תורנית).
 * - \u00A0 = צמידת NBSP (protectors); \uE000 = רווח אטומי בתוך הערה — ההערה אינה נקרעת (REQ-LB-04).
 * - RTL מדידה: rect.right − colRect.left (לקח Z.ai #5) — מתמטי כאן; DOM oracle יזהה.
 */

const INF = Number.POSITIVE_INFINITY;
const STRETCH_RATIO = 0.6;   // מתיחות רווח יחסית
const SHRINK_RATIO = 0.5;    // כיווץ רווח יחסית
const LINE_DEMERIT = 100;    // עלות בסיס לכל שורה: ברירת מחדל במודל ragged — ה־DP
                            // ממזער מספר שורות (הרינדור מצייר מרווחים טבעיים).
// השלמת ביקורת 03.11 (D-79): הרינדור של המנוע ragged (יישור לימין; מרווחים
// טבעיים ב-DOM וב-PDF). לכן במודל השבירה כל שורה מקבלת "מתיחת סוף-שורה"
// כמו \raggedright של TeX — אחרת שורה במילה בודדת (stretch=0 ⇒ ratio=0)
// היא "חינם" וה־DP מתפוצץ לשורות מילה-בודדת. כשהשורות מיושרות בפועל
// (align=stretch) ניתן לכבות: opts.raggedEnd=false.
const RAGGED_END_STRETCH_FACTOR = 10; // × maxWidthPx — מתיחה גדולה סופית-מעשית

function buildItems(words, measure) {
  const items = [];
  const sp = measure(' ');
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    // יחידת NBSP פוצלת לתת־קופסאות עם **אי־שבירה אסורה** (INF penalty) ביניהן:
    // כך DP רואה את הרוחב האמיתי (כולל רווחים פנימיים) אך לעולם לא קורע את הצמד.
    // (לקח V23: רוחב חסר של unit צמוד → מדידת שורה שגויה → badness מוטה.)
    // U+E000 (רווח אטומי בתוך הערה) אינו מקום שבירה כלל — נשמר בתוך תת־הקופסה
    // ומוחלף ל‑NBSP רק בפליטה; כך unit שלם לעולם לא נקרע (REQ-LB-04).
    const parts = w.split('\u00A0');
    for (let k = 0; k < parts.length; k++) {
      if (k > 0) items.push({ kind: 'penalty', forbidden: true, cost: INF });
      // **S5.2 (תיקון 4 — תיבת פנטום 1px):** חלק ריק (NBSP כפול, פתיחה/סיום
      // ב-NBSP) נמדד עכשיו ברוחב 0 — בעבר Math.max(1,…) יצר תיבת 1px שאינה
      // קיימת בדיו והעלתה את רוחב השורה. אין חשש מכניסה לרווח: מנגנוני ה-badness
      // מוגנים (effStretch>0 / shrink>0 — ראה breakLines) וההתקדמות מובטחת
      // (תיבה ריקה אינה מקום שבירה; הטוקן שלה משוחזר עם ה-NBSP שלו).
      items.push({ kind: 'box', text: parts[k].replace(/\uE000/g, '\u00A0'), width: Math.max(0, measure(parts[k])) });
      if (k < parts.length - 1) items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO, internal: true });
    }
    if (i < words.length - 1) {
      items.push({ kind: 'glue', width: sp, stretch: sp * STRETCH_RATIO, shrink: sp * SHRINK_RATIO });
    }
  }
  items.push({ kind: 'penalty', final: true }); // סיום פסקה — שבירה חובה
  return items;
}

function badness(ratio) {
  if (!isFinite(ratio)) return 0;
  if (ratio < -1) return INF;               // אי־אפשר לכווץ מעל הגבול
  const r = Math.abs(ratio);
  if (r <= 1) return Math.round(Math.pow(r * 100, 3) / 10000); // 0..100
  return 100 + Math.round(Math.pow((r - 1) * 100, 2) / 100);   // דחיסה/מתיחת יתר
}

/**
 * @param {string[]} words - מילות הפסקה (NBSP כבר הוצמד ע"י protectors)
 * @param {number|((lineIndex:number)=>number)} maxWidthPx
 * @param {(t:string)=>number} measure
 * @param {number} lineHeightPx
 * @param {{runtMinPct?:number,raggedEnd?:boolean}} opts
 * @returns {Array<{words:string[], widthPx:number, heightPx:number, isLast:boolean}>}
 */
function solveBreaks(items, maxWidthPx, opts = {}) {
  if (!Array.isArray(items)) throw new TypeError('kp-linebreak: measured items must be an array');
  const widthProvider = typeof maxWidthPx === 'function' ? maxWidthPx : () => maxWidthPx;
  if (typeof maxWidthPx !== 'function' && (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0)) {
    throw new RangeError('kp-linebreak: maxWidthPx must be a positive finite number or a line-width function');
  }

  // Resolve each line width once. A provider must be pure for a given line index;
  // this cache prevents repeated geometry work while exploring DP candidates.
  const lineWidths = new Map();
  const widthForLine = (lineIndex) => {
    if (!Number.isInteger(lineIndex) || lineIndex < 0) {
      throw new RangeError('kp-linebreak: line index must be a non-negative integer');
    }
    if (!lineWidths.has(lineIndex)) {
      const width = widthProvider(lineIndex);
      if (!Number.isFinite(width) || width <= 0) {
        throw new RangeError('kp-linebreak: width for line ' + lineIndex + ' must be positive and finite');
      }
      lineWidths.set(lineIndex, width);
    }
    return lineWidths.get(lineIndex);
  };

  // **03.11 (ביקורת):** חיבור ההגדרה — runt-min-width-pct מגיע כ-runts מה-pipeline
  // וכ-runtMinPct מקריאות ישירות; שניהם נקראים (בעבר רק runtMinPct נקרא וההגדרה לא השפיעה).
  const runts = opts.runtMinPct != null ? opts.runtMinPct : (opts.runts != null ? opts.runts : 50);
  const n = items.length;

  // The state includes both item position and the next line index.
  // A single best-cost value per item position is insufficient when widths vary:
  // paths at the same item may have different future geometry. This is still one
  // Knuth–Plass solver, with a two-dimensional state.
  const states = Array.from({ length: n + 1 }, () => new Map());
  states[0].set(0, { cost: 0, action: 'origin' });
  const constantWidth = typeof maxWidthPx !== 'function';
  const updateState = (position, lineNo, candidate) => {
    if (constantWidth) {
      // With a scalar width, future geometry is independent of lineNo. The
      // cheapest path therefore dominates every other path at this position,
      // preserving the original O(n²) state-space behavior.
      let best = null;
      for (const state of states[position].values()) {
        if (!best || state.cost < best.cost) best = state;
      }
      if (best && best.cost <= candidate.cost) return;
      states[position].clear();
    }
    const prior = states[position].get(lineNo);
    if (!prior || candidate.cost < prior.cost) states[position].set(lineNo, candidate);
  };

  for (let i = 0; i < n; i++) {
    if (!states[i].size) continue;
    for (const [lineNo, state] of states[i]) {
      if (items[i].kind === 'glue' && !items[i].internal) {
        // Skip regular glue at the beginning of a line; internal glue is atomic.
        updateState(i + 1, lineNo, {
          cost: state.cost,
          action: 'skip',
          prevIndex: i,
          prevLineNo: lineNo
        });
        continue;
      }

      const lineWidthPx = widthForLine(lineNo);
      let w = 0, stretch = 0, shrink = 0;
      for (let j = i; j < n; j++) {
        const it = items[j];
        if (it.kind === 'box') w += it.width;
        // Natural width includes boxes and glue; stretch/shrink are tracked separately.
        else if (it.kind === 'glue') { w += it.width; stretch += it.stretch; shrink += it.shrink; }
        else if (it.kind === 'penalty') {
          if (it.forbidden) continue;
          // Final paragraph break.
          const slack = lineWidthPx - w;
          const raggedEnd = opts.raggedEnd !== false;
          const effStretch = stretch + (raggedEnd ? lineWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
          const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
          let b = badness(ratio);
          if (b < INF && w < lineWidthPx * (runts / 100)) b += 60;
          if (b < INF) {
            updateState(n, lineNo + 1, {
              cost: state.cost + b + LINE_DEMERIT,
              action: 'line',
              prevIndex: i,
              prevLineNo: lineNo,
              start: i,
              end: n
            });
          }
          break;
        }

        // Conservative natural-width fit check (same 0.75px safety margin).
        if (w > lineWidthPx - 0.75) break;

        if (it.kind === 'box') {
          const cut = j + 1;
          // Legal breaks are structural: before a new box and after non-internal glue.
          if (!(items[cut].kind === 'glue' && !items[cut].internal && items[cut + 1] && items[cut + 1].kind === 'box')) continue;
          const slack = lineWidthPx - w;
          if (slack < -0.75) continue;
          const raggedEnd = opts.raggedEnd !== false;
          const effStretch = stretch + (raggedEnd ? lineWidthPx * RAGGED_END_STRETCH_FACTOR : 0);
          const ratio = slack >= 0 ? (effStretch > 0 ? slack / effStretch : 0) : (shrink > 0 ? slack / shrink : -2);
          const b = badness(ratio);
          if (b >= INF) continue;
          updateState(cut, lineNo + 1, {
            cost: state.cost + b + LINE_DEMERIT,
            action: 'line',
            prevIndex: i,
            prevLineNo: lineNo,
            start: i,
            end: cut
          });
        }
      }
    }
  }

  let best = null;
  for (const [lineNo, state] of states[n]) {
    if (!best || state.cost < best.state.cost) best = { lineNo, state };
  }
  if (!best) return { cuts: null, widthForLine };

  // Reconstruct the selected line intervals from the 2D predecessor map.
  const cuts = [];
  let position = n, lineNo = best.lineNo;
  while (position > 0) {
    const state = states[position].get(lineNo);
    if (!state || state.action === 'origin') {
      throw new Error('kp-linebreak: broken predecessor chain while reconstructing lines');
    }
    if (state.action === 'line') cuts.push([state.start, state.end]);
    position = state.prevIndex;
    lineNo = state.prevLineNo;
  }
  cuts.reverse();
  return { cuts, widthForLine };
}

function breakLines(words, maxWidthPx, measure, lineHeightPx, opts = {}) {
  if (!Array.isArray(words)) throw new TypeError('kp-linebreak: words must be an array');
  if (typeof measure !== 'function') throw new TypeError('kp-linebreak: measure(text) is required');
  const items = buildItems(words, measure);
  const solution = solveBreaks(items, maxWidthPx, opts);
  if (!solution.cuts) return greedyFallback(items, solution.widthForLine, measure, lineHeightPx);
  const cuts = solution.cuts;
  const lines = [];
  for (let k = 0; k < cuts.length; k++) {
    const [a, b] = cuts[k];
    // Recombine sub-boxes of one NBSP unit into one output token.
    const toks = [];
    let cur = null, prevPenaltyForbidden = false;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'penalty' && it.forbidden) { prevPenaltyForbidden = true; continue; }
      if (it.kind !== 'box') continue;
      if (cur !== null && prevPenaltyForbidden) { cur += '\u00A0' + it.text; prevPenaltyForbidden = false; }
      else { if (cur !== null) toks.push(cur); cur = it.text; prevPenaltyForbidden = false; }
    }
    if (cur !== null) toks.push(cur);
    if (!toks.length) continue;

    let widthPx = 0;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'box' || it.kind === 'glue') widthPx += it.width;
    }
    lines.push({ words: toks, widthPx, heightPx: lineHeightPx, isLast: k === cuts.length - 1 });
  }
  return lines;
}
/**
 * Break an ordered sequence of already-measured atomic inline items with the
 * same Knuth–Plass solver used by breakLines().
 *
 * Input is a stream of {kind:'text'|'image'|'anchor', widthPx, heightPx}
 * atoms interleaved with explicit {kind:'glue', widthPx, stretchPx, shrinkPx}
 * opportunities and optional {kind:'penalty', forbidden:true} constraints.
 * Text atoms are indivisible words; whitespace is represented by glue. Any
 * future item type can use the same measured-box contract without changing
 * the optimizer.
 *
 * A layout that cannot fit an unbreakable item returns ok:false. Unlike the
 * legacy word wrapper, this API never silently falls back to a second breaker.
 */
function breakInlineItems(inlineItems, maxWidthPx, lineHeightPx, opts = {}) {
  if (!Array.isArray(inlineItems)) throw new TypeError('kp-linebreak: inlineItems must be an array');
  if (!Number.isFinite(lineHeightPx) || lineHeightPx < 0) {
    throw new RangeError('kp-linebreak: lineHeightPx must be finite and non-negative');
  }
  const measured = [];
  let hasFinal = false;
  for (let index = 0; index < inlineItems.length; index++) {
    const item = inlineItems[index];
    if (!item || typeof item !== 'object') {
      throw new TypeError('kp-linebreak: invalid inline item at index ' + index);
    }
    if (item.kind === 'glue') {
      const width = item.widthPx;
      const stretch = item.stretchPx == null ? 0 : item.stretchPx;
      const shrink = item.shrinkPx == null ? 0 : item.shrinkPx;
      if (![width, stretch, shrink].every(Number.isFinite) || width < 0 || stretch < 0 || shrink < 0) {
        throw new TypeError('kp-linebreak: glue geometry must be finite and non-negative');
      }
      measured.push({ kind: 'glue', width, stretch, shrink, internal: !!item.internal });
      continue;
    }
    if (item.kind === 'penalty') {
      const penalty = { kind: 'penalty', forbidden: !!item.forbidden, final: !!item.final };
      measured.push(penalty);
      hasFinal = hasFinal || penalty.final;
      continue;
    }
    if (!['text', 'image', 'anchor'].includes(item.kind)) {
      throw new TypeError('kp-linebreak: unsupported inline item kind at index ' + index);
    }
    const width = item.widthPx, height = item.heightPx == null ? 0 : item.heightPx;
    if (!Number.isFinite(width) || width < 0 || !Number.isFinite(height) || height < 0) {
      throw new TypeError('kp-linebreak: atom geometry must be finite and non-negative');
    }
    if (item.kind === 'text') {
      if (typeof item.text !== 'string' || !item.text || /[ \t\n\r]/.test(item.text)) {
        throw new TypeError('kp-linebreak: text atoms must be non-empty single break units; represent spaces as glue');
      }
    } else if (item.kind === 'image' && (typeof item.resourcePath !== 'string' || !item.resourcePath.trim())) {
      throw new TypeError('kp-linebreak: image atoms require resourcePath');
    } else if (item.kind === 'anchor' && item.id == null) {
      throw new TypeError('kp-linebreak: anchor atoms require a stable id');
    }
    measured.push({
      kind: 'box',
      text: item.kind === 'text' ? item.text : undefined,
      width,
      height,
      payload: { ...item, widthPx: width, heightPx: height }
    });
  }
  if (!hasFinal) measured.push({ kind: 'penalty', final: true });
  const solution = solveBreaks(measured, maxWidthPx, opts);
  if (!solution.cuts) {
    const maxAtomWidthPx = measured.reduce((max, item) => item.kind === 'box' ? Math.max(max, item.width) : max, 0);
    return { ok: false, reason: 'no-valid-line-break', maxAtomWidthPx, lines: [] };
  }

  const lines = [];
  for (let lineIndex = 0; lineIndex < solution.cuts.length; lineIndex++) {
    const [start, end] = solution.cuts[lineIndex];
    const slice = measured.slice(start, end);
    const fragments = slice
      .filter(item => item.kind === 'box')
      .map(item => ({ ...item.payload, widthPx: item.width, heightPx: item.height }));
    const widthPx = slice.reduce((sum, item) =>
      sum + (item.kind === 'box' || item.kind === 'glue' ? item.width : 0), 0);
    const heightPx = Math.max(lineHeightPx, ...fragments.map(item => item.heightPx || 0));
    lines.push({
      fragments,
      words: fragments.filter(item => item.kind === 'text').map(item => item.text),
      widthPx,
      heightPx,
      isLast: lineIndex === solution.cuts.length - 1
    });
  }
  return { ok: true, lines };
}

  const lines = [];
  for (let k = 0; k < cuts.length; k++) {
    const [a, b] = cuts[k];
    // Recombine sub-boxes of one NBSP unit into one output token.
    const toks = [];
    let cur = null, prevPenaltyForbidden = false;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'penalty' && it.forbidden) { prevPenaltyForbidden = true; continue; }
      if (it.kind !== 'box') continue;
      if (cur !== null && prevPenaltyForbidden) { cur += '\u00A0' + it.text; prevPenaltyForbidden = false; }
      else { if (cur !== null) toks.push(cur); cur = it.text; prevPenaltyForbidden = false; }
    }
    if (cur !== null) toks.push(cur);
    if (!toks.length) continue;

    let widthPx = 0;
    for (let idx = a; idx < b; idx++) {
      const it = items[idx];
      if (it.kind === 'box' || it.kind === 'glue') widthPx += it.width;
    }
    lines.push({ words: toks, widthPx, heightPx: lineHeightPx, isLast: k === cuts.length - 1 });
  }
  return lines;
}
/**
 * מסלול גיבוי (כשה־DP לא מצא פתרון אפשרי, למשל מילה רחבה מהעמודה — אין מקף).
 * תיקון שורש (ביקורת 03.11, S13): בגיבוי חלים **אותם איסורי שבירה** כמו במסלול
 * הראשי — בעבר כל penalty חתם שורה, כולל `forbidden` (בין תתי־קופסות של יחידת
 * NBSP) ⇒ היחידה נקרעה בין שורות **ואיבדה את \u00A0 שלה** (אובדן תוכן, BRZ-15;
 * ורוחב פנימי נמדד כרווח רגיל). כעת:
 * 1. penalty אסור לעולם אינו מסיים שורה — היחידה משוחזרת כטוקן אחד עם \u00A0
 *    (זהה לשחזור המסלור הראשי).
 * 2. רוחב טוקן נצבר מהפריטים (תיבות + glue פנימי 0.26em) — זהה למסלור הראשי,
 *    לא מדידה מחודשת של מחרוזת NBSP (הייתה מודדת 0.4em פנימי — עיוות רוחב).
 * 3. התקדמות מובטחת: טוקן שגולש פותח שורה חדשה; טוקן רחב מהעמודה נשאר לבד
 *    בשורה משלו — אין לולאה ואין דילוג תוכן. מעבר אחד על הפריטים.
 */
function greedyFallback(items, widthForLine, measure, lineHeightPx) {
  const space = measure(' ');
  const lines = [];
  let toks = [];            // טוקנים של השורה הנוכחית
  let w = 0;                // רוחב השורה (כולל רווחים בין טוקנים)
  let cur = null, curW = 0, joinNext = false;  // טוקן בבנייה + רוחבו מהפריטים

  const flush = () => {
    if (!toks.length) return;
    lines.push({ words: toks, widthPx: w, heightPx: lineHeightPx, isLast: false });
    toks = []; w = 0;
  };
  const pushTok = () => {
    if (cur === null) return;
    // **S6.0 (R7-M2 — רווח רפאים בגיבוי הגרידי):** sp חושב לפי מצב השורה
    // **לפני** ה-flush ונוסף גם אחריו ⇒ כל שורה שנפתחה ב-flush נשאה רווח
    // אחד עודף ב-widthPx (מדידה שקרית לצרכי ריצת-שורה/איזון). תוקם:
    // הבדיקה וההוספה לפי המצב **אחרי** ההחלטה על flush.
    if (toks.length && w + space + curW > widthForLine(lines.length) - 0.75) flush(); // הטוקן הבא ייפתח שורה חדשה
    const sp = toks.length ? space : 0;
    toks.push(cur); w += sp + curW;
    cur = null; curW = 0; joinNext = false;
  };

  for (const it of items) {
    if (it.kind === 'penalty') {
      if (it.final) continue;            // סוף פסקה — הטיפול שלאחר הלולאה סוגר את האחרון
      if (it.forbidden) { joinNext = true; continue; } // אין חיתוך בתוך יחידה — לעולם
      continue;
    }
    if (it.kind === 'glue') {
      if (it.internal && cur !== null) { curW += it.width; } // רווח פנימי בתוך היחידה
      continue; // glue רגיל בין טוקנים: רוחבו נכנס כ־sp בעת pushTok
    }
    if (it.kind !== 'box') continue;
    if (cur !== null && joinNext) { cur += '\u00A0' + it.text; curW += it.width; joinNext = false; } // המשך הצמד — ואיפוס: המילה הרגילה הבאה לא תיבלע
    else { pushTok(); cur = it.text; curW = it.width; }
  }
  pushTok(); flush();
  if (lines.length) lines[lines.length - 1].isLast = true;
  return lines;
}

module.exports = { breakLines, breakInlineItems, badness, STRETCH_RATIO, SHRINK_RATIO };
