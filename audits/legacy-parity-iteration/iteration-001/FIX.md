# Iteration 001 — FIX: H3 mid-page bands (legacy span_1col)

Commit base: `695c12a` (engine/legacy-parity-preview-20261119)
Root cause: see `ROOT_CAUSE.md`.

## The change (unified mechanism, single source of truth)

### 1. `red-build/src/engine/core/h3-contract.js`
- Added `H3_FOLLOW_MIN_PX = 22` and `h3BandRoomThresholdPx(bandHeight) = max(60, bandHeight + 22)` — the legacy span_1col room threshold (S4.13/S4.24/S74-6), one source for both engines.

### 2. `red-build/src/engine/layout/dp-planner.js`
- **H3–H6 full-width branch**: with a non-empty page, first balances the current tail segments (legacy S4.12 balance-before-span), then checks `capacity − usedMax ≥ h3BandRoomThresholdPx(bandTotal)`. If it fits → **the band stays on the same page** (`pushH3BandRecords`); if not → flush + top band (the previous behavior, unchanged).
- **Band records**: each heading line becomes a record in col0 carrying its measured `heightPx` (measurement purity preserved — s5b green), with `gapBeforePx = H3_TOP_PAD_PX(8)` on the first. A **shadow record** (equal height, no text, same seq) goes to col1, and a synthetic **tail record** (`h3BandTail`, 8px, no lineModel, no seq) closes the band in both columns. `flowCol` resets to 0 below the band (legacy `openBlock`).
- **Gap suppression**: the first block below a band carries no entry gap — the band's 8px tail is the separation (legacy openBlock semantics; same as the empty-column case under a top band).
- **Balancing**: `flushPage` and `balancePageSafe` rebalance **tail segments only** on pages that contain band records (bands and shadows never move between columns — the two columns must stay synchronized at the band's height). `resplitTailSegments` applies **only clean splits** (`best.clean`): when every capacity-legal split would create a widow/orphan/escort violation, the fill is preserved and the imbalance reported — the legacy `balanceBlock` behavior (min-2 candidates; no candidates → keep fill, report).
- **Escort × note budget**: the heading-escort room check now includes the escorted paragraph's stamped note heights (`noteHeight`), because FX-3 reserves the gutter budget at placement time — without this the verified room evaporates (measured: very_long p43, H4 + lone opening line, retreat oscillation).

### 3. `red-build/src/engine/core/materialize.js`
- Band records project as **full-width centered heading lines** (same `projectLine` + `lineAlignOf` as top-band lines) with `midBand: true`; the y-advance includes the tail record.
- Shadow/tail records produce **no projected line** (no ink) — only y-advance.
- Folio ink-bounds estimate tightened (gematria/digits sit on the baseline; the old `by+6` bottom assumption was exposed once short pages entered the parity sample).

### 4. `red-build/src/engine/core/page-model.js`
- The 1:1 zip skips shadow/tail records: they get `placeLine(null, …)` placeholders (`projected: false`, `kind: 'h3band-shadow'|'h3band-tail'`, `words: []`).
- `placeLine(null)` carries `kind` + `words: []` (defensive for all consumers).
- The model validator exempts the two reservation kinds from `line-not-projected` (every other unprojected line remains a full violation).
- `midBand` flag copied to the model line.

### 5. `red-build/src/engine/output/pagemodel-dom-renderer.js`
- Mid-band lines render in a page-level `.mid-bands` container (absolute page coordinates) — not inside a column box (which would give negative left and clipping contexts). Column loop skips `midBand` and `projected === false` lines.

### 6. `red-build/src/engine/output/export-api.js`
- `exportPdfFromModel` filters `projected === false` lines (reservations have no ink and no words).

### 7. `red-build/src/engine/layout/balancing.js`
- Band records (band/shadow/tail) are **fixed geometry**: excluded from AQ stretch application and from the stretch basis (`columnStretchParts`, `rawLinesOf`), and their height is deducted from every stretch target (`fixedBandPx`) — without this, columns with bands overflowed by exactly the band height (measured: very_long `line-outside-content-box` ×22).
- `balancePage` (chapter-end mode) does not resplit band pages (whole-page split would move shadows between columns and desynchronize the band height).

### 8. `red-build/src/engine/layout/protections-matrix.js`
- `readingOrder`: segment-aware walk (col0-seg i, col1-seg i, band, seg i+1); shadows skipped (they carry the text record's seq but are reservations).
- `orphan-bottom`: a lone paragraph opening **directly below a band tail** is the legacy-approved pattern (the source threshold explicitly permits band + one line; measured in the reference PDF: 8 H3 bands with <2 lines of space below). Every other lone opening remains a full violation.

### 9. `red-build/src/engine/layout/plan-model.js`
- `validatePagePlan`: seq monotonicity walk is segment-aware; band records are exempt from block-gap rules (band geometry contract: top pad once, tail once); the line below a band is exempt from the block-gap requirement (the tail is the separation). `line-model-missing` naturally skips synthetic records.

## Not changed
- The legacy engine (`legacy-imud-flow.js`) — untouched; cross-check lock `legacy-28f52` verified unchanged.
- U-9 (Full Math) — out of scope, still documented.
- Baselines — never overwritten; locks renewed with full documentation (see TESTS.md).

## Renewed locks (documented decisions)
- canonical (DP): `fdff19d8` → `8a6b23bd` (37 = 37 pages).
- very_long (DP): `c330970a` → `d2b871cf` (1242 → 1066 pages).
- s72 corpus: `ad283e71` → `0db2d2f2`.
- Browser bundles rebuilt (D-65): sha256 updated by the build.
