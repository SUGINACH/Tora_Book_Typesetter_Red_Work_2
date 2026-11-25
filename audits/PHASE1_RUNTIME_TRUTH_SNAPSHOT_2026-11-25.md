# Phase 1 — Runtime Truth Snapshot

**Checked:** 2026-11-25 (Asia/Jerusalem)  
**Repository:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**Branch:** `engine/legacy-parity-preview-20261119`  
**Source HEAD:** `51ee22e7af9b14cf7c2cb188dde454f7b3618b80`  
**gh-pages HEAD:** `c354cd4e79dd665bebb364d1cc16e88367c14a21`  
**Acceptance:** **OPEN** — live browser audit is now verified for the primary typeset/export path; zero-legacy call tracing, full interactive UI coverage, deep source reconciliation and glyph-level projection parity remain open.

## 1. Workflow evidence on this exact source HEAD

| Workflow | Run | Result | Verified scope |
|---|---:|---|---|
| CI | 45689205763 | **IN PROGRESS at snapshot** | Layout Audit passed; Node 18/20/22 full test suite, determinism and cross-check were still running. Do not report CI green until the run is completed successfully. |
| Full Math Audit | 45689205734 | **SUCCESS** | Local full-math on the exact source commit: 691/691 pages, 44,360 lines, 360,356 words, 0 problems, determinism IDENTICAL. |
| Corpus Invariants | 45689205864 | **SUCCESS** | Canonical/long-corpus invariants on this HEAD. |
| Preview Engine Parity | 45689205743 | **SUCCESS** | Full app/Worker build and deployment, then live browser acceptance on the public root URL. |
| Layout Audit (CI job) | 139469843641 | **SUCCESS** | Smoke fixture and the large 849-page corpus virtualization sweep. |

The Preview workflow's `live-audit` job was `139470102403`. It waited until Pages HTTP served this exact source SHA, independently rebuilt both browser bundles from the checked-out source, then ran the full browser audit and export capture. The uploaded evidence artifact is `full-math-audit-live` (artifact ID `15058221803`).

## 2. Pages source and browser-asset identity

Public `build-info.json` reports:
- `profile: unified`
- `branch: engine/legacy-parity-preview-20261119`
- `commit: 51ee22e7af9b14cf7c2cb188dde454f7b3618b80`
- `builtAt: 2026-11-25T19:51:19Z`
- `mode: direct-gh-pages-deploy-no-main-merge`

The live audit accessed the ordinary root URL:
`https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/`
(the audit added only a cache-busting timestamp; it did not select a preview subpath or an engine-mode query).

The real HTTP-delivered bytes matched an independent build of the exact source checkout:

| Asset | Live HTTP SHA-256 | Exact-source build SHA-256 | Result |
|---|---|---|---|
| `app.bundle.js` | `f17bb4afe11ab245a4b29b998eb5fb010d3446cf4546a55441ad46706e506c02` | same | MATCH |
| `engine-worker.bundle.js` | `b5f1217059041c22eba204d4b74f7523552c38d750170274935cf3d6f79b1540` | same | MATCH |

`ASSET_VERSION=2026-11-25-unified-settings-guard1`. The source-branch bundles were synchronized in commit `51ee22e` from the already-built/deployed exact artifacts; the D-65 expected hashes and test assertions were not changed. Git blob identity is also synchronized between source branch and gh-pages:
- app blob: `9434faf54feb9eae378db8ff57c07baccbfe08f8`
- Worker blob: `1861b0dd897f332ec11e34fe5ef9f7499cd5ff1a`

This verifies the two critical app/Worker bundles. It is not a complete audit of every HTTP response, MIME header, every font/WASM request, CDN cache behavior for all resources, or all browser console/network errors.

## 3. Live browser execution — verified scope

The audit used a real headless Chrome browser (`HeadlessChrome/158`) against the public root URL. It injected the canonical fixture into the app's actual textarea, invoked the app's explicit re-typeset path, waited for the generation to complete, and inspected the live app state and PageModel. The app ran with `forceUnified=true` and returned `pagemodel-v1`.

Canonical fixture: `audits/very_long_test_text.txt`
- raw bytes: 3,403,990
- raw SHA-256: `f6c6b3aa0422fc621fb5827533770fc6fe7b170234382670690483e89cc6a1fc`
- normalized browser input bytes: 3,398,289
- normalized/browser SHA-256: `91fe1a2fd616e1fd344b8c62ac1a6349b1bcec424cf5745792ade2976b47b17e`
- 5,701 CRLF endings were normalized by the browser textarea boundary; the browser text was verified byte-for-byte against the normalized fixture.

