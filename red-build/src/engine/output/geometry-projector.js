// src/engine/output/geometry-projector.js — CP5 model → explicit geometry (S12.1-1, REQ-EXP-01)
'use strict';

/**
 * **מקור גיאומטריה יחיד:** הרנדרר החי (DOM) ממקם שורות בזרימת CSS; הפרויקטור
 * מחשב את אותן מיקומים **מפורש** ממודל CP5 (pages/lines/heightPx/columns) —
 * כך שההדפסה (PDF) והייצוא מקרינים מאותו מקור בלבד (הורג את מחלקת
 * live≠export של כל הגרסאות הקודמות).
 *
 * חוזה מיקום (תואם dom-renderer): טור = תיבה absolute מ־template.columns;
 * שורות נערמות מ־contentBox.top + spanOffset; גובה שורה = ln.heightPx.
 * מילים: RTL — יישור לפי המחלקות (right לשורה רגילה; שורה אחרונה לפי
 * body-last-line-align; קריעה/AQ ברווחים). PUA נאסף לפני הפלט (BRZ-13).
 */

const { scrubPUAText } = require('./dom-renderer');
const { MeasureAPI } = require('../typography/measure-api');
// **S5.4 (P-5):** מקורות יחידים להקרנת ההערות — פקטורי רוחב הגופן מהתקציב
// (אותם מספרים שקבעו את גובה ההערה) וסמן אחיד מ-notes/markers (כמו ה-DOM).
const { NOTE_FONT_FACTORS } = require('../layout/footnote-budget');
const { markerFor } = require('../notes/markers');
const { SIDE_NOTE_FONT_FACTORS } = require('../layout/side-notes');
const { lineFontSizePt, hexColorToRgb } = require('./line-font');
const { composeLineFragments } = require('../layout/line-fragments'); // **03.11(ג):** מקור יחיד — נצרך גם ע"י dom-renderer (תצוגה חיה + ייצוא); מיוצא הלאה לצרכנים קיימים
// **S73:** גופן השערים לפי מחלקת בלוק — מקור יחיד לשני הנתיבים (DOM+PDF)
const { buildShaarBlocks, shaarFontOf } = require('./shaar-content');
const { ornamentInk, parseSvgPaint, svgToPdfOps, svgInkBBox } = require('../decoration/ornament-ink'); // **EXT-4:** הדיו — מקור יחיד לכל הנתיבים // **03.11(ד):** תוכן השערים — אותו מודל כמו ה-DOM

/** **S73 (צבע פר-גופן — גישה מילולית לסורק phantom-key):** '#RRGGBB' → [r,g,b]
 * או null (=שחור — ברירת המחדל של כל הגדרות הצבע; אפס אופרטורי rg ב-PDF). */
function colorOfSetting(hex) {
  return hex ? hexColorToRgb(hex) : null;
}

/** **S73:** מפתח משפחת הגופן לכותב ה-PDF — כמו fontKeyOf של המקרן המורשת:
 * משפחה רשומה ⇒ המשפחה עצמה (תת-גופן ייעודי בייצוא); אחרת null (גוף הטקסט).
 * התפקידים הפונקציונליים (window/fnbody/margin) נשארים בטיפול הקיים. */
function familyFontKeyOf(fam, settings) {
  if (!fam) return null;
  const { registeredFonts } = require('../typography/measure-api');
  if (!registeredFonts.has(fam)) return null;
  if (fam === 'Frank Ruhl Libre') return 'fnbody';
  if (fam === 'Hadassah Friedlaender') return 'margin';
  if (fam === 'FrankReal-Bold' || fam === 'FrankReal') return 'window';
  if (fam === 'David Libre' || fam === 'DavidLibre-Bold') return 'heading';
  return fam;
}

/**
 * הקרנת עמוד בודד לגיאומטריה מפורשת.
 * @param {object} page — עמוד CP5
 * @param {object} settings — הגדרות ממוזגות
 * @param {MeasureAPI} [api] — מדידה (נבנה אם לא הוזרק)
 * @returns {{width, height, contentBox, lines:Array, footnotes, folio, header, spanning}}
 */
