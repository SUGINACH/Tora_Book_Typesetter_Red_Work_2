# ביקורת ארכיטקטורה, פערי מימוש ו-CI — 12.11.2026

## היקף ומקור

הביקורת נעשתה בקריאת קוד של `SUGINACH/Tora_Book_Typesetter_Red_Work_2` ב-`main`, commit:

`6dbe763d66fea718fb0372f58e199c1641c8e557`

קובצי התשתית המרכזיים שנבדקו (SHA של blob בבסיס זה):

| קובץ | SHA |
|---|---|
| `red-build/src/engine/core/pipeline.js` | `460cea7fed5811161d78ecd8e83b716b962faaef` |
| `red-build/src/engine/layout/dp-planner.js` | `c760157d7395af80b2c1de9ff8321136412b277c` |
| `red-build/src/engine/layout/legacy-imud-flow.js` | `3a2ff919338f11ea6c4a0213111aa9bb9b8fa899` |
| `red-build/src/engine/typography/measure-api.js` | `205baa07a029e6039416358b7d29ff81cb2fd8a1` |
| `red-build/src/engine/typography/kp-linebreak.js` | `ccd09d59de0b252b9f67e8f4adacc0230a183d21` |
| `red-build/src/engine/parser/dfa-lexer.js` | `4d3e89bc327682e42df735ebbc80fd7b26597d73` |
| `red-build/src/engine/parser/block-tokenizer.js` | `42ca2f0e15cec276b739f9325e2eb0e93e61ea4b` |
| `red-build/src/engine/output/dom-renderer.js` | `7ff950bc035a89213d0aff198514574b497019f2` |
| `red-build/src/engine/output/export-api.js` | `9073cf6f2091e95c4a25fed3d41cbdf21935119b` |
| `red-build/src/engine/output/geometry-projector.js` | `eed37c2ee8518b1cea7bd6489187746a313950e0` |
| `red-build/src/engine/output/legacy-projector.js` | `bd22188a078c9b56c805ee6c195d2ff1f96e03eb` |
| `red-build/src/engine/layout/side-notes.js` | `4ddceed2d567690b302f0f46e9ae83624cb430c1` |

אין במסמך זה שינוי קוד במנוע. זוהי ביקורת מבוססת מקור; כל טענה שאינה מוכחת כאן מסומנת כפתוחה או כהשערה.

## ממצאים לפי חומרה

### A. חסם ארכיטקטוני — שני מנועי runtime

ב-`pipeline.js:typeset` קיים תנאי מפורש:
- כאשר `_layout-profile === 'imud'` וגם `_imudRaw` קיימים, מופעל `legacyTypeset` ויש `return` מוקדם.
- אחרת מופעל הנתיב המודרני: DFA → tokenizer → bracket scanner → MeasureAPI/KP → DP planner → פאסי הערות/עיטורים/TOC.

המשמעות: RED ו-IMUD אינם שני פרופילי נתונים לאותו מנוע. הם בוחרים אלגוריתמי פענוח, שבירת שורות, פריסת עמוד, גאומטריה והקרנת פלט שונים.

### B. כפילות parser וסמנטיקה

הנתיב המודרני משתמש ב:
- `dfa-lexer.js`: זיהוי metadata בפתיח בלבד;
- `block-tokenizer.js`: יצירת טוקנים וחשבונאות תוכן;
- `bracket-scanner.js`: התאמת סוגריים/הערות במבנה מחסנית.

הנתיב הישן מחזיק בתוך `legacy-imud-flow.js` את `parseMetadata`, `readConfig`, `tokenizeDoc` ו-`findNotes`. מנגנוני הפענוח אינם שקולים. אין להחליט איזה מהם "נכון" לפי גיל הקוד: יש לקבוע חוזה סמנטי מאושר, להפיק corpus tests ולחייב parser יחיד לשניהם.

### C. כפילות line breaking ויכולת חסרה

