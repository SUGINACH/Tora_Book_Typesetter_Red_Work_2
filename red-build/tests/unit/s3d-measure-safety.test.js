// tests/unit/s3d-measure-safety.test.js — ביקורת בטיחות MeasureAPI (19.11, U-11..U-14)
//
// ארבע חזיתות, כל אחת עם הוכחה ברמת ההתנהגות (לא הסתברות):
//  U-11 collision safety — התנגשות hash אמיתית מוזרקת בכוונה (כל המפתחות
//      מתנגשים לחשיש אחד): כל פריט עדיין מקבל את המדידה שלו; המטמון אף פעם
//      לא מחזיר MeasuredItem של פריט אחר (הגנת PR #22 — דטרמיניסטית).
//  U-12 mutation safety — שינוי in-place של ctx.constraints באותה הפניה:
//      המֵימוֹ הקנוני חייב להרגיש ולהחזיר ייצוג חדש (לא את הקודם).
//  U-13 font lifecycle — מחזור רישום-החלפה-שחזור (מסלול exportPdf): אחרי
//      restoreFontRegistration אין מופע-fallback הקשור לגופן הזמני.
//  U-14 bounded string cache — תקרת 65,536 לכל מופע; טוהר הפלט נשמר גם תחת ניפוי.
'use strict';
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { describe, it, assert, assertEq, report } = require('../harness');

const measureApi = require('../../src/engine/typography/measure-api');
const { MeasureAPI, measureItem, clearItemMeasureCache, itemCacheStats, stringCacheStats } = measureApi;
const fontResolver = require('../../src/engine/typography/font-resolver');

