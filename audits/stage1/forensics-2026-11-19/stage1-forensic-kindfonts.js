// scripts/stage1-forensic-kindfonts.js
// Verify: per-kind font/sizePt on unified lines (preface body FRL 11.5? headings?),
// window-word projection, and which column words carry fontKey/sizePt in PageModel.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = '/home/z/my-project/repo';
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

function main() {
  const text = fs.readFileSync(path.join(AUD, 'no_long_test_text.txt'), 'utf8');
  process.env.RED_ENABLE_STRETCH_RECLAIM = '1';
  process.env.RED_UNIFIED_IMUD = '1';
  const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
  const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
  const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const imp = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families });
  for (const [fam, file] of [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['David Libre', 'DavidLibre-Regular.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf']
  ]) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
  const settings = { ...getDefaultSettings(), ...imp.settings, 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
  const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
  const result = typeset(text, settings, {
    noRecommendations: true,
    marginFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Hadassah-Friedlaender-Regular.ttf')),
    windowFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankReal-Bold.ttf')),
    prefaceFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankRuhlLibre-VF.ttf')),
    headingFontBytes: fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/DavidLibre-Bold.ttf'))
  });

  // ---- per page-type / per-kind font+size stats on result.pages lines ----
  const kindStats = {};
  const pageTypeStats = {};
  for (const pg of result.pages) {
    const pt = pg.type || '?';
    if (!pageTypeStats[pt]) pageTypeStats[pt] = { pages: 0, colWidths: new Set(), lineKinds: {} };
    pageTypeStats[pt].pages++;
    for (const col of (pg.columns || [])) {
      // column width from template
      pageTypeStats[pt].colWidths.add(Math.round((col._w || (col.length && col[0] && col[0].widthPx) || 0) * 100) / 100);
      for (const ln of col) {
        const key = `${ln.kind || '?'}/L${ln.level != null ? ln.level : '-'}`;
        if (!kindStats[key]) kindStats[key] = { count: 0, hasFont: 0, fonts: {}, sizePts: {}, window: 0 };
        const S = kindStats[key];
        S.count++;
        if (ln.font) { S.hasFont++; S.fonts[ln.font] = (S.fonts[ln.font] || 0) + 1; }
        if (ln.sizePt != null) S.sizePts[ln.sizePt] = (S.sizePts[ln.sizePt] || 0) + 1;
        if (ln.window || (ln.windowWords && ln.windowWords.length)) S.window++;
        if (pt === 'preface') {
          if (!pageTypeStats[pt].lineKinds[key]) pageTypeStats[pt].lineKinds[key] = { count: 0, font: ln.font || null, sizePt: ln.sizePt != null ? ln.sizePt : null };
          pageTypeStats[pt].lineKinds[key].count++;
        }
      }
    }
  }
  for (const k of Object.keys(pageTypeStats)) pageTypeStats[k].colWidths = [...pageTypeStats[k].colWidths];

  // ---- PageModel: which column-area words carry fontKey (sample texts) ----
  const fontKeyWordSamples = [];
  for (const pg of result.pageModel.pages) {
    for (const ln of (pg.lines || [])) {
      if (ln.area !== 'column') continue;
      for (const wd of (ln.words || [])) {
        if (wd.fontKey != null && fontKeyWordSamples.length < 10) {
          fontKeyWordSamples.push({ page: pg.index, kind: ln.kind, text: wd.text, fontKey: wd.fontKey, sizePt: wd.sizePt != null ? wd.sizePt : ln.sizePt });
        }
      }
    }
  }

  // ---- window words: does result.pages carry windowWords? does PageModel project them? ----
  let windowInPages = 0, windowSample = null;
  for (const pg of result.pages) for (const col of (pg.columns || [])) for (const ln of col) {
    if (ln.windowWords && ln.windowWords.length) { windowInPages++; if (!windowSample) windowSample = { page: pg.index, windowWords: ln.windowWords.slice(0, 3), sizePt: ln.sizePt }; }
  }
  // window words in pageModel: look for sizePt != body 12
  let pmWindowCandidates = 0;
  const bodySize = settings['body-font-size-pt'];
  for (const pg of result.pageModel.pages) for (const ln of (pg.lines || [])) {
    if (ln.area === 'column' && ln.sizePt != null && ln.sizePt !== bodySize) pmWindowCandidates++;
  }

  const out = {
    meta: { corpus: 'no_long', engine: 'unified', bodyFontSizeSetting: bodySize, bodyFont: settings['body-font'] },
    kindStats, pageTypeStats, fontKeyWordSamples,
    window: { linesWithWindowWordsInResultPages: windowInPages, sample: windowSample, pmColumnLinesWithNonBodySizePt: pmWindowCandidates }
  };
  fs.writeFileSync('/home/z/my-project/scripts/forensic-kindfonts-no_long.json', JSON.stringify(out, null, 2));
  console.error('page types:', JSON.stringify(Object.fromEntries(Object.entries(pageTypeStats).map(([k, v]) => [k, { pages: v.pages, colWidths: v.colWidths }]))));
  console.error('kind stats:', JSON.stringify(kindStats, null, 1).slice(0, 3000));
  console.error('fontKey word samples:', JSON.stringify(fontKeyWordSamples.slice(0, 6)));
  console.error('window:', JSON.stringify(out.window));
}
main();
