// tests/e2e/s64-ornament-index.test.js — P-1 (S1-ו): אינדקס קל לאוספי העיצובים
'use strict';

/**
 * **P-1 (audits/PERFORMANCE_BASELINE.md, מצב S1-ו):** שלושת אוספי העיטורים
 * (SVG-ב-JSON, ‏6.9MB — ‏92% מהעברת העלייה) נמשכו בעלייה רק כדי לאכלס
 * דרופדאונים שצריכים {id,name,box} בלבד. תוקן: ‏`listDesigns` מושך
 * `<קובץ>.index.json` (‏~68K סה״כ); הקובץ המלא נמשך על-ידי `ensureDesign`
 * בלבד כשנבחר עיצוב בפועל (או ערכת שערים באתחול).
 *
 * חוזה הבדיקה כאן:
 *  1. עלייה: ‏listDesigns לכל אוספי הבוררים — אף קובץ עיצוב מלא לא נמשך;
 *     רק האינדקסים.
 *  2. שקילות רשימות: הפריטים מהאינדקס זהים בתוכנם ({id,name,box}) לנגזרים
 *     מהקובץ המלא.
 *  3. בחירה: ‏ensureDesign אחרי מצב אינדקס — מושך את הקובץ המלא פעם אחת,
 *     רושם בשני הצדדים (UI+Worker) עם ה-SVG האמיתי, ומחזיר הפניה מלאה.
 *  4. single-flight: שתי בחירות מקבילות באותו אוסף — משיכה אחת של הקובץ
 *     המלא.
 *  5. מטמון רישום: ‏ensureDesign חוזר לאותו פריט — בלי משיכה נוספת.
 *  6. נפילה לאחור: אין אינדקס (404) ⇒ הקובץ המלא כמקודם (items+raw).
 *  7. איכות הנכסים: האינדקסים בדיסק אכן תואמים את הקבצים המלאים שבריפו
 *     (מנע סחרור בין שני הקבצים).
 * הערה: השינוי UI-בלבד (src/ui/imud-library.js) — המנוע, ה-Worker והפרוטוקול
 * לא נגעו; נייטרליות הפריסה מוכחת בנפרד (קנוני 80f9ed6c… + ‏very_long
 * בשני הנתיבים — ראש מסמך ה-WORKLOG של מחזור זה).
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { createImudLibrary, DESIGN_FILES } = require('../../src/ui/imud-library');

const REPO = path.join(__dirname, '..', '..');
const IMUD = path.join(REPO, 'ui', 'assets', 'imud');

/** fetch מקומי מהדיסק (כמו s62) עם מונה ותיעוד כתובות. */
function localFetch(log) {
  return async (url) => {
    const rel = String(url).replace(/(?:.*[\\/])?assets[\\/]imud[\\/]/, '');
    log.push(rel);
    const fp = path.join(IMUD, rel);
    if (!fs.existsSync(fp)) return { ok: false, status: 404, json: async () => { throw new Error('404 ' + rel); } };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(fp, 'utf8')) };
  };
}

function makeLib(log) {
  global.fetch = localFetch(log);
  return createImudLibrary({
    registerAssets: () => ({ ok: true, registered: 1, rejected: [] }),
    registerFont: () => Promise.resolve(),
    requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
  });
}

const PICKS_COLLECTIONS = ['shaar-main', 'shaar-sub', 'shaar-back', 'orn-ud', 'orn-lr', 'divider'];

