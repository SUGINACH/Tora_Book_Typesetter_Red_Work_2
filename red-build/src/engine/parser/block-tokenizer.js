// src/engine/parser/block-tokenizer.js — H0–H7 / P / endnote / editorial tokens (REQ-PAR-03/04, CP1)
'use strict';

const { sha256OfJsonArrayElements } = require('../core/canonical-hash');
const { HEADING_RE, ENDNOTE_CLASS_RE, DEFAULT_ENDNOTE_PREFIX, compileEndnotePrefix } = require('./dfa-lexer');
const { scanBrackets } = require('./bracket-scanner');

/** **9b.4 (D-91 — התנהגות המקור היא המפרס):** האם בטקסט פותח-הערה שאין אחריו
 * סוגר כלל — שיקוף מדויק של hasUnclosedNote של המורשת (indexOf ראשון; היעדר
 * סוגר אחריו). שים לב: `[a] [b` אינו "פתוח" לפי הכלל הזה — הסוגר של הזוג
 * הראשון נמצא אחרי הפותח הראשון — ולכן אין הדבקה (התנהגות המקור). */
function hasUnclosedNote(text, open, close) {
  if (!open || !close) return false;
  const s = text.indexOf(open);
  if (s === -1) return false;
  return text.indexOf(close, s + open.length) === -1;
}

/** **9b.4:** שורה מבנית שנבלעת לתוך הדבקת הערה — חייבת ממצא מפורש (לא היעלמות
 * שקטה): כותרת / קידומת הערת-סיום / הוראת כותרת עמודי ההערות.
 * **9c (§5.2 — הדקדוק האמיתי הוא המפרס):** הצורות כאן חייבות לשקף את הדקדוק
 * בפועל, לא חזות דומה — כותרת/חלק/הקדמה/הערות-סיום (מחלקה) דורשות מקף
 * מפריד כמו HEADING_RE/ENDNOTE_CLASS_RE; הערת-סיום יחידה מופיעה גם כמספרית
 * (`הערת סיום-1 - …` / `הערת סיום 1 - …` — ENDNOTE_NUMBERED), ולכן אחרי
 * "סיום" מותר רק מקף או ספרה (מרחב/סוף לבדם אינם הוראה). צורות דומות בלי
 * מקף (`הקדמה לספר`, `חלק בגדול`, `כותרת 3 משהו`) אינן הוראות מבניות ואינן
 * מסומנות — מנע אבחוני שווא (בדיקות שלילה ב-s9c-tooling-parity). */
const GLUE_STRUCTURAL_RE = /^(?:כותרת\s*[0-7](?:\s+מספר\s+\d+)?(?:\s*\([^)]*\))*\s*[-–—]|הער(?:ת|ות)\s*סיום(?=\s*(?:[-–—]|\d))|חלק\s+[א-ת]+\s*[-–—]|הקדמה\s*[-–—])/;

const ATOMIC_SPACE = '\uE000'; // V3/V4 breakthrough: רווח אטומי בתוך הערה — למדידה בלבד

// **S5.2 (תיקון 12 — תיעוד, ללא שינוי התנהגות):** הנרמול שלהלן (״→׳ ו-‘ ’→") הוא
// **מכוון** — כלל one-way לפי Z.ai fix (ראה protectors.glueNoteMarkers) — אין לשנותו.
/** נרמול גרשים/מרכאות + ניקוי PUA פנימי (REQ-PAR-05; Z.ai fixes). */
function normalizeText(s) {
  return s
    .replace(/[\u2018\u2019]/g, '"')            // חילוף מרכאות לועזיות
    .replace(/\u05F4/g, '\u05F3')               // גרשיים → גרש (כלל one-way לפי Z.ai fix)
    .replace(/[\uE000-\uF8FF]/g, (ch) => ch);   // PUA נשמר לבדיקה per-char; U+E000 מוסר לפני render בשלב output
}

let tokenSeq = 0;
function mkToken(type, payload) {
  return { id: `t${++tokenSeq}`, type, ...payload };
}

/**
 * **שלב 2 (חוזה פריט אחיד §2.1-4 — שימור טקסט ומיפוי מקור):** שלב א׳ של תמורת
 * השורה — trim + נרמול 1:1 (משמר אורך). רשומות הנרמול מאפשרות היפוך מדויק.
 * זהה חישובית ל-normalizeText(raw.trim()) — ההתנהגות לא השתנתה; נוסף מיפוי.
 */
