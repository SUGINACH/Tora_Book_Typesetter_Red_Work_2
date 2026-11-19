// src/engine/typography/measure-api.js — Measurement single entry (REQ-LB-01) + Hebrew glyph-width metrics
'use strict';

/**
 * MeasureAPI — הכניסה היחידה למדידת רוחב/גובה. אסור לקרוא offsetHeight מפוזר (lint ב‑CI).
 * מימוש A = 'table' (טבלאות מכוילות — ברירת המחדל, המשך רציפות S1–S11);
 * מימוש B = 'font-metrics' (S12: טבלאות אמת מקובץ גופן שנטען — hmtx/cmap/kern/GPOS)
 * חתימה זהה; הפרופיל נרשם דרך registerFont ומופעל דרך ההגדרה measure-impl.
 */

const { charWidthEm, FONT_PROFILES } = require('./measure-table');
const fm = require('./font-metrics');
const { sha256Hex } = require('../assets/hash256');

// **S5.2 (תיקון 5 — tracking שאין לאף מרנדר):** ברירת המחדל הייתה 0.02em —
// המדידה "הרחיבה" כל שורה ב~2% יחסית לדיו: אף מרנדר (DOM/PDF) אינו מצייר
// letter-spacing, והפרויקטור הגיאומטרי ערבב באותה שורה מדידות עם tracking=0
// (מפורש) וברירת המחדל. כעת 0 — המודל = הדיו. נתיב המורשת אינו מושפע:
// כל קריאותיו מעבירות tracking=0 במפורש (אומת בסקירה).
const DEFAULT_TRACKING = 0; // em

/** **ביקורת בטיחות 19.11 (U-14):** תקרת מטמון המחרוזות לכל מופע MeasureAPI —
 * אותן קבועים כמו מטמון הפריטים (מדיניות חסימה אחת לכל מטמוני המדידה). */
const STRING_CACHE_MAX_ENTRIES = 65536;
const STRING_CACHE_EVICT_BATCH = 8192;

/** גופנים רשומים (פרופיל → פרנסר). ההרשמה מפורשת — אין טעינת רשת (offline). */
const registeredFonts = new Map();
/** **תיקון ביקורת PR #22 (מפתח מטמון):** זהות תוכן לכל רישום — `fnt-<sha256[:14]>`
 * (אותה נוסחה כמו font-resolver). השם הוא כינוי בלבד; החית של הסביבה ומפתח
 * המטמון נגזרים מהזהות, לא מהשם — שני קבצים שונים תחת אותו שם לא יחלקו מדידות. */
const _fontContentIds = new Map();
/** מנעול סנכרון ניקוי דו-כיווני measure-api ↔ font-resolver (מונע נצנוץ). */
let _fontClearSync = false;
/** מזכר חית סביבה (מבוטל בכל שינוי רישום) — מדידות רבות לא ימיינו שמות שוב ושוב. */
let _envFpMemo = null;

/** טביעת מבנה לגופן שנרשם ללא בתים (שחזור) — חלשה מזהות-תוכן אך דטרמיניסטית. */
function _structuralFontFp(font) {
  if (!font) return 'none';
  return `u${font.unitsPerEm || 0}g${font.numGlyphs || 0}a${font.ascender || 0}d${font.descender || 0}`;
}

function _invalidateEnvFp() { _envFpMemo = null; }

/**
 * רישום גופן למדידת אמת (S12.1-5). קלט: בתים בלבד (Uint8Array/Buffer).
 * @returns {{ok:boolean, error?:string, profile?:object, glyphCount?:number, mappedChars?:number}}
 */
function registerFont(profileName, bytes) {
  const res = fm.parseFont(bytes);
  if (!res.ok) return { ok: false, error: res.error };
  registeredFonts.set(String(profileName), res.font);
  _fontContentIds.set(String(profileName), `fnt-${sha256Hex(bytes).slice(0, 14)}`);
  _invalidateEnvFp();
  // **S6.0 (R7-L2):** גם רישום מנקה את מטמון ה-API-פר-משפחה — בעבר רק
  // ההסרה ניקתה ⇒ רישום מחדש של אותה משפחה החזיר מופע ישן מהמטמון
  // (קשור לגופן הקודם) והמדידה המשיכה במטריקות הישנות.
  _familyApiCache.clear();
  // **אופטימיזציה (19.11):** ניקוי מופעי ה-fallback המשותפים — אותה סיבה
  // בדיוק (מופע font-metrics קשור-שם שלא יחזיק פרופיל גופן מת אחרי מחזור רישום).
  _sharedFallbackApis.clear();
  // **S4.26 (גליפים חסרים):** 'Frank Ruhl Libre' הוא fallback הפיסוק
  // של מחסנית הרינדור (fontStack מוסיף אותו שני) — גם המדידה תשתמש
  // בו לתווים שחסרים בגופן הראשי (בדיוק כמו הדפדפן).
  if (String(profileName) === 'Frank Ruhl Libre') {
    fm.setMissingGlyphFallbackFont(res.font);
  }
  return { ok: true, profile: res.font, glyphCount: res.font.numGlyphs, mappedChars: res.font.charToGlyph.size };
}

/** **S6.0 (R2-C1):** שחזור רישום קודם אחרי שימוש זמני (exportPdf) —
 * font=null ⇒ הסרה רגילה. מונע מצב שבו ייצוא מוחק ל-worker את רישום
 * הגופן של התצוגה החיה (המדידה היתה נופלת בשקט ל'table'). */
function restoreFontRegistration(profileName, font, bytes) {
  if (!font) { unregisterFont(profileName); return; }
  const name = String(profileName);
  registeredFonts.set(name, font);
  if (bytes && bytes.length) {
    _fontContentIds.set(name, `fnt-${sha256Hex(bytes).slice(0, 14)}`);
  } else {
    // בלי בתים: זהות מדויקת אם ה-resolver מחזיק את אותו פרנסר תחת הכינוי; אחרת — מבנית
    let cid = null;
    const fid = fontResolver.fontIdOfAlias(name);
    if (fid && fontResolver.fontOf(fid) === font) cid = fid;
    _fontContentIds.set(name, cid || `struct-${_structuralFontFp(font)}`);
  }
  if (String(profileName) === 'Frank Ruhl Libre') fm.setMissingGlyphFallbackFont(font);
  _familyApiCache.clear();
  // **ביקורת בטיחות 19.11 (U-13):** גם מופעי ה-fallback המשותפים חייבים להימחק —
  // מופע font-metrics נקשר לפרופיל הגופן בבנאי; מופע שנוצר בזמן הרישום הזמני
  // (מסלול exportPdf) היה ממשיך למדוד בגופן הזמני גם אחרי השחזור.
  _sharedFallbackApis.clear();
  _invalidateEnvFp();
}

/** הסרת גופן רשום. **תיקון ביקורת PR #22 (סנכרון ניקוי):** מסונכרן גם ל-font-resolver
 * (הסרת הכינוי) — אין מצב שבו ה-resolver אומר "לא רשום" אך המדידה עדיין מודדת
 * דרך רישום ישן, ולהפך. */