const REPO = path.join(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const bytesOf = (fam) => { const e = CATALOG.find(x => x.family === fam); return fs.readFileSync(path.join(ASSETS, 'fonts', e.file)); };

function registerRealFonts() {
  fontResolver.clearFontResolver();
  fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
  fontResolver.registerFont('David Libre', bytesOf('David Libre'));
}

/** הידור עותק מתוקן של measure-api לבדיקה — הזרקת התנגשות hash מלאה
 *  (כל מקור קנוני מקבל את אותו חשיש). בלי ווים בקוד הייצור: העותק הוא
 *  מודול עצמאי עם מצב פנימי משלו; היצור נטען רגיל. */
function compileWithConstantHash() {
  const file = path.join(REPO, 'src/engine/typography/measure-api.js');
  const src = fs.readFileSync(file, 'utf8');
  const patched = src.replace(
    'function _fastKeyHash(s) {',
    'function _fastKeyHash(s) { return "c0ffee00" + "c0ffee00" + "c0ffee00" + "00000010";'
  );
  if (patched === src) throw new Error('s3d: לא נמצא יעד ההזרקה ב-_fastKeyHash');
  const m = new Module(file, null);
  m.filename = file;
  m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(patched, file);
  return m.exports;
}

describe('U-11 — collision safety: התנגשות hash מוזרקת בכוונה לא מחזירה מדידה זרה', () => {
  it('כל המפתחות מתנגשים לחשיש אחד — כל פריט עדיין מקבל את המדידה הנכונה שלו', () => {
    const api = compileWithConstantHash();
    api.clearItemMeasureCache();
    registerRealFonts();
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    const mk = (text, size) => ({ id: 'col-' + text, kind: 'text', payload: { runs: [{ text, fontFamily: 'Frank Ruhl Libre' }] } });
    const styleA = { sizePt: 12, fontIds: [f] };
    const styleB = { sizePt: 24, fontIds: [f] };
    // ערכי ייחוס — מחושבים במופע נקי של אותו מודול מתוקן (בלי מטמון בכלל)
    api.clearItemMeasureCache();
    const refA1 = api.measureItem(mk('אבגדה'), styleA, { direction: 'rtl' }).advance;
    api.clearItemMeasureCache();
    const refA2 = api.measureItem(mk('שלוםעליכם'), styleA, { direction: 'rtl' }).advance;
    api.clearItemMeasureCache();
    const refB = api.measureItem(mk('אבגדה'), styleB, { direction: 'rtl' }).advance;
    assert(Math.abs(refA1 - refA2) > 0.001 && Math.abs(refA1 - refB) > 0.001, 'ערכי הייחוס שונים זה מזה');
    // עכשיו הבדיקה עצמה: מטמון פעיל, כל המפתחות זהים (חשיש קבוע)
    api.clearItemMeasureCache();
    const seq = [
      ['אבגדה', styleA, refA1], ['שלוםעליכם', styleA, refA2], ['אבגדה', styleB, refB],
      ['שלוםעליכם', styleA, refA2], ['אבגדה', styleA, refA1], ['אבגדה', styleB, refB]
    ];
    for (const [text, style, expected] of seq) {
      const got = api.measureItem(mk(text), style, { direction: 'rtl' });
      assert(got.ok, got.code);
      assert(Math.abs(got.advance - expected) < 1e-9,
        `פריט "${text}" @${style.sizePt}pt קיבל מדידה שגויה תחת התנגשות מלאה: ${got.advance.toFixed(3)} ≠ ${expected.toFixed(3)}`);
    }
    // הדלי הבודד נמצא בניפוי-סירוגין (thrash) — אך תמיד נכון
    assertEq(api.itemCacheStats().entries, 1, 'דלי אחד משותף לכולם (התנגשות מלאה)');
  });
  it('פריטים שונים עם hash אמיתי — hit מלא בלי מיסים (ההזרקה לא פוגעת במסלול הרגיל)', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    const style = { sizePt: 12, fontIds: [f] };
    const a = measureItem({ id: 'n1', kind: 'text', payload: { runs: [{ text: 'מילהראשונה', fontFamily: 'Frank Ruhl Libre' }] } }, style, { direction: 'rtl' });
    const b = measureItem({ id: 'n2', kind: 'text', payload: { runs: [{ text: 'מילהשניה', fontFamily: 'Frank Ruhl Libre' }] } }, style, { direction: 'rtl' });
    const a2 = measureItem({ id: 'n1', kind: 'text', payload: { runs: [{ text: 'מילהראשונה', fontFamily: 'Frank Ruhl Libre' }] } }, style, { direction: 'rtl' });
    assert(a !== b, 'פריטים שונים — מדידות שונות');
    assert(a2 === a, 'חזרה על אותו קלט ⇒ hit (אותו אובייקט קפוא) — מבנה המפתח החדש לא שובר הקאות');
  });
  it("מפריד NUL חד-משמעי: '~' בתוך תוכן אינו יוצר מקור-זהה מרכיבים שונים", () => {
    registerRealFonts();
    clearItemMeasureCache();
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    const style = { sizePt: 12, fontIds: [f] };
    const a = measureItem({ id: 'x', kind: 'text', payload: { runs: [{ text: 'א~ב', fontFamily: 'Frank Ruhl Libre' }] } }, style, { direction: 'rtl' });
    const b = measureItem({ id: 'x~א', kind: 'text', payload: { runs: [{ text: 'ב', fontFamily: 'Frank Ruhl Libre' }] } }, style, { direction: 'rtl' });
    assert(a !== b, 'מזהים שונים ⇒ מפתחות שונים גם כשהטקסט מכיל את המפריד ההיסטורי');
  });
});

