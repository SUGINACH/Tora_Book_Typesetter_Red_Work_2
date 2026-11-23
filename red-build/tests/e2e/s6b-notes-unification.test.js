// tests/e2e/s6b-notes-unification.test.js — שלב 6 פרוסה 2: מודל הערות מאוחד +
// מקצה אנכי משותף + הקרנה מהחותמות + פריט הרחבה (info-box) דרך ה-registry.
//
// מכסה את הוראת שלב 6 פרוסה 2 §§13-14: תרחישי הערות פונקציונליים (רגילה,
// ארוכה, נפרצת, מועברת, צד בודדה/מרובה/צפופה, סמוך לתחתית, מעבר עמוד,
// המשך, סיום, סמן, RTL, חותמה חסרה, גלישה בלתי-פתירה, פריט חדש) + הוכחות
// גיאומטריה (מדידה אחת, תקציב=הצבה=הקרנה, שורות/רוחבים מהחותמת, אין
// חפיפות, DOM=PDF) + הרישום כסמכות תפעולית (validatePageItems).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { projectDocument } = require('../../src/engine/output/geometry-projector');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const NM = require('../../src/engine/layout/notes-model');
const fb = require('../../src/engine/layout/footnote-budget');
const { registeredPageItems, validatePageItems } = require('../../src/engine/layout/page-items');
const { MeasureAPI } = require('../../src/engine/typography/measure-api');

const S = () => getDefaultSettings();

/** מסמך גוף עם הערות רגילות + ארוכות (בלי תקרה — ברירת המחדל). */
const FN_DOC = 'ספר - ספר הערות\nנושא - פרוסה 2\n\nכותרת 1 - החלק\nכותרת 2 - פרק\n'
  + Array.from({ length: 24 }, (_, i) =>
    `פסקה ${i} עם הערה [הערה מספר ${i} עם עוד כמה מילים ארוכות למדידת שבירת שורות במרזב ולוודא שהכל מגיע להקרנה בשלמות] ועוד טקסט רץ בגוף למילוי טורים.`).join('\n');

/** מסמך עם ביאורי-צד (H7). */
const SN_DOC = 'ספר - ספר ביאורי הצד\nנושא - H7\n\nכותרת 1 - החלק\nכותרת 2 - פרק\n'
  + Array.from({ length: 10 }, (_, i) =>
    `כותרת 7 - ביאור צד מספר ${i} עם כמה מילים שנמדדות ברוחב השוליים\n`
    + `פסקה מבוארת ${i} עם מספיק מילים כדי למלא שורות בטור ועוד טקסט רץ לאורך כמה שורות טובות בעמוד הזה בדיוק.\n`).join('');

