# G — Notes & Anchors Subsystem Map (Stage 1 Forensic)

Repo: `/home/z/my-project/repo` @ branch `audit/stage1-engine-state-20261115` (base main 95e829d)
Scope: margin/foot notes (הערות שוליים), side notes (הערות צד), endnotes (הערות סיום) — parse, linkage, geometry, split/continuation, reading order, known failure SIDE_NOTE_OVERLAP (p107 very_long), retreat-loop analysis.
All paths relative to `red-build/src/` unless noted. Line numbers verified on this branch.

---

## 1. Note types — where parsed, where laid out

### 1.1 Footnotes / margin-gutter notes (הערות שוליים)

| Concern | Legacy path (IMUD) | DP path (modern pipeline) |
|---|---|---|
| Syntax recognition | `[ … ]` via `cfg.fnOpen`/`cfg.fnClose` (default `[`/`]`, `fn-delim-open/close` bridged via `RED_SETTING_BRIDGE_S77`, `layout/legacy-imud-flow.js:189-190,228-229`). Scanner: `findNotes()` `legacy-imud-flow.js:147-160`; multi-line gluing `tokenizeDoc()` `legacy-imud-flow.js:316-331` (note line joins **previous paragraph only**, never a heading) and unclosed-note join `legacy-imud-flow.js:342-346`. | Same delimiters from settings; `parser/block-tokenizer.js:tokenize()` `:55-59` + `scanBrackets` `:102`; note text internal spaces → `\uE000` ATOMIC_SPACE `:118` (REQ-LB-04); outermost pairs → `parts.push({kind:'note-ref', noteIndex})` `:120-121`; consecutive `[a][b]` = separate notes (REQ-PAR-04, header comment `:36`). |
| Marker allocation in body | At line emission: `emitLinesWithMarkers()` `legacy-imud-flow.js:1627-1698` — per word `findNotes`, occurrence key `` `${tok.id}#${ord}` `` (`notesUpTo()` `:1631-1640`), `enqueueNote()` `:1446-1474` returns `LineBreaker.markerWord(num, sep)` = `toGematria(num)+sep` (`:523`, gematria `:85-109`). Per-chapter stable numbering `fnNoteNumbers` (`:1461-1465`, reset mode `siman`). | At block build: `core/pipeline.js:483-506` — `marker = markerFor(nextMarkerNum(...), markerStyle)` `:485`; `noteAssignments.push({noteIndex, marker})` `:487`; in footnotes/endnotes mode only the **marker** is pushed to body words `:501-505`; note object `{text, marker, tokenId, noteIndex, part}` into `blk.notes` `:503`. Counter policy D-41: `makeCounter()` `notes/markers.js:52-72`; marker styles `markerFor()` `notes/markers.js:25-43`. |
| Gutter geometry | Budget `fnReserveFor()` `legacy-imud-flow.js:2778-2813` (+`fnBodyFirstLines()` `:2751-2776`); clamp `applyFnReserve()` `:1405-1409`; placement bottom-anchored `placeFootnoteArea()` `:2497-2677` (`yy = FLOW_BOTTOM − totalH`, `:2582,2664`); flow construction `fnFlowFor()` `:2710-2742` / `fnItemsFor()` `:2684-2702`; page close hook `:2443-2453`; per-paragraph requeue `requeueParaNotes()` `:1478-1498` (S4.9: notes of a paragraph re-flow on **every** page the paragraph has lines). | Budget+placement fused at placement time: `layout/dp-planner.js:reserveNotes()` `:233-289` (continuations first `:237`; long-note policy split/move-whole/reject-to-body `:254-285`); `recomputeFnBudget()` `:146-151` → `page.fnReservedHeightPx` (single source `layout/footnote-budget.js:getFootnotesReservedHeight` `:60-70`, `noteHeight` `:17-41`); budget charged to **last column** in `usedHeight()` `dp-planner.js:133-139`. |

### 1.2 Side notes (הערות צד)

