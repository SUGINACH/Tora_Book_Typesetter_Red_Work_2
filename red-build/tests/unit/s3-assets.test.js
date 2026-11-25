// tests/unit/s3-assets.test.js — שלב 3: Asset Resolver קנוני (§3.1-1/2/3/11)
'use strict';
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { AssetResolver, normalizeRefPath, SUPPORTED_EXTENSIONS } = require('../../src/engine/assets/asset-resolver');
const { measureImageMeta } = require('../../src/engine/assets/image-meta');
const { sha256Hex } = require('../../src/engine/assets/hash256');
const { validateRequest } = require('../../src/ui/worker-protocol');
const { createEngineWorkerMain } = require('../../src/ui/engine-worker-main');

// ── פיקסטורות בינאריות בבנייה-עצמית (ללא קבצים חיצוניים — דטרמיניסטיות) ──
function tinyPng(w, h) {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.from([0, 0, 0, 13]), Buffer.from('IHDR'),
    Buffer.from([(w >>> 24) & 255, (w >>> 16) & 255, (w >>> 8) & 255, w & 255,
      (h >>> 24) & 255, (h >>> 16) & 255, (h >>> 8) & 255, h & 255, 8, 6, 0, 0, 0]),
    Buffer.from([0, 0, 0, 0]), Buffer.from('IDAT'), Buffer.from([0, 0, 0, 0]),
    Buffer.from('IEND'), Buffer.from([0, 0, 0, 0])
  ]);
}
function tinyJpeg(w, h, exifOrientation) {
  // SOI + (optional App1/Exif minimal with orientation) + SOF0 + SOS + EOI
  const parts = [Buffer.from([0xff, 0xd8, 0xff])];
  if (exifOrientation) {
    const tiff = Buffer.alloc(30);
    Buffer.from('II', 'latin1').copy(tiff, 0);
    tiff.writeUInt16LE(42, 2);
    tiff.writeUInt32LE(8, 4);       // IFD0 offset
    tiff.writeUInt16LE(1, 8);       // 1 entry
    tiff.writeUInt16LE(0x0112, 10); // orientation tag
    tiff.writeUInt16LE(3, 12);      // SHORT
    tiff.writeUInt32LE(1, 14);      // count
    tiff.writeUInt16LE(exifOrientation, 18);
    tiff.writeUInt32LE(0, 22);      // next IFD
    const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
    parts.push(Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 255]), payload);
  }
  const sof = Buffer.alloc(17);
  sof[0] = 0xc0; // SOF0 after 0xff marker byte
  const sofData = Buffer.alloc(15);
  sofData[0] = 8; sofData.writeUInt16BE(h, 1); sofData.writeUInt16BE(w, 3); sofData[5] = 1; sofData[7] = 0x11; sofData[8] = 0;
  parts.push(Buffer.from([0xff, 0xc0, (sofData.length + 2) >> 8, (sofData.length + 2) & 255]), sofData);
  parts.push(Buffer.from([0xff, 0xda, 0, 2]), Buffer.from([0xff, 0xd9]));
  void sof;
  return Buffer.concat(parts);
}
function tinyGif(w, h) {
  return Buffer.concat([Buffer.from('GIF89a', 'latin1'), Buffer.from([w & 255, w >> 8, h & 255, h >> 8, 0x80, 0, 0])]);
}
function tinyBmp(w, h) {
  const b = Buffer.alloc(54);
  Buffer.from('BM', 'latin1').copy(b, 0);
  b.writeUInt32LE(54, 14 ? 2 : 2); // size placeholder
  b.writeUInt32LE(40, 14);
  b.writeInt32LE(w, 18);
  b.writeInt32LE(h, 22);
  return b;
}
function tinyWebpLossless(w, h) {
  const hdr = Buffer.alloc(30);
  Buffer.from('RIFF', 'latin1').copy(hdr, 0);
  hdr.writeUInt32LE(22, 4);
  Buffer.from('WEBP', 'latin1').copy(hdr, 8);
  Buffer.from('VP8L', 'latin1').copy(hdr, 12);
  hdr.writeUInt32LE(14, 16);
  hdr[20] = 0x2f;
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14);
  hdr.writeUInt32LE(bits >>> 0, 21);
  return hdr;
}

