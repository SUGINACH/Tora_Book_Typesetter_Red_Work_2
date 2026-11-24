#!/usr/bin/env python3
"""Representative conversion proof for the current PDF TrueType subset path.

This is deliberately a pilot. It never rewrites repository font assets. It
decodes WOFF2, pins variable fonts at their explicit default axis coordinates,
converts CFF outlines to quadratic glyf outlines with a bounded cu2qu error,
then validates the generated SFNT through both FontTools and the production
JavaScript font parser/subsetter.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.basePen import DecomposingPen
from fontTools.pens.filterPen import FilterPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.ttLib import TTFont, newTable
from fontTools.varLib.instancer import instantiateVariableFont

SAMPLES = [
    ("red-build/ui/assets/imud/fonts/Abir-Black.woff2", "woff2-glyf-hebrew"),
    ("red-build/ui/assets/imud/fonts/Afek-Regular.woff2", "woff2-cff-hebrew"),
    ("red-build/ui/assets/imud/fonts/Artzi-Regular.ttf", "sfnt-cff-hebrew"),
    ("red-build/ui/assets/imud/fonts/FrankRuhlLibre-VF.ttf", "variable-sfnt-hebrew"),
    ("red-build/ui/assets/imud/fonts/Shmaltz-1-Con-regular.woff2", "variable-woff2-hebrew"),
    ("red-build/ui/assets/imud/fonts/YitzhakNavon-DropCaps-Regular.ttf", "partial-hebrew-decorative"),
    ("red-build/ui/assets/imud/fonts/Antquai-Italic.woff2", "latin-only"),
]
HEBREW_LETTERS = "".join(chr(cp) for cp in range(0x05D0, 0x05EB))
HEBREW_MARKS = set(range(0x0591, 0x05C8))
MAX_ERR_EM = 0.001


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def glyph_bounds(font: TTFont, *, prefer_cff: bool = True) -> dict[str, tuple[float, float, float, float] | None]:
    """Bounds through FontTools' generic GlyphSet (includes glyf LSB alignment)."""
    glyph_set = font.getGlyphSet(preferCFF=prefer_cff)
    result = {}
    for name in font.getGlyphOrder():
        pen = BoundsPen(glyph_set)
        glyph_set[name].draw(pen)
        result[name] = pen.bounds
    return result


class _RawGlyfGlyph:
    def __init__(self, glyf_table, name: str):
        self.glyf_table = glyf_table
        self.name = name

    def draw(self, pen) -> None:
        self.glyf_table[self.name].draw(pen, self.glyf_table, 0)


class _RawGlyfGlyphSet:
    def __init__(self, glyf_table):
        self.glyf_table = glyf_table

    def __getitem__(self, name: str) -> _RawGlyfGlyph:
        return _RawGlyfGlyph(self.glyf_table, name)


def raw_glyf_bounds(font: TTFont) -> dict[str, tuple[float, float, float, float] | None]:
    """Measure stored TrueType contours directly, without GlyphSet's LSB translation."""
    if "glyf" not in font:
        raise ValueError("raw glyf bounds require a glyf table")
    glyf = font["glyf"]
    raw_set = _RawGlyfGlyphSet(glyf)
    result = {}
    for name in font.getGlyphOrder():
        pen = BoundsPen(raw_set)
        raw_set[name].draw(pen)
        result[name] = pen.bounds
    return result


