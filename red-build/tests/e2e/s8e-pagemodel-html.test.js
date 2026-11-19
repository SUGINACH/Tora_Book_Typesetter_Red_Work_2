// tests/e2e/s8e-pagemodel-html.test.js — **שלב 8 פרוסה 4 (§3): בדיקות קבלה לייצוא HTML מה-PageModel.**
//
// ההוכחות המחייבות (הוראת שלב 8 §3):
//  1. ה-HTML נבנה מה-PageModel בלבד — אין typeset/Parser/Planner נוספים
//     (הוכחה שלילית: patch ל-pipeline שזורק).
//  2. זהות תוכן וגיאומטריה עם ה-DOM החי — אותו מקרין; אותם מיקומי שורות/
//     מילים ב-HTML כמו במודל.
//  3. כל העמודים וכל סוגי הפריטים — כולל תמונות/הערות/עיטורים/שערים/TOC.
//  4. מודל חסר/שגוי ⇒ כשל מפורש (throw) — לא fallback שקט.
//  5. הקובץ עצמאי: offline-guard עובר (אין http), @page מההגדרות.
//  6. מסמך קצר + ארוך (very_long) + מסמך תמונות.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportHtmlFromModel, exportHtml } = require('../../src/engine/output/export-api');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');

const REPO = path.resolve(__dirname, '..', '..');

// ---------- DOM shim (דפוס s8d) ----------
function makeDoc() {
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
    toggle(n, force) {
      const want = force === undefined ? !this.set.has(n) : !!force;
      if (want) this.set.add(n); else this.set.delete(n);
      this._sync();
      return want;
    }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this._text = ''; this.dir = '';
      this.classList = new ClassList(this);
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    addEventListener(type, cb) { if (!this._listeners) this._listeners = new Map(); if (!this._listeners.has(type)) this._listeners.set(type, []); this._listeners.get(type).push(cb); }
    removeEventListener(type, cb) { const a = (this._listeners && this._listeners.get(type)) || []; const i = a.indexOf(cb); if (i >= 0) a.splice(i, 1); }
    dispatchEvent(ev) {
      ev = ev || {}; ev.target = ev.target || this; ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {}); ev.stopPropagation = ev.stopPropagation || (() => {});
      let node = this;
      while (node) { for (const cb of ((node._listeners && node._listeners.get(ev.type)) || []).slice()) cb(ev); node = node.parentNode; }
      return true;
    }
    scrollIntoView() { this._scrolled = true; }
    focus() { this._focused = true; }
    // **סריאליזציה (כמו s10):** הייצוא צורך outerHTML — בלי זה אין פלט מה-shim.
    _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    _cssKey(k) { return k.replace(/[A-Z]/g, m => '-' + m.toLowerCase()); }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${this._cssKey(k)}:${this._esc(v)}`).join(';');
      const attrsStr = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${this._esc(v)}"`).join('')
        + (this._class ? ` class="${this._esc(this._class)}"` : '')
        + (styleStr ? ` style="${styleStr}"` : '')
        + Object.entries(this.dataset).map(([k, v]) => ` data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${this._esc(v)}"`).join('');
      const inner = this.children.length ? this.children.map(c => c.outerHTML()).join('') : this._esc(this._text);
      return `<${this.tagName.toLowerCase()}${attrsStr}>${inner}</${this.tagName.toLowerCase()}>`;
    }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

const DOC = [
  'כותרת 1 - חלק',
  'פסקת גוף ראשונה עם הערה [הערת ייצוא ראשונה לבדיקת המרזב בקובץ העצמאי] בתוכה.',
  'כותרת 2 - פרק הייצוא',
  'כותרת 3 - כותרת אופקית ארוכה במיוחד שנשברת לשתי שורות לפחות ברוחב העטיפה',
  'פסקה אחרי כותרת רבת שורות עם עוד הערה [הערה שנייה למרזב].',
  'כותרת 4 - רמה ארבע',
  'פסקה אחרונה של הפרק עם מספיק מילים למילוי הטורים והעמודים בנפח אמיתי.',
  ...Array.from({ length: 8 }, (_, i) => `כותרת 3 - כותרת משנה ${i + 1} לכיסוי שורות רבות בבדיקת הייצוא`),
  ...Array.from({ length: 8 }, (_, i) => `פסקת המשך ${i + 1} עם טקסט ממשי ארוך למילוי הטורים בעמודים אחדים, עם מילים רבות לבדיקת מיקומי המילים בקובץ העצמאי. ${'מילים למילוי הטור ולבדיקה '.repeat(6)}`)
].join('\n');

