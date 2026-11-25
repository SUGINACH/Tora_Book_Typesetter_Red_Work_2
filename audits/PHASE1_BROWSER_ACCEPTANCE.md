# Phase 1 — Live Browser Acceptance Record

**Date:** 2026-11-25 (Asia/Jerusalem)  
**Repository:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**Source branch:** `engine/legacy-parity-preview-20261119`  
**Source commit:** `a3ff4bd43f5fabf50a4c06d27a8b0ba5f83b29bb`  
**Public URL:** `https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/`  
**Workflow:** `preview-engine-parity`, run `45690980894`, live-audit job `139477030218`  
**Artifact:** `full-math-audit-live`, artifact ID `15059331180`  
**Result:** **PASS for the scoped public-root typeset, PageModel, virtualization, HTML/PDF export and determinism path. Not full Phase 1 acceptance.**

## Test method

The workflow waits until the public `build-info.json` served over HTTPS reports the exact checked-out source SHA. It then rebuilds the app and Worker bundles from that exact checkout, launches a real headless Chrome browser, opens the public root URL and verifies the real HTTP-delivered app/Worker bytes against the independent build. It injects the long corpus into the application's actual textarea, invokes the explicit re-typeset handler, waits for a new generation and audits the live PageModel and virtualized preview. Finally, it exports standalone HTML and PDF from the already-typeset PageModel and runs a second typeset for determinism.

The URL contained a cache-busting timestamp only. The test did not rely on a preview subpath or an engine-mode query parameter.

## Deployment and bundles

Pages `build-info.json` identified source commit `a3ff4bd43f5fabf50a4c06d27a8b0ba5f83b29bb`, branch `engine/legacy-parity-preview-20261119`, profile `unified`, build time `2026-11-25T20:03:36Z`. Pages branch HEAD at evidence capture: `921af83d1a965748e2c8a9f3914fd012f43a7292`.

| Asset | Live HTTP SHA-256 | Independent exact-source build SHA-256 |
|---|---|---|
| `app.bundle.js` | `f17bb4afe11ab245a4b29b998eb5fb010d3446cf4546a55441ad46706e506c02` | identical |
| `engine-worker.bundle.js` | `b5f1217059041c22eba204d4b74f7523552c38d750170274935cf3d6f79b1540` | identical |

Asset version: `2026-11-25-unified-settings-guard1`. The live audit reports `assets.mode=live-http` and `assets.match=true`.

## Input and PageModel

Fixture: `audits/very_long_test_text.txt`.
- Raw fixture: 3,403,990 bytes; SHA-256 `f6c6b3aa0422fc621fb5827533770fc6fe7b170234382670690483e89cc6a1fc`.
- The textarea normalizes 5,701 CRLF line endings. Browser input: 3,398,289 bytes, SHA-256 `91fe1a2fd616e1fd344b8c62ac1a6349b1bcec424cf5745792ade2976b47b17e`. The test verified the browser input against the normalized fixture.
- Effective settings: 264 keys; `_engine-force-unified=true`; canonical settings SHA-256 `654391c7c2c61095c6ed7ef52d58511ace6774c861a6c39c042071822cc79686`.
- PageModel: `pagemodel-v1`, 691 pages, 5,678 tokens, zero diagnostics, zero materialization fallbacks and zero unresolved referenced resources.
- Layout hash: `51a476d5e13e20fc653117469146a8cb581a8e39721ac30758ae9d545e5a7d35`.
- Geometry hash: `b11bd54934b55627ae980262222632fe35d62cb5105a800171910e1fc17f8bee`.

## Full Math and live browser measurements

- 691/691 pages and slots; 44,360 lines; 360,356 words; 0 problems.
- 42,103 column lines; 131 spanning lines; 2,096 structural lines; 30 gate lines.
- 672/672 body pages had headers.
- 232 virtualized scroll/sweep steps (about 22.4 seconds).
- RTL sample checks: 634 OK and 0 bad.
- Font checks for Frank Ruhl Libre, David Libre and Noto Serif Hebrew succeeded.

## Exports and repeatability

| Artifact | Page count | Bytes | SHA-256 |
|---|---:|---:|---|
| `live-book.html` | 691 | 66,072,420 | `739784babfd70dc139086af39df5a7f024bdb15a9493633c80b9429af91d24d8` |
| `live-book.pdf` | 691 | 21,141,875 | `c273b8293f5c54e36364d89f5d06eb19a7f909361bf609ffb56752d080f028fa` |

PDF extraction contained 1,507,214 Hebrew characters. Export did not mutate the live layout. The second live run returned the same layout/content/geometry hashes; geometry diff count was zero, and all recorded setting/value fingerprints were identical.

## What this evidence proves

It proves that the normal public root route, at this commit, loaded the exact app and Worker build; the real browser executed the forced-Unified typeset path and returned a PageModel; the large corpus completed the full browser math/virtualization audit with zero findings; both exports succeeded from the existing PageModel; and the same input/settings yielded deterministic results across two runs.

## What this evidence does not prove

1. It does not supply a function-level counter or runtime trace proving zero calls to `legacyTypeset`, `legacy-imud-flow` or every legacy helper. The source still contains a generic legacy dispatch path for unforced callers.
2. It is not a manual interaction test of every import method, settings panel/control, editor action, TOC navigation/link, or user workflow.
3. It is not a complete DevTools console/network/MIME/404 audit of every resource.
4. Same PageModel/page count/geometry hash does not prove identical glyph IDs, positions, offsets, shaping, line rendering or pixels between DOM, HTML and PDF. DOM/HTML still shape text in the browser; PDF still maps characters to glyph/CID. The two exported artifacts were captured, but a same-page glyph/visual comparison is still required.
5. It does not close the partial review of the 57 historical Library candidate files.

**Acceptance decision:** this is a verified live-browser milestone, not Phase 1 acceptance. Keep the remaining limitations open and do not report production Shaping or export parity as complete.


## 8. Direct glyph-level comparison

A same-source comparison was completed after clipping the PDF to its actual A4 TrimBox. The configured 3mm bleed expands the MediaBox/BleedBox to 216×303mm; TrimBox remains 210×297mm. This is intentional, not a page-size defect.

On physical PDF page 577 / HTML `data-page-index=576`, the FrankReal window-emphasis word `שְׁמַע` is visibly different. HTML/Chromium measures the 24px span at 38.390625px (28.79297pt); the PDF ToraWin 18pt span is 44.56796pt. The 15.775pt difference matches the raw hmtx advances of the three marks (15.759pt). Unified MeasureAPI treats those combining marks as zero-advance, but the PDF subset/writer emits per-character CIDs using raw hmtx widths. The text extractor still returns the correct Unicode word. See `audits/PHASE1_DOM_HTML_PDF_GLYPH_PARITY_2026-11-25.md` for the full metric table and code trace.

The embedded FrankReal source font has no GPOS/GSUB tables, so this particular case does not prove that subsetting removed a GPOS table. The exact browser-internal fallback placement is not isolated. The confirmed defect is the mismatch between browser-rendered mark placement/zero advance and PDF raw character advances. Do not patch with CSS or post-layout offsets.
