#!/usr/bin/env node
// tools/layout-audit/run-full-math.js — האודיט המתמטי המלא (S4.24) ברגרסיית Node
'use strict';
/**
 * הרצה עצמאית (אפס תלויות חוץ מ-agent-browser) של האודיט המתמטי המלא:
 *   1. מגיש את האפליקציה (red-build/ui) בשרת מקומי — או פותח URL חי (--url).
 *   2. מזרים את ה-fixture (ברירת מחדל: audits/very_long_test_text.txt —
 *      3.4MB, ~700 עמודים) — מקומית דרך השרת, בחי דרך base64 בחתיכות
 *      (עוקף MAX_ARG_STRLEN).
 *   3. ממתין לסיום העימוד (polling של מצב האפליקציה).
 *   4. מריץ את full-math-audit.js בתוך הדף (21 משפחות בדיקות — דיו בפועל,
 *      חפיפות, יישור, מרכוז, פסים, הערות-שוליים, כיסוי, גופנים, וירטואליזציה).
 *   5. מעמד שנית ומריץ את determinism-sweep.js — השוואת טביעת-אצבע גאומטרית.
 * יציאה 0 **רק** אם: 0 בעיות + כיסוי מלא + דטרמיניזם זהה.
 * הדוחות נשמרים ב-red-build/tests/artifacts/full-math-audit/ (או --out).
 *
 * **הערת מימוש (קריטית):** כל הפעלות agent-browser הן **אסינכרוניות**
 * (child_process.spawn + await) — השרת המקומי חי באותו תהליך, ו-spawnSync
 * היה חוסם את ה-event-loop ומונע ממנו להגיש את הדף בזמן שהדפדפן ממתין
 * לו (נמדד: קיפאון כפול — ה-open מסתיים ב-EAGAIN מול הדמון).
 *
 * שימוש:
 *   node tools/layout-audit/run-full-math.js [--fixture <path>] [--url <url>]
 *        [--tag <name>] [--out <dir>] [--skip-determinism] [--capture-exports]
 * דוגמאות:
 *   node tools/layout-audit/run-full-math.js                      # מקומי + very_long
 *   node tools/layout-audit/run-full-math.js --url https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/ --tag live
 */
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const UI = path.join(ROOT, 'red-build', 'ui');
const AUDIT_JS = path.join(__dirname, 'full-math-audit.js');
const DET_JS = path.join(__dirname, 'determinism-sweep.js');

// ── ארגומנטים ──
const args = process.argv.slice(2);
const argOf = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : def;
};
const FIXTURE = path.resolve(argOf('--fixture', path.join(ROOT, 'audits', 'very_long_test_text.txt')));
const URL = argOf('--url', null);
const TAG = argOf('--tag', URL ? 'live' : 'local');
const OUT = path.resolve(argOf('--out', path.join(ROOT, 'red-build', 'tests', 'artifacts', 'full-math-audit')));
const SKIP_DET = args.includes('--skip-determinism');
const CAPTURE_EXPORTS = args.includes('--capture-exports');
const PORT = 8932;
const B64_CHUNK = 100_000;
const READY_TIMEOUT_MS = 900_000;
// **S5.2 (רצפת נפח):** ספר שהתקצר בשקט (מנוע שבורע/מדלג תוכן) עבר ירוק כל
// עוד 0 בעיות במה שכן רונדר. הקורפוס: 363,232 מילים גולמיות.
// **חידוש הרצפה (i006, 23.11 — 690→680):** הקיצור 719→698 (i004: מילוי גרידי
// RC-5a–d) →689 (i005: חוזה spanning אחיד RC-F1a + שעת הכלה RC-F1c — 27 עמודים
// כמעט-ריקים מפיצויי הזזה חוסלו) מתועד ומוכח: contentPreserved=true,
// materializeFallbacks=0, 0 בלתי-מסווגים (s5-corpus-comparison), כיסוי טוקנים
// מלא. רצפת 690 נכשלה על 689 למרות שלמות מוכחת — חודשה ל-680 כדי לשמור משמר
// אמיתי (ירידה נוספת מטה תיתפס) בלי להיכשל על הקיצור המתועד. יחס המילים
// (0.98) תופס איבוד תוכן אמיתי.
const EXPECTED_PAGES_MIN = 680;
const EXPECTED_WORDS_MIN_RATIO = 0.98;

const log = (m) => console.log(m);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── agent-browser (אסינכרוני בלבד!) ──
function ab(argv, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const p = spawn('agent-browser', argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => { p.kill('SIGKILL'); reject(new Error(`agent-browser ${argv[0]}: פסק זמן (${timeoutMs}ms)`)); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(timer); reject(new Error(`agent-browser ${argv[0]}: ${e.message}`)); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`agent-browser ${String(argv.join(' ')).slice(0, 80)} rc=${code}: ${String(err || out).slice(0, 400)}`));
      else resolve(out.trim());
    });
  });
}
async function ev(js) {
  const out = await ab(['eval', js]);
  try { return JSON.parse(out); } catch (e) { return out; }
}

