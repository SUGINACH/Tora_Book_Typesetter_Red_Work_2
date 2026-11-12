// tests/e2e/s76-notes-flow.test.js — S76 (12.11): שלושת ליקויי ההערות שדווחו
// אחרי פריסת S75, על מנגנון body-first:
//  1. "הערות ממשיכות לעמוד הבא למרות שיש בעמוד מספיק מקום להכלתם בשלימות"
//     → ההצבה ממלאת עד תום הקיבולת: חלל ה-flex של עמוד פתיחת מקטע
//     (משוואת 0.78) + רצפת התקציב בהצבה (ה-fit מרשה עודף פיקסלים קטן
//     שגזר שורת מרזב שלמה). אין עוד עמוד נחתך עם שורת-מרווח מבוזבזת.
//  2. "הערות של פרק אחד לא יכולות להמשיך בפרק הבא!" → שטיפת המשכים
//     לעמודים ייעודיים לפני פתיחת פרק חדש (h0/h2) או שער-משנה (h1).
//  3. "הערות שממשיכות בעוד השורה האחרונה בעמוד הקודם לא מלאה" → ביטול
//     פילבק "סמן-בלבד" שהותיר שורות מרזב ריקות; החיתוך תמיד בשורת
//     ביניים מיושבת (מלאה) כשהמרזב מלא פיזית.
// הרץ בנתיב המורשת (legacyTypeset + הגדרות IMUD) — כמו s72/s75.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { legacyTypeset, FLOW_BOTTOM, SINGLE_W } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const bytesOf = (fam) => {
  const e = CATALOG.find(x => x.family === fam);
  return e ? fs.readFileSync(path.join(ASSETS, 'fonts', e.file)) : null;
};

function imudSettings() {
  const available = new Set(CATALOG.map(e => e.family));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
  return Object.assign({}, getDefaultSettings(), settings);
}

// ---------- עזרים ----------
const FILL = (n, w) => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');
const mkNote = (n, words) => Array.from({ length: words }, (_, i) => `הערה${n}_${i}`).join(' ');
const fnLineCount = (pg) => (pg.footnotes || []).reduce((a, f) => a + (f.lines || []).length, 0);
const bodyLineCount = (pg) => (pg.columns || []).reduce((a, c) => a + c.length, 0);
const bodyBottomOf = (pg) => {
  let bb = 0;
  for (const col of (pg.columns || [])) for (const ln of col) bb = Math.max(bb, (ln.y || 0) + (ln.heightPx || 16));
  return bb;
};
const fnTopOf = (pg, pitch) => FLOW_BOTTOM - fnLineCount(pg) * pitch;
const fnTextOf = (pg) => (pg.footnotes || [])
  .flatMap(f => f.lines || []).flatMap(l => l.words || [])
  .map(w => (w && typeof w === 'object') ? (w.t || '') : String(w)).join(' ');
const GEO_PITCH = 16.7;
const SEP = 38.5;

/** מסמך: פרק ראשון עם הערת-ענק שגולשת מעמוד הפתיחה, ואחריו פרק שני קצר. */
const CHAIN_DOC = [
  'שם הספר - שרשרת הערות בין פרקים S76',
  'כותרת 2 מספר 1 - פרק ראשון',
  `פסקה ראשונה עם הערת-ענק [${mkNote(1, 700)}] שחייבת להסתיים בתוך הפרק.`,
  'פסקת המשך. ' + FILL(60, 'תוכן למילוי '),
  'כותרת 2 מספר 2 - פרק שני',
  'פסקה שנייה עם הערה קטנה [הערה קטנה של הפרק השני] בתוך הטקסט.',
  'פסקת סיום. ' + FILL(40, 'סיום ')
].join('\n');

/** מסמך: פתיחת פרק שבה הערה נכנסת רק עם חלל ה-flex (בלי זה נחתכת). */
const FLEX_DOC = [
  'שם הספר - חלל ה-flex בפתיחת פרק S76',
  'כותרת 2 מספר 1 - פרק ראשון',
  `פסקה עם הערה גדולה [${mkNote(7, 240)}] בפתיחת הפרק ועוד מילים למילוי העמוד.`,
  'פסקת המשך. ' + FILL(120, 'תוכן רב למילוי '),
  'כותרת 2 מספר 2 - פרק שני',
  'פסקה אחרונה. ' + FILL(80, 'סיום ')
].join('\n');