function unregisterFont(profileName) {
  const name = String(profileName);
  registeredFonts.delete(name);
  _fontContentIds.delete(name);
  if (name === 'Frank Ruhl Libre') fm.setMissingGlyphFallbackFont(null);
  _familyApiCache.clear(); // **S5.2:** מטמון ה-API-פר-משפחה נגרר אחרי ההרשמה
  _sharedFallbackApis.clear(); // **U-13 (19.11):** אין מופע-fallback הקשור לגופן שהוסר
  _invalidateEnvFp();
  if (!_fontClearSync) {
    _fontClearSync = true;
    try { fontResolver.unregisterAlias(name); } catch (_) { /* מחזור טעינה — יסונכרן בטעינתו */ }
    finally { _fontClearSync = false; }
  }
}
function clearRegisteredFonts() {
  registeredFonts.clear();
  _fontContentIds.clear();
  fm.setMissingGlyphFallbackFont(null);
  _familyApiCache.clear();
  _sharedFallbackApis.clear();
  _invalidateEnvFp();
  if (!_fontClearSync) {
    _fontClearSync = true;
    try { fontResolver.clearFontResolver(); } catch (_) { /* מחזור טעינה */ }
    finally { _fontClearSync = false; }
  }
}

class MeasureAPI {
  constructor(settings, impl = 'table') {
    this.settings = settings;
    this.impl = impl === 'font-metrics' ? 'font-metrics' : 'table'; // 'table' | 'font-metrics'
    this.fontProfileName = null;
    this.fontProfile = null;
    this.fontFactor = 1;
    this.cache = new Map();
    this.stats = { calls: 0, hits: 0, fontFallbacks: 0, evictions: 0 };
    if (this.impl === 'font-metrics') this._bindProfile();
  }

  /** **ביקורת בטיחות 19.11 (U-14) — חסימת מטמון המחרות:** מופעי ה-family/fallback
   * חיים לכל אורך חיי ה-Worker, ומטמון המחרות היה בלתי-חסום — נמדד: מסמך שני
   * ושונה הוסיף ‎+11,882‎ רשומות למופע הגוף (no_long ‎6,270→‎ mid_long ‎18,152‎),
 * וכל מסמך חדש מוסיף את שלו לנצח. אותה מדיניות החסימה של מטמון הפריטים —
 * תקרה ‎65,536‎ + ניפוי-באצווה ‎8,192‎‏ (FIFO לפי סדר הכנסה; המדידה היא מֵימוּז של
 * פונקציה טהורה — חסימה אטומה לפלט, מוכח בדטרמיניזם ובנעילות ה-cross-check).
 * הזיכרון לכל המופעים גם יחד נשאר בסדר גודל של מטמון הפריטים (~עשרות MB). */
  _cacheSet(key, px) {
    if (this.cache.size >= STRING_CACHE_MAX_ENTRIES) {
      const it = this.cache.keys();
      for (let i = 0; i < STRING_CACHE_EVICT_BATCH; i++) {
        const k = it.next().value;
        if (k === undefined) break;
        this.cache.delete(k);
        this.stats.evictions++;
      }
    }
    this.cache.set(key, px);
  }

  /** קשירת פרופיל הגופן לפי שם הגופן בהגדרות; fallback שקוף לטבלה אם לא נרשם. */
  _bindProfile() {
    const name = this.settings['body-font'];
    if (name && registeredFonts.has(name)) {
      this.fontProfileName = name;
      this.fontProfile = registeredFonts.get(name);
      this.fontFactor = FONT_PROFILES[name] || 1;
    } else {
      // לא נרשם גופן — מימוש B נופל בשקיפות לטבלה (מדידה עקבית, לא כשל שקט)
      this.impl = 'table';
      this.stats.fontFallbacks++;
    }
  }

  _fontSpec(sizePt) {
    return sizePt || this.settings['body-font-size-pt'];
  }

  /**
   * **S4.16 (תיקון שורש — מדידת ניקוד):** סימן משולב הממופה בגופן עם advance=0
   * (ניקוד עברי: דגש/תנועות/טעמים) הוא **שכבת-אפס אמיתית** — כך מודד אותו
   * הדפדפן (hmtx=0, שכבת-גליף על הבסיס). בעבר נפל לסל העברי של הטבלה (0.5em
   * = 6pt בגוף 12) ⇒ מילה מנוקדת כמו המצוּוֶה נמדדה רחבה ב~12pt, שבירת השורות
   * נגררה מילה-מילה והדריפט הצטבר לכל העימוד (P7 0.919). מבחינים עתה בין
   * "לא ממופה כלל" (fallback מכויל — מונה fontFallbacks) לבין "ממופה
   * עם advance=0" (אפס אמיתי).
   */
  _charEm(ch) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const gid = fm.glyphIdOf(this.fontProfile, ch);
      if (gid !== 0 && gid < this.fontProfile.numGlyphs) {
        // ממופה בגופן — רוחב hmtx אמיתי (כולל 0 לניקוד)
        return (fm.advanceUnitsOf(this.fontProfile, ch) / this.fontProfile.unitsPerEm) * this.fontFactor;
      }
      // **S4.26 (גליף חסר — fallback כמו הדפדפן):** פיסוק שחסר בגופנים
      // תורניים מצויר בדפדפן במשפחת ה-fallback שבמחסנית ('Frank Ruhl
      // Libre') — המדידה באותם מטריקות בדיוק. בלי גופן כזה רשום — הקירוב
      // המכויל (התנהגות קודמת).
      this.stats.fontFallbacks++;
      const fbEm = fm.missingGlyphFallbackEm(ch);
      if (fbEm > 0) return fbEm;
      return charWidthEm(ch);
    }
    return charWidthEm(ch);
  }

  /** סימן משולב ממופה עם advance=0 (ניקוד): שכבת-אפס — לא חלק מאשכול מדידה. */
  _isMappedMark(ch) {
    if (this.impl !== 'font-metrics' || !this.fontProfile) return false;
    const gid = fm.glyphIdOf(this.fontProfile, ch);
    return gid !== 0 && gid < this.fontProfile.numGlyphs
      && fm.advanceUnitsOf(this.fontProfile, ch) === 0;
  }

  /**
   * **פרוסה 3 (RLM — שורש פער דיו במקרין ה-PageModel, 17.11):** תווי בקרת
   * bidi/פורמט (U+200B..200F, U+202A..202E, U+FEFF) הם **אפס-רוחב לפי
   * הגדרת יוניקוד** וכך מציגים אותם כל מנועי התצוגה (דפדפנים, מציגי PDF).
   * חלק מהגופנים נותנים להם advance ב-hmtx (נמדד: 6.4px ל-RLM ב-12pt) —
   * המדידה ספרה אותם והתצוגה לא ⇒ פער דיו של ~7px בכל מילה מסומנת-RLM
   * (INK_NOT_JUSTIFIED באודיט החי; 230 מופעי RLM ב-very_long — תוכן המקור).
   * תיקון השורש בסמכות המדידה: אפס advance גם כשהגופן טוען אחרת —
   * מילה, מודל, PDF ו-DOM מסכימים ביט-לביט.
   */
  _isZeroWidthControl(ch) {
    const c = ch.codePointAt(0);
    return (c >= 0x200B && c <= 0x200F) || (c >= 0x202A && c <= 0x202E) || c === 0xFEFF;
  }

  /** קרנינג בין תווים סמוכים ב־em (מימוש A: 0 תמיד — כמו S1–S11). */
  _kernEm(a, b) {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      const k = fm.kernUnitsOf(this.fontProfile, a, b);
      if (k !== 0) return (k / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0;
  }

  /**
   * רוחב טקסט ב‑px. מימוש B כולל קרנינג בר־מילה (hmtx + kern/GPOS) —
   * ההבדל היחיד מ־A בנוסף לרוחבי הגליפים עצמם.
   */
  measureTextWidth(text, sizePt = null, trackingEm = DEFAULT_TRACKING) {
    const size = this._fontSpec(sizePt);
    const key = `${this.impl}|${this.fontProfileName || ''}|${size}|${trackingEm}|${text}`;
    this.stats.calls++;
    if (this.cache.has(key)) { this.stats.hits++; return this.cache.get(key); }
    const str = String(text);
    let w = 0;
    let prev = null;
    for (const ch of str) {
      // **S4.16:** ניקוד ממופה (advance=0) — אין רוחב, אין tracking ואין קרנינג
      // (הסימן נצמד לבסיס שלו; letter-spacing אינו חל על סימנים משולבים במדידת
      // הדפדפן). prev נשאר הבסיס האחרון — קרנינג בין בסיסים דרך הניקוד נשמר.
      if (this._isMappedMark(ch)) continue;
      if (this._isZeroWidthControl(ch)) continue; // RLM/bidi — אפס-רוחב בכל מנוע תצוגה
      if (prev !== null) w += this._kernEm(prev, ch);
      w += this._charEm(ch) + trackingEm;
      prev = ch;
    }
    const px = Math.max(0, w * size * (96 / 72)); // pt→px
    this._cacheSet(key, px);
    return px;
  }

  /**
   * **S12.1-6 — cap-height מטבלאות אמת** (OS/2 sCapHeight; נפילה: ascender×0.7).
   * משמש את יישור המילה הראשונה (dropword) במקום הקירוב הקבוע.
   */
  capHeightEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return fm.capHeightEmOf(this.fontProfile) * this.fontFactor;
    }
    return 0.7; // הקירוב ההיסטורי (תיעוד dropword CSS)
  }

  /** **S12 (parity גיאומטרי):** ascent/descent ב־em — מפרופיל הגופן (hhea)
   * כשנטען, אחרת הפרופיל המכויל (0.80/0.20 — תואם קו הבסיס ההיסטורי). */
  ascentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return (this.fontProfile.ascender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.80;
  }
  descentEm() {
    if (this.impl === 'font-metrics' && this.fontProfile) {
      return Math.abs(this.fontProfile.descender / this.fontProfile.unitsPerEm) * this.fontFactor;
    }
    return 0.20;
  }

  /** שורת "גובה" אחידה (baseline grid): fontSize × lineHeight (BRZ-2). */
  lineHeightPx(sizePt = null) {
    const size = this._fontSpec(sizePt);
    // **S5.1:** בלי Math.round — 12pt×1.34=21.44px אורגל ל-21 ⇒ +2 שורות לעמוד
    // (סוג המוקש שתוקן במנוע המורשת ב-S4.13, לא הופץ לנתיב ה-DP).
    // **S5.1:** בלי Math.round — 12pt×1.34=21.44px אורגל ל-21 ⇒ +2 שורות לעמוד
    // (סוג המוקש שתוקן במנוע המורשת ב-S4.13, לא הופץ לנתיב ה-DP).
    return size * (96 / 72) * this.settings['body-line-height'];
  }

  /**
   * מיקום שורות אופטימלי (KP) → מערך שורות עם רוחבים.
   * @param {Function} [measureOverride] - הזרקת פונקציית מדידה (למשל פרופיל רוחב־גופן מהpipeline) — L1: entry יחיד דרך ההזרקה.
   * @returns {Array<{words:string[], widthPx:number, badness:number}>}
   */
  layoutLines(words, maxWidthPx, sizePt = null, opts = {}, measureOverride = null) {
    const knuth = require('./kp-linebreak');
    const measure = measureOverride || ((t) => this.measureTextWidth(t, sizePt));
    return knuth.breakLines(words, maxWidthPx, measure, this.lineHeightPx(sizePt), opts);
  }

  cacheStats() { return { ...this.stats, hitRate: this.stats.calls ? this.stats.hits / this.stats.calls : 0 }; }
}

