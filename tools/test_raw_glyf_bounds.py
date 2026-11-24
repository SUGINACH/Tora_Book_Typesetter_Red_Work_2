#!/usr/bin/env python3
"""Regression test: raw TrueType contours must not inherit GlyphSet LSB alignment."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

from prove_font_conversion import glyph_bounds, raw_glyf_bounds


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
    pen.moveTo((123, 377))
    pen.qCurveTo((-72, 611), (123, 377))
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
        assert max(abs(a - b) for a, b in zip(raw_before, (25.5, 377.0, 123.0, 494.0))) < 1e-9, raw_before
        assert translation == 111, translation
        # GlyphSet alignment is horizontal only: xMin/xMax move by +111;
        # yMin/yMax must remain byte-for-byte at the same coordinates.
        differences = [b - a for a, b in zip(raw_before, aligned_before)]
        assert max(abs(a - b) for a, b in zip(differences, (translation, 0.0, translation, 0.0))) < 1e-9, differences

        font.save(path)
        font.close()
        reloaded = TTFont(path, lazy=False, recalcBBoxes=False, recalcTimestamp=False)
        raw_after = raw_glyf_bounds(reloaded)["offcurve-test"]
        aligned_after = glyph_bounds(reloaded, prefer_cff=False)["offcurve-test"]
        reloaded.close()

        assert raw_after == raw_before, (raw_before, raw_after)
        assert aligned_after == aligned_before, (aligned_before, aligned_after)

        report = {
            "status": "passed",
            "upem": upem,
            "controlPointXMin": -72,
            "actualCurveBoundsBeforeAndAfterSave": [float(v) for v in raw_after],
            "glyphSetAlignedBoundsBeforeAndAfterSave": [float(v) for v in aligned_after],
            "lsb": lsb,
            "storedGlyfXMin": -72,
            "glyphSetTranslation": translation,
            "regression": "raw geometry is invariant; metric-aligned GlyphSet adds exactly lsb - stored glyf xMin",
        }
        print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
