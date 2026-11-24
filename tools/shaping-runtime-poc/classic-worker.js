'use strict';

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
    const results = [];
    for (const fixture of message.fonts || []) {
      const response = await fetch(fixture.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('font fetch failed for ' + fixture.name + ': HTTP ' + response.status);
      const fontBytes = await response.arrayBuffer();
      results.push(self.HarfBuzzRuntimePoc.shapeWithHarfBuzz(hb, fontBytes, fixture));
    }
    self.postMessage({
      type: 'shape-result',
      ok: true,
      runtime: {
        classicWorker: typeof importScripts === 'function',
        dynamicImport: true,
        wasmLoaded: true
      },
      results
    });
  } catch (error) {
    self.postMessage({
      type: 'shape-result',
      ok: false,
      error: String(error && error.stack || error)
    });
  }
};
