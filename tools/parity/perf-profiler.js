#!/usr/bin/env node
// tools/parity/perf-profiler.js — פרופיילר ביצועים חוזר למנוע המאוחד
// (§3.2–3.5 בהוראת audits/NEXT_PERFORMANCE_OPTIMIZATION_PROMPT_2026-11-19.md)
//
// מה הוא מודד — בהפרדה מפורשת בין שני מטמונים שונים:
//  1. מטמון MeasuredItem הגלובלי: _itemMeasureCache / _itemCacheGet / _itemCacheSet
//     (itemCacheStats: entries/capacity; כאן גם calls/hits/misses/evictions בעטיפה
//     חיצונית — זיהוי hit לפי זהות אובייקט: cache-hit מחזיר את אותה המופע הקפואה).
//  2. מטמון מחרוזות המדידה של MeasureAPI: this.cache + this.stats.calls/hits
//     (צבירה על כל המופעים דרך עטיפת ה-prototype).
//
// אינסטרומנטציה בלי שינוי קוד מנוע: העטיפות מותקנות לפני טעינת ה-pipeline
// (line-items.js עושה destructuring בזמן ייבוא — סדר הטעינה קריטי ומתועד כאן).
//
// תרחישים:
//   passes <corpus...> — לכל קורפוס: P1 קר (מטמון פריטים מנוקה), P2/P3 חם (שמור),
//                        P4 מנוקה שוב. זמנים + סטטיסטיקות שני המטמונים + GC + זיכרון.
//   multi              — canonical→no_long→very_long ברצף באותו process (מטמון שמור),
//                        ואז canonical שוב — השפעת evictions חוצי-קורפוסים (השערת LRU).
//   keys <corpus>      — P1+P2 עם חישוב מפתח משוחזר (אותה נוסחה) + דגימת רכיבים:
//                        יציבות מפתחות בין ריצות זהות, שדות משתנים, התנגשויות.
//   exports <corpus>   — הפרדת זמנים (§3.2): typeset (כולל PageModel) מול הקרנת DOM
//                        לעמוד, ייצוא HTML, ייצוא PDF.
//
// שימוש:
//   node --max-old-space-size=2800 tools/parity/perf-profiler.js passes canonical no_long very_long --out <file>
//   node tools/parity/perf-profiler.js keys canonical --out <file>
//   node tools/parity/perf-profiler.js multi --out <file>
//   node tools/parity/perf-profiler.js exports canonical --out <file>
//   (אופציונלי: --expose-gc לייצוב מדידות זיכרון בין פאסים; --small למסמך קטן סינתטי)
'use strict';

const fs = require('fs');
const path = require('path');
const { PerformanceObserver } = require('perf_hooks');

const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

// ---- חובה: measure-api נטען ומוטלא ראשון, לפני כל דרישה של ה-pipeline ----
const ma = require(path.join(RB, 'src/engine/typography/measure-api'));
const { MeasureAPI } = ma;
const { sha256Hex } = require(path.join(RB, 'src/engine/assets/hash256'));
// **תיקון הארנס (19.11, סשן הביצועים §3.1):** רישום דרך fontResolver (כמו ה־Worker
// החי) — אחרת ה-resolver ריק, המאוחד מודד בקירוב-טבלה עם מופע חדש לכל קריאה,
// והמדידה אינה מייצגת את נתיב הייצור.
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));

// ============================ עטיפות מדידה ============================
const prof = {
  item: {
    calls: 0, hits: 0, freshOk: 0, rejections: 0,
    hitsIntra: 0, hitsInter: 0, // hit שמקורו באותו פאס / בפאס קודם
    wallMs: 0,
    keysMode: false, keyComputeMs: 0, keyCount: 0,
    myKeys: null,            // Map key→itemId (keysMode)
    components: null,        // Map itemId→components (keysMode, מדגם)
    imageKindCalls: 0,
  },
  str: { calls: 0, hits: 0, wallMs: 0, freshInstances: 0 },
  passIndex: -1,
};

const _objPass = new WeakMap(); // אובייקט תוצאה → פאס שבו נוצר
const _seen = new WeakSet();
const _origMeasureItem = ma.measureItem;

