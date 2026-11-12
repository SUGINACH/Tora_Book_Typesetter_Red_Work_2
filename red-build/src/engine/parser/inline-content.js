// src/engine/parser/inline-content.js — canonical inline AST (TextRun / ImageRun), S14 P0
'use strict';

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg']);
const IMAGE_LIKE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tif', 'tiff']);

function asSet(value) {
  if (value instanceof Set) return new Set(Array.from(value, x => String(x)));
  if (Array.isArray(value)) return new Set(value.map(x => String(x)));
  return new Set();
}

function normalizeFontMarkers(input, warnings) {
  let entries = [];
  if (Array.isArray(input)) entries = input.map((value, index) => [String(value && (value.id || index)), value]);
  else if (input && typeof input === 'object') entries = Object.entries(input);

  const provisional = [];
  for (const [id, value] of entries) {
    if (!value || typeof value !== 'object') {
      warnings.push({ code: 'invalid-font-marker-definition', markerId: id, message: 'הגדרת סגנון גופן inline אינה אובייקט תקין.' });
      continue;
    }
    const open = String(value.open != null ? value.open : (value.openMarker != null ? value.openMarker : ''));
    const close = String(value.close != null ? value.close : (value.closeMarker != null ? value.closeMarker : ''));
    const family = String(value.family != null ? value.family : (value.fontFamily != null ? value.fontFamily : '')).trim();
    if (!open || !close || !family || open === close && !open.trim()) {
      warnings.push({ code: 'invalid-font-marker-definition', markerId: id, message: 'סמני הפתיחה/סגירה ומשפחת הגופן חייבים להיות מוגדרים.' });
      continue;
    }
    provisional.push({ id: String(id), open, close, family });
  }

  // A marker token may belong to only one configured style. Ambiguous definitions
  // are rejected as a unit; guessing would make the parser dependent on ordering.
  const owners = new Map();
  const conflicts = new Set();
  for (const pair of provisional) {
    for (const token of new Set([pair.open, pair.close])) {
      const prior = owners.get(token);
      if (prior && prior !== pair.id) {
        conflicts.add(prior);
        conflicts.add(pair.id);
      } else owners.set(token, pair.id);
    }
  }
  for (const id of conflicts) {
    warnings.push({ code: 'ambiguous-font-marker-definition', markerId: id, message: 'הגדרת הסגנון נדחתה: אותו סמן משויך ליותר מסגנון אחד.' });
  }
  return provisional.filter(pair => !conflicts.has(pair.id));
}

function parseImagePayload(raw) {
  const payload = String(raw || '').trim();
  if (!payload) return null;

  let resourcePath = payload;
  let align = null;
  let widthPct = null;
  const suffix = resourcePath.match(/\.([lcr])(\d{1,3})$/i);
  if (suffix) {
    align = ({ l: 'left', c: 'center', r: 'right' })[suffix[1].toLowerCase()];
    widthPct = Number(suffix[2]);
    resourcePath = resourcePath.slice(0, suffix.index);
  }

  const extMatch = resourcePath.match(/\.([a-z0-9]+)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  if (!IMAGE_LIKE_EXTENSIONS.has(ext)) return null;
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return { ok: false, code: 'unsupported-image-format', message: 'פורמט תמונה לא נתמך; מותר PNG, JPG או JPEG בלבד.' };
  }
  const segments = resourcePath.split('/');
  const invalidPath =
    !resourcePath ||
    resourcePath.startsWith('/') ||
    resourcePath.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(resourcePath) ||
    resourcePath.includes('\\') ||
    resourcePath.includes('?') ||
    resourcePath.includes('#') ||
    segments.some(part => !part || part === '.' || part === '..') ||
    (widthPct != null && (!Number.isInteger(widthPct) || widthPct < 1 || widthPct > 100));
  if (invalidPath) {
    return { ok: false, code: 'invalid-image-path-or-size', message: 'נתיב התמונה או אחוז הרוחב אינם תקינים; נדרש נתיב יחסי ורוחב 1–100%.' };
  }
  return { ok: true, resourcePath, align, widthPct };
}

