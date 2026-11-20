#!/usr/bin/env python3
# pdf_verify2.py — ניתוחי מיקום ותוכן: F01/F03/F04/F05/F06/F11/F13/F14/F16/F18
import json, collections, re
import fitz

FILES = {
    'OLD': '/tmp/pdf-forensic/old_engine.pdf',
    'NE1': '/tmp/pdf-forensic/new_engine_1.pdf',
    'NE2': '/tmp/pdf-forensic/new_engine_2.pdf',
}

def page_spans(p):
    d = p.get_text('dict')
    out = []
    for b in d['blocks']:
        for l in b.get('lines', []):
            for s in l.get('spans', []):
                out.append({'x0': s['bbox'][0], 'y0': s['bbox'][1], 'x1': s['bbox'][2], 'y1': s['bbox'][3],
                            'font': s['font'], 'size': round(s['size'], 2), 'text': s['text']})
    return out

R = {}

# ── F01/F16: עמוד 1 (שער ראשי) ועמוד 2 (שער אחורי) ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    p1 = sorted(page_spans(doc[0]), key=lambda s: s['y0'])
    p2 = sorted(page_spans(doc[1]), key=lambda s: s['y0'])
    R.setdefault(tag, {})['cover_p1'] = [{'y': round(s['y0']), 'sz': s['size'], 'f': s['font'], 't': s['text'].strip()[:50]} for s in p1]
    R[tag]['back_p2'] = [{'y': round(s['y0']), 'sz': s['size'], 'f': s['font'], 't': s['text'].strip()[:40]} for s in p2]
    doc.close()

