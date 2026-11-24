'use strict';

importScripts('/shape-core.js', '/bidi-api.js');

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
    const bidiResponse = await fetch(message.bidiWasmUrl, { cache: 'no-store' });
    if (!bidiResponse.ok) throw new Error('Bidi WASM fetch failed: HTTP ' + bidiResponse.status);
    const bidiRuntime = await self.RedBidiRuntime.instantiate(await bidiResponse.arrayBuffer());
    if (bidiRuntime.unicodeVersion !== '18.0.0') throw new Error('Unexpected Worker itemizer version ' + bidiRuntime.unicodeVersion);
    const config = message.sharedItemization;
    if (!config || typeof config.sourceText !== 'string' || !config.languageByScript || !config.featureTagsByScript) {
      throw new Error('Worker message is missing shared itemization configuration');
    }
    const itemization = bidiRuntime.itemizeScripts(config.sourceText, bidiRuntime.resolve(config.sourceText, config.baseDirection));
    const sharedItemization = {
      sourceText: config.sourceText, itemization,
      languageByScript: config.languageByScript,
      featureTagsByScript: config.featureTagsByScript
    };
    const results = [];
    for (const fixture of message.fonts || []) {
      const response = await fetch(fixture.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('font fetch failed for ' + fixture.name + ': HTTP ' + response.status);
      const fontBytes = await response.arrayBuffer();
      results.push(self.HarfBuzzRuntimePoc.shapeWithHarfBuzz(hb, fontBytes, Object.assign({}, fixture, { sharedItemization })));
    }
    self.postMessage({
      type: 'shape-result',
      ok: true,
      runtime: {
        classicWorker: typeof importScripts === 'function',
        dynamicImport: true,
        wasmLoaded: true,
        bidiWasmLoaded: true,
        bidiUnicodeVersion: bidiRuntime.unicodeVersion,
        sharedItemizationProbeFontCount: results.filter((x) => x.sharedItemizationProbe && x.sharedItemizationProbe.status === 'passed').length,
        sharedItemizationProbePassed: results.every((x) => x.coverageStatus !== 'complete' || (x.sharedItemizationProbe && x.sharedItemizationProbe.status === 'passed'))
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
