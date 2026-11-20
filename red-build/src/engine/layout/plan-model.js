// src/engine/layout/plan-model.js — חוזים פורמליים: ColumnModel + PagePlan (שלב 5 פרוסה 2, §2.5 בביקורת)
'use strict';

/**
 * **מעמד:** חוזה התכנון הפורמלי של עמודי הזרימה — ColumnModel ו-PagePlan.
 * עד כאן עבד ה-Planner עם אובייקטים חופשיים בעלי שדות מקריים (page.columns
 * כמערכי מערכים + שדות נלווים); מעתה כל עמוד זרימה נושא `page.plan` — חוזה
 * מוגדר-סכמה, מאומת וקפוא בסוף התכנון.
 *
 * עקרונות:
 *  - **אין מודל מקביל:** ה-descriptor מחזיק הפניות חיות (`lines` הוא המערך
 *    שב-`page.columns[i]` עצמו — לא עותק). PageModel העתידי (שלב 7) ייבנה
 *    מה-PagePlan ולא לצידו; PagePlan הוא חוזה תכנון, לא מודל ציור.
 *  - **מקורות הסמכות נשארים אחדים:** הקיבולת נגזרת מ-colCapacityOf, הגובה
 *    התפוס מ-planningUsedHeight (column-flow), הפערים מהחותמות gapBeforePx
 *    על השורות. ה-descriptor מחשב מהם ואינו מחזיק נוסחאות משלו.
 *  - **validation:** אינווריאנטים מבניים (סדר קריאה RTL, מונוטוניות seq,
 *    שימור LineModel, חוקיות חותמות פער, קיבולת או דיווח חריגה). הפרה
 *    קשה — נרשמת ל-ledger (page-plan-invalid) ומופיעה ב-plan.diagnostics;
 *    לא מוסתרת ולא מפילה את ההפקה.
 *  - **immutability:** לאחר השלמת התכנון (סוף ה-pipeline — אחרי כל מעברי
 *    השורות, השערים, ה-TOC, ההערות והעיטורים) המבנה קופא: plan, מערכי
 *    הטורים, רשומות השורה, המרזב והערות הצד. צרכן שזקוק לשינוי — מריץ
 *    תכנון מחדש; אין mutation מאוחר במקרין (§7.1-12 של התוכנית).
 */

const { colCapacityOf, capacityReservationsOf, planningUsedHeight, blockGapPx } = require('./column-flow');
const { CAPACITY_EPS, GAP_HEAD_POLICY } = require('./constraint-matrix');

const PAGE_PLAN_SCHEMA = 'page-plan-v1';

/** האם העמוד הוא עמוד זרימה שתוכנן ב-Planner היחיד (dp-planner). */
function isFlowPage(page) {
  return Boolean(page && page.dpPlanned === true && page.template && Array.isArray(page.columns));
}

/**
 * ColumnModel — חוזה הטור עבור עמוד זרימה אחד. מחושב, לא מאוחסן: כל
 * שדה נגזר בזמן ההפקה ממקור הסמכות שלו.
 * @param {object} page - עמוד DP
 * @param {number} ci - אינדקס הטור
 * @param {object} ctx - { lineH } (לחישוב פער צפוי באימות)
 */
