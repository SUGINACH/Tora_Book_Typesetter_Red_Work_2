# Project Engineering & Architecture Rules

This project is a JavaScript typesetting engine built from scratch with a large, multi-layered configuration system. Every session MUST follow these mandatory workflows and load the corresponding skills from `.claude/skills/`.

## 1. Mandatory Architectural Discipline
- **Before modifying code or adding features:** Apply `decoupled-config-architecture` and `codebase-impact`.
  - Keep **style/layout definitions** strictly separate from **text identifier mappings** (two-file separation).
  - Engine functions MUST remain blind to raw text identifiers (`"כותרת 2 - "`) and style names (`"A1"`); operate strictly on resolved property objects.
  - Support both absolute and relative/contextual properties (e.g., `-2pt` relative font size for inline parenthesized text) through the central resolver.
  - **Never** bypass the settings panel with hardcoded fallbacks during bug fixes.
- **When fixing bugs:** Apply `systematic-debugging` to isolate the root cause before editing.
- **Before finishing any task:** Apply `self-code-review` to verify end-to-end wiring, dead code removal, and performance.

## 2. Two-Tier PDF Verification Workflow (`deep-typesetting-inspector`)
Never export or inspect the entire book during iterative work unless explicitly requested. Use the two-tier inspection mode:
1. **Targeted Page Inspection (During Active Fixes):**
   - When fixing an issue affecting a specific layout type or page (e.g., title page, footnotes, side titles, chapter headers), export and inspect **ONLY that target page or minimal test fixture** (e.g., `--pages 1` or `--fixture title-page`).
   - Run `deep-typesetting-inspector` in **Targeted Mode** until that specific page reports zero geometric or typographic anomalies.
2. **Full-Book Regression Audit (End of Session / Milestone):**
   - After completing a batch of multiple fixes or structural changes, run `deep-typesetting-inspector` in **Full-Book Mode** across all pages to catch cross-page spillover or unintended regressions.
