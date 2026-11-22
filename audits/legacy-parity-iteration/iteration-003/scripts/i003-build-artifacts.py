#!/usr/bin/env python3
"""Build iteration-003 artifacts (FULL BOOK): page-map with per-page metrics for
every page, missing-tokens reconciliation, regressions vs iteration-002,
rendered pages / overlays / diffs for key pairs, metrics.json, export copies.

Baseline (OLD): work/ref-pdfs/old-engine.pdf
  = origin/main 'audits/PDF Export Page Comparison - Old Engine VS New Engine/PDF File Export - Old Engine.pdf'
  md5 7c0fe033b494b2c15c6cde2c95656356, 699 pages.
NEW: work/iter003-export/repro.pdf (+ repro.html, same run, app/Worker path).
"""
import fitz, re, json, csv, collections, os, shutil, hashlib
import numpy as np
from PIL import Image

BASE = '/home/z/my-project/repo/audits/legacy-parity-iteration/iteration-003'
OLD_PDF = '/home/z/my-project/work/ref-pdfs/old-engine.pdf'
NEW_PDF = '/home/z/my-project/work/iter003-export/repro.pdf'
NEW_HTML = '/home/z/my-project/work/iter003-export/repro.html'
I002_PDF = '/home/z/my-project/repo/audits/legacy-parity-iteration/iteration-002/app-export-after-fix.pdf'
I002_METRICS = '/home/z/my-project/repo/audits/legacy-parity-iteration/iteration-002/metrics.json'

for d in ['rendered-old', 'rendered-new', 'overlays', 'diffs']:
    os.makedirs(os.path.join(BASE, d), exist_ok=True)

def md5(p):
    h = hashlib.md5()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

old, new = fitz.open(OLD_PDF), fitz.open(NEW_PDF)
print(f'OLD {len(old)} NEW {len(new)}')

WORD_RE = re.compile(r'[\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4]+')
NIKUD = re.compile(r'[\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7]')
GEM = re.compile(r'^[א-ת\u05F3\u05F4]{1,5}\.?$')

def words_of_page(pg):
    return [w[4] for w in pg.get_text('words') if WORD_RE.fullmatch(w[4])]

def msig(pg):
    """reading-order signature: first 12 words (RTL: sort by y then -x)"""
    ws = sorted(pg.get_text('words'), key=lambda w: (round(w[1]), -w[0]))
    return ' '.join(w[4] for w in ws[:12])

def jaccard_multiset(a, b):
    ca, cb = collections.Counter(a), collections.Counter(b)
    inter = sum((ca & cb).values())
    union = sum((ca | cb).values())
    return inter / union if union else 1.0

def line_count(pg):
    ys = {round(w[1]) for w in pg.get_text('words')}
    # cluster rounded y within 3pt
    ys = sorted(ys)
    n, last = 0, -10
    for y in ys:
        if y - last > 3:
            n += 1
        last = y
    return n

def body_extent(pg):
    """top/bottom y of body words (exclude running header <75pt and folio >790pt)"""
    ys = [w[3] for w in pg.get_text('words') if 75 < w[1] < 790]
    return (round(min(ys), 1), round(max(ys), 1)) if ys else (None, None)

def raster_of(pg, dpi=60):
    pm = pg.get_pixmap(dpi=dpi)
    return np.asarray(Image.frombytes('RGB', (pm.width, pm.height), pm.samples).convert('L'), dtype=np.uint8)

def ink_pct(a):
    return round(float((a < 128).mean() * 100), 3)

def diff_pct(a1, a2):
    if a1.shape != a2.shape:
        return None
    return round(float((np.abs(a1.astype(int) - a2.astype(int)) > 40).mean() * 100), 3)

# cache rasters for both books (all pages, 60dpi)
print('rendering OLD rasters...')
old_r = [raster_of(p) for p in old]
print('rendering NEW rasters...')
new_r = [raster_of(p) for p in new]

# ---------- 1. page mapping (monotone alignment by 12-word signature) ----------
pairs = []  # (old_idx, new_idx) aligned; None for unmatched
oi = ni = 0
while oi < len(old) and ni < len(new):
    so, sn = msig(old[oi]), msig(new[ni])
    if so == sn:
        pairs.append((oi, ni)); oi += 1; ni += 1; continue
    lo, ln = min(12, len(old) - oi), min(12, len(new) - ni)
    found = None
    for d in range(1, max(lo, ln) + 1):
        if d < lo and d <= ln and msig(old[oi + d]) == sn:
            found = ('old-only', d); break
        if d <= lo and d < ln and so == msig(new[ni + d]):
            found = ('new-only', d); break
    if found:
        kind, d = found
        for k in range(d):
            pairs.append((oi + k, None) if kind == 'old-only' else (None, ni + k))
        if kind == 'old-only': oi += d
        else: ni += d
        continue
    pairs.append((oi, ni)); oi += 1; ni += 1
