// src/engine/output/shaar-content.js — מודל תוכן עמודי השער (03.11(ד))
'use strict';

/**
 * **מקור יחיד (F-09) לתוכן המובנה של עמודי השער** — פורט renderMainShaar/
 * renderSubShaar/renderBackShaar של הפרויקט המקורי. נצרך על ידי שני הנתיבים:
 * dom-renderer (תצוגה חיה + ייצוא HTML) ו-geometry-projector (ייצוא PDF) —
 * כך שהשער נראה אותו דבר בכל הפלטים (עד כאן ההיטל לא כלל את תוכן השער
 * וה־PDF הראה עמודים ריקים).
 *
 * **Iteration-003 (legacy parity — חוזה השערים של המקור):**
 *  - מקור התוכן של השער הראשי = המטא-דאטה של המסמך (כמו gateLinesFor במורשת:
 *    meta.bookTitle/subject/desc/edition/author). הגדרות imud-book-* הן שדות
 *    טופס שברירת המחדל שלהן ב-default_settings.json היא שמות מקום — הן
 *    גיבוי בלבד כשאין מטא. השער האחורי — להפך (שדות הפאנל קודם, מטא ממלא —
 *    כמו cfg.backCopyright || meta.copyright במורשת).
 *  - מיקומים אנכיים מכוילים מהייחוס (px@96dpi; המקור במ"מ — pt(v)=v×4/3):
 *    ראשי — כותרת 170.8, משנה 300.3, תיאור 547.1, מהדורה 744.0, מחבר 951.3;
 *    אחורי — כותרת-זכויות 255.7, זכויות 288.5, הוצאה 476.4, קשר 667.9,
 *    נוספים 859.1; משנה — כותרת 460.9, המשך 626.3.
 *  - גודל כותרת שער-המשנה = s-h1 (heading-1-size-pt, 50pt במקור) — לא 36
 *    קבוע. גופן ההמשך של שער-המשנה = David Libre (כמו ההקשחה המכוילת
 *    במורשת — הייחוס מציג אותו, לא את f-sh-sub).
 *  - אין בס״ד/שנה בשער הראשי ואין כתרים גרפיים — העיטורים הם רקע השער
 *    המכויל (decoration/gate-design.js) כמו במקור.
 */

const MM_TO_PX = 96 / 25.4;
const PT = (v) => v * (96 / 72); // "mm-ish" units of the legacy calibration → px

/** תיבת השער לפי הסוג — מיקומי המקור (מ"מ → פיקסלים). */
function shaarBoxOf(type, settings) {
  const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
  const mode = imudProf ? 'fixed' : null;
  const mm = (v) => Math.round(v * MM_TO_PX);
  if (type === 'shaar-main') {
    return { top: mm(20), bottom: mm(16), right: mm(15), left: mm(15), mode: mode || 'between' };
  }
  if (type === 'shaar-sub') {
    return { top: mm(20), bottom: mm(20), right: mm(95), left: mm(15), mode: mode || 'center' };
  }
  // shaar-back
  return { top: mm(22), bottom: mm(18), right: mm(15), left: mm(95), mode: mode || 'center' };
}

/** פיצול מקף של כותרת חלק (renderSubShaar המקורי): main=לפני, sub=אחרי. */
function splitPartTitle(text) {
  let titleMain = String(text || '');
  let titleSub = '';
  if (/[-–—]/.test(titleMain)) {
    const parts = titleMain.split(/[-–—]/);
    titleMain = parts[0].trim();
    titleSub = parts.slice(1).join(' - ').trim();
  }
  return { titleMain, titleSub };
}

/**
 * בניית בלוקי תוכן השער. גישה מילולית להגדרות (דרישת סורק ה-phantom-key).
 * @param {object} page - עמוד CP5 (shaarInfo.title לשער־משנה, _metadata למטא)
 * @param {object} settings
 * @param {object} [metadata] - מטא המסמך (גובר _metadata)
 * @returns {{mode:string, box:object, blocks:Array<{cls,text,sizePt,bold,yTop,followGap?,fontFamily?}>}|null}
 */
