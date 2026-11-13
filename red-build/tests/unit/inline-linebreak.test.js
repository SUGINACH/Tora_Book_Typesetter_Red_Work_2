// Shared Knuth–Plass solver for legacy words and generic measured inline atoms.
'use strict';

const assert = require('node:assert/strict');
const { breakLines, breakInlineItems } = require('../../src/engine/typography/kp-linebreak');
const { composeLineFragments } = require('../../src/engine/layout/line-fragments');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

const measure = text => String(text).length * 10;

test('the generic item adapter produces the same word breaks as the legacy adapter', () => {
  const words = ['אבגד', 'הוזח', 'טיכל', 'מנסע'];
  const legacy = breakLines(words, 95, measure, 18);
  const genericItems = [];
  words.forEach((text, index) => {
    if (index) genericItems.push({ kind: 'glue', widthPx: 10, stretchPx: 6, shrinkPx: 5 });
    genericItems.push({ kind: 'text', text, widthPx: measure(text), heightPx: 18 });
  });
  const generic = breakInlineItems(genericItems, 95, 18);
  assert.equal(generic.ok, true);
  assert.deepEqual(generic.lines.map(line => line.words), legacy.map(line => line.words));
  assert.deepEqual(generic.lines.map(line => line.widthPx), legacy.map(line => line.widthPx));
});

test('mixed text and image atoms remain intact and determine the line height', () => {
  const result = breakInlineItems([
    { kind: 'text', text: 'מילה', widthPx: 24, heightPx: 16, sourceStart: 0, sourceEnd: 4 },
    { kind: 'glue', widthPx: 5, stretchPx: 3, shrinkPx: 2 },
    { kind: 'image', resourcePath: 'assets/illustration.png', widthPx: 30, heightPx: 42, sourceStart: 5, sourceEnd: 30 },
    { kind: 'glue', widthPx: 5, stretchPx: 3, shrinkPx: 2 },
    { kind: 'text', text: 'המשך', widthPx: 25, heightPx: 16, sourceStart: 31, sourceEnd: 35 }
  ], 60, 18);
  assert.equal(result.ok, true);
  const fragments = result.lines.flatMap(line => line.fragments);
  assert.equal(fragments.filter(item => item.kind === 'image').length, 1);
  assert.deepEqual(fragments.map(item => item.kind), ['text', 'image', 'text']);
  assert.equal(result.lines.length, 2);
  assert.equal(Math.max(...result.lines.map(line => line.heightPx)), 42);
  assert.deepEqual(fragments.find(item => item.kind === 'image').resourcePath, 'assets/illustration.png');
});

test('an inline anchor is retained as a zero-width atom without splitting or losing it', () => {
  const result = breakInlineItems([
    { kind: 'anchor', id: 'footnote:12', widthPx: 0, heightPx: 0, sourceStart: 3, sourceEnd: 3 },
    { kind: 'glue', widthPx: 0, stretchPx: 0, shrinkPx: 0 },
    { kind: 'text', text: 'שלום', widthPx: 40, heightPx: 18, sourceStart: 3, sourceEnd: 7 }
  ], 80, 18);
  assert.equal(result.ok, true);
  const fragments = result.lines.flatMap(line => line.fragments);
  assert.deepEqual(fragments.map(item => item.kind), ['anchor', 'text']);
  assert.equal(fragments[0].id, 'footnote:12');
  assert.equal(fragments[0].sourceStart, 3);
});

test('a variable width provider is evaluated by line index in the shared solver', () => {
  const widths = [];
  const items = [];
  for (let i = 0; i < 4; i++) {
    if (i) items.push({ kind: 'glue', widthPx: 5, stretchPx: 3, shrinkPx: 2 });
    items.push({ kind: 'text', text: 'w' + i, widthPx: 20, heightPx: 16 });
  }
  const result = breakInlineItems(items, lineIndex => {
    widths.push(lineIndex);
    return lineIndex === 0 ? 35 : 100;
  }, 18);
  assert.equal(result.ok, true);
  assert.equal(result.lines.length, 2);
  assert.deepEqual(result.lines[0].words, ['w0']);
  assert.deepEqual(result.lines[1].words, ['w1', 'w2', 'w3']);
  assert.deepEqual([...new Set(widths)].sort(), [0, 1]);
});

test('an atom wider than the available line is rejected explicitly, never dropped', () => {
  const result = breakInlineItems([
    { kind: 'text', text: 'א', widthPx: 20, heightPx: 16 },
    { kind: 'glue', widthPx: 4 },
    { kind: 'image', resourcePath: 'assets/wide.png', widthPx: 120, heightPx: 80 }
  ], 100, 18);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no-valid-line-break');
  assert.equal(result.maxAtomWidthPx, 120);
  assert.deepEqual(result.lines, []);
});

test('mixed line fragments can be positioned by the shared RTL geometry composer', () => {
  const result = breakInlineItems([
    { kind: 'text', text: 'א', widthPx: 12, heightPx: 16 },
    { kind: 'glue', widthPx: 4 },
    { kind: 'image', resourcePath: 'assets/a.png', widthPx: 18, heightPx: 24 }
  ], 60, 18);
  assert.equal(result.ok, true);
  const positioned = composeLineFragments(result.lines[0].fragments, {
    x: 10, y: 30, widthPx: 60, heightPx: result.lines[0].heightPx, direction: 'rtl', align: 'right'
  });
  assert.equal(positioned.ok, true);
  assert.deepEqual(positioned.fragments.map(item => item.kind), ['text', 'image']);
  assert.equal(positioned.fragments[1].x, 10 + 60 - 18);
});

test('generic item validation rejects implicit whitespace and malformed atoms', () => {
  assert.throws(() => breakInlineItems([{ kind: 'text', text: 'שלום עולם', widthPx: 40 }], 80, 18), /single break units/);
  assert.throws(() => breakInlineItems([{ kind: 'image', widthPx: 20, heightPx: 10 }], 80, 18), /resourcePath/);
  assert.throws(() => breakInlineItems([{ kind: 'anchor', widthPx: 0 }], 80, 18), /stable id/);
  assert.throws(() => breakInlineItems([{ kind: 'widget', widthPx: 10 }], 80, 18), /unsupported inline item kind/);
});

console.log('inline-linebreak: ' + passed + ' tests passed');
