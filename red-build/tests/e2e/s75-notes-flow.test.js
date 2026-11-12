// tests/e2e/s75-notes-flow.test.js — S75 (12.11): שלוש בקשות משתמש
// 1. זרימת הערות לעמוד הבא — מנגנון body-first (ברירת מחדל חדשה):
//    הגוף ממלא את העמוד; ההערות בחלל שמתחת (תקרה 50% מגובה הזרימה); הערה
//    שאינה נכנסת — חלקית כפי יכולת ההכלה + המשך בעמוד הבא ("(המשך)" ובלי
//    מספר); השורה האחרונה של המרזב אינה ממורכזת כשהערה ממשיכה; הגדרת בחירה
//    בין המנגנון החדש לנוכחי (ברירת מחדל = החדש).
// 2. גיליון — ברירת המחדל ליבורנה מודגש 11pt (כמדידת הייחוס עמ' ט-יא).
// הרץ בנתיב המורשת (legacyTypeset + הגדרות IMUD) — כמו s72/s73.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { projectLegacyDocument } = require('../../src/engine/output/legacy-projector');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const bytesOf = (fam) => {
  const e = CATALOG.find(x => x.family === fam);
  return e ? fs.readFileSync(path.join(ASSETS, 'fonts', e.file)) : null;
};

/** הגדרות המקור — כמו ה-UI החי (הנתיב שבו זורם הספר בפועל). */
function imudSettings() {
  const available = new Set(CATALOG.map(e => e.family));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
  return Object.assign({}, getDefaultSettings(), settings);
}

// ---------- עזרי מסמך: תרחיש "פסקה עם שתי הערות גדולות" (ניסוח המשתמש) ----------
const FILL = (n, w) => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');
const mkNote = (n, words) => Array.from({ length: words }, (_, i) => `הערה${n}_${i}`).join(' ');
const TWO_BIG_NOTES_DOC = [
  'שם הספר - בדיקת זרימת הערות S75',
  'כותרת 2 מספר 1 - פרק ראשון',
  'פסקת פתיחה למילוי ראש העמוד. ' + FILL(180, 'תוכן למילוי ראש העמוד '),
  'פסקה שנייה למילוי. ' + FILL(200, 'תוכן רב למילוי העמוד כולו '),
  `פסקה עם שתי הערות הגדולות [${mkNote(1, 420)}] והמשך הטקסט של אותה פסקה [${mkNote(2, 420)}] וסיום הפסקה.`,
  'פסקה אחרי ההערות. ' + FILL(200, 'תוכן רב למילוי '),
  'פסקה אחרונה. ' + FILL(200, 'תוכן רב למילוי ')
].join('\n');

const fnLinesOf = (pg) => (pg.footnotes || []).reduce((a, f) => a + (f.lines || []).length, 0);
const bodyLinesOf = (pg) => (pg.columns || []).reduce((a, c) => a + c.length, 0);
const bodyBottomOf = (pg) => {
  let bb = 0;
  for (const col of (pg.columns || [])) for (const ln of col) bb = Math.max(bb, (ln.y || 0) + (ln.heightPx || 16));
  return bb;
};
const fnTextOf = (pg) => (pg.footnotes || [])
  .flatMap(f => f.lines || []).flatMap(l => l.words || [])
  .map(w => (w && typeof w === 'object') ? (w.t || '') : String(w)).join(' ');
const lineTextOf = (ln) => (ln.words || [])
  .map(w => (w && typeof w === 'object') ? (w.t || '') : String(w)).join(' ');
// מחט חיפוש = מילה בודדת ייחודית (ביטוי ארוך עלול להיחתך בין שורות)
const findWordPage = (r, needle) => r.pages.findIndex(pg =>
  (pg.columns || []).some(col => col.some(ln => lineTextOf(ln).split(' ').includes(needle))));

