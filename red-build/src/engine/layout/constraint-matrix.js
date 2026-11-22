// src/engine/layout/constraint-matrix.js — מטריצת האילוצים הטיפוגרפיים המאוחדת (שלב 5 — Planner יחיד)
'use strict';

/**
 * **מקור-האמת היחיד למדיניות שלמות-הפריסה** (חילוץ שורש מ-PR #16 [S78/D-107]
 * ו-PR #17 [דוח פורנזי 06, שלב A] לתוך המימוש המאוחד של שלב 5 — הוראה §20:
 * לא שתי גרסאות של אותה אחריות).
 *
 * האילוצים שהיו עד כאן פזורים כ-literals בחמישה מודולים (dp-planner:
 * ensureRoom/findSplit/לולאת הליווי, balancing: cleanBoundary, protections-matrix:
 * headingEscort/widowOrphan, candidate-generator: עונש strict מת — FX-4)
 * מתנסחים כאן פעם אחת, והצרכנים קוראים מכאן בלבד:
 *
 *  1. **חלון פיצול חוקי** — `MIN_LINES_PER_SIDE`/`WIDOW_ORPHAN_MIN` (≥2 שורות
 *     לכל צד של נקודת החיתוך; SRS §5.1 — מניעת יתום/אלמנה בגבול התפר).
 *     עד כאן הכלל חי בשני העתקים: `findSplit` (dp-planner: `maxFit < 2 ||
 *     lines−maxFit < 2`) ולולאת `cut = 2` ב-candidate-generator.
 *
 *  2. **תפר נקי** — `seamIsClean(seq, k)`: הפרדת גבול-טורים בין שתי שורות
 *     של אותה פסקה חוקית רק אם לפחות 2 שורות מכל צד. עד כאן חי בתוך
 *     `optimalSplit` (balancing) בלבד.
 *
 *  3. **תפר נקי מליווי** — `escortCleanBoundary(seq, k)`: גבול "נקי" גם אינו
 *     מותיר כותרת בתחתית הטור עם <ESCORT_MIN_LINES שורות אחריה (אחרת
 *     האיזון עצמו יוצר הפרת heading-escort שאין לה תיקון — דוח 06, פרק 4).
 *
 *  4. **יחידות yPx אמיתיות** — `stackHeightPx`/`escortStackHeightPx`: כל
 *     בדיקת קיבולת מודדת את המחסנית הפיזית (heightPx + פער כניסה) — לא
 *     המרות lineH. שורש FX-1/FX-5: עמוד ריק פנטום וכותרת יתומה מפער
 *     היחידות בין ensureRoom ל-pushLines.
 *
 *  5. **דגלי ווידוא/יתום** — `widowOrphanPolicy(settings)`: קריאה מרוכזת
 *     אחת של מפתחות המדיניות.
 *
 *  6. **ליווי כותרת** — `escortNeedLines`/`escortStackHeightPx` (REQ-BAL-10):
 *     כותרת + min(2, שורות-העוקבות) שורות ליווי באותו טור; הצורך נוסחא
 *     כאן, לא בלולאת הבלוקים של dp-planner.
 *
 *  7. **יתום ביעד** — `orphanAtDestination`: העונש ה-strict שהיה מת (FX-4)
 *     — התנאי ההיסטורי `cut < 2` היה בלתי-ספיק לעולם בטווח הלולאה.
 *
 * החוזה: פונקציות טהורות, אפס מצב, אפס תלות — מודול עלים שכל מודולי
 * הפריסה רשאים לדרוש (אין תלות מעוגלית). **אין שינוי ערכים** — ערכי
 * ברירת המחדל זהים ל-literals שהוחלפו (מוכח בהשוואת הקורפוס).
 */

/** מספר שורות מינימלי לכל צד של חיתוך פסקה (SRS §5.1; איסור יתום/אלמנה בגבול). */
const MIN_LINES_PER_SIDE = 2;

/** מינימום שורות ליווי אחרי כותרת H1-H6 באותו טור (REQ-BAL-10). */
const ESCORT_MIN_LINES = 2;

/** מינימום שורות מכל צד של גבול פיצול פסקה (widow/orphan קלאסי) — זהה ל-MIN_LINES_PER_SIDE (מקור יחיד, שני שמות תיעודיים). */
const WIDOW_ORPHAN_MIN = MIN_LINES_PER_SIDE;

/** סבילות השוואת קיבולת (px) — כמו ב-dp-planner.flushPage/pushLines. */
const CAPACITY_EPS = 0.5;

