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
    // Hash the original Worker-side JSON before any browser automation/DevTools
    // transport can decode and re-encode non-ASCII report strings.
    const encoder = new TextEncoder();
    const sha256Hex = async (json) => {
      const digest = await crypto.subtle.digest('SHA-256', encoder.encode(json));
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    };
    const reportSha256 = await sha256Hex(JSON.stringify(report));
    const graphemeSha256 = await sha256Hex(JSON.stringify(graphemeResult));
    if (graphemeResult.failedCases !== 0 ||
        graphemeResult.passedCases !== graphemeResult.testCount) {
      throw new Error('Unicode 18 GraphemeBreakTest failed in Worker: ' + JSON.stringify(graphemeResult));
    }
    self.postMessage({
      state: 'passed',
      unicodeVersion: runtime.unicodeVersion,
      reportSha256,
      graphemeSha256,
      fixtureCount: report.fixtureCount,
      graphemeTestCount: graphemeResult.testCount
    });
  } catch (error) {
    self.postMessage({
      state: 'failed',
      error: String(error && error.stack || error)
    });
  }
};
