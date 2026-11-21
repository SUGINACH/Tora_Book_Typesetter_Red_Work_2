// tests/e2e/s8a-materialization.test.js — שלב 8 פרוסה 1: materialization חד-פעמי טהור (§4.1)
//
// מכסה:
//  - טוהר: materializeDocument מבצע **אפס** מדידות טקסט ואפס נפילות על תוצר
//    ה-pipeline האמיתי (החותמות הוטבעו בזמן התכנון; הרוחבים מה-LineModel).
//  - חותמות: כל עמוד תוכן-מבני נושא את חותמתו (TOC/שער/כותרת/גיליון/נתיבים).
//  - שקילות facade: geometry-projector.projectDocument מחזיר את אותן תוצאות
//    (נתיב ה-PDF הוותיק צורך את אותו מנגנון — אין מנוע שני).
//  - רוחבי-מילה מה-LineModel: כותרת שנמדדה בגופן הכותרת מוקרנת ברוחבי המודל
//    (תיקון מחלקת תצוגה≠ייצוא: בעבר נמדדה שוב בגוף הגוף).
//  - דטרמיניזם: הקרנה כפולה ⇒ ביט-לביט; ההטבעה אינה משנה תכנון (layoutHash).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { materializeDocument, lineWidthsFromModel } = require('../../src/engine/core/materialize');
const facade = require('../../src/engine/output/geometry-projector');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const S = () => getDefaultSettings();
const CORPUS = fs.readFileSync(path.join(__dirname, '../fixtures/canonical_corpus.txt'), 'utf8');

/** מדידה עטופה במונה — הוכחת טוהר. */
function countingMeasure(settings) {
  const m = new MeasureAPI(settings, 'table');
  let calls = 0;
  const orig = m.measureTextWidth.bind(m);
  m.measureTextWidth = (...a) => { calls++; return orig(...a); };
  return { measure: m, calls: () => calls };
}