describe('שלב 3 — מדידת תמונות מבתים אמיתיים (image-meta)', () => {
  it('PNG: מידות מ-IHDR', () => {
    const m = measureImageMeta(tinyPng(8, 12));
    assert(m.ok && m.format === 'png' && m.width === 8 && m.height === 12, JSON.stringify(m));
    assert(Math.abs(m.aspectRatio - 8 / 12) < 1e-12, 'aspect');
  });
  it('JPEG: מידות מ-SOF בלי EXIF (orientation=1)', () => {
    const m = measureImageMeta(tinyJpeg(20, 10));
    assert(m.ok && m.format === 'jpeg' && m.width === 20 && m.height === 10, JSON.stringify(m));
    assertEq(m.orientation, 1);
  });
  it('JPEG+EXIF orientation 6: הצירים מתחלפים (displayWidth/Height)', () => {
    const m = measureImageMeta(tinyJpeg(20, 10, 6));
    assert(m.ok, JSON.stringify(m));
    assertEq(m.orientation, 6);
    assert(m.swapOrientation === true, 'swap');
    assertEq(m.displayWidth, 10);
    assertEq(m.displayHeight, 20);
  });
  it('GIF/BMP/WebP: מידות מהכותרות', () => {
    assert(measureImageMeta(tinyGif(4, 2)).ok, 'gif');
    assert(measureImageMeta(tinyBmp(6, 3)).ok, 'bmp');
    const w = measureImageMeta(tinyWebpLossless(9, 7));
    assert(w.ok && w.width === 9 && w.height === 7, JSON.stringify(w));
  });
  it('קלט פגום: אבחון מפורש, לא השמטה שקטה', () => {
    assert(!measureImageMeta(new Uint8Array(0)).ok, 'empty');
    assert(!measureImageMeta(Buffer.from('hello not an image')).ok, 'garbage');
    const truncated = tinyPng(8, 12).subarray(0, 20);
    assert(!measureImageMeta(truncated).ok, 'truncated png');
  });
  it('SVG עם מידות קבועות', () => {
    const m = measureImageMeta(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"></svg>'));
    assert(m.ok && m.width === 120 && m.height === 60, JSON.stringify(m));
  });
});

describe('שלב 3 — SHA-256 סביבת-אגנוסטי', () => {
  it('parity מלא מול Node crypto (בלוקי גבול 55/56/63/64/65)', () => {
    const crypto = require('crypto');
    const lens = [0, 1, 3, 55, 56, 63, 64, 65, 100, 1000];
    for (const n of lens) {
      const buf = Buffer.alloc(n, 0x78);
      assertEq(sha256Hex(buf), crypto.createHash('sha256').update(buf).digest('hex'), `len ${n}`);
    }
  });
  it('browser Worker ignores the bundler crypto shim and hashes raw Uint8Array bytes', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../src/engine/assets/hash256.js'), 'utf8');
    let shimCalls = 0;
    const cryptoShim = {
      createHash() {
        shimCalls++;
        return {
          update(value) { this.value = String(value); return this; },
          digest() { return 'bundler-shim-must-not-hash-byte-arrays'; }
        };
      }
    };
    const module = { exports: {} };
    const context = {
      module,
      exports: module.exports,
      require(name) {
        if (name !== 'crypto') throw new Error('Unexpected browser require: ' + name);
        return cryptoShim;
      }
      // Deliberately no process and no Buffer: this mirrors the classic Worker bundle.
    };
    vm.runInNewContext(source, context, { filename: 'hash256.browser-worker.test.js' });
    const browserHash = module.exports.sha256Hex(Uint8Array.from([0, 1, 2, 127, 128, 255]));
    const nodeHash = require('crypto').createHash('sha256')
      .update(Buffer.from([0, 1, 2, 127, 128, 255])).digest('hex');
    assertEq(browserHash, nodeHash, 'browser hash must cover exact bytes, not String(Uint8Array)');
    assertEq(shimCalls, 0, 'browser must not mistake the bundler shim for Node crypto');
  });
  it('מחרוזת = UTF-8 מפורש (לא אפסים שקטים)', () => {
    assertEq(sha256Hex('abc'), sha256Hex(Buffer.from('abc', 'utf8')));
  });
});