| Concern | Legacy | DP |
|---|---|---|
| Syntax | `כותרת 7` heading with `HEADING_MODES[7]='side_note'` (`legacy-imud-flow.js:79-82,356-360`) → accumulates into `pendingSideNote`, attached to the **next paragraph token** `:365-369`; tail flush `:377-384`. | heading level 7 or `heading-N-mode='side-note'` → `asSideNote` (`layout/headings-escort.js:14`); tokenizer heading path `parser/block-tokenizer.js:65-69`; custom-style `layoutMode:'side-note'` variant `core/pipeline.js:578`. |
| Layout | At unit emission: `emitUnit()` `legacy-imud-flow.js:3028-3042` — anchor = paragraph top (`:3032`), wrap at `GEO.MARGIN_W=50.5` `:3036`, pushed to `pg.marginNotes` `{side:'right'|'left', anchorY, lines[]}` `:3037-3041` (pitch `GEO.MN_PITCH=9.6`, `:66`). **No cascade / no collision check** (see §7). | Registration in DP: `dp-planner.js:360-371` (heading side-note → `cur.sideNotes.push({text, anchorToken: host.tokenId, ownToken})`, host = next paragraph) and `:381-392` (custom style). Placement: `layout/side-notes.js:placeSideNotes()` `:72-154`, invoked at **CP4** `core/pipeline.js:739-742` (geometry-neutral proof around it, `:737,790-791`). |

### 1.3 Endnotes (הערות סיום)

| Concern | Legacy | DP |
|---|---|---|
| Syntax | `cfg.endPrefix` = `en-line-prefix` (default `הערת סיום -`) `legacy-imud-flow.js:230,347-350` → `pendingEndNote` → next paragraph token `:365-369`; tail flush `:377-384`. | `parser/block-tokenizer.js:47-54` numbered form `הערת סיום-N - text` (D-40 anchor number), `:81-87` plain content form, `:88-92` class directive `הערות סיום - title` (plural — the only non-colliding directive form). Routing: `core/pipeline.js:359-376` — endnotes mode → `endnoteTokens` `:364`; other modes → body paragraph `:371-374` (`isEndnoteSource`). |
| Layout | Dedicated pages built inline: `legacy-imud-flow.js:3285-3333` — `openEndPage()` `:3285-3293` (type `'endnotes'`, title band `EN_TITLE_H`), `nextColOrPage()` `:3294-3297`, per-token wrap at `GEO.COL_W − max(mkW, contW)` `:3303`, room = `floor((FLOW_BOTTOM − enY)/FN_PITCH)` `:3306`, continuation head `'(המשך)'` `:3318`. | `layout/endnote-pages.js:buildEndnotePages()` `:42-174`, called `core/pipeline.js:763-767`, pages appended `:774-785` (PT-07 template, D-51 note-page markers; folio numbering conditional on `count-endnote-pages`). Capacity from template `contentBox.height` `:76-79`; marker allocation with used-mark sets (S69 anti-collision) `:64-141`; title continuation `` `${base} (המשך)` `` `:188-190`. |

Inline mode (`note-placement-mode='inline'` or footnotes disabled): full placeholder in body — `core/pipeline.js:488-499` (D-30, see §2).

---

## 2. Marker→body linkage

**Verdict: hybrid.** Structural (index/tokenId) from parse → block; **reconstructed by string parsing** at every later re-merge (accounting, renumber, reject-to-body, PDF/DOM scrub).

### 2.1 Structural phase
- Paragraph token carries `t.notes[]` + `parts[{kind:'note-ref', noteIndex}]` (`parser/block-tokenizer.js:118-126`) — index linkage.
- `core/pipeline.js:483-505`: marker assigned once per note-ref, recorded in `noteAssignments` (`:487`) and `markersByToken.set(t.id, noteAssignments)` (`:508`); note object carries `{tokenId, noteIndex, marker}` (`:503`) → structural through `blk.notes` → `reserveNotes` (`dp-planner.js:233`) → `page.footnotes`.
- Legacy: occurrence key `` `${tok.id}#${ord}` `` (`legacy-imud-flow.js:1665-1673`) via positional scan `notesUpTo` (`:1631-1640`) — positional, but deterministic and re-emission-safe; legacy queue entries match by key with `srcText` fallback for continuations (`:1452-1456`, S6.0/F3).

### 2.2 Placeholder format & split points (D-30 / D-53)
- Placeholder construction (inline + reject-to-body):
  - Inline: `` `${MARK_TAG}${marker}${ATOMIC}${noteFlat.replace(/ /g, ATOMIC)}` `` — `core/pipeline.js:492` (`ATOMIC='\uE000'` `:47`, `MARK_TAG='\uE102'` `notes/markers.js:186`). Marker glued to anchor word with NBSP (`:494-498`, BRZ-11).
  - Reject-to-body: `dp-planner.js:rejectToBody()` `:295-321` — rewrites the tagged word `anchor\u00A0\uE102marker` → `anchor\u00A0marker\uE000text` (`:304-309`) or appends a synthetic line `` [`${n.marker}\uE000${textE}`] `` (`:311-312`); removes the note from `blk.notes` to avoid double counting (`:314-315`).
