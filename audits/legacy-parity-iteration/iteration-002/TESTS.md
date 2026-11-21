# Iteration 002 — TESTS

All runs local (sandbox), 2026-11-22, on the working tree of `fe13f3e` + this fix.

## Full suite
`npm test` (92 test groups): **exit 0 — all pass, 0 failures** (run in two segments because the sandbox reaped the background process mid-run; every group reported `0 failed`):
- Segment 1 (groups 1–~80, `/tmp/iter002-fulltest2.log`): 84 result lines, 0 failures — including:
  - `imud-migration` 11/11 (the new `s-paren` disposition is covered by the 100%-disposition and point-value tests)
  - `setting-sets` 5/5 (קונטרס/תלמוד/פרשנות sets — DP hashes computed fresh, all pass)
  - `legacy-result-contract` 6/6, `source-variants` 6/6 — **legacy engine hashes unchanged** (`legacy-21a78`, `legacy-1d339`)
  - `s5-corpus-comparison` (lock `8a6b23bd` — unchanged, no renewal needed: the corpus uses registry defaults, not the IMUD import)
  - `r03-paren-note-flags` (paren regression test) — pass
  - `negative-controls` 19/19, `s14-layout-audit` 53/53 (0 overlaps/overflows), `s9j` 6/6, `s9k` 6/6
- Segment 2 (final 9 groups, run individually): `s9c-pdf-export` 5/5, `s9c-tooling-parity` 7/7, `s9c-html-export` 9/9, `s9c-dom-preview` 7/7, `s9d-segment1-geometry` 12/12, `s9h-fn-budget` 7/7, `s9i-aq-factor` 4/4, `s9j-head-align` 6/6, `s9k-marker-identity` 6/6.
- First full run failed ONLY the D-65 bundle-freshness gate (source changed, bundles not yet rebuilt) → bundles rebuilt → all green.

## Determinism
- `npm run test:determinism`: OK (`8a6b23bd`, 37 pages, identical hashes).
- Book-level (this fix): the after-fix typeset hash `5c5a6e977a73fb06` reproduced identically in Node (resolver-path ×2: counterfactual and post-fix runs) and in the live app Worker (×2 independent browser sessions). The exported PDF is byte-identical across sessions (md5 `16c019979d415734f40553b0ac149727`).

## Cross-check (`tools/cross-check.js`) — PASSED
```
✓ canonical (DP): pages=37  hash=8a6b23bd0e6d8439 (lock 8a6b23bd — unchanged)
✓ very_long (DP): pages=1066 hash=d2b871cf6f4c2c9a (lock d2b871cf — unchanged)
✓ very_long (legacy): pages=695 hash=legacy-28f52 (lock legacy-28f52 — המנוע הישן לא נגע)
✓ bundles: sha256 match (rebuilt)
```
No lock renewals were needed: the fix affects only IMUD-imported settings; the locked corpora use registry defaults.

## Negative controls / content integrity
- `negative-controls` 19/19 (detectors fire on synthetic violations).
- Content: word-multiset old vs new-after-fix — token deficit 4,541 vs surplus 3,869 (net −672, dominated by TOC gematria page-references that legitimately renumber with the new pagination + nikud clustering + chrome; the 69 fully-missing types are TOC page refs, `מפורט` TOC-title tokenization, nikud verse clustering — same classes as adjudicated in iteration-001's §3.1 audit). `contentPreserved=true` in every typeset run.
- Overlaps/overflows: `s14-layout-audit` 53/53 (0 line overlaps, 0 word overflows).
- H3 regression check (iteration-001's fix must survive): H3 mid-page 2,068 (pre-F09: 2,078; old: 2,043) — stable; H3-at-top 112 (old 143) — no regression.

## Known residuals (documented, not regressions)
- The unified Full Math audit (U-9) remains the documented known CI failure (unchanged policy).
- `column-imbalance` / `rollback-compromise` ledger residuals on band pages (documented in iteration-001).