function projectPage(page, settings, api) {
  const measure = api || new MeasureAPI(settings, 'table');
  const tpl = page.template;
  const spanOffset = page.spanning ? page.spanning.heightPx : 0;

  const out = {
    width: tpl.width,
    height: tpl.height,
    contentBox: { ...tpl.contentBox },
    columns: tpl.columns.map(c => ({ ...c })),
    lines: [],        // {x, y, w, h, words:[{text,x,w}], align, kind, level, isLast}
    footnotes: [],    // {y, marker, text}
    folio: null,      // {y, text}
    header: null,     // {y, parts}
    spanning: null
  };

  // פס חוצה־טורים — שורותיו ברוחב הפס (מעל הטורים)
  if (page.spanning && page.spanning.lines.length) {
    const left = Math.min(...tpl.columns.map(c => c.x));
    const right = Math.max(...tpl.columns.map(c => c.x + c.w));
    const band = { x: left, y: tpl.contentBox.top, w: right - left, h: page.spanning.heightPx, lines: [] };
    let y = tpl.contentBox.top;
    for (const ln of page.spanning.lines) {
      band.lines.push(projectLine(ln, band.x, y, band.w, settings, measure, 'right'));
      y += ln.heightPx || 0;
    }
    out.spanning = band;
  }

  // **S12 (REQ-EXP-03):** עמודי תוכן־העניינים — שורות בפריסת הרנדרר
  // (toc-rows: top 70, שורה ~24px) — כותרת השורה מימין, התווית משמאל.
  // מצויר גם ב־PDF וגם נכלל בחילוץ הטקסט — עמוד TOC לא ריק.
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    const rows = (page.toc && page.toc.rows) || [];
    let yi = 0;
    const rowH = 24;
    for (const row of rows) {
      const y = 70 + yi * rowH;
      if (row.kind === 'group') {
        let xi = 0;
        for (const it of row.items || []) {
          const text = [it.text, it.label || ''].filter(Boolean).join(' ');
          out.lines.push(fakeLine(text, 18 + xi, y, 60, rowH, settings, measure));
          xi += 80;
        }
      } else {
        const text = [row.text, row.label || ''].filter(Boolean).join(' ');
        out.lines.push(fakeLine(text, 18, y, tpl.width - 36, rowH, settings, measure));
      }
      yi++;
    }
  }

  // **03.11(ד):** תוכן מובנה של עמודי השער — אותו מודל כמו ה-DOM (shaar-content).
  // בלי זה ייצוא ה-PDF הציג עמודי שער ריקים. הפריסה משקפת את ה-flex של ה-DOM:
  // 'between' — בלוק ראשון בראש התיבה, אחרון בתחתית, השאר מופצים ברווחים שווים
  // (space-between); 'center' — מחסנית ממורכזת אנכית. עיטור הכתר גרפי — נדלג.
  if (/^shaar-/.test(page.type)) {
    const model = buildShaarBlocks(page, settings, page._metadata);
    if (model && model.blocks.length) {
      const b = model.box;
      const boxX = b.left, boxW = Math.max(40, tpl.width - b.left - b.right);
      const boxY = b.top, boxH = Math.max(60, tpl.height - b.top - b.bottom);
      // **S73 (תצוגה=ייצוא בגופני השער — נתיב DP):** ה-DOM מציג כל בלוק במשפחת
      // הגופן שלו (shaarFontOf) ובצבעו; עד כאן ההקרנה מדדה וציירה הכול בגוף
      // הטקסט (/F1). כעת: מדידה בגופן הבלוק + fontKey פר-בלוק (משפחה רשומה
      // ⇒ תת-גופן ייעודי) + צבע פר-בלוק מההגדרות (ברירת מחדל שחורה).
      const shaarColorOf = (cls) => {
        if (cls.includes('bsd-header') || cls.includes('publication-footer')) return colorOfSetting(settings['shaar-year-color']);
        if (cls.includes('book-title-main')) return colorOfSetting(settings['shaar-title-color']);
        if (cls.includes('book-subtitle')) return colorOfSetting(settings['shaar-subtitle-color']);
        if (cls.includes('book-description')) return colorOfSetting(settings['shaar-desc-color']);
        if (cls.includes('book-sections-summary')) return colorOfSetting(settings['shaar-sections-color']);
        if (cls.includes('author-block')) return colorOfSetting(settings['shaar-author-color']);
        if (cls.includes('back-shaar-text-line')) return colorOfSetting(settings['shaar-back-text-color']);
        return null;
      };
      // מדידה בגופן הבלוק — כמו ה-DOM (רגיסטרציה נבדקת בזמן ריצה)
      const shaarMeasureOf = (fam) => {
        const { registeredFonts: rf } = require('../typography/measure-api');
        return (fam && rf.has(fam))
          ? new MeasureAPI({ ...settings, 'body-font': fam }, 'font-metrics')
          : measure;
      };
      // גובה כל בלוק: גלישת שורות לרוחב התיבה + גובה שורה לפי הגודל
      const blocks = model.blocks.map(bl => {
        if (bl.graphic) return { ...bl, lines: [], h: 24 };
        const blFam = shaarFontOf(bl.cls, settings) || null;
        const blMeasure = shaarMeasureOf(blFam);
        const words = String(bl.text || '').split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = [], curW = 0;
        for (const w of words) {
          const ww = blMeasure.measureTextWidth(w, bl.sizePt, 0);
          const add = cur.length ? blMeasure.measureTextWidth(' ', bl.sizePt, 0) + ww : ww;
          if (cur.length && curW + add > boxW) { lines.push(cur); cur = [w]; curW = ww; }
          else { cur.push(w); curW += add; }
        }
        if (cur.length) lines.push(cur);
        const lh = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
        return { ...bl, lines, h: lines.length * lh, _fam: blFam, _measure: blMeasure };
      });
      let y;
      if (model.mode === 'between') {
        const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
        const gaps = Math.max(0, blocks.length - 1);
        const gap = gaps ? Math.max(0, (boxH - total) / gaps) : 0;
        y = boxY;
        for (const bl of blocks) {
          if (bl.lines && bl.lines.length) pushCentered(bl, y);
          y += bl.h + gap;
        }
      } else {
        const total = blocks.reduce((a2, b2) => a2 + b2.h, 0);
        y = boxY + Math.max(0, (boxH - total) / 2);
        for (const bl of blocks) {
          if (bl.lines && bl.lines.length) pushCentered(bl, y);
          y += bl.h;
        }
      }
      function pushCentered(bl, yTop) {
        const lh = bl.h / bl.lines.length;
        // **S73:** גופן+צבע פר-בלוק — כמו ה-DOM (renderShaarContent)
        const fk = familyFontKeyOf(bl._fam, settings);
        const color = shaarColorOf(bl.cls);
        bl.lines.forEach((words, li) => {
          const text = words.join(' ');
          const lineH = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
          out.lines.push(centeredLine(text, boxX, yTop + li * lh, boxW, lineH, bl.sizePt, bl._measure, bl.cls, fk, color));
        });
      }
    }
  }

  // **S5.4 (P-5 — עמודי endnotes ריקים):** לעמודי הערות-הסיום יש מודל משלהם —
  // ה"טורים" שלהם מכילים אובייקטי הערה (marker/text/heightPx/colIdx), לא
  // שורות. הלולאה הכללית הקרינה אותם כשורות בלי מילים ⇒ עמודים ריקים לחלוטין
  // ב-PDF. הקרנה ייעודית: כותרת + הערות בטורי המודל.
  if (page.type === 'endnotes') {
    projectEndnotePage(page, settings, measure, out);
  } else {
    // טורים ושורות הגוף
    page.columns.forEach((colLines, ci) => {
      const col = tpl.columns[ci] || { x: 0, w: 0 };
      let y = tpl.contentBox.top + spanOffset;
      for (const ln of colLines) {
        out.lines.push(projectLine(ln, col.x, y, col.w, settings, measure, lastAlignOf(ln, settings)));
        // **EXT-20:** מקדם ה-AQ מיושם על גובה השורה (אנכי) — השורות שאחריה
        // זזות בהתאם; התיבה והבסיס מחושבים מהגובה הנמתח (מודל תיבת שורה).
        y += (ln.heightPx || 0) * (ln.aqStretch || 1);
      }
    });
    // **S5.4 (P-5 — הערות-צד חסרות):** הקרנה לפי ה-placement (x/yTop/colWidth)
    // — כמו ה-aside המוחלט ב-DOM. fontKey 'margin' ⇒ ‏/F6 (Hadassah) ב-PDF.
    if (page.sideNotes && page.sideNotes.length) projectSideNotes(page, settings, measure, out);
    // **S5.4 (P-5 — מפריד טורים חסר):** אותה גיאומטריה כמו renderColumnDivider
    // ב-DOM (מינימום הטורים −8px; x במרכז המרזב).
    projectColumnDivider(page, settings, out);
  }

  // **S5.4 (P-5 — הערות מרוסקות):** מרזב הערות — מילים במדידה אמיתית, שבירה
  // לשורות ברוחב הנתיב, סמן/(המשך), יישור לשני הצדדים, בסיסים פר-שורה ושני
  // נתיבים לפי footnote-columns. בעבר: רשומת טקסט אחת לכל הערה, וה-pdf-writer
  // "פיזר" את מילותיה בקידום קבוע 8.2px ⇒ הערות מרוסקות זו על זו.
  if (page.footnotes && page.footnotes.length) projectFootnoteGutter(page, settings, measure, out);

  // גיליון
  if (page.folioDisplay) {
    // **D-81:** מיקום/רוחב מהמקור היחיד (הקרן, מדידה 10pt) — הכותב וה-ink-bbox צורכים אותו.
    const ft = scrubPUAText(String(page.folioDisplay));
    // **S73 (גופן/גודל/צבע גיליון מההגדרות — נתיב DP):** page-num-font ('' = גוף
    // הטקסט — התנהגות קודמת), page-num-size-pt (ברירת מחדל 10) ו-page-num-color
    // (ברירת מחדל שחורה) — כמו ה-DOM. המדידה בגופן הגיליון כשרשום.
    const folioSz = Number(settings['page-num-size-pt']) > 0 ? Number(settings['page-num-size-pt']) : 10;
    const folioFam = settings['page-num-font'] || '';
    const folioMeasure = (folioFam && familyFontKeyOf(folioFam, settings))
      ? new MeasureAPI({ ...settings, 'body-font': folioFam }, 'font-metrics') : measure;
    const fw = Math.max(1, Math.round(folioMeasure.measureTextWidth(ft, folioSz)));
    // **S5.1 (תיקון C5):** מיקום לפי page-num-position מההגדרות — בעבר מוקשה
    // bottom-center וכל ערך אחר הוגדר בשקט. 'outer' מודע-זוגיות כמו המקור
    // (recto=index זוגי ⇒ שמאל; verso ⇒ ימין) — כמו folio--outer ב-CSS.
    // **S69 (R4-M3 — סגירת קירוב):** העוגן האנכי מה-CSS החי (.folio{bottom:25px})
    // ולא קירוב contentBox.bottom+2 שסטה מה-DOM בכ~17px. הבסיס = תחתית
    // תיבת הגיליון − half-leading − descent (line-height: normal ≈ 1.2 —
    // חסר הגדרה מפורשת ב-CSS); אותה נוסחה משמרת גם את top:4px/6px.
    const FOLIO_BOTTOM_PX = 25; // styles.css: .folio{bottom:25px}
    const folioPx = folioSz * (96 / 72);
    const folioLineH = Math.round(folioPx * 1.2);
    const ascEm = folioMeasure.ascentEm(), descEm = folioMeasure.descentEm();
    const halfLead = Math.max(0, (folioLineH - (ascEm + descEm) * folioPx) / 2);
    const pos = String((settings && settings['page-num-position']) || 'bottom-center');
    if (pos === 'none') { out.folio = null; }
    else {
      const recto = (page.index % 2 === 0);
      let fx = Math.round((tpl.width - fw) / 2);
      let boxTop = tpl.height - FOLIO_BOTTOM_PX - folioLineH; // ראש תיבת הגיליון (כמו ה-DOM)
      let baselineY = boxTop + halfLead + ascEm * folioPx;
      if (pos === 'outer-left' || (pos === 'outer' && recto)) fx = 8;
      else if (pos === 'outer-right' || (pos === 'outer' && !recto)) fx = Math.max(8, Math.round(tpl.width - fw - 8));
      else if (pos === 'top') { boxTop = 4; baselineY = boxTop + halfLead + ascEm * folioPx; } // styles.css: .folio--top{top:4px}
      else if (pos === 'in-header') { boxTop = 6; baselineY = boxTop + halfLead + ascEm * folioPx; } // styles.css: .folio--in-header{top:6px}
      const folioKey = (folioFam && familyFontKeyOf(folioFam, settings)) || null;
      const folioColor = colorOfSetting(settings['page-num-color']);
      out.folio = { y: boxTop, baselineY, x: fx, w: fw, sizePt: folioSz, text: ft, ...(folioKey ? { fontKey: folioKey } : {}), ...(folioColor ? { color: folioColor } : {}) };
    }
  }

  // כותרת עליונה — סלוטים חיים (right/center/left) עם טקסט מפורש (D-61)
  if (page.header && page.header.slots) {
    const slots = ['right', 'center', 'left']
      .map(pos => ({ pos, ...page.header.slots[pos] }))
      .filter(s => s && s.text);
    if (slots.length) {
      // **D-81:** סלוט כותרת עליונה — מיקום/רוחב מפורשים מהמקור היחיד (9pt):
      // הכותב, הכותב החי ותיבת הדיו צורכים את אותם מספרים — לא עוד נוסחאות מקומיות.
      // **S73:** גופן הסלוט מהמודל (s.font — headers-builder מצרף את המשפחה
      // מההגדרות) ⇒ fontKey לכותב ה-PDF (משפחה רשומה ⇒ תת-גופן ייעודי);
      // צבע — s.color מהמודל (ברירת מחדל שחורה). מדידה בגופן הסלוט כשרשום.
      out.header = {
        y: Math.max(0, tpl.contentBox.top - 18),
        slots: slots.map(s => {
          const t = scrubPUAText(String(s.text || ''));
          const sKey = familyFontKeyOf(s.font, settings);
          const sMeasure = sKey && sKey !== 'heading' && sKey !== 'fnbody' && sKey !== 'margin' && sKey !== 'window'
            ? new MeasureAPI({ ...settings, 'body-font': s.font }, 'font-metrics') : measure;
          const w = Math.max(1, Math.round(sMeasure.measureTextWidth(t, 9)));
          const x = s.pos === 'right' ? tpl.width - 60 - w : s.pos === 'center' ? Math.round((tpl.width - w) / 2) : 60;
          return { pos: s.pos, align: s.align, text: t, x, w, sizePt: 9, ...(sKey ? { fontKey: sKey } : {}), ...(s.color ? { color: s.color } : {}) };
        })
      };
    }
  }

  // **EXT-4 (הדיו):** הקרנת העיטורים — ה-rect מהתוכנית + הדיו הפתוח
  // (מקור יחיד: ornament-ink). ה-PDF וה-DOM צורכים את אותה רשימה; לאלה
  // שאין להם דיו (image חיצוני) — ה-rect עובר כרקע בלבד.
  if (page.decorations && page.decorations.length) {
    const hPt = out.height * (72 / 96);
    const PX_TO_PT = 72 / 96;
    const r2 = (v) => Math.round(v * 100) / 100;
    out.decorations = page.decorations.map((d) => {
      const ink = d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle);
      let paint = null;
      let pdfOps = null;
      if (ink && ink.type === 'svg') {
        paint = parseSvgPaint(ink.svg);
        // **EXT-4:** פעולות הציור נחשבות כאן — ה-pdf-writer חף-תלויות
        // (אוסף אובייקטים טהור) ורק מקבל את הפעולות מוכנות (מקור יחיד).
        if (paint) pdfOps = svgToPdfOps(paint, d, hPt, PX_TO_PT);
      } else if (ink && ink.type === 'rule') {
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`0 0 0 rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${Math.max(0.5, r2(d.h * PX_TO_PT))} re f`];
      }
      return {
        x: d.x, y: d.y, w: d.w, h: d.h,
        kind: d.kind || null, slot: d.slot || null, kindStyle: d.kindStyle || null,
        inkType: ink ? ink.type : null, inkUri: ink && ink.uri ? ink.uri : null,
        paint, pdfOps
      };
    });
  }

  // **S12 (parity):** בסיסי שורות/מרזב/גיליון/כותרת — מודל תיבת שורה אחיד
  attachBaselines(out, settings, measure);

  return out;
}

