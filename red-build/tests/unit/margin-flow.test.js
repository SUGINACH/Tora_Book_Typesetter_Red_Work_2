// Page-level allocation of anchored margin items across both columns.
'use strict';

const assert = require('node:assert/strict');
const { packMarginNotes } = require('../../src/engine/layout/margin-flow');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

const note = (side, anchorY, ys, label) => ({
  side, anchorY, label, lines: ys.map((y, i) => ({ text: label + i, y }))
});

test('notes sharing a physical margin are packed without overlap and keep order', () => {
  const input = [
    note('right', 100, [100, 109.6], 'A'),
    note('right', 110, [110], 'B')
  ];
  const result = packMarginNotes(input, { top: 80, bottom: 200, pitch: 9.6, gap: 1 });
  const [a, b] = result.notes;
  assert.equal(a.anchorY, 100);
  assert.ok(b.anchorY >= a.lines.at(-1).y + 9.6 + 1 - 1e-7);
  assert.equal(b.anchorY, 120.2);
  assert.deepEqual(input[1].lines.map(x => x.y), [110], 'input remains immutable');
  assert.deepEqual(result.diagnostics, []);
});

test('opposite physical margins are independent lanes', () => {
  const result = packMarginNotes([
    note('right', 100, [100], 'R'),
    note('left', 100, [100], 'L')
  ], { top: 80, bottom: 200, pitch: 9.6, gap: 1 });
  assert.deepEqual(result.notes.map(x => x.anchorY), [100, 100]);
  assert.deepEqual(result.diagnostics, []);
});

test('when the bottom edge is reached, the ordered group moves upward minimally', () => {
  const result = packMarginNotes([
    note('left', 130, [130, 139.6], 'A'),
    note('left', 145, [145], 'B')
  ], { top: 100, bottom: 150, pitch: 9.6, gap: 1 });
  const [a, b] = result.notes;
  assert.equal(a.anchorY, 120.2);
  assert.equal(b.anchorY, 140.4);
  assert.ok(a.anchorY >= 100);
  assert.ok(b.lines[0].y + 9.6 <= 150 + 1e-7);
  assert.deepEqual(result.diagnostics, []);
});

test('an impossible lane capacity is reported without dropping or overlapping content', () => {
  const result = packMarginNotes([
    note('right', 0, [0], 'A'),
    note('right', 0, [0], 'B'),
    note('right', 0, [0], 'C')
  ], { top: 0, bottom: 20, pitch: 9.6, gap: 1 });
  assert.equal(result.notes.length, 3);
  assert.equal(result.diagnostics[0].code, 'MARGIN_NOTES_EXCEED_LANE');
  assert.ok(result.notes[1].anchorY >= result.notes[0].anchorY + 10.6 - 1e-7);
  assert.ok(result.notes[2].anchorY >= result.notes[1].anchorY + 10.6 - 1e-7);
});

test('invalid margin side and invalid line geometry are surfaced diagnostically', () => {
  const result = packMarginNotes([
    { side: 'center', anchorY: 5, lines: [{ text: 'x', y: 5 }] },
    { side: 'left', anchorY: 5, lines: [{ text: 'bad', y: NaN }] }
  ], { top: 0, bottom: 20, pitch: 9.6 });
  assert.deepEqual(result.diagnostics.map(x => x.code), [
    'MARGIN_NOTE_INVALID_SIDE',
    'MARGIN_NOTE_INVALID_GEOMETRY'
  ]);
});

console.log('margin-flow: ' + passed + ' tests passed');