/**
 * חלון הפיצול החוקי של בלוק בן `linesCount` שורות כשמתאימות `maxFit`
 * שורות במקום הפנוי: חיתוך חוקי רק ב-[lo..hi] כאשר lo = 2 (שתי שורות
 * לפחות יישארו) ו-hi = min(linesCount − 2, maxFit) (שתיים לפחות יעברו
 * **והחלק הראשון נכנס פיזית למקום הפנוי).
 *
 * **שלב 5 פרוסה 2 (תיקון שורש — יישוב הפער חוזה↔התנהגות):** עד כאן `hi`
 * התעלם מ-`maxFit` — החוזה הכריז על [2..lines−2] בעוד generateCandidates
 * ניהל בעצמו גם טווח [2..lines−1) וגם דחיית `cut > maxFit` נפרדת: שני
 * מקורות לאותה מדיניות, עם נקודת חיכוך אחת אמיתית — חיתוך lines−1 (משאיר
 * שורה בודדת ביעד) היה חוקי בפועל אף שהחוזה אסר אותו. מעתה החלון כאן
 * הוא **מקור האמת היחיד** לטווח החוקי (הן את הכלל ≥2-לכל-צד והן את
 * גבול הקיבולת), והצרכנים (findSplit, generateCandidates) קוראים ממנו
 * בלבד — אין עוד תנאי טווח משוכפל.
 *
 * @returns {{lo:number, hi:number}|null} — null אם אין חלון חוקי כלל
 *   (הבלוק קצר מדי או שהמקום הפנוי קטן מדי ⇒ ההזזה מלאה, לא פיצול).
 */
function legalSplitWindow(linesCount, maxFit, opts = {}) {
  // **RC-5b (i004) — גבול עמוד הוא זרימה גרידית במורשת:** בפרוסת העמוד
  // (findSplit) המקור ממלא את הטור עד תחתיתו ומשאיר זנב של 1-2 שורות בראש
  // העמוד הבא (הוכח מה-PDF הישן: 43 עמודים עם ריצה ≤2 שורות בראש הטור
  // הימני, כולל 'ודיקא נמי' חד-שורתי בעמ' 93/14 — S4.18). מינימום 2-לכל-צד
  // נשאר כברירת המחדל לפיצולים פנימיים (כמו balanceBlock במורשת —
  // getSplitRules minFirst=minLast=2); גבול העמוד מעביר minPerSide=1.
  const minSide = (opts && Number(opts.minPerSide) >= 1) ? Number(opts.minPerSide) : MIN_LINES_PER_SIDE;
  if (maxFit < minSide) return null;
  if (linesCount - maxFit < minSide) return null;
  const lo = minSide;
  const hi = Math.min(linesCount - minSide, maxFit);
  return hi >= lo ? { lo, hi } : null;
}

/**
 * תפר נקי בין טורים: הגבול k (col0 = seq[0..k), col1 = seq[k..n)) כאשר
 * הפסקה ממשיכה מעבר לו — חוקי רק אם מכל צד יש לפחות 2 שורות של אותה
 * פסקה (ווידוא-תחתית: השורה שלפני הגבול אינה ראשונת הריצה; ווידוא-ראש:
 * השורה שאחרי הגבול אינה אחרונת הריצה). זהות פסקה לפי ריצות tokenId
 * ב-meta — לא לפי דגלי part (שאינם מעידים על מיקום בבלוק; נלכד בניפוי EXT-8).
 * @param {Array} seq - רצף הקריאה המלא של העמוד ([...col0, ...col1])
 * @param {number} k - נקודת הגבול הנבדקת
 * @returns {boolean}
 */
function seamIsClean(seq, k) {
  const n = seq.length;
  if (k > 0 && k < n) {
    const lt = seq[k - 1].meta && seq[k - 1].meta.tokenId;
    const rt = seq[k].meta && seq[k].meta.tokenId;
    if (lt != null && lt === rt) { // הבלוק ממשיך מעבר לגבול
      if (k - 2 < 0 || (seq[k - 2].meta && seq[k - 2].meta.tokenId) !== lt) return false; // widow-bottom
      if (k + 1 >= n || (seq[k + 1].meta && seq[k + 1].meta.tokenId) !== rt) return false; // widow-top
    }
  }
  return true;
}

/**
 * האם גבול פיצול (מקום k ברצף הקריאה) משאיר כותרת ללא ליווי מספק בטור
 * המקור (col0 = seq[0..k))? optimalSplit סימן גבול "נקי" גם כשהוא מותיר
 * כותרת בתחתית הטור עם <2 שורות אחריה — heading-escort שאין לו תיקון.
 * מעתה גבול כזה איננו "clean" (עדיפות לקסיקוגרפית: clean קודם ל-|Δ|).
 */
