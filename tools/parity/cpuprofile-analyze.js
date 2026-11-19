#!/usr/bin/env node
// tools/parity/cpuprofile-analyze.js — ניתוח .cpuprofile (V8) לפי self-time לפי פונקציה
// וקטגוריות אבחון ביצועי המנוע המאוחד (§4 בהוראת NEXT_PERFORMANCE_OPTIMIZATION_PROMPT_2026-11-19).
//
// סיווג לפי שם פונקציה + URL (פנימיות Node crypto שייכות לשרשרת sha256Hex;
// האנונימיים ב-measure-api:387 הם ה-callbackים של _canonicalStringify).
//
// שימוש: node tools/parity/cpuprofile-analyze.js <file.cpuprofile> [--top 25]
'use strict';

const fs = require('fs');

function classify(fn, url) {
  const u = url || '';
  // פנימיות sha256Hex: Node crypto + encoding (נקראים מ-join('~') המחרוזתי)
  if (u.includes('node:internal/crypto') || u.includes('node:internal/encoding')) return 'key-building';
  if (['Hash', 'update', 'digest', 'encode', 'encodeUtf8String', 'hmacProcess', 'sha256Hex'].includes(fn)
    && (u.includes('crypto') || u === '' || u.includes('hash256'))) return 'key-building';
  if (fn === '_itemCacheKey' || fn === '_canonicalStringify' || fn === 'environmentFingerprint' || fn === '_assetIdentityFp' || fn === '_fastKeyHash' || fn === '_canonicalStringifyStable') return 'key-building';
  // האנונימיים של measure-api (line 387 = ה-map callback של _canonicalStringify; גם יתר האנונימיים שם)
  if ((fn === '(anonymous)' || fn === '') && u.includes('measure-api')) return 'key-building';
  if (fn === '_itemCacheGet' || fn === '_itemCacheSet') return 'item-cache-ops';
  if (fn === '_deepFreeze') return 'deep-freeze';
  if (['measureTextWidth', '_charEm', 'glyphIdOf', 'advanceUnitsOf', 'kernUnitsOf', '_kernEm', '_isMappedMark', '_isZeroWidthControl', 'charWidthEm', 'missingGlyphFallbackEm', 'capHeightEmOf', 'ascentEmOf', 'descentEmOf', 'measureTextWidthProf'].includes(fn)) return 'string-measurement';
  if (fn === 'measureItem' || fn === 'measureItemProf' || fn === 'measuredVia' || fn === 'boxItemFor') return 'measureItem(self+item-build)';
  if (fn === '(garbage collector)' || fn === 'garbage collector') return 'GC';
  if (fn === 'norm' && u.includes('pipeline')) return 'content-preservation-check (norm)';
  if (fn === '(program)' || fn === '(idle)' || fn === '(root)') return 'program/idle';
  return 'other-engine (planner/line/PageModel/decorations/legacy)';
}

function analyze(file) {
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nodes = p.nodes;
  const totalUs = (p.timeDeltas || []).reduce((a, b) => a + b, 0) || null;
  const totalHits = nodes.reduce((a, n) => a + (n.hitCount || 0), 0);
  const totalMs = totalUs != null ? totalUs / 1000 : null;
  const byFn = new Map();
  const byCat = new Map();
  for (const n of nodes) {
    if (!n.hitCount) continue;
    const fn = n.callFrame.functionName || '(anonymous)';
    const url = n.callFrame.url || '';
    const cat = classify(fn, url);
    byFn.set(fn, (byFn.get(fn) || 0) + n.hitCount);
    byCat.set(cat, (byCat.get(cat) || 0) + n.hitCount);
  }
  const asMs = (hits) => totalMs != null ? (hits / totalHits) * totalMs : hits;
  const fmt = (h) => `${(100 * h / totalHits).toFixed(2).padStart(6)}%  ${asMs(h).toFixed(0).padStart(7)}ms`;
  console.log(`# ${file}`);
  console.log(`total sampled: ${totalMs != null ? totalMs.toFixed(0) + 'ms' : totalHits + ' hits'} · samples=${totalHits} · nodes=${nodes.length}`);
  console.log('\n== קטגוריות (self-time) ==');
  const catNames = ['key-building', 'item-cache-ops', 'deep-freeze', 'string-measurement', 'measureItem(self+item-build)', 'GC', 'content-preservation-check (norm)', 'program/idle', 'other-engine (planner/line/PageModel/decorations/legacy)'];
  for (const c of catNames) {
    const h = byCat.get(c) || 0;
    console.log(`${h ? fmt(h) : '  0.00%       0ms'}  ${c}`);
  }
  const argv = process.argv.slice(2);
  const topN = argv.includes('--top') ? parseInt(argv[argv.indexOf('--top') + 1], 10) : 25;
  console.log(`\n== top ${topN} פונקציות ב-self-time (שם | קטגוריה) ==`);
  const rows = [...byFn.entries()].map(([fn, h]) => ({ fn, h, cat: classify(fn, '') })).sort((a, b) => b.h - a.h);
  for (const row of rows.slice(0, topN)) console.log(`${fmt(row.h)}  ${row.fn}  [${row.cat}]`);
}

const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('usage: cpuprofile-analyze.js <file.cpuprofile> [--top N]'); process.exit(2); }
analyze(file);
