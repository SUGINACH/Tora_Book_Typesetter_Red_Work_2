#!/usr/bin/env node
// scripts/live-preview-verify.js — אימות Preview חי (13 בדיקות) + ייצוא PDF בפועל
// נגד הפריסה של commit נתון. שימוש:
//   node scripts/live-preview-verify.js [url] [fixture]
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const RB = path.join(ROOT, 'red-build');
const URL_BASE = process.argv[2] || 'https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/';
const FIXTURE = path.resolve(process.argv[3] || path.join(RB, '..', 'audits', 'mid_long_test_text.txt'));
const OUT = '/tmp/live-verify';
const B64_CHUNK = 100_000;
const results = [];
const log = (m) => console.log(m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ab(argv, timeoutMs = 240_000) {
  return new Promise((resolve, reject) => {
    const p = spawn('agent-browser', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(`agent-browser ${argv[0]}: timeout`)); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(timer); reject(e); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`agent-browser ${argv.join(' ').slice(0, 60)} rc=${code}: ${String(err || out).slice(0, 300)}`));
      else resolve(out.trim());
    });
  });
}
async function ev(js) {
  const out = await ab(['eval', js]);
  try { return JSON.parse(out); } catch (e) { return out; }
}
const check = (name, ok, detail) => {
  results.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail) });
  console.log(`${ok ? '✓' : '✗'} ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const runId = Date.now();
  const url = URL_BASE + (URL_BASE.includes('?') ? '&' : '?') + 't=' + runId;
  log(`מאמת: ${url}`);

  // שגיאות קונסולה נאספות מרגע הפתיחה
  try { await ab(['close']); } catch (e) {}
  let opened = false;
  for (let i = 1; i <= 4 && !opened; i++) {
    try { await ab(['open', url]); opened = true; }
    catch (e) { if (i === 4) throw e; await sleep(3000); }
  }
  await ev(`window.__errs = []; window.addEventListener('error', e => __errs.push(String(e.message))); window.addEventListener('unhandledrejection', e => __errs.push(String(e.reason))); 'HOOKED'`);
  await sleep(4000);
  const t0 = Date.now();
  for (;;) {
    if (await ev(`window.__toraApp ? 'APP' : 'NO'`) === 'APP') break;
    if (Date.now() - t0 > 120_000) throw new Error('app לא עלתה ב-120 שניות');
    await sleep(2000);
  }
  // (1) אתר מלא עולה
  check('אפליקציה עולה (__toraApp)', true);

  // (2) UI מלא: עורך + הגדרות
  const ui = await ev(`(function(){ const ta = document.querySelector('textarea'); const tabs = [...document.querySelectorAll('[role=tab],.tab,button')].map(b => b.textContent.trim()); return { hasEditor: !!ta, hasSettings: tabs.some(t => /הגדרות/.test(t)), tabCount: tabs.length }; })()`);
  check('עורך קיים', ui.hasEditor);
  check('הגדרות קיימות (לשונית)', ui.hasSettings);

  // (3) צ'יפ unified
  const chip = await ev(`(function(){ const el = document.querySelector('.chip--profile'); return el ? el.textContent.trim() : null; })()`);
  check('צ\'יפ מנוע unified', chip && /unified/.test(String(chip)), chip);

  // (4) ה-Worker נוכח ופעיל (bundle נטען)
  const perf = await ev(`(function(){ const w = performance.getEntriesByType('resource').filter(r => /engine-worker/.test(r.name)); return { loaded: w.length > 0, size: w.length ? Math.round(w[0].transferSize || w[0].encodedSize || 0) : 0 }; })()`);
  check('engine-worker.bundle.js נטען', perf.loaded);

  // (5) נכסים: גופנים
  const fonts = await ev(`(async function(){ await document.fonts.ready; const fams = new Set(); for (const f of document.fonts) fams.add(f.family); return { families: fams.size, loaded: [...document.fonts].filter(f => f.status === 'loaded').length }; })()`);
  check('גופנים נטענים', fonts.loaded > 10, `${fonts.loaded} נטענו / ${fonts.families} משפחות`);

  // (6) ערכת 40 + עיצובי שערים מקוריים — הגדרות ברירת המחדל מהמקור
  const settings = await ev(`(function(){ const app = window.__toraApp; if (!app || typeof app.getSettings !== 'function') return null; const st = app.getSettings(); const keys = Object.keys(st || {}); return { keys: keys.length, bodyFont: st && st['body-font'], fnEnabled: st && st['footnotes-enabled'] }; })()`);
  check('הגדרות מחוברות למנוע (getSettings)', settings && settings.keys > 100, settings ? settings.keys + ' מפתחות, גוף=' + settings.bodyFont : 'אין');

  // הזרקת מסמך הבדיקה (base64 בחתיכות)
  const b64 = fs.readFileSync(FIXTURE).toString('base64');
  const total = Math.ceil(b64.length / B64_CHUNK);
  log(`מזרים fixture ${path.basename(FIXTURE)} (${fs.statSync(FIXTURE).size.toLocaleString()} בתים, ${total} חתיכות)...`);
  await ev(`window.__ab = ''; 'INIT'`);
  for (let i = 0; i < total; i++) {
    const r = await ev(`window.__ab += '${b64.substr(i * B64_CHUNK, B64_CHUNK)}'; ${i + 1}`);
    if (String(r) !== String(i + 1)) throw new Error(`חתיכה ${i + 1}/${total} נכשלה`);
  }
  await ev(`window.__fx = new TextDecoder('utf-8').decode(Uint8Array.from(atob(window.__ab), c => c.charCodeAt(0))); window.__ab = ''; 'OK'`);

  // (7) עימוד בפועל דרך ה-Worker
  const gen0 = await ev(`(function(){ const st = window.__toraApp.getState(); return st && typeof st.gen === 'number' ? st.gen : null; })()`);
  const started = await ev(`(async () => { const app = window.__toraApp; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; ta.value = window.__fx; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`);
  if (started !== 'STARTED') throw new Error('הזרקה נכשלה: ' + started);
  let pages = 0;
  const t1 = Date.now();
  for (;;) {
    const st = await ev(`(function(){ const st = window.__toraApp.getState(); return st && st.hasResult && st.pages > 0 && (st.gen == null || st.gen > ${gen0}) ? 'READY_' + st.pages : 'WAIT'; })()`);
    if (String(st).startsWith('READY_')) { pages = parseInt(String(st).slice(6), 10); break; }
    if (Date.now() - t1 > 900_000) throw new Error('פסק זמן לעימוד');
    await sleep(4000);
  }
  check(`עימוד מלא דרך Worker (${pages} עמודים)`, pages > 50, `${pages} עמ', ${(Math.round((Date.now() - t1) / 100) / 10)}s`);

  // (8) PageModel: עמודי pmr-page + אינדיקציות מודל
  const pmr = await ev(`(function(){ const app = window.__toraApp; const pm = typeof app.pageModel === 'function' ? app.pageModel() : null; return { hasModel: !!pm, modelPages: pm && pm.pages ? pm.pages.length : 0, geoHash: pm && pm.geometryHash ? String(pm.geometryHash).slice(0, 16) : null, contentHash: pm && pm.contentHash ? String(pm.contentHash).slice(0, 16) : null }; })()`);
  check('PageModel קיים בתוצאה (app.pageModel())', pmr.hasModel && pmr.modelPages === pages, pmr.modelPages + ' עמודי מודל, geo=' + pmr.geoHash);
  check('פרופיל unified (צ\'יפ + הרצה מחייבת PageModel)', chip && /unified/.test(String(chip)) && pmr.hasModel, chip);

  // מעבר לתצוגה
  await ev(`(async () => { for (const t of document.querySelectorAll('[role=tab],.tab,button')) if (/תצוגה/.test(t.textContent)) t.click(); await new Promise(r => setTimeout(r, 2500)); return 'VIEW'; })()`);
  await sleep(1500);

  // (9) שגיאות JS / נכסים שנכשלו
  const errs = await ev(`window.__errs`);
  check('אפס שגיאות JS', Array.isArray(errs) && errs.length === 0, JSON.stringify(errs).slice(0, 150));
  const failedAssets = await ev(`performance.getEntriesByType('resource').filter(r => r.responseStatus >= 400 || (r.transferSize === 0 && r.duration > 0 && /\\.(js|css|ttf|woff2)/.test(r.name) && !/fonts\\.googleapis/.test(r.name))).length`);
  check('אפס בקשות נכסים שנכשלו', Number(failedAssets) === 0, failedAssets + ' נכשלו');

  // (10) ייצוא PDF בפועל
  log('מייצא PDF מהאפליקציה החיה...');
  const pdfInfo = await ev(`(async () => { try { window.__pdfBlob = null; const origCreate = URL.createObjectURL.bind(URL); URL.createObjectURL = function(b) { if (b && b.type === 'application/pdf') window.__pdfBlob = b; return origCreate(b); }; const r = window.__toraApp.exportRequest('pdf'); if (!r || !r.ok) return { ok: false, err: 'exportRequest: ' + JSON.stringify(r) }; for (let i = 0; i < 240 && !window.__pdfBlob; i++) await new Promise(res => setTimeout(res, 500)); URL.createObjectURL = origCreate; if (!window.__pdfBlob) return { ok: false, err: 'לא נוצר blob PDF תוך 120 שניות' }; const buf = await window.__pdfBlob.arrayBuffer(); const u8 = new Uint8Array(buf); let bin = ''; for (let k = 0; k < u8.length; k += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000)); const b64 = btoa(bin); window.__pdfLen = u8.length; const chunks = Math.ceil(b64.length / 200000); window.__pdf = []; for (let i = 0; i < chunks; i++) window.__pdf.push(b64.substr(i * 200000, 200000)); return { ok: true, bytes: u8.length, head: String.fromCharCode.apply(null, u8.subarray(0, 5)) }; } catch (e) { return { ok: false, err: String(e && e.stack || e).slice(0, 300) }; } })()`);
  check('ייצוא PDF הצליח', pdfInfo && pdfInfo.ok, pdfInfo && pdfInfo.ok ? `${pdfInfo.bytes.toLocaleString()} בתים` : pdfInfo && pdfInfo.err);
  check('חתימת PDF תקינה', pdfInfo && pdfInfo.head === '%PDF-', pdfInfo && pdfInfo.head);

  if (pdfInfo && pdfInfo.ok) {
    const chunks = await ev(`window.__pdf.length`);
    const parts = [];
    for (let i = 0; i < chunks; i++) {
      const c = await ev(`window.__pdf[${i}]`);
      parts.push(c);
    }
    const pdfBuf = Buffer.from(parts.join(''), 'base64');
    const pdfPath = path.join(OUT, 'live-export.pdf');
    fs.writeFileSync(pdfPath, pdfBuf);
    check('PDF נשמר בשלמותו', pdfBuf.length === pdfInfo.bytes, `${pdfBuf.length.toLocaleString()} בתים → ${pdfPath}`);
    const sha = crypto.createHash('md5').update(pdfBuf).digest('hex');
    log(`PDF md5: ${sha}`);
  }

  // (11) דטרמיניזם חי: עימוד חוזר — אותו מספר עמודים
  const gen1 = await ev(`window.__toraApp.getState().gen`);
  await ev(`window.__toraApp.onExplicitRetypeset(); 'STARTED2'`);
  let pages2 = 0;
  const t2 = Date.now();
  for (;;) {
    const st = await ev(`(function(){ const st = window.__toraApp.getState(); return st && st.gen > ${gen1} && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`);
    if (String(st).startsWith('READY_')) { pages2 = parseInt(String(st).slice(6), 10); break; }
    if (Date.now() - t2 > 900_000) throw new Error('פסק זמן לעימוד-2');
    await sleep(4000);
  }
  check('דטרמיניזם חי (עימוד חוזר)', pages2 === pages, `${pages}→${pages2}`);

  // (12) שגיאות אחרי הכל
  const errs2 = await ev(`window.__errs`);
  check('אפס שגיאות JS אחרי מחזור מלא', Array.isArray(errs2) && errs2.length === 0, JSON.stringify(errs2).slice(0, 150));

  try { await ab(['close']); } catch (e) {}

  const failed = results.filter(r => !r.ok);
  console.log('\n════════ אימות Preview חי ════════');
  console.log(`עברו ${results.length - failed.length}/${results.length}`);
  fs.writeFileSync(path.join(OUT, 'live-verify.json'), JSON.stringify({ url: URL_BASE, fixture: path.basename(FIXTURE), at: new Date().toISOString(), results }, null, 1), 'utf8');
  if (failed.length) {
    console.log('נכשלו: ' + failed.map(f => f.name).join('; '));
    process.exit(1);
  }
  console.log('✓ הכל תקין');
})().catch((e) => { console.error(String(e && e.stack || e)); try { ab(['close']); } catch (x) {} process.exit(2); });
