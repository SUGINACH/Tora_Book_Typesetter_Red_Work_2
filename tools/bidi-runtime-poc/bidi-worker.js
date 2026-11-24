/* classic Worker: same UTF-16 WASM contract as the Node reference. */
importScripts('/bidi-api.js');

self.onmessage = async function onMessage(event) {
  try {
    const [wasmResponse, fixtureResponse] = await Promise.all([
      fetch('/bidi-runtime.wasm', { cache: 'no-store' }),
      fetch('/fixtures.json', { cache: 'no-store' })
    ]);
    if (!wasmResponse.ok) throw new Error('WASM fetch failed: ' + wasmResponse.status);
    if (!fixtureResponse.ok) throw new Error('Fixture fetch failed: ' + fixtureResponse.status);

    const [wasmBytes, fixtures] = await Promise.all([
      wasmResponse.arrayBuffer(),
      fixtureResponse.json()
    ]);
    const runtime = await self.RedBidiRuntime.instantiate(wasmBytes);
    const report = runtime.analyzeFixtures(fixtures);
    self.postMessage({
      state: 'passed',
      unicodeVersion: runtime.unicodeVersion,
      report
    });
  } catch (error) {
    self.postMessage({
      state: 'failed',
      error: String(error && error.stack || error)
    });
  }
};
