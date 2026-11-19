#!/usr/bin/env node
// tools/parity/parity-signature.js — חתימה מבנית/גיאומטר� ישירה legacy↔unified (סעיף ה בהוראת 19.11)
//
// מטרה: השוואת תוצאת שני המנועים על אותו קלט/הגדרות/גופנים/סביבה בדיוק —
// מבלי לעבור דרך adapter שמסנתז שדות (שיטת run-ours ההיסטורית קראה שכבת
// result.pages בלבד ומיפתה לסכמת הייחוס; כאן קוראים כל צד מהמבנה הקנוני שלו).
//
//   צד המורשת: result.pages[] (פלט המנוע המורשת) — שורות עם words/sizePt/font/y/heightPx.
//   צד המאוחד: result.pageModel (PageModel הקנוני) — שורות עם x/y/w/h/sizePt/align + מילים עם x/w.
//
// כללי הכלי (הוראת 19.11, סעיף ה):
//   1. אין הנחות על שמות שדות חוצי-שכבות; שדה שקיים רק בצד אחד מסומן ב-layerGaps
//      ואינו מאופס ואינו מושמט בשקט.
//   2. כימות (quantization) מוגדר במקום אחד — COORD_Q — ומיושם סימטרית לשני הצדדים.
//   3. כשל מפיק diff ראשון מפורט + artifact JSON מלא עם מספרי עמוד/טור/שורה/מילה.
//   4. negative controls: שינוי מילה/גופן/גודל/x/y/צבע/הערה — כל אחד חייב להפעיל את השער.
//   5. דטרמיניזם נבדק בנפרד לכל מנוע (legacy↔legacy, unified↔unified) — לא לבלבל עם parity.
//
// שימוש:
//   node tools/parity/parity-signature.js [corpus.txt] [--out dir] [--controls] [--determinism] [--max-diffs N]
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');
const AUD = path.join(ROOT, 'audits');

const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings, getSettingDefs } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
// **תיקון הארנס (19.11, סשן הביצועים §3.1):** רישום הגופנים עובר ל-fontResolver —
// נקודת הכניסה היחידה של ה־Worker החי (engine-worker-main handleRegisterFont).
// בעבר נרשם ישירות ב-measure-api בלבד ⇒ ה-resolver נותר ריק ⇒ המאוחד מדד
// מילים בקירוב טבלה (מופע חדש לכל קריאה) בזמן שהמורשת מדדה במטריקות אמת —
// פער מדידה מלאכותי בין המנועים שהנפיח גם את הפרשי הביצועים וגם את מספרי
// ה-parity (very_long: 992 עמ' במקום 851 בנתיב הייצור). הרישום דרך ה-resolver
// מסונכרן גם ל-measure-api (אותם בתים, אותה זהות תוכן) — המורשת לא נפגעת.
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { GEO } = require(path.join(RB, 'src/engine/core/imud-geometry'));

// ---------- כימות קואורדינטות — מקום אחד, סימטרי לשני הצדדים ----------
const COORD_Q = 0.01; // pt; כל ערך גיאומטרי מעוגל ל־2 ספרות עשרוניות בשני הצדדים
const q = (v) => (typeof v === 'number' && Number.isFinite(v)) ? Math.round(v * 100) / 100 : v;

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

// ---------- הגדרות הנתיב החי (כמו run-ours.js — אותן הגדרות לשני המנועים) ----------
function liveSettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const imp = importImudSettings(legacy, regKeys, { availableFonts: families });
  return imp.settings;
}

function registerLiveFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['Alpha', 'Alpha-Regular.ttf'],
    ['AlphaLight', 'Alpha-Light.ttf'], ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'],
    ['FrankReal', 'FrankReal-Regular.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['DavidLibre', 'DavidLibre-Bold.ttf'],
    ['Hadassah Friedlaender', 'Hadassah-Friedlaender-Regular.ttf']
  ];
  const registered = [];
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) {
      const bytes = fs.readFileSync(fp);
      const res = fontResolver.registerFont(fam, bytes, { source: 'parity-signature' });
      if (res.ok) registered.push(fam); else console.error(`registerFont failed for ${fam}: ${res.code}`);
    }
  }
  return registered;
}

