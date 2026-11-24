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

## Follow-up — corrected metric semantics and audit harness (2026-11-24)

### Commit `18de329a1a718cd4204bbb155c2b10875325a314`

The same invalid comparison was present in the pilot validator and the synthetic raw-glyf regression, not only in the stress-runner exit gate. The three tools were updated together:

- `reconcile_cff_metrics_for_glyf` now names the source diagnostic `sourceCurveXMinMinusSourceLsb`; it no longer labels a CFF curve bound minus source LSB as a preserved TrueType phantom point.
- The conversion invariant is explicit and checked per non-empty glyph: output `hmtx.LSB == glyf.xMin` (stored TrueType control-box xMin). Empty glyphs retain LSB zero; advance widths remain exact; `hhea` and `head` are recalculated and checked after SFNT reload.
- The decomposed experimental path checks the same output LSB/control-box invariant rather than the invalid cross-format metric.
- `tools/test_raw_glyf_bounds.py` explicitly tests a quadratic glyph whose actual curve xMin is 39 while an off-curve control point makes stored glyf xMin -72. It verifies the output LSB follows -72 and the rendered curve bounds remain stable after save/load.
- The stress report schema is now `cff-conversion-stress-v3`. It keeps source curve/LSB offsets and geometric outliers as explicit diagnostics, requires raster evidence for flagged fonts, and separates those manual-review items from structural/runtime failures. The report explicitly sets `massConversionApproved: false`; a green automated stress job is not approval to activate or mass-convert the catalog.

### New verification status

At the time this note was written, font workflow [45402648301](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45402648301) had passed:
- syntax compilation of all font audit scripts;
- the raw glyf bounds / off-curve LSB regression;
- full core and extended catalog scan;
- the seven-font WOFF2/CFF/variable-font pilot against the production parser and PDF subsetter.

The 380-font stress step was still running. Its final report and artifact must be inspected before treating the new metric contract as fully verified.

### Long-corpus layout-audit harness

Commits `99a8c7cf5ea7d5ba1fde07f23e6d2f42726549a6` and `a23d64790efda0b50695c31521f3090bb121a2a6` changed only the live browser-audit harness: the long virtualized scan now runs asynchronously in the page and the shell polls it through short CDP evaluations, rather than awaiting the entire sweep in one `Runtime.evaluate`.

Verification:
- [CI run 45401243122](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45401243122): smoke 7/7 pages, long corpus 691/691 pages, both zero issues; the long sweep completed in 232 steps / about 31.8 seconds.
- The same layout-audit job also passed on commit `18de329a`, including both the small and 691-page fixtures.
- On `18de329a`, full-math-audit, preview-engine-parity and corpus-invariants succeeded. The three Node-version CI test jobs were still running when this note was written.

### Remaining decision boundary

The conversion pipeline is still proof-only. Do not add converted fonts to the active catalog, alter live renderer/layout behavior, or approve mass conversion until the final 380-font artifact is inspected, geometric outliers and raster evidence are reviewed, and the shaping/measurement integration is designed as a shared deterministic contract.

## Final stress run on the corrected metric — 2026-11-24

The run started from code commit `18de329a1a718cd4204bbb155c2b10875325a314` completed successfully:

- Workflow: [font-catalog-audit #45402648301](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45402648301)
- Artifact: `14923273960`, `imud-font-catalog-audit-18de329a1a718cd4204bbb155c2b10875325a314`
- Schema: `cff-conversion-stress-v3`
- CFF files attempted: 380
- Structural/runtime conversion pass: 380/380
- Conversion failures: 0
- Production parser / PDF subset checks: passed for all 380
- SFNT save/load and glyph/cmap/advance/head/hhea checks: passed
- Source curve/LSB diagnostic fonts: 46
- Diagnostic glyphs: 1,285
- FreeType raster samples: 46/46 generated
- Raster diagnostic failures: 0
- Missing raster/comparison evidence: 0
- Geometric bound outlier fonts: 47
- Maximum source-CFF to converted-glyf curve-bound delta: `0.001317186459em` (Shluk-Regular.woff2, GID 380, U+05E0)
- Decomposed conversion: ran for all 47 geometric outlier fonts; all 47 passed structural checks, but every measured maximum bounds delta was identical to direct conversion. No demonstrated geometric benefit from the decomposed alternative.

The 47 geometry-outlier comparisons were inspected visually in four contact sheets. The compared source CFF and converted glyf silhouettes remained very close; no gross deformation or displacement was apparent in the reviewed worst-glyph samples. This is not a glyph-by-glyph visual review of every outline in every font, and it does not replace the numerical bound-delta and FreeType evidence.

The Ploni-Regular GID 725 issue is resolved as a false alarm in the previous metric: the 111-unit difference was between CFF true-curve xMin and TrueType off-curve control-box xMin. The converted outline's stored `glyf.xMin` is -72 and its output LSB is -72, giving zero GlyphSet horizontal translation. The source CFF curve bounds and converted true-curve bounds differ by only about 0.019636 font units for that glyph. The old LSB of 39 would introduce a 111-unit GlyphSet translation and is not to be restored.

### Interpretation and status

The corrected automated conversion stress test is green: 380/380 assets are structurally and operationally convertible by this proof pipeline. This does **not** authorize mass conversion or live activation:

- 47 fonts remain explicitly flagged for geometric review because their measured curve-bound differences exceed the nominal `0.001em` diagnostic.
- 46 fonts have curve-bound/source-LSB diagnostic sets comprising 1,285 glyphs; the run rasterized one representative glyph per flagged font, not every flagged glyph.
- The report therefore correctly retains `manualReviewRequired: true`, `manualReviewStatus: "required"`, and `massConversionApproved: false`.
- The decomposed method has no demonstrated advantage over the direct method in the tested geometric outliers; it must not become an automatic fallback.
- The proof pipeline still writes temporary conversions for validation only. No source font files, active catalog entries, app runtime, or layout engine behavior were changed.

Next font-specific gate: decide whether the 47 measured bound deltas and 46 one-glyph-per-font placement samples are sufficiently characterized, or extend the tests with a curve-distance/raster comparison over all materially flagged glyphs. Do not relax `MAX_ERR_EM` merely to remove the outlier count.

### Overall workflow status at the latest code commit

For `18de329a`:
- font-catalog-audit #45402648301 — success (380/380).
- full-math-audit #45402648390 — success.
- preview-engine-parity #45402648305 — success.
- corpus-invariants #45402648376 — success.
- CI #45402648294 — its layout-audit job succeeded (smoke and 691-page long fixture, zero issues); three Node 18/20/22 test jobs were still reported in progress at the latest query. Recheck those jobs before treating the full CI matrix as complete.

The latest documentation-only branch commit is later than the validated code commit. All run references above are pinned to the exact code SHA `18de329a...`.
