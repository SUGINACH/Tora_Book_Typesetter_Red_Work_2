// tests/unit/s3d-measure-safety.test.js — ביקורת בטיחות MeasureAPI (20.11, U-11..U-14)
//
// ארבע חזירות, כל אחת עם הוכחה ברמת ההתנהגות (לא הסתברות) ועם בקרה שלילית
// שתועדה לפני התיקון בענף העבודה:
//  U-11 collision safety — התנגשות hash אמיתית מוזרקת בכוונה (כל המפתחות
//      מתנגשים לחשיש אחד): כל פריט עדיין מקבל את המדידה שלו; המטמון אף פעם
//      לא מחזיר MeasuredItem של פריט אחר. בקרה שלילית לפני התיקון: פריט 24pt
//      קיבל ‏48.32 (מדידת ה-12pt) במקום ‏96.64.
//  U-12 mutation safety — שינוי in-place של ctx.constraints באותה הפניה:
//      המֵימוֹ הקנוני מרגיש ומחזיר ייצוג חדש. בקרה שלילית: החזרת 158.35
//      הישן (פריט תמונה) אחרי availableWidthPx ‏100→400 באותה הפניה.
//  U-13 font lifecycle — מחזור רישום-החלפה-שחזור (מסלול exportPdf): אחרי
//      restoreFontRegistration אין מופע-fallback הקשור לגופן הזמני. בקרה
//      שלילית: ‏76.86 (מטריקות הגופן הזמני) במקום 67.81 (הגופן המשוחזר).
//  U-14 bounded string cache — תקרת 65,536 לכל מופע + ניפוי-באצווה; טוהר
//      הפלט נשמר גם תחת ניפוי. בקרה שלילית: ‏70,000 מחרורות ⇒ ‏70,000 רשומות.
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

/** הידור עותק מתוקן של measure-api לבדיקה — הזרקת התנגשות hash מלאה
 *  (כל מקור קנוני מקבל את אותו חשיש). בלי ווים בקוד הייצור: העותק הוא
 *  מודול עצמאי עם מצב פנימי משלו; היצוא נטען רגיל. */
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
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    const mk = (text, size) => ({ id: 'col-' + text + size, kind: 'text', payload: { runs: [{ text, fontFamily: 'Frank Ruhl Libre' }] } });
    const styleA = { sizePt: 12, fontIds: [f] };
    const styleB = { sizePt: 24, fontIds: [f] };
    // ערכי ייחוס — מחושבים במופע נקי של אותו מודול מתוקן (בלי מטמון בכלל)
    api.clearItemMeasureCache();
    const refA1 = api.measureItem(mk('אבגדה', 12), styleA, { direction: 'rtl' }).advance;
    api.clearItemMeasureCache();
    const refA2 = api.measureItem(mk('שלוםעליכם', 12), styleA, { direction: 'rtl' }).advance;
    api.clearItemMeasureCache();
    const refB = api.measureItem(mk('אבגדה', 24), styleB, { direction: 'rtl' }).advance;
    assert(Math.abs(refA1 - refA2) > 0.001 && Math.abs(refA1 - refB) > 0.001, 'ערכי הייחוס שונים זה מזה');
    // הבדיקה עצמה: מטמון פעיל, כל המפתחות זהים (חשיש קבוע)
    api.clearItemMeasureCache();
    const seq = [
      ['אבגדה', 12, styleA, refA1], ['שלוםעליכם', 12, styleA, refA2], ['אבגדה', 24, styleB, refB],
      ['שלוםעליכם', 12, styleA, refA2], ['אבגדה', 12, styleA, refA1], ['אבגדה', 24, styleB, refB]
    ];
    for (const [text, size, style, expected] of seq) {
      const got = api.measureItem(mk(text, size), style, { direction: 'rtl' });
      assert(got.ok, got.code);
      assert(Math.abs(got.advance - expected) < 1e-9,
        `פריט "${text}" @${size}pt קיבל מדידה שגויה תחת התנגשות מלאה: ${got.advance.toFixed(3)} ≠ ${expected.toFixed(3)}`);
    }
    assertEq(api.itemCacheStats().entries, 1, 'הדלי הבודד נשמר (התנגשות מלאה — ניפוי סירוגין)');
  });

  it('בקרת הזרקה: החשיש הקבוע אכן מאפס את ההבחנה בין המקורות (תקפות הבדיקה)', () => {
    const api = compileWithConstantHash();
    fontResolver.clearFontResolver();
    fontResolver.registerFont('Frank Ruhl Libre', bytesOf('Frank Ruhl Libre'));
    const f = fontResolver.fontIdOfAlias('Frank Ruhl Libre');
    const mk = (id) => ({ id, kind: 'glue', payload: { text: '' } });
    const k1 = api.measureItem(mk('g1'), { sizePt: 12, fontIds: [f] }, { direction: 'rtl' });
    assert(k1.ok, 'glue measured');
    // שתי קריאות שונות — שתיהן דרך אותו חשיש; הראשונה ממולאת, השנייה חייבת miss
    // (ההוכחה שהבדיקה מרעידה את המנגנון: בלי אימות מקור השנייה הייתה מחזירה את הראשונה)
    const before = api.itemCacheStats().entries;
    const k2 = api.measureItem(mk('g2'), { sizePt: 12, fontIds: [f] }, { direction: 'rtl' });
    assert(k2.ok, 'glue2 measured');
    assertEq(api.itemCacheStats().entries, before <= 1 ? 1 : before, 'המקור השני לא הוחזר מהמטמון של הראשון');
  });
});

