// src/engine/core/materialize.js — **שלב 8 (§4.1): materialization חד-פעמי של הגאומטריה**
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

const { scrubPUAText } = require('./pua-text'); // **ביקורת §3.1:** מודול ניטרלי — הליבה אינה מייבאת מהרנדרר עוד
const { MeasureAPI } = require('../typography/measure-api'); // פרופיל גופן (ascent/descent) — לא מדידת טקסט ב-production
const { familyFontKeyOf } = require('../typography/font-keys'); // **ביקורת §3.1:** מקור יחיד למיפוי משפחה→מפתח (היה כפול בין כאן ל-structural-stamps)
const { folioGeometry: folioGeoOf, headerGeometry: headerGeoOf } = require('../layout/furniture-geometry'); // **שלב 6:** גיאומטריית ריהוט — מקור יחיד ל-DOM ול-PDF
const NM = require('../layout/notes-model'); // **שלב 6 פרוסה 2 (§9):** חותמות ההערות — המקרינים צורכים ואינם מודדים
const { markerForSettings } = require('../notes/markers');
const { lineFontSizePt, hexColorToRgb } = require('../output/line-font'); // **03.11(ג):** מקור יחיד — נצרך גם ע"י dom-renderer (תצוגה חיה + ייצוא); מיוצא הלאה לצרכנים קיימים
// **S73:** גופן השערים לפי מחלקת בלוק — מקור יחיד לשני הנתיבים (DOM+PDF)
const { buildShaarBlocks, shaarFontOf } = require('../output/shaar-content');
const { ornamentInk, parseSvgPaint, svgToPdfOps, svgInkBBox } = require('../decoration/ornament-ink'); // **EXT-4:** הדיו — מקור יחיד לכל הנתיבים // **03.11(ד):** תוכן השערים — אותו מודל כמו ה-DOM
const { assignFootnoteLanes } = require('../layout/footnote-lanes'); // **שלב 5:** מקור-אמת יחיד לחלוקת נתיבי המרזב

/** מונה נפילות materialization — מאופס בכל הרצה; לעולם לא שקט (diagnostics בפלט). */
let materializeFallbacks = null;

/** **S73 (צבע פר-גופן — גישה מילולית לסורק phantom-key):** '#RRGGBB' → [r,g,b]
 * או null (=שחור — ברירת המחדל של כל הגדרות הצבע; אפס אופרטורי rg ב-PDF). */
function colorOfSetting(hex) {
  return hex ? hexColorToRgb(hex) : null;
}

/** פענוח ארגומנט שלישי: API ישירות (compat) או אובייקט אפשרויות {measure, mode}. */
function resolveRunOpts(apiOrOpts) {
  if (apiOrOpts && typeof apiOrOpts.measureTextWidth === 'function') {
    return { measure: apiOrOpts, production: false };
  }
  const o = (apiOrOpts && typeof apiOrOpts === 'object') ? apiOrOpts : {};
  return { measure: o.measure || null, production: o.mode === 'production' };
}

/**
 * הקרנת עמוד בודד לגיאומטריה מפורשת.
 * @param {object} page — עמוד CP5
 * @param {object} settings — הגדרות ממוזגות
 * @param {MeasureAPI} [api] — מדידה (נבנה אם לא הוזרק)
 * @returns {{width, height, contentBox, lines:Array, footnotes, folio, header, spanning}}
 */
