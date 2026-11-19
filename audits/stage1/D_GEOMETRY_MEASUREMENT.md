# D — GEOMETRY & MEASUREMENT MAP (Stage 1 forensic audit)

Branch `audit/stage1-engine-state-20261115` (base main 95e829d). RESEARCH ONLY — no repo files modified.
All paths relative to `red-build/src/engine/` unless noted. Line numbers verified on this branch.

Core question: **where is the same geometric fact computed more than once, and who is the authority?**

---

## 0. Two parallel engines (context for every entry below)

| Path | Line breaking | Page planning | PDF geometry | Live DOM |
|---|---|---|---|---|
| **DP (modern)** | `typography/kp-linebreak.js` via `MeasureAPI.layoutLines` | `layout/dp-planner.js` | `output/geometry-projector.js` → `output/pdf-writer.js` | `output/dom-renderer.js` (CSS flow) |
| **Legacy (IMUD)** | `layout/legacy-imud-flow.js` `LineBreaker.breakPara` (greedy) | same file (`legacyTypeset`) | `output/legacy-projector.js` → same `pdf-writer.js` | `dom-renderer.js` `renderLegacyPage` (absolute px) |

Almost every fact below exists **twice: once per engine**, and inside the DP path **twice per renderer (PDF explicit vs DOM/CSS)**.

---

## 1. FONT METRICS — the measurement implementations

| Site | What it computes | Notes |
|---|---|---|
| `typography/measure-table.js:30-41` `charWidthEm(ch)` | Approximate per-char em width (impl A) | `HEBREW_WIDTHS` (10-14), `WIDE_MARKS` (21), Hebrew-bucket 0.5, ASCII 0.52, default 0.4 |
| `typography/measure-table.js:24-28` `FONT_PROFILES` | Per-family width factors (David 1.00, Narkisim 1.05…) | **Duplicated 3 more times** — see §9-D1 |
| `typography/font-metrics.js:31-111` `parseFont` | Real sfnt tables: unitsPerEm (head:58), numGlyphs (maxp:63), ascender/descender/lineGap (hhea:69-71), advanceUnits (hmtx:76-80), cmap (82-85), capHeight (OS/2:87-96), kern/GPOS (98-101) | impl B parser, zero deps |
| `font-metrics.js:330-346` `advanceUnitsOf` / `:349-351` `advanceEmOf` / `:354-359` `kernUnitsOf` / `:362-365` `capHeightEmOf` / `:368-371` `isZeroAdvanceMark` | Query layer over parsed font | kern parsed but **not consumed in measurement** (policy: no kerning; BASE_CSS `font-kerning:none`, html-export.js:36-42) |
| `typography/measure-api.js:63-212` `MeasureAPI` | Single entry (REQ-LB-01). `measureTextWidth` (142-162, cached per impl\|font\|size\|tracking\|text), `_charEm` (102-119, real hmtx + Frank-Ruhl fallback + table fallback), `_kernEm` (130-136), `_isMappedMark` (122-127, zero-advance niqqud), `capHeightEm` (168-173, fallback 0.7), `ascentEm`/`descentEm` (177-188, fallback 0.80/0.20), `lineHeightPx` (191-198), `layoutLines` (205-209) | **Authority for all width/height/baseline metrics** |
| `measure-api.js:237-242` `resolveMeasureImpl` | impl selection: `'font-metrics'` if setting says so **or** body-font is registered (EXT-13 live↔export unification); else `'table'` | Default setting = `'table'` (bindings `measure-impl`, registry default), but registered font upgrades it |
| `measure-api.js:220-229` `MeasureAPI.forFamily` | Cached per-family impl-B API (headings in their real font) | |
| Callers of `measureTextWidth` (direct): `core/pipeline.js:192,206,214,368,520,525,706,825`; `layout/legacy-imud-flow.js:425,438,446,539,844-846,1197,1359,1384,2053,2088,2155-2157,2696-2727,3146,3283-3302,3601`; `output/geometry-projector.js:149-150,233,281,347,350,703-704,783-784,800-801`; `output/legacy-projector.js:76,83,92,316,331,463,475,519,526,535,549,603,606,627,661`; `typography/dropword.js:44`; `layout/footnote-budget.js:31-37`; `layout/side-notes.js:28-32`; `layout/dp-planner.js:264` (fn split), `:181` (via measureFn→fixDropWordInColumns) | | |

