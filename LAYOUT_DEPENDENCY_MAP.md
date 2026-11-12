# מפת תלויות וזמן־ריצה — Tora Book Typesetter Red

> **עדכון ביקורת:** 12.11.2026  
> **בסיס קוד שנבדק:** `main` @ `6dbe763d66fea718fb0372f58e199c1641c8e557`  
> **מסמך ביקורת מלא:** `audits/ENGINE_UNIFICATION_AUDIT_2026-11-12.md`  
> המפה משלבת את גרף ה-`require` עם תנאי הבחירה והקריאות הדינמיות. גרף imports לבדו אינו מתאר את בחירת המסלול בפועל.

## 1. מסלול כניסה והרצה

```text
browser-entry
  └─ app-shell / settings-persistence
      ├─ loadLegacyDefaults + loadFontCatalog + ensureThemeSet(40)
      ├─ applyLegacyDefaults
      ├─ restorePersistedSettings
      └─ worker-client / transport
          └─ engine-worker-main
              └─ engine/core/pipeline.typeset(text, settings)
                  ├─ תנאי IMUD: _layout-profile === "imud" && _imudRaw
                  │   └─ layout/legacy-imud-flow.legacyTypeset(...)
                  └─ אחרת: מסלול RED/DP
                      ├─ parser/dfa-lexer.lexDocument
                      ├─ parser/block-tokenizer.tokenize
                      ├─ parser/bracket-scanner.scanBrackets
                      ├─ typography/MeasureAPI + kp-linebreak
                      ├─ blocks / inline policies / protections
                      ├─ layout/dp-planner.planPages
                      ├─ balancing / retreat / side-notes / endnotes
                      └─ decorations / TOC / numbering / Page result
```

**הכרעת runtime קיימת בקוד:** `pipeline.js` בודק במפורש `settingsIn['_layout-profile'] === 'imud' && settingsIn._imudRaw`. אם התנאי מתקיים, הפונקציה חוזרת מיד מ-`legacyTypeset`; שאר הקלטים עוברים בצינור RED/DP. זו בחירה בין שני מנועים, לא רק שימוש בשני פורמטים של הגדרות.

## 2. נתיב RED/DP — פירוק שכבות

| אחריות | רכיב מוביל | צרכנים/תלויות מרכזיים | הערות |
|---|---|---|---|
| זיהוי metadata ותחילת גוף | `parser/dfa-lexer.js` | `pipeline.js` | מזהה metadata בפתיח בלבד; מזהי כותרות/הערות סיום מוגדרים ב-lexer. |
| טוקניזציה ו-AST בסיסי | `parser/block-tokenizer.js` | `pipeline.js` | משתמש ב-DFA וב-`bracket-scanner`; יוצר paragraph/heading/endnote וטקסט הערות. |
| התאמת סוגריים והערות | `parser/bracket-scanner.js` | `pipeline.js` | סורק מחסנית/טווחים, כולל מעברי פסקאות. |
| מדידה | `typography/measure-api.js` | `pipeline`, `dp-planner`, מקרני PDF | table או font-metrics לפי רישום/הגדרה; רוחבי טקסט וגובה שורה. |
| שבירת שורות | `typography/kp-linebreak.js` | `MeasureAPI.layoutLines`, `pipeline` | Knuth–Plass; החוזה הנוכחי מקבל רוחב קבוע לקריאה, ולא callback של רוחב משתנה לכל אינדקס שורה. |
| יצירת בלוקים/סגנונות | `pipeline.js` + `extensions/*` + `dropword.js` | parser, MeasureAPI, הגדרות | עיבוד כותרות, drop word, custom styles, טווחי טקסט. |
| תכנון עמוד/טור | `layout/dp-planner.js` | `page-templates`, `column-flow`, `footnote-budget`, `candidate-generator`, `retreat-loop`, `protections-matrix`, `balancing`, `ordering` | זהו ה-planner של הנתיב המודרני בלבד. |
| הערות שוליים | `layout/footnote-budget.js`, `notes/markers.js` | `dp-planner`, `pipeline`, `geometry-projector`, `dom-renderer` | מיקום/תקציב ב-DP; מקור סמכות מודרני לסמנים. |
| הערות צד | `layout/side-notes.js` | `pipeline`, `dom-renderer`, `geometry-projector` | post-placement אחרי תכנון הגוף; מעגן לפי token ומחשב cascade. |
| הערות סיום | `layout/endnote-pages.js` | `pipeline`, `geometry-projector`, `dom-renderer` | בונה עמודי endnotes מחוץ לגוף. |
| עיטורים/שערים/כותרות/TOC | `decoration/*`, `headers-builder`, `toc-builder`, `folio` | `pipeline`, מקרנים | חלק מהשלבים שאחרי/סביב תכנון העמוד. |

