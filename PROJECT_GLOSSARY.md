# מילון מושגים, רכיבים, החלטות והיסטוריית הפרויקט — Tora Book Typesetter RED

> **מילון חי ומפלצתי, גרסה ראשונית 19.11.2026.** נבנה כמפת ידע למנהל הפרויקט, למפתח ולסוכן AI. המונחים מתארים הן את הארכיטקטורה הנוכחית והן מושגים היסטוריים. כל הפניה לקוד/תיעוד היא נקודת התחלה; יש לאמת commit ונתיב runtime. החלטות משתמש ב-`DECISIONS.md` ותוכנית הביצוע ב-`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` גוברות על ניסוחים במילון, ב-Worklog, בתוכנית ישנה או בשיחת AI.

## 0. איך משתמשים במילון ובמקורות

### מדרג סמכות
1. **הוראות/הכרעות משתמש מפורשות** — מקור הכוונה; מרוכזות ב-`DECISIONS.md` ובשיחות המקור.
2. **תוכנית ביצוע פעילה** — `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`; קובעת סדר, שערים וגבולות.
3. **קוד פעיל ומסלול ריצה מוכח** — `red-build/src`, `red-build/ui`, בדיקות המוכיחות שהמסלול הזה מופעל.
4. **Worklog ומסמכי audit** — תיעוד מה נעשה והראיות; התאריך/commit חשובים.
5. **מסמכי spec היסטוריים, handoff, AI** — מקורות דרישות, הקשר והצעות; אינם סמכות לבדם.
6. **Artifacts (PDF/JSON/report) וענפים/PR** — ראיות למקרה מסוים, לא הבטחה שהקוד חי.

### מפת מקורות מרכזית
- [README — מפת כל הקבצים](README.md): אינדקס של כל קובץ לא-גופן במאגר.
- [תוכנית הביצוע הפעילה](spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md)
- [מפת סמכות המסמכים](spec/README.md)
- [DECISIONS](DECISIONS.md): הכרעות משתמש D-series.
- [WORKLOG](WORKLOG.md): יומן ביצוע, תוצאות, commits ו-test evidence.
- [ISSUE_REGISTRY](ISSUE_REGISTRY.md): בעיות/ממצאים ומחזור חייהם.
- [OPEN_QUESTIONS](OPEN_QUESTIONS.md): שאלות פתוחות/הכרעות נדרשות.
- [AGENTS_TRACKING](AGENTS_TRACKING.md): מעקב סוכנים/משימות.
- [SESSION_HANDOFF](ai-chat/SESSION_HANDOFF.md): handoff היסטורי; נכון לתאריך 12.11 ולכן יש לאמת מול מצב המאגר.
- [ChatGPT archive](ai-chat/ChatGPT.md): ארכיון השיחות הארוך; פרומפטים, ביקורות, החלטות והוראות ביצוע.
- [AI requests summary](spec/סיכום בקשות מAI.md): סיכום בקשות/היסטוריה, הצלבה מול החלטות.
- [Engine transition inventory](audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md): initial inventory of capabilities, page/text IDs, geometry, defaults, parity/cutover gates and unresolved research.
- [SRS](spec/Software_Requirements_Specification.md), [Master Spec](spec/01_MASTER_SPECIFICATION.md), [Unified item contract](spec/03_UNIFIED_ITEM_CONTRACT.md).

---

## 1. ארכיטקטורת מוצר ו-runtime

### RED / Red Build
שם סביבת התוכנה/הבנייה הנוכחית. קוד היישום נמצא ב-`red-build/`. השם RED אינו מעיד שהמנוע המאוחד כבר הוכנס לשימוש: יש לבדוק את נתיב ההפעלה.

### Browser app / UI
ממשק עורך, הגדרות, בדיקה, preview ופעולות export. קבצי מקור `red-build/src/ui/`; קבצים בנויים/מוגשים `red-build/ui/`. **Bundle אינו מקור עריכה**: יש לבנות/לעדכן אותו מהמקור לפי הכלים.

### Worker / Web Worker
רקע חישובי שמקבל בקשת עימוד ומחזיר תוצאה/התקדמות. מקור: `ui/engine-worker-main.js`, `ui/worker-client.js`, `ui/worker-protocol.js`, `ui/worker-main` (bundle ב-`red-build/ui/engine-worker.bundle.js`). Worker חשוב לבידוד/תגובה UI, אך לא יוצר בעצמו מנוע עימוד אחיד.

### Typeset / re-typeset
הרצת מנוע העימוד על טקסט+הגדרות. `retypeset-policy.js` מגדיר מתי שינוי דורש עימוד מחדש. יש להבחין בין שינוי UI/dirty state לבין בקשה מפורשת להפעיל engine.

### Pipeline
סדר שלבי עיבוד. בקוד המודרני `core/pipeline.js` הוא orchestration; עליו להבטיח שלב יחיד, מקור אמת יחיד, checkpoints, ושום שלב צדדי אינו מתקן תוצאה בדיעבד. המיפוי הנוכחי מפורט ב-`audits/ENGINE_RUNTIME_PATHS.md` (מסמך commit-specific).

### Legacy / מנוע מורשת
מימוש typesetting ההיסטורי: `layout/legacy-imud-flow.js`. מאות/אלפי שורות של tokenization, line breaking, flow, note reservation, page opening, headers/TOC/gates ועוד. Legacy משמש baseline יציב במעבר; אינו פוטר מאיתור ותיקון בחירות היסטוריות לא נכונות. נדרש הסבר לכל כלל/קבוע/branch דרך commit/worklog/test/user decision.

### Unified engine / מנוע מאוחד
היעד: Document Model → parsing/inline items → style/asset/font/measure → line model → planner/layout → constraints/notes/furniture → PageModel → pure projections. אין לשכפל מנגנונים או לשנות layout ב-renderer. מעבר הדרגתי נדרש, לא cutover על בסיס הצהרה/בדיקה חלקית. מסמכים: `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md`, `audits/ENGINE_CONTRACT_9C3.md`, `audits/ENGINE_DUPLICATION_REGISTER.md`.

### Runtime path / נתיב ריצה
הקוד שהמוצר באמת מפעיל. נתיב נקבע על ידי boot/import/settings/profile/worker/dispatch; יש להוכיחו בבדיקות/trace. בדיקת פונקציה מבודדת או קוד שאינו נקרא אינה הוכחת מוצר. מקור מיפוי: `audits/ENGINE_RUNTIME_PATHS.md`.