def reconcile_cff_metrics_for_glyf(
    font: TTFont,
    source_bounds: dict[str, tuple[float, float, float, float] | None],
    source_metrics: dict[str, tuple[int, int]],
) -> dict[str, Any]:
    """Map CFF left phantom points to TrueType control-box coordinates.

    A CFF bound is the curve bound; a glyf header xMin is the minimum of all
    on/off-curve points and can be outside the visible curve. Preserve
    pp1 = xMin - lsb (and advanceWidth), rather than blindly copying a CFF
    LSB into the newly-created glyf font.
    """
    if "glyf" not in font or "hmtx" not in font:
        raise ValueError("CFF metric reconciliation requires glyf and hmtx tables")
    changed = 0
    max_adjustment = 0
    max_source_phantom_magnitude = 0.0
    max_phantom_error = 0.0
    empty_count = 0
    for name in font.getGlyphOrder():
        glyph = font["glyf"][name]
        advance, source_lsb = source_metrics[name]
        source_bbox = source_bounds.get(name)
        has_contours = bool(glyph.isComposite() or getattr(glyph, "numberOfContours", 0) > 0)
        if not has_contours or source_bbox is None:
            target_lsb = 0
            if has_contours != (source_bbox is not None):
                raise ValueError(f"CFF/glyf empty-outline classification changed for {name}")
            empty_count += 1
        else:
            source_pp1 = float(source_bbox[0]) - float(source_lsb)
            max_source_phantom_magnitude = max(max_source_phantom_magnitude, abs(source_pp1))
            if abs(source_pp1) > 0.500001:
                raise ValueError(
                    f"CFF curve xMin and hmtx LSB disagree by {source_pp1:.6f} units for {name}; "
                    "refusing to hide a source placement discrepancy in the CFF-to-glyf conversion"
                )
            # CFF outlines are already drawn in the glyph-origin coordinate
            # system. Match that origin in glyf by setting LSB to the TrueType
            # control-box xMin (the standard OTF-to-TTF mapping). The source
            # CFF pp1 is expected to be zero within integer-metric rounding.
            target_lsb = int(glyph.xMin)
            output_pp1 = float(glyph.xMin) - float(target_lsb)
            phantom_error = abs(output_pp1 - source_pp1)
            max_phantom_error = max(max_phantom_error, phantom_error)
            if phantom_error > 0.500001:
                raise ValueError(
                    f"left phantom-point remap exceeds integer rounding bound for {name}: {phantom_error}"
                )
        if not -32768 <= target_lsb <= 32767:
            raise ValueError(f"remapped LSB outside signed FWORD range for {name}: {target_lsb}")
        font["hmtx"].metrics[name] = (int(advance), int(target_lsb))
        adjustment = abs(int(target_lsb) - int(source_lsb))
        if adjustment:
            changed += 1
            max_adjustment = max(max_adjustment, adjustment)

    # hhea stores aggregate horizontal metrics derived from glyf bounds and
    # hmtx. Recompute it after changing LSBs; leaving stale CFF-era values
    # would make the new SFNT internally inconsistent.
    font["hhea"].recalc(font)
    hhea_fields = {
        "advanceWidthMax": (0, 65535),
        "minLeftSideBearing": (-32768, 32767),
        "minRightSideBearing": (-32768, 32767),
        "xMaxExtent": (-32768, 32767),
    }
    for field, (minimum, maximum) in hhea_fields.items():
        value = int(getattr(font["hhea"], field))
        if not minimum <= value <= maximum:
            raise ValueError(f"hhea.{field} outside OpenType field range: {value}")

    # head's global bounding box must enclose the newly materialized glyf
    # outlines. Recalculate every glyph (including composite bounds), then
    # derive the global extrema from non-empty glyphs.
    glyf = font["glyf"]
    nonempty_bounds = []
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if glyph.numberOfContours != 0:
            glyph.recalcBounds(glyf)
            if hasattr(glyph, "xMin"):
                nonempty_bounds.append((glyph.xMin, glyph.yMin, glyph.xMax, glyph.yMax))
    if nonempty_bounds:
        font["head"].xMin = min(b[0] for b in nonempty_bounds)
        font["head"].yMin = min(b[1] for b in nonempty_bounds)
        font["head"].xMax = max(b[2] for b in nonempty_bounds)
        font["head"].yMax = max(b[3] for b in nonempty_bounds)
    else:
        font["head"].xMin = font["head"].yMin = 0
        font["head"].xMax = font["head"].yMax = 0
    for field in ("xMin", "yMin", "xMax", "yMax"):
        value = int(getattr(font["head"], field))
        if not -32768 <= value <= 32767:
            raise ValueError(f"head.{field} outside signed FWORD range: {value}")

    return {
        "glyphCount": len(font.getGlyphOrder()),
        "lsbChangedGlyphCount": changed,
        "emptyGlyphCount": empty_count,
        "maxAbsoluteLsbAdjustmentFontUnits": max_adjustment,
        "maxSourceLeftPhantomPointMagnitudeFontUnits": max_source_phantom_magnitude,
        "maxLeftPhantomPointDeltaFontUnits": max_phantom_error,
        "preservedAdvanceWidths": True,
        "hheaSummary": {
            "advanceWidthMax": int(font["hhea"].advanceWidthMax),
            "minLeftSideBearing": int(font["hhea"].minLeftSideBearing),
            "minRightSideBearing": int(font["hhea"].minRightSideBearing),
            "xMaxExtent": int(font["hhea"].xMaxExtent),
        },
        "headGlobalBounds": [
            int(font["head"].xMin), int(font["head"].yMin),
            int(font["head"].xMax), int(font["head"].yMax),
        ],
    }


