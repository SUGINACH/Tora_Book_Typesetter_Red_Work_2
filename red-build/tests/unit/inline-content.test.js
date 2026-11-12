// S14 P0 — canonical TextRun/ImageRun parsing and parser integration.
'use strict';

const assert = require('node:assert/strict');
const { parseInlineRuns } = require('../../src/engine/parser/inline-content');
const { tokenize } = require('../../src/engine/parser/block-tokenizer');
const { tokenizeDoc: tokenizeLegacyDoc } = require('../../src/engine/layout/legacy-imud-flow');

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log('✓ ' + name);
}

function textOf(result) {
  return result.runs.filter(run => run.kind === 'text').map(run => run.text).join('');
}

test('plain text is represented as a lossless TextRun', () => {
  const result = parseInlineRuns('שלום עולם');
  assert.equal(result.runs.length, 1);
  assert.equal(result.runs[0].kind, 'text');
  assert.equal(result.runs[0].text, 'שלום עולם');
  assert.equal(result.runs[0].fontFamily, null);
  assert.equal(result.text, 'שלום עולם');
  assert.deepEqual(result.warnings, []);
});

test('relative PNG/JPG images become ImageRun with optional suffix overrides', () => {
  const result = parseInlineRuns('לפני #assets/photo.jpg# באמצע #chapter/img.png.r60# אחרי');
  const images = result.runs.filter(run => run.kind === 'image');
  assert.equal(images.length, 2);
  assert.equal(images[0].resourcePath, 'assets/photo.jpg');
  assert.equal(images[0].align, null);
  assert.equal(images[0].widthPct, null);
  assert.equal(images[1].resourcePath, 'chapter/img.png');
  assert.equal(images[1].align, 'right');
  assert.equal(images[1].widthPct, 60);
  assert.equal(textOf(result), 'לפני  באמצע  אחרי');
  assert.equal(result.hasImages, true);
});

test('unsupported image formats and unsafe paths stay visible as text with warnings', () => {
  const unsupported = parseInlineRuns('לפני #assets/photo.gif# אחרי');
  assert.equal(textOf(unsupported), 'לפני #assets/photo.gif# אחרי');
  assert(unsupported.warnings.some(w => w.code === 'unsupported-image-format'));

  const traversal = parseInlineRuns('לפני #../private/photo.jpg# אחרי');
  assert.equal(textOf(traversal), 'לפני #../private/photo.jpg# אחרי');
  assert(traversal.warnings.some(w => w.code === 'invalid-image-path-or-size'));

  const absolute = parseInlineRuns('לפני #/private/photo.jpg# אחרי');
  assert.equal(textOf(absolute), 'לפני #/private/photo.jpg# אחרי');
  assert(absolute.warnings.some(w => w.code === 'invalid-image-path-or-size'));
});

test('generic font tags support nesting and restore the enclosing family', () => {
  const result = parseInlineRuns(
    'א <Guttman Rashi>ב <Frank Ruhl Libre>ג</> ד</> ה',
    { availableFamilies: ['Guttman Rashi', 'Frank Ruhl Libre'] }
  );
  assert.equal(textOf(result), 'א ב ג ד ה');
  const styled = result.runs.filter(run => run.kind === 'text' && run.fontFamily);
  assert.deepEqual(styled.map(run => [run.text, run.fontFamily]), [
    ['ב ', 'Guttman Rashi'],
    ['ג', 'Frank Ruhl Libre'],
    [' ד', 'Guttman Rashi']
  ]);
});

test('configured marker pairs and symmetric toggle markers produce the same TextRun contract', () => {
  const paired = parseInlineRuns('א [[open]]ב[[close]] ג', {
    availableFamilies: ['Guttman Rashi'],
    fontMarkers: [{ id: 'emphasis', open: '[[open]]', close: '[[close]]', family: 'Guttman Rashi' }]
  });
  assert.equal(textOf(paired), 'א ב ג');
  assert.deepEqual(paired.runs.filter(run => run.fontFamily).map(run => [run.text, run.fontFamily]), [
    ['ב', 'Guttman Rashi']
  ]);

  const symmetric = parseInlineRuns('א §ב§ ג', {
    availableFamilies: ['Guttman Rashi'],
    fontMarkers: [{ id: 'emphasis', open: '§', close: '§', family: 'Guttman Rashi' }]
  });
  assert.equal(textOf(symmetric), 'א ב ג');
  assert.deepEqual(symmetric.runs.filter(run => run.fontFamily).map(run => run.text), ['ב']);
});

