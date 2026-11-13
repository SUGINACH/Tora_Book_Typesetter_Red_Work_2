// End-to-end regression for page-level margin note placement.
'use strict';

const assert = require('node:assert/strict');
const { legacyTypeset, FLOW_BOTTOM } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const defaults = require('../../ui/assets/imud/default_settings.json');
const fonts = require('../../ui/assets/imud/imud-fonts.json');

const available = new Set(fonts.map(x => x.family));
const imported = importImudSettings(
  defaults,
  new Set(getSettingDefs().map(x => x.id)),
  { availableFonts: available }
);
const settings = Object.assign({}, getDefaultSettings(), imported.settings);

const sideText = 'ביאור נוסף בהגדרת הדבר ובחלוקת עניינו בין חלקי הסוגיה והעמדת הדברים על מכונם';
const rows = [
  'שם הספר - בדיקת הקצאת הערות צד',
  'כותרת 2 מספר 1 - פרק בדיקה',
  'פסקת פתיחה קצרה שיש בה תוכן ממשי.'
];
for (let i = 1; i <= 9; i++) {
  rows.push(`כותרת 7 מספר ${i} - ${sideText}`);
  rows.push(`פסקת גוף ${i} ובה תוכן ממשי המספיק לבדיקת רצף העימוד.`);
}
const result = legacyTypeset(rows.join('\n'), settings, {});

let noteCount = 0;
let checkedGroups = 0;
for (const [pageIndex, page] of result.pages.entries()) {
  const notes = page.marginNotes || [];
  noteCount += notes.length;
  for (const side of ['right', 'left']) {
    const lane = notes.filter(n => n.side === side && n.lines && n.lines.length)
      .map(n => ({
        top: Math.min(...n.lines.map(line => line.y)),
        bottom: Math.max(...n.lines.map(line => line.y)) + 9.6
      }))
      .sort((a, b) => a.top - b.top);
    for (let i = 1; i < lane.length; i++) {
      assert.ok(lane[i].top >= lane[i - 1].bottom - 1e-7,
        `page ${pageIndex + 1} ${side}: margin notes overlap by ${(lane[i - 1].bottom - lane[i].top).toFixed(2)}px`);
    }
    if (lane.length > 1) checkedGroups++;
  }
  for (const n of notes) {
    for (const line of n.lines || []) {
      assert.ok(line.y >= 107.2 - 1e-7, `page ${pageIndex + 1}: margin note starts above the text region`);
      assert.ok(line.y + 9.6 <= FLOW_BOTTOM + 1e-7,
        `page ${pageIndex + 1}: margin note exceeds the page's margin-note lane`);
    }
  }
}
assert.equal(result.contentPreserved, true, 'body and note content must be preserved');
assert.ok(noteCount >= 3, `expected multiple side notes, received ${noteCount}`);
assert.ok(checkedGroups > 0, 'at least one page must exercise a shared multi-note margin lane');
assert.ok(result.pages.every(p => !(p.layoutDiagnostics || []).some(d => d.code === 'MARGIN_NOTES_EXCEED_LANE')),
  'the fixture is intentionally sized to fit without lane overflow');

console.log(`margin-flow e2e: ${noteCount} side notes, ${checkedGroups} shared lanes, no overlaps`);
