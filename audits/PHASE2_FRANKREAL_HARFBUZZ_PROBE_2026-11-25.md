# Phase 2 — FrankReal / HarfBuzz Production-Shaper Probe

**Date:** 2026-11-25  
**Repository:** SUGINACH/Tora_Book_Typesetter_Red_Work_2  
**Production/POC code baseline:** 28a077c68749e86b1eac3614836193a3726235a2  
**Documentation HEAD:** eef0b80ef4df08f21ed0da2bcc8d9496ed86b7c6  
**Workflow:** shaping-runtime-poc run 45705755555 — SUCCESS  
**Artifact:** 15064788616

## Runtime and general parity

HarfBuzzJS 1.6.4, HarfBuzz core 15.0.0 and Unicode 18.0.0 initialized in Node and a real classic Worker. Exact parity passed for 16 font instances, five standard cases per font and 659 glyph records. The shared itemizer preserved Hebrew Script runs, Bidi levels 1→3→1, excluded Bidi_Control spans from shaping, and retained UTF-16 source coverage and EGC-safe clusters.

## Exact FrankReal regression

The exact live-problem word is שְׁמַע, six code points, RTL, Script Hebr, UTF-16 source range [500,506), font FrankReal-Bold.ttf (FontResolver alias FrankReal), UPEM 2048. The source font hash is b90214b570d63f225282c4d3c3a5f023ad0d2d415043ae69926c0cc79ef2237a.

HarfBuzz returned six glyphs in visual RTL order:

| GID | Source cluster | Source range | Role | xAdvance | xOffset | yOffset |
|---:|---:|---|---|---:|---:|---:|
| 193 | 505 | [505,506) | Ayin | 972 | 0 | 0 |
| 163 | 503 | [503,505) | Patah | 0 | 0 | 0 |
| 189 | 503 | [503,505) | Mem | 1042 | 0 | 0 |
| 156 | 500 | [500,503) | Sheva | 0 | 0 | 0 |
| 172 | 500 | [500,503) | Shin dot | 0 | 0 | 0 |
| 200 | 500 | [500,503) | Shin | 1261 | 0 | 0 |

The three combining-mark advances sum to zero. Base-letter advances total 3275 units, which is 28.78417969pt at 18pt/UPEM 2048. The live HTML span was 28.79296875pt, a difference of 0.00879pt. The raw hmtx advances for those three marks are 1247+147+399=1793 units = 15.75878906pt at 18pt, explaining the previous PDF width excess of about 15.775pt.

## Production adapter check

The exact word passed through FontResolver → TextItemShapingPlan → HarfBuzzShaper → ShapedRun. Direct HarfBuzz and the production adapter matched every glyph's GID, cluster, xAdvance, yAdvance, xOffset and yOffset. Font source hashes matched, and the ShapedRun and glyph records were frozen/immutable.

This exact word run was in Node. The classic Worker passed the broader 16-font/659-glyph suite, but did not replay this exact six-codepoint word as a separate Worker case.

## WOFF2 limitation

HarfBuzzJS did not read four raw WOFF2 files directly: Ambivalenti-Regular.woff2, FrankBasic-1-regular.woff2, Mixtape-Bold.woff2 and Mixtape-Regular.woff2. The POC workflow normalized them using external fontTools/Brotli to deterministic SFNT bytes and then shaped those bytes. This is not a production browser Worker normalization path. Do not mass-convert, overwrite or silently substitute original user font files; production must normalize deterministically with identity/GID/outlines preserved or reject unsupported input explicitly.

## Production integration status

The isolated runtime and adapter are verified, but production is not integrated:
1. pipeline.js still does not consume env.typographyRuntime.
2. line-items.js still splits a TextItem into words before shaping.
3. LineModel/PageModel do not preserve authoritative glyph IDs, clusters, advances and offsets.
4. DOM/HTML use browser text shaping of Unicode textContent; PDF uses per-codepoint CIDs and raw subset hmtx widths.
5. The confirmed PDF mark-advance defect is therefore not fixed by this POC.

The required production direction is to shape the complete TextItem before any word splitting, preserve EGC/cluster boundaries and source ranges, measure from those same shaped advances, carry glyph slices through LineModel/PageModel, and make DOM/HTML/PDF project the same glyph identities and positions. Do not apply a PDF-only width patch, CSS offset or post-layout correction.

No red-build/src engine code, font, default, geometry, lock or main-branch content was modified by this POC.
