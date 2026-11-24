#!/usr/bin/env python3
"""Convert the official Unicode 18 GraphemeBreakTest into compact UTF-16 vectors."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

EXPECTED_HEADER = "# GraphemeBreakTest-18.0.0.txt"
SOURCE_COMMIT = "725fb6055cd42915c74bcf77b91aa8fb8ef18669"
SOURCE_PATH = "unicodetools/data/ucd/18.0.0/auxiliary/GraphemeBreakTest.txt"
MARKERS = {"÷", "×"}


def parse_case(line: str, line_number: int) -> dict | None:
    payload = line.split("#", 1)[0].strip()
    if not payload:
        return None
    tokens = payload.split()
    if len(tokens) < 3 or len(tokens) % 2 != 1:
        raise ValueError(f"Malformed test vector on line {line_number}")
    if tokens[0] not in MARKERS or tokens[-1] not in MARKERS:
        raise ValueError(f"Missing leading/trailing boundary marker on line {line_number}")

    codepoints: list[int] = []
    expected_boundaries: list[int] = []
    utf16_offset = 0
    for index in range(0, len(tokens), 2):
        marker = tokens[index]
        if marker not in MARKERS:
            raise ValueError(f"Invalid boundary marker on line {line_number}: {marker}")
        if marker == "÷":
            expected_boundaries.append(utf16_offset)
        if index + 1 == len(tokens):
            continue
        token = tokens[index + 1]
        if not re.fullmatch(r"[0-9A-Fa-f]{1,6}", token):
            raise ValueError(f"Invalid code point on line {line_number}: {token}")
        codepoint = int(token, 16)
        if codepoint > 0x10FFFF or 0xD800 <= codepoint <= 0xDFFF:
            raise ValueError(f"Not a Unicode scalar value on line {line_number}: {token}")
        codepoints.append(codepoint)
        utf16_offset += 2 if codepoint > 0xFFFF else 1

    if not expected_boundaries or expected_boundaries[0] != 0 or expected_boundaries[-1] != utf16_offset:
        raise ValueError(f"Test vector does not cover the complete string on line {line_number}")
    if expected_boundaries != sorted(set(expected_boundaries)):
        raise ValueError(f"Duplicate or unordered boundary on line {line_number}")

    return {
        "id": f"unicode18-gcb-line-{line_number}",
        "text": "".join(chr(cp) for cp in codepoints),
        "expectedBoundaries": expected_boundaries,
        "sourceLine": line_number
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: prepare_grapheme_fixtures.py GraphemeBreakTest.txt output.json")
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    lines = source.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != EXPECTED_HEADER:
        raise SystemExit(f"Expected exact Unicode 18 test header: {EXPECTED_HEADER}")
    fixtures = []
    for line_number, line in enumerate(lines, 1):
        case = parse_case(line, line_number)
        if case is not None:
            fixtures.append(case)
    if len(fixtures) < 800:
        raise SystemExit(f"Unexpectedly small Unicode 18 GraphemeBreakTest corpus: {len(fixtures)}")
    ids = [item["id"] for item in fixtures]
    if len(ids) != len(set(ids)):
        raise SystemExit("Duplicate test vector IDs")
    result = {
        "unicodeVersion": "18.0.0",
        "sourceRepository": "unicode-org/unicodetools",
        "sourceCommit": SOURCE_COMMIT,
        "sourcePath": SOURCE_PATH,
        "sourceHeader": EXPECTED_HEADER,
        "testCount": len(fixtures),
        "fixtures": fixtures
    }
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({
        "unicodeVersion": result["unicodeVersion"],
        "sourceCommit": SOURCE_COMMIT,
        "testCount": len(fixtures),
        "outputBytes": target.stat().st_size
    }, sort_keys=True))


if __name__ == "__main__":
    main()
