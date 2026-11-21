// src/engine/layout/balancing.js — AutoQuality (Gold port, שלוש שכבות) + איזון גלובלי אופטימלי (EXT-8) + chapter-end modes
'use strict';

/**
 * AQ: stretchBy{Word,Letter,Heading}Spacing עם caps מוצהרים;
 * Clamp overshoot 20px (REQ-BAL-07); balance-chapter-end {balance|stretch|natural} (REQ-BAL-03).
 */

// (moveLineForward אינו נדרש עוד באיזון: optimalSplit מכסה את מרחב המצבים כולו — EXT-8)

const { colCapacityOf, normalizeColumnGaps } = require('./column-flow'); // **S5.2 (P-2):** קיבולת הטור — מקור יחיד; **פרוסה 2:** נרמול פערים אחרי פיצול מחדש
const { seamIsClean, escortCleanBoundary } = require('./constraint-matrix'); // **שלב 5:** תפר נקי + תפר מודע-ליווי — מקור יחיד (חילוץ שורש מ-#16/#17)

/** **Iteration-001 (legacy parity):** רשומות פס-H3 באמצע עמוד (פס/צל/זנב) הן
 *  גיאומטריה קבועה — הן אינן משתתפות במתיחת ה-AQ (כמו הפסים במקור),
 *  וגובהן אינו נכנס לבסיס המתיחה (הן כמו פערים — קבועות). */
function isFixedBandLine(ln) {
  return Boolean(ln && (ln.h3Band || ln.h3BandShadow || ln.h3BandTail));
}

/** **Iteration-001:** גובה קבוע של רשומות הפס בטור (פס+צל+זנב, כולל הפערים
 *  שלהן) — אינו משתתף במתיחה ויש לנכות אותו מהיעד בכל חישוב מקדם. */
