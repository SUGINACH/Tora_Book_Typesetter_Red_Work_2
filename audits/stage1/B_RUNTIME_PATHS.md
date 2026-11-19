# Stage 1 — B. Runtime Paths (real input→output flow, verified in code)

Repo: `red-build` @ branch `audit/stage1-engine-state-20261115` (base main 95e829d)
Method: full read of `pipeline.js` (1226 lines), `engine-worker-main.js`, `worker-client.js`, `worker-protocol.js`, `browser-entry.js`, `app-shell.js`, `imud-library.js`, `export-api.js`, `measure-api.js`, `dp-planner.js`, `legacy-imud-flow.js` (structure), `retreat-loop.js`, `footnote-budget.js`, `side-notes.js`, `endnote-pages.js`, `build-worker-bundle.js`; bundle module-list extraction; test-harness grep. Every claim cites file:line.

---

## 0. EXECUTIVE SUMMARY — what ACTUALLY runs

The claimed path "UI/import → Worker → Parser → Pipeline → MeasureAPI → Line Breaker → Planner → Notes/Decorations → Projector → DOM/PDF/HTML" is **wrong in two major ways**:

1. **There are TWO full, parallel engines**, not one. `typeset()` (core/pipeline.js:117) branches at **pipeline.js:123–126**:
   - **LEGACY engine** — `legacyTimeset()` in `layout/legacy-imud-flow.js:871` (3720-line monolithic port of the original IMUD program: own tokenizer `tokenizeDoc` :303, own greedy `LineBreaker` :407, own section flow `flowSection` :1319, own footnote bar `placeFootnoteArea` :2497, own TOC, own shaar pages, own hash). Selected when `settings._layout-profile === 'imud' && settings._imudRaw` exists.
   - **MODERN DP engine** — the CP1..CP5 pipeline in `core/pipeline.js` (parser → MeasureAPI/KP → `planPages` dp-planner → protections/retreat → notes/decorations → dom-renderer).
   - **The LEGACY engine is the product default in the shipped browser app.** Boot sequence: `browser-entry.js:167` → `imud.loadLegacyDefaults()` → `importImudSettings()` sets `_imudRaw` + `_layout-profile='imud'` (legacy-settings-map.js:448–453, triggered when the fetched `assets/imud/default_settings.json` contains `fn-delim-open`, `size-body`, `line-height-body`) → `app.applyLegacyDefaults()` does `Object.assign(settings, imported)` (app-shell.js:202–203). If the IMUD assets fetch fails (local dev w/o assets), the app silently falls back to RED registry defaults → DP path (browser-entry.js:202 catch: "נכסים לא זמינים — ברירות RED").
2. **The Projector is NOT in the DOM/live-view path.** `geometry-projector.js` / `legacy-projector.js` are called **only** from `export-api.exportPdf` (export-api.js:135–137). The live preview and the HTML export render directly from the typeset result via `dom-renderer.renderPage` (preview-tab.js:10, app-shell.js:638, export-api.js:63). So the real terminal split is: **pages-model → dom-renderer → (live DOM | standalone HTML)** and **pages-model → projector → pdf-writer → PDF**.

Also: **typing in the editor never triggers the engine.** `onTextChange` only marks heavy-dirty (app-shell.js:144, editor-tab.js:114–117). The engine runs only from `onExplicitRetypeset` (⚡ button / paste / import / open / test-doc / recommendation-apply) — enforced statically by `callgraph-scan.js` (F-06 allowlist: worker-client.js, engine-worker-main.js, app-shell `onExplicitRetypeset`/`onDocumentAction` only; callgraph-scan.js:97–103,132).

---

## 1. ENTRY POINT TRACES (verified)

### (a) UI editor → worker → engine
1. User pastes text: `editor-tab.js:119–129` paste event → `opts.onDocumentAction('paste', data)`.
2. `app-shell.js:454 onDocumentAction` → action `'paste'|'import-txt'|'open'` → sets `text`, `editor.setText`, calls `onExplicitRetypeset()` (app-shell.js:473–477).
3. `app-shell.js:409 onExplicitRetypeset` → `engine.requestTypeset({text, settings, onProgress})` (app-shell.js:415). `engine` = `WorkerEngineClient` (app-shell.js:132).
4. `worker-client.js:178 requestTypeset` → posts `{type:'typeset-request', jobId, text, settings}` (worker-client.js:186) over `workerTransport(() => new Worker('engine-worker.bundle.js?v=…'))` (browser-entry.js:88, worker-client.js:225).
5. Worker side: `engine-worker-main.js:74 createEngineWorkerMain` → validates (worker-protocol.js:60 `validateRequest`) → **`typeset(msg.text, msg.settings, {onProgress})`** (engine-worker-main.js:92, pipeline imported at :13).
6. Result → `serializeTypesetResult(result)` (worker-protocol.js:28–57: pages, report via `audit/report-schema.buildReport`, trace via `events.toTraceV2()`, ledger v2, toc, tokens, stageSnapshots, recommendations) → `{type:'typeset-result', jobId, result}`.
7. UI: `worker-client.js:124` resolves promise → `app-shell.js:420` stores `result`, `typesetGen++`, `applyResultToViews()` (app-shell.js:690–710): `buildCaretMap`, `preview.setResult(result, settings)` (renders via `dom-renderer.renderPage` — preview-tab.js:10), `testing.setResult(result)`, `editor.setPageBreaks()`, status strip.

