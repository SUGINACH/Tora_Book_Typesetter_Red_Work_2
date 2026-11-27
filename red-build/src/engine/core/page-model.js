// src/engine/core/page-model.js — שלב 7: PageModel יחיד, סופי ו-immutable (תכנית §§7.1–7.3)
'use strict';

/**
 * **PageModel — מקור האמת הסופי של מיקומים וגיאומטריה** (הוראת שלב 7 §§18–22):
 *
 *   DocumentModel → Measured Items → LineModel → Planner → PagePlan → **PageModel** → מקרינים טהורים.
 *
 * הבונה מקבל את תוצר התכנון (העמודים הסופיים של ה-pipeline — ה-PagePlan בפועל)
 * ומפיק מודל עמוד **סופי וקפוא** שמכיל את כל ההחלטות הסמנטיות והגיאומטריות
 * של העימוד: עמודים בסדר סופי, גיאומטריית עמוד/טורים, שורות עם fragments
 * ממוקמים (מילים ב-x סופיים — הקרנה חד-פעמית, §7.1-5), פריטי עמוד (הערות
 * מרזב/פריטי עוגן/תיבות מידע/עיטורים/ריהוט), פערים והזמנות, זהויות מקור
 * וטווחי פיצול, סדר קריאה, אבחונים ותקינות נכסים.
 *
 * **גבולות האחריות (§22):** אחרי בניית המודל — שום מקרן אינו מזיז פריט, מודד
 * מילות-גוף, שובר שורות, מחשב תקציב הערות, מאזן, מתקן פערים או מחליט סדר
 * קריאה. כל ההחלטות התקבלו קודם; המקרינים (שלב 8) יקראו בלבד.
 *
 * **מה הבונה עושה ומה לא (§20):** הוא מאמת את התוכנית, מוכיח שכל פריט מתוכנן
 * מופיע בתוצאה (אין יתומים/כפילויות), משמר עוגנים, מאמת גיאומטריה והזמנות,
 * מפיק אבחונים ומקפיא. הוא **אינו** מודד מחדש, שובר שורות, מאזן או מחליט הצבה:
 * הקרנת ה-fragments מתבצעת פעם אחת (§7.1-5) דרך מנוע ההקרנה הקיים — אותו מקור
 * שה-PDF כבר צורך; החלטות העימוד (מיקומים/גבהים/פערים) נצרכות מהתוכנית כמו שהן.
 *
 * דטרמיניזם: אין תאריך/אקראיות/מזהי ריצה; אותו קלט ⇒ אותו מודל ואותם hashes.
 */

const { sha256OfJsonArrayElements } = require('./canonical-hash');
// **שלב 8 (§4.1):** materialization חד-פעמי — המנגנון הפנימי הטהור (לא
// מקרין, לא מודד, לא מחליט; צורך LineModel + חותמות structural-stamps).
const { materializeDocument } = require('./materialize');
const { stampIsValid } = require('../layout/notes-model');

/** גרסת הסכמה — עולה רק בשינוי חוזה שובר-צרכן (תכנית §7.1-10). */
const PAGE_MODEL_SCHEMA = 'pagemodel-v1';

/** סובלנות גבולות (px) — גלישת דיו מילה מעבר לתיבה אינה הפרת מיקום. */
const BOUNDS_TOLERANCE_PX = 1.5;

/** סוגי שורות שאינן שורות טור-גוף ב-out.lines (הקרנות ייעודיות לפריטי עמוד). */
const NON_BODY_LINE_KINDS = new Set(['side-note', 'info-box']);

/**
 * **Iteration-006 (RC-S1 — פס פתיחת-הסימן במודל העמוד):** חותמות-פס ברמת העמוד
 * מההקרנה (materialize) שאין להן שורת-תוכנית בטורים — המתכנן מטביע אותן
 * כחותמת עמוד (page.simanBand), לא כשורות זרימה. אם הן משתתפות במיפוי
 * שורות-הגוף (ה-zip מול page.columns) הן מזיזות כל ציוות באחד: שורת הפס
 * נכנסת לטור 0 עם גיאומטריית רוחב-מלא (552.3px) ומעל לראשית הטור
 * (y=307.88 מול contentBox.top=391.45) — ובטור השני שורת-גוף עם גיאומטריית
 * טור-0 מקבלת col=1 (נמדד: «את דברי הראשונים» right=−253px; LINE_OVERLAP
 * 557px ב-DOM; ושורת הגוף האחרונה נפלטת ל-structural). הוכחה נוספת:
 * מנוע המורשת טיפל בפס הסימן כ-pg.bands ברמת העמוד (y=307.88, tokenId:null)
 * — לא כשורת טור. הן מסווגות כאן structural —
 * מיקום מוחלט בקואורדינטות העמוד, כמו תוכן השער ושורות ה-TOC.
 */
const STAMPED_BAND_KINDS = new Set(['h2-siman']);

// ─── עזרי הקפאה עמוקה (immutable final model — §7.1-12) ───

/**
 * הקפאה עמוקה: מערכים ואובייקטים מוקפאים רקורסיבית. מחזירה את השורש.
 * מוטציה בכל עומק ⇒ TypeError במצב strict (מוכח בבדיקה).
 */
function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) deepFreeze(item);
    return Object.freeze(value);
  }
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return Object.freeze(value);
}

/**
 * ערכי גיאומטריה נשמרים **כמו שהם** (בלי עיגול): החישוב דטרמיניסטי
 * מבנית (אותו קלט ⇒ אותם float ביט-לביט), וההשוואה מול התוכנית חייבת
 * להיות מדויקת — תצוגה=ייצוא=מודל, אותם מספרים.
 */
function r2(v) { return v; }

// ─── הבונה (§19–20) ───

/**
 * buildPageModel — הבונה היחיד של מודל העמוד הסופי.
 * @param {object} result — תוצר typeset (pages/tokens/settings/contentHashIn)
 * @param {object} [opts] — { measure?: MeasureAPI, assets?: {ids:Set} }
 * @returns {{model:object, validation:object}} — המודל הקפוא + דוח אימות
 */
