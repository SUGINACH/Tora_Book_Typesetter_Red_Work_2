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