Other UI-originated worker messages (all live):
- `register-font` (worker-client.js:146; handler engine-worker-main.js:19 → `measure-api.registerFont` :28) — sent by `imud-library.loadFont` (imud-library.js:131), `loadWindowFont` (:345 'FrankReal'), `loadHeadingFont` (:379 'DavidLibre-Bold'), and `onSettingChanged` font pickers (app-shell.js:502–511). Replayed after worker respawn (worker-client.js:45–60, S70).
- `register-assets` (worker-client.js:157; handler engine-worker-main.js:36 → `decoration/asset-registry.registerAssets`) — sent by `imud-library.ensureDesign` (imud-library.js:246) for SVG ornament/shaar collections.
- `export-request` kind pdf|zip (worker-client.js:167; handler engine-worker-main.js:48 → `export-api.exportPdf`/`exportProjectZip`) — from `runRemotePdfExport` (app-shell.js:592–599) / `runRemoteZipExport` (:612–614).
- `cancel` (worker-client.js:198–215: mark + terminate + respawn).

### (b) File import → engine
- **TXT**: `browser-entry.js:125 pickFile` → `app.onDocumentAction('import-txt', text)` → same explicit path as (a). No engine-specific parsing.
- **DOCX**: `browser-entry.js:126 pickBinaryFile` → `app.importDocxFile(bytes, name)` (app-shell.js:557) → **`importDocx(bytes, fileName)` runs in the UI thread** (app-shell.js:22 require, engine/import/docx-import.js:1–16; uses `zip-reader.readZip` + `xml-lite.parseXml`) → produces plain engine-syntax text → `onDocumentAction('open', res.text)` → explicit retypeset. So DOCX never touches the Worker until the resulting text is typeset.
- **Project ZIP**: `importProjectZip` (export-api.js:514) — Node/tests only path (Buffer-gated); in browser, project zip import is not wired to a UI button (only export is; AMBIGUOUS: no import button found in UI sources).
- **Settings/templates/extensions JSON**: `pickFile` → `app.loadTemplateJson` / `extensions.importFromText` (browser-entry.js:127–136) — affect `settings` (incl. `_customPages`/`_customStyles`, app-shell.js:226–238), then require ⚡.

### (c) Node/test entry
- Tests require `typeset` directly: `require('../../src/engine/core/pipeline')` in ~25+ test files (e.g. e2e/pipeline.test.js, canonical.test.js, s52-dp-fixes.test.js …). `package.json` `test:determinism` also calls `typeset(t, getDefaultSettings())` — i.e. **tests exercise the DP path by default**; legacy path is tested via `_imudRaw` fixtures (integration/imud-migration.test.js, legacy-result-contract.test.js).
- UI-in-Node: `s10-ui.test.js:19` uses `inline-transport.js` (`createInlineTransport` wraps the same `createEngineWorkerMain` in-process, inline-transport.js:13–25) → same protocol, same `typeset`.
- `exportPdf`/`exportProjectZip` re-enter `typeset` internally with `measure-impl:'font-metrics'` forced (export-api.js:117–122) — export always re-typesets; it does not reuse the live result.

---

## 2. THE PATH-SELECTION FLAG(S) — legacy vs DP

| Flag | Where set | Where read | Effect |
|---|---|---|---|
| `settings._layout-profile === 'imud'` **AND** `settings._imudRaw` (object) | `legacy-settings-map.js:448–453` — set by `importImudSettings()` when the imported legacy JSON looks like the full original `default_settings.json` (has `fn-delim-open`, `size-body`, `line-height-body`). Reached from: boot (`browser-entry.js:167` loadLegacyDefaults → applyLegacyDefaults app-shell.js:202), settings-panel style-sets (settings-panel.js:362 `loadSettingSet`), template JSON import. | **`pipeline.js:123–126`** — `typeset()` dispatches to `legacyTimeset(rawText, settingsIn, env)` | Whole-engine switch: legacy engine vs DP engine |
| `result.legacyProfile` (returned `legacyProfile: true`, legacy-imud-flow.js:3698) | set by legacy engine | **`export-api.js:135–137`** — PDF export chooses `projectLegacyDocument` (legacy-projector.js:737) vs `projectDocument` (geometry-projector.js:816) | Projector switch |
| `page.legacy` (legacy-imud-flow.js:1138 blankPageObj) | set on every legacy page | **`dom-renderer.js:1318`** — `renderPage` dispatches to `renderLegacyPage` (:683) | DOM renderer switch |

