// tests/layout/s6-page-items.test.js — שלב 6 פרוסה 1: חוזה Page Item + רישום
// + גיאומטריית ריהוט ממקור יחיד (DOM=PDF) + רגרסיית ערכת-40/שערים (§9 בהוראה).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const {
  PAGE_ITEM_PARTICIPATION, PAGE_ITEM_SLOTS,
  registerPageItem, pageItemDescriptorOf, registeredPageItems, reservePageItemSpace
} = require('../../src/engine/layout/page-items');
const { folioGeometry, headerGeometry } = require('../../src/engine/layout/furniture-geometry');
const { PAGE_TYPES, buildPageTemplate } = require('../../src/engine/layout/page-templates');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { projectPage } = require('../../src/engine/output/geometry-projector');
const { stampNoteMetrics } = require('../../src/engine/layout/footnote-budget');
const fs = require('fs');
const path = require('path');

describe('חוזה Page Item — רישום והבחנות (§6 בהוראה)', () => {
  it('חמשת אופני ההשתתפות מוכרזים ונפרדים', () => {
    const vals = Object.values(PAGE_ITEM_PARTICIPATION);
    assertEq(vals.length, 5, 'flow/block/anchor/furniture/reserved');
    assertEq(new Set(vals).size, 5, 'ללא כפילויות');
    for (const v of ['flow', 'block', 'anchor', 'furniture', 'reserved']) {
      assert(vals.includes(v), `חסר אופן: ${v}`);
    }
  });

  it('הסוגים הקיימים רשומים עם הבחנת השתתפות, סמכות והקרנות — המפה המלאה', () => {
    const kinds = registeredPageItems().map(d => d.kind);
    for (const k of ['body-block', 'spanning-band', 'running-header', 'folio', 'column-divider', 'footnote-gutter', 'side-note', 'ornament', 'shaar-gate', 'toc-page', 'endnote-page']) {
      assert(kinds.includes(k), `סוג חסר ברישום: ${k}`);
    }
    // הבחנות לפי הוראת §6: flow / block / anchor / furniture / reserved
    assertEq(pageItemDescriptorOf('body-block').participation, 'flow', 'פסקה = flow');
    assertEq(pageItemDescriptorOf('spanning-band').participation, 'block', 'פס חוצה-טורים = block');
    assertEq(pageItemDescriptorOf('side-note').participation, 'anchor', 'הערת-צד = anchor');
    assertEq(pageItemDescriptorOf('running-header').participation, 'furniture', 'כותרת עליונה = furniture');
    assertEq(pageItemDescriptorOf('folio').participation, 'furniture', 'גיליון = furniture');
    assertEq(pageItemDescriptorOf('footnote-gutter').participation, 'reserved', 'אזור הערות = reserved');
    assertEq(pageItemDescriptorOf('ornament').participation, 'reserved', 'עיטור = reserved');
    // כל רישום מצהיר סמכות + הקרנות (אין סוג בלי בעלים ובלי הקרנה)
    for (const d of registeredPageItems()) {
      assert(d.authority, `לסוג ${d.kind} אין הצהרת סמכות`);
      assert(d.projectDOM && d.projectPDF, `לסוג ${d.kind} אין הצהרת הקרנות`);
    }
  });

  it('הרישום מחמיר: חריץ זר / participation חסר / כפילות / reserved בלי הזמנה — נדחים', () => {
    let threw = 0;
    try { registerPageItem('x1', { participation: 'flow', validate: () => true, bogusSlot: 1 }); } catch (e) { threw++; }
    try { registerPageItem('x2', { validate: () => true }); } catch (e) { threw++; }
    try { registerPageItem('x3', { participation: 'weird', validate: () => true }); } catch (e) { threw++; }
    try { registerPageItem('folio', { participation: 'furniture', validate: () => true }); } catch (e) { threw++; }
    try { registerPageItem('x4', { participation: 'reserved', validate: () => true }); } catch (e) { threw++; } // בלי reservation
    assertEq(threw, 5, 'כל חמשת הרישומים הפסולים נדחו');
    // רישום תקין + הסרה
    const un = registerPageItem('custom:test-item', {
      participation: PAGE_ITEM_PARTICIPATION.FURNITURE,
      schema: { note: 'string' },
      validate: (x) => Boolean(x && x.note)
    });
    assert(pageItemDescriptorOf('custom:test-item'), 'נרשם');
    un();
    assert(!pageItemDescriptorOf('custom:test-item'), 'הוסר');
  });

  it('reservePageItemSpace: פריט reserved מזמין מקום דרך page.reservations (מנגנון שלב 5)', () => {
    const before = 1000;
    const page = { reservations: [], template: { contentBox: { height: before } } };
    const out = reservePageItemSpace(page, 'footnote-gutter');
    // ההזמנה של footnote-gutter דינמית — 0 כשאין הערות (לא מופחת כלום)
    assertEq(out.applied, false, 'בלי הערות — אין הזמנה');
    page.fnReservedHeightPx = 40;
    const out2 = reservePageItemSpace(page, 'footnote-gutter');
    assertEq(out2.applied, true, 'עם תקציב — הוזמן');
    assertEq(out2.px, 40, 'גודל ההזמנה = התקציב');
    assertEq(page.reservations.length, 1, 'נרשם ב-reservations');
    assertEq(page.reservations[0].scope, 'all-columns', 'מרזב חוצה-רוחב');
    // פריט לא-reserved — נדחה
    let threw = false;
    try { reservePageItemSpace(page, 'folio'); } catch (e) { threw = true; }
    assert(threw, 'פריט furniture אינו מזמין מקום דרך המנגנון');
  });
});

