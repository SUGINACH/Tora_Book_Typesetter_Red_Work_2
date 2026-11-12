// tests/e2e/s68-pdf-word-scales.test.js — S68: R2-M6 — סקאלות paren/customSpans בהקרנת PDF
// הפער שנסגר: המודל נמדד בסקאלות (paren-style-scale × מילות סוגריים; גורם גודל
// לסגנונות inline מותאמים) וה-DOM מציג אותן כך (span.w--paren / span.w--custom),
// אבל ההקרנה ל-PDF מדדה כל מילה בגודל השורה המלא — והסוגריים חרגו מה-DOM.
// תיקון: גודל אפקטיבי פר-מילה ב-projectLine; ה-pdf-writer מכבד w.sizePt ממילא.
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { projectDocument, projectLine } = require('../../src/engine/output/geometry-projector');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

const CUSTOM_STYLES = JSON.stringify([
  { id: 'qatan', name: 'קטן', trigger: { inlineMarker: { open: '«', close: '»' } }, layoutMode: 'regular', style: { fontSizePt: 10 } },
]);

// =====================================================================
describe('S68-1 — projectLine: גודל אפקטיבי פר-מילה (יחידה)', () => {
  const mkMeasure = (s) => new MeasureAPI(s, 'table');

  it('מילת סוגריים בסקאלה 0.85 ⇒ נמדדת ומסומנת בגודל מוקטן; מילים רגילות לא נוגעות', () => {
    const s = { ...getDefaultSettings(), 'paren-style-scale': 0.85 };
    const ln = {
      kind: 'paragraph', heightPx: 21, words: ['ראשונה', 'שניה', 'שלישית'],
      parenSpans: [1], // המילה השנייה בסוגריים
    };
    const out = projectLine(ln, 100, 200, 269.41, s, mkMeasure(s), 'justify');
    assert(out.words[0].sizePt === undefined, 'regular word has no per-word size (neutrality)');
    assert(Math.abs(out.words[1].sizePt - 14 * 0.85) < 0.01, `paren word scaled, got ${out.words[1].sizePt}`);
    assert(out.words[2].sizePt === undefined, 'third word untouched');
    // הרוחב של מילת הסוגריים נמדד בגודל האפקטיבי — צר מהמדידה בגודל מלא
    const m = mkMeasure(s);
    const fullW = m.measureTextWidth('שניה', 14);
    assert(out.words[1].w < fullW, 'paren word measured narrower than full-size');
  });

  it('מילת סגנון מותאם (fontSizePt 10 מול גוף 14) ⇒ גורם 10/14 מוחל', () => {
    const s = { ...getDefaultSettings(), _customStyles: CUSTOM_STYLES };
    const ln = {
      kind: 'paragraph', heightPx: 21, words: ['רגילה', 'מותאמת', 'רגילה2'],
      customSpans: [{ wi: 1, styleId: 'qatan' }],
    };
    const out = projectLine(ln, 100, 200, 269.41, s, mkMeasure(s), 'justify');
    const factor = 10 / 14;
    assert(Math.abs(out.words[1].sizePt - 14 * factor) < 0.01, `custom word scaled, got ${out.words[1].sizePt}`);
    assert(out.words[0].sizePt === undefined && out.words[2].sizePt === undefined, 'others untouched');
  });

  it('סקאלה 1.0 (ברירת המחדל) ובלי סגנונות ⇒ אף מילה אינה מסומנת — נייטרליות מלאה', () => {
    const s = getDefaultSettings();
    const ln = { kind: 'paragraph', heightPx: 21, words: ['אחת', 'שתיים', 'שלוש'] };
    const out = projectLine(ln, 100, 200, 269.41, s, mkMeasure(s), 'justify');
    for (const w of out.words) assert(w.sizePt === undefined, 'no per-word size at defaults');
  });

  it('סגנון שבור (JSON שגוי בזיכרון) ⇒ לא קורס — המילה נשארת בגודל השורה', () => {
    const s = { ...getDefaultSettings(), _customStyles: '<<<not-json>>>' };
    const ln = { kind: 'paragraph', heightPx: 21, words: ['מילה'], customSpans: [{ wi: 0, styleId: 'x' }] };
    const out = projectLine(ln, 100, 200, 269.41, s, mkMeasure(s), 'justify');
    assertEq(out.words[0].sizePt, undefined, 'broken style → word stays at line size');
  });
});

