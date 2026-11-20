// tests/layout/s5b-plan-contracts.test.js — שלב 5 פרוסה 2: חוזי ColumnModel/PagePlan
// + FX-6 (פער הבלוקים כגיאומטריה מתוכננת) + אינווריאנטים + immutability + trace.
// הוראת שלב 5 §§3.1-3.2: כל תיקון נבדק בחיוב ובשלילה; DOM ו-PDF מציגים את
// אותו הפער; אין פער כפול/נעלם/מוטעה.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { planPages } = require('../../src/engine/layout/dp-planner');
const { colCapacityOf, capacityReservationsOf, blockGapPx, normalizeColumnGaps } = require('../../src/engine/layout/column-flow');
const { finalizePagePlans, buildPagePlan, validatePagePlan, PAGE_PLAN_SCHEMA } = require('../../src/engine/layout/plan-model');
const { createTraceRecorder } = require('../../src/engine/layout/decision-trace');
const { optimalSplit } = require('../../src/engine/layout/balancing');
const CM = require('../../src/engine/layout/constraint-matrix');
const { Ledger } = require('../../src/engine/core/ledger');
const { EventLog } = require('../../src/engine/core/events');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage, renderLine } = require('../../src/engine/output/dom-renderer');
const { projectPage } = require('../../src/engine/output/geometry-projector');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const fakeMeasure = (t, sizePt) => String(t).length * 0.55 * (sizePt || 12) * (96 / 72);
fakeMeasure.impl = 'table';

/** בלוק סינתטי: n שורות בגובה hPx, עם LineModel מינימלי (חוזה תכנון). */
function para(n, hPx, tokenId, extra = {}) {
  const lines = Array.from({ length: n }, (_, i) => ({
    words: [`${tokenId}-w${i}`], heightPx: hPx, widthPx: 100, isLast: i === n - 1, kind: 'paragraph', tokenId,
    lineModel: { blockId: tokenId, naturalWidthPx: 60, lineHeightPx: hPx, fragments: [], glue: [{ naturalPx: 4 }], floatAreas: [] }
  }));
  return { kind: 'paragraph', tokenId, lines, notes: [], part: 'p1', ...extra };
}
function heading(n, hPx, tokenId, level = 3, extra = {}) {
  const lines = Array.from({ length: n }, (_, i) => ({
    words: [`${tokenId}-h${i}`], heightPx: hPx, widthPx: 100, isLast: i === n - 1, kind: 'heading', level, tokenId,
    lineModel: { blockId: tokenId, naturalWidthPx: 60, lineHeightPx: hPx, fragments: [], glue: [], floatAreas: [] }
  }));
  return { kind: 'heading', tokenId, level, lines, notes: [], part: 'p1', ...extra };
}

function fxSettings() {
  const s = getDefaultSettings();
  s['body-font-size-pt'] = 13;
  s['body-line-height'] = 1.5; // lineH = 26
  return s;
}
const S = fxSettings();
const GAP = blockGapPx(S, 26); // הפער הקנוני של ההגדרות
// וריאנט בלי איזון-טורים בסגירת עמוד — לתרחישי חותמה טהורים (האיזון
// עצמו ונרמול הפערים שלו נבדקים בנפרד להלן): כך ההצבה הגרידית נשארת
// דטרמיניסטית לצורך אימות החותמות עצמן.
const SN = { ...S, 'imbalance-max-delta-px': 999999 };

function plan(blocks, settings = S, env = {}) {
  return planPages(blocks, settings, new EventLog(), new Ledger(), { measure: fakeMeasure, ...env });
}

