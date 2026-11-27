# Tora Book Typesetter RED — Repository guide

> **תיעוד ניווט מקיף.** Updated against merged tree `main@aedf5ba` + this branch (19 Nov 2026). Includes every tracked non-font file (478 entries, including the two new files this PR adds) and excludes 1,759 font binaries. Directory inventory is complete for this snapshot; descriptions are concise navigation aids, not substitute for reading source. If the repository changes, update this map.

## Authority and work rules — read first

1. **Active execution plan:** [`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`](spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) — current canonical work plan. Do not follow superseded plans.
2. **Plan authority map:** [`spec/README.md`](spec/README.md) — explains active vs historical documents.
3. **User decisions:** [`DECISIONS.md`](DECISIONS.md) — product/engineering decisions and accepted defaults.
4. **Work evidence:** [`WORKLOG.md`](WORKLOG.md) — chronological changes, tests, evidence and stage history.
5. **Agent continuity:** [`ai-chat/SESSION_HANDOFF.md`](ai-chat/SESSION_HANDOFF.md) — historical handoff; may be stale, validate against current code.
6. **AI conversation archives:** [`ai-chat/ChatGPT.md`](ai-chat/ChatGPT.md) and other exports — requirements/corrections/history; AI statements are not authority without user decision or verified evidence.
7. **Issue/finding lifecycle:** [`ISSUE_REGISTRY.md`](ISSUE_REGISTRY.md), [`OPEN_QUESTIONS.md`](OPEN_QUESTIONS.md), [`AGENTS_TRACKING.md`](AGENTS_TRACKING.md).

## Project overview

Hebrew/RTL Torah-book typesetting software. The app has a browser UI, worker-based typesetting, parser/document model, typography and measurement, layout planning, PageModel, render projections/export, decorations/gates/TOC, settings/presets and auditing.

### Current transition caution

At the reviewed migration point, legacy IMUD layout remains the stable baseline and the unified engine is being transitioned segment-by-segment. The shared geometry segment does **not** establish full feature or visual parity. Do not switch runtime/defaults or merge migration work without explicit gates: engine path assertion, content identity, absolute geometry, typography, DOM/HTML/PDF consistency, determinism, performance and meaningful negative tests. See [`audits/UNIFIED_ENGINE_MIGRATION_PLAN.md`](audits/UNIFIED_ENGINE_MIGRATION_PLAN.md), [`audits/ENGINE_CONTRACT_9C3.md`](audits/ENGINE_CONTRACT_9C3.md), [`audits/ENGINE_RUNTIME_PATHS.md`](audits/ENGINE_RUNTIME_PATHS.md), [`audits/ENGINE_DUPLICATION_REGISTER.md`](audits/ENGINE_DUPLICATION_REGISTER.md).

### Quick links by purpose

| Purpose | Start here |
|---|---|
| Execution plan | [spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md](spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) |
| Functional requirements | [spec/01_MASTER_SPECIFICATION.md](spec/01_MASTER_SPECIFICATION.md), [spec/Software_Requirements_Specification.md](spec/Software_Requirements_Specification.md) |
| Decisions/defaults | [DECISIONS.md](DECISIONS.md), [audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md](audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md) |
| Engine map | [audits/ENGINE_CURRENT_STATE.md](audits/ENGINE_CURRENT_STATE.md), [audits/ENGINE_RUNTIME_PATHS.md](audits/ENGINE_RUNTIME_PATHS.md) |
| Duplicated/parallel logic | [audits/ENGINE_DUPLICATION_REGISTER.md](audits/ENGINE_DUPLICATION_REGISTER.md) |
| Unified engine plan | [audits/UNIFIED_ENGINE_MIGRATION_PLAN.md](audits/UNIFIED_ENGINE_MIGRATION_PLAN.md), [transition inventory](audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md) |
| Tests/corpora | `red-build/tests/`, `audits/*test_text.txt`, CI workflows |
| Performance | [audits/PERFORMANCE_BASELINE.md](audits/PERFORMANCE_BASELINE.md), `tools/perf-*.js`, audit JSON |
| AI requirements/history | `ai-chat/` and [spec/סיכום בקשות מAI.md](spec/סיכום בקשות מAI.md) |
| Full technical glossary | [PROJECT_GLOSSARY.md](PROJECT_GLOSSARY.md) |

## Directory structure and responsibility

```text
.github/workflows/             CI, deployment, corpus, full-math and parity jobs
ai-chat/                      AI conversations and session handoffs
archive/debug/                 Historical debugging probes
audits/                        Stage audits, reports, baselines, corpora and analysis
red-build/
  src/
    audit/                     Audit schema, scanners and stage snapshots
    engine/                    Parser → model → typography/measure → layout → PageModel → output
      assets/                  Asset resolution, hashes, image metadata
      audit/                   Diagnostics, editing recommendations and text edits
      core/                    Pipeline, settings, geometry, ledger, events, contracts
      decoration/               Gate pages, themes, headers, folio, TOC, ornaments, dividers
      extensions/               Custom styles schema/IO/application
      import/                  DOCX/ZIP/XML import
      layout/                  Planning, flow, constraints, notes, balance, templates
      line/                    Line items/model and line breaking bridge
      measure/                 Measurement model
      model/                   Document model, identity, validation, round-trip
      notes/                   Note markers
      output/                  DOM/HTML/PDF and projection/export APIs
      parser/                  Block/inline lexing and scanning
      typography/               Fonts, metrics, line-breaking, units, protection
    ui/                        App shell, tabs, worker protocol/client, settings, preview
  tests/                        Unit/integration/layout/e2e/audit/regression/fixtures/artifacts
  ui/                           Browser assets and generated bundles; runtime settings, ornament/theme catalogs
scripts/                         Developer scripts and probes
scripts-stage5/                  Historical Stage 5 scripts
spec/                            Plans, requirements, contracts and user request summaries
tools/                            Audit/parity/performance/corpus and Stage 9 migration tooling
```

## Full file inventory (all tracked non-font files)

- **Snapshot:** 478 non-font tracked files (incl. `PROJECT_GLOSSARY.md` and `audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md` added by this PR); 1,759 font binaries excluded by request.
- **Descriptions:** concise navigation aids based on directory context, names and available headers; reports/artifacts are evidence, not implementation. AI archives are historical and should be reconciled against formal decisions and current code.

### Root-level files

- `.gitignore` — Git exclusion rules for local generated/temporary files.
- `ACCESSIBILITY.md` — Accessibility notes, requirements and audit expectations.
- `AGENTS_TRACKING.md` — Agent/task tracking and coordination notes; track actual evidence rather than self-reported completion.
- `CANONICAL_DOCUMENT_MODEL.md` — Canonical document model contract and semantics for structured text and document items.
- `CUTOVER.md` — Cutover rules and safeguards for switching engine/runtime routes.
- `DECISIONS.md` — User/product decisions (D-series), rationale, scope and validation evidence; decision authority.
- `ISSUE_REGISTRY.md` — Issues, findings, lifecycle/status, evidence and ownership.
- `LAYOUT_DEPENDENCY_MAP.md` — Dependency map: how settings, text, typography, measurement, planning and output affect layout.
- `MIGRATION.md` — Migration overview, compatibility and transition notes.
- `OPEN_QUESTIONS.md` — Unresolved product/engineering questions and decision requests.
- `OPERATIONS.md` — Developer and operational instructions for running, testing and maintaining the app.
- `PROJECT_GLOSSARY.md` — Comprehensive project/architecture glossary (added by this PR): module map, runtime concepts, typography/layout/notes/output terms, settings, audit/testing, migration history, authority hierarchy and red flags.
- `PROVENANCE.md` — Provenance, source lineage and historical/reference information.
- `README.md` — Project front door, authoritative-plan warning, project overview, navigation and file inventory (this document).
- `RELEASE_NOTES.md` — Release history and notable project changes.
- `SECURITY.md` — Security policy and disclosure/reporting guidance.
- `WORKLOG.md` — Chronological work journal, implementation, evidence, tests, regressions and stage handoffs.