/** **S5.2 (תיקון 6 — מדידת כותרות בגופן רשום):** API כבול למשפחה שנרשמה ב‑registerFont
 * (מטריקות אמת hmtx/kern בגודל הכותרת), או null כשהמשפחה אינה רשומה —
 * דפוס apiFor(family) של legacy-projector, מיוצא כאן כסטטי על המחלקה כדי
 * שה-pipeline (widthFor) ישתמש בו בלי לרדוף אחרי מפת הגופנים בעצמו.
 * מטומן לפי משפחה; המטמון מתרוקן בהסרת/איפוס גופנים (unregister/clear). */
const _familyApiCache = new Map();
MeasureAPI.forFamily = function forFamily(family, settings) {
  if (!family || !registeredFonts.has(String(family))) return null;
  const fam = String(family);
  const sizeKey = settings && settings['body-font-size-pt'] != null ? String(settings['body-font-size-pt']) : '';
  const key = `${fam}|${sizeKey}`;
  if (!_familyApiCache.has(key)) {
    _familyApiCache.set(key, new MeasureAPI({ ...(settings || {}), 'body-font': fam }, 'font-metrics'));
  }
  return _familyApiCache.get(key);
};

/** **EXT-13 (איחוד מקור המדידה live↔ייצוא):** כשגוף הגוף רשום בפועל
 * (registerFont) — מדידת האמת (font-metrics) מועדפת גם כשההגדרה היא
 * 'table' (ברירת המחדל). בלי זה ה-live מדד בטבלאות המקורבות בזמן שהייצוא
 * מדד במטריקות האמיתיות — סחף עמודים של 2% בספר אמת (1,021 מול 1,000;
 * real-book-matrix.json) ועד 17% בקורפוס הגדול (794 מול 678). ההעדפה
 * בטוחה: MeasureAPI נופל בשקיפות לטבלה כשאין גופן (_bindProfile). */
function resolveMeasureImpl(settings) {
  if (settings && settings['measure-impl'] === 'font-metrics') return 'font-metrics';
  const name = settings && settings['body-font'];
  if (name && registeredFonts.has(name)) return 'font-metrics';
  return 'table';
}

// ═══════════════════════════════════════════════════════════════════════════
// שלב 3 (§3.1-7/8/10/11) — מדידה קנונית של פריטי המודל: MeasuredItem.
// **הרחבה בלבד** — המדידות הקיימות (measureTextWidth וכו') לא נגעו; לא נוצר
// API שני: measureItem הוא שכבת הפריט-והסגנון מעל אותן פונקציות בסיס.
// ═══════════════════════════════════════════════════════════════════════════

const { ptToPx, UNITS_VERSION } = require('./units');
const fontResolver = require('./font-resolver');

/** **שלב 4 מקטע ב׳ (§7 בהוראה — חיבור גופנים):** פרופילי רוחב-גופן למשפחות
 * שאינן רשומות — מקור יחיד. הועברו לכאן מ-pipeline.js (widthFor המקומי נמחק
 * במעבר למנוע השורות המאוחד); שתי הדרכים — החי והקנוני — קוראות מכאן.
 * משפחה רשומה ⇒ מטריקות אמת (forFontId/forFamily) ואין פקטור; משפחה בפרופיל
 * ⇒ פקטור על הטבלה המכוילת; משפחה לא-מוכרת ⇒ רצפת 0.6em/תו. */
const FONT_WIDTH_PROFILES = {
  'Frank Ruhl Libre': null,
  'David HB': { factor: 1.06 },
  'David': { factor: 1.04 },
  'Narkisim': { factor: 1.10 },
  'Nachlieli': { factor: 0.96 },
  'Alef': { factor: 1.02 },
  'Rubin': { factor: 1.05 }
};

