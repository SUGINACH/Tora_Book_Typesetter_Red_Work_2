#!/usr/bin/env python3
"""Prepare a pinned unicode-bidi checkout with official Unicode 18.0.0 data.

The upstream crate currently carries Unicode 17 tables. This POC regenerates
those tables from the versioned Unicode 18 UCD inputs in a temporary checkout.
It never edits the RED engine or the upstream repository.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

PINNED_REVISION = "9a8c7b03be01def5cf7014b89d5af90f7382fdad"
EXPECTED_CRATE_VERSION = "0.3.18"

# UCD long property names used only in DerivedBidiClass.txt @missing lines.
LONG_TO_SHORT = {
    "Left_To_Right": "L",
    "Right_To_Left": "R",
    "Arabic_Letter": "AL",
    "European_Number": "EN",
    "European_Separator": "ES",
    "European_Terminator": "ET",
    "Arabic_Number": "AN",
    "Common_Separator": "CS",
    "Paragraph_Separator": "B",
    "Segment_Separator": "S",
    "Whitespace": "WS",
    "Other_Neutral": "ON",
    "Boundary_Neutral": "BN",
    "Nonspacing_Mark": "NSM",
    "Left_To_Right_Embedding": "LRE",
    "Right_To_Left_Embedding": "RLE",
    "Left_To_Right_Override": "LRO",
    "Right_To_Left_Override": "RLO",
    "Pop_Directional_Format": "PDF",
    "Left_To_Right_Isolate": "LRI",
    "Right_To_Left_Isolate": "RLI",
    "First_Strong_Isolate": "FSI",
    "Pop_Directional_Isolate": "PDI",
}


def parse_range(value: str) -> tuple[int, int]:
    parts = value.strip().split("..")
    if len(parts) == 1:
        point = int(parts[0], 16)
        return point, point
    if len(parts) != 2:
        raise ValueError(f"Invalid UCD code-point range: {value!r}")
    start, end = (int(part, 16) for part in parts)
    if start > end or end > 0x10FFFF:
        raise ValueError(f"Out-of-range UCD interval: {value!r}")
    return start, end


def load_unassigned_overrides(ucd_file: Path, assigned: set[int]) -> dict[int, str]:
    """Apply ordered @missing defaults, then explicit UCD entries.

    UnicodeData.txt already supplies the class of assigned code points. Here
    we fill only unassigned points, including explicit BN noncharacters and
    default-ignorable ranges, while preserving the order of @missing rules.
    """
    overrides: dict[int, str] = {}
    for raw_line in ucd_file.read_text(encoding="utf-8").splitlines():
        stripped = raw_line.strip()
        is_missing = stripped.startswith("# @missing:")
        if is_missing:
            payload = stripped.split("# @missing:", 1)[1].strip()
        else:
            payload = raw_line.split("#", 1)[0].strip()
            if not payload:
                continue

        fields = [part.strip() for part in payload.split(";")]
        if len(fields) < 2:
            continue
        start, end = parse_range(fields[0])
        class_name = fields[1]
        short_class = LONG_TO_SHORT.get(class_name, class_name)
        if len(short_class) not in (1, 2):
            raise ValueError(f"Unknown Bidi_Class value {class_name!r} in {ucd_file}")

        # L is the global default. Avoid materializing the whole Unicode range;
        # explicit L rows still overwrite any more-specific @missing range.
        if is_missing and short_class == "L":
            continue
        for codepoint in range(start, end + 1):
            if 0xD800 <= codepoint <= 0xDFFF or codepoint in assigned:
                continue
            overrides[codepoint] = short_class
    return overrides


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: prepare_unicode_bidi.py /path/to/unicode-bidi-checkout")
    root = Path(sys.argv[1]).resolve()
    cargo_toml = root / "Cargo.toml"
    generator_path = root / "tools" / "generate.py"
    tables_path = root / "src" / "char_data" / "tables.rs"
    if not cargo_toml.is_file() or not generator_path.is_file() or not tables_path.is_file():
        raise SystemExit(f"Not a unicode-bidi source checkout: {root}")

    revision = subprocess.check_output(
        ["git", "-C", str(root), "rev-parse", "HEAD"], text=True
    ).strip()
    if revision != PINNED_REVISION:
        raise SystemExit(f"unicode-bidi revision mismatch: {revision} != {PINNED_REVISION}")

    cargo = cargo_toml.read_text(encoding="utf-8")
    if not re.search(r'(?m)^version\s*=\s*"0\.3\.18"\s*$', cargo):
        raise SystemExit("Pinned unicode-bidi Cargo.toml is not version 0.3.18")

    tables = tables_path.read_text(encoding="utf-8")
    match = re.search(r"pub const UNICODE_VERSION: \(u64, u64, u64\) = \((\d+),\s*(\d+),\s*(\d+)\);", tables)
    if not match or tuple(map(int, match.groups())) != (17, 0, 0):
        raise SystemExit("Upstream Unicode data baseline changed; re-audit before regenerating")

    generator = generator_path.read_text(encoding="utf-8")
    source_old = 'UNIDATA_SOURCE = "UNIDATA"'
    source_new = 'UNIDATA_SOURCE = "18.0.0/ucd"'
    if generator.count(source_old) != 1:
        raise SystemExit("Could not uniquely locate upstream UCD source setting")
    generator = generator.replace(source_old, source_new, 1)
    generator = generator.replace(
        "http://www.unicode.org/Public/%s/%s",
        "https://www.unicode.org/Public/%s/%s",
    )

    start_marker = "    # Default Bidi_Class for unassigned codepoints."
    end_marker = "    return (group_categories(bidi_class), on_decomps)"

    replacement = r'''    # Unicode 18: use the versioned DerivedBidiClass.txt source of truth.
    # UnicodeData.txt above remains the source for assigned code points and
    # canonical decompositions used by bracket normalization.
    derived_path = os.path.join(DATA_DIR, "DerivedBidiClass.txt")
    fetch("extracted/DerivedBidiClass.txt", derived_path)
    assigned = set(udict.keys())
    unassigned_overrides = load_derived_bidi_classes_for_generator(derived_path, assigned)
    for code, bidi in unassigned_overrides.items():
        if bidi != "L":
            if bidi not in bidi_class:
                bidi_class[bidi] = []
            bidi_class[bidi].append(code)

'''
    # Keep the helper in the generated script, not in the checked-out upstream
    # crate. This helper parses official UCD rows with the same strict rules
    # as the standalone preparation check.
    helper_marker = "def load_unicode_data():"
    helper = r'''def load_derived_bidi_classes_for_generator(path, assigned):
    long_to_short = {
        "Left_To_Right": "L", "Right_To_Left": "R", "Arabic_Letter": "AL",
        "European_Number": "EN", "European_Separator": "ES",
        "European_Terminator": "ET", "Arabic_Number": "AN",
        "Common_Separator": "CS", "Paragraph_Separator": "B",
        "Segment_Separator": "S", "Whitespace": "WS", "Other_Neutral": "ON",
        "Boundary_Neutral": "BN", "Nonspacing_Mark": "NSM",
        "Left_To_Right_Embedding": "LRE", "Right_To_Left_Embedding": "RLE",
        "Left_To_Right_Override": "LRO", "Right_To_Left_Override": "RLO",
        "Pop_Directional_Format": "PDF", "Left_To_Right_Isolate": "LRI",
        "Right_To_Left_Isolate": "RLI", "First_Strong_Isolate": "FSI",
        "Pop_Directional_Isolate": "PDI",
    }
    overrides = {}
    with open(path, encoding="utf-8") as source:
        for raw_line in source:
            line = raw_line.strip()
            is_missing = line.startswith("# @missing:")
            if is_missing:
                payload = line.split("# @missing:", 1)[1].strip()
            else:
                payload = raw_line.split("#", 1)[0].strip()
                if not payload:
                    continue
            fields = [part.strip() for part in payload.split(";")]
            if len(fields) < 2:
                continue
            code_range = fields[0].split("..")
            if len(code_range) == 1:
                first = last = int(code_range[0], 16)
            elif len(code_range) == 2:
                first, last = int(code_range[0], 16), int(code_range[1], 16)
            else:
                raise ValueError("Invalid DerivedBidiClass range: " + fields[0])
            bidi = long_to_short.get(fields[1], fields[1])
            if is_missing and bidi == "L":
                continue
            if len(bidi) not in (1, 2) or first > last or last > 0x10FFFF:
                raise ValueError("Invalid DerivedBidiClass value/range: " + payload)
            for code in range(first, last + 1):
                if 0xD800 <= code <= 0xDFFF or code in assigned:
                    continue
                overrides[code] = bidi
    return overrides

'''
    if generator.count(helper_marker) != 1 or "load_derived_bidi_classes_for_generator" in generator:
        raise SystemExit("Unexpected upstream generator structure; refusing to patch")
    generator = generator.replace(helper_marker, helper + helper_marker, 1)
    # Recalculate offsets after inserting the helper before load_unicode_data.
    start = generator.find(start_marker)
    end = generator.find(end_marker, start)
    if start < 0 or end < 0:
        raise SystemExit("Could not locate upstream unassigned Bidi_Class generation block")
    generator = generator[:start] + replacement + generator[end:]
    generator_path.write_text(generator, encoding="utf-8")

    print({
        "crateVersion": EXPECTED_CRATE_VERSION,
        "sourceRevision": revision,
        "unicodeDataTarget": "18.0.0",
        "baselineUnicodeVersion": "17.0.0",
        "patchedDerivedBidiClass": True,
        "patchedHttpsFetch": True,
    })


if __name__ == "__main__":
    main()