- Marker gluing (D-53): `bindMarkersToNeighbors()` `core/pipeline.js:226-247` — `anchor\u00A0\uE102marker` (backward glue preferred `:235`, forward `:237`, tagged-alone `:239`).
- Split-back points (`marker \uE000 text` → marker + text):
  1. `core/pipeline.js:explodePlaceholderWord()` `:908-917` — content-accounting OUT side; splits at **first** `\uE000` (D-30 comment `:490`).
  2. `core/pipeline.js:countKnown()` `:1044-1058` — marker-consistency audit; recognizes markers **only** via MARK_TAG or `\uE000` (NC-10: a bare "1" in text is not a marker).
  3. `notes/markers.js:renumberPageScopedMarkers()` `:144-167` — regex surgery on body words: `\uE102{old}(?=\u00A0|$)` and `^{old}\uE000` (`:150-151`); skips entirely on custom-marker collision (`:126-131`).
  4. `layout/footnote-budget.js:noteHeight()` `:20` — `text.replace(/\uE000/g,' ')`.
  5. `layout/dp-planner.js:260,307,311` — split-policy wrap + rejectToBody text conversion (spaces↔E000).
  6. `output/geometry-projector.js:448,457,510` — PDF projection scrub.
  7. `output/dom-renderer.js:scrubPUAText()` `:49` — display scrub (ATOMIC→space, strips `\uE102`).
  8. Legacy mirror: created `legacy-imud-flow.js:457` (spaces→E000 inside `[...]` for atomic measurement), removed `:518`.
  9. `typography/kp-linebreak.js:41` — E000→NBSP inside line-break items (note is never torn, REQ-LB-04); measurement ignores `\uE102` (`core/pipeline.js:516`).

### 2.3 Where the linkage can break
- **Marker separated from anchor across a line/page**: NBSP glue is the only mechanism; `protectWords` may dissolve the glue when the glued unit exceeds column width (documented `core/pipeline.js:222-225`). Residual violation class detected (not repaired) by `protections-matrix.js:markerLineBreak()` `:163-180` — a MARK_TAG unit **without** NBSP as the last word of a line ⇒ `note-marker-line-break` (BRZ-11). Because detection is tag-based (D-53), false positives from bare numbers are eliminated (`protections-matrix.js:155-161`).
- **Orphan / duplicated note**: legacy historical bug — three push paths into the queue without de-dup gave duplicated notes ("very_long: 70 pages with duplicated notes", comment `legacy-imud-flow.js:1438-1446`); now single entry `enqueueNote` + key de-dup (`:1446-1474`) and continuation de-dup (`:1493-1494`, `:2260-2261`). Cross-page paragraph re-emission reuses the same key ⇒ same marker (S4.26 `:1458-1465`).
- **Marker string collisions**: `renumberPageScopedMarkers` full-skip on custom-mark collision (`notes/markers.js:127-131`) silently leaves continuous numbering (no-op of the page-reset policy). Endnote duplicate explicit numbers are ledgered, not renumbered (`endnote-pages.js:124-130`).
- **Known-open on main (very_long)**: `MARKER_NOTE_MATCH` — י״ז appears 3× in body vs 2 note openings; כ״ג in body with no opening (`ai-chat/ChatGPT.md:4578-4580`); audit compares global marker strings without per-part reset awareness (`ai-chat/ChatGPT.md:4641`). This is the string-reconstruction linkage's weak spot: the audit itself re-parses marker strings rather than walking `noteAssignments`.
- **Integrity nets**: word-multiset compare (`core/pipeline.js:998-1020`), token-representation check `:1022-1033`, body-vs-assigned and display-vs-assigned marker counts `:1035-1106` (`marker-mismatch` kinds) — these catch loss/duplication of markers and note text at the end of every run.

---

## 3. Geometry responsibility map