function buildPageModel(result, opts = {}) {
  const settings = result.settings;
  const pages = result.pages;
  const measure = opts.measure || null;
  const assetIds = opts.assets && opts.assets.ids instanceof Set ? opts.assets.ids : null;
  const diagnostics = [];

  // (1) הקרנת fragments חד-פעמית — **שלב 8 ביקורת §3.1: מצב 'production'.**
  // ההקרנה צורכת חותמות/LineModel בלבד; אסורה מדידת טקסט — כל חוסר נתון
  // מדווח ב-materializeFallbacks (מנוהל להלן כ-diagnostic + violation), ולא
  // מושחזר/מחושב מחדש במקרין. מוכח בבדיקת s8b (prototype-patch שזורק).
  const projected = materializeDocument(result, settings, { measure, mode: 'production' });
  // **ביקורת §3.1-6:** חשבונאות גלויה — כל נפילת materialization במסלול הייצור
  // נכנסת ל-diagnostics של המודל ול-violations של האימות (לא רק מונה שקט).
  const materializeFallbacks = projected.materializeFallbacks || [];
  for (const fb of materializeFallbacks) {
    diagnostics.push({ kind: 'materialize-fallback', ...fb });
  }

  // (2) מיפוי זהות: כל שורת תוכנית → נציגותה במודל (token/part) — בסיס
  // הוכחת הכיסוי המלא ואפס-הכפילויות (§21-1).
  const planLines = [];
  for (const page of pages) {
    if (page.type === 'endnotes') continue; // **פרוסה 2 (S8-END1):** עמודי הערות-הסיום — ה"טורים" שלהם הם רשומות הערות, לא שורות תוכנית; הכיסוי שלהן נבדק במיפוי ההערות להלן
    (page.columns || []).forEach((col, ci) => {
      col.forEach((ln, li) => {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        planLines.push({ tok, part: ln.part != null ? ln.part : null, page: page.index, col: ci, li, line: ln });
      });
    });
  }

  // (3) בניית העמודים: גיאומטריה סופית + זהות מקור + פריטי עמוד
  const modelPages = pages.map((page, pi) => {
    const pp = projected.pages[pi];
    const tpl = page.template;
    const geo = {
      width: r2(tpl.width), height: r2(tpl.height),
      contentBox: {
        top: r2(tpl.contentBox.top), bottom: r2(tpl.contentBox.bottom),
        left: r2(tpl.contentBox.left), right: r2(tpl.contentBox.right),
        height: r2(tpl.contentBox.height)
      },
      columns: (tpl.columns || []).map(c => ({ x: r2(c.x), w: r2(c.w) })),
      gutter: r2(tpl.gutter || 0),
      spanOffset: page.spanning ? r2(page.spanning.heightPx) : 0
    };

    // שורות: פס חוצה-טורים (מעל הטורים), ואז טורי הגוף בסדר קריאה (RTL: טור 0
    // הימני ראשון). עמודי סוגים מיוחדים (endnotes/TOC/שערים) — שורותיהם
    // הייעודיות מההקרנה, עם זהות המקור שלהם.
    const lines = [];
    const bodyLineOf = new Map(); // שורת-תוכנית → שורת-מודל (לכל סוגי העמודים; לעמודי endnotes יישאר ריק)
    if (pp && pp.spanning && pp.spanning.lines) {
      pp.spanning.lines.forEach((pl, li) => {
        const src = (page.spanning && page.spanning.lines[li]) || null;
        lines.push(placeLine(pl, src, { page: page.index, area: 'spanning', col: -1, li }));
      });
    }
    if (page.type === 'endnotes') {
      // "הטורים" של עמוד הערות מכילים אובייקטי הערה — השורות המוקרנות הן
      // endnote-title/endnote-note. **פרוסה 2 (S8-END1 — תיקון שורש):** הזהות
      // היא tokenId של ההערה כפי שההקרנה עצמה נושאת על השורה — לא ניחוש
      // התאמת-טקסט (56 הפרות planned-line-missing נגרמו ממנו).
      let li = 0;
      for (const pl of ((pp && pp.lines) || [])) {
        const tok = pl.tokenId != null ? pl.tokenId : null;
        lines.push(placeLine(pl, { tokenId: tok, part: null, seq: null, gapBeforePx: 0, aqStretch: 1 }, { page: page.index, area: 'endnotes', col: 0, li }));
        li++;
      }
    } else {
      // **Iteration-006 (RC-S1):** חותמות-פס ברמת העמוד (h2-siman — פתיחת הסימן)
      // מוקרנות בגיאומטריית עמוד מוחלטת ואין להן שורת-תוכנית בטורים —
      // הן מוצבות כאן כ-structural (לפני הטורים, בסדר הקריאה של העמוד)
      // ואינן משתתפות במיפוי שורות-הגוף. בלי זה הן הזיזו כל ציוות באחד
      // (ראו STAMPED_BAND_KINDS למעלה).
      for (const pl of ((pp && pp.lines) || [])) {
        if (!STAMPED_BAND_KINDS.has(pl.kind)) continue;
        lines.push(placeLine(pl, { gapBeforePx: 0, aqStretch: 1 }, { page: page.index, area: 'structural', col: -1, li: lines.length }));
      }
      // שורות הגוף: out.lines נבנה בסדר "טור 0 ואז טור 1" ואז הקרנות פריטי-עמוד
      // (הערות-צד וכו') — מסננים את אלה שאינן שורות גוף וממפים בסדר.
      const bodyProjected = ((pp && pp.lines) || []).filter(pl => !NON_BODY_LINE_KINDS.has(pl.kind) && !STAMPED_BAND_KINDS.has(pl.kind));
      // **פרוסה 2 (§4.2):** מילוי המיפוי שורת-תוכנית → שורת-מודל לפי אובייקט
      // (מדויק — טוקן אחד מתפרס על כמה שורות, וחיפוש לפי tokenId פגע במיקום התמונה).
      let cursor = 0;
      (page.columns || []).forEach((col, ci) => {
        col.forEach((ln) => {
          // **Iteration-001 (legacy parity):** רשומות-צל/זנב של פס H3 —
          // רזרבציות בלבד, אין להן הקרנה (אין דיו). מקבלות מציין projected:false
          // במודל ואינן צורכות משבצת במיפוי שורות-הגוף — ההזחה נשארת מדויקת.
          if (ln.h3BandShadow || ln.h3BandTail) {
            const placedShadow = placeLine(null, ln, { page: page.index, area: 'column', col: ci, li: lines.length });
            lines.push(placedShadow);
            bodyLineOf.set(ln, placedShadow);
            return;
          }
          const pl = bodyProjected[cursor++];
          const placed = placeLine(pl, ln, { page: page.index, area: 'column', col: ci, li: lines.length });
          lines.push(placed);
          bodyLineOf.set(ln, placed);
        });
      });
      // שאריות מוקרנות בלי שורות-תוכנית — תוכן מבני של העמוד (שערים/מותאם/
      // TOC): מיוצגות במודל כ-area=structural (§24 — כל פריטי העמוד במודל).
      for (; cursor < bodyProjected.length; cursor++) {
        const pl = bodyProjected[cursor];
        lines.push(placeLine(pl, { gapBeforePx: 0, aqStretch: 1 }, { page: page.index, area: 'structural', col: -1, li: lines.length }));
      }
      // **פרוסה 3 (§2.4 — כיסוי מלא):** שורות הערות-הצד/תיבות-המידע מוקרנות
      // כבר מהחותמות בגיאומטריה סופית (מילים+רוחבים+פיץ') — עד כאן סוננו
      // החוצה (NON_BODY_LINE_KINDS) והמודל איבד אותן; הזהות נשארת ב-sideNotes.
      // עתה הן נושאות area=margin — המקרין מצייר אותן כהקרנה טהורה.
      for (const pl of ((pp && pp.lines) || [])) {
        if (!NON_BODY_LINE_KINDS.has(pl.kind)) continue;
        lines.push(placeLine(pl, { gapBeforePx: 0, aqStretch: 1 }, { page: page.index, area: 'margin', col: -1, li: lines.length }));
      }
    }

    // הערות מרזב — זהות+עוגן+חותמה מהרשומה, מיקום סופי מההקרנה (התאמה לפי
    // marker+text — ההקרנה מסדרת לפי נתיבים, לא לפי סדר המערך).
    // עמודי הערות-סיום: הרשומות ב-page.notes; המיקום — משורות ההקרנה שלהן.
    let footnotes;
    if (page.type === 'endnotes') {
      const linesByTok = new Map();
      for (const l of lines) {
        if (l.area !== 'endnotes' || l.sourceTokenId == null) continue;
        if (!linesByTok.has(l.sourceTokenId)) linesByTok.set(l.sourceTokenId, []);
        linesByTok.get(l.sourceTokenId).push(l);
      }
      footnotes = (page.notes || []).map((n, ni) => {
        const ls = linesByTok.get(String(n.tokenId)) || [];
        const proj = ls.length
          ? { x: ls[0].x, y: ls[0].y, w: ls[0].w, words: ls.flatMap(l => l.words || []) }
          : null;
        // **פרוסה 2 (S8-END1):** noteId דטרמיניסטי גם להערות שלא קיבלו אחד
        // מהגוף (endnote-N מפורש) — זהות יציבה למקרינים ולאימות.
        const withId = n.noteId || (n.tokenId != null ? `en:${n.tokenId}` : `en:p${page.index}:${ni}`);
        return notePlacement(n.noteId ? n : { ...n, noteId: withId }, proj, { page: page.index, area: 'endnote-page' });
      });
    } else {
      const projFns = ((pp && pp.footnotes) || []).slice();
      footnotes = (page.footnotes || []).map(n => {
        const idx = projFns.findIndex(p => p.marker === String(n.marker || '') && p.text === String(n.text || '').replace(/\uE000/g, ' '));
        const proj = idx >= 0 ? projFns.splice(idx, 1)[0] : null;
        if (!proj) diagnostics.push({ kind: 'page-model-note-not-projected', note: n.noteId || n.tokenId || null, page: page.index });
        return notePlacement(n, proj, { page: page.index, area: 'footnote-gutter' });
      });
    }

    // פריטי עוגן (הערות-צד/תיבות מידע) — הצבה סופית מהמקצה המשותף
    const sideNotes = (page.sideNotes || []).map(sn => anchorPlacement(sn, { page: page.index }));

    // השלמת שלב 6: דיו עיטור חסר — diagnostic מפורש במודל (לא השתקה; הגיאומטריה נשמרת)
    for (const d of ((pp && pp.decorations) || [])) {
      if (d.inkMissing) diagnostics.push({ kind: 'page-model-ornament-ink-missing', page: page.index, ornId: d.ornId || null, slot: d.slot || null, kindStyle: d.kindStyle || null });
    }

    // **פרוסה 2 (§4.1 — השלמת החוזה):** ריהוט מלא + פס חוצה-טורים + תמונות
    // ממדרגה ראשונה. הכול מהחותמות/מה-LineModel — המקרינים יקראו ולא יחשבו.
    const header = pp && pp.header
      ? {
          y: r2(pp.header.y),
          baselineY: pp.header.baselineY != null ? r2(pp.header.baselineY) : null,
          slots: (pp.header.slots || []).map(s2 => ({
            pos: s2.pos, align: s2.align || null, text: s2.text,
            x: r2(s2.x), w: r2(s2.w), sizePt: s2.sizePt != null ? s2.sizePt : null,
            // **RC-HDR2-20261127:** בסיס פר-סלוט מהחותמת (GEO.HEADER_BASELINE —
            // מעל קו המפריד) + ascentEm פר-סלוט חייבים לשרוד את הסריאליזציה:
            // ה-PDF קורא את baselineY, ה-DOM מחשב top=baseline−ascent×size.
            ...(s2.baselineY != null ? { baselineY: r2(s2.baselineY) } : {}),
            ...(s2.ascentEm != null ? { ascentEm: s2.ascentEm } : {}),
            ...(s2.fontKey ? { fontKey: s2.fontKey } : {}),
            ...(s2.color ? { color: s2.color } : {})
          }))
        }
      : null;
    const folio = pp && pp.folio
      ? {
          x: pp.folio.x != null ? r2(pp.folio.x) : null,
          y: r2(pp.folio.y),
          w: pp.folio.w != null ? r2(pp.folio.w) : null,
          text: pp.folio.text || null,
          baselineY: pp.folio.baselineY != null ? r2(pp.folio.baselineY) : null,
          ...(pp.folio.fontKey ? { fontKey: pp.folio.fontKey } : {}),
          ...(pp.folio.color ? { color: pp.folio.color } : {}),
          ...(pp.folio.sizePt != null ? { sizePt: pp.folio.sizePt } : {})
        }
      : null;
    const spanning = pp && pp.spanning
      ? { x: r2(pp.spanning.x), y: r2(pp.spanning.y), w: r2(pp.spanning.w), h: r2(pp.spanning.h) }
      : null;

    // **§4.2 — תמונות פריטים ממדרגה ראשונה:** מלאי הנכסים של השורות שהוצבו,
    // עם גיאומטריה סופית (תיבת המילה בשורה הממוקמת / אזור הצף) ואינטגריטי
    // (resolved לפי ה-resolver של הפייפליין). ההחלטות (זרימה/גודל/מיקום) התקבלו
    // בתכנון — כאן רק הקרנה שלהן למודל.
    const images = [];
    const seenImgItems = new Set();
    (page.columns || []).forEach((col, ci) => {
      col.forEach((ln, liIdx) => {
        const lm = ln.lineModel;
        if (!lm || !Array.isArray(lm.assets) || !lm.assets.length) return;
        const ml = bodyLineOf.get(ln) || null;
        for (const a of lm.assets) {
          if (a.placement === 'float' && seenImgItems.has(a.itemId)) continue; // צף מופיע בכל שורות הפריסה שלו — רשומה אחת
          seenImgItems.add(a.itemId);
          if (a.placement === 'float') {
            // **פרוסה 3 (§2.2 — מיקום סופי מהסמכות):** תיבת הצף נקבעת כאן, בבניית
            // המודל — צד (מאילוץ השורה) + פס העמודה (מהתבנית) + שורת העוגן
            // (מההקרנה). הרנדרר מקבל x/y סופיים ואינו גוזר גאומטריה (§2.2).
            const colBox = (tpl.columns || [])[ci] || null;
            let fx = null;
            if (colBox && ml) {
              fx = a.side === 'left' ? colBox.x : (colBox.x + colBox.w - (a.widthPx || 0));
            }
            images.push({
              itemId: a.itemId, placement: 'float', side: a.side || null,
              assetId: a.assetId != null ? a.assetId : null,
              resourcePath: a.resourcePath != null ? a.resourcePath : null,
              x: fx != null ? r2(fx) : null,
              y: ml ? r2(ml.y) : null,
              w: a.widthPx != null ? r2(a.widthPx) : null,
              h: a.heightPx != null ? r2(a.heightPx) : null,
              lineId: ml ? ml.id : null,
              ...(a.natural ? { natural: { ...a.natural } } : {}),
              ...(a.fit ? { fit: { ...a.fit } } : {}),
              ...(a.sourceText != null ? { sourceText: a.sourceText } : {}),
              resolved: a.assetId != null ? (assetIds ? assetIds.has(a.assetId) : false) : false
            });
          } else {
            // inline/centered: תיבת המילה של התמונה בשורה הממוקמת (מה-x של המילה)
            const w = ml && ml.words ? ml.words.find(x => x.text === (a.sourceText || '')) : null;
            images.push({
              itemId: a.itemId, placement: a.placement || 'inline',
              align: a.align || null,
              assetId: a.assetId != null ? a.assetId : null,
              resourcePath: a.resourcePath != null ? a.resourcePath : null,
              x: w ? r2(w.x) : null, y: ml ? r2(ml.y) : null,
              w: w ? r2(w.w) : (a.advancePx != null ? r2(a.advancePx) : null),
              h: ml ? r2(ml.h) : null,
              baselineY: ml && ml.baselineY != null ? r2(ml.baselineY) : null,
              lineId: ml ? ml.id : null,
              ...(a.natural ? { natural: { ...a.natural } } : {}),
              ...(a.fit ? { fit: { ...a.fit } } : {}),
              ...(a.altText != null ? { altText: a.altText } : {}),
              ...(a.sourceText != null ? { sourceText: a.sourceText } : {}),
              resolved: a.assetId != null ? (assetIds ? assetIds.has(a.assetId) : false) : false
            });
          }
        }
      });
    });

    return {
      index: page.index,
      type: page.type,
      isRecto: page.isRecto === true,
      pageNumber: page.pageNumber != null ? page.pageNumber : null,
      folioDisplay: page.folioDisplay || null,
      geometry: geo,
      ...(spanning ? { spanning } : {}),
      // **פרוסה 3 (§2.4):** תיבת השער (כרום העטיפה — variant + rect) ותוכן
      // עמודים מותאמים — מהתוכנית/ההקרנה; המקרינים קוראים ואינם גוזרים.
      ...(page.shaarLayout ? { shaar: { variant: page.type === 'shaar-main' ? 'main' : page.type === 'shaar-sub' ? 'sub' : 'back', box: { x: r2(page.shaarLayout.box.x), y: r2(page.shaarLayout.box.y), w: r2(page.shaarLayout.box.w), h: r2(page.shaarLayout.box.h) } } } : {}),
      ...(pp && pp.custom ? { custom: { boxes: pp.custom.boxes.map(b => ({ x: r2(b.x), y: r2(b.y), w: r2(b.w), h: r2(b.h), text: b.text })), images: pp.custom.images.map(im => ({ x: r2(im.x), y: r2(im.y), w: r2(im.w), h: r2(im.h), src: im.src })) } } : {}),
      lines,
      footnotes,
      sideNotes,
      images,
      decorations: (pp && pp.decorations ? pp.decorations.map(d => ({
        x: r2(d.x), y: r2(d.y), w: r2(d.w), h: r2(d.h),
        kind: d.kind || null, slot: d.slot || null, inkType: d.inkType || null,
        // **השלמת חוזה העיטורים (שלב 6 — §6.1-6/§6.1-10):** המודל נושא את מלוא
        // ההצהרה — המקרינים (שלב 8) יקראו ולא יחשבו מחדש: זהות, מקור, דיו,
        // מידות טבעיות מול יעד, fit/scale, עוגן, clipping, z-order, הזמנה
        // ואילוצים. inkMissing מסומן גם כ-diagnostic למטה (אין השתקה).
        ...(d.ornId ? { ornId: d.ornId } : {}),
        ...(d.source != null ? { source: d.source } : {}),
        ...(d.image ? { image: d.image } : {}),
        // **פרוסה 5 (§4):** פעולות הציור שחושבו בהקרנה (svgToPdfOps) —
        // הכותב מהמודל אוסף אותן כמו שהכותב הקיים אוסף מהפרויקטור.
        ...(Array.isArray(d.pdfOps) ? { pdfOps: d.pdfOps } : {}),
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
      })) : []),
      header,
      folio,
      reservations: (page.reservations || []).map(r => ({ kind: r.kind, scope: r.scope, px: r2(r.px), reason: r.reason }))
    };
  });

  // (4) אינטגריטי נכסים (§21-10): כל מזהה נכס שהוצהר — נפתר או מדווח מפורש
  // **פרוסה 2 (S8-DL1 חלקי — תיקון שורש):** עד כאן הלולאה קראה ln.lineModel.assets
  // שאיש לא אייש (בדיקת §21-10 הייתה מתה). כעת line-model.js מאסף assets אמיתיים
  // לכל שורה (inline + צפים) עם assetId — והאינטגריטי נבדק בפועל: כל נכס שהוצהר
  // נפתר או מדווח מפורש.
  const resourceRefs = [];
  for (const page of pages) {
    for (const col of (page.columns || [])) {
      for (const ln of col) {
        const ast = ln.lineModel && ln.lineModel.assets;
        if (!ast || !ast.length) continue;
        for (const a of ast) {
          if (a.assetId == null) {
            diagnostics.push({ kind: 'page-model-resource-unidentified', itemId: a.itemId || null, page: page.index });
            continue;
          }
          const resolved = assetIds ? assetIds.has(a.assetId) : false;
          resourceRefs.push({ assetId: a.assetId, page: page.index, resolved });
          if (!resolved) diagnostics.push({ kind: 'page-model-resource-unresolved', assetId: a.assetId, page: page.index });
        }
      }
    }
  }

  // **פרוסה 2 (§4.1 — קישורים וסימניות):** עץ הכותרות (H1→רמה 1, H2→רמה 2)
  // וקישורי TOC (targetPage + מלבן השורה מהחותמת) — מיפוי טהור שהיה מחושב
  // בייצוא ה-PDF בנפרד; כעת המודל נושא אותם והמקרינים צורכים.
  const firstPageByToken = new Map();
  pages.forEach((pg) => {
    for (const ln of [...(pg.spanning ? pg.spanning.lines : []), ...(pg.columns || []).flat()]) {
      const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
    }
  });
  const outline = [];
  for (const b of (result.tokens || [])) {
    if (b.type !== 'heading' || (b.level !== 1 && b.level !== 2)) continue;
    const pg = firstPageByToken.get(b.id);
    if (pg == null) continue;
    outline.push({ title: b.text, page: pg, level: b.level });
  }
  const tocLinks = [];
  for (const tp of pages) {
    if (tp.type !== 'toc-general' && tp.type !== 'toc-detail') continue;
    const rows = (tp.tocLayout && tp.tocLayout.rows) || [];
    for (const row of rows) {
      if (row.kind === 'group') {
        for (const it of (row.items || [])) {
          if (it.targetPage != null) tocLinks.push({ page: tp.index, x: r2(it.x), y: r2(it.y), w: r2(it.w), h: r2(it.h), targetPage: it.targetPage });
        }
      } else if (row.targetPage != null) {
        tocLinks.push({ page: tp.index, x: r2(row.x), y: r2(row.y), w: r2(row.w), h: r2(row.h), targetPage: row.targetPage });
      }
    }
  }

  const model = {
    schema: PAGE_MODEL_SCHEMA,
    document: {
      contentHashIn: result.contentHashIn || null,
      tokensCount: (result.tokens || []).length,
      plannedPages: pages.length,
      outline,
      tocLinks
    },
    pages: modelPages,
    // **ביקורת §3.1-6:** חשבונאות גלויה — כל diagnostic שנאסף בבנייה נושא במודל
    // (נפילות materialization, הערות שלא הוקרנו, דיו עיטור חסר, נכסים לא פתורים).
    diagnostics,
    meta: {
      resources: { referenced: resourceRefs.length, unresolved: resourceRefs.filter(r => !r.resolved).length },
      materializeFallbacks: materializeFallbacks.length
    }
  };

  // (5) אימות (§21) — לפני ההקפאה; הדוח בר-השוואה בין ריצות. נפילות
  // materialization במסלול הייצור הן violation (ברירת מחדל: 0 — ה-pipeline
  // מטביע חותמות; כל סטייה נראית ב-ledger ובבדיקות הקורפוס).
  const validation = validatePageModel(model, { planPages: pages, tokens: result.tokens || [], planLines, materializeFallbacks });

  // (6) hashes דטרמיניסטיים — גיאומטריה נפרדת מתוכן (§7.1-8/9)
  model.geometryHash = geometryHashOf(model);
  model.contentHash = contentHashOf(model);

  // (7) הקפאה עמוקה — המודל אינו משתנה עוד (§7.1-12)
  deepFreeze(model);
  return { model, validation };
}