// =====================================================================
describe('S75 בקשה 1 — מנגנון הצבת ההערות body-first (ברירת המחדל החדשה)', () => {
  it('רישום: fn-placement-mode ברירת מחדל body-first, enum מלא, פקד ותווית', () => {
    const def = getSettingDefs().find(r => r.id === 'fn-placement-mode');
    assert(def != null, 'ההגדרה רשומה');
    assertEq(def.default, 'body-first', 'ברירת המחדל = המנגנון החדש (בקשת המשתמש)');
    assertEq(JSON.stringify(def.enum), JSON.stringify(['body-first', 'legacy']), 'שני מצבים: חדש/נוכחי');
    assertEq(def.control, 'sel-fn-placement', 'מזהה פקד');
    assertEq(getDefaultSettings()['fn-placement-mode'], 'body-first', 'ברירת המחדל ב-getDefaultSettings');
  });

  it('ללא דחיפה: הפסקה עם שתי ההערות מוצבת בעמוד שבו הגיעה — אין חור ענק', () => {
    const r = legacyTypeset(TWO_BIG_NOTES_DOC, imudSettings(), {});
    assertEq(r.contentPreserved, true, 'שימור תוכן מלא');
    const mp = findWordPage(r, 'וסיום'); // מילה ייחודית מהפסקה עם שתי ההערות
    assert(mp > 0, `עמוד הסמנים נמצא (p${mp})`);
    const pg = r.pages[mp];
    // ההערה הראשונה מתחילה בעמוד הסמן (ההקפדה — תחילת ההערה בלבד)
    assert(fnTextOf(pg).includes('הערה1_0'), 'הערה 1 מתחילה בעמוד הסמן');
    // הגוף בעמוד הסמן לא נדחק לעמוד הבא (החור שנמדד לפני S75: גוף שנגמר ברבע עמוד)
    assert(bodyLinesOf(pg) >= 8, `גוף ממלא את עמוד הסמן (קיבל ${bodyLinesOf(pg)} שורות)`);
    assert(bodyBottomOf(pg) > 200, 'הגוף אינו מסתיים ברבע עמוד');
  });

  it('הערה שאינה נכנסת — מוצבת חלקית והמשכה בעמוד הבא; אין עוד עמודי "שורת-גוף בודדת"', () => {
    const r = legacyTypeset(TWO_BIG_NOTES_DOC, imudSettings(), {});
    const mp = findWordPage(r, 'וסיום');
    assert(mp > 0, 'עמוד הסמנים נמצא');
    const fnPages = r.pages.map((pg, i) => ({ i, pg, fn: fnLinesOf(pg) })).filter(x => x.fn > 0);
    assert(fnPages.length >= 2, `ההערות זורמות על פני מספר עמודים (${fnPages.length})`);
    // הערה 1 נחתכת (חלקית בעמוד הסמן) — המשך עם "(המשך)" ובלי מספר
    const cont = fnPages.slice(1).find(x => fnTextOf(x.pg).includes('(המשך)'));
    assert(cont != null, 'יש המשך "(המשך)" בעמוד שאחרי הסמן');
    const firstContTokens = ((cont.pg.footnotes[0].lines || [])[0] || {}).words || [];
    assertEq(firstContTokens[0] && firstContTokens[0].t, '(המשך)', 'ההמשך נפתח ב-(המשך) — לא במספר');
    assert(!firstContTokens.slice(0, 3).some(w => w && w.mk), 'אין סמן-מספר להמשך הערה מעמוד קודם (הנחיית המשתמש)');
    // תקרה יחסית: בעמודי ההמשך הגוף ממלא במקביל — הליקוי שנמדד לפני S75
    // (3 עמודים רצופים של שורה אחת + 51 שורות הערות) אסור לחזור
    for (const x of fnPages) {
      const body = bodyLinesOf(x.pg);
      if (x.fn >= 25) assert(body >= 10, `עמוד ${x.i}: מרזב ${x.fn} שורות — הגוף ${body} שורות (צפוי ≥10)`);
    }
    // כל טקסט ההערות נשמר במלואו על פני המרזבים
    const allFn = r.pages.map(fnTextOf).join(' ');
    for (let i = 0; i < 420; i += 41) {
      assert(allFn.includes(`הערה1_${i}`), `מילות הערה 1 נשמרו (מדגם ${i})`);
      assert(allFn.includes(`הערה2_${i}`), `מילות הערה 2 נשמרו (מדגם ${i})`);
    }
  });

  it('מרכוז שורה-אחרונה: רק כשהמרזב נסגר (הערה ממשיכה ⇒ בלי מרכוז — אישור המשתמש)', () => {
    const r = legacyTypeset(TWO_BIG_NOTES_DOC, imudSettings(), {});
    const fnPages = r.pages.filter(pg => fnLinesOf(pg) > 0);
    assert(fnPages.length >= 2, 'מספר עמודי הערות');
    const lastFnPage = fnPages[fnPages.length - 1];
    const rec = lastFnPage.footnotes[lastFnPage.footnotes.length - 1];
    assertEq(rec.centerLast, true, 'העמוד האחרון של הזרימה — ההערה נגמרה ⇒ השורה האחרונה ממורכזת');
    const continuing = fnPages.slice(0, -1).filter(pg => ((pg.footnotes[pg.footnotes.length - 1] || {}).centerLast) !== false);
    assertEq(continuing.length, 0, 'בכל עמוד שההערות ממשיכות ממנו — השורה האחרונה אינה ממורכזת');
  });

  it('דטרמיניזם + הגדרה חיה: legacy מחזיר את התנהגות S74 (layout שונה)', () => {
    const s1 = imudSettings();
    const r1a = legacyTypeset(TWO_BIG_NOTES_DOC, s1, {});
    const r1b = legacyTypeset(TWO_BIG_NOTES_DOC, s1, {});
    assertEq(r1a.layoutHash, r1b.layoutHash, 'body-first דטרמיניסטי');
    const s2 = { ...s1, 'fn-placement-mode': 'legacy' };
    const r2 = legacyTypeset(TWO_BIG_NOTES_DOC, s2, {});
    assertEq(r2.contentPreserved, true, 'legacy שומר תוכן');
    assert(r2.layoutHash !== r1a.layoutHash, 'ההגדרה משנה בפועל (body-first ≠ legacy)');
    const r3 = legacyTypeset(TWO_BIG_NOTES_DOC, s2, {});
    assertEq(r2.layoutHash, r3.layoutHash, 'legacy דטרמיניסטי');
  });

  it('legacy שומר על התנהגות S74: הדחיפה (שער התקציב) עדיין קיימת במנגנון הישן', () => {
    const rOld = legacyTypeset(TWO_BIG_NOTES_DOC, { ...imudSettings(), 'fn-placement-mode': 'legacy' }, {});
    // במנגנון הישן נמדר: 3 עמודים רצופים של שורת-גוף אחת (cols=[1,0]) + מרזב מלא —
    // מוודאים שהגוף בעמודי ההמשך דל מאוד (ההתנהגות שהמשתמש ביקש להחליף, נשמרת ב-legacy)
    const sparse = rOld.pages.filter(pg => fnLinesOf(pg) > 25 && bodyLinesOf(pg) <= 3);
    assert(sparse.length >= 1, `legacy: עמודי מרזב-ענק עם גוף דל קיימים (${sparse.length}) — כהתנהגות S74`);
  });

  it('הערות קטנות: התנהגות התקציב ללא שינוי מהותי (need קטן מהתקרה ⇒ אותו מרזב)', () => {
    const doc = [
      'שם הספר - הערות קטנות',
      'כותרת 2 מספר 1 - פרק',
      'פסקה ראשונה עם הערה קטנה [הערה קצרה אחת לבדיקה] בתוך הטקסט.',
      'פסקת המשך. ' + FILL(120, 'מילוי תוכן רגיל ')
    ].join('\n');
    const base = imudSettings();
    const rNew = legacyTypeset(doc, base, {});
    const rOld = legacyTypeset(doc, { ...base, 'fn-placement-mode': 'legacy' }, {});
    assertEq(rNew.contentPreserved, true, 'שימור תוכן');
    assertEq(rOld.contentPreserved, true, 'שימור תוכן (legacy)');
    const pageNew = rNew.pages.find(p => fnLinesOf(p) > 0);
    const pageOld = rOld.pages.find(p => fnLinesOf(p) > 0);
    assert(pageNew && pageOld, 'שני המנגנונים מציבים את ההערה');
    assertEq(fnLinesOf(pageNew), fnLinesOf(pageOld), 'הערה קטנה — אותו מספר שורות מרזב בשני המנגנונים');
    assert(fnTextOf(pageNew).includes('הערה קצרה'), 'ההערה הוצבה');
  });

  it('רצפת ההתחלות: הערה טרייה שהגיעה אחרי carry גדול עדיין מתחילה בעמוד הסמן', () => {
    // carry גדול (הערה אדירה שזורמת) + פסקה חדשה עם הערה קטנה בעמוד ההמשך —
    // ההערה הקטנה חייבת להתחיל בעמוד שבו הסמן שלה מוצב (עדיפות 2 של המשתמש).
    const doc = [
      'שם הספר - רצפת התחלות',
      'כותרת 2 מספר 1 - פרק',
      `פסקה ראשונה עם הערה אדירה [${mkNote(9, 700)}] שזורמת על פני עמודים.`,
      'פסקת מילוי א. ' + FILL(90, 'תוכן מילוי אחד '),
      'פסקה עם הערה הקטנה [הערה קטנה שחייבת להתחיל כאן] ועוד מילים.',
      'פסקת מילוי ב. ' + FILL(200, 'תוכן מילוי שני ')
    ].join('\n');
    const r = legacyTypeset(doc, imudSettings(), {});
    assertEq(r.contentPreserved, true, 'שימור תוכן');
    const mp = findWordPage(r, 'ועוד'); // מילת-גוף ייחודית מהפסקה של ההערה הקטנה (טקסט ההערה עצמו אינו בגוף)
    assert(mp > 0, `עמוד הסמן של ההערה הקטנה (p${mp})`);
    assert(fnTextOf(r.pages[mp]).includes('הערה קטנה שחייבת'), 'ההערה הקטנה מתחילה בעמוד הסמן שלה — גם אחרי carry');
  });
});

