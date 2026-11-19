// tests/e2e/d108-bare-folio.test.js — D-108: פוליו בגימטריה חשופה בלבד (legacy↔unified)
//
// הוראת 19.11 (§ו.8 + §יא): המטריצה מחייבת את הערכים 1, 2, 15, 16, 21, 22, 99,
// 100, 101, 999, 1000, 1001, 5702 — כל פוליו וכל תווית TOC בלי U+05F3/U+05F4/
// אפוסטרוף/מרכאה ASCII. בדיקות שלילה מזריקות גרש/גרשיים ומוכיחות שהשער נכשל.
// הפרדה מחייבת: סמני הערות (hebrew-geresh) נשארים עם גרש לפי הגדרותיהם —
// D-108: "אין להסיק מכלל זה דבר על סימני ציטוט/גרש בהערות, בגוף הטקסט או
// בשדות אחרים".
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { registerFont } = require('../../src/engine/typography/measure-api');
const {
  toBareGematria, toHebrewNumber, formatPageNumber, tocPageLabel,
} = require('../../src/engine/decoration/folio');
const { markerFor } = require('../../src/engine/notes/markers');
const {
  toGematria, LineBreaker,
} = require('../../src/engine/layout/legacy-imud-flow');

// ---------- מטריצת D-108 (הוראת §ו.8) ----------
const MATRIX = [1, 2, 15, 16, 21, 22, 99, 100, 101, 999, 1000, 1001, 5702];
const EXPECTED = {
  1: 'א', 2: 'ב', 15: 'טו', 16: 'טז', 21: 'כא', 22: 'כב', 99: 'צט',
  100: 'ק', 101: 'קא', 999: 'תתקצט', 1000: 'א', 1001: 'אא', 5702: 'התשב',
};
// אסורים בכל פוליו/תווית TOC: גרש, גרשיים, אפוסטרוף ASCII, מרכאה ASCII
const FORBIDDEN = /[\u05F3\u05F4'"]/;
const isBareFolio = (s) => !FORBIDDEN.test(String(s == null ? '' : s));

// ---------- הגדרות הנתיב החי (כמו parity-signature: אותן הגדרות לשני המנועים) ----------
const RB = path.join(__dirname, '..', '..');
function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const { getSettingDefs } = require('../../src/engine/core/settings-registry');
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  return importImudSettings(legacy, regKeys, { availableFonts: families }).settings;
}
function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'],
  ];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
}
function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf'),
  };
}