**Measurement impl per consumer** (critical for authority):
- Live typeset: `pipeline.js:186` `new MeasureAPI(settings, resolveMeasureImpl(settings))` — table unless font registered.
- PDF export: `output/export-api.js:117-121` forces `'measure-impl':'font-metrics'` + registers export font; `:135-137` passes `new MeasureAPI(settings, resolveMeasureImpl(settings))` to `projectDocument` (S71.1: fixed table-projector vs metrics-model divergence — 168 lines overflowed columns before).
- Legacy flow: same MeasureAPI, per-role APIs (`winApi` FrankReal, `headingApi` DavidLibre, `fnApi` FRL, `prefaceApi`) — `legacy-imud-flow.js:408-421,539`.

## 2. WIDTH COMPUTATIONS

### 2.1 Word/char advance widths
| # | Site | Input | Output | Re-computes? |
|---|---|---|---|---|
| W1 | `typography/measure-api.js:142-162` `measureTextWidth` | text, sizePt, tracking | px width | **Authority** (both impls) |
| W2 | `core/pipeline.js:515-527` `measureWithParen` | word with PAREN/CUSTOM sentinels + MARK_TAG | px width incl. paren-scale ×`paren-style-scale` and custom-style factor | Wraps W1; **the per-word effective-size fact lives here (DP path)** |
| W3 | `core/pipeline.js:205-219` `widthFor` + `FONT_WIDTH_PROFILES` (196-204) | word, size, heading family | px width | Wraps W1 + **duplicate family-factor table** (see §9-D1) + `len×0.6em` fallback |
| W4 | `typography/kp-linebreak.js:23-50` `buildItems` | words + injected measure (W2) | box widths, glue `sp=measure(' ')` ×STRETCH 0.6/SHRINK 0.5 (12-13) | Consumes W2 — no re-measure |
| W5 | `kp-linebreak.js:175-181` line width sum; `:199-240` `greedyFallback` (217 FIT check) | items | `lines[].widthPx` | Same items — single computation at break time |
| W6 | **`output/geometry-projector.js:675-749` `projectLine`** — `:703` `spaceW=measure(' ')`, `:704` `widths=words.map(measure.measureTextWidth(w, effSizeOf(i)))`, `:713-715` justify `gapW=(colW-sumW)/gaps`, `:717-738` RTL x positions | CP5 line | `words[].{x,w,sizePt}` | **RE-COMPUTES every word width** for PDF (2nd full measurement of the same words). `effSizeOf` (693-701) + `customFactorMapOf` (655-673) **re-implement** W2's paren/custom size logic — two code paths for one fact |
| W7 | **`output/legacy-projector.js:39-137` `placeWords`** — `:76` spaceW, `:83` parenSpaceW, `:84-93` per-word `measureTextWidth` (marker/paren sizes 90-92), `:106-109` justify gap distribution | legacy line words | `words[].{x,w,sizePt,baselineY}` | **RE-COMPUTES every word width** for legacy PDF — the breaker (`legacy-imud-flow.js:536-660 breakPara`, incl. `dispW` marker widths 479-517) already measured the same words |
| W8 | DOM: **no measurement** — `output/dom-renderer.js:108-187 renderLine` emits spans; browser lays out. Justify via CSS `text-align-last:justify` (dom-renderer.js:936-938; html-export.js:47-56) | CP5 line | pixel positions (browser) | The browser is the **second width/justify engine** for the same lines; parity with W6/W7 enforced only by audit (tools/layout-audit/audit-in-page.js), not by construction |
| W9 | Legacy DOM `renderLegacyPage` (dom-renderer.js:691-1311): absolute boxes from model (`ln.y`, `ln.heightPx`, colDefs 864-866), text in flow inside box; `text-align-last:justify` (898-939) | legacy model | browser positions | Second engine for legacy — but here the model itself carried explicit px geometry |

