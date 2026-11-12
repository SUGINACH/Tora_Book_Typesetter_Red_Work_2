// src/engine/layout/line-fragments.js — shared mixed-item line geometry (S14 P0)
'use strict';

const EPSILON = 1e-7;
const ITEM_KINDS = new Set(['text', 'image', 'anchor']);

function finiteNonNegative(value, name) {
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError('line-fragments: ' + name + ' must be a finite non-negative number');
  }
  return value;
}

function normalizeInlineItems(items) {
  if (!Array.isArray(items)) throw new TypeError('line-fragments: items must be an array');
  return items.map((item, index) => {
    if (!item || !ITEM_KINDS.has(item.kind)) {
      throw new TypeError('line-fragments: unsupported item kind at index ' + index);
    }
    const widthPx = finiteNonNegative(item.widthPx, 'item.widthPx');
    const heightPx = finiteNonNegative(item.heightPx == null ? 0 : item.heightPx, 'item.heightPx');
    if (item.kind === 'text' && typeof item.text !== 'string') {
      throw new TypeError('line-fragments: text item requires a string');
    }
    if (item.kind === 'image' && (typeof item.resourcePath !== 'string' || !item.resourcePath.trim())) {
      throw new TypeError('line-fragments: image item requires resourcePath');
    }
    if (item.kind === 'anchor' && item.id == null) {
      throw new TypeError('line-fragments: anchor item requires a stable id');
    }
    const sourceStart = item.sourceStart == null ? null : item.sourceStart;
    const sourceEnd = item.sourceEnd == null ? null : item.sourceEnd;
    if ((sourceStart == null) !== (sourceEnd == null)
      || (sourceStart != null && (!Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || sourceStart < 0 || sourceEnd < sourceStart))) {
      throw new TypeError('line-fragments: source range must be a valid [start,end) pair');
    }
    return { ...item, widthPx, heightPx, sourceStart, sourceEnd };
  });
}

/**
 * Return the horizontal free intervals for a line band after subtracting
 * rectangles occupied by floating inline items (normally images).
 * Coordinates use the same page-space system as the Page Model.
 */
function availableIntervalsAtY(contentRect, exclusions, y, heightPx) {
  if (!contentRect || !Number.isFinite(contentRect.x) || !Number.isFinite(contentRect.y)
    || !Number.isFinite(contentRect.width) || contentRect.width <= 0) {
    throw new TypeError('line-fragments: contentRect requires finite x/y and positive width');
  }
  finiteNonNegative(heightPx, 'line height');
  if (!Number.isFinite(y)) throw new TypeError('line-fragments: y must be finite');
  const left = contentRect.x;
  const right = left + contentRect.width;
  const bandTop = y;
  const bandBottom = y + heightPx;
  let intervals = [{ x: left, width: contentRect.width }];

  for (const rect of exclusions || []) {
    if (!rect || !Number.isFinite(rect.x) || !Number.isFinite(rect.y)
      || !Number.isFinite(rect.width) || !Number.isFinite(rect.height)
      || rect.width < 0 || rect.height < 0) {
      throw new TypeError('line-fragments: every exclusion must be a finite rectangle');
    }
    if (rect.width === 0 || rect.height === 0
      || rect.y >= bandBottom - EPSILON || rect.y + rect.height <= bandTop + EPSILON) continue;
    const cutLeft = Math.max(left, rect.x);
    const cutRight = Math.min(right, rect.x + rect.width);
    if (cutRight <= cutLeft + EPSILON) continue;
    const next = [];
    for (const interval of intervals) {
      const iLeft = interval.x;
      const iRight = iLeft + interval.width;
      if (cutRight <= iLeft + EPSILON || cutLeft >= iRight - EPSILON) {
        next.push(interval);
        continue;
      }
      if (cutLeft > iLeft + EPSILON) next.push({ x: iLeft, width: cutLeft - iLeft });
      if (cutRight < iRight - EPSILON) next.push({ x: cutRight, width: iRight - cutRight });
    }
    intervals = next;
  }
  return intervals.filter(interval => interval.width > EPSILON).sort((a, b) => a.x - b.x);
}

/**
 * Position an already-broken sequence of measured atomic items in one free
 * interval. The function never splits or drops an item. RTL is the default:
 * logical item order is preserved while the first item is placed at the right.
 */
function composeLineFragments(items, options = {}) {
  const normalized = normalizeInlineItems(items);
  const x = Number(options.x);
  const y = Number(options.y);
  const widthPx = Number(options.widthPx);
  const heightPx = finiteNonNegative(options.heightPx == null ? 0 : options.heightPx, 'line height');
  const direction = options.direction || 'rtl';
  const align = options.align || 'right';
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(widthPx) || widthPx <= 0) {
    throw new TypeError('line-fragments: x/y and positive widthPx are required');
  }
  if (direction !== 'rtl' && direction !== 'ltr') throw new TypeError('line-fragments: direction must be rtl or ltr');
  if (!['right', 'left', 'center', 'start', 'end'].includes(align)) {
    throw new TypeError('line-fragments: unsupported alignment');
  }

  const totalWidth = normalized.reduce((sum, item) => sum + item.widthPx, 0);
  if (totalWidth > widthPx + EPSILON) {
    return { ok: false, reason: 'line-overflow', requiredWidthPx: totalWidth, availableWidthPx: widthPx, fragments: [] };
  }
  const resolvedAlign = align === 'start' ? (direction === 'rtl' ? 'right' : 'left')
    : align === 'end' ? (direction === 'rtl' ? 'left' : 'right') : align;
  const spare = Math.max(0, widthPx - totalWidth);
  const offset = resolvedAlign === 'right' ? spare : resolvedAlign === 'center' ? spare / 2 : 0;
  let cursor = direction === 'rtl' ? x + widthPx - offset : x + offset;
  const fragments = normalized.map(item => {
    if (direction === 'rtl') cursor -= item.widthPx;
    const fragment = {
      ...item,
      x: cursor,
      y,
      widthPx: item.widthPx,
      heightPx: Math.max(heightPx, item.heightPx)
    };
    if (direction === 'ltr') cursor += item.widthPx;
    return fragment;
  });
  return {
    ok: true,
    x, y, widthPx, heightPx,
    direction, align: resolvedAlign,
    usedWidthPx: totalWidth,
    fragments
  };
}

module.exports = { normalizeInlineItems, availableIntervalsAtY, composeLineFragments };
