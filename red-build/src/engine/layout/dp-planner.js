// src/engine/layout/dp-planner.js — Multi-column/page DP planner (REQ-BAL-01/02/04/08/10)
'use strict';

const crypto = require('crypto');
// **חוזה H3 (D-S2H3/CSS parity):** ריפודי פס כותרת 3 ממקור יחיד —
// אותו חוזה כמו המנוע המורשת (legacy-imud-flow) ומדידת ה-pipeline.
const { H3_TOP_PAD_PX, H3_BOTTOM_PAD_PX, H3_MARGIN_BOTTOM_PX, h3BandHeightPx } = require('../core/h3-contract');
const { PAGE_TYPES, buildPageTemplate } = require('./page-templates');
const { Ledger } = require('../core/ledger');
const { runProtections } = require('./protections-matrix');
const { runRetreatLoop } = require('./retreat-loop');
const { generateCandidates } = require('./candidate-generator');
const { blockGapPx, colCapacityOf, planningUsedHeight, normalizeColumnGaps } = require('./column-flow'); // **שלב 5:** planningUsedHeight — מקור יחיד לגובה התפוס בזמן תכנון (חילוץ מ-#16); **פרוסה 2:** normalizeColumnGaps — נרמול פערים אחרי פיצול מחדש
const { fixDropWordInColumns } = require('../typography/protectors');
const { MARK_TAG } = require('../notes/markers'); // markerFragmentOf אינו נדרש כאן — הזיהוי לפי MARK_TAG ישירות (תבנית D-53)
const { moveLineForward } = require('./ordering');
const { optimalSplit } = require('./balancing'); // **EXT-8:** חלוקה גלובלית אופטימלית
const { getFootnotesReservedHeight, noteHeight, noteMetrics, stampNoteMetrics } = require('./footnote-budget'); // **שלב 5:** noteMetrics — מקור יחיד למדדי ההערה (חילוץ מ-#16); **פרוסה 2:** stampNoteMetrics — מדידה אחת ביצירה
const { stampNote, makeNoteRecord, NOTE_KINDS } = require('./notes-model'); // **שלב 6 פרוסה 2:** מודל ההערות המאוחד — זהות/עוגן + חותמת הערות-צד ביצירה
const CM = require('./constraint-matrix'); // **שלב 5:** מטריצת האילוצים המאוחדת (חילוץ שורש מ-#16/#17)
const { createTraceRecorder } = require('./decision-trace'); // **פרוסה 2 (§2.7):** תיעוד החלטות דטרמיניסטי קומפקטי

/** חתימת פריסה דטרמיניסטית — ללא Date/random (REQ-GOV determinism).
 * תיקון S7-E2E: tokenId נמצא ב‑meta של pushLines (לא על השורה עצמה) — יש לחלץ משם,
 * אחרת hash/TOC מאבדים את מזהה הטוקן (באג V23: headingsForToc ריק). */
function lineTokenId(ln) {
  if (ln.tokenId != null) return ln.tokenId;
  if (ln.meta && ln.meta.tokenId != null) return ln.meta.tokenId;
  return '';
}

/**
 * **תיקון S8 (טור פנטום):** יישור מערך הטורים לאורך התבנית אחרי המרת סוג עמוד.
 * שומר על תוכן קיים בעמודות שנותרו; תורם עודפים (בלי תבנית) מוחזרים —
 * לא אמור לקרות (ההמרה מתבצעת בעמוד ריק/חדש), ואם קרה — נסיגה בטוחה.
 */
function reAlignColumns(page) {
  const n = page.template.columns.length;
  const old = page.columns || [];
  const next = Array.from({ length: n }, (_, i) => (old[i] ? old[i].slice() : []));
  let orphaned = 0;
  for (let i = n; i < old.length; i++) orphaned += old[i].length;
  if (orphaned > 0 && old[n - 1]) {
    // שורות בטור פנטום — מוחזרות לטור האחרון החוקי (BRZ-15: אין גניזה)
    next[n - 1].push(...old.slice(n).flat());
  }
  page.columns = next;
  return orphaned;
}

function layoutHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}`)),
    // **S4.10:** דפנסיביות — עמודי מנוע המורשת אינם מחויבים לכל השדות
    // (לפני כן p.sideNotes.length קרס על undefined). לעמודי DP אין שינוי ערך.
    fn: (p.footnotes || []).length, sn: (p.sideNotes || []).length
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **D-47 (תיקון P0-6):** hash של **הגיאומטריה הנמדדת בלבד** (הטורים/השורות) —
 * זהו האינווריאנט T1: פאס העיטורים/ההערות אסור לו לשנות את הפריסה שנמדדה.
 * בעבר ההשוואה CP4==CP5 השוותה משתנה לעצמו — טאוטולוגיה שאינה יכולה להיכשל.
 * כאן: hash נפרד של הטורים בלבד (בלי מרזבים/הערות צד שמשתנים כחוק בשלב ההערות)
 * — נבדק לפני ואחרי פאס העיטורים בpipeline; שינוי אמיתי בשורות ⇒ הבדיקה נכשלת.
 */
function bodyGeometryHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}:${ln.seq != null ? 's' + ln.seq : ''}`))
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **תיקון P0-3 (שבירת סדר קריאה):** איזון חוקי מזיז שורות **קדימה בסדר הקריאה
 * בלבד** — הזזת גבול הטורים קדימה/אחורה תוך שמירת סדר המילים:
 *  - טור מוקדם (col0, נקרא ראשון) גבוה יותר ⇒ pop מסופו → unshift לראש col1 (קדימה).
 *  - טור מאוחר (col1, נקרא שני) גבוה יותר ⇒ shift מראשו → push לסוף col0 (הזזת הגבול
 *    אחורה — שומר סדר: השורה עדיין אחרי כל col0 ולפני שאר col1).
 * בעבר: pop מהטור המאוחר + unshift לראש הטור המוקדם — הציג את סוף פסקה לפני
 * תחילתה (רגרסיה חדשה שלא הייתה באף גרסה קודמת). כל השורות מתויגות seq
 * (סדר הצבה = סדר מסמך) ו‑protections-matrix מפיק reading-order-break אם
 * איזון עתידי יפר זאת — הבאג נעול לצמיתות בבדיקת רגרסיה.
 */

/**
 * Block = יחידת פריסה: heading או paragraph עם שורות שנמדדו.
 * @param {Array} blocks - [{kind:'heading'|'paragraph', lines:[...], notes:[...], token}]
 * @param {object} settings
 * @param {{measure:(t:string,s?:number)=>number}} env - חייב להכיל measure (entry יחיד — L1); אחרת throw (ללא קריסה שקטה)
 */
