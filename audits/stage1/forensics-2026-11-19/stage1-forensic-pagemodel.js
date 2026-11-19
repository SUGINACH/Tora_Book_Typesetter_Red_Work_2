// scripts/stage1-forensic-pagemodel.js
// Forensic verification: does the CANONICAL PageModel carry y/sizePt/fontKey per line
// and fontKey/sizePt per word, in the unified engine — vs the run-ours.js ADAPTER
// which synthesizes its own model from result.pages and hard-codes fonts?
//
// Replicates the exact invocation of tools/layout-parity/run-ours.js (fonts, settings,
// env) and inspects FOUR distinct layers separately:
//   A. DocumentModel (semantic blocks — paragraphs)
//   B. result.pages[].columns[][] (planner line objects — the ADAPTER's source)
//   C. result.pageModel (canonical PageModel — lines[] with placeLine output)
//   D. Worker transport (serializeTypesetResult roundtrip — do fields survive?)
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = '/home/z/my-project/repo';
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

function main() {
  const corpus = process.argv[2] || path.join(AUD, 'no_long_test_text.txt');
  const outPath = process.argv[3] || '/home/z/my-project/scripts/forensic-pagemodel-no_long.json';
  const text = fs.readFileSync(corpus, 'utf8');

  // ---- exact run-ours.js setup ----
  process.env.RED_ENABLE_STRETCH_RECLAIM = '1';
  process.env.RED_RECLAIM_COMPRESS_MAX = '20';
  process.env.RED_UNIFIED_IMUD = '1'; // unified engine — THE claim under test

  const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
  const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map.js'));
  const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry.js'));
  const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry.js'));

  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(legacy, regKeys, { availableFonts: families });

  const fontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf'));
  if (!registerFont('Guttman Rashi', fontBytes).ok) throw new Error('registerFont failed');
  const S63 = [
    ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'], ['AlphaLight', 'Alpha-Light.ttf'],
    ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'],
    ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'], ['David Libre', 'DavidLibre-Regular.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'], ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf']
  ];
  for (const [fam, file] of S63) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (!fs.existsSync(fp)) continue;
    registerFont(fam, fs.readFileSync(fp));
  }
  const windowFontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankReal-Bold.ttf'));
  const prefaceFontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/FrankRuhlLibre-VF.ttf'));
  const headingFontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/DavidLibre-Bold.ttf'));
  const marginFontBytes = fs.readFileSync(path.join(RB, 'ui/assets/imud/fonts/Hadassah-Friedlaender-Regular.ttf'));

  const settings = {
    ...getDefaultSettings(),
    ...imp.settings,
    'body-font': 'Guttman Rashi',
    'measure-impl': 'font-metrics'
  };

  // ---- A. DocumentModel: paragraph blocks (same code path as pipeline.js CP1) ----
  const { lexDocument } = require(path.join(RB, 'src/engine/parser/dfa-lexer'));
  const { tokenizeDetailed } = require(path.join(RB, 'src/engine/parser/block-tokenizer'));
  const { buildDocumentModel } = require(path.join(RB, 'src/engine/model/document-model'));
  const parseOpts = {
    endnotePrefix: settings['en-line-prefix'],
    fnOpen: settings['fn-delim-open'],
    fnClose: settings['fn-delim-close']
  };
  const lexResult = lexDocument(text, parseOpts);
  const detail = tokenizeDetailed(lexResult.bodyLines, parseOpts);
  const documentModel = buildDocumentModel(text, {
    lexResult, detail, parseOpts,
    inlineOptions: {
      fontMarkers: settings['_inline-font-markers'] || settings._inlineFontStyles || settings._inlineFontMarkers || [],
      knownFamilies: settings['_inline-font-families'] || settings._inlineFontFamilies || []
    },
    assets: null
  });
  const dmKinds = {};
  for (const b of documentModel.blocks) dmKinds[b.kind] = (dmKinds[b.kind] || 0) + 1;

  // ---- run the unified engine ----
  const { typeset } = require(path.join(RB, 'src/engine/core/pipeline.js'));
  const t0 = Date.now();
  const result = typeset(text, settings, {
    noRecommendations: true, marginFontBytes, windowFontBytes, prefaceFontBytes, headingFontBytes
  });
  const engineMs = Date.now() - t0;
  console.error(`unified typeset: ${result.pages.length} pages in ${engineMs}ms (legacyProfile=${result.legacyProfile === true})`);

  // ---- B. result.pages[].columns[][] — the ADAPTER's source ----
  const adapterSource = { pages: result.pages.length, columnsLines: 0, hasParaId: 0, hasKindParagraph: 0, hasSizePt: 0, hasY: 0, hasHeightPx: 0, fieldUnion: {} };
  for (const pg of result.pages) {
    for (const col of (pg.columns || [])) {
      for (const ln of col) {
        adapterSource.columnsLines++;
        for (const k of Object.keys(ln)) adapterSource.fieldUnion[k] = (adapterSource.fieldUnion[k] || 0) + 1;
        if (ln.paraId != null) adapterSource.hasParaId++;
        if (ln.kind === 'paragraph') adapterSource.hasKindParagraph++;
        if (ln.sizePt != null) adapterSource.hasSizePt++;
        if (ln.y != null) adapterSource.hasY++;
        if (ln.heightPx != null) adapterSource.hasHeightPx++;
      }
    }
  }

  // ---- C. result.pageModel — the CANONICAL model ----
  const pm = result.pageModel;
  const pmStats = {
    schema: pm && pm.schema,
    pages: pm && pm.pages.length,
    geometryHash: pm && pm.geometryHash,
    contentHash: pm && pm.contentHash,
    lineFields: null, byArea: {}, wordFields: null, samplePaths: []
  };
  if (pm) {
    const lineCounters = { total: 0, x: 0, y: 0, w: 0, h: 0, sizePt: 0, baselineY: 0, fontKey: 0, words: 0, wordCount: 0, word_x: 0, word_w: 0, word_sizePt: 0, word_fontKey: 0, word_baselineY: 0, projected: 0, sourceTokenId: 0 };
    for (const pg of pm.pages) {
      for (const ln of (pg.lines || [])) {
        lineCounters.total++;
        const area = ln.area || '?';
        if (!pmStats.byArea[area]) pmStats.byArea[area] = { total: 0, x: 0, y: 0, sizePt: 0, baselineY: 0, fontKeyLine: 0, words: 0, word_fontKey: 0, word_sizePt: 0 };
        const A = pmStats.byArea[area];
        A.total++;
        if (ln.x != null) { lineCounters.x++; A.x++; }
        if (ln.y != null) { lineCounters.y++; A.y++; }
        if (ln.w != null) lineCounters.w++;
        if (ln.h != null) lineCounters.h++;
        if (ln.sizePt != null) { lineCounters.sizePt++; A.sizePt++; }
        if (ln.baselineY != null) { lineCounters.baselineY++; A.baselineY++; }
        if (ln.projected === true) lineCounters.projected++;
        if (ln.sourceTokenId != null) lineCounters.sourceTokenId++;
        if (Array.isArray(ln.words)) {
          lineCounters.words++; A.words++;
          for (const wd of ln.words) {
            lineCounters.wordCount++;
            if (wd.x != null) lineCounters.word_x++;
            if (wd.w != null) lineCounters.word_w++;
            if (wd.sizePt != null) { lineCounters.word_sizePt++; A.word_sizePt++; }
            if (wd.fontKey != null) { lineCounters.word_fontKey++; A.word_fontKey++; }
            if (wd.baselineY != null) lineCounters.word_baselineY++;
          }
        }
      }
    }
    pmStats.lineFields = lineCounters;
    // sample: first body line + first heading line JSON path keys
    for (const pg of pm.pages) {
      const ln = (pg.lines || []).find(l => l.area === 'column');
      if (ln) { pmStats.samplePaths.push({ page: pg.index, lineId: ln.id, keys: Object.keys(ln), wordKeys: ln.words && ln.words[0] ? Object.keys(ln.words[0]) : null }); break; }
    }
  }

  // ---- D. Worker transport roundtrip ----
  const { serializeTypesetResult } = require(path.join(RB, 'src/ui/worker-protocol'));
  let transport = null;
  try {
    const ser = serializeTypesetResult(result);
    const clone = JSON.parse(JSON.stringify(ser)); // structured-clone + JSON.freeze simulation
    const tpm = clone.pageModel && clone.pageModel.model;
    if (tpm) {
      let x = 0, y = 0, sizePt = 0, wfk = 0, wtotal = 0, ltotal = 0;
      for (const pg of tpm.pages) for (const ln of (pg.lines || [])) {
        ltotal++;
        if (ln.x != null) x++; if (ln.y != null) y++; if (ln.sizePt != null) sizePt++;
        for (const wd of (ln.words || [])) { wtotal++; if (wd.fontKey != null) wfk++; }
      }
      transport = {
        schema: clone.pageModel.transport, bytesEstimate: clone.pageModel.bytesEstimate,
        geometryHashMatches: clone.pageModel.geometryHash === pm.geometryHash,
        lines: ltotal, line_x: x, line_y: y, line_sizePt: sizePt, words: wtotal, word_fontKey: wfk
      };
    } else transport = { error: 'no pageModel in transport' };
  } catch (e) { transport = { error: String(e) }; }

  const report = {
    meta: {
      date: '2026-11-19', branch: 'stage1/capability-map', head: '9d86bfe',
      corpus: path.relative(ROOT, corpus), engine: 'unified (RED_UNIFIED_IMUD=1)',
      engineMs, pages: result.pages.length, layoutHash: String(result.layoutHash).slice(0, 20),
      legacyProfile: result.legacyProfile === true,
      pageModelValidation: result.pageModelValidation ? result.pageModelValidation.summary : null
    },
    A_DocumentModel: { totalBlocks: documentModel.blocks.length, byKind: dmKinds, hasParagraphBlocks: (dmKinds.paragraph || 0) > 0 },
    B_resultPages_columns_adapterSource: adapterSource,
    C_resultPageModel_canonical: pmStats,
    D_workerTransport: transport
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.error(`report: ${outPath}`);
  console.error(JSON.stringify({
    A_paragraphs: report.A_DocumentModel.byKind.paragraph || 0,
    B_adapterLines: adapterSource.columnsLines, B_hasParaId: adapterSource.hasParaId, B_hasKindParagraph: adapterSource.hasKindParagraph,
    C_pmLines: pmStats.lineFields && pmStats.lineFields.total,
    C_line_y: pmStats.lineFields && pmStats.lineFields.y, C_line_sizePt: pmStats.lineFields && pmStats.lineFields.sizePt,
    C_word_fontKey: pmStats.lineFields && pmStats.lineFields.word_fontKey, C_word_total: pmStats.lineFields && pmStats.lineFields.wordCount,
    D_transport: transport && transport.schema
  }, null, 2));
}
main();
