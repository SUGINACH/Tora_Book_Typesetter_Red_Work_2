// src/engine/layout/inline-item-factory.js — canonical AST → measured inline atoms (S14 P0)
'use strict';

const DEFAULT_GLUE_STRETCH = 0.6;
const DEFAULT_GLUE_SHRINK = 0.5;

function finiteNonNegative(value, label) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError('inline-item-factory: ' + label + ' must be finite and non-negative');
  }
  return value;
}

/**
 * Convert canonical parser runs to the measured item contract used by the
 * shared line solver. A word may contain multiple font-family segments; it
 * remains one unbreakable text atom while its segments retain independent
 * measurement and rendering metadata.
 *
 * options:
 *   measureText(text, fontFamily, sizePt) -> widthPx
 *   resolveImage(ImageRun, options) -> {ok:true,image} | {ok:false,code}
 *   defaultFontFamily, sizePt, lineHeightPx, glueStretchRatio, glueShrinkRatio
 */
function createMeasuredInlineItems(runs, options = {}) {
  if (!Array.isArray(runs)) throw new TypeError('inline-item-factory: runs must be an array');
  if (typeof options.measureText !== 'function') {
    throw new TypeError('inline-item-factory: measureText(text, fontFamily, sizePt) is required');
  }

  const sizePt = options.sizePt == null ? null : finiteNonNegative(options.sizePt, 'sizePt');
  const lineHeightPx = options.lineHeightPx == null ? 0 : finiteNonNegative(options.lineHeightPx, 'lineHeightPx');
  const stretchRatio = options.glueStretchRatio == null ? DEFAULT_GLUE_STRETCH : finiteNonNegative(options.glueStretchRatio, 'glueStretchRatio');
  const shrinkRatio = options.glueShrinkRatio == null ? DEFAULT_GLUE_SHRINK : finiteNonNegative(options.glueShrinkRatio, 'glueShrinkRatio');
  const defaultFontFamily = options.defaultFontFamily || null;
  const lineHeightForSize = typeof options.lineHeightForSize === 'function'
    ? options.lineHeightForSize
    : () => lineHeightPx;
  const items = [];
  const diagnostics = [];
  let wordSegments = [];

  function effectiveFamily(run) {
    return run && run.fontFamily ? String(run.fontFamily) : defaultFontFamily;
  }

  function effectiveSize(run) {
    return run && run.sizePt != null
      ? finiteNonNegative(run.sizePt, 'run sizePt')
      : sizePt;
  }

  function measure(text, family, runSizePt) {
    const clean = String(text).split(String.fromCharCode(0xE102)).join('');
    const width = options.measureText(clean, family || null, runSizePt == null ? sizePt : runSizePt);
    return finiteNonNegative(width, 'measured text width');
  }

  function flushWord() {
    if (!wordSegments.length) return;
    const text = wordSegments.map(segment => segment.text).join('');
    const widthPx = wordSegments.reduce((sum, segment) => sum + segment.widthPx, 0);
    const segments = wordSegments.map(segment => ({ ...segment }));
    const sourceStarts = segments.map(segment => segment.sourceStart).filter(Number.isFinite);
    const sourceEnds = segments.map(segment => segment.sourceEnd).filter(Number.isFinite);
    const heightPx = Math.max(lineHeightPx, ...segments.map(segment => segment.heightPx || 0));
    const sizeValues = [...new Set(segments.map(segment => segment.sizePt).filter(value => value != null))];
    const item = {
      kind: 'text',
      text,
      widthPx,
      heightPx,
      segments,
      ...(sizeValues.length === 1 ? { sizePt: sizeValues[0] } : {}),
      ...(segments.length === 1 ? { fontFamily: segments[0].fontFamily || null } : {}),
      ...(sourceStarts.length ? { sourceStart: Math.min(...sourceStarts) } : {}),
      ...(sourceEnds.length ? { sourceEnd: Math.max(...sourceEnds) } : {})
    };
    items.push(item);
    wordSegments = [];
  }

  function appendGlue(run, sourceStart, sourceEnd) {
    flushWord();
    // Normalize a whitespace run to one break-space, matching the paragraph
    // tokenizer/line-breaker contract. Never leave leading or duplicate glue.
    const prior = items[items.length - 1];
    if (!prior || prior.kind === 'glue') {
      if (prior && prior.kind === 'glue') {
        prior.sourceEnd = Number.isFinite(sourceEnd) ? sourceEnd : prior.sourceEnd;
      }
      return;
    }
    const family = effectiveFamily(run);
    const runSizePt = effectiveSize(run);
    const widthPx = measure(' ', family, runSizePt);
    items.push({
      kind: 'glue',
      widthPx,
      stretchPx: widthPx * stretchRatio,
      shrinkPx: widthPx * shrinkRatio,
      fontFamily: family,
      ...(runSizePt != null ? { sizePt: runSizePt } : {}),
      ...(Number.isFinite(sourceStart) ? { sourceStart } : {}),
      ...(Number.isFinite(sourceEnd) ? { sourceEnd } : {})
    });
  }

  for (const run of runs) {
    if (!run || typeof run !== 'object') {
      throw new TypeError('inline-item-factory: every run must be an object');
    }

    if (run.kind === 'text') {
      const value = String(run.text == null ? '' : run.text);
      const family = effectiveFamily(run);
      const runSizePt = effectiveSize(run);
      // Ordinary spaces create legal break glue. NBSP and the private atomic
      // note separator stay inside the same measured word box and are normalized
      // to visible NBSP in the renderer.
      let cursor = 0;
      while (cursor < value.length) {
        const first = value[cursor];
        const isAtomic = first === String.fromCharCode(0x00A0) || first === String.fromCharCode(0xE000);
        const isBreak = first === ' ' || first === '\t' || first === '\n' || first === '\r';
        let end = cursor + 1;
        if (isAtomic || isBreak) {
          while (end < value.length) {
            const ch = value[end];
            const same = isAtomic
              ? ch === String.fromCharCode(0x00A0) || ch === String.fromCharCode(0xE000)
              : ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
            if (!same) break;
            end++;
          }
        } else {
          while (end < value.length) {
            const ch = value[end];
            if (ch === String.fromCharCode(0x00A0) || ch === String.fromCharCode(0xE000)
              || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') break;
            end++;
          }
        }
        const token = value.slice(cursor, end);
        const sourceStart = Number.isFinite(run.sourceStart) ? run.sourceStart + cursor : undefined;
        const sourceEnd = Number.isFinite(run.sourceStart) ? sourceStart + token.length : undefined;
        if (isBreak) {
          appendGlue(run, sourceStart, sourceEnd);
        } else {
          const visibleToken = isAtomic
            ? token.split(String.fromCharCode(0xE000)).join(String.fromCharCode(0x00A0))
            : token;
          const measuredToken = isAtomic ? ' '.repeat(visibleToken.length) : visibleToken;
          const widthPx = measure(measuredToken, family, runSizePt);
          const heightPx = finiteNonNegative(lineHeightForSize(runSizePt), 'line height for run');
          // Adjacent parser runs can split one lexical word at removed font markers.
          // Only ordinary visible whitespace or an atomic non-text run ends the current word.
          wordSegments.push({
            text: visibleToken,
            fontFamily: family,
            widthPx,
            heightPx,
            ...(runSizePt != null ? { sizePt: runSizePt } : {}),
            ...(Number.isFinite(sourceStart) ? { sourceStart } : {}),
            ...(Number.isFinite(sourceEnd) ? { sourceEnd } : {})
          });
        }
        cursor = end;
      }
      continue;
    }

    if (run.kind === 'image') {
      flushWord();
      if (typeof options.resolveImage !== 'function') {
        diagnostics.push({
          code: 'INLINE_IMAGE_RESOLVER_MISSING',
          resourcePath: run.resourcePath || null,
          sourceStart: run.sourceStart,
          sourceEnd: run.sourceEnd
        });
        continue;
      }
      const resolved = options.resolveImage(run, options);
      if (!resolved || resolved.ok !== true || !resolved.image) {
        diagnostics.push({
          code: (resolved && resolved.code) || 'INLINE_IMAGE_RESOURCE_MISSING',
          resourcePath: run.resourcePath || null,
          sourceStart: run.sourceStart,
          sourceEnd: run.sourceEnd
        });
        continue;
      }
      const image = resolved.image;
      const widthPx = finiteNonNegative(image.widthPx, 'image width');
      const heightPx = finiteNonNegative(image.heightPx, 'image height');
      if (widthPx <= 0 || heightPx <= 0) {
        diagnostics.push({
          code: 'INLINE_IMAGE_DIMENSIONS_INVALID',
          resourcePath: run.resourcePath || image.resourcePath || null,
          sourceStart: run.sourceStart,
          sourceEnd: run.sourceEnd
        });
        continue;
      }
      items.push({
        ...image,
        kind: 'image',
        widthPx,
        heightPx,
        sourceStart: Number.isFinite(run.sourceStart) ? run.sourceStart : image.sourceStart,
        sourceEnd: Number.isFinite(run.sourceEnd) ? run.sourceEnd : image.sourceEnd
      });
      continue;
    }

    if (run.kind === 'anchor') {
      flushWord();
      items.push({
        ...run,
        kind: 'anchor',
        widthPx: run.widthPx == null ? 0 : finiteNonNegative(run.widthPx, 'anchor width'),
        heightPx: run.heightPx == null ? 0 : finiteNonNegative(run.heightPx, 'anchor height')
      });
      continue;
    }

    // Future page-item kinds use the same measured box contract. The solver
    // and projector do not need a new branch for each new item type.
    flushWord();
    if (typeof run.kind !== 'string' || !run.kind.trim() || run.id == null) {
      throw new TypeError('inline-item-factory: custom item kinds require kind and stable id');
    }
    items.push({
      ...run,
      widthPx: finiteNonNegative(run.widthPx, 'custom item width'),
      heightPx: finiteNonNegative(run.heightPx, 'custom item height')
    });
  }

  flushWord();
  while (items.length && items[items.length - 1].kind === 'glue') items.pop();

  return { items, diagnostics };
}

module.exports = { createMeasuredInlineItems };
