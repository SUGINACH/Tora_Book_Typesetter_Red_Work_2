// src/engine/decoration/toc-builder.js — TOC general/detail pages, groups, dots, anchors (REQ-HDR-05, S9)
'use strict';

/**
 * **S9 (D-62) — עמודי תוכן־העניינים אמיתיים.** עד S8 נבנו רשומות בלבד (r.toc) בלי
 * עמודים; בכל הגרסאות הישנות ה‑TOC נבנה ב‑DOM לאחר העימוד (renderPaginatedTOC של IMUD)
 * וסבל מגלישות/תליה (F: "TOC hanging" — שורת קטלוג שתקעה את העימוד).
 *
 * מודל: (1) buildTocModel — רשומות לפי רמות + קיבוץ inline רצוף לשורת־קבוצה אחת
 * (IMUD buildStructuredTOC); (2) buildTocPages — זרימת שורות לעמודי toc-general/
 * toc-detail אמיתיים במדידה מראש (מדידת רוחב, עטיפת כותרת ארוכה עד 2 שורות, קטיעה
 * מעבר לכך + ממצא toc-overflow); (3) insertTocPages — הכנסה מבנית לפני צילום hash
 * ה‑CP4 (כמו שערי S8) + בניית תבניות מחדש לפי הזוגיות הסופית (D-63 — תיקון חבוי:
 * binding-offset נשאר תלוי בזוגיות קודמת להכנסות); (4) resolveTocTargets — עוגן
 * + תווית גיליון לפי המספור הסופי (תוויות בפורמט הגיליון — REQ-HDR-05).
 *
 * **תקציב איטרציה (stuck guard):** TOC_MAX_ROWS/TOC_MAX_PAGES — חריגה ⇒ ממצא
 * toc-budget-exceeded ועצירה דטרמיניסטית. אף לולאה לא חסרת חסם.
 */

const { PAGE_TYPES, buildPageTemplate } = require('../layout/page-templates');
const { GEO, TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM, SZ_CORE } = require('../core/imud-geometry');

const TOC_MAX_ROWS = 20000;     // תקציב שורות כולל (general+detail)
const TOC_MAX_PAGES = 500;      // תקציב עמודי TOC כולל
const TOC_MAX_TITLE_LINES = 2;  // כותרת ארוכה: עטיפה עד 2 שורות; מעבר ⇒ קטיעה + ממצא
const DOTS_MIN_PX = 24;         // שטח מינימלי לנקודות מובילות
const LABEL_RESERVE_PX = 48;    // שמורת רוחב לתווית גיליון (נפתרת אחרי המספור)
const ROW_GAP_PX = 4;
const TITLE_SIZE_PT = 16;
const TITLE_MARGIN_PX = 24;

/** גודל גופן לרמה (ברירות מחדל V1/V2: gtoc 12/11/10.5/8.8 — D-62). */
function levelSizePt(level) {
  if (level <= 1) return 12;
  if (level === 2) return 11;
  if (level <= 6) return 10.5;
  return 8.8; // H7 — שורות צד
}
function levelIndentPx(level) {
  return (Math.max(1, Math.min(7, level)) - 1) * 16;
}

/** עטיפת כותרת: שורות מילים עד ‏2; מעבר ⇒ קטיעה בסימון '…'. מילה בודדת רחבה
 *  מהשורה אינה ניתנת לעטיפה — מסומנת truncated (הממצא נרשם ב‑rowHeightOf). */
function wrapTitle(text, availPx, sizePt, measure) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  let truncated = false;
  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const addW = measure(w, sizePt) + (cur.length ? measure(' ', sizePt) : 0);
    if (cur.length && curW + addW > availPx) {
      lines.push(cur.join(' '));
      cur = [w]; curW = measure(w, sizePt);
      if (lines.length >= TOC_MAX_TITLE_LINES) { truncated = true; break; } // שאר המילים נקצצות
    } else { cur.push(w); curW += addW; }
  }
  if (lines.length < TOC_MAX_TITLE_LINES && cur.length) lines.push(cur.join(' '));
  else if (cur.length) truncated = true; // נותרו מילים שלא נכנסו לתקציב השורות
  // מילה בודדת רחבה מהשורה — אינה עטיפה אפשרית:
  if (!truncated && lines.some(l => measure(l, sizePt) > availPx + 0.5)) truncated = true;
  if (truncated && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1] + ' …';
  }
  return { lines, truncated, full: !truncated };
}

/**
 * מודל TOC מרשימת כותרות. inline רצוף ⇒ שורת קבוצה אחת (group).
 * @param {Array} headings - [{level, text, tokenId, pageRef}]
 */