function buildColumnModel(page, ci, ctx) {
  const tpl = page.template;
  const geo = tpl.columns[ci] || { x: 0, w: 0 };
  const spanH = page.spanning && page.spanning.heightPx ? page.spanning.heightPx : 0;
  const col = page.columns[ci] || [];
  const isLast = ci === page.columns.length - 1;
  let gapsPx = 0;
  let overflow = null;
  for (const ln of col) gapsPx += ln.gapBeforePx || 0;
  const usedPx = planningUsedHeight(col, page);
  // **U-8 (19.11):** capPx מודע-תקציב-הערות לכל טור — כמו המרזב המוקרן
  // (רוחב תיבת-התוכן כולה); usedPx = שורות בלבד. בעבר התקציב נכלל רק
  // ב-usedPx של הטור האחרון — הטור הימני חדר למרזב וגלאי החריגה היה עיוור לו.
  const capPx = colCapacityOf(page, { colIndex: ci });
  if (usedPx > capPx + CAPACITY_EPS) {
    overflow = { usedPx: Math.round(usedPx * 100) / 100, capPx: Math.round(capPx * 100) / 100, by: Math.round((usedPx - capPx) * 100) / 100 };
  }
  return {
    kind: 'ColumnModel',
    index: ci,
    readOrder: ci, // RTL: col0 = הטור הימני, נקרא ראשון (מאומת מול גיאומטריית התבנית)
    geometry: { x: geo.x, y: tpl.contentBox.top + spanH, w: geo.w, height: Math.max(0, capPx) },
    capacityPx: capPx,
    lines: col, // הפניה חיה — לא עותק; LineModel המלא על כל שורה (ln.lineModel)
    lineCount: col.length,
    gapsPx,
    noteBudgetPx: isLast ? (page.fnReservedHeightPx || 0) : 0, // התקציב נרשם על הטור האחרון (F-17)
    reservedPx: 0, // שמורות last-column (ריהוט שלב 6) — דרך page.reservations
    usedHeightPx: usedPx,
    overflow,
    placementReasons: [] // מאוכלס מה-trace כשמופעל (finalizePagePlans)
  };
}

/**
 * PagePlan — חוזה התכנון של עמוד זרימה אחד.
 * @param {object} page - עמוד DP
 * @param {object} opts - { lineH, traceEntries } — traceEntries: רשומות ה-trace של העמוד (או null)
 */
function buildPagePlan(page, opts = {}) {
  const columns = page.columns.map((_, ci) => buildColumnModel(page, ci, opts));
  const tr = opts.traceEntries;
  return {
    kind: 'PagePlan',
    schema: PAGE_PLAN_SCHEMA,
    page: {
      index: page.index,
      type: page.type,
      isRecto: page.isRecto !== false && (page.index % 2 === 0),
      chapterOpening: Boolean(page.chapterOpening),
      terminalResidual: Boolean(page.terminalResidual)
    },
    template: page.template, // גאומטריית העמוד — מקור יחיד (page-templates)
    columns, // בסדר קריאה מוגדר (RTL: ימני ראשון — מאומת)
    spanning: page.spanning
      ? { heightPx: page.spanning.heightPx, lineCount: page.spanning.lines.length, customStyle: page.spanning.customStyle ? page.spanning.customStyle.id : null }
      : null,
    reservations: capacityReservationsOf(page), // §2.6 — כל אזור שמקטין את שטח הגוף, מיוצג
    transitions: {
      pageType: page.type,
      chapterOpening: Boolean(page.chapterOpening),
      openedBy: page.openedBy || null
    },
    notes: {
      footnotes: page.footnotes.length,
      reservedPx: page.fnReservedHeightPx || 0,
      sideNotes: (page.sideNotes || []).length
    },
    gapPolicy: GAP_HEAD_POLICY,
    trace: tr
      ? { entries: tr.length, kinds: [...new Set(tr.map(e => e.k))].sort() }
      : { entries: 0, kinds: [], note: 'trace disabled (opt-in via env.plannerTrace)' },
    diagnostics: [] // validatePagePlan מאכלס
  };
}

/**
 * אימות אינווריאנטים של חוזה העמוד. מחזיר רשימת אבחונים (ריקה = תקין).
 * כל אבחון: { code, col?, detail } — קוד קבוע, נתונים עגולים.
 * @param {object} page - עמוד DP (עם plan שכבר נבנה)
 * @param {object} opts - { lineH, settings }
 */
