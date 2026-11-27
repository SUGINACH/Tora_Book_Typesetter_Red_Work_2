// tests/e2e/s9c-dom-preview.test.js — שלב 9c פרוסה 9c.3: התצוגה (DOM) מה-PageModel
// בלבד בפרופיל המאוחד — אין נפילה לרנדרר הישן, חסר-מודל = שגיאת פרופיל מפורשת.
// **W-2 (השלמת כריתת 9c.4, 27.11):** ענף המורשת בתצוגה הוסר כליל — אין עוד
// פרופילים ואין רנדרר שני; הבדיקות ננעלות על חוזה מנוע-היחיד.
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { buildPreviewTab } = require('../../src/ui/preview-tab');
const { buildCaretMap } = require('../../src/ui/caret-map');
const { serializeTypesetResult } = require('../../src/ui/worker-protocol');

const DOC = ['שם הספר - ספר התצוגה', '', 'כותרת 1 - חלק ראשון',
  'פסקה ראשונה עם מספיק מילים לעמוד שלם. ' + 'מילים למילוי הטור ולבדיקה '.repeat(8)].join('\n');

function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cssKey = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
    toggle(n, force) { const want = force === undefined ? !this.set.has(n) : !!force; if (want) this.set.add(n); else this.set.delete(n); this._sync(); return want; }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
      this.classList = new ClassList(this); this._listeners = new Map();
      this.value = ''; this.checked = false; this.disabled = false; this.type = ''; this.title = '';
      this.selectionStart = 0; this.selectionEnd = 0; this._scrolled = false;
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : (k === 'id' && this.id != null ? this.id : null); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) { if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(cb); }
    removeEventListener(type, cb) { const arr = this._listeners.get(type) || []; const i = arr.indexOf(cb); if (i >= 0) arr.splice(i, 1); }
    dispatchEvent(ev) {
      ev = ev || {}; ev.target = ev.target || this; ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {});
      let node = this;
      while (node) { ev.currentTarget = node; for (const cb of (node._listeners.get(ev.type) || []).slice()) cb(ev); node = node.parentNode; }
      return true;
    }
    click() { this.dispatchEvent({ type: 'click' }); }
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; }
    scrollIntoView() { this._scrolled = true; }
    focus() { this._focused = true; }
    _matchesPart(sel) {
      const cp = sel.match(/^([a-zA-Z][a-zA-Z0-9]*)((?:\.[^.]+)+)$/); // tag.class (a.toc-link)
      if (cp) return this.tagName === cp[1].toUpperCase() && cp[2].slice(1).split('.').every(c => this.classList.contains(c));
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
      if (sel.startsWith('#')) return this.getAttribute('id') === sel.slice(1);
      if (sel.startsWith('[')) { const m = sel.match(/^\[([^\]]+)\]$/); return !!m && (m[1] in this.dataset || m[1] in this.attrs); }
      return this.tagName === sel.toUpperCase();
    }
    _matches(sel) {
      const parts = String(sel).trim().split(/\s+/);
      if (!this._matchesPart(parts[parts.length - 1])) return false;
      let ancestor = this.parentNode, pi = parts.length - 2;
      while (pi >= 0 && ancestor) { if (ancestor._matchesPart && ancestor._matchesPart(parts[pi])) pi--; ancestor = ancestor.parentNode; }
      return pi < 0;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      const out = [];
      (function walk(el) { for (const c of el.children) { if (c._matches && c._matches(sel)) out.push(c); walk(c); } })(this);
      return out;
    }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${cssKey(k)}:${esc(String(v))}`).join(';');
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
        + (this._class ? ` class="${esc(this._class)}"` : '')
        + (styleStr ? ` style="${styleStr}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrsStr}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (tag) => new El(tag), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; }, _El: El };
}

