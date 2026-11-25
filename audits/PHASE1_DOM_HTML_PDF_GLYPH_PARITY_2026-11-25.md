# Phase 1 — Forensic DOM / HTML / PDF Glyph-Projection Parity

**Date:** 2026-11-25 (Asia/Jerusalem)  
**Repository:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**Source branch:** `engine/legacy-parity-preview-20261119`  
**Source HEAD audited:** `a3ff4bd43f5fabf50a4c06d27a8b0ba5f83b29bb`  
**Public deployment:** `https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/`  
**Live acceptance workflow:** Preview Engine Parity run `45690980894`; job `139477030218`; artifact `full-math-audit-live` ID `15059331180`  
**Disposition:** **Confirmed projection defect. No engine code was changed in this forensic pass.**

## 1. Scope and exact source artifacts

The comparison uses the live public-root build identified by `build-info.json` as Unified source commit `a3ff4bd43f5fabf50a4c06d27a8b0ba5f83b29bb`, not the Preview subpath and not an old local export.

The live audit captured both exports from the same already-typeset `pagemodel-v1`:
- HTML SHA-256: `739784babfd70dc139086af39df5a7f024bdb15a9493633c80b9429af91d24d8`
- PDF SHA-256: `c273b8293f5c54e36364d89f5d06eb19a7f909361bf609ffb56752d080f028fa`
- PageModel, standalone HTML and PDF: 691 pages each.
- Export did not mutate the PageModel layout.
- Two independent live typesets returned identical layout/content/geometry hashes.

The direct glyph-level sample is physical PDF page **577**, corresponding to HTML `article.page[data-page-index="576"]`. The affected emphatic word is `שְׁמַע`.

## 2. Measured discrepancy on the same word

The HTML span is:
- text: `שְׁמַע`
- class: `w w--window`
- CSS font family: `FrankReal, "Frank Ruhl Libre", David, serif`
- CSS size: `24px`
- computed weight: `900`
- Chromium measured span width: **38.390625 CSS px = 28.79296875 pt**

The PDF text span is:
- extracted Unicode text: the same `שְׁמַע`
- PDF font resource: `ToraWin` (embedded FrankReal Bold subset)
- size: `18pt`
- span bounding-box width: **44.56796265 pt**

The PDF word is therefore **15.77499390 pt wider** than the HTML word. The rendered crop shows the Hebrew combining marks displaced relative to their base letters in the PDF; the HTML browser rendering keeps the marks attached. The PDF text extractor still returns the expected Unicode string, so this is not missing source text or a ToUnicode-only problem.

### Font-metric calculation

The FrankReal font embedded in the HTML has UPM 2048. The source-font hmtx advances for the six characters are:

| Character | Source GID | hmtx advance (font units) |
|---|---:|---:|
| ש | 200 | 1261 |
| ׁ (shin dot) | 172 | 1247 |
| ְ (sheva) | 156 | 147 |
| מ | 189 | 1042 |
| ַ (patah) | 163 | 399 |
| ע | 193 | 972 |

The three combining marks have a combined raw advance of **1,793 units = 15.75878906 pt** at 18pt. The three base letters have a combined advance of **3,275 units = 28.78417969 pt**. Thus:
- HTML width (28.79296875 pt) agrees with the base-letter advances (28.78417969 pt) to within 0.009pt.
- PDF width (44.56796265 pt) agrees with all six raw character advances (44.54296875 pt) to within 0.025pt.
- The difference between HTML and PDF is effectively the sum of the three mark advances.

This is a quantitative match to the visual failure, not merely a subjective screenshot impression.

## 3. Code path that produces the contradiction

### Unified measurement

In `red-build/src/engine/typography/measure-api.js`:
- `COMBINING_MARK_RE` includes Hebrew niqqud and cantillation marks.
- `_isMappedMark()` returns true for a mapped combining mark when `_marks-advance === 'combined'`.
- The combined-mode measurement path gives such marks zero advance, matching the browser's observed layout behavior.
- `pipeline.js` sets `settings['_marks-advance'] = 'combined'` for the Unified path.

### HTML / DOM projection

In `red-build/src/engine/output/pagemodel-dom-renderer.js`, each positioned word is emitted as a text span with its font family and size, and `span.textContent` receives the full Unicode word. Chromium then performs its own text shaping/combining-mark placement for that span. The saved HTML therefore delegates the glyph-level placement to the browser.

### PDF projection

In `red-build/src/engine/output/pdf-writer.js`:
- `visualOrderRtl(chars)` operates on individual Unicode characters, not shaped grapheme/cluster records.
- `emitWord()` iterates those characters, maps each one through `cidOf(ch)`, and emits a CID sequence with PDF `Tj`.
- The descendant CID font's `/W` widths are serialized from `font.widthsUnits`.

In `red-build/src/engine/typography/font-subset.js`:
- the subset maps each requested Unicode character independently with `glyphIdOf(font, ch)`;
- its new `hmtx` and `widthsUnits` preserve the original per-glyph hmtx advances;
- there is no shaped-run input, mark attachment, x/y offset, or per-glyph positioning in this projection.

