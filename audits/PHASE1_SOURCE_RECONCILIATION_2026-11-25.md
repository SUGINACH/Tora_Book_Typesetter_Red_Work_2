# Phase 1 — Source Reconciliation and Current Code Findings

**Repository:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**Branch:** `engine/legacy-parity-preview-20261119`  
**HEAD audited:** `51ee22e7af9b14cf7c2cb188dde454f7b3618b80`  
**Date:** 2026-11-25  
**Status:** partial reconciliation; Phase 1 acceptance remains open.

## 1. Current CI and deployment baseline

- Source HEAD: `51ee22e7af9b14cf7c2cb188dde454f7b3618b80`; branch remains `engine/legacy-parity-preview-20261119`.
- Pages source/build-info identifies the same source commit; gh-pages HEAD at capture: `c354cd4e79dd665bebb364d1cc16e88367c14a21`.
- CI run `45689205763`: **in progress at this report's capture**. Layout Audit succeeded; Node 18/20/22 full suite, determinism and cross-check had not yet completed. A green result must not be inferred.
- Full Math Audit `45689205734`: success locally on this exact source commit — 691 pages, 44,360 lines, 360,356 words, 0 findings and identical determinism.
- Corpus Invariants `45689205864`: success.
- Preview Engine Parity `45689205743`: success, including actual public-root browser audit and export capture.
- Layout Audit job `139469843641`: success, including the 849-page virtualization sweep.
- Live audit job `139470102403` compared the public HTTP app and Worker SHA-256 values against independent builds from this exact source checkout. App: `f17bb4afe11ab245a4b29b998eb5fb010d3446cf4546a55441ad46706e506c02`; Worker: `b5f1217059041c22eba204d4b74f7523552c38d750170274935cf3d6f79b1540`. Both matched.
- The deployed root served build-info with `profile=unified`, source commit `51ee22e7af9b14cf7c2cb188dde454f7b3618b80` and asset version `2026-11-25-unified-settings-guard1`.
- D-65 root cause on the preceding HEAD was stale committed app/Worker bundles. The exact rebuilt outputs were captured in CI artifact evidence, then the two bundles were synchronized from the exact Preview build in commit `51ee22e`. No expected hash or D-65 assertion was edited. The strict D-65 gate is being rerun by CI run `45689205763`.

## 2. Current source-code findings (rechecked on 51ee22e7af9b14cf7c2cb188dde454f7b3618b80)

### Live runtime evidence
The public root URL was opened by real headless Chrome from the workflow. The browser loaded the real app/Worker, executed a typeset request with `forceUnified=true`, received `pagemodel-v1` with 691 pages and completed the full math/virtualization audit. Both exact source-build bundles matched live HTTP bytes. A second typeset was identical; HTML and PDF exports were both captured from the existing PageModel and did not mutate the layout. See `audits/PHASE1_BROWSER_ACCEPTANCE.md` and `audits/PHASE1_RUNTIME_TRUTH_SNAPSHOT_2026-11-25.md`.

This closes the prior claim that no live browser E2E exists. It does **not** close the zero-legacy runtime-call trace, full manual UI coverage, complete DevTools console/network inventory, or glyph-level projection parity. The test-side content oracle imports helpers from `legacy-imud-flow` to compute expected source content; that test helper is not proof that the product typeset path invoked legacy.

### Unified dispatch and runtime
The deployed source entry configures `BRANCH_ENGINE_PROFILE='unified'`; `app-shell.js` injects `_engine-force-unified=true`; the app rejects a returned legacy profile or missing PageModel. The general pipeline still supports legacy dispatch for other callers without that flag. A live browser trace is necessary to verify what the deployed browser actually calls.

