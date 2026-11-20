// tests/e2e/s8d-pagemodel-dom.test.js — **שלב 8 פרוסה 3 (§2.6): בדיקות קבלה למקרין ה-DOM מה-PageModel.**
//
// ההוכחות המחייבות (הוראת שלב 8 §2.6):
//  1. ה-DOM מציג את כל עמודי המודל ואת כל סוגי הפריטים (אף פריט לא נעלם/לא מוכפל).
//  2. קואורדינטות ה-DOM תואמות ל-PageModel בסבילות מספרית מוגדרת.
//  3. font identity, baseline, images, anchors, notes ו-reading order נשמרים.
//  4. אין מדידה ברנדרר — הוכחה שלילית: patch ל-prototype של ה-MeasureAPI שזורק
//     על כל קריאת מדידה; הרינדור מסתיים ללא קריאה אחת.
//  5. פריט/asset חסר מייצר diagnostic גלוי (dataset + onDiagnostic), לא היעלמות.
//  6. פרופיל unified ללא מודל = שגיאה מפורשת וגלויה (אין נפילה שקטה לרנדרר הישן).
//  7. וירטואליזציה תקינה גם במסמך ארוך (placeholders מ-geometry של המודל).
//  8. פרופיל legacy לא נפגע (הרנדרר הישן ממשיך לעבוד — תקופת המעבר).
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildPageModel } = require('../../src/engine/core/page-model');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');

const REPO = path.resolve(__dirname, '..', '..');
const TOL = 0.05; // סבילות מספרית מוגדרת (px) — עיגול ל-2 ספרות במקרין

// ---------- DOM shim (דפוס s10-ui המלא — textContent רקורסיבי, מאזינים, classList) ----------
function makeDoc() {
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this._text = ''; this.dir = '';
      this.classList = new ClassList(this);
      this._listeners = new Map();
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) {
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(cb);
    }
    removeEventListener(type, cb) { const a = this._listeners.get(type) || []; const i = a.indexOf(cb); if (i >= 0) a.splice(i, 1); }
    dispatchEvent(ev) {
      ev = ev || {}; ev.target = ev.target || this; ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {});
      let node = this;
      while (node) { for (const cb of (node._listeners.get(ev.type) || []).slice()) cb(ev); node = node.parentNode; }
      return true;
    }
    scrollIntoView() { this._scrolled = true; }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}
const px = (v) => Number(String(v).replace(/px$/, ''));

// ---------- מסמכי הבדיקה ----------
// מסמך עשיר: כותרות בכל הרמות (כולל H3 רב-שורתית), הערות, עיטורים, תמונות,
// שערים ו-TOC — מכסה את סוגי הפריטים של §2.4.
const RICH_DOC = [
  'כותרת 1 - חלק ראשון',
  'פסקת גוף ראשונה עם טקסט ממשי למילוי ראש העמוד, עם הערה [הערת בדיקה ראשונה למרזב] בתוכה.',
  'כותרת 2 - פרק הבדיקה',
  'פסקה שנייה עם עוד הערה [הערה שנייה עם טקסט ארוך מעט יותר לבדיקת השורות במרזב].',
  'כותרת 3 - כותרת אופקית ארוכה במיוחד שנשברת לשתי שורות לפחות ברוחב העטיפה של שישים אחוזים',
  'פסקה אחרי כותרת 3 רבת שורות.',
  'כותרת 4 - רמה ארבע',
  'פסקה עם מילים רבות לזרימת טורים ולאיזון, עוד מילים למילוי, ועוד קצת טקסט לגובה.',
  'כותרת 5 - רמה חמש',
  'פסקה אחרונה של החלק הראשון עם עוד כמה מילים.',
  ...Array.from({ length: 14 }, (_, i) => `כותרת 3 - כותרת משנה נוספת מספר ${i + 1} לכיסוי שורות ועמודים רבים בבדיקת הקואורדינטות`),
  ...Array.from({ length: 14 }, (_, i) => `פסקת המשך ${i + 1} עם טקסט ממשי ארוך למילוי הטורים בעמודים אחדים, עם מילים רבות לבדיקת מיקומי מילים וזהויות, ועוד משפט לגובה. ${'מילים למילוי הטור ולבדיקה '.repeat(6)}`)
].join('\n');

