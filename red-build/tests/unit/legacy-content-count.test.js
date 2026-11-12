// Source-word accounting must match the legacy content-preservation model.
'use strict';

const assert = require('node:assert/strict');
const {
  countLegacySourceWords,
  legacyTypeset
} = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const defaults = require('../../ui/assets/imud/default_settings.json');

const imported = importImudSettings(
  defaults,
  new Set(getSettingDefs().map(def => def.id))
);
const settings = Object.assign({}, getDefaultSettings(), imported.settings, {
  'shaar-back-enabled': false
});

const VALID_DOC = [
  'שם הספר - ספר בדיקה',
  'כותרת 1 מספר 1 - חלק ראשון',
  'כותרת 2 מספר 1 - סימן א - פרק ראשון',
  'כותרת 3 מספר 1 - סעיף ראשון',
  'כותרת 7 מספר 1 - הערת צד יחידה',
  'פסקת גוף קצרה עם הערה [מילים בתוך ההערה] ועוד המשך.'
].join('\n');

function test(name, fn) {
  fn();
  console.log('✓ ' + name);
}

test('normalized source-word count matches content-preservation source multiset', () => {
  const result = legacyTypeset(VALID_DOC, settings, {});
  const expected = countLegacySourceWords(VALID_DOC, settings);
  assert.equal(expected, 21);
  assert.equal(result.contentStats.sourceWords, expected);
  assert.equal(result.contentStats.missingCount, 0);
  assert.equal(result.contentPreserved, true);
});

test('non-rendered year and disabled back-matter metadata do not inflate source words', () => {
  const base = countLegacySourceWords(VALID_DOC, settings);
  const extraMetadata = [
    VALID_DOC,
    'מקום ושנת הוצאה - תשפ״ז',
    'פרטי הוצאה לאור - בית דפוס שאינו מוצג'
  ].join('\n');
  assert.equal(countLegacySourceWords(extraMetadata, settings), base);
});

test('stable note-instance keys survive into the page model beside their visible markers', () => {
  const result = legacyTypeset(VALID_DOC, settings, {});
  const markerLines = result.pages.flatMap(page => page.columns || [])
    .flat()
    .filter(line => Array.isArray(line.markerIdx) && line.markerIdx.length > 0);
  assert.ok(markerLines.length > 0, 'fixture must render at least one body footnote marker');
  for (const line of markerLines) {
    assert.equal(line.markerKeys.length, line.markerIdx.length,
      'every visible body marker must carry exactly one stable source-note key');
    for (const key of line.markerKeys) {
      assert.match(key, /^.+#\\d+$/, 'note key must identify token and occurrence ordinal');
    }
  }
});

console.log('legacy-content-count: 3 tests passed');