- legacy מגדיר מחלקת `LineBreaker` משלו.
- DP משתמש ב-`MeasureAPI.layoutLines` וב-`kp-linebreak.breakLines`.
- `MeasureAPI` משותף חלקית, אך האלגוריתם/חוזה שבירת השורות אינו משותף.
- KP מקבל רוחב קבוע `maxWidthPx`; אין בו כרגע callback ל-`widthAtLine(i)`. לכן אין עדיין תשתית מספקת למגבלות משתנות לפי מספר שורה כגון Drop/חלון, וגם לא למודל יחידות inline של תמונה/גופן.

### D. מודל פריסה ופלט כפולים

- `dp-planner.planPages` מייצר עמודים עם `template`, `columns`, `spanning`, `footnotes`, `sideNotes` ומאפייני תכנון DP.
- `legacyTypeset` מייצר מבנה עמוד legacy הכולל `bands`, `gateLines`, `columns`, `footnotes`, `marginNotes`, `toc` ונתוני `GEO/SZ`.
- `dom-renderer.renderPage` שולח `page.legacy` ל-`renderLegacyPage`; אחרת מרנדר את מבנה ה-DP.
- `export-api.exportPdf` בוחר `legacy-projector.projectLegacyDocument` כש-`result.legacyProfile` אמת, אחרת `geometry-projector.projectDocument`.
- שני הנתיבים חולקים את `pdf-writer`, אך לא את Page Model ולא את ההחלטה הגאומטרית שמוזנת אליו.

### E. שרשרת הגדרות וברירות מחדל — התנגשות מאומתת

`browser-entry.js` טוען את ברירות IMUD ואת קטלוג הגופנים, מפעיל `ensureThemeSet(40)`, מעביר את ההגדרות ל-`applyLegacyDefaults`, ולאחר מכן `restorePersistedSettings` מחזיר את הפרש המשתמש השמור.

`app-shell.js` ממזג את הייבוא באמצעות `Object.assign(settings, imported)`. לכן ערכי המקור גוברים באתחול על ערכי registry של RED, לפני שחזור הפרש המשתמש. זה משמר overrides שמורים, אך מפר את D-107 ביחס לברירות המחדל של מסמך חדש.

| הגדרה | ערך מאושר D-107/RED | ערך מקור IMUD נוכחי |
|---|---:|---:|
| גוף | 14pt | 12pt |
| גובה שורה | 1.4 | 1.34 |
| סף Drop | 3 שורות | 2 שורות |
| גודל מילה ראשונה | 2em | 1.5em |
| AQ אוטומטי | כבוי | פעיל |

בנוסף, `legacy-imud-flow` מחזיק מידות גוף/גובה שורה/סוגריים/חלון בקבועים משלו; לכן תיקון merge או registry בלבד לא יספיק.\n\nשני תיקוני הבדיקה החוזרת שביקש המשתמש נשמרים במפורש: **B5** — גופני H0–H7 אינם `David HB` אחיד; ברירת המחדל המיובאת היא AlphaBlack/26pt, Lia Sgula/50pt, AlphaBlack/17pt, Alpha/13.5pt, Alpha/12.5pt, AlphaLight/11.5pt, Noto Serif Hebrew/10.5pt ו-Hadassah Friedlaender/6pt (וגוף H0: Frank Ruhl Libre/11.5pt). **B8** — שני סוגי תוכן העניינים פעילים, אך רמותיהם שונות: כללי 1–6, מפורט 2–6; רמה 7 מוסתרת בשניהם, מספור שורות ומספרי עמודים מוצגים ו-inline grouping כבוי. המיפוי `legacy-settings-map.js` גוזר זאת מ-`gtoc-show` ו-`dtoc-show` (ברירות המחדל `[1..6]` ו-`[2..6]`).

**סדר קדימות נדרש:** משתמש שמור > ברירת מחדל מאושרת D-107 > ערך מקור IMUD ישן. ערכת 40 ועיצובי שלושת השערים נשארים מופעלים אוטומטית — אין להסיר או לאפס אותם.