function validatePagePlan(page, opts = {}) {
  const out = [];
  const plan = page.plan;
  const tpl = page.template;
  const push = (code, detail, col) => out.push({ code, ...(col != null ? { col } : {}), detail });

  // (1) סדר קריאה RTL מבני: col0 הוא הטור הימני (גדול ב-x), ואחריו שמאלי.
  if (tpl.columns.length === 2) {
    if (!(tpl.columns[0].x > tpl.columns[1].x)) {
      push('rtl-column-order', `template col0.x=${tpl.columns[0].x} ≤ col1.x=${tpl.columns[1].x} — ימני חייב להיקרא ראשון`);
    }
  }
  for (let ci = 0; ci < plan.columns.length; ci++) {
    if (plan.columns[ci].readOrder !== ci) push('read-order-index', `col ${ci}: readOrder=${plan.columns[ci].readOrder}`);
  }

  // (2) מונוטוניות seq לאורך סדר הקריאה (סדר הצבה = סדר מסמך; P0-3).
  let prevSeq = -1;
  for (const col of page.columns) {
    for (const ln of col) {
      if (ln.seq == null) continue;
      if (ln.seq <= prevSeq) push('seq-not-monotonic', `seq ${ln.seq} ≤ ${prevSeq} בסדר הקריאה`);
      prevSeq = ln.seq;
    }
  }

  // (3) שימור LineModel + גבהים תקינים + חוקיות חותמות פער (FX-6).
  // **פתיחת בלוק בטור** נקבעת לפי זהות: שורה שtokenId שלה שונה מזה של
  // הקודמת לה באותו טור (meta.firstOfBlock נישא על כל שורות הקריאה ל-pushLines,
  // לא רק על הפותחת — אינו מבחין ביניהן; הזהות מבחינה).
  const expectedGap = opts.settings ? blockGapPx(opts.settings, opts.lineH || 0) : null;
  const tokOf = (ln) => ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
  for (let ci = 0; ci < page.columns.length; ci++) {
    const col = page.columns[ci];
    for (let li = 0; li < col.length; li++) {
      const ln = col[li];
      if (!(ln.heightPx > 0)) push('line-missing-height', `שורה ללא heightPx חיובי (${ln.heightPx})`, ci);
      if (!ln.lineModel && !ln.synthetic) {
        // נתיב המורשת (עד שלב 9) אינו מצרף LineModel — חריגה מתועדת, לא שקטה.
        push('line-model-missing', `שורה ללא LineModel (tokenId=${tokOf(ln)})`, ci);
      }
      const hasGap = ln.gapBeforePx != null && ln.gapBeforePx > 0;
      const isBlockStart = li > 0 && tokOf(ln) !== tokOf(col[li - 1]);
      if (li === 0 && hasGap) push('gap-at-column-head', `ראש הטור נושא פער ${ln.gapBeforePx}px — מנוגד ל-${GAP_HEAD_POLICY}`, ci);
      if (isBlockStart && expectedGap != null && expectedGap > 0 && !hasGap) {
        push('gap-missing-at-block-start', `פתיחת בלוק באמצע טור ללא חותמת פער (צפוי ${expectedGap}px)`, ci);
      }
      if (hasGap && !isBlockStart && li > 0) push('gap-on-continuation', `שורת המשך נושאת פער ${ln.gapBeforePx}px`, ci);
    }
  }

  // (4) קיבולת: חריגה מדווחת כאבחון overflow ברמת הטור (לא נעלמת).
  for (let ci = 0; ci < plan.columns.length; ci++) {
    const cm = plan.columns[ci];
    if (cm.overflow) push('column-overflow', `used ${cm.overflow.usedPx}px > cap ${cm.overflow.capPx}px (by ${cm.overflow.by}px)`, ci);
  }

  // (5) תקציב הערות: חיובי ⟺ יש הערות (מרזב לא ריק).
  if ((page.fnReservedHeightPx || 0) > 0 && page.footnotes.length === 0) {
    push('notes-budget-without-notes', `fnReservedHeightPx=${page.fnReservedHeightPx} ללא הערות`);
  }
  if (page.footnotes.length > 0 && !(page.fnReservedHeightPx > 0) && page.type !== 'endnotes') {
    push('notes-without-budget', `${page.footnotes.length} הערות ללא תקציב`);
  }

  // (6) רצף הקריאה של הפס החוצה-טורים: שורותיו נושאות seq (חלק מסדר המסמך).
  if (page.spanning && page.spanning.lines) {
    for (const ln of page.spanning.lines) {
      if (ln.seq == null) push('spanning-line-without-seq', 'שורת פס חוצה-טורים ללא seq');
    }
  }
  return out;
}

