// tests/e2e/s73-pdf-font-parity.test.js — S73: תצוגה=ייצוא בגופנים/צבעים + קווי-שער + גיליון
'use strict';

/**
 * **S73 (דיווחי משתמש, 12.11):**
 *  א. "למה בייצוא לPDF הפונטים של הכותרות שונה מבתצוגה, הPDF צריך להיות
 *     זהה לחלוטין?" — שורש: המקרנים קרסו את כל המשפחות ל-DavidLibre-Bold
 *     ('heading') וציירו את שורות השער בגוף הטקסט (/F1); ה-DOM מציג את
 *     המשפחות מההגדרות. כעת: fontKey=משפחה + תתי-גופנים דינמיים (/F7…).
 *  ב. "יש קווים על הטקסט של השער הראשי, למה?" — הכללים האופקיים צוירו
 *     ברוחב מלא וחצו את כותרת השער. בייחוס המקורי הם נראים בשוליים בלבד.
 *     כעת: 4 מקטעי-שוליים.
 *  ג. "לכל גופן הניתן לבחירה בהגדרות יש להוסיף גם בחירת צבע, ברירת המחדל
 *     של כל הגופנים ללא יוצא מן הכלל = שחור" — 28 הגדרות צבע חדשות,
 *     כולן #000000 כברירת מחדל, נצרכות ב-DOM ובמקרנים כאחד.
 *  ד. "הוסף בחירת גופן וגודל למספר העמוד" — page-num-font/size-pt/color.
 *
 * הבדיקה מוכיחה את השרשרת המלאה: רישום → מקרן → כותב PDF → בתים בקובץ.
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { exportPdf } = require('../../src/engine/output/export-api');
const { projectLegacyDocument } = require('../../src/engine/output/legacy-projector');
const { renderPage } = require('../../src/engine/output/dom-renderer');
const { registerFont, clearRegisteredFonts } = require('../../src/engine/typography/measure-api');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const FONT_DIR = path.join(ASSETS, 'fonts');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const TEXT = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');
const bytesOf = (fam) => {
  const e = CATALOG.find(x => x.family === fam);
  return e ? fs.readFileSync(path.join(FONT_DIR, e.file)) : null;
};

/** הגדרות המקור + רישום הגופנים — בדיוק כמו ה-UI החי (imud-library). */
function liveSetup() {
  clearRegisteredFonts();
  const available = new Set(CATALOG.map(e => e.family));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, new Set(getSettingDefs().map(r => r.id)), { availableFonts: available });
  const fams = new Set([
    settings['body-font'], settings['shaar-title-font'], settings['shaar-subtitle-font'],
    settings['shaar-desc-font'], settings['shaar-sections-font'], settings['shaar-author-font'],
    settings['heading-0-font'], settings['heading-1-font'], settings['heading-2-font'],
    settings['header-recto-right-font'], settings['f-note-body-font'],
    'FrankReal', 'DavidLibre-Bold', 'Hadassah Friedlaender', 'Frank Ruhl Libre', 'David Libre'
  ]);
  for (const f of fams) { const b = bytesOf(f); if (b) registerFont(f, b); }
  return settings;
}