function projectPage(page, settings, apiOrOpts) {
  const runOpts = resolveRunOpts(apiOrOpts);
  const production = runOpts.production;
  // פרופיל גופן לבסיסים בלבד (ascent/descent/cap — נתוני טבלה סטטיים); מדידת
  // טקסט אסורה ב-production — מוכח בבדיקת s8b (patch ל-prototype שזורק).
  const measure = runOpts.measure || new MeasureAPI(settings, 'table');
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
    // **חוזה H3 + הזמנות עיטור (D-S2H3/F-08):** שורות הפס מתחילות אחרי הריפוד
    // העליון שהוזמן בתכנון — titleTopPadPx (ריפוד 8px של פס H3 לפי ה-CSS המקורי,
    // או הזמנת עיטור-H2). ornament-plan כבר מניח הנחה זו (titleTop); עד כאן
    // ההקרנה התעלמה ממנה ושורות הפס עלו על שטח ההזמנה.
    const topPad = page.spanning.titleTopPadPx || 0;
    // **Iteration-003 (legacy parity — פסים ממוקמים בעוגן מכויל):** לפסי
    // פתיחת-הסימן/ההקדמה יש עוגן אנכי מכויל (bandTopPx) בתוך השטח השמור
    // של התבנית — לא בראש תיבת התוכן; שורה עם yPx משלה נעוצה בו.
    let y = (page.spanning.bandTopPx != null ? page.spanning.bandTopPx : tpl.contentBox.top) + topPad;
    for (const ln of page.spanning.lines) {
      if (ln.yPx != null) y = ln.yPx;
      // **U-15:** אותו מקור סמכות ליישור בפס החוצה־טורים — בעבר 'right' קבוע
      // לכל שורות הפס (כותרות H2/H3–H6 ו-callouts) ⇒ כותרות צמודות-ימין
      // (נמדד: אסימטריה 170–222px ממרכז הפס) בניגוד לחוזה המרכוז של המורשת
      // ושל המקרן הישן. כותרת ⇒ center; שורת callout שאינה-אחרונה ⇒ justify —
      // בדיוק כמו renderLine הישן שרינדר את שורות הפס באותה החלטה.
      band.lines.push(projectLine(ln, band.x, y, band.w, settings, measure, lineAlignOf(ln, settings), production));
      y += ln.heightPx || 0;
    }
    out.spanning = band;
  }

  // **Iteration-003 (legacy parity — פס הסימן):** חותמת h2-siman מהתכנון —
  // שורה ממורכזת בעוגן המכויל, מילים נמדדות בהטבעה (אין מדידה כאן).
  if (page.simanBand && page.simanBand.words && page.simanBand.words.length) {
    const sb = page.simanBand;
    const tplW2 = Math.min(...tpl.columns.map(c => c.x + c.w)) - Math.max(...tpl.columns.map(c => c.x));
    out.lines.push(stampedRowLine({
      x: Math.min(...tpl.columns.map(c => c.x)), y: sb.y, w: tplW2, h: sb.h || 36,
      words: sb.words, spaceW: sb.spaceW, align: 'center'
    }, sb.sizePt || 20, 'h2-siman', sb.fontKey || null));
  }

  // **פרוסה 3 (§2.4 — כיסוי מלא):** עמודים מותאמים — התיבות והתמונות בגיאומטריה
  // סופית מהתוכנית (page.custom; הוחלטו בתכנון העמוד) עוברות כמו שהן להקרנה.
  // מעבר נתונים טהור — אין כאן מדידה ואין החלטה; המקרין של ה-PageModel מצייר
  // והמקרין הישן ממשיך בנתיב שלו (עד שלב 9).
  if (page.type === 'custom' && page.custom) {
    out.custom = {
      boxes: (page.custom.boxes || []).map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, text: b.text || '' })),
      images: (page.custom.images || []).map(im => ({ x: im.x, y: im.y, w: im.w, h: im.h, src: im.src || null }))
    };
  }

  // **S12 (REQ-EXP-03) + שלב 8 (§4.1):** עמודי תוכן־העניינים — השורות מהחותמת
  // שהוטבעה בזמן התכנון (structural-stamps: מילים נמדדות פעם אחת); ההקרנה
  // ממקמת את המילים החותמות ואינה מודדת. חותמה חסרה — נפילה מדווחת.
  if (page.type === 'toc-general' || page.type === 'toc-detail') {
    if (page.tocLayout && page.tocLayout.rows) {
      if (page.tocLayout.title) {
        const t = page.tocLayout.title;
        out.lines.push(stampedRowLine(t, t.sizePt || page.tocLayout.sizePt || 12, 'toc-title', t.fontKey));
      }
      for (const row of page.tocLayout.rows) {
        out.lines.push(stampedRowLine(row, row.sizePt || page.tocLayout.sizePt || 12, row.kind || 'toc-row', row.fontKey));
      }
    } else {
      materializeFallbacks.push({ kind: 'materialize-fallback-toc-stamp', page: page.index });
      if (!production) { // **§3.1:** compat בלבד; בייצור — diagnostic מזוהה, אין השחזור/מדידה
      const rows = (page.toc && page.toc.rows) || [];
      let yi = 0;
      for (const row of rows) {
        const y = 70 + yi * 24;
        if (row.kind === 'group') {
          let xi = 0;
          for (const it of row.items || []) {
            const text = [it.text, it.label || ''].filter(Boolean).join(' ');
            out.lines.push(fakeLine(text, 18 + xi, y, 60, 24, settings, measure));
            xi += 80;
          }
        } else {
          const text = [row.text, row.label || ''].filter(Boolean).join(' ');
          out.lines.push(fakeLine(text, 18, y, tpl.width - 36, 24, settings, measure));
        }
        yi++;
      }
      } // סוף שמירת compat
    }
  }

  // **03.11(ד) + שלב 8 (§4.1):** תוכן מובנה של עמודי השער — מהחותמת שהוטבעה
  // בזמן התכנון (structural-stamps: בלוקים+שורות+רוחבי מילים+גופן+צבע+מיקום
  // אנכי). ההקרנה ממקמת מילים חותמות — אין שבירה ואין מדידה כאן.
  if (/^shaar-/.test(page.type) && page.shaarLayout && page.shaarLayout.blocks) {
    for (const bl of page.shaarLayout.blocks) {
      // **פרוסה 3 (§2.2/§2.4):** כתרי השער — דיו SVG ממקור יחיד (shaar-content),
      // מוקרן כעיטור בגיאומטריה הסופית מהחותמת; המקרינים קוראים ואינם
      // מטמיעים את הנתיבים בעצמם (אין עותק שני של הדיו).
      if (bl.graphic) {
        const { crownSvgOf } = require('../output/shaar-content');
        const { svgDataUri } = require('../decoration/asset-registry');
        if (!out.decorations) out.decorations = [];
        out.decorations.push({
          x: page.shaarLayout.box.x, y: bl.yTop != null ? bl.yTop : 0,
          w: page.shaarLayout.box.w, h: bl.h || 24,
          kind: 'shaar-crown', slot: 'shaar', kindStyle: String(bl.graphic),
          inkType: 'svg', inkUri: null, ink: { type: 'svg', uri: svgDataUri(crownSvgOf(bl.graphic)) },
          paint: null, pdfOps: null, ornId: null, source: 'shaar'
        });
        continue;
      }
      if (!bl.lines || !bl.lines.length) continue;
      const lh = bl.h / bl.lines.length;
      bl.lines.forEach((words, li) => {
        const lineH = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
        void lh;
        // **פרוסה 3 (§2.2):** מאפייני העיצוב של הבלוק (מחלקה/משקל/ריווח-אותיות)
        // עוברים בשלמותם להקרנה — המקרין של ה-PageModel קורא ואינו גוזר מההגדרות.
        out.lines.push(centeredStampedLine(words, bl.spaceW, page.shaarLayout.box.x, bl.yTop + li * lineH, page.shaarLayout.box.w, lineH, bl.sizePt, bl.cls, bl.fontKey, bl.color, { bold: bl.bold === true, letterSpacingPx: bl.letterSpacingPx || null }));
      });
    }
  } else if (/^shaar-/.test(page.type)) {
    materializeFallbacks.push({ kind: 'materialize-fallback-shaar-stamp', page: page.index });
    if (!production) { // **§3.1:** compat בלבד; בייצור — diagnostic מזוהה בלבד
    const model = buildShaarBlocks(page, settings, page._metadata);
    if (model && model.blocks.length) {
      const b = model.box;
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
      const shaarMeasureOf = (fam) => {
        const { registeredFonts: rf } = require('../typography/measure-api');
        return (fam && rf.has(fam))
          ? new MeasureAPI({ ...settings, 'body-font': fam }, 'font-metrics')
          : measure;
      };
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
        const fk = familyFontKeyOf(bl._fam);
        const color = shaarColorOf(bl.cls);
        bl.lines.forEach((words, li) => {
          const text = words.join(' ');
          const lineH = Math.max(12, Math.round((bl.sizePt * (96 / 72)) * 1.25));
          out.lines.push(centeredLine(text, boxX, yTop + li * lh, boxW, lineH, bl.sizePt, bl._measure, bl.cls, fk, color));
        });
      }
    }
    } // סוף שמירת compat
  }

  // **S5.4 (P-5 — עמודי endnotes ריקים):** לעמודי הערות-הסיום יש מודל משלהם —
  // ה"טורים" שלהם מכילים אובייקטי הערה (marker/text/heightPx/colIdx), לא
  // שורות. הלולאה הכללית הקרינה אותם כשורות בלי מילים ⇒ עמודים ריקים לחלוטין
  // ב-PDF. הקרנה ייעודית: כותרת + הערות בטורי המודל.
  if (page.type === 'endnotes') {
    projectEndnotePage(page, settings, measure, out, production);
  } else {
    // טורים ושורות הגוף
    page.columns.forEach((colLines, ci) => {
      const col = tpl.columns[ci] || { x: 0, w: 0 };
      let y = tpl.contentBox.top + spanOffset;
      for (const ln of colLines) {
        // **FX-6 (פרוסה 2 — הפער מהחוזה הגיאומטרי):** התקדמות ה-y כוללת את
        // פער הבלוקים מהחותמת שנקבעה בתכנון (gapBeforePx) — בדיוק כמו
        // margin-top ב-DOM. מקור יחיד: אין כאן חישוב פער עצמאי ואין כפילה.
        y += ln.gapBeforePx || 0;
        // **Iteration-001 (legacy parity — פס H3 באמצע עמוד):** רשומת-צל/זנב —
        // רזרבציה ללא טקסט בטור המשני וגיאומטריית הזנב של הפס. אינן מוקרנות
        // כשורות כלל (אין דיו); ה-y מתקדם בגובהן, וה-PageModel מסמן אותן
        // כ-projected:false (מיפוי 1:1 של שורות-התוכנית נשמר שם — ראה page-model.js).
        if (ln.h3BandShadow || ln.h3BandTail) {
          y += (ln.heightPx || 0) * (ln.aqStretch || 1);
          continue;
        }
        // **Iteration-001:** רשומת-פס — שורת כותרת H3 שהוצבה באמצע העמוד.
        // מוקרנת ברוחב כל הטורים וממורכזת (כמו שורות הפס העליון — אותו
        // lineAlignOf); הגובה הוא lineHeightPx המקורי (טוהר מדידה — הזנב
        // הוא רשומה נפרדת), והתקדמות ה-y על גובה הרשומה כמו שהיא.
        if (ln.h3Band) {
          const bLeft = Math.min(...tpl.columns.map(c => c.x));
          const bRight = Math.max(...tpl.columns.map(c => c.x + c.w));
          const bandProj = projectLine(ln, bLeft, y, bRight - bLeft, settings, measure, lineAlignOf(ln, settings), production);
          bandProj.midBand = true; // **Iteration-001:** גיאומטריית עמוד (רוחב כל הטורים) — מרונדר ברמת העמוד
          out.lines.push(bandProj);
          y += (ln.heightPx || 0) * (ln.aqStretch || 1);
          continue;
        }
        // **Iteration-003 (מילת-חלון):** שורות 0–1 של פסקת-חלון נמדדו ברוחב
        // מוקטן — התיבה מוזזת מעבר לחלון בצד ימין (RTL) ומילת החלון
        // נפלטת בשפה בגודל 1.5× בגופן החלון (window — FrankReal-Bold),
        // בסיס +2px מתחת לבסיס השורה (כמו winBase במקרן המורשת וב-DOM).
        const winShift = ln.window && Number.isFinite(ln.windowW) ? ln.windowW : 0;
        // **RTL:** השפה הימנית של תיבת השורה זזה שמאלה מעבר לחלון (כמו
        // right=windowW ב-DOM) — השפה השמאלית נשארת בשפת הטור.
        const lnProj = projectLine(ln, col.x, y, col.w - winShift, settings, measure, lineAlignOf(ln, settings), production);
        if (ln.windowWords && ln.windowWords.length) {
          const winText = ln.windowWords.join(' ');
          const winSizePt = (ln.sizePt || settings['body-font-size-pt']) * (Number(settings['first-word-size-em']) || 1.5);
          const winW = Math.max(4, ln.windowW - 2);
          lnProj.words = lnProj.words || [];
          lnProj.words.push({
            text: winText, x: col.x + col.w - winW, w: winW,
            baselineY: null, __window: true, // נקבע במעבר התיקון אחרי attachBaselines
            sizePt: winSizePt, fontKey: 'window',
            ...(settings['first-word-color'] && settings['first-word-color'] !== '#000000'
              ? { color: hexColorToRgb(settings['first-word-color']) } : {})
          });
        }
        out.lines.push(lnProj);
        // **EXT-20:** מקדם ה-AQ מיושם על גובה השורה (אנכי) — השורות שאחריה
        // זזות בהתאם; התיבה והבסיס מחושבים מהגובה הנמתח (מודל תיבת שורה).
        // **FX-6:** הפער קבוע — אינו מתמתח עם השורות.
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
  if (page.footnotes && page.footnotes.length) projectFootnoteGutter(page, settings, measure, out, production);

  // גיליון — **שלב 8 (§4.1):** מהחותמת שהוטבעה בזמן התכנון (folioGeo מ-
  // furniture-geometry, המקור היחיד, בגופן הגיליון מההגדרות). בלי חותמה —
  // נפילה מדווחת ואז אותו חישוב חד-פעמי.
  if (page.folioDisplay) {
    if (page.folioGeo) {
      out.folio = { ...page.folioGeo };
    } else {
      materializeFallbacks.push({ kind: 'materialize-fallback-folio-stamp', page: page.index });
      if (!production) { // **§3.1:** compat בלבד; בייצור הגיליון נשאר ריק + diagnostic
      const folioFam = settings['page-num-font'] || '';
      const folioMeasure = (folioFam && familyFontKeyOf(folioFam))
        ? new MeasureAPI({ ...settings, 'body-font': folioFam }, 'font-metrics') : measure;
      out.folio = folioGeoOf(page, settings, folioMeasure);
      if (out.folio) {
        const folioKey = (folioFam && familyFontKeyOf(folioFam)) || null;
        const folioColor = colorOfSetting(settings['page-num-color']);
        if (folioKey) out.folio.fontKey = folioKey;
        if (folioColor) out.folio.color = folioColor;
      }
      } // סוף שמירת compat
    }
  }

  // כותרת עליונה — **שלב 8 (§4.1):** מהחותמת שהוטבעה בזמן התכנון
  // (headerSlotGeo: רוחבי סלוטים נמדדו פעם אחת ב-9pt בגופן הסלוט; ה-x נגזר
  // מה-pos — טהור). בלי חותמה — נפילה מדווחת ואותה מדידה חד-פעמית.
  if (page.header && page.header.slots) {
    if (page.headerSlotGeo && page.headerSlotGeo.slots) {
      out.header = {
        y: page.headerSlotGeo.y,
        ...(page.headerSlotGeo.baselineY != null ? { baselineY: page.headerSlotGeo.baselineY } : {}),
        slots: page.headerSlotGeo.slots.map(s => {
          const x = s.pos === 'right' ? tpl.width - 60 - s.w : s.pos === 'center' ? Math.round((tpl.width - s.w) / 2) : 60;
          return { ...s, x };
        })
      };
    } else {
      const slots = ['right', 'center', 'left']
        .map(pos => ({ pos, ...page.header.slots[pos] }))
        .filter(s => s && s.text);
      if (slots.length) {
        materializeFallbacks.push({ kind: 'materialize-fallback-header-stamp', page: page.index });
        if (!production) { // **§3.1:** compat בלבד; בייצור הכותרת נשארת ריקה + diagnostic
        out.header = {
          y: headerGeoOf(page).y,
          slots: slots.map(s => {
            const t = scrubPUAText(String(s.text || ''));
            const sKey = familyFontKeyOf(s.font);
            const sMeasure = sKey && sKey !== 'heading' && sKey !== 'fnbody' && sKey !== 'margin' && sKey !== 'window'
              ? new MeasureAPI({ ...settings, 'body-font': s.font }, 'font-metrics') : measure;
            const w = Math.max(1, Math.round(sMeasure.measureTextWidth(t, 9)));
            const x = s.pos === 'right' ? tpl.width - 60 - w : s.pos === 'center' ? Math.round((tpl.width - w) / 2) : 60;
            return { pos: s.pos, align: s.align, text: t, x, w, sizePt: 9, ...(sKey ? { fontKey: sKey } : {}), ...(s.color ? { color: s.color } : {}) };
          })
        };
      }
      } // סוף שמירת compat
    }
  }

  // **EXT-4 (הדיו):** הקרנת העיטורים — ה-rect מהתוכנית + הדיו הפתוח
  // (מקור יחיד: ornament-ink). ה-PDF וה-DOM צורכים את אותה רשימה; לאלה
  // שאין להם דיו (image חיצוני) — ה-rect עובר כרקע בלבד.
  if (page.decorations && page.decorations.length) {
    const hPt = out.height * (72 / 96);
    const PX_TO_PT = 72 / 96;
    const r2 = (v) => Math.round(v * 100) / 100;
    // **Iteration-003 (תיקון שורח חבוי):** ההקרנה מוסיפה לרשימה — אינה מחליפה
    // אותה. עדכני out.decorations כבר הכיל את העיטורים של הערות-הצד/תיבות
    // המידע (מוקרנים לפני כן), והמיפוי מעל תוכנית העמוד מחק אותם בכל עמוד
    // שיש לו עיטורי תוכנית (למשל כלל כותרת) — תיבת המידע נעלמה מה-PDF.
    out.decorations = [...(out.decorations || []), ...page.decorations.map((d) => {
      const ink = d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle);
      let paint = null;
      let pdfOps = null;
      if (ink && ink.type === 'svg') {
        paint = parseSvgPaint(ink.svg);
        // **EXT-4:** פעולות הציור נחשבות כאן — ה-pdf-writer חף-תלויות
        // (אוסף אובייקטים טהור) ורק מקבל את הפעולות מוכנות (מקור יחיד).
        if (paint) pdfOps = svgToPdfOps(paint, d, hPt, PX_TO_PT);
      } else if (ink && ink.type === 'rect') {
        // **Iteration-003 (legacy parity — D-89):** מלבן בצבע אחיד (פאנלי שער,
        // מסגרות, כלל כותרת) — אותו דיו כמו legacy-projector (§713): צבע
        // ה-rect מה-kindStyle, לא שחור קבוע. **תיקון המשך:** parseColor מחזיר
        // ערכים מנורמלים 0–1 — החלוקה ב-255 כאן איפסה את הצבע (0.957/255≈0)
        // וכל הרקעים נצבעו שחור ב-PDF.
        const yTopR = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`${r2(ink.color[0])} ${r2(ink.color[1])} ${r2(ink.color[2])} rg ${r2(d.x * PX_TO_PT)} ${r2(yTopR)} ${r2(d.w * PX_TO_PT)} ${r2(d.h * PX_TO_PT)} re f`];
      } else if (ink && ink.type === 'rule') {
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`0 0 0 rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${Math.max(0.5, r2(d.h * PX_TO_PT))} re f`];
      }
      return {
        x: d.x, y: d.y, w: d.w, h: d.h,
        kind: d.kind || null, slot: d.slot || null, kindStyle: d.kindStyle || null,
        inkType: ink ? ink.type : null, inkUri: ink && ink.uri ? ink.uri : null,
        // **פרוסה 3 (§2.2 — הדיו מגיע מהמודל):** מטען הדיו בשלמותו (svg/image-
        // ref/rule) עובר להקרנה — המקרין ה-DOM של ה-PageModel קורא ואינו פותר
        // מחדש את הספרייה (אין חישוב מקביל ברנדרר).
        ...(ink ? { ink } : {}),
        paint, pdfOps,
        // **השלמת חוזה העיטורים (שלב 6):** ההצהרה מהתוכנית עוברת בשלמותה —
        // ההקרנה מוסיפה אריזת-ציור (paint/pdfOps) ואינה מפילה נתוני חוזה.
        ...(d.ornId ? { ornId: d.ornId } : {}),
        ...(d.source != null ? { source: d.source } : {}),
        ...(d.image ? { image: d.image } : {}),
        ...(d.ink ? { ink: { ...d.ink } } : {}),
        ...(d.inkMissing ? { inkMissing: true } : {}),
        ...(d.natural ? { natural: { w: d.natural.w, h: d.natural.h } } : {}),
        ...(d.scale != null ? { scale: d.scale } : {}),
        ...(d.fit ? { fit: { ...d.fit } } : {}),
        ...(d.anchor ? { anchor: { ...d.anchor } } : {}),
        ...(d.clip ? { clip: { ...d.clip } } : {}),
        ...(d.zOrder ? { zOrder: d.zOrder } : {}),
        ...(d.reservation ? { reservation: { ...d.reservation } } : {}),
        ...(d.constraints ? { constraints: { ...d.constraints } } : {}),
        ...(d.cssClass ? { cssClass: d.cssClass } : {})
      };
    })];
  }

  // **S12 (parity):** בסיסי שורות/מרזב/גיליון/כותרת — מודל תיבת שורה אחיד
  attachBaselines(out, settings, measure);
  // **Iteration-003 (מילת-חלון):** בסיס מילת החלון — 2px מתחת לבסיס שורת
  // הטקסט (כמו winBase=baseY+2 במקרן המורשת; נמדע בייחוס: חלון 155.25
  // מול שורה 153.75). נקבע כאן — אחרי שבסיסי השורות חושבו.
  for (const ln of (out.lines || [])) {
    if (!ln.words) continue;
    for (const w of ln.words) {
      if (w.__window && ln.baselineY != null) w.baselineY = ln.baselineY + 2;
    }
  }

  return out;
}

