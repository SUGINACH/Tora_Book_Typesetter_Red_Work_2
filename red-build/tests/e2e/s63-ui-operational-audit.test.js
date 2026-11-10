// tests/e2e/s63-ui-operational-audit.test.js — S1-ה: בדיקות קבלה לתיקוני האודיט התפעולי (סוכן 1)
// שני החסמים שנמצאו באודיט ותוקנו (audits/UI_OPERATIONAL_AUDIT.md):
//   U-1 — ביטול מפורש של עימוד פעיל: המנגנון היה קיים ב-worker-client אך לא היה
//         נגיש למשתמש כפעולה גלויה (רק עקיפות: בקשה חדשה/ניקוי). תוקן: כפתור ⏹
//         בפס המצב, גלוי רק בזמן עבודה.
//   U-2 — מידע ריצה: hash פריסה/קלט, מזהה ריצה, זמן ריצה וגרסת נכסים לא היו מוצגים
//         כלל בממשק (רק ב-JSON הדיבאג) — בניגוד לתכנית האב §7.1. תוקן: צ'יפ
//         מידע-ריצה בפס המצב + פרטים מלאים ב-tooltip.
// שני התיקונים UI-בלבד (src/ui/**): אפס שינוי מנוע, אפס שינוי פרוטוקול — הוכח
// בבדיקת ה-hash הזהה לריצת headless ישירה.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { createApp } = require('../../src/ui/app-shell');
const inlineTransport = require('../../src/ui/inline-transport');

// ================= DOM shim (עותק הדוק של s10 — אותו חוזה) =================
function makeDoc() {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cssKey = (k) => k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
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
      this.style = {}; this._class = ''; this.dir = ''; this._text = '';
      this.classList = new ClassList(this);
      this._listeners = new Map();
      this.value = ''; this.checked = false; this.disabled = false;
      this.type = ''; this.title = ''; this.selectionStart = 0; this.selectionEnd = 0;
      this._scrolled = false;
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
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : (k === 'id' && this.id != null ? this.id : null); }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(type, cb) {
      if (!this._listeners.has(type)) this._listeners.set(type, []);
      this._listeners.get(type).push(cb);
    }
    removeEventListener(type, cb) {
      const arr = this._listeners.get(type) || [];
      const i = arr.indexOf(cb);
      if (i >= 0) arr.splice(i, 1);
    }
    dispatchEvent(ev) {
      ev = ev || {};
      ev.target = ev.target || this;
      ev.type = ev.type || 'click';
      ev.preventDefault = ev.preventDefault || (() => {});
      ev.stopPropagation = ev.stopPropagation || (() => {});
      ev._stopped = false;
      const stop = ev.stopPropagation.bind(ev);
      ev.stopPropagation = () => { ev._stopped = true; stop(); };
      let node = this;
      while (node) {
        ev.currentTarget = node;
        for (const cb of (node._listeners.get(ev.type) || []).slice()) cb(ev);
        if (ev._stopped) break;
        node = node.parentNode;
      }
      return true;
    }
    click() { this.dispatchEvent({ type: 'click' }); }
    setSelectionRange(a, b) { this.selectionStart = a; this.selectionEnd = b; }
    scrollIntoView() { this._scrolled = true; }
    focus() { this._focused = true; }
    _matchesPart(sel) {
      if (sel.startsWith('.')) return this.classList.contains(sel.slice(1));
      if (sel.startsWith('#')) return this.getAttribute('id') === sel.slice(1);
      if (sel.startsWith('[')) {
        const m = sel.match(/^\[([^\]]+)\]$/);
        return !!m && (m[1] in this.dataset || m[1] in this.attrs);
      }
      return this.tagName === sel.toUpperCase();
    }
    _matches(sel) {
      const parts = String(sel).trim().split(/\s+/);
      if (!this._matchesPart(parts[parts.length - 1])) return false;
      let ancestor = this.parentNode, pi = parts.length - 2;
      while (pi >= 0 && ancestor) {
        if (ancestor._matchesPart && ancestor._matchesPart(parts[pi])) pi--;
        ancestor = ancestor.parentNode;
      }
      return pi < 0;
    }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) {
      const out = [];
      (function walk(el) {
        for (const c of el.children) {
          if (c._matches && c._matches(sel)) out.push(c);
          walk(c);
        }
      })(this);
      return out;
    }
  }
  return {
    createElement: (tag) => new El(tag),
    createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; },
    _El: El
  };
}

