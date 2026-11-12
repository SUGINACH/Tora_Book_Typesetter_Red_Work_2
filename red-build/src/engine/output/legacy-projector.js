// src/engine/output/legacy-projector.js — הקרנת עמודי פרופיל IMUD לגיאומטריה מפורשת.
'use strict';

/**
 * **S4.9:** מקרן ייעודי לעמודי legacy-imud-flow. כל שורה מקבלת מיקום מפורש
 * (x/y/baseline/מילים עם רוחב וגודל פר-מילה) — מותאם לחוזה של writePdf
 * (pages/lines/footnotes/folio/header) ול-pdf_rows של compare.py.
 *
 * הגיאומטריה מקורה אחד: legacy-imud-flow (GEO/SZ) — מכויל מהייחוס.
 */

const { GEO, SZ, parenCenterRaisePx } = require('../layout/legacy-imud-flow');
// **S5.1:** מקור יחיד לגופן שורה לפי סוגה — כמו ה-DOM (renderLine). (השורה
// בשדה hFam של הכותרות ה-inline משתמשת בזה — נדרש כאן.)
// **S73:** hexColorToRgb — צבע פר-גופן מההגדרות (ברירת מחדל שחורה) לכל
// הטקסט המוקרן: גוף/כותרות/שער/כותרות-עליונות/גיליון/הערות — כמו ה-DOM.
const { lineFontFamily, hexColorToRgb } = require('./line-font');
const { MeasureAPI, registeredFonts, resolveMeasureImpl } = require('../typography/measure-api');
const { ornamentInk, parseSvgPaint, svgToPdfOps } = require('../decoration/ornament-ink'); // **EXT-4:** הדיו — מקור יחיד

const COL_R = { x: GEO.COL_R_X, w: GEO.COL_W };
const COL_L = { x: GEO.COL_L_X, w: GEO.COL_W };

/**
 * בסיס שורה לפי מודל תיבת השורה של CSS (half-leading + ascent).
 * **S5.1 (תצוגה=ייצוא, תיקון C2):** ה-descent כבר לא מוקשה 0.2 — המטריקה
 * האמיתית של הגופן (api.descentEm(); במימוש table הערך 0.20 כבריית המחדל,
 * זהה להתנהגות הקודמת). בגופן הגוף (גוטמן-רש"י, D=0.388) ההקשחה הסיטה את
 * כל שורות הגוף ב-PDF ב-~1.5px מהמודל של הדפדפן (ומהמקור).
 */
function baselineOf(yTop, h, sizePt, ascentEm, descentEm = 0.2) {
  const sizePx = sizePt * (96 / 72);
  const contentH = (ascentEm + descentEm) * sizePx;
  const half = Math.max(0, (h - contentH) / 2);
  return yTop + half + ascentEm * sizePx;
}

/** מיקום מילים RTL מיושרות ברוחב נתון. מחזיר words:[{text,x,w,sizePt,baselineY,fontKey?}] */
function placeWords(words, api, xLeft, width, sizePt, align, baseY, opts = {}) {
  // **S4.24 (מילים של תווי-כיוון בלבד — הדבקה לשכן):** כמו ברינדור ה-DOM —
  // מילת RLM/LRM בלבד היא ברוחב אפס; הרווח שמפריד אותה משכנתה נכלל
  // ברוחב השורה ומזיז את המרכוז (זהה לבאג שנמדד ב-DOM החי, עמ' 572).
  // האינדקסים של markers/parenIdx/קצוות ממופים למילה המארחת.
  const FORMAT_WORD_RE = /^[\u200e\u200f\u2066-\u2069\u202a-\u202e\u00ad]+$/;
  let src = words, srcMap = null;
  if (words.some((w) => typeof w === 'string' && FORMAT_WORD_RE.test(w))) {
    const items = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (typeof w === 'string' && FORMAT_WORD_RE.test(w)) {
        if (items.length) { items[items.length - 1].text += w; continue; }
        items.push({ text: w, srcIdx: -1 });
        continue;
      }
      const it = { text: w, srcIdx: i };
      if (items.length === 1 && items[0].srcIdx === -1) { it.text = items[0].text + w; items[0] = it; }
      else items.push(it);
    }
    src = items.map((it) => it.text);
    srcMap = items.map((it) => it.srcIdx);
    const remapArr = (a) => (Array.isArray(a) ? srcMap.map((oi) => (oi >= 0 ? !!a[oi] : false)) : a);
    const remapSet = (s) => {
      if (!s) return s;
      const ns = new Set();
      srcMap.forEach((oi, ni) => { if (oi >= 0 && s.has(oi)) ns.add(ni); });
      return ns;
    };
    opts = {
      ...opts,
      markers: opts.markers ? remapArr(opts.markers) : opts.markers,
      parenIdx: remapSet(opts.parenIdx),
      parenStarts: remapArr(opts.parenStarts),
      parenEnds: remapArr(opts.parenEnds)
    };
  }
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  // **S4.24 (רווח בגודל הסוגריים):** כמו spaceBetween בשבירה — הרווח בין
  // שתי מילים ששני צדדיהן בתוך (...) נמדד/מוצג ב-10pt (סוגריים = span
  // בגודל מוקטן גם לרווחים הפנימיים — הוכחת S4.15 מהייחוס). בלי זאת
  // שורת-סוגריים רחבה מהטור בדיו וגולשת (נמדד: 4px, עמ' 403). justify
  // מחלק את העודף בחלקים שווים **מעל** הרווחים הטבעיים — בדיוק כמו
  // justify של CSS (התצוגה = הייצוא, כמו S4.23).
  const parenSpaceW = api.measureTextWidth(' ', SZ.body + SZ.parenDelta, 0);
  const placed = src.map((w, i) => {
    if (typeof w === 'object') return w; // כבר ממוקם (חלון/סמן)
    const isMarker = opts.markers && opts.markers[i];
    const isParen = opts.parenIdx && opts.parenIdx.has(i);
    // **EXT-17:** גודל מילת-הסמן בגוף — הגדרת המקור (note-marker-size, ברירת
    // מחדל 8) ולא נגזרת מגודל הגוף.
    const markerSz = opts.markerSize != null ? opts.markerSize : SZ.fnMarker;
    const sz = isMarker ? markerSz : (isParen ? SZ.body + SZ.parenDelta : sizePt);
    return { text: w, w: api.measureTextWidth(w, sz, 0), sizePt: sz, smallKind: isMarker ? 'marker' : (isParen ? 'paren' : null) };
  });
  const sumW = placed.reduce((a, w) => a + w.w, 0);
  const gaps = Math.max(0, placed.length - 1);
  let gapWs = null;
  let naturalSum = 0;
  if (gaps > 0) {
    gapWs = new Array(gaps);
    for (let g = 0; g < gaps; g++) {
      const inParen = !!(opts.parenEnds && opts.parenStarts && opts.parenEnds[g] && opts.parenStarts[g + 1]);
      gapWs[g] = inParen ? parenSpaceW : spaceW;
      naturalSum += gapWs[g];
    }
  }
  if (align === 'justify' && gaps > 0 && sumW + naturalSum < width) {
    const extra = (width - sumW - naturalSum) / gaps;
    for (let g = 0; g < gaps; g++) gapWs[g] += extra;
  }
  const lineW = sumW + naturalSum;
  let xRight;
  // **S5.1 (תיקון C1 — align:'left'):** עד כאן לא היה ענף left — כל align
  // שאינו center נצמד לקצה הימני של התיבה. הסלוט השמאלי של הכותרת העליונה
  // צויר בצד הלא-נכון של תיבתו (+40px) ולא אצל השפה השמאלית כמו בייחוס.
  if (align === 'center') xRight = xLeft + (width + lineW) / 2;
  else if (align === 'left') xRight = xLeft + lineW;
  else xRight = xLeft + width;
  // **S4.26 (דיווח משתמש: "טקסט מוסגר ממוקם גבוה"):** סוגריים — מרכוז אנכי
  // מול הטקסט הרגיל (parenCenterRaisePx, אותו מודל תיבת-שורה כמו ה-DOM);
  // סמן-הערה נשאר מוגבה כמו super של המקור (0.33×גודל-השורה). בעבר שניהם
  // קיבלו את הגבהת הסמן — הסוגריים ישבו ~5.3px גבוה מדי.
  const parenRaise = parenCenterRaisePx(api.ascentEm(), sizePt, SZ.body + SZ.parenDelta);
  const out = [];
  let cursor = xRight;
  for (let k = 0; k < placed.length; k++) {
    const w = placed[k];
    cursor -= w.w;
    out.push({
      text: w.text, x: cursor, w: w.w,
      sizePt: w.sizePt,
      baselineY: w.smallKind === 'paren' ? baseY - parenRaise
        : (w.smallKind === 'marker' ? baseY - sizePt * (96 / 72) * 0.33 : baseY)
    });
    if (k < gaps) cursor -= gapWs[k];
  }
  return out;
}

