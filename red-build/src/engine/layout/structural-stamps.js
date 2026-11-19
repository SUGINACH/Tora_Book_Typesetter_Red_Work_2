// src/engine/layout/structural-stamps.js — הטבעת גיאומטריית התוכן המבני בזמן התכנון (שלב 8, §4.1)
'use strict';

/**
 * **מדידה אחת לתוכן המבני — לפני ההחלטות הסופיות ולא בהקרנה.**
 *
 * עד שלב 8, projectDocument מדד בעצמו את התוכן המבני בזמן ההקרנה: שורות
 * תוכן-העניינים (fakeLine), כריכת שורות עמודי השער (buildShaarBlocks + wrap),
 * רוחבי סלוטי הכותרת העליונה, גיאומטריית הגיליון וחלוקת נתיבי מרזב ההערות
 * (assignFootnoteLanes). זו הייתה החלטת גיאומטריה שנייה במקרין — בדיוק מה
 * שהוראת שלב 8 אוסרת: "אם חסר נתון במודל, תקן את שלב יצירת הנתון ולא את
 * המקרין".
 *
 * כאן מוטבעים הנתונים האלה על העמודים **בסוף התכנון** (ה-pipeline קורא מיד
 * לפני בניית ה-PageModel; אחרי הצבת ההערות והאיזונים — כך שההטבעה רואה את
 * המצב הסופי): page.tocLayout / page.shaarLayout / page.headerSlotGeo /
 * page.folioGeo / page.footnoteLanes. ההחלטות נקבעות פעם אחת; ההקרנה (שלב 8)
 * והמקרינים צורכים בלבד.
 *
 * טוהר: פונקציות טהורות על (pages, settings, measure) — מוטציה מבוקרת בשדות
 * ההטבעה בלבד; דטרמיניסטיות מלאה (אותו קלט ⇒ אותן חותמות).
 */

const { buildShaarBlocks, shaarFontOf } = require('../output/shaar-content');
const { folioGeometry, headerGeometry } = require('../layout/furniture-geometry');
const { assignFootnoteLanes } = require('../layout/footnote-lanes');
const { isImudProfile } = require('../layout/page-templates');
const {
  GEO, TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM
} = require('../core/imud-geometry');
// **שלב 8 ביקורת §3.1:** המיפוי משפחה→מפתח גופן — מקור יחיד משותף (היה כפול
// כאן וב-materialize); ה-scrub — מהמודול הניטרלי core/pua-text.
const { familyFontKeyOf } = require('../typography/font-keys');
const { scrubPUAText } = require('../core/pua-text');

/** מדידה בגופן משפחה רשומה (אחרת המדידה הרגילה) — להטבעת שערים/גיליון/כותרות. */
function measureOfFamily(baseMeasure, fam, settings) {
  if (fam && familyFontKeyOf(fam)) {
    const { MeasureAPI } = require('../typography/measure-api');
    return new MeasureAPI({ ...settings, 'body-font': fam }, 'font-metrics');
  }
  return baseMeasure;
}

