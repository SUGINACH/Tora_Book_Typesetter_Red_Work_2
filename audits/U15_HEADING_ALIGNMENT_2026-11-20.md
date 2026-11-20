# ביקורת U-15 — יישור כותרות ב-PageModel

**תאריך:** 20.11.2026  
**מאגר:** SUGINACH/Tora_Book_Typesetter_Red_Work_2  
**ענף:** engine/legacy-parity-preview-20261119  
**נקודת ביקורת מקורית:** 87355c9c3f5fa69b084ee9d9d7bcb288ec801df8  
**תיקון מנוע:** c45467a6f7184aaba01ba3bf77a9449b8beddadd  
**מצב בדיקת CI מלאה:** feb15f60a42ff525e1785f7aea91fbd12cda7831

## 1. החלטה

U-15 היה **כשל אמיתי בחוזה היישור**, ולא false positive. כל 28 הממצאים המקוריים היו שורות כותרת סמנטיות מסוג .line--heading. הם לא היו שורות TOC.

פילוח הממצאים המקורי:

| סוג עמוד | מספר שורות |
|---|---:|
| sign-open | 22 |
| preface | 5 |
| regular | 1 |
| **סה"כ** | **28** |

מכאן שהניסוח הקודם ב-ISSUE_REGISTRY.md שלפיו מדובר בעיקר בשורות TOC היה שגוי ותוקן.

## 2. שורש הכשל

ב-red-build/src/engine/core/materialize.js, החלטת היישור נעשתה בפונקציה lastAlignOf(ln, settings). היא החזירה justify לכל שורה שאינה אחרונה, בלי להבחין בין שורות גוף לבין שורות כותרת. זה סתר את חוזה המקרין הוותיק, שבו כותרות ממורכזות במפורש.

ההחלטה מתבצעת לפני הצבת המילים וחישוב הגאומטריה. לכן תיקון CSS בלבד היה משאיר את קואורדינטות המילים שגויות ב-PageModel וב-PDF.

## 3. תיקון

ב-commit c45467a הפונקציה הוגדרה כ-lineAlignOf():

    function lineAlignOf(ln, settings) {
      if (ln && ln.kind === 'heading') return 'center';
      if (!ln.isLast) return 'justify';
      const mode = settings['body-last-line-align'] || 'center';
      return mode === 'stretch' ? 'justify' : mode;
    }

המשמעות:
- כל שורת כותרת ממורכזת לפני הצבת המילים והגאומטריה.
- מדיניות body-last-line-align נשארת כפי שהייתה עבור שורות שאינן כותרת.
- לא נוסף CSS patch.
- לא שונה סף Full Math.
- לא סונן או הוסר אף ממצא מהאודיט.
- לא שונו expected outputs כדי לקבל ירוק.

## 4. רגרסיה

נוסף מבחן S8D-2 ב-red-build/tests/e2e/s8d-pagemodel-dom.test.js. הוא משתמש במסמך היררכי תקין H1→H2→H3→H4, עם פסקאות ממשיות בין הכותרות, וכותרת H4 ארוכה שנשברת למספר שורות.

הבדיקה קובעת במפורש body-last-line-align = right, כדי לוודא שכותרות אינן יורשות את יישור הגוף. לכל שורת H4 נבדקים:
1. PageModel.line.align === center.
2. מרכז ה-ink המחושב ממיקומי המילים מול מרכז תיבת השורה, ללא threshold חדש (נעשה שימוש ב-TOL הקיים של בדיקות S8D).
3. קיום שורה מקבילה ב-DOM לפי מזהה המודל.
4. textAlign === center והמחלקה .line--heading.

תוצאות מאומתות:
- S8D: 23/23.
- S8F PDF: 10/10.
- S10 UI: 44/44.

## 5. D-65 — תיקון נפרד שנדרש כדי להשלים CI

