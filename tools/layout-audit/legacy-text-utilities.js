// tools/layout-audit/legacy-text-utilities.js — פונקציות עזר טקסט היסטוריות לכלי האודיט (בלבד!)
'use strict';

/**
 * **השלמת הסרת המנוע הישן (2ae45b9):** הפונקציות הטהורות האלה (פענוח טקסט
 * נטו־ללא־עימוד: הסרת עריכה, מטא-נתונים, טוקניזציה) שימשו אך ורק את כלי
 * האודיט run-full-math לחישוב "מילות התוכן הצפויות" — הן הוגדרו בעבר
 * בתוך legacy-imud-flow.js ונמחקו עמו. הן אינן מנוע עימוד ואינן נטענות
 * במוצר (המנוע המאוחד בלבד); הן משוחזרות כאן ורבאטים כדי שהאודיט יוסיף
 * למדוד את אותה רצפת ציפיות בדיוק (ללא כיול מחדש). מקור: 2ae45b9^
 * (legacy-imud-flow.js שורות 96-189 ו-291-376) — המנוע המלא מגובה בריפו
 * Red_Old.
 */

function stripEditorialNotes(text) {
  return String(text || '')
    .replace(/##[\s\S]*?##/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([,.:;!?])/g, '$1')
    .trim();
}

const META_FIELDS = [
  ['bookTitle', /^(?:שם הספר[:\s]*)?שם הספר\s*[-–—:]\s*/i],
  ['subject', /^(?:נושא(?:\\|\/)כותרת משנה[:\s]*)?נושא\s*[-–—:]\s*/i],
  ['desc', /^(?:נושא מפורט\s*(?:\\|\/)\s*תיאור[:\s]*)?נושא מפורט\s*[-–—:]\s*/i],
  ['edition', /^(?:פרטי מהדורא\s*(?:\\|\/)\s*חלקים[:\s]*)?פרטי מהדורא\s*[-–—:]\s*/i],
  ['author', /^(?:שם המחבר[:\s]*)?שם המחבר\s*[-–—:]\s*/i],
  ['copyright', /^שמירת זכויות\s*[-–—:]\s*/i],
  ['publisher', /^פרטי הוצאה לאור\s*[-–—:]\s*/i],
  ['contact', /^פרטי קשר\s*[-–—:]\s*/i],
  ['extra', /^פרטים נוספים\s*[-–—:]\s*/i],
  ['year', /^(?:מקום ושנת הוצאה[:\s]*)?מקום ושנת הוצאה\s*[-–—:]\s*/i]
];

function parseMetadata(rawText) {
  const meta = {};
  const clean = [];
  for (const line of String(rawText).split('\n')) {
    const t = line.trim();
    let hit = false;
    for (const [key, re] of META_FIELDS) {
      if (re.test(t)) { meta[key] = t.replace(re, '').trim(); hit = true; break; }
    }
    if (!hit) clean.push(line);
  }
  return { meta, text: clean.join('\n') };
}

/** תוחמי הערות: [ ... ] — זיהוי זוגות (כמו findDelimiterMatches במקור). */
function findNotes(text, open, close) {
  const out = [];
  if (!open || !close) return out;
  let from = 0;
  for (;;) {
    const s = text.indexOf(open, from);
    if (s === -1) break;
    const e = text.indexOf(close, s + open.length);
    if (e === -1) break;
    out.push({ start: s, end: e + close.length, text: text.slice(s + open.length, e) });
    from = e + close.length;
  }
  return out;
}

function hasUnclosedNote(text, open, close) {
  if (!open || !close) return false;
  const s = text.indexOf(open);
  if (s === -1) return false;
  return text.indexOf(close, s + open.length) === -1;
}

/** קריאת קונפיגורציה מה-JSON המקורי (עם ברירות המחדל ההיסטוריות).
 * **S77 (בקשה 3 — "הרבה הגדרות שלא מחוברות"): גשר חי מהרישום.** עד כאן
 * המנוע קרא את הקונפיגורציה מה-raw בלבד (_imudRaw) — והגדרות הרישום
 * שמקבילות לו (גדלים/מתגים/טקסטים) לא עשו דבר בפרופיל המורשת (הנתיב
 * החי; נמדר באתר החי: body/shaar/heading sizes, מתגי שערים ותכנים —
 * שינוי לא השפיע). כעת: לכל מפתח raw עם מפתח רישום מקביל — ההגדרה
 * החיה גוברת. הייבוא של ברירות המחדל ממפה את אותם הערכים בדיוק,
 * ולכן ברירת המחדל אינה משתנה (הוכחת digest); שינוי חי בפאנל משפיע
 * מיד. מפתחות גיאומטריים (size-body/line-height-body/s-h2..s-h7)
 * אינם בגשר — הם מצומדים לקבועים מכוילים (LINE_H/מפתחי פס/עיגון)
 * ודורשים העברת כיול ייעודית (מתועד בקובץ המעבר). */
const RED_SETTING_BRIDGE_S77 = {
  's-h0': 'heading-0-size-pt',
  's-h1': 'heading-1-size-pt',
  's-sh-sub': 'shaar-subtitle-size-pt',
  's-sh-title': 'shaar-title-size-pt',
  's-sh-desc': 'shaar-desc-size-pt',
  's-sh-sec': 'shaar-sections-size-pt',
  's-sh-author': 'shaar-author-size-pt',
  's-sh-year': 'shaar-year-size-pt',
  'fn-delim-open': 'fn-delim-open',
  'fn-delim-close': 'fn-delim-close',
  'en-line-prefix': 'en-line-prefix',
  'drop-word-mode': 'first-word-mode',
  'drop-word-count': 'first-word-length',
  'drop-word-min-lines': 'first-word-threshold-lines',
  'show-main-shaar': 'shaar-main-enabled',
  'show-back-shaar': 'shaar-back-enabled',
  'show-sub-shaar': 'shaar-sub-enabled',
  'fn-title-text': 'endnote-title-text',
  'enable-general-toc': 'toc-general-enabled',
  'enable-detailed-toc': 'toc-detail-enabled',
  'general-toc-count-numbering': 'general-toc-count-numbering',
  'detailed-toc-count-numbering': 'detailed-toc-count-numbering',
  'imbalance-max-delta-px': 'imbalance-max-delta-px'
};

const LEGACY_HEADING_RE = /^כותרת\s*(\d+)(?:\s+מספר\s+(\d+))?.*?[-–—]\s*(.*)$/;

function tokenizeDoc(rawText, cfg) {
  let text = stripEditorialNotes(rawText);
  const { meta, text: noMeta } = parseMetadata(text);
  text = noMeta;
  const isHeadingLine = (s) => /^כותרת\s*\d/.test(s.trim());
  if (cfg.fnOpen) {
    // **תיקון הדבקת שורת-הערה (נמצא בקורפוס הגדול, 04.11):** בעבר ההדבקה
    // '\s+[' חצתה שורות גם לתוך כותרות — הערה שבאה אחרי 'כותרת 7' נבלעה
    // לתוך הערת-הצד, והערת-צד נוספת שאחריה דרסה אותה סופית (3 הערות אבדו,
    // 1,353 מילים בשימור התוכן). כעת: שורת-הערה נדבקת לפסקה הקודמת **בלבד**
    // (במקור ההדבקה פעלה בתוך בלוק טקסט אחד; כותרת פותחת בלוק חדש);
    // אחרי כותרת היא נשארת פסקה עצמאית — שורת סמן + הערה בתחתית — והתוכן
    // נשמר במלואו. הדבקה בתוך-שורה ('מילה [הערה]') נשמרת כפי שהייתה.
    const esc = cfg.fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const src = text.split('\n');
    const out = [];
    for (let i = 0; i < src.length; i++) {
      const ln = src[i];
      if (out.length && ln.trim().startsWith(cfg.fnOpen)) {
        let j = out.length - 1;
        while (j >= 0 && !out[j].trim()) j--;
        if (j >= 0 && !isHeadingLine(out[j])) {
          out[j] = out[j].replace(/\s+$/, '') + ln.trim();
          continue;
        }
      }
      out.push(ln);
    }
    text = out.join('\n').replace(new RegExp('[ \\t]+(' + esc + ')', 'g'), '$1');
  }
  const lines = text.split('\n');
  const tokens = [];
  let pendingSideNote = null;
  let pendingEndNote = null;
  const endPrefix = cfg.endPrefix;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    while (hasUnclosedNote(line, cfg.fnOpen, cfg.fnClose) && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!next) break;
      i++; line += ' ' + next;
    }
    if (endPrefix && line.startsWith(endPrefix)) {
      pendingEndNote = line.slice(endPrefix.length).replace(/^[:\-–—]\s*/, '').trim();
      continue;
    }
    const hMatch = line.match(LEGACY_HEADING_RE); // **9c (§5.1):** מקור יחיד — הייצוא משמש גם את כלי האבחון
    if (hMatch) {
      const lvl = parseInt(hMatch[1], 10);
      const txt = (hMatch[3] || '').trim();
      const num = hMatch[2] ? parseInt(hMatch[2], 10) : null;
      if (lvl === 7 && HEADING_MODES[7] === 'side_note') {
        // **תיקון הצטברות הערות-צד (נמצא בקורפוס הגדול):** שתי כותרות 7 בלי
        // פסקה ביניהן (למשל h7 ← h3 ← h7 ← פסקה) — בעבר השנייה דרסה את הראשונה
        // ותוכנה אבד. כעת הן מצטברות; ב-no_long אין אף מקרה כזה (0 סיכון פריטי).
        pendingSideNote = pendingSideNote ? pendingSideNote + ' — ' + txt : txt;
      } else {
        tokens.push({ id: tokens.length, type: 'h' + lvl, level: lvl, text: txt, num });
      }
    } else {
      tokens.push({
        id: tokens.length, type: 'p', text: line,
        sideNote: pendingSideNote, endNote: pendingEndNote
      });
      pendingSideNote = null; pendingEndNote = null;
    }
  }
  // **S5.2 (מיפוי מוקשים F4):** פלוש שאריות בסוף מסמך — הערת-צד (h7) או
  // הערת-סיום שהמתינו לפסקה שלא באה אבדו בשקט (pendingSideNote/pendingEndNote
  // מעולם לא נצרכו). כעת: הערת-צד זנבורית נשפכת כפסקה גלויה (התוכן נשמר
  // ונראה — עדיף על אובדן), והערת-סיום זנבורית נסגרר לפסקה ריקה הנושאת
  // את ה-endNote (עמודי הערות-הסיום אוספים מהטוקנים ישירות).
  if (pendingSideNote || pendingEndNote) {
    tokens.push({
      id: tokens.length, type: 'p',
      text: pendingSideNote || '',
      sideNote: null, endNote: pendingEndNote,
      syntheticTail: true
    });
  }
  return { meta, tokens };
}

module.exports = { stripEditorialNotes, parseMetadata, tokenizeDoc, LEGACY_HEADING_RE };
