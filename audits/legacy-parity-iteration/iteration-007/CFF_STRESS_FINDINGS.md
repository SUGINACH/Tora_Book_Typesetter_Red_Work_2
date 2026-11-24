# Iteration 007 — CFF stress-test findings and gates

## Status checkpoint (2026-11-24)

The stress-test implementation now separates three distinct checks:
1. **Conversion fidelity:** source CFF bounds compared to the generated glyf bounds. This is reported as conversion deviation, not a save/load failure.
2. **SFNT round-trip integrity:** generated glyf bounds compared to the same glyph bounds before save and after reload. The gate is 0.01 font units; this is intentionally a structural serialization gate, not the conversion tolerance.
3. **Runtime acceptance:** converted output is parsed and subset by the production JavaScript font parser/subsetter.

A previous stress-test result of 368 failures was invalid as evidence of conversion failure: it conflated conversion geometry change with serialization round-trip. The revised code compares the converted glyf outlines to themselves across save/load. A local algorithm check on three independent CFF fonts reported zero round-trip bounds change; that is only algorithm validation, not corpus proof.

## Corpus result reported from the corrected run

- 379/380 CFF assets passed the revised test.
- One conversion geometry outlier remains: `Ploni-Regular.ttf`, GID 725 (`uniFB4F`), reported bounds deviation 111.02 font units (~0.0959 em).
- This is treated as a conversion fidelity outlier, not silently approved. Source FontMatrix was reported without translation and source LSB was 39; converted outline left edge was reported at 150.06 while LSB stayed 39. The cause is in the CFF-outline conversion path, not the matrix/metric metadata.
- A decomposed conversion alternative was added for outliers and produces separate fidelity, integrity and production-subset diagnostics. Its result for Ploni must be checked before choosing any conversion strategy.
- A separate coverage-classification defect was found for FontbitIcons-Regular: icon font catalog classification should prevent empty mapped Hebrew letter outlines from being mistaken for text coverage. This must remain catalog-informed, not used to relax text-font coverage gates.

## Decision / safety

Do not approve mass conversion or activate converted fonts yet. A 379/380 pass is promising but one major geometric defect is unresolved. Also review the conversion stress code and artifact/report schema before relying on the count, including the distinction between conversion outliers (reported) and test failures (structural/runtime gates).

## Next actions

1. Retrieve and inspect the corrected run's complete JSON and Ploni visual artifacts (primary and decomposed), then compare outlines, bounds, LSB/advance, CFF charstring operators, components and GID identity.
2. Determine why GID 725 shifts; avoid a glyph-specific correction unless it is a genuine general CFF conversion rule. Prefer a principled converter fix or exclude/reject fonts that fail a transparent conversion-fidelity gate.
3. Validate FontbitIcons catalog metadata/classification and confirm no Hebrew text-font cases are exempted by the icon rule.
4. Re-run all 380 after any converter change; keep the original and decomposed methods as diagnostic comparisons, not automatic fallback.
5. Broaden visual/raster comparisons across high-deviation glyphs, marks, composites and mixed-script text; then validate actual PDF shaping/rendering independently.

## Branch boundary

No production runtime/catalog/font assets should be altered until the proof gates are met. This iteration remains audit tooling and documentation only.


## Corrected raw-outline audit (run 45381288569, commit 38f12767ddfff4c96929119d4c15077f0c402079)

The stress test was corrected to draw the stored `glyf` glyph directly with zero offset, resolving composite components through a raw glyph adapter. It no longer measures converted TrueType geometry through `TTFont.getGlyphSet(preferCFF=False)`, whose `_TTGlyphGlyf._getGlyphAndOffset` applies `lsb - glyph.xMin` before drawing. That translation is a metric-alignment behavior of the generic GlyphSet API and is not a raw-contour conversion delta. See [FontTools ttGlyphSet implementation](https://fonttools.readthedocs.io/en/latest/_modules/fontTools/ttLib/ttGlyphSet.html).

Results:

- 380/380 CFF assets passed structure, cmap/GID, hmtx, SFNT raw-outline round-trip, production parser and subset checks; zero failures.
- Median maximum raw-contour bounds delta: 0.000626 em.
- Maximum observed raw-contour bounds delta: 0.001317 em (Shluk-Regular.woff2, GID 380, `uni05E0`).
- 47/380 were above the nominal 0.001 em cu2qu tolerance by the bounding-box comparison; none exceeded 0.002 em. This is a review set, not an automatically accepted tolerance change. Bounds delta is a conservative geometric summary; visual/raster checks and the curve approximation tolerance remain separate gates.
- Ploni-Regular's maximum raw-contour delta in this run is 0.000861 em (GID 297, `y`), rather than the earlier 0.0959 em figure. The earlier 111-unit result was produced by the metric-aligned GlyphSet path, not the raw glyf contour measurement. The exact diagnostic for its originally questioned GID 725 is still to be emitted explicitly, comparing source CFF bounds, raw glyf bounds, GlyphSet-aligned bounds, LSB and stored glyf xMin.
- The three CFF pilot cases that failed in the first raw-pen attempt pass after fixing the pen setup. The successful pilot and 380-font stress run both use the raw-contour measurement.

**Decision:** the Ploni 111-unit conversion blocker is withdrawn as an invalid measurement result. No mass-conversion approval is granted yet: preserve the 47-font small-deviation review set, inspect visual/raster parity, and generate the explicit GID 725 diagnostic before accepting the font-conversion pipeline.
