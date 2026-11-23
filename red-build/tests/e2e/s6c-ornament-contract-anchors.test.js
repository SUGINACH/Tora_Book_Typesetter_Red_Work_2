// tests/e2e/s6c-ornament-contract-anchors.test.js — השלמת שלב 6: חוזה עיטורים מלא +
// הצמדת הערות לעוגנים (ביקורת PR #16/§3.2 בהוראת ההמשך).
//
// מכסה:
//  §3.1 — הצהרת עיטור מלאה דרך חוזה פריט העמוד (זהות/מקור, נכס ודיו, מידות
//         טבעיות מול יעד, fit/scale, עוגן סמנטי, clipping, z-order, הזמנה,
//         אילוצים); שינוי עיטור = גאומטריה בלבד; הזמנה בגובה/מיקום אמיתיים;
//         אותה גיאומטריה ל-DOM ול-PDF (דרך PageModel); דיו חסר מדווח; אין
//         חפיפה/גלישה בלתי מדווחות.
//  §3.2 — אינווריאנט קצה-לקצה: כל הערה בעמוד הסמן שלה או מאוחר ממנו; כולל
//         פסקה מרובת-הערות שסמניה פרוסים על פני פיצול; פשרת קיבולת מדווחת
//         (fn-anchor-compromise) בלי העברה בכוח; זהות נשמרת (noteId/wordRange).
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');
const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { validatePageItems, pageItemDescriptorOf } = require('../../src/engine/layout/page-items');
const { MARK_TAG } = require('../../src/engine/notes/markers');

const S = () => getDefaultSettings();
const ORN_CONFIG = {
  'h2-orn-top': 'shoshanta', 'h2-orn-bottom': 'pyramid', 'h2-orn-side': 'lance',
  'h3-side-orn': 'scroll', 'heading-dividers-h3-h6': true, 'chapter-end-ornament': 'pyramid'
};
const CORPUS = fs.readFileSync(path.join(__dirname, '../fixtures/canonical_corpus.txt'), 'utf8');

const mkEl = () => ({
  tagName: 'div', style: {}, attrs: {}, dataset: {}, children: [], className: '', dir: '', textContent: '',
  setAttribute() {}, appendChild(c) { this.children.push(c); return c; },
  get outerHTML() { return `<${this.tagName} class="${this.className}" data-slot="${this.dataset.slot || ''}" data-orn="${this.dataset.ornId || ''}"${this.dataset.inkMissing ? ' data-ink-missing="1"' : ''}>`; }
});
const fakeDoc = { createElement: () => mkEl(), createTextNode: (t) => ({ text: t }) };

/** איסוף כל העיטורים מהתוצאה. */
function allOrnaments(r) {
  const out = [];
  for (const p of r.pages) for (const d of (p.decorations || [])) out.push({ page: p, d });
  return out;
}

// ═══════════ §3.1 — חוזה העיטורים המלא ═══════════