function normalizeStage(rawLine) {
  const rawLead = rawLine.length - rawLine.trimStart().length;
  const rawTrail = rawLine.length - rawLine.trimEnd().length;
  const trimmed = rawLine.trim();
  const normalizations = [];
  let pre = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '\u05F4') { pre += '\u05F3'; normalizations.push({ offset: i, original: ch, normalized: '\u05F3', code: 'gershayim-to-geresh' }); }
    else if (ch === '\u2018' || ch === '\u2019') { pre += '"'; normalizations.push({ offset: i, original: ch, normalized: '"', code: 'quote-to-straight' }); }
    else pre += ch;
  }
  // **שלב 2:** טקסט השוליים המדויק (לא רק אורך) — שורה ריקה של רווחים/טאבים
  // נשחזרת תו-לתו ב-round-trip.
  return { pre, normalizations, rawLead, rawTrail, rawLeadText: rawLine.slice(0, rawLead), rawTrailText: rawLine.slice(rawLine.length - rawTrail) };
}

/**
 * **שלב 2:** שלב ב׳ של תמורת השורה — הסרת ##…## (החלפה ברווח), צמצום רווחים
 * ו-trim, בדיוק כמו הצעד הידני בפלג הפסקה. כל תו שהוסר נרשם עם טקסט המקור
 * (קטע editorial / ריצת רווחים / שוליים) וכל תו שנותר ממופה 1:1 (charMap) —
 * ההיפוך מדויק ונבדק ב-round-trip.
 */
function editorialStage(pre) {
  if (!/##.+?##/.test(pre)) {
    // אין editorial — הטוקניזר אינו מצמצם רווחים ואינו חותך שוליים במסלול זה.
    return { canonical: pre, charMap: pre.split('').map((_, i) => i), normalizations: [], removedSegments: [], droppedWs: [], edge: { lead: 0, trail: 0 } };
  }
  let mid = '';
  let mi = 0;
  const removedSegments = [];
  const map1 = []; // mid index → pre index
  const edRe = /##.+?##/g;
  let m;
  while ((m = edRe.exec(pre))) {
    mid += pre.slice(mi, m.index);
    for (let k = mi; k < m.index; k++) map1.push(k);
    mid += ' ';
    map1.push(m.index); // הרווח החלופי ממופה לתחילת הקטע שהוסר
    removedSegments.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
    mi = m.index + m[0].length;
  }
  mid += pre.slice(mi);
  for (let k = mi; k < pre.length; k++) map1.push(k);
  // צמצום ריצות רווחים לרווח בודד (כולל רישום הריצות שהוצרו).
  let mid2 = '';
  let ci = 0;
  const map2 = []; // mid2 index → mid index
  const wsRe = /\s+/g;
  let w;
  while ((w = wsRe.exec(mid))) {
    mid2 += mid.slice(ci, w.index);
    for (let k = ci; k < w.index; k++) map2.push(k);
    mid2 += ' ';
    map2.push(w.index);
    ci = w.index + w[0].length;
  }
  mid2 += mid.slice(ci);
  for (let k = ci; k < mid.length; k++) map2.push(k);
  const lead = mid2.length - mid2.trimStart().length;
  const trail = mid2.length - mid2.trimEnd().length;
  const canonical = mid2.trim();
  // שרשור המיפויים: קנוני → mid2 → mid → pre (map2 אחרי map1).
  const charMap = [];
  for (let k = lead; k < mid2.length - trail; k++) charMap.push(map1[map2[k]]);
  // **שלב 2 (שימור מלא):** ריצות הרווחים שהושמטו בצמצום/בשוליים — עם הטקסט
  // המקורי המדויק, בקואורדינטות pre. כל תו של pre מכוסה: editorial / רווח
  // שהושמט / תו ממופה 1:1 לקנוני (charMap).
  const canonOfPre = new Array(pre.length).fill(null);
  for (let cp = 0; cp < charMap.length; cp++) canonOfPre[charMap[cp]] = cp;
  const inSegment = new Array(pre.length).fill(false);
  for (const seg of removedSegments) for (let k = seg.start; k < seg.end; k++) inSegment[k] = true;
  const droppedWs = [];
  for (let p = 0; p < pre.length; p++) {
    if (inSegment[p] || canonOfPre[p] !== null) continue;
    let q = p;
    while (q < pre.length && !inSegment[q] && canonOfPre[q] === null) q++;
    const text = pre.slice(p, q);
    if (text.trim().length !== 0) throw new Error('block-tokenizer: non-whitespace character dropped in editorial stage — coverage bug');
    droppedWs.push({ start: p, end: q, text });
    p = q - 1;
  }
  return { canonical, charMap, normalizations: [], removedSegments, droppedWs, edge: { lead, trail } };
}