/** רמות הפסים (ראי של HEADING_LEVEL_OF_BAND ב-dom-renderer — מקור יחיד סמנטי). */
const HEADING_LEVEL_OF_BAND_LEGACY = { 'h0-title': 0, 'h2-siman': 2, 'h2-title': 2, 'h3-title': 3 };

/** מפתח גופן לכותב ה-PDF לפי משפחה רשומה (S5.1 — תצוגה=ייצוא בגופנים).
 * **S73 (תצוגה=ייצוא בגופנים — תיקון שורש):** עד כאן כל משפחה שאינה
 * FRL/Hadassah/FrankReal קורסה ל-'heading' (DavidLibre-Bold) — וה-PDF צייר
 * את כל הכותרות בגופן אחד קבוע בלי קשר ל-heading-N-font שבהגדרות
 * (AlphaBlack/Lia Sgula/Alpha…) ואת כל שורות השער בגוף הטקסט — בזמן
 * שה-DOM מציג את המשפחות מההגדרות (דיווח משתמש: "הפונטים של הכותרות
 * שונה מבתצוגה"). כעת: המשפחה עצמה היא המפתח — וה-export-api בונה לה
 * תת-גופן ייעודי (/F7…). המשפחות הפונקציונליות נשארות על תפקידן:
 *  - FRL ⇒ 'fnbody' (/F5), Hadassah ⇒ 'margin' (/F6), FrankReal ⇒ 'window' (/F2)
 *    (אותו קובץ גופן כמו המדידה — בלי כפילויות תתי-גופן);
 *  - 'David Libre'/'DavidLibre-Bold' בהקשר **מודגש** (פסים/כותרות inline/
 *    שורות TOC — fontWeight 700 ב-DOM) ⇒ 'heading' (/F3 DavidLibre-Bold —
 *    כמו הייחוס וכמו ה-FontFace במשקל 700 של ה-UI).
 * קריאות בהקשר לא-מודגש (שורות שער ב-'David Libre' רגיל) משתמשות במשפחה
 * הגולמית — ראו gateLines להלן. */
function fontKeyOf(fam) {
  if (fam === 'Frank Ruhl Libre') return 'fnbody';
  if (fam === 'Hadassah Friedlaender') return 'margin';
  if (fam === 'FrankReal-Bold' || fam === 'FrankReal') return 'window';
  if (fam === 'David Libre' || fam === 'DavidLibre-Bold') return 'heading';
  return fam; // משפחה ייעודית מההגדרות — גופן משלה ב-PDF (S73)
}