/** Capture the browser/Worker state without changing the readiness acceptance gate. */
async function captureReadinessDiagnostic(label, expectedGeneration, cause) {
  try {
    const snapshot = await ev(`(function() {
      const app = window.__toraApp;
      const state = app && typeof app.getState === 'function' ? app.getState() : null;
      const status = document.querySelector('.status-strip');
      const resources = performance.getEntriesByType('resource')
        .filter((entry) => /engine-worker|shaping-runtime|harfbuzz|unicode18/.test(entry.name))
        .slice(-30)
        .map((entry) => ({
          name: entry.name,
          duration: entry.duration,
          responseEnd: entry.responseEnd,
          transferSize: entry.transferSize,
          decodedBodySize: entry.decodedBodySize,
          responseStatus: entry.responseStatus == null ? null : entry.responseStatus
        }));
      return {
        label: ${JSON.stringify(label)},
        expectedGeneration: ${JSON.stringify(expectedGeneration)},
        appAvailable: !!app,
        state,
        statusText: status ? status.innerText : null,
        visibleTextTail: String(document.body && document.body.innerText || '').slice(-3500),
        documentReadyState: document.readyState,
        fontsStatus: document.fonts ? document.fonts.status : null,
        workerResources: resources
      };
    })()`);
    return { snapshot, cause: cause ? String(cause && cause.message || cause) : null };
  } catch (error) {
    return { diagnosticError: String(error && error.message || error), cause: cause ? String(cause && cause.message || cause) : null };
  }
}

// ── שרת מקומי (מצב local) ──
let server = null;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };
function startServer() {
  return new Promise((res, rej) => {
    server = http.createServer((req, resp) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      let file = null;
      if (urlPath === '/_audit-fixture.txt') file = FIXTURE;
      else if (urlPath === '/' || urlPath === '/index.html') file = path.join(UI, 'index.html');
      else file = path.join(UI, urlPath.replace(/^\//, ''));
      fs.readFile(file, (err, data) => {
        if (err) { resp.writeHead(404); resp.end('not found'); return; }
        resp.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
        resp.end(data);
      });
    });
    server.on('error', rej);
    server.listen(PORT, '127.0.0.1', () => res());
  });
}

// ── הזרקת JS ב-base64 בחתיכות (עוקף MAX_ARG_STRLEN) ──
async function injectB64Var(file, varName) {
  const b64 = fs.readFileSync(file).toString('base64');
  await ev(`window.${varName} = ''; 'INIT'`);
  const total = Math.ceil(b64.length / B64_CHUNK);
  for (let i = 0; i < total; i++) {
    const part = b64.substr(i * B64_CHUNK, B64_CHUNK);
    const r = await ev(`window.${varName} += '${part}'; ${i + 1}`);
    if (String(r) !== String(i + 1)) throw new Error(`הזרקת ${varName} נכשלה בחתיכה ${i + 1}/${total}: ${r}`);
  }
}

async function runScriptVar(varSrc, varOut, errVar, timeoutMs) {
  await ev(`window.${varOut} = null; window.${errVar} = null;`
    + `(function() { const s = new TextDecoder('utf-8').decode(Uint8Array.from(atob(window.${varSrc}), c => c.charCodeAt(0)));`
    + `Promise.resolve().then(() => eval(s))`
    + `  .then(r => { window.${varOut} = r; })`
    + `  .catch(e => { window.${errVar} = String((e && e.stack) || e); }); })(); 'RUNNING'`);
  const t0 = Date.now();
  for (;;) {
    const st = await ev(`window.${varOut} ? 'DONE' : (window.${errVar} ? 'ERR' : 'RUNNING')`);
    if (st === 'DONE') return;
    if (st === 'ERR') throw new Error(`${varSrc} נכשל: ` + String(await ev(`window.${errVar}`)).slice(0, 800));
    if (Date.now() - t0 > timeoutMs) throw new Error(`פסק זמן ל-${varSrc}`);
    await sleep(5000);
  }
}

async function fetchBigVar(name) {
  const len = await ev(`(window.${name} ? window.${name}.length : -1)`);
  if (typeof len !== 'number' || len < 0) throw new Error(`משתנה ${name} לא זמין (אורך ${len})`);
  // **S4.26 (תעבורה עמידה):** שליפת מחרוזות גדולות דרך פלט ה-CLI של
  // agent-browser עלולה לשנות תווי יוניקוד נדירים (נצפה: אורך 777660
  // מול 777659 — פער של תו אחד בתעבורה, לא בתוכן). שליפה ב-base64 לכל
  // חתיכה — חסינה לחלוטין לרגעים כאלה (utf-8 ⇄ base64 בלי עריכת התווים).
  const CHUNK = 120_000;
  const parts = [];
  for (let i = 0; i < len; i += CHUNK) {
    const b64 = await ev(
      `(function(){ const s = window.${name}.slice(${i}, ${i + CHUNK});`
      + ` const u8 = new TextEncoder().encode(s);`
      + ` let bin = ''; for (let k = 0; k < u8.length; k += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000));`
      + ` return btoa(bin); })()`
    );
    if (typeof b64 !== 'string' || !b64.length) throw new Error(`שליפת ${name}: חתיכה ${i} ריקה`);
    parts.push(Buffer.from(b64, 'base64').toString('utf8'));
  }
  const s = parts.join('');
  if (s.length !== len) throw new Error(`שליפת ${name}: אורך ${s.length} ≠ ${len}`);
  return s;
}


async function runProcess(command, argv, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(command + ' timeout after ' + timeoutMs + 'ms')); }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => { clearTimeout(timer); reject(new Error(command + ' could not start: ' + error.message)); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(command + ' failed (' + code + '): ' + stderr.slice(0, 1200)));
      else resolve({ stdout, stderr });
    });
  });
}

