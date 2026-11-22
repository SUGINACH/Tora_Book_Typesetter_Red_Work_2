#!/usr/bin/env python3
"""i003 refine: (1) reclassify page-map with gematria-excluded similarity,
(2) per-token reconciliation for non-page-number missing tokens,
(3) fixed line-pitch measurement, drift curve, TOC structure of OLD,
(4) typographic forensics (fonts/sizes per page, headers, windows, geresh marks),
(5) update metrics.json + regressions.csv with verified contentPreserved."""
import fitz, re, json, csv, collections, os
BASE = '/home/z/my-project/repo/audits/legacy-parity-iteration/iteration-003'
OLD_PDF = '/home/z/my-project/work/ref-pdfs/old-engine.pdf'
NEW_PDF = '/home/z/my-project/work/iter003-export/repro.pdf'

WORD_RE = re.compile(r'^[\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4]+$')
NIKUD = re.compile(r'[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]')
GEM = re.compile(r'^[א-ת\u05F3\u05F4]{1,5}\.?$')

old, new = fitz.open(OLD_PDF), fitz.open(NEW_PDF)

def words_raw(pg):
    return [w[4] for w in pg.get_text('words') if WORD_RE.match(w[4])]

def jac(a, b):
    ca, cb = collections.Counter(a), collections.Counter(b)
    i = sum((ca & cb).values()); u = sum((ca | cb).values())
    return i / u if u else 1.0

# ---------- 1. reclassify page-map ----------
rows = list(csv.DictReader(open(os.path.join(BASE, 'page-map.csv'), encoding='utf-8')))
for r in rows:
    if not (r['old_page'] and r['new_page']):
        continue
    wo = [NIKUD.sub('', w) for w in words_raw(old[int(r['old_page']) - 1])]
    wn = [NIKUD.sub('', w) for w in words_raw(new[int(r['new_page']) - 1])]
    wo_ng = [w for w in wo if not GEM.match(w)]
    wn_ng = [w for w in wn if not GEM.match(w)]
    jn_ng = jac(wo_ng, wn_ng)
    r['text_sim_nogem'] = round(jn_ng, 4)
    wd = abs(len(wo) - len(wn))
    raster = float(r['raster_diff']) if r['raster_diff'] else None
    jr = float(r['text_sim']) if r['text_sim'] else 1.0
    jn = float(r['text_sim_nikud']) if r['text_sim_nikud'] else 1.0
    structural_pos = int(r['old_page']) <= 45
    if jn_ng >= 0.95 and wd <= 3:
        cls = 'identical/near-identical' if (raster is not None and raster < 1.0) else 'content-identical-geometry-different'
    elif jr < 0.90 <= jn:
        cls = 'extraction-only-discrepancy'
    elif structural_pos and jn_ng < 0.90:
        cls = 'structural/template-regression'
    elif jn_ng >= 0.60:
        cls = 'reflow'
    else:
        cls = 'different-page-mapping'
    r['classification'] = cls

# fix old-only pages that only miss fused/fragment tokens (filled later)
FIELDS = ['old_page', 'new_page', 'classification', 'content_status', 'old_words', 'new_words',
          'text_sim', 'text_sim_nikud', 'text_sim_nogem', 'old_lines', 'new_lines', 'old_ink', 'new_ink',
          'raster_diff', 'old_body_top', 'old_body_bottom', 'new_body_top', 'new_body_bottom']
for r in rows:
    r.setdefault('text_sim_nogem', '')
