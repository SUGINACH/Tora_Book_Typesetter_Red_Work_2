// src/engine/output/export-api.js — Export orchestrator: HTML standalone / PDF / ZIP bundle (S12.1, REQ-EXP-01..04)
'use strict';

/**
 * מנהה הייצוא — נקודת הכניסה האחידה של שלושת הנתיבים:
 *  - exportHtml(result, settings, doc): HTML עצמאי חד־קובץ (dir=rtl, @page, offline);
 *  - exportPdf(text, settings, fontBytes): PDF עם טקסט אמיתי + סימניות + קישורי TOC
 *    + סימני חיתוך. **מסלול מדידה עקבי:** העימוד לייצוא רץ עם measure-impl=font-metrics
 *    והגופן המוטמע — שבירות השורות והרוחבים בפועל מאותו גופן (מקור גיאומטריה יחיד);
 *  - exportProjectZip / importProjectZip: חבילת פרויקט ZIP מובנית (JSON — לא תבניות מחרוזות).
 *
 * דטרמיניזם בכל הנתיבים: אין Date.now; סדר קבוע; ייצוא כפול ⇒ בתים זהים.
 */

// **D-65 הפרדת חבילות:** המודולים להלן בטוחים־דפדפן (אין fs/pipeline) ונאגדים
// גם בחבילת ה־UI. הנתיבים הכבדים (PDF/ZIP מלאים — pipeline+גופן+בינארי) נטענים
// בעצלתות עם סמן node-only באותה שורת הקריאה — הבאנדלר מדלג; הקריאות מוגנות ב־typeof Buffer.
// (03.11: הסמן הוסר מהערה זו — תגובה שהכילה אותו מילולית הטעתה את הבאנדלר לדלג
// גם על require רגיל ⇒ קריסת ייצוא בדפדפן. הזיהוי כעת קפדני: אותה שורה בלבד.)
const getDefaultSettings = require('../core/settings-registry').getDefaultSettings;
const { renderPage } = require('./dom-renderer');
const { buildStandaloneHtml } = require('./html-export');
// **פרוסה 4 (§3):** המקרין הטהור מה-PageModel — אותו מקור גיאומטריה כמו
// התצוגה החיה בפרופיל המאוחד. הייצוא הוא צילום-מצב של המודל: אין typeset
// נוסף, אין Parser/Planner, אין מדידה, אין חלוקת הערות — רק הקרנה.
const { renderModelPage } = require('./pagemodel-dom-renderer');
const { PAGE_SIZES, MM_TO_PX } = require('../layout/page-templates');
const { utf8Decode } = require('../import/zip-reader'); // פענוח UTF-8 סביבת-אגנוסטי (רשומות zip = Uint8Array)
// **S74 (תיקון שורש — הקרנת מדיניות הניקוד לכותב ה-PDF):** מקור יחיד לצד
// הייצוא — משקף את מדידת המנוע המאוחד (RC-M4: סימן משולב ב-advance 0).
// ראה pdf-mark-policy.js; שער הרגרסיה s74 נועל את ההקרנה מול רוחב המודל.
const { applyCombinedMarkPolicy } = require('./pdf-mark-policy');

/** טעינה עצלה של נתיבי Node (מוגנת) — מחזירה null בסביבה בלי Buffer. */
function nodeOnly(loader) {
  if (typeof Buffer === 'undefined') return null; // דפדפן — הקריאה מלאכותית נמנעת מראש
  return loader();
}

/** **03.11(ג) תיקון קריסת ייצוא HTML בדפדפן:** ב-DOM האמיתי outerHTML מאפיין
 * (מחרוזת), ב-shim הבדיקות — פונקציה. הפונקציה הזו מטפלת בשניהם + נפילה
 * לסריאליזציה ידנית בסיסית (אף סביבה לא נותרת בלי פלט). */
function elementOuterHtml(el) {
  if (!el) return '';
  if (typeof el.outerHTML === 'function') return el.outerHTML(); // shim הבדיקות
  if (typeof el.outerHTML === 'string') return el.outerHTML;      // DOM אמיתי
  if (typeof el.innerHTML === 'string' && el.tagName) {
    return `<${el.tagName}>${el.innerHTML}</${el.tagName}>`;       // מוצא אחרון
  }
  return '';
}

// ============ HTML עצמאי (REQ-EXP-02) ============

/**
 * ייצוא HTML עצמאי חד־קובץ. העמודים מרונדרים דרך dom-renderer (אותו מקור
 * כמו התצוגה החיה) אל doc שסופק (document אמיתי בדפדפן / shim בבדיקות).
 * @param {object} result — תוצאת typeset
 * @param {object} settings — הגדרות ממוזגות
 * @param {{createElement:Function}} doc — מפעל DOM
 * @param {object} [meta] — {title}
 */
function exportHtml(result, settings, doc, meta = {}) {
  // **זהות בתים עם הרינדור החי:** כל עמוד מוקרן דרך dom-renderer בדיוק כמו
  // התצוגה — בלי מאפיינים נוספים (השוואת parity נעולה בבדיקות מילה־במילה).
  // **03.11(ד):** בעבר הועבר result.metadata כארגומנט ה-header — טעות סוג:
  // ההעברה הזו לא הציגה כותרת עליונה בייצוא (מטא־נתונים אינם header). מעתה
  // renderPage נופל לברירת המחדל page.header שהצינור מצמיד לכל עמוד.
  const pagesHtml = [];
  for (const pg of result.pages) {
    pagesHtml.push(elementOuterHtml(renderPage(pg, settings, doc)));
  }
  const sizeMm = pageMmOf(settings);
  const pageRules = settings['export-html-page-rules'] !== false
    ? `@page { size: ${round2mm(sizeMm.w)}mm ${round2mm(sizeMm.h)}mm; margin: 0 }\n`
      + `.page{width:${Math.round(sizeMm.w * MM_TO_PX)}px;height:${Math.round(sizeMm.h * MM_TO_PX)}px}\n`
    : '';
  const html = buildStandaloneHtml(pagesHtml, settings, {
    title: meta.title || (result.metadata && (result.metadata['ספר'] || result.metadata.title)) || 'ספר',
    pageRules,
    // **03.11:** הטמעת הגופנים בקובץ העצמאי (@font-face data-URI) — מסופק ע"י ה־UI
    // מהספרייה (imud-library); ללא הגדרה — כמו קודם (fallback מערכת).
    fontCss: meta.fontCss || ''
  });
  return html;
}

