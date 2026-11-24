// tests/regress/rc-d1-escort-through-side-notes.test.js — Iteration-006 / G4 / RC-D1
// נעילת חוזה הליווי-כותרת דרך בלוקי הערת-צד:
//   בלוק H7/asSideNote שבין כותרת H1–H6 לפסקה ריק את בדיקת הליווי (following=0)
//   ⇒ הכותרת הוצבה בלי ליווי, שורת הפסקה הראשונה נכנסה לבדה לתחתית הטור
//   (heading+1line — "אלמנת-גוף" שמנגנון מנע-כותרת-יתומה מייצר; בעיה D).
//   העוקב האמיתי לליווי = הבלוק הגופני הראשון אחרי בלוקי-הצד/בלוקים ריקים.
//
// הרפרודוקציה: קידומת הספר האמיתי (110 שורות ראשונות — fixture
// rc_d1_book_prefix.txt) משחזרת את הכשל המדויק מהספר (p50: H4 t95
// «סדר המושגים וביאור לישנא דקרא», אחריו בלוק-צד t96 «שורש מושג השבת...»,
// ואז פסקה t97 בת 14 שורות): בקוד שקדם ל-RC-D1 — page 14, H4+1line.
// אחרי RC-D1: 0.
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');
process.env.RED_UNIFIED_IMUD = '1'; // הבדיקה נועדה לנתיב המאוחד (ה-escort הוא שלו)

const FONT_DIR = path.join(RB, 'ui', 'assets', 'imud', 'fonts');
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const FONTS = [
  ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['FrankReal', 'FrankReal-Bold.ttf'],
  ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
  ['Hadassah Friedlaender', 'Hadassah-Friedlaender.ttf'], ['David Libre', 'DavidLibre-Regular.ttf']
];
for (const [fam, file] of FONTS) {
  const fp = path.join(FONT_DIR, file);
  if (fs.existsSync(fp)) {
    // **fontResolver (נתיב ה-Worker) — כמו האפליקציה:** רישום ב-measure-api בלבד
    // משאיר את ה-fontResolver ריק ⇒ מדידה בקירוב-טבלה ⇒ גבול הטור נופל אחרת
    // והרפרודוקציה של הכשל (p14) לא מתרחשת (נמדד — ההבדל בין שני נתיבי הרישום).
    const r = fontResolver.registerFont(fam, fs.readFileSync(fp), { source: 'rc-d1' });
    if (!r.ok) throw new Error(`fontResolver.registerFont(${fam}): ${r.message}`);
  }
}

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));

const TEXT = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'rc_d1_book_prefix.txt'), 'utf8');

// הגדרות האפליקציה (ייבוא ברירות המחדל של המקור) — כמו i006-app-export.js:
// רק הן משחזרות את מיקום גבול הטור האמיתי של הספר (הכשל: p14/p50).
function imudSettings() {
  const rawDefaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(rawDefaults, regKeys, { contentHeightPx: 1040, availableFonts: new Set(['Guttman Rashi', 'FrankReal', 'Frank Ruhl Libre', 'Livorna', 'Hadassah Friedlaender', 'David Libre']) });
  return { ...getDefaultSettings(), ...imp.settings, 'measure-impl': 'font-metrics' };
}

function countHeadingPlus1(pages) {
  let hits = [];
  for (const page of pages) {
    for (let ci = 0; ci < (page.columns || []).length; ci++) {
      const col = page.columns[ci] || [];
      if (col.length < 2) continue;
      const last = col[col.length - 1];
      const prev = col[col.length - 2];
      if (last.kind !== 'heading' && prev.kind === 'heading' && prev.level && prev.level <= 6) {
        hits.push({ page: page.index + 1, col: ci, level: prev.level, headingTok: prev.tokenId || (prev.meta && prev.meta.tokenId), bodyTok: last.tokenId || (last.meta && last.meta.tokenId) });
      }
    }
  }
  return hits;
}

describe('rc-d1 — הליווי-כותרת רואה דרך בלוקי הערת-צד', () => {
  it('קידומת הספר: אף טור לא מסתיים בכותרת+שורה בודדת (הכשל המקורי: p14/t95+t97)', () => {
    const r = typeset(TEXT, imudSettings());
    assert(r.pages.length >= 10, `קידומת הספר אמורה לייצר ≥10 עמודים (התקבלו ${r.pages.length})`);
    const hits = countHeadingPlus1(r.pages);
    assertEq(hits.length, 0, `heading+1line בתחתית טור: ${JSON.stringify(hits.slice(0, 3))} — בלי RC-D1 התקבל p14 (H4 t95 + שורה בודדת של t97)`);
  });

  it('הכותרת H4 «סדר המושגים» נסוגה עם ליווי — לא נותרת בסוף הטור', () => {
    const r = typeset(TEXT, imudSettings());
    // מוצאים את העמוד שמכיל את ה-H4 ובודקים את מיקומו בטור
    let found = null;
    for (const page of r.pages) {
      for (let ci = 0; ci < (page.columns || []).length; ci++) {
        const col = page.columns[ci] || [];
        for (let li = 0; li < col.length; li++) {
          const ln = col[li];
          if (ln.kind === 'heading' && ln.level === 4) {
            const bodyAfter = col.length - 1 - li; // שורות אחרי הכותרת באותו טור
            found = { page: page.index + 1, col: ci, idx: li, colLen: col.length, bodyAfter };
          }
        }
      }
    }
    assert(found != null, 'ה-H4 מהקידומת לא נמצא בפריסה');
    // ה-H4 חייב להיות עם ≥2 שורות אחריו באותו טור, או שאינו אחרון (לא בסוף הטור)
    assert(found.bodyAfter !== 0 && (found.bodyAfter >= 2 || found.idx < found.colLen - 1),
      `H4 בעמ' ${found.page} טור ${found.col}: ${found.bodyAfter} שורות אחריו — חייב ≥2 (או שלא בסוף הטור)`);
  });

  it('בקרה שלילית (הכשל מתועד): המונה מזהה heading+1line כשמוזרק ידנית', () => {
    // הבקרה מוכיחה שהגלאי עצמו פועל: בניית עמוד סינתטי עם הדפוס מזוהה
    const fakePages = [{
      index: 0,
      columns: [
        [
          { kind: 'paragraph', level: null, words: [{}] },
          { kind: 'heading', level: 4, words: [{}] },
          { kind: 'paragraph', level: null, words: [{}] }
        ]
      ]
    }];
    const hits = countHeadingPlus1(fakePages);
    assertEq(hits.length, 1, 'הגלאי חייב לזהות heading+1line מוזרק');
  });
});

report('rc-d1-escort-through-side-notes');