/** התאמת שורת endnote מוקרנת לרשומת ההערה שלה (לפי טקסט+סמן). */
function matchEndnoteLine(pl, page) {
  for (const col of (page.columns || [])) {
    for (const n of col) {
      const txt = pl.words.map(w => w.text).join(' ');
      if (String(n.text || '').includes(txt.slice(0, 12)) || txt.includes(String(n.text || '').slice(0, 12))) {
        return { tokenId: n.tokenId != null ? n.tokenId : null, part: null, seq: null };
      }
    }
  }
  return { tokenId: null, part: null, seq: null };
}

/** מיקום שורה: גיאומטריה סופית + זהות מקור + fragments ממוקמים. */
function placeLine(pl, srcLine, where) {
  // **פרוסה 3 (§2.2 — זהות מקור):** ההקרנה עצמה נושאת tokenId (שורות margin
  // מהחותמות, למשל) — נפילה אליה כשאין מקור שורה מפורש.
  const tok = (srcLine && (srcLine.tokenId != null ? srcLine.tokenId : (srcLine.meta && srcLine.meta.tokenId)))
    || (pl && pl.tokenId != null ? pl.tokenId : null);
  const id = `p${where.page}.${where.area === 'spanning' ? 'sp' : (where.area === 'endnotes' ? 'en' : 'c' + where.col)}.${where.li}`;
  if (!pl) {
    // **Iteration-001:** רשומת-צל (h3band-shadow) — רזרבציה מתוכננת ללא הקרנה;
    // ה-kind נשמר כדי שהוולידטור יבחין בה מכשל הקרנה אמיתי. words ריק —
    // כל צרכן שסופר מילים לא יישבר על שורה בלי הקרנה.
    return { id, sourceTokenId: tok != null ? String(tok) : null, kind: (srcLine && srcLine.kind) || null, words: [], projected: false, ...where };
  }
  return {
    id,
    sourceTokenId: tok != null ? String(tok) : null,
    part: srcLine && srcLine.part != null ? srcLine.part : null,
    seq: srcLine && srcLine.seq != null ? srcLine.seq : null,
    kind: pl.kind || 'paragraph',
    // **Iteration-001 (legacy parity):** דגל פס-H3 באמצע עמוד — גיאומטריית
    // עמוד (המקרינים מציבים אותו ברמת העמוד, לא בתוך קופסת טור).
    ...(pl.midBand ? { midBand: true } : {}),
    // **Iteration-006 (RC-W1):** דגלי פסקת-חלון — שורות 0–1 נמדדו ברוחב
    // מוקטן ושורה 0 נושאת את מילת-החלון; המקרינים (DOM/PDF) והאודיט
    // זקוקים להם כדי לסמן line--window-wrap / w--window (כמו המורשת).
    ...(pl.window ? { window: true, windowW: r2(pl.windowW) } : {}),
    ...(pl.windowWords ? { windowWords: pl.windowWords } : {}),
    level: pl.level != null ? pl.level : null,
    isLast: pl.isLast === true,
    align: pl.align || null,
    sizePt: pl.sizePt != null ? pl.sizePt : null,
    x: r2(pl.x), y: r2(pl.y), w: r2(pl.w), h: r2(pl.h),
    baselineY: pl.baselineY != null ? r2(pl.baselineY) : null,
    ascentPx: pl.ascentPx != null ? r2(pl.ascentPx) : null,
    descentPx: pl.descentPx != null ? r2(pl.descentPx) : null,
    gapBeforePx: srcLine && srcLine.gapBeforePx != null ? r2(srcLine.gapBeforePx) : 0,
    aqStretch: srcLine && srcLine.aqStretch != null ? r2(srcLine.aqStretch) : 1,
    words: (pl.words || []).map(wd => ({
      text: wd.text, x: r2(wd.x), w: r2(wd.w),
      ...(wd.sizePt != null ? { sizePt: wd.sizePt } : {}),
      ...(wd.fontKey != null ? { fontKey: wd.fontKey } : {}),
      ...(wd.baselineY != null ? { baselineY: r2(wd.baselineY) } : {}),
      ...(wd.color != null ? { color: wd.color } : {}),
      ...(wd.mk ? { mk: true } : {})
    })),
    projected: true,
    ...where,
    // **פרוסה 3 (§2.2 — מאפייני עיצוב מהסמכות):** מחלקת הסגנון/משקל/ריווח-
    // אותיות של שורות מובנות (שערים) — עוברים מהחותמת למודל; המקרין קורא.
    ...(pl.cls ? { styleClass: String(pl.cls) } : {}),
    ...(pl.bold ? { bold: true } : {}),
    ...(pl.letterSpacingPx ? { letterSpacingPx: r2(pl.letterSpacingPx) } : {})
  };
}

