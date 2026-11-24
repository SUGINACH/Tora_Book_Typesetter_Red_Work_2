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

def freetype_raster_comparison(
    source_path: Path,
    converted_path: Path,
    gid: int,
    codepoint: int,
    source_lsb: int,
    upem: int,
    output_dir: Path,
    label: str,
) -> dict:
    """Compare source CFF and converted glyf through FreeType/Pillow rasterization."""
    from PIL import Image, ImageChops, ImageDraw, ImageFont
    from fontTools.ttLib import TTFont

    converted = TTFont(str(converted_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    glyph_name = converted.getGlyphOrder()[gid]
    advance, converted_lsb = converted["hmtx"].metrics[glyph_name]
    legacy_path = converted_path.with_name(converted_path.stem + ".legacy-lsb.ttf")
    converted["hmtx"].metrics[glyph_name] = (int(advance), int(source_lsb))
    converted.save(str(legacy_path))
    converted.close()

    layout = getattr(ImageFont, "Layout", None)
    layout_arg = {"layout_engine": layout.BASIC} if layout is not None else {}
    size = max(512, int(upem))
    canvas = max(2048, int(size * 1.8))
    anchor = (int(canvas * 0.25), int(canvas * 0.72))
    character = chr(codepoint)

    def render(path: Path):
        font = ImageFont.truetype(str(path), size=size, **layout_arg)
        image = Image.new("L", (canvas, canvas), 0)
        ImageDraw.Draw(image).text(anchor, character, font=font, fill=255, anchor="ls")
        return image, image.getbbox()

    try:
        source_image, source_bbox = render(source_path)
        legacy_image, legacy_bbox = render(legacy_path)
        converted_image, converted_bbox = render(converted_path)
    finally:
        legacy_path.unlink(missing_ok=True)

    def binary(image):
        return image.point(lambda value: 255 if value else 0)

    def metrics(image_a, image_b):
        a = binary(image_a)
        b = binary(image_b)
        inter = ImageChops.darker(a, b)
        union = ImageChops.lighter(a, b)
        intersection_pixels = sum(inter.histogram()[1:])
        union_pixels = sum(union.histogram()[1:])
        diff = ImageChops.difference(image_a, image_b)
        diff_histogram = diff.histogram()
        differing_pixels = sum(diff_histogram[1:])
        differing_intensity_levels = sum(1 for count in diff_histogram[1:] if count)
        total_diff_intensity = sum(index * count for index, count in enumerate(diff_histogram))
        return {
            "intersectionOverUnion": intersection_pixels / union_pixels if union_pixels else 1.0,
            "unionPixels": union_pixels,
            "differingPixels": differing_pixels,
            "differingIntensityLevels": differing_intensity_levels,
            "absolutePixelDifference": total_diff_intensity,
        }

    image_path = output_dir / f"{label}-freetype.png"
    output_dir.mkdir(parents=True, exist_ok=True)
    panel_gap = 24
    panel_width = canvas
    panel_height = canvas + 48
    panel = Image.new("RGB", (panel_width * 4 + panel_gap * 5, panel_height), "white")
    captions = ("Source CFF", "Copied source LSB", "Remapped LSB", "Source vs remapped diff")
    images = (source_image, legacy_image, converted_image, ImageChops.difference(source_image, converted_image))
    draw = ImageDraw.Draw(panel)
    for index, (caption, image) in enumerate(zip(captions, images)):
        x = panel_gap + index * (panel_width + panel_gap)
        panel.paste(image.convert("RGB"), (x, 40))
        draw.text((x + 8, 10), caption, fill="black")
    panel.save(image_path)

    return {
        "status": "generated",
        "codepoint": f"U+{codepoint:04X}",
        "gid": gid,
        "renderSize": size,
        "sourceBoundsPx": list(source_bbox) if source_bbox else None,
        "legacyCopiedLsbBoundsPx": list(legacy_bbox) if legacy_bbox else None,
        "remappedLsbBoundsPx": list(converted_bbox) if converted_bbox else None,
        "sourceVsLegacyCopiedLsb": metrics(source_image, legacy_image),
        "sourceVsRemappedLsb": metrics(source_image, converted_image),
        "sourceLsb": int(source_lsb),
        "remappedLsb": int(converted_lsb),
        "image": str(image_path),
    }


def outline_raster_metrics(alpha_source, alpha_converted, *, binary_threshold=128, difference_threshold=16) -> dict:
    """Quantify differences between two same-sized glyph-outline alpha masks."""
    from PIL import ImageChops

    if alpha_source.mode != "L" or alpha_converted.mode != "L" or alpha_source.size != alpha_converted.size:
        raise ValueError("outline raster masks must be same-sized 8-bit grayscale images")

    source_binary = alpha_source.point(lambda value: 255 if value >= binary_threshold else 0)
    converted_binary = alpha_converted.point(lambda value: 255 if value >= binary_threshold else 0)
    intersection = ImageChops.darker(source_binary, converted_binary)
    union = ImageChops.lighter(source_binary, converted_binary)

    source_pixels = sum(source_binary.histogram()[1:])
    converted_pixels = sum(converted_binary.histogram()[1:])
    intersection_pixels = sum(intersection.histogram()[1:])
    union_pixels = sum(union.histogram()[1:])
    symmetric_difference_pixels = union_pixels - intersection_pixels

    alpha_difference = ImageChops.difference(alpha_source, alpha_converted)
    difference_histogram = alpha_difference.histogram()
    nonzero_difference_pixels = sum(difference_histogram[1:])
    threshold_difference_pixels = sum(difference_histogram[difference_threshold:])
    absolute_alpha_difference = sum(value * count for value, count in enumerate(difference_histogram))
    squared_alpha_difference = sum(value * value * count for value, count in enumerate(difference_histogram))
    pixel_count = alpha_source.width * alpha_source.height

    return {
        "rasterWidth": alpha_source.width,
        "rasterHeight": alpha_source.height,
        "pixelCount": pixel_count,
        "sourceInkPixels": source_pixels,
        "convertedInkPixels": converted_pixels,
        "intersectionPixels": intersection_pixels,
        "unionPixels": union_pixels,
        "binarySymmetricDifferencePixels": symmetric_difference_pixels,
        "binarySymmetricDifferenceRatio": (
            symmetric_difference_pixels / union_pixels if union_pixels else 0.0
        ),
        "intersectionOverUnion": (
            intersection_pixels / union_pixels if union_pixels else 1.0
        ),
        "nonzeroAlphaDifferencePixels": nonzero_difference_pixels,
        "alphaDifferencePixelsAtThreshold": threshold_difference_pixels,
        "alphaDifferenceThreshold": difference_threshold,
        "meanAbsoluteAlphaDifference": absolute_alpha_difference / (pixel_count * 255) if pixel_count else 0.0,
        "rootMeanSquareAlphaDifference": (
            (squared_alpha_difference / pixel_count) ** 0.5 / 255 if pixel_count else 0.0
        ),
        "binaryAlphaThreshold": binary_threshold,
    }


def verify_outline_raster_metric_contract() -> None:
    """Small deterministic self-check for the raster-difference metric."""
    from PIL import Image

    baseline = Image.new("L", (8, 8), 0)
    baseline.paste(255, (2, 2, 4, 4))
    same = outline_raster_metrics(baseline, baseline.copy())
    if same["intersectionOverUnion"] != 1.0 or same["binarySymmetricDifferencePixels"] != 0:
        raise AssertionError(f"identical masks must have zero difference: {same}")
    if same["nonzeroAlphaDifferencePixels"] != 0 or same["meanAbsoluteAlphaDifference"] != 0:
        raise AssertionError(f"identical masks must have zero alpha error: {same}")

    shifted = Image.new("L", (8, 8), 0)
    shifted.paste(255, (3, 2, 5, 4))
    shifted_metrics = outline_raster_metrics(baseline, shifted)
    if shifted_metrics["intersectionPixels"] != 2 or shifted_metrics["unionPixels"] != 6:
        raise AssertionError(f"shifted rectangle intersection/union mismatch: {shifted_metrics}")
    if abs(shifted_metrics["intersectionOverUnion"] - (1 / 3)) > 1e-12:
        raise AssertionError(f"shifted rectangle IoU mismatch: {shifted_metrics}")
    if shifted_metrics["binarySymmetricDifferencePixels"] != 4:
        raise AssertionError(f"shifted rectangle symmetric difference mismatch: {shifted_metrics}")


def path_geometry_raster_comparison(
    source_path: Path,
    converted_path: Path,
    gid: int,
    output_dir: Path,
    label: str,
    *,
    target_pixels_per_em: int = 3072,
    max_render_dimension: int = 8192,
) -> dict:
    """Compare CFF/CFF2 and glyf outlines as same-viewBox alpha masks, without FreeType or shaping."""
    from io import BytesIO
    import cairosvg
    from PIL import Image, ImageChops
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    source = TTFont(str(source_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    converted = TTFont(str(converted_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    try:
        source_order = source.getGlyphOrder()
        converted_order = converted.getGlyphOrder()
        if gid < 0 or gid >= len(source_order) or gid >= len(converted_order):
            raise ValueError(f"geometry raster GID {gid} is outside source/converted glyph order")
        if len(source_order) != len(converted_order):
            raise ValueError("source and converted glyph order cardinalities differ")
        if "CFF " not in source and "CFF2" not in source:
            raise ValueError("geometry raster source is not CFF/CFF2")
        if "glyf" not in converted:
            raise ValueError("geometry raster output does not contain TrueType glyf outlines")

        # Match the stress runner's explicit default-axis instancing before conversion.
        if "fvar" in source:
            axes = {axis.axisTag: float(axis.defaultValue) for axis in source["fvar"].axes}
            instantiateVariableFont(source, axes, inplace=True, updateFontNames=False, static=True)

        source_name = source_order[gid]
        converted_name = converted_order[gid]
        if source_name != converted_name:
            raise ValueError(
                f"glyph name changed at GID {gid}: source={source_name!r}, converted={converted_name!r}"
            )

        source_glyph_set = source.getGlyphSet(preferCFF=True)
        converted_glyph_set = converted.getGlyphSet(preferCFF=False)
        source_pen = SVGPathPen(source_glyph_set)
        converted_pen = SVGPathPen(converted_glyph_set)
        source_glyph_set[source_name].draw(source_pen)
        converted_glyph_set[converted_name].draw(converted_pen)
        source_path_data = source_pen.getCommands()
        converted_path_data = converted_pen.getCommands()

        source_bounds_pen = BoundsPen(source_glyph_set)
        converted_bounds_pen = BoundsPen(converted_glyph_set)
        source_glyph_set[source_name].draw(source_bounds_pen)
        converted_glyph_set[converted_name].draw(converted_bounds_pen)
        source_bounds = source_bounds_pen.bounds
        converted_bounds = converted_bounds_pen.bounds
        if source_bounds is None or converted_bounds is None:
            raise ValueError(f"cannot raster-compare empty outline at GID {gid}")
        upem = int(source["head"].unitsPerEm)
        if int(converted["head"].unitsPerEm) != upem:
            raise ValueError("source and converted unitsPerEm differ")

        min_x = min(float(source_bounds[0]), float(converted_bounds[0]))
        min_y = min(float(source_bounds[1]), float(converted_bounds[1]))
        max_x = max(float(source_bounds[2]), float(converted_bounds[2]))
        max_y = max(float(source_bounds[3]), float(converted_bounds[3]))
        padding = max(40.0, upem * 0.08)
        view_x = min_x - padding
        view_y = min_y - padding
        view_width = max_x - min_x + 2 * padding
        view_height = max_y - min_y + 2 * padding
        if view_width <= 0 or view_height <= 0:
            raise ValueError(f"invalid shared glyph viewBox dimensions: {view_width} x {view_height}")

        scale = float(target_pixels_per_em) / upem
        render_width = max(1, int(round(view_width * scale)))
        render_height = max(1, int(round(view_height * scale)))
        if max(render_width, render_height) > max_render_dimension:
            scale *= max_render_dimension / max(render_width, render_height)
            render_width = max(1, int(round(view_width * scale)))
            render_height = max(1, int(round(view_height * scale)))

        translate_x = -view_x
        translate_y = max_y + padding

        def render_path(path_data: str):
            svg = (
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'width="{view_width:.8f}" height="{view_height:.8f}" '
                f'viewBox="{view_x:.8f} {view_y:.8f} {view_width:.8f} {view_height:.8f}">'
                f'<g transform="translate({translate_x:.8f},{translate_y:.8f}) scale(1,-1)">'
                f'<path d="{path_data}" fill="#000" fill-rule="nonzero"/>'
                f'</g></svg>'
            )
            png_bytes = cairosvg.svg2png(
                bytestring=svg.encode("utf-8"),
                output_width=render_width,
                output_height=render_height,
            )
            with Image.open(BytesIO(png_bytes)) as rendered:
                return rendered.convert("RGBA").getchannel("A").copy()

        source_alpha = render_path(source_path_data)
        converted_alpha = render_path(converted_path_data)
        metrics = outline_raster_metrics(source_alpha, converted_alpha)
        output_dir.mkdir(parents=True, exist_ok=True)
        diff_path = output_dir / f"{label}-gid-{gid}-geometry-raster-diff.png"
        alpha_difference = ImageChops.difference(source_alpha, converted_alpha)
        alpha_difference.save(diff_path)

        return {
            "status": "generated",
            "method": "same-viewBox CFF/CFF2-versus-glyf outline alpha-mask comparison; no FreeType, hinting, shaping, cmap, advance-width, or text-positioning stage",
            "gid": gid,
            "glyphName": source_name,
            "sourceBounds": [float(value) for value in source_bounds],
            "convertedBounds": [float(value) for value in converted_bounds],
            "unitsPerEm": upem,
            "targetPixelsPerEm": target_pixels_per_em,
            "effectivePixelsPerEm": scale * upem,
            "commonViewBox": [view_x, view_y, view_width, view_height],
            "rasterizer": f"CairoSVG {getattr(cairosvg, '__version__', 'unknown')}",
            "metrics": metrics,
            "differenceImage": str(diff_path),
        }
    finally:
        source.close()
        converted.close()


def decoded_cff_source_copy(source_path: Path, output_dir: Path, label: str) -> Path:
    """Decode a WOFF2/SFNT CFF source into a local SFNT for FreeType raster checks."""
    source = TTFont(str(source_path), lazy=False, recalcBBoxes=False, recalcTimestamp=False)
    if "CFF " not in source:
        source.close()
        raise ValueError(f"expected CFF source font: {source_path}")
    source.flavor = None
    extension = ".otf" if source.sfntVersion == "OTTO" else ".ttf"
    output_dir.mkdir(parents=True, exist_ok=True)
    destination = output_dir / f"{label}-source{extension}"
    source.save(str(destination))
    source.close()
    return destination


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo-root',type=Path,default=Path(__file__).resolve().parents[1])
    p.add_argument('--output',type=Path,default=Path('artifacts/cff-conversion-stress/report.json'))
    p.add_argument('--visual-dir',type=Path,default=Path('artifacts/cff-conversion-stress/visuals'))
    args=p.parse_args(); verify_outline_raster_metric_contract(); root=args.repo_root.resolve(); assets=root/'red-build/ui/assets/imud'
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
            geom=convert_cff_to_glyf(f,tol)
            row['maxBoundsDeltaFontUnits']=geom['maxBoundsDeltaFontUnits']
            row['worstGlyph']=geom['worstGlyph']
            row['hmetricsRemapping']=geom['hmetricsRemapping']
            row['maxGlyphSetPlacementDeltaFontUnits']=geom['maxGlyphSetPlacementDeltaFontUnits']
            row['maxGlyphSetPlacementDeltaEm']=geom['maxGlyphSetPlacementDeltaEm']
            row['worstPlacementGlyph']=geom['worstPlacementGlyph']
            converted_metrics_by_gid=[tuple(int(v) for v in f['hmtx'].metrics[n]) for n in order]
            if [m[0] for m in converted_metrics_by_gid] != [m[0] for m in metrics0]:
                raise ValueError('advance widths changed during CFF-to-glyf conversion')
            max_source_curve_lsb_offset=0.0
            for gid,name in enumerate(order):
                src_box=source_bounds_by_gid[gid]
                glyph=f['glyf'][name]
                out_lsb=converted_metrics_by_gid[gid][1]
                if src_box is None:
                    if out_lsb != 0:
                        raise ValueError(f'empty glyph LSB must be zero at GID {gid}')
                    continue
                if not hasattr(glyph,'xMin'):
                    raise ValueError(f'non-empty output glyph has no glyf xMin at GID {gid}')
                if out_lsb != int(glyph.xMin):
                    raise ValueError(
                        f'output LSB does not match stored glyf control-box xMin at GID {gid}: '
                        f'LSB={out_lsb}, xMin={glyph.xMin}'
                    )
                source_curve_lsb_offset=float(src_box[0])-float(metrics0[gid][1])
                max_source_curve_lsb_offset=max(max_source_curve_lsb_offset,abs(source_curve_lsb_offset))
            hmetric_audit=geom['hmetricsRemapping']
            row['maxAbsSourceCurveXMinMinusLsbFontUnits']=max_source_curve_lsb_offset
            row['sourceCurveLsbDiagnosticRequired']=bool(hmetric_audit.get('sourceCurveLsbDiagnosticCount',0))
            row['sourceCurveLsbDiagnosticCount']=int(hmetric_audit.get('sourceCurveLsbDiagnosticCount',0))
            row['worstSourceCurveLsbDiagnostic']=hmetric_audit.get('worstSourceCurveLsbDiagnostic')
            row['sourceCurveLsbDiagnostics']=hmetric_audit.get('sourceCurveLsbDiagnostics',[])
            row['outputLsbMatchesStoredGlyfControlXMin']=True
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
            aligned_converted_bounds=glyph_bounds(f, prefer_cff=False)
            aligned_converted_bounds_by_gid=[aligned_converted_bounds.get(name) for name in converted_order]
            f.flavor=None; tmp=root/'artifacts/cff-conversion-stress/tmp'
            tmp.mkdir(parents=True,exist_ok=True); output=tmp/(hashlib.sha256(rel.encode()).hexdigest()+'.ttf'); f.save(str(output))
            if row.get('sourceCurveLsbDiagnosticRequired'):
                visual_dir = args.visual_dir if args.visual_dir.is_absolute() else root / args.visual_dir
                reviews = sorted(
                    row.get('sourceCurveLsbDiagnostics', []),
                    key=lambda item: abs(float(item['absoluteSourceCurveLsbOffset'])),
                    reverse=True,
                )
                review_choice = None
                for candidate in reviews:
                    candidate_gid = int(candidate['gid'])
                    cps = sorted(
                        cp for cp, mapped_gid in cmap0.items()
                        if mapped_gid == candidate_gid and cp not in (0x20, 0x09, 0x0A, 0x0D)
                    )
                    if cps:
                        preferred = next((cp for cp in cps if 0x0590 <= cp <= 0x05FF), cps[0])
                        review_choice = (candidate, preferred)
                        break
                if review_choice is not None:
                    candidate, codepoint = review_choice
                    label = 'lsb-review-' + Path(rel).stem.replace(' ', '-').replace('/', '-')
                    row['sourceCurveLsbRasterReview'] = {
                        'status': 'pending-visual-review',
                        'gid': int(candidate['gid']),
                        'glyphName': candidate['name'],
                        'codepoint': f'U+{codepoint:04X}',
                        'sourceLeftSideBearing': int(candidate['sourceLsb']),
                        'convertedLeftSideBearing': int(candidate['outputLsb']),
                        'sourceCurveXMinMinusSourceLsb': float(candidate['sourceCurveXMinMinusSourceLsb']),
                        'outputGlyfControlXMinMinusOutputLsb': float(candidate['outputGlyfControlXMinMinusOutputLsb']),
                        'absoluteMetricDelta': float(candidate['absoluteSourceCurveLsbOffset']),
                    }
                    source_render = None
                    try:
                        source_render = decoded_cff_source_copy(src, tmp, label)
                        raster = freetype_raster_comparison(
                            source_render,
                            output,
                            int(candidate['gid']),
                            int(codepoint),
                            int(candidate['sourceLsb']),
                            int(upem),
                            visual_dir,
                            label,
                        )
                        raster['status'] = 'generated'
                        row['sourceCurveLsbRasterReview'].update(raster)
                    except Exception as raster_exc:
                        row['sourceCurveLsbRasterReview'].update({
                            'status': 'diagnostic-failed',
                            'error': f'{type(raster_exc).__name__}: {raster_exc}',
                        })
                    finally:
                        if source_render is not None:
                            source_render.unlink(missing_ok=True)
                else:
                    row['sourceCurveLsbRasterReview'] = {
                        'status': 'no-unicode-glyph-for-review',
                        'reason': 'No non-whitespace Unicode codepoint maps to any flagged GID',
                    }
                    worst_review = row.get('worstSourceCurveLsbDiagnostic')
                    if worst_review:
                        row['sourceCurveLsbGlyphComparison'] = write_glyph_comparison(
                            src, output, int(worst_review['gid']), visual_dir,
                            'lsb-review-' + Path(rel).stem.replace(' ', '-'),
                        )
            if Path(rel).name == 'Ploni-Regular.ttf' and len(order) > 725:
                target_gid = 725
                target_name = order[target_gid]
                raw_target = converted_bounds_by_gid[target_gid]
                source_target = source_bounds_by_gid[target_gid]
                aligned_target = glyph_bounds(f, prefer_cff=False).get(target_name)
                stored_target = f['glyf'][target_name]
                source_lsb = int(metrics0[target_gid][1])
                target_lsb = int(f['hmtx'].metrics[target_name][1])
                source_curve_lsb_offset = float(source_target[0]) - source_lsb if source_target else None
                output_control_box_offset = float(stored_target.xMin) - target_lsb if hasattr(stored_target, 'xMin') else None
                row['ploniGID725Diagnostic'] = {
                    'gid': target_gid,
                    'glyphName': target_name,
                    'sourceCffBounds': [float(v) for v in source_target] if source_target else None,
                    'rawConvertedGlyfBounds': [float(v) for v in raw_target] if raw_target else None,
                    'glyphSetAlignedBounds': [float(v) for v in aligned_target] if aligned_target else None,
                    'advanceWidth': int(f['hmtx'].metrics[target_name][0]),
                    'sourceLeftSideBearing': source_lsb,
                    'outputLeftSideBearing': target_lsb,
                    'storedGlyfXMin': int(stored_target.xMin) if hasattr(stored_target, 'xMin') else None,
                    'sourceCurveXMinMinusSourceLsb': source_curve_lsb_offset,
                    'outputGlyfControlXMinMinusOutputLsb': output_control_box_offset,
                    'sourceCurveLsbOffsetDiagnostic': abs(source_curve_lsb_offset) if source_curve_lsb_offset is not None else None,
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
                visual_dir = args.visual_dir if args.visual_dir.is_absolute() else root / args.visual_dir
                row['ploniGID725VisualComparison'] = write_glyph_comparison(
                    src, output, target_gid,
                    visual_dir,
                    'ploni-gid725-raw',
                )
                target_codepoints = sorted(cp for cp, mapped_gid in cmap0.items() if mapped_gid == target_gid)
                preferred_codepoint = 0xFB4F if 0xFB4F in target_codepoints else (target_codepoints[0] if target_codepoints else None)
                if preferred_codepoint is not None:
                    try:
                        row['ploniGID725FreeTypeRaster'] = freetype_raster_comparison(
                            src, output, target_gid, preferred_codepoint, source_lsb,
                            int(upem), visual_dir, 'ploni-gid725',
                        )
                    except Exception as raster_exc:
                        row['ploniGID725FreeTypeRaster'] = {
                            'status': 'diagnostic-failed',
                            'error': f'{type(raster_exc).__name__}: {raster_exc}',
                        }
                else:
                    row['ploniGID725FreeTypeRaster'] = {
                        'status': 'skipped',
                        'reason': 'no Unicode codepoint maps to GID 725',
                    }
            f.close()
            out=TTFont(str(output),lazy=False,recalcBBoxes=False,recalcTimestamp=False)
            cmap1={int(cp):int(out.getGlyphID(n)) for cp,n in (out.getBestCmap() or {}).items()}
            metrics1=[tuple(int(v) for v in out['hmtx'].metrics[n]) for n in out.getGlyphOrder()]
            if cmap1!=cmap0: raise ValueError('cmap-to-GID mapping changed')
            if metrics1!=converted_metrics_by_gid: raise ValueError('hmtx metrics changed during SFNT save/load')
            if [m[0] for m in metrics1] != [m[0] for m in metrics0]:
                raise ValueError('advance widths changed')
            expected_hhea = geom['hmetricsRemapping']['hheaSummary']
            actual_hhea = {
                'advanceWidthMax': int(out['hhea'].advanceWidthMax),
                'minLeftSideBearing': int(out['hhea'].minLeftSideBearing),
                'minRightSideBearing': int(out['hhea'].minRightSideBearing),
                'xMaxExtent': int(out['hhea'].xMaxExtent),
            }
            if actual_hhea != expected_hhea:
                raise ValueError(f'hhea summary changed or stale: expected {expected_hhea}, got {actual_hhea}')
            expected_head = geom['hmetricsRemapping']['headGlobalBounds']
            actual_head = [int(out['head'].xMin), int(out['head'].yMin), int(out['head'].xMax), int(out['head'].yMax)]
            if actual_head != expected_head:
                raise ValueError(f'head global bounds changed or stale: expected {expected_head}, got {actual_head}')
            if len(out.getGlyphOrder())!=len(order): raise ValueError('glyph count changed')
            bounds1=raw_glyf_bounds(out); maxround=0.0
            aligned_bounds1=glyph_bounds(out, prefer_cff=False); max_aligned_roundtrip=0.0
            for gid,n in enumerate(out.getGlyphOrder()):
                a=converted_bounds_by_gid[gid]; b=bounds1[n]
                aa=aligned_converted_bounds_by_gid[gid]; bb=aligned_bounds1[n]
                if a is None or b is None or aa is None or bb is None:
                    if a!=b or aa!=bb: raise ValueError(f'empty outline changed at GID {gid}')
                    continue
                maxround=max(maxround,max(abs(float(x)-float(y)) for x,y in zip(a,b)))
                max_aligned_roundtrip=max(
                    max_aligned_roundtrip,
                    max(abs(float(x)-float(y)) for x,y in zip(aa,bb)),
                )
            if maxround>0.01: raise ValueError(f'raw round-trip bbox changed {maxround}')
            if max_aligned_roundtrip>0.01: raise ValueError(f'GlyphSet-aligned round-trip bbox changed {max_aligned_roundtrip}')
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
            raw_geometry_outlier = row['maxBoundsDeltaEm'] > MAX_ERR_EM
            placement_outlier = row['maxGlyphSetPlacementDeltaEm'] > MAX_ERR_EM
            visual_outlier = raw_geometry_outlier or placement_outlier
            row['rawGeometryOutlier'] = raw_geometry_outlier
            row['placementOutlier'] = placement_outlier
            if visual_outlier:
                label = 'outlier-' + Path(rel).stem.replace(' ', '-').replace('/', '-')
                geometry_review_glyph = row.get('worstGlyph') or row.get('worstPlacementGlyph')
                if geometry_review_glyph is not None:
                    try:
                        row['geometryRasterReview'] = path_geometry_raster_comparison(
                            src,
                            output,
                            int(geometry_review_glyph['gid']),
                            visual_dir,
                            label,
                        )
                    except Exception as raster_exc:
                        row['geometryRasterReview'] = {
                            'status': 'diagnostic-failed',
                            'gid': int(geometry_review_glyph['gid']),
                            'error': f'{type(raster_exc).__name__}: {raster_exc}',
                        }
                else:
                    row['geometryRasterReview'] = {
                        'status': 'diagnostic-failed',
                        'error': 'geometry outlier has no representative worst glyph',
                    }
                if row.get('worstGlyph'):
                    row['glyphComparisonArtifacts'] = write_glyph_comparison(
                        src, output, int(row['worstGlyph']['gid']), visual_dir, label + '-geometry'
                    )
                if row.get('worstPlacementGlyph'):
                    row['placementGlyphComparisonArtifacts'] = write_glyph_comparison(
                        src, output, int(row['worstPlacementGlyph']['gid']), visual_dir, label + '-placement'
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
                    if [m[0] for m in alt_metrics] != [m[0] for m in metrics0]:
                        raise ValueError('decomposed strategy changed advance widths')
                    for alt_index, alt_glyph_name in enumerate(alt_order):
                        source_box = alt_source_bounds.get(order[alt_index])
                        alt_glyph = alt_check['glyf'][alt_glyph_name]
                        if source_box is None:
                            if alt_metrics[alt_index][1] != 0:
                                raise ValueError(f'decomposed empty glyph LSB not zero at GID {alt_index}')
                        else:
                            if int(alt_metrics[alt_index][1]) != int(alt_glyph.xMin):
                                raise ValueError(
                                    f'decomposed LSB does not match stored glyf control-box xMin at GID {alt_index}'
                                )
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
            row.update({'roundTripBoundsDelta':maxround,'alignedRoundTripBoundsDelta':max_aligned_roundtrip,'hheaSummaryAfterReload':actual_hhea,'headGlobalBoundsAfterReload':actual_head,'runtimeSubset':runtime,'conversionBoundsOutlier':visual_outlier,'convertedBytes':output.stat().st_size,'convertedSha256':sha(output),'status':'passed'})
            out.close(); output.unlink(missing_ok=True)
        except Exception as e:
            row.update({'status':'failed','error':f'{type(e).__name__}: {e}'})
            failures.append(row)
        rows.append(row)
        print(f"{row.get('status')}: {rel} {row.get('maxBoundsDeltaFontUnits','')} {row.get('error','')}",flush=True)
    cff_rows=[x for x in rows if x.get('outline') in ('CFF','CFF2')]
    curve_lsb_diagnostic_rows=[x for x in cff_rows if x.get('sourceCurveLsbDiagnosticRequired')]
    curve_lsb_diagnostics=[
        {'file':row['file'],**diagnostic}
        for row in curve_lsb_diagnostic_rows
        for diagnostic in row.get('sourceCurveLsbDiagnostics',[])
    ]
    raster_review_rows=[
        x for x in curve_lsb_diagnostic_rows
        if (x.get('sourceCurveLsbRasterReview') or {}).get('status')=='generated'
    ]
    raster_diagnostic_failures=[
        {'file':x['file'],'diagnostic':x.get('sourceCurveLsbRasterReview')}
        for x in curve_lsb_diagnostic_rows
        if (x.get('sourceCurveLsbRasterReview') or {}).get('status')=='diagnostic-failed'
    ]
    severe_curve_lsb_diagnostics=[
        x for x in curve_lsb_diagnostics
        if abs(float(x['absoluteSourceCurveLsbOffset']))>=10.0
    ]
    raster_evidence_missing=[
        x['file'] for x in curve_lsb_diagnostic_rows
        if (x.get('sourceCurveLsbRasterReview') or {}).get('status') != 'generated'
        and not (x.get('sourceCurveLsbGlyphComparison') or {}).get('svg')
    ]
    geometry_outlier_rows=[x for x in cff_rows if x.get('conversionBoundsOutlier')]
    geometry_raster_review_rows=[
        x for x in geometry_outlier_rows
        if (x.get('geometryRasterReview') or {}).get('status')=='generated'
    ]
    geometry_raster_diagnostic_failures=[
        {'file':x['file'],'diagnostic':x.get('geometryRasterReview')}
        for x in geometry_outlier_rows
        if (x.get('geometryRasterReview') or {}).get('status')=='diagnostic-failed'
    ]
    geometry_raster_evidence_missing=[
        x['file'] for x in geometry_outlier_rows
        if (x.get('geometryRasterReview') or {}).get('status') != 'generated'
    ]
    report={
        'schema':'cff-conversion-stress-v4',
        'catalogUniqueFiles':len(unique),
        'cffFontCount':len(cff_rows),
        'passed':sum(1 for x in cff_rows if x.get('status')=='passed'),
        'failureCount':len(failures),
        'sourceCurveLsbDiagnosticFontCount':len(curve_lsb_diagnostic_rows),
        'sourceCurveLsbDiagnosticGlyphCount':len(curve_lsb_diagnostics),
        'sourceCurveLsbRasterComparisonCount':len(raster_review_rows),
        'sourceCurveLsbRasterDiagnosticFailureCount':len(raster_diagnostic_failures),
        'severeSourceCurveLsbDiagnosticCount':len(severe_curve_lsb_diagnostics),
        'sourceCurveLsbDiagnostics':curve_lsb_diagnostics,
        'severeSourceCurveLsbDiagnostics':severe_curve_lsb_diagnostics,
        'rasterDiagnosticFailures':raster_diagnostic_failures,
        'rasterEvidenceMissingFonts':raster_evidence_missing,
        'geometryOutlierFontCount':len(geometry_outlier_rows),
        'geometryRasterComparisonCount':len(geometry_raster_review_rows),
        'geometryRasterDiagnosticFailureCount':len(geometry_raster_diagnostic_failures),
        'geometryRasterDiagnosticFailures':geometry_raster_diagnostic_failures,
        'geometryRasterEvidenceMissingFonts':geometry_raster_evidence_missing,
        'maximumBoundsDelta':maximum,
        'manualReviewRequired':bool(curve_lsb_diagnostic_rows or geometry_outlier_rows),
        'manualReviewStatus':'required' if curve_lsb_diagnostic_rows or geometry_outlier_rows else 'none',
        'massConversionApproved':False,
        'fonts':rows,
        'failures':failures,
    }
    output=args.output if args.output.is_absolute() else root/args.output; output.parent.mkdir(parents=True,exist_ok=True); output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    summary_keys=('cffFontCount','passed','failureCount','sourceCurveLsbDiagnosticFontCount','sourceCurveLsbDiagnosticGlyphCount','sourceCurveLsbRasterComparisonCount','sourceCurveLsbRasterDiagnosticFailureCount','severeSourceCurveLsbDiagnosticCount','geometryOutlierFontCount','geometryRasterComparisonCount','geometryRasterDiagnosticFailureCount','maximumBoundsDelta','manualReviewRequired','massConversionApproved')
    summary={k:report[k] for k in summary_keys}
    summary['report']=str(output)
    print(json.dumps(summary,ensure_ascii=False,indent=2))
    # Automated structure, parser, subset, round-trip and raster-diagnostic
    # execution gates are distinct from the remaining manual visual-review set.
    return 1 if failures or report['passed']!=report['cffFontCount'] or raster_diagnostic_failures or raster_evidence_missing or geometry_raster_diagnostic_failures or geometry_raster_evidence_missing else 0
if __name__=='__main__': sys.exit(main())