/**
 * **פרוסה 4 (§3 — HTML מה-PageModel בלבד):** ייצוא HTML עצמאי מתוך PageModel
 * שכבר חושב — אותו מקרין הקורא את אותו מודל שהתצוגה החיה מציגה בפרופיל
 * המאוחד. אין כאן typeset/Parser/Planner/מדידה/חלוקת הערות — הקרנה טהורה
 * של מה שכבר נקבע. קישורי תוכן-העניינים מוקרנים מ-tocLinks שבמודל.
 * @param {object} model — PageModel (pagemodel-v1) שהועבר לצרכן ה-UI
 * @param {object} settings — הגדרות ממוזגות (כרום תצוגה בלבד)
 * @param {{createElement:Function}} doc — מפעל DOM
 * @param {object} [meta] — {title, fontCss}
 * @throws שגיאה מפורשת כשהמודל חסר/שגוי — אין fallback שקט (§3)
 */
function exportHtmlFromModel(model, settings, doc, meta = {}) {
  if (!model || model.schema !== 'pagemodel-v1' || !Array.isArray(model.pages)) {
    throw new Error('exportHtmlFromModel: נדרש PageModel תקין (pagemodel-v1) — ייצוא מהמודל בלבד, אין נתיב חלופי');
  }
  const pagesHtml = [];
  // **9c.3 (§4.3 — מקור יחיד לקישורי TOC):** המקרין מהמודל מקרין את מלבני
  // הקישור (document.tocLinks) כשכבת-על לחיצה — אותו קוד כמו התצוגה החיה;
  // אין עוד הוספת קישורים ידנית כאן (מנע סטייה בין התצוגה לייצוא).
  const tocLinks = (model.document && Array.isArray(model.document.tocLinks)) ? model.document.tocLinks : [];
  for (const mp of model.pages) {
    pagesHtml.push(elementOuterHtml(renderModelPage(mp, settings, doc, { tocLinks })));
  }
  const sizeMm = pageMmOf(settings);
  const pageRules = settings['export-html-page-rules'] !== false
    ? `@page { size: ${round2mm(sizeMm.w)}mm ${round2mm(sizeMm.h)}mm; margin: 0 }\n`
      + `.page{width:${Math.round(sizeMm.w * MM_TO_PX)}px;height:${Math.round(sizeMm.h * MM_TO_PX)}px}\n`
      + `.toc-link{display:block}\n`
    : '';
  const html = buildStandaloneHtml(pagesHtml, settings, {
    title: meta.title || 'ספר',
    pageRules,
    fontCss: meta.fontCss || ''
  });
  return html;
}

// ============ PDF (REQ-EXP-03) ============

/**
 * ייצוא PDF מלא: עימוד במדידת הגופן המוטמע → הקרנה → כתיבה.
 * @param {string} text — מסמך המקור
 * @param {object} settingsIn — הגדרות המשתמש
 * @param {Buffer} fontBytes — קובץ TTF להטמעה (למשל DejaVu)
 * @param {string} [fontName] — שם פרופיל (ברירת מחדל: body-font של ההגדרות)
 * @param {object} [env] — סביבת המנוע (S4.15: windowFontBytes/marginFontBytes — גופני
 *   מילת-החלון/הערות-הצד של המקור; בלעדיהם המדידה נופלת לגופן הגוף)
 * @returns {{ok:boolean, error?:string, bytes?:Buffer, result?:object, projected?:object, info?:object}}
 */
