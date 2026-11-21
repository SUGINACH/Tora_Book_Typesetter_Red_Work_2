# Iteration 002 — Root Cause: parenthetical notes at body size (legacy: body−2pt via `s-paren`)

Date: 2026-11-22
Branch: `engine/legacy-parity-preview-20261119` (base `fe13f3e`)
Baseline (read-only, identity by hash): old-engine.pdf — sha256 `d6280392c608ca951e3e4003cb9f3563da1b542c34211dcb1e4993e4aa49a2c8`, 699 pages (working copy `/home/z/my-project/work/ref-pdfs/old-engine.pdf`; the reference folder name in the original instruction is not part of the repo tree).

## 0. What this iteration actually had to resolve first (§3 of the instruction)

### 0.1 The export-path divergence (runner vs Pages) — root-caused and closed

The instruction forbade declaring "860 pages" as the app's state: 860 was `run-ours --unified` output while the previous app export was 882. This iteration proved the two paths diverge **by construction**, and identified the correct parity path:

| Path | Registration API | Effective measurement | Pages (this book, post-iter-001) |
|---|---|---|---|
| **App (Pages/Worker)** | `font-resolver.registerFont` (worker-protocol `register-font`) | real font metrics for **body AND items** (`measureItem` resolves via fontResolver) | **703** |
| Runner (`run-ours --unified`) | `measure-api.registerFont` | real metrics for **body only**; non-body items fall to `font-unavailable-table-approximation` | 860 |

Proof (controlled experiments, same text/settings/fonts, only the registration API varies):
- resolver-path registration → **703 pages, hash `b7558c4b9ff88ca1`** — bit-identical to the live app run (Worker) and reproducible in Node.
- measure-api registration → **860 pages, hash `37ebc29f2bec45f2`** — bit-identical to the runner.
- `measureItem` (measure-api.js) resolves items through `fontResolver.resolveFont`; with the resolver empty (runner), headings/notes/window words are measured with calibrated table approximations — wider than real metrics → +157 pages (+22%).

The old engine measures everything with real fonts; **the app path is the faithful parity path**. All iteration-002 measurements and comparisons below use the app path. (The runner remains a valid cross-check tool, but its absolute page count is not the parity target. A follow-up to align the runner's registration with the live path is logged in the remaining-findings list — not part of this iteration's single fix.)

### 0.2 App-path export verification (§3.2 of the instruction)

Full export through the real app (UI server + headless browser + Worker), original source (`source-text.txt`, 3,398,435 bytes), default book settings (IMUD import), embedded IMUD fonts:
- Typeset: **703 pages** (pre-fix), layoutHash `b7558c4b9ff88ca1`, 21s, contentPreserved=true.
- H3 fix from iteration-001 IS present in the Pages route: 2,078 H3 spans mid-page / 104 at top (old: 2,043 / 143).
- PDF (20,886,517 bytes, md5 `c52aa1d7c33145f7358fc6de3a67f56e`) and HTML (63,559,500 bytes) exported from the same run; HTML pagination == PDF pagination page-for-page (703 == 703; jaccard 1.0 on chrome pages, 0.86–0.93 on body pages with extraction noise only).
- Determinism: the same hash reproduced in Node (resolver-path) and twice in independent browser sessions; the exported PDF is byte-identical across sessions.

### 0.3 The line-height chain (F14 as instructed) — investigated, and the setting is NOT the divergence

- `settings-registry` default `body-line-height = 1.4`, but **both real paths** (app boot import and runner `liveSettings()`) override it with the IMUD `line-height-body = 1.34` → effective 1.34 everywhere → 12pt × 1.34 = 16.08pt = the old engine's pitch. The 1.4-vs-1.34 concern applies only to a non-IMUD default configuration.
- The measured 16.88–16.89pt "line pitch" (iteration-001, runner PDF) is the **AQ-stretched** pitch (16.08 × 1.05), not the line-height setting. Counterfactual `aq-enabled=false` / `aq-stretch-to-bottom=false`: **703 pages, unchanged** (different layout hash — redistribution only). The app PDF shows the same stretched-pitch distribution (16.2–16.9 spread vs old fixed 16.1).
- Conclusion: F14-the-setting is closed for the app path; the remaining pitch divergence is AQ-stretch geometry (page-count-neutral) — logged for a later iteration.