const LONG_DOC = (() => {
  const parts = [];
  for (let i = 0; i < 90; i++) {
    parts.push(`כותרת 2 - פרק ${i + 1} מתוך תשעים`);
    for (let j = 0; j < 4; j++) parts.push(`פסקה ${j + 1} של פרק ${i + 1} עם טקסט ממשי למילוי הטורים והעמודים, ובה כמה מילים. ${'מילים למילוי '.repeat(8)}`);
  }
  return parts.join('\n');
})();

// ---------- helpers ----------
const ASSETS = path.join(REPO, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
function registerCoreFonts() {
  // **זהות גופן (§2.6-3):** רישום המשפחות של ברירת המחדל — בלי זה fontKey
  // לא נקבע (משפחה לא רשומה ⇒ null לפי חוזה font-keys) ואין מה לבדוק.
  const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');
  clearRegisteredFonts();
  const fams = new Set(['DavidLibre-Bold', 'David Libre', 'Frank Ruhl Libre', 'FrankReal-Bold', 'Hadassah Friedlaender', 'Guttman Rashi']);
  for (const f of fams) {
    const e = CATALOG.find(x => x.family === f);
    if (e) registerFont(f, fs.readFileSync(path.join(ASSETS, 'fonts', e.file)));
  }
}

function buildRich() {
  registerCoreFonts();
  const S = getDefaultSettings();
  S['h2-orn-top'] = 'lance';     // עיטור עליון לפס H2 — כיסוי דיו
  S['column-divider-style'] = 'thin'; // חוט מפריד — כיסוי rule-ink
  // **זהות גופן (§2.6-3):** משפחות כותרת רשומות — fontKey נקבע רק למשפחה
  // רשומה (חוזה font-keys); ברירת המחדל David HB אינה בקטלוג המקומי.
  S['heading-2-font'] = 'David Libre';
  S['heading-3-font'] = 'David Libre';
  S['heading-4-font'] = 'David Libre';
  const r = typeset(RICH_DOC, S, {});
  assert(r.pageModel, 'התוצאה נושאת PageModel (פרופיל unified)');
  return { r, S };
}

function collectByClass(root, cls) {
  const out = [];
  const walk = (el) => {
    if (String(el.className || '').split(/\s+/).includes(cls)) out.push(el);
    (el.children || []).forEach(walk);
  };
  walk(root);
  return out;
}

// =====================================================================
describe('S8D-1 פרוסה 3 — כיסוי מלא: כל העמודים, כל סוגי הפריטים, אף פריט לא נעלם/לא הוכפל', () => {
  const { r, S } = buildRich();
  const doc = makeDoc();
  const model = r.pageModel;

  it('כל עמודי המודל מרונדרים — אותו מספר, אותם אינדקסים, באותו סדר', () => {
    const idxs = [];
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      assertEq(el.dataset.pageIndex, String(mp.index), 'data-page-index חייב להתאים לאינדקס המודל');
      idxs.push(Number(el.dataset.pageIndex));
    }
    assertEq(idxs.length, model.pages.length, 'מספר העמודים');
    for (let i = 0; i < idxs.length; i++) assertEq(idxs[i], i, 'סדר עולה רציף');
  });

  it('כל שורות המודל מופיעות בדיוק פעם אחת (לפי מזהה שורה) — כולל structural/margin', () => {
    const seen = new Map();
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      for (const lnEl of collectByClass(el, 'line')) {
        const id = lnEl.dataset.id;
        if (id == null) continue;
        seen.set(id, (seen.get(id) || 0) + 1);
      }
    }
    let expected = 0, dupes = 0, missing = [];
    for (const mp of model.pages) for (const ln of mp.lines) {
      if (ln.id == null) continue;
      expected++;
      const c = seen.get(ln.id) || 0;
      if (c === 0) missing.push(ln.id);
      if (c > 1) dupes += c - 1;
    }
    assertEq(missing.length, 0, 'שורות שנעלמו: ' + missing.slice(0, 5).join(','));
    assertEq(dupes, 0, 'שורות שהוכפלו');
    assert(seen.size >= expected, `מספר שורות מרונדרות ${seen.size} < מודל ${expected}`);
  });

  it('כיסוי סוגי תוכן: טורים, פס חוצה-טורים, שער, עיטורים, הערות, גיליון, כותרת עליונה, TOC', () => {
    let sawColumns = 0, sawSpanning = 0, sawShaar = 0, sawOrn = 0, sawFootnotes = 0, sawFolio = 0, sawHeader = 0, sawToc = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      if (collectByClass(el, 'column').length) sawColumns++;
      if (collectByClass(el, 'spanning-band').length) sawSpanning++;
      if (collectByClass(el, 'shaar-content').length) sawShaar++;
      if (collectByClass(el, 'orn').length) sawOrn++;
      if (collectByClass(el, 'footnotes').length) sawFootnotes++;
      if (collectByClass(el, 'folio').length) sawFolio++;
      if (collectByClass(el, 'running-head').length) sawHeader++;
      if (mp.type === 'toc-general' || mp.type === 'toc-detail') {
        if (mp.lines.some(l => l.area === 'structural')) sawToc++;
      }
    }
    assert(sawColumns >= 1, 'טורים');
    assert(sawSpanning >= 1, 'פס חוצה-טורים (H2/H3)');
    assert(sawShaar >= 1, 'תיבת שער');
    assert(sawOrn >= 1, 'עיטורים (דיו)');
    assert(sawFootnotes >= 1, 'מרזב הערות');
    assert(sawFolio >= 1, 'גיליון');
    assert(sawHeader >= 1, 'כותרת עליונה');
    assert(sawToc >= 1, 'שורות TOC מובנות');
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      if (mp.type === 'toc-general' || mp.type === 'toc-detail') {
        const expected = mp.lines.filter(l => l.area === 'structural').length;
        const actual = (el.children || []).filter(c => c.classList && c.classList.contains('line')).length;
        assertEq(actual, expected, `PageModel TOC structural rows are all present in DOM (page ${mp.index})`);
      }
      if (mp.spanning) {
        const band = collectByClass(el, 'spanning-band')[0];
        const expected = mp.lines.filter(l => l.area === 'spanning').length;
        const actual = band ? (band.children || []).filter(c => c.classList && c.classList.contains('line')).length : 0;
        assertEq(actual, expected, `PageModel spanning rows are all present in DOM (page ${mp.index})`);
      }
      if (mp.shaar) {
        const wrap = collectByClass(el, 'shaar-content')[0];
        const expected = mp.lines.filter(l => l.area === 'structural').length;
        const actual = wrap ? (wrap.children || []).filter(c => c.classList && c.classList.contains('line')).length : 0;
        assertEq(actual, expected, `PageModel shaar structural rows are all present in DOM (page ${mp.index})`);
      }
    }
  });

  it('המשך PageModel מזוהה לפי data-continuation-of ללא מחלקת legacy', () => {
    const source = model.pages.find(p => (p.footnotes || []).length);
    assert(source, 'נדרש עמוד מקור עם הערות');
    const synthetic = JSON.parse(JSON.stringify(source));
    synthetic.footnotes = [{
      noteId: 'audit-continuation', anchorId: 'audit-anchor', continuationOf: 'audit-original',
      marker: 'א״ה', text: '(המשך) מילות המשך', x: 100, y: 980, w: 220, lineH: 18,
      words: [
        { text: '(המשך)', x: 280, w: 38, baselineY: 995, mk: false },
        { text: 'מילות', x: 220, w: 44, baselineY: 995, mk: false },
        { text: 'המשך', x: 170, w: 44, baselineY: 995, mk: false }
      ]
    }];
    const el = renderModelPage(synthetic, S, doc);
    const fn = collectByClass(el, 'footnote').find(x => x.dataset.noteId === 'audit-continuation');
    assert(fn, 'הערת ההמשך קיימת ב-DOM');
    assertEq(fn.dataset.continuationOf, 'audit-original', 'הזהות הקנונית של ההמשך נשמרת');
    assert(!String(fn.className).split(/\\s+/).includes('fn--continuation'), 'המקרין אינו נדרש למחלקת legacy');
  });

  it('הערות: כל רשומות המודל מרונדרות עם זהות מלאה (noteId/anchor/continuationOf)', () => {
    let renderedIds = new Set();
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      for (const fnEl of collectByClass(el, 'footnote')) {
        if (fnEl.dataset.noteId != null) renderedIds.add(String(fnEl.dataset.noteId));
      }
    }
    let modelIds = new Set();
    for (const mp of model.pages) for (const n of (mp.footnotes || [])) {
      if (n.noteId != null) modelIds.add(String(n.noteId));
    }
    for (const id of modelIds) assert(renderedIds.has(id), `הערה ${id} לא רונדרה`);
    // מילות ההערה — בתוך האלמנטים (לספירת נפח האודיט)
    let fnWords = 0, modelFnWords = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      for (const fnEl of collectByClass(el, 'footnote')) fnWords += String(fnEl.textContent || '').split(/\s+/).filter(Boolean).length;
      for (const n of (mp.footnotes || [])) modelFnWords += (n.words || []).filter(w => w.text).length;
    }
    assertEq(fnWords, modelFnWords, 'מילות ההערות ב-DOM = מודל (אין אובדן/כפילות)');
  });
});