### `.github/` — GitHub automation: CI, deployment and audit workflows.


#### `.github/workflows/` — CI, deploy, audit and parity workflow definitions.

- `.github/workflows/ci.yml` — CI: test suites, corpus invariants and engine checks; documents/executes main automated gate.
- `.github/workflows/deploy-pages.yml` — Deployment workflow for the web application to GitHub Pages.
- `.github/workflows/full-math-audit.yml` — Workflow for deterministic/full mathematical geometry audit.
- `.github/workflows/gh-pages-audit.yml` — Audit of deployed Pages build, assets and live product route.
- `.github/workflows/layout-parity.yml` — Layout/parity tooling workflow; must explicitly select the engine path under test.

### `ai-chat/` — Conversation archives and handoff records; use as history, verify against decision/worklog records.

- `ai-chat/ChatGPT.md` — Long ChatGPT project conversation archive; user requests, context, corrections, proposed work and history.
- `ai-chat/qwen-chat-export-de3453mf.txt` — AI conversation export; review for decisions, requirements and history, cross-check DECISIONS/WORKLOG.
- `ai-chat/qwen-chat-export-ee3ef5.txt` — AI conversation export; review for decisions, requirements and history, cross-check authoritative records.
- `ai-chat/qwen-chat-export-enf884mnf.txt` — AI conversation export; review for decisions, requirements and history, cross-check authoritative records.
- `ai-chat/qwen-chat-export-ow232w3we5.txt` — AI conversation export; review for decisions, requirements and history, cross-check authoritative records.
- `ai-chat/SESSION_HANDOFF.md` — Cross-session handoff and current state; historically useful, may be stale—validate against current repo.

### `archive/` — Archived debugging scripts, not runtime.


#### `archive/debug/` — Archived debugging probes.

- `archive/debug/dbg2.js` — Archived debugging probe/script; not production path.
- `archive/debug/dbg3.js` — Archived debugging probe/script; not production path.
- `archive/debug/dbg4.js` — Archived debugging probe/script; not production path.
- `archive/debug/dbg5.js` — Archived debugging probe/script; not production path.
- `archive/debug/dbg6.js` — Archived debugging probe/script; not production path.
- `archive/debug/dbg7.js` — Archived debugging probe/script; not production path.

### `audits/` — Engineering audits, closure reports, migration analyses, baselines, corpora and captured evidence.

- `audits/01_PROGRESS_AUDIT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/02_S11_S13_COMPLETION_REPORT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/02_S7_CLOSURE_REPORT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/03_S417_FILL_DIFF_MAP.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/03_S8_CLOSURE_REPORT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/04_S9_CLOSURE_REPORT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/05_S10_CLOSURE_REPORT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/ENGINE_CONTRACT_9C3.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/ENGINE_CURRENT_STATE.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/ENGINE_DUPLICATION_REGISTER.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/ENGINE_RUNTIME_PATHS.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md` — Companion capability/defaults/geometry/identifier inventory and open forensic checklist for the engine transition (added by this PR); folio rule: bare gematria per D-108.
- `audits/FULLMATH_FLOOR_ROOT_CLOSURE_2026-11-17.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/GOLD_V21_GAP_ANALYSIS.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/IMPLEMENTATION_STATUS.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/layout-reference.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/long_test_text_no_parentheses.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/long_test_text.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/mid_long_test_text.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/no_long_test_text.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md` — Executed execution prompt for the legacy↔unified full-parity milestone (branch/workflow/comparator/benchmark requirements); binding work order, not a status claim.
- `audits/P6_P7_D97_CLASSIFICATION.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/PERFORMANCE_BASELINE.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/RELATED_REPOSITORY_REUSE_AUDIT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/S9B_FINAL_VERIFICATION_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/S9B_H7_GRAMMAR_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/S9B_NOTES_GLUE_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/S9B_SHAAR_BACK_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/S9B_TOC_D107_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE1_MAP_FORENSIC_FINDINGS_2026-11-19.md` — Forensic annex to the Stage 1 map review (layer-by-layer model evidence); check date/commit before treating as current.
- `audits/STAGE1_MAP_RECONCILIATION_PROMPT_2026-11-19.md` — Execution prompt that ordered the Stage 1 map reconciliation; work order provenance.
- `audits/STAGE1_MAP_REVIEW_2026-11-19.md` — Review that found the Stage 1 map v1 errors (adapter/layer confusion, stale counts); superseded by the reconciled map in PR #66.
- `audits/STAGE2_MODEL_COVERAGE.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE3_MEASUREMENT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE4_LINE_ENGINE.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE5_UNIFIED_PLANNER.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE6_PAGE_ITEMS.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE7_PAGE_MODEL.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE8_RENDER_PROJECTIONS.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE8_SLICE6_INVENTORY.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_CUTOVER_MAP.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_SHADOW_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_SHADOW_canonical_corpus_2026-11-17.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/STAGE9_SHADOW_canonical_corpus_2026-11-18_v5.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/STAGE9_SHADOW_canonical_corpus_2026-11-18_v5.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_SHADOW_canonical_corpus_2026-11-18.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/STAGE9_SHADOW_canonical_corpus_v5_2026-11-18.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_SHADOW_very_long_2026-11-18_v5.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/STAGE9_SHADOW_very_long_2026-11-18_v5.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/STAGE9_SHADOW_very_long_2026-11-18.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/UI_OPERATIONAL_AUDIT.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md` — Normative consolidation of user requirements and UI history (authority hierarchy, folio rule D-108, UI sync contract); binding reference for scope disputes.
- `audits/very_long_test_text.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/דוגמא מגרסא ישנה - כולל סימון בלוקים ופיסקאות.pdf` — Visual/reference document from older version; archival evidence only, not final quality target.
- `audits/דוגמא מגרסא ישנה - כולל סימון בלוקים פיסקאות שורות.pdf` — Visual/reference document from older version; archival evidence only, not final quality target.
- `audits/דוגמא מגרסא ישנה - כולל סימון בלוקים.pdf` — Visual/reference document from older version; archival evidence only, not final quality target.
- `audits/דוגמא מגרסא ישנה.pdf` — Visual/reference document from older version; archival evidence only, not final quality target.

#### `audits/baseline_S0/` — Initial test and parity baseline evidence.

- `audits/baseline_S0/fullmath_report.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_S0/npm_test_full.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_S0/parity_report.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_S0/parity-report.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/baseline_S0/summary.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.
- `audits/baseline_S0/verylong_legacy_content_check.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.