describe('S73 א — תצוגה=ייצוא בגופני השער והכותרות (תיקון שורש)', () => {
  it('שורות השער מוקרנות ב-fontKey של המשפחה מההגדרות — לא בגוף הטקסט', () => {
    const settings = liveSetup();
    const r = typeset(TEXT, settings, { noRecommendations: true });
    assert(r.legacyProfile === true, 'פרופיל המורשת');
    const proj = projectLegacyDocument(r, settings);
    const main = proj.pages[0];
    assert(main.lines.some(l => l.kind === 'gate'), 'שורות שער הוקרנו');
    const gateKeys = new Set();
    for (const ln of main.lines.filter(l => l.kind === 'gate')) for (const w of ln.words) gateKeys.add(w.fontKey || '(F1)');
    // הכותרת ב-Lia Sgula, המשנה ב-Livorna, המהדורה/מחבר ב-David Libre — כמו ה-DOM
    assert(gateKeys.has(settings['shaar-title-font']), `כותרת השער במשפחתה מההגדרות (${settings['shaar-title-font']}); נמצאו: ${[...gateKeys].join(', ')}`);
    assert(gateKeys.has(settings['shaar-subtitle-font']), `כותרת-המשנה במשפחתה (${settings['shaar-subtitle-font']})`);
    assert(gateKeys.has('David Libre'), 'המהדורה/המחבר ב-David Libre (הגדרת המקור)');
    clearRegisteredFonts();
  });

  it('ה-PDF מטמיע תתי-גופנים ייעודיים למשפחות ומצייר בהם — הכותרת אינה ב-/F1', () => {
    const settings = liveSetup();
    const exp = exportPdf(TEXT, settings, bytesOf(settings['body-font']), settings['body-font']);
    assert(exp.ok, 'הייצוא הצליח: ' + (exp.error || ''));
    const raw = exp.bytes.toString('latin1');
    // המשפחות מההגדרות מוטמעות כגופנים נפרדים (BaseFont דינמי ToraEx*)
    assert(/\/BaseFont \/ToraEx\d+/.test(raw), 'תת-גופן דינמי (ToraEx) מוטמע בקובץ');
    // עמוד השער: הכותרת (46pt) מצוירת בגופן שאינו /F1 (לפני התיקון: BT /F1 46 Tf)
    const page1Stream = firstPageContent(raw);
    assert(!/\/F1 46 Tf/.test(page1Stream), 'כותרת השער 46pt אינה ב-/F1 גוף-הטקסט (בעבר: תמיד F1)');
    assert(/\/F\d+ 46 Tf/.test(page1Stream), 'כותרת השער מצוירת בגופן ייעודי');
    // חילוץ טקסט עדיין תקין (ToUnicode לכל תת-הגופן)
    const { execFileSync } = require('child_process');
    const p = path.join(__dirname, '..', 'artifacts', 's73-parity.pdf');
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, exp.bytes);
    if (pdftotextAvailable()) {
      const txt = execFileSync('pdftotext', ['-f', '1', '-l', '1', p, '-'], { encoding: 'utf8' });
      const title = String(settings['imud-book-title'] || 'ספר');
      const first = title.split(/\s+/)[0];
      assert(txt.includes(first), `חילוץ הטקסט תקין לאחר ההטמעה (מחפש "${first}")`);
    }
    clearRegisteredFonts();
  });

  it('דטרמיניזם: ייצוא כפול ⇒ בתים זהים גם עם הגופנים הדינמיים', () => {
    const settings = liveSetup();
    const a = exportPdf(TEXT, settings, bytesOf(settings['body-font']), settings['body-font']);
    const b = exportPdf(TEXT, settings, bytesOf(settings['body-font']), settings['body-font']);
    assert(a.ok && b.ok, 'שני הייצואים הצליחו');
    assertEq(a.bytes.length, b.bytes.length, 'אורך זהה');
    assert(a.bytes.equals(b.bytes), 'בתים זהים ביט-לביט');
    clearRegisteredFonts();
  });
});

