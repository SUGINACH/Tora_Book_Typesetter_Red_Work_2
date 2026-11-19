#!/usr/bin/env node
// tools/parity/benchmark.js — benchmark apples-to-apples legacy↔unified (סעיף ו בהוראת 19.11)
//
// אותו process/Node/host, אותם settings/fonts/assets, אותו source — שני המנועים
// בסדר מתחלף (legacy→unified→legacy→…), 2 warmups ואז מדידות תקינות.
// מדווח p50/p95/mean/min/max לכל צד + יחס unified/legacy + pages + parity-count.
//
// תנאי קבלה מקומי (הוראה ו.5): median unified ≤ median legacy בכל קורפוס.
// חריגה = FAIL — לא מגדילים סף כדי לקבל ירוק.
//
// שימוש:
//   node tools/parity/benchmark.js [corpus ...] [--runs N] [--warmups N] [--out file.json]
//   ברירת מחדל: no_long, mid_long, long, very_long (D-98: very_long הוא מקור ההכרעה)
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
// **תיקון הארנס (19.11, סשן הביצועים §3.1):** רישום דרך fontResolver — נקודת
// הכניסה היחידה של ה־Worker החי — כך שהמאוחד מודד בנתיב הייצור (font-metrics
// דרך forFontId) ולא בקירוב-טבלה עם מופע חדש לכל קריאה. ה-resolver מסונכרן
// גם ל-measure-api (אותם בתים) — המורשת לא נפגעת.
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));

function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(legacy, regKeys, { availableFonts: families });
  return imp.settings;
}

function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf']
  ];
  const hasher = crypto.createHash('sha256');
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) {
      const bytes = fs.readFileSync(fp);
      hasher.update(fam).update(file).update(bytes);
      const res = fontResolver.registerFont(fam, bytes, { source: 'benchmark' });
      if (!res.ok) console.error(`registerFont failed for ${fam}: ${res.code}`);
    }
  }
  return hasher.digest('hex');
}

function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf')
  };
}

function stats(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const n = s.length;
  const pick = (p) => s[Math.min(n - 1, Math.max(0, Math.round(p * (n - 1))))];
  const mean = s.reduce((a, b) => a + b, 0) / n;
  return { p50: pick(0.5), p95: pick(0.95), mean, min: s[0], max: s[n - 1], n };
}

function main() {
  const argv = process.argv.slice(2);
  let runs = 7, warmups = 2, outFile = null;
  const corpora = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--runs') runs = parseInt(argv[++i], 10) || 7;
    else if (argv[i] === '--warmups') warmups = parseInt(argv[++i], 10) || 2;
    else if (argv[i] === '--out') outFile = argv[++i];
    else corpora.push(argv[i]);
  }
  if (!corpora.length) corpora.push('no_long', 'mid_long', 'long', 'very_long');

  const fontsSha256 = registerLiveFonts();
  const base = liveSettings();
  const settings = { ...getDefaultSettings(), ...base, 'measure-impl': 'font-metrics' };
  const envExtras = typesetEnvExtras();

  const results = [];
  let allPass = true;

  for (const corpus of corpora) {
    const file = corpus === 'canonical' ? path.join(RB, 'tests/fixtures/canonical_corpus.txt') : path.join(AUD, `${corpus}_test_text.txt`);
    if (!fs.existsSync(file)) { console.error(`corpus not found: ${file}`); process.exit(2); }
    const text = fs.readFileSync(file, 'utf8');
    const inputSha256 = crypto.createHash('sha256').update(text).digest('hex');
    const inputBytes = Buffer.byteLength(text, 'utf8');

    const runOnce = (unified) => {
      const t0 = process.hrtime.bigint();
      const r = typeset(text, unified ? { ...settings, '_engine-force-unified': true } : settings, { noRecommendations: true, ...envExtras });
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      return { ms, pages: unified ? r.pageModel.pages.length : r.pages.length, profile: r.legacyProfile === true ? 'legacy' : 'unified' };
    };

    // warmups — מתחלפים גם הם (לא מטים אף צד לגבי JIT/cache)
    for (let w = 0; w < warmups; w++) { runOnce(w % 2 === 0); runOnce(w % 2 === 1); }

    // מדידות בסדר מתחלף: legacy,unified,legacy,unified…
    const leg = [], uni = [];
    let legPages = 0, uniPages = 0;
    for (let i = 0; i < runs; i++) {
      const a = runOnce(false); leg.push(a.ms); legPages = a.pages;
      const b = runOnce(true); uni.push(b.ms); uniPages = b.pages;
      if (a.profile !== 'legacy' || b.profile !== 'unified') { console.error('FATAL: engine profile mismatch during benchmark'); process.exit(2); }
    }
    const sl = stats(leg), su = stats(uni);
    const ratio = su.p50 / sl.p50;
    const pass = su.p50 <= sl.p50; // הוראה ו.5: median unified ≤ median legacy
    if (!pass) allPass = false;
    const mem = { heapUsedAfter: Math.round(process.memoryUsage().heapUsed / 1048576), maxRssMb: Math.round((process.resourceUsage ? process.resourceUsage().maxRSS : 0) / 1024) };
    results.push({ corpus, inputFile: path.relative(ROOT, file), inputBytes, inputSha256, runs, warmups, legacy: { ...sl, pages: legPages }, unified: { ...su, pages: uniPages }, ratioP50: Number(ratio.toFixed(3)), pageDeltaUnifiedMinusLegacy: uniPages - legPages, memoryMb: mem, pass });
    console.log(`${corpus.padEnd(10)} legacy p50=${sl.p50.toFixed(0)}ms p95=${sl.p95.toFixed(0)}ms (${legPages}p) · unified p50=${su.p50.toFixed(0)}ms p95=${su.p95.toFixed(0)}ms (${uniPages}p) · ratio=${ratio.toFixed(2)} ${pass ? '✓' : '✗ SLOWER'}`);
  }

  const report = {
    tool: 'tools/parity/benchmark.js',
    command: `node ${process.argv.slice(1).join(' ')}`,
    node: process.version,
    commit: (() => { try { return require('child_process').execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })(),
    settingsSha256: crypto.createHash('sha256').update(JSON.stringify(settings)).digest('hex'),
    fontsSha256,
    acceptance: 'median unified ≤ median legacy בכל קורפוס (הוראת 19.11 סעיף ו.5)',
    note: 'typeset בלבד (מנוע); PageModel בתוך ה-typeset של המאוחד; אין דפדפן/PDF/נכסים במדידה. סדר מתחלף legacy→unified בwarmups ובמדידות.',
    results, allPass, generatedAt: new Date().toISOString()
  };
  if (outFile) { fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(report, null, 1)); }
  console.log(`BENCHMARK RESULT: ${allPass ? 'PASS' : 'FAIL'} (unified אינו רשאי להיות איטי מהמורשת בחציון)`);
  process.exit(allPass ? 0 : 1);
}

main();
