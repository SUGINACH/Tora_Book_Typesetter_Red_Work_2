# Bidi runtime POC — Unicode 18.0.0 + UTF-16 + classic Worker (24.11.2026)

## Result

**Passed.** The proof uses `servo/unicode-bidi` 0.3.18 at pinned source
revision `9a8c7b03be01def5cf7014b89d5af90f7382fdad`, regenerated against
the official Unicode 18.0.0 UCD data.

- RED branch code commit: `96e357e74ac625f47bdb5844b8f2e310ec24b09f`
- Workflow run: `45480673152`
- Artifact: `14962026789`
- Runtime: Node `v22.23.5` and a browser classic Worker
- WASM module: 76,258 bytes
- Unicode data reported by the compiled module: `18.0.0`

## Unicode 18 data provenance and regeneration

The POC uses the versioned official sources:

- [DerivedBidiClass.txt — Unicode 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/extracted/DerivedBidiClass.txt)
- [BidiTest.txt — Unicode 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/BidiTest.txt)
- [BidiCharacterTest.txt — Unicode 18.0.0](https://www.unicode.org/Public/18.0.0/ucd/BidiCharacterTest.txt)

The preparation script downloads the versioned data in a disposable checkout,
checks the exact `DerivedBidiClass-18.0.0.txt` header, regenerates the
`unicode-bidi` tables, and verifies the generated `UNICODE_VERSION` tuple is
`(18, 0, 0)`. It also verifies that both official conformance files exist and
are non-empty.

The pinned upstream crate's internal `char_data::tests::test_bmp` still had
six sample expectations for noncharacters as `L`. Unicode 18 explicitly
classifies the ranges `FDD0..FDEF` and `FFFE..FFFF` as `BN`. In the temporary
checkout only, the preparation script updates the six existing sample
assertions (U+FDD0, U+FDD1, U+FDEE, U+FDEF, U+FFFE, U+FFFF) from `L` to `BN`.
The production crate source and RED engine are not modified by this step.
The official `BidiTest.txt` and `BidiCharacterTest.txt` conformance files are
not edited or filtered.

## Conformance and build results

| Gate | Result |
|---|---:|
| `unicode-bidi` library unit tests | 39/39 passed |
| Official Unicode 18 `BidiTest` / `BidiCharacterTest` integration tests | 4/4 passed |
| Upstream documentation tests | 3/3 passed |
| wasm32 wrapper build | passed |
| Browser classic Worker run | passed |
| Node / classic Worker JSON parity | byte-identical |

The four integration tests include the official basic Bidi conformance corpus
and the official character-level conformance corpus. Neither file is modified
by the POC.

## UTF-16 contract probes

- `A😀B` has four UTF-16 code units. The WASM levels array has length four.
- A line range `[1,3)` isolates the supplementary-plane emoji and remains
  valid; the returned visual run is exactly `[1,3)`.
- A line range beginning at offset 2 (inside the surrogate pair) is rejected.
- Unpaired high and low surrogates are rejected before crossing the WASM ABI.
- An empty document returns zero levels and zero paragraphs.
- An empty line inside non-empty text and an empty line in an empty document
  return zero runs without calling the upstream line reordering code on an
  empty level slice.

## Mixed-direction fixture corpus

Ten fixture texts produced:

- 13 paragraphs
- 44 logical embedding-level runs
- 37 line-level visual-run probes (whole paragraph and synthetic wrap probes)
- all returned paragraph and visual-run source ranges covered their complete
  requested UTF-16 ranges without overlap or gap
- every run's direction matched embedding-level parity

Fixtures cover Hebrew with Latin and numbers, LTR with Hebrew, nested isolates,
punctuation and paired brackets, emoji/supplementary characters, Arabic with
Latin and Arabic digits, CRLF/LF paragraph separators, neutral characters, and
forced LTR/RTL paragraph base directions.

Additional contract probes passed:

- auto paragraph direction: Hebrew-first -> RTL level 1; Latin-first -> LTR level 0
- forced LTR and forced RTL paragraph base levels
- UAX #9 L1 reset of trailing whitespace to the paragraph embedding level
- empty document and empty line handling
- malformed UTF-16 and surrogate-boundary rejection

## Node / classic Worker parity

Node reference output SHA-256:

`cb2704eaeacde8aede3ceb7b33cae982767e9897137ded04b829a5c62c1bd24c`

Browser classic Worker output SHA-256:

`cb2704eaeacde8aede3ceb7b33cae982767e9897137ded04b829a5c62c1bd24c`

`exactNodeParity=true`. The output includes Unicode version, UTF-16 levels,
paragraph ranges, logical embedding runs, line-specific levels and visual runs.

## Architectural boundary — what this proves and what it does not

This POC proves that one pinned Unicode 18 Bidi engine can run through a
WASM wrapper and return deterministic UTF-16 paragraph/line runs identically
in Node and a browser classic Worker. It is a candidate for the shared Bidi
source of truth in RED.

It does **not** complete production integration:

1. The POC creates logical runs by embedding level only. Script, language,
   font, feature and grapheme fallback itemization still need a single shared
   layer before HarfBuzz shaping.
2. The upstream `visual_runs` path performs line-level L1 and L2 reordering.
   It does not perform L3 combining-mark sequence handling or L4 mirrored
   character/glyph resolution. These must be coordinated with grapheme
   segmentation and shaping; mirrored glyph selection must happen before
   shaping/measurement, not as a post-measure text substitution.
3. Line-wrap probes use selected synthetic split points. They verify UAX #9
   line-level reordering behavior, not integration with RED's actual line
   breaker or reshape-at-line-boundary behavior.
4. No ShapedRun is yet passed to LineItem, LineModel, PageModel, DOM/HTML or
   PDF. There is no renderer parity proof and no production dependency on
   this WASM module.
5. The POC does not replace the separate Bézier ink-bounds work or the
   unresolved WOFF2 normalization, font fallback and PDF GID subsetting work.

**Status:** Bidi runtime candidate proof passed; `TYP-SHAPING-01` remains open
until the shared paragraph-itemization and shaped-glyph contract is integrated
through every output target and tested end-to-end.
