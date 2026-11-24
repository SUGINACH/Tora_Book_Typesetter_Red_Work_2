(function expose(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RedBidiRuntime = api;
})(typeof self !== 'undefined' ? self : globalThis, function createModule() {
  'use strict';

  const BASE_DIRECTION = Object.freeze({ ltr: 0, rtl: 1, auto: 2 });

  function requireFunction(exports, name) {
    if (!exports || typeof exports[name] !== 'function') {
      throw new Error('Bidi WASM export missing: ' + name);
    }
    return exports[name].bind(exports);
  }

  function toUtf16Units(text) {
    text = String(text);
    const units = new Uint16Array(text.length);
    for (let i = 0; i < text.length; i++) units[i] = text.charCodeAt(i);
    return units;
  }

  function isUtf16Boundary(units, index) {
    if (index <= 0 || index >= units.length) return true;
    const previous = units[index - 1];
    const current = units[index];
    const previousHigh = previous >= 0xD800 && previous <= 0xDBFF;
    const currentLow = current >= 0xDC00 && current <= 0xDFFF;
    return !(previousHigh && currentLow);
  }

  function codePointBoundaries(text) {
    const result = [0];
    let offset = 0;
    for (const value of String(text)) {
      offset += value.length;
      result.push(offset);
    }
    return result;
  }

  function createRuntime(wasmExports) {
    const exports = wasmExports || {};
    const memory = exports.memory;
    if (!(memory instanceof WebAssembly.Memory)) {
      throw new Error('Bidi WASM memory export is missing');
    }

    const allocInput = requireFunction(exports, 'bidi_alloc_u16');
    const freeInput = requireFunction(exports, 'bidi_free_u16');
    const freeOutput = requireFunction(exports, 'bidi_free_u32');
    const resolveRaw = requireFunction(exports, 'bidi_resolve');
    const visualRunsRaw = requireFunction(exports, 'bidi_line_visual_runs');
    const unicodeVersion = [
      requireFunction(exports, 'bidi_unicode_version_major')(),
      requireFunction(exports, 'bidi_unicode_version_minor')(),
      requireFunction(exports, 'bidi_unicode_version_patch')()
    ];

    if (unicodeVersion[0] !== 18) {
      throw new Error('Bidi WASM Unicode data version must be 18.0.0; got ' + unicodeVersion.join('.'));
    }

    function withInput(text, callback) {
      const units = toUtf16Units(text);
      if (units.length === 0) throw new Error('Empty UTF-16 input is not supported by this POC ABI');
      const pointer = allocInput(units.length);
      if (!pointer) throw new Error('Bidi WASM failed to allocate UTF-16 input');
      new Uint16Array(memory.buffer, pointer, units.length).set(units);
      try {
        return callback(pointer, units);
      } finally {
        freeInput(pointer, units.length);
      }
    }

    function readOutput(pointer) {
      if (!pointer) throw new Error('Bidi WASM rejected input or returned an invalid result pointer');
      const header = new Uint32Array(memory.buffer, pointer, 2);
      const first = header[0];
      const second = header[1];
      return { first, second };
    }

    function copyAndFreeOutput(pointer, outputLength) {
      if (!pointer || !Number.isSafeInteger(outputLength) || outputLength < 2) {
        throw new Error('Invalid Bidi WASM output buffer');
      }
      const result = Array.from(new Uint32Array(memory.buffer, pointer, outputLength));
      freeOutput(pointer, outputLength);
      return result;
    }

    function resolve(text, baseDirection = 'auto') {
      const base = BASE_DIRECTION[baseDirection];
      if (base === undefined) throw new Error('Unknown paragraph base direction: ' + baseDirection);

      return withInput(text, (pointer, units) => {
        const outputPointer = resolveRaw(pointer, units.length, base);
        const header = readOutput(outputPointer);
        const levelCount = header.first;
        const paragraphCount = header.second;
        const outputLength = 2 + levelCount + paragraphCount * 3;
        const values = copyAndFreeOutput(outputPointer, outputLength);
        if (levelCount !== units.length) {
          throw new Error('Bidi WASM levels length differs from UTF-16 source length');
        }

        const levels = values.slice(2, 2 + levelCount);
        const paragraphs = [];
        let cursor = 2 + levelCount;
        for (let i = 0; i < paragraphCount; i++) {
          const start = values[cursor++];
          const end = values[cursor++];
          const level = values[cursor++];
          if (start > end || end > units.length || level > 126) {
            throw new Error('Bidi WASM returned an invalid paragraph range or embedding level');
          }
          if (!isUtf16Boundary(units, start) || !isUtf16Boundary(units, end)) {
            throw new Error('Bidi paragraph range splits a UTF-16 surrogate pair');
          }
          paragraphs.push({ start, end, level });
        }
        return { text: String(text), utf16Length: units.length, levels, paragraphs };
      });
    }

    function lineVisualRuns(text, baseDirection, lineStart, lineEnd) {
      const base = BASE_DIRECTION[baseDirection];
      if (base === undefined) throw new Error('Unknown paragraph base direction: ' + baseDirection);
      return withInput(text, (pointer, units) => {
        if (!Number.isSafeInteger(lineStart) || !Number.isSafeInteger(lineEnd) ||
            lineStart < 0 || lineEnd <= lineStart || lineEnd > units.length) {
          throw new RangeError('Invalid UTF-16 line range: ' + lineStart + '..' + lineEnd);
        }
        if (!isUtf16Boundary(units, lineStart) || !isUtf16Boundary(units, lineEnd)) {
          throw new Error('Bidi line range splits a UTF-16 surrogate pair');
        }
        const outputPointer = visualRunsRaw(pointer, units.length, base, lineStart, lineEnd);
        const header = readOutput(outputPointer);
        const levelCount = header.first;
        const runCount = header.second;
        const outputLength = 2 + levelCount + runCount * 3;
        const values = copyAndFreeOutput(outputPointer, outputLength);
        if (levelCount !== lineEnd - lineStart) {
          throw new Error('Bidi visual-run levels length differs from requested line length');
        }

        const levels = values.slice(2, 2 + levelCount);
        const runs = [];
        let cursor = 2 + levelCount;
        for (let i = 0; i < runCount; i++) {
          const start = values[cursor++];
          const end = values[cursor++];
          const level = values[cursor++];
          if (start < lineStart || end <= start || end > lineEnd ||
              !isUtf16Boundary(units, start) || !isUtf16Boundary(units, end)) {
            throw new Error('Bidi returned an invalid visual run: ' + start + '..' + end);
          }
          if (level !== levels[start - lineStart]) {
            throw new Error('Bidi visual run level differs from its L1-adjusted line level');
          }
          runs.push({
            start,
            end,
            level,
            direction: level % 2 ? 'rtl' : 'ltr'
          });
        }

        const sourceOrdered = runs.slice().sort((a, b) => a.start - b.start);
        let next = lineStart;
        for (const run of sourceOrdered) {
          if (run.start !== next) {
            throw new Error('Bidi visual runs contain a source gap or overlap at ' + next);
          }
          next = run.end;
        }
        if (next !== lineEnd) throw new Error('Bidi visual runs do not cover the full line');
        return { lineStart, lineEnd, levels, visualRuns: runs };
      });
    }

    function logicalRunsForParagraph(paragraph, levels, units) {
      const runs = [];
      let index = paragraph.start;
      while (index < paragraph.end) {
        const level = levels[index];
        let end = index + 1;
        while (end < paragraph.end && levels[end] === level) end++;
        if (!isUtf16Boundary(units, index) || !isUtf16Boundary(units, end)) {
          throw new Error('Logical bidi run boundary splits a surrogate pair');
        }
        runs.push({
          start: index,
          end,
          level,
          direction: level % 2 ? 'rtl' : 'ltr'
        });
        index = end;
      }
      return runs;
    }

    function pickLineSplit(text, start, end, boundaries) {
      const middle = (start + end) / 2;
      const candidates = boundaries.filter((offset) => offset > start && offset < end);
      if (!candidates.length) return null;
      const whitespaceCandidates = candidates.filter((offset) => /\s/u.test(text.slice(offset - 1, offset)));
      const choices = whitespaceCandidates.length ? whitespaceCandidates : candidates;
      choices.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
      return choices[0];
    }

    function analyzeFixtures(fixtures) {
      if (!Array.isArray(fixtures)) throw new TypeError('Bidi fixture list must be an array');
      return {
        unicodeVersion: unicodeVersion.join('.'),
        fixtureCount: fixtures.length,
        fixtures: fixtures.map((fixture) => {
          const text = String(fixture.text);
          const baseDirection = fixture.baseDirection || 'auto';
          const units = toUtf16Units(text);
          const resolved = resolve(text, baseDirection);
          const boundaries = codePointBoundaries(text);
          const paragraphResults = resolved.paragraphs.map((paragraph, paragraphIndex) => {
            const logicalRuns = logicalRunsForParagraph(paragraph, resolved.levels, units);
            const lines = [];
            if (paragraph.end > paragraph.start) {
              const whole = lineVisualRuns(text, baseDirection, paragraph.start, paragraph.end);
              lines.push({ kind: 'whole-paragraph', ...whole });
              const split = pickLineSplit(text, paragraph.start, paragraph.end, boundaries);
              if (split !== null) {
                lines.push({
                  kind: 'line-wrap-probe-first',
                  ...lineVisualRuns(text, baseDirection, paragraph.start, split)
                });
                lines.push({
                  kind: 'line-wrap-probe-second',
                  ...lineVisualRuns(text, baseDirection, split, paragraph.end)
                });
              }
            }
            return {
              index: paragraphIndex,
              start: paragraph.start,
              end: paragraph.end,
              baseLevel: paragraph.level,
              logicalRuns,
              lines
            };
          });
          return {
            id: fixture.id,
            baseDirection,
            text,
            utf16Length: units.length,
            levels: resolved.levels,
            paragraphs: paragraphResults
          };
        })
      };
    }

    return {
      unicodeVersion: unicodeVersion.join('.'),
      resolve,
      lineVisualRuns,
      analyzeFixtures
    };
  }

  async function instantiate(bytes) {
    const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const result = await WebAssembly.instantiate(source, {});
    return createRuntime(result.instance.exports);
  }

  return { BASE_DIRECTION, createRuntime, instantiate, toUtf16Units, isUtf16Boundary };
});
