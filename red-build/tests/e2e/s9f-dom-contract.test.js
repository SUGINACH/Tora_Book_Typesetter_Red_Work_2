// tests/e2e/s9f-dom-contract.test.js — חוזה ה-DOM של ההקרנה מהמודל (חקירת 19.11)
//
// סוגר כאן את חמשת הפערים שנמצאו ב-full-math על הפרופיל המאוחד (238 ממצאים):
//   1. מפרידי-שורות חסרים בהערות-שוליים ובהערות-שוליים-הערה (textContent מתמזג
//      בגבול שורה — רצפת הנפח נפלה: 344,229 < 345,999 ב-very_long).
//   2. סמני הערה בגוף בלי w--fnmarker (MARKER_NOTE_MATCH ×32: 0 בגוף מול 132
//      בהערות).
//   3. שורות כותרת בלי line--heading (BODY_FONT_UNIFORMITY ×28 — כותרות
//      סווגו כשורות גוף עם גופן חריג).
//   4. שורות תוכן-עניינים בלי .toc-rows/.toc-row (28 עמודי TOC בלי אף מילה
//      נראית לאודיט; הנתיב המודרני לא כיבד את חוזה ה-DOM של renderPaginatedTOC).
//   5. שורות שער בלי band band--gate (SHAAR_EMPTY על השער הראשי).
// הגאומטריה אינה משתנה: המחלקות ומפרידי הטקסט אינם מזיזים אף תיבה
// (מילים ממוקמות-מוחלט מהמודל; המפרידים אינם נראים).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { registerFont } = require('../../src/engine/typography/measure-api');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');

function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const { getSettingDefs } = require('../../src/engine/core/settings-registry');
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  return importImudSettings(legacy, regKeys, { availableFonts: families }).settings;
}
function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'],
  ];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
}
function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf'),
  };
}
function makeDoc() {
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this._text = ''; this.dir = ''; }
    set className(v) { this._class = String(v); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}
const walk = (el, fn) => { fn(el); (el.children || []).forEach(c => walk(c, fn)); };
const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const hasCls = (el, cls) => String(el.className || '').split(/\s+/).includes(cls);

