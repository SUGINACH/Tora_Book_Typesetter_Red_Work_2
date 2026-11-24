# ICU4X Unicode 18 → HarfBuzz shared shaping proof — 25.11.2026

## Status and evidence provenance

**Successful POC; production engine integration remains open.**

- Repository branch: `engine/legacy-parity-preview-20261119`.
- Tested code HEAD: `9e2d59d06a4eba208e5c4f69b65986651693be18`.
- GitHub Actions workflow: `shaping-runtime-poc`, run `45504394154`.
- Artifact: `14972097998`, report `shaping-runtime-poc-report.json`.
- Result string: `passed_with_raw_woff2_limitations; normalized_sfnt_supported`.
- HarfBuzzJS: `1.6.4`; HarfBuzz core: `15.0.0`.
- Itemizer/Bidi runtime: pinned `servo/unicode-bidi` 0.3.18 and ICU4X-generated Unicode 18.0.0 property data; same WASM module is instantiated in Node and a browser classic Worker.

The artifact was downloaded and its JSON report inspected directly. A green workflow status alone is not the evidence for the detailed metrics below.

## 1. Actual itemizer output is fed to HarfBuzz

The test paragraph is constructed from Unicode scalar values and has UTF-16 length 13. It contains three Hebrew text spans separated by RLE (U+202B) and PDF (U+202C) controls.

| UTF-16 source range | Text | Script | Direction | Bidi level | Treatment |
|---|---|---|---|---:|---|
| [0, 7) | `שָׁלוֹם` | Hebr | rtl | 1 | HarfBuzz |
| [7, 8) | RLE | — | — | — | non-shaping control |
| [8, 10) | `גד` | Hebr | rtl | 3 | HarfBuzz |
| [10, 11) | PDF | — | — | — | non-shaping control |
| [11, 13) | `הו` | Hebr | rtl | 1 | HarfBuzz |

The test validates the exact UTF-16 ranges and text above, the three distinct embedding levels `[1, 3, 1]`, and the two explicit Bidi_Control source runs.

The Node runner performs `resolve` and `itemizeScripts` using the Unicode 18 WASM; it does not manufacture the three ScriptRuns manually. The classic Worker independently loads the same Bidi WASM, resolves the same paragraph and creates its own itemization before shaping. Both sides therefore exercise the same itemizer API from independent runtimes.

## 2. One lossless source partition; only shapeable runs enter HarfBuzz

The integration checks that:

- `sourceRuns` is a contiguous, non-overlapping partition of all 13 UTF-16 code units, with exact text slices.
- `scriptRuns` is the projection of `sourceRuns` whose kind is `shape`.
- `nonShapingRuns` is the complementary projection; the RLE/PDF controls remain represented in the source partition but never enter HarfBuzz.
- Script, direction, Bidi embedding level, source range and grapheme range agree between each source run and its ScriptRun projection.
- The same Script with the same direction and embedding level remains one shaping run even when individual graphemes were resolved through different diagnostic statuses. This prevents over-segmentation of a marked Hebrew word.
- ZWJ/ZWNJ are not classified as Bidi_Control; their separate itemizer invariants require them to remain eligible for shaping.