function fire(el, type, extra) { el.dispatchEvent(Object.assign({ type }, extra || {})); }
const settle = (ms = 20) => new Promise(r => setTimeout(r, ms));

// מסמך קטן עם הערות-שוליים + כותרות (עקב אחר SMALL_DOC של s10)
const SMALL_DOC = [
  'ספר - אוסף לבדיקות UI',
  '',
  'כותרת 1 - חלק ראשון',
  'פסקת פתיחה ראשונה עם כמה מילים כדי למלא שורה אחת לפחות בעמוד.',
  'פסקה שנייה עם הערת שוליים [זו הערת השוליים הראשונה] בתוך הטקסט.',
  'פסקה שלישית שממשיכה את הזרימה של החלק הראשון בעוד כמה מילים.',
  'כותרת 2 - סימן ראשון',
  'תוכן הסימן הראשון פסקה ראשונה עם עוד הערה [הערה שנייה כאן] לבדיקה.',
  'תוכן הסימן הראשון פסקה שנייה שממשיכה ומוסיפה נפח לטור השני.',
  'כותרת 3 - תת סימן',
  'תוכן תת הסימן פסקה יחידה לבדיקת רמות כותרות.',
  'כותרת 1 - חלק שני',
  'פתיחת החלק השני בפסקה שמתחילה בעמוד חדש עם עוד תוכן כלשהו.',
  'עוד פסקה בחלק השני כדי שיהיה מה למפות בין עמודים [הערה שלישית].',
  'פסקה אחרונה בחלק השני שסוגרת את המסמך הקטן בשלום.'
].join('\n');

/** תעבורה ידנית (בלי terminate): הבקשות נשמרות; התשובות רק כשמשיבים להן. */
function makeManualTransport(withTerminate) {
  let handler = null;
  const posted = [];
  const t = {
    posted,
    post: (m) => { posted.push(m); },
    setHandler: (cb) => { handler = cb; },
    reply: (m) => { if (handler) handler(m); }
  };
  if (withTerminate) t.terminate = () => { /* דפדפן: הריגה; כאן סימולציה */ };
  return t;
}

