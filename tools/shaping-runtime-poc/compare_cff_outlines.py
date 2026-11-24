#!/usr/bin/env python3
"""Compare HarfBuzz SVG outline paths with fontTools CFF glyph drawing commands."""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

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


def main():
    if len(sys.argv) != 2:
        raise SystemExit("usage: compare_cff_outlines.py cff-outline-reference-input.json")
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    font_results = []
    tolerance = 1e-5

    for item in payload:
        font_path = Path(item["fontPath"])
        font = TTFont(font_path, recalcBBoxes=False, recalcTimestamp=False)
        table_tags = set(font.keys())
        if "CFF " not in table_tags and "CFF2" not in table_tags and "CFF" not in table_tags:
            raise SystemExit(f"{font_path.name}: expected CFF/CFF2 SFNT")
        glyph_order = font.getGlyphOrder()
        glyph_set = font.getGlyphSet()
        records = item["glyphPaths"]
        expected_count = font["maxp"].numGlyphs
        if len(records) != expected_count:
            raise SystemExit(f"{font_path.name}: HarfBuzz paths {len(records)} != maxp {expected_count}")

        command_exact = 0
        coordinate_within_tolerance = 0
        operation_mismatch = 0
        coordinate_mismatch = 0
        empty_source = 0
        empty_harfbuzz = 0
        empty_agreement = 0
        maximum_delta = 0.0
        normalized_close_segments = 0
        mismatch_examples = []

        for record in records:
            gid = int(record["gid"])
            path_data = record["path"]
            if gid < 0 or gid >= len(glyph_order):
                raise SystemExit(f"{font_path.name}: invalid GID {gid}")
            hb_pen = RecordingPen()
            parse_path(path_data, hb_pen)
            source_pen = RecordingPen()
            glyph_set[glyph_order[gid]].draw(source_pen)
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

            if len(hb_ops) != len(source_ops) or any(a[0] != b[0] for a, b in zip(hb_ops, source_ops)):
                operation_mismatch += 1
                if len(mismatch_examples) < 8:
                    mismatch_examples.append({
                        "gid": gid,
                        "glyphName": glyph_order[gid],
                        "reason": "operation-sequence-after-close-normalization",
                        "harfbuzzOperations": [x[0] for x in hb_ops[:16]],
                        "fontToolsOperations": [x[0] for x in source_ops[:16]],
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
                        "glyphName": glyph_order[gid],
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
                        "glyphName": glyph_order[gid],
                        "reason": "coordinate-delta",
                        "maxDeltaFontUnits": glyph_max_delta,
                    })

        total = len(records)
        font_results.append({
            "font": item["fontName"],
            "outlineFormat": "CFF2" if "CFF2" in table_tags else "CFF",
            "glyphCount": total,
            "exactOperationAndCoordinateMatches": command_exact,
            "coordinateMatchesWithinTolerance": coordinate_within_tolerance,
            "operationSequenceMismatches": operation_mismatch,
            "coordinateMismatches": coordinate_mismatch,
            "emptySourceOutlines": empty_source,
            "emptyHarfBuzzOutlines": empty_harfbuzz,
            "emptyOutlineAgreements": empty_agreement,
            "maxCoordinateDeltaFontUnits": maximum_delta,
            "normalizedRedundantCloseSegments": normalized_close_segments,
            "toleranceFontUnits": tolerance,
            "mismatchExamples": mismatch_examples,
        })
        font.close()

    summary = {
        "schema": "cff-source-outline-vector-compare-v1",
        "comparisonMethod": "fontTools RecordingPen vs parsed HarfBuzz SVG path commands",
        "fontCount": len(font_results),
        "glyphCount": sum(x["glyphCount"] for x in font_results),
        "operationSequenceMismatches": sum(x["operationSequenceMismatches"] for x in font_results),
        "coordinateMismatches": sum(x["coordinateMismatches"] for x in font_results),
        "normalizedRedundantCloseSegments": sum(x["normalizedRedundantCloseSegments"] for x in font_results),
        "exactOperationAndCoordinateMatches": sum(x["exactOperationAndCoordinateMatches"] for x in font_results),
        "canonicalization": "remove only a final lineTo to current contour start immediately before closePath",
        "coordinateMatchesWithinTolerance": sum(x["coordinateMatchesWithinTolerance"] for x in font_results),
        "fonts": font_results,
    }
    print(json.dumps(summary, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