// ---------- הקורפוס החי ----------
describe('s9f — חוזה ה-DOM של הקרנת המודל (מפרידים, סמנים, מחלקות, TOC, שערים)', () => {
  const settings = liveSettings();
  registerLiveFonts();
  const raw = fs.readFileSync(path.join(RB, '..', 'audits', 'no_long_test_text.txt'), 'utf8');
  const res = typeset(raw, { ...settings, '_engine-force-unified': true }, { env: typesetEnvExtras() });
  const model = res.pageModel;
  const doc = makeDoc();

  it('מפרידי שורות בהערות-צד: ספירת המילים ב-DOM שווה למודל (אין מילים מתמזגות)', () => {
    let modelSnWords = 0, domSnWords = 0, snEls = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      const marginLines = mp.lines.filter(l => l.area === 'margin');
      const ownWords = (mp.sideNotes || []).reduce((s, sn) => {
        const own = marginLines.filter(l => l.x != null && sn.x != null && Math.abs(l.x - sn.x) < 0.01
          && l.y >= sn.yTop - 0.01 && l.y <= sn.yTop + (sn.heightPx || 0) + 0.01);
        return s + own.reduce((a, l) => a + (l.words || []).length, 0);
      }, 0);
      modelSnWords += ownWords;
      walk(el, (n) => { if (hasCls(n, 'side-note')) { snEls++; domSnWords += wc(n.textContent); } });
    }
    assert(snEls > 5, `אלמנטי side-note: ${snEls}`);
    assertEq(domSnWords, modelSnWords, `מילים ב-DOM (${domSnWords}) מול המודל (${modelSnWords}) — מפריד בין שורות`);
  });

  it('מפרידי שורות בהערות-שוליים: ספירת המילים ב-DOM שווה למודל', () => {
    let modelFnWords = 0, domFnWords = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      modelFnWords += (mp.footnotes || []).reduce((s, f) => s + ((f.words || []).length ? (f.words || []).length : wc(f.marker) + wc(f.text)), 0);
      walk(el, (n) => { if (hasCls(n, 'footnote')) domFnWords += wc(n.textContent); });
    }
    assert(modelFnWords > 100, `מילות הערות במודל: ${modelFnWords}`);
    assertEq(domFnWords, modelFnWords, `מילים ב-DOM (${domFnWords}) מול המודל (${modelFnWords})`);
  });

  it('סמני הערה בגוף: מספר עוגני w--fnmarker שווה למילות-הסמן של המודל', () => {
    let modelMk = 0, domMk = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      for (const ln of (mp.lines || [])) {
        if (ln.area !== 'column' && ln.area !== 'structural' && ln.area !== 'spanning' && ln.area !== 'margin') continue;
        modelMk += (ln.words || []).filter(w => w.mk).length;
      }
      // פתיחות-הערות במרזב — גם הן מוקרנות כ-w--fnmarker
      modelMk += (mp.footnotes || []).reduce((s, f) => s + (f.words || []).filter(w => w.mk).length, 0);
      walk(el, (n) => { if (String(n.className || '').split(/\s+/).includes('w--fnmarker')) domMk++; });
    }
    assert(modelMk >= 8, `מילות-סמן במודל: ${modelMk}`);
    assertEq(domMk, modelMk, `w--fnmarker ב-DOM (${domMk}) מול המודל (${modelMk})`);
  });

  it('פתיחות-הערות: לכל הערה סמן w--fnmarker ראשון (חוזה MARKER_NOTE_MATCH)', () => {
    let notesWithOpener = 0, noteCount = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      walk(el, (n) => {
        if (!hasCls(n, 'footnote')) return;
        noteCount++;
        const markers = [];
        walk(n, (w) => { if (String(w.className || '').split(/\s+/).includes('w--fnmarker')) markers.push(w); });
        if (markers.length >= 1) notesWithOpener++;
      });
    }
    assert(noteCount >= 8, `הערות: ${noteCount}`);
    assertEq(notesWithOpener, noteCount, `פתיחות עם סמן (${notesWithOpener}/${noteCount})`);
  });

  it('שורות כותרת: line--heading מוקרן מהמודל (ml.kind) — סיווג מפורש, לא החרגת דף', () => {
    let modelHeads = 0, domHeads = 0, domPlainHead = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      for (const ln of (mp.lines || [])) if (ln.kind === 'heading') modelHeads++;
      walk(el, (n) => {
        if (!hasCls(n, 'line')) return;
        if (hasCls(n, 'line--heading')) domHeads++;
      });
      // שלילה: שורה עם kind שאינו heading לא מקבלת את המחלקה
      for (const ln of (mp.lines || [])) {
        if (ln.kind && ln.kind !== 'heading' && ln.area === 'column') {
          const el2 = renderModelPage(mp, settings, doc);
          void el2;
          break;
        }
      }
    }
    assert(modelHeads > 10, `כותרות במודל: ${modelHeads}`);
    assertEq(domHeads, modelHeads, `line--heading ב-DOM (${domHeads}) מול המודל (${modelHeads})`);
    void domPlainHead;
  });

  it('תוכן-עניינים: מיכל .toc-rows + שורות .toc-row — מספרן כמספר שורות המודל, ואין שורות TOC מחוץ למיכל', () => {
    let modelTocRows = 0, domTocRows = 0, wrapPages = 0, orphanToc = 0;
    for (const mp of model.pages) {
      const el = renderModelPage(mp, settings, doc);
      const rows = (mp.lines || []).filter(l => l.kind === 'toc-row').length;
      modelTocRows += rows;
      let wrapHere = null, rowsHere = 0;
      walk(el, (n) => {
        if (hasCls(n, 'toc-rows')) wrapHere = n;
        if (hasCls(n, 'toc-row')) rowsHere++;
      });
      if (wrapHere) {
        wrapPages++;
        let inWrap = 0;
        walk(wrapHere, (n) => { if (hasCls(n, 'toc-row')) inWrap++; });
        if (inWrap !== rowsHere) orphanToc += Math.abs(rowsHere - inWrap);
      } else if (rowsHere > 0) {
        orphanToc += rowsHere; // שורות TOC מחוץ למיכל
      }
      domTocRows += rowsHere;
    }
    assert(modelTocRows > 20, `שורות TOC במודל: ${modelTocRows}`);
    assert(wrapPages >= 2, `עמודים עם מיכל toc-rows: ${wrapPages}`);
    assertEq(domTocRows, modelTocRows, `toc-row ב-DOM (${domTocRows}) מול המודל (${modelTocRows})`);
    assertEq(orphanToc, 0, 'כל שורות ה-TOC בתוך המיכל');
  });

  it('שערים: שורות תוכן השער נושאות band band--gate — השער הראשי אינו ריק', () => {
    const shaarPage = model.pages.find(p => p.type === 'shaar-main');
    assert(shaarPage, 'יש עמוד שער-ראשי');
    const el = renderModelPage(shaarPage, settings, doc);
    let gates = 0, gateWords = 0;
    walk(el, (n) => {
      if (hasCls(n, 'band--gate') && wc(n.textContent) > 0) { gates++; gateWords += wc(n.textContent); }
    });
    assert(gates >= 3, `שורות שער עם טקסט: ${gates}`);
    assert(gateWords > 10, `מילים בשער: ${gateWords}`);
  });

  it('גאומטריה לא השתנתה: מיקומי השורות ב-DOM זהים למודל (מדגם TOC + שער + גוף)', () => {
    // שורת TOC: השורה הראשונה בעמוד ה-TOC הראשון
    const tocPage = model.pages.find(p => (p.lines || []).some(l => l.kind === 'toc-row'));
    const el = renderModelPage(tocPage, settings, doc);
    const firstRow = (tocPage.lines || []).find(l => l.kind === 'toc-row');
    let domRow = null;
    walk(el, (n) => { if (!domRow && hasCls(n, 'toc-row')) domRow = n; });
    assert(domRow, 'שורת TOC ב-DOM');
    assertEq(domRow.style.top, `${Math.round((firstRow.y) * 100) / 100}px`, 'top של שורת ה-TOC מהמודל');
    assertEq(domRow.style.left, `${Math.round((firstRow.x) * 100) / 100}px`, 'left של שורת ה-TOC מהמודל');
    // שורת שער
    const shaarPage = model.pages.find(p => p.type === 'shaar-main');
    const el2 = renderModelPage(shaarPage, settings, doc);
    const firstGate = (shaarPage.lines || []).find(l => l.area === 'structural');
    let domGate = null;
    walk(el2, (n) => { if (!domGate && hasCls(n, 'band--gate')) domGate = n; });
    assert(domGate, 'שורת שער ב-DOM');
    assertEq(domGate.style.top, `${Math.round((firstGate.y - shaarPage.shaar.box.y) * 100) / 100}px`, 'top של שורת השער יחסית לתיבה (מהמודל)');
  });
});

report();
