# Production ShapedRun integration contract — RED engine
## 25.11.2026

## Status

**Design contract based on inspected production source and passing ICU4X→HarfBuzz POC. No production renderer or measurement code was changed in this commit.**

Proof baseline:
- Code HEAD tested by POC: `9e2d59d06a4eba208e5c4f69b65986651693be18`.
- Shaping run: `45504394154`.
- Artifact: `14972097998`.
- Detailed evidence: `ICU4X_HARFBUZZ_SHARED_SHAPING_POC_2026-11-25.md`.

The production review used the current files:
- `red-build/src/engine/line/line-items.js`
- `red-build/src/engine/typography/measure-api.js`
- `red-build/src/engine/line/line-model.js`
- `red-build/src/engine/core/materialize.js`
- `red-build/src/engine/output/pagemodel-dom-renderer.js`
- `red-build/src/engine/output/pdf-writer.js`
- `red-build/src/engine/typography/font-subset.js`

## 1. Verified current production data path

### 1.1 Input preparation and measurement

`line-items.js` currently owns a two-phase process:
1. `buildContainerSequence` calls `splitTextItem` and creates word boxes/fragments from source text/style runs.
2. `boxItemFor` calls the measurement API for each resulting word box. The result contains measured segments and advances that are used as the width source for line breaking.

This means shaping added only to a renderer would be too late: line breaking would already have used different widths. Conversely, changing only the measurement API would make the DOM/PDF continue shaping/mapping Unicode independently. Both sides must consume one stored shaping result.

The ordering also reveals an itemization requirement: paragraph Bidi/Script/grapheme resolution must occur before word splitting. Word splitting may project/slice an already-resolved run, but may not create a new grapheme boundary or discard embedding-level context. Inline style/font boundaries must be checked against extended grapheme boundaries; a boundary inside a combining cluster must be rejected or handled by a documented fallback policy, never split silently.

### 1.2 LineModel and materialization

`line-model.js` preserves the measured fragments and source metadata, including source range/anchor information. This is the strongest existing carrier for retaining source mapping while the line is broken and laid out.

`core/materialize.js` converts line-model fragments into positioned word entries and fragment positions used by the page model. It currently preserves textual fragments and their positions but does not carry a canonical glyph sequence through to the PageModel. The new data must be carried through this step, not reconstructed later from Unicode.

### 1.3 Output targets

- `pagemodel-dom-renderer.js::renderModelLine` positions a span for a word and places its Unicode text into the span. The browser performs shaping again after the model has fixed the position.
- `pdf-writer.js` uses the local `visualOrderRtl`/character-to-CID path and resolves CIDs from individual characters. Its ToUnicode construction assumes a single character per GID/CID.
- `font-subset.js` starts from Unicode characters and resolves GIDs through cmap. It does not yet accept a canonical set of shaped GIDs plus cluster/source mapping.

Therefore the current PageModel is geometrically shared but not typographically authoritative across renderers.

## 2. The single authoritative pipeline

The production architecture should be:

`SourceText + inline style/font runs`
→ paragraph `Bidi/Script/EGC itemization`
→ font resolution per complete grapheme
→ `ShapedRun/ShapedGlyph`
→ legal word/cluster slices for line breaking
→ line-edge reshaping and line visual order
→ `LineModel`
→ `PageModel`
→ DOM/HTML/PDF projections of the same glyph data.

There is one itemizer, one shaping implementation and one immutable shaped representation. No renderer may call a second shaping or text-width engine.

### Stage A — paragraph itemization before splitTextItem

Input is the complete logical paragraph (including spaces and format controls) plus inline style boundaries.

Output is a lossless UTF-16 source partition:
- shapeable runs: Script, language, direction, Bidi embedding level, grapheme range and font/style segment identity;
- non-shaping runs: Bidi_Control, unresolved/unsupported spans and other explicitly classified source tokens;
- grapheme records: EGC start/end, exact text and source scalar ranges.

Requirements:
- Use the verified Unicode 18 itemizer.
- Preserve logical order and all source UTF-16 positions.
- Resolve Bidi levels before coalescing shaping runs. Same Script/direction but different levels stay separate.
- Coalesce adjacent shapeable graphemes on Script + direction + Bidi level + resolved font/style/features; do not use per-grapheme diagnostic labels as shaping boundaries.
- Require style/font segmentation to align to EGC boundaries. Never split a base letter from its combining marks.
- Treat ZWJ/ZWNJ as shaping input, not as Bidi_Control.
- Bidi_Control affects paragraph resolution but is not passed to HarfBuzz as a glyph input.
- An unresolved Script/font/feature is explicit diagnostic data; do not guess a fallback and report success.

