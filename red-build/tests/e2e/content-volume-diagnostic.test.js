// Source/output word-accounting diagnostic on the authoritative long corpus.
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const {
  legacyTypeset,
  countLegacySourceWords,
  readConfig,
  tokenizeDoc,
  findNotes
} = require('../../src/engine/layout/legacy-imud-flow');
const {
  getDefaultSettings,
  getSettingDefs
} = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');

const ROOT = path.join(__dirname, '..', '..', '..');
const FIXTURE = path.join(ROOT, 'audits', 'very_long_test_text.txt');
const DEFAULTS = path.join(ROOT, 'red-build', 'ui', 'assets', 'imud', 'default_settings.json');
const FONTS = path.join(ROOT, 'red-build', 'ui', 'assets', 'imud', 'imud-fonts.json');

const raw = fs.readFileSync(FIXTURE, 'utf8');
const rawWords = raw.trim().split(/\s+/).filter(Boolean).length;
const defaults = JSON.parse(fs.readFileSync(DEFAULTS, 'utf8'));
const fonts = JSON.parse(fs.readFileSync(FONTS, 'utf8'));
const imported = importImudSettings(
  defaults,
  new Set(getSettingDefs().map(def => def.id)),
  { availableFonts: new Set(fonts.map(font => font.family)) }
);
const settings = Object.assign({}, getDefaultSettings(), imported.settings);
const normalizedSourceWords = countLegacySourceWords(raw, settings);
const cfg = readConfig(settings._imudRaw || {}, settings);
const parsed = tokenizeDoc(raw, cfg);
const sourceNotes = new Map();
for (const token of parsed.tokens) {
  if (token.type !== 'p') continue;
  const notes = findNotes(String(token.text || ''), cfg.fnOpen, cfg.fnClose);
  notes.forEach((note, ordinal) => {
    sourceNotes.set(`${token.id}#${ordinal}`, {
      tokenId: String(token.id),
      ordinal,
      paragraph: String(token.text || '').slice(0, 180),
      noteText: note.text.slice(0, 500)
    });
  });
}
const result = legacyTypeset(raw, settings, {});
const bodyByKey = new Map();
const footnoteByKey = new Map();
for (const [pageIndex, page] of result.pages.entries()) {
  for (const [columnIndex, column] of (page.columns || []).entries()) {
    for (const [lineIndex, line] of column.entries()) {
      for (let i = 0; i < (line.markerIdx || []).length; i++) {
        const markerIndex = line.markerIdx[i];
        const key = line.markerKeys && line.markerKeys[i];
        if (key == null) continue;
        if (!bodyByKey.has(String(key))) bodyByKey.set(String(key), []);
        bodyByKey.get(String(key)).push({
          page: pageIndex + 1,
          column: columnIndex,
          line: lineIndex,
          marker: line.words && line.words[markerIndex] || ''
        });
      }
    }
  }
  for (const fn of (page.footnotes || [])) {
    if (fn.continuous) {
      for (const line of (fn.lines || [])) {
        for (const token of (line.words || [])) {
          if (!token || !token.mk || token.noteKey == null) continue;
          const key = String(token.noteKey);
          footnoteByKey.set(key, (footnoteByKey.get(key) || []).concat(pageIndex + 1));
        }
      }
    } else if (fn.marker && fn.noteKey != null) {
      const key = String(fn.noteKey);
      footnoteByKey.set(key, (footnoteByKey.get(key) || []).concat(pageIndex + 1));
    }
  }
}
const missingFootnoteKeys = [...bodyByKey.keys()]
  .filter(key => !footnoteByKey.has(key))
  .map(key => ({
    key,
    bodyOccurrences: bodyByKey.get(key),
    source: sourceNotes.get(key) || null
  }));

const issues = result.ledger && result.ledger.issues
  ? [...result.ledger.issues.values()]
  : [];

const diagnostic = {
  fixture: path.relative(ROOT, FIXTURE),
  rawWords,
  normalizedSourceWords,
  engineContentStats: result.contentStats || null,
  contentPreserved: result.contentPreserved,
  pages: result.pages.length,
  layoutHash: result.layoutHash,
  contentLossIssues: issues.filter(issue => issue.kind === 'content-loss')
    .map(issue => ({
      kind: issue.kind,
      predicate_before: issue.predicate_before,
      predicate_after: issue.predicate_after,
      status: issue.status
    }))
};
console.log('CONTENT_VOLUME_DIAGNOSTIC ' + JSON.stringify(diagnostic));
console.log('FOOTNOTE_INSTANCE_DIAGNOSTIC ' + JSON.stringify({ sourceNoteCount: sourceNotes.size, bodyNoteCount: bodyByKey.size, openedNoteCount: footnoteByKey.size, missing: missingFootnoteKeys }));

assert.equal(result.contentPreserved, true,
  'legacyTypeset must preserve every normalized source word on very_long_test_text.txt');
assert.equal(normalizedSourceWords, result.contentStats.sourceWords,
  'independent source counter and in-layout source counter must agree');
assert.ok(result.contentStats.missingCount === 0,
  'content multiset must have no missing source words');

