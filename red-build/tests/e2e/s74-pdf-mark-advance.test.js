// tests/e2e/s74-pdf-mark-advance.test.js — **S74: רגרסיית פגם הקרנת ניקוד משולב ב-PDF**
// פרוסה 1, גרסה 2 (25.11) — התאמה מדויקת לפגם החי המתועד; בדיקת נפל לפי חוזה §1.2.
//
// מקור: audits/PHASE1_DOM_HTML_PDF_GLYPH_PARITY_2026-11-25.md §6-§7. הפגם החי:
// מילת-חלון שְׁמַע (FrankReal, 18pt) — המודל/HTML מציבים בסיסים בלבד (28.79pt);
// ה-PDF בונה את המילה תו-תו עם hmtx גולמי ומוסיף 15.76pt של ניקודים (44.57pt).
// התיקון הנדרש ארכיטקטוני (ShapedRun→PageModel→מקרינים); השער נכשל עד אז.
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertClose, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportPdfFromModel } = require('../../src/engine/output/export-api');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const REPO = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui/assets/imud');
const FONT_DIR = path.join(ASSETS, 'fonts');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));

// קבועים מאומתים (פורנזי §2 + Phase-2 probe) — לא נחושים:
const FRANKREAL_UPM = 2048;
const FRANKREAL_HMTX = { 'ש': 1261, 'ׁ': 1247, 'ְ': 147, 'מ': 1042, 'ַ': 399, 'ע': 972 };
const BASE_UNITS = FRANKREAL_HMTX['ש'] + FRANKREAL_HMTX['מ'] + FRANKREAL_HMTX['ע']; // 3275
const MARK_UNITS = FRANKREAL_HMTX['ׁ'] + FRANKREAL_HMTX['ְ'] + FRANKREAL_HMTX['ַ']; // 1793
const WORD = 'שְׁמַע';
const MARKS = ['ׁ', 'ְ', 'ַ'];

function frankRealBytes() {
  const e = CATALOG.find(x => x.family === 'FrankReal');
  assert(e, 'FrankReal בקטלוג');
  return fs.readFileSync(path.join(FONT_DIR, e.file));
}

let _pdftotext = null;
function pdftotextAvailable() {
  if (_pdftotext !== null) return _pdftotext;
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); _pdftotext = true; }
  catch (e) { _pdftotext = false; }
  return _pdftotext;
}

function isSheamWord(t) {
  const s = String(t);
  return s.includes('ש') && s.includes('ע') && s.includes('מ') && MARKS.some(m => s.includes(m));
}

function pdfWordsOnPage(pdfPath, pageNo) {
  const xml = execFileSync('pdftotext', ['-bbox', '-f', String(pageNo), '-l', String(pageNo), pdfPath, '-'], { encoding: 'utf8' });
  return [...xml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
    .map(m => ({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], text: m[5] }));
}

function setup() {
  clearRegisteredFonts();
  for (const f of ['Frank Ruhl Libre', 'David Libre', 'Hadassah Friedlaender', 'FrankReal']) {
    const e = CATALOG.find(x => x.family === f);
    if (e) registerFont(f, fs.readFileSync(path.join(FONT_DIR, e.file)));
  }
  return getDefaultSettings();
}

function buildDoc() {
  const para = `${WORD} ישראל אליך בכל אשר תעשה ובכל אשר תבקש והיה ביום ההוא נאם ה׳ אשר אקבץ את שבוייך מכל הארץ אשר הפצתיך שמה והשבתיך אל המקום אשר בחרתי לשכן שמי בו ואתה תדע כי לבבי עמך להציל אותך ולקבצך מכל קצוות הארץ ולהשיבך אל ביתך אשר יצאת משם ואל מקומך אשר נטשת שמה ואת בניך אקבץ מכל הגויים אשר הפצתים שמה ואשיבם אל ארצם אשר נתתי לאבותיהם וירשוה ואני אהיה להם לאלוהים והם יהיו לי לעם ולא ידחו עוד מעל פני האדמה אשר נתתי להם.`;
  return [
    'כותרת 1 - חלק',
    para,
    ...Array.from({ length: 4 }, (_, i) => `פסקת מילוי ${i + 1} עם טקסט ממשי למילוי הטורים בנפח אמיתי ולבדיקת גיאומטריה עקבית של העמוד. ${'מילים למילוי הטור ולבדיקת יציבות הפריסה '.repeat(4)}`)
  ].join('\n');
}

