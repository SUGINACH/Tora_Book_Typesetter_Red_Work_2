# Phase 1 — Runtime Truth Snapshot (refreshed on current HEAD)

**Checked:** 2026-11-25 (Asia/Jerusalem)  
**Branch:** `engine/legacy-parity-preview-20261119`  
**Branch HEAD:** `bd5a6b76b07ef3adc4ba0f66309c522d83b826b5`  
**gh-pages HEAD:** `ab16c4f0c07f1e15749be13350b896dd18c90b3d`  
**Acceptance:** OPEN — browser execution evidence is still unavailable in this work session.

## Verification matrix

| Workflow | Run | Result | Scope / limitation |
|---|---:|---|---|
| CI | 45632270583 | **success** | Layout Audit; Node 18, 20, 22; 1,174 tests in each Node matrix; Determinism; Cross-check |
| Full Math Audit | 45632270620 | **success** | Local audit; live/browser part was skipped |
| Corpus Invariants | 45632270577 | **success** | Corpus invariants on this HEAD |
| Preview Engine Parity | 45632270612 | **success** | Builds full UI + Worker and stages Unified build to Pages |
| Pages build/deployment | 45632354037 | **success** | Pages branch deployment succeeded |

CI job details: `layout-audit`, `test (18)`, `test (20)`, `test (22)` all completed success. Each Node matrix's full test-suite step (1,174 tests / 72 suite files + scan-control-triggers), Determinism check and Cross-check succeeded.

## Deployed artifact identity (Git evidence, not browser evidence)

The deployed `gh-pages` branch points to `ab16c4f0c07f1e15749be13350b896dd18c90b3d`. Its `build-info.json` reports:
- `profile: unified`
- `branch: engine/legacy-parity-preview-20261119`
- `commit: bd5a6b76b07ef3adc4ba0f66309c522d83b826b5`
- `builtAt: 2026-11-25T14:16:57Z`
- `mode: direct-gh-pages-deploy-no-main-merge`

The source build and deployed root/preview share the same Git blob SHAs for the following files:

| File | Blob SHA |
|---|---|
| index.html | `b9a093064c7cf5289de78692fb21802bddc851d1` |
| styles.css | `250851a717e5f62e7147cd7401bae07a8e21621b` |
| app.bundle.js | `c8a0b66e6f3db9c94f58392e86b3cdc386ebba47` |
| engine-worker.bundle.js | `5ed2ff006e8f8f1f3d10b70240e4955fe54c71ee` |

This proves that the Git files deployed at the Pages branch correspond to the source build and that root and `previews/engine-parity/` contain the same app/worker artifacts. It does **not** prove that the public HTTP/CDN cache serves those exact bytes or that a browser successfully loads/runs them.

## Source-code dispatch audit

- `red-build/src/ui/browser-entry.js` sets `BRANCH_ENGINE_PROFILE = 'unified'` and passes it to `createApp`.
- `red-build/src/ui/app-shell.js` injects `_engine-force-unified = true` into the app settings. A result marked `legacyProfile` or missing a valid PageModel is surfaced as an error in this branch; there is no silent app-shell fallback.
- `red-build/src/engine/core/pipeline.js` still contains the generic legacy dispatch for callers without the force flag. Therefore source-level routing strongly indicates that the Pages app is configured to select Unified, but the zero-legacy-call claim is not yet proven by a running browser trace.

## Explicitly NOT verified

- Public Pages URL loaded in a real browser with no query parameter.
- HTTP/CDN cache, MIME, 404s, Worker initialization, WASM/network loading and browser console.
- Paste/import, typeset, setting changes, TOC behavior, editor↔preview navigation, HTML export and PDF export in the live UI.
- Runtime call trace proving zero calls to `legacyTypeset`, `legacy-imud-flow`, or other legacy layout paths.
- DOM/HTML/PDF visual parity using the same live document and settings.

The current execution environment did not provide a browser runtime capable of performing those checks. Do not infer success from the workflow, Git branch, build-info file or matching blob hashes.

## Shaping remains a production blocker

At this HEAD, Unicode 18 + HarfBuzz runtime is loaded and required in a real Worker, and the Node↔classic Worker POC is successful. But `env.typographyRuntime` is passed into `typeset` and the production pipeline does not yet consume it to construct ShapedRun records. `line-items.js` splits text into word boxes before shaping; `measure-api.js` measures strings/characters through historical metrics; LineModel/PageModel do not preserve authoritative shaped glyph positions; the DOM renderer emits Unicode textContent for browser shaping; PDF export derives glyph/CID mappings per character. The POC/runtime is not production Shaping integration.

## Status

- Automated CI and corpus/math gates: **PASS** on `bd5a6b76b07ef3adc4ba0f66309c522d83b826b5`.
- Git deployment artifact identity: **PASS** on `ab16c4f0c07f1e15749be13350b896dd18c90b3d`.
- Source-level Unified dispatch: **verified in source**, runtime not independently traced.
- Browser E2E / zero-legacy runtime proof: **NOT VERIFIED**.
- DOM/HTML/PDF output correctness and parity: **NOT VERIFIED**; known shaping architecture gap remains.
- Phase 1 acceptance gate: **OPEN**. Do not declare final acceptance or claim production Shaping complete.
