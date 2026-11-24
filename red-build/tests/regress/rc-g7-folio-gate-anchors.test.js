// tests/regress/rc-g7-folio-gate-anchors.test.js — Iteration-006 / G7(F5)+G8(F11)
// נעילת שני עוגנים מכוילים מהייחוס:
//   1. F5/RC-F5a — העמודון בפרופיל IMUD מעוגן ל-FOLIO_BASELINE (1054.5px;
//      glyph-top ב-PDF = 791.2pt במדויק כמו הייחוס; הנוסחה הגנרית bottom:25px
//      הנמיכה אותו ב-36.8px — נמדד PDF y=818.8).
//   2. F5/RC-F5b — פתיחות-סימן בפרופיל IMUD מציגות גיליון (התנהגות הייחוס:
//      p44 «מב», p57 «נה», p70 «סח», p87 «פה»; D-91). DP נשאר על D-36.
//   3. F11 — כותרת השער הראשי «מקום בינה» ב-yTop=PT(109.2) ⇒ bbox-top
//      ב-PDF = 123.4pt (הייחוס: 123.5).
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');
process.env.RED_UNIFIED_IMUD = '1'; // הבדיקה נועדה לנתיב המאוחד

const FONT_DIR = path.join(RB, 'ui', 'assets', 'imud', 'fonts');
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
for (const [fam, file] of [['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['FrankReal', 'FrankReal-Bold.ttf'], ['Livorna', 'Livorna-Regular.ttf']]) {
  const fp = path.join(FONT_DIR, file);
  if (fs.existsSync(fp)) fontResolver.registerFont(fam, fs.readFileSync(fp), { source: 'rc-g7' });
}

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const { materializeDocument } = require(path.join(RB, 'src/engine/core/materialize'));
const { buildShaarBlocks } = require(path.join(RB, 'src/engine/output/shaar-content'));
const { GEO } = require(path.join(RB, 'src/engine/core/imud-geometry'));

const rawDefaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui', 'assets', 'imud', 'default_settings.json'), 'utf8'));
const regKeys = new Set(getSettingDefs().map(r => r.id));
const imp = importImudSettings(rawDefaults, regKeys, { contentHeightPx: 1040, availableFonts: new Set(['Guttman Rashi', 'FrankReal', 'Livorna']) });
const imud = { ...getDefaultSettings(), ...imp.settings };

const TEXT = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'rc_d1_book_prefix.txt'), 'utf8');

describe('rc-g7 — עוגני פוליו ושער (IMUD)', () => {
  it('F5a: העמודון מעוגן ל-FOLIO_BASELINE (לא לנוסחת bottom:25px)', () => {
    const rr = typeset(TEXT, imud, { noRecommendations: true });
    const proj = materializeDocument(rr, rr.settings, { mode: 'production' });
    const withFolios = proj.pages.filter(p => p.folio && p.folio.baselineY != null);
    assert(withFolios.length > 0, 'לא נמצאו עמודים עם פוליו');
    for (const p of withFolios) {
      assert(Math.abs(p.folio.baselineY - GEO.FOLIO_BASELINE) <= 0.51,
        `baselineY=${p.folio.baselineY.toFixed(1)} ≠ FOLIO_BASELINE=${GEO.FOLIO_BASELINE} (עמ' ${p.index + 1})`);
    }
  });

  it('F5b: פתיחת-סימן (chapterOpening, נספרת) מציגה גיליון ב-IMUD — כמו הייחוס', () => {
    const rr = typeset(TEXT, imud, { noRecommendations: true });
    const opens = rr.pages.filter(p => p.chapterOpening === true && p.pageNumber != null);
    assert(opens.length > 0, `לא נמצאו פתיחות-סימן נספרות בקורפוס (${opens.length})`);
    for (const p of opens) {
      assert(p.folioDisplay && p.folioDisplay.length > 0,
        `פתיחה נספרת (עמ' ${p.index + 1}, סוג ${p.type}) חייבת להציג גיליון ב-IMUD (התקבל ${JSON.stringify(p.folioDisplay)})`);
    }
  });

  it('F5b בקרה שלילית: DP נשאר על D-36 (פתיחה נספרת בלי תצוגה)', () => {
    const rr = typeset(TEXT, getDefaultSettings(), { noRecommendations: true });
    const opens = rr.pages.filter(p => p.chapterOpening === true && p.pageNumber != null);
    if (!opens.length) return;
    for (const p of opens) {
      assertEq(p.folioDisplay, '', `DP: פתיחה נספרת (עמ' ${p.index + 1}) בלי תצוגה (D-36)`);
    }
  });

  it('F11: כותרת השער הראשי בעוגן המכויל (yTop=PT(109.2) ⇒ PDF bbox 123.4pt)', () => {
    const blocks = buildShaarBlocks({ type: 'shaar-main', bookTitle: 'מקום בינה', subject: 'הוצאה-רשויות' }, imud);
    assert(blocks && blocks.blocks.length, 'בלוקי שער לא נבנו');
    const title = blocks.blocks.find(b => b.cls === 'book-title-main');
    assert(title != null, 'בלוק כותרת-ספר לא נמצא');
    assertEq(title.yTop, Math.round(109.2 * 96 / 72 * 100) / 100, 'עוגן כותרת השער (109.2pt)');
  });
});

report('rc-g7-folio-gate-anchors');