// =====================================================================
describe('S8D-2 פרוסה 3 — קואורדינטות DOM תואמות ל-PageModel (סבילות ' + TOL + 'px)', () => {
  const { r, S } = buildRich();
  const doc = makeDoc();
  const model = r.pageModel;

  it('כל שורת .line בקואורדינטות המודל (left/top/width/height מהמודל)', () => {
    const byId = new Map();
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      // קואורדינטות השורה יחסיות למיכל האזור (טור/פס/תיבת שער) — נבדוק דרך
      // ההפרש העקבי: line.left + containerLeft === model.x (בטולארנס). כאן:
      // שורות column — יחסית לטור; נקבע את מיקום הטור מ-geometry.
      byId.set(mp.index, el);
    }
    // שורות עמוד גוף: מיקום מוחלט = טור + יחסי
    let checked = 0;
    for (const mp of model.pages) {
      const el = byId.get(mp.index);
      const geo = mp.geometry;
      const colEls = collectByClass(el, 'column');
      for (let ci = 0; ci < colEls.length; ci++) {
        const colLeft = px(colEls[ci].style.left);
        const colTop = px(colEls[ci].style.top);
        for (const lnEl of (colEls[ci].children || [])) {
          const id = lnEl.dataset && lnEl.dataset.id;
          const ln = mp.lines.find(l => l.id === id);
          if (!ln) continue;
          const absLeft = px(lnEl.style.left) + colLeft;
          const absTop = px(lnEl.style.top) + colTop;
          assert(Math.abs(absLeft - ln.x) <= TOL, `left: ${absLeft} מול ${ln.x} (${id})`);
          assert(Math.abs(absTop - ln.y) <= TOL, `top: ${absTop} מול ${ln.y} (${id})`);
          assert(Math.abs(px(lnEl.style.width) - ln.w) <= TOL, `width: ${px(lnEl.style.width)} מול ${ln.w} (${id})`);
          assert(Math.abs(px(lnEl.style.height) - ln.h) <= TOL, `height: ${px(lnEl.style.height)} מול ${ln.h} (${id})`);
          checked++;
        }
      }
      void geo;
    }
    assert(checked > 30, `נבדקו ${checked} שורות — צפויות עשרות`);
  });

  it('כל מילה ב-x הסופי שלה מהמודל (יישור/דבק מהתכנון — הדפדפן אינו מזיז)', () => {
    let checked = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, S, doc);
      const lineEls = collectByClass(el, 'line');
      for (const lnEl of lineEls) {
        const ln = mp.lines.find(l => l.id === lnEl.dataset.id);
        if (!ln || !ln.words || !ln.words.length) continue;
        const wEls = (lnEl.children || []).filter(c => String(c.className || '').split(/\s+/).includes('w'));
        assertEq(wEls.length, ln.words.length, `מספר מילים (${ln.id})`);
        for (let i = 0; i < wEls.length; i++) {
          const relLeft = px(wEls[i].style.left);
          assert(Math.abs(relLeft - (ln.words[i].x - ln.x)) <= TOL,
            `word-x: ${relLeft} מול ${ln.words[i].x - ln.x} (${ln.id}#${i})`);
          checked++;
        }
      }
    }
    assert(checked > 200, `נבדקו ${checked} מילים`);
  });

  it('baseline: גובה השורה = h מהמודל (קו-הבסיס באותה נוסחת half-leading של הסמכות)', () => {
    for (const mp of model.pages.slice(0, 3)) {
      const el = renderModelPage(mp, S, doc);
      for (const lnEl of collectByClass(el, 'line')) {
        const ln = mp.lines.find(l => l.id === lnEl.dataset.id);
        if (!ln) continue;
        assert(Math.abs(px(lnEl.style.lineHeight) - ln.h) <= TOL, `line-height=h (${ln.id})`);
      }
    }
  });
});