function colLeftOf(tpl) { return Math.min(...tpl.columns.map(c => c.x)); }
function colWidthOf(tpl) {
  const left = Math.min(...tpl.columns.map(c => c.x));
  const right = Math.max(...tpl.columns.map(c => c.x + c.w));
  return right - left;
}

// ============ S5.4 (P-5) — הקרנת הערות-שוליים / עמודי-הערות / הערות-צד / מפרידים ============
// **שלב 6 פרוסה 2 (§9):** המקרינים צורכים את חותמת המדידה בלבד — שורות,
// רוחבי מילים, סמן/המשך/מונה, רווח ופיץ' — הכול מה-notes-model. אין מדידת
// מילים, אין שבירה עצמאית ואין נוסחת גובה נפרדת: תקציב = הצבה = הקרנה.
// חותמת חסרה/פגומה ⇒ diagnostic מפורש (out.diagnostics) — לא מדידה חלופית שקטה.

/** גודל גוף הערה — 0.8× הגוף (כמו .footnotes{font-size:.8em} ו-noteHeight בתקציב). */
function fnNoteSizePt(settings) {
  // **Iteration-003 (legacy parity):** בפרופיל IMUD גודל גוף ההערה מהמקור
  // (s-note-body=9 — SZ.fnBody של המורשת); מחוץ ל-IMUD — 0.8× הגוף כמקודם.
  if (settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw)) {
    const rawFn = Number(settings._imudRaw && settings._imudRaw['s-note-body']);
    if (Number.isFinite(rawFn) && rawFn > 0) return rawFn;
  }
  return settings['body-font-size-pt'] * 0.8;
}