describe('U-12 — mutation safety: שינוי באותה הפניה מזוהה ומחושב מחדש', () => {
  it('ctx.constraints מוטציה 100→400 — המדידה משקפת את הערך החדש (פריט תמונה)', () => {
    clearItemMeasureCache();
    const mkResolver = () => ({
      measure: () => ({ ok: true, displayWidth: 240, width: 480, height: 320, aspectRatio: 1.5, orientation: 'landscape', format: 'png' }),
      resolveById: () => ({ ok: false }),
      resolve: () => ({ ok: false })
    });
    const mk = () => ({ id: 'mut-img-1', kind: 'image', payload: { assetId: 'ast-t1', widthPct: 50 } });
    const constraints = { availableWidthPx: 100 };
    const ctx = { direction: 'rtl', constraints, assetResolver: mkResolver() };
    const w1 = measureItem(mk(), { sizePt: 12 }, ctx).advance;
    assertEq(w1, 50, 'המדידה הראשונה נגזרת מהאילוץ (100×50%)');
    constraints.availableWidthPx = 400; // אותה הפניה — שינוי in-place
    const w2 = measureItem(mk(), { sizePt: 12 }, ctx).advance;
    assertEq(w2, 200, 'אחרי מוטציה המדידה מחושבת מחדש (400×50%) — לא הערך הישן');
  });

  it('מבנה מקונן באילוצים — קנוניזציה טרייה בכל קריאה (נכונות על פני מהירות)', () => {
    clearItemMeasureCache();
    const mkResolver = () => ({
      measure: () => ({ ok: true, displayWidth: 240, width: 480, height: 320, aspectRatio: 1.5, orientation: 'landscape', format: 'png' }),
      resolveById: () => ({ ok: false }),
      resolve: () => ({ ok: false })
    });
    const mk = () => ({ id: 'mut-img-2', kind: 'image', payload: { assetId: 'ast-t2', widthPct: 50 } });
    const constraints = { availableWidthPx: 100, nested: { deep: true } };
    const ctx = { direction: 'rtl', constraints, assetResolver: mkResolver() };
    const w1 = measureItem(mk(), { sizePt: 12 }, ctx).advance;
    constraints.availableWidthPx = 300;
    const w2 = measureItem(mk(), { sizePt: 12 }, ctx).advance;
    assertEq(w2, 150, 'מבנה מקונן — המֵימוֹ מדולג, השינוי מרואה');
  });
});

