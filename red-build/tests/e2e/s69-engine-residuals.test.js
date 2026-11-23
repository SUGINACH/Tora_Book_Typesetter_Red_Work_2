// tests/e2e/s69-engine-residuals.test.js — S69: שאריות מנוע מ-S6.0 שנסגרו
// R2-M7 — סמנים כפולים ב-endnotes מעורבים (ממוספרים מפורש + אוטומטיים):
// בעבר המונה האוטומטי לא ידע על המספרים המפורשים שבאותו חלק והנפיק סמנים
// כפולים (למשל num=1 מפורש + אוטומטי ראשון ⇒ שניהם 'א׳'). תיקון: סריקה
// מקדימה רושמת את כל המספרים המפורשים כתפוסים; מספר כפול (טעות מקור)
// מדווח ל-ledger ואינו נדרס.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const { typeset } = require('../../src/engine/core/pipeline');
global.typeset = typeset;
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');

const EN_SETTINGS = (over) => ({
  ...getDefaultSettings(),
  'note-placement-mode': 'endnotes',
  'footnote-reset-policy': 'section',
  ...over,
});

// איסוף הסמנים מעמודי ההערות
function endnoteMarkers(r) {
  const out = [];
  for (const pg of r.pages) {
    if (pg.type !== 'endnotes') continue;
    for (const n of (pg.notes || [])) out.push(n.marker);
  }
  return out;
}

// =====================================================================
describe('S69 (R2-M7) — endnotes מעורבים: אין סמנים כפולים', () => {
  const MIXED_DOC = `ספר - מסמך הערות מעורב
נושא - בדיקה

כותרת 1 - חלק ראשון
כותרת 2 - פתיחה
פסקת גוף ראשונה עם תוכן כלשהו למילוי העמוד.
הערות סיום - הערות החלק
הערת סיום-1 - הערה ממוספרת ראשונה מפורשת.
הערת סיום - הערה אוטומטית ראשונה (בלי מספר במקור).
הערת סיום-2 - הערה ממוספרת שנייה מפורשת.
הערת סיום - הערה אוטומטית שנייה.
`;

  it('מסמך מעורב (מפורש-אוטומטי-מפורש-אוטומטי) ⇒ ארבעה סמנים ייחודיים', () => {
    const r = typeset(MIXED_DOC, EN_SETTINGS());
    assert(r.contentPreserved === true, 'content preserved');
    const marks = endnoteMarkers(r);
    assertEq(marks.length, 4, `four endnotes (got ${marks.length}: ${marks.join(',')})`);
    const uniq = new Set(marks);
    assertEq(uniq.size, marks.length, `no duplicate markers (got ${marks.join(',')})`);
    // המפורשים שומרים על מספרם: 1 ⇒ א׳, 2 ⇒ ב׳; האוטומטיים מדלגים אליהם
    assertEq(marks[0], 'א׳', 'explicit 1 keeps its number');
    assertEq(marks[2], 'ב׳', 'explicit 2 keeps its number');
    assert(marks[1] !== 'א׳' && marks[1] !== 'ב׳', `auto 1 skips the explicit numbers (got ${marks[1]})`);
    assert(marks[3] !== 'א׳' && marks[3] !== 'ב׳' && marks[3] !== marks[1], `auto 2 unique (got ${marks[3]})`);
  });

  it('מדיניות continuous עם מסמך מעורב ⇒ גם שם אין כפילויות', () => {
    const r = typeset(MIXED_DOC, EN_SETTINGS({ 'footnote-reset-policy': 'continuous' }));
    assert(r.contentPreserved === true, 'content preserved');
    const marks = endnoteMarkers(r);
    assertEq(new Set(marks).size, marks.length, `continuous: unique markers (got ${marks.join(',')})`);
  });

  it('מספר מפורש כפול (טעות מקור) ⇒ דיווח ledger; הסמנים אינם מומצאים מחדש', () => {
    const DUP_DOC = `ספר - מסמך כפילויות
נושא - בדיקה

כותרת 1 - חלק
כותרת 2 - פתיחה
פסקה.
הערות סיום - הערות
הערת סיום-1 - הראשונה.
הערת סיום-1 - הכפיל של אותו מספר (טעות מקור).
`;
    const r = typeset(DUP_DOC, EN_SETTINGS());
    assert(r.contentPreserved === true, 'content preserved');
    const marks = endnoteMarkers(r);
    assertEq(marks.length, 2, 'both notes present');
    assertEq(marks[0], marks[1], 'explicit duplicate keeps the source number (not silently re-invented)');
    assertEq(marks[0], 'א׳', 'num 1 → א׳');
    // דיווח ל-ledger — ה-issues הוא Map (לא מסודר ב-JSON); בודקים את הרשומות עצמן
    const issues = r.ledger && r.ledger.issues;
    const values = issues && typeof issues.values === 'function' ? [...issues.values()] : [];
    const dup = values.find((v) => v.kind === 'endnote-duplicate-marker');
    assert(dup, 'duplicate reported (endnote-duplicate-marker in ledger)');
    assertEq(dup && dup.predicate_before && dup.predicate_before.num, 1, 'evidence carries the duplicated num');
  });

  it('רגרסיה: כולם-ממוספרים או כולם-אוטומטיים ⇒ התנהגות המקור נשמרת', () => {
    const ALL_NUM = `ספר - כולם ממוספרים
נושא - בדיקה

כותרת 1 - חלק
כותרת 2 - פתיחה
פסקה.
הערות סיום - הערות
הערת סיום-1 - ראשונה.
הערת סיום-2 - שנייה.
`;
    const r1 = typeset(ALL_NUM, EN_SETTINGS());
    assertEq(endnoteMarkers(r1).join(','), 'א׳,ב׳', 'all-numbered unchanged');

    const ALL_AUTO = `ספר - כולם אוטומטיים
נושא - בדיקה

כותרת 1 - חלק
כותרת 2 - פתיחה
פסקה.
הערות סיום - הערות
הערת סיום - ראשונה.
הערת סיום - שנייה.
`;
    const r2 = typeset(ALL_AUTO, EN_SETTINGS());
    assertEq(endnoteMarkers(r2).join(','), 'א׳,ב׳', 'all-auto unchanged');
  });
});