### Stage B — immutable ShapedRun / ShapedGlyph

A `ShapedRun` must contain at least:
- stable run ID and exact logical `sourceRange` in UTF-16;
- exact original source text (or an immutable source slice reference);
- font identity: source hash, normalized SFNT hash, face index, variation axes and instance identity;
- resolved Script, language, direction, Bidi level and explicit OpenType features;
- paragraph/line context flags (BOT/EOT) and itemization version;
- ordered `ShapedGlyph[]`;
- explicit source-to-cluster and cluster-to-glyph mappings.

Each `ShapedGlyph` must contain:
- original GID and post-subset CID mapping kept separately;
- HarfBuzz cluster in the paragraph's absolute UTF-16 coordinate space;
- source cluster range `[start,end)`, shared by every glyph belonging to the cluster;
- x/y advances and x/y offsets in font units (with the unitsPerEm/font scale recorded);
- font identity/variation instance reference;
- `controlBounds` and `inkBounds` as separate named fields;
- glyph flags and diagnostics (missing glyph, fallback, unsupported feature/axis);
- outline retrieval identity (font bytes + GID) or a validated outline payload.

Coordinates are not stored as renderer pixels. Pixel scaling happens once at the layout boundary using the selected font size and UPEM; renderers may transform the already-positioned glyph but may not measure or reshape it.

### Stage C — measurement and word-box projection

`MeasureAPI.measureItem` must become the canonical consumer of shaped runs:
- It obtains width by summing the glyph advances belonging to the selected cluster range, not by cmap/hmtx lookup per Unicode scalar.
- The returned measured segments retain references/slices of the immutable ShapedRun and cluster map.
- The existing word-box contract may keep `advancePx`, `fontId`, `fontFamily`, source offsets and style fragments for compatibility, but these fields are derived from the shaped result. They are not a second measurement source.
- `splitTextItem` may split only at a legal break opportunity that coincides with an EGC/cluster boundary. It projects the appropriate shaped glyph/cluster slices into each word box.
- Whitespace is not discarded: every source cluster, including the space between words, must belong to exactly one source slice or an explicit layout-space token. No gap may be inferred by losing shaped whitespace advances.
- A style/font transition that intersects one EGC is a hard diagnostic until an explicit policy is implemented.

The line breaker therefore receives word/fragment widths and break opportunities from the same shaping result that will be drawn.

### Stage D — line breaking, line-edge shaping and Bidi visual order

Paragraph-level shaping provides initial advances and legal cluster boundaries, but the final line is a distinct shaping context.

After a line break is chosen:
1. Resolve the line's visual run order from the paragraph Bidi levels using the shared UAX #9 implementation (including line-level rules). Do not use a renderer-local character reversal.
2. Re-shape the first/last affected ScriptRuns with the actual line BOT/EOT context. Interior runs retain context unless the shaping API requires an explicit line boundary.
3. Recompute the final line advance from the line-context shaping result.
4. Validate that the line still satisfies the width constraint and that no cluster was split. If reshaping changes fit, the line-breaking process must deterministically reconsider that boundary; it must not silently overflow or apply a local margin/scale patch.
5. Persist the final line-shaped records. Renderers never redo this work.

The algorithm and bounded convergence/reconsideration rule must be deterministic and tested for both LTR and RTL, mixed levels and ligatures. The paragraph POC does not yet prove this stage.

### Stage E — LineModel / PageModel

The LineModel should preserve:
- source paragraph/run identity and full logical UTF-16 coverage;
- logical shaping runs and visual run order;
- line-specific shaped glyph slices;
- line width derived from final glyph advances;
- source cluster ranges and word/fragment mapping;
- per-fragment baseline/position derived from advances and offsets.

Materialization should place those glyph slices into PageModel at absolute page coordinates. PageModel must contain the final glyph IDs/positions and a source-text extraction map. It must not turn the shaped result back into a Unicode string as the only renderable field.

Existing `sourceRange` and `sourceAnchor` are useful anchors. They should be strengthened to refer to cluster ranges rather than inventing a parallel mapping.

### Stage F — DOM / HTML / PDF