function colLeftOf(tpl) { return Math.min(...tpl.columns.map(c => c.x)); }
function colWidthOf(tpl) {
  const left = Math.min(...tpl.columns.map(c => c.x));
  const right = Math.max(...tpl.columns.map(c => c.x + c.w));
  return right - left;
}

// ============ S5.4 (P-5) — הקרנת הערות-שוליים / עמודי-הערות / הערות-צד / מפרידים ============

/** גודל גוף הערה — 0.8× הגוף (כמו .footnotes{font-size:.8em} ו-noteHeight בתקציב). */
function fnNoteSizePt(settings) { return settings['body-font-size-pt'] * 0.8; }

/**
 * שבירת אסימוני הערה לשורות ממוקמות מילה-במילה (RTL) — אותו חוזה של placeWords
 * של ה-legacy: הסמן/(המשך) בפינה הימנית של השורה הראשונה, יישור מלא לשורות
 * שאינן אחרונות (רווחים מעל הרווח הטבעי — כמו justify של CSS), בסיס פר-שורה
 * לפי מודל תיבת השורה (half-leading + ascent).
 * @param {Array} tokens — [{text, sizePt?, wFactor?}] (wFactor — פקטור רוחב הגופן)
 * @returns {{lines:Array, words:Array, lineCount:number, firstTop:number, firstBaseline:number, h:number}|null}
 */