describe('§3.1 חוזה עיטורים — הצהרה מלאה דרך חוזה פריט העמוד', () => {
  it('כל עיטור בקורפוס מצהיר את מלוא החוזה (זהות, דיו, מידות, fit, עוגן, clip, z, הזמנה, אילוצים)', () => {
    const r = typeset(CORPUS, { ...S(), ...ORN_CONFIG });
    const orns = allOrnaments(r);
    assert(orns.length >= 60, `ornaments planted (${orns.length} ≥ 60 — הבדיקה אינה ואקום)`);
    const FIT_MODES = new Set(['fixed', 'fit-to-text', 'fit-to-line', 'fit-to-heading-height', 'fit-to-budget']);
    for (const { page, d } of orns) {
      assert(typeof d.ornId === 'string' && /^orn-p\d+-/.test(d.ornId), `ornId@p${page.index}: ${d.ornId}`);
      assert(typeof d.source === 'string' && d.source.length > 0, `source@p${page.index}`);
      assert(d.natural && Number.isFinite(d.natural.w) && Number.isFinite(d.natural.h), `natural@p${page.index}`);
      assert(Number.isFinite(d.scale) && d.scale > 0, `scale@p${page.index}`);
      assert(d.fit && FIT_MODES.has(d.fit.mode), `fit.mode@p${page.index}: ${d.fit && d.fit.mode}`);
      assert(d.anchor && typeof d.anchor.semantic === 'string', `anchor.semantic@p${page.index}`);
      assert(d.clip && Number.isFinite(d.clip.top) && Number.isFinite(d.clip.bottom), `clip@p${page.index}`);
      assert(d.zOrder === 'overlay' || d.zOrder === 'infrastructure', `zOrder@p${page.index}`);
      assert(d.reservation && typeof d.reservation.mode === 'string', `reservation.mode@p${page.index}`);
      assert(d.constraints && typeof d.constraints.relativeTo === 'string', `constraints@p${page.index}`);
      assert(d.ink == null || typeof d.ink.type === 'string', `ink@p${page.index}`);
      assert(!d.inkMissing || d.kindStyle !== 'none', `inkMissing@p${page.index}`);
    }
    // סיקור כל דרכי ה-fit/ההזמנה — ההצהרה מייצגת את כל משפחות העיטורים
    const fitModes = new Set(orns.map(({ d }) => d.fit.mode));
    const resModes = new Set(orns.map(({ d }) => d.reservation.mode));
    for (const m of ['fixed', 'fit-to-text', 'fit-to-budget']) assert(fitModes.has(m), `fit mode covered: ${m}`);
    for (const m of ['overlay', 'row-padding', 'column-budget']) assert(resModes.has(m), `reservation mode covered: ${m}`);
  });

  it('validatePageItems מאמת את ההצהרה המלאה — הפרת חוזה מזוהה (בדיקת שלילה)', () => {
    const bad = validatePageItems([{
      index: 0, type: 'regular',
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 320 }], contentBox: { top: 40, bottom: 1080, height: 1040 } },
      columns: [[]], decorations: [{ kind: 'h2-ornament', slot: 'h2-top', kindStyle: 'pyramid', x: 100, y: 50, w: 40, h: 12 }]
    }]);
    assertEq(bad.violations.filter(v => v.kind === 'ornament' && v.code === 'contract-invalid').length, 1,
      'עיטור בלי הצהרה מלאה ⇒ contract-invalid');
    // ואותו עיטור עם ההצהרה — עובר
    const good = validatePageItems([{
      index: 0, type: 'regular',
      template: { width: 794, height: 1123, columns: [{ x: 60, w: 320 }], contentBox: { top: 40, bottom: 1080, height: 1040 } },
      columns: [[]],
      decorations: [{
        kind: 'h2-ornament', slot: 'h2-top', kindStyle: 'pyramid', x: 100, y: 50, w: 40, h: 12,
        ornId: 'orn-p0-h2-top-0', source: 'h2-orn-top', ink: { type: 'svg', ref: null, uri: 'data:image/svg+xml,x' },
        natural: { w: 40, h: 12 }, scale: 1, fit: { mode: 'fixed', reason: 'test' },
        anchor: { tokenId: null, semantic: 'above-heading' }, clip: { top: 30, bottom: 1080, left: 0, right: 794 },
        zOrder: 'overlay', reservation: { mode: 'overlay', px: 0, where: null },
        constraints: { relativeTo: 'heading', bounds: 'ornament-box', keepsOut: 'none' }
      }]
    }]);
    assertEq(good.violations.filter(v => v.kind === 'ornament').length, 0, 'עיטור עם הצהרה מלאה ⇒ תקין');
  });

  it('שינוי עיטור משנה גיאומטריה בלבד — תוכן, זהות וסדר קריאה נשמרים', () => {
    const base = typeset(CORPUS, { ...S(), 'h2-orn-top': 'none' });
    const orn = typeset(CORPUS, { ...S(), 'h2-orn-top': 'shoshanta', 'h2-orn-fit-to-text': false });
    // תוכן נשמר במלואו
    assertEq(base.contentPreserved, true, 'content preserved (base)');
    assertEq(orn.contentPreserved, true, 'content preserved (ornaments)');
    // אותן מילים באותו סדר קריאה (העיטור אינו נוגע בתוכן)
    // **RC-F1a (i005):** סדר הקריאה האמיתי הוא סדר ה-seq — לא סדר ההשטחה
    // (טור-אחר-טור לכל עמוד), שנשבר כשהעיטור מזיז שורה בין טורים בלי שהתוכן
    // או סדר הקריאה משתנים (נמדד: seq זהה מילה-במילה, 604=604; ההשטחה נפרדת
    // בשורה אחת). ההשוואה לפי seq חזקה מהקודמת — היא בודקת בדיוק את הנטען.
    const wordsOf = (r) => r.pages.flatMap(p => p.columns.flat()).map(ln => (ln.words || []).join('\u00A0'));
    const readingOrderOf = (r) => r.pages.flatMap(p => p.columns.flat())
      .filter(ln => ln.seq != null).sort((a, b) => a.seq - b.seq)
      .map(ln => (ln.words || []).join('\u00A0'));
    assertEq(wordsOf(orn).length, wordsOf(base).length, 'אותו מספר שורות גוף');
    assertEq(JSON.stringify(readingOrderOf(orn)), JSON.stringify(readingOrderOf(base)), 'סדר הקריאה זהה מילה-במילה (לפי seq)');
    // והעיטורים אכן נוספו (גאומטריה השתנתה)
    assert(allOrnaments(orn).some(({ d }) => d.slot === 'h2-top'), 'h2-top planted');
    assertEq(allOrnaments(base).some(({ d }) => d.slot === 'h2-top'), false, 'base: no h2-top');
  });

  it('הזמנת השטח מתחשבת בגובה ובמיקום האמיתיים — העיטור חי בתוך האזור שהוזמן (F-08)', () => {
    const r = typeset(CORPUS, { ...S(), ...ORN_CONFIG });
    for (const { page, d } of allOrnaments(r)) {
      if (d.reservation.mode !== 'row-padding') continue; // בדיקת ההזמנות החיות (H2 top/bottom)
      assert(d.reservation.px >= d.h - 0.01,
        `reservation.px (${d.reservation.px}) ≥ orn.h (${d.h}) — p${page.index} ${d.slot}`);
      // העיטור בתוך תיבת העיטורים (clip) — אותה תיבה שהאודיט בודק
      assert(d.y >= d.clip.top - 0.5 && d.y + d.h <= d.clip.bottom + 0.5,
        `ornament inside clip box: p${page.index} ${d.slot} y=${d.y} h=${d.h} clip=[${d.clip.top},${d.clip.bottom}]`);
    }
  });

  it('DOM ו-PDF מקבלים את אותה גיאומטריה — PageModel נושא את ההצהרה בשלמותה', () => {
    const r = typeset(CORPUS, { ...S(), ...ORN_CONFIG });
    const orns = allOrnaments(r);
    for (const { page, d } of orns) {
      const mp = r.pageModel.pages[page.index];
      const md = (mp.decorations || []).find(x => x.ornId === d.ornId);
      assert(md, `model decoration for ${d.ornId}`);
      assertEq(md.x, d.x, `${d.ornId} x`);
      assertEq(md.y, d.y, `${d.ornId} y`);
      assertEq(md.w, d.w, `${d.ornId} w`);
      assertEq(md.h, d.h, `${d.ornId} h`);
      assertEq(md.natural && md.natural.w, d.natural.w, `${d.ornId} natural.w`);
      assertEq(md.fit && md.fit.mode, d.fit.mode, `${d.ornId} fit.mode`);
      assertEq(md.anchor && md.anchor.semantic, d.anchor.semantic, `${d.ornId} anchor.semantic`);
      assertEq(md.reservation && md.reservation.mode, d.reservation.mode, `${d.ornId} reservation.mode`);
      assertEq(md.zOrder, d.zOrder, `${d.ornId} zOrder`);
    }
    // הקרנת ה-DOM מציירת מההצהרה (data-orn + דיו) בלי חישוב מחדש
    const page0 = r.pages.find(p => (p.decorations || []).length);
    const el = renderPage(page0, { ...S(), ...ORN_CONFIG }, fakeDoc);
    const ornEls = (el.children || []).filter(c => c.dataset && c.dataset.ornId);
    assert(ornEls.length === (page0.decorations || []).length, 'DOM ornaments from declaration');
  });

  it('דיו חסר — דיאגנוסטיק מפורש (ledger + dataset), לא ריק בשקט', () => {
    // kindStyle שאינו פתיר: הפניית imud שאינה רשומה — ההצהרה מסמנת inkMissing
    // בזמן התכנון; ה-ledger וה-DOM מדווחים (לא תיבה ריקה בשקט).
    const r = typeset(CORPUS, { ...S(), 'h2-orn-top': 'imud:orn-ud:nonexistent' });
    const missing = allOrnaments(r).filter(({ d }) => d.inkMissing);
    assert(missing.length > 0, `ink-missing ornaments exist (${missing.length})`);
    const ledgerHits = [...r.ledger.issues.values()].filter(x => x.kind === 'ornament-ink-missing');
    assertEq(ledgerHits.length, missing.length, 'ledger ornament-ink-missing = כמות החסרים');
    // וב-DOM: סימון גלוי
    const page0 = r.pages.find(p => (p.decorations || []).some(d => d.inkMissing));
    const el = renderPage(page0, S(), fakeDoc);
    const ornEls = (el.children || []).filter(c => c.dataset && c.dataset.ornId);
    assert(ornEls.some(c => c.dataset.inkMissing === '1'), 'dataset.inkMissing בהקרנה');
    // PageModel מדווח גם הוא
    const modelDiags = r.pageModel.pages.flatMap(p => (p.decorations || []).filter(d => d.inkMissing));
    assertEq(modelDiags.length, missing.length, 'PageModel inkMissing');
  });

  it('אין חפיפה או גלישה בלתי מדווחות — האודיט על ההצהרות בפועל', () => {
    const r = typeset(CORPUS, { ...S(), ...ORN_CONFIG });
    assertEq(r.ornaments.findings.overflow.length, 0, 'ornament-overflow=0');
    assertEq(r.ornaments.findings.overlap.length, 0, 'ornament-overlap=0');
    assertEq(r.ornaments.findings.asymmetry.length, 0, 'ornament-asymmetry=0');
    // הצהרות דטרמיניסטיות — אותו מזהה בריצה כפולה
    const r2 = typeset(CORPUS, { ...S(), ...ORN_CONFIG });
    const ids = (x) => x.pages.flatMap(p => (p.decorations || []).map(d => d.ornId)).join(',');
    assertEq(ids(r), ids(r2), 'declaration ids deterministic');
  });

  it('חוזה פריט העמוד מצהיר את השדות החדשים (schema) והאבחון ornament-ink-missing רשום', () => {
    const d = pageItemDescriptorOf('ornament');
    assert(d, 'ornament registered');
    for (const f of ['ornId', 'ink', 'natural', 'scale', 'fit', 'anchor', 'clip', 'zOrder', 'reservation', 'constraints']) {
      assert(JSON.stringify(d.schema).includes(f), `schema declares ${f}`);
    }
    assert(d.diagnostics.includes('ornament-ink-missing'), 'diagnostics catalog');
  });
});

