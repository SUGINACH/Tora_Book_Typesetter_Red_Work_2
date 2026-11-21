# Iteration 002 — FIX: `s-paren` → `paren-style-scale` (paren notes at body−2pt, like the original)

Commit base: `fe13f3e` (engine/legacy-parity-preview-20261119)
Root cause: see `ROOT_CAUSE.md`.

## The change (one mapping, one mechanism — no engine/layout logic touched)

### `red-build/src/engine/core/legacy-settings-map.js`
1. **New explicit disposition** for `'s-paren'` (previously caught by the `/^s-/` ui-state family rule):
   - `kind: 'mapped'`, `to: 'paren-style-scale'`
   - transform: relative mode only (`ctx.parenMode === 'relative'`); `scale = (ctx.bodyPt + parseFloat(v)) / ctx.bodyPt`, clamped to the registry range 0.8–1; unknown mode or unparseable value ⇒ `undefined` (S77 "no override" semantics).
   - For the book under audit: `(12 + (−2)) / 12 = 0.8333333333333334` → paren words measured and rendered at exactly 10pt.
2. **`'s-paren-mode'`** gets an explicit `ui-state` disposition documenting that it is consumed by the `s-paren` transform.
3. **Import context**: `ctx.bodyPt` (from the same file's `size-body`) and `ctx.parenMode` (from `s-paren-mode`) are computed once in `importImudSettings` — no local constants, no second source.

### Effect on both real paths (verified)
- App (Pages/Worker, boot import) and runner (`liveSettings()`) both receive `paren-style-scale = 10/12`.
- Priority preserved: explicit user setting > imported book setting > registry default (boot applies the import, then persisted user deltas are restored on top).
- The legacy engine path is untouched (its `parenDelta` hard-code is the legacy contract); cross-check lock `legacy-28f52` verified unchanged.

### Not changed
- No engine layout/planner/balancing code.
- No thresholds, no expected values in tests, no baselines.
- Registry default of `paren-style-scale` stays `1.0` (non-IMUD profiles unaffected); canonical/very_long corpus locks unchanged (`8a6b23bd`, `d2b871cf` — verified by cross-check).
- The AQ line-stretch (page-neutral), side-note sizing (F10), split-window (F03-2) and sign-band composition (F19) divergences are deliberately NOT touched — one root cause per iteration.

### Rebuild
- Browser bundles rebuilt (`tools/build-worker-bundle.js`) — sha256 `7165c8b6…` (app), `f44d4760…` (worker); the D-65 bundle-freshness gate passes.

## Measured results (app parity path, same source/settings/fonts)
| Metric | Before fix | After fix | Old engine |
|---|---|---|---|
| App pages | 703 | **692** | 699 |
| layoutHash | `b7558c4b9ff88ca1` | `5c5a6e977a73fb06` | — |
| Runner pages (cross-path reference) | 860 | 840 | 699 |
| Paren text in PDF | (merged into 12pt body) | `ToraBook 10.0pt` present | `ToraBook 10.0pt` |
| Page-mapping mean jaccard (old↔new) | 0.666 | **0.742** | — |
| Raster mean changed-pixel ratio | 17.65% | **16.52%** | — |