function wrapNoteTokens(tokens, x, w, yTop, pitch, sizePt, measure, fontKey, color) {
  const live = tokens.filter(t => t.text && String(t.text).trim());
  if (!live.length) return null;
  const spaceW = measure.measureTextWidth(' ', sizePt, 0);
  const toks = live.map(t => {
    const pt = t.sizePt || sizePt;
    return { text: String(t.text), sizePt: pt, w: measure.measureTextWidth(String(t.text), pt, 0) * (t.wFactor || 1) };
  });
  // שבירה חמדנית ברוחב הנתיב — אותה ספירת שורות כמו noteHeight בתקציב
  const rows = [];
  let cur = [], curW = 0;
  for (const tok of toks) {
    const add = cur.length ? spaceW + tok.w : tok.w;
    if (cur.length && curW + add > w) { rows.push(cur); cur = [tok]; curW = tok.w; }
    else { cur.push(tok); curW += add; }
  }
  if (cur.length) rows.push(cur);
  const ascent = measure.ascentEm(), descent = measure.descentEm();
  const sizePx = sizePt * (96 / 72);
  const half = Math.max(0, (pitch - (ascent + descent) * sizePx) / 2);
  const flat = [];
  const lineRecs = rows.map((row, li) => {
    const isLast = li === rows.length - 1;
    const sumW = row.reduce((s, t) => s + t.w, 0);
    const gaps = Math.max(0, row.length - 1);
    let gapW = spaceW;
    if (!isLast && gaps > 0 && sumW + gaps * spaceW < w) gapW = (w - sumW) / gaps;
    const y = yTop + li * pitch;
    const baselineY = y + half + ascent * sizePx;
    const words = [];
    let cursor = x + w; // RTL — מימין לשמאל
    for (const t of row) {
      cursor -= t.w;
      const wd = { text: t.text, x: cursor, w: t.w, sizePt: t.sizePt, baselineY, fontKey, ...(color ? { color } : {}) };
      words.push(wd);
      flat.push(wd);
      cursor -= gapW;
    }
    return { y, h: pitch, baselineY, words };
  });
  return {
    lines: lineRecs, words: flat, lineCount: rows.length, firstTop: yTop,
    firstBaseline: lineRecs.length ? lineRecs[0].baselineY : yTop,
    h: rows.length * pitch
  };
}

/** סמן הערה — מקור אחיד: הסמן שהוקצה, או markerFor לפי המספר (כמו renderFootnoteArea). */
function noteMarkerOf(n, settings) {
  if (n.marker != null && String(n.marker) !== '') return String(n.marker);
  if (Number.isInteger(n.docIndex) || Number.isInteger(n.markerNum)) {
    return markerFor(Number.isInteger(n.docIndex) ? n.docIndex : (n.markerNum || 1), settings['footnote-marker-style']);
  }
  return '';
}

/**
 * **S5.4 (P-5 — הערות מרוסקות):** הקרנת מרזב הערות-השוליים של עמוד DP — נתיב
 * אחד או שניים (footnote-columns), חלוקת הערות זהה לתקציב (LPT דטרמיניסטית
 * — גובה המרזב לעולם אינו חורג מהשמור), וחוט מפריד (fn-rule) מעל המרזב
 * כמו ב-DOM. הערות מוקרנות כמילים במדידה אמיתית — החוזה שה-pdf-writer כבר
 * מצייר (fn.words) — במקום טקסט שפוזר בקידום קבוע.
 */
function projectFootnoteGutter(page, settings, measure, out) {
  const tpl = page.template;
  const fnSize = fnNoteSizePt(settings);
  // **S70 (R7-M4):** פקטורי הגופן הם תיקון טבלת impl A; ב-impl B מדויקות המטריקות והפקטור מולד.
  const factor = (measure && measure.impl === 'font-metrics') ? 1 : (NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1);
  const fullX = colLeftOf(tpl), fullW = colWidthOf(tpl);
  let laneW = settings._fnColWidthPx || Math.round(fullW);
  if (!(laneW > 0) || laneW > fullW) laneW = Math.round(fullW);
  // **S6.0 (R4-M6):** התנא מיושר לשער ה-DOM — שני נתיבים רק בתבנית
  // רב-טורית (בעבר ה-PDF שרטט שני נתיבים גם בתבנית חד-טורית מול נתיב
  // אחד ב-DOM — תצוגה≠ייצוא).
  const twoLanes = settings['footnote-columns'] === 2
    && Array.isArray(tpl.columns) && tpl.columns.length >= 2
    && laneW * 2 + (tpl.gutter || 0) <= fullW + 0.75;
  const notes = page.footnotes;
  const lanes = [[], []];
  if (!twoLanes) {
    lanes[0] = notes.slice();
  } else {
    // LPT — אותו אלגוריתם כמו getFootnotesReservedHeight; הסדר הפנימי בכל נתיב נשמר
    const order = notes.map((n, i) => ({ i, h: n.heightPx || 0 })).sort((a, b) => b.h - a.h || a.i - b.i);
    const totals = [0, 0];
    const laneOf = new Map();
    for (const s of order) { const li = totals[0] <= totals[1] ? 0 : 1; totals[li] += s.h; laneOf.set(s.i, li); }
    notes.forEach((n, i) => lanes[laneOf.get(i)].push(n));
  }
  const reserved = page.fnReservedHeightPx > 0
    ? page.fnReservedHeightPx
    : notes.reduce((s, n) => s + (n.heightPx || 0), 0);
  const gutterTop = tpl.contentBox.bottom - reserved;
  const laneX = twoLanes ? [fullX + laneW + (tpl.gutter || 0), fullX] : [fullX, fullX]; // RTL: הנתיב הראשון מימין
  let inkTop = Infinity;
  lanes.forEach((laneNotes, li) => {
    let y = gutterTop;
    for (const n of laneNotes) {
      const pitch = n.lineH || Math.round(fnSize * (96 / 72) * 1.25);
      const cont = n.isContinuation === true || n.mode === 'split-rest';
      const marker = noteMarkerOf(n, settings);
      const tokens = [];
      if (cont) tokens.push({ text: '(המשך)' });
      if (marker) tokens.push({ text: scrubPUAText(marker) });
      for (const w of String(n.text || '').replace(/\uE000/g, ' ').split(/\s+/)) {
        const t = scrubPUAText(w);
        if (t) tokens.push({ text: t, wFactor: factor });
      }
      const rec = wrapNoteTokens(tokens, laneX[li], laneW, y, pitch, fnSize, measure, 'fnbody', colorOfSetting(settings['f-note-body-color']));
      if (rec) {
        out.footnotes.push({
          y: rec.firstTop, x: laneX[li], w: laneW,
          marker: scrubPUAText(String(n.marker || '')),
          text: scrubPUAText(String(n.text || '').replace(/\uE000/g, ' ')),
          words: rec.words, baselineY: rec.firstBaseline, h: Math.max(n.heightPx || 0, rec.h)
        });
        inkTop = Math.min(inkTop, rec.firstTop);
      }
      y += (n.heightPx || pitch); // התקדמות לפי התקציב — פריסת העמוד לעולם אינה נפרצת
    }
  });
  // חוט המפריד מעל המרזב — כמו .fn-rule ב-renderFootnoteArea (לא במצב 'none')
  const ruleStyle = settings['footnote-separator-rule'];
  if (ruleStyle && ruleStyle !== 'none' && Number.isFinite(inkTop)) {
    pushRuleDecoration(out, tpl, { kind: 'fn-rule', style: String(ruleStyle), x: fullX, w: fullW, y: inkTop });
  }
}

