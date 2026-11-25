// red-build/tests/unit/worker-runtime-init.test.js
'use strict';

const { describe, it, assert, assertEq } = require('../harness');
const { bootWorkerContext } = require('../../src/ui/engine-worker-main');
const { validateTypographyRuntimeInitRequest } = require('../../src/ui/worker-protocol');

function fakeRuntime() {
  return {
    manifest: { harfbuzz: { version: '1.6.4' } },
    harfbuzz: { versionString: () => '15.0.0' },
    unicode: { unicodeVersion: '18.0.0' },
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