function buildShaarBlocks(page, settings, metadata) {
  if (!page || !page.type || !/^shaar-/.test(page.type)) return null;
  const meta = metadata || page._metadata || {};
  const num = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 12; };
  const box = shaarBoxOf(page.type, settings);
  const B = [];

  if (page.type === 'shaar-main') {
    // **Iteration-003:** מקור התוכן = המטא של המסמך (כמו המורשת); ההגדרות גיבוי.
    const bookTitle = meta['שם הספר'] || meta['ספר'] || meta['title'] || settings['imud-book-title'] || 'שם הספר';
    const subtitle = meta['נושא'] || settings['imud-book-subtitle'] || '';
    const desc = meta['נושא מפורט'] || settings['imud-book-desc'] || '';
    const sections = meta['פרטי מהדורא'] || settings['imud-book-sections'] || '';
    const author = meta['שם המחבר'] || settings['imud-book-author'] || '';
    // **Iteration-003 (legacy parity):** בס״ד/שורת-שנה — תכונת פרופיל DP בלבד.
    // שער ה-IMUD של המקור אינו מציג אף אחד מהם (נמדד בייחוס עמ' 1: חמש
    // שורות בלבד — כותרת/נושא/תיאור/מהדורה/מחבר).
    const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
    if (!imudProf) {
      B.push({ cls: 'bsd-header', text: 'בס״ד', sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 5 });
    }
    B.push({ cls: 'book-title-main', text: bookTitle, sizePt: num(settings['shaar-title-size-pt']), ...(imudProf ? { yTop: PT(128.1) } : {}) });
    B.push({ cls: 'book-subtitle', text: subtitle, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true, ...(imudProf ? { yTop: PT(225.2), followGap: 25 } : {}) });
    if (!imudProf) {
      B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-main' });
    }
    B.push({ cls: 'book-description', text: desc, sizePt: num(settings['shaar-desc-size-pt']), ...(imudProf ? { yTop: PT(410.3) } : {}) });
    B.push({ cls: 'book-sections-summary', text: sections, sizePt: num(settings['shaar-sections-size-pt']), bold: true, ...(imudProf ? { yTop: PT(558.0) } : {}) });
    B.push({ cls: 'author-block', text: author, sizePt: num(settings['shaar-author-size-pt']), ...(imudProf ? { yTop: PT(713.5) } : {}) });
    if (!imudProf) {
      const year = settings['imud-book-year'] || meta['מקום ושנת הוצאה'] || '';
      if (year) B.push({ cls: 'publication-footer', text: year, sizePt: num(settings['shaar-year-size-pt']), bold: true, letterSpacingPx: 1 });
    }
  } else if (page.type === 'shaar-sub') {
    const { titleMain, titleSub } = splitPartTitle(page.shaarInfo && page.shaarInfo.title);
    const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
    if (imudProf) {
      // **Iteration-003:** גודל הכותרת מההגדרות (s-h1 ⇒ heading-1-size-pt; 50 במקור)
      const h1Size = num(settings['heading-1-size-pt']);
      B.push({ cls: 'book-title-main', text: titleMain, sizePt: h1Size, yTop: PT(345.7) });
      if (titleSub) {
        // ההמשך ב-David Libre המכויל (כמו ההקשחה במורשת — הייחוס בגופן זה)
        B.push({ cls: 'book-subtitle', text: titleSub, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true, yTop: PT(469.7), followGap: 40.8, fontFamily: 'David Libre' });
      }
    } else {
      B.push({ cls: 'book-title-main', text: titleMain, sizePt: 36 });
      if (titleSub) {
        B.push({ cls: 'shaar-crown', text: '', sizePt: 0, graphic: 'crown-sub' });
        B.push({ cls: 'book-subtitle', text: titleSub, sizePt: num(settings['shaar-subtitle-size-pt']), bold: true });
      }
    }
  } else {
    // **9b.5 (D-107 + F-9a-8):** ארבעת מקטעי השער האחורי — פורט renderBackShaar
    // של המקור. מקור הערך: שדה ההגדרה גובר (ייבוא inp-book-back-*;
    // shaar-back-text ההיסטורי לזכויות); נפילה למטא המסמך (כמו המורשת).
    // **אין כותרת-ספר/מחבר/שנה בשער האחורי** ו**אין ערכים מומצאים**.
    const copyright = settings['imud-book-back-copyright'] || settings['shaar-back-text'] || meta['שמירת זכויות'] || '';
    const publisher = settings['imud-book-back-publishing'] || meta['פרטי הוצאה לאור'] || '';
    const contact = settings['imud-book-back-contact'] || meta['פרטי קשר'] || '';
    const extra = settings['imud-book-back-extra'] || meta['פרטים נוספים'] || '';
    const imudProf = !!(settings && (settings['_layout-profile'] === 'imud' || settings._imudRaw));
    const pushSection = (value, sizePt, yTop) => {
      String(value).split('\n').map(l => l.trim()).filter(Boolean)
        .forEach(l => B.push({ cls: 'back-shaar-text-line', text: l, sizePt, ...(imudProf && yTop != null ? { yTop } : {}) }));
    };
    if (copyright) B.push({ cls: 'back-shaar-copyright-header', text: 'כל הזכויות שמורות', sizePt: 13.5, bold: true, ...(imudProf ? { yTop: PT(191.8) } : {}) });
    pushSection(copyright, 10, PT(216.4));
    pushSection(publisher, 11, PT(357.3));
    pushSection(contact, 10, PT(500.9));
    pushSection(extra, 9.5, PT(644.3));
  }
  return { mode: box.mode, box, blocks: B.filter(b => String(b.text || '').length || b.graphic) };
}

