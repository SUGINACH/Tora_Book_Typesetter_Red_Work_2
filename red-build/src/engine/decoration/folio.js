// src/engine/decoration/folio.js — Page numbering: Hebrew letters, frames, positions, initial value (REQ-HDR-03/04, S9)
'use strict';

const UNITS = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUND = ['', 'ק', 'ר', 'ש', 'ת', 'תר', 'תש', 'תת', 'תתק'];

/**
 * מספר עברי (D-37) — **לשדות שאינם פוליו בלבד** (D-108: פוליו חשוף, ראה toBareGematria):
 *  - אות בודדת ⇒ אות + גרש (׳): א׳=1, כ׳=20, ת׳=400.
 *  - שתי אותיות ומעלה ⇒ גרשיים (״) לפני האות האחרונה: ט״ו=15, ט״ז=16, כ״א=21, תש״ב=702, תשמ״ב=742.
 *  - 15/16 ⇒ ט״ו/ט״ז (לא יה+וו).
 *  - אלפים: אלפים + ׳ ואז שארית המספר: 5702 ⇒ ה׳תש״ב; 1000 ⇒ א׳; 1001 ⇒ א׳א.
 *  תיקון P1-8: גרשיים עבריים ״ (U+05F4) במקום מרכאות לטיניות "; טיפול באלפים.
 */
function toHebrewNumber(n) {
  if (!Number.isInteger(n) || n <= 0) return String(n);
  let thousands = '';
  let rest = n;
  if (n >= 1000) {
    // סימן אלפים: גרש אחרי חלק האלפים — אלא אם כבר ישנו (5 ⇒ ה׳ כבר עם גרש; 12 ⇒ י״ב עם גרשיים)
    let t = toHebrewNumber(Math.floor(n / 1000));
    if (!/[\u05F3\u05F4]$/.test(t)) t += '\u05F3';
    thousands = t;
    rest = n % 1000;
    if (rest === 0) return thousands;
  }
  let out = '';
  while (rest >= 800) { out += 'ת'; rest -= 400; } // 800+=ת"ת
  if (rest >= 400) { out += 'ת'; rest -= 400; }
  if (rest >= 100) { out += HUND[Math.floor(rest / 100)]; rest %= 100; }
  if (rest === 15) { out += 'טו'; return finish(thousands, out); }
  if (rest === 16) { out += 'טז'; return finish(thousands, out); }
  const tens = Math.floor(rest / 10) * 10, unit = rest % 10;
  if (tens && unit) out += TENS[tens / 10] + UNITS[unit];
  else out += TENS[tens / 10] + UNITS[unit];
  return finish(thousands, out);
}

/** הרכבה סופית: גרש/גרשיים לפי מספר האותיות + צירוף אלפים.
 *  שארית של אות בודדת אחרי סימן אלפים (1001 ⇒ א׳א) לא מקבלת גרש משלה —
 *  סימן האלפים כבר מסמן את המספר כולו (D-37). */
function finish(thousands, letters) {
  let body = letters;
  if (thousands && body.length === 1) {
    // א׳א (1001), ה׳ב (5002) — אות שארית בודדת בלי גרש נוסף
  } else if (body.length === 1) {
    body = body + '\u05F3';            // אות בודדת ⇒ גרש
  } else if (body.length >= 2) {
    body = body.slice(0, -1) + '\u05F4' + body.slice(-1); // גרשיים לפני האות האחרונה
  }
  return thousands ? thousands + body : body;
}

/** **D-108 (19.11 — תיקון מפורש להחלת D-31 על פוליו):** גימטריה חשופה למספרי
 *  עמודים מודפסים — הגיליון בתחתית העמוד ומספרי העמודים בתוכן העניינים —
 *  בלי גרש (U+05F3), בלי גרשיים (U+05F4), בלי אפוסטרוף ASCII ובלי מפריד
 *  אחר, גם בחלק האלפים: 1=א, 2=ב, 15=טו, 16=טז, 21=כא, 22=כב, 100=ק,
 *  999=תתקצט, 1000=א, 1001=אא, 5702=התשב.
 *  D-31/D-37 (המספור עם גרש/גרשיים) **אינם חלים על פוליו** — הם נשארים
 *  לשדות שאינם פוליו (סמני הערות ותצוגות אחרות; "אין להסיק מכלל זה דבר
 *  על סימני ציטוט/גרש בהערות, בגוף הטקסט או בשדות אחרים").
 *  **מקור סמכות יחיד:** זהו פורמט הפוליו הקנוני של שני המנועים — מסלול
 *  המורשת (legacy-imud-flow) קורא אותה ל-folioDisplay ולתוויות ה-TOC
 *  (parity legacy↔unified; היסטורית toGematria של המורשת היה חשוף עד 999
 *  והוסיף מפריד אלפים מעליו — D-108 אוסר מפריד בכל ערך).
 *  ערך לא-חיובי/בלתי-נבדל ⇒ '' (כמו המורשת: folioDisplay ריק). */
function toBareGematria(n) {
  n = parseInt(n, 10);
  if (isNaN(n) || n <= 0) return '';
  if (n === 15) return 'טו';
  if (n === 16) return 'טז';
  // אלפים — בלי שום מפריד (D-108): 1000=א, 1001=אא, 5702=התשב
  if (n >= 1000) return toBareGematria(Math.floor(n / 1000)) + toBareGematria(n % 1000);
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  let str = '';
  let h = Math.floor(n / 100);
  if (h > 0) { str += hundreds[Math.min(h, 9)]; n %= 100; }
  const t = Math.floor(n / 10), o = n % 10;
  if (t === 1 && (o === 5 || o === 6)) str += (o === 5) ? 'טו' : 'טז';
  else str += tens[t] + ones[o];
  return str;
}

