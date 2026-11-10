// tests/audit/stage-snapshots.test.js — S1-ח (gap-Gold-V21): צילומי-מצב + delta + הקשר-עמוד
'use strict';

/**
 * **חוזה הבדיקה (תוכנית האב §2.2–§2.4, §2.5; משימת הפתיחה של סוכן 2):**
 *  1. יחידה — takeSnapshot: צילום קומפקטי עם חתימות שורה יציבות (tokenId#lineIdx).
 *  2. יחידה — diffSnapshots: added/removed/changed מזוהים נכון; ‏negative control —
 *     שורה שהוזזה/הוסרה/נוספה **חייבת** להיתפס (הגלאי רגיש, לא ירוק-שקר).
 *  3. יחידה — goldCausalityOf: מיפוי מלא של מצבי RED אל 7 קטגוריות Gold V21 (§2.3).
 *  4. יחידה — buildFindingsContext: הקשר-עמוד כולל רק רכיבים **אחרים** מאז
 *     הופעת הממצא (§2.4); הממצא עצמו מוחרג.
 *  5. אינטגרציה — typeset עם audit-stage-snapshots=true: ‏4 צילומים בסדר
 *     הנקודות המתועד, pageCount מונוטוני, deltas קיימים, findingsContext
 *     נבנה, gold_causality.summary קיים.
 *  6. no-op proof — hash הפריסה זהה עם ובלי המנגנון (§2.5: המכשור אסור
 *     לשנות פריסה; כמו הוכחת ה-onProgress ב-S10).
 *  7. דטרמיניזם — שתי ריצות עם המנגנון מפיקות אובייקט זהה ביטים (אין שעון אמיתי).
 *  8. חוזה דוח — buildReport מצרף page_context לממצאים כשהצילומים פעילים,
 *     ו-stage_snapshots מטא בראש הדוח; כבוי ⇒ אין אף אחד מהם.
 *  9. חוזה Worker — serializeTypesetResult מעביר stageSnapshots (או null).
 */

const { describe, it, assert, assertEq, report } = require('../harness');
const {
  takeSnapshot, diffSnapshots, buildFindingsContext, goldCausalityOf,
  createSnapshotTracker, STAGE_TO_CP
} = require('../../src/audit/stage-snapshots');
const { Ledger } = require('../../src/engine/core/ledger');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildReport } = require('../../src/audit/report-schema');
const { serializeTypesetResult } = require('../../src/ui/worker-protocol');
const fs = require('fs');
const path = require('path');

/** בניית "עמודים" סינתטיים לבדידות היחידה של ה-delta (בלי מנוע מלא). */
function fakePage(index, linesByCol, footnotes) {
  return {
    index, type: 'regular',
    columns: linesByCol.map(col => col.map(([tokenId, lineIdx, words, kind]) => ({
      tokenId, meta: { lineIdx }, words, kind: kind || 'paragraph'
    }))),
    footnotes: (footnotes || []).map(marker => ({ marker }))
  };
}

const TEXT = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample.txt'), 'utf8');