### Shaping and layout data
The runtime pins and loads Unicode 18 + HarfBuzz in a real Worker. That is a runtime-loading milestone, not production shaping. Current production path:
1. `line-items.js` builds word boxes via `buildContainerSequence/splitTextItem` before shaping.
2. `measure-api.js` measures text/characters via `measureTextWidth`, cmap/hmtx and limited kerning rather than HarfBuzz cluster advances.
3. `LineModel` and `PageModel` do not preserve authoritative ShapedRun/individual GID/advance/offset/cluster positions.
4. DOM/HTML rendering emits Unicode `textContent` for browser shaping.
5. PDF export derives subset/CID mapping from Unicode characters (`glyphIdOf(font,ch)` / `cidOf(ch)`) rather than preserving shaped GIDs and positions.
Consequently, the same PageModel currently shares layout decisions but not an authoritative shaped-glyph representation across DOM/HTML/PDF. This provides a strong structural explanation for the user's reported output differences, but does not replace a saved live comparison artifact.

### TOC requirements
- General and detailed TOC have separate enable switches, but per-level visibility is not independent: both builders use shared `toc-level-N-show`.
- Inline/collapsed mode is likewise shared through `toc-level-N-inline`.
- Exact inline presentation requirement to track: heading text black, page number dark grey, separated by the literal vertical separator `|`. No current browser/export artifact proves this presentation.
- Main TOC page title must derive from Heading 2 typography while remaining isolated from irrelevant Heading 2 content/entry settings. No proof of that isolated style scope was found.

### Settings and Text IDs

A source-level reconciliation of the current registry and generated bindings was performed:
- `settings-registry.js`: 177 literal `K(...)` declarations plus 82 generated declarations (32 for H0–H7; 36 for six recto/verso header slots; 14 for seven TOC levels) = **259 current settings**.
- `bindings.generated.js`: **259 unique binding IDs**.
- Set comparison: zero missing IDs, zero extra IDs, zero duplicate IDs in either collection.
- Imported IMUD `default_settings.json`: **265 top-level keys**. These are legacy import defaults, not additional RED registry definitions.
- The committed catalogue JSON dated 19.11 says 256 settings and is stale. `SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md` is an archived audit on an older SHA that counted 253; neither is a current source of truth.
- No separate central Text-ID registry/mapping file was found in the current source tree. `dfa-lexer.js` embeds 18 metadata identifiers in `METADATA_KEYS`, a heading grammar regex for levels 0–7, and the default endnote prefix; `en-line-prefix` is also a setting passed into the parser.
- The layout/setting sources include level-specific `heading-${h}-...` keys and explicit module consumers; a complete scan proving every planner/breaker/renderer is independent of Text IDs has not yet been performed. The user requirement for centralized semantic Text IDs and generic policy resolution remains open.

### User-reported and explicit UI requirements
- Side headings (H7) reportedly lose spaces and may overlap. Keep as user-reported / browser reproduction required; do not mask with CSS margins, font substitutions or widths.
- TOC level visibility and inline/collapsed settings must be independent for general and detailed TOCs.
- TOC inline rows: black heading, dark-grey page number, separator `|`.
- TOC title: Heading 2-derived but isolated from unrelated H2 settings.
- The user reported live DOM and exported HTML are inferior/different from PDF. Track separately from exact browser proof; the architectural shaping gap is evidenced, but no same-document live comparison artifacts were captured in this audit.

## 3. Library inventory and review depth

The Library listing was paginated to completion: **169 metadata records**. A broad filename/path filter selected **57 candidate records** associated with typesetting, project handoffs, research, historical chats, pasted logs, or related files. This is only a candidate inventory; it does not mean all 57 files were read.

Selected November 19–24 handoff/pasted files, the 12 November chat-history files, original project handoffs and research docs were found and searched/read to differing depths. There are duplicate copies of some chat-history and research files. Large text archives, ZIPs, PDFs, fonts, images, binaries and all historical worklog lines have not all been read line-by-line. The Library review is therefore partial, and requirements from any unreviewed source must remain unclosed until individually reconciled.