test('run source offsets remain absolute when an image follows a footnote', () => {
  const source = 'לפני [הערה] ואחר כך #assets/after.jpg#';
  const [paragraph] = tokenize([source]);
  const image = paragraph.inlineContent.parts
    .filter(part => part.kind === 'text')
    .flatMap(part => part.runs)
    .find(run => run.kind === 'image');
  assert(image, 'ImageRun appears after the note reference');
  assert.equal(image.sourceStart, source.indexOf('#assets/after.jpg#'));
  assert.equal(image.sourceEnd, source.indexOf('#assets/after.jpg#') + '#assets/after.jpg#'.length);
});

test('crossing font ranges are rejected as a group rather than styling ambiguous content', () => {
  const result = parseInlineRuns('א [[A]]ב [[B]]ג [[/A]]ד [[/B]] ה', {
    availableFamilies: ['Family A', 'Family B'],
    fontMarkers: [
      { id: 'a', open: '[[A]]', close: '[[/A]]', family: 'Family A' },
      { id: 'b', open: '[[B]]', close: '[[/B]]', family: 'Family B' }
    ]
  });
  assert.equal(textOf(result).replace(/\s+/g, ' ').trim(), 'א ב ג ד ה');
  assert.equal(result.runs.some(run => run.fontFamily), false);
  assert(result.warnings.some(w => w.code === 'crossing-font-range'));
});

test('legacy parser emits the same inline paragraph contract including footnote images', () => {
  const [paragraph] = tokenizeLegacyDoc(
    'גוף <Guttman Rashi>מילה</> [הערה #notes/note.jpg#] סוף',
    { fnOpen: '[', fnClose: ']', endPrefix: '' },
    { availableFamilies: ['Guttman Rashi'] }
  ).tokens.filter(token => token.type === 'p');
  assert(paragraph.inlineContent);
  assert(paragraph.inlineContent.parts.some(part =>
    part.kind === 'text' && part.runs.some(run => run.fontFamily === 'Guttman Rashi')
  ));
  assert(paragraph.inlineContent.notes.some(note =>
    note.runs.some(run => run.kind === 'image' && run.resourcePath === 'notes/note.jpg')
  ));
});

test('malformed font markers are removed, preserve plain text, and report warnings', () => {
  const unclosed = parseInlineRuns('א <Guttman Rashi>ב', {
    availableFamilies: ['Guttman Rashi']
  });
  assert.equal(textOf(unclosed), 'א ב');
  assert(unclosed.warnings.some(w => w.code === 'unclosed-font-range'));
  assert.equal(unclosed.runs.some(run => run.fontFamily), false);

  const unmatched = parseInlineRuns('א </> ב');
  assert.equal(textOf(unmatched), 'א  ב');
  assert(unmatched.warnings.some(w => w.code === 'unmatched-font-close'));
});

test('unloaded font family does not apply; its content remains plain and visible', () => {
  const result = parseInlineRuns('א <Unloaded Family>ב</> ג', {
    availableFamilies: []
  });
  assert.equal(textOf(result), 'א ב ג');
  assert.equal(result.runs.some(run => run.fontFamily), false);
  assert(result.warnings.some(w => w.code === 'font-family-unavailable'));
});

test('canonical tokenizer stores image/font runs separately for paragraph text and footnotes', () => {
  const [paragraph] = tokenize(['גוף <Guttman Rashi>מילה</> [הערה #notes/note.jpg#] סוף'], {
    inlineOptions: { availableFamilies: ['Guttman Rashi'] }
  });
  assert.equal(paragraph.type, 'paragraph');
  assert(paragraph.inlineContent);
  assert(paragraph.inlineContent.parts.some(part =>
    part.kind === 'text' && part.runs.some(run => run.fontFamily === 'Guttman Rashi')
  ));
  assert(paragraph.inlineContent.notes[0].runs.some(run =>
    run.kind === 'image' && run.resourcePath === 'notes/note.jpg'
  ));
});

test('images are not parsed in endnotes and inline tags are not parsed in headings', () => {
  const tokens = tokenize([
    'הערת סיום - טקסט #notes/no-image.jpg#',
    'כותרת 2 - <Guttman Rashi>כותרת</>'
  ], { inlineOptions: { availableFamilies: ['Guttman Rashi'] } });
  const endnote = tokens.find(token => token.type === 'endnote');
  const heading = tokens.find(token => token.type === 'heading');
  assert(endnote.inlineContent);
  assert.equal(endnote.inlineContent.runs.some(run => run.kind === 'image'), false);
  assert.equal(endnote.inlineContent.text, 'טקסט #notes/no-image.jpg#');
  assert.equal(heading.inlineContent, undefined);
});

console.log('inline-content: ' + passed + ' tests passed');
