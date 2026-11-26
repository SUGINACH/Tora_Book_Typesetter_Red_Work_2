import json
import argparse
import fitz  # PyMuPDF (pip install pymupdf)


def parse_pages(spec: str, total_pages: int) -> set[int]:
    if not spec or spec.lower() == "all":
        return set(range(1, total_pages + 1))
    pages = set()
    for part in spec.split(","):
        part = part.strip()
        if "-" in part:
            start, end = map(int, part.split("-"))
            pages.update(range(max(1, start), min(total_pages, end) + 1))
        else:
            p = int(part)
            if 1 <= p <= total_pages:
                pages.add(p)
    return pages


def int_to_hex(color_int: int | None) -> str | None:
    if color_int is None:
        return None
    return f"#{color_int & 0xFFFFFF:06x}"


def rgb_tuple_to_hex(rgb) -> str | None:
    if not rgb or len(rgb) < 3:
        return None
    r, g, b = [max(0, min(255, int(round(c * 255)))) for c in rgb[:3]]
    return f"#{r:02x}{g:02x}{b:02x}"


def round_box(box) -> list[float]:
    return [round(v, 2) for v in box]


def extract_page_dump(pdf_path: str, page_spec: str, detail: str):
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    target_pages = parse_pages(page_spec, total_pages)

    output = {
        "pdf": pdf_path,
        "total_pages": total_pages,
        "inspected_pages": sorted(target_pages),
        "detail_level": detail,
        "pages": []
    }

    for page_idx in range(total_pages):
        p_num = page_idx + 1
        if p_num not in target_pages:
            continue

        page = doc[page_idx]
        p_rect = round_box(page.rect)

        # 1. חילוץ מלא של טקסט: בלוקים -> שורות -> מקטעים (Spans) -> תווים בודדים (Chars)
        raw = page.get_text("rawdict")
        text_blocks = []

        for b_idx, block in enumerate(raw.get("blocks", [])):
            if block["type"] != 0:
                continue

            lines_out = []
            prev_line_y0 = None

            for l_idx, line in enumerate(block["lines"]):
                l_bbox = round_box(line["bbox"])
                line_spacing = round(l_bbox - prev_line_y0, 2) if prev_line_y0 is not None else None
                prev_line_y0 = l_bbox

                spans_out = []
                full_line_chars = []

                for span in line["spans"]:
                    span_chars = span.get("chars", [])
                    span_text = "".join(c["c"] for c in span_chars)
                    full_line_chars.append(span_text)

                    span_obj = {
                        "text": span_text,
                        "bbox": round_box(span["bbox"]),
                        "font": span["font"],
                        "size": round(span["size"], 2),
                        "color": int_to_hex(span.get("color")),
                        "flags": span.get("flags"),
                    }

                    # ברמת פירוט 'chars': מחזיר כל אות/תו/ניקוד בנפרד עם מיקום מדויק ורווח מהאות הקודמת
                    if detail == "chars":
                        chars_list = []
                        prev_char_box = None
                        for ch in span_chars:
                            c_box = round_box(ch["bbox"])
                            gap_from_prev = None
                            if prev_char_box is not None:
                                gap_rtl = round(prev_char_box - c_box, 2)
                                gap_ltr = round(c_box - prev_char_box, 2)
                                gap_from_prev = gap_rtl if abs(gap_rtl) < abs(gap_ltr) else gap_ltr
                            prev_char_box = c_box

                            chars_list.append({
                                "c": ch["c"],
                                "bbox": c_box,
                                "origin": [round(ch["origin"], 2), round(ch["origin"], 2)],
                                "gap_pt": gap_from_prev
                            })
                        span_obj["chars"] = chars_list

                    spans_out.append(span_obj)

                lines_out.append({
                    "line_index": l_idx,
                    "text": "".join(full_line_chars),
                    "bbox": l_bbox,
                    "width": round(l_bbox - l_bbox, 2),
                    "height": round(l_bbox - l_bbox, 2),
                    "line_spacing_from_prev_pt": line_spacing,
                    "spans": spans_out
                })

            b_box = round_box(block["bbox"])
            text_blocks.append({
                "block_index": b_idx,
                "bbox": b_box,
                "width": round(b_box - b_box, 2),
                "height": round(b_box - b_box, 2),
                "lines": lines_out
            })

        # 2. חילוץ כל האלמנטים הווקטוריים (קווים, מסגרות, רקעים, צורות ועיטורים וקטוריים)
        vectors = []
        for v_idx, d in enumerate(page.get_drawings()):
            v_box = round_box(d["rect"])
            vectors.append({
                "index": v_idx,
                "bbox": v_box,
                "width": round(v_box - v_box, 2),
                "height": round(v_box - v_box, 2),
                "stroke_color": rgb_tuple_to_hex(d.get("color")),
                "fill_color": rgb_tuple_to_hex(d.get("fill")),
                "stroke_width": round(d["width"], 2) if d.get("width") is not None else None,
                "items_count": len(d.get("items", []))
            })

        # 3. חילוץ כל התמונות / עיטורי שער סרוקים
        images = []
        for img_idx, img in enumerate(page.get_images(full=True)):
            xref = img
            try:
                i_box = round_box(page.get_image_bbox(img))
            except Exception:
                i_box = None
            images.append({
                "index": img_idx,
                "xref": xref,
                "bbox": i_box,
                "width_pt": round(i_box - i_box, 2) if i_box else None,
                "height_pt": round(i_box - i_box, 2) if i_box else None,
                "pixel_size": [img, img]
            })

        output["pages"].append({
            "page": p_num,
            "page_size_pt": {"width": p_rect, "height": p_rect},
            "text_blocks": text_blocks,
            "vector_graphics": vectors,
            "images": images
        })

    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Full PDF Page Geometry & Style Extractor for AI Inspection")
    parser.add_argument("pdf", help="Path to the PDF file")
    parser.add_argument("--pages", default="1", help="Pages to extract, e.g. '1', '2-5', '1,10,15', or 'all'")
    parser.add_argument(
        "--detail",
        choices=["spans", "chars"],
        default="spans",
        help="'spans' = block/line/word-run level (compact); 'chars' = every single character & diacritic bbox"
    )
    args = parser.parse_args()

    extract_page_dump(args.pdf, args.pages, args.detail)