function typesetEnvExtras() {
  const p = (f) => { const fp = path.join(RB, 'ui/assets/imud/fonts', f); return fs.existsSync(fp) ? fs.readFileSync(fp) : null; };
  return {
    marginFontBytes: p('Hadassah-Friedlaender-Regular.ttf'),
    windowFontBytes: p('FrankReal-Bold.ttf'),
    prefaceFontBytes: p('FrankRuhlLibre-VF.ttf'),
    headingFontBytes: p('DavidLibre-Bold.ttf')
  };
}

// ---------- חילוץ חתימה: צד המורשת (result.pages — הפלט הקנוני של המנוע) ----------
function extractLegacy(result) {
  if (result.legacyProfile !== true) throw new Error('extractLegacy: result is not legacy profile');
  const pages = result.pages.map((pg, pi) => {
    const lines = [];
    const twoCol = Array.isArray(pg.columns) && pg.columns.length === 2;
    (pg.columns || []).forEach((colLines, ci) => {
      const colName = pg.type === 'preface' ? 'single' : (ci === 0 ? 'right' : 'left');
      for (const ln of colLines) {
        if (!ln.words || !ln.words.length) continue;
        const text = ln.words.join(' ').trim();
        if (!text) continue;
        const entry = {
          page: pi, col: colName, colIdx: ci, li: ln.lineIdx != null ? ln.lineIdx : null,
          kind: ln.kind || 'unknown',
          text,
          sizePt: q(ln.sizePt),
          y: q(ln.y), h: q(ln.heightPx),
          isLast: ln.isLast === true,
          // שדות שקיימים בשכבת המורשת בלבד — מתועדים ומושווים בנפרד (ראה layerFields)
          _font: ln.font || null,
          _paraId: ln.paraId != null ? ln.paraId : null,
          _tokenId: ln.tokenId != null ? ln.tokenId : null,
          _markerCount: Array.isArray(ln.markerIdx) ? ln.markerIdx.length : 0,
          _window: !!(ln.window && ln.windowWords)
        };
        if (entry._window && ln.windowWords) {
          lines.push({ ...entry, text: ln.windowWords.join(' '), _windowLine: true, sizePt: q(ln.sizePt * 1.5) });
        }
        lines.push(entry);
      }
    });
    // **שורות שער (gateLines):** במורשת טקסט השער אינו בעמודות אלא ב־gateLines —
    // אותה שכבה שקלט החתימה מחלץ; במאוחד שורות השער הן kind='shaar-content' ב־lines.
    for (const gl of (pg.gateLines || [])) {
      if (!gl || !gl.text) continue;
      lines.push({
        page: pi, col: 'gate', colIdx: -1, li: null,
        kind: 'gate', text: String(gl.text),
        sizePt: q(gl.sizePt), y: q(gl.y), h: null,
        isLast: null,
        _font: gl.font || null,
        _color: Array.isArray(gl.color) ? gl.color.join(',') : null
      });
    }
    // **שורות TOC (page.toc.rows):** במורשת שורות תוכן העניינים אינן בעמודות
    // אלא ב־page.toc.rows — עם טקסט/רמה/y/פוליו. במאוחד הן kind='toc-row' ב־lines.
    const tocRows = (pg.toc && Array.isArray(pg.toc.rows)) ? pg.toc.rows : [];
    for (const row of tocRows) {
      lines.push({
        page: pi, col: 'toc', colIdx: -1, li: null,
        kind: 'toc-row', text: String(row.text || ''),
        sizePt: q(row.sizePt), y: q(row.y), h: null,
        isLast: null,
        _level: row.level != null ? row.level : null,
        _folio: row.folio != null ? String(row.folio) : null
      });
    }
    return {
      index: pg.index != null ? pg.index : pi,
      type: pg.type || 'unknown',
      folio: typeof pg.folioDisplay === 'string' ? pg.folioDisplay : null,
      pageNumber: pg.pageNumber != null ? pg.pageNumber : null,
      columns: twoCol
        ? [{ x: q(GEO.COL_R_X), w: q(GEO.COL_W) }, { x: q(GEO.COL_L_X), w: q(GEO.COL_W) }]
        : [{ x: q(GEO.COL_L_X), w: q(GEO.SINGLE_W) }],
      lines,
      footnotes: (pg.footnotes || []).map((fn, i) => ({
        i, text: (fn.words || []).join ? (fn.words || []).join(' ') : String(fn.text || '').slice(0, 120)
      })),
      sideNotes: (pg.sideNotes || []).length,
      marginNotes: (pg.marginNotes || []).length,
      decorations: (pg.decorations || []).length
    };
  });
  const toc = result.toc || {};
  return {
    engine: 'legacy',
    pageCount: pages.length,
    pages,
    toc: {
      // במורשת toc.general/detailed הם מונים בלבד; הרשומות עצמן מוקרנות כשורות
      // kind=toc-row בעמודי ה־TOC — והן מושוות שם ברמת השורה (page/line compare).
      generalCount: typeof toc.general === 'number' ? toc.general : (Array.isArray(toc.general) ? toc.general.length : null),
      detailedCount: typeof toc.detailed === 'number' ? toc.detailed : (Array.isArray(toc.detailed) ? toc.detailed.length : null)
    },
    layoutHash: String(result.layoutHash || ''),
    layerFields: {
      'line._font': 'משפחת הגופן לכל שורה — קיים במורשת בלבד',
      'line._paraId': 'מזהה פסקה במורשת (המקביל הקנוני: blockId/sourceTokenId במאוחד)',
      'line._tokenId': 'מזהה טוקן במורשת',
      'line._markerIdx': 'אינדקסי סמני הערות במורשת',
      'toc counts only': 'רשומות TOC מושוות דרך שורות toc-row בעמודי ה־TOC (שני הצדדים)'
    }
  };
}

