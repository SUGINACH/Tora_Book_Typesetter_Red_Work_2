# Iteration 001 — TESTS

## Full suite
`npm test` (92 test groups): **exit 0 — all pass, 0 failures** (`/tmp/full_test4.txt` run, 2026-11-22).

Key gates and what they prove:

| Test | Result | Proves |
|---|---|---|
| s5-corpus-comparison | 2/2 | canonical: contentPreserved=true, determinism, renewed lock `8a6b23bd` (37=37 pages). very_long: **3313/3636 blocks bit-identical, 323 redivision (same words, new line boundaries), 0 marker, 0 order-restore, 0 unexplained, 0 content mismatch**; pages 1216→1066 on the historical baseline. |
| s5b-measurement-purity | 7/7 | **0 lines with height ≠ LineModel** — band records keep measured heights; the 8px tail is a synthetic record, not a measurement change. |
| s7-page-model | 16/16 | very_long model: 0 violations (line-coverage, identity, counts, bounds) over ~1,050 pages. |
| s14-layout-audit | 53/53 | **0 line overlaps, 0 word overflows** in the projection (incl. mid-page band pages). |
| s8a/s8b | 6/6, 8/8 | materialization purity: hash preserved; no fallbacks. |
| s8d/s8e/s8f/s8g | 23/23, 13/13, 10/10, 9/9 | DOM/HTML/PDF tri-target parity from one model: every projected line appears exactly once with matching geometry (±0.005px), word anchors match the model, pdftotext bbox geometry within tolerance on the richest body page (now sign-open — body pages by legacy design). |
| s4b | 16/16 | heading levels 0–6 break correctly; ≥1 top spanning band (H2) and ≥1 mid-page H3 band asserted. |
| s9j (U-15) | 6/6 | every heading line centered — including mid-page band lines (page-level anchor, `.mid-bands`). |
| s9k (U-17) | 6/6 | footnote marker identity unchanged. |
| s69 (S70) | 24/24 | very_long: widow-bottom=0, orphan-top=0, **orphan-bottom=0** (band-adjacent single openings are the legacy-approved pattern; detector alive via synthetic tests), documented imbalance residuals persist. |
| s10 (D-65) | 44/44 | bundles rebuilt and byte-identical to a fresh build. |
| negative-controls | 19/19 | detectors still fire on synthetic violations. |
| audit-sensitivity | 34/34 | audit sensitivity intact. |

## Determinism
- `npm run test:determinism`: OK (`8a6b23bd`, 37 pages, identical hashes).
- run-ours `--determinism` (cross-check): very_long `d2b871cf6f4c2c9a` (1066 pages) twice — bit-identical PDF.

## Cross-check (`tools/cross-check.js`) — PASSED
```
✓ canonical (DP): pages=37  hash=8a6b23bd0e6d8439 (lock 8a6b23bd)
✓ very_long (DP): pages=1066 hash=d2b871cf6f4c2c9a (lock d2b871cf)
✓ very_long (legacy): pages=695 hash=legacy-28f52 (lock legacy-28f52)  ← המנוע הישן לא נגע
✓ bundles: sha256 match
```

## Lock renewals (documented, with in-code justification)
- canonical `fdff19d8→8a6b23bd` in: s5-corpus-comparison, s8a, s8b, s13, s65, s67, s72, s75, d108, s9d, cross-check-locks.json.
- very_long `c330970a→d2b871cf` in: s8b, s69, cross-check-locks.json.
- s72 corpus `ad283e71→0db2d2f2`.
- Negative control in s9d: mutated input must change the digest — still enforced against the new lock.

## Known residuals (documented, not regressions)
- `column-imbalance` findings persist on band pages where no clean tail split exists — the legacy `balanceBlock` behavior (keep fill, report).
- `rollback-compromise` (unclean-seam) ledger records for the same pages.
