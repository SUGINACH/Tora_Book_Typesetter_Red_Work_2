/* classic Worker: same UTF-16 WASM contract as the Node reference. */
importScripts('/bidi-api.js');

self.onmessage = async function onMessage(event) {
  try {
    const [wasmResponse, fixtureResponse, graphemeResponse] = await Promise.all([
      fetch('/bidi-runtime.wasm', { cache: 'no-store' }),
      fetch('/fixtures.json', { cache: 'no-store' }),
      fetch('/grapheme-fixtures.json', { cache: 'no-store' })
    ]);
    if (!wasmResponse.ok) throw new Error('WASM fetch failed: ' + wasmResponse.status);
    if (!fixtureResponse.ok) throw new Error('Fixture fetch failed: ' + fixtureResponse.status);
    if (!graphemeResponse.ok) throw new Error('Grapheme fixture fetch failed: ' + graphemeResponse.status);

    const [wasmBytes, fixtures, graphemeFixtures] = await Promise.all([
      wasmResponse.arrayBuffer(),
      fixtureResponse.json(),
      graphemeResponse.json()
    ]);
    const runtime = await self.RedBidiRuntime.instantiate(wasmBytes);
    const report = runtime.analyzeFixtures(fixtures);
    const graphemeResult = runtime.validateGraphemeFixtures(graphemeFixtures);
    if (graphemeResult.failedCases !== 0 ||
        graphemeResult.passedCases !== graphemeResult.testCount) {
      throw new Error('Unicode 18 GraphemeBreakTest failed in Worker: ' + JSON.stringify(graphemeResult));
    }
    self.postMessage({
      state: 'passed',
      unicodeVersion: runtime.unicodeVersion,
      report,
      graphemeResult
    });
  } catch (error) {
    self.postMessage({
      state: 'failed',
      error: String(error && error.stack || error)
    });
  }
};