// =====================================================================
describe('S70 (R8-M2) — רישום גופנים מחדש אחרי respawn של ה-Worker', () => {
  const { WorkerEngineClient } = require('../../src/ui/worker-client');

  /** תעבורה עם דור (דגם workerTransport): terminate מסמן מוות; post/ensureAlive בונים מחדש. */
  function makeGenTransport() {
    let handler = null;
    let terminated = false;
    let generation = 0;
    const posted = [];
    return {
      posted,
      post: (m) => { if (terminated || !generation) { generation++; terminated = false; } posted.push(m); },
      setHandler: (cb) => { handler = cb; },
      reply: (m) => { if (handler) handler(m); },
      getGeneration: () => generation,
      ensureAlive: () => { if (terminated || !generation) { generation++; terminated = false; } return generation; },
      terminate: () => { terminated = true; },
    };
  }

  it('רישום מוצלח נשמר; אחרי respawn הרישום מנוגן מחדש לפני בקשת העימוד', async () => {
    const t = makeGenTransport();
    const client = new WorkerEngineClient(t);
    // רישום גופן — התעבורה משיבה ok
    const reg = client.registerFont({ name: 'גופן-בדיקה', bytes: new Uint8Array([1, 2, 3]) });
    t.reply({ type: 'register-font-result', jobId: t.posted[t.posted.length - 1].jobId, ok: true });
    await reg;
    assertEq(client._registeredFonts.size, 1, 'font stored after successful registration');
    // respawn (terminate) — המופע הבא מתחיל עם זיכרון ריק
    t.terminate();
    const before = t.posted.length;
    const jA = client.requestTypeset({ text: 'טקסט', settings: {} });
    jA.promise.catch(() => {});
    // ההודעות אחרי ה-respawn: קודם רישום-חוזר של הגופן, ואז העימוד
    const afterRespawn = t.posted.slice(before);
    assertEq(afterRespawn.length, 2, `replay + typeset (got ${afterRespawn.map((m) => m.type).join(',')})`);
    assertEq(afterRespawn[0].type, 'register-font', 'font replay posted first');
    assertEq(afterRespawn[0].name, 'גופן-בדיקה', 'replayed font name');
    assertEq(afterRespawn[1].type, 'typeset-request', 'typeset posted after the replay');
  });

  it('בלי respawn — אין רישום חוזר (הבקשה נשלחת כרגיל)', () => {
    const t = makeGenTransport();
    const client = new WorkerEngineClient(t);
    const j1 = client.requestTypeset({ text: 'א', settings: {} }); // מקים דור 1
    j1.promise.catch(() => {}); // ההבטחה מéוחררת בסוף הבדיקה — מניעת unhandled-rejection
    t.reply({ type: 'typeset-result', jobId: j1.jobId, result: { pages: [] } });
    const n = t.posted.length;
    const j2 = client.requestTypeset({ text: 'ב', settings: {} }); // אותו דור — אין replay
    j2.promise.catch(() => {});
    assertEq(t.posted.length, n + 1, 'only the typeset message posted');
    assertEq(t.posted[t.posted.length - 1].type, 'typeset-request');
  });

  it('רישום שנכשל אינו נשמר לניגון חוזר', async () => {
    const t = makeGenTransport();
    const client = new WorkerEngineClient(t);
    const reg = client.registerFont({ name: 'רע', bytes: new Uint8Array([9]) });
    t.reply({ type: 'register-font-result', jobId: t.posted[t.posted.length - 1].jobId, ok: false, error: 'bad font' });
    let failed = false;
    try { await reg; } catch (e) { failed = true; }
    assert(failed, 'registration rejected');
    assertEq(client._registeredFonts.size, 0, 'failed registration not stored');
    t.terminate();
    const before = t.posted.length;
    const jB = client.requestTypeset({ text: 'טקסט', settings: {} });
    jB.promise.catch(() => {});
    const afterRespawn = t.posted.slice(before);
    assertEq(afterRespawn.length, 1, 'no replay for failed registration');
    assertEq(afterRespawn[0].type, 'typeset-request');
  });

  it('אוספי נכסים מנוגנים חזרה גם הם אחרי respawn', async () => {
    const t = makeGenTransport();
    const client = new WorkerEngineClient(t);
    const reg = client.registerAssets({ collection: 'imud:ornaments', items: [{ id: 'x' }] });
    t.reply({ type: 'register-assets-result', jobId: t.posted[t.posted.length - 1].jobId, ok: true });
    await reg;
    t.terminate();
    const before = t.posted.length;
    const jC = client.requestExport({ kind: 'pdf', text: 'טקסט', settings: {} });
    jC.catch(() => {});
    const afterRespawn = t.posted.slice(before);
    assertEq(afterRespawn[0].type, 'register-assets', 'assets replay posted first');
    assertEq(afterRespawn[0].collection, 'imud:ornaments');
    assertEq(afterRespawn[1].type, 'export-request', 'export posted after the replay');
  });

  it('תעבורה בלי דור (inline) — המנגנון דומם ושום דבר לא נשבר', () => {
    const t = { posted: [], post: (m) => { t.posted.push(m); }, setHandler: () => {} };
    const client = new WorkerEngineClient(t);
    const jD = client.requestTypeset({ text: 'טקסט', settings: {} });
    jD.promise.catch(() => {});
    assertEq(t.posted.length, 1, 'plain transport: single message, no replay logic');
  });
});