A historical transcript in the Library contains a string that looks like a GitHub Personal Access Token. It is intentionally omitted from this report and was not used. Revoke/rotate it if it may still be active.

## 4. Test document and fixture-path audit

D-98 is binding: `audits/very_long_test_text.txt` is the primary true long corpus; synthetic fixed/random documents are supplementary and must be structurally valid.

- Canonical primary corpus: `audits/very_long_test_text.txt`, Git blob `aa70c076ae8ed8bde6b7585a6913016cca370098`.
- CI Layout Audit uses the canonical 3.4MB corpus in its large run; Full Math uses the same path. The smoke fixture remains a separate fast preflight.
- The second file `red-build/tests/fixtures/real/very_long_test_text.txt` has a different Git blob and is not assumed byte-identical.
- The Full Math expected-content oracle imports tokenizer helpers from `legacy-imud-flow`; this is test-side accounting, not evidence that the product typeset request selected legacy.
- Current `red-build/src/ui/test-doc-generator.js` exports `validateTestDocumentStructure`. It is a read-only validator over the supplied string: it does not edit or repair its input. It diagnoses footnote-only heading text, consecutive same-level headings without body, a deepest heading closed before body, and a terminal heading without body; endnotes and footnotes alone do not count as body.
- `generateTestDocument` now validates its completed output before returning. The generator may insert real body text at generation points to construct a valid document; the validator itself only reports/errors and never mutates the document after generation.
- `red-build/tests/unit/test-doc-generator.test.js` covers valid nested headings, each invalid structural case, deterministic fixed output, deterministic explicit random seeds, 256 seeded random documents, the full fixed stress document and unseeded random preflight.
- `red-build/tests/e2e/s72-column-bottoms.test.js` expects the fixed valid stress document hash `legacy-c05df8cf2c698e4d`. The old `legacy-0861dbeab0401cf1` is retained in comments as the historical malformed-input hash, not the current acceptance baseline. This is the deliberate correction of the invalid test document; do not re-lock it to conceal a regression.
- These D-98 assertions are source/test verified, but the full CI matrix on `51ee22e7af9b14cf7c2cb188dde454f7b3618b80` was still running at this report's capture. Do not report the tests as passed until CI completes.

## 5. Twenty historical requirement topics — coverage map

| # | Historical topic | Current requirement IDs | Reconciliation finding |
|---:|---|---|---|
| 1 | Pipeline and content model | ARC-01..05 · TYP-01..05 · LAY-01 | Canonical 10-stage plan supersedes older execution ordering; ShapedRun integration is still missing. |
| 2 | Column balancing | PG-01..03 · PG-20 · LAY-11 | Active within current D-107 constraints; no post-layout stretch. |
| 3 | Sparse lines / runts | LAY-11 · LAY-03 | Active; use look-ahead/recovery, not a right-align or tracking patch. |
| 4 | Paragraph p-cut / p-end | LAY-04 · LAY-11 | Keep continuation at column boundary distinct from paragraph completion. |
| 5 | Widows / orphans | LAY-05 · PG-04 · TST-08 | Decisions and compromises must be explicit. |
| 6 | First word / Drop Word | LAY-06 | Applies only at actual paragraph start, not to a continuation segment. |
| 7 | Headings H0–H7 / side notes | LAY-07/08 · PG-06 · CFG-03/11 | Generic policy-driven behavior required; side-heading spaces/overlap need live reproduction. |
| 8 | Footnotes/endnotes/brackets | PG-05/17/21 · TST-08 | Preserve anchors, numbering, continuation, budget and bracket diagnostics. |
| 9 | Parentheses / inline spans | LAY-12 · TYP-02/03 | Preserve nested/cross-page source mapping; shaping must be cluster-aware. |
| 10 | Underfill, short pages and gaps | PG-02/03/20 | Honor approved limits; no artificial stretch of short chapters. |
| 11 | Empty columns / fallback | PG-19 · PG-04 | No empty column and no silent fallback. |
| 12 | Headers, folio, ornaments and gates | PG-22/23/25 · PG-10/16 · DEC-02 | Keep Kit 40 and original gates active by default. |
| 13 | Fonts, aliases and loading | TYP-07..11 · CFG-08 | Mass conversion not approved; F7 waits for shaping/font stability. |
| 14 | Geometry audit | TST-04 · TST-09 · UI-12 | Negative controls and source navigation required. |
| 15 | Step trace / causality | TST-09 · UI-05 · ARC-04 | Trace input→constraints→decision→reason. |
| 16 | Test generation and CI | LAY-10 · TST-01..10 | Generate structurally valid documents; maintain corpus and determinism. |
| 17 | UI, editor and preview | UI-01..12 | Preserve behavior; old screen arrangement is historical unless reaffirmed. |
| 18 | Settings, defaults and Text IDs | CFG-01..11 · EXT-03/08 | Registry/binding counts reconciled; Text IDs remain embedded and generic policy separation incomplete; Q12 open. |
| 19 | HTML/PDF and execution environment | OUT-01..06 · TYP-03 · TST-05 · DEP-04 | One PageModel is present, but no shaped glyph identity/position parity yet; browser E2E missing. |
| 20 | Cleanup, extensibility and recommendations | ARC-03/04 · TST-09 · EXT-01..08 | Remove duplicate paths only after proof; reconcile recommendation scope from historical sources. |