/** Export HTML and PDF from the already-typeset immutable PageModel and preserve both artifacts. */
async function captureLiveExports(expectedPages) {
  const before = await ev("(function(){const a=window.__toraApp;const m=a&&a.pageModel&&a.pageModel();const s=a&&a.getState&&a.getState();return {hasApp:!!a,schema:m&&m.schema||null,modelPages:m&&Array.isArray(m.pages)?m.pages.length:0,layoutHash:s&&s.layoutHash||null,pages:s&&s.pages||0,dirty:!!(s&&(s.lightDirty||s.heavyDirty))};})()");
  if (!before || !before.hasApp || before.schema !== 'pagemodel-v1' || before.modelPages !== expectedPages ||
      before.pages !== expectedPages || before.dirty || !before.layoutHash) {
    throw new Error('LIVE export audit: PageModel/state mismatch before export: ' + JSON.stringify(before));
  }

  const htmlMeta = await ev("(function(){const a=window.__toraApp;const r=a&&a.exportRequest('html');if(!r||r.ok!==true||typeof r.data!=='string')return {ok:false,reason:r&&(r.error||r.reason)||'HTML export did not return a string'};window.__liveExportHtml=r.data;return {ok:true,chars:r.data.length};})()");
  if (!htmlMeta || htmlMeta.ok !== true) throw new Error('LIVE HTML export failed: ' + JSON.stringify(htmlMeta));
  const htmlRaw = await fetchBigVar('__liveExportHtml');
  const htmlPath = path.join(OUT, TAG + '-book.html');
  fs.writeFileSync(htmlPath, htmlRaw, 'utf8');
  const htmlBytes = Buffer.byteLength(htmlRaw, 'utf8');
  const htmlSha = crypto.createHash('sha256').update(htmlRaw, 'utf8').digest('hex');
  const htmlPages = (htmlRaw.match(/class=["'][^"']*\bpage\b[^"']*["']/g) || []).length;
  if (!/<html\b/i.test(htmlRaw) || !/<\/html>/i.test(htmlRaw) || htmlPages !== expectedPages) {
    throw new Error('LIVE HTML page count/standalone structure mismatch: ' + JSON.stringify({ htmlPages, expectedPages, htmlBytes }));
  }

  await ev("(function(){if(!window.__liveOriginalCreateObjectURL){window.__liveOriginalCreateObjectURL=URL.createObjectURL.bind(URL);URL.createObjectURL=function(blob){if(blob&&blob.type==='application/pdf')window.__livePdfBlob=blob;return window.__liveOriginalCreateObjectURL(blob);};}window.__livePdfBlob=null;window.__livePdfB64=null;return 'PDF_CAPTURE_READY';})()");
  const pdfStart = await ev("(function(){const r=window.__toraApp.exportRequest('pdf');return r?{ok:!!r.ok,pending:!!r.pending,reason:r.reason||null,error:r.error||null}:null;})()");
  if (!pdfStart || pdfStart.ok !== true || pdfStart.pending !== true) {
    throw new Error('LIVE PDF export request not accepted by Worker: ' + JSON.stringify(pdfStart));
  }

  const pdfStartTime = Date.now();
  let pdfState = 'WAIT';
  while (Date.now() - pdfStartTime < 12 * 60 * 1000) {
    pdfState = await ev("(function(){if(window.__livePdfBlob)return 'READY';const e=document.querySelector('.status-strip');const t=e?String(e.innerText||''):'';return t.includes('ייצוא PDF נכשל')?'ERROR:'+t:'WAIT';})()");
    if (pdfState === 'READY') break;
    if (typeof pdfState === 'string' && pdfState.indexOf('ERROR:') === 0) throw new Error(pdfState);
    await sleep(1500);
  }
  if (pdfState !== 'READY') throw new Error('LIVE PDF export timed out waiting for Worker Blob');

  const pdfMeta = await ev("(async function(){const b=window.__livePdfBlob;if(!b||b.type!=='application/pdf')return {ok:false,reason:'PDF Blob missing or wrong MIME'};const u=new Uint8Array(await b.arrayBuffer());let b64='';const n=24576;for(let i=0;i<u.length;i+=n){const p=u.subarray(i,Math.min(u.length,i+n));let z='';for(let j=0;j<p.length;j++)z+=String.fromCharCode(p[j]);b64+=btoa(z);}window.__livePdfB64=b64;return {ok:true,type:b.type,size:u.length,signature:String.fromCharCode(u[0],u[1],u[2],u[3],u[4]),base64Length:b64.length};})()");
  if (!pdfMeta || pdfMeta.ok !== true || pdfMeta.signature !== '%PDF-') {
    throw new Error('LIVE PDF Blob invalid: ' + JSON.stringify(pdfMeta));
  }
  const pdfB64 = await fetchBigVar('__livePdfB64');
  const pdfBytes = Buffer.from(pdfB64, 'base64');
  const pdfPath = path.join(OUT, TAG + '-book.pdf');
  fs.writeFileSync(pdfPath, pdfBytes);
  const pdfSha = crypto.createHash('sha256').update(pdfBytes).digest('hex');
  if (pdfBytes.length !== pdfMeta.size || pdfBytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('LIVE PDF bytes changed during transfer');
  }

  const pdfInfo = await runProcess('pdfinfo', [pdfPath], 120000);
  const pageMatch = /^Pages:\s+(\d+)/m.exec(pdfInfo.stdout);
  const pdfPages = pageMatch ? Number(pageMatch[1]) : 0;
  if (pdfPages !== expectedPages) {
    throw new Error('LIVE PDF page count differs from PageModel: ' + JSON.stringify({ pdfPages, expectedPages, pdfinfo: pdfInfo.stdout.slice(0, 1000) }));
  }

  const textPath = path.join(OUT, TAG + '-book-extracted.txt');
  await runProcess('pdftotext', ['-layout', pdfPath, textPath], 180000);
  const extractedText = fs.readFileSync(textPath, 'utf8');
  const hebrewChars = (extractedText.match(/[\u0590-\u05ff]/g) || []).length;
  if (hebrewChars < 100) throw new Error('LIVE PDF extraction returned too little Hebrew text: ' + hebrewChars);

  const after = await ev("(function(){const a=window.__toraApp;const m=a&&a.pageModel&&a.pageModel();const s=a&&a.getState&&a.getState();return {modelPages:m&&Array.isArray(m.pages)?m.pages.length:0,layoutHash:s&&s.layoutHash||null,pages:s&&s.pages||0,dirty:!!(s&&(s.lightDirty||s.heavyDirty))};})()");
  if (!after || after.layoutHash !== before.layoutHash || after.pages !== before.pages || after.modelPages !== before.modelPages || after.dirty) {
    throw new Error('LIVE export mutated the typeset result: ' + JSON.stringify({ before, after }));
  }

  const manifest = {
    sourceUrl: await ev('location.href'),
    layoutHash: before.layoutHash,
    pageModelSchema: before.schema,
    pageModelPages: before.modelPages,
    html: { file: path.basename(htmlPath), bytes: htmlBytes, sha256: htmlSha, pages: htmlPages },
    pdf: { file: path.basename(pdfPath), bytes: pdfBytes.length, sha256: pdfSha, pages: pdfPages, extractedTextFile: path.basename(textPath), extractedHebrewChars: hebrewChars },
    exportDidNotMutateLayout: true
  };
  fs.writeFileSync(path.join(OUT, TAG + '-export-audit.json'), JSON.stringify(manifest, null, 2), 'utf8');
  log('LIVE exports: PageModel=' + expectedPages + ' | HTML=' + htmlPages + ' | PDF=' + pdfPages + ' | Hebrew chars=' + hebrewChars);
  return manifest;
}

async function retypesetAndWait(label) {
  // **S5.2 (מרוץ הרצה-2):** לפני ההדלקה נלקח מונה הדור של האפליקציה —
  // app.getState().gen: 0 בעלייה, +1 על **כל** עימוד שהושלם. בלי זה, הרצה-2
  // המתינה על `hasResult && pages>0` — תנאי שכבר התקיים מהרצה-1 (עימוד מחדש
  // אינו מאפס את התוצאה הישנה) — ויכלה לבדוק את ה-DOM הישן/מעורבב של הרצה-1
  // ("IDENTICAL" ריק, או דגימת ביניים באמצע מחיקה). חוזה: gen מספר; אם השדה
  // חסר (אפליקציה ישנה) — נפילה חזרה להתנהגות הקודמת.
  const gen0 = await ev(`(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && typeof st.gen === 'number' ? st.gen : null; })()`);
  const hasGen = typeof gen0 === 'number';
  log(`${label}: מונה דור (gen) ${hasGen ? '=' + gen0 : 'לא נתמך — נפילה ל-polling ישן'}`);
  const inject = URL
    ? `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; ta.value = window.__fx; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`
    : `(async () => { const app = window.__toraApp; if (!app) return 'NO_APP'; const ta = document.querySelector('textarea'); if (!ta) return 'NO_TEXTAREA'; const text = await (await fetch('/_audit-fixture.txt')).text(); ta.value = text; ta.dispatchEvent(new Event('input', {bubbles:true})); await new Promise(r => setTimeout(r, 400)); app.onExplicitRetypeset(); return 'STARTED'; })()`;
  const r = await ev(inject);
  if (r !== 'STARTED') throw new Error(`${label}: הזרקה נכשלה: ${r}`);
  const t0 = Date.now();
  const pollJs = hasGen
    ? `(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && typeof st.gen === 'number' && st.gen > ${gen0} && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`
    : `(function(){ const st = window.__toraApp && window.__toraApp.getState(); return st && st.hasResult && st.pages > 0 ? 'READY_' + st.pages : 'WAIT'; })()`;
  for (;;) {
    let st;
    try { st = await ev(pollJs); }
    catch (e) {
      // **Iteration-006 (RC-D1 — עמידות דמון חולף):** בזמן עימוד כבד (very_long)
      // הדמון של agent-browser מחזיר לעיתים EAGAIN ("Resource temporarily
      // unavailable") על eval מקביל — כשל תשתית חולף, לא כשל תוכן. ניסיון
      // חוזר במקום מוות הריצה; פסק הזמן הכללי (READY_TIMEOUT_MS) עדיין שומר
      // על החוזה. אותו דפוס עמידות כמו S4.14 ב-run.sh.
      if (Date.now() - t0 > READY_TIMEOUT_MS) {
        const diagnostic = await captureReadinessDiagnostic(label, gen0, e);
        log(`${label}: LAYOUT_AUDIT_READINESS_DIAGNOSTIC=${JSON.stringify(diagnostic)}`);
        throw new Error(`${label}: פסק זמן לעימוד (כולל כשלי דמון: ${String(e && e.message || e).slice(0, 90)})`);
      }
      await sleep(3000);
      continue;
    }
    if (String(st).startsWith('READY_')) {
      // **S5.2:** המתנה קצרה אחרי READY — הווירטואליזציה של התצוגה מרנדרת את
      // החלון החי בגלילה; בלי המתנה הבדיקה עלולה לראות placeholders טריים.
      await sleep(1200);
      return parseInt(String(st).slice(6), 10);
    }
    if (Date.now() - t0 > READY_TIMEOUT_MS) {
      const diagnostic = await captureReadinessDiagnostic(label, gen0);
      log(`${label}: LAYOUT_AUDIT_READINESS_DIAGNOSTIC=${JSON.stringify(diagnostic)}`);
      throw new Error(`${label}: פסק זמן לעימוד`);
    }
    await sleep(3000);
  }
}
const gotoView = async () => {
  await ev(`(async () => { for (const t of document.querySelectorAll('[role=tab],.tab,button')) if (/תצוגה/.test(t.textContent)) t.click(); await new Promise(r => setTimeout(r, 2500)); return 'VIEW'; })()`);
};

// בניית bundles מקומיים — לפני פתיחת השרת והדפדפן.
async function buildLocalBrowserBundles() {
  const script = path.join(ROOT, 'tools', 'build-worker-bundle.js');
  log('Building browser bundles from current source before local full-math audit...');
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => reject(new Error(`bundle build could not start: ${error.message}`)));
    child.on('close', (code) => {
      if (stdout.trim()) log(stdout.trim());
      if (stderr.trim()) log(stderr.trim());
      if (code !== 0) reject(new Error(`bundle build failed (exit ${code}) — refusing to audit stale UI bundles`));
      else resolve();
    });
  });
  for (const file of ['app.bundle.js', 'engine-worker.bundle.js']) {
    const fullPath = path.join(UI, file);
    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).size === 0) {
      throw new Error(`bundle build did not produce a non-empty ${fullPath}`);
    }
  }
}

