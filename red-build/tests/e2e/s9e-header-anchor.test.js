// tests/e2e/s9e-header-anchor.test.js — עיגון עצמאי לכותרת העליונה (חקירת 19.11)
//
// שורש הבעיה שנסגר כאן (HEADER_POSITION ×88 ב-full-math על very_long):
// furniture-geometry.headerGeometry גזר את ראש הכותרת מ-contentBox.top − 18.
// בפרופיל IMUD, עמוד פתיחת-סימן (sign-open) מרים את contentBox.top ב-h2TopOffset
// (180px) — והכותרת, שהיא ריהוט עמוד, נגררה יחד עם היסט התוכן (269.2px במקום
// 89.2px). התיקון: עיגון ל-margins.top (קבוע החוזה לכל סוגי העמודים בפרופיל)
// — הכותרת נשארת במקום קבוע בכל עמודי התוכן, כמו פס הכותרת של המורשת
// (חוזה 9C3 §ה: הכלל התחתון בכל עמוד עם כותרת, כולל פתיחות-סימן).
//
// דרישות הבדיקה (הוראת 19.11 §4.1): sign-open ימני ושמאלי, regular, preface,
// h3-spread, תוכן-עניינים — והנוסחה בנתיב הלא-IMUD לא משתנה (נעילת s9d).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { registerFont } = require('../../src/engine/typography/measure-api');
const { headerGeometry } = require('../../src/engine/layout/furniture-geometry');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');

function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const { getSettingDefs } = require('../../src/engine/core/settings-registry');
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  return importImudSettings(legacy, regKeys, { availableFonts: families }).settings;
}
function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf'],
  ];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) registerFont(fam, fs.readFileSync(fp));
  }
}
function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf'),
  };
}
// DOM shim (אותו חוזה כמו s8d)
function makeDoc() {
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {}; this.style = {}; this._class = ''; this._text = ''; this.dir = ''; }
    set className(v) { this._class = String(v); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}
const walk = (el, fn) => { fn(el); (el.children || []).forEach(c => walk(c, fn)); };

// ---------- יחידה: הנוסחה ----------
describe('s9e — עיגון כותרת עליונה עצמאי (furniture-geometry)', () => {
  it('נוסחת הנתיב הלא-IMUD לא השתנתה: contentBox.top − 18', () => {
    assertEq(headerGeometry({ template: { contentBox: { top: 60 } } }).y, 42, 'top−18');
    assertEq(headerGeometry({ template: { contentBox: { top: 107.2 } } }).y, 89.2, '107.2−18');
  });

  it('תבנית IMUD עם היסט פתיחת-סימן: הכותרת נעוצה ל-margins.top, לא לתוכן', () => {
    const signOpenTpl = {
      imud: true, margins: { top: 107.2 },
      contentBox: { top: 107.2 + 180, bottom: 1022.2, height: 735 },
    };
    const regularTpl = { imud: true, margins: { top: 107.2 }, contentBox: { top: 107.2, bottom: 1022.2, height: 915 } };
    assertEq(headerGeometry({ template: signOpenTpl }).y, 89.2, 'sign-open: margins.top−18');
    assertEq(headerGeometry({ template: regularTpl }).y, 89.2, 'regular: אותו עוגן');
    assertEq(headerGeometry({ template: signOpenTpl }).y, headerGeometry({ template: regularTpl }).y,
      'כותרת הפתיחה זהה לכותרת העמוד הרגיל — ההיסט לא גורר ריהוט');
  });

  it('שלילה: תבנית IMUD בלי margins — נפילה חזרה לנוסחה ההיסטורית (לא קריסה)', () => {
    const tpl = { imud: true, contentBox: { top: 287.2 } };
    assertEq(headerGeometry({ template: tpl }).y, 269.2, 'נפילה: contentBox.top−18');
  });
});