/** רישום diagnostic של חותמת חסרה/פגומה (§9.8) — מקור וסיבתיות, לא החלפה שקטה. */
function pushStampDiagnostic(out, area, page, n) {
  if (!out.diagnostics) out.diagnostics = [];
  out.diagnostics.push({
    kind: 'note-stamp-missing', area,
    page: page && page.index != null ? page.index : null,
    note: (n && (n.noteId || n.tokenId)) || null,
    marker: n && n.marker != null ? String(n.marker) : null
  });
}

/** הקרנת שורות ההערה **מהחותמת** — אותו חוזה מיקום שהיה ב-wrapNoteTokens
 * (סמן/(המשך)/מונה בפינה הימנית של השורה הראשונה, יישור מלא לשורות שאינן
 * אחרונות, בסיס פר-שורה לפי מודל תיבת השורה) — אך הרוחבים מהחותמת שנמדדה
 * פעם אחת, ולא מדידה חוזרת של המקרין.
 * @param {object} n — הערה עם חותמת (noteRows/noteWords/markerW/contMarkW/
 *   counterMarkW/spaceW/lineH מ-notes-model.stampNote)
 * @param {object} opts — { sizePt, fontKey, color, measure, counterMark?, padPx? }
 * @returns {{lines:Array, words:Array, lineCount:number, firstTop:number, firstBaseline:number, h:number}|null}
 */
function projectStampedRows(n, x, w, yTop, opts) {
  if (!NM.stampIsValid(n)) return null; // חותמה חסרה/פגומה — הקריאה מדווחת, לא מודדת
  const rows = n.noteRows;
  const words = n.noteWords;
  const lineH = n.lineH;
  const spaceW = Number(n.spaceW) || 0;
  const sizePt = opts.sizePt;
  const pad = opts.padPx || 0;
  const gx = x + pad, gw = Math.max(4, w - 2 * pad); // תיבת מידע: הטקסט בתוך הריפוד
  const glyph = (v) => Math.max(0, (Number(v) || 0) - spaceW); // חותמת נושאת גליף+רווח
  const isCont = n.isContinuation === true || n.mode === 'split-rest';
  const prefix = [];
  if (isCont && Number(n.contMarkW) > 0) prefix.push({ text: NM.CONTINUATION_MARK, w: glyph(n.contMarkW) });
  const mkTxt = noteMarkerOf(n, { 'footnote-marker-style': null });
  if (mkTxt && Number(n.markerW) > 0) prefix.push({ text: scrubPUAText(mkTxt), w: glyph(n.markerW), mk: true });
  if (!isCont && n.counterMark != null && String(n.counterMark) !== '' && Number(n.counterMarkW) > 0) {
    prefix.push({ text: scrubPUAText(String(n.counterMark)), w: glyph(n.counterMarkW) });
  }
  const ascent = opts.measure.ascentEm(), descent = opts.measure.descentEm();
  const sizePx = sizePt * (96 / 72);
  const half = Math.max(0, (lineH - (ascent + descent) * sizePx) / 2);
  const flat = [];
  const lineRecs = rows.map((row, li) => {
    const isLast = li === rows.length - 1;
    const toks = [];
    if (li === 0) for (const p of prefix) toks.push(p);
    for (let i = row.wFrom; i < row.wTo; i++) {
      toks.push({ text: scrubPUAText(String(words[i])), w: row.wordW[i - row.wFrom] });
    }
    const live = toks.filter(t => t.text && String(t.text).trim());
    const sumW = live.reduce((s, t) => s + t.w, 0);
    const gaps = Math.max(0, live.length - 1);
    let gapW = spaceW;
    if (!isLast && gaps > 0 && sumW + gaps * spaceW < gw) gapW = (gw - sumW) / gaps;
    const y = yTop + pad + li * lineH;
    const baselineY = y + half + ascent * sizePx;
    const wds = [];
    let cursor = gx + gw; // RTL — מימין לשמאל
    for (const t of live) {
      cursor -= t.w;
      const wd = { text: t.text, x: cursor, w: t.w, sizePt, baselineY, fontKey: opts.fontKey,
        ...(t.mk ? { mk: true } : {}), ...(opts.color ? { color: opts.color } : {}) };
      wds.push(wd);
      flat.push(wd);
      cursor -= gapW;
    }
    return { y, h: lineH, baselineY, words: wds };
  });
  return {
    lines: lineRecs, words: flat, lineCount: rows.length, firstTop: yTop,
    firstBaseline: lineRecs.length ? lineRecs[0].baselineY : yTop,
    h: rows.length * lineH
  };
}

/** סמן הערה — מקור אחיד: הסמן שהוקצה, או markerFor לפי המספר (כמו renderFootnoteArea). */
function noteMarkerOf(n, settings) {
  if (n.marker != null && String(n.marker) !== '') return String(n.marker);
  if (Number.isInteger(n.docIndex) || Number.isInteger(n.markerNum)) {
    return markerForSettings(Number.isInteger(n.docIndex) ? n.docIndex : (n.markerNum || 1), settings);
  }
  return '';
}

/**
 * **S5.4 (P-5 — הערות מרוסקות) + שלב 6 פרוסה 2 (§9 — מהחותמת):** הקרנת מרזב
 * הערות-השוליים של עמוד DP — נתיב אחד או שניים (footnote-columns), חלוקת
 * הערות זהה לתקציב (LPT דטרמיניסטית — גובה המרזב לעולם אינו חורג מהשמור),
 * וחוט מפריד (fn-rule) מעל המרזב כמו ב-DOM. השורות, רוחבי המילים והפיץ'
 * **מהחותמת** (מדידה אחת ב-CP2/בפיצול) — המקרין אינו מודד ואינו שובר שוב.
 */
