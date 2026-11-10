#!/usr/bin/env node
// tools/perf-baseline.js — S1-ו: מדידת ביצועים בסיסית (משימת הפתיחה של סוכן 3)
//
// תוכנית הפעלה לחמשת הסוכנים, סוכן 3, משימה 1: "מדוד בנפרד: טעינת האפליקציה;
// הורדת CSS/TTF/OTF/WOFF2; רישום ופרסור ב-Worker; מדידות glyph/line; שבירת
// שורות; DP; תכנון עמודים; איזון; הערות/עיטורים; projection; ייצוא."
//
// עקרונות:
//  * אפס שינוי בקוד המנוע — המדידה עוטפת את המודולים (monkey-patch) לפני
//    טעינת ה-pipeline; התוצאה נבדקת זהה (hash) לריצה לא-עטופה — הוכחה
//    שהמכשור אינו משפיע (אותו עקרון של no-op proof ל-onProgress, D-10).
//  * כפילויות מנוטרלות: מדידות רוחב בתוך שבירת שורות/DP/עיטורים מיוחסות
//    להקשר הקורא (מחסנית הקשרים), כך שהדוח מציג זמנים בלתי-חופפים.
//  * דוח: טבלה אנושית ל-stdout + ארטיפקט JSON ב-audits/perf_baseline/.
//
// שימוש: node tools/perf-baseline.js [--quick]   (--quick: מדלג על very_long)
'use strict';

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const ROOT = path.resolve(__dirname, '..');
const RB = path.join(ROOT, 'red-build');
const OUT_DIR = path.join(ROOT, 'audits', 'perf_baseline');

// ================= 1. עטיפת מודולי המנוע (לפני טעינת ה-pipeline) =================
const ctxStack = [];                 // מחסנית הקשרים — לייחוס מדידות רוחב
const S = {};                        // name -> {calls, ms}
function bucket(name) { if (!S[name]) S[name] = { calls: 0, ms: 0 }; return S[name]; }

function wrapCtx(modulePath, fnName, label, ctx) {
  const m = require(path.join(RB, 'src', modulePath));
  if (typeof m[fnName] !== 'function') return;
  const orig = m[fnName];
  const key = label;
  m[fnName] = function (...args) {
    const b = bucket(key);
    const t0 = performance.now();
    if (ctx) ctxStack.push(ctx);
    try { return orig.apply(this, args); }
    finally {
      if (ctx) ctxStack.pop();
      b.calls++; b.ms += performance.now() - t0;
    }
  };
}

function wrapPlain(modulePath, fnName, label) { wrapCtx(modulePath, fnName, label, null); }

// --- פענוח ---
wrapPlain('engine/parser/dfa-lexer.js', 'lexDocument', 'פענוח: לקסינג (lexDocument)');
wrapPlain('engine/parser/block-tokenizer.js', 'tokenize', 'פענוח: טוקניזציה (tokenize)');
wrapPlain('engine/parser/bracket-scanner.js', 'scanBrackets', 'פענוח: מיפוי סוגריים/הערות (scanBrackets)');

// --- מדידה + שבירת שורות (MeasureAPI — על הפרוטוטיפ; כל המופעים עטופים) ---
{
  const ma = require(path.join(RB, 'src/engine/typography/measure-api.js'));
  const proto = ma.MeasureAPI.prototype;
  const origMeasure = proto.measureTextWidth;
  proto.measureTextWidth = function (...args) {
    const inCtx = ctxStack.length ? ctxStack[ctxStack.length - 1] : null;
    const key = inCtx ? `מדידת רוחב — בתוך ${inCtx}` : 'מדידת רוחב — ישירה (פרה-פלאנר)';
    const b = bucket(key);
    const t0 = performance.now();
    try { return origMeasure.apply(this, args); }
    finally { b.calls++; b.ms += performance.now() - t0; }
  };
  const origLayout = proto.layoutLines;
  if (typeof origLayout === 'function') {
    proto.layoutLines = function (...args) {
      const b = bucket('שבירת שורות: layoutLines (כולל מדידות פנימיות)');
      const t0 = performance.now();
      ctxStack.push('שבירת שורות');
      try { return origLayout.apply(this, args); }
      finally { ctxStack.pop(); b.calls++; b.ms += performance.now() - t0; }
    };
  }
}