### Dispatch / engine selector
בחירת engine/path על בסיס profile/settings/flags. כל test parity חייב להדפיס/לאמת איזה מנוע רץ; כשל 9C.4/9C.5 כלל CI שבדק legacy במקום live unified. ראה `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md`.

### Cutover
העברת runtime מהישן לחדש. אסור לבצע בלי gates: path identity; content identity; geometry; typography; projections; determinism; performance; negative tests; integration UI→worker→preview/export. `CUTOVER.md`, `audits/STAGE9_CUTOVER_MAP.md`, תוכנית 9D.

### Shadow compare / shadow mode
הרצת שני מנועים על אותו input/settings/font/corpus והשוואת תוצאות, בלי להפוך את shadow engine ל-live. הכלי `tools/stage9/shadow-compare.js`, `tools/layout-parity/run-ours.js`, דוחות `audits/STAGE9_SHADOW_*`. Shadow test צריך להבטיח engine identity, metrics, inputs, tolerances והוכחה negative-control.

### A/B parity
השוואה בין legacy/unified או projection paths. parity היא הוכחה בתחום מוגדר, לא ״נראה דומה״ ולא השוואה ל-PDF reference שבוטל כיעד. `tools/layout-parity/` הוא בעיקר tooling היסטורי; `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md` הוא מסלול הוכחה הנוכחי.

---

## 2. מודל המסמך, parser, tokens ו-identities