// ---------- חילוץ חתימה: צד המאוחד (result.pageModel — המבנה הקנוני) ----------
function extractUnified(result) {
  if (result.legacyProfile === true) throw new Error('extractUnified: result is legacy profile (fallback forbidden)');
  const pm = result.pageModel;
  if (!pm || !Array.isArray(pm.pages)) throw new Error('extractUnified: PageModel missing — אין fallback, זו שגיאה מפורשת');
  const pages = pm.pages.map((pg, pi) => {
    const lines = (pg.lines || []).filter(l => l.words && l.words.length).map((ln) => {
      const words = ln.words.map(w => ({ text: String(w.text), x: q(w.x), w: q(w.w), color: Array.isArray(w.color) ? w.color.join(',') : (w.color != null ? String(w.color) : null) }));
      return {
        page: pi, col: ln.col === 0 ? 'right' : (ln.col === 1 ? 'left' : (ln.area === 'column' ? 'single' : String(ln.area || '?'))),
        colIdx: ln.col != null ? ln.col : -1, li: ln.li != null ? ln.li : null,
        // נרמול מוכר בכלי בלבד: shaar-content במאוחד = gateLines במורשת (אותה שכבת תוכן)
        kind: ln.kind === 'shaar-content' ? 'gate' : (ln.kind || 'unknown'),
        text: words.map(w => w.text).join(' '),
        sizePt: q(ln.sizePt),
        x: q(ln.x), y: q(ln.y), w: q(ln.w), h: q(ln.h),
        align: ln.align || null,
        isLast: ln.isLast === true,
        sourceTokenId: ln.sourceTokenId != null ? String(ln.sourceTokenId) : null,
        words,
        _bold: ln.bold === true
      };
    });
    const geoCols = (pg.geometry && pg.geometry.columns) || [];
    return {
      index: pg.index != null ? pg.index : pi,
      type: pg.type || 'unknown',
      folio: typeof pg.folioDisplay === 'string' ? pg.folioDisplay : null,
      pageNumber: pg.pageNumber != null ? pg.pageNumber : null,
      isRecto: pg.isRecto === true,
      columns: geoCols.map(c => ({ x: q(c.x), w: q(c.w) })),
      lines,
      footnotes: (pg.footnotes || []).map((fn, i) => ({
        i, text: (fn.words || fn.text || '').toString().slice(0, 120)
      })),
      sideNotes: (pg.sideNotes || []).length,
      decorations: (pg.decorations || []).length,
      images: (pg.images || []).length
    };
  });
  return {
    engine: 'unified',
    pageCount: pages.length,
    pages,
    toc: {
      // המאוחד נושא outline/tocLinks ב־PageModel.document; רשומות ה־TOC המוקרנות
      // מושוות דרך שורות toc-row בעמודי ה־TOC — אותה שכבה בשני הצדדים.
      outlineCount: ((pm.document && pm.document.outline) || []).length,
      tocLinksCount: ((pm.document && pm.document.tocLinks) || []).length
    },
    layoutHash: String(result.layoutHash || ''),
    layerFields: {
      'line.x/w': 'גיאומטריית שורה מלאה — קיימת ב־PageModel המאוחד בלבד',
      'line.words[].x/w/color': 'מיקום/רוחב/צבע לכל מילה — קיים במאוחד בלבד',
      'line.align': 'יישור שורה — קיים במאוחד בלבד',
      'page.isRecto': 'recto/verso — קיים במאוחד בלבד',
      'line.sourceTokenId': 'זהות טוקן מקור לשורה — קיים במאוחד בלבד'
    }
  };
}

