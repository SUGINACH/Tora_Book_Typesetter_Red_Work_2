# Iteration 007 — CFF stress-test findings and gates

## Current checkpoint — 2026-11-24 (branch HEAD `011ba614da0d08f8993afb75f92ff9d908c62bc4`)

Latest relevant workflow: [font-catalog-audit run 45393922181](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45393922181), artifact `14919264053`.

### Automated result

- 380/380 CFF assets completed conversion and passed the structural and production-runtime checks.
- `failureCount = 0`; no cmap-to-GID, glyph-count, advance-width, hhea/head, SFNT save/load, production parser, or PDF subset failures were reported.
- 0 raw-glyf round-trip bound changes were reported.
- The maximum source-CFF-curve-bound to converted-glyf-curve-bound difference was `0.001317186459em` (Shluk-Regular.woff2, GID 380, `uni05E0`). 47 fonts are above the nominal `0.001em` bound-delta diagnostic; none is above `0.002em`. This is a bounding-box delta, not an independently measured maximum curve-to-curve distance. Do not silently raise the cu2qu tolerance or infer that this metric alone proves visual failure.
- All 46 generated FreeType LSB-comparison diagnostics were produced successfully; there were zero raster diagnostic-generation errors.

### Why the GitHub font workflow is still red

The stress script currently returns exit code 1 whenever any `sourcePlacementReviewRequired` rows exist, even if all 380 fonts passed and their raster diagnostics were generated. In this run that condition is triggered by 46 fonts / 1,285 glyphs, including 54 entries classified as “severe”.

The current review metric is not semantically valid as a CFF-to-TrueType phantom-point equality test. It compares:

- CFF true curve bound minimum minus the source CFF-era `hmtx` LSB; with
- TrueType stored `glyf.xMin` (which includes off-curve control points) minus the remapped TrueType LSB.

Those are not equivalent bounds/coordinate semantics. The synthetic regression in `tools/test_raw_glyf_bounds.py` demonstrates the distinction directly: a quadratic glyph can have a true curve xMin of 39 while its stored off-curve control-point xMin is -72. The source-CFF-to-TT metric should therefore not be called a preserved “left phantom point” or treated as a conversion failure solely because these values differ.

The remapping itself is deliberate: after generating quadratic `glyf`, the output `hmtx` LSB is set to the stored TrueType control-box `xMin`; advance widths are preserved and hhea/head aggregates are recalculated. Do not revert to copying the old CFF LSB blindly.

### FreeType evidence and visual review

The artifact compares the same selected glyph in three states: source CFF, converted glyf with the old source LSB copied back, and converted glyf with the remapped LSB. It also includes a difference panel.

Across the 46 selected font/glyph comparisons:

| Metric | Result |
|---|---:|
| Source vs remapped-LSB IoU — minimum | 0.95217 |
| Source vs remapped-LSB IoU — median | 0.99632 |
| Source vs remapped-LSB IoU — mean | 0.99109 |
| Source vs copied-old-LSB IoU — minimum | 0.21667 |
| Source vs copied-old-LSB IoU — median | 0.98255 |
| Source vs copied-old-LSB IoU — mean | 0.95134 |
| Remapped LSB better / equal / worse | 31 / 15 / 0 |

The 46 image comparisons were inspected in two contact sheets. The representative converted glyphs retain the source appearance closely; no gross displacement or outline deformation was seen in this sample. This is a representative one-glyph-per-affected-font review, not proof of every flagged glyph or every glyph in all 380 fonts.

The originally questioned Ploni-Regular GID 725 (`uniFB4F`) is now explicitly reported:

- Source CFF true curve bounds: approximately `[39.0596, 0, 549.3990, 778]`.
- Converted glyf true curve bounds: approximately `[39.0596, 0, 549.4186, 778]`.
- Stored TrueType control-point `glyf.xMin`: `-72`; source LSB: `39`; remapped output LSB: `-72`.
- FreeType source-vs-remapped-LSB IoU: `0.99248`.
- FreeType source-vs-old-copied-LSB IoU: `0.03591`.

This withdraws the earlier 111-unit Ploni “outline shift” claim as an invalid comparison between a curve bound and a TrueType control-box bound. In this case, copying the old LSB would visibly displace the glyph; the converted LSB aligns with the new glyf control box and preserves the source rendering. The remaining Ploni geometry delta is small (about `0.000861em` at its worst reported glyph).

### Decision

1. **Withdraw the Ploni GID 725 111-unit conversion blocker.** It was caused by comparing incompatible bound/metric concepts, not by a 111-unit movement in the converted outline.
2. **Accept the 380/380 structural/runtime result as a successful mechanical conversion stress run**, with the stated geometric diagnostics and one-per-font raster sample limitations.
3. **Do not yet approve mass conversion or activate converted fonts.** Full curve-fidelity review, comprehensive LSB semantics validation, and renderer/shaping integration gates remain open.
4. Correct the audit model before further relying on its red/green result:
   - replace the CFF-curve-min/source-LSB “phantom point” test with a correctly named diagnostic;
   - retain the TrueType invariant that output LSB matches stored glyf control-box xMin;
   - preserve advance widths and recalculate hhea/head;
   - add a regression that makes clear CFF curve bounds and TT control-box bounds are different quantities;
   - expand raster review beyond one representative glyph where the data identifies material risks;
   - keep structure, parser/subset, round-trip, and actual raster parity as separate gates.
5. Investigate geometric outliers using direct curve comparison or additional raster evidence. Do not change `MAX_ERR_EM = 0.001` merely to make the report green.

## Other latest workflow status

For the same HEAD `011ba614...`:
- `full-math-audit`: success.
- `preview-engine-parity`: success.
- `corpus-invariants`: success.
- `font-catalog-audit`: failure only at the current placement-review exit gate described above; the report itself shows 380/380 passed and zero structural/runtime failures.
- `CI`: unit-test shards passed; the `layout-audit` job passed the 7-page fixture with zero issues, then the 691-page very-long fixture failed to produce its report because agent-browser/CDP timed out at `Runtime.evaluate`. Treat this as a separate audit-harness timeout to investigate, not as a confirmed layout regression.

## Branch boundary

All work described here is audit tooling, diagnostics, and documentation. No production font assets, active font catalog, layout engine behavior, or legacy engine were changed. Continue only on `engine/legacy-parity-preview-20261119`; do not merge into or modify `main`, `rescue`, or the legacy engine.
