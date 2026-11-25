// tests/unit/test-doc-generator.test.js — D-98 structural validity gate
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const {
  generateTestDocument,
  validateTestDocumentStructure
} = require('../../src/ui/test-doc-generator');

describe('D-98 test-document structural validator', () => {
  it('allows a valid nested heading hierarchy when the deepest heading has body text', () => {
    const result = validateTestDocumentStructure([
      'כותרת 2 - פרק',
      'כותרת 3 - נושא',
      'כותרת 5 - סעיף',
      'טקסט גוף ממשי.',
      'כותרת 2 - פרק נוסף',
      'טקסט נוסף.'
    ].join('\n'));
    assert(result.valid, JSON.stringify(result.errors));
    assertEq(result.errors, []);
  });

  it('rejects consecutive headings of the same level without body text', () => {
    const result = validateTestDocumentStructure([
      'כותרת 4 - סעיף ראשון',
      'כותרת 4 - סעיף שני',
      'טקסט גוף.'
    ].join('\n'));
    assert(!result.valid, 'same-level headings must not be adjacent without body');
    assert(result.errors.some((error) => error.code === 'same-level-headings-without-body'),
      'explicit same-level diagnostic');
  });

  it('rejects a heading whose only content is a footnote', () => {
    const result = validateTestDocumentStructure([
      'כותרת 6 - [הערת שוליים בלבד]',
      'טקסט גוף.'
    ].join('\n'));
    assert(!result.valid, 'footnote-only heading must be invalid');
    assert(result.errors.some((error) => error.code === 'heading-only-footnote'),
      'explicit footnote-only diagnostic');
  });

  it('does not count a footnote by itself as body text under a heading', () => {
    const result = validateTestDocumentStructure([
      'כותרת 7 - כותרת צד',
      '[הערת שוליים בלבד]',
      'כותרת 2 - חזרה לפרק'
    ].join('\n'));
    assert(!result.valid, 'footnote alone cannot close a terminal/deepest heading');
    assert(result.errors.some((error) => error.code === 'deepest-heading-without-body'),
      'explicit missing body diagnostic');
  });

  it('does not count the document endnotes section as body text under the last heading', () => {
    const result = validateTestDocumentStructure([
      'כותרת 4 - כותרת אחרונה',
      'הערות סיום - הערות המחבר',
      'טקסט של הערת סיום בלבד.'
    ].join('\n'));
    assert(!result.valid, 'endnotes must not satisfy the final heading body requirement');
    assert(result.errors.some((error) => error.code === 'terminal-heading-without-body'),
      'explicit terminal heading diagnostic');
  });

  it('rejects a terminal heading with no following body paragraph', () => {
    const result = validateTestDocumentStructure('כותרת 5 - הכותרת האחרונה');
    assert(!result.valid, 'terminal heading must own real body text');
    assert(result.errors.some((error) => error.code === 'terminal-heading-without-body'),
      'explicit terminal heading diagnostic');
  });

  it('rejects an upward hierarchy transition before the deeper heading receives body text', () => {
    const result = validateTestDocumentStructure([
      'כותרת 7 - כותרת עמוקה',
      'כותרת 3 - חזרה לרמה גבוהה יותר',
      'טקסט גוף.'
    ].join('\n'));
    assert(!result.valid, 'deepest heading must receive text before moving upward');
    assert(result.errors.some((error) => error.code === 'deepest-heading-without-body'),
      'explicit hierarchy closure diagnostic');
  });

  it('uses a real body fragment even when the paragraph also contains a footnote', () => {
    const result = validateTestDocumentStructure([
      'כותרת 5 - סעיף',
      'טקסט גוף [הערת שוליים] והמשך גוף.'
    ].join('\n'));
    assert(result.valid, JSON.stringify(result.errors));
  });

  it('rejects non-string input without throwing', () => {
    const result = validateTestDocumentStructure(null);
    assertEq(result.valid, false);
    assertEq(result.errors[0].code, 'document-not-string');
  });
});

describe('D-98 fixed and random document generation', () => {
  it('fixed generation is byte-identical and structurally valid', () => {
    const first = generateTestDocument({ mode: 'fixed', scale: 'small' });
    const second = generateTestDocument({ mode: 'fixed', scale: 'small' });
    assertEq(first, second, 'fixed document bytes must be identical');
    assert(validateTestDocumentStructure(first).valid, 'fixed document passes the structural validator');
  });

  it('an explicit random seed is reproducible and structurally valid', () => {
    const first = generateTestDocument({ mode: 'random', seed: 0x12345678, scale: 'small' });
    const second = generateTestDocument({ mode: 'random', seed: 0x12345678, scale: 'small' });
    assertEq(first, second, 'explicit seed must reproduce identical bytes');
    assert(validateTestDocumentStructure(first).valid, 'seeded random document passes validation');
  });

  it('keeps a broad set of random seeds structurally valid', () => {
    for (let seed = 1; seed <= 256; seed++) {
      const documentText = generateTestDocument({ mode: 'random', seed, scale: 'small' });
      const result = validateTestDocumentStructure(documentText);
      assert(result.valid, 'seed ' + seed + ': ' + JSON.stringify(result.errors));
    }
  });

  it('the full fixed stress document is structurally valid', () => {
    const documentText = generateTestDocument({ mode: 'fixed', scale: 'full' });
    const result = validateTestDocumentStructure(documentText);
    assert(result.valid, JSON.stringify(result.errors));
  });

  it('an unseeded random document is validated before being returned', () => {
    const documentText = generateTestDocument({ mode: 'random', scale: 'small' });
    assert(validateTestDocumentStructure(documentText).valid, 'random document passes preflight');
  });
});

report('test-doc-generator');