// ---------- אינטגרציה: הקורפוס החי (שני המנועים באותן הגדרות) ----------
describe('s9e — אינטגרציה: עוגן הכותרת על כל סוגי העמודים בקורפוס החי', () => {
  const settings = liveSettings();
  registerLiveFonts();
  const corpusPath = path.join(RB, '..', 'audits', 'no_long_test_text.txt');
  const raw = fs.readFileSync(corpusPath, 'utf8');
  const res = typeset(raw, { ...settings, '_engine-force-unified': true }, { env: typesetEnvExtras() });
  const planPages = res.pages;
  const modelPages = res.pageModel.pages;

  it('לכל עמוד עם חותמת כותרת — y אחיד 89.2 בדיוק, בכל סוג (regular/sign-open/preface/toc/h3-spread)', () => {
    const byType = {};
    let checked = 0;
    for (const pg of planPages) {
      if (!pg.headerSlotGeo) continue;
      const t = pg.template.type;
      byType[t] = byType[t] || [];
      byType[t].push(pg.headerSlotGeo.y);
      assertEq(pg.headerSlotGeo.y, 89.2, `page ${pg.index} (${t}): headerSlotGeo.y`);
      checked++;
    }
    assert(checked > 40, `נבדקו ${checked} עמודים עם כותרת`);
    assert((byType['sign-open'] || []).length >= 2, 'יש לפחות שני עמודי sign-open בקורפוס');
    assert((byType['regular'] || []).length >= 10, 'יש עמודי regular');
    for (const t of ['preface', 'toc-general', 'toc-detail']) {
      assert((byType[t] || []).length >= 1, `יש עמודי ${t} עם כותרת`);
    }
  });

  it('sign-open ימני ושמאלי: העוגן זהה בשני הצדדים (recto/verso)', () => {
    // העוגן תלוי בסוג העמוד בלבד — לא בזוגיות; מספרי ה-recto/verso בקורפוס
    // משתנים עם העימוד (עמודי TOC/פריסות), ולכן הבדיקה נשענת על כל
    // sign-open שקיים ולא על התפלגות הצדדים.
    const so = planPages.filter(p => p.template.type === 'sign-open');
    assert(so.length >= 2, 'קורפוס עם ≥2 sign-open');
    const recto = so.filter(p => p.isRecto), verso = so.filter(p => !p.isRecto);
    for (const p of [...recto, ...verso]) {
      assertEq(p.headerSlotGeo.y, 89.2, `sign-open ${p.isRecto ? 'recto' : 'verso'} (page ${p.index})`);
    }
    if (recto.length && verso.length) {
      assertEq(recto[0].headerSlotGeo.y, verso[0].headerSlotGeo.y, 'אותו עוגן בשני הצדדים');
    }
  });

  it('המודל החומרי (PageModel): out.header.y מהחותמת — אותו עוגן בכל העמודים', () => {
    let withHeader = 0;
    for (const mp of modelPages) {
      if (!mp.header) continue;
      assertEq(mp.header.y, 89.2, `PageModel page ${mp.index}: header.y`);
      withHeader++;
    }
    assert(withHeader > 40, `נבדקו ${withHeader} עמודי PageModel עם כותרת`);
  });

  it('הקרנת ה-DOM: .running-head ממוקם ב-top = 89.2px בכל עמוד, כולל sign-open', () => {
    const doc = makeDoc();
    const settings2 = liveSettings();
    let checked = 0;
    for (const mp of modelPages) {
      if (!mp.header || !(mp.header.slots || []).length) continue;
      const el = renderModelPage(mp, settings2, doc);
      const rh = [];
      walk(el, (n) => { if (String(n.className || '').split(/\s+/).includes('running-head')) rh.push(n); });
      assertEq(rh.length, 1, `page ${mp.index}: שורת running-head אחת`);
      assertEq(rh[0].style.top, '89.2px', `page ${mp.index}: running-head.top`);
      checked++;
    }
    assert(checked > 40, `נבדקו ${checked} עמודים בהקרנה`);
  });

  it('שלילה גאומטרית: היסט התוכן של sign-open נשתמר (contentBox.top=287.2) — התוכן לא עלה', () => {
    const so = planPages.filter(p => p.template.type === 'sign-open');
    for (const p of so) {
      assertEq(p.template.contentBox.top, 287.2, `page ${p.index}: היסט 180px נשמר`);
      assertEq(p.template.h2TopOffset, 180, `page ${p.index}: h2TopOffset נשמר`);
    }
  });
});

report();