def convert_cff_to_glyf(font: TTFont, max_err: float) -> dict[str, Any]:
    if "CFF " not in font:
        return {"maxBoundsDeltaFontUnits": 0.0, "worstGlyph": None}
    if "CFF2" in font:
        raise ValueError("CFF2 conversion is not included in this proof; variable axes must be instantiated first")

    names = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()
    before = glyph_bounds(font, prefer_cff=True)
    source_metrics = {
        name: (int(font["hmtx"].metrics[name][0]), int(font["hmtx"].metrics[name][1]))
        for name in names
    }
    glyphs = {}
    for name in names:
        pen = TTGlyphPen(glyph_set)
        converter = Cu2QuPen(
            pen,
            max_err=max_err,
            reverse_direction=False,
            all_quadratic=True,
        )
        glyph_set[name].draw(converter)
        glyphs[name] = pen.glyph()

    glyf = newTable("glyf")
    glyf.glyphs = glyphs
    glyf.setGlyphOrder(names)
    for name in names:
        glyf[name].recalcBounds(glyf)
    font["glyf"] = glyf
    font["loca"] = newTable("loca")
    font.sfntVersion = "\x00\x01\x00\x00"
    font["head"].indexToLocFormat = 1
    # CFF OTFs commonly use post 3.0, which has no stored glyph-name array.
    # FontTools may synthesize different glyph *names* from cmap after save;
    # numeric GIDs remain stable. GID identity, not glyph-name spelling, is
    # the contract for the converted outlines and PDF subset.
    if "post" in font:
        font["post"].formatType = 3.0

    maxp = font["maxp"]
    maxp.tableVersion = 0x00010000
    for field, default in (
        ("maxZones", 2),
        ("maxTwilightPoints", 0),
        ("maxStorage", 0),
        ("maxFunctionDefs", 0),
        ("maxInstructionDefs", 0),
        ("maxStackElements", 0),
        ("maxSizeOfInstructions", 0),
    ):
        if not hasattr(maxp, field):
            setattr(maxp, field, default)
    maxp.recalc(font)

    hmetrics_remapping = reconcile_cff_metrics_for_glyf(font, before, source_metrics)
    after = raw_glyf_bounds(font)
    glyphset_aligned_after = glyph_bounds(font, prefer_cff=False)
    max_bbox_delta = 0.0
    worst_glyph = None
    max_placement_delta = 0.0
    worst_placement_glyph = None
    for gid, name in enumerate(names):
        a, b = before[name], after[name]
        aligned = glyphset_aligned_after[name]
        if a is None or b is None or aligned is None:
            if a != b or a != aligned:
                raise ValueError(f"empty/non-empty outline changed for GID {gid} ({name})")
            continue
        placement_delta = max(abs(float(x) - float(y)) for x, y in zip(a, aligned))
        if placement_delta > max_placement_delta:
            max_placement_delta = placement_delta
            worst_placement_glyph = {
                "gid": gid,
                "name": name,
                "sourceBounds": [float(v) for v in a],
                "glyphSetAlignedBounds": [float(v) for v in aligned],
                "deltaFontUnits": placement_delta,
                "deltaEm": placement_delta / float(font["head"].unitsPerEm),
                "sourceLsb": source_metrics[name][1],
                "outputLsb": int(font["hmtx"].metrics[name][1]),
                "sourceLeftPhantomPoint": float(a[0]) - float(source_metrics[name][1]),
                "outputLeftPhantomPoint": (
                    float(font["glyf"][name].xMin) - float(font["hmtx"].metrics[name][1])
                    if hasattr(font["glyf"][name], "xMin") else None
                ),
            }
        delta = max(abs(float(x) - float(y)) for x, y in zip(a, b))
        if delta > max_bbox_delta:
            max_bbox_delta = delta
            worst_glyph = {
                "gid": gid,
                "name": name,
                "sourceBounds": [float(v) for v in a],
                "convertedBounds": [float(v) for v in b],
                "deltaFontUnits": delta,
                "deltaEm": delta / float(font["head"].unitsPerEm),
                "deltaOverCu2QuTolerance": delta / max_err if max_err else None,
                "glyphSetAlignedBounds": (
                    [float(v) for v in glyphset_aligned_after[name]]
                    if glyphset_aligned_after[name] is not None else None
                ),
                "sourceLsb": source_metrics[name][1],
                "outputLsb": int(font["hmtx"].metrics[name][1]),
                "sourceLeftPhantomPoint": float(a[0]) - float(source_metrics[name][1]),
                "outputLeftPhantomPoint": (
                    float(font["glyf"][name].xMin) - float(font["hmtx"].metrics[name][1])
                    if hasattr(font["glyf"][name], "xMin") else None
                ),
                "glyphSetHorizontalTranslation": (
                    float(font["hmtx"].metrics[name][1] - font["glyf"][name].xMin)
                    if hasattr(font["glyf"][name], "xMin") else None
                ),
            }
    if worst_glyph is not None:
        source_recording = RecordingPen()
        glyph_set[worst_glyph["name"]].draw(source_recording)
        worst_glyph["sourceCommandPreview"] = [
            {"operation": operation, "arguments": repr(arguments)}
            for operation, arguments in source_recording.value[:24]
        ]
        converted_glyph = glyphs[worst_glyph["name"]]
        is_composite = bool(converted_glyph.isComposite())
        worst_glyph["convertedGlyphKind"] = "composite" if is_composite else "simple"
        if is_composite:
            worst_glyph["convertedComponentsPreview"] = [
                {
                    "glyphName": component.glyphName,
                    "x": getattr(component, "x", None),
                    "y": getattr(component, "y", None),
                    "transform": list(component.transform) if hasattr(component, "transform") else None,
                }
                for component in converted_glyph.components[:12]
            ]
        else:
            worst_glyph["convertedPointsPreview"] = [
                [int(point[0]), int(point[1])]
                for point in list(converted_glyph.coordinates)[:24]
            ]
    del font["CFF "]
    return {
        "maxBoundsDeltaFontUnits": max_bbox_delta,
        "worstGlyph": worst_glyph,
        "maxGlyphSetPlacementDeltaFontUnits": max_placement_delta,
        "maxGlyphSetPlacementDeltaEm": max_placement_delta / float(font["head"].unitsPerEm),
        "worstPlacementGlyph": worst_placement_glyph,
        "hmetricsRemapping": hmetrics_remapping,
    }



