// src/engine/layout/page-templates.js — PT-01..PT-10 page type contracts (Part B2) + geometry model
'use strict';

/**
 * מודל תבניות עמוד: לכל סוג חוזה גיאומטריה (מרזבים, מספור, running head, טורים).
 */
const PAGE_TYPES = {
  SHAAR_MAIN: 'shaar-main',      // PT-01
  SHAAR_SUB: 'shaar-sub',        // PT-02
  SHAAR_BACK: 'shaar-back',      // PT-03
  PREFACE: 'preface',            // PT-04 (H0 — טור רחיד)
  SIGN_OPEN: 'sign-open',        // PT-05 (H2 — עמוד חדש תמיד)
  H3_SPREAD: 'h3-spread',        // PT-06 (כותרת 3 חוצת טורים + איזון לפני)
  ENDNOTES: 'endnotes',          // PT-07
  TOC_GENERAL: 'toc-general',    // PT-08
  TOC_DETAIL: 'toc-detail',      // PT-08
  CUSTOM: 'custom',              // PT-09
  FILLER: 'filler',              // PT-10 — לא נספר, לא underfill
  REGULAR: 'regular'             // PT default
};

const MM_TO_PX = 96 / 25.4;
const PAGE_SIZES = {
  // **S5.2 (O14 — A4 מדויק):** 210×297מ״מ @96dpi = 793.70×1122.52px — הערכים
  // המעוגלים (794×1123) הזיזו את גוף ה-DP ב-0.3px ויצרו MediaBox שאינו זהה
  // לגיאומטריית המורשת (793.7×1122.5). כעת זהה ל-GEO של legacy-imud-flow.
  // **S6.0:** הערכים בפועל ללא עיגול — 793.70×1122.52 (הערת O14 טענה
  // זהות ל-GEO אך הקוד עיגל ל-794×1123 — ההערה לא יושמה מעולם).
  A4: { w: 210 * MM_TO_PX, h: 297 * MM_TO_PX },
  A5: { w: Math.round(148 * MM_TO_PX), h: Math.round(210 * MM_TO_PX) },
  '16x16': { w: Math.round(165 * MM_TO_PX), h: Math.round(165 * MM_TO_PX) }
};

/**
 * חישוב תבנית עמוד לפי סוג + הגדרות. מחזיר rectPx לשימוש DP.
 * @param {string} type
 * @param {object} settings
 * @param {boolean} isRecto
 */
// **שלב ההעברה למנוע המאוחד — מקטע 1 (גאומטריית עמוד וטורים):**
// כשפרופיל IMUD פעיל (הגדרות שמקורן ב-default_settings.json של התוכנה
// המקורית — importImudSettings מסמן _layout-profile='imud' ומצרף _imudRaw),
// הגריד נבנה **מהחוזה המכויל מהייחוס** (core/imud-geometry.js) ולא מהאחוזים
// הגנריים. הפער שתוקן (דוח חקירת האתר החי 19.11, ג.10): האחוזים הגנריים
// (grid-col-width-pct=40% מהתוכן) ייצרו חור מרכזי של 134.9px בין הטורים,
// מול מרזב 13.48px במקור; שוליים של 7.5% מול 120.72px (15.2%) במקור.
// לא ערכי קסם: המקור הוא החוזה המשותף ששני המנועים צורכים.
const {
  GEO, FLOW_BOTTOM, SINGLE_W, H0_AREA_H, H2_AREA_H, H2_SPAN_AREA_H, H2_TITLE_LINE_PITCH_PX, TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM
} = require('../core/imud-geometry');
const { RUNNING_HEAD_TOP_INSET_PX } = require('./furniture-geometry');

function isImudProfile(settings) {
  return !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
}

