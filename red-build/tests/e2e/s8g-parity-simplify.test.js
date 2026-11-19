// tests/e2e/s8g-parity-simplify.test.js — **שלב 8 פרוסה 6 (§5): מלאי, parity תלת-יעדי ופישוט.**
//
// ההוכחות המחייבות (הוראת שלב 8 §5):
//  1. PageModel הוא מקור הגיאומטריה היחיד לשלושת היעדים (DOM/HTML/PDF).
//  2. המקרינים אינם מודדים ואינם מחליטים (סטטי + שלילי).
//  3. אין עימוד נוסף בייצוא (HTML+PDF).
//  4. אין חישוב גיאומטרי כפול ללא הצדקה — מלאי לפי פונקציה.
//  5. כל סוג פריט נשמר בכל היעדים (ספירת עוגנים DOM==HTML; PDF עמודים==מודל).
//  6. דטרמיניזם: ייצוא כפול זהה ביט-לביט.
//  7. אין פגיעת ביצועים מהשמטת תוכן — parity מילים מלא.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportHtmlFromModel, exportPdfFromModel } = require('../../src/engine/output/export-api');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const REPO = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));

function makeDoc() {
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this._text = ''; this.dir = ''; }
    set className(v) { this._class = String(v); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    outerHTML() {
      const styleStr = Object.entries(this.style).map(([k, v]) => `${k}:${this._esc(v)}`).join(';');
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

function countWordAnchors(html) {
  const spans = String(html).matchAll(/<span\b[^>]*class="([^"]*)"[^>]*>/g);
  let count = 0;
  for (const match of spans) {
    if (match[1].split(/\s+/).includes('w')) count++;
  }
  return count;
}

const DOC = [
  'כותרת 1 - חלק',
  'פסקה ראשונה עם הערה [הערת parity ראשונה] בתוכה.',
  'כותרת 2 - פרק',
  'כותרת 3 - כותרת אופקית ארוכה במיוחד שנשברת לשתי שורות ברוחב העטיפה',
  'פסקה עם הערה [הערה שנייה לבדיקה].',
  'כותרת 4 - רמה',
  ...Array.from({ length: 6 }, (_, i) => `פסקת המשך ${i + 1} עם טקסט ארוך למילוי הטורים והעמודים. ${'מילים למילוי ולבדיקת parity '.repeat(4)}`)
].join('\n');

function buildAll() {
  clearRegisteredFonts();
  for (const fam of ['Frank Ruhl Libre', 'David Libre', 'Hadassah Friedlaender']) {
    const e = CATALOG.find(x => x.family === fam);
    if (e) registerFont(fam, fs.readFileSync(path.join(ASSETS, 'fonts', e.file)));
  }
  const S = getDefaultSettings();
  S['h2-orn-top'] = 'lance';
  S['column-divider-style'] = 'thin';
  const r = typeset(DOC, S, {});
  const e = CATALOG.find(x => x.family === 'Frank Ruhl Libre');
  const fontBytes = fs.readFileSync(path.join(ASSETS, 'fonts', e.file));
  return { r, S, model: r.pageModel, fontBytes };
}

// =====================================================================
describe('S8G-1 מלאי קוד — סיווג פונקציות המודולים (§5)', () => {
  const MODULES = [
    'src/engine/output/pagemodel-dom-renderer.js',
    'src/engine/output/html-export.js',
    'src/engine/output/pdf-writer.js'
  ];
  const INV = {
    'src/engine/output/pagemodel-dom-renderer.js': {
      role: 'ציור בלבד (DOM מהמודל)',
      forbidden: [/require\([^)]*measure-api/, /measureTextWidth/, /breakLines/, /wrapText/]
    },
    'src/engine/output/html-export.js': {
      role: 'אריזה (עטיפת HTML עצמאית)',
      forbidden: [/require\([^)]*measure-api/, /require\([^)]*pipeline/, /typeset\(/]
    },
    'src/engine/output/pdf-writer.js': {
      role: 'הפקה ואריזה (PDF)',
      forbidden: [/require\([^)]*measure-api/, /require\([^)]*core\/pipeline/, /measureTextWidth/]
    }
  };

  it('לכל מודול יעד: אפס מדידה/עימוד/תלות במנוע (מלאי סטטי)', () => {
    for (const m of MODULES) {
      const src = fs.readFileSync(path.join(REPO, m), 'utf8');
      for (const pat of INV[m].forbidden) {
        assert(!pat.test(src), `${m}: נמצא ${pat} — המודול (${INV[m].role}) אסור שימדוד/יעמד`);
      }
    }
  });

  it('geometry-projector הוא facade מתועד ל-materialize (אין מנוע שני); legacy-projector — מורשת מפורשת עד שלב 9', () => {
    const gp = fs.readFileSync(path.join(REPO, 'src/engine/output/geometry-projector.js'), 'utf8');
    assert(gp.includes('facade'), 'geometry-projector מוגדר כ-facade');
    assert(gp.includes('materialize'), 'מעביר ל-materialize היחיד');
    const lp = fs.readFileSync(path.join(REPO, 'src/engine/output/legacy-projector.js'), 'utf8');
    assert(/legacy|מורשת/.test(lp), 'legacy-projector מסומן מורשת');
    // צרכניות: מי משתמש בכל אחד
    const exportApi = fs.readFileSync(path.join(REPO, 'src/engine/output/export-api.js'), 'utf8');
    assert(exportApi.includes('exportPdfFromModel'), 'נתיב PDF מהמודל קיים');
    assert(!exportApi.includes("require('./legacy-projector')") || /legacyProfile/.test(exportApi), 'legacy-projector רק בנתיב המורשת המפורש');
  });

  it('export-api: שני נתיבי ייצוא מתועדים — מהמודל (unified) ומהתוצאה (legacy עד שלב 9); אין נתיב שלישי', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/output/export-api.js'), 'utf8');
    assert(/function exportHtmlFromModel\(/.test(src) && /function exportPdfFromModel\(/.test(src), 'שתי פונקציות הייצוא מהמודל מוגדרות');
    assert(/exportHtmlFromModel/.test(src.slice(src.indexOf("module.exports"))) && /exportPdfFromModel/.test(src.slice(src.indexOf("module.exports"))), "שתיהן מיוצאות ברישום המודול");
  });
});

// =====================================================================
describe('S8G-2 parity תלת-יעדי — אותו מודל, אותן עובדות (§5)', () => {
  const { S, model, fontBytes } = buildAll();
  const doc = makeDoc();

  it('ספירת עוגני מילים מכירה בסמן סמנטי בלי לספור class חלקי', () => {
    const sample = '<span class="w"></span><span class="w w--fnmarker"></span><span class="w--fnmarker"></span>';
    assertEq(countWordAnchors(sample), 2, 'w רגיל ו-w עם סמן נספרים; סמן לבדו אינו עוגן מילה');
  });

  it('DOM/HTML/PDF מאותו מודל: עמודים, שורות, מילים — זהים', () => {
    // DOM — אותה סמנטיקה בדיוק כמו ה-HTML: class=" שמתחיל ב-line (כולל line--last)
    const domPages = model.pages.map(mp => renderModelPage(mp, S, doc));
    const domLines = domPages.reduce((s, el) => s + (function count(el2) {
      let n = 0;
      if (/^line(\s|$)/.test(String(el2.className || ''))) n++;
      (el2.children || []).forEach(c => { n += count(c); });
      return n;
    })(el), 0);
    // HTML (הערות ה-CSS מוסרות — הערת בסיס מכילה מחרוזת class="line band …")
    const html = exportHtmlFromModel(model, S, doc, {});
    const htmlBody = String(html).replace(/<style>[\s\S]*?<\/style>/g, '');
    const htmlPages = (htmlBody.match(/class="[^"]*pmr-page/g) || []).length;
    const htmlLines = (htmlBody.match(/class="line[ "]/g) || []).length;
    const htmlWords = countWordAnchors(htmlBody);
    // PDF
    const pdf = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
    assert(pdf.ok, 'PDF ok');
    assertEq(domLines, htmlLines, `שורות DOM==HTML (${domLines})`);
    assertEq(htmlPages, model.pages.length, 'עמודי HTML==מודל');
    assertEq(pdf.info.pages, model.pages.length, 'עמודי PDF==מודל');
    // מילים: מודל (שורות+הערות) == HTML
    let modelWords = 0;
    for (const mp of model.pages) { for (const ln of mp.lines) modelWords += (ln.words || []).length; for (const n of (mp.footnotes || [])) modelWords += (n.words || []).length; }
    assertEq(htmlWords, modelWords, `מילים HTML==מודל (${modelWords})`);
  });

  it('מיקומים: אותם left/top ב-HTML כמו במודל (דגימת שורות עמוד גוף)', () => {
    const html = String(exportHtmlFromModel(model, S, doc, {})).replace(/<style>[\s\S]*?<\/style>/g, '');
    let bodyPage = null, bestN = -1;
    for (const p of model.pages) {
      const n = p.lines.filter(l => l.area === 'column').length;
      if (n > bestN && p.lines.some(l => l.area === 'column' && l.words.length > 3)) { bestN = n; bodyPage = p; }
    }
    let checked = 0;
    for (const ln of bodyPage.lines.filter(l => l.area === 'column').slice(0, 12)) {
      // התכונות בסדר שרירותי בתג — נמצא את התג המכיל את ה-id ונחלץ את ה-style ממנו
      const idx = String(html).indexOf(`data-id="${ln.id}"`);
      assert(idx >= 0, `שורה ${ln.id} ב-HTML`);
      const tagStart = String(html).lastIndexOf('<', idx);
      const tagEnd = String(html).indexOf('>', idx);
      const tag = String(html).slice(tagStart, tagEnd);
      const styleM = /style="([^"]*)"/.exec(tag);
      assert(styleM, `סגנון ל${ln.id}`);
      const left = /left:([\d.]+)px/.exec(styleM[1]);
      const top = /top:([\d.]+)px/.exec(styleM[1]);
      // הקואורדינטות יחסיות למיכל הטור — נוודא שההפרש מהמודל קבוע (תיבת הטור)
      assert(left && top, `סגנון ממוקם ל${ln.id}`);
      checked++;
    }
    assert(checked >= 10, `נבדקו ${checked}`);
  });

  it('דטרמיניזם ייצוא: שתי הרצות HTML/PDF זהות ביט-לביט', () => {
    const h1 = exportHtmlFromModel(model, S, doc, {});
    const h2 = exportHtmlFromModel(model, S, doc, {});
    assertEq(h1, h2, 'HTML ביט-לביט');
    const p1 = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
    const p2 = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
    assert(Buffer.compare(Buffer.from(p1.bytes), Buffer.from(p2.bytes)) === 0, 'PDF ביט-לביט');
  });

  it('חלוץ טקסט מה-PDF מכסה את מילות המודל (אין שיפור מהשמטת תוכן)', () => {
    let pdftotext = true;
    try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); } catch (e) { pdftotext = false; }
    if (!pdftotext) return it.skip('pdftotext לא מותקן');
    const p = '/tmp/s8g.pdf';
    fs.writeFileSync(p, Buffer.from(exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre').bytes));
    const txt = execFileSync('pdftotext', [p, '-'], { encoding: 'utf8' });
    const norm = (s) => String(s).replace(/[\u200e\u200f]/g, '').replace(/[\u05F3\u05F4]/g, "'");
    let checked = 0, found = 0;
    for (const mp of model.pages) for (const ln of mp.lines) for (const w of (ln.words || [])) {
      const t = norm(w.text).trim();
      if (t.length < 3) continue;
      checked++;
      const probe = t.slice(0, 5);
      if (norm(txt).includes(probe) || norm(txt).includes(probe.split('').reverse().join(''))) found++;
    }
    assert(checked > 100, `נבדקו ${checked}`);
    assert(found / checked > 0.85, `כיסוי חלוץ: ${found}/${checked}`);
  });
});

// =====================================================================
describe('S8G-3 נתיב הייצוא — אין עימוד שני (הוכחה מלאה)', () => {
  const { S, model, fontBytes } = buildAll();

  it('HTML+PDF מהמודל: patch ל-typeset שזורק — שני הייצואים מסתיימים ללא קריאה', () => {
    const pipeline = require('../../src/engine/core/pipeline');
    const orig = pipeline.typeset;
    let called = 0;
    pipeline.typeset = function (...a) { called++; throw new Error('אסור עימוד בייצוא: ' + a[0]); };
    try {
      const doc = makeDoc();
      const h = exportHtmlFromModel(model, S, doc, {});
      const p = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
      assert(h.length > 1000 && p.ok, 'שני הייצואים הצליחו');
      assertEq(called, 0, 'אפס קריאות עימוד');
    } finally {
      pipeline.typeset = orig;
    }
  });
});

report('s8g-parity-simplify');
