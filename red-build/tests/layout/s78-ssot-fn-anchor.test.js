// tests/layout/s78-ssot-fn-anchor.test.js — S78 (D-107): מקורות-אמת מאוחדים + הערות עוקבות-עוגן
// נעילות: LPT יחיד (תקציב=הקרנה=תצוגה), חלון פיצול חוקי, תפר נקי, מדדי הערה,
// זיהוי סמן, ומיקום הערה אצל עוגנה בכל נתיבי ההצבה (פיצול/הזזה מלאה/פליטה מרומזת).
'use strict';
const { describe, it, assert, assertEq, report } = require('../harness');
const { assignFootnoteLanes } = require('../../src/engine/layout/footnote-lanes');
const { noteMetrics, getFootnotesReservedHeight } = require('../../src/engine/layout/footnote-budget');
const { MIN_LINES_PER_SIDE, legalSplitWindow, seamIsClean, widowOrphanPolicy, escortNeedLines } = require('../../src/engine/layout/constraint-matrix');
const { markerFragmentOf, MARK_TAG } = require('../../src/engine/notes/markers');
const { generateCandidates } = require('../../src/engine/layout/candidate-generator');
const { planningUsedHeight } = require('../../src/engine/layout/column-flow');
const { projectPage } = require('../../src/engine/output/geometry-projector');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { Ledger } = require('../../src/engine/core/ledger');

const S = getDefaultSettings();

// =====================================================================
describe('S78.1 — footnote-lanes: LPT אחד לשלושה צרכנים', () => {
  it('שקילות מתמטית למימוש ההיסטורי (2000 וקטורים דטרמיניסטיים, כולל שווי-גובה)', () => {
    const legacy = (heights) => {
      const t = [0, 0];
      for (const h of [...heights].sort((a, b) => b - a)) { const i = t[0] <= t[1] ? 0 : 1; t[i] += h; }
      return Math.max(t[0], t[1]);
    };
    let mismatches = 0;
    for (let trial = 0; trial < 2000; trial++) {
      const n = 1 + (trial % 9);
      const heights = Array.from({ length: n }, (_, i) => ((trial * 31 + i * 17) % 37) + ((trial % 5) ? 0 : i));
      const notes = heights.map((h, i) => ({ i, heightPx: h }));
      const { totals } = assignFootnoteLanes(notes);
      if (Math.max(totals[0], totals[1]) !== legacy(heights)) mismatches++;
    }
    assertEq(mismatches, 0, 'LPT divergence from the historical implementation');
  });

  it('התקציב וההקרנה חולקים את אותם נתיבים (תקציב=הקרנה — הנעילה המרכזית של S78)', () => {
    // דף DP סינתטי עם הערות בגבהים שונים; ההקרנה מציבה את נתיב-0 מימין (RTL).
    // _fnColWidthPx מכוון כמו ב-pipeline: (רוחב תוכן − מרזב)/2.
    const notes = [
      { marker: 'א׳', text: 'א '.repeat(30), heightPx: 60, lineH: 15 },
      { marker: 'ב׳', text: 'ב '.repeat(60), heightPx: 120, lineH: 15 },
      { marker: 'ג׳', text: 'ג '.repeat(15), heightPx: 45, lineH: 15 },
      { marker: 'ד׳', text: 'ד '.repeat(45), heightPx: 90, lineH: 15 }
    ];
    const SS = { ...S, 'footnote-columns': 2, _fnColWidthPx: 352 }; // (720−16)/2 — מרווח תיבת התוכן
    const page = {
      index: 3, type: 'regular',
      template: { width: 800, height: 1000, gutter: 16, contentBox: { top: 60, bottom: 940, height: 880 }, columns: [{ x: 40, w: 350 }, { x: 410, w: 350 }] },
      columns: [[], []], footnotes: notes.map(n => ({ ...n })), sideNotes: [],
      fnReservedHeightPx: getFootnotesReservedHeight(notes, SS, (t) => t.length * 5)
    };
    const proj = projectPage(page, SS);
    assertEq(proj.footnotes.length, 4, 'all notes projected');
    // חלוקת הנתיבים של ההקרנה זהה לחלוקת המקור היחיד (נתיב 0 = ימין ב-RTL:
    // x = fullX + laneW + gutter; נתיב 1 = שמאל: x = fullX). ההקרנה פולטת לפי
    // סדר נתיבים — לכן ההשוואה לפי סמן, לא לפי אינדקס.
    const { lanes } = assignFootnoteLanes(notes);
    const laneOf = new Map();
    lanes[0].forEach(i => laneOf.set(i, 0));
    lanes[1].forEach(i => laneOf.set(i, 1));
    const projX = new Map(proj.footnotes.map(f => [String(f.marker), f.x]));
    const fullX = 40, laneW = 352, gutter = 16;
    for (let i = 0; i < 4; i++) {
      const lane = laneOf.get(i);
      const expectedX = lane === 0 ? fullX + laneW + gutter : fullX;
      assertEq(projX.get(String(notes[i].marker)), expectedX, `note ${i} (${notes[i].marker}) in lane ${lane}: x mismatch (budget-lane ≠ projected-lane)`);
    }
  });

  it('חלוקה חמדנית דטרמיניסטית: כל אינדקס מוקצה פעם אחת והנתיב הנמוך נבחר בתיקו', () => {
    const notes = [{ heightPx: 30 }, { heightPx: 50 }, { heightPx: 50 }];
    const { lanes, totals } = assignFootnoteLanes(notes);
    const all = [...lanes[0], ...lanes[1]].sort((a, b) => a - b);
    assertEq(all.join(','), '0,1,2', 'partition covers every note exactly once');
    // שווי-גובה (1,2): המיון יציב לפי אינדקס ⇒ 1 לפני 2; השני בגובה 50 נכנס לנתיב הנמוך
    assertEq(totals[0], 80, 'greedy min-total lane (50+30 in lane 0)');
    assertEq(totals[1], 50, 'second 50 goes to the lighter lane');
  });
});

