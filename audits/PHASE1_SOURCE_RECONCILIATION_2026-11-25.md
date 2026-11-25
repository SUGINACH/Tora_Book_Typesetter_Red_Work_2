# Phase 1 — Source Reconciliation and Current Code Findings

**Repository:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**Branch:** `engine/legacy-parity-preview-20261119`  
**HEAD audited:** `bd5a6b76b07ef3adc4ba0f66309c522d83b826b5`  
**Date:** 2026-11-25  
**Status:** partial reconciliation; Phase 1 acceptance remains open.

## 1. Current CI and deployment baseline

- CI `45632270583`: success — Layout Audit, Node 18/20/22, 1,174 tests per matrix, Determinism and Cross-check.
- Full Math Audit `45632270620`: success locally; live/browser audit skipped.
- Corpus Invariants `45632270577`: success.
- Preview Engine Parity `45632270612`: success.
- Pages deployment `45632354037`: success.
- `gh-pages` HEAD: `ab16c4f0c07f1e15749be13350b896dd18c90b3d`; `build-info.json` reports Unified from source `bd5a6b76b07ef3adc4ba0f66309c522d83b826b5`.
- Git blob SHA equality for index, CSS, app bundle and Worker bundle is recorded in `audits/PHASE1_RUNTIME_TRUTH_SNAPSHOT_2026-11-25.md`.
- Browser E2E, live HTTP/CDN verification, console/network/Worker trace, and zero-legacy runtime proof remain unverified.

## 2. Current source-code findings

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

## 4. Twenty historical requirement topics — coverage map

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

## 5. Source hierarchy and authoritative decisions

1. Latest explicit user instruction takes precedence over old handoffs.
2. Approved user decisions in `DECISIONS.md` remain binding until explicitly changed.
3. `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` is the single active execution plan; five prompts are sequential packages for one agent, not permission for concurrent work.
4. `spec/03_UNIFIED_ITEM_CONTRACT.md`, Master Spec and SRS provide contract/requirement history, subject to later decisions and open questions.
5. Old audits and prior “complete” states are historical evidence only until retested on the current HEAD.
6. Code presence, POC success, a green workflow or a `profile=unified` label cannot alone close a product requirement.

Keep these boundaries: P6/P7 are out of scope; the old reference PDF is not a quality target; Kit 40 and original gates remain active by default; do not change font/geometry/defaults without authority; do not mass-convert fonts; keep F7 blocked until shaping/fonts stabilize; do not delete legacy code until the Unified path has been proven.

## 6. Phase 1 gate

**Passed:** automated CI, corpus invariants, local full-math, preview build/deploy and Git artifact identity.  
**Partially evidenced:** Unified source-level dispatch and current settings/binding inventory.  
**Still open:** live browser runtime proof, zero-legacy trace, actual UI and export behavior, complete candidate-file content review, full scan of Text-ID coupling, and same-input DOM/HTML/PDF parity artifacts.

Do not advance to Phase 2 acceptance until the remaining Phase 1 acceptance evidence exists. Shaping work can be specified and audited, but it must not be represented as production complete.
