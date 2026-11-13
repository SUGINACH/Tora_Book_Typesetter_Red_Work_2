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
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { createEngineWorkerMain } = require('../../src/ui/engine-worker-main');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

function png(width, height) {
  const signature = Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  const u32be = (v) => Uint8Array.from([(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]);
  const chunk = (type, data) => {
    const typeBytes = new TextEncoder().encode(type);
    const crcInput = concat([typeBytes,data]);
    return concat([u32be(data.length),crcInput,u32be(crc32(crcInput))]);
  };
  const header = concat([u32be(width),u32be(height),Uint8Array.from([8,6,0,0,0])]);
  // Structural fixture: a non-empty IDAT chunk with a valid chunk CRC.
  // Pixel decoding is tested separately by the browser renderer integration.
  return concat([signature,chunk('IHDR',header),chunk('IDAT',Uint8Array.from([0x78,0x01,0x00,0x00,0x00,0x01])),chunk('IEND',new Uint8Array(0))]);
}

function jpeg(width, height) {
  return Uint8Array.from([
    0xff,0xd8,
    0xff,0xc0, 0x00,0x11, 0x08,
    (height>>>8)&255,height&255, (width>>>8)&255,width&255,
    0x03, 0x01,0x11,0x00, 0x02,0x11,0x00, 0x03,0x11,0x00,
    0xff,0xda, 0x00,0x0c, 0x03, 0x01,0x00, 0x02,0x11, 0x03,0x11, 0x00,0x3f,0x00,
    0x00,
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
  const corruptPng = png(10, 10).slice();
  corruptPng[corruptPng.length - 1] ^= 1;
  assert.equal(readImageDimensions(corruptPng, 'png').code, 'image-png-crc-mismatch');
  assert.equal(readImageDimensions(png(10, 10).slice(0, 25), 'png').ok, false);
  assert.equal(readImageDimensions(jpeg(10, 20).slice(0, -2), 'jpg').code, 'image-jpeg-structure-incomplete');

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
  assert(Math.abs(result.image.widthPx - (100 / 3)) < 1e-9, 'width remains proportional within floating-point tolerance');
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


test('the engine resolves real image dimensions through its measurement environment without dropping source text', () => {
  const text = 'תחילת פסקה #images/plate.png# סוף פסקה';
  const settings = getDefaultSettings();
  const resolver = createInlineAssetResolver([{ path: 'images/plate.png', data: png(320, 160) }]);
  const result = typeset(text, settings, { inlineAssetResolver: resolver });
  const events = result.events.toTraceV2().events;
  const measured = events.find(event => event.label === 'inline-image-resources-measured-awaiting-placement');
  assert.ok(measured, 'resolved image measurement is present in the engine trace');
  assert.equal(measured.stage, 'measure');
  assert.equal(measured.payload.images[0].resolved, true);
  assert.equal(measured.payload.images[0].intrinsicWidthPx, 320);
  assert.ok(measured.payload.images[0].widthPx > 0);
  assert.equal(measured.payload.images[0].layoutPending, true, 'page coordinates are finalized by the projector after measurement');
  assert.ok(result.contentPreserved, 'the resolved image command is accounted for as an image, not printable marker text');
  const consumed = events.find(event => event.label === 'inline-image-markers-consumed-by-inline-items');
  assert.ok(consumed, 'the source command is consumed only after an image box enters the shared solver');
  const image = result.pages.flatMap(page => page.columns.flat())
    .flatMap(line => line.fragments || [])
    .find(fragment => fragment.kind === 'image');
  assert.ok(image, 'the image atom survives DP page planning');
  assert.equal(image.resourceId, measured.payload.images[0].resourceId);
  assert.equal(image.widthPx, measured.payload.images[0].widthPx);
  const printableWords = result.pages.flatMap(page => page.columns.flat()).flatMap(line => line.words || []);
  assert(!printableWords.includes('#images/plate.png#'), 'a resolved image marker is not emitted as visible body text');
});

test('missing image resources remain explicit and never receive guessed dimensions', () => {
  const text = 'תחילת פסקה #images/missing.png# סוף פסקה';
  const result = typeset(text, getDefaultSettings(), { inlineAssetResolver: createInlineAssetResolver([]) });
  const event = result.events.toTraceV2().events.find(item => item.label === 'inline-image-markers-retained-unresolved');
  assert.ok(event, 'missing resource is recorded');
  assert.equal(event.payload.images[0].code, 'INLINE_IMAGE_RESOURCE_MISSING');
  assert.equal(event.payload.images[0].widthPx, undefined);
  assert.equal(event.payload.images[0].layoutPending, true);
});

test('Worker registration is isolated from decoration assets and reaches the measurement pipeline', () => {
  const posted = [];
  const worker = createEngineWorkerMain(message => posted.push(message));
  const items = [{ path: 'images/worker.png', data: png(96, 48) }];
  worker({ type: 'register-inline-assets', jobId: 'assets-1', collection: 'doc-1', items });
  const registered = posted.find(message => message.type === 'register-inline-assets-result');
  assert.ok(registered && registered.ok, 'asset collection acknowledged');
  assert.equal(registered.registered, 1);
  worker({
    type: 'typeset-request', jobId: 'typeset-1',
    text: 'טקסט #images/worker.png# המשך',
    settings: getDefaultSettings(), assetCollection: 'doc-1'
  });
  const completed = posted.find(message => message.type === 'typeset-result');
  assert.ok(completed, 'typeset request completes');
  const measured = completed.result.trace.events.find(event => event.label === 'inline-image-resources-measured-awaiting-placement');
  assert.ok(measured, 'Worker passed the registered resolver into typeset');
  assert.equal(measured.payload.images[0].intrinsicHeightPx, 48);
});

console.log('inline-assets: ' + passed + ' tests passed');