### 2.2 FIT_EPS = 0.75 (and its cousins) — "does the line fit the column"
| Site | Form |
|---|---|
| `kp-linebreak.js:125` | `w > maxWidthPx - 0.75` → stop extending (S5.2 fix 3, conservative) |
| `kp-linebreak.js:138` | `slack < -0.75` → badness INF |
| `kp-linebreak.js:217` | greedy fallback: `w + space + curW > maxWidthPx - 0.75` |
| `typography/protectors.js:84` | `fitEps` default **0.75** (configurable) |
| `layout/legacy-imud-flow.js:406` | `const FIT_EPS = 0.75` (D-92 browser sub-pixel guard) — used at `:671` (limitOf−EPS), `:849` wrapText, `:1197`, `:3146` |
| `layout/dp-planner.js:157,206` | room tests use `… - 0.5`; containment `+0.5` (`:190`) |
**Verdict:** the "fit epsilon" fact is a family of 4 independent constants (0.75×3 sites + 0.5 in planner). Same intent, separately hardcoded.

### 2.3 Folio / header-slot / TOC widths
- DP folio: `geometry-projector.js:229-233` `fw = Math.max(1, Math.round(folioMeasure.measureTextWidth(ft, folioSz)))` — **authority (D-81)**; consumed by pdf-writer (`:437-441`, fallback `text.length*6`) and ink-bbox (`:848-853`, same fallback).
- Legacy folio: `legacy-projector.js:623-633` (own measurement at SZ.folio).
- Header slots: `geometry-projector.js:276-284` x/w measured at 9pt (authority for PDF/ink); **DOM does NOT consume it** — `dom-renderer.js:334-356 renderHeader` uses CSS flex + `widthPct%` (347). Legacy: `legacy-projector.js:651-693` (mk: measured w + boxW=wPct×band) vs `dom-renderer.js:765-807` (own boxW=wPct×bandW + DLB baseline factor). → **D-81 verified for the PDF side only; DOM re-derives slot geometry from settings via CSS.**
- TOC rows: `decoration/toc-builder.js` (pre-measured rows via `measureToc` = `pipeline.js:706`); DP projection `geometry-projector.js:88-107` `fakeLine` (re-measures at `:800-801`); DOM `renderTocPageContent` (dom-renderer.js:360-412, flex dots). Legacy: model rows (`legacy-imud-flow.js:3146` wrap with FIT_EPS) + `legacy-projector.js:592-614` re-measure + `dom-renderer.js:1219-1256` flex.

## 3. HEIGHT COMPUTATIONS

| Fact | Computed at | Consumers | Re-computed at |
|---|---|---|---|
| Line height (DP) | `measure-api.js:191-198 lineHeightPx` (= size×96/72×body-line-height, no rounding — S5.1) | `kp-linebreak breakLines` → `lines[].heightPx` | **`layout/dp-planner.js:107`** `lineH = Math.round(size×96/72×body-line-height)` — re-derived WITH rounding instead of consuming the API (divergence risk: 21.44 vs 21) |
| Block height | `dp-planner.js:101` `blockHeight` (Σ ln.heightPx) | estimate pages | `candidate-generator.js:24-25` (before/after sums), `dp-planner.js:397,422,449` (spanning band), `balancing.js:13-16,44,141` | All consume measured `heightPx` — OK |
| Column used height | `dp-planner.js:133-139 usedHeight` (+fn budget on last col) | placement/containment | `balancing.js:13-16 usedHeight` (**duplicate fn of same name/semantics**), `geometry-projector.js:573` (col divider), `dom-renderer.js:419` (col divider), `side-notes.js:42-50 lineYTop` — all re-sum `heightPx×aqStretch` independently (same formula ×5 sites) |
| Column capacity | `layout/column-flow.js:54-66 colCapacityOf` | **Single source since S5.2 (P-2)** — comment at 39-52 documents the 4 former copies (balancing.balancePage/autoQualityPass, dp-planner.balancePageSafe, protections-matrix.containment) | `dp-planner.js:126 colCapacity` wraps it; `balancing.js:103,148`; `dp-planner.js:583` — all call the wrapper. **Fixed duplicate** |
| Footnote note height | `layout/footnote-budget.js:17-41 noteHeight` (greedy wrap w/ spaces, marker, factor) | `getFootnotesReservedHeight` (60-70) ← `dp-planner.recomputeFnBudget` (146-151) — **single source (P1-1)** | **Re-wrapped independently:** `dp-planner.js:257-266` (inline split-policy wrap of same note text), `geometry-projector.js:344-389 wrapNoteTokens` (render-time wrap, “אותה ספירת שורות כמו noteHeight” — parallel greedy), legacy: `legacy-imud-flow.js:2696-2727` (budget) vs `legacy-projector.js:463-549` (render) |
| Side-note height | `layout/side-notes.js:16-36 estimateSideNoteHeight` | `placeSideNotes:92,136` | `geometry-projector.js:535-562 projectSideNotes` → `wrapNoteTokens` re-measures words (render) |
| Legacy flow heights | `legacy-imud-flow.js:35-67 GEO` (LINE_H 21.44, FLOW_H 915…), `:702-745` (FLOW_BOTTOM, H2_AREA_H 284.25, H3_SPAN_H 38, H0_AREA_H, SINGLE_W 552.3, TOC_*), `:760-785` stretch/compress caps, `:808-819 FIT_MODEL/FIT_ROUND/FIT_MARGIN + snapPx` | fill model `:2282-2293` (scrollHeight emulation), `:2355-2361` cursor+pitch+7px margin | DOM replicates via CSS (mkLine line-height = model pitch, dom-renderer.js:727-745, 889-896) |
| Shaar (title-page) block heights | `geometry-projector.js:141-175` (per-block greedy wrap `blMeasure.measureTextWidth`, lh=1.25×) | PDF only | DOM: `renderShaarContent` (dom-renderer.js:613-654) — browser flex/space-between; **same layout fact computed twice** (JS greedy vs CSS flex) |
| Endnote pages | `layout/endnote-pages.js` (colIdx/heightPx budget via measureWithImpl — pipeline.js:765) | model | `geometry-projector.js:478-528 projectEndnotePage` re-wraps each note (`wrapNoteTokens`); `dom-renderer.js:1353-1420` re-places from model `heightPx` |