function planPages(blocks, settings, eventLog, ledger = new Ledger(), env = {}) {
  const measureFn = env && typeof env.measure === 'function' ? env.measure : null;
  if (!measureFn) {
    throw new Error('dp-planner: env.measure is required (single measurement entry — REQ-LB-01). Silent fallback to global is forbidden.');
  }
  // **פרוסה 2 (§2.7):** רשם ה-trace — opt-in (env.trace חיצוני או settings.
  // _plannerTrace); כבוי בברירת המחדל (קומפקטיות זיכרון). הספירות נשמרות
  // תמיד. המתכנן עצמו כבר אינו מודד — measureFn משמש רק להטבעה חד-פעמית
  // של הערות שלא נמדדו במקורן (CP2 אמור לחתום את כולן; בדיקת הטוהר מוכיחה 0).
  const trace = (env && env.trace) || createTraceRecorder({ enabled: settings['_plannerTrace'] === true });
  // **S10 (REQ-UI-03):** מזליף התקדמות מה‑DP — מכשור בלבד (no-op proof בבדיקה).
  // הערכת מספר העמודים: סכום גבהים נמדדים / קיבולת עמוד רגיל — מעודכנת בזמן אמת.
  const onProgress = env && typeof env.onProgress === 'function' ? env.onProgress : null;
  const estCapacity = (() => {
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    return Math.max(1, tpl.contentBox.height * Math.max(1, tpl.columns.length));
  })();
  const blockHeight = (b) => (b.lines || []).reduce((s, l) => s + (l.heightPx || 0), 0);
  const totalHeight = blocks.reduce((s, b) => s + blockHeight(b), 0);
  const estimatedPages = Math.max(1, Math.ceil(totalHeight / estCapacity));
  const pages = [];
  let pageIdx = 0;
  let seqCounter = 0; // סדר הצבה — סדר קריאה (תיקון P0-3)
  const lineH = Math.round(settings['body-font-size-pt'] * (96 / 72) * settings['body-line-height']);
  const imbMax = settings['imbalance-max-delta-px'];

  // **FX-1 (דוח 06, שלב 5 — חילוץ שורש מ-#17):** נעילת ליווי — הטור שאומת
  // למחסנית כותרת+ליווי הוא startCol של ההצבה עד השלמת שורות הליווי;
  // נאפס בכל עמוד חדש.
  let escortLockCol = 0;
  let escortLinesNeeded = 0;
  // **שלב 5 (אילוץ קשה — סדר קריאה מבני):** מונוטוניות טורים לאורך הזרימה —
  // אחרי ששורה כלשהי הוצבה בטור c, שורות המשך באותו עמוד אינן רשאיות לחזור
  // לטור מוקדם ממנו (הקריאה עוברת col0 מלמעלה למטה ואז col1). בלי זה, המילוי
  // החמדני של pushLines יכול להכניס שורה מאוחרת לסוף col0 אחרי שהזרימה כבר
  // עברה ל-col1 (נמדד: 49 הפרות reading-order ב-very_long לאחר FX-5 — האריזה
  // הצפופה חשפה את הפגם שהיה קיים אך נדיר). תיקון השורש: האילוץ חי בהצבה
  // עצמה, לא בגילוי לאחר המעשה (protections).
  let flowCol = 0;

  function newPage(type = PAGE_TYPES.REGULAR) {
    escortLockCol = 0;
    escortLinesNeeded = 0;
    flowCol = 0;
    const isRecto = pages.length % 2 === 0; // עמוד 1 = recto
    const tpl = buildPageTemplate(type, settings, isRecto);
    // **פרוסה 2 (§2.5):** dpPlanned — סימון עמוד הזרימה לחוזה ה-PagePlan
    // (finalizePagePlans ב-pipeline); openedBy — מעברי עמוד/סוג; reservations —
    // שמורות אחידות של שלב 6 (מנגנון ההרחבה של מודל הקיבולת).
    return { index: pageIdx++, type, template: tpl, columns: Array.from({ length: tpl.columns.length }, () => []), footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null, fnReservedHeightPx: 0, chapterOpening: false, dpPlanned: true, openedBy: null, reservations: [] };
  }

  let cur = newPage(PAGE_TYPES.REGULAR);

  // **FWD-1 (S8):** פס כותרת חוצה־טורים (spanning band) — כותרת שנמדדה ברוחב
  // מלא מוצבת בפס עליון חוצה־טורים במקום בטור חצי־רוחב (בעבר: נמדדה ברוחב מלא
  // והוצבה בטור רגיל ⇒ גלישה אופקית שקטה). הטורים מתחילים מתחת לפס.
  const spanH = (page) => (page && page.spanning ? page.spanning.heightPx : 0);
  // **S5.2 (P-2 — קיבולת מאוחדת):** כל חישובי הקיבולת עוברים דרך colCapacityOf
  // (column-flow — מקור יחיד). **U-8 (19.11):** קיבולת מודעת-תקציב-הערות
  // ל**כל** הטורים — כמו המרזב המוקרן (רוחב תיבת-התוכן כולה, R3-C2).
  // בעבר fnBudget:false + הוספת התקציב ל-usedHeight של הטור האחרון בלבד
  // (planningUsedHeight) ⇒ הטור הימני (RTL) מילא את הקיבולת המלאה וחדר
  // למרזב ההערות. כעת: used = שורות בלבד, cap כולל את התקציב — אותו
  // אי-שוויון (שורות ≤ cap−תקציב) לכל טור. הפס החוצה־טורים נכלל תמיד.
  const colCapacity = (tpl, page) => colCapacityOf(page) || (tpl && tpl.contentBox ? tpl.contentBox.height - spanH(page) : 0);

  /**
   * גובה תפוס = שורות בלבד (**U-8 — אמנה אחת**: התקציב חי בקיבולת, לא ב-used).
   * תיקון P1-8: חתימה (col, page) — page נשמר לתאימות צרכנים; planningUsedHeight
   * עצמו כבר אינו צורך אותו.
   */
  // **שלב 5 (חילוץ שורש מ-#16):** גובה תפוס בזמן תכנון — מקור יחיד
  // (column-flow.planningUsedHeight); סמנטיקת הרינדור (עם aqStretch) חיה
  // ב-balancing.usedHeight — שני דגלים, שני מקורות מתועדים.
  const usedHeight = (col, page = cur) => planningUsedHeight(col, page);

  /**
   * **איחוד P1-1 (מנגנום תאום):** recomputeFnBudget ממשיך כעת דרך
   * footnote-budget.getFootnotesReservedHeight — מקור יחיד. בעבר היו שני מימושים
   * מקבילים; בדיקת probe==reserved רצה על מודול שהמנוע לא השתמש בו.
   */
  function recomputeFnBudget(page) {
    if (!settings['footnotes-enabled'] || !page.footnotes.length) { page.fnReservedHeightPx = 0; return 0; }
    const reserved = getFootnotesReservedHeight(page.footnotes, settings, measureFn) // **S70:** העברת הפונקציה עצמה שומרת על סימון ה-impl (להתאמת פקטורים);
    page.fnReservedHeightPx = reserved;
    return reserved;
  }

  /**
   * **FX-5 (דוח 06, שלב 5 — חילוץ שורש מ-#17):** בדיקת קיבולת ב-yPx אמיתיים.
   * הגרסה ההיסטורית (`ensureRoom(neededLines)`) מדדה `neededLines × lineH`
   * בעוד ההצבה צורכת heightPx — פער היחידות יצר עמודים ריקים פנטום (בלוק
   * שנכנס פיזית "נכשל" בבדיקה — FX-5) ובדיקות ליווי שקרסו על כותרות גבוהות
   * מ-lineH (FX-1). המחסנית כוללת את פער הכניסה של הבלוק (CM.stackHeightPx).
   */
  function ensureRoomFor(stackPx, fromCol = 0) {
    const cap = colCapacity(cur.template, cur);
    for (let c = fromCol; c < cur.columns.length; c++) {
      if (cap - usedHeight(cur.columns[c], cur) >= stackPx - CM.CAPACITY_EPS) return c;
    }
    return -1;
  }

  /** **U-8 (ביקורת שלמות 19.11) — הכלה ברמת העמוד:** המרזב פרוש על רוחב
   *  תיבת-התוכן כולה; כשהערה מתחייבת בעמוד, **כל** טורי העמוד חייבים לעמוד
   *  מעל המרזב (used ≤ cap−תקציב). בדיקת המחסנית של שורת הסמן לבדה אינה
   *  מספיקה: הסמן עשוי להיכנס לטור פנוי בעוד טור אחר כבר מלא מעבר למרזב
   *  (נמדד: no_long ‏p58 — חדירה 44.5px; mid_long ‏26 עמודים כאלה). אם תנאי
   *  זה נכשל — העמוד נסגר בלי ההערה (הקווים שהוצבו בלעדיה עומדים בקיבולת
   *  המלאה) וההערה עוברת עם שורת הסמן לעמוד הבא — F-17 נשמר. */
  function pageFitsNoteBudget() {
    const cap = colCapacity(cur.template, cur);
    for (let c = 0; c < cur.columns.length; c++) {
      if (usedHeight(cur.columns[c], cur) > cap + CM.CAPACITY_EPS) return false;
    }
    return true;
  }

  function flushPage() {
    // איזון טורים: Δ≤5px (BRZ-3) — **EXT-8: החלוקה הגלובלית האופטימלית**
    // (פיצול רציף ממזער |lH−rH| בכפוף לקיבולת; סדר קריאה נשמר מבנית — תיקון P0-3
    // מובנה בהגדרת מרחב המצבים; הוכחת מינימליות ב-balancing.optimalSplit)
    if (cur.columns.length === 2) {
      const a0 = usedHeight(cur.columns[0], cur), b0 = usedHeight(cur.columns[1], cur);
      if (Math.abs(a0 - b0) > imbMax) {
        const cap = colCapacity(cur.template, cur);
        // **U-8:** התקציב כבר בתוך cap (לכל טור) — extraLast היה מכפיל אותו
        const best = optimalSplit(cur.columns, { cap });
        if (best && best.k !== cur.columns[0].length) {
          const seq = [...cur.columns[0], ...cur.columns[1]];
          cur.columns[0] = seq.slice(0, best.k);
          cur.columns[1] = seq.slice(best.k);
          // **FX-6 (פרוסה 2):** נרמול פערים אחרי הפיצול מחדש — ראש כל טור אינו
          // נושא פער-כניסה (אותו כלל GAP_HEAD_POLICY שבהצבה המקורית).
          normalizeColumnGaps(cur.columns[0]);
          normalizeColumnGaps(cur.columns[1]);
          trace.emit(cur.index, 'balance-resplit', { k: best.k, delta: Math.round(best.delta), clean: best.clean });
        }
      }
      // מילה נופלת בין טורים (פורטר מ‑Gold) — גם שומר סדר (המילה חוצה את הגבול קדימה)
      // **S5.2 (תיקון 2) + פרוסה 2 (מדידה חוזרת — §2.3):** המיזוג מותר רק אם
      // השורה המקבלת נכנסת ברוחב הטור — **מרוחבי ה-LineModel שכבר נמדדו**
      // (naturalWidthPx של שורת המילה הבודדת + רווח טבעי מה-glue של השורה
      // המקבלת): אפס מדידה חוזרת בתכנון; מילה שאינה נכנסת נשארת בטור המקורי
      // (בלי גלישה אופקית שקטה — מחלקת D-92).
      if (fixDropWordInColumns(cur.columns, 3, { colW: cur.template.columns[0].w })) {
        eventLog.emit('balance', 'fix-drop-word', { page: cur.index }, cur.index);
      }
      const a = usedHeight(cur.columns[0], cur), b = usedHeight(cur.columns[1], cur);
      cur.balanceInfo = { before: [a0, b0], after: [a, b] };
      eventLog.emit('balance', 'column-balance', { page: cur.index, delta: Math.abs(a - b) }, cur.index);
    }
    // Invariant BRZ-14: scrollHeight ≤ clientHeight (בכפוף לפס החוצה־טורים — FWD-1)
    for (const col of cur.columns) {
      if (usedHeight(col, cur) > colCapacity(cur.template, cur) + 0.5) {
        const rec = ledger.create('containment', `page#${cur.index}`, cur.index, { used: usedHeight(col, cur), cap: colCapacity(cur.template, cur) }, 'page-plan');
        ledger.transition(rec.issue_id, cur.type === PAGE_TYPES.FILLER ? 'not-comparable' : 'persists', 'page-plan', 'overflow after placement');
        trace.emit(cur.index, 'overflow-after-placement', { used: usedHeight(col, cur), cap: colCapacity(cur.template, cur) });
      }
    }
    trace.emit(cur.index, 'page-flush', { used: cur.columns.map(c => usedHeight(c, cur)), fn: cur.footnotes.length });
    pages.push(cur);
  }

  // **9b.3 (F-9b-1):** תור פריטי-שוליים הממתינים להצבת שורת העוגן הראשונה של
  // הפסקה המארחת שלהם — הפריט נכנס ל-sideNotes של העמוד שבו העוגן באמת מוצב
  // (לא העמוד שבו נפגש ה-H7). מנוקז ב-pushLines בהצבה הראשונה של המארחת;
  // שארית בסוף התכנון = ממצא מפורש.
  const pendingSideByHost = new Map(); // hostTokenId(String) → [rec, …]
  const hostByH7 = new Map(); // 9b.3: ownToken(H7) → hostTokenId הצפוי — לאימות העוגן
  function pushLines(lines, meta = {}, opts = {}) {
    // **FX-6 (פרוסה 2 — הפער כגיאומטריה מתוכננת):** פתיחת בלוק מתחת לתוכן
    // קיים בטור נושאת חותמת `gapBeforePx` על שורת הפתיחה — מקור יחיד שממנו
    // נגזרים גם שער הכניסה (needPx), גם usedHeight (planningUsedHeight)
    // וגם ההקרנה (DOM margin-top / PDF התקדמות-y). ראש טור/עמוד — הפער
    // מדוכא (GAP_HEAD_POLICY); בלוקים רצופים — פער בכל פתיחה. בעבר הפער
    // היה תנאי כניסה בלבד (pendingGap) ולא נצבר בשום מקום במורד הזרם.
    // **FX-1 (דוח 06, שלב 5):** startCol — הצבה מכוונת-ליווי: הטור שאומת
    // למחסנית כותרת+ליווי הוא נקודת הפתיחה. סדר הקריאה נשמר מבנית — אין
    // הצבה לטור מוקדם יותר מנקודת הפתיחה.
    const startCol = Math.max(0, Math.min(opts.startCol != null ? opts.startCol : escortLockCol, cur.columns.length - 1));
    const gap = meta.firstOfBlock ? blockGapPx(settings, lineH) : 0;
    let firstOfCall = true; // הפער שייך לשורה הראשונה של הקריאה בלבד
    let pendingFlushed = false; // 9b.3: ניקוז פריטי-שוליים ממתינים בהצבת השורה הראשונה בלבד
    const flushPendingSideFor = () => {
      if (pendingFlushed || meta.tokenId == null) return;
      const pend = pendingSideByHost.get(String(meta.tokenId));
      if (!pend) return;
      pendingSideByHost.delete(String(meta.tokenId));
      pendingFlushed = true;
      for (const rec of pend) {
        pushAnchoredMarginItem(rec); // cur = העמוד שבו שורת העוגן הראשונה הוצבה זה עתה
        trace.emit(cur.index, 'side-note-attached-to-host-page', { note: rec.ownToken, host: rec.anchorToken });
      }
    };
    for (const ln of lines) {
      let placed = false;
      // **שלב 5 (סדר קריאה מבני):** החיפוש מתחיל בטור הזרימה הנוכחי — שום
      // שורה אינה חוזרת לטור מוקדם מהזרימה (ראה flowCol לעיל).
      for (let c = Math.max(startCol, flowCol); c < cur.columns.length && !placed; c++) {
        // FX-6: החותמת — רק מתחת לתוכן קיים (דיכוי בראש טור/עמוד/אחרי פס).
        const gapHere = firstOfCall && gap > 0 && cur.columns[c].length > 0 ? gap : 0;
        const needPx = ln.heightPx + gapHere - CM.CAPACITY_EPS;
        if (colCapacity(cur.template, cur) - usedHeight(cur.columns[c], cur) >= needPx) {
          cur.columns[c].push({ ...ln, meta, seq: seqCounter++, ...(gapHere > 0 ? { gapBeforePx: gapHere } : {}) });
          firstOfCall = false;
          placed = true;
          flowCol = Math.max(flowCol, c); // מונוטוניות הזרימה
          flushPendingSideFor(); // 9b.3: העוגן החזותי הוצב — הפריט נכנס לעמוד זה
          trace.emit(cur.index, 'block-place', { token: meta.tokenId, col: c, lineH: ln.heightPx, gapPx: gapHere });
          // **FX-1:** נעילת ליווי — שורות גוף ראשונות אחרי הכותרת מקריעות את
          // המונה; בהשלמת שורות הליווי — שחרור הנעילה (ההצבה חוזרת לזרימה חופשית).
          if (escortLinesNeeded > 0 && ln.kind !== 'heading') {
            escortLinesNeeded--;
            if (escortLinesNeeded === 0) escortLockCol = 0;
          }
        }
      }
      if (!placed) {
        trace.emit(cur.index, 'block-overflow-newpage', { token: meta.tokenId, lineH: ln.heightPx });
        flushPage();
        cur = newPage(meta.forceType || PAGE_TYPES.REGULAR);
        cur.openedBy = meta.tokenId != null ? meta.tokenId : null; // מעבר עמוד — מי פתח
        cur.columns[0].push({ ...ln, meta, seq: seqCounter++ }); // טור חדש/עמוד חדש → ללא gap (ראש טור)
        firstOfCall = false;
        flushPendingSideFor(); // 9b.3: גם בפתיחת עמוד חדש — העוגן כאן
      }
    }
  }

  /**
   * **תקציב הערות לפני מיקום (F-17 probe==reserved) — כולל מדיניות הערה ארוכה
   * (REQ-FN-02) בזמן ההצבה**, כך שהתקציב תמיד עדכני (ללא תיקון פוסט‑הוק):
   *  - split: החלק הראשון נכנס למרזב העמוד; השאר נכנס לתור pendingBarNotes
   *    ונדחף לראש המרזב של העמוד הבא עם סימון המשך (isContinuation).
   *  - move-whole: ההערה כולה עוברת לעמוד הבא.
   *  - reject-to-body: ההערה חוזרת לגוף כplaceholder `[סמן: טקסט]` + רישום ledger.
   * fn-layout-mode (D-34): block ⇒ תקרת fn-bar-max-height-px נאכפת; continuous ⇒
   * אין תקרה (ההערות זורמות) — מנגנון אמיתי, לא מחלקת CSS בלבד.
   */
  const pendingBarNotes = [];
  function reserveNotes(blk) {
    const notes = (blk.notes || []);
    if (!notes.length) return null;
    // **FX-3 (דוח 06, שלב 5):** תמונת-מצב לשחזור דטרמיניסטי — ההתחייבות
    // חייבת להיות הפיכה כל עוד הפסקה עודנה בהכרעת מיקום. snap.clean=false
    // אחרי פעולות בעלות תופעות לוואי (פיצול/העברה/החזרה לגוף) — אין שחזור
    // אחריהן (המשכים שנוצרו, מצב הבלוק וה-ledger אינם הפיכים בבטחה).
    const snap = { clean: true, footLenBefore: cur.footnotes.length, fnBefore: cur.fnReservedHeightPx || 0, pendingBefore: pendingBarNotes.slice() };
    // המשכים מהעמוד הקודם קודם כל (שמירת סדר ההערות)
    const queue = [...pendingBarNotes.splice(0), ...notes];
    const barMax = settings['fn-layout-mode'] === 'continuous'
      ? Number.POSITIVE_INFINITY
      : (settings['fn-bar-max-height-px'] || Number.POSITIVE_INFINITY);
    for (const n of queue) {
      if (!settings['footnotes-enabled']) {
        // אין מרזב — ההערה חוזרת לגוף כplaceholder; לרזב לא אמורות להגיע הערות
        // כלל במצבים אלה (הpipeline לא שם אותן ב‑blk.notes). שומר בטוח: continue.
        continue;
      }
      // **S71.1 (R7-M4 שארית — בדיקה כפולה):** מעבר ישיר של measureFn — עטיפת
      // החץ שהייתה כאן איבדה את סימון ה-impl (measureWithImpl.impl), וב-impl B
      // (ייצוא PDF) הופעל פקטור הגופן שנועד לטבלת impl A בלבד ⇒ תקציב מרזב
      // מנופח והחלטות split/move-whole מוטות בגבול התקרה. כמו recomputeFnBudget.
      // **פרוסה 2 (מדידה אחת — §2.3 בביקורת):** הערה שכבר נמדדה (חותמת CP2
      // או הטבעה קודמת) אינה נמדדת שוב — noteHeight צורך את החותמת; הטבעה
      // חד-פעמית מתבצעת רק להערה שלא נמדדה מעולם (ונחתמת על המקור — כך
      // שגם העתקים עתידיים שלה לא יימדדו שוב).
      if (n.heightPx == null) stampNoteMetrics(n, settings, measureFn);
      const h = n.heightPx;
      const isCont = n.isContinuation === true;
      // הערה ארוכה מתקרת המרזב ⇒ מדיניות (block mode בלבד; continuous אין תקרה — D-34)
      if (Number.isFinite(barMax) && h > barMax && settings['long-footnote-policy'] !== 'allow') {
        if (settings['long-footnote-policy'] === 'split') {
          // **פיצול אמיתי של הטקסט (פרוסה 2 — מגבולות שורה מוחלטים):** החיתוך
          // נעשה בגבול שורה מהמבנה שכבר נמדד (noteRows) — לא בספירת מילים
          // עם מדידה חוזרת. החלק הראשון נכנס למרזב הזה; השאר נכנס לתור
          // pendingBarNotes עם סימון המשך (isContinuation) — טקסט חדש שמוטבע
          // פעם אחת בלבד (מדידתו הראשונה והאחרונה).
          // **שלב 6 פרוסה 2 (§7 — זהות וטווחים):** המקור וההמשך שומרים קישור
          // מפורש — continuationOf (noteId) + wordRange (טווח מילים במקור):
          // מילה לא נעלמת, לא מוכפלת ולא נסדרת מחדש; ההמשך נמדד כטקסט חדש
          // (חותמת משלו, כולל רוחב '(המשך)' בתקציב שורה 0 — §9).
          const fnLH = n.lineH || noteMetrics(settings).lineHeightPx;
          const rows = n.noteRows || [];
          const linesFit = Math.max(1, Math.floor(barMax / fnLH));
          if (!rows.length || n.linesCount == null || n.linesCount <= linesFit) {
            // כל ההערה נכנסת בגבול התקרה — אין צורך בפיצול
            cur.footnotes.push({ ...n, heightPx: h, mode: isCont ? 'split-rest' : 'normal', isContinuation: isCont });
            continue;
          }
          const cutRow = Math.min(linesFit, rows.length);
          const cutIdx = rows[cutRow - 1].wTo;
          const wordsArr = n.noteWords || String(n.text).replace(/\uE000/g, ' ').split(/\s+/).filter(Boolean);
          if (cutIdx >= wordsArr.length) {
            cur.footnotes.push({ ...n, heightPx: h, mode: isCont ? 'split-rest' : 'normal', isContinuation: isCont });
            continue;
          }
          const firstText = wordsArr.slice(0, cutIdx).join(' ');
          const restText = wordsArr.slice(cutIdx).join(' ');
          const srcNoteId = n.noteId || makeNoteRecord(n, { kind: NOTE_KINDS.FOOTNOTE, numberingScope: settings['footnote-reset-policy'], splitPolicy: 'split' }).noteId;
          cur.footnotes.push({
            ...n, text: firstText, heightPx: cutRow * fnLH, lineH: fnLH, linesCount: cutRow,
            noteRows: rows.slice(0, cutRow), noteWords: wordsArr.slice(0, cutIdx),
            mode: 'split-first', linesShown: cutRow,
            wordRange: { from: n.wordRange ? n.wordRange.from : 0, to: (n.wordRange ? n.wordRange.from : 0) + cutIdx }
          });
          // ההמשך נולד כרשומת חוזה מלאה (makeNoteRecord — זהות+עוגן+מדיניות,
          // עם fragmentIndex ל-noteId) — לא כשק חלקי של המקור.
          const frag = makeNoteRecord(
            { text: restText, marker: n.marker, tokenId: n.tokenId, noteIndex: n.noteIndex, part: n.part },
            {
              kind: NOTE_KINDS.FOOTNOTE,
              numberingScope: settings['footnote-reset-policy'],
              splitPolicy: 'split', continuationPolicy: 'split',
              continuationOf: srcNoteId,
              fragmentIndex: (n.fragmentSeq != null ? n.fragmentSeq : 0) + 1,
              wordRange: { from: (n.wordRange ? n.wordRange.from : 0) + cutIdx, to: (n.wordRange ? n.wordRange.from : 0) + wordsArr.length }
            }
          );
          frag.isContinuation = true;
          frag.mode = 'split-rest';
          frag.fragmentSeq = (n.fragmentSeq != null ? n.fragmentSeq : 0) + 1;
          pendingBarNotes.push(stampNoteMetrics(frag, settings, measureFn));
          snap.clean = false; // נוצר המשך חדש — אין שחזור בטוח
          eventLog.emit('notes-budget', 'fn-split', { token: n.tokenId, marker: n.marker, barMax, firstWords: cutIdx, firstRows: cutRow }, cur.index);
          trace.emit(cur.index, 'note-split', { token: n.tokenId, marker: n.marker, firstRows: cutRow, restRows: n.linesCount - cutRow });
          continue;
        }
        if (settings['long-footnote-policy'] === 'move-whole') {
          pendingBarNotes.push({ ...n, mode: 'moved-whole', deferredToNextPage: true });
          snap.clean = false; // הועברה לעמוד הבא — אין שחזור בטוח
          eventLog.emit('notes-budget', 'fn-moved-whole', { token: n.tokenId, marker: n.marker }, cur.index);
          trace.emit(cur.index, 'note-moved-whole', { token: n.tokenId, marker: n.marker });
          continue;
        }
        if (settings['long-footnote-policy'] === 'reject-to-body' && rejectToBody(n, `bar overflow ${h}>${barMax}`)) {
          snap.clean = false; // מוטציית בלוק+lines — אין שחזור בטוח
          trace.emit(cur.index, 'note-rejected-to-body', { token: n.tokenId, marker: n.marker });
          continue;
        }
      }
      cur.footnotes.push({ ...n, heightPx: h, lineH: n.lineH || noteMetrics(settings).lineHeightPx, isContinuation: isCont, mode: isCont ? 'split-rest' : 'normal' });
    }
    recomputeFnBudget(cur); // probe==reserved — פונקציה אחת (unified) לשני הצרכים
    return snap;
  }

  /**
   * **FX-3 (דוח 06, שלב 5):** שחזור דטרמיניסטי של התחייבות הערות — רק מנתיב
   * snap.clean (המשכים קודמים מוחזרים לתור; פעולות עם תופעות לוואי אינן הפיכות).
   */
  function uncommitNotes(page, snap) {
    page.footnotes.length = snap.footLenBefore;
    page.fnReservedHeightPx = snap.fnBefore;
    pendingBarNotes.length = 0;
    for (const p of snap.pendingBefore) pendingBarNotes.push(p);
  }

  /** **FX-3:** אינדקס שורת הסמן הראשונה של הבלוק (-1 אם אין). */
  function firstMarkerLineOf(blk) {
    return (blk.lines || []).findIndex(ln => (ln.words || []).some(w => String(w).includes(MARK_TAG)));
  }

  /**
   * **FX-3 (דוח 06, שלב 5):** התחייבות הערות בעמוד שבו שורת הסמן עומדת להיות
   * מוצבת, עם נסיגה דטרמיניסטית חד-פעמית אם התקציב חסם את שורת הסמן. F-17
   * נשמר לעמוד ההערה: התקציב נסגר בטרם שורת הסמן ושארית שורות הבלוק.
   * @param {object} blk — הפסקה
   * @param {object|null} markerLine — שורת הסמן (null ⇒ שורה ראשונה של הבלוק)
   */
  function reserveAtMarker(blk, markerLine) {
    const snap = reserveNotes(blk);
    if (!snap) return;
    const isFirst = !markerLine;
    const stack = CM.stackHeightPx([markerLine || blk.lines[0]], isFirst ? blockGapPx(settings, lineH) : 0);
    // **U-8:** גם התאמת שורת הסמן וגם הכלת כל טורי העמוד מעל המרזב —
    // אחרת העמוד נסגר בלי ההערה והיא עוברת עם הסמן לעמוד הבא (F-17).
    if (snap.clean && (ensureRoomFor(stack) === -1 || !pageFitsNoteBudget())) {
      uncommitNotes(cur, snap);
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      reserveNotes(blk);
      if (ensureRoomFor(stack) === -1 || !pageFitsNoteBudget()) {
        // מצב פתולוגי (הערה בגודל עמוד): מתועד, לא שקט
        ledger.create('fn-degenerate', blk.tokenId, cur.index, { reservedPx: cur.fnReservedHeightPx }, 'notes-budget');
      }
    }
  }

  /**
   * **תיקון P0-3 משלים — reject-to-body נשאר מסלול BRZ-15 לגיטימי** (השבה מלאה
   * לגוף; לעולם אין גניזת מילים). פועל בזמן הצבה בלבד (בתוך reserveNotes).
   */
  function rejectToBody(n, reason) {
    const blk = blocks.find(b => b.tokenId === n.tokenId && (b.notes || []).some(x => x.noteIndex === n.noteIndex));
    if (!blk) return false;
    // **D-53:** הסמן בשורות הוא יחידה מתויגת (`עוגן\u00A0\uE102סמן`). ההחלפה:
    // מורידים את התג ומדביקים את טקסט ההערה אחרי הסמן במפריד E000 —
    // `עוגן\u00A0סמן\uE000טקסט` — צורה אחידה עם inline (D-30), נספרת פעם אחת.
    const tagged = (l) => l.words && l.words.some(w => String(w).includes(MARK_TAG));
    const idx = (blk.lines || []).findIndex(tagged);
    if (idx >= 0) {
      blk.lines[idx].words = blk.lines[idx].words.map(w => {
        const sw = String(w);
        if (!sw.includes(MARK_TAG)) return w;
        const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
        return sw.replace(MARK_TAG, '') + '\uE000' + textE;
      });
    } else {
      const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
      // **פרוסה 2:** סימון synthetic מפורש — שורה שנוצרה בזמן ההצבה (לא ממנוע השורות) — פוטרת מתועד באימות החוזה במקום לדווח שקרי על חוסר LineModel.
      blk.lines.push({ words: [`${n.marker}\uE000${textE}`], heightPx: lineH, isLast: false, tokenId: blk.tokenId, kind: 'paragraph', part: 'rest', synthetic: 'reject-to-body' });
    }
    const ni = (blk.notes || []).findIndex(x => x.noteIndex === n.noteIndex);
    if (ni >= 0) blk.notes.splice(ni, 1); // מקור־אמת יחיד: לא לספור פעמיים
    blk.rejectedNotes = blk.rejectedNotes || [];
    blk.rejectedNotes.push({ tokenId: n.tokenId, noteIndex: n.noteIndex, text: n.text, marker: n.marker, rejected: true, reason });
    ledger.create('fn-out-of-order', `rejected@p${cur.index}`, cur.index, { marker: n.marker, reason }, 'notes-budget');
    eventLog.emit('notes-budget', 'footnote-rejected-to-body', { token: n.tokenId, marker: n.marker, reason }, cur.index);
    return true;
  }


  // **שלב 6 פרוסה 2 (§§7/10):** יצירת פריט עוגן בשוליים (הערת-צד / תיבת
  // מידע) — רשומת מודל-ההערות המאוחד (זהות+עוגן+מדיניות) שמוטבעת בחותמת
  // מדידה **ביצירתה** (מדידה אחת): מכאן ההקצאה האנכית, ה-DOM וה-PDF קוראים
  // את אותה חותמת ואינם מודדים עוד. תיבת המידע נמדדת ברוחב הפנימי שלה
  // (רוחב-מוגדר פחות מסגרת/ריפוד) וגובה התיבה כולה נכנס לחותמת — התקציב
  // וההקצאה מקבלים את התיבה השלמה (אין הזמנה נסתרת בזמן ההצבה).
  function pushAnchoredMarginItem(rec) {
    const isBox = rec.itemKind === 'info-box';
    const kind = isBox ? NOTE_KINDS.INFO_BOX : NOTE_KINDS.SIDE_NOTE;
    const chrome = isBox && rec.boxSpec
      ? { pad: rec.boxSpec.padPx || 0, border: rec.boxSpec.borderPx || 0 }
      : { pad: 0, border: 0 };
    const outerW = (isBox && rec.boxSpec && Number(rec.boxSpec.widthPx) > 0) ? rec.boxSpec.widthPx : null;
    const record = makeNoteRecord({ ...rec, tokenId: rec.ownToken || rec.tokenId }, {
      kind,
      anchorId: rec.anchorToken,
      numberingScope: isBox ? 'style' : 'document',
      continuationPolicy: 'anchor-cascade',
      ...(isBox ? { splitPolicy: 'atomic' } : {})
    });
    stampNote(record, settings, measureFn, kind, {
      ...(outerW != null ? { widthPx: Math.max(12, outerW - 2 * (chrome.pad + chrome.border)) } : {}),
      ...(isBox && rec.boxSpec && Number(rec.boxSpec.sizePt) > 0 ? { sizePt: Number(rec.boxSpec.sizePt) } : {})
    });
    if (isBox) {
      record.boxChrome = chrome;
      record.heightPx = Math.round((record.heightPx + 2 * (chrome.pad + chrome.border)) * 1000) / 1000; // התיבה כולה — תקציב=הצבה=הקרנה
    }
    cur.sideNotes.push(record);
    return record;
  }

  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi];
    const next = blocks[bi + 1];

    // **S10 (REQ-UI-03):** התקדמות שלב הפריסה — "עומד עמוד X מתוך כ־Y" (Y מוערך;
    // מעודכן לספירה הסופית בסיום ה‑DP). בדידות 32 בלוקים — אפס השפעה על הפריסה.
    if (onProgress && (bi & 31) === 0) {
      const est = Math.max(estimatedPages, cur.index + 1);
      onProgress({
        stage: 'page-plan',
        pct: 25 + Math.round(45 * (bi / Math.max(1, blocks.length))),
        label: `עומד עמוד ${cur.index + 1} מתוך כ־${est}`,
        pageIndex: cur.index + 1,
        estimatedTotal: est
      });
    }

    // REQ-HDG-02 (החלטה מאוחדת — headings-escort.applyHeadingModes, D-09):
    // הדגלים נקבעים בpipeline לפני ה‑DP; כאן רק צריכה.
    if (blk.kind === 'heading' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      eventLog.emit('page-plan', 'heading-new-page-mode', { token: blk.tokenId }, cur.index);
    }
    // פתיחת חלק (H1) / פתיחת ספר (H0 — PT-04 טור רחיד): עמוד חדש + סימון chapterOpening (D-36)
    // **תיקון S8 (באג חבוי):** המרת סוג עמוד חייבת ליישר גם את מערך הטורים לתבנית
    // החדשה — בעבר נשאר מערך שני־טורי מעל תבנית חד־טורית ⇒ טור פנטום בלי תבנית.
    if (blk.kind === 'heading' && (blk.level === 1 || blk.level === 0)) {
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
      cur.chapterOpening = true;
      cur.type = PAGE_TYPES.PREFACE;
      cur.template = buildPageTemplate(PAGE_TYPES.PREFACE, settings, cur.isRecto !== false);
      reAlignColumns(cur);
      eventLog.emit('page-plan', 'part-opening', { token: blk.tokenId, level: blk.level }, cur.index);
    }

    // REQ-FN-05/06: heading mode=side-note → הערת שוליים בטור מקביל (H7 doctrine)
    if (blk.kind === 'heading' && blk.asSideNote) {
      // S7.1.2: הערת צד נצמדת לפסקה שהיא מבארת — הבלוק הבא (host) הוא העוגן החזותי.
      // **9b.3 (F-9b-1 — תיקון תזמון במנגנון התכנון):** הרשומה אינה נדחפת לעמוד
      // שבו נפגש ה-H7, אלא ממתינה בתור עד ששורת העוגן הראשונה של המארחת
      // מוצבת בפועל — ואז נכנסת ל-sideNotes של **אותו** עמוד. בעבר, כשה-H7
      // בסוף עמוד N והמארחת נפתחת ב-N+1, הפריט נותר ב-N והמקצה הציב אותו
      // בראש תיבת התוכן (עוגן חזותי בעמוד אחר) — נמדד: 16 פריטים ב-very_long.
      const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph');
      if (host) hostByH7.set(String(blk.tokenId), String(host.tokenId)); // 9b.3: לאימות העוגן הצפוי
      const rec = {
        text: blk.lines.map(l => l.words.join(' ')).join(' ').trim(),
        anchorToken: host ? host.tokenId : blk.tokenId,
        ownToken: blk.tokenId, isHeading: true, level: blk.level, itemKind: 'side-note'
      };
      if (host) {
        const k = String(host.tokenId);
        if (!pendingSideByHost.has(k)) pendingSideByHost.set(k, []);
        pendingSideByHost.get(k).push(rec);
      } else {
        // H7 ללא פסקה מארחת — ממצא מפורש (אינו נעלם בשקט); מוצמד לעצמו כבעבר
        const r7 = ledger.create('h7-without-host', `h7@${blk.tokenId}`, null,
          { token: blk.tokenId, text: rec.text.slice(0, 40) }, 'page-plan');
        ledger.transition(r7.issue_id, 'persists', 'page-plan',
          'H7 side note without a following host paragraph — anchored to itself (documented finding)');
        pushAnchoredMarginItem(rec);
      }
      eventLog.emit('page-plan', 'heading-side-note', { token: blk.tokenId }, cur.index);
      continue;
    }

    // **S11 (REQ-PAR-06):** דגלי פריסה של סגנונות מותאמים על פסקאות —
    // הדגלים נקבעו בפרה־פאס (pipeline) לפני המדידה; כאן רק צריכה (דפוס D-09).
    if (blk.kind === 'paragraph' && blk.customStyle) {
      const cs = blk.customStyle;
      if (cs.layoutMode === 'new-location' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        eventLog.emit('page-plan', 'custom-style-new-location', { style: cs.id, token: blk.tokenId }, cur.index);
      }
      if ((cs.layoutMode === 'side-note' && blk.asSideNote) || (cs.layoutMode === 'info-box' && blk.asInfoBox)) {
        // הפסקה הופכת פריט עוגן בשוליים מעוגן לפסקה הבאה שאחריה (המארחת) — דפוס H7;
        // תיבת מידע (info-box) רוכבת על אותו מנגנון עוגן — דרך החוזה וה-registry (§11).
        // **FX-3:** הערות פנימיות של פסקת צד מחויבות כאן — הענף continue
        // מדלג על ההצבה הרגילה (התנהגות קודמת נשמרת).
        // **9b.3:** אותו תיקון תזמון כמו H7 — הפריט נכנס לעמוד שורת העוגן של המארחת.
        if ((blk.notes || []).length) reserveNotes(blk);
        const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph' && !(b.customStyle && (b.customStyle.layoutMode === 'side-note' || b.customStyle.layoutMode === 'info-box')));
        const recCS = {
          text: blk.lines.map(l => (l.words || []).join(' ')).join(' ').trim(),
          anchorToken: host ? host.tokenId : blk.tokenId,
          ownToken: blk.tokenId, isCustomStyle: cs.id,
          counterMark: cs.counterMark || null,
          itemKind: blk.asInfoBox ? 'info-box' : 'side-note',
          styleSpec: cs.styleSpec || null,
          boxSpec: blk.infoBoxSpec || null
        };
        if (host) {
          const k = String(host.tokenId);
          if (!pendingSideByHost.has(k)) pendingSideByHost.set(k, []);
          pendingSideByHost.get(k).push(recCS);
        } else {
          const rCS = ledger.create('margin-item-without-host', `mi@${blk.tokenId}`, null,
            { style: cs.id, token: blk.tokenId }, 'page-plan');
          ledger.transition(rCS.issue_id, 'persists', 'page-plan',
            'margin item without a following host paragraph — anchored to itself (documented finding)');
          pushAnchoredMarginItem(recCS);
        }
        eventLog.emit('page-plan', blk.asInfoBox ? 'custom-style-info-box' : 'custom-style-side-note', { style: cs.id, token: blk.tokenId }, cur.index);
        continue;
      }
      if (cs.layoutMode === 'full-width' && blk.fullWidth) {
        // פס חוצה־טורים (callout) — דפוס FWD-1 של H2; פס אחד בראש העמוד.
        // אם כבר יש פס/תוכן בעמוד — עמוד חדש (קריאה פותחת מיקום משלה).
        if (cur.spanning || cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: bandH,
          customStyle: cs
        };
        eventLog.emit('page-plan', 'custom-style-band', { style: cs.id, token: blk.tokenId, heightPx: bandH }, cur.index);
        continue;
      }
    }

    // **FX-3 (דוח 06, שלב 5 — תיקון שורש):** התחייבות ההערות הועברה להכרעת
    // המיקום (להלן, אחרי ensureRoomFor/findSplit) — בעבר רצה כאן, לפני שהיה
    // ידוע היכן הפסקה תוצב: פסקה שנדחקה כולה לעמוד הבא הותירה את הערותיה
    // מאחור (סמן בעמוד N+1, טקסט ההערה במרזב עמוד N — הוכח בדוח 06, FX-3;
    // אף בדיקת הגנה לא זיהתה זאת: המילים כולן קיימות, רק הקולוקציה הופרה).

    // **03.11(ד) — span_1col של המקור ל-H3–H6 (mode=full-width):** עד כאן כותרת
    // שנמדדה ברוחב מלא (674px) הוצבה בטור של 270px — שורה ברוחב 471px בטור
    // חצי-רוחב, נגררת בדפדפן לגלישה/חפיפה ("טקסטים אחד על השני" — דיווח משתמש 3).
    // עתה היא מוצבת בפס חוצה־טורים כמו H2 (FWD-1) — בלי עמוד חדש (המקור:
    // כותרת הענף ממשיכה באותו עמוד; עמוד חדש רק אם אין מקום לפס).
    if (blk.kind === 'heading' && blk.level >= 3 && blk.level <= 6 && blk.fullWidth) {
      if (cur.spanning || cur.columns.some(c => c.length)) {
        flushPage();
        cur = newPage(PAGE_TYPES.REGULAR);
      }
      if (!cur.spanning && cur.template.columns.length >= 2) {
        const bandH3 = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        // **חוזה H3 (D-S2H3/CSS parity):** הפס נושא ריפוד עליון 8px פעם אחת,
        // ריפוד תחתון 4px + שוליים 4px פעם אחת אחרי השורה האחרונה — כמו
        // .block-h3-span ב-CSS המקורי. ה-line-height עצמו (1.22) נקבע במדידה
        // (core/pipeline.js). מקור יחיד: core/h3-contract.js.
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: h3BandHeightPx(bandH3),
          titleTopPadPx: H3_TOP_PAD_PX,
          orn: null
        };
        eventLog.emit('page-plan', 'h3-spanning', { token: blk.tokenId, level: blk.level, heightPx: cur.spanning.heightPx }, cur.index);
        continue; // הכותרת בפס; הבלוקים הבאים ימלאו את הטורים מתחת
      }
    }

    if (blk.kind === 'heading' && blk.level === 2) {
      // PT-05: עמוד חדש תמיד + סימון פתיחת סימן (D-36) + בניית תבנית מלאה
      // (בעבר בענף ה־else הוחלף סוג העמוד בלי בניית תבנית SIGN_OPEN —
      // נשארה תבנית REGULAR ללא h2-top-offset; תוקן ב‑S8 עם FWD-1)
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.SIGN_OPEN); }
      else if (cur.type !== PAGE_TYPES.SIGN_OPEN) {
        cur.type = PAGE_TYPES.SIGN_OPEN;
        cur.template = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, settings, cur.isRecto !== false);
        reAlignColumns(cur); // יישור טורים לתבנית (תיקון S8 — טור פנטום)
      }
      cur.chapterOpening = true;
      eventLog.emit('page-plan', 'h2-new-page', { token: blk.tokenId }, cur.index);
      // **FWD-1:** H2 שנמדדה ברוחב מלא (mode=full-width, ברירת המחדל) ⇒ פס
      // חוצה־טורים — לא טור חצי־רוחב. הטורים נמדדים מתחת לפס (colCapacity מותאם).
      if (blk.fullWidth && cur.template.columns.length >= 2) {
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        // **S8 (F-08):** הזמנת עיטורי H2 בגודל סופי — בתוך גובה הפס, לפני כל מדידה
        const orn = blk.lines[0] && blk.lines[0].h2Orn;
        const topPad = orn && orn.scope && orn.scope.signTop ? orn.topPx : 0;
        const bottomPad = orn && orn.scope && orn.scope.signBottom ? orn.bottomPx : 0;
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: topPad + bandH + bottomPad,
          titleTopPadPx: topPad,
          orn: orn || null
        };
        eventLog.emit('page-plan', 'h2-spanning', { token: blk.tokenId, heightPx: cur.spanning.heightPx, ornTop: topPad, ornBottom: bottomPad }, cur.index);
        continue; // הכותרת הוצבה בפס; הבלוקים הבאים ימלאו את הטורים מתחתיו
      }
    }

    // REQ-BAL-10: heading escort ≥2 שורות אחרי כותרת H1–H6 באותו טור.
    if (blk.kind === 'heading' && blk.level <= 6) {
      const following = (next && next.lines) ? next.lines.length : 0;
      if (following >= 1) {
        // **FX-1/FX-5 (דוח 06, שלב 5):** הבדיקה מודדת את המחסנית הפיזית האמיתית
        // (CM.escortStackHeightPx — גבהי הכותרת + פערי כניסה + שורות הליווי)
        // ותוצאתה מנוצלת להצבה מכוונת (escortLockCol/startCol) — בדיקה שאינה
        // קשורה להצבה יוצרת כותרות יתומות שאין להן תיקון (הוכח: FX-1 בדוח 06).
        const escortN = Math.min(CM.ESCORT_MIN_LINES, following);
        const escortStack = CM.escortStackHeightPx(blk, next, () => blockGapPx(settings, lineH));
        let pushed = false;
        let room = ensureRoomFor(escortStack);
        if (room === -1) {
          flushPage(); cur = newPage(blk.level === 2 ? PAGE_TYPES.SIGN_OPEN : PAGE_TYPES.REGULAR);
          room = ensureRoomFor(escortStack);
          pushed = true;
        }
        if (room !== -1) {
          eventLog.emit('page-plan', pushed ? 'heading-escort-push' : 'heading-escort-directed', { token: blk.tokenId, page: cur.index, col: room, stackPx: Math.round(escortStack) }, cur.index);
          escortLockCol = room;      // הצבה מכוונת: הכותרת ושורות הליווי — בטור שאומת
          escortLinesNeeded = escortN;
          trace.emit(cur.index, 'escort-directed', { token: blk.tokenId, col: room, stackPx: escortStack, pushed });
        } else {
          const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { stackPx: Math.round(escortStack), capacityPx: colCapacity(cur.template, cur) }, 'protections');
          ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no column fits heading+escort even on fresh page (oversized block)');
        }
      }
    }

    // REQ-BAL-01: candidate search עם capacityBefore/capacityAfter + הקשר הבלוק הבא
    // **FX-5 (דוח 06, שלב 5):** הקיבולת נמדדת ב-yPx אמיתיים (גבהים + פער כניסה)
    // — לא בהמרת lineH; בלוק שנכנס פיזית לא יידחק עוד לעמוד חדש (עמוד ריק פנטום).
    const needStack = CM.stackHeightPx(blk.lines, blockGapPx(settings, lineH));
    let chosenCol = ensureRoomFor(needStack);
    if (chosenCol === -1) {
      const splitAt = findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings, generateCandidates, trace);
      if (splitAt > 0) {
        // **FX-3:** ההערות מחויבות לעמוד של החלק שבו שורת הסמן:
        // הסמן בחלק הראשון ⇒ כאן; הסמן בהמשך ⇒ בעמוד החדש (לאחר ה-flush).
        const splitMIdx = (blk.kind === 'paragraph' && (blk.notes || []).length && settings['footnotes-enabled'])
          ? firstMarkerLineOf(blk) : -1;
        if (blk.kind === 'paragraph' && splitMIdx < splitAt) reserveNotes(blk);
        // **FX-6 (פרוסה 2):** החלק הראשון של הפיצול הוא פתיחת בלוק בפועל
        // בטור שמתחתיו תוכן קיים — חותמת פער כמו כל פתיחת בלוק (בעבר חלק
        // הפיצול לא סומן כלל כ-firstOfBlock ⇒ הפער לא נגבה גם כשער כניסה).
        pushLines(blk.lines.slice(0, splitAt - 1), { tokenId: blk.tokenId, part: 'first', firstOfBlock: true, docPart: blk.part });
        pushLines([blk.lines[splitAt - 1]], { tokenId: blk.tokenId, part: 'first', isLast: true });
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        cur.openedBy = blk.tokenId; // מעבר עמוד בפיצול — הבלוק פתח את העמוד החדש
        if (blk.kind === 'paragraph' && splitMIdx >= splitAt) reserveNotes(blk);
        pushLines(blk.lines.slice(splitAt), { tokenId: blk.tokenId, part: 'rest', docPart: blk.part });
        continue;
      }
      // **FX-5/#16 — שמירת עמוד ריק:** אם העמוד ריק משורות גוף — אין טעם לאטום
      // אותו; הבלוק נכנס לכאן (בעבר נאטם עמוד ריק עם הערות יתומות).
      if (cur.columns.some(c => c.length)) {
        flushPage();
        cur = newPage(PAGE_TYPES.REGULAR);
      }
      chosenCol = 0;
    }
    // **FX-3 (דוח 06, שלב 5):** התחייבות ההערות בעמוד שבו שורת הסמן נוחתת
    // בפועל. שורות שלפני הסמן ממלאות את העמודים הקודמים בלי תקציב (ההערה
    // לא תשהה שם); התקציב נסגר בטרם שורת הסמן ושארית השורות — F-17 נשמר
    // לעמוד ההערה.
    const hasNotes = blk.kind === 'paragraph' && (blk.notes || []).length && settings['footnotes-enabled'];
    const mIdx = hasNotes ? Math.max(0, firstMarkerLineOf(blk)) : 0;
    if (hasNotes && mIdx > 0) {
      pushLines(blk.lines.slice(0, mIdx), { tokenId: blk.tokenId, firstOfBlock: true, docPart: blk.part }, { startCol: escortLockCol });
    }
    if (hasNotes) reserveAtMarker(blk, mIdx > 0 ? blk.lines[mIdx] : null);
    pushLines(blk.lines.slice(mIdx), { tokenId: blk.tokenId, docPart: blk.part, ...(mIdx > 0 ? {} : { firstOfBlock: true }) }, { startCol: escortLockCol });

    if (blk.sideNoteText) pushAnchoredMarginItem({ text: blk.sideNoteText, anchorToken: blk.tokenId, ownToken: blk.tokenId, itemKind: 'side-note' });
  }

  // **9b.3 (F-9b-1):** שארית פריטי-השוליים שהמתינו למארחת שלא הוצבה מעולם —
  // ממצא מפורש (לא גניזה): מוכנסים לעמוד הפתוח הנוכחי, והמארחה תתועד.
  if (pendingSideByHost.size) {
    for (const [hostTok, recs] of [...pendingSideByHost.entries()]) {
      const rP = ledger.create('h7-host-not-placed', `host@${hostTok}`, null,
        { host: hostTok, items: recs.length }, 'page-plan');
      ledger.transition(rP.issue_id, 'persists', 'page-plan',
        `host paragraph ${hostTok} never placed — ${recs.length} side item(s) flushed to current page (documented)`);
      for (const rec of recs) pushAnchoredMarginItem(rec);
      pendingSideByHost.delete(hostTok);
    }
    eventLog.emit('page-plan', 'side-notes-host-flush', { remaining: 0 });
  }

  // **S6.0 (R3-C1 — אובדן תוכן בזנב):** פס חוצה-טורים (H3–H6) או הערת-צד
  // שנותרו לבד בעמוד האחרון (בלי שורות טור ובלי הערות) לא הופיעו בפלט
  // — הם נפלטו ב-flushPage אך התנאי לא כלל אותם ⇒ העמוד לא נסגר מעולם.
  if (cur.columns.some(c => c.length) || cur.footnotes.length
    || (cur.spanning && cur.spanning.lines && cur.spanning.lines.length)
    || (cur.sideNotes && cur.sideNotes.length) || pages.length === 0) flushPage();

  // המשכים שנותרו בתור בסוף המסמך — לא ראוי לגנוז (BRZ-15): נדחפים לעמוד האחרון
  if (pendingBarNotes.length) {
    const last = pages[pages.length - 1];
    const { lineHeightPx: tailLineH } = noteMetrics(settings); // **שלב 5 (#16):** מקור יחיד למדדי ההערה
    for (const n of pendingBarNotes) {
      // **שלב 5 (חילוץ שורש מ-#16 — חותמי מדדים בניקוז הזנב):** התקציב
      // (recomputeFnBudget) מחשב את הגובה מ-noteHeight ממילא, אך ההקרנה
      // צורכת את n.heightPx/n.lineH — בלי החותמים, המשך שנדחף לסוף המסמך
      // מתקדם שורה אחת בלבד ושורותיו חופפות את ההערה שאחריו (תקציב≠הקרנה —
      // בדיוק מחלקת הכשל ש-S70/S71.1 רדפו אחריה).
      last.footnotes.push({
        ...n, // mode/isContinuation preserved (moved-whole stays whole)
        ...(n.heightPx != null ? {} : { heightPx: noteHeight(n, settings, measureFn) }),
        ...(n.lineH != null ? {} : { lineH: tailLineH })
      });
    }
    recomputeFnBudget(last);
    // **שלב 5 (אין fallback שקט):** ההמשכים חייבים להישמר (BRZ-15 — אין אובדן
    // תוכן), אך אם תקציבם חורג מקיבולת העמוד האחרון — נרשם אבחון מפורש
    // (fn-tail-overflow) במקום גלישה שקטה. זהו מצב פתולוגי מבני (המשכים
    // שנצברו בסוף המסמך); לתקנת השורש המלאה נדרש מנגנון עמודי-גלישה להערות
    // — שלב B של התוכנית (דוח 06).
    const tailCap = colCapacityOf(last); // **U-8:** מודע-תקציב, כמו ההצבה
    const tailUsed = planningUsedHeight(last.columns[last.columns.length - 1], last);
    if (tailUsed > tailCap + CM.CAPACITY_EPS) {
      const rec = ledger.create('fn-tail-overflow', `tail@p${last.index}`, last.index,
        { usedPx: Math.round(tailUsed), capPx: Math.round(tailCap), notes: pendingBarNotes.length }, 'notes-budget');
      ledger.transition(rec.issue_id, 'persists', 'notes-budget', 'tail continuations exceed last-page capacity (structural; documented — stage B)');
    }
    eventLog.emit('notes-budget', 'fn-tail-continuation', { count: pendingBarNotes.length, page: last.index }, last.index);
    pendingBarNotes.length = 0;
  }

  // terminal residual fallback (REQ-BAL-04): אם העמוד האחרון ריק למחצה ויש מצב natural — סמן
  if (settings['allow-terminal-residual-fallback']) {
    const last = pages[pages.length - 1];
    if (last && last.columns.every(c => usedHeight(c, last) < colCapacity(last.template, last) * 0.5)) {
      last.terminalResidual = true; // לא מדווח כ‑underfill (B4)
    }
  }

  // **§3.2 (ביקורת PR #16 — העברת פתרון השורש למודל ההערות המאוחד):**
  // reconcileNotesAfterPlacement — אחרי ההצבה המלאה. שורש הפגם: reserveNotes
  // מחייב את **כל** הערות הבלוק בעמוד הסמן **הראשון** (FX-3); כשסמנים
  // מאוחרים של אותו בלוק נוחתים בעמוד הבא (פיצול פסקה / זרימה), ההערות
  // שלהם נשארות עמוד קודם לסמן — "הערה לפני העוגן" (הוכח בפועל:
  // very_long, 6 הפרות — ראה tools/audit-note-anchors.js). התיקון: העברה
  // קדימה של הערה לעמוד הסמן שלה **בקיבולת אמיתית מצטברת** — הטור האחרון
  // של עמוד היעד + התקציב הקיים + ההערות שכבר הועברו אליו. המשכים
  // (isContinuation/split-rest) אינם מוזזים כהערות מקוריות — הם קשורים
  // לזרימת הפיצול של המקור. אין מקום חוקי ⇒ לא מעבירים בכוח — נרשם
  // diagnostic אמיתי (fn-anchor-compromise). זהות נשמרת במלואה: noteId,
  // anchorId, continuationOf, wordRange, סמן ומספור — מוקזים בלבד.
  const reconcileNotesAfterPlacement = () => {
    if (!settings['footnotes-enabled']) return { moved: 0, blocked: 0, movedList: [] };
    // מיפוי טוקן-עוגן → שורות הסמן בפועל (עמוד/טור/שורה + טקסט הסמן)
    const markerLines = new Map();
    for (const pg of pages) {
      pg.columns.forEach((col, ci) => {
        col.forEach((ln, li) => {
          const tok = ln.tokenId != null ? String(ln.tokenId) : (ln.meta && ln.meta.tokenId != null ? String(ln.meta.tokenId) : null);
          if (!tok) return;
          for (const w of (ln.words || [])) {
            const s = String(w);
            const at = s.indexOf(MARK_TAG);
            if (at < 0) continue;
            if (!markerLines.has(tok)) markerLines.set(tok, []);
            markerLines.get(tok).push({ page: pg, col: ci, li, marker: s.slice(at + MARK_TAG.length) });
          }
        });
      });
    }
    const markerRecOf = (n) => {
      const tok = n.tokenId != null ? String(n.tokenId) : (n.anchorId != null ? String(n.anchorId) : null);
      if (!tok) return null;
      const cands = markerLines.get(tok) || [];
      if (!cands.length) return null;
      const mk = String(n.marker != null ? n.marker : '');
      if (mk) {
        const hit = cands.find(m => m.marker === mk);
        if (hit) return hit;
        // טקסט הסמן לא זוהה — נפילה לסמן היחיד של הטוקן בלבד (חד-משמעי);
        // ריבוי סמנים בלי התאמה ⇒ אין זיהוי בטוח — לא מזיזים (כיוון שמרני)
        return cands.length === 1 ? cands[0] : null;
      }
      return cands.length === 1 ? cands[0] : null;
    };
    let movedCount = 0;
    const movedList = [], blocked = [];
    for (const pg of pages) {
      if (!(pg.footnotes || []).length) continue;
      const keep = [];
      let changed = false;
      for (const n of pg.footnotes) {
        const isCont = n.isContinuation === true || n.mode === 'split-rest' || n.continuationOf != null;
        const rec = isCont ? null : markerRecOf(n);
        // חוקי: אין רשומת סמן / אותו עמוד / הסמן בעמוד מוקדם — אין מה לתקן
        if (!rec || rec.page === pg || rec.page.index < pg.index) { keep.push(n); continue; }
        const target = rec.page;
        // הכנסה לפי מיקום הסמן בסדר הקריאה של עמוד היעד — הסדר החזותי במרזב
        // עוקב אחר סדר הסמנים בגוף (מדויק ודטרמיניסטי).
        // **9b.4 (תיקון שורש — סדר המרזב אחרי יישור עוגן):** נמצא ב-very_long
        // (עמ' 834): פסקה חוצת-עמודים שסמן ההערה השני שלה נחת בעמוד הבא, בעוד
        // הערה של פסקה מאוחרת כבר ישבה שם. הסריקה הישנה (מהסוף, עם ברירת
        // מחדל "בסוף") השאירה את ההערה המועברת אחרי הערה שסמנה מאוחר יותר
        // בגוף — אינברסיית סדר מרזב. הכלל הנכון: ההערה נכנסת **לפני** הרשומה
        // הראשונה שסמנה אחרי סמנה שלנו בסדר הקריאה (עמודה/שורה); רשומות
        // שאין להן זיהוי סמן או שסמנן בעמוד אחר נשארות לפנינו (התנהגות
        // שמרנית, כפי שהייתה). אין רשומה כזו ⇒ בסוף הרשימה.
        const tRec = markerRecOf(n);
        let insertAt = target.footnotes.length;
        for (let i = 0; i < target.footnotes.length; i++) {
          const other = markerRecOf(target.footnotes[i]);
          if (other && other.page === target && (other.col > tRec.col || (other.col === tRec.col && other.li > tRec.li))) {
            insertAt = i;
            break;
          }
        }
        target.footnotes.splice(insertAt, 0, n);
        recomputeFnBudget(target);
        // **קיבולת מצטברת אמיתית (U-8 — אמנה אחת):** cap מודע-תקציב לכל טור,
        // used = שורות בלבד — אותו אי-שוויון בדיוק (שורות ≤ cap−תקציב), כולל
        // הערות שהועברו קודם לאותו עמוד באותה סריקה.
        const capWithFn = colCapacityOf(target);
        const usedLast = planningUsedHeight(target.columns[target.columns.length - 1], target);
        if (usedLast <= capWithFn + CM.CAPACITY_EPS) {
          changed = true;
          movedCount++;
          movedList.push({ noteId: n.noteId || null, marker: n.marker, from: pg.index, to: target.index });
          eventLog.emit('notes-budget', 'fn-anchor-reconciled', { token: n.tokenId, marker: n.marker, from: pg.index, to: target.index }, target.index);
          trace.emit(target.index, 'note-anchor-reconciled', { token: n.tokenId, marker: n.marker, from: pg.index });
        } else {
          // אין מקום חוקי — לא מעבירים בכוח: נסיגה דטרמיניסטית + פשרה מדווחת
          target.footnotes.splice(insertAt, 1);
          recomputeFnBudget(target);
          keep.push(n);
          blocked.push({ noteId: n.noteId || null, marker: n.marker, notePage: pg.index, markerPage: target.index });
          const rec2 = ledger.create('fn-anchor-compromise', `${n.noteId || n.tokenId}@p${pg.index}`, pg.index,
            { marker: n.marker, notePage: pg.index, markerPage: target.index, reason: 'no-capacity-at-marker-page' }, 'notes-budget');
          ledger.transition(rec2.issue_id, 'persists', 'notes-budget',
            `note cannot move to marker page (capacity): marker p${target.index} > note p${pg.index}`);
        }
      }
      if (changed) {
        pg.footnotes = keep; // הוסרו רק המועברות; הסדר של הנשארות נשמר
        recomputeFnBudget(pg);
      }
    }
    if (movedCount || blocked.length) {
      eventLog.emit('notes-budget', 'fn-anchor-reconciliation', { moved: movedCount, blocked: blocked.length });
    }
    return { moved: movedCount, blocked: blocked.length, movedList };
  };
  const noteAnchorReconciliation = reconcileNotesAfterPlacement();

  // S5.1.4 + S5.1.5: הגנות AFTER every mutation, ואז לולאת נסיגה מאוחדת עם גלאי תנודה
  const assess = (page, s, lg) => runProtections(page, s, lg).violations;
  const retreat = runRetreatLoop({
    pages, settings, ledger, eventLog,
    repairFns: (() => {
      // **FX-2 (דוח 06, שלב 5):** תיקוני רישום-בלבד מסומנים mutates:false —
      // לולאת הנסיגה לא תתייג עוד הפרה סטטית (שאין לה תיקון פעיל) כ"תנודה
      // בין תיקונים מתחרים". התווית ההיסטורית היתה אבחון שקרי: שום תיקון לא רץ.
      const markNoLegalSplit = (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      };
      markNoLegalSplit.mutates = false;
      const markReadingOrderBlocked = (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'line moved backward in reading order (bug-guard P0-3; not auto-repaired)');
        }
      };
      markReadingOrderBlocked.mutates = false;
      return {
        'column-imbalance': (violations, c) => {
          for (const v of violations) {
            const pg = pages.find(p => `page#${p.index}` === v.target);
            if (pg) balancePageSafe(pg, c.settings, c.ledger);
          }
        },
        'reading-order-break': markReadingOrderBlocked,
        'widow-bottom': markNoLegalSplit,
        'orphan-top': markNoLegalSplit
      };
    })(),
    assess
  });

  return { pages, ledger, retreat, hash: layoutHash(pages), bodyHash: bodyGeometryHash(pages), trace, noteAnchorReconciliation, hostByH7 };
}