#### `audits/baseline_stage1/` — Stage 1 baseline: corpus, determinism, cross-check, full-math and hashes.

- `audits/baseline_stage1/corpus-report-verylong.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/baseline_stage1/cross-check-report.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/baseline_stage1/determinism.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_stage1/full-math-local.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_stage1/input-hashes.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_stage1/layout-audit-report-verylong-local.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/baseline_stage1/npm-test-full.txt` — Audit log, baseline, corpus or captured result; evidence only, not implementation.
- `audits/baseline_stage1/summary.md` — Audit/closure/analysis document: findings, methodology, evidence and conclusions; check date/commit before treating as current.

#### `audits/crosscheck/` — Causality/cross-check report data.

- `audits/crosscheck/causality-current.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/crosscheck/causality-last.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/crosscheck/cross-check-report.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.

#### `audits/p6_p7_classification/` — Historical P6/P7 experiment data; excluded from current scope.

- `audits/p6_p7_classification/ours-model_fiteps0_experiment.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.
- `audits/p6_p7_classification/parity-report_fiteps0_experiment.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.

#### `audits/perf_baseline/` — Captured performance measurements.

- `audits/perf_baseline/perf-baseline.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.

#### `audits/perf_slice6/` — Captured slice-specific performance data.

- `audits/perf_slice6/perf-slice6.json` — Structured audit output/data snapshot (JSON); use alongside the corresponding report and script.

### `red-build/` — Application package: source modules, browser bundles/assets, tests and artifacts.

- `red-build/package.json` — Structured data/settings/reference/output JSON; read with its matching report/tool.

#### `red-build/src/audit/` — Audit report schema, scanner logic and stage snapshots.

- `red-build/src/audit/report-schema.js` — Audit/diagnostic source: report-schema.js; audit schemas, scanners or stage snapshots.
- `red-build/src/audit/scanners.js` — Audit/diagnostic source: scanners.js; audit schemas, scanners or stage snapshots.
- `red-build/src/audit/stage-snapshots.js` — Audit/diagnostic source: stage-snapshots.js; audit schemas, scanners or stage snapshots.

#### `red-build/src/engine/assets/` — Asset resolver, hashing and image metadata.

- `red-build/src/engine/assets/asset-resolver.js` — Engine implementation (undefined subsystem): Engine source module. File asset-resolver.js; consult its header/exported API for exact contract.
- `red-build/src/engine/assets/hash256.js` — Engine implementation (undefined subsystem): Engine source module. File hash256.js; consult its header/exported API for exact contract.
- `red-build/src/engine/assets/image-meta.js` — Engine implementation (undefined subsystem): Engine source module. File image-meta.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/audit/` — Editing recommendations and text-edit operations.

- `red-build/src/engine/audit/editing-recommendations.js` — Engine implementation (undefined subsystem): Engine source module. File editing-recommendations.js; consult its header/exported API for exact contract.
- `red-build/src/engine/audit/text-edits.js` — Engine implementation (undefined subsystem): Engine source module. File text-edits.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/core/` — Pipeline, settings, geometry, PageModel, event and ledger contracts.

- `red-build/src/engine/core/events.js` — Engine implementation (undefined subsystem): Engine source module. File events.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/h3-contract.js` — Engine implementation (undefined subsystem): Engine source module. File h3-contract.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/imud-geometry.js` — Engine implementation (undefined subsystem): Engine source module. File imud-geometry.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/ledger.js` — Engine implementation (undefined subsystem): Engine source module. File ledger.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/legacy-settings-map.js` — Engine implementation (undefined subsystem): Engine source module. File legacy-settings-map.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/materialize.js` — Engine implementation (undefined subsystem): Engine source module. File materialize.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/page-model.js` — Engine implementation (undefined subsystem): Engine source module. File page-model.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/pipeline.js` — Engine implementation (undefined subsystem): Engine source module. File pipeline.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/pua-text.js` — Engine implementation (undefined subsystem): Engine source module. File pua-text.js; consult its header/exported API for exact contract.
- `red-build/src/engine/core/settings-registry.js` — Engine implementation (undefined subsystem): Engine source module. File settings-registry.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/decoration/` — Gates, themes, headers, folio, TOC, ornaments, dividers and SVG safety.

- `red-build/src/engine/decoration/asset-registry.js` — Engine implementation (undefined subsystem): Engine source module. File asset-registry.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/assets-import.js` — Engine implementation (undefined subsystem): Engine source module. File assets-import.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/custom-pages.js` — Engine implementation (undefined subsystem): Engine source module. File custom-pages.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/dividers.js` — Engine implementation (undefined subsystem): Engine source module. File dividers.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/folio.js` — Engine implementation (undefined subsystem): Engine source module. File folio.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/headers-builder.js` — Engine implementation (undefined subsystem): Engine source module. File headers-builder.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/legacy-ornaments.js` — Engine implementation (undefined subsystem): Engine source module. File legacy-ornaments.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/numbering-audit.js` — Engine implementation (undefined subsystem): Engine source module. File numbering-audit.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/ornament-fit.js` — Engine implementation (undefined subsystem): Engine source module. File ornament-fit.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/ornament-ink.js` — Engine implementation (undefined subsystem): Engine source module. File ornament-ink.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/ornament-plan.js` — Engine implementation (undefined subsystem): Engine source module. File ornament-plan.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/page-decorations.js` — Engine implementation (undefined subsystem): Engine source module. File page-decorations.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/shaar-boxes.js` — Engine implementation (undefined subsystem): Engine source module. File shaar-boxes.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/shaar-pages.js` — Engine implementation (undefined subsystem): Engine source module. File shaar-pages.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/svg-sanitize.js` — Engine implementation (undefined subsystem): Engine source module. File svg-sanitize.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/theme-sets.js` — Engine implementation (undefined subsystem): Engine source module. File theme-sets.js; consult its header/exported API for exact contract.
- `red-build/src/engine/decoration/toc-builder.js` — Engine implementation (undefined subsystem): Engine source module. File toc-builder.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/extensions/` — Custom style schema, persistence and application.

- `red-build/src/engine/extensions/apply-styles.js` — Engine implementation (undefined subsystem): Engine source module. File apply-styles.js; consult its header/exported API for exact contract.
- `red-build/src/engine/extensions/extensions-io.js` — Engine implementation (undefined subsystem): Engine source module. File extensions-io.js; consult its header/exported API for exact contract.
- `red-build/src/engine/extensions/style-schema.js` — Engine implementation (undefined subsystem): Engine source module. File style-schema.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/import/` — DOCX/ZIP/XML import helpers.