// =====================================================================
describe('S78.2 — constraint-matrix: מטריצת האילוצים המאוחדת', () => {
  it('legalSplitWindow שקול לתנאי ההיסטורי בכל הטווח הקטן (exhaustive)', () => {
    for (let lines = 0; lines <= 12; lines++) {
      for (let maxFit = 0; maxFit <= 12; maxFit++) {
        const legacyReject = maxFit < 2 || lines - maxFit < 2;
        const win = legalSplitWindow(lines, maxFit);
        assertEq(win == null, legacyReject, `lines=${lines} maxFit=${maxFit}: window!=null must equal !legacyReject`);
        if (win) {
          assertEq(win.lo, MIN_LINES_PER_SIDE, 'lo = 2 (SRS §5.1)');
          assertEq(win.hi, lines - MIN_LINES_PER_SIDE, 'hi = lines−2');
        }
      }
    }
  });

  it('seamIsClean — וקטורי זהב מההיסטוריה של EXT-8 (ווידוא-תחתית/ווידוא-ראש לפי ריצות tokenId)', () => {
    const L = (t) => ({ meta: { tokenId: t } });
    const seq = [L('A'), L('A'), L('A'), L('B'), L('B'), L('B'), L('B')];
    assertEq(seamIsClean(seq, 0), true, 'empty col0 — clean');
    assertEq(seamIsClean(seq, 7), true, 'empty col1 — clean');
    assertEq(seamIsClean(seq, 3), true, 'A|B boundary — different blocks, clean');
    assertEq(seamIsClean(seq, 1), false, 'inside A after 1 line — widow-bottom');
    assertEq(seamIsClean(seq, 2), false, 'inside A after 2 lines — 1 A-line remains in col1 (widow-top)');
    assertEq(seamIsClean(seq, 4), false, 'inside B after 1 line — widow-top');
    assertEq(seamIsClean(seq, 5), true, 'inside B after 2 lines — 2+2 clean');
    assertEq(seamIsClean(seq, 6), false, 'inside B after 3 lines — 1 B-line remains (widow-top)');
    // ריצה בת 4: החיתוך הפנימי היחיד החוקי — 2+2
    const seq4 = [L('A'), L('A'), L('A'), L('A')];
    assertEq(seamIsClean(seq4, 2), true, 'AAAA cut at 2 — 2+2 clean');
    assertEq(seamIsClean(seq4, 1), false, 'AAAA cut at 1 — widow-bottom');
    assertEq(seamIsClean(seq4, 3), false, 'AAAA cut at 3 — widow-top');
  });

  it('escortNeedLines — הכותרת + עד 2 שורות ליווי (REQ-BAL-10)', () => {
    assertEq(escortNeedLines(1, 0), 1, 'no following lines');
    assertEq(escortNeedLines(1, 1), 2, 'one follower');
    assertEq(escortNeedLines(1, 2), 3, 'two followers');
    assertEq(escortNeedLines(1, 7), 3, 'capped at 2 escorts');
    assertEq(escortNeedLines(2, 3), 4, 'multi-line heading carries itself');
  });

  it('widowOrphanPolicy — קריאה מרוכזת של חמשת המפתחות', () => {
    const p = widowOrphanPolicy({ ...S, 'prevent-widows-top': true, 'widow-strictness': 'relaxed' });
    assertEq(p.preventWidowsTop, true, 'flag read');
    assertEq(p.strictness, 'relaxed', 'strictness read');
    assertEq(p.preventOrphansBottom, S['prevent-orphans-bottom'] === true, 'default passthrough');
  });
});