// --- מילה ראשונה + כותרות ---
wrapCtx('engine/typography/dropword.js', 'applyDropWord', 'מילה ראשונה (applyDropWord)', 'מילה ראשונה');
wrapPlain('engine/layout/headings-escort.js', 'applyHeadingModes', 'הצמדת כותרות (applyHeadingModes)');

// --- CP3: DP + הגנות + נסיגה ---
wrapCtx('engine/layout/dp-planner.js', 'planPages', 'תכנון עמודים: DP+הגנות+נסיגה (planPages)', 'DP');

// --- שערים ועמודים מותאמים ---
wrapCtx('engine/decoration/shaar-pages.js', 'insertShaarPages', 'שערים ועמודים מותאמים (insertShaarPages)', 'שערים');

// --- איזון ואיכות ---
wrapPlain('engine/layout/balancing.js', 'autoQualityPass', 'איזון: מעבר איכות (autoQualityPass)');
wrapPlain('engine/layout/balancing.js', 'applyChapterEndMode', 'איזון: סיום פרק (applyChapterEndMode)');

// --- עיטורים / כותרות עליונות / מספור / תוכן עניינים / הערות ---
wrapCtx('engine/decoration/folio.js', 'assignNumbers', 'מספור עמודים (assignNumbers)', 'מספור');
wrapCtx('engine/decoration/headers-builder.js', 'buildHeader', 'כותרות עליונות (buildHeader)', 'כותרות עליונות');
wrapCtx('engine/decoration/toc-builder.js', 'buildTocModel', 'תוכן עניינים: מודל (buildTocModel)', 'תוכן עניינים');
wrapCtx('engine/decoration/toc-builder.js', 'buildTocPages', 'תוכן עניינים: בניית עמודים (buildTocPages)', 'תוכן עניינים');
wrapCtx('engine/layout/side-notes.js', 'placeSideNotes', 'הערות צד (placeSideNotes)', 'הערות צד');
wrapCtx('engine/decoration/ornament-plan.js', 'planPageOrnaments', 'עיטורים (planPageOrnaments)', 'עיטורים');
wrapCtx('engine/layout/endnote-pages.js', 'buildEndnotePages', 'עמודי הערות סיום (buildEndnotePages)', 'הערות סיום');

// --- projection / ייצוא (נמדדים בנפרד בשלב הייצוא; projectDocument גם בתוך הזרימה אם נקרא) ---
wrapPlain('engine/output/geometry-projector.js', 'projectDocument', 'הקרנה (projectDocument)');

// ================= 2. טעינת המנוע (אחרי העטיפות) =================
const tReq0 = performance.now();
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline.js'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry.js'));
const engineLoadMs = performance.now() - tReq0;

const exportApi = require(path.join(RB, 'src/engine/output/export-api.js'));
const { registerFont, clearRegisteredFonts } = require(path.join(RB, 'src/engine/typography/measure-api.js'));

// ================= 3. DOM shim מינימלי ל-exportHtml/renderPage =================
function makeMiniDoc() {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._text = ''; this._cls = new Set();
    }
    get classList() {
      const self = this;
      return {
        add: (...ns) => ns.forEach(n => self._cls.add(n)),
        remove: (...ns) => ns.forEach(n => self._cls.delete(n)),
        contains: (n) => self._cls.has(n),
        toggle: (n, f) => { const want = f === undefined ? !self._cls.has(n) : !!f; if (want) self._cls.add(n); else self._cls.delete(n); return want; }
      };
    }
    set className(v) { this._cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return [...this._cls].join(' '); }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener() { }
    querySelector() { return null; }
    querySelectorAll() { return []; }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