### 3.1 `layout/side-notes.js` — `placeSideNotes()` `:72-154`
- **What**: per-page vertical allocation of side notes in the outer margin lane. NOT per-column — a single lane per page (x fixed for all notes on the page: recto left / verso right, `:82-84`).
- **Input**: `pages` (each with `sideNotes[]` from dp-planner registration + `columns`), `settings`, `measureFn`, hooks `{ledger, eventLog}`.
- **Algorithm**: height = `sn.heightPx || estimateSideNoteHeight()` (`:92`; est. `:16-36`: 0.75× body pt, lh ×1.15, greedy wrap into `_sideNoteColWidthPx`); anchor y = `lineYTop(page, colIdx, lineIdx)` of the anchor's first line on the page (`findAnchorLine` `:53-62`; `lineYTop` `:42-50` includes spanning band + `aqStretch`); **push-down cascade** `yTop = max(yTop, lastBottom + STACK_GAP_PX)` (`:99`, STACK_GAP_PX=8 `:11`); containment `yTop+h ≤ contentBox.bottom + CONTAINMENT_PX` (`:101`, CONTAINMENT_PX=20 `:10`); overflow → `deferred` + `pending` → next page (`:102-104`); leftovers after last page → appended **tail page** (`:122-151`, BRZ-15 no-glyph-loss; note taller than a page placed with ledgered containment breach `:137-144`).
- **Output**: `{placed, deferred, overflow}`; `page.sideNotes` rebuilt to actually-placed records with `{x, yTop, heightPx, colWidth, batchGroup}` (`:106-114`).
- **Consumers**: `core/pipeline.js:742` (call), `:994` (content accounting), `:1025` (token-representation check); `verifyH7Conversion()` `side-notes.js:163-175`; `output/dom-renderer.js:1489-1503` (absolute `top/left/width` only — height is content-driven); `output/geometry-projector.js:projectSideNotes()` `:535-562` (consumes `sn.x/sn.yTop/sn.colWidth`, re-wraps tokens itself).

### 3.2 `layout/footnote-budget.js` — the budget
- **What budget**: vertical px the footnote gutter will claim at the bottom of the content box, per page. `getFootnotesReservedHeight()` `:60-70`: 1-col = Σ noteHeight; 2-col = greedy LPT into 2 lanes → max lane height. `noteHeight()` `:17-41`: 0.8× body pt, lh 1.25, lane width `settings._fnColWidthPx` (tuned in `core/pipeline.js:263-265` from template geometry), first line shortened by marker width + space (R3-C3), impl-aware font factor (`:24-25`, S70).
- **Who consumes**: `dp-planner.js:recomputeFnBudget()` `:146-151` (sole writer of `page.fnReservedHeightPx`, called from `reserveNotes` `:288` and tail flush `:517`); `usedHeight()` `:133-139` (budget charged once to last column — F-17 probe==reserved); `colCapacity` `:126` (`fnBudget:false` — mathematically equivalent); `optimalSplit({extraLast: fnReservedHeightPx})` `:170` and `balancePageSafe` `:583-584` (P1-8); `dom-renderer.js:220-229` (area top = `contentBox.bottom − fnReservedHeightPx`); `geometry-projector.js:433-436` (gutter top). Legacy has its **own** budget (`fnReserveFor` `legacy-imud-flow.js:2778-2813`) — no shared code.

### 3.3 `layout/endnote-pages.js` — `buildEndnotePages()` `:42-174`
- **How**: group by `part` (`:47-54`); marker allocation honoring explicit `n.num`, inline markers, per-part/continuous policy, used-mark sets (S69) `:109-142`; note height `estimateNoteHeight()` `:199-213` (0.8× body, includes inter-word spaces — R3-C3); title band `estimateTitleHeight()` `:193-196` budgeted once per page (`titleBandPx`, P-3 fix); fill column 1 → column 2 → new page titled `base (המשך)` (`:147-159`, `:188-190`); atomicity: a note never splits between columns; note taller than column stays alone (progress guarantee, `:144-147`).
- **Output**: pages `{type:'endnotes', part, subIndex, heading, notes[], columns[colIdx][], titleBandPx, isEndnotes:true}` (`mkPage` `:176-186`).
- **Consumers**: `core/pipeline.js:763-785`; `dom-renderer.js:1353-1420` (absolute column placement from `colIdx`); `geometry-projector.js:projectEndnotePage()` `:478-528` (title fake-line + per-column re-wrap; y advances by model `n.heightPx` `:525`).

### 3.4 Duplication register (who computes note geometry)

