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
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { registerFont } = require('../../src/engine/typography/measure-api');
const {
  toBareGematria, toHebrewNumber, formatPageNumber, tocPageLabel, assignNumbers,
} = require('../../src/engine/decoration/folio');
const { exportHtmlFromModel, exportPdfFromModel } = require('../../src/engine/output/export-api');
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
    
    // **Iteration-001 (legacy parity — 22.11, פס H3 באמצע עמוד כמו המקור):**
    // נעילה מחודשת fdff19d8→8a6b23bd — H3 (mode=full-width) נשארת מעתה באותו
    // עמוד כפס חוצה-טורים באמצע הזרימה (סף המקור: max(60, גובה-פס+22)); במקום
    // שטיפת-עמוד בלתי-מותנית בכל כותרת. הקנוני: 37=37 עמודים, contentPreserved=true,
    // דטרמיניזם OK, אפס הפרות תוכנית (s7 16/16) ואפס חפיפות בהקרנה (s14 53/53).
    // דוח: audits/legacy-parity-iteration/iteration-001/.
    assert(r.layoutHash.startsWith('8a6b23bd'), `layoutHash קנוני נשמר (התקבל ${r.layoutHash.slice(0, 16)})`);
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

// =====================================================================
// הוראת 19.11 (סשן הביצועים, §2): בדיקת אינטגרציה ישירה לנתיב המספור
// בערכים מעל 999 — לא רק בדיקת פונקציית toBareGematria. ה־unified תומך
// ב־page-num-initial-value (נוסחת V1: effective = ordinal − start‑idx +
// initial‑value), ולכן קורפוס רגיל מגיע לטווח האלפים בנתיב ה־typeset המלא:
// assignNumbers → folioDisplay → תוויות TOC → PageModel.folio.text → HTML → PDF.
// המורשת מתחילה תמיד ב־pn=1 (אין כפתור initial‑value בנתיב ה־IMUD) — מעל 999
// במורשת נדרש מסמך בן 1000+ עמודים; שם הכיסוי הוא המקור המשותף (toBareGematria,
// נסרק בבדיקת המקור לעיל) + זהות בין־מנועית 1..999 + בדיקת הפונקציה ב־1000/1001/5702.
// =====================================================================
describe('D-108 אינטגרציה מעל 999 — נתיב מלא: assignNumbers → typeset → TOC → PageModel → HTML → PDF', () => {
  const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
  const IV = 995; // חוצה את גבול ה־999→1000 בתוך העמודים המוצגים
  const g2n = createG2n();

  it('assignNumbers (נתיב המספור האמיתי): initial-value=995 ⇒ 995..1004, הכל חשוף', () => {
    const pages = Array.from({ length: 10 }, () => ({ type: 'regular', template: { counts: true } }));
    const settings = {
      'page-num-format': 'hebrew', 'page-num-start-idx': 1, 'page-num-initial-value': IV,
      'page-num-position': 'bottom-center', 'page-num-frame': 'none',
    };
    const numbers = assignNumbers(pages, settings);
    const expected = ['תתקצה', 'תתקצו', 'תתקצז', 'תתקצח', 'תתקצט', 'א', 'אא', 'אב', 'אג', 'אד'];
    numbers.forEach((n, i) => {
      assertEq(n.page, IV + i, `effective ${IV + i}`);
      assertEq(n.display, expected[i], `display ${IV + i}`);
      assert(isBareFolio(n.display), `display ${IV + i} חשוף (התקבל "${n.display}")`);
      assert(n.shown, `עמוד ${IV + i} מציג גיליון`);
      assert(n.counted, `עמוד ${IV + i} נספר`);
    });
  });

  it('typeset מלא (unified): כל פוליו/תווית TOC מעל 999 חשופים דרך הנתיב החי; פריסה לא זזה', () => {
    const S = { ...getDefaultSettings(), 'page-num-initial-value': IV };
    const r = typeset(CORPUS, S);
    const folioPages = r.pages.filter(p => p.folioDisplay);
    assert(folioPages.length >= 5, `יש פוליות לבדיקה (התקבלו ${folioPages.length})`);
    let above999 = 0;
    for (const p of folioPages) {
      assert(p.pageNumber >= IV, `ערך יעיל ${p.pageNumber} ≥ ${IV}`);
      assertEq(p.folioDisplay, toBareGematria(p.pageNumber), `עמוד ${p.index + 1}: folioDisplay דרך המקור הקנוני`);
      assert(isBareFolio(p.folioDisplay), `עמוד ${p.index + 1}: פוליו "${p.folioDisplay}" חשוף (D-108, מעל 999)`);
      if (p.pageNumber >= 1000) above999++;
    }
    assert(above999 >= 3, `פוליו בטווח האלפים דרך הנתיב החי (התקבלו ${above999})`);
    // תוויות TOC — resolveTocTargets דרך tocPageLabel ⇒ formatPageNumber:
    let labels = 0, labelsAbove = 0;
    for (const p of r.pages) {
      if (!p.toc || !Array.isArray(p.toc.rows)) continue;
      for (const row of p.toc.rows) {
        const entries = row.kind === 'group' ? row.items : [row];
        for (const e of entries) {
          if (!e.label) continue;
          labels++;
          assert(isBareFolio(e.label), `עמוד ${p.index + 1}: תווית TOC "${e.label}" חשופה (מעל 999)`);
          const v = g2n(e.label, { atLeast: IV - 1 });
          if (v != null && v >= 1000) labelsAbove++;
        }
      }
    }
    assert(labels >= 3, `יש תוויות TOC (התקבלו ${labels})`);
    assert(labelsAbove >= 1, `תוויות TOC בטווח האלפים (התקבלו ${labelsAbove})`);
    // PageModel — מקור היחיד ל־HTML/PDF (mp.folio.text) — עקבי לעמוד המקור באותו אינדקס:
    const modelFolios = r.pageModel.pages.filter(mp => mp.folio && mp.folio.text);
    assert(modelFolios.length === folioPages.length, `כמות פוליו במודל (${modelFolios.length}) = בעמודים (${folioPages.length})`);
    for (const mp of modelFolios) {
      assert(isBareFolio(mp.folio.text), `PageModel folio "${mp.folio.text}" חשוף — מקור ה־HTML/PDF`);
      const src = r.pages[mp.index];
      assert(src, `עמוד מקור ${mp.index} למודל`);
      assertEq(mp.folio.text, src.folioDisplay, `PageModel folio (עמ' ${mp.index + 1}) זהה ל־folioDisplay של העמוד`);
      assertEq(src.folioDisplay, toBareGematria(src.pageNumber), `עמ' ${mp.index + 1}: folioDisplay דרך המקור הקנוני`);
    }
    // המספור אינו חלק מהפריסה: initial-value משנה תצוגה בלבד — ה־hash זהה לברירת המחדל:
    const rDefault = typeset(CORPUS, getDefaultSettings());
    assertEq(r.layoutHash, rDefault.layoutHash, 'layoutHash נשמר — שינוי המספור תצוגתי בלבד');
  });

  it('HTML מהמודל: כל גיליונות ה־footer חשופים וזהים למודל', () => {
    const S = { ...getDefaultSettings(), 'page-num-initial-value': IV };
    const r = typeset(CORPUS, S);
    const html = exportHtmlFromModel(r.pageModel, S, makeDoc(), { title: 'D-108 >999' });
    assert(html.startsWith('<!DOCTYPE html>'), 'מבנה HTML תקין');
    // חילוץ טקסט ה־footer של הגיליון מה־HTML המיוצא:
    const folioTexts = [...html.matchAll(/<footer class="folio[^"]*"[^>]*>([^<]*)<\/footer>/g)].map(m => m[1].trim());
    const modelFolios = r.pageModel.pages.filter(mp => mp.folio && mp.folio.text).map(mp => mp.folio.text);
    assert(folioTexts.length >= 5, `גיליונות footer ב־HTML (התקבלו ${folioTexts.length})`);
    assertEq(folioTexts.length, modelFolios.length, 'כמות ה־footer = כמות פוליו המודל');
    for (const t of folioTexts) {
      assert(isBareFolio(t), `HTML folio "${t}" חשוף (D-108, מעל 999)`);
      assert(modelFolios.includes(t), `HTML folio "${t}" קיים במודל`);
    }
  });

  it('PDF מהמודל: הגיליונות החשופים מעל 999 מוטמעים בבתים האמיתיים', () => {
    if (typeof Buffer === 'undefined') { console.error('  [מדלג — Node]'); return; }
    let HAS = true;
    try { execFileSync('pdftotext', ['-v'], { stdio: 'pipe' }); } catch (e) { HAS = false; }
    if (!HAS) { console.error('  [מדלג — poppler לא במערכת]'); return; }
    const ASSETS = path.join(__dirname, '..', '..', 'ui/assets/imud');
    const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
    const e = CATALOG.find(x => x.family === 'Frank Ruhl Libre');
    const fontBytes = fs.readFileSync(path.join(ASSETS, 'fonts', e.file));
    const S = { ...getDefaultSettings(), 'page-num-initial-value': IV };
    const r = typeset(CORPUS, S);
    const res = exportPdfFromModel(r.pageModel, S, fontBytes, 'Frank Ruhl Libre');
    assert(res.ok, 'ייצוא עבר: ' + (res.error || ''));
    const tmp = path.join(__dirname, '..', 'artifacts', 'd108-over999.pdf');
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, res.bytes);
    const txt = execFileSync('pdftotext', [tmp, '-'], { encoding: 'utf8' });
    // הפוליו הוא המקור היחיד של emitWord לגיליון (pdf-writer: pg.folio.text) —
    // מקורו נבדק לעיל; כאן מוכיחים שהערכים החשופים (אורך ≥ 2 — חד־משמעיים
    // למחרוזות כמו תתקצח/אא/אד/איג) אכן נמצאים בבתים של ה־PDF האמיתי:
    const distinctive = [...new Set(r.pageModel.pages.filter(mp => mp.folio && mp.folio.text && mp.folio.text.length >= 2).map(mp => mp.folio.text))];
    assert(distinctive.length >= 4, `ערכי פוליו ייחודיים לבדיקה (התקבלו ${distinctive.length}: ${distinctive.join(',')})`);
    for (const t of distinctive) {
      assert(txt.includes(t), `פוליו "${t}" נחלץ מה־PDF האמיתי`);
    }
    // בדיקת היעדר גורפת אינה אפשרית: סמני ההערות (hebrew-geresh — 'א׳') לגיטימיים
    // בגוף ה־PDF לפי D-108 ("אין להסיק"). הפרדת הפוליו הוכחה לעיל ברמת המקור והחילוץ.
  });
});

function createG2n() {
  const { createFullMathAudit } = require(path.join(__dirname, '..', '..', '..', 'tools', 'layout-audit', 'full-math-audit.js'));
  return createFullMathAudit().gematriaToNumber;
}

// ---------- DOM shim מינימלי (דפוס s8e, כולל סריאליזציה) לייצוא HTML ----------
function makeDoc() {
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this._text = '';
      this.classList = new ClassList(this);
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    scrollIntoView() {}
    focus() {}
    // סריאליזציה (כמו s8e/s10): הייצוא צורך outerHTML — בלי זה אין פלט מה-shim.
    _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    _cssKey(k) { return k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${this._cssKey(k)}:${this._esc(v)}`).join(';');
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${this._esc(v)}"`).join('')
        + (this._class ? ` class="${this._esc(this._class)}"` : '')
        + (styleStr ? ` style="${styleStr}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${this._esc(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : this._esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrsStr}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

report();