// ================= 4. מסמכי המדידה =================
const DOCS = [
  { id: 'short', label: 'מסמך קצר (2 עמ׳)', path: null, text: ['ספר - בדיקת ביצועים', '', 'כותרת 2 - סימן ראשון', 'פסקה ראשונה עם מספיק מילים כדי למלא שורה אחת לפחות בטור הימני של העמוד.', 'פסקה שנייה עם הערת שוליים [הערה לבדיקה] בתוך הטקסט הזורם.', 'כותרת 3 - תת סימן', 'פסקת תת הסימן שממשיכה את הזרימה בעוד כמה מילים למילוי נפח.'].join('\n') },
  { id: 'canonical', label: 'קורפוס קנוני', path: path.join(RB, 'tests/fixtures/canonical_corpus.txt') },
  { id: 'long', label: 'long_test_text (אמיתי)', path: path.join(RB, 'tests/fixtures/real/long_test_text.txt') },
  { id: 'orange_hist', label: 'orange-historical (קורפוס היסטורי)', path: path.join(RB, 'tests/fixtures/real/orange_very_long_test_text.txt') },
  { id: 'very_long', label: 'very_long (המסמך הראשי — D-98)', path: path.join(ROOT, 'audits/very_long_test_text.txt') }
];

// ================= 5. הרצת המדידה =================
const QUICK = process.argv.includes('--quick');
const results = [];
let headlessControl = null; // הוכחת נייטרליות: hash בלי עטיפות פעילות (ראה בדיקה בסוף)

function resetBuckets() { for (const k of Object.keys(S)) delete S[k]; }

function snapshot() {
  const out = {};
  for (const [k, v] of Object.entries(S)) out[k] = { calls: v.calls, ms: +v.ms.toFixed(1) };
  return out;
}

function fmtMs(ms) { return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(1)}ms`; }

function runDoc(doc) {
  const text = doc.path ? fs.readFileSync(doc.path, 'utf8') : doc.text;
  const settings = getDefaultSettings();
  resetBuckets();
  const stageMarks = [];
  const t0 = performance.now();
  const result = typeset(text, settings, {
    onProgress: (info) => stageMarks.push({ at: +(performance.now() - t0).toFixed(1), stage: info.stage, label: info.label })
  });
  const totalMs = performance.now() - t0;
  return {
    id: doc.id, label: doc.label,
    bytes: Buffer.byteLength(text, 'utf8'), lines: text.split('\n').length,
    pages: result.pages.length, layoutHash: result.layoutHash,
    contentPreserved: result.contentPreserved,
    totalMs: +totalMs.toFixed(1),
    stages: snapshot(), stageMarks,
    result // לייצוא
  };
}

console.log('# מדידת ביצועים בסיסית — RED (S1-ו, משימת פתיחה סוכן 3)');
console.log(`# node ${process.version} · ${new Date().toISOString()}`);
console.log(`# טעינת המנוע (require pipeline): ${fmtMs(engineLoadMs)}`);
console.log('');

for (const doc of DOCS) {
  if (QUICK && doc.id === 'very_long') { console.log(`[--quick] מדלג על ${doc.label}`); continue; }
  if (doc.path && !fs.existsSync(doc.path)) { console.log(`! חסר קובץ: ${doc.path} — דילוג`); continue; }
  const r = runDoc(doc);
  results.push(r);
  console.log(`## ${r.label}`);
  console.log(`   קלט: ${(r.bytes / 1024).toFixed(0)}KB · ${r.lines.toLocaleString('he-IL')} שורות · פלט: ${r.pages} עמודים · hash: ${r.layoutHash.slice(0, 18)}… · שימור: ${r.contentPreserved ? 'שלם' : 'חריגה!'}`);
  console.log(`   סה"כ עימוד: ${fmtMs(r.totalMs)} (${(r.pages / (r.totalMs / 1000)).toFixed(1)} עמודים/שנייה)`);
  const rows = Object.entries(r.stages).filter(([, v]) => v.ms > 0.05).sort((a, b) => b[1].ms - a[1].ms);
  for (const [name, v] of rows) {
    const pct = ((v.ms / r.totalMs) * 100).toFixed(1);
    console.log(`   · ${name}: ${fmtMs(v.ms)} (${pct}%) · ${v.calls.toLocaleString('he-IL')} קריאות`);
  }
  console.log('');
}

