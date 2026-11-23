// tests/regress/rci006-contract-sweep.test.js — Iteration-006 קבוצה 3:
// הסוויפ המדוד של ממצאי האודיט החי (RC-M1–M4, RC-W1/W2, RC-S1, RC-B1, RC-A2b)
// + הפרכת שורש-ההמשך «חלון 1↔2 מילים» (מדידת ייחוס p44).
//
// הרקע: אחרי RC-A1/RC-A2 (commits 1c35d94, 61baf1c) האודיט החי על הספר המלא
// חשף משפחות כשל נוספות — כולן תוקנו בשכבת השורש ונאמתו (אודיט חי 0 בעיות,
// 689 עמ'). כאן נעילת החוזים ברגרסיה.
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

// ─── גופנים אמיתיים (כמו real-fonts.test.js) ───
const FONT_DIR = path.join(RB, 'ui', 'assets', 'imud', 'fonts');
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const frReal = fs.readFileSync(path.join(FONT_DIR, 'FrankReal-Bold.ttf'));
const guttman = fs.readFileSync(path.join(FONT_DIR, 'Guttman-Rashi-Normal.ttf'));
fontResolver.registerFont('FrankReal', frReal, { source: 'rci006' });
fontResolver.registerFont('Guttman Rashi', guttman, { source: 'rci006' });