// =====================================================================
describe('S68-2 — אינטגרציה: הקורפוס עם paren-scale — ההקרנה תואמת את המודל', () => {
  it('כל מילה מסומנת-סוגריים במודל מוקרנת בגודל מוקטן; השורה אינה חורגת מהטור', () => {
    const s = { ...getDefaultSettings(), 'paren-style-scale': 0.85 };
    const r = typeset(CORPUS, s);
    assert(r.contentPreserved === true, 'content preserved with paren scale');
    // איסוף שורות עם parenSpans מהמודל
    let parenLines = 0;
    for (const pg of r.pages) {
      for (const col of (pg.columns || [])) {
        for (const ln of col) if (ln.parenSpans && ln.parenSpans.length) parenLines++;
      }
    }
    assert(parenLines > 0, `corpus exercises paren spans (got ${parenLines} lines)`);
    // הקרנה: כל מילת parenSpans קיבלה sizePt מוקטן, ואף מילה לא חורגת מהטור
    const proj = projectDocument(r, s);
    let scaledWords = 0, overflow = 0;
    for (const pl of proj.pages) {
      for (const ln of pl.lines) {
        for (const w of ln.words) {
          if (w.sizePt != null && Math.abs(w.sizePt - 14 * 0.85) < 0.05) scaledWords++;
          if (w.x < ln.x - 0.5 || w.x + w.w > ln.x + ln.w + 0.5) overflow++;
        }
      }
    }
    assert(scaledWords > 0, `projection contains scaled paren words (got ${scaledWords})`);
    assertEq(overflow, 0, 'no word overflows its column in the projection');
  });

  it('נייטרליות ברירת המחדל: בלי paren-scale ובלי סגנונות ⇒ שורות הגוף אינן מסומנות בגודל פרטי', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    const proj = projectDocument(r, getDefaultSettings());
    // שורות גוף בלבד — להערות/כותרות-עזר יש גדלים פר-מילה חוקיים מלכתחילה
    // (fnbody / שורות שער) שאינם קשורים לשינוי הזה.
    let marked = 0;
    for (const pl of proj.pages) for (const ln of pl.lines) {
      if (ln.kind !== 'paragraph' && ln.kind !== 'heading') continue;
      for (const w of ln.words) if (w.sizePt != null) marked++;
    }
    assertEq(marked, 0, 'default body projection unchanged (no per-word sizes)');
  });

  it('מסמך עם סגנון inline מותאם ⇒ מילות הסגנון מוקרנות בגודלן האמיתי', () => {
    const doc = [
      'ספר - מסמך סגנונות',
      'נושא - בדיקה',
      '',
      'כותרת 2 - פרק',
      'פסקה ראשונה עם טקסט מסוגנן «מילים בסגנון הקטן» בתוך הגוף ועוד מילים רגילות למילוי השורה כולה.',
      'פסקה שנייה רגילה לחלוטין בלי שום סגנון בכלל ובלי טריגרים.',
    ].join('\n');
    const s = { ...getDefaultSettings(), _customStyles: CUSTOM_STYLES };
    const r = typeset(doc, s);
    assert(r.contentPreserved === true, 'content preserved with custom styles');
    let modelCustomWords = 0;
    for (const pg of r.pages) for (const col of (pg.columns || [])) for (const ln of col) {
      modelCustomWords += (ln.customSpans || []).length;
    }
    assert(modelCustomWords > 0, `custom spans present in model (got ${modelCustomWords})`);
    const proj = projectDocument(r, s);
    let scaled = 0;
    for (const pl of proj.pages) for (const ln of pl.lines) for (const w of ln.words) {
      if (w.sizePt != null && Math.abs(w.sizePt - 10) < 0.05) scaled++;
    }
    assert(scaled > 0, `custom words projected at 10pt (got ${scaled})`);
  });

  it('דטרמיניזם: שתי הקרנות של אותו ריצה ⇒ מיקומי מילים זהים', () => {
    const s = { ...getDefaultSettings(), 'paren-style-scale': 0.85 };
    const r = typeset(CORPUS, s);
    const a = projectDocument(r, s), b = projectDocument(r, s);
    const key = (p) => JSON.stringify(p.pages.map((pg) => pg.lines.map((ln) => ln.words.map((w) => [w.x, w.w, w.sizePt || null]))));
    assertEq(key(a), key(b), 'projection deterministic');
  });
});