/**
 * **S5.4 (P-5 — עמודי endnotes ריקים):** הקרנת עמוד הערות-הסיום — כותרת
 * (h2, 1.2× הגוף) ואז ההערות בטורי המודל (colIdx/heightPx מ-buildEndnotePages),
 * גוף ההערה ב-0.8× עם פקטור הגופן — אותם מספרים שקבעו את גובה ההערה.
 * השורות נכנסות ל-out.lines ⇒ מצוירות ב-PDF, נכנסות למלאי הגליפים ולתיבת הדיו.
 */
function projectEndnotePage(page, settings, measure, out) {
  const tpl = page.template;
  const bodyPt = settings['body-font-size-pt'];
  const notePt = bodyPt * 0.8;
  // **S71.1 (R7-M4 שארית — בדיקה כפולה):** כמו המרזב והערות-הצד — הפקטור
  // הוא תיקון טבלת impl A; ב-impl B (ייצוא PDF) הוא מנפח את רוחבי המילים
  // בהקרנה ⇒ שבירה מוקדמת מזו שהמודל תיקצב (estimateNoteHeight ללא פקטור)
  // ⇒ הערות-סיום חופפות ב-PDF המיוצא.
  const factor = (measure && measure.impl === 'font-metrics')
    ? 1 : (NOTE_FONT_FACTORS[settings['f-note-body-font']] || 1);
  if (page.heading) {
    const sizePt = bodyPt * 1.2;
    const bandH = (page.titleBandPx && page.titleBandPx > 16) ? page.titleBandPx - 16 : (measure.lineHeightPx ? measure.lineHeightPx(sizePt) : Math.round(sizePt * (96 / 72) * 1.34));
    out.lines.push(fakeLine(scrubPUAText(String(page.heading)), colLeftOf(tpl), tpl.contentBox.top + 8, colWidthOf(tpl), bandH, settings, measure, sizePt, 'heading', 'endnote-title'));
  }
  const top = tpl.contentBox.top + (page.titleBandPx || 0);
  const cols = Math.max(1, (page.columns || []).length);
  // טור-אחד (endnote-columns=1): רשימה ברוחב תיבת התוכן המלא (כמו המנוע
  // שמחשב את גובה ההערה ברוחב המלא) — התבנית עצמה דו-טורית תמיד.
  const singleColMode = (page.columns || []).length === 1;
  for (let ci = 0; ci < cols; ci++) {
    const colNotes = page.columns[ci] || [];
    if (!colNotes.length) continue;
    const col = singleColMode
      ? { x: colLeftOf(tpl), w: colWidthOf(tpl) }
      : (tpl.columns[ci] || { x: colLeftOf(tpl), w: colWidthOf(tpl) / cols });
    let y = top;
    for (const n of colNotes) {
      const pitch = measure.lineHeightPx ? measure.lineHeightPx(notePt) : Math.round(notePt * (96 / 72) * 1.34);
      const marker = noteMarkerOf(n, settings);
      const tokens = [];
      if (marker) tokens.push({ text: scrubPUAText(marker) });
      for (const w of String(n.text || '').replace(/\uE000/g, ' ').split(/\s+/)) {
        const t = scrubPUAText(w);
        if (t) tokens.push({ text: t, wFactor: factor });
      }
      const rec = wrapNoteTokens(tokens, col.x, col.w, y, pitch, notePt, measure, 'fnbody', colorOfSetting(settings['f-note-body-color']));
      if (rec) {
        rec.lines.forEach((line) => {
          out.lines.push({
            x: col.x, y: line.y, w: col.w, h: pitch,
            words: line.words.map(wd => ({ text: wd.text, x: wd.x, w: wd.w, sizePt: wd.sizePt, fontKey: wd.fontKey })),
            align: 'right', kind: 'endnote-note', level: null, isLast: true, sizePt: notePt,
            baselineY: null, tokenId: n.tokenId != null ? n.tokenId : null
          });
        });
      }
      y += (n.heightPx || pitch); // לפי גובה ההערה במודל — כמו הקיבולת שנקבעה
    }
  }
}

/**
 * **S5.4 (P-5 — הערות-צד חסרות):** הקרנת הערות-הצד לפי ה-placement — אותו מיקום
 * מוחלט כמו ה-aside ב-DOM (x/yTop/colWidth), גוף 0.75× (כמו
 * .side-note{font-size:.75em}) עם פקטור s-note-body-font ⇒ ‏/F6 ב-PDF.
 */
function projectSideNotes(page, settings, measure, out) {
  const sizePt = settings['body-font-size-pt'] * 0.75;
  const fontName = settings['s-note-body-font'];
  // **S70 (R7-M4):** בם-בו הפקטור מולד (מטריקות אמת)
  const factor = (measure && measure.impl === 'font-metrics')
    ? 1 : (SIDE_NOTE_FONT_FACTORS[fontName] || (fontName && fontName !== settings['body-font'] ? 1.08 : 1));
  for (const sn of page.sideNotes) {
    if (sn.yTop == null) continue; // רק המוקמות בפועל (placeSideNotes)
    const pitch = Math.round(sizePt * (96 / 72) * 1.15);
    const tokens = [];
    if (sn.counterMark) tokens.push({ text: scrubPUAText(String(sn.counterMark)) });
    for (const w of String(sn.text || '').split(/\s+/)) {
      const t = scrubPUAText(w);
      if (t) tokens.push({ text: t, wFactor: factor });
    }
    const rec = wrapNoteTokens(tokens, sn.x, sn.colWidth, sn.yTop, pitch, sizePt, measure, 'margin', colorOfSetting(settings['s-note-body-color']));
    if (!rec) continue;
    rec.lines.forEach((line) => {
      out.lines.push({
        x: sn.x, y: line.y, w: sn.colWidth, h: pitch,
        words: line.words.map(wd => ({ text: wd.text, x: wd.x, w: wd.w, sizePt: wd.sizePt, fontKey: wd.fontKey })),
        align: 'right', kind: 'side-note', level: sn.level != null ? sn.level : null,
        isLast: true, sizePt, baselineY: null,
        tokenId: sn.anchorToken != null ? sn.anchorToken : (sn.ownToken != null ? sn.ownToken : null)
      });
    });
  }
}

/**
 * **S5.4 (P-5 — מפריד חסר):** חוט מפריד בין הטורים — קו אנכי במרכז המרזב, גובה
 * Math.min(טורים)−8px (כלל V4) — בדיוק כמו renderColumnDivider ב-DOM. מוקרן
 * כעיטור rule: מצויר ב-PDF (pdfOps) ונצבר בתיבת הדיו (parity) באותו ערוץ.
 */
function projectColumnDivider(page, settings, out) {
  const style = settings['column-divider-style'];
  if (!style || style === 'none' || !page.template || (page.columns || []).length < 2) return;
  const tpl = page.template;
  const used = page.columns.map(col => col.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1), 0));
  const h = Math.max(0, Math.min(...used) - 8);
  if (h <= 0) return;
  const c1 = tpl.columns[1];
  if (!c1) return;
  const x = c1.x + c1.w + (tpl.gutter || 0) / 2;
  pushRuleDecoration(out, tpl, { kind: 'col-divider', style: String(style), x, y: tpl.contentBox.top, h, vertical: true });
}