describe('שלב 3 — AssetResolver: זהות, בטיחות נתיבים ומקורות', () => {
  it('זהות content-addressed: אותם בתים ⇒ אותו מזהה, בכל הפניה', () => {
    const r = new AssetResolver();
    const a = r.addBytes('img/one.png', tinyPng(8, 12));
    const b = r.addBytes('img/two/deep/ref.png', tinyPng(8, 12));
    assert(a.ok && b.ok && a.assetId === b.assetId, `${a.assetId} != ${b.assetId}`);
    assert(/^ast-image-[0-9a-f]{14}$/.test(a.assetId), 'תבנית מזהה');
  });
  it('רישום כפול של אותו ref — idempotent; תוכן שונה תחת אותו ref — דחייה', () => {
    const r = new AssetResolver();
    r.addBytes('img/a.png', tinyPng(8, 12));
    const again = r.addBytes('img/a.png', tinyPng(8, 12));
    assert(again.ok && again.duplicate, 'idempotent');
    const conflict = r.addBytes('img/a.png', tinyPng(4, 4));
    assert(!conflict.ok && conflict.code === 'ref-conflict', 'conflict');
  });
  it('מניעת path traversal / absolute / NUL / סיומת לא נתמכת', () => {
    const r = new AssetResolver();
    assert(!r.resolve('../outside.png').ok, 'traversal');
    assert(!r.resolve('a/../../outside.png').ok, 'nested traversal');
    assert(!r.resolve('/abs/path.png').ok, 'absolute');
    assert(!r.resolve('C:/win.png').ok, 'windows drive');
    assert(!normalizeRefPath('bad\u0000.png').ok, 'NUL');
    assert(!r.addBytes('doc/file.txt', Buffer.from('x')).ok, 'unsupported ext');
  });
  it('מקור provider (תיקייה/קובץ מקומי — ספק סביבתי)', () => {
    const r = new AssetResolver();
    r.addProvider((p) => p === 'folder/pic.png' ? tinyPng(3, 3) : null);
    const res = r.resolve('folder/pic.png');
    assert(res.ok && res.source === 'provider', JSON.stringify(res.code));
    assert(!r.resolve('folder/missing.png').ok, 'missing');
  });
  it('מקור ZIP: רישומות עם סיומות נתמכות דרך zip-reader', () => {
    const { buildZip } = require('../../src/engine/output/zip-writer');
    const zip = buildZip([
      { name: 'book/img/cover.png', data: tinyPng(10, 5) },
      { name: 'book/img/icon.gif', data: tinyGif(4, 4) }
    ]);
    const r = new AssetResolver();
    const res = r.addZip(zip);
    assert(res.registered === 2, JSON.stringify(res));
    const m = r.measure('book/img/cover.png');
    assert(m.ok && m.width === 10 && m.height === 5, JSON.stringify(m.code));
  });
  it('נכס פגום: נרשם לחשבונאות עם מדידה כושלת מתועדת — הפריט אינו נעלם', () => {
    const r = new AssetResolver();
    const bad = r.addBytes('img/broken.png', Buffer.from('not a real png'));
    assert(bad.ok, 'נרשם');
    const m = r.measure('img/broken.png');
    assert(!m.ok && m.code, 'מדידה כושלת מתועדת: ' + JSON.stringify(m.code));
  });
  it('Worker transport: אותם מזהים ואותן מדידות בצד השני (§3.1-2)', () => {
    const r = new AssetResolver();
    const a1 = r.addBytes('img/cover.png', tinyPng(8, 12));
    const t = r.serializeForTransport();
    assert(t.ok && t.schema === 'asset-transport-v1', 'transport');
    const r2 = AssetResolver.fromTransport(t);
    const back = r2.resolveById(a1.assetId);
    assert(back.ok && back.asset.bytes.equals(tinyPng(8, 12)), 'בתים זהים');
    const m = r2.measure(a1.assetId);
    assert(m.ok && m.width === 8 && m.height === 12, 'מדידה זהה בצד ה-Worker');
    // הפרוטוקול מאמת את הסכמה
    assert(validateRequest({ type: 'typeset-request', jobId: 'j', text: 'x', settings: {}, assets: { schema: 'asset-transport-v1', assets: [{ assetId: a1.assetId, bytes: tinyPng(8, 12).buffer.slice(0) }] } }), 'protocol ok');
    let threw = false;
    try { validateRequest({ type: 'typeset-request', jobId: 'j', text: 'x', settings: {}, assets: { schema: 'bogus', assets: [] } }); } catch (_) { threw = true; }
    assert(threw, 'סכמה שגויה נדחית');
  });
  it('Worker asset cache: same content with new refs must rebuild the reference map', () => {
    const messages = [];
    const handler = createEngineWorkerMain((message) => messages.push(message), {
      typeset: (_text, settings, env) => {
        const current = env.assets.resolve(settings.assetRef);
        const previous = env.assets.resolve(settings.previousAssetRef);
        return { currentOk: current.ok, previousOk: previous.ok, assetId: current.assetId || null };
      },
      serializeResult: (result) => result
    });
    const bytes = tinyPng(8, 12);
    const first = new AssetResolver();
    const firstAsset = first.addBytes('img/first-name.png', bytes);
    const second = new AssetResolver();
    const secondAsset = second.addBytes('img/second-name.png', bytes);
    assertEq(firstAsset.assetId, secondAsset.assetId, 'content-addressed ID is unchanged');
    const firstTransport = first.serializeForTransport();
    const secondTransport = second.serializeForTransport();
    assertEq(firstTransport.assets[0].bytes.length, secondTransport.assets[0].bytes.length, 'byte lengths are identical');
    const send = (jobId, settings, assets) => {
      handler({ type: 'typeset-request', jobId, text: 'asset-cache-test', settings, assets });
      const response = messages.find((message) => message.jobId === jobId);
      assert(response && response.type === 'typeset-result', 'typeset request completed: ' + jobId);
      return response.result;
    };
    const firstResult = send('asset-cache-refs-a', {
      assetRef: 'img/first-name.png', previousAssetRef: 'img/second-name.png'
    }, firstTransport);
    assertEq(firstResult.currentOk, true, 'first reference resolves');
    const secondResult = send('asset-cache-refs-b', {
      assetRef: 'img/second-name.png', previousAssetRef: 'img/first-name.png'
    }, secondTransport);
    assertEq(secondResult.currentOk, true, 'same bytes with a new reference must resolve');
    assertEq(secondResult.previousOk, false, 'the previous document reference must not leak into the new resolver');
    assertEq(secondResult.assetId, firstAsset.assetId, 'content identity remains stable');
  });
  it('Worker asset cache: changed bytes with the same declared ID and length are revalidated', () => {
    const messages = [];
    const handler = createEngineWorkerMain((message) => messages.push(message), {
      typeset: (_text, settings, env) => {
        const resolved = env.assets.resolve(settings.assetRef);
        return {
          assetOk: resolved.ok,
          reportOk: env.assets.transportReport.ok,
          rejectionCodes: env.assets.transportReport.rejected.map((entry) => entry.code)
        };
      },
      serializeResult: (result) => result
    });
    const source = new AssetResolver();
    source.addBytes('img/integrity.png', tinyPng(8, 12));
    const validTransport = source.serializeForTransport();
    const send = (jobId, assets) => {
      handler({ type: 'typeset-request', jobId, text: 'asset-integrity-test', settings: { assetRef: 'img/integrity.png' }, assets });
      const response = messages.find((message) => message.jobId === jobId);
      assert(response && response.type === 'typeset-result', 'typeset request completed: ' + jobId);
      return response.result;
    };
    const validResult = send('asset-cache-bytes-a', validTransport);
    assertEq(validResult.assetOk, true, 'verified bytes resolve');
    assertEq(validResult.reportOk, true, 'valid transport report');
    const tamperedBytes = tinyPng(9, 12);
    assertEq(tamperedBytes.length, validTransport.assets[0].bytes.length, 'tampered fixture keeps byte length');
    const tamperedTransport = {
      schema: validTransport.schema,
      assets: validTransport.assets.map((asset) => ({ ...asset, bytes: tamperedBytes }))
    };
    const tamperedResult = send('asset-cache-bytes-b', tamperedTransport);
    assertEq(tamperedResult.assetOk, false, 'changed bytes must not reuse the previous cached resolver');
    assertEq(tamperedResult.reportOk, false, 'transport integrity mismatch must be reported');
    assert(tamperedResult.rejectionCodes.includes('asset-id-mismatch'), 'integrity failure code is preserved');
  });
  it('זהות בין ריצות: resolver חדש מאותם בתים — אותם מזהים', () => {
    const a = new AssetResolver().addBytes('x.png', tinyPng(8, 12));
    const b = new AssetResolver().addBytes('different/ref.png', tinyPng(8, 12));
    assertEq(a.assetId, b.assetId, 'זהות דטרמיניסטית בין ריצות');
  });
  it('סיומות נתמכות = הרשימה שהמוצר תומך בה בפועל', () => {
    assertEq(SUPPORTED_EXTENSIONS.join(','), 'png,jpg,jpeg,gif,bmp,webp,svg');
  });
});

report('s3-assets');
