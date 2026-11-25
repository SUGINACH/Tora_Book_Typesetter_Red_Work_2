// tests/e2e/s72-column-bottoms.test.js — שער S72: יישור תחתיות טורים (4 השיפורים)
// **רקע (הוראת משתמש מפורשת, 11.11):** "בדקתי ספר דוגמא, ולא ראיתי שיפור
// באיזון טורים (הכוונה = שבכל בלוק של שני טורים, קצה התחתון של הטקסט
// שבשני הטורים יהיה שווה)". השורש: (א) בנתיב המורשת — סעיף 4 של S4.13
// ("מתיחה אנכית עדינה של הטור הקצר") מעולם לא מומש, ומתיחת סוף-העמוד של
// v21 (stretchPageToBottom) הייתה כבויה מאחורי RED_ENABLE_STRETCH_RECLAIM;
// (ב) בנתיב ה-DP — שכבת המתיחה (AQ) כבויה כברירת מחדל ומקדם המתיחה שלה
// היה קירוב first-line שהחטיא את היעד בטורים מעורבי-גבהים.
// **4 השיפורים (כל כלי רק במקרה הנצרץ לו + סדר החלה נכון):**
//  1. מורשת: alignBlockBottoms — מתיחה עדינה של הטור הקצר בסיום בלוק (כל
//     הסעיפים) + עומס משותף (v21 compressColumnBy) כשהמתיחה לבדה לא סגרה.
//  2. מורשת: stretchLastBlockToBottom מופעל כברירת מחדל (מתיחה בלבד;
//     משיכת-היתום נותרת opt-in) + דיווח שארית ברמת העמוד.
//  3. DP: alignColumnBottoms — יישור תחתיות ככלל עימוד, אחרי כל הזזות
//     השורות, עם תקרת אזור-הערות, עומס משותף ודילוג natural.
//  4. DP: מקדם מתיחה מדויק (יעד/נוכחי) ב-autoQualityPass — מגיע ליעד
//     גם בטורים מעורבי-גבהים.
// **נייטרליות (ההוכחה המחייבת):** אף שורה אינה זזה בין טורים/עמודים —
// hash הפריסה (מבוסס-תוכן) זהה ביט-לביט לפני ואחרי בכל ארבעת הקורפוסים.
'use strict';

const { describe, it, assert, assertEq, report } = require('../harness');
const fs = require('fs');
const path = require('path');

const { typeset } = require('../../src/engine/core/pipeline');
const { legacyTypeset } = require('../../src/engine/layout/legacy-imud-flow');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getDefaultSettings, getSettingDefs } = require('../../src/engine/core/settings-registry');
const { generateTestDocument } = require('../../src/ui/test-doc-generator');
const { alignColumnBottoms, autoQualityPass } = require('../../src/engine/layout/balancing');

const REPO = path.resolve(__dirname, '..', '..');
const LEGACY_DEFAULTS = JSON.parse(fs.readFileSync(path.join(REPO, 'ui/assets/imud/default_settings.json'), 'utf8'));

function imudSettings() {
  const regKeys = new Set(getSettingDefs().map(r => r.id));
  const { settings } = importImudSettings(LEGACY_DEFAULTS, regKeys, {});
  return Object.assign({}, getDefaultSettings(), settings);
}

/** מדידת תחתית-דיו לפי מיקומי y בפועל (כמו האודיט החי) — עמודי גוף דו-טוריים. */
function pageBottoms(pg) {
  const ext = (col) => (!col || !col.length) ? 0 :
    col.reduce((m, ln) => Math.max(m, (ln.y || 0) + (ln.heightPx || 16)), 0);
  return [ext(pg.columns[0]), ext(pg.columns[1])];
}
const isBody2col = (pg) => (pg.type === 'regular' || pg.type === 'sign-open')
  && pg.columns && pg.columns.length === 2
  && (pg.columns[0].length || pg.columns[1].length);