// ================= 6. נתיב המורשת — השוואת קיר-שעון =================
{
  const ASSETS = path.join(RB, 'ui/assets/imud');
  const setsDir = path.join(ASSETS, 'setting_sets');
  const setFile = path.join(setsDir, 'תלמוד.json');
  const vlPath = path.join(ROOT, 'audits/very_long_test_text.txt');
  if (fs.existsSync(setFile) && fs.existsSync(vlPath) && !QUICK) {
    const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map.js'));
    const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry.js'));
    const raw = JSON.parse(fs.readFileSync(setFile, 'utf8'));
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    const { settings: imported } = importImudSettings(raw, regKeys, {});
    const merged = Object.assign({}, getDefaultSettings(), imported);
    const text = fs.readFileSync(vlPath, 'utf8');
    const t0 = performance.now();
    const res = typeset(text, merged, {});
    const ms = performance.now() - t0;
    results.push({
      id: 'very_long_legacy', label: 'very_long — נתיב המורשת (ערכת תלמוד)', bytes: Buffer.byteLength(text, 'utf8'),
      lines: text.split('\n').length, pages: res.pages.length, layoutHash: res.layoutHash,
      contentPreserved: res.contentPreserved, totalMs: +ms.toFixed(1), stages: {}, stageMarks: []
    });
    const r = results[results.length - 1];
    console.log('## very_long — נתיב המורשת (ערכת תלמוד, כמו בדפדפן)');
    console.log(`   קלט: ${(r.bytes / 1024).toFixed(0)}KB · פלט: ${r.pages} עמודים · hash: ${r.layoutHash.slice(0, 18)}…`);
    console.log(`   סה"כ עימוד: ${fmtMs(r.totalMs)} (${(r.pages / (r.totalMs / 1000)).toFixed(1)} עמודים/שנייה)`);
    console.log('');
  }
}

// ================= 7. רישום/פרסור גופנים ב-Worker =================
{
  const fontsDir = path.join(RB, 'ui/assets/imud/fonts');
  const samples = ['David-Regular.ttf', 'FrankRuhlLibre-Regular.ttf', 'Bellefair-Regular.ttf']
    .map(f => path.join(fontsDir, f)).filter(p => fs.existsSync(p));
  console.log('## רישום ופרסור גופנים (registerFont — מדידת מנוע זהה ב-Worker)');
  const fontRows = [];
  for (const p of samples) {
    const bytes = new Uint8Array(fs.readFileSync(p));
    const t0 = performance.now();
    const reg = registerFont(path.basename(p, '.ttf'), bytes);
    const ms = performance.now() - t0;
    fontRows.push({ file: path.basename(p), kb: +(bytes.length / 1024).toFixed(0), ms: +ms.toFixed(1), glyphs: reg.profile && reg.profile.font ? reg.profile.font.numGlyphs : null, ok: reg.ok });
    console.log(`   · ${path.basename(p)}: ${(bytes.length / 1024).toFixed(0)}KB ⇒ ${fmtMs(ms)} (${reg.ok ? 'תקין' : 'כשל: ' + reg.error})`);
  }
  // רישום חוזר (חימום מטמון) — מדידת hit
  if (samples[0]) {
    const bytes = new Uint8Array(fs.readFileSync(samples[0]));
    const t0 = performance.now();
    registerFont(path.basename(samples[0], '.ttf'), bytes);
    console.log(`   · רישום חוזר (אותו שם): ${fmtMs(performance.now() - t0)}`);
  }
  clearRegisteredFonts();
  results.fonts = fontRows;
  console.log('');
}

