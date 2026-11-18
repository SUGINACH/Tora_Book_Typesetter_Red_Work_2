#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Family/face mapping proposal + capability matrix for Tora Book Typesetter RED.

Inputs: scripts/out/font_inventory.json + catalogs.
Outputs:
  scripts/out/font_family_mapping.json  (machine: legacyName -> familyId/faceId + confidence + evidence)
  scripts/out/font_family_mapping.csv    (compact human table)
  scripts/out/font_capability_matrix.json (per-file capability flags)
  scripts/out/font_capability_matrix.csv
"""
import csv
import json
import os
import re
from collections import defaultdict

REPO = '/home/z/my-project/repo'
ASSETS = os.path.join(REPO, 'red-build', 'ui', 'assets', 'imud')
OUT = '/home/z/my-project/scripts/out'
INV = json.load(open(os.path.join(OUT, 'font_inventory.json')))
recs = INV['records']
by_file = {r['file']: r for r in recs}

imud = json.load(open(os.path.join(ASSETS, 'imud-fonts.json')))
ext = json.load(open(os.path.join(ASSETS, 'fonts-extended.json')))
pri = json.load(open(os.path.join(ASSETS, 'fonts-priority.json')))

WEIGHT_TOKENS = {
    'thin': 100, 'extralight': 200, 'ultralight': 200, 'light': 300, 'regular': 400,
    'normal': 400, 'medium': 500, 'semibold': 600, 'demibold': 600, 'demi': 600,
    'bold': 700, 'extrabold': 800, 'ultrabold': 800, 'black': 900, 'heavy': 900,
    'extrablack': 1000, 'ultrablack': 1000, 'light2': 300,
}
WIDTH_TOKENS = {'condensed': 'condensed', 'tzar': 'condensed',
                 'semicondensed': 'semi-condensed', 'extracondensed': 'extra-condensed',
                 'wide': 'wide', 'expanded': 'wide', 'narrow': 'narrow'}
DECOR_TOKENS = ('shadow', 'outline', 'hollow', 'dots', 'wireframe', 'emboss', 'pixel',
                'grunge', 'brush', 'decor', 'stencil', 'stamped', 'logo', 'art',
                'balloon', 'banana', 'bubbles')
ITALIC_TOKENS = ('italic', 'natui', 'oblique', 'itali', 'it-')


def slug(s):
    s = re.sub(r"[^\w\s-]", '', str(s or ''), flags=re.UNICODE)
    s = re.sub(r"[\s_]+", '-', s).strip('-').lower()
    return s or 'unknown'


def tokens_of(filename):
    base = os.path.splitext(filename)[0]
    parts = re.split(r'[-_ ]+', base)
    # CamelCase split
    out = []
    for p in parts:
        out.extend([w.lower() for w in re.findall(r'[A-Z]+(?![a-z])|[A-Z][a-z0-9]*|[a-z0-9]+', p)])
    return out


def weight_of_tokens(tokens):
    """First weight signal in filename tokens — bigrams (Extra-Light etc.) before singles."""
    BIGRAM = {('extra', 'light'): 200, ('ultra', 'light'): 200, ('extra', 'bold'): 800,
              ('ultra', 'bold'): 800, ('semi', 'bold'): 600, ('demi', 'bold'): 600,
              ('extra', 'black'): 1000, ('ultra', 'black'): 1000, ('extra', 'thin'): 100}
    for i in range(len(tokens) - 1):
        w = BIGRAM.get((tokens[i], tokens[i + 1]))
        if w:
            return w
    for t in tokens:
        if t in WEIGHT_TOKENS:
            return WEIGHT_TOKENS[t]
    return None


def width_of_tokens(tokens):
    """First width signal in filename tokens — bigrams (Semi-Condensed) before singles."""
    BIGRAM = {('semi', 'condensed'): 'semi-condensed', ('extra', 'condensed'): 'extra-condensed',
              ('ultra', 'condensed'): 'extra-condensed'}
    for i in range(len(tokens) - 1):
        w = BIGRAM.get((tokens[i], tokens[i + 1]))
        if w:
            return w
    for t in tokens:
        if t in WIDTH_TOKENS:
            return WIDTH_TOKENS[t]
    return None


def name_info(r):
    n = r.get('name') or {}
    fam = n.get('typoFamily') or n.get('family') or None
    sub = n.get('typoSubfamily') or n.get('subfamily') or None
    if not fam or fam.strip() in ('\x7f', ''):
        fam = None
    if not sub or sub.strip() in ('\x7f', ''):
        sub = None
    return fam, sub


def propose(r):
    """Return (familyId, faceId, familyLabel, faceLabel, confidence, evidence[], flags[])."""
    fam, sub = name_info(r)
    toks = tokens_of(r['file'])
    os2 = r.get('os2') or {}
    head = r.get('head') or {}
    post = r.get('post') or {}
    flags = []
    evidence = []
    # ---- family resolution
    fam_label = fam
    fam_source = 'name-table(1/16)'
    if fam_label:
        evidence.append('name family=%r' % fam_label)
    else:
        # protected webfont: try filename family words (drop style tokens)
        keep = []
        for t in toks:
            if t in WEIGHT_TOKENS or t in WIDTH_TOKENS or t in ITALIC_TOKENS:
                break
            keep.append(t)
        fam_label = ' '.join(keep).strip() or toks[0] if toks else 'unknown'
        fam_label = fam_label if fam_label else 'unknown'
        fam_source = 'filename-heuristic (name table stripped/protected)'
        flags.append('name-table-stripped')
        evidence.append('filename tokens=%r' % toks)
    # decorative variations => separate family
    decor = [t for t in toks if t in DECOR_TOKENS]
    if decor:
        fam_label = (fam_label + ' ' + ' '.join(d.title() for d in decor)).strip()
        flags.append('decorative-variation')
        evidence.append('decorative token(s)=%r' % decor)
    family_id = slug(fam_label)

    # ---- face resolution (weight opinions: filename / subfamily / family-name / OS/2)
    sub_label = sub or ''
    if sub_label:
        evidence.append('name subfamily=%r' % sub_label)
    sub_toks = [t for t in re.split(r'[-_ ]+', slug(sub_label)) if t] if sub_label else []
    os2_w = os2.get('usWeightClass')
    evidence.append('OS/2 usWeightClass=%s' % os2_w)
    file_w = weight_of_tokens(toks)
    sub_w = weight_of_tokens(sub_toks)
    fam_w = None
    fam_words = fam_label.split()
    if len(fam_words) > 1 and fam_words[-1].lower() in WEIGHT_TOKENS and fam_words[-1].lower() not in ('regular', 'normal'):
        fam_w = WEIGHT_TOKENS[fam_words[-1].lower()]
        fam_label = ' '.join(fam_words[:-1])
        family_id = slug(fam_label)  # recompute — the trimmed label is the real family
        flags.append('weight-word-in-family-name-stripped')
        evidence.append('family name trimmed: %r' % fam_label)
    # legacy/nonstandard OS/2 values cannot be trusted
    if os2_w is not None and (1 <= os2_w <= 9 or os2_w % 100 != 0):
        flags.append('os2-weight-untrustworthy(%s)' % os2_w)
    opinions = [o for o in (file_w, sub_w, fam_w, os2_w) if o is not None]
    disagree = len(opinions) >= 2 and (max(opinions) - min(opinions)) >= 100
    if disagree:
        flags.append('weight-opinions-disagree(file=%s sub=%s family=%s os2=%s)' % (file_w, sub_w, fam_w, os2_w))
        # filename is the physical truth of THIS file; junk name tables are common in
        # the protected webfont set ( Bagsu cake: subfamily=Light on the Medium file)
        weight = file_w if file_w is not None else (sub_w or fam_w or os2_w or 400)
        evidence.append('weight resolved from filename token (disagreement)')
    else:
        weight = next((o for o in (file_w, sub_w, fam_w, os2_w) if o is not None), 400)
    if weight is None:
        weight = 400
    # style
    italic = bool(post.get('italicAngle')) and abs(float(post.get('italicAngle') or 0)) > 0
    fs_sel = os2.get('fsSelection') or 0
    mac_style = (head.get('macStyle') or 0)
    if (fs_sel & 1) or (mac_style & 2):
        italic = True
    style = 'italic' if italic else 'normal'
    # width
    width_token = width_of_tokens(toks) or width_of_tokens(sub_toks)
    os2_width = os2.get('usWidthClass')
    width = width_token or ('normal' if os2_width in (5, None) else 'os2-width-class-%s' % os2_width)
    if width_token:
        evidence.append('width token=%r' % width_token)
    # variable axes
    axes = r.get('variableAxes') or []
    if axes:
        flags.append('variable-font(%s)' % ','.join(a.get('tag', '?') for a in axes))
    face_label = sub_label or ('%s %s' % (WEIGHT_TOKENS_REV.get(weight, weight), style))
    face_id = '%s-%s-%s' % (weight, style, slug(width))
    # confidence
    confidence = 'high'
    if flags and any('stripped' in f for f in flags):
        confidence = 'medium'
    if any('contradicts' in f or 'legacy' in f for f in flags):
        confidence = 'medium' if confidence == 'high' else 'low'
    if fam_source.startswith('filename'):
        confidence = 'low' if any('contradicts' in f for f in flags) else 'medium'
    return {
        'familyId': family_id, 'faceId': face_id,
        'familyLabel': fam_label, 'faceLabel': face_label,
        'weight': weight, 'style': style, 'width': width,
        'confidence': confidence, 'evidence': evidence, 'flags': flags,
    }


WEIGHT_TOKENS_REV = {v: k.title() for k, v in WEIGHT_TOKENS.items() if k not in ('normal', 'light2')}

# ---------- build proposals ----------
proposals = {}
for r in recs:
    p = propose(r)
    p['file'] = r['file']
    p['sha256'] = r['sha256']
    p['outline'] = r.get('outline')
    p['isVariable'] = bool(r.get('isVariable'))
    p['sniff'] = r['sniff']
    p['fsTypeClass'] = (r.get('os2') or {}).get('fsTypeClass')
    proposals[r['file']] = p

# ---------- conflict detection: same (familyId, faceId), different outlines/metrics ----------
def core_of(f):
    d = by_file[f].get('tableDigests') or {}
    return (d.get('glyf') or d.get('CFF '), d.get('cmap'), d.get('hmtx'))

groups = defaultdict(list)
for f, p in proposals.items():
    if p['isVariable']:
        continue  # VF instances handled separately
    groups[(p['familyId'], p['faceId'])].append(f)
conflicts = {}
same_face_builds = {}
for k, files in groups.items():
    if len(files) < 2:
        continue
    cores = {core_of(f) for f in files}
    if len(cores) > 1:
        conflicts['%s/%s' % k] = sorted(files)
    else:
        same_face_builds['%s/%s' % k] = sorted(files)  # same outlines, different name tables/builds

# ---------- legacyName mapping ----------
legacy_map = []
for cat, entries in (('imud', imud), ('ext', ext), ('pri', pri)):
    for e in entries:
        r = by_file.get(e['file'])
        p = proposals.get(e['file'])
        if not r or not p:
            legacy_map.append({'catalog': cat, 'legacyName': e['family'], 'file': e['file'],
                               'familyId': None, 'faceId': None, 'confidence': 'orphan',
                               'evidence': ['file missing on disk']})
            continue
        legacy_map.append({
            'catalog': cat, 'legacyName': e['family'], 'file': e['file'],
            'familyId': p['familyId'], 'faceId': p['faceId'],
            'weight': p['weight'], 'style': p['style'], 'width': p['width'],
            'confidence': p['confidence'], 'flags': p['flags'],
        })

# ---------- capability matrix ----------
def capabilities(r):
    sniff = r['sniff']
    worker_ok = bool((r.get('workerParseAsIs') or {}).get('ok'))
    if sniff in ('woff2', 'woff'):
        worker_ok = False
    pdf_ok = worker_ok and r.get('outline') == 'glyf' and not r.get('cmapError')
    # pdf additionally fails for CFF (no glyf/loca) — outline check covers it
    html_ok = True
    browser_ok = sniff in ('ttf', 'otf', 'woff2', 'woff', 'ttf-mac')
    hebrew_ok = (r.get('coverage', {}).get('hebrewLetters', {}).get('have', 0) >= 27)
    var_axes = bool(r.get('isVariable'))
    return {
        'browser': browser_ok, 'workerMeasure': worker_ok, 'pdfEmbed': pdf_ok,
        'htmlEmbed': html_ok, 'hebrewText': hebrew_ok,
        'variableAxisSelection': False,  # engine selects no axis anywhere (evidence in code)
        'licenseEmbedClass': (r.get('os2') or {}).get('fsTypeClass'),
    }

caps = {}
for r in recs:
    caps[r['file']] = capabilities(r)

# ---------- aggregates ----------
fam_count = defaultdict(set)
for f, p in proposals.items():
    fam_count[p['familyId']].add((p['faceId']))
multi_face_fams = {k: sorted(v) for k, v in fam_count.items() if len(v) > 1}

out = {
    'proposals': proposals,
    'conflicts_sameFamilyFace_differentContent': conflicts,
    'sameFaceDifferentBuild_sameOutlines': same_face_builds,
    'legacyMap': legacy_map,
    'familiesWithMultipleFaces': {k: len(v) for k, v in multi_face_fams.items()},
    'stats': {
        'files': len(recs),
        'proposedFamilies': len(fam_count),
        'familiesWithMultiFaces': len(multi_face_fams),
        'conflictCount': len(conflicts),
        'legacyNamesMapped': len(legacy_map),
    },
}
with open(os.path.join(OUT, 'font_family_mapping.json'), 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)
with open(os.path.join(OUT, 'font_capability_matrix.json'), 'w', encoding='utf-8') as fh:
    json.dump(caps, fh, ensure_ascii=False, indent=1)

# CSVs
with open(os.path.join(OUT, 'font_family_mapping.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['catalog', 'legacyName', 'file', 'proposedFamilyId', 'proposedFaceId',
               'weight', 'style', 'width', 'confidence', 'flags'])
    for m in legacy_map:
        w.writerow([m['catalog'], m['legacyName'], m['file'], m.get('familyId'),
                    m.get('faceId'), m.get('weight'), m.get('style'), m.get('width'),
                    m.get('confidence'), ';'.join(m.get('flags', []))])
with open(os.path.join(OUT, 'font_capability_matrix.csv'), 'w', encoding='utf-8-sig', newline='') as fh:
    w = csv.writer(fh)
    w.writerow(['file', 'format', 'browser', 'workerMeasure', 'pdfEmbed', 'htmlEmbed',
                'hebrewText', 'variableAxes', 'licenseEmbedClass'])
    for r in recs:
        c = caps[r['file']]
        w.writerow([r['file'], r['sniff'], c['browser'], c['workerMeasure'], c['pdfEmbed'],
                    c['htmlEmbed'], c['hebrewText'], r.get('isVariable'), c['licenseEmbedClass']])

print('stats:', out['stats'])
print('conflicts (different outlines):', len(conflicts))
print('same-face different-build (identical outlines, name tables differ):', len(same_face_builds))
for k, files in list(conflicts.items())[:25]:
    print('  CONFLICT', k, '->', files)
print('families with multiple faces (top 15):', sorted(out['familiesWithMultipleFaces'].items(), key=lambda kv: -kv[1])[:15])
low_conf = sum(1 for m in legacy_map if m.get('confidence') == 'low')
med_conf = sum(1 for m in legacy_map if m.get('confidence') == 'medium')
print('legacy entries confidence: high=%d medium=%d low=%d orphan=%d' % (
    len(legacy_map) - low_conf - med_conf - sum(1 for m in legacy_map if m.get('confidence') == 'orphan'),
    med_conf, low_conf, sum(1 for m in legacy_map if m.get('confidence') == 'orphan')))
