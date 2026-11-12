// tests/e2e/s77-user-issues.test.js — S77 (12.11): חמשת דיווחי המשתמש
//  1. "עדיין שורה אחרונה של הערות השוליים בעמוד שממשיכה לעמוד הבא אינה
//     מלאה, ואולי גם לא מוגדרת ליישור לשני הצדדים" → cutLast: שורת החיתוך
//     תוך-הערה היא שורת-ביניים — מיושבת לשני הצדדים במנוע, בתצוגה (textAlignLast)
//     וב-PDF (גאפ מתוח לרוחב המרזב).
//  2. "בהערות השוליים במקום גרשיים מופיע רווח לבן (רק בPDF)" → שורש:
//     גליף קומפוזיטיבי (quotedbl = שני רכיבי quotesingle באסיסטנט) הועתק
//     לתת-הגופן בלי רכיביו ובלי מיפוי-מחדש — ה-PDF צייר ריק ברוחב ההתקדמות.
//     תיקון: סגירה טרנזיטיבית + מיפוי-מחדש + בדיקת רכיבים ב-tofu העצמי.
//  3. "יש הרבה הגדרות בלוח ההגדרות שלא מחוברות ולא יוצרות שום שינוי" →
//     חיבור 45 הגדרות הכותרת העליונה + 14 הגדרות רמות תוכן-העניינים לנתיב
//     המורשת (הנתיב החי) — עם שימור מדויק של ברירת המחדל המכוילת.
//  4. "המראה של כרטיסיות עורך/הגדרות/בדיקה אמור להיות כמו תוויות טאבים" →
//     CSS: ציפורן-תיקייה ממוזגת עם סדרת התוכן.
//  5. "בכל שינוי יש לבדוק שהשינוי משפיע גם על התצוגה וגם על הPDF" → כל
//     בדיקות הסוויטה מכסים את שני הנתיבים (מנוע+מקרן/DOM) — כלל עבודה מעתה.
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { legacyTypeset, GEO, SINGLE_W } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');
const { projectLegacyDocument } = require('../../src/engine/output/legacy-projector');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { exportPdf } = require('../../src/engine/output/export-api');
const { buildSubset, charInventory } = require('../../src/engine/typography/font-subset');
const { parseFont, glyphIdOf } = require('../../src/engine/typography/font-metrics');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const bytesOf = (fam) => {
  const e = CATALOG.find(x => x.family === fam);
  return e ? fs.readFileSync(path.join(ASSETS, 'fonts', e.file)) : null;
};

function imudSettings() {
  const available = new Set(CATALOG.map(e => e.family));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
  return Object.assign({}, getDefaultSettings(), settings);
}

function registerCoreFonts(s) {
  clearRegisteredFonts();
  const fams = new Set([s['body-font'], s['f-note-body-font'], 'FrankReal', 'DavidLibre-Bold',
    'Hadassah Friedlaender', 'Frank Ruhl Libre', 'David Libre',
    s['header-recto-right-font'], s['header-verso-right-font']]);
  for (const f of fams) { const b = bytesOf(f); if (b) registerFont(f, b); }
}

// ---------- DOM shim (כמו s15) ----------
function makeDoc() {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attrs = {};
      this.dataset = {};
      this.style = {};
      this._class = '';
      this.dir = '';
      this._text = '';
    }
    set className(v) { this._class = v; }
    get className() { return this._class; }
    appendChild(c) { this.children.push(c); return c; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() {
      if (this.children.length) return this.children.map(c => c.textContent).join('');
      return this._text;
    }
  }
  return {
    createElement: (t) => new El(t),
    createTextNode: (v) => { const t = new El('#text'); t.textContent = String(v); return t; }
  };
}

const mkNote = (n, w) => Array.from({ length: w }, (_, i) => `הערה${n}_${i}`).join(' ');
const CUT_DOC = [
  'ספר הבדיקה - שורת חיתוך S77',
  'כותרת 2 מספר 1 - פרק ראשון',
  `פסקה עם הערה ענקית [${mkNote(1, 500)}] שחייבת להיחתך באמצעה בין עמודים.`,
  'פסקת המשך. ' + Array.from({ length: 60 }, (_, i) => `תוכן${i}`).join(' '),
  'כותרת 2 מספר 2 - פרק שני',
  'פסקה אחרונה. ' + Array.from({ length: 40 }, (_, i) => `סיום${i}`).join(' ')
].join('\n');