while oi < len(old):
    pairs.append((oi, None)); oi += 1
while ni < len(new):
    pairs.append((None, ni)); ni += 1

# global word multisets (for old-only/new-only content reconciliation)
def doc_words(doc):
    c = collections.Counter()
    for pg in doc:
        for w in WORD_RE.findall(pg.get_text()):
            c[w] += 1
    return c
wold, wnew = doc_words(old), doc_words(new)

rows = []
for oi_, ni_ in pairs:
    r = {'old_page': (oi_ + 1) if oi_ is not None else '', 'new_page': (ni_ + 1) if ni_ is not None else ''}
    if oi_ is not None and ni_ is not None:
        wo, wn = words_of_page(old[oi_]), words_of_page(new[ni_])
        wo_n = [NIKUD.sub('', w) for w in wo]
        wn_n = [NIKUD.sub('', w) for w in wn]
        jr = jaccard_multiset(wo, wn)
        jn = jaccard_multiset(wo_n, wn_n)
        rp = diff_pct(old_r[oi_], new_r[ni_])
        top_o, bot_o = body_extent(old[oi_])
        top_n, bot_n = body_extent(new[ni_])
        r.update(old_words=len(wo), new_words=len(wn), text_sim=round(jr, 4),
                 text_sim_nikud=round(jn, 4), old_lines=line_count(old[oi_]), new_lines=line_count(new[ni_]),
                 old_ink=ink_pct(old_r[oi_]), new_ink=ink_pct(new_r[ni_]),
                 raster_diff=rp, old_body_top=top_o, old_body_bottom=bot_o,
                 new_body_top=top_n, new_body_bottom=bot_n)
        # classification (spec §6.2)
        structural = (oi_ + 1) <= 45 or len(wo) < 25
        if jn >= 0.98:
            if rp is not None and rp < 1.0:
                cls = 'identical/near-identical'
            else:
                cls = 'content-identical-geometry-different'
        elif jr < 0.90 <= jn:
            cls = 'extraction-only-discrepancy'
        elif structural and jn < 0.90:
            cls = 'structural/template-regression'
        elif jn >= 0.60:
            cls = 'reflow'
        else:
            cls = 'different-page-mapping'
        r['classification'] = cls
    elif oi_ is not None:
        wo = words_of_page(old[oi_])
        missing_here = [w for w in set(w for w in wo if not GEM.match(w)) if wold[w] > wnew.get(w, 0)]
        r.update(old_words=len(wo), new_words='', text_sim='', text_sim_nikud='',
                 old_lines=line_count(old[oi_]), new_lines='', old_ink=ink_pct(old_r[oi_]),
                 new_ink='', raster_diff='', classification='old-only-page',
                 content_status='has-globally-missing-words' if missing_here else 'reconciled-globally')
    else:
        wn = words_of_page(new[ni_])
        r.update(old_words='', new_words=len(wn), text_sim='', text_sim_nikud='',
                 old_lines='', new_lines=line_count(new[ni_]), old_ink='',
                 new_ink=ink_pct(new_r[ni_]), raster_diff='', classification='new-only-page',
                 content_status='')
    rows.append(r)

cols = ['old_page', 'new_page', 'classification', 'content_status', 'old_words', 'new_words',
        'text_sim', 'text_sim_nikud', 'old_lines', 'new_lines', 'old_ink', 'new_ink',
        'raster_diff', 'old_body_top', 'old_body_bottom', 'new_body_top', 'new_body_bottom']
