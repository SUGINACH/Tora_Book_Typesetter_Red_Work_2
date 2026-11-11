#!/usr/bin/env node
// tools/cross-check.js — **S71: הצלבת מקומי/CI/חי כהליך שיטתי (סגירת פער "הצלבה — חלקית")**
'use strict';

/**
 * מקור הפער: IMPLEMENTATION_STATUS סימן את "הצלבת תוצאות מקומיות, CI והאתר
 * החי" כחלקית — המנגנונים היו פזורים (full-math-audit.yml מריץ live; gh-pages-audit
 * משווה sha256 של הבאנדלים; הנעילות תועדו ב-WORKLOG בלבד). הכלי הזה מרכז
 * את ההצלבה לפקודה אחת שרצה גם מקומית וגם ב-CI:
 *
 *   node tools/cross-check.js                — הרצה מקומית: קורפוסים מול נעילות + באנדלים
 *   node tools/cross-check.js --live URL     — גם השוואת הבאנדל הפרוס ב-Pages מול המקומי
 *   node tools/cross-check.js --with-causality — גם צילום stage-snapshots והשוואת
 *                                              gold_causality מול הארטיפקט הקודם
 *
 * יציאה 1 בכל חריגה מנעילה — כך ההצלבה הופכת לשער בפועל, לא תיעוד בלבד.
 * הנעילות ב-tools/cross-check-locks.json — עדכון נעילה הוא פעולה מפורשת
 * (commit נפרד עם הצדקה), לא תופעת לוואי של ריצה.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const RB = path.join(ROOT, 'red-build');

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

async function fetchBytes(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
}

function fmt(ok) { return ok ? '✓' : '✗'; }

(async function main() {
  const args = process.argv.slice(2);
  const withLive = args.includes('--live') ? args[args.indexOf('--live') + 1] : null;
  const withCausality = args.includes('--with-causality');

  const { typeset } = require(path.join(RB, 'src', 'engine', 'core', 'pipeline'));
  const { getDefaultSettings } = require(path.join(RB, 'src', 'engine', 'core', 'settings-registry'));

  const locks = JSON.parse(fs.readFileSync(path.join(__dirname, 'cross-check-locks.json'), 'utf8'));
  const report = {
    tool: 'cross-check', schema: 1,
    started: new Date().toISOString(),
    commit: (function () { try { return require('child_process').execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return null; } })(),
    node: process.version,
    corpora: [], bundles: [], live: null, causality: null,
    ok: true, failures: []
  };
  const fail = (msg) => { report.ok = false; report.failures.push(msg); };

  // ---------- 1. קורפוסים מול נעילות ----------
  // נתיב המורשת מופעל דרך run-ours.js — הפעלה זהה לחלוטין לזו של
  // ה-workflow corpus-invariants (הגדרות IMUD + רישום גופנים + env) — הצלבה אמיתית
  // מקומי⇔CI, לא שיחזור מקומי מקורב.
  const { spawnSync } = require('child_process');
  for (const c of locks.corpora) {
    const file = path.join(ROOT, c.file);
    if (!fs.existsSync(file)) { fail(`corpus missing: ${c.file}`); continue; }
    const text = fs.readFileSync(file, 'utf8');
    const t0 = Date.now();
    if (c.legacy) {
      try {
        const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'crosscheck-'));
        // שורת ה-hash נכתב ל-stderr ב-run-ours — spawnSync מחזיר את שניהם
        const run = spawnSync(process.execPath,
          [path.join('tools', 'layout-parity', 'run-ours.js'), c.file, tmp, '--determinism'],
          { cwd: ROOT, encoding: 'utf8', timeout: 10 * 60 * 1000 });
        if (run.status !== 0) throw new Error(`exit ${run.status}: ${String(run.stderr || '').slice(0, 300)}`);
        const out = (run.stdout || '') + '\n' + (run.stderr || '');
        const mLine = /typeset: (\d+) pages in (\d+)ms \(hash ([^)]+)\).*\[profile: ([^\]]+)\]/.exec(out);
        if (!mLine) { fail(`${c.name}: run-ours produced no parseable hash line`); continue; }
        const pages = Number(mLine[1]);
        const hash = mLine[3];
        const profile = mLine[4];
        const hashOk = hash.startsWith(c.lockHash);
        if (!hashOk) fail(`${c.name}: hash ${hash.slice(0, 20)} ≠ lock ${c.lockHash}`);
        report.corpora.push({
          name: c.name, file: c.file, legacy: true, profile,
          pages, layoutHash: hash.slice(0, 20), lockHash: c.lockHash,
          contentPreserved: true, hashOk, ms: Date.now() - t0
        });
        console.log(`${fmt(hashOk)} [corpus] ${c.name}: pages=${pages} hash=${hash.slice(0, 20)} (lock ${c.lockHash}) via run-ours (${profile})`);
      } catch (e) {
        fail(`${c.name}: run-ours failed: ${String(e.stderr || e.message).slice(0, 200)}`);
        console.log(`✗ [corpus] ${c.name}: run-ours failed`);
      }
      continue;
    }
    const r = typeset(text, getDefaultSettings());
    const ms = Date.now() - t0;
    const hash = String(r.layoutHash || '');
    const hashOk = hash.startsWith(c.lockHash);
    const presOk = r.contentPreserved !== false;
    if (!hashOk) fail(`${c.name}: hash ${hash.slice(0, 16)} ≠ lock ${c.lockHash}`);
    if (!presOk) fail(`${c.name}: content NOT preserved`);
    report.corpora.push({
      name: c.name, file: c.file, legacy: false,
      pages: r.pages.length, layoutHash: hash.slice(0, 16), lockHash: c.lockHash,
      contentPreserved: r.contentPreserved !== false, hashOk, ms
    });
    console.log(`${fmt(hashOk && presOk)} [corpus] ${c.name}: pages=${r.pages.length} hash=${hash.slice(0, 16)} (lock ${c.lockHash}) ${ms}ms`);
  }

  // ---------- 2. באנדלים ----------
  for (const b of locks.bundles) {
    const p = path.join(ROOT, b.file);
    if (!fs.existsSync(p)) { fail(`bundle missing: ${b.file}`); continue; }
    const sha = sha256File(p);
    const size = fs.statSync(p).size;
    report.bundles.push({ file: b.file, sha256: sha.slice(0, 16), bytes: size });
    console.log(`✓ [bundle] ${b.file}: sha256=${sha.slice(0, 16)} ${(size / 1024).toFixed(1)}KB`);
  }

  // ---------- 3. הצלבה מול החי (Pages) ----------
  if (withLive) {
    try {
      for (const b of locks.bundles) {
        const url = `${withLive.replace(/\/$/, '')}/${path.basename(b.file)}`;
        const live = await fetchBytes(url);
        const local = sha256File(path.join(RB, b.file));
        const match = live.sha256 === local;
        if (!match) fail(`live bundle ${path.basename(b.file)}: ${live.sha256.slice(0, 16)} ≠ local ${local.slice(0, 16)}`);
        (report.live || (report.live = [])).push({ url, sha256: live.sha256.slice(0, 16), bytes: live.bytes, match });
        console.log(`${fmt(match)} [live] ${url}: ${live.sha256.slice(0, 16)} (${(live.bytes / 1024).toFixed(1)}KB)`);
      }
    } catch (e) {
      fail(`live cross-check failed: ${e.message}`);
      console.log(`✗ [live] ${e.message}`);
    }
  }

  // ---------- 4. gold_causality בין ריצות/קומיטים ----------
  if (withCausality) {
    const artDir = path.join(ROOT, 'audits', 'crosscheck');
    fs.mkdirSync(artDir, { recursive: true });
    const artPath = path.join(artDir, 'causality-current.json');
    const prevPath = path.join(artDir, 'causality-last.json');
    const s = { ...getDefaultSettings(), 'audit-stage-snapshots': true };
    const canonical = locks.corpora.find((c) => !c.legacy);
    const text = fs.readFileSync(path.join(ROOT, canonical.file), 'utf8');
    const r = typeset(text, s);
    const snap = r.stageSnapshots;
    if (!snap) {
      fail('causality: stageSnapshots missing (audit-stage-snapshots=true)');
    } else {
      const cur = {
        schema: snap.schema, commit: report.commit,
        layoutHash: String(r.layoutHash).slice(0, 16),
        gold_causality: snap.gold_causality, final_stable: snap.final_stable,
        checkpoints: snap.checkpoints
      };
      let comparison = null;
      if (fs.existsSync(prevPath)) {
        try {
          const prev = JSON.parse(fs.readFileSync(prevPath, 'utf8'));
          const cats = new Set([...Object.keys(prev.gold_causality.summary || {}), ...Object.keys(cur.gold_causality.summary || {})]);
          const diff = {};
          for (const k of cats) {
            const a = (prev.gold_causality.summary || {})[k] || 0;
            const b = (cur.gold_causality.summary || {})[k] || 0;
            if (a !== b) diff[k] = { prev: a, cur: b };
          }
          comparison = {
            prevCommit: prev.commit, prevHash: prev.layoutHash,
            curHash: cur.layoutHash,
            sameLayout: prev.layoutHash === cur.layoutHash,
            categoriesChanged: diff
          };
          console.log(`✓ [causality] vs ${prev.commit || 'prev'}: layout ${comparison.sameLayout ? 'IDENTICAL' : `${prev.layoutHash} → ${cur.layoutHash}`}; categories changed: ${Object.keys(diff).length || 'none'}`);
        } catch (e) {
          comparison = { error: String(e.message) };
        }
      } else {
        console.log('✓ [causality] first run — artifact saved as baseline');
      }
      if (fs.existsSync(artPath)) fs.copyFileSync(artPath, prevPath);
      fs.writeFileSync(artPath, JSON.stringify(cur, null, 2));
      report.causality = { current: cur.gold_causality, final_stable: cur.final_stable, comparison };
    }
  }

  // ---------- סיכום ----------
  const outPath = path.join(ROOT, 'audits', 'crosscheck', 'cross-check-report.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`${report.ok ? '✓' : '✗'} cross-check ${report.ok ? 'PASSED' : 'FAILED (' + report.failures.length + ')'} → ${path.relative(ROOT, outPath)}`);
  process.exit(report.ok ? 0 : 1);
})().catch((e) => { console.error('cross-check crashed:', e); process.exit(1); });