// ---------- השוואה ----------
function diffSignatures(a, b, maxDiffs) {
  const diffs = [];
  const D = (cat, where, expect, actual) => {
    if (diffs.length < maxDiffs) diffs.push({ category: cat, where, expected: expect, actual });
    diffs.total = (diffs.total || 0) + 1;
  };
  // 1. page count
  if (a.pageCount !== b.pageCount) D('page-count', 'document', a.pageCount, b.pageCount);
  // 2. page-by-page (עד לאורך הקצר; הפרש אורך כבר דווח)
  const n = Math.min(a.pages.length, b.pages.length);
  for (let pi = 0; pi < n; pi++) {
    const pa = a.pages[pi], pb = b.pages[pi];
    if (pa.type !== pb.type) D('page-type', `page ${pi + 1}`, pa.type, pb.type);
    if ((pa.folio || null) !== (pb.folio || null)) D('page-folio', `page ${pi + 1}`, pa.folio, pb.folio);
    if ((pa.pageNumber || null) !== (pb.pageNumber || null)) D('page-number', `page ${pi + 1}`, pa.pageNumber, pb.pageNumber);
    const ca = JSON.stringify(pa.columns), cb = JSON.stringify(pb.columns);
    if (ca !== cb) D('page-columns-geometry', `page ${pi + 1}`, ca, cb);
    // line count
    if (pa.lines.length !== pb.lines.length) D('line-count', `page ${pi + 1}`, pa.lines.length, pb.lines.length);
    const ml = Math.min(pa.lines.length, pb.lines.length);
    for (let li = 0; li < ml; li++) {
      const la = pa.lines[li], lb = pb.lines[li];
      const w = `page ${pi + 1}, ${la.col} col, line ${li + 1}`;
      if (la.text !== lb.text) D('line-text', w, la.text.slice(0, 90), lb.text.slice(0, 90));
      if (la.kind !== lb.kind) D('line-kind', w, la.kind, lb.kind);
      if (la.sizePt !== lb.sizePt) D('line-sizePt', w, la.sizePt, lb.sizePt);
      if (la.y !== lb.y) D('line-y', w, la.y, lb.y);
      if (la.h !== lb.h) D('line-height', w, la.h, lb.h);
      if (la.isLast !== lb.isLast) D('line-isLast(p-end)', w, la.isLast, lb.isLast);
      // word count + word text (per word granularity where both sides have words)
      const wa = la.text.split(' '), wb = lb.text.split(' ');
      if (wa.length !== wb.length) D('word-count', w, wa.length, wb.length);
      for (let wi = 0; wi < Math.min(wa.length, wb.length); wi++) {
        if (wa[wi] !== wb[wi]) { D('word-text', `${w}, word ${wi + 1}`, wa[wi], wb[wi]); break; }
      }
    }
    // footnotes / sideNotes / decorations counts
    if (pa.footnotes.length !== pb.footnotes.length) D('footnote-count', `page ${pi + 1}`, pa.footnotes.length, pb.footnotes.length);
    if ((pa.sideNotes || 0) !== (pb.sideNotes || 0)) D('sidenotes-count', `page ${pi + 1}`, pa.sideNotes || 0, pb.sideNotes || 0);
    if ((pa.decorations || 0) !== (pb.decorations || 0)) D('decorations-count', `page ${pi + 1}`, pa.decorations || 0, pb.decorations || 0);
  }
  // 3. TOC — מוני רשומות; הטקסט/עמוד של כל רשומה מושווה בשורות toc-row (לעיל)
  if ((a.toc.generalCount || 0) !== (b.toc.outlineCount || 0)) D('toc-general-count', 'toc', a.toc.generalCount, b.toc.outlineCount);
  return diffs;
}