/** פתרון רוחב למשפחה שאינה רשומה — אותה החלטה שהייתה ב-widthFor של ה-pipeline,
 * מנוסחת פעם אחת: { factor, floor } | null (null ⇒ משפחת הגוף — בסיס ישר).
 * הקנוני (measureItem) והנתיב החי קוראים את אותה הפונקציה — אין עותקים. */
function familyWidthProfileOf(family, settings) {
  const fam = String(family || '');
  const bodyFont = settings && settings['body-font'];
  if (!fam || fam === bodyFont) return null; // גוף הטקסט — בסיס ללא פקטור
  if (registeredFonts.has(fam)) return null; // רשומה — מטריקות אמת (forFontId)
  const prof = FONT_WIDTH_PROFILES[fam];
  if (prof && prof.factor) return { factor: prof.factor, floor: false };
  return { factor: 1, floor: true }; // לא-מוכרת — רצפת 0.6em/תו (כמו החי)
}

/** גרסת מנוע המדידה — חלק ממפתח המטמון ומחית הסביבה (§3.1-10). */
const MEASURE_ENGINE_VERSION = 'measure-v1(item+style+env;advance/ink-split)';

/** חית סביבת מדידה: יחידות + גרסת מנוע + מימוש + זהויות-תוכן של הגופנים הרשומים.
 * **תיקון ביקורת PR #22:** הזהות היא content-addressed (`fnt-<sha256[:14]>`) — לא
 * שם+מספר-גליפים בלבד. סט גופנים שונה (או אותו שם עם בתים שונים) ⇒ חית שונה
 * ⇒ אין שיתוף מטמון שגוי בין סביבות הגדרה. */
function environmentFingerprint(extra = '') {
  if (!extra && _envFpMemo) return _envFpMemo;
  const fams = Array.from(registeredFonts.keys()).sort();
  const fontsFp = fams.length
    ? fams.map((f) => `${f}=${_fontContentIds.get(f) || 'struct-' + _structuralFontFp(registeredFonts.get(f))}`).join('|')
    : 'none';
  const fp = `${MEASURE_ENGINE_VERSION}|${UNITS_VERSION}|fonts=${fontsFp}${extra ? '|' + extra : ''}`;
  if (!extra) _envFpMemo = fp;
  return fp;
}

/** **תיקון ביקורת PR #22 (סריאליזציה קנונית):** מחרוזת דטרמיניסטית ויציבה-בין-
 * סביבות: מפתחות אובייקט ממוינים רקורסיבית (סדר הכנסה אינו חלק מהתוכן); סדר
 * מערכים נשמר (הסדר חלק מהתוכן — ריצות טקסט); בתים (TypedArray/Buffer) נטחנים
 * לזהות תוכן (אורך+SHA-256) — לא מחרוזת תלוית-סביבה; פונקציות/סמלים — שם טיפוס.
 * מחליף את JSON.stringify הלא-יציב שעמד קודם במפתח המטמון. */
function _canonicalStringify(value, depth = 0) {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number' || t === 'boolean' || t === 'undefined') return String(value);
  if (t === 'bigint') return `${value}n`;
  if (t === 'function' || t === 'symbol') return `<${t}>`;
  if (depth > 32) return '<deep>';
  if (Array.isArray(value)) return '[' + value.map((v) => _canonicalStringify(v, depth + 1)).join(',') + ']';
  if (value instanceof ArrayBuffer) return `ab(${value.byteLength})`;
  if (ArrayBuffer.isView(value)) {
    const u8 = value instanceof Uint8Array ? value : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    return `bytes(${u8.length}):${sha256Hex(u8)}`;
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + _canonicalStringify(value[k], depth + 1)).join(',') + '}';
  }
  return String(value);
}

/** **אופטימיזציית מפתח (19.11, הוראת ביצועים §5):** מֵימוֹ של המחרוזת הקנונית
 *  לאובייקטים — **מודע-מוטציה** (ביקורת בטיחות 19.11, U-12): חוזה הקלט מתיר
 * שינוי אובייקטי קלט בין מדידות (s3-immutability — מדידה חוזרת משקפת קלט חדש);
 * מֵימוֹ נאיבי לפי זהות היה מחזיר ייצוג ישן. כאן: תצלום-ערכים שטוח נשמר עם
 * הייצוג; אי-התאמה ⇒ קנוניזציה מחדש ועדכון. אובייקט עם ערך-עצם אינו ממומוֹ כלל.
 *  התוצאה זהה בדיוק (אותה פונקציה על אותו אובייק�) — הפונקציה טהורה והאובייקט
 *  אינו משתנה (חוזה הטוהר של שלב 3); WeakMap — אין החזקה. */
const _canonicalMemo = new WeakMap();
function _flatSnapshot(value) {
  if (value === null || typeof value !== 'object') return null;
  const snap = new Map();
  for (const k of Object.keys(value)) {
    const v = value[k];
    const t = typeof v;
    if (v === null || t === 'string' || t === 'number' || t === 'boolean' || t === 'undefined') snap.set(k, v);
    else return null; // ערך-עצם/מערך — בלי מֵימוֹ (שינוי פנימי בלתי-נראה לתצלום השטוח)
  }
  return snap;
}
function _snapshotMatches(snap, value) {
  // ללא הקצאות (נקרא בכל מדידה): מניין שדות-עצם + השוואת ערכים מול התצלום
  let n = 0;
  for (const k in value) {
    if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
    n++;
    if (!snap.has(k) || snap.get(k) !== value[k]) return false;
  }
  return n === snap.size;
}
function _canonicalStringifyStable(value) {
  if (value === null || typeof value !== 'object') return _canonicalStringify(value);
  let m = _canonicalMemo.get(value);
  if (m === undefined || m.snap === null || !_snapshotMatches(m.snap, value)) {
    // חישוב מחדש (מקור ראשון, מוטציה שזוהתה, או מבנה מקונן): התצלום נבנה רק כאן;
    // מבנה מקונן (snap=null) אינו נשמר במֵימוֹ כלל — קנוניזציה טרייה בכל קריאה (נכונות מלאה)
    const canon = _canonicalStringify(value);
    const snap = _flatSnapshot(value);
    if (snap !== null) _canonicalMemo.set(value, { canon, snap });
    return canon;
  }
  return m.canon;
}

/** **אופטימיזציית מפתח (19.11, הוראת ביצועים §5):** חשיש מפתח מהיר לא-קריפטוגרפי
 *  עבור מטמון הפריטים בתוך התהליך בלבד. מחליף את sha256Hex (Node crypto — יקר
 *  לקריאה: ~3.4µs, נמדד) בשלושה ערוצי 32-bit (FNV-1a, ערוץ מעורבב-מיקום, sdbm)
 *  + אורך, עם finalization של murmur3 — 96 ביטים יעילים.
 *
 *  **ביקורת בטיחות 19.11 (U-11):** ההסתברות אינה עוד מנגנון ההגנה. סף ה-birthday
 *  ל-10⁷ מחרוזות על 96 ביטים הוא ‎≈6.3×10⁻¹⁶‎ ≈ ‎2⁻⁵⁰·⁵‎ (הערת הקוד הקודמת, ‎2⁻⁵⁸‎,
 *  הייתה שגויה מספרית) — נמוך, אך הסתברות אינה הוכחת נכונות: התנגשות אמיתית הייתה
 *  מחזירה MeasuredItem של פריט אחר. כעת המטמון מאמת **מקור מדויק** בכל קריאה
 *  (רשומה = {src, val}; אי-התאמה ⇒ miss) — התנגשות פוגעת בביצועים בלבד, לעולם
 *  לא בנכונות. sha256Hex נשאר לזהויות
 *  content-addressed (גופנים/נכסים) — שם הוא חלק מהחוזה. המפתח אינו נשמר
 *  בין תהליכים ואינו חוצה את גבול ה-Worker — אין השלכות שחזור. */
