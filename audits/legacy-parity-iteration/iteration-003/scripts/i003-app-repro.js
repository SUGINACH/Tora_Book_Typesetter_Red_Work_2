// scripts/i003-app-repro.js — reproduce the APP (Pages/Worker) export path in Node
// Registers fonts via font-resolver (like the live app), runs the unified engine,
// exports PDF+HTML, and dumps page-structure info.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = '/home/z/my-project/repo';
const RB = path.join(ROOT, 'red-build');

process.env.RED_UNIFIED_IMUD = '1';

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { exportPdf, exportHtml } = require(path.join(RB, 'src/engine/output/export-api'));

const text = fs.readFileSync('/home/z/my-project/work/ref-pdfs/source-text.txt', 'utf8');

// ---- fonts: register via font-resolver (app path) ----
// The app registers: loadFontsForCurrentSettings (all settings-referenced families via
// loadFontStack = catalog family -> file) + loadWindowFont (FrankReal-Bold as 'FrankReal')
// + loadHeadingFont (DavidLibre-Bold under family 'DavidLibre-Bold').
const catalog = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/imud-fonts.json'), 'utf8'));
const byFamily = new Map(catalog.map(e => [e.family, e.file]));
const NEEDED_FAMILIES = [
  'Guttman Rashi', 'FrankReal', 'David HB', 'Frank Ruhl Libre', 'אסיסטנט קל מאוד', 'ליבורנה מודגש',
  'AlphaBlack', 'Lia Sgula', 'Alpha', 'AlphaLight', 'Noto Serif Hebrew', 'Hadassah Friedlaender',
  'Livorna', 'David Libre'
];
for (const fam of NEEDED_FAMILIES) {
  const file = byFamily.get(fam);
  if (!file) { console.error('family not in catalog (system fallback in app):', fam); continue; }
  const fp = path.join(RB, 'ui/assets/imud/fonts', file);
  if (!fs.existsSync(fp)) { console.error('missing font file:', file); continue; }
  const r = fontResolver.registerFont(fam, fs.readFileSync(fp), { source: 'i003-repro' });
  if (!r.ok) console.error(`registerFont(${fam}) failed:`, r.message);
  else console.error(`registered: ${fam} (${file}) [${r.fontId}]`);
}
// loadHeadingFont: DavidLibre-Bold under its own family name 'DavidLibre-Bold'
{
  const fp = path.join(RB, 'ui/assets/imud/fonts/DavidLibre-Bold.ttf');
  if (fs.existsSync(fp)) {
    const r = fontResolver.registerFont('DavidLibre-Bold', fs.readFileSync(fp), { source: 'i003-repro' });
    console.error(`registered: DavidLibre-Bold [${r.ok ? r.fontId : 'FAILED: ' + r.message}]`);
  }
}

// ---- settings: like the app boot (IMUD defaults import, WHOLE raw object) ----
const rawDefaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const regKeys = new Set(getSettingDefs().map(r => r.id));
const imp = importImudSettings(rawDefaults, regKeys, { contentHeightPx: 1040, availableFonts: new Set(byFamily.keys()) });
const settings = { ...getDefaultSettings(), ...imp.settings, 'measure-impl': 'font-metrics' };

// ---- boot ensureThemeSet(40): register the theme designs + merge refs (browser-entry) ----
{
  const { registerAssets } = require(path.join(RB, 'src/engine/decoration/asset-registry'));
  const THEME_NO = 40;
  const ROLES = [
    { collection: 'shaar-main', setting: 'imud-shaar-main' },
    { collection: 'shaar-sub', setting: 'imud-shaar-sub' },
    { collection: 'shaar-back', setting: 'imud-shaar-back' }
  ];
  for (const { collection, setting } of ROLES) {
    const colFile = { 'shaar-main': 'shaar_main', 'shaar-sub': 'shaar_sub', 'shaar-back': 'shaar_back' }[collection];
    const idx = JSON.parse(fs.readFileSync(path.join(RB, `ui/assets/imud/${colFile}.index.json`), 'utf8'));
    const hit = idx.find(it => new RegExp(`^\\s*${THEME_NO}\\s+`).test(String(it.name || '')));
    if (!hit) continue;
    const full = JSON.parse(fs.readFileSync(path.join(RB, `ui/assets/imud/${colFile}.json`), 'utf8'));
    const items = full instanceof Array ? full : (full.items || []);
    const item = items.find(x => x.id === hit.id);
    if (!item) continue;
    const res = registerAssets(collection, [{ id: item.id, name: item.name, svg: item.svg, box: item.box }]);
    if (!res.ok) console.error(`registerAssets(${collection}) rejected:`, res.rejected);
    settings[setting] = `imud:${collection}:${item.id}`;
    console.error(`theme40: ${setting} = imud:${collection}:${item.id}`);
  }
}
console.error('effective: body-line-height =', settings['body-line-height'], '| paren-style-scale =', settings['paren-style-scale'], '| h7 size =', settings['heading-7-size-pt'], '| imud-shaar-main =', settings['imud-shaar-main']);

