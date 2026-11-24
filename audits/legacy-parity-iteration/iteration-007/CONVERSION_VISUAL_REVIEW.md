# Iteration 007 — CFF conversion pilot visual review

**Reviewed commit:** `01c6bea37c76c08268531e1962f32b7482f146ed`  
**Workflow:** [font-catalog-audit #45363333259](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/45363333259) — success  
**Artifact:** `imud-font-catalog-audit-01c6bea37c76c08268531e1962f32b7482f146ed` (artifact ID `14906535619`).

## Findings
- The full 1,758-asset catalog inventory ran successfully with zero parse failures.
- All seven representative conversion cases passed: glyf WOFF2, CFF WOFF2, CFF SFNT, variable glyf SFNT, variable glyf WOFF2, partial-Hebrew decorative CFF, and Latin-only.
- Production runtime parser and TrueType subset validation passed for every pilot output. Unicode-to-GID mapping, GID count, hmtx advances and save/load bounds were preserved; GSUB/GPOS presence retained.
- Visual artifacts inspected for both CFF pilot worst-bounds glyphs. Artzi SFNT CFF GID 83 (`uni2136`) measured maximum bounds delta 6.818 font units (0.006818 em); visual comparison appears very close at generated scale, with no obvious contour/topology defect. Afek WOFF2 CFF GID 79 delta 0.409 font units (0.000409 em), also visually close.

## Decision
**Pilot passes as a feasibility signal only; mass conversion remains NOT approved.** Narrow two-glyph visual checks do not establish corpus-wide outline quality, shaping fidelity, raster parity, or PDF behavior. The Artzi bounds delta exceeds the nominal cu2qu tolerance at bbox-extrema level; apparent visual closeness is not blanket approval.

## Required next proof
1. Stress-convert all 380 CFF assets (including 378 full-Hebrew assets); record failures, max outline/bounds deviations, GID/cmap/advance invariants and production parser/subsetter acceptance.
2. Broaden glyph visual/raster checks stratified by source format and glyph type (letters, marks, punctuation, composites), including geometric extremes.
3. Test actual generated PDF and raster output for Hebrew, niqqud, cantillation and mixed-direction strings. Conversion and renderer parity are separate gates.
4. No runtime/catalog/font changes until deterministic manifest and all gates are ready.

## Branch safety and tests
Documentation-only; runtime, catalogs and fonts unchanged. At this branch head, CI, layout-audit, full-math-audit, preview-engine-parity, corpus-invariants and font-catalog-audit all completed successfully. Full-math live job was skipped by workflow condition; local job succeeded. This is not legacy parity completion nor mass-conversion approval.