describe('U-12 — mutation safety: מֵימוֹ קנוני מודע-מוטציה ל-ctx.constraints', () => {
  it('שינוי availableWidthPx באותו אובייקט ⇒ מפתח חדש ומדידה מעודכנת (לא הייצוג הקודם)', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const ar = { measure: () => ({ ok: true, width: 100, height: 50, aspectRatio: 2, displayWidth: 100, orientation: 'landscape', format: 'png' }) };
    const item = { id: 'mut-img', kind: 'image', payload: { assetId: 'ast-1', widthPct: 50 } };
    const ctx = { direction: 'rtl', assetResolver: ar, constraints: { availableWidthPx: 200 } };
    const w1 = measureItem(item, { sizePt: 12 }, ctx).advance;
    assertEq(Math.round(w1), 100, '50% מ-200');
    // המוטציה האסורה-לשעבר: אותה הפניה, ערך חדש
    ctx.constraints.availableWidthPx = 400;
    const w2 = measureItem(item, { sizePt: 12 }, ctx).advance;
    assertEq(Math.round(w2), 200, '50% מ-400 — המדידה מרגישה את השינוי באותה הפניה');
    assert(w2 > w1, 'המֵימוֹ לא החזיר את הייצוג הקודם');
  });
  it('הוספת מפתח חדש ל-constraints ⇒ מפתח חדש (תצלום השטח מזהה שינוי סכמה)', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const ar = { measure: () => ({ ok: true, width: 100, height: 50, aspectRatio: 2, displayWidth: 100, orientation: 'l', format: 'png' }) };
    const item = { id: 'mut-img2', kind: 'image', payload: { assetId: 'ast-2', widthPct: 100 } };
    const ctx = { direction: 'rtl', assetResolver: ar, constraints: { availableWidthPx: 200 } };
    const w1 = measureItem(item, { sizePt: 12 }, ctx).advance;
    ctx.constraints.imageAlign = 'center'; // מפתח חדש — לא היה בתצלום
    const w2 = measureItem(item, { sizePt: 12 }, ctx).advance;
    assertEq(w1, w2, 'הערך זהה (imageAlign לא משפיע על רוחב) — אבל המפתח חושב מחדש');
    ctx.constraints.availableWidthPx = 300;
    const w3 = measureItem(item, { sizePt: 12 }, ctx).advance;
    assertEq(Math.round(w3), 300, 'אחרי שינוי סכמה+ערך — עדיין מודע-מוטציה');
  });
  it('constraints עם ערך-עצם (מקונן) — בלי מֵימוֹ: מדידה חוזרת תמיד מהמצב החי', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const ar = { measure: () => ({ ok: true, width: 100, height: 50, aspectRatio: 2, displayWidth: 100, orientation: 'l', format: 'png' }) };
    const item = { id: 'mut-img3', kind: 'image', payload: { assetId: 'ast-3', widthPct: 100 } };
    const ctx = { direction: 'rtl', assetResolver: ar, constraints: { availableWidthPx: 200, meta: { col: 1 } } };
    const w1 = measureItem(item, { sizePt: 12 }, ctx).advance;
    ctx.constraints.meta.col = 2; // מוטציה פנימית בערך-עצם
    ctx.constraints.availableWidthPx = 500; // וגם ערך שטוח
    const w2 = measureItem(item, { sizePt: 12 }, ctx).advance;
    assertEq(Math.round(w2), 500, 'מבנה מקונן ⇒ קנוניזציה טרייה — תמיד המצב הנוכחי');
    assert(w2 > w1, 'לא הייצוג הקודם');
  });
  it('אותו constraints בלי שינוי — עדיין hit (המֵימוֹ משמר ביצועים כשהקלט יציב)', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const ar = { measure: () => ({ ok: true, width: 100, height: 50, aspectRatio: 2, displayWidth: 100, orientation: 'l', format: 'png' }) };
    const item = { id: 'mut-img4', kind: 'image', payload: { assetId: 'ast-4', widthPct: 100 } };
    const ctx = { direction: 'rtl', assetResolver: ar, constraints: { availableWidthPx: 200 } };
    const a = measureItem(item, { sizePt: 12 }, ctx);
    const b = measureItem(item, { sizePt: 12 }, ctx);
    assert(a === b, 'קלט יציב ⇒ אותה רשומת מטמון (אותו אובייקט)');
  });
});