// =====================================================================
describe('D-108 מטריצת הפוליו — פורמט חשוף בכל הערכים המחייבים', () => {
  it('formatPageNumber (hebrew/gematria): הערכים הצפויים בדיוק, בלי שום סימן פיסוק', () => {
    for (const n of MATRIX) {
      const he = formatPageNumber(n, { 'page-num-format': 'hebrew' });
      assertEq(he, EXPECTED[n], `hebrew ${n}`);
      assert(isBareFolio(he), `hebrew ${n} חשוף (התקבל "${he}")`);
      // 'gematria' — הכינוי שבו משתמשות ערכות IMUD — נופל לאותו פורמט:
      const g = formatPageNumber(n, { 'page-num-format': 'gematria' });
      assertEq(g, EXPECTED[n], `gematria ${n}`);
      assert(isBareFolio(g), `gematria ${n} חשוף`);
      // daf-hebrew — חלק המספר חשוף גם כאן:
      const d = formatPageNumber(n, { 'page-num-format': 'daf-hebrew' });
      assertEq(d, `דף ${EXPECTED[n]}`, `daf-hebrew ${n}`);
      assert(isBareFolio(d), `daf-hebrew ${n} חשוף`);
      // decimal — ספרות, אין סימני פיסוק ממילא:
      assert(isBareFolio(formatPageNumber(n, { 'page-num-format': 'decimal' })), `decimal ${n}`);
      // תווית TOC — אותו פורמט בלי מסגרת:
      const tl = tocPageLabel(n, { 'page-num-format': 'hebrew' });
      assertEq(tl, EXPECTED[n], `tocPageLabel ${n}`);
      assert(isBareFolio(tl), `tocPageLabel ${n} חשוף`);
    }
  });

  it('toBareGematria: מקור הפורמט הקנוני — המטריצה + מקרי קצה', () => {
    for (const n of MATRIX) assertEq(toBareGematria(n), EXPECTED[n], `toBareGematria ${n}`);
    assertEq(toBareGematria(0), '', '0 ⇒ ריק (כמו המורשת)');
    assertEq(toBareGematria(-5), '', 'שלילי ⇒ ריק');
    assertEq(toBareGematria(NaN), '', 'NaN ⇒ ריק');
    assertEq(toBareGematria(2000), 'ב', '2000 ⇒ ב (בלי מפריד)');
    assertEq(toBareGematria(5761), 'התשסא', '5761 ⇒ התשסא');
    // המספור המסורתי (D-31/D-37) נשתמר לשדות שאינם פוליו — לא נפגע:
    assertEq(toHebrewNumber(22), 'כ״ב', 'toHebrewNumber נשאר עם גרשיים (שדות שאינם פוליו)');
    assertEq(toHebrewNumber(5702), 'ה׳תש״ב', 'toHebrewNumber אלפים נשתמר');
  });

  it('השוואה בין-מנועית: למורשת ולמאוחד אותה גימטריה בדיוק בכל טווח הקורפוסים (1..999)', () => {
    // הקורפוסים החיים מגיעים עד ~1200 עמודים; צד המורשת מגיע עד ~730.
    // בטווח 1..999 שתי הפונקציות חייבות להסכים אות-באות; מעל 999 הפוליו
    // של שני הצדדים הוא toBareGematria (מקור משותף — נבדק בהמשך).
    for (let n = 1; n <= 999; n++) {
      assertEq(toGematria(n), toBareGematria(n), `legacy toGematria(${n}) === unified toBareGematria(${n})`);
    }
  });

  it('מקור יחיד: אתרי הפוליו של המורשת מחוברים לפורמט החשוף (לא ל-toGematria)', () => {
    // שמירה מפני רגרסיה: אם אתר folioDisplay/fallback-ה-TOC יחזור ל-toGematria
    // (שמוסיף מפריד אלפים מעל 999) — הבדיקה נכשלת. סריקת מקור כמו s10-ui.
    const src = fs.readFileSync(path.join(RB, 'src/engine/layout/legacy-imud-flow.js'), 'utf8');
    assert(src.includes('toBareGematria(p.pageNumber)'), 'אתר folioDisplay של המורשת משתמש ב-toBareGematria');
    assert(src.includes('toBareGematria(pi)'), 'fallback תווית ה-TOC של h1 משתמש ב-toBareGematria');
    assert(!src.includes('toGematria(p.pageNumber)'), 'אף אתר פוליו לא חוזר ל-toGematria');
    assert(src.includes("require('../decoration/folio')"), 'המורשת מייבאת את מקור הפורמט המשותף');
  });
});

// =====================================================================
describe('D-108 typeset מלא — כל פוליו וכל תווית TOC חשופים בפועל', () => {
  const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');

  it('unified (פרופיל ברירת המחדל): כל folioDisplay/תווית TOC חשופים; נעילת DP נשמרת', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    let folios = 0;
    for (const p of r.pages) {
      if (!p.folioDisplay) continue;
      folios++;
      assert(isBareFolio(p.folioDisplay), `עמוד ${p.index + 1}: פוליו "${p.folioDisplay}" חשוף (D-108)`);
    }
    assert(folios >= 5, `יש פוליות לבדיקה (התקבלו ${folios})`);
    // תוויות ה-TOC — e.label מ-resolveTocTargets (tocPageLabel ⇒ formatPageNumber):
    let labels = 0;
    for (const p of r.pages) {
      if (!p.toc || !Array.isArray(p.toc.rows)) continue;
      for (const row of p.toc.rows) {
        const entries = row.kind === 'group' ? row.items : [row];
        for (const e of entries) {
          if (!e.label) continue;
          labels++;
          assert(isBareFolio(e.label), `עמוד ${p.index + 1}: תווית TOC "${e.label}" חשופה (D-108)`);
        }
      }
    }
    assert(labels >= 3, `יש תוויות TOC לבדיקה (התקבלו ${labels})`);
    // הפוליו אינו חלק מ-hash הפריסה (dp-planner: type/עמודות/הערות בלבד) —
    // תיקון הפורמט אסור שיזיז את הפריסה: נעילת הקנוני נשמרת (fdff19d8, D-107).
    assert(r.layoutHash.startsWith('fdff19d8'), `layoutHash קנוני נשמר (התקבל ${r.layoutHash.slice(0, 16)})`);
  });

  it('legacy (פרופיל IMUD, הגדרות חיות): כל folioDisplay חשוף', () => {
    registerLiveFonts();
    const settings = { ...getDefaultSettings(), ...liveSettings(), 'measure-impl': 'font-metrics' };
    const r = typeset(CORPUS, settings, { noRecommendations: true, ...typesetEnvExtras() });
    assert(r.legacyProfile === true, 'המנוע רץ כמורשת (בלי דגל unified)');
    let folios = 0;
    for (const p of r.pages) {
      if (!p.folioDisplay) continue;
      folios++;
      assert(isBareFolio(p.folioDisplay), `מורשת, עמוד ${p.index + 1}: פוליו "${p.folioDisplay}" חשוף (D-108)`);
    }
    assert(folios >= 5, `יש פוליות לבדיקה במורשת (התקבלו ${folios})`);
    // תוויות TOC של המורשת — r.folio מ-folioByToken (= folioDisplay/fallback):
    let labels = 0;
    for (const p of r.pages) {
      if (!p.toc || !Array.isArray(p.toc.rows)) continue;
      for (const row of p.toc.rows) {
        if (!row.folio) continue;
        labels++;
        assert(isBareFolio(row.folio), `מורשת, עמוד ${p.index + 1}: תווית TOC "${row.folio}" חשופה (D-108)`);
      }
    }
    assert(labels >= 3, `יש תוויות TOC לבדיקה במורשת (התקבלו ${labels})`);
  });
});