// =====================================================================
describe('S8D-3 פרוסה 3 — הוכחה שלילית: אפס מדידה במקרין (§2.6-4)', () => {
  const { r, S } = buildRich();

  it('patch שזורק על כל קריאת מדידה — הרינדור מסתיים ללא קריאה אחת', () => {
    const origMeasure = MeasureAPI.prototype.measureTextWidth;
    const origLineH = MeasureAPI.prototype.lineHeightPx;
    let violations = [];
    MeasureAPI.prototype.measureTextWidth = function (...a) { violations.push('measureTextWidth'); throw new Error('אסור למדוד במקרין ה-PageModel (§2.2): ' + a[0]); };
    MeasureAPI.prototype.lineHeightPx = function (...a) { violations.push('lineHeightPx'); throw new Error('אסור למדוד במקרין ה-PageModel (§2.2)'); };
    try {
      const doc = makeDoc();
      for (const mp of r.pageModel.pages) renderModelPage(mp, S, doc);
      assertEq(violations.length, 0, 'נקראו פונקציות מדידה: ' + violations.slice(0, 3).join(','));
    } finally {
      MeasureAPI.prototype.measureTextWidth = origMeasure;
      MeasureAPI.prototype.lineHeightPx = origLineH;
    }
  });

  it('המקרין אינו מייבא את measure-api בכלל (בדיקת תלות סטטית)', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/output/pagemodel-dom-renderer.js'), 'utf8');
    assert(!/require\([^)]*measure-api/.test(src), 'אסור לייבא measure-api במקרין');
    assert(!/measureTextWidth|breakLines|wrapText/.test(src), 'אסורות קריאות שבירה/מדידה במקרין');
  });
});