function _fmix32(h) {
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h | 0;
}
function _fastKeyHash(s) {
  let h1 = 0x811c9dc5, h2 = 0x9e3779b9, h3 = 5381;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ Math.imul(i + 1, c), 0x85ebca6b);
    h3 = (Math.imul(h3, 0x21) ^ c) | 0;
  }
  const len = s.length;
  h1 = _fmix32(h1 ^ len); h2 = _fmix32(h2 ^ Math.imul(len, 0x9e3779b9)); h3 = _fmix32(h3 ^ h1);
  return (h1 >>> 0).toString(16).padStart(8, '0')
    + (h2 >>> 0).toString(16).padStart(8, '0')
    + (h3 >>> 0).toString(16).padStart(8, '0')
    + len.toString(16).padStart(8, '0');
}

/** זהות נכס content-addressed לפי שרשרת המועמדים של הפריט — מה-resolver בלבד
 * (הזהות מחושבת מהבתים, לא מההצהרה). אותה הפניה (resourcePath) עם תוכן נכס
 * אחר ⇒ מזהה אחר ⇒ מפתח מטמון אחר. פותר את הפגם שבו item.id לבדו קבע את המפתח. */
function _assetIdentityFp(item, ctx) {
  const ar = ctx && ctx.assetResolver;
  if (!ar || !item || item.kind !== 'image') return '';
  const p = item.payload || {};
  const cands = [];
  if (p.contentAssetId != null) cands.push(String(p.contentAssetId));
  if (p.assetId != null) cands.push(String(p.assetId));
  if (p.resourcePath != null) cands.push(String(p.resourcePath));
  if (!cands.length) return 'no-candidates';
  for (const c of cands) {
    let r = null;
    try { r = c.startsWith('ast-') ? ar.resolveById(c) : ar.resolve(c); } catch (_) { r = null; }
    if (r && r.ok) return `id:${r.assetId}`;
  }
  return 'unresolved(' + cands.join('|') + ')';
}

/** מפתח מטמון מדידת פריט (§3.1-10) — **קנוני ודטרמיניסטי**.
 * **תיקון שורש (ביקורת PR #22):** הקוד הקודם השתמש ב-item.id לבדו כשקיים מזהה —
 * שני פריטים בעלי אותו מזהה ו-payload שונה (טקסט/תמונה/widthPct/ריצות גופן/
 * אילוצי רוחב) קיבלו את אותה מדידה. כעת המזהה הוא רכיב אחד מיני רבים:
 * (1) item.id אם קיים; (2) טביעת payload מלאה (טקסט, ריצות, widthPct, מזהי נכסים);
 * (3) סוג הפריט; (4) טביעת סגנון מלאה (גודל, גובה-שורה, משקל, family);
 * (5) זהויות גופן קנוניות — fontIds כתובות-תוכן + חית סביבה מזהויות-תוכן;
 * (6) זהות נכס content-addressed מה-resolver (שרשרת המועמדים);
 * (7) שפה וכיוון; (8) אילוצי מדידה מלאים (availableWidth/fit/align/widthPct)
 * + מפתח הקשר; (9) גרסת מנוע המדידה; (10) חית סביבה **חיה** (מחושבת כעת
 * מהרישומים בפועל — לא הצהרת caller) + חית ההקשר שהועברה. */
function _itemCacheKey(item, style, ctx) {
  // **מקטע ב׳ (זיכרון) + ביקורת בטיחות 19.11 (U-11):** המקור הקנוני נחלק לשניים —
  // (א) רכיב-יציב לכל ה-typeset (גרסה, חית סביבה חיה מהגופנים בפועל, הקשר,
  // אילוצי ההקשר) — מֵימוּ על אובייקט ה-ctx: אותו תוכן ⇒ אותו אובייקט מחרוזת;
  // (ב) רכיב-פריט (kind/id/payload/אילוצי-פריט/סגנון/נכס). המפתח = חשיש כפול
  // על שני החלקים. המטמון מאמת בכל קריאה: **ייחוס** רכיב-היציב (השוואת אובייקט —
  // מדויקת: תוכן שונה בונה אובייקט אחר בהכרח) ו**תוכן** רכיב-הפריט. התנגשות
  // hash אמיתית — כולל כזו שהוזרקה בכוונה בבדיקה — היא miss (חישוב מחדש), לא
  // החזרת מדידה זרה: הגנת PR #22 מובטחת דטרמיניסטית, לא הסתברותית.
  // **ביקורת ביצועים (אותו יום, מדידה בפרופיל CPU):** אחסון המקור המלא לכל
  // רשומה הכביד את אוסף-הזבל (‎+515ms על mid_long×3). הפיצול משתף מחרוזת אחת
  // לרכיב-היציב ומאחסן לכל רשומה רק את רכיב-הפריט הקצר — גם ההיטיש בנתיב
  // הקריאה מצטמצם לרכיב-הפריט בלבד. פרדת רכיבים ב-NUL (\u0000) — הקנוניזציה
  // מבריחה תווי בקרה (JSON.stringify), ולכן המפריד חד-משמעי.
  const P = _stableKeyPrefix(ctx);
  const it = item || {};
  const b = [
    it.kind || '',
    it.id != null ? String(it.id) : '',
    _canonicalStringify(it.payload !== undefined ? it.payload : it),
    _canonicalStringify(it.constraints || null),
    _canonicalStringify(style || null),
    _assetIdentityFp(item, ctx)
  ].join('\u0000');
  return { k: 'ik3:' + P.h + _fastKeyHash(b), a: P.s, b };
}

/** רכיב-היציב של מפתח המטמון — מֵימוּ על אובייקט ה-ctx (WeakMap) עם בדיקת
 *  שדות מדויקת: חית הסביבה החיה (גופנים בפועל), חית ההקשר, כיוון/שפה, הקנוני
 *  של אילוצי ההקשר, מפתח האילוצים וזהות הנכס. כל שינוי ⇒ בנייה מחדש — אובייקט
 *  מחרוזת חדש ⇒ כל הרשומות שנבנו תחת הישן נהפכות miss (התנהגות נכונה: מדידה
 *  חוזרת מהסביבה החדשה). */
const _keyPrefixMemo = new WeakMap();
function _stableKeyPrefix(ctx) {
  const c = ctx || {};
  const envLive = environmentFingerprint();
  const consCanon = _canonicalStringifyStable((c.constraints) || null);
  const dir = c.direction || '';
  const lang = c.language || '';
  const envFp = c.environmentFingerprint || '';
  const consKey = c.constraintsKey || '';
  const assetId = c.assetId != null ? String(c.assetId) : '';
  let m = ctx ? _keyPrefixMemo.get(ctx) : null;
  if (m && m.envLive === envLive && m.consCanon === consCanon && m.dir === dir && m.lang === lang
    && m.envFp === envFp && m.consKey === consKey && m.assetId === assetId) {
    return m; // אותו תוכן ⇒ אותו אובייקט מחרוזת (s) ואותו חשיש (h)
  }
  const s = ['item-key-v3', MEASURE_ENGINE_VERSION, envLive, envFp, dir, lang, consCanon, consKey, assetId].join('\u0000');
  m = { envLive, consCanon, dir, lang, envFp, consKey, assetId, s, h: _fastKeyHash(s) };
  if (ctx) _keyPrefixMemo.set(ctx, m);
  return m;
}