function buildTocModel(headings, settings) {
  const rows = [];
  let pendingGroup = null;
  const flushGroup = () => { if (pendingGroup && pendingGroup.items.length) { rows.push(pendingGroup); } pendingGroup = null; };
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const entry = {
      kind: 'entry', level: h.level, text: h.text,
      tokenId: h.tokenId, pageRef: h.pageRef,
      anchorId: `heading-tok-${h.tokenId}`,
      targetPage: null, label: '', rowNum: null, inline: false,
    };
    if (settings[`toc-level-${h.level}-inline`] === true) {
      entry.inline = true;
      (pendingGroup = pendingGroup || { kind: 'group', items: [], level: h.level }).items.push(entry);
    } else {
      flushGroup();
      rows.push(entry);
    }
  }
  flushGroup();
  return { rows };
}

/** מספור שורות (count-numbering): מספר סידורי לכל רשומה בעלת שורה משלה. */
function numberRows(rows, enabled) {
  if (!enabled) return;
  let n = 0;
  for (const r of rows) {
    if (r.kind === 'entry') r.rowNum = ++n;
    else for (const it of r.items) it.rowNum = ++n;
  }
}

/**
 * בניית עמודי TOC עצמם (זרימת שורות במדידה מראש — ללא DOM, ללא scrollHeight).
 * @param {object} model - תוצר buildTocModel
 * @param {string} pageType - 'toc-general' | 'toc-detail'
 * @param {string} title
 * @param {object} settings
 * @param {Function} measure - (text, sizePt?) => px
 * @param {Function} lineHeight - (sizePt?) => px
 * @param {object} io - { ledger, eventLog }
 */