function myItemKey(item, style, ctx) {
  // שחזור נאמן של _itemCacheKey (אותה נוסחה, אותן פונקציות מיוצאות).
  // _assetIdentityFp: '' לכל פריט שאינו תמונה (קורפוסי הטקסט; תמונות נספרות בנפרד).
  const it = item || {};
  return 'ik2:' + sha256Hex([
    'item-key-v2',
    ma.MEASURE_ENGINE_VERSION,
    ma.environmentFingerprint(),
    (ctx && ctx.environmentFingerprint) || '',
    it.kind || '',
    it.id != null ? String(it.id) : '',
    ma.canonicalStringify(it.payload !== undefined ? it.payload : it),
    ma.canonicalStringify(it.constraints || null),
    ma.canonicalStringify(style || null),
    (ctx && ctx.direction) || '',
    (ctx && ctx.language) || '',
    ma.canonicalStringify((ctx && ctx.constraints) || null),
    (ctx && ctx.constraintsKey) || '',
    (ctx && ctx.assetId) != null ? String(ctx.assetId) : '',
    (item && item.kind === 'image' && ctx && ctx.assetResolver) ? '<image-fp>' : '',
  ].join('~'));
}

ma.measureItem = function measureItemProf(item, style, ctx) {
  const t0 = process.hrtime.bigint();
  const r = _origMeasureItem(item, style, ctx);
  const t1 = process.hrtime.bigint();
  const st = prof.item;
  st.calls++;
  st.wallMs += Number(t1 - t0) / 1e6;
  if (item && item.kind === 'image') st.imageKindCalls++;
  if (r && r.ok) {
    if (_seen.has(r)) {
      st.hits++;
      if (_objPass.get(r) === prof.passIndex) st.hitsIntra++; else st.hitsInter++;
    } else {
      _seen.add(r);
      _objPass.set(r, prof.passIndex);
      st.freshOk++;
    }
  } else {
    st.rejections++;
  }
  if (st.keysMode) {
    const tk0 = process.hrtime.bigint();
    const k = myItemKey(item, style, ctx);
    const tk1 = process.hrtime.bigint();
    st.keyComputeMs += Number(tk1 - tk0) / 1e6;
    st.keyCount++;
    if (st.myKeys) {
      const iid = String((item && item.id) != null ? item.id : '-');
      const prev = st.myKeys.get(k);
      if (prev !== undefined && prev !== iid) st.keyCollisions = (st.keyCollisions || 0) + 1;
      st.myKeys.set(k, iid);
      if (st.components && st.components.size < 2000 && item && item.kind === 'text') {
        st.components.set(iid, {
          kind: item.kind,
          id: iid,
          payload: ma.canonicalStringify(item.payload !== undefined ? item.payload : item),
          constraints: ma.canonicalStringify(item.constraints || null),
          style: ma.canonicalStringify(style || null),
          ctxConstraints: ma.canonicalStringify((ctx && ctx.constraints) || null),
          ctxKey: (ctx && ctx.constraintsKey) || '',
          dir: (ctx && ctx.direction) || '', lang: (ctx && ctx.language) || '',
        });
      }
    }
  }
  return r;
};

const _origMtw = MeasureAPI.prototype.measureTextWidth;
// מטמון המחרוזות — מונים גלובליים בלבד + WeakMap לזיהוי מופעים חדשים.
// אין החזקה חזקה של מופעים (מצב קודם החזיק Set חזק של ~660 אלף מופעים
// חד-פעמיים ב-very_long עם המטמונים שלהם — דלף של האינסטרומנטציה עצמה,
// שהתגלה כ-OOM). מצא נוסף שתועד: measureItem יוצר מופע MeasureAPI חדש
// לכל קריאה לפריט שאינו טקסט (noteMarker/atomic/glue/penalty/fallback) —
// מטמון המחרוזות של מופע כזה מת עם הקריאה (single-use).
const _strSeenInst = new WeakMap();
MeasureAPI.prototype.measureTextWidth = function measureTextWidthProf(...args) {
  const s = this.stats;
  const c0 = s.calls, h0 = s.hits;
  if (!_strSeenInst.has(this)) { _strSeenInst.set(this, 1); prof.str.freshInstances++; }
  const t0 = process.hrtime.bigint();
  const r = _origMtw.apply(this, args);
  const t1 = process.hrtime.bigint();
  prof.str.calls += s.calls - c0;
  prof.str.hits += s.hits - h0;
  prof.str.wallMs += Number(t1 - t0) / 1e6;
  return r;
};