/** בדיקת עזר: האם תו מנורמל (חשיפה לבדיקות הפיכות). */
function isNormalizedChar(ch) {
  return ch === '\u05F4' || ch === '\u2018' || ch === '\u2019';
}

/**
 * Tokenizer: שורות → טוקנים.
 * - כותרת N - … (N∈0..7) → heading (מקף חובה; בלי מקף = פסקה בשקט)
 * - `##…##` → editorial — מוסר לחלוטין מהפלט אך נרשם ל‑audit
 * - `הערת סיון - …` → **endnote (תוכן!)** — הסמנטיקה המקורית (S4.5, תיקון D-40)
 * - `הערת סיון-1 - טקסט` → endnote ממוספרת (D-40; עוגן סמן).
 * - `הערות סיום - כותרת` (רבים!) → הוראת כותרת עמודי ההערות.
 * - תוחמי הערות השוליים מוגדרים: opts.fnOpen/fnClose (ברירת מחדל [ ]).
 * - `[a][b]` רצופים → הערות נפרדות (REQ-PAR-04)
 * - בתוך `[...]`: רווחים → \uE000 (אטומי, REQ-LB-04)
 * @param {string[]} bodyLines
 * @param {object} [opts] — { endnotePrefix, endnotePrefixRe, fnOpen, fnClose } (S4.5)
 */
function tokenize(bodyLines, opts = {}) {
  return tokenizeDetailed(bodyLines, opts).tokens;
}

/**
 * **שלב 2:** טוקניזציה מפורטת — אותם טוקנים בדיוק (byte-identical; tokenize()
 * מחזיר את זרם הטוקנים כמו שהיה), ובנוסף רשומות מקור לכל שורה: תמורת השורה
 * (trim/נרמול/editorial — הפיכה כולה), טווחי החלקים, טווחי ההערות והתוחמים
 * המדויקים. המודל הקנוני (engine/model/) נבנה מהתוצר הזה בלבד; זרם הטוקנים
 * נגזר ממנו חזרה דרך adapter הכניסה — שקילות מוכחת בבדיקות round-trip.
 */