/** **תיקון ביקורת PR #22 (immutability אמיתי):** הקפאה עמוקה — כל המבנים
 * הפנימיים: inkBounds, segments וכל אובייקט segment, breakOpportunities וכל
 * הזדמנות, diagnostics, natural, fit, placement. ידידותי למחזורים (seen)
 * ודלג מוקדם על אובייקטים שכבר הוקפאו. */
function _deepFreeze(value, seen) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  if (seen === undefined) seen = new Set();
  else if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) _deepFreeze(value[i], seen);
  } else {
    for (const k of Object.keys(value)) _deepFreeze(value[k], seen);
  }
  Object.freeze(value);
  return value;
}

/**
 * measureItem — המדידה הקנונית של פריט מודל אחד.
 * @param {object} item — פריט Inline Item Model (text/noteMarker/image/atomicToken/anchor/glue/penalty)
 * @param {object} style — סגנון פתור: { sizePt, lineHeight, weight, fontIds: [fontId לפי ריצה או יחיד] }
 * @param {object} ctx — הקשר: { direction, language, assetResolver, environmentFingerprint,
 *                               constraints: { availableWidthPx, imageFit, imageAlign, imageWidthPct } , constraintsKey }
 * @returns {object} MeasuredItem בלתי-ניתן לשינוי (Object.freeze) — או {ok:false, code, message}
 *           כאשר הפריט אינו ניתן למדידה (לא נעלם — §3.1-11).
 *
 * **הפרדת advance/ink (§3.1-8):** advance = רוחב הקידום לשבירת שורות; inkBounds
 * = תיבת הדיו המשוערת מהתווים (מקור: advance-approximation — מתועד; עיגול
 * גליפים אמיתי יתווסף כשמנוע המדידה יחשוף glyf — בלי שינוי החוזה).
 */
/** **אופטימיזציה (19.11, הוראת ביצועים §5):** מופעי מדידה משותפים לנתיבי
 *  ה-fallback שבתוך measureItem (noteMarker/atomic/glue/penalty + טקסט בלי
 *  גופן-רזולב). בעבר נוצר מופע חדש (+Map +stats) לכל קריאה — ב-very_long
 *  נמדדו 333,456 מופעים חד-פעמיים לריצה; מטמון המחרוזות שלהם מת עם הקריאה.
 *  המופע חסר מצב פר-קריאה (sizePt תמיד מועבר מפורשות ל-measureTextWidth;
 *  ה-body-font בהגדרות משפיע רק על _bindProfile) — לכן מֵימוֹ לפי
 *  (impl|family|sizePt) — בדיוק אותם ארגומנטים כמו הבנאי הקודם — מחזיר התנהגות
 *  זהה: אותן תוצאות מדידה, ומטמון המחרוזות משריך ערכים דטרמיניסטיים זהים. */
const _sharedFallbackApis = new Map();
function _sharedMeasureApi(impl, family, settingsSizePt) {
  const key = impl + '|' + (family || '') + '|' + (settingsSizePt || 0);
  let api = _sharedFallbackApis.get(key);
  if (!api) {
    api = new MeasureAPI({ 'body-font-size-pt': settingsSizePt, 'body-font': family || '' }, impl);
    _sharedFallbackApis.set(key, api);
  }
  return api;
}

