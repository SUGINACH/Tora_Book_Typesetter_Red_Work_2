// src/audit/stage-snapshots.js — צילומי-מצב של מודל הפריסה בנקודות הביקורת (S1-ח, gap-Gold-V21)
'use strict';

/**
 * **רקע (משימת הפתיחה של סוכן 2, תוכנית האב §2.2/§מקבץ C):**
 * השלמת יכולת snapshot/diff בסגנון step-by-step-audit של Gold V21
 * (‏`work_doc/step-by-step-audit-Method.md`), מותאמת לארכיטקטורת RED —
 * מודל מחושב חד-כיווני, לא DOM מתחלף:
 *
 *  | Gold V21 (DOM)                    | RED (מודל מחושב)                       |
 *  |-----------------------------------|----------------------------------------|
 *  | collectPageSignatures             | חתימת שורה יציבה: tokenId#lineIdx      |
 *  | computeDelta (added/removed/changed) | diffSnapshots — זהה מבחינה סמנטית   |
 *  | pageMetrics (bodyFlow/pageCount)  | pageCount + lineCount + סוגי עמודים   |
 *  | pageElements בעמוד הממצא          | findingsContext (§2.4) — רכיבים אחרים  |
 *  | 7 קטגוריות סיבתיות                | goldCausalityOf — מיפוי מלא מ-10 מצבים |
 *
 * **נקודות הלכידה** (מוגדרות ב-pipeline.js, לכל אחת stage מתועד):
 *  cp3-dp          — אחרי planPages (DP+הגנות+נסיגה; לפני שערים/TOC)
 *  cp3-structural  — אחרי שערים+AQ+TOC (בסיס הוכחת הניטרליות של CP4)
 *  cp4-decorations — אחרי פאס העיטורים (הערות צד/עיטורים/עמודי הערות)
 *  cp5-final       — המצב הסופי שממנו נגזר layoutHash
 *
 * **אינווריאנטים (תוכנית האב §2.5):**
 *  - טהור: קריאה בלבד מהמודל — אין כתיבה; המכשור אינו יכול לשנות פריסה
 *    (‏no-op proof בבדיקה: hash זהה עם ובלי המנגנון).
 *  - דטרמיניסטי: אין Date.now/אקראיות; סדר איטרציה קבוע; שני ריצות זהות
 *    מפיקות אובייקט זהה ביטים.
 *  - immutable: ה-snapshots נבנים כעצמים חדשים; המודל וה-ledger אינם
 *    מוטצים על-ידי המנגנון.
 *  - opt-in: פעיל רק כש-settings['audit-stage-snapshots']=true (ברירת
 *    מחדל כבויה — אפס תקורה בריצה רגילה).
 *  - נפח: התוצאה נושאת את ה-deltas וההקשרים בלבד (לא צילומים מלאים
 *    של הספר) — המודל המלא ניתן לשחזור דטרמיניסטי ממילא.
 */

/** שלב ← מדד נקודת הביקורת שבה/אחריה נלכד השלב (לא מוכר = מוקדם ⇒ 0). */
const STAGE_TO_CP = {
  parse: 0, 'scope-map': 0, 'style-prepass': 0, 'fonts-ready': 0, measure: 0,
  'line-plan': 0, 'page-plan': 0, protections: 0, balance: 0, justify: 0,
  'notes-budget': 0, refit: 0, 'candidate-gen': 0,
  toc: 1,
  decorations: 2,
  headers: 3, folio: 3, 'ledger-finalize': 3, render: 3
};

/** שורות העמוד לפי סדר הקריאה — הפס החוצה-טורים ואז הטורים (FWD-1). */
function pageLinesOf(pg) {
  const out = [];
  if (pg.spanning && pg.spanning.lines) out.push(...pg.spanning.lines);
  for (const col of (pg.columns || [])) out.push(...col);
  return out;
}

/** מזהה יציב של שורה: tokenId#lineIdx (או seq/תוכן כגיבוי) — עוגן לוגי
 *  חוצה-checkpoints, מקביל ל-data-token-id ב-Gold. */
function lineKeyOf(ln, counter) {
  const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId != null ? ln.meta.tokenId : 'x');
  const li = ln.meta && ln.meta.lineIdx != null ? ln.meta.lineIdx : (ln.seq != null ? `s${ln.seq}` : null);
  let key = li != null ? `${tok}#${li}` : `${tok}|${(ln.words || []).join('§')}`;
  if (counter) {
    let n = counter.get(key) || 0;
    counter.set(key, n + 1);
    if (n > 0) key = `${key}~${n + 1}`; // התנגשות נדירה בתוך אותו צילום — סיומת דטרמיניסטית
  }
  return key;
}

/**
 * לכידת צילום-מצב קומפקטי של מודל העמודים.
 * @returns {{checkpoint:string, pageCount:number, lineCount:number, pages:Array, lines:Object}}
 *   pages: לכל עמוד {i,type,fn} (‏fn = סמני הערות); lines: key → {p,c,k,w}
 *   (עמוד, טור, kind, מספר מילים) — מיקום+תוכן במינימום נפח.
 */