function tokenizeDetailed(bodyLines, opts = {}) {
  tokenSeq = 0;
  // מזהה הערת הסיום: ביטוי מוכן (מה-lexer) או בנוי מהקידומת; '' ⇒ מבוטל
  const endnoteRe = opts.endnotePrefixRe instanceof RegExp
    ? opts.endnotePrefixRe
    : compileEndnotePrefix(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX);
  const endnoteNumRe = (() => {
    // ממוספרת: `הערת סיון-1 - טקסט` — נבנית מאותה קידומת (ללא המקף האחרון) + מספר + מקף
    const p = String(opts.endnotePrefix != null ? opts.endnotePrefix : DEFAULT_ENDNOTE_PREFIX).trim() || DEFAULT_ENDNOTE_PREFIX;
    const base = p.replace(/[-–—]\s*$/, '').trim();
    if (!base) return null;
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
    return new RegExp('^' + esc + '\\s*[-–—]?\\s*([0-9]{1,4})\\s*[-–—]\\s*(.+)$');
  })();
  const fnOpen = opts.fnOpen != null ? String(opts.fnOpen) : '[';
  const fnClose = opts.fnClose != null ? String(opts.fnClose) : ']';
  // S4.5: תוחם ריק/רווחים ⇒ הזיהוי מבוטל — scanBrackets מקבל את הערך הגולמי
  // (לא fallback ל-[) כדי שביטול מפורש לא ייהפך בטעות לזיהוי ברירת מחדל.
  const fnEnabled = fnOpen.trim().length > 0 && fnClose.trim().length > 0;
  const tokens = [];
  const lines = [];
  // **9b.4:** שורות גוף שנבלעו לתוך הדבקת הערה חוצת-שורות — הלולאה מדלגת עליהן;
  // השלד שלהן נרשם על ידי השורה הראשית של הקבוצה (primaryBodyLineIndex).
  const gluedInto = new Map(); // bodyLineIndex (נבלע) → bodyLineIndex (ראשית)
  for (let li = 0; li < bodyLines.length; li++) {
    if (gluedInto.has(li)) continue;
    const rawOfLine = bodyLines[li];
    const s1 = normalizeStage(rawOfLine);
    let line = s1.pre;
    if (!line) {
      lines.push({ bodyLineIndex: li, kind: 'blank', stage1: s1 });
      continue;
    }

    // **9b.4 (D-91 — התנהגות המקור היא המפרס): הדבקת הערה חוצת-שורות.**
    // שורה שיש בה פותח-הערה שאין אחריו סוגר כלל בולעת את השורות הבאות
    // הלא-ריקות — חיבור ברווח בודד של השורות המקוצצות, עד שהפותח נסגר
    // (בדיוק כמו לולאת ההדבקה של המורשת). שורה ריקה עוצרת את ההדבקה
    // וההערה נשארת פתוחה — התוכן נשמר בגוף ו-unmatchedOpeners מדווח.
    // מיקומי החיבור נשמרים ב-glueParts לשחזור מלא תו-לתו ב-round-trip.
    // שורה מבנית שנבלעת מסומנת structural — ממצא מפורש, לא היעלמות שקטה.
    let glueParts = null;
    if (fnEnabled && hasUnclosedNote(line, fnOpen, fnClose)) {
      const parts = [{ bodyLineIndex: li, preLength: s1.pre.length, stage1: s1 }];
      let acc = line;
      let j = li + 1;
      while (hasUnclosedNote(acc, fnOpen, fnClose) && j < bodyLines.length) {
        const s1n = normalizeStage(bodyLines[j]);
        if (!s1n.pre) break; // שורה ריקה עוצרת (המורשת: if (!next) break)
        acc = acc + ' ' + s1n.pre;
        parts.push({ bodyLineIndex: j, preLength: s1n.pre.length, stage1: s1n, structural: GLUE_STRUCTURAL_RE.test(s1n.pre) });
        j++;
      }
      if (parts.length > 1) {
        glueParts = parts;
        line = acc;
        for (let k = 1; k < parts.length; k++) gluedInto.set(parts[k].bodyLineIndex, li);
        // רשומות שלד לשורות שנבלעו — נרשמות מיד בזיהוי (לפני סיווג השורה
        // הראשית): השלד אינדקסי, והשחזור מפצל את השורה המאוחדת במיקומי
        // החיבור וממלא גם אותן — לכל סיווג (פסקה/כותרת/הערת-סיום).
        for (let k = 1; k < parts.length; k++) {
          lines.push({
            bodyLineIndex: parts[k].bodyLineIndex, kind: 'glued',
            primaryBodyLineIndex: li, stage1: parts[k].stage1,
            structural: !!parts[k].structural
          });
        }
      }
    }

    let m = line.match(HEADING_RE);
    if (m) {
      // **9b.3:** קבוצות HEADING_RE — 2=רמה, 3=מספר (חדש), 4=ציטוט (חדש), 5=חלק, 6=טקסט.
      // מספר וציטוט נשמרים כשדות סמנטיים בטוקן (הוראות דקדוק — אינן נרנדרות;
      // הציטוט נצרך ע"י הייחוס מהתצוגה ונשמר לפרובננס §6.3).
      const level = m[2] !== undefined ? Number(m[2]) : (m[1] === 'הקדמה' ? 0 : 1);
      const text = m[6] || m[0];
      const num = m[3] !== undefined ? Number(m[3]) : null;
      const citation = m[4] && m[4].trim() ? m[4].trim() : null;
      const titleStart = Math.max(0, line.lastIndexOf(text));
      tokens.push(mkToken('heading', { level, text, ...(num != null ? { num } : {}), ...(citation ? { citation } : {}), raw: line }));
      lines.push({
        bodyLineIndex: li, kind: 'heading', level, stage1: s1,
        ...(num != null ? { num } : {}), ...(citation ? { citation } : {}), // 9b.3: שדות סמנטיים למודל
        ...(glueParts ? { glueParts } : {}), // 9b.4: קבוצת הדבקה (כותרת עם הערה פתוחה)
        spans: {
          match: { start: 0, end: m[0].length },
          title: { start: titleStart, end: line.length },
          ...(num != null || citation ? { instruction: { start: 0, end: titleStart } } : {})
        },
        tokenId: tokens[tokens.length - 1].id
      });
      continue;
    }
    // **S4.5 (תיקון D-40 — ביקורת 03.11):** סדר הבדיקות שהוחזר לסמנטיקה המקורית:
    // 1) ממוספרת (עוגן) 2) תוכן (כל שורה המתחילה בקידומת = הערה!) 3) הוראת
    // כותרת — רק בצורת הרבים «הערות סיום - …» שאינה יכולה להתנגש עם הקידומת.
    if (endnoteNumRe) {
      const mNum = line.match(endnoteNumRe);
      if (mNum) {
        const num = Number(mNum[1]);
        const textVal = mNum[2].trim();
        const textStart = mNum[0].length - mNum[2].length + (mNum[2].length - mNum[2].trimStart().length);
        tokens.push(mkToken('endnote', { num, text: textVal, raw: line }));
        lines.push({
          bodyLineIndex: li, kind: 'endnote-numbered', num, stage1: s1,
          ...(glueParts ? { glueParts } : {}), // 9b.4
          spans: { match: { start: 0, end: mNum[0].length }, num: { start: 0, end: mNum[0].length - textVal.length }, text: { start: textStart, end: line.length } },
          tokenId: tokens[tokens.length - 1].id
        });
        continue;
      }
    }
    if (endnoteRe) {
      const mEnd = line.match(endnoteRe);
      if (mEnd && mEnd[1] && mEnd[1].trim()) {
        const textVal = mEnd[1].trim();
        const textStart = mEnd[0].length - mEnd[1].length + (mEnd[1].length - mEnd[1].trimStart().length);
        tokens.push(mkToken('endnote', { text: textVal, raw: line }));
        lines.push({
          bodyLineIndex: li, kind: 'endnote', stage1: s1,
          ...(glueParts ? { glueParts } : {}), // 9b.4
          spans: { match: { start: 0, end: mEnd[0].length }, text: { start: textStart, end: line.length } },
          tokenId: tokens[tokens.length - 1].id
        });
        continue;
      }
    }
    const mCls = line.match(ENDNOTE_CLASS_RE);
    if (mCls) {
      const title = mCls[1].trim();
      const titleStart = mCls[0].length - mCls[1].length + (mCls[1].length - mCls[1].trimStart().length);
      tokens.push(mkToken('endnote-class', { title, raw: line }));
      lines.push({
        bodyLineIndex: li, kind: 'endnote-class', stage1: s1,
        ...(glueParts ? { glueParts } : {}), // 9b.4
        spans: { match: { start: 0, end: mCls[0].length }, title: { start: titleStart, end: line.length } },
        tokenId: tokens[tokens.length - 1].id
      });
      continue;
    }
    // editorial ##…## — הסרה מלאה (נרשם; לעולם לא נגלה בפלט — Spec §7)
    const editorial = line.match(/##(.+?)##/g);
    const editorialTokenIds = [];
    let stage2 = null;
    if (editorial) {
      for (const e of editorial) tokens.push(mkToken('editorial', { text: e.slice(2, -2), removed: true }));
      editorialTokenIds.push(...tokens.slice(tokens.length - editorial.length).map(t => t.id));
      stage2 = editorialStage(line);
      line = stage2.canonical;
      if (!line) {
        lines.push({ bodyLineIndex: li, kind: 'editorial', stage1: s1, stage2, editorialTokenIds, ...(glueParts ? { glueParts } : {}) });
        continue;
      }
    }

    // חילוץ הערות [..] עם מחסנית; זוגות רצופים → הערות נפרדות; תוחמים מוגדרים (S4.5)
    const segs = scanBrackets([{ text: line, paraIndex: tokens.length }], { open: fnOpen, close: fnClose });
    let cursor = 0;
    const parts = [];
    const notes = [];
    const partRanges = []; // מקביל ל-parts: טווחים בשורה הקנונית (אחרי הסרת editorials)
    // בנייה לפי pairs משמאל לימין (outermost first)
    const outer = segs.pairs.filter(p => p.depth === 1).sort((a, b) => a.open - b.open); // חיצוניים בלבד (depth 1)
    const openCh = fnEnabled ? fnOpen : '[';
    const closeCh = fnEnabled ? fnClose : ']';
    for (const p of outer) {
      const beforeRaw = line.slice(cursor, p.open);
      const before = beforeRaw.trim();
      if (before) {
        const segStart = cursor + (beforeRaw.length - beforeRaw.trimStart().length);
        parts.push({ kind: 'text', value: before });
        partRanges.push({ kind: 'text', start: segStart, end: segStart + before.length });
      }
      // **S4.6 (ביקורת 3):** חיתוך לפי תחילת הסוגר + אורכו בפועל (closeStart/closeLen
      // מהסורק) — נכון גם לתוחמים מרובי-תווים (']]'/END) ולצורה העברית ]ם. בעבר
      // נוסף אורך התוחם המוגדר למיקום התו האחרון — קיצוץ/דילוג תווים בתוחם ארוך.
      const cs = p.closeStart != null ? p.closeStart : p.close;
      const cl = p.closeLen != null ? p.closeLen : closeCh.length;
      const innerStart = p.open + openCh.length;
      const innerEnd = cs;
      const noteText = line.slice(innerStart, cs).trim().replace(/ +/g, ATOMIC_SPACE);
      notes.push(noteText);
      parts.push({ kind: 'note-ref', noteIndex: notes.length - 1 });
      partRanges.push({
        kind: 'note-ref', noteIndex: notes.length - 1,
        openStart: p.open, openEnd: p.open + openCh.length,
        innerStart, innerEnd,
        closeStart: cs, closeEnd: cs + cl,
        start: p.open, end: cs + cl
      });
      cursor = cs + cl;
    }
    const tailRaw = line.slice(cursor);
    const tail = tailRaw.trim();
    if (tail) {
      const segStart = cursor + (tailRaw.length - tailRaw.trimStart().length);
      parts.push({ kind: 'text', value: tail });
      partRanges.push({ kind: 'text', start: segStart, end: segStart + tail.length });
    }

    tokens.push(mkToken('paragraph', { parts, notes, unmatchedClosers: segs.unmatchedClosers, unmatchedOpeners: segs.unmatchedOpeners, raw: line }));
    lines.push({
      bodyLineIndex: li, kind: 'paragraph', stage1: s1, stage2: stage2 || null,
      canonicalAfterEditorial: line, partRanges,
      editorialTokenIds, unmatchedClosers: segs.unmatchedClosers, unmatchedOpeners: segs.unmatchedOpeners,
      delimiters: { open: openCh, close: closeCh, enabled: fnEnabled },
      ...(glueParts ? { glueParts } : {}),
      tokenId: tokens[tokens.length - 1].id
    });
    // **9b.4:** רשומות השלד של השורות שנבלעו נרשמו כבר בזיהוי (לפני הסיווג) —
    // אין כאן כלום; הפרסר ממשיך לשורה הבאה שאינה נבלעה.
  }
  return { tokens, lines, delimiters: { fnOpen, fnClose, fnEnabled } };
}

/** CP1: hash של מולטיסט הטוקנים — עקרון שימור תוכן (BRZ-15).
 * **S4.5 (ביקורת 03.11):** כותרת הוראת ההערות (endnote-class) נכנסת לחשיבות —
 * היא טקסט שמופיע בפלט (כותרת עמודי ההערות); השמטתה אפשרה בעבר לתוכן
 * שסווג בטעות כהוראה להיעלם בלי שה-hash יתריע. */
function contentHash(tokens) {
  // **תיקון "Invalid string length" (מסמכים גדולים):** המימוש הישן מירטיאלז את
  // כל תוכן המסמך למחרוזת JSON אחת (JSON.stringify(flatMap)) — מעל ~512MB
  // תווים V8 זורק RangeError והעימוד כולו קורס. עכשיו: האש אינקרמנטלי
  // איבר-איבר בזהות בתים מלאה (core/canonical-hash) — אותו ערך hash,
  // זיכרון O(טוקן) במקום O(מסמך).
  return sha256OfJsonArrayElements((function* canonRows() {
    for (const t of tokens) {
      if (t.type === 'paragraph') yield ['P', ...t.parts.map(p => p.kind === 'text' ? p.value : `⟦${t.notes[p.noteIndex]}⟧`), String(t.notes.length)];
      else if (t.type === 'heading') yield ['H', String(t.level), t.text];
      else if (t.type === 'endnote') yield ['EN', String(t.num || ''), t.text];
      else if (t.type === 'endnote-class') yield ['ENH', t.title]; // directive — כותרתו תוכן מוצג (S4.5)
    }
  })());
}

module.exports = { tokenize, tokenizeDetailed, contentHash, normalizeText, normalizeStage, editorialStage, isNormalizedChar, hasUnclosedNote, ATOMIC_SPACE };
