// S14.1 — deterministic local image resources and document ZIP package.
'use strict';

const assert = require('node:assert/strict');
const {
  normalizeDocumentPath,
  readImageDimensions,
  createInlineAssetResolver,
  resolveInlineImageRun,
  readDocumentZip
} = require('../../src/engine/import/document-assets');
const { crc32 } = require('../../src/engine/import/zip-reader');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

function png(width, height) {
  const bytes = new Uint8Array(33);
  bytes.set([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a], 0);
  bytes.set([0,0,0,13,0x49,0x48,0x44,0x52], 8);
  bytes[16]=(width>>>24)&255; bytes[17]=(width>>>16)&255; bytes[18]=(width>>>8)&255; bytes[19]=width&255;
  bytes[20]=(height>>>24)&255; bytes[21]=(height>>>16)&255; bytes[22]=(height>>>8)&255; bytes[23]=height&255;
  bytes.set([8,6,0,0,0],24);
  return bytes;
}

function jpeg(width, height) {
  return Uint8Array.from([
    0xff,0xd8, 0xff,0xc0, 0x00,0x11, 0x08,
    (height>>>8)&255,height&255, (width>>>8)&255,width&255,
    0x03, 0x01,0x11,0x00, 0x02,0x11,0x00, 0x03,0x11,0x00,
    0xff,0xd9
  ]);
}

function concat(parts) {
  const total = parts.reduce((n, part) => n + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function u16(v) { return Uint8Array.from([v & 255, (v >>> 8) & 255]); }
function u32(v) { return Uint8Array.from([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]); }
function utf8(s) { return new TextEncoder().encode(s); }

function zipStore(entries) {
  const local = [], central = [];
  let offset = 0;
  for (const item of entries) {
    const name = utf8(item.name);
    const data = item.data instanceof Uint8Array ? item.data : utf8(item.data);
    const crc = crc32(data);
    const localHeader = concat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data
    ]);
    local.push(localHeader);
    const centralHeader = concat([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(name.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name
    ]);
    central.push(centralHeader);
    offset += localHeader.length;
  }
  const localBytes = concat(local);
  const centralBytes = concat(central);
  const end = concat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralBytes.length), u32(localBytes.length), u16(0)
  ]);
  return concat([localBytes, centralBytes, end]);
}

test('document paths normalize separators but reject absolute, traversing and URL paths', () => {
  assert.equal(normalizeDocumentPath('images\\chapter\\pic.png'), 'images/chapter/pic.png');
  assert.equal(normalizeDocumentPath('images/chapter/pic.png'), 'images/chapter/pic.png');
  for (const path of ['/root.png', '../secret.png', 'images/../secret.png', './image.png', 'C:\\secret.png', 'https://host/image.png', 'images//image.png', 'image.png?x=1']) {
    assert.equal(normalizeDocumentPath(path), null, path + ' must be rejected');
  }
});

test('PNG and JPEG intrinsic dimensions are read without DOM or network access', () => {
  assert.deepEqual(readImageDimensions(png(640, 480), 'png'), {
    ok: true, format: 'png', mimeType: 'image/png', width: 640, height: 480, aspectRatio: 640/480
  });
  assert.deepEqual(readImageDimensions(jpeg(800, 600), 'jpg'), {
    ok: true, format: 'jpeg', mimeType: 'image/jpeg', width: 800, height: 600, aspectRatio: 800/600
  });
  assert.equal(readImageDimensions(png(3, 4), 'jpeg').code, 'image-format-mismatch');
  assert.equal(readImageDimensions(new Uint8Array([1,2,3])).ok, false);
});

test('resolver prioritizes exact relative paths and first-seen basename matches', () => {
  const resolver = createInlineAssetResolver([
    { path: 'chapter-a/plate.png', data: png(300, 150) },
    { path: 'chapter-b/plate.png', data: png(600, 300) },
    { path: 'chapter-b/portrait.jpg', data: jpeg(300, 600) }
  ]);
  assert.equal(resolver.count, 3);
  assert.equal(resolver.resolve('chapter-b/plate.png').asset.order, 1);
  assert.equal(resolver.resolve('plate.png').asset.order, 0);
  assert.equal(resolver.resolve('portrait.jpg').asset.order, 2);
  assert.equal(resolver.resolve('missing.jpg').code, 'INLINE_IMAGE_RESOURCE_MISSING');
});

test('image width uses the local flow lane and suffix overrides defaults', () => {
  const resolver = createInlineAssetResolver([{ path: 'wide.png', data: png(400, 200) }]);
  const result = resolveInlineImageRun({
    kind: 'image', resourcePath: 'wide.png', align: 'right', widthPct: 60, sourceStart: 4, sourceEnd: 15
  }, resolver, { localWidthPx: 300, defaultWidthPct: 50, defaultAlign: 'center' });
  assert.equal(result.ok, true);
  assert.equal(result.image.widthPx, 180);
  assert.equal(result.image.heightPx, 90);
  assert.equal(result.image.align, 'right');
  assert.equal(result.image.aspectRatio, 2);
  assert.equal(result.image.sourceStart, 4);
});

test('default image geometry is 50 percent centered and tall images preserve ratio when fitted', () => {
  const resolver = createInlineAssetResolver([{ path: 'portrait.jpg', data: jpeg(300, 900) }]);
  const result = resolveInlineImageRun({ kind: 'image', resourcePath: 'portrait.jpg' }, resolver, {
    localWidthPx: 400, maxHeightPx: 100
  });
  assert.equal(result.ok, true);
  assert.equal(result.image.align, 'center');
  assert.equal(result.image.widthPx, 50);
  assert.equal(result.image.heightPx, 100);
  assert.equal(result.image.scaledToFit, true);
});

test('malformed assets are excluded with diagnostics while valid assets remain resolvable', () => {
  const resolver = createInlineAssetResolver([
    { path: '../escape.png', data: png(10, 10) },
    { path: 'bad.png', data: new Uint8Array([0,1,2]) },
    { path: 'good.jpg', data: jpeg(10, 20) }
  ]);
  assert.equal(resolver.count, 1);
  assert.equal(resolver.resolve('good.jpg').ok, true);
  assert.equal(resolver.diagnostics.length, 2);
});

test('ZIP document import extracts one root TXT and keeps image record order', () => {
  const archive = zipStore([
    { name: 'book.txt', data: 'תוכן #images/pic.png#' },
    { name: 'images/pic.png', data: png(64, 32) },
    { name: 'images/second.jpg', data: jpeg(120, 80) }
  ]);
  const result = readDocumentZip(archive);
  assert.equal(result.ok, true);
  assert.equal(result.text, 'תוכן #images/pic.png#');
  assert.equal(result.textPath, 'book.txt');
  assert.deepEqual(result.assets.map(x => x.path), ['images/pic.png', 'images/second.jpg']);
  const resolver = createInlineAssetResolver(result.assets);
  assert.equal(resolver.resolve('images/pic.png').asset.width, 64);
});

test('ZIP import rejects missing or ambiguous root text without starting layout', () => {
  const noText = readDocumentZip(zipStore([{ name: 'images/pic.png', data: png(1, 1) }]));
  assert.equal(noText.ok, false);
  assert.equal(noText.error, 'zip-root-text-missing');
  const multiple = readDocumentZip(zipStore([
    { name: 'a.txt', data: 'a' }, { name: 'b.txt', data: 'b' }
  ]));
  assert.equal(multiple.ok, false);
  assert.equal(multiple.error, 'zip-ambiguous-root-text');
});

console.log('inline-assets: ' + passed + ' tests passed');