// =====================================================================
describe('S1-ה/U-1 — ביטול מפורש של עימוד פעיל (כפתור ⏹ בפס המצב)', () => {
  it('הכפתור נסתר במנוחה, נגלה בזמן עבודה ונעלם לאחר ביטול; התוצאה המבוטלת אינה מיושמת', async () => {
    const doc = makeDoc();
    const transport = makeManualTransport(false); // בלי terminate ⇒ פרידה כ-{cancelled:true}
    const app = createApp(doc, { transport });
    const cancelBtn = app.status.cancelBtn;
    assert(cancelBtn, 'כפתור הביטול חייב להיחשף מפס המצב');
    assertEq(cancelBtn.style.display, 'none', 'במנוחה הכפתור חייב להיות נסתר');

    app.setText(SMALL_DOC);
    app.onExplicitRetypeset();
    await settle();
    const reqMsg = transport.posted.find(m => m.type === 'typeset-request');
    assert(reqMsg, 'בקשת העימוד נשלחה');
    assertEq(cancelBtn.style.display, '', 'בזמן עבודה הכפתור חייב להיות גלוי');
    assert(app.root.querySelector('.chip--engine').textContent.includes('עמל'), 'מצב המנוע — עמל');

    // progress זורם בזמן עבודה
    transport.reply({ type: 'progress', jobId: reqMsg.jobId, stage: 'pages', pct: 30, label: 'עמוד 3 מתוך 9' });
    assert(app.root.querySelector('.chip--progress').textContent.includes('עמוד 3'), 'ההתקדמות מוצגת בזמן עבודה');

    // ביטול מפורש
    cancelBtn.click();
    assert(transport.posted.some(m => m.type === 'cancel' && m.jobId === reqMsg.jobId), 'הודעת cancel נשלחה לעבודה הפעילה');
    assertEq(cancelBtn.style.display, 'none', 'לאחר ביטול הכפתור נסתר');
    assert(app.root.querySelector('.chip--engine').textContent.includes('פנוי'), 'המנוע חזר למצב פנוי');

    // תוצאה מאוחרת של העבודה שבוטלה — נזרקת, לא מיושמת
    transport.reply({ type: 'typeset-result', jobId: reqMsg.jobId, result: { pages: [{ index: 0 }], layoutHash: 'cancelled-x' } });
    await settle();
    assert(!app.getState().hasResult, 'תוצאה של עבודה מבוטלת אסור שתיושם');
    assertEq(app.getState().pages, 0);
  });

  it('נתיב הדפדפן (terminate): הבטחה נדחית בשקט (RESTART_ERROR), המצב חוזר לפנוי, ובקשה חדשה עובדת', async () => {
    const doc = makeDoc();
    const transport = makeManualTransport(true); // עם terminate ⇒ דחיית RESTART_ERROR
    const app = createApp(doc, { transport });
    app.setText(SMALL_DOC);
    app.onExplicitRetypeset();
    await settle();
    const jobId1 = transport.posted.find(m => m.type === 'typeset-request').jobId;

    app.status.cancelBtn.click(); // engine.cancel → terminate → reject(RESTART_ERROR) → שקט
    await settle();
    assert(app.root.querySelector('.chip--engine').textContent.includes('פנוי'), 'מצב המנוע חזר לפנוי גם בנתיב ה-terminate');
    assert(!app.root.querySelector('.chip--engine').textContent.includes('שגיאה'), 'ביטול אינו מוצג כשגיאה');
    assert(!app.getState().hasResult, 'אין תוצאה לאחר ביטול');

    // respawn: בקשה חדשה אחרי ביטול עובדת (jobId חדש)
    app.onExplicitRetypeset();
    await settle();
    const req2 = transport.posted.filter(m => m.type === 'typeset-request').pop();
    assert(req2 && req2.jobId !== jobId1, 'בקשה חדשה אחרי ביטול מקבלת מזהה עבודה חדש');
  });
});

