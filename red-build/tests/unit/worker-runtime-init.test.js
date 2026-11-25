// red-build/tests/unit/worker-runtime-init.test.js
'use strict';

const { describe, it, assert, assertEq } = require('../harness');
const { bootWorkerContext } = require('../../src/ui/engine-worker-main');
const { validateTypographyRuntimeInitRequest } = require('../../src/ui/worker-protocol');

function fakeRuntime() {
  return {
    manifest: { harfbuzz: { version: '1.6.4' } },
    harfbuzz: { versionString: () => '15.0.0', shape() {} },
    unicode: { unicodeVersion: '18.0.0' },
    createShaper() { return {}; },
    assetDigests: {
      'harfbuzzjs/dist/index.mjs': '1'.repeat(64),
      'unicode18-bidi-runtime.wasm': '2'.repeat(64)
    }
  };
}

function makeContext() {
  const messages = [];
  return {
    messages,
    location: { href: 'https://example.test/red/engine-worker.bundle.js?build=1' },
    postMessage(message) { messages.push(message); }
  };
}

function nextTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('Worker-only pinned typography runtime initialization', () => {
  it('validates an explicit init request and rejects malformed identifiers', () => {
    assertEq(validateTypographyRuntimeInitRequest({
      type: 'typography-runtime-init', jobId: 'runtime-init-1'
    }), true);
    for (const message of [
      null,
      {},
      { type: 'typeset-request', jobId: 'runtime-init-1' },
      { type: 'typography-runtime-init' },
      { type: 'typography-runtime-init', jobId: '' },
      { type: 'typography-runtime-init', jobId: 'x'.repeat(129) }
    ]) {
      let error = null;
      try { validateTypographyRuntimeInitRequest(message); } catch (caught) { error = caught; }
      assert(error instanceof Error, 'malformed runtime init message must be rejected');
    }
  });

  it('loads once for concurrent requests and replies with versions and verified asset hashes', async () => {
    const ctx = makeContext();
    let calls = 0;
    let requestedBaseUrl = null;
    bootWorkerContext(ctx, {
      loadTypographyRuntime: async ({ baseUrl }) => {
        calls++;
        requestedBaseUrl = baseUrl;
        await Promise.resolve();
        return fakeRuntime();
      }
    });

    ctx.onmessage({ data: { type: 'typography-runtime-init', jobId: 'runtime-a' } });
    ctx.onmessage({ data: { type: 'typography-runtime-init', jobId: 'runtime-b' } });
    await nextTurn();

    assertEq(calls, 1, 'concurrent requests must share one verified runtime initialization');
    assertEq(requestedBaseUrl, 'https://example.test/red/assets/shaping-runtime/');
    assertEq(ctx.messages.map((message) => message.type), [
      'typography-runtime-result', 'typography-runtime-result'
    ]);
    assertEq(ctx.messages.map((message) => message.jobId).sort(), ['runtime-a', 'runtime-b']);
    for (const message of ctx.messages) {
      assertEq(message.ok, true);
      assertEq(message.harfbuzzPackageVersion, '1.6.4');
      assertEq(message.harfbuzzCoreVersion, '15.0.0');
      assertEq(message.unicodeVersion, '18.0.0');
      assertEq(message.assetCount, 2);
      assertEq(Object.keys(message.assetDigests).sort(), [
        'harfbuzzjs/dist/index.mjs', 'unicode18-bidi-runtime.wasm'
      ]);
    }
  });


  it('lazily initializes once before concurrent typeset requests and injects the same verified runtime', async () => {
    const ctx = makeContext();
    const runtime = fakeRuntime();
    let loadCalls = 0;
    const observed = [];
    const serialized = [];
    bootWorkerContext(ctx, {
      loadTypographyRuntime: async ({ baseUrl }) => {
        loadCalls++;
        assertEq(baseUrl, 'https://example.test/red/assets/shaping-runtime/');
        await Promise.resolve();
        return runtime;
      },
      typeset: (text, settings, environment) => {
        observed.push({ text, environment });
        return { text, pages: [] };
      },
      serializeResult: (result) => {
        serialized.push(result);
        return { text: result.text };
      }
    });

    ctx.onmessage({ data: {
      type: 'typeset-request', jobId: 'lazy-a', text: 'א', settings: {}
    } });
    ctx.onmessage({ data: {
      type: 'typeset-request', jobId: 'lazy-b', text: 'ב', settings: {}
    } });
    await nextTurn();

    assertEq(loadCalls, 1, 'concurrent typeset requests share one runtime initialization');
    assertEq(observed.map((item) => item.text), ['א', 'ב']);
    assert(observed.every((item) => item.environment.typographyRuntime === runtime),
      'the exact verified runtime object must reach the typeset environment');
    assertEq(serialized.length, 2);
    assertEq(ctx.messages.filter((message) => message.type === 'typeset-result').map((message) => message.jobId),
      ['lazy-a', 'lazy-b']);
  });

  it('does not start typesetting when pinned runtime initialization fails', async () => {
    const ctx = makeContext();
    let typesetCalls = 0;
    const failure = new Error('runtime hash verification failed');
    failure.code = 'runtime-asset-hash-mismatch';
    bootWorkerContext(ctx, {
      loadTypographyRuntime: async () => { throw failure; },
      typeset: () => { typesetCalls++; return {}; },
      serializeResult: () => ({})
    });

    ctx.onmessage({ data: {
      type: 'typeset-request', jobId: 'runtime-blocked', text: 'שלום', settings: {}
    } });
    await nextTurn();

    assertEq(typesetCalls, 0, 'layout must not fall back to the legacy path after runtime verification fails');
    const error = ctx.messages.find((message) => message.type === 'typeset-error');
    assert(error, 'a runtime failure must reject the typeset request');
    assertEq(error.jobId, 'runtime-blocked');
    assertEq(error.code, 'runtime-asset-hash-mismatch');
    assert(error.message.includes('typesetting was not started'));
  });

  it('a cancel received during runtime initialization prevents layout execution', async () => {
    const ctx = makeContext();
    let resolveRuntime;
    let typesetCalls = 0;
    bootWorkerContext(ctx, {
      loadTypographyRuntime: () => new Promise((resolve) => { resolveRuntime = resolve; }),
      typeset: () => { typesetCalls++; return {}; },
      serializeResult: () => ({})
    });

    ctx.onmessage({ data: {
      type: 'typeset-request', jobId: 'cancel-during-init', text: 'שלום', settings: {}
    } });
    ctx.onmessage({ data: { type: 'cancel', jobId: 'cancel-during-init' } });
    await nextTurn(); // allow ensureTypographyRuntime() to invoke the injected loader
    resolveRuntime(fakeRuntime());
    await nextTurn();

    assertEq(typesetCalls, 0, 'cancelled work must be discarded after initialization');
    assertEq(ctx.messages.length, 0, 'cancelled work must not emit a result or error');
  });

  it('clears a failed initialization promise so a later explicit retry can succeed', async () => {
    const ctx = makeContext();
    let calls = 0;
    bootWorkerContext(ctx, {
      loadTypographyRuntime: async () => {
        calls++;
        if (calls === 1) {
          const error = new Error('simulated verified asset fetch failure');
          error.code = 'runtime-asset-fetch-failed';
          throw error;
        }
        return fakeRuntime();
      }
    });

    ctx.onmessage({ data: { type: 'typography-runtime-init', jobId: 'runtime-fail' } });
    await nextTurn();
    ctx.onmessage({ data: { type: 'typography-runtime-init', jobId: 'runtime-retry' } });
    await nextTurn();

    assertEq(calls, 2, 'a rejected initialization must not remain cached');
    assertEq(ctx.messages.length, 2);
    assertEq(ctx.messages[0].ok, false);
    assertEq(ctx.messages[0].code, 'runtime-asset-fetch-failed');
    assertEq(ctx.messages[1].ok, true);
    assertEq(ctx.messages[1].jobId, 'runtime-retry');
  });
});