- `red-build/src/engine/import/docx-import.js` — Engine implementation (undefined subsystem): Engine source module. File docx-import.js; consult its header/exported API for exact contract.
- `red-build/src/engine/import/xml-lite.js` — Engine implementation (undefined subsystem): Engine source module. File xml-lite.js; consult its header/exported API for exact contract.
- `red-build/src/engine/import/zip-reader.js` — Engine implementation (undefined subsystem): Engine source module. File zip-reader.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/layout/` — Flow, planner, constraints, notes, side-notes, templates, balancing and legacy layout.

- `red-build/src/engine/layout/balancing.js` — Engine implementation (undefined subsystem): Engine source module. File balancing.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/candidate-generator.js` — Engine implementation (undefined subsystem): Engine source module. File candidate-generator.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/column-flow.js` — Engine implementation (undefined subsystem): Engine source module. File column-flow.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/constraint-matrix.js` — Engine implementation (undefined subsystem): Engine source module. File constraint-matrix.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/decision-trace.js` — Engine implementation (undefined subsystem): Engine source module. File decision-trace.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/dp-planner.js` — Engine implementation (undefined subsystem): Engine source module. File dp-planner.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/endnote-pages.js` — Engine implementation (undefined subsystem): Engine source module. File endnote-pages.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/footnote-budget.js` — Engine implementation (undefined subsystem): Engine source module. File footnote-budget.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/footnote-lanes.js` — Engine implementation (undefined subsystem): Engine source module. File footnote-lanes.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/furniture-geometry.js` — Engine implementation (undefined subsystem): Engine source module. File furniture-geometry.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/headings-escort.js` — Engine implementation (undefined subsystem): Engine source module. File headings-escort.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/legacy-imud-flow.js` — Engine implementation (undefined subsystem): Engine source module. File legacy-imud-flow.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/notes-model.js` — Engine implementation (undefined subsystem): Engine source module. File notes-model.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/ordering.js` — Engine implementation (undefined subsystem): Engine source module. File ordering.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/page-items.js` — Engine implementation (undefined subsystem): Engine source module. File page-items.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/page-templates.js` — Engine implementation (undefined subsystem): Engine source module. File page-templates.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/plan-model.js` — Engine implementation (undefined subsystem): Engine source module. File plan-model.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/protections-matrix.js` — Engine implementation (undefined subsystem): Engine source module. File protections-matrix.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/retreat-loop.js` — Engine implementation (undefined subsystem): Engine source module. File retreat-loop.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/side-notes.js` — Engine implementation (undefined subsystem): Engine source module. File side-notes.js; consult its header/exported API for exact contract.
- `red-build/src/engine/layout/structural-stamps.js` — Engine implementation (undefined subsystem): Engine source module. File structural-stamps.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/line/` — Line items/model and break policies.

- `red-build/src/engine/line/breaks.js` — Engine implementation (undefined subsystem): Engine source module. File breaks.js; consult its header/exported API for exact contract.
- `red-build/src/engine/line/line-items.js` — Engine implementation (undefined subsystem): Engine source module. File line-items.js; consult its header/exported API for exact contract.
- `red-build/src/engine/line/line-model.js` — Engine implementation (undefined subsystem): Engine source module. File line-model.js; consult its header/exported API for exact contract.
- `red-build/src/engine/line/pipeline-bridge.js` — Engine implementation (undefined subsystem): Engine source module. File pipeline-bridge.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/measure/` — Measurement model.

- `red-build/src/engine/measure/measure-model.js` — Engine implementation (undefined subsystem): Engine source module. File measure-model.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/model/` — Canonical model, identity, validation and round-trip.

- `red-build/src/engine/model/adapter.js` — Engine implementation (undefined subsystem): Engine source module. File adapter.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/document-model.js` — Engine implementation (undefined subsystem): Engine source module. File document-model.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/identity.js` — Engine implementation (undefined subsystem): Engine source module. File identity.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/kinds.js` — Engine implementation (undefined subsystem): Engine source module. File kinds.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/registry.js` — Engine implementation (undefined subsystem): Engine source module. File registry.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/roundtrip.js` — Engine implementation (undefined subsystem): Engine source module. File roundtrip.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/source-range.js` — Engine implementation (undefined subsystem): Engine source module. File source-range.js; consult its header/exported API for exact contract.
- `red-build/src/engine/model/validate.js` — Engine implementation (undefined subsystem): Engine source module. File validate.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/notes/` — Note markers.