function findSheamInModel(model) {
  let found = null, count = 0;
  model.pages.forEach((mp, i) => {
    for (const ln of mp.lines) {
      for (const w of (ln.words || [])) {
        if (isSheamWord(w.text)) { count++; if (!found) found = { pageIdx: i, word: w, line: ln }; }
      }
    }
  });
  return { found, count };
}

describe('S74 — פגם הקרנת ניקוד משולב ב-PDF (FrankReal שְׁמַע, פורנזי 25.11)', () => {
  it('מקדימון: hmtx הגולמי של ניקודי FrankReal חיובי — תנאי הגילוי', () => {
    assert(MARK_UNITS === 1793, `סכום advances ניקודים גולמי מאומת (קיבלנו ${MARK_UNITS})`);
    assert(BASE_UNITS === 3275, `סכום בסיסים מאומת (קיבלנו ${BASE_UNITS})`);
  });

  it('המודל מציב את שְׁמַע פעם אחת בלבד — עוגן ההשוואה מוגדר', () => {
    const S = setup();
    const r = typeset(buildDoc(), S, {});
    assert(r.pageModel && r.pageModel.pages.length, 'PageModel נוצר');
    const { found, count } = findSheamInModel(r.pageModel);
    assert(count === 1, `המילה נמצאת פעם אחת במודל (נמצאו ${count})`);
    assert(found, 'עוגן המילה קיים');
    assert(found.word && Number.isFinite(found.word.w), 'למילה במודל יש רוחב מתוכנן (w)');
    clearRegisteredFonts();
  });

  it('שער הנפל: רוחב שְׁמַע ב-PDF חייב להתאים לרוחב המילה במודל (±0.5pt)', () => {
    if (!pdftotextAvailable()) return it.skip('pdftotext לא מותקן');
    const S = setup();
    const fontBytes = frankRealBytes();
    const r = typeset(buildDoc(), S, {});
    const model = r.pageModel;
    assert(model && model.pages.length, 'PageModel נוצר');
    const { found } = findSheamInModel(model);
    assert(found, 'המילה נמצאת במודל');
    const modelWidthPt = found.word.w * 72 / 96;
    const res = exportPdfFromModel(model, S, fontBytes, 'FrankReal');
    assert(res.ok, 'ייצוא PDF הצליח: ' + (res.error || ''));
    const pdfPath = path.join(__dirname, '..', 'artifacts', 's74-mark-advance.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, Buffer.from(res.bytes));
    const words = pdfWordsOnPage(pdfPath, found.pageIdx + 1);
    const cand = words.filter(v => isSheamWord(v.text));
    assert(cand.length >= 1, `המילה נחלצה ב-bbox מעמ' ${found.pageIdx + 1} (${cand.length} מועמדים; ${words.length} מילים בעמוד)`);
    const span = cand[0];
    const pdfWidthPt = span.x1 - span.x0;
    const sizePx = found.word.w / (BASE_UNITS / FRANKREAL_UPM);
    const markAdvancePt = MARK_UNITS * (sizePx * 72 / 96) / FRANKREAL_UPM;
    assertClose(pdfWidthPt, modelWidthPt, 0.5,
      `פגם הקרנת ניקוד משולב ב-PDF (פורנזי §7): רוחב שְׁמַע ב-PDF=${pdfWidthPt.toFixed(3)}pt מול המודל=${modelWidthPt.toFixed(3)}pt — הפרש ${(pdfWidthPt - modelWidthPt).toFixed(3)}pt ≈ advances ניקוד גולמי (${markAdvancePt.toFixed(3)}pt). ה-PDF בונה מילים תו-תו עם hmtx גולמי במקום להקרין את מיקום המודל. תיקון שורש: ShapedRun→PageModel→מקרינים; אין לתקן במרווח/CSS/offset.`);
    clearRegisteredFonts();
  });
});

report('s74-pdf-mark-advance');
