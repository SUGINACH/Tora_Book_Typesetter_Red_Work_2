// red-build/src/engine/typography/production-typography-runtime.js
// Loads the pinned, locally vendored Unicode 18 + HarfBuzz runtime.
// This module does not activate shaping in the layout pipeline by itself.
'use strict';

const { sha256Hex } = require('../assets/hash256');
const { instantiate: instantiateUnicode18 } = require('./unicode18-bidi-runtime');
const { createHarfBuzzShaper } = require('./harfbuzz-shaper');

const RUNTIME_MANIFEST_SCHEMA = 1;
const RUNTIME_ARTIFACT_KIND = 'staged-runtime-assets-not-production-enabled';
const HARFBUZZ_PACKAGE = 'harfbuzzjs';
const HARFBUZZ_PACKAGE_VERSION = '1.6.4';
const HARFBUZZ_CORE_VERSION = '15.0.0';
const UNICODE_VERSION = '18.0.0';
const UNICODE_UPSTREAM_REVISION = '9a8c7b03be01def5cf7014b89d5af90f7382fdad';

const EXPECTED_FILES = Object.freeze({
  'harfbuzzjs/dist/harfbuzz.js': Object.freeze({
    bytes: 32099,
    sha256: '28392846ce6accb53e34bdce197b8aa00721e84846ff4b2c0ccfad5137a0e699'
  }),
  'harfbuzzjs/dist/harfbuzz.wasm': Object.freeze({
    bytes: 444394,
    sha256: '6eeed8e1bc9ad7773038e48ff8f9e07e0ad228572c594b45e5357e9c2f7a0b2e'
  }),
  'harfbuzzjs/dist/index.mjs': Object.freeze({
    bytes: 85257,
    sha256: '16016989059a6600a1b82b42f61b494c776db02dec49bf645af65b8a5e599bf9'
  }),
  'harfbuzzjs/LICENSE': Object.freeze({
    bytes: 1079,
    sha256: '5d09767b2cc476f08028b56d9384dc45061c5a3e90f9ad966e44addc8d26c8b1'
  }),
  'harfbuzzjs/package.json': Object.freeze({
    bytes: 1112,
    sha256: '92200c5035787f530332dcf547b22fceace4d18ee9253995f213d49c09143cb4'
  }),
  'unicode18-bidi-runtime.js': Object.freeze({
    bytes: 37186,
    sha256: '580685c67ffbadf68900ae152253ca9a9e1616a32d8a1864b306967d928009dc'
  }),
  'unicode18-bidi-runtime.wasm': Object.freeze({
    bytes: 151361,
    sha256: '78e7681311db93a552c6ebb58e7e8f0797cf61b9b578897b0a6ae603872ce776'
  })
});

function fail(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause !== undefined) error.cause = cause;
  throw error;
}

function isRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string' || !value) {
    fail('invalid-runtime-base-url', 'A local shaping-runtime base URL is required');
  }
  let base;
  try {
    base = new URL(value);
  } catch (error) {
    fail('invalid-runtime-base-url', 'The shaping-runtime base URL is invalid', error);
  }
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    fail('invalid-runtime-base-url', 'The shaping-runtime base URL must use HTTP(S)');
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  base.search = '';
  base.hash = '';
  return base;
}

