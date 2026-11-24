// tests/regress/rc-e1-ornament-frame.test.js — G5/RC-E1 (i006):
// מסגרת עיטורי ה-H2/H3 — איחוד הטורים (הפס) כמו המורשת, רומחים מקיפים
// את טקסט הכותרת הממורכז, ומגילות פס-H3 בשולי הפס.
//
// **השורש (נמדד בייצוא עם העיטורים פעילים):**
//  - עוגן אופקי של כל עיטורי ה-H2 היה טור-0 (הימני): cx=מרכז הטור — בפס
//    חוצה-טורים הכותרת ממורכזת באיחוד הטורים ⇒ הפירמידה/השושנתא נחתו בקצה
//    ימין של הכותרת (נמדד: פירמידה מרכז 538px מול כותרת 408px).
//  - נוסחאות הרומחים הניחו הצמדה לימין ⇒ הרומח השמאלי נחת בתוך טקסט
//    הכותרת (נמדד: רומח 346-396pt בתוך «קדושת...» 213-400pt).
//  - titleW נמדד בגודל הגוף (12pt) במקום גודל הכותרת (17pt) ⇒ ריווח שגוי.
//  - מגילות H3-פס (h3Band) נחתו בשולי הטור הימני — השמאלית בתוך טקסט הפס.
// **החוזה (legacy-ornaments.js — הפורט הנאמן):** centerX = bandX + bandW/2;
// rightX = centerX + halfTitle + gap; leftX = centerX − halfTitle − gap − ornW;
// חריגה מהפס ⇒ דחייה 'title-too-wide'.
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, assertClose, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const FONT_DIR = path.join(RB, 'ui/assets/imud/fonts');
fontResolver.registerFont('Guttman Rashi', fs.readFileSync(path.join(FONT_DIR, 'Guttman-Rashi-Normal.ttf')), { source: 'rc-e1' });
fontResolver.registerFont('FrankReal', fs.readFileSync(path.join(FONT_DIR, 'FrankReal-Bold.ttf')), { source: 'rc-e1' });

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { projectDocument } = require(path.join(RB, 'src/engine/core/materialize'));
const { ornamentInk } = require(path.join(RB, 'src/engine/decoration/ornament-ink'));

const LONG = 'תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ';
const TEXT = [
  'ספר - בדיקה', 'מחבר - בדיקה', '',
  'הקדמה - פתח דבר', 'אמת ' + LONG.repeat(2) + 'עמל.', '',
  'כותרת 1 - חלק 1',
  'כותרת 2 - קדושת יום השבת ומצוותיה',
  'כותרת 3 - א. המתבאר בגדר הנ"ל מגמת והראשונים',
  'פסקה 1 של חלק 1 ' + LONG.repeat(4) + 'שלום.'
].join('\n');

const ORN = {
  'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'pyramid', 'h2-orn-side': 'lance',
  'h3-side-orn': 'scroll', 'chapter-end-ornament': 'pyramid',
  // הרומחים בגודלם הטבעי (68px) — ב-fit-to-text הרומח מתרחב לרוחב הכותרת
  // ונדחה כ-documented ('title-too-wide', חוזה המורשת); כאן בודקים את הגיאומטריה
  // כשהוא נשתל.
  'h2-orn-fit-to-text': false
};

function run() {
  const settings = {
    ...getDefaultSettings(), ...ORN,
    '_layout-profile': 'imud', '_imudRaw': { 'h2-auto-siman': true },
    '_engine-force-unified': true,
    'first-word-mode': 'drop', 'first-word-font': 'FrankReal',
    'body-font': 'Guttman Rashi', 'body-font-size-pt': 12
  };
  return typeset(TEXT, settings, { noRecommendations: true });
}

