// tests/e2e/s67-fn-reset-page.test.js — S67: R2-M4 — מימוש footnote-reset-policy='page'
// הבעיה שנסגרה: הסמנים הוקצו בזמן הפענוח (בטרם נודעו העמודים) ולכן המונה
// במדיניות 'page' קיבל תמיד מפתח-היקף '?' — והתנהג כ-continuous (no-op).
// הפתרון: מעבר renumberPageScopedMarkers אחרי planPages — מחדש-מספור לפי
// עמוד ההופעה הראשון; שברי המשך והצגות חוזרות יורשים את סמן המופע הראשון.
'use strict';

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { renumberPageScopedMarkers, MARK_TAG } = require('../../src/engine/notes/markers');

const CORPUS_PATH = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
const CORPUS = fs.readFileSync(CORPUS_PATH, 'utf8');

const stripTag = (w) => String(w).replace(/[\uE000\uE101\uE102]/g, '').replace(/\u00A0/g, ' ').trim();

// =====================================================================
describe('S67-1 — renumberPageScopedMarkers (יחידה: מבחנות סינתטיות)', () => {
  const mkPage = (over) => Object.assign({ index: 0, type: 'regular', columns: [], footnotes: [] }, over);

  it('שני עמודים ⇒ כל עמוד מתחיל מחדש (א׳, ב׳ | א׳, ב׳, ג׳)', () => {
    const pages = [
      mkPage({ index: 0, footnotes: [
        { marker: 'א׳', tokenId: 't1' }, { marker: 'ב׳', tokenId: 't2' },
      ]}),
      mkPage({ index: 1, footnotes: [
        { marker: 'ג׳', tokenId: 't3' }, { marker: 'ד׳', tokenId: 't4' }, { marker: 'ה׳', tokenId: 't5' },
      ]}),
    ];
    const markersByToken = new Map([
      ['t1', [{ noteIndex: 0, marker: 'א׳' }]], ['t2', [{ noteIndex: 0, marker: 'ב׳' }]],
      ['t3', [{ noteIndex: 0, marker: 'ג׳' }]], ['t4', [{ noteIndex: 0, marker: 'ד׳' }]],
      ['t5', [{ noteIndex: 0, marker: 'ה׳' }]],
    ]);
    const r = renumberPageScopedMarkers(pages, { markerStyle: 'hebrew-geresh', markersByToken });
    assertEq(r.renumbered, 3, 'three markers change (ג׳→א׳, ד׳→ב׳, ה׳→ג׳)');
    assertEq(pages[1].footnotes.map((n) => n.marker).join(','), 'א׳,ב׳,ג׳', 'page 2 restarts');
  });

  it('שבר המשך (isContinuation בעמוד הבא) יורש את סמן הפרגמנט הראשון — בלי סמן כפול', () => {
    const pages = [
      mkPage({ index: 0, footnotes: [
        { marker: 'א׳', tokenId: 't1' },
        { marker: 'ב׳', tokenId: 't2', mode: 'split-first' },
      ]}),
      mkPage({ index: 1, footnotes: [
        { marker: 'ב׳', tokenId: 't2', mode: 'split-rest', isContinuation: true },
        { marker: 'ג׳', tokenId: 't3' },
      ]}),
    ];
    const markersByToken = new Map([
      ['t1', [{ marker: 'א׳' }]], ['t2', [{ marker: 'ב׳' }]], ['t3', [{ marker: 'ג׳' }]],
    ]);
    renumberPageScopedMarkers(pages, { markerStyle: 'hebrew-geresh', markersByToken });
    assertEq(pages[1].footnotes[0].marker, 'ב׳', 'continuation keeps the split-first marker');
    assertEq(pages[1].footnotes[1].marker, 'א׳', 'the new note on page 2 starts fresh');
  });

  it('הצגה חוזרת של הערה בעמוד מאוחר שומרת את סמן ההופעה הראשונה', () => {
    const pages = [
      mkPage({ index: 0, footnotes: [{ marker: 'א׳', tokenId: 't1' }, { marker: 'ב׳', tokenId: 't2' }] }),
      mkPage({ index: 1, footnotes: [{ marker: 'ב׳', tokenId: 't2' }] }), // re-display of t2
    ];
    const markersByToken = new Map([['t1', [{ marker: 'א׳' }]], ['t2', [{ marker: 'ב׳' }]]]);
    renumberPageScopedMarkers(pages, { markerStyle: 'hebrew-geresh', markersByToken });
    assertEq(pages[1].footnotes[0].marker, 'ב׳', 're-display keeps original marker (not renumbered to א׳)');
  });

  it('החלפת הסמן בגוף: \uE102סמן בסוף מילה / לפני NBSP / הערה דחויה (סמן\uE000טקסט)', () => {
    const lineEnd = { words: ['עוגן\u00A0' + MARK_TAG + 'ה\u05F3'] };        // סמן t5 בסוף
    const lineStart = { words: [MARK_TAG + 'ו\u05F3\u00A0מילה'] };           // סמן t6 בראש + NBSP
    const lineRejected = { words: ['ז\u05F3\uE000טקסט הערה שנדחתה לגוף'] };   // תבנית דחייה (t7)
    const lineInnocent = { words: ['שלום עליכם ה\u05F3 בתוך מילה רגילה'] };   // לא סמן — לא נוגע
    const pages = [mkPage({
      index: 0,
      columns: [[lineEnd, lineStart, lineRejected, lineInnocent]],
      footnotes: [
        { marker: 'ה\u05F3', tokenId: 't5' }, { marker: 'ו\u05F3', tokenId: 't6' },
        { marker: 'ז\u05F3', tokenId: 't7' }, { marker: 'ח\u05F3', tokenId: 't8' },
        { marker: 'ט\u05F3', tokenId: 't9' },
      ],
    })];
    const markersByToken = new Map([
      ['t5', [{ marker: 'ה\u05F3' }]], ['t6', [{ marker: 'ו\u05F3' }]], ['t7', [{ marker: 'ז\u05F3' }]],
      ['t8', [{ marker: 'ח\u05F3' }]], ['t9', [{ marker: 'ט\u05F3' }]],
    ]);
    renumberPageScopedMarkers(pages, { markerStyle: 'hebrew-geresh', markersByToken });
    assertEq(pages[0].columns[0][0].words[0], 'עוגן\u00A0' + MARK_TAG + 'א׳', 'end-of-word marker replaced (t5→א׳)');
    assertEq(pages[0].columns[0][1].words[0], MARK_TAG + 'ב׳\u00A0מילה', 'start-of-word marker replaced (t6→ב׳)');
    assertEq(pages[0].columns[0][2].words[0].slice(0, 3), 'ג׳\uE000', 'rejected-note word replaced (t7→ג׳)');
    assertEq(pages[0].columns[0][3].words[0], 'שלום עליכם ה\u05F3 בתוך מילה רגילה', 'innocent text untouched');
  });

  it('התנגשות עם סמן סגנון-מותאם ⇒ דילוג מבוקר (לא דורסים סמן זר)', () => {
    const pages = [mkPage({ index: 0, footnotes: [{ marker: 'ב׳', tokenId: 't2' }] })];
    const markersByToken = new Map([['t2', [{ marker: 'ב׳' }]]]);
    const r = renumberPageScopedMarkers(pages, {
      markerStyle: 'hebrew-geresh', markersByToken,
      customMarks: new Set(['ב׳']), // סמן מותאם שמתנגש לסמן הישן שהיה אמור להיות מוחלף
    });
    assertEq(r.skipped, 'custom-marker-collision', 'skip reason reported');
    assertEq(pages[0].footnotes[0].marker, 'ב׳', 'marker untouched on skip');
  });

  it('סמנים שאינם משתנים (עמוד אחד) ⇒ no-op מלא', () => {
    const pages = [mkPage({ index: 0, footnotes: [{ marker: 'א׳', tokenId: 't1' }, { marker: 'ב׳', tokenId: 't2' }] })];
    const markersByToken = new Map([['t1', [{ marker: 'א׳' }]], ['t2', [{ marker: 'ב׳' }]]]);
    const r = renumberPageScopedMarkers(pages, { markerStyle: 'hebrew-geresh', markersByToken });
    assertEq(r.renumbered, 0, 'nothing to renumber on a single page');
  });
});