// ---------- negative controls: הקומפרטור חייב לתפוס כל שינוי מוזרק ----------
function runControls(sigA, sigB, compare, maxDiffs) {
  const results = [];
  const mustFail = (name, mutate) => {
    const m = JSON.parse(JSON.stringify(sigB)); // deep clone — מוטציה על החתימה בלבד
    mutate(m);
    const d = compare(sigA, m, maxDiffs);
    const total = d.total || d.length;
    results.push({ control: name, tripped: total > 0, diffCount: total });
  };
  mustFail('word-change (טקסט מילה אחת)', (m) => {
    const l = m.pages.flatMap(p => p.lines).find(l => l.words && l.words.length > 2);
    if (l) { l.words[1].text = 'ZZZ'; l.text = l.words.map(w => w.text).join(' '); }
  });
  mustFail('font-family change (בשכבת המורשת)', (m) => {
    const l = m.pages.flatMap(p => p.lines).find(l => '_font' in l);
    if (l) l._font = 'Changed-Font';
  });
  mustFail('size change (sizePt)', (m) => {
    const l = m.pages.flatMap(p => p.lines).find(l => typeof l.sizePt === 'number');
    if (l) l.sizePt = l.sizePt + 0.5;
  });
  mustFail('x-position change', (m) => {
    const l = m.pages.flatMap(p => p.lines).find(l => typeof l.x === 'number');
    if (l) l.x = l.x + 1.5;
  });
  mustFail('y-position change', (m) => {
    const l = m.pages.flatMap(p => p.lines).find(l => typeof l.y === 'number');
    if (l) l.y = l.y + 2;
  });
  mustFail('color change (word)', (m) => {
    const w = m.pages.flatMap(p => p.lines).flatMap(l => l.words || []).find(w => w.color != null);
    if (w) w.color = '255,0,0';
  });
  mustFail('folio change (פוליו)', (m) => {
    const p = m.pages.find(p => p.folio);
    if (p) p.folio = p.folio + '\u05F4'; // הזרקת גרשיים — אסור לעבור בשקט (D-108)
  });
  mustFail('note addition', (m) => {
    const p = m.pages.find(p => p.footnotes);
    if (p) p.footnotes.push({ i: p.footnotes.length, text: 'הערת ביקורת' });
  });
  mustFail('page-count change', (m) => { m.pages.pop(); m.pageCount = m.pages.length; });
  return results;
}

