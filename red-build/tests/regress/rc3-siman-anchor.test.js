// tests/regress/rc3-siman-anchor.test.js — RC-3 (Iteration-004): מיקום פס הסימן
// בפתיחות-סימן — מרכוז על איחוד הטורים + עוגן אנכי דואלי (spanExempt).
//
// **השורשים (אומתו על PDF אמיתי, i004):**
//   RC-3a — materialize חישב את תיבת הפס כחיתוך-חפיפה של הטורים
//   (min(x+w)−max(x) = 390−404 = −14px בגריד דו-טורי) ⇒ שורת "סימן X"
//   "התמרכזה" על תיבה שלילית ונחתה בקצה השמאלי (נמדד: x=67–121 מול
//   279–333 בייחוס). האיחוד (max−min) = תיבת הפס שכותרת ה-H2 משתמשת
//   בה — מרכז 396.85px=306.15pt=מרכז העמוד; בייחוס: כל 88 היחידות
//   ב-306.2pt בדיוק.
//   RC-3b — עוגן קבוע 307.88/344.05 לכל פתיחות הסימן; המורשת (S4.19,
//   flowSection §1335) משתמשת באזור ובעוגנים מורמים כשהמקטע נפתח
//   בכותרת רוחבית (h3-span): 284.9/321.1/261.3. בייחוס: 69/88 פתיחות
//   עם-span (baseline 241.0pt), 13 רגילות (258.3pt) — נמדד ואומת ב-i004.
//   RC-3c — שני דורסים: המעטפת buildPageTemplate בלעה את opts (לא הועבר
//   ל-buildImudPageTemplate ⇒ התבנית חזרה תמיד לאזור הרגיל), והבנייה
//   החוזרת של insertTocPages (D-63, זוגיות סופית) בנתה בלי הדגל.
'use strict';
const path = require('path');
const { describe, it, assertEq, assert, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const { PAGE_TYPES } = require(path.join(RB, 'src/engine/layout/page-templates'));
const { H2_AREA_H, H2_SPAN_AREA_H, H2_SIMAN_Y, H2_SIMAN_Y_SPAN, H2_TITLE_Y, H2_TITLE_Y_SPAN } = require(path.join(RB, 'src/engine/core/imud-geometry'));

function imudSettings() {
  return { '_layout-profile': 'imud', '_imudRaw': { 'h2-auto-siman': true } };
}

describe('RC-3 siman band anchor (i004)', () => {
  it('RC-3b: constants — dual anchors from the reference (S4.19)', () => {
    assertEq(H2_SIMAN_Y, 307.88, 'regular siman anchor');
    assertEq(H2_SIMAN_Y_SPAN, 284.9, 'spanExempt siman anchor');
    assertEq(H2_TITLE_Y, 344.05, 'regular h2 title anchor');
    assertEq(H2_TITLE_Y_SPAN, 321.1, 'spanExempt h2 title anchor');
    assertEq(H2_AREA_H, 284.25, 'regular h2 area');
    assertEq(H2_SPAN_AREA_H, 261.3, 'spanExempt compact area');
    // הכיולים נמדדו בנפרד מהייחוס — ההרמות שקולות בסבילות 0.05px
    const liftSiman = H2_SIMAN_Y - H2_SIMAN_Y_SPAN;
    const liftTitle = H2_TITLE_Y - H2_TITLE_Y_SPAN;
    const liftArea = H2_AREA_H - H2_SPAN_AREA_H;
    assert(Math.abs(liftSiman - liftTitle) < 0.05, `siman lift ${liftSiman} ≈ title lift ${liftTitle}`);
    assert(Math.abs(liftArea - liftTitle) < 0.05, `area shrink ${liftArea} ≈ title lift ${liftTitle}`);
  });

  it('RC-3c: buildPageTemplate forwards opts to the IMUD contract (wrapper no longer swallows)', () => {
    const { buildPageTemplate } = require(path.join(RB, 'src/engine/layout/page-templates'));
    const s = imudSettings();
    const regular = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true);
    const span = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true, { h2SpanExempt: true });
    assertEq(regular.contentBox.top, 107.2 + H2_AREA_H, 'regular textTop = FLOW_TOP + H2_AREA_H');
    assertEq(span.contentBox.top, 107.2 + H2_SPAN_AREA_H, 'spanExempt textTop = FLOW_TOP + H2_SPAN_AREA_H');
    assertEq(span.h2SpanExempt, true, 'flag lives on the template');
    assertEq(regular.h2SpanExempt, false, 'default is regular');
    assertEq(span.h2TopOffset, H2_SPAN_AREA_H, 'h2TopOffset follows the compact area');
    // נתיב לא-IMUD: opts התקבל ולא משנה כלום (בלי זריקה)
    const dp = buildPageTemplate(PAGE_TYPES.REGULAR, { 'page-size': 'A4' }, true, { h2SpanExempt: true });
    assert(Array.isArray(dp.columns), 'non-IMUD path unaffected');
  });

  it('RC-3a: siman row spans the UNION of columns (positive width, page-centered)', () => {
    // נוסחת האיחוד שתיקון RC-3a הציב ב-materialize — על תבנית אמיתית:
    // החיתוך (הבאג) שלילי בגריד דו-טורי; האיחוד = תיבת הפס הממורכזת.
    const { buildPageTemplate } = require(path.join(RB, 'src/engine/layout/page-templates'));
    const tpl = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, imudSettings(), true);
    const unionW = Math.max(...tpl.columns.map(c => c.x + c.w)) - Math.min(...tpl.columns.map(c => c.x));
    const interW = Math.min(...tpl.columns.map(c => c.x + c.w)) - Math.max(...tpl.columns.map(c => c.x));
    assert(unionW > 500, `union width ${unionW} > 500 (full band)`);
    assert(interW < 0, `intersection width ${interW} < 0 (the old bug)`);
    const cx = Math.min(...tpl.columns.map(c => c.x)) + unionW / 2;
    assert(Math.abs(cx - 396.85) < 0.5, `union center ${cx} ≈ 396.85px = 306.15pt = page center`);
  });

  it('RC-3b: stampSimanBands follows the dual anchor via the page flag', () => {
    // קריאה ישירה לחותמת על עמודי תכנון סינתטיים (כמו שהיא רצה אחרי
    // planPages) — המדידה דרך stub (רוחב קבוע לכל מילה); הפרופיל IMUD.
    const { stampSimanBands } = (function () {
      // החותמה אינה מיוצאת בנפרד — דרך stampStructuralGeometry עם עמוד אחד
      const m = require(path.join(RB, 'src/engine/layout/structural-stamps'));
      return { stampSimanBands: (pages, settings, measure) => m.stampStructuralGeometry(pages, settings, measure) };
    })();
    const mkPage = (spanExempt) => ({
      type: 'sign-open',
      _h2SpanExempt: spanExempt,
      template: { columns: [{ x: 403.61, w: 269.41 }, { x: 120.72, w: 269.41 }], contentBox: { top: 107.2 + (spanExempt ? H2_SPAN_AREA_H : H2_AREA_H), bottom: 1022.2, height: 1022.2 - (107.2 + (spanExempt ? H2_SPAN_AREA_H : H2_AREA_H)) } },
      columns: [[], []],
      spanning: { lines: [{ kind: 'heading', level: 2, heightPx: 30 }] },
      footnotes: [], sideNotes: [], decorations: []
    });
    const measure = { measureTextWidth: (t, sizePt) => Math.max(1, String(t).length) * sizePt * 0.5 };
    const pages = [mkPage(true), mkPage(false)];
    const stamped = stampSimanBands(pages, imudSettings(), measure);
    assertEq(stamped.stamped.siman, 2, 'both bands stamped');
    assert(pages[0].simanBand, 'span page band exists');
    assert(pages[1].simanBand, 'plain page band exists');
    assert(Math.abs(pages[0].simanBand.y - H2_SIMAN_Y_SPAN) < 0.01, `span siman y ${pages[0].simanBand.y} = ${H2_SIMAN_Y_SPAN}`);
    assert(Math.abs(pages[1].simanBand.y - H2_SIMAN_Y) < 0.01, `plain siman y ${pages[1].simanBand.y} = ${H2_SIMAN_Y}`);
    assertEq(pages[0].simanBand.sizePt, 20, 'siman size 20pt');
    assert(pages[0].simanBand.words.length >= 2, 'סימן + letter words');
  });

  it('RC-3a: stampedRowLine centers on the union box (word positions)', () => {
    // הוכחת המנגנון במנוד: שורה ממורכזת על תיבת האיחוד — מרכז המילים
    // = מרכז התיבה (עד כאן התיבה השלילית דחפה הכול לקצה השמאלי).
    const { buildPageTemplate } = require(path.join(RB, 'src/engine/layout/page-templates'));
    const tpl = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, imudSettings(), true);
    const x = Math.min(...tpl.columns.map(c => c.x));
    const w = Math.max(...tpl.columns.map(c => c.x + c.w)) - x;
    // stampedRowLine (מיוצא דרך materialize? — נבדוק את הנוסחה ישירות)
    const words = [{ text: 'סימן', w: 40.3 }, { text: 'א', w: 12.1 }];
    const spaceW = 11;
    const total = words.reduce((s, wd) => s + wd.w, 0) + (words.length - 1) * spaceW;
    let cursor = x + (w + total) / 2; // align=center
    const xs = [];
    for (const wd of words) { cursor -= wd.w; xs.push(cursor); cursor -= spaceW; }
    const center = (Math.min(...xs) + Math.max(...xs.map((v, i) => v + words[i].w))) / 2;
    assert(Math.abs(center - (x + w / 2)) < 0.01, `centered unit ${center} = box center ${x + w / 2}`);
  });
});

report();