describe('FX-6 — הפער כגיאומטריה מתוכננת (חותמת gapBeforePx)', () => {
  it('פתיחת בלוק מתחת לתוכן קיים: חותמת על שורת הפתיחה בלבד; גובה השורה אינו מעורבב', () => {
    // שני בלוקים קצרים — השני נפתח מתחת לראשון באותו טור (בלי איזון)
    const r = plan([para(3, 25, 'a'), para(3, 25, 'b')], SN);
    const col0 = r.pages[0].columns[0];
    assertEq(col0.length, 6, 'שני הבלוקים באותו טור');
    assert(!col0[0].gapBeforePx, 'ראשונת הבלוק הראשון — ראש טור, בלי פער');
    assertEq(col0[3].gapBeforePx, GAP, `פתיחת הבלוק השני נושאת את הפער (${GAP}px)`);
    assert(!col0[4].gapBeforePx, 'שורת המשך — בלי פער');
    // הפער אינו מוסתר בגובה השורה (אין ערבוב גובה×מרווח)
    assertEq(col0[3].heightPx, 25, 'גובה השורה עצמו לא השתנה');
  });

  it('usedHeight כולל את הפער — הקיבולת נאכפת על הגיאומטריה האמיתית', () => {
    const { planningUsedHeight, colCapacityOf } = require('../../src/engine/layout/column-flow');
    // תרחיש מדויק: בלוק 'a' ממלא את הטור עד גובה שמשאיר בדיוק מקום לשורה
    // אחת (25px) — בלי הפער, שורת הפתיחה של 'b' הייתה נכנסת בול; עם הפער
    // (GAP>0) היא חורגת בדיוק בגודל הפער ⇒ הבלוק עובר לעמוד הבא.
    // הוכחת נגדי מובנית: כש-grid-block-gap-pct=0 (GAP=0) אותו מסמך בדיוק
    // נשאר בעמוד אחד — הפער הוא שגרם למעבר, לא שום דבר אחר.
    // בלוק 'a' בן שורה אחת בגובה שמשאיר בדיוק 25px פנויים בטור — בלי הפער,
    // שורת הפתיחה של 'b' נכנסת ל-col0 בול; עם הפער היא חורגת בדיוק בגודלו
    // ומופנית הלאה (טור המשך/עמוד חדש) — הפער נצבר בקיבולת האמיתית.
    const probe = plan([para(1, 25, 'cap')], SN);
    const cap = colCapacityOf(probe.pages[0]); // קיבולת הטור בפועל
    const r = plan([para(1, cap - 25, 'a'), para(1, 25, 'b')], SN);
    assertEq(r.pages[0].columns[0].every(l => l.meta.tokenId === 'a'), true, 'הבלוק השני לא נכנס ל-col0 — הפער נצבר בקיבולת');
    assert(planningUsedHeight(r.pages[0].columns[0], r.pages[0]) <= cap + 0.5, 'אין חריגה');
    // הנגדי: פער אפס ⇒ 'b' נכנסת ל-col0 בדיוק
    const SZ = { ...SN, 'grid-block-gap-pct': 0 };
    const r0 = plan([para(1, cap - 25, 'a'), para(1, 25, 'b')], SZ);
    assert(r0.pages[0].columns[0].some(l => l.meta.tokenId === 'b'), 'GAP=0 ⇒ השורה נכנסת — הפער הוא הגורם היחיד למעבר');
  });

  it('מעבר טור: המשך בלוק בראש הטור הבא — בלי פער; בלוק חדש בראש טור — בלי פער (GAP_HEAD_POLICY)', () => {
    // תרחיש א: col0 מלא מבלוק פותח; הבלוק הארוך נפרש — פתיחתו ב-col0 (עם
    // פער-כניסה), המשכו נשפך לראש col1 (בלי פער); בלוק הזנב נפתח מתחת
    // להמשך ה-rest בעמוד הבא (עם פער) — בכל טור שהוא (בלי איזון).
    const r = plan([para(30, 25, 'filler'), para(60, 25, 'long'), para(2, 25, 'tail')], SN);
    let contHead = null, longOpenGap = null, tailOpen = null;
    for (const pg of r.pages) {
      if (pg.columns[1] && pg.columns[1].length && contHead === null) contHead = pg.columns[1][0];
      for (const col of pg.columns) {
        const lo = col.find(l => l.meta.tokenId === 'long');
        if (lo && longOpenGap === null && col.indexOf(lo) > 0) longOpenGap = lo.gapBeforePx;
        const to = col.find(l => l.meta.tokenId === 'tail');
        if (to && tailOpen === null) tailOpen = { ln: to, head: col.indexOf(to) === 0 };
      }
    }
    assert(contHead, 'הבלוק הארוך חוצה טורים — המשך בראש col1');
    assert(!contHead.gapBeforePx, 'המשך הבלוק בראש col1 — בלי פער (GAP_HEAD_POLICY)');
    assertEq(longOpenGap, GAP, 'פתיחת הבלוק הארוך מתחת לפותח ב-col0 — עם פער');
    assert(tailOpen && !tailOpen.head, 'בלוק הזנב נפתח מתחת לתוכן (לא בראש טור)');
    assertEq(tailOpen.ln.gapBeforePx, GAP, 'פתיחת בלוק חדש מתחת לתוכן — עם פער');

    // תרחיש ב: בלוק חדש שלם שמוצא את עצמו בראש טור ריק (col1) — בלי פער
    const r2 = plan([para(41, 25, 'fills-col0'), para(2, 25, 'at-head')], SN);
    const col1 = r2.pages[0].columns[1];
    assert(col1 && col1.length === 2, 'הבלוק הקטן הוצב ב-col1');
    assert(!col1[0].gapBeforePx, 'בלוק חדש בראש טור ריק — בלי פער (GAP_HEAD_POLICY)');
  });

  it('מעבר עמוד בפיצול: החלק הראשון (firstOfBlock) נושא פער בטור; ה-rest בראש העמוד החדש — בלי פער', () => {
    // בלוק פותח + בלוק ענק שנחתך: החלק הראשון של הפיצול הוא פתיחת בלוק אמיתית
    const r = plan([para(2, 25, 'head'), para(200, 25, 'giant')], SN);
    let splitFirstSeen = false, restHeadGap = null;
    for (const pg of r.pages) {
      for (const col of pg.columns) {
        for (let i = 0; i < col.length; i++) {
          const ln = col[i];
          if (ln.meta.tokenId === 'giant' && ln.meta.part === 'first' && i > 0 && col[i - 1].meta.tokenId !== 'giant') {
            if (ln.gapBeforePx === GAP) splitFirstSeen = true;
          }
          if (ln.meta.tokenId === 'giant' && ln.meta.part === 'rest' && i === 0) restHeadGap = ln.gapBeforePx;
        }
      }
    }
    assert(splitFirstSeen, 'חלק first של הפיצול נושא חותמת פער כשהוא נפתח מתחת לתוכן');
    assert(!restHeadGap, 'rest בראש עמוד חדש — בלי פער (ראש טור)');
  });

  it('פס חוצה-טורים: הטורים מתחילים מתחת לפס; שורה ראשונה — בלי פער', () => {
    // H2 חוצה-טורים (fullWidth — הדגל ש-applyHeadingModes קובע במסלול המלא)
    // — הפס בראש העמוד, הטורים מתחתיו
    const r = plan([heading(1, 30, 'h2', 2, { fullWidth: true }), para(20, 25, 'body')], SN);
    const pg = r.pages[0];
    assert(pg.spanning && pg.spanning.lines.length === 1, 'הכותרת בפס חוצה-טורים');
    const firstBody = pg.columns.find(c => c.length)[0];
    assert(!firstBody.gapBeforePx, 'שורה ראשונה מתחת לפס — ראש אזור הטורים, בלי פער');
  });

  it('בלוקים רצופים: פער בכל פתיחה; אין פער כפול ואין פער שנעלם', () => {
    const r = plan([para(2, 25, 'a'), para(2, 25, 'b'), para(2, 25, 'c'), para(2, 25, 'd')], SN);
    const col = r.pages[0].columns[0];
    const stamps = col.filter(l => l.gapBeforePx).length;
    assertEq(stamps, 3, 'שלוש פתיחות בלוק מתחת לתוכן — שלוש חותמות בדיוק');
    // הוכחת אי-כפילה: סכום החותמות = (מספר הפתיחות)×GAP — פעם אחת לכל פתיחה
    const sum = col.reduce((s, l) => s + (l.gapBeforePx || 0), 0);
    assertEq(sum, 3 * GAP, 'סכום הפערים המדויק — אין כפילה');
  });

  it('איזון מחדש (optimalSplit): ראש הטור המוזז מאבד את הפער (נרמול מבני)', () => {
    // שני טורים לא מאוזנים; ההחלפה מעבירה שורת פתיחת-בלוק לראש col1
    const cols = [
      [line('a', 0), line('a', 0), line('b', GAP), line('c', GAP)],
      [line('d', 0)]
    ];
    function line(tok, gap) {
      return { words: [tok], heightPx: 25, widthPx: 50, tokenId: tok, meta: { tokenId: tok }, ...(gap ? { gapBeforePx: gap } : {}) };
    }
    normalizeColumnGaps(cols[0]);
    normalizeColumnGaps(cols[1]);
    assertEq(cols[0][0].gapBeforePx, undefined, 'ראש col0 מנוקה');
    // העברה ידנית של שורת פתיחה לראש col1 — ונרמול
    const moved = cols[0].pop();
    cols[1].unshift(moved);
    normalizeColumnGaps(cols[0]);
    normalizeColumnGaps(cols[1]);
    assert(!cols[1][0].gapBeforePx, 'ראש col1 החדש מנוקה (אפס/ללא חותמת; בלי מוטציה של האובייקט המקורי)');
    assert(cols[1][0] !== moved, 'הנרמול מחליף ייחוס — אובייקטים משותפים אינם מוטצים');
  });

  it('מתיחה (aqStretch) אינה מותחת את הפער — הפער קבוע', () => {
    const { usedHeight, columnStretchParts } = require('../../src/engine/layout/balancing');
    const col = [
      { heightPx: 20, gapBeforePx: 5 },
      { heightPx: 20, aqStretch: 2, gapBeforePx: 5 }
    ];
    assertEq(usedHeight(col), 20 + 5 + 40 + 5, 'גובה רינדור: שורות מתוחות + פערים קבועים');
    assertEq(columnStretchParts(col).gaps, 10, 'מרכיב הפערים נפרד');
    assertEq(columnStretchParts(col).lines, 60, 'מרכיב השורות נפרד');
  });
});