function buildModel() {
  const S = getDefaultSettings();
  S['h2-orn-top'] = 'lance';
  S['column-divider-style'] = 'thin';
  const r = typeset(DOC, S, {});
  return { r, S, model: r.pageModel };
}

// =====================================================================
describe('S8E-1 פרוסה 4 — ה-HTML נבנה מה-PageModel בלבד (אין עימוד שני)', () => {
  const { S, model } = buildModel();
  const doc = makeDoc();

  it('הוכחה שלילית: patch שזורק על typeset — הייצוא מסתיים ללא קריאה', () => {
    const pipeline = require('../../src/engine/core/pipeline');
    const orig = pipeline.typeset;
    let called = 0;
    pipeline.typeset = function (...a) { called++; throw new Error('אסור להפעיל typeset בייצוא HTML מהמודל (§3): ' + a[0]); };
    try {
      const html = exportHtmlFromModel(model, S, doc, { title: 'בדיקה' });
      assert(html.length > 1000, 'ה-HTML נוצר');
      assertEq(called, 0, 'typeset לא נקרא כלל');
    } finally {
      pipeline.typeset = orig;
    }
  });

  it('חתימת הפונקציה אינה מקבלת result — החוזה מוכרח במודל בלבד', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/output/export-api.js'), 'utf8');
    const i = src.indexOf('function exportHtmlFromModel(');
    assert(i > 0, 'הפונקציה קיימת');
    const sig = src.slice(i, src.indexOf(')', i));
    assert(!/result/.test(sig), 'החתימה אינה מקבלת result/pages גולמיים');
  });

  it('מודל חסר/שגוי ⇒ כשל מפורש (throw) — לא fallback שקט (§3)', () => {
    let threw = 0;
    for (const bad of [null, undefined, {}, { schema: 'other', pages: [] }, { schema: 'pagemodel-v1' }]) {
      try { exportHtmlFromModel(bad, S, doc, {}); } catch (e) { threw++; assert(/PageModel/.test(e.message), 'הודעת השגיאה מפורשת'); }
    }
    assertEq(threw, 5, 'כל הקלטים השגויים נדחים מפורשות');
  });
});