describe('s9c-dom-preview — התצוגה מה-PageModel בלבד (9c.3)', () => {

  it('פרופיל מאוחד: כל העמודים מרונדרים מהמודל (pmr-page), אין נפילה לרנדרר הישן', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    assert(!r.legacyProfile, 'המנוע המאוחד');
    assert(!!r.pageModel, 'PageModel קיים');
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(serializeTypesetResult(r), S, { pageModel: r.pageModel, profile: 'unified' });
    const pages = pv.root.querySelectorAll('.preview-page');
    assert(pages.length === r.pages.length, 'כל העמודים נבנו');
    // המקרין הטהור מהמודל מסמן את העמודים ב-pmr-page (שלב 8 פרוסה 3)
    let pmrCount = 0;
    for (const p of pages) if (String(p._class || p.className || '').includes('pmr-page')) pmrCount++;
    assert(pmrCount === pages.length, 'כל העמודים דרך המקרין מהמודל (pmr-page)');
    // כל מילות המודל בתצוגה (שלמות תוכן בפרופיל המאוחד)
    const allText = pages.map(p => p.textContent || '').join(' ');
    let checked = 0;
    for (const mp of r.pageModel.pages) {
      for (const ln of mp.lines) {
        for (const w of (ln.words || [])) {
          const t = String(w.text).trim();
          if (t) { checked++; if (!allText.includes(t) && checked < 50) { assert(false, 'מילת מודל חסרה בתצוגה: ' + t); } }
        }
      }
    }
    assert(checked > 20, 'נבדקו מילים רבות (' + checked + ')');
  });

  it('פרופיל מאוחד בלי מודל ⇒ שגיאת פרופיל מפורשת — אין נפילה שקטה לרנדרר הישן', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    // מפורש unified בלי מודל — השגיאה גלויה ואין עמודים מרנדרר המורשת
    pv.setResult(serializeTypesetResult(r), S, { profile: 'unified' });
    const errs = pv.root.querySelectorAll('.preview-profile-error');
    assertEq(errs.length, 1, 'הודעת שגיאת פרופיל גלויה');
    const pages = pv.root.querySelectorAll('.preview-page');
    assertEq(pages.length, 0, 'אף עמוד לא רונדר מהמסלול הישן (אין נפילה)');
  });

  it('פרופיל מאוחד: תצוגה עובדת ללא מודל legacy', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    pv.setResult(serializeTypesetResult(r), S, { pageModel: r.pageModel, profile: 'unified' });
    const pages = pv.root.querySelectorAll('.preview-page');
    assertEq(pages.length, r.pages.length, 'המנוע המאוחד מציג את כל העמודים');
  });

  it('מקור preview-tab: המקרין מה-PageModel הוא הנתיב היחיד (W-2 — השלמת כריתת 9c.4)', () => {
    const src = fs.readFileSync(path.join(RB, 'src/ui/preview-tab.js'), 'utf8');
    assert(src.includes('renderModelPage(page, virtual.settings, doc'), 'הרינדור מהמודל בלבד');
    assert(src.includes('preview-profile-error'), 'שגיאת פרופיל מפורשת קיימת');
    // **W-2 (השלמת 9c.4, 27.11):** ענף המורשת הוסר כליל — לא סמן, לא
    // רנדרר שני, לא צריכת result.pages בשום צורה; המחוונים, הגיליונות
    // והניווט נגזרים מ-virtual.pages (עמודי המודל) בלבד.
    assert(!src.includes("require('../engine/output/dom-renderer')"), 'אין יבוא של ראנדרר המורשת');
    assert(!/[^A-Za-z]renderPage\(/.test(src), 'אין קריאת renderPage — הרנדרר הוסר');
    assert(!src.includes('9c.4-marker'), 'סמן נתיב המורשת הוסר');
    assert(!/lastResult\s*\.\s*pages/.test(src), 'אין קריאת lastResult.pages בתצוגה');
    assert(!/serializedResult\s*\.\s*pages/.test(src), 'אין קריאת result.pages — המודל הוא המקור היחיד');
    assert(!/\.template\b/.test(src), 'אין צריכת תבניות מורשת — geometry בלבד');
  });

  it('W-2 (F-3.2): class מיכל הכותרת משקף את header-separator-line — סמנטיקה חיה, בלי מפתח-רפאים', () => {
    const S = getDefaultSettings();
    assertEq(S['header-separator-line'], 'gray', 'ברירת המחדל ברישום: gray');
    const body = 'פסקה עם מילים רבות למילוי עמודים. ' + 'מילים למילוי הטור ולבדיקה '.repeat(12) + '\n\n';
    const longDoc = ['שם הספר - ספר בדיקה', '', 'כותרת 2 - פרק ראשון', body.repeat(6), 'כותרת 2 - פרק שני', body.repeat(6)].join('\n');
    const r = typeset(longDoc, S, {});
    const withHdr = r.pageModel.pages.filter(p => p.header && (p.header.slots || []).length);
    assert(withHdr.length > 0, 'יש עמודים עם כותרת עליונה');
    const firstClass = (pv) => {
      const els = pv.root.querySelectorAll('.running-head');
      return els.length ? String(els[0]._class || els[0].className || '') : '';
    };
    // ברירת המחדל gray ⇒ head--sep-gray (לפני W-2 היה 'none' ממפתח-הרפאים header-separator-style — F-3.1)
    const pv1 = buildPreviewTab(makeDoc(), {});
    pv1.setResult(serializeTypesetResult(r), S, { pageModel: r.pageModel, profile: 'unified' });
    assert(firstClass(pv1).includes('head--sep-gray'), 'class משקף את ברירת המחדל gray: ' + firstClass(pv1));
    // שינוי ההגדרה משנה את ה-class — הסמנטיקה חיה (F-3.2)
    const pv2 = buildPreviewTab(makeDoc(), {});
    pv2.setResult(serializeTypesetResult(r), { ...S, 'header-separator-line': 'black' }, { pageModel: r.pageModel, profile: 'unified' });
    assert(firstClass(pv2).includes('head--sep-black'), 'class משקף black: ' + firstClass(pv2));
    const pv3 = buildPreviewTab(makeDoc(), {});
    pv3.setResult(serializeTypesetResult(r), { ...S, 'header-separator-line': 'none' }, { pageModel: r.pageModel, profile: 'unified' });
    assert(firstClass(pv3).includes('head--sep-none'), 'class משקף none: ' + firstClass(pv3));
    // ואין ל-class הזה כלל CSS משלו — הקו האמיתי מעיטור hdr-rule (F-3.1: מלכודת הקו-השני הוסרה)
    const { BASE_CSS } = require('../../src/engine/output/html-export');
    const cssNoComments = String(BASE_CSS).replace(/\/\*[\s\S]*?\*\//g, ''); // ההערות אינן כללים
    assert(!/\.head--sep-[a-z]+\s*\{/.test(cssNoComments), 'אין כלל CSS ל-head--sep-* — אין קו-שני פנטום');
    assert(!/\.running-head\s*\{/.test(cssNoComments), 'אין כלל CSS ל-running-head (מיכל המקרין סגור ב-inline styles)');
  });

  it('בדיקה שלילית (§4.4): result.pages מוחלף בנתון מכשיל — כל פעולות התצוגה והניווט עובדות מהמודל', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const doc = makeDoc();
    for (const poison of [
      ['null', (o) => { o.pages = null; }],
      ['missing', (o) => { delete o.pages; }],
      ['throwing-getter', (o) => { Object.defineProperty(o, 'pages', { get() { throw new Error('result.pages אסור בפרופיל המאוחד (9c.3)'); } }); }]
    ]) {
      const serialized = serializeTypesetResult(r);
      poison[1](serialized);
      const pv = buildPreviewTab(doc, {});
      let threw = false;
      try {
        pv.setResult(serialized, S, { pageModel: r.pageModel, profile: 'unified' });
      } catch (e) { threw = true; }
      assert(!threw, `setResult בלי result.pages (${poison[0]}) לא זורק`);
      const pages = pv.root.querySelectorAll('.preview-page');
      assertEq(pages.length, r.pageModel.pages.length, `כל העמודים מהמודל (${poison[0]})`);
      let pmr = 0;
      for (const p of pages) if (String(p._class || p.className || '').includes('pmr-page')) pmr++;
      assertEq(pmr, pages.length, `המקרין הטהור מהמודל (${poison[0]})`);
      // ניווט ומחוונים — מהמודל, בלי המבנה הישן
      assertEq(pv.getPageCount(), r.pageModel.pages.length, `מונה העמודים (${poison[0]})`);
      // מפת הגיליונות מהמודל: העמוד הראשון בלי גיליון נכנס תחת אינדקס+1=א
      const jumped = pv.jumpByHebrew('א');
      assertEq(jumped, 0, `קפיצת גיליון «א» מגיעה לעמוד הראשון (${poison[0]})`);
      pv.scrollToPage(Math.min(1, r.pageModel.pages.length - 1));
      assert(pv._lastScrollTarget() === Math.min(1, r.pageModel.pages.length - 1), `scrollToPage קובע יעד (${poison[0]})`);
    }
  });

  it('בדיקה שלילית (§4.4): מפת הסמן מהמודל ≡ מפת הסמן מעמודי התוצאה (שקילות המקורות)', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const serialized = serializeTypesetResult(r);
    const fromModel = buildCaretMap(DOC, serialized.tokens, r.pageModel.pages);
    const fromResult = buildCaretMap(DOC, serialized); // תאימות לאחור — עמודי תוצאה
    // אותם טוקנים באותם עמודים
    assertEq(fromModel.pageCount, fromResult.pageCount, 'אותו מספר עמודים');
    for (const [tok, page] of fromResult.pageByToken) {
      assertEq(fromModel.pageByToken.get(tok), page, `טוקן ${tok} באותו עמוד בשני המקורות`);
    }
    for (const [page, toks] of fromResult.tokensByPage) {
      assertEq(JSON.stringify(fromModel.tokensByPage.get(page)), JSON.stringify(toks), `אותם טוקנים בעמוד ${page}`);
    }
    // סנכרון דו-כיווני זהה בכל נקודות המבחן
    for (let c = 0; c < DOC.length; c += Math.max(1, Math.floor(DOC.length / 12))) {
      assertEq(fromModel.caretToPage(c), fromResult.caretToPage(c), `caretToPage(${c}) זהה`);
    }
    for (let p = 0; p < fromResult.pageCount; p++) {
      assertEq(fromModel.pageToCaret(p), fromResult.pageToCaret(p), `pageToCaret(${p}) זהה`);
    }
  });

  it('TOC click בתצוגה החיה (§4.3): מלבני הקישור מהמודל ב-preview — לחיצה מסונכרנת', () => {
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const tocLinks = (r.pageModel.document && r.pageModel.document.tocLinks) || [];
    const doc = makeDoc();
    const pv = buildPreviewTab(doc, {});
    const activated = [];
    const pvWithClick = buildPreviewTab(doc, { onActivatePage: (i) => activated.push(i) });
    pv.setResult(serializeTypesetResult(r), S, { pageModel: r.pageModel, profile: 'unified' });
    pvWithClick.setResult(serializeTypesetResult(r), S, { pageModel: r.pageModel, profile: 'unified' });
    if (tocLinks.length) {
      // הקישורים מוקרנים כשכבת-על בעמודי התצוגה — אותו מקור כמו הייצוא
      const links = pv.root.querySelectorAll('a.toc-link');
      assertEq(links.length, tocLinks.length, 'כל מלבני הקישור מהמודל בתצוגה');
      const hrefs = new Set(links.map(a => a.getAttribute('href')));
      const targets = new Set(pv.root.querySelectorAll('.preview-page').map(p => p.getAttribute && p.getAttribute('id')));
      for (const l of tocLinks) assert(hrefs.has(`#page-${l.targetPage}`), `קישור לעמוד ${l.targetPage}`);
      for (const h of hrefs) assert(targets.has(h.slice(1)), `יעד הקישור ${h} קיים בתצוגה`);
      // קליק על קישור TOC מפעיל סנכרון (onActivatePage עם אינדקס היעד) —
      // על המופע שחובר למאזין
      const linksLive = pvWithClick.root.querySelectorAll('a.toc-link');
      const href = linksLive[0].getAttribute('href');
      const target = Number(href.slice(6));
      linksLive[0].click();
      assert(activated.includes(target), `הקליק הפעיל סנכרון לעמוד ${target}`);
    } else {
      // מסמך ללא TOC — אין קישורים ואין קליקים (התנהגות נקייה)
      assertEq(pv.root.querySelectorAll('a.toc-link').length, 0, 'אין קישורים כשאין tocLinks במודל');
    }
  });
});

report();