Consequently, the PDF receives the original positive hmtx advances for the three FrankReal combining marks, even though Unified measurement treats them as zero-advance marks and the browser rendering displays them as attached marks. The PageModel controls the location of the word box, but does not carry the shaped glyph positions needed for the PDF to reproduce the browser result.

### Font-table clarification

The embedded FrankReal source font in this document is 228 glyphs, UPM 2048, weight class 700, and has no GSUB/GPOS tables. Its PDF subset is 40 glyphs and preserves the tested glyph outlines and hmtx values. Therefore, for this exact FrankReal example, it would be inaccurate to say that the subsetter removed a GPOS table that existed in the source font. The proven failure is that the PDF writer does not consume the browser's combining-mark placement or an equivalent shaped-glyph representation, and instead emits raw character advances.

A separate general risk exists: the source Guttman Rashi font in the same HTML contains GDEF/GPOS/GSUB tables, while the current subsetter's copied-table list does not include those layout tables. Preserving such tables would itself require correct GID remapping; simply copying them into a remapped subset is not a safe fix.

## 4. Page size and bleed are not the cause

The PDF's larger physical MediaBox is intentional:
- PDF MediaBox: `[-8.5 -8.5 603.78 850.39]` pt
- PDF TrimBox: `[0 0 595.28 841.89]` pt (A4)
- PDF BleedBox: `[-8.5 -8.5 603.78 850.39]` pt

The registry default is `export-bleed-mm = 3`; crop marks are disabled in this run. The TrimBox remains A4, and the extra 3mm around the trim is the configured bleed. Earlier full-page comparisons that included the MediaBox against an A4 HTML page were not normalized correctly. The page-size difference is not evidence of an incorrect layout or an incorrect bleed setting.

## 5. Interpretation and limits

Verified:
1. The same live PageModel was used to create both output artifacts.
2. The exact same word and font family are present in both outputs.
3. Its HTML width matches the base-letter advances; its PDF width matches the sum of base-letter plus combining-mark advances.
4. The raster sample shows the PDF marks displaced while the browser-rendered HTML marks are attached.
5. The PDF text extractor still returns the full Unicode word.

Not established by this sample:
- pixel identity across all 691 pages;
- identical visual weight (the HTML requests weight 900 while the embedded FrankReal face reports weight 700, so synthetic emboldening may be an additional visual difference);
- the exact browser-internal mark-placement algorithm for this particular font. The FrankReal file itself has no GPOS table, so the code comments describing GPOS must not be treated as proof that this specific font uses a GPOS lookup.

The decisive defect is the absence of a shared shaped-glyph representation in the PDF projection, together with raw per-character advances that contradict Unified's zero-advance combining-mark measurement.

## 6. Existing tests and the missing regression

The current `s12-export` tests validate PDF structure, content extraction, deterministic output, whole-page ink bounds and line-band alignment on their chosen fixtures. Those checks do not inspect the placement of each Hebrew mark relative to its base glyph in a real FrankReal Bold word. The `s73-pdf-font-parity` tests verify font-family selection/subsetting and text extraction but do not assert combining-mark attachment or the shaped advances/offsets of the emitted glyphs.

A targeted regression should include at least:
- the exact FrankReal Bold word `שְׁמַע`, plus words with sheva, patah, shin/sin dot and multiple marks;
- a font whose combining marks have zero raw hmtx advances (e.g. Guttman Rashi) and one whose mark advances are nonzero (FrankReal);
- exact expected shaped cluster sequence, GID, x/y offset and advance for each glyph;
- HTML and PDF projection checks from the same PageModel, including extracted Unicode and actual glyph placement;
- mixed Hebrew/Latin/numbers and brackets so RTL reordering cannot split a combining cluster.

## 7. Required architectural correction

Do not correct this by CSS offsets, font substitution, ad-hoc negative spacing, changing the PageModel's already-computed word width, or adding a post-layout patch.

The required path is:
1. Paragraph-level Unicode/Bidi/Script/Font itemization.
2. HarfBuzz shaping before word splitting and line breaking.
3. Immutable `ShapedRun` / glyph records carrying source ranges, cluster identity, GID, advance, x/y offsets, flags and font-face identity.
4. `MeasureAPI` and line breaking consuming the same shaped-cluster advances used by rendering.
5. `LineModel` and `PageModel` preserving those glyph records as authoritative geometry.
6. DOM/HTML and PDF projecting the same shaped glyph positions. PDF must not reconstruct the visual word by mapping individual Unicode codepoints to CIDs and letting raw hmtx advances place combining marks.
7. Font subsetting must preserve the exact referenced glyph IDs and safely remap all required composite/layout references, or the writer must use a representation that does not depend on unremapped OpenType layout tables.

**No engine code, font defaults, bleed settings, geometry, or test locks were changed in this forensic pass.** Keep Phase 1/Phase 4 projection parity open until this defect is fixed and the regression passes on the real fonts and long corpus.