## 3. נתיב IMUD/legacy — נתיב runtime נפרד

| אחריות | רכיב מוביל | בעלות פנימית / תלות | כפילות או סטייה ידועה |
|---|---|---|---|
| פענוח metadata | `layout/legacy-imud-flow.js: parseMetadata/readConfig` | בתוך קובץ המנוע | אינו משתמש ב-`dfa-lexer`; סריקת metadata אינה זהה ל-DFA של הפתיח בלבד. |
| פענוח גוף/הערות | `legacy-imud-flow.js: tokenizeDoc/findNotes` | בתוך קובץ המנוע | מימוש עצמאי של סוגריים/הערות; חוזה הסריקה אינו זהה ל-`block-tokenizer + bracket-scanner`. |
| שבירת שורות | `legacy-imud-flow.js: LineBreaker` | משתמש ב-`MeasureAPI` ובמדידות עזר | מחלקת LineBreaker עצמאית; אינה `kp-linebreak`. |
| פריסת גוף/טורים/כותרות | `legacy-imud-flow.js: legacyTypeset/flowSection` | `GEO/SZ`, events, ledger, headers-builder, legacy-ornaments | planner, קיבולות, איזון, שערי הערות וייצוג עמוד נפרדים. |
| הערות שוליים/צד | `legacy-imud-flow.js` | תורי הערות, מספור ומדיניות מקומיים | אינו משתמש באותו planner/footnote-budget של DP; יש מנגנון `fnQueue`, המשכים ו-`marginNotes` משלו. |
| גאומטריה | `legacy-imud-flow.js: GEO/SZ` | נקראת גם ברנדר/מקרן legacy | קבועים ומידות נפרדים מה-`page-templates` של RED. |
| תוצאה | אובייקט עמוד `legacy` | כולל bands/gateLines/columns/footnotes/marginNotes/toc | חוזה תוצאה שונה ממודל העמוד של DP. |

הקובץ `legacy-imud-flow.js` ארוך (כ-203KB בבסיס שנבדק) ומכיל parser, LineBreaker, planner, הערות, איזון, TOC וגאומטריה בקובץ אחד. עצם גודלו אינו סיבה למזג או להסיר: נדרש תחילה למפות ולשמר רק סמנטיקה מאושרת, לא את כל החלטות המימוש ההיסטוריות.

## 4. הסתעפות הפלט — DOM, HTML ו-PDF

```text
typeset(...)
  ├─ result.legacyProfile
  │   ├─ DOM: dom-renderer.renderPage → renderLegacyPage
  │   └─ PDF: export-api → legacy-projector.projectLegacyDocument
  └─ result DP
      ├─ DOM: dom-renderer.renderPage (מודל template/columns)
      └─ PDF: export-api → geometry-projector.projectDocument

HTML export → dom-renderer.renderPage לכל עמוד → buildStandaloneHtml
PDF export → typeset → projector לפי סוג result → pdf-writer
```

- `dom-renderer.js` בודק `page.legacy`; אם אמת, הוא מפעיל `renderLegacyPage`. לכן גם HTML/live DOM אינם מקרינים מבנה עמוד יחיד.
- `export-api.js` בודק `result.legacyProfile`; הוא בוחר `legacy-projector` או `geometry-projector`. שני המקרנים מזינים בהמשך את אותו `pdf-writer`, אך אינם מקרינים אותו Page Model.
- `legacy-projector.js` תלוי ישירות ב-`legacy-imud-flow.js` עבור `GEO/SZ` ופעולות טיפוגרפיות. `geometry-projector.js` תלוי במודל ה-DP, בתקציבי ההערות וב-`side-notes`.
- `geometry-projector.js` מייבא את `dom-renderer.js` עבור `scrubPUAText`; זו תלות בין שכבות output שניתן לבודד בעת תכנון API משותף.
- `pdf-writer.js` הוא רכיב כתיבה משותף, אך הוא אינו מאחד את חישוב הגאומטריה שקודם לו.

## 5. משותף בפועל לעומת כפול בפועל

**משותף במידה מסוימת**
- `MeasureAPI` / `font-metrics` משמשים בשני הנתיבים, אך תכנון השורות שונה.
- `events` ו-`ledger` זמינים לשני הנתיבים.
- חלק מרכיבי הקישוט/הכותרות/הגופנים משותפים או נצרכים משניהם.
- `pdf-writer` משותף לאחר שלב ההקרנה.