**There is NO `useDP` / `engine-mode` / `layout-engine` registry key.** The registry (settings-registry.js) has no such setting; the profile keys are underscore-prefixed document-assets injected by the import layer, not user-facing settings. Not in registry: grep of settings-registry.js for `layout-engine|useDP|engine-mode` → 0 hits (only `measure-impl` :307, `note-placement-mode` :142 etc.).

**Persistence**: `cleanSettings` (export-api.js:558–571) KEEPS `_imudRaw`, `_layout-profile` in project ZIPs (O16 fix). `settings-persistence` saves only the user diff vs. the post-boot baseline (app-shell.js:77, 215), so `_layout-profile` itself is normally re-derived at each boot from the assets fetch, not from localStorage.

**Default in the product**: LEGACY (when `assets/imud/default_settings.json` is served — the deployed app always serves it; the code comment at browser-entry.js:160–166 states this is by design: "ברירות המחדל של הפרויקט המקורי … מוחלות אוטומטית בעלייה"). DP is the fallback when assets are missing (dev) and is what the test-suite primarily runs.

**Secondary active flags inside the DP path** (all in settings-registry.js):
- `measure-impl` = `'table'` default (settings-registry.js:307); **but** `resolveMeasureImpl` (measure-api.js:237–242) silently upgrades to `'font-metrics'` whenever `body-font` is a registered font (EXT-13) — in the browser with IMUD fonts loaded, measurement is font-metrics even on `'table'`.
- `note-placement-mode` = `'footnotes'` default (:142; enum footnotes/endnotes/inline), `footnotes-enabled` = true (:143); derived by `derivePlacementFlags` (settings-registry.js:341, called pipeline.js:133).
- `aq-enabled` = false (:178), `toc-general-enabled` = true (:209), `toc-detail-enabled` = false (:210), `shaar-main/sub/back-enabled` = true (:227,252,253), `footnote-columns` = 1 (:146), `paren-style-scale` = 1 (:74).

---

## 3. STAGE TABLE — MODERN DP PATH (`typeset()`, core/pipeline.js:117)