- `red-build/src/engine/notes/markers.js` — Engine implementation (undefined subsystem): Engine source module. File markers.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/output/` — DOM/HTML/PDF projections, export and project I/O.

- `red-build/src/engine/output/dom-renderer.js` — Engine implementation (undefined subsystem): Engine source module. File dom-renderer.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/export-api.js` — Engine implementation (undefined subsystem): Engine source module. File export-api.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/geometry-projector.js` — Engine implementation (undefined subsystem): Engine source module. File geometry-projector.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/html-export.js` — Engine implementation (undefined subsystem): Engine source module. File html-export.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/legacy-projector.js` — Engine implementation (undefined subsystem): Engine source module. File legacy-projector.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/line-font.js` — Engine implementation (undefined subsystem): Engine source module. File line-font.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/pagemodel-dom-renderer.js` — Engine implementation (undefined subsystem): Engine source module. File pagemodel-dom-renderer.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/pdf-writer.js` — Engine implementation (undefined subsystem): Engine source module. File pdf-writer.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/project-io.js` — Engine implementation (undefined subsystem): Engine source module. File project-io.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/shaar-content.js` — Engine implementation (undefined subsystem): Engine source module. File shaar-content.js; consult its header/exported API for exact contract.
- `red-build/src/engine/output/zip-writer.js` — Engine implementation (undefined subsystem): Engine source module. File zip-writer.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/parser/` — Block/inline lexical and parse modules.

- `red-build/src/engine/parser/block-tokenizer.js` — Engine implementation (undefined subsystem): Engine source module. File block-tokenizer.js; consult its header/exported API for exact contract.
- `red-build/src/engine/parser/bracket-scanner.js` — Engine implementation (undefined subsystem): Engine source module. File bracket-scanner.js; consult its header/exported API for exact contract.
- `red-build/src/engine/parser/dfa-lexer.js` — Engine implementation (undefined subsystem): Engine source module. File dfa-lexer.js; consult its header/exported API for exact contract.
- `red-build/src/engine/parser/inline-content.js` — Engine implementation (undefined subsystem): Engine source module. File inline-content.js; consult its header/exported API for exact contract.

#### `red-build/src/engine/typography/` — Fonts, metrics, line-breaking, units, dropword and protectors.

- `red-build/src/engine/typography/dropword.js` — Engine implementation (undefined subsystem): Engine source module. File dropword.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/font-keys.js` — Engine implementation (undefined subsystem): Engine source module. File font-keys.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/font-metrics.js` — Engine implementation (undefined subsystem): Engine source module. File font-metrics.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/font-resolver.js` — Engine implementation (undefined subsystem): Engine source module. File font-resolver.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/font-subset.js` — Engine implementation (undefined subsystem): Engine source module. File font-subset.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/kp-linebreak.js` — Engine implementation (undefined subsystem): Engine source module. File kp-linebreak.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/measure-api.js` — Engine implementation (undefined subsystem): Engine source module. File measure-api.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/measure-table.js` — Engine implementation (undefined subsystem): Engine source module. File measure-table.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/protectors.js` — Engine implementation (undefined subsystem): Engine source module. File protectors.js; consult its header/exported API for exact contract.
- `red-build/src/engine/typography/units.js` — Engine implementation (undefined subsystem): Engine source module. File units.js; consult its header/exported API for exact contract.

#### `red-build/src/ui/` — UI, worker, settings, editor, preview and transport modules.

- `red-build/src/ui/app-shell.js` — UI source module: app-shell.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/bindings.generated.js` — UI source module: bindings.generated.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/browser-entry.js` — UI source module: browser-entry.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/callgraph-scan.js` — UI source module: callgraph-scan.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/caret-map.js` — UI source module: caret-map.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/editor-tab.js` — UI source module: editor-tab.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/engine-worker-main.js` — UI source module: engine-worker-main.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/extensions-panel.js` — UI source module: extensions-panel.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/imud-library.js` — UI source module: imud-library.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/inline-transport.js` — UI source module: inline-transport.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/page-model-transport.js` — UI source module: page-model-transport.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/preview-tab.js` — UI source module: preview-tab.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/retypeset-policy.js` — UI source module: retypeset-policy.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/settings-panel.js` — UI source module: settings-panel.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/settings-persistence.js` — UI source module: settings-persistence.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/status-strip.js` — UI source module: status-strip.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/test-doc-generator.js` — UI source module: test-doc-generator.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/testing-tab.js` — UI source module: testing-tab.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/worker-client.js` — UI source module: worker-client.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.
- `red-build/src/ui/worker-protocol.js` — UI source module: worker-protocol.js; editor/settings/testing/preview/worker/transport/persistence interaction. See module header for precise responsibilities.

#### `red-build/tests/` — Files in this subsystem; each entry describes the file's role.

- `red-build/tests/harness.js` — JavaScript implementation or utility; inspect imports, exports and tests for exact role.

#### `red-build/tests/artifacts/` — Files in this subsystem; each entry describes the file's role.

- `red-build/tests/artifacts/cutover-sample-real-fonts.pdf` — Generated/archived PDF test artifact: cutover-sample-real-fonts.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/d89-check.pdf` — Generated/archived PDF test artifact: d89-check.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/real-book-matrix.json` — Generated test/audit artifact: real-book-matrix.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/real-fonts-canonical.pdf` — Generated/archived PDF test artifact: real-fonts-canonical.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/real-fonts-export.json` — Generated test/audit artifact: real-fonts-export.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s10-callgraph.json` — Generated test/audit artifact: s10-callgraph.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s12-canonical.pdf` — Generated/archived PDF test artifact: s12-canonical.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/s12-font-subset.json` — Generated test/audit artifact: s12-font-subset.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s12-linebreak-equality.json` — Generated test/audit artifact: s12-linebreak-equality.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s12-parity.json` — Generated test/audit artifact: s12-parity.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s12-pdf-outline.json` — Generated test/audit artifact: s12-pdf-outline.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s13-crosspath.json` — Generated test/audit artifact: s13-crosspath.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s13-matrix-report.json` — Generated test/audit artifact: s13-matrix-report.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s13-perf.json` — Generated test/audit artifact: s13-perf.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s13-trigger-accounting.json` — Generated test/audit artifact: s13-trigger-accounting.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s3-measure-parity.json` — Generated test/audit artifact: s3-measure-parity.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s4-line-comparison.json` — Generated test/audit artifact: s4-line-comparison.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s4b-corpus-comparison.json` — Generated test/audit artifact: s4b-corpus-comparison.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s4b-main-baseline.json` — Generated test/audit artifact: s4b-main-baseline.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s5-corpus-comparison.json` — Generated test/audit artifact: s5-corpus-comparison.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s5-main-baseline.json` — Generated test/audit artifact: s5-main-baseline.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/s53-dp-endnotes.pdf` — Generated/archived PDF test artifact: s53-dp-endnotes.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/s73-parity.pdf` — Generated/archived PDF test artifact: s73-parity.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/s77-quote.pdf` — Generated/archived PDF test artifact: s77-quote.pdf; inspect visually as evidence, not source.
- `red-build/tests/artifacts/s77-settings-live-audit.json` — Generated test/audit artifact: s77-settings-live-audit.json; structured evidence for a specific stage, audit or run.

#### `red-build/tests/artifacts/full-math-audit/` — Captured full-math and determinism outputs.

