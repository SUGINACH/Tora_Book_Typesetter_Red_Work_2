// S14 P0 — shared mixed-item line geometry contract.
'use strict';

const assert = require('node:assert/strict');
const {
  normalizeInlineItems,
  availableIntervalsAtY,
  composeLineFragments
} = require('../../src/engine/layout/line-fragments');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

test('normalization preserves text, image, anchor identity and source ranges', () => {
  const items = normalizeInlineItems([
    { kind: 'text', text: 'שלום', widthPx: 24, heightPx: 16, sourceStart: 0, sourceEnd: 4, fontFamily: 'Frank Ruhl Libre' },
    { kind: 'image', resourcePath: 'assets/photo.jpg', widthPx: 32, heightPx: 20, sourceStart: 5, sourceEnd: 24 },
    { kind: 'anchor', id: 'fn-1', widthPx: 0, heightPx: 0 }
  ]);
  assert.deepEqual(items.map(x => x.kind), ['text', 'image', 'anchor']);
  assert.equal(items[0].fontFamily, 'Frank Ruhl Libre');
  assert.equal(items[1].resourcePath, 'assets/photo.jpg');
  assert.equal(items[2].id, 'fn-1');
  assert.deepEqual([items[0].sourceStart, items[0].sourceEnd], [0, 4]);
});

test('normalization rejects unknown items, invalid geometry and incomplete source ranges', () => {
  assert.throws(() => normalizeInlineItems([{ kind: 'widget', widthPx: 1 }]), /unsupported item kind/);
  assert.throws(() => normalizeInlineItems([{ kind: 'text', text: 'x', widthPx: -1 }]), /non-negative/);
  assert.throws(() => normalizeInlineItems([{ kind: 'text', text: 'x', widthPx: 1, sourceStart: 2 }]), /source range/);
  assert.throws(() => normalizeInlineItems([{ kind: 'image', widthPx: 1, heightPx: 1 }]), /resourcePath/);
  assert.throws(() => normalizeInlineItems([{ kind: 'anchor', widthPx: 0 }]), /stable id/);
});

test('available intervals subtract overlapping image exclusions deterministically', () => {
  const intervals = availableIntervalsAtY(
    { x: 10, y: 0, width: 100, height: 100 },
    [
      { x: 30, y: 10, width: 30, height: 30 },
      { x: 50, y: 15, width: 30, height: 20 },
      { x: 70, y: 60, width: 20, height: 20 }
    ],
    20,
    12
  );
  assert.deepEqual(intervals, [
    { x: 10, width: 20 },
    { x: 80, width: 30 }
  ]);
});

test('a line outside every exclusion retains the full content interval', () => {
  assert.deepEqual(
    availableIntervalsAtY(
      { x: 5, y: 0, width: 90, height: 100 },
      [{ x: 20, y: 0, width: 30, height: 10 }],
      20,
      12
    ),
    [{ x: 5, width: 90 }]
  );
});

test('RTL composition preserves logical order and anchors the line to the right edge', () => {
  const result = composeLineFragments([
    { kind: 'text', text: 'א', widthPx: 10, heightPx: 14, sourceStart: 0, sourceEnd: 1 },
    { kind: 'image', resourcePath: 'assets/a.png', widthPx: 20, heightPx: 24 }
  ], { x: 10, y: 40, widthPx: 100, heightPx: 18, direction: 'rtl', align: 'right' });
  assert.equal(result.ok, true);
  assert.deepEqual(result.fragments.map(f => f.x), [100, 80]);
  assert.deepEqual(result.fragments.map(f => f.kind), ['text', 'image']);
  assert.equal(result.fragments[1].heightPx, 24);
  assert.equal(result.usedWidthPx, 30);
});

test('RTL left and center alignment place the complete logical sequence correctly', () => {
  const items = [
    { kind: 'text', text: 'א', widthPx: 10 },
    { kind: 'text', text: 'ב', widthPx: 20 }
  ];
  const left = composeLineFragments(items, { x: 10, y: 0, widthPx: 100, direction: 'rtl', align: 'left' });
  const center = composeLineFragments(items, { x: 10, y: 0, widthPx: 100, direction: 'rtl', align: 'center' });
  assert.deepEqual(left.fragments.map(f => f.x), [30, 10]);
  assert.deepEqual(center.fragments.map(f => f.x), [65, 45]);
});

test('LTR composition and center alignment are symmetric', () => {
  const items = [
    { kind: 'text', text: 'a', widthPx: 10 },
    { kind: 'image', resourcePath: 'assets/b.png', widthPx: 20, heightPx: 12 }
  ];
  const left = composeLineFragments(items, { x: 10, y: 0, widthPx: 100, direction: 'ltr', align: 'left' });
  const center = composeLineFragments(items, { x: 10, y: 0, widthPx: 100, direction: 'ltr', align: 'center' });
  assert.deepEqual(left.fragments.map(f => f.x), [10, 20]);
  assert.deepEqual(center.fragments.map(f => f.x), [45, 55]);
});

test('overwide line is rejected explicitly and no item is silently dropped', () => {
  const result = composeLineFragments([
    { kind: 'text', text: 'א', widthPx: 60 },
    { kind: 'image', resourcePath: 'assets/b.png', widthPx: 50 }
  ], { x: 0, y: 0, widthPx: 100 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'line-overflow');
  assert.equal(result.requiredWidthPx, 110);
  assert.deepEqual(result.fragments, []);
});

console.log('line-fragments: ' + passed + ' tests passed');
