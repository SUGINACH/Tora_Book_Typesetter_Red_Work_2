// src/engine/typography/font-resolver.js — Font Resolver יחיד (שלב 3, §3.1-5/6)
'use strict';

/**
 * **חוזה:** spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md §3.1-5 — "להגדיר Font
 * Resolver יחיד שמחזיר font identity, face, metrics, fallback שנבחר והסיבה
 * לבחירה. אין fallback שקט שאינו מופיע באבחון."
 *
 * **הרחבת הקיים, לא מערכת מקבילה (§3.1-12):** הרישום הגולמי נשאר
 * measure-api.registerFont (hmtx/cmap/kern/GPOS/OS2 — font-metrics). ה-resolver
 * הוא השכבה הקנונית מעליו: זהות מהבתים (content-addressed, fnt-<sha256[:14]>),
 * מטריקות מסוכמות, שרשרת fallback מפורשת עם סיבה, ואבחון לכל דילוג.
 *
 * **אין להסתמך על שם גופן בלבד כשקיימים קבצי גופן אמיתיים** — הזהות
 * המדויקת היא מהבתים; השם הוא כינוי בלבד (alias), ורישום שני קבצים שונים
 * תחת אותו alias מדווח במפורש.
 */

const { sha256Hex } = require('../assets/hash256');
const fm = require('./font-metrics');

/** רשומות ה-resolver: fontId → record; alias (שם משפחה) → fontId. */
const _fonts = new Map();
const _aliases = new Map();
/** מנעול סנכרון ניקוי דו-כיווני font-resolver ↔ measure-api (מונע נצנוץ). */
let _clearSync = false;

/**
 * רישום גופן קנוני — בתים אמיתיים + כינוי.
 * @param {string} alias — כינוי המשפחה מההגדרות (למשל 'Frank Ruhl Libre')
 * @param {Uint8Array|Buffer} bytes
 * @param {{face?:string, source?:string, role?:string}} meta
 * @returns {{ok:boolean, fontId?:string, record?:object, code?:string, message?:string}}
 */
function registerFont(alias, bytes, meta = {}) {
  if (typeof alias !== 'string' || !alias.trim()) return { ok: false, code: 'bad-alias', message: 'כינוי גופן ריק' };
  if (!bytes || !bytes.length) return { ok: false, code: 'empty-bytes', message: `גופן ללא בתים: ${alias}` };
  const parsed = fm.parseFont(bytes);
  if (!parsed.ok) return { ok: false, code: 'unparseable-font', message: `פענוח הגופן נכשל (${alias}): ${parsed.error}` };
  const sourceHash = sha256Hex(bytes);
  const fontId = `fnt-${sourceHash.slice(0, 14)}`;
  let record = _fonts.get(fontId);
  if (record && record.sourceHash !== sourceHash) {
    return { ok: false, code: 'font-id-prefix-collision', fontId,
      message: 'A short fontId prefix collision was detected; the existing font record was not replaced' };
  }
  const isNew = !record;
  if (isNew) {
    record = {
      fontId,
      aliases: [],
      face: meta.face || alias,
      source: meta.source || null,
      sourceHash,
      fingerprint: sourceHash.slice(14, 28), // טביעת אצבע משלימה (מעבר המזהה)
      unitsPerEm: parsed.font.unitsPerEm,
      numGlyphs: parsed.font.numGlyphs,
      metrics: {
        unitsPerEm: parsed.font.unitsPerEm,
        ascenderEm: parsed.font.ascender / parsed.font.unitsPerEm,
        descenderEm: Math.abs(parsed.font.descender) / parsed.font.unitsPerEm,
        capHeightEm: fm.capHeightEmOf(parsed.font),
        hasKerning: !!(parsed.font.kernPairs && parsed.font.kernPairs.size)
      },
      // הפרנסר החי — לשימוש MeasureAPI (font-metrics) דרך זהות, לא דרך שם
      font: parsed.font
    };
    _fonts.set(fontId, record);
  }
  // alias כפול על גופן שונה — דחייה מפורשת (לא החלפה שקטה)
  const prevId = _aliases.get(alias);
  if (prevId != null && prevId !== fontId) {
    return { ok: false, code: 'alias-conflict', message: `הכינוי '${alias}' רשום כבר לגופן אחר (${prevId}); רישום כפול נדחה`, fontId: prevId };
  }
  if (prevId == null) {
    _aliases.set(alias, fontId);
    record.aliases.push(alias);
    // **רישום יחיד (single entry point):** הפרנסר נרשם גם במרישמות של measure-api
    // (ליתור forFamily/resolveMeasureImpl) — בלי פירוח חורג (מנוע מחזור טעינה: require עצם בזמן הקריאה).
    try {
      const ma = require('./measure-api');
      // **תיקון ביקורת PR #22:** מועברים גם הבתים — כדי שזהות התוכן של הרישום
      // תישמר במדווק גם בצד measure-api (חית סביבה ומפתח מטמון).
      ma.restoreFontRegistration(alias, parsed.font, bytes);
    } catch (_) { /* measure-api טעון לא נטען (מחזור) — הרישום יושלם בטעינתו */ }
  }
  return { ok: true, fontId, record, isNew };
}

