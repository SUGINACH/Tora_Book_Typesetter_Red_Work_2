// src/engine/import/document-assets.js — deterministic local document assets (S14.1)
'use strict';

const { readZip, utf8Decode } = require('./zip-reader');

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SOF = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf
]);

function asBytes(value) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}

/** Normalize a document-relative path without resolving it against the host filesystem. */
function normalizeDocumentPath(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.normalize('NFC').replace(/\\/g, '/');
  if (
    raw.startsWith('/') ||
    raw.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(raw) ||
    raw.includes('?') ||
    raw.includes('#') ||
    raw.includes('\0')
  ) return null;
  const segments = raw.split('/');
  if (segments.some(part => !part || part === '.' || part === '..')) return null;
  return segments.join('/');
}

function imageExtension(path) {
  const match = String(path).match(/\.([^.\/]+)$/);
  return match ? match[1].toLowerCase() : '';
}

function positiveDimensions(width, height) {
  return Number.isInteger(width) && width > 0
    && Number.isInteger(height) && height > 0
    && width <= 100000 && height <= 100000;
}

/** Read intrinsic dimensions from PNG IHDR or a JPEG SOF marker. */
function readImageDimensions(input, expectedFormat = null) {
  const bytes = asBytes(input);
  if (!bytes || bytes.length < 10) return { ok: false, code: 'image-data-invalid' };

  const isPng = bytes.length >= 24
    && PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
    && bytes[8] === 0 && bytes[9] === 0 && bytes[10] === 0 && bytes[11] === 13
    && bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52;
  if (isPng) {
    const width = ((bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]) >>> 0;
    const height = ((bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]) >>> 0;
    if (!positiveDimensions(width, height)) return { ok: false, code: 'image-dimensions-invalid' };
    if (expectedFormat && expectedFormat !== 'png') return { ok: false, code: 'image-format-mismatch' };
    return { ok: true, format: 'png', mimeType: 'image/png', width, height, aspectRatio: width / height };
  }

  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return { ok: false, code: 'image-format-unsupported' };
  if (expectedFormat && expectedFormat !== 'jpg' && expectedFormat !== 'jpeg') {
    return { ok: false, code: 'image-format-mismatch' };
  }

  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) { offset++; continue; }
    while (offset < bytes.length && bytes[offset] === 0xff) offset++;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (offset + 2 > bytes.length) break;
    const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
    if (segmentLength < 2 || offset + segmentLength > bytes.length) {
      return { ok: false, code: 'image-jpeg-segment-invalid' };
    }
    if (JPEG_SOF.has(marker)) {
      if (segmentLength < 8) return { ok: false, code: 'image-jpeg-sof-invalid' };
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (!positiveDimensions(width, height)) return { ok: false, code: 'image-dimensions-invalid' };
      return { ok: true, format: 'jpeg', mimeType: 'image/jpeg', width, height, aspectRatio: width / height };
    }
    if (marker === 0xda) break;
    offset += segmentLength;
  }
  return { ok: false, code: 'image-jpeg-dimensions-not-found' };
}

/**
 * Build a resolver from a ZIP entry sequence or a deterministic folder scan.
 * Exact paths win; basename lookup uses first-seen order.
 */
function createInlineAssetResolver(entries = []) {
  if (!Array.isArray(entries)) throw new TypeError('document-assets: entries must be an array');
  const byPath = new Map();
  const byBasename = new Map();
  const assets = [];
  const diagnostics = [];

  for (let index = 0; index < entries.length; index++) {
    const entry = entries[index] || {};
    const path = normalizeDocumentPath(entry.path || entry.name || '');
    if (!path) {
      diagnostics.push({ code: 'INLINE_ASSET_PATH_INVALID', index, path: entry.path || entry.name || null });
      continue;
    }
    const extension = imageExtension(path);
    if (!['png', 'jpg', 'jpeg'].includes(extension)) {
      diagnostics.push({ code: 'INLINE_ASSET_FORMAT_UNSUPPORTED', index, path });
      continue;
    }
    const bytes = asBytes(entry.data != null ? entry.data : entry.bytes);
    if (!bytes || !bytes.length) {
      diagnostics.push({ code: 'INLINE_ASSET_DATA_MISSING', index, path });
      continue;
    }
    const dimensions = readImageDimensions(bytes, extension);
    if (!dimensions.ok) {
      diagnostics.push({ code: 'INLINE_ASSET_INVALID', index, path, reason: dimensions.code });
      continue;
    }
    const asset = {
      id: 'inline-asset:' + index + ':' + path,
      path,
      basename: path.slice(path.lastIndexOf('/') + 1),
      order: index,
      bytes,
      ...dimensions
    };
    if (!byPath.has(path)) byPath.set(path, asset);
    else diagnostics.push({ code: 'INLINE_ASSET_DUPLICATE_PATH', index, path, keptOrder: byPath.get(path).order });
    if (!byBasename.has(asset.basename)) byBasename.set(asset.basename, asset);
    assets.push(asset);
  }

  function resolve(resourcePath) {
    const normalized = normalizeDocumentPath(resourcePath);
    if (!normalized) return { ok: false, code: 'INLINE_IMAGE_PATH_INVALID', resourcePath };
    const asset = normalized.includes('/')
      ? byPath.get(normalized)
      : (byPath.get(normalized) || byBasename.get(normalized));
    if (!asset) return { ok: false, code: 'INLINE_IMAGE_RESOURCE_MISSING', resourcePath: normalized };
    return { ok: true, asset };
  }

  return { resolve, assets: assets.slice(), diagnostics: diagnostics.slice(), count: assets.length };
}