/** רשומת הערה במודל: זהות + עוגן + מדדים + מיקום סופי מההקרנה. */
function notePlacement(n, proj, where) {
  return {
    noteId: n.noteId || null,
    kind: n.kind || 'footnote',
    sourceId: n.sourceId || (n.tokenId != null ? String(n.tokenId) : null),
    anchorId: n.anchorId || (n.tokenId != null ? String(n.tokenId) : null),
    marker: n.marker != null ? String(n.marker) : null,
    text: String(n.text || ''),
    continuationOf: n.continuationOf || null,
    wordRange: n.wordRange ? { from: n.wordRange.from, to: n.wordRange.to } : null,
    lineH: n.lineH != null ? r2(n.lineH) : null,
    heightPx: n.heightPx != null ? r2(n.heightPx) : null,
    linesCount: n.linesCount != null ? n.linesCount : null,
    stampValid: stampIsValid(n),
    x: proj ? r2(proj.x) : null, y: proj ? r2(proj.y) : null,
    w: proj ? r2(proj.w) : null,
    // **פרוסה 5 (§4 — זהות גופן ל-PDF):** מילות ההערה נושאות גם גודל/מפתח/
    // צבע מההקרנה — הכותב מהמודל מצייר אותן בזהותן האמיתית (לא 8.5 קבוע).
    words: proj && proj.words ? proj.words.map(wd => ({
      text: wd.text, x: r2(wd.x), w: r2(wd.w),
      baselineY: wd.baselineY != null ? r2(wd.baselineY) : null,
      ...(wd.sizePt != null ? { sizePt: wd.sizePt } : {}),
      ...(wd.fontKey != null ? { fontKey: wd.fontKey } : {}),
      ...(wd.color != null ? { color: wd.color } : {}),
      ...(wd.mk ? { mk: true } : {})
    })) : [],
    ...where
  };
}

