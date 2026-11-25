'use strict';

// The canonical Unicode 18 runtime now lives with the production engine.
// Keep this Node-only compatibility entry point without duplicating the WASM ABI.
module.exports = require('../../red-build/src/engine/typography/unicode18-bidi-runtime.js');