Language and features are explicit inputs (`Hebr → he`, with the POC's pinned feature list). They are not guessed from Script. HarfBuzz BOT/EOT flags are set only when a run touches the actual paragraph start/end; the interior level-3 run does not falsely claim a paragraph boundary.

## 3. Engine grapheme clusters are passed explicitly

For each scalar in a ScriptRun, the POC calls HarfBuzzJS `Buffer.add(codePoint, cluster)`, where `cluster` is the absolute UTF-16 start of the ICU4X extended grapheme cluster containing that scalar.

The Buffer uses `MONOTONE_CHARACTERS`, so HarfBuzz does not perform a competing grapheme-boundary discovery pass. Output validation rejects any returned cluster that is not one of the original itemizer grapheme starts. Each shaped ScriptRun must also cover its complete source range without gaps, invalid UTF-16 or surrogate splits.

This closes the POC boundary between Unicode itemization and shaping: the itemizer owns grapheme segmentation; HarfBuzz owns substitutions, positioning and glyph clusters inside the supplied run.

## 4. Verified font and glyph results

### ICU4X-to-HarfBuzz shared-run probe

Eleven font byte streams had complete coverage for the Hebrew test paragraph and passed the shared itemization probe.

| Font | Shared-run glyphs | Bidi levels |
|---|---:|---|
| DejaVuSans.ttf | 11 | [1, 3, 1] |
| FrankRuhlLibre-Regular.ttf | 11 | [1, 3, 1] |
| Frank-Re-Regular.ttf | 11 | [1, 3, 1] |
| DavidLibre-Regular.ttf | 11 | [1, 3, 1] |
| Guttman-Rashi-Normal.ttf | 11 | [1, 3, 1] |
| Narkisim-Regular.ttf | 10 | [1, 3, 1] |
| FrankRuhlLibre-VF.ttf (max axis instance) | 9 | [1, 3, 1] |
| Ambivalenti-Regular.normalized.sfnt | 11 | [1, 3, 1] |
| FrankBasic-1-regular.normalized.sfnt | 11 | [1, 3, 1] |
| Mixtape-Bold.normalized.sfnt | 11 | [1, 3, 1] |
| Mixtape-Regular.normalized.sfnt | 11 | [1, 3, 1] |

Totals: 11/11 fully covered fonts passed; 3 shaped runs and 2 non-shaping runs per font; 118 shaped glyph instances across the shared-run probes. For every one of these fonts, output clusters remained ICU4X grapheme starts, each ScriptRun covered its full source range, and Bidi_Control controls were excluded from shaping.

### Broader HarfBuzz fixture set

- 15 font fixtures, five shaping strings per font.
- 617 shaped glyph instances across 75 cases.
- 75/75 RTL cases had monotone cluster order.
- 345 unique cluster values; 220 multi-glyph cluster groups; 272 glyph instances shared a cluster with another glyph.
- 617/617 absolute UTF-16 source ranges valid; zero invalid ranges, zero surrogate splits, zero incomplete source coverage.
- Outlines were available for 449 glyphs; all 449 had valid extents. 168 glyphs had no outline/extents; zero outlined glyphs lacked extents and zero extents were invalid.
- Explicit UTF-16 probe `A😀B`: UTF-16 length 4, clusters `[0, 1, 3]`, source offset 37 produced ranges `[37,38)`, `[38,40)`, `[40,41)`.

### Node / classic Worker parity

- Both runtimes loaded HarfBuzz 15.0.0 and the pinned Unicode 18.0.0 WASM.
- Both runtimes independently itemized and shaped the same inputs.
- Browser report: `state=passed`, `classicWorker=true`, `dynamicImport=true`, `bidiWasmLoaded=true`, `sharedItemizationProbePassed=true`, `exactNodeParity=true`.
- Full shaping JSON was compared byte-for-byte; the browser Worker report records exact Node parity for all 15 font fixtures and the 617 glyph instances.

## 5. Outline and bounds evidence

HarfBuzz SVG outline paths from the normalized SFNT were compared to fontTools RecordingPen decoded directly from the original source fonts (including original WOFF2 sources where applicable):

| Original CFF font | GIDs compared | Exact operation + coordinate matches |
|---|---:|---:|
| Ambivalenti-Regular.woff2 | 444 | 444 |
| Mixtape-Bold.woff2 | 204 | 204 |
| Mixtape-Regular.woff2 | 204 | 204 |
| **Total** | **852** | **852** |

There were zero operation-sequence mismatches, zero coordinate mismatches and zero missing outlines; all 852 source/normalized GID orders and UPEM values agreed. Maximum path-coordinate delta was zero for the canonicalized operation+coordinate comparison.

The independent analytic tight cubic Bézier bounds implementation was also checked against fontTools BoundsPen: 852/852 matches, zero mismatches/missing; maximum floating-point delta `2.2737367544323206e-13` font units. Seven unit tests passed. The parser explicitly supports SVG `M/L/C/Z` for these CFF paths and explicitly rejects an unsupported quadratic command.

Important distinction: HarfBuzz `glyphExtents` match TrueType/CFF control bounds, not always tight curve bounds. In this artifact, glyphExtents matched ControlBoundsPen 852/852, while 419 glyphs differed from true-curve BoundsPen. The contract must continue to keep `controlBounds` and `inkBounds` separate. No control box may be silently substituted for a tight ink bound.

## 6. WOFF2 limitation — explicit, not hidden

HarfBuzzJS 1.6.4 did not expose Hebrew cmap coverage for four raw WOFF2 inputs:

- `Ambivalenti-Regular.woff2`
- `FrankBasic-1-regular.woff2`
- `Mixtape-Bold.woff2`
- `Mixtape-Regular.woff2`

The existing fontTools/Brotli path separately normalized those four to SFNT; the normalized SFNT bytes were then shaped successfully. The normalization report records deterministic repeat hashes for all four. Consequently, the proof supports **normalized SFNT input**, not passing raw WOFF2 directly into HarfBuzzJS. A future RED pipeline must normalize/decode before HarfBuzz and must preserve source hash, normalized hash, converter version and variation axes; it must not label a raw WOFF2 path as supported.

## 7. What this proof does not close

This is still a POC. It does **not** mean the production typesetting engine has been changed.

Still open:

1. Convert the POC record into a production-owned immutable `ShapedRun/ShapedGlyph` contract, with font identity/hash, face index, variation axes, Script/language/direction/features, GIDs, clusters, source ranges, advances/offsets, control bounds and tight ink bounds.
2. Integrate itemization/shaping before line breaking while preserving legal grapheme boundaries. A line break that changes shaping context must reshape the line-edge run with the correct BOT/EOT context; the paragraph-level POC does not yet prove RED line-breaker behavior.
3. Carry the same shaped data through LineItem/LineModel/PageModel. The production `MeasureAPI` must stop computing one character's cmap/hmtx/kerning path as an independent competing source of width.
4. Update DOM/HTML to draw the supplied glyph IDs and positions instead of asking the browser to shape the Unicode string again.
5. Update PDF subsetting/writing to consume the same GIDs and positions, retain source cluster mappings, and build ToUnicode/ActualText for multi-character ligatures and multi-glyph clusters. The current per-character cmap/CID/ToUnicode path is not yet the common shaped-glyph path.
6. Prove full source extraction, bidi visual ordering, L3 combining-mark order, L4 mirroring, mixed Script/language/font fallback, missing-glyph behavior, variation axes, and renderer parity across the real RED layout pipeline.
7. Extend outline/ink bounds support to quadratic `glyf` paths and accumulated pen positions/offsets, including run-level coordinate transforms. The current exact ink-bounds proof is CFF M/L/C/Z only.

No production MeasureAPI, LineItem, LineModel, PageModel, DOM renderer or PDF writer was modified by this POC. `TYP-SHAPING-01` remains open until the same shaped records are used by the production line-breaker and all output targets.

## Reproduction

- Run: `45504394154`
- Artifact: `14972097998`
- Tested HEAD: `9e2d59d06a4eba208e5c4f69b65986651693be18`
- Shaping workflow now also triggers on changes under `tools/bidi-runtime-poc/**` and has a 35-minute job timeout to include the pinned itemizer WASM build.