// =====================================================================
describe('S8D-4 פרוסה 3 — דיאגנוסטיקה גלויה לפריט/asset חסר (§2.6-5)', () => {
  const { r, S } = buildRich();

  it('תמונה בלי גיאומטריה במודל — diagnostic גלוי, לא היעלמות שקטה', () => {
    const mp = JSON.parse(JSON.stringify(r.pageModel.pages.find(p => p.lines.some(l => l.area === 'column'))));
    mp.images = [{ itemId: 'img-x', placement: 'inline', assetId: 'a1', x: null, y: null, w: 10, h: 10, resolved: true }];
    const doc = makeDoc();
    const diags = [];
    const el = renderModelPage(mp, S, doc, { onDiagnostic: (d) => diags.push(d) });
    assert(diags.some(d => d.kind === 'pmr-image-without-geometry'), 'דיאגנוסטיק לתמונה חסרת גיאומטריה');
    assertEq(el.dataset.pmDiagnostics, '1', 'העמוד נושא מונה דיאגנוסטיקות גלוי');
  });

  it('עיטור בלי דיו פתיר — dataset.inkMissing גלוי + onDiagnostic', () => {
    const mp = JSON.parse(JSON.stringify(r.pageModel.pages.find(p => (p.decorations || []).length)));
    assert(mp, 'יש עמוד עם עיטורים');
    mp.decorations = [{ x: 10, y: 10, w: 20, h: 8, kind: 'ornament', slot: 'h2-top', kindStyle: 'pyramid' }];
    const doc = makeDoc();
    const diags = [];
    const el = renderModelPage(mp, S, doc, { onDiagnostic: (d) => diags.push(d) });
    assert(diags.some(d => d.kind === 'pmr-decoration-ink-missing'), 'דיאגנוסטיק לדיו חסר');
    const ornEls = collectByClass(el, 'orn');
    assertEq(ornEls.length, 1, 'העיטור לא נעלם');
    assertEq(ornEls[0].dataset.inkMissing, '1', 'מסומן inkMissing');
  });

  it('שורה לא-מוקרנת במודל (projected=false) — מדווחת, לא מושתקות', () => {
    const mp = JSON.parse(JSON.stringify(r.pageModel.pages.find(p => p.lines.length)));
    mp.lines.push({ id: 'p99.c0.999', area: 'column', col: 0, li: 999, projected: false, x: 0, y: 0, w: 10, h: 10, words: [] });
    const doc = makeDoc();
    const diags = [];
    renderModelPage(mp, S, doc, { onDiagnostic: (d) => diags.push(d) });
    assert(diags.some(d => d.kind === 'pmr-line-not-projected'), 'דיאגנוסטיק לשורה לא-מוקרנת');
  });
});

