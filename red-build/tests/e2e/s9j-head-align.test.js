// tests/e2e/s9j-head-align.test.js — U-15 (ביקורת שלמות 20.11 + בקרת איכות 21.11):
// חוזה יישור כותרות — כל שורות הכותרת ממורכזות, בכל מסלול (טור + פס חוצה־טורים),
// הן ב-PageModel והן ב-DOM (מקרין המודל).
//
// שורש שנסגר: lastAlignOf (materialize) החזיר 'justify' לכל שורה שאינה-אחרונה
// גם לכותרות ⇒ שורות המשך של כותרות מרובות-שורות נמתחו מקצה לקצה בגיאומטריית
// המילים (gapW=(colW−sumW)/gaps) — HEAD_JUSTIFIED ×28 ב-Full Math very_long
// (sign-open 22 / preface 5 / regular 1; בכולן inkL=x, inkR=x+w — מתיחה מלאה).
// הכפל שני באותו שורש: שורות הפס החוצה־טורים קיבלו 'right' קבוע ⇒ 340 שורות
// כותרת צמודות-ימין (אסימטריה 170–222px ממרכז הפס) בניגוד למורשת שממרזת
// (נמדד במורשת: h0/h2/h3 — Lgap=Rgap בדיוק).
//
// חוזה (חמש רשויות מסכימות): dom-renderer renderLine (text-align:center לכל
// kind='heading'), legacy-projector:407, legacy-projector:238 (פסים), BASE_CSS
// (.line--heading מוחרט מ-text-align-last:justify), מפרט האודיט סעיף 8.
//
// ═══ סבילות גאומטרית — הוכחה (בקרת איכות 21.11) ═══
// מודל (materialize.projectLine, align='center'):
//   xRight = colX + (colW + lineW)/2 ; מילים מוקרנות מימין בנקודה צפה.
//   Lgap = inkL − x = (colW − lineW)/2 וגם Rgap = (x+w) − inkR = (colW − lineW)/2
//   — זהות מתמטית מדויקת; הפער היחיד הוא אריתמטיקת float64 בלבד.
//   נמדד (21.11, probe): כותרות n=536 (synthetic+very_long) max=2.6e−13px;
//   שורות אחרונות ממורכזות n=3174 max=4.5e−13px — כלומר ~11 סדרי גודל מתחת
//   ל-0.05px. page-model r2() הוא identity (אין עיגול במודל — "תצוגה=ייצוא=
//   מודל, אותם מספרים"), ולכן 0.05px מכסה את המודל בשולי ענק.
// DOM (pagemodel-dom-renderer): px2(v)=Math.round(v*100)/100 — עיגול ל-2 ספרות:
//   כל מיקום שמועבר ל-DOM סוטה לכל היותר ±0.005px. שפה של שורה (left,width)
//   ושל מילה (left) — שלוש עיגולים בקצה דיו אחד ⇒ אסימטריית DOM חסומה
//   ב-3×0.005+2×0.005=0.025px < 0.05px. לכן 0.05px מוצדק גם למסלול ה-DOM,
//   והבדיקות מהדקות מ-3px ל-0.05px (הידוק, לא הרחבה). העברת המיקומים עצמה
//   נבדקת כאן נגד חסם העיגול המדויק ±0.005px.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { renderModelPage } = require(path.join(RB, 'src/engine/output/pagemodel-dom-renderer'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 's9j' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
const imudSettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics', '_engine-force-unified': true };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

/** סבילות אסימטריית דיו במודל — 0.05px (הוכחה למעלה; המדידה בפועל ~1e−13). */
const TOL_ASYM = 0.05;
/** חסם העיגול של px2 במקרין ה-DOM: |round(v*100)/100 − v| ≤ 0.005 בדיוק. */
const TOL_POS = 0.005 + 1e-9;

/** אסימטריית דיו מול מרכז תיבת השורה — |Lgap−Rgap|. */
function inkAsym(ml) {
  const ws = ml.words || [];
  if (!ws.length) return 0;
  const inkL = Math.min(...ws.map(w => w.x));
  const inkR = Math.max(...ws.map(w => w.x + w.w));
  return Math.abs((inkL - ml.x) - (ml.x + ml.w - inkR));
}

/** מסמך עם כותרת H1 ארוכה (רבת-שורות) בטור — המקרה ההיסטורי של 50pt. */
function multilineHeadingDoc() {
  const parts = ['כותרת 1 - הקדמות וכללים - יום השבת - גדרי מלאכה - הוצאה - רשימות'];
  for (let i = 0; i < 12; i++) parts.push(`פסקה ${i + 1} למילוי העמוד בטקסט רציף. ${'מילים רבות למדידה ולשבירה ברוחב הטור המלא '.repeat(8)}`);
  return parts.join('\n');
}