// =====================================================================
describe('S70 (R6) — SVG: polygon/polyline/matrix בעיטורים', () => {
  const { parseSvgPaint, svgToPdfOps, svgInkBBox } = require('../../src/engine/decoration/ornament-ink');

  it('<polygon> הופך לנתיב סגור ממולא', () => {
    const paint = parseSvgPaint('<svg viewBox="0 0 100 40"><polygon points="10,5 90,5 50,35" fill="#000"/></svg>');
    assert(paint, 'paint parsed');
    assertEq(paint.shapes.length, 1, 'one shape');
    const sub = paint.shapes[0].subpaths[0];
    // תת-הנתיב: M אחד + שני L + סגירה (Z מסומן על-ידי חזרה לנקודת הפתיחה)
    assertEq(sub.filter((seg) => seg.op === 'M').length, 1, 'one move');
    // שני צלעים + צלע סיור אוטומטי (Z הופך לקו חזרה לנקודת הפתיחה)
    assertEq(sub.filter((seg) => seg.op === 'L').length, 3, 'two sides + auto-closing line');
    // דיו מתמלא בשלמות המשוליש: התיבה מכסה את שלוש הפינות
    const bb = svgInkBBox(paint, { x: 0, y: 0, w: 100, h: 40 });
    assert(Math.abs(bb.minX - 10) < 0.01 && Math.abs(bb.maxX - 90) < 0.01, `x range 10..90 (got ${bb.minX}..${bb.maxX})`);
    assert(Math.abs(bb.maxY - 35) < 0.01, `bottom 35 (got ${bb.maxY})`);
  });

  it('<polyline> עם fill מפורש נצבע; קו-בלבד מדולץ (מחוץ לתת-הקבוצה)', () => {
    const withFill = parseSvgPaint('<svg viewBox="0 0 100 40"><polyline points="10,5 90,5 50,35" fill="#123"/></svg>');
    assert(withFill && withFill.shapes.length === 1, 'polyline with fill painted');
    const noFill = parseSvgPaint('<svg viewBox="0 0 100 40"><polyline points="10,5 90,5" stroke="#000" fill="none"/></svg>');
    assertEq(noFill, null, 'stroke-only polyline out of the subset (like stroked paths)');
  });

  it('matrix() ורשימות טרנספורמציות — סדר SVG (שמאל חיצוני)', () => {
    // "translate(10,0) scale(2)" ⇒ x' = 2x+10 (קידום ואז הזה)
    // "translate(10,0) scale(2)" ⇒ קידום ×2 ואז הזה: rect x∈[0,5] ⇒ [10,20]
    const paint = parseSvgPaint('<svg viewBox="0 0 200 40"><g transform="translate(10,0) scale(2)"><rect x="0" y="0" width="5" height="5" fill="#000"/></g></svg>');
    assert(paint, 'paint parsed');
    const bb = svgInkBBox(paint, { x: 0, y: 0, w: 200, h: 40 });
    assert(bb, 'ink bbox computed');
    assert(Math.abs(bb.minX - 10) < 0.01, `rect translated+scaled: minX=${bb.minX} (expected 10)`);
    assert(Math.abs(bb.maxX - 20) < 0.01, `maxX=${bb.maxX} (expected 20 = 5×2+10)`);
    // matrix טהור: matrix(2,0,0,3,5,7) ⇒ x'=2x+5, y'=3y+7
    const pm = parseSvgPaint('<svg viewBox="0 0 200 60"><g transform="matrix(2,0,0,3,5,7)"><rect x="1" y="1" width="4" height="3" fill="#000"/></g></svg>');
    assert(pm, 'matrix paint parsed');
    const bm = svgInkBBox(pm, { x: 0, y: 0, w: 200, h: 60 });
    // x: 2·1+5=7 .. 2·5+5=15; y: 3·1+7=10 .. 3·4+7=19
    assert(Math.abs(bm.minX - 7) < 0.01, `matrix minX=${bm.minX} (expected 7)`);
    assert(Math.abs(bm.maxX - 15) < 0.01, `matrix maxX=${bm.maxX} (expected 15)`);
    assert(Math.abs(bm.minY - 10) < 0.01, `matrix minY=${bm.minY} (expected 10)`);
    assert(Math.abs(bm.maxY - 19) < 0.01, `matrix maxY=${bm.maxY} (expected 19)`);
  });

  it('רגרסיה: path/circle/rect ו-translate/scale בדוגמאות הקטלוג עובדים כשיהיו', () => {
    const legacy = parseSvgPaint('<svg viewBox="0 0 400 40"><g fill="#000" transform="translate(10,5) scale(2)"><path d="M20 2 L28 10 L20 18 L12 10 Z"/></g></svg>');
    assert(legacy && legacy.shapes.length === 1, 'legacy path with translate+scale still parses');
    const ops = svgToPdfOps(legacy, { x: 10, y: 10, w: 380, h: 38 }, 800, 0.75);
    assert(ops.length > 0, 'pdf ops emitted');
    assert(ops.some((op) => /f$/.test(op.trim())), 'fill op present');
  });
});