// =====================================================================
describe('S72.1 מורשת — יישור תחתיות במסמך הבדיקה הקבוע (הספר שהמשתמש בודק)', () => {
  const text = generateTestDocument({ mode: 'fixed' });
  const result = legacyTypeset(text, imudSettings(), {});

  it('לפני S7 נמדדו 74.7% עמודי-גוף עם Δ>5px — אחרי S7 נותרו אחוזים בודדים (שאריות מדווחות)', () => {
    let n = 0, over = 0, perfect = 0;
    const residuals = [];
    for (const pg of result.pages) {
      if (!isBody2col(pg)) continue;
      n++;
      const [b0, b1] = pageBottoms(pg);
      const d = Math.abs(b0 - b1);
      if (d <= 0.5) perfect++;
      if (d > 5) { over++; residuals.push({ p: pg.index, d: Math.round(d), empty: !pg.columns[0].length || !pg.columns[1].length }); }
    }
    // שלוש שאריות צפויות: סגירות עם בלוק זעיר מתחת ל-span שטורו השמאלי ריק
    // (אינו ניתן לפיצול — min-2) — כמו 5 העמודים בייחוס המקור עצמו.
    // **S75 (בקשה 1 — מנגנון body-first, 12.11):** עמודי הסגירה השתנו —
    // ברירת המחדל החדשה אינה דוחפת פסקאות-הערות (שער ההתחלות במקום שער
    // התקציב) ⇒ נקודות הסגירה/האיזון זזו. המדד המשמעותי: יישור בטווח 1px
    // (קוונטיזציית פס-שורה); מעל 5px — שאריות מבניות בלבד (min-2/כותרות).
    // **S76 (שלושת ליקויי ההערות, 12.11):** אותן שאריות מבניות בדיוק —
    // רק הוסטו בעמוד אחד (עמוד ההמשך הייעודי שנוסף לפני פתיחת פרק;
    // S75: 71:9 72:10 252:27 279:150,empty 387:88 → S76: 71:9 72:10 253:27
    // 280:150,empty 388:12 389:88 — השארית של 387:88 התפצלה לגוש
    // הכותרות שלה על פני שני עמודים). אין שארית חדשה מטיפוס חדש.
    assert(over <= 7, `יותר מדי עמודים לא-מאוזנים: ${over} [${residuals.map(r => `${r.p}:${r.d}${r.empty ? ',empty' : ''}`).join(' ')}]`);
    assert(perfect / n > 0.80, `צפוי רוב מכריע של עמודים מיושרים-במדויק — התקבלו ${perfect}/${n}`);
    assert(result.contentPreserved === true, 'שימור תוכן נפגע');
  });

  it('נייטרליות מלאה: המסמך הקבוע התקין נשאר זהה לנעילת S72 המאושרת — המתיחה אינה מזיזה אף שורה', () => {
    // נעילת הנייטרליות נמדדה מול הקוד שלפני השינוי (git-stash, 11.11):
    // fixed-doc: legacy-075b94be2e7705d8 · real: legacy-ae83a4e1595c9e55
    // **S74 (בעיה 6 — אלמנת כותרת, בקשת משתמש 12.11):** הנעילה הוזזה מחדש —
    // הפריסה השתנתה **במכוון** ע״י שלושת שינויי הפריסה המאושרים: (א) כותרות 2/3
    // נעטפות ברוחב 60% מהפס; (ב) החזרת כותרות-זנב בשער תקציב-ההערות ובשבירת
    // span (במסמך זה: עמ' 39 — כותרת "טעם הדין" אלמנה בתחתית הטור הוחזרה עם
    // פסקתה; אומת מול הקוד הקודם — מקור ההפרש היחיד); (ג) מדידת גוף ההערה
    // בגופן ההגדרה (במסמך זה ללא אפקט — מדידת טבלה). המנגנון עצמו (S72)
    // לא שונה — נעילת ה-neutrality של המתיחה ממשיכה להיבדק כאן על הבסיס החדש.
    // **S75 (בקשה 1 — 12.11):** נעילה מחודשת אחרי החלפת מנגנון הצבת ההערות
    // בברירת המחדל (body-first — ביטול שער התקציב, תקרה יחסית 50%, רצפת
    // התחלות) + תיקון שורש אובדן כותרת-זנב במעבר טור (המשך ti בלולאת
    // ההצבה). שינוי מכוון מאושר (בקשת משתמש מפורשת). הקודם: legacy-3ce387962aa20101 (S74).
    // **S76 (שלושת ליקויי ההערות — 12.11):** נעילה מחודשת שוב: מילוי
    // המרזב עד תום (חלל ה-flex בעמוד פתיחה + רצפת התקציב בהצבה), ביטול
    // פילבק "סמן-בלבד" שבזבז שורות, ושטיפת המשכים לעמודים ייעודיים
    // לפני פתיחת פרק ("הערות של פרק אחד לא יכולות להמשיך בפרק הבא").
    // שינוי מכוון מאושר (דיווח משתמש מפורש). הקודם: legacy-3f865b10dfe55be2 (S75).
    // **R-03 (יובא מ-Red PR #48):** נעילה מחודשת legacy-6a06e→legacy-a0946 — תיקון שורש של דגלי סוגריים של מילה עם סמן הערה מודבק + דליפת עומק; שינוי פריסה מכוון של מדידה נכונה (12pt במקום 10pt שגוי). הקודם: legacy-6a06e3108c8eca9b.
    // **נייטרליות legacy הוכחה:** במצב fn-placement-mode=legacy ה-hash חוזר
    // בדיוק לנעילת S74 (legacy-3ce387962aa20101) — נבדק ב-S76 מחדש.
    // **H3-CSS+F-BL2 (17.11, שני תיקוני שורש משולבים — נעילה משולבת):**
    // (א) H3-CSS — חוזה ה-CSS המקורי: pitch כותרת-3 = line-height 1.22 בלבד
    //     (21.96px ב-13.5pt; היה 34 שכלל את הריפוד העליון); ריפודים 8/4/4 פעם אחת;
    //     חד-שורתית 8+21.96+4+4≈38 (כיוול S4.14 נשמר). דוח:
    //     audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md.
    // (ב) F-BL4 — סמן-הערה שנבלע בחיתוך שורת המרזב: gap נספר כ"הערה שהחלה"
    //     ⇒ המשך בלי סמן; תוקן — "החלה" מוכחת רק ע"י טוקן שהוצג. במסמך זה
    //     שוחזרו 4 סמנים שאבדו (כ./לא./כז./כו.) + זרימה מקומית עמ' 151–153.
    //     דוח: audits/FULLMATH_FLOOR_ROOT_CLOSURE_2026-11-17.md.
    // נעילות הביניים: H3 בלבד legacy-5f0dc · F-BL2 בלבד legacy-1457d ·
    // D-98 (25.11): ה-validator מצא שהמסמך הקבוע הישן מכיל כותרות H5/H6
    // שנסגרות בלי טקסט גוף; הוא הוחלף במסמך fixed דטרמיניסטי ותקין.
    // הנעילה הישנה legacy-0861dbeab0401cf1 נשמרת כהיסטוריה בלבד (קלט פסול).
    // המסמך התקין החדש: legacy-c05df8cf2c698e4d — נמדד ב-CI לאחר תיקון
    // מבני בלבד למחולל, בלי שינוי במנוע, בהגדרות או בקורפוס הראשי.
    assertEq(result.layoutHash, 'legacy-c05df8cf2c698e4d', 'hash של מסמך הבדיקה הקבוע התקין השתנה — שורה זזה!');
    const r2 = legacyTypeset(text, imudSettings(), {});
    assertEq(result.layoutHash, r2.layoutHash, 'דטרמיניזם — hash שונה בין הרצות');
  });

  it('hash הקורפוס האמיתי זהה לנעילה שלפני S7 (שימור מלא של כל נקודות החיתוך)', () => {
    const corpus = fs.readFileSync(path.join(REPO, '..', 'audits', 'long_test_text.txt'), 'utf8');
    const r = legacyTypeset(corpus, imudSettings(), {});
    // **S74 (בעיה 6):** נעילה מחודשת אחרי שינויי הפריסה המאושרים (כותרות 2/3
    // ברוחב 60% + החזרת כותרות-זנב אלמנות). הקודם: legacy-ae83a4e1595c9e55.
    // **D-S2H3 (תיקון שורש מאושר):** רוח תחתון של כותרת 3 שנשברת — פעם אחת אחרי השורה האחרונה בלבד
    // (pitch 34 בין-שורות; הפס האחרון 38=34+4). נעילה מחודשת מצוית: השינוי הוכח רק בעמודי כותרות-רוחב ובזרימתן
    // (92/552 עמודים; אין שינוי מספר עמודים; contentPreserved בשני המצבים). הקודם: legacy-0fad15af541707e9.
    // **H3-CSS (17.11, תיקון שורש מאושר — חוזה ה-CSS המקורי):** נעילה מחודשת
    // legacy-d81aa5→legacy-7db63 — pitch רב-שורתי 21.96 (line-height 1.22)
    // במקום 34; ריפודים 8/4/4 פעם אחת. 131 כותרות דו-שורתיות התקצרו
    // (−12.08px כ"א) ⇒ 651→649 עמודים; 219 כותרות הוקדמו, 0 אוחרו; חלוקת
    // השורות זהה לחלוטין (43,626=43,626; אפס נעלמו/נוספו); fn 20=20;
    // אלמנות כותרת 6=6 — אותו מנגנון מבני (min-2) בעמדות החדשות, 3 נפתרו
    // ו-3 נוצרו, ללא מצב כשל חדש; סף השבירה שומר על סמנטיקת S4.13/S4.24
    // (בלוק + ~שורת גוף עוקבת; הרצפה 60 שומרת את החד-שורתי ביט-מדויק).
    // דוח ההשוואה המלא: audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md.
    // הקודם: legacy-d81aa5ef4f2dffe8.
    assertEq(r.layoutHash, 'legacy-7db63d1ba49bac06', 'hash הקורפוס האמיתי השתנה — שורה זזה!');
    assert(r.contentPreserved === true, 'שימור תוכן על הקורפוס האמיתי');
  });

  it('מתיחת סוף-העמוד פועלת כברירת מחדל: עמודים מלאים מסתיימים בשתי התחתיות עד תחתית הזרימה', () => {
    // עמוד "מלא" = שתי התחתיות מעל 85% מהקיבולת; לפני S7 נצפו תחתיות
    // שונות בעד פיץ' שלם (26px) גם בעמודים מלאים.
    let fullPages = 0, bad = 0;
    for (const pg of result.pages) {
      if (!isBody2col(pg)) continue;
      const [b0, b1] = pageBottoms(pg);
      if (b0 < 870 || b1 < 870) continue; // עמוד מלא (הזרימה עד ~1022)
      fullPages++;
      if (Math.abs(b0 - b1) > 5) bad++;
    }
    assert(fullPages > 100, `צפויים מאות עמודים מלאים — התקבלו ${fullPages}`);
    assert(bad === 0, `${bad} עמודים מלאים עם תחתיות לא-שוות (המתיחה לא רצה)`);
  });

  it('מנגנון משיכת-היתום נותר כבוי כברירת מחדל (המזיז שורות בין עמודים)', () => {
    // המתג הסביבתי עדיין שולט רק ב-reclaim; ההוכחה — עצם נייטרליות ה-hash
    // (נבדק לעיל) וקיום הקבוע. כאן: הבדיקה הגרמנית שהקבוע לא הוסר.
    const src = fs.readFileSync(path.join(REPO, 'src/engine/layout/legacy-imud-flow.js'), 'utf8');
    assert(src.includes("RED_ENABLE_STRETCH_RECLAIM === '1'"), 'מתג ה-reclaim חייב להישאר opt-in');
    assert(src.includes('reclaimed = tryReclaimOrphanTail();'), 'ה-reclaim נקרא רק מאחורי המתג');
  });

  it('ledger: שאריות אמת בלבד — כל רשומת column-imbalance מכוונת לעמוד אמיתי עם סיבה', () => {
    const records = [...result.ledger.issues.values()].filter(r => r.kind === 'column-imbalance');
    assert(records.length >= 1 && records.length <= 20, `צפויות שאריות מעטות — התקבלו ${records.length}`);
    for (const rec of records) {
      assert(rec.page != null && rec.page >= 0 && rec.page < result.pages.length, `עמוד לא חוקי: ${rec.page}`);
      assert(rec.predicate_before && typeof rec.predicate_before.deltaPx === 'number', 'חסר deltaPx');
      assert(rec.predicate_before.reason, 'חסרה סיבה (reason) ברשומה');
      assert(rec.status === 'persists', 'רשומה שלא תוקנה חייבת persists');
    }
  });
});

