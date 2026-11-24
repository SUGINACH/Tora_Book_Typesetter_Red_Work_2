# Iteration 007 — Renderer / shaping contract audit

**Audited branch:** `engine/legacy-parity-preview-20261119`  
**Code snapshot:** `77d5a71d5bd03dc74cc411604febc5c3ab9d5e09`  
**Scope:** unified PageModel path; this is a static source audit, not yet a raster acceptance run.

## 1. Finding: one PageModel does not yet mean one glyph layout

The architecture correctly routes unified preview and HTML/PDF exports from PageModel. The remaining mismatch is below the page geometry layer: the model stores positioned words, not the final shaped glyph sequence.

### DOM projection

In `red-build/src/engine/output/pagemodel-dom-renderer.js`, `renderModelLine`:
- creates an absolutely positioned `.line` from `ml.x/y/w/h`;
- iterates `ml.words`;
- creates one absolutely positioned `.w` span per word at `wd.x`;
- sets `span.style.fontFamily` from `wd.fontKey`;
- assigns `span.textContent = scrubPUAText(wd.text)`.

This correctly prevents CSS wrapping/reflow from deciding line positions, but the browser still performs glyph shaping, mark attachment, fallback and bidi handling inside each text span. The projector does not consume glyph IDs, clusters, per-glyph advances or offsets from the PageModel.

### HTML projection

In unified mode, `exportHtmlFromModel` loops over the same `model.pages` and calls `renderModelPage`. Therefore HTML shares the DOM text-shaping behavior; it does not embed a shaped glyph-run contract of its own.

### PDF projection

In `red-build/src/engine/output/pdf-writer.js`, `emitWord`:
- accepts the original Unicode word string;
- calls custom `visualOrderRtl(chars)`;
- resolves each code point independently with `font.cidOf(ch)`;
- emits a sequence of CIDs at a word origin using PDF text operators.

`visualOrderRtl` is a custom heuristic: it divides characters using `/[0-9A-Za-z]/`, preserves LTR runs, reverses RTL runs and mirrors brackets. It is not the same operation as OpenType shaping. The writer does not receive a shaped glyph ID/cluster/offset sequence from the layout model. The current subset API is also character-inventory based (`charInventory` then `buildSubset`), rather than shaped-glyph-ID based.

### Measurement

The runtime `font-metrics` path reads nominal cmap/advance metrics and a subset of positioning information. It is not a complete OpenType shaping authority for all GSUB/GPOS combinations, especially mark positioning and complex fallback runs. Therefore the measurement stage, browser shaping and PDF character mapping can disagree even where each word's left coordinate is shared.

## 2. Consequences

The present PageModel is a common **word-box geometry** source, not yet a common **typographic ink** source.

A word can have the same model x-coordinate while its visible glyph bounds differ between browser and PDF because:
- substitutions/ligatures can change glyph count;
- combining marks may need GPOS attachment and zero-advance placement;
- glyph advances/offsets can differ from simple cmap/hmtx lookup;
- browser and PDF can choose different fallback faces;
- a per-codepoint PDF mapping cannot reproduce a shaped glyph sequence merely by reversing character order.

This directly explains why DOM/HTML can appear substantially different from PDF without a second pagination pass.

## 3. Required target contract

Introduce one immutable shaped-run record, produced before line breaking is finalized and consumed unchanged by the PageModel and all renderers.

Suggested logical contract (field names are illustrative; do not create duplicate competing types):

```ts
type ShapedGlyph = {
  gid: number;
  clusterStart: number;
  clusterEnd: number;
  advanceX: number;
  advanceY: number;
  offsetX: number;
  offsetY: number;
  inkBounds?: { xMin: number; yMin: number; xMax: number; yMax: number };
};

type ShapedRun = {
  fontId: string;                 // content-addressed source/instance identity
  variationAxes: Record<string, number>;
  direction: "rtl" | "ltr";
  script: string;
  language: string;
  features: Array<{ tag: string; value: number }>;
  sourceStart: number;
  sourceEnd: number;
  glyphs: ShapedGlyph[];
};
```

The line retains original logical text and source ranges for editing, search, copy, accessibility and PDF text extraction. The shaped glyph sequence is the sole authority for ink positions.

### Shaping and line-breaking interaction

- Segment source text by Unicode script, direction, language, font and explicit fallback before shaping.
- Use cluster boundaries and legal Unicode break opportunities; never split a shaped cluster.
- Shape candidate lines with correct beginning/end-of-line context. Do not assume paragraph-wide shaping is always reusable unchanged after line breaks.
- Store final per-line shaped runs and baseline/line geometry in LineModel.
- The planner consumes their actual advances and ink extents. There is no renderer-side reshaping or independent width estimate.
- Font variation coordinates, OpenType features and font fallback are part of the run identity and cache key.

## 4. Projection strategy

The renderer must not receive raw text and independently rediscover glyph shaping.

- **DOM and standalone HTML:** render the positioned glyph outlines from the shared shaped runs (SVG paths or an equivalently deterministic outline layer). Keep a separate semantic/accessibility text representation that does not participate in visual layout. Do not use CSS shaping as the visible source of glyph ink.
- **PDF:** subset by shaped GIDs, not only Unicode code points; emit those GIDs at the exact shaped positions, including offsets and advances. Build ToUnicode/ActualText mappings from clusters so copy/search/extraction preserves the original logical text. Continue embedding the same font instance identified by `fontId`.
- **All renderers:** use the same model positions, units, baselines, transforms, font identity, variation coordinates, glyph IDs and z-order. No measurement, wrapping, fallback or x/y adjustment in any projector.

An alternative native-text implementation is acceptable only if it proves the same glyph IDs, clusters, positions and ink bounds as the shaped model; relying on browser-specific shaping alone is not sufficient.

## 5. Proof gates before replacing current rendering

1. Unit tests for Hebrew base letters + niqqud + cantillation, including mark-to-base/mark-to-mark positioning.
2. GSUB/GPOS tests with representative project fonts; compare HarfBuzz output and the glyphs actually drawn.
3. Mixed Hebrew/Latin/numbers, all parentheses/brackets, punctuation, ligatures, missing-glyph fallback and cluster-safe breaks.
4. Same serialized shaped-run hash in Node Worker, browser Worker, preview, HTML and PDF.
5. Geometry test: every drawn glyph origin equals the model origin plus its shaped offset; cumulative advances equal the line's planned width.
6. PDF subset test: all referenced GIDs exist in subset; composite outlines and ToUnicode cluster mappings survive; extracted text equals original logical text.
7. Visual overlay: DOM raster vs HTML raster vs PDF raster at identical physical dimensions and DPI, with ink-mask diff and per-glyph diagnostics.
8. Full-book regression after the line model changes; do not refresh pagination locks before all font and shaping changes are integrated.

## 6. Architectural decision

Do **not** patch `renderModelLine` or `emitWord` separately to imitate each other. Do not alter word x-coordinates or add renderer-specific letter spacing. The root fix belongs in the single typography/shaping contract and its LineModel/PageModel representation.

The current PageModel architecture is worth preserving; its text payload must be upgraded from text-only word fragments to shaped glyph runs. The project remains short of DOM/PDF/HTML ink parity until this contract is implemented and proven.