/** רשומת פריט עוגן (הערת-צד / תיבת מידע): הצבה סופית מהמקצה המשותף. */
function anchorPlacement(sn, where) {
  return {
    noteId: sn.noteId || null,
    itemKind: sn.itemKind || 'side-note',
    sourceId: sn.sourceId || (sn.ownToken != null ? String(sn.ownToken) : null),
    anchorId: sn.anchorId != null ? String(sn.anchorId) : null,
    text: String(sn.text || ''),
    x: sn.x != null ? r2(sn.x) : null,
    yTop: sn.yTop != null ? r2(sn.yTop) : null,
    w: (sn.boxSpec && sn.boxSpec.widthPx) || sn.colWidth || null,
    heightPx: sn.heightPx != null ? r2(sn.heightPx) : null,
    lineH: sn.lineH != null ? r2(sn.lineH) : null,
    rowsCount: sn.noteRows ? sn.noteRows.length : null,
    stampValid: stampIsValid(sn),
    boxChrome: sn.boxChrome ? { ...sn.boxChrome } : null,
    ...where
  };
}

// ─── האימות (§21) ───

/**
 * validatePageModel — אינווריאנטים. מחזיר דוח בר-השוואה בין ריצות:
 * { checks: {name: count}, violations: [{code, detail}], summary: {...} }.
 */