| # | Stage | file:function (line) | Input struct | Output struct | Consumers | Authority/Adapter | Alternative path | Active in product |
|---|---|---|---|---|---|---|---|---|
| 0 | Dispatch | core/pipeline.js:`typeset` (117); legacy branch 123–126 | `rawText`, `settingsIn`, `env` | result object (1202–1223) | worker / export-api | authority (orchestrator) | **legacy-imud-flow.legacyTimeset (871)** | YES (branch; legacy wins by default — see §2) |
| 1 | Settings merge | pipeline.js:133 `derivePlacementFlags({...getDefaultSettings(), ...settingsIn})` (settings-registry.js:341) | user settings | merged settings + derived flags | all later stages | authority | legacy: `readConfig(settings._imudRaw)` legacy-imud-flow.js:205,872 | YES |
| 2 | Custom styles parse (S11) | pipeline.js:141–150 → extensions/style-schema.parseCustomStyles; ledger records | `settings._customStyles` (JSON) | `{ok, styles[], errors[]}` | block loop, apply-styles | authority | legacy: none (no custom styles in legacy) | YES (only when extensions bundle exists; app-shell.js:228) |
| 3 | **CP1 Parse** | parser/dfa-lexer.js:`lexDocument` (pipeline.js:164) + parser/block-tokenizer.js:`tokenize` (:165), `contentHash` (:173) | rawText + `en-line-prefix`/`fn-delim-*` | `{metadata, bodyLines}`, `tokens[]` (heading/paragraph/endnote/endnote-class/side-note/editorial), `hashIn` | block loop, TOC, integrity check | authority | legacy: `parseMetadata` (132) + `tokenizeDoc` (303, own token grammar h0–h7/notes/endNote/sideNote) | YES |
| 4 | Scope-map | parser/bracket-scanner.js:`scanBrackets` (pipeline.js:179) | paragraph segments + fn delims | `{pairs, scopeMap, unmatchedClosers}` | eventLog; paren ranges later | authority | legacy: `findNotes` (147,162) inside LineBreaker.splitWords (451) | YES |
| 5 | Measurement setup | typography/measure-api.js:`new MeasureAPI(settings, resolveMeasureImpl(settings))` (pipeline.js:186; class :63; resolveMeasureImpl :237) | settings | `api` (measureTextWidth/layoutLines/lineHeightPx, cache) | block loop, planners, decorations, projectors | **authority (single entry REQ-LB-01)**; impl A `measure-table.js:charWidthEm` / impl B `font-metrics.js` (hmtx/cmap/kern/GPOS) | both impls; per-family `MeasureAPI.forFamily` (:220) | YES (impl B whenever font registered) |
| 6 | Geometric budgets | pipeline.js:250–283 (via layout/page-templates.js:`buildPageTemplate` :49? — file page-templates.js, PAGE_TYPES :7) | settings | `settings._fnColWidthPx/_sideNoteColWidthPx/_endnoteColWidthPx/_outerMarginPx` | footnote-budget, side-notes, endnote-pages, projectors | authority | legacy: fixed GEO/SZ constants (legacy-imud-flow.js:34–84) | YES |
| 7 | **CP2 Block build + line breaking** | pipeline.js:285–583 block loop; headings :310–356 (incl. ornament-fit.h2OrnamentReservedHeight :331); endnote tokens :359–376; paragraphs :378–583 with paren pre-pass (parenSpansOfFlat :92), custom-style match (apply-styles.matchBlockStyle/matchInlineStyles :416–424), marker binding (bindMarkersToNeighbors :226), protectors.protectWords (:528), **`api.layoutLines` :319/369/442/529 → typography/kp-linebreak.js:`breakLines` (kp-linebreak.js:23 buildItems, KP DP)**, dropword.applyDropWord :580 | tokens | `blocks[]` {kind, tokenId, lines[{words,widthPx,heightPx,parenSpans,customSpans,h2Orn,…}], notes, bodyMarkers, dh, part, customStyle} | planPages, TOC, integrity | authority | **legacy: `LineBreaker` class (legacy-imud-flow.js:407) — greedy, window-word 1.5×, FIT_EPS 0.75px (D-92); NOT Knuth-Plass** | YES |
| 8 | Heading modes | layout/headings-escort.js:`applyHeadingModes` (pipeline.js:586; fn :25, decision :9) | blocks, settings | flags on blocks (forceNewPage/sideNote/full-width) | dp-planner | authority | legacy: HEADING_MODES table (legacy-imud-flow.js:1107–1122) | YES |
| 9 | **CP3 Page planning (DP)** | layout/dp-planner.js:`planPages` (pipeline.js:596; fn :89) — newPage :110, colCapacity via column-flow.colCapacityOf :126, footnote budget via footnote-budget.getFootnotesReservedHeight :146–151, pushLines :198, reserveNotes :233 (split :255 / move-whole :279 / reject-to-body :284→295), findSplit :488/:617 (candidate-generator.generateCandidates), flushPage :162 (balancing.optimalSplit :170, protectors.fixDropWordInColumns :181) | blocks, settings, measure | `{pages, ledger, retreat, hash, bodyHash}`; page = {index, type, template, columns[][], footnotes[], sideNotes[], spanning?, fnReservedHeightPx, chapterOpening} | everything downstream | **authority** | **legacy: `flowSection` (1319) + `layoutStack` (2952) + `placeFootnoteArea` (2497) + column stretch/squeeze (1621–1799) + split rules (2835–2925)** — completely separate page-planner | YES |
| 10 | Protections + retreat | layout/protections-matrix.js:`runProtections` (dp-planner.js:531) + layout/retreat-loop.js:`runRetreatLoop` (dp-planner.js:532; fn retreat-loop.js:24, MAX_ITER 24, oscillation window 4) | pages, repairFns (only column-imbalance actually repairs via balancePageSafe :538/571; widow/orphan/reading-order are documented-compromise :547–557) | retreat info, ledger findings | report/result.retreat | authority | legacy: none (no retreat loop) | YES |
| 11 | Page-scoped fn renumber | notes/markers.js:`renumberPageScopedMarkers` (pipeline.js:605–613, only when `footnote-reset-policy==='page'` && footnotes mode; default policy is `section` → inert by default) | pages, markersByToken | shortened markers | renderer/report | authority | — | Conditional (default OFF) |
| 12 | Shaar/custom pages insert | decoration/shaar-pages.js:`insertShaarPages` (pipeline.js:623–641; fn file :51ff) + decoration/custom-pages.js:`parseCustomPageTypes` | pages, blocks, customDefs | pages with PT-01/02/03 + custom types | renderer, numbering | authority | legacy: internal shaar pages built in flow (gateLinesFor :1174; pages :1170ff) | YES (DP profile only; defaults shaar-*-enabled=true :252–253) |
| 13 | Chapter-end + balance + AQ | layout/balancing.js:`applyChapterEndMode` (pipeline.js:659), `alignColumnBottoms` (:669), `autoQualityPass` (:671, gated `aq-enabled` default false :178) | pages, settings | stretched columns | renderer | authority | legacy: stretch/squeeze in flowSection (1621–1799) | YES (AQ default OFF) |
| 14 | TOC pages | decoration/toc-builder.js:`buildTocModel` :73 / `numberRows` :98 / `buildTocPages` :117 / `insertTocPages` (pipeline.js:676–727) | headings+firstPageByToken, measure | `tocPagesAll` inserted into pages; `tocInsertInfo` | renderer, PDF tocLinks | authority | legacy: `makeTocPages` (legacy-imud-flow.js:3134) double TOC | YES (general on by default :209; detail off :210) |
| 15 | **CP4 Decorations (geometry-neutral)** | snapshot `bodyGeometryHash` (dp-planner.js:63, pipeline.js:737); layout/side-notes.js:`placeSideNotes` (pipeline.js:742; fn :72) + `verifyH7Conversion` (:807; fn :163); decoration/ornament-plan.js:`planPageOrnaments` (pipeline.js:748; fn :55; internally audits via `auditOrnaments` :336 and uses decoration/dividers.js) | pages, settings, measure | `sideNotePlacement{placed,deferred}`, `ornamentPass`, overlay rects on pages | dom-renderer, geometry-projector | authority (overlay-only, T1 invariant proven at :790–791) | legacy: `planLegacyOrnaments` (decoration/legacy-ornaments.js:119; called legacy-imud-flow.js:3597–3605) + hard-coded gate decorations (:3624–3683) | YES |
| 16 | Endnote pages | layout/endnote-pages.js:`buildEndnotePages` (pipeline.js:763–767; fn :42, uses internal estimateTitleHeight :193 / estimateNoteHeight :199); appended :774–785 | endnoteBlocks (tokens + inline refs when `note-placement-mode==='endnotes'`) | endnote pages {columns of notes, heading} | dom-renderer (type 'endnotes' :1353), numbering | authority | legacy: endNoteTokens → own endnote pages (`endnotePagesBuilt`, referenced :3696) | Conditional (endnotes mode only; default mode is footnotes :142) |
| 17 | Folio numbering | decoration/folio.js:`assignNumbers` (pipeline.js:814; fn :95) + `tocPageLabel` (:81) + decoration/numbering-audit.js:`auditNumbering` (:824) | pages, settings | `numbers[]` → `pg.pageNumber/folioDisplay/pageNumberDisplay` | renderer, headers, TOC labels | authority | legacy: gematria folios in flow (`toGematria` :85; final numbering :3101ff) | YES |
| 18 | Headers | decoration/headers-builder.js:`buildHeader` (pipeline.js:867; fn :113; ctx built :844–864 incl. first/last word, opensWithHeadingLevel) | pages, metadata, settings | `pg.header` | dom-renderer, geometry-projector | authority | legacy: `setHeader`/headerSlots (legacy-imud-flow.js:1165) + resolveHdrSlotText (imported :29) | YES |
| 19 | Legacy-compat TOC model | toc-builder.js:`buildTocEntries`/`splitGeneralDetail` (pipeline.js:875–892) | headings, numbers | `result.toc` {general,detailed} | UI/testing tab | adapter (≤S8 compat) | — | YES |
| 20 | Content-preservation proof (BRZ-15/D-30) | pipeline.js:894–1033 word multiset src-vs-out (scrubForCompare :900, explodePlaceholderWord :908, srcWordsOf :928, outWordsOfAll :961) + marker consistency :1036–1107 + parenRanges population :1117–1173 | tokens, blocks, pages, notes placements | `contentPreserved`, mismatchDetail, `pg.parenRanges` | report/ledger | authority (audit) | legacy: `contentStats` closure (legacy-imud-flow.js:3503–3589) | YES |
| 21 | Ledger finalize + **CP5** | pipeline.js:1175–1185: `layoutHash(pages)` (dp-planner.js:45), eventLog emit, `prog('render',100)` | pages | `layoutHash`, `plannedLayoutHash` (=planned.hash :1212) | status strip, determinism tests | authority | legacy: `legacyLayoutHashDigest` (legacy-imud-flow.js:3706) | YES |
| 22 | Editing recommendations (S11) | audit/editing-recommendations.js:`computeEditingRecommendations` (pipeline.js:1191–1195; skipped when `env.noRecommendations` — export sets it :122) | rawText, pages, ledger | `result.recommendations` | testing tab, applyRecommendation (app-shell.js:569) | authority | legacy: returns null (:3697) | YES (live UI only, not in PDF export) |
| 23 | **Render — live DOM** | output/dom-renderer.js:`renderPage` (:1313; legacy dispatch :1318 → `renderLegacyPage` :683) called from ui/preview-tab.js:10 and app-shell.js:535 (light refresh) | result.pages, settings | DOM elements | preview tab | **adapter** (display) | — | YES |
| 24 | **Render — standalone HTML** | output/export-api.js:`exportHtml` (:55; renderPage :63, html-export.js:`buildStandaloneHtml`) — runs in UI thread (app-shell.js:634–641) | result, settings, doc, fontCss | HTML string | download | adapter | — | YES |
| 25 | **Projector — PDF only** | export-api.js:`exportPdf` (:92): re-`typeset` with font-metrics (:122) → **`result.legacyProfile ? legacy-projector.projectLegacyDocument (737) : geometry-projector.projectDocument (816)`** (export-api.js:135–137) → font-subset (typography/font-subset.js via :97,:153) → output/pdf-writer.js:`writePdf` (:212, called :426) with up to 6 role fonts + dynamic family fonts (:192–425) | result, settings, fontBytes | `{ok, bytes, info{outline,tocLinks…}}` | browser download via worker `export-request`; Node tests | **adapter** (geometry) | — | YES (PDF only) |
| 26 | **Project ZIP** | export-api.js:`exportProjectZip` (:485; project-io.js exportProject :488, zip-writer.js buildZip :487, extensions-io :489) | text, settings, extensions | ZIP bytes | worker export / tests | adapter | — | YES |

