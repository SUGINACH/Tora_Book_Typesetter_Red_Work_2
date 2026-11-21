# Iteration 001 — PDF comparison: OLD baseline vs NEW after fix

Same runner (run-ours `--unified`), same source text (the comparison book), same settings/fonts — the only variable is the fix.

| Metric | OLD baseline | NEW before fix (same runner) | NEW after fix | OLD↔NEW gap |
|---|---|---|---|---|
| Pages | **699** | **1025** | **860** | 326 → **161** (−50.5%) |
| H3 heading spans at page top (y<130) | ~22 real breaks (reference) | 2,179 / 2,182 | **196** | — |
| H3 heading spans mid-page | ~2,040 | 3 | **1,986** | — |
| H3 band lines centered on page middle (±25pt) | 419/420 (99.8%) | — | **344/345 (99.7%)** | ✓ |
| Median last body row y (sampled) | 758.0 | 640.6* | **727.1** | +86.5px fill |
| Word multiset | 359,558 | — | 359,574 | preserved** |
| Band structure (measured, e.g. p146/150/155) | columns → band → columns | — | columns (46/44) → H3 → columns (50/52) ✓ | ✓ |

\* measured on the app export (882-page, different session settings); same-runner pre-fix is 1025 pages.
\** 36 words fully missing = title-page metadata (F01 scope) + niqqud extraction clustering; 928 "added" = running headers/folios (F11/F05 scope). No body-content loss (verified word-by-word).

## Visual evidence (`rendered-comparison/`)
- `trio-old-p{N}-prefix-p{M}-new-p{K}.png` — OLD / pre-fix / post-fix, content-mapped (jaccard 0.63–0.90):
  - old p124 / pre p175 / new p137
  - old p125 / pre p175 / new p138
  - old p129 / pre p163 / new p143
  - old p131 / pre p170 / new p146
- `p{N}-old-vs-p{K}-new.png` — mapped pairs from the first comparison pass.

## Page mapping (B)
Sampled content-parallel mapping (14 pages, best jaccard): mean jaccard **0.666** — content flows continuously; naive page-index comparison is invalid (as required by the procedure).

## Raster comparison (C)
Mean changed-pixel ratio on 8 mapped pairs: **17.65%** (72dpi, |Δgray|>40) — includes the remaining known divergences (line-height 16.9 vs 16.1 — iteration-002; paren/margin note sizes; running headers).

## What improved / what remains
**Improved (this iteration's scope):**
- 335 forced page breaks at H3 → 196 H3-at-top (of which sign-open pages legitimately open with the H2 band + H3 directly below — legacy behavior).
- −165 pages on the same runner (−16.1%); very_long corpus: 1242 → 1066 (−14.1%).
- H2 sign-open pages now carry body content below the H2 band + H3 (F06 addressed at the root).
- H3 band geometry matches the reference: full-width, centered, mid-page, with balanced columns above and content below.

**Remaining gap to the old engine (161 pages, next iterations by impact):**
1. Line-height 16.88pt vs 16.08pt (F14) — ≈ 33 pages.
2. Parenthetical notes at 12pt vs 10pt (F09) — text ~12% of body at +20% width.
3. Margin notes 9pt vs 6pt + wider column (F10).
4. H1 part-opening doubled pages (F07) — ≈ 9 pages.
5. Split-window / folio drift (F03-2, F05).

## Verdict
The fix solved the targeted root cause (H3 unconditional page flush) at the source, with the legacy threshold and geometry contract as the single source of truth. Parity improved measurably on every metric in scope; no regressions (full suite green, content preserved, determinism proven, legacy engine untouched). **Continue to iteration-002 (line-height unification).**

## Hashes
- old-engine.pdf: md5 `7c0fe033b494b2c15c6cde2c95656356` (baseline, read-only)
- new-after-fix.pdf (= run-unified-out/ours.pdf): see `metrics.json` (sha256)
- pre-fix same-runner PDF: `/tmp/pre-fix-out/ours.pdf` (1025 pages, hash `dd122b5f5746` layout)