function validatePageModel(model, ctx = {}) {
  const planPages = ctx.planPages || [];
  const tokens = ctx.tokens || [];
  const planLines = ctx.planLines || [];
  const materializeFallbacks = ctx.materializeFallbacks || [];
  const checks = Object.create(null);
  const violations = [];
  const check = (name) => { checks[name] = (checks[name] || 0) + 1; };
  const tokenIds = new Set(tokens.map(t => t.id));

  // (0) **ביקורת §3.1-6:** נפילות materialization במסלול הייצור — כל אחת
  // violation מזוהה (בייצור התקין: 0 — הוכח בקורפוס). לא מונה שקט.
  for (const fb of materializeFallbacks) {
    violations.push({ code: 'materialize-fallback', detail: `${fb.kind}@${fb.page != null ? 'p' + fb.page : (fb.line != null ? 'line:' + fb.line : 'x')}` });
    check('materialize-purity');
  }

  // (1) כיסוי מלא: כל שורת תוכנית מיוצגת במודל (לפי token+part); אין כפילויות מזהה
  const modelLineIds = new Set();
  const modelLinesByTokenPart = new Map();
  for (const page of model.pages) {
    for (const ln of page.lines) {
      if (ln.id != null) {
        if (modelLineIds.has(ln.id)) violations.push({ code: 'duplicate-line-id', detail: ln.id });
        modelLineIds.add(ln.id);
      }
      if (ln.sourceTokenId != null) {
        const key = `${ln.sourceTokenId}|${ln.part != null ? ln.part : ''}`;
        if (!modelLinesByTokenPart.has(key)) modelLinesByTokenPart.set(key, 0);
        modelLinesByTokenPart.set(key, modelLinesByTokenPart.get(key) + 1);
      }
      check('line-coverage');
    }
  }
  for (const info of planLines) {
    const key = `${info.tok}|${info.part != null ? info.part : ''}`;
    if (info.tok != null && !(modelLinesByTokenPart.get(key) > 0)) {
      violations.push({ code: 'planned-line-missing', detail: `${key}@p${info.page}` });
    }
  }
  // כמות השורות במודל = כמות השורות בתוכנית (טורים + פסים חוצי-טורים;
  // אין שורות חדשות/מוכפלות)
  const planSpanning = planPages.reduce((a, p) => a + (p.spanning && p.spanning.lines ? p.spanning.lines.length : 0), 0);
  const modelBodyLines = model.pages.reduce((a, p) => a + p.lines.filter(l => l.area === 'column' || l.area === 'spanning').length, 0);
  if (modelBodyLines !== planLines.length + planSpanning) {
    violations.push({ code: 'line-count-mismatch', detail: `plan=${planLines.length + planSpanning} (cols ${planLines.length}+span ${planSpanning}) model=${modelBodyLines}` });
  }

  // (2) זהות מקור לכל fragment: שורה מוקרנת בלי sourceTokenId ⇒ הפרה
  // (שורות סינתטיות — כותרת עמוד הערות/תוכן מבני של שערים/TOC — מסומנות
  // area=endnotes/structural ופטורות מטוקן-גוף; הן תוכן עמוד, לא גוף זורם)
  for (const page of model.pages) {
    for (const ln of page.lines) {
      if (ln.projected === false) {
        // **Iteration-001 (legacy parity):** רשומת-צל של פס H3 היא רזרבציה
        // מתוכננת — אין לה הקרנה מעצם הגדרתה (אין דיו). כל שורה אחרת שלא
        // הוקרנה נותרת הפרה מלאה.
        if (ln.kind !== 'h3band-shadow' && ln.kind !== 'h3band-tail') {
          violations.push({ code: 'line-not-projected', detail: `${page.index}:${ln.id}` });
        }
      } else if (ln.area !== 'endnotes' && ln.area !== 'structural' && ln.sourceTokenId == null) {
        violations.push({ code: 'line-without-source', detail: `${page.index}:${ln.id}` });
      } else if (ln.sourceTokenId != null && !tokenIds.has(ln.sourceTokenId)) {
        violations.push({ code: 'line-unknown-token', detail: `${ln.id}→${ln.sourceTokenId}` });
      }
      check('source-identity');
    }
  }

  // (3) גבולות: אין placement מחוץ לתיבת התוכן ללא diagnostic (בסובלנות דיו)
  for (const page of model.pages) {
    const cb = page.geometry.contentBox;
    for (const ln of page.lines) {
      if (ln.projected === false || ln.y == null) continue;
      if (ln.area === 'column' && (ln.y < cb.top - BOUNDS_TOLERANCE_PX || ln.y + (ln.h || 0) > cb.bottom + BOUNDS_TOLERANCE_PX)) {
        violations.push({ code: 'line-outside-content-box', detail: `${page.index}:${ln.id} y=${ln.y} h=${ln.h}` });
      }
      check('bounds');
    }
  }

  // (4) סדר קריאה: בכל טור, y מונוטוני לא-יורד (סדר השורות = סדר הקריאה)
  for (const page of model.pages) {
    const perCol = new Map();
    for (const ln of page.lines) {
      if (ln.area !== 'column' || ln.y == null) continue;
      if (!perCol.has(ln.col)) perCol.set(ln.col, -Infinity);
      const lastY = perCol.get(ln.col);
      if (ln.y < lastY - BOUNDS_TOLERANCE_PX) {
        violations.push({ code: 'reading-order-break', detail: `${page.index}:${ln.id} y=${ln.y} < ${lastY}` });
      }
      perCol.set(ln.col, Math.max(lastY, ln.y + (ln.h || 0)));
      check('reading-order');
    }
  }

  // (5) גיאומטריית פערים: gapBeforePx ≥ 0 (חוזה FX-6)
  for (const page of model.pages) {
    for (const ln of page.lines) {
      if (ln.gapBeforePx != null && ln.gapBeforePx < 0) {
        violations.push({ code: 'negative-gap', detail: `${page.index}:${ln.id}` });
      }
      check('gaps');
    }
  }

  // (6) הערות מקושרות לעוגן; חותמות תקינות; אין marker יתום
  for (const page of model.pages) {
    for (const n of page.footnotes) {
      if (!n.noteId) violations.push({ code: 'note-without-id', detail: `p${page.index}` });
      if (n.anchorId == null || !tokenIds.has(n.anchorId)) {
        violations.push({ code: 'note-anchor-orphan', detail: `${n.noteId}→${n.anchorId}` });
      }
      if (n.stampValid !== true) violations.push({ code: 'note-stamp-invalid', detail: `${n.noteId}@p${page.index}` });
      check('note-linkage');
    }
    for (const sn of page.sideNotes) {
      if (!sn.noteId) violations.push({ code: 'anchor-item-without-id', detail: `p${page.index}` });
      if (sn.anchorId == null || !tokenIds.has(sn.anchorId)) {
        violations.push({ code: 'anchor-item-orphan', detail: `${sn.noteId}→${sn.anchorId}` });
      }
      if (sn.stampValid !== true) violations.push({ code: 'anchor-item-stamp-invalid', detail: `${sn.noteId}@p${page.index}` });
      check('anchor-linkage');
    }
  }

  // (7) הזמנות: כל הזמנה בתוכנית נכנסה למודל (נצרכה או מדווחת)
  let planReservations = 0, modelReservations = 0;
  for (const pp of planPages) planReservations += (pp.reservations || []).length;
  for (const page of model.pages) modelReservations += page.reservations.length;
  if (planReservations !== modelReservations) {
    violations.push({ code: 'reservations-mismatch', detail: `plan=${planReservations} model=${modelReservations}` });
  }
  checks['reservations'] = modelReservations;

  // (8) נכסים: כל נכס נפתר או מדווח (§21-10)
  if (model.meta && model.meta.resources && model.meta.resources.unresolved > 0) {
    violations.push({ code: 'resources-unresolved', detail: String(model.meta.resources.unresolved) });
  }

  // (9) סכמה ו-hashes קיימים (דטרמיניזם/immutable נאכפים חיצונית בבדיקות כפולות)
  if (model.schema !== PAGE_MODEL_SCHEMA) violations.push({ code: 'bad-schema', detail: model.schema });

  const total = Object.values(checks).reduce((a, b) => a + b, 0);
  return { checks, violations, summary: { pass: total, total, violations: violations.length, schema: PAGE_MODEL_SCHEMA } };
}