const QUOTE_DOC = [
  'ספר הבדיקה - גרשיים S77',
  'כותרת 2 מספר 1 - פרק ראשון',
  'פסקה עם הערה [וע"כ היה לחייב בשבת: דגדר מעשה איסור; ועוד ראיה] ועוד מילים בגוף.',
  'פסקה נוספת עם גרשיים בגוף עצמו וע"כ ונקודתיים: ופסיק.'
].join('\n');

// =====================================================================
describe('S77 בקשה 1 — שורת החיתוך מיושבת לשני הצדדים (מלאה)', () => {
  it('המנוע: חיתוך תוך-הערה ⇒ cutLast=true; סגירה טבעית ⇒ centerLast=true בלבד', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const r = legacyTypeset(CUT_DOC, s, {});
    assertEq(r.contentPreserved, true, 'שימור תוכן');
    let cuts = 0, cutLast = 0, centered = 0;
    for (const pg of r.pages) {
      for (const fn of (pg.footnotes || [])) {
        if (fn.centerLast === false) { cuts++; if (fn.cutLast === true) cutLast++; }
        if (fn.centerLast === true) centered++;
      }
    }
    assert(cuts >= 1, `צפוי לפחות חיתוך אחד (התקבל ${cuts})`);
    assert(cutLast >= 1, `צפוי חיתוך תוך-הערה עם cutLast (התקבל ${cutLast}/${cuts})`);
    assert(centered >= 1, 'סגירה טבעית של הזרימה — השורה האחרונה ממורכזת (S74 נשמר)');
    clearRegisteredFonts();
  });

  it('ה-PDF: שורת החיתוך מתוחה לרוחב המרזב — הקצה השמאלי בשפת הטור והגאפים מעבר לרווח הטבעי', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const r = legacyTypeset(CUT_DOC, s, {});
    const proj = projectLegacyDocument(r, s);
    let checked = 0, full = 0;
    for (const pg of proj.pages) {
      for (const fn of (pg.footnotes || [])) {
        if (fn.cutLast !== true) continue;
        const byLine = new Map();
        for (const w of fn.words) {
          const k = w.baselineY != null ? w.baselineY : 'first';
          if (!byLine.has(k)) byLine.set(k, []);
          byLine.get(k).push(w);
        }
        const lines = [...byLine.entries()].sort((a, b) => a[0] - b[0]);
        const lastLine = lines[lines.length - 1][1];
        lastLine.sort((a, b) => a.x - b.x);
        const gaps = [];
        for (let j = 1; j < lastLine.length; j++) gaps.push(lastLine[j].x - (lastLine[j - 1].x + lastLine[j - 1].w));
        // מלאה = מגיעה לשפת הטור השמאלית (עד 3px סביבות) והגאפים מתוחים מעל רווח מילה
        const leftOk = lastLine[0].x <= GEO.COL_L_X + 3;
        const gapsOk = gaps.length > 0 && gaps.every(g => g > 3);
        checked++;
        if (leftOk && gapsOk) full++;
        else assert(false, `שורת חיתוך לא מלאה: leftEdge=${lastLine[0].x.toFixed(1)} (טור ${GEO.COL_L_X}), gaps=[${gaps.map(g => g.toFixed(1)).join(',')}]`);
      }
    }
    assert(checked >= 1, `נבדקו ${checked} שורות חיתוך (צפוי ≥1)`);
    assertEq(full, checked, 'כל שורות החיתוך מיושבות לשני הצדדים');
    clearRegisteredFonts();
  });

  it('התצוגה: textAlignLast=justify לרשומת cutLast (כמו ה-PDF)', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const r = legacyTypeset(CUT_DOC, s, {});
    const doc = makeDoc();
    const cutPage = r.pages.find(pg => (pg.footnotes || []).some(f => f.cutLast === true));
    assert(cutPage != null, 'יש עמוד עם חיתוך');
    const root = renderPage(cutPage, s, doc);
    // חיפוש אלמנט ההערה — הסגנון המוצמד לו
    const findFn = (el) => {
      if (el.style && el.style.textAlignLast === 'justify' && String(el.className).includes('footnote')) return el;
      for (const c of (el.children || [])) { const f = findFn(c); if (f) return f; }
      return null;
    };
    const fnEl = findFn(root);
    assert(fnEl != null, 'אלמנט ההערה של עמוד החיתוך עם textAlignLast=justify');
    // ועמוד סגירה טבעית — center
    const closePage = r.pages.find(pg => (pg.footnotes || []).some(f => f.centerLast === true));
    if (closePage) {
      const root2 = renderPage(closePage, s, doc);
      const findC = (el) => {
        if (el.style && el.style.textAlignLast === 'center' && String(el.className).includes('footnote')) return el;
        for (const c of (el.children || [])) { const f = findC(c); if (f) return f; }
        return null;
      };
      assert(findC(root2) != null, 'סגירה טבעית — textAlignLast=center (S74 נשמר בתצוגה)');
    }
    clearRegisteredFonts();
  });

  it('נייטרליות: דגלי הרינדור אינם מזיזים אף שורה — layoutHash ללא שינוי מנעילת S76', () => {
    // **בלי רישום גופנים** — כמו בדיקת הנעילה של s76 (מדידת table; רישום
    // גופנים אמיתיים משנה את השבירה ומייצר hash אחר — לא רגרסיה).
    clearRegisteredFonts();
    const s = imudSettings();
    const { generateTestDocument } = require('../../src/ui/test-doc-generator');
    const text = generateTestDocument({ mode: 'fixed' });
    const r = legacyTypeset(text, s, {});
    assert(r.layoutHash.startsWith('legacy-6a06e3108c8ec'),
      `body-first נעול על ההאש של S76 — התקבל ${r.layoutHash.slice(0, 20)} (cutLast/centerLast אסור שיזיזו שורות)`);
    const rOld = legacyTypeset(text, { ...s, 'fn-placement-mode': 'legacy' }, {});
    assert(rOld.layoutHash.startsWith('legacy-3ce387962aa20101'),
      `legacy נשאר נעול על S74 — התקבל ${rOld.layoutHash.slice(0, 20)}`);
  });
});

