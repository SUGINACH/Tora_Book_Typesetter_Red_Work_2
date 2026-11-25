// tests/e2e/s74-pdf-mark-advance.test.js — **S74: בדיקת רגרסיה של פגם הקרנת ניקוד משולב ב-PDF**
// פרוסה 1 — בדיקה ממוקדת המתעדת את הפגם (falling test לפי חוזה ההוכחה §1.2).
//
// מקור הדרישה: audits/PHASE1_DOM_HTML_PDF_GLYPH_PARITY_2026-11-25.md §6 — הבדיקות
// הקיימות (s12-export, s73) אינן בודקות הצמדת סימני ניקוד משולבים בפועל, ולכן
// פגם הקרנת הגליפים ב-PDF עבר בשקט. הבדיקה תיכשל עד לתיקון השורש הארכיטקטוני
// (ShapedRun → LineModel → PageModel → כל המקרינים; אין לתקן ב-CSS/מרווח/offset).
//
// ראיית הפגם (מהאודיט החי, PDF עמ' 577 / HTML index 576):
//   - HTML span `שְׁמַע` (FrankReal, 24px/18pt): 38.390625px = 28.79296875pt
//   - PDF span אותה מילה: 44.56796265pt — הפרש 15.775pt
//   - סכום advances הגולמי של שלושת הניקודים ב-hmtx של FrankReal: 1793 יח' = 15.75878906pt
//   - שלוש אותיות הבסיס: 3275 יח' = 28.78417969pt (מתאים ל-HTML בסבילות 0.009pt)
// הפרש המילה ב-PDF = סכום advances הניקודים — הוכחה כמותית שה-PDF מקדם ניקוד
// משולב ברוחבו הגולמי במקום להצמידו לבסיס (כפי שהדפדפן והמנוע המאוחד מודדים).
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, assertClose, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportPdfFromModel } = require('../../src/engine/output/export-api');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const REPO = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui/assets/imud');
const FONT_DIR = path.join(ASSETS, 'fonts');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));

// ---- קבועים מאומתים (לא נחושים) — מדוח PHASE1 פורנזי §2/§3 ומההיבטים של FrankReal ----
const FRANKREAL_UPM = 2048;
// hmtx גולמי מהגופן (PHASE2 probe + פורנזי §2):
const FRANKREAL_HMTX = { 'ש': 1261, 'ׁ': 1247, 'ְ': 147, 'מ': 1042, 'ַ': 399, 'ע': 972 };
// סכום advances שלוש אותיות הבסיס (יח') — המדידה המאוחדת והדפדפן מציגים זאת:
const BASE_UNITS = FRANKREAL_HMTX['ש'] + FRANKREAL_HMTX['מ'] + FRANKREAL_HMTX['ע']; // 3275
// סכום advances הניקודים הגולמי (יח'):
const MARK_UNITS = FRANKREAL_HMTX['ׁ'] + FRANKREAL_HMTX['ְ'] + FRANKREAL_HMTX['ַ']; // 1793
const WORD = 'שְׁמַע';

function unitsToPt(units, sizePt) { return units * sizePt / FRANKREAL_UPM; }

function frankRealBytes() {
  // FrankReal-Bold.ttf — הגופן המדויק מהקטלוג; בלי הגופן המדויק אין להריץ את השער
  const e = CATALOG.find(x => x.family === 'FrankReal');
  assert(e, 'FrankReal בקטלוג (imud-fonts.json)');
  return fs.readFileSync(path.join(FONT_DIR, e.file));
}

let _pdftotext = null;
function pdftotextAvailable() {
  if (_pdftotext !== null) return _pdftotext;
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); _pdftotext = true; }
  catch (e) { _pdftotext = false; }
  return _pdftotext;
}

/** חילוץ תיבת מילה חלוצה מפלט pdftotext -bbox לעמוד נתון. */
function pdfWordsOnPage(pdfPath, pageNo) {
  const xml = execFileSync('pdftotext', ['-bbox', '-f', String(pageNo), '-l', String(pageNo), pdfPath, '-'], { encoding: 'utf8' });
  return [...xml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)]
    .map(m => ({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], text: m[5] }));
}