/** הגדרות קו לפי ה-CSS: עובי (pt), צבע RGB 0..1, מקף (px), כפול (px), צמצום רוחב. */
const RULE_STYLES = {
  'fn-rule': {
    regular: { w: 0.75, color: [0, 0, 0] },
    circles: { w: 1.1, color: [0, 0, 0], dash: [0.75, 1.7] },
    sparkle: { w: 1.1, color: [0.42, 0.42, 0.42], dash: [2.25, 2.25] },
    star: { w: 0.75, color: [0.29, 0.29, 0.29], double: 1.5 },
    diamond: { w: 1.1, color: [0, 0, 0], scaleX: 0.6 }
  },
  'col-divider': {
    thin: { w: 0.75, color: [0.6, 0.6, 0.6] },
    dashed: { w: 0.75, color: [0.6, 0.6, 0.6], dash: [2.25, 2.25] },
    double: { w: 0.75, color: [0.6, 0.6, 0.6], double: 1.5 }
  }
};

/**
 * הוספת קו (אופקי/אנכי) כעיטור rule — מצויר ב-PDF דרך pdfOps ונצבר בתיבת הדיו
 * במלואו (אותו ערוץ כמו עיטורי המנוע). מרכז הדיו על הקו עצמו.
 */
function pushRuleDecoration(out, tpl, spec) {
  const table = RULE_STYLES[spec.kind] || {};
  const st = table[spec.style] || { w: 0.75, color: [0, 0, 0] };
  const PX_TO_PT = 72 / 96;
  const hPt = tpl.height * PX_TO_PT;
  const r2 = (v) => Math.round(v * 100) / 100;
  const col = st.color;
  const ops = [];
  const emit = (x1, y1, x2, y2) => {
    ops.push(`${r2(col[0])} ${r2(col[1])} ${r2(col[2])} RG`);
    if (st.dash) ops.push(`[${st.dash.map(r2).join(' ')}] 0 d`);
    ops.push(`${r2(st.w)} w`);
    ops.push(`${r2(x1 * PX_TO_PT)} ${r2(hPt - y1 * PX_TO_PT)} m ${r2(x2 * PX_TO_PT)} ${r2(hPt - y2 * PX_TO_PT)} l S`);
    if (st.dash) ops.push('[] 0 d');
  };
  let inkX = spec.x, inkY = spec.y, inkW = spec.w || 0, inkH = spec.h != null ? spec.h : 1;
  if (spec.vertical) {
    emit(spec.x, spec.y, spec.x, spec.y + spec.h);
    if (st.double) emit(spec.x + st.double, spec.y, spec.x + st.double, spec.y + spec.h);
    const strokePx = st.w * (96 / 72) + (st.double ? st.double : 0);
    inkX = spec.x - strokePx / 2;
    inkW = Math.max(0.75, strokePx);
  } else {
    let x1 = spec.x, x2 = spec.x + (spec.w || 0);
    if (st.scaleX) { const cx = (x1 + x2) / 2; x1 = cx - (spec.w * st.scaleX) / 2; x2 = cx + (spec.w * st.scaleX) / 2; }
    emit(x1, spec.y, x2, spec.y);
    if (st.double) emit(x1, spec.y + st.double, x2, spec.y + st.double);
    inkX = x1;
    inkW = x2 - x1;
    inkH = Math.max(0.75, st.w * (96 / 72) + (st.double ? st.double : 0));
  }
  if (!out.decorations) out.decorations = [];
  out.decorations.push({
    x: inkX, y: inkY, w: inkW, h: Math.max(0.75, inkH),
    kind: spec.kind, slot: null, kindStyle: null,
    inkType: 'rule', inkUri: null, paint: null, pdfOps: ops
  });
}

/** יישור שורה אחרונה לפי ההגדרה (ברירת מחדל center — תואם BASE_CSS). */
function lastAlignOf(ln, settings) {
  if (!ln.isLast) return 'justify';
  const mode = settings['body-last-line-align'] || 'center';
  return mode === 'stretch' ? 'justify' : mode; // stretch בשורה אחרונה = יישור מלא כמו רגילה
}

/**
 * הקרנת שורה בודדת: מילים עם מיקומי x מפורשים (RTL — מימין לשמאל).
 * @param {string} align — 'justify' | 'right' | 'center'
 */
/** **S68 (R2-M6):** מפת גורמי גודל של סגנונות inline מותאמים — עם מטמון
 *  פר-settings (WeakMap) כדי שלא לפרסר את ה-JSON בכל שורה מוקרנת.
 *  אותו חישוב כמו בפענוח (pipeline→inlineSizeFactor) — מקור יחיד לגורם. */
const _csFactorCache = new WeakMap();
function customFactorMapOf(settings) {
  if (!settings || !settings._customStyles) return null;
  let m = _csFactorCache.get(settings);
  if (!m) {
    m = new Map();
    try {
      const { parseCustomStyles } = require('../extensions/style-schema');
      const { inlineSizeFactor } = require('../extensions/apply-styles');
      const res = parseCustomStyles(settings._customStyles);
      for (const st of (res.styles || [])) {
        const f = inlineSizeFactor(st.style, settings['body-font-size-pt']);
        if (Number.isFinite(f) && f > 0) m.set(st.id, f);
      }
    } catch (e) { /* סגנונות שבורים — גורם 1 במקום קריסה */ }
    _csFactorCache.set(settings, m);
  }
  return m;
}

function projectMeasuredLine(ln, colX, y, colW, settings, align, sizePt) {
  const items = ln.fragments.map(fragment => ({ ...fragment }));
  if (!items.length) return null;

  if (align === 'justify' && !ln.isLast) {
    const naturalWidth = items.reduce((sum, item) =>
      sum + item.widthPx + (item.gapAfterPx || 0), 0);
    const gapIndexes = [];
    for (let i = 0; i < items.length - 1; i++) {
      if ((items[i].gapAfterPx || 0) > 0) gapIndexes.push(i);
    }
    const extra = colW - naturalWidth;
    if (extra > 0 && gapIndexes.length) {
      const add = extra / gapIndexes.length;
      for (const index of gapIndexes) items[index].gapAfterPx += add;
    }
  }

  const placement = composeLineFragments(items, {
    x: colX, y, widthPx: colW,
    heightPx: ln.heightPx || 0,
    direction: 'rtl',
    align: align === 'justify' ? 'right' : align
  });
  if (!placement.ok) {
    throw new Error('geometry-projector: measured inline fragments overflow line by ' +
      roundTo3(placement.requiredWidthPx - placement.availableWidthPx) + 'px');
  }

  const bodyColor = colorOfSetting(settings['body-color']);
  const fragments = placement.fragments.map(fragment => {
    if (fragment.kind !== 'text') return fragment;
    let segmentRight = fragment.x + fragment.widthPx;
    const sourceSegments = Array.isArray(fragment.segments) && fragment.segments.length
      ? fragment.segments
      : [{ text: fragment.text, widthPx: fragment.widthPx, fontFamily: fragment.fontFamily || null }];
    const segments = sourceSegments.map(segment => {
      const widthPx = Number(segment.widthPx);
      segmentRight -= widthPx;
      const fontKey = familyFontKeyOf(segment.fontFamily, settings);
      return {
        ...segment, x: segmentRight, y, widthPx,
        sizePt: segment.sizePt || fragment.sizePt || sizePt,
        ...(fontKey ? { fontKey } : {})
      };
    });
    return {
      ...fragment,
      segments,
      sizePt: fragment.sizePt || sizePt,
      ...(segments.length === 1 && segments[0].fontKey ? { fontKey: segments[0].fontKey } : {}),
      ...(fragment.color ? {} : (bodyColor ? { color: bodyColor } : {}))
    };
  });

  const words = fragments.filter(fragment => fragment.kind === 'text').map(fragment => ({
    text: fragment.text, x: fragment.x, w: fragment.widthPx,
    sizePt: fragment.sizePt || sizePt,
    ...(fragment.fontKey ? { fontKey: fragment.fontKey } : {}),
    ...(fragment.color ? { color: fragment.color } : {}),
    segments: fragment.segments
  }));
  const heightPx = Math.max(ln.heightPx || 0, ...fragments.map(fragment => fragment.heightPx || 0));
  return {
    x: colX, y, w: colW, h: heightPx * (ln.aqStretch || 1),
    words, fragments, align,
    kind: ln.kind || 'paragraph', level: ln.level, isLast: !!ln.isLast,
    sizePt,
    tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
    baselineY: null
  };
}
function roundTo3(value) { return Math.round(value * 1000) / 1000; }