// =====================================================================
describe('S78.3 — noteMetrics ו-markerFragmentOf: מקורות יחידים', () => {
  it('noteMetrics: 0.8× הגוף, פיץ\' 1.25 — אותם ערכים היסטוריים', () => {
    const m = noteMetrics({ 'body-font-size-pt': 12 });
    assert(Math.abs(m.sizePt - 9.6) < 1e-9, 'sizePt = 0.8×body');
    assertEq(m.lineHeightPx, 16, 'lineHeightPx = round(9.6×96/72×1.25)');
  });

  it('markerFragmentOf — תבניות D-53 (מודבק/בודד/placeholder/רגיל)', () => {
    assertEq(markerFragmentOf(`עוגן\u00A0${MARK_TAG}ב׳`), 'ב׳', 'glued marker');
    assertEq(markerFragmentOf(`${MARK_TAG}ג׳`), 'ג׳', 'lone marker');
    assertEq(markerFragmentOf(`א׳\uE000טקסט הערה`), 'א׳', 'reject-to-body placeholder');
    assertEq(markerFragmentOf('מילה רגילה'), null, 'plain word is not a marker');
    assertEq(markerFragmentOf(''), null, 'empty');
  });
});

// =====================================================================
describe('S78.4 — generateCandidates: maxFit חי (תיקון שורש)', () => {
  it('מועמד שחורג מהמקום הפנוי נדחה HARD עם רישום סיבה', () => {
    const ledger = new Ledger();
    const blk = { tokenId: 'tX', lineHeightPx: 20, lines: Array.from({ length: 10 }, () => ({ heightPx: 20 })) };
    const cands = generateCandidates(blk, 4, 1000, S, ledger); // maxFit=4
    for (const c of cands) assert(c.cut <= 4, `cut ${c.cut} exceeds maxFit=4 — free-space leak`);
    const rejected = [...ledger.issues.values()].filter(r => r.kind === 'candidate-rejected' && r.predicate_before.why === 'exceeds-free-space');
    assert(rejected.length >= 1, 'rejection must be ledgered (S5.1.10)');
    assertEq(rejected[0].predicate_before.maxFit, 4, 'evidence carries maxFit');
  });

  it('כשחלון הפיצול ריק — אין מועמדים כלל (הנפילה ל-legal-split של findSplit)', () => {
    const blk = { tokenId: 'tY', lineHeightPx: 20, lines: Array.from({ length: 5 }, () => ({ heightPx: 20 })) };
    const cands = generateCandidates(blk, 1, 1000, S, new Ledger()); // maxFit=1 < MIN_LINES_PER_SIDE
    assertEq(cands.length, 0, 'no legal candidate below the window');
  });
});