### LEGACY PATH stage list (condensed; all in legacy-imud-flow.js unless noted)
| # | Stage | line | Notes |
|---|---|---|---|
| L1 | Config | `readConfig` :205 (called :872) | reads `_imudRaw` (~12 live keys: hdr-r/c/l-type, note-marker-size…) + merged settings; footnotes-enabled=false empties fn delimiters :876 |
| L2 | Font setup | :946–1045 | `resolveMeasureImpl`; env-injected fonts (marginFontBytes/windowFontBytes/headingFontBytes/prefaceFontBytes :950–976); per-purpose MeasureAPI instances (preface/fn/mark/window/heading, `fontApiFor` :1042) |
| L3 | Tokenize | `tokenizeDoc` :303 | own grammar; metadata :132; strip editorial :111 |
| L4 | Line breaking | `LineBreaker` :407 (splitWords :451, greedy fit w/ FIT_EPS=0.75 :406) | **not KP**; window-word (FrankReal 1.5×) :442; headings in DavidLibre-Bold `hw` :432 |
| L5 | Sections | :1107–1127 | h1→sub_shaar, h0/h2→new_page, else inline (HEADING_MODES) |
| L6 | Shaar pages | gateLinesFor :1174 (wrapped, per-font :1187–1214) | main/sub/back from metadata |
| L7 | Section flow | `flowSection` :1319; stack fill 2-col RTL :1515; marker extraction + stretch/compress/tail-pull :1621–1799; page split rules :2835–2925; `layoutStack` :2952 (explicit y); `placeFootnoteArea` :2497 (bottom-anchored, body-first S75 :909–936, split/continuations, `flushPendingFootnotes` :3062) | self-contained planner |
| L8 | Endnote pages | endNoteTokens → built pages (see :3696) | own layout |
| L9 | Double TOC + final numbering | :3101–3170ff (`makeTocPages` :3134; gtoc/dtoc level lists S77 :3111–3119) | gematria folios |
| L10 | Hash | `legacyLayoutHashDigest` :3706 | sha256 over type+folio+lines |
| L11 | Content accounting | :3503–3589 | multiset, reports `content-loss` ledger |
| L12 | Ornaments + gate design | `planLegacyOrnaments` :3597 (decoration/legacy-ornaments.js:119); hard-coded shaar frames/hdr-rule decorations :3624–3683 | overlay after hash (T1) |
| L13 | Result | :3685–3699 | same result contract incl. real EventLog/Ledger (S4.10 :3482–3492), `legacyProfile: true`; `retreat/sideNotes/endnotePages:null` |

