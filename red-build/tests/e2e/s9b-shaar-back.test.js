// tests/e2e/s9b-shaar-back.test.js — שלב 9b פרוסה 9b.5: ארבעת מקטעי השער האחורי
// (D-107) + חיבור שדות הפאנל (inp-book-back-*) לנתיב המאוחד (F-9a-8) + ערכי
// מטא בתיבות השער (F-9a-1) — ללא המצאת ערכים וללא שכפול מטא לגוף (§6.1–§6.2).
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const ROOT = path.join(RB, '..');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { registerFont } = require('../../src/engine/typography/measure-api');
const { buildShaarBlocks } = require('../../src/engine/output/shaar-content');

function registerAllFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['Alpha', 'Alpha-Regular.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['AlphaLight', 'AlphaLight-Regular.ttf'],
    ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['Hadassah Friedlaender', 'Hadassah-Friedlaender.ttf']
  ];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) { const r = registerFont(fam, fs.readFileSync(fp)); if (!r.ok) throw new Error(`registerFont(${fam}): ${r.error}`); }
  }
}

const DOC_WITH_BACK_META = [
  'שם הספר - ספר הבדיקה האחורית',
  'שם המחבר - בודק השערים',
  'שמירת זכויות - כל הזכויות שמורות',
  'פרטי הוצאה לאור - הוצאת הבדיקה בע"מ',
  'פרטי קשר - test@example.com',
  'פרטים נוספים - מהדורה ראשונה',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקת גוף ראשונה של הבדיקה.',
].join('\n');

const DOC_WITHOUT_BACK_META = [
  'שם הספר - ספר ללא מטא אחורי',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקת גוף.',
].join('\n');

/** טקסט הבלוקים של עמוד השער האחורי מהתוצאה (shaarLayout — המודל הקנוני). */
function backBlocks(r) {
  const back = r.pages.find(p => p.type === 'shaar-back');
  if (!back) return null;
  return (back.shaarLayout && back.shaarLayout.blocks) || [];
}
function backText(r) {
  return backBlocks(r).map(b => b.text || '').join(' ');
}