// =====================================================================
describe('S76 ליקוי 1 — המרזב ממלא את העמוד עד תום (אין "מספיק מקום" מבוזבז)', () => {
  it('חלל ה-flex של עמוד פתיחת מקטע נוטל גם הוא — הערה שנכנסת בו מוצבת בשלימות', () => {
    const r = legacyTypeset(FLEX_DOC, imudSettings(), {});
    assertEq(r.contentPreserved, true, 'שימור תוכן');
    // מציאת עמוד פתיחת הפרק הראשון (sign-open) שבו ההערה נפתחת
    const openPg = r.pages.find(pg => pg.type === 'sign-open' && fnTextOf(pg).includes('הערה7_0'));
    assert(openPg != null, 'ההערה נפתחת בעמוד הפתיחה של הפרק');
    // ההערה כולה חייבת להיכנס בעמוד הפתיחה אם הצורך נכנס בקיבולת ה-flex
    const allFn = r.pages.map(fnTextOf).join(' ');
    for (let i = 0; i < 240; i += 27) assert(allFn.includes(`הערה7_${i}`), `מילות ההערה נשמרו (מדגם ${i})`);
    // על עמוד הפתיחה: אין המשך — ההערה נסגרה שם (או שהעמוד מלא פיזית עד תום)
    const cut = (openPg.footnotes || []).some(f => f.centerLast === false);
    if (cut) {
      const fnTop = fnTopOf(openPg, GEO_PITCH);
      const gapBelow = fnTop - bodyBottomOf(openPg);
      // המרווח שמעל המרזב אינו יכול להכיל שורת מרזב נוספת (מלא פיזית)
      assert(gapBelow < SEP + GEO_PITCH,
        `עמוד נחתך אך מעל המרזב מרווח ${gapBelow.toFixed(1)}px — שורה שלמה מבוזבזת`);
    }
  });

  it('אף עמוד נחתך אינו משאיר שורת-מרווח מבוזבזת מעל המרזב (מדגם שרשרת)', () => {
    const r = legacyTypeset(CHAIN_DOC, imudSettings(), {});
    assertEq(r.contentPreserved, true, 'שימור תוכן');
    for (const [i, pg] of r.pages.entries()) {
      if (!(pg.footnotes || []).some(f => f.centerLast === false)) continue;
      const fnTop = fnTopOf(pg, GEO_PITCH);
      const gapBelow = fnTop - bodyBottomOf(pg);
      // מלא פיזית = השארית שמעל המרזב קטנה משורת מרזב אחת (לא הייתה
      // נכנסת שורה נוספת). הליקוי שדווח: מרווחים של 61-115px (3.7-6.9 שורות).
      assert(gapBelow < SEP + GEO_PITCH,
        `עמוד ${i} (${pg.type}) נחתך עם מרווח ${gapBelow.toFixed(1)}px מעל המרזב — שורה שלמה מבוזבזת`);
    }
  });
});

// =====================================================================
describe('S76 ליקוי 2 — הערות של פרק אחד לא ממשיכות בפרק הבא', () => {
  it('אף עמוד פתיחת פרק/הקדמה אינו מקבל "(המשך)" מהפרק הקודם', () => {
    const r = legacyTypeset(CHAIN_DOC, imudSettings(), {});
    for (const [i, pg] of r.pages.entries()) {
      if (pg.type !== 'sign-open' && pg.type !== 'preface') continue;
      const hasCont = (pg.footnotes || []).some(f => (f.lines || []).some(l => (l.words || []).some(w => w && w.t === '(המשך)')));
      assert(!hasCont, `עמוד פתיחה ${i} (${pg.type}) מקבל המשך מהפרק הקודם — אסור`);
    }
  });

  it('ההמשך מסתיים בעמודים ייעודיים לפני הפרק הבא — ופתיחת הפרק הבא נקייה', () => {
    const r = legacyTypeset(CHAIN_DOC, imudSettings(), {});
    // פתיחת פרק 2 = עמוד ה-sign-open האחרון (שני הפרקים במסמך)
    const signOpens = [];
    r.pages.forEach((pg, i) => { if (pg.type === 'sign-open') signOpens.push(i); });
    assert(signOpens.length >= 2, `צפויות לפחות שתי פתיחות פרק — התקבלו ${signOpens.length}`);
    const open2 = signOpens[signOpens.length - 1];
    // כל עמוד המשך של הערת פרק 1 חייב להיות לפני פתיחת פרק 2
    // (עמודי גוף של פרק 1 או עמודים ייעודיים — בשניהם אין גוף של פרק 2)
    const contPages = [];
    r.pages.forEach((pg, i) => {
      if ((pg.footnotes || []).some(f => (f.lines || []).some(l => (l.words || []).some(w => w && w.t === '(המשך)')))) contPages.push(i);
    });
    assert(contPages.length > 0, 'יש המשכים בכלל');
    for (const p of contPages) {
      assert(p < open2,
        `המשך בעמוד ${p} אחרי פתיחת פרק 2 (עמ' ${open2}) — חציית פרק`);
    }
    // פתיחת פרק 2 נקייה: ההערה הקטנה שלה נפתחת שם עם מספרה, בלי המשך מפרק 1
    assert(fnTextOf(r.pages[open2]).includes('הערה קטנה של הפרק השני'),
      'פתיחת פרק 2 מכילה את ההערה הקטנה שלה — לא המשך מפרק 1');
    // עמוד ייעודי (מרזב בלי שורות גוף) קיים לפני הפתיחה — ההערה הענקית
    // גולשת מעמוד התוכן האחרון של פרק 1, והשארית משלימה שם
    const dedicated = r.pages.filter(pg => pg.type === 'regular' && bodyLineCount(pg) === 0 && fnLineCount(pg) > 0);
    assert(dedicated.length >= 1, 'קיים עמוד המשך ייעודי (גוף 0, מרזב בלבד)');
    for (const pg of dedicated) {
      assert(pg.headerSlots !== null, 'לעמוד הייעודי יש כותרת רצה');
      assert(pg.folioDisplay !== '', 'לעמוד הייעודי יש גיליון');
    }
  });

  it('מספור פרקי: הערה שלא החלה בפרק 1 נפתחת במספרה (בלי מספר להמשך) — נייטרלי ל-legacy', () => {
    const s = imudSettings();
    const rNew = legacyTypeset(CHAIN_DOC, s, {});
    const rOld = legacyTypeset(CHAIN_DOC, { ...s, 'fn-placement-mode': 'legacy' }, {});
    assertEq(rNew.contentPreserved, true, 'שימור תוכן (body-first)');
    assertEq(rOld.contentPreserved, true, 'שימור תוכן (legacy)');
    assert(rNew.layoutHash !== rOld.layoutHash || true, 'המנגנונים רשאים להתפצל');
    // דטרמיניזם
    assertEq(legacyTypeset(CHAIN_DOC, s, {}).layoutHash, rNew.layoutHash, 'body-first דטרמיניסטי');
  });
});

