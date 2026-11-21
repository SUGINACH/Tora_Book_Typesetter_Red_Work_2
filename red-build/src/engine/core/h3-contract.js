'use strict';

/**
 * **חוזה גאומטריית כותרת 3 — מקור יחיד (D-S2H3/CSS parity, 17.11):**
 * ה-CSS המקורי של המוצר (ערכות Orange/Yellow/Green) קובע:
 *
 *   .h3-title-text { line-height: 1.22 }
 *   .block-h3-span { padding: 8px 0 4px; margin-bottom: 4px }
 *
 * כלומר, לכותרת 3 המוצגת כפס (span):
 *  - pitch בין שורות הכותרת = line-height הטקסט בלבד (גודל×96/72×1.22).
 *  - ריפוד עליון 8px — פעם אחת, לפני השורה הראשונה.
 *  - ריפוד תחתון 4px + שוליים תחתונים 4px — פעם אחת, אחרי השורה האחרונה.
 *  - כותרת חד-שורתית: גובה כולל 8+21.96+4+4 ≈ 38px (כיוול S4.14 נשמר).
 *
 * הערכים חיים כאן — מקור אחד לשני המנועים: המורשת
 * (layout/legacy-imud-flow.js) והמאוחד (core/pipeline.js במדידה +
 * layout/dp-planner.js בבניית הפס). אסור להגדיר אותם מחדש במודולים אחרים;
 * שינוי חוזה — רק כאן, עם עדכון בדיקות הקבלה (s2-heading3-spacing).
 */

const H3_LINE_HEIGHT = 1.22;      // line-height יחסי של שורת כותרת 3
const H3_TOP_PAD_PX = 8;          // padding-top — פעם אחת לפני השורה הראשונה
const H3_BOTTOM_PAD_PX = 4;       // padding-bottom — פעם אחת אחרי השורה האחרונה
const H3_MARGIN_BOTTOM_PX = 4;    // margin-bottom — פעם אחת אחרי ריפוד התחתית

/** **Legacy parity (iteration-001):** מקום מינימלי לתוכן עוקב מתחת לפס H3
 *  בדיקת "האם הפס נשאר באותו עמוד" (span_1col של המקור, S4.13/S4.24;
 *  S74 בעיה 6: 60−38 הישן — מנע אלמנות כותרת). הסף הכולל:
 *  max(60, bandHeight + H3_FOLLOW_MIN_PX). מקור אחד לשני המנועים. */
const H3_FOLLOW_MIN_PX = 22;

/** סף הכניסה של פס H3 באמצע עמוד — נאמן ל-span_1col של המקור. */
function h3BandRoomThresholdPx(bandHeightPx) {
  return Math.max(60, bandHeightPx + H3_FOLLOW_MIN_PX);
}

/** גובה שורת כותרת 3 בפיקסלים (pitch בין-שורתי) לפי גודל הכותרת בנקודות. */
function h3LineHeightPx(sizePt) {
  return sizePt * (96 / 72) * H3_LINE_HEIGHT;
}

/** גובה תיבת הפס כולה: ריפוד עליון + שורות + ריפוד תחתון + שוליים תחתונים. */
function h3BandHeightPx(linesHeightPx) {
  return H3_TOP_PAD_PX + linesHeightPx + H3_BOTTOM_PAD_PX + H3_MARGIN_BOTTOM_PX;
}

module.exports = {
  H3_LINE_HEIGHT,
  H3_TOP_PAD_PX,
  H3_BOTTOM_PAD_PX,
  H3_MARGIN_BOTTOM_PX,
  H3_FOLLOW_MIN_PX,
  h3LineHeightPx,
  h3BandHeightPx,
  h3BandRoomThresholdPx
};