// ═══════════ §3.2 — הצמדת הערות לעוגנים ═══════════

/** עמוד שורת הסמן של הערה (כמו tools/audit-note-anchors.js — מקור הזיהוי). */
function markerPageOf(pages, n) {
  const anchorTok = n.tokenId != null ? String(n.tokenId) : (n.anchorId != null ? String(n.anchorId) : null);
  if (!anchorTok) return null;
  const mk = String(n.marker != null ? n.marker : '');
  for (const page of pages) {
    for (const col of (page.columns || [])) {
      for (const ln of col) {
        const tok = ln.tokenId != null ? String(ln.tokenId) : (ln.meta && ln.meta.tokenId != null ? String(ln.meta.tokenId) : null);
        if (tok !== anchorTok) continue;
        for (const w of (ln.words || [])) {
          const s = String(w);
          if (!s.includes(MARK_TAG)) continue;
          if (!mk || s.includes(MARK_TAG + mk)) return page.index;
        }
      }
    }
  }
  return null;
}

/** פסקה ארוכה עם הערות שסמניהם מפוצלים על פני עמודים (מחולל דטרמיניסטי). */
function paraWithNotes(prefix, nWords, markerAt) {
  const words = [];
  for (let i = 0; i < nWords; i++) {
    words.push(`${prefix}${i} ארוכה למדי למילוי שטח טור בפסקה זו`);
    if (markerAt.includes(i)) words.push(`עוגן${i} [הערה ${i} עם טקסט מספיק בשביל שתי שורות מרזב לפחות כדי לתפוס תקציב אמיתי]`);
  }
  return words.join(' ');
}