describe('S1-ח · יחידה — takeSnapshot / diffSnapshots', () => {
  it('צילום: חתימות tokenId#lineIdx, מטא-עמוד, ספירת שורות', () => {
    const pages = [fakePage(0, [[['t1', 0, ['א', 'ב']], ['t1', 1, ['ג']]], [['t2', 0, ['ד']]]], ['א'])];
    const s = takeSnapshot(pages, 'cp3-dp', 'page-plan');
    assertEq(s.checkpoint, 'cp3-dp');
    assertEq(s.pageCount, 1);
    assertEq(s.lineCount, 3);
    assertEq(s.pages[0].fn, ['א']);
    assertEq(s.lines['t1#0'].c, 0, 'טור ראשון');
    assertEq(s.lines['t2#0'].c, 1, 'טור שני');
  });

  it('delta: added / removed / changed — כולל negative control (שורה מוזזת חייבת להיתפס)', () => {
    const before = takeSnapshot([
      fakePage(0, [[['t1', 0, ['א']], ['t1', 1, ['ב']]], [['t2', 0, ['ג']]]])
    ], 'a', 'page-plan');
    const after = takeSnapshot([
      // t1#0 הוסר; t1#1 עבר מטור 0 לטור 1 (moved); t2#0 נשאר; t3#0 נוסף
      fakePage(0, [[], [['t2', 0, ['ג']], ['t1', 1, ['ב']], ['t3', 0, ['ח']]]])
    ], 'b', 'page-plan');
    const d = diffSnapshots(before, after);
    assertEq(d.totals.added, 1, 'רק t3#0 נוסף');
    assertEq(d.totals.removed, 1, 'רק t1#0 הוסר');
    assert(d.totals.changed >= 1, 'שינוי מיקום/תוכן נתפס (negative control: אסור ירוק-שקר)');
    assertEq(d.pages['0'].added.length, 1);
    assertEq(d.pages['0'].removed[0].key, 't1#0');
  });

  it('delta ריק בין צילומים זהים — ואינווריאנט final_stable נגזר', () => {
    const pages = [fakePage(0, [[['t1', 0, ['א']]]])];
    const t = createSnapshotTracker();
    t.capture(pages, 'cp4-decorations', 'decorations');
    t.capture(pages, 'cp5-final', 'render');
    const fin = t.finalize(null);
    assertEq(fin.deltas[0].totals.added + fin.deltas[0].totals.removed + fin.deltas[0].totals.changed, 0);
    assertEq(fin.final_stable, true, 'CP4→CP5 בלי תזוזת שורות ⇒ יציב');
  });
});

describe('S1-ח · יחידה — goldCausalityOf (מיפוי §2.3 מול Gold V21)', () => {
  const mkRec = (transitions, status, page) => ({
    transitions: transitions.map(([state, stage]) => ({ state, stage })),
    status, page, target: 'x'
  });
  const meta4 = [
    { checkpoint: 'cp3-dp', stage: 'page-plan', pageCount: 5, lineCount: 10 },
    { checkpoint: 'cp3-structural', stage: 'toc', pageCount: 7, lineCount: 12 },
    { checkpoint: 'cp4-decorations', stage: 'decorations', pageCount: 8, lineCount: 13 },
    { checkpoint: 'cp5-final', stage: 'render', pageCount: 8, lineCount: 13 }
  ];
  it('correction-reverted / reintroduced → correction-reverted', () => {
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['resolved', 'balance'], ['correction-reverted', 'refit']], 'persists', 1), meta4), 'correction-reverted');
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['resolved', 'balance'], ['reintroduced', 'refit']], 'reintroduced', 1), meta4), 'correction-reverted');
  });
  it('resolved → fixed-by-stage; unresolved/not-comparable → unresolved', () => {
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['resolved', 'refit']], 'resolved', 1), meta4), 'fixed-by-stage');
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['unresolved', 'refit']], 'unresolved', 1), meta4), 'unresolved');
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['not-comparable', 'refit']], 'not-comparable', 1), meta4), 'unresolved');
  });
  it('became-observable-later → couldnt-appear-before', () => {
    assertEq(goldCausalityOf(mkRec([['created', 'page-plan'], ['became-observable-later', 'decorations']], 'persists', 1), meta4), 'couldnt-appear-before');
  });
  it('נוצר בעמוד שלא היה קיים בצילום הקודם → couldnt-appear-before', () => {
    // עמוד 7 נוצר ב-decorations; ב-cp3-structural היו רק 7 עמודים (0..6)
    assertEq(goldCausalityOf(mkRec([['created', 'decorations']], 'persists', 7), meta4), 'couldnt-appear-before');
    // אותו עמוד בשלב toc (צילום 1; קודם לו צילום 0 עם 5 עמודים) — עמוד 5 לא היה קיים
    assertEq(goldCausalityOf(mkRec([['created', 'toc']], 'persists', 5), meta4), 'couldnt-appear-before');
  });
  it('נוצר בצילום הראשון → created-at-first-checkpoint; מאוחר בעמוד קיים → created-by-stage', () => {
    assertEq(goldCausalityOf(mkRec([['created', 'page-plan']], 'persists', 2), meta4), 'created-at-first-checkpoint');
    assertEq(goldCausalityOf(mkRec([['created', 'decorations']], 'persists', 2), meta4), 'created-by-stage');
    // correction-blocked — חסימת התיקון אינה משנה מועד יצירה ⇒ נותר לפי המקור
    assertEq(goldCausalityOf(mkRec([['created', 'page-plan'], ['correction-blocked', 'refit']], 'persists', 2), meta4), 'created-at-first-checkpoint');
    assertEq(goldCausalityOf(mkRec([['created', 'decorations'], ['correction-blocked', 'render']], 'persists', 2), meta4), 'created-by-stage');
  });
  it('competing-repair-side-effect → correction-reverted (ריפוי שהתנגש בריפוי אחר)', () => {
    assertEq(goldCausalityOf(mkRec([['created', 'balance'], ['competing-repair-side-effect', 'protections']], 'persists', 2), meta4), 'correction-reverted');
  });
});

