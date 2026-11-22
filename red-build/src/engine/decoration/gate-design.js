// src/engine/decoration/gate-design.js — עיצוב שערים מכויל + כלל כותרת עליונה
'use strict';

/**
 * **Iteration-003 (legacy parity — D-89 "אין שערים"):** פורט ברירות-המחדל
 * של המקור (decorations.js/style.css של IMUD_TORANI), מכויל מהייחוס —
 * אותם ה-rectים שהמורשת פולטת בסוף ההרצה (legacy-imud-flow §3658-3704):
 *  - שער-משנה: פאנל #F4F4F4 מ-55% עד קצה ימין + גל עיטור בין הכותרת
 *    לכותרת-המשנה (עוגן subTop−40.8 — יחס מכויל; במרכז תיבת התוכן).
 *  - שער אחורי: פאנל #F4F4F4 משמאל עד 45%.
 *  - שער ראשי: שלד המסגרת — קווים אנכיים #CCCCCC, פסים #FAFAFA, שרשרת
 *    עלים בשולי הפאנלים, כללים אופקיים בשוליים בלבד, עיטור העיגול+כנפיים
 *    מתחת לנושא ושני כללי מהדורה.
 *  - כלל כותרה תחתון בכל עמוד עם כותרת עליונה (חוץ משערים): מלבן
 *    #F0F0F0 (hdr-divider-style='gray' — ברירת המחדל של המקור).
 *
 * טוהר: overlay בלבד — לא נוגע בשורות גוף (גיאומטריה נייטרלית, דפוס D-47).
 * מיקום הגל נקרא מהחותמת (page.shaarLayout) — מקור יחיד לגיאומטריית השער.
 */

const { GEO } = require('../core/imud-geometry');

/** עיצוב השערים לעמוד בודד — מחזיר מערך decorations (אפס אם לא רלוונטי).
 * **היקף:** פרופיל IMUD בלבד — חוזה העיטורים של התוכנה המקורית (D-89);
 * בפרופיל DP אין עיצוב שערים ואין כלל כותרת (כפי שננעל בקורפוסים). */
function planGateDesign(page, settings) {
  if (!page || !page.type) return [];
  if (!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw))) return [];
  const out = [];
  const dec = (o) => out.push(o);
  const raw = (settings && settings._imudRaw) || {};
  const hdrDivider = settings && settings['hdr-divider-style'] != null
    ? settings['hdr-divider-style'] : (raw['hdr-divider-style'] != null ? raw['hdr-divider-style'] : 'gray');

  if (page.type === 'shaar-sub') {
    dec({ x: 0.55 * GEO.PAGE_W, y: 0, w: 0.45 * GEO.PAGE_W, h: GEO.PAGE_H, kind: 'shaar-panel', kindStyle: 'rect:#F4F4F4' });
    // הגל בין שני חלקי הכותרת — מעוגן לראש כותרת-המשנה בפועל (subTop−40.8),
    // ממורכז בתיבת התוכן (175.7px — מרכז 245.7−140/2 בכיול הייחוס).
    const subBlock = page.shaarLayout
      && page.shaarLayout.blocks.find(b => String(b.cls || '').includes('book-subtitle'));
    if (subBlock) {
      const style = raw['shaar-sub-divider'] && raw['shaar-sub-divider'] !== 'none'
        ? (String(raw['shaar-sub-divider']).startsWith('ext_') || String(raw['shaar-sub-divider']).endsWith('.svg')
          ? 'imud:divider:' + raw['shaar-sub-divider'] : raw['shaar-sub-divider'])
        : 'shaar-wave';
      dec({ x: 175.7, y: subBlock.yTop - 40.8, w: 140, h: 25, kind: 'shaar-divider', kindStyle: style });
    }
  } else if (page.type === 'shaar-back') {
    dec({ x: 0, y: 0, w: 0.45 * GEO.PAGE_W, h: GEO.PAGE_H, kind: 'shaar-panel', kindStyle: 'rect:#F4F4F4' });
  } else if (page.type === 'shaar-main') {
    dec({ x: 96, y: 0, w: 1.33, h: GEO.PAGE_H, kind: 'frame-v', kindStyle: 'rect:#CCCCCC' });
    dec({ x: 697.33, y: 0, w: 1.33, h: GEO.PAGE_H, kind: 'frame-v', kindStyle: 'rect:#CCCCCC' });
    dec({ x: 97.33, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-band', kindStyle: 'rect:#FAFAFA' });
    dec({ x: 668, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-band', kindStyle: 'rect:#FAFAFA' });
    dec({ x: 97.33, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-chain', kindStyle: 'shaar-frame-chain' });
    dec({ x: 668, y: 0, w: 29.33, h: GEO.PAGE_H, kind: 'frame-chain', kindStyle: 'shaar-frame-chain' });
    // כללים אופקיים בשוליים בלבד (מלבן לבן מכסה את המרכז במקור — קטעים)
    dec({ x: 0, y: 224, w: 96, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
    dec({ x: 697.33, y: 224, w: GEO.PAGE_W - 697.33, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
    dec({ x: 0, y: 898.67, w: 96, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
    dec({ x: 697.33, y: 898.67, w: GEO.PAGE_W - 697.33, h: 1.33, kind: 'frame-h', kindStyle: 'rect:#D1D1D1' });
    // עיטור השער הראשי המובנה (עיגול+כנפיים) מתחת לנושא
    dec({ x: 306.6, y: 346, w: 180, h: 24, kind: 'shaar-ornament', kindStyle: 'shaar-main-orn' });
    // שני כללים אפורים קטנים סביב שורת המהדורה
    dec({ x: 308.7, y: 734, w: 176, h: 0.93, kind: 'edition-rule', kindStyle: 'rect:#CCCCCC' });
    dec({ x: 308.7, y: 770, w: 176, h: 0.93, kind: 'edition-rule', kindStyle: 'rect:#CCCCCC' });
  } else if (hdrDivider !== 'none' && page.header && page.header.slots
    && (page.header.slots.right || page.header.slots.center || page.header.slots.left)) {
    // כלל הכותרת — צבע לפי hdrDividerColorMap של המקור: gray ⇒ #F0F0F0
    const hdrRuleStyle = hdrDivider === 'gray' ? 'rect:#F0F0F0' : 'rect:#000000';
    dec({ x: 57.33, y: 82.67, w: 680, h: 1.33, kind: 'hdr-rule', kindStyle: hdrRuleStyle });
  }
  return out;
}

module.exports = { planGateDesign };