function exportPdf(text, settingsIn, fontBytes, fontName, env) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' }; // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { typeset } = require('../core/pipeline');
  /* node-only */ const { registerFont, unregisterFont, restoreFontRegistration, registeredFonts: registeredFontsRef, MeasureAPI, resolveMeasureImpl } = require('../typography/measure-api');
  /* node-only */ const { parseFont, glyphIdOf } = require('../typography/font-metrics');
  /* node-only */ const { buildSubset, charInventory } = require('../typography/font-subset');
  /* node-only */ const { projectDocument } = require('./geometry-projector');
  /* node-only */ const { writePdf } = require('./pdf-writer');
  const profileName = fontName || settingsIn['body-font'] || 'ToraExport';
  // **S6.0 (R2-C1 — דליפת רישום גופן):** profileName עלול להיות שם הגופן
  // של התצוגה החיה (body-font, למשל 'Frank Ruhl Libre' שנרשם ע"י ה-UI).
  // בעבר: הייצוא דרס את הרישום וב-finally מחק אותו ⇒ אחרי ייצוא PDF אחד
  // המדידה החיה נפלה בשקט ל'table' (סטיית עימוד 2–17% לפי EXT-13).
  // כעת: שחזור הרישום הקודם בסוף הייצוא; ובכשל רישום — לא נמחק רישום
  // קיים תקין (בעבר נמחק גם כשה-parse נכשל).
  const hadPrevFont = registeredFontsRef.has(profileName);
  const prevFont = hadPrevFont ? registeredFontsRef.get(profileName) : null;
  const reg = registerFont(profileName, fontBytes);
  if (!reg.ok) { if (!hadPrevFont) unregisterFont(profileName); return { ok: false, error: `font:${reg.error}` }; }
  try {
    const font = reg.profile;
    // **סדר הפעולות (תיקון שורש):** עימוד → הקרנה → מלאי מ**כל הטקסט שמצויר
    // בפועל** (גוף+פסים+TOC+מרזב+גיליון+כותרות) → מצמום → כתיבה.
    // בעבר נבנה המלאי מטקסט המקור בלבד — וגרשיים נגזרים (גיליון כ״ב, תוויות
    // TOC) הושמטו בשקט מהגופן ⇒ אובדן תוכן בייצוא.
    const settings = {
      ...getDefaultSettings(), ...settingsIn,
      'body-font': profileName,
      'measure-impl': 'font-metrics'
    };
    const result = typeset(text, settings, { noRecommendations: true, ...(env || {}) });
    // **S4.9:** פרופיל IMUD — הקרנה ממקרן ה-legacy (גיאומטריה מפורשת מהייחוס)
    // **S71.1 (double-check — projection measurement consistency):** the
    // projection must measure with the SAME impl that built the model
    // (impl B — registered-font metrics). Until now projectDocument built
    // itself a MeasureAPI(settings,'table') when no api was passed, so word
    // x-positions followed the table while line breaks followed real font
    // metrics: with Frank Ruhl Libre (the default font) 168 lines overflowed
    // the column box in the exported PDF (up to 32.5px into the neighbouring
    // column) and 97.8% of words diverged from the display (avg 111.8px) —
    // display≠export, exactly the class EXT-13 closed for live↔export on the
    // typeset side. resolveMeasureImpl = the same single source as pipeline;
    // with no registered font it falls back to 'table' (previous behaviour).
    const projected = result.legacyProfile
      ? require('./legacy-projector').projectLegacyDocument(result, settings)
      : projectDocument(result, settings, new MeasureAPI(settings, resolveMeasureImpl(settings)));
    const drawnParts = [];
    for (const pg of projected.pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawnParts.push(w.text);
      for (const fn of pg.footnotes) drawnParts.push(fn.marker || '', fn.text || '');
      if (pg.folio && pg.folio.text) drawnParts.push(pg.folio.text);
      if (pg.header) for (const s of pg.header.slots) drawnParts.push(s.text);
    }
    const inventory = charInventory(drawnParts.join(' '));
    // **S5.2 (O1 — קריסת ייצוא על תו זר):** מלאי ה-F1 כלל גם תווים שחסרים
    // בגוף הטקסט (כל אות לטינית — "PDF", ® וכו') ו-buildSubset נכשל
    // (subset:tofu) לפני שרשת ה-fallback הפר-תו הספיקה לפעול: הדפדפן
    // הציג את המילה דרך המחסנית וה-PDF סירב להיווצר — תצוגה≠ייצוא בכלל
    // גרוע. כעת: מלאי ה-F1 = תווים שקיימים בו בפועל; השאר נופלים ל-/F4
    // (הסריקה שלמטה אוספת אותם למלאי ה-F4) או מושמטים אם אינם בשום גופן.
    const f1Inventory = inventory.filter(ch => glyphIdOf(font, ch) !== 0);
    const subset = buildSubset(font, f1Inventory);
    if (!subset.ok) return { ok: false, error: `subset:${subset.error}` };

    // סימניות: H1 → רמה 1; H2 → רמה 2 (עץ מכותרות המודל)
    const outline = [];
    const firstPageByToken = new Map();
    result.pages.forEach((pg) => {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.columns.flat()]) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
      }
    });
    for (const b of result.tokens) {
      if (b.type !== 'heading' || (b.level !== 1 && b.level !== 2)) continue;
      const pg = firstPageByToken.get(b.id);
      if (pg == null) continue;
      outline.push({ title: b.text, page: pg, level: b.level });
    }

    // קישורי TOC: שורות tocPages עם targetPage נפתר (S9). מיקום השורות — פריסת
    // הרנדרר (toc-rows: top 70, שורה ~24px) — מלבן לחיץ לכל שורה/פריט קבוצה.
    const tocLinks = [];
    for (const tp of result.tocPages || []) {
      let yi = 0;
      for (const row of (tp.toc && tp.toc.rows) || []) {
        if (row.kind === 'group') {
          let xi = 0;
          for (const it of row.items || []) {
            if (it.targetPage != null) tocLinks.push({ page: tp.index, x: 18 + xi, y: 70 + yi * 24, w: 60, h: 22, targetPage: it.targetPage });
            xi += 80;
          }
        } else if (row.targetPage != null) {
          tocLinks.push({ page: tp.index, x: 18, y: 70 + yi * 24, w: 700, h: 22, targetPage: row.targetPage });
        }
        yi++;
      }
    }

    const pageSizeMm = pageMmOf(settings);
    // **S74:** let — המדיניות מוחלת להלן בנתיב המאוחד (רוחבי הניקוד ב-/W מאופסים).
    let fontForWriter = {
      subsetBytes: subset.bytes,
      widthsUnits: subset.widthsUnits,
      unitsPerEm: subset.unitsPerEm,
      cidOf: (ch) => {
        const gNew = glyphIdOf(parseSubsetCache(subset), ch); // gid בתת־הגופן
        return gNew;
      },
      charToGidEntries: () => [...subsetNewCmap(subset).entries()]
    };
    // **S4.15 (גופן משני — מילות-חלון FrankReal-Bold):** המקרן מסמן את
    // מילות-החלון (fontKey='window'); כאן נבנה תת-גופן שלהן ונעביר לכותב
    // ה-PDF (/F2) — ציור בגופן המקור + רוחב אמיתי (מונע חריגה מהשקע).
    // הגופן נרשם ע"י typeset מ-env.windowFontBytes באותו תהליך.
    let fontForWriter2 = null;
    {
      const winProfile = registeredFontsRef.get('FrankReal-Bold') || registeredFontsRef.get('FrankReal');
      if (winProfile) {
        const winParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'window') winParts.push(w.text);
          }
        }
        if (winParts.length) {
          const winSubset = buildSubset(winProfile, charInventory(winParts.join(' ')));
          if (winSubset.ok) {
            const winC2g = subsetNewCmap(winSubset);
            fontForWriter2 = {
              subsetBytes: winSubset.bytes,
              widthsUnits: winSubset.widthsUnits,
              unitsPerEm: winSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = winC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(winSubset), ch);
              },
              charToGidEntries: () => [...winC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן שלישי — DavidLibre-Bold, כותרות/TOC):** המקרן מסמן מילות
    // כותרת (fontKey='heading'); כאן נבנה תת-גופן ונעביר לכותב ה-PDF (/F3) —
    // כמו הייחוס (DavidLibre-Bold בכל הכותרות ושורות ה-TOC).
    let fontForWriter3 = null;
    {
      const headProfile = registeredFontsRef.get('DavidLibre-Bold');
      if (headProfile) {
        const headParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'heading') headParts.push(w.text);
          }
        }
        if (headParts.length) {
          const headSubset = buildSubset(headProfile, charInventory(headParts.join(' ')));
          if (headSubset.ok) {
            const headC2g = subsetNewCmap(headSubset);
            fontForWriter3 = {
              subsetBytes: headSubset.bytes,
              widthsUnits: headSubset.widthsUnits,
              unitsPerEm: headSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = headC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(headSubset), ch);
              },
              charToGidEntries: () => [...headC2g.entries()]
            };
          }
        }
      }
    }
    // **S4.26 (גופן רביעי — Frank Ruhl Libre, fallback לפיסוק):** תווים שחסרים
    // בגוף הראשי (פיסוק בסיסי בגופנים תורניים — למשל ' . בגוטמן רש"י) מצוירים
    // ב-/F4 — בדיוק כפי שהדפדפן נופל ל-'Frank Ruhl Libre' שבמחסנית, וכפי
    // שהמדידה מודדת אותם (setMissingGlyphFallbackFont). בלי זה הפיסוק היה
    // נעלם מהייצוא.
    let fontForWriter4 = null;
    {
      const frlProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (frlProfile && fontForWriter) {
        const missingChars = new Set();
        for (const pg of projected.pages) {
          const scan = (lines) => {
            for (const ln of lines) {
              for (const w of (ln.words || [])) {
                for (const ch of String(w.text || '')) {
                  if (fontForWriter.cidOf(ch) === 0 && glyphIdOf(frlProfile, ch) !== 0) missingChars.add(ch);
                }
              }
            }
          };
          scan(pg.spanning ? pg.spanning.lines : []);
          scan(pg.lines || []);
          for (const fn of (pg.footnotes || [])) scan([{ words: fn.words || [] }]);
          // **S5.1 (תיקון C3):** הגיליון וסלוטי הכותרת העליונה לא נסרקו —
          // תו שחסר בגוף ומופיע רק שם היה נעלם מה-PDF (ה-DOM הציג אותו).
          if (pg.folio && pg.folio.text) scan([{ words: [{ text: pg.folio.text }] }]);
          if (pg.header) for (const s of pg.header.slots || []) if (s && s.text) scan([{ words: [{ text: s.text }] }]);
        }
        if (missingChars.size) {
          const punctSubset = buildSubset(frlProfile, charInventory([...missingChars].join('')));
          if (punctSubset.ok) {
            const punctC2g = subsetNewCmap(punctSubset);
            fontForWriter4 = {
              subsetBytes: punctSubset.bytes,
              widthsUnits: punctSubset.widthsUnits,
              unitsPerEm: punctSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = punctC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(punctSubset), ch);
              },
              charToGidEntries: () => [...punctC2g.entries()]
            };
          }
        }
      }
    }
    // **S5.1 (תצוגה=ייצוא בגופנים — תיקון L3):** הגופן החמישי (Frank Ruhl
    // Libre — גוף ההערה, fontKey 'fnbody') והשישי (Hadassah Friedlaender —
    // הערות-צד, fontKey 'margin'). עד כאן צוירו בגוף הטקסט (/F1) בזמן שה-DOM
    // מציג אותם ב-FRL/Hadassah — הייצוא ≠ התצוגה. מילים נאספות גם משורות
    // הגוף (margin-note) וגם מסמני/גוף ההערה (footnotes.words).
    let fontForWriter5 = null;
    {
      const fnProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (fnProfile) {
        const fnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'fnbody') fnParts.push(w.text);
          }
          for (const fn of (pg.footnotes || [])) for (const w of (fn.words || [])) if (w.fontKey === 'fnbody') fnParts.push(w.text);
        }
        if (fnParts.length) {
          const fnSubset = buildSubset(fnProfile, charInventory(fnParts.join(' ')));
          if (fnSubset.ok) {
            const fnC2g = subsetNewCmap(fnSubset);
            fontForWriter5 = {
              subsetBytes: fnSubset.bytes,
              widthsUnits: fnSubset.widthsUnits,
              unitsPerEm: fnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = fnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(fnSubset), ch);
              },
              charToGidEntries: () => [...fnC2g.entries()]
            };
          }
        }
      }
    }
    let fontForWriter6 = null;
    {
      const mnProfile = registeredFontsRef.get('Hadassah Friedlaender');
      if (mnProfile) {
        const mnParts = [];
        for (const pg of projected.pages) {
          for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
            for (const w of ln.words) if (w.fontKey === 'margin') mnParts.push(w.text);
          }
        }
        if (mnParts.length) {
          const mnSubset = buildSubset(mnProfile, charInventory(mnParts.join(' ')));
          if (mnSubset.ok) {
            const mnC2g = subsetNewCmap(mnSubset);
            fontForWriter6 = {
              subsetBytes: mnSubset.bytes,
              widthsUnits: mnSubset.widthsUnits,
              unitsPerEm: mnSubset.unitsPerEm,
              cidOf: (ch) => {
                const g = mnC2g.get(ch);
                return g != null ? g : glyphIdOf(parseSubsetCache(mnSubset), ch);
              },
              charToGidEntries: () => [...mnC2g.entries()]
            };
          }
        }
      }
    }
    // **S73 (תצוגה=ייצוא בגופנים — תיקון שורש):** גופני משפחה דינמיים. המקרנים
    // (legacy+DP) מסמנים מילים ב-fontKey = שם משפחה מההגדרות (כותרות
    // AlphaBlack/Lia Sgula, שורות שער Livorna/David Libre, כותרות עליונות,
    // גיליון וכו') — כמו שה-DOM מציר. כאן נבנה תת-גופן ייעודי לכל משפחה
    // רשומה שבשימוש בפועל (מילים/גיליון/סלוטים), ונעביר לכותב ה-PDF
    // (/F7, /F8… בסדר ממוין — דטרמיניסטי: ייצוא כפול ⇒ בתים זהים).
    // משפחה שאינה רשומה — המילים שלה נופלות לגוף הטקסט (/F1) בכותב (מתועד).
    const ROLE_KEYS = new Set(['window', 'heading', 'fnbody', 'margin']);
    const famWords = new Map(); // family → Set<word>
    const collectFam = (text, fontKey) => {
      if (!fontKey || ROLE_KEYS.has(fontKey) || !registeredFontsRef.has(fontKey)) return;
      if (!famWords.has(fontKey)) famWords.set(fontKey, new Set());
      famWords.get(fontKey).add(String(text));
    };
    for (const pg of projected.pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) {
        for (const w of ln.words) collectFam(w.text, w.fontKey);
      }
      for (const fn of (pg.footnotes || [])) {
        for (const w of (fn.words || [])) collectFam(w.text, w.fontKey);
        if (fn.marker) collectFam(fn.marker, 'fnbody');
      }
      if (pg.folio && pg.folio.text && pg.folio.fontKey) collectFam(pg.folio.text, pg.folio.fontKey);
      // **Iteration-003:** סלוטי כותרת בנתיב המודל — מילים לפי הטקסט וה-fontKey המוטבע
      if (pg.header) for (const s of (pg.header.slots || [])) {
        for (const w of (s.words || [])) collectFam(w.text, w.fontKey);
        if ((!s.words || !s.words.length) && s.text) collectFam(s.text, s.fontKey);
      }
    }
    const extraFonts = [];
    for (const fam of [...famWords.keys()].sort()) {
      const profile = registeredFontsRef.get(fam);
      if (!profile) continue; // נבדק ב-collectFam — הגנה כפולה
      const words = [...famWords.get(fam)].join(' ');
      const sub = buildSubset(profile, charInventory(words));
      if (!sub.ok) continue; // נפילה שקטה ל-/F1 — מתועם בכותב (משפחה בלי תווי המילה)
      const c2g = subsetNewCmap(sub);
      extraFonts.push({
        key: fam,
        font: {
          subsetBytes: sub.bytes,
          widthsUnits: sub.widthsUnits,
          unitsPerEm: sub.unitsPerEm,
          cidOf: (ch) => {
            const g = c2g.get(ch);
            return g != null ? g : glyphIdOf(parseSubsetCache(sub), ch);
          },
          charToGidEntries: () => [...c2g.entries()]
        },
        // **S73:** מטריקות אמת מפרופיל הגופן הרשום (hhea ascender/descender ÷
        // unitsPerEm — ל-FontDescriptor); נפילה 0.8/0.2 (כמו הגוף) כשחסר.
        ascentEm: Number.isFinite(profile.ascender) && profile.unitsPerEm
          ? profile.ascender / profile.unitsPerEm : 0.8,
        descentEm: Number.isFinite(profile.descender) && profile.unitsPerEm
          ? Math.abs(profile.descender) / profile.unitsPerEm : 0.2
      });
    }
    // **S74 (תיקון שורש — סמכות אחת למדידת ניקוד, 25.11):** המנוע המאוחד מודד
    // סימנים משולבים ב-advance 0 ('_marks-advance=combined' — נקבע בתוך typeset
    // על ההגדרות הפנימיות; RC-M4 ב-measure-api). ה-PDF מקרין את אותה החלטה:
    // גליפי ניקוד ברוחב 0 במערך /W של כל גופן-כותב ⇒ רוחב המילה ב-PDF =
    // רוחב המילה שהמודל תכנן. נתיב המורשת (legacyProfile) מודד hmtx בהפרדה
    // כמו מנוע המקור שייצר את הייחוס — ואינו מושפע (בתים זהים; שער s73 נשאר).
    if (!result.legacyProfile) {
      fontForWriter = applyCombinedMarkPolicy(fontForWriter);
      fontForWriter2 = applyCombinedMarkPolicy(fontForWriter2);
      fontForWriter3 = applyCombinedMarkPolicy(fontForWriter3);
      fontForWriter4 = applyCombinedMarkPolicy(fontForWriter4);
      fontForWriter5 = applyCombinedMarkPolicy(fontForWriter5);
      fontForWriter6 = applyCombinedMarkPolicy(fontForWriter6);
      for (let i = 0; i < extraFonts.length; i++) {
        extraFonts[i] = { ...extraFonts[i], font: applyCombinedMarkPolicy(extraFonts[i].font) };
      }
    }
    const bytes = writePdf({
      pages: projected.pages,
      pageSizeMm,
      font: fontForWriter,
      font2: fontForWriter2,
      font3: fontForWriter3,
      font4: fontForWriter4,
      font5: fontForWriter5,
      font6: fontForWriter6,
      extraFonts,
      settings,
      outline,
      tocLinks
    });
    return {
      ok: true, bytes, result, projected,
      info: {
        pages: result.pages.length,
        glyphs: subset.kept,
        fontBytes: subset.bytes.length,
        outline: outline.length,
        tocLinks: tocLinks.length,
        layoutHash: result.layoutHash,
        // **03.11 (חיזוק ביקורת):** נתוני היעדים בפועל — לבדיקת אמת שכל
        // סימנייה/קישור מצביע לעמוד הנכון (לא רק מספרם).
        outlineItems: outline,
        tocLinkTargets: tocLinks.map(l => l.targetPage),
        tocLinkPages: tocLinks.map(l => l.page)
      }
    };
  } finally {
    // **S6.0 (R2-C1):** שחזור הרישום שהיה קיים לפני הייצוא (או הסרה אם לא היה)
    restoreFontRegistration(profileName, prevFont);
  }
}

