#!/usr/bin/env python3
"""Regression test: raw TrueType contours must not inherit GlyphSet LSB alignment."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from prove_font_conversion import glyph_bounds, raw_glyf_bounds, reconcile_cff_metrics_for_glyf


def rect_glyph(x0: int, y0: int, x1: int, y1: int):
    pen = TTGlyphPen(None)
    pen.moveTo((x0, y0))
    pen.lineTo((x1, y0))
    pen.lineTo((x1, y1))
    pen.lineTo((x0, y1))
    pen.closePath()
    return pen.glyph()


def main() -> int:
    upem = 1158
    fb = FontBuilder(upem, isTTF=True)
    order = [".notdef", "offcurve-test"]
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({0xFB4F: "offcurve-test"})

    pen = TTGlyphPen(None)
    # The off-curve control x=-72 is outside the actual quadratic curve.
    # Actual curve xMin is 25.5, but glyf's stored control-point xMin is -72.
    pen.moveTo((150, 377))
    pen.qCurveTo((-72, 611), (150, 377))
    pen.closePath()

    fb.setupGlyf({
        ".notdef": rect_glyph(0, 0, 500, 700),
        "offcurve-test": pen.glyph(),
    })
    fb.setupHorizontalMetrics({
        ".notdef": (600, 0),
        "offcurve-test": (611, 39),
    })
    fb.setupHorizontalHeader(ascent=900, descent=-300)
    fb.setupNameTable({
        "familyName": "Raw Glyf Bounds Regression",
        "styleName": "Regular",
        "uniqueFontIdentifier": "RawGlyfBoundsRegression-Regular",
        "fullName": "Raw Glyf Bounds Regression Regular",
        "psName": "RawGlyfBoundsRegression-Regular",
    })
    fb.setupOS2(
        sTypoAscender=900,
        sTypoDescender=-300,
        usWinAscent=900,
        usWinDescent=300,
    )
    fb.setupPost()
    fb.setupMaxp()

    with tempfile.TemporaryDirectory(prefix="raw-glyf-bounds-") as temp:
        path = Path(temp) / "regression.ttf"
        fb.save(path)
        font = TTFont(path, lazy=False, recalcBBoxes=False, recalcTimestamp=False)

        raw_before = raw_glyf_bounds(font)["offcurve-test"]
        aligned_before = glyph_bounds(font, prefer_cff=False)["offcurve-test"]
        glyph = font["glyf"]["offcurve-test"]
        lsb = int(font["hmtx"].metrics["offcurve-test"][1])
        translation = lsb - int(glyph.xMin)

        assert raw_before is not None
        assert aligned_before is not None
        assert max(abs(a - b) for a, b in zip(raw_before, (39.0, 377.0, 150.0, 494.0))) < 1e-9, raw_before
        assert translation == 111, translation
        # GlyphSet alignment is horizontal only: xMin/xMax move by +111;
        # yMin/yMax must remain unchanged.
        differences = [b - a for a, b in zip(raw_before, aligned_before)]
        assert max(abs(a - b) for a, b in zip(differences, (translation, 0.0, translation, 0.0))) < 1e-9, differences

        # Treat the raw outline as the CFF curve geometry. Conversion must
        # move the TrueType LSB so the left phantom point is retained.
        source_bounds = raw_glyf_bounds(font)
        source_metrics = {
            name: tuple(int(v) for v in font["hmtx"].metrics[name])
            for name in font.getGlyphOrder()
        }
        remap = reconcile_cff_metrics_for_glyf(font, source_bounds, source_metrics)
        remapped_lsb = int(font["hmtx"].metrics["offcurve-test"][1])
        remapped_translation = remapped_lsb - int(font["glyf"]["offcurve-test"].xMin)
        source_pp1 = source_bounds["offcurve-test"][0] - source_metrics["offcurve-test"][1]
        output_pp1 = font["glyf"]["offcurve-test"].xMin - remapped_lsb
        raw_remapped = raw_glyf_bounds(font)["offcurve-test"]
        aligned_remapped = glyph_bounds(font, prefer_cff=False)["offcurve-test"]

        assert remapped_lsb == -72, remapped_lsb
        assert remapped_translation == 0, remapped_translation
        assert abs(source_pp1 - output_pp1) < 1e-9, (source_pp1, output_pp1)
        assert raw_remapped == raw_before, (raw_before, raw_remapped)
        assert aligned_remapped == raw_before, (raw_before, aligned_remapped)
        assert int(font["hmtx"].metrics["offcurve-test"][0]) == 611
        assert int(font["hhea"].advanceWidthMax) == 611
        assert int(font["hhea"].minLeftSideBearing) == -72
        assert int(font["hhea"].minRightSideBearing) == 100
        assert int(font["hhea"].xMaxExtent) == 500
        assert [
            int(font["head"].xMin), int(font["head"].yMin),
            int(font["head"].xMax), int(font["head"].yMax),
        ] == [-72, 0, 500, 700]

        font.save(path)
        font.close()
        reloaded = TTFont(path, lazy=False, recalcBBoxes=False, recalcTimestamp=False)
        raw_after = raw_glyf_bounds(reloaded)["offcurve-test"]
        aligned_after = glyph_bounds(reloaded, prefer_cff=False)["offcurve-test"]
        lsb_after = int(reloaded["hmtx"].metrics["offcurve-test"][1])
        reloaded.close()

        assert raw_after == raw_remapped, (raw_remapped, raw_after)
        assert aligned_after == aligned_remapped, (aligned_remapped, aligned_after)
        assert lsb_after == remapped_lsb, (remapped_lsb, lsb_after)

        report = {
            "status": "passed",
            "upem": upem,
            "controlPointXMin": -72,
            "actualCurveBoundsBeforeAndAfterSave": [float(v) for v in raw_after],
            "glyphSetAlignedBoundsBeforeAndAfterSave": [float(v) for v in aligned_after],
            "sourceLsb": lsb,
            "outputLsb": remapped_lsb,
            "storedGlyfXMin": -72,
            "legacyGlyphSetTranslation": translation,
            "outputGlyphSetTranslation": remapped_translation,
            "leftPhantomPointBefore": source_pp1,
            "leftPhantomPointAfter": output_pp1,
            "metricsRemapping": remap,
            "regression": "raw outline preserved; LSB remapped to preserve left phantom point and eliminate spurious glyf-control-point translation",
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