function formatPageNumber(value, settings) {
  switch (settings['page-num-format']) {
    case 'decimal': return String(value);
    // **D-108:** מספר עמוד מוצג בגימטריה חשופה בלבד — הן הפורמט העברי
    // (ברירת המחדל; 'gematria' של ערכות IMUD נופל לכאן) והן חלק המספר
    // של daf-hebrew. אין גרש/גרשיים/מפריד בשום פוליו ובשום תווית TOC.
    case 'daf-hebrew': return `דף ${toBareGematria(value)}`;
    default: return toBareGematria(value);
  }
}

/** מסגרות CSS (badge) לעומת מסגרות טקסטואליות (D-61):
 *  circle/square — טבעת/תיבה מצוירות ב‑CSS (class folio--frame-*), הטקסט עצמו לא משתנה;
 *  parenthesis/squares/floral/diamond — תווית טקסטואלית סביב המספר. */
function isCssFrame(frame) {
  return frame === 'circle' || frame === 'square';
}

function frameNumber(text, frame) {
  switch (frame) {
    case 'parenthesis': return `(${text})`;
    case 'squares': return `[${text}]`;
    case 'floral': return `\u2766 ${text} \u2766`;
    case 'diamond': return `\u25C7 ${text} \u25C7`;
    default: return text; // none / circle / square — circle ו־square מצוירים ב‑CSS
  }
}

/** תווית תצוגה ל‑TOC — תמיד לפי פורמט המספור, בלי מסגרת (המסגרת שייכת לגיליון בלבד). */
function tocPageLabel(value, settings) {
  return formatPageNumber(value, settings);
}

/**
 * הקצאת מספרים לפי כללי count/show per type (shaar/toc/endnotes checkboxes).
 * **D-36:** עמודי פתיחה (פרק/סימן, chapterOpening) — נספרים אך לא מציגים גיליון.
 * **S9 (D-61) — שחזור נוסחת V1 (REQ-HDR-03):** לכל עמוד נספר נספר סוד (ordinal)
 * עולה. הערך האפקטיבי = סוד − start‑idx + initial‑value; הגיליון מוצג רק כאשר
 * סוד ≥ start‑idx (ב‑V1: `pNum >= startIdx`, formatPageNumberDisplay).
 * **S9 (D-62):** עמודי toc-general/toc-detail מציגים גיליון רק אם נספרים
 * (count-toc-pages) וגם show-numbering שלהם דלוק (Orange eb21383 wiring).
 * @param {Array} pages - [{type, template:{counts}, chapterOpening}]
 */
function assignNumbers(pages, settings) {
  const startIdx = Math.max(1, Math.round(settings['page-num-start-idx'] || 1));
  const initialValue = Math.round(settings['page-num-initial-value'] || 1);
  const posNone = settings['page-num-position'] === 'none';
  let ordinal = 0;
  return pages.map(p => {
    const tpl = p.template;
    let counted = !!tpl.counts;
    // **Iteration-003 (legacy parity):** המקור מונה שער-משנה בפוליו אך לא ראשי/אחורי —
    // בקרה פר-סוג (sub-shaar-count-numbering=true, main/back=false ברירת המקור).
    if (p.type === 'shaar-main' || p.type === 'shaar-back') counted = counted && settings['count-shaar-pages'];
    if (p.type === 'shaar-sub') counted = counted && (settings['count-shaar-sub-pages'] === true || settings['count-shaar-pages']);
    // עמודי התוכן — מקור יחיד: count-toc-pages. דגלי המקור
    // (general/detailed-toc-count-numbering=true) ממופים אליו בייבוא
    // (legacy-settings-map — לאחר תיקון הכפילות); עד כאן נקראו גם כאן
    // ישירות והמנייה דלפה גם לפרופיל DP (ברירת המחדל ברגיסטרי true).
    if (p.type === 'toc-general') counted = counted && settings['count-toc-pages'];
    if (p.type === 'toc-detail') counted = counted && settings['count-toc-pages'];
    if (p.type === 'endnotes') counted = counted && (settings['count-endnote-pages'] === true);
    if (p.type === 'custom' && p.counted === false) counted = false; // PT-09: "האם נספר" — לפי ההגדרה
    if (!counted) return { page: null, ordinal: null, display: '', shown: false, counted: false };
    ordinal++; // סוד העמוד הנספר (1 ואילך)
    const effective = ordinal - startIdx + initialValue;
    // D-36: פתיחת פרק/סימן — נספר, לא מוצג; עמודי הערות לא מציגים כותרת עליונה ממילא
    const suppressDisplay = p.chapterOpening === true;
    // D-62: show-numbering של עמודי תוכן־העניינים (מוחל רק כשנספרים)
    let showFlag = true;
    if (p.type === 'toc-general') showFlag = settings['general-toc-show-numbering'] !== false;
    if (p.type === 'toc-detail') showFlag = settings['detailed-toc-show-numbering'] !== false;
    const visible = ordinal >= startIdx; // V1: הצגה רק מ‑start‑idx ואילך
    const display = visible ? frameNumber(formatPageNumber(effective, settings), settings['page-num-frame']) : '';
    return {
      page: effective,
      ordinal,
      display,
      shown: !posNone && visible && !suppressDisplay && showFlag,
      counted: true,
    };
  });
}

module.exports = {
  toHebrewNumber, toBareGematria, formatPageNumber, frameNumber, tocPageLabel,
  isCssFrame, assignNumbers,
};