function fixedBandPx(col) {
  let f = 0;
  for (const ln of col) {
    if (!isFixedBandLine(ln)) continue;
    f += (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
  }
  return f;
}

function usedHeight(col) {
  // **EXT-20:** גובה בפועל — כולל מקדם ה-AQ האנכי (לפני ה-AQ כל המקדמים 1).
  // **FX-6 (פרוסה 2):** פער הבלוקים (gapBeforePx) נכלל — הפער הוא גאומטריה
  // מתוכננת; הוא קבוע ואינו מתמתח עם aqStretch (המתיחה חלה על גובה השורה).
  return col.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
}

/** **FX-6 (פרוסה 2):** מרכיבי הגובה של טור — שורות מתיחות ופערים קבועים.
 * שימוש: חישוב מקדם מתיחה מדויק (target/cur) שבו הפערים אינם מתמתחים:
 * factor = (target − Σgap) / Σ(heightPx×stretch). */
function columnStretchParts(col) {
  let lines = 0, gaps = 0;
  for (const ln of col) {
    if (isFixedBandLine(ln)) continue; // **Iteration-001:** פסים קבועים — אינם נמתחים
    lines += (ln.heightPx || 0) * (ln.aqStretch || 1);
    gaps += ln.gapBeforePx || 0;
  }
  return { lines, gaps };
}

/** **U-10 (20.11 — אמנת פקטור אבסולוטי):** סכום גבהי השורות **הגולמיים** של
 * טור (בלי מתיחה). כל כותב aqStretch מחשב את המקדם האבסולוטי הסופי מכאן:
 * f = (target − Σgap) / ΣheightPx, מוחל כהחלפה. בעבר המקדם חושב מהסכום
 * המתוח שבעמודה (מכפיל מתיחה קיימת) אך הוחל כהחלפה — טור שנכנס
 * מכווץ (alignColumnBottoms fTall≈0.97) יצא מעל הקיבולת בכל מעבר AQ
 * נוסף (נמדד: ‏7 עמודות, ‏12.9–31.3px — LINE_BELOW_COLUMN ×8 באודיט). */
function rawLinesOf(col) {
  let raw = 0;
  for (const ln of col) {
    if (isFixedBandLine(ln)) continue; // **Iteration-001:** פסים קבועים — אינם בבסיס המתיחה
    raw += (ln.heightPx || 0);
  }
  return raw;
}

/** הערכת "איזון" עמוד: הפרש גובה טורים. */
function pageImbalance(page) {
  if (!page.columns || page.columns.length < 2) return 0;
  return Math.abs(usedHeight(page.columns[0]) - usedHeight(page.columns[1]));
}

/**
 * **EXT-8 — חלוקה גלובלית אופטימלית של טורי העמוד (הוכחה מתמטית):**
 * כל מצב חוקי של שני טורים — אחרי כל רצף הזזות moveLineForward חוקיות —
 * הוא **פיצול רציף** של רצף הקריאה: col0 = seq[0..k), col1 = seq[k..n).
 * (הוכחה: moveLineForward מעביר אך ורק את סוף col0 לראש col1 או את ראש col1
 * לסוף col0; אינדוקציה על מספר המהלכים שומרת על רציפות ועל סדר seq.)
 * לכן מרחב המצבים החוקי הוא בדיוק k ∈ [0..n], והמינימום הגלובלי של
 * ‏|H0(k) − H1(k)| בכפוף לקיבולת שני הטורים נמצא בזמן O(n) בסכומי קידום —
 * במקום הטיפוס הגרידי שורה-שורה שנעצר במינימום מקומי/בקיבולת.
 * סדר העדפות לקסיקוגרפי: (1) גבול-תפר נקי מ-widow/orphan, (2) |Δ| מינימלי,
 * (3) תנועה מינימלית מהפיצול הנוכחי (יציבות/דטרמיניזם).
 * @returns {{k:number, delta:number, clean:boolean}|null} — null אם אין פיצול חוקי-קיבולת
 */
function optimalSplit(cols, opts = {}) {
  const cap = opts.cap != null ? opts.cap : Number.POSITIVE_INFINITY;
  const extraLast = opts.extraLast || 0; // **U-8:** אין עוד צרכן מנוע — נשמר לבדיקות היחידה של המתמטיקה הגנרית בלבד
  const c0 = cols[0] || [], c1 = cols[1] || [];
  const seq = [...c0, ...c1];
  const n = seq.length;
  if (!n) return null;
  // **FX-6 (פרוסה 2):** פערי בלוקים נכללים בגובה השורה במרחב המצבים —
  // הפיצול ממזער את ה-|Δ| האמיתי (כולל הפערים המתוכננים).
  const h = (ln) => (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + h(seq[i]);
  const total = pre[n];
  const k0 = c0.length;

  // גבול-תפר נקי — **שלב 5:** constraint-matrix.seamIsClean (מקור יחיד; חילוץ
  // שורש מ-#16) + escortCleanBoundary (חילוץ שורש מ-#17, דוח 06 פרק 4 —
  // סתירת ליווי×איזון): גבול "נקי" הוא גם נקי מווידוא/יתום (לפי ריצות tokenId
  // ב-meta — לא דגלי part, שאינם מעידים על מיקום בבלוק; נלכד בניפוי EXT-8)
  // וגם אינו מותיר כותרת בתחתית הטור עם <ESCORT_MIN_LINES שורות אחריה —
  // אחרת האיזון עצמו יוצר הפרת heading-escort שאין לה תיקון.
  const cleanBoundary = (k) => seamIsClean(seq, k) && escortCleanBoundary(seq, k);

  let best = null;
  for (let k = 0; k <= n; k++) {
    const H0 = pre[k];
    const H1 = total - pre[k] + extraLast;
    if (H0 > cap + 0.5 || H1 > cap + 0.5) continue; // קיבולת קשה (REQ-BAL-09)
    const delta = Math.abs(H0 - H1);
    const clean = cleanBoundary(k);
    const score = (clean ? 0 : 1) * 1e9 + delta;
    if (
      !best ||
      score < best.score - 1e-9 ||
      (Math.abs(score - best.score) <= 1e-9 && Math.abs(k - k0) < Math.abs(best.k - k0))
    ) {
      best = { k, delta, clean, score };
    }
  }
  return best;
}

/**
 * איזון מלא של עמוד — **החלוקה הגלובללית האופטימלית (EXT-8)**: אם Δ>maxDelta
 * נבחר פיצול הממזער את |Δ| על כל הפיצולים החוקיים-קיבולתית (הוכחה ב-optimalSplit),
 * בהעדפת גבול-תפר נקי ובתנועה מינימלית. שמירת סדר הקריאה מובנית (פיצול רציף).
 * נסיגה אם אין פיצול חוקי (rollback integrity REQ-BAL-09).
 * @returns {{changed:boolean, before:number, after:number}}
 */
function balancePage(page, maxDelta) {
  const before = pageImbalance(page);
  if (before <= maxDelta) return { changed: false, before, after: before, moves: 0 };
  if (!page.columns || page.columns.length < 2) return { changed: false, before, after: before };
  // **Iteration-001 (legacy parity):** עמוד עם פסי H3 באמצע — הפסים והצללים
  // שלהם הם מחסומים סינכרוניים בין הטורים; פיצול רציף של העמוד כולו היה
  // מזיז צל מראש טור 1 לסוף טור 0 ומנתק את הסנכרון. מצב זה מטופל במקום
  // אחר (dp-planner.balancePageSafe/resplitTailSegments) על פלחי-הזנב —
  // כאן אין התערבות (עמוד סוף-פרק עם פסים נשאר כפי שנבנה).
  const hasBandsBal = (page.columns || []).some(c => (c || []).some(ln => isFixedBandLine(ln)));
  if (hasBandsBal) return { changed: false, before, after: before, moves: 0, bands: true };
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf (column-flow) — כולל הפס
  // החוצה־טורים. **U-8 (19.11 — אמנה אחת):** הקיבולת מודעת-תקציב-הערות
  // לכל טור (המרזב פרוש על רוחב תיבת-התוכן כולה) — extraLast הוסר; בעבר
  // הוא הגביל רק את הטור האחרון והשאיר את הראשון חופשי לחדור למרזב
  // בסוף-פרק (balance-chapter-end), והקיבולת חושבה מ-contentBox.height
  // גולמי שהתעלם מהפס ומהתקציב גם יחד.
  const cap = colCapacityOf(page);
  const best = optimalSplit(page.columns, { cap });
  if (!best || best.k === page.columns[0].length) {
    // אין פיצול חוקי-קיבולת, או שהנוכחי כבר האופטימלי — לא מדווח שינוי
    return { changed: false, before, after: before, rollback_reason: best ? 'at-optimum' : 'capacity' };
  }
  const seq = [...page.columns[0], ...page.columns[1]];
  const k0 = page.columns[0].length;
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  // **FX-6 (פרוסה 2):** נרמול פערים אחרי הפיצול מחדש — ראש כל טור אינו
  // נושא פער-כניסה (GAP_HEAD_POLICY; אותו כלל שחל בהצבה המקורית).
  normalizeColumnGaps(page.columns[0]);
  normalizeColumnGaps(page.columns[1]);
  const after = pageImbalance(page);
  return { changed: true, moves: Math.abs(best.k - k0), before, after, optimal: true, cleanBoundary: best.clean };
}

/**
 * **S72 (שיפור 3 — יישור תחתיות טורים ככלל עימוד; הוראת משתמש מפורשת 11.11):**
 * בכל עמוד דו-טורי — אחרי שכל הזזות השורות גמרו (planPages + retreat +
 * שערים + chapter-end) — אם הפרש תחתיות-הטקסט מעל הסף, הטור הקצר נמתח
 * במקדם מדויק (aqStretch = יעד/נוכחי) עד תחתית הטור הארוך, בכפוף
 * לגבולות ה-AQ. "הכלי עובד רק במקרה הנצרץ לו": דלג כשכבר מאוזן,
 * כשטור ריק (אין מה למתוח), בעמודי הערות — היעד אינו חודר לאזור
 * ההערות (תקרה = cap−fn; דילוג על חדירות קיימות — תחום ה-containment),
 * ובעמודי סוף-פרק כשbalance-chapter-end=natural (K-4 — אין מתיחה
 * מלאכותית של פרק קצר). שום שורה אינה זזה — המקדם בלבד; לכן גם
 * layoutHash (מבוסס-תוכן) אינו משתנה — נייטרליות מוכחת.
 * @returns {{aligned:number, skipped:number}}
 */
function alignColumnBottoms(pages, settings, eventLog, opts = {}) {
  const maxDelta = settings['imbalance-max-delta-px'];
  const hi = settings['aq-word-spacing-max'];
  const skip = opts.skipPages || null;
  let aligned = 0, skipped = 0;
  for (const page of pages) {
    if (skip && skip.has(page)) { skipped++; continue; }
    const cols = page.columns || [];
    if (cols.length !== 2) continue;
    const c0 = cols[0], c1 = cols[1];
    if (!c0.length || !c1.length) { skipped++; continue; } // טור ריק — אין מה למתוח
    // **FX-6 (פרוסה 2):** גבהים כוללים פערי בלוקים — אותה סמנטיקה כמו usedHeight
    // (הפער קבוע; המתיחה חלה על השורות בלבד — ראה columnStretchParts).
    const hh = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
    const h0 = hh(c0), h1 = hh(c1);
    const delta = Math.abs(h0 - h1);
    if (delta <= maxDelta) continue; // כבר מאוזן — אין התערבות
    // תקרת בטיחות בעמודי הערות: הטקסט לא נכנס לאזור ההערות (R3-C2 —
    // האזור חוצה-רוחב); חדירה קיימת (pre-existing containment) — לא לנו,
    // דילוג מלא כדי לא להחריף.
    // **U-8 (אמנה אחת):** colCapacityOf כבר מפחית את תקציב ההערות
    // (והפס החוצה־טורים) לכל טור — אין עוד חישוב תקרה מקביל כאן.
    const capAll = colCapacityOf(page);
    let target = Math.max(h0, h1);
    if (target > capAll + 0.5) { skipped++; continue; } // חדירה/גלישה קיימת
    target = Math.min(target, capAll);
    const shortI = h0 < h1 ? 0 : 1;
    const shortCol = cols[shortI];
    const usedS = Math.min(h0, h1);
    // **FX-6 (פרוסה 2):** מקדם מדויק עם פערים קבועים — הפערים אינם מתמתחים:
    // factor = (target − Σgap) / ΣheightPx. בלי זה, מתיחה שחושבה
    // מ-used כולל-פערים לא הגיעה ליעדה בפועל (הפערים נשארו בגובהם המקורי).
    // **U-10 (20.11 — אמנת פקטור אבסולוטי):** הפקטור נגזר מגבהים **גולמיים**
    // (ΣheightPx בלי מתיחה) ומוחל כהחלפה — aqStretch הוא תמיד המקדם האבסולוטי
    // של השורה (כך מפרשים אותו usedHeight, optimalSplit, ההקרנה והאודיט).
    // בעבר חושב מ-Σ(heightPx×stretch הנוכחי) — מכפיל מתיחה קיימת — אך הוחל
    // כהחלפה ⇒ טור שנכנס מכווץ היה מוחלף במקדם שאינו מתחשב בכיווץ.
    const partsS = columnStretchParts(shortCol);
    const rawS = rawLinesOf(shortCol);
    const fixedS = fixedBandPx(shortCol); // **Iteration-001:** הפסים קבועים — ניכוי מהיעד
    const stretchTo = (target) => rawS > 0.5 ? (target - partsS.gaps - fixedS) / rawS : 1;
    const raw = stretchTo(Math.max(h0, h1));
    if (!(raw > 1 + 1e-4)) continue;
    const lo = settings['aq-word-spacing-min'];
    const tallCol = cols[1 - shortI];
    // **S72 (עומס משותף):** כשהמקדם החד-צדדי נחתך בתקרת ה-AQ, הפער
    // מתחלק בין שני הטורים — הקצר נמתח והארוך מכווץ לנקודת האמצע —
    // ושני המקדמים בגבולות המוגדרים [lo,hi]. רק אם גם זה אינו אפשרי
    // (פער גדול על טורים קצרים) — מתיחה חד-צדדית עד התקרה ושארית
    // מדווחת באירוע (clamped=true).
    const mid = (Math.max(h0, h1) + usedS) / 2;
    const partsT = columnStretchParts(tallCol);
    const rawT = rawLinesOf(tallCol);
    const fixedT = fixedBandPx(tallCol); // **Iteration-001:** הפסים קבועים — ניכוי מהיעד
    const fShort = stretchTo(mid);
    const fTall = rawT > 0.5 ? (mid - partsT.gaps - fixedT) / rawT : 1;
    let factor, shared = false;
    if (raw > hi + 1e-9 && fShort <= hi + 1e-9 && fTall >= lo - 1e-9) {
      factor = fShort; shared = true;
    } else {
      factor = Math.min(hi, raw);
      if (!(factor > 1 + 1e-4)) continue;
    }
    for (const ln of shortCol) if (!isFixedBandLine(ln)) ln.aqStretch = factor;
    if (shared) for (const ln of tallCol) if (!isFixedBandLine(ln)) ln.aqStretch = fTall;
    aligned++;
    // **FX-6:** דיווח מדויק — הגובה בפועל אחרי מתיחה = Σgap + Σ(heightPx×factor)
    // **U-10:** מהגבהים הגולמיים — הפקטור אבסולוטי.
    const afterShort = partsS.gaps + fixedS + rawS * factor;
    const afterTall = shared ? (partsT.gaps + fixedT + rawT * fTall) : Math.max(h0, h1);
    eventLog.emit('balance', 'bottom-align', {
      page: page.index, col: shortI, factor: Number(factor.toFixed(4)),
      factorTall: shared ? Number(fTall.toFixed(4)) : null,
      deltaBefore: Number(delta.toFixed(1)), deltaAfter: Number(Math.abs(afterShort - afterTall).toFixed(1)),
      shared, clamped: !shared && raw > hi + 1e-9
    }, page.index);
  }
  return { aligned, skipped };
}

/**
 * balance-chapter-end mode ∈ {balance, stretch, natural} (REQ-BAL-03):
 * - balance: איזון רגיל
 * - stretch: איזון + AQ word-spacing (עד cap)
 * - natural: ללא איזון בסוף פרק (K-4: אין למתוח פרק קצר רק למילוי)
 */
function applyChapterEndMode(page, mode, settings, eventLog) {
  if (mode === 'natural') { eventLog.emit('balance', 'chapter-end-natural', { page: page.index }); return { mode, delta: pageImbalance(page) }; }
  const r = balancePage(page, settings['imbalance-max-delta-px']);
  if (mode === 'stretch' && settings['aq-enabled']) {
    autoQualityPass([page], settings, eventLog);
  }
  eventLog.emit('balance', `chapter-end-${mode}`, { page: page.index, ...r });
  return { mode, ...r };
}

/**
 * AutoQuality (פורטר מ‑Gold; כל הגבולות מה‑registry).
 * **EXT-20 — מתיחה אנכית אמיתית:** מקדם ה-AQ הוא מקדם **גובה-שורה**
 * (interline): ‏`aqStretch = cap/used` מעוגן לגבולות השלב, ו-usedHeight כבר
 * מחשב אותו — המתיחה מגיעה ליעדה (תחתית הטור) גם במודל, גם ב-DOM
 * וגם בפרויקטור. בעבר המקדם חושב מהגובה החסר אך הוחל כ-wordSpacing
 * אופקי — usedHeight לא השתנה והיעד מעולם לא הושג; שלושת נתיבי התצוגה
 * פירשו אותו אחרת. כעת שדה אחד, משמעות אחת, שלושה צרכנים זהים.
 */
const AQ_STAGES = ['word-spacing', 'letter-spacing', 'heading-spacing'];

/** \u05d2\u05d1\u05d5\u05dc\u05d5\u05ea \u05de\u05d5\u05db\u05e8\u05d6\u05ea \u05d0\u05d7\u05e8\u05ea \u05dc\u05db\u05dc \u05e9\u05dc\u05d1 — \u05d2\u05d9\u05e9\u05d4 \u05de\u05e4\u05d5\u05e8\u05e9\u05ea (settings['aq-*'])
 * \u05db\u05da \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05e8\u05d5\u05d0\u05d4 \u05e6\u05e8\u05d9\u05db\u05d4 \u05d0\u05de\u05d9\u05ea\u05d4 (\u05d1\u05e2\u05d1\u05e8 \u05d4\u05d9\u05d4 \u05d0\u05d9\u05e0\u05d3\u05d5\u05e7\u05d8\u05e8\u05d9\u05d9\u05d0\u05df \u05e9\u05d4\u05e1\u05d5\u05e8\u05e7 \u05dc\u05d0 \u05e8\u05d0\u05d4 — P0-5). */
function stageBounds(settings, stage) {
  switch (stage) {
    case 'word-spacing': return [settings['aq-word-spacing-min'], settings['aq-word-spacing-max']];
    case 'letter-spacing': return [settings['aq-letter-spacing-min'], settings['aq-letter-spacing-max']];
    case 'heading-spacing': return [settings['aq-heading-spacing-min'], settings['aq-heading-spacing-max']];
    default: return [0.95, 1.05];
  }
}

function autoQualityPass(pages, settings, eventLog) {
  if (!settings['aq-enabled']) return { applied: 0 };
  const clamp = settings['aq-overshoot-clamp-px'];
  // D-46 (תיקון P1-1 "מפתח מת"): שני המפתחים נצרכים כעת בפועל —
  // aq-stretch-to-bottom=false ⇒ אין מתיחה כלל; aq-compress-first ⇒ כיווץ לפני מתיחה.
  const mayStretch = settings['aq-stretch-to-bottom'] !== false;
  const compressFirst = settings['aq-compress-first'] !== false;
  let applied = 0;
  for (const page of pages) {
    for (let c = 0; c < page.columns.length; c++) {
      const lines = page.columns[c];
      const used = usedHeight(lines);
      if (!lines.length) continue;
      // **S5.2 (P-2):** קיבולת אפקטיבית פר-טור — כולל הפס החוצה־טורים ותקציב
      // ההערות (על הטור האחרון). המתיחה עד לתחתית האמיתית של הטור.
      const cap = colCapacityOf(page, { colIndex: c });
      const deficit = cap - used;
      if (deficit > 4 && mayStretch) {
        // **S72 (שיפור 4) + FX-6 (פרוסה 2):** מקדם מדויק עם פערים קבועים —
        // (cap − Σgap)/ΣheightPx — מגיע ליעד בדיוק גם בטורים מעורבי-גבהים
        // וגם כשפערי בלוקים בטור (הפערים אינם משתתפים במתיחה).
        // בעבר חושב 1+(deficit/n)/h(שורה-ראשונה) — קירוב שהחטיא את היעד.
        // **U-10 (20.11 — אמנת פקטור אבסולוטי):** המקדם נגזר מהגבהים ה**גולמיים**
        // ומוחל כהחלפה. בעבר חושב מ-Σ(heightPx×stretch הנוכחי) — כלומר כתיקון
        // יחסי — אך הוחל כהחלפה: טור שנכנס מכווץ (alignColumnBottoms fTall≈0.97)
        // יצא מעל הקיבולת (נמדד: ‏7 עמודות 12.9–31.3px — LINE_BELOW_COLUMN
        // ×8 באודיט very_long). גם בדיקת ה-clamp תוקנה: newUsed המדויק
        // = Σgap + factor×Σh_גולמי (לא used×factor שניפח את הפערים).
        const parts = columnStretchParts(lines);
        const rawL = rawLinesOf(lines);
        const fixed = fixedBandPx(lines); // **Iteration-001:** הפסים קבועים — ניכוי מהיעד
        const rawFactor = rawL > 0.5 ? (cap - parts.gaps - fixed) / rawL : 1;
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.min(hi, Math.max(lo, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          const newUsed = parts.gaps + fixed + rawL * factor;
          if (newUsed - cap > clamp) continue; // clamp 20px — class ch3p4/p17/ch72p9 הוכחד
          if (settings['aq-shared-load']) {
            if (stage !== 'word-spacing') continue;
          } else if (factor >= hi && stage !== 'word-spacing') continue;
          for (const ln of lines) if (!isFixedBandLine(ln)) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      } else if (deficit < -4 && compressFirst) {
        // עודף מעל התקרה ⇒ כיווץ עד min (כיווץ לפני מתיחה — compress-first)
        // **S72 (שיפור 4) + FX-6:** מקדם מדויק גם בכיווץ — (cap − Σgap)/Σh.
        // **U-10:** אותה אמנת פקטור אבסולוטי מגבהים גולמיים.
        const parts = columnStretchParts(lines);
        const rawL = rawLinesOf(lines);
        const fixed = fixedBandPx(lines); // **Iteration-001:** הפסים קבועים — ניכוי מהיעד
        const rawFactor = rawL > 0.5 ? (cap - parts.gaps - fixed) / rawL : 1;
        for (const stage of AQ_STAGES) {
          const [lo, hi] = stageBounds(settings, stage);
          const factor = Math.max(lo, Math.min(hi, rawFactor));
          if (Math.abs(factor - 1) < 1e-4) continue;
          for (const ln of lines) if (!isFixedBandLine(ln)) ln.aqStretch = factor;
          applied++;
          eventLog.emit('justify', `aq-${stage}-compress`, { page: page.index, col: c, factor: Number(factor.toFixed(4)) }, page.index);
          break;
        }
      }
    }
  }
  return { applied };
}

module.exports = { balancePage, optimalSplit, pageImbalance, applyChapterEndMode, autoQualityPass, alignColumnBottoms, usedHeight, columnStretchParts, rawLinesOf };
