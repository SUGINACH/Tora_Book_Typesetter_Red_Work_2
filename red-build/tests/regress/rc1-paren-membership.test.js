// tests/regress/rc1-paren-membership.test.js — RC-1 (Iteration-004): כלל חברות
// סוגריים ב-wordOverlayFactory — anyParen של המורשת, כולל סוגריים בלתי-מאוזנים.
//
// **השורש (אומת על PDF אמיתי, i004):** שלושה פגמים בכלל החברות:
//   1. (strictly inside) החריג את מילת הפתיחה — 1,782 גליפי סוגריים ב-12pt
//      במקום 10pt בייצוא (הייחוס: 2,408/2,460 ב-10pt).
//   2. (start-in-span) החריג מילים שנוגעות בסוגר באמצען — 'זה(דשימוש'
//      (OLD p317: המילה כולה ב-10pt) — עוד 13 גליפים.
//   3. סוגר פותח שלא נסגר בפסקה לא יצר span — '(ובעיקר סוגיא…' (OLD p153)
//      נצבע ב-10pt עד סוף הפסקה אצל המורשת (עומק>0), ובמאוחד נשאר 12pt.
// הצפי הקנוני: ספירת עומק תו-אחר-תו כמו legacy-imud-flow (S4.13) —
// wordParen=anyParen: מילה מסוגרת אם **איזהו** מתוויה בעומק>0, ועומק
// שנפתח ולא נסגר נשאר עד סוף הפסקה.
//
// **הבדיקה:** מילים סינתטיות מכסות את כל משפחות המיקום מול הסוגריים, והקביעה
// מתבצעת על wordOverlayFactory עצמו — אותו מקור שמזין את המדידה (advanceFactor)
// ואת הרינדור (parenSpans) כאחד.
'use strict';
const path = require('path');
const { describe, it, assertEq, report } = require('../harness');
const { wordOverlayFactory } = require('../../src/engine/line/pipeline-bridge');

const SETTINGS = { 'paren-style-scale': 10 / 12 };

function makeBlock(flat) {
  return {
    id: 'b1', kind: 'paragraph',
    items: [{
      id: 'i1', kind: 'text',
      payload: { runs: [{ text: flat, sourceStart: 0 }] },
      sourceRange: { start: 0, end: flat.length }
    }]
  };
}

/** מודל ציפיות עצמאי — עומק תווי-תו כמו המקור (S4.13 + RC-1b/RC-1c i004):
 *  מילה מסוגרת אם איזהו מתוויה בעומק>0; עומק שנפתח ולא נסגר נשאר עד סוף הפסקה. */
function legacyExpectation(flat, wStart, wEnd) {
  let depth = 0;
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '(') depth++;
    if (i >= wStart && i < wEnd && depth > 0) return true; // anyParen
    if (flat[i] === ')' && depth > 0) depth--;
  }
  return false;
}

function classificationsOf(flat) {
  const ov = wordOverlayFactory(makeBlock(flat), SETTINGS, null);
  const out = [];
  const re = /\S+/g; let m;
  while ((m = re.exec(flat))) {
    const cls = ov.wordStyleOf ? ov.wordStyleOf(m.index, m.index + m[0].length) : null;
    out.push({ w: m[0], styled: !!(cls && cls.paren), legacy: legacyExpectation(flat, m.index, m.index + m[0].length) });
  }
  return out;
}

function assertMatchesLegacy(flat) {
  const cls = classificationsOf(flat);
  for (const c of cls) {
    assertEq(c.styled, c.legacy, `word "${c.w}" in "${flat}" (new=${c.styled} legacy=${c.legacy})`);
  }
  return cls;
}