// =====================================================================
describe('S72.2 DP — יישור תחתיות ככלל עימוד (שיפורים 3+4)', () => {
  const corpus = fs.readFileSync(path.join(REPO, '..', 'audits', 'long_test_text.txt'), 'utf8');
  const S = getDefaultSettings();
  const result = typeset(corpus, S, {});

  it('עמודים מלאים בנתיב ה-DP מיושרים: לפני S7 היה Δ=פיץ-שלם כמעט בכל עמוד מלא', () => {
    // **FX-6 (פרוסה 2):** התחתית האמיתית כוללת את פערי הבלוקים — אותה
    // גיאומטריה שמוקרנת ב-DOM/PDF ושהמנוע מיישר אליה (alignColumnBottoms
    // עם פערים קבועים). מדידה ללא הפערים הייתה מודדת תחתית מעל האמיתית.
    const colH = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
    let full2col = 0, bad = 0;
    for (const pg of result.pages) {
      if (pg.type !== 'regular' || !pg.columns || pg.columns.length !== 2) continue;
      if (!pg.columns[0].length || !pg.columns[1].length) continue;
      const h0 = colH(pg.columns[0]), h1 = colH(pg.columns[1]);
      if (Math.max(h0, h1) < 900) continue; // עמוד מלא
      full2col++;
      if (Math.abs(h0 - h1) > 5) bad++;
    }
    assert(full2col > 100, `צפויים מאות עמודים מלאים — ${full2col}`);
    // 16 עמודי ההערות עם חדירה קיימת (containment פרה-קיים, מתועד)
    // נדלגים בכוונה — נותרים אחוזים בודדים
    assert(bad / full2col < 0.08, `חלק גדול מהעמודים המלאים אינו מיושר: ${bad}/${full2col}`);
  });

  it('מקדמי המתיחה בגבולות ה-AQ המוגדרים (0.95..1.05) — בכל העמודים', () => {
    let min = 1, max = 1, n = 0;
    for (const pg of result.pages) {
      for (const col of (pg.columns || [])) {
        for (const ln of col) {
          if (ln.aqStretch != null && ln.aqStretch !== 1) {
            n++;
            min = Math.min(min, ln.aqStretch);
            max = Math.max(max, ln.aqStretch);
          }
        }
      }
    }
    assert(n > 100, `צפויות מאות שורות מתוחות — ${n}`);
    assert(min >= 0.95 - 1e-9 && max <= 1.05 + 1e-9, `מקדם מחוץ לגבולות: [${min}, ${max}]`);
  });

  it('נייטרליות: hash הקורפוס זהה לנעילה — aqStretch אינו משנה תוכן', () => {
    // ננעל מחדש 16.11 (שלב 5 פרוסה 1 — תיקוני FX במתכנן): bef8ebbed977→89108321.
    // הפער מסווג בשיטת s5-corpus-comparison: חלוקת השורות של כל הבלוקים זהה
    // לבסיס (0 redivision/0 marker/0 content-diff) — השינוי הוא אריזת עמודים
    // בלבד: קיבולת ב-yPx אמיתיים (FX-5) חיסלה עמודים ריקים-פנטום (ב-very_long:
    // 1335→1089, ‑18.5%); contentPreserved=true; aqStretch ממשיך לעבוד על הטורים
    // החדשים (הבדיקות הגיאומטריות לעיל מאמתות זאת על הפלט המעודכן).
    // **שלב 5 פרוסה 2 (FX-6):** ננעל מחדש 89108321→4a1773cc — פער הבלוקים
    // נצבר בגובה התפוס ובהקרנה (במקום שער-כניסה שנעלם): אריזת העמודים
    // בלבד השתנתה (ב-very_long: 1089→1108, +1.75%), חלוקת השורות של כל
    // הבלוקים זהה ביט-לביט לבסיס (מוכח ב-s5-corpus-comparison: 4536/4536
    // identical, 0 מכל השאר); contentPreserved=true.
    // **9b.3 (דקדוק הכותרות המלא — D-91):** ננעל מחדש 4a1773cc→0e657636 —
    // 27 שורות נוסח "מספר N"/"(מקור: …)" במסמך הבדיקה סווגו מפסקאות-גוף
    // לכותרות/ביאורי-צד; הוראות הדקדוק אינן נרנדרות כתוכן; contentPreserved=true.
    // **U-8 (20.11):** ננעל מחדש 0e657636→ad283e71 — תקציב ההערות מופחת מקיבולת
    // כל הטורים (המרזב חוצה-רוחב; R3-C2) ⇒ אריזת עמודים בלבד; בלוקים זהים
    // ביט-לביט (s5-corpus-comparison); contentPreserved=true; הקנוני נשמר.
        // **Iteration-001 (legacy parity — 22.11):** נעילה מחודשת ad283e71→24f0f5e0 —
    // פסי H3 באמצע העמוד כמו המקור (span_1col; סף max(60, גובה+22)); אריזת
    // עמודים בלבד; contentPreserved=true; ה-AQ ממשיך לעבוד (הבדיקות לעיל).
    // דוח: audits/legacy-parity-iteration/iteration-001/.
        // **נעילת iteration-001 חודשה שוב לאחר כלל פיצול-נקי בלבד בפלחי-הזנב (אין פיצול unclean — כמקור):** 24f0f5e0→0db2d2f2.
        // **RC-5a (i004, 23.11) — מילוי גרידי בגבול העמוד כמו המורשת:** נעילה מחודשת
        // 0db2d2f2→587d8978 (815 עמודים). שורש: ניקוד findSplit איזן חצי-חצי במקום
        // מילוי-הטור (מקור +16 עמודים בספר הייחוס). הוכחות סיווג (s5-corpus-comparison,
        // ירוק): very_long identical=3315/3636, redivision=321 (העמקת פיצולים),
        // marker=0, order-restore=0; contentPreserved=true; דטרמיניזם מאומת;
        // הקנוני לא השתנה (8a6b23bd, 37 עמ'). דוח: audits/legacy-parity-iteration/iteration-004/.
        // **RC-5b (i004):** נעילה מחודשת 587d8978→690421e9 (815→807 עמודים) —
        // גבול העמוד בזרימה גרידית עם minPerSide=1 (זנבות 1-2 שורות בראש העמוד
        // הבא כמו הייחוס — S4.18). contentPreserved=true; הקנוני לא השתנה
        // (8a6b23bd). דוח: audits/legacy-parity-iteration/iteration-004/.
        // **RC-5c+RC-5d (i004, 23.11 — השלמת המילוי הגרידי):** נעילה מחודשת
        // 690421e9→2b43da81 (807→785 עמודים). RC-5c: המקום הפנוי ב-findSplit
        // נספר על כל הטורים הפתוחים לזרימה (בעבר הטור האחרון בלבד — הטור
        // השני לא מולא מעולם). RC-5d: בלוק שנכנס לסך השארית זורם דרך pushLines
        // (breakPara חוצה-טורים) במקום הזזה מלאה. contentPreserved=true;
        // דטרמיניזם מאומת בהמשך; הקנוני לא השתנה (8a6b23bd).
    // **RC-F1a (i005):** נעילה מחודשת 2b43da81→d8a18ce9 — חוזה spanning אחיד
    // לפסי H3 (עוגן blockBottom+פער-בלוק; צל מיושר לטווח הפס — מבטל את
    // חפיפות הפס-בגוף ואת העמודים הכמעט-ריקים שפיצויי ההזזה הותירו).
    // contentPreserved=true; דטרמיניזם מאומת להלן; הקנוני לא השתנה (89a0eb42).
    // דוח: audits/legacy-parity-iteration/iteration-005/.
    // **Iteration-006 (G4/RC-D1, 24.11):** נעילה מחודשת d8a18ce9→4a136b4a —
    // הליווי-כותרת רואה דרך בלוקי הערת-צד (בלוק-צד שבין כותרת לפסקה ריק את
    // בדיקת הליווי ⇒ heading+1line בתחתית טור). heading+1line 1→0;
    // contentPreserved=true; הקנוני לא השתנה (89a0eb42); דטרמיניזם להלן.
    // דוח: audits/legacy-parity-iteration/iteration-006/.
    assert(result.layoutHash.startsWith('4a136b4a'), `hash הקורפוס השתנה: ${result.layoutHash.slice(0, 16)}`);
    const r2 = typeset(corpus, getDefaultSettings(), {});
    assertEq(result.layoutHash, r2.layoutHash, 'דטרמיניזם');
    // הקנוני — נעילת fdff19d8 ממקטע ב׳ (מאומת ב-s13-acceptance)
    const canon = fs.readFileSync(path.join(REPO, 'tests/fixtures/canonical_corpus.txt'), 'utf8');
    const rc = typeset(canon, getDefaultSettings(), {});
        assert(rc.layoutHash.startsWith('89a0eb42'), `hash קנוני השתנה: ${rc.layoutHash.slice(0, 16)}`); // **Iteration-005 (RC-F1a):** 8a6b23bd→89a0eb42 — חוזה spanning אחיד לפסי H3 (עוגן blockBottom+פער-בלוק; צל מיושר לטווח הפס). 37=37 עמודים; contentPreserved=true. דוח: audits/legacy-parity-iteration/iteration-005/.
  });

  it('אין גלישה חדשה: כל טור מתוח נשאר בתוך הקיבולת (בלי חדירה לאזור ההערות)', () => {
    const { colCapacityOf } = require('../../src/engine/layout/column-flow');
    const colH = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1), 0);
    let stretched = 0, overflows = 0;
    for (const pg of result.pages) {
      if (!pg.columns || pg.columns.length !== 2) continue;
      const cap = colCapacityOf(pg, { fnBudget: false });
      for (let ci = 0; ci < 2; ci++) {
        const col = pg.columns[ci];
        if (!col.length || !col.some(l => l.aqStretch != null && l.aqStretch !== 1)) continue;
        stretched++;
        const used = colH(col);
        const ceiling = pg.fnReservedHeightPx > 0 ? cap - pg.fnReservedHeightPx : cap;
        if (used > ceiling + 0.5) overflows++;
      }
    }
    assert(stretched > 100, `צפויים מאות טורים מתוחים — ${stretched}`);
    assertEq(overflows, 0, `טורים מתוחים חדרו לאזור ההערות/מעבר לקיבולת: ${overflows}`);
  });

  it('דילוג natural: עמודי סוף-פרק אינם נמתחים כשbalance-chapter-end=natural (K-4)', () => {
    // מסמך סינתטי זעיר — עמוד אחד דו-טורי עם פער בגבולות ה-AQ; המעבר
    // אמור ליישר (מקדם 300/288=1.042 ≤ 1.05)
    const mkPage = (h0, h1) => ({
      index: 0, type: 'regular', fnReservedHeightPx: 0, spanning: null,
      template: { contentBox: { height: 1027 } },
      columns: [
        Array.from({ length: 3 }, (_, i) => ({ words: ['א'], heightPx: h0 / 3, meta: { tokenId: 't' + i } })),
        Array.from({ length: 3 }, (_, i) => ({ words: ['ב'], heightPx: h1 / 3, meta: { tokenId: 't' + (3 + i) } }))
      ]
    });
    const log = { emit: () => {} };
    const base = getDefaultSettings();
    // לא natural — מיושר
    const pg1 = mkPage(300, 288);
    alignColumnBottoms([pg1], base, log);
    const colH = (c) => c.reduce((s, ln) => s + ln.heightPx * (ln.aqStretch || 1), 0);
    assert(Math.abs(colH(pg1.columns[0]) - colH(pg1.columns[1])) < 0.5, 'במצב רגיל חייב להתיישר');
    // natural — דילוג מפורש
    const pg2 = mkPage(300, 288);
    alignColumnBottoms([pg2], base, log, { skipPages: new Set([pg2]) });
    assert(pg2.columns[1].every(ln => ln.aqStretch == null || ln.aqStretch === 1), 'ב-natural אין מתיחה');
  });

  it('שיפור 4 — מקדם מדויק: autoQualityPass מגיע לתחתית בדיוק גם בטור מעורב-גבהים', () => {
    // 36 שורות גוף + 2 כותרות (גובה כפול) — הקירוב הישן (first-line) החטיא
    // ב~10px; המקדם המדויק פוגע ביעד בפיץ' אחד
    const body = 26.13, head = 52.27, cap = 1027.5;
    const mkLines = () => [
      ...Array.from({ length: 2 }, () => ({ words: ['כ'], heightPx: head, meta: { tokenId: 'h' } })),
      ...Array.from({ length: 36 }, (_, i) => ({ words: ['ג'], heightPx: body, meta: { tokenId: 'b' + i } }))
    ];
    const page = {
      index: 0, type: 'regular', fnReservedHeightPx: 0, spanning: null,
      template: { contentBox: { height: cap } },
      columns: [mkLines(), mkLines()]
    };
    const log = { emit: () => {} };
    const S = getDefaultSettings();
    S['aq-enabled'] = true;
    autoQualityPass([page], S, log);
    const colH = (c) => c.reduce((s, ln) => s + ln.heightPx * (ln.aqStretch || 1), 0);
    const used = colH(page.columns[0]);
    assert(Math.abs(used - cap) <= 1, `המתיחה החטיאה את היעד: ${used.toFixed(1)} מול ${cap}`);
    const f = page.columns[0][0].aqStretch;
    assert(Math.abs(f - cap / (2 * head + 36 * body)) < 0.001, `המקדם אינו מדויק: ${f}`);
  });
});