/** איזון בטוח עם rollback (REQ-BAL-09): snapshot כולל footnotes/sideNotes.
 * **EXT-8 — חלוקה גלובלית אופטימלית** (במקום טיפוס גרידי שורה-שורה):
 * מרחב המצבים החוקי = פיצולים רציפים של רצף הקריאה; המינימום הגלובלי של |lH−rH|
 * נמצא ב-O(n) (הוכחה ב-balancing.optimalSplit). סדר קריאה נשמר מבנית.
 * **U-8 (19.11):** הקיבולת מודעת-תקציב לכל טור; ה-|Δ| על שורות בלבד — התקציב
 * משותף לשני הטורים (המרזב פרוש על רוחב תיבת-התוכן כולה). */
function balancePageSafe(page, settings, ledger) {
  const deltaOf = () => {
    // **U-8:** התקציב משותף לשני הטורים (המרזב פרוש על כולם) — הוא אינו
    // משפיע על הפרש האיזון ואינו נכנס לחישוב ה-|Δ|.
    const hh = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    return Math.abs(hh(page.columns[0]) - hh(page.columns[1]));
  };
  const maxDelta = settings['imbalance-max-delta-px'];
  if (deltaOf() <= maxDelta) return true; // כבר מאוזן — אין התערבות (יציבות פריסה)
  if (!page.columns || page.columns.length < 2) return false;
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf — כולל הפס החוצה־טורים
  // (בעבר חושב מ-contentBox.height גולמי ⇒ איזון שגלש מתחת לפס בעמודי H2).
  // **U-8 (19.11):** תקציב ההערות בתוך cap לכל טור — extraLast הוסר (היה
  // מכפיל את התקציב על הטור האחרון).
  const cap = colCapacityOf(page);
  const best = optimalSplit(page.columns, { cap });
  if (!best || best.k === page.columns[0].length) {
    // **EXT-8:** אין פיצול חוקי, או שהנוכחי כבר האופטימלי הגלובלי — הפרש שנותר
    // מעל הסף הוא **פשרה מתועדת**: שלמות פסקה (הימנעות מיתום/ווידוא בגבול
    // התפר) גוברת על Δ≤5px (למשל: פסקה בת 15 שורות שנכנסת שלמה לטור אחד).
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index,
      { reason: best ? 'at-optimum' : 'capacity', delta: Math.round(deltaOf()), bestK: best ? best.k : null },
      'balance');
    ledger.transition(rec.issue_id, 'correction-blocked', 'balance',
      best ? 'global optimum reached: any further move creates widow/orphan at the seam (paragraph integrity preferred over Δ-threshold)'
           : 'hard reject: no capacity-legal split exists');
    return false;
  }
  const snapshot = { cols: page.columns.map(c => c.slice()), fn: page.footnotes.slice(), sn: page.sideNotes.slice() };
  const seq = [...page.columns[0], ...page.columns[1]];
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  // **FX-6 (פרוסה 2):** נרמול פערים אחרי הפיצול מחדש — ראש כל טור אינו
  // נושא פער-כניסה (GAP_HEAD_POLICY). נעשה לפני בדיקת החריגה כדי שההשוואת
  // קיבולת תראה את הגיאומטריה האמיתית שתוקרן (כולל הפערים שנותרו בגוף הטור).
  normalizeColumnGaps(page.columns[0]);
  normalizeColumnGaps(page.columns[1]);
  // hard reject: חריגת קיבולת אחרי ההחלפה (הגנה כפולה — optimalSplit כבר מסנן) → rollback מלא
  // **S5.2 (P-2) + FX-6:** קיבולת אפקטיבית פר-טור (פס + תקציב על הטור האחרון + פערי
  // בלוקים) — מקור יחיד; הפערים קבועים ואינם מתמתחים עם aqStretch.
  const overflows = (c, ci) => {
    const hh = c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
    return hh > colCapacityOf(page, { colIndex: ci }) + 0.5;
  };
  if (page.columns.some(overflows)) {
    page.columns = snapshot.cols; page.footnotes = snapshot.fn; page.sideNotes = snapshot.sn;
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity' }, 'balance');
    ledger.transition(rec.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after move (not soft ×2000)');
    return false;
  }
  return true;
}