// רק עכשיו — אחרי העטיפות — נטענים ה-pipeline והצרכנים:
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));

// ============================ GC observer ============================
let gcCount = 0, gcMs = 0;
const gcObs = new PerformanceObserver((list) => {
  for (const e of list.getEntries()) { gcCount++; gcMs += e.duration; }
});
gcObs.observe({ entryTypes: ['gc'] });

// ============================ סביבה זהה ל-benchmark ============================
function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
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
    if (fs.existsSync(fp)) {
      const bytes = fs.readFileSync(fp);
      const res = fontResolver.registerFont(fam, bytes, { source: 'perf-profiler' });
      if (!res.ok) console.error(`registerFont failed for ${fam}: ${res.code}`);
    }
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

const SMALL_DOC = [
  'כותרת 1 - חלק',
  'פסקת גוף ראשונה עם הערה [הערה ראשונה למסמך הקטן] בתוכה.',
  'כותרת 2 - פרק',
  ...Array.from({ length: 6 }, (_, i) => `פסקה ${i + 1} עם טקסט ממשי למילוי טורים בעמודים אחדים. ${'מילים למילוי הטור ולבדיקה '.repeat(4)}`),
].join('\n');

function corpusText(name) {
  if (name === 'small') return SMALL_DOC;
  const file = name === 'canonical' ? path.join(RB, 'tests/fixtures/canonical_corpus.txt') : path.join(AUD, `${name}_test_text.txt`);
  if (!fs.existsSync(file)) { console.error(`corpus not found: ${file}`); process.exit(2); }
  return fs.readFileSync(file, 'utf8');
}

// ============================ סטטיסטיקות ============================
function itemCacheSnapshot() {
  const s = ma.itemCacheStats();
  return { entries: s.entries, capacity: s.capacity };
}
/** מטמון המחרוזות — דלתא פר-פאס מהמונים הגלובליים (מדויק: נקרא לפני/אחרי כל קריאה). */
function stringCacheDelta() {
  const calls = prof.str.calls, hits = prof.str.hits;
  return {
    calls, hits, misses: calls - hits,
    hitRate: calls ? +(hits / calls).toFixed(4) : 0,
    freshInstancesThisPass: prof.str.freshInstances,
    note: 'freshInstances = מופעי MeasureAPI שנוצרו בפאס זה (חד-פעמיים מעצם המבנה לפריטים שאינם טקסט); המטמון שלהם אינו שורד את הקריאה.',
  };
}
function resetPassStats() {
  prof.item.calls = 0; prof.item.hits = 0; prof.item.freshOk = 0; prof.item.rejections = 0;
  prof.item.hitsIntra = 0; prof.item.hitsInter = 0; prof.item.wallMs = 0;
  prof.item.keyComputeMs = 0; prof.item.keyCount = 0; prof.item.keyCollisions = 0;
  prof.str.calls = 0; prof.str.hits = 0; prof.str.wallMs = 0; prof.str.freshInstances = 0;
  gcCount = 0; gcMs = 0;
}
function runTypeset(text, settings, envExtras) {
  const t0 = process.hrtime.bigint();
  const r = typeset(text, { ...settings, '_engine-force-unified': true }, { noRecommendations: true, ...envExtras });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { r, ms };
}
function passRecord(label, corpus, { r, ms }, entriesBefore, entriesAfter) {
  const st = prof.item;
  const insertions = st.freshOk; // רק תוצאות ok נכנסות למטמון הפריטים
  const evictions = Math.max(0, entriesBefore.entries + insertions - entriesAfter.entries);
  return {
    label, corpus,
    wallMs: +ms.toFixed(1),
    pages: r.pageModel ? r.pageModel.pages.length : r.pages.length,
    layoutHash: (r.layoutHash || '').slice(0, 16),
    itemCache: {
      calls: st.calls, hits: st.hits, misses: st.calls - st.hits,
      hitRate: st.calls ? +(st.hits / st.calls).toFixed(4) : 0,
      hitsIntraPass: st.hitsIntra, hitsInterPass: st.hitsInter,
      freshOk: st.freshOk, rejections: st.rejections,
      insertions, evictions, entriesBefore: entriesBefore.entries, entriesAfter: entriesAfter.entries,
      capacity: entriesAfter.capacity,
      measureItemWallMs: +st.wallMs.toFixed(1),
      measureItemWallPctOfTypeset: ms ? +(100 * st.wallMs / ms).toFixed(1) : 0,
      imageKindCalls: st.imageKindCalls,
    },
    stringCache: stringCacheDelta(),
    stringMeasureWallMs: +prof.str.wallMs.toFixed(1),
    gc: { count: gcCount, totalMs: +gcMs.toFixed(1), pctOfTypeset: ms ? +(100 * gcMs / ms).toFixed(1) : 0 },
    memoryMb: {
      heapUsedAfter: Math.round(process.memoryUsage().heapUsed / 1048576),
      maxRss: Math.round((process.resourceUsage ? process.resourceUsage().maxRSS : 0) / 1024),
    },
    keys: st.keysMode ? {
      computed: st.keyCount, computeMs: +st.keyComputeMs.toFixed(1),
      uniqueKeys: st.myKeys ? st.myKeys.size : null,
      collisions: st.keyCollisions || 0,
    } : null,
  };
}