describe('RC-1 paren membership (i004)', () => {
  it('word that BEGINS with the opening paren is styled (RC-1a)', () => {
    const cls = classificationsOf('דיני העושה (במשמעותו כנפרד) דמצוות שבת');
    const opening = cls.find(c => c.w === '(במשמעותו');
    assertEq(opening.styled, true, 'opening-paren word must be paren-styled');
    const closing = cls.find(c => c.w === 'כנפרד)');
    assertEq(closing.styled, true, 'closing-paren word must be paren-styled');
    const before = cls.find(c => c.w === 'העושה');
    assertEq(before.styled, false, 'word before the phrase must not be styled');
    const after = cls.find(c => c.w === 'דמצוות');
    assertEq(after.styled, false, 'word after the phrase must not be styled');
  });

  it('word CONTAINING a mid-word opening paren is fully styled (RC-1c, OLD p317)', () => {
    const cls = classificationsOf('בגדר זה(דשימוש מבוי אינו שימוש רשות הרבים), אלא');
    const touching = cls.find(c => c.w === 'זה(דשימוש');
    assertEq(touching.styled, true, 'word that touches the paren mid-word must be styled whole');
    const before = cls.find(c => c.w === 'בגדר');
    assertEq(before.styled, false, 'word before must not be styled');
    const inner = cls.find(c => c.w === 'מבוי');
    assertEq(inner.styled, true);
    const closing = cls.find(c => c.w === 'הרבים),');
    assertEq(closing.styled, true, 'trailing punctuation after close is part of the word (OLD p44)');
  });

  it('single-word phrase is fully styled', () => {
    const cls = classificationsOf('לגבי עניין (מסוים) בלבד');
    assertEq(cls.find(c => c.w === '(מסוים)').styled, true);
    assertEq(cls.find(c => c.w === 'לגבי').styled, false);
    assertEq(cls.find(c => c.w === 'בלבד').styled, false);
  });

  it('word that is only ")" (space-detached close) is styled', () => {
    const cls = classificationsOf('טקסט ( פנימי ) המשך');
    assertEq(cls.find(c => c.w === '(').styled, true, 'detached "(" is styled');
    assertEq(cls.find(c => c.w === ')').styled, true, 'detached ")" is styled');
    assertEq(cls.find(c => c.w === 'פנימי').styled, true);
    assertEq(cls.find(c => c.w === 'המשך').styled, false);
  });

  it('nested parens match char-level depth', () => {
    assertMatchesLegacy('חיצוני (א ב (פנימי) ג) אחרי');
  });

  it('UNCLOSED opening paren styles to end of paragraph (RC-1b, OLD p129/p153)', () => {
    // מקור אמיתי @259011: פסקה עם '(' אחד ואפס ')' — המורשת ממשיכה ב-10pt עד סוף הפסקה
    const cls = classificationsOf('וזה הגדר שייך באופנים שונים (וכמו שחילקו במקום אחר בין דברים');
    assertEq(cls.find(c => c.w === 'שונים').styled, false, 'before the open');
    assertEq(cls.find(c => c.w === '(וכמו').styled, true, 'opening word');
    assertEq(cls.find(c => c.w === 'שחילקו').styled, true, 'inside');
    const last = cls[cls.length - 1];
    assertEq(last.styled, true, 'last word of paragraph still styled (depth never closed)');
    // מקור אמיתי @296536: פסקה שמתחילה ב-'(' שלא נסגר — הכל מסוגר עד הסוף
    const cls2 = classificationsOf('(ועפ"ז יש לבאר דברי רש"י דבריש הזורק משמע');
    for (const c of cls2) assertEq(c.styled, true, `whole paragraph styled: ${c.w}`);
  });

  it('paragraph with inner balanced pair inside unclosed outer — both styled (OLD p153)', () => {
    // מקור אמיתי @324842: '(ובעיקר … מד׳ (וכמו … שנקלט), ואמאי מחייב ר"י אהעברה.'
    assertMatchesLegacy('(ובעיקר סוגיא קשה, והוי פחות מד\' (וכמו סברת תוס\' ור"ע, דחשיב), ואמאי מחייב.');
  });

  it('trailing punctuation after close (וכו\').) stays in the styled word', () => {
    // מילת הסגירה כולל את הפיסוק העוקב — המורשת מציירת את המילה כולה ב-10pt (OLD p44)
    const cls = classificationsOf('כתב וכן הוא (וכו\'), ואז המשיך');
    assertEq(cls.find(c => c.w === '(וכו\'),').styled, true);
    assertEq(cls.find(c => c.w === 'ואז').styled, false);
  });

  it('adjacent phrases (a) (b) — both styled, no bleed', () => {
    assertMatchesLegacy('ראשון (א) שני (ב) שלישי');
  });

  it('real source paragraphs match char-level depth exactly', () => {
    assertMatchesLegacy('בחלק העושה מצאנו שלושה גדרים (ול"ד לחילוק הנ"ל במעשה סתם, א. מעשה. ב. מלאכה. ג. מלאכת מחשבת) וזה הביאור.');
    assertMatchesLegacy('שכל אגידת הימים מאוחדת לגבי עניין מסויים (בגדר שהוא מכח או כמו כח המקובל) ונמשך.');
    assertMatchesLegacy('אין להחשיב עשייה כעבודת זמן (עבודה משמע נטילת כוח מדבר לצורך דבר) בלבד.');
    assertMatchesLegacy('ובלבד שלא יוציא מד\' אמות(יו), ודקדק רש"י לכתוב');
  });

  it('stray close paren (no opener) — no styling, no crash', () => {
    const cls = classificationsOf('פתוח ) בלי פותח נשאר גוף');
    for (const c of cls) assertEq(c.styled, false, `stray close must not style: ${c.w}`);
  });

  it('paren-style-scale=1 disables overlays entirely', () => {
    const ov = wordOverlayFactory(makeBlock('טקסט (פנים) המשך'), { 'paren-style-scale': 1 }, null);
    assertEq(ov.wordStyleOf, null, 'scale 1 ⇒ no overlays');
  });
});

report();