---

## 4. WORKER BUNDLING (tools/build-worker-bundle.js)

- Two bundles, both committed to git under `red-build/ui/` (build-worker-bundle.js:17–35):
  - **`ui/engine-worker.bundle.js`** — entry `src/ui/engine-worker-main.js`, `exclude: []`, `skipNodeOnly: false` → contains the **entire engine**: pipeline, dp-planner, legacy-imud-flow, both projectors, pdf-writer, zip-writer, export-api (node-only requires INCLUDED), kp-linebreak, measure-*, decorations, parsers, notes, extensions, audit/report-schema, stage-snapshots (verified by extracting `__modules[...]` keys from the built file). Ships `SHA256_SHIM` (:38) and `BUFFER_SHIM` (:123) so `crypto` and `Buffer` work in the Worker (PDF/ZIP export in-browser).
  - **`ui/app.bundle.js`** — entry `src/ui/browser-entry.js`, excludes `src/ui/inline-transport.js` (replaced by throwing stub — verified in bundle), `skipNodeOnly: true` (PDF/ZIP heavy paths not bundled). Contains app-shell, tabs, imud-library, legacy-settings-map, **docx-import + xml-lite + zip-reader (DOCX import in UI thread)**, dom-renderer, html-export, export-api (HTML only), plus dp-planner pulled in transitively via `audit/report-schema.js` (report builder required by worker-protocol — see `__paths["src/audit/report-schema.js|../engine/layout/dp-planner"]`).
