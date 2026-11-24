#!/usr/bin/env python3
"""Convert a WOFF2 font to an uncompressed SFNT file for the HarfBuzz runtime PoC."""
from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
except ImportError as exc:
    raise SystemExit("fontTools is required for the WOFF2 normalization PoC") from exc


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: normalize_woff2.py input.woff2 output.sfnt")
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    if not source.is_file():
        raise SystemExit(f"missing WOFF2 source: {source}")
    target.parent.mkdir(parents=True, exist_ok=True)
    font = TTFont(source, recalcBBoxes=False, recalcTimestamp=False)
    if font.flavor != "woff2":
        raise SystemExit(f"expected WOFF2 input, got flavor={font.flavor!r}")
    font.flavor = None
    font.flavorData = None
    font.save(target, reorderTables=True)
    normalized = TTFont(target, recalcBBoxes=False, recalcTimestamp=False)
    if normalized.flavor is not None:
        raise SystemExit(f"normalization did not produce SFNT: flavor={normalized.flavor!r}")
    if "cmap" not in normalized or "head" not in normalized or "maxp" not in normalized:
        raise SystemExit("normalized SFNT is missing required cmap/head/maxp tables")
    table_tags = sorted(normalized.keys())
    if "CFF2" in table_tags:
        outline_format = "CFF2"
    elif "CFF " in table_tags or "CFF" in table_tags:
        outline_format = "CFF"
    elif "glyf" in table_tags and "loca" in table_tags:
        outline_format = "glyf"
    else:
        outline_format = "unknown"
    report = {
        "source": source.name,
        "normalized": target.name,
        "bytes": target.stat().st_size,
        "glyphCount": normalized["maxp"].numGlyphs,
        "unitsPerEm": normalized["head"].unitsPerEm,
        "outlineFormat": outline_format,
        "tableTags": table_tags,
        "signatureHex": target.read_bytes()[:4].hex(),
    }
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