// =====================================================================
describe('S70 (R3-M2/M3) — כיול orphan/widow: רק הפרות אמיתיות', () => {
  const { runProtections } = require('../../src/engine/layout/protections-matrix');
  const { Ledger } = require('../../src/engine/core/ledger');
  const S = getDefaultSettings();

  // בונה עמוד עם טור אחד
  const mkPage = (col) => ({ index: 0, type: 'regular', columns: [col], template: { contentBox: { height: 900 }, columns: [{ x: 0, w: 300 }] } });
  const ln = (tokenId, part, over) => Object.assign({ heightPx: 20, words: ['מילה'], meta: { tokenId, part } }, over);

  it('חיתוך פסקה חוקי (2+ שורות בטור) אינו מדווח עוד — הוצאה משימוש של מכונת הדיווחים של השווא', () => {
    // תחתית: 3 שורות של pB ('first') והמשך בטור הבא — חוקי לחלוטין (SRS §5.1.2: שתי שורות לפחות)
    const col = [ln('pA', 'rest'), ln('pA', 'rest'), ln('pB', 'first'), ln('pB', 'first'), ln('pB', 'first')];
    const { violations } = runProtections(mkPage(col), S, new Ledger());
    assert(!violations.some(v => v.kind === 'widow-bottom' || v.kind === 'orphan-bottom'),
      `legal 3-line split must not be flagged (got ${violations.map(v => v.kind).join(',')})`);
    // וראש הטור: רצף pA בן 2 שורות — חוקי (SRS §5.1.1)
    assert(!violations.some(v => v.kind === 'orphan-top' || v.kind === 'widow-top'),
      `2-line continuation at top must not be flagged (got ${violations.map(v => v.kind).join(',')})`);
  });

  it('שורת פתיחה בודדת בתחתית הטור ⇒ הפרה אמיתית מדווחת (אין החלשה)', () => {
    const col = [ln('pA', 'rest'), ln('pA', 'rest'), ln('pB', 'first')];
    const { violations } = runProtections(mkPage(col), S, new Ledger());
    assert(violations.some(v => v.kind === 'orphan-bottom'),
      'single opening line at bottom MUST be flagged (orphan-bottom)');
  });

  it('שורת המשך בודדת בראש הטור שגם סוימת את הפסקה ⇒ אלמנה אמיתית מדווחת', () => {
    const col = [ln('pA', 'rest', { isLast: true }), ln('pB', 'first'), ln('pB', 'first')];
    const { violations } = runProtections(mkPage(col), S, new Ledger());
    assert(violations.some(v => v.kind === 'widow-top'),
      'single closing continuation line at top MUST be flagged (widow-top)');
  });

  it('ריגרסיה מספרתית: very_long — 0 דיווחי שווא חדשים, הפרות אמיתיות נשמרות, הפריסה זהה לנעילה', () => {
    const fs = require('fs');
    const path = require('path');
    const fixturePath = path.resolve(__dirname, '../../../audits/very_long_test_text.txt');
    const t = fs.readFileSync(fixturePath, 'utf8');
    const r = typeset(t, S);
    // **S72/D-106:** הנעילה עודכנה מ-531f2154 — מעבר יישור-התחתיות משנה את הגיאומטריה
    // ⇒ הערת-צד אחת ("שמירתו") הוסטה במפל בין עמ' 119←120 (תוכן נשמר, 2/1335 עמודים).
    // **שלב 5 פרוסה 1:** ננעל מחדש 847f02d3→7c4e9bff — תיקוני FX-1..FX-5 במתכנן:
    // קיבולת ב-yPx אמיתיים (FX-5) חיסלה עמודים ריקים-פנטום והצבות-יתר (1335→1089
    // עמודים, ‑18.5%); חלוקת השורות של כל 4536 הבלוקים שקולה לבסיס (מוכח
    // ב-s5-corpus-comparison: 0 redivision, 0 marker, 0 content-diff, 1 order-restore);
    // חריגות קיבולת תכנון 7→1; הערות 129/129 ומילים 346,241/346,241 זהות;
    // flowCol (מונוטוניות טורים) תיקם את היפוך הקריאה הבודד של הבסיס:
    // reading-order-break 1→0.
    // **שלב 5 פרוסה 2 (FX-6 — הפער כגיאומטריה מתוכננת):** ננעל מחדש
    // 7c4e9bff→a36b3637 — פער הבלוקים (gapBeforePx) נצבר מעתה בגובה התפוס
    // ובהקרנה (DOM margin-top / PDF התקדמות-y), במקום להיות שער-כניסה בלבד
    // שנעלם במורד הזרם. ההוכחה (s5-corpus-comparison, בסיס b2dd223): כל
    // 4536 הבלוקים זהים ביט-לביט (identical=4536/4536, 0 redivision, 0 marker,
    // 0 order-restore, 0 content-diff) — שבירת השורות לא נגעה כלל; השינוי
    // היחיד הוא אריזת עמודים: 1089→1108 (+1.75%) — הפערים צורכים קיבולת
    // אמיתית וגבולות העמודים זזים בהתאם. contentPreserved=true.
    // **שלב 6 פרוסה 3 (§3.2 — הצמדת הערות לעוגנים):** ננעל מחדש
    // a36b3637→d2a18112 — reconcileNotesAfterPlacement מעביר הערה שהוקמה
    // בעמוד הסמן-הראשון של הבלוק אל עמוד הסמן שלה עצמה (בקיבולת מצטברת
    // אמיתית): 5 הערות הועברו, 1 פשרת קיבולת מתועדת (fn-anchor-compromise).
    // הוכחת שימור תוכן ביט-לביט: bodyHash ba2fa46e / notesHash be780915
    // זהים לפני/אחרי (66,506 שורות; 1,276 הערות לפי noteId/marker/text);
    // contentPreserved=true; 1108 עמודים — השינוי גיאומטרי בלבד (מיקום
    // הערות במרזב), ללא כל שינוי שורות/תוכן/זהות. הצדקה מלאה בקובץ
    // הנעילות (tools/cross-check-locks.json).
    // **H3-CSS (17.11, חוזה ה-CSS המקורי גם במסלול המאוחד):** נעילה מחודשת
    // d2a18112→e68e1f0b — פסי H3 במסלול המאוחד קיבלו את ריפודי החוזה (8/4/4)
    // ו-line-height 1.22 (היה 1.4 ללא ריפודים כלל). שימור תוכן מלא: זרם
    // מילים זהה ביט-לביט; אפס שינויי חלוקת שורות; הערות 129=129; +2
    // עמודי regular מהריפודים. bodyHash/notesHash הוכחו בדוח ההשוואה.
    // דוח: audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md. הקודם: d2a18112.
    // **RLM (17.11, שורש מדידה — פרוסה 3):** נעילה מחודשת e68e1f0b→008bbb68 —
    // תווי בקרת bidi (U+200E/U+200F וכו') הם אפס-רוחב לפי יוניקוד ובכל מנוע
    // תצוגה, אך חלק מהגופנים נותנים להם advance ב-hmtx (נמדד 6.4px ל-RLM
    // ב-12pt) — המדידה ספרה אותם והתצוגה לא ⇒ פער דיו ~7px בכל מילה
    // מסומנת-RLM. הוכחת סיווג (דוח השוואה מלא): זרם המילים זהה ביט-לביט;
    // 151 שורות מכילות RLM בבסיס — 49 מהן נחלקו מחדש + שורות המשך-זרימה
    // באותן פסקאות; 197 שורות הועברו בין עמודים; אין שינוי מספר עמודים
    // (1110); הערות 129=129; contentPreserved=true. הקודם: e68e1f0b (H3-CSS).
    // **הדבקת הערות חוצות-שורות (9b.4, 18.11 — D-91: התנהגות המקור היא המפרס):**
    // נעילה מחודשת 008bbb68→fa1f06e2 (1218→1216 עמ.). שלוש הערות שנפתחו בשורה
    // ונסגרו בהמשך (4637-4638, 4734-4737, 5644-5645) — הפרסר הקנוני מדביק את
    // השורות הבאות עד לסגירה (מראה המורשת): 129→132 הערות-גוף בזהות מלאה;
    // 1,066 מילים עברו מהגוף לאזורי ההערות (D-30). הוכחות שימור:
    // contentPreserved=true; round-trip תו-לתו של very_long המלא; הקנוני
    // ללא שינוי (fdff19d8). הקודם: 008bbb68 (RLM/9b.3).
    // **U-8 (20.11):** ננעל מחדש fa1f06e2→c330970a — תקציב ההערות מופחת מקיבולת
    // כל הטורים ⇒ אריזת עמודים בלבד (1216→1242); 3636/3636 בלוקים זהים;
    // contentPreserved=true; הקנוני נשמר (fdff19d8); המורשת לא נגעה.
        // **Iteration-001 (legacy parity — 22.11):** נעילה מחודשת c330970a→140a42d9 —
    // פסי H3 באמצע העמוד (span_1col של המקור) במקום שטיפת-עמוד בכל כותרת:
    // 1242→1066 עמודים; contentPreserved=true; חלוקת שורות פר-בלוק זהה/מסווגת
    // (s5-corpus: 0 בלתי-מסווגים). דוח: audits/legacy-parity-iteration/iteration-001/.
        // **נעילת iteration-001 חודשה שוב לאחר כלל פיצול-נקי בלבד בפלחי-הזנב (אין פיצול unclean — כמקור):** 140a42d9→d2b871cf (1066=1066 עמודים; orphan-bottom חזר ל-0; contentPreserved=true).
        // **RC-5a (i004, 23.11) — מילוי גרידי בגבול העמוד כמו המורשת:** נעילה מחודשת
        // d2b871cf→6d1858a3 (1066→1031 עמודים; שורש +16 העמודים בספר הייחוס — ניקוד
        // חצי-חצי ב-findSplit הוחלף במזעור שארית-הטור). הוכחות: widow-bottom=0,
        // orphan-top=0, orphan-bottom=0 (נשמרו); contentPreserved=true;
        // materializeFallbacks=0. דוח: audits/legacy-parity-iteration/iteration-004/.
        // **RC-5b (i004):** נעילה מחודשת 6d1858a3→89063eb8 (1031→1021 עמודים) —
        // גבול העמוד בזרימה גרידית עם minPerSide=1 (זנבות 1-2 שורות בראש העמוד
        // הבא כמו הייחוס — S4.18). הוכחות: contentPreserved=true; mf=0;
        // widow-bottom=0; orphan-top=0; orphan-bottom=31 (legacy-faithful,
        // הייחוס: 43/604 עמודים).
        // **RC-5c+RC-5d (i004, 23.11 — השלמת המילוי הגרידי):** נעילה מחודשת
        // 89063eb8→4288bb4f (1021→996 עמודים). שני שורשים: (1) RC-5c — המקום
        // הפנוי ב-findSplit נספר על כל הטורים הפתוחים לזרימה (עד כאן נספר
        // הטור האחרון בלבד ⇒ part1 נמדד לשטח טור אחד אך הוצב מהטור הראשון
        // ⇒ הטור השני לא מולא מעולם); (2) RC-5d — בלוק שנכנס לסך השארית
        // של העמוד זורם דרך pushLines (breakPara חוצה-טורים של המורשת)
        // במקום הזזה מלאה. הוכחות: contentPreserved=true; mf=0; widow-bottom=0;
        // orphan-top=0; orphan-bottom=84 (זנבות עמוד נאמני-מורשת, 84/996≈8.4%
        // — הייחוס: 43/604≈7.1%). דוח: iteration-004.
    // **RC-F1a+RC-F1c (i005, 23.11):** נעילה מחודשת 4288bb4f→f7f72473 (996→968 עמודים) —
    // חוזה spanning אחיד לפסי H3: הצל הלא-מיושר הותיר 27 עמודים כמעט-ריקים
    // (שורה בודדת; נמדד p182/p195 בריצה הישנה) שפיצויי ההזזה/נסיגה גרמו להם.
    // הוכחות: contentPreserved=true; mf=0; widow-bottom=0; orphan-top=0;
    // orphan-bottom (נאמן-מורשת — הייחוס 43/604≈7.1%).
    // דוח: audits/legacy-parity-iteration/iteration-005/.
    assert(r.layoutHash.startsWith('f7f72473'), `layout unchanged (got ${r.layoutHash.slice(0, 8)})`);
    const count = (kind) => [...r.ledger.issues.values()].filter(x => x.kind === kind && x.status === 'persists').length;
    assertEq(count('widow-bottom'), 0, 'false widow-bottom flood eliminated (was 1176)');
    assertEq(count('orphan-top'), 0, 'false orphan-top flood eliminated (was 791)');
    // **שלב 5 פרוסה 1:** orphan-bottom 29→0 — ההפרות האמיתיות **חוסלו בשורש**,
    // לא הגילוי נחלש: legalSplitWindow (≥2 שורות לכל צד) + קיבולת ב-yPx אמיתיים
    // מונעים יצירת שורת-פתיחה בודדת בתחתית טור מלכתחילה. הגלאי עדיין חי:
    // הבדיקות הסינתטיות לעיל (widow-top/orphan-top MUST be flagged) מוכיחות
    // זיהוי על קלט מלאכותי, ו-widow-top=1 אמיתי עדיין מדווח בקורפוס.
    // **RC-5b (i004, 23.11) — parity המורשת:** זנבות 1-2 שורות בראש העמוד הבא
    // הם **התנהגות הייחוס** (43 עמודים עם ריצה ≤2 בראש הטור הימני ב-PDF
    // הישן; 'ודיקא נמי' חד-שורתי — S4.18). גבול העמוד כעת זורם גרידית
    // (minPerSide=1) ולכן orphan-bottom מדווח שוב — נאמן למקור, לא כשל;
    // מינימום 2-לכל-צד נשמר בפיצולים הפנימיים בין טורים (כמו balanceBlock
    // במורשת). החוזה: מדווחים בכמות סדר-גודל של הייחוס, לא מבול (29→0→31→84
    // לאורך RC-5a→5b→5c/5d ב-very_long; הייחוס: 43/604 עמודים; 84/996 כעת
    // — אותו יחס, והגידול היחסי משקף את הזרימה הגרידית המלאה).
    const ob = count('orphan-bottom');
    assert(ob > 0 && ob < 200, `orphan-bottom = legacy-faithful page-top tails (got ${ob}; reference has ~43/604 pages) — not a flood`);
    assert(count('widow-bottom') === 0 && count('orphan-top') === 0, 'intra-column protections unchanged (min-2 per side)');
    assert(count('column-imbalance') > 0, 'documented imbalance residuals unchanged (D-95)');
    assert(r.contentPreserved === true, 'content preserved');
  });
});