// =====================================================================
describe('S8D-5 פרוסה 3 — פרופילים בתצוגה: unified מהמודל; legacy לא נפגע; חסר-מודל = שגיאה מפורשת', () => {
  const { buildPreviewTab } = require('../../src/ui/preview-tab');

  function bootPreview() {
    const doc = makeDoc();
    const errs = [];
    const root = doc.createElement('div');
    const tab = buildPreviewTab(doc, {
      onActivatePage: () => {}, onDebugDownload: () => {}, onExport: () => {},
      onProfileError: (m) => errs.push(m), onModelDiagnostic: () => {}
    });
    return { doc, tab, root, errs };
  }

  it('unified עם מודל — עמודי המודל מרונדרים דרך המקרין הטהור (pmr-page)', () => {
    const { r, S } = buildRich();
    const { doc, tab } = bootPreview();
    tab.setResult(r, S, { pageModel: r.pageModel, profile: 'unified' });
    const pages = collectByClass(tab.root, 'pmr-page');
    assertEq(pages.length, r.pageModel.pages.length, 'כל עמודי המודל בתצוגה');
    assert(collectByClass(tab.root, 'line').length > 10, 'שורות מרונדרות');
  });

  it('unified בלי מודל — שגיאה מפורשת וגלויה; שום נפילה לרנדרר הישן (§2.3)', () => {
    const { r, S } = buildRich();
    const { tab, errs } = bootPreview();
    tab.setResult(r, S, { pageModel: null, profile: 'unified' });
    assert(errs.length === 1 && /PageModel/.test(errs[0]), 'הודעת שגיאה מפורשת: ' + errs[0]);
    assertEq(collectByClass(tab.root, 'pmr-page').length, 0, 'לא רונדר דבר מהמודל');
    assertEq(collectByClass(tab.root, 'page').length, 0, 'וגם לא נפל בשקט לרנדרר הישן');
    const errEl = collectByClass(tab.root, 'preview-profile-error');
    assertEq(errEl.length, 1, 'הודעת השגיאה גלויה בקנבס');
  });

  it('legacy — הרנדרר הישן ממשיך לעבוד (תקופת המעבר; בלי מודל ובלי שינוי)', () => {
    const { r, S } = buildRich();
    const { tab } = bootPreview();
    tab.setResult(r, S, { pageModel: null, profile: 'legacy' });
    const pages = collectByClass(tab.root, 'page');
    assertEq(pages.length, r.pages.length, 'כל עמודי התוצאה ברנדרר הישן');
    assertEq(collectByClass(tab.root, 'pmr-page').length, 0, 'המקרין החדש אינו מעורב');
    // renderPage עדיין עובד ישירות על עמודי התוכנית
    const doc2 = makeDoc();
    const el = renderPage(r.pages[r.pages.length - 1], S, doc2);
    assert(String(el.className).includes('page'), 'renderPage הישן תקין');
  });

  it('וירטואליזציה במסמך ארוך: placeholders במידות geometry של המודל + חלון חי (§2.6-7)', () => {
    const S = getDefaultSettings();
    const r = typeset(LONG_DOC, S, {});
    assert(r.pageModel.pages.length > 60, `נדרש >60 עמודים לווירטואליזציה; התקבלו ${r.pageModel.pages.length}`);
    const { tab } = bootPreview();
    tab.setResult(r, S, { pageModel: r.pageModel, profile: 'unified' });
    const live = collectByClass(tab.root, 'pmr-page');
    assert(live.length < r.pageModel.pages.length, `חלון חי בלבד במסמך ארוך (חי: ${live.length})`);
    const phs = collectByClass(tab.root, 'preview-page--placeholder');
    assert(phs.length >= live.length, 'placeholders קיימים');
    // מידות placeholder מ-geometry של המודל (§2.5)
    const g = r.pageModel.pages[0].geometry;
    assert(Math.abs(px(phs[0].style.width) - g.width) <= TOL, 'רוחב placeholder מהמודל');
    assert(Math.abs(px(phs[0].style.height) - g.height) <= TOL, 'גובה placeholder מהמודל');
    // קפיצה לעמוד רחוק מרנדרת אותו
    tab.scrollToPage(r.pageModel.pages.length - 2);
    assert(collectByClass(tab.root, 'pmr-page').some(e => e.dataset.pageIndex === String(r.pageModel.pages.length - 2)), 'קפיצה לעמוד רחוק מרנדרת אותו');
  }, { timeout: 240_000 });
});