/** בחירת נקודת פיצול עם הגנות widow/orphan (≥2 שורות לכל צד). */
function findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings = {}, candidatesFn = null, trace = null) {
  const cap = colCapacity(cur.template, cur);
  const free = cap - usedHeight(cur.columns[cur.columns.length - 1], cur);
  // **FX-5 (פרוסה 2 — השלמת תיקון השורש):** maxFit נספר מהגבהים האמיתיים
  // (heightPx מצטבר + פער הכניסה של הבלוק) מול המקום הפנוי — לא מהמרת
  // lineH. ההמרה ההיסטורית (floor(free/lineH)) פסלה פיצולים חוקיים בכל בלוק
  // שאינו אחיד-גבהים (כותרות/פסקאות-גוף גבוהות): maxFit נמוך מהאמת ⇒ החלון
  // התכווץ ⇒ הזזה מלאה על פיצול שהיה נכנס.
  const gap0 = blockGapPx(settings, lineH);
  let maxFit = 0, acc = 0;
  for (let i = 0; i < blk.lines.length; i++) {
    const add = (i === 0 ? gap0 : 0) + (blk.lines[i].heightPx || 0);
    if (acc + add > free + CM.CAPACITY_EPS) break;
    acc += add; maxFit = i + 1;
  }
  // **שלב 5 (#16) + פרוסה 2 (מקור יחיד):** חלון הפיצול החוקי —
  // constraint-matrix.legalSplitWindow: ≥2 שורות לכל צד **והחלק הראשון
  // נכנס פיזית** (maxFit). null ⇒ אין פיצול חוקי → הזזה מלאה.
  const win = CM.legalSplitWindow(blk.lines.length, maxFit);
  if (!win) {
    if (trace) trace.emit(cur.index, 'split-none', { token: blk.tokenId, lines: blk.lines.length, maxFit, free: Math.round(free) });
    return 0; // אין פיצול חוקי → הזזה מלאה
  }

  if (candidatesFn) {
    const cands = candidatesFn(blk, maxFit, cap, settings, ledger);
    if (cands.length) {
      eventLog.emit('protections', 'candidate-split', { token: blk.tokenId, at: cands[0].cut, score: cands[0].score });
      if (trace) trace.emit(cur.index, 'split-candidate', {
        token: blk.tokenId, cut: cands[0].cut, score: cands[0].score,
        window: [win.lo, win.hi], candidates: cands.length,
        rejected: (cands.rejections || []).length
      });
      return cands[0].cut;
    }
    if (trace) trace.emit(cur.index, 'split-candidates-exhausted', { token: blk.tokenId, window: [win.lo, win.hi], rejected: (cands.rejections || []).length });
  }
  eventLog.emit('protections', 'legal-split', { token: blk.tokenId, at: maxFit });
  if (trace) trace.emit(cur.index, 'split-legal-maxfit', { token: blk.tokenId, at: maxFit, window: [win.lo, win.hi] });
  return maxFit;
}

module.exports = { planPages, layoutHash, bodyGeometryHash, lineTokenId, moveLineForward, balancePageSafe };