function escortCleanBoundary(seq, k) {
  // סריקה אחורה מסוף col0: כותרת בטווח ESCORT_MIN_LINES+1 השורות האחרונות
  for (let i = Math.max(0, k - (ESCORT_MIN_LINES + 1)); i < k; i++) {
    const ln = seq[i];
    if (!ln || ln.kind !== 'heading') continue;
    let nonHeadingAfter = 0;
    for (let j = i + 1; j < k; j++) {
      if (seq[j] && seq[j].kind !== 'heading') nonHeadingAfter++;
    }
    if (nonHeadingAfter < ESCORT_MIN_LINES) return false;
  }
  return true;
}

/**
 * דגלי מדיניות ווידוא/יתום — קריאה מרוכזת אחת (מקור: settings-registry).
 * **פרוסה 2:** ה-fallback מיושב ל-'normal' — זהה לברירת המחדל ברגיסטרי
 * (עד כאן 'standard' — מחרוזת שאינה ב-enum ולעולם לא הופיעה בפועל).
 * @returns {{preventWidowsTop, preventWidowsBottom, preventOrphansTop, preventOrphansBottom, strictness}}
 */
function widowOrphanPolicy(settings) {
  return {
    preventWidowsTop: settings['prevent-widows-top'] === true,
    preventWidowsBottom: settings['prevent-widows-bottom'] === true,
    preventOrphansTop: settings['prevent-orphans-top'] === true,
    preventOrphansBottom: settings['prevent-orphans-bottom'] === true,
    strictness: settings['widow-strictness'] || 'normal'
  };
}

/**
 * **טבלת מדיניות האילוצים (שלב 5 פרוסה 2 — §2.4 בביקורת):** הכרזה חד-משמעית
 * מה קשיח (פוסל מועמד/מצב) ומה רך (עדיפות/עונש בלבד). כלל ההכרעה:
 * hard = הפרתו יוצרת מצב בלתי-חוקי (חריגת קיבולת, פחות מ-2 שורות
 * לצד חיתוך, כותרת ללא ליווי); soft = העדפה בין מצבים חוקיים.
 * מדיניות strict (widow-strictness=strict): מועמד חיתוך שמשאיר בדיוק את
 * המינימום החוקי ביעד (שתי שורות) נענש — strict מעדיף שלא להסתפק במינימום
 * החוקי בראש הטור הבא; normal = שקילות; relaxed = דילוג על בדיקת
 * orphan-top בהגנות (קיים). שלוש הרמות מוגדרות, מתועדות ונבדקות חיוב/שלילה.
 */
const CONSTRAINT_POLICY = Object.freeze({
  minLinesPerSide: { type: 'hard', scope: 'split-window', description: '≥2 שורות לכל צד של חיתוך פסקה (SRS §5.1)' },
  maxFitBound: { type: 'hard', scope: 'split-window', description: 'החלק הראשון חייב להיכנס למקום הפנוי בפועל (yPx)' },
  seamClean: { type: 'hard', scope: 'balance', description: 'גבול איזון אינו מותיר ריצת-פסקה בת שורה אחת מכל צד' },
  escortCleanBoundary: { type: 'hard', scope: 'balance', description: 'גבול איזון אינו מותיר כותרת עם <2 שורות ליווי' },
  headingEscort: { type: 'hard', scope: 'placement', description: 'כותרת H1–H6 + min(2, עוקבות) שורות באותו טור (REQ-BAL-10)' },
  columnCapacity: { type: 'hard', scope: 'placement', description: 'usedHeight (כולל gaps + תקציב הערות) ≤ קיבולת אפקטיבית' },
  readingOrder: { type: 'hard', scope: 'placement', description: 'מונוטוניות flowCol + seq עולה בסדר הקריאה' },
  strictDestMinimum: {
    type: 'soft', scope: 'candidate-scoring',
    description: 'strict: עונש על מועמד שמשאיר בדיוק את המינימום החוקי (2 שורות) בראש היעד',
    penalty: 1e9
  },
  balanceDelta: {
    type: 'soft', scope: 'balance',
    description: 'איזון טורים ממזער |Δ| בכפוף לאילוצים הקשיחים; פשרה מתועדת כשאין פיצול חוקי',
    threshold: 'settings[imbalance-max-delta-px]'
  }
});

/**
 * **FX-6 (שלב 5 פרוסה 2 — סמנטיקת פער הבלוקים בחוזה הגאומטרי):** הפער
 * בין בלוקים הוא גאומטריה מתוכננת, לא רק תנאי כניסה. הכללים הקנוניים:
 *  - הפער נחתם פעם אחת על השורה הראשונה של הבלוק (`gapBeforePx`) במקום
 *    ההצבה — מקור יחיד; המקרינים קוראים ואינם מוסיפים בעצמם.
 *  - דיכוי בראש טור: שורה ראשונה בטור (גם מתחת לפס חוצה-טורים) — בלי
 *    פער; ראש עמוד — בלי פער; בלוקים רצופים — פער בכל פתיחת בלוק.
 *  - הפער נכלל ב-usedHeight (תכנון ורינדור) ובבדיקות הקיבולת; המתיחה
 *    האנכית (aqStretch) חלה על גובה השורה בלבד — הפער קבוע.
 */