- `crypto`/`zlib` requires are shimmed/null (:360–362); non-relative requires are rejected (:363).
- Node-only marker parsing is strict same-line prefix `/* node-only */` (:331–336) — a comment mentioning the marker no longer skips the require (03.11 fix documented :325–330).

---

## 5. DEAD / DISCONNECTED PATHS FOUND (with evidence)

1. **`geometry-projector.js` + `legacy-projector.js` are NOT on the live-view path.** Only callers: export-api.js:98,136,137 (PDF). The claimed "Planner → Projector → DOM" is false; DOM renders from the pages model directly (dom-renderer.js:1313). Projectors are PDF-export adapters.
2. **`typography/kp-linebreak.js` (Knuth-Plass) is dead in the legacy profile** — legacy uses its own greedy `LineBreaker` (legacy-imud-flow.js:407). Since legacy is the product default, KP runs only when assets are missing/RED-default profile or in tests. Conversely the whole DP stage chain (dp-planner, retreat-loop, protections-matrix, candidate-generator, balancing, ordering, column-flow, footnote-budget, side-notes, endnote-pages, shaar-pages, toc-builder, headers-builder.buildHeader, ornament-plan, dropword, protectors, headings-escort, dfa-lexer/block-tokenizer/bracket-scanner) **never executes when `_layout-profile==='imud'`** (pipeline.js:123 returns before CP1).
3. **`engine/decoration/assets-import.js`** (`importAssetFolder`, `wrapShaarMedia`, …) — required by nothing in `src/` or the UI; only tests/e2e/s8-decoration.test.js. Disconnected from the product (no UI imports an asset folder).
4. **`layout/balancing.js:balancePage`** — exported (balancing.js:287) but superseded by `optimalSplit` (dp-planner.js:170,584) + `balancePageSafe` (dp-planner.js:571); only consumer is tests/layout/ext8-optimal-balance.test.js. Dead in product.
5. **`geometry-projector.js:attachBaselines`** (export :878) — zero consumers in src/ and tests (rg over repo: no hits outside geometry-projector itself). Dead export.
6. **`decoration/shaar-pages.js:buildPickerModel` / theme-sets.js groupThemeSets etc.** — only consumed by tests (s8-decoration.test.js:14,188); the live settings-panel builds its pickers through imud-library listDesigns/ensureThemeSet instead.
7. **`pipeline.js page-scoped marker renumber`** (pipeline.js:605–613) — gated on `footnote-reset-policy==='page'`; registry default is `section` (grep settings-registry.js reset policy default) → never triggers with defaults.
8. **`autoQualityPass`** (pipeline.js:671) — gated `aq-enabled` default false (:178). Present, wired, default-off (not dead, dormant).
9. **`endnote-pages.js` + endnote branches of pipeline** — only when `note-placement-mode==='endnotes'` (default footnotes). Dormant by default.
10. **`measure-impl:'table'`** — nominal default, but `resolveMeasureImpl` upgrades to font-metrics whenever body-font is registered (measure-api.js:238–241, EXT-13). In the deployed app fonts are registered at boot, so impl A tables are effectively a fallback only.
11. **`importProjectZip`** (export-api.js:514) — Buffer-gated, no UI wiring found for importing a project ZIP in the browser UI (only export buttons — preview-tab.js:111–113). AMBIGUOUS: possibly intended for Node/tests only.
12. **`ui/inline-transport.js`** — intentionally stubbed out of the browser app bundle (throwing stub, verified in app.bundle.js); used only in Node tests (s10-ui.test.js). Not dead — by-design test transport.
13. **`audit/scanners.js`** — dev/test-time contract scanners (consumed by tests/integration/registry.test.js and tools/scan-control-triggers.js via package.json `test:scan`); not part of the runtime product path (by design).
14. **Legacy `env.marginFontBytes/windowFontBytes/headingFontBytes/prefaceFontBytes`** (legacy-imud-flow.js:950–976) — the live app registers these fonts via worker `register-font` messages instead (imud-library.js:345,379,131); the env-bytes path is exercised by export/tests only. Not dead, alternate injection.