/** מסמך עם H2/H3 בפס חוצה-טורים + H1 בטור — מכסה את שני מסלולי ההקרנה. */
function spanningHeadingDoc() {
  return ['כותרת 2 - קדושת יום השבת ומצוותיה']
    .concat(Array.from({ length: 30 }, (_, i) => `פסקה ${i + 1}. ${'טקסט גוף רגיל למילוי עמודים אחרי הכותרת '.repeat(10)}`))
    .concat(['כותרת 3 - מהות השבת וחלקי מצוותה'])
    .concat(Array.from({ length: 30 }, (_, i) => `עוד פסקה ${i + 1}. ${'טקסט גוף רגיל למילוי עמודים נוספים '.repeat(10)}`))
    .join('\n');
}

// ---------- DOM shim (דפוס s8d) ----------
function makeDoc() {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.dataset = {};
      this.style = {}; this._class = ''; this._text = ''; this.dir = '';
    }
    set className(v) { this._class = String(v); }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this.children.length ? this.children.map(c => c.textContent).join('') : this._text; }
  }
  return { createElement: (t) => new El(t), createTextNode: (t) => { const e = new El('#text'); e._text = String(t); return e; } };
}

function collectByClass(root, cls) {
  const out = [];
  const walk = (el) => {
    if (String(el.className || '').split(/\s+/).includes(cls)) out.push(el);
    (el.children || []).forEach(walk);
  };
  walk(root);
  return out;
}

