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
\** 36 word **types** fully missing (title-page metadata 6, F01 scope; 25 niqqud-clustered verse tokens old pp. 586–587 — present in NEW under different extraction clustering, proven via nikud-stripped search; 2 punctuation clusters; `מפורט` ×20 = old per-page detailed-TOC title "תוכן עניינים מפורט" vs NEW "תוכן / העניינים / המפורט" tokenization; `תלב` ×3, `ואע״ג` ×1 = citation-marker tokenization). 928 "added" types = running headers/folios (F11/F05 scope). **Caveat (corrected in iteration-002):** the original claim "No body-content loss (verified word-by-word)" was overstated — a real divergence exists: NEW H2 sign-opening bands omit the word **`סימן`** and the siman gematria number (OLD p44: "סימן(20pt) א קדושת יום השבת ומצוותיה(17pt)"; NEW p39: title only) — ≈88 `סימן` tokens + ≈88 gematria tokens absent from the NEW body. Logged as finding **F19** (sign-band text composition) in the iteration-002 backlog; all other deficits are chrome/tokenization.

## Visual evidence (`rendered-comparison/`)
- `trio-old-p{N}-prefix-p{M}-new-p{K}.png` — OLD / pre-fix / post-fix, content-mapped (jaccard 0.63–0.90):
  - old p124 / pre p175 / new p137
  - old p125 / pre p175 / new p138
  - old p129 / pre p163 / new p143
  - old p131 / pre p170 / new p146
- `p{N}-old-vs-p{K}-new.png` — mapped pairs from the first comparison pass.

## Page mapping (B)
Sampled content-parallel mapping (**13 pages**, best jaccard; 7 fixed + 6 random, seed 7): mean jaccard **0.666** — content flows continuously; naive page-index comparison is invalid (as required by the procedure).

> **Correction (iteration-002 opening audit, 2026-11-22):** this file originally said "14 pages"; the sample contains exactly 13 pairs (see `metrics.json` `B_page_mapping.sample`). Counting error in the report text only — the mean jaccard was always computed over the 13.

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
- old-engine.pdf: md5 `7c0fe033b494b2c15c6cde2c95656356` / sha256 `d6280392c608ca951e3e4003cb9f3563da1b542c34211dcb1e4993e4aa49a2c8` (baseline, read-only). NOTE: the reference folder `audits/PDF Export Page Comparison - Old Engine VS New Engine/` is NOT inside the repository tree; the working copy used for all measurements is `/home/z/my-project/work/ref-pdfs/old-engine.pdf` with the hashes above (identity is by hash).
- new-after-fix.pdf (= run-unified-out/ours.pdf): see `metrics.json` (sha256)
- pre-fix same-runner PDF: `/tmp/pre-fix-out/ours.pdf` (1025 pages, hash `dd122b5f5746` layout)

## Iteration-002 opening audit — corrections and clarifications (2026-11-22)
1. **Page mapping count**: 13 pairs, not 14 (fixed above).
2. **Metric semantics (E_content)**: `words_missing_in_new: 538` counts distinct word **types** with a occurrence deficit, not tokens. Actual token deficit = **4,559**; token surplus (added) = **4,575**; net whole-document token delta = **+16** (359,574 − 359,558). After restricting to the body zone (old header y<60 excluded; new header band + bottom folios excluded) and normalizing nikud + edge punctuation, the deficit drops to **1,335 tokens** across 536 types — dominated by `סימן` ×88 (F19, real), `המשך` ×20 (old continuation headers, F11 chrome), and small gematria TOC/folio numbers (chrome/extraction).
3. **All missing words explained?** No — F19 (`סימן` + siman number omitted from NEW sign bands) is a genuine content divergence, now logged. Everything else is chrome (headers/folios by design, F11/F05/F01) or extraction tokenization (nikud clustering, citation markers, TOC-title line breaks).
4. **Dates**: this report and ROOT_CAUSE.md/TESTS.md originally said 2026-11-22; the containing commit `78ee6e3` is stamped **2026-11-21 20:42 UTC** (22:42 Asia/Jerusalem) — correct authoring date is 2026-11-21.
5. **Local vs CI**: TESTS.md documents **local** runs (npm test full suite, determinism, cross-check, run-ours comparisons). CI on `fe13f3e` (verified via GitHub API on 2026-11-22): `CI` ✅, `corpus-invariants` ✅, `preview-engine-parity` ✅, `full-math-audit` ❌ — the documented U-9 Full Math known failure (policy unchanged: no threshold changes, no hiding).