/** תבנית עמוד מהחוזה המכויל של IMUD — אותה גאומטריה שהמורשת מייצרת. */
function buildImudPageTemplate(type, settings, isRecto, opts = {}) {
  const twoCol = !( [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB,
    PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL,
    PAGE_TYPES.CUSTOM, PAGE_TYPES.FILLER].includes(type) );
  const binding = Number(settings['binding-offset-px']) || 0;
  const columns = twoCol
    ? [
        { x: GEO.COL_R_X + (isRecto ? binding : -binding), w: GEO.COL_W }, // ימין קודם (RTL)
        { x: GEO.COL_L_X + (isRecto ? binding : -binding), w: GEO.COL_W }
      ]
    : [ { x: GEO.COL_L_X, w: SINGLE_W } ]; // טור רחב — 2×269.41+13.48 (grid)
  const gutter = GEO.COL_R_X - (GEO.COL_L_X + GEO.COL_W); // 13.48
  // תחתית הזרימה קבועה מהחוזה; הפוליו מתחתיה (baseline 1054.5 — מקטע 3)
  // **Iteration-003 (legacy parity — שטח הכותרות המכויל):** עמוד פתיחת-סימן
  // שומר את אזור ה-h2 המלא (H2_AREA_H — flowSection של המורשת: הסימן והכותרת
  // חיים בתוכו, הטורים מתחילים מתחתיו); עמוד הקדמה שומר את אזור ה-h0.
  // עד כאן 180px בלבד — הגוף עלה גבוה מדי והכותרת נדחקה לטור.
  // **G3/RC-3 (i004):** פתיחה עם h3-span ⇒ האזור המוקצץ של המורשת (S4.19: 261.3 מעמ' 11 ביחוס;
  // 284.25 בפתיחה רגילה — עמ' 24/38) — הטורים מתחילים 22.95px גבוה יותר
  // ושורת-תוכן נוספת נכנסת בעמודים אלה.
  const h2Area = (opts && opts.h2SpanExempt) ? H2_SPAN_AREA_H : H2_AREA_H;
  // **Iteration-006 (G3/RC-C1 — שורות כותרת-h2 עטופות דוחפות את ראש הזרימה):**
  // כל שורה עטופה מעבר לראשונה מורידה את textTop בפס שלה (H2_TITLE_LINE_PITCH_PX)
  // — הרווח התחתון המוגדר של האזור נשמר, כמו flowSection של המורשת
  // (top = FLOW_TOP + areaH + (h2Lines−1)×30; הוכחת ייחוס p278 — ראו שם).
  // ברירת המחדל 0 — כותרת חד-שורתית אינה מושפעת (rc3 נשאר תקף).
  const h2ExtraLines = type === PAGE_TYPES.SIGN_OPEN ? Math.max(0, Math.floor((opts && opts.h2ExtraLines) || 0)) : 0;
  const h2ExtraPx = h2ExtraLines * H2_TITLE_LINE_PITCH_PX;
  const textTop = type === PAGE_TYPES.SIGN_OPEN
    ? GEO.FLOW_TOP + h2Area + h2ExtraPx
    : (type === PAGE_TYPES.PREFACE ? GEO.FLOW_TOP + H0_AREA_H : GEO.FLOW_TOP);
  return {
    type, isRecto, imud: true,
    width: GEO.PAGE_W, height: GEO.PAGE_H,
    margins: { top: GEO.FLOW_TOP, bottom: GEO.PAGE_H - FLOW_BOTTOM, side: GEO.COL_L_X, outer: GEO.PAGE_W - (GEO.COL_R_X + GEO.COL_W) },
    columns, gutter,
    headerHeight: GEO.HEADER_BASELINE,   // פס הכותרת: גליפים 42.56–57.56pt (גאומטריית הפס; התוכן — מקטע 3)
    headerTop: GEO.FLOW_TOP - RUNNING_HEAD_TOP_INSET_PX,
    folioHeight: GEO.PAGE_H - GEO.FOLIO_BASELINE,
    h2TopOffset: type === PAGE_TYPES.SIGN_OPEN ? h2Area + h2ExtraPx : (type === PAGE_TYPES.PREFACE ? H0_AREA_H : 0),
    h2SpanExempt: type === PAGE_TYPES.SIGN_OPEN ? !!(opts && opts.h2SpanExempt) : false,
    h2ExtraLines,
    contentBox: { top: textTop, bottom: FLOW_BOTTOM, height: FLOW_BOTTOM - textTop },
    numbered: true,
    counts: true,
    hasRunningHead: [PAGE_TYPES.REGULAR, PAGE_TYPES.SIGN_OPEN, PAGE_TYPES.H3_SPREAD,
      PAGE_TYPES.PREFACE, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL].includes(type)
  };
}