// =====================================================================
describe('S77 בקשה 2 — גרשיים בהערות: גליפים קומפוזיטיביים בתת-גופן ה-PDF', () => {
  it('buildSubset: רכיבי הגליף הקומפוזיטיבי נכללים וממופים מחדש (quotedbl של אסיסטנט)', () => {
    const bytes = bytesOf('אסיסטנט קל מאוד');
    assert(bytes != null, 'גופן ההערות בקטלוג');
    const p = parseFont(bytes);
    assert(p.ok, 'פרסור הגופן: ' + (p.error || ''));
    const sub = buildSubset(p.font, charInventory('וע"כ שלום'));
    assert(sub.ok, 'המצמום הצליח: ' + (sub.error || ''));
    // ניתוח התוצר: quotedbl חייב להיות קומפוזיטיבי עם רכיבים בטווח
    const buf = sub.bytes;
    const numTables = buf.readUInt16BE(4);
    const tables = {};
    for (let i = 0; i < numTables; i++) {
      const off = 12 + i * 16;
      tables[buf.toString('latin1', off, off + 4)] = { offset: buf.readUInt32BE(off + 8) };
    }
    const numGlyphs = buf.readUInt16BE(tables.maxp.offset + 4);
    const itl = buf.readInt16BE(tables.head.offset + 50);
    const loca = (g) => itl === 0 ? buf.readUInt16BE(tables.loca.offset + g * 2) * 2 : buf.readUInt32BE(tables.loca.offset + g * 4);
    // cmap fmt4 — מציאת ה-gid של 0x22
    const cm = tables.cmap.offset;
    const sub4 = cm + buf.readUInt32BE(cm + 8); // תת-הטבלה הראשונה (offset מתחילת cmap)
    const segCount = buf.readUInt16BE(sub4 + 6) / 2;
    const endBase = sub4 + 14, startBase = endBase + segCount * 2 + 2, deltaBase = startBase + segCount * 2;
    let gid22 = 0;
    for (let s2 = 0; s2 < segCount; s2++) {
      const end = buf.readUInt16BE(endBase + s2 * 2);
      const start = buf.readUInt16BE(startBase + s2 * 2);
      if (0x22 >= start && 0x22 <= end && start !== 0xFFFF) gid22 = (0x22 + buf.readInt16BE(deltaBase + s2 * 2)) & 0xFFFF;
    }
    assert(gid22 !== 0, 'הגרשיים ממופות בתת-הגופן');
    const gOff = tables.glyf.offset + loca(gid22);
    assert(buf.readInt16BE(gOff) < 0, 'quotedbl קומפוזיטיבי במקור — גם בתת-הגופן');
    let off = gOff + 10;
    const comps = [];
    for (;;) {
      const flags = buf.readUInt16BE(off);
      const comp = buf.readUInt16BE(off + 2);
      comps.push(comp);
      off += 4 + ((flags & 0x0001) ? 4 : 2);
      if (flags & 0x0008) off += 2;
      else if (flags & 0x0040) off += 4;
      else if (flags & 0x0080) off += 8;
      if (!(flags & 0x0020)) break;
    }
    for (const c of comps) {
      assert(c < numGlyphs, `רכיב ${c} בטווח (סה"כ ${numGlyphs} גליפים) — לפני התיקון הצביע ל-gid 334 מתוך 36`);
      assert(loca(c + 1) - loca(c) > 0, `לרכיב ${c} יש קווי מתאר`);
    }
  });

  it('exportPdf: הגרשיים שלומות בחילוץ הטקסט (ToUnicode) וה-PDF נוצר בהצלחה', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const exp = exportPdf(QUOTE_DOC, s, bytesOf(s['body-font']), s['body-font']);
    assert(exp.ok, 'הייצוא הצליח: ' + (exp.error || ''));
    const raw = exp.bytes.toString('latin1');
    assert(/\/Length1 \d+[^>]*>>\nstream\n/.test(raw), 'יש גופנים מוטמעים');
    // חילוץ הטקסט — הגרשיים שמורות (ToUnicode)
    const { execFileSync } = require('child_process');
    const p = path.join(__dirname, '..', 'artifacts', 's77-quote.pdf');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, exp.bytes);
    let txt = '';
    try { txt = execFileSync('pdftotext', [p, '-'], { encoding: 'utf8' }); } catch (e) { /* אין poppler — מדלג */ }
    if (txt) {
      assert(txt.includes('וע"כ'), 'חילוץ הטקסט: הגרשיים שלומות (וע"כ)');
    }
    clearRegisteredFonts();
  });
});