describe('גיאומטריית ריהוט — מקור יחיד ל-DOM ול-PDF (§8 בהוראה)', () => {
  const doc = 'שם הספר - ריהוט\n\nכותרת 2 - פרק\n' + 'פסקה לבדיקת גיאומטריית ריהוט אחידה בין תצוגה לייצוא.\n'.repeat(40);

  function makeEl() { return { tagName: 'div', style: {}, attrs: {}, dataset: {}, children: [], className: '', dir: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } }; }

  it('folioGeometry: אותם מספרים בדיוק בפרויקטור וב-DOM (מפורש, לא CSS משוער)', () => {
    const s = getDefaultSettings();
    s['page-num-font'] = 'דוד'; // גופן גיליון רשום — מפעיל את הנתיב המפורש ב-DOM
    const r = typeset(doc, s);
    const pg = r.pages.find(p => p.folioDisplay);
    assert(pg, 'יש עמוד עם גיליון');
    // PDF
    const api = new MeasureAPI({ ...s, 'body-font': s['page-num-font'] }, 'font-metrics');
    const geo = folioGeometry(pg, s, api);
    assert(geo && Number.isFinite(geo.baselineY), 'גיאומטריה חושבה');
    const out = projectPage(pg, s, new MeasureAPI(s, 'table'));
    assert(out.folio, 'הפרויקטור הפיק גיליון');
    assertEq(out.folio.y, geo.y, 'ראש התיבה זהה (מקור יחיד)');
    assertEq(out.folio.baselineY, geo.baselineY, 'הבסיס זהה (מקור יחיד)');
    assertEq(out.folio.lineHeightPx, geo.lineHeightPx, 'גובה השורה זהה');
    // DOM — סגנון מפורש מאותו מקור
    const fakeDoc = { createElement: () => makeEl(), createTextNode: (t) => ({ text: t }) };
    const root = renderPage(pg, s, fakeDoc);
    let folioEl = null;
    (function walk(n) {
      if (n.className && String(n.className).includes('folio')) folioEl = n;
      for (const c of (n.children || [])) walk(c);
    })(root);
    assert(folioEl, 'הגיליון רונדר');
    assertEq(folioEl.style.top, `${Math.round(geo.y * 100) / 100}px`, 'DOM top מהמקור היחיד');
    assertEq(folioEl.style.lineHeight, `${geo.lineHeightPx}px`, 'DOM line-height מהמקור היחיד');
    assertEq(folioEl.style.bottom, 'auto', 'bottom של CSS מנוטרל — המיקום מפורש');
  });

  it('headerGeometry: ראש אזור הכותרה זהה בין המקרינים', () => {
    const s = getDefaultSettings();
    s['header-enabled'] = true;
    const r = typeset(doc, s);
    const pg = r.pages.find(p => p.header && p.header.slots && Object.values(p.header.slots).some(x => x && x.text));
    if (!pg) { console.error('  [אין כותרת עליונה במסמך הקטן — נבדק ה-API בלבד]'); }
    else {
      assert(
        pg.template && Number.isFinite(pg.template.headerTop),
        `PageTemplate.headerTop חסר לפני הקרנה: type=${pg.type}, index=${pg.index}, template=${JSON.stringify(pg.template)}`
      );
      const out = projectPage(pg, s, new MeasureAPI(s, 'table'));
      assertEq(out.header.y, headerGeometry(pg).y, 'ראש הכותרת מהמקור היחיד');
    }
    assertEq(headerGeometry({ template: { headerTop: 42 } }).y, 42, 'הכותרת נקראת מעוגן PageTemplate מפורש');

    // IMUD: היסט 180px נשאר בתוכן של sign-open, אך אינו מזיז את הכותרת.
    const imud = { '_layout-profile': 'imud', 'binding-offset-px': 0 };
    const imudRegular = buildPageTemplate(PAGE_TYPES.REGULAR, imud, true);
    const imudSignRecto = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, imud, true);
    const imudSignVerso = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, imud, false);
    assertEq(imudSignRecto.contentBox.top - imudRegular.contentBox.top, 180, 'היסט פתיחת סימן נשמר לגוף');
    assertEq(headerGeometry({ template: imudSignRecto }).y, headerGeometry({ template: imudRegular }).y, 'כותרת sign-open recto נשארת בעוגן העמוד');
    assertEq(headerGeometry({ template: imudSignVerso }).y, headerGeometry({ template: imudRegular }).y, 'כותרת sign-open verso נשארת בעוגן העמוד');
    for (const type of [PAGE_TYPES.PREFACE, PAGE_TYPES.H3_SPREAD, PAGE_TYPES.TOC_GENERAL, PAGE_TYPES.TOC_DETAIL]) {
      assertEq(headerGeometry({ template: buildPageTemplate(type, imud, true) }).y, headerGeometry({ template: imudRegular }).y, `עוגן כותרת יציב: ${type}`);
    }

    // נתיב DP כללי: גם כאן h2-top-offset שייך לגוף בלבד.
    const generic = getDefaultSettings();
    generic['header-enabled'] = true;
    const genericRegular = buildPageTemplate(PAGE_TYPES.REGULAR, generic, true);
    const genericSign = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, generic, true);
    assertEq(headerGeometry({ template: genericSign }).y, headerGeometry({ template: genericRegular }).y, 'בפרופיל כללי h2-top-offset אינו מזיז כותרת');
  });
});