### F. S72 — חדירת טור ראשון לאזור הערות

`ISSUE_REGISTRY.md` מתעד בעיה פתוחה בנתיב DP:
- `usedHeight(col,page)` מוסיף `fnReservedHeightPx` רק כאשר `col` הוא הטור האחרון.
- `colCapacity` נקרא עם `fnBudget:false`, בהנחה שהתקציב נרשם פעם אחת בטור האחרון.
- בפלט, אזור הערות השוליים מוקרן לרוחב מלא.
- בבדיקה תועדו 16 עמודים שבהם הטור הראשון נכנס לשטח המרזב, עד 202px.

זו אי־התאמה בין מודל הקיבולת למודל האזור הגאומטרי. היא אינה נפתרת על ידי bottom alignment, ואסור להיעלם בתוך ריפקטור כללי. צריך לתקן אותה תחת בעלות מנוע ובדיקת containment ייעודית.

### G. הערות צד — overlap בעמוד 107

אודיט הדפדפן של PR #14 מצא שתי חפיפות בעמוד 107, בעומקים 8px ו-2px. בקוד:
- `placeSideNotes` קובע `yTop` ומפעיל cascade לפי `lastBottom + STACK_GAP_PX`.
- גובה ההצבה נשען על `sn.heightPx` או `estimateSideNoteHeight`.
- `dom-renderer` יוצר `aside.side-note`, ומציב top/left/width, אך אינו מקבע בתיבה את הגובה שה-planner חישב.
- CSS של `.side-note` משתמש ב-`font-size:.75em`, `line-height:1.15`, `max-height:60%` ו-`overflow:hidden`.

לכן קיים פער חוזי: הגאומטריה של ה-cascade נשענת על אומדן, בעוד האודיט מודד תיבת DOM בפועל. יש לאסוף עבור כל הערה את `heightPx`, גובה DOM, גופן/גודל מחושבים, ולבדוק את שני הזוגות בעמוד 107. אין כרגע הוכחת שורש שמסבירה את שתי החפיפות; אין לתקן באמצעות הגדלת gap גלובלית ללא מדידה.

### H. סמני הערות — בדיקת occurrence לא מספקת ופערים מקומיים שטרם הוכרעו

בדוח `local-full-math-audit.json` בריצת PR #14:
- במצטבר לכל הספר: `יז.` מופיע 3 פעמים בגוף מול 2 פתיחות הערה; `כג.` מופיע פעם אחת בגוף וללא פתיחת הערה.
- בעמוד 571: בגוף `טז., יז.`; בפתיחות ההערה רק `טז.`.
- בעמוד 572: גוף ללא סמני הערה, אך קיים אלמנט הערה אחד ללא סמן מזוהה — ייתכן שזה continuation, אך הדוח אינו שומר את זהות ההערה/טקסט המלא ולכן אינו מוכיח לאיזו הערה הוא שייך.
- בעמוד 667: בגוף `כ., כא., כב., כג.`; בפתיחות ההערה רק `כ., כא., כב.`.
- בעמוד 668: בגוף ובהערות `כד., כה., כו.`.

**ליקוי מוכח בשיטת האודיט:** הקוד ב-`full-math-audit.js` בונה `bodyMk` ו-`fnMk` כאובייקטים שמפתחותיהם הם מחרוזת הסמן בלבד, וסוכם אותם על פני כל העמודים. הוא אינו כולל part/chapter, source token, `noteIndex`, anchor או מצב continuation. מאחר שמדיניות המספור מאפסת לפי חלק/פרק, אותו סמן עברי חוקי יכול להופיע שוב בפרקים שונים. לכן ההפרש הגלובלי 3 מול 2 אינו ראיה עצמאית לאובדן של הערה מסוימת.