describe('G5/RC-E1 — מסגרת עיטורי H2/H3 בפס חוצה-טורים (i006)', () => {
  it('שושנתא/פירמידה ממורכזות על מרכז הפס (איחוד הטורים) — כמו המורשת', () => {
    const r = run();
    const p = r.pages.find(pp => pp.spanning && pp.spanning.lines.length && (pp.decorations || []).some(d => d.slot === 'h2-top' || d.slot === 'h2-bottom'));
    assert(p, 'עמוד פתיחת-סימן עם עיטורי H2');
    const xs = p.template.columns.map(c => c.x);
    const xe = p.template.columns.map(c => c.x + c.w);
    const bandCx = (Math.min(...xs) + Math.max(...xe)) / 2;
    for (const d of (p.decorations || [])) {
      if (d.slot === 'h2-top' || d.slot === 'h2-bottom') {
        assertClose(d.x + d.w / 2, bandCx, 1.5, `${d.slot} ממורכז על מרכז הפס (${(d.x + d.w / 2).toFixed(1)} ≈ ${bandCx.toFixed(1)})`);
      }
    }
  });

  it('הרומחים מקיפים את טקסט הכותרת — אף חפיפה עם תיבת הדיו של הכותרת', () => {
    const r = run();
    const p = r.pages.find(pp => (pp.decorations || []).some(d => d.slot === 'h2-side-right'));
    assert(p, 'עמוד עם רומחים');
    const xs = p.template.columns.map(c => c.x);
    const xe = p.template.columns.map(c => c.x + c.w);
    const bandL = Math.min(...xs), bandR = Math.max(...xe);
    const side = (p.decorations || []).filter(d => d.slot === 'h2-side-right' || d.slot === 'h2-side-left');
    assertEq(side.length, 2, 'שני רומחים');
    // תיבת הכותרת בהקרנה: שורת הפס הממורכזת
    const proj = projectDocument(r, r.settings, {});
    const pp = proj.pages[p.index];
    const spLines = (pp.spanning && pp.spanning.lines) || [];
    assert(spLines.length >= 1, 'שורת פס מוקרנת');
    const t0 = Math.min(...spLines.flatMap(l => (l.words || []).map(w => w.x)));
    const t1 = Math.max(...spLines.flatMap(l => (l.words || []).map(w => w.x + w.w)));
    const right = side.find(d => d.slot === 'h2-side-right');
    const left = side.find(d => d.slot === 'h2-side-left');
    assert(right.x >= t1 + 2, `הרומח הימני אחרי הטקסט (${right.x} ≥ ${t1.toFixed(1)}+2)`);
    assert(left.x + left.w <= t0 - 2, `הרומח השמאלי לפני הטקסט (${(left.x + left.w)} ≤ ${t0.toFixed(1)}−2)`);
    // הכלה בפס (חוזה המורשת)
    assert(right.x + right.w <= bandR + 0.5 && left.x >= bandL - 0.5, 'הרומחים בתוך הפס');
  });

  it('מגילות H3-פס (h3Band) בשולי הפס — לא בשולי הטור הימני', () => {
    const r = run();
    const p = r.pages.find(pp => (pp.decorations || []).some(d => d.slot === 'h3-side-left' && d.kind === 'h3-side-ornament')
      && pp.columns.some(c => c.some(l => l.h3Band === true)));
    assert(p, 'עמוד עם פס H3 באמצע העמוד');
    const xs = p.template.columns.map(c => c.x);
    const xe = p.template.columns.map(c => c.x + c.w);
    const bandL = Math.min(...xs), bandR = Math.max(...xe);
    const scrolls = (p.decorations || []).filter(d => d.kind === 'h3-side-ornament');
    assert(scrolls.length >= 2, `מגילות H3 (${scrolls.length} ≥ 2)`);
    const leftScroll = scrolls.find(d => d.slot === 'h3-side-left');
    const rightScroll = scrolls.find(d => d.slot === 'h3-side-right');
    assertClose(leftScroll.x, bandL, 1.5, 'המגילה השמאלית בשפת הפס השמאלית');
    assertClose(rightScroll.x + rightScroll.w, bandR, 1.5, 'המגילה הימנית בשפת הפס הימנית');
  });

  it('חוזה הדיו: לכל עיטור SVG יש paint נטען (pyramid/lance/shoshanta/scroll)', () => {
    for (const kind of ['pyramid', 'lance', 'shoshanta', 'scroll']) {
      const ink = ornamentInk(kind);
      assert(ink && (ink.type === 'svg' || ink.type === 'rect' || ink.type === 'rule'), `דיו ל${kind}`);
    }
  });
});

report();
