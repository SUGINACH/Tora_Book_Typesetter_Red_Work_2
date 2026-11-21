# Iteration 001 — Root Cause: H3 headings flush the page (legacy: span_1col mid-page band)

Date: 2026-11-22
Branch: `engine/legacy-parity-preview-20261119` (base `695c12a`)
Baseline (read-only): `audits/PDF Export Page Comparison - Old Engine VS New Engine/PDF File Export - Old Engine.pdf`
- md5 `7c0fe033b494b2c15c6cde2c95656356`, 699 pages.
New export under audit: `PDF File Export - New Engine - 21_11_2026_-_19_55.pdf`
- md5 `8c78510567ebb890beb8d0d72b840ce8`, 882 pages (byte-identical to `PDF File Export - New Engine 2.pdf`).
- HTML export of the same build: 882 pages, pagination matches the PDF page-for-page (sampled jaccard 0.5–0.65 on 15 pages; the HTML carries extra chrome words).

## 1. The difference (measured, independent of prior reports)

| Measurement (this audit, PyMuPDF) | Old (699p) | New (882p) |
|---|---|---|
| H3 (13.5pt) heading lines | 420 (419 full-width centered on page middle ≈306pt) | 2,182 spans / ~420 lines — **all 2,179 at page top (y<130)** |
| H3 vertical position | y 97–735, median 349 — anywhere on the page | page top only |
| Pages starting with an H3 | ~22 (per forensic report F04; my y<130 count with tighter body-start calibration agrees in order of magnitude) | **335** |
| Pages whose previous page had ≥60px free below the last body row | — | **239 of 335** (median wasted 361px; Σ waste ≈ 89,098px ≈ **133 full pages**) |
| Mean body rows/page (sampled) | 60.8 | 49.7 |
| Median last body row y | 758.0 (p25=714.7) | 640.6 (p25=412.1) |
| Full-page fill (parallel pages) | last row ≈758.5 | last row ≈760.7 — identical when the page is allowed to fill |
| Glyph advance widths (ToraBook, 33 shared chars incl. 22 Hebrew letters) | — | **+0.00% difference** (identical fonts/metrics) |
| Page size | 612.3×858.9pt | 612.3×858.9pt (identical) |

Full pages fill identically in both engines; the divergence is concentrated in **pages that end early because every H3 forces a page break**.

Example (new PDF): page 501 contains only the H3 heading "ספק עירוב" plus running header — the entire body was pushed to page 502.

## 2. Root cause (proven in code)

`red-build/src/engine/layout/dp-planner.js`, H3–H6 full-width branch (level 3–6 + `fullWidth`):

```js
if (blk.kind === 'heading' && blk.level >= 3 && blk.level <= 6 && blk.fullWidth) {
  if (cur.spanning || cur.columns.some(c => c.length)) {
    flushPage();                     // ← unconditional flush whenever the page has ANY content
    cur = newPage(PAGE_TYPES.REGULAR);
  }
  ...
}
```

The code comment itself promises the legacy behavior — "עמוד חדש רק אם אין מקום לפס" (a new page only if there is no room for the band) — but the room check is missing.

The legacy engine (`legacy-imud-flow.js`, `HEADING_MODES[3] = 'span_1col'`, lines ~1993–2065) does the opposite:
1. Balances the current block's two columns (`balanceBlock` before the span decision).
2. Computes the wrapped band height `spanBlockHeight = TOP_PAD(8) + n×LINE_H(21.96) + BOTTOM_PAD(4) + MARGIN(4)`.
3. Keeps the H3 **on the same page** if `colBottom() − curY ≥ max(60, spanBlockHeight + 22)` (H3_FOLLOW_MIN_PX=22 ≈ one following body line; S4.13/S4.24/S74-problem-6 semantics).
4. Only otherwise closes the page (and rolls back trailing inline headings).

Both engines already share the band geometry contract (`core/h3-contract.js`: top pad 8px once, bottom pad 4px + margin 4px once, line pitch 13.5pt×96/72×1.22=21.96px, single-line total 38px).

### Why this is the first fix (impact ranking)

| Root cause | Measured impact on page count |
|---|---|
| **H3 unconditional page flush (this iteration)** | 335 forced breaks; 239 with ≥60px free on the previous page; waste ≈ 133 page-equivalents. Also directly causes F06 (69/88 H2 sign-open pages title-only: the H3+body that should follow the H2 band is flushed to the next page). |
| Paragraph split window / footnote commitments (F03-2) | 158 early-ending pages not followed by an H3 page (mixed with legitimate section ends) — next iterations |
| Line-height default 1.4 vs legacy 21.44px (F14) | ≈ 33 pages (+4.98% row height) — separate iteration |
| H1 doubled part-title pages (F07) | ≈ +9 pages — separate iteration |

Fixing this one root cause is expected to remove the majority of the 183-page gap and to repopulate H2 opening pages with body content, matching the old engine's structure.

## 3. Secondary verifications done before the fix

- **Font pipeline is NOT the cause**: identical glyph advances in both PDFs; HTML pagination == PDF pagination (882==882); embedded font inventory matches expectations. The manager's suspicion (measurement font ≠ rendering font) is ruled out for this divergence: the layout logic, not the font pipeline, produces the difference.
- The `spanning` mechanism in the unified engine supports only ONE top-of-page band per page; mid-page placement requires a new, minimal mechanism (below).

## 4. Fix design (unified mechanism, no per-page/per-text exceptions)

Extend the DP planner's page model with **mid-page H3 band records** — a segment barrier inside the column arrays:

1. **Planner** (`dp-planner.js`): on H3 (level 3–6, fullWidth) with a non-empty page:
   - Balance the current **tail segments** (the content after the last band record; for band-less pages identical to today's `optimalSplit` balance), so both columns end at the same y.
   - If `capacity − usedMax ≥ max(60, bandTotal + 22)` (legacy threshold, single source in `h3-contract.js`), push per-line band records into the right column and equal-height **shadow records** into the left column (reservation without text), reset `flowCol=0`, and continue filling below the band — no page break.
   - Otherwise flush and place the band at the top of the new page (existing path, unchanged).
2. **Capacity/accounting**: band records carry `heightPx`/`gapBeforePx` exactly like body lines, so `planningUsedHeight`, `colCapacityOf`, containment checks and the retreat loop need no special cases.
3. **Projection** (`materialize.js`): band records project as full-width centered heading lines (same `projectLine`); shadow records project as empty geometry lines (one projection per planned record — preserves the PageModel 1:1 zip; nothing is drawn).
4. **Balancing safety**: `flushPage` and `balancePageSafe` rebalance only tail segments when a page contains band records (bands never move between columns). `fixDropWordInColumns` runs on tails.
5. **Reading order** (`protections-matrix.js`): the seq-monotonicity walk becomes segment-aware (col0-segment, col1-segment, band, next segment), and shadow records are skipped (they are reservations, not content).
6. **Block gap**: the first block below a band carries no extra entry gap (the band's 8px tail is the separation — matches the legacy and the top-band path).

Renderers: PDF writer and PageModel DOM renderer (absolute positioning — the export/preview path) consume projected lines, so both show the same geometry. The flow-layout legacy `dom-renderer` is not on the unified export path.

## 5. Deliverables of this iteration

- `FIX.md` — the code change.
- `TESTS.md` — test evidence.
- `PDF_COMPARISON.md` + `metrics.json` — old vs new-after-fix (page counts, page mapping, raster/geometry metrics, visual examples).
- `new-after-fix.pdf` — new export artifact (baseline is never overwritten).