// =====================================================================
describe('S69 (R4-M3) — עוגן הגיליון בהקרנה: מה-CSS החי (bottom:25px), לא קירוב', () => {
  it('הבסיס נגזר מתחתית העמוד במקום קירוב contentBox.bottom+2', () => {
    const s = getDefaultSettings();
    const r = typeset(CORPUS, s);
    const proj = projectDocument(r, s);
    const withFolio = proj.pages.filter((p) => p.folio);
    assert(withFolio.length > 0, 'corpus has folio pages');
    for (const pl of withFolio) {
      const f = pl.folio;
      // הקירוב הישן היה מציב בסיס ב-~1114.5 (contentBox.bottom+2+10); ה-CSS החי
      // מציב את תיבת הגיליון ב-25px מתחתית ⇒ הבסיס נמוך מ-~1105
      assert(f.baselineY < 1106, `baseline from CSS bottom:25px anchor, got ${f.baselineY}`);
      assert(f.baselineY > 1070, `baseline still in the folio band (audit ≥1022.2), got ${f.baselineY}`);
      // תיבת הגיליון: ראשה ב-pageH-25-lineH
      // **S75 (בקשה 2):** גובה התיבה נגזר מהגודל בהגדרות (11pt בברירת המחדל
      // החדשה — ליבורנה מודגש כמדידת הייחוס; עד S74 היה 10pt קבוע).
      const folioLineH = Math.round((Number(s['page-num-size-pt']) * 96 / 72) * 1.2);
      assert(Math.abs(f.y - (pl.height - 25 - folioLineH)) < 0.51, `box top anchored to CSS, got ${f.y}`);
    }
  });

  it('top/in-header נעוגים ל-4px/6px מראש העמוד כמו ה-CSS', () => {
    for (const pos of ['top', 'in-header']) {
      const s = { ...getDefaultSettings(), 'page-num-position': pos };
      const r = typeset(CORPUS, s);
      const proj = projectDocument(r, s);
      const withFolio = proj.pages.filter((p) => p.folio);
      assert(withFolio.length > 0, `folio present in ${pos}`);
      for (const pl of withFolio) {
        const cssTop = pos === 'top' ? 4 : 6;
        assert(Math.abs(pl.folio.y - cssTop) < 0.01, `${pos}: box top at ${cssTop}px, got ${pl.folio.y}`);
        assert(pl.folio.baselineY > cssTop && pl.folio.baselineY < cssTop + 24, `${pos}: baseline inside the line box`);
      }
    }
  });

  it('דטרמיניזם: בסיס הגיליון זהה בין הקרנות', () => {
    const s = getDefaultSettings();
    const r = typeset(CORPUS, s);
    const a = projectDocument(r, s), b = projectDocument(r, s);
    const key = (p) => JSON.stringify(p.pages.map((pg) => pg.folio && [pg.folio.x, pg.folio.y, pg.folio.baselineY]));
    assertEq(key(a), key(b), 'folio anchor deterministic');
  });
});

report('s68-pdf-word-scales');