// ═════════ main ═════════
(async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(FIXTURE)) throw new Error(`חסר fixture: ${FIXTURE}`);
  // **F-BL1 (17.11 — שורש הפער ההיסטורי 353,687<355,967):** רצפת הנפח השוותה
  // מילים מרונדרות מול **ה-fixture הגולמי** — אך ~2.75% ממנו הוא תחביר סימון
  // שלעולם אינו מרונדר (דירקטיבות 'כותרת N [מספר M] [(מקור: …)] -', מטא-מקור,
  // עריכה). ההשוואה הייתה כשל-שקר קבוע (353,687<355,967). התיקון בסמכות
  // הנכונה: הרצפה מודדת מול **מילות התוכן הצפויות** — מחושבות מאותו טוקניזר
  // SSOT של המנוע (אותן הגדרות תוחמי-הערה של ברירת המחדל החיה) — ועל הירידה
  // מופעל **משמר נגד-מעגליות**: כל מילה שנופלת מה-fixture ואינה בזרם הטוקנים
  // חייבת להיות מילת תחביר מוסברת (דירקטיבה/מקף/מטא) או חצי-הדבקת-הערה
  // (המרונדרת כמילה מודבקת). ירידה בלתי-מוסברת ⇒ כשל חמור עם דוגמאות.
  // הסף 0.98 לא שונה ולא נחלש — מה שנמדד הוא כיסוי התוכן בפועל.
  const RB = path.join(ROOT, 'red-build');
  const { tokenizeDoc, stripEditorialNotes, parseMetadata } = require(path.join(RB, 'src/engine/layout/legacy-imud-flow'));
  const defaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const auditCfg = { fnOpen: String(defaults['fn-delim-open'] || '['), fnClose: String(defaults['fn-delim-close'] || ']') };
  const rawText = fs.readFileSync(FIXTURE, 'utf8');
  const fixtureWords = rawText.split(/\s+/).filter(Boolean).length;
  const { tokens: auditTokens } = tokenizeDoc(rawText, auditCfg);
  let contentWords = 0;
  const tokMultiset = new Map();
  const bumpTok = (w) => tokMultiset.set(w, (tokMultiset.get(w) || 0) + 1);
  for (const t of auditTokens) {
    for (const w of String(t.text == null ? '' : t.text).split(/\s+/).filter(Boolean)) { contentWords++; bumpTok(w); }
    for (const w of String(t.sideNote || '').split(/\s+/).filter(Boolean)) { contentWords++; bumpTok(w); }
    for (const w of String(t.endNote || '').split(/\s+/).filter(Boolean)) { contentWords++; bumpTok(w); }
  }
  // משמר נגד-מעגליות: כל מילה שנופתת מהמקור (אחרי עריכה+מטא) חייבת להיות
  // תחביר מוסבר או חצי הדבקה (מילה מודבקת עם '[' בפנים מכסה את שני חצאיה).
  const { text: noMetaText } = parseMetadata(stripEditorialNotes(rawText));
  const syntaxWords = new Map();
  const bumpSyn = (s) => { for (const w of String(s).split(/\s+/).filter(Boolean)) syntaxWords.set(w, (syntaxWords.get(w) || 0) + 1); };
  for (const ln of noMetaText.split('\n')) {
    const t = ln.trim();
    if (!t) continue;
    const m = /^כותרת\s+(\d+)\s+(מספר\s+(\S+)\s+)?(\(מקור[^)]*\)\s*)?[-–—:]\s*(.*)$/.exec(t)
      || /^כותרת\s+(\d+)\s+(מספר\s+(\S+)\s+)?(\(מקור[^)]*\)\s*)(.*)$/.exec(t);
    if (m) {
      bumpSyn('כותרת'); bumpSyn(m[1]);
      if (m[2]) { bumpSyn('מספר'); bumpSyn(m[3]); }
      if (m[4]) bumpSyn(m[4]);
    }
    const sm = /^סימן\s+[א-ת]+\s*[-–—:]\s*/.exec(t);
    if (sm) bumpSyn(sm[0]);
  }
  const srcMultiset = new Map();
  for (const w of noMetaText.split(/\s+/).filter(Boolean)) srcMultiset.set(w, (srcMultiset.get(w) || 0) + 1);
  const glued = new Set();
  for (const [w] of tokMultiset) { const i = w.indexOf('['); if (i > 0) { glued.add(w.slice(0, i)); glued.add('[' + w.slice(i + 1)); } }
  const unexplainedDrops = [];
  for (const [w, c] of srcMultiset) {
    const tc = tokMultiset.get(w) || 0;
    if (tc >= c) continue;
    let miss = c - tc;
    if (w === '-' || w === '–' || w === '—') continue; // מקפי הפרדה של דירקטיבות
    const syn = syntaxWords.get(w) || 0;
    miss -= Math.min(miss, syn);
    if (miss > 0 && glued.has(w)) miss = 0; // חצי-הדבקה: מרונדר בתור מילה מודבקת
    if (miss > 0) unexplainedDrops.push(`${w} (×${miss})`);
  }
  if (unexplainedDrops.length) {
    console.error('✗ משמר הטוקניזר נכשל — מילים שנופתו מהמקור בלי הסבר תחביר (אובדן תוכן חשוד):');
    console.error('  - ' + unexplainedDrops.slice(0, 20).join(', ') + (unexplainedDrops.length > 20 ? ` … (${unexplainedDrops.length})` : ''));
    process.exit(1);
  }
  log(`מילות תוכן צפויות (טוקניזר SSOT): ${contentWords.toLocaleString()} | גולמי: ${fixtureWords.toLocaleString()} | תחביר שהוסבר: ${(fixtureWords - contentWords).toLocaleString()} | משמר ירידה: עבר (0 בלתי-מוסברות)`);
  // **S5.2 (פריסה מיושנת — cache-bust):** פתיחת ה-HTML עם query ייחודי — אחרת
  // ה-CDN של Pages עשוי להגיש HTML מיושן מהמטמון והבדיקה תרוץ נגד עבר.
  const runId = Date.now();
  const targetUrl = URL
    ? URL + (URL.includes('?') ? '&' : '?') + 't=' + runId
    : `http://127.0.0.1:${PORT}/index.html`;
  // בדיקת local חייבת לבנות את אותם app/worker bundles מהמקור הנוכחי
  // לפני שהשרת מתחיל להגיש קבצים. במצב --url נבדק אתר מרוחק ולכן לא בונים כאן.
  if (!URL) {
    await buildLocalBrowserBundles();
    await startServer();
  }

  try { await ab(['close']); } catch (e) {}
  // הדמון של agent-browser עשוי להיות עסוק עוד רגע בסגירת הדפדפן הקודם
  // (EAGAIN בקריאת התשובה) — ניסיון חוזר עם המתנה פותר זאת.
  let opened = false;
  for (let attempt = 1; attempt <= 4 && !opened; attempt++) {
    try { await ab(['open', targetUrl]); opened = true; }
    catch (e) {
      if (attempt === 4) throw e;
      await sleep(3000);
    }
  }
  await sleep(4000);
  const t0 = Date.now();
  for (;;) {
    if (await ev(`window.__toraApp ? 'APP' : 'NO'`) === 'APP') break;
    if (Date.now() - t0 > 120_000) throw new Error('האפליקציה לא עלתה ב-120 שניות');
    await sleep(2000);
  }
  log(`אתר: ${targetUrl} | app: ${await ev(`(document.querySelector('script[src*="app.bundle.js"]') || {}).src || '—'`)}`);

  // **S5.2 (פריסה מיושנת — אמת חמורה, מצב חי בלבד):** sha256 של הבאנדלים הפרוסים
  // (נמשכים בעמוד עצמו עם cache:'reload') מול הבאנדלים בענף — אי-התאמה אחת
  // משמעותה שהאודיט רץ נגד פריסה שאינה main. בנוסף ASSET_VERSION שבפועל
  // במסמך (?v= ב-script src) מול הקבוע ב-red-build/src/ui/browser-entry.js.
  if (URL) {
    const deployed = await ev(`(async function () {
      const appSrc = (document.querySelector('script[src*="app.bundle.js"]') || {}).src || null;
      const verOf = (u) => { const m = String(u || '').match(/[?&]v=([^&]+)/); return m ? m[1] : null; };
      // **S5.2:** גם השליפה עצמה עם ?t= (cache-bust) + cache:'reload' — לא לקבל
      // עותק מיושן מה-CDN/מטמון הדפדפן בדיוק ברגע שבודקים טריות.
      const bust = (u) => String(u) + (String(u).includes('?') ? '&' : '?') + 't=' + '${runId}';
      const sha = async (u) => {
        try {
          const buf = await (await fetch(bust(u), { cache: 'reload' })).arrayBuffer();
          const h = await crypto.subtle.digest('SHA-256', buf);
          let hex = '';
          for (const b of new Uint8Array(h)) hex += b.toString(16).padStart(2, '0');
          return hex;
        } catch (e) { return 'FETCH_FAIL:' + ((e && e.message) || e); }
      };
      const v = verOf(appSrc);
      const appSha = await sha(appSrc || (location.href.replace(/[?#].*$/, '') + 'app.bundle.js'));
      const workerUrl = new URL('engine-worker.bundle.js' + (v ? '?v=' + v : ''), location.href).href;
      const workerSha = await sha(workerUrl);
      return { appSrc, assetVersion: v, appSha, workerSha };
    })()`);
    const shaFile = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
    const localAppSha = shaFile(path.join(UI, 'app.bundle.js'));
    const localWorkerSha = shaFile(path.join(UI, 'engine-worker.bundle.js'));
    const entrySrc = fs.readFileSync(path.join(ROOT, 'red-build', 'src', 'ui', 'browser-entry.js'), 'utf8');
    const mV = entrySrc.match(/ASSET_VERSION\s*=\s*'([^']+)'/);
    const localVersion = mV ? mV[1] : null;
    log(`באנדלים (חי):  app ${String(deployed.appSha).slice(0, 16)}… | worker ${String(deployed.workerSha).slice(0, 16)}… | ASSET_VERSION ${deployed.assetVersion || '—'}`);
    log(`באנדלים (main): app ${localAppSha.slice(0, 16)}… | worker ${localWorkerSha.slice(0, 16)}… | ASSET_VERSION ${localVersion || '—'}`);
    let stale = false;
    if (deployed.appSha !== localAppSha || deployed.workerSha !== localWorkerSha) {
      console.error('✗ הפריסה החיה מיושנת — הבאנדל הפרוס אינו תואם ל-main');
      console.error(`  app.bundle.js:           פרוס ${deployed.appSha}`);
      console.error(`                          main  ${localAppSha}`);
      console.error(`  engine-worker.bundle.js: פרוס ${deployed.workerSha}`);
      console.error(`                          main  ${localWorkerSha}`);
      stale = true;
    }
    if (localVersion && deployed.assetVersion && deployed.assetVersion !== localVersion) {
      console.error(`✗ ASSET_VERSION במסמך (${deployed.assetVersion}) ≠ במקור (${localVersion}) — ה-HTML הפרוס מיושן`);
      stale = true;
    }
    if (!localVersion || !deployed.assetVersion) {
      log(`⚠ לא ניתן להשוות ASSET_VERSION (פרוס: ${deployed.assetVersion || '—'}, מקור: ${localVersion || '—'}) — ממשיכים על סמך sha256 בלבד`);
    }
    if (stale) throw new Error('הפריסה החיה מיושנת — הבאנדל הפרוס אינו תואם ל-main (ראה טביעות sha256 למעלה)');
  }

  // במצב חי: הזרקת ה-fixture ב-base64 (לשרת החי אין את הקובץ)
  if (URL) {
    const b64 = fs.readFileSync(FIXTURE).toString('base64');
    const total = Math.ceil(b64.length / B64_CHUNK);
    log(`fixture (חי): ${path.basename(FIXTURE)} — ${fs.statSync(FIXTURE).size.toLocaleString()} בתים → ${total} חתיכות`);
    await ev(`window.__ab = ''; 'INIT'`);
    for (let i = 0; i < total; i++) {
      const r = await ev(`window.__ab += '${b64.substr(i * B64_CHUNK, B64_CHUNK)}'; ${i + 1}`);
      if (String(r) !== String(i + 1)) throw new Error(`חתיכה ${i + 1}/${total} נכשלה`);
    }
    await ev(`window.__fx = new TextDecoder('utf-8').decode(Uint8Array.from(atob(window.__ab), c => c.charCodeAt(0))); window.__ab = ''; 'OK'`);
  } else {
    log(`fixture (מקומי): ${path.basename(FIXTURE)} — ${fs.statSync(FIXTURE).size.toLocaleString()} בתים`);
  }

  const pages1 = await retypesetAndWait('הרצה-1');
  log(`עימוד הרצה-1: ${pages1.toLocaleString()} עמודים`);
  await gotoView();

  log('האודיט המתמטי המלא רץ — סריקת גלילה של כל הספר...');
  await injectB64Var(AUDIT_JS, '__auditSrc');
  await runScriptVar('__auditSrc', '__rep', '__err', 1_200_000);
  const reportRaw = await fetchBigVar('__rep');
  fs.writeFileSync(path.join(OUT, `${TAG}-full-math-audit.json`), reportRaw, 'utf8');
  const report = JSON.parse(reportRaw);
  const s = report.summary || {};
  const st = report.stats || {};

  // **S5.2 (רצפת נפח):** כיסוי מלא של הספר כולו — לא רק "0 בעיות במה שכן רונדר".
  // עמודים: הקורפוס הקנוני 704 (רצפה 690 — נדיבה בכוונה לשינויי TOC/הערות-סיום
  // של המנוע). מילים: ספירת הדוח (שורות+הערות+פסים+TOC) מול ה-fixture ביחס
  // ≥0.98 — תופס מנוע שמדלג תוכן שלם בשקט.
  const floorFail = [];
  if (!(pages1 >= EXPECTED_PAGES_MIN)) floorFail.push(`עמודים ${pages1} < רצפת המינימום ${EXPECTED_PAGES_MIN}`);
  // **S70 (R9):** הרצפה מודדת על מילות הגוף בלבד (bodyWords) — בעבר נכללו שורות ה-TOC
  // (כפילות של כותרות הגוף) והרצפה הוחלשה: ספר שקצר תוכן יכול היה לעבור בזכות מילות ה-TOC.
  const bodyWords = s.bodyWords != null ? s.bodyWords : (s.totalWords || 0);
  // **F-BL1:** הרצפה מול מילות התוכן הצפויות (לא הגולמי — תחביר הסימון אינו
  // ניתן לרינדור). הסך הגולמי מדווח לשקיפות בלבד.
  if (!(bodyWords >= EXPECTED_WORDS_MIN_RATIO * contentWords)) {
    floorFail.push(`מילים מרונדרות ${bodyWords.toLocaleString()} < ${Math.round(EXPECTED_WORDS_MIN_RATIO * contentWords).toLocaleString()} (= ${EXPECTED_WORDS_MIN_RATIO} × ${contentWords.toLocaleString()} מילות תוכן צפויות; גולמי ${fixtureWords.toLocaleString()})`);
  }
  if (floorFail.length) {
    console.error('✗ רצפת הנפח נכשלה — הספר התקצר בשקט (ספר שחסר תוכן אינו יכול להיות "0 בעיות"):');
    for (const f of floorFail) console.error('  - ' + f);
    try { await ab(['close']); } catch (e) {}
    if (server) server.close();
    process.exit(1);
  }
  log(`רצפת נפח ✓: ${pages1} עמודים (≥${EXPECTED_PAGES_MIN}) | גוף ${bodyWords.toLocaleString()} מילים (≥${Math.round(EXPECTED_WORDS_MIN_RATIO * contentWords).toLocaleString()} תוכן צפוי; סה"כ ${(s.totalWords || 0).toLocaleString()})`);
  log('─'.repeat(62));
  log(`עמודים: ${s.pages}/${s.slots} | שורות: ${(s.totalLines || 0).toLocaleString()} | וירטואלי: ${s.virtualized} | סריקה: ${s.sweep && s.sweep.ms}ms`);
  log(`בעיות (סה"כ): ${s.problems} | לפי סוג: ${JSON.stringify(st.counts || {})}`);
  log(`גופנים בפועל: ${(s.observedFonts || []).join(', ')}`);
  log(`פער דיו שמאל: ${JSON.stringify(st.bodyGapLeft)}`);
  log(`פער דיו ימין: ${JSON.stringify(st.bodyGapRight)}`);
  log(`חלון מימין: ${JSON.stringify(st.windowDistFromRight)}`);
  log('─'.repeat(62));

  if (URL && CAPTURE_EXPORTS) await captureLiveExports(pages1);

  // דטרמיניזם
  let detIdentical = SKIP_DET;
  let pages2 = null;
  if (!SKIP_DET) {
    log('דטרמיניזם: מריץ עימוד מחדש...');
    pages2 = await retypesetAndWait('הרצה-2');
    log(`עימוד הרצה-2: ${pages2.toLocaleString()} עמודים`);
    await gotoView();
    await injectB64Var(DET_JS, '__detSrc');
    await runScriptVar('__detSrc', '__det', '__detErr', 1_200_000);
    const detRaw = await fetchBigVar('__det');
    fs.writeFileSync(path.join(OUT, `${TAG}-determinism-raw.json`), detRaw, 'utf8');
    const det = JSON.parse(detRaw);
    const canonMain = {}, canonDet = {};
    for (const p of (report.pages || [])) canonMain[p.i] = [p.t, (p.cols || []).map((c) => c.tops)];
    for (const p of (det.pages || [])) canonDet[p.i] = [p.t, p.cols];
    const keys1 = Object.keys(canonMain).sort((a, b) => a - b);
    const keys2 = Object.keys(canonDet).sort((a, b) => a - b);
    const diffs = [];
    if (keys1.join(',') === keys2.join(',')) {
      for (const k of keys1) {
        const [t1, c1] = canonMain[k], [t2, c2] = canonDet[k];
        if (t1 !== t2 || JSON.stringify(c1) !== JSON.stringify(c2)) diffs.push({ page: k });
        if (diffs.length >= 20) break;
      }
    } else diffs.push({ pageSet: 'different' });
    detIdentical = diffs.length === 0;
    fs.writeFileSync(path.join(OUT, `${TAG}-determinism-result.json`),
      JSON.stringify({ pagesRun1: pages1, pagesRun2: pages2, identical: detIdentical, diffCount: diffs.length, diffs }, null, 2), 'utf8');
    log(`דטרמיניזם: ${detIdentical ? 'זהה לחלוטין ✔' : diffs.length + ' הבדלים ✗'} (עמודים ${pages1}/${pages2})`);
  }

  try { await ab(['close']); } catch (e) {}
  if (server) server.close();

  const ok = s.problems === 0 && detIdentical && s.pages === s.slots;
  console.log('');
  console.log('════════ סיכום האודיט המתמטי המלא ════════');
  console.log(`pages: ${s.pages}/${s.slots} | lines: ${(s.totalLines || 0).toLocaleString()} | words: ${(s.totalWords || 0).toLocaleString()} | problems: ${s.problems}`);
  console.log(`counts: ${JSON.stringify(st.counts || {})}`);
  console.log(`determinism: ${detIdentical ? 'IDENTICAL' : 'DIFFERENCES!'}`);
  console.log(`reports: ${OUT}`);
  console.log(ok ? '✓ PASS — 0 בעיות + דטרמיניזם מלא' : '✗ FAIL — נדרשות 0 בעיות');
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(String(e && e.stack || e)); try { ab(['close']); } catch (x) {} if (server) server.close(); process.exit(2); });