// =====================================================================
describe('S77 בקשה 3 — הגדרות הכותרת העליונה מחוברות לנתיב המורשת', () => {
  it('הייבוא: hdr-*-type ממופים למקורות חיים; ערך לא מוכר אינו דורס', () => {
    const available = new Set(CATALOG.map(e => e.family));
    const base = { ...LEGACY_DEFAULTS };
    const { settings } = importImudSettings(base, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    assertEq(settings['header-recto-right-source'], 'book-name-first-half', 'book_title_split_r ⇒ החצי הראשון');
    assertEq(settings['header-recto-left-source'], 'book-name-second-half', 'book_title_split_l ⇒ החצי השני');
    assertEq(settings['header-recto-center-source'], 'h2', 'h2_without_siman ⇒ h2');
    assertEq(settings['header-verso-right-source'], 'book-name-first-half', 'verso-r גם כן');
    // spear (v19) — לא מוכר: אין דריסה — המפתח נעדר מהייבוא (ברירת המחדל של
    // הרישום נשארת כשהמשתמש ממזג מעל getDefaultSettings)
    const v19 = { ...base, 'hdr-c-type': 'spear' };
    const r2 = importImudSettings(v19, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    assertEq(r2.settings['header-recto-center-source'], undefined,
      'ערך לא מוכר (spear) אינו דורס — המפתח נעדר מהייבוא (S77)');
    // custom text
    const cust = { ...base, 'hdr-r-type': 'custom', 'hdr-r-custom': 'טקסט מותאם' };
    const r3 = importImudSettings(cust, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
    assertEq(r3.settings['header-recto-right-source'], 'custom', 'hdr-r-type=custom ⇒ custom');
    assertEq(r3.settings['header-recto-right-custom-text'], 'טקסט מותאם', 'hdr-r-custom ⇒ טקסט מותאם');
  });

  it('ברירת המחדל המיובאת משחזרת את ההתנהגות המכוילת במדויק (ימין=חצי ראשון, מרכז=פרק, שמאל=חצי שני)', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const r = legacyTypeset(QUOTE_DOC, s, {});
    // השוואה מול הנתיב הישן: אותן הגדרות בלי מפתחות header-* בכלל
    const sOld = { ...s };
    for (const k of Object.keys(sOld)) if (/^header-(recto|verso|opening)-[a-z]+-source$/.test(k)) delete sOld[k];
    const rOld = legacyTypeset(QUOTE_DOC, sOld, {});
    assertEq(r.pages.length, rOld.pages.length, 'אותו מספר עמודים');
    let compared = 0;
    for (let i = 0; i < r.pages.length; i++) {
      const a = r.pages[i].headerSlots, b = rOld.pages[i].headerSlots;
      if (!a && !b) continue;
      assert(!!a && !!b, `עמוד ${i}: קיום הכותרת זהה`);
      assertEq(a.right, b.right, `עמוד ${i}: סלוט ימין זהה`);
      assertEq(a.center, b.center, `עמוד ${i}: סלוט מרכז זהה`);
      assertEq(a.left, b.left, `עמוד ${i}: סלוט שמאל זהה`);
      compared++;
    }
    assert(compared >= 1, `הושוו ${compared} עמודים עם כותרת`);
    clearRegisteredFonts();
  });

  it('שינוי חי: מקור custom + טקסט מותאם בסלוט המרכז; page-num בסלוט ימין של verso; header-enabled=false מבטל', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    // custom במרכז
    const s1 = { ...s, 'header-recto-center-source': 'custom', 'header-recto-center-custom-text': 'כותרת מותאמת' };
    const r1 = legacyTypeset(QUOTE_DOC, s1, {});
    const rectoPage = r1.pages.find(p => p.headerSlots && p.index % 2 === 0);
    assert(rectoPage && rectoPage.headerSlots.center === 'כותרת מותאמת', 'custom ⇒ הטקסט המותאם במרכז recto');
    // page-num בסלוט ימין של verso
    const s2 = { ...s, 'header-verso-right-source': 'page-num' };
    const r2 = legacyTypeset(QUOTE_DOC, s2, {});
    const versoPage = r2.pages.find(p => p.headerSlots && p.index % 2 === 1);
    assert(versoPage, 'יש עמוד verso עם כותרת');
    assertEq(versoPage.headerSlots.right, versoPage.folioDisplay, 'page-num ⇒ הגיליון בסלוט ימין (verso)');
    // header-enabled=false — אין כותרות בכלל
    const s3 = { ...s, 'header-enabled': false };
    const r3 = legacyTypeset(QUOTE_DOC, s3, {});
    assert(r3.pages.every(p => !p.headerSlots), 'header-enabled=false ⇒ אין כותרות רצות');
    // opening ייעודי
    const s4 = { ...s, 'header-opening-dedicated': true, 'header-opening-right-source': 'none', 'header-opening-center-source': 'book-name', 'header-opening-left-source': 'none' };
    const r4 = legacyTypeset(CUT_DOC, s4, {});
    const signOpen = r4.pages.find(p => p.type === 'sign-open');
    if (signOpen && signOpen.headerSlots) {
      assertEq(signOpen.headerSlots.right, '', 'פתיחת פרק: סלוט ימין none');
      assert(signOpen.headerSlots.center.length > 0, 'פתיחת פרק: המרכז מהמקור (book-name)');
      assertEq(signOpen.headerSlots.left, '', 'פתיחת פרק: סלוט שמאל none');
    }
    clearRegisteredFonts();
  });

  it('התצוגה וה-PDF: גופן/צבע לפי הצד הפיזי — verso נפרד מ-recto', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const sV = { ...s, 'header-verso-right-color': '#dc2626', 'header-verso-right-font': 'David Libre' };
    const longDoc = QUOTE_DOC + '\n' + CUT_DOC + '\n' + Array.from({ length: 30 }, (_, i) => `פסקת מילוי ${i} עם כמה מילים לעוד עמודים.`).join('\n');
    const r = legacyTypeset(longDoc, sV, {});
    const proj = projectLegacyDocument(r, sV);
    // העמודים המוקרנים באותו סדר — הצד לפי מיקום המערך (= index המקורי)
    let versoSlot = null, rectoSlot = null;
    proj.pages.forEach((p, i) => {
      if (!p.header) return;
      if (i % 2 === 1 && !versoSlot) versoSlot = p;
      if (i % 2 === 0 && !rectoSlot) rectoSlot = p;
    });
    assert(versoSlot != null, 'יש עמוד verso עם כותרת מוקרנת');
    const vr = versoSlot.header.slots.find(sl => sl.pos === 'right');
    assertEq(JSON.stringify(vr.color), JSON.stringify([0.8627450980392157, 0.14901960784313725, 0.14901960784313725]),
      'צבע סלוט ימין ב-verso מההגדרה (#dc2626)');
    assertEq(vr.fam, 'David Libre', 'גופן סלוט ימין ב-verso מההגדרה');
    // recto לא הושפע — שחור (ברירת המחדל; [0,0,0] — הכותב מדלג על אופרטור rg)
    const rr = rectoSlot.header.slots.find(sl => sl.pos === 'right');
    assertEq(JSON.stringify(rr.color), '[0,0,0]', 'recto נשאר שחור (ברירת המחדל)');
    clearRegisteredFonts();
  });
});

