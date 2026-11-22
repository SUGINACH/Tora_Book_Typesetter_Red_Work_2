// src/engine/notes/markers.js — Unified note-marker module (S7.1.5/6, REQ-FN-05/06; D-30/D-41)
'use strict';

/**
 * מקור־הסמכות היחיד לסמני הערות בכל המוצר: גוף, מרזב, עמודי הערות.
 * לפני האיחוד היו שלושה ממירים שונים (pipeline `[n]` קשיח, dom-renderer markerFor,
 * endnote-pages formatMarker) — מה שגרם לאי־עקביות מספור בין גוף לעמודי הערות (P1-3).
 * כל שינוי סגנון/מדיניות נעשה כאן בלבד; כל הצרכנים קוראים מכאן (single source).
 */

const HEB_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];

/** **S5.2 (תיקון 10 — מוסכמת הגרשיים של הגיליון):** סיומת סמן לפי המוסכמה
 *  שמממש folio.toHebrewNumber/finish: אות בודדת ⇒ אות+גרש (א׳);
 *  שתי אותיות ומעלה ⇒ גרשיים **לפני האות האחרונה** (כ״ג — לא כג׳ הישן).
 *  יישום מקומי בעל אותה צורה (shared-shaped) — בלי ייבוא folio.js
 *  (מניעת תלות decoration↔notes; נבדק — folio.js אינו דורש את markers,
 *  כך שאין מעגל, אבל ההפרדה מונעת תלות עתידית). */
function hebrewMarkFinish(letters) {
  if (letters.length <= 1) return letters + '\u05F3';            // א׳ — גרש
  return letters.slice(0, -1) + '\u05F4' + letters.slice(-1);   // כ״ג — גרשיים לפני האחרונה
}

/** גימטריה בלבד (בלי סיומת) — על בסיס אותיות 22; מעל 999 — חלק אלפים בגרש
 *  (כמו toGematria של המורשת — הגבול המפורש של D-108 לשדות שאינם פוליו). */
function hebrewBare(index1Based) {
  let i = index1Based - 1, s = '';
  if (i < 0) return 'א';
  do { s = HEB_LETTERS[i % 22] + s; i = Math.floor(i / 22) - 1; } while (i >= 0);
  if (index1Based >= 1000) {
    const th = Math.floor(index1Based / 1000);
    let j = th - 1, ts = '';
    do { ts = HEB_LETTERS[j % 22] + ts; j = Math.floor(j / 22) - 1; } while (j >= 0);
    s = ts + '\u05F3' + hebrewBare(index1Based % 1000 || 1);
  }
  return s;
}

/** סמן בודד לפי סגנון הרישום (footnote-marker-style).
 *  **Iteration-003 (legacy parity):** סגנון 'hebrew' — גימטריה + מפריד הרישום
 *  (note-num-separator, ברירת מחדל '.') — בדיוק כמו markerWord של המורשת
 *  (toGematria(n) + sep). הגרש מהמוסכמת של הגיליון (S5.2 תיקון 10) אינו
 *  חל על סמני הערות — גבול D-108 עצמו ("אין להסיק מכלל זה דבר על ... גרש
 *  בהערות"); 'hebrew-geresh' נשמר כבחירה מפורשת בלבד. */
function markerFor(index1Based, style, opts) {
  const separator = opts && opts.separator != null ? String(opts.separator) : '.';
  switch (style) {
    case 'decimal': return String(index1Based);
    case 'parenthesis': return `(${index1Based})`;
    case 'asterisk': {
      const n = ((index1Based - 1) % 3) + 1; // *,**,*** ואז חוזר — policy מקובלת
      return '*'.repeat(n) + (index1Based > 3 ? String(Math.ceil(index1Based / 3)) : '');
    }
    case 'hebrew':
      return hebrewBare(index1Based) + separator;
    case 'hebrew-geresh':
    default: {
      let i = index1Based - 1, s = '';
      if (i < 0) return 'א׳';
      do { s = HEB_LETTERS[i % 22] + s; i = Math.floor(i / 22) - 1; } while (i >= 0);
      // **S5.2 (תיקון 10):** בעבר תמיד גרש בסוף (כג׳) — בניגוד למוסכמת
      // הגרשיים של הגיליון. כעת hebrewMarkFinish: א׳/כ״ג.
      return hebrewMarkFinish(s);
    }
  }
}

/**
 * מספור לפי מדיניות איפוס (footnote-reset-policy):
 *  - continuous: מונה כלל־מסמך אחד.
 *  - page:       איפוס בכל עמוד (מרזב).
 *  - section/part: איפוס בכל חלק (H1) — ברירת מחדל לעמודי הערות; shaar-sub ייתמך ב‑S8.
 * מחזיר פונקציית next() שמקבלת הקשר {page, part} ומנפיקה מספור 1‑based.
 */