describe('P-1 — אינדקס עיצובים: עלייה קלה, SVG לפי דרישה', () => {
  it('עלייה: listDesigns לכל אוספי הבוררים — אף קובץ מלא לא נמשך', async () => {
    const log = [];
    const lib = makeLib(log);
    let total = 0;
    for (const c of PICKS_COLLECTIONS) {
      const items = await lib.listDesigns(c);
      assert(items.length > 0, `${c}: רשימת פריטים לא ריקה`);
      total += items.length;
    }
    assert(total > 900, `סה״כ פריטים בכל האוספים (קיבלנו ${total})`);
    const fullFiles = log.filter(p => !p.endsWith('.index.json'));
    assertEq(fullFiles, [], 'נמשכו אך ורק קובצי אינדקס');
    const bytes = log.reduce((s, p) => s + fs.statSync(path.join(IMUD, p)).size, 0);
    assert(bytes < 120 * 1024, `העברת האינדקסים קטנה (קיבלנו ${(bytes / 1024).toFixed(1)}K < 120K)`);
    console.log(`  [p1-startup] indexes=${log.length} bytes=${(bytes / 1024).toFixed(1)}K items=${total}`);
  });

  it('שקילות: הפריטים מהאינדקס זהים לנגזרים מהקובץ המלא', async () => {
    const log = [];
    const lib = makeLib(log);
    for (const c of PICKS_COLLECTIONS) {
      const fromIndex = await lib.listDesigns(c);
      const raw = JSON.parse(fs.readFileSync(path.join(IMUD, DESIGN_FILES[c]), 'utf8'));
      const fromFull = raw.map(d => ({ id: d.id, name: d.name || d.id, box: d.box || null }));
      assertEq(fromIndex, fromFull, `${c}: רשימת האינדקס שקולה לרשימת הקובץ המלא`);
    }
  });

  it('בחירה: ensureDesign מושך את הקובץ המלא פעם אחת ורושם את ה-SVG האמיתי', async () => {
    const log = [];
    const registered = [];
    const origFetch = global.fetch;
    global.fetch = localFetch(log);
    // **worker-side: registerAssets מקבל הודעה אחת ({collection, items}) — לא שני ארגומנטים**
    const lib = createImudLibrary({
      registerAssets: (a, b) => {
        const col = typeof a === 'string' ? a : a.collection;
        const its = typeof a === 'string' ? b : a.items;
        registered.push({ collection: col, items: its });
        return Promise.resolve({ ok: true, registered: (its || []).length, rejected: [] });
      },
      registerFont: () => Promise.resolve(),
      requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
    });
    try {
      const items = await lib.listDesigns('orn-ud');
      assert(log.every(p => p.endsWith('.index.json')), 'לפני הבחירה — אינדקס בלבד');
      const ref = await lib.ensureDesign('orn-ud', items[0].id);
      assertEq(ref, `imud:orn-ud:${items[0].id}`, 'הפניה מלאה');
      const pulls = log.filter(p => p === DESIGN_FILES['orn-ud']);
      assertEq(pulls.length, 1, 'הקובץ המלא נמשך בדיוק פעם אחת');
      // צד ה-UI: הרישום האמיתי ב-asset-registry המשותף — ה-SVG שנרשם שקול
      // לקובץ המלא אחרי החיטוי המחייב (sanitizeSvg) של הרישום
      const { resolveAssetRef } = require('../../src/engine/decoration/asset-registry');
      const { sanitizeSvg } = require('../../src/engine/decoration/svg-sanitize');
      const resolved = resolveAssetRef(ref);
      const rawFile = JSON.parse(fs.readFileSync(path.join(IMUD, DESIGN_FILES['orn-ud']), 'utf8'));
      const rawItem = rawFile.find(d => d.id === items[0].id);
      assert(resolved.resolved && resolved.item, 'ההפניה נפתרת ברישום ה-UI');
      const expectedClean = sanitizeSvg(String(rawItem.svg || '')).svg;
      assertEq(resolved.item.svg, expectedClean, 'ה-SVG שנרשם שקול לקובץ המלא (לאחר חיטוי)');
      assert(resolved.uri && resolved.uri.startsWith('data:image/svg+xml'), 'data-URI מוכן לתצוגה');
      assertEq(registered.length, 1, 'נרשם פעם אחת ב-Worker');
      assertEq(registered[0].collection, 'orn-ud', 'האוסף הנכון נרשם ב-Worker');
      assertEq(registered[0].items[0].id, items[0].id, 'אותו פריט שנבחר');
      assert(typeof registered[0].items[0].svg === 'string' && /svg/i.test(registered[0].items[0].svg), 'ה-SVG האמיתי הועבר ל-Worker');
    } finally { global.fetch = origFetch; }
  });

  it('single-flight: שתי בחירות מקבילות באותו אוסף — משיכה אחת של הקובץ המלא', async () => {
    const log = [];
    const origFetch = global.fetch;
    global.fetch = localFetch(log);
    const lib = createImudLibrary({
      registerAssets: () => ({ ok: true, registered: 1, rejected: [] }),
      registerFont: () => Promise.resolve(),
      requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
    });
    try {
      const items = await lib.listDesigns('divider');
      const [a, b] = await Promise.all([
        lib.ensureDesign('divider', items[0].id),
        lib.ensureDesign('divider', items[1].id)
      ]);
      assert(a && b, 'שתי ההפניות חזרו');
      const pulls = log.filter(p => p === DESIGN_FILES['divider']);
      assertEq(pulls.length, 1, 'הקובץ המלא נמשך פעם אחת בלבד (single-flight)');
    } finally { global.fetch = origFetch; }
  });

  it('מטמון: ensureDesign חוזר לאותו פריט — בלי משיכה נוספת', async () => {
    const log = [];
    const lib = makeLib(log);
    const items = await lib.listDesigns('orn-lr');
    const first = await lib.ensureDesign('orn-lr', items[5].id);
    const afterFirst = log.length;
    const second = await lib.ensureDesign('orn-lr', items[5].id);
    assertEq(log.length, afterFirst, 'אף fetch נוסף ברישום החוזר');
    assertEq(second, first, 'אותה הפניה');
    // פריט אחר באותו אוסף — הקובץ כבר בזיכרון; רק רישום נוסף, בלי fetch
    const third = await lib.ensureDesign('orn-lr', items[6].id);
    assert(third, 'פריט נוסף מאותו אוסף נרשם');
    assertEq(log.length, afterFirst, 'גם לפריט השכן אין fetch חדש (האוסף כבר נטען)');
  });

  it('נפילה לאחור: אין אינדקס (404) ⇒ הקובץ המלא כמקודם', async () => {
    const origFetch = global.fetch;
    global.fetch = async (url) => {
      const rel = String(url).replace(/(?:.*[\\/])?assets[\\/]imud[\\/]/, '');
      if (rel.endsWith('.index.json')) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
      const fp = path.join(IMUD, rel);
      if (!fs.existsSync(fp)) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
      return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(fp, 'utf8')) };
    };
    try {
      const lib = createImudLibrary({
        registerAssets: () => ({ ok: true, registered: 1, rejected: [] }),
        registerFont: () => Promise.resolve(),
        requestExport: () => Promise.resolve({ bytes: new Uint8Array(1) })
      });
      const items = await lib.listDesigns('orn-ud');
      assert(items.length === 302, `הרשימה המלאה חזרה מהקובץ המלא (${items.length})`);
      const ref = await lib.ensureDesign('orn-ud', items[0].id); // raw כבר נטען בנפילה לאחור
      assertEq(ref, `imud:orn-ud:${items[0].id}`, 'ההפניה תקינה גם בנתיב ההיסטורי');
    } finally { global.fetch = origFetch; }
  });

  it('איכות נכסים: כל אינדקס בדיסק תואם את הקובץ המלא שלצידו', () => {
    for (const [coll, file] of Object.entries(DESIGN_FILES)) {
      const idxPath = path.join(IMUD, file.replace(/\.json$/, '.index.json'));
      assert(fs.existsSync(idxPath), `${coll}: קובץ אינדקס קיים בריפו`);
      const raw = JSON.parse(fs.readFileSync(path.join(IMUD, file), 'utf8'));
      const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
      const expect = raw.map(d => ({ id: d.id, name: d.name || d.id, box: d.box || null }));
      assertEq(idx, expect, `${coll}: האינדקס מסונכרן עם הקובץ המלא`);
    }
  });
});

report('s64-ornament-index');
