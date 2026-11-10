// tests/e2e/s65-split-book-title.test.js — S65: סגירת SRS-12-2 (split-book-title)
// דרישת SRS §12.2 (Clarification 5 Compliance):
//   1. כשהמתג split-book-title פעיל:
//      * החצי הראשון של שם הספר מוצג בעמוד הימני (Recto).
//      * החצי השני מוצג בעמוד השמאלי (Verso).
//   2. הפעלת הפיצול דורסת אפשרויות כותרת דינמיות סותרות — בפרט ירושת
//      verso-same-as-recto אינה מבטלת את הפיצול, ומקור book-name-rest מפוצל
//      לפי החצי הפיזי ולא לפי המקף.
// תוספת שקיפות: מקור ניתן לבחירה ישירה book-name-split (ללא המתג הגלובלי).
// נייטרליות: ברירת המחדל (false) אינה משנה שום כותרת — hash הפריסה זהה.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, findKey } = require('../../src/engine/core/settings-registry');
const {
  buildHeader, resolveSlot, splitBookTitleHalves,
} = require('../../src/engine/decoration/headers-builder');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

const ctxPage = (isRecto, extra = {}) => ({
  index: isRecto ? 0 : 1,
  isRecto,
  type: 'regular',
  template: { hasRunningHead: true },
  firstWord: 'ראשונה', lastWord: 'אחרונה',
  h1: 'חלק ראשון - החלק הגדול', h2: 'סימן טוב',
  pageNumberDisplay: 'כ״ב',
  opensWithHeadingLevel: null,
  chapterOpening: false,
  ...extra,
});

// =====================================================================
describe('S65-1 — splitBookTitleHalves: פיצול לפי אמצע מילים (נוסחת המורשת)', () => {
  it('מספר זוגי של מילים: חלוקה שווה בדיוק', () => {
    const h = splitBookTitleHalves('שולחן ערוך אורח חיים');
    assertEq(h.first, 'שולחן ערוך', 'first half');
    assertEq(h.second, 'אורח חיים', 'second half');
  });
  it('מספר אי-זוגי: החצי הראשון ארוך במילה אחת (ceil — כמו legacy)', () => {
    const h = splitBookTitleHalves('שולחן ערוך אורח');
    assertEq(h.first, 'שולחן ערוך', 'ceil mid → first longer');
    assertEq(h.second, 'אורח', 'second shorter');
  });
  it('מילה אחת / ריק / null: אין פיצול מלאכותי', () => {
    assertEq(splitBookTitleHalves('תניא').first, 'תניא');
    assertEq(splitBookTitleHalves('תניא').second, '');
    assertEq(splitBookTitleHalves('').first, '');
    assertEq(splitBookTitleHalves(null).second, '');
  });
  it('רווחים מרובים נקלטים — trim + split(/\\s+/)', () => {
    const h = splitBookTitleHalves('  א ב   ג   ד  ');
    assertEq(h.first, 'א ב');
    assertEq(h.second, 'ג ד');
  });
});

// =====================================================================
describe('S65-2 — resolveSlot(book-name-split): לפי הצד הפיזי בלבד', () => {
  const ctx = { bookName: 'שולחן ערוך אורח חיים' };
  it('recto ⇒ החצי הראשון; verso ⇒ השני', () => {
    assertEq(resolveSlot('book-name-split', { ...ctx, side: 'recto' }, {}), 'שולחן ערוך');
    assertEq(resolveSlot('book-name-split', { ...ctx, side: 'verso' }, {}), 'אורח חיים');
  });
  it('בלי side (ברירת מחדל) — מתנהג כ-recto (החצי הראשון)', () => {
    assertEq(resolveSlot('book-name-split', ctx, {}), 'שולחן ערוך');
  });
});