describe('שלב 8 פרוסה 1 (§4.1) — materialization חד-פעמי טהור', () => {
  it('טוהר: אפס מדידות טקסט ואפס נפילות על תוצר ה-pipeline (החותמות מהתכנון)', () => {
    const r = typeset(CORPUS, S());
    const { measure, calls } = countingMeasure(S());
    const projected = materializeDocument(r, S(), measure);
    assertEq(calls(), 0, 'measureTextWidth calls in materializeDocument');
    assertEq((projected.materializeFallbacks || []).length, 0, 'materializeFallbacks');
    assertEq(projected.pages.length, r.pages.length, 'אותו מספר עמודים');
  });

  it('חותמות: כל עמוד מבני נושא את חותמתו — TOC/שער/כותרת/גיליון/נתיבים', () => {
    const r = typeset(CORPUS, S());
    let toc = 0, shaar = 0, hdr = 0, folio = 0, lanes = 0;
    for (const p of r.pages) {
      if ((p.type === 'toc-general' || p.type === 'toc-detail') && (p.toc && p.toc.rows || []).length) {
        assert(p.tocLayout && p.tocLayout.rows.length === p.toc.rows.length, 'חותמת TOC לכל שורה');
        toc++;
      }
      if (/^shaar-(main|sub|back)/.test(p.type) && p.type !== 'shaar-back') {
        if (p._metadata || (p.toc == null)) { /* עמוד שער עם תוכן מבנה */ }
      }
      if (p.shaarLayout) shaar++;
      if (p.header && p.header.slots) {
        const withText = ['right', 'center', 'left'].some(pos => p.header.slots[pos] && p.header.slots[pos].text);
        if (withText) { assert(p.headerSlotGeo, 'חותמת סלוטי כותרת'); hdr++; }
      }
      if (p.folioDisplay) { assert(p.folioGeo, 'חותמת גיליון'); folio++; }
      if (p.footnotes && p.footnotes.length) { assert(p.footnoteLanes, 'חותמת נתיבים'); lanes++; }
    }
    assert(toc >= 1, `עמודי TOC הוטבעו (${toc})`);
    assert(shaar >= 1, `עמודי שער הוטבעו (${shaar})`);
    assert(hdr >= 1, `כותרות עליונות הוטבעו (${hdr})`);
    assert(folio >= 1, `גיליונות הוטבעו (${folio})`);
    assert(lanes >= 1, `נתיבי מרזב הוטבעו (${lanes})`);
  });

  it('facade שקול: geometry-projector.projectDocument = אותו מנגנון (אין מנוע שני)', () => {
    const r = typeset(CORPUS, S());
    const viaFacade = facade.projectDocument(r, S());
    const viaMaterialize = materializeDocument(r, S());
    assertEq(viaFacade.pages.length, viaMaterialize.pages.length, 'אותם עמודים');
    // אותם מיקומי מילים ביט-לביט (דגימת עמודים)
    for (let i = 0; i < viaFacade.pages.length; i += 7) {
      const a = viaFacade.pages[i], b = viaMaterialize.pages[i];
      const wa = a.lines.flatMap(l => l.words.map(w => `${w.text}@${w.x}`)).join(',');
      const wb = b.lines.flatMap(l => l.words.map(w => `${w.text}@${w.x}`)).join(',');
      assertEq(wa, wb, `עמוד ${i}: מיקומי מילים זהים דרך שתי הכניסות`);
    }
  });

  it('רוחבי-מילה מה-LineModel: כותרת בגופן משלה מוקרנת ברוחבי המודל (תצוגה=ייצוא)', () => {
    const r = typeset(CORPUS, S());
    let headings = 0, fromModel = 0;
    for (const p of r.pages) {
      for (const ln of [...(p.spanning ? p.spanning.lines : []), ...p.columns.flat()]) {
        if (ln.kind !== 'heading') continue;
        headings++;
        const lm = lineWidthsFromModel(ln);
        if (lm && lm.widths.length === (ln.words || []).length) fromModel++;
      }
    }
    assert(headings > 0, `כותרות נבדקו (${headings})`);
    assertEq(fromModel, headings, 'כל שורות הכותרת נצרכות מה-LineModel');
  });

  it('ההטבעה אינה משנה תכנון: layoutHash זהה לנעילה; ההקרנה דטרמיניסטית', () => {
    const r = typeset(CORPUS, S());
        // **Iteration-001 (legacy parity — 22.11):** נעילה מחודשת fdff19d8→8a6b23bd —
    // פסי H3 באמצע העמוד כמו המקור; 37=37 עמודים; contentPreserved=true.
    // דוח: audits/legacy-parity-iteration/iteration-001/.
    assert(r.layoutHash.startsWith('8a6b23bd'), `layoutHash נשמר (${r.layoutHash.slice(0, 8)})`);
    const p1 = materializeDocument(r, S());
    const p2 = materializeDocument(r, S());
    const key = (x) => JSON.stringify(x.pages.map(pg => pg.lines.map(l => l.words.map(w => [w.text, w.x, w.w]))));
    assertEq(key(p1), key(p2), 'הקרנה כפולה ⇒ ביט-לביט');
  });

  it('נפילה גלויה: קלט סינתטי בלי חותמות ⇒ facade מטביע וה-materialization מדווח במונה', () => {
    // עמוד TOC סינתטי בלי tocLayout — ה-facade מטביע; ה-fallbacks של ההקרנה
    // הישירה (בלי facade) מדווחים — אין שקט.
    const page = {
      index: 0, type: 'toc-general', folioDisplay: '', footnotes: [],
      toc: { rows: [{ kind: 'row', text: 'שורה א', label: 'א' }] },
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 674 }], contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0 },
      columns: [[]], sideNotes: []
    };
    const direct = materializeDocument({ pages: [page], layoutHash: 'x' }, S());
    assert((direct.materializeFallbacks || []).length > 0, 'הקרנה ישירה בלי חותמה ⇒ נפילות מדווחות');
    const page2 = {
      index: 0, type: 'toc-general', folioDisplay: '', footnotes: [],
      toc: { rows: [{ kind: 'row', text: 'שורה א', label: 'א' }] },
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 674 }], contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0 },
      columns: [[]], sideNotes: []
    };
    const viaFacade = facade.projectDocument({ pages: [page2], layoutHash: 'x' }, S());
    assertEq((viaFacade.materializeFallbacks || []).length, 0, 'facade מטביע ⇒ אפס נפילות');
    assert(viaFacade.pages[0].lines.length === direct.pages[0].lines.length, 'אותן שורות בשני הנתיבים');
  });
});

report('s8a-materialization');