describe('U-13 — font lifecycle: אין מופע-fallback הקשור לגופן מת/זמני', () => {
  it('מחזור exportPdf (רישום זמני → שחזור): המדידה חוזרת לגופן המקורי במדויק', () => {
    fontResolver.clearFontResolver();
    measureApi.clearRegisteredFonts();
    const regA = measureApi.registerFont('SwapFont', bytesOf('Frank Ruhl Libre'));
    assert(regA.ok, 'regA');
    clearItemMeasureCache();
    const style = { sizePt: 12, fontIds: ['fnt-swap'], defaultFamily: 'SwapFont' };
    const mk = () => ({ id: 'atom-swap', kind: 'atomicToken', payload: { text: 'אבגהו זחטיכ' } });
    const wA = measureItem(mk(), style, { direction: 'rtl' }).advance;
    // שלב ההחלפה הזמנית (כמו exportPdf): אותו שם, בתים אחרים
    const regB = measureApi.registerFont('SwapFont', bytesOf('David Libre'));
    assert(regB.ok, 'regB');
    const wB = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(wA - wB) > 0.001, `שני הגופנים נותנים רוחב שונה (${wA.toFixed(2)} מול ${wB.toFixed(2)})`);
    // השחזור — הרגע שבו הפגם היה מחזיר מדידה בגופן הזמני.
    // **פינוי מטמון הפריטים לפני המדידה** — מדמה את המצב הריאליסטי בספרים גדולים
    // (617 אלף הכנסות מול תקרת 65,536 — מיסים שגרתיים): בלי זה, מפתח החית-סביבה של
    // מטמון הפריטים מיסך את המופע הדביק והפגם לא היה מתגלה.
    measureApi.restoreFontRegistration('SwapFont', regA.profile, bytesOf('Frank Ruhl Libre'));
    clearItemMeasureCache();
    const wRestored = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(wRestored - wA) < 1e-9, `אחרי שחזור: ${wRestored.toFixed(3)} חייב להיות ${wA.toFixed(3)} — לא הגופן הזמני (${wB.toFixed(3)})`);
  });
  it('unregisterFont מנקה גם מופעי-fallback משותפים (אין מדידת-רפאים)', () => {
    fontResolver.clearFontResolver();
    measureApi.clearRegisteredFonts();
    measureApi.registerFont('GhostFont', bytesOf('Frank Ruhl Libre'));
    const style = { sizePt: 12, fontIds: ['fnt-ghost'], defaultFamily: 'GhostFont' };
    const mk = () => ({ id: 'atom-ghost', kind: 'atomicToken', payload: { text: 'עוד מילה למדידה' } });
    clearItemMeasureCache();
    const w1 = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assertEq(stringCacheStats().fallbackInstances > 0, true, 'נוצר מופע-fallback במדידה');
    measureApi.unregisterFont('GhostFont');
    assertEq(stringCacheStats().fallbackInstances, 0, 'unregister ניקה את כל מופעי ה-fallback');
    measureApi.registerFont('GhostFont', bytesOf('David Libre'));
    const w2 = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(w2 - w1) > 0.001, 'רישום מחדש עם בתים אחרים ⇒ מדידה חדשה (לא המופע הקודם)');
  });
  it('שני כינויים לאותה זהות — הסרת אחד אינה הורסת את השני (נעילת סנכרון קיימת)', () => {
    fontResolver.clearFontResolver();
    measureApi.clearRegisteredFonts();
    const fid = fontResolver.registerFont('AliasA', bytesOf('Frank Ruhl Libre')).fontId;
    fontResolver.registerFont('AliasB', bytesOf('Frank Ruhl Libre'));
    fontResolver.unregisterAlias('AliasA');
    assert(fontResolver.resolveFont('AliasB').ok, 'AliasB חי');
    assertEq(fontResolver.fontIdOfAlias('AliasB'), fid, 'הזהות נשמרה');
  });
});

describe('U-14 — bounded string cache: תקרה לכל מופע; טוהר תחת ניפוי', () => {
  it('מילוי מעבר לתקרה ⇒ ניפוי באצווה, הגודל חסום, הערכים נכונים', () => {
    const api = new MeasureAPI({ 'body-font-size-pt': 12 }, 'table');
    const N = 65536 + 9000; // בדי�וק מעבר לתקרה + יותר מאצוות ניפוי אחת
    for (let i = 0; i < N; i++) api.measureTextWidth('מחרוזת' + i + 'אבגדהוז', 12, 0);
    assert(api.cache.size <= 65536, `המטמון חסום: ${api.cache.size} ≤ 65536`);
    assert(api.stats.evictions >= 8192, `ניפוי בפועל: ${api.stats.evictions}`);
    // ערך שנופה — מחושב מחדש זהה (טוהר)
    const probe = 'מחרוזת5אבגדהוז';
    const again = api.measureTextWidth(probe, 12, 0);
    const fresh = new MeasureAPI({ 'body-font-size-pt': 12 }, 'table').measureTextWidth(probe, 12, 0);
    assert(Math.abs(again - fresh) < 1e-12, 'ערך שנופה מחושב מחדש ביט-לביט');
  });
  it('סטטיסטיקת האבחון זמינה למדידת הצטברות לאורך מסמכים (stringCacheStats)', () => {
    registerRealFonts();
    clearItemMeasureCache();
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    measureItem({ id: 'sc-1', kind: 'text', payload: { runs: [{ text: 'טקסט לספירת מטמון', fontFamily: 'Frank Ruhl Libre' }] } }, { sizePt: 12, fontIds: [f] }, { direction: 'rtl' });
    const sc = stringCacheStats();
    assert(sc.familyInstances > 0 || sc.fallbackInstances > 0, 'יש מופעים חיים');
    assert(sc.totalEntries > 0, 'הרשומות נספרות');
    assert(Array.isArray(sc.instances) && sc.instances.every(x => Number.isFinite(x.entries)), 'מבנה תקין');
  });
});

report('s3d-measure-safety');