function projectLine(ln, colX, y, colW, settings, measure, align) {
  if (Array.isArray(ln.fragments)) return projectMeasuredLine(ln, colX, y, colW, settings, align, lineFontSizePt(ln, settings));
  const sizePt = lineFontSizePt(ln, settings);
  // **S73 (תצוגה=ייצוא בגופני כותרות — נתיב DP):** ה-DOM מציג כותרות inline
  // בגופן הרמה מההגדרות (heading-N-font) ובצבען (heading-N-color); עד כאן
  // ההקרנה ציירה הכול בגוף הטקסט (/F1). כעת: fontKey משפחה + צבע — כמו ה-DOM.
  // וכן צבע גוף (body-color; שחור ⇒ אפס אופרטורי rg).
  const isHeadingLine = ln.kind === 'heading' && ln.level != null;
  const hFontKey = isHeadingLine ? familyFontKeyOf(settings[`heading-${ln.level}-font`], settings) : null;
  const hColor = isHeadingLine ? colorOfSetting(settings[`heading-${ln.level}-color`]) : null;
  const bodyColor = colorOfSetting(settings['body-color']);
  // **S68 (R2-M6 — סגירת פער PDF↔DOM):** גודל אפקטיבי פר-מילה. המודל נמדד
  // בסקאלות אלה בזמן הפענוח (measureWithParen: paren×scale, custom×factor)
  // וה-DOM מציג אותן כך (span.w--paren / span.w--custom); ההקרנה ל-PDF חייבת
  // למדוד ולהציג באותם גדלים — אחרת מילות הסוגריים/הסגנון חורגות מה-DOM
  // ומהמודל שנמדד. ה-pdf-writer מכבד w.sizePt פר-מילה ממילא.
  const parenScale = Number(settings['paren-style-scale']) || 1;
  const csFactors = (ln.customSpans && ln.customSpans.length) ? customFactorMapOf(settings) : null;
  const parenSet = (ln.parenSpans && ln.parenSpans.length && parenScale !== 1) ? new Set(ln.parenSpans) : null;
  const effSizeOf = (i) => {
    let s = sizePt;
    if (csFactors) {
      const cs = ln.customSpans.find((c) => c.wi === i);
      if (cs) { const f = csFactors.get(cs.styleId); if (f != null) s *= f; }
    }
    if (parenSet && parenSet.has(i)) s *= parenScale;
    return s;
  };
  const words = (ln.words || []).map(w => scrubPUAText(String(w).replace(/\u00A0/g, ' '))).filter(Boolean);
  const spaceW = measure.measureTextWidth(' ', sizePt, 0);
  const widths = words.map((w, i) => measure.measureTextWidth(w, effSizeOf(i)));
  const sumW = widths.reduce((s, w) => s + w, 0);
  const gaps = Math.max(0, words.length - 1);

  // רוחב רווחים: שורת יישור מלאה מפרשת לרוחב הטור (לפחות רווח בסיס);
  // שורה אחרונה — רווח בסיס.
  // **EXT-20:** ה-AQ כבר אינו מוחל כאן — מקדם המתיחה הוא אנכי (גובה שורה)
  // ומיושם בלולאת ה-y של הטור; כאן רווחים גיאוגטריים בלבד.
  let gapW = spaceW;
  if (align === 'justify' && gaps > 0 && sumW + gaps * spaceW < colW) {
    gapW = (colW - sumW) / gaps;
  }

  const lineW = sumW + gaps * gapW;
  let xRight; // הקצה הימני של השורה
  if (align === 'center') xRight = colX + (colW + lineW) / 2;
  else if (align === 'right') xRight = colX + colW;
  else xRight = colX + colW; // justify: מילה ראשונה נצמדת לימין, האחרונה לשמאל

  const wordPos = [];
  let cursor = xRight;
  for (let i = 0; i < words.length; i++) {
    const eff = effSizeOf(i);
    cursor -= widths[i];
    // **S68:** סמן גודל פר-מילה רק כשהוא שונה מגודל השורה — שורות רגילות
    // (ברירת מחדל, בלי סוגריים/סגנון) נשארות בדיוק כפי שהיו (נייטרליות).
    wordPos.push({
      text: words[i], x: cursor, w: widths[i],
      ...(eff !== sizePt ? { sizePt: eff } : {}),
      ...(hFontKey ? { fontKey: hFontKey } : {}),
      ...(hColor ? { color: hColor } : {}),
      ...(!hColor && bodyColor ? { color: bodyColor } : {})
    });
    cursor -= gapW;
  }

  return {
    x: colX, y, w: colW, h: (ln.heightPx || 0) * (ln.aqStretch || 1),
    words: wordPos, align, kind: ln.kind || 'paragraph',
    level: ln.level, isLast: !!ln.isLast, sizePt,
    tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
    // **S12 (parity):** קו בסיס לפי מודל תיבת השורה של CSS —
    // half-leading + ascent (מפרופיל הגופן/מכויל) — אותו חוזה ל־PDF ולרסטר.
    baselineY: null
  };
}

/** השלמת baselineY לכל שורות העמוד (לאחר ההקרנה) — מקור מדידה אחד. */
function attachBaselines(page, settings, measure) {
  const ascent = measure.ascentEm(), descent = measure.descentEm();
  // **S71.1:** גובה cap לפי מדד אמת (OS/2 sCapHeight ב-impl B; 0.70 בטבלה) —
  // כמו ב-dropword. אותיות עברית/לטינית מגיעות לקו ה-cap, לא ל-ascender
  // (למעט למ"ד/גרשיים) — חיזוי ראש הדיו לפי ascent מנפח בכותרות.
  const capEm = measure.capHeightEm ? measure.capHeightEm() : 0.7;
  for (const ln of [...(page.spanning ? page.spanning.lines : []), ...page.lines]) {
    const sizePx = ln.sizePt * (96 / 72);
    const contentH = (ascent + descent) * sizePx;
    const halfLeading = (ln.h - contentH) / 2;
    ln.baselineY = ln.y + Math.max(0, halfLeading) + ascent * sizePx;
    ln.ascentPx = ascent * sizePx;
    ln.descentPx = descent * sizePx;
    ln.capPx = capEm * sizePx;
  }
  if (page.footnotes) {
    // **S5.4:** להערה עם מילים יש כבר בסיס פר-מילה מההקרנה; הנוסחה נשארת
    // כנפילה בלבד להערות בלי מילים.
    for (const fn of page.footnotes) { if (!fn.words || !fn.words.length) fn.baselineY = fn.y + ascent * 11 * (96 / 72); }
  }
  if (page.folio) page.folio.baselineY = page.folio.baselineY != null ? page.folio.baselineY : page.folio.y + 10; // **S69:** נוסחת הנפילה רק אם לא חושב בקרן
  if (page.header) page.header.baselineY = page.header.y + 10;
}

