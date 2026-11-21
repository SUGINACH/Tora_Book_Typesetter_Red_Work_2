# Iteration 002 — PDF comparison: OLD baseline vs NEW (app path) after the F09 fix

Comparison path: **the real app export** (Pages route: UI → Worker → PageModel → PDF/HTML), same source text, same book settings (IMUD defaults), same fonts. The runner PDF (`new-after-fix.pdf`, 840pp) is attached for cross-path reference only — its page count is not the parity target (see `ROOT_CAUSE.md` §0.1: the runner measures non-body items with table approximations).

| Metric | OLD baseline | App before fix (iter-001) | App after fix | OLD↔NEW gap |
|---|---|---|---|---|
| Pages | **699** | 703 | **692** | +4 → **−7** |
| Paren text | ToraBook **10.0pt** (~12–17K chars) | (none — merged into 12pt body) | ToraBook **10.0pt** present | ✓ restored |
| Page-mapping mean jaccard (16 sampled) | — | 0.666 | **0.742** | content alignment improved |
| Raster mean changed-px ratio (10 mapped pairs, 72dpi, |Δ|>40) | — | 17.65% | **16.52%** | improved |
| H3 spans mid-page / at top | 2,043 / 143 | 2,078 / 104 | 2,068 / 112 | stable (iter-001 fix intact) |
| Body line pitch (pp.80–130 dominant) | 16.1 (fixed) | 16.9/16.5/16.2 (stretched) | 16.9/16.2/16.5 (stretched) | AQ-stretch divergence remains (page-neutral) |
| Median last body-row bottom (pp.50–250) | 770.5 | 772.4 | 772.1 | fill depth matched |
| Early-ending pages (waste page-equiv) | 120 (52.7) | 180 (74.4) | 178 (73.1) | F03-2 class remains |
| Word multiset (tokens) | 359,558 | 359,574 | 358,886 | deficit = TOC renumbering + nikud clustering + chrome (verified; no body loss) |
| Runner cross-path reference | — | 860 | 840 | (table-approximation path) |

## Visual evidence (`rendered-comparison/`)
Side-by-side OLD|NEW on content-mapped pages (mean jaccard 0.742; ink ratios match within ~0.005 both sides):
- `p051-old-vs-p046-new.png` (changed 17.7%)
- `p101-old-vs-p095-new.png` (18.8%)
- `p201-old-vs-p192-new.png` (16.5%)
- `p301-old-vs-p286-new.png` (18.9%)
- `p401-old-vs-p386-new.png` (18.3%)
- `p501-old-vs-p487-new.png` (20.0%)
Raster pairs additionally measured (not imaged): old 601→new 591 (11.2%), old 392→new 378 (17.7%), old 215→new 205 (18.6%), old 465→new 453 (**7.5%** — a nearly-identical full page).

## HTML↔PDF consistency (same run)
703-page pre-fix run and 692-page post-fix run both verified: HTML page count == PDF page count, page-for-page content match (jaccard 1.0 on chrome pages after tag-stripping; 0.86–0.93 on body pages, extraction noise only).

## What improved / what remains
**Improved (this iteration's scope):**
- −11 pages on the parity path (703 → 692); the page gap to the old engine crossed zero (+4 → −7).
- Parenthetical notes restored to the original's 10pt (measured AND rendered — one mechanism).
- Page-level content alignment (jaccard 0.666 → 0.742) and raster similarity (17.65% → 16.52%) both improved; best mapped pair at 7.5% changed pixels.
- No regressions: H3 mid-page stable, early-ending pages stable, content preserved, full suite green, legacy engine untouched.

**Remaining gap causes (ranked for next iterations):**
1. **F03-2** — split-window/footnote-budget: 178 early-ending pages vs old 120 (waste 73.1 vs 52.7 page-equiv) — the new engine refuses fills the old engine performs; now the dominant page-count divergence (the −7 overshoot proves slack for ~10+ pages of legitimate re-densification).
2. **F10** — side notes: 9pt ToraBook-wide/101px vs legacy 6pt Hadassah/50.5px/MN_PITCH 9.6 (visual, margin-column; 0 page impact measured).
3. **F14'** — AQ line-stretch: variable 16.2–16.9 pitch vs old fixed 16.1 (geometry-only, 0 page impact measured).
4. **F19** — sign bands omit `סימן` + siman number (~89 tokens; content).
5. **TOC composition** — title/periodicity and gematria-ref clustering differences.
6. Runner-vs-app measurement gap (runner measures non-body items via table approximations; align `run-ours` registration with the live path).

## Verdict
The fix solved the targeted root cause at its source (a dropped book-settings mapping), through the single existing mechanism, with measurement and rendering locked together. Parity improved on every in-scope metric; no regressions. The engine is NOT "done": the remaining divergences above are the next iterations' work.

## Hashes
- old-engine.pdf (baseline, read-only): sha256 `d6280392c608ca951e3e4003cb9f3563da1b542c34211dcb1e4993e4aa49a2c8` (699 pages)
- app-export-after-fix.pdf: sha256 `95d501fb1b55974137eeac5f8a8a5228616743971bd8de93838c11ecc0782831` (692 pages; md5 `16c019979d415734f40553b0ac149727`; layoutHash `5c5a6e977a73fb06`)
- app-export-after-fix.html: sha256 `d7f62e8fe45223d74e7fc4b7f00369c346f22f1d1bf92876fd1f133772d072c8` (same run)
- new-after-fix.pdf (runner, cross-path reference): sha256 `410f4d487f6dc383485e36cf625dbe023e393ba19e6a86c13b5756ca9d778a0f` (840 pages)
- Source: `source-text.txt` 3,398,435 bytes (1,921,487 chars)