// =====================================================================
describe('S1-ה/U-2 — מידע ריצה מוצג למשתמש (hash/שימור/עמודים/זמן/מזהה/גרסה)', () => {
  it('הדבקה ⇒ הצ\'יפ מציג hash מקוצר, שימור ✓, מספר עמודים וזמן ריצה; הפרטים המלאים ב-tooltip', async () => {
    const doc = makeDoc();
    const app = createApp(doc, {
      transport: inlineTransport.createInlineTransport(),
      engineVersion: 'test-v-s1e'
    });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(80);
    const st = app.getState();
    assert(st.hasResult, 'התוצאה חייבת להיות מיושמת אחרי הדבקה');

    const chip = app.root.querySelector('.chip--runinfo');
    assert(chip, 'צ\'יפ מידע הריצה קיים בפס המצב');
    const txt = chip.textContent;
    assert(txt.includes(String(st.layoutHash).slice(0, 8)), `hash מקוצר בצ\'יפ: ${txt}`);
    assert(txt.includes('שימור ✓'), `שימור תוכן בצ\'יפ: ${txt}`);
    assert(txt.includes(`${st.pages} עמ׳`), `מספר עמודים בצ\'יפ: ${txt}`);
    assert(/(מ״ש|שנ׳)/.test(txt), `זמן ריצה בצ\'יפ: ${txt}`);

    const title = chip.title;
    assert(title.includes('מזהה ריצה: job-'), 'מזהה הריצה ב-tooltip');
    assert(title.includes(`hash פריסה: ${st.layoutHash}`), 'hash הפריסה המלא ב-tooltip');
    assert(title.includes('hash קלט: '), 'hash הקלט ב-tooltip');
    assert(title.includes('גרסת נכסים: test-v-s1e'), 'גרסת הנכסים ב-tooltip');
  });

  it('ה-hash המוצג זהה לריצת headless ישירה — התיקון UI-בלבד ואינו משנה את תוצאת המנוע', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(80);
    const direct = typeset(SMALL_DOC, getDefaultSettings());
    assertEq(app.getState().layoutHash, direct.layoutHash, 'hash מהאפליקציה זהה ל-headless');
    const chipTxt = app.root.querySelector('.chip--runinfo').textContent;
    assert(chipTxt.includes(direct.layoutHash.slice(0, 8)), 'הצ\'יפ מציג את אותו hash');
  });

  it('ניקוי המסמך (🗑) מרוקן את צ\'יפ מידע הריצה', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(80);
    assert(app.root.querySelector('.chip--runinfo').textContent !== '', 'יש מידע ריצה לפני הניקוי');
    app.onDocumentAction('clear', '');
    assertEq(app.root.querySelector('.chip--runinfo').textContent, '', 'הניקוי מרוקן את מידע הריצה');
    assertEq(app.root.querySelector('.chip--runinfo').title, '');
  });
});

// =====================================================================
describe('S1-ה — סקירת האודיט התפעולי: חוזה ונייטרליות', () => {
  it('שני התיקונים אינם משנים חוזה: פרוטוקול ה-Worker ללא הודעות חדשות מצד ה-UI', () => {
    // הביטול משתמש בהודעת cancel הקיימת (v1); מידע הריצה נבנה מהתוצאה המסונכרנת
    // (serializeTypesetResult) — שניהם ללא שינוי סכמה. הוכחה שלילית: ולידציית
    // הבקשות ממשיכה לקבל בדיוק את ארבעת הסוגים המוכרים.
    const { validateRequest } = require('../../src/ui/worker-protocol');
    const ok = (m) => { try { validateRequest(m); return true; } catch (e) { return false; } };
    assert(ok({ type: 'typeset-request', jobId: 'j1', text: 'x', settings: {} }), 'typeset-request תקין');
    assert(ok({ type: 'cancel', jobId: 'j1' }), 'cancel תקין');
    assert(ok({ type: 'register-font', jobId: 'j1', name: 'f', bytes: new ArrayBuffer(4) }), 'register-font תקין');
    assert(ok({ type: 'export-request', jobId: 'j1', kind: 'pdf', text: 'x', settings: {} }), 'export-request תקין');
    assert(!ok({ type: 'ui-cancel-visual', jobId: 'j1' }), 'לא נוסף סוג הודעה חדש');
  });

  it('דטרמיניזם UI: שתי הדבקות של אותו מסמך ⇒ אותו hash מוצג בצ\'יפ', async () => {
    const doc = makeDoc();
    const app = createApp(doc, { transport: inlineTransport.createInlineTransport() });
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(80);
    const h1 = app.root.querySelector('.chip--runinfo').textContent;
    fire(app.editor.textarea, 'paste', { clipboardData: { getData: () => SMALL_DOC } });
    await settle(80);
    const h2 = app.root.querySelector('.chip--runinfo').textContent;
    assertEq(h1.split('·')[0].trim(), h2.split('·')[0].trim(), 'אותו hash מקוצר בשתי הרצות');
  });
});

report('s63-ui-operational-audit');