const t0 = Date.now();
const result = typeset(text, settings, { noRecommendations: true });
console.error(`typeset: ${result.pages.length} pages in ${Date.now() - t0}ms (hash ${String(result.layoutHash).slice(0, 16)}) [profile: ${result.legacyProfile ? 'imud-legacy' : 'dp'}]`);

// dump page structure for pages of interest
const dumpPages = (process.argv[2] || '').split(',').filter(Boolean).map(Number);
if (dumpPages.length) {
  const model = result.pageModel || result;
  const pages = model.pages || result.pages;
  for (const pn of dumpPages) {
    const pg = pages[pn - 1];
    if (!pg) { console.error('no page', pn); continue; }
    const o = {
      index: pg.index, type: pg.type, chapterOpening: pg.chapterOpening,
      decorations: (pg.decorations || []).map(d => ({ slot: d.slot, kind: d.kind, kindStyle: d.kindStyle, x: d.x, y: d.y, w: d.w, h: d.h, image: d.image || null, ink: d.ink ? d.ink.type : null })),
      folio: pg.folio ? { text: pg.folio.text, y: pg.folio.y, x: pg.folio.x, sizePt: pg.folio.sizePt } : null,
      header: pg.header ? (pg.header.slots || []).map(s => ({ text: s.text, x: s.x, y: s.y, sizePt: s.sizePt, fontKey: s.fontKey })) : null,
      lines: []
    };
    const allLines = (pg.lines || []).slice(0, 20);
    const spanning = (pg.lines || []).filter(l => l.area === 'spanning').slice(0, 6).map(ln => ({ y: ln.y, x: ln.x, w: ln.w, level: ln.level, kind: ln.kind, words: (ln.words || []).slice(0, 8).map(w => w.text).join(' '), sizePt: ln.sizePt, heightPx: ln.heightPx }));
    if (spanning.length) o.spanning = spanning;
    for (const ln of allLines) {
      o.lines.push({ y: ln.y, x: ln.x, w: ln.w, level: ln.level, kind: ln.kind, area: ln.area, words: (ln.words || []).slice(0, 8).map(w => w.text).join(' '), sizePt: ln.sizePt, heightPx: ln.heightPx, projected: ln.projected });
    }
    console.log('PAGE ' + pn + ': ' + JSON.stringify(o, null, 1));
  }
}

// export pdf+html from the same run (worker-equivalent: exportPdfFromModel/exportHtmlFromModel)
if (process.argv.includes('--export')) {
  const { exportPdfFromModel, exportHtmlFromModel } = require(path.join(RB, 'src/engine/output/export-api'));
  const outDir = '/home/z/my-project/work/iter003-export';
  fs.mkdirSync(outDir, { recursive: true });
  const t1 = Date.now();
  const fontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf'));
  const res = exportPdfFromModel(result.pageModel, settings, fontBytes, settings['body-font']);
  if (!res.ok) { console.error('PDF export failed:', res.error); process.exit(4); }
  fs.writeFileSync(path.join(outDir, 'repro.pdf'), res.bytes);
  console.error(`pdf exported: ${res.bytes.length} bytes in ${Date.now() - t1}ms`);
  const docShim = require('./i003-doc-shim');
  const t2 = Date.now();
  const html = exportHtmlFromModel(result.pageModel, settings, docShim, { title: 'i003-repro' });
  fs.writeFileSync(path.join(outDir, 'repro.html'), html);
  console.error(`html exported: ${html.length} chars in ${Date.now() - t2}ms`);
}
