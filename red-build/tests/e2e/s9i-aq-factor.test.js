// tests/e2e/s9i-aq-factor.test.js — U-10 (ביקורת שלמות 20.11): אמנת פקטור
// אבסולוטי ל-aqStretch — כל כותב מחשב את המקדם מגבהים גולמיים ומחיל כהחלפה.
//
// שורש שנסגר: autoQualityPass חישב rawFactor מ-Σ(heightPx×stretch הנוכחי)
// (תיקון יחסי) אך החיל אותו כהחלפה. טור שנכנס ל-AQ מכווץ — alignColumnBottoms
// דוחס את הטור הארוך לנקודת האמצע ב-fTall≈0.97 — קיבל מקדם שאינו מתחשב
// בכיווץ ⇒ יצא מעל הקיבולת. נמדד לפני התיקון (very_long, הקשר האודיט —
// IMUD עם aq-enabled): ‏7 עמודות חרגו 12.9–31.3px ⇒ LINE_BELOW_COLUMN ×8
// באודיט הדפדפן (domVsModel=0 — פגם מודלי אמיתי). אחרי התיקון: אפס.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { colCapacityOf } = require(path.join(RB, 'src/engine/layout/column-flow'));
const { rawLinesOf } = require(path.join(RB, 'src/engine/layout/balancing'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 's9i' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
const imudSettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics', '_engine-force-unified': true };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

/** גובה טור כפי שהוא מוקרן — הגיאומטריה של usedHeight/ההקרנה/האודיט. */
function stretchedUsed(col) {
  let h = 0;
  for (const ln of col) h += (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
  return h;
}

/** כל עמודי המסמך: אף טור אינו חורג מהקיבולת האפקטיבית (הקרנה מלאה). */
function overflowColumns(pages) {
  const out = [];
  for (const pg of pages) {
    (pg.columns || []).forEach((col, ci) => {
      const cap = colCapacityOf(pg, { colIndex: ci });
      const u = stretchedUsed(col);
      if (u > cap + 0.75) out.push({ page: pg.index, col: ci, over: +(u - cap).toFixed(1) });
    });
  }
  return out;
}

/** מסמך המכריח את שרשרת align→AQ: פסקאות ארוכות (טור מלא) לסירוגין עם
 *  קצרות — יוצר אי-איזון שמפעיל עומס-משותף (כיווץ הטור הארוך) ואז AQ
 *  מתיחה לתחתית על טורים שנכנסו מכווצים — התרחיש ההיסטורי של U-10. */
function imbalanceDoc() {
  const parts = ['כותרת 1 - חלק בדיקת האמנה האבסולוטית של aqStretch'];
  for (let i = 0; i < 60; i++) {
    parts.push(`פסקה ארוכה ${i + 1} למילוי מלא של הטור הראשון עד תחתיתו בטקסט רציף. ${'מילים רבות למדידה ולשבירה ברוחב הטור המלא '.repeat(6)}`);
    if (i % 2 === 0) parts.push(`קצרה ${i + 1}. ${'טקסט קצר '.repeat(8)}`);
  }
  parts.push('פסקת סיום עם עוד כמה מילים לסגירת המסמך.');
  return parts.join('\n');
}

/** יחידת הרכב מכוונת: שני טורים בגבהים גולמיים 940/990 מול קיבולת 1000 —
 *  הרצף ההיסטורי המדויק: עומס-משותף מכווץ את הארוך (fTall≈0.975 ⇒ 965)
 *  ואז AQ מותח אותו בחזרה. בקוד הישן המקדם חושב מהסכום המכווץ (1000/965≈1.036)
 *  והוחל כהחלפה ⇒ ‏1026px — 26px מעל הקיבולת. באמנה האבסולוטית: 1000 בדיוק. */
function composeSharedLoadThenAQ() {
  const mkCol = (n, h) => Array.from({ length: n }, () => ({ heightPx: h, gapBeforePx: 0, words: ['x'] }));
  const page = {
    index: 7,
    template: { contentBox: { top: 0, height: 1000, bottom: 1000 }, columns: [{ x: 0, w: 300 }, { x: 320, w: 300 }] },
    columns: [mkCol(40, 23.5), mkCol(45, 22)],   // 940 / 990
    footnotes: [], sideNotes: []
  };
  const { alignColumnBottoms, autoQualityPass } = require(path.join(RB, 'src/engine/layout/balancing'));
  const noopLog = { emit: () => {} };
  alignColumnBottoms([page], imudSettings, noopLog, {});
  const tallStretched = stretchedUsed(page.columns[1]);
  const tallFactor = page.columns[1][0].aqStretch || 1;
  autoQualityPass([page], imudSettings, noopLog);
  return { page, tallStretched, tallFactor };
}

describe('U-10 — אמנת פקטור אבסולוטי ל-aqStretch (כל כותב: מגבהים גולמיים, החלפה)', () => {
  it('יחידת ההרכב ההיסטורית: עומס-משותף מכווץ (fTall≈0.975) ואז AQ מותח — נוחת בדיוק על הקיבולת', () => {
    const { page, tallStretched, tallFactor } = composeSharedLoadThenAQ();
    // שלב הביניים: הטור הארוך אכן כווץ ע"י העומס המשותף (תנאי ההיסטוריה)
    assert(tallFactor < 0.999, `הטור הארוך כווץ לפני AQ (f=${tallFactor}) — בלי כיווץ אין רגרסיה לבדוק`);
    assert(Math.abs(tallStretched - 965) < 1.5, `נקודת האמצע 965 (קיבלנו ${tallStretched.toFixed(1)})`);
    // אחרי AQ: הטור המותח נוחת על הקיבולת בדיוק — לא מעליה (הקוד הישן: ‏1026)
    const finalUsed = stretchedUsed(page.columns[1]);
    const cap = colCapacityOf(page, { colIndex: 1 });
    assert(finalUsed <= cap + 0.75, `הטור המותח חורג: ${finalUsed.toFixed(1)} > cap ${cap}`);
    assert(Math.abs(finalUsed - cap) < 6, `המתיחה מגיעה ליעדה (קיבלנו ${finalUsed.toFixed(1)} מול ${cap})`);
  });

  it('מסמך אי-איזון מלא (align→AQ על כל העמודים): אף טור אינו חורג מהקיבולת', () => {
    const r = typeset(imbalanceDoc(), imudSettings, envExtras);
    assert(r.pages.length > 3, `מסמך רב-עמודים: ${r.pages.length}`);
    let stretched = 0;
    for (const pg of r.pages) for (const col of (pg.columns || [])) {
      if (col.length && (col[0].aqStretch || 1) > 1.001) stretched++;
    }
    assert(stretched >= 1, `המסמך מפעיל מתיחת AQ (מתוח=${stretched})`);
    const over = overflowColumns(r.pages);
    assertEq(over.length, 0, 'טורים חורגים: ' + JSON.stringify(over.slice(0, 3)));
  });

  it('very_long בהקשר האודיט (IMUD, aq-enabled): אפס חריגות טור — נעילת הרגרסיה של U-10', () => {
    const text = fs.readFileSync(path.join(RB, '..', 'audits', 'very_long_test_text.txt'), 'utf8');
    const r = typeset(text, imudSettings, envExtras);
    const over = overflowColumns(r.pages);
    // לפני התיקון: 7 טורים חרגו (12.9–31.3px) ⇒ LINE_BELOW_COLUMN ×8 באודיט
    assertEq(over.length, 0, 'טורים חורגים ב-very_long: ' + JSON.stringify(over.slice(0, 5)));
    assert(r.contentPreserved !== false, 'contentPreserved');
  });

  it('rawLinesOf: סכום גבהים גולמיים — בסיס האמנה (טוהר עזר)', () => {
    const col = [{ heightPx: 10, aqStretch: 0.5 }, { heightPx: 20, aqStretch: 2, gapBeforePx: 4 }, { heightPx: 5 }];
    assertEq(rawLinesOf(col), 35, 'ΣheightPx בלי מתיחה ובלי פערים');
  });
});

report('s9i-aq-factor');