function projectFootnoteGutter(page, settings, measure, out, production) {
  const tpl = page.template;
  const fnSize = fnNoteSizePt(settings);
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
  } else if (page.footnoteLanes && page.footnoteLanes.lanes) {
    // **שלב 8 (§4.1):** חלוקת הנתיבים מהחותמת שהוטבעה בזמן התכנון — אותה
    // חלוקה שהתקציב קבע (footnote-lanes, מקור-אמת יחיד), מוטבעת פעם אחת;
    // ההקרנה צורכת ואינה מחלקת שוב.
    for (const li of [0, 1]) lanes[li] = page.footnoteLanes.lanes[li].map(i => notes[i]).filter(Boolean);
  } else {
    materializeFallbacks.push({ kind: 'materialize-fallback-fn-lanes', page: page.index });
    if (production) {
      // **§3.1:** בייצור — חותמה חסרה ⇒ נתיב אחד בלבד (מדווח); אין חלוקה מחדש במקרין.
      lanes[0] = notes.slice();
    } else {
      const { lanes: idxLanes } = assignFootnoteLanes(notes);
      for (const li of [0, 1]) lanes[li] = idxLanes[li].map(i => notes[i]);
    }
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
      const marker = noteMarkerOf(n, settings);
      const rec = projectStampedRows(n, laneX[li], laneW, y, {
        sizePt: fnSize, fontKey: 'fnbody',
        color: colorOfSetting(settings['f-note-body-color']), measure
      });
      if (!rec) {
        // **§9.8:** חותמה חסרה/פגומה — diagnostic מפורש; הטקסט נשמר ברשומת
        // ההערה (מלאי/חשבונאות) אך אין מדידה חלופית שקטה של מילים.
        pushStampDiagnostic(out, 'footnote-gutter', page, n);
        out.footnotes.push({
          y, x: laneX[li], w: laneW,
          marker: scrubPUAText(String(n.marker || '')),
          text: scrubPUAText(String(n.text || '').replace(/\uE000/g, ' ')),
          words: [], baselineY: y, h: n.heightPx || 0, stampMissing: true
        });
      } else {
        out.footnotes.push({
          y: rec.firstTop, x: laneX[li], w: laneW,
          marker: scrubPUAText(String(n.marker || '')),
          text: scrubPUAText(String(n.text || '').replace(/\uE000/g, ' ')),
          words: rec.words, baselineY: rec.firstBaseline, h: Math.max(n.heightPx || 0, rec.h)
        });
        inkTop = Math.min(inkTop, rec.firstTop);
      }
      y += (n.heightPx != null ? n.heightPx : pitch); // התקדמות לפי התקציב — פריסת העמוד לעולם אינה נפרצת
    }
  });
  // חוט המפריד מעל המרזב — כמו .fn-rule ב-renderFootnoteArea (לא במצב 'none')
  const ruleStyle = settings['footnote-separator-rule'];
  if (ruleStyle && ruleStyle !== 'none' && Number.isFinite(inkTop)) {
    pushRuleDecoration(out, tpl, { kind: 'fn-rule', style: String(ruleStyle), x: fullX, w: fullW, y: inkTop });
  }
}

/**
 * **S5.4 (P-5 — עמודי endnotes ריקים) + שלב 6 פרוסה 2 (§9):** הקרנת עמוד
 * הערות-הסיום — כותרת (h2, 1.2× הגוף) ואז ההערות בטורי המודל (colIdx/heightPx
 * מ-buildEndnotePages). השורות, רוחבי המילים, הסמן והפיץ' **מהחותמת** שנקבעה
 * בבונה עצמו (המדידה היחידה של ההערה בהקשר עמודי-ההערות) — המקרין אינו
 * מודד ואינו שובר שוב. חותמה חסרה ⇒ diagnostic מפורש (§9.8).
 * השורות נכנסות ל-out.lines ⇒ מצוירות ב-PDF, נכנסות למלאי הגליפים ולתיבת הדיו.
 */