function measureItem(item, style, ctx) {
  if (!item || typeof item !== 'object') return { ok: false, code: 'no-item', message: 'measureItem: פריט חסר' };
  const sizePt = (style && Number.isFinite(style.sizePt)) ? style.sizePt : 12;
  const lineHeight = (style && Number.isFinite(style.lineHeight)) ? style.lineHeight : 1.34;
  const dir = (ctx && ctx.direction) || 'rtl';
  const lang = (ctx && ctx.language) || 'he';
  const ck = _itemCacheKey(item, style, ctx);
  const hit = _itemCacheGet(ck);
  if (hit !== undefined) return hit;

  let out;
  const kind = item.kind;

  if (kind === 'text') {
    const runs = (item.payload && item.payload.runs) || [];
    if (!runs.length) {
      out = { ok: false, code: 'text-no-runs', message: `פריט טקסט ללא ריצות: ${item.id}` };
    } else {
      // מדידה פר-ריצה בגופן שלה — כמה משפחות באותה מילה (§3.1-6)
      // **שלב 4 מקטע ב׳ (סגנון אמת — הוראה §7):** style.advanceFactor (סוגריים/
      // סגנון inline — הכפלת רוחב בלבד, בדיוק כמו measureWithParen של הנתיב
      // החי; גובה/בסיס נשארים בגודל השורה) ו-style.familyFactor/familyUnknownFloor
      // (פרופיל רוחב למשפחה שאינה רשומה — מקור יחיד familyWidthProfileOf)
      // משתתפים כאן ובשום מקום אחר.
      const advanceFactor = (style && Number.isFinite(style.advanceFactor) && style.advanceFactor > 0) ? style.advanceFactor : 1;
      const segments = [];
      let advance = 0;
      let ascentEmMax = 0, descentEmMax = 0;
      const diagnostics = [];
      for (let ri = 0; ri < runs.length; ri++) {
        const run = runs[ri];
        const fontId = (style && style.fontIds && style.fontIds[ri]) || (style && style.fontIds && style.fontIds[0]) || null;
        const api = fontId ? MeasureAPI.forFontId(fontId, { 'body-font-size-pt': sizePt }) : null;
        if (api) {
          const w = api.measureTextWidth(run.text, sizePt, 0);
          segments.push({ fontId, text: run.text, advancePx: w, family: api.fontProfileName });
          ascentEmMax = Math.max(ascentEmMax, api.ascentEm());
          descentEmMax = Math.max(descentEmMax, api.descentEm());
          advance += w;
        } else {
          // אין זהות גופן — דרך המשפחה המבוקשת ב-resolver (fallback מאובחן)
          const res = fontResolver.resolveFont(run.fontFamily || (style && style.family), {
            defaultFamily: style && style.defaultFamily
          });
          if (res.ok) {
            const api2 = MeasureAPI.forFontId(res.fontId, { 'body-font-size-pt': sizePt });
            const w = api2.measureTextWidth(run.text, sizePt, 0);
            segments.push({ fontId: res.fontId, text: run.text, advancePx: w, family: res.record.face, fallbackUsed: res.fallbackUsed });
            ascentEmMax = Math.max(ascentEmMax, api2.ascentEm());
            descentEmMax = Math.max(descentEmMax, api2.descentEm());
            advance += w;
            if (res.fallbackUsed) diagnostics.push({ code: 'font-fallback', from: run.fontFamily, to: res.record.face, reason: 'not-registered' });
          } else {
            // מימוש הטבלה — הקירוב המכויל; מתועד במפורש ולא שקט
            // **§7:** פרופיל רוחב למשפחה — factor על הבסיס / רצפת 0.6em ללא-מוכרת,
            // בדיוק כפי ש-widthFor של הנתיב החי עשה; מקור ההחלטה אחד.
            const famFactor = (style && Number.isFinite(style.familyFactor) && style.familyFactor > 0) ? style.familyFactor : 1;
            const famFloor = !!(style && style.familyUnknownFloor);
            const fallbackApi = _sharedMeasureApi('table', (style && style.defaultFamily) || '', sizePt);
            let w = fallbackApi.measureTextWidth(run.text, sizePt, 0) * famFactor;
            if (famFloor) w = Math.max(w, String(run.text).length * 0.6 * sizePt * (96 / 72));
            segments.push({ fontId: null, text: run.text, advancePx: w, family: null, tableApproximation: true });
            ascentEmMax = Math.max(ascentEmMax, fallbackApi.ascentEm());
            descentEmMax = Math.max(descentEmMax, fallbackApi.descentEm());
            advance += w;
            diagnostics.push({ code: 'font-unavailable-table-approximation', requested: run.fontFamily || (style && style.family), message: res.message });
          }
        }
      }
      if (advanceFactor !== 1) {
        advance *= advanceFactor;
        for (const s of segments) s.advancePx *= advanceFactor;
      }
      const sizePx = ptToPx(sizePt);
      out = {
        ok: true, kind: 'text', itemId: item.id,
        unit: 'px', direction: dir, language: lang,
        advance, width: advance, // advance = רוחב לשבירה
        inkBounds: { left: 0, right: advance, top: -ascentEmMax * sizePx, bottom: descentEmMax * sizePx, source: 'advance-approximation' },
        ascent: ascentEmMax * sizePx, descent: descentEmMax * sizePx,
        baseline: ascentEmMax * sizePx,
        height: sizePx * lineHeight,
        segments,
        breakOpportunities: _textBreaks(runs),
        diagnostics
      };
    }
  } else if (kind === 'image') {
    const ar = ctx && ctx.assetResolver;
    if (!ar) {
      out = { ok: false, code: 'no-asset-resolver', message: `תמונה ללא resolver בהקשר: ${item.id}` };
    } else {
      // שרשרת זהות מפורשת: זהות-תוכן (מה-resolver, אם נבנתה עם assets) → זהות המסמך
      // (מהמקור) → הפניית המקור (resourcePath). כל דילוג — ניסיון הבא; כולם נכשלו — אבחון.
      const candidates = [];
      if (item.payload && item.payload.contentAssetId) candidates.push(item.payload.contentAssetId);
      if (item.payload && item.payload.assetId) candidates.push(item.payload.assetId);
      if (item.payload && item.payload.resourcePath) candidates.push(item.payload.resourcePath);
      let m = null, lastFail = null;
      for (const c of candidates) {
        const r = ar.measure(c);
        if (r.ok) { m = r; break; }
        lastFail = r;
      }
      if (!m) {
        out = { ok: false, code: (lastFail && lastFail.code) || 'asset-measure-failed', message: (lastFail && lastFail.message) || 'מדידת הנכס נכשלה', assetId: item.payload && item.payload.assetId };
      } else {
        // fit/scale מהאילוצים (§3.1-4): widthPct מרוחב זמין; יחס-גובה נשמר תמיד
        const cons = (ctx && ctx.constraints) || {};
        const available = Number.isFinite(cons.availableWidthPx) ? cons.availableWidthPx : null;
        const widthPct = item.payload && Number.isFinite(item.payload.widthPct) ? item.payload.widthPct : 100;
        let displayW;
        if (available != null) displayW = available * (widthPct / 100);
        else displayW = m.displayWidth;
        const displayH = displayW / m.aspectRatio;
        out = {
          ok: true, kind: 'image', itemId: item.id,
          unit: 'px', direction: dir, language: lang,
          advance: displayW, width: displayW, height: displayH,
          inkBounds: { left: 0, right: displayW, top: 0, bottom: displayH, source: 'asset-bounds' },
          ascent: 0, descent: 0, baseline: displayH,
          natural: { width: m.width, height: m.height, aspectRatio: m.aspectRatio, orientation: m.orientation, format: m.format },
          fit: { policy: widthPct !== 100 ? 'width-pct' : 'natural', widthPct, availableWidthPx: available, scaled: displayW !== m.displayWidth },
          breakOpportunities: [], // אטום — אין שבירה בתוך תמונה
          placement: { participates: (item.constraints && item.constraints.participates) || 'inline', align: (item.payload && item.payload.align) || 'center', wrap: (item.constraints && item.constraints.wrap) || 'none' },
          diagnostics: []
        };
      }
    }
  } else if (kind === 'noteMarker') {
    // סמן הערה אטומי — רוחב הסמן בגודל הרישום (גימטריה); נמדד כפריט יחיד
    const markerText = (item.payload && item.payload.markerText) || 'א.';
    const fnSizePt = (style && Number.isFinite(style.sizePt)) ? style.sizePt : 8;
    const api = _sharedMeasureApi('table', '', fnSizePt);
    const w = api.measureTextWidth(markerText, fnSizePt, 0);
    const sizePx = ptToPx(fnSizePt);
    out = {
      ok: true, kind: 'noteMarker', itemId: item.id,
      unit: 'px', direction: dir, language: lang,
      advance: w, width: w, height: sizePx * 1.2,
      inkBounds: { left: 0, right: w, top: -0.8 * sizePx, bottom: 0.2 * sizePx, source: 'advance-approximation' },
      ascent: 0.8 * sizePx, descent: 0.2 * sizePx, baseline: 0.8 * sizePx,
      segments: [{ fontId: null, text: markerText, advancePx: w, noteSize: true }],
      breakOpportunities: [], // אטום
      diagnostics: []
    };
  } else if (kind === 'atomicToken' || kind === 'anchor' || kind === 'glue' || kind === 'penalty' || kind === 'custom' || (kind && kind.startsWith('custom:'))) {
    const text = (item.payload && (item.payload.text != null ? item.payload.text : item.payload.atomicText)) || '';
    const api = _sharedMeasureApi((style && style.fontIds && style.fontIds[0]) ? 'font-metrics' : 'table',
      (style && style.defaultFamily) || '', sizePt);
    // **§5 (מדידה יחידה — הוראת שלב 4 ב׳):** advanceFactor חל גם כאן (אטומים
    // עם שכבת סגנון) — אותו חוזה כמו פריטי טקסט.
    const advanceFactor = (style && Number.isFinite(style.advanceFactor) && style.advanceFactor > 0) ? style.advanceFactor : 1;
    let w = text ? api.measureTextWidth(text, sizePt, 0) : 0;
    if (advanceFactor !== 1) w *= advanceFactor;
    const sizePx = ptToPx(sizePt);
    out = {
      ok: true, kind, itemId: item.id,
      unit: 'px', direction: dir, language: lang,
      advance: w, width: w, height: sizePx * lineHeight,
      inkBounds: { left: 0, right: w, top: -0.8 * sizePx, bottom: 0.2 * sizePx, source: 'advance-approximation' },
      ascent: 0.8 * sizePx, descent: 0.2 * sizePx, baseline: 0.8 * sizePx,
      segments: text ? [{ fontId: (style && style.fontIds && style.fontIds[0]) || null, text, advancePx: w }] : [],
      breakOpportunities: kind === 'atomicToken' ? [] : (text ? _textBreaks([{ text }]) : []),
      atomic: true,
      diagnostics: []
    };
  } else {
    out = { ok: false, code: 'unsupported-item-kind', message: `measureItem: סוג פריט לא נתמך: ${kind} (${item.id})` };
  }

  if (out && out.ok) {
    // החית המתועדת בתוצאה = הסביבה החיה שבה נמדד בפועל (לא הצהרת ה-caller)
    out.environmentFingerprint = environmentFingerprint();
    out.measureEngineVersion = MEASURE_ENGINE_VERSION;
    _deepFreeze(out);
    _itemCacheSet(ck, out);
  } else if (out) {
    _deepFreeze(out); // דחייה — גם היא בלתי-ניתנת לשינוי (אותו חוזה)
  }
  return out;
}