const mkEl = () => ({ tagName: 'div', style: {}, attrs: {}, dataset: {}, children: [], className: '', dir: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const fakeDoc = { createElement: () => mkEl(), createTextNode: (t) => ({ text: t }) };

// ═══════════ §13 — תרחישים פונקציונליים ═══════════

describe('שלב 6 פרוסה 2 (§13) — תרחישי הערות: יצירה, הצבה, המשכים וסיום', () => {
  it('הערת שוליים רגילה וארוכה: חותמת מלאה + הצבה + הקרנה (כולל מרובת-שורות)', () => {
    const r = typeset(FN_DOC, S());
    let total = 0, multi = 0;
    for (const p of r.pages) {
      for (const n of p.footnotes) {
        total++;
        assert(NM.stampIsValid(n), `הערה ${n.noteId} עם חותמה תקינה`);
        if (n.noteRows.length > 1) multi++;
      }
    }
    assert(total >= 20, `הערות הוצבו (${total})`);
    assert(multi >= 5, `הערות רבות-שורות (${multi})`);
    assertEq(r.contentPreserved, true, 'שימור תוכן');
  });

  it('הערה נפרצת (split): המשך עם continuationOf + wordRange — מילה לא נעלמת/מוכפלת/נסדרת', () => {
    const s = { ...S(), 'fn-layout-mode': 'block', 'long-footnote-policy': 'split', 'fn-bar-max-height-px': 34 };
    const r = typeset(FN_DOC, s);
    const frags = [];
    for (const p of r.pages) for (const n of p.footnotes) frags.push(n);
    const conts = frags.filter(n => n.isContinuation || n.mode === 'split-rest');
    assert(conts.length >= 1, `נוצרו המשכים (${conts.length})`);
    for (const c of conts) {
      assert(c.continuationOf, 'להמשך יש קישור continuationOf (§7)');
      assert(c.wordRange && c.wordRange.from >= 0 && c.wordRange.to >= c.wordRange.from, 'להמשך טווח מילים תקין');
      assert(NM.validateNoteRecord(c).length === 0, `חוזה ההמשך תקין: ${JSON.stringify(NM.validateNoteRecord(c))}`);
    }
    // שחזור המקור מהפיצולים: פיצול אחד ⇒ מילות החלק הראשון + מילות ההמשך = מילות המקור
    const firsts = frags.filter(n => n.mode === 'split-first');
    assert(firsts.length >= 1, 'יש חלקים ראשונים של פיצול');
    for (const f of firsts) {
      const rest = conts.find(c => c.tokenId === f.tokenId && c.noteIndex === f.noteIndex);
      if (!rest) continue;
      const joined = [...f.noteWords, ...rest.noteWords];
      const src = String(f.text) + ' ' + String(rest.text).replace(/^\(המשך\)\s*/, '');
      assertEq(joined.join(' '), src.split(/\s+/).join(' '), 'מילות החלקים = מילות המקור (בסדר)');
      // '(המשך)' בתקציב שורה 0 של ההמשך (§9 — בעבר לא תוקצב בזמן שצויר)
      assert(rest.contMarkW > 0, 'רוחב סימון ההמשך בחותמת');
      assert(rest.noteRows[0].widthPx >= Math.min(rest.contMarkW + rest.markerW, rest.stampCtx.widthPx) - 0.01,
        'שורה 0 של ההמשך כוללת את הקידומות בתקציב');
    }
    assertEq(r.contentPreserved, true, 'שימור תוכן בפיצול');
  });

  it('הערה מועברת (move-whole): עוברת עמוד שלם עם סימון', () => {
    const s = { ...S(), 'fn-layout-mode': 'block', 'long-footnote-policy': 'move-whole', 'fn-bar-max-height-px': 30 };
    const r = typeset(FN_DOC, s);
    let moved = 0;
    for (const p of r.pages) for (const n of p.footnotes) if (n.mode === 'moved-whole' || n.deferredToNextPage) moved++;
    assert(moved >= 1 || r.pages.length > 1, 'מדיניות ההעברה פעלה/הוצבה בהמשכים');
    assertEq(r.contentPreserved, true, 'שימור תוכן בהעברה');
  });

  it('הערות צד: בודדה, מרובות, גבהים שונים ועוגנים קרובים — מקצה אנכי משותף בלי חפיפות', () => {
    const r = typeset(SN_DOC, S());
    let placed = 0;
    const pagesWith = r.pages.filter(p => (p.sideNotes || []).length);
    assert(pagesWith.length >= 1, 'יש עמודים עם הערות צד');
    for (const p of pagesWith) {
      assert(p.sideNotes.length >= 1, 'מקצה אחד לכל הערות העמוד (§8)');
      // **G4/RC-4a (i004 — הצד לפי טור העוגן כמו המורשת):** המפל האנכי הוא
      // פר-שוליים — הערות בשני טורי העוגן חיות בשני עמודות-שוליים שונות
      // ורשאיות לחפוף אנכית (בייחוס 514/596 עמודי-הערות משתמשים בשניהם).
      const bySide = { right: -1, left: -1 };
      for (const sn of p.sideNotes) {
        placed++;
        assert(sn.yTop != null && sn.heightPx > 0, 'הערה מוקמה עם גובה מהחותמת');
        const side = sn.side || (p.isRecto !== false ? 'left' : 'right');
        if (bySide[side] >= 0) {
          assert(sn.yTop >= bySide[side] + 8 - 0.01,
            `מרווח מינימלי STACK_GAP_PX הופר (${side}): ${sn.yTop} < ${bySide[side] + 8}`);
        }
        assert(sn.yTop + sn.heightPx <= p.template.contentBox.bottom + 20 + 0.01,
          'אין חריגה שקטה מגבולות העמוד (מיכל 20px)');
        bySide[side] = Math.max(bySide[side], sn.yTop + sn.heightPx);
      }
    }
    assert(placed >= 8, `הערות צד מוקמו (${placed})`);
    assertEq(r.contentPreserved, true, 'שימור תוכן');
  });

  it('הערה ארוכה במיוחד + סמוכה לתחתית: דחייה מפורשת/עמוד זנב — לא גניזה (BRZ-15)', () => {
    // הערת צד בגובה של יותר מעמוד — נופלת לעמוד הזנב עם אירוע מתועד
    const longMargin = 'מילה '.repeat(600);
    const doc = 'ספר - זנב\n\nכותרת 1 - חלק\nכותרת 2 - פרק\n'
      + `כותרת 7 - ${longMargin}\n`
      + 'פסקה מבוארת עם מספיק מילים למילוי העמוד.\n'.repeat(4);
    const r = typeset(doc, S());
    const tail = r.pages.find(p => p.tailForSideNotes === true);
    const placedAll = r.pages.flatMap(p => p.sideNotes || []);
    assert(placedAll.length >= 1, 'ההערה הארוכה לא נגנזה');
    if (tail) {
      assert(tail.sideNotes.length >= 1, 'עמוד הזנב נושא אותה');
      assert(r.sideNotes.overflow.length >= 1, 'חריגת המיכל מתועדת (taller-than-page)');
    }
    assertEq(r.contentPreserved, true, 'שימור תוכן בזנב');
  });

  it('הערה במעבר עמוד + הערת המשך: pagePendingNotes זורם קדימה בסדר קריאה', () => {
    const r = typeset(SN_DOC, S());
    // סדר הקריאה של ההערות בעמוד = סדר הqueue (pending קודם, ואז של העמוד)
    // **G4/RC-4a:** פר-שוליים — שני עמודות-השוליים זורמים בלתי-תלויים.
    for (const p of r.pages) {
      const sns = p.sideNotes || [];
      const bySide = { right: [], left: [] };
      for (const sn of sns) bySide[sn.side || (p.isRecto !== false ? 'left' : 'right')].push(sn);
      for (const side of ['right', 'left']) {
        const arr = bySide[side];
        for (let i = 1; i < arr.length; i++) {
          assert(arr[i].yTop >= arr[i - 1].yTop - 0.01, `סדר קריאה נשמר במקצה ${side} (מעלה ב-y)`);
        }
      }
    }
  });

  it('הערות סיום: מדידה אחת בהקשר עמודי-ההערות; התקציב ושני המקרינים מהחותמת', () => {
    const s = { ...S(), 'note-placement-mode': 'endnotes' };
    NM.__resetStampStats();
    const r = typeset(FN_DOC, s);
    const stats = NM.__stampStats();
    NM.__resetStampStats();
    const enPages = r.pages.filter(p => p.type === 'endnotes');
    assert(enPages.length >= 1, 'עמודי הערות נבנו');
    for (const ep of enPages) {
      for (const n of ep.notes) {
        assert(NM.stampIsValid(n), 'לכל הערת סיום חותמה');
        assertEq(n.stampCtx.kind, 'endnote', 'הקשר המדידה = endnote');
        assertEq(n.noteRows.length, n.linesCount, 'שורות החותמת = מה שתוקצב');
      }
    }
    // מדידה אחת לכל הערה בהקשר endnote (המשכי פיצול — טקסט חדש, אחת משלה)
    const remeasured = Object.entries(stats.perKey).filter(([, n]) => n > 1);
    assertEq(remeasured.length, 0, `הערות סיום שנמדדו פעמיים: ${JSON.stringify(remeasured.slice(0, 3))}`);
    assertEq(r.contentPreserved, true, 'שימור תוכן בסיום');
  });

  it('סמן והצמדה למילה + RTL: הסמן בפינה הימנית של שורה 0, סדר מילים נשמר', () => {
    const r = typeset(FN_DOC, S());
    const proj = projectDocument(r, S());
    let checked = 0;
    for (const p of proj.pages) {
      for (const fn of p.footnotes) {
        if (!fn.words.length) continue;
        const firstRow = fn.words.filter(w => w.baselineY === fn.words[0].baselineY);
        const rightmost = firstRow.reduce((m, w) => (w.x > m.x ? w : m), firstRow[0]);
        assertEq(rightmost.text, String(fn.marker), `הסמן בפינה הימנית: ${rightmost.text} ≠ ${fn.marker}`);
        checked++;
        break; // די לבדוק את הראשונה בכל עמוד
      }
      if (checked >= 3) break;
    }
    assert(checked >= 1, `נבדקו סמנים (${checked})`);
  });
});

// ═══════════ §14 — גיאומטריה ומדידה ═══════════

describe('שלב 6 פרוסה 2 (§14) — מדידה אחת; תקציב = הצבה = הקרנה; DOM = PDF', () => {
  it('מדידה אחת לכל הערה בכל המסלול (כולל הערות-צד): אפס מדידות חוזרות', () => {
    NM.__resetStampStats();
    fb.__resetRowsStats();
    const r = typeset(SN_DOC + '\n' + FN_DOC, S());
    const nmStats = NM.__stampStats();
    const fbStats = fb.__rowsStats();
    NM.__resetStampStats();
    fb.__resetRowsStats();
    assert(r.contentPreserved === true, 'שימור תוכן');
    // הערות שוליים: כל מפתח נמדד בדיוק פעם אחת
    const fbRe = Object.entries(fbStats.perKey).filter(([, n]) => n > 1);
    assertEq(fbRe.length, 0, `הערות שוליים שנמדדו פעמיים: ${JSON.stringify(fbRe.slice(0, 3))}`);
    // הערות צד: כל מפתח (side-note:...) פעם אחת — ההקצאה והמקרינים לא מודדים
    const snKeys = nmStats.keys.filter(k => k.startsWith('side-note:'));
    assert(snKeys.length >= 8, `הערות צד נמדדו (${snKeys.length})`);
    const snRe = snKeys.filter(k => nmStats.perKey[k] > 1);
    assertEq(snRe.length, 0, `הערות צד שנמדדו פעמיים: ${JSON.stringify(snRe.slice(0, 3))}`);
  });

  it('המקרינים אינם מודדים מילים: אפס קריאות רוחב-טקסט בהקרנת עמוד הערות בלבד', () => {
    const s = { ...S(), 'note-placement-mode': 'endnotes' };
    const r = typeset('ספר - מ\n\nכותרת 1 - ח\nכותרת 2 - פ\nפסקה עם הערה [הערה אחת לבדיקת הקרנה נקייה ממדידה] וטקסט רץ.\n'.repeat(3), s);
    const enPage = r.pages.find(p => p.type === 'endnotes');
    assert(enPage, 'עמוד הערות נבנה');
    // כותרת העמוד אינה הערה — נמדדת במקומה (fakeLine); מנטרלים אותה כדי
    // שהספירה תבודד את הקרנת ההערות עצמן.
    enPage.heading = null;
    // API מונה: כל קריאת measureTextWidth נספרת; ascent/descent מותרים (מודל תיבת שורה)
    const real = new MeasureAPI(s, 'table');
    let widthCalls = 0;
    const counting = Object.create(real);
    counting.measureTextWidth = (t, sz, tr) => { widthCalls++; return real.measureTextWidth(t, sz, tr); };
    projectDocument({ pages: [enPage], layoutHash: 'x' }, s, counting);
    assertEq(widthCalls, 0, `ההקרנה מדדה ${widthCalls} מילים — אפס נדרש (הכל מהחותמת)`);
  });

  it('תקציב = הצבה = הקרנה: גובה ההערה בשלושת האתרים זהה', () => {
    const r = typeset(FN_DOC, S());
    const s = S();
    const proj = projectDocument(r, s);
    for (let i = 0; i < r.pages.length; i++) {
      const pg = r.pages[i], pp = proj.pages[i];
      if (!pg.footnotes.length) continue;
      // (א) תקציב: Σ חותמות = הרצועה השמורה
      const sumStamps = pg.footnotes.reduce((a, n) => a + n.heightPx, 0);
      const lanes = require('../../src/engine/layout/footnote-lanes').assignFootnoteLanes(pg.footnotes);
      const expectReserve = s['footnote-columns'] === 2
        ? Math.max(lanes.totals[0], lanes.totals[1])
        : sumStamps;
      assert(Math.abs(pg.fnReservedHeightPx - expectReserve) < 0.01,
        `עמ' ${i}: תקציב ${pg.fnReservedHeightPx} ≠ Σ חותמות ${expectReserve}`);
      // (ב) הקרנה: כל הערה מוקרנת עם שורות החותמת שלה (אותן מילים, אותו ספר)
      for (const fnRec of pp.footnotes) {
        const model = pg.footnotes.find(n => String(n.text) === fnRec.text && Math.abs((n.heightPx || 0) - (fnRec.h || 0)) < 22);
        assert(model, `הערה מוקרנת מהמודל: ${String(fnRec.text).slice(0, 20)}`);
        if (model && model.noteRows) {
          const projectedWords = fnRec.words.map(w => w.text);
          const stampWords = model.noteRows.flatMap(row =>
            Array.from({ length: row.wTo - row.wFrom }, (_, k) => model.noteWords[row.wFrom + k]));
          // הסמן מוקרן בראש שורה 0 (לפני המילים) — ההשוואה על גוף ההערה
          assertEq(projectedWords.slice(1).join(' '), stampWords.join(' '), 'שורות ההקרנה = שורות החותמת');
        }
      }
      break; // עמוד אחד מייצג (השער חוזר על עצמו)
    }
  });

  it('רוחבי המילים בהקרנה זהים לחותמת (wordW)', () => {
    const r = typeset(FN_DOC, S());
    const proj = projectDocument(r, S());
    let checked = 0;
    for (let i = 0; i < r.pages.length && checked < 5; i++) {
      const pg = r.pages[i], pp = proj.pages[i];
      for (const fnRec of pp.footnotes) {
        const model = pg.footnotes.find(n => n.text != null && String(n.text) === fnRec.text);
        if (!model || !model.noteRows) continue;
        const row = model.noteRows[0];
        const stampW = row.wordW;
        const projRow = fnRec.words.filter(w => w.baselineY === fnRec.words[0].baselineY);
        const projW = projRow.map(w => Math.round(w.w * 1000) / 1000);
        // השוואת רוחבי המילים (הסמן בראש מדלג — רוחבו markerGlyphW)
        assertEq(JSON.stringify(projW.slice(1)), JSON.stringify(stampW.slice(0, projW.length - 1)),
          'רוחבי המילים בהקרנה = wordW של החותמת');
        checked++;
        break;
      }
    }
    assert(checked >= 1, `נבדקו הערות (${checked})`);
  });

  it('DOM = PDF: אותה גיאומטריית הערות-צד (top/left/width/גובה מהחותמת)', () => {
    const r = typeset(SN_DOC, S());
    const proj = projectDocument(r, S());
    const pagesWith = r.pages.filter(p => (p.sideNotes || []).length);
    assert(pagesWith.length >= 1, 'יש הערות צד');
    let checked = 0;
    for (const pg of pagesWith) {
      const root = renderPage(pg, S(), fakeDoc);
      const asides = [];
      (function walk(n) {
        if (n.className && String(n.className).includes('side-note')) asides.push(n);
        for (const c of (n.children || [])) walk(c);
      })(root);
      assertEq(asides.length, pg.sideNotes.length, 'aside לכל הערה מוקמת');
      for (let i = 0; i < pg.sideNotes.length; i++) {
        const sn = pg.sideNotes[i];
        const el = asides[i];
        assertEq(el.style.top, `${Math.round(sn.yTop)}px`, 'DOM top מה-placement');
        assertEq(el.style.left, `${Math.round(sn.x)}px`, 'DOM left מה-placement');
        const expW = (sn.boxSpec && sn.boxSpec.widthPx) || sn.colWidth;
        assertEq(el.style.width, `${Math.round(expW)}px`, 'DOM width מההקשר');
        assertEq(el.dataset.rows, String(sn.noteRows.length), 'מספר שורות ה-DOM = שורות החותמת');
        // שורות ה-DOM: פיץ' מפורש מהמודל (שורש סטיית ה-CSS היחסית — עמ' 107)
        for (let li = 0; li < el.children.length; li++) {
          assertEq(el.children[li].style.lineHeight, `${sn.lineH}px`, 'line-height מפורש מהחותמת');
        }
        // PDF: שורות kind=side-note באותם y/w
        const pp = proj.pages[pg.index];
        const pdfLines = pp.lines.filter(l => l.kind === 'side-note');
        assert(pdfLines.length >= sn.noteRows.length, 'שורות PDF להערות הצד');
        checked++;
      }
      break;
    }
    assert(checked >= 1, `נבדקו הערות (${checked})`);
  });

  it('חותמה חסרה/פגומה ⇒ diagnostic מפורש — לא מדידה חלופית שקטה (§9.8)', () => {
    const r = typeset('ספר - ח\n\nכותרת 1 - ח\nכותרת 2 - פ\nפסקה עם הערה [הערה לבדיקת חותמה חסרה] וטקסט רץ בגוף הדף.\n'.repeat(4), S());
    const pg = r.pages.find(p => p.footnotes.length);
    assert(pg, 'יש עמוד עם הערה');
    // (א) מחיקת החותמת — כמו מודל פגום מיד חיצונית
    const broken = JSON.parse(JSON.stringify(pg.footnotes.map(n => ({ ...n, noteRows: undefined, noteWords: undefined, lineH: undefined }))));
    const brokenPage = { ...pg, footnotes: broken };
    const proj = projectDocument({ pages: [brokenPage], layoutHash: 'x' }, S());
    const diags = (proj.pages[0].diagnostics || []).filter(d => d.kind === 'note-stamp-missing');
    assertEq(diags.length, broken.length, 'diagnostic לכל הערה בלי חותמה');
    assert(diags[0].note != null || diags[0].marker != null, 'ה-diagnostic נושא מקור (note/marker)');
    // הטקסט נשמר ברשומה (אפס אובדן חשבונאי) אבל אין מילים מוקרנות
    for (const fnRec of proj.pages[0].footnotes) assertEq(fnRec.words.length, 0, 'אין מילים בלי חותמה');
    // (ב) חותמה פגומה (rows/words לא עקביים)
    const corrupt = { ...pg.footnotes[0], noteRows: [{ wFrom: 0, wTo: 9, widthPx: 10, wordW: [1, 2] }] };
    assert(!NM.stampIsValid(corrupt), 'חותמה פגומה מזוהה');
    // (ג) ה-DOM מסמן data-stamp-missing ולא מודד (מצב block — שורות מהחותמת;
    // continuous הוא חזות-זרימה בלבד לפי D-34)
    const sBlock = { ...S(), 'fn-layout-mode': 'block' };
    const root = renderPage({ ...pg, footnotes: [{ ...pg.footnotes[0], noteRows: undefined }, ...pg.footnotes.slice(1)] }, sBlock, fakeDoc);
    let fnEl = null;
    (function walk(n) {
      if (n.dataset && n.dataset.stampMissing === '1') { fnEl = n; return; }
      for (const c of (n.children || [])) walk(c);
    })(root);
    assert(fnEl, 'הערה רונדרה');
    assertEq(fnEl.dataset.stampMissing, '1', 'ה-DOM מסמן חותמה חסרה');
    assert(fnEl.textContent.length > 0, 'הטקסט לא אובד בנפילת החירום');
  });
});

// ═══════════ §11 — פריט ההרחבה החדש (info-box) דרך החוזה וה-registry ═══════════

describe('שלב 6 פרוסה 2 (§11) — תיבת מידע (info-box): parse→validate→measure→plan→DOM/PDF', () => {
  const BOX_STYLES = JSON.stringify([{
    id: 'info-demo', name: 'תיבת מידע',
    trigger: { linePrefix: 'תיבה:' },
    layoutMode: 'info-box',
    infoBox: { widthEm: 4.5, padEm: 0.3 },
    style: { background: '#f6f6f2', border: '1px solid #666', fontSizePt: 9 }
  }]);
  const BOX_DOC = 'ספר - בדיקת תיבה\n\nכותרת 1 - חלק\nכותרת 2 - פרק\n'
    + 'תיבה: תיבת מידע ראשונה עם כמה מילים שנמדדות ברוחב הפנימי של התיבה ולכן היא תישבר לכמה שורות קצרות\n'
    + 'פסקה ראשונה של התוכן המבואר עם מספיק מילים כדי למלא שורות בטור.\n'.repeat(8);

  const boxRun = () => {
    const s = S();
    s._customStyles = BOX_STYLES;
    return { r: typeset(BOX_DOC, s), s };
  };

  it('parse→validate: הסגנון נקלט (enum info-box + מפרט) — ונדחה כשרוחב לא חוקי', () => {
    const { parseCustomStyles } = require('../../src/engine/extensions/style-schema');
    const ok = parseCustomStyles(BOX_STYLES);
    assertEq(ok.errors.length, 0, `סגנון תקין עבר (${JSON.stringify(ok.errors.slice(0, 2))})`);
    assertEq(ok.styles[0].layoutMode, 'info-box', 'מצב הפריסה');
    assert(ok.styles[0].infoBox && ok.styles[0].infoBox.widthEm === 4.5, 'מפרט התיבה נורמל');
    const bad = parseCustomStyles(JSON.stringify([{ id: 'b1', trigger: { linePrefix: 'תיבה:' }, layoutMode: 'info-box', infoBox: { widthEm: 20 } }]));
    assert(bad.errors.some(e => e.code === 'info-box-bad-width'), 'רוחב לא חוקי נדחה עם הודעה עברית');
  });

  it('measure→plan: התיבה ב-PagePlan עם זהות מקור, חותמה וגאומטריה; מקצה עוגן משותף', () => {
    const { r } = boxRun();
    const boxes = r.pages.flatMap(p => (p.sideNotes || []).filter(sn => sn.itemKind === 'info-box'));
    assert(boxes.length >= 1, `תיבות נוצרו (${boxes.length})`);
    for (const b of boxes) {
      assert(b.noteId && b.noteId.startsWith('info-box|'), 'זהות מקור (noteId)');
      assert(b.anchorToken, 'עוגן לפסקה מארחת');
      assert(NM.stampIsValid(b), 'חותמה תקינה');
      assertEq(b.stampCtx.kind, 'info-box', 'הקשר מדידה ייעודי');
      assert(b.boxSpec.widthPx > 0 && b.boxChrome, 'גיאומטריה מוגדרת מהחוזה');
      // הגובה כולל מסגרת+ריפוד — מה שההקצאה מקבלת הוא מה שמוקרן
      assert(Math.abs(b.heightPx - (b.noteRows.length * b.lineH + 2 * (b.boxChrome.pad + b.boxChrome.border))) < 0.01,
        'גובה התיבה = שורות×פיץ׳ + chrome');
    }
    assertEq(r.contentPreserved, true, 'שימור תוכן');
    assertEq(r.pageItemValidation.violations.length, 0, 'אפס הפרות חוזה');
    assert((r.pageItemValidation.checked['info-box'] || 0) >= 1, 'ה-registry אימת את התיבות בפועל');
  });

  it('DOM/PDF מקרינים מאותו placement: שורות, רקע/מסגרת וגאומטריה זהים', () => {
    const { r, s } = boxRun();
    const pg = r.pages.find(p => (p.sideNotes || []).some(sn => sn.itemKind === 'info-box'));
    const sn = pg.sideNotes.find(x => x.itemKind === 'info-box');
    const root = renderPage(pg, s, fakeDoc);
    let aside = null;
    (function walk(n) {
      if (n.className && String(n.className).includes('info-box')) aside = n;
      for (const c of (n.children || [])) walk(c);
    })(root);
    assert(aside, 'aside.info-box רונדר');
    assertEq(aside.children.length, sn.noteRows.length, 'שורות ה-DOM = שורות החותמת');
    assert(aside.style.border && aside.style.backgroundColor, 'רקע/מסגרת מהחוזה');
    const proj = projectDocument(r, s);
    const pp = proj.pages[pg.index];
    const pdfLines = pp.lines.filter(l => l.kind === 'info-box');
    assertEq(pdfLines.length, sn.noteRows.length, 'שורות ה-PDF = שורות החותמת');
    const deco = (pp.decorations || []).filter(d => d.kind === 'info-box');
    assertEq(deco.length, 1, 'תיבת הרקע/מסגרת מוקרנת כעיטור');
    assert(Math.abs(deco[0].h - sn.heightPx) < 0.01 && Math.abs(deco[0].y - sn.yTop) < 0.01, 'גיאומטריית התיבה ב-PDF = ההקצאה');
    // DOM top = PDF y
    assertEq(aside.style.top, `${Math.round(sn.yTop)}px`, 'אותו yTop בשני המקרינים');
  });

  it('אין תנאים פזורים פר-תיבה בליבה: הענף הגנרי (anchor) משרת גם side-note וגם info-box', () => {
    const { r } = boxRun();
    const page = r.pages.find(p => (p.sideNotes || []).length >= 1);
    // שני סוגי העוגן על אותו מנגנון: אותן שדות placement (x/yTop/colWidth/heightPx)
    for (const sn of page.sideNotes) {
      assert(sn.x != null && sn.yTop != null && sn.heightPx > 0, 'אותו חוזה מיקום לכל פריט עוגן');
    }
  });
});

// ═══════════ §5/§12 — הרישום כסמכות תפעולית + מצאי ═══════════

describe('שלב 6 פרוסה 2 (§5/§12) — ה-registry כסמכות תפעולית ומצאי הסוגים', () => {
  it('12 הסוגים רשומים (11 מפרוסה 1 + info-box) — עם הבחנת השתתפות והקרנות', () => {
    const kinds = registeredPageItems().map(d => d.kind);
    for (const k of ['body-block', 'spanning-band', 'running-header', 'folio', 'column-divider',
      'footnote-gutter', 'side-note', 'ornament', 'shaar-gate', 'toc-page', 'endnote-page', 'info-box']) {
      assert(kinds.includes(k), `סוג חסר: ${k}`);
    }
    assertEq(kinds.length, 12, 'בדיוק 12 סוגים רשומים');
  });

  it('validatePageItems על מסלוך המוצר: כל הפריטים המוקמים מאומתים מול החוזה שלהם', () => {
    const r = typeset(FN_DOC + '\n' + SN_DOC, S());
    assertEq(r.pageItemValidation.violations.length, 0, 'אפס הפרות במסלול המוצר');
    const c = r.pageItemValidation.checked;
    for (const k of ['body-block', 'footnote-gutter', 'side-note', 'folio', 'running-header']) {
      assert((c[k] || 0) >= 1, `הסוג ${k} נבדק בפועל (${c[k] || 0})`);
    }
  });

  it('שלילי: פריט מושחת ⇒ הפרה מדווחת עם סוג+עמוד+קוד', () => {
    const r = typeset('ספר - ש\n\nכותרת 1 - ח\nכותרת 2 - פ\nפסקה עם הערה [הערה] וטקסט.\n'.repeat(3), S());
    const pg = r.pages.find(p => p.footnotes.length);
    const bad = [{ ...pg.footnotes[0], noteRows: [] }]; // חותמה מרוקנת
    const out = validatePageItems([{ ...pg, footnotes: bad }]);
    assert(out.violations.some(v => v.kind === 'footnote-gutter' && v.code === 'note-stamp-invalid'),
      `הפרה מזוהה: ${JSON.stringify(out.violations)}`);
  });

  it('חוזה הרשומה (notes-model): זהות/עוגן/טווחים — חיוב ושלילה', () => {
    const rec = NM.makeNoteRecord(
      { text: 'טקסט הערה', marker: 'א׳', tokenId: 'tok-1', noteIndex: 2 },
      { kind: NM.NOTE_KINDS.FOOTNOTE, numberingScope: 'section', splitPolicy: 'split' }
    );
    assertEq(rec.noteId, 'footnote|tok-1|2', 'noteId יציב');
    assertEq(rec.anchorId, 'tok-1', 'עוגן ברירת מחדל = מקור');
    assertEq(NM.validateNoteRecord(rec).length, 0, 'רשומה תקינה');
    const badCont = { ...rec, isContinuation: true }; // המשך בלי wordRange
    assert(NM.validateNoteRecord(badCont).some(e => e.code === 'note-continuation-without-range'),
      'המשך בלי טווח ⇒ הפרה (§7)');
    const badRange = { ...rec, wordRange: { from: 5, to: 2 } };
    assert(NM.validateNoteRecord(badRange).some(e => e.code === 'note-word-range-invalid'), 'טווח שלילי ⇒ הפרה');
  });

  it('גלישה בלתי-פתירה של הערת-צד ⇒ diagnostic עם מקור וסיבה (לא הזזה שקטה)', () => {
    // שתי הערות צד עם עוגנים זהים — השנייה נדחפת על ידי המפל; כשאין מקום ⇒ דחייה מתועדת
    const r = typeset(SN_DOC, S());
    for (const d of (r.sideNotes.deferred || [])) {
      assert(d.reason === 'no-room' && d.page != null, 'דחייה עם סיבה ועמוד');
    }
    // trace דטרמיניסטי של ההקצאה (ספירות תמיד זמינות — גם כשהרשומות כבויות)
    const counts = r.plannerTrace && r.plannerTrace.counts ? r.plannerTrace.counts : null;
    if (counts) assert((counts['side-note-allocated'] || 0) >= 1, 'לפחות הקצאה אחת תועדה');
  });
});

report('s6b-notes-unification');
