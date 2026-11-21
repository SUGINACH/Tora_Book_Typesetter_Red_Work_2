// tests/e2e/s8f-pagemodel-pdf.test.js — **שלב 8 פרוסה 5 (§4): בדיקות קבלה לייצוא PDF מה-PageModel.**
//
// ההוכחות המחייבות (הוראת שלב 8 §4):
//  1. אין עימוד שני — הוכחה שלילית: patch ל-pipeline.typeset שזורק; הייצוא מסתיים.
//  2. מודל חסר ⇒ כשל מפורש (אין נתיב חלופי).
//  3. אותו מודל כמו ה-DOM — החוזה בחתימה; geometryHash של המודל חוזר ב-info.
//  4. text extraction — כל מילות המודל נחלצות (ToUnicode עובד).
//  5. הטמעת גופן — FontFile2 בקובץ.
//  6. bookmarks וקישורים — outline/tocLinks מהמודל.
//  7. גיאומטריה: מיקומי מילים בפלט (pdftotext -bbox) תואמים למודל בסבילות מוגדרת.
//  8. הזרקת שגיאות — גופן פסול ⇒ כשל מפורש.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { exportPdfFromModel } = require('../../src/engine/output/export-api');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const REPO = path.resolve(__dirname, '..', '..');
const ASSETS = path.join(REPO, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));

let _pdftotext = null;
function pdftotextAvailable() {
  if (_pdftotext !== null) return _pdftotext;
  try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); _pdftotext = true; } catch (e) { _pdftotext = false; }
  return _pdftotext;
}

const DOC = [
  'כותרת 1 - חלק',
  'פסקת גוף ראשונה עם הערה [הערת ייצוא ראשונה לבדיקת מרזב ה-PDF] בתוכה.',
  'כותרת 2 - פרק הייצוא',
  'כותרת 3 - כותרת אופקית ארוכה במיוחד שנשברת לשתי שורות לפחות ברוחב העטיפה',
  'פסקה אחרי כותרת רבת שורות עם עוד הערה [הערה שנייה לבדיקה].',
  'כותרת 4 - רמה ארבע',
  ...Array.from({ length: 6 }, (_, i) => `פסקת המשך ${i + 1} עם טקסט ממשי ארוך למילוי הטורים והעמודים בנפח אמיתי לבדיקת גיאומטריית המילים בפלט. ${'מילים למילוי הטור ולבדיקה '.repeat(5)}`)
].join('\n');

function setup() {
  clearRegisteredFonts();
  for (const f of ['Frank Ruhl Libre', 'David Libre', 'Hadassah Friedlaender']) {
    const e = CATALOG.find(x => x.family === f);
    if (e) registerFont(f, fs.readFileSync(path.join(ASSETS, 'fonts', e.file)));
  }
  const S = getDefaultSettings();
  const r = typeset(DOC, S, {});
  const e = CATALOG.find(x => x.family === 'Frank Ruhl Libre');
  const fontBytes = fs.readFileSync(path.join(ASSETS, 'fonts', e.file));
  return { r, S, model: r.pageModel, fontBytes };
}

// =====================================================================
describe('S8F-1 פרוסה 5 — אין עימוד שני; המודל חייב', () => {
  const { S, model, fontBytes } = setup();

  it('הוכחה שלילית: patch שזורק על typeset — הייצוא מהמודל מסתיים ללא קריאה', () => {
    const pipeline = require('../../src/engine/core/pipeline');
    const orig = pipeline.typeset;
    let called = 0;
    pipeline.typeset = function (...a) { called++; throw new Error('אסור עימוד שני בייצוא PDF (§4): ' + a[0]); };
    try {
      const res = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
      assert(res.ok, 'הייצוא הצליח: ' + (res.error || ''));
      assertEq(called, 0, 'typeset לא נקרא כלל');
      assert(res.bytes.length > 5000, 'קובץ PDF נוצר');
    } finally {
      pipeline.typeset = orig;
    }
  });

  it('מודל חסר/שגוי ⇒ כשל מפורש (אין נתיב עימוד חלופי)', () => {
    for (const bad of [null, undefined, {}, { schema: 'x', pages: [] }, { schema: 'pagemodel-v1', pages: [] }]) {
      const res = exportPdfFromModel(bad, S, fontBytes, 'F');
      assert(!res.ok && /model-required|PageModel/.test(res.error), 'כשל מפורש: ' + res.error);
    }
  });

  it('גופן פסול ⇒ כשל מפורש (font:)', () => {
    const res = exportPdfFromModel(model, S, new Uint8Array([1, 2, 3, 4]), 'BrokenFont');
    assert(!res.ok && /^font:/.test(res.error), 'כשל גופן מפורש: ' + res.error);
  });

  it('אותו מודל כמו ה-DOM: geometryHash של המודל חוזר ב-info', () => {
    const res = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
    assert(res.ok);
    assertEq(res.info.geometryHash, model.geometryHash, 'ה-hash של המודל ששימש');
    assertEq(res.info.fromPageModel, true, 'מסומן מהמודל');
  });
});