function validateManifest(manifest) {
  if (!isRecord(manifest) ||
      manifest.schemaVersion !== RUNTIME_MANIFEST_SCHEMA ||
      manifest.artifactKind !== RUNTIME_ARTIFACT_KIND) {
    fail('invalid-runtime-manifest', 'The shaping-runtime manifest schema or artifact kind is unsupported');
  }
  if (!isRecord(manifest.harfbuzz) ||
      manifest.harfbuzz.package !== HARFBUZZ_PACKAGE ||
      manifest.harfbuzz.version !== HARFBUZZ_PACKAGE_VERSION ||
      manifest.harfbuzz.license !== 'MIT' ||
      manifest.harfbuzz.packageEngines !== null) {
    fail('invalid-runtime-manifest', 'The HarfBuzz package identity, version or license differs from the pinned runtime');
  }
  if (!isRecord(manifest.unicode) ||
      manifest.unicode.version !== UNICODE_VERSION ||
      manifest.unicode.upstream !== 'servo/unicode-bidi' ||
      manifest.unicode.revision !== UNICODE_UPSTREAM_REVISION ||
      manifest.unicode.runtimeModule !== 'unicode18-bidi-runtime.js' ||
      manifest.unicode.wasmModule !== 'unicode18-bidi-runtime.wasm') {
    fail('invalid-runtime-manifest', 'The Unicode runtime identity differs from the pinned Unicode 18 build');
  }
  if (!Array.isArray(manifest.files) || manifest.files.length !== Object.keys(EXPECTED_FILES).length) {
    fail('invalid-runtime-manifest', 'The runtime manifest file list is incomplete or contains unexpected files');
  }
  const seen = new Set();
  for (const entry of manifest.files) {
    if (!isRecord(entry) || typeof entry.path !== 'string' || seen.has(entry.path)) {
      fail('invalid-runtime-manifest', 'The runtime manifest contains an invalid or duplicate file path');
    }
    seen.add(entry.path);
    const expected = EXPECTED_FILES[entry.path];
    if (!expected || entry.bytes !== expected.bytes || entry.sha256 !== expected.sha256) {
      fail('invalid-runtime-manifest', 'The runtime manifest record differs from the pinned file identity: ' + entry.path);
    }
  }
  for (const path of Object.keys(EXPECTED_FILES)) {
    if (!seen.has(path)) fail('invalid-runtime-manifest', 'The runtime manifest is missing ' + path);
  }
  return manifest;
}

async function readBytes(fetchImpl, url, pathLabel) {
  let response;
  try {
    response = await fetchImpl(url, { credentials: 'same-origin', cache: 'force-cache' });
  } catch (error) {
    fail('runtime-asset-fetch-failed', 'Could not fetch runtime asset ' + pathLabel, error);
  }
  if (!response || response.ok !== true || typeof response.arrayBuffer !== 'function') {
    fail('runtime-asset-fetch-failed', 'Runtime asset request failed: ' + pathLabel);
  }
  let buffer;
  try {
    buffer = await response.arrayBuffer();
  } catch (error) {
    fail('runtime-asset-read-failed', 'Could not read runtime asset ' + pathLabel, error);
  }
  return new Uint8Array(buffer);
}