### Canonical Document Model (CDM)
ייצוג סמנטי של המסמך (nodes, metadata, headings, paragraphs, inline content, notes, images/styles וכו'). הוא מפריד בין syntax של הטקסט לבין מבנה התוכן. קוד: `engine/model/document-model.js`, `adapter.js`, `kinds.js`, `registry.js`, `identity.js`, `source-range.js`, `validate.js`, `roundtrip.js`; חוזה: `CANONICAL_DOCUMENT_MODEL.md`, `spec/03_UNIFIED_ITEM_CONTRACT.md`.

### Inline Item / Item contract
יחידת תוכן בתוך flow: text, marker, note, image, style run, heading token, ornament/item וכו'. כל item צריך kind/identity, source range, semantics, measurement, layout constraints ו-projection behavior. ה-contract מתועד ב-`spec/03_UNIFIED_ITEM_CONTRACT.md`; תכנון מודל: `engine/model`, `parser/inline-content.js`, `layout/page-items.js`.

### Block / Paragraph / Section
יחידות מבניות: block/paragraph/section, boundaries, flow, heading hierarchy. parser וה-model מגדירים את היחס; layout לא צריך לגלות מבנה מחדש מ-rendered DOM.

### Metadata
שדות ספר/מחבר/נושא/מהדורה/מקום/שנה וכו'. נדרש identity/roundtrip, gating/TOC/headers, ולא text-matching חופשי בכל מקרין. בדוק parser, `decoration/shaar-pages.js`, `output/shaar-content.js`, settings identifiers audit.

### Text identifier / מזהה טקסט
Syntax/prefix markers שהמשתמש מקליד כדי ליצור metadata, headings, note classes, styles וכו'. מזהים אינם decoration בלבד: parser צריך להמירם למבנה סמנטי ולשמור source identity. רשימה מלאה: `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md` §6 + parser tests.

### H0–H7
סוגי כותרות/תוכן:
- **H0**: פתיחה/הקדמה; title + intro/body, עמוד/אזור חד-טורי/dropword.
- **H1**: חלק/שער משנה; main hierarchy/title gate; header source/TOC.
- **H2**: פתיחת סימן/פרק; page-opening furniture, title/number/ornaments.
- **H3**: כותרת spanning across columns; contract CSS geometry; no forced page break, spacing must not duplicate.
- **H4/H5/H6**: headings בתוך flow; line/widow/escort constraints.
- **H7**: side-note/commentary/quote-like semantic heading, number/source and anchor timing.
Legacy modes are inventory, not desired implementation: see `legacy-imud-flow.js`, `h3-contract.js`, `headings-escort.js`, `side-notes.js`, D-107 and audits.

### Source Range
קישור מדויק למיקום טקסט המקור; מאפשר identity, edits, diagnostics, round-trip. `model/source-range.js`.

### Identity / identity-by-construction
מזהה יציב של item/page/note/asset. D-30: content accounting uses shared computed representation; marker counted once at body anchor, note text once at actual placement. Avoid reconstructing identity independently in renderer/export. See DECISIONS D-30, `model/identity.js`, `layout/structural-stamps.js`, tests.

### Round-trip
ייבוא/parse→model→serialize/export preserving structure, IDs, content and user-editable semantics. `model/roundtrip.js`, import modules, tests.

### Lexer / DFA / tokenizer / scanner
Lexing and text segmentation: `parser/dfa-lexer.js`, `block-tokenizer.js`, `bracket-scanner.js`, `inline-content.js`. Lexing should recognize markers/Unicode/syntax deterministically and not apply layout decisions. Scanner and parser roles must not be duplicated in engine/renderers.

### Unicode cluster / combining marks
Hebrew vowels, cantillation, punctuation, ligatures and joiners can form grapheme sequences; line break must not split protected clusters. Source parser/line items/protectors; tests `typography.test.js`, `s4-line-items.test.js`.

### PUA / Private Use Area sentinels
Internal transport markers E000/E101/E102/E103/E104 (verify mapping in `core/pua-text.js`). Not user syntax; scrub/transport/materialization must be consistent. PUA must not leak into PDF/export/accessibility/source text.

### Editorial text
Syntax such as `##…##` representing nonprinting editorial instructions/comments (exact behavior per parser/settings). Preserve roundtrip/identity; do not silently treat as visible body. Parser tests and identifier audit.

### Dibur Hamatchil (DH)
Textual opening phrase style/semantic marker; automatic recognition patterns (period/dash variants) and custom behavior. Legacy detection may have been regex-based; unified parser/style prepass should produce explicit style item/range. Audit settings, parser and tests before changing.

### Parentheses / bracket note / paren scope
Parentheses-related sizing/formatting, bracketed commentary, note delimiters. Scope prepass (CP1) must occur before measurement because it affects effective font sizes/metrics; style scope should be represented, not independently reimplemented in measure and projector. Relevant: `pipeline.js`, `bracket-scanner.js`, `font-keys.js`, `geometry-projector.js`, `legacy-projector.js`, D-92 and D-107.

### Text transport / inline transport
Serialization of text/items to worker, PUA/control encoding, and restoration. `ui/inline-transport.js`, `ui/page-model-transport.js`, `core/pua-text.js`; integrity tests.

### Settings registry / Settings Registry
Single settings contract: key, type, default, bounds/enum, label, panel, consumer, validation. `engine/core/settings-registry.js`; UI bindings generated in `ui/bindings.generated.js`; settings panels/persistence in `ui/settings-panel.js`, `settings-persistence.js`.

### Legacy settings map / dispositions
Mapping raw IMUD keys into RED settings, merging/removed/UI-only/family rules. `engine/core/legacy-settings-map.js`. Must cover every source key; mapping completeness alone does not prove value is effective or consumer is live.

### Pseudo-settings / hard-coded controls
Constants/behaviors not exposed as registry controls but function as settings (thresholds, fit limits, hard-coded typography/layout). Audit reports 34 pseudo-settings. They need classification, user decision or explicit fixed contract and effect test. See settings audit + duplication register.

### Defaults / D-107
Canonical approved defaults for body font/size/line-height, parens, dropword, headings H0–H7, TOC, AQ, headers, grid, folio, theme 40/gate designs, image defaults and inline fonts. Current source JSON/registry can conflict; audit boot import/merge and test actual effective values. Sources: D-107, `default_settings.json`, settings registry/map, `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`, `audits/S9B_TOC_D107.md`.

---

## 3. Typography and measurement

### Font family vs font face
Family is logical user selection; face is actual loaded font resource/variant/weight/style. Resolver must produce one deterministic face (or explicit fallback chain) for measuring and rendering; silently falling back after measuring creates parity drift. Files: `typography/font-keys.js`, `font-resolver.js`, `font-metrics.js`, `output/line-font.js`, font asset manifests.

### FontResolver
Maps settings/run family to actual resource, face identity, load state and fallback. Same face must be used by line measurement, projection and PDF embedding. See `typography/font-resolver.js`, `assets/asset-resolver.js`, font priority catalogs.

### Font Metrics
Ascent, descent, glyph advance/kerning, line-height, face-specific metrics. `font-metrics.js`, `measure-model.js`, `measure-api.js`. Keep one measurement authority.

### Font key
Canonical identity/lookup key for family/face; avoids mismatched settings/transport/projection. `typography/font-keys.js`; PUA scrub/font sync tests.

### Fallback font
Fallback when selected face unavailable; must be explicit, stable, surfaced as status/diagnostic. Do not measure one font and render another without compensation/proof.

### Font subset / embedding
Subset glyphs to reduce PDF size while preserving used glyphs/face/embedding rights; `font-subset.js`, `output/pdf-writer.js`, manifests, `s12-font-subset` artifact and tests. Font resources excluded from README inventory by request.

### AssetResolver / asset identity
Single resolver for image/font/theme/ornament resources (filesystem/ZIP/internal IDs). `assets/asset-resolver.js`; `hash256.js` content identity; `image-meta.js` metadata/orientation/aspect. Asset identity must not depend on incidental path alone if content changes.

### Measure / Measurement model
Width/height/baseline/metrics of content under font/settings, image metadata, styles. `engine/measure/measure-model.js`, `typography/measure-api.js`, `measure-table.js`. Measurement should be deterministic, pure or explicit-cache, and consistent across all consumers.

### Measure API / CP2
Canonical measurement interface; pipeline checkpoint CP2 after fonts/assets readiness and before line planning. No duplicate font-factor tables or remeasure in projection. `core/pipeline.js`, `typography/measure-api.js`, stage3 audits.

### Measurement purity
Measurement does not mutate document/settings or depend on layout history; caches keyed by immutable inputs and collisions prevented. Tests `s5b-measurement-purity.test.js`, unit measurement/cache.

### Width factors / heuristic table
Legacy or approximation font-family multipliers; historical duplicate/conflicting tables documented in `ENGINE_DUPLICATION_REGISTER.md`. Use as fallback only if justified; one SSOT, actual-font measurement preferred.

### Font size / pt / px / em
Unit conversion: point (pt) ↔ CSS px (96/72), em relative to current run. `typography/units.js`; check scale, line height, parens, dropword, PDF mapping.

### Line height / pitch / baseline
Vertical distance between text baselines vs glyph box height; not interchangeable. Header baseline, flow top, line pitch, glyph ascent and line box must be explicit. Geometry contract and projector tests.

### Dropword / first-word drop cap
Large opening word integrated into body flow. Parameters include word count, size (em), min lines and collision/line constraints. `typography/dropword.js`; settings tests and D-107. Avoid renderer-only pseudo layout.

### KP line breaking
Knuth–Plass-like optimal line breaking with penalties/badness/fitness; module `typography/kp-linebreak.js`. Understand algorithm and constraints; not equivalent to greedy line wrapping. Line output should be immutable model.

### Protectors
Prevent undesirable break points around semantic clusters, headings, punctuation, notes, brackets or protected words. `typography/protectors.js`, `line/breaks.js`; must be declarative and testable.

### Fit / FIT_EPS
Tolerance for measurement/fit calculations; legacy `FIT_EPS` is a tolerance, not permission to hide overflow. See legacy line breaker, migration audit and geometry tests. Fixed thresholds need explicit rationale and sensitivity tests.

### Justification / justify
Distribute remaining width among interword gaps; `(columnWidth - sum(wordWidths))/gapCount`. Multiple historical implementations identified; unified model should decide once and projection only render. `geometry-projector.js`, `legacy-projector.js`, CSS, audit duplication D3.

### Gap compression / stretch
Adjust word gaps or line pitch within bounded limits to fit columns/pages. Separate compress/stretches with limits, eligibility, diagnostics; avoid arbitrary post-layout patch. `layout/balancing.js`, `retreat-loop.js`, legacy constants and tests.

### Balance / AQ / bottom-align
Column/page balancing optimization. AQ automatic alignment is separate from bottom alignment; D-107 turns auto AQ off. `layout/balancing.js`, `dp-planner.js`, setting effects and D-107.

### Full-math / mathematical invariants
Audit all page/column/line geometry: overflow, overlaps, content identity, ordering, footnote/margin lanes, determinism, totals. `tools/layout-audit/full-math-audit.js`, `run-full-math.js`, workflows. Fixed acceptance thresholds must not be loosened to mask regression; negative controls prove sensitivity.

---

## 4. Layout, constraints, pages and notes

### Planner / DP planner
Page/column plan optimization under capacities and structural/typographic constraints. `layout/dp-planner.js`, `candidate-generator.js`, `constraint-matrix.js`, `plan-model.js`. Planner selects among candidates; renderer does not re-plan.

### Candidate
A possible placement/split/break decision with score, constraints and trace. `candidate-generator.js`, DP planner.

### Constraint matrix
Declarative protections/requirements by content type and context. `layout/constraint-matrix.js`, `protections-matrix.js`. Avoid duplicated hidden rules scattered in flow/render.

### Retreat loop
Reconsider/retreat from a placement when capacity or downstream constraint fails. `layout/retreat-loop.js`; must be finite, deterministic, traced and root-cause based.

### ColumnFlow / ordering
Canonical flow across columns/pages, RTL order, side-note placement and endnote order. `column-flow.js`, `ordering.js`, `page-items.js`.

### Page template / PageType
Template geometry/furniture for regular, preface, shaar, H2 opening, TOC, custom, filler, endnote contexts. `layout/page-templates.js`, `furniture-geometry.js`, `decoration/shaar-pages.js`. Every type needs explicit boundaries/coordinates and test.

### PageModel
Final, immutable, canonical representation of all pages, items, lines, positions, metrics, decorations, notes and page furniture. `core/page-model.js`; stage 7 tests. Source of truth for DOM/HTML/PDF; no second layout.

### Materialization
One-time conversion of planned model into explicit geometry/positions (CP5). `core/materialize.js`. Projection cannot measure/decide placement again. Check contract and stage8 tests.

### Geometry / Geometry projector
Coordinates, bounding boxes, margins, columns, lanes, page dimensions and transforms. `output/geometry-projector.js`, `core/imud-geometry.js`, `layout/furniture-geometry.js`. All outputs share explicit geometry; validate A4, binding, RTL, recto/verso, overflow.

### Page/column margins and gutter
Body columns, outer margins, inner binding/gutter, margin note lanes; these must be separate geometry elements, not inferred from CSS grid gaps. Geometry contract `imud-geometry.js`, tests `s9d-segment1-geometry.test.js`.

### Recto / verso / binding offset
Right/left facing page semantics and binding offset; shift all affected body and furniture coordinates consistently, preserve margins and gutter, not just one column. Segment 9D.1 test currently needs more complete proof.

### H2 opening / SIGN_OPEN
Opening section/siman/heading page/region; spacer, title, ornaments, number, header/folio suppression rules. `page-templates.js`, `legacy-imud-flow.js`, decoration/ornament contracts.

### H3 spanning band
Full-width H3 title across columns. Shared geometry/CSS contract in `core/h3-contract.js`; test wrapping, line height, top/bottom gap exactly once, avoid page break forced historically. D-S2H3 and audit `H3_SPACING_OLD_STYLE_PARITY`.

### H4–H6 inline headings
Headings embedded within flow. Need guards/escort/widow-orphan constraints and consistent spacing; avoid renderer-only effects. `headings-escort.js`, protectors and tests.

### H7 / side note
Semantic heading/commentary placement in margin. Preserve number, source quotation and content, anchor timing. `layout/side-notes.js`, `notes-model.js`, parser and S9B grammar audit/test.

### Footnote / הערת שוליים
Note marker/anchor in body, note content in footnote area/margin/endnote according to settings/policy. Note marker and content identity separate but accounted exactly once. `notes-model.js`, `footnote-budget.js`, `footnote-lanes.js`, `markers.js`, legacy note flow.

### Footnote budget
Capacity calculation for notes vs available area. Must match actual placement/splitting and projection (budget=placement=render). `layout/footnote-budget.js`; stage6/7/8 and regressions.

### Footnote lanes / note gutter
Placement lane(s), width, note marker, anchor/continuation and overflow. `footnote-lanes.js`, `notes-model.js`, projector.

### Body-first / note-first
Policies about laying body text before reserving notes vs reserving notes upfront; affects page content/flow. D-91/D-107? Verify decisions and worklog. S75 changed body-first as default in legacy; migration must preserve explicit approved semantics, not implement a separate note engine.

### Long-footnote policy / block / continuous
Policy when note exceeds page/lane capacity; block mode enforces cap and split/move; continuous has no cap. D-34 and settings; `footnote-budget.js`, `endnote-pages.js`.

### Endnotes / Endnote pages
Notes collected on dedicated pages. `layout/endnote-pages.js`, `decoration/toc-builder.js` as applicable. Need title/marker identity, page template, capacity, splitting, order and export consistency.

### Notes glue / anchor glue
Keep note marker and related note units together or at intended anchor. Root fixes in S9B notes glue/anchor reports and tests; inspect `audits/S9B_NOTES_GLUE_2026-11-18.md`, `layout/notes-model.js`, `footnote-lanes.js`.

### Orphan / widow / escort
Heading/line protection so headings do not strand and content lines have minimum viable continuation. `headings-escort.js`, `protections-matrix.js`, tests; verify each constraint is actually active in planner.

### Retreat / reclaim
Move content back/reclaim whitespace based on legal constraints. Historical thresholds are not sacred; audit behavior, root causes, deterministic bound and trace.

### Structural stamps
Page/section labels, header/folio suppression, gate/opening states. `layout/structural-stamps.js`; ensure stamps derive from structure, not output text.

### Filler / blank page
Explicit blank/filler template, deterministic insertion and no phantom pages; `page-templates.js`, audit invariants.

### Custom page / custom item
Extensible registered page/item schema; custom content must enter unified measure/layout/projection, not private layout engine. `decoration/custom-pages.js`, `model/registry.js`, extensions.

---

## 5. Output projections, export and decoration

### Projection / renderer
Pure output adapter from PageModel to DOM/HTML/PDF. Must not measure, re-typeset, change breaks, fix geometry or invent missing content. Sources: `output/dom-renderer.js`, `pagemodel-dom-renderer.js`, `geometry-projector.js`, `html-export.js`, `pdf-writer.js`.

### DOM preview
Browser page display from PageModel. `output/pagemodel-dom-renderer.js`, `ui/preview-tab.js`. Should match page model coordinates and typography.

### HTML export
HTML serialization of same PageModel; no second layout. `output/html-export.js`, `output/export-api.js`; tests `s9c-html-export.test.js`, `s8e-pagemodel-html.test.js`.

### PDF writer
PDF output consumes same model; embeds/selects fonts and maps coordinates. `output/pdf-writer.js`, `line-font.js`, `font-subset.js`; tests `s9c-pdf-export.test.js`, `s8f-pagemodel-pdf.test.js`, PDF artifacts. Validate glyphs, font face, baseline, size, colors and no reflow.

### Export API / Project IO
Public export interface and save/open project serialization; `output/export-api.js`, `project-io.js`, `zip-writer.js`. Must preserve content, assets/settings and IDs.

### Preview vs PDF acceptance
Every visual/engine change must be checked in both preview and PDF (user requirement carried from S77/handoff). Export parity includes geometry, line breaks, font face, markers, notes, ornaments, headers/folios, metadata and page counts.

### Header / running head
Top page text slots R/C/L and recto/verso sources, align, width, font, size, color, baseline and divider. `decoration/headers-builder.js`, `structural-stamps.js`, settings and legacy header logic. Header baseline not same as header box height.

### Folio
Page number format/sequence/starting page, placement, frame and font. `decoration/folio.js`, `legacy-imud-flow.js`, settings, D-107 and D-108. **Printed folios and TOC page labels use bare Hebrew gematria without geresh/gershayim** (א, ב, טו, טז); do not apply the D-31 punctuation rule to page folios. Test exact strings and reject U+05F3/U+05F4.

### TOC / contents
General/detailed TOC, levels, entries, numbering, folios, grouping, wrap, page break/atomic group, hyperlinks. `decoration/toc-builder.js`, `S9B_TOC_D107.md`, tests.

### Gate / Shaar
Main gate, back gate, sub-gate pages; metadata, conditional fields, themes, font, ornaments, divider/background. `decoration/shaar-pages.js`, `shaar-boxes.js`, `output/shaar-content.js`, assets catalogs.

### Ornaments / decoration assets
SVG/ornamental design elements; registry/catalog, fit/ink/plan, sanitized SVG. `decoration/asset-registry.js`, `ornament-plan.js`, `ornament-fit.js`, `ornament-ink.js`, `svg-sanitize.js`, `legacy-ornaments.js`.

### Divider / separator
Column/header/section/heading/gate divider. `decoration/dividers.js`; contracts and settings.

### Theme / theme set
Preset coordinated furniture/background/gate/ornament design. `decoration/theme-sets.js`, asset catalogs, settings set json; default theme decisions D-107.

### Background
Color/image/mode/opacity/insets for page/template. Must be explicit and not depend on hidden CSS state.

### Image inline / wrap
Inline/floating image marker `#path#`, alignment/size suffix, aspect ratio, wrap shape/geometry. Asset metadata and layout item; renderer does not compute wrap. D-107 and parser/asset tests.

### SVG sanitization
Security and deterministic rendering of ornaments. `decoration/svg-sanitize.js`; tests/security audit.

---

## 6. Settings UI, custom styles, import and persistence

### Settings panel
UI grouping, labels, control type, default/current value, ranges, dependencies. `ui/settings-panel.js`, `bindings.generated.js`, registry. Test effect, not just control presence.

### Generated bindings
Generated mapping of panels/setting keys/labels/types. `ui/bindings.generated.js`; generator `tools/gen-ui-bindings.js`. Avoid manual drift; run generator and audit all controls.

### Settings persistence
Save/load user settings, version migration, source defaults and user overrides. `ui/settings-persistence.js`, source JSON and registry. Validate effective settings at boot.

### Setting effect / phantom control / dead control
A UI control can exist yet no runtime consumer reads it. Audit `src/audit/scanners.js`, `tools/scan-control-triggers.js`, settings audit; each control requires effect test through preview and PDF.

### Setting set / preset
Bundled style/settings set (e.g. تفسير, קונטרס, תלמוד). `ui/assets/imud/setting_sets/*.json`; presets are configurations, not engines.

### Extension / custom styles
User-defined styles with trigger syntax, schema, serialization and application. `engine/extensions/style-schema.js`, `extensions-io.js`, `apply-styles.js`, UI panel and trigger scanner. Must reuse same item/layout/projection model.

### DOCX import
Word document parsing; `engine/import/docx-import.js`, `xml-lite.js`, `zip-reader.js`. Preserve source semantics, content and metadata; unsupported content warnings should be explicit.

### ZIP reader/writer
Project/package/assets container. `import/zip-reader.js`, `output/zip-writer.js`; validate paths/security/asset identity.

---

## 7. Audit, tests, evidence and tooling

### Unit / integration / layout / e2e
- Unit: isolated model/parser/measurement/typography.
- Integration: contracts across modules, settings/import/source variants.
- Layout: line engine/planner/candidate/constraints/balance.
- E2E: worker→pipeline→render/export/UI path.
- Audit: geometry/full math/sensitivity/negative controls/security/accessibility.
Folders: `red-build/tests/unit`, `integration`, `layout`, `e2e`, `audit`, `regress`.

### Test harness / fixture / corpus
`tests/harness.js`; fixtures under `tests/fixtures`; canonical and real corpora. A valid test document must have realistic structure (no consecutive same-level headings without body, no heading with only a note). `very_long_test_text.txt` is the canonical real-book correctness corpus (per D-98); random generator is stress testing only.

### Negative control / sensitivity
A deliberate defect/fixture that should fail. Proves audit gates are not blind. `tests/audit/negative-controls.test.js`, `e2e/audit-sensitivity.test.js`, workflow gates.

### Determinism
Same inputs/settings/assets/font/runtime produce same result hashes and layout. `tools/layout-audit/determinism-sweep.js`, pipeline tests, artifacts. Check output model and PDF exports.

### Full-math audit
Page/column/line geometry and invariants, no overlap/overflow, identity/order, notes and geometry. Tools `tools/layout-audit/full-math-audit.js`, `run-full-math.js`; workflow.

### Corpus invariants
Content accounting across parse→layout→export, no loss/duplication; CI `verify-corpus`/workflow. Do not confuse identity accounting with visual parity.

### Layout audit
Browser-based geometric audit (real rendered app), measurements for overlap/overflow, headers, margins, note lanes, etc. Tools `layout-audit/audit-in-page.js`, `run.sh`, workflow.

### Performance baseline
Same environment, same corpus/settings/assets, repeated runs, median/P90/P95, memory, first-page latency, complete typeset, preview/export. `audits/PERFORMANCE_BASELINE.md`, `tools/perf-baseline.js`, `perf-slice6.js`. Compare legacy/unified apples-to-apples, ensure engine path is confirmed.

### Artifact
Captured PDF/JSON/report; proof for one test run, not current runtime. `tests/artifacts`, `audits/baseline_*`, stage audit artifacts. Always inspect provenance and commit.

### CI / GitHub Actions
`.github/workflows` automated gates. Verify branch, trigger, engine dispatch, bundle build, actual corpus and fail thresholds; green status alone is insufficient if workflow tests wrong path.

### Build bundle
`tools/build-worker-bundle.js`, UI bundles. Build artifacts must correspond to source and deployed app. Check build reproducibility/provenance.

### Callgraph / dependency map
`ui/callgraph-scan.js`, `LAYOUT_DEPENDENCY_MAP.md`; find callers, consumers and hidden dependencies before refactor.

### Trace / EventLog / decision trace
Instrument execution with stage/label/payload/page and decision trace. `core/events.js`, `layout/decision-trace.js`. Observability must be no-op for layout output; proof/test required.

### Ledger / Issue lifecycle
`core/ledger.js`, `ISSUE_REGISTRY.md`: decision/finding lifecycle, statuses, closure evidence; unresolved root causes not closed by cosmetic patch.

### Audit scanner / anti-patch
`src/audit/scanners.js`: dead controls, phantom keys, orphan mechanisms/patches. Goal prevent workaround accumulation.

### Editing recommendation / dry-run
Engine recommends a user text edit (e.g. word move) with proof; apply only after dry-run verifies no identity/content loss. `engine/audit/editing-recommendations.js`, `text-edits.js`, UI.

### Accessibility
UI and export semantics/keyboard/contrast. `ACCESSIBILITY.md`, `tests/audit/s13-security-a11y.test.js`.

### Security
SVG sanitization, DOCX/ZIP input safety, asset path constraints, export handling. `SECURITY.md`, import modules and security tests.

---

## 8. Stage and migration vocabulary (historic stages; current plan controls)

### Stage 1 — audit current state
Current paths, duplicate mechanisms, settings/text identifiers, baseline and dependency map. Reports: `ENGINE_CURRENT_STATE.md`, `ENGINE_RUNTIME_PATHS.md`, `ENGINE_DUPLICATION_REGISTER.md`, `SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`.

### Stage 2 — Canonical Model
Document/item types, identity, validation, source range, round-trip. `engine/model`, `STAGE2_MODEL_COVERAGE.md`.

### Stage 3 — Assets, style and measurement
Asset resolver, font identity/metrics, style scopes, measurement contract. `engine/assets`, `engine/measure`, `engine/typography`, `STAGE3_MEASUREMENT.md`.

### Stage 4 — Single line engine
Line items, break opportunities/protectors, KP linebreak, line model, bridge. `engine/line`, `STAGE4_LINE_ENGINE.md`.

### Stage 5 — Unified planner
Candidates, constraints, DP, plan model, flow/balance/retreat. `engine/layout`, `STAGE5_UNIFIED_PLANNER.md`.

### Stage 6 — Page items and notes
Page furniture/items, notes, images, endnotes, decorations. `STAGE6_PAGE_ITEMS.md`.

### Stage 7 — PageModel
Final model, immutable geometry/identity/contract, hash/invariants. `STAGE7_PAGE_MODEL.md`.

### Stage 8 — Output projections
Materialization, DOM/HTML/PDF from same PageModel. `STAGE8_RENDER_PROJECTIONS.md`, S8 slice reports.

### Stage 9 — Cutover
Shadow, compare, migration/cutover map; historically flawed gates and regressions documented. `STAGE9_CUTOVER_MAP.md`, `STAGE9_SHADOW_*.md`, `UNIFIED_ENGINE_MIGRATION_PLAN.md`. The current active plan may restructure stages—follow canonical plan.

### 9B slices
Shadow methodology corrections and root fixes for H7 grammar/anchors, notes glue, gate-back, TOC D-107; reports `audits/S9B_*`. Check exact commit and corpus status.

### 9C stability
Legacy baseline stable; 9C.4/9C.5 attempted migration and exposed regressions/CI blind path; 9C.3 is the transition baseline currently specified. See `ENGINE_CONTRACT_9C3.md`, migration plan.

### 9D migration segments
Incremental transfer; segment 1 geometry shared constants. Do not assume this means all feature parity. PR #64; tests `s9d-segment1-geometry.test.js`.

### PR / Branch
Pull request is proposed change, not merged runtime. Check base, status, reviews, diff, CI, commit. PR #17 is historically marked DO NOT MERGE yet; #64 contains geometry segment; verify live state.

---

## 9. File-by-file concept index for source modules

### Core
- `core/pipeline.js`: orchestration, checkpoints CP1–CP5, dispatch, engine flow.
- `core/page-model.js`: final PageModel contract/immutability.
- `core/materialize.js`: one-time explicit geometry.
- `core/imud-geometry.js`: shared IMUD geometry contract, migration 9D segment 1.
- `core/h3-contract.js`: H3 band geometry contract.
- `core/settings-registry.js`: setting schema/default/labels/validation.
- `core/legacy-settings-map.js`: import/migration of old settings.
- `core/pua-text.js`: PUA internal markers and canonical scrub.
- `core/events.js`: event/trace collector.
- `core/ledger.js`: decision/issue lifecycle ledger.

### Parser/model/typography/measure
- `parser/dfa-lexer.js`, `block-tokenizer.js`, `inline-content.js`, `bracket-scanner.js`: lexical, block, inline, bracket parsing.
- `model/document-model.js`, `adapter.js`, `kinds.js`, `registry.js`, `identity.js`, `source-range.js`, `validate.js`, `roundtrip.js`: canonical model and contracts.
- `typography/font-keys.js`, `font-resolver.js`, `font-metrics.js`, `font-subset.js`, `units.js`, `measure-api.js`, `measure-table.js`, `kp-linebreak.js`, `protectors.js`, `dropword.js`: fonts/measurement/breaking/typographic rules.
- `measure/measure-model.js`: model of measured geometry.
- `assets/asset-resolver.js`, `hash256.js`, `image-meta.js`: resource lookup/content hash/image metadata.

### Layout
- `layout/column-flow.js`, `ordering.js`: flow and ordering.
- `candidate-generator.js`, `dp-planner.js`, `constraint-matrix.js`, `plan-model.js`, `protections-matrix.js`: candidate planning/constraints.
- `balancing.js`, `retreat-loop.js`: balancing and legal retreat/reclaim.
- `page-items.js`, `page-templates.js`, `furniture-geometry.js`, `structural-stamps.js`: page model items/templates/furniture/structural state.
- `notes-model.js`, `footnote-budget.js`, `footnote-lanes.js`, `endnote-pages.js`, `side-notes.js`, `headings-escort.js`: notes/side notes/headings constraints.
- `decision-trace.js`: planner/decision tracing.
- `legacy-imud-flow.js`: historical integrated flow and reference implementation during migration; read commits/WORKLOG for provenance of each rule.

### Decoration/output/UI
- `decoration/headers-builder.js`, `folio.js`, `toc-builder.js`, `dividers.js`, `shaar-pages.js`, `shaar-boxes.js`, `theme-sets.js`, `custom-pages.js`, `asset-registry.js`, `ornament-plan.js`, `ornament-fit.js`, `ornament-ink.js`, `legacy-ornaments.js`, `assets-import.js`, `numbering-audit.js`, `page-decorations.js`, `svg-sanitize.js`: page furniture/design, catalogs and validation.
- `output/dom-renderer.js`, `pagemodel-dom-renderer.js`, `geometry-projector.js`, `legacy-projector.js`, `html-export.js`, `pdf-writer.js`, `line-font.js`, `export-api.js`, `project-io.js`, `zip-writer.js`, `shaar-content.js`: output/serialization; legacy projector is compatibility path, not desired duplicate.
- `ui/app-shell.js`, `browser-entry.js`, `editor-tab.js`, `settings-panel.js`, `settings-persistence.js`, `preview-tab.js`, `testing-tab.js`, `status-strip.js`, `extensions-panel.js`, `imud-library.js`, `worker-client.js`, `worker-protocol.js`, `engine-worker-main.js`, `inline-transport.js`, `page-model-transport.js`, `retypeset-policy.js`, `test-doc-generator.js`, `caret-map.js`, `callgraph-scan.js`, `bindings.generated.js`: browser UI and worker coordination.

---

## 10. AI conversation archive — navigation and use

### `ai-chat/ChatGPT.md`
Very large stitched conversation archive (~1.16 MB at tree snapshot, connector text ~776k chars). It contains project-plan review and rewrite, agent split instructions, user decisions/questions, architecture/engine investigations, implementation instructions and staged handoff discussions. Its top-level headings include:
- Plan review and program correction.
- Updated handoff/continuation instructions from old plan to current RED program.
- First state reports and forensic analysis of engine split.
- User decision questionnaire and AI implementation prompts for stages 1–8.
- Stage 2 model closeout, earlier-stage corrections and H3 issue.
- Stage 3 assets/styles/measurement; Stage 4 unified line engine and product-route integration.
- Stage 5 unified page planner; Stage 6 page items/notes; Stage 7 PageModel; Stage 8 pure projections/exports.
- Later audit/transition work, cutover review and user corrections.
**Use:** search headings/Prompt chronology and exact user wording; verify decisions in DECISIONS.md and completion evidence in WORKLOG/audits. Do not treat proposed AI prompts as completed tasks.

### `ai-chat/SESSION_HANDOFF.md`
Session memory last noted 12.11, S75–S77. Includes user rules, project summary, prior work and test/deploy procedures. It is an older legacy-oriented handoff; current migration has advanced beyond it. Use as historical context only after reading current plan and WORKLOG.

### Qwen exports (2 Nov 2026)
- `qwen-chat-export-de3453mf.txt` — conversation export about comparison across repositories (IMUD_TORANI, Yellow/Gold/Green variants) and previous work/program.
- `qwen-chat-export-ee3ef5.txt` — another near-duplicate conversation export; compare before treating as distinct.
- `qwen-chat-export-enf884mnf.txt` — near-duplicate export from same period.
- `qwen-chat-export-ow232w3we5.txt` — near-duplicate export from same period.
These exports are ~34–56 KB each; filenames and content indicate substantial overlap. Do not delete duplicates without checksum/diff and explicit archival decision.

### AI evidence discipline
- User's explicit request/decision is authoritative, not AI advice.
- AI-generated implementation prompt is not execution proof.
- AI report is not independent verification.
- Verify every reported code change at current branch/commit and live route.
- Preserve user corrections (especially “not patchwork,” engine simplification, correctness, stable/deterministic, no P6/P7 in current focus, reference PDF not final target).
- Search archive for user statement when resolving ambiguity; then record formal decision if necessary.

---

## 11. Current engine-transition glossary and red flags (19.11.2026)

**Companion inventory:** [ENGINE_TRANSITION_INVENTORY_2026-11-19.md](audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md) — initial component/default/parity inventory and open investigation checklist.

### Legacy 9C.3 baseline
The stable reference for transfer is specified as `main@4992e09` (9C.3). It is not the final design authority; user-approved defaults and explicit corrections override legacy behavior. Full contract: `audits/ENGINE_CONTRACT_9C3.md`.

### Segment 9D.1 / shared geometry
PR #64 introduced shared `core/imud-geometry.js` and adapted legacy and unified templates. It is a narrow geometry slice, not proof of unified layout. Review file tests, binding offsets both columns/margins, recto/verso and render output.

### PR #17 FX-1..FX-6
Historical forensic/root-fix PR; marked DO NOT MERGE (yet) in transition context. Revalidate roots and current code; do not merge/cherry-pick solely because findings were previously reported.

### Geometry calibrated from reference
Comments/values may cite old PDF reference. D-97/D-100: reference PDF not final target/parity acceptance. Independently validate geometry relationships and user-approved design.

### CI path blindness
9C.4/9C.5 CI tested legacy helper while app dispatch had unified path; avoid by asserting exact selected path in every comparison and test. See migration plan.

### Softened threshold
During fixing overlap regressions, a full-math acceptance threshold was softened and masked a header-position issue; restore fixed acceptance and prove audit sensitivity. Negative controls required.

### 26 overlap pages
Historical post-cutover regression; source migration plan. Treat as evidence why staged cutover gates matter.

### 54 pages / 695 pages speed baselines
Historical legacy timing claims; do not compare unless environment, settings, corpus, fonts, engine selection, repetitions and metric are matched. Performance baseline reports.

### Canonical corpus / very_long
Real, structurally valid corpus for correctness (D-98). Random/auto test docs stress only. Must not generate malformed headings/note-only headings as normal test inputs.

---

## 12. Change and review workflow vocabulary

### Root-cause fix
Fix the single owning contract/module; remove duplicate workaround only after proving replacement. Avoid symptom patches.

### SSOT (Single Source of Truth)
One authoritative definition for settings, font metrics, geometry, content identities, PageModel, line widths and projection coordinates. Multiple consumers should read one contract.

### Duplication register
Known duplicated logic/authority, risk and recommendations; `audits/ENGINE_DUPLICATION_REGISTER.md`. Use before changing subsystem; ensure duplication removed rather than adding another layer.

### Effect test
Proves control/setting affects the intended runtime output, including preview and PDF. Presence in registry/UI does not prove effectiveness.

### Regression / negative test
Regression protects known failure; negative control deliberately introduces defect and proves test/audit catches it.

### Acceptance gate
Mandatory criteria before stage/segment/merge/cutover. Exact engine path, content accounting, geometry, fonts, output parity, determinism, performance, negative controls, product integration.

### Reversible segment
Migration slice with clear boundaries, baseline, proofs and rollback; should not mix unrelated features.

### Provenance / source history
Commit, PR, user decision, worklog, source branch, test corpus. `PROVENANCE.md`; use git history/PRs to explain why each line/constant exists.

### Worklog entry
Evidence-based record: what changed, files, cause, tests, commit, open findings, next steps. `WORKLOG.md` chronology. Update only with factual results.

### Spec drift
When docs, settings, UI, consumers and tests diverge. Audits must compare actual keys/callers/outputs and reconcile authority.

### Patchwork / workaround
Local symptom correction that adds a second rule or special case rather than correcting owning model/contract. Anti-patch scanner and duplication register seek to prevent this.

### Simplification
Remove unnecessary independent mechanisms and repeated measurements/decisions; consolidate authority and reduce branching, while preserving valid capabilities and proven root fixes.

---

## 13. Documents and audits: quick descriptions

- `ENGINE_CURRENT_STATE.md`: current runtime and engine duplication snapshot at audited commit.
- `ENGINE_RUNTIME_PATHS.md`: app→worker→pipeline dispatch and live path map.
- `ENGINE_DUPLICATION_REGISTER.md`: duplicate calculations/logic, risk and consolidation recommendation.
- `ENGINE_CONTRACT_9C3.md`: baseline behavior contract for transfer, not final product ideal.
- `UNIFIED_ENGINE_MIGRATION_PLAN.md`: staged transition, failure analysis and gates.
- `SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`: exhaustive setting keys/labels/consumers, legacy map, identifiers, pseudo-settings.
- `RELATED_REPOSITORY_REUSE_AUDIT.md`: evaluate related repos/code reuse.
- `PERFORMANCE_BASELINE.md`: measured speed baseline, test environment and comparisons.
- `STAGE2_MODEL_COVERAGE.md`: canonical model coverage.
- `STAGE3_MEASUREMENT.md`: assets/measurement proof.
- `STAGE4_LINE_ENGINE.md`: line engine audit/coverage.
- `STAGE5_UNIFIED_PLANNER.md`: planner coverage and findings.
- `STAGE6_PAGE_ITEMS.md`: page-item coverage.
- `STAGE7_PAGE_MODEL.md`: PageModel coverage.
- `STAGE8_RENDER_PROJECTIONS.md`: output projection coverage.
- `STAGE8_SLICE6_INVENTORY.md`: slice inventory.
- `STAGE9_CUTOVER_MAP.md`: migration/cutover route and coverage.
- `STAGE9_SHADOW_2026-11-18.md`: shadow compare findings/methodology.
- `S9B_FINAL_VERIFICATION_2026-11-18.md`: final verification slice report.
- `S9B_H7_GRAMMAR_2026-11-18.md`: H7 syntax/anchor verification.
- `S9B_NOTES_GLUE_2026-11-18.md`: note-anchor/glue analysis.
- `S9B_SHAAR_BACK_2026-11-18.md`: back gate content/fields audit.
- `S9B_TOC_D107_2026-11-18.md`: TOC decisions and implementation verification.
- `FULLMATH_FLOOR_ROOT_CLOSURE_2026-11-17.md`: full-math/floor-root findings and closure proof.
- `H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md`: H3 spacing contract and parity audit.
- `UI_OPERATIONAL_AUDIT.md`: UI/settings operational audit.
- `IMPLEMENTATION_STATUS.md`: status snapshot; date and scope required.
- `01_PROGRESS_AUDIT.md`, `02_*`, `03_*`, `04_*`, `05_*`: earlier stage-progress and closure reports.
- `GOLD_V21_GAP_ANALYSIS.md`: gap comparison with earlier Gold V21 project; historical research.
- `P6_P7_D97_CLASSIFICATION.md`: historical classification only; P6/P7 currently out of scope.
- `layout-reference.json`: historical layout reference data, not target acceptance.
- `crosscheck/`: causal and cross-check report data.
- `baseline_S0/`, `baseline_stage1/`, `perf_baseline/`, `perf_slice6/`: captured test/performance baselines.
- `p6_p7_classification/`: historical experiment output.
- `audits/*test_text.txt`: test corpus input (real or synthetic; verify structure).
- `audits/*pdf`: historical/reference PDF; not final-quality target.
- `audits/*json`: structured test evidence/data.

## 14. Glossary maintenance / updating
When a concept, contract, setting, migration stage or issue is introduced or changed:
1. Update the owning source/docs and tests.
2. Record decision (if user/product decision) in `DECISIONS.md`.
3. Record actual work/evidence in `WORKLOG.md`.
4. Update issue/status registers and active plan if scope changes.
5. Update README file inventory and this glossary when paths or concepts change.
6. Include commit/PR/CI evidence; link to exact source file/test.
7. Distinguish status: **active**, **implemented but not proven**, **historical**, **superseded**, **open**, **blocked**, **decision needed**.
