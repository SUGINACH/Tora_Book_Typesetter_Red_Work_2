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
const { GEO, TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM, SZ_CORE, H2_SIMAN_Y, H2_SIMAN_Y_SPAN } = require('../core/imud-geometry'); // **G3/RC-3 (i004):** H2_SIMAN_Y* — עוגן דואלי, מקור יחיד
const { folioGeometry, headerGeometry } = require('../layout/furniture-geometry');
const { assignFootnoteLanes } = require('../layout/footnote-lanes');
// **שלב 8 ביקורת §3.1:** המיפוי משפחה→מפתח גופן — מקור יחיד משותף (היה כפול
// כאן וב-materialize); ה-scrub — מהמודול הניטרלי core/pua-text.
const { familyFontKeyOf, literalFamilyKeyOf } = require('../typography/font-keys');
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
 * הטבעת שורות תוכן-העניינים — אותה פריסה שהייתה בהקרנה (top 70, שורה 24px,
 * כותרת מימין ותווית משמאל; קבוצה — פריטים במרווחי 80px) — עם רוחבי מילים
 * ורוחב רווח **נמדדים פעם אחת** (ההקרנה מקבלת מילים ממוקמות, לא טקסט למדידה).
 * נשמר ב-page.tocLayout.
 */
function stampTocLayout(page, settings, measure) {
  if (page.type !== 'toc-general' && page.type !== 'toc-detail') return false;
  const rows = (page.toc && page.toc.rows) || [];
  if (!rows.length) return false;
  const tpl = page.template;
  const imud = !!(tpl && tpl.imud);
  const layout = [];

  if (imud) {
    const first = page.toc.isFirst === true;
    const isLast = page.toc.isLast === true;
    const top = first ? TOC_FIRST_TOP : TOC_CONT_TOP;
    const bottom = TOC_STRETCH_BOTTOM;
    const prefix = page.type === 'toc-detail' ? 'dtoc' : 'gtoc';
    const raw = settings && settings._imudRaw ? settings._imudRaw : {};
    const levelOf = row => row.kind === 'group' ? Math.max(...row.items.map(it => it.level)) : row.level;
    const sizeOf = row => {
      const level = levelOf(row);
      const rawSize = Number(raw[`s-${prefix}-${level}`]);
      if (Number.isFinite(rawSize) && rawSize > 0) return rawSize;
      return Number(SZ_CORE.tocLevel[level]) || 10.5;
    };
    // **Iteration-003 (legacy parity — גופן שורות ה-TOC):** כמו legacy-projector
    // §599 — גופן הרמה מההגדרות (heading-N-font; נפילה ל-raw f-gtoc-N המת
    // במקור, ואז ל-fontFamily שהבונה קבע). הייחוס: רמה 1 ⇒ Lia Sgula,
    // רמה 2 ⇒ AlphaBlack, רמה 3+ ⇒ Alpha.
    const familyOf = row => {
      const lvl = levelOf(row);
      const fromSettings = String(settings[`heading-${lvl}-font`] || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
      if (fromSettings) return fromSettings;
      const stack = String(raw[`f-${prefix}-${lvl}`] || row.fontFamily || '').split(',')[0].trim();
      return stack.replace(/^['"]|['"]$/g, '') || null;
    };
    const rowHeightOf = row => {
      if (Number(row.heightPx) > 0) return Number(row.heightPx);
      const size = sizeOf(row);
      const n = Array.isArray(row.wrapped) && row.wrapped.length ? row.wrapped.length : 1;
      return size * (96 / 72) * 1.3 + 8 + Math.max(0, n - 1) * 26;
    };
    const rowHeights = rows.map(rowHeightOf);
    const rowYs = [];
    if (!isLast && rows.length > 1) {
      const maxH = Math.max(...rowHeights);
      const hLast = rowHeights[rowHeights.length - 1];
      const naturalPitch = (bottom - top - hLast) / (rows.length - 1);
      const pitch = Math.max(naturalPitch, maxH);
      const lastTop = top + (rows.length - 1) * pitch;
      if (lastTop <= bottom - hLast + 0.5) {
        rows.forEach((row, i) => rowYs.push(top + i * pitch));
      } else {
        let y = top;
        rowHeights.forEach(h => { rowYs.push(y); y += h; });
      }
    } else {
      let y = top;
      rowHeights.forEach(h => { rowYs.push(y); y += h; });
    }

    const makeWords = (text, sizePt, family) => {
      const m = family ? measureOfFamily(measure, family, settings) : measure;
      const fontKey = family ? familyFontKeyOf(family) : null;
      const words = String(text || '').split(/\s+/).filter(Boolean).map(word => ({
        text: scrubPUAText(word),
        w: m.measureTextWidth(scrubPUAText(word), sizePt, 0),
        ...(fontKey ? { fontKey } : {})
      }));
      return { words, spaceW: m.measureTextWidth(' ', sizePt, 0), fontKey };
    };

    rows.forEach((row, ri) => {
      const level = levelOf(row);
      const sizePt = sizeOf(row);
      const family = familyOf(row);
      const rightEdge = GEO.TOC_TITLE_X1 - (level - 1) * GEO.TOC_STAIR;
      const labelW = 64;
      const x = GEO.TOC_NUM_X + labelW;
      const w = Math.max(40, rightEdge - x);
      const rowY = rowYs[ri];
      let lineTexts = Array.isArray(row.wrapped) && row.wrapped.length ? row.wrapped.slice() : [
        row.kind === 'group' ? row.items.map(it => it.text).join(' | ') : row.text
      ];
      const labelText = row.kind === 'group'
        ? (row.items || []).map(it => [it.rowNum, it.label].filter(v => v != null && String(v) !== '').join(' ')).filter(Boolean).join(' | ')
        : [row.rowNum, row.label].filter(v => v != null && String(v) !== '').join(' ');
      // שמורת LABEL_RESERVE_PX הוקצתה כבר בשלב wrapping; התווית מוצגת בשדה נפרד.
      const firstLineH = rowHeights[ri] - Math.max(0, lineTexts.length - 1) * 26;
      let y = rowY;
      lineTexts.forEach((lineText, li) => {
        const h = li === 0 ? firstLineH : 26;
        const measured = makeWords(lineText, sizePt, family);
        layout.push({
          x, y, w, h, words: measured.words, spaceW: measured.spaceW,
          align: 'right', kind: 'toc-row', sizePt, fontKey: measured.fontKey,
          targetPage: row.targetPage != null ? row.targetPage : null
        });
        y += h;
      });
      if (labelText) {
        const labelSize = Number(SZ_CORE.tocNum) || 10.5;
        const measured = makeWords(labelText, labelSize, family);
        layout.push({
          x: GEO.TOC_NUM_X, y: rowY, w: labelW - 8, h: firstLineH,
          words: measured.words, spaceW: measured.spaceW,
          align: 'center', kind: 'toc-label', sizePt: labelSize, fontKey: measured.fontKey
        });
      }
    });

    let title = null;
    if (first && String(page.toc.title || '').trim()) {
      const titleSize = Number(SZ_CORE.tocTitle) || 17;
      // **Iteration-003 (legacy parity):** כותרת התוכן בגוף הטקסט (ToraBook
      // בייחוס, 17pt) — לא בגופן הרמה; ללא fontKey ⇒ /F1 בייצוא.
      const measured = makeWords(page.toc.title, titleSize, null);
      title = {
        x: GEO.COL_L_X, y: GEO.FLOW_TOP + 136, w: 552.3, h: 30,
        words: measured.words, spaceW: measured.spaceW, align: 'center',
        sizePt: titleSize, fontKey: null, bold: true, kind: 'toc-title'
      };
    }
    page.tocLayout = {
      schema: 'toc-layout-v2', rows: layout, title,
      firstTop: top, stretchBottom: bottom, pageWidth: tpl.width
    };
    return true;
  }

  // פרופיל DP הגנרי נשאר ללא שינוי; גאומטריית IMUD אינה מושלכת עליו.
  const PT = 12;
  const spaceW = measure.measureTextWidth(' ', PT, 0);
  const wordsOf = text => String(text || '').split(/\s+/).filter(Boolean).map(w => ({
    text: w, w: measure.measureTextWidth(w, PT, 0)
  }));
  let yi = 0;
  for (const row of rows) {
    const y = 70 + yi * 24;
    if (row.kind === 'group') {
      let xi = 0;
      const items = [];
      for (const it of row.items || []) {
        const text = [it.text, it.label || ''].filter(Boolean).join(' ');
        items.push({ x: 18 + xi, y, w: 60, h: 22, words: wordsOf(text), spaceW,
          targetPage: it.targetPage != null ? it.targetPage : null });
        xi += 80;
      }
      layout.push({ kind: 'group', y, items });
    } else {
      const text = [row.text, row.label || ''].filter(Boolean).join(' ');
      layout.push({ kind: 'row', x: 18, y, w: tpl.width - 36, h: 22, words: wordsOf(text), spaceW,
        targetPage: row.targetPage != null ? row.targetPage : null });
    }
    yi++;
  }
  page.tocLayout = { schema: 'toc-layout-v1', rows: layout, pageWidth: tpl.width, sizePt: PT };
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
  // **Iteration-003 (parity משקל):** בפרופיל IMUD שורות השער מקבלות את המשפחה
  // המילולית כמפתח גופן — הייחוס מציג מהדורה/מחבר/המשך-כותרת-משנה ב-David
  // Libre רגיל (לא Bold). המדידה כבר מילולית (measureOfFamily) — כעת גם
  // הרינדר: תצוגה=ייצוא. ב-DP נשמרת המנהרה התפקידית (עיצוב RED המקורי).
  const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
  const shaarKeyOf = (fam) => (imudProf ? literalFamilyKeyOf(fam) : familyFontKeyOf(fam));
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
  // **Iteration-003 (legacy parity):** פיץ' שורות שער = גודל×1.3 (כמו wrapGate
  // של המורשת) — לא 1.25.
  const blocks = model.blocks.map(bl => {
    // **Iteration-003 (היקף DP):** בלוק גרפי (כתר השער של פרופיל DP) — אין
    // טקסט למדידה; גובה קבוע כמו החוזה המקורי. ב-IMUD אין בלוקים גרפיים
    // (עיצוב השער בא מ-gate-design).
    if (bl.graphic) return { ...bl, lines: [], h: 24, fontKey: null, color: null, sizePt: bl.sizePt };
    const blFam = (bl.fontFamily != null && String(bl.fontFamily) !== '')
      ? String(bl.fontFamily)
      : (shaarFontOf(bl.cls, settings) || null);
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
    const lh = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.3));
    return { ...bl, lines, spaceW, h: lines.length * lh, fontKey: shaarKeyOf(blFam), color: shaarColorOf(bl.cls), sizePt: bl.sizePt };
  });
  const placed = [];
  let y;
  if (model.mode === 'between') {
    const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
    const gaps = Math.max(0, blocks.length - 1);
    const gap = gaps ? Math.max(0, (boxH - total) / gaps) : 0;
    y = boxY;
    for (const bl of blocks) { placed.push({ ...bl, yTop: y }); y += bl.h + gap; }
  } else if (model.mode === 'center') {
    const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
    y = boxY + Math.max(0, (boxH - total) / 2);
    for (const bl of blocks) { placed.push({ ...bl, yTop: y }); y += bl.h; }
  } else {
    // **Iteration-003 (legacy parity — מיקומים קבועים):** כל בלוק נעוץ
    // ב-yTop המכויל שלו; בלוק עם followGap לא עולה מעל תחתית הקודם+המרווח
    // (עטיפת כותרת דוחפת את ההמשך — כמו ה-S6.3/S74 של המורשת).
    let prevBottom = -Infinity;
    for (const bl of blocks) {
      const gap = Number.isFinite(bl.followGap) ? bl.followGap : 0;
      const yTop = Math.max(Number.isFinite(bl.yTop) ? bl.yTop : boxY, prevBottom + gap);
      placed.push({ ...bl, yTop });
      prevBottom = yTop + bl.h;
    }
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
    // **Iteration-003 (legacy parity):** מדידה ורישום בגודל האמיתי של הסלוט
    // מההגדרות (15pt צדדים / 11pt מרכז — כמו הייחוס) — עד כאן 9pt קבוע
    // גם לרינדור, והכותרת הודפסה זעירה.
    const slotSize = Number(s.sizePt) > 0 ? Number(s.sizePt) : 9;
    const w = Math.max(1, Math.round(sMeasure.measureTextWidth(t, slotSize)));
    return { pos: s.pos, align: s.align, text: t, w, sizePt: slotSize, ...(sKey ? { fontKey: sKey } : {}), ...(s.color ? { color: s.color } : {}) };
  });
  // **Iteration-003 (legacy parity):** בסיס הכותרת המכויל (GEO.HEADER_BASELINE
  // — כמו legacy-projector) בפרופיל IMUD; בלי זה הנוסחה הגנרית הדפיסה
  // את הכותרת ~20pt נמוך מדי.
  const imudHdr = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
  const { GEO } = require('../core/imud-geometry');
  page.headerSlotGeo = { schema: 'header-slots-v1', y: geo.y, ...(imudHdr ? { baselineY: GEO.HEADER_BASELINE } : {}), slots: stamped };
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
  // **Iteration-006 (F5/RC-F5a — עוגן העמודון בפרופיל IMUD):** הנוסחה הגנרית
  // (bottom:25px מה-CSS) הנמיכה את הגיליון ב-36.8px מהייחוס (נמדד ב-PDF:
  // y=818.8 מול 791.2). העוגן המכויל = GEO.FOLIO_BASELINE (1054.5px —
  // «עמודון: y0=783.82pt בייחוס»; עם 11pt גיליון: glyph-top=791.2pt במדויק) —
  // כמו HEADER_BASELINE לכותרת העליונה. ההיסט מוחל על y ו-baselineY כאחד.
  const imudFolio = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
  if (imudFolio && geo.baselineY != null) {
    const { GEO } = require('../core/imud-geometry');
    const dy = GEO.FOLIO_BASELINE - geo.baselineY;
    if (Number.isFinite(dy) && dy !== 0) { geo.y += dy; geo.baselineY += dy; }
  }
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
/**
 * **Iteration-003 (legacy parity — פס הסימן):** כמו bands.push(kind:'h2-siman')
 * של המורשת (§1341): בכל עמוד פתיחת-סימן נחתם פס "סימן <גימטריה>" מעל כותרת
 * ה-H2 (עוגן מכויל 307.88px, 20pt, גופן f-siman). המונה מתאפס בכל חלק
 * (h2-reset-siman של המקור, ברירת מחדל true). המילים נמדדות כאן פעם אחת.
 */
function stampSimanBands(pages, settings, measure, stamped) {
  // **היקף:** פרופיל IMUD בלבד — פס הסימן הוא חוזה המקור (h2-auto-siman);
  // ב-DP אין פסי סימן והחותמת אינה רצה.
  const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
  if (!imudProf) return 0;
  const raw = (settings && settings._imudRaw) || {};
  const autoSiman = raw['h2-auto-siman'] !== false && raw['h2-auto-siman'] !== 'false';
  const resetSiman = raw['h2-reset-siman'] !== false && raw['h2-reset-siman'] !== 'false';
  if (!autoSiman) return 0;
  const { toBareGematria } = require('../decoration/folio');
  const simanSize = Number(raw['s-siman']) > 0 ? Number(raw['s-siman']) : (Number(SZ_CORE.siman) || 20);
  const stack = String(raw['f-siman'] || '').split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  const fam = stack || 'AlphaBlack';
  const famMeasure = measureOfFamily(measure, fam, settings);
  const fontKey = familyFontKeyOf(fam);
  let simanCounter = 0;
  let placed = 0;
  for (const page of pages) {
    if (page.type === 'shaar-sub') { if (resetSiman) simanCounter = 0; continue; }
    if (page.type !== 'sign-open') continue;
    if (!page.spanning || !page.spanning.lines || !page.spanning.lines.length) continue;
    const hasH2 = page.spanning.lines.some(ln => ln.kind === 'heading' && ln.level === 2);
    if (!hasH2) continue;
    simanCounter++;
    const text = 'סימן ' + toBareGematria(simanCounter);
    const words = text.split(/\s+/).filter(Boolean).map(word => ({
      text: scrubPUAText(word),
      w: famMeasure.measureTextWidth(scrubPUAText(word), simanSize, 0)
    }));
    // **G3/RC-3 (i004) — עוגן דואלי כמו המורשת (S4.19):** פתיחה שהמקטע שלה נפתח
    // בכותרת רוחבית (h3-span — מסומן על-ידי המתכנן ב-_h2SpanExempt) מרימה את
    // פס הסימן ל-284.9px; פתיחה רגילה — 307.88px. עד כאן עוגן קבוע 307.88 —
    // נמדד ב-PDF הייחוס: 69/88 פתיחות ב-226.1pt (עם-span) מול 13 ב-243.3 (רגילות).
    page.simanBand = {
      y: page._h2SpanExempt ? H2_SIMAN_Y_SPAN : H2_SIMAN_Y, h: 36, sizePt: simanSize, fontKey,
      words, spaceW: famMeasure.measureTextWidth(' ', simanSize, 0)
    };
    placed++;
  }
  if (stamped) stamped.siman = placed;
  return placed;
}

function stampStructuralGeometry(pages, settings, measure) {
  const stamped = { toc: 0, shaar: 0, header: 0, folio: 0, lanes: 0, endnoteTitle: 0, gateDesign: 0, siman: 0 };
  const { planGateDesign } = require('../decoration/gate-design');
  stampSimanBands(pages, settings, measure, stamped);
  for (const page of pages) {
    if (stampTocLayout(page, settings, measure)) stamped.toc++;
    if (stampShaarLayout(page, settings, measure)) stamped.shaar++;
    // **Iteration-003 (legacy parity):** עיצוב השערים המכויל + כלל הכותרת —
    // אחרי חותמת השער (עוגן הגל נקרא ממנה) ואחרי buildHeader של ה-pipeline
    // (הכלל מתנה בקיום סלוטים). overlay גיאומטרי נייטרלי בלבד.
    const gateDeco = planGateDesign(page, settings);
    if (gateDeco.length) {
      page.decorations = Array.isArray(page.decorations) ? page.decorations : [];
      page.decorations.push(...gateDeco);
      stamped.gateDesign += gateDeco.length;
    }
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