with open(os.path.join(BASE, 'page-map.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=cols)
    w.writeheader()
    for r in rows:
        w.writerow(r)
cls_counts = collections.Counter(r['classification'] for r in rows)
print('page-map.csv:', dict(cls_counts))

aligned = [r for r in rows if r['old_page'] and r['new_page']]
rvals = [r['raster_diff'] for r in aligned if r['raster_diff'] is not None]
raster_stats = {
    'pairs_compared': len(rvals),
    'mean': round(sum(rvals) / len(rvals), 3),
    'median': round(sorted(rvals)[len(rvals) // 2], 3),
    'p95': round(sorted(rvals)[int(len(rvals) * 0.95)], 3),
    'max': round(max(rvals), 3),
    'lt_1pct': sum(1 for v in rvals if v < 1.0),
    'lt_5pct': sum(1 for v in rvals if v < 5.0),
    'ge_10pct': sum(1 for v in rvals if v >= 10.0),
}
print('raster (full book, aligned pairs):', raster_stats)

# ---------- 2. missing-tokens.csv (nikud-stripped word multiset reconciliation) ----------
oldn, newn = collections.Counter(), collections.Counter()
for w, c in wold.items(): oldn[NIKUD.sub('', w)] += c
for w, c in wnew.items(): newn[NIKUD.sub('', w)] += c
missing = {w: oldn[w] - newn.get(w, 0) for w in oldn if oldn[w] > newn.get(w, 0)}
surplus = {w: newn[w] - oldn.get(w, 0) for w in newn if newn[w] > oldn.get(w, 0)}
new_tokens = set(newn)

def classify(w):
    if GEM.match(w):
        return 'page-number-updated (gematria folio / TOC page refs — pagination differs)'
    if w == 'המשך':
        return 'note-split continuation label (different footnote split points)'
    if w in ('תוכן', 'עניינים', 'כללי', 'מפורט', 'העניינים', 'סימן'):
        return 'TOC/structure chrome'
    for t in new_tokens:
        if w != t and w in t and len(t) <= len(w) + 6:
            return f'extraction-fragment (inside NEW token {t!r})'
    return 'content-word (review)'

with open(os.path.join(BASE, 'missing-tokens.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['token', 'missing_count', 'classification'])
    for w_, c in sorted(missing.items(), key=lambda x: -x[1]):
        w.writerow([w_, c, classify(w_)])
cls_tok = collections.Counter(classify(w).split(' (')[0] for w in missing)
print(f'missing-tokens: {len(missing)} types / {sum(missing.values())} tokens; surplus {len(surplus)} types / {sum(surplus.values())} tokens')
print('missing classification:', dict(cls_tok))

# ---------- 3. rendered pages / overlays / diffs for key pairs ----------
key_old = [1, 2, 3, 4, 8, 19, 22, 23, 24, 43, 45, 100, 200, 300, 400, 500, 600, 650, 699]
top_diff = sorted(aligned, key=lambda r: -(r['raster_diff'] or 0))[:6]
for r in top_diff:
    if r['old_page'] not in key_old:
        key_old.append(r['old_page'])
pair_by_old = {r['old_page']: r['new_page'] for r in aligned}
for p in sorted(set(key_old)):
    po, pn = old[p - 1], pair_by_old.get(p)
    old_r[p - 1]  # cached
    img_o = Image.fromarray(old_r[p - 1])
    img_o.save(os.path.join(BASE, 'rendered-old', f'p{p:03d}.png'))
    if pn:
        a1, a2 = old_r[p - 1].astype(int), new_r[pn - 1].astype(int)
        if a1.shape == a2.shape:
            Image.fromarray(new_r[pn - 1]).save(os.path.join(BASE, 'rendered-new', f'p{p:03d}.png'))
            ov = np.zeros((a1.shape[0], a1.shape[1], 3), dtype=np.uint8)
            ov[..., 0] = np.where(a1 < 128, 255, 0)
            ov[..., 2] = np.where(a2 < 128, 255, 0)
            Image.fromarray(ov).save(os.path.join(BASE, 'overlays', f'p{p:03d}.png'))
            Image.fromarray(np.abs(a1 - a2).astype(np.uint8)).save(os.path.join(BASE, 'diffs', f'p{p:03d}.png'))
print('rendered/overlays/diffs pairs:', len([p for p in key_old if pair_by_old.get(p)]))

# ---------- 4. body line-pitch distribution (OLD vs NEW, sample pages) ----------
def pitches(pg):
    ys = sorted(round(w[1]) for w in pg.get_text('words') if 100 < w[1] < 780)
    ds = [b - a for a, b in zip(ys, ys[1:]) if 8 <= b - a <= 40]
    return ds
po_all, pn_all = [], []
for p in [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650]:
    po_all += pitches(old[p - 1])
    if pair_by_old.get(p):
        pn_all += pitches(new[pair_by_old[p] - 1])
def pitch_hist(ds):
    c = collections.Counter(round(d * 2) / 2 for d in ds)
    return {str(k): v for k, v in sorted(c.items())}
pitch_stats = {'old_top': pitch_hist(po_all).items(), }
old_ph, new_ph = pitch_hist(po_all), pitch_hist(pn_all)
pitch_out = {
    'old_dominant': max(old_ph, key=old_ph.get), 'old_share': round(old_ph[max(old_ph, key=old_ph.get)] / sum(old_ph.values()), 3),
    'new_dominant': max(new_ph, key=new_ph.get), 'new_share': round(new_ph[max(new_ph, key=new_ph.get)] / sum(new_ph.values()), 3),
    'old_hist': old_ph, 'new_hist': new_ph,
}
print('pitch:', {k: v for k, v in pitch_out.items() if k.endswith('dominant') or k.endswith('share')})

# ---------- 5. regressions.csv (iteration-002 vs iteration-003) ----------
i002 = json.load(open(I002_METRICS))
i002_key_pages = [p['old'] for p in i002['B_page_mapping']['sample'][:10]]
i002_pdf = fitz.open(I002_PDF)
i002_raster = {}
for p in i002_key_pages:
    if p <= len(i002_pdf):
        a1 = raster_of(old[p - 1]).astype(int)
        # map i002 page by same signature search near p
        best = None
        for q in range(max(0, p - 12), min(len(i002_pdf), p + 4)):
            if msig(old[p - 1]) == msig(i002_pdf[q]):
                best = q; break
        if best is None:
            best = min(p - 1, len(i002_pdf) - 1)
        a2 = raster_of(i002_pdf[best]).astype(int)
        if a1.shape == a2.shape:
            i002_raster[p] = diff_pct(a1.astype(np.uint8), a2.astype(np.uint8))
i003_key_raster = {}
for p in i002_key_pages:
    q = pair_by_old.get(p)
    if q:
        i003_key_raster[p] = diff_pct(old_r[p - 1], new_r[q - 1])
reg_rows = [
    ('page_count', 'old=699 baseline', i002['A_page_counts']['app_after_fix'], len(new), 'pages'),
    ('page_gap_to_old', '0 = parity', i002['A_page_counts']['gap_to_old'], len(new) - 699, 'pages'),
    ('mean_text_jaccard_sample', 'same 10 old pages', i002['B_page_mapping']['mean_jaccard'],
     round(sum(r['text_sim'] for r in aligned if r['old_page'] in i002_key_pages) / max(1, sum(1 for r in aligned if r['old_page'] in i002_key_pages)), 4), 'mean J'),
    ('raster_mean_sample10', 'same 10 old pages', round(i002['C_raster']['mean_changed_px_ratio'] * 100, 2),
     round(sum(v for v in i003_key_raster.values()) / max(1, len(i003_key_raster)), 2), '% changed px'),
    ('raster_pairs_compared', 'full book', i002['C_raster']['pairs'] if isinstance(i002['C_raster']['pairs'], list) else 10,
     raster_stats['pairs_compared'], 'pairs'),
    ('missing_word_types', 'nikud-stripped', i002['E_content']['deficit_types'], len(missing), 'types'),
    ('missing_tokens', 'nikud-stripped', i002['E_content']['token_deficit'], sum(missing.values()), 'tokens'),
    ('surplus_tokens', 'nikud-stripped', i002['E_content']['token_surplus'], sum(surplus.values()), 'tokens'),
    ('content_preserved_engine', 'token-multiset accounting (model level)', 'true', 'PENDING_VERIFY', ''),
]
with open(os.path.join(BASE, 'regressions.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['metric', 'scope', 'iteration_002', 'iteration_003', 'unit'])
    for r in reg_rows:
        w.writerow(r)
json.dump({'i002_key_raster': i002_raster, 'i003_key_raster': i003_key_raster},
          open(os.path.join(BASE, 'key-raster-detail.json'), 'w'), ensure_ascii=False, indent=1)
print('regressions.csv written; i002 key raster:', i002_raster)
print('i003 key raster:', i003_key_raster)

# ---------- 6. metrics.json ----------
metrics = {
    'generated': 'iteration-003',
    'head': '2702834 (a08732b + 2702834 on ff14757)',
    'baseline': {'pdf': 'old-engine.pdf (PDF File Export - Old Engine.pdf, origin/main)',
                 'md5': md5(OLD_PDF), 'pages': len(old)},
    'new_export': {'pdf': 'new-export.pdf (repro.pdf, app/Worker path, same run as HTML)',
                   'md5': md5(NEW_PDF), 'pages': len(new),
                   'html': 'new-export.html (same run)', 'html_md5': md5(NEW_HTML)},
    'page_map': dict(cls_counts),
    'aligned_pairs': len(aligned),
    'raster_full_book': raster_stats,
    'words': {'old_total': sum(wold.values()), 'new_total': sum(wnew.values()),
              'missing_types': len(missing), 'missing_tokens': sum(missing.values()),
              'surplus_types': len(surplus), 'surplus_tokens': sum(surplus.values())},
    'missing_classification': dict(cls_tok),
    'body_line_pitch': {k: v for k, v in pitch_out.items() if not k.endswith('hist')},
    'key_pages_rendered': sorted(set(key_old)),
    'contentPreserved': 'PENDING_VERIFY (see TESTS.md — verified via i003-verify-final.js)',
}
json.dump(metrics, open(os.path.join(BASE, 'metrics.json'), 'w'), ensure_ascii=False, indent=1)
print('metrics.json written')

# ---------- 7. export copies ----------
shutil.copy(NEW_PDF, os.path.join(BASE, 'new-export.pdf'))
shutil.copy(NEW_HTML, os.path.join(BASE, 'new-export.html'))
print('exports copied')