/**
 * **פרוסה 5 (§4 — PDF מה-PageModel בלבד):** הסרת העימוד השני מנתיב ה-PDF.
 * הכותב צורך את **אותו PageModel** שה-DOM וה-HTML צורכים — אין typeset,
 * אין Parser/Planner, אין מדידה, אין חלוקת הערות, אין החלטות מיקום: כל
 * x/y/baseline/גודל/מפתח-גופן/צבע/פעולות-דיו מגיעים מהמודל. הפונקציה עוסקת
 * באריזה בלבד (רישום גופן הייצוא, מלאי תווים מהטקסט המצויר בפועל, מצווץ,
 * כתיבה) — כמו exportPdf, בלי שלב העימוד-ההקרנה.
 * @param {object} model — PageModel (pagemodel-v1) — אותו מודל שהגיע ל-UI
 * @param {object} settingsIn — הגדרות (עמוד/הגדרות כותב בלבד)
 * @param {Uint8Array} fontBytes — גופן הייצוא (TTF) ל-/F1
 * @param {string} [fontName] — שם פרופיל הרישום
 */
function exportPdfFromModel(model, settingsIn, fontBytes, fontName) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' }; // דפדפן — נתיב Node בלבד (מתועד)
  if (!model || model.schema !== 'pagemodel-v1' || !Array.isArray(model.pages) || !model.pages.length) {
    return { ok: false, error: 'model-required: נדרש PageModel תקין — אין נתיב עימוד חלופי בייצוא מהמודל' };
  }
  /* node-only */ const { registerFont, unregisterFont, restoreFontRegistration, registeredFonts: registeredFontsRef } = require('../typography/measure-api');
  /* node-only */ const { glyphIdOf } = require('../typography/font-metrics');
  /* node-only */ const { buildSubset, charInventory } = require('../typography/font-subset');
  /* node-only */ const { writePdf } = require('./pdf-writer');
  /* node-only */ const { getDefaultSettings } = require('../core/settings-registry');
  const profileName = fontName || settingsIn['body-font'] || 'ToraExport';
  const hadPrevFont = registeredFontsRef.has(profileName);
  const prevFont = hadPrevFont ? registeredFontsRef.get(profileName) : null;
  const reg = registerFont(profileName, fontBytes);
  if (!reg.ok) { if (!hadPrevFont) unregisterFont(profileName); return { ok: false, error: `font:${reg.error}` }; }
  try {
    const settings = { ...getDefaultSettings(), ...settingsIn, 'body-font': profileName };
    // ---- עמודי הכותב: התאמה טהורה של עמודי המודל לצורת הכותב (אפס החלטות) ----
    const pages = model.pages.map(mp => ({
      width: mp.geometry.width, height: mp.geometry.height,
      type: mp.type,
      spanning: mp.spanning ? { lines: mp.lines.filter(l => l.area === 'spanning') } : null,
      // **Iteration-001 (legacy parity):** רשומות-צל (h3band-shadow) הן רזרבציות
      // מתוכננות בלי הקרנה — אין להן דיו והן אינן מגיעות לכותב ה-PDF.
      lines: mp.lines.filter(l => l.area !== 'spanning' && l.projected !== false),
      footnotes: mp.footnotes || [],
      folio: mp.folio || null,
      header: mp.header || null,
      decorations: (mp.decorations || []).filter(d => Array.isArray(d.pdfOps) && d.pdfOps.length)
    }));
    // ---- מלאי תווים מהטקסט שמצויר בפועל (מהמודל) ----
    const drawnParts = [];
    for (const pg of pages) {
      for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...pg.lines]) for (const w of ln.words) drawnParts.push(w.text);
      for (const fn of pg.footnotes) for (const w of (fn.words || [])) drawnParts.push(w.text);
      if (pg.folio && pg.folio.text) drawnParts.push(pg.folio.text);
      if (pg.header) for (const s of pg.header.slots) drawnParts.push(s.text);
    }
    const font = reg.profile;
    const inventory = charInventory(drawnParts.join(' '));
    const f1Inventory = inventory.filter(ch => glyphIdOf(font, ch) !== 0);
    const subset = buildSubset(font, f1Inventory);
    if (!subset.ok) return { ok: false, error: `subset:${subset.error}` };
    // **S74 (תיקון שורש — הקרנת מדיניות הניקוד):** נתיב המודל הוא נתיב המנוע
    // המאוחד בלבד (pagemodel-v1), והמנוע המאוחד מודד סימנים משולבים ב-advance 0
    // (RC-M4). כל גופן-כותב שנבנה כאן מקרין את אותה החלטה — גליפי ניקוד ברוחב 0
    // ב-/W ⇒ רוחב המילה ב-PDF = רוחב המילה שהמודל תכנן. (שער s74 נועל זאת מול
    // רוחב המילה ב-PageModel.)
    const mkFont = (sub) => {
      const c2g = subsetNewCmap(sub);
      return applyCombinedMarkPolicy({
        subsetBytes: sub.bytes, widthsUnits: sub.widthsUnits, unitsPerEm: sub.unitsPerEm,
        cidOf: (ch) => { const g = c2g.get(ch); return g != null ? g : glyphIdOf(parseSubsetCache(sub), ch); },
        charToGidEntries: () => [...c2g.entries()]
      });
    };
    const fontForWriter = mkFont(subset);
    // ---- גופני-תפקידים מהמודל (window/heading/fnbody/margin) + משפחות רשודות ----
    // **Iteration-003 (תיקון שורש — תצוגה=ייצוא):** מילות המודל נושאות את
    // **מפתח התפקיד** ('heading'/'window'/'fnbody'/'margin' — כך מטביעים
    // structural-stamps/projectLine), לא את שם המשפחה. עד כאן החיפוש נעשה
    // לפי שם המשפחה בלבד ('DavidLibre-Bold' וכו') ⇒ אפס מילים נמצאו ⇒ כל
    // גופני התפקידים היו null וכל הטקסט נפל ל-/F1 (גוף הטקסט) — ההערות,
    // הערות-הצד, מילות-החלון ושורות ה-TOC נצבעו בגופן הגוף במקום בגופניהן.
    // כעת: איסוף לפי מפתח-התפקיד ומיפוי מפתח→משפחה (אותה טבלה הפוכה של
    // familyFontKeyOf — מקור יחיד ב-font-keys).
    const wordsByRole = new Map();
    const allLines = [];
    for (const pg of pages) { allLines.push(...(pg.spanning ? pg.spanning.lines : []), ...pg.lines); }
    for (const ln of allLines) for (const w of ln.words) {
      if (w.fontKey == null) continue;
      if (!wordsByRole.has(w.fontKey)) wordsByRole.set(w.fontKey, []);
      wordsByRole.get(w.fontKey).push(w.text);
    }
    for (const fn of pages.flatMap(p => p.footnotes)) for (const w of (fn.words || [])) {
      if (w.fontKey == null) continue;
      if (!wordsByRole.has(w.fontKey)) wordsByRole.set(w.fontKey, []);
      wordsByRole.get(w.fontKey).push(w.text);
    }
    // **Iteration-003 (תצוגה=ייצוא — סלוטי כותרת וגיליון):** טקסטים שאינם
    // בשורות/הערות — סלוטי הכותרת העליונה (fontKey = המשפחה מההגדרות,
    // למשל Livorna) והגיליון. בלי האיסוף הזה תת-הגופן של המשפחה נבנה ממלאי
    // חלקי (מקורות אחרים) ואותיות בודדות נפלו ל-/F1 — גופן מעורב בכותרת
    // (נמדע: 'בעניין' הוצג 'בע'+F1+'נ'+F2+'יין'). אוספים גם מילים ממוקמות
    // (legacy) וגם סלוט טקסטואלי מוטבע.
    for (const pg of pages) {
      if (pg.header) for (const s of (pg.header.slots || [])) {
        if (!s) continue;
        for (const w of (s.words || [])) {
          const k = w.fontKey != null ? w.fontKey : s.fontKey;
          if (k == null) continue;
          if (!wordsByRole.has(k)) wordsByRole.set(k, []);
          wordsByRole.get(k).push(w.text);
        }
        if ((!s.words || !s.words.length) && s.text && s.fontKey != null) {
          if (!wordsByRole.has(s.fontKey)) wordsByRole.set(s.fontKey, []);
          wordsByRole.get(s.fontKey).push(s.text);
        }
      }
      if (pg.folio && pg.folio.text && pg.folio.fontKey != null) {
        if (!wordsByRole.has(pg.folio.fontKey)) wordsByRole.set(pg.folio.fontKey, []);
        wordsByRole.get(pg.folio.fontKey).push(pg.folio.text);
      }
    }
    const mkRoleFont = (roleKey, family) => {
      const prof = registeredFontsRef.get(family);
      if (!prof) return null;
      const parts = wordsByRole.get(roleKey) || [];
      if (!parts.length) return null;
      const sub = buildSubset(prof, charInventory(parts.join(' ')));
      return sub.ok ? mkFont(sub) : null;
    };
    // **Iteration-003 (מילת-חלון):** משפחת החלון — FrankReal-Bold כשרשומה
    // תחת שמה, ואם לא — המשפחה 'FrankReal' (הקטלוג רושם את FrankReal-Bold.ttf
    // תחת 'FrankReal'; בלי הנפילה מילות החלון נפלו ל-/F1 גוף).
    const fontForWriter2 = mkRoleFont('window', 'FrankReal-Bold') || mkRoleFont('window', 'FrankReal');
    const fontForWriter3 = mkRoleFont('heading', 'DavidLibre-Bold');
    // **Iteration-003:** משפחת גוף ההערה מההגדרות (f-note-body-font — אסיסטנט
    // קל מאוד בפרוביל IMUD, כמו fnApi של המורשת); נפילה היסטורית ל-FRL.
    const fnBodyFamilyForRole = (settings && settings['f-note-body-font']) || 'Frank Ruhl Libre';
    const fontForWriter5 = mkRoleFont('fnbody', fnBodyFamilyForRole) || mkRoleFont('fnbody', 'Frank Ruhl Libre');
    const fontForWriter6 = mkRoleFont('margin', 'Hadassah Friedlaender');
    // **S4.26 (כמו נתיב הטקסט):** הגופן הרביעי — Frank Ruhl Libre כ-fallback
    // לפיסוק שחסר בגוף הראשי (בנתיב המודל היה מת תמיד — חיפוש מילים במפתח
    // 'David Libre' שאינו קיים אף פעם). תווים חסרים ב-/F1 שקיימים ב-FRL.
    let fontForWriter4 = null;
    {
      const frlProfile = registeredFontsRef.get('Frank Ruhl Libre');
      if (frlProfile && fontForWriter) {
        const missingChars = new Set();
        const scan = (lines) => {
          for (const ln of lines) {
            for (const w of (ln.words || [])) {
              for (const ch of String(w.text || '')) {
                if (fontForWriter.cidOf(ch) === 0 && glyphIdOf(frlProfile, ch) !== 0) missingChars.add(ch);
              }
            }
          }
        };
        for (const pg of pages) {
          scan(pg.spanning ? pg.spanning.lines : []);
          scan(pg.lines || []);
          for (const fn of (pg.footnotes || [])) scan([{ words: fn.words || [] }]);
          if (pg.folio && pg.folio.text) scan([{ words: [{ text: pg.folio.text }] }]);
          if (pg.header) for (const s of pg.header.slots || []) if (s && s.text) scan([{ words: [{ text: s.text }] }]);
        }
        if (missingChars.size) {
          const punctSubset = buildSubset(frlProfile, charInventory([...missingChars].join('')));
          if (punctSubset.ok) fontForWriter4 = mkFont(punctSubset);
        }
      }
    }
    // משפחות רשודות נוספות (מפתחות שאינם תפקידים) — כמו הנתיב הקיים
    const ROLE_KEYS = new Set(['window', 'heading', 'fnbody', 'margin']);
    const extraFonts = [];
    for (const key of wordsByRole.keys()) {
      if (ROLE_KEYS.has(key) || !registeredFontsRef.has(key)) continue;
      const sub = buildSubset(registeredFontsRef.get(key), charInventory(wordsByRole.get(key).join(' ')));
      if (sub.ok) extraFonts.push({ key, font: mkFont(sub) });
    }
    // ---- סימניות וקישורים: מהמודל (נבנו בבונה מהטוקנים/החותמות) ----
    const outline = (model.document && model.document.outline) || [];
    const tocLinks = (model.document && model.document.tocLinks) || [];
    const pageSizeMm = pageMmOf(settings);
    const bytes = writePdf({
      pages, pageSizeMm,
      font: fontForWriter, font2: fontForWriter2, font3: fontForWriter3,
      font4: fontForWriter4, font5: fontForWriter5, font6: fontForWriter6,
      extraFonts, settings, outline, tocLinks
    });
    return {
      ok: true, bytes,
      info: {
        pages: pages.length, glyphs: subset.kept, fontBytes: subset.bytes.length,
        outline: outline.length, tocLinks: tocLinks.length,
        geometryHash: model.geometryHash || null,
        outlineItems: outline,
        tocLinkTargets: tocLinks.map(l => l.targetPage),
        tocLinkPages: tocLinks.map(l => l.page),
        fromPageModel: true
      }
    };
  } finally {
    restoreFontRegistration(profileName, prevFont);
  }
}