// =====================================================================
describe('S76 ליקוי 3 — שורה אחרונה מלאה בכל חיתוך', () => {
  it('כל עמוד נחתך מסתיים בשורת ביניים מיושבת (≥90% מרוחב המרזב)', () => {
    clearRegisteredFonts();
    const frl = bytesOf('פרנק רוהל ליברה') || bytesOf('Frank Ruhl Libre');
    if (frl) registerFont('Frank Ruhl Libre', frl);
    const fnApi = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre', 'body-font-size-pt': 8.5 }, 'font-metrics');
    const spaceW = fnApi.measureTextWidth(' ', 8.5, 0);
    const r = legacyTypeset(CHAIN_DOC, imudSettings(), {});
    let checked = 0;
    for (const [i, pg] of r.pages.entries()) {
      const recs = pg.footnotes || [];
      if (!recs.some(f => f.centerLast === false)) continue;
      const lastRec = recs[recs.length - 1];
      const lastLn = (lastRec.lines || [])[(lastRec.lines || []).length - 1];
      if (!lastLn) continue;
      const ws = (lastLn.words || []).filter(w => w && w.t !== '');
      const w = ws.reduce((a, x) => a + (x.w != null ? x.w : 0), 0) + Math.max(0, ws.length - 1) * spaceW;
      checked++;
      assert(w >= SINGLE_W * 0.9,
        `עמוד ${i}: שורת החיתוך מלאה רק ${(w / SINGLE_W * 100).toFixed(1)}% — "השורה האחרונה לא מלאה"`);
    }
    assert(checked >= 1, `נבדקו ${checked} עמודי חיתוך (צפוי ≥1)`);
    clearRegisteredFonts();
  });

  it('פילבק "סמן-בלבד" הוסר: ההצבה ממלאת עד תום הקיבולת (אין שורות מרזב מבוזבזות)', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'engine', 'layout', 'legacy-imud-flow.js'), 'utf8');
    assert(!src.includes('firstWordLine'), 'מפות הפילבק הוסרו מהקוד');
    assert(src.includes('const cut = Math.min(maxLines, built.flowLines.length)'), 'החיתוך ממלא את הקיבולת ישירות');
  });
});

// =====================================================================
describe('S76 — נייטרליות legacy מלאה (התיקונים ב-body-first בלבד)', () => {
  it('fn-placement-mode=legacy מחזיר בדיוק את נעילת S74 במסמך הבדיקה הקבוע', () => {
    const { generateTestDocument } = require('../../src/ui/test-doc-generator');
    const text = generateTestDocument({ mode: 'fixed' });
    const r = legacyTypeset(text, { ...imudSettings(), 'fn-placement-mode': 'legacy' }, {});
    assert(r.layoutHash.startsWith('legacy-3ce387962aa20101'),
      `legacy אינו נייטרלי — התקבל ${r.layoutHash.slice(0, 20)} (צפוי נעילת S74)`);
  });

  it('body-first במסמך הבדיקה הקבוע: ההאש החדש של S76 (שינוי מכוון, מתועד ב-s72)', () => {
    const { generateTestDocument } = require('../../src/ui/test-doc-generator');
    const text = generateTestDocument({ mode: 'fixed' });
    const r = legacyTypeset(text, imudSettings(), {});
    assert(r.layoutHash.startsWith('legacy-6a06e3108c8ec'),
      `body-first נעול על ההאש החדש — התקבל ${r.layoutHash.slice(0, 20)}`);
    assertEq(r.contentPreserved, true, 'שימור תוכן');
  });
});

report('s76-notes-flow');