// ---------- main ----------
function main() {
  const argv = process.argv.slice(2);
  const corpusArg = argv.find(a => !a.startsWith('--'));
  const outDir = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : path.join(AUD, 'parity-signature-artifacts');
  const wantControls = argv.includes('--controls');
  const wantDeterminism = argv.includes('--determinism');
  const maxDiffs = argv.includes('--max-diffs') ? parseInt(argv[argv.indexOf('--max-diffs') + 1], 10) || 40 : 40;
  const corpusPath = corpusArg ? path.resolve(corpusArg) : path.join(AUD, 'no_long_test_text.txt');

  const text = fs.readFileSync(corpusPath, 'utf8');
  fs.mkdirSync(outDir, { recursive: true });

  const registered = registerLiveFonts();
  const base = liveSettings();
  const settings = { ...getDefaultSettings(), ...base, 'measure-impl': 'font-metrics' };
  const envExtras = typesetEnvExtras();

  const runOnce = (unified) => typeset(text, unified ? { ...settings, '_engine-force-unified': true } : settings,
    { noRecommendations: true, ...envExtras });

  // ---- הרצות ----
  const tL0 = Date.now();
  const resLegacy = runOnce(false);
  const tLegacy = Date.now() - tL0;
  const tU0 = Date.now();
  const resUnified = runOnce(true);
  const tUnified = Date.now() - tU0;

  if (resLegacy.legacyProfile !== true) { console.error('FATAL: המנוע לא רץ כמורשת בצד המורשת'); process.exit(2); }
  if (resUnified.legacyProfile === true) { console.error('FATAL: המנוע נפל למורשת בצד המאוחד — fallback אסור'); process.exit(2); }
  if (!resUnified.pageModel) { console.error('FATAL: PageModel חסר בצד המאוחד'); process.exit(2); }

  const sigL = extractLegacy(resLegacy);
  const sigU = extractUnified(resUnified);

  // ---- דטרמיניזם (לכל מנוע בנפרד) ----
  let detLegacy = null, detUnified = null;
  if (wantDeterminism) {
    const rl2 = runOnce(false);
    detLegacy = String(rl2.layoutHash) === String(resLegacy.layoutHash);
    const ru2 = runOnce(true);
    detUnified = String(ru2.layoutHash) === String(resUnified.layoutHash);
  }

  // ---- השוואה ----
  const diffs = diffSignatures(sigL, sigU, maxDiffs);
  const totalDiffs = diffs.total || 0;

  // ---- negative controls ----
  let controls = null;
  if (wantControls) {
    controls = runControls(sigL, sigU, diffSignatures, maxDiffs);
    const failedControls = controls.filter(c => !c.tripped);
    if (failedControls.length) {
      console.error('NEGATIVE CONTROLS FAILED (הקומפרטור לא תפס):');
      for (const c of failedControls) console.error('  - ' + c.control);
    }
  }

  // ---- manifest ----
  const manifest = {
    tool: 'tools/parity/parity-signature.js',
    corpus: path.relative(ROOT, corpusPath),
    corpusSha256: sha256(text),
    settingsSha256: sha256(JSON.stringify(settings)),
    fontsRegistered: registered,
    fontsDirSha256: null, // ממולא להלן
    node: process.version,
    commit: safeCommit(),
    quantization: { COORD_Q, rule: 'round(v/COORD_Q)*COORD_Q — סימטרי לשני הצדדים' },
    engine: {
      legacy: { layoutHash: String(resLegacy.layoutHash), pages: resLegacy.pages.length, ms: tLegacy },
      unified: { layoutHash: String(resUnified.layoutHash), pages: resUnified.pageModel.pages.length, ms: tUnified }
    },
    determinism: { legacy: detLegacy, unified: detUnified },
    generatedAt: new Date().toISOString()
  };
  try {
    const fontFiles = fs.readdirSync(path.join(RB, 'ui/assets/imud/fonts')).sort();
    manifest.fontsDirSha256 = sha256(fontFiles.join('|'));
  } catch (e) { /* תיעוד בלבד */ }

  // ---- artifacts ----
  // כתיבה קומפקטית — קורפוסים גדולים (very_long: ~1,700 עמודים בשני הצדדים) אינם
  // נכנסים ל-heap בפורמט מורחב; הקובץ עצמו נשאר שלם וניתן לעיצוב חיצוני.
  fs.writeFileSync(path.join(outDir, 'signature-legacy.json'), JSON.stringify(sigL));
  fs.writeFileSync(path.join(outDir, 'signature-unified.json'), JSON.stringify(sigU));
  fs.writeFileSync(path.join(outDir, 'diff.json'), JSON.stringify({ totalDiffs, diffs }, null, 1));
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  if (controls) fs.writeFileSync(path.join(outDir, 'negative-controls.json'), JSON.stringify(controls, null, 1));

  // ---- סיכום אנושי ----
  const cat = {};
  for (const d of diffs) cat[d.category] = (cat[d.category] || 0) + 1;
  console.log('=== Parity Signature (legacy↔unified) ===');
  console.log(`corpus: ${manifest.corpus} (${manifest.corpusSha256.slice(0, 12)})`);
  console.log(`legacy : ${resLegacy.pages.length} pages · hash ${String(resLegacy.layoutHash).slice(0, 12)} · ${tLegacy}ms`);
  console.log(`unified: ${resUnified.pageModel.pages.length} pages · hash ${String(resUnified.layoutHash).slice(0, 12)} · ${tUnified}ms`);
  if (wantDeterminism) console.log(`determinism: legacy=${detLegacy ? 'OK' : 'FAIL'} unified=${detUnified ? 'OK' : 'FAIL'}`);
  console.log(`total diffs: ${totalDiffs} (הדוח המלא: ${path.relative(ROOT, path.join(outDir, 'diff.json'))})`);
  if (totalDiffs) {
    console.log('categories:', Object.entries(cat).map(([k, v]) => `${k}=${v}`).join(' · '));
    console.log('--- first diffs ---');
    for (const d of diffs.slice(0, 12)) {
      console.log(`  [${d.category}] ${d.where}`);
      console.log(`      legacy: ${JSON.stringify(d.expected).slice(0, 110)}`);
      console.log(`    unified: ${JSON.stringify(d.actual).slice(0, 110)}`);
    }
  }
  if (controls) {
    const ok = controls.every(c => c.tripped);
    console.log(`negative controls: ${ok ? 'ALL TRIPPED ✓' : 'SOME MISSED ✗'}`);
    for (const c of controls) console.log(`  ${c.tripped ? '✓' : '✗'} ${c.control} (${c.diffCount} diffs)`);
  }
  // תוצאה: parity מלא = 0 הבדלים. כל עוד יש הבדלים — FAIL מפורש, לא "ירוק מלאכותי".
  const parityPass = totalDiffs === 0;
  const controlsPass = !controls || controls.every(c => c.tripped);
  const detPass = !wantDeterminism || (detLegacy && detUnified);
  console.log(`RESULT: ${parityPass && controlsPass && detPass ? 'PASS' : 'FAIL'} (parity=${parityPass ? 'PASS' : 'FAIL'}, controls=${controlsPass ? 'PASS' : 'FAIL'}${wantDeterminism ? `, determinism=${detPass ? 'PASS' : 'FAIL'}` : ''})`);
  process.exit(parityPass && controlsPass && detPass ? 0 : 1);
}

function safeCommit() {
  try { return require('child_process').execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim(); }
  catch (e) { return null; }
}

main();