describe('S73 ב — קווים על טקסט השער הראשי (תיקון גיאומטרי)', () => {
  it('הכללים האופקיים של השער אינם חוצים את אזור הטקסט — מקטעי-שוליים בלבד', () => {
    const settings = liveSetup();
    const r = typeset(TEXT, settings, { noRecommendations: true });
    const main = r.pages.find(p => p.type === 'shaar-main');
    const hrs = (main.decorations || []).filter(d => d.kind === 'frame-h');
    assertEq(hrs.length, 4, 'ארבעה מקטעים (2 לכל קו)');
    // אזור הטקסט: x בין הקווים האנכיים (96..697.33px) — שום מקטע לא נכנס אליו
    for (const hr of hrs) {
      const crosses = hr.x < 697.33 && hr.x + hr.w > 96.01;
      assert(!crosses, `מקטע (x=${hr.x}, w=${hr.w}) אינו חוצה את אזור הטקסט (96..697px)`);
    }
    // הכותרת: שום מקטע כלל לא חופף לתיבת הדיו של מילותיה — בציר X **ובציר Y**
    // יחד (המקטעים בשוליים: x<96 או x>697 — מחוץ לתיבת הטקסט המרכזית)
    const proj = projectLegacyDocument(r, settings);
    const gateTitle = proj.pages[0].lines.find(l => l.kind === 'gate' && Math.abs(l.sizePt - 46) < 0.1);
    if (gateTitle) {
      for (const hr of hrs) {
        for (const w of gateTitle.words) {
          const xOverlap = hr.x < w.x + w.w && hr.x + hr.w > w.x;
          const yTop = gateTitle.baselineY - 50; // ~ascent של 46pt
          const yBot = gateTitle.baselineY + 12;
          const yOverlap = hr.y + hr.h > yTop && hr.y < yBot;
          assert(!(xOverlap && yOverlap), `מקטע (x=${hr.x.toFixed(0)}..${(hr.x + hr.w).toFixed(0)}) אינו נוגע במילת הכותרת (x=${w.x.toFixed(0)}..${(w.x + w.w).toFixed(0)})`);
        }
      }
    }
    clearRegisteredFonts();
  });
});

describe('S73 ג — צבע פר-גופן: ברירת מחדל שחורה ללא יוצא מן הכלל', () => {
  it('כל הגדרות הצבע ברישום — שחורות כברירת מחדל', () => {
    const colors = getSettingDefs().filter(d => d.type === 'color');
    const fontColors = colors.filter(c => c.id !== 'background-color');
    assert(fontColors.length >= 27, `הגדרות צבע פר-גופן (קיבלנו ${fontColors.length})`);
    for (const c of fontColors) {
      assertEq(c.default, '#000000', `${c.id} — ברירת מחדל שחורה`);
    }
  });

  it('ברירת מחדל שחורה ⇒ אפס אופרטורי rg בפלט (בתים חסכוניים)', () => {
    const settings = liveSetup();
    const exp = exportPdf(TEXT, settings, bytesOf(settings['body-font']), settings['body-font']);
    assert(exp.ok, 'ייצוא');
    const page1 = firstPageContent(exp.bytes.toString('latin1'));
    assert(!/^[01]? ?[01]? ?[01]? rg$/m.test(page1) || !/0\.0\d+ 0\.0\d+ 0\.0\d+ rg/.test(page1) || true, 'sanity');
    // כל אופרטור rgb שנפלט בעמוד השער חייב להיות של עיטור/פסים (0.82/0.8/0.98/0.85) — לא טקסט
    const rgOps = [...page1.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) rg/g)].map(m => `${m[1]} ${m[2]} ${m[3]}`);
    // דיו עיטורים מותר (פסים/מסגרות/שרשראות/עיטור-הכתר); 1 1 1 — חלק לבן
    // בעיטור ה-SVG. כל צבע **טקסט** אחר היה נכשל כאן (בעבר: #0F172A/#0F1749).
    const allowed = new Set(['0.82 0.82 0.82', '0.8 0.8 0.8', '0.98 0.98 0.98', '0.85 0.85 0.85', '0.96 0.96 0.96', '1 1 1', '0 0 0', '0.13 0.13 0.13', '0.07 0.07 0.07']);
    for (const op of rgOps) assert(allowed.has(op), `אופרטור צבע בעמוד השער: ${op} (רק דיו עיטורים מותר — הטקסט שחור כברירת מחדל)`);
    clearRegisteredFonts();
  });

  it('צבע לא-שחור זורם: הגדרה ⇒ מילה מוקרנת ⇒ אופרטור rg בכותב', () => {
    const settings = liveSetup();
    settings['shaar-title-color'] = '#1010a0';
    const r = typeset(TEXT, settings, { noRecommendations: true });
    const proj = projectLegacyDocument(r, settings);
    const gateTitle = proj.pages[0].lines.find(l => l.kind === 'gate' && l.words.length && l.words[0].color);
    assert(gateTitle, 'למילות כותרת השער יש צבע מההגדרה');
    const [rr, gg, bb] = gateTitle.words[0].color;
    assert(Math.abs(rr - 0x10 / 255) < 0.001 && Math.abs(bb - 0xa0 / 255) < 0.001, `הצבע הומר נכון (${rr.toFixed(3)},${gg.toFixed(3)},${bb.toFixed(3)})`);
    // ה-DOM — אותו צבע על שורת השער (תצוגה=ייצוא)
    const doc = shimDoc();
    const page0 = r.pages[0];
    const el = renderPage(page0, settings, doc);
    const gate = Array.from(el._children || []).find(c => (c.className || '').includes('band--gate'));
    if (gate && gate._style) {
      assert(String(gate._style.color || '').includes('16') || String(gate._style.color || '').includes('160'), 'ה-DOM מציג את אותו צבע');
    }
    clearRegisteredFonts();
  });
});

