#!/usr/bin/env python3
# pdf_verify.py — B2/B3: מדידות עצמאיות לאימות F01-F18 על שלושת הקבצים.
# פלט: JSON גולמי לדוח + תדפיס מסכם.
import json, sys, hashlib, collections, re
import fitz

FILES = {
    'OLD': '/tmp/pdf-forensic/old_engine.pdf',
    'NE1': '/tmp/pdf-forensic/new_engine_1.pdf',
    'NE2': '/tmp/pdf-forensic/new_engine_2.pdf',
}

def spans(page):
    d = page.get_text('dict')
    for b in d['blocks']:
        for l in b.get('lines', []):
            for s in l.get('spans', []):
                yield s, l

def measure(path):
    doc = fitz.open(path)
    m = {
        'pages': doc.page_count,
        'font_size_hist': collections.Counter(),   # (font, size) -> chars
        'font_size_spans': collections.Counter(),  # (font, size) -> spans
        'per_page': [],
        'drawings_total': 0,
        'pages_with_drawings': 0,
        'images_total': 0,
    }
    for pno in range(doc.page_count):
        p = doc[pno]
        pm = {'i': pno + 1, 'words': 0, 'chars': 0, 'drawings': 0, 'images': len(p.get_images()),
              'spans': []}
        txt = p.get_text()
        pm['words'] = len(txt.split())
        pm['chars'] = len(txt)
        dr = p.get_drawings()
        pm['drawings'] = len(dr)
        m['drawings_total'] += len(dr)
        if dr: m['pages_with_drawings'] += 1
        m['images_total'] += pm['images']
        for s, l in spans(p):
            key = (s['font'], round(s['size'], 2))
            m['font_size_hist'][key] += len(s['text'])
            m['font_size_spans'][key] += 1
            pm['spans'].append({
                'x0': round(s['bbox'][0], 2), 'y0': round(s['bbox'][1], 2),
                'x1': round(s['bbox'][2], 2), 'y1': round(s['bbox'][3], 2),
                'font': s['font'], 'size': round(s['size'], 2), 'text': s['text'][:60]
            })
        m['per_page'].append(pm)
    m['font_size_hist'] = {f'{k[0]}@{k[1]}': v for k, v in m['font_size_hist'].most_common()}
    m['font_size_spans'] = {f'{k[0]}@{k[1]}': v for k, v in m['font_size_spans'].most_common(40)}
    doc.close()
    return m

out = {}
for tag, path in FILES.items():
    out[tag] = measure(path)
    print(f"[{tag}] measured: {out[tag]['pages']} pages, drawings={out[tag]['drawings_total']}, images={out[tag]['images_total']}")

with open('/tmp/pdf-forensic/measure_raw.json', 'w') as f:
    json.dump(out, f, ensure_ascii=False)

# ── סיכומי אימות לפי ממצא ──
def top_spans(m, pred, limit=None):
    return {k: v for k, v in m['font_size_spans'].items() if pred(k)}

print('\n=== F02: window words 18pt ===')
for tag in FILES:
    m = out[tag]
    hits = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@18.0')}
    print(f"  {tag}: {hits}")

print('\n=== F09: 10pt spans ===')
for tag in FILES:
    m = out[tag]
    hits = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@10.0')}
    print(f"  {tag}: {hits}")

print('\n=== F10: margin notes 6pt / 9pt ===')
for tag in FILES:
    m = out[tag]
    hits6 = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@6.0')}
    hits9 = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@9.0') or k.endswith('@9.6')}
    print(f"  {tag}: @6pt={hits6} | @9/9.6pt={hits9}")

print('\n=== F08: סימן 20pt ===')
for tag in FILES:
    m = out[tag]
    hits = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@20.0')}
    print(f"  {tag}: {hits}")

print('\n=== F04: H3 13.5pt ===')
for tag in FILES:
    m = out[tag]
    hits = {k: v for k, v in m['font_size_spans'].items() if k.endswith('@13.5')}
    print(f"  {tag}: {hits}")

print('\n=== F07: H1 50pt / 46pt ===')
for tag in FILES:
    m = out[tag]
    hits = {k: v for k, v in m['font_size_spans'].items() if '@50.0' in k or '@46.0' in k or '@36.0' in k}
    print(f"  {tag}: {hits}")

print('\n=== F12: drawings ===')
for tag in FILES:
    m = out[tag]
    print(f"  {tag}: pages_with_drawings={m['pages_with_drawings']}/{m['pages']} total={m['drawings_total']}")

print('\n=== F17: font inventory ===')
for tag in FILES:
    m = out[tag]
    fams = sorted(set(k.split('@')[0] for k in m['font_size_hist']))
    print(f"  {tag}: {len(fams)} slots: {fams}")
