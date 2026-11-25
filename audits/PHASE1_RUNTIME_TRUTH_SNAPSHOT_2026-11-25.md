# Phase 1 — Runtime Truth Snapshot (partial; acceptance blocked)

**Checked:** 2026-11-25 16:14 Israel time  
**Branch:** `engine/legacy-parity-preview-20261119`  
**Branch HEAD verified via GitHub Branch API:** `98e04f2e94d7770278a8972e0e62c250972fc63c`  
**Commit:** docs: label evidence snapshot separately from current map revision  
**Scope:** Read-only baseline verification only. No code changes, browser E2E, or runtime trace performed.

## Verified facts

- The required branch exists and points to the exact SHA above.
- Current branch CI run `45618395493` completed **success** at 13:08Z on this SHA. Jobs verified through the jobs endpoint: Layout Audit, Node 18, Node 20, Node 22 all completed success.
- Current branch Preview Engine Parity run `45618395214` completed success.
- Current branch Corpus Invariants run `45618395484` completed success.
- Current branch Full Math Audit run `45618395357` completed success.
- CI jobs on HEAD: `layout-audit`, `test (22)`, `test (20)`, `test (18)`, all success.
- The `gh-pages` branch currently points to `c0054a6d63c12ebf960a25d92d281dc198627ddd`.
- The deployed `gh-pages/build-info.json` content reports profile `unified`, source branch `engine/legacy-parity-preview-20261119`, source commit `98e04f2e94d7770278a8972e0e62c250972fc63c`, built at `2026-11-25T12:55:38Z`, direct gh-pages deployment (no main merge).
- GitHub Contents API blob SHA comparison: `index.html` at gh-pages and `red-build/ui/index.html` on the source branch are identical (blob `b9a093064c7cf5289de78692fb21802bddc851d1`). App bundle and worker bundle blobs also match across root gh-pages and red-build/ui: app `c8a0b66e6f3db9c94f58392e86b3cdc386ebba47`; worker `5ed2ff006f8e8f1f3d10b70240e4955fe54c71ee`. Contents API reports zero text length for these binary bundles; the SHA equality is the evidence.
- Open PRs are present, but none targets this branch: #70, #65, #17, #16, #14 target main. No merge or branch mutation was performed.
- Phase 1 prompt exists and is current on the branch (blob `ec70a425e3c231ef05d37c6638525c2d508e5575`).

## Important limitations / not yet proven

- I could not inspect the live site through a real browser in this session. The web fetch of Pages root and build-info failed; therefore browser runtime behavior, UI interaction, Worker/network trace, console errors, export behavior, and the **zero legacy calls runtime proof are NOT VERIFIED**.
- The build-info file on gh-pages is Git content, not an independent HTTP response; it is not proof that CDN cache is serving that exact version.
- Matching Git blobs establish source/deployed branch file identity, but not successful runtime loading, correct MIME/cache behavior, or actual rendering.
- The HTML requirements map currently contains evidence and baseline labels from older commits (including `be54c8b`, `5b99f5e`, and old gh-pages SHAs). These must be refreshed/reconciled against the current HEAD before treating its evidence labels as current. The map is not yet reconciled in this snapshot.
- The full source reconciliation (all 20 historical request topics, uploaded/library files, audits, settings/text-ID catalog) has not been completed in this Phase 1 session.
- No file changes to application code, no bundle rebuild, no tests run locally, and no commits beyond this audit report.

## Phase 1 status

**Baseline source/deployment identity: PARTIALLY VERIFIED.**  
**Browser runtime/zero-legacy proof: BLOCKED (browser execution unavailable).**  
**Historical source reconciliation: NOT STARTED/INCOMPLETE.**  
**Phase 1 acceptance gate: OPEN. Do not proceed to Phase 2.**

## Next required actions

1. Reconcile and refresh the requirements-map evidence snapshot with this HEAD and deployment SHA.
2. Review deployment workflow and Pages run history/provenance, including the deployed files and cache strategy.
3. Build a reproducible browser E2E/runtime-trace workflow and run it against the root Pages URL, or keep acceptance blocked if execution cannot be obtained.
4. Complete source inventory and the 20-topic coverage matrix, including uploaded/library materials.
5. Audit settings and Text IDs against current code and decide/document findings (do not alter defaults or user decisions).
6. Commit all Phase 1 reports and map updates together when sufficiently reconciled; run CI on the audit update.
