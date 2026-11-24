// tests/regress/rc-f1-header-slot-anchors.test.js — Iteration-006 / G6 / RC-F1
// נעילת חוזה עוגני סלוטי-הצד בכותרת העליונה (פרופיל IMUD, נתיב ה-PageModel):
//   1. סלוט ימין: מרכז הטקסט = מרכז-עמוד + 170.2px (עוגן «מקום» בייחוס 566.8px).
//   2. סלוט שמאל: מרכז הטקסט = מרכז-עמוד − 170.2px (עוגן «בינה» בייחוס 226.35px).
//   3. סלוט מרכז: ממורכז במרכז העמוד.
//   4. ה-DOM: סלוט כותרת תמיד שורה אחת (white-space:nowrap) — בלי זה הדפדפן
//      שובר כותרת-מרכז ארוכה בתיבת 14px והשורות מודבקות (כשל "מילים זו על זו").
//   5. בקרה שלילית: פרופיל DP (ברירת מחדל, בלי _imudRaw) נשאר על נוסחת הקצוות
//      (tpl.width−60−w / 60) — התיקון אינו דולף לפרופיל הלא-נכון.
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const FONT_DIR = path.join(RB, 'ui', 'assets', 'imud', 'fonts');
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
fontResolver.registerFont('FrankReal', fs.readFileSync(path.join(FONT_DIR, 'FrankReal-Bold.ttf')), { source: 'rc-f1' });
fontResolver.registerFont('Guttman Rashi', fs.readFileSync(path.join(FONT_DIR, 'Guttman-Rashi-Normal.ttf')), { source: 'rc-f1' });

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { materializeDocument } = require(path.join(RB, 'src/engine/core/materialize'));
const { GEO, HDR_SIDE_SLOT_CENTER_OFFSET_PX } = require(path.join(RB, 'src/engine/core/imud-geometry'));
const { renderModelPage } = require(path.join(RB, 'src/engine/output/pagemodel-dom-renderer'));

const LONG = 'תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ';
const TEXT = [
  'ספר - מקום בינה',
  'מחבר - בדיקת רגרסיה',
  '',
  'כותרת 1 - חלק 1',
  'כותרת 2 - סימן א של חלק 1',
  'פסקה 1 של חלק 1 ' + LONG.repeat(4) + 'שלום.'
].join('\n');

function imudSettings() {
  return {
    ...getDefaultSettings(),
    '_layout-profile': 'imud',
    '_imudRaw': { 'h2-auto-siman': true },
    '_engine-force-unified': true,
    'first-word-mode': 'drop',
    'first-word-font': 'FrankReal',
    'body-font': 'Guttman Rashi',
    'body-font-size-pt': 12
  };
}

const docShim = {
  createElement: (t) => ({
    tagName: t, children: [], style: {}, dataset: {}, attrs: {}, className: '', dir: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
    classList: { add(c) { this.className = (this.className + ' ' + c).trim(); } },
    get textContent() { return this.children.length ? this.children.map((c) => c.textContent).join('') : this._text; },
    set textContent(v) { this._text = String(v); this.children = []; }
  }),
  createTextNode: (t) => ({ _t: String(t), get textContent() { return this._t; } })
};

function headerPageOf(pages) {
  return pages.find(pg => pg.header && pg.header.slots && pg.header.slots.length) || null;
}

describe('rc-f1 — עוגני סלוטי-הצד בכותרת העליונה (IMUD)', () => {
  let _ctx = null;
  const ctx = () => {
    if (_ctx) return _ctx;
    const rr = typeset(TEXT, imudSettings());
    const proj = materializeDocument(rr, rr.settings, { mode: 'production' });
    _ctx = { rr, projected: proj };
    return _ctx;
  };

  it('סלוטי-הצד ממורכזים על עוגני הייחוס (מרכז-עמוד ± 170.2px)', () => {
    const { projected } = ctx();
    const page = headerPageOf(projected.pages);
    assert(page, 'לא נמצא עמוד עם סלוטי כותרת');
    const pageCenter = GEO.PAGE_W / 2;
    let sides = 0;
    for (const s of page.header.slots) {
      if (s.pos === 'center' || s.x == null) continue;
      sides++;
      const c = s.x + s.w / 2;
      const expected = pageCenter + (s.pos === 'right' ? HDR_SIDE_SLOT_CENTER_OFFSET_PX : -HDR_SIDE_SLOT_CENTER_OFFSET_PX);
      assert(Math.abs(c - expected) <= 1.0,
        `סלוט ${s.pos}: מרכז ${c.toFixed(1)}px ≠ עוגן ${expected.toFixed(1)}px (טקסט=${s.text})`);
    }
    assert(sides > 0, 'לא נבדק אף סלוט-צד');
  });

  it('סלוט המרכז נשאר ממורכז-עמוד', () => {
    const { projected } = ctx();
    const page = headerPageOf(projected.pages);
    assert(page, 'לא נמצא עמוד עם סלוטי כותרת');
    const pageCenter = GEO.PAGE_W / 2;
    for (const s of page.header.slots) {
      if (s.pos !== 'center' || !s.text || s.x == null) continue;
      const c = s.x + s.w / 2;
      assert(Math.abs(c - pageCenter) <= 1.0, `סלוט מרכז: ${c.toFixed(1)} ≠ ${pageCenter}`);
    }
  });

  it('ה-DOM מציב סלוטי כותרת בשורה אחת (white-space:nowrap)', () => {
    const { rr, projected } = ctx();
    const page = headerPageOf(projected.pages);
    assert(page, 'לא נמצא עמוד עם סלוטי כותרת');
    const root = renderModelPage(page, rr.settings, docShim, {});
    const spans = [];
    const walk = (el) => {
      if (!el || !el.tagName) return;
      if (String(el.className).includes('rh--')) spans.push(el);
      for (const c of (el.children || [])) walk(c);
    };
    walk(root);
    assert(spans.length >= 2, `צפויים ≥2 סלוטים ב-DOM, התקבלו ${spans.length}`);
    for (const sp of spans) {
      assertEq(sp.style.whiteSpace, 'nowrap', `חסר white-space:nowrap בסלוט (טקסט=${String(sp.textContent).slice(0, 12)})`);
    }
  });

  it('בקרה שלילית: פרופיל DP נשאר על נוסחת הקצוות', () => {
    const rr = typeset(TEXT, getDefaultSettings());
    const proj = materializeDocument(rr, rr.settings, { mode: 'production' });
    const page = headerPageOf(proj.pages);
    if (!page) return; // קורפוס קצר ב-DP עשוי שלא לייצר כותרות — דלג שקט
    const pw = Number(page.width) || GEO.PAGE_W;
    for (const s of page.header.slots) {
      if (s.pos !== 'right' || s.x == null) continue;
      assertEq(s.x, pw - 60 - s.w, `סלוט ימין ב-DP חייב להישאר בקצה העמוד (התקבל ${s.x})`);
    }
  });
});

report('rc-f1-header-slot-anchors');