/** משפחות הגופן של הבלוקים — לפי ההגדרות (גישה מילולית לסורק). */
function shaarFontOf(cls, settings) {
  switch (true) {
    case cls.includes('bsd-header'):
    case cls.includes('publication-footer'): return settings['shaar-year-font'];
    case cls.includes('book-title-main'): return settings['shaar-title-font'];
    case cls.includes('book-subtitle'): return settings['shaar-subtitle-font'];
    case cls.includes('book-description'): return settings['shaar-desc-font'];
    case cls.includes('book-sections-summary'): return settings['shaar-sections-font'];
    case cls.includes('author-block'): return settings['shaar-author-font'];
    case cls.includes('back-shaar-copyright-header'):
    case cls.includes('back-shaar-text-line'): return settings['shaar-back-text-font'];
    default: return '';
  }
}

/** **פרוסה 3 (§2.2 — הדיו מגיע מהמודל):** SVG הכתרים של השערים — מקור יחיד.
 * הוסרו מהתוכן ב-Iteration-003: עיטורי השער באים מעיצוב השער המכויל
 * (decoration/gate-design.js) כמו במקור — לא כבלוק גרפי בזרימת התוכן.
 * נשמר לצרכנים חיצוניים קיימים (בדיקות/תאימות). */
function crownSvgOf(graphic) {
  if (graphic === 'crown-sub') {
    return '<svg viewBox="0 0 300 30" xmlns="http://www.w3.org/2000/svg"><path d="M10,15 Q75,5 140,15 Q145,10 150,5 Q155,10 160,15 Q225,5 290,15 Q225,25 160,15 Q155,20 150,25 Q145,20 140,15 Q75,25 10,15 Z" fill="#222"/></svg>';
  }
  return '<svg viewBox="0 0 400 40" xmlns="http://www.w3.org/2000/svg"><circle cx="200" cy="20" r="10" fill="none" stroke="#000" stroke-width="4.5"/><circle cx="200" cy="20" r="4.5" fill="#000"/><path d="M182,20 C182,24 165,27 140,27 C90,27 40,22 5,20 C40,18 90,13 140,13 C165,13 182,16 182,20 Z" fill="#000"/><path d="M218,20 C218,24 235,27 260,27 C310,27 360,22 395,20 C360,18 310,13 260,13 C235,13 218,16 218,20 Z" fill="#000"/></svg>';
}

module.exports = { buildShaarBlocks, shaarBoxOf, shaarFontOf, crownSvgOf, splitPartTitle, MM_TO_PX };