/** Resolve one ImageRun and calculate its box from the local flow-lane width. */
function resolveInlineImageRun(run, resolver, options = {}) {
  if (!run || run.kind !== 'image') throw new TypeError('document-assets: ImageRun required');
  if (!resolver || typeof resolver.resolve !== 'function') {
    return { ok: false, code: 'INLINE_IMAGE_RESOLVER_MISSING', resourcePath: run.resourcePath };
  }
  const result = resolver.resolve(run.resourcePath);
  if (!result.ok) return result;

  const widthPct = run.widthPct == null ? (options.defaultWidthPct == null ? 50 : options.defaultWidthPct) : run.widthPct;
  const align = run.align || options.defaultAlign || 'center';
  const localWidthPx = options.localWidthPx;
  if (!Number.isFinite(localWidthPx) || localWidthPx <= 0) {
    throw new RangeError('document-assets: localWidthPx must be positive and finite');
  }
  if (!Number.isInteger(widthPct) || widthPct < 1 || widthPct > 100) {
    throw new RangeError('document-assets: widthPct must be an integer from 1 to 100');
  }
  if (!['left', 'center', 'right'].includes(align)) {
    throw new RangeError('document-assets: align must be left, center or right');
  }

  const asset = result.asset;
  let widthPx = localWidthPx * widthPct / 100;
  let heightPx = widthPx / asset.aspectRatio;
  let scaledToFit = false;
  const maxHeightPx = options.maxHeightPx;
  if (Number.isFinite(maxHeightPx) && maxHeightPx > 0 && heightPx > maxHeightPx) {
    const scale = maxHeightPx / heightPx;
    widthPx *= scale;
    heightPx *= scale;
    scaledToFit = true;
  }
  return {
    ok: true,
    image: {
      kind: 'image',
      id: asset.id,
      resourceId: asset.id,
      resourcePath: asset.path,
      bytes: asset.bytes,
      mimeType: asset.mimeType,
      intrinsicWidthPx: asset.width,
      intrinsicHeightPx: asset.height,
      aspectRatio: asset.aspectRatio,
      widthPct,
      align,
      widthPx,
      heightPx,
      scaledToFit,
      sourceStart: run.sourceStart,
      sourceEnd: run.sourceEnd,
      sourceText: run.sourceText || ''
    }
  };
}

/** Read a ZIP document package: exactly one root-level TXT plus supported images. */
function readDocumentZip(input) {
  const bytes = asBytes(input);
  if (!bytes) return { ok: false, error: 'zip-data-invalid', text: null, textPath: null, assets: [], denied: [] };
  const archive = readZip(bytes);
  if (!archive.ok) {
    return { ok: false, error: archive.error, text: null, textPath: null, assets: [], denied: archive.denied || [] };
  }
  const rootTexts = archive.entries.filter(entry =>
    !entry.name.includes('/') && /\.txt$/i.test(entry.name)
  );
  if (rootTexts.length !== 1) {
    return {
      ok: false,
      error: rootTexts.length ? 'zip-ambiguous-root-text' : 'zip-root-text-missing',
      text: null,
      textPath: null,
      assets: [],
      denied: archive.denied
    };
  }
  const textEntry = rootTexts[0];
  const assetEntries = archive.entries
    .filter(entry => entry !== textEntry && ['png', 'jpg', 'jpeg'].includes(imageExtension(entry.name)))
    .map(entry => ({ path: entry.name, data: entry.data }));
  const resolver = createInlineAssetResolver(assetEntries);
  return {
    ok: true,
    text: utf8Decode(textEntry.data),
    textPath: textEntry.name,
    assets: assetEntries,
    assetDiagnostics: resolver.diagnostics,
    denied: archive.denied
  };
}

module.exports = {
  normalizeDocumentPath,
  readImageDimensions,
  createInlineAssetResolver,
  resolveInlineImageRun,
  readDocumentZip
};