## 4. BASELINE COMPUTATIONS (ascent / descent / half-leading)

**Formula (CSS line-box):** `baselineY = yTop + max(0,(h − (A+D)·sizePx)/2) + A·sizePx`.

| Site | Role |
|---|---|
| `measure-api.js:177-188` `ascentEm/descentEm` (0.80/0.20 table fallback; hhea in impl B) | **Authority for A/D** |
| `output/geometry-projector.js:752-774 attachBaselines` | DP pages: computes `baselineY`, `ascentPx`, `descentPx`, `capPx` for every projected line (spanning + lines), folio fallback, header `y+10`. Called once per page at `:319`. **Single source for PDF** |
| `geometry-projector.js:361-372` (wrapNoteTokens) | footnote/side-note per-line baselines (same formula inline) |
| `geometry-projector.js:241-259` (folio) | folio baseline from `FOLIO_BOTTOM_PX=25` (mirror of styles.css `.folio{bottom:25px}` — **constant duplicated CSS↔JS**, S69) |
| `output/pdf-writer.js:404-411 emitLines` | **Consumes** `ln.baselineY` / `w.baselineY`; **fallback formula at :407** `ln.y+ln.h−sizePt·(96/72)·0.78` (2nd baseline formula, dormant) |
| `output/legacy-projector.js:31-36 baselineOf` | **Same formula re-implemented for legacy pages** (duplicate of attachBaselines) |
| `output/dom-renderer.js:136-137` (DP) | DOM: no baseline math — sets `line-height = ln.heightPx×aqStretch` (CSS half-leading centers implicitly). **DOM baselines computed by browser** — 2nd engine |
| `dom-renderer.js:727-745, 889-896` (legacy mkLine) | legacy DOM: `line-height` = model pitch (same line-box model, 3rd implementation site) |
| `dom-renderer.js:766-767` legacy header | `HDR_BASELINE_Y=71.9` + `DLB_BASELINE_FACTOR=0.5+(0.7461−0.2192)/2` — hardcoded DavidLibre-Bold metrics (parallel to font-metrics.js data) |
| `legacy-imud-flow.js:863-869 parenCenterRaisePx` | paren vertical centering (consumed by dom-renderer.js:1003 and legacy-projector.js:122 — shared, OK) |
| `typography/dropword.js:49` + `measure-api.js:168-173` | capHeightEm single source (S12.1-6); also `geometry-projector.js:757` capPx |