- `red-build/tests/artifacts/full-math-audit/local-determinism-raw.json` — Generated test/audit artifact: local-determinism-raw.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/local-determinism-result.json` — Generated test/audit artifact: local-determinism-result.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/local-full-math-audit.json` — Generated test/audit artifact: local-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/local-s6c-full-math-audit.json` — Generated test/audit artifact: local-s6c-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s424-local-determinism-raw.json` — Generated test/audit artifact: s424-local-determinism-raw.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s424-local-determinism-result.json` — Generated test/audit artifact: s424-local-determinism-result.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s424-local-full-math-audit.json` — Generated test/audit artifact: s424-local-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s426-local-determinism-raw.json` — Generated test/audit artifact: s426-local-determinism-raw.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s426-local-determinism-result.json` — Generated test/audit artifact: s426-local-determinism-result.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s426-local-full-math-audit.json` — Generated test/audit artifact: s426-local-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s427-local-determinism-raw.json` — Generated test/audit artifact: s427-local-determinism-raw.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s427-local-determinism-result.json` — Generated test/audit artifact: s427-local-determinism-result.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s427-local-full-math-audit.json` — Generated test/audit artifact: s427-local-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s52-final-determinism-raw.json` — Generated test/audit artifact: s52-final-determinism-raw.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s52-final-determinism-result.json` — Generated test/audit artifact: s52-final-determinism-result.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s52-final-full-math-audit.json` — Generated test/audit artifact: s52-final-full-math-audit.json; structured evidence for a specific stage, audit or run.
- `red-build/tests/artifacts/full-math-audit/s52-local-full-math-audit.json` — Generated test/audit artifact: s52-local-full-math-audit.json; structured evidence for a specific stage, audit or run.

#### `red-build/tests/audit/` — Files in this subsystem; each entry describes the file's role.

- `red-build/tests/audit/negative-controls.test.js` — Audit suite/fixture: negative-controls.test.js; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/s13-security-a11y.test.js` — Audit suite/fixture: s13-security-a11y.test.js; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/stage-snapshots.test.js` — Audit suite/fixture: stage-snapshots.test.js; diagnostic sensitivity, negative controls or security/accessibility audit.

#### `red-build/tests/audit/fixtures/` — Diagnostic and negative-control fixtures.

- `red-build/tests/audit/fixtures/nc01_mid_doc_metadata.txt` — Audit suite/fixture: nc01_mid_doc_metadata.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc02_class_title.txt` — Audit suite/fixture: nc02_class_title.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc03_terminal_residual.txt` — Audit suite/fixture: nc03_terminal_residual.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc04_part_opening.txt` — Audit suite/fixture: nc04_part_opening.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc05_bound_marker.txt` — Audit suite/fixture: nc05_bound_marker.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc06_paren_within_column.txt` — Audit suite/fixture: nc06_paren_within_column.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc10_colon_times.txt` — Audit suite/fixture: nc10_colon_times.txt; diagnostic sensitivity, negative controls or security/accessibility audit.
- `red-build/tests/audit/fixtures/nc11_h7_duplicate.txt` — Audit suite/fixture: nc11_h7_duplicate.txt; diagnostic sensitivity, negative controls or security/accessibility audit.

#### `red-build/tests/e2e/` — End-to-end product, layout, UI, migration and export suites.

- `red-build/tests/e2e/audit-sensitivity.test.js` — End-to-end/regression suite: audit-sensitivity.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/canonical.test.js` — End-to-end/regression suite: canonical.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/d89-visual-fixes.test.js` — End-to-end/regression suite: d89-visual-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/long-real-text.test.js` — End-to-end/regression suite: long-real-text.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/pdf-targets.test.js` — End-to-end/regression suite: pdf-targets.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/pipeline.test.js` — End-to-end/regression suite: pipeline.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/real-fonts.test.js` — End-to-end/regression suite: real-fonts.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s10-ui.test.js` — End-to-end/regression suite: s10-ui.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s11-extensions.test.js` — End-to-end/regression suite: s11-extensions.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s12-export.test.js` — End-to-end/regression suite: s12-export.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s13-acceptance.test.js` — End-to-end/regression suite: s13-acceptance.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s14-layout-audit.test.js` — End-to-end/regression suite: s14-layout-audit.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s15-view-justify.test.js` — End-to-end/regression suite: s15-view-justify.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s2-heading3-spacing.test.js` — End-to-end/regression suite: s2-heading3-spacing.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s24-fullmath-fixes.test.js` — End-to-end/regression suite: s24-fullmath-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s3-worker-e2e.test.js` — End-to-end/regression suite: s3-worker-e2e.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s4b-production-path.test.js` — End-to-end/regression suite: s4b-production-path.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s52-dp-fixes.test.js` — End-to-end/regression suite: s52-dp-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s52-ui-fixes.test.js` — End-to-end/regression suite: s52-ui-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s53-dp-notes-export.test.js` — End-to-end/regression suite: s53-dp-notes-export.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s5b-measurement-purity.test.js` — End-to-end/regression suite: s5b-measurement-purity.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s60-monster-fixes.test.js` — End-to-end/regression suite: s60-monster-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s61-gap-fixes.test.js` — End-to-end/regression suite: s61-gap-fixes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s62-user-questions.test.js` — End-to-end/regression suite: s62-user-questions.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s63-ui-operational-audit.test.js` — End-to-end/regression suite: s63-ui-operational-audit.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s64-ornament-index.test.js` — End-to-end/regression suite: s64-ornament-index.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s65-split-book-title.test.js` — End-to-end/regression suite: s65-split-book-title.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s67-fn-reset-page.test.js` — End-to-end/regression suite: s67-fn-reset-page.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s68-pdf-word-scales.test.js` — End-to-end/regression suite: s68-pdf-word-scales.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s69-engine-residuals.test.js` — End-to-end/regression suite: s69-engine-residuals.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s6b-notes-unification.test.js` — End-to-end/regression suite: s6b-notes-unification.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s6c-ornament-contract-anchors.test.js` — End-to-end/regression suite: s6c-ornament-contract-anchors.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s7-notes.test.js` — End-to-end/regression suite: s7-notes.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s7-page-model.test.js` — End-to-end/regression suite: s7-page-model.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s72-column-bottoms.test.js` — End-to-end/regression suite: s72-column-bottoms.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s73-pdf-font-parity.test.js` — End-to-end/regression suite: s73-pdf-font-parity.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s75-notes-flow.test.js` — End-to-end/regression suite: s75-notes-flow.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s76-notes-flow.test.js` — End-to-end/regression suite: s76-notes-flow.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s77-user-issues.test.js` — End-to-end/regression suite: s77-user-issues.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8-decoration.test.js` — End-to-end/regression suite: s8-decoration.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8a-materialization.test.js` — End-to-end/regression suite: s8a-materialization.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8b-materialize-boundary.test.js` — End-to-end/regression suite: s8b-materialize-boundary.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8c-pagemodel-contract.test.js` — End-to-end/regression suite: s8c-pagemodel-contract.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8d-pagemodel-dom.test.js` — End-to-end/regression suite: s8d-pagemodel-dom.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8e-pagemodel-html.test.js` — End-to-end/regression suite: s8e-pagemodel-html.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8f-pagemodel-pdf.test.js` — End-to-end/regression suite: s8f-pagemodel-pdf.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s8g-parity-simplify.test.js` — End-to-end/regression suite: s8g-parity-simplify.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9-headers.test.js` — End-to-end/regression suite: s9-headers.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9b-h7-grammar-anchor.test.js` — End-to-end/regression suite: s9b-h7-grammar-anchor.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9b-notes-glue.test.js` — End-to-end/regression suite: s9b-notes-glue.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9b-shaar-back.test.js` — End-to-end/regression suite: s9b-shaar-back.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9b-shadow-compare.test.js` — End-to-end/regression suite: s9b-shadow-compare.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9b-toc-d107.test.js` — End-to-end/regression suite: s9b-toc-d107.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9c-dom-preview.test.js` — End-to-end/regression suite: s9c-dom-preview.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9c-html-export.test.js` — End-to-end/regression suite: s9c-html-export.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9c-pdf-export.test.js` — End-to-end/regression suite: s9c-pdf-export.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9c-tooling-parity.test.js` — End-to-end/regression suite: s9c-tooling-parity.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.
- `red-build/tests/e2e/s9d-segment1-geometry.test.js` — End-to-end/regression suite: s9d-segment1-geometry.test.js; checks integrated product behavior. Test name identifies feature/slice; inspect assertions and fixture before interpreting coverage.

#### `red-build/tests/fixtures/` — Files in this subsystem; each entry describes the file's role.

- `red-build/tests/fixtures/canonical_corpus.txt` — Test fixture: canonical_corpus.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/gen_docx_fixture.js` — Test fixture: gen_docx_fixture.js; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/gen_ttf_fixture.js` — Test fixture: gen_ttf_fixture.js; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/generate_canonical_corpus.js` — Test fixture: generate_canonical_corpus.js; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_settings_makom_bina.json` — Test fixture: imud_default_settings_makom_bina.json; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_settings_v19.json` — Test fixture: imud_default_settings_v19.json; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_settings_v20_4.json` — Test fixture: imud_default_settings_v20_4.json; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_settings_v21.json` — Test fixture: imud_default_settings_v21.json; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_settings.json` — Test fixture: imud_default_settings.json; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/imud_default_text.txt` — Test fixture: imud_default_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/nc02_class_title.txt` — Test fixture: nc02_class_title.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/sample.txt` — Test fixture: sample.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.

#### `red-build/tests/fixtures/real/` — Real-text corpora.

- `red-build/tests/fixtures/real/long_test_text.txt` — Test fixture: long_test_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/real/mid_long_test_text.txt` — Test fixture: mid_long_test_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/real/no_long_test_text.txt` — Test fixture: no_long_test_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/real/orange_very_long_test_text.txt` — Test fixture: orange_very_long_test_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/real/very_long_test_text.txt` — Test fixture: very_long_test_text.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.

#### `red-build/tests/fixtures/regress/` — Small regression scenarios.

- `red-build/tests/fixtures/regress/paren-note-control.txt` — Test fixture: paren-note-control.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.
- `red-build/tests/fixtures/regress/paren-note-trigger.txt` — Test fixture: paren-note-trigger.txt; source text/settings/sample input for tests; fixture name indicates scenario/version.

#### `red-build/tests/fixtures/worker/` — Worker startup fixture.

- `red-build/tests/fixtures/worker/s3-worker-bootstrap.js` — Test fixture: s3-worker-bootstrap.js; source text/settings/sample input for tests; fixture name indicates scenario/version.