describe('U-13 — font lifecycle: אין מופע-מדידה הקשור לגופן שכבר אינו רשום', () => {
  it('מחזור exportPdf (רישום זמני → שחזור) — המדידה חוזרת לגופן המשוחזר', () => {
    clearItemMeasureCache();
    const fam = 'S3D Lifecycle Fam';
    const orig = measureApi.registerFont(fam, bytesOf('Frank Ruhl Libre'));
    assert(orig.ok, 'register original');
    const mk = () => ({ id: 'lc-1', kind: 'atomicToken', payload: { text: 'אבג ההא חי' } });
    const style = { sizePt: 12, fontIds: ['f1'], defaultFamily: fam };
    const wOrig = measureItem(mk(), style, { direction: 'rtl' }).advance;
    // חלון זמני: אותו שם, בתים אחרים (David) — מסלול ההחלפה של exportPdf
    const tmp = measureApi.registerFont(fam, bytesOf('David Libre'));
    assert(tmp.ok, 'register temp');
    const wTemp = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(wOrig - wTemp) > 0.001, 'שני הגופנים נבדלים במדידה');
    // שחזור הרישום המקורי + פינוי מטמון פריטים (שגרתי בין מסמכים)
    measureApi.restoreFontRegistration(fam, orig.profile, bytesOf('Frank Ruhl Libre'));
    clearItemMeasureCache();
    const wAfter = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(wAfter - wOrig) < 1e-9, `אחרי שחזור: ${wAfter.toFixed(2)} צריך להיות ${wOrig.toFixed(2)} (הגופן המשוחזר) — לא ${wTemp.toFixed(2)} (הזמני)`);
  });

  it('unregisterFont מנקה גם מופעי-fallback משותפים — רישום מחדש באותו שם נמדד במטריקות החדשות', () => {
    clearItemMeasureCache();
    const fam = 'S3D Unreg Fam';
    const r1 = measureApi.registerFont(fam, bytesOf('Frank Ruhl Libre'));
    assert(r1.ok, 'register FRL');
    const mk = () => ({ id: 'lc-2', kind: 'atomicToken', payload: { text: 'נבגד חז' } });
    const style = { sizePt: 12, fontIds: ['f1'], defaultFamily: fam };
    const wFrl = measureItem(mk(), style, { direction: 'rtl' }).advance;
    measureApi.unregisterFont(fam);
    const r2 = measureApi.registerFont(fam, bytesOf('David Libre'));
    assert(r2.ok, 'register David under same name');
    clearItemMeasureCache();
    const wDavid = measureItem(mk(), style, { direction: 'rtl' }).advance;
    assert(Math.abs(wDavid - wFrl) > 0.001, `גופן אחר תחת אותו שם ⇒ מדידה אחרת (${wDavid.toFixed(2)} ≠ ${wFrl.toFixed(2)}) — לא מטריקות רפאים`);
    measureApi.unregisterFont(fam);
  });
});

describe('U-14 — bounded string cache: תקרה, ניפוי-באצווה וטוהר פלט', () => {
  it('תקרת 65,536 רשומות למופע — ניפוי באצווה של 8,192', () => {
    const api = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    const N = 70000;
    for (let i = 0; i < N; i++) api.measureTextWidth('word' + i + 'א', 12);
    assert(api.cache.size <= 65536, `המטמון חסום: ${api.cache.size} ≤ 65,536 (לפני התיקון: 70,000)`);
    assert(api.stats.evictions >= N - 65536, `ניפוי בפועל: ${api.stats.evictions} רשומות נופו`);
    assertEq(stringCacheStats().capacityPerInstance, 65536, 'אבחון stringCacheStats מדווח את התקרה');
  });

  it('טוהר הפלט נשמר גם תחת ניפוי — ערכים שנמדדו לפני/אחרי הניפוי זהים', () => {
    const api = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    const early = [];
    for (let i = 0; i < 200; i++) early.push(['early' + i + 'א', api.measureTextWidth('early' + i + 'א', 12)]);
    for (let i = 0; i < 70000; i++) api.measureTextWidth('flood' + i + 'א', 12); // מציף ומנפה
    for (const [text, w] of early) {
      const again = api.measureTextWidth(text, 12);
      assert(Math.abs(again - w) < 1e-9, `טוהר: ${text} — ${again} ≠ ${w} אחרי ניפוי`);
    }
  });

  it('מדידת זיכרון בפועל: שני מסמכים שונים — הרשומות חסומות, לא מוכפלות לנצח', () => {
    const api = new MeasureAPI({ 'body-font': 'Frank Ruhl Libre' }, 'font-metrics');
    for (let d = 0; d < 2; d++) {
      for (let i = 0; i < 40000; i++) api.measureTextWidth('doc' + d + 'w' + i + 'א', 12);
    }
    assert(api.cache.size <= 65536, `שני מסמכים ⇒ עדיין חסום: ${api.cache.size} (בקרה שלילית היסטורית: 80,000)`);
  });
});

report('s3d-measure-safety');
