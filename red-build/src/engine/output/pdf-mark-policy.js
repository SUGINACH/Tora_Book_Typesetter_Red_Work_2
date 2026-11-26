// src/engine/output/pdf-mark-policy.js — **S74 (פורנזי 25.11 §6-§7): מדיניות הצבת ניקוד משולב ב-PDF**
'use strict';

/**
 * מקור הסמכות למדידת ניקוד משולב הוא המנוע (measure-api, RC-M4): בפרופיל המאוחד
 * ('_marks-advance'='combined' — pipeline.js קובע זאת) סימן משולב (Mn) נמדד
 * ב-advance 0 — הדפדפן מציב אותו ב-GPOS mark-to-base וה-PageModel ממוקם-מוחלט
 * על בסיס מדידה זו. ה-PDF חייב להקרין את **אותה החלטה** ולא לבנות את המילה מחדש
 * ב-hmtx גולמי (הפגם המתועד: שְׁמַע ב-PDF 44.57pt מול המודל 28.79pt — הפרש
 * 15.77pt = בדיוק שלושת הניקודים; שער s74 נועל זאת).
 *
 * אופן ההקרנה: הכותב מצייר מילה בסדר ויזואלי בפעולת Tj אחת, ומיקום העט מתקדם
 * לפי מערך הרוחבים /W (שמגיע מ-widthsUnits של תת-הגופן). איפוס רוחב הניקוד ב-/W
 * ⇒ העט אינו מתקדם על ניקוד ⇒ רוחב המילה ב-PDF = רוחב המילה שהמודל תכנן.
 * תת-הגופן עצמו (hmtx מוטמע) אינו משתנה — /W גובר עליו בציור CID; בדיקת
 * ה-tofu של buildSubset משווה hmtx מול hmtx ואינה מושפעת.
 *
 * **סנכרון רשימת הטווחים:** זהו עותק ביט-לביט של COMBINING_MARK_RE מ-
 * measure-api (RC-M4) — שינוי באחד מהם הוא שינוי חוזה שחייב להיכנס באותו
 * קומיט; סוויטת s74 נועלת את ההתאמה על ניקודי שְׁמַע (שווא/פתח/שין-סין).
 * מודול זה טהור לחלוטין (אפס תלות) ובטוח-דפדפן.
 */

const COMBINING_MARK_RE = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u0816-\u082D\u0859-\u085B\u08E3-\u0903]/;

/** האם התו סימן משולב (Mn) — אותה סמכות סיווג של המדידה (measure-api). */
function isCombiningMark(ch) {
  return COMBINING_MARK_RE.test(ch);
}

/**
 * החלת מדיניות combined על גופן-כותב (אובייקט החוזה של export-api לכותב:
 * widthsUnits:Map(gid→units), charToGidEntries:()=>[ch,gid][], unitsPerEm).
 *
 * מאפס ב-widthsUnits את הרוחב של כל גליף שמקורו בסימן משולב — לפי מיפוי
 * התו→גליף של **אותו גופן-כותב** (אותה זהות גליפים שהכותב מצייר בפועל,
 * כולל המספור החדש של תת-הגופן). טהור: האובייקט המקורי אינו משתנה.
 *
 * @param {object} fontForWriter — אובייקט גופן-כותב (או null)
 * @returns {object} אותו אובייקט כשאין סימנים או כשהחוזה חסר (אפס תקורה);
 *                   עותק עם widthsUnits מאופס כשיש סימנים.
 */
function applyCombinedMarkPolicy(fontForWriter) {
  const f = fontForWriter;
  if (!f || typeof f.charToGidEntries !== 'function' || !f.widthsUnits) return f;
  const markGids = new Set();
  for (const entry of f.charToGidEntries()) {
    const ch = entry && entry[0];
    const gid = entry && entry[1];
    if (gid != null && COMBINING_MARK_RE.test(ch)) markGids.add(gid);
  }
  if (!markGids.size) return f;
  const widthsUnits = new Map(f.widthsUnits);
  for (const g of markGids) {
    if (widthsUnits.has(g)) widthsUnits.set(g, 0);
  }
  return { ...f, widthsUnits };
}

module.exports = { COMBINING_MARK_RE, isCombiningMark, applyCombinedMarkPolicy };