// =====================================================================
describe('S65-3 — buildHeader עם split-book-title=true (SRS §12.2 סעיף 1)', () => {
  const BOOK = 'ספר התניא ליקוטי אמרים';
  const s = {
    ...getDefaultSettings(),
    'split-book-title': true,
    // שני הסלוטים הצדדיים = שם הספר (ברירת המחדל): ימין-recto, שמאל-verso
  };
  it('Recto מציג את החצי הראשון של שם הספר', () => {
    const h = buildHeader(ctxPage(true), s, { bookName: BOOK });
    assertEq(h.slots.right.text, 'ספר התניא', 'recto right = first half');
    assertEq(h.slots.right.source, 'book-name-split', 'source overridden');
    assert(h.splitTitle === true, 'splitTitle flag set');
  });
  it('Verso מציג את החצי השני של שם הספר', () => {
    const h = buildHeader(ctxPage(false), s, { bookName: BOOK });
    assertEq(h.slots.left.text, 'ליקוטי אמרים', 'verso left = second half');
    assertEq(h.slots.left.source, 'book-name-split', 'source overridden');
  });
  it('book-name-rest מוסט גם הוא לפיצול הפיזי (דריסת אפשות סותרות)', () => {
    const sRest = { ...s, 'header-verso-left-source': 'book-name-rest' };
    const h = buildHeader(ctxPage(false), sRest, { bookName: BOOK });
    assertEq(h.slots.left.text, 'ליקוטי אמרים', 'verso left = second half (not dash-rest)');
    assertEq(h.slots.left.source, 'book-name-split', 'rest→split override');
  });
  it('דריסת ירושה: verso-same-as-recto=true אינה מבטלת את הפיצול (סעיף 2 של SRS)', () => {
    const sSame = {
      ...s,
      'header-verso-same-as-recto': true,
      'header-recto-right-source': 'book-name',
      'header-verso-right-source': 'book-name',
    };
    const hv = buildHeader(ctxPage(false), sSame, { bookName: BOOK });
    // הסלוט הימני בעמוד verso שואל book-name מה-recto (ירושה); בפיצול הוא נדרס
    // לפי הצד הפיזי (verso) ⇒ החצי השני. זו בדיוק דריסת האפשות הסותרות (SRS §12.2.2).
    assertEq(hv.slots.right.text, 'ליקוטי אמרים', 'physical-side override beats inheritance');
  });
  it('מקורות דינמיים שאינם שם-הספר אינם נדרסים (h2/מילים/גיליון)', () => {
    const sDyn = {
      ...s,
      'header-recto-center-source': 'h2',
      'header-recto-left-source': 'page-num',
    };
    const h = buildHeader(ctxPage(true), sDyn, { bookName: BOOK, h2: 'סימן טוב' });
    assertEq(h.slots.center.text, 'סימן טוב', 'h2 untouched');
    assertEq(h.slots.left.text, 'כ״ב', 'page-num untouched');
    assertEq(h.slots.center.source, 'h2', 'h2 source kept');
  });
  it('none נשאר none — הפיצול אינו מזריק טקסט לסלוטים ריקים', () => {
    const sNone = { ...s, 'header-recto-center-source': 'none' };
    const h = buildHeader(ctxPage(true), sNone, { bookName: BOOK });
    assertEq(h.slots.center.text, '', 'none stays empty');
  });
});

// =====================================================================
describe('S65-4 — מקור ישיר book-name-split ללא המתג הגלובלי', () => {
  it('ניתן לבחור פיצול לסלוט בודד גם כשהמתג כבוי', () => {
    const s = {
      ...getDefaultSettings(),
      'split-book-title': false,
      'header-verso-center-source': 'book-name-split',
      'header-recto-center-source': 'book-name-split',
    };
    const hr = buildHeader(ctxPage(true), s, { bookName: 'שולחן ערוך אורח חיים' });
    const hv = buildHeader(ctxPage(false), s, { bookName: 'שולחן ערוך אורח חיים' });
    assertEq(hr.slots.center.text, 'שולחן ערוך', 'recto center = first half (explicit)');
    assertEq(hv.slots.center.text, 'אורח חיים', 'verso center = second half (explicit)');
    assert(hr.splitTitle === false, 'global flag stays off');
  });
});

