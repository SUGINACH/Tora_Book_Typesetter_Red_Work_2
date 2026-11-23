// src/engine/decoration/ornament-plan.js — L5 decoration pass: ornaments/dividers/shaar deco (S8, REQ-ORN-01..04)
'use strict';

/**
 * פאס העיטורים (L5) — סינכרוני, **אסור לו לשנות גובה שנמדד (invariant T1)**.
 * כל העיטורים הם overlay-rects על העמוד (page.decorations) — לעולם לא נוגעים
 * ב־page.columns. הניטרליות מוכחת ע"י bodyGeometryHash לפני/אחרי (D-47).
 *
 * **לקחי העבר שנסגרים כאן:**
 * - F-08: כל עיטור שצורך גובה חייב להיות בגודלו הסופי **לפני** בדיקת ההתאמה —
 *   כאן ההתאמה (fits/chapterEndOrnamentFit) רצה על הממדים הסופיים בלבד;
 *   אין פוסט־פרוסס מאוחר ש"מגלה" גובה שלא תוקצב.
 * - F-09: מקור יחיד לממדים — ה־rect שמחושב כאן; הרנדרר מצייר ממנו בלבד.
 * - F-21: סימטריית מרווחים אפקטיביים של עיטורי H2 — נבדקת כ‑ornament-asymmetry
 *   על המיקומים בפועל (לא על ערכי CSS).
 *
 * **מיני־קטלוג ממצאים (kinds):** ornament-overflow / ornament-overlap / ornament-asymmetry —
 * לכל אחד מייצר בפועל (בדיקת רגישות מוכיחה שהזרקת פגם ⇒ ממצא נרשם; אנטי־קישוט).
 */

const {
  fitOrnamentToText, chapterEndOrnamentFit, h2OrnamentScope, h2OrnamentMarginsPx,
  sideOrnamentOffsetY, sideOrnamentLiftPx, assertSingleSourceSizing
} = require('./ornament-fit');
const { headingDividerDecision, shaarDividerDecision, createDividerCounters } = require('./dividers');
const { ornamentInk } = require('./ornament-ink');
const { colCapacityOf } = require('../layout/column-flow'); // **RC-F3a (i005):** קיבולת אחת — מודעת לתקציב ההערות ולשמורות // **השלמת שלב 6 (§6.1-6/§6.1-10):** זהות הדיו נקבעת בהצבה — המקרינים צורכים

/** גובה ברירת־מחדל לעיטור סיום פרק (em של גוף הטקסט). */
const ORN_NATURAL_W_EM = 4, ORN_NATURAL_H_EM = 1.2;
const DIVIDER_H_PX = 2;
const H2_ORN_W_EM = 3, H2_ORN_H_EM = 0.6;

function bodyFontPx(settings) {
  return Math.round(settings['body-font-size-pt'] * 96 / 72 * 100) / 100;
}

/** סכום גובה שורות טור — **סמנטיקת רינדור** (balancing.usedHeight): גובה
 *  שורה × aqStretch + פער הבלוקים (gapBeforePx). **RC-F3a (i005):** עד כאן
 *  נספרו גבהים גולמיים בלבד — המתיחה (G5) והפערים לא נכללו ⇒ עיטור
 *  סיום-הפרק מוקם לפי תחתית מדומה ונחת על טקסט מתוח (נמדדו 47 חפיפות
 *  בייצוא עם העיטורים פעילים; דוח v4/F3). */
function colUsed(colLines) {
  return colLines.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
}

/** מדידת רוחב טקסט שורה דרך MeasureAPI (מדידת JS — CSS fit-content נכשל; REQ-ORN-01). */
function lineWidthPx(ln, measureFn) {
  const text = (ln.words || []).join(' ');
  try { return measureFn(text); } catch { return 0; }
}

/**
 * הפאס המלא. מופעל מהצינור ב־CP4 אחרי הערות הצד.
 * @param {Array} pages - תוצר dp-planner (+ shaar/custom pages שהוכנסו מבנית)
 * @param {object} settings
 * @param {function} measureFn - (text, sizePx?) => widthPx
 * @param {object} io - { ledger, eventLog }
 * @returns {{planted:number, rejected:Array, counters:object, findings:object}}
 */