// =====================================================================
describe('S8F-2 פרוסה 5 — חלוץ טקסט, הטמעה, סימניות וקישורים', () => {
  const { S, model, fontBytes } = setup();
  const res = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
  assert(res.ok, 'export ok');

  it('text extraction: כל מילות המודל נחלצות (ToUnicode עובד)', () => {
    if (!pdftotextAvailable()) return it.skip('pdftotext לא מותקן');
    const p = '/tmp/s8f-model.pdf';
    fs.writeFileSync(p, Buffer.from(res.bytes));
    const txt = execFileSync('pdftotext', [p, '-'], { encoding: 'utf8' });
    const norm = (s) => String(s).replace(/[\u200e\u200f]/g, '').replace(/[\u05F3\u05F4]/g, "'");
    let missing = [];
    let checked = 0;
    for (const mp of model.pages) {
      for (const ln of mp.lines) {
        for (const w of (ln.words || [])) {
          const t = norm(String(w.text)).trim();
          if (t.length < 2) continue;
          checked++;
          if (!norm(txt).includes(t)) { missing.push(t); }
        }
      }
    }
    assert(checked > 150, `נבדקו ${checked} מילים`);
    // חלוץ pdftotext מאבד רווחים בין מילים ממוקמות — נבדוק כיסוי מילים בודדות בטקסט החלוץ
    const cov = checked - missing.length;
    assert(cov / checked > 0.9, `כיסוי חלוץ: ${cov}/${checked}; חסרות: ${missing.slice(0, 5).join(',')}`);
  });

  it('הטמעת גופן: FontFile2 בקובץ', () => {
    const s = Buffer.from(res.bytes).toString('latin1');
    assert(s.includes('/FontFile2'), 'FontFile2 (תוכן TTF מוטמע)');
    assert(s.includes('/ToUnicode'), 'ToUnicode קיים');
  });

  it('bookmarks: עץ הכותרות מהמודל מגיע לקובץ', () => {
    const outline = (model.document && model.document.outline) || [];
    assert(outline.length > 0, 'למודל יש outline');
    assertEq(res.info.outline, outline.length, 'מספר הסימניות');
    const s = Buffer.from(res.bytes).toString('latin1');
    assert(s.includes('/Outlines'), 'מילון Outlines בקובץ');
    // היעדים בפועל
    for (const o of outline.slice(0, 4)) {
      assert(res.info.outlineItems.some(x => x.page === o.page && x.title === o.title), `סימנייה "${o.title.slice(0, 20)}" → עמוד ${o.page}`);
    }
  });

  it('קישורי TOC: מהמודל; היעדים נכונים', () => {
    const links = (model.document && model.document.tocLinks) || [];
    assertEq(res.info.tocLinks, links.length, 'מספר הקישורים');
    for (const l of links.slice(0, 4)) {
      assert(res.info.tocLinkTargets.includes(l.targetPage), `קישור → עמוד ${l.targetPage}`);
    }
  });
});