const GAP_HEAD_POLICY = 'suppress-at-column-head';

/**
 * מספר השורות שחייבות להיכנס יחד עם כותרת לטור (REQ-BAL-10):
 * הכותרת + עד ESCORT_MIN_LINES שורות ליווי (או כמה שיש אם העוקב קצר).
 * @param {number} headingLines - שורות הכותרת עצמה (בדרך כלל 1)
 * @param {number} followingLines - שורות הבלוק העוקב (0 אם אין)
 */
function escortNeedLines(headingLines, followingLines) {
  return headingLines + Math.min(MIN_LINES_PER_SIDE, Math.max(0, followingLines));
}

/**
 * גובה מחסנית אמיתי (yPx) של קבוצת שורות, כולל פער הכניסה של הבלוק.
 * זהו ניפוץ הכפילות "יחידות lineH מול heightPx" (FX-1/FX-5): הבדיקה
 * וההצבה מודדות באותה יחידה — הגובה הפיזי שייצרך בפועל.
 *
 * **FX-6 (פרוסה 2):** פער הכניסה הוא חלק מהמחסנית לצורך בדיקת קיבולת
 * שמרנית (הבלוק עשוי להיפתח באמצע טור). בפועל, אם הבלוק נפתח בראש טור —
 * הפער מדוכא בחותמת (GAP_HEAD_POLICY) והשימוש בפועל קטן מהמחסנית
 * בסכום הפער בלבד (שמרנות מתועדת, לא אי-דיוק).
 *
 * @param {Array<{heightPx:number}>} lines
 * @param {number} [admissionGapPx=0] — blockGapPx של הבלוק
 */
function stackHeightPx(lines, admissionGapPx = 0) {
  let h = admissionGapPx;
  for (const ln of lines) h += (ln && ln.heightPx) || 0;
  return h;
}

/**
 * גובה המחסנית שחייבת להיכנס **בטור אחד** כדי לקיים ליווי כותרת:
 * כל שורות הכותרת + פער הכניסה שלה + min(escort, following) שורות ליווי
 * + פער הכניסה של בלוק הליווי. (הבדיקה ההיסטורית מדדה 1+2 ביחידות lineH —
 * והתעלמה מגובה הכותרת האמיתי ומפער הליווי.)
 *
 * @param {object} headBlock — בלוק הכותרת {lines}
 * @param {object|null} nextBlock — הבלוק העוקב {lines}
 * @param {(block)=>number} gapOf — פער כניסה פר-בלוק (blockGapPx(settings,lineH))
 */
function escortStackHeightPx(headBlock, nextBlock, gapOf) {
  const following = nextBlock && nextBlock.lines ? nextBlock.lines.length : 0;
  if (following < 1) return stackHeightPx(headBlock.lines, gapOf(headBlock));
  const escortN = Math.min(ESCORT_MIN_LINES, following);
  return stackHeightPx(headBlock.lines, gapOf(headBlock))
    + stackHeightPx(nextBlock.lines.slice(0, escortN), gapOf(nextBlock));
}

/**
 * האם חיתוך במקום `cut` משאיר **בדיוק את המינימום החוקי** בראש היעד
 * (שתי שורות — פחות מזה אינו חוקי כלל ונחסם מראש ע"י legalSplitWindow).
 * **פרוסה 2:** לאחר שהחלון הפך לסמכות היחידה, תפקיד הפונקציה השתנה —
 * היא כבר אינה מזהה מצב בלתי-חוקי (אין כזה בתוך החלון), אלא מסמנת את
 * **מדיניות strict** (עונש רך על הסתפקות במינימום; CONSTRAINT_POLICY.
 * strictDestMinimum). משמרת את כוונת FX-4 (מדיניות שקרית כלפי המשתמש —
 * אסור שתחזור) בנוסח שאינו מתנגש לחוזה החלון.
 */
function orphanAtDestination(lineCount, cut) {
  return lineCount - cut <= WIDOW_ORPHAN_MIN;
}

module.exports = {
  MIN_LINES_PER_SIDE,
  ESCORT_MIN_LINES,
  WIDOW_ORPHAN_MIN,
  CAPACITY_EPS,
  GAP_HEAD_POLICY,
  CONSTRAINT_POLICY,
  legalSplitWindow,
  seamIsClean,
  escortCleanBoundary,
  widowOrphanPolicy,
  escortNeedLines,
  stackHeightPx,
  escortStackHeightPx,
  orphanAtDestination
};
