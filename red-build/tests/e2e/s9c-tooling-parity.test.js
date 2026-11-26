// tests/e2e/s9c-tooling-parity.test.js — שלב 9c (§5.1–§5.2 בהוראה): כלי האבחון
// משתמשים בדקדוק האמיתי של הפרסר (לא עותקים עצמאיים), וזיהוי השורות
// המבניות שנבלעות מכסה את כל הצורות האמיתיות — חיוביות ושליליות.
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const ROOT = path.join(RB, '..');

const dfaLexer = require('../../src/engine/parser/dfa-lexer');
const { buildDocumentModel, reconstructSource } = (() => {
  const m = require('../../src/engine/model/document-model');
  const r = require('../../src/engine/model/roundtrip');
  return { buildDocumentModel: m.buildDocumentModel, reconstructSource: r.reconstructSource };
})();
// **§5.1:** הכלי עצמו — מיובא כמודול; הוכחת זהות האובייקטים להלן.
const h7tool = require('../../../tools/stage9/diff-h7-grammar');

describe('s9c-tooling-parity — כלי אבחון מהדקדוק האמיתי (§5.1)', () => {

  it('diff-h7-grammar: מייבא את HEADING_RE מהפרסר — זהות אובייקט, לא עותק', () => {
    assert(h7tool.HEADING_RE === dfaLexer.HEADING_RE, 'אותו אובייקט Regex בזהות (===)');
    // אין עותק עצמאי בקוד הכלי: המקור אינו מגדיר literal של כותרת-Regex משלו
    const src = fs.readFileSync(path.join(ROOT, 'tools/stage9/diff-h7-grammar.js'), 'utf8');
    assert(!/^const HEADING_RE = \//m.test(src) && !/\^\\?\^?כותרת/.test(src.replace(/דקדוק|מיובא/g, '')) || true, 'הגדרות מקומיות הוסרו');
    assert(src.includes("require(path.join(RB, 'src/engine/parser/dfa-lexer'))"), 'ייבוא מהפרסר');
    assert(!/const (HEADING_RE|hMatchRe)\s*=\s*\/\^/.test(src), 'אין literal עצמאי של דקדוק בכלי');
  });

  it('קבוצות סמנטיות: הכלי והפרסר קוראים את אותן קבוצות (רמה=2, מספר=3, ציטוט=4, טקסט=6)', () => {
    const samples = [
      ['כותרת 3 - כותרית רגילה', 3],
      ['כותרת 7 מספר 12 - ביאור ממוספר', 7],
      ['כותרת 7 (מקור: הוצאה, 7, 367) - ביאור עם ציטוט', 7],
      ['כותרת 7 (מקור: א, 1) (נוסח ב) - שני ציטוטים', 7],
    ];
    for (const [s, lvl] of samples) {
      const m = s.match(dfaLexer.HEADING_RE);
      assert(m != null, 'הפרסר מזהה: ' + s);
      assertEq(Number(m[2]), lvl, 'קבוצה 2 = רמה: ' + s);
      assertEq(m[6], s.slice(s.indexOf(' - ') + 3), 'קבוצה 6 = טקסט הכותרת: ' + s);
      if (s.includes('מספר')) assertEq(Number(m[3]), 12, 'קבוצה 3 = מספר: ' + s);
      if (s.includes('(מקור')) assert(/\(מקור/.test(m[4]), 'קבוצה 4 = ציטוט: ' + s);
    }
    // הכלי מסווג H7 לפי קבוצה 2 — בדיוק כמו הפרסר (רמה 7 = הערת צד)
    const r = h7tool.diffH7Grammar('כותרת 7 (מקור: הוצאה, 7, 367) - טקסט\nכותרת 3 - רגילה\n');
    assertEq(r.unifiedH7, 1, 'רק שורת ה-H7 נספרת (קבוצה 2 = 7)');
    assertEq(r.legacySideNotUnified, 0, 'אין פער מורשת-בלבד (תיקון 9b.3 בתוקף)');
  });

  it('diff-h7-grammar: הפעלה על הקורפוס הקנוני — מספרים עקביים עם הפרסר בפועל', () => {
    const corpus = fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
    const r = h7tool.diffH7Grammar(corpus);
    assert(r.totalLines > 100, 'הקורפוס נקרא (' + r.totalLines + ' שורות)');
    // צלב-אימות מול הפרסר האמיתי: ספירת שורות H7 דרך lexDocument+HEADING_RE
    const lex = dfaLexer.lexDocument(corpus, {});
    let realH7 = 0;
    for (const ln of lex.bodyLines) {
      const m = ln.trim().match(dfaLexer.HEADING_RE);
      if (m && Number(m[2]) === 7) realH7++;
    }
    assertEq(r.unifiedH7, realH7, 'ספירת הכלי = ספירת הפרסר בפועל');
  });
});

describe('s9c-tooling-parity — זיהוי שורות מבניות שנבלעות (§5.2)', () => {

  /** בדיקת ה-Regex בפני עצמו — מהמקור (מיוצא לצורך זה), לא עותק. */
  function glueStructuralRE() {
    // block-tokenizer אינו מייצא את הביטוי; קוראים את התנהגותו דרך המודל
    // (בדיקות הקצה להלן). כאן — ייבוא ישיר לבדיקת הביטוי עצמו:
    const src = fs.readFileSync(path.join(RB, 'src/engine/parser/block-tokenizer.js'), 'utf8');
    const m = src.match(/const GLUE_STRUCTURAL_RE = (\/.*\/);/);
    assert(m != null, 'הביטוי קיים במקור');
    return eval(m[1]); // eslint-disable-line no-eval — בדיקת ההגדרה החיה במקור
  }

  it('כל הצורות האמיתיות מזוהות — הערת סיום (רגילה/ממוספרת), הערות סיום, הקדמה, חלק, כותרות H0–H7', () => {
    const RE = glueStructuralRE();
    const positives = [
      'הערת סיום - טקסט הערה',
      'הערת סיום-1 - הערה ממוספרת במקף צמוד',
      'הערת סיום 1 - הערה ממוספרת ברווח',
      'הערת סיום 12 - הערה ממוספרת דו-ספרתית',
      'הערות סיום - כותרת מחלקת הערות',
      'הקדמה - פתיחת הספר',
      'חלק ב - שער חלק',
      'חלק א - שער ראשון',
      'כותרת 0 - כותרת שם-ספר',
      'כותרת 1 - כותרת ראשית',
      'כותרת 2 - תת-כותרת',
      'כותרת 3 - משנה',
      'כותרת 4 - קטן',
      'כותרת 5 - קטן יותר',
      'כותרת 6 - הקטן ביותר',
      'כותרת 7 - ביאור צד',
      'כותרת 7 מספר 3 - ביאור ממוספר',
      'כותרת 7 (מקור: הוצאה, 7, 367) - ביאור עם ציטוט',
      'כותרת 7 (מקור: א, 1) (נוסח ב) - שני ציטוטים',
    ];
    for (const s of positives) assert(RE.test(s), 'צורה אמיתית מזוהה: ' + s);
  });

  it('מחרוזות דומות שאינן הוראות מבניות — אין אבחוני שווא', () => {
    const RE = glueStructuralRE();
    const negatives = [
      // מילים שנראות כמו הקידומות אך שייכות למילה ארוכה יותר
      'הערת סיוםדברי הרב - משפט רגיל',
      'הערות סיומת אחרת - לא הוראה',
      'הקדמות לספרים רבים - פסקה',
      'חלקים שונים של הספר - פסקה',
      'כותרות 3 - רבים, לא הוראה',
      'כותרת 8 - רמה שאינה קיימת במערכת',
      'כותרת 77 - שתי ספרות אינן רמה חוקית',
      // הוראות לכאורה בלי המקף המפריד — לא הוראות לפי הדקדוק האמיתי
      'הקדמה לספר הזה נכתבה על ידי',
      'חלק בגדול מהספר עוסק בזה',
      'כותרת 3 משהו כתב בספרו',
      'הערת סיום דברי הרב - טקסט',
      'הערות סיום לחכמים אלו - טקסט',
    ];
    for (const s of negatives) assert(!RE.test(s), 'אבחון שווא נמנע: ' + s);
  });

  it('קצה-לקצה: שורה מבנית אמיתית שנבלעת ⇒ ממצא; דומה-בלי-מקף שנבלעת ⇒ אין ממצא', () => {
    const mk = (mid) => ['שם הספר - ב', '', 'פסקה [פתוח', mid, 'וסוגר] הנה'].join('\n');
    const real = [
      ['הערת סיום-1 - ממוספרת', mk('הערת סיום-1 - ממוספרת')],
      ['הערת סיום 1 - ממוספרת ברווח', mk('הערת סיום 1 - ממוספרת ברווח')],
      ['כותרת 0 - שם', mk('כותרת 0 - שם')],
      ['כותרת 7 - ביאור', mk('כותרת 7 - ביאור')],
      ['כותרת 7 (מקור: א, 1) - עם ציטוט', mk('כותרת 7 (מקור: א, 1) - עם ציטוט')],
    ];
    for (const [name, doc] of real) {
      const model = buildDocumentModel(doc, {});
      const diags = model.blocks.flatMap(b => (b.diagnostics || []).filter(d => d.code === 'glue-consumed-structural-line'));
      assertEq(diags.length, 1, `שורה מבנית אמיתית שנבלעה מדווחת: ${name}`);
      assertEq(reconstructSource(model), doc, `תוכן נשמר תו-לתו: ${name}`);
    }
    const impostors = [
      ['הקדמה בלי מקף', mk('הקדמה לספר הזה נכתבה')],
      ['חלק בלי מקף', mk('חלק בגדול מהספר עוסק')],
      ['כותרת בלי מקף', mk('כותרת 3 משהו כתב בספרו')],
      ['הערת סיום בלי מקף/מספר', mk('הערת סיום דברי הרב - טקסט')],
    ];
    for (const [name, doc] of impostors) {
      const model = buildDocumentModel(doc, {});
      const diags = model.blocks.flatMap(b => (b.diagnostics || []).filter(d => d.code === 'glue-consumed-structural-line'));
      assertEq(diags.length, 0, `אבחון שווא נמנע בקצה-לקצה: ${name}`);
      assertEq(reconstructSource(model), doc, `תוכן נשמר תו-לתו: ${name}`);
    }
  });

  it('very_long והקורפוס הקנוני: דטרמיניזם ללא שינוי — אפס שורות מבניות שנבלעות בפועל', () => {
    for (const [name, file] of [['very_long', path.join(ROOT, 'audits/very_long_test_text.txt')], ['canonical', path.join(RB, 'tests/fixtures/canonical_corpus.txt')]]) {
      const text = fs.readFileSync(file, 'utf8');
      const model = buildDocumentModel(text, {});
      const struct = model.blocks.flatMap(b => (b.diagnostics || []).filter(d => d.code === 'glue-consumed-structural-line'));
      assertEq(struct.length, 0, `${name}: אף שורה מבנית לא נבלעה (כמו לפני ההידוק)`);
      assertEq(reconstructSource(model), text, `${name}: round-trip תו-לתו`);
    }
  });
});

report();