/** שורה מלאכותית (TOC/עזר) — מילה אחת מימין לשמאל; מיקום מפורש. */
/** **03.11(ד):** שורת שער ממורכזת — מילים ממוקמות מהמרכז החוצה (RTL). */
/* **S5.4 (P-5):** fakeLine הורחבה — sizePt/fontKey/kind נתונים לכותרת עמודי
   ההערות (1.2× הגוף, /F3) בלי לשנות את הקריאות הקיימות. */
/* **S73:** centeredLine — גופן (fontKey משפחה) וצבע פר-בלוק כמו ה-DOM. */
function centeredLine(text, x, y, w, h, sizePt, measure, cls, fontKey, color) {
  const words = String(text || '').split(/\s+/).filter(Boolean).map(w2 => scrubPUAText(w2));
  const widths = words.map(w2 => measure.measureTextWidth(w2, sizePt, 0));
  const gapW = measure.measureTextWidth(' ', sizePt, 0);
  const totalW = widths.reduce((a, b2) => a + b2, 0) + gapW * Math.max(0, words.length - 1);
  // RTL: המילה הראשונה בקצה הימני של הטקסט הממורכז, והשאר משמאל לה
  let cursor = x + (w + totalW) / 2; // הקצה הימני של הטקסט
  const wordPos = [];
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i], ...(fontKey ? { fontKey } : {}), ...(color ? { color } : {}) });
    cursor -= gapW;
  }
  return { x, y, w, h, words: wordPos, align: 'center', kind: 'shaar-content', level: null, isLast: false, sizePt, baselineY: null, tokenId: null, cls: cls || '' };
}

function fakeLine(text, x, y, w, h, settings, measure, sizePt, fontKey, kind) {
  const pt = sizePt || 12;
  const words = String(text || '').split(/\s+/).filter(Boolean).map(w2 => scrubPUAText(w2));
  const widths = words.map(w2 => measure.measureTextWidth(w2, pt, 0));
  const gapW = measure.measureTextWidth(' ', pt, 0);
  let cursor = x + w;
  const wordPos = [];
  for (let i = 0; i < words.length; i++) {
    cursor -= widths[i];
    wordPos.push({ text: words[i], x: cursor, w: widths[i], sizePt: pt, fontKey: fontKey || null });
    cursor -= gapW;
  }
  return { x, y, w, h, words: wordPos, align: 'right', kind: kind || 'toc-row', level: null, isLast: false, sizePt: pt, baselineY: null, tokenId: null };
}

/**
 * הקרנת מסמך שלם (כל העמודים) + תיבת דיו (ink bbox) לכל עמוד —
 * לבדיקת ה־parity (raster מול מודל).
 */
function projectDocument(result, settings, api) {
  const pages = result.pages.map(p => projectPage(p, settings, api));
  const ascent = (api || new MeasureAPI(settings, 'table')).ascentEm();
  const descent = (api || new MeasureAPI(settings, 'table')).descentEm();
  const inkBounds = pages.map(pg => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const acc = (x, y, w, h) => {
      if (x < minX) minX = x; if (x + w > maxX) maxX = x + w;
      if (y < minY) minY = y; if (y + h > maxY) maxY = y + h;
    };
    for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
      for (const w of ln.words) {
        if (!w.text.trim()) continue;
        const sizePx = ln.sizePt * (96 / 72);
        // דיו צמוד לגליפים: בסיס − (ascent×0.93) עד בסיס + descent; צדדים — תיבת המילה
        acc(w.x, ln.baselineY - ascent * sizePx * 0.93, w.w, (ascent * 0.93 + descent) * sizePx);
      }
    }
    // **S5.4:** דיו הערה — ממילותיה (רב-שורתית, בסיסים פר-שורה); הנוסחה
    // הישנה (תיבה 14px) נשארת כנפילה להערות בלי מילים.
    for (const fn of pg.footnotes) {
      if (fn.words && fn.words.length) {
        for (const w of fn.words) {
          if (!w.text || !w.text.trim()) continue;
          const sizePx = (w.sizePt || 8.5) * (96 / 72);
          acc(w.x, w.baselineY - ascent * sizePx * 0.93, w.w, (ascent * 0.93 + descent) * sizePx);
        }
      } else if ((String(fn.marker || '') + String(fn.text || '')).trim()) acc(fn.x, fn.baselineY - 9, fn.w, 14);
    }
    // **D-81:** כל טקסט מצויר נכנס לתיבת הדיו — גם גיליון וגם סלוטי כותרת עליונה,
    // במיקום/רוחב של המקור היחיד (הקרן). בעבר הכותרת לא נצברה כלל ⇒ המודל היה
    // צר מהרסטר בעמודים עם כותרת — פער שנחשף בחיזוק בדיקת הקבלה (S13, 03.11).
    if (pg.folio && pg.folio.text) {
      const w = pg.folio.w != null ? pg.folio.w : Math.max(20, pg.folio.text.length * 6);
      const x = pg.folio.x != null ? pg.folio.x : (pg.width - w) / 2;
      const by = pg.folio.baselineY != null ? pg.folio.baselineY : pg.folio.y + 10;
      acc(x, by - 10, w, 16);
    }
    if (pg.header) {
      for (const s of pg.header.slots || []) {
        if (!s.text || !s.text.trim()) continue;
        const w = s.w != null ? s.w : s.text.length * 5.5;
        const x = s.x != null ? s.x : (s.pos === 'right' ? pg.width - 60 - w : s.pos === 'center' ? (pg.width - w) / 2 : 60);
        const by = pg.header.baselineY != null ? pg.header.baselineY : pg.header.y + 10;
        acc(x, by - 10, w, 15);
      }
    }
    // **EXT-4:** גם דיו העיטורים נצבר — הם מצוירים כעת ב-PDF (pdfOps) וברסטר
    // מופיעים. תיבת הדיו נלקחת מהצורות עצמן (svgInkBBox — אותה התאמת 'meet'
    // כמו הציור), לא מה-rect המלא: לצורה צרה בתיבה רחבה יש שוליים שאינם דיו.
    for (const d of (pg.decorations || [])) {
      if (d.inkType === 'rule') { acc(d.x, d.y, d.w, Math.max(0.75, d.h)); continue; }
      if (d.inkType === 'image' || !d.paint) continue;
      const bb = svgInkBBox(d.paint, d);
      if (bb) acc(bb.minX, bb.minY, bb.maxX - bb.minX, bb.maxY - bb.minY);
    }
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY };
  });
  return { pages, inkBounds, layoutHash: result.layoutHash };
}

module.exports = { projectPage, projectLine, projectDocument, projectMeasuredLine, lineFontSizePt, attachBaselines };