#### `red-build/tests/helpers/` — Reusable test helper.

- `red-build/tests/helpers/tiny-png.js` — Test helper: tiny-png.js; reusable test support code.

#### `red-build/tests/integration/` — Module integration tests.

- `red-build/tests/integration/imud-migration.test.js` — Integration suite: imud-migration.test.js; checks module contracts and imported settings/source variants.
- `red-build/tests/integration/legacy-result-contract.test.js` — Integration suite: legacy-result-contract.test.js; checks module contracts and imported settings/source variants.
- `red-build/tests/integration/registry.test.js` — Integration suite: registry.test.js; checks module contracts and imported settings/source variants.
- `red-build/tests/integration/setting-sets.test.js` — Integration suite: setting-sets.test.js; checks module contracts and imported settings/source variants.
- `red-build/tests/integration/source-variants.test.js` — Integration suite: source-variants.test.js; checks module contracts and imported settings/source variants.

#### `red-build/tests/layout/` — Planner and line/layout tests.

- `red-build/tests/layout/ext8-optimal-balance.test.js` — Layout/algorithm suite: ext8-optimal-balance.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s4-line-comparison.test.js` — Layout/algorithm suite: s4-line-comparison.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s4-line-engine.test.js` — Layout/algorithm suite: s4-line-engine.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s5-corpus-comparison.test.js` — Layout/algorithm suite: s5-corpus-comparison.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s5-s6.test.js` — Layout/algorithm suite: s5-s6.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s5-unified-planner.test.js` — Layout/algorithm suite: s5-unified-planner.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s5b-plan-contracts.test.js` — Layout/algorithm suite: s5b-plan-contracts.test.js; planner, line engine, balancing and stage contract checks.
- `red-build/tests/layout/s6-page-items.test.js` — Layout/algorithm suite: s6-page-items.test.js; planner, line engine, balancing and stage contract checks.

#### `red-build/tests/regress/` — Targeted regression tests.

- `red-build/tests/regress/r03-paren-note-flags.test.js` — Regression test: r03-paren-note-flags.test.js; guards a previously discovered failure mode.

#### `red-build/tests/unit/` — Unit tests.

- `red-build/tests/unit/parser.test.js` — Unit suite: parser.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s2-model.test.js` — Unit suite: s2-model.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-assets.test.js` — Unit suite: s3-assets.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-cache-collision.test.js` — Unit suite: s3-cache-collision.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-font-sync.test.js` — Unit suite: s3-font-sync.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-immutability.test.js` — Unit suite: s3-immutability.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-measure.test.js` — Unit suite: s3-measure.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s3-transport-integrity.test.js` — Unit suite: s3-transport-integrity.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/s4-line-items.test.js` — Unit suite: s4-line-items.test.js; isolated parser/model/measurement/typography behavior.
- `red-build/tests/unit/typography.test.js` — Unit suite: typography.test.js; isolated parser/model/measurement/typography behavior.

#### `red-build/ui/` — Files in this subsystem; each entry describes the file's role.

- `red-build/ui/_export_test.html` — Built/runtime UI file: _export_test.html; browser app shell, style, worker bundle or icon.
- `red-build/ui/_fx.txt` — Built/runtime UI file: _fx.txt; browser app shell, style, worker bundle or icon.
- `red-build/ui/_vl.txt` — Built/runtime UI file: _vl.txt; browser app shell, style, worker bundle or icon.
- `red-build/ui/app.bundle.js` — Built/runtime UI file: app.bundle.js; browser app shell, style, worker bundle or icon.
- `red-build/ui/engine-worker.bundle.js` — Built/runtime UI file: engine-worker.bundle.js; browser app shell, style, worker bundle or icon.
- `red-build/ui/favicon.ico` — Built/runtime UI file: favicon.ico; browser app shell, style, worker bundle or icon.
- `red-build/ui/imudify-icon.svg` — Built/runtime UI file: imudify-icon.svg; browser app shell, style, worker bundle or icon.
- `red-build/ui/index.html` — Built/runtime UI file: index.html; browser app shell, style, worker bundle or icon.
- `red-build/ui/styles.css` — Built/runtime UI file: styles.css; browser app shell, style, worker bundle or icon.

#### `red-build/ui/assets/brand/` — Brand artwork.

- `red-build/ui/assets/brand/imudify-brand.svg` — Web asset: imudify-brand.svg; UI brand/icon/static resource.

#### `red-build/ui/assets/imud/` — IMUD defaults, catalogs, theme/gate/ornament resources.