/** צבע הגדרה '#RRGGBB' → [r,g,b] או null. */
function colorOfSetting(hex) {
  if (!hex) return null;
  const m = String(hex).match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * הטבעת שורות תוכן-העניינים — עם רוחבי מילים ורוחב רווח **נמדדים פעם אחת**
 * (ההקרנה מקבלת מילים ממוקמות, לא טקסט למדידה). נשמר ב-page.tocLayout.
 *
 * **גיאומטריית ה-TOC לפי חוזה 9C3 (חקירת 19.11 — TOC_ROWS ×56):** בפרופיל
 * IMUD השורות חיות באזור המתיחה המכויל: עמוד ראשון — כותרת ב-FLOW_TOP+136
 * (30px, ממורכזת) ושורות מ-TOC_FIRST_TOP (370.7); המשך — מ-TOC_CONT_TOP
 * (113.7); תחתית — TOC_STRETCH_BOTTOM (1005.7). עד כאן הוטבעה פריסה שטוחה
 * y=70+24i שנלקחה מה-CSS הישן — שורות עלו על הכותרת העליונה (89.2–103.2)
 * והתיבה המכוילת לא מומשה. המתיחה כמו במורשת (F1/F6): gap טבעי עם רצפת
 * גובה-שורה מרבי, ומערך טבעי כשהרצפה גולשת מהתחתית. הנתיב הלא-IMUD נשמר
 * כמו שהיה (קורפוס ה-DP נעול).
 */
function stampTocLayout(page, settings, measure) {
  if (page.type !== 'toc-general' && page.type !== 'toc-detail') return false;
  const rows = (page.toc && page.toc.rows) || [];
  if (!rows.length) return false;
  const tpl = page.template;
  const PT = 12; // גודל שורת TOC — כמו fakeLine של ההקרנה לפני ההטבעה
  const spaceW = measure.measureTextWidth(' ', PT, 0);
  const wordsOf = (text) => String(text || '').split(/\s+/).filter(Boolean).map(w => ({
    text: w, w: measure.measureTextWidth(w, PT, 0)
  }));
  const layout = [];
  const imud = isImudProfile(settings);
  const isFirst = !!(page.toc && (page.toc.isFirst || page.toc.title));
  const isLast = !!(page.toc && page.toc.isLast);
  // גבהי השורות כפי שנקבעו בעימוד (buildTocPages מטביע r._h); נפילה — 22px
  const rowH = (r) => (Number(r._h) > 0 ? Number(r._h) : 22);
  let rowYs = null;
  if (imud) {
    const top = isFirst ? TOC_FIRST_TOP : TOC_CONT_TOP;
    const yArr = [];
    if (!isLast && rows.length > 1) {
      // מתיחה (legacy F1/F6): gap טבעי בין top לתחתית, רצפת גובה-שורה מרבי;
      // אם הרצפה דוחפת את האחרונה מעבר לתחתית — מערך טבעי לפי הגבהים
      const maxH = Math.max.apply(null, rows.map(rowH));
      const hLast = rowH(rows[rows.length - 1]);
      const naturalGap = (TOC_STRETCH_BOTTOM - top - hLast) / (rows.length - 1);
      const gap = Math.max(naturalGap, maxH);
      const lastTop = top + (rows.length - 1) * gap;
      if (lastTop <= TOC_STRETCH_BOTTOM - hLast + 0.5) {
        rows.forEach((r, i) => yArr.push(top + i * gap));
      } else {
        let yy = top;
        for (const r of rows) { yArr.push(yy); yy += rowH(r); }
      }
    } else {
      let yy = top;
      for (const r of rows) { yArr.push(yy); yy += rowH(r); }
    }
    rowYs = yArr;
  } else {
    rowYs = rows.map((r, i) => 70 + i * 24);
  }
  let yi = 0;
  for (const row of rows) {
    const y = rowYs[yi];
    if (row.kind === 'group') {
      let xi = 0;
      const items = [];
      for (const it of row.items || []) {
        const text = [it.text, it.label || ''].filter(Boolean).join(' ');
        items.push({
          x: 18 + xi, y, w: 60, h: 22, words: wordsOf(text), spaceW,
          targetPage: it.targetPage != null ? it.targetPage : null
        });
        xi += 80;
      }
      layout.push({ kind: 'group', y, items });
    } else {
      const text = [row.text, row.label || ''].filter(Boolean).join(' ');
      layout.push({
        kind: 'row', x: 18, y, w: tpl.width - 36, h: 22, words: wordsOf(text), spaceW,
        targetPage: row.targetPage != null ? row.targetPage : null
      });
    }
    yi++;
  }
  // כותרת ה-TOC בעמוד הראשון (חוזה 9C3: y=FLOW_TOP+136, גובה 30, ממורכזת, 17pt)
  let title = null;
  if (imud && isFirst && page.toc && page.toc.title) {
    const t = String(page.toc.title);
    title = {
      x: GEO.COL_L_X, y: GEO.FLOW_TOP + 136, w: 2 * GEO.COL_W + 13.48, h: 30,
      sizePt: 17, words: wordsOf(t), spaceW, align: 'center'
    };
  }
  page.tocLayout = { schema: 'toc-layout-v1', rows: layout, pageWidth: tpl.width, sizePt: PT, ...(title ? { title } : {}) };
  return true;
}

/**
 * הטבעת תוכן עמודי השער — בלוקים, שבירת שורות ברוחב התיבה, פריסה אנכית
 * ('between' — פיזור שווה; 'center' — מחסנית ממורכזת), גופן וצבע פר-בלוק.
 * אותה גיאומטריה שהייתה נבנית בהקרנה — כעת פעם אחת בהטבעה. נשמר ב-page.shaarLayout.
 */
function stampShaarLayout(page, settings, measure) {
  if (!/^shaar-/.test(page.type)) return false;
  const model = buildShaarBlocks(page, settings, page._metadata);
  // **9b.5:** שער אחורי ללא מקטעים (אין ערכים — אין המצאה) הוא מצב לגיטימי
  // ומוחלט: החותמת נרשמת גם עם רשימת בלוקים ריקה — כך המקרינים יודעים שזו
  // ההחלטה הסופית ולא נפילת מדידה (materialize-fallback-shaar-stamp).
  if (!model) return false;
  const b = model.box;
  const tpl = page.template;
  const boxX = b.left, boxW = Math.max(40, tpl.width - b.left - b.right);
  const boxY = b.top, boxH = Math.max(60, tpl.height - b.top - b.bottom);
  const shaarColorOf = (cls) => {
    if (cls.includes('bsd-header') || cls.includes('publication-footer')) return colorOfSetting(settings['shaar-year-color']);
    if (cls.includes('book-title-main')) return colorOfSetting(settings['shaar-title-color']);
    if (cls.includes('book-subtitle')) return colorOfSetting(settings['shaar-subtitle-color']);
    if (cls.includes('book-description')) return colorOfSetting(settings['shaar-desc-color']);
    if (cls.includes('book-sections-summary')) return colorOfSetting(settings['shaar-sections-color']);
    if (cls.includes('author-block')) return colorOfSetting(settings['shaar-author-color']);
    if (cls.includes('back-shaar-text-line') || cls.includes('back-shaar-copyright-header')) return colorOfSetting(settings['shaar-back-text-color']);
    return null;
  };
  // גובה כל בלוק: שבירת שורות לרוחב התיבה במדידת הגופן שלו + גובה שורה לפי הגודל.
  // **רוחבי המילים נצברים בהטבעה** — ההקרנה מקבלת מילים ממוקמות, לא טקסט למדידה.
  const blocks = model.blocks.map(bl => {
    if (bl.graphic) return { ...bl, lines: [], h: 24, fontKey: null, color: null, sizePt: bl.sizePt };
    const blFam = shaarFontOf(bl.cls, settings) || null;
    const blMeasure = measureOfFamily(measure, blFam, settings);
    const words = String(bl.text || '').split(/\s+/).filter(Boolean);
    const spaceW = blMeasure.measureTextWidth(' ', bl.sizePt, 0);
    const lines = [];
    let cur = [], curW = 0;
    for (const w of words) {
      const ww = blMeasure.measureTextWidth(w, bl.sizePt, 0);
      const add = cur.length ? spaceW + ww : ww;
      if (cur.length && curW + add > boxW) { lines.push(cur); cur = [{ text: w, w: ww }]; curW = ww; }
      else { cur.push({ text: w, w: ww }); curW += add; }
    }
    if (cur.length) lines.push(cur);
    const lh = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
    return { ...bl, lines, spaceW, h: lines.length * lh, fontKey: familyFontKeyOf(blFam), color: shaarColorOf(bl.cls), sizePt: bl.sizePt };
  });
  const placed = [];
  let y;
  if (model.mode === 'between') {
    const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
    const gaps = Math.max(0, blocks.length - 1);
    const gap = gaps ? Math.max(0, (boxH - total) / gaps) : 0;
    y = boxY;
    for (const bl of blocks) { placed.push({ ...bl, yTop: y }); y += bl.h + gap; }
  } else {
    const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
    y = boxY + Math.max(0, (boxH - total) / 2);
    for (const bl of blocks) { placed.push({ ...bl, yTop: y }); y += bl.h; }
  }
  page.shaarLayout = { schema: 'shaar-layout-v1', box: { x: boxX, y: boxY, w: boxW, h: boxH }, blocks: placed };
  return true;
}

/**
 * הטבעת רוחבי סלוטי הכותרת העליונה — מדידה אחת ב-9pt בגופן הסלוט; ה-x נגזר
 * מה-pos (טהור). נשמר ב-page.headerSlotGeo.
 */
function stampHeaderSlots(page, settings, measure) {
  if (!page.header || !page.header.slots) return false;
  const slots = ['right', 'center', 'left']
    .map(pos => ({ pos, ...page.header.slots[pos] }))
    .filter(s => s && s.text);
  if (!slots.length) return false;
  const geo = headerGeometry(page);
  const stamped = slots.map(s => {
    const t = scrubPUAText(String(s.text || ''));
    const sKey = familyFontKeyOf(s.font);
    const sMeasure = (sKey && sKey !== 'heading' && sKey !== 'fnbody' && sKey !== 'margin' && sKey !== 'window')
      ? measureOfFamily(measure, s.font, settings) : measure;
    const w = Math.max(1, Math.round(sMeasure.measureTextWidth(t, 9)));
    return { pos: s.pos, align: s.align, text: t, w, sizePt: 9, ...(sKey ? { fontKey: sKey } : {}), ...(s.color ? { color: s.color } : {}) };
  });
  page.headerSlotGeo = { schema: 'header-slots-v1', y: geo.y, slots: stamped };
  return true;
}

/**
 * הטבעת גיאומטריית הגיליון — folioGeometry (מקור יחיד) נקרא פעם אחת בגופן
 * הגיליון מההגדרות. נשמר ב-page.folioGeo.
 */
function stampFolioGeometry(page, settings, measure) {
  if (!page.folioDisplay) return false;
  const fam = settings['page-num-font'] || '';
  const folioMeasure = (fam && familyFontKeyOf(fam)) ? measureOfFamily(measure, fam, settings) : measure;
  const geo = folioGeometry(page, settings, folioMeasure);
  if (!geo) return false;
  const key = (fam && familyFontKeyOf(fam)) || null;
  const color = colorOfSetting(settings['page-num-color']);
  page.folioGeo = { ...geo, ...(key ? { fontKey: key } : {}), ...(color ? { color } : {}) };
  return true;
}

/**
 * הטבעת חלוקת נתיבי מרזב ההערות — אותה חלוקה שהתקציב קבע (assignFootnoteLanes —
 * מקור-אמת אחד) מוטבעת פעם אחת; ההקרנה וה-DOM צורכים ואינם מחלקים שוב.
 * נשמר ב-page.footnoteLanes.
 */
function stampFootnoteLanes(page) {
  if (!(page.footnotes && page.footnotes.length)) return false;
  const { lanes } = assignFootnoteLanes(page.footnotes);
  page.footnoteLanes = { schema: 'fn-lanes-v1', lanes: lanes.map(lane => lane.slice()) };
  return true;
}

/**
 * **שלב 8 ביקורת §3.2 (סגירת נקב):** הטבעת כותרת עמוד הערות-הסיום — עד כאן
 * ההקרנה סינתזה אותה בעצמה (fakeLine — מדידה בזמן materialization), כך שבמסמכים
 * עם note-placement-mode=endnotes היה מדידה שנייה במסלול הייצור. כאן היא
 * נמדדת פעם אחת בהטבעה: מילים {text,w} + רוחב רווח + גודל/מפתח גופן/צבע.
 * נשמר ב-page.endnoteTitleGeo.
 */
function stampEndnoteHeading(page, settings, measure) {
  if (page.type !== 'endnotes' || !page.heading) return false;
  const tpl = page.template;
  const bodyPt = settings['body-font-size-pt'];
  const sizePt = bodyPt * 1.2; // כמו projectEndnotePage (h2, 1.2× הגוף)
  const fam = settings['endnote-title-font'] || '';
  const m = (fam && familyFontKeyOf(fam)) ? measureOfFamily(measure, fam, settings) : measure;
  const t = scrubPUAText(String(page.heading));
  const words = t.split(/\s+/).filter(Boolean).map(w => ({ text: w, w: m.measureTextWidth(w, sizePt, 0) }));
  const spaceW = m.measureTextWidth(' ', sizePt, 0);
  const bandH = (page.titleBandPx && page.titleBandPx > 16) ? page.titleBandPx - 16 : Math.max(12, Math.round(sizePt * (96 / 72) * 1.34));
  page.endnoteTitleGeo = {
    schema: 'endnote-title-v1',
    x: Math.min(...tpl.columns.map(c => c.x)),
    w: Math.max(...tpl.columns.map(c => c.x + c.w)) - Math.min(...tpl.columns.map(c => c.x)),
    y: tpl.contentBox.top + 8, h: bandH, words, spaceW, sizePt,
    fontKey: fam && familyFontKeyOf(fam) ? familyFontKeyOf(fam) : 'heading'
  };
  return true;
}

/**
 * ההטבעה המלאה — נקראת מה-pipeline אחרי סיום ההצבות ולפני בניית ה-PageModel.
 * @param {Array} pages — עמודי התוצר הסופיים
 * @param {object} settings — הגדרות ממוזגות
 * @param {object} measure — MeasureAPI פעיל
 * @returns {{stamped: Object<string, number>, pagesStamped: number}}
 */
function stampStructuralGeometry(pages, settings, measure) {
  const stamped = { toc: 0, shaar: 0, header: 0, folio: 0, lanes: 0, endnoteTitle: 0 };
  for (const page of pages) {
    if (stampTocLayout(page, settings, measure)) stamped.toc++;
    if (stampShaarLayout(page, settings, measure)) stamped.shaar++;
    if (stampHeaderSlots(page, settings, measure)) stamped.header++;
    if (stampFolioGeometry(page, settings, measure)) stamped.folio++;
    if (stampFootnoteLanes(page)) stamped.lanes++;
    if (stampEndnoteHeading(page, settings, measure)) stamped.endnoteTitle++;
  }
  return { stamped, pagesStamped: pages.length };
}

module.exports = {
  stampStructuralGeometry,
  stampTocLayout, stampShaarLayout, stampHeaderSlots, stampFolioGeometry, stampFootnoteLanes, stampEndnoteHeading
};