function makeCounter(policy, start = 0) {
  let counter = start;
  let lastKey = null;
  const scopeKey = (ctx) => {
    switch (policy) {
      case 'page': return `p${ctx && ctx.page != null ? ctx.page : '?'}`;
      case 'section':
      case 'part': return `b${ctx && ctx.part != null ? ctx.part : '?'}`;
      default: return 'doc'; // continuous
    }
  };
  return function next(ctx = {}) {
    const key = scopeKey(ctx);
    if (policy === 'page' || policy === 'section' || policy === 'part') {
      if (lastKey !== null && key !== lastKey) counter = 0; // איפוס בהחלפת היקף
    }
    lastKey = key;
    counter++;
    return counter;
  };
}

// **S5.2 (תיקון 11):** splitPlaceholder הוסר — קוד מת מלכודתי: פיצול על ':'
// היה מבתק שעות (12:30) אם אי־פעם היה נעשה בו שימוש חוזר; ה-placeholder
// האמיתי של D-30 משתמש ב-U+E000 (ראה explodePlaceholderWord ב-pipeline).

/**
 * **S67 (R2-M4 — סגירת no-op):** מחדש-מספור סמני הערות-שוליים במדיניות
 * footnote-reset-policy='page'. הרקע: הסמנים מוקצים בזמן הפענוח — בטרם
 * ידוע לאיזה עמוד כל הערה תיפול — ולכן המונה במדיניות 'page' קיבל תמיד
 * את אותו מפתח-היקף ('?') והתנהג כ-continuous (no-op). הפתרון: הקצאה
 * עקבית-מסמך בפענוח (סמנים ישנים ייחודיים), ולאחר תכנון העמודים — כשכל
 * הערה כבר קשורה לעמוד — מעבר מחדש-מספור לפי עמוד הופעתה הראשון.
 *
 * בטיחות גיאומטרית: מספר פר-עמוד תמיד ≤ המספר הרציף ⇒ הסמן רק מתקצר
 * (או נשאר) ⇒ שום שורה לא מתארכת ואין סיכון עטיפה מחדש; שברי המשך
 * ('split-rest') והצגות חוזרות יורשים את סמן ההופעה הראשונה (סמן אחיד — D-30).
 *
 * @param {Array} pages - עמודי המודל (לאחר planPages; footnotes מצורפות)
 * @param {object} opts - { markerStyle, markersByToken, customMarks, blocks, eventLog }
 *   markersByToken: Map tokenId→[{noteIndex,marker}] (הסמנים הישנים — מהפענוח)
 *   customMarks: Set של סמני סגנונות-מותאמים — בהתנגשות עם סמן ישן מדלגים
 *                בבטחה (אין דריסה עיוורת של סמן מותאם).
 * @returns {{renumbered:number, skipped:string|null}} — כמה סמנים הוחלפו; אם דילוג — סיבתו.
 */