function projectEndnotePage(page, settings, measure, out, production) {
  const tpl = page.template;
  const bodyPt = settings['body-font-size-pt'];
  const notePt = bodyPt * 0.8;
  if (page.heading) {
    // **שלב 8 ביקורת §3.2:** כותרת עמוד ההערות — מהחותמת שהוטבעה בתכנון
    // (stampEndnoteHeading: מדידה אחת). חותמה חסרה ⇒ diagnostic (בייצור) או
    // fakeLine (compat בלבד) — לא מדידה שקטה במסלול הייצור.
    if (page.endnoteTitleGeo && page.endnoteTitleGeo.words) {
      const g = page.endnoteTitleGeo;
      out.lines.push(stampedRowLine({ x: g.x, y: g.y, w: g.w, h: g.h, words: g.words, spaceW: g.spaceW }, g.sizePt, 'endnote-title', g.fontKey || 'heading'));
    } else {
      materializeFallbacks.push({ kind: 'materialize-fallback-endnote-title', page: page.index });
      if (!production) {
        const sizePt = bodyPt * 1.2;
        const bandH = (page.titleBandPx && page.titleBandPx > 16) ? page.titleBandPx - 16 : (measure.lineHeightPx ? measure.lineHeightPx(sizePt) : Math.round(sizePt * (96 / 72) * 1.34));
        out.lines.push(fakeLine(scrubPUAText(String(page.heading)), colLeftOf(tpl), tpl.contentBox.top + 8, colWidthOf(tpl), bandH, settings, measure, sizePt, 'heading', 'endnote-title'));
      }
    }
  }
  const top = tpl.contentBox.top + (page.titleBandPx || 0);
  const cols = Math.max(1, (page.columns || []).length);
  // טור-אחד (endnote-columns=1): רשימה ברוחב תיבת התוכן המלא (כמו המנוע
  // שמדד את ההערה ברוחב המלא) — התבנית עצמה דו-טורית תמיד.
  const singleColMode = (page.columns || []).length === 1;
  for (let ci = 0; ci < cols; ci++) {
    const colNotes = page.columns[ci] || [];
    if (!colNotes.length) continue;
    const col = singleColMode
      ? { x: colLeftOf(tpl), w: colWidthOf(tpl) }
      : (tpl.columns[ci] || { x: colLeftOf(tpl), w: colWidthOf(tpl) / cols });
    let y = top;
    for (const n of colNotes) {
      const pitch = n.lineH || (measure.lineHeightPx ? measure.lineHeightPx(notePt) : Math.round(notePt * (96 / 72) * 1.34));
      const rec = projectStampedRows(n, col.x, col.w, y, {
        sizePt: notePt, fontKey: 'fnbody',
        color: colorOfSetting(settings['f-note-body-color']), measure
      });
      if (!rec) {
        pushStampDiagnostic(out, 'endnote-page', page, n); // §9.8 — לא מדידה חלופית שקטה
      } else {
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
 * **S5.4 (P-5 — הערות-צד חסרות) + שלב 6 פרוסה 2 (§§9-10):** הקרנת הערות-הצד
 * לפי ה-placement — אותו מיקום מוחלט כמו ה-aside ב-DOM (x/yTop/colWidth),
 * והשורות/רוחבי המילים/הפיץ' **מהחותמת** (מדידה אחת ביצירת הפריט ב-DP) —
 * המקרין אינו מודד ואינו שובר שוב. תיבת מידע: רקע/מסגרת מהחוזה (styleSpec +
 * boxChrome) והטקסט בתוך הריפוד — אותה גיאומטריה שהוקצתה (§11).
 */
function projectSideNotes(page, settings, measure, out) {
  for (const sn of page.sideNotes) {
    if (sn.yTop == null) continue; // רק המוקמות בפועל (placeSideNotes)
    // גודל הגוף מהחותמת (פריט עוגן מורחב יכול להצהיר גודל משלו — §11)
    const sizePt = (sn.stampCtx && Number(sn.stampCtx.sizePt) > 0) ? sn.stampCtx.sizePt : settings['body-font-size-pt'] * 0.75;
    const isBox = sn.itemKind === 'info-box';
    const chrome = sn.boxChrome || { pad: 0, border: 0 };
    const boxW = (sn.boxSpec && Number(sn.boxSpec.widthPx) > 0) ? sn.boxSpec.widthPx : sn.colWidth;
    if (isBox) {
      // רקע ומסגרת התיבה — מהחוזה בלבד, באותו ערוץ עיטורים של ה-PDF
      const hPt = out.height * (72 / 96);
      const PX_TO_PT = 72 / 96;
      const r2 = (v) => Math.round(v * 100) / 100;
      const yTopPt = hPt - (sn.yTop + sn.heightPx) * PX_TO_PT;
      const ops = [];
      const bg = sn.styleSpec && sn.styleSpec.background ? hexColorToRgb(sn.styleSpec.background) : null;
      if (bg) {
        ops.push(`${r2(bg[0])} ${r2(bg[1])} ${r2(bg[2])} rg ${r2(sn.x * PX_TO_PT)} ${r2(yTopPt)} ${r2(boxW * PX_TO_PT)} ${r2(sn.heightPx * PX_TO_PT)} re f`);
      }
      if (chrome.border > 0) {
        ops.push(`0 0 0 RG ${r2(0.75)} w ${r2(sn.x * PX_TO_PT)} ${r2(yTopPt)} ${r2(boxW * PX_TO_PT)} ${r2(sn.heightPx * PX_TO_PT)} re S`);
      }
      if (ops.length) {
        if (!out.decorations) out.decorations = [];
        out.decorations.push({
          x: sn.x, y: sn.yTop, w: boxW, h: sn.heightPx,
          kind: 'info-box', slot: 'margin', kindStyle: null,
          inkType: 'rule', inkUri: null, paint: null, pdfOps: ops
        });
      }
    }
    const rec = projectStampedRows(sn, sn.x, boxW, sn.yTop, {
      sizePt, fontKey: 'margin',
      color: colorOfSetting(settings['s-note-body-color']), measure,
      padPx: isBox ? chrome.pad + chrome.border : 0
    });
    if (!rec) { pushStampDiagnostic(out, 'side-note', page, sn); continue; } // §9.8
    rec.lines.forEach((line) => {
      out.lines.push({
        x: sn.x, y: line.y, w: boxW, h: sn.lineH,
        words: line.words.map(wd => ({ text: wd.text, x: wd.x, w: wd.w, sizePt: wd.sizePt, fontKey: wd.fontKey })),
        align: 'right', kind: isBox ? 'info-box' : 'side-note', level: sn.level != null ? sn.level : null,
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
  // **FX-6 (פרוסה 2):** גובה כולל פערי בלוקים — כמו renderColumnDivider ב-DOM
  // (תצוגה = ייצוא; אותה נוסחה בדיוק).
  const used = page.columns.map(col => col.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0));
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

/** יישור שורה בודדת — **מקור הסמכות היחיד להחלטת היישור** (U-15, ביקורת שלמות 20-21.11).
 * חוזה יישור הכותרות — כל שורות הכותרת ממורכזות, בכל מסלול (טור/פס חוצה־טורים),
 * בלי תלות ב-isLast. חמש רשויות מסכימות: המקרן הישן (dom-renderer renderLine —
 * text-align:center לכל kind='heading'), המקרן של המורשת (legacy-projector:407 —
 * `ln.kind === 'heading' ? 'center'`), הפסים במורשת (legacy-projector:238 — placeWords
 * 'center'; נמדד h0/h2/h3: Lgap=Rgap בדיוק), BASE_CSS (.line--heading מוחרג
 * מ-text-align-last:justify — "ממורכזות מטבען") ומפרט האודיט (סעיף 8 — "כותרת:
 * ממורכזת, לא מתוחה").
 * **הכשל שנסגר:** לפני U-15 הוחזר 'justify' לכל שורה שאינה-אחרונה גם לכותרות
 * ⇒ שורות המשך של כותרות מרובות-שורות נמתחו מקצה לקצה בגיאומטריית המילים
 * (gapW=(colW−sumW)/gaps ב-projectLine) — לא רק ב-CSS. נמדד ב-very_long:
 * ‏28 ממצאי HEAD_JUSTIFIED ב-Full Math (sign-open 22/preface 5/regular 1),
 * בכולן הדיו פרוש בדיוק על רוחב התיבה (inkL=x, inkR=x+w). בנוסף נמצא
 * הכפל שני באותו שורש: שורות הפס החוצה־טורים קיבלו 'right' קבוע (H2/H3 —
 * ‏340 שורות צמודות-ימין ב-very_long, אסימטריה 170–222px ממרכז הפס) בניגוד
 * למורשת שממרכזת אותן. שני המסלולים מנותבים כעת דרך פונקציה זו — החלטה אחת.
 * (מיזוג 21.11: תיקון העמית c45467a — כותרות ממורכזות בנתיב הטור, שינוי השם
 * ‏lastAlignOf→lineAlignOf — מאומץ כאן; ההשלמה: ניתוב הפס החוצה-טורים.) */
function lineAlignOf(ln, settings) {
  if (ln && ln.kind === 'heading') return 'center';
  if (!ln.isLast) return 'justify';
  const mode = settings['body-last-line-align'] || 'center';
  return mode === 'stretch' ? 'justify' : mode; // stretch בשורה האחרונה = יישור מלא כמו רגילה
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

/**
 * **שלב 8 (§4.1):** רוחבי מילות השורה מה-LineModel — מיפוי זהה ל-legacyViewOfLines
 * (הליכה על ה-flow; צבירת measuredAdvance של הפרגמנטים לפי יחידות מילה), בתוספת
 * רוחב הרווח מה-glue החיצוני הראשון (naturalPx — הרווח שנמדד בזמן השבירה).
 * מחזיר null כשאין LineModel/flow (שורה סינתטית) — הנפילה מדווחת ב-projectLine.
 */
function lineWidthsFromModel(ln) {
  const lm = ln && ln.lineModel;
  if (!lm) return null;
  // **פרוסה 2 (§4.2):** שורת תמונת בלוק/ממורכזת — אין לה flow; הרוחב הוא
  // measuredAdvance של הפרגמנט (רוחב התצוגה של התמונה) — נתון מודל, לא מדידה.
  if (!Array.isArray(lm.flow) && Array.isArray(lm.fragments) && lm.fragments.length) {
    const widths = lm.fragments.map(f => Number(f.measuredAdvance) || 0);
    return { widths, spaceW: 0 };
  }
  if (!Array.isArray(lm.flow) || !Array.isArray(lm.fragments)) return null;
  const fragById = new Map((lm.fragments || []).map(f => [f.itemId, f]));
  const widths = [];
  // **פרוסה 3 (סמן מודבק — פיצול בסמכות):** מלאי הפרגמנטים של כל מילה שטוחה
  // (סוג+רוחב) — לפיו מפצלת ההקרנה מילה מורכבת "מילה+סמן" לשני חלקים בגדלים
  // שנמדדו בפועל (הסמן נמדד בגודל הרישום). בלי זה הסמן מוצג בגודל השורה
  // וגולש מהטור (נמדד: +8px; ברינדור זרימה נבלע בשבירה שקטה).
  const wordFrags = [];
  let curFrags = null;
  let curW = null;
  let spaceW = null;
  const flushWord = () => {
    if (curW !== null) { widths.push(curW); wordFrags.push(curFrags || []); }
    curW = null; curFrags = null;
  };
  for (const step of lm.flow) {
    if (step.type === 'glue') {
      if (step.internal) continue; // יחידה צמודה — אין גבול מילה
      if (step.breakGlue) continue; // דבק נקודת-החיתוך — מחוץ לרוחב השורה
      flushWord();
      continue;
    }
    const f = fragById.get(step.itemId);
    if (!f) continue;
    const adv = Number(f.measuredAdvance) || 0;
    if (curFrags === null) curFrags = [];
    curFrags.push({ kind: f.kind || 'text', advance: adv });
    curW = curW === null ? adv : curW + adv;
  }
  flushWord();
  // רוחב הרווח — מה-glue החיצוני הראשון של השורה (naturalPx: הרווח שנמדד
  // בזמן השבירה, לא כאן)
  if (Array.isArray(lm.glue) && lm.glue.length && lm.glue[0].naturalPx != null) {
    spaceW = lm.glue[0].naturalPx;
  }
  return { widths, spaceW, wordFrags };
}

function projectLine(ln, colX, y, colW, settings, measure, align, production) {
  const sizePt = lineFontSizePt(ln, settings);
  // **פרוסה 2 (§4.2):** שורת תמונת בלוק/ממורכזת — יישור מרכז לפי האילוץ שבמודל
  // (lm.constraints.align; breakReason 'image-block'). שורות רגילות אינן מושפעות.
  if (ln && ln.lineModel && ln.lineModel.constraints
    && (ln.lineModel.constraints.placement === 'block' || ln.lineModel.breakReason === 'image-block')
    && ln.lineModel.constraints.align) {
    align = String(ln.lineModel.constraints.align);
  }
  // **S73 (תצוגה=ייצוא בגופני כותרות — נתיב DP):** ה-DOM מציג כותרות inline
  // בגופן הרמה מההגדרות (heading-N-font) ובצבען (heading-N-color); עד כאן
  // ההקרנה ציירה הכול בגוף הטקסט (/F1). כעת: fontKey משפחה + צבע — כמו ה-DOM.
  // וכן צבע גוף (body-color; שחור ⇒ אפס אופרטורי rg).
  const isHeadingLine = ln.kind === 'heading' && ln.level != null;
  const hFontKey = isHeadingLine ? familyFontKeyOf(settings[`heading-${ln.level}-font`]) : null;
  const hColor = isHeadingLine ? colorOfSetting(settings[`heading-${ln.level}-color`]) : null;
  const bodyColor = colorOfSetting(settings['body-color']);
  // **S68 (R2-M6 — סגירת פער PDF↔DOM):** גודל אפקטיבי פר-מילה. המודל נמדד
  // בסקאלות אלה בזמן הפענוח (measureWithParen: paren×scale, custom×factor)
  // וה-DOM מציג אותן כך (span.w--paren / span.w--custom); ההקרנה ל-PDF חייבת
  // למדוד ולהציג באותם גדלים — אחרת מילות הסוגריים/הסגנון חורגות מה-DOM
  // ומהמודל שנמדד. ה-pdf-writer מכבד w.sizePt פר-מילה ממילא.
  const parenScale = Number(settings['paren-style-scale']) || 1;
  // **RC-2c (i004): גודל הסוגריים אבסולוטי** — כמו ה-DOM (parenPx =
  // SZ.body+parenDelta) וכמו המורשת (10pt קבוע גם בהקדמה שגופה 11.5pt;
  // הוכח מה-PDF הישן: p43 ספאני סוגריים 10.0pt). ה-scale המיובא יחסי לגוף
  // (10/12) — כאן נגזר הגודל האבסולוטי ומוצב ישירות, כך ששורת הקדמה
  // (11.5pt) מקבלת 10pt ולא 9.58pt — תצוגה = ייצוא = מדידה.
  const parenAbsPt = parenScale !== 1
    ? (Number(settings['body-font-size-pt']) || 12) * parenScale
    : null;
  const csFactors = (ln.customSpans && ln.customSpans.length) ? customFactorMapOf(settings) : null;
  const parenSet = (ln.parenSpans && ln.parenSpans.length && parenScale !== 1) ? new Set(ln.parenSpans) : null;
  const effSizeOf = (i) => {
    let s = sizePt;
    if (csFactors) {
      const cs = ln.customSpans.find((c) => c.wi === i);
      if (cs) { const f = csFactors.get(cs.styleId); if (f != null) s *= f; }
    }
    if (parenSet && parenSet.has(i)) s = parenAbsPt != null ? parenAbsPt : s * parenScale;
    return s;
  };
  const words = (ln.words || []).map(w => scrubPUAText(String(w).replace(/\u00A0/g, ' '))).filter(Boolean);
  // **שלב 8 (§4.6 — הסרת חישוב כפול):** רוחבי המילים נצרכים מה-LineModel
  // (measuredAdvance של הפרגמנטים — מדידת השבירה היחידה, בגופן האמיתי של
  // השורה). בעבר נמדדו כאן שוב בגוף הטקסט — כולל כותרות שנמדדו בגוף הגוף
  // בזמן שהמודל נשבר בגופן הכותרת (תצוגה≠ייצוא ברמת המילה). שורה בלי
  // LineModel (סינתטית בבדיקות) — מדידת נפילה מסומנת, לא שקטה.
  const lm = lineWidthsFromModel(ln);
  let spaceW = lm ? lm.spaceW : null;
  // **פרוסה 2 (§4.2):** טקסט-המקור של תמונה צפה — מחוץ לזרימה אך נספר ב-words;
  // רוחבו הוטבע בזמן התכנון (sourceTextWidthPx) ונצרך כאן — בלי מדידה.
  const floatTextW = new Map();
  if (lm === null || lm === undefined) { /* no model */ }
  if (ln.lineModel && Array.isArray(ln.lineModel.floatAreas)) {
    for (const fa of ln.lineModel.floatAreas) {
      if (fa.sourceText != null && fa.sourceTextWidthPx != null) floatTextW.set(fa.sourceText, fa.sourceTextWidthPx);
    }
  }
  const nFloatWords = floatTextW.size ? words.reduce((a, w) => a + (floatTextW.has(w) ? 1 : 0), 0) : 0;
  let widths;
  if (lm && lm.widths.length + nFloatWords === words.length) {
    let k = 0;
    widths = words.map(w => (floatTextW.has(w) ? floatTextW.get(w) : lm.widths[k++]));
  } else if (production) {
    // **§3.1 (מסלול הייצור):** אין מדידה חלופית — הטקסט נשמר (חשבונאות מלאה)
    // ברוחב אפס מסומן, והנפילה מדווחת; תוקן במקור יצירת הנתון, לא כאן.
    widths = words.map(() => 0);
    spaceW = 0;
    materializeFallbacks.push({ kind: 'materialize-fallback-line-widths', line: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId) || null });
  } else {
    widths = words.map((w, i) => measure.measureTextWidth(w, effSizeOf(i)));
    if (lm) { /* מיפוי חלקי — נפילה מתועדת להלן */ }
    spaceW = null;
  }
  // **שלב 8 ביקורת §3.2 (שורש נפילת-שווא):** שורה חד-מילית אין לה דבק במודל —
  // ואין לה צורך ברוחב רווח (אין רווחים למלא). דרישת רווח בלתי-מותנית הפכה
  // 852 שורות כאלה ב-very_long ל"נפילת מדידה" כזובה. רק שורה רב-מילית בלי
  // רוחב רווח קנוני היא נתון חסר אמיתי: בייצור — diagnostic + אפס; ב-compat —
  // מדידת נפילה מתועדת.
  if (spaceW == null && (words.length - nFloatWords) > 1) { // רווח נדרש רק בין מילות זרימה — טקסט-צף אינו מילת זרימה
    if (production) {
      spaceW = 0;
    } else {
      spaceW = measure.measureTextWidth(' ', sizePt, 0);
    }
    if (!materializeFallbacks) materializeFallbacks = [];
    materializeFallbacks.push({ kind: 'materialize-fallback-line-widths', line: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId) || null });
  }
  if (spaceW == null) spaceW = 0; // חד-מילית: אין רווחים — אפס ללא נפילה
  // **U-16 (ביקורת שלמות 20.11 — מילים של תווי-כיוון בלבד, בלי רווח פנטום):**
  // מילה המורכבת מתווי כיוון בלבד (RLM/LRM וכו') היא ברוחב אפס, אבל הרווח
  // שמפריד אותה משכנתה נכלל בתיבת השורה ומזיז את המרכוז (נמדד באודיט החי:
  // אסימטריה 4–4.2px בשורות אחרונות ממורכזות, עמ' 723/724 — המקור מסתיים
  // ב-RLM מילולי לפני שורת הכותרת). חוזה S4.24 של המקרן הישן: הדבקה לשכן —
  // הרווח הפנטום נעלם, הכיווניות נשמרת (התו חסר-רוחב; אין חשש לגלישה).
  // כלל ההדבקה: מילת-כיוון נדבקת לשכנתה משמאל אם קיימת מילה גלויה לפניה
  // (הרווח שלפניה מת); אחרת (מובילה) — לשכנתה מימין (הרווח שאחריה מת).
  const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
  const isFmtWord = words.map(w => FORMAT_WORD_RE.test(String(w)));
  const gapDead = new Array(Math.max(0, words.length - 1)).fill(false);
  for (let j = 0; j < words.length; j++) {
    if (!isFmtWord[j]) continue;
    let hasVisibleBefore = false;
    for (let k = 0; k < j; k++) if (!isFmtWord[k]) { hasVisibleBefore = true; break; }
    if (hasVisibleBefore) gapDead[j - 1] = true;
    else if (j + 1 < words.length) gapDead[j] = true;
  }
  const liveGaps = gapDead.reduce((s, d) => s + (d ? 0 : 1), 0);
  const sumW = widths.reduce((s, w) => s + w, 0);
  const gaps = liveGaps;

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
  // **פרוסה 3 (סמן מודבק — פיצול בסמכות ההקרנה):** מילה שטוחה "מילה+סמן הערה"
  // נמדדה בשני גדלים (גוף + גודל הרישום) אך הוקרנה כמילה אחת בגודל השורה —
  // הסמן הוצג גדול מכפי שנמדד וגלש מהטור (נמדד +8px; ברינדור הזרימה הישן
  // נבלע בשבירת-שורה שקטה בתוך תיבת השורה). כאן היא מפוצלת לפי מבנה
  // הפרגמנטים: חלק הטקסט בגודל השורה, הסמן בגודל הרישום — כפי שנמדד.
  const fnSizePt = Number(settings['f-note-body-size-pt']) || 8;
  const emitWord = (text, w, eff, extra) => {
    wordPos.push({
      text, x: cursor, w,
      ...(eff !== sizePt ? { sizePt: eff } : {}),
      ...(hFontKey ? { fontKey: hFontKey } : {}),
      ...(hColor ? { color: hColor } : {}),
      ...(!hColor && bodyColor ? { color: bodyColor } : {}),
      ...(extra || {})
    });
  };
  for (let i = 0; i < words.length; i++) {
    const eff = effSizeOf(i);
    const frags = (lm && lm.wordFrags && lm.wordFrags[i]) || null;
    // **U-17/U-16 (ביקורת שלמות 20.11 — סמן בכל מוקד במילה):** עד כאן זוהה
    // הסמן רק כשהיה הפרגמנט ה**אחרון** של מילה מודבקת "מילה+סמן". בפועל
    // נמדדו ב-very_long שלוש צורות נוספות שבהן זהות הסמן אבדה בהקרנה —
    // הסמן הוצג כמילת גוף בגודל השורה (12pt במקום 8pt, בלי .w--fnmarker):
    //   (א) [סמן] בלבד — סמנים עוקבים שלא הוצמדו (עמ' 877: "א״ד","א״ה" נפרדות;
    //       MARKER_NOTE_MATCH — פתיחת-הערה בלי סמן-גוף);
    //   (ב) [סמן, סמן] — פסקה שנפתחת בשתי הערות (עמ' 879: "א״ט א״י" — רק
    //       האחרון סומן; הראשון הוצג כטקסט 12pt ⇒ אסימטריית דיו 7.1px);
    //   (ג) [סמן, טקסט] — סמן מוביל שהוצמד למילה הבאה (עמ' 77/80: "ג׳ .",
    //       "ו׳ ." — הנקודה אחרי הסמן ⇒ אסימטריה 6.7–6.9px).
    // הכלל הכללי: כל פרגמנט noteMarker במילה מוקרן כחלק-סמן בגודל הרישום
    // (fnSizePt) עם דגל mk — לפי הרוחב שנמדד בפועל לאותו פרגמנט. הפיצול
    // לפי מספר הפיסות (המודבקות מופרדות ב-NBSP⇒רווח לאחר ה-scrub) עם נפילה
    // מוגנת להתנהגות הקודמת כשאין התאמת מספרים.
    const mkFragCount = frags ? frags.reduce((s, f) => s + (f.kind === 'noteMarker' && f.advance > 0 ? 1 : 0), 0) : 0;
    let handled = false;
    if (frags && mkFragCount >= 1) {
      const pieces = String(words[i]).split(' ');
      if (pieces.length === frags.length && pieces.every(p => p.length > 0)) {
        for (let j = 0; j < frags.length; j++) {
          const f = frags[j];
          cursor -= f.advance;
          if (f.kind === 'noteMarker' && f.advance > 0) {
            emitWord(pieces[j], f.advance, fnSizePt, { mk: true });
          } else {
            emitWord(pieces[j], f.advance, eff, null);
          }
        }
        handled = true;
      }
    }
    if (!handled) {
      const mkFrag = frags && frags.length >= 2 ? frags[frags.length - 1] : null;
      if (mkFrag && mkFrag.kind === 'noteMarker' && mkFrag.advance > 0 && widths[i] > mkFrag.advance) {
        // פיצול: [טקסט ..., סמן] — הסמן החלק האחרון (מודבק אחרי המילה)
        const mkW = mkFrag.advance;
        const txtW = widths[i] - mkW;
        const raw = String(words[i]);
        const sp = raw.lastIndexOf(' ');
        const mkTxt = sp >= 0 ? raw.slice(sp + 1) : raw;
        const txtTxt = sp >= 0 ? raw.slice(0, sp) : raw;
        cursor -= txtW;
        emitWord(txtTxt, txtW, eff, null);
        cursor -= mkW;
        emitWord(mkTxt, mkW, fnSizePt, { mk: true });
      } else {
        cursor -= widths[i];
        // **S68:** סמן גודל פר-מילה רק כשהוא שונה מגודל השורה — שורות רגילות
        // (ברירת מחדל, בלי סוגריים/סגנון) נשארות בדיוק כפי שהיו (נייטרליות).
        emitWord(words[i], widths[i], eff, null);
      }
    }
    // **U-16:** רווח חי רק בין מילים ששתיהן גלויות (מילת-כיוון נבלעה בשכנה)
    if (i < words.length - 1 && !gapDead[i]) cursor -= gapW;
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
  // **Iteration-003 (legacy parity):** כמו הפוליו — הבסיס המכויל מהחותמת
  // (headerSlotGeo.baselineY — GEO.HEADER_BASELINE בפרופיל IMUD) גובר;
  // הנוסחה y+10 היא נפילה בלבד. עד כאן הדריסה הזיזה את הכותרת ~20pt מדי
  // נמוך מהייחוס (נמדד: בסיס 99.2px מול 71.9 המכויל).
  if (page.header) page.header.baselineY = page.header.baselineY != null ? page.header.baselineY : page.header.y + 10;
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

/** **שלב 8 (§4.1):** שורת שער מהחותמת — מילים {text,w} ממוקמות מהמרכז החוצה (RTL); אפס מדידה. */
function centeredStampedLine(stampedWords, spaceW, x, y, w, h, sizePt, cls, fontKey, color, styleOpts) {
  const totalW = stampedWords.reduce((a, b2) => a + b2.w, 0) + (spaceW || 0) * Math.max(0, stampedWords.length - 1);
  let cursor = x + (w + totalW) / 2; // הקצה הימני של הטקסט הממורכז
  const wordPos = [];
  for (const wd of stampedWords) {
    cursor -= wd.w;
    wordPos.push({ text: wd.text, x: cursor, w: wd.w, ...(fontKey ? { fontKey } : {}), ...(color ? { color } : {}) });
    cursor -= (spaceW || 0);
  }
  return {
    x, y, w, h, words: wordPos, align: 'center', kind: 'shaar-content', level: null, isLast: false, sizePt, baselineY: null, tokenId: null,
    cls: cls || '',
    // **פרוסה 3 (§2.2):** מאפייני עיצוב מהבלוק — עוברים למודל (המקרין קורא).
    ...(styleOpts && styleOpts.bold ? { bold: true } : {}),
    ...(styleOpts && styleOpts.letterSpacingPx ? { letterSpacingPx: styleOpts.letterSpacingPx } : {})
  };
}

/** **שלב 8 (§4.1):** שורת TOC מהחותמת — מילים {text,w} מימין לשמאל; אפס מדידה.
 * **ביקורת §3.2:** fontKey אופציונלי — כותרת עמוד ההערות נושאת את מפתח הגופן
 * שלה מהחותמת ('heading' ⇒ ‏/F3), כמו בנתיב ה-fakeLine הישן (תצוגה=ייצוא). */
function stampedRowLine(row, pt, kind, fontKey) {
  const align = row.align || 'right';
  const wordPos = [];
  const words = row.words || [];
  const totalWordsWidth = words.reduce((sum, wd) => sum + wd.w, 0) + Math.max(0, words.length - 1) * (row.spaceW || 0);
  let cursor = align === 'center' ? row.x + (row.w + totalWordsWidth) / 2 : row.x + row.w;
  for (const wd of words) {
    cursor -= wd.w;
    wordPos.push({ text: wd.text, x: cursor, w: wd.w, sizePt: pt, ...(fontKey ? { fontKey } : {}) });
    cursor -= (row.spaceW || 0);
  }
  return { x: row.x, y: row.y, w: row.w, h: row.h, words: wordPos, align, kind: kind || 'toc-row', level: null, isLast: false, sizePt: pt, bold: row.bold === true, baselineY: null, tokenId: null };
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
function projectDocument(result, settings, apiOrOpts) {
  const runOpts = resolveRunOpts(apiOrOpts);
  const production = runOpts.production;
  // **שלב 8 (§4.1):** הכניסה — materialization חד-פעמי. מונה הנפילות מאופס
  // בכל הרצה ומוחזר בפלט (חשבונאות גלויה: 0 במסלול המוצר — ה-pipeline מטביע
  // חותמות; >0 רק בקלטים סינתטיים/ישנים, תמיד עם diagnostic לכל נפילה).
  materializeFallbacks = [];
  const pages = result.pages.map(p => projectPage(p, settings, { measure: runOpts.measure, ...(production ? { mode: 'production' } : {}) }));
  const fallbacks = materializeFallbacks;
  materializeFallbacks = null;
  const profile = runOpts.measure || new MeasureAPI(settings, 'table'); // פרופיל בסיסים בלבד
  const ascent = profile.ascentEm();
  const descent = profile.descentEm();
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
      // **Iteration-001 (דיוק מדידת דיו):** אותיות הגימטריה יושבות על קו-הבסיס
      // (אין יורדים) — תחתית הדיו ≈ by; אותיות קטנות (י׳) מרחפות מעליו. ההערכה
      // הגסה הישנה (by+6) נחשפה כשפסי-H3 באמצע שינו את הפגינציה ועמודים קצרים
      // (דיו הגיליון בתחתית) נכנסו לדגימת חוזה ה-≤6px.
      acc(x, by - 10, w, 10);
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
  return { pages, inkBounds, layoutHash: result.layoutHash, materializeFallbacks: fallbacks };
}

const materializeDocument = projectDocument; // **שלב 8 (§4.1):** השם הקנוני — materialization, לא הקרנה

module.exports = { projectPage, projectLine, projectDocument, materializeDocument, lineFontSizePt, attachBaselines, lineWidthsFromModel };