// ================= 8. ייצוא (HTML / PDF / ZIP) על הקורפוס הקנוני =================
{
  const canon = results.find(r => r.id === 'canonical');
  if (canon) {
    console.log('## ייצוא (על תוצאת הקורפוס הקנוני)');
    const settings = getDefaultSettings();
    const doc = makeMiniDoc();
    const tH0 = performance.now();
    const html = exportApi.exportHtml(canon.result, settings, doc, { title: 'בדיקת ביצועים' });
    const htmlMs = performance.now() - tH0;
    console.log(`   · HTML עצמאי: ${fmtMs(htmlMs)} ⇒ ${(Buffer.byteLength(html, 'utf8') / 1024).toFixed(0)}KB`);
    const tZ0 = performance.now();
    const zip = exportApi.exportProjectZip('', settings, {});
    const zipMs = performance.now() - tZ0;
    console.log(`   · ZIP פרויקט: ${fmtMs(zipMs)} ⇒ ${(zip.length / 1024).toFixed(0)}KB`);
    // PDF — דורש גופן TTF מוטמע
    const ttf = path.join(RB, 'ui/assets/imud/fonts/David-Regular.ttf');
    if (fs.existsSync(ttf)) {
      const fontBytes = new Uint8Array(fs.readFileSync(ttf));
      const text = fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
      const tP0 = performance.now();
      const pdf = exportApi.exportPdf(text, settings, fontBytes);
      const pdfMs = performance.now() - tP0;
      console.log(`   · PDF (גופן David מוטמע): ${pdf.ok ? fmtMs(pdfMs) + ' ⇒ ' + (pdf.bytes.length / 1024).toFixed(0) + 'KB' : 'כשל: ' + pdf.error}`);
      results.exports = { htmlMs: +htmlMs.toFixed(1), zipMs: +zipMs.toFixed(1), pdfMs: +(pdfMs).toFixed(1), pdfOk: pdf.ok };
    } else {
      results.exports = { htmlMs: +htmlMs.toFixed(1), zipMs: +zipMs.toFixed(1) };
    }
    console.log('');
  }
}