describe('S1-ח · יחידה — buildFindingsContext (§2.4: רכיבים אחרים בעמוד)', () => {
  it('הקשר: רק רכיבים אחרים, רק מנקודת הופעת הממצא, רק בעמוד הממצא', () => {
    const ledger = new Ledger();
    const rec = ledger.create('column-imbalance', 't1', 3, {}, 'balance'); // נוצר ב-CP ראשון (balance→0)
    ledger.transition(rec.issue_id, 'persists', 'refit', '');
    const deltas = [
      { from: 'cp3-dp', to: 'cp3-structural', pages: {
        3: { added: [{ op: 'added', key: 't9#0', before: null, after: { p: 3 } }], removed: [], changed: [] },
        8: { added: [{ op: 'added', key: 't8#0', before: null, after: { p: 8 } }], removed: [], changed: [] } // עמוד אחר — לא רלוונטי
      } },
      { from: 'cp3-structural', to: 'cp4-decorations', pages: {
        3: {
          added: [], removed: [],
          changed: [
            { op: 'changed', key: 't1#5', before: { p: 3 }, after: { p: 3 } }, // הממצא עצמו — מוחרג
            { op: 'changed', key: 't7#2', before: { p: 2 }, after: { p: 3 } }  // רכיב אחר — נכלל
          ]
        }
      } },
      { from: 'cp4-decorations', to: 'cp5-final', pages: {} } // אין דלתא
    ];
    const ctx = buildFindingsContext(ledger, deltas);
    const c = ctx[rec.issue_id];
    assert(c, 'הקשר נבנה לממצא עם עמוד');
    assertEq(c.since_checkpoint, 0, 'נוצר בשלב מוקדם ⇒ אוסף מה-delta הראשון');
    const keys = c.others_changed.map(o => o.key);
    assert(keys.includes('t9#0'), 'רכיב שנוסף בעמוד הממצא נכלל');
    assert(keys.includes('t7#2'), 'רכיב שעבר לעמוד הממצא נכלל');
    assert(!keys.includes('t8#0'), 'רכיב בעמוד אחר אינו נכלל');
    assert(!keys.includes('t1#5'), 'שורות הטוקן של הממצא עצמו מוחרגות');
    assertEq(c.first_seen_stage, 'balance');
  });
  it('ממצא ללא עמוד (document-level) אינו מקבל הקשר', () => {
    const ledger = new Ledger();
    ledger.create('endnote-pagination', 'endnotes', null, {}, 'notes-budget');
    const ctx = buildFindingsContext(ledger, []);
    assertEq(Object.keys(ctx).length, 0);
  });
});

