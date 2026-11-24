'use strict';

/*
 * Deliberately a classic Worker: the host constructs this without { type:'module' }.
 * importScripts loads the shared test helper; import() dynamically loads the
 * HarfBuzz ESM/WASM package and awaits its top-level initialization.
 */
importScripts('/shape-core.js');

let harfBuzzPromise;

function loadHarfBuzz(moduleUrl) {
  if (!harfBuzzPromise) {
    harfBuzzPromise = import(moduleUrl).catch((error) => {
      harfBuzzPromise = null;
      throw error;
    });
  }
  return harfBuzzPromise;
}

self.onmessage = async (event) => {
  const message = event.data || {};
  if (message.type !== 'shape') return;
  try {
    const hb = await loadHarfBuzz(message.moduleUrl);
    const response = await fetch(message.fontUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error('font fetch failed: HTTP ' + response.status);
    const fontBytes = await response.arrayBuffer();
    const shape = self.HarfBuzzRuntimePoc.shapeWithHarfBuzz(hb, fontBytes);
    self.postMessage({
      type: 'shape-result',
      ok: true,
      runtime: {
        classicWorker: typeof importScripts === 'function',
        dynamicImport: true,
        wasmLoaded: true
      },
      shape
    });
  } catch (error) {
    self.postMessage({
      type: 'shape-result',
      ok: false,
      error: String(error && error.stack || error)
    });
  }
};