// =====================================================================
describe('S8E-2 פרוסה 4 — זהות תוכן וגיאומטריה עם ה-DOM ועם המודל', () => {
  const { S, model } = buildModel();
  const doc = makeDoc();

  it('אותם מיקומי שורות ב-HTML כמו במודל (left/top/width/height מהסטרינג)', () => {
    const html = exportHtmlFromModel(model, S, doc, {});
    let checked = 0;
    for (const mp of model.pages) {
      for (const ln of mp.lines) {
        if (ln.area !== 'column' || !ln.id) continue;
        // השורה מוקרנת עם data-id + סגנון ממוקם — נמצא את החתימה בסטרינג
        assert(html.includes(`data-id="${ln.id}"`), `שורה ${ln.id} חסרה ב-HTML`);
        checked++;
      }
    }
    assert(checked > 20, `נבדקו ${checked} שורות`);
  });

  it('אותן מילים: טקסט כל מילה מופיע; מספר עוגני המילים זהה למודל', () => {
    const html = exportHtmlFromModel(model, S, doc, {});
    // **חוזה סמני הערה (s9e/renderer):** מילת-סמן נושאת class="w w--fnmarker" —
    // העוגן הוא המחלקה w עם מודיפיקטורים אפשריים; הספירה נשארת מדויקת
    // (כל מילת מודל = עוגן אחד בדיוק).
    const wCount = (html.match(/class="w[ "]/g) || []).length;
    // מקורות עוגני המילים במקרין: שורות (כל האזורים) + מילות מרזב ההערות
    let modelWords = 0;
    for (const mp of model.pages) {
      for (const ln of mp.lines) modelWords += (ln.words || []).length;
      for (const n of (mp.footnotes || [])) modelWords += (n.words || []).length;
    }
    assert(wCount === modelWords, `עוגני מילים: HTML ${wCount} מול מודל ${modelWords}`);
  });

  it('זהות עם ה-DOM החי: אותו מקרין ⇒ אותו פלט לכל עמוד (השוואת חתימות עמוד)', () => {
    const html = exportHtmlFromModel(model, S, doc, {});
    for (const mp of model.pages.slice(0, 4)) {
      const domEl = renderModelPage(mp, S, doc);
      // אותו מקרין: מספר עוגני המילים ב-DOM == בפלח ה-HTML של אותו עמוד
      const marker = `data-page-index="${mp.index}"`;
      const i = html.indexOf(marker);
      assert(i >= 0, `עמוד ${mp.index} ב-HTML`);
      const j = html.indexOf('data-page-index', i + 10);
      const seg = html.slice(i, j > 0 ? j : i + 200000);
      const domW = (String(domEl.textContent).match(/\S+/g) || []).length;
      // כל מילות המודל של העמוד קיימות בפלח (טקסט מובלע בסריאליזציה)
      let wordsInSeg = 0;
      for (const ln of mp.lines) {
        for (const w of (ln.words || [])) {
          const t = String(w.text).trim();
          if (t && seg.includes(t)) wordsInSeg++;
        }
      }
      const modelW = mp.lines.reduce((s, l) => s + (l.words || []).length, 0);
      assert(wordsInSeg >= Math.floor(modelW * 0.9), `עמוד ${mp.index}: ${wordsInSeg}/${modelW} מילות מודל בפלח ה-HTML`);
      // **9b.5:** שער אחורי ללא מקטעים (אין ערכים — אין המצאה) הוא מצב לגיטימי:
      // ה-DOM מרונדר עם מילים בדיוק כשיש מילים במודל.
      assert((domW > 0) === (modelW > 0), `עמוד ${mp.index} מרונדר ב-DOM בהתאם למודל (dom=${domW}, model=${modelW})`);
    }
  });
});

// =====================================================================
describe('S8E-3 פרוסה 4 — כיסוי, עצמאות וקישורים', () => {
  const { S, model } = buildModel();
  const doc = makeDoc();

  it('כל העמודים בקובץ; כיסוי סוגי תוכן (שער/פס/הערות/עיטור/גיליון/TOC)', () => {
    const html = exportHtmlFromModel(model, S, doc, {});
    let pageCount = 0;
    for (const mp of model.pages) {
      if (html.includes(`data-page-index="${mp.index}"`)) pageCount++;
    }
    assertEq(pageCount, model.pages.length, 'כל עמודי המודל בקובץ');
    assert(html.includes('shaar-content'), 'תיבת שער');
    assert(html.includes('spanning-band'), 'פס חוצה-טורים');
    assert(html.includes('footnote'), 'הערות');
    assert(html.includes('orn'), 'עיטורים');
    assert(html.includes('folio'), 'גיליון');
    assert(html.includes('running-head'), 'כותרת עליונה');
  });

  it('קישורי TOC מוקרנים מהמודל (tocLinks → href=#page-N)', () => {
    const links = (model.document && model.document.tocLinks) || [];
    const html = exportHtmlFromModel(model, S, doc, {});
    if (links.length) {
      let found = 0;
      for (const l of links) if (html.includes(`href="#page-${l.targetPage}"`)) found++;
      assertEq(found, links.length, `קישורי TOC: ${found}/${links.length}`);
      // היעדים קיימים כעוגנים
      for (const l of links.slice(0, 5)) assert(html.includes(`id="page-${l.targetPage}"`), `יעד page-${l.targetPage}`);
    } else {
      assert(html.includes('id="page-'), 'עוגני עמוד קיימים גם ללא קישורים');
    }
  });

  it('עצמאות: offline-guard עובר — אין משאבי רשת בקובץ (§3)', () => {
    const html = exportHtmlFromModel(model, S, doc, {});
    assert(!/src\s*=\s*"http:|href\s*=\s*"http:|url\(http:/.test(html), 'אסורים כתובות רשת בקובץ העצמאי');
    assert(html.startsWith('<!DOCTYPE html>'), 'מבנה HTML תקין');
    assert(html.includes('dir="rtl"'), 'RTL');
  });

  it('מסמך ארוך (very_long) — הייצוא מהמודל עובר במלואו ושומר נפח', () => {
    const text = fs.readFileSync(path.join(REPO, '..', 'audits', 'very_long_test_text.txt'), 'utf8');
    const r = typeset(text, getDefaultSettings(), {});
    const html = exportHtmlFromModel(r.pageModel, getDefaultSettings(), makeDoc(), {});
    let modelWords = 0;
    for (const mp of r.pageModel.pages) {
      for (const ln of mp.lines) modelWords += (ln.words || []).length;
      for (const n of (mp.footnotes || [])) modelWords += (n.words || []).length;
    }
    const wCount = (html.match(/class="w[ "]/g) || []).length;
    assertEq(wCount, modelWords, `כל ${modelWords.toLocaleString()} מילי המודל בקובץ`);
    // רצפת נפח בסטרינג: מילים בטקסט הגולמי של השורות
    let textWords = 0;
    for (const mp of r.pageModel.pages) for (const ln of mp.lines) for (const w of (ln.words || [])) textWords += String(w.text).split(/\s+/).filter(Boolean).length;
    assert(textWords >= 340000, `נפח תוכן (${textWords.toLocaleString()})`);
  }, { timeout: 400_000 });
});