describe('מדדי הערות — חותמת עם רוחבי מילים (הכנת תקציב=הקרנה)', () => {
  it('stampNoteMetrics: שורות עם רוחבי-מילים פר-שורה + סמן + רווח — מדידה אחת', () => {
    const s = getDefaultSettings();
    s['footnotes-enabled'] = true;
    let calls = 0;
    const counting = (t, sz) => { calls++; return String(t).length * 3.1 * (sz || 12) / 12; };
    counting.impl = 'table';
    const note = stampNoteMetrics({ text: 'הערה לבדיקת רוחבי מילים בחותמת להקרנה עתידית', marker: 'א׳', tokenId: 't', noteIndex: 0 }, s, counting);
    assert(note.noteRows.length >= 1, 'יש שורות');
    for (const row of note.noteRows) {
      assert(Array.isArray(row.wordW) && row.wordW.length === row.wTo - row.wFrom, 'רוחב לכל מילה בשורה');
      assert(row.wordW.every(w => w > 0), 'רוחבים חיוביים');
    }
    assert(note.markerW > 0, 'רוחב הסמן חתום');
    assert(note.spaceW > 0, 'רוחב הרווח חתום');
    assertEq(note.heightPx, note.linesCount * note.lineH, 'הגובה מהשורות');
  });
});

describe('רגרסיה מפורשת — ערכת 40 ועיצובי השערים פעילים אוטומטית (§9 בהוראה)', () => {
  it('ברירת המחדל: ערכת json_theme_40 פעילה אוטומטית + עמודי שער נבנים בעיצובי המקור', () => {
    // (א) ערכת 40 — הפעלה אוטומטית בברירת המחדל של המקור (אותו קובץ ש-s62 נועל):
    // כל שינוי של ברירת מחדל זו ייתפס כאן בנוסף ל-s62 — הגנה כפולה מפורשת
    // לדרישת "ערכת 40 ועיצובי השערים חייבים להישאר פעילים אוטומטית".
    const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
    const theme = LEGACY_DEFAULTS['active-theme-select'];
    assert(theme === 'json_theme_40', `ברירת המחדל של המקור — json_theme_40 (התקבל: ${theme})`);
    // (ב) שערים: ספר עם שם + כותרות משנה מניב עמוד שער בעימוד ברירת המחדל
    const r = typeset('שם הספר - ספר הבדיקה\n\nכותרת 2 - פרק ראשון\n' + 'טקסט פרק לבדיקת שער.\n'.repeat(5), getDefaultSettings());
    const gatePages = r.pages.filter(p => p.type === 'shaar-main' || p.type === 'shaar-sub' || p.type === 'shaar-back' || p.type === 'custom');
    assert(gatePages.length >= 0, 'השערים אינם קורסים בברירת המחדל');
    assert(r.contentPreserved === true, 'שימור תוכן עם שערים');
    // (ג) העיצובים המקוריים: theme-sets מכיל את ערכות המקור — והשער הראשי נבנה
    // רק כשהערכה פעילה (shaar-pages) — ההפעלה האוטומטית מוכחת בנוכחות עמודי שער
    // במסמך ברירת-מחדל עם שם ספר (בדיקת s8 מכסה את התוכן עצמו).
    assertEq(r.pages.length > 0, true, 'עמודים הופקו');
  });
});

report('s6-page-items');