### Notable NON-dead but easily-mistaken items
- `dom-renderer.renderPage` handles BOTH page models via the `page.legacy` flag (dom-renderer.js:1318) — the "two engines, one renderer" seam.
- `serializeTypesetResult` (worker-protocol.js:28) works for both engines because legacy now returns real EventLog/Ledger (legacy-imud-flow.js:3482–3492, S4.10 fix).
- `exportPdf` always **re-typesets** (export-api.js:122) with `measure-impl:'font-metrics'` — the exported book can differ from the live preview if the live run used table metrics without registered fonts.

---

## 6. AMBIGUITIES

1. **Which engine "the product" means**: git-tracked bundles exist, but I did not run the deployed app; the legacy-default claim rests on browser-entry.js:160–202 boot chain + the presence of `red-build/ui/assets/imud/` (asset dir exists per imud-library BASE path and DESIGN_FILES). If assets are missing in some deployment, that deployment silently runs the DP engine. AMBIGUOUS-by-environment.
2. `pickBinaryFile`/`onRequestDocxImport` — DOCX import is UI-thread by code, but I did not find a size guard; a huge DOCX could block the UI thread (not a path question, noted).
3. `settings-panel.js:362 loadSettingSet` applies style-sets (תלמוד/פרשנות/קונטרס) — these also flow through `importImudSettings` and would set `_layout-profile='imud'` if the set JSON contains the three marker keys (same detector, legacy-settings-map.js:448–451); I did not inspect the JSON contents of `assets/imud/setting_sets/*.json`. AMBIGUOUS whether a style-set can flip the engine.
4. The `zlib` null-shim in bundles (build-worker-bundle.js:361) routes zip reading to a pure-JS inflate in `zip-reader` — used for DOCX import in the UI bundle; I did not deep-verify the inflate fallback parity.

---

## 7. CONDENSED REAL RUNTIME PATH (for the report)

**Browser, default boot (assets present):**
`textarea/paste|import-txt|docx→importDocx(UI thread)→text` → ⚡/document-action → `WorkerEngineClient.requestTypeset` → worker `typeset-request` → `typeset()` → **[pipeline.js:123 `_layout-profile==='imud'`]** → `legacyTimeset()` (own tokenizer, greedy LineBreaker, flowSection planner, placeFootnoteArea, makeTocPages, legacyLayoutHashDigest, planLegacyOrnaments) → result (pages tagged `legacy:true`) → serialize → `renderPage→renderLegacyPage` (DOM). PDF: worker `export-request` → `exportPdf` → re-typeset (legacy) → `projectLegacyDocument` → `writePdf`. HTML: UI-thread `exportHtml` → `renderPage→renderLegacyPage` → `buildStandaloneHtml`.

**Fallback/DP profile (no assets / tests):**
`typeset()` → CP1 `lexDocument+tokenize` → `scanBrackets` → `MeasureAPI(table|font-metrics)` → block loop (`protectWords`, KP `layoutLines`→kp-linebreak.breakLines, dropword, applyHeadingModes) → CP3 `planPages` (footnote-budget probe==reserved, optimalSplit balance, split/move/reject notes) → `runProtections`+`runRetreatLoop` → `insertShaarPages` → chapter-end/alignColumnBottoms/AQ(off) → toc-builder pages → CP4 `placeSideNotes`+`planPageOrnaments`+`buildEndnotePages`(endnotes mode) → neutrality proof → `assignNumbers`+`auditNumbering` → `buildHeader` → integrity proofs → `layoutHash` → recommendations → DOM via `renderPage` (DP branch). PDF: `projectDocument` → `writePdf`.

**Key selection flags:** `_layout-profile='imud'` + `_imudRaw` (pipeline.js:123; set legacy-settings-map.js:452–453; default ON via boot browser-entry.js:167+app-shell.js:203). Secondary: `result.legacyPage/page.legacy` (export-api.js:135, dom-renderer.js:1318), `measure-impl` (settings-registry.js:307 + silent upgrade measure-api.js:237–242), `note-placement-mode` (settings-registry.js:142).
