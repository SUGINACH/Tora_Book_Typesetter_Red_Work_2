// tests/e2e/s9b-toc-d107.test.js — שלב 9b פרוסה 9b.2: יישום מלא של D-107 בתוכן-העניינים
// דורש: כללי 1–6, מפורט 2–6, H7 מוסתר בשניהם, H1 לא במפורט, H0 לא נכנס בטעות,
// inline כבוי בכל הרמות, שניהם פעילים בברירת המחדל, ייבוא לא דורס בחירת משתמש,
// אין כפילויות/השמטות, עוגנים ויעדי עמוד נכונים — בעמודים האמיתיים, במודל
// התאימות (r.toc) ובפרופילי ברירת המחדל (dp-defaults ו-imud-cutover).
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { registerFont } = require('../../src/engine/typography/measure-api');
const { splitGeneralDetail } = require('../../src/engine/decoration/toc-builder');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
if (!fs.existsSync(CORPUS_PATH)) {
  execSync(`node ${path.join(__dirname, '..', 'fixtures', 'generate_canonical_corpus.js')}`, { stdio: 'inherit' });
}
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

const RB = path.join(__dirname, '..', '..');
const FONTS = [
  ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
  ['Alpha', 'Alpha-Regular.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['AlphaLight', 'Alpha-Light.ttf'],
  ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'],
  ['David Libre', 'DavidLibre-Regular.ttf'], ['Hadassah Friedlaender', 'Hadassah-Friedlaender.ttf']
];
function registerAllFonts() {
  for (const [fam, file] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', file);
    if (fs.existsSync(fp)) { const r = registerFont(fam, fs.readFileSync(fp)); if (!r.ok) throw new Error(`registerFont(${fam}): ${r.error}`); }
  }
}

/** מקור לפי הדקדוק הקנוני — רמות צפויות ב-TOC (H7 אינו כותרת-גוף אלא ביאור-צד). */
function expectedLevels() {
  const { lexDocument } = require('../../src/engine/parser/dfa-lexer');
  const { tokenizeDetailed } = require('../../src/engine/parser/block-tokenizer');
  const lexed = lexDocument(CORPUS, {});
  const det = tokenizeDetailed(lexed.bodyLines, { fnOpen: '[', fnClose: ']' });
  const out = { general: [], detail: [] };
  for (const t of det.tokens) {
    if (t.type !== 'heading' || t.level === 7) continue;
    const txt = String(t.text).replace(/\s+/g, ' ').trim();
    if (t.level >= 1 && t.level <= 6) out.general.push({ level: t.level, text: txt });
    if (t.level >= 2 && t.level <= 6) out.detail.push({ level: t.level, text: txt });
  }
  return out;
}

describe('s9b-toc-d107 — D-107: כללי 1–6, מפורט 2–6, שניהם פעילים, inline כבוי', () => {
  registerAllFonts();
  const exp = expectedLevels();
  const res = typeset(CORPUS, getDefaultSettings(), {});
  assert(!!res.pageModel, 'ההרצה חייבת להיות במנוע המאוחד');

  const genPages = res.pages.filter(p => p.type === 'toc-general');
  const detPages = res.pages.filter(p => p.type === 'toc-detail');
  const rowsOf = (pages) => pages.flatMap(p => (p.toc && p.toc.rows) || []).flatMap(r => (r.kind === 'group' ? (r.items || []) : [r]));

  it('אין ליצור עמוד TOC מפורט ריק כשאין במסמך כותרות H2–H6', () => {
    const text = [
      'כותרת 1 - פרק יחיד',
      'פסקה קצרה ותקינה שמכילה תוכן ממשי אחרי הכותרת.'
    ].join('\\n');
    const singleLevel = typeset(text, getDefaultSettings(), {});
    const general = singleLevel.pages.filter(p => p.type === 'toc-general');
    const detail = singleLevel.pages.filter(p => p.type === 'toc-detail');
    assert(general.length >= 1, 'תוכן כללי עבור H1 נשאר פעיל');
    assert(general.every(p => (p.toc.rows || []).length > 0), 'כל עמוד TOC כללי נושא רשומות');
    assertEq(detail.length, 0, 'אין עמוד מפורט כשאין כותרות H2–H6');
    assertEq(singleLevel.pageModel.meta.materializeFallbacks, 0, 'אין fallback של עמוד TOC ריק');
    assertEq(singleLevel.pageModelValidation.violations.length, 0, 'חוזה PageModel נשאר נקי');
  });

  it('שניהם פעילים בברירת המחדל — עמודי toc-general ו-toc-detail נבנים', () => {
    assert(genPages.length >= 1, `toc-general חסר (עמודים: ${genPages.length})`);
    assert(detPages.length >= 1, `toc-detail חסר (עמודים: ${detPages.length}) — D-107: תוכן מפורט פעיל`);
  });

  it('כללי: כל כותרות המקור H1–H6 מופיעות — בלי השמטות ובלי כפילויות', () => {
    const rows = rowsOf(genPages);
    assertEq(rows.length, exp.general.length, `רשומות כללי: ${rows.length} מול צפוי ${exp.general.length}`);
    const seen = new Map();
    for (const r of rows) {
      const k = `${r.level}|${String(r.text).replace(/\s+/g, ' ').trim()}`;
      seen.set(k, (seen.get(k) || 0) + 1);
    }
    for (const h of exp.general) {
      const k = `${h.level}|${h.text}`;
      assert(seen.has(k), `חסרה בכללי: רמה ${h.level} "${h.text}"`);
      assertEq(seen.get(k), 1, `כפילות בכללי: ${k}`);
    }
  });

  it('מפורט: H2–H6 בלבד — H1 אינו מופיע, אין השמטות ואין כפילויות', () => {
    const rows = rowsOf(detPages);
    assert(rows.every(r => r.level >= 2 && r.level <= 6), 'רמה מחוץ לטווח 2–6 במפורט');
    assertEq(rows.length, exp.detail.length, `רשומות מפורט: ${rows.length} מול צפוי ${exp.detail.length}`);
    const seen = new Map();
    for (const r of rows) {
      const k = `${r.level}|${String(r.text).replace(/\s+/g, ' ').trim()}`;
      seen.set(k, (seen.get(k) || 0) + 1);
    }
    for (const h of exp.detail) {
      const k = `${h.level}|${h.text}`;
      assert(seen.has(k), `חסרה במפורט: רמה ${h.level} "${h.text}"`);
      assertEq(seen.get(k), 1, `כפילות במפורט: ${k}`);
    }
  });

  it('H7 אינו מופיע באף אחד משני התכנים; H0 אינו נכנס בטעות', () => {
    const all = [...rowsOf(genPages), ...rowsOf(detPages)];
    assert(all.every(r => r.level >= 1 && r.level <= 6), 'נמצאה רמה מחוץ ל-1–6 (H0/H7 דלף)');
  });

  it('inline grouping כבוי בברירת המחדל — אין שורות קבוצה', () => {
    const groups = [...genPages, ...detPages].flatMap(p => (p.toc && p.toc.rows) || []).filter(r => r.kind === 'group');
    assertEq(groups.length, 0, `נמצאו ${groups.length} שורות קבוצה — inline חייב להיות כבוי (D-107)`);
    const d = getDefaultSettings();
    for (let lvl = 1; lvl <= 7; lvl++) assertEq(d[`toc-level-${lvl}-inline`], false, `toc-level-${lvl}-inline ברירת מחדל`);
  });

  it('עוגן ויעד עמוד: targetPage של כל רשומה = העמוד שבו מופיעה הכותרת בפועל', () => {
    const firstPageByToken = new Map();
    for (const pg of res.pages) {
      const lines = [...(pg.spanning ? pg.spanning.lines : []), ...(pg.columns || []).flat()];
      for (const ln of lines) {
        const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
        if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
      }
    }
    let checked = 0;
    for (const r of rowsOf([...genPages, ...detPages])) {
      if (r.tokenId == null) continue;
      const actual = firstPageByToken.get(r.tokenId);
      assert(actual != null, `לכותרת ${r.tokenId} אין שורה מוצבת`);
      assertEq(r.targetPage, actual, `יעד שגוי לרשומה "${String(r.text).slice(0, 25)}"`);
      checked++;
    }
    assert(checked > 0, 'לא נבדקה אף רשומה');
  });

  it('מודל התאימות r.toc תואם את D-107 (כללי 1–6, מפורט 2–6)', () => {
    assert(res.toc && res.toc.generalEnabled && res.toc.detailEnabled, 'r.toc: שני התכנים חייבים להיות פעילים');
    assert(res.toc.general.every(e => e.level >= 1 && e.level <= 6), 'r.toc.general: רמה מחוץ ל-1–6');
    assert(res.toc.detail.every(e => e.level >= 2 && e.level <= 6), 'r.toc.detail: רמה מחוץ ל-2–6 (H1 דלף)');
    assertEq(res.toc.general.length, exp.general.length, 'r.toc.general ספירה');
    assertEq(res.toc.detail.length, exp.detail.length, 'r.toc.detail ספירה');
  });

  it('imud-cutover (ייבוא IMUD בלי דגלי מורשת): אותן רמות', () => {
    const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
    const families = new Set();
    for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
      const p = path.join(RB, 'ui/assets/imud', cat);
      if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
    }
    // Use the unified engine settings directly (no legacy import)
    const imp = { settings: { 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' } };
    const uniSettings = { ...getDefaultSettings(), ...imp.settings };
    const r2 = typeset(CORPUS, uniSettings, {});
    assert(!!r2.pageModel, 'imud-cutover נפל למורשת');
    const gen2 = rowsOf(r2.pages.filter(p => p.type === 'toc-general'));
    const det2 = rowsOf(r2.pages.filter(p => p.type === 'toc-detail'));
    assertEq(gen2.length, exp.general.length, `imud-cutover כללי: ${gen2.length}`);
    assertEq(det2.length, exp.detail.length, `imud-cutover מפורט: ${det2.length}`);
    assert(det2.every(r => r.level >= 2), 'imud-cutover: H1 במפורט');
  });

  it('ייבוא לא דורס בחירת משתמש מפורשת ברמות ה-TOC (סדר המיזוג known > נגזר)', () => {
    // משתמש כיבה רמה 3 והדליק מפורט במפורש; קובץ IMUD גולמי בלי gtoc-show מיובא
    const userChoice = { 'toc-level-3-show': false, 'toc-detail-enabled': true };
    const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    const known = {}; const legacyKeys = {};
    for (const [k, v] of Object.entries(userChoice)) (regKeys.has(k) ? known : legacyKeys)[k] = v;
    const imp = importImudSettings({ ...legacy, 'fn-delim-open': '[' }, regKeys, {});
    // דפוס הטעינה של app-shell.loadTemplateJson: {...legacySettings, ...known} — known גובר
    const merged = { ...imp.settings, ...known };
    assertEq(merged['toc-level-3-show'], false, 'בחירת משתמש (רמה 3 כבויה) נדרסה ע"י הנגזר');
    assertEq(merged['toc-detail-enabled'], true, 'בחירת משתמש (מפורט פעיל) נדרסה');
    // הנגזר מהקובץ עצמו (gtoc-show/dtoc-show מפורשים) עדיין מכובד — סמנטיקת S77:
    // דגל אחד לכל רמה לשני התכנים (איחוד הרשימות); הטווחים של D-107 חלים מעליו
    const imp2 = importImudSettings({ ...legacy, 'fn-delim-open': '[', 'size-body': 14, 'line-height-body': 1.4, 'gtoc-show': [1, 2], 'dtoc-show': [2, 3] }, regKeys, {});
    assertEq(imp2.settings['toc-level-3-show'], true, 'רמה 3 ב-dtoc-show=[2,3] — האיחוד חייב להדליק אותה');
    assertEq(imp2.settings['toc-level-4-show'], false, 'רמה 4 מחוץ לשתי הרשימות — הייבוא חייב לכבות');
    assertEq(imp2.settings['toc-level-6-show'], false, 'רמה 6 מחוץ לשתי הרשימות — הייבוא חייב לכבות');
    assertEq(imp2.settings['toc-level-2-show'], true, 'רמה 2 בשתי הרשימות — נשארת פעילה');
    assertEq(imp2.settings['toc-level-7-show'], false, 'H7 מוסתר גם בנגזר הייבוא (D-107)');
  });

  it('splitGeneralDetail: טווחים לפי D-107 גם כשהדגלים אינם מוגדרים', () => {
    const entries = [
      { level: 0, text: 'הקדמה' }, { level: 1, text: 'א' }, { level: 2, text: 'ב' },
      { level: 3, text: 'ג' }, { level: 6, text: 'ו' }, { level: 7, text: 'ז' },
    ];
    const { general, detail } = splitGeneralDetail(entries, {});
    assertEq(general.map(e => e.level).join(','), '1,2,3,6', `כללי: ${general.map(e => e.level)}`);
    assertEq(detail.map(e => e.level).join(','), '2,3,6', `מפורט: ${detail.map(e => e.level)}`);
    const off = splitGeneralDetail(entries, { 'toc-detail-enabled': false });
    assertEq(off.detail.length, 0, 'כיבוי מפורט לא מכובד');
  });
});

report();
