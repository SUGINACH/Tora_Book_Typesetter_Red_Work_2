#!/usr/bin/env python3
# pdf_identity.py — B1: זהות שלושת הקבצים (SHA-256, גודל, עמודים, תיבות, מידע,
# מבנה אובייקטים, גופנים מוטמעים, חילוץ טקסט מלא + hash, הפרשי NE1↔NE2).
#
# **תיקון ביקורת ההמשך 21.11 (הטמעת גופנים):** בגרסה הקודמת נמדד
# total_raw_font_stream_bytes=0 בכל הקבצים — מדידה שבורה, לא היעדר הטמעה:
# xref_stream_raw() הופעל על אובייקט ה-Font (מילון Type0 — איננו stream)
# ולכן נזרקה חריגה שנבלעה ב-silent except. הזרם המוטמע חי בשרשרת
# Type0 → DescendantFonts[0] (CIDFontType2) → FontDescriptor → FontFile2.
# כעת נמדדת ההטמעה בשלוש דרכים עצמאיות ומוצלבות:
#   (1) doc.extract_font(xref) — מאחזר את מאגר הגופן בפועל (בתים + sha256);
#   (2) מעקב ידני עד זרם ה-FontFile2/3 + Length מוצהר + גודל זרם גולמי;
#   (3) Poppler pdffonts — עמודות emb/sub/uni (הפלט המלא נשמר ב-record).
import hashlib, json, subprocess, sys, os, re
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

def ref_of(v):
    m = re.search(r'(\d+) 0 R', v or '')
    return int(m.group(1)) if m else None

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
    # גופנים בשימוש — ספירה, שמות
    fonts = {}
    for pno in range(doc.page_count):
        for f in doc.get_page_fonts(pno, full=True):
            xref, ext, ftype, basefont, name, enc = f[0], f[1], f[2], f[3], f[4], f[5]
            key = (ext, ftype, basefont)
            fonts.setdefault(key, 0)
            fonts[key] += 1
    rec['fonts'] = [ {'ext': k[0], 'type': k[1], 'basefont': k[2], 'pages_referenced': v} for k, v in sorted(fonts.items()) ]
    # ── הטמעת גופנים — מדידה מתוקנת (ביקורת ההמשך 21.11) ──
    seen_xrefs = set()
    tot_font_bytes = 0
    embed_recs = []
    for pno in range(doc.page_count):
        for f in doc.get_page_fonts(pno, full=True):
            xref = f[0]
            if xref in seen_xrefs: continue
            seen_xrefs.add(xref)
            er = {'xref': xref, 'basefont': f[3], 'type': f[2]}
            # (1) extract_font — המאגר בפועל
            try:
                fname, fext, ftype2, buf = doc.extract_font(xref)
                er['extract_bytes'] = len(buf)
                er['extract_sha256'] = hashlib.sha256(buf).hexdigest() if buf else None
                er['embedded'] = len(buf) > 0
            except Exception as e:
                er['extract_error'] = str(e); er['embedded'] = False
            # (2) מעקב ידני עד זרם ה-FontFile2/3
            try:
                desc = None
                t, v = doc.xref_get_key(xref, 'Subtype')
                if 'Type0' in (v or ''):
                    desc = ref_of(doc.xref_get_key(xref, 'DescendantFonts')[1])
                else:
                    desc = xref
                fd = ref_of(doc.xref_get_key(desc, 'FontDescriptor')[1]) if desc else None
                ff = None; ff_key = None
                if fd:
                    for k in ('FontFile2', 'FontFile3', 'FontFile'):
                        r = ref_of(doc.xref_get_key(fd, k)[1])
                        if r: ff, ff_key = r, k; break
                er['fontfile_key'] = ff_key
                if ff:
                    er['fontfile_declared_length'] = int(doc.xref_get_key(ff, 'Length')[1])
                    st = doc.xref_stream_raw(ff)
                    er['fontfile_raw_bytes'] = len(st)
                    tot_font_bytes += len(st)
            except Exception as e:
                er['trace_error'] = str(e)
            embed_recs.append(er)
    rec['unique_font_xrefs'] = len(seen_xrefs)
    rec['embedded_fonts_detail'] = embed_recs
    rec['n_embedded_extract_font'] = sum(1 for r in embed_recs if r.get('embedded'))
    # (3) Poppler pdffonts — הפלט המלא
    try:
        pf = subprocess.run(['pdffonts', path], capture_output=True, text=True, timeout=120)
        rec['pdffonts'] = [l for l in pf.stdout.strip().splitlines()]
        # שורת גופן: name [type...] encoding emb sub uni obj gen — emb הוא
        # השדה החמישי מהסוף (…, emb, sub, uni, object, gen)
        emb_n = 0
        for l in rec['pdffonts'][2:]:
            parts = l.split()
            if len(parts) >= 6 and parts[-5] in ('yes', 'no'):
                if parts[-5] == 'yes': emb_n += 1
        rec['pdffonts_emb_yes'] = emb_n
    except Exception as e:
        rec['pdffonts_error'] = str(e)
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

with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'identity.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print('identity.json written')

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