// =====================================================================
describe('S72.3 סדר החלה — הכלים עובדים רק במקרה הנצרץ לו ובתזמון הנכון', () => {
  it('ב-pipeline: יישור-התחתיות רץ אחרי chapter-end ולפני AQ (הזזות שורות ← מתיחה)', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/core/pipeline.js'), 'utf8');
    const iChapterEnd = src.indexOf("applyChapterEndMode(pages[pi]");
    const iAlign = src.indexOf('alignColumnBottoms(pages, settings, eventLog');
    const iAq = src.indexOf("if (settings['aq-enabled']) autoQualityPass(pages, settings, eventLog)");
    assert(iChapterEnd > 0 && iAlign > iChapterEnd && iAq > iAlign,
      `סדר שגוי: chapterEnd=${iChapterEnd}, align=${iAlign}, aq=${iAq} — נדרש chapterEnd < align < aq`);
  });

  it('במורשת: המתיחה אחרי האיזון ולפני המדידה ב-balanceAndReport (הדיווח = אמת לאחר שני הכלים)', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/layout/legacy-imud-flow.js'), 'utf8');
    const iBalance = src.indexOf('balanceBlock(blk, availH);');
    const iAlign = src.indexOf('alignBlockBottoms(blk);');
    const iMeasure = src.indexOf('const eff = pageEffCols();');
    assert(iBalance > 0 && iAlign > iBalance && iMeasure > iAlign,
      `סדר שגוי ב-balanceAndReport: balance=${iBalance}, align=${iAlign}, measure=${iMeasure}`);
  });

  it('במורשת: מתיחת סוף-העמוד רק כשהפרק ממשיך — סוף-מקטע עובר דרך finalizeBlock (איזון+יישור)', () => {
    const src = fs.readFileSync(path.join(REPO, 'src/engine/layout/legacy-imud-flow.js'), 'utf8');
    const iGate = src.indexOf('if (!isH0 && !sectionEnded) {\n        stretchLastBlockToBottom();');
    const iSectionEnd = src.indexOf("finalizeBlock(block, null, true, false, 'section-end')");
    assert(iGate > 0, 'שער מתיחת-סוף-העמוד לא נמצא');
    assert(iSectionEnd > iGate, 'סגירת סוף-מקטע חייבת להיות אחרי השער');
    // המתיחה אינה רצה בסוף מקטע (guard !sectionEnded)
    assert(src.includes('!sectionEnded) {\n        stretchLastBlockToBottom();'), 'השער חייב לכלול !sectionEnded');
  });
});

report('s72-column-bottoms');