describe('S1-ח · אינטגרציה — typeset עם audit-stage-snapshots=true', () => {
  const settingsOn = { ...getDefaultSettings(), 'audit-stage-snapshots': true };
  const runOn = typeset(TEXT, settingsOn, { noRecommendations: true });

  it('4 צילומים בנקודות המתועדות; pageCount מונוטוני אי-יורד', () => {
    const ss = runOn.stageSnapshots;
    assert(ss, 'stageSnapshots קיים');
    assertEq(ss.schema, 'stage-snapshots-v1');
    assertEq(ss.checkpoints.map(c => c.checkpoint).join(','), 'cp3-dp,cp3-structural,cp4-decorations,cp5-final');
    for (let i = 1; i < ss.checkpoints.length; i++) {
      assert(ss.checkpoints[i].pageCount >= ss.checkpoints[i - 1].pageCount,
        `pageCount מונוטוני: ${ss.checkpoints[i - 1].pageCount} → ${ss.checkpoints[i].pageCount}`);
    }
    assertEq(ss.deltas.length, 3, 'שלושה deltas בין ארבעה צילומים');
    assert('summary' in ss.gold_causality, 'סיכום סיבתי Gold קיים');
  });

  it('no-op proof — hash הפריסה זהה עם ובלי המנגנון (§2.5)', () => {
    const runOff = typeset(TEXT, getDefaultSettings(), { noRecommendations: true });
    assertEq(runOn.layoutHash, runOff.layoutHash, 'המכשור אסור לו לשנות את הפריסה');
    assertEq(runOff.stageSnapshots, null, 'כבוי ⇒ null (אפס תקורה)');
    assertEq(runOn.contentPreserved, runOff.contentPreserved, 'שימור תוכן לא מושפע');
  });

  it('דטרמיניזם — שתי ריצות מפיקות אובייקט זהה ביטים', () => {
    const run2 = typeset(TEXT, settingsOn, { noRecommendations: true });
    assertEq(JSON.stringify(runOn.stageSnapshots), JSON.stringify(run2.stageSnapshots));
  });

  it('הדוח: page_context לממצאים + stage_snapshots בראש הדוח', () => {
    const rep = buildReport(runOn);
    assert(rep.stage_snapshots, 'מטא בראש הדוח');
    assertEq(rep.stage_snapshots.checkpoints.length, 4);
    assertEq(rep.stage_snapshots.totals.length, 3);
    const withCtx = rep.findings.filter(f => f.page_context);
    // ממצאים עם עמוד מקבלים הקשר; ממצאי document (page=null) לא
    for (const f of rep.findings) {
      if (f.page != null) assert(f.page_context, `${f.id}: חסר page_context`);
      else assert(!f.page_context, `${f.id}: לא אמור הקשר`);
    }
    if (withCtx.length) {
      const c = withCtx[0].page_context;
      assert('since_checkpoint' in c && 'others_changed' in c);
    }
  });

  it('כבוי ⇒ הדוח ללא stage_snapshots וללא page_context', () => {
    const runOff = typeset(TEXT, getDefaultSettings(), { noRecommendations: true });
    const rep = buildReport(runOff);
    assertEq(rep.stage_snapshots, null);
    assert(rep.findings.every(f => !f.page_context));
  });

  it('חוזה Worker — serializeTypesetResult מעביר stageSnapshots', () => {
    const ser = serializeTypesetResult(runOn);
    assertEq(ser.schema, 'ui-result-v1');
    assert(ser.stageSnapshots && ser.stageSnapshots.checkpoints.length === 4, 'הועבר בסריאליזציה');
    const runOff = typeset(TEXT, getDefaultSettings(), { noRecommendations: true });
    const serOff = serializeTypesetResult(runOff);
    assertEq(serOff.stageSnapshots, null, 'כבוי ⇒ null עובר את הגבול');
  });

  it('כבוי בברירת המחדל ברישום ההגדרות (opt-in אמיתי)', () => {
    const d = getDefaultSettings();
    assertEq(d['audit-stage-snapshots'], false);
    assertEq(STAGE_TO_CP['render'], 3);
    assertEq(STAGE_TO_CP['page-plan'], 0);
    assertEq(STAGE_TO_CP['decorations'], 2);
  });
});

report('stage-snapshots');
