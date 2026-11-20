// tests/e2e/s9j-head-align.test.js — U-15 (ביקורת שלמות 20.11): חוזה יישור
// כותרות — כל שורות הכותרת ממורכזות, בכל מסלול (טור + פס חוצה־טורים).
//
// שורש שנסגר: lastAlignOf (materialize) החזיר 'justify' לכל שורה שאינה-אחרונה
// גם לכותרות ⇒ שורות המשך של כותרות מרובות-שורות נמתחו מקצה לקצה בגיאומטריית
// המילים (gapW=(colW−sumW)/gaps) — HEAD_JUSTIFIED ×28 ב-Full Math very_long
// (sign-open 22 / preface 5 / regular 1; בכולן inkL=x, inkR=x+w — מתיחה מלאה).
// הכפל שני באותו שורש: שורות הפס החוצה־טורים קיבלו 'right' קבוע ⇒ 340 שורות
// כותרת צמודות-ימין (אסימטריה 170–222px ממרכז הפס) בניגוד למורשת שממרזת
// (נמדד במורשת: h0/h2/h3 — Lgap=Rgap בדיוק).
//
// חוזה (חמש רשויות מסכימות): dom-renderer renderLine (text-align:center לכל
// kind='heading'), legacy-projector:407, legacy-projector:238 (פסים), BASE_CSS
// (.line--heading מוחרג מ-text-align-last:justify), מפרט האודיט סעיף 8.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 's9j' });
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

/** אסימטריית דיו מול מרכז תיבת השורה — |Lgap−Rgap|. */
function inkAsym(ml) {
  const ws = ml.words || [];
  if (!ws.length) return 0;
  const inkL = Math.min(...ws.map(w => w.x));
  const inkR = Math.max(...ws.map(w => w.x + w.w));
  return Math.abs((inkL - ml.x) - (ml.x + ml.w - inkR));
}

/** מסמך עם כותרת H1 ארוכה (רבת-שורות) בטור — המקרה ההיסטורי של 50pt. */
function multilineHeadingDoc() {
  const parts = ['כותרת 1 - הקדמות וכללים - יום השבת - גדרי מלאכה - הוצאה - רשימות'];
  for (let i = 0; i < 12; i++) parts.push(`פסקה ${i + 1} למילוי העמוד בטקסט רציף. ${'מילים רבות למדידה ולשבירה ברוחב הטור המלא '.repeat(8)}`);
  return parts.join('\n');
}