class _DecomposingFilterPen(DecomposingPen, FilterPen):
    def __init__(self, out_pen, glyph_set):
        DecomposingPen.__init__(self, glyph_set, out_pen, skipMissingComponents=False)


def convert_cff_to_glyf_decomposed(font: TTFont, max_err: float) -> dict[str, Any]:
    """Experimental CFF conversion that decomposes component references before glyf creation."""
    if "CFF " not in font:
        return {"maxBoundsDeltaFontUnits": 0.0, "worstGlyph": None}
    if "CFF2" in font:
        raise ValueError("CFF2 conversion is not included in this proof")
    names = font.getGlyphOrder()
    glyph_set = font.getGlyphSet()
    before = glyph_bounds(font, prefer_cff=True)
    source_metrics = {
        name: (int(font["hmtx"].metrics[name][0]), int(font["hmtx"].metrics[name][1]))
        for name in names
    }
    glyphs = {}
    for name in names:
        pen = TTGlyphPen(None)
        converter = Cu2QuPen(pen, max_err=max_err, reverse_direction=False, all_quadratic=True)
        decomposer = _DecomposingFilterPen(converter, glyph_set)
        glyph_set[name].draw(decomposer)
        glyphs[name] = pen.glyph()

    glyf = newTable("glyf")
    glyf.glyphs = glyphs
    glyf.setGlyphOrder(names)
    for name in names:
        glyf[name].recalcBounds(glyf)
    font["glyf"] = glyf
    font["loca"] = newTable("loca")
    del font["CFF "]
    font.sfntVersion = "\x00\x01\x00\x00"
    font["head"].indexToLocFormat = 1
    if "post" in font:
        font["post"].formatType = 3.0
    maxp = font["maxp"]
    maxp.tableVersion = 0x00010000
    for field, default in (
        ("maxZones", 2), ("maxTwilightPoints", 0), ("maxStorage", 0),
        ("maxFunctionDefs", 0), ("maxInstructionDefs", 0),
        ("maxStackElements", 0), ("maxSizeOfInstructions", 0),
    ):
        if not hasattr(maxp, field):
            setattr(maxp, field, default)
    maxp.recalc(font)
    hmetrics_remapping = reconcile_cff_metrics_for_glyf(font, before, source_metrics)
    after = raw_glyf_bounds(font)
    max_delta = 0.0
    worst = None
    for gid, name in enumerate(names):
        a, b = before[name], after[name]
        if a is None or b is None:
            if a != b:
                raise ValueError(f"empty/non-empty outline changed for GID {gid} ({name})")
            continue
        delta = max(abs(float(x) - float(y)) for x, y in zip(a, b))
        if delta > max_delta:
            max_delta = delta
            worst = {
                "gid": gid, "name": name,
                "sourceBounds": [float(v) for v in a],
                "convertedBounds": [float(v) for v in b],
                "deltaFontUnits": delta,
                "deltaEm": delta / float(font["head"].unitsPerEm),
                "deltaOverCu2QuTolerance": delta / max_err if max_err else None,
            }
    return {
        "maxBoundsDeltaFontUnits": max_delta,
        "worstGlyph": worst,
        "hmetricsRemapping": hmetrics_remapping,
    }


