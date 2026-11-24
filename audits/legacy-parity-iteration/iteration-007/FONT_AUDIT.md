# Iteration 007 — Font inventory audit

**Run:** [font-catalog-audit #2](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45359715290)  
**Audited commit:** `2ee9724e9c9eb03cdb0cfe4858a426fc4be3aa18`  
**Artifact:** `imud-font-catalog-audit-2ee9724e9c9eb03cdb0cfe4858a426fc4be3aa18` (artifact ID `14903259129`)  
**Workflow conclusion:** success.

## 1. Inventory results

The two catalogs contain 1,766 entries, but eight entries are aliases/duplicate file references. The audit opened **1,758 unique font files**.

| Measure | Result |
|---|---:|
| Core catalog entries | 451 |
| Extended catalog entries | 1,315 |
| Unique physical font files | **1,758** |
| Source SFNT files | 443 |
| Source WOFF2 files | 1,315 |
| Parse failures in FontTools | **0** |
| TrueType glyf/loca outlines | 1,378 |
| CFF outlines | **380** |
| CFF2 outlines | 0 |
| Variable fonts | **83** |
| Full 27-letter Hebrew alphabet | 1,561 |
| Partial Hebrew alphabet | 17 |
| No Hebrew letters | 180 |

There are no family-name collisions between the two catalogs.

### 1.1 Outline and Hebrew coverage

| Outline | Total | Complete Hebrew | Partial Hebrew | No Hebrew |
|---|---:|---:|---:|---:|
| glyf/loca | 1,378 | 1,183 | 16 | 179 |
| CFF | 380 | **378** | 1 | 1 |

The CFF issue is not marginal: **378 of the 380 CFF files include the complete Hebrew alphabet**. The current `font-subset.js` requires `glyf/loca` and returns `no-glyf-loca` otherwise. Consequently, the existing PDF writer cannot subset/embed most CFF fonts, even though the browser can display them.

Of the 380 CFF assets, 279 are WOFF2 sources and 101 are already SFNT sources. WOFF2 decompression alone will therefore not solve CFF support.

### 1.2 Variable fonts

All 83 variable files have TrueType `glyf` outlines, but each has one or more variation axes.

- 47 include the complete Hebrew alphabet.
- 15 have partial Hebrew coverage.
- 21 have no Hebrew letters.
- All 83 expose GSUB and GPOS tables in the inventory.

The variable fonts require a deliberate axis policy. The system must preserve the source face/axis identity and pin explicit coordinates for every generated static instance. Where a setting exposes weight or width, that selected coordinate must flow into both shaping/measurement and rendering. An undocumented default-axis instance is not an acceptable substitute.

### 1.3 OpenType layout data

Across the complete inventory:
- 1,245 files expose GSUB.
- 1,306 expose GPOS.
- 1,239 expose both.

These counts are another reason why hmtx-only width lookup cannot serve as the final typography/shaping contract. The audit records presence of tables; it does not claim that the current custom parser fully implements their behavior.

## 2. What this proves — and what it does not

The successful audit proves that FontTools can decode/open the 1,758 source files and that the reported table/outline/coverage inventory is reproducible.

It does **not** prove:
- that the current JavaScript `font-metrics.parseFont` accepts WOFF2 (it does not; it expects SFNT);
- that the current parser implements all shaping/layout behavior in GSUB/GPOS;
- that CFF files can be embedded by the current PDF subsetter;
- that browser, PDF and measurement choose identical variable-axis coordinates;
- that all 1,758 files are appropriate Hebrew body fonts. Some are Latin-only, symbol/logo or decorative assets and must remain classified by usage rather than silently rejected.

The metric `metricsCandidatesAfterSfntDecode=1758` means required metric tables were found in the decoded FontTools view; it is not a test of the current JavaScript runtime parser.

## 3. Required implementation path

### Stage F1 — Conversion pipeline

1. Add a repository-relative, deterministic build pipeline for every WOFF2 asset. The input file, alias, source hash, decoded SFNT hash, output format, source license and conversion settings must be recorded in a generated manifest.
2. Keep browser WOFF2 assets for compact display delivery where appropriate, but provide the exact decoded/converted SFNT bytes to the Worker for measurement and to the PDF path for embedding.
3. Keep the 443 current SFNT sources intact. Do not overwrite source assets.
4. Instantiate variable fonts at explicit axis coordinates before metrics, shaping and PDF subsetting unless the full runtime path is extended to preserve and apply axes consistently.
5. Treat conversion failures as fatal for a selectable text font. Never mark a catalog entry fully supported merely because FontTools opened it.

### Stage F2 — CFF to TrueType/PDF support

There are two valid engineering routes:

- extend the PDF writer/subsetter to embed/subset CFF/CIDFontType0 correctly; or
- convert CFF outlines to TrueType quadratic outlines using a bounded, recorded curve tolerance.

The second route is available in FontTools' `cu2qu` library, which converts cubic curves to quadratic curves under a caller-specified error tolerance. This conversion is not mathematically byte-identical to the original outlines; the tolerance must be selected, documented and validated using outline/raster comparisons. No mass conversion is authorized before a representative sample passes glyph-shape, metrics, Hebrew/marks and PDF-raster tests.

### Stage F3 — One shaping engine

Evaluate HarfBuzzJS as the candidate shared shaper. Its current documented API exposes glyph IDs, clusters through glyph infos, and glyph positions (x/y advances and offsets), and `glyphToPath` can expose SVG outlines. The same shaped runs must feed line-breaking and all projections; relying on the browser to shape the raw text again would reintroduce a second shaping authority.

The initial integration proof must cover:
- Hebrew with niqqud and cantillation;
- base/mark attachment and combining marks;
- GSUB substitutions and ligatures where present;
- mixed Hebrew/Latin/digits/punctuation;
- parentheses and bidi ordering;
- fallback runs across fonts;
- variable-font coordinates;
- identical run data in Worker/Node and browser Worker.

HarfBuzzJS is a candidate, not yet an accepted dependency. Verify its exact package version, license, exported API, WASM initialization/worker compatibility, feature support and deterministic behavior in this repository before adopting it.

## 4. Acceptance requirements

A font is `fully-supported` only when it has all relevant statuses:

- source hash verified;
- deterministic SFNT/instance build verified;
- supported outline type for measurement and PDF;
- complete glyph inventory for its declared usage scope;
- explicit variation-axis policy;
- Worker registration succeeds and resolves to a content-addressed font identity;
- shaping and metrics tests pass;
- DOM/HTML/PDF output uses the same font identity and shaped glyph runs;
- PDF subset round-trip and raster comparison pass.

The font picker must not imply full document support for a face that only works in browser preview. Any unsupported font must have an explicit state/reason; no silent table-metric fallback is acceptable for an active layout font.

## 5. Sources

- [HarfBuzzJS official documentation](https://harfbuzz.github.io/harfbuzzjs/) — JavaScript/Node shaping API, glyph IDs, positions and SVG glyph paths.
- [HarfBuzzJS npm package](https://www.npmjs.com/package/harfbuzzjs) — published package version and TypeScript declarations.
- [fontTools cu2qu documentation](https://fonttools.readthedocs.io/en/latest/cu2qu/index.html) — cubic-to-quadratic outline conversion and tolerance.
- [fontTools variable-font instancer](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html) — static instantiation at explicit axis coordinates.

## 6. Next action

Do not convert all fonts blindly yet. First implement a deterministic conversion/shaping proof on a representative matrix containing:
- a WOFF2/glyf font with full Hebrew;
- a WOFF2/CFF font with full Hebrew;
- an SFNT/CFF font with full Hebrew;
- a variable Hebrew font with weight/width axes;
- a partial-Hebrew decorative font;
- a Latin/symbol-only catalog entry.

Only after the proof validates glyph outlines, metrics, shaping, PDF subset and three-renderer parity should the pipeline be expanded to all eligible assets.


## 7. Conversion proof — current checkpoint (24.11.2026)

### 7.1 First repository pilot

The first seven-font proof run (commit `dbdb9e6777b7a4893f85b3805f97f65723319296`, Actions run `45360752254`) reported:

- Passed: WOFF2/glyf full-Hebrew, SFNT variable/glyf, WOFF2 variable/glyf, Latin-only.
- Failed: WOFF2/CFF full-Hebrew, SFNT/CFF full-Hebrew, partial-Hebrew CFF decorative.

The initial failure was in the **proof's validation**, not the parser or PDF subsetter: CFF fonts commonly have `post` format 3.0, which does not store glyph names. After conversion, FontTools may reconstruct different glyph-name strings from the cmap while the numeric glyph IDs remain in the same order. Comparing source and output glyph-name strings incorrectly rejected a valid stable-GID conversion.

### 7.2 Root-cause correction

The proof now:
- explicitly leaves converted CFF fonts with `post` format 3.0;
- compares each Unicode codepoint's numeric GID before/after conversion;
- compares hmtx advances by numeric GID, not by regenerated glyph-name strings;
- compares glyph-outline bounding boxes by GID after save/load;
- requires unchanged glyph count, cmap-to-GID mapping, advances and save/load bounds (0.01 font-unit tolerance).

The first correction still exposed the same naming issue in hmtx validation; the subsequent correction changed that check to numeric GID order. A small O(n²) issue in the outline-bound audit was also removed by calculating the bounds table once.

### 7.3 Independent local algorithm check

Using the installed FontTools 4.63.0 and a local CFF OTF test font (not a repository asset), I reproduced the format-3 naming behavior and validated the corrected GID-based checks:

- 1,122 source/output glyph slots;
- 1,096 Unicode mappings preserved exactly by GID;
- all hmtx advances preserved by GID;
- maximum outline bounding-box difference after SFNT save/load: 0;
- valid glyf/loca TrueType SFNT output.

This validates the algorithmic correction on one CFF font, but does not substitute for the repository samples.

### 7.4 Pending repository rerun

The corrected seven-font repository proof, including the GID-based advances/bounds checks, is queued at Actions run `45361667245` for commit `347037b12fd5f9006183b4065aee99ebdb2777bc`. At the latest independent poll it had not started; therefore no pass/fail conclusion is recorded for the corrected repository pilot.

The `preview-engine-parity` workflow for that same commit completed successfully. Other CI workflows were still queued at the latest poll.

**No production font catalog, runtime loader, font bytes or PDF writer has been changed.** Mass conversion remains blocked until the corrected repository pilot passes and its output outlines are visually inspected at renderer level.