/** הזדמנויות שבירה של רצף ריצות טקסט — מיקומי רווחים (מפתחות לשלב 4). */
const EMPTY_ARR = Object.freeze([]);
function _textBreaks(runs) {
  // מקטע ב׳: מילה בדרך כלל איננה מכילה רווחים — מערך ריק משותף
  // (חיסכון מיליוני הקצאות בספרים גדולים).
  let any = false;
  for (const run of runs) { if (String(run.text).includes(' ')) { any = true; break; } }
  if (!any) return EMPTY_ARR;
  const breaks = [];
  let pos = 0;
  for (const run of runs) {
    const text = String(run.text);
    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') breaks.push({ offset: pos + i, after: true });
    }
    pos += text.length;
  }
  return breaks;
}

/** מטמון מדידות פריט — מפתח מלא בלבד (§3.1-10).
 *
 * **חסימת זיכרון (שלב 4 מקטע ב׳, תיקון שורש שנמצא באימות ה-PR):** מדידת
 * פריט היא מֵימוּז של פונקציה דטרמיניסטית טהורה — חסימת המטמון אינה יכולה
 * לשנות פלט, אלא זמן CPU בלבד (ולכן גם ה-hash אטום לה). בלי חסימה,
 * המטמון שומר לנצח MeasuredItem לכל פריט-שורה שנמדד אי-פעם בתהליך:
 * ספר של 3.4MB השאיר ~682 אלף ערכים ≈ 766MB (נמדד) — דליפה גם ב-Worker
 * של המוצר וגם קריסת OOM בבדיקות הספרים הארוכים (4 ספרים בתהליך אחד
 * הצטברו ל-1.9GB+). התועלת שנמדדה בריצה-חוזרת זהה (טקסט+סגנון ללא
 * שינוי): האצה של ×1.35 בלבד — שולית מול העלות. התקרה נגזרת מתקציב
 * הזיכרון הקיים של s13 (memoryMaxMB=1500 לספר גדול): 65,536 ערכים
 * ≈ 75MB (~1.16KB לפריט, נמדד) ≈ 5% מהתקציב — המטמון לעולם אינו דומיננטי.
 * מסמכים עד ~130 עמ' נשמרים במלואם; ספרים גדולים יותר שומרים את הערכים
 * האחרונים בלבד. גם בתוך typeset בודד אין לחסימה השפעה: חוזה גבול המדידה
 * היחיד מבטיח שכל פריט נמדד בדיוק פעם אחת (מוכח ב-s4b-production-path)
 * — המטמון משרת רק בניות-חוזרות של אותו מסמך ללא שינוי.
 *
 * **ניפוי באצוות (נמדד):** ניפוי של ערך-בודד בכל הכנסה מעל התקרה האט את
 * ההכנסות פי ~2 (יצירת איטרטור + מחיקה לכל אחת מ-617 אלף ההכנסות של
 * ספר גדול). ניפוי באצוות של 8,192 מחזיר את המהירות לקו הבסיס (13.0s
 * מול 27.4s — נמדד על very_long) בלי לפגוע בחסימה. */
const ITEM_MEASURE_CACHE_MAX_ENTRIES = 65536;
const ITEM_CACHE_EVICT_BATCH = 8192;
const _itemMeasureCache = new Map();
function _itemCacheGet(ck) {
  const e = _itemMeasureCache.get(ck.k);
  if (e === undefined) return undefined;
  // **U-11 — אימות מקור מדויק:** ייחוס רכיב-היציב (אותו אובייקט מחרוזת מהמֵימוֹ)
  // ותוכן רכיב-הפריט. מקור שונה תחת אותו חשיש (התנגשות אמיתית — כולל כזו
  // שהוזרקה בבדיקה) היא **miss**, לא החזרת מדידה זרה.
  if (e.a !== ck.a || e.b !== ck.b) return undefined;
  // LRU: חידוש עדכניות — מחיקה והחזרה לסוף (סדר ה-Map = סדר הכנסה)
  _itemMeasureCache.delete(ck.k);
  _itemMeasureCache.set(ck.k, e);
  return e.val;
}
function _itemCacheSet(ck, value) {
  if (_itemMeasureCache.size >= ITEM_MEASURE_CACHE_MAX_ENTRIES) {
    // ניפוי הערכים העתיקים ביותר באצווה אחת (הראשונים שהוכנסו ולא נגעו בהם מאז)
    const it = _itemMeasureCache.keys();
    for (let i = 0; i < ITEM_CACHE_EVICT_BATCH; i++) {
      const k = it.next().value;
      _itemMeasureCache.delete(k);
    }
  }
  // התנגשות hash (מקור אחר תחת אותו חשיש): הרשומה האחרונה גוברת — ההגנה
  // היא ב-get (אימות מקור); שני המקורות פשוט יחושבו מחדש לסירוגין.
  _itemMeasureCache.set(ck.k, { a: ck.a, b: ck.b, val: value });
}
function itemCacheStats() {
  return { entries: _itemMeasureCache.size, capacity: ITEM_MEASURE_CACHE_MAX_ENTRIES };
}
/** **ביקורת בטיחות 19.11 (U-14) — אבחון בלבד (אינו מנגנון מדידה שני):** סטטיסטיקת
 * מטמוני המחרוזות של מופעי MeasureAPI החיים (family + fallback משותפים). משמש
 * את בדיקות מחזור החיים ואת מדידת הצטברות הזיכרון לאורך מסמכים ב-Worker ארוך-חיים. */
function stringCacheStats() {
  const instances = [];
  for (const [k, api] of _familyApiCache) instances.push({ cache: 'family', key: String(k), entries: api.cache.size, impl: api.impl });
  for (const [k, api] of _sharedFallbackApis) instances.push({ cache: 'fallback', key: k, entries: api.cache.size, impl: api.impl });
  return {
    instances,
    familyInstances: _familyApiCache.size,
    fallbackInstances: _sharedFallbackApis.size,
    totalEntries: instances.reduce((s, x) => s + x.entries, 0)
  };
}
function clearItemMeasureCache() { _itemMeasureCache.clear(); }

/** API כבול לזהות גופן קנונית (fontId מה-resolver) — לא לשם בלבד. */
MeasureAPI.forFontId = function forFontId(fontId, settings) {
  const font = fontResolver.fontOf(fontId);
  if (!font) return null;
  const key = String(fontId);
  if (!_familyApiCache.has(key)) {
    const api = new MeasureAPI({ ...(settings || {}), 'body-font': fontResolverAliasOf(fontId) || key }, 'font-metrics');
    // קשירה ישירה לפרנסר של הזהות — לא דרך רישום שם (הזהות היא המקור)
    api.fontProfileName = fontResolverAliasOf(fontId) || key;
    api.fontProfile = font;
    _familyApiCache.set(key, api);
  }
  return _familyApiCache.get(key);
};
function fontResolverAliasOf(fontId) {
  const rec = fontResolver.resolveFontById(fontId);
  return rec.ok ? rec.record.aliases[0] : null;
}

module.exports = {
  MeasureAPI, registerFont, unregisterFont, clearRegisteredFonts, restoreFontRegistration,
  charWidthEm, registeredFonts, resolveMeasureImpl,
  measureItem, environmentFingerprint, MEASURE_ENGINE_VERSION, itemCacheStats, clearItemMeasureCache, stringCacheStats,
  FONT_WIDTH_PROFILES, familyWidthProfileOf,
  deepFreeze: _deepFreeze, canonicalStringify: _canonicalStringify
};
