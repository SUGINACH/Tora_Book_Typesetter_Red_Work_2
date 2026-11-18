#!/usr/bin/env node
// prove_capabilities.js — evidence script: runs the REAL engine modules
// (font-metrics.parseFont + font-subset.buildSubset) on representative font files,
// proving the capability matrix claims for: TTF(glyf), TTF-CFF(OTTO), WOFF2,
// variable TTF, and symbol TTF without unicode cmap.
'use strict';
const fs = require('fs');
const path = require('path');
const REPO = '/home/z/my-project/repo';
const FONT_DIR = path.join(REPO, 'red-build/ui/assets/imud/fonts');
const fm = require(path.join(REPO, 'red-build/src/engine/typography/font-metrics'));
const { buildSubset } = require(path.join(REPO, 'red-build/src/engine/typography/font-subset'));

const CASES = [
  ['TTF glyf static (Alpha-Regular.ttf)', 'Alpha-Regular.ttf'],
  ['TTF glyf default-design (Guttman-Rashi-Normal.ttf)', 'Guttman-Rashi-Normal.ttf'],
  ['TTF CFF/OTTO (Daniel-Regular.ttf)', 'Daniel-Regular.ttf'],
  ['TTF CFF/OTTO (Kedem-Serif-Regular-Italic.ttf)', 'Kedem-Serif-Regular-Italic.ttf'],
  ['TTF variable wght (FrankRuhlLibre-VF.ttf)', 'FrankRuhlLibre-VF.ttf'],
  ['TTF symbol no-unicode (Guttman-Logo1-Regular.ttf)', 'Guttman-Logo1-Regular.ttf'],
  ['WOFF2 (Avukado-Regular.woff2)', 'Avukado-Regular.woff2'],
  ['WOFF2 CFF (Afek-Regular.woff2)', 'Afek-Regular.woff2'],
  ['WOFF2 variable (Segoe Ui Variable-Regular.woff2)', 'Segoe Ui Variable-Regular.woff2'],
];
const CHARS = ['א', 'ב', 'ג', 'ד', 'ה', ' '];
for (const [label, file] of CASES) {
  const bytes = fs.readFileSync(path.join(FONT_DIR, file));
  const parsed = fm.parseFont(bytes);
  let subset = null;
  if (parsed.ok) subset = buildSubset(parsed.font, CHARS);
  console.log(
    label.padEnd(56),
    'parseFont:', parsed.ok ? 'OK' : 'FAIL(' + parsed.error + ')',
    '| buildSubset:', subset === null ? 'n/a' : (subset.ok ? 'OK(' + subset.kept + ' glyphs,' + subset.bytes.length + 'B)' : 'FAIL(' + subset.error + ')')
  );
}
// registerFont path (measure-api) for a WOFF2 bytes — the export path the browser triggers
const { registerFont, unregisterFont } = require(path.join(REPO, 'red-build/src/engine/typography/measure-api'));
const woff2 = fs.readFileSync(path.join(FONT_DIR, 'Avukado-Regular.woff2'));
const reg = registerFont('אבוקדו רגיל', woff2);
console.log('measure-api.registerFont(WOFF2):', reg.ok ? 'OK' : 'FAIL(' + reg.error + ')');
if (!reg.ok) unregisterFont('אבוקדו רגיל');