- `red-build/ui/assets/imud/default_settings.json` — IMUD bundled asset/settings catalog: default_settings.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/fonts-extended.json` — IMUD bundled asset/settings catalog: fonts-extended.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/fonts-priority.json` — IMUD bundled asset/settings catalog: fonts-priority.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/header_ornaments.index.json` — Asset index for header_ornaments; catalog/lookup metadata.
- `red-build/ui/assets/imud/header_ornaments.json` — IMUD bundled asset/settings catalog: header_ornaments.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/imud-fonts.json` — IMUD bundled asset/settings catalog: imud-fonts.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/ornaments_left_right.index.json` — Asset index for ornaments_left_right; catalog/lookup metadata.
- `red-build/ui/assets/imud/ornaments_left_right.json` — IMUD bundled asset/settings catalog: ornaments_left_right.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/ornaments_up_down.index.json` — Asset index for ornaments_up_down; catalog/lookup metadata.
- `red-build/ui/assets/imud/ornaments_up_down.json` — IMUD bundled asset/settings catalog: ornaments_up_down.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/section_dividers.index.json` — Asset index for section_dividers; catalog/lookup metadata.
- `red-build/ui/assets/imud/section_dividers.json` — IMUD bundled asset/settings catalog: section_dividers.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/shaar_back.index.json` — Asset index for shaar_back; catalog/lookup metadata.
- `red-build/ui/assets/imud/shaar_back.json` — IMUD bundled asset/settings catalog: shaar_back.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/shaar_main.index.json` — Asset index for shaar_main; catalog/lookup metadata.
- `red-build/ui/assets/imud/shaar_main.json` — IMUD bundled asset/settings catalog: shaar_main.json; asset or font metadata used at runtime.
- `red-build/ui/assets/imud/shaar_sub.index.json` — Asset index for shaar_sub; catalog/lookup metadata.
- `red-build/ui/assets/imud/shaar_sub.json` — IMUD bundled asset/settings catalog: shaar_sub.json; asset or font metadata used at runtime.

#### `red-build/ui/assets/imud/fonts/` — Font metadata/license note (font binaries excluded).

- `red-build/ui/assets/imud/fonts/OFL-EMBEDDED-FONTS.md` — Web UI bundled IMUD asset: OFL-EMBEDDED-FONTS.md; runtime resource (fonts excluded from this index).

#### `red-build/ui/assets/imud/setting_sets/` — Bundled setting presets.

- `red-build/ui/assets/imud/setting_sets/פרשנות.json` — Preset settings set: פרשנות.json; packaged style/settings profile.
- `red-build/ui/assets/imud/setting_sets/קונטרס.json` — Preset settings set: קונטרס.json; packaged style/settings profile.
- `red-build/ui/assets/imud/setting_sets/תלמוד.json` — Preset settings set: תלמוד.json; packaged style/settings profile.

### `scripts/` — Developer probes, diagnostics and capture utilities.

- `scripts/cutover-sample.js` — Developer/test script: cutover-sample.js; diagnostic, capture, patch or inspection utility.
- `scripts/diff-lines.py` — Developer/test script: diff-lines.py; diagnostic, capture, patch or inspection utility.
- `scripts/diff-lines2.py` — Developer/test script: diff-lines2.py; diagnostic, capture, patch or inspection utility.
- `scripts/diff-paras.py` — Developer/test script: diff-paras.py; diagnostic, capture, patch or inspection utility.
- `scripts/dump-page.js` — Developer/test script: dump-page.js; diagnostic, capture, patch or inspection utility.
- `scripts/fit-matrix.sh` — Developer/test script: fit-matrix.sh; diagnostic, capture, patch or inspection utility.
- `scripts/s711-endnote-proof.js` — Developer/test script: s711-endnote-proof.js; diagnostic, capture, patch or inspection utility.
- `scripts/s711-export-consistency-probe.js` — Developer/test script: s711-export-consistency-probe.js; diagnostic, capture, patch or inspection utility.

### `scripts-stage5/` — Historical Stage 5 patch utilities.

- `scripts-stage5/patch-dp-planner.py` — Historical Stage 5 patch/helper: patch-dp-planner.py; retained for provenance, not active plan unless explicitly adopted.
- `scripts-stage5/patch-modules.py` — Historical Stage 5 patch/helper: patch-modules.py; retained for provenance, not active plan unless explicitly adopted.

### `spec/` — Plans, requirements and contracts; spec/README.md establishes document authority.

- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` — Canonical active ten-stage completion plan; required reading before work.
- `spec/01_MASTER_SPECIFICATION.md` — Historical/functional master requirements; use for surviving requirements, not old execution order.
- `spec/02_MASTER_WORK_PLAN.md` — Historical integration/work plan; superseded execution sequence.
- `spec/03_UNIFIED_ITEM_CONTRACT.md` — Contract for unified items and layout behavior; architecture/reference for implementation.
- `spec/MONSTER_24_CHECKLIST.md` — Large verification checklist used to validate completeness and acceptance.
- `spec/README.md` — Authority map for specs; identifies active plan and superseded historical docs.
- `spec/Software_Requirements_Specification.md` — Requirements specification; functional and nonfunctional requirements reference.
- `spec/סיכום בקשות מAI.md` — Summary of AI/user requests and accumulated requirements; verify against explicit user decisions.
- `spec/תוכנית הפעלה לחמשת הסוכנים.md` — Earlier agent-split execution plan; historical, replaced by canonical plan.
- `spec/תכנית לשיפור תוכנת עימוד Red.MD` — Prior improvement plan; superseded as execution plan but important requirements and history.

### `tools/` — Developer tooling for audits, comparison, performance and Stage 9 migration.

- `tools/audit-note-anchors.js` — Developer utility: audit-note-anchors.js; generation, scanning, auditing, baseline or export helper.
- `tools/build-worker-bundle.js` — Developer utility: build-worker-bundle.js; generation, scanning, auditing, baseline or export helper.
- `tools/convert_imud_fonts.py` — Developer utility: convert_imud_fonts.py; generation, scanning, auditing, baseline or export helper.
- `tools/cross-check-locks.json` — Developer utility: cross-check-locks.json; generation, scanning, auditing, baseline or export helper.
- `tools/cross-check.js` — Developer utility: cross-check.js; generation, scanning, auditing, baseline or export helper.
- `tools/deps.js` — Developer utility: deps.js; generation, scanning, auditing, baseline or export helper.
- `tools/gen-ui-bindings.js` — Developer utility: gen-ui-bindings.js; generation, scanning, auditing, baseline or export helper.
- `tools/perf-baseline.js` — Developer utility: perf-baseline.js; generation, scanning, auditing, baseline or export helper.
- `tools/perf-slice6.js` — Developer utility: perf-slice6.js; generation, scanning, auditing, baseline or export helper.
- `tools/s4b-capture-baseline.js` — Developer utility: s4b-capture-baseline.js; generation, scanning, auditing, baseline or export helper.
- `tools/s5-capture-baseline.js` — Developer utility: s5-capture-baseline.js; generation, scanning, auditing, baseline or export helper.
- `tools/scan-control-triggers.js` — Developer utility: scan-control-triggers.js; generation, scanning, auditing, baseline or export helper.

#### `tools/layout-audit/` — Browser geometry, determinism and full-math audit tools.

- `tools/layout-audit/audit-in-page.js` — Layout-audit tool: audit-in-page.js; page geometry, determinism or full-math audit runner.
- `tools/layout-audit/determinism-sweep.js` — Layout-audit tool: determinism-sweep.js; page geometry, determinism or full-math audit runner.
- `tools/layout-audit/full-math-audit.js` — Layout-audit tool: full-math-audit.js; page geometry, determinism or full-math audit runner.
- `tools/layout-audit/run-full-math.js` — Layout-audit tool: run-full-math.js; page geometry, determinism or full-math audit runner.
- `tools/layout-audit/run.sh` — Layout-audit tool: run.sh; page geometry, determinism or full-math audit runner.

#### `tools/layout-parity/` — Historical reference/parity analysis tools, not current product acceptance target.

- `tools/layout-parity/analyze-divergence.py` — Historical layout comparison tool: analyze-divergence.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/bottoms.py` — Historical layout comparison tool: bottoms.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/compare.py` — Historical layout comparison tool: compare.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/drift.py` — Historical layout comparison tool: drift.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/extract-reference.py` — Historical layout comparison tool: extract-reference.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/inspect-page.py` — Historical layout comparison tool: inspect-page.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/README.md` — Historical layout comparison tool: README.md; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/run-ours.js` — Historical layout comparison tool: run-ours.js; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.
- `tools/layout-parity/verify-corpus.py` — Historical layout comparison tool: verify-corpus.py; reference/parity analysis. Keep in historical context; user cancelled parity to reference as product target.

#### `tools/stage9/` — Stage 9 migration/shadow/trace tools.

- `tools/stage9/check-surfaces.js` — Stage 9 migration/shadow tool: check-surfaces.js; comparison, trace or migration audit utility.
- `tools/stage9/compare-core.js` — Stage 9 migration/shadow tool: compare-core.js; comparison, trace or migration audit utility.
- `tools/stage9/diff-h7-grammar.js` — Stage 9 migration/shadow tool: diff-h7-grammar.js; comparison, trace or migration audit utility.
- `tools/stage9/shadow-compare.js` — Stage 9 migration/shadow tool: shadow-compare.js; comparison, trace or migration audit utility.
- `tools/stage9/trace-h7.js` — Stage 9 migration/shadow tool: trace-h7.js; comparison, trace or migration audit utility.
- `tools/stage9/trace-notes.js` — Stage 9 migration/shadow tool: trace-notes.js; comparison, trace or migration audit utility.

## Maintenance rule

For any added, removed, renamed or materially repurposed file, update this inventory. When updating documentation, distinguish **active**, **superseded**, **historical**, **evidence**, and **implementation**. Never label work complete merely because a plan, PR, conversation or test exists; verify live runtime path and evidence.