/** קריאת תת־הגופן (פעם אחת) למיפוי תו→gid חדש — ה־cidOf/charToGidEntries של הכותב. */
const _subsetCache = new WeakMap();
function parseSubsetCache(subset) {
  if (!_subsetCache.has(subset)) {
    /* node-only */ const { parseFont } = require('../typography/font-metrics');
    _subsetCache.set(subset, parseFont(subset.bytes).font);
  }
  return _subsetCache.get(subset);
}
function subsetNewCmap(subset) {
  const f = parseSubsetCache(subset);
  const out = new Map();
  for (const [cp, g] of f.charToGlyph) out.set(String.fromCodePoint(cp), g);
  return out;
}

// ============ חבילת פרויקט ZIP (REQ-EXP-04) ============

/**
 * ייצוא חבילת פרויקט: מסמך + הגדרות (עם settings_version) + הרחבות + תבנית ערכה.
 * כל החלקים JSON מובנה — אפס תבניות מחרוזות (שיעור regex-replacement).
 * @returns {Buffer} — ZIP
 */
function exportProjectZip(text, settings, extras = {}) {
  if (typeof Buffer === 'undefined') return Buffer.alloc(0); // דפדפן — נתיב Node בלבד (מתועד)
  /* node-only */ const { buildZip } = require('./zip-writer');
  /* node-only */ const { exportProject } = require('./project-io');
  /* node-only */ const { exportExtensions } = require('../extensions/extensions-io');
  const settingsJson = exportProject(null, cleanSettings(settings), { timestamp: null });
  const extensionsJson = (extras.extensions != null)
    ? exportExtensions(extras.extensions)
    : exportExtensions({ styles: [], pages: [], images: [] });
  const themeJson = JSON.stringify(extras.theme || { 'theme-set-id': settings['theme-set-id'] || 'default' }, null, 2);
  const manifest = JSON.stringify({
    format: 'tora-typesetter-project-zip',
    format_version: 1,
    parts: ['document.txt', 'settings.json', 'extensions.json', 'theme.json'],
    settings_version: 2
  }, null, 2);
  return buildZip([
    { name: 'manifest.json', data: manifest },
    { name: 'document.txt', data: String(text || '') },
    { name: 'settings.json', data: settingsJson },
    { name: 'extensions.json', data: extensionsJson },
    { name: 'theme.json', data: themeJson }
  ]);
}

