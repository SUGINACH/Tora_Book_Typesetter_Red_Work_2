#!/usr/bin/env python3
"""Stress conversion of every CFF/CFF2 catalog font without touching source assets."""
from __future__ import annotations
import argparse, json, hashlib, sys
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from prove_font_conversion import convert_cff_to_glyf, glyph_bounds, java_subset_check, font_sample_text, MAX_ERR_EM
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
    args=p.parse_args(); root=args.repo_root.resolve(); assets=root/'red-build/ui/assets/imud'
    core=read_catalog(assets/'imud-fonts.json','core'); ext=read_catalog(assets/'fonts-extended.json','extended')
    unique={str(e['file']) for e in core+ext}
    rows=[]; failures=[]; maximum=None
    for rel in sorted(unique):
        src=assets/'fonts'/rel
        row={'file':rel}
        try:
            f=TTFont(str(src),lazy=False,recalcBBoxes=False,recalcTimestamp=False)
            if 'CFF ' not in f and 'CFF2' not in f:
                f.close(); continue
            row.update({'sourceSha256':sha(src),'sourceFlavor':f.flavor or 'sfnt','glyphCount':len(f.getGlyphOrder()),'upem':int(f['head'].unitsPerEm),'outline':'CFF2' if 'CFF2' in f else 'CFF'})
            if 'fvar' in f:
                axes={a.axisTag:float(a.defaultValue) for a in f['fvar'].axes}
                instantiateVariableFont(f,axes,inplace=True,updateFontNames=False,static=True)
                row['instancedAxes']=axes
            cmap0={int(cp):int(f.getGlyphID(n)) for cp,n in (f.getBestCmap() or {}).items()}
            order=list(f.getGlyphOrder()); adv0=[int(f['hmtx'].metrics[n][0]) for n in order]
            tol=float(f['head'].unitsPerEm)*MAX_ERR_EM
            geom=convert_cff_to_glyf(f,tol); row['maxBoundsDeltaFontUnits']=geom['maxBoundsDeltaFontUnits']; row['worstGlyph']=geom['worstGlyph']
            if maximum is None or row['maxBoundsDeltaFontUnits']>maximum['delta']:
                maximum={'file':rel,'delta':row['maxBoundsDeltaFontUnits'],'worstGlyph':row['worstGlyph']}
            converted_order=list(f.getGlyphOrder())
            converted_bounds=glyph_bounds(f)
            converted_bounds_by_gid=[converted_bounds.get(name) for name in converted_order]
            f.flavor=None; tmp=root/'artifacts/cff-conversion-stress/tmp'
            tmp.mkdir(parents=True,exist_ok=True); output=tmp/(hashlib.sha256(rel.encode()).hexdigest()+'.ttf'); f.save(str(output)); f.close()
            out=TTFont(str(output),lazy=False,recalcBBoxes=False,recalcTimestamp=False)
            cmap1={int(cp):int(out.getGlyphID(n)) for cp,n in (out.getBestCmap() or {}).items()}
            adv1=[int(out['hmtx'].metrics[n][0]) for n in out.getGlyphOrder()]
            if cmap1!=cmap0: raise ValueError('cmap-to-GID mapping changed')
            if adv1!=adv0: raise ValueError('hmtx advances changed')
            if len(out.getGlyphOrder())!=len(order): raise ValueError('glyph count changed')
            bounds1=glyph_bounds(out); maxround=0.0
            for gid,n in enumerate(out.getGlyphOrder()):
                a=converted_bounds_by_gid[gid]; b=bounds1[n]
                if a is None or b is None:
                    if a!=b: raise ValueError(f'empty outline changed at GID {gid}')
                    continue
                maxround=max(maxround,max(abs(float(x)-float(y)) for x,y in zip(a,b)))
            if maxround>0.01: raise ValueError(f'round-trip bbox changed {maxround}')
            if 'glyf' not in out or 'loca' not in out or 'CFF ' in out: raise ValueError('output not glyf/loca')
            cmap = out.getBestCmap() or {}
            hebrew_count = sum(1 for cp in range(0x05D0, 0x05EB) if cp in cmap)
            row['hebrewLettersMapped'] = hebrew_count
            if hebrew_count == 27:
                sample = font_sample_text(out, 'stress-full-hebrew')
            elif hebrew_count:
                sample = font_sample_text(out, 'partial-hebrew')
            else:
                latin = ''.join(ch for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' if ord(ch) in cmap)
                if len(latin) < 1:
                    latin = ''.join(chr(cp) for cp in sorted(cmap) if 0x20 <= cp <= 0x7E and not chr(cp).isspace())[:12]
                if not latin:
                    raise ValueError('no printable Unicode sample available for production subset check')
                sample = latin[:12]
            runtime=java_subset_check(root,output,sample)
            row.update({'roundTripBoundsDelta':maxround,'runtimeSubset':runtime,'convertedBytes':output.stat().st_size,'convertedSha256':sha(output),'status':'passed'})
            out.close(); output.unlink(missing_ok=True)
        except Exception as e:
            row.update({'status':'failed','error':f'{type(e).__name__}: {e}'})
            failures.append(row)
        rows.append(row)
        print(f"{row.get('status')}: {rel} {row.get('maxBoundsDeltaFontUnits','')} {row.get('error','')}",flush=True)
    report={'schema':'cff-conversion-stress-v1','catalogUniqueFiles':len(unique),'cffFontCount':sum(1 for x in rows if x.get('outline') in ('CFF','CFF2')),'passed':sum(1 for x in rows if x.get('status')=='passed'),'failureCount':len(failures),'maximumBoundsDelta':maximum,'fonts':rows,'failures':failures}
    output=args.output if args.output.is_absolute() else root/args.output; output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\\n',encoding='utf-8')
    print(json.dumps({k:report[k] for k in ('cffFontCount','passed','failureCount','maximumBoundsDelta','report') if k in report},ensure_ascii=False,indent=2))
    return 1 if failures or report['passed']!=report['cffFontCount'] else 0
if __name__=='__main__': sys.exit(main())