function takeSnapshot(pages, checkpoint, stage) {
  const counter = new Map();
  const lines = {};
  const pageMeta = [];
  let lineCount = 0;
  for (const pg of (pages || [])) {
    const i = pg.index != null ? pg.index : pageMeta.length;
    pageMeta.push({
      i, t: pg.type || 'regular',
      fn: (pg.footnotes || []).map(n => n.marker || '').filter(Boolean)
    });
    if (pg.spanning && pg.spanning.lines) {
      for (const ln of pg.spanning.lines) {
        lines[lineKeyOf(ln, counter)] = { p: i, c: -1, k: ln.kind || 'spanning', w: (ln.words || []).length };
        lineCount++;
      }
    }
    const cols = pg.columns || [];
    for (let c = 0; c < cols.length; c++) {
      for (const ln of cols[c]) {
        lines[lineKeyOf(ln, counter)] = { p: i, c, k: ln.kind || 'line', w: (ln.words || []).length };
        lineCount++;
      }
    }
  }
  return { checkpoint, stage, pageCount: pageMeta.length, lineCount, pages: pageMeta, lines };
}

/**
 * delta בין שני צילומים רצופים (מקביל computeDelta ב-Gold):
 * added (חדשות), removed (נעלמו), changed (מיקום/טור/תוכן השתנו).
 * מפתח לפי עמוד היעד של הרשומה (after) וגם עמוד המקור (before) — כך
 * המשתמש רואה גם "מאיפה זה בא" וגם "לאן זה הלך".
 */
function diffSnapshots(prev, curr) {
  const byPage = {};
  const touch = (page, entry) => {
    const key = String(page);
    (byPage[key] = byPage[key] || { added: [], removed: [], changed: [] });
    byPage[key][entry.op].push(entry);
  };
  const prevKeys = new Set(Object.keys(prev.lines));
  const currKeys = new Set(Object.keys(curr.lines));
  let added = 0, removed = 0, changed = 0;
  for (const key of currKeys) {
    if (!prevKeys.has(key)) {
      const a = { op: 'added', key, before: null, after: curr.lines[key] };
      touch(curr.lines[key].p, a); added++;
    } else {
      const b = prev.lines[key], a = curr.lines[key];
      if (b.p !== a.p || b.c !== a.c || b.k !== a.k || b.w !== a.w) {
        const ch = { op: 'changed', key, before: b, after: a };
        touch(a.p, ch); if (b.p !== a.p) touch(b.p, ch);
        changed++;
      }
    }
  }
  for (const key of prevKeys) {
    if (!currKeys.has(key)) {
      const r = { op: 'removed', key, before: prev.lines[key], after: null };
      touch(prev.lines[key].p, r); removed++;
    }
  }
  return {
    from: prev.checkpoint, to: curr.checkpoint,
    fromPageCount: prev.pageCount, toPageCount: curr.pageCount,
    totals: { added, removed, changed },
    pages: byPage
  };
}

/**
 * §2.4 בתוכנית האב — הקשר-עמוד לכל ממצא: מצבם של הרכיבים ה**אחרים** בעמוד
 * שנוספו/הוסרו/שינו מיקום מנקודת הביקורת שבה נראה הממצא לראשונה ועד הסוף.
 * הממצא עצמו (שורות הטוקן שלו) מוחרג — ההקשר הוא הסביבה, לא הממצא.
 * הערת ייחוס: מדדי העמודים ב-delta הם של הצילום שבו נמדדו (לפני/אחרי
 * הזזות מבניות); רשומה נכנסת אם היא נוגעת בעמוד הממצא בצילום כלשהו מאז הופעתו.
 */
function buildFindingsContext(ledger, deltas, opts = {}) {
  const maxPerFinding = opts.maxPerFinding || 24;
  const ctx = {};
  for (const rec of ledger.issues.values()) {
    if (rec.page == null) continue;
    const cpIdx = STAGE_TO_CP[rec.first_seen_stage] != null ? STAGE_TO_CP[rec.first_seen_stage] : 0;
    const targetTok = String(rec.target || '');
    const others = [];
    for (let k = cpIdx; k < deltas.length && others.length < maxPerFinding; k++) {
      const d = deltas[k];
      for (const [pageIdx, ops] of Object.entries(d.pages)) {
        if (Number(pageIdx) !== rec.page) continue;
        for (const op of ['added', 'removed', 'changed']) {
          for (const e of ops[op]) {
            // הממצא עצמו — שורות הטוקן של היעד — מוחרג מההקשר
            if (targetTok && e.key.startsWith(targetTok + '#')) continue;
            others.push({ from: d.from, to: d.to, op: e.op, key: e.key, before: e.before, after: e.after });
            if (others.length >= maxPerFinding) break;
          }
          if (others.length >= maxPerFinding) break;
        }
        if (others.length >= maxPerFinding) break;
      }
    }
    ctx[rec.issue_id] = {
      page: rec.page,
      since_checkpoint: cpIdx,
      first_seen_stage: rec.first_seen_stage,
      others_changed: others,
      truncated: others.length >= maxPerFinding
    };
  }
  return ctx;
}

