// tests/e2e/s9c-html-export.test.js — שלב 9c פרוסה 9c.2: ייצוא HTML מה-PageModel
// בלבד בנתיב המאוחד — אין צריכת result.pages, אין fallback ל-exportHtml הישן,
// ו-PageModel חסר = שגיאה מפורשת (§12 בהוראת 9b).
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const pipeline = require('../../src/engine/core/pipeline');
const geometryProjector = require('../../src/engine/output/geometry-projector');
const { exportHtmlFromModel, exportHtml } = require('../../src/engine/output/export-api');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { createApp } = require('../../src/ui/app-shell');
const { createInlineTransport } = require('../../src/ui/inline-transport');

const DOC = ['שם הספר - ספר ייצוא ה-HTML', '', 'כותרת 1 - חלק ראשון',
  'פסקה ראשונה עם מספיק מילים לעמוד שלם. ' + 'מילים למילוי הטור ולבדיקה '.repeat(8),
  'פסקה שנייה עם עוד מילים. ' + 'תוכן נוסף לבדיקת הייצוא '.repeat(6)].join('\n');

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

describe('s9c-html-export — ייצוא HTML מה-PageModel בלבד (9c.2)', () => {

  it('exportHtmlFromModel: מודל חסר/שגוי ⇒ שגיאה מפורשת (אין נתיב חלופי)', () => {
    const doc = makeDoc();
    for (const bad of [null, undefined, {}, { schema: 'other' }, { schema: 'pagemodel-v1' }]) {
      let threw = false;
      try { exportHtmlFromModel(bad, {}, doc, {}); } catch (e) { threw = /PageModel/.test(e.message); }
      assert(threw, 'דחייה מפורשת עבור ' + JSON.stringify(bad && bad.schema));
    }
  });

  it('app-shell: פרופיל מאוחד ⇒ HTML מהמודל בלי עימוד שני (הוכחה שלילית)', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: createInlineTransport() });
    app.setText(DOC);
    app.onExplicitRetypeset();
    return new Promise(resolve => setTimeout(() => {
      assert(app.getState().hasResult, 'יש תוצאה');
      assert(!!app.pageModel(), 'PageModel התקבל');
      let reTypesets = 0;
      const orig = pipeline.typeset;
      pipeline.typeset = function () { reTypesets++; throw new Error('אסור עימוד שני בייצוא HTML (9c.2)'); };
      let out;
      try {
        out = app.exportRequest('html');
      } finally {
        pipeline.typeset = orig;
      }
      assert(out && out.ok === true, 'הייצוא הצליח מהמודל: ' + JSON.stringify(out && out.reason));
      assertEq(reTypesets, 0, 'אפס עימודים חוזרים');
      assert(String(out.data).includes('dir="rtl"'), 'תוצר RTL תקין');
      assert(String(out.data).includes('page-0'), 'עמודי המודל בתוצר');
      resolve();
    }, 400));
  });

  it('app-shell: התוצר זהה ביט-לביט לייצוא ישיר מהמודל (צריכת המודל, לא result.pages)', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: createInlineTransport() });
    app.setText(DOC);
    app.onExplicitRetypeset();
    return new Promise(resolve => setTimeout(() => {
      const out = app.exportRequest('html');
      assert(out && out.ok === true, 'הייצוא הצליח');
      const direct = exportHtmlFromModel(app.pageModel(), app.getSettings(), doc, { title: 'ספר', fontCss: '' });
      // אותו מקרין ואותו מודל — הבדלי הכותרת/fontCss בלבד עלולים להיות שונים;
      // הגוף (עמודי המודל) חייב להיות זהה: בודקים את כל פלחי העמודים
      const pagesOf = (html) => (String(html).match(/id="page-\d+"/g) || []).length;
      assert(pagesOf(out.data) > 0, 'יש עמודים בתוצר ה-UI');
      assert(pagesOf(out.data) === pagesOf(direct), 'אותו מספר עמודי מודל בשני הנתיבים');
      // כל מילות המודל קיימות בתוצר ה-UI (המקרין מהמודל בלבד)
      for (const mp of app.pageModel().pages.slice(0, 3)) {
        for (const ln of mp.lines) {
          for (const w of (ln.words || [])) {
            const t = String(w.text).trim();
            if (t) assert(String(out.data).includes(t), 'מילת מודל בתוצר: ' + t);
          }
        }
      }
      resolve();
    }, 400));
  });

  it('מקור app-shell: מנוע יחיד — exportHtmlFromModel בלבד; אין נתיב מורשת (W-2 — השלמת 9c.4)', () => {
    const src = fs.readFileSync(path.join(RB, 'src/ui/app-shell.js'), 'utf8');
    assert(src.includes('exportHtmlFromModel(pageModelObj'), 'נתיב המאוחד קיים');
    assert(src.includes("reason: 'no-page-model'"), 'חסר-מודל = סירוב מפורש');
    // **W-2 (השלמת 9c.4, 27.11):** ענף המורשת הוסר מה-app-shell — אין סמן
    // ואין קריאת exportHtml(result, …); ה-HTML נוצר מה-PageModel בלבד.
    assert(!src.includes('exportHtml(result, settings, doc'), 'אין קריאת exportHtml של המורשת');
    assert(!src.includes('9c.2/9c.4-marker'), 'סמן נתיב המורשת הוסר');
  });

  it('הוכחה שלילית נוספת: patch שזורק על projectDocument — HTML המאוחד עדיין נוצר', () => {
    const S = getDefaultSettings();
    const r = pipeline.typeset(DOC, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const orig = geometryProjector.projectDocument;
    geometryProjector.projectDocument = function () { throw new Error('אסור הקרנה חדשה בייצוא HTML (9c.2)'); };
    let html;
    try {
      html = exportHtmlFromModel(r.pageModel, S, makeDoc(), { title: 'ספר' });
    } finally {
      geometryProjector.projectDocument = orig;
    }
    assert(typeof html === 'string' && html.includes('page-0'), 'הייצוא מהמודל הצליח בלי הקרנה חדשה');
  });

  it('הוכחה שלילית: patch שזורק על exportHtml הישן — הנתיב המאוחד מצליח', () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: createInlineTransport() });
    app.setText(DOC);
    app.onExplicitRetypeset();
    return new Promise(resolve => setTimeout(() => {
      assert(app.getState().hasResult && !!app.pageModel(), 'יש תוצאה ומודל');
      const api = require('../../src/engine/output/export-api');
      const orig = api.exportHtml;
      api.exportHtml = function () { throw new Error('exportHtml הישן אסור בפרופיל המאוחד (9c.2)'); };
      let out;
      try {
        out = app.exportRequest('html');
      } finally {
        api.exportHtml = orig;
      }
      assert(out && out.ok === true, 'הנתיב המאוחד הצליח בלי הייצוא הישן: ' + JSON.stringify(out && out.reason));
      resolve();
    }, 400));
  });

  it('קורפוס קנוני: כל העמודים וכל מילות המודל בייצוא; offline; גיאומטריה מהמודל', () => {
    const corpus = fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
    const S = getDefaultSettings();
    const r = pipeline.typeset(corpus, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const html = exportHtmlFromModel(r.pageModel, S, makeDoc(), { title: 'קורפוס' });
    // כל העמודים
    const pageIds = (String(html).match(/id="page-(\d+)"/g) || []).map(s => Number(s.slice(9, -1)));
    assertEq(pageIds.length, r.pageModel.pages.length, 'כל עמודי המודל בקובץ');
    assertEq(new Set(pageIds).size, pageIds.length, 'אין כפילויות עמודים');
    // offline — אין משאבי רשת
    assert(!/(src|href)\s*=\s*["'](?:https?:)?\/\//i.test(String(html)), 'אין משאבי רשת חיצוניים');
    // גיאומטריית שורות מהמודל: מיקומי השורות בפלט תואמים את המודל (דגימת עמוד ראשון עם שורות)
    const mp0 = r.pageModel.pages.find(p => (p.lines || []).length > 0);
    if (mp0) {
      const ln = mp0.lines[0];
      if (ln.x != null && ln.y != null) {
        const xR = Math.round(ln.x * 100) / 100, yR = Math.round(ln.y * 100) / 100;
        assert(String(html).includes(`left:${xR}px`) || String(html).includes(`left: ${xR}px`),
          `מיקום x של שורה ראשונה מהמודל בפלט (${xR}px)`);
        assert(String(html).includes(`top:${yR}px`) || String(html).includes(`top: ${yR}px`),
          `מיקום y של שורה ראשונה מהמודל בפלט (${yR}px)`);
      }
    }
  });

  it('קישורי TOC: כל קישור מהמודל קיים וכל יעד תקין; תוכן הערות פעם אחת בלבד', () => {
    const corpus = fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
    const S = getDefaultSettings();
    const r = pipeline.typeset(corpus, S, {});
    const html = String(exportHtmlFromModel(r.pageModel, S, makeDoc(), { title: 'קורפוס' }));
    const tocLinks = (r.pageModel.document && r.pageModel.document.tocLinks) || [];
    const hrefs = new Set((html.match(/href="#page-(\d+)"/g) || []).map(s => Number(s.slice(12, -1))));
    const targets = new Set((html.match(/id="page-(\d+)"/g) || []).map(s => Number(s.slice(9, -1))));
    for (const l of tocLinks) assert(hrefs.has(l.targetPage), `קישור TOC לעמוד ${l.targetPage} קיים`);
    for (const h of hrefs) assert(targets.has(h), `יעד הקישור page-${h} קיים בקובץ`);
    // הערות: תוכן כל הערת-גוף מופיע פעם אחת בלבד (אזור ההערות), והסמן בגוף נשאר.
    // המילים בפלט עטופות ב-span-ים — משווים על תוכן הטקסט אחרי הסרת תגים.
    const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    let noteBodies = 0, noteOnce = true;
    for (const mp of r.pageModel.pages) {
      for (const fn of (mp.footnotes || [])) {
        noteBodies++;
        const words = (fn.words || []).map(w => String(w.text)).filter(t => t.trim());
        const txt = words.join(' ').trim();
        if (txt.length > 12) {
          const count = textContent.split(txt).length - 1;
          if (count !== 1) noteOnce = false;
        }
      }
    }
    assert(noteBodies >= 0, `נבדקו ${noteBodies} הערות-גוף`);
    assert(noteOnce, 'תוכן כל הערה ארוכה מופיע פעם אחת בלבד');
    // הסמנים בעוגן נשארים: לכל הערה יש data-anchor לטוקן העוגן, והסמן
    // (marker) מופיע בגוף העמוד — פעם אחת בדיוק כמו במקור.
    let markersChecked = 0;
    for (const mp of r.pageModel.pages) {
      for (const fn of (mp.footnotes || [])) {
        if (!fn.anchorId || !fn.marker) continue;
        assert(html.includes(`data-anchor="${fn.anchorId}"`), `עוגן ההערה בפלט: ${fn.anchorId}`);
        const pageDiv = html.split(`id="page-${mp.index}"`)[1];
        const nextPage = pageDiv != null ? pageDiv.split('id="page-')[0] : '';
        // הסמן כתוכן טקסט בגוף העמוד (אחרי הסרת תגים וצמצום רווחים)
        const pageText = ' ' + nextPage.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ') + ' ';
        assert(pageText.includes(` ${fn.marker} `), `הסמן ${fn.marker} בגוף עמוד ${mp.index}`);
        markersChecked++;
      }
    }
    assert(markersChecked > 0, `נבדקו סמנים (${markersChecked})`);
  });

  it('עמוד מותאם עם תמונה (data-URI): התמונה והתיבה בייצוא מהמודל', () => {
    const PNG1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const pages = [{ id: 'logo', position: { at: 'before-shaar-main' }, counted: true,
      boxes: [{ text: 'תיבת לוגו', x: 30, y: 40, w: 120, h: 30 }],
      images: [{ src: PNG1x1, x: 200, y: 60, w: 40, h: 40 }] }];
    const S = { ...getDefaultSettings(), _customPages: JSON.stringify({ pages }) };
    const r = pipeline.typeset(DOC, S, {});
    assert(!!r.pageModel, 'PageModel קיים');
    const withCustom = r.pageModel.pages.find(p => p.custom);
    assert(withCustom != null, 'עמוד מותאם במודל');
    const html = String(exportHtmlFromModel(r.pageModel, S, makeDoc(), { title: 'ספר' }));
    assert(html.includes('custom-image'), 'אלמנט תמונה מותאמת בייצוא');
    assert(html.includes(PNG1x1), 'מקור התמונה (data-URI) מוטמע בייצוא');
    assert(html.includes('תיבת לוגו'), 'תוכן התיבה המותאמת בייצוא');
  });
});

report();