// ============================ main ============================
async function main() {
  const argv = process.argv.slice(2);
  let scenario = argv.shift();
  let outFile = null;
  const corpora = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') outFile = argv[++i];
    else corpora.push(argv[i]);
  }
  if (!scenario || !['passes', 'multi', 'keys', 'exports', 'single'].includes(scenario)) {
    console.error('usage: perf-profiler.js <passes|multi|keys|exports> [corpus ...] [--out file]');
    process.exit(2);
  }

  registerLiveFonts();
  const settings = { ...getDefaultSettings(), ...liveSettings(), 'measure-impl': 'font-metrics' };
  const envExtras = typesetEnvExtras();
  const commit = (() => { try { return require('child_process').execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })();
  const report = {
    tool: 'tools/parity/perf-profiler.js', scenario, command: `node ${process.argv.slice(1).join(' ')}`,
    node: process.version, commit, generatedAt: new Date().toISOString(),
    note: 'עטיפות חיצוניות בלבד (measureItem + MeasureAPI.prototype.measureTextWidth) — אפס שינוי קוד מנוע. hit במטמון הפריטים מזוהה לפי זהות אובייקט (cache-hit מחזיר את אותה מופע קפואה).',
    passes: [],
  };
  const gc = global.gc ? global.gc : null;

  const drainTicks = async () => { for (let i = 0; i < 3; i++) await new Promise((r) => setImmediate(r)); };
  const doPass = async (label, corpus, text, { clear = false, keys = false } = {}) => {
    if (gc) try { gc(); } catch (_) {}
    await drainTicks(); // קליטת רשומות GC שנותרו מהפאס הקודם לפני איפוס המונים
    resetPassStats();
    prof.item.keysMode = keys;
    if (keys) { prof.item.myKeys = new Map(); prof.item.components = new Map(); }
    const eb = itemCacheSnapshot();
    if (clear) ma.clearItemMeasureCache();
    prof.passIndex++;
    const run = runTypeset(text, settings, envExtras);
    await drainTicks(); // ה-observer של GC מוסר אסינכרונית — ניקוז לפני קריאת המונים
    const ea = itemCacheSnapshot();
    const rec = passRecord(label, corpus, run, clear ? { entries: 0, capacity: eb.capacity } : eb, ea);
    report.passes.push(rec);
    console.log(`${label.padEnd(22)} ${corpus.padEnd(10)} ${rec.wallMs}ms ${rec.pages}p · item[calls=${rec.itemCache.calls} hits=${rec.itemCache.hits} (${(rec.itemCache.hitRate * 100).toFixed(1)}%) evict=${rec.itemCache.evictions} entries=${rec.itemCache.entriesAfter}] · str[calls=${rec.stringCache.calls} hits=${rec.stringCache.hits} (${(rec.stringCache.hitRate * 100).toFixed(1)}%) freshInst=${rec.stringCache.freshInstancesThisPass}] · measureItem=${rec.itemCache.measureItemWallMs}ms (${rec.itemCache.measureItemWallPctOfTypeset}%) · gc=${rec.gc.count}/${rec.gc.totalMs}ms`);
    return { run, rec };
  };

  if (scenario === 'single') {
    // ריצת unified בודדת אחת (קרה) — לשימוש עם --cpu-prof לייחוס נקי לריצת המנוע.
    const c = corpora[0] || 'very_long';
    await doPass('S-single-cold', c, corpusText(c), { clear: true });
  } else if (scenario === 'passes') {
    const list = corpora.length ? corpora : ['small', 'canonical', 'no_long', 'very_long'];
    for (const c of list) {
      const text = corpusText(c);
      await doPass('P1-cold', c, text, { clear: true });
      await doPass('P2-warm', c, text, {});
      await doPass('P3-warm', c, text, {});
      await doPass('P4-cleared', c, text, { clear: true });
    }
  } else if (scenario === 'multi') {
    const seq = ['canonical', 'no_long', 'very_long'];
    const texts = {};
    // רק הקורפוס הראשון מתחיל ממטמון נקי; הבאים רצים עם המטמון שהותיר קודמו —
    // זה מה שבאמת מודד השפעת evictions חוצי-קורפוסים (השערת LRU, §3.4).
    seq.forEach((c, i) => { texts[c] = corpusText(c); });
    await doPass('M1-first', seq[0], texts[seq[0]], { clear: true });
    for (let i = 1; i < seq.length; i++) await doPass('M1-first', seq[i], texts[seq[i]], {});
    // עכשיו המטמון מלא בערכי very_long — canonical שוב: כמה שרד?
    await doPass('M2-after-big', 'canonical', texts.canonical, {});
    await doPass('M3-again', 'very_long', texts.very_long, {});
  } else if (scenario === 'keys') {
    const list = corpora.length ? corpora : ['canonical'];
    for (const c of list) {
      const text = corpusText(c);
      const p1 = await doPass('K1-cold+keys', c, text, { clear: true, keys: true });
      const keys1 = prof.item.myKeys; const comps1 = prof.item.components;
      const p2 = await doPass('K2-warm+keys', c, text, { keys: true });
      const keys2 = prof.item.myKeys; const comps2 = prof.item.components;
      // יציבות: אותה קבוצת מפתחות? אותו מיפוי key→itemId?
      let same = 0, diff = 0, only1 = 0, only2 = 0;
      for (const [k, id] of keys1) {
        if (!keys2.has(k)) { only1++; continue; }
        if (keys2.get(k) === id) same++; else diff++;
      }
      for (const k of keys2.keys()) if (!keys1.has(k)) only2++;
      // רכיבים — אילו שדות השתנו בין הריצות (מדגם עד 2000 פריטי טקסט):
      const compDiff = { payload: 0, constraints: 0, style: 0, ctxConstraints: 0, ctxKey: 0, dir: 0, lang: 0, id: 0, kind: 0, missing: 0 };
      for (const [iid, c1] of comps1) {
        const c2 = comps2.get(iid);
        if (!c2) { compDiff.missing++; continue; }
        for (const f of ['payload', 'constraints', 'style', 'ctxConstraints', 'ctxKey', 'dir', 'lang', 'id', 'kind']) if (c1[f] !== c2[f]) compDiff[f]++;
      }
      report.keysAnalysis = report.keysAnalysis || {};
      report.keysAnalysis[c] = {
        pass1UniqueKeys: keys1.size, pass2UniqueKeys: keys2.size,
        sameKeySameId: same, sameKeyDiffId: diff, onlyInPass1: only1, onlyInPass2: only2,
        sampledComponents: comps1.size, componentDiffsBetweenPasses: compDiff,
        pass2HitRate: p2.rec.itemCache.hitRate,
      };
      console.log(`keys[${c}]: unique P1=${keys1.size} P2=${keys2.size} · same=${same} diff=${diff} only1=${only1} only2=${only2} · P2 hit-rate=${(p2.rec.itemCache.hitRate * 100).toFixed(1)}% · compDiff=${JSON.stringify(compDiff)}`);
    }
  } else if (scenario === 'exports') {
    const list = corpora.length ? corpora : ['canonical'];
    const { renderModelPage } = require(path.join(RB, 'src/engine/output/pagemodel-dom-renderer'));
    const { exportHtmlFromModel, exportPdfFromModel } = require(path.join(RB, 'src/engine/output/export-api'));
    for (const c of list) {
      const text = corpusText(c);
      await doPass('E-typeset', c, text, { clear: true });
      const r = report.passes[report.passes.length - 1];
      // re-typeset to hold model (same conditions) then measure projections:
      const { r: result } = runTypeset(text, settings, envExtras);
      const model = result.pageModel;
      // DOM shim (דפוס s8e):
      const doc = makeDoc();
      const t1 = process.hrtime.bigint();
      for (const mp of model.pages) renderModelPage(mp, settings, doc, {});
      const domMs = Number(process.hrtime.bigint() - t1) / 1e6;
      const t2 = process.hrtime.bigint();
      const html = exportHtmlFromModel(model, settings, makeDoc(), { title: 'prof' });
      const htmlMs = Number(process.hrtime.bigint() - t2) / 1e6;
      let pdfMs = null, pdfBytes = null, pdfOk = null;
      try {
        const CATALOG = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/imud-fonts.json'), 'utf8'));
        const e = CATALOG.find(x => x.family === 'Frank Ruhl Libre');
        const fontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts', e.file));
        const t3 = process.hrtime.bigint();
        const res = exportPdfFromModel(model, settings, fontBytes, 'Frank Ruhl Libre');
        pdfMs = Number(process.hrtime.bigint() - t3) / 1e6;
        pdfOk = res.ok; pdfBytes = res.bytes ? res.bytes.length : 0;
      } catch (err) { pdfOk = `error: ${err.message}`; }
      r.exports = {
        typesetMs: r.wallMs, domProjectionAllPagesMs: +domMs.toFixed(1),
        htmlExportMs: +htmlMs.toFixed(1), htmlBytes: Buffer.byteLength(html),
        pdfExportMs: pdfMs != null ? +pdfMs.toFixed(1) : null, pdfOk, pdfBytes,
        note: 'typeset כולל בניית PageModel (בתוך הקריאה); הקרנת DOM/HTML/PDF נמדדו בנפרד אחריו.',
      };
      console.log(`exports[${c}]: typeset=${r.wallMs}ms dom=${domMs.toFixed(0)}ms html=${htmlMs.toFixed(0)}ms pdf=${pdfMs != null ? pdfMs.toFixed(0) : '-'}ms`);
    }
  }

  if (outFile) { fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(report, null, 1)); }
  console.log(`PROFILER DONE — passes: ${report.passes.length}${outFile ? ' → ' + outFile : ''}`);
}

// ---------- DOM shim מינימלי (דפוס s8e) ----------
function makeDoc() {
  class ClassList {
    constructor(el) { this.el = el; this.set = new Set(); }
    _sync() { this.el._class = [...this.set].join(' '); }
    add(...ns) { ns.forEach(n => this.set.add(n)); this._sync(); }
    remove(...ns) { ns.forEach(n => this.set.delete(n)); this._sync(); }
    contains(n) { return this.set.has(n); }
  }
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this._text = '';
      this.classList = new ClassList(this);
    }
    set className(v) { this._class = String(v); this.classList.set = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { if (this.children.length) return this.children.map(c => c.textContent).join(''); return this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    scrollIntoView() {}
    focus() {}
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

main().catch((err) => { console.error(err); process.exit(1); });