# ── F03: סטטיסטיקת עמודים ו-F14: מרווחי שורה ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    words_per_page = []
    body_block_bottoms = []
    gaps = collections.Counter()
    for pno in range(doc.page_count):
        p = doc[pno]
        words_per_page.append(len(p.get_text().split()))
        # שורות גוף 12pt — מדידת מרווחי בסיס
        lines12 = []
        d = p.get_text('dict')
        for b in d['blocks']:
            for l in b.get('lines', []):
                for s in l.get('spans', []):
                    if s['font'] == 'ToraBook' and round(s['size'], 2) == 12.0 and 100 < s['bbox'][1] < 760:
                        lines12.append(s['bbox'][1])
                        break
        lines12.sort()
        for a, b2 in zip(lines12, lines12[1:]):
            gaps[round(b2 - a, 2)] += 1
        if lines12:
            body_spans_12 = [x for x in page_spans(p) if x['font'] == 'ToraBook' and x['size'] == 12.0]
            body_block_bottoms.append(max(x['y1'] for x in body_spans_12))
    R[tag]['words_per_page_avg'] = round(sum(words_per_page) / len(words_per_page), 1)
    R[tag]['body_gaps_top'] = gaps.most_common(5)
    R[tag]['body_bottom_median'] = sorted(body_block_bottoms)[len(body_block_bottoms) // 2] if body_block_bottoms else None
    R[tag]['pages_body_end_below_640'] = sum(1 for b2 in body_block_bottoms if b2 < 640)
    R[tag]['body_bottom_count'] = len(body_block_bottoms)
    doc.close()

# ── F04: מיקום כותרות H3 (13.5pt) ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    h3 = []
    for pno in range(doc.page_count):
        for s in page_spans(doc[pno]):
            if s['size'] == 13.5 and len(s['text'].strip()) > 3:
                h3.append({'page': pno + 1, 'y': round(s['y0'])})
    top = sum(1 for h in h3 if h['y'] < 110)
    R[tag]['h3_total'] = len(h3)
    R[tag]['h3_top_of_page'] = top
    doc.close()

# ── F05: פוליו — טקסט בתחתית העמוד, היסט מול מספר פיזי ──
HEB = {c: i for i, c in enumerate('אבגדהוזחטי כלמנסעפצקרשת')}
def gematria(s):
    vals = {'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':20,'ל':30,'מ':40,'נ':50,'ס':60,'ע':70,'פ':80,'צ':90,'ק':100,'ר':200,'ש':300,'ת':400}
    tot = 0
    for ch in s:
        if ch in vals: tot += vals[ch]
    return tot

for tag, path in FILES.items():
    doc = fitz.open(path)
    folios = {}
    no_folio = 0
    for pno in range(doc.page_count):
        p = doc[pno]
        cand = [s for s in page_spans(p) if s['y0'] > 780 and s['size'] < 13 and len(s['text'].strip()) <= 12]
        if not cand:
            no_folio += 1
            continue
        # לוקחים את הפוליו (מרוכז בערך)
        best = min(cand, key=lambda s: abs((s['x0'] + s['x1']) / 2 - 306))
        t = re.sub(r'[^\u0590-\u05FF"]', '', best['text'].replace('״', '').replace('"', ''))
        if t:
            folios[pno + 1] = gematria(t)
    # היסטים
    offsets = [(pno, folios[pno] - pno) for pno in sorted(folios)]
    offs = collections.Counter(o for _, o in offsets)
    R[tag]['folio_pages'] = len(folios)
    R[tag]['folio_missing'] = no_folio
    R[tag]['folio_offset_distribution'] = offs.most_common(8)
    R[tag]['folio_first_last'] = [offsets[0] if offsets else None, offsets[-1] if offsets else None]
    doc.close()

# ── F06: עמודי פתיחת-סימן — H2 ב-17pt ומילות גוף בעמוד ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    h2_pages = {}
    for pno in range(doc.page_count):
        p = doc[pno]
        sp = page_spans(p)
        has_h2 = any(s['size'] == 17.0 and len(s['text'].strip()) > 4 for s in sp)
        if has_h2:
            body_words = sum(len(s['text'].split()) for s in sp if s['font'] == 'ToraBook' and s['size'] == 12.0)
            h2_pages[pno + 1] = body_words
    with_body = sum(1 for v in h2_pages.values() if v > 10)
    R[tag]['h2_open_pages'] = len(h2_pages)
    R[tag]['h2_with_body'] = with_body
    R[tag]['h2_body_avg'] = round(sum(h2_pages.values()) / len(h2_pages), 1) if h2_pages else 0
    doc.close()

# ── F11: כותרות עליונות ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    hdr_center = 0
    hdr_corners = 0
    sample = []
    for pno in range(doc.page_count):
        p = doc[pno]
        cand = [s for s in page_spans(p) if s['y0'] < 90 and s['size'] < 16 and len(s['text'].strip()) > 1]
        if not cand: continue
        center = [s for s in cand if 150 < (s['x0'] + s['x1']) / 2 < 460]
        if center: hdr_center += 1
        else: hdr_corners += 1
        if pno in (99, 149) and cand:
            sample.append({'page': pno + 1, 'items': [{'t': s['text'].strip()[:20], 'x': round((s['x0'] + s['x1']) / 2), 'sz': s['size']} for s in cand]})
    R[tag]['hdr_pages_center'] = hdr_center
    R[tag]['hdr_pages_corners_only'] = hdr_corners
    R[tag]['hdr_sample'] = sample
    doc.close()

# ── F18: שלמות תוכן — מולטיסט מילים ──
def word_multiset(path):
    doc = fitz.open(path)
    c = collections.Counter()
    for p in doc:
        for w in re.findall(r'[\u0590-\u05FF"]+', p.get_text()):
            c[w] += 1
    doc.close()
    return c

multisets = {tag: word_multiset(path) for tag, path in FILES.items()}
for a, b in [('OLD', 'NE1'), ('OLD', 'NE2'), ('NE1', 'NE2')]:
    A, B = multisets[a], multisets[b]
    inter = sum((A & B).values())
    uni = sum((A | B).values())
    only_a = (A - B).most_common(12)
    only_b = (B - A).most_common(12)
    R.setdefault(a, {})[f'vs_{b}'] = {'jaccard_words': round(inter / uni, 4), 'total_a': sum(A.values()), 'total_b': sum(B.values()),
                                      'only_a_top': only_a, 'only_b_top': only_b}

# ── F13: TOC — דגימת שורות ──
for tag, path in FILES.items():
    doc = fitz.open(path)
    # מזהים עמודי TOC לפי כותרת
    toc_pages = []
    for pno in range(min(45, doc.page_count)):
        t = doc[pno].get_text()
        if 'תוכן' in t and ('עניינים' in t):
            toc_pages.append(pno)
    sample = []
    if toc_pages:
        p = doc[toc_pages[0] + 1] if toc_pages[0] + 1 < doc.page_count else doc[toc_pages[0]]
        for s in sorted(page_spans(p), key=lambda s: s['y0'])[:26]:
            if s['text'].strip():
                sample.append({'y': round(s['y0']), 'x': round(s['x0']), 'sz': s['size'], 'f': s['font'], 't': s['text'].strip()[:44]})
    R[tag]['toc_first_page'] = (toc_pages[0] + 1) if toc_pages else None
    R[tag]['toc_sample'] = sample
    doc.close()

with open('/tmp/pdf-forensic/verify2.json', 'w') as f:
    json.dump(R, f, ensure_ascii=False, indent=1)

# ── תדפיס מסכם ──
for tag in FILES:
    r = R[tag]
    print(f"\n════ {tag} ════")
    print(f" cover p1: {[x['t'] for x in r['cover_p1']][:8]}")
    print(f" F03: words/pg={r['words_per_page_avg']} bodyGaps={r['body_gaps_top']} bottomMed={r['body_bottom_median']} pages<640={r['pages_body_end_below_640']}/{r['body_bottom_count']}")
    print(f" F04: H3 total={r['h3_total']} top-of-page={r['h3_top_of_page']}")
    print(f" F05: folio pages={r['folio_pages']} missing={r['folio_missing']} offsets={r['folio_offset_distribution']} first/last={r['folio_first_last']}")
    print(f" F06: H2 pages={r['h2_open_pages']} with body={r['h2_with_body']} avgBody={r['h2_body_avg']}")
    print(f" F11: hdr center={r['hdr_pages_center']} corners-only={r['hdr_pages_corners_only']} sample={r['hdr_sample'][:1]}")
    print(f" F13: toc first={r['toc_first_page']} sample0={[x['t'] for x in r['toc_sample'][:5]]}")
for a, b in [('OLD', 'NE1'), ('OLD', 'NE2'), ('NE1', 'NE2')]:
    d = R[a][f'vs_{b}']
    print(f"\n[{a} vs {b}] word-Jaccard={d['jaccard_words']} totals={d['total_a']}/{d['total_b']}")
    print(f"  only-{a}: {d['only_a_top'][:6]}")
    print(f"  only-{b}: {d['only_b_top'][:6]}")
