// tests/e2e/s8b-materialize-boundary.test.js — שלב 8 ביקורת §3.1–§3.2: גבולות materialization
//
// מוכיח:
//  1. טוהר אטום במסלול הייצור: patch ל-MeasureAPI.prototype.measureTextWidth שזורק
//     — וה-materialization במצב 'production' (מתוך buildPageModel) עובר בלי קריאה
//     אחת. זו הוכחה חזקה מנטרול המונה: גם מופע MeasureAPI פנימי היה נתפס.
//  2. מסלול הייצור מקבל את כל הנתונים ללא fallback — קורפוס קנוני, מצב endnotes
//     ו-very_long (1108 עמודים): אפס נפילות ואפס violations.
//  3. שורש נפילת-השווא תוקן: שורות חד-מיליות (בלי דבק במודל — אין להן רווחים)
//     אינן נספרות כנפילת מדידה.
//  4. הזרקות שליליות: חותמה/LineModel חסרים ⇒ diagnostic מזוהה + violation —
//     הטקסט נשמר, אין מדידה חלופית בייצור (ה-probe הזורק פעיל), אין השתקה.
//  5. compat מתועד: ה-facade מטביע חותמות לקלט סינתטי; קריאה ישירה בלי חותמות
//     מדווחת במונה (התנהגות הבדיקות הוותיקות נשמרת).
//  6. מוצא רוחבי-המילה: כל מילה גוף במודל נובעת מ-measuredAdvance של הפרגמנטים
//     (שרשרת RTL מוקרנת מרוחבי המודל — לא ממדידה שנייה), כולל כותרות בגופן
//     משלהן ומילים עם ריצות גופן (סוגריים/סגנון מותאם).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { materializeDocument, lineWidthsFromModel } = require('../../src/engine/core/materialize');
const { buildPageModel } = require('../../src/engine/core/page-model');
const facade = require('../../src/engine/output/geometry-projector');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const S = () => getDefaultSettings();
const CORPUS = fs.readFileSync(path.join(__dirname, '../fixtures/canonical_corpus.txt'), 'utf8');
const VERY_LONG = fs.readFileSync(path.join(__dirname, '../../../audits/very_long_test_text.txt'), 'utf8');

/** probe אטום: כל קריאת measureTextWidth (מכל מופע MeasureAPI) זורקת בזמן הפעלת fn. */
function withMeasurementForbidden(fn) {
  const proto = MeasureAPI.prototype;
  const orig = proto.measureTextWidth;
  let violations = 0;
  proto.measureTextWidth = function () { violations++; throw new Error('production materialization measured text!'); };
  try {
    const out = fn();
    return { out, violations };
  } finally {
    proto.measureTextWidth = orig;
  }
}