def glyph_svg_path(font: TTFont, glyph_name: str) -> str:
    """Draw the effective glyph path, including TrueType LSB placement."""
    glyph_set = font.getGlyphSet(preferCFF=("CFF " in font))
    pen = SVGPathPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    return pen.getCommands()


def write_glyph_comparison(
    source_path: Path,
    converted_path: Path,
    gid: int,
    output_dir: Path,
    label: str,
) -> dict[str, str]:
    import cairosvg

    source = TTFont(str(source_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    converted = TTFont(str(converted_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    source_order = source.getGlyphOrder()
    converted_order = converted.getGlyphOrder()
    if gid >= len(source_order) or gid >= len(converted_order):
        raise ValueError(f"visual GID {gid} is outside source/converted glyph order")
    source_name = source_order[gid]
    converted_name = converted_order[gid]
    source_path_data = glyph_svg_path(source, source_name)
    converted_path_data = glyph_svg_path(converted, converted_name)
    source_bounds = glyph_bounds(source, prefer_cff=True)[source_name]
    converted_bounds = glyph_bounds(converted, prefer_cff=False)[converted_name]
    if source_bounds is None or converted_bounds is None:
        raise ValueError(f"cannot create visual comparison for empty GID {gid}")
    upem = float(source["head"].unitsPerEm)
    min_x = min(source_bounds[0], converted_bounds[0])
    min_y = min(source_bounds[1], converted_bounds[1])
    max_x = max(source_bounds[2], converted_bounds[2])
    max_y = max(source_bounds[3], converted_bounds[3])
    pad = max(40.0, upem * 0.08)
    cell_w = max_x - min_x + 2 * pad
    cell_h = max_y - min_y + 2 * pad
    gutter = pad
    width = 2 * cell_w + gutter
    height = cell_h + 2 * pad
    tx = -min_x + pad
    ty = max_y + pad
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width:.2f}" height="{height:.2f}" viewBox="0 0 {width:.2f} {height:.2f}">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  <g font-family="sans-serif" font-size="{upem * 0.035:.2f}" fill="#222">
    <text x="{cell_w/2:.2f}" y="{pad*0.65:.2f}" text-anchor="middle">Source CFF · GID {gid} · {source_name}</text>
    <text x="{cell_w + gutter + cell_w/2:.2f}" y="{pad*0.65:.2f}" text-anchor="middle">Converted glyf · GID {gid} · {converted_name}</text>
  </g>
  <g transform="translate(0,{pad:.2f})">
    <g transform="translate({tx:.2f},{ty:.2f}) scale(1,-1)"><path d="{source_path_data}" fill="#111"/></g>
  </g>
  <g transform="translate({cell_w + gutter:.2f},{pad:.2f})">
    <g transform="translate({tx:.2f},{ty:.2f}) scale(1,-1)"><path d="{converted_path_data}" fill="#111"/></g>
  </g>
</svg>'''
    output_dir.mkdir(parents=True, exist_ok=True)
    svg_path = output_dir / f"{label}-gid-{gid}.svg"
    png_path = output_dir / f"{label}-gid-{gid}.png"
    svg_path.write_text(svg, encoding="utf-8")
    cairosvg.svg2png(bytestring=svg.encode("utf-8"), write_to=str(png_path), output_width=1600)
    source.close()
    converted.close()
    return {"svg": str(svg_path), "png": str(png_path)}


def font_sample_text(font: TTFont, kind: str) -> str:
    cmap = font.getBestCmap() or {}
    heb = "".join(ch for ch in HEBREW_LETTERS if ord(ch) in cmap)
    marks = "".join(chr(cp) for cp in sorted(HEBREW_MARKS) if cp in cmap)[:3]
    latin = "".join(ch for ch in "Latin 123" if ch == " " or ord(ch) in cmap)
    if "latin-only" in kind:
        if len(latin.replace(" ", "")) < 3:
            raise ValueError("Latin sample font has insufficient Latin coverage")
        return latin
    if "partial-hebrew" in kind:
        if not heb:
            raise ValueError("decorative sample unexpectedly has no Hebrew glyphs")
        return heb[: min(5, len(heb))]
    if len(heb) < 27:
        raise ValueError(f"Hebrew sample expected full alphabet, got {len(heb)}/27")
    return heb + " " + marks + " 123"


def java_subset_check(repo_root: Path, sfnt_path: Path, sample: str) -> dict[str, Any]:
    js = r"""
const fs = require('node:fs');
const fm = require('./red-build/src/engine/typography/font-metrics');
const subsetApi = require('./red-build/src/engine/typography/font-subset');
const file = process.argv[1];
const sample = process.argv[2];
const bytes = fs.readFileSync(file);
const parsed = fm.parseFont(bytes);
if (!parsed.ok) throw new Error('runtime-parse:' + parsed.error);
const chars = subsetApi.charInventory(sample);
const subset = subsetApi.buildSubset(parsed.font, chars);
if (!subset.ok) throw new Error('runtime-subset:' + subset.error);
const reparsed = fm.parseFont(subset.bytes);
if (!reparsed.ok) throw new Error('runtime-subset-parse:' + reparsed.error);
for (const ch of chars) {
  if (fm.glyphIdOf(parsed.font, ch) !== 0 && fm.glyphIdOf(reparsed.font, ch) === 0) {
    throw new Error('subset-cmap-loss:' + ch.codePointAt(0).toString(16));
  }
}
process.stdout.write(JSON.stringify({
  runtimeParse: true,
  subsetParse: true,
  glyphCount: parsed.font.numGlyphs,
  subsetGlyphs: subset.kept,
  mappedChars: subset.mappedChars,
  unitsPerEm: parsed.font.unitsPerEm
}));
"""
    result = subprocess.run(
        ["node", "-e", js, str(sfnt_path), sample],
        cwd=repo_root,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError((result.stderr or result.stdout or "node font validation failed").strip())
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=Path("artifacts/font-conversion-proof/report.json"))
    parser.add_argument("--visual-dir", type=Path, default=Path("artifacts/font-conversion-proof/visuals"))
    args = parser.parse_args()
    root = args.repo_root.resolve()
    results = []
    failures = []

    with tempfile.TemporaryDirectory(prefix="imud-font-proof-") as tmp:
        temp = Path(tmp)
        for rel, label in SAMPLES:
            src = root / rel
            row: dict[str, Any] = {
                "source": rel,
                "case": label,
                "sourceExists": src.is_file(),
            }
            try:
                if not src.is_file():
                    raise FileNotFoundError(rel)
                row["sourceBytes"] = src.stat().st_size
                row["sourceSha256"] = sha256_file(src)
                font = TTFont(str(src), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
                row["sourceSfntVersion"] = font.sfntVersion.encode("latin1").hex()
                row["sourceFlavor"] = font.flavor or "sfnt"
                row["sourceOutline"] = (
                    "cff" if "CFF " in font
                    else "cff2" if "CFF2" in font
                    else "glyf" if "glyf" in font and "loca" in font
                    else "unknown"
                )
                row["sourceGlyphCount"] = len(font.getGlyphOrder())
                row["sourceHebrewLettersMapped"] = sum(1 for cp in range(0x05D0, 0x05EB) if cp in (font.getBestCmap() or {}))
                row["sourceHebrewMarksMapped"] = sum(1 for cp in HEBREW_MARKS if cp in (font.getBestCmap() or {}))
                row["sourceHasGSUB"] = "GSUB" in font
                row["sourceHasGPOS"] = "GPOS" in font

                axes = {}
                if "fvar" in font:
                    axes = {axis.axisTag: float(axis.defaultValue) for axis in font["fvar"].axes}
                    instantiateVariableFont(
                        font,
                        axes,
                        inplace=True,
                        updateFontNames=False,
                        static=True,
                    )
                row["instantiatedAxes"] = axes
                if "fvar" in font:
                    raise ValueError("variable tables remain after full default instancing")

                glyph_order_before = list(font.getGlyphOrder())
                is_cff_source = "CFF " in font
                source_hmetrics = {
                    name: (int(font["hmtx"].metrics[name][0]), int(font["hmtx"].metrics[name][1]))
                    for name in glyph_order_before
                }
                source_hhea_summary = {
                    "advanceWidthMax": int(font["hhea"].advanceWidthMax),
                    "minLeftSideBearing": int(font["hhea"].minLeftSideBearing),
                    "minRightSideBearing": int(font["hhea"].minRightSideBearing),
                    "xMaxExtent": int(font["hhea"].xMaxExtent),
                }
                source_head_bounds = [
                    int(font["head"].xMin), int(font["head"].yMin),
                    int(font["head"].xMax), int(font["head"].yMax),
                ]
                source_bounds_by_name = glyph_bounds(font, prefer_cff=True) if is_cff_source else {}
                source_bounds_by_gid = [source_bounds_by_name.get(name) for name in glyph_order_before]
                cmap_before = {
                    int(cp): int(font.getGlyphID(glyph_name))
                    for cp, glyph_name in (font.getBestCmap() or {}).items()
                }
                advances_before = [
                    int(font["hmtx"].metrics[name][0])
                    for name in glyph_order_before
                ]
                outline = "cff" if "CFF " in font else "glyf"
                max_err = float(font["head"].unitsPerEm) * MAX_ERR_EM
                row["cu2quMaxErrorEm"] = MAX_ERR_EM
                row["cu2quMaxErrorFontUnits"] = max_err
                conversion_geometry = convert_cff_to_glyf(font, max_err)
                row["maxGlyphBoundsDeltaFontUnits"] = conversion_geometry["maxBoundsDeltaFontUnits"]
                row["worstGlyphBoundsDelta"] = conversion_geometry["worstGlyph"]
                row["maxGlyphBoundsDeltaOverTolerance"] = (
                    conversion_geometry["maxBoundsDeltaFontUnits"] / max_err if max_err else None
                )
                row["hmetricsRemapping"] = conversion_geometry.get("hmetricsRemapping")
                font.flavor = None
                if "glyf" not in font or "loca" not in font or "CFF " in font:
                    raise ValueError("conversion did not produce TrueType glyf/loca outlines")
                font.sfntVersion = "\x00\x01\x00\x00"

                converted_order = list(font.getGlyphOrder())
                converted_bounds = glyph_bounds(font)
                converted_bounds_by_gid = [
                    converted_bounds.get(name)
                    for name in converted_order
                ]
                out = temp / (src.stem + ".ttf")
                font.save(str(out))
                check = TTFont(str(out), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
                if check.sfntVersion != "\x00\x01\x00\x00":
                    raise ValueError("output is not TrueType-flavored SFNT")
                if "glyf" not in check or "loca" not in check or "CFF " in check or "fvar" in check:
                    raise ValueError("output has unsupported outlines or residual variation")
                cmap_after = {
                    int(cp): int(check.getGlyphID(glyph_name))
                    for cp, glyph_name in (check.getBestCmap() or {}).items()
                }
                if len(check.getGlyphOrder()) != len(glyph_order_before):
                    raise ValueError("glyph count/order cardinality changed during conversion")
                if cmap_after != cmap_before:
                    changed = [
                        (cp, cmap_before.get(cp), cmap_after.get(cp))
                        for cp in sorted(set(cmap_before) | set(cmap_after))
                        if cmap_before.get(cp) != cmap_after.get(cp)
                    ][:8]
                    raise ValueError(f"Unicode-to-GID mapping changed during conversion: {changed}")
                advances_after = [
                    int(check["hmtx"].metrics[name][0])
                    for name in check.getGlyphOrder()
                ]
                if advances_after != advances_before:
                    raise ValueError("glyph advance widths changed by GID during outline conversion")
                if is_cff_source:
                    max_phantom_delta = 0.0
                    for gid, output_name in enumerate(check.getGlyphOrder()):
                        source_box = source_bounds_by_gid[gid]
                        if source_box is None:
                            if int(check["hmtx"].metrics[output_name][1]) != 0:
                                raise ValueError(f"empty glyph LSB must be zero at GID {gid}")
                            continue
                        source_lsb = source_hmetrics[glyph_order_before[gid]][1]
                        source_pp1 = float(source_box[0]) - float(source_lsb)
                        output_pp1 = float(check["glyf"][output_name].xMin) - float(check["hmtx"].metrics[output_name][1])
                        delta = abs(source_pp1 - output_pp1)
                        max_phantom_delta = max(max_phantom_delta, delta)
                    if max_phantom_delta > 0.500001:
                        raise ValueError(f"left phantom-point position changed by {max_phantom_delta} font units")
                    row["maxLeftPhantomPointDeltaFontUnits"] = max_phantom_delta
                actual_hhea = {
                    "advanceWidthMax": int(check["hhea"].advanceWidthMax),
                    "minLeftSideBearing": int(check["hhea"].minLeftSideBearing),
                    "minRightSideBearing": int(check["hhea"].minRightSideBearing),
                    "xMaxExtent": int(check["hhea"].xMaxExtent),
                }
                actual_head = [int(check["head"].xMin), int(check["head"].yMin), int(check["head"].xMax), int(check["head"].yMax)]
                expected_hhea = (
                    conversion_geometry["hmetricsRemapping"]["hheaSummary"]
                    if is_cff_source else source_hhea_summary
                )
                expected_head = (
                    conversion_geometry["hmetricsRemapping"]["headGlobalBounds"]
                    if is_cff_source else source_head_bounds
                )
                if actual_hhea != expected_hhea:
                    raise ValueError(f"hhea summary changed or stale: expected {expected_hhea}, got {actual_hhea}")
                if actual_head != expected_head:
                    raise ValueError(f"head global bounds changed or stale: expected {expected_head}, got {actual_head}")
                row["hheaSummaryAfterReload"] = actual_hhea
                row["headGlobalBoundsAfterReload"] = actual_head
                if len(check.getGlyphOrder()) != len(converted_order):
                    raise ValueError("glyph-ID cardinality changed after SFNT round-trip")
                saved_bounds = glyph_bounds(check)
                max_roundtrip_bbox_delta = 0.0
                for gid, saved_name in enumerate(check.getGlyphOrder()):
                    before_bounds = converted_bounds_by_gid[gid]
                    after_bounds = saved_bounds.get(saved_name)
                    if before_bounds is None or after_bounds is None:
                        if before_bounds != after_bounds:
                            raise ValueError(f"empty/non-empty outline changed after save at GID {gid}")
                        continue
                    delta = max(abs(float(x) - float(y)) for x, y in zip(before_bounds, after_bounds))
                    max_roundtrip_bbox_delta = max(max_roundtrip_bbox_delta, delta)
                row["maxSaveRoundTripGlyphBoundsDeltaFontUnits"] = max_roundtrip_bbox_delta
                if max_roundtrip_bbox_delta > 0.01:
                    raise ValueError(f"glyph bounds changed during SFNT save/load: {max_roundtrip_bbox_delta}")
                if len(check.getGlyphOrder()) != row["sourceGlyphCount"]:
                    raise ValueError("glyph count changed")
                sample = font_sample_text(check, label)
                visual_artifacts = None
                if row["sourceOutline"] == "cff" and row.get("worstGlyphBoundsDelta"):
                    visual_artifacts = write_glyph_comparison(
                        src,
                        out,
                        int(row["worstGlyphBoundsDelta"]["gid"]),
                        args.visual_dir if args.visual_dir.is_absolute() else root / args.visual_dir,
                        label,
                    )
                runtime = java_subset_check(root, out, sample)
                row.update(
                    {
                        "outputBytes": out.stat().st_size,
                        "outputSha256": sha256_file(out),
                        "outputSfntVersion": check.sfntVersion.encode("latin1").hex(),
                        "outputOutline": "glyf",
                        "outputGlyphCount": len(check.getGlyphOrder()),
                        "outputHebrewLettersMapped": sum(1 for cp in range(0x05D0, 0x05EB) if cp in (check.getBestCmap() or {})),
                        "outputHebrewMarksMapped": sum(1 for cp in HEBREW_MARKS if cp in (check.getBestCmap() or {})),
                        "GSUBPreserved": ("GSUB" in check) == row["sourceHasGSUB"],
                        "GPOSPreserved": ("GPOS" in check) == row["sourceHasGPOS"],
                        "sampleText": sample,
                        "productionRuntimeValidation": runtime,
                        "glyphComparisonArtifacts": visual_artifacts,
                        "status": "passed",
                    }
                )
                if not row["GSUBPreserved"] or not row["GPOSPreserved"]:
                    raise ValueError("OpenType GSUB/GPOS tables were not preserved")
                check.close()
                font.close()
            except Exception as exc:
                row["status"] = "failed"
                row["error"] = f"{type(exc).__name__}: {exc}"
                failures.append(row)
            results.append(row)

    report = {
        "schema": "imud-font-conversion-proof-v1",
        "fontToolsVersion": __import__("fontTools").version,
        "conversionToleranceEm": MAX_ERR_EM,
        "samples": results,
        "failureCount": len(failures),
        "failures": failures,
    }
    output = args.output if args.output.is_absolute() else root / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"fontToolsVersion": report["fontToolsVersion"], "sampleCount": len(results), "failureCount": len(failures), "report": str(output)}, ensure_ascii=False, indent=2))
    for row in results:
        print(f"{row['status']}: {row['case']} — {row.get('error', row.get('outputSha256', ''))}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