// ─── hashes דטרמיניסטיים (§7.1-8/9) ───

/** geometryHash — טביעת-אצבע גיאומטרית: מיקומים וגדלים סופיים בלבד (בלי טקסט). */
function geometryHashOf(model) {
  // **תיקון "Invalid string length" (מסמכים גדולים):** האש אינקרמנטלי עמוד-עמוד —
  // זהות בתים מלאה עם JSON.stringify(canon) הישן, בלי למרטיאלז מחרוזת בגודל
  // המודל כולו (V8: ~512MB תווים הסף — RangeError שהפיל מסמכים גדולים בסוף
  // העימוד, אחרי דקות של עבודת פריסה).
  return sha256OfJsonArrayElements((function* canonPages() {
    for (const p of model.pages) {
      yield {
        i: p.index, t: p.type,
        l: p.lines.map(l => l.projected === false ? '∅' : `${l.id}:${l.x},${l.y},${l.w},${l.h},${l.baselineY}:${(l.words || []).map(w => `${Math.round(w.x * 10) / 10}+${Math.round(w.w * 10) / 10}`).join(',')}`),
        fn: p.footnotes.map(n => `${n.noteId}:${n.x},${n.y},${n.w},${n.h}`),
        sn: p.sideNotes.map(s => `${s.noteId}:${s.x},${s.yTop},${s.heightPx}`),
        d: (p.decorations || []).map(d => `${d.kind}:${d.x},${d.y},${d.w},${d.h}`)
      };
    }
  })());
}

/** contentHash — הוכחת שימור מקור ברמת המודל הסופי (טקסט השורות בסדר הקריאה). */
function contentHashOf(model) {
  // **תיקון "Invalid string length":** כמו geometryHashOf — אינקרמנטלי, בלי
  // מחרוזת קנון אחת ענקית; זהות בתים עם הייצוג הישן נשמרת.
  return sha256OfJsonArrayElements((function* canonPages() {
    for (const p of model.pages) {
      yield {
        i: p.index,
        l: p.lines.map(l => (l.words || []).map(w => w.text).join('\u00A7')),
        fn: p.footnotes.map(n => `${n.marker || ''}§${n.text}`),
        sn: p.sideNotes.map(s => s.text)
      };
    }
  })());
}

module.exports = {
  PAGE_MODEL_SCHEMA,
  buildPageModel,
  validatePageModel,
  deepFreeze,
  geometryHashOf,
  contentHashOf
};