// =====================================================================
describe('S75 בקשה 2 — גיליון בברירת המחדל: ליבורנה מודגש 11pt', () => {
  it('רישום: ברירות המחדל החדשות (גופן הייחוס + הגודל שנמדד בעמ\' ט-יא)', () => {
    const s = getDefaultSettings();
    assertEq(s['page-num-font'], 'ליבורנה מודגש', 'גופן הגיליון = Livorna-Bold (לפני S75: ריק = גוף הטקסט)');
    assertEq(s['page-num-size-pt'], 11, 'גודל הגיליון 11pt (לפני S75: 10)');
  });

  it('המשפחה קיימת בקטלוג המוטמע ומקושרת לקובץ Livorna-Bold.ttf', () => {
    const fam = CATALOG.find(e => e.family === 'ליבורנה מודגש');
    assert(fam != null, 'המשפחה בקטלוג');
    assertEq(fam.file, 'Livorna-Bold.ttf', 'מקושרת לקובץ הנכון');
    assert(fs.existsSync(path.join(ASSETS, 'fonts', fam.file)), 'הקובץ קיים בספרייה');
  });

  it('page-num-font נטען עם גופני ההגדרות (FONT_SETTING_KEYS) והמקרנים קוראים אותו', () => {
    const shellSrc = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'ui', 'app-shell.js'), 'utf8');
    assert(shellSrc.includes("'page-num-font'"), 'page-num-font ברשימת טעינת הגופנים של המעטפת');
    const proj = fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'engine', 'output', 'legacy-projector.js'), 'utf8');
    assert(proj.includes("settings['page-num-font']"), 'הפרויקטור קורא את ההגדרה');
  });

  it('הגיליון מוקרן במשפחה ובגודל החדשים (fontKey=ליבורנה מודגש, 11pt)', () => {
    clearRegisteredFonts();
    const livorna = bytesOf('ליבורנה מודגש');
    assert(livorna != null, 'בתי הגופן זמינים');
    registerFont('ליבורנה מודגש', livorna);
    const settings = imudSettings();
    assertEq(settings['page-num-font'], 'ליבורנה מודגש', 'ההגדרות המיובאות נושאות את ברירת המחדל החדשה');
    const r = legacyTypeset(TWO_BIG_NOTES_DOC, settings, {});
    const proj = projectLegacyDocument(r, settings);
    const withFolio = proj.pages.find(p => p.folio && p.folio.text);
    assert(withFolio, 'יש עמוד עם גיליון');
    assertEq(withFolio.folio.fontKey, 'ליבורנה מודגש', 'גופן הגיליון — ליבורנה מודגש (ברירת המחדל החדשה)');
    assertEq(withFolio.folio.sizePt, 11, 'גודל הגיליון 11pt כמדידת הייחוס');
    clearRegisteredFonts();
  });
});

// =====================================================================
describe('S75 — נייטרליות נתיב DP (המנגנון החדש בנתיב המורשת בלבד)', () => {
  it('קנוני DP: ה-layoutHash לא השתנה (המנגנון אינו נוגע בנתיב DP)', () => {
    const corpus = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
    const r = typeset(corpus, getDefaultSettings(), { noRecommendations: true });
    assert(r.layoutHash.startsWith('80f9ed6c'), `hash קנוני DP נותר: ${r.layoutHash.slice(0, 16)}`);
  });
});

report('s75-notes-flow');