function parseInlineRuns(value, options = {}) {
  const source = String(value == null ? '' : value);
  const warnings = [];
  const availableFamilies = asSet(options.availableFamilies);
  const knownFamilies = asSet(options.knownFamilies);
  for (const family of availableFamilies) knownFamilies.add(family);
  const fontMarkers = normalizeFontMarkers(options.fontMarkers, warnings);
  const hasAvailabilityContract = options.availableFamilies != null;

  const markerRemovals = [];
  const spans = [];
  const images = [];
  const stack = [];
  const configuredTokens = [];
  for (const pair of fontMarkers) {
    configuredTokens.push({ token: pair.open, pair, type: 'open' });
    if (pair.close !== pair.open) configuredTokens.push({ token: pair.close, pair, type: 'close' });
  }
  configuredTokens.sort((a, b) => b.token.length - a.token.length);

  const addWarning = (code, start, end, message, extra = {}) => {
    warnings.push({ code, start, end, message, ...extra });
  };

  const markerAt = (index) => {
    const candidates = [];
    for (const entry of configuredTokens) {
      if (!source.startsWith(entry.token, index)) continue;
      let type = entry.type;
      if (entry.pair.open === entry.pair.close) {
        type = stack.length && stack[stack.length - 1].id === entry.pair.id ? 'close' : 'open';
      }
      candidates.push({ ...entry, type });
    }
    if (source.startsWith('</>', index)) {
      candidates.push({ token: '</>', type: 'generic-close', tokenLength: 3 });
    }
    if (source[index] === '<' && source[index + 1] !== '/') {
      const match = source.slice(index).match(/^<([^<>]{1,96})>/);
      if (match) {
        const family = match[1].trim();
        const validName = !!family && !/[{};]/.test(family);
        const closesLater = source.indexOf('</>', index + match[0].length) >= 0;
        if (validName && (knownFamilies.has(family) || closesLater)) {
          candidates.push({ token: match[0], type: 'generic-open', family });
        }
      }
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.token.length - a.token.length);
    return candidates[0];
  };

  let index = 0;
  while (index < source.length) {
    if (options.allowImages !== false && source[index] === '#') {
      const close = source.indexOf('#', index + 1);
      if (close > index + 1) {
        const parsed = parseImagePayload(source.slice(index + 1, close));
        if (parsed && parsed.ok) {
          images.push({
            kind: 'image',
            resourcePath: parsed.resourcePath,
            align: parsed.align,
            widthPct: parsed.widthPct,
            sourceStart: index,
            sourceEnd: close + 1
          });
          index = close + 1;
          continue;
        }
        if (parsed && !parsed.ok) {
          addWarning(parsed.code, index, close + 1, parsed.message, { source: source.slice(index, close + 1) });
        }
      }
    }

    const marker = markerAt(index);
    if (!marker) { index++; continue; }

    const end = index + marker.token.length;
    markerRemovals.push({ start: index, end });
    if (marker.type === 'open' || marker.type === 'generic-open') {
      stack.push({
        id: marker.type === 'generic-open' ? 'generic' : marker.pair.id,
        kind: marker.type === 'generic-open' ? 'generic' : 'configured',
        family: marker.type === 'generic-open' ? marker.family : marker.pair.family,
        start: end,
        markerStart: index,
        markerEnd: end,
        depth: stack.length
      });
    } else {
      const top = stack[stack.length - 1];
      const matches = marker.type === 'generic-close'
        ? !!top && top.kind === 'generic'
        : !!top && top.kind === 'configured' && top.id === marker.pair.id;
      if (matches) {
        stack.pop();
        if (top.start < index) {
          spans.push({
            start: top.start,
            end: index,
            family: top.family,
            depth: top.depth,
            available: !hasAvailabilityContract || availableFamilies.has(top.family),
            markerId: top.id
          });
        }
        if (hasAvailabilityContract && !availableFamilies.has(top.family)) {
          addWarning('font-family-unavailable', top.markerStart, end, 'משפחת הגופן של הטווח אינה טעונה; הטקסט נשמר בגופן הרגיל.', { family: top.family, markerId: top.id });
        }
      } else {
        const buriedMatch = marker.type === 'generic-close'
          ? stack.some(item => item.kind === 'generic')
          : stack.some(item => item.kind === 'configured' && item.id === marker.pair.id);
        addWarning(
          buriedMatch ? 'crossing-font-range' : 'unmatched-font-close',
          index,
          end,
          buriedMatch ? 'טווחי גופן חוצים זה את זה; הסמן הבעייתי הוסר והטקסט נשאר ללא שינוי.' : 'סמן סגירת גופן ללא פתיחה תואמת הוסר; הטקסט נשמר ללא שינוי.'
        );
      }
    }
    index = end;
  }

  for (const open of stack) {
    addWarning('unclosed-font-range', open.markerStart, open.markerEnd, 'סמן פתיחת גופן ללא סגירה תואמת הוסר; הטקסט נשמר בגופן הרגיל.', { family: open.family, markerId: open.id });
  }

  // Build interval events so font lookup is linear in the number of runs, not
  // quadratic in the number of characters × nested ranges.
  const starts = new Map();
  const ends = new Map();
  const removals = new Map();
  const imageAt = new Map();
  const boundaries = new Set([0, source.length]);
  const addTo = (map, at, item) => {
    if (!map.has(at)) map.set(at, []);
    map.get(at).push(item);
  };
  for (const span of spans) {
    if (!span.available || span.end <= span.start) continue;
    addTo(starts, span.start, span);
    addTo(ends, span.end, span);
    boundaries.add(span.start); boundaries.add(span.end);
  }
  for (const marker of markerRemovals) {
    addTo(removals, marker.start, marker);
    boundaries.add(marker.start); boundaries.add(marker.end);
  }
  for (const image of images) {
    imageAt.set(image.sourceStart, image);
    boundaries.add(image.sourceStart); boundaries.add(image.sourceEnd);
  }

  const points = Array.from(boundaries).sort((a, b) => a - b);
  const active = [];
  const runs = [];
  const appendText = (text, family, start, end) => {
    if (!text) return;
    const prev = runs[runs.length - 1];
    if (prev && prev.kind === 'text' && prev.fontFamily === (family || null) && prev.sourceEnd <= start) {
      prev.text += text;
      prev.sourceEnd = end;
    } else {
      runs.push({ kind: 'text', text, fontFamily: family || null, sourceStart: start, sourceEnd: end });
    }
  };

  let p = 0;
  while (p < points.length - 1) {
    const at = points[p];
    const ending = (ends.get(at) || []).slice().sort((a, b) => b.depth - a.depth);
    for (const span of ending) {
      const pos = active.lastIndexOf(span);
      if (pos >= 0) active.splice(pos, 1);
    }
    const beginning = (starts.get(at) || []).slice().sort((a, b) => a.depth - b.depth);
    for (const span of beginning) active.push(span);

    const image = imageAt.get(at);
    if (image) {
      runs.push({ ...image });
    } else {
      const marker = removals.get(at);
      if (!marker) {
        let family = null;
        for (let k = active.length - 1; k >= 0; k--) {
          if (active[k].available) { family = active[k].family; break; }
        }
        const next = points[p + 1];
        appendText(source.slice(at, next), family, at, next);
      }
    }
    p++;
  }

  const text = runs.filter(run => run.kind === 'text').map(run => run.text).join('');
  return {
    version: 1,
    runs,
    text,
    warnings,
    hasImages: images.length > 0,
    hasFontRanges: spans.some(span => span.available)
  };
}

module.exports = { parseInlineRuns, parseImagePayload };
