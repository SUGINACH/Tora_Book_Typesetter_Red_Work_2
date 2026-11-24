#!/usr/bin/env python3
"""Stress conversion of every CFF/CFF2 catalog font without touching source assets."""
from __future__ import annotations
import argparse, json, hashlib, sys, re
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from prove_font_conversion import convert_cff_to_glyf, convert_cff_to_glyf_decomposed, glyph_bounds, raw_glyf_bounds, java_subset_check, write_glyph_comparison, MAX_ERR_EM
from audit_font_catalog import read_catalog


def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1])
    p.add_argument('--output',type=Path,default=Path('artifacts/cff-conversion-stress/report.json'))
    p.add_argument('--visual-dir',type=Path,default=Path('artifacts/cff-conversion-stress/visuals'))
    args=p.parse_args(); root=args.repo_root.resolve(); assets=root/'red-build/ui/assets/imud'
    core=read_catalog(assets/'imud-fonts.json','core'); ext=read_catalog(assets/'fonts-extended.json','extended')
    families_by_file={}
    for entry in core+ext:
        families_by_file.setdefault(str(entry['file']), []).append(str(entry['family']))
    unique={str(e['file']) for e in core+ext}
    rows=[]; failures=[]; maximum=None
    for rel in sorted(unique):
        src=assets/'fonts'/rel
        families=sorted(set(families_by_file.get(rel, [])))
        family_text=' '.join(families)
        icon_or_symbol = bool(re.search(r'\b(icon|icons|symbol|symbols|logo|logos|pictogram)\b', family_text, re.I) or any(term in family_text for term in ('אייקונ','סמל','לוגו')))
        row={'file':rel,'catalogFamilies':families,'catalogUsageHint':'symbol-or-nontext' if icon_or_symbol else 'unspecified'}
        try:
            f=TTFont(str(src),lazy=False,recalcBBoxes=False,recalcTimestamp=False)
            if 'CFF ' not in f and 'CFF2' not in f:
                f.close(); continue
            row.update({'sourceSha256':sha(src),'sourceFlavor':f.flavor or 'sfnt','glyphCount':len(f.getGlyphOrder()),'upem':int(f['head'].unitsPerEm),'outline':'CFF2' if 'CFF2' in f else 'CFF'})
            if 'fvar' in f:
                axes={a.axisTag:float(a.defaultValue) for a in f['fvar'].axes}
                instantiateVariableFont(f,axes,inplace=True,updateFontNames=False,static=True)
                row['instancedAxes']=axes
            source_cff_top = f['CFF '].cff.topDictIndex[0] if 'CFF ' in f else None
            if source_cff_top is not None:
                matrix=getattr(source_cff_top,'FontMatrix',None)
                bbox=getattr(source_cff_top,'FontBBox',None)
                row['sourceCffFontMatrix']=[float(v) for v in matrix] if matrix else None
                row['sourceCffFontBBox']=[float(v) for v in bbox] if bbox else None
            order=list(f.getGlyphOrder())
            source_bounds_by_name = glyph_bounds(f, prefer_cff=True)
            source_bounds_by_gid = [source_bounds_by_name.get(name) for name in order]
            cmap0={int(cp):int(f.getGlyphID(n)) for cp,n in (f.getBestCmap() or {}).items()}
            metrics0=[tuple(int(v) for v in f['hmtx'].metrics[n]) for n in order]
            upem=float(f['head'].unitsPerEm)
            tol=upem*MAX_ERR_EM
            geom=convert_cff_to_glyf(f,tol); row['maxBoundsDeltaFontUnits']=geom['maxBoundsDeltaFontUnits']; row['worstGlyph']=geom['worstGlyph']
            if geom.get('worstGlyph'):
                gid=int(geom['worstGlyph']['gid'])
                row['worstGlyphHmtx']={'advanceWidth':metrics0[gid][0],'leftSideBearing':metrics0[gid][1]}
                src_bounds=geom['worstGlyph'].get('sourceBounds')
                conv_bounds=geom['worstGlyph'].get('convertedBounds')
                if src_bounds and conv_bounds:
                    row['worstGlyphOriginDelta']={
                        'dxFromXMin':float(src_bounds[0])-float(conv_bounds[0]),
                        'dyFromYMin':float(src_bounds[1])-float(conv_bounds[1]),
                        'rightEdgeResidual':(float(src_bounds[2])-float(conv_bounds[2]))-(float(src_bounds[0])-float(conv_bounds[0])),
                        'topEdgeResidual':(float(src_bounds[3])-float(conv_bounds[3]))-(float(src_bounds[1])-float(conv_bounds[1])),
                    }
                if source_cff_top is not None:
                    try:
                        charstring=source_cff_top.CharStrings[geom['worstGlyph']['name']]
                        charstring.decompile()
                        row['worstGlyphCffProgramPreview']=[str(x) for x in charstring.program[:80]]
                    except Exception as diagnostic_exc:
                        row['worstGlyphCffProgramDiagnosticError']=f'{type(diagnostic_exc).__name__}: {diagnostic_exc}'
            candidate_delta_em = row['maxBoundsDeltaFontUnits'] / upem
            if maximum is None or candidate_delta_em > maximum['deltaEm']:
                maximum={'file':rel,'delta':row['maxBoundsDeltaFontUnits'],'deltaEm':candidate_delta_em,'worstGlyph':row['worstGlyph']}
            converted_order=list(f.getGlyphOrder())
            converted_bounds=raw_glyf_bounds(f)
            converted_bounds_by_gid=[converted_bounds.get(name) for name in converted_order]
            f.flavor=None; tmp=root/'artifacts/cff-conversion-stress/tmp'
            tmp.mkdir(parents=True,exist_ok=True); output=tmp/(hashlib.sha256(rel.encode()).hexdigest()+'.ttf'); f.save(str(output))
            if rel == 'Ploni-Regular.ttf' and len(order) > 725:
                target_gid = 725
                target_name = order[target_gid]
                raw_target = converted_bounds_by_gid[target_gid]
                source_target = source_bounds_by_gid[target_gid]
                aligned_target = glyph_bounds(f, prefer_cff=False).get(target_name)
                stored_target = f['glyf'][target_name]
                target_lsb = int(f['hmtx'].metrics[target_name][1])
                row['ploniGID725Diagnostic'] = {
                    'gid': target_gid,
                    'glyphName': target_name,
                    'sourceCffBounds': [float(v) for v in source_target] if source_target else None,
                    'rawConvertedGlyfBounds': [float(v) for v in raw_target] if raw_target else None,
                    'glyphSetAlignedBounds': [float(v) for v in aligned_target] if aligned_target else None,
                    'advanceWidth': int(f['hmtx'].metrics[target_name][0]),
                    'leftSideBearing': target_lsb,
                    'storedGlyfXMin': int(stored_target.xMin) if hasattr(stored_target, 'xMin') else None,
                    'glyphSetHorizontalTranslation': (
                        target_lsb - int(stored_target.xMin) if hasattr(stored_target, 'xMin') else 0
                    ),
                    'rawBoundsDeltaFontUnits': (
                        max(abs(float(a)-float(b)) for a,b in zip(source_target,raw_target))
                        if source_target and raw_target else None
                    ),
                    'alignedBoundsDeltaFontUnits': (
                        max(abs(float(a)-float(b)) for a,b in zip(source_target,aligned_target))
                        if source_target and aligned_target else None
                    ),
                }
                row['ploniGID725VisualComparison'] = write_glyph_comparison(
                    src, output, target_gid,
                    args.visual_dir if args.visual_dir.is_absolute() else root / args.visual_dir,
                    'ploni-gid725-raw',
                )
            f.close()
            out=TTFont(str(output),lazy=False,recalcBBoxes=False,recalcTimestamp=False)
            cmap1={int(cp):int(out.getGlyphID(n)) for cp,n in (out.getBestCmap() or {}).items()}
            metrics1=[tuple(int(v) for v in out['hmtx'].metrics[n]) for n in out.getGlyphOrder()]
            if cmap1!=cmap0: raise ValueError('cmap-to-GID mapping changed')
            if metrics1!=metrics0: raise ValueError('hmtx advance/sidebearing changed')
            if len(out.getGlyphOrder())!=len(order): raise ValueError('glyph count changed')
            bounds1=raw_glyf_bounds(out); maxround=0.0
            for gid,n in enumerate(out.getGlyphOrder()):
                a=converted_bounds_by_gid[gid]; b=bounds1[n]
                if a is None or b is None:
                    if a!=b: raise ValueError(f'empty outline changed at GID {gid}')
                    continue
                maxround=max(maxround,max(abs(float(x)-float(y)) for x,y in zip(a,b)))
            if maxround>0.01: raise ValueError(f'round-trip bbox changed {maxround}')
            if 'glyf' not in out or 'loca' not in out or 'CFF ' in out: raise ValueError('output not glyf/loca')
            cmap = out.getBestCmap() or {}
            bounds_by_name = raw_glyf_bounds(out)
            mapped_letters = [cp for cp in range(0x05D0, 0x05EB) if cp in cmap]
            empty_letters = [cp for cp in mapped_letters if bounds_by_name.get(cmap[cp]) is None]
            row['hebrewLettersMapped'] = len(mapped_letters)
            row['hebrewLettersWithNonEmptyOutlines'] = len(mapped_letters) - len(empty_letters)
            row['emptyMappedHebrewLetters'] = [f'U+{cp:04X}' for cp in empty_letters]
            if empty_letters and len(empty_letters) != len(mapped_letters) and not icon_or_symbol:
                raise ValueError('mixed empty/non-empty Hebrew letter mappings in a text-like catalog font: ' + ','.join(f'U+{cp:04X}' for cp in empty_letters))
            if empty_letters and icon_or_symbol:
                row['coverageClass'] = 'symbol-or-nontext-font'
                row['coverageWarnings'] = ['catalog family identifies an icon/logo/symbol font; mapped Hebrew codepoints with empty outlines are not treated as text coverage']
                hebrew = ''
            elif empty_letters and len(empty_letters) == len(mapped_letters):
                row['coverageClass'] = 'non-hebrew'
                row['coverageWarnings'] = ['all mapped Hebrew letter codepoints have empty outlines; Hebrew text coverage is not claimed']
                hebrew = ''
            else:
                hebrew = ''.join(chr(cp) for cp in mapped_letters)
                row['coverageClass'] = 'full-hebrew' if len(mapped_letters) == 27 else ('partial-hebrew' if mapped_letters else 'non-hebrew')
            mapped_marks = [cp for cp in range(0x0591, 0x05C8) if cp in cmap]
            empty_marks = [cp for cp in mapped_marks if bounds_by_name.get(cmap[cp]) is None]
            supported_marks = [cp for cp in mapped_marks if cp not in empty_marks]
            row['hebrewMarksMapped'] = len(mapped_marks)
            row['hebrewMarksWithNonEmptyOutlines'] = len(supported_marks)
            row['emptyMappedHebrewMarks'] = [f'U+{cp:04X}' for cp in empty_marks]
            if empty_marks:
                row.setdefault('coverageWarnings', []).append('mapped Hebrew marks have empty outlines; these marks are excluded from the subset sample')
            if hebrew:
                sample = hebrew + ''.join(chr(cp) for cp in supported_marks)
            else:
                latin = ''.join(ch for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' if ord(ch) in cmap and bounds_by_name.get(cmap[ord(ch)]) is not None)
                if not latin:
                    latin = ''.join(chr(cp) for cp in sorted(cmap) if 0x20 <= cp <= 0x7E and not chr(cp).isspace() and bounds_by_name.get(cmap[cp]) is not None)[:12]
                if not latin:
                    visible = [cp for cp in sorted(cmap) if bounds_by_name.get(cmap[cp]) is not None]
                    if not visible:
                        raise ValueError('no mapped non-empty Unicode glyph available for production subset check')
                    sample = ''.join(chr(cp) for cp in visible[:16])
                else:
                    sample = latin[:32]
            visual_dir = args.visual_dir if args.visual_dir.is_absolute() else root / args.visual_dir
            row['maxBoundsDeltaEm'] = row['maxBoundsDeltaFontUnits'] / upem
            row['maxBoundsDeltaOverTolerance'] = row['maxBoundsDeltaFontUnits'] / tol if tol else None
            visual_outlier = row['maxBoundsDeltaEm'] >= 0.01
            if visual_outlier and row.get('worstGlyph'):
                label = 'outlier-' + Path(rel).stem.replace(' ', '-').replace('/', '-')
                row['glyphComparisonArtifacts'] = write_glyph_comparison(
                    src, output, int(row['worstGlyph']['gid']), visual_dir, label
                )
                # Experimental alternative: decompose CFF components before creating glyf contours.
                try:
                    alt_font = TTFont(str(src), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
                    if 'fvar' in alt_font:
                        alt_axes = {a.axisTag: float(a.defaultValue) for a in alt_font['fvar'].axes}
                        instantiateVariableFont(alt_font, alt_axes, inplace=True, updateFontNames=False, static=True)
                    alt_source_bounds = glyph_bounds(alt_font)
                    alt_geometry = convert_cff_to_glyf_decomposed(alt_font, float(alt_font['head'].unitsPerEm) * MAX_ERR_EM)
                    alt_gid = int(row['worstGlyph']['gid'])
                    alt_pre_save_order = list(alt_font.getGlyphOrder())
                    alt_pre_save_bounds = raw_glyf_bounds(alt_font)
                    alt_pre_save_bounds_by_gid = [alt_pre_save_bounds.get(n) for n in alt_pre_save_order]
                    alt_f = tmp / (hashlib.sha256((rel + '|decomposed').encode()).hexdigest() + '.ttf')
                    alt_font.flavor = None
                    alt_font.save(str(alt_f))
                    alt_font.close()
                    alt_check = TTFont(str(alt_f), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
                    alt_order = alt_check.getGlyphOrder()
                    alt_metrics = [tuple(int(v) for v in alt_check['hmtx'].metrics[n]) for n in alt_order]
                    if alt_metrics != metrics0:
                        raise ValueError('decomposed strategy changed hmtx advance/sidebearing')
                    if len(alt_order) != len(order):
                        raise ValueError('decomposed strategy changed glyph count')
                    alt_cmap = {int(cp): int(alt_check.getGlyphID(n)) for cp, n in (alt_check.getBestCmap() or {}).items()}
                    if alt_cmap != cmap0:
                        raise ValueError('decomposed strategy changed cmap-to-GID mapping')
                    alt_bounds = raw_glyf_bounds(alt_check)
                    alt_roundtrip = 0.0
                    for alt_index, alt_glyph_name in enumerate(alt_order):
                        pre = alt_pre_save_bounds_by_gid[alt_index]
                        post = alt_bounds.get(alt_glyph_name)
                        if pre is None or post is None:
                            if pre != post:
                                raise ValueError(f'decomposed empty outline changed at GID {alt_index}')
                            continue
                        alt_roundtrip = max(alt_roundtrip, max(abs(float(x) - float(y)) for x, y in zip(pre, post)))
                    if alt_roundtrip > 0.01:
                        raise ValueError(f'decomposed save/load bounds changed {alt_roundtrip}')
                    alt_worst_bounds = alt_bounds.get(alt_order[alt_gid])
                    source_worst_bounds = alt_source_bounds.get(order[alt_gid])
                    alt_gid_delta = None
                    if source_worst_bounds is not None and alt_worst_bounds is not None:
                        alt_gid_delta = max(abs(float(x) - float(y)) for x, y in zip(source_worst_bounds, alt_worst_bounds))
                    alt_sample = sample
                    alt_runtime = java_subset_check(root, alt_f, alt_sample)
                    row['decomposedAlternative'] = {
                        'status': 'passed',
                        'maxBoundsDeltaFontUnits': alt_geometry['maxBoundsDeltaFontUnits'],
                        'worstGlyph': alt_geometry['worstGlyph'],
                        'primaryWorstGlyphBoundsDelta': alt_gid_delta,
                        'roundTripBoundsDelta': alt_roundtrip,
                        'runtimeSubset': alt_runtime,
                    }
                    row['decomposedGlyphComparisonArtifacts'] = write_glyph_comparison(
                        src, alt_f, alt_gid, visual_dir, label + '-decomposed'
                    )
                    alt_check.close()
                    alt_f.unlink(missing_ok=True)
                except Exception as alt_exc:
                    row['decomposedAlternative'] = {'status': 'failed', 'error': f'{type(alt_exc).__name__}: {alt_exc}'}
            runtime=java_subset_check(root,output,sample)
            row.update({'roundTripBoundsDelta':maxround,'runtimeSubset':runtime,'conversionBoundsOutlier':visual_outlier,'convertedBytes':output.stat().st_size,'convertedSha256':sha(output),'status':'passed'})
            out.close(); output.unlink(missing_ok=True)
        except Exception as e:
            row.update({'status':'failed','error':f'{type(e).__name__}: {e}'})
            failures.append(row)
        rows.append(row)
        print(f"{row.get('status')}: {rel} {row.get('maxBoundsDeltaFontUnits','')} {row.get('error','')}",flush=True)
    report={'schema':'cff-conversion-stress-v1','catalogUniqueFiles':len(unique),'cffFontCount':sum(1 for x in rows if x.get('outline') in ('CFF','CFF2')),'passed':sum(1 for x in rows if x.get('status')=='passed'),'failureCount':len(failures),'maximumBoundsDelta':maximum,'fonts':rows,'failures':failures}
    output=args.output if args.output.is_absolute() else root/args.output; output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ('cffFontCount','passed','failureCount','maximumBoundsDelta','report') if k in report},ensure_ascii=False,indent=2))
    return 1 if failures or report['passed']!=report['cffFontCount'] else 0
if __name__=='__main__': sys.exit(main())