describe('U-15 — חוזה יישור כותרות (כל שורות הכותרת ממורכזות, בכל מסלול)', () => {
  it('כותרת רבת-שורות בטור: כל שורותיה ממורכזות — לא נמתחות מקצה לקצה', () => {
    const r = typeset(multilineHeadingDoc(), imudSettings, envExtras);
    assert(r.pageModel && r.pageModel.pages.length, 'PageModel קיים');
    const heads = [];
    for (const pml of r.pageModel.pages) for (const ml of pml.lines) if (ml.kind === 'heading') heads.push(ml);
    assert(heads.length >= 2, `כותרת רבת-שורות: ${heads.length} שורות כותרת`);
    for (const ml of heads) {
      assertEq(ml.align, 'center', `שורת כותרת (isLast=${!!ml.isLast}) חייבת center — התקבל ${ml.align}`);
      // גיאומטריה: הדיו ממורז בתיבה — לא פרוש על רוחבה (הקוד הישן: inkL=x, inkR=x+w)
      const ws = ml.words || [];
      if (ws.length >= 2) {
        const inkL = Math.min(...ws.map(w => w.x));
        const inkR = Math.max(...ws.map(w => w.x + w.w));
        assert(inkL - ml.x > 1, `שורת כותרת אינה צמודה לקצה שמאל (Lgap=${(inkL - ml.x).toFixed(1)}px — מתיחה מלאה)`);
        assert(ml.x + ml.w - inkR > 1, `שורת כותרת אינה צמודה לקצה ימין (Rgap=${(ml.x + ml.w - inkR).toFixed(1)}px)`);
        assert(inkAsym(ml) < TOL_ASYM, `מרכוז הכותרת (אסימטריה ${inkAsym(ml).toExponential(2)}px — חסם מוכח ${TOL_ASYM}px; מדידה בפועל ~1e−13)`);
      }
    }
  });

  it('פס חוצה־טורים (H2/H3): שורות הכותרת ממורכזות בפס — לא צמודות-ימין', () => {
    const r = typeset(spanningHeadingDoc(), imudSettings, envExtras);
    let spanningHeads = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        // **Iteration-001 (legacy parity):** פס H3 באמצע עמוד הוא גם שורת-פס
        // חוצה-טורים (midBand) — אותו חוזה מרכוז, מרוחב הפס כולו.
        if (ml.kind !== 'heading' || !(ml.area === 'spanning' || ml.midBand === true)) continue;
        spanningHeads++;
        assertEq(ml.align, 'center', `שורת פס חוצה-טורים (isLast=${!!ml.isLast}) חייבת center — התקבל ${ml.align}`);
        const ws = ml.words || [];
        if (ws.length >= 2) {
          // הקוד הישן: Rgap=0 ואסימטריה 170–222px ממרכז הפס (צמודות-ימין)
          assert(inkAsym(ml) < TOL_ASYM, `מרכוז בפס (אסימטריה ${inkAsym(ml).toExponential(2)}px — הקוד הישן: עד 222px)`);
        }
      }
    }
    assert(spanningHeads >= 1, `נבדקו שורות כותרת בפס חוצה-טורים: ${spanningHeads}`);
  });

  it('DOM (מקרין המודל): כל שורות הכותרת ממורכזות — בטור ובפס חוצה-טורים', () => {
    const r = typeset(spanningHeadingDoc(), imudSettings, envExtras);
    const doc = makeDoc();
    let checkedCol = 0, checkedSpan = 0;
    for (const mp of r.pageModel.pages) {
      const root = renderModelPage(mp, imudSettings, doc);
      const byId = new Map();
      for (const el of collectByClass(root, 'line')) if (el.dataset.id != null) byId.set(el.dataset.id, el);
      for (const ml of mp.lines) {
        if (ml.kind !== 'heading') continue;
        const el = byId.get(ml.id);
        assert(el != null, `שורת כותרת ${ml.id} קיימת ב-DOM`);
        // (א) סמכות CSS: line--heading + text-align:center (המקרין קורא את
        // ההחלטה מהמודל — מקור סמכות אחד, lineAlignOf)
        assert(String(el.className).split(/\s+/).includes('line--heading'), `${ml.id}: class=line--heading`);
        assertEq(el.style.textAlign, 'center', `${ml.id}: text-align ב-DOM`);
        // (ב) העברת גיאומטריה מהמודל — חסם עיגול px2 בלבד (±0.005px).
        // תיבת השורה: בטור — ביחס לתיבת הטור; בפס — ביחס לתיבת הפס.
        const left = parseFloat(el.style.left);
        const width = parseFloat(el.style.width);
        assert(Number.isFinite(left) && Number.isFinite(width), `${ml.id}: תיבת שורה בעלת left/width`);
        // **Iteration-001:** פס-H3 באמצע עמוד מעוגן לעמוד (מיכל mid-bands,
        // קואורדינטות עמוד-מוחלטות) — לא לתיבת הטור.
        const relX = ml.area === 'spanning' ? mp.spanning.x : (ml.midBand === true ? 0 : (mp.geometry.columns[ml.col] || {}).x);
        assert(relX != null && Number.isFinite(relX), `${ml.id}: תיבת ייחוס (טור/פס) קיימת בגיאומטריה`);
        assert(Math.abs(left - (ml.x - relX)) <= TOL_POS, `${ml.id}: left ב-DOM (${left}) תואם למודל (${(ml.x - relX).toFixed(4)}) בחסם ±0.005`);
        assert(Math.abs(width - ml.w) <= TOL_POS, `${ml.id}: width ב-DOM (${width}) תואם למודל (${ml.w}) בחסם ±0.005`);
        // מיקומי המילים — הפלט הגיאומטרי של המקרין; המרכוז המדויק של המודל
        // עובר כאן בשלמותו (סטייה יחידה אפשרית: העיגול ל-2 ספרות).
        const spans = el.children.filter(c => String(c.className || '').split(/\s+/).includes('w'));
        assertEq(spans.length, (ml.words || []).length, `${ml.id}: מספר מילים ב-DOM כמו במודל`);
        let inkL = Infinity, inkR = -Infinity;
        for (let i = 0; i < spans.length; i++) {
          const wd = ml.words[i];
          const sl = parseFloat(spans[i].style.left);
          assert(Number.isFinite(sl), `${ml.id}: למילה ${i} יש left`);
          assert(Math.abs(sl - (wd.x - ml.x)) <= TOL_POS,
            `${ml.id}: מיקום מילה ${i} ב-DOM (${sl}) תואם למודל (${(wd.x - ml.x).toFixed(4)}) בחסם עיגול ±0.005`);
          inkL = Math.min(inkL, sl);
          inkR = Math.max(inkR, sl + wd.w);
        }
        if (spans.length >= 2) {
          // אסימטריית מיקומי הדיו בתיבת השורה (רוחבי המילים — התוכנית הנמדדת
          // שהמקרין מעביר; חוזה תצוגה=ייצוא נבדק ב-s8d מול אותם מספרים)
          const asym = Math.abs(inkL - (width - inkR));
          assert(asym < TOL_ASYM, `${ml.id}: מרכוז מיקומי ה-DOM (אסימטריה ${asym.toExponential(2)}px, חסם ${TOL_ASYM}px)`);
        }
        // (ג) עוגן אנטומי: שורת פס חיה בתוך .spanning-band; שורת טור — לא
        let anc = el, inBand = false;
        while (anc) { if (String(anc.className || '').split(/\s+/).includes('spanning-band')) { inBand = true; break; } anc = anc.parentNode; }
        if (ml.area === 'spanning') { assert(inBand, `${ml.id}: שורת פס בתוך spanning-band`); checkedSpan++; }
        else if (ml.midBand === true) {
          assert(!inBand, `${ml.id}: שורת פס-אמצע אינה בתוך spanning-band`);
          let ancM = el, inMid = false;
          while (ancM) { if (String(ancM.className || '').split(/\s+/).includes('mid-bands')) { inMid = true; break; } ancM = ancM.parentNode; }
          assert(inMid, `${ml.id}: שורת פס-אמצע בתוך mid-bands`);
          checkedSpan++;
        }
        else { assert(!inBand, `${ml.id}: שורת טור אינה בתוך spanning-band`); checkedCol++; }
      }
    }
    assert(checkedCol >= 1, `נבדקו שורות כותרת בטור ב-DOM: ${checkedCol}`);
    assert(checkedSpan >= 1, `נבדקו שורות כותרת בפס ב-DOM: ${checkedSpan}`);
  });

  it('שורות גוף לא השתנו: שאינה-אחרונה justify, אחרונה center (ברירת המחדל)', () => {
    const doc = Array.from({ length: 12 }, (_, i) => `פסקה ${i + 1}. ${'טקסט גוף רגיל למדידת יישור השורות ברוחב הטור '.repeat(6)}`).join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawJustify = false, sawLastCenter = false;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.kind !== 'paragraph' || (ml.words || []).length < 2) continue;
        if (ml.isLast) {
          if (ml.align === 'center') sawLastCenter = true;
          else assertEq(ml.align, String(imudSettings['body-last-line-align'] || 'center'), 'שורה אחרונה לפי ההגדרה');
        } else if (ml.align === 'justify') sawJustify = true;
      }
    }
    assert(sawJustify, 'שורות גוף שאינן-אחרונות עדיין מיושרות (justify)');
    assert(sawLastCenter, 'שורה אחרונה עדיין ממורכזת (center)');
  });

  it('very_long — נעילת רגרסיה: אפס שורות כותרת שאינן ממורכזות (בכל מסלול)', () => {
    const text = fs.readFileSync(path.join(RB, '..', 'audits', 'very_long_test_text.txt'), 'utf8');
    const r = typeset(text, imudSettings, envExtras);
    const bad = [];
    let total = 0, maxAsym = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.kind !== 'heading') continue;
        total++;
        if ((ml.words || []).length >= 2) maxAsym = Math.max(maxAsym, inkAsym(ml));
        if (ml.align !== 'center') bad.push({ page: pml.index, area: ml.area || 'col', align: ml.align });
      }
    }
    // לפני התיקון: 40 שורות justify (28 עם מילים>=2 ⇒ HEAD_JUSTIFIED באודיט)
    // ו-340 שורות פס 'right'. אחרי: 574/574 center.
    assertEq(bad.length, 0, 'שורות כותרת שאינן center: ' + JSON.stringify(bad.slice(0, 5)));
    assert(total > 500, `מלאי שורות הכותרת ב-very_long: ${total}`);
    assert(maxAsym < TOL_ASYM, `אסימטריית הכותרות המרבית ב-very_long: ${maxAsym.toExponential(2)}px (חסם ${TOL_ASYM}px)`);
    assert(r.contentPreserved !== false, 'contentPreserved');
  });

  it('נייטרליות פריסה: layoutHash ומספר העמודים אינם מושפעים (המקדם גיאומטרי בלבד)', () => {
    const doc = multilineHeadingDoc();
    const a = typeset(doc, imudSettings, envExtras);
    const b = typeset(doc, imudSettings, envExtras);
    assertEq(a.layoutHash, b.layoutHash, 'דטרמיניזם — hash זהה בין שתי ריצות');
    assert(a.pages.length === b.pages.length, 'מספר עמודים זהה');
    // השוואת תוכן מילולית מלאה בין שתי הריצות — שורה-מול-שורה
    const flat = (res) => res.pageModel.pages.flatMap(p => p.lines.map(l => (l.words || []).map(w => w.text).join(' ')));
    assertEq(JSON.stringify(flat(a)), JSON.stringify(flat(b)), 'אותן שורות ואותן מילים בדיוק');
  });
});

report('s9j-head-align');