/** הקרנת עמוד legacy בודד. */
function projectLegacyPage(pg, settings, api, winApi, headingApi = null, fnApi = null, mnApi = null, fnOpts = null) {
  // **S4.26:** headingApi — מדידת/ציור כותרות ב-DavidLibre-Bold (כמו הייחוס
  // וכמו ה-DOM); בלי גופן רשום — גופן הגוף (התנהגות קודמת).
  const hApi = headingApi || api;
  // **S5.1:** גופן גוף-ההערה (FRL) והערות-הצד (Hadassah) — כמו המדידה
  // במנוע וכמו ה-DOM. נפילה שקופה לגוף הטקסט כשהגופן אינו רשום.
  if (!fnApi) fnApi = api;
  if (!mnApi) mnApi = api;
  // **S5.1:** מטמון API לפי משפחה רשומה — לכותרות פר-רמה ושורות TOC.
  const famApiCache = new Map();
  const apiFor = (fam) => {
    if (!fam || !registeredFonts.has(fam)) return null;
    if (!famApiCache.has(fam)) {
      famApiCache.set(fam, new MeasureAPI({ 'body-font': fam, 'body-font-size-pt': SZ.body }, 'font-metrics'));
    }
    return famApiCache.get(fam);
  };
  // **EXT-17:** גדלי סמני ההערות מהגדרות המקור (ברירות המחדל: 8/8). ההגדרות
  // של פרופיל IMUD מגיעות ב-_imudRaw (כמו readConfig של העימוד עצמו).
  const imudSet = (settings && settings._imudRaw) || settings || {};
  const projCfg = {
    markerSize: Number(imudSet['note-marker-size']) || 8,
    listingSize: Number(imudSet['note-listing-num-size']) || 8
  };
  const ascent = api.ascentEm();
  const descent = api.descentEm(); // **S5.1:** המטריקה האמיתית — לא 0.2 מוקשה
  const out = {
    width: GEO.PAGE_W, height: GEO.PAGE_H,
    contentBox: { top: GEO.FLOW_TOP, bottom: GEO.FLOW_BOTTOM },
    columns: [COL_R, COL_L],
    lines: [], footnotes: [], folio: null, header: null, spanning: null
  };

  const isSingle = pg.type === 'preface' || pg.type === 'toc-general' || pg.type === 'toc-detailed'
    || pg.type.startsWith('shaar');
  const col0 = isSingle ? { x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48 } : COL_R;

  // **S73 (צבע פר-גופן מההגדרות):** צבעי הטקסט המוקרן — כמו ה-DOM.
  // ברירת המחדל של כולם שחורה (הגדרות הרישום) — hexColorToRgb מחזיר null
  // לשחור/חסר ⇒ אפס אופרטורי rg ב-PDF ואפס style.color ב-DOM (תצוגה=ייצוא).
  // הגישה מילולית (settings['…']) — דרישת סורק ה-phantom-key (REQ-GOV-05).
  const colorOf = (hex) => (hex ? hexColorToRgb(hex) : null);
  const bodyColor = colorOf(settings['body-color']);
  const headingColorOf = (lvl) => colorOf(settings[`heading-${lvl}-color`]);
  const hdrColorOf = (pos) => (pos === 'right' ? colorOf(settings['header-recto-right-color'])
    : pos === 'center' ? colorOf(settings['header-recto-center-color'])
      : colorOf(settings['header-recto-left-color']));
  const folioColor = colorOf(settings['page-num-color']);
  const bandColorOf = (b) => {
    if (b.kind === 'endnote-title') return colorOf(settings['endnote-title-color']);
    const lvl = HEADING_LEVEL_OF_BAND_LEGACY[b.kind];
    if (lvl != null) return headingColorOf(lvl);
    return null;
  };

  // ---- פסים: סימן/כותרת h2/h0/h3 ממורכזים ברוחב הפס (552px) ----
  // **S4.9:** פיצול למילים (פעולת טקסט נפרדת לכל מילה) — החילוץ מחזיר סדר לוגי,
  // כמו שורות הכותרת בייחוס (לא הפוך כמו שורות ה-TOC החד-פעולתיות).
  const bandLeft = GEO.COL_L_X;
  const bandW = 2 * GEO.COL_W + 13.48;
  for (const b of (pg.bands || [])) {
    const baseY = baselineOf(b.y, b.h, b.sizePt, ascent, descent);
    // **S5.1 (תצוגה=ייצוא — גופן פר-רמה כמו ה-DOM):** הפסים מרונדרים ב-DOM
    // בגופן heading-N-font של הרמה; המקרן צייר הכול ב-DavidLibre קבוע.
    // נפילה ל-hApi (התנהגות קודמת) כשהמשפחה אינה רשומה.
    const bLvl = HEADING_LEVEL_OF_BAND_LEGACY[b.kind];
    const bFam = bLvl != null ? (settings[`heading-${bLvl}-font`] || 'DavidLibre-Bold') : null;
    const bApi = (bLvl != null && apiFor(bFam)) || hApi;
    const words = placeWords(b.text.split(' '), bApi, bandLeft, bandW, b.sizePt, 'center', baseY);
    const bKey = (bLvl != null && apiFor(bFam)) ? fontKeyOf(bFam) : 'heading';
    // **S73:** צבע הפס מההגדרות (כותרת הערות ⇒ endnote-title-color; רמה ⇒ heading-N-color)
    const bColor = bandColorOf(b);
    for (const w of words) { w.fontKey = bKey; if (bColor) w.color = bColor; }
    out.lines.push({
      x: bandLeft, y: b.y, w: bandW, h: b.h, words, align: 'center',
      kind: b.kind, level: null, isLast: false, sizePt: b.sizePt,
      baselineY: baseY, tokenId: b.tokenId != null ? b.tokenId : null
    });
  }

  // ---- תוכן השערים (ממורכז; מילים נפרדות — חילוץ לוגי, כמו בייחוס) ----
  // **D-89 (עיצוב שערים):** תיבת התוכן של כל שער לפי תיבות השער של המקור
  // (resolveShaarBoxStyle/renderSubShaar/renderBackShaar) — שער-המשנה והשער
  // האחורי ממורכזים בתיבה שמחוץ לפאנל האפור, לא ברוחב הפס המלא:
  //  - sub:  left:15mm / right:95mm ⇒ מרכז 245.7px=184.2pt (נמדד בייחוס עמ' 7: 184 ✓)
  //  - back: מרכז 548px=411pt (נמדד בייחוס עמ' 2: 411 ✓)
  //  - main: left:15mm / right:15mm ⇒ מרכז 396.85px=297.6pt (נמדד עמ' 1: 298 ✓)
  const MMpx = 96 / 25.4;
  const GATE_BOX = {
    'shaar-main': { x: 15 * MMpx, w: GEO.PAGE_W - 30 * MMpx },
    'shaar-back': { x: 95 * MMpx, w: 377.98 },
    'shaar-sub': { x: 15 * MMpx, w: GEO.PAGE_W - 110 * MMpx }
  };
  const gbox = GATE_BOX[pg.type] || { x: bandLeft, w: bandW };
  for (const g of (pg.gateLines || [])) {
    const h = g.sizePt * (96 / 72) * 1.3;
    const baseY = baselineOf(g.y, h, g.sizePt, ascent, descent);
    // **S4.9:** שורות המהדורה והמחבר בשער הראשי נכתבות אצל המקור כרצף אחד —
    // החילוץ מחזיר אותן בסדר מילים הפוך. שאר שורות השער מפוצלות למילים (לוגי).
    const singleOp = g.singleOp === true;
    // **S73 (תצוגה=ייצוא בגופני השער — תיקון שורש):** עד כאן כל שורות השער
    // נמדדו וצוירו בגוף הטקסט (/F1) בזמן שה-DOM מציג אותן במשפחות מההגדרות
    // (shaar-title-font ⇒ Lia Sgula, f-sh-sub ⇒ Livorna…) — ה-PDF היה שונה
    // מהתצוגה בכל עמודי השער. כעת: המדידה והציור בגופן השורה (g.font) —
    // משפחה רשומה ⇒ תת-גופן ייעודי; בלתי-רשומה ⇒ גוף הטקסט (התנהגות
    // קודמת, נפילה מתועדת). הערטיפה עצמה כבר נמדדה בגופן זה (wrapGate — S6.3).
    const gApi = apiFor(g.font) || api;
    const words = placeWords(singleOp ? [g.text] : g.text.split(' '), gApi, gbox.x, gbox.w, g.sizePt, 'center', baseY);
    // **S73 (צבע):** צבע שורת השער מההגדרות (shaar-*-color; המודל מצרף
    // אותו מ-gateLinesFor) — ברירת מחדל שחורה, כמו ה-DOM.
    if (Array.isArray(g.color)) for (const w of words) w.color = g.color;
    if (g.font) {
      const gKey = apiFor(g.font) ? g.font : null;
      for (const w of words) if (gKey && w.fontKey == null) w.fontKey = gKey;
    }
    out.lines.push({
      x: gbox.x, y: g.y, w: gbox.w, h, words, align: 'center',
      kind: 'gate', level: null, isLast: false, sizePt: g.sizePt, baselineY: baseY, tokenId: null
    });
  }

  // ---- טורי גוף ----
  pg.columns.forEach((colLines, ci) => {
    const col = ci === 0 ? col0 : COL_L;
    for (const ln of colLines) {
      // **S4.14 (יישור-עליון לכותרות inline — כמקור):** בייחוס גליפי הכותרת יושבים
      // בראש השורה (עמ' 11: h5 גליפים ב-781.1 = ראש השורה 780.5 + 0.6px), והמרווח
      // נשאר מתחת. מרכוז אנכי (baselineOf) הוריד את הגליפים 3.4px ותיבת 11.5pt
      // חדרה למילת-החלון התלויה שמעליה (חפיפה 2.1px × 11 זוגות — H2 נכשל).
      const baseY = ln.kind === 'heading'
        ? ln.y + 0.6 + ascent * ln.sizePt * (96 / 72)
        : baselineOf(ln.y, ln.heightPx, ln.sizePt, ascent, descent);
      let words;
      if (ln.kind === 'heading') {
        // כותרת inline — מילים נפרדות (חילוץ לוגי, כמו בייחוס); **S5.1:**
        // גופן הרמה מההגדרות (כמו ה-DOM) — לא DavidLibre קבוע לכל הרמות.
        const joined = ln.words.join(' ');
        const hFam = lineFontFamily(ln, settings) || 'DavidLibre-Bold';
        const hApiLvl = apiFor(hFam) || hApi;
        words = placeWords(joined.split(' '), hApiLvl, col.x, col.w, ln.sizePt, 'center', baseY);
        const hKey = apiFor(hFam) ? fontKeyOf(hFam) : 'heading';
        // **S73:** צבע הכותרת ה-inline מההגדרות (heading-N-color) — כמו ה-DOM
        const hColor = ln.level != null ? headingColorOf(ln.level) : null;
        for (const w of words) { w.fontKey = hKey; if (hColor) w.color = hColor; }
      } else if (ln.window && ln.windowWords) {
        // שורת חלון: מילת החלון (1.5×) בשפה הימנית; הטקסט ברוחב מוקטן
        const winSz = ln.sizePt * 1.5;
        // **S4.15:** רוחב החלון מהמודל — המדידה שם ב-FrankReal-Bold 1.5×
        // (גופן החלון של המקור), לא בגופן הגוף. מקור יחיד: בלי הערך על
        // השורה (מודל ישן) — נפילה למדידה מקומית כמו קודם.
        const winW = ln.windowW || (api.measureTextWidth(ln.windowWords.join(' '), winSz, 0) + 6);
        // **S4.9→S4.15 (בסיס מילת-החלון כמו הייחוס):** בייחוס בסיס החלון יושב
        // כ-1.5pt מתחת לבסיס שורת הטקסט (עמ' 14: חלון 155.25 מול שורה 153.75)
        // — ולא מעליה. עם עליית הבסיס, תיבת 18pt (asc 751/desc 135 של
        // FrankReal) חורגת מחלון המיזוג של C2 (Δtop>7pt ⇒ שתי שורות נפרדות
        // ⇒ חפיפה מדומה 10.2pt). בסיס +2px מיישר את הגליפים כמקור ומנקה את C2.
        const winBase = baseY + 2;
        // **S4.15:** מילת-החלון נמדדת ומסומנת בגופן החלון (FrankReal-Bold —
        // כמו המקור) — הציור ב-PDF ב-/F2. המדידה במטריקות האמיתיות מונעת
        // חריגה מהשקע (גופן הגוף רחב ממנה בחלק מהמילים ⇒ חפיפות C2).
        const winMeasure = winApi || api;
        // **S73:** צבע מילת-החלון מההגדרות (first-word-color) — כמו ה-DOM
        const winColor = colorOf(settings['first-word-color']);
        const winWords = ln.windowWords.map(w => ({
          text: w,
          w: winMeasure.measureTextWidth(w, winSz, 0),
          sizePt: winSz, fontKey: 'window', ...(winColor ? { color: winColor } : {})
        }));
        // מיקום מימין לשמאל בתוך השקע (ישור לשפה הימנית — כמקור)
        {
          let cx = col.x + col.w;
          for (const ww of winWords) {
            cx -= ww.w;
            ww.x = cx;
            ww.baselineY = winBase;
          }
        }
        const textW = col.w - winW;
        // **S4.19:** דגלי סוגריים מהמודל — גם בשורות החלון (הסוגריים נפתחים
        // לא פעם בשורות 0-1 של פסקת-חלון; הזיהוי הפר-שורתי הקודם פספס טווחים
        // שנפתחו בשורה קודמת).
        const winParenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) winParenIdx.add(i); });
        }
        const textWords = placeWords(ln.words, api, col.x, textW, ln.sizePt,
          ln.isLast ? 'center' : 'justify', baseY, { parenIdx: winParenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null });
        words = [...winWords, ...textWords];
      } else {
        const align = ln.isLast ? 'center' : 'justify';
        // **S4.26 (חלון שקוע — שורה 1):** שורה 1 של פסקת-חלון (window בלי
        // windowWords) נמדדה במודל ברוחב מוקטן (limitOf של breakPara) —
        // וגם כאן הטקסט מקבל את הרוחב המוקטן ועוטף את מילת-החלון (כמו
        // float:right במקור); עד כאן נמתחה לרוחב מלא.
        const lineW = (ln.window && !ln.windowWords && ln.windowW)
          ? Math.max(40, col.w - ln.windowW) : col.w;
        // **S4.9:** מילים בתוך (...) מרונדרות בגודל הסוגריים המוקטן — בדיוק
        // כפי שנמדדו בשבירה (אחרת השורה רחבה מהטור וגולשת מהעמוד).
        // **S4.19 (סוגריים רב-שורתיים):** הזיהוי הקודם היה פר-שורה (מילה
        // שנפתחת ב'(' עד מילה שנסגרת ב-')' **באותה שורה**) — טווח שנפתח בשורה
        // אחת ונסגר באחרת רונדר בגודל הגוף (11.5pt בהקדמה מול 10pt בייחוס —
        // עמ' 10: 'כהרבה מדיני התורה…'). כעת הדגלים מגיעים מהמודל (חישוב
        // עומק-תווים על כל הפסקה ב-breakPara) — מקור יחיד למדידה ולרינדור.
        const parenIdx = new Set();
        if (ln.parenFlags && ln.parenFlags.length === ln.words.length) {
          ln.parenFlags.forEach((p, i) => { if (p) parenIdx.add(i); });
        } else {
          const stack = [];
          ln.words.forEach((w, i) => {
            if (w.startsWith('(')) stack.push(i);
            if (w.endsWith(')') && stack.length) {
              const from = stack.pop();
              for (let k = from; k <= i; k++) parenIdx.add(k);
            }
          });
        }
        // **D-89 (דיווח משתמש: "כל מילה שצמודה לנקודה מופיעה בגופן קטן"):**
        // זיהוי סמני-ההערה מהמודל בלבד (markerIdx — אינדקסים מדויקים של
        // הסמנים שהוזרקו ב-legacy-imud-flow), עם ולידציית צורה נגד סטיית
        // אינדקס. הביטוי הקודם /^[א-ת]+\.$/ תפס **כל מילה עברית המסתיימת
        // בנקודה** (סוף משפט!) והקטין אותה ל-8pt — 744 מילים בקורפוס
        // ההשוואה. בלי דגל מהמודל — שום מילה לא מוקטנת: מספור האיות
        // ("א. ב. ג." בגוף המשפט) נשאר בגודל הגוף — כפי שנמדד בייחוס
        // (עמ' 12: 91 סמני איות ב-12.0pt = גודל הגוף; רק סמני ההערות
        // האמיתיים — מהסוגריים — ב-6–8pt).
        const markerIdxSet = Array.isArray(ln.markerIdx) ? new Set(ln.markerIdx) : null;
        const MARKER_WORD_RE = /^[א-ת]{1,3}[.:]?$/; // א. / בק. — גימטריה קצרה (±מפריד)
        const isMarkerWord = (w, i) => !!(markerIdxSet && markerIdxSet.has(i) && MARKER_WORD_RE.test(w));
        words = placeWords(ln.words, api, col.x, lineW, ln.sizePt, align, baseY,
          { markers: ln.words.map((w, i) => isMarkerWord(w, i)), parenIdx,
            parenStarts: Array.isArray(ln.parenStarts) && ln.parenStarts.length === ln.words.length ? ln.parenStarts : null,
            parenEnds: Array.isArray(ln.parenEnds) && ln.parenEnds.length === ln.words.length ? ln.parenEnds : null,
            markerSize: projCfg.markerSize });
        // **S73:** צבע גוף הטקסט מההגדרות (body-color; שחור ⇒ אפס אופרטורים)
        if (bodyColor) for (const w of words) if (w.color == null) w.color = bodyColor;
      }
      out.lines.push({
        x: col.x, y: ln.y, w: col.w, h: ln.heightPx, words,
        align: ln.kind === 'heading' ? 'center' : (ln.isLast ? 'center' : 'justify'),
        kind: ln.kind, level: ln.level || null, isLast: !!ln.isLast, sizePt: ln.sizePt,
        baselineY: baseY, tokenId: ln.tokenId != null ? ln.tokenId : null
      });
    }
  });

  // ---- הערות צד בטורי השוליים ----
  // **S73 (צבע מההגדרות):** צבע הערות-הצד — heading-7-color (הגופן בפועל
  // שלהן ב-DOM הוא heading-7-font — Hadassah; האפור הקבוע #404040 של D-89
  // הוחלף בהגדרה עם ברירת מחדל שחורה — בקשת משתמש מפורשת). בלי ערך —
  // שחור (אפס אופרטורי rg).
  const mnColor = headingColorOf(7);
  for (const mn of (pg.marginNotes || [])) {
    const x = mn.side === 'right' ? GEO.MARGIN_R_X : GEO.MARGIN_L_X;
    for (const l of mn.lines) {
      const baseY = baselineOf(l.y, GEO.MN_PITCH, SZ.marginNote, ascent, descent);
      // **S5.1:** הערות-צד בגופן המקור (Hadassah Friedlaender — כמו המדידה
      // במנוע וכמו ה-DOM); עד כאן צוירו בגוף הטקסט — התצוגה ≠ הייצוא בגופנים.
      const words = placeWords(l.text.split(' '), mnApi, x, GEO.MARGIN_W, SZ.marginNote, 'center', baseY);
      for (const w of words) { w.fontKey = 'margin'; if (mnColor) w.color = mnColor; }
      out.lines.push({
        x, y: l.y, w: GEO.MARGIN_W, h: GEO.MN_PITCH, words, align: 'center',
        kind: 'margin-note', level: null, isLast: false, sizePt: SZ.marginNote,
        baselineY: baseY, tokenId: null
      });
    }
  }

  // ---- מפריד הערות ----
  // **S4.9:** המקור השתמש ב-✧✧✧ מגופן דפדפן חלופי; הגופן המוטמע שלנו חד-לשוני
  // (אין גליפי כוכבים) — ההפרדה נשארת דרך ריווח התחתית בלבד.

  // ---- הערות שוליים (תחתית) ----
  // **S74 (בעיה 5):** גוף ההערה נמדד ומסומן בגופן ההגדרה f-note-body-font
  // (ברירת המחדל המתוקנת — Assistant ExtraLight, כפי שנמדד בייחוס עמ' 31/37)
  // באמצעות תת-גופן ייעודי (מנגנון המשפחות של S73); סמני הרישום נשארים
  // ב־/F5 (FRL) — כמו בייחוס. בסיס השורה לפי מטריקות גופן ההערה בפועל.
  const fnBodyKey = (fnOpts && fnOpts.bodyKey) || 'fnbody';
  const fnMarkApi = (fnOpts && fnOpts.markApi) || fnApi;
  const fnAsc = fnApi ? fnApi.ascentEm() : ascent;
  const fnDesc = fnApi ? fnApi.descentEm() : descent;
  // **D-89 (דיווח משתמש: "בהערות השוליים יש מילים אחת על השניה"):**
  // בעבר כל שורות ההערה שורטטו על בסיס אחד (baselineOf של השורה הראשונה)
  // וכל שורה התחילה מאותו x — הערה רבת-שורות נערמה כולה על עצמה.
  // כעת: בסיס פר-שורה (l.y), השורה הראשונה נגרעת מרוחב הסמן ומיושרת
  // לשני הצדדים עד הסמן, שורות הביניים מיושרות לרוחב מלא, והשורה
  // האחרונה מיושרת לשפה הימנית — כפי שנמדד בייחוס (עמ' 31: שורה-1
  // x:91–494 מיושרת; שורה-2 x:383–505 מיושרת-ימין; סמן '.א' ב-x:496–505).
  for (const fn of (pg.footnotes || [])) {
    // **S73:** צבע גוף ההערה — f-note-body-color מההגדרות (ברירת מחדל שחורה)
    const fnColor = colorOf(settings['f-note-body-color']);
    // **S4.26 (זרימה רציפה):** כל ההערות בזרם אחד — סמנים בגודל הרישום,
    // יישוב לשני הצדדים בכל שורה חוץ מהאחרונה (לימין), המשך ב-'(המשך)'
    // בלי אות סימון. שורות הזרימה מהמודל (fnFlowFor) — מקור יחיד.
    if (fn.continuous) {
      const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
      const spaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
      const usableW = rightEdge - GEO.COL_L_X;
      const words = [];
      fn.lines.forEach((l, li) => {
        const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, fnAsc, fnDesc);
        const isLast = li === fn.lines.length - 1;
        const toks = (l.words || []).filter(t => !t.gap);
        // **S5.1 + S74:** גוף ההערה בגופן ההגדרה; סמני הרישום ב-FRL (כמו
        // הייחוס עמ' 31/37) — המדידה והציור באותו גופן לכל אחד.
        const ws = toks.map(t => ({
          text: t.t,
          sizePt: t.mk ? projCfg.listingSize : SZ.fnBody,
          w: (t.mk ? fnMarkApi : fnApi).measureTextWidth(t.t, t.mk ? projCfg.listingSize : SZ.fnBody, 0),
          mk: !!t.mk
        }));
        const sumW = ws.reduce((a, w) => a + w.w, 0);
        const gaps = Math.max(0, ws.length - 1);
        let gapW = spaceW;
        if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
          gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים — כמו הגוף
        }
        let cursor = rightEdge;
        // **S74 (בעיה 7 — בקשת משתמש 12.11):** השורה האחרונה של מרזב ההערות
        // (של כל ההערות יחד) ממורכזת; חריג: הערה שממשיכה לעמוד הבא
        // (centerLast=false מהמנוע) — נשארת מיושבת לימין.
        if (isLast && fn.centerLast) {
          cursor = rightEdge - Math.max(0, (usableW - (sumW + gaps * spaceW)) / 2);
        }
        // **S6.0 (R5-C1 — סדר מילים הפוך בהערות):** הלולאה רצה מהסוף להתחלה
        // והציבה את המילה ה**אחרונה** בלוגי בקצה הימני — כלומר ההערה נקראה
        // בסדר הפוך בייצוא ה-PDF (המודל וה-DOM מציגים את המילה הראשונה מימין,
        // כנדרש ב-RTL). תוקם: מעבר קדימה — המילה הראשונה זוכה לסלוט הימני;
        // מיקומי הסלוטים/הרווחים/היישוב לא השתנו כלל (רק מיפוי מילה→סלוט).
        for (let i = 0; i < ws.length; i++) {
          cursor -= ws[i].w;
          words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: ws[i].sizePt, baselineY: baseY, fontKey: ws[i].mk ? 'fnbody' : fnBodyKey, ...(fnColor ? { color: fnColor } : {}) });
          cursor -= gapW;
        }
      });
      if (words.length) {
        out.footnotes.push({
          centerLast: !!fn.centerLast, // **S74 (בעיה 7):** מרכוז השורה האחרונה (חריג: המשך לעמוד הבא)
          y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: '',
          text: fn.lines.flatMap(l => (l.words || []).filter(t => !t.gap).map(t => t.t)).join(' '),
          words, baselineY: null, h: fn.lines.length * GEO.FN_PITCH,
          ...(fnColor ? { color: fnColor } : {})
        });
      }
      continue;
    }
    const rightEdge = GEO.COL_L_X + 2 * GEO.COL_W + 13.48;
    const spaceW = fnApi.measureTextWidth(' ', SZ.fnBody, 0);
    const words = [];
    let firstBase = null;
    let firstRight = rightEdge;
    // **S4.24:** המשך הערה מקוצצת — '(המשך)' לפני הסמן (כמו ה-DOM והנתיב המודרני)
    if (fn.cont) {
      const pTxt = '(המשך)';
      const pw = fnApi.measureTextWidth(pTxt, SZ.fnBody, 0);
      firstRight -= pw;
      words.push({ text: pTxt, x: firstRight, w: pw, sizePt: SZ.fnBody, baselineY: null, fontKey: 'fnbody', ...(fnColor ? { color: fnColor } : {}) });
      firstRight -= spaceW;
    }
    if (fn.marker) {
      // **EXT-17:** סמן הרישום בגודל עצמאי (note-listing-num-size, ברירת מחדל 8).
      // **S74 (בעיה 5):** הסמן נמדד ב-FRL (כמו הייחוס) — לא בגופן גוף ההערה.
      const msz = projCfg.listingSize;
      const mw = fnMarkApi.measureTextWidth(fn.marker, msz, 0);
      firstRight -= mw;
      words.push({ text: fn.marker, x: firstRight, w: mw, sizePt: msz, baselineY: null, fontKey: 'fnbody', ...(fnColor ? { color: fnColor } : {}) });
      firstRight -= spaceW;
    }
    fn.lines.forEach((l, li) => {
      const baseY = baselineOf(l.y, GEO.FN_PITCH, SZ.fnBody, fnAsc, fnDesc);
      if (firstBase === null) {
        firstBase = baseY;
        if (words.length) words[0].baselineY = firstBase; // הסמן על בסיס השורה הראשונה
      }
      const isLast = li === fn.lines.length - 1;
      const lineRight = li === 0 ? firstRight : rightEdge;
      const usableW = Math.max(0, lineRight - GEO.COL_L_X);
      const ws = l.words.map(w => ({ text: w, w: fnApi.measureTextWidth(w, SZ.fnBody, 0) }));
      const sumW = ws.reduce((a, w) => a + w.w, 0);
      const gaps = Math.max(0, ws.length - 1);
      let gapW = spaceW;
      if (!isLast && gaps > 0 && sumW + gaps * spaceW < usableW) {
        gapW = (usableW - sumW) / gaps; // יישוב לשני הצדדים (כמו הייחוס)
      }
      let cursor = lineRight;
      // **S74 (בעיה 7):** מרכוז השורה האחרונה של ההערה האחרונה בעמוד
      // (centerLast מהמנוע; חריג: הערה שנחתכה לעמוד הבא).
      if (isLast && fn.centerLast) {
        cursor = lineRight - Math.max(0, (usableW - (sumW + gaps * spaceW)) / 2);
      }
      // **S6.0 (R5-C1):** מעבר קדימה — המילה הראשונה בלוגי בקצה הימני (RTL);
      // בעבר האחרונה הוצבה מימין וההערה נקראה הפוך ב-PDF.
      for (let i = 0; i < ws.length; i++) {
        cursor -= ws[i].w;
        words.push({ text: ws[i].text, x: cursor, w: ws[i].w, sizePt: SZ.fnBody, baselineY: baseY, fontKey: fnBodyKey, ...(fnColor ? { color: fnColor } : {}) });
        cursor -= gapW;
      }
    });
    if (words.length) {
      out.footnotes.push({ centerLast: !!fn.centerLast, y: fn.lines[0].y, x: GEO.COL_L_X, w: 2 * GEO.COL_W + 13.48, marker: fn.marker, text: fn.lines.map(l => l.words.join(' ')).join(' '), words, baselineY: firstBase, h: fn.lines.length * GEO.FN_PITCH, ...(fnColor ? { color: fnColor } : {}) });
    }
  }

  // ---- שורות תוכן-עניינים ----
  if (pg.toc) {
    if (pg.toc.title) {
      const y = GEO.FLOW_TOP + TOC_TITLE_Y_OFFSET;
      const baseY = baselineOf(y, 30, SZ.tocTitle, ascent, descent);
      const words = placeWords([pg.toc.title], api, bandLeft, bandW, SZ.tocTitle, 'center', baseY);
      out.lines.push({
        x: bandLeft, y, w: bandW, h: 30, words, align: 'center', kind: 'toc-title',
        level: null, isLast: false, sizePt: SZ.tocTitle, baselineY: baseY, tokenId: null
      });
    }
    for (const r of (pg.toc.rows || [])) {
      // **S6.0 (F5):** שורת TOC עטופה — כל שורה-בת בפס 26px משלה (כמו ה-DOM);
      // שורות חד-שורתיות (המקרה הנפוץ) זהות בתכלית לפלט הקודם.
      const rowLines = (r.lines && r.lines.length ? r.lines : [r.text]).filter(t => String(t || '').trim());
      rowLines.forEach((rowText, rli) => {
        const lineY = r.y + rli * 26;
        const baseY = baselineOf(lineY, 26, r.sizePt, ascent, descent);
      // כותרת מימין (במדרגות לפי רמה), מספר משמאל; **S5.1:** גופן הרמה
      // מההגדרות (כמו ה-DOM — heading-N-font), נפילה ל-hApi כשאינה רשומה.
      const rLvl = r.level != null ? r.level : 2;
      const rFam = settings[`heading-${rLvl}-font`] || 'DavidLibre-Bold';
      const rFamApi = apiFor(rFam);
      const rApi = rFamApi || hApi;
      // **S73:** צבע שורת ה-TOC — heading-N-color של הרמה (כמו ה-DOM)
      const rColor = headingColorOf(rLvl);
      const tW = rApi.measureTextWidth(rowText, r.sizePt, 0);
      const textWords = placeWords([rowText], rApi, r.x1 - tW, tW, r.sizePt, 'right', baseY);
      for (const w of textWords) { w.fontKey = rFamApi ? fontKeyOf(rFam) : 'heading'; if (rColor) w.color = rColor; }
      const numW = rApi.measureTextWidth(r.folio, SZ.tocNum, 0);
      const numWords = (r.folio && rli === 0) ? placeWords([r.folio], rApi, GEO.TOC_NUM_X, numW, SZ.tocNum, 'left', baseY) : [];
      for (const w of numWords) { w.fontKey = rFamApi ? fontKeyOf(rFam) : 'heading'; if (rColor) w.color = rColor; }
      out.lines.push({
        x: GEO.TOC_NUM_X, y: lineY, w: r.x1 - GEO.TOC_NUM_X, h: 26,
        words: [...textWords, ...numWords], align: 'right', kind: 'toc-row',
        level: r.level, isLast: false, sizePt: r.sizePt, baselineY: baseY, tokenId: null
      });
      });
    }
  }

  // ---- גיליון ----
  // **S73 (גופן/גודל/צבע גיליון מההגדרות):** page-num-font ('' = גוף הטקסט —
  // התנהגות קודמת), page-num-size-pt (ברירת מחדל 10 = SZ.folio) ו-page-num-color
  // (ברירת מחדל שחורה) — כמו ה-DOM. המדידה בגופן הגיליון כשרשום.
  if (pg.folioDisplay) {
    const folioSz = Number(settings['page-num-size-pt']) > 0 ? Number(settings['page-num-size-pt']) : SZ.folio;
    const folioFam = settings['page-num-font'] || '';
    const folioApi = apiFor(folioFam) || api;
    const folioKey = (folioFam && apiFor(folioFam)) ? folioFam : null;
    const fw = folioApi.measureTextWidth(pg.folioDisplay, folioSz, 0);
    out.folio = {
      y: GEO.FOLIO_BASELINE - 14, x: Math.round((GEO.PAGE_W - fw) / 2), w: fw,
      sizePt: folioSz, text: pg.folioDisplay, baselineY: GEO.FOLIO_BASELINE,
      ...(folioKey ? { fontKey: folioKey } : {}),
      ...(folioColor ? { color: folioColor } : {})
    };
  }

  // ---- כותרת עליונה תלת-סלוטית ----
  // **S73 (תצוגה=ייצוא בגופני הכותרת העליונה):** ה-DOM מציג כל סלוט
  // בגופן שלו מההגדרות (header-recto-{right,center,left}-font — Livorna
  // בברירות המחדל של המקור) ובצבעו (header-*-color; ברירת מחדל שחורה —
  // הכחול הקבוע #0F1749 של D-89 הוחלף בהגדרה, בקשת משתמש מפורשת).
  // עד כאן כל הסלוטים נמדדו וצוירו ב-DavidLibre-Bold (/F3) — ה-PDF היה
  // שונה מהתצוגה בכל עמוד גוף. כעת: מדידה+ציור בגופן הסלוט (משפחה רשומה
  // ⇒ תת-גופן ייעודי; בלתי-רשומה ⇒ DavidLibre-Bold — התנהגות קודמת).
  if (pg.headerSlots && (pg.headerSlots.right || pg.headerSlots.center || pg.headerSlots.left)) {
    const slots = [];
    // **S73:** גופן/צבע הסלוט — מההגדרות (header-recto-{right,center,left}-* —
    // אותם מפתחות שה-DOM של legacy מציג; verso משוקף ל-recto בזרימת המורשת).
    const SLOT_FONT_KEY = { right: 'header-recto-right-font', center: 'header-recto-center-font', left: 'header-recto-left-font' };
    const mk = (pos, text, sizePt) => {
      if (!text) return;
      // **S73:** גופן הסלוט מההגדרות — כמו ה-DOM (fontWeight 700 שם;
      // Livorna הוא חד-משקלי — המשפחה עצמה). נפילה ל-hApi (DavidLibre-Bold)
      // כשהמשפחה אינה רשומה — התנהגות קודמת.
      const fam = settings[SLOT_FONT_KEY[pos]] || 'DavidLibre-Bold';
      const sApi = apiFor(fam) || hApi;
      const w = sApi.measureTextWidth(text, sizePt, 0);
      let x;
      if (pos === 'right') x = GEO.COL_R_X + GEO.COL_W - 33 - w;
      else if (pos === 'left') x = GEO.COL_L_X + 33;
      else x = (GEO.PAGE_W - w) / 2;
      slots.push({ pos, text, x, w, sizePt, fam: apiFor(fam) ? fam : null, color: hdrColorOf(pos) });
    };
    mk('right', pg.headerSlots.right, SZ.hdrR);
    mk('center', pg.headerSlots.center, SZ.hdrC);
    mk('left', pg.headerSlots.left, SZ.hdrL);
    if (slots.length) {
      // **S4.9:** כל סלוט מתפצל למילים — חילוץ לוגי כמו בייחוס
      for (const s of slots) {
        const baseY = GEO.HEADER_BASELINE;
        // **S5.1 (תיקון C1/L2):** רוחב התיבה = רוחב הטקסט עצמו (s.w) — לא
        // s.w+40. ה+40 הסיט כל סלוט 40px מהמקום שמכויל מהייחוס ב-mk() לעיל.
        const sFam = s.fam || 'DavidLibre-Bold';
        const sApi = apiFor(sFam) || hApi;
        const sKey = s.fam ? fontKeyOf(s.fam) : 'heading';
        s.words = placeWords(s.text.split(' '), sApi, s.x, s.w, s.sizePt,
          s.pos === 'center' ? 'center' : (s.pos === 'right' ? 'right' : 'left'), baseY);
        s.color = s.color || pg.headerSlots.color || null;
        for (const w of s.words) { if (s.color) w.color = s.color; w.fontKey = sKey; }
      }
      out.header = { y: GEO.HEADER_BASELINE - 14, baselineY: GEO.HEADER_BASELINE, slots };
    }
  }

  // **EXT-4 (הדיו — נתיב legacy):** אם למודל ה-legacy יש rectים של עיטורים
  // (טרם מיוצרים כברירת מחדל — הגדרות המקור ללא עיטורים; התשתית מוכנה
  // לחיבור ornament-plan בעתיד) — הם מוקרנים עם אותו דיו (ornament-ink)
  // כמו בנתיב ה-DP: pdfOps לכותב ה-PDF ו-data-URI ל-DOM.
  if (pg.decorations && pg.decorations.length) {
    const hPt = out.height * (72 / 96);
    const PX_TO_PT = 72 / 96;
    const r2 = (v) => Math.round(v * 100) / 100;
    const cssColor = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
    out.decorations = pg.decorations.map((d) => {
      const ink = d.image ? { type: 'image', uri: d.image } : ornamentInk(d.kindStyle);
      let paint = null, pdfOps = null;
      if (ink && ink.type === 'svg') {
        paint = parseSvgPaint(ink.svg);
        if (paint) pdfOps = svgToPdfOps(paint, d, hPt, PX_TO_PT);
      } else if (ink && ink.type === 'rect') {
        // **D-89:** מלבן בצבע אחיד — פאנלי השערים, מסגרות וכלל הכותרת.
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`${r2(ink.color[0])} ${r2(ink.color[1])} ${r2(ink.color[2])} rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${r2(d.h * PX_TO_PT)} re f`];
      } else if (ink && ink.type === 'rule') {
        const yTop = hPt - (d.y + d.h) * PX_TO_PT;
        pdfOps = [`0 0 0 rg ${r2(d.x * PX_TO_PT)} ${r2(yTop)} ${r2(d.w * PX_TO_PT)} ${Math.max(0.5, r2(d.h * PX_TO_PT))} re f`];
      }
      return {
        x: d.x, y: d.y, w: d.w, h: d.h, kind: d.kind || null, slot: d.slot || null,
        kindStyle: d.kindStyle || null, inkType: ink ? ink.type : null,
        inkUri: ink && ink.uri ? ink.uri : null,
        inkColor: ink && ink.type === 'rect' ? cssColor(ink.color) : null,
        paint, pdfOps
      };
    });
  }

  return out;
}