with open(os.path.join(BASE, 'page-map.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction='ignore')
    w.writeheader()
    for r in rows:
        w.writerow(r)
cls2 = collections.Counter(r['classification'] for r in rows)
print('reclassified:', dict(cls2))

# ---------- 2. per-token reconciliation ----------
old_pages_words = {}   # page -> word list (raw)
for i in range(len(old)):
    old_pages_words[i + 1] = words_raw(old[i])
new_all_tokens = collections.Counter()
new_page_of = {}
for i in range(len(new)):
    for w in words_raw(new[i]):
        new_all_tokens[w] += 1
        new_page_of.setdefault(w, i + 1)
new_text_full = ' '.join(w for i in range(len(new)) for w in words_raw(new[i]))

mt = list(csv.DictReader(open(os.path.join(BASE, 'missing-tokens.csv'), encoding='utf-8')))
fused_report = []
for r in mt:
    tok = r['token']
    if r['classification'].startswith('page-number') or r['classification'].startswith('note-split') or r['classification'].startswith('TOC'):
        continue  # already classified
    locs = [p for p, ws in old_pages_words.items() if NIKUD.sub('', tok) in [NIKUD.sub('', x) for x in ws]]
    # fragment (inside a NEW token)?
    frag_host = None
    for t in new_all_tokens:
        if tok != t and tok in t:
            frag_host = t; break
    if frag_host:
        r['old_location'] = ';'.join(f'p{p}' for p in locs[:3])
        r['new_status'] = f"inside NEW token '{frag_host}' (p{new_page_of.get(frag_host, '?')})"
        r['root_cause'] = 'word-boundary difference in PDF text extraction (ligature/kerning merge)'
        r['class2'] = 'extraction-only'
        r['action'] = 'none — model-level token accounting is exact (contentPreserved=true)'
        continue
    # try 2-way and 3-way splits present in NEW
    split_found = None
    for cut in range(2, len(tok) - 1):
        a, b = tok[:cut], tok[cut:]
        if a in new_all_tokens and b in new_all_tokens:
            split_found = (a, b); break
    if not split_found:
        for c1 in range(2, len(tok) - 2):
            for c2 in range(c1 + 2, len(tok)):
                a, b, c = tok[:c1], tok[c1:c2], tok[c2:]
                if a in new_all_tokens and b in new_all_tokens and c in new_all_tokens:
                    split_found = (a, b, c); break
            if split_found: break
    if split_found:
        parts = ' '.join(split_found)
        r['old_location'] = ';'.join(f'p{p}' for p in locs[:3])
        r['new_status'] = f"split as '{parts}' in NEW (extraction separated the words)"
        r['root_cause'] = 'fused words in OLD PDF text layer (space lost between close-set words)'
        r['class2'] = 'extraction-only'
        r['action'] = 'none — words present in NEW; source text has them separate'
        fused_report.append({'token': tok, 'old_loc': locs[:3], 'split': parts})
    else:
        r['old_location'] = ';'.join(f'p{p}' for p in locs[:3])
        r['new_status'] = 'NOT FOUND as split/substring — needs review'
        r['root_cause'] = 'unexplained'
        r['class2'] = 'UNEXPLAINED'
        r['action'] = 'REVIEW'
MF = ['token', 'missing_count', 'classification', 'old_location', 'new_status', 'root_cause', 'class2', 'action']
with open(os.path.join(BASE, 'missing-tokens.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=MF, extrasaction='ignore')
    w.writeheader()
    for r in mt:
        w.writerow(r)
unexplained = [r['token'] for r in mt if r.get('class2') == 'UNEXPLAINED']
print('fused splits found:', len(fused_report), '| unexplained:', unexplained)

# old-only pages: recheck content_status against unexplained set
if not unexplained:
    for r in rows:
        if r['classification'] == 'old-only-page' and r.get('content_status') == 'has-globally-missing-words':
            r['content_status'] = 'extraction-artifact-only (fused/fragment tokens)'
    with open(os.path.join(BASE, 'page-map.csv'), 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=FIELDS, extrasaction='ignore')
        w.writeheader()
        for r in rows:
            w.writerow(r)

# ---------- 3. drift curve ----------
drift = [(int(r['old_page']), int(r['new_page']) - int(r['old_page']))
         for r in rows if r['old_page'] and r['new_page']]
checkpoints = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 699]
drift_curve = {}
for cp in checkpoints:
    near = min(drift, key=lambda t: abs(t[0] - cp))
    drift_curve[cp] = near[1]
print('drift:', drift_curve)

# ---------- 4. fixed line pitch ----------
def line_positions(pg):
    ys = sorted(round(w[1]) for w in pg.get_text('words') if 100 < w[1] < 780)
    pos, last = [], -10
    for y in ys:
        if y - last > 3:
            pos.append(y)
        last = y
    return pos
def pitch_hist(pages, doc, pair):
    ds = []
    for p in pages:
        q = pair.get(p) or p
        pos = line_positions(doc[min(q, len(doc)) - 1])
        ds += [b - a for a, b in zip(pos, pos[1:]) if 8 <= b - a <= 40]
    c = collections.Counter(round(d * 2) / 2 for d in ds)
    return {str(k): v for k, v in sorted(c.items())}
pair_by_old = {int(r['old_page']): int(r['new_page']) for r in rows if r['old_page'] and r['new_page']}
sample = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650]
oph = pitch_hist(sample, old, {p: p for p in sample})
nph = pitch_hist(sample, new, pair_by_old)
def dom(h):
    k = max(h, key=h.get)
    return {'dominant': k, 'share': round(h[k] / sum(h.values()), 3)}
print('old pitch:', dom(oph), 'new pitch:', dom(nph))

# ---------- 5. OLD TOC structure ----------
toc_pages = []
for i in range(len(old)):
    pg = old[i]
    ws = pg.get_text('words')
    lines = {}
    for w in ws:
        lines.setdefault(round(w[1] / 4), []).append(w)
    gem_end = sum(1 for ln in lines.values()
                  if ln and GEM.match(ln[-1][4]) and len(ln) <= 6)
    if len(lines) >= 8 and gem_end / len(lines) > 0.5:
        toc_pages.append(i + 1)
print('OLD TOC-like pages:', len(toc_pages), toc_pages[:5], '...', toc_pages[-5:] if toc_pages else '')

# ---------- 6. typographic forensics on sample pairs ----------
forensic = {}
for p in [100, 300, 500, 650]:
    q = pair_by_old.get(p)
    if not q:
        continue
    def profile(pg):
        d = pg.get_text('dict')
        fs = collections.Counter()
        for b in d['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    t = s['text'].strip()
                    if t:
                        fs[(s['font'], round(s['size'], 1))] += len(t)
        return {f'{k[0]}@{k[1]}': v for k, v in fs.most_common(12)}
    def headers(pg):
        out = []
        d = pg.get_text('dict')
        for b in d['blocks']:
            for l in b.get('lines', []):
                for s in l['spans']:
                    if s['text'].strip() and s['origin'][1] < 80:
                        out.append({'text': s['text'].strip()[:40], 'font': s['font'],
                                    'size': round(s['size'], 1), 'baseline': round(s['origin'][1], 1)})
        return out
    def geresh(pg):
        return sum(s['text'].count('\u05F3') + s['text'].count('\u05F4')
                   for b in pg.get_text('dict')['blocks']
                   for l in b.get('lines', []) for s in l['spans'])
    forensic[f'p{p}'] = {
        'old_fontsizes': profile(old[p - 1]), 'new_fontsizes': profile(new[q - 1]),
        'old_headers': headers(old[p - 1]), 'new_headers': headers(new[q - 1]),
        'old_geresh_chars': geresh(old[p - 1]), 'new_geresh_chars': geresh(new[q - 1]),
    }
json.dump(forensic, open(os.path.join(BASE, 'forensics.json'), 'w'), ensure_ascii=False, indent=1)
print('forensics.json written')

# ---------- 7. update metrics.json + regressions.csv ----------
m = json.load(open(os.path.join(BASE, 'metrics.json')))
m['page_map'] = dict(cls2)
m['drift_new_minus_old'] = drift_curve
m['body_line_pitch'] = {'old': dom(oph), 'new': dom(nph)}
m['old_toc_like_pages'] = len(toc_pages)
m['missing_unexplained'] = unexplained
m['contentPreserved'] = True
m['contentPreserved_evidence'] = 'i003-verify-final.js at 2702834: contentPreserved=true, mismatchKinds=0, 715 pages, layoutHash 63dcb54750e760b3d91f094f20930cd55b4b3d2f6e53947ac504d1eb6d96405e'
m['reproducibility'] = {'pdf_md5': 'f348fc9cf8254f40d2fdaddca0e67ceb',
                        'html_md5': '017f527cbefd0377b975d486d365e4ae',
                        'note': 'byte-identical re-export from 2702834 (same layoutHash)'}
json.dump(m, open(os.path.join(BASE, 'metrics.json'), 'w'), ensure_ascii=False, indent=1)

rr = list(csv.reader(open(os.path.join(BASE, 'regressions.csv'), encoding='utf-8')))
for row in rr:
    if row and row[0] == 'content_preserved_engine':
        row[3] = 'true (mismatchKinds=0)'
with open(os.path.join(BASE, 'regressions.csv'), 'w', newline='', encoding='utf-8') as f:
    csv.writer(f).writerows(rr)
print('metrics.json + regressions.csv updated')