// =====================================================================
describe('S67-2 — אינטגרציה: הקורפוס הקנוני במדיניות page', () => {
  it('כל עמוד עם הערות מתחיל את הסדרה מחדש — והסמנים בגוף תואמים למרזב', () => {
    const s = { ...getDefaultSettings(), 'footnote-reset-policy': 'page' };
    const r = typeset(CORPUS, s);
    assert(r.contentPreserved === true, 'content preserved under page policy');
    let pagesWithNotes = 0;
    for (const pg of r.pages) {
      const fns = pg.footnotes || [];
      if (!fns.length) continue;
      pagesWithNotes++;
      // הסדרה בעמוד מתחילה מ-1: הסמן הראשון הוא תמיד א׳ (סגנון ברירת המחדל)
      const first = fns[0].marker;
      assertEq(first, 'א׳', `page ${pg.index}: first marker restarts (got ${first})`);
      // סמני הגוף בעמוד ⊇ סמני המרזב (כל סמן מרזב מופיע בגוף העמוד)
      const bodyMarks = new Set();
      for (const col of (pg.columns || [])) for (const ln of col) for (const w of (ln.words || [])) {
        const bare = stripTag(w);
        for (const f of bare.split(' ')) {
          if (/^[\u05D0-\u05EA]{1,2}\u05F3$|^[\u05D0-\u05EA]\u05F4[\u05D0-\u05EA]+$/.test(f)) bodyMarks.add(f);
        }
      }
      for (const n of fns) {
        assert(bodyMarks.has(n.marker), `page ${pg.index}: gutter marker ${n.marker} present in body`);
      }
    }
    assert(pagesWithNotes >= 1, 'the corpus exercises the page policy (has footnote pages)');
  });

  it('איפוס פר-עמוד בפועל: שני עמודים עם הערות ⇒ שניהם מתחילים בא׳ (בעבר המשכי)', () => {
    const s = { ...getDefaultSettings(), 'footnote-reset-policy': 'page' };
    const r = typeset(CORPUS, s);
    const firsts = r.pages.filter((pg) => (pg.footnotes || []).length).map((pg) => pg.footnotes[0].marker);
    assert(firsts.length >= 2, `corpus has ≥2 footnote pages (got ${firsts.length})`);
    for (const f of firsts) assertEq(f, 'א׳', 'every footnote page restarts at א׳');
  });

  it('דטרמיניזם: שתי הרצות במדיניות page ⇒ hash זהה', () => {
    const s = { ...getDefaultSettings(), 'footnote-reset-policy': 'page' };
    const a = typeset(CORPUS, s);
    const b = typeset(CORPUS, s);
    assertEq(a.layoutHash, b.layoutHash, 'page-policy run is deterministic');
  });

  it('נייטרליות ברירת המחדל: מדיניות section (ברירת מחדל) ⇒ הקנוני 80f9ed6c זהה לנעילה', () => {
    const r = typeset(CORPUS, getDefaultSettings());
    assert(r.layoutHash.startsWith('80f9ed6c'), `canonical hash unchanged, got ${r.layoutHash.slice(0, 16)}`);
  });

  it('ביקורת שלילה — המדיניות באמת משנה: מסמך חלק-אחד רב-עמודים — page מאפס, section ממשיך', () => {
    // מסמך סינתטי בחלק אחד: הערה מוקדמת בעמוד הראשון והערות נוספות בעמוד מאוחר
    // (במדיניות section — הסדרה נמשכת; ב-page — מתחילה מחדש בכל עמוד)
    const paras = [];
    paras.push('כותרת 2 - פרק פתיחה');
    paras.push('פסקת הפתיחה עם הערה ראשונה [הערה ראשונה של העמוד הראשון] בגוף הטקסט.');
    for (let i = 0; i < 120; i++) {
      paras.push('מילוי ' + i + ' — שורת גוף ארוכה למילוי עמודים בטורים ולבחינת הסמנים לאורך המסמך כולו בכל העמודים.');
      if (i === 60) paras.push('פסקה עם הערה מאוחרת [הערה בעמוד מאוחר] ועוד הערה [הערה נוספת באותו עמוד].');
    }
    const doc = 'ספר - מסמך בדיקת איפוס\nנושא - בדיקה\n\n' + paras.join('\n') + '\n';
    const rSec = typeset(doc, getDefaultSettings());
    const rPage = typeset(doc, { ...getDefaultSettings(), 'footnote-reset-policy': 'page' });
    const secByPage = rSec.pages.filter((pg) => (pg.footnotes || []).length).map((pg) => pg.footnotes.map((n) => n.marker).join(','));
    const pageByPage = rPage.pages.filter((pg) => (pg.footnotes || []).length).map((pg) => pg.footnotes.map((n) => n.marker).join(','));
    assert(secByPage.length >= 2, `doc spans ≥2 footnote pages (got ${secByPage.length})`);
    // בעמוד המאוחר: section ממשיך את הסדרה; page מתחיל מ-1 מחדש
    const lastSec = secByPage[secByPage.length - 1].split(',')[0];
    const lastPage = pageByPage[pageByPage.length - 1].split(',')[0];
    assert(lastSec !== 'א׳', `section continues (got ${lastSec})`);
    assertEq(lastPage, 'א׳', 'page restarts at א׳');
    assert(rPage.contentPreserved === true && rSec.contentPreserved === true, 'content preserved in both policies');
  });
});

report('s67-fn-reset-page');
