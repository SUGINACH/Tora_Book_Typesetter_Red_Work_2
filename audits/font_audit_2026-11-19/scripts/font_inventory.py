#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Forensic font inventory for Tora Book Typesetter RED.

Scans red-build/ui/assets/imud/fonts/ (1,759 files), extracts per-file metadata,
Hebrew/corpus coverage, embedding permissions, variable axes, and cross-references
against the three catalogs (imud-fonts.json runtime TTF, fonts-extended.json runtime
WOFF2, fonts-priority.json build-source WOFF2).

Also mimics red-build/src/engine/typography/font-metrics.js parseFont() validation
rules (sfnt-only, table count<=64, required tables, unitsPerEm range, cmap fmt4/12
sanity) to classify worker-parseability of the file as-is and after WOFF2->sfnt
decompression.

Outputs: scripts/out/font_inventory.json (machine) + console summary.
Run: python3 scripts/font_inventory.py
"""
import hashlib
import io
import json
import os
import struct
import sys

from fontTools.ttLib import TTFont

REPO = '/home/z/my-project/repo'
ASSETS = os.path.join(REPO, 'red-build', 'ui', 'assets', 'imud')
FONT_DIR = os.path.join(ASSETS, 'fonts')
OUT_DIR = '/home/z/my-project/scripts/out'
os.makedirs(OUT_DIR, exist_ok=True)

# ---------- Hebrew coverage sets ----------
HEB_LETTERS = set(range(0x05D0, 0x05EB + 1))                                   # 27 letters (incl. finals)
NIKUD = (set(range(0x05B0, 0x05BD + 1)) | {0x05BF, 0x05C1, 0x05C2, 0x05C7})     # vowel points
TAAMIM = set(range(0x0591, 0x05AF + 1)) | {0x05C6}                              # cantillation
HEB_PUNCT = {0x05BE, 0x05C0, 0x05C3, 0x05C4, 0x05C5, 0x05F3, 0x05F4}            # maqaf, paseq, sof-pasuq, geresh(ayim)...
LATIN_BASIC = set(range(0x20, 0x7F))                                            # printable ASCII

PROBE = 'אבגדהוזחטיכלמנסעפצקרשת0123456789ABab.,:;'

# ---------- corpus character inventory ----------
CORPUS_FILES = [
    'very_long_test_text.txt', 'long_test_text.txt',
    'mid_long_test_text.txt', 'no_long_test_text.txt',
]
corpus_chars = set()
for cf in CORPUS_FILES:
    p = os.path.join(REPO, 'audits', cf)
    if not os.path.exists(p):
        continue
    with open(p, encoding='utf-8', errors='replace') as fh:
        corpus_chars.update(fh.read())
corpus_nonascii = {c for c in corpus_chars if ord(c) > 0x7E and not c.isspace()}
corpus_ascii_letters_digits = {c for c in corpus_chars if c.isalnum() and ord(c) < 0x80}


def sniff_format(path):
    with open(path, 'rb') as fh:
        head = fh.read(4)
    if head == b'wOF2':
        return 'woff2'
    if head == b'wOFF':
        return 'woff'
    if head == b'OTTO':
        return 'otf'
    if head == b'ttcf':
        return 'ttc'
    if head == b'\x00\x01\x00\x00':
        return 'ttf'
    if head == b'true':
        return 'ttf-mac'
    return 'unknown'


def name_record(font, nameID):
    """Best-effort name lookup: prefer Windows/Unicode (utf-16-be), then Mac/Roman."""
    name = font['name']
    recs = name.names
    cand = [r for r in recs if r.nameID == nameID]
    if not cand:
        return None
    def score(r):
        s = 0
        if r.platformID == 3:
            s += 2
        if r.platformID == 0:
            s += 2
        if r.platformID == 1:
            s += 1
        return s
    for r in sorted(cand, key=score, reverse=True):
        try:
            s = r.toUnicode()
        except Exception:
            continue
        if s:
            return s
    return None


def js_parse_check(sfnt):
    """Mimic font-metrics.js parseFont() validation on raw sfnt bytes."""
    b = sfnt
    if len(b) < 12:
        return False, 'too-small'
    ver = struct.unpack('>I', b[0:4])[0]
    if ver not in (0x00010000, 0x4F54544F):
        if ver == 0x74746366:
            return False, 'ttcf-collections-unsupported'
        return False, 'bad-sfnt-version:0x%x' % ver
    numTables = struct.unpack('>H', b[4:6])[0]
    if numTables == 0 or numTables > 64:
        return False, 'bad-table-count:%d' % numTables
    tables = {}
    for i in range(numTables):
        rec = 12 + i * 16
        if rec + 16 > len(b):
            return False, 'table-dir-truncated'
        tag = b[rec:rec + 4].decode('latin-1')
        off, ln = struct.unpack('>II', b[rec + 8:rec + 16])
        if off + ln > len(b):
            return False, 'table-out-of-range:%s' % tag
        tables[tag] = (off, ln)
    for t in ('head', 'maxp', 'hhea', 'hmtx', 'cmap'):
        if t not in tables:
            return False, 'missing-table:%s' % t
    ho = tables['head'][0]
    unitsPerEm = struct.unpack('>H', b[ho + 18:ho + 20])[0]
    if not (16 <= unitsPerEm <= 16384):
        return False, 'bad-units-per-em:%d' % unitsPerEm
    numGlyphs = struct.unpack('>H', b[tables['maxp'][0] + 4:tables['maxp'][0] + 6])[0]
    if numGlyphs == 0:
        return False, 'bad-num-glyphs:0'
    hho = tables['hhea'][0]
    numberOfHMetrics = struct.unpack('>H', b[hho + 34:hho + 36])[0]
    if numberOfHMetrics == 0 or numberOfHMetrics > numGlyphs:
        return False, 'bad-hmtx-count:%d' % numberOfHMetrics
    # cmap sanity: unicode subtable exists (fmt4/fmt12 parse errors are hard to
    # fully mirror; approximate with presence of a unicode cmap subtable)
    cm = tables['cmap'][0]
    numSub = struct.unpack('>H', b[cm + 2:cm + 4])[0]
    if numSub > 64:
        return False, 'cmap:too-many-subtables:%d' % numSub
    has_unicode = False
    any_sub = False
    for i in range(numSub):
        rec = cm + 4 + i * 8
        plat, enc = struct.unpack('>HH', b[rec:rec + 4])
        off = struct.unpack('>I', b[rec + 4:rec + 8])[0]
        fmt = struct.unpack('>H', b[cm + off:cm + off + 2])[0]
        any_sub = True
        unicodeish = (plat == 3 and enc in (1, 10)) or plat == 0
        if unicodeish and fmt in (4, 12, 6):
            has_unicode = True
    if not has_unicode:
        return False, 'cmap:no-unicode-subtable'
    return True, None


def sfnt_bytes(path):
    """Decompress to plain sfnt via fontTools round-trip (lazy, no table access)."""
    f = TTFont(path, lazy=True)
    flavor = f.flavor
    if flavor is None:
        f.close()
        with open(path, 'rb') as fh:
            return fh.read()
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    data = buf.getvalue()
    f.close()
    return data


def table_digests(sfnt, tags=('glyf', 'loca', 'cmap', 'hmtx', 'head', 'hhea', 'OS/2', 'name', 'CFF ', 'maxp', 'post')):
    """sha256 of raw sfnt table bytes (first 16 hex chars)."""
    out = {}
    if len(sfnt) < 12:
        return out
    numTables = struct.unpack('>H', sfnt[4:6])[0]
    for i in range(numTables):
        rec = 12 + i * 16
        tag = sfnt[rec:rec + 4].decode('latin-1')
        off, ln = struct.unpack('>II', sfnt[rec + 8:rec + 16])
        if tag in tags:
            out[tag] = hashlib.sha256(sfnt[off:off + ln]).hexdigest()[:16]
    return out


def fs_type_class(fsType):
    if fsType == 0:
        return 'installable'
    if fsType & 0x0002:
        return 'restricted-no-embedding'
    if fsType & 0x0004:
        return 'preview-print-only'
    if fsType & 0x0008:
        return 'editable'
    return 'unknown(0x%04x)' % fsType


def analyze(path, catalogs_by_file):
    fname = os.path.basename(path)
    rec = {'file': fname, 'sizeBytes': os.path.getsize(path)}
    with open(path, 'rb') as fh:
        raw = fh.read()
    rec['sha256'] = hashlib.sha256(raw).hexdigest()
    rec['sniff'] = sniff_format(path)
    rec['catalogEntries'] = catalogs_by_file.get(fname, [])
    # catalog entry format: [{catalog, family}]
    rec['inRuntimeCatalog'] = any(e['catalog'] in ('imud', 'ext') for e in rec['catalogEntries'])
    rec['inPrioritySourceCatalog'] = any(e['catalog'] == 'pri' for e in rec['catalogEntries'])

    # decompress to sfnt (for digest + js-parse-after-conversion evidence)
    try:
        sfnt = sfnt_bytes(path)
        rec['sfntBytes'] = len(sfnt)
        rec['sfntSha256'] = hashlib.sha256(sfnt).hexdigest()
        rec['tableDigests'] = table_digests(sfnt)
    except Exception as e:
        sfnt = None
        rec['sfntError'] = '%s: %s' % (type(e).__name__, e)
        rec['tableDigests'] = {}

    # JS-parser check as-is (raw file bytes) and after decompression
    rec['workerParseAsIs'] = None
    if rec['sniff'] in ('ttf', 'otf', 'ttf-mac'):
        ok, err = js_parse_check(raw)
        rec['workerParseAsIs'] = {'ok': ok, 'error': err}
    elif sfnt is not None and rec['sniff'] in ('woff2', 'woff'):
        ok, err = js_parse_check(raw)
        rec['workerParseAsIs'] = {'ok': False, 'error': 'bad-sfnt-version:0x%x (flavor=%s)' % (
            struct.unpack('>I', raw[0:4])[0], rec['sniff'])}
        ok2, err2 = js_parse_check(sfnt)
        rec['workerParseIfConvertedToSfnt'] = {'ok': ok2, 'error': err2}

    # fontTools deep parse
    try:
        font = TTFont(path, lazy=True)
        rec['sfntVersion'] = hex(font.sfntVersion) if isinstance(font.sfntVersion, int) else str(font.sfntVersion)
        rec['tables'] = sorted(font.keys())
        rec['outline'] = 'glyf' if 'glyf' in font.keys() else ('cff' if 'CFF ' in font.keys() else ('cff2' if 'CFF2' in font.keys() else None))
        # variable axes
        axes = []
        if 'fvar' in font.keys():
            try:
                for ax in font['fvar'].axes:
                    axes.append({'tag': ax.axisTag,
                                'name': name_record(font, ax.axisNameID) or ax.axisTag,
                                'min': ax.minValue, 'default': ax.defaultValue, 'max': ax.maxValue})
            except Exception as e:
                axes.append({'error': str(e)})
        rec['variableAxes'] = axes
        rec['isVariable'] = bool(axes) or ('gvar' in font.keys())
        # names
        rec['name'] = {}
        for nid, key in ((0, 'copyright'), (1, 'family'), (2, 'subfamily'), (3, 'uniqueId'),
                         (4, 'fullName'), (6, 'postScriptName'), (10, 'description'),
                         (11, 'vendorUrl'), (13, 'license'), (16, 'typoFamily'), (17, 'typoSubfamily')):
            v = name_record(font, nid)
            if v:
                rec['name'][key] = v
        # OS/2
        os2 = {}
        if 'OS/2' in font.keys():
            t = font['OS/2']
            os2 = {'version': getattr(t, 'version', None),
                   'usWeightClass': t.usWeightClass,
                   'usWidthClass': t.usWidthClass,
                   'fsSelection': t.fsSelection,
                   'fsType': t.fsType,
                   'fsTypeClass': fs_type_class(t.fsType),
                   'sTypoAscender': getattr(t, 'sTypoAscender', None),
                   'sTypoDescender': getattr(t, 'sTypoDescender', None),
                   'sTypoLineGap': getattr(t, 'sTypoLineGap', None),
                   'sFamilyClass': getattr(t, 'sFamilyClass', None),
                   'usWinAscent': getattr(t, 'usWinAscent', None),
                   'usWinDescent': getattr(t, 'usWinDescent', None),
                   'sCapHeight': getattr(t, 'sCapHeight', None) if getattr(t, 'version', 0) >= 2 else None}
        rec['os2'] = os2
        # head
        if 'head' in font.keys():
            h = font['head']
            rec['head'] = {'unitsPerEm': h.unitsPerEm, 'macStyle': h.macStyle,
                           'flags': h.flags, 'created': str(h.created), 'modified': str(h.modified)}
        # hhea
        if 'hhea' in font.keys():
            hh = font['hhea']
            rec['hhea'] = {'ascender': hh.ascender, 'descender': hh.descender,
                           'lineGap': hh.lineGap, 'numberOfHMetrics': hh.numberOfHMetrics}
        # post
        if 'post' in font.keys():
            rec['post'] = {'italicAngle': font['post'].italicAngle}
        # maxp
        rec['numGlyphs'] = font['maxp'].numGlyphs
        # kern / GPOS presence
        rec['hasKernTable'] = 'kern' in font.keys()
        rec['hasGpos'] = 'GPOS' in font.keys()
        # cmap coverage
        cps = set()
        try:
            cmap = font.getBestCmap()
            cps = set(cmap.keys())
        except Exception as e:
            rec['cmapError'] = str(e)
        rec['cmapUnicodeSize'] = len(cps)
        cov = {}
        for label, s in (('hebrewLetters', HEB_LETTERS), ('nikud', NIKUD), ('taamim', TAAMIM),
                         ('hebrewPunct', HEB_PUNCT), ('latinBasic', LATIN_BASIC)):
            have = cps & s
            cov[label] = {'have': len(have), 'need': len(s), 'missing': sorted(hex(c) for c in (s - have))}
        corpus_have = {c for c in corpus_nonascii if ord(c) in cps}
        cov['corpus'] = {'nonAsciiHave': len(corpus_have), 'nonAsciiNeed': len(corpus_nonascii),
                         'missingTop': sorted(set(hex(ord(c)) for c in corpus_nonascii if ord(c) not in cps))[:24]}
        rec['coverage'] = cov
        # metrics fingerprint: advance sums over probe string (glyph-name based)
        try:
            hmtx = font['hmtx']
            upem = font['head'].unitsPerEm
            cmap_tab = font.getBestCmap()
            tot = 0.0
            for ch in PROBE:
                gname = cmap_tab.get(ord(ch))
                if gname:
                    w = hmtx[gname]
                    tot += (w[0] if isinstance(w, tuple) else w) / upem
            rec['probeAdvanceEm'] = round(tot, 4)
        except Exception as e:
            rec['probeAdvanceEm'] = None
            rec['probeError'] = str(e)[:120]
        font.close()
        rec['parse_ok'] = True
    except Exception as e:
        rec['parse_ok'] = False
        rec['parse_error'] = '%s: %s' % (type(e).__name__, e)
    return rec


def main():
    # load catalogs
    with open(os.path.join(ASSETS, 'imud-fonts.json'), encoding='utf-8') as fh:
        imud = json.load(fh)
    with open(os.path.join(ASSETS, 'fonts-extended.json'), encoding='utf-8') as fh:
        ext = json.load(fh)
    with open(os.path.join(ASSETS, 'fonts-priority.json'), encoding='utf-8') as fh:
        pri = json.load(fh)
    catalogs_by_file = {}
    for cat, entries in (('imud', imud), ('ext', ext), ('pri', pri)):
        for e in entries:
            catalogs_by_file.setdefault(e['file'], []).append({'catalog': cat, 'family': e['family']})

    files = sorted(os.listdir(FONT_DIR))
    files = [f for f in files if f.lower().endswith(('.ttf', '.otf', '.woff', '.woff2', '.ttc', '.otc'))]
    print('scanning %d font files; corpus non-ASCII unique chars: %d' % (len(files), len(corpus_nonascii)))
    records = []
    for i, fn in enumerate(files):
        try:
            records.append(analyze(os.path.join(FONT_DIR, fn), catalogs_by_file))
        except Exception as e:
            records.append({'file': fn, 'fatal': '%s: %s' % (type(e).__name__, e)})
        if (i + 1) % 200 == 0:
            print('  %d/%d' % (i + 1, len(files)), file=sys.stderr)

    # catalog-side cross checks
    disk = set(files)
    cat_report = {}
    for cat, entries in (('imud', imud), ('ext', ext), ('pri', pri)):
        missing = [e for e in entries if e['file'] not in disk]
        cat_report[cat] = {'entries': len(entries), 'uniqueFiles': len({e['file'] for e in entries}),
                           'entriesWithFileMissingOnDisk': len(missing)}

    out = {
        'generatedAt': '2026-11-19T00:00:00Z',
        'repoHead': None,
        'fontDir': 'red-build/ui/assets/imud/fonts',
        'fileCount': len(files),
        'corpus': {'files': CORPUS_FILES,
                   'nonAsciiUnique': len(corpus_nonascii),
                   'nonAsciiChars': sorted(hex(ord(c)) for c in corpus_nonascii)},
        'catalogReport': cat_report,
        'records': records,
    }
    with open(os.path.join(OUT_DIR, 'font_inventory.json'), 'w', encoding='utf-8') as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    # console summary
    sniff = {}
    for r in records:
        sniff[r['sniff']] = sniff.get(r['sniff'], 0) + 1
    print('sniff:', sniff)
    failed = [r for r in records if not r.get('parse_ok')]
    print('fontTools parse failures:', len(failed), [r['file'] for r in failed][:10])
    js_fail = [r for r in records if r.get('workerParseAsIs') and not r['workerParseAsIs']['ok']]
    print('worker parseFont as-is failures:', len(js_fail), [(r['file'], r['workerParseAsIs']['error']) for r in js_fail[:8]])
    conv_fail = [r for r in records if r.get('workerParseIfConvertedToSfnt') and not r['workerParseIfConvertedToSfnt']['ok']]
    print('worker parseFont after woff2->sfnt conversion failures:', len(conv_fail),
          [(r['file'], r['workerParseIfConvertedToSfnt']['error']) for r in conv_fail[:8]])
    var_fonts = [r for r in records if r.get('isVariable')]
    print('variable fonts:', len(var_fonts), [(r['file'], [(a['tag'], a['default']) for a in r.get('variableAxes') or []]) for r in var_fonts])
    cff = [r for r in records if r.get('outline') == 'cff']
    print('CFF (OTTO) outline fonts:', len(cff), [r['file'] for r in cff][:10])
    # coverage stats for the defaults
    for f in ('Guttman-Rashi-Normal.ttf', 'FrankRuhlLibre-VF.ttf', 'Alpha-Black.ttf', 'Sgula-Regular.ttf',
              'Hadassah-Friedlaender-Regular.ttf', 'NotoSerifHebrew-VF.ttf', 'DavidLibre-Bold.ttf'):
        r = next((x for x in records if x['file'] == f), None)
        if r:
            c = r.get('coverage', {})
            print(f, '->', {k: v.get('have', '?') for k, v in c.items() if isinstance(v, dict)},
                  '| probeEm:', r.get('probeAdvanceEm'), '| var:', r.get('isVariable'))
    fst = {}
    for r in records:
        cl = (r.get('os2') or {}).get('fsTypeClass', 'n/a')
        fst[cl] = fst.get(cl, 0) + 1
    print('fsType classes:', fst)


if __name__ == '__main__':
    main()
