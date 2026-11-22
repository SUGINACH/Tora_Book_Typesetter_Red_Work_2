// tests/regress/rc2-h0-body-window.test.js — RC-2 (Iteration-004): גוף הקדמה
// 11.5pt + מילת-חלון בגודל ההקדמה + רוחב windowW על שתי שורות החלון.
//
// **השורשים (אומתו על PDF אמיתי, i004):**
//   RC-2a — s-h0-body=11.5 לא מופה בייבוא ⇒ גוף ה-h0 זרם ב-12pt (OLD p43:
//   11.5pt, פיץ׳ 15.5; NEW היה 12pt/פיץ׳ 16.1; מילות-חלון 17.25=11.5×1.5
//   מול 18=12×1.5).
//   RC-2b — windowW הוצב רק על שורה 0; שורה 1 (window:true) נותרה בלי
//   windowW ⇒ ההקרנה (materialize winShift) וה-DOM (line--window-wrap)
//   דילגו על צמצום הרוחב — שורה 1 נמדדה צר אך יושבה לרוחב מלא
//   (רווחים ~20pt ב-p43/p46 במקום ~5pt).
'use strict';
const path = require('path');
const { describe, it, assertEq, assert, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));

const rawDefaults = {
  'f-h0-body': "'Frank Ruhl Libre', serif",
  's-h0-body': '11.5',
  'size-body': '12',
  'drop-word-mode': 'window',
  'font-first-word': "'FrankReal', serif",
  'size-first-word': '1.5'
};

function importSettings() {
  const { getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  return importImudSettings(rawDefaults, regKeys, { contentHeightPx: 1040, availableFonts: null });
}

describe('RC-2 h0 body + window (i004)', () => {
  it('RC-2a: s-h0-body=11.5 imports to heading-0-body-size-pt', () => {
    const imp = importSettings();
    assertEq(imp.settings['heading-0-body-size-pt'], 11.5, 's-h0-body ⇒ heading-0-body-size-pt');
    assertEq(imp.settings['heading-0-body-font'], 'Frank Ruhl Libre', 'f-h0-body still maps');
    assertEq(imp.settings['body-font-size-pt'], 12, 'body size untouched');
  });

  it('RC-2a: registry default is 11.5 (legacy SZ.h0Body)', () => {
    const d = getDefaultSettings();
    assertEq(d['heading-0-body-size-pt'], 11.5, 'registry default');
  });

  it('RC-2a: h0 pitch = 11.5×1.34×4/3 = H0_LINE_H (20.55px)', () => {
    const { MeasureAPI } = require(path.join(RB, 'src/engine/typography/measure-api'));
    const api = new MeasureAPI({ 'body-line-height': 1.34 }, 'font-metrics');
    const h = api.lineHeightPx(11.5);
    assert(Math.abs(h - 20.55) < 0.02, `h0 pitch ${h} ≈ 20.55 (H0_LINE_H)`);
  });

  it('RC-2b: window lines 0-1 both carry windowW (renderers require it)', () => {
    const { layoutSequence } = require(path.join(RB, 'src/engine/line/line-model'));
    const { buildContainerSequence } = require(path.join(RB, 'src/engine/line/line-items'));
    // sequence of one paragraph, first word extracted as window
    const settings = { 'body-font-size-pt': 12, 'body-font': 'Guttman Rashi', 'body-line-height': 1.34 };
    const blk = {
      id: 'b1', kind: 'paragraph',
      items: [{
        id: 'i1', kind: 'text',
        payload: { runs: [{ text: 'אחת שתיים שלוש ארבע חמש שש שבע שמונה תשע עשר אחת עשרה שתים עשרה שלוש עשרה ארבע עשרה חמש עשרה שש עשרה', sourceStart: 0 }] },
        sourceRange: { start: 0, end: 120 }
      }]
    };
    const seq = buildContainerSequence({ id: blk.id, kind: 'paragraph', items: blk.items, baseStyle: null }, { settings });
    assert(seq, 'sequence built');
    const res = layoutSequence(seq, {
      maxWidthPx: 269, settings,
      lineHeightPx: 21.44,
      window: { widthPx: 60 }
    });
    assert(res.ok && res.lines.length >= 3, `lines built (${res.lines.length})`);
    assertEq(res.lines[0].window, true, 'line 0 window');
    assertEq(res.lines[1].window, true, 'line 1 window');
    assert(Math.abs(res.lines[0].windowW - 60) < 0.001, 'line 0 windowW');
    assert(Math.abs(res.lines[1].windowW - 60) < 0.001, 'line 1 windowW (RC-2b — was undefined)');
    assertEq(res.lines[0].windowWords.length, 1, 'window word on line 0 only');
    assert(!res.lines[1].windowWords, 'no window words on line 1');
    assert(!res.lines[2].window, 'line 2 not window');
    // narrowing actually applied in composition: lines 0-1 narrower than full
    assert(res.lines[0].naturalWidthPx <= 269 - 60 + 1, `line 0 composed narrow (${res.lines[0].naturalWidthPx})`);
    assert(res.lines[1].naturalWidthPx <= 269 - 60 + 1, `line 1 composed narrow (${res.lines[1].naturalWidthPx})`);
  });
});

report();
