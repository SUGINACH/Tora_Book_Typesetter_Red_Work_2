// Source/output word-accounting diagnostic on the authoritative long corpus.
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const {
  legacyTypeset,
  countLegacySourceWords
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
const result = legacyTypeset(raw, settings, {});
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

assert.equal(result.contentPreserved, true,
  'legacyTypeset must preserve every normalized source word on very_long_test_text.txt');
assert.equal(normalizedSourceWords, result.contentStats.sourceWords,
  'independent source counter and in-layout source counter must agree');
assert.ok(result.contentStats.missingCount === 0,
  'content multiset must have no missing source words');

