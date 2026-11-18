#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Duplicate & conflict analysis for the Tora Book Typesetter RED font catalog.

Consumes scripts/out/font_inventory.json and the three catalogs. Produces:
1. Exact byte duplicates (same sha256, different filenames).
2. Same-content duplicates across containers (same sfnt digest set, TTF vs WOFF2).
3. Same-outline/different-name-table groups (core digests equal, name differs).
4. Same face under multiple family names (file -> >1 catalog family).
5. Same family name pointing to different files (runtime catalogs).
6. Similar-metrics / different-design suspects (same family+weight+width+italic+upem+probe,
   different core digests).
7. fsType restricted / preview-print font lists (embedding permissions).
8. Coverage aggregates.

Output: scripts/out/font_duplicates.json + console summary.
"""
import json
import os
from collections import defaultdict

REPO = '/home/z/my-project/repo'
ASSETS = os.path.join(REPO, 'red-build', 'ui', 'assets', 'imud')
INV = json.load(open('/home/z/my-project/scripts/out/font_inventory.json'))
recs = INV['records']
by_file = {r['file']: r for r in recs}

imud = json.load(open(os.path.join(ASSETS, 'imud-fonts.json')))
ext = json.load(open(os.path.join(ASSETS, 'fonts-extended.json')))
pri = json.load(open(os.path.join(ASSETS, 'fonts-priority.json')))

# ---------- 1. exact sha duplicates ----------
sha_groups = defaultdict(list)
for r in recs:
    sha_groups[r['sha256']].append(r['file'])
exact_dups = {sha: sorted(fs) for sha, fs in sha_groups.items() if len(fs) > 1}

# ---------- 2/3. content-level duplicates ----------
def core_digest(r):
    d = r.get('tableDigests') or {}
    return (d.get('glyf') or d.get('CFF '), d.get('cmap'), d.get('hmtx'), d.get('head'))

core_groups = defaultdict(list)
for r in recs:
    core_groups[core_digest(r)].append(r['file'])
core_dups = {k: sorted(v) for k, v in core_groups.items() if k[0] and k[1] and len(v) > 1}

# distinguish: identical whole sfnt (all tables equal) vs core-only equal (name table differs)
sfnt_groups = defaultdict(list)
for r in recs:
    if r.get('sfntSha256'):
        sfnt_groups[r['sfntSha256']].append(r['file'])
sfnt_dups = {sha: sorted(fs) for sha, fs in sfnt_groups.items() if len(fs) > 1}

core_only_dups = {}
for k, files in core_dups.items():
    if k in sfnt_dups and set(files) <= set(sfnt_dups[k]):
        continue
    # spread over multiple sfnt hashes?
    hashes = {by_file[f]['sfntSha256'] for f in files}
    if len(hashes) > 1:
        core_only_dups[k] = files

# ---------- 4. same face under multiple family names (file -> families) ----------
file_fams = defaultdict(set)
for cat, entries in (('imud', imud), ('ext', ext), ('pri', pri)):
    for e in entries:
        file_fams[e['file']].add((cat, e['family']))
multi_named = {}
for f, fams in file_fams.items():
    runtime_fams = {fam for cat, fam in fams if cat in ('imud', 'ext')}
    if len(runtime_fams) > 1:
        multi_named[f] = sorted(runtime_fams)

# ---------- 5. same family -> different files (runtime catalogs) ----------
fam_files = defaultdict(set)
for cat, entries in (('imud', imud), ('ext', ext)):
    for e in entries:
        fam_files[(cat, e['family'])].add(e['file'])
fam_multi_files = {}
for (cat, fam), files in fam_files.items():
    if len(files) > 1:
        fam_multi_files['%s:%s' % (cat, fam)] = sorted(files)

# ---------- 6. cross-format base-name collisions (ttf vs woff2 on disk) ----------
ttf_bases = {os.path.splitext(r['file'])[0] for r in recs if r['sniff'] in ('ttf', 'otf')}
woff2_bases = {os.path.splitext(r['file'])[0] for r in recs if r['sniff'] == 'woff2'}
cross_format_same_basename = sorted(ttf_bases & woff2_bases)

# ---------- 7. similar metrics, different design suspects ----------
def style_key(r):
    os2 = r.get('os2') or {}
    post = r.get('post') or {}
    n = r.get('name') or {}
    fam = n.get('typoFamily') or n.get('family') or '?'
    return (fam, os2.get('usWeightClass'), os2.get('usWidthClass'),
            round(float(post.get('italicAngle') or 0), 2),
            (r.get('head') or {}).get('unitsPerEm'), r.get('probeAdvanceEm'),
            r.get('outline'), r.get('isVariable'))

style_groups = defaultdict(list)
for r in recs:
    if r.get('parse_ok'):
        style_groups[style_key(r)].append(r['file'])
similar_groups = {k: sorted(v) for k, v in style_groups.items()
                  if len(v) > 1 and k[0] and all(core_digest(by_file[f]) != core_digest(by_file[v[0]]) for f in v[1:])}

# keep only groups where files are NOT already exact/core duplicates
sim_clean = {}
for k, files in similar_groups.items():
    cores = {core_digest(by_file[f]) for f in files}
    if len(cores) == len(files):
        sim_clean[k] = files

# ---------- 8. fsType restricted / preview lists ----------
restricted = sorted(r['file'] for r in recs if (r.get('os2') or {}).get('fsTypeClass') == 'restricted-no-embedding')
preview_print = sorted(r['file'] for r in recs if (r.get('os2') or {}).get('fsTypeClass') == 'preview-print-only')

# ---------- coverage aggregates ----------
def cov(r, k):
    return (r.get('coverage', {}).get(k, {}) or {}).get('have', -1)

agg = {
    'files': len(recs),
    'hebrewLetters_full': sum(1 for r in recs if cov(r, 'hebrewLetters') == 27),
    'nikud_full': sum(1 for r in recs if cov(r, 'nikud') == 18),
    'taamim_any_ge20': sum(1 for r in recs if cov(r, 'taamim') >= 20),
    'taamim_full31': sum(1 for r in recs if cov(r, 'taamim') == 31),
    'corpus_full44': sum(1 for r in recs if cov(r, 'corpus') == 44),
    'corpus_zero': sum(1 for r in recs if cov(r, 'corpus') == 0),
}

# families with >1 faces in the runtime catalogs (by file-name clustering heuristics)
# per user rule: same family with Regular+Bold etc. are NOT duplicates — count them as evidence for family grouping
from collections import Counter
def base_key(r):
    n = r.get('name') or {}
    return (n.get('typoFamily') or n.get('family') or '').strip().lower()

fam_face_counter = Counter(base_key(r) for r in recs if r.get('parse_ok'))
families_multi_face = {k: v for k, v in fam_face_counter.items() if v > 1}

out = {
    'exactDuplicates': exact_dups,
    'sfntIdenticalDuplicates': sfnt_dups,
    'coreDigestSameDifferentNameTable': core_only_dups,
    'sameFileMultipleFamilyNames': multi_named,
    'sameFamilyMultipleFiles': fam_multi_files,
    'crossFormatSameBasename': cross_format_same_basename,
    'similarMetricsDifferentDesign': {str(k): v for k, v in sim_clean.items()},
    'fsTypeRestrictedNoEmbedding': restricted,
    'fsTypePreviewPrintOnly': preview_print,
    'coverageAggregates': agg,
    'familiesWithMultipleFacesOnDisk': dict(sorted(families_multi_face.items(), key=lambda kv: -kv[1])[:80]),
}

with open('/home/z/my-project/scripts/out/font_duplicates.json', 'w', encoding='utf-8') as fh:
    json.dump(out, fh, ensure_ascii=False, indent=1)

print('exact sha256 duplicate groups:', len(exact_dups))
for sha, fs in exact_dups.items():
    print('   ', sha[:12], fs)
print('sfnt-identical groups (incl. cross-container):', len(sfnt_dups))
for sha, fs in list(sfnt_dups.items())[:12]:
    print('   ', sha[:12], fs)
print('core-digest equal but name table differs:', len(core_only_dups))
print('same file under multiple family names:', len(multi_named))
for f, fams in multi_named.items():
    print('   ', f, '->', fams)
print('same family pointing to different files:', len(fam_multi_files))
for fam, files in fam_multi_files.items():
    print('   ', fam, '->', files)
print('cross-format same basename (ttf+woff2):', cross_format_same_basename)
print('similar-metrics different-design groups:', len(sim_clean))
for k, files in list(sim_clean.items())[:30]:
    print('   ', k, '->', files)
print('fsType restricted (no embedding):', len(restricted))
print(restricted)
print('fsType preview-print-only:', len(preview_print))
print('coverage aggregates:', agg)
print('families with multiple faces on disk (top):', sorted(families_multi_face.items(), key=lambda kv: -kv[1])[:20])