function planPageOrnaments(pages, settings, measureFn, io = {}) {
  const ledger = io.ledger, eventLog = io.eventLog;
  const counters = createDividerCounters(); // rollback-aware, reset per document
  const planted = { chapterEnd: 0, headingDivider: 0, h2Top: 0, h2Bottom: 0, h2Side: 0, h3Side: 0, shaarDivider: 0 };
  const rejected = [];
  const fontPx = bodyFontPx(settings);
  const h2Margins = h2OrnamentMarginsPx(fontPx);
  const scope = h2OrnamentScope(settings);

  // עמודי סוף־פרק: גבול פרק (chapterOpening) מצביע אחורה על העמוד האחרון
  // שאינו מבני (עמודי שער/מותאמים אינם עמודי סוף־פרק — אין בהם תוכן פרק).
  const isStructural = (p) => Boolean(p.isShaar) || p.type === 'custom';
  const chapterEndPages = new Set();
  pages.forEach((p, i) => {
    if (p.chapterOpening && i > 0) {
      for (let j = i - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }
    }
  });
  for (let j = pages.length - 1; j >= 0; j--) { if (!isStructural(pages[j])) { chapterEndPages.add(j); break; } }

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    page.decorations = page.decorations || [];
    const tpl = page.template;
    if (!tpl || !tpl.columns) continue;

    // ---------- 1. עיטורי H2 (עמודי פתיחת סימן; REQ-ORN-01/02, F-08/F-09/F-21) ----------
    // **FWD-1:** כותרת H2 במודל full-width מוצבת בפס חוצה־טורים (page.spanning)
    // ולא בטור — העיטורים נמדדים מהפס. H2 במודל regular נשאר בטור (מסלול עמוד).
    // **F-08:** ההזמנה (orn.topPx/bottomPx) כבר נכנסה לגובה הפס/תיבות השורות בזמן
    // הפריסה — כאן רק מציבים את העיטור בתוך האזור שהוזמן. אין גלישה ואין חפיפה.
    if (page.type === 'sign-open' && scope.any) {
      const spanLines = page.spanning && page.spanning.lines.length
        ? page.spanning.lines.filter(l => l.kind === 'heading' && l.level === 2)
        : [];
      const col = page.columns[0] || [];
      let h0 = -1;
      if (spanLines.length) {
        h0 = 0; // הפס מתחיל בראש תיבת התוכן
      } else {
        for (let i = 0; i < col.length; i++) {
          if (col[i].kind === 'heading' && col[i].level === 2) { h0 = i; break; }
        }
      }
      if (h0 >= 0) {
        const titleLines = spanLines.length ? spanLines : (function () {
          let hEnd = h0;
          while (hEnd + 1 < col.length && col[hEnd + 1].kind === 'heading' && col[hEnd + 1].level === 2) hEnd++;
          return col.slice(h0, hEnd + 1);
        })();
        const colX = tpl.columns[0].x, colW = tpl.columns[0].w;
        const titleW = Math.max(1, ...titleLines.map(ln => lineWidthPx(ln, measureFn)));
        // מקור יחיד למידות (F-09): ההזמנה שחושבה בזמן הפריסה — לא חישוב כפול כאן
        const orn = (spanLines.length && page.spanning.orn) || titleLines[0].h2Orn || null;
        const w = orn ? orn.ornW : Math.round(H2_ORN_W_EM * fontPx);
        const h = orn ? orn.ornH : Math.round(H2_ORN_H_EM * fontPx);
        const ornMargins = orn ? orn.margins : h2Margins;
        // הכותרת מתחילה אחרי ההזמנה העליונה (פס: titleTopPadPx; טור: padding שורה ראשונה)
        const topPad = spanLines.length ? (page.spanning.titleTopPadPx || 0) : (titleLines[0].h2OrnPadTop || 0);
        const linesBefore = spanLines.length ? 0 : col.slice(0, h0).reduce((s, ln) => s + (ln.heightPx || 0), 0);
        // **RC-F2a (i005 — מקור עוגן אחד עם ההקרנה):** ההקרנה (materialize) מציבה
        // את שורות הפס ב-bandTopPx המכויל (עוגן אזור-h2 בתבנית — Iteration-003),
        // ושורה עם yPx נעוצה בו; החישוב כאן השתמש ב-contentBox.top בלבד ⇒ תיבת
        // הכותרת של העיטור נפלה ~60px מתחת לכותרת בפועל, ועיטור ה-h2-bottom נחת
        // בתוך הגוף (נמדד: עיטור y=433px מול כותרת בעוגן 344.05px; 78/84 חפיפות
        // בדוח v4/F2). כעת אותו מסלול-y כמו materialize: bandTopPx → topPad →
        // yPx לכל שורה. תיבת הכותרת לעיטור = תיבת הטקסט בלבד (בלי ריפודי ההזמנה
        // h2OrnPadTop/Bottom — ההזמנה היא מקום העיטור עצמו, F-08).
        let titleTop;
        let titleBottom;
        let reservedPadBottom = 0;
        if (spanLines.length) {
          let y = (page.spanning.bandTopPx != null ? page.spanning.bandTopPx : tpl.contentBox.top) + topPad;
          titleTop = y + (spanLines[0].h2OrnPadTop || 0);
          for (const ln of spanLines) {
            if (ln.yPx != null) y = ln.yPx;
            y += ln.heightPx || 0;
          }
          // **RC-F2a (המשך):** ההזמנה התחתונה של פס FWD-1 חיה ב-spanning.orn.bottomPx
          // (לא על השורה — השורות שם לא נושאות ריפוד); ההזמנה של H2 בטור חיה
          // על h2OrnPadBottom של השורה האחרונה. מקור אחד לכל נתיבי ה-H2.
          const ornBottomPx = (page.spanning.orn && page.spanning.orn.scope && page.spanning.orn.scope.signBottom)
            ? (page.spanning.orn.bottomPx || 0) : 0;
          reservedPadBottom = Math.max(ornBottomPx, spanLines[spanLines.length - 1].h2OrnPadBottom || 0);
          titleBottom = y - (spanLines[spanLines.length - 1].h2OrnPadBottom || 0);
          if (titleBottom < titleTop) titleBottom = titleTop;
        } else {
          // תיבת הטקסט בלבד — ריפודי ההזמנה אינם חלק מהכותרת (F-08)
          const padTop = titleLines[0].h2OrnPadTop || 0;
          const padBot = titleLines[titleLines.length - 1].h2OrnPadBottom || 0;
          titleTop = tpl.contentBox.top + linesBefore + padTop;
          titleBottom = titleTop + titleLines.reduce((s, ln) => s + (ln.heightPx || 0), 0) - padTop - padBot;
          reservedPadBottom = padBot;
          if (titleBottom < titleTop) titleBottom = titleTop;
        }
        const titleH = titleBottom - titleTop;
        const cx = colX + colW / 2;

        if (scope.signTop) {
          const y = titleTop - ornMargins.top - h; // בתוך האזור שהוזמן (F-08)
          // **RC-F2a (i005 — שולי דיו):** הגליפים יכולים לבצבץ ~2px מעל תיבת
          // השורה (bbox של הגופן — נמדד p634: דיו הכותרת ב-titleTop−2.1). בלי
          // מרווח נשימה העיטור העליון נוגע בדיו — נדרשים ≥2px.
          if (titleTop - (y + h) < 2) {
            rejected.push({ page: pi, slot: 'h2-top', reason: 'no-room-above', ornH: h, titleTop: Math.round(titleTop) });
            if (ledger) ledger.create('ornament-rejected', `h2-top@p${pi}`, pi, { reason: 'no-room-above', ornH: h }, 'ornaments');
          } else {
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-top', kindStyle: settings['h2-orn-top'], x: Math.round(cx - w / 2), y, w, h, marginGapTop: titleTop - (y + h) }, rejected, pi, settings, { ledger }, {
            naturalW: Math.round(H2_ORN_W_EM * fontPx), naturalH: Math.round(H2_ORN_H_EM * fontPx),
            scale: orn ? (orn.scale || 1) : 1, fitMode: 'fit-to-text', fitReason: settings['h2-orn-fit-to-text'] !== false ? 'fit-to-text' : 'disabled',
            anchorTokenId: titleLines[0] && (titleLines[0].tokenId != null ? titleLines[0].tokenId : (titleLines[0].meta && titleLines[0].meta.tokenId)),
            semantic: 'above-heading', relativeTo: 'heading',
            reservationMode: 'row-padding', reservedPx: topPad,
            reservationWhere: spanLines.length ? 'spanning.titleTopPadPx' : 'line.h2OrnPadTop'
          });
          planted.h2Top++;
          }
        }
        if (scope.signBottom) {
          const y = titleBottom + ornMargins.bottom; // בתוך ההזמנה התחתונה
          // **RC-F2a (i005 — הכלה בתוך ההזמנה שנקבעה בפריסה):** תחום העיטור התחתון
          // הוא ריפוד ההזמנה עצמו (h2OrnPadBottom — F-08). בפס ממוקם-עוגן (IMUD —
          // bandTopPx) הזרימה קבועה ב-contentBox.top ואינה זזה מהריפוד: שם
          // ההזמנה חייבת להיכנס מעל ראש הזרימה (נמדד: אין מקום — האזור מלא;
          // דחייה מתועדת). אין מקום ⇒ דחייה, לא חפיפה שקטה עם הגוף.
          const allowedBottom = (spanLines.length && page.spanning.bandTopPx != null)
            ? Math.min(titleBottom + reservedPadBottom, tpl.contentBox.top - 1)
            : Math.min(titleBottom + reservedPadBottom + 0.5, tpl.contentBox.bottom);
          if (y + h > allowedBottom) {
            rejected.push({ page: pi, slot: 'h2-bottom', reason: 'no-room-below', ornH: h, allowedBottom: Math.round(allowedBottom), y: Math.round(y) });
            if (ledger) ledger.create('ornament-rejected', `h2-bottom@p${pi}`, pi, { reason: 'no-room-below', ornH: h, allowedBottom: Math.round(allowedBottom) }, 'ornaments');
          } else {
          // ההזמנה התחתונה בפועל: בפס חוצה-טורים — bottomPx מההזמנה שנקבעה בפריסה
          // (spanning.heightPx = topPad+bandH+bottomPad); בטור — padding השורה.
          const bottomPadActual = spanLines.length
            ? (orn && orn.scope && orn.scope.signBottom ? orn.bottomPx : 0)
            : (titleLines[titleLines.length - 1].h2OrnPadBottom || 0);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-bottom', kindStyle: settings['h2-orn-bottom'], x: Math.round(cx - w / 2), y, w, h, marginGapBottom: y - titleBottom }, rejected, pi, settings, { ledger }, {
            naturalW: Math.round(H2_ORN_W_EM * fontPx), naturalH: Math.round(H2_ORN_H_EM * fontPx),
            scale: orn ? (orn.scale || 1) : 1, fitMode: 'fit-to-text', fitReason: settings['h2-orn-fit-to-text'] !== false ? 'fit-to-text' : 'disabled',
            anchorTokenId: titleLines[0] && (titleLines[0].tokenId != null ? titleLines[0].tokenId : (titleLines[0].meta && titleLines[0].meta.tokenId)),
            semantic: 'below-heading', relativeTo: 'heading',
            reservationMode: 'row-padding', reservedPx: bottomPadActual,
            reservationWhere: spanLines.length ? 'spanning.heightPx (bottomPad)' : 'line.h2OrnPadBottom'
          });
          planted.h2Bottom++;
          }
        }
        if (scope.titleSide) {
          // צדדיים לכותרת: התאמת גובה לגובה הכותרת + הרמה אופטית −0.08em (שיעור V4)
          const sideH = Math.min(h, Math.round(titleH));
          const lift = sideOrnamentLiftPx(fontPx);
          const gap = Math.round(fontPx * 0.35);
          const sideDecl = {
            naturalW: Math.round(H2_ORN_W_EM * fontPx), naturalH: Math.round(H2_ORN_H_EM * fontPx),
            scale: h > 0 ? sideH / h : 1, fitMode: 'fit-to-heading-height', fitReason: 'side-height-capped-by-title',
            anchorTokenId: titleLines[0] && (titleLines[0].tokenId != null ? titleLines[0].tokenId : (titleLines[0].meta && titleLines[0].meta.tokenId)),
            semantic: 'beside-heading', relativeTo: 'heading',
            reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
          };
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-right', kindStyle: settings['h2-orn-side'], x: Math.round(colX + colW - titleW - gap - w), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings, { ledger }, sideDecl);
          pushOrnament(page, { kind: 'h2-ornament', slot: 'h2-side-left', kindStyle: settings['h2-orn-side'], x: Math.round(colX + titleW + gap), y: titleTop + sideOrnamentOffsetY(titleH, sideH) + lift, w, h: sideH }, rejected, pi, settings, { ledger }, sideDecl);
          planted.h2Side += 2;
        }
      }
    }

    // ---------- 2. עיטורי צד H3 (REQ-ORN-01: התאמת גובה לשורה) ----------
    if ((settings['h3-side-orn'] || 'none') !== 'none') {
      const sideH = Math.round(Number(settings['h3-side-orn-height-em']) * fontPx);
      // **03.11(ד):** H3 במצב full-width חיה בפס חוצה־טורים (span_1col של המקור) —
      // עיטורי הצד נשתלים משני צדי שורת הפס ברוחב התוכן המלא.
      if (page.spanning && page.spanning.lines.length) {
        const bln = page.spanning.lines[0];
        if (bln.kind === 'heading' && bln.level === 3 && bln.meta && bln.meta.firstOfBlock) {
          const left = Math.min(...tpl.columns.map(c => c.x));
          const right = Math.max(...tpl.columns.map(c => c.x + c.w));
          const lineH = bln.heightPx || fontPx;
          const lift = sideOrnamentLiftPx(fontPx);
          const yy = tpl.contentBox.top + sideOrnamentOffsetY(lineH, sideH) + lift;
          const wSide = Math.round(fontPx * 1.2);
          const h3Decl = {
            naturalW: wSide, naturalH: sideH,
            scale: sideH > 0 ? Math.min(sideH, lineH) / sideH : 1, fitMode: 'fit-to-line', fitReason: 'side-height-capped-by-line',
            anchorTokenId: bln.tokenId != null ? bln.tokenId : (bln.meta && bln.meta.tokenId),
            semantic: 'beside-heading', relativeTo: 'heading',
            reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
          };
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(right - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings, { ledger }, h3Decl);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(left), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings, { ledger }, h3Decl);
          planted.h3Side += 2;
        }
      }
      const nCols = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית (טור פנטום)
      for (let c = 0; c < nCols; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || ln.level !== 3) continue;
          if (!ln.meta || !ln.meta.firstOfBlock) continue; // רק ראשית כותרת — לא כל שורה
          const yTop = tpl.contentBox.top + col.slice(0, i).reduce((s, l) => s + (l.heightPx || 0), 0);
          const lineH = ln.heightPx || fontPx;
          const lift = sideOrnamentLiftPx(fontPx);
          const yy = yTop + sideOrnamentOffsetY(lineH, sideH) + lift;
          const wSide = Math.round(fontPx * 1.2);
          const h3ColDecl = {
            naturalW: wSide, naturalH: sideH,
            scale: sideH > 0 ? Math.min(sideH, lineH) / sideH : 1, fitMode: 'fit-to-line', fitReason: 'side-height-capped-by-line',
            anchorTokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
            semantic: 'beside-heading', relativeTo: 'heading',
            reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
          };
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-right', kindStyle: settings['h3-side-orn'], x: Math.round(colX + colW - wSide), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings, { ledger }, h3ColDecl);
          pushOrnament(page, { kind: 'h3-side-ornament', slot: 'h3-side-left', kindStyle: settings['h3-side-orn'], x: Math.round(colX), y: yy, w: wSide, h: Math.min(sideH, lineH) }, rejected, pi, settings, { ledger }, h3ColDecl);
          planted.h3Side += 2;
        }
      }
    }

    // ---------- 3. מפרידי כותרות H3–H6 (REQ-ORN-04: fits() בכל אתרי ההוספה) ----------
    // **03.11(ד):** כותרת H3–H6 בפס חוצה־טורים (full-width) — מפריג מתחת לפס,
    // ממורכז, ברוחב יחסי לרוחב התוכן (אותו סגנון כמו בטור).
    if (settings['heading-dividers-h3-h6'] && page.spanning && page.spanning.lines.length) {
      const bln = page.spanning.lines[page.spanning.lines.length - 1];
      if (bln.kind === 'heading' && bln.level >= 3 && bln.level <= 6
        && page.columns.every(c => !c.some(l => l.kind === 'heading' && l.tokenId === bln.tokenId))) {
        const left = Math.min(...tpl.columns.map(c => c.x));
        const right = Math.max(...tpl.columns.map(c => c.x + c.w));
        const fullW = right - left;
        const used = page.spanning.heightPx || 0;
        const remaining = tpl.contentBox.height - used;
        const dec = headingDividerDecision(settings, remaining, DIVIDER_H_PX, {
          columnLinesBefore: [bln], colIdx: 0, pageIndex: pi, tokenId: (bln.meta && bln.meta.tokenId) || bln.tokenId, band: true
        });
        if (dec.insert) {
          counters.record(dec.rollbackKey);
          const wDiv = Math.min(Math.round(fullW * 0.5), Math.round(fontPx * 6));
          const y = tpl.contentBox.top + used - Math.round((bln.heightPx || 0) / 2) - 1;
          pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${bln.level}`, kindStyle: 'thin', x: Math.round(left + (fullW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi, settings, { ledger }, {
            naturalW: wDiv, naturalH: DIVIDER_H_PX, scale: 1, fitMode: 'fixed', fitReason: 'fixed-divider',
            anchorTokenId: (bln.meta && bln.meta.tokenId) || bln.tokenId,
            semantic: 'below-heading', relativeTo: 'heading',
            reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
          });
          planted.headingDivider++;
        } else if (dec.why !== 'disabled' && dec.why !== 'column-head-or-empty') {
          rejected.push({ page: pi, kind: 'heading-divider', why: dec.why });
        }
      }
    }
    if (settings['heading-dividers-h3-h6']) {
      const nColsD = Math.min(page.columns.length, tpl.columns.length); // יישור לתבנית
      for (let c = 0; c < nColsD; c++) {
        const col = page.columns[c];
        const colX = tpl.columns[c].x, colW = tpl.columns[c].w;
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.kind !== 'heading' || !(ln.level >= 3 && ln.level <= 6)) continue;
          // **תיקון שורש (ביקורת 03.11): מפריד אחד לכל כותרת — מתחת לשורתה
          // האחרונה. בעבר הוצב מפריד בכל שורה של כותרת גולשת (5 שורות ⇒ 5 מפרידים
          // עם מפתח rollback זהה ⇒ התנגשות מונים). השורה האחרונה = אין שורת
          // המשך לאותו tokenId בטור זה, ואין המשך בראש הטור הבא.
          const continuesInCol = !!(col[i + 1] && col[i + 1].kind === 'heading' && col[i + 1].tokenId === ln.tokenId);
          const continuesNextCol = !!(page.columns[c + 1] && page.columns[c + 1][0]
            && page.columns[c + 1][0].kind === 'heading' && page.columns[c + 1][0].tokenId === ln.tokenId);
          if (continuesInCol || continuesNextCol) continue;
          const before = col.slice(0, i + 1); // כולל הכותרת — המשמרת בודקת ראש־טור/ריק
          const usedSoFar = before.reduce((s, l) => s + (l.heightPx || 0), 0);
          const remaining = tpl.contentBox.height - usedSoFar;
          const dec = headingDividerDecision(settings, remaining, DIVIDER_H_PX, {
            columnLinesBefore: before, colIdx: c, pageIndex: pi, tokenId: (ln.meta && ln.meta.tokenId) || ln.tokenId
          });
          if (dec.insert) {
            counters.record(dec.rollbackKey);
            const y = tpl.contentBox.top + usedSoFar - Math.round((ln.heightPx || 0) / 2) - 1;
            const wDiv = Math.min(Math.round(colW * 0.5), Math.round(fontPx * 6));
            pushOrnament(page, { kind: 'heading-divider', slot: `hdr-div-l${ln.level}`, kindStyle: 'thin', x: Math.round(colX + (colW - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX, rollbackKey: dec.rollbackKey }, rejected, pi, settings, { ledger }, {
              naturalW: wDiv, naturalH: DIVIDER_H_PX, scale: 1, fitMode: 'fixed', fitReason: 'fixed-divider',
              anchorTokenId: (ln.meta && ln.meta.tokenId) || ln.tokenId,
              semantic: 'below-heading', relativeTo: 'heading',
              reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
            });
            planted.headingDivider++;
          } else if (dec.why !== 'disabled' && dec.why !== 'column-head-or-empty') {
            rejected.push({ page: pi, kind: 'heading-divider', why: dec.why });
          }
        }
      }
    }

    // ---------- 4. מפרידי שערים (REQ-ORN-04) ----------
    {
      const dec = shaarDividerDecision(page.type, settings);
      if (dec.insert) {
        const wDiv = Math.round(tpl.columns[0].w * 0.4);
        const y = tpl.contentBox.bottom - Math.round(fontPx * 2);
        pushOrnament(page, { kind: 'shaar-divider', slot: `shaar-div-${page.type}`, kindStyle: dec.style, x: Math.round(tpl.columns[0].x + (tpl.columns[0].w - wDiv) / 2), y, w: wDiv, h: DIVIDER_H_PX }, rejected, pi, settings, { ledger }, {
          naturalW: wDiv, naturalH: DIVIDER_H_PX, scale: 1, fitMode: 'fixed', fitReason: 'fixed-divider',
          anchorTokenId: null, semantic: 'page-bottom', relativeTo: 'page',
          reservationMode: 'overlay', reservedPx: 0, reservationWhere: null
        });
        planted.shaarDivider++;
      }
    }

    // ---------- 5. עיטור סיום־פרק (REQ-ORN-03: התאמה לתקציב שנותר; לא חוסם) ----------
    if (chapterEndPages.has(pi) && (settings['chapter-end-ornament'] || 'none') !== 'none') {
      // הטור האחרון הלא־ריק — שם נותר התקציב
      let last = -1;
      for (let c = 0; c < Math.min(page.columns.length, tpl.columns.length); c++) if (page.columns[c].length) last = c;
      if (last >= 0) {
        const col = page.columns[last];
        const used = colUsed(col);
        // התקציב הפנוי בפועל — **RC-F3a (i005): קיבולת אחת (colCapacityOf)** —
        // בכפוף לפס החוצה־טורים (FWD-1), לתקציב ההערות (U-8: המרזב חוצה-רוחב —
        // עד כאן העיטור נחת בתוך המרזב; נמדד p260: עיטור y=636 מול הערות עד y=773)
        // ולשמורות האחידות.
        const cap = colCapacityOf(page, { colIndex: last });
        const budget = cap - used - Math.round(fontPx * 0.5);
        const wPx = Number(settings['chapter-end-ornament-w-em']) * fontPx || ORN_NATURAL_W_EM * fontPx;
        const hPx = Number(settings['chapter-end-ornament-h-em']) * fontPx || ORN_NATURAL_H_EM * fontPx;
        const fit = chapterEndOrnamentFit(settings['chapter-end-ornament'], wPx, hPx, budget);
        if (fit.placed) {
          const colX = tpl.columns[last].x, colW = tpl.columns[last].w;
          // **RC-F3a (i005 — עוגן זרימה מתחת לפס):** הקיבולת מנכה את הפס החוצה-
          // טורים (colCapacityOf) אך עוגן ה-y שכח להוסיף אותו — הטור מתחיל
          // ב-contentBox.top + spanning.heightPx (כמו spanOffset בהקרנה).
          // נמדד p260: עיטור ב-748px בעוד התוכן מסתיים ב-794 (פס 60px).
          const flowTop = tpl.contentBox.top + (page.spanning && page.spanning.heightPx ? page.spanning.heightPx : 0);
          pushOrnament(page, {
            kind: 'chapter-end-ornament', slot: 'chapter-end', kindStyle: settings['chapter-end-ornament'],
            x: Math.round(colX + (colW - fit.wPx) / 2), y: Math.round(flowTop + used + (budget - fit.hPx) / 2),
            w: fit.wPx, h: fit.hPx
          }, rejected, pi, settings, { ledger }, {
            naturalW: wPx, naturalH: hPx,
            scale: fit.scale, fitMode: 'fit-to-budget', fitReason: fit.reason,
            anchorTokenId: null, semantic: 'column-end', relativeTo: 'column',
            reservationMode: 'column-budget', reservedPx: fit.hPx, reservationWhere: 'remaining-column-budget'
          });
          planted.chapterEnd++;
        } else if (fit.reason !== 'kind-none' && fit.reason !== 'kind-unknown') {
          rejected.push({ page: pi, kind: 'chapter-end-ornament', why: fit.reason, budget: Math.round(budget) });
          // דחייה מתועדת — לא גנוזה (כלל "אין השבתת אבחון"): ledger במקום ממצא עיטור
          if (ledger) {
            const rec = ledger.create('ornament-rejected', `p${pi}`, pi, { kind: 'chapter-end', reason: fit.reason, budgetPx: Math.round(budget) }, 'ornaments');
            ledger.transition(rec.issue_id, 'persists', 'ornaments', `chapter-end ornament not placed: ${fit.reason}`);
          }
        }
      }
    }
  }

  // ---------- 6. אודיט עיטורים: מייצרים אמיתיים (שער S8.2) ----------
  const findings = auditOrnaments(pages, ledger);

  if (eventLog) {
    eventLog.emit('decorations', 'ornament-pass', {
      planted: { ...planted, total: Object.values(planted).reduce((a, b) => a + b, 0) },
      dividersRecorded: counters.count(),
      rejected: rejected.length,
      findings: { overflow: findings.overflow.length, overlap: findings.overlap.length, asymmetry: findings.asymmetry.length }
    });
  }
  return { planted, rejected, counters, findings };
}

/** **03.11 (EXT-14):** הפניית תמונה לעיטור מסוג 'image' — מההגדרות לפי מיקום העיטור.
 * הערך בהגדרות הוא הפניה מלאה 'imud:<collection>:<id>' (נבנה ע"י ה-UI בבחירת עיצוב);
 * הרינדור פותר אותה דרך asset-registry. גישה מילולית לכל מפתח — סורק הצרכנים
 * (S4.1.4) מוכיח שכל הגדרה באמת נקראת כאן. */
function imageRefForOrnament(orn, settings) {
  if (!orn || orn.kindStyle !== 'image' || !settings) return null;
  const slot = String(orn.slot || '');
  if (slot.startsWith('h2-top')) return settings['imud-orn-top'] || null;
  if (slot.startsWith('h2-bottom')) return settings['imud-orn-bottom'] || null;
  if (slot.startsWith('h2-side') || slot.startsWith('h3-side')) return settings['imud-orn-side'] || null;
  if (slot.startsWith('chapter-end')) return settings['imud-chapter-end'] || null;
  if (slot.startsWith('hdr-div') || slot.startsWith('shaar-div')) return settings['imud-divider'] || null;
  return null;
}

/** מפתח ההגדרה שממנו נולד העיטור — חלק מהצהרת הזהות והמקור (§6.1-6). */
function sourceSettingKeyOf(orn) {
  const slot = String((orn && orn.slot) || '');
  if (slot.startsWith('h2-top')) return 'h2-orn-top';
  if (slot.startsWith('h2-bottom')) return 'h2-orn-bottom';
  if (slot.startsWith('h2-side')) return 'h2-orn-side';
  if (slot.startsWith('h3-side')) return 'h3-side-orn';
  if (slot.startsWith('chapter-end')) return 'chapter-end-ornament';
  if (slot.startsWith('hdr-div')) return 'heading-dividers-h3-h6';
  if (slot.startsWith('shaar-div')) return 'shaar-divider-style';
  return null;
}

/**
 * **השלמת חוזה העיטורים (שלב 6 — §6.1-6/§6.1-10 בתוכנית):** הצהרה מלאה של
 * עיטור אחד, כפי שחוזה פריט העמוד דורש — זהות ומקור, סוג ונכס, מידות טבעיות
 * מול מידות יעד, מדיניות fit/scale, עוגן ומיקום סמנטי, גבולות clipping ו-z-order,
 * דרישת שטח שמור, ואילוצי placement מול טקסט/כותרות/שערים/גבולות העמוד.
 * כל אלה נקבעים **בזמן התכנון** — המקרינים (DOM/PDF/PageModel) קוראים ואינם
 * מחשבים מחדש (F-09: מקור יחיד; הכרזה כאן היא המקור).
 * @param {object} orn - העיטור עם ה-rect הסופי (x/y/w/h) + נתוני ההצבה
 * @param {object} ctx - { page, seq, decl } — decl: {naturalW, naturalH, scale,
 *   fitMode, fitReason, anchorTokenId, semantic, reservationMode, reservedPx,
 *   reservationWhere, relativeTo }
 * @returns {object} שדות ההצהרה למיזוג לרשומת העיטור
 */
function ornamentDeclarationOf(orn, ctx) {
  const page = ctx.page;
  const decl = ctx.decl || {};
  const tpl = page.template || {};
  const cb = tpl.contentBox || { top: 0, bottom: 0 };
  const semantic = decl.semantic || 'overlay';
  const relativeTo = decl.relativeTo || (semantic.includes('heading') ? 'heading' : 'page');
  return {
    // זהות ומקור — דטרמיניסטי (אין מונה-ריצה; אותו קלט ⇒ אותו מזהה)
    ornId: `orn-p${page.index != null ? page.index : 'x'}-${orn.slot || 'slot'}-${ctx.seq}`,
    source: sourceSettingKeyOf(orn),
    // סוג ונכס: הדיו נפתר כאן פעם אחת — זהות בלבד; ה-URI של נכס חיצוני
    // נפתח בזמן הרינדור (רישום הנכסים חי ב-UI) — ואז גם נבדק ומדווח
    ink: inkOfOrnament(orn),
    // מידות טבעיות מול מידות יעד + מדיניות fit/scale (§6.1-6)
    natural: { w: Number(decl.naturalW) || orn.w, h: Number(decl.naturalH) || orn.h },
    scale: Number.isFinite(Number(decl.scale)) && Number(decl.scale) > 0 ? Number(decl.scale) : 1,
    fit: { mode: decl.fitMode || 'fixed', reason: decl.fitReason || 'natural-size' },
    // עוגן ומיקום סמנטי (§6.1-6)
    anchor: { tokenId: decl.anchorTokenId != null ? String(decl.anchorTokenId) : null, semantic },
    // גבולות clipping ו-z-order — תיבת העיטורים של האודיט (content ± h2TopOffset)
    clip: {
      top: cb.top - (tpl.h2TopOffset || 0),
      bottom: cb.bottom,
      left: 0,
      right: Number.isFinite(tpl.width) ? tpl.width : null
    },
    zOrder: 'overlay',
    // דרישת שטח שמור: היכן הגובה תוקצב בפועל (F-08) — או 0 ל-overlay טהור
    reservation: {
      mode: decl.reservationMode || 'overlay',
      px: Number(decl.reservedPx) || 0,
      where: decl.reservationWhere || null
    },
    // אילוצי placement: יחס העיטור לטקסט/כותרות/גבולות — הצהרה, לא חישוב
    constraints: {
      relativeTo,
      bounds: 'ornament-box', // content-box + שטח h2-top השמור (כמו האודיט)
      keepsOut: decl.reservationMode === 'row-padding' || decl.reservationMode === 'column-budget' ? 'body-text' : 'none'
    }
  };
}

/** זהות הדיו של עיטור: תמונה חיצונית / SVG מובנה / כלל / מלבן — או null (חסר). */
function inkOfOrnament(orn) {
  if (!orn) return null;
  if (orn.kindStyle === 'image') return { type: 'image', ref: null, uri: null };
  const ink = ornamentInk(orn.kindStyle);
  if (!ink) return null;
  if (ink.type === 'svg' || ink.type === 'image') return { type: ink.type, ref: null, uri: ink.uri || null };
  return { type: ink.type, ref: null, uri: null }; // rule / rect — דיו וקטורי ללא URI
}

/**
 * הוספת rect עיטור עם אימות מקור־יחיד (F-09) **והצהרה מלאה** (השלמת שלב 6).
 * עיטור עם kindStyle שאינו 'none' ובלי דיו פתיר ובלי תמונה — נצבע ריק אם
 * יושתק; כאן הוא נרשם כ-diagnostic מפורש (ornament-ink-missing) ומסומן
 * ברשומה (inkMissing) — הגיאומטריה נשמרת (T1), הדיווח גלוי.
 */
function pushOrnament(page, orn, rejected, pageIndex, settings, io = {}, decl = {}) {
  const check = assertSingleSourceSizing(orn);
  if (!check.ok) {
    rejected.push({ page: pageIndex, kind: orn.kind, why: `single-source-violation:${check.reason}` });
    return null;
  }
  const image = imageRefForOrnament(orn, settings);
  const declaration = ornamentDeclarationOf(orn, { page, seq: page.decorations.length, decl });
  if (image) declaration.ink = { type: 'image', ref: image, uri: null };
  const inkMissing = !image && (!declaration.ink || (declaration.ink.type !== 'rule' && declaration.ink.type !== 'rect' && !declaration.ink.uri))
    && orn.kindStyle && orn.kindStyle !== 'none';
  if (inkMissing) {
    declaration.inkMissing = true;
    rejected.push({ page: pageIndex, kind: orn.kind, why: 'ink-missing', kindStyle: orn.kindStyle });
    if (io.ledger) {
      const rec = io.ledger.create('ornament-ink-missing', `p${pageIndex}:${orn.slot}`, pageIndex, { kindStyle: orn.kindStyle, slot: orn.slot }, 'ornaments');
      io.ledger.transition(rec.issue_id, 'persists', 'ornaments', `ornament has no resolvable ink: ${orn.kindStyle}@${orn.slot}`);
    }
  }
  page.decorations.push({ ...orn, image, cssClass: `orn orn--${orn.kind} orn--${orn.kindStyle || 'plain'}`, ...declaration });
  return page.decorations[page.decorations.length - 1];
}

/**
 * אודיט עיטורים — predicates אמיתיים על ה־rects בפועל:
 * - ornament-overflow: עיטור חורג מתיבת התוכן של העמוד.
 * - ornament-overlap: שני עיטורים חופפים באותו עמוד (פטורים מוצהרים: רקע/טקסטורה
 *   שכבת־תשתית לכל העמוד).
 * - ornament-asymmetry: מרווחים אפקטיביים של עיטורי H2 עליון/תחתון אינם שווים (F-21).
 * @returns {{overflow:Array, overlap:Array, asymmetry:Array}}
 */
function auditOrnaments(pages, ledger) {
  const overflow = [], overlap = [], asymmetry = [];
  const EXCLUDED_FROM_OVERLAP = new Set(['page-background', 'page-texture']);

  for (const page of pages) {
    const decs = page.decorations || [];
    if (!decs.length) continue;
    const tpl = page.template;
    if (tpl && tpl.contentBox) {
      // תיבת העיטורים: תיבת התוכן + אזור h2-top-offset שמעליה (שמור לעיטורי פתיחת
      // סימן — עיטור H2 עליון חי שם כדין; לא גלישה). רקע/טקסטורה מחוץ לבדיקה.
      const decoTop = tpl.contentBox.top - (tpl.h2TopOffset || 0);
      for (const d of decs) {
        if (d.slot === 'page-background' || d.slot === 'page-texture') continue;
        if (d.y < decoTop - 0.5 || d.y + d.h > tpl.contentBox.bottom + 0.5) {
          overflow.push({ page: page.index, slot: d.slot, y: d.y, h: d.h, top: decoTop, bottom: tpl.contentBox.bottom });
        }
      }
    }

    // overlap — זוגות נחתכים (אזור חיובי בשני הצירים)
    for (let i = 0; i < decs.length; i++) {
      for (let j = i + 1; j < decs.length; j++) {
        const a = decs[i], b = decs[j];
        if (EXCLUDED_FROM_OVERLAP.has(a.slot) || EXCLUDED_FROM_OVERLAP.has(b.slot)) continue;
        const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ix > 0.5 && iy > 0.5) {
          overlap.push({ page: page.index, a: a.slot, b: b.slot, ix: Math.round(ix), iy: Math.round(iy) });
        }
      }
    }

    // asymmetry — F-21: מרווח עליון אפקטיבי מול תחתון (H2 top/bottom pair)
    const top = decs.find(d => d.slot === 'h2-top');
    const bottom = decs.find(d => d.slot === 'h2-bottom');
    if (top && bottom && top.marginGapTop != null && bottom.marginGapBottom != null) {
      if (Math.abs(top.marginGapTop - bottom.marginGapBottom) > 1) {
        asymmetry.push({ page: page.index, topGap: top.marginGapTop, bottomGap: bottom.marginGapBottom });
      }
    }
  }

  // רישום ל‑ledger (עולה לדוח האבחון; לעולם לא מושתק)
  if (ledger) {
    for (const f of overflow) {
      const rec = ledger.create('ornament-overflow', `p${f.page}`, f.page, { slot: f.slot }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rect exceeds content box');
    }
    for (const f of overlap) {
      const rec = ledger.create('ornament-overlap', `p${f.page}`, f.page, { a: f.a, b: f.b }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'ornament rects intersect');
    }
    for (const f of asymmetry) {
      const rec = ledger.create('ornament-asymmetry', `p${f.page}`, f.page, { topGap: f.topGap, bottomGap: f.bottomGap }, 'ornaments');
      ledger.transition(rec.issue_id, 'persists', 'ornaments', 'H2 ornament effective margins unequal (F-21)');
    }
  }
  return { overflow, overlap, asymmetry };
}

module.exports = { planPageOrnaments, auditOrnaments, ornamentDeclarationOf, ORN_NATURAL_W_EM, ORN_NATURAL_H_EM, DIVIDER_H_PX };