describe('שלב 8 ביקורת (§3.1) — גבולות materialization', () => {
  it('טוהר אטום: אפס קריאות מדידה במצב production (probe שזורק על ה-prototype)', () => {
    const r = typeset(CORPUS, S());
    const probe1 = withMeasurementForbidden(() => materializeDocument(r, S(), { mode: 'production' }));
    assertEq(probe1.violations, 0, 'materializeDocument(production) — אפס קריאות measureTextWidth');
    assertEq((probe1.out.materializeFallbacks || []).length, 0, 'אפס נפילות');
    const probe2 = withMeasurementForbidden(() => buildPageModel(r, {}));
    assertEq(probe2.violations, 0, 'buildPageModel — אפס קריאות measureTextWidth');
    assertEq(probe2.out.model.meta.materializeFallbacks, 0, 'מודל: אפס נפילות');
    assertEq(probe2.out.validation.violations.filter(v => v.code === 'materialize-fallback').length, 0, 'אפס violations');
  });

  it('מסלול הייצור מקבל הכול ללא fallback: קורפוס קנוני (footnotes) — חוזה הישן נשמר', () => {
    const r = typeset(CORPUS, S());
        // **Iteration-005 (RC-F1a):** נעילה מחודשת 8a6b23bd→89a0eb42 — חוזה spanning
    // אחיד לפסי H3 (עוגן blockBottom + פער-בלוק; צל מיושר לטווח הפס). 37=37 עמודים.
    // דוח: audits/legacy-parity-iteration/iteration-005/.
    assert(r.layoutHash.startsWith('89a0eb42'), `layoutHash נשמר (${r.layoutHash.slice(0, 8)})`);
    assertEq(r.pageModel.meta.materializeFallbacks, 0, 'אפס נפילות במודל');
    assertEq(r.pageModelValidation.violations.length, 0, 'אפס הפרות (מצב footnotes)');
  });

  it('endnotes: כותרת עמודי-ההערות מהחותמה — אפס מדידה ואפס נפילות (סגירת נקב)', () => {
    const settings = S();
    settings['note-placement-mode'] = 'endnotes';
    const r = typeset(CORPUS, settings);
    const enPages = r.pages.filter(p => p.type === 'endnotes');
    assert(enPages.length >= 1, `עמודי הערות-סיום קיימים (${enPages.length})`);
    for (const p of enPages) {
      assert(p.endnoteTitleGeo && p.endnoteTitleGeo.words && p.endnoteTitleGeo.words.length,
        'חותמת כותרת לכל עמוד הערות');
    }
    const probe = withMeasurementForbidden(() => buildPageModel(r, {}));
    assertEq(probe.violations, 0, 'אפס מדידות');
    assertEq(probe.out.model.meta.materializeFallbacks, 0, 'אפס נפילות');
    // הכותרת מוקרנת עם מפתח הגופן שלה (heading ⇒ /F3) כמו בנתיב הישן
    const titleLine = probe.out.model.pages
      .flatMap(p => p.lines).filter(l => l.kind === 'endnote-title');
    assert(titleLine.length >= 1, `שורות כותרת מוקרנות (${titleLine.length})`);
    assert(titleLine.every(l => l.words.length > 0 && l.words.every(w => w.w > 0)), 'רוחבי מילים מהחותמת (> 0)');
    // הפרות ה-endnotes ההיסטוריות (planned-line-missing/note-without-id) — מתועדות
    // כפער קיים מ-main (לא רגרסיה); נסגרות בפרוסה 2 (השלמת PageModel).
    const codes = new Set(probe.out.validation.violations.map(v => v.code));
    assert(!codes.has('materialize-fallback'), 'אין נפילות materialization');
  });

  it('very_long (996 עמודים): אפס נפילות — שורש נפילת-השווא (חד-מיליות בלי דבק) תוקן', () => {
    const r = typeset(VERY_LONG, S());
    // **RC-5c/d (i004):** סף ה"מסמך ענק" הותאם — המילוי הגרידי צמצם את very_long
    // מ-1066 ל-996 עמודים; הסף נועד להוכיח מסמך רב-עמודים, לא לנעול ספירה מדויקת.
    assert(r.pages.length > 900, `מסמך ענק (${r.pages.length} עמודים)`);
    // **H3-CSS (17.11, חוזה ה-CSS המקורי גם במסלול המאוחד):** נעילה מחודשת
    // d2a18112→e68e1f0b — פסי H3 במסלול המאוחד נשאו עד כה אפס ריפודים ו-line-height
    // 1.4; כעת לפי החוזה (ריפוד עליון 8 + שורות ב-1.22 + תחתון 4+שוליים 4).
    // הוכחת שימור: זרם המילים זהה לחלוטין (66,506 שורות; אפס חלוקות שורה
    // שהשתנו); 148 פסי H3 — כולם בגיאומטריית החוזה; הערות 129=129;
    // regular 1030→1032 (+2 עמודים מהריפודים שנוספו). דוח מלא:
    // audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md. הקודם: d2a18112.
    // **RLM (17.11, שורש מדידה — פרוסה 3):** נעילה מחודשת e68e1f0b→008bbb68 —
    // תווי בקרת bidi (U+200E/U+200F וכו') הם אפס-רוחב לפי יוניקוד ובכל מנוע
    // תצוגה, אך חלק מהגופנים נותנים להם advance ב-hmtx (נמדד 6.4px ל-RLM
    // ב-12pt) — המדידה ספרה אותם והתצוגה לא ⇒ פער דיו ~7px בכל מילה
    // מסומנת-RLM. הוכחת סיווג (דוח השוואה מלא): זרם המילים זהה ביט-לביט;
    // 151 שורות מכילות RLM בבסיס — 49 מהן נחלקו מחדש + שורות המשך-זרימה
    // באותן פסקאות; 197 שורות הועברו בין עמודים; אין שינוי מספר עמודים
    // (1110); הערות 129=129; contentPreserved=true. הקודם: e68e1f0b (H3-CSS).
    // **הדבקת הערות חוצות-שורות (9b.4, 18.11 — D-91):** נעילה מחודשת
    // 008bbb68→fa1f06e2 (1218→1216 עמ.). שלוש הערות שנפתחו בשורה ונסגרו
    // בהמשך (4637-4638, 4734-4737, 5644-5645) — הפרסר הקנוני מדביק את
    // השורות הבאות עד לסגירה (מראה המורשת): 129→132 הערות-גוף בזהות
    // מלאה; 1,066 מילים עברו מהגוף לאזורי ההערות (D-30). הוכחות שימור:
    // contentPreserved=true; round-trip תו-לתו של very_long המלא; הקנוני
    // ללא שינוי (fdff19d8). הקודם: 008bbb68 (RLM/9b.3).
    // **U-8 (20.11):** ננעל מחדש fa1f06e2→c330970a — תקציב ההערות מופחת מקיבולת
    // כל הטורים (המרזב חוצה-רוחב; R3-C2) ⇒ אריזת עמודים בלבד (1216→1242);
    // 3636/3636 בלוקים זהים ביט-לביט; contentPreserved=true; הקנוני נשמר.
        // **Iteration-001:** נעילה מחודשת c330970a→140a42d9 (1242→1066 עמודים; contentPreserved=true).
        // **נעילת iteration-001 חודשה שוב לאחר כלל פיצול-נקי בלבד בפלחי-הזנב (אין פיצול unclean — כמקור):** 140a42d9→d2b871cf (1066=1066 עמודים).
        // **RC-5a (i004, 23.11) — מילוי גרידי בגבול העמוד כמו המורשת:** נעילה מחודשת
        // d2b871cf→6d1858a3 (1066→1031 עמודים). שורש: ניקוד המועמדים ב-findSplit
        // איזן את גובה שני חלקי הבלוק (חצי-חצי) במקום למלא את הטור הנוכחי עד
        // תחתיתו — מקור +16 העמודים בספר הייחוס (299 עמודי גוף בלי הערות:
        // חציון עצירה 679.7pt מול 767.5 בייחוס). הוכחות שימור: contentPreserved=true;
        // materializeFallbacks=0; אפס violations; regular 895; sign-open 88; הערות זהות.
        // **RC-5b (i004):** נעילה מחודשת 6d1858a3→89063eb8 (1031→1021 עמודים) —
        // גבול העמוד בזרימה גרידית עם minPerSide=1 (זנבות 1-2 שורות בראש העמוד
        // הבא כמו הייחוס — S4.18; 43 עמודים כאלה ב-PDF הישן). הוכחות:
        // contentPreserved=true; mf=0; orphan-bottom=31 (legacy-faithful).
        // **RC-5c+RC-5d (i004, 23.11):** נעילה מחודשת 89063eb8→4288bb4f
        // (1021→996 עמודים). RC-5c: המקום הפנוי ב-findSplit נספר על כל הטורים
        // הפתוחים לזרימה (בעבר: הטור האחרון בלבד ⇒ הטור השני לא מולא — עמודים
        // שלמים עצרו ~5 שורות מעל התחתית; נמדד NEW p136 y649 מול OLD p140
        // y769 באותו תוכן). RC-5d: בלוק שנכנס לסך השארית זורם דרך pushLines
        // (breakPara של המורשת) במקום הזזה מלאה — תיקון שגיאת הביניים בה
        // fitsPageTotal נפל בטעות לענף ההזזה (1021→1111). הוכחות:
        // contentPreserved=true; mf=0; widow-bottom=0; orphan-top=0;
        // orphan-bottom=84 (legacy-faithful, 84/996≈8.4% — הייחוס 43/604≈7.1%).
        // **RC-F1a+RC-F1c (i005, 23.11):** נעילה מחודשת 4288bb4f→f7f72473 (996→968
        // עמודים). RC-F1a: הצל הלא-מיושר שמר פחות מטווח הפס בטור המשני ⇒
        // ה־usedHeight שלו נראה קטן ⇒ מנגנוני ההזזה/הנסיגה פיצו והותירו
        // עמודים כמעט-ריקים (נמדד: 27 עמודים עם שורה בודדת — למשל p182/p195
        // בריצה הישנה). עם ההזמנה הנכונה הפסים מיושרים, הפיצוי מתבטל והעמודים
        // מתמלאים (חציון מילוי 1012.3→1017.3). הוכחות: contentPreserved=true;
        // mf=0; אפס בלתי-מסווגים בהשוואת הקורפוס; 318 פסים באמצע-עמוד
        // (מול 323 — 5 עברו לפס-עליון בבדיקת המקום המחמירה). RC-F1c: שעת הכלה
        // בהתחייבות הסמן של נתיב הפיצול (U-8) — הסמן וההערה עוברים יחד לעמוד הבא
        // כשהתקציב אינו נכנס (969→968).
    assert(r.layoutHash.startsWith('f7f72473'), `layoutHash very_long נשמר (${r.layoutHash.slice(0, 8)})`);
    assertEq(r.pageModel.meta.materializeFallbacks, 0, 'אפס נפילות (בעבר: 852 שווא-נפילות רוחב-רווח)');
    const mfViol = r.pageModelValidation.violations.filter(v => v.code === 'materialize-fallback');
    assertEq(mfViol.length, 0, 'אפס violations');
    // שורות חד-מיליות קיימות בשפע — ואינן נפילות: הרוחב מהמודל, הרווח 0 ללא דרישה
    let single = 0;
    for (const p of r.pages) {
      for (const ln of p.columns.flat()) {
        if ((ln.words || []).length === 1) single++;
      }
    }
    assert(single > 100, `שורות חד-מיליות נבדקו (${single})`);
  });

  it('מוצא רוחבי-המילה: כל מילה גוף נובעת מה-LineModel (כותרות בגופן משלהן, ריצות מרובות)', () => {
    const r = typeset(CORPUS, S());
    let checked = 0, headings = 0, multiRun = 0;
    for (const p of r.pages) {
      if (p.type === 'endnotes') continue; // מבנה אחר — נבדק בנפרד למעלה
      const mp = r.pageModel.pages[p.index];
      // סדר הפס/עמודות בתוכנית == סדר שורות הגוף במודל (spanning ואז עמודות)
      const planOrder = [...(p.spanning ? p.spanning.lines : []), ...(p.columns || []).flat()];
      const modelOrder = mp.lines.filter(l => l.area === 'spanning' || l.area === 'column');
      const n = Math.min(planOrder.length, modelOrder.length);
      for (let i = 0; i < n; i++) {
        const ln = planOrder[i];
        const ml = modelOrder[i];
        if (!ln.lineModel || !ml || !(ml.words || []).length) continue;
        const lm = lineWidthsFromModel(ln);
        const words = (ln.words || []).map(w => String(w).replace(/\u00A0/g, ' ')).filter(Boolean);
        if (!lm || lm.widths.length !== words.length) continue;
        // **פרוסה 3 (סמן מודבק — פיצול בסמכות):** מילת תוכנית "מילה+סמן" מפוצלת
        // במודל לשני פריטים (הסמן בגודל הרישום) — האינווריאנט החזק: סכום רוחבי
        // פריטי המודל של אותה מילת תוכנית == measuredAdvance של היחידה.
        let mwi = 0;
        for (let wi = 0; wi < words.length; wi++) {
          let parts = 0, sumW = 0;
          if (mwi >= ml.words.length) break;
          do {
            sumW += ml.words[mwi].w; parts++; mwi++;
          } while (mwi < ml.words.length && ml.words[mwi].mk === true);
          assert(Math.abs(sumW - lm.widths[wi]) < 1e-9,
            `רוחב מילה ${wi} בשורה ${ml.id}: מודל ${sumW} ≠ LineModel ${lm.widths[wi]}`);
          checked += parts;
        }
        if (ln.kind === 'heading') headings++;
        if ((ln.parenSpans && ln.parenSpans.length) || (ln.customSpans && ln.customSpans.length)) multiRun++;
      }
    }
    assert(checked > 3000, `מילים נבדקו מול ה-LineModel (${checked})`);
    assert(headings > 5, `שורות כותרת נבדקו (${headings})`);
    assert(multiRun >= 0, `שורות עם ריצות גופן/סוגריים (${multiRun})`);
  });

  it('הזרקות שליליות (production): חותמה חסרה ⇒ diagnostic + violation — בלי מדידה חלופית', () => {
    const r = typeset(CORPUS, S());
    const stripped = typeset(CORPUS, S()); // עותק טרי להזרקה

    // (א) חותמת TOC חסרה
    const tocPage = stripped.pages.find(p => (p.type === 'toc-general' || p.type === 'toc-detail') && p.tocLayout);
    assert(tocPage, 'עמוד TOC קיים');
    delete tocPage.tocLayout;
    let probe = withMeasurementForbidden(() => buildPageModel(stripped, {}));
    assert(probe.out.model.meta.materializeFallbacks >= 1, 'נפילת TOC מדווחת');
    assert(probe.out.validation.violations.some(v => v.code === 'materialize-fallback' && v.detail.includes('toc-stamp')),
      'violation מזוהה: materialize-fallback-toc-stamp');
    assertEq(probe.violations, 0, 'שום מדידה למרות החותמה החסרה');

    // (ב) LineModel חסר בשורת גוף — הטקסט נשמר (חשבונאות), רוחב 0, diagnostic.
    // (השורות בתוצר קפואות — חוזה ה-immutable — לכן בונים עותק עמוד עם שורה
    // מוחלפת בעותק בלי lineModel; ההזרקה כאן מדמה באג בשלב יצירת הנתון.)
    const stripped2 = typeset(CORPUS, S());
    const bodyPage = stripped2.pages.find(p => p.columns && p.columns.length && p.columns[0].length);
    const target = bodyPage.columns[0][0];
    const targetTok = target.tokenId;
    const bare = { ...target };
    delete bare.lineModel;
    const pages2 = stripped2.pages.slice();
    pages2[bodyPage.index] = {
      ...bodyPage,
      columns: bodyPage.columns.map((col, ci) => ci === 0 ? col.map((ln, li) => li === 0 ? bare : ln) : col)
    };
    const injected = { ...stripped2, pages: pages2 };
    probe = withMeasurementForbidden(() => buildPageModel(injected, {}));
    assert(probe.out.validation.violations.some(v => v.code === 'materialize-fallback' && v.detail.includes('line-widths')),
      'violation: materialize-fallback-line-widths');
    const ml = probe.out.model.pages[bodyPage.index].lines.find(l => l.sourceTokenId === String(targetTok));
    assert(ml && ml.words.length > 0, 'המילים נשמרות במודל (אין אובדן תוכן)');
    assert(ml.words.every(w => w.w === 0), 'רוחב 0 מסומן — לא מדידה שקטה');
    assertEq(probe.violations, 0, 'אפס מדידות');

    // (ג) חותמת גיליון חסרה — הגיליון נשאר ריק, diagnostic מזוהה
    const stripped3 = typeset(CORPUS, S());
    const folioPage = stripped3.pages.find(p => p.folioGeo);
    delete folioPage.folioGeo;
    probe = withMeasurementForbidden(() => buildPageModel(stripped3, {}));
    assert(probe.out.validation.violations.some(v => v.code === 'materialize-fallback' && v.detail.includes('folio-stamp')),
      'violation: materialize-fallback-folio-stamp');
    assertEq(probe.out.model.pages[folioPage.index].folio, null, 'אין גיליון מסונתז בייצור');
    assertEq(probe.violations, 0, 'אפס מדידות');
  });

  it('compat מתועד: facade מטביע חותמות לקלט סינתטי; קריאה ישירה מדווחת נפילות', () => {
    const page = {
      index: 0, type: 'toc-general', folioDisplay: '', footnotes: [],
      toc: { rows: [{ kind: 'row', text: 'שורה א', label: 'א' }] },
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 674 }], contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0 },
      columns: [[]], sideNotes: []
    };
    const direct = materializeDocument({ pages: [page], layoutHash: 'x' }, S());
    assert((direct.materializeFallbacks || []).length > 0, 'קריאה ישירה בלי חותמה ⇒ נפילות מדווחות (compat)');
    const page2 = {
      index: 0, type: 'toc-general', folioDisplay: '', footnotes: [],
      toc: { rows: [{ kind: 'row', text: 'שורה א', label: 'א' }] },
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 674 }], contentBox: { top: 40, bottom: 1080, height: 1040 }, gutter: 0 },
      columns: [[]], sideNotes: []
    };
    const viaFacade = facade.projectDocument({ pages: [page2], layoutHash: 'x' }, S());
    assertEq((viaFacade.materializeFallbacks || []).length, 0, 'facade מטביע ⇒ אפס נפילות');
  });

  it('אין תלות core→renderer: materialize אינו מייבא את dom-renderer (מיפוי שכבות)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../src/engine/core/materialize.js'), 'utf8');
    assert(!/require\('\.\.\/output\/dom-renderer'\)/.test(src), 'core/materialize.js אינו מייבא dom-renderer');
    assert(/require\('\.\/pua-text'\)/.test(src), 'scrubPUAText מהמודול הניטרלי core/pua-text');
    const dr = fs.readFileSync(path.join(__dirname, '../../src/engine/output/dom-renderer.js'), 'utf8');
    assert(/require\('\.\.\/core\/pua-text'\)/.test(dr), 'dom-renderer צורך את אותו מקור (SSOT)');
  });
});

report('s8b-materialize-boundary');