| # | Geometry concern | Implementations (file:fn:line) | Sync mechanism |
|---|---|---|---|
| D1 | Footnote height estimate | `footnote-budget.js:noteHeight:17-41` (DP budget) · `dp-planner.js:reserveNotes:256-275` (separate inline wrap for split cut point) · `legacy-imud-flow.js:fnItemsFor:2684-2702` + `fnFlowFor:2710-2742` + `fnReserveFor:2778-2813` (legacy) | none structural — comments assert parity ("מקור יחיד" `legacy-imud-flow.js:2679-2683`) |
| D2 | Endnote height | `endnote-pages.js:estimateNoteHeight:199-213` | separate algorithm from D1 (same spirit) |
| D3 | Side-note height | `side-notes.js:estimateSideNoteHeight:16-36` (model) vs `geometry-projector.js:wrapNoteTokens` via `projectSideNotes:535-562` (PDF ink) vs browser re-wrap `dom-renderer.js:1489-1503` (DOM ink) | **estimate must dominate both ink paths; nothing enforces it** |
| D4 | 2-lane LPT assignment | `footnote-budget.js:66-69` · `dom-renderer.js:277-282` · `geometry-projector.js:427-431` | triplicated manually ("אותו אלגוריתם", both renderers) |
| D5 | Footnote area position | model `fnReservedHeightPx` (writer `dp-planner.js:146-151`); DOM `dom-renderer.js:220-229`; PDF `geometry-projector.js:433-436`; legacy `placeFootnoteArea` bottom-anchor `legacy-imud-flow.js:2582,2664` | DP: renderers consume model ✓; legacy: independent |
| D6 | Footnote per-line/per-word ink | DP: **no model lines** — `geometry-projector.js:452-463` `wrapNoteTokens` (PDF) and browser flow (DOM `dom-renderer.js:298-305`) each wrap independently; legacy: model lines carry explicit `y` (`legacy-imud-flow.js:2583,2668`) consumed by `dom-renderer.js:1150-1153` and `legacy-projector.js:461-575` | DP relies on same measure impl + FIT_EPS (`legacy-imud-flow.js:406` D-92 applies to legacy flow; `geometry-projector` uses its own wrap) |
| D7 | Side-note absolute position | model only: `side-notes.js:106-114`; both renderers consume verbatim (`dom-renderer.js:1495-1500`, `geometry-projector.js:541-560`) | ✓ single writer |
| D8 | Marker glyph rendering | `notes/markers.js:markerFor` (single source, P1-3) consumed by `dom-renderer.js:237,251`, `geometry-projector.js:392-398`, `endnote-pages.js:126-139`; legacy uses its own `toGematria`+`markerWord` (`legacy-imud-flow.js:85-109,523`) | two numbering systems by design (gematria legacy vs style-driven DP) |

**dom-renderer re-positioning?** No for area origin (consumes `fnReservedHeightPx`, `side-notes` yTop/x, endnote colIdx). Yes in effect for **ink**: DP footnote/side-note text is re-wrapped by the browser (`white-space:normal` blocks; `dom-renderer.js:1165` explicitly relies on browser re-break), and the two-lane split is re-computed there (D4).
**pdf-writer re-computing?** No. `output/pdf-writer.js:5` header: "writes PDF from geometry-projector — single source". Footnotes: `pdf-writer.js:415-433` emits `fn.words` with per-word `x/baselineY` from the projector; only a legacy fallback (`fn.words` absent) uses the old fixed-step formula `:423-432`. Legacy pages go through `output/legacy-projector.js:419-575` (margin notes + footnote word placement) — a second, legacy-only projector implementation.

---

## 4. Split / continuation ('(המשך)')

- **DP footnotes** (`dp-planner.js:reserveNotes:233-289`): trigger = note height > `barMax` in **block** mode (`fn-layout-mode`, D-34) with `long-footnote-policy`:
  - `split` `:255-277`: real text split at word boundary — `linesFit = floor(barMax/fnLH)` `:261`, greedy wrap to `cutIdx` `:262-266`; first part `{mode:'split-first', linesShown}` `:274`; rest → `pendingBarNotes {isContinuation:true, mode:'split-rest'}` `:275` (event `fn-split` `:276`).
  - `move-whole` `:279-283`; `reject-to-body` `:284` (§2.2).
  - Continuations re-enter at **head** of next page's queue (`:237`); end-of-doc leftovers flushed onto last page (`:512-520`, BRZ-15).
  - `continuous` mode: `barMax = +Infinity` (`:238-240`) — notes flow with no per-bar ceiling (D-34); ceiling is then the page capacity via `recomputeFnBudget`/`usedHeight`.
  - Continuation marker '(המשך)' prefix: `dom-renderer.js:243,256`; `geometry-projector.js:446`.
- **Legacy footnotes** (`legacy-imud-flow.js:placeFootnoteArea:2497-2677`):
  - continuous `:2545-2621`: whole queue flows as one stream (`fnFlowFor`), cut at `maxLines` (`:2555-2562`); mid-note cut detection `midNoteCut` (`:2571-2579`, same `noteIdx` on both sides of the cut); rest regrouped per note into `pendingFootnotes` with `cont` and preserved `key` (`:2593-2620`); `(המשך)` token emitted by `fnFlowFor:2720-2721` for `cont` notes; cut line justified both sides (`cutLast`, S77).
  - block `:2623-2676`: per-note atomic placement; split at line boundary `:2645-2656` (`cut:true` → rest `cont:true`); move-whole when `!fnSplitEnabled` and note fits a full page `:2635-2643`.