**D-73/D-81 verdict:** baselines are single-sourced **per output channel** (projector for PDF; CSS+browser for DOM; legacy-projector for legacy PDF), not globally. The model carries `heightPx` (not baselines); every renderer re-derives baseline from A/D + height.

## 5. SPACING (glue, justify, stretch/compress)

### 5.1 Space width & justify distribution
- `spaceW = measure(' ')` computed at: `kp-linebreak.js:25,200`; `geometry-projector.js:703,347,784,801`; `legacy-projector.js:76,83,463,519`; `legacy-imud-flow.js:542,844,2697,2712,3283`; `pipeline` estimators (footnote-budget.js:31, side-notes.js:28). All route through W1 — OK.
- **Justify gap distribution `(colW−Σw)/gaps` implemented 4×:** `geometry-projector.js:713-715` (projectLine), `:368-370` (wrapNoteTokens), `legacy-projector.js:106-109` (placeWords), and CSS `text-align-last:justify` (dom-renderer.js:936-938; html-export.js:56; legacy dom-renderer 898-939). The dom-renderer.js:909-910 comment admits the duplication: “אותה נוסחה של המקרן ל-PDF”.
- **KP glue model:** `kp-linebreak.js:12-13` STRETCH_RATIO 0.6 / SHRINK_RATIO 0.5, `:21` RAGGED_END_STRETCH_FACTOR 10, LINE_DEMERIT 100 — model-only (renderer paints natural spaces; D-79).

### 5.2 AutoQuality (DP) — vertical stretch `aqStretch`
- **Set:** `layout/balancing.js:230-285 autoQualityPass` (`aqStretch = cap/used`, stages word/letter/heading-spacing, `:262,276`), `:130-190 alignColumnBottoms` (`:177-178` shared-load factors). Called from `pipeline.js:669,671`.
- **Consumed (same field, 8 sites):** `balancing.js:15,44,141`; `dp-planner.js:604` (containment after balance); `geometry-projector.js:205` (y stack), `:573` (divider), `:741` (line h); `dom-renderer.js:137` (line-height), `:419` (divider); `side-notes.js:47` (anchor Y). **Single field — good.**
- **Legacy parallel system (NOT aqStretch):** `legacy-imud-flow.js` `colStretchCap` (1805-1814), `justifyColUnits` (1820-1858: para-gap padding ≤JUSTIFY_MAX_GAP=9 + line pitch ≤JUSTIFY_MAX_LH_EXTRA=3), `compressColUnits` (1862-1923, ≤2px below base, cap ALIGN_COMPRESS_MAX=30), `stretchLastBlockToBottom` (1929-2030, PAGE_STRETCH_MAX=48), `alignBlockBottoms` (1737-1800), `tryReclaimOrphanTail` (RECLAIM_COMPRESS_MAX, dormant=0). Constants at `:760-795`. **Two independent stretch mechanisms, one per engine; different units (factor vs px) and caps.**

## 6. DOM MEASUREMENT READS (read-back that could feed layout)

| Site | Reads | Feeds layout? |
|---|---|---|
| `output/dom-renderer.js` (entire 1507 lines) | **NONE** — no getBoundingClientRect/offsetHeight/scrollHeight/measureText | No. Pure emit (REQ-PAR-05; lint ban noted at measure-api.js:5) |
| `ui/app-shell.js:374-375` | `workspace.getBoundingClientRect()` | No — workspace panel sizing |
| `ui/preview-tab.js:252-253` (`scrollHeight/clientHeight/scrollTop`), `:287-297` (`getBoundingClientRect` ×N) | **No — virtualization window only** (which pages to render; D-84). Layout untouched |
| `tools/layout-audit/audit-in-page.js:32,160,263-282,322,399-405` | Full browser audit: `getBoundingClientRect`, Range rects, scroll sweep | **Audit-only** — JSON report (INK_OUTSIDE_COLUMN, LINE_OVERLAP, LAST_NOT_CENTERED…); never fed back into the engine |
| `src/audit/scanners.js` (whole file) | **Static source scanner** (settings-key consumers, dead controls) | Audit-only; no browser measurement at all |

**Conclusion:** zero read-back measurement feeds layout decisions. The DOM *computes* geometry (as the rendering engine) but never *reads it back* into the model.