/** רישום משפחות הגופנים הדרושות למסמך בדיקה (כמו ה-Worker במוצר). */
function setup() {
  clearRegisteredFonts();
  for (const f of ['Frank Ruhl Libre', 'David Libre', 'Hadassah Friedlaender', 'FrankReal']) {
    const e = CATALOG.find(x => x.family === f);
    if (e) registerFont(f, fs.readFileSync(path.join(FONT_DIR, e.file)));
  }
  const S = getDefaultSettings();
  return { S };
}

// סדר חשוב: הסוויטה הזו בודקת מצב שאושר כמופר באודיט חי; היא תיכשל (אדומה)
// עד לתיקון השורש. אין להחליש, לדלג או לשנות ערכי סף כדי ליצור ירוק מלאכותי.
describe('S74 — פגם הקרנת ניקוד משולב ב-PDF (FrankReal שְׁמַע, פורנזי 25.11 §6)', () => {
  it('מקדימון: FrankReal hmtx הגולמי של ניקודים אינו אפס — הפגם ניתן לגילוי בגוף זה', () => {
    // שער שלילי: אם hmtx של הניקודים יהיה אפס (כמו Guttman Rashi), הפגם לא יתגלה
    // והסוויטה תאבד תוקף — לכן מאמתים את תנאי הגילוי מראש.
    assert(MARK_UNITS > 1000, `hmtx ניקודים גולמי חיובי וגדול (קיבלנו ${MARK_UNITS} יח'); בלי זה הפגם בלתי נראה`);
    assert(BASE_UNITS === 3275, `סכום בסיסים מאומת (קיבלנו ${BASE_UNITS})`);
  });

  it('מדידה מאוחדת: advance של מילת שְׁמַע ב-FrankReal = בסיסים בלבד (ניקודים בקירוב אפס)', () => {
    const { S } = setup();
    const sizePt = 18; // כמו מילת-החלון החיה (18pt) מהאודיט
    const r = typeset(`${WORD} טקסט גוף לכיסוי ${WORD} שנית בפסקה זו לבדיקת מדידה כפולה.`, S, { noRecommendations: true });
    assert(r.pageModel && r.pageModel.pages.length, 'עימוד מאוחד הצליח והנפיק PageModel');
    // שליפת advance המילה מהמודל — שער המדידה: ההפרש מבסיסים-בלבד קטן מרוחב ניקוד גולמי
    let found = 0;
    for (const mp of r.pageModel.pages) for (const ln of mp.lines) for (const w of (ln.words || [])) {
      if (w.text === WORD) {
        found++;
        // advancePx לעולם מופק מהמדידה (px @96dpi); sizePt=18 ⇒ scale=18/2048 per unit
        const measuredPt = (w.advancePx || w.w) * 72 / 96;
        const basePt = unitsToPt(BASE_UNITS, sizePt);
        const rawPt = unitsToPt(BASE_UNITS + MARK_UNITS, sizePt);
        assertClose(measuredPt, basePt, Math.max(0.35, rawPt - basePt) * 0.5,
          `מדידה מאוחדת של שְׁמַע (עמ' ${found}): measured=${measuredPt.toFixed(3)}pt; בסיסים=${basePt.toFixed(3)}pt; גולמי=${rawPt.toFixed(3)}pt — המדידה חייבת לעקוב אחר הבסיסים (כמו הדפדפן)`);
      }
    }
    assert(found >= 1, `המילה ${WORD} נמצאה במודל (מצאנו ${found})`);
    clearRegisteredFonts();
  });

  it('הקרנת PDF: רוחב המילה ב-PDF מציג קידום ניקוד גולמי — הפגם המתועד', () => {
    if (!pdftotextAvailable()) return it.skip('pdftotext לא מותקן');
    const { S } = setup();
    const fontBytes = frankRealBytes();
    const DOC = [
      'כותרת 1 - חלק',
      `פסקת הבדיקה עם המילה ${WORD} בתוכה והערה [הערת מדידה לשער S74] באותה פסקה.`,
      ...Array.from({ length: 4 }, (_, i) => `פסקת מילוי ${i + 1} עם טקסט ממשי למילוי הטורים בנפח אמיתי. ${'מילים למילוי הטור ולבדיקת גיאומטריה '.repeat(4)}`)
    ].join('\n');
    const r = typeset(DOC, S, { noRecommendations: true });
    const model = r.pageModel;
    assert(model && model.pages.length, 'PageModel נוצר');
    const res = exportPdfFromModel(model, S, fontBytes, 'FrankReal');
    assert(res.ok, 'ייצוא PDF הצליח: ' + (res.error || ''));
    const pdfPath = path.join(__dirname, '..', 'artifacts', 's74-mark-advance.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, Buffer.from(res.bytes));

    // מציאת עמוד הגוף שמכיל את המילה מהמודל (ההחלטה מהמודל, לא מהכותב)
    let pageNo = -1, modelW = null;
    model.pages.forEach((mp, i) => {
      for (const ln of mp.lines) for (const w of (ln.words || [])) {
        if (w.text === WORD) { pageNo = i + 1; modelW = w; }
      }
    });
    assert(pageNo > 0, `המילה ${WORD} במודל`);
    const words = pdfWordsOnPage(pdfPath, pageNo);
    const cand = words.filter(v => v.text.includes('ש') && v.text.includes('ע') && (v.text.includes('ׁ') || v.text.includes('ְ') || v.text.includes('ַ')));
    assert(cand.length >= 1, `המילה נחלצה ב-bbox (מצאנו ${cand.length} מועמדים בעמ' ${pageNo})`);
    const span = cand[0];
    const pdfWidthPt = span.x1 - span.x0;
    const sizePt = 18;
    const basePt = unitsToPt(BASE_UNITS, sizePt);
    const rawPt = unitsToPt(BASE_UNITS + MARK_UNITS, sizePt);
    // שער הפגם המתועד: ה-PDF רחב בכמעט סכום advances הניקודים מעבר למדידה/תצוגה
    assertClose(pdfWidthPt, basePt, 0.5,
      `פגם הקרנת ניקוד משולב ב-PDF: רוחב המילה ב-PDF=${pdfWidthPt.toFixed(3)}pt, אך בסיסים-בלבד=${basePt.toFixed(3)}pt וגולמי(עם ניקוד)=${rawPt.toFixed(3)}pt — הפרש ${(pdfWidthPt - basePt).toFixed(3)}pt תואם כמותית לסכום advances הניקודים הגולמי (${unitsToPt(MARK_UNITS, sizePt).toFixed(3)}pt); תיקון שורש נדרש לפי חוזה PHASE1 §7 — אין לתקן במרווח/CSS/offset`);
    clearRegisteredFonts();
  });

  it('שליטה שלילית: מילה בגופן שבו hmtx ניקודים = 0 (גוטמן רש"י) אינה יכולה להציג את הפגם', () => {
    // ב-Guttman Rashi advances הניקודים הם 0 ⇒ הפער מדידה↔PDF אינו נראה בגוף זה.
    // בדיקה זו מוכיחה שהרגרסיה מכוונת לגוף הפגם (FrankReal) ואינה כללית עיוורת.
    const { S } = setup();
    const r = typeset(`${WORD} פסקה קצרה עם גוף רגיל וניקודים.`, S, { noRecommendations: true });
    assert(r.pageModel && r.pageModel.pages.length, 'עימוד ברירת מחדל (גוף גוטמן רש"י מההגדרות)');
    let found = 0;
    for (const mp of r.pageModel.pages) for (const ln of mp.lines) for (const w of (ln.words || [])) {
      if (w.text === WORD) found++;
    }
    assert(found >= 1, `המילה נמצאת גם בגופן ברירת המחדל (${found})`);
    clearRegisteredFonts();
  });
});

report('s74-pdf-mark-advance');