## 1. Candidate ranking (measured on the app path, isolated counterfactuals)

| Candidate | Isolated counterfactual (app-equivalent base 703pp) | Page impact | Verdict |
|---|---|---|---|
| **F09 — paren notes at body size** | `paren-style-scale = 10/12` | **−11 pages (703 → 692)** | **selected (this iteration)** |
| F14' — AQ stretch-to-bottom | `aq-stretch-to-bottom = false` | 0 pages (hash changes) | geometry-only; later iteration |
| F10 — side notes 9pt/101px vs legacy 6pt/50.5px | temporary `measureContextFor` patch to legacy values | 0 pages (hash changes) | visual-only; later iteration |
| F07 — H1 doubled pages | — | **not present in the app path** (big-title pages: 8 shaar + 2 H1 + 3 part-title — identical to old) | closed for app path |
| F03-2 — split window / footnote budget | not isolated this iteration | new has 178 early-ending pages vs old 120 (waste 73.1 vs 52.7 page-equiv) | next-iteration candidates |
| F19 — sign bands omit `סימן` + number | — | content (~89 `סימן` tokens) | later iteration |

## 2. The selected root cause, proven

**Old engine** (`legacy-imud-flow.js`): paren words are measured AND rendered at `SZ.body + parenDelta` = 12 − 2 = **10pt** (`parenDelta: -2`, fixed "כמו במקור"), including the internal spaces of paren text (`parenSpaceW`). Old PDF: `ToraBook 10.0pt` ≈ 12–17K chars.

**Source of the −2**: the original software's own book settings — `ui/assets/imud/default_settings.json`:
```
"size-body": "12", "s-paren-mode": "relative", "s-paren": "-2"
```

**New engine (unified)**: `s-paren` fell under the `/^s-/` family rule in `legacy-settings-map.js` → disposition `ui-state` with the reason "מומש במפתחות RED המקבילים" — but **no mapping actually set any value**, so `paren-style-scale` stayed at its default `1.0` (= off): paren words measured and rendered at full body size **12pt**. App PDF pre-fix: no `ToraBook 10.0` population at all (paren text merged into the 12pt count).

The unified engine already has the correct single mechanism — `paren-style-scale` (per-word `advanceFactor` in measurement via `wordOverlayFactory`, and the same scale on the word's font size in projection/materialize and in the DOM renderer `w--paren`): measurement and rendering move together by construction. The root cause is purely the **dropped import mapping**.

## 3. Why this precedes the others (per §5 of the instruction)

- Highest **proven** page-count impact of all candidates measured (−11 pages on the parity path; every other isolated candidate measured 0).
- It is a settings-contract bug (a book-level setting of the original software silently dropped), not a layout heuristic — the fix touches no engine layout logic.
- It also removes a measurement≠rendering inconsistency (the exact class of bug the instruction prioritizes): pre-fix, the engine measured paren words at 12pt and rendered 12pt (consistent but wrong vs the original); post-fix both are 10pt, matching the original.
- Residual gap after the fix: 692 vs 699 (−7, was +4): the overshoot proves remaining divergences (F03-2 split-window waste, F10, F19, TOC composition) now dominate — each is a separate iteration.

## 4. Fix design

Map the original's keys in `legacy-settings-map.js` (see `FIX.md`): `s-paren` → `paren-style-scale` via `(size-body + s-paren) / size-body` (relative mode; unknown mode ⇒ no override per S77; clamped to the registry range 0.8–1), with `s-paren-mode` documented as consumed. Single source of truth: the original settings file; single mechanism: the existing `paren-style-scale`. The legacy engine is untouched (its `parenDelta` hard-code remains the legacy-path contract); explicit user settings still override the import (boot import → persisted user deltas on top).