## 7. PLANNER GEOMETRY (dp-planner)

- Consumes measured `ln.heightPx` (never re-measures body words). **Re-derives `lineH`** (dp-planner.js:107) instead of calling `api.lineHeightPx` — duplicate formula w/ rounding.
- Re-measures in 3 spots: (a) `fixDropWordInColumns` via `measureFn` (dp-planner.js:181 → protectors.js:100-104 `mergedW = widthPx + space + measure(word)`); (b) footnote split policy inline wrap (`:257-266`, own fnSize/fnLH/laneW constants — duplicates footnote-budget.js:18-19); (c) `recomputeFnBudget → getFootnotesReservedHeight` (single source, P1-1).
- Spanning band heights (`:397,422,449` = Σ heightPx + orn pads from `ornament-fit.h2OrnamentReservedHeight` — single source F-08).
- Geometry hashes: `layoutHash` (:45-54, content) and `bodyGeometryHash` (:63-69, D-47 measured-geometry invariant).

## 8. PROJECTOR / RENDERER SPLIT (interfaces)

**`geometry-projector.projectPage` output contract (consumed by pdf-writer, `writePdf` opts.pages):**
- `pg.lines[] / pg.spanning.lines[]`: `{x,y,w,h,words:[{text,x,w,sizePt?,fontKey?,color?,baselineY}],align,kind,level,isLast,sizePt,tokenId,baselineY,ascentPx,descentPx,capPx}`
- `pg.footnotes[]`: `{y,x,w,marker,text,words:[{…baselineY per word}],baselineY,h,color}`
- `pg.folio`: `{y,baselineY,x,w,sizePt,text,fontKey?,color?}` (D-81)
- `pg.header`: `{y,baselineY,slots:[{pos,align,text,x,w,sizePt,fontKey?,color?,words?}]}`
- `pg.decorations[]`: `{x,y,w,h,inkType,paint,pdfOps}` — pdfOps prebaked (EXT-4; writer is dependency-free, pdf-writer.js:458-464)
- `pg.inkBounds` (projectDocument, :816-875) — parity checks.

**pdf-writer consumes** exactly these fields (`emitWord` :332-403 x/y/sizePt/fontKey/color; `emitLines` :404-411; footnotes :415-433; folio :437-442; header :444-457; decorations :461-465). Fallback formulas (dormant duplicates): baseline `:407`, footnote scatter `:423-432` (**fixed 8.2px advance** when no words — the pre-S5.4 “crushed notes” path), folio width `:438`, slot width `:446`.

**dom-renderer consumes the CP5 model directly, NOT the projector** — fields read: `page.template.{width,height,columns[].x/w,contentBox.top/height/bottom,gutter}`, `page.spanning.{heightPx,lines}`, `ln.{words,heightPx,aqStretch,isLast,kind,level,sizePt,parenSpans,customSpans,customStyle,h2OrnPad*,csOrnPad*,csCounterMark,tokenId/meta.tokenId}`, `page.footnotes[]`, `page.fnReservedHeightPx`, `page.sideNotes[].{x,yTop,colWidth}`, `page.folioDisplay`, `page.header.slots[].{text,align,widthPct,font,sizePt,color}`, `page.decorations[].{x,y,w,h,cssClass,kindStyle,image}`, `page.toc.rows`, `page.custom`. → **word x-positions and baselines are computed twice per document (browser vs projector); only audits compare them.**

**html-export.js** = dom-renderer output + BASE_CSS (html-export.js:34-162) — third consumer of the same CSS-geometry path (no projector involvement).

## 9. DUPLICATE COMPUTATION REGISTER (facts computed ≥2 times)

- **D1 — Font width-factor tables ×4 (inconsistent values!).**
  `measure-table.js:24-28 FONT_PROFILES` ({David:1.00, Narkisim:1.05, Nachlieli:0.96…}) vs `core/pipeline.js:196-204 FONT_WIDTH_PROFILES` ({David:1.04, Narkisim:1.10, Nachlieli:0.96…}) vs `layout/footnote-budget.js:15 NOTE_FONT_FACTORS` ({David:1.04, Narkisim:1.10…}) vs `layout/side-notes.js:14 SIDE_NOTE_FONT_FACTORS` (same as notes). David/Narkisim disagree between the base table (1.00/1.05) and the note/pipeline tables (1.04/1.10). Consumers gate on `measure.impl` (S70/S71.1: factor skipped in impl B) — but impl A paths multiply by different numbers depending on file.