describe('s9b-shaar-back — ארבעת מקטעי השער האחורי (D-107) + חיבור הגדרות (F-9a-8)', () => {
  registerAllFonts();

  it('מטא המסמך: ארבעת המקטעים + הכותרת מגיעים למודל (shaarLayout) בלי הגדרות', () => {
    const r = typeset(DOC_WITH_BACK_META, getDefaultSettings(), {});
    assert(!r.legacyProfile, 'המנוע המאוחד');
    const blocks = backBlocks(r);
    assert(blocks != null, 'עמוד shaar-back קיים עם shaarLayout');
    const text = backText(r);
    assert(text.includes('כל הזכויות שמורות'), 'כותרת הזכויות (כמו במקור)');
    assert(text.includes('כל הזכויות שמורות למחבר') === false || text.includes('כל הזכויות שמורות'), 'הכותרת הקבועה של המקור');
    assert(text.includes('כל הזכויות שמורות') && blocks.some(b => b.cls === 'back-shaar-copyright-header'), 'כותרת זכויות במחלקה הייעודית');
    assert(text.includes('הוצאת הבדיקה בע"מ'), 'פרטי הוצאה לאור מהמטא');
    assert(text.includes('test@example.com'), 'פרטי קשר מהמטא');
    assert(text.includes('מהדורה ראשונה'), 'פרטים נוספים מהמטא');
    // אין כותרת-ספר/מחבר/שנה בשער האחורי — כמו במקור שהופורט
    assert(!blocks.some(b => String(b.cls).includes('book-title-main')), 'אין כותרת-ספר בשער האחורי (כמקור)');
    assert(!blocks.some(b => String(b.cls).includes('author-block')), 'אין מחבר בשער האחורי (כמקור)');
    assert(!blocks.some(b => String(b.cls).includes('publication-footer')), 'אין שנה בשער האחורי (כמקור)');
  });

  it('הגדרות גוברות על המטא (עקיפה מפורשת) — ומשפיעות בפועל (fx)', () => {
    const base = typeset(DOC_WITH_BACK_META, getDefaultSettings(), {});
    const s = { ...getDefaultSettings(), 'imud-book-back-publishing': 'הוצאה חלופית בע"מ' };
    const over = typeset(DOC_WITH_BACK_META, s, {});
    assert(backText(over).includes('הוצאה חלופית בע"מ'), 'הערך מההגדרה גובר');
    assert(!backText(over).includes('הוצאת הבדיקה בע"מ'), 'ערך המטא לא מופיע כשההגדרה דלוקה');
    assert(backText(base) !== backText(over), 'שינוי ההגדרה משנה פלט (fx:imud-book-back-publishing)');
  });

  it('בלי ערך — אין מקטע ואין המצאת ערכים (§6.2)', () => {
    const r = typeset(DOC_WITHOUT_BACK_META, getDefaultSettings(), {});
    const blocks = backBlocks(r);
    assert(blocks != null && blocks.length === 0, `השער האחורי ריק מטקסט כשאין ערכים (קיבל ${blocks && blocks.length} בלוקים)`);
    assert(!backText(r).includes('כל הזכויות שמורות למחבר'), 'אין ערך ברירת-מחדל מומצא');
  });

  it('הכותרת «כל הזכויות שמורות» מופיעה רק כשזכויות היוצרים קיימות', () => {
    const s = { ...getDefaultSettings(), 'imud-book-back-publishing': 'רק הוצאה' };
    const r = typeset(DOC_WITHOUT_BACK_META, s, {});
    const text = backText(r);
    assert(text.includes('רק הוצאה'), 'המקטע המוגדר מופיע');
    assert(!text.includes('כל הזכויות שמורות'), 'הכותרת אינה מופיעה בלי זכויות יוצרים (כמקור)');
  });

  it('הגדרות שער אחורי: imud-book-back-* מגיעות לפלט ישירות', () => {
    const raw = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
    const s = { ...getDefaultSettings(),
      'imud-book-back-copyright': raw['inp-book-back-copyright'],
      'imud-book-back-publishing': raw['inp-book-back-publishing'],
      'imud-book-back-contact': raw['inp-book-back-contact'],
      'imud-book-back-extra': raw['inp-book-back-extra']
    };
    const r = typeset(DOC_WITHOUT_BACK_META, s, {});
    const text = backText(r);
    assert(text.includes(String(raw['inp-book-back-publishing'])), 'הוצאה מגיעה לשער האחורי');
    assert(text.includes(String(raw['inp-book-back-contact'])), 'קשר מגיע');
    assert(text.includes(String(raw['inp-book-back-extra'])), 'נוספים מגיעים');
  });

  it('ערכים רב-שורתיים — שורה לכל שורת מקור; גדלים לפי המקור (13.5/10/11/10/9.5)', () => {
    const s = {
      ...getDefaultSettings(),
      'imud-book-back-copyright': 'שורה א\nשורה ב',
      'imud-book-back-extra': 'נוסף',
    };
    const r = typeset(DOC_WITHOUT_BACK_META, s, {});
    const blocks = backBlocks(r);
    const header = blocks.find(b => b.cls === 'back-shaar-copyright-header');
    assertEq(header && header.sizePt, 13.5, 'כותרת הזכויות 13.5pt (כמקור)');
    const copy = blocks.filter(b => b.cls === 'back-shaar-text-line');
    assertEq(copy.length, 3, 'שתי שורות זכויות + שורת נוספים');
    assertEq(copy[0].sizePt, 10, 'זכויות 10pt');
    assertEq(copy[2].sizePt, 9.5, 'נוספים 9.5pt');
    const pub = typeset(DOC_WITHOUT_BACK_META, { ...getDefaultSettings(), 'imud-book-back-publishing': 'הוצאה' }, {});
    assertEq(backBlocks(pub).find(b => b.cls === 'back-shaar-text-line').sizePt, 11, 'הוצאה 11pt');
  });

  it('very_long: ארבעת המקטעים מהמטא מגיעים למודל — ואינם נטפלים לגוף', () => {
    const vl = fs.readFileSync(path.join(ROOT, 'audits/very_long_test_text.txt'), 'utf8');
    const r = typeset(vl, getDefaultSettings(), {});
    const text = backText(r);
    assert(text.includes('כל הזכויות הפקר'), 'זכויות המטא');
    assert(text.includes('הוצאת זוכמיר בע"מ'), 'הוצאת המטא');
    assert(text.includes('052-7666666'), 'קשר המטא');
    assert(text.includes('אין לסמוך על האמור להלכה'), 'נוספים המטא');
    // אין שכפול מטא לגוף: המילים של ערכי המטא האחורי אינן בעמודות הגוף
    const bodyWords = [];
    for (const pg of r.pages) {
      if (pg.type === 'shaar-back') continue;
      for (const col of (pg.columns || [])) for (const ln of col) {
        for (const w of (ln.words || [])) bodyWords.push(typeof w === 'object' ? (w.word != null ? w.word : w.t) : w);
      }
    }
    const bodyText = bodyWords.join(' ');
    assert(!bodyText.includes('זוכמיר'), 'ערך ההוצאה אינו מופיע כגוף');
    assert(!bodyText.includes('052-7666666'), 'ערך הקשר אינו מופיע כגוף');
    assert(!bodyText.includes('אין לסמוך על האמור להלכה'), 'הערך הנוסף אינו מופיע כגוף');
  });

  it('buildShaarBlocks: החוזה הישיר — מקור יחיד לשלושת המקרינים', () => {
    const page = { type: 'shaar-back' };
    const meta = { 'שמירת זכויות': 'זכויות מטא', 'פרטי קשר': 'קשר מטא' };
    const model = buildShaarBlocks(page, { 'imud-book-back-extra': 'נוסף הגדרות' }, meta);
    assertEq(model.blocks.map(b => b.text).join(' | '), 'כל הזכויות שמורות | זכויות מטא | קשר מטא | נוסף הגדרות', 'מיזוג הגדרות>מטא לפי מקטע');
    // shaar-back-text ההיסטורי עדיין עוקף זכויות (תאימות לאחור)
    const model2 = buildShaarBlocks(page, { 'shaar-back-text': 'טקסט היסטורי' }, meta);
    assert(model2.blocks.some(b => b.text === 'טקסט היסטורי'), 'shaar-back-text עוקף את המטא');
  });
});

report();