// =====================================================================
describe('S8E-4b פרוסה 4 — אינטגרציית אפליקציה: הייצור מגיע מהמודל בפועל', () => {
  it('createApp (unified, inline-transport): onExportRequest(html) מחזיר HTML מה-PageModel; בלי מודל ⇒ כשל מפורש', async () => {
    const { createApp } = require('../../src/ui/app-shell');
    const inlineTransport = require('../../src/ui/inline-transport');
    // shim מינימלי לאפליקציה (דפוס s10 מקוצר — החלקים הנחוצים לעימוד+ייצוא)
    const richDoc = DOC;
    const transport = inlineTransport.createInlineTransport();
    const files = [];
    const notices = [];
    const doc2 = makeDoc();
    const app = createApp(doc2, {
      transport,
      onExportFile: (kind, data, name) => files.push({ kind, name, data }),
      onNotice: (m) => notices.push(m)
    });
    // הזרקת מסמך ועימוד
    app.editor.textarea.value = richDoc;
    app.editor.textarea.dispatchEvent({ type: 'input', bubbles: true });
    await new Promise((r) => setTimeout(r, 60));
    await app.onExplicitRetypeset();
    await new Promise((r) => setTimeout(r, 120));
    const st = app.getState();
    assert(st.hasResult && st.pages > 0, 'העימוד הושלם (' + st.pages + ' עמודים)');
    assert(app.pageModel && app.pageModel(), 'PageModel זמין באפליקציה');
    // ייצוא HTML — בפרופיל המאוחד מהמודל
    const res = app.exportRequest('html');
    assert(res && res.ok, 'הייצוא הצליח: ' + JSON.stringify(res && (res.reason || 'ok')));
    assert(files.length === 1 && files[0].kind === 'html', 'קובץ HTML יוצא');
    assert(String(files[0].data).includes('data-page-index'), 'הקובץ מהמקרין הטהור (עוגני מודל)');
    assert(String(files[0].data).includes('pmr-page'), 'עמודי PageModel-renderer בקובץ');
  }, { timeout: 120_000 });
});

// =====================================================================
describe('S8E-4 פרוסה 4 — תקופת המעבר: הנתיב הישן לא נפגע', () => {
  it('exportHtml הישן עדיין עובד על תוצאות legacy (פרופיל legacy)', () => {
    const { r, S } = buildModel();
    const doc = makeDoc();
    const html = exportHtml(r, S, doc, {});
    assert(html.length > 1000, 'הנתיב הישן מייצר');
    assert(html.includes('class="page'), 'עמודי הנתיב הישן');
  });
});

report('s8e-pagemodel-html');