- **D2 — Word widths measured twice per line (PDF path).** Break time: `pipeline.measureWithParen` → `kp-linebreak.buildItems` (DP) / `legacy-imud-flow.breakPara` (legacy). Projection time: `geometry-projector.projectLine:704` / `legacy-projector.placeWords:84-93`. Both call MeasureAPI (cache softens cost), but the **effective-size logic (paren scale, custom-style factor) is implemented twice**: `pipeline.js:515-527` (measureWithParen, sentinel-stripping) vs `geometry-projector.js:655-701` (customFactorMapOf+effSizeOf, span-index based) vs `legacy-projector.js:86-92` (marker/paren sizes). Divergence → PDF word x ≠ DOM/model widths (S68 comment documents the exact past bug).
- **D3 — Justify gap distribution ×4** (see §5.1): projectLine / wrapNoteTokens / placeWords / CSS text-align-last. Same formula, 3 JS + 1 CSS implementations.
- **D4 — Baseline formula ×4+2 fallbacks**: attachBaselines (geometry-projector:752), wrapNoteTokens (361-372), legacy-projector.baselineOf (31-36), CSS line-height+browser (dom-renderer:137 / mkLine:727); fallbacks pdf-writer:407 (0.78 factor), :424/:440/:448 (`y+9/+10`). A/D single-sourced in measure-api, but the half-leading composition is per-renderer.
- **D5 — Line height re-derived in planner**: `dp-planner.js:107` (rounded) vs `measure-api.lineHeightPx:191` (unrounded). Also fn line heights re-hardcoded at `dp-planner.js:257-258` (`0.8`, `×1.25`) and `geometry-projector.js:334 fnNoteSizePt` (`×0.8`), `:442` (`×1.25`), `footnote-budget.js:18-19` (same), `side-notes.js:17-18` (`×0.75`, `×1.15`), `geometry-projector.js:536,543` (same). The 0.8/1.25/0.75/1.15 constants appear in 2-3 files each.
- **D6 — Column used-height Σ(heightPx×aqStretch) ×6**: dp-planner.usedHeight:133, balancing.usedHeight:13 (+141), geometry-projector:573, dom-renderer:419, side-notes.lineYTop:42-50, dp-planner.overflows:603-606.
- **D7 — Footnote text wrapped 3× (DP)**: estimate `footnote-budget.noteHeight:17-41` (budget), split-policy wrap `dp-planner:257-266` (placement), render wrap `geometry-projector.wrapNoteTokens:344-389` (projector). Comment at wrapNoteTokens:352 claims “אותה ספירת שורות כמו noteHeight” — same greedy intent, separate code. Legacy mirrors: legacy-imud-flow:2696-2727 vs legacy-projector:463-549.
- **D8 — Header/folio geometry computed per renderer** (D-81 partial): projector x/w at 9pt (geometry-projector:281, legacy-projector:661) vs DOM flex/widthPct (dom-renderer:334-356, 765-807) vs pdf-writer fallbacks (:438,:446) vs ink-bbox fallbacks (:849,:857). Folio anchor 25px duplicated as CSS constant (html-export.css `.folio{bottom:25px}`) and JS `FOLIO_BOTTOM_PX` (geometry-projector:241); legacy FOLIO_BASELINE 1054.5 (GEO:60) vs DP computed.
- **D9 — Fit epsilon constants ×4 kinds**: kp-linebreak 0.75 (×3 sites), protectors fitEps 0.75 default, legacy FIT_EPS 0.75, dp-planner 0.5.
- **D10 — Legacy geometry constants duplicated DOM↔PDF**: `GATE_BOX` (dom-renderer:837-841 ≡ legacy-projector:254-258); `BAND_W = 2×COL_W+13.48` (dom-renderer:694, legacy-projector:225) vs `SINGLE_W=552.3` (legacy-imud-flow:725); DavidLibre-Bold metrics hardcoded at dom-renderer:767 vs font-metrics parse of the same font; folio `line-height:21.4px` calibration dom-renderer:1279 vs projector FOLIO_BASELINE.
- **D11 — Side-note/endnote/shaar heights estimated then re-wrapped**: side-notes.estimateSideNoteHeight vs wrapNoteTokens; endnote-pages budget vs projectEndnotePage + dom-renderer endnote branch; shaar blocks geometry-projector:141-175 (JS greedy, 1.25×lh) vs dom-renderer.renderShaarContent:613-654 (CSS flex space-between). Model↔render parity by mirroring, not by shared computation.
- **D12 — pt→px conversion `×96/72` inlined ~20×** (measure-api:159,197; geometry-projector:155,183,242,362,759,829,840; dom-renderer:320,349,716,731…; pdf-writer inverse `72/96` at :21; line-font.ptToPx:40 is the declared single source but is bypassed by most).
- **D13 — measure-impl duplication risk (resolved but structural)**: live model (pipeline:186) vs export model (export-api:117-122 re-typesets with font-metrics) vs projector API (export-api:137) — three MeasureAPI instantiations must agree; EXT-13/S71.1 history shows they didn't (2-17% page drift; 168-line overflow).
- **D14 — Column capacity (HISTORICAL, fixed)**: 4 copies unified into `column-flow.colCapacityOf` (S5.2 P-2, comment 39-52). Kept here as the template for future unification.
- **D15 — Footnote reserved height (HISTORICAL, fixed)**: probe vs reservation twin implementations unified (P1-1, footnote-budget.js:5-12).