function buildPageTemplate(type, settings, isRecto = true, opts = {}) {
  // **מקטע 1:** פרופיל IMUD ⇒ החוזה המכויל (לא הגריד הגנרי). הנתיב הלא-IMUD
  // (קורפוס ה-DP הכללי) אינו משתנה כלל — אותן נוסחאות אחוזים כמו קודם.
  // **G3/RC-3 (i004):** opts מועבר הלאה — h2SpanExempt של פתיחות-סימן (עד כאן
  // המעטפת בלעה אותו והתבנית חזרה תמיד לאזור הרגיל).
  if (isImudProfile(settings)) return buildImudPageTemplate(type, settings, isRecto, opts);
  const size = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  const marginSide = size.w * settings['grid-margin-side-pct'] / 100;
  const binding = settings['binding-offset-px'] || 0;
  const marginTop = settings['margin-top-px'];
  const marginBottom = Math.max(settings['margin-bottom-px'], marginTop); // תחתון רחב מהעליון (BRZ B1)
  const outerMargin = marginSide + (isRecto ? binding : -binding);

  const contentW = size.w - 2 * marginSide - (isRecto ? binding : -binding);
  const singleCol = [PAGE_TYPES.PREFACE, PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.CUSTOM, PAGE_TYPES.FILLER].includes(type);
  const gutter = size.w * settings['grid-gutter-pct'] / 100;

  let colWidths;
  if (singleCol) colWidths = [contentW];
  else {
    const cw = contentW * settings['grid-col-width-pct'] / 100;
    colWidths = [cw, cw]; // ימני+שמאלי; המרזב במרכז
  }

  const headerH = (type === PAGE_TYPES.REGULAR || type === PAGE_TYPES.SIGN_OPEN || type === PAGE_TYPES.H3_SPREAD) && settings['header-enabled'] ? Math.round(settings['body-font-size-pt'] * 1.6 * 96 / 72) : 0;
  const folioH = settings['page-num-position'] !== 'none' && !singleCol ? Math.round(settings['body-font-size-pt'] * 1.4 * 96 / 72) : 0;

  const textTop = marginTop + headerH + (type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0);
  const textBottom = size.h - marginBottom - folioH;
  // ריהוט העמוד מקבל עוגן עצמאי; h2-top-offset מזיז את הגוף בלבד.
  const headerTop = marginTop + headerH - RUNNING_HEAD_TOP_INSET_PX;

  return {
    type, isRecto,
    width: size.w, height: size.h,
    margins: { top: marginTop, bottom: marginBottom, side: marginSide, outer: outerMargin },
    columns: singleCol ? [{ x: marginSide, w: contentW }] : [
      { x: marginSide + contentW - colWidths[0], w: colWidths[0] }, // ימין קודם (RTL)
      { x: marginSide, w: colWidths[1] }
    ],
    gutter,
    headerHeight: headerH,
    headerTop,
    folioHeight: folioH,
    // **S8:** אזור העיטורים שמעל תיבת התוכן (אזור h2-top-offset) — מסומן במפורש
    // כך שאודיט עיטורים יודע מה חוקי (עיטור H2 עליון חי באזור זה — לא גלישה).
    h2TopOffset: type === PAGE_TYPES.SIGN_OPEN ? settings['h2-top-offset'] : 0,
    contentBox: { top: textTop, bottom: textBottom, height: Math.max(0, textBottom - textTop) },
    numbered: ![PAGE_TYPES.SHAAR_MAIN, PAGE_TYPES.SHAAR_SUB, PAGE_TYPES.SHAAR_BACK, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL, PAGE_TYPES.FILLER].includes(type)
      ? true : (type.startsWith('shaar') ? settings['count-shaar-pages'] : settings['count-toc-pages']),
    counts: ![PAGE_TYPES.FILLER].includes(type),
    // **03.11(ד):** עמודי תוכן־העניינים מציגים כותרת עליונה כמו המקור
    // (renderPaginatedTOC של המקור מרנדר top-header-grid בכל עמודי התוכן).
    hasRunningHead: [PAGE_TYPES.REGULAR, PAGE_TYPES.SIGN_OPEN, PAGE_TYPES.H3_SPREAD, PAGE_TYPES.PREFACE, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL].includes(type),
  };
}

module.exports = { PAGE_TYPES, PAGE_SIZES, buildPageTemplate, buildImudPageTemplate, isImudProfile, MM_TO_PX };