- **D-91 ceiling = page capacity** — constants in legacy: `GEO.FLOW_H = 915` (`legacy-imud-flow.js:48`); `FN_FULL_CAP_PX = floor((FLOW_H − 38.5 − LINE_H)/FN_PITCH)×FN_PITCH` (`:900-904`) — full-page gutter capacity keeping ≥1 body line; body-first default relative cap = 50% of FLOW_H (`FN_BODY_FIRST_CAP_PX` `:930-933`); `fnBarMax = min(user, FN_FULL_CAP_PX)` `:934-936`. Section-boundary carry washing: `flushPendingFootnotes()` `:3062-3067` (S76/ליקוי 2 — continuations finish in their own chapter's pages before the next h0/h1/h2).
- **Endnote continuation**: title-based (`endnote-pages.js:188-190`) — a note never splits mid-column (atomicity `:144-147`); legacy endnotes DO split mid-note across columns with `'(המשך)'` head on the continuation segment (`legacy-imud-flow.js:3317-3321`).

---

## 5. Reading order (notes vs anchors)

- **Line order (DP)**: every placed line tagged `seq` at push (`dp-planner.js:106,208,216`); `protections-matrix.js:readingOrder()` `:186-203` walks col0-top-down then col1 and requires non-decreasing `seq`; violation `reading-order-break` is **not auto-repaired** — ledgered `correction-blocked` (`dp-planner.js:541-546`). Order-preserving move primitive: `layout/ordering.js:moveLineForward()` `:14-27` (used by balancing; P0-3).
- **Note order (DP)**: continuations before new notes each page (`dp-planner.js:237`); notes follow block order (paragraph order = document order); per-page renumbering after planning only shortens markers (`notes/markers.js:86-88` — geometric safety argument).
- **Note order (legacy)**: fill order right column → left column (`block.fill` transition `legacy-imud-flow.js:2308-2310`); marker ordinal recomputed by absolute position (`notesUpTo` `:1631-1640`) so re-emitted paragraph fragments keep identical keys/markers; page first/last word order for headers `:3390+`.
- Side-note anchors: anchored to host paragraph's **first line on the page** (`side-notes.js:53-62`), not to reading-order position — a side note may visually precede its anchor's column if the anchor is not found (falls back to `contentBox.top`, `side-notes.js:97`).

---

## 6. Known failure: SIDE_NOTE_OVERLAP (page 107, very_long) — root-cause hypothesis

### 6.1 Where the check lives (correction to the task brief)
`red-build/src/audit/scanners.js` does **not** contain SIDE_NOTE_OVERLAP — that module is the settings-registry consumer scanner (dead controls / phantom keys / orphan mechanisms, `scanConsumers()` `scanners.js:61-113`). The actual checks:
- **Live-DOM audit**: `tools/layout-audit/audit-in-page.js:351-357` — pairwise `getBoundingClientRect` overlap of `.side-note, .margin-note` elements; fires when `ox > 1 && oy > 1` (both axes), severity high, `px = min(ox, oy)`.
- **Model audit**: `tools/layout-audit/full-math-audit.js:324-333` — same pairwise test on model boxes `{x,y,w,h}`; family list `:631`; pure-family note `:835`.
- Sensitivity test: `red-build/tests/e2e/audit-sensitivity.test.js:379-386` (two notes 20px apart with h=40 must fire).
- Known-open status: `WORKLOG.md:181` ("2×SIDE_NOTE_OVERLAP עמ' 107 טרם רשומים"), `ai-chat/SESSION_HANDOFF.md:390`, `ai-chat/ChatGPT.md:4578` (depths **8px and 2px**), `:4639`, `:4847`. Corpus: `audits/very_long_test_text.txt` (`ChatGPT.md:4849`).

### 6.2 Root-cause hypotheses (ranked)

**H1 — Legacy path has NO side-note collision logic at all (primary for very_long).**
`legacy-imud-flow.js:emitUnit()` `:3028-3042` pushes `pg.marginNotes.push({side, anchorY, lines[]})` with anchor = paragraph top (`:3032`) and lines stacked at `GEO.MN_PITCH=9.6` (`:3040`). There is **no cascade, no stack gap, no height-vs-next-anchor check, no containment** — unlike the DP path (`side-notes.js:99,101`). Two paragraphs in the **same column** whose tops are closer than `lines₁ × 9.6` produce overlapping margin notes. very_long is the legacy-profile user book (referenced throughout legacy comments, e.g. `:2516`, `:2760`), and the live audit checks `.margin-note` too (`audit-in-page.js:337`). Observed depths 8px/2px are exactly the sub-pitch residues of such anchor-collision (e.g., anchors 50px apart, first note 6 lines = 57.6px → ~8px overlap after rounding). The 0.22×flex shift after footnote placement (`:2476-2483`) shifts `mn.anchorY` and `l.y` uniformly, so it does not create but also does not mask such overlaps.

**H2 — DP path: estimate-vs-ink divergence defeats the 8px cascade gap (secondary; applies to DP-profile corpora).**
`side-notes.js` spaces notes by the **estimated** height (`:92,99,115`), but the rendered/PDF box height comes from independent re-wraps:
- DOM: `dom-renderer.js:1489-1503` sets only `top/left/width`; height is browser-wrapped (CSS line-height of `.side-note` vs. engine's `round(size×96/72×1.15)` heuristic, `side-notes.js:18`).
- PDF: `geometry-projector.js:projectSideNotes()` `:535-562` re-wraps via `wrapNoteTokens` — and **prepends `sn.counterMark` to the first line** (`:545`), a token `estimateSideNoteHeight` never accounts for (`side-notes.js:29-34` wraps only `sn.text` words). DOM does the same (`dom-renderer.js:1501`: `counterMark + text`). A counterMark (or impl-A/impl-B factor divergence — S71.1 comment `side-notes.js:22-26` admits "ב-impl B … דחיפות cascade/מעבר-עמוד מוטות מול התצוגה") can add one line ⇒ next note's `yTop` sits inside the previous note's real box. With lh ≈ 14-18px and STACK_GAP_PX=8, residual overlaps of 2-8px are the expected magnitude.
- Containment slack: CONTAINMENT_PX=20 (`side-notes.js:10,101`) explicitly tolerates 20px breach "not considered real overlap (catalog D3)" — within-page cascade can therefore end a note up to 20px past the content box while the next page's note starts at `contentBox.top` (no cross-page interplay, so this alone cannot cause pair-overlap, but it shifts the error budget).

**H3 — Cross-column anchor resolution.** `findAnchorLine()` (`side-notes.js:53-62`) scans columns in order and returns the first line matching `anchorToken`; a note whose host paragraph starts in col1 is positioned at col1's line y — but all notes share the single outer lane x. The cascade (`:99`) is sequential in **queue order** (= registration order), not anchor-y order: a note registered earlier but anchored **lower** on the page is placed first at its (lower) yTop; the next note anchored **higher** is then pushed down only if it collides with `lastBottom` — cascade handles this — **but** when the earlier note is *deferred* (`:102-104`), `lastBottom` is not updated, and the deferred note re-anchors on the next page while a subsequent note may occupy the region it vacated — order inversion without overlap on the same page. Marginal, listed for completeness.

**Recommended probe for Stage 2**: re-run the audit with `RED_DEBUG`-style dump of `pg.marginNotes` (legacy) on page 107 — if the two overlapping elements are `.margin-note`, H1 is confirmed and the fix is a legacy `placeSideNotes`-equivalent cascade (or routing legacy margin notes through `side-notes.js`). If they are `.side-note`, instrument `estimateSideNoteHeight` vs. actual `el.getBoundingClientRect().height` for the colliding pair (H2) and add counterMark width to the estimate (`side-notes.js:29-34`) plus widen STACK_GAP_PX or make placement use renderer-fed heights.

---

## 7. Retreat-loop analysis (`layout/retreat-loop.js`, 153 lines)

- **Who calls it**: `dp-planner.js:planPages()` at its end — `runRetreatLoop({...})` `dp-planner.js:532-561`, with `assess = (page) => runProtections(page, s, lg).violations` (`:531`). `core/pipeline.js` never calls it directly; it calls `planPages` (`core/pipeline.js:596`) and receives `retreat` in the result (`dp-planner.js:563`, exposed `core/pipeline.js:1215`). The **legacy engine does not run it at all** (`legacy-imud-flow.js:3695` returns `retreat: null`).
- **What triggers an iteration**: any violation set produced by `runProtections` over all pages (`retreat-loop.js:59-63`; checks: widow/orphan, heading-escort, runt, marker-line-break, reading-order, paren-cross-boundary, imbalance, containment, underfill — `protections-matrix.js:52-259`). Exit conditions: converged (no violations, `:64-69`); oscillation (signature repeats within `OSCILLATION_WINDOW=4`, `:74-83`); no-repair-available freeze (`:111-121`); ceiling `MAX_ITERATIONS=24` (`:18,125-129`).
- **What it "retreats" (mutates)**: only `repairFns` mutate state. Supplied by dp-planner (`:534-559`):
  - `column-imbalance` → `balancePageSafe()` (`dp-planner.js:571-600`): re-splits the two columns via `optimalSplit` with `cap = colCapacityOf(page, {fnBudget:false})` and `extraLast: page.fnReservedHeightPx` (`:583-584`) — **this is the footnote-cost ↔ approved-lines relationship**: the footnote budget rides on the last column and caps how many body lines balancing may approve; the loop itself never recomputes `fnReservedHeightPx` (notes/budget fixed at placement time).
  - `reading-order-break`, `widow-bottom`, `orphan-top` → **no mutation**: ledger `correction-blocked` ("documented compromise", `:541-557`).
  - `paren-cross-boundary`, `heading-escort`, `note-marker-line-break`, `runt-line`, `containment`, `page-underfill`: **no repairFns registered** — these are "report, don't fix" kinds; if they are the *only* kinds present, the loop hits the no-repair freeze (`retreat-loop.js:111-121`).
- **Oscillation (ping-pong) risk**: low for genuine alternation, but the detector mostly fires on **fixed points**:
  - `balancePageSafe` is deterministic and near-idempotent (early return when already balanced `:578`; `optimalSplit` is a deterministic O(n) scan). A page with no legal split keeps its imbalance → same signature every iteration → the repeat-within-window check (`retreat-loop.js:74-83`) freezes it labeled "oscillation" although nothing actually alternated. Behaviorally safe (freeze + `rollback-compromise` + `recordRemaining`), semantically mislabeled.
  - True ping-pong would require a repair that creates a violation of another kind on the same page (e.g., balance moving a line to fix imbalance creating a widow). Repair order is fixed and deterministic (`retreat-loop.js:88-90`), and `seen` map (`:29-30`, `:99-107`) keeps one ledger record per `kind@target` for repaired kinds — reintroduced violations transition `reintroduced→persists` on the same record (`recordRemaining` `:135-151`).
  - **Minor leak**: `balancePageSafe`'s internal `ledger.create('rollback-compromise', ...)` (`dp-planner.js:589`) is outside the loop's `seen` map — if the same page is re-repaired in successive iterations before freeze, duplicate compromise records can accumulate (bounded by OSCILLATION_WINDOW).
  - Dry-run discipline (D-43/P1-4): `makeDryLedger()` `retreat-loop.js:42-54` ensures transient violations never reach the real ledger; only end-state findings are recorded — verified by `recordRemaining` call sites `:78,115,126`.
- **State changes summary**: mutations are confined to `page.columns[*]` (line sets, via `optimalSplit`), page `balanceInfo`, and ledger records. Footnotes, side notes, endnote pages, `fnReservedHeightPx`, and marker strings are **never** touched by the retreat loop — note geometry is decided before it runs (placement-time budgets) and after it runs (CP4 side-note placement).

---

## 8. Cross-cutting invariants worth preserving in the unification

1. **Marker counted once at anchor, note text once at display** (D-30) — enforced end-to-end by `srcWordsOf`/`outWordsOfAll` multiset compare (`core/pipeline.js:928-1020`) and marker-count compares (`:1035-1106`).
2. **Single marker source** (`notes/markers.js`, P1-3) — legacy gematria path is the sanctioned divergence.
3. **CP4 geometry-neutrality** (D-47): side notes/endnotes placed after `bodyGeometryHash` snapshot (`core/pipeline.js:737,790-791`).
4. **probe==reserved** (F-17/P1-1): `recomputeFnBudget` is the only budget writer (`dp-planner.js:142-151`); legacy mirrors this with `fnItemsFor`/`fnFlowFor` shared by budget and placement (`legacy-imud-flow.js:2679-2683`).
5. **BRZ-15 no-loss**: every overflow path defers/splits/tails rather than dropping (dp `:512-520`, `side-notes.js:122-151`, legacy `pendingFootnotes` + tail flush `:3062-3067`).

## 9. Open questions for Stage 2

- Confirm H1 vs H2 for p107 (§6.2) — need a live run with instrumented `pg.marginNotes`/`pg.sideNotes`.
- D4 (LPT triplication) and D3 (side-note estimate vs two ink paths) are the two duplication registers with no structural sync — candidates for extraction into `footnote-budget.js` / a shared note-wrap module.
- DP footnote gutter has no model-level per-line geometry (D6): display=export relies on measure-impl parity + FIT_EPS discipline; consider modeling legacy-style `lines[].y` for DP footnotes.
- `renumberPageScopedMarkers` silent full-skip on custom collision (`notes/markers.js:126-131`) — decide whether to report to ledger instead of only eventLog.