const { MeasureAPI } = require(path.join(RB, 'src/engine/typography/measure-api'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { materializeDocument } = require(path.join(RB, 'src/engine/core/materialize'));
const { buildPageModel } = require(path.join(RB, 'src/engine/core/page-model'));
const { PT_CLASS } = require(path.join(RB, 'src/engine/output/dom-renderer'));

// טקסט IMUD קומפקטי: הקדמה (h0) + כותרת 1 + פתיחת סימן (כותרת 2) + פסקת-חלון ארוכה
const LONG = 'תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ';
const TEXT = [
  'ספר - ספר בדיקת חוזה',
  'מחבר - בדיקת רגרסיה',
  '',
  'הקדמה - פתח דבר',
  'אמת ' + LONG.repeat(3) + 'עמל.',
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
    '_engine-force-unified': true, // בלי זה imud+_imudRaw מנותב לפורט המורשת
    'first-word-mode': 'drop',
    'first-word-font': 'FrankReal',
    'body-font': 'Guttman Rashi',
    'body-font-size-pt': 12
  };
}

describe('Iteration-006 קבוצה 3 — סוויפ חוזי האודיט החי', () => {
  // הכנה עצלה (ה-harness בלי before): typeset חד-פעמי לכל הקבוצה
  let _ctx = null;
  const ctx = () => {
    if (_ctx) return _ctx;
    const rr = typeset(TEXT, imudSettings());
    const proj = materializeDocument(rr, rr.settings, { mode: 'production' });
    const mdl = buildPageModel({ pages: rr.pages, tokens: rr.tokens, settings: rr.settings }, {}).model;
    _ctx = { r: rr, projected: proj, model: mdl };
    return _ctx;
  };

  it('RC-W1: דגלי פסקת-החלון עוברים להקרנה ולמודל (שורה 0 עם מילים, שורה 1 בלי)', () => {
    const { projected, model } = ctx();
    const win = projected.pages.flatMap(pg => (pg.lines || []).filter(l => l.window));
    assert(win.length >= 2, `שורות חלון בהקרנה (${win.length} ≥ 2)`);
    const withWords = win.filter(l => l.windowWords && l.windowWords.length);
    assertEq(withWords.length, win.length / 2, 'חצי משורות החלון נושאות מילה (שורה 0 בלבד)');
    for (const l of withWords) {
      assert(Number.isFinite(l.windowW) && l.windowW > 0, 'windowW סופי וחיובי');
      assert((l.words || []).some(w => w.__window), 'מילת-החלון מוקרנת על השורה');
    }
    // המודל: אותם דגלים (המקרינים והאודיט זקוקים להם — line--window-wrap)
    const mwin = model.pages.flatMap(pg => (pg.lines || []).filter(l => l.window));
    assert(mwin.length === win.length, `דגלי חלון במודל (${mwin.length} = ${win.length})`);
    assert(mwin.every(l => Number.isFinite(l.windowW)), 'windowW על שורות המודל');
  });

  it('RC-W2: מילת-החלון צמודה לשפה הימנית של הטור וברוחב דיו של גופן החלון', () => {
    const { projected } = ctx();
    // הוכחת הייחוס p44: «השבת» 477-513 — הדיו נגמר בדיוק בקצה הטור (513),
    // לא בהשקעה הכוללת רווח+0.5 (ההשקעה מזיזה את התיבה ~3px מהקצה).
    const winLines = projected.pages.flatMap(pg => (pg.lines || []).filter(l => l.window && l.windowWords && l.windowWords.length));
    assert(winLines.length >= 1, 'יש שורות עם מילת-חלון');
    for (const ln of winLines) {
      const wd = (ln.words || []).find(w => w.__window);
      assert(wd, 'מילת-חלון קיימת בהקרנה');
      const col = projected.pages.flatMap(p => p.columns)[0];
      // צמודה לשפה הימנית: x + w = קצה הטור הימני (עד רינדור)
      const rightEdge = wd.x + wd.w;
      const colRight = col.x + col.w;
      assert(Math.abs(rightEdge - colRight) <= 0.51, `דיו החלון בקצה הטור (${rightEdge.toFixed(2)} ≈ ${colRight.toFixed(2)})`);
      // רוחב הדיו = מדידת גופן-החלון (FrankReal) ולא ההשקעה כולה
      assert(wd.w < ln.windowW, `רוחב דיו (${wd.w.toFixed(1)}) < השקעת הזרימה (${ln.windowW.toFixed(1)}) — ההשקעה כוללת רווח+0.5`);
    }
  });

  it('RC-W1: המקרין החי מסמן line--window-wrap / w--window (כמו המורשת S4.26)', () => {
    const { model } = ctx();
    const { renderModelPage } = require(path.join(RB, 'src/engine/output/pagemodel-dom-renderer'));
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
    const pgWithWin = model.pages.find(pg => (pg.lines || []).some(l => l.window));
    assert(pgWithWin, 'עמוד עם שורות חלון במודל');
    const root = renderModelPage(pgWithWin, {}, docShim, {});
    const html = JSON.stringify(root);
    assert(html.includes('line--window-wrap'), 'שורת ההמשך מסומנת line--window-wrap');
    assert(html.includes('w--window'), 'מילת-החלון מסומנת w--window');
  });

  it('RC-S1: פס פתיחת-הסימן מסווג structural — לא מזיז ציוות שורות-גוף', () => {
    const { model } = ctx();
    const siman = model.pages.flatMap(pg => (pg.lines || []).filter(l => l.kind === 'h2-siman'));
    assert(siman.length >= 1, 'פס סימן קיים (h2-auto-siman)');
    for (const l of siman) {
      assertEq(l.area, 'structural', 'פס הסימן באזור structural');
      assertEq(l.col, -1, 'אינו ממופה לטור');
    }
    // כל שורות הגוף ממופות לטור 0/1 — אף שורת גוף לא נפלטה ל-structural
    const bodyMisplaced = model.pages.flatMap(pg => (pg.lines || []).filter(l => l.kind === 'paragraph' && l.area === 'structural'));
    assertEq(bodyMisplaced.length, 0, 'אפס שורות גוף ב-structural');
  });

  it('RC-B1: עמודי מילוי ריקים ממופים ל-page--blank (סיווג האודיט)', () => {
    assertEq(PT_CLASS['blank'], 'page page--blank', 'אותה מחלקה כמו LEGACY_PT_CLASS');
  });

  it('RC-M2: גוף ההקדמה בגוף הגוף — 11.5pt בלי דגל גופן נפרד (כמו הייחוס p43: Guttman 0.03pt סטייה מול FRL 8.58pt)', () => {
    const { projected } = ctx();
    // שורות ההקדמה נושאות sizePt=11.5; דגל הגופן (fontKey/font) נשאר ריק —
    // המחסנית חוזרת לגוף הגוף. בעבר הוזרם Frank Ruhl Libre (הגדרת f-h0-body)
    // ⇒ מדידה≠רינדור (רווחי דיו 4-15px ב-19 שורות הקדמה).
    const pref = projected.pages.flatMap(pg => (pg.lines || []).filter(l => Math.abs((l.sizePt || 0) - 11.5) < 0.01));
    assert(pref.length >= 1, `שורות הקדמה 11.5pt (${pref.length})`);
    const withFontOverride = pref.filter(l => l.fontKey || l.font);
    assertEq(withFontOverride.length, 0, 'אפן דגלי גופן על גוף ההקדמה — גופן הגוף');
  });

  it('RC-M4: חוזה סימנים משולבים — combined (דפדפן/GPOS) מול hmtx (מורשת)', () => {
    // FrankReal: לסימני הניקוד advance לא-אפסי ב-hmtx (נמדד 1.72-4.68px @18pt).
    // בפרופיל המאוחד (GPOS mark-to-base) המדידה חייבת להאמין להצבה: 0.
    const combined = new MeasureAPI({ 'body-font': 'FrankReal', '_marks-advance': 'combined', 'body-font-size-pt': 12 }, 'font-metrics');
    const hmtx = new MeasureAPI({ 'body-font': 'FrankReal', 'body-font-size-pt': 12 }, 'font-metrics');
    const word = 'וַיְדַבֵּר'; // 5 סימנים משולבים
    const wc = combined.measureTextWidth(word, 18, 0);
    const wh = hmtx.measureTextWidth(word, 18, 0);
    assert(wh - wc > 5, `hmtx רחב מ-combined בסימנים (${(wh - wc).toFixed(2)}px > 5 — הפרש חמשת הסימנים)`);
    assert(wc > 10, `הבסיסים עצמם נמדדים (${wc.toFixed(2)}px)`);
    // הפרדת מופעי forFamily — שתי החוזים אינם חולקים מופע (בלי זה הראשון שנוצר היה מוגש לשני המנועים)
    const a = MeasureAPI.forFamily('FrankReal', { 'body-font-size-pt': 12, '_marks-advance': 'combined' });
    const b = MeasureAPI.forFamily('FrankReal', { 'body-font-size-pt': 12 });
    assert(a !== b, 'מופעים נפרדים לשני החוזים');
    const wa = a.measureTextWidth(word, 18, 0);
    const wb = b.measureTextWidth(word, 18, 0);
    assert(Math.abs(wa - wc) < 0.01 && Math.abs(wb - wh) < 0.01, 'forFamily מכבד את חוזה הסימנים של הקריאה');
  });

  it('RC-A2b: סוף פסקה שנכנס כולו — שורה אחת עד ה-final (בלי שורת-זנב מיותרת)', () => {
    // הוכחה חיה: «מכוונת» | «כנגדו.» נפרדו בשתי שורות לפני התיקון — 5 ממצאי
    // INK_NOT_JUSTIFIED ב-p69-283. הגרידי של המקור ממלא עד גבול הרוחב.
    const { breakItemSequence } = require(path.join(RB, 'src/engine/typography/kp-linebreak'));
    const { buildContainerSequence } = require(path.join(RB, 'src/engine/line/line-items'));
    const settings = { 'body-font-size-pt': 12, 'body-font': 'Guttman Rashi', 'body-line-height': 1.34 };
    const mk = (text) => ({
      id: 'b', kind: 'paragraph',
      items: [{ id: 'i', kind: 'text', payload: { runs: [{ text, sourceStart: 0 }] }, sourceRange: { start: 0, end: text.length } }]
    });
    const textOf = (items, cut) => items.slice(cut.from, cut.to)
      .filter(it => it.role === 'box')
      .map(it => (it.fragments || []).map(f => f.text).join(''))
      .join(' ')
      .trim();
    // פסקה שהשארית שלה נכנסת כולה לשורה האחרונה — ה-final עצמו נקודת חיתוך חוקית.
    // 8 מילים ברוחב 269px (5/שורה): שורה 0 = 5, שורה 1 = 3 (השארית כולה).
    // לפני התיקון: lastLegalCut האמצעי הדיח את המילה האחרונה ⇒ [5,2,1] שלוש שורות.
    const para = mk('מילהאחת מילהשתיים מילהשלוש מילהארבע מילהחמש מילהשש מילהשבע מילהשמונה');
    const seq = buildContainerSequence({ id: para.id, kind: 'paragraph', items: para.items, baseStyle: null }, { settings });
    const res = breakItemSequence(seq.items, 269, { policy: 'greedy', settings, lineHeightPx: 21.44 });
    assert(res.lines && res.lines.length === 2, `שתי שורות בלבד (התקבלו ${res.lines && res.lines.length} — לפני התיקון: [5,2,1])`);
    assertEq(res.lines[res.lines.length - 1].reason, 'final', 'השורה האחרונה נושאת reason=final');
    const texts = res.lines.map(c => textOf(seq.items, c));
    const wordsPer = texts.map(t => t.split(/\s+/).filter(Boolean).length);
    const lastWords = wordsPer[wordsPer.length - 1];
    assert(lastWords >= 2, `השורה האחרונה רב-מילית (${lastWords} מילים: «${texts[texts.length - 1]}»)`);
    assert(wordsPer[0] >= 3, `שורה 0 עמוסה (${wordsPer[0]} מילים)`);
  });

  it('הפרכת שורש-ההמשך «חלון 1↔2 מילים»: החוזה = מילה אחת (ייחוס p44 מדיד)', () => {
    // מדידת הייחוס (old-engine.pdf p44, טור ימין): «השבת» 18.0pt x=477-513
    // (הדיו נגמר בקצה הטור); «תבוא» 12.0pt x=451-473 — מילת הזרימה הראשונה של
    // שורת ההמשך המוצרת, לא חלק מהחלון. drop-word-count=1 בהגדרות המקור.
    // הפורט והמאוחד מפיקים את אותו החוזה — אין שורש לתיקון.
    for (const [label, settings] of [
      ['unified', imudSettings()],
      ['port', { ...imudSettings(), '_engine-force-unified': false }]
    ]) {
      const rr = typeset(TEXT, settings);
      const wins = [];
      for (const pg of rr.pages) for (const col of (pg.columns || [])) for (const ln of col) {
        if (ln.windowWords && ln.windowWords.length) wins.push(ln.windowWords);
      }
      assert(wins.length >= 1, `${label}: יש פסקאות חלון (${wins.length})`);
      for (const w of wins) {
        assertEq(w.length, 1, `${label}: החלון מילה אחת («${w.join(' ')}») — חוזה הייחוס`);
      }
    }
  });
});

report();