Live audit results:
- PageModel schema: `pagemodel-v1`
- PageModel pages / planned pages / UI pages: `691 / 691 / 691`
- Layout hash: `51a476d5e13e20fc653117469146a8cb581a8e39721ac30758ae9d545e5a7d35`
- Geometry hash: `b11bd54934b55627ae980262222632fe35d62cb5105a800171910e1fc17f8bee`
- Content hash: `e392b5e439f17e89b42960e2ddde3caf375238128cb4ab800207726eb7efee40`
- Tokens: 5,678
- Diagnostics: 0; materialization fallbacks: 0; unresolved referenced resources: 0
- Full Math: 691/691 page slots; 44,360 total lines; 42,103 column lines; 131 spanning lines; 2,096 structural lines; 30 gate lines; 360,356 words; 0 findings.
- Virtualized preview sweep: 232 steps, 22.4 seconds; 672/672 body pages with headers.
- RTL direction check: 634 observed OK; 0 bad.
- Font checks: Frank Ruhl Libre, David Libre and Noto Serif Hebrew checks succeeded; the report records the loaded font faces separately from fonts observed in the sampled body lines.

## 4. HTML/PDF export and determinism evidence

Both exports were requested from the already-typeset PageModel; the audit checked that the layout was not mutated by export.

| Output | Pages | Bytes | SHA-256 |
|---|---:|---:|---|
| Standalone HTML | 691 | 66,072,420 | `739784babfd70dc139086af39df5a7f024bdb15a9493633c80b9429af91d24d8` |
| PDF | 691 | 21,141,875 | `c273b8293f5c54e36364d89f5d06eb19a7f909361bf609ffb56752d080f028fa` |

PDF text extraction produced 1,507,214 Hebrew characters. Export audit: `exportDidNotMutateLayout=true`.

Two independent live typesets returned the same layout/content/geometry hashes and 691 pages. The determinism report records:
- `identical=true`
- `pageGeometryDiffCount=0`
- identical input, settings, per-setting hashes, registry contract, layout, geometry and content
- no changed setting keys.

**Interpretation boundary:** the same PageModel, page count, geometry fingerprint and unchanged layout across exports do not prove identical glyph IDs, glyph offsets, ink bounds, line wrapping or visual pixels between DOM, standalone HTML and PDF. DOM/HTML still shape Unicode in the browser; PDF still uses character-based glyph/CID mapping. This remains a core Phase 4 gap and a plausible architectural source of the user's reported output differences. The paired live artifacts are now available for direct visual/structural comparison, but that comparison has not yet been completed.

## 5. Unified routing — verified and not verified

Verified:
- `browser-entry.js` selects the Unified branch profile and creates a real Worker.
- `app-shell.js` injects `_engine-force-unified=true`.
- The live browser audit observed `forceUnified=true`, a valid PageModel result and the full 691-page output.
- App-shell rejects an unexpected legacy profile or missing PageModel instead of silently switching its result projection.

Not yet verified:
- There is no explicit runtime counter/trace in this evidence proving zero calls to `legacyTypeset`, `legacy-imud-flow` or every legacy layout consumer. `pipeline.js` still contains generic legacy dispatch for callers that do not set the force flag. The live route is strongly evidenced as Unified, but the requested zero-legacy-call proof remains open.
- The audit is not a full manual pass over every import method, all settings controls, editor interactions, TOC links and all file workflows.
- A complete DevTools console/network error inventory and HTTP/MIME audit for every resource has not been recorded.

## 6. Shaping is still not production-integrated

The Worker loads and requires the Unicode 18 + HarfBuzz runtime before typesetting, but this is not proof that production layout consumes shaped glyph runs. The production pipeline still creates word boxes before shaping; `measure-api.js` continues to measure strings/characters through historical metrics; LineModel/PageModel do not preserve authoritative GIDs, advances, offsets and cluster mapping; DOM/HTML re-shape Unicode text; PDF derives glyph/CID mapping by character. HarfBuzz/Unicode runtime availability and POC results must not be labelled production Shaping completion.

## 7. Acceptance status

- D-65 bundle reproducibility: **source bundles synchronized from independently rebuilt live artifacts; verification is being rerun on CI run 45689205763.** Do not close until all Node matrix jobs, determinism and Cross-check succeed.
- D-98 generator/validator: **implemented in source with unit/negative/seeded tests; current full-suite CI result still pending at this snapshot.**
- Live browser root typeset/export path: **VERIFIED for the scoped Full Math scenario** (Preview run 45689205743).
- Zero-legacy runtime call trace: **OPEN**.
- Complete manual UI/console/network acceptance: **OPEN**.
- DOM/HTML/PDF glyph-level and visual parity: **OPEN**.
- Deep historical/Library source reconciliation: **PARTIAL** (57 candidate Library items identified; not all were read fully).
- Phase 1 acceptance: **OPEN**. Phase 2 production shaping work must not be declared complete or silently substituted for the remaining Phase 1 proof.