describe('§3.2 הצמדת הערות לעוגנים — אינווריאנט קצה-לקצה', () => {
  it('כל הערה בעמוד הסמן שלה או מאוחר ממנו (קורפוס קנוני, ברירות מחדל)', () => {
    const r = typeset(CORPUS, S());
    let notes = 0;
    for (const page of r.pages) {
      for (const n of page.footnotes) {
        notes++;
        const mp = markerPageOf(r.pages, n);
        assert(mp != null, `marker found: ${n.noteId}`);
        assert(page.index >= mp, `note ${n.noteId} p${page.index} ≥ marker p${mp}`);
      }
    }
    assert(notes >= 5, `notes checked (${notes})`);
  });

  it('פסקה שסמניה פרוסים על פני פיצול — ההעברה מתבצעת בפועל (fn-anchor-reconciled)', () => {
    // צורה שהוכחה: הסמן הראשון בראש הפסקה (התחייבות שם), הסמן השני בזנב
    // הפסקה — עמוד הסמן השני הוא עמוד סוף-פסקה חלקי (לפני H2) ⇒ יש בו קיבולת.
    const doc = 'ספר - מרובת הערות\nנושא - פיצולי סמנים\n\nכותרת 1 - החלק\nכותרת 2 - פרק\n\n'
      + paraWithNotes('a', 120, [8, 112]) + '\n\nכותרת 2 - סוף\n\n' + paraWithNotes('b', 8, []);
    const r = typeset(doc, S());
    // המנגנון הופעל בפועל — אירוע העברה נרשם (בטרם ההחלפה ההערה ישבה עמוד קודם)
    const movedEvents = r.events.events.filter(e => e.label === 'fn-anchor-reconciled');
    assert(movedEvents.length >= 1, `fn-anchor-reconciled events: ${movedEvents.length}`);
    for (const e of movedEvents) {
      assert(e.payload.to > e.payload.from, `העברה קדימה: ${JSON.stringify(e.payload)}`);
    }
    // והאינווריאנט הסופי מתקיים לכל הערות המסמך
    for (const page of r.pages) {
      for (const n of page.footnotes) {
        const mp = markerPageOf(r.pages, n);
        assert(mp == null || page.index >= mp, `note ${n.noteId} p${page.index} ≥ marker p${mp}`);
      }
    }
    // זהות: שום הערה לא אבדה ולא הוכפלה — ספירת ההערות = ספירת הסמנים
    const noteCount = r.pages.reduce((s, p) => s + p.footnotes.length, 0);
    const tagCount = r.pages.reduce((s, p) => s + p.columns.flat().reduce((s2, ln) =>
      s2 + (ln.words || []).filter(w => String(w).includes(MARK_TAG)).length, 0), 0);
    assertEq(noteCount, tagCount, 'כל סמן ⇒ הערה (אין אובדן/כפילות)');
  });

  it('פשרת קיבולת מדווחת בכנות — ההערה נשארת עם diagnostic, בלי אובדן ובלי כוח', () => {
    // מסמך צפוף: כל עמוד מלא — העברה נחסמת בקיבולת; האינווריאנט מתקיים
    // רק עם פשרה רשומה (fn-anchor-compromise) עם ראיות עמודים וסיבה.
    const paras = [];
    for (let b = 0; b < 6; b++) paras.push(paraWithNotes(String(b), 90, [12, 38, 63, 84]));
    const doc = 'ספר - מרובת הערות\nנושא - פיצולי סמנים\n\nכותרת 1 - החלק\nכותרת 2 - פרק\n\n' + paras.join('\n\n');
    const r = typeset(doc, S());
    let compromised = 0;
    for (const page of r.pages) {
      for (const n of page.footnotes) {
        const mp = markerPageOf(r.pages, n);
        if (mp != null && page.index < mp) {
          const hasComp = [...r.ledger.issues.values()].some(x => x.kind === 'fn-anchor-compromise'
            && (x.target || '').startsWith(String(n.noteId || n.tokenId)));
          assert(hasComp, `note ${n.noteId} לפני הסמן ⇒ חייבת פשרה רשומה`);
          compromised++;
        }
      }
    }
    // אם היו פשרות — הן עם ראיות אמת
    const comps = [...r.ledger.issues.values()].filter(x => x.kind === 'fn-anchor-compromise');
    for (const c of comps) {
      assert(c.predicate_before && Number.isFinite(c.predicate_before.markerPage), 'פשרה עם ראיות עמודים');
      assert(c.predicate_before.reason === 'no-capacity-at-marker-page', 'סיבת הפשרה = קיבולת');
      assert(c.predicate_before.markerPage > c.predicate_before.notePage, 'הפשרה היא על הערה לפני הסמן');
    }
    // אין אובדן גם כאן
    const noteCount = r.pages.reduce((s, p) => s + p.footnotes.length, 0);
    const tagCount = r.pages.reduce((s, p) => s + p.columns.flat().reduce((s2, ln) =>
      s2 + (ln.words || []).filter(w => String(w).includes(MARK_TAG)).length, 0), 0);
    assertEq(noteCount, tagCount, 'כל סמן ⇒ הערה גם תחת פשרות');
    // wordRange/continuationOf לא נפגעו
    for (const page of r.pages) for (const n of page.footnotes) {
      if (n.continuationOf) assert(n.wordRange && Number.isFinite(n.wordRange.from), 'המשך שומר wordRange');
    }
  });
});

// ═══════════ היגיין ביקורת PR #17 ═══════════

describe('ביקורת PR #17 — שארית SSOT שהועברה', () => {
  it('protections-matrix צורך את ספי ה-widow/orphan/ליווי מ-constraint-matrix (לא מילולים מקומיים)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../../src/engine/layout/protections-matrix.js'), 'utf8');
    assert(src.includes("require('./constraint-matrix')"), 'import מהמטריצה');
    assert(!/run < 2\b/.test(src), 'אין מילולי run<2');
    assert(!/after < 2\b/.test(src), 'אין מילולי after<2');
    assert(src.includes('WIDOW_ORPHAN_MIN') && src.includes('ESCORT_MIN_LINES'), 'קבועים מהמקור היחיד');
  });
});

report('s6c-ornament-contract-anchors');