בדיקת D-65 נכשלה בתחילה בגלל app.bundle.js ישן, לא בגלל Worker:
- Worker: SHA-256 לפני/אחרי build נשאר 4f31d6aabe0ed20a10e439c12561b533000357a29c5c84d7622b08099b3b4096.
- App ישן לפני build: f0cdc329c5001e2d3beb6944765070a56a4a1eeba50a4aced08df182bcd035bd.
- App שנוצר מהמקור: 5afbf27e468bb75a0f1aeaf1de630a80a5a4230d47ae93319575029c6ccf9102.

ב-feb15f60 ה-App bundle המחויב הוחלף בתוצר המדויק שנוצר ב-Preview. לאחר מכן D-65 עבר: גם Worker וגם App היו זהים לפני/אחרי build. תנאי בדיקת SHA-256 לא שונו.

קוד האבחון הזמני שהוסף ל-ci.yml ול-s10-ui.test.js שימש לזיהוי מקור הכשל, והוסר לאחר שהאבחון הושלם. בדיקת D-65 המקורית נשמרה בשלמותה.

## 6. אימות CI ו-Preview

CI run 44724048284 על feb15f60 הסתיים success:
- כל 1,146 הבדיקות ב-67 קובצי סוויטה עברו ב-Node 18, 20 ו-22.
- Determinism עבר בשלוש הגרסאות.
- Cross-check עבר בשלוש הגרסאות.
- Layout Audit עבר, כולל הקורפוס הגדול (849 עמודים).
- corpus-invariants עבר.
- Preview build-and-stage עבר.

ב-Preview נבדקו hashes של index.html, app.bundle.js, engine-worker.bundle.js, default_settings.json ו-imud-fonts.json. כל חמשת הנכסים זהים בין ענף העבודה, שורש האתר ונתיב previews/engine-parity/. בנתיב ה-preview נמצאו 1,790 קובצי תוכנה ונכסים.

## 7. Full Math אחרי התיקון

| מדד | תוצאה |
|---|---:|
| עמודים | 882 |
| שורות | 44,823 |
| מילים | 354,606 |
| מילות גוף | 346,607 |
| רצפת נפח נדרשת | 345,999 |
| HEAD_JUSTIFIED | **0** |
| כותרות ממורכזות | 194 |

U-15: 28→0.

נשארו 8 ממצאים שאינם U-15:
- U-16 LAST_NOT_CENTERED: 5.
- U-17 MARKER_NOTE_MATCH: 2.
- U-9 COLUMN_BOTTOMS_BALANCE: 1.

לכן שער Full Math הכולל עדיין נכשל בכוונה עד הכרעת שלושת ה-residuals. אין לראות בסגירת U-15 אישור כללי של המנוע.

## 8. PDF וגבולות האימות

pdf-writer.js מצייר כל מילה לפי w.x ו-w.baselineY שמגיעים מה-PageModel. הוא אינו מבצע חישוב יישור נוסף. לכן תיקון ההקרנה במקור הגאומטריה חל גם על ה-PDF. S8F עבר 10/10 בדיקות ייצוא מהמודל.

לא בוצעה בפרוסה זו בדיקת GUI ידנית עצמאית או יצירת PDF ידנית מחוץ למסלול CI; אין לייחס להן הצלחה שלא נמדדה.

## 9. Git, scope והמשך

- Work HEAD בזמן אימות ה-CI: feb15f60a42ff525e1785f7aea91fbd12cda7831.
- Main נשאר: eafd27d5c8476789a52ebc1d89dc16fb920cbd9c.
- Rescue נשאר: 706b0fac2195ff2c3142abb3349623683151b9ca.
- לא בוצע merge, cutover או force-push.
- U-16, U-17 ו-U-9 נשארים פתוחים.
- Benchmark מלא לפי פרוטוקול התוכנית (§3/§9) לא בוצע; הוא יגיע אחרי הכרעת residuals, ואין להציג את מדידת MeasureAPI ההיסטורית כ-benchmark מלא.
