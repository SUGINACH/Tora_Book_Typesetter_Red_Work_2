// src/engine/layout/furniture-geometry.js — גיאומטריית ריהוט עמוד ממקור יחיד (שלב 6 פרוסה 1)
'use strict';

/**
 * **מעמד (הוראת שלב 6 §8):** "כותרות עליונות, תחתונות ומספרי עמוד יהיו Page
 * Items בעלי placement model אחיד; **אין לחשב את מיקומם בנפרד ב-DOM וב-PDF**."
 *
 * עד כאן המקרן ל-PDF חישב את תיבת הגיליון והבסיס במתמטיקה מפורשת
 * (FOLIO_BOTTOM_PX=25, half-leading, ascent) בעוד ה-DOM הסתמך על CSS חי
 * (.folio{bottom:25px} וכו') שכויל להתאים בעבר (S69/S5.1) — שני מקורות
 * של אותה גיאומטריה שכל אחד מהם יכול לסטות בשקט. מעתה שני המקרינים
 * קוראים מכאן: המקרן מציב את המספרים כמות שהם; ה-DOM מציב אותם כסגנון
 * מפורש (top/lineHeight) לצד ה-class הקיים שנשאר אחראי לעור (מסגרת/צבע).
 */

/** תחתית תיבת הגיליון מה-CSS החי (styles.css: .folio{bottom:25px}) — קבוע המקור. */
const FOLIO_BOTTOM_PX = 25;
/** ראש תיבת גיליון במצב top (styles.css: .folio--top{top:4px}). */
const FOLIO_TOP_PX = 4;
/** ראש תיבת גיליון בתוך הכותרת העליונה (styles.css: .folio--in-header{top:6px}). */
const FOLIO_IN_HEADER_PX = 6;
/** מרחק תיבת הכותרת העליונה מעל ראשית זרימת התוכן — קבוע משותף לתבניות. */
const RUNNING_HEAD_TOP_INSET_PX = 18;

/**
 * גיאומטריית הגיליון — מחושבת פעם אחת מאותם קלטים ששני המקרינים צורכים.
 * @param {object} page — עמוד (index, folioDisplay, template)
 * @param {object} settings
 * @param {{measureTextWidth:(t:string,pt:number)=>number, ascentEm:()=>number, descentEm:()=>number}} folioMeasure
 *   מדידת הגיליון (גופן הגיליון כשרשום — אותו מופע שהמקרן בונה)
 * @returns {null|{y, baselineY, x, w, sizePt, text, lineHeightPx, position}}
 */
function folioGeometry(page, settings, folioMeasure) {
  const pos = String((settings && settings['page-num-position']) || 'bottom-center');
  if (pos === 'none' || !page || !page.folioDisplay) return null;
  const tpl = page.template;
  const text = String(page.folioDisplay);
  const folioSz = Number(settings['page-num-size-pt']) > 0 ? Number(settings['page-num-size-pt']) : 10;
  const fw = Math.max(1, Math.round(folioMeasure.measureTextWidth(text, folioSz)));
  const folioPx = folioSz * (96 / 72);
  // line-height: normal ≈ 1.2 (חסר הגדרה מפורשת ב-CSS לגיליון) — הנוסחה ההיסטורית
  const folioLineH = Math.round(folioPx * 1.2);
  const ascEm = folioMeasure.ascentEm(), descEm = folioMeasure.descentEm();
  const halfLead = Math.max(0, (folioLineH - (ascEm + descEm) * folioPx) / 2);
  const recto = (page.index % 2 === 0);
  let fx = Math.round((tpl.width - fw) / 2);
  let boxTop = tpl.height - FOLIO_BOTTOM_PX - folioLineH;
  let baselineY = boxTop + halfLead + ascEm * folioPx;
  if (pos === 'outer-left' || (pos === 'outer' && recto)) fx = 8;
  else if (pos === 'outer-right' || (pos === 'outer' && !recto)) fx = Math.max(8, Math.round(tpl.width - fw - 8));
  else if (pos === 'top') { boxTop = FOLIO_TOP_PX; baselineY = boxTop + halfLead + ascEm * folioPx; }
  else if (pos === 'in-header') { boxTop = FOLIO_IN_HEADER_PX; baselineY = boxTop + halfLead + ascEm * folioPx; }
  return {
    y: boxTop, baselineY, x: fx, w: fw, sizePt: folioSz, text,
    lineHeightPx: folioLineH, position: pos
  };
}

/**
 * מיקום תיבת הכותרת העליונה — נקבע ב-PageTemplate בנפרד מ-contentBox.
 * היסטים של גוף התוכן (למשל h2-top-offset בעמוד sign-open) אינם מזיזים ריהוט.
 */
function headerGeometry(page) {
  const tpl = page && page.template;
  if (!tpl || !Number.isFinite(tpl.headerTop)) {
    throw new TypeError('PageTemplate.headerTop must be a finite page-space coordinate');
  }
  return { y: Math.max(0, tpl.headerTop) };
}

module.exports = {
  FOLIO_BOTTOM_PX, FOLIO_TOP_PX, FOLIO_IN_HEADER_PX, RUNNING_HEAD_TOP_INSET_PX,
  folioGeometry, headerGeometry
};
