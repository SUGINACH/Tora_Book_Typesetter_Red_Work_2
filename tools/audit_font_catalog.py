#!/usr/bin/env python3
"""Audit every IMUD font asset against the current measurement/PDF capabilities.

This is an inventory gate, not a runtime converter. It deliberately does not
rewrite catalogs or source fonts. The generated JSON identifies which assets
can enter the existing SFNT metrics parser and which can be subset by the
current TrueType-only PDF writer.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from fontTools.ttLib import TTFont

REQUIRED_METRICS_TABLES = {"head", "maxp", "hhea", "hmtx", "cmap"}
HEBREW_LETTERS = set(range(0x05D0, 0x05EB))
HEBREW_MARKS = set(range(0x0591, 0x05C8))
HEBREW_PUNCTUATION = {0x05F3, 0x05F4}
ASCII_TEXT = set(range(0x20, 0x7F))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_catalog(path: Path, label: str) -> list[dict[str, Any]]:
    if not path.is_file():
        raise FileNotFoundError(f"{label} catalog missing: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError(f"{label} catalog must be a JSON array")
    for index, entry in enumerate(data):
        if not isinstance(entry, dict) or not entry.get("family") or not entry.get("file"):
            raise ValueError(f"{label}[{index}] must contain non-empty family and file")
    return data


def axis_manifest(font: TTFont) -> list[dict[str, Any]]:
    if "fvar" not in font:
        return []
    return [
        {
            "tag": axis.axisTag,
            "min": float(axis.minValue),
            "default": float(axis.defaultValue),
            "max": float(axis.maxValue),
        }
        for axis in font["fvar"].axes
    ]


def audit_one(path: Path, filename: str, aliases: list[dict[str, str]]) -> dict[str, Any]:
    item: dict[str, Any] = {
        "file": filename,
        "aliases": aliases,
        "exists": path.is_file(),
    }
    if not path.is_file():
        item["error"] = "missing-file"
        return item

    item["bytes"] = path.stat().st_size
    item["sha256"] = sha256_file(path)
    try:
        font = TTFont(
            str(path),
            lazy=False,
            recalcBBoxes=False,
            recalcTimestamp=False,
        )
        tables = set(font.keys())
        cmap = font.getBestCmap() or {}
        codepoints = set(cmap.keys())
        has_glyf = "glyf" in tables and "loca" in tables
        has_cff = "CFF " in tables
        has_cff2 = "CFF2" in tables
        required_missing = sorted(REQUIRED_METRICS_TABLES - tables)
        outline = (
            "glyf"
            if has_glyf
            else "cff2"
            if has_cff2
            else "cff"
            if has_cff
            else "unknown"
        )
        flavor = getattr(font, "flavor", None)
        item.update(
            {
                "parseOk": True,
                "sourceFlavor": flavor or "sfnt",
                "outline": outline,
                "tableTags": sorted(t for t in tables if len(t) == 4),
                "unitsPerEm": int(font["head"].unitsPerEm) if "head" in tables else None,
                "glyphCount": int(font["maxp"].numGlyphs) if "maxp" in tables else None,
                "unicodeCodepoints": len(codepoints),
                "hebrewLettersMapped": len(codepoints & HEBREW_LETTERS),
                "hebrewMarksMapped": len(codepoints & HEBREW_MARKS),
                "hebrewPunctuationMapped": len(codepoints & HEBREW_PUNCTUATION),
                "asciiTextMapped": len(codepoints & ASCII_TEXT),
                "hasGSUB": "GSUB" in tables,
                "hasGPOS": "GPOS" in tables,
                "variationAxes": axis_manifest(font),
                "metricsTablesMissing": required_missing,
                "metricsParserReadyAfterSfntDecode": not required_missing,
                "currentPdfTrueTypeSubsetReady": has_glyf and not required_missing,
                "pdfOutlineBlocker": None if has_glyf else f"current-font-subset-requires-glyf-loca:{outline}",
                "variableFontNeedsExplicitAxisPolicy": "fvar" in tables,
            }
        )
        font.close()
    except Exception as exc:  # report per-file failures; continue auditing the catalog
        item.update(
            {
                "parseOk": False,
                "error": f"{type(exc).__name__}: {exc}",
            }
        )
    return item


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository root (defaults to the parent of tools/)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("artifacts/font-catalog-audit/report.json"),
        help="JSON report path (relative to repo root unless absolute)",
    )
    args = parser.parse_args()
    root = args.repo_root.resolve()
    assets = root / "red-build" / "ui" / "assets" / "imud"
    core = read_catalog(assets / "imud-fonts.json", "core")
    extended = read_catalog(assets / "fonts-extended.json", "extended")

    aliases_by_file: dict[str, list[dict[str, str]]] = defaultdict(list)
    family_sources: dict[str, set[str]] = defaultdict(set)
    for label, entries in (("core", core), ("extended", extended)):
        for entry in entries:
            filename = str(entry["file"])
            aliases_by_file[filename].append(
                {"catalog": label, "family": str(entry["family"]), "format": str(entry.get("format", ""))}
            )
            family_sources[str(entry["family"])].add(label)

    fonts_dir = assets / "fonts"
    report_items = [
        audit_one(fonts_dir / filename, filename, aliases)
        for filename, aliases in sorted(aliases_by_file.items())
    ]
    errors = [item for item in report_items if not item.get("parseOk")]
    by_outline = Counter(item.get("outline", "unreadable") for item in report_items if item.get("parseOk"))
    by_flavor = Counter(item.get("sourceFlavor", "unreadable") for item in report_items if item.get("parseOk"))
    variable = [item for item in report_items if item.get("variationAxes")]
    no_hebrew = [item for item in report_items if item.get("parseOk") and item.get("hebrewLettersMapped", 0) == 0]
    incomplete_hebrew = [
        item for item in report_items
        if item.get("parseOk") and item.get("hebrewLettersMapped", 0) not in (0, len(HEBREW_LETTERS))
    ]
    family_collisions = {
        family: sorted(sources)
        for family, sources in family_sources.items()
        if len(sources) > 1
    }
    summary = {
        "coreCatalogEntries": len(core),
        "extendedCatalogEntries": len(extended),
        "uniqueFontFiles": len(report_items),
        "parseFailures": len(errors),
        "outlineCounts": dict(sorted(by_outline.items())),
        "sourceFlavorCounts": dict(sorted(by_flavor.items())),
        "variableFonts": len(variable),
        "trueTypePdfSubsetCandidates": sum(bool(i.get("currentPdfTrueTypeSubsetReady")) for i in report_items),
        "metricsCandidatesAfterSfntDecode": sum(bool(i.get("metricsParserReadyAfterSfntDecode")) for i in report_items),
        "fontsWithoutHebrewLetters": len(no_hebrew),
        "fontsWithPartialHebrewAlphabet": len(incomplete_hebrew),
        "familyPresentInBothCatalogs": len(family_collisions),
    }
    report = {
        "schema": "imud-font-catalog-audit-v1",
        "repository": "SUGINACH/Tora_Book_Typesetter_Red_Work_2",
        "summary": summary,
        "familyCatalogCollisions": family_collisions,
        "parseFailures": errors,
        "variableFonts": [
            {"file": i["file"], "aliases": i["aliases"], "variationAxes": i["variationAxes"]}
            for i in variable
        ],
        "fonts": report_items,
    }

    output = args.output if args.output.is_absolute() else root / args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"report: {output}")
    # Missing or corrupt files are fatal. Unsupported outline/variation types
    # remain visible findings for the next implementation decision; they do
    # not make this inventory-only workflow fail.
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