**כפול או מפוצל**
- parser/tokenization וחשבונאות מקור.
- LineBreaker/אלגוריתם שבירת שורות.
- page planner, בחירת טור, split/fit, קיבולות ואיזון.
- מודל הערות השוליים והערות הצד.
- מודל גאומטריית עמוד ותוצאת engine.
- DOM renderer ו-PDF projector.
- הגדרות: פרופיל IMUD גולמי ו-RED registry אינם עדיין `LayoutProfile` מנורמל אחד.

## 6. שרשרת הגדרות — קדימות שדורשת תיקון

האתחול הנצפה ב-`browser-entry.js` הוא:
1. טעינת קטלוג גופנים וברירות המחדל ההיסטוריות של IMUD.
2. טעינת ערכת עיצוב 40 והעברת הפניות הנכסים.
3. `app.applyLegacyDefaults(imported)`; בתוך `app-shell.js` הערכים המיובאים מוזגים אל `settings` באמצעות `Object.assign`.
4. `restorePersistedSettings()` מחזיר לאחר מכן את ההפרש השמור של המשתמש.

לכן בחירות משתמש שמורות שורדות, אך ערכי IMUD מיובאים עשויים לדרוס ברירות מחדל חדשות של RED לפני העימוד. ההכרעות D-107 מחייבות סדר קדימות עתידי: **העדפת משתמש שמורה > ברירת מחדל מאושרת של RED/D-107 > ערך מקור IMUD ישן**. אין לפגוע באתחול האוטומטי של ערכת 40 ושלושת השערים המקוריים.

## 7. תקלות/סיכונים שנמצאו בבסיס שנבדק

- **S72 — פתוח:** ב-DP תקציב ההערות נכלל ב-`usedHeight` רק עבור הטור האחרון, בעוד אזור ההערות מוצג לרוחב העמוד; נרשמה חדירה של הטור הראשון לאזור זה ב-16 עמודים (עד 202px). ראה `ISSUE_REGISTRY.md`.
- **אודיט 12.11 — פתוח לאבחון:** `layout-audit` מצא שתי חפיפות הערות צד בעמוד 107 (8px ו-2px). `placeSideNotes` מבטיח cascade לפי `heightPx`/estimate, ואילו DOM מחשב גובה בפועל באמצעות CSS; יש לאמת את גובה ה-DOM מול אומדן ההצבה, לרבות font/line-height ו-`max-height:60%`. אין עדיין הוכחת שורש.
- **אודיט הערות — פתוח לאבחון:** התאמת הסמנים באודיט מושווית לפי מחרוזת סמן מצטברת, ולא לפי זהות מקור/עוגן. נמצאו פערים `יז.` (3 בגוף מול 2 פתיחות) ו-`כג.` (1 מול 0); מקור הקורפוס מכיל הערות רלוונטיות, אך יש להפריד בין חזרה חוקית של פסקה חוצת-עמודים לבין אובדן הערה. אין לסגור את ההתראה כ-false-positive לפני בדיקת occurrence/token identity.
- **רצפת שימור תוכן — כשל CI:** 353,687 מילות גוף מרונדרות לעומת רצפה 355,967 (98% מ-363,232 מילות fixture). אין להחליש את הרצפה כדי להשיג CI ירוק; יש לאתר את הפער במקור/AST/מודל/DOM.
- **מגבלת KP:** `kp-linebreak.breakLines` מקבל `maxWidthPx` קבוע. D-107/S14 דורשים תמיכה מפורשת באילוצי רוחב תלויי שורה (חלון/Drop) ויחידות inline; אין להניח שהחוזה הנוכחי כבר מכסה זאת.

## 8. גבולות הביקורת

- זו מפת baseline של `main @ 6dbe763d`; יש לעדכן אותה אחרי שינויים בקוד או לאחר יצירת ממשקי engine חדשים.
- המפה מתארת קוד וקריאות שנצפו. היא אינה הוכחת תקינות, אינה מסמך סמנטיקה מלא ואינה מאשרת למחוק קוד legacy.
- אין כאן שימוש ב-P6/P7 ואין השוואת parity ל-PDF הייחוס. יש להפריד בין סמנטיקה תקינה של IMUD לבין כיולים/באגי legacy.
- לפני מימוש יש להשלים את תנאי S14.0: חוזה מקור/AST, הגדרות מנורמלות, planner יחיד, Page Model יחיד ומקרני פלט משותפים.