**DOM and standalone HTML**
- Replace browser-shaped `textContent` for shaped runs with drawing from the supplied GIDs and positions (validated SVG paths, a deterministic glyph raster/vector surface or another proven glyph-ID-capable renderer).
- Apply x/y advance and offsets from the PageModel. The browser may composite paths and apply transforms; it may not choose glyph substitutions, kerning, clusters or positions.
- The same renderer is used by live DOM and HTML export.

**PDF**
- Subsetting starts from the set of original shaped GIDs, closes composite dependencies and returns a stable old-GID→new-GID→CID map.
- PDF text positioning uses the shaped advances/offsets. No per-character cmap lookup and no local `visualOrderRtl` replacement path.
- ToUnicode must represent source clusters, including one glyph for multiple source code points and multiple glyphs for one source cluster. Use UTF-16BE destination strings where valid and ActualText marked content for cluster/run fidelity where a one-to-one CID map is insufficient.
- Preserve original logical source text for extraction while painting glyphs in visual order.
- Font bytes, variation instance and subset mapping must be identical to those used by shaping.

## 3. Single insertion point and migration order

The first production insertion point is **paragraph itemization attached to the TextItem before `buildContainerSequence/splitTextItem`**. This makes Script/Bidi/EGC context authoritative before word splitting.

The single canonical measurement boundary is **`boxItemFor → MeasureAPI.measureItem`**. It will accept shaped cluster slices and derive segment advances. It must not invoke an independent per-character measurement after shaping exists.

The carrier path is:
- split/word boxes carry shaped cluster slices from the paragraph result;
- LineModel stores those references plus line-context shaped results;
- materialization transfers final glyph positions to PageModel;
- DOM/HTML/PDF consume only PageModel shaped records.

A temporary dual-width comparison is allowed only in test/audit mode to detect regressions. It must not select between two production measurement paths or ship as a permanent fallback.

## 4. Acceptance gates before production cutover

1. **Itemization:** Unicode 18 grapheme/Bidi conformance; full UTF-16 source coverage; no split EGC; no loss of ZWJ/ZWNJ; Bidi_Control excluded from glyph input; mixed levels remain separate.
2. **Shaping:** Node/classic Worker parity for actual catalog fonts; explicit language/features/axes; complete glyph/cluster/source maps; no unknown clusters; all advances/offsets finite.
3. **Line breaking:** legal EGC cluster boundaries; deterministic word/fragment widths; line-edge BOT/EOT re-shape; no hidden renderer measurement; no overflow/widow regressions.
4. **Geometry:** separate control/ink bounds; CFF and quadratic glyf paths; correct accumulated advances/offsets and baseline transforms.
5. **DOM/HTML:** GID/position-driven rendering; zero browser shaping; exported HTML equals live DOM geometry and glyph order.
6. **PDF:** GID-based subsetting, stable CID map, shaped positions, full Hebrew extraction, ligatures/multi-glyph clusters, ActualText, visual order.
7. **Cross-target:** one PageModel produces equal line/word/glyph positions in DOM, HTML and PDF; raster and source-text extraction audits pass.

No CI threshold or existing lock may be lowered to pass these gates.

## 5. Decisions still open

- Whether glyph outlines are embedded per run or loaded by font-hash/GID in each renderer.
- Whether paragraph shaping can always be reused for interior words, or which shaping features require more granular boundary handling.
- Exact line-edge re-shaping convergence policy after BOT/EOT changes advance widths.
- PDF strategy for one-to-many/many-to-one cluster text extraction (ToUnicode plus ActualText policy).
- Explicit font fallback behavior for a grapheme unsupported by the selected family.
- Support matrix for variable, CFF/CFF2, glyf/quadratic and normalized WOFF2 inputs.

These remain open until proven with fixtures; no renderer-specific workaround is authorized.

## Source observations that motivated the contract

- `line-items.js`: `buildContainerSequence`, `splitTextItem`, `boxItemFor`; preparation currently splits before measurement.
- `line-model.js`: `lineItemOf` and its fragment/source metadata; suitable carrier, but no canonical GID/cluster list today.
- `measure-api.js`: per-scalar cmap/GID/advance and pair-kerning width path; must be replaced at the canonical measure boundary.
- `core/materialize.js`: word/fragment placement builds PageModel records from LineModel; shaped glyph slices must survive here.
- `pagemodel-dom-renderer.js`: current word spans pass Unicode text to browser shaping.
- `pdf-writer.js`: current visual-order and character-to-CID path.
- `font-subset.js`: current Unicode-to-cmap subsetting path.

