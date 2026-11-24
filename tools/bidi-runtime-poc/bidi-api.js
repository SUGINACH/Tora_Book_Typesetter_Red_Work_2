(function expose(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RedBidiRuntime = api;
})(typeof self !== 'undefined' ? self : globalThis, function createModule() {
  'use strict';

  const BASE_DIRECTION = Object.freeze({ ltr: 0, rtl: 1, auto: 2 });
  const NEUTRAL_SCRIPTS = new Set(['Zyyy', 'Zinh', 'Zzzz', 'Zxxx']);

  function directionCode(direction) {
    if (!Object.prototype.hasOwnProperty.call(BASE_DIRECTION, direction)) {
      throw new Error('Unknown paragraph base direction: ' + direction);
    }
    return BASE_DIRECTION[direction];
  }

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
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      if (unit >= 0xD800 && unit <= 0xDBFF) {
        const next = units[i + 1];
        if (next === undefined || next < 0xDC00 || next > 0xDFFF) {
          throw new TypeError('Ill-formed UTF-16: unpaired high surrogate at code-unit offset ' + i);
        }
        i++;
      } else if (unit >= 0xDC00 && unit <= 0xDFFF) {
        throw new TypeError('Ill-formed UTF-16: unpaired low surrogate at code-unit offset ' + i);
      }
    }
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
    const graphemeScriptMapRaw = requireFunction(exports, 'bidi_grapheme_script_map');
    const itemizerUnicodeVersion = [
      requireFunction(exports, 'bidi_itemizer_unicode_version_major')(),
      requireFunction(exports, 'bidi_itemizer_unicode_version_minor')(),
      requireFunction(exports, 'bidi_itemizer_unicode_version_patch')()
    ];
    if (itemizerUnicodeVersion[0] !== 18 || itemizerUnicodeVersion[1] !== 0 ||
        itemizerUnicodeVersion[2] !== 0) {
      throw new Error('Grapheme/script data version must be Unicode 18.0.0; got ' +
        itemizerUnicodeVersion.join('.'));
    }
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
      try {
        return Array.from(new Uint32Array(memory.buffer, pointer, outputLength));
      } finally {
        freeOutput(pointer, outputLength);
      }
    }

    function resolve(text, baseDirection = 'auto') {
      const base = directionCode(baseDirection);
      text = String(text);
      if (text.length === 0) {
        return { text, utf16Length: 0, levels: [], paragraphs: [] };
      }

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
      const base = directionCode(baseDirection);
      text = String(text);
      if (!Number.isSafeInteger(lineStart) || !Number.isSafeInteger(lineEnd) ||
          lineStart < 0 || lineEnd < lineStart || lineEnd > text.length) {
        throw new RangeError('Invalid UTF-16 line range: ' + lineStart + '..' + lineEnd);
      }
      if (text.length === 0) {
        if (lineStart !== 0 || lineEnd !== 0) {
          throw new RangeError('Only the empty UTF-16 range is valid for empty text');
        }
        return { lineStart: 0, lineEnd: 0, levels: [], visualRuns: [] };
      }
      return withInput(text, (pointer, units) => {
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

    function scriptTagOf(value) {
      const tag = String.fromCharCode(
        (value >>> 24) & 0xFF,
        (value >>> 16) & 0xFF,
        (value >>> 8) & 0xFF,
        value & 0xFF
      );
      if (!/^[A-Za-z]{4}$/.test(tag)) {
        throw new Error('WASM returned an invalid ISO 15924 Script tag: ' + value);
      }
      return tag;
    }

    function intersectTags(sets) {
      if (!sets.length) return [];
      let result = new Set(sets[0]);
      for (let i = 1; i < sets.length; i++) {
        const allowed = new Set(sets[i]);
        result = new Set([...result].filter((tag) => allowed.has(tag)));
      }
      return [...result].sort();
    }

    function resolveGraphemeScript(grapheme, scalars) {
      const primary = [...new Set(scalars.map((scalar) => scalar.script)
        .filter((script) => !NEUTRAL_SCRIPTS.has(script)))].sort();
      const extensionSets = scalars
        .map((scalar) => scalar.scriptExtensions.filter((script) => !NEUTRAL_SCRIPTS.has(script)))
        .filter((set) => set.length > 0);
      const candidates = intersectTags(extensionSets);

      if (primary.length === 1) {
        // Script_Extensions may contain additional valid scripts even when
        // Script has one primary value (for example U+096F). Let surrounding
        // context choose a permitted alternative; use the primary only when
        // no contextual resolution is possible.
        if (candidates.length > 1 && candidates.includes(primary[0])) {
          return {
            script: null,
            status: 'script-extension-contextual',
            candidates,
            primaryScripts: primary,
            fallbackScript: primary[0]
          };
        }
        return {
          script: primary[0],
          status: 'strong',
          candidates: candidates.length ? candidates : [primary[0]],
          primaryScripts: primary,
          fallbackScript: null
        };
      }
      if (primary.length > 1) {
        return {
          script: null,
          status: 'mixed-grapheme',
          candidates,
          primaryScripts: primary,
          fallbackScript: null
        };
      }
      if (candidates.length === 1) {
        return {
          script: candidates[0],
          status: 'script-extension-singleton',
          candidates,
          primaryScripts: [],
          fallbackScript: null
        };
      }
      return {
        script: null,
        status: 'unresolved-common-inherited',
        candidates,
        primaryScripts: [],
        fallbackScript: null
      };
    }

    function resolveCommonInherited(graphemes) {
      // Only graphemes with a single, unambiguous primary Script seed the context.
      // Mixed-script graphemes are kept unresolved and do not contaminate neighbors.
      for (let i = 0; i < graphemes.length; i++) {
        const current = graphemes[i];
        if (current.status !== 'unresolved-common-inherited' &&
            current.status !== 'script-extension-contextual') continue;

        let left = null;
        for (let j = i - 1; j >= 0; j--) {
          if (graphemes[j].script) { left = graphemes[j].script; break; }
        }
        let right = null;
        for (let j = i + 1; j < graphemes.length; j++) {
          if (graphemes[j].script) { right = graphemes[j].script; break; }
        }
        const allowed = current.candidates;
        const permits = (tag) => !allowed.length || allowed.includes(tag);
        let chosen = null;
        let status = null;

        if (left && right) {
          if (left === right && permits(left)) {
            chosen = left;
            status = 'context-both-sides';
          } else if (left !== right) {
            const leftAllowed = permits(left);
            const rightAllowed = permits(right);
            // UAX #24 §5.1's simple Common-script heuristic prefers the
            // preceding script. Script_Extensions narrows the choice where
            // the character is limited to a set of scripts.
            if (leftAllowed) {
              chosen = left;
              status = allowed.length ? 'script-extensions-context' : 'context-left-preferred';
            } else if (rightAllowed) {
              chosen = right;
              status = 'script-extensions-context';
            }
          }
        } else {
          const neighbor = left || right;
          if (neighbor && permits(neighbor)) {
            chosen = neighbor;
            status = left ? 'context-left-preferred' : 'context-one-side';
          }
        }

        if (chosen) {
          current.script = chosen;
          current.status = status;
        } else if (current.fallbackScript) {
          current.script = current.fallbackScript;
          current.status = 'primary-script-fallback';
        }
      }
    }

    const PAIRED_PUNCTUATION = Object.freeze({
      '(': ')', '[': ']', '{': '}', '<': '>',
      '«': '»', '‹': '›',
      '〈': '〉', '《': '》', '「': '」', '『': '』',
      '【': '】', '〔': '〕', '〖': '〗', '〘': '〙', '〚': '〛'
    });
    const CLOSING_PUNCTUATION = Object.freeze(
      Object.fromEntries(Object.entries(PAIRED_PUNCTUATION).map(([open, close]) => [close, open]))
    );
    const ALL_PAIRED_PUNCTUATION = new Set([
      ...Object.keys(PAIRED_PUNCTUATION),
      ...Object.values(PAIRED_PUNCTUATION)
    ]);

    function resolvePairedPunctuation(graphemes) {
      const stack = [];
      const pairs = [];
      for (let i = 0; i < graphemes.length; i++) {
        const value = graphemes[i].text;
        if (Object.prototype.hasOwnProperty.call(PAIRED_PUNCTUATION, value)) {
          stack.push({ value, index: i });
          continue;
        }
        const opener = CLOSING_PUNCTUATION[value];
        if (!opener) continue;
        for (let j = stack.length - 1; j >= 0; j--) {
          if (stack[j].value === opener) {
            pairs.push({ open: stack[j].index, close: i });
            stack.splice(j);
            break;
          }
        }
      }

      const contextualStatuses = new Set([
        'context-both-sides', 'script-extensions-context',
        'context-left-preferred', 'context-one-side',
        'paired-enclosing-context'
      ]);
      const nearestScript = (from, to, step) => {
        for (let i = from; i !== to; i += step) {
          const grapheme = graphemes[i];
          if (ALL_PAIRED_PUNCTUATION.has(grapheme.text)) continue;
          if (grapheme.script && !contextualStatuses.has(grapheme.status)) {
            return grapheme.script;
          }
        }
        return null;
      };
      const allowedBy = (grapheme, script) =>
        !grapheme.candidates.length || grapheme.candidates.includes(script) ||
        grapheme.primaryScripts.includes(script) || grapheme.fallbackScript === script;

      for (const pair of pairs) {
        const left = nearestScript(pair.open - 1, -1, -1);
        const right = nearestScript(pair.close + 1, graphemes.length, 1);
        let enclosing = null;
        if (left && right && left === right) enclosing = left;
        else if (left && right) enclosing = left; // outer run: preceding context wins
        else enclosing = left || right;

        // For a standalone pair, the enclosed run is the only available context.
        if (!enclosing) {
          enclosing = nearestScript(pair.open + 1, pair.close, 1);
        }
        if (!enclosing) continue;

        const open = graphemes[pair.open];
        const close = graphemes[pair.close];
        if (!allowedBy(open, enclosing) || !allowedBy(close, enclosing)) continue;

        open.script = enclosing;
        close.script = enclosing;
        open.status = 'paired-enclosing-context';
        close.status = 'paired-enclosing-context';
      }
      return pairs.length;
    }

    function buildScriptRuns(graphemes) {
      const runs = [];
      for (let graphemeIndex = 0; graphemeIndex < graphemes.length; graphemeIndex++) {
        const grapheme = graphemes[graphemeIndex];
        const key = [
          grapheme.script || '?',
          grapheme.direction || '?',
          grapheme.status === 'mixed-grapheme' ? 'mixed' :
            (grapheme.script ? 'resolved' : 'unresolved'),
          grapheme.script ? '' : grapheme.candidates.join(',')
        ].join('|');
        const previous = runs[runs.length - 1];
        if (previous && previous._key === key && previous.end === grapheme.start) {
          previous.end = grapheme.end;
          previous.graphemeEnd++;
          previous.text += grapheme.text;
          continue;
        }
        runs.push({
          start: grapheme.start,
          end: grapheme.end,
          text: grapheme.text,
          script: grapheme.script,
          scriptStatus: grapheme.status,
          scriptCandidates: grapheme.candidates.slice(),
          direction: grapheme.direction || null,
          bidiLevel: grapheme.bidiLevel,
          graphemeStart: graphemeIndex,
          graphemeEnd: graphemeIndex + 1,
          _key: key
        });
      }
      for (const run of runs) delete run._key;
      return runs;
    }

    function itemizeScripts(text, bidiResult = null) {
      text = String(text);
      const units = toUtf16Units(text);
      if (bidiResult && (
        bidiResult.utf16Length !== units.length ||
        !Array.isArray(bidiResult.levels) ||
        bidiResult.levels.length !== units.length
      )) {
        throw new Error('Bidi levels must describe the same UTF-16 source as script itemization');
      }
      if (units.length === 0) {
        return {
          text,
          utf16Length: 0,
          unicodeVersion: itemizerUnicodeVersion.join('.'),
          graphemes: [],
          scriptRuns: [],
          diagnostics: []
        };
      }

      return withInput(text, (pointer) => {
        const outputPointer = graphemeScriptMapRaw(pointer, units.length);
        if (!outputPointer) throw new Error('Unicode 18 grapheme/script itemizer rejected UTF-16 input');

        const header = new Uint32Array(memory.buffer, outputPointer, 4);
        const utf16Length = header[0];
        const graphemeCount = header[1];
        const scalarCount = header[2];
        const extensionCount = header[3];
        if (utf16Length !== units.length || graphemeCount > units.length ||
            scalarCount > units.length || extensionCount > scalarCount * 64) {
          // Do not free with an untrusted/partial length: bidi_free_u32 reconstructs
          // a boxed slice and requires the exact allocation length. A malformed ABI
          // header is fatal; preserving memory safety is preferable to guessing.
          throw new Error('Unicode 18 itemizer returned unsafe output dimensions');
        }
        const outputLength = 4 + graphemeCount * 4 + scalarCount * 5 + extensionCount;
        const values = copyAndFreeOutput(outputPointer, outputLength);
        const graphemeTableStart = 4;
        const scalarTableStart = graphemeTableStart + graphemeCount * 4;
        const extensionTableStart = scalarTableStart + scalarCount * 5;

        const scalars = [];
        let expectedScalarStart = 0;
        let expectedExtensionStart = 0;
        for (let i = 0; i < scalarCount; i++) {
          const offset = scalarTableStart + i * 5;
          const start = values[offset];
          const end = values[offset + 1];
          const script = scriptTagOf(values[offset + 2]);
          const extensionStart = values[offset + 3];
          const extensionLength = values[offset + 4];
          if (start !== expectedScalarStart || end <= start || end > units.length ||
              (end - start !== 1 && end - start !== 2) ||
              !isUtf16Boundary(units, start) || !isUtf16Boundary(units, end) ||
              extensionStart !== expectedExtensionStart ||
              extensionLength > extensionCount - extensionStart) {
            throw new Error('Unicode 18 itemizer returned an invalid scalar range at index ' + i);
          }
          if (end - start === 1 && units[start] >= 0xD800 && units[start] <= 0xDFFF) {
            throw new Error('Unicode 18 itemizer returned an isolated surrogate scalar');
          }
          if (end - start === 2 && !(
            units[start] >= 0xD800 && units[start] <= 0xDBFF &&
            units[start + 1] >= 0xDC00 && units[start + 1] <= 0xDFFF
          )) {
            throw new Error('Unicode 18 itemizer returned a non-scalar surrogate pair');
          }
          const scriptExtensions = [];
          for (let j = 0; j < extensionLength; j++) {
            scriptExtensions.push(scriptTagOf(values[extensionTableStart + extensionStart + j]));
          }
          scalars.push({ start, end, script, scriptExtensions });
          expectedScalarStart = end;
          expectedExtensionStart += extensionLength;
        }
        if (expectedScalarStart !== units.length || expectedExtensionStart !== extensionCount) {
          throw new Error('Unicode 18 scalar/property tables do not cover their full source');
        }

        const graphemes = [];
        let expectedStart = 0;
        let expectedScalarIndex = 0;
        for (let i = 0; i < graphemeCount; i++) {
          const offset = graphemeTableStart + i * 4;
          const start = values[offset];
          const end = values[offset + 1];
          const scalarStart = values[offset + 2];
          const scalarEnd = values[offset + 3];
          if (start !== expectedStart || end <= start || end > units.length ||
              !isUtf16Boundary(units, start) || !isUtf16Boundary(units, end) ||
              scalarStart !== expectedScalarIndex || scalarEnd <= scalarStart ||
              scalarEnd > scalarCount || scalars[scalarStart].start !== start ||
              scalars[scalarEnd - 1].end !== end) {
            throw new Error('Unicode 18 itemizer returned an invalid grapheme range at index ' + i);
          }
          const clusterScalars = scalars.slice(scalarStart, scalarEnd);
          const scriptInfo = resolveGraphemeScript(null, clusterScalars);
          const cluster = {
            start,
            end,
            text: text.slice(start, end),
            scalarStart,
            scalarEnd,
            scalars: clusterScalars,
            script: scriptInfo.script,
            status: scriptInfo.status,
            candidates: scriptInfo.candidates,
            primaryScripts: scriptInfo.primaryScripts,
            bidiLevel: null,
            direction: null
          };
          if (bidiResult) {
            const clusterLevels = [...new Set(bidiResult.levels.slice(start, end))];
            if (clusterLevels.length === 1) {
              cluster.bidiLevel = clusterLevels[0];
              cluster.direction = cluster.bidiLevel % 2 ? 'rtl' : 'ltr';
            } else {
              cluster.status = cluster.status === 'mixed-grapheme'
                ? cluster.status : 'bidi-level-conflict';
            }
          }
          graphemes.push(cluster);
          expectedStart = end;
          expectedScalarIndex = scalarEnd;
        }
        if (expectedStart !== units.length || expectedScalarIndex !== scalarCount) {
          throw new Error('Unicode 18 grapheme table does not cover its full source');
        }

        resolveCommonInherited(graphemes);
        const pairedPunctuationPairCount = resolvePairedPunctuation(graphemes);
        const diagnostics = [];
        for (const grapheme of graphemes) {
          if (grapheme.status === 'mixed-grapheme') {
            diagnostics.push({
              code: 'mixed-script-grapheme',
              start: grapheme.start,
              end: grapheme.end,
              scripts: grapheme.primaryScripts
            });
          } else if (grapheme.status === 'bidi-level-conflict') {
            diagnostics.push({
              code: 'grapheme-bidi-level-conflict',
              start: grapheme.start,
              end: grapheme.end
            });
          } else if (!grapheme.script) {
            diagnostics.push({
              code: 'script-context-unresolved',
              start: grapheme.start,
              end: grapheme.end,
              candidates: grapheme.candidates
            });
          }
        }

        return {
          text,
          utf16Length: units.length,
          unicodeVersion: itemizerUnicodeVersion.join('.'),
          graphemes,
          scriptRuns: buildScriptRuns(graphemes),
          pairedPunctuationPairCount,
          diagnostics
        };
      });
    }

    function validateFontBoundaries(text, fontRanges) {
      text = String(text);
      if (!Array.isArray(fontRanges)) throw new TypeError('Font ranges must be an array');
      const itemization = itemizeScripts(text);
      const boundaries = new Set([0, itemization.utf16Length]);
      for (const grapheme of itemization.graphemes) {
        boundaries.add(grapheme.start);
        boundaries.add(grapheme.end);
      }
      const diagnostics = [];
      for (let i = 0; i < fontRanges.length; i++) {
        const range = fontRanges[i];
        if (!range || !Number.isSafeInteger(range.start) ||
            !Number.isSafeInteger(range.end) || range.start < 0 ||
            range.end < range.start || range.end > itemization.utf16Length) {
          diagnostics.push({
            code: 'invalid-font-range',
            index: i,
            range: range || null
          });
          continue;
        }
        for (const edge of ['start', 'end']) {
          const offset = range[edge];
          if (!boundaries.has(offset)) {
            const grapheme = itemization.graphemes.find((item) =>
              offset > item.start && offset < item.end);
            diagnostics.push({
              code: 'font-boundary-splits-grapheme',
              index: i,
              edge,
              offset,
              grapheme: grapheme ? { start: grapheme.start, end: grapheme.end, text: grapheme.text } : null
            });
          }
        }
      }
      return {
        ok: diagnostics.length === 0,
        diagnostics,
        graphemeCount: itemization.graphemes.length
      };
    }

    function validateGraphemeFixtures(data) {
      if (!data || data.unicodeVersion !== '18.0.0' || !Array.isArray(data.fixtures) ||
          !Number.isSafeInteger(data.testCount) || data.testCount !== data.fixtures.length ||
          !data.sourceCommit || !data.sourcePath) {
        throw new TypeError('Grapheme fixtures must be a versioned Unicode 18.0.0 conformance dataset');
      }
      const failures = [];
      let checkedBoundaries = 0;
      let passedCases = 0;
      for (const fixture of data.fixtures) {
        const text = String(fixture.text);
        const expected = fixture.expectedBoundaries;
        if (!Array.isArray(expected) || !expected.length ||
            expected.some((value) => !Number.isSafeInteger(value) || value < 0 || value > text.length) ||
            expected[0] !== 0 || expected[expected.length - 1] !== text.length ||
            expected.some((value, index) => index > 0 && value <= expected[index - 1])) {
          throw new Error('Malformed expected GraphemeBreakTest boundaries for ' + String(fixture.id));
        }
        const itemization = itemizeScripts(text);
        const actual = [0, ...itemization.graphemes.map((grapheme) => grapheme.end)];
        checkedBoundaries += expected.length;
        const matches = actual.length === expected.length &&
          actual.every((value, index) => value === expected[index]);
        if (matches) {
          passedCases++;
        } else if (failures.length < 25) {
          failures.push({
            id: fixture.id,
            sourceLine: fixture.sourceLine,
            expected,
            actual
          });
        }
      }
      return {
        unicodeVersion: data.unicodeVersion,
        sourceRepository: data.sourceRepository,
        sourceCommit: data.sourceCommit,
        sourcePath: data.sourcePath,
        testCount: data.fixtures.length,
        passedCases,
        failedCases: data.fixtures.length - passedCases,
        checkedBoundaries,
        failureExamples: failures
      };
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
          const itemization = itemizeScripts(text, resolved);
          return {
            id: fixture.id,
            baseDirection,
            text,
            utf16Length: units.length,
            levels: resolved.levels,
            itemization,
            paragraphs: paragraphResults
          };
        })
      };
    }

    return {
      unicodeVersion: unicodeVersion.join('.'),
      resolve,
      lineVisualRuns,
      itemizeScripts,
      validateFontBoundaries,
      validateGraphemeFixtures,
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