function renumberPageScopedMarkers(pages, opts) {
  const { markerStyle, markerSeparator, markersByToken, customMarks, blocks, eventLog } = opts || {};
  const tokenMark = new Map(); // tokenId → סמן חדש (מופע ראשון)

  // שלב א (תכנון בלבד — בלי מוטציה): מספור פר-עמוד לפי סדר הופעה ראשון
  let anyChange = false;
  for (const pg of pages) {
    let seq = 0;
    for (const n of (pg.footnotes || [])) {
      if (!n || n.tokenId == null) continue;
      if (!tokenMark.has(n.tokenId)) {
        seq += 1;
        tokenMark.set(n.tokenId, markerFor(seq, markerStyle, { separator: markerSeparator != null ? markerSeparator : '.' }));
      }
      if (n.marker !== tokenMark.get(n.tokenId)) anyChange = true;
    }
  }
  if (!anyChange) return { renumbered: 0, skipped: null };

  // שלב ב: מפת סמן-ישן→סמן-חדש (הסמנים הישנים ייחודיים — הקצאה רציפה).
  // הבדיקה קודמת לכל מוטציה: התנגשות עם סמן מותאם ⇒ דילוג מלא ונקי.
  const oldToNew = new Map();
  for (const [tokenId, assigns] of (markersByToken || new Map())) {
    const nm = tokenMark.get(tokenId);
    if (nm == null) continue;
    for (const a of assigns) {
      if (a.marker !== nm) oldToNew.set(a.marker, nm);
    }
  }
  for (const oldM of oldToNew.keys()) {
    if (customMarks && customMarks.has(oldM)) {
      if (eventLog) eventLog.emit('notes', 'fn-renumber-page-skip', { reason: 'custom-marker-collision', marker: oldM });
      return { renumbered: 0, skipped: 'custom-marker-collision' };
    }
  }
  if (!oldToNew.size) return { renumbered: 0, skipped: null };

  // שלב ג (החלה): מרזב — כל מופע/שבר/הצגה-חוזרת מקבל את סמן המופע הראשון
  let renumbered = 0;
  for (const pg of pages) {
    for (const n of (pg.footnotes || [])) {
      if (!n || n.tokenId == null) continue;
      const nm = tokenMark.get(n.tokenId);
      if (nm != null && n.marker !== nm) { n.marker = nm; renumbered++; }
    }
  }

  // שלב ד: החלפה בגוף המסמך — שתי תבניות מילה:
  //   (1) סמן מתויג (D-53): …\uE102סמן (לפני NBSP או בסוף המילה)
  //   (2) הערה שנדחתה לגוף: סמן\uE000טקסט (בראש המילה)
  const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const res = [];
  for (const [oldM, newM] of oldToNew) {
    res.push([new RegExp('\\uE102' + esc(oldM) + '(?=\\u00A0|$)', 'g'), '\uE102' + newM]);
    res.push([new RegExp('^' + esc(oldM) + '\\uE000'), newM + '\uE000']);
  }
  let touchedWords = 0;
  for (const pg of pages) {
    for (const col of (pg.columns || [])) {
      for (const ln of col) {
        if (!Array.isArray(ln.words)) continue;
        for (let wi = 0; wi < ln.words.length; wi++) {
          const w = ln.words[wi];
          if (typeof w !== 'string') continue;
          let out = w;
          for (const [re, to] of res) out = out.replace(re, to);
          if (out !== w) { ln.words[wi] = out; touchedWords++; }
        }
      }
    }
  }

  // שלב ה: עדכון הרישומים (noteAssignments/rejectedNotes של הבלוקים) — אמת-דיווח
  for (const [, assigns] of (markersByToken || new Map())) {
    for (const a of assigns) {
      const nm = oldToNew.get(a.marker);
      if (nm != null) a.marker = nm;
    }
  }
  for (const b of (blocks || [])) {
    for (const n of (b.rejectedNotes || [])) {
      const nm = oldToNew.get(n.marker);
      if (nm != null) n.marker = nm;
    }
  }
  if (eventLog) eventLog.emit('notes', 'fn-renumber-page', { renumbered, touchedWords });
  return { renumbered, touchedWords, skipped: null };
}

/**
 * **שלב 5 (חילוץ שורש מ-PR #16, S78/D-107 — עוזר זיהוי סמן מתויג):**
 * חילוץ טקסט הסמן ממילת גוף — אותו פענוח של ה-pipeline (countKnown) ושל
 * המתכנן (הערות עוקבות-עוגן): מקור יחיד לתבנית D-53.
 *  - מילה עם E000 (הערה שנדחתה לגוף): הסמן הוא הפרגמנט שלפני ה-E000
 *    (עשוי להיות ממוזג לעוגן ב-NBSP — מנורמל לרווח לפני הפיצול).
 *  - מילה עם תג \uE102 (סמן מתויג): הפרגמנט שאחרי התג עד NBSP/רווח.
 * @returns {string|null} — טקסט הסמן או null אם המילה אינה נושאת סמן.
 */
function markerFragmentOf(word) {
  const sw = String(word);
  if (sw.includes('\uE000')) {
    const at = sw.indexOf('\uE000');
    const frags = sw.slice(0, at).replace(/\u00A0/g, ' ').split(' ').filter(Boolean);
    return frags.length ? frags[frags.length - 1] : null;
  }
  if (!sw.includes('\uE102')) return null;
  const at = sw.indexOf('\uE102');
  const frag = sw.slice(at + 1).split(/[\u00A0 ]/)[0];
  return frag || null;
}

/** **Iteration-003:** סמן לפי ההגדרות המלאות — סגנון + מפריד (note-num-separator
 *  מה-raw של IMUD כשקיים; ברירת מחדל '.') — מקור אחד לכל הצרכנים עם settings. */
function markerForSettings(index1Based, settings) {
  const s = settings || {};
  const style = s['footnote-marker-style'];
  const sep = s['note-num-separator'] != null ? s['note-num-separator']
    : (s._imudRaw && s._imudRaw['note-num-separator'] != null ? s._imudRaw['note-num-separator'] : '.');
  return markerFor(index1Based, style, { separator: sep });
}

module.exports = { markerFor, markerForSettings, makeCounter, hebrewMarkFinish, hebrewBare, HEB_LETTERS, renumberPageScopedMarkers, markerFragmentOf, MARK_TAG: '\uE102' };
