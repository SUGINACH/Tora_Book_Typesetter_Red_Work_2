#!/usr/bin/env python3
# pdf_identity.py — B1: זהות שלושת הקבצים (SHA-256, גודל, עמודים, תיבות, מידע,
# מבנה אובייקטים, גופנים מוטמעים, חילוץ טקסט מלא + hash, הפרשי NE1↔NE2).
import hashlib, json, subprocess, sys, os
import fitz

FILES = {
    'OLD': '/tmp/pdf-forensic/old_engine.pdf',
    'NE1': '/tmp/pdf-forensic/new_engine_1.pdf',
    'NE2': '/tmp/pdf-forensic/new_engine_2.pdf',
}

def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

out = {}
for tag, path in FILES.items():
    rec = {}
    rec['size_bytes'] = os.path.getsize(path)
    rec['sha256'] = sha256(path)
    doc = fitz.open(path)
    rec['page_count'] = doc.page_count
    rec['is_encrypted'] = doc.is_encrypted
    rec['pdf_version'] = doc.metadata.get('format')
    rec['metadata'] = {k: v for k, v in doc.metadata.items() if v and k != 'format'}
    # MediaBox/CropBox — דגימה מכל הסוגים (מציאת ערכים ייחודיים)
    boxes = set()
    for p in doc:
        mb = tuple(round(v, 3) for v in p.mediabox)
        cb = tuple(round(v, 3) for v in p.cropbox)
        boxes.add((mb, cb))
    rec['unique_boxes'] = [ [list(a), list(b)] for a, b in sorted(boxes) ]
    # גופנים מוטמעים — ספירה, שמות, גדלים
    fonts = {}
    for pno in range(doc.page_count):
        for f in doc.get_page_fonts(pno, full=True):
            xref, ext, ftype, basefont, name, enc = f[0], f[1], f[2], f[3], f[4], f[5]
            key = (ext, ftype, basefont)
            fonts.setdefault(key, 0)
            fonts[key] += 1
    rec['fonts'] = [ {'ext': k[0], 'type': k[1], 'basefont': k[2], 'pages_referenced': v} for k, v in sorted(fonts.items()) ]
    # גודל אובייקטי הזרם של הגופנים (תתי-גופנים)
    font_stream_sizes = []
    for (ext, ftype, basefont), _ in fonts.items():
        pass
    seen_xrefs = set()
    tot_font_bytes = 0
    for pno in range(doc.page_count):
        for f in doc.get_page_fonts(pno, full=True):
            xref = f[0]
            if xref in seen_xrefs: continue
            seen_xrefs.add(xref)
            try:
                st = doc.xref_stream_raw(xref)
                tot_font_bytes += len(st)
            except Exception:
                pass
    rec['unique_font_xrefs'] = len(seen_xrefs)
    rec['total_raw_font_stream_bytes'] = tot_font_bytes
    # חילוץ טקסט מלא
    txt = ''.join(p.get_text() for p in doc)
    rec['text_chars'] = len(txt)
    rec['text_words'] = len(txt.split())
    rec['text_sha256'] = hashlib.sha256(txt.encode('utf-8')).hexdigest()
    # layout-mode טקסט גם כן
    rec['text_sorted_sha256'] = hashlib.sha256(''.join(p.get_text(sort=True) for p in doc).encode('utf-8')).hexdigest()
    doc.close()
    out[tag] = rec

print(json.dumps(out, ensure_ascii=False, indent=1))
# הפרשי NE1↔NE2 ברמת העמוד
d1 = fitz.open(FILES['NE1']); d2 = fitz.open(FILES['NE2'])
print('\n=== NE1 vs NE2 page-level ===')
print('pages:', d1.page_count, d2.page_count)
diff_pages = []
for i in range(min(d1.page_count, d2.page_count)):
    t1 = d1[i].get_text(); t2 = d2[i].get_text()
    r1 = (d1[i].rect); r2 = (d2[i].rect)
    if t1 != t2 or (r1.x0, r1.y0, r1.x1, r1.y1) != (r2.x0, r2.y0, r2.x1, r2.y1):
        diff_pages.append(i + 1)
print('pages with text/rect diff:', diff_pages if diff_pages else 'NONE — text and page rects identical on every page')
d1.close(); d2.close()