// =====================================================================
describe('S65-5 — רישום ההגדרה וה-UI (settings-registry + bindings)', () => {
  it('split-book-title רשום: bool, ברירת מחדל false, צרכן headers-builder', () => {
    const k = findKey('split-book-title');
    assert(k, 'key exists');
    assertEq(k.type, 'bool');
    assertEq(k.default, false, 'default off — neutrality');
    assert(k.consumers.includes('decoration/headers-builder'), 'consumer');
    assertEq(k.control, 'chk-split-title', 'control id');
  });
  it('book-name-split נמצא ב-enum של כל 9 סלוטי המקור', () => {
    for (const side of ['recto', 'verso', 'opening']) {
      for (const pos of ['right', 'center', 'left']) {
        const k = findKey(`header-${side}-${pos}-source`);
        assert(k.enum.includes('book-name-split'), `header-${side}-${pos}-source enum`);
      }
    }
  });
  it('getDefaultSettings כולל split-book-title=false — ברירת מחדל ניטרלית', () => {
    assertEq(getDefaultSettings()['split-book-title'], false);
  });
  it('bindings.generated כולל את הפקד והתווית העברית', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', 'bindings.generated.js'), 'utf8');
    assert(src.includes('"split-book-title"'), 'binding id present');
    assert(src.includes('פיצול שם הספר'), 'Hebrew label present');
  });
});

// =====================================================================
describe('S65-6 — נייטרליות: המתג כבוי ⇒ אפס שינוי בפריסה ובכותרות', () => {
  it('ברירת המחדל מפיקה כותרות זהות למצב שלפני התוספת (אין דריסה)', () => {
    const d = getDefaultSettings();
    const hr = buildHeader(ctxPage(true), d, { bookName: 'ספר התניא - ליקוטי אמרים' });
    assertEq(hr.slots.right.source, 'book-name', 'recto right stays book-name');
    assertEq(hr.slots.right.text, 'ספר התניא', 'dash-split main (התנהגות המקור — ללא שינוי)');
    assert(hr.splitTitle === false, 'flag off');
  });
  it('hash הקנוני זהה לנעילה 80f9ed6c… (הקוד החדש אינו משנה את ברירת המחדל)', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    assert(r.layoutHash.startsWith('80f9ed6c'), `canonical hash unchanged, got ${r.layoutHash.slice(0, 16)}`);
  });
  it('ביקורת שלילה — כשהמתג פעיל טקסט הכותרת באמת משתנה, והגיאומטריה נשארת זהה', () => {
    const rOff = typeset(CORPUS, getDefaultSettings());
    const sOn = { ...getDefaultSettings(), 'split-book-title': true };
    const rOn = typeset(CORPUS, sOn);
    // (א) רגישות: טקסט הכותרת משתנה בפועל — המתג מחובר לתוצאה
    let changed = 0;
    for (let i = 0; i < rOn.pages.length; i++) {
      const a = rOff.pages[i].header, b = rOn.pages[i].header;
      if (a && b) {
        for (const pos of ['right', 'center', 'left']) {
          if ((a.slots[pos] || {}).text !== (b.slots[pos] || {}).text) changed++;
        }
      }
    }
    assert(changed > 0, 'split changes header text on real pages (sensitivity)');
    // (ב) נייטרליות גיאומטרית: הכותרת העליונה היא עיטור — hash הפריסה חייב להישאר זהה
    assertEq(rOn.layoutHash, rOff.layoutHash, 'layout hash identical (headers are geometry-neutral)');
    assertEq(rOn.pages.length, rOff.pages.length, 'page count stable');
  });
});

report('s65-split-book-title');