עם זאת, הפערים המקומיים בעמודים 571 ו-667 מחייבים חקירה. בדיקת המקור מצאה שהערה #23 בפרק הרלוונטי קיימת ובעלת טקסט; אין להניח שלא נכתבה, אך גם אין עדיין הוכחה היכן/אם הוצגה. יש לשפר את האודיט כך שישווה `source occurrence/token + part + noteIndex` לפתיחת הערה/continuation התואמים, ויבדוק שהטקסט המלא נשמר פעם אחת לפחות. עד אז סטטוס #17 ו-#23 הוא **לא מוכרע — חשד לפער מימוש, לצד false positives אפשריים באודיט הגלובלי**. אין לסגור את שתי ההתראות כ-false positive או להציגן כאובדן תוכן מוכח.

### I. רצפת שימור תוכן — full-math נכשל

בריצת full-math על הקורפוס:
- מילות fixture: 363,232.
- מינימום נדרש: 355,967 (98%).
- מילות גוף מרונדרות: 353,687 — חסר 2,280 מהמינימום.
- 699 עמודים, 43,117 שורות, 359,593 מילים כלליות בדוח.

אין להוריד את יחס 98% או לכלול מילות TOC/שער כדי לעבור. יש לפרק את הפער לפי מקור → AST → page model → DOM, עם כללי ספירה זהים לכל שכבה.

## 3. מצב GitHub Actions — השוואת PR ל-main

נכון לביקורת:
| Workflow | PR #14 @ `fdf35a0c` | main @ `6dbe763d` |
|---|---|---|
| corpus-invariants | עבר | עבר |
| CI | נכשל ב-`layout-audit` | נכשל באותו שער |
| full-math-audit | נכשל | נכשל |

לכן הכשלים האלו קדמו לשינוי התיעוד ואינם נראים כתוצאה ממנו. אין להציג את ה-CI כירוק. סוויטות הבדיקות הרגילות עברו בריצות שנבדקו; שערי האודיט/הנפח נשארו אדומים.

## 4. סדר פעולות מומלץ — לפני S14.1–S14.7

1. להשלים חוזה סמנטי ומיפוי occurrence: metadata, H0–H7, סוגריים/הערות, endnotes, side-notes, Drop/window, סדר קריאה וחשבונאות מקור.
2. להחליט על `LayoutProfile` מנורמל ובלתי־משתנה; לקבע precedence של הגדרות; להפסיק קריאת runtime של `_imudRaw`.
3. לבנות AST עשיר אחד עם source spans/IDs לבלוקים, notes, inline fonts ו-images. content hash חייב להתחיל מהמקור הגולמי ולתעד מה סווג כתחביר.
4. להרחיב את Measure/KP לחוזה מדידה ושבירת שורות התומך ברוחב משתנה לפי שורה, גופנים inline ותמונות, ללא שובר legacy.
5. לאחד planner, תקציבים, עוגני הערות, אזורים חוצי־טורים, protections ואיזון להחלטה אטומית על עמוד.
6. להגדיר Page Model קנוני וקואורדינטות סופיות; DOM/HTML/PDF יהיו projections בלבד.
7. להוכיח source coverage, geometry, deterministic layout, zero overlap/overflow, הערות ועוגנים; להריץ את שני הקורפוסים הנפרדים.
8. רק אחרי שער S14.0 ירוק — לממש תמונות וטווחי גופן inline לפי G11–G14.

## 5. גבולות והחרגות

- אין להתחיל P6/P7; אין להם חלק בתכנית הזו.
- אין להשתמש ב-PDF הייחוס כמדד איכות או כשער קבלה. יש לשמר רק סמנטיקה והגדרות שאושרו, ולא כיולי/באגי legacy.
- אין לבצע שכתוב גדול של `legacy-imud-flow.js` לפני מיפוי סמנטי ובדיקות occurrence.
- אין לתקן CI באמצעות הורדת ספים, השתקת בדיקות או סימון שגיאות כצפויות בלי הוכחת מקור.
- לא בוצע שינוי קוד מנוע בביקורת זו; לא הורצו build/test מקומיים. נתוני CI כאן נלקחו מ-GitHub Actions ומ-artifacts של הריצות שצוינו.
