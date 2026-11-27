// src/engine/output/svg-raster.js — ריסטוריזציית עיצובי SVG עשירים לייצוא PDF (תיקון DOM≠PDF בשערים)
'use strict';

/**
 * **שורש התקלה (דיווח משתמש: "השערים ב-DOM שחורים, ב-PDF אפורים"):**
 * עיצובי השערים המקוריים (shaar_main/sub/back) בנויים מ-<use>/<defs>/
 * <pattern>/strokes/#-transformים מקוננים — הרחק מעבר לתת-הקבוצה שמפענח
 * הנתיב הווקטורי (ornament-ink: מילוי בלבד, ללא use/defs). הדיו הכהה של
 * השערים חי בעיקר ב-strokes (#333/#222) ובהגדרות-defs — שניהם נשמטים
 * בפענוח הווקטורי, וב-PDF נותרים רק המילויים האפורים הבהירים. הדפדפן
 * (DOM) מציג את ה-SVG במלואו — מכאן הפער השיטתי.
 *
 * **הפתרון — מקור יחיד, בלי מנוע SVG שני:** את אותו ה-SVG בדיוק שה-DOM
 * מציג (ink.svg מהמודל) מרסטרים פעם אחת בזמן הייצוא — באמצעות מרכיבי
 * הדפדפן המובנים ב-Worker (OffscreenCanvas + createImageBitmap — אותו
 * מנוע רינדור שה-DOM משתמש בו) — ומטמיעים את התוצאה ב-PDF כתמונת
 * JPEG (XObject). DOM ו-PDF מציגים את אותו דיו — זהות חזותית מלאה.
 *
 * דטרמיניזם: אותו SVG + אותו יעד ⇒ אותם בתים (ריסטוריזציית canvas
 * דטרמיניסטית בגרסת דפדפן נתונה). בסביבה ללא OffscreenCanvas (Node) —
 * מפה ריקה והנתיב הווקטורי הקיים נשאר כמו שהו (מתועד; אין נפילה שקטה
 * למנגנון אחר — העיטור פשוט ממשיך להיות מוקרן וקטורית כמו קודם).
 */

/** האם ל-SVG יש רכיבים מעבר לתת-הקבוצה הווקטורית הנתמכת.
 * שימת לב: זיהוי שמרני — רק כשברור שהפענוח הווקטורי חלקי. */
function svgNeedsRaster(svg) {
  const s = String(svg || '');
  if (!s) return false;
  if (/<use[\s>]/i.test(s)) return true;          // הפניות defs — לא נתמכות
  if (/<pattern[\s>]/i.test(s)) return true;      // מילויי דפוס — לא נתמכים
  // stroke אמיתי על אלמנט צורה (לא stroke="none") — נשמט בפענוח המילוי-בלבד
  if (/<(?:path|rect|circle|ellipse|polyline|polygon|g)\b[^>]*\bstroke\s*=\s*"(?!none)[^"]*"/i.test(s)) return true;
  return false;
}

/** ריסטוריזציה של SVG ל-JPEG בגודל היעד (יחס היעד = תיבת העיטור בעמוד).
 * meet (contain) במרכז, רקע לבן — בדיוק כמו ה-DOM (background-size:contain
 * על עמוד לבן; שוליים שקופים ב-DOM נראים לבנים על העמוד — כאן נצבעים לבן).
 * @returns {Promise<{jpeg:Uint8Array,w:number,h:number}|null} */
async function rasterSvgToJpeg(svg, outW, outH) {
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') return null;
  const W = Math.max(1, Math.round(outW)), H = Math.max(1, Math.round(outH));
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  let bmp = null;
  try {
    bmp = await createImageBitmap(blob);
  } catch (e) {
    return null; // SVG שהדפדפן אינו מפענח — נשאר הנתיב הווקטורי (מתועד)
  }
  try {
    const canvas = new OffscreenCanvas(W, H);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    // meet: סקייל אחיד מרבי שנכנס, ממורכז — זהה ל-svgToPdfOps ול-DOM
    const s = Math.min(W / bmp.width, H / bmp.height);
    const dw = bmp.width * s, dh = bmp.height * s;
    ctx.drawImage(bmp, (W - dw) / 2, (H - dh) / 2, dw, dh);
    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 });
    if (!outBlob) return null;
    const buf = await outBlob.arrayBuffer();
    return { jpeg: new Uint8Array(buf), w: W, h: H };
  } catch (e) {
    return null;
  } finally {
    if (bmp && typeof bmp.close === 'function') bmp.close();
  }
}

/** עבור כל עיטורי ה-SVG העשירים במודל — ריסטוריזציה לפי תיבת העיטור.
 * מפתח: `p<pageIndex>#<decorationIndex>` — יציב בין המיפוי ב-export לציור.
 * @param {object} model — PageModel (לקריאה בלבד; אין שינוי — המודל קפוא)
 * @param {{scale?:number}} opts — scale: רזולוציית יתר (ברירת מחדל 2 — חדות רטינה)
 * @returns {Promise<Map<string,{jpeg:Uint8Array,w:number,h:number}>>} */
async function rasterizeModelDecorations(model, opts = {}) {
  const scale = Number(opts.scale) > 0 ? Number(opts.scale) : 2;
  const out = new Map();
  if (!model || !Array.isArray(model.pages)) return out;
  if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') return out;
  for (const page of model.pages) {
    const decos = (page && Array.isArray(page.decorations)) ? page.decorations : [];
    for (let i = 0; i < decos.length; i++) {
      const d = decos[i];
      const ink = d && d.ink;
      if (!ink || ink.type !== 'svg' || !ink.svg) continue;
      if (!svgNeedsRaster(ink.svg)) continue;
      // תיבת היעד: ה-rect של העיטור בעמוד (px) — כפי שה-DOM מציב אותו
      const w = Number(d.w), h = Number(d.h);
      if (!(w > 0) || !(h > 0)) continue;
      const r = await rasterSvgToJpeg(ink.svg, w * scale, h * scale);
      if (r) out.set(`p${page.index}#${i}`, r);
    }
  }
  return out;
}

module.exports = { svgNeedsRaster, rasterSvgToJpeg, rasterizeModelDecorations };