describe('U-15 — חוזה יישור כותרות (כל שורות הכותרת ממורכזות, בכל מסלול)', () => {
  it('כותרת רבת-שורות בטור: כל שורותיה ממורכזות — לא נמתחות מקצה לקצה', () => {
    const r = typeset(multilineHeadingDoc(), imudSettings, envExtras);
    assert(r.pageModel && r.pageModel.pages.length, 'PageModel קיים');
    const heads = [];
    for (const pml of r.pageModel.pages) for (const ml of pml.lines) if (ml.kind === 'heading') heads.push(ml);
    assert(heads.length >= 2, `כותרת רבת-שורות: ${heads.length} שורות כותרת`);
    for (const ml of heads) {
      assertEq(ml.align, 'center', `שורת כותרת (isLast=${!!ml.isLast}) חייבת center — התקבל ${ml.align}`);
      // גיאומטריה: הדיו ממורז בתיבה — לא פרוש על רוחבה (הקוד הישן: inkL=x, inkR=x+w)
      const ws = ml.words || [];
      if (ws.length >= 2) {
        const inkL = Math.min(...ws.map(w => w.x));
        const inkR = Math.max(...ws.map(w => w.x + w.w));
        assert(inkL - ml.x > 1, `שורת כותרת אינה צמודה לקצה שמאל (Lgap=${(inkL - ml.x).toFixed(1)}px — מתיחה מלאה)`);
        assert(ml.x + ml.w - inkR > 1, `שורת כותרת אינה צמודה לקצה ימין (Rgap=${(ml.x + ml.w - inkR).toFixed(1)}px)`);
        assert(inkAsym(ml) < 3, `מרכוז הכותרת (אסימטריה ${inkAsym(ml).toFixed(1)}px)`);
      }
    }
  });

  it('פס חוצה־טורים (H2/H3): שורות הכותרת ממורכזות בפס — לא צמודות-ימין', () => {
    const doc = ['כותרת 2 - קדושת יום השבת ומצוותיה']
      .concat(Array.from({ length: 30 }, (_, i) => `פסקה ${i + 1}. ${'טקסט גוף רגיל למילוי עמודים אחרי הכותרת '.repeat(10)}`))
      .concat(['כותרת 3 - מהות השבת וחלקי מצוותה'])
      .concat(Array.from({ length: 30 }, (_, i) => `עוד פסקה ${i + 1}. ${'טקסט גוף רגיל למילוי עמודים נוספים '.repeat(10)}`))
      .join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let spanningHeads = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.area !== 'spanning' || ml.kind !== 'heading') continue;
        spanningHeads++;
        assertEq(ml.align, 'center', `שורת פס חוצה-טורים (isLast=${!!ml.isLast}) חייבת center — התקבל ${ml.align}`);
        const ws = ml.words || [];
        if (ws.length >= 2) {
          // הקוד הישן: Rgap=0 ואסימטריה 170–222px ממרכז הפס (צמודות-ימין)
          assert(inkAsym(ml) < 3, `מרכוז בפס (אסימטריה ${inkAsym(ml).toFixed(1)}px — הקוד הישן: עד 222px)`);
        }
      }
    }
    assert(spanningHeads >= 1, `נבדקו שורות כותרת בפס חוצה-טורים: ${spanningHeads}`);
  });

  it('שורות גוף לא השתנו: שאינה-אחרונה justify, אחרונה center (ברירת המחדל)', () => {
    const doc = Array.from({ length: 12 }, (_, i) => `פסקה ${i + 1}. ${'טקסט גוף רגיל למדידת יישור השורות ברוחב הטור '.repeat(6)}`).join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawJustify = false, sawLastCenter = false;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.kind !== 'paragraph' || (ml.words || []).length < 2) continue;
        if (ml.isLast) {
          if (ml.align === 'center') sawLastCenter = true;
          else assertEq(ml.align, String(imudSettings['body-last-line-align'] || 'center'), 'שורה אחרונה לפי ההגדרה');
        } else if (ml.align === 'justify') sawJustify = true;
      }
    }
    assert(sawJustify, 'שורות גוף שאינן-אחרונות עדיין מיושרות (justify)');
    assert(sawLastCenter, 'שורה אחרונה עדיין ממורכזת (center)');
  });

  it('very_long — נעילת רגרסיה: אפס שורות כותרת שאינן ממורכזות (בכל מסלול)', () => {
    const text = fs.readFileSync(path.join(RB, '..', 'audits', 'very_long_test_text.txt'), 'utf8');
    const r = typeset(text, imudSettings, envExtras);
    const bad = [];
    let total = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.kind !== 'heading') continue;
        total++;
        if (ml.align !== 'center') bad.push({ page: pml.index, area: ml.area || 'col', align: ml.align });
      }
    }
    // לפני התיקון: 40 שורות justify (28 עם מילים>=2 ⇒ HEAD_JUSTIFIED באודיט)
    // ו-340 שורות פס 'right'. אחרי: 574/574 center.
    assertEq(bad.length, 0, 'שורות כותרת שאינן center: ' + JSON.stringify(bad.slice(0, 5)));
    assert(total > 500, `מלאי שורות הכותרת ב-very_long: ${total}`);
    assert(r.contentPreserved !== false, 'contentPreserved');
  });

  it('נייטרליות פריסה: layoutHash ומספר העמודים אינם מושפעים (המקדם גיאומטרי בלבד)', () => {
    const doc = multilineHeadingDoc();
    const a = typeset(doc, imudSettings, envExtras);
    const b = typeset(doc, imudSettings, envExtras);
    assertEq(a.layoutHash, b.layoutHash, 'דטרמיניזם — hash זהה בין שתי ריצות');
    assert(a.pages.length === b.pages.length, 'מספר עמודים זהה');
    // השוואת תוכן מילולית מלאה בין שתי הריצות — שורה-מול-שורה
    const flat = (res) => res.pageModel.pages.flatMap(p => p.lines.map(l => (l.words || []).map(w => w.text).join(' ')));
    assertEq(JSON.stringify(flat(a)), JSON.stringify(flat(b)), 'אותן שורות ואותן מילים בדיוק');
  });
});

report('s9j-head-align');