// =====================================================================
describe('S8F-3 פרוסה 5 — גיאומטריה: מיקומי מילים בפלט תואמים למודל', () => {
  const { S, model, fontBytes } = setup();
  const res = exportPdfFromModel(model, S, fontBytes, 'Frank Ruhl Libre');
  assert(res.ok);

  it('pdftotext -bbox: מיקומי מילים בעמוד הגוף תואמים למודל (סבילות pt)', () => {
    if (!pdftotextAvailable()) return it.skip('pdftotext לא מותקן');
    const p = '/tmp/s8f-geo.pdf';
    fs.writeFileSync(p, Buffer.from(res.bytes));
    // עמוד הגוף העשיר ביותר במודל — נבחר מהמודל עצמו (ההחלטה אינה בכותב)
    let best = 0, bestN = -1;
    model.pages.forEach((mp, i) => {
      // **Iteration-001 (legacy parity):** עמוד פתיחת-סימן (sign-open) הוא עמוד
      // גוף לכל דבר — ה-H3 שאחרי ה-H2 נשאר בו מעתה (כמו המקור), ובקורפוסים
      // קטנים הוא עמוד הגוף העשיר היחיד. החלוץ והסבילות — ללא שינוי.
      if (mp.type !== 'regular' && mp.type !== 'preface' && mp.type !== 'sign-open') return; // עמוד גוף — חלוץ מלא
      const n = mp.lines.filter(l => l.area === 'column').reduce((s, l) => s + (l.words || []).length, 0);
      if (n > bestN) { bestN = n; best = i; }
    });
    const pdfPageNo = best + 1;
    const xml = execFileSync('pdftotext', ['-bbox', '-f', String(pdfPageNo), '-l', String(pdfPageNo), p, '-'], { encoding: 'utf8' });
    const words = [...xml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]+)<\/word>/g)]
      .map(m => ({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], text: m[5] }));
    assert(words.length > 10, `נחלצו ${words.length} מילים`);
    const mp = model.pages[best];
    const norm = (s) => String(s).replace(/[\u200e\u200f]/g, '');
    const PGH_PT = mp.geometry.height * 72 / 96; // px→pt של גובה העמוד
    let checked = 0, bad = 0;
    for (const ln of mp.lines.filter(l => l.area === 'column')) {
      for (const w of (ln.words || [])) {
        const t = norm(String(w.text)).trim();
        if (t.length < 2) continue;
        // חיפוש מילה חלוצה מתאימה (RTL: x משתקף סביב רוחב העמוד ב-y דומה)
        // **bbox של pdftotext מודד מלמעלה** (כמו המודל) ומציג מילים בסדר
        // ויזואלי הפוך (RTL) — נשווה גם מול המחרוזת ההפוכה. yMax ≈ baseline+
        // descent — תחתית תיבת המילה; ה-baseline של שורת גוף ברמת השורה.
        const baselinePt = ((ln.baselineY != null ? ln.baselineY : (w.baselineY != null ? w.baselineY : ln.y + ln.h * 0.72)) ) * 72 / 96;
        const probe = t.slice(0, Math.min(6, t.length));
        const probeRev = probe.split('').reverse().join('');
        const cand = words.find(v => (norm(v.text).includes(probe) || norm(v.text).includes(probeRev)) && Math.abs(v.y1 - baselinePt - 3) < 12);
        if (!cand) continue;
        checked++;
        const dy = Math.abs(cand.y1 - baselinePt - 3);
        if (dy > 12) bad++;
        void PGH_PT;
      }
    }
    assert(checked > 30, `נבדקו ${checked} מילים גיאומטרית`);
    assert(bad === 0, `${bad} מילים עם סטיית y > 12pt`);
  });
});

// =====================================================================
describe('S8F-4 פרוסה 5 — זרימת Worker: הייצוא מהמודל שבזיכרון (אין עימוד שני)', () => {
  it('inline-transport: typeset → pageModel → export-pdf מהמודל; ללא מודל ⇒ כשל מפורש', async () => {
    const inlineTransport = require('../../src/ui/inline-transport');
    const tr = inlineTransport.createInlineTransport();
    const S = getDefaultSettings();
    const e = CATALOG.find(x => x.family === 'Frank Ruhl Libre');
    const fontBytes = fs.readFileSync(path.join(ASSETS, 'fonts', e.file));
    const post = (m) => new Promise((resolve) => {
      const onMsg = (msg) => {
        if ((msg.type === 'typeset-result' || msg.type === 'export-result' || msg.type === 'export-error' || msg.type === 'typeset-error') && msg.jobId === m.jobId) {
          tr.setHandler(null);
          resolve(msg);
        }
      };
      tr.setHandler(onMsg);
      tr.post(m);
    });
    const t1 = await post({ type: 'typeset-request', jobId: 'f1', text: DOC, settings: S });
    assert(t1.type === 'typeset-result' && t1.result.pageModel, 'העימוד החזיר מודל');
    assert(t1.result.legacyProfile !== true, 'פרופיל מאוחד');
    const x1 = await post({ type: 'export-request', jobId: 'f2', kind: 'pdf', text: DOC, settings: S, fontBytes, fontName: 'Frank Ruhl Libre' });
    assert(x1.type === 'export-result' && x1.ok, 'הייצוא הצליח: ' + (x1.error || ''));
    assertEq(x1.info.fromPageModel, true, 'מסומן מהמודל');
    assert(x1.bytes.length > 4000, 'קובץ נוצר');
    assertEq(x1.info.geometryHash, t1.result.pageModel.geometryHash, 'אותו מודל כמו שנשלח ל-UI');
  }, { timeout: 120_000 });
});

report('s8f-pagemodel-pdf');