/**
 * ייבוא חבילת פרויקט.
 * @returns {{ok:boolean, error?:string, text?:string, settings?:object, extensions?:object, theme?:object, unknownKeys?:Array, issues?:Array}}
 */
function importProjectZip(bytes) {
  if (typeof Buffer === 'undefined') return { ok: false, error: 'no-buffer' };
  /* node-only */ const { readZip } = require('../import/zip-reader');
  /* node-only */ const { importProject } = require('./project-io');
  const zip = readZip(bytes);
  if (!zip.ok) return { ok: false, error: `zip:${zip.error}` };
  const entry = (name) => zip.entries.find(e => e.name === name);
  const manifestE = entry('manifest.json');
  const docE = entry('document.txt');
  const setE = entry('settings.json');
  if (!manifestE || !docE || !setE) return { ok: false, error: 'missing-parts' };
  let manifest;
  try { manifest = JSON.parse(utf8Decode(manifestE.data)); } catch (e) { return { ok: false, error: `manifest:${e.message}` }; }
  if (manifest.format !== 'tora-typesetter-project-zip') return { ok: false, error: 'unknown-format' };
  const proj = importProject(utf8Decode(setE.data));
  let extensions = null;
  const extE = entry('extensions.json');
  if (extE) {
    /* node-only */ const { importExtensions } = require('../extensions/extensions-io');
    const res = importExtensions(utf8Decode(extE.data));
    extensions = res; // כולל ok/errors — מדווח, לא שותק
  }
  let theme = null;
  const themeE = entry('theme.json');
  if (themeE) { try { theme = JSON.parse(utf8Decode(themeE.data)); } catch (e) { return { ok: false, error: `theme:${e.message}` }; } }
  return {
    ok: true,
    text: utf8Decode(docE.data),
    settings: proj.settings,
    extensions, theme,
    unknownKeys: proj.unknownKeys,
    issues: proj.issues
  };
}