// =====================================================================
describe('S70 (R7-M4 + fn-continuous) — פקטורי גופן רק ב-impl A; זרימה רציפה ב-DP', () => {
  it('R7-M4: פקטור הגופן מולד ב-impl B ומופעל ב-impl A (footnote-budget)', () => {
    const { noteHeight, NOTE_FONT_FACTORS } = require('../../src/engine/layout/footnote-budget');
    const S = getDefaultSettings();
    // impl A: פונקציית מדידה לא-מסומנת (או מסומנת table) — הפקטור חייב לפעול
    const measureA = (t) => t.length * 10;
    const hA = noteHeight('את הערה שלמה לבדיקה', S, measureA, 300);
    // impl B: אותה פונקציה עם סימון font-metrics — הפקטור מולד
    const measureB = (t) => t.length * 10;
    measureB.impl = 'font-metrics';
    const hB = noteHeight('את הערה שלמה לבדיקה', S, measureB, 300);
    const f = NOTE_FONT_FACTORS[S['f-note-body-font']] || 1;
    if (f !== 1) {
      assert(hA > hB, `impl A inflates by factor ${f} (A=${hA} B=${hB})`);
      assert(Math.abs(hA / hB - f) < 0.05, `ratio ≈ factor (got ${hA / hB}, want ${f})`);
    } else {
      assertEq(hA, hB, 'no factor for this font — identical in both impls');
    }
  });

  it('fn-continuous ב-DP: המרזב מרונדר בזרימה אחת במקום בלוקים נפרדים', () => {
    const { renderPage } = require('../../src/engine/output/dom-renderer');
    // מסמך סינתטי עם שלוש הערות שולייות באותו עמוד
    const doc2 = [
      'ספר - בדיקת זרימה רציפה',
      'נושא - בדיקה',
      '',
      'כותרת 2 - פרק',
      'פסקה ראשונה עם הערה [הערה ראשונה של העמוד] והמשך טקסט.',
      'פסקה שניה עם עוד שתי הערות [הערה שניה] וגם [הערה שלישית] באותו עמוד.',
    ].join('\n');
    const sCont = { ...getDefaultSettings(), 'fn-layout-mode': 'continuous' };
    const r = global.typeset(doc2, sCont);
    const withFns = r.pages.filter((p) => (p.footnotes || []).length >= 2);
    assert(withFns.length > 0, `corpus has pages with ≥2 footnotes (got ${withFns.length})`);
    // DOM shim מינימלי
    const doc = {
      createElement: (t) => ({
        tagName: t, children: [], style: {}, dataset: {}, className: '',
        setAttribute() {}, appendChild(c) { this.children.push(c); return c; },
        set textContent(v) { this._t = v; this.children = []; }, get textContent() { return this._t || ''; }
      }),
      createTextNode: (t) => ({ text: t })
    };
    const rendered = renderPage(withFns[0], sCont, doc);
    // חיפוש אזור ההערות בעוץ העמוד
    const findArea = (el) => {
      if (!el || !el.children) return null;
      if (String(el.className).includes('footnotes')) return el;
      for (const c of el.children) { const f = findArea(c); if (f) return f; }
      return null;
    };
    const area = findArea(rendered);
    assert(area, 'footnote area rendered');
    const findFlow = (el) => {
      if (!el || !el.children) return null;
      if (String(el.className).includes('footnotes-flow')) return el;
      for (const c of el.children) { const f = findFlow(c); if (f) return f; }
      return null;
    };
    const flow = findFlow(area);
    assert(flow, 'continuous mode renders a single flow container (not per-note blocks)');
    const inlineNotes = (flow.children || []).filter((c) => String(c.className || '').includes('fn--inline'));
    assertEq(inlineNotes.length, withFns[0].footnotes.length, 'all notes flow inline in one container');
  });

  it('מצב block נותר כשהיה ברירת המחדל — בלוקים נפרדים (רגרסיה)', () => {
    const doc3 = [
      'ספר - בדיקת בלוקים',
      'נושא - בדיקה',
      '',
      'כותרת 2 - פרק',
      'פסקה ראשונה עם הערה [הערה ראשונה של העמוד] והמשך טקסט.',
      'פסקה שניה עם עוד שתי הערות [הערה שניה] וגם [הערה שלישית] באותו עמוד.',
    ].join('\n');
    // ברירת המחדל היא דווקא זרימה רציצה (S4.26) — הרגרסיה בודקת דווקא מצד מפורש
    const s = { ...getDefaultSettings(), 'fn-layout-mode': 'block' };
    const r = global.typeset(doc3, s);
    const withFns = r.pages.filter((p) => (p.footnotes || []).length >= 2);
    if (!withFns.length) return;
    const doc = {
      createElement: (t) => ({
        tagName: t, children: [], style: {}, dataset: {}, className: '',
        setAttribute() {}, appendChild(c) { this.children.push(c); return c; },
        set textContent(v) { this._t = v; this.children = []; }, get textContent() { return this._t || ''; }
      }),
      createTextNode: (t) => ({ text: t })
    };
    const { renderPage } = require('../../src/engine/output/dom-renderer');
    const rendered = renderPage(withFns[0], s, doc);
    const findArea = (el) => {
      if (!el || !el.children) return null;
      if (String(el.className).includes('footnotes')) return el;
      for (const c of el.children) { const f = findArea(c); if (f) return f; }
      return null;
    };
    const area = findArea(rendered);
    const findFlow = (el) => {
      if (!el || !el.children) return null;
      if (String(el.className).includes('footnotes-flow')) return el;
      for (const c of el.children) { const f = findFlow(c); if (f) return f; }
      return null;
    };
    assert(!findFlow(area), 'block mode (default) does not render a flow container');
  });
});