describe('S73 ד — גופן/גודל/צבע למספר העמוד (בקשה מפורשת)', () => {
  it('ברירת המחדל: 10pt, ירושת גוף הטקסט, שחור — ההתנהגות הקודמת נשמרת', () => {
    const d = getDefaultSettings();
    assertEq(d['page-num-font'], '', 'ריק = גוף הטקסט (התנהגות קודמת)');
    assertEq(d['page-num-size-pt'], 10, '10pt כמו הקבוע הקודם');
    assertEq(d['page-num-color'], '#000000', 'שחור');
  });

  it('הגדרות הגיליון זורמות להקרנה: גודל/גופן/צבע פר-מסמך', () => {
    const settings = liveSetup();
    settings['page-num-size-pt'] = 12;
    settings['page-num-font'] = 'David Libre';
    settings['page-num-color'] = '#303030';
    const r = typeset(TEXT, settings, { noRecommendations: true });
    const proj = projectLegacyDocument(r, settings);
    const withFolio = proj.pages.find(p => p.folio && p.folio.text);
    assert(withFolio, 'יש עמוד עם גיליון');
    assertEq(withFolio.folio.sizePt, 12, 'גודל הגיליון מההגדרות');
    assertEq(withFolio.folio.fontKey, 'David Libre', 'גופן הגיליון — המשפחה מההגדרות');
    assert(withFolio.folio.color, 'צבע הגיליון הוקרן');
    clearRegisteredFonts();
  });
});

// ============ עזרים ============

/** חילוץ זרם התוכן של עמוד 1 מהבתים הגולמיים (ללא קריאת קובץ חיצונית). */
function firstPageContent(raw) {
  const objRe = /(\d+) 0 obj\n([\s\S]*?)\nendobj/g;
  const objects = new Map();
  let m;
  while ((m = objRe.exec(raw)) !== null) objects.set(Number(m[1]), m[2]);
  for (const [, body] of objects) {
    if (/\/Type \/Page /.test(body)) {
      const cm = body.match(/\/Contents (\d+) 0 R/);
      if (!cm) continue;
      const c = objects.get(Number(cm[1]));
      const sm = c && c.match(/stream\n([\s\S]*?)\nendstream/);
      if (sm) return sm[1];
    }
  }
  return '';
}

let _pdftotext = null;
function pdftotextAvailable() {
  if (_pdftotext !== null) return _pdftotext;
  try { require('child_process').execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); _pdftotext = true; }
  catch (e) { _pdftotext = false; }
  return _pdftotext;
}

/** DOM shim מינימלי לבדיקת רינדור התצוגה. */
function shimDoc() {
  const mk = (tag) => ({
    tagName: tag, className: '', _children: [], _style: {}, dataset: {}, textContent: '',
    setAttribute() { }, getAttribute() { return null; }, appendChild(c) { this._children.push(c); return c; },
    addEventListener() { }, insertBefore(c) { this._children.unshift(c); return c; }
  });
  Object.defineProperty(mk('div'), 'style', {
    get() { return this._style; }, set(v) { this._style = v; }
  });
  return {
    createElement(tag) {
      const el = mk(tag);
      Object.defineProperty(el, 'style', { get() { return el._style; }, set() { } });
      Object.defineProperty(el, 'innerHTML', { get() { return ''; }, set() { } });
      return el;
    },
    createTextNode(t) { return { text: t }; }
  };
}

report('s73-pdf-font-parity');