// =====================================================================
describe('S77 בקשה 3 — הגדרות רמות תוכן-העניינים מחוברות לנתיב המורשת', () => {
  const TOC_DOC = [
    'ספר הבדיקה - רמות תוכן S77',
    'כותרת 1 מספר 1 - חלק ראשון',
    'כותרת 2 מספר 1 - פרק ראשון',
    'כותרת 3 מספר 1 - סעיף ראשון',
    'תוכן הסעיף הראשון עם כמה מילים.',
    'כותרת 4 מספר 1 - תת סעיף',
    'תוכן תת הסעיף.',
    'כותרת 4 מספר 2 - תת סעיף נוסף',
    'כותרת 3 מספר 2 - סעיף שני',
    'תוכן הסעיף השני.'
  ].join('\n');

  it('ברירת המחדל המיובאת: שורות ה-TOC זהות לנתיב הישן (בלי דגלי toc-level)', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const sOld = { ...s };
    for (let n = 1; n <= 7; n++) { delete sOld[`toc-level-${n}-show`]; delete sOld[`toc-level-${n}-inline`]; }
    const r1 = legacyTypeset(TOC_DOC, s, {});
    const r2 = legacyTypeset(TOC_DOC, sOld, {});
    const rowsOf = (r) => r.pages.filter(p => p.toc).flatMap(p => p.toc.rows || []).map(row => `${row.level}|${row.text}`);
    assertEq(JSON.stringify(rowsOf(r1)), JSON.stringify(rowsOf(r2)), 'שורות ה-TOC זהות ביט-לביט בברירת המחדל');
    clearRegisteredFonts();
  });

  it('toc-level-N-show=false מסיר את הרמה משני התכנים; inline=true ממזג לשורת ההורה', () => {
    const s = imudSettings();
    registerCoreFonts(s);
    const rHidden = legacyTypeset(TOC_DOC, { ...s, 'toc-level-3-show': false, 'toc-level-4-show': false }, {});
    const rowsHidden = rHidden.pages.filter(p => p.toc).flatMap(p => p.toc.rows || []);
    assert(!rowsHidden.some(row => row.level === 3), 'רמה 3 הוסרה מה-TOC');
    assert(!rowsHidden.some(row => row.level === 4), 'רמה 4 הוסרה מה-TOC');
    assert(rowsHidden.some(row => row.level === 2), 'רמה 2 נשארת');
    // inline: רמה 4 ממזזת לשורת ההורה (רמה 3)
    const rInline = legacyTypeset(TOC_DOC, { ...s, 'toc-level-4-inline': true }, {});
    const rowsInline = rInline.pages.filter(p => p.toc).flatMap(p => p.toc.rows || []);
    assert(!rowsInline.some(row => row.level === 4 && !String(row.text).includes('|')), 'אין עוד שורות רמה-4 עצמאיות');
    const merged = rowsInline.find(row => String(row.text).includes(' | '));
    assert(merged != null, 'נמצאה שורה ממוזגת (טקסט " | ")');
    assertEq(merged.level, 3, 'השורה הממוזגת שייכת להורה (רמה 3)');
    clearRegisteredFonts();
  });
});

// =====================================================================
describe('S77 בקשה 4 — כרטיסיות במראה תוויות-טאבים (ציפורן תיקייה)', () => {
  it('styles.css: הלשונית הפעילה ציפורן ממוזגת — פינות עליונות, שוליים שליליים, סדרת תוכן לבנה', () => {
    const css = fs.readFileSync(path.join(__dirname, '..', '..', 'ui', 'styles.css'), 'utf8').replace(/\n/g, ' ');
    assert(/\.tabbtn\[aria-selected="true"\][^}]*margin-bottom:\s*-1px/.test(css), 'הלשונית הפעילה נמשכת אל קו ההפרדה (margin-bottom:-1px)');
    assert(/\.tabbtn\s*\{[^}]*border-radius:\s*9px 9px 0 0/.test(css), 'פינות עליונות מעוגלות בלבד (ציפורן)');
    assert(/\.work-panels\s*\{[^}]*background:\s*var\(--panel\)/.test(css), 'סדרת התוכן לבנה — ממשיכה את הלשונית');
    assert(!/\.tabbtn\s*\{[^}]*background:\s*var\(--btn-dark\)/.test(css), 'הלשוניות אינן כפתורים כהים');
  });
});

report('s77-user-issues');