// =====================================================================
describe('D-108 בקרות שלילה — השעה רגיש לכל סימן פיסוק אסור', () => {
  it('הולידטור: צורות עם גרש/גרשיים/ASCII נדחות', () => {
    assert(isBareFolio('כב') === true, 'כב חשוף');
    assert(isBareFolio('טו') === true, 'טו חשוף');
    assert(isBareFolio('א') === true, 'א חשוף');
    assert(isBareFolio('כ״ב') === false, 'גרשיים (U+05F4) נתפסים');
    assert(isBareFolio('א׳') === false, 'גרש (U+05F3) נתפס');
    assert(isBareFolio("כ'ב") === false, 'אפוסטרוף ASCII נתפס');
    assert(isBareFolio('כ"ב') === false, 'מרכאה ASCII נתפסת');
    assert(isBareFolio('ה׳תש״ב') === false, 'צורת אלפים עם מפרידים נתפסת');
  });

  it('הזרקת U+05F4/U+05F3 לתוצאה אמיתית — מאותרת בכל פוליו שנבדק', () => {
    const r = typeset(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8'), getDefaultSettings());
    const withFolio = r.pages.filter(p => p.folioDisplay);
    assert(withFolio.length >= 5, 'יש פוליות להזרקה');
    let caught05F4 = 0, caught05F3 = 0;
    for (const p of withFolio) {
      const a = { ...p, folioDisplay: p.folioDisplay + '\u05F4' };
      if (!isBareFolio(a.folioDisplay)) caught05F4++;
      const b = { ...p, folioDisplay: '\u05F3' + p.folioDisplay };
      if (!isBareFolio(b.folioDisplay)) caught05F3++;
    }
    assertEq(caught05F4, withFolio.length, 'כל הזרקות הגרשיים נתפסו');
    assertEq(caught05F3, withFolio.length, 'כל הזרקות הגרש נתפסו');
  });
});

// =====================================================================
describe('D-108 הפרדת סמנים — הערות אינן פוליו; הגרש שלהן נשמר', () => {
  it('unified: hebrew-geresh (ברירת המחדל) שומר גרש/גרשיים לפי הגדרותיו', () => {
    // סמני hebrew-geresh הם רצף אלפביתי (א,ב,ג...ש,ת,אא...) — לא גימטריה;
    // הגרש/הגרשיים שלהם נשמרים ואינם מושפעים מפורמט הפוליו.
    assertEq(markerFor(1, 'hebrew-geresh'), 'א׳', 'סמן 1');
    assertEq(markerFor(3, 'hebrew-geresh'), 'ג׳', 'סמן 3');
    assertEq(markerFor(15, 'hebrew-geresh'), 'ס׳', 'סמן 15 — האות ה-15 באלפבית');
    assertEq(markerFor(21, 'hebrew-geresh'), 'ש׳', 'סמן 21 — האות ה-21');
    assertEq(markerFor(23, 'hebrew-geresh'), 'א״א', 'סמן 23 — גרשיים לפני האות האחרונה');
    assertEq(markerFor(2, 'decimal'), '2', 'סגנון decimal לא נפגע');
  });

  it('legacy: markerWord של IMUD לא השתנה — כולל מעל 999 (D-108: "אין להסיק")', () => {
    assertEq(LineBreaker.markerWord(3), 'ג.', 'סמן מורשת 3');
    assertEq(LineBreaker.markerWord(15), 'טו.', 'סמן מורשת 15');
    // מעל 999 המורשת שומרת על מוסכמת המפריד שלה לסמנים (לא פוליו!):
    assertEq(LineBreaker.markerWord(1000), 'א׳.', 'סמן מורשת 1000 — ללא שינוי');
    assertEq(toGematria(1000), 'א׳', 'toGematria (סמנים/סימנים) שומר מפריד אלפים');
    assertEq(toGematria(5702), 'ה׳תשב', 'toGematria 5702 — כמקודם');
    // ...ואילו פורמט הפוליו המשותף חשוף גם שם:
    assertEq(toBareGematria(1000), 'א', 'פוליו 1000 חשוף');
    assertEq(toBareGematria(5702), 'התשב', 'פוליו 5702 חשוף');
  });
});

// =====================================================================
describe('D-108 פענוח האודיט — גימטריה חשופה נקראת נכון (כולל אלפים)', () => {
  const { createFullMathAudit } = require(path.join(__dirname, '..', '..', '..', 'tools', 'layout-audit', 'full-math-audit.js'));
  const audit = createFullMathAudit();
  const g2n = audit.gematriaToNumber;

  it('ערכי המטריצה והאלפים החשופים — מועמדים קנוניים בלבד', () => {
    for (const n of MATRIX) {
      // אלפים שלמים ('א'=1|1000) עמומים מטבעם ללא הקשר — נפענחים עם atLeast
      // (כמו בדיקת הרצף של האודיט); שאר הערכים חד-משמעיים לחלוטין.
      const v = g2n(toBareGematria(n), n >= 1000 ? { atLeast: n - 1 } : undefined);
      assertEq(v, n, `פענוח חשוף ${n}`);
    }
    assertEq(g2n('אקפ'), 1180, 'אקפ=1180 (לא 181 — סכימה לא-קנונית נדחית)');
    assertEq(g2n('קפא'), 181, 'קפא=181 (הצורה הקנונית של 181)');
    assertEq(g2n('א', { atLeast: 999 }), 1000, 'א אחרי 999 ⇒ 1000 (הקשר רצף)');
    assertEq(g2n('א'), 1, 'א עצמאי ⇒ 1');
    assertEq(g2n('ב', { atLeast: 1999 }), 2000, 'ב אחרי 1999 ⇒ 2000');
    assertEq(g2n('משולש'), 676, 'טקסט שרירותי — רשת ביטחון: סכום פשוט');
    assertEq(g2n('א ב'), null, 'רווח/תו זר ⇒ null');
    assertEq(g2n('abc'), null, 'לא עברי ⇒ null');
  });

  it('round-trip מלא: פענוח(הרכבה(n)) === n ב-1..999 ובסביבת האלפים (עם הקשר)', () => {
    for (let n = 1; n <= 999; n++) {
      assertEq(g2n(toBareGematria(n)), n, `round-trip ${n}`);
    }
    for (let n = 990; n <= 1230; n++) {
      assertEq(g2n(toBareGematria(n), { atLeast: n - 1 }), n, `round-trip אלפים ${n}`);
    }
  });

  it('צורות היסטוריות עם גרש/גרשיים — עדיין נקראות (תאימות לאחור)', () => {
    assertEq(g2n('כ״ב'), 22, 'כ״ב');
    assertEq(g2n('ט״ו'), 15, 'ט״ו');
    assertEq(g2n('א׳'), 1, 'א׳ עצמאי');
    assertEq(g2n('א׳', { atLeast: 999 }), 1000, 'א׳ אחרי 999 ⇒ 1000 (הבאג הקודם נסגר)');
    assertEq(g2n('ה׳תש״ב'), 5702, 'ה׳תש״ב — ענף הגרש ההיסטורי');
    assertEq(g2n('דף כב'), 22, 'קידומת דף');
    assertEq(g2n('(כב)'), 22, 'מסגרת סוגריים');
    assertEq(g2n('22'), 22, 'decimal');
  });
});

report();