/**
 * הקפאת חוזה העמוד — immutability לאחר השלמת התכנון (§2.5):
 * ה-plan, מערכי הטורים, רשומות השורה, המרזב, הערות הצד והפס החוצה-טורים.
 * אובייקט העמוד עצמו נשאר בר-הרחבה (ריהוט שלב 6 נרשם דרך reservations
 * לפני ההקפאה; אחריה — הרצה מחדש של התכנון).
 */
function freezePagePlan(page) {
  for (const col of page.columns) {
    for (const ln of col) Object.freeze(ln);
    Object.freeze(col);
  }
  Object.freeze(page.columns); // מבנה הטורים קפוא — אין הוספת/הסרת/הזזת שורות
  if (page.spanning) {
    for (const ln of page.spanning.lines) Object.freeze(ln);
    Object.freeze(page.spanning.lines);
    Object.freeze(page.spanning);
  }
  for (const n of page.footnotes) Object.freeze(n);
  Object.freeze(page.footnotes);
  for (const sn of (page.sideNotes || [])) Object.freeze(sn);
  if (page.sideNotes) Object.freeze(page.sideNotes);
  for (const cm of page.plan.columns) Object.freeze(cm.geometry);
  for (const cm of page.plan.columns) Object.freeze(cm);
  Object.freeze(page.plan.reservations);
  Object.freeze(page.plan);
}

/**
 * **הפקת החוזים לכל עמודי התוצר** — נקודת הכניסה של ה-pipeline (סוף הזרימה,
 * לפני ההחזרה): בונה, מאמת, מקפיא. עמודים מבניים (שערים/TOC/הערות-סיום/
 * מותאמים) מקבלים חוזה מינימלי מוקלד — הם נבנים על ידי בונים ייעודיים
 * ויאוחדו תחת אותו חוזה בשלב 6.
 * @param {Array} pages - עמודי התוצר
 * @param {{settings?:object, lineH?:number, ledger?:object, eventLog?:object, trace?:object}} [opts]
 * @returns {{plans:number, flowPages:number, structuralPages:number, diagnostics:number, frozen:boolean}}
 */
function finalizePagePlans(pages, opts = {}) {
  const ledger = opts.ledger || null;
  const trace = opts.trace || null;
  const byPage = new Map();
  if (trace && trace.enabled) {
    for (const e of trace.toJSON().entries) {
      if (e.p == null) continue;
      if (!byPage.has(e.p)) byPage.set(e.p, []);
      byPage.get(e.p).push(e);
    }
  }
  let flowPages = 0, structuralPages = 0, diagnostics = 0;
  for (const page of pages) {
    if (!isFlowPage(page)) {
      structuralPages++;
      page.plan = Object.freeze({ kind: 'PagePlan', schema: PAGE_PLAN_SCHEMA, structural: true, pageType: page.type || 'unknown' });
      continue;
    }
    flowPages++;
    page.plan = buildPagePlan(page, {
      lineH: opts.lineH,
      traceEntries: byPage.get(page.index) || null
    });
    const diags = validatePagePlan(page, { settings: opts.settings, lineH: opts.lineH });
    page.plan.diagnostics = diags;
    diagnostics += diags.length;
    for (const d of diags) {
      if (ledger) {
        const rec = ledger.create('page-plan-invalid', `p${page.index}:${d.code}`, page.index, d, 'page-plan');
        ledger.transition(rec.issue_id, 'persists', 'page-plan', `plan contract diagnostic: ${d.code}`);
      }
    }
    // סיבות הצבה קומפקטיות מה-trace (כשמופעל) — על הטור שאליו השתייכו.
    const tr = byPage.get(page.index) || [];
    for (const cm of page.plan.columns) {
      cm.placementReasons = tr.filter(e => e.k === 'block-place' && e.d && e.d.col === cm.index)
        .map(e => ({ token: e.d.token, stackPx: e.d.stackPx, gapPx: e.d.gapPx || 0 }));
    }
    if (opts.freeze !== false) freezePagePlan(page);
  }
  return {
    plans: flowPages + structuralPages,
    flowPages,
    structuralPages,
    diagnostics,
    frozen: opts.freeze !== false
  };
}

module.exports = {
  PAGE_PLAN_SCHEMA,
  isFlowPage,
  buildColumnModel,
  buildPagePlan,
  validatePagePlan,
  freezePagePlan,
  finalizePagePlans
};