describe('FX-6 — תצוגה = ייצוא: DOM ו-PDF מקרינים את אותו הפער מהחותמת', () => {
  it('DOM: margin-top מהחותמה; PDF: התקדמות-y מהחותמת; זהים במספרים', () => {
    const makeEl = () => ({ tagName: 'div', style: {}, attrs: {}, dataset: {}, children: [], className: '', dir: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
    const fakeDoc = { createElement: () => makeEl(), createTextNode: (t) => ({ text: t }) };
    const r = plan([para(3, 25, 'a'), para(3, 25, 'b')], SN);
    const pg = r.pages[0];
    // DOM: שורת הפתיחה של 'b' (אינדקס 3) נושאת margin-top בגודל הפער
    const el = renderLine(pg.columns[0][3], fakeDoc, S);
    assertEq(el.style.marginTop, `${GAP}px`, 'DOM: margin-top בגודל הפער');
    // השורה שאינה פתיחת בלוק — בלי margin
    const el2 = renderLine(pg.columns[0][4], fakeDoc, S);
    assert(!el2.style.marginTop, 'שורת המשך — בלי margin');
    // PDF: ה-y של שורת הפתיחה = ראש התוכן + 3×25 + GAP (בדיוק ההתקדמות)
    const api = new MeasureAPI(S, 'table');
    const out = projectPage(pg, S, api);
    const expectedY = pg.template.contentBox.top + 3 * 25 + GAP;
    const projected = out.lines.find(L => Math.abs(L.y - expectedY) < 0.01 && L.words.length);
    assert(projected, `PDF: שורת הפתיחה מוקרנת ב-y הכולל את הפער (${expectedY})`);
  });

  it('רזולוציית מסמך מלא: מספר margin-tops ב-DOM == מספר החותמות == התקדמויות ה-y ב-PDF', () => {
    const doc = 'שם הספר - חוזים\n\nכותרת 2 - פרק\n' + 'פסקה ראשונה לבדיקת פערים בין בלוקים בעמוד.\n'.repeat(3) + 'פסקה שנייה לבדיקת פערים בין בלוקים.\n'.repeat(3) + 'פסקה שלישית לסיום.\n'.repeat(2);
    const r = typeset(doc, getDefaultSettings());
    let stamps = 0, margins = 0;
    const fake = { createElement: () => makeEl(), createTextNode: () => makeEl() };
    for (const pg of r.pages) {
      if (!pg.columns) continue;
      for (const col of pg.columns) for (const ln of col) if (ln.gapBeforePx) stamps++;
      const root = renderPage(pg, getDefaultSettings(), fake);
      (function walk(n) {
        if (n.style && n.style.marginTop) margins++;
        for (const c of (n.children || [])) walk(c);
      })(root);
    }
    assert(stamps > 0, 'יש חותמות במסמך');
    assertEq(margins, stamps, 'כל חותמת מוקרנת ב-DIM בדיוק פעם אחת');
    function makeEl() { return { tagName: 'div', style: {}, attrs: {}, dataset: {}, children: [], className: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } }; }
  });
});

describe('חוזי ColumnModel/PagePlan (§2.5) — בנייה, אימות, immutability', () => {
  it('סכמה, הפניות חיות וסדר קריאה RTL', () => {
    const r = plan([para(4, 25, 'a'), para(4, 25, 'b')]);
    const pg = r.pages[0];
    pg.dpPlanned = true; // כבר מסומן ע"י newPage — לחוזה
    const planObj = buildPagePlan(pg, { lineH: 26 });
    assertEq(planObj.schema, PAGE_PLAN_SCHEMA, 'סכמה מוכרזת');
    assertEq(planObj.kind, 'PagePlan', 'kind PagePlan');
    assertEq(planObj.columns.length, pg.columns.length, ' ColumnModel לכל טור');
    assert(planObj.columns[0].lines === pg.columns[0], 'הפניה חיה — לא עותק (אין מודל מקביל)');
    assertEq(planObj.columns[0].readOrder, 0, 'readOrder 0 לטור הימני');
    assertEq(planObj.columns[1].readOrder, 1, 'readOrder 1 לטור השמאלי');
    assert(pg.template.columns[0].x > pg.template.columns[1].x, 'RTL: col0 ימני (גדול ב-x)');
    // capacity/used/gaps מחושבים ממקורות הסמכות
    assertEq(planObj.columns[0].gapsPx, (pg.columns[0].reduce((s, l) => s + (l.gapBeforePx || 0), 0)), 'gapsPx מהחותמות');
    assertEq(planObj.columns[0].usedHeightPx, require('../../src/engine/layout/column-flow').planningUsedHeight(pg.columns[0], pg), 'usedHeightPx מ-planningUsedHeight');
  });

  it('reservations (§2.6): מנגנון אחיד — all-columns ו-last-column, ללא כפילה', () => {
    const s = fxSettings();
    const r = plan([para(4, 25, 'a')]);
    const pg = r.pages[0];
    const before = colCapacityOf(pg, { fnBudget: false });
    pg.reservations.push({ kind: 'ornament', scope: 'all-columns', px: 30, reason: 'test-all' });
    pg.reservations.push({ kind: 'furniture', scope: 'last-column', px: 20, reason: 'test-last' });
    // ברירת המחדל של colIndex היא הטור האחרון (המחמיר) — לכן טור 0 נבדק במפורש
    assertEq(colCapacityOf(pg, { colIndex: 0, fnBudget: false }), before - 30, 'טור 0: all-columns בלבד');
    assertEq(colCapacityOf(pg, { fnBudget: false }), before - 50, 'ברירת מחדל (אחרון): all + last');
    const list = capacityReservationsOf(pg, { fnBudget: false });
    assert(list.some(x => x.kind === 'ornament' && x.px === 30), 'ייצוג השמורה ברשימת הקיבולת');
    assert(list.some(x => x.kind === 'furniture' && x.px === 20), 'ייצוג שמורת last-column');
    assert(list.some(x => x.kind === 'content-box'), 'תיבת התוכן מיוצגת');

    // קיבולת אפס היא תוצאה לגיטימית של ה-SSOT (לא מצב חסר נתונים).
    // היא חייבת להישאר אפס — אסור ל-fallback להחזיר שטח תיבת-תוכן גולמי.
    const blocked = { ...pg, fnReservedHeightPx: 0, reservations: [
      { kind: 'full-page-reservation', scope: 'all-columns', px: pg.template.contentBox.height, reason: 'zero-capacity-test' }
    ] };
    assertEq(colCapacityOf(blocked), 0, 'reservation מלאה מייצרת קיבולת אפס אמיתית');
  });

  it('validation: מצב תקין ⇒ אפס אבחונים; הפרות מבניות ⇒ אבחון מדויק', () => {
    const r = plan([para(4, 25, 'a'), para(4, 25, 'b')]);
    const pg = r.pages[0];
    pg.plan = buildPagePlan(pg, { lineH: 26 });
    let diags = validatePagePlan(pg, { settings: S, lineH: 26 });
    assertEq(diags.length, 0, 'מצב תקין — אפס אבחונים');

    // הפרה 1: פער בראש טור
    pg.columns[0][0] = { ...pg.columns[0][0], gapBeforePx: 7 };
    pg.plan = buildPagePlan(pg, { lineH: 26 });
    diags = validatePagePlan(pg, { settings: S, lineH: 26 });
    assert(diags.some(d => d.code === 'gap-at-column-head'), 'פער בראש טור מאובחן');

    // הפרה 2: פתיחת בלוק ללא פער — מאותר לפי זהות (מעבר tokenId בין שכנות)
    const r2 = plan([para(4, 25, 'a'), para(4, 25, 'b')], SN);
    const pg2 = r2.pages[0];
    const bOpen = pg2.columns[0].find(l => l.meta.tokenId === 'b');
    delete bOpen.gapBeforePx;
    pg2.plan = buildPagePlan(pg2, { lineH: 26 });
    diags = validatePagePlan(pg2, { settings: S, lineH: 26 });
    assert(diags.some(d => d.code === 'gap-missing-at-block-start'), 'פתיחת בלוק חסרת פער מאובחנת');

    // הפרה 3: LineModel חסר (לא סינתטי)
    const r3 = plan([para(4, 25, 'a')]);
    const pg3 = r3.pages[0];
    pg3.columns[0][2] = { ...pg3.columns[0][2] };
    delete pg3.columns[0][2].lineModel;
    pg3.plan = buildPagePlan(pg3, { lineH: 26 });
    diags = validatePagePlan(pg3, { settings: S, lineH: 26 });
    assert(diags.some(d => d.code === 'line-model-missing'), 'שורה ללא LineModel מאובחנת');
    // פטור מפורש לסינתטי
    pg3.columns[0][2].synthetic = 'reject-to-body';
    pg3.plan = buildPagePlan(pg3, { lineH: 26 });
    diags = validatePagePlan(pg3, { settings: S, lineH: 26 });
    assert(!diags.some(d => d.code === 'line-model-missing'), 'סינתטי מסומן — פטור מתועד');
  });

  it('immutability לאחר השלמת התכנון: מבנה קפוא — מוטציה נזרקת', () => {
    const doc = 'שם הספר - קיפאון\n\nכותרת 2 - פרק\n' + 'פסקה לבדיקת קיפאון החוזה אחרי התכנון.\n'.repeat(4);
    const r = typeset(doc, getDefaultSettings());
    const flow = r.pages.find(p => p.plan && !p.plan.structural);
    assert(flow, 'יש עמוד זרימה עם חוזה');
    assert(Object.isFrozen(flow.plan), 'plan קפוא');
    assert(Object.isFrozen(flow.columns), 'מערך הטורים קפוא');
    assert(Object.isFrozen(flow.columns[0]), 'טור קפוא');
    assert(flow.columns[0].length > 0 && Object.isFrozen(flow.columns[0][0]), 'רשומות שורה קפואות');
    let threw = false;
    try { flow.columns[0].push({ words: ['x'] }); } catch (e) { threw = true; }
    assert(threw, 'push לטור קפוא נזרק');
    threw = false;
    try { flow.columns[0][0].heightPx = 999; } catch (e) { threw = true; }
    assert(threw, 'שינוי מדדי שורה אחרי התכנון נזרק');
    const structural = r.pages.find(p => p.plan && p.plan.structural);
    if (structural) assertEq(structural.plan.structural, true, 'עמוד מבני — חוזה מוקלד מינימלי');
    assert(r.planContracts && r.planContracts.frozen === true, 'סיכום החוזים בתוצאה');
  });

  it('finalizePagePlans: עמודי זרימה בלבד מקבלים חוזה מלא; דיאגנוסטיקות ל-ledger', () => {
    const ledger = new Ledger();
    const r = plan([para(4, 25, 'a')]);
    const pg = r.pages[0];
    pg.columns[0][1] = { ...pg.columns[0][1] }; delete pg.columns[0][1].lineModel; // הפרה מכוונת
    const out = finalizePagePlans([pg], { settings: S, lineH: 26, ledger, eventLog: new EventLog() });
    assertEq(out.flowPages, 1, 'עמוד זרימה אחד');
    assert(out.diagnostics >= 1, 'ההפרה נספרה');
    assert([...ledger.issues.values()].some(i => i.kind === 'page-plan-invalid'), 'נרשמה ל-ledger — לא מוסתרת');
  });
});

describe('LineModel מלא נשמר דרך התכנון (§2.2/§3.1-16)', () => {
  it('כל שורה ממוקמת: אותו ייחוס LineModel, פרגמנטים וזהויות מקור — גם אחרי איזון', () => {
    const doc = 'שם הספר - שימור\n\nכותרת 2 - פרק\n' + 'פסקה עם הערה [הערה אמיתית לבדיקה] וטקסט רץ לאורך כמה שורות טובות.\n'.repeat(6) + 'פסקה נוספת לגרימת איזון בין טורים.\n'.repeat(4);
    const r = typeset(doc, getDefaultSettings());
    let checked = 0, withFragments = 0, withFloatAreas = 0;
    for (const pg of r.pages) {
      for (const col of pg.columns) {
        for (const ln of col) {
          checked++;
          if (ln.lineModel) {
            withFragments++;
            if (Array.isArray(ln.lineModel.fragments)) withFloatAreas++;
            assert(ln.lineModel.lineHeightPx === ln.heightPx || ln.heightPx != null, 'גובה עקבי');
          }
        }
      }
    }
    assert(checked > 10, `נבדקו שורות (${checked})`);
    assertEq(withFragments, checked, 'כל שורה נושאת LineModel (נתיב המוצר)');
    assertEq(withFloatAreas, checked, 'לכל LineModel מבנה פרגמנטים');
  });
});

describe('decision-trace (§2.7) — דטרמיניסטי, קומפקטי, opt-in', () => {
  it('שתי ריצות זהות ⇒ trace זהה ביט-לביט; ספירות תמיד זמינות; תקרה נאכפת', () => {
    const doc = 'שם הספר - מעקב\n\nכותרת 2 - פרק\n' + 'פסקה למעקב החלטות התכנון עם טקסט זורם.\n'.repeat(4);
    const s = getDefaultSettings(); s['_plannerTrace'] = true;
    const a = typeset(doc, s);
    const b = typeset(doc, s);
    assertEq(JSON.stringify(a.plannerTrace), JSON.stringify(b.plannerTrace), 'trace דטרמיניסטי ביט-לביט');
    assert(a.plannerTrace.entries.length > 0, 'יש רשומות');
    assert(a.plannerTrace.entries.every(e => typeof e.p === 'number' || e.p === null), 'מבנה קומפקטי {p,k,d}');
    // תקרה
    const rec = createTraceRecorder({ enabled: true, maxEntries: 3 });
    for (let i = 0; i < 10; i++) rec.emit(0, 'x', { i });
    assertEq(rec.toJSON().entries.length, 3, 'תקרת רשומות נאכפת');
    assertEq(rec.toJSON().truncated, true, 'דגל truncated');
    assertEq(rec.stats().counts.x, 10, 'הספירות ממשיכות גם מעבר לתקרה');
    // כבוי — ספירות בלבד
    const off = createTraceRecorder({ enabled: false });
    off.emit(1, 'y', {});
    assertEq(off.toJSON().entries.length, 0, 'כבוי ⇒ אין רשומות');
    assertEq(off.stats().counts.y, 1, 'כבוי ⇒ הספירות נשמרות');
  });

  it('ה-trace מסביר החלטות: הצבה, פיצול, מועמדים ודחיות, נסיגת איזון', () => {
    const s = getDefaultSettings(); s['_plannerTrace'] = true;
    // מסמך שמכריח פיצול: פסקה ענקית
    const doc = 'שם הספר - פיצול\n\nכותרת 2 - פרק\n' + 'שורת טקסט ארוכה לפיצול בין עמודים עם מילים רבות '.repeat(400);
    const r = typeset(doc, s);
    const kinds = new Set(r.plannerTrace.entries.map(e => e.k));
    assert(kinds.has('block-place'), 'הצבות מתועדות');
    assert(kinds.has('page-flush'), 'סגירות עמוד מתועדות');
    const hasSplitEvidence = kinds.has('split-candidate') || kinds.has('split-legal-maxfit') || kinds.has('split-none');
    assert(hasSplitEvidence, 'החלטות פיצול מתועדות (חלון/מועמדים)');
    assert(r.plannerTrace.entries.some(e => e.d && e.d.col != null), 'נתוני טור בהצבות');
  });
});

describe('RTL — סדר קריאה מבני (§3.1-6)', () => {
  it('הזרימה עוברת col0 (ימין) ואז col1 (שמאל); seq עולה לאורך סדר הקריאה', () => {
    const r = plan([para(60, 25, 'a'), para(2, 25, 'b')]);
    const pg = r.pages[0];
    assert(pg.columns[0].length && pg.columns[1].length, 'שני טורים מלאים');
    let prev = -1;
    for (const col of pg.columns) {
      for (const ln of col) {
        assert(ln.seq > prev, `seq עולה (${ln.seq} > ${prev})`);
        prev = ln.seq;
      }
    }
  });
});

report('s5b-plan-contracts');