/**
 * §2.3 בתוכנית האב — מיפוי מלא של 10 מצבי החיים של RED אל 7 קטגוריות הסיבתיות
 * של Gold V21 (§4 ב-step-by-step-audit-Method.md). פונקציה טהורה — ללא ריצה.
 *
 *  RED (ledger-v2)                → Gold V21
 *  ---------------------------------------------------------------
 *  correction-reverted            → correction-reverted
 *  reintroduced                   → correction-reverted (נתקן וחזר)
 *  competing-repair-side-effect   → correction-reverted (ריפוי התנגש בריפוי
 *                                   אחר — תיקון בוטל ע"י תיקון אחר)
 *  resolved (סופי)                → fixed-by-stage
 *  became-observable-later        → couldnt-appear-before
 *  created + העמוד לא היה קיים    → couldnt-appear-before
 *  created בצילום הראשון          → created-at-first-checkpoint
 *  created מאוחר (העמוד קיים)     → created-by-stage
 *  correction-blocked             → לפי מקור היצירה (created-*) — חסימת
 *                                   התיקון אינה משנה את מועד היצירה
 *                                   (המידע על החסימה נשאר במצבי RED)
 *  unresolved / not-comparable    → unresolved
 *  never-appeared (Gold)          → לא מצב ריצה ב-RED — מכוסה ב-negative
 *                                   controls (audit-sensitivity מוכיח גילוי)
 */
function goldCausalityOf(rec, checkpointsMeta) {
  const states = rec.transitions.map(t => t.state);
  if (states.includes('correction-reverted') || states.includes('reintroduced') ||
      states.includes('competing-repair-side-effect')) return 'correction-reverted';
  if (rec.status === 'resolved') return 'fixed-by-stage';
  if (rec.status === 'unresolved' || rec.status === 'not-comparable') return 'unresolved';
  if (states.includes('became-observable-later')) return 'couldnt-appear-before';
  const first = rec.transitions[0];
  const cpIdx = first && STAGE_TO_CP[first.stage] != null ? STAGE_TO_CP[first.stage] : 0;
  if (checkpointsMeta && checkpointsMeta.length && rec.page != null && cpIdx > 0) {
    const prev = checkpointsMeta[cpIdx - 1];
    if (prev && rec.page >= prev.pageCount) return 'couldnt-appear-before'; // העמוד לא היה קיים עדיין
  }
  if (cpIdx === 0) return 'created-at-first-checkpoint';
  return 'created-by-stage';
}

/**
 * עוקב לכידות לאורך ה-pipeline. העצם אינו נוגע במודל — ה-pipeline מזרים לו
 * את מצב העמודים בכל נקודת ביקורת והוא בונה את האבחון הסופי.
 */
function createSnapshotTracker() {
  const snapshots = [];
  return {
    capture(pages, checkpoint, stage) {
      snapshots.push(takeSnapshot(pages, checkpoint, stage));
      return snapshots[snapshots.length - 1];
    },
    /** האסוף הסופי: מטא-נתונים, deltas, הקשר-עמוד לממצאים וסיכום סיבתי Gold. */
    finalize(ledger) {
      if (!snapshots.length) return null;
      const deltas = [];
      for (let i = 1; i < snapshots.length; i++) deltas.push(diffSnapshots(snapshots[i - 1], snapshots[i]));
      const checkpoints = snapshots.map(s => ({
        checkpoint: s.checkpoint, stage: s.stage,
        pageCount: s.pageCount, lineCount: s.lineCount
      }));
      const findingsContext = ledger ? buildFindingsContext(ledger, deltas) : {};
      const goldSummary = {};
      if (ledger) {
        for (const rec of ledger.issues.values()) {
          const g = goldCausalityOf(rec, checkpoints);
          goldSummary[g] = (goldSummary[g] || 0) + 1;
        }
      }
      // אינווריאנט נוסף שנגזר חינם: יציבות השורות בין הצילום האחרון לפני הסוף
      // לבין הסופי — גרסה פר-שורה של הוכחת bodyGeometryHash (D-47).
      const last = deltas[deltas.length - 1];
      const finalStable = last
        ? last.totals.added === 0 && last.totals.removed === 0 && last.totals.changed === 0
        : true;
      return {
        schema: 'stage-snapshots-v1',
        checkpoints, deltas, findingsContext,
        gold_causality: { summary: goldSummary },
        final_stable: finalStable
      };
    }
  };
}

module.exports = {
  STAGE_TO_CP,
  pageLinesOf,
  lineKeyOf,
  takeSnapshot,
  diffSnapshots,
  buildFindingsContext,
  goldCausalityOf,
  createSnapshotTracker
};