// =====================================================================
describe('S78.5 — הערות עוקבות-עוגן בצינור המלא', () => {
  // מסמך דטרמיניסטי: מילוי עמודים ואז פסקה ארוכה שהערתה בזנבה — העוגן נופל
  // אחרי גבול הפיצול/ההזזה. בונים טקסט שבו הסמן מאוחר מספיק שהערה תיאלץ
  // לעקוב אחריו לעמוד העוגן.
  const word = (i) => `מילה${i}`;
  const para = (n, seed) => Array.from({ length: n }, (_, i) => word(seed + i)).join(' ');
  const buildDoc = () => {
    const parts = [];
    for (let p = 0; p < 30; p++) parts.push(para(28, p * 100)); // מילוי ~עמודים
    // פסקה ארוכה: הערה מאוחרת (בסוף שליש הזנב) — העוגן צפוי בעמוד ההמשך
    const longWords = [];
    for (let i = 0; i < 220; i++) longWords.push(word(5000 + i));
    const withNote = longWords.slice(0, 190).join(' ') + ' עוגן [הערה שחייבת להיות בעמוד העוגן] ' + longWords.slice(190).join(' ');
    parts.push(withNote);
    return parts.join('\n');
  };

  const pageLines = (pg) => [...(pg.spanning ? pg.spanning.lines : []), ...pg.columns.flatMap(c => c)];

  it('ההערה מוצגת בעמוד שבו העוגן — לא לפניו (המדידה: 3/11 בספר-האמת לפני התיקון)', () => {
    const doc = buildDoc();
    const r = typeset(doc, { ...S });
    assert(r.contentPreserved === true, 'content preserved');
    // מפת סמנים → עמודי הופעה
    const anchorPage = new Map();
    for (const pg of r.pages) {
      for (const ln of pageLines(pg)) {
        for (const w of (ln.words || [])) {
          const frag = markerFragmentOf(w);
          if (frag != null && !anchorPage.has(frag)) anchorPage.set(frag, pg.index);
        }
      }
    }
    let checked = 0;
    for (const pg of r.pages) {
      for (const n of (pg.footnotes || [])) {
        if (n.isContinuation || n.mode === 'split-rest') continue;
        const target = anchorPage.get(String(n.marker));
        assert(target != null, `marker ${n.marker} has an anchor in the body`);
        assert(pg.index >= target, `note ${n.marker} shown on p${pg.index} before its anchor on p${target}`);
        checked++;
      }
    }
    assert(checked > 0, 'the document actually produced footnotes');
  });

  it('דטרמיניזם מלא על מסמך ההערות', () => {
    const doc = buildDoc();
    const a = typeset(doc, { ...S });
    const b = typeset(doc, { ...S });
    assertEq(a.layoutHash, b.layoutHash, 'hash identical across runs');
  });

  it('ניקוז הזנב: כל הערה במודל חתומה במדדים (תקציב=הקרנה)', () => {
    // מסמך שמסתיים בהערה ארוכה מאוד תחת מדיניות פיצול — ההמשך נשאר בתור בסוף
    const doc = Array.from({ length: 12 }, (_, p) => para(28, p * 100)).join('\n')
      + '\n' + para(60, 900) + ' עוגן [' + 'טקסט הערה ארוך מאוד '.repeat(120) + ']';
    const r = typeset(doc, { ...S, 'long-footnote-policy': 'split', 'fn-bar-max-height-px': 60 });
    assert(r.contentPreserved === true, 'content preserved under split policy');
    for (const pg of r.pages) {
      for (const n of (pg.footnotes || [])) {
        assert(n.heightPx != null, `tail-drained note ${n.marker} must carry heightPx (projection==reservation)`);
        assert(n.lineH != null, `tail-drained note ${n.marker} must carry lineH`);
      }
    }
  });
});

// =====================================================================
describe('S78.6 — planningUsedHeight: שתי סמנטיקות, שני מקורות מתועדים', () => {
  it('גובה תכנון = שורות + תקציב הערות על הטור האחרון בלבד', () => {
    const col0 = [{ heightPx: 20 }, { heightPx: 20 }];
    const col1 = [{ heightPx: 20 }];
    const page = { columns: [col0, col1], fnReservedHeightPx: 35 };
    assertEq(planningUsedHeight(col0, page), 40, 'first column: lines only');
    assertEq(planningUsedHeight(col1, page), 55, 'last column: lines + fn budget (F-17)');
    assertEq(planningUsedHeight(col1, null), 20, 'no page context: lines only');
  });
});

report('s78-ssot-fn-anchor');