const FLOW_BOTTOM_DEFAULT = GEO.FLOW_TOP + GEO.FLOW_H;
const TOC_TITLE_Y_OFFSET = 136; // כותרת ה-TOC ב-309px = FLOW_TOP+212.4 — מכויל

/** הקרנת מסמך legacy שלם. */
function projectLegacyDocument(result, settings) {
  // **EXT-13:** אותו מקור מדידה כמו העימוד (legacyTypeset) — הקרנה ומילוי
  // לא יכולים להתפצל: רוחב שורה שונה ביניהם = חפיפות/גלישות מדומות.
  const impl = resolveMeasureImpl(settings);
  const api = new MeasureAPI(settings, impl);
  // **S4.15 (גופן מילת-החלון בהקרנה):** מילות-החלון נמדדות ומסומנות בגופן
  // המקור (FrankReal-Bold) — הציור ב-PDF ב-/F2 והרוחב האמיתי (בלי זה הגליפים
  // של גוף הטקסט רחבים מהשקע שנשמר וחודרים לשורה — 1886 חפיפות בקורפוס).
  // הגופן נרשם ע"י legacyTypeset מ-env.windowFontBytes באותו תהליך.
  let winApi = null;
  const winName = registeredFonts.has('FrankReal-Bold') ? 'FrankReal-Bold'
    : (registeredFonts.has('FrankReal') ? 'FrankReal' : null);
  if (impl === 'font-metrics' && winName) {
    winApi = new MeasureAPI({ 'body-font': winName, 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  // **S4.26 (גופן כותרות בהקרנה):** DavidLibre-Bold — אותו גופן כמו המדידה
  // ב-legacyTypeset (env.headingFontBytes) וכמו ה-DOM; הציור ב-/F3.
  let headingApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('DavidLibre-Bold')) {
    headingApi = new MeasureAPI({ 'body-font': 'DavidLibre-Bold', 'body-font-size-pt': SZ.body }, 'font-metrics');
  }
  // **S5.1 (גופני גוף-הערה והערות-הצד בהקרנה):** FRL לגוף ההערה,
  // Hadassah להערות-הצד — כמו המדידה במנוע (fnApi/marginApi ב-legacyTypeset)
  // וכמו ה-DOM. נפילה שקופה לגוף הטקסט כשהגופן אינו רשום.
  let fnApi = null;
  let fnBodyKey = 'fnbody'; // **S74 (בעיה 5):** גוף ההערה — משפחה ייעודית (תת-גופן S73) או /F5
  let fnMarkApi = null; // **S74:** סמני הרישום — FRL (כמו הייחוס עמ' 31/37)
  const fnFam = settings['f-note-body-font'];
  if (impl === 'font-metrics' && fnFam && fnFam !== 'Frank Ruhl Libre' && registeredFonts.has(fnFam)) {
    fnApi = new MeasureAPI({ 'body-font': fnFam, 'body-font-size-pt': SZ.fnBody, 'body-line-height': 1.5 }, 'font-metrics');
    fnBodyKey = fnFam;
  } else if (impl === 'font-metrics' && registeredFonts.has('Frank Ruhl Libre')) {
    fnApi = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.fnBody, 'body-line-height': 1.5 }, 'font-metrics');
  }
  if (impl === 'font-metrics' && registeredFonts.has('Frank Ruhl Libre')) {
    fnMarkApi = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': SZ.fnBody, 'body-line-height': 1.5 }, 'font-metrics');
  }
  let mnApi = null;
  if (impl === 'font-metrics' && registeredFonts.has('Hadassah Friedlaender')) {
    mnApi = new MeasureAPI({ 'body-font': 'Hadassah Friedlaender', 'body-font-size-pt': SZ.marginNote, 'body-line-height': 1.2 }, 'font-metrics');
  }
  const fnOpts = { bodyKey: fnBodyKey, markApi: fnMarkApi };
  const pages = result.pages.map(p => projectLegacyPage(p, settings, api, winApi, headingApi, fnApi, mnApi, fnOpts));
  return { pages, inkBounds: pages.map(() => null), layoutHash: result.layoutHash };
}

module.exports = { projectLegacyPage, projectLegacyDocument };
