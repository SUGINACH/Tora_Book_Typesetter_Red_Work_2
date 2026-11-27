// tests/e2e/s9c-pdf-export.test.js — שלב 9c פרוסה 9c.1: ייצוא PDF מה-PageModel
// בלבד בכל נתיבי המאוחד — אין עימוד שני, אין נפילה שקטה ל-exportPdf, וחסר-מודל
// = כשל מפורש (§12 בהוראת 9b).
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const exportApi = require('../../src/engine/output/export-api');
const { exportPdfFromModel } = exportApi;
const { createApp } = require('../../src/ui/app-shell');
const { createInlineTransport } = require('../../src/ui/inline-transport');
const { WorkerEngineClient } = require('../../src/ui/worker-client');

const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);
const FONT_BYTES = HAS_DEJAVU ? fs.readFileSync(DEJAVU) : null;

const DOC = ['שם הספר - ספר ייצוא ה-PDF', '', 'כותרת 1 - חלק ראשון',
  'פסקה ראשונה עם מספיק מילים לעמוד שלם ומלא. ' + 'מילים למילוי הטור ולבדיקה '.repeat(8),
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

describe('s9c-pdf-export — ייצוא PDF מה-PageModel בלבד (9c.1)', () => {

  it('הוכחה שלילית: exportPdfFromModel אינו קורא ל-typeset (אפס עימוד שני)', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const S = getDefaultSettings();
    const r = typeset(DOC, S, {});
    assert(!r.legacyProfile, 'המנוע המאוחד');
    assert(!!r.pageModel, 'PageModel קיים');
    let legacyCalls = 0;
    const originalLegacyExport = exportApi.exportPdf;
    exportApi.exportPdf = function () {
      legacyCalls++;
      throw new Error('נתיב PDF של המורשת אינו מותר בייצוא מהמודל (9c.1)');
    };
    try {
      const res = exportPdfFromModel(r.pageModel, S, FONT_BYTES, 'DejaVu Sans');
      assert(res.ok, 'הייצוא מסתיים בהצלחה מהמודל בלבד');
      assertEq(legacyCalls, 0, 'exportPdf של המורשת לא נקרא כלל');
    } finally {
      exportApi.exportPdf = originalLegacyExport;
    }
  });

  it('app-shell (נתיב מקומי): פרופיל מאוחד ⇒ ייצוא מהמודל בלי עימוד שני', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const doc = makeDoc();
    const app = createApp(doc, { transport: createInlineTransport(), embeddedFont: FONT_BYTES });
    app.setText(DOC);
    app.onExplicitRetypeset();
    return new Promise(resolve => setTimeout(() => {
      assert(app.getState().hasResult, 'יש תוצאת עימוד');
      assert(!!app.pageModel(), 'PageModel התקבל בצרכן');
      let modelCalls = 0, legacyCalls = 0;
      const originalModelExport = exportApi.exportPdfFromModel;
      const originalLegacyExport = exportApi.exportPdf;
      exportApi.exportPdfFromModel = function (...args) {
        modelCalls++;
        return originalModelExport(...args);
      };
      exportApi.exportPdf = function () {
        legacyCalls++;
        throw new Error('אין fallback לייצוא PDF של המורשת (9c.1)');
      };
      let out;
      try {
        out = app.exportRequest('pdf');
      } finally {
        exportApi.exportPdfFromModel = originalModelExport;
        exportApi.exportPdf = originalLegacyExport;
      }
      assert(out && out.ok === true, 'הייצוא הצליח מהמודל שכבר חושב: ' + JSON.stringify(out && out.reason));
      assertEq(modelCalls, 1, 'ייצוא מהמודל נקרא פעם אחת');
      assertEq(legacyCalls, 0, 'נתיב המורשת לא נקרא');
      assert(out.data && out.data.length > 1000, 'בתים של PDF אמיתי');
      resolve();
    }, 400));
  });

  it('app-shell (נתיב מקומי): מאוחד בלי תוצאת עימוד ⇒ כשל מפורש (אין נפילה לעימוד מחדש)', () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const doc = makeDoc();
    const app = createApp(doc, { transport: createInlineTransport(), embeddedFont: FONT_BYTES });
    // בלי טקסט ובלי עימוד כלל: אין תוצאה, אין מודל, אין דגלי-שינוי —
    // הייצוא חייב להיכשל מפורשות על היעדר המודל (לא עימוד חלופי בשקט)
    let legacyCalls = 0;
    const originalLegacyExport = exportApi.exportPdf;
    exportApi.exportPdf = function () {
      legacyCalls++;
      throw new Error('אין fallback לייצוא PDF של המורשת (9c.1)');
    };
    let out;
    try {
      out = app.exportRequest('pdf');
    } finally {
      exportApi.exportPdf = originalLegacyExport;
    }
    assert(out === null, 'ללא תוצאת עימוד הייצוא מסורב מפורשות (null + הודעה) — לא עימוד חלופי');
    assertEq(legacyCalls, 0, 'לא בוצע fallback לנתיב המורשת');
  });

  it('Worker E2E: אחרי typeset מאוחד ה-PDF נכתב מאותו PageModel בלי fallback', async () => {
    if (!HAS_DEJAVU) { console.error('  [מדלג — DejaVu לא במערכת]'); return; }
    const client = new WorkerEngineClient(createInlineTransport());
    const settings = getDefaultSettings();
    let modelCalls = 0, legacyCalls = 0;
    const originalModelExport = exportApi.exportPdfFromModel;
    const originalLegacyExport = exportApi.exportPdf;
    exportApi.exportPdfFromModel = function (...args) {
      modelCalls++;
      return originalModelExport(...args);
    };
    exportApi.exportPdf = function () {
      legacyCalls++;
      throw new Error('Worker ניסה ליפול לנתיב PDF של המורשת');
    };
    try {
      const job = client.requestTypeset({ text: DOC, settings });
      const typesetResult = await job.promise;
      assert(typesetResult && typesetResult.legacyProfile !== true, 'ה-Worker השלים עימוד בפרופיל המאוחד');

      const pdf = await client.requestExport({
        kind: 'pdf', text: DOC, settings, fontBytes: FONT_BYTES, fontName: 'DejaVu Sans'
      });
      assert(pdf && pdf.bytes && pdf.bytes.length > 1000, 'ה-Worker החזיר בתים של PDF אמיתי');
      assert(pdf.info && pdf.info.pages > 0, 'פרטי הייצוא מכילים מספר עמודים');
      assertEq(modelCalls, 1, 'ה-Worker קרא ל-exportPdfFromModel פעם אחת');
      assertEq(legacyCalls, 0, 'ה-Worker לא קרא ל-exportPdf של המורשת');
    } finally {
      exportApi.exportPdfFromModel = originalModelExport;
      exportApi.exportPdf = originalLegacyExport;
    }
  });

  it('מקור ה-Worker: מנוע יחיד — exportPdfFromModel בלבד; אין נתיב מורשת (W-2 — השלמת 9c.4)', () => {
    const src = fs.readFileSync(path.join(RB, 'src/ui/engine-worker-main.js'), 'utf8');
    assert(src.includes('model-required'), 'שגיאת model-required קיימת ב-Worker');
    // **W-2 (השלמת 9c.4, 27.11):** נתיב המורשת הוסר מה-Worker (עם הסרת המנוע
    // ב-6cc5f76) — החוזה: ייצוא מ-_lastTypesetResult.pageModel בלבד; לא קריאת
    // exportPdf(msg.text…) כלל (אין עימוד שני ואין נתיב חלופי); אין פיצול פרופילים.
    assert(src.includes('exportPdfFromModel(_lastTypesetResult.pageModel'), 'הנתיב המאוחד מייצא מהמודל');
    assert(!src.includes('exportPdf(msg.text'), 'אין קריאת exportPdf של המורשת');
    assert(!src.includes('9c.4-marker'), 'סמן נתיב המורשת הוסר');
    assert(!src.includes('isLegacyProfile'), 'אין פיצול פרופילים — מנוע יחיד');
  });
});

report();