/** פתרון לפי כינוי משפחה — עם שרשרת fallback מפורשת ואבחון לכל דילוג. */
function resolveFont(alias, opts = {}) {
  const chain = [];
  const diagnostics = [];
  const tryAlias = (a, reason) => {
    const fontId = _aliases.get(String(a));
    if (fontId != null && _fonts.has(fontId)) {
      chain.push({ alias: String(a), fontId, chosen: true, reason: reason || 'direct' });
      return { ok: true, fontId, record: _fonts.get(fontId), fallbackUsed: reason != null && reason !== 'direct', fallbackChain: chain, diagnostics };
    }
    chain.push({ alias: String(a), fontId: null, chosen: false, reason: reason || 'not-registered' });
    diagnostics.push({ code: 'font-not-registered', alias: String(a), message: `הגופן '${a}' אינו רשום; נסיון fallback` });
    return null;
  };
  // 1) המשפחה המבוקשת עצמה
  let hit = alias != null ? tryAlias(alias) : null;
  // 2) fallback מפורש מהקריאה (למשל מחסנית fontStack)
  if (!hit && opts.fallbacks) {
    for (const fb of opts.fallbacks) {
      hit = tryAlias(fb, 'stack-fallback');
      if (hit) break;
    }
  }
  // 3) ברירת המחדל מההגדרות (body-font) — אם שונה מהמבוקש
  if (!hit && opts.defaultFamily && String(opts.defaultFamily) !== String(alias)) {
    hit = tryAlias(opts.defaultFamily, 'settings-default');
  }
  if (!hit) {
    return {
      ok: false, code: 'font-unavailable', alias: String(alias),
      message: `הגופן '${alias}' אינו זמין ואין fallback רשום — מדידה קנונית לא תתבצע ללא אבחון`,
      fallbackChain: chain, diagnostics
    };
  }
  return hit;
}

/** פתרון לפי זהות (מהמודל הקנוני — styleRef/fontId). */
function resolveFontById(fontId) {
  const rec = _fonts.get(String(fontId));
  if (!rec) return { ok: false, code: 'unknown-font-id', fontId: String(fontId), message: `מזהה גופן לא רשום: ${fontId}` };
  return { ok: true, fontId: String(fontId), record: rec, fallbackUsed: false, fallbackChain: [{ alias: rec.face, fontId: String(fontId), chosen: true, reason: 'by-id' }], diagnostics: [] };
}

/** הפרנסר החי לפי מזהה — הגישה הקנונית של MeasureAPI למטריקות אמת. */
function fontOf(fontId) {
  const rec = _fonts.get(String(fontId));
  return rec ? rec.font : null;
}

/** כינוי→מזהה (לחיבור styleRef לזהות). */
function fontIdOfAlias(alias) {
  return _aliases.get(String(alias)) || null;
}

/** **תיקון ביקורת PR #22 (סנכרון ניקוי):** ניקוי ה-resolver מסונכרן גם למרשמות
 * measure-api — אין מצב שבו ה-resolver נקי אך המדידה עדיין מודדת דרך רישום ישן, ולהפך
 * (clearRegisteredFonts מסונכרן בחזרה). המנעול מונע נצנוץ אינסופי. */
function clearFontResolver() {
  _fonts.clear();
  _aliases.clear();
  if (_clearSync) return;
  _clearSync = true;
  try {
    const ma = require('./measure-api');
    ma.clearRegisteredFonts();
  } catch (_) { /* measure-api לא נטען — אין מה לסנכרן */ }
  finally { _clearSync = false; }
}

/** **תיקון ביקורת PR #22:** הסרת כינוי בודד — מסונכרנת גם למרשמות measure-api
 * (unregisterFont שם). רשומת הגופן נשארת כל עוד יש לה כינויים אחרים (אותה זהות
 * תוכן תחת כמה כינויים היא מצב חוקי). */
function unregisterAlias(alias) {
  const a = String(alias);
  const fontId = _aliases.get(a);
  if (fontId == null) return { ok: false, code: 'unknown-alias', alias: a };
  _aliases.delete(a);
  const rec = _fonts.get(fontId);
  if (rec) {
    rec.aliases = rec.aliases.filter((x) => x !== a);
    if (!rec.aliases.length) _fonts.delete(fontId); // אין עוד כינוי — הרשומה מתפנה
  }
  if (_clearSync) return { ok: true, removed: a, fontId };
  _clearSync = true;
  try {
    const ma = require('./measure-api');
    ma.unregisterFont(a);
  } catch (_) { /* measure-api לא נטען */ }
  finally { _clearSync = false; }
  return { ok: true, removed: a, fontId };
}
function fontCount() { return _fonts.size; }
function aliasCount() { return _aliases.size; }

module.exports = {
  registerFont, resolveFont, resolveFontById, fontOf, fontIdOfAlias,
  clearFontResolver, unregisterAlias, fontCount, aliasCount
};