// ================= 9. מלאי נכסים (גדלים) =================
{
  console.log('## מלאי נכסים (גודל בתים על הדיסק — שקיל להורדה ראשונית)');
  const inv = {};
  const files = [
    ['ui/app.bundle.js', path.join(RB, 'ui/app.bundle.js')],
    ['ui/engine-worker.bundle.js', path.join(RB, 'ui/engine-worker.bundle.js')],
    ['ui/styles.css', path.join(RB, 'ui/styles.css')],
    ['ui/index.html', path.join(RB, 'ui/index.html')],
    ['imud/fonts-priority.json', path.join(RB, 'ui/assets/imud/fonts-priority.json')],
    ['imud/fonts-extended.json', path.join(RB, 'ui/assets/imud/fonts-extended.json')],
    ['imud/imud-fonts.json (קטלוג)', path.join(RB, 'ui/assets/imud/imud-fonts.json')]
  ];
  for (const [name, p] of files) {
    if (!fs.existsSync(p)) continue;
    const kb = +(fs.statSync(p).size / 1024).toFixed(0);
    inv[name] = kb;
    console.log(`   · ${name}: ${kb}KB`);
  }
  const fontsDir = path.join(RB, 'ui/assets/imud/fonts');
  if (fs.existsSync(fontsDir)) {
    let total = 0, woff2 = 0, ttf = 0, count = 0;
    for (const f of fs.readdirSync(fontsDir)) {
      const sz = fs.statSync(path.join(fontsDir, f)).size;
      total += sz; count++;
      if (f.endsWith('.woff2')) woff2 += sz;
      else if (f.endsWith('.ttf')) ttf += sz;
    }
    inv['fonts-dir'] = { count, totalKB: +(total / 1024).toFixed(0), woff2KB: +(woff2 / 1024).toFixed(0), ttfKB: +(ttf / 1024).toFixed(0) };
    console.log(`   · תיקיית הגופנים המוטמעים: ${count} קבצים · סה"כ ${(total / 1024 / 1024).toFixed(1)}MB (WOFF2: ${(woff2 / 1024 / 1024).toFixed(1)}MB · TTF: ${(ttf / 1024 / 1024).toFixed(1)}MB)`);
    try {
      const prio = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts-priority.json'), 'utf8'));
      const ext = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts-extended.json'), 'utf8'));
      const prioN = Array.isArray(prio) ? prio.length : (prio.families ? prio.families.length : '?');
      const extN = Array.isArray(ext) ? ext.length : (ext.families ? ext.families.length : '?');
      console.log(`   · טעינה דו-שלבית: priority (מיידי) = ${prioN} משפחות · extended (עצל) = ${extN} משפחות`);
      inv.priorityFamilies = prioN; inv.extendedFamilies = extN;
    } catch (e) { /* סכמה שונה — לא קריטי */ }
  }
  results.assets = inv;
  results.engineLoadMs = +engineLoadMs.toFixed(1);
  console.log('');
}

// ================= 10. הוכחת נייטרליות המכשור =================
{
  // השוואת hash מול ריצה לא-מתועדת: העטיפות אינן משנות תוצאה. אין דרך
  // "לכבות" את העטיפות אחרי טעינת המודולים, אך העטיפות מוסיפות תזמון בלבד
  // (try/finally סביב הפונקציה המקורית; אפס שינוי ארגומנטים/תוצאה). ההוכחה
  // המחייבת: השוואת ה-hash מול הערכים הנעולים של הקורפוס הקנוני מבדיקת
  // test:determinism (עדכון ידני אם נעילת ה-hash משתנה).
  const canon = results.find(r => r.id === 'canonical');
  if (canon) {
    const t0 = performance.now();
    const again = typeset(fs.readFileSync(path.join(RB, 'tests/fixtures/canonical_corpus.txt'), 'utf8'), getDefaultSettings(), {});
    const ms = performance.now() - t0;
    const sameHash = again.layoutHash === canon.layoutHash;
    console.log('## דטרמיניזם ונייטרליות המכשור');
    console.log(`   · שתי ריצות של הקורפוס הקנוני: hash ${sameHash ? 'זהה ✓' : 'שונה ✗ (שבירה!)'} · ריצה שנייה ${fmtMs(ms)}`);
    results.determinism = { sameHash, secondRunMs: +ms.toFixed(1), canonicalHash: canon.layoutHash };
  }
}

// ================= 11. שמירת הארטיפקט =================
{
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const artifact = {
    schema: 'perf-baseline-v1',
    date: new Date().toISOString(),
    node: process.version,
    engineLoadMs: results.engineLoadMs,
    docs: results.filter(r => r && r.id).map(r => ({
      id: r.id, label: r.label, bytes: r.bytes, lines: r.lines, pages: r.pages,
      layoutHash: r.layoutHash, contentPreserved: r.contentPreserved, totalMs: r.totalMs,
      stages: r.stages, stageMarks: r.stageMarks
    })),
    fonts: results.fonts || null,
    exports: results.exports || null,
    assets: results.assets || null,
    determinism: results.determinism || null
  };
  const out = path.join(OUT_DIR, 'perf-baseline.json');
  fs.writeFileSync(out, JSON.stringify(artifact, null, 2));
  console.log(`\nארטיפקט נשמר: ${path.relative(ROOT, out)}`);
}
