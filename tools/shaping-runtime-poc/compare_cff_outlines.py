#!/usr/bin/env python3
"""Compare HarfBuzz paths from normalized SFNT with original font source outlines."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen, ControlBoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.svgLib.path import parse_path
from fontTools.ttLib import TTFont


def flatten(value):
    if isinstance(value, (tuple, list)):
        result = []
        for item in value:
            result.extend(flatten(item))
        return result
    if isinstance(value, (int, float)):
        return [float(value)]
    return [value]


def max_delta(left, right):
    if len(left) != len(right):
        return math.inf
    maximum = 0.0
    for a, b in zip(left, right):
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            maximum = max(maximum, abs(float(a) - float(b)))
        elif a != b:
            return math.inf
    return maximum


def _point_equal(left, right, tolerance: float = 1e-9) -> bool:
    return (
        isinstance(left, (tuple, list))
        and isinstance(right, (tuple, list))
        and len(left) == len(right) == 2
        and abs(float(left[0]) - float(right[0])) <= tolerance
        and abs(float(left[1]) - float(right[1])) <= tolerance
    )


def canonicalize_closed_contours(operations):
    """Normalize an explicit zero-length close edge to RecordingPen.closePath.

    HarfBuzz's SVG serializer may emit L(startX,startY) Z while fontTools'
    CFF RecordingPen emits closePath alone. These encode the same contour:
    the explicit line reaches the contour start and Z closes an already closed
    contour. Remove only that redundant final line. No curve, non-zero segment,
    contour order, or winding is altered.
    """
    normalized = []
    contour_start = None
    removed = 0
    for operation in operations:
        name, points = operation
        if name == "moveTo":
            contour_start = points[0] if points else None
            normalized.append(operation)
            continue
        if name in ("closePath", "endPath"):
            if (
                name == "closePath"
                and contour_start is not None
                and normalized
                and normalized[-1][0] == "lineTo"
            ):
                previous_points = normalized[-1][1]
                if previous_points and _point_equal(previous_points[-1], contour_start):
                    normalized.pop()
                    removed += 1
            normalized.append(operation)
            contour_start = None
            continue
        normalized.append(operation)
    return normalized, removed


def outline_format_of(font) -> str:
    tags = set(font.keys())
    if "CFF2" in tags:
        return "CFF2"
    if "CFF " in tags or "CFF" in tags:
        return "CFF"
    return "other"


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: compare_cff_outlines.py cff-outline-reference-input.json")
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    font_results = []
    tolerance = 1e-5

    for item in payload:
        source_path = Path(item["sourceFontPath"])
        normalized_path = Path(item["normalizedFontPath"])
        source_font = TTFont(source_path, recalcBBoxes=False, recalcTimestamp=False)
        normalized_font = TTFont(normalized_path, recalcBBoxes=False, recalcTimestamp=False)
        try:
            source_tags = set(source_font.keys())
            normalized_tags = set(normalized_font.keys())
            source_format = outline_format_of(source_font)
            normalized_format = outline_format_of(normalized_font)
            if source_format not in ("CFF", "CFF2"):
                raise SystemExit(
                    f"{source_path.name}: original source is not CFF/CFF2 ({source_format})"
                )
            if normalized_format not in ("CFF", "CFF2"):
                raise SystemExit(
                    f"{normalized_path.name}: normalized SFNT is not CFF/CFF2 ({normalized_format})"
                )

            source_order = source_font.getGlyphOrder()
            normalized_order = normalized_font.getGlyphOrder()
            source_glyph_count = int(source_font["maxp"].numGlyphs)
            normalized_glyph_count = int(normalized_font["maxp"].numGlyphs)
            source_upem = int(source_font["head"].unitsPerEm)
            normalized_upem = int(normalized_font["head"].unitsPerEm)
            glyph_order_matches = source_order == normalized_order
            upem_matches = source_upem == normalized_upem

            if source_format != normalized_format:
                raise SystemExit(
                    f"{source_path.name}: outline format changed during normalization: "
                    f"{source_format} -> {normalized_format}"
                )
            if source_glyph_count != normalized_glyph_count:
                raise SystemExit(
                    f"{source_path.name}: maxp glyph count changed during normalization: "
                    f"{source_glyph_count} -> {normalized_glyph_count}"
                )
            if not glyph_order_matches:
                first_difference = next(
                    (i for i, pair in enumerate(zip(source_order, normalized_order)) if pair[0] != pair[1]),
                    min(len(source_order), len(normalized_order)),
                )
                raise SystemExit(
                    f"{source_path.name}: glyph order changed at GID {first_difference}"
                )
            if not upem_matches:
                raise SystemExit(
                    f"{source_path.name}: unitsPerEm changed during normalization: "
                    f"{source_upem} -> {normalized_upem}"
                )

            source_glyph_set = source_font.getGlyphSet()
            records = item["glyphPaths"]
            expected_count = source_glyph_count
            if len(records) != expected_count:
                raise SystemExit(
                    f"{source_path.name}: HarfBuzz paths {len(records)} != source maxp {expected_count}"
                )

            command_exact = 0
            coordinate_within_tolerance = 0
            operation_mismatch = 0
            coordinate_mismatch = 0
            empty_source = 0
            empty_harfbuzz = 0
            empty_agreement = 0
            maximum_delta = 0.0
            normalized_close_segments = 0
            glyph_extents_curve_matches = 0
            glyph_extents_curve_disagreements = 0
            glyph_extents_control_matches = 0
            glyph_extents_control_mismatches = 0
            glyph_extents_missing_source = 0
            glyph_extents_missing_harfbuzz = 0
            glyph_extents_empty_zero_agreements = 0
            maximum_curve_bound_delta = 0.0
            maximum_control_bound_delta = 0.0
            glyph_extents_mismatch_examples = []
            mismatch_examples = []

            for record_index, record in enumerate(records):
                gid = int(record["gid"])
                if gid != record_index:
                    raise SystemExit(
                        f"{source_path.name}: expected sequential GID {record_index}, got {gid}"
                    )
                path_data = record["path"]
                if gid < 0 or gid >= len(source_order):
                    raise SystemExit(f"{source_path.name}: invalid GID {gid}")

                hb_pen = RecordingPen()
                parse_path(path_data, hb_pen)
                source_pen = RecordingPen()
                source_glyph_set[source_order[gid]].draw(source_pen)
                source_glyph = source_glyph_set[source_order[gid]]
                source_bounds_pen = BoundsPen(source_glyph_set)
                source_glyph.draw(source_bounds_pen)
                source_bounds = source_bounds_pen.bounds
                source_control_pen = ControlBoundsPen(source_glyph_set)
                source_glyph.draw(source_control_pen)
                source_control_bounds = source_control_pen.bounds
                hb_extents = record.get("glyphExtents")
                if source_bounds is None:
                    glyph_extents_missing_source += 1
                if hb_extents is None:
                    if source_bounds is not None or source_control_bounds is not None:
                        glyph_extents_missing_harfbuzz += 1
                        glyph_extents_control_mismatches += 1
                        if len(glyph_extents_mismatch_examples) < 8:
                            glyph_extents_mismatch_examples.append({
                                "gid": gid,
                                "glyphName": source_order[gid],
                                "reason": "HarfBuzz omitted extents for a non-empty source glyph",
                                "sourceCurveBounds": (
                                    [float(value) for value in source_bounds] if source_bounds else None
                                ),
                                "sourceControlBounds": (
                                    [float(value) for value in source_control_bounds]
                                    if source_control_bounds else None
                                ),
                            })
                    else:
                        glyph_extents_curve_matches += 1
                        glyph_extents_control_matches += 1
                else:
                    # HarfBuzz uses y-up font coordinates; height is commonly negative.
                    # Convert to [xMin, yMin, xMax, yMax].
                    hb_bounds = [
                        float(hb_extents["xBearing"]),
                        float(hb_extents["yBearing"]) + float(hb_extents["height"]),
                        float(hb_extents["xBearing"]) + float(hb_extents["width"]),
                        float(hb_extents["yBearing"]),
                    ]
                    if source_bounds is None and source_control_bounds is None:
                        # HarfBuzz may return a zero-area extent record for an empty space glyph.
                        if max(abs(value) for value in hb_bounds) <= tolerance:
                            glyph_extents_empty_zero_agreements += 1
                            glyph_extents_curve_matches += 1
                            glyph_extents_control_matches += 1
                        else:
                            glyph_extents_control_mismatches += 1
                            if len(glyph_extents_mismatch_examples) < 8:
                                glyph_extents_mismatch_examples.append({
                                    "gid": gid,
                                    "glyphName": source_order[gid],
                                    "reason": "non-zero HarfBuzz extents for an empty source glyph",
                                    "harfBuzzBounds": hb_bounds,
                                })
                    else:
                        if source_bounds is not None:
                            curve_delta = max_delta(hb_bounds, source_bounds)
                            maximum_curve_bound_delta = max(maximum_curve_bound_delta, curve_delta)
                            if curve_delta <= tolerance:
                                glyph_extents_curve_matches += 1
                            else:
                                glyph_extents_curve_disagreements += 1
                        if source_control_bounds is not None:
                            control_delta = max_delta(hb_bounds, source_control_bounds)
                            maximum_control_bound_delta = max(maximum_control_bound_delta, control_delta)
                            if control_delta <= tolerance:
                                glyph_extents_control_matches += 1
                            else:
                                glyph_extents_control_mismatches += 1
                                if len(glyph_extents_mismatch_examples) < 8:
                                    glyph_extents_mismatch_examples.append({
                                        "gid": gid,
                                        "glyphName": source_order[gid],
                                        "reason": "HarfBuzz extents differ from source ControlBoundsPen",
                                        "sourceCurveBounds": (
                                            [float(value) for value in source_bounds] if source_bounds else None
                                        ),
                                        "sourceControlBounds": (
                                            [float(value) for value in source_control_bounds]
                                            if source_control_bounds else None
                                        ),
                                        "harfBuzzBounds": hb_bounds,
                                        "maxControlBoundDeltaFontUnits": control_delta,
                                    })
                hb_ops = hb_pen.value
                source_ops = source_pen.value
                if not hb_ops:
                    empty_harfbuzz += 1
                if not source_ops:
                    empty_source += 1
                if not hb_ops and not source_ops:
                    empty_agreement += 1

                hb_ops, hb_removed = canonicalize_closed_contours(hb_ops)
                source_ops, source_removed = canonicalize_closed_contours(source_ops)
                normalized_close_segments += hb_removed + source_removed

                if len(hb_ops) != len(source_ops) or any(
                    a[0] != b[0] for a, b in zip(hb_ops, source_ops)
                ):
                    operation_mismatch += 1
                    if len(mismatch_examples) < 8:
                        mismatch_examples.append({
                            "gid": gid,
                            "glyphName": source_order[gid],
                            "reason": "operation-sequence-after-close-normalization",
                            "harfbuzzOperations": [x[0] for x in hb_ops[:16]],
                            "originalSourceOperations": [x[0] for x in source_ops[:16]],
                        })
                    continue

                glyph_max_delta = 0.0
                glyph_failed = False
                for hb_op, source_op in zip(hb_ops, source_ops):
                    delta = max_delta(flatten(hb_op[1]), flatten(source_op[1]))
                    if math.isinf(delta):
                        glyph_failed = True
                        break
                    glyph_max_delta = max(glyph_max_delta, delta)
                maximum_delta = max(maximum_delta, glyph_max_delta)
                if glyph_failed:
                    coordinate_mismatch += 1
                    if len(mismatch_examples) < 8:
                        mismatch_examples.append({
                            "gid": gid,
                            "glyphName": source_order[gid],
                            "reason": "coordinate-count-or-value-type",
                        })
                elif glyph_max_delta <= tolerance:
                    command_exact += 1
                    coordinate_within_tolerance += 1
                else:
                    coordinate_mismatch += 1
                    if len(mismatch_examples) < 8:
                        mismatch_examples.append({
                            "gid": gid,
                            "glyphName": source_order[gid],
                            "reason": "coordinate-delta",
                            "maxDeltaFontUnits": glyph_max_delta,
                        })

            total = len(records)
            font_results.append({
                "font": item["fontName"],
                "sourceFont": item.get("sourceFontName", source_path.name),
                "normalizedFont": item.get("normalizedFontName", normalized_path.name),
                "sourceReference": "original-source-font",
                "sourceFlavor": source_font.flavor,
                "sourceOutlineFormat": source_format,
                "normalizedOutlineFormat": normalized_format,
                "sourceGlyphCount": source_glyph_count,
                "normalizedGlyphCount": normalized_glyph_count,
                "sourceGlyphOrderMatchesNormalized": glyph_order_matches,
                "sourceUnitsPerEm": source_upem,
                "normalizedUnitsPerEm": normalized_upem,
                "unitsPerEmMatches": upem_matches,
                "glyphCount": total,
                "exactOperationAndCoordinateMatches": command_exact,
                "coordinateMatchesWithinTolerance": coordinate_within_tolerance,
                "operationSequenceMismatches": operation_mismatch,
                "coordinateMismatches": coordinate_mismatch,
                "emptySourceOutlines": empty_source,
                "emptyHarfBuzzOutlines": empty_harfbuzz,
                "emptyOutlineAgreements": empty_agreement,
                "maxCoordinateDeltaFontUnits": maximum_delta,
                "glyphExtentsCurveBoundMatches": glyph_extents_curve_matches,
                "glyphExtentsCurveBoundDisagreements": glyph_extents_curve_disagreements,
                "glyphExtentsControlBoundMatches": glyph_extents_control_matches,
                "glyphExtentsControlBoundMismatches": glyph_extents_control_mismatches,
                "glyphExtentsMissingSource": glyph_extents_missing_source,
                "glyphExtentsMissingHarfBuzz": glyph_extents_missing_harfbuzz,
                "glyphExtentsEmptyZeroAgreements": glyph_extents_empty_zero_agreements,
                "maxGlyphExtentsCurveBoundDeltaFontUnits": maximum_curve_bound_delta,
                "maxGlyphExtentsControlBoundDeltaFontUnits": maximum_control_bound_delta,
                "glyphExtentsMismatchExamples": glyph_extents_mismatch_examples,
                "normalizedRedundantCloseSegments": normalized_close_segments,
                "toleranceFontUnits": tolerance,
                "mismatchExamples": mismatch_examples,
            })
        finally:
            source_font.close()
            normalized_font.close()

    summary = {
        "schema": "cff-source-outline-vector-compare-v2",
        "comparisonMethod": (
            "HarfBuzz SVG paths from normalized SFNT versus fontTools RecordingPen "
            "decoded directly from original source font (WOFF2 where applicable)"
        ),
        "sourceReference": "original-source-font",
        "fontCount": len(font_results),
        "glyphCount": sum(x["glyphCount"] for x in font_results),
        "sourceGlyphOrderMismatches": sum(
            1 for x in font_results if not x["sourceGlyphOrderMatchesNormalized"]
        ),
        "unitsPerEmMismatches": sum(1 for x in font_results if not x["unitsPerEmMatches"]),
        "operationSequenceMismatches": sum(x["operationSequenceMismatches"] for x in font_results),
        "coordinateMismatches": sum(x["coordinateMismatches"] for x in font_results),
        "glyphExtentsCurveBoundMatches": sum(x["glyphExtentsCurveBoundMatches"] for x in font_results),
        "glyphExtentsCurveBoundDisagreements": sum(
            x["glyphExtentsCurveBoundDisagreements"] for x in font_results
        ),
        "glyphExtentsControlBoundMatches": sum(
            x["glyphExtentsControlBoundMatches"] for x in font_results
        ),
        "glyphExtentsControlBoundMismatches": sum(
            x["glyphExtentsControlBoundMismatches"] for x in font_results
        ),
        "glyphExtentsMissingSource": sum(x["glyphExtentsMissingSource"] for x in font_results),
        "glyphExtentsMissingHarfBuzz": sum(x["glyphExtentsMissingHarfBuzz"] for x in font_results),
        "glyphExtentsEmptyZeroAgreements": sum(
            x["glyphExtentsEmptyZeroAgreements"] for x in font_results
        ),
        "maxGlyphExtentsCurveBoundDeltaFontUnits": max(
            (x["maxGlyphExtentsCurveBoundDeltaFontUnits"] for x in font_results), default=0.0
        ),
        "maxGlyphExtentsControlBoundDeltaFontUnits": max(
            (x["maxGlyphExtentsControlBoundDeltaFontUnits"] for x in font_results), default=0.0
        ),
        "glyphExtentsComparisonMethod": (
            "HarfBuzz glyphExtents versus fontTools BoundsPen (true curve bounds) and "
            "ControlBoundsPen (control-point bounds), all in y-up font units"
        ),
        "normalizedRedundantCloseSegments": sum(
            x["normalizedRedundantCloseSegments"] for x in font_results
        ),
        "exactOperationAndCoordinateMatches": sum(
            x["exactOperationAndCoordinateMatches"] for x in font_results
        ),
        "canonicalization": (
            "remove only a final lineTo to current contour start immediately before closePath"
        ),
        "coordinateMatchesWithinTolerance": sum(
            x["coordinateMatchesWithinTolerance"] for x in font_results
        ),
        "fonts": font_results,
    }
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