async function loadProductionTypographyRuntime(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const importModule = options.importModule || ((specifier) => import(specifier));
  if (typeof fetchImpl !== 'function') {
    fail('runtime-fetch-unavailable', 'Fetch is required to load the pinned typography runtime');
  }
  if (typeof importModule !== 'function') {
    fail('runtime-import-unavailable', 'Dynamic module import is required to load HarfBuzzJS');
  }

  const manifestUrl = new URL('manifest.json', baseUrl).href;
  const manifestBytes = await readBytes(fetchImpl, manifestUrl, 'manifest.json');
  if (manifestBytes.length === 0 || manifestBytes.length > 16384) {
    fail('invalid-runtime-manifest', 'The shaping-runtime manifest is empty or exceeds its size limit');
  }
  let manifest;
  try {
    manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes));
  } catch (error) {
    fail('invalid-runtime-manifest', 'The shaping-runtime manifest is not valid UTF-8 JSON', error);
  }
  validateManifest(manifest);

  const verifiedBytes = Object.create(null);
  const assetDigests = Object.create(null);
  const filePaths = Object.keys(EXPECTED_FILES);
  const fetched = await Promise.all(filePaths.map(async (path) => {
    const url = new URL(path, baseUrl).href;
    const bytes = await readBytes(fetchImpl, url, path);
    const expected = EXPECTED_FILES[path];
    if (bytes.length !== expected.bytes) {
      fail('runtime-asset-size-mismatch', 'Runtime asset byte length differs from its pinned size: ' + path);
    }
    const digest = sha256Hex(bytes);
    if (digest !== expected.sha256) {
      fail('runtime-asset-hash-mismatch', 'Runtime asset SHA-256 differs from its pinned identity: ' + path);
    }
    return { path, bytes, digest };
  }));
  for (const item of fetched) {
    verifiedBytes[item.path] = item.bytes;
    assetDigests[item.path] = item.digest;
  }

  let packageMetadata;
  try {
    packageMetadata = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(verifiedBytes['harfbuzzjs/package.json']));
  } catch (error) {
    fail('invalid-harfbuzz-package-metadata', 'The pinned HarfBuzz package metadata is invalid', error);
  }
  if (!isRecord(packageMetadata) ||
      packageMetadata.name !== HARFBUZZ_PACKAGE ||
      packageMetadata.version !== HARFBUZZ_PACKAGE_VERSION ||
      packageMetadata.license !== 'MIT') {
    fail('invalid-harfbuzz-package-metadata', 'The fetched HarfBuzz package metadata does not match the pinned MIT package');
  }

  const harfbuzzUrl = new URL('harfbuzzjs/dist/index.mjs', baseUrl).href;
  let harfbuzz;
  try {
    harfbuzz = await importModule(harfbuzzUrl);
  } catch (error) {
    fail('harfbuzz-runtime-import-failed', 'Could not import the pinned local HarfBuzzJS module', error);
  }
  if (!harfbuzz || typeof harfbuzz.versionString !== 'function' ||
      typeof harfbuzz.shape !== 'function' || harfbuzz.versionString() !== HARFBUZZ_CORE_VERSION) {
    fail('harfbuzz-runtime-version-mismatch', 'The imported HarfBuzz core version differs from the pinned 15.0.0 runtime');
  }

  let unicode;
  try {
    unicode = await instantiateUnicode18(verifiedBytes['unicode18-bidi-runtime.wasm']);
  } catch (error) {
    fail('unicode-runtime-instantiate-failed', 'Could not instantiate the pinned Unicode 18 WASM module', error);
  }
  if (!unicode || unicode.unicodeVersion !== UNICODE_VERSION ||
      typeof unicode.resolve !== 'function' || typeof unicode.itemizeScripts !== 'function') {
    fail('unicode-runtime-version-mismatch', 'The instantiated Unicode runtime does not satisfy the Unicode 18 itemization contract');
  }

  const frozenDigests = Object.freeze({ ...assetDigests });
  const runtime = {
    manifest,
    baseUrl: baseUrl.href,
    harfbuzz,
    unicode,
    assetDigests: frozenDigests,
    itemize(text, baseDirection = 'auto') {
      if (typeof text !== 'string') fail('invalid-itemization-source', 'TextItem source must be a string');
      const bidi = unicode.resolve(text, baseDirection);
      const itemization = unicode.itemizeScripts(text, bidi);
      if (itemization.utf16Length !== text.length || itemization.unicodeVersion !== UNICODE_VERSION) {
        fail('unicode-itemization-integrity-failure', 'Unicode itemization did not preserve the full UTF-16 source');
      }
      return Object.freeze({ bidi, itemization });
    },
    createShaper(fontResolver, shaperOptions = {}) {
      if (!isRecord(shaperOptions)) fail('invalid-shaper-options', 'Shaper options must be a plain object');
      return createHarfBuzzShaper({
        ...shaperOptions,
        hb: harfbuzz,
        fontResolver,
        engineVersion: harfbuzz.versionString()
      });
    }
  };
  return Object.freeze(runtime);
}

module.exports = {
  RUNTIME_MANIFEST_SCHEMA,
  HARFBUZZ_PACKAGE_VERSION,
  HARFBUZZ_CORE_VERSION,
  UNICODE_VERSION,
  EXPECTED_FILES,
  loadProductionTypographyRuntime
};