// =====================================================================
describe('S71.1 (בדיקה כפולה — R7-M4 שאריות) — נטרול הפקטור ב-impl B בנתיבי הקריאה בפועל', () => {
  // רקע: התיקון המקורי (S70/R7-M4) נבדק רק מול noteHeight בקריאה ישירה;
  // הבדיקה הכפולה גילתה שלוש נקודות שבהן הפקטור עדיין פעל ב-impl B (נתיב
  // ייצוא ה-PDF, measure-impl=font-metrics): עטיפת-החץ ב-reserveNotes איבדה
  // את סימון ה-impl; estimateSideNoteHeight והקרנת עמודי ה-endnotes לא בדקו
  // כלל. גופן עם פקטור ('David' ×1.04) בנתיב הייצוא הפעיל תקציב מרזב מנופח,
  // אומדן הערות-צד מוגזם והקרנת הערות-סיום שנשברה מוקדם מהתקציב (חפיפה).
  // כאן ננעלים שלושת הנתיבים בנפרד, עם מדידה קבועה (אורך×10) שמבודדת את
  // השפעת הפקטור ממטריקות הגופן.

  it('R7-M4-1 (dp-planner/reserveNotes): heightPx המאוחסן ב-impl B = חישוב ללא פקטור', () => {
    const { planPages } = require('../../src/engine/layout/dp-planner');
    const { noteHeight } = require('../../src/engine/layout/footnote-budget');
    const { EventLog } = require('../../src/engine/core/events');
    const { Ledger } = require('../../src/engine/core/ledger');
    // רוחב נתיב 155px, סמן '1', 4 מילים × 7 תווים (70px; ×1.04 ⇒ 72.8px):
    // ללא פקטור — 3 שורות (20+80=100, +80=180>155 ⇒ שורה; 70+80=150≤155; 150+80>155 ⇒ שורה);
    // עם פקטור — 4 שורות (20.8+83.2=104; +83.2=187.2>155 ⇒ שורה; 72.8+83.2=156>155 ⇒ שורה ×2).
    const S = { ...getDefaultSettings(), 'f-note-body-font': 'David', _fnColWidthPx: 155 };
    const mkMeasure = (impl) => { const f = (t) => t.length * 10; if (impl) f.impl = impl; return f; };
    const NOTE = 'aaaaaaa bbbbbbb ccccccc ddddddd';
    const mkBlock = () => ({
      kind: 'paragraph', tokenId: 't-s711', part: 0,
      lines: [{ words: ['טקסט'], heightPx: 20 }, { words: ['טקסט'], heightPx: 20 }],
      notes: [{ text: NOTE, marker: '1', tokenId: 'n-s711' }],
    });
    const run = (impl) => {
      const r = planPages([mkBlock()], S, new EventLog('full'), new Ledger(), { measure: mkMeasure(impl) });
      const fns = r.pages.flatMap((p) => p.footnotes || []);
      assert(fns.length > 0, 'ההערה הוצבה במרזב');
      return fns[0].heightPx;
    };
    const hA = run(undefined);              // impl A (טבלה) — הפקטור פועל
    const hB = run('font-metrics');         // impl B (ייצוא) — הפקטור מנוטרל
    const manualA = noteHeight({ text: NOTE, marker: '1' }, S, mkMeasure(undefined));
    const manualB = noteHeight({ text: NOTE, marker: '1' }, S, mkMeasure('font-metrics'));
    assertEq(hA, manualA, 'impl A דרך planPages = חישוב ידני עם פקטור David');
    assertEq(hB, manualB, 'impl B דרך planPages = חישוב ידני ללא פקטור');
    assert(manualA !== manualB, `פקטור David 1.04 חייב לשנות את מספר השורות (${manualA} מול ${manualB})`);
  });

  it('R7-M4-2 (side-notes/estimateSideNoteHeight): הפקטור מנוטרל ב-impl B', () => {
    const { estimateSideNoteHeight } = require('../../src/engine/layout/side-notes');
    // רוחב טור 150px, 4 מילים × 7 תווים (70px; ×1.04 ⇒ 72.8px), רווח 10px (10.4px):
    // ללא פקטור — 2 שורות (70+80=150≤150); עם פקטור — 4 שורות (72.8+83.2=156>150).
    const S = { ...getDefaultSettings(), 's-note-body-font': 'David', _sideNoteColWidthPx: 150 };
    const mk = (impl) => { const f = (t) => t.length * 10; if (impl) f.impl = impl; return f; };
    const txt = 'aaaaaaa aaaaaaa aaaaaaa aaaaaaa';
    const hA = estimateSideNoteHeight(txt, S, mk(undefined));
    const hB = estimateSideNoteHeight(txt, S, mk('font-metrics'));
    const lh = Math.round(S['body-font-size-pt'] * 0.75 * (96 / 72) * 1.15);
    assertEq(hA, lh * 4, `impl A: פקטור 1.04 ⇒ 4 שורות (קיבלנו ${hA / lh})`);
    assertEq(hB, lh * 2, `impl B: ללא פקטור ⇒ 2 שורות (קיבלנו ${hB / lh})`);
  });

  it('R7-M4-3 (geometry-projector/projectEndnotePage + notes-model): שבירת הערות-סיון **מהחותמת** — תקציב=הקרנה בשני ה-impl', () => {
    const { projectDocument } = require('../../src/engine/output/geometry-projector');
    const { stampNote, NOTE_KINDS } = require('../../src/engine/layout/notes-model');
    // **שלב 6 פרוסה 2 (§9):** המקרין כבר אינו מודד/שובר — הוא מקרין את שורות
    // החותמת. כוונת הבדיקה המקורית (R7-M4: הפקטור מנוטרל ב-impl B) נשמרת
    // ומחמירה: החותמה נבנית פעם אחת בכל impl (שם מוחל/מנוטרל הפקטור), וההקרנה
    // חייבת להציג **בדיוק את שורות החותמת** — אפס שבירה עצמאית של המקרין.
    // תבנית חד-טורית ברוחב 150px, סמן '1' (10px), 4 מילים × 7 תווים (70px):
    // impl A (פקטור David 1.04) — רוחבי מילה 72.8px ⇒ 4 שורות;
    // impl B (font-metrics, בלי פקטור) — 70px ⇒ 3 שורות.
    const S = { ...getDefaultSettings(), 'f-note-body-font': 'David' };
    const tpl = {
      width: 200, height: 400,
      contentBox: { top: 20, bottom: 380, left: 25, right: 175 },
      columns: [{ x: 25, w: 150 }],
    };
    const mkApi = (impl) => ({
      impl,
      measureTextWidth: (t) => t.length * 10,
      ascentEm: () => 0.8, descentEm: () => 0.2,
      lineHeightPx: (pt) => Math.round(pt * (96 / 72) * 1.34),
    });
    // פונקציית מדידה עם סימון impl — כמו measureWithImpl של ה-pipeline
    const mkMeasure = (impl) => { const f = (t) => t.length * 10; if (impl) f.impl = impl; return f; };
    const mkPage = (impl) => {
      const note = { marker: '1', text: 'aaaaaaa bbbbbbb ccccccc ddddddd', heightPx: 48, tokenId: 'n-s711' };
      stampNote(note, S, mkMeasure(impl), NOTE_KINDS.ENDNOTE, { widthPx: 150 });
      note.heightPx = note.linesCount * 20; // כמו הבונה — הגובה מהשורות
      return {
        type: 'endnotes', template: JSON.parse(JSON.stringify(tpl)),
        heading: null, titleBandPx: 0,
        columns: [[note]],
        footnotes: [], sideNotes: [], decorations: [],
      };
    };
    const lineCountOf = (impl) => {
      const proj = projectDocument({ pages: [mkPage(impl)], layoutHash: 's711' }, S, mkApi(impl));
      return proj.pages[0].lines.filter((l) => l.kind === 'endnote-note').length;
    };
    const a = lineCountOf(undefined);
    const b = lineCountOf('font-metrics');
    // החותמה עצמה — אותו הבדל שהיה במדידה הישירה (R7-M4-2): הפקטור פועל ב-impl A בלבד
    const probeA = stampNote({ marker: '1', text: 'aaaaaaa bbbbbbb ccccccc ddddddd' }, S, mkMeasure(undefined), NOTE_KINDS.ENDNOTE, { widthPx: 150 });
    const probeB = stampNote({ marker: '1', text: 'aaaaaaa bbbbbbb ccccccc ddddddd' }, S, mkMeasure('font-metrics'), NOTE_KINDS.ENDNOTE, { widthPx: 150 });
    assertEq(probeA.linesCount, 4, 'impl A: פקטור 1.04 ⇒ 4 שורות בחותמת');
    assertEq(probeB.linesCount, 3, 'impl B: ללא פקטור ⇒ 3 שורות בחותמת');
    // ההקרנה מהחותמת — אותן שורות בדיוק (אפס שבירה עצמאית של המקרין)
    assertEq(a, probeA.linesCount, 'impl A: ההקרנה = שורות החותמת');
    assertEq(b, probeB.linesCount, 'impl B: ההקרנה = שורות החותמת');
    assert(a !== b, 'ההבדל בין ה-impl-ים נשמר בחותמה (המדידה, לא ההקרנה)');
  });
  it('R7-M4-4 (export-api/S71.1 — עקביות מדידת ההקרנה): אפס חריגות טור בייצוא בגופן אמיתי', () => {
    const { exportPdf } = require('../../src/engine/output/export-api');
    const fs2 = require('fs');
    const path2 = require('path');
    // גופן המאגר (ברירת המחדל של המערכת) — תמיד קיים ב-repo, אין תלות בסביבה
    const FONT_PATH = path2.join(__dirname, '..', '..', 'ui', 'assets', 'imud', 'fonts', 'Frank-Ruhl-Libre-Bold.ttf');
    const bytes = fs2.readFileSync(FONT_PATH);
    const doc = fs2.readFileSync(path2.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt'), 'utf8');
    // לפני S71.1: typeset רץ ב-impl B אך ההקרנה מדדה בטבלה ⇒ 168/546 שורות
    // חרגו מגבולות הטור (מקס 32.5px) ו-97.8% מהמילים סטו מהתצוגה (ממוצע 111.8px).
    const exp = exportPdf(doc, getDefaultSettings(), bytes, 'Frank Ruhl Libre');
    assert(exp.ok, 'export ok: ' + exp.error);
    let overflow = 0, lines = 0;
    for (const pg of exp.projected.pages) {
      for (const ln of pg.lines) {
        if (!ln.words || !ln.words.length) continue;
        lines++;
        const wSum = ln.words.reduce((a, w) => a + w.w, 0);
        if (wSum - ln.w > 1) overflow++;
      }
    }
    assertEq(overflow, 0, `הקרנת הייצוא מודדת כמו המודל — שום שורה לא חורגת (${overflow}/${lines})`);
    // דטרמיניזם ייצוא כפול נשמר גם אחרי התיקון
    const again = exportPdf(doc, getDefaultSettings(), bytes, 'Frank Ruhl Libre');
    assert(again.ok && Buffer.compare(exp.bytes, again.bytes) === 0, 'ייצוא כפול ⇒ בתים זהים');
  });
});

report('s69-engine-residuals');
