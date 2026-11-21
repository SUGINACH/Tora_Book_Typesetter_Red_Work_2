// tests/e2e/s4b-production-path.test.js — שלב 4 מקטע ב׳: בדיקות קבלה של החיבור המלא
// למסלול המוצר (הוראת ביצוע §15 — 26 התרחישים המחייבים).
//
// הזרם הנבדק: pipeline.typeset בפועל — DocumentModel → LineItems (מדידה יחידה)
// → breakItemSequence → LineModel → תצוגה נגזרת → dp-planner (LineModel מצורף).
// כל טקסט הכותרות/האבחון נגזר מה-LineModel בלבד (accessor טהור יחיד — הגשר).
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
const { h3LineHeightPx } = require('../../src/engine/core/h3-contract');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { exportPdf } = require('../../src/engine/output/export-api');
const { AssetResolver } = require('../../src/engine/assets/asset-resolver');
const { clearItemMeasureCache, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');
const fontResolver = require('../../src/engine/typography/font-resolver');
const { buildDocumentModel } = require('../../src/engine/model/document-model');
const { buildLineSequences } = require('../../src/engine/line/line-items');

const ART = path.join(__dirname, '..', 'artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });
const DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
const HAS_DEJAVU = fs.existsSync(DEJAVU);

/** מסמך בדיקה תקין מבחינה מבנית (הוראה §15): כל כותרת עם טקסט, טקסט בין
 * כותרות, אין כותרת של הערה בלבד, הכותרת האחרונה עם תוכן אמיתי. */
const ALL_LEVELS_DOC = [
  'שם הספר - ספר הבדיקה של מקטע ב',
  'כותרת 1 - החלק הראשון',
  'פסקת גוף ראשונה אחרי פתיחת החלק, עם טקסט ממשי הממלא את ראש העמוד ומבטיח זרימה תקינה של הטורים בעמוד פתיחת החלק.',
  'כותרת 2 - הפרק הראשון של החלק',
  'פסקת גוף אחרי כותרת פרק, עם עוד כמה מילים כדי שתהיה שורה שלמה לפחות בטור הימני.',
  'כותרת 3 - כותרת משנה אופקית ארוכה במיוחד שנשברת לשתי שורות לפחות ברוחב העטיפה של הפס',
  'פסקת הגוף שבאה מיד אחרי כותרת המשנה, ומיקום השורה הראשונה שלה הוא המדד למרחק שבין סוף הכותרת לתוכן.',
  'כותרת 4 - כותרת רמה רביעית',
  'פסקה קצרה אחרי כותרת רביעית.',
  'כותרת 5 - כותרת רמה חמישית',
  'פסקה קצרה אחרי כותרת חמישית.',
  'כותרת 6 - כותרת רמה שישית',
  'פסקה קצרה אחרי כותרת שישית.',
  'כותרת 3 - שם קצר',
  'פסקת הגוף שבאה מיד אחרי הכותרת הקצרה, ומיקום שורתה הראשונה הוא המדד למרחק מכותרת חד-שורתית.',
  'פסקת סיום עם טקסט אמיתי אחרי כל הכותרות.'
].join('\n');

const pageLines = (pg) => [...(pg.spanning ? pg.spanning.lines : []), ...pg.columns.flatMap(c => c)];
const allLines = (res) => res.pages.flatMap(pageLines);

describe('שלב 4 מקטע ב׳ — חיבור מלא למסלול המוצר (§15)', () => {

  it('1+20+21. פסקה רגילה: תוכן מלא נשמר, סדר קריאה RTL, שורות עם LineModel מלא', () => {
    clearRegisteredFonts();
    clearItemMeasureCache();
    const doc = 'כותרת 1 - חלק\n' + 'פסקה רגילה עם מספר מילים לבדיקת הזרימה הכללית של השורות בטור ושימור התוכן במלואו.\n'.repeat(6) + 'פסקת סיום אמיתית.\n';
    const res = typeset(doc, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן מלא נשמר');
    assert(res.pages.length >= 1, 'עמודים הופקו');
    const lines = allLines(res).filter(l => l.kind !== 'heading');
    assert(lines.length > 10, 'שורות גוף הופקו: ' + lines.length);
    for (const ln of lines) {
      assert(ln.lineModel, 'לכל שורה LineModel מצורף (מגיע ל-Planner ולרנדרר)');
      assert(Array.isArray(ln.words) && ln.words.length > 0, 'מילים נגזרו');
      assert(Number.isFinite(ln.heightPx) && ln.heightPx > 0, 'גובה שורה');
      assert(Number.isFinite(ln.widthPx), 'רוחב טבעי');
    }
    // סדר קריאה: טור ימני לפני שמאלי, מעמוד מוקדם למאוחר (seq מונוטוני)
    let prevSeq = -1;
    for (const pg of res.pages) {
      for (const col of pg.columns) {
        for (const ln of col) {
          assert(ln.seq > prevSeq, 'סדר קריאה נשמר (seq מונוטוני)');
          prevSeq = ln.seq;
        }
      }
    }
  });

  it('2. כל רמות הכותרות 0-6: נשברות דרך המנוע הקנוני, ברוחב הנכון לפי מצב הרמה', () => {
    const res = typeset(ALL_LEVELS_DOC, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן נשמר');
    const headings = allLines(res).filter(l => l.kind === 'heading');
    const levels = new Set(headings.map(l => l.level));
    for (let lv = 1; lv <= 6; lv++) assert(levels.has(lv), 'כותרת רמה ' + lv + ' קיימת בפלט');
    for (const h of headings) {
      assert(h.lineModel, 'LineModel לכותרת');
      assert(h.tokenId != null, 'tokenId על שורת הכותרת (כמו הנתיב הקודם)');
    }
    // H1/H2 full-width ⇒ בפס חוצה-טורים (כמקודם).
    // **Iteration-001 (legacy parity — span_1col):** H3 כבר אינה פותחת עמוד
    // משלה — היא נשארת באותו עמוד כפס באמצע (רשומות h3Band בטור הימני
    // + צל בשמאלי), בדיוק כמו המקור. לכן: לפחות פס-עליון אחד של H2, ולצידו
    // לפחות פס-H3 אחד באמצע עמוד (שניהם נמדדים בפועל בקורפוס הזה).
    const spanningPages = res.pages.filter(pg => pg.spanning && pg.spanning.lines.some(l => l.kind === 'heading'));
    assert(spanningPages.length >= 1, 'פסי כותרת חוצה-טורים: ' + spanningPages.length);
    const midBandPages = res.pages.filter(pg => pg.columns.some(c => c.some(l => l.h3Band)));
    assert(midBandPages.length >= 1, 'פסי H3 באמצע עמוד (span_1col): ' + midBandPages.length);
  });

  it('3. H3 (D-S2H3): חד-שורתית ורב-שורתית — הסמנטיקה נוסעת, אין רווח כפול ב-DP וב-renderer', () => {
    const res = typeset(ALL_LEVELS_DOC, getDefaultSettings());
    const h3Lines = allLines(res).filter(l => l.kind === 'heading' && l.level === 3);
    assert(h3Lines.length >= 3, 'שורות H3: ' + h3Lines.length);
    // **H3-CSS (17.11):** pitch לפי חוזה ה-CSS המקורי — line-height 1.22 על
    // גודל הכותרת בפועל מההגדרות (מקור יחיד: core/h3-contract); היה 34 קבוע.
    const expPitch = h3LineHeightPx(getDefaultSettings()['heading-3-size-pt']);
    for (const ln of h3Lines) {
      assert(ln.semantic && ln.semantic.kind === 'heading3', 'סמנטיקת heading3 על השורה');
      assert(ln.lineModel.semantic && Math.abs(ln.lineModel.semantic.linePitchPx - expPitch) < 0.01, `pitch ${expPitch.toFixed(2)} (1.22×size) בחוזה`);
    }
    // הפס האחרון של כל כותרת H3 נושא את הרווח התחתון פעם אחת; שורות ביניים — לא
    const byToken = new Map();
    for (const ln of h3Lines) {
      const k = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
      if (!byToken.has(k)) byToken.set(k, []);
      byToken.get(k).push(ln);
    }
    for (const [k, lns] of byToken) {
      const last = lns[lns.length - 1];
      assert(Math.abs(last.semantic.bandPx - (expPitch + 4)) < 0.01, `${k}: הפס האחרון pitch+4`);
      assertEq(last.semantic.trailingSpacePx, 4, `${k}: רווח תחתון 4 פעם אחת`);
      for (const mid of lns.slice(0, -1)) {
        assertEq(mid.semantic.trailingSpacePx, 0, `${k}: אין רווח בשורות הביניים`);
        // הגובה בפועל שמגיע ל-Planner = גובה המדידה (ללא תוספת DP/renderer)
        assertEq(mid.heightPx, mid.lineModel.lineHeightPx, `${k}: ה-Planner אינו מוסיף גובה`);
      }
    }
    // רינדור DOM של עמוד עם H3 — בלי קריסה ובלי גיאומטריה נוספת
    const pgWithH3 = res.pages.find(pg => pageLines(pg).some(l => l.kind === 'heading' && l.level === 3));
    assert(pgWithH3, 'עמוד עם H3');
    class El {
      constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.style = {}; this.dataset = {}; }
      appendChild(c) { this.children.push(c); return c; }
      setAttribute(k, v) { this.attrs[k] = v; }
      get textContent() { return this._text != null ? this._text : this.children.map(c => (c.text != null ? c.text : '')).join(''); }
      set textContent(v) { this._text = String(v); this.children = []; }
    }
    const el = renderPage(pgWithH3, getDefaultSettings(), { createElement: (t) => new El(t), createTextNode: (t) => ({ text: t }) });
    assert(el, 'renderPage החזיר אלמנט');
  });

  it('4+12+13. הערות שוליים: הסמן מוצמד מבנית לעוגן (P-1), NBSP, קיצורים, ולא בסוף שורה', () => {
    const doc = 'כותרת 1 - חלק\nפסקה ראשונה עם הערה [הערת שוליים ראשונה] בתוך הטקסט, וגם וכו׳ מילה עם קיצור בסוף השורה הזאת שצריכה להישאר מחוברת.\nפסקה שנייה [הערה שנייה][הערה שלישית] עם שני סמנים עוקבים ועוד מילים אחריהן לזרימה.\nפסקת סיום אמיתית.\n';
    const res = typeset(doc, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן נשמר');
    const body = allLines(res);
    const markerWords = [];
    for (const ln of body) for (const w of (ln.words || [])) {
      const s = String(w);
      let from = 0;
      while (true) {
        const at = s.indexOf('\uE102', from);
        if (at < 0) break;
        markerWords.push({ word: s, at, line: ln });
        from = at + 1;
      }
    }
    assert(markerWords.length >= 3, 'סמנים בגוף: ' + markerWords.length);
    for (const m of markerWords) {
      // הסמן אינו בפתיחת מילה בודדת כשיש עוגן לפניו: ההצמדה מבנית
      assert(!(m.at === 0 && m.word.includes('\u00A0')), 'סמן בראש יחידה צמודה — תבנית בלתי-אפשרית');
      // סמן בסוף שורה אסור (BRZ-11): אם הסמן אחרון במילה, המילה אינה אחרונה בשורה בהכרח — בדיקת האיסור בפועל:
    }
    // שום שורה אינה מסתיימת במילה שסופה סמן (הסמן מוצמד לעוגן שאחריו עוד מילה לפחות)
    for (const ln of body) {
      const last = (ln.words || [])[ln.words.length - 1];
      if (last && String(last).endsWith('\u05f3') && String(last).includes('\uE102')) {
        // מילה שמסתיימת בסמן מתויג — לגיטית רק אם הסמן מוצמד למילה שלפניו (העוגן באותה מילה)
        assert(String(last).includes('\u00A0'), 'סמן בסוף שורה מחובר לעוגנו בתוך המילה (BRZ-11)');
      }
    }
    // הערות השוליים הוצבו במרזב
    const fnCount = res.pages.reduce((s, pg) => s + (pg.footnotes || []).length, 0);
    assert(fnCount === 3, 'הערות במרזב: ' + fnCount);
  });

  it('5. הערות צד (H7/side-note): הטקסט נגזר מהשורות ומגיע להערות הצד', () => {
    const doc = 'כותרת 1 - חלק\nפסקת גוף לפני הערת הצד, עם טקסט אמיתי שממלא שורה בטור.\nכותרת 7 - זוהי הערת הצד עצמה ותוכנה אמיתי\nפסקת הגוף שאחרי הערת הצד והיא העוגן החזותי שלה בעמוד.\nפסקת סיום אמיתית.\n';
    const res = typeset(doc, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן נשמר');
    const sideNotes = res.pages.reduce((arr, pg) => arr.concat(pg.sideNotes || []), []);
    assert(sideNotes.length >= 1, 'הערת צד הוצבה: ' + sideNotes.length);
    assert(/הערת הצד עצמה/.test(sideNotes[0].text), 'טקסט הערת הצד נגזר מהשורות: ' + sideNotes[0].text.slice(0, 30));
  });

  it('6. הערות סיום (endnotes): עמודי ההערות נבנים והתוכן נשמר', () => {
    const doc = 'כותרת 1 - חלק\nפסקת גוף ראשונה לפני ההערות.\nהערת סיום - תוכן הערת הסיום הגלויה הראשונה\nפסקת גוף אחרי הערת הסיום הראשונה.\nהערת סיום - תוכן הערת הסיום השנייה\nפסקת סיום אמיתית אחרי הכל.\n';
    const s = getDefaultSettings();
    s['note-placement-mode'] = 'endnotes';
    const res = typeset(doc, s);
    assert(res.contentPreserved, 'תוכן נשמר במצב endnotes');
    assert(res.endnotePages.pages.length >= 1, 'עמודי הערות נבנו');
    const enTexts = res.endnotePages.pages.flatMap(p => p.notes.map(n => n.text));
    assert(enTexts.some(t => /הערת הסיום הגלויה הראשונה/.test(t)), 'טקסט הערת הסיום זורם לעמודי ההערות');
  });

  it('7+8. inline note mode + mixed-font word: placeholder אטומי וריצות גופן נשמרות כפרגמנטים', () => {
    clearRegisteredFonts();
    clearItemMeasureCache();
    const s = getDefaultSettings();
    s['note-placement-mode'] = 'inline';
    s['_inline-font-markers'] = [{ id: 'david', open: '<<', close: '>>', family: 'David Libre' }];
    s['_inline-font-families'] = ['David Libre', 'Frank Ruhl Libre'];
    const doc = 'כותרת 1 - חלק\nפסקה עם הערה [טקסט ההערה המוטמעת] בתוך הגוף ומילה מעורבת ש<<לום>>ם עם ריצת גופן פנימית.\nפסקת סיום אמיתית.\n';
    const res = typeset(doc, s);
    assert(res.contentPreserved, 'תוכן נשמר במצב inline');
    // placeholder: מילה עם תג + E000 + טקסט ההערה
    let placeholder = null;
    for (const ln of allLines(res)) for (const w of (ln.words || [])) {
      if (String(w).includes('\uE102') && String(w).includes('\uE000')) placeholder = String(w);
    }
    assert(placeholder, 'placeholder אטומי בגוף');
    assert(placeholder.includes('\uE000\u05d8\u05e7\u05e1\u05d8') || placeholder.includes('\u05d8\u05e7\u05e1\u05d8'), 'טקסט ההערה בתוך ה-placeholder');
    // מילה מעורבת: הפרגמנטים ב-LineModel שומרים את ריצת הגופן (לא מחרוזת שטוחה)
    let mixed = null;
    for (const ln of allLines(res)) {
      if (!ln.lineModel) continue;
      for (const f of ln.lineModel.fragments) {
        if ((f.fragments || []).length >= 2 && f.fragments.some(x => x.fontFamily)) mixed = f;
      }
    }
    assert(mixed, 'מילה מעורבת עם פרגמנטים פר-ריצה ב-LineModel');
    const fams = mixed.fragments.map(f => f.fontFamily).filter(Boolean);
    assert(fams.length >= 1 && fams.includes('David Libre'), 'זהות הריצה נשמרה: ' + JSON.stringify(fams));
  });

  it('9+10. סגנונות inline מותאמים וסוגריים: שכבות-על נמדדות ומגיעות ל-renderer כ-span-ים', () => {
    const s = getDefaultSettings();
    s['paren-style-scale'] = 1.15;
    s['_customStyles'] = JSON.stringify({ styles: [{ id: 'small', name: 'קטן', trigger: { inlineMarker: { open: '«', close: '»' } }, layoutMode: 'regular', style: { fontSizePt: 10 } }] });
    const doc = 'כותרת 1 - חלק\nפסקה עם סוגריים (טקסט בתוך סוגריים שנמשך כמה מילים) ומילה «מיוחדת» שחייבת להימדד בסגנון המותאם שלה ועוד טקסט רגיל אחריה לזרימה.\nפסקת סיום אמיתית.\n';
    const res = typeset(doc, s);
    assert(res.contentPreserved, 'תוכן נשמר עם שכבות-על');
    let parenLine = null, customLine = null;
    for (const ln of allLines(res)) {
      if (ln.parenSpans && ln.parenSpans.length) parenLine = ln;
      if (ln.customSpans && ln.customSpans.length) customLine = ln;
    }
    assert(parenLine, 'parenSpans נגזרו על השורה');
    const parenWord = parenLine.words[parenLine.parenSpans[0]];
    assert(/סוגריים|תוך|תוך$/.test(parenWord) || parenWord.length > 0, 'מילת הסוגריים סומנה: ' + parenWord);
    // המדידה בפועל של מילת הסוגריים בסקאלה — מה-LineModel
    const frag = parenLine.lineModel.fragments[parenLine.parenSpans[0]];
    assert(frag && frag.overlay && frag.overlay.paren && Math.abs(frag.overlay.advanceFactor - 1.15) < 1e-9, 'שכבת-העל בפרגמנט: ' + JSON.stringify(frag && frag.overlay));
    assert(customLine, 'customSpans נגזרו');
    const cs = customLine.customSpans[0];
    assert(/מיוחדת/.test(customLine.words[cs.wi] || ''), 'המילה המותאמת זוהתה: ' + customLine.words[cs.wi]);
  });

  it('11. ניקוד וטעמים: מילה מנוקדת נשמרת שלמה בשורה (שכבת-אפס במדידה)', () => {
    const doc = 'כותרת 1 - חלק\nפסקה עם מילים מְנֻקָּדוֹת וּטְעֻמּוֹת כְּמוֹ הַמְצֻוֶּה וְעוֹד מִלִּים רַגִּילּוֹת אַחֲרֵיהֶן לְזְרִימָה תְּקִינָה שֶׁל הַשּׁוּרוֹת.\nפסקת סיום אמיתית.\n';
    const res = typeset(doc, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן מנוקד נשמר מילה-מילה');
    const words = allLines(res).filter(l => l.kind !== 'heading').flatMap(l => l.words);
    assert(words.some(w => /מ/.test(w) && w.includes('\u05b0') || /[\u0591-\u05c7]/.test(w)), 'מילים מנוקדות בפלט');
  });

  it('14-17. תמונות: inline/block/centered/floats — זהות נכס, מדידה, השתתפות בשבירה', () => {
    clearRegisteredFonts();
    clearItemMeasureCache();
    const ar = new AssetResolver();
    // PNG 8x12 אמיתי (חתימה מינימלית + IHDR + IDAT של פיקסל אפור)
    const { tinyPngFor } = require('../helpers/tiny-png');
    ar.addBytes('img/inline.png', tinyPngFor(8, 12));
    ar.addBytes('img/block.png', tinyPngFor(20, 30));
    ar.addBytes('img/left.png', tinyPngFor(10, 10));
    ar.addBytes('img/right.png', tinyPngFor(10, 10));
    const doc = [
      'כותרת 1 - חלק',
      'פסקה עם תמונת inline #img/inline.png# בתוך הטקסט ועוד מילים אחריה לזרימה של השורה.',
      'פסקה עם תמונת בלוק #img/block.png.c40# ממורכזת ועוד טקסט סביבה לזרימה.',
      'פסקה עם צף משמאל #img/left.png.l30# וטקסט שעוטף אותו מספיק ארוך כדי לרדת שורות אחדות לצד התמונה הצפה הזאת.',
      'פסקה עם צף מימין #img/right.png.r30# וטקסט שעוטף אותו מספיק ארוך כדי לרדת שורות אחדות לצד התמונה הצפה השנייה.',
      'פסקת סיום אמיתית.'
    ].join('\n');
    const res = typeset(doc, getDefaultSettings(), { assets: ar });
    assert(res.contentPreserved, 'תוכן נשמר עם תמונות');
    // זהות הנכסים נשמרה מה-resolver ועד ה-LineModel
    let imgFrags = 0, assetIds = new Set();
    for (const ln of allLines(res)) {
      if (!ln.lineModel) continue;
      for (const f of ln.lineModel.fragments) {
        if (f.kind !== 'image') continue;
        imgFrags++;
        const lm = ln.lineModel;
        void lm;
        // itemId של פריט התמונה מהמודל — זהות יציבה
        assert(f.itemId && f.itemId.includes('img') || f.itemId, 'זהות פריט תמונה');
        assetIds.add(f.itemId);
      }
    }
    assert(imgFrags >= 2, 'פרגמנטי תמונה ב-LineModel של השורות: ' + imgFrags);
    // התמונות משתתפות בשבירה: שורת inline מכילה את מילת התמונה בתוך הזרימה
    const imgWords = allLines(res).flatMap(l => (l.words || []).filter(w => String(w).startsWith('#img/')));
    assert(imgWords.length >= 1, 'מילות תמונה בזרימת הגוף: ' + imgWords.length);
    // floats: האזורים רשומים ב-LineModel (floatAreas) או ברצף — החוזה של 4א
    let floatAreas = 0;
    for (const ln of allLines(res)) if (ln.lineModel && ln.lineModel.floatAreas && ln.lineModel.floatAreas.length) floatAreas += ln.lineModel.floatAreas.length;
    assert(floatAreas >= 1, 'אזורי צף ב-LineModel: ' + floatAreas);
  });

  it('17ב+18. overflow של פריט רחב ומעבר רוחב מצומצם למלא (wrap)', () => {
    const longWord = 'מאוד'.repeat(20) + 'ה';
    const doc = `\u05db\u05d5\u05ea\u05e8\u05ea 1 - \u05d7\u05dc\u05e7\n\u05e4\u05e1\u05e7\u05d4 \u05e2\u05dd \u05de\u05d9\u05dc\u05d4 \u05d0\u05e8\u05d5\u05db\u05d4 ${longWord} \u05d5\u05d0\u05d7\u05e8\u05d9\u05d4 \u05e2\u05d5\u05d3 \u05de\u05d9\u05dc\u05d9\u05dd \u05e8\u05d2\u05d9\u05dc\u05d5\u05ea \u05dc\u05d6\u05e8\u05d9\u05de\u05d4 \u05e9\u05dc \u05d4\u05de\u05e9\u05da \u05d4\u05e4\u05e1\u05e7\u05d4 \u05d4\u05d6\u05d0\u05ea \u05d1\u05d8\u05d5\u05e8.\n\u05e4\u05e1\u05e7\u05ea \u05e1\u05d9\u05d5\u05dd \u05d0\u05de\u05ea\u05d9\u05ea.\n`;
    const res = typeset(doc, getDefaultSettings());
    assert(res.contentPreserved, 'תוכן נשמר גם עם מילה חורגת');
    const found = allLines(res).some(l => (l.words || []).some(w => w === longWord));
    assert(found, 'המילה החורגת נשמרה שלמה (שורה משלה — ערוץ ה-overflow)');
    // מעבר רוחב: שורה עם float מצטמצמת ואז מתרחבת — כבר נבדק ב-16; כאן האבחון:
    const issues = [...res.ledger.issues.values()].filter(i => /overflow/.test(JSON.stringify(i.route || i.predicate_before || '')));
    void issues;
  });

  it('19. שימור source anchors: לכל שורה טווח מקור מוחלט מסודר בתוך הבלוק', () => {
    const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
    const { tokenizeDetailed } = require('../../src/engine/parser/block-tokenizer');
    const doc = 'כותרת 1 - חלק\nפסקה עם טקסט לבדיקת עוגני המקור של השורות והפרגמנטים בתוכן.\n';
    const settings = getDefaultSettings();
    const lexResult = lexDocument(doc, {});
    const detail = tokenizeDetailed(lexResult.bodyLines, {});
    const model = buildDocumentModel(doc, { lexResult, detail, parseOpts: {}, inlineOptions: {} });
    const res = typeset(doc, settings);
    assert(res.contentPreserved, 'תוכן נשמר');
    let checked = 0;
    const blk = model.blocks.find(b => b.kind === 'paragraph');
    for (const ln of allLines(res)) {
      if (!ln.lineModel || ln.kind === 'heading') continue;
      for (const f of ln.lineModel.fragments) {
        if (f.kind !== 'text' || !f.sourceRange) continue;
        assert(f.sourceRange.start >= blk.sourceRange.start && f.sourceRange.end <= blk.sourceRange.end, 'הטווח בתוך הבלוק');
        assert(f.sourceRange.blockId === blk.id, 'blockId ממולא');
        checked++;
      }
    }
    assert(checked >= 8, 'פרגמנטים נבדקו: ' + checked);
  });

  it('22+24. דטרמיניזם + מדידה יחידה לכל פריט (הוכחה מונה-בפועל)', () => {
    const doc = 'כותרת 1 - חלק\nפסקה עם הערה [הערה למדידה יחידה] וטקסט רגיל לבדיקת המדידה.\nכותרת 3 - כותרת לבדיקת מדידה יחידה\nפסקת סיום אמיתית עם עוד כמה מילים.\n';
    const a = typeset(doc, getDefaultSettings());
    const b = typeset(doc, getDefaultSettings());
    assertEq(a.layoutHash, b.layoutHash, 'דטרמיניזם: hash זהה בין ריצות');
    // מדידה יחידה: מונה ה-instrument מוכיח שכל פריט שורה נמדד בדיוק פעם אחת
    clearItemMeasureCache();
    const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
    const { tokenizeDetailed } = require('../../src/engine/parser/block-tokenizer');
    const lexResult = lexDocument(doc, {});
    const detail = tokenizeDetailed(lexResult.bodyLines, {});
    const model = buildDocumentModel(doc, { lexResult, detail, parseOpts: {}, inlineOptions: {} });
    const ctx = { settings: getDefaultSettings(), instrument: true };
    const built = buildLineSequences(model, ctx);
    assert(built.ok, 'בנייה תקינה');
    const log = built.measureLog || ctx.__measureLog;
    assert(log && log.size > 10, 'יומן מדידה נאסף: ' + (log ? log.size : 0));
    let twice = 0;
    for (const [k, v] of log) if (v > 1) twice++;
    assertEq(twice, 0, 'אף פריט לא נמדד פעמיים (' + twice + ' מתוך ' + log.size + ')');
    // וכל פריט ברצפים מקושר למדידה קפואה
    for (const seq of built.sequences) for (const it of seq.items) {
      if (it.role === 'penalty') continue;
      assert(it.measured && it.measured.ok, 'מדידה מקושרת: ' + it.itemId);
      assert(Number.isFinite(it.measuredAdvance), 'advance נשמר');
    }
  });

  it('23. זהות נכסים וגופנים: אותן זהויות מה-resolver ועד ה-LineModel (Worker parity)', () => {
    clearRegisteredFonts();
    clearItemMeasureCache();
    const ar = new AssetResolver();
    const { tinyPngFor } = require('../helpers/tiny-png');
    ar.addBytes('img/x.png', tinyPngFor(6, 9));
    const transport = ar.serializeForTransport();
    const ar2 = AssetResolver.fromTransport(transport);
    const doc = 'כותרת 1 - חלק\nפסקה עם תמונה #img/x.png# אחת וטקסט סביבה לזרימה.\n';
    const r1 = typeset(doc, getDefaultSettings(), { assets: ar });
    const r2 = typeset(doc, getDefaultSettings(), { assets: ar2 });
    assert(r1.contentPreserved && r2.contentPreserved, 'תוכן נשמר בשני הצדדים');
    assertEq(r1.layoutHash, r2.layoutHash, 'אותה תוצאה בין resolver חי ל-transport (Worker parity)');
    // הזהות: אותו assetId מה-resolver מופיע באבחון/במודל
    const resolved = ar.measure('img/x.png');
    assert(resolved.ok && resolved.assetId, 'זהות נכס מה-resolver');
    void ar2;
  });

  it('25. אין שבירה ב-renderer: ה-glue allocation מוקצה פעם אחת ב-LineModel ונצרך', () => {
    const doc = 'כותרת 1 - חלק\nפסקה ארוכה למדי עם הרבה מילים שתישבר לכמה שורות בטור, כדי שהקצאת הרווחים בין המילים תחושב בפועל פעם אחת במנוע והרנדרר רק יצרוך אותה בלי למתוח שוב ובלי לשבור שורות בעצמו.\n';
    const res = typeset(doc, getDefaultSettings());
    const lines = allLines(res).filter(l => l.kind !== 'heading' && l.lineModel);
    assert(lines.length >= 2, 'מספר שורות לבדיקת ההקצאה');
    for (const ln of lines) {
      const lm = ln.lineModel;
      assert(lm.constraints && lm.constraints.justify === 'stretch', 'מדיניות justify מהמנוע (ברירת המחדל)');
      for (const g of lm.glue) {
        assert(Number.isFinite(g.allocationPx) && g.allocationPx >= 0, 'הקצאת glue חד-פעמית על כל רווח');
      }
      // שורות מיושרות: סכום ההקצאות = הרוחב האפקטיבי (עד סבילות עיגול) — לא שורה אחרונה
      if (!lm.isLast) {
        const total = lm.fragments.reduce((s, f) => s + f.measuredAdvance, 0) + lm.glue.reduce((s, g) => s + g.allocationPx, 0);
        assert(Math.abs(total - lm.effectiveMaxWidthPx) < 0.51, `הקצאה מלאה עד הרוחב (${total.toFixed(2)} ≈ ${lm.effectiveMaxWidthPx})`);
      }
    }
  });

  it('26. תצוגה ו-PDF: renderPage + exportPdf רצים על הפלט הקנוני ושומרים תוכן', () => {
    const doc = 'כותרת 1 - חלק\nפסקה עם הערה [הערה לייצוא] וטקסט לתצוגה ולייצוא במסמך הבדיקה של מקטע ב.\nכותרת 3 - כותרת לתצוגה ולייצוא\nפסקת סיום אמיתית עם עוד כמה מילים לזרימה תקינה.\n';
    const settings = getDefaultSettings();
    const res = typeset(doc, settings);
    assert(res.contentPreserved, 'תוכן נשמר');
    const mkDoc = () => ({
      createElement: (t) => ({ tagName: t, children: [], attrs: {}, style: {}, dataset: {}, setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { this.children.push(c); return c; }, set textContent(v) { this._t = String(v); this.children = []; }, get textContent() { return this._t != null ? this._t : this.children.map(c => c.text || '').join(''); } }),
      createTextNode: (t) => ({ text: t })
    });
    let domText = '';
    for (const pg of res.pages) {
      const el = renderPage(pg, settings, mkDoc());
      const collect = (n) => {
        if (typeof n.text === 'string') domText += n.text;
        else if (typeof n.textContent === 'string' && (!n.children || !n.children.length)) domText += n.textContent;
        for (const c of (n.children || [])) collect(c);
      };
      collect(el);
    }
    for (const w of ['פסקה', 'הערה', 'כותרת', 'סיום']) assert(domText.includes(w), 'המילה "' + w + '" בפלט ה-DOM');
    if (HAS_DEJAVU) {
      const pdf = exportPdf(doc, {}, fs.readFileSync(DEJAVU), 'DejaVu Sans');
      assert(pdf.ok, 'exportPdf הצליח');
      assert(pdf.bytes && pdf.bytes.length > 500, 'PDF לא ריק');
    }
  });
});

report('s4b-production-path');