## 10. AUTHORITY SUMMARY (per fact)

| Fact | Authority | Second computations (risk) |
|---|---|---|
| Char/word advance width | `MeasureAPI.measureTextWidth` (measure-api.js:142) | projector/legacy-projector re-measure (D2); browser layout (D2/D3); pipeline widthFor factor table (D1) |
| Line break + line widthPx | `kp-linebreak.breakLines` (DP) / `LineBreaker.breakPara` (legacy) | — (single per engine; two engines) |
| Line heightPx | `kp-linebreak` output via `measure-api.lineHeightPx` | dp-planner.js:107 re-derive (D5); legacy GEO.LINE_H |
| Column capacity | `column-flow.colCapacityOf` | — (unified) |
| Column used height | `dp-planner.usedHeight` (functional) | 5 parallel sums (D6) — same formula |
| Baselines | `geometry-projector.attachBaselines` (PDF-DP), `legacy-projector.baselineOf` (PDF-legacy) | CSS/browser (DOM), pdf-writer fallback, dom mkLine (D4) |
| AqStretch factor | `balancing.autoQualityPass` / `alignColumnBottoms` | legacy px-based stretch system (parallel, §5.2) |
| Folio x/w/baseline | `geometry-projector` :229-259 (D-81) | DOM CSS, pdf-writer & ink-bbox fallbacks (D8) |
| Header slot x/w | `geometry-projector` :276-284 (PDF only) | DOM flex widthPct (dom-renderer:347) — **not consumed from projector** |
| Footnote height budget | `footnote-budget.noteHeight` + `getFootnotesReservedHeight` | split-policy wrap (dp-planner:257-266), render wrap (D7) |
| Ornament rects | `ornament-fit` (fit/reserved height, F-08/F-09) + `ornament-ink` (ink/pdfOps) | renderers paint from rect only — OK |
| Running-head **text** | `headers-builder.buildHeader` (no geometry) | geometry per-renderer (D8) |

## 11. Next actions suggested for unification
1. Make `dp-planner` consume `api.lineHeightPx` (kill D5 re-derivation).
2. Persist per-word measured widths (and effective sizes) on the line model at break time; make `projectLine`/`placeWords` consume them instead of re-measuring (D2) — or make DOM consume projector geometry for parity by construction.
3. Consolidate the 4 font-factor tables into measure-table (D1).
4. Extract one `justifyGaps(sumW, gaps, colW, spaceW)` helper shared by projectLine/wrapNoteTokens/placeWords (D3).
5. Unify fit-epsilon into one exported constant (D9) and legacy/DP stretch semantics behind one interface (§5.2).
6. Have DOM renderHeader consume projector slot x/w (or vice versa) to close D-81 for the live view.