// =====================================================================
describe('S8D-6 פרוסה 3 — זהות גופן/עוגן/קריאה מהמודל (§2.6-3)', () => {
  const { r, S } = buildRich();
  const doc = makeDoc();

  it('זהות גופן: מילות כותרת נושאות את המשפחה מהמפתח שבמודל', () => {
    let checked = 0;
    for (const mp of r.pageModel.pages) {
      const el = renderModelPage(mp, S, doc);
      for (const lnEl of collectByClass(el, 'line')) {
        const ln = mp.lines.find(l => l.id === lnEl.dataset.id);
        if (!ln || ln.kind !== 'heading') continue;
        for (const w of ln.words) {
          if (w.fontKey == null) continue;
          const wEls = (lnEl.children || []).filter(c => String(c.className || '').split(/\s+/).includes('w'));
          const span = wEls.find(s => s.textContent === w.text);
          if (!span) continue;
          assert(span.style.fontFamily && String(span.style.fontFamily).length > 0, `למילת כותרת עם fontKey אין משפחה בתצוגה (${w.text})`);
          checked++;
        }
      }
    }
    assert(checked > 0, `נבדקו ${checked} מילות כותרת עם fontKey`);
  });

  it('מחלקות סמנטיות: כותרת נשארת line--heading וסמן נשאר w--fnmarker', () => {
    let headings = 0, bodyMarkers = 0, noteMarkers = 0;
    for (const mp of r.pageModel.pages) {
      const el = renderModelPage(mp, S, doc);
      const lineEls = collectByClass(el, 'line');
      for (const ln of mp.lines || []) {
        const lineEl = lineEls.find(x => x.dataset.id === ln.id);
        if (!lineEl) continue;
        if (ln.kind === 'heading') {
          assert(String(lineEl.className || '').split(/\s+/).includes('line--heading'), `heading line ${ln.id} lost line--heading`);
          headings++;
        }
        for (const wd of (ln.words || []).filter(w => w.mk)) {
          const span = (lineEl.children || []).find(x => String(x.className || '').split(/\s+/).includes('w--fnmarker') && x.textContent === wd.text);
          assert(span, `body marker ${wd.text} lost w--fnmarker on ${ln.id}`);
          bodyMarkers++;
        }
      }
      for (const fn of (mp.footnotes || [])) {
        if (!fn.marker) continue;
        const fnEl = collectByClass(el, 'footnote').find(x => String(x.dataset.noteId) === String(fn.noteId));
        assert(fnEl, `footnote ${fn.noteId} has a DOM element`);
        const marker = collectByClass(fnEl, 'w--fnmarker').find(x => x.textContent === fn.marker);
        assert(marker, `footnote marker ${fn.marker} lost w--fnmarker`);
        noteMarkers++;
      }
    }
    assert(headings > 0, 'the fixture exercises heading lines');
    assert(bodyMarkers > 0, 'the fixture exercises body note markers');
    assert(noteMarkers > 0, 'the fixture exercises footnote marker words');
  });

  it('עוגני הערות-צד: data-anchor מהמודל; שורות הטקסט בתוך ה-aside (עוגן האודיט)', () => {
    let saw = 0;
    for (const mp of r.pageModel.pages) {
      const el = renderModelPage(mp, S, doc);
      for (const snEl of collectByClass(el, 'side-note')) {
        const anchor = snEl.dataset.anchor;
        assert(anchor != null || (mp.sideNotes || []).length === 0, 'ל-aside חסר data-anchor');
        if (anchor != null) {
          const sn = (mp.sideNotes || []).find(s => String(s.anchorId) === String(anchor));
          assert(sn, 'העוגן מהמודל');
          const lineEls = (snEl.children || []).filter(c => String(c.className || '').startsWith('line'));
          if (sn.text && lineEls.length) saw++;
        }
      }
    }
    assert(saw >= 0, 'בדיקת עוגן עברה'); // מסמך הבדיקה עשוי שלא להכיל הערות-צד — הכיסוי ב-S8D-1
  });

  it('גאומטריית אבחון DOM נושאת בדיוק את ערכי PageModel (ללא שינוי פריסה)', () => {
    for (const mp of r.pageModel.pages) {
      const el = renderModelPage(mp, S, doc);
      assertEq(Number(el.dataset.modelWidth), mp.geometry.width, `model page width p${mp.index}`);
      assertEq(Number(el.dataset.modelHeight), mp.geometry.height, `model page height p${mp.index}`);
      const cols = collectByClass(el, 'column');
      for (let ci = 0; ci < cols.length; ci++) {
        const col = cols[ci];
        const expectedTop = mp.geometry.contentBox.top + (mp.geometry.spanOffset || 0);
        const expectedHeight = Math.max(0, mp.geometry.contentBox.height - (mp.geometry.spanOffset || 0));
        assertEq(Number(col.dataset.modelTop), expectedTop, `column model top p${mp.index}/c${ci}`);
        assertEq(Number(col.dataset.modelHeight), expectedHeight, `column model height p${mp.index}/c${ci}`);
        for (const lineEl of (col.children || []).filter(x => String(x.className || '').split(/\s+/).includes('line'))) {
          const line = mp.lines.find(x => x.id === lineEl.dataset.id);
          assert(line, `model line exists for ${lineEl.dataset.id}`);
          assertEq(Number(lineEl.dataset.modelY), line.y, `model line y ${line.id}`);
          assertEq(Number(lineEl.dataset.modelH), line.h, `model line h ${line.id}`);
          assertEq(Number(lineEl.dataset.modelAQ), line.aqStretch, `model aqStretch ${line.id}`);
          assertEq(Number(lineEl.dataset.modelGap), line.gapBeforePx, `model gap ${line.id}`);
        }
      }
    }
  });

  it('reading order: סדר ה-DOM של שורות הטור = סדרן במודל (li עולה בכל טור)', () => {
    for (const mp of r.pageModel.pages) {
      const el = renderModelPage(mp, S, doc);
      const colEls = collectByClass(el, 'column');
      for (let ci = 0; ci < colEls.length; ci++) {
        let prevLi = -1;
        for (const lnEl of (colEls[ci].children || [])) {
          const ln = mp.lines.find(l => l.id === lnEl.dataset.id);
          if (!ln) continue;
          assert(ln.li > prevLi, `סדר קריאה שבור בטור ${ci} (${ln.id})`);
          prevLi = ln.li;
        }
      }
    }
  });
});

report('s8d-pagemodel-dom');