## 6. Source hierarchy and authoritative decisions

1. Latest explicit user instruction takes precedence over old handoffs.
2. Approved user decisions in `DECISIONS.md` remain binding until explicitly changed.
3. `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` is the single active execution plan; five prompts are sequential packages for one agent, not permission for concurrent work.
4. `spec/03_UNIFIED_ITEM_CONTRACT.md`, Master Spec and SRS provide contract/requirement history, subject to later decisions and open questions.
5. Old audits and prior “complete” states are historical evidence only until retested on the current HEAD.
6. Code presence, POC success, a green workflow or a `profile=unified` label cannot alone close a product requirement.

Keep these boundaries: P6/P7 are out of scope; the old reference PDF is not a quality target; Kit 40 and original gates remain active by default; do not change font/geometry/defaults without authority; do not mass-convert fonts; keep F7 blocked until shaping/fonts stabilize; do not delete legacy code until the Unified path has been proven.

## 7. Phase 1 gate

**Verified on `51ee22e7af9b14cf7c2cb188dde454f7b3618b80`:** source branch and public Pages build identity; real browser execution on the ordinary public root for the scoped long-document typeset path; app/Worker live HTTP SHA equality with independent exact-source builds; Unified force flag and PageModel receipt; 691-page Full Math audit with 0 findings; 232-step virtualization sweep; HTML/PDF export from the existing PageModel; repeat-run determinism with zero page-geometry differences; current source registry/bindings and imported-default counts. Local Full Math, corpus invariants, Preview live audit and Layout Audit succeeded.

**Pending / not yet verified at capture:** CI Node 18/20/22 matrix plus determinism/Cross-check (run `45689205763` was still in progress); explicit zero-legacy function-call trace; full manual UI/import/settings/TOC interactions; complete console/network/MIME/cache audit of every resource; direct glyph/line-position/visual comparison among DOM, standalone HTML and PDF; full read/reconciliation of the 57 historical Library candidate files; complete Text-ID coupling scan.

**Shaping gap remains:** HarfBuzz and Unicode runtime availability in the Worker is not production Shaping. The production pipeline still splits word boxes before shaping and measures via the existing MeasureAPI; authoritative shaped GIDs/advances/offsets/clusters are not preserved through LineModel/PageModel/projections. Keep Phase 1 open for the outstanding acceptance evidence; do not claim Phase 2 production integration complete.

