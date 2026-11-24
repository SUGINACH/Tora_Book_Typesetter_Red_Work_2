// tests/unit/s3-font-sync.test.js — שלב 3, תיקון ביקורת PR #22:
// רישום גופנים דרך מקור סמכות יחיד + סנכרון ניקוי דו-כיווני בין Font Resolver
// לבין מרשמי measure-api. הפגם: clearFontResolver ניקה את מפותיו אך השאיר רישומים
// ישנים ב-measure-api (ולהפך) ⇒ מצב של "לא רשום" שממשיך למדוד.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const measureApi = require('../../src/engine/typography/measure-api');
const { MeasureAPI, registeredFonts, resolveMeasureImpl } = measureApi;
const fontResolver = require('../../src/engine/typography/font-resolver');

const REPO = path.join(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const bytesOf = (fam) => { const e = CATALOG.find(x => x.family === fam); return fs.readFileSync(path.join(ASSETS, 'fonts', e.file)); };

/** הפרש בין שני המרשמים: מחזיר רשימת משפחות שרשומות באחד ולא בשני. */
function registryDrift() {
  const ma = Array.from(registeredFonts.keys()).sort();
  const fr = Array.from(fontResolver.aliasCount ? _aliasesOf() : []);
  const drift = [];
  for (const f of ma) if (!fr.includes(f)) drift.push(`measure-api-only:${f}`);
  for (const f of fr) if (!ma.includes(f)) drift.push(`resolver-only:${f}`);
  return drift;
}
function _aliasesOf() {
  const out = [];
  // אין מנגנון רשמי לרשימת כינויים — בדיקה דרך resolveFont לכל משפחה ידועה
  for (const fam of ['Frank Ruhl Libre', 'David Libre', 'AliasA', 'AliasB', 'TempFont', 'X']) {
    const r = fontResolver.resolveFont(fam);
    if (r.ok && !r.fallbackUsed) out.push(fam);
  }
  return out;
}

describe('שלב 3 — רישום גופנים: מקור סמכות יחיד וזהות זהה בצדדים', () => {
  it('רישום קנוני דרך ה-resolver מסונכרן ל-measure-api (אותו פרנסר, אותה התנהגות)', () => {
    fontResolver.clearFontResolver();
    const reg = fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    assert(reg.ok, reg.message);
    assert(/^[0-9a-f]{64}$/.test(reg.record.sourceHash), 'הרשומה שומרת SHA-256 מלא של בתי הגופן');
    assertEq(reg.record.sourceHash.slice(0, 14), reg.fontId.slice(4), 'fontId נגזר מתחילת ה-SHA-256 המלא');
    assert(registeredFonts.has('Frank Ruhl Libre'), 'נרשם גם במרשמי measure-api');
    assertEq(resolveMeasureImpl({ 'body-font': 'Frank Ruhl Libre' }), 'font-metrics', 'EXT-13: גופן רשום ⇒ font-metrics');
    // אותה זהות תוכן בשני הצדדים
    const api = MeasureAPI.forFamily('Frank Ruhl Libre', { 'body-font-size-pt': 12 });
    assert(api && api.impl === 'font-metrics', 'forFamily עובד על הרישום המסונכרן');
    const byId = MeasureAPI.forFontId(reg.fontId, { 'body-font-size-pt': 12 });
    assert(byId, 'forFontId על אותה זהות');
    assert(Math.abs(api.measureTextWidth('שלום', 12, 0) - byId.measureTextWidth('שלום', 12, 0)) < 1e-9, 'אותה מדידה משני הכניסות');
  });
  it('fontId זהה בשני הצדדים: הזהות מהבתים — דטרמיניסטית בין רישומים חוזרים', () => {
    fontResolver.clearFontResolver();
    const a = fontResolver.registerFont('AliasA', bytesOf('Frank Ruhl Libre')).fontId;
    fontResolver.clearFontResolver();
    const b = fontResolver.registerFont('AliasA', bytesOf('Frank Ruhl Libre')).fontId;
    assertEq(a, b, 'אותם בתים ⇒ אותה זהות גם אחרי ניקוי מלא');
    const c = fontResolver.registerFont('AliasB', bytesOf('Frank Ruhl Libre')).fontId;
    assertEq(a, c, 'אותם בתים תחת כינוי אחר ⇒ אותה זהות תוכן');
    assertEq(fontResolver.fontCount(), 1, 'רשומת גופן אחת — שני כינויים');
    assertEq(fontResolver.aliasCount(), 2, 'שני כינויים רשומים');
  });
  it('רישום מחדש אחרי respawn/ניקוי משחזר את אותה זהות ואת אותה מדידה', () => {
    fontResolver.clearFontResolver();
    const r1 = fontResolver.registerFont('TempFont', bytesOf('David Libre'));
    const api1 = MeasureAPI.forFontId(r1.fontId, { 'body-font-size-pt': 12 });
    const w1 = api1.measureTextWidth('עליכם', 12, 0);
    fontResolver.clearFontResolver();
    assert(!MeasureAPI.forFamily('TempFont', { 'body-font-size-pt': 12 }), 'אחרי ניקוי — אין API למשפחה');
    const r2 = fontResolver.registerFont('TempFont', bytesOf('David Libre'));
    assertEq(r1.fontId, r2.fontId, 'אותה זהות אחרי רישום מחדש');
    const api2 = MeasureAPI.forFontId(r2.fontId, { 'body-font-size-pt': 12 });
    assertEq(api2.measureTextWidth('עליכם', 12, 0), w1, 'אותה מדידה בדיוק');
  });
});

describe('שלב 3 — סנכרון פעולות ניקוי: אין מצב "לא רשום" שממשיך למדוד', () => {
  it('clearFontResolver מנקה גם את מרשמי measure-api (הכיוון החסר)', () => {
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    assert(registeredFonts.has('Frank Ruhl Libre'), 'רשום בשני הצדדים');
    fontResolver.clearFontResolver();
    assert(!registeredFonts.has('Frank Ruhl Libre'), 'המרשם של measure-api התרוקן');
    assert(!MeasureAPI.forFamily('Frank Ruhl Libre', { 'body-font-size-pt': 12 }), 'forFamily — null אחרי ניקוי');
    assertEq(resolveMeasureImpl({ 'body-font': 'Frank Ruhl Libre' }), 'table', 'נפילה שקופה לטבלה');
    assertEq(registryDrift().length, 0, 'אין סטייה בין המרשמים: ' + registryDrift().join(','));
  });
  it('clearRegisteredFonts מנקה גם את ה-resolver (הכיוון ההפוך)', () => {
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    assert(fontResolver.resolveFont('Frank Ruhl Libre').ok, 'רשום ב-resolver');
    measureApi.clearRegisteredFonts();
    assert(!fontResolver.resolveFont('Frank Ruhl Libre').ok, 'ה-resolver התרוקן');
    assert(!registeredFonts.has('Frank Ruhl Libre'), 'measure-api התרוקן');
    assertEq(registryDrift().length, 0, 'אין סטייה בין המרשמים');
  });
  it('unregister מסיר משני הצדדים — ולא משאיר מדידה רפאים', () => {
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    measureApi.unregisterFont('Frank Ruhl Libre');
    assert(!registeredFonts.has('Frank Ruhl Libre'), 'הוסר מ-measure-api');
    assert(!fontResolver.resolveFont('Frank Ruhl Libre').ok, 'הוסר מה-resolver');
    assertEq(resolveMeasureImpl({ 'body-font': 'Frank Ruhl Libre' }), 'table', 'אין מדידת-רפאים');
    // הכיוון ההפוך: unregisterAlias מסיר גם מ-measure-api
    fontResolver.registerFont('X', bytesOf('David Libre'));
    assert(registeredFonts.has('X'), 'נרשם בשני הצדדים');
    fontResolver.unregisterAlias('X');
    assert(!registeredFonts.has('X'), 'unregisterAlias הסיר גם מ-measure-api');
  });
  it('אותה זהות תוכן תחת כמה כינויים — חוקי; הסרת כינוי אחד אינה הורסת את השני', () => {
    fontResolver.clearFontResolver();
    const fid = fontResolver.registerFont('AliasA', bytesOf('Frank Ruhl Libre')).fontId;
    fontResolver.registerFont('AliasB', bytesOf('Frank Ruhl Libre'));
    assertEq(fontResolver.fontCount(), 1, 'רשומה אחת — שני כינויים');
    assertEq(fontResolver.fontIdOfAlias('AliasA'), fid);
    assertEq(fontResolver.fontIdOfAlias('AliasB'), fid);
    fontResolver.unregisterAlias('AliasA');
    assert(!fontResolver.resolveFont('AliasA').ok, 'AliasA הוסר');
    assert(fontResolver.resolveFont('AliasB').ok, 'AliasB חי');
    assertEq(fontResolver.fontIdOfAlias('AliasB'), fid, 'הזהות נשמרה');
    assert(!registeredFonts.has('AliasA') && registeredFonts.has('AliasB'), 'measure-api משקף את אותו מצב');
  });
  it('כינוי שכבר קיים עם בתים שונים — דחייה מפורשת, לא החלפה שקטה', () => {
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Dup', bytesOf('Frank Ruhl Libre'));
    const conflict = fontResolver.registerFont('Dup', bytesOf('David Libre'));
    assert(!conflict.ok && conflict.code === 'alias-conflict', `דחייה מפורשת: ${conflict.code}`);
    assertEq(fontResolver.fontIdOfAlias('Dup'), fontResolver.registerFont('Dup', bytesOf('Frank Ruhl Libre')).fontId, 'הרישום המקורי לא הוחלף');
  });
  it('fallback חסר מופיע באבחון — לא החלפת משפחה בשקט', () => {
    fontResolver.clearFontResolver();
    const none = fontResolver.resolveFont('NopeFamily');
    assert(!none.ok && none.code === 'font-unavailable', 'דחייה מפורשת');
    assert(none.diagnostics.some(d => d.code === 'font-not-registered'), 'מתועד באבחון');
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    const fb = fontResolver.resolveFont('NopeFamily', { fallbacks: ['Frank Ruhl Libre'] });
    assert(fb.ok && fb.fallbackUsed, 'fallback נבחר');
    assert(fb.diagnostics.some(d => d.code === 'font-not-registered' && d.alias === 'NopeFamily'), 'הדילוג מתועד');
    // measureItem מרים את ה-fallback לאבחון הפריט (font-fallback)
    measureApi.clearItemMeasureCache();
    const { measureItem } = measureApi;
    const m = measureItem(
      { id: 'fb-itm', kind: 'text', payload: { runs: [{ text: 'טקסט', fontFamily: 'NopeFamily' }] } },
      { sizePt: 12, defaultFamily: 'Frank Ruhl Libre' },
      { direction: 'rtl' }
    );
    assert(m.ok, m.code);
    assert(m.diagnostics.some(d => d.code === 'font-fallback'), 'פריט מאובחן: ' + JSON.stringify(m.diagnostics));
  });
  it('שרשרת רישום מלאה ואז ניקוי כפול — אין נצנוץ ואין ערפל בין המרשמים', () => {
    fontResolver.clearFontResolver();
    measureApi.clearRegisteredFonts(); // ניקוי כפול משני הכיוונים — חייב להסתיים במרשמים ריקים
    fontResolver.clearFontResolver();
    assertEq(registeredFonts.size, 0);
    assertEq(fontResolver.fontCount(), 0);
    const reg = fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    measureApi.clearRegisteredFonts();
    assert(!registeredFonts.has('Frank Ruhl Libre') && !fontResolver.resolveFont('Frank Ruhl Libre').ok, 'נקי משני הצדדים');
    void reg;
  });
});

report('s3-font-sync');