function buildTocPages(model, pageType, title, settings, measure, lineHeight, io = {}) {
  const { ledger, eventLog } = io;
  const pages = [];
  const overflowFindings = [];
  let rowsConsumed = 0;
  let budgetExceeded = false;

  const prefix = pageType === 'toc-detail' ? 'dtoc' : 'gtoc';
  const raw = settings && settings._imudRaw ? settings._imudRaw : {};
  const sizeOf = (level, imud) => {
    const rawSize = Number(raw[`s-${prefix}-${level}`]);
    if (imud && Number.isFinite(rawSize) && rawSize > 0) return rawSize;
    const coreSize = SZ_CORE.tocLevel[level];
    return imud && Number.isFinite(coreSize) ? coreSize : levelSizePt(level);
  };
  const familyOf = (level, imud) => {
    if (!imud) return null;
    const stack = String(raw[`f-${prefix}-${level}`] || '').split(',')[0].trim();
    return stack.replace(/^['"]|['"]$/g, '') || null;
  };
  const mkPage = (isFirst) => {
    const tpl = buildPageTemplate(pageType, settings, (pages.length % 2) === 0);
    const pg = {
      index: -1, type: pageType, template: tpl,
      columns: Array.from({ length: tpl.columns.length }, () => []),
      footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null,
      fnReservedHeightPx: 0, chapterOpening: false,
      toc: { title: isFirst ? title : '', rows: [], isFirst, isLast: false },
    };
    pages.push(pg);
    return pg;
  };

  let cur = mkPage(true);
  const imudToc = !!(cur.template && cur.template.imud);
  // רוחב התוכן מהעמודות (לא מרוחב A4). ב-IMUD נשמר גם אזור המספר/התווית
  // שמשמאל לטקסט לפי GEO.TOC_NUM_X ו-GEO.TOC_TITLE_X1.
  const colsTpl = (cur.template && cur.template.columns) || [];
  const tplW = colsTpl.length
    ? Math.max.apply(null, colsTpl.map(c => c.x + c.w)) - Math.min.apply(null, colsTpl.map(c => c.x))
    : ((cur.template.contentBox && cur.template.contentBox.right != null
      ? (cur.template.contentBox.right - cur.template.contentBox.left) || cur.template.width
      : cur.template.width));
  const capacityOf = (isFirst, tpl) => tpl.imud
    ? TOC_STRETCH_BOTTOM - (isFirst ? TOC_FIRST_TOP : TOC_CONT_TOP)
    : tpl.contentBox.height - (isFirst ? (TITLE_SIZE_PT * (96 / 72) + TITLE_MARGIN_PX) : 0);

  const rowHeightOf = (r) => {
    const level = r.kind === 'group'
      ? Math.max(...r.items.map(it => it.level))
      : r.level;
    const size = sizeOf(level, imudToc);
    const family = familyOf(level, imudToc);
    const rightEdge = imudToc ? GEO.TOC_TITLE_X1 - (level - 1) * GEO.TOC_STAIR : null;
    const imudAvail = imudToc
      ? Math.max(60, Math.min(tplW - levelIndentPx(level) - LABEL_RESERVE_PX - DOTS_MIN_PX,
          (rightEdge - GEO.TOC_NUM_X - 64) * 0.92))
      : null;
    const avail = imudToc
      ? imudAvail
      : Math.max(60, tplW - levelIndentPx(level) - LABEL_RESERVE_PX - DOTS_MIN_PX);
    const text = r.kind === 'group'
      ? r.items.map(it => it.text).join(' | ')
      : r.text;
    const wrapped = wrapTitle(text, avail, size, measure);
    r.wrapped = wrapped.lines;
    r.sizePt = size;
    if (family) r.fontFamily = family;
    if (wrapped.truncated) {
      overflowFindings.push({ why: 'title-truncated', text: String(text).slice(0, 40), level });
    }
    if (imudToc) {
      // התאמה לחוזה המורשת: גובה השורה תלוי בגודל האות; שורות עטיפה נוספות
      // מקבלות pitch של 26px. אין להשתמש ב-lineHeight של גוף הספר.
      const firstLineH = size * (96 / 72) * 1.3 + 8;
      r.lineHeightPx = 26;
      r.heightPx = firstLineH + Math.max(0, wrapped.lines.length - 1) * 26;
      return { h: r.heightPx, lines: wrapped.lines.length, size, family };
    }
    const h = wrapped.lines.length * lineHeight(size) + ROW_GAP_PX;
    r.lineHeightPx = lineHeight(size);
    r.heightPx = h;
    return { h, lines: wrapped.lines.length, size, family };
  };

  let availH = capacityOf(true, cur.template);
  let usedH = 0;

  for (const r of model.rows) {
    if (budgetExceeded) break;
    rowsConsumed++;
    if (rowsConsumed > TOC_MAX_ROWS || pages.length > TOC_MAX_PAGES) {
      budgetExceeded = true;
      break;
    }
    const { h } = rowHeightOf(r);
    if (usedH + h > availH && cur.toc.rows.length) {
      if (pages.length >= TOC_MAX_PAGES) { budgetExceeded = true; break; }
      cur = mkPage(false);
      availH = capacityOf(false, cur.template);
      usedH = 0;
    }
    // שורה בודדת גבוהה מעמוד שלם ⇒ אל תיתלה: הנח אותה ותעד.
    if (h > availH) {
      overflowFindings.push({ why: 'row-taller-than-page', level: r.level || (r.items && r.items[0].level) });
    }
    cur.toc.rows.push(r);
    usedH += Math.min(h, availH);
  }

  pages.forEach((p, i) => { p.toc.isLast = i === pages.length - 1; });

  if (budgetExceeded && ledger) {
    const rec = ledger.create('toc-budget-exceeded', pageType, null,
      { rowsConsumed, pages: pages.length, maxRows: TOC_MAX_ROWS, maxPages: TOC_MAX_PAGES }, 'toc');
    ledger.transition(rec.issue_id, 'persists', 'toc', 'TOC iteration budget exceeded — deterministic stop (stuck guard)');
  }
  if (overflowFindings.length && ledger) {
    for (const o of overflowFindings) {
      const rec = ledger.create('toc-overflow', pageType, null, o, 'toc');
      ledger.transition(rec.issue_id, 'persists', 'toc', `TOC overflow (${o.why})`);
    }
  }
  if (eventLog) {
    eventLog.emit('toc', 'toc-pages-built', { type: pageType, pages: pages.length, rows: rowsConsumed, overflow: overflowFindings.length, budgetExceeded, imudGeometry: imudToc });
  }
  return { pages, overflow: overflowFindings, budgetExceeded };
}

/**
 * הכנסת עמודי TOC לרצף: אחרי הרצף המבני הפותח (שער ראשי/עמודים מותאמים בראש),
 * לפני כל דבר אחר. לאחר ההכנסה: אינדוקס מחדש + בניית תבניות לפי הזוגיות הסופית
 * (**D-63 — תיקון חבוי:** binding-offset חושב לפי אינדקס לפני הכנסות; כל הכנסה
 * משנה זוגיות והשאירה שוליים הפוכים. חל גם על שערי S8 שהוכנסו קודם).
 * כאשר binding≠0 וזוגיות עמוד השתנתה — השורות נמדדו לרוחב הישן; גלישה אפשרית
 * נבדקת ונרשמת כממצא binding-parity-shift (לא מוסתר).
 */
function insertTocPages(pages, tocPages, settings, io = {}) {
  if (!tocPages.length) return { pages, inserted: 0, at: 0 };
  // רצף פותח מבני: עמודי front-matter אמיתיים בלבד (שער ראשי/אחורי/פתיחה מותאמת).
  // **03.11(ד):** שערי־משנה (shaar-sub) שייכים לזרימת הגוף — הם באים אחרי
  // תוכן־העניינים (לפני החלק שלהם), לא לפניו. בעבר כל isShaar דולג — ושער־המשנה
  // של החלק הראשון נדחק לפני התוכן־עניינים.
  let at = 0;
  while (at < pages.length && (pages[at]._frontMatter === true)) at++;
  const out = pages.slice(0, at).concat(tocPages, pages.slice(at));
  out.forEach((p, i) => { p.index = i; });
  // בניית תבניות מחדש לפי הזוגיות הסופית (D-63) — אותו סוג, אותן הגדרות, זוגיות נכונה
  const binding = settings['binding-offset-px'] || 0;
  const parityShifted = [];
  for (const p of out) {
    const newIsRecto = p.index % 2 === 0;
    const shifted = binding !== 0 && p.isRecto !== undefined && p.isRecto !== newIsRecto;
    p.template = buildPageTemplate(p.type, settings, newIsRecto);
    p.isRecto = newIsRecto;
    if (shifted) parityShifted.push(p);
  }
  // גלישה מטופלת בכנות: שורה שנמדדה לטור רחב וכעת צר יותר ⇒ ממצא (לא השתקה)
  if (parityShifted.length && io.ledger) {
    let overflowCount = 0;
    for (const p of parityShifted) {
      p.columns.forEach((col, ci) => {
        const cw = p.template.columns[ci] ? p.template.columns[ci].w : Infinity;
        for (const ln of col) {
          if ((ln.widthPx || 0) > cw + 0.5) overflowCount++;
        }
      });
    }
    if (overflowCount) {
      const rec = io.ledger.create('binding-parity-shift', 'toc-insertion', null,
        { pages: parityShifted.length, overflowLines: overflowCount, binding }, 'toc');
      io.ledger.transition(rec.issue_id, 'persists', 'toc',
        `binding≠0 + parity flip: ${overflowCount} line(s) exceed narrowed column after template rebuild`);
    }
    if (io.eventLog) io.eventLog.emit('toc', 'binding-parity-rebuild', { pages: parityShifted.length, overflowLines: overflowCount });
  }
  return { pages: out, inserted: tocPages.length, at };
}

/** פענוח עוגנים + תוויות לפי המספור הסופי (מופעל אחרי assignNumbers). */
function resolveTocTargets(pages, tocPages, numbers, settings, { formatLabel }) {
  let resolved = 0;
  for (const tp of tocPages) {
    for (const r of tp.toc.rows) {
      const entries = r.kind === 'group' ? r.items : [r];
      for (const e of entries) {
        e.targetPage = e.pageRef ? e.pageRef.index : null;
        const n = e.targetPage != null ? numbers[e.targetPage] : null;
        e.label = n && n.counted && n.page != null ? formatLabel(n.page) : '';
        resolved++;
      }
    }
  }
  return { resolved };
}

/**
 * רשומות TOC "ישנות" (תאימות לאחור — r.toc של ≤S8).
 * **D-107 (9b.2):** כללי — רמות 1–6; מפורט — רמות 2–6; H7 מוסתר בשניהם;
 * שניהם פעילים בברירת המחדל (בעבר: כללי ≤2, מפורט = כל הרמות כולל H1).
 */
function buildTocEntries(headings, settings, numbersByIndex) {
  const entries = [];
  let numbered = 0;
  for (const h of headings) {
    if (!settings[`toc-level-${h.level}-show`]) continue;
    const idx = h.pageRef ? h.pageRef.index : h.page;
    const num = numbersByIndex ? numbersByIndex[idx] : null;
    numbered++;
    entries.push({
      level: h.level,
      text: h.text,
      pageLabel: num && num.display ? num.display : '',
      rowNum: settings['general-toc-count-numbering'] ? numbered : null,
      inline: !!settings[`toc-level-${h.level}-inline`],
      targetPage: idx,
      leaderDots: true,
    });
  }
  return entries;
}

function splitGeneralDetail(entries, settings = {}) {
  // **D-107 (9b.2):** כללי 1–6, מפורט 2–6 — טווחים מפורשים וזהים לעמודי ה-TOC
  // האמיתיים ב-pipeline; ברירת המחדל: שניהם פעילים.
  const genOn = settings['toc-general-enabled'] !== false;
  const detOn = settings['toc-detail-enabled'] !== false;
  return {
    generalEnabled: genOn,
    detailEnabled: detOn,
    general: genOn ? entries.filter(e => e.level >= 1 && e.level <= 6) : [],
    detail: detOn ? entries.filter(e => e.level >= 2 && e.level <= 6) : [],
  };
}

module.exports = {
  buildTocModel, numberRows, buildTocPages, insertTocPages, resolveTocTargets,
  buildTocEntries, splitGeneralDetail, wrapTitle, levelSizePt, levelIndentPx,
  TOC_MAX_ROWS, TOC_MAX_PAGES, TOC_MAX_TITLE_LINES,
};