// ============ עזרים ============

function pageMmOf(settings) {
  const px = PAGE_SIZES[settings['page-size']] || PAGE_SIZES.A4;
  return { w: px.w / MM_TO_PX, h: px.h / MM_TO_PX }; // px → מ״מ (אותו גורם)
}
function round2mm(v) { return Math.round(v * 100) / 100; }

/** הגדרות נקיות לייצוא: מפתחות פנימיים (מקווקוות) מוסרים — נכסי זמן־ריצה. */
function cleanSettings(settings) {
  const out = {};
  // **S5.2 (O16 — תלכיד ZIP מאבד הגדרות מורשת):** בעבר כל מפתח שמתחיל
  // ב '_' נזרק — כולל _imudRaw (שממנו נתיב המורשת קורא ~12 מפתחות
  // חיים: hdr-r/c/l-type, note-marker-size, note-num-separator ועוד),
  // _layout-profile (מפעיל את המנוע) ו-_legacy-ui-state. פרויקט שנשמר
  // ונטען איבד את ההגדרות והעימוד השתנה בשקט. כעת המפתחות החיים נשמרים.
  const KEEP = new Set(['_imudRaw', '_layout-profile', '_legacy-ui-state', '_customPages', '_customStyles']);
  for (const [k, v] of Object.entries(settings || {})) {
    if (k.startsWith('_') && !KEEP.has(k)) continue;
    out[k] = v;
  }
  return out;
}

module.exports = {
  exportHtml, exportHtmlFromModel, exportPdf, exportPdfFromModel, exportProjectZip, importProjectZip, pageMmOf
};
