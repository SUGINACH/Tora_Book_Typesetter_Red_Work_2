# Tora Book Typesetter RED Work 2
# תכנית־על פורנזית לאימות כל המימושים, סגירת כל החובות והגעה לרמת Production

**מועד יצירת התוכנית המקורית:** 27.11.2026  
**מועד עדכון לאחר ביקורת התקדמות הסוכן:** 27.11.2026  
**מאגר:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**ענף המקור ההיסטורי:** `engine/legacy-parity-preview-20261119`  
**ענף התיקונים הנוכחי שנבדק:** `fix/pdf-header-baseline-20261127`  
**מטרת המסמך:** תכנית ביצוע אחת, מפורטת ומחייבת לבדיקת כל טענה היסטורית על מימוש או תיקון, לאימות שהקוד אכן מממש אותה במסלול המוצר, לאימות התוצאה החיה והקבצים המיוצאים, ולסגירת כל הפערים לפני הכרזה על גרסת Production.

> **מעמד המסמך:** תכנית מחקר ואימות מאוחדת. היא אינה דוח הטוען שכל סעיפי התוכנה אומתו, ואינה אישור שהמוצר מוכן לפרסום. היא מרכזת את מצב המקורות שנחקרו, את הפערים שכבר הוכחו או תועדו, ואת סדר העבודה הנדרש להכרעה אמינה. כל סטטוס היסטורי חייב להיבדק מחדש מול קוד, מסלול ריצה ותוצר עדכניים.

---

# עדכון ביקורת התקדמות הסוכן — 27.11.2026

**מעמד: ביקורת עצמאית בוצעה — Production לא אושר.**

## תמצית החלטה

נבדקו שבעת חלקי הביקורת `audits/SPLIT/1` עד `audits/SPLIT/7`, היסטוריית הקומיטים והענפים, ה-Worklog, פנקס ההחלטות, ה-PRs, הפריסה החיה והקוד הנוכחי בענף `fix/pdf-header-baseline-20261127`. כמו כן בוצעה עקיבת מקור ממוקדת בנתיבי התצוגה/ייצוא, הייבוא, הגדרות, Worker, מדידה, LineItems, PageModel ו-PDF.

**הכרעה:** הסוכן השלים את כתיבת שבעת מסמכי הביקורת, ובענף התיקונים קיימת התקדמות קוד אמיתית W-1 עד W-7. חלק מהתיקונים מחוברים למסלול המוצר ונפרסו ידנית. עם זאת, סדרת הביקורת אינה שלמה ואינה מדויקת דיה כדי לשמש אישור Production: היא כוללת מסקנות מרחיקות לכת שאינן נתמכות במלוא הראיות, ואינה משקפת את כל הפערים הארכיטקטוניים והיכולות החסרות שנמצאו בדוחות הקודמים.

**אין להכריז על Production-ready.** החסמים המרכזיים שנותרו הם אינטגרציית ShapedRun מלאה בצינור העימוד והפלט, מדיניות הערות body-first של S75, יכולות תמונה/רקע ו-DOCX, שאריות renderer/export ישנות, השלמת מחקר המקורות ההיסטוריים, אימות ידני עדכני של כל פעולות המשתמש, וכן בירור ביצועים. הוכחת S74 מאשרת תיקון רוחב מסוים לסימני ניקוד ב-PDF, אך אינה תחליף ל-shaping משותף ולמיקומי גליפים.

**הגבלות ביצוע שאינן משתנות:** לא להריץ בדיקות, npm scripts, CI, GitHub Actions או workflows; לא לכתוב או להרחיב תשתיות בדיקה; לא להפעיל סקריפטים לאימות הקוד. קריאת קוד בדיקות קיימות לצורך הבנת חוזים מותרת בלבד. אימות המוצר ייעשה דרך סקירת מקור ידנית, שימוש ידני באתר ותוצרי PDF/HTML אמיתיים.

## 0A. מצב Git, התקדמות הסוכן והפריסה — תמונת מצב מתוקנת

| רכיב | מצב שנצפה בביקורת הנוכחית | משמעות |
|---|---|---|
| `main` | HEAD `ae2346138e0cadd0338221f469a466b88206132a` | מכיל את שבעת מסמכי `audits/SPLIT`, אך אינו מכיל את תיקוני W-1–W-7 בענף התיקונים |
| ענף מנוע היסטורי | `engine/legacy-parity-preview-20261119` נשאר ענף ביניים בשושלת PR #73 | אינו היעד העדכני לביצוע התיקונים |
| ענף תיקונים | `fix/pdf-header-baseline-20261127` HEAD `7100d103f238b91b5f4fdca20ab3f269bfe33b41` | ענף ההתקדמות הנוכחי; HEAD זה הוא commit תיעוד אחרי קוד המוצר האחרון |
| קוד המוצר האחרון בענף התיקונים | `bd8fa9db` (W-7 + תיקון צבעי rect ב-DOM) | זהו ה-commit הקודִי שהפריסה החיה מצהירה עליו |
| `gh-pages` | HEAD `d46b146910a441a3be418266a5f42f0be8cd5f16` | פריסה ידנית, ללא workflow, לפי הודעת commit `[skip ci]` |
| `gh-pages/build-info.json` | `profile=unified`, branch `fix/pdf-header-baseline-20261127`, commit `bd8fa9d`, mode `manual-gh-pages-deploy-no-workflows` | זהות קוד הפריסה תואמת ל-commit המוצר האחרון בענף התיקונים; היא אינה תואמת ל-HEAD התיעודי `7100d103` — כצפוי אם האחרון תיעודי בלבד |
| `build-info.json` שבמקור `red-build/ui` | עדיין מציג branch ישן ו-`commit:null`/`builtAt:null` | placeholder/metadata מקור שאינו מקור אמת לפריסה; יש לוודא שה-build process מייצר build-info תקין בכל מועמד |
| PR #73 | פתוח, HEAD `f41082e...`, base היסטורי `main@8e5bc70`, מאות קבצים ושינויי workflows | PR זה אינו מייצג את ענף התיקונים הנוכחי; הוא stale, כולל שינויי workflow האסורים, ואין למזגו כפי שהוא |
| PR לענף `fix/pdf-header-baseline-20261127` | לא נמצא PR פעיל לענף זה | אין כרגע מסלול PR נקי שמכיל את W-1–W-7 בלבד |
| מסמכי `audits/SPLIT/1–7` | הועלו ל-main בשבעה commits ב-27.11, סביב 11:33–11:47 לפי שעון ישראל | מסמכי הביקורת נמצאים ב-main; הם אינם בהכרח נוכחים בענף התיקונים |

**הערת פרובננס:** `gh-pages/build-info.json` הצהיר `builtAt=2026-11-27T13:40:00Z`, בעוד commit ה-gh-pages שמצאנו נחתם `2026-11-27T12:04:34Z`. אין להסיק מכך לבדו שהקבצים שגויים, אך חותמות הזמן אינן מסודרות באופן כרונולוגי רגיל ויש ליישב את מקור השעון/הזמן בתיעוד build. אין להסתמך על `builtAt` לבדו; ה-SHA של bundle וה-commit המוצהר הם ראיות נפרדות.

**הוראת מיזוג:** אין למזג PR #73 ואין למזג את ענף `fix` בשלמותו אל main. ענף `fix` יורש את שושלת PR #73, לרבות שינויי workflows. לפני כל PR עתידי צריך למפות ancestry ולהרכיב שינוי קוד נקי ללא workflow/test changes, ללא מחיקת עבודה, וללא cherry-pick עיוור. אין לבצע פעולה זו במסגרת ביקורת התוכנית.

## 0B. ביקורת W-1 עד W-7 — מה אכן בוצע ומה לא

הסטטוסים בטבלה מתייחסים לבדיקת מקור ולקומיטים, לא להרצת בדיקות. כאשר Worklog מתאר בדיקה ידנית או PDF, הדבר מסומן כראיה מדווחת ולא כ-artifact שנפתח מחדש בביקורת זו.

| משימה | שינוי שנמצא | פסק ביקורת | מה מותר להסיק |
|---|---|---|---|
| W-1 — נעילת canonical מחדש | `3fc8b674` משנה artifacts וקובץ acceptance ומעביר את hash הקנוני מ-`89a0eb42` ל-`ce70ae37` בעקבות מעבר המנוע היחיד מ-37 ל-38 עמודים | `DOCUMENTED / TEST-ARTIFACT-CHANGE`; לא מאומת בבדיקת מוצר עצמאית | זהו עדכון baseline/בדיקות, לא תיקון מוצר. מאחר שהמשתמש אסר עבודה בבדיקות, אין להשתמש בו כהוכחת קבלה או להמשיך לערוך test locks |
| W-2 — הקרנה/ייצוא במסלול PageModel | `af577703`: `preview-tab.js` משתמש ב-`renderModelPage`; `app-shell.js` מפעיל `exportHtmlFromModel` ו-`exportPdfFromModel`; CSS ישן ל-`head--sep-*` הוסר; `pagemodel-dom-renderer` משתמש ב-`header-separator-line` | `SOURCE_CONNECTED` לנתיבי המוצר שנבדקו; `PARTIAL` להסרה מלאה | התצוגה והייצוא הרגילים של ה-UI עוברים דרך PageModel. עם זאת `dom-renderer.js` נשאר, `export-api.js` עדיין מייבא `renderPage` ומכיל `exportHtml`/`exportPdf` היסטוריים. אין לטעון שכל שכבת ההקרנה הישנה נמחקה |
| W-3 — D-84 וירטואליזציה ושחזור guards | `6a3cd4b1`: שינויים ב-`preview-tab`/`app-shell`/`pipeline`; שחזור קריאת `importImudSettings` בייבוא תבניות ושומר `unifiedSupport:false` שנמחקו ב-2ae45b9 | `SOURCE_CONNECTED`; קיימת ראיית Live מדווחת ב-Worklog | זהו תיקון מוצר משמעותי, ובפרט מניעת אובדן שקט של הגדרות תבנית. Worklog מדווח על בדיקת דפדפן וייצוא PDF למסמך קצר, אך ה-screenshot/PDF עצמם אינם מאוחסנים ב-Git ולא נבדקו מחדש כאן. אין להציג את תוצאת `s10-ui 45/45` כהוכחה בביקורת זו |
| W-4 — `fn-placement-mode` | `e9fa400d`: ברירת המחדל הוחלפה ל-`legacy` כדי לשקף את שער תקציב ההערות שהמנוע מפעיל בפועל; הפקד חסום בפרופיל unified | `TRUTHFUL-CONTRACT-FIX`; יכולת S75 עדיין חסרה | הסתירה בין default להתנהגות בפועל צומצמה, אך `body-first` של S75 לא מומש. זו אינה סגירת דרישת המשתמש; מצב הערות נשאר חסם מוצר עד לפורט או להכרעה מפורשת של המשתמש |
| W-5 — ניקוי import | `b3d6eae5`: sanitizer אופציונלי ב-`project-io.js` וב-`app-shell.js`; transforms לערכי legacy; `gematria→hebrew`; ניקוי 8 dispositions כפולים; תיקון הערת Sgula | `SOURCE_CONNECTED` בשני נתיבי הייבוא שזוהו; היקף כל import path עוד דורש reconciliation | הקוד מחובר לייבוא תבניות ולייבוא פרויקט. אין להסיק שכל דרך טעינת settings/style-set/template עוברת תמיד באותו sanitizer; יש למפות את כל נקודות הכניסה ידנית |
| W-6 — סנכרון החלטות ותיעוד | `d6b83801` מתקן את הערת pipeline ומסנכרן D-109–D-115 לענף המנוע; בענף `fix` מופיע גם D-116 | `SOURCE/DOCS DONE` בענף `fix`; `MAIN SYNC PARTIAL` | main עדיין חסר D-116 ב-`DECISIONS.md`, בעוד `audits/SPLIT/1` ב-main כבר מצטט אותו. זהו פער סמכותי בין המסמכים ויש לסגורו בכתיבה בלבד, בלי לשנות את החלטת המשתמש |
| W-7 — ghost-key scanner וצבעים | `b3d6eae5`: `scanners.js` מוסיף `ghostKeys`; תוקנו קריאות ghost ב-`gate-design.js` (`hdr-divider-style`) וב-`html-export.js` (`book-name`). `bd8fa9db`: תיקון סולם צבע `0..1→0..255` בשני מרנדרי DOM | שני תיקוני ghost נראים מחוברים בקוד; תיקון צבע deployed; הסורק עצמו `PARTIAL` | הסורק תופס בעיקר גישה מילולית `settings['key']`; הוא מציין מפורשות שדפוסי גישה דינמיים אינם נסרקים, ולכן אינו הוכחת שלמות לכל צרכני settings. הוא גם מחובר לבדיקת `s10-ui` — אין להרחיב או להריץ זאת תחת איסור הבדיקות |

### ראיות ידניות שהסוכן דיווח עליהן — לא אומתו מחדש עצמאית

ב-`WORKLOG.md` מתועדים ארבעה שלבים עבור W-3/W-4 (build, אתר חי, ייבוא תבנית, עימוד ו-PDF קצר), ועוד תיעוד W-5/W-7: `build-info` תואם ל-`bd8fa9d`, בחירת `header-separator-line` משנה את hdr-rule ל-gray/black/none, צבעי rect ב-DOM הותאמו לסולם PDF, ונוצר PDF בן 9 עמודים עם קו שחור במיקום `y=70.5pt` ו-0 שגיאות console. דיווחים אלה ראיות שימושיות ברמת E0/E3/E4 מדווחת. קובצי התמונה וה-PDF שאליהם ה-Worklog מפנה נמצאים בנתיב עבודה מקומי שאינו ב-Git; הם לא נפתחו מחדש בביקורת זו. לפיכך אין לסמן `ARTIFACT_VERIFIED` עצמאית על סמך ה-Worklog בלבד.

## 0C. תיקונים מחייבים לפסקי הדין שב-audits/SPLIT/1–7

1. **הטענה “אין מכשול ידוע לקידום אחרי W-1..W-6” שגויה.** היא מתעלמת מ-TYP-SHAPING-01, body-first של S75, תמונות/רקעים, DOCX, ביצועים, legacy export residue, 57 המקורות ההיסטוריים, ו-UI acceptance מלא. יש להחליף אותה ב-“בוצעו תיקונים חשובים, אך נותרו חסמי Production משמעותיים”.
2. **“17/20 נושאים היסטוריים מלאים” אינה ספירת סגירה תקפה.** בנושא #13 גופנים, מדידת hmtx/GPOS אינה שקולה ל-shaping משותף. נדרשים ShapedRun/ GID/cluster/offset לכל היעדים; לכן יש להוריד נושא זה ל-partial/open. נושאי UI, settings ו-export אינם נסגרים רק על סמך DOM shim או test artifacts.
3. **20 הנושאים אינם כל ארכיון הדרישות.** מסמך Phase1 Source Reconciliation מ-25.11 מציין ש-57 מועמדים/קובצי Library היסטוריים לא נקראו כולם שורה-שורה. נוסף על כך, D-107 מכיל דרישות מפורטות לתמונות inline, גלישת טקסט גאומטרית, טווחי גופן וסגנונות; הנושאים הללו אינם מיוצגים במטריצת 20 הנושאים באופן שמוכיח את כל מסלולי הקלט/הפלט.
4. **“0 אובדן תוכן” הוא claim מוגבל לקורפוס/commit/בדיקה שממנה נמדד.** הוא אינו מוכיח שאין אובדן תמונות DOCX, נכסי raster, custom pages או glyph placement. חילוץ Unicode נכון מ-PDF אינו הוכחת placement נכון של ניקוד.
5. **“PageModel אחד” אינו מוכיח “Glyph layout אחד”.** `pagemodel-dom-renderer.js` עדיין נותן ל-browser לבצע shaping דרך `textContent`; `pdf-writer.js` עדיין ממפה codepoints דרך `cidOf(ch)` ומוציא רצף CID, ו-`font-subset.js` בונה subset מתוך תווים ולא מתוך GIDs מעוצבים. זהו פער ארכיטקטוני מוכח.
6. **W-7 אינו scanner שלם.** הוא אינו מכסה כל צורת גישה למפתחי settings; יש להתייחס אליו כסורק static-literal מצומצם בלבד. אין להציג את קיומו כהוכחה ש-0 ghost keys בכל הקוד.
7. **W-2 אינו מחיקה מלאה של שאריות legacy.** הוא מסיר נתיבי legacy פעילים מן ה-UI ומנתב preview/export למודל, אך `dom-renderer.js` ונתיבי export ישנים נשארו במודול `export-api`. יש להשלים dependency map ולקבוע מה יוצא מה-production bundle ומה נמחק, בלי לשמר renderer ישן רק משום שבדיקות היסטוריות משתמשות בו.
8. **W-4 אינו מימוש body-first.** ברירת המחדל `legacy` היא תיאור אמיתי של מה שפועל היום. היא אינה עונה לדרישת S75 שהגוף ימלא תחילה את אזור העימוד ותקרת ההערות תהיה 50%.
9. **המספר 259/264 ברישום אינו עקבי בין חלקי הדוח.** חלק 1 מציג 264, חלק 4 מציג 259. אין לבחור מספר ללא snapshot SHA/branch וללא ספירה ידנית של ה-registry וה-bindings בקוד הנוכחי.
10. **ממצאי legacy-parity (למשל F7, פער paragraph-gap) אינם יעד תיקון אוטומטי.** D-100 ביטל התאמה ל-PDF הישן ולמדדי P6/P7. ממצא parity ישן יטופל רק אם הוכח שהוא מפר דרישת משתמש עדכנית (למשל D-107, גלישה, חפיפה, עוגן או עמוד דליל בלתי רצוי); אין לשחזר 7px/9.3pt רק כדי לחקות את legacy.
11. **נתוני בדיקות/CI מן הסדרה אינם שערי עבודה פעילים.** Worklog מתעד 28 סוויטות אדומות לאחר הכריתה, ובשלב אחר 79/107 ירוקות. תחת איסור המשתמש אין להריץ, לתקן, להרחיב או להסיק מהן readiness. יש לתעד אותן כנתוני היסטוריה בלבד ולא להכריז “all green”.

## 0D. ממצאים ארכיטקטוניים מעודכנים שאומתו ידנית בקוד

- `preview-tab.js` בענף `fix` מייבא `renderModelPage` בלבד, ו-`app-shell.js` משתמש ב-`exportHtmlFromModel`/`exportPdfFromModel`. זהו cutover מחובר למסלול ה-UI הנוכחי.
- `export-api.js` עדיין מייבא `renderPage` מ-`dom-renderer.js` ומכיל `exportHtml`/`exportPdf` היסטוריים. לכן ה-legacy projector/renderer residue לא נוקה לחלוטין ממקור/מודול הייצוא.
- `legacy-settings-map.js` נשאר כמתאם import/migration של הגדרות IMUD, לא כמנוע עימוד. אין למחוק אותו רק בגלל שמו.
- `line-items.js::buildContainerSequence` קורא `splitTextItem` לפני `boxItemFor`/`measureItem`; אין כאן shaping של הפסקה לפני פיצול מילים.
- `production-typography-runtime.js` עצמו מצהיר ש-staged runtime אינו מפעיל shaping ב-layout pipeline. Worker מאתחל אותו ומעביר `typographyRuntime` ל-`typeset`, אך `pipeline.js` אינו צורך אותו. כרגע זה runtime staged/loaded, לא שימוש production ב-HarfBuzz.
- `LineModel` ו-`PageModel` אינם מכילים כרגע רצף מוסמך של `ShapedGlyph`/GID/cluster/offset כמקור אמת לכל יעד.
- `pagemodel-dom-renderer.js::renderModelLine` מציב `span.textContent`; הדפדפן מבצע shaping מחדש. `pdf-writer.js` עובר תו-תו (`cidOf(ch)`) ו-`font-subset.js` ממפה תווים ל-GID דרך cmap. אין עדיין ציור GID/position זהה מן המודל.
- S74 מחבר `applyCombinedMarkPolicy` למסלולי `exportPdf` ול-`exportPdfFromModel`; המדיניות מאפסת `/W` של גליפי ניקוד משולב כדי להתאים את רוחב PDF ל-advance 0 שהמדידה קובעת. זהו תיקון ממוקד ורלוונטי ל-15.77pt excess width. הוא אינו מספק x/y offsets, clusters, ligature handling או ShapedRun כללי; לכן הוא אינו סוגר את TYP-SHAPING-01 ואינו מוכיח attachment חזותי מלא.

## 0E. סטטוס שערים לאחר ביקורת ההתקדמות

| תחום | סטטוס עדכני | חסם/פעולה |
|---|---|---|
| G0 — Source identity | `PARTIAL / KNOWN` | זוהו `main`, branch `fix`, engine ancestry ו-gh-pages. נדרש להסדיר PR/merge נקי ללא workflows וליישב timestamps של build-info |
| G1 — Requirement closure | `PARTIAL` | 7 split reports נקראו; 109 audit Markdown sources היו באינדקס; 57 Library sources עדיין לא הושלמו; סתירות בספירות registry וב-D116/main נותרו |
| G2 — Runtime truth | `PARTIAL, PRODUCT ROUTES UNIFIED` | ה-UI הנוכחי PageModel only; נותרו `dom-renderer`/export legacy residue במקור ובמודול export; runtime staging לא שווה shaping integration |
| G3 — Content model | `PARTIAL / NOT ALL ITEM KINDS` | לא הוכחו כל מסלולי images, DOCX media, raster, custom pages, source ranges ו-inline font runs |
| G4 — Shaping/measurement | `BLOCKED` | HarfBuzz staged, לא נצרך ב-pipeline; words split pre-shaping; PageModel אינו glyph-authoritative |
| G5 — Line breaking | `SOURCE PRESENT / NOT FULLY ACCEPTED` | יש LineItems ו-MeasureAPI, אך הם אינם צורכים ShapedRun; F7 הישן אינו יעד parity אוטומטי |
| G6 — Planner/geometry | `SOURCE REVIEW PARTIAL` | ליבת DP תועדה היטב; F-2.3 raw-capacity reachability ופערי user-facing fill/spacing דורשים הכרעה בלי parity ל-P6/P7 |
| G7 — Notes/page items | `PARTIAL` | W-4 רק אמת-חוזה; S75 body-first עדיין לא קיים; תמונות בהערות/anchors דורשות אימות |
| G8 — PageModel/rendering | `PARTIAL` | אותה PageModel ל-live/HTML/PDF בחלק מהנתיבים, אך אין glyph parity ואין GID-based rendering |
| G9 — Settings/UI | `PARTIAL` | W-3/W-5 תיקנו נתיבי import; 5+ controls חסומים/לא נתמכים כולל background triad; UI manual acceptance חלקית בלבד |
| G10 — Reliability | `PARTIAL` | hashing/worker changes קיימים; יש לאמת שימוש רציף גדול→קטן, failure/recovery בפועל; HarfBuzz staged runtime עלול להיות gate ללא שימוש |
| G11 — Cutover | `PARTIAL` | מנוע `legacy-imud-flow` הוסר מהענף; old DOM/export functions נשארו; PR #73 לא ניתן למיזוג כפי שהוא |
| G12 — Deployment | `PARTIAL / DEPLOYED CODE SHA` | Pages מצביע ל-`bd8fa9d`; מקור `ui/build-info.json` placeholder; צריך להשלים provenance של כל assets/fonts/cache ולסדר promotion ל-main |
| G13 — Release acceptance | `NOT ACCEPTED` | אין קבלה סופית של המשתמש; נדרש manual browser acceptance מלא ו-PDF/HTML artifact review על build עדכני |

---

# חלק א — עקרונות, מצב אמת ומסקנות המחקר

## 1. מטרת־העל והגדרת Production

המטרה אינה להשיג דוח ירוק, לאחד שמות קבצים או להראות שמודול חדש קיים. המטרה היא תוכנת עימוד אחת, יציבה ודטרמיניסטית, שבה כל פעולת משתמש וכל סוג תוכן עוברים דרך מסלול מוצר אחד, כל החלטה טיפוגרפית וגאומטרית מתקבלת פעם אחת, וכל יעד פלט מציג את אותה תוצאה.

**הגדרת הצלחה:** המשתמש פותח את האתר, טוען מסמך רגיל או גדול, משנה הגדרות, מעמד, רואה את העימוד, מנווט בין העורך לתצוגה, שומר/מייבא פרויקט, מייצא HTML עצמאי ו-PDF — ובכל השלבים נשמרים התוכן, הסדר, הגופנים, הסימנים, העוגנים והגאומטריה. התוכנה מתאוששת מכשל, אינה משאירה Worker או state פגום, אינה מפילה מסמך גדול, ואינה משתמשת במנוע מורשת או ב-fallback סמוי.

Production כולל את כל אלה:

1. **נכונות תוכן:** אין השמטה, כפילות, שינוי סדר, שינוי תו, אובדן ניקוד/טעמים, אובדן עוגן או אובדן נכס.
2. **נכונות טיפוגרפית:** אותיות, גליפים, סימני ניקוד, טעמים, סוגריים, גרשיים, RTL, ligatures, mark positioning, baseline ו-advances מוצגים בצורה עקבית.
3. **נכונות עימוד:** שבירת שורות, חלוקת טורים, איזון, כותרות, הערות, שערים, עיטורים, TOC, מספור וריהוט עמוד נעשים באמצעות Planner אחד ומדיניות מוגדרת.
4. **מקור סמכות יחיד:** DocumentModel, מדידה, LineModel, Planner, PageModel והקרנות אינם ממציאים כל אחד החלטה משלו.
5. **שקיפות:** אפשר לעקוב אחר נתון מן המקור ועד לתוצאה ולזהות את הפונקציה שמכריעה בו.
6. **עמידות:** מסמכים ארוכים, ייבוא, ייצוא, קובץ פגום, משאב חסר, ביטול, כשל Worker וריצה חוזרת אינם משאירים את המערכת במצב לא תקין.
7. **שלמות המוצר:** כל כפתור/פקד/הגדרה שהממשק מציג אכן מחוברים ומתנהגים לפי ההגדרה.
8. **פרסום אמין:** build, worker, assets, fonts, CSS ו-build-info שייכים לאותו commit, והאתר החי מציג את הגרסה שאושרה.

## 2. כללי עבודה מחייבים — גוברים על מסמכים ישנים

ההוראות הבאות הן תנאי עבודה ואינן ניתנות לביטול על ידי תוכנית היסטורית, דוח, workflow או הצעת AI:

### 2.1 מה לא לבצע

- לא להפעיל GitHub Actions, CI, workflows או כל מסלול אוטומטי דומה.
- לא להריץ `npm test`, בדיקות יחידה, בדיקות אינטגרציה, E2E, בדיקות דפדפן אוטומטיות, full-math audit, layout audit, determinism sweep, coverage, benchmark או סקריפט שבודק את התוכנה.
- לא לכתוב בדיקות חדשות, תשתיות בדיקה, workflows, runners או harnesses.
- לא לנטר ריצות קודמות ולא להקדיש את העבודה לאיסוף סטטוסים של workflows.
- לא להוסיף מנוע חדש, מסלול עימוד חלופי, adapter שהופך למקור אמת שני, שכבת פיצוי, CSS workaround או fallback למנוע הישן.
- לא למחוק קוד מורשת לפני שהוכח שכל ההתנהגות הנדרשת הועברה ושאף מסלול מוצר אינו צורך אותו.
- לא לבצע force-push, לא למחוק ענפים/commits, ולא לדרוס עבודה קיימת.
- לא לשנות ברירות מחדל או הגדרות משתמש רק כדי להתאים לתוצאה שרירותית.
- לא להחזיר את P6/P7 לשום מסלול עימוד, התאמת שורות או מדדי קבלה.
- לא להשתמש ב-PDF הייחוס הישן כיעד איכות כללי. D-100 ביטל התאמה זו. יש לשמר רק התנהגויות והגדרות משתמש שאושרו במפורש, ולא להעתיק את כל הפלט הישן כמודל חזותי.

### 2.2 מה כן לבצע

- סקירה ידנית מלאה של קוד המקור, מודולים, callers, consumers, ממשקים, חוזים, זרימת נתונים, history ו-root causes.
- קריאת קוד בדיקות קיים מותרת לצורך הבנת חוזים והיסטוריה; אין להריץ אותו ואין לכתוב חדש.
- בנייה ידנית של גרסת מועמד לצורך שימוש אמיתי בלבד.
- בדיקה ידנית בדפדפן של האתר החי או סביבת מועמד: טעינת מסמך, הגדרות, עימוד, תצוגה, ניווט, ייבוא וייצוא.
- בדיקת תוצרי HTML ו-PDF אמיתיים. PDF ייבדק באמצעות ספריות Python לניתוח תוכן, גופנים, מיקומים, גבולות, תמונות ועמודים, ללא VLM וללא OCR.
- תיקוני קוד ממוקדים, commit ברור ופריסה ידנית רק אם קיים נתיב פריסה שאינו מפעיל workflow. אם אין דרך לפרוס בלי workflow, לא מפעילים workflow: מתעדים חסם פריסה ומכינים מועמד בלי לטעון שהאתר עודכן.

## 3. משמעת ראיות: מתי מותר לסמן פעולה כבוצעה

המחקר בפרויקט מכיל הרבה טענות כגון “הושלם”, “עבר”, “0 ממצאים”, “הוכח” ו-“תואם”. אין להשתמש במילים האלה כתחליף לראיות עדכניות. לכל יכולת או תיקון יש לקבוע את רמת הראיה הבאה:

| רמה | סוג ראיה | מה היא מוכיחה | מה היא אינה מוכיחה |
|---|---|---|---|
| E0 | טענה היסטורית בדוח/Worklog/PR | שמישהו דיווח שביצע פעולה | שהקוד עדיין קיים או שהפעולה נכונה |
| E1 | קוד קיים ב-HEAD הנוכחי | שיש מימוש בקובץ | שהמימוש נקרא במסלול המוצר |
| E2 | עקיבת מקור ידנית | שכל נקודות הכניסה, callers, consumers והנתונים מחוברים | שהתוצאה בדפדפן ובקובץ נכונה |
| E3 | שימוש ידני בתוכנה החיה | שהפעולה פועלת בסביבת היעד המסוימת | שכל התוצרים והקצוות תקינים |
| E4 | בדיקת artifact אמיתי | שה-HTML/PDF שנוצר מכיל את התוכן והגאומטריה הנדרשים | שהמשתמש מרוצה מכל היבטי המוצר |
| E5 | קבלת משתמש | שהמוצר אושר מבחינת התוצאה וההתנהגות | שאפשר להתעלם מתקלות או מגבלות שלא הוצהרו |

**סטטוסים מותרים ברישום ההשלמה:** `CLAIM_ONLY`, `SOURCE_PRESENT`, `SOURCE_CONNECTED`, `LIVE_NOT_CHECKED`, `ARTIFACT_NOT_CHECKED`, `MANUAL_VERIFIED`, `ARTIFACT_VERIFIED`, `USER_ACCEPTED`, `BLOCKED`, `STALE`, `CONFLICTED`, `NOT_IN_SCOPE`.

אין לסמן `USER_ACCEPTED` בלי קבלה מפורשת. אין לסמן `ARTIFACT_VERIFIED` על סמך עצם קיום קובץ. אין לסמן `SOURCE_CONNECTED` על סמך import בלבד: יש לעקוב מהכניסה עד הפלט ולוודא שהפלט צורך את המידע.

לכל טענה יירשמו: מזהה דרישה, קובץ המקור של הטענה, commit שבו נטען שבוצעה, commit נוכחי, קובצי קוד, פונקציית יצירה, פונקציות ביניים, consumers, נתיב UI/Worker/export, מצב live, קובץ artifact, ממצא, תיקון נדרש, תלות, רמת ראיה ותאריך.

## 4. תמונת מצב Git והפריסה — גרסה מעודכנת לאחר ביקורת הסוכן

| רכיב | מצב שנצפה | משמעות תפעולית |
|---|---|---|
| `main` | `ae2346138e0cadd0338221f469a466b88206132a` | מכיל את מסמכי הביקורת SPLIT/1–7; אינו מכיל את קוד W-1–W-7 |
| ענף המנוע ההיסטורי | `engine/legacy-parity-preview-20261119` — נקודת בסיס PR #73 סביב `f41082e` | ancestry של עבודת האיחוד והסרת מנוע legacy; לא יעד ההמשך המועדף |
| ענף התיקונים | `fix/pdf-header-baseline-20261127` HEAD `7100d103f238b91b5f4fdca20ab3f269bfe33b41` | ענף ההתקדמות בפועל; HEAD האחרון הוא תיעוד לאחר קוד המוצר |
| קוד המוצר האחרון בענף התיקונים | `bd8fa9db` | כולל W-5/W-7 ותיקון rect-color ב-DOM |
| `gh-pages` | HEAD `d46b146910a441a3be418266a5f42f0be8cd5f16` | פריסה ידנית, לא workflow |
| `gh-pages/build-info.json` | `profile=unified`, `branch=fix/pdf-header-baseline-20261127`, `commit=bd8fa9d`, `mode=manual-gh-pages-deploy-no-workflows` | מזהה את קוד המוצר החי עם ה-commit האחרון בענף התיקונים |
| PR #73 | פתוח, HEAD `f41082e...`; base היסטורי `8e5bc70`; מאות קבצים ושינויי workflows | stale ואינו כולל את W-1–W-7; אסור למזג כפי שהוא |
| PR לענף fix | לא נמצא | אין כרגע PR נקי לתיקונים המאוחרים |
| `red-build/ui/build-info.json` | placeholder עם commit/build time null וענף ישן | לא להשתמש בו כראיית פריסה; יש לוודא שה-build הידני מייצר provenance תקין |

הנתונים לעיל גוברים על snapshot ה-Git שבטיוטה המקורית. אין לערבב את `main`, ענף המנוע, ענף fix ו-gh-pages כאילו הם אותו מצב. אין merge/cherry-pick במסגרת תוכנית זו לפני מיפוי ancestry ו-filter של כל workflows/test changes.

## 5. היררכיית המקורות והכרעה בין מסמכים

1. הוראות משתמש מפורשות ועדכניות גוברות על מסמכים ישנים, תוצאות AI או קוד היסטורי.
2. `DECISIONS.md` הוא פנקס ההחלטות. D-112–D-115 קיימות ב-main ובענף התיקונים; D-116 (הוראת המשתמש מ-27.11 שכותרת עליונה תהיה מעל הקו) קיימת בענף `fix` אך חסרה ב-`DECISIONS.md` של main, אף ש-`audits/SPLIT/1` ב-main מצטט אותה. זהו פער תיעודי שיש לסנכרן; אין לשנות את החלטת המשתמש.
3. `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` הוא בסיס ארכיטקטוני וסדר שלבים; שערי CI/tests שבו אינם תקפים לביצוע הנוכחי משום שהם סותרים את הוראות המשתמש.
4. `spec/03_UNIFIED_ITEM_CONTRACT.md` אושר בהחלטה D-114 והוא חוזה מחייב.
5. `Software_Requirements_Specification.md`, `ENGINE_CONTRACT_9C3.md`, `CANONICAL_DOCUMENT_MODEL.md`, `USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md`, סיכום בקשות מ-AI והיסטוריית שיחות הם מקורות דרישה בכפוף להחלטות המאוחרות.
6. תוכניות `02_MASTER_WORK_PLAN.md`, `תכנית לשיפור...`, `תוכנית הפעלה לחמשת הסוכנים` ומחזורים ישנים ב-`AGENTS_TRACKING.md` הם מקורות היסטוריים; אין להפעיל את סדרי העבודה הישנים.
7. `WORKLOG.md`, `ISSUE_REGISTRY.md`, `audits/IMPLEMENTATION_STATUS.md`, דוחות Stage 1–9, Iteration 001–007 ו-`audits/SPLIT/1–7` הם מקורות לטענות ולראיות קודמות; ה-SPLIT reports נכתבו על snapshot `197225d` ואינם משקפים את כל תיקוני W-1–W-7 המאוחרים. סטטוסיהם אינם current truth עד שייבדקו שוב.
8. אין לחזור ולבצע דרישה שכבר בוטלה, ואין להתייחס להצעת AI כאל החלטת משתמש.

## 6. החלטות משתמש והגבלות שכבר הוכרעו

- **D-100:** ה-PDF ההיסטורי אינו target visual parity. אין להחזיר התאמה אליו כמדד איכות.
- **P6/P7:** מחוץ לתחום לחלוטין, ובפרט לא להתאמת שורות/מילים.
- **D-107:** ברירות המחדל והיכולות שהמשתמש אישר לשמר (כולל Kit 40 ועיצובי שערים) נשארות בתוקף; אין לשנותן ללא החלטה.
- **D-108:** מספור folio ועמודוני TOC בגימטריה ללא גרש/גרשיים; סמני הערות הם מערכת נפרדת.
- **D-116 (הוראת משתמש מפורשת מ-27.11):** הכותרת העליונה בכל עמודי התוכן חייבת להיות **מעל** קו המפריד. `GEO.HEADER_BASELINE=71.9px`; קו `hdr-rule` ב-`y=82.67px`. התיקון צריך להיות ב-DOM אם DOM ו-PDF חלוקים; אין להוריד את ה-PDF מתחת לקו כדי להתאים ל-DOM. זו הכרעת משתמש מפורשת, לא מסקנה עצמאית מה-PDF הישן.
- **D-112:** התנהגות המוצר בפועל היא בסיס התאימות; registry הוא fallback בלבד; נדרש Resolver יחיד; אין לשנות ערכי משתמש או מזהים בעת מעבר.
- **D-113:** זהות מלאה Node↔Browser לאותו קלט, הגדרות, נכסים, גופנים וגרסת מנוע; אין OS font fallback סמוי; גופן/נכס חסר מחייב אבחון מפורש.
- **D-114:** חוזה הפריט האחיד אושר ומחייב.
- **D-115:** תיקון כפילות שורת D-101 הוא תיעודי; D-106 נשארת ההחלטה המהותית, בכפיפות ל-D-107.
- **D-98:** `very_long_test_text.txt` הוא מסמך הבדיקה הארוך הראשי. מסמכי בדיקה סינתטיים הם משלימים בלבד וחייבים להיות תקינים מבנית.
- מסמכים תקינים: אין שתי כותרות רצופות מאותה רמה ללא טקסט; אין כותרת שמכילה הערה בלבד; כותרת סופית חייבת להכיל טקסט ממשי.
- התמונות inline לפי תחביר שאושר, בנפרד מתמונות DOCX; התמונות הנתמכות והתחולה המדויקת לפי D-107/החלטות מאוחרות. אין לטעון לתמיכה בתמונות DOCX רק משום שיש תמיכה ב-inline image.
- גופני הכותרות המאושרים לפי D-107 כוללים H0 AlphaBlack 26pt, H1 Lia Sgula 50pt, H2 AlphaBlack 17pt, H3 Alpha 13.5pt, H4 Alpha 12.5pt, H5 AlphaLight 11.5pt, H6 Noto Serif Hebrew 10.5pt, H7 Hadassah Friedlaender 6pt; אין לחתוך H1 ל-48pt בשל גבול פקד ישן.

## 7. ממצאי מחקר מרכזיים — מה התיעוד כבר אומר

### 7.1 איחוד המנוע עדיין אינו מוכח עד הסוף

דוחות Stage 1 תיארו שני מנועים שלמים: `legacy-imud-flow.js` כמנוע מונוליתי עם tokenizer, breaker, flow, הערות, TOC ושערים משלו, ו-DP unified דרך `core/pipeline.js`, `kp-linebreak.js`, `dp-planner.js` ו-PageModel. דוחות Stage 8/9 וה-branch המאוחר מתארים מעבר הדרגתי והסרת dispatch. PR #73 מנסה לסיים את ההסרה, אך אינו ממוזג, diverged משמעותית, ובתוכו שינויים אסורים ב-workflows. לכן המצב העדכני מחייב עקיבת מקור מחדש ולא הצהרה שה-cutover הסתיים.

### 7.2 PageModel אחד אינו מבטיח glyph geometry אחת

דוחות 24–25.11 מראים שה-PageModel שמר מיקומים/מילים, אבל לא sequence מוסמך של glyph IDs, clusters, advances ו-offsets. DOM/HTML מסרו Unicode spans לדפדפן, ו-PDF עבד עם character→CID ו-raw hmtx. לכן שתי הקרנות יכולות להתחיל מאותו PageModel ועדיין לצייר גליפים אחרת. ב-`שְׁמַע` ב-FrankReal נמדד פער 15.77499390pt בין HTML ל-PDF; ה-PDF שמר את הטקסט בחילוץ אך מיקם את סימני הניקוד לא נכון. זו תקלה טיפוגרפית מהותית, לא פער MediaBox או bleed.

### 7.3 HarfBuzz/ICU4X: הוכחת Probe חזקה אך לא אינטגרציית Production

דוח Phase 2 מ-25.11 מוסיף ראיה חשובה מעבר ל-POC הכללי: המילה המדויקת `שְׁמַע` עברה ב-Node דרך `FontResolver → TextItemShapingPlan → HarfBuzzShaper → ShapedRun`, ותוצאת ה-adapter התאימה ל-HarfBuzz לכל GID, cluster, x/y advance ו-x/y offset; records הוקפאו. ב-classic Worker עברו 16 font instances ו-659 glyph records, אך אותה מילה בת שישה codepoints לא הורצה כדוגמה נפרדת ב-Worker. ארבעה WOFF2 raw files לא נקראו ישירות; הם נורמלו ל-SFNT באמצעות fontTools/Brotli מחוץ למסלול Production.

הדוח אומר במפורש ש-Production pipeline עדיין אינו צורך `env.typographyRuntime`; `line-items.js` עדיין מפצל TextItem למילים לפני shaping; LineModel/PageModel אינם נושאים GID/cluster/advances/offsets; DOM/HTML עדיין מוסרים Unicode לדפדפן; ו-PDF עדיין משתמש ב-per-codepoint CID ו-raw hmtx. לפיכך יש adapter/POC מאומת ב-Node, אך אין עדיין Production Shaping. עדיין חסרים shaping לפני word split, reshape בגבולות שורה (BOT/EOT), L3/L4, font fallback לפי grapheme, GID-based DOM/HTML, GID-based PDF subset ו-ToUnicode/ActualText, Quadratic glyf bounds, נרמול WOFF2 ב-Worker או דחייתו במפורש, וחוזה async Worker. `TYP-SHAPING-01` נשאר פתוח.

### 7.4 פונטים: המרת CFF אינה מאושרת להפצה המונית

ממצאי CFF מציגים 380/380 assets שעברו בדיקות מבניות/ריצה במסגרת stress proof, אך 47 פונטים נשארו עם outliers גאומטריים ו-46 עם דגימות glyph/LSB שהצריכו review; רק glyph נציג אחד לכל flagged font נרונדר בחלק מהשלבים. בדוח נשאר `manualReviewRequired=true` ו-`massConversionApproved=false`. אין להפעיל המרה גורפת או להכניס את התוצרים לקטלוג הפעיל לפני החלטה והוכחת renderer fidelity לכל תחום התמיכה. Raw WOFF2 אינו נתמך ישירות על ידי HarfBuzzJS ב-POC; חלק מהקלטים נורמלו ל-SFNT.

### 7.5 בעיות מוצר נוספות שדוחות המקור מזהירים מפניהן

- `docx-import.js` מתואר כקורא בעיקר `w:p`, `w:pStyle`, `w:t`, `w:footnoteReference`; `w:drawing`, `w:pict`, relationships ו-`word/media/*` אינם מעובדים בדוח Stage 1. משמעות הדבר היא אובדן תמונות DOCX שקט אם המוצר טוען לתמיכה בהן.
- מיפוי נכסי תמונה הראה פער בין SVG לרסטר: מסלול Worker רשם בעיקר SVG; ממדי PNG/JPEG לא תמיד נקראו מה-bytes; PDF writer לא צייר raster/custom-page content בחלק מנתיבי ההקרנה ההיסטוריים, בעוד DOM/HTML כן. Stage 8 טען לתמונות first-class, לכן חובה לאמת את קוד ה-HEAD הנוכחי ולא להניח שהפער נשאר או נסגר.
- `settings` ותוויות: דוחות ישנים מצאו מאות מפתחות, עשרות סטיות בין registry ל-default_settings, מפתחות כפולים, disposition collisions, pseudo-settings ו-Text IDs שאינם רשומים במקום אחד. D-112/הדוחות מ-25.11 שינו את שכבת ברירות המחדל ואת ספירות הרישום. יש לבצע reconciliation עדכני; אין להעתיק ספירות היסטוריות.
- TOC, headers, side headings, H7, ornaments, folio, gate, notes והפרדות: יש טענות קודמות על תיקונים, אך לא הוכחה עדכנית שכל התנהגות מוצגת באתר ובייצוא.
- UI: דוח S10 היסטורי בדק DOM shim, אך מקור דרישות המשתמש מ-19.11 מתעד דיווח שהסנכרון בין העורך לתצוגה נעלם בגרסה שהמשתמש רואה. נדרשת בדיקת דפדפן חיה, לא הסתמכות על shim.
- `STAGE8_SLICE6_INVENTORY.md` טוען ש-DOM/HTML/PDF השתמשו ב-PageModel ב-profile unified, עם 359,584 מילים שוות בין HTML למודל. עם זאת, כיסוי חילוץ PDF מתואר שם רק כ-85–90%+ מן המודל בסדר RTL-visual, והמסמך עדיין משאיר ל-Stage 9 את legacyTypeset, legacy-projector, renderLegacyPage, exportHtml/exportPdf הישנים ואת renderFolio המודד. מאוחר יותר Phase1 הוכיח ש-PageModel/geometryHash parity אינו מוכיח glyph parity.
- דוח 25.11 תיאר long-document acceptance על 691 עמודים, export HTML/PDF מאותו PageModel ודטרמיניזם, אך הותיר אפס-legacy trace, UI מלא, console/network/cache audit ו-glyph parity פתוחים. אלה ראיות טובות לתרחיש מוגדר באותו commit, לא אישור של HEAD מ-27.11.
- `05_S10_CLOSURE_REPORT.md` טוען ל-208/208 בדיקות ולבקרות פעילות דרך DOM shim; הוא מציין שפתיחת קבצים/הורדות נבדקו ארכיטקטונית וב-smoke ידני, לא כקבלת UI מלאה. `02_S11_S13_COMPLETION_REPORT.md` טוען היסטורית ל-S11 50/50, S12 24/24 ו-S13 23/23, לרבות DOCX, PDF/HTML וקבלה סופית, אך אישור משתמש נותר pending. יש להצליב את שתי הטענות מול UI/Importer/Exporter ודרישות מ-25–27.11, ולא לייבא את תווית “הושלם”.
- Worklog מ-27.11 מדווח על תיקון `Invalid string length` ב-serialization גדול ועל תיקון צבע שערי SVG ב-PDF באמצעות rasterization, אבל הראיות מתוארות כ-build/sanity ולא כאימות שימוש חי ו-PDF סופי. אלה פריטים לבדיקת artifact, לא תקלות שסומנו סגורות.
- S74 מ-26.11 מתאר מדיניות PDF-mark ספציפית ל-FrankReal. גם כאן אין לסגור את הפגם רק לפי קיום patch: נדרש לבדוק את PDF בפועל, את מיקום סימני הניקוד, את רוחב המילה ואת שאין רגרסיה בגופנים אחרים. תיקון per-mark ב-PDF עשוי להיות מעבר זמני; הארכיטקטורה הנדרשת נשארת shared shaping.

### 7.6 חובות ישנות שחייבות reconciliation ולא אישור אוטומטי

F-01 עד F-18, F-BL1/F-BL2, F-J1..F-J5, F03/F05/F06/F07/F09/F10/F11/F14/F19, U-8/U-9/U-10/U-11/U-14/U-15/U-16/U-17, D1–D15, M1–M4, W1–W2, S1 ועוד מזהי ISSUE_REGISTRY. חלקם תוקנו, חלקם עודכנו, חלקם הופרכו, וחלקם שייכים למסלולי legacy. אין להכניס אותם כמטלות חדשות מבלי לזהות את הממצא הנוכחי ואת מקורו; אין למחוק אותם בלי להראות לאיזה תיקון, commit ו-runtime path הם נסגרו.

# חלק ב — שיטת החקירה והאימות המחייבת

### 7.7 התקדמות הסוכן מאז כתיבת התוכנית המקורית — W-1 עד W-7

מסמכי `audits/SPLIT/1`–`7` הושלמו והועלו ל-main, אך לאחר snapshot הביקורת שלהם נמשכה עבודת הקוד בענף `fix/pdf-header-baseline-20261127`. W-1–W-7 אינם כולם אותו סוג של סגירה: חלקם תיקוני מוצר מחוברים, חלקם שינויי תיעוד/ארטיפקטים, וחלקם נשארים חלקיים.

- **RC-HDR2 / D-116:** תיקון כותרות מעל הקו מחובר ב-`structural-stamps` וב-`pagemodel-dom-renderer`; דוח `RC_HDR2_20261127_VERIFICATION.md` מתעד 489 עמודים, 487 עמודי תוכן עם כותרות מעל הקו, ו-PDF זהה-ביטים לארטיפקט טרום-הפגם. Worklog W-3/W-4 ו-gh-pages הנוכחי ממשיכים לשאת את קוד התיקון. הקובץ המיוצא והצילום אינם מצורפים ב-Git, לכן בביקורת זו הראיות המדודות נחשבות `REPORTED_ARTIFACT_EVIDENCE`, לא פתיחה עצמאית מחדש של ה-PDF.
- **W-2:** המסלול הפעיל של preview ו-export ב-app-shell הוא PageModel. זהו תיקון אמיתי. אבל `dom-renderer.js` והפונקציות ההיסטוריות `exportHtml`/`exportPdf` עדיין קיימות במודול `export-api`. לכן ה-cutover למוצר חי בוצע, אך סילוק מוחלט של קוד projection ישן לא הושלם.
- **W-3:** תיקון הוירטואליזציה ושחזור שני guards שנמחקו ב-2ae45b9 (ייבוא IMUD לתבנית ושומר settings לא נתמכות) הם תיקוני מוצר חשובים. קיימת טענת manual live acceptance ב-Worklog. לא מסמנים בדיקות s10-ui כראיה בביקורת זו.
- **W-4:** ברירת המחדל `fn-placement-mode='legacy'` משקפת את המנגנון שפועל בפועל. זו אמת-חוזה, לא מימוש body-first. S75 עדיין פתוח והפקד חסום.
- **W-5:** sanitizer מחובר לטעינת תבנית ולייבוא פרויקט, וה-disposition מתרגם `gematria` ל-`hebrew`, מסיר ערכים לא חוקיים, ומנקה duplicate dispositions. כל יתר נתיבי טעינת settings/ערכות סגנון חייבים להיכלל במיפוי לפני הכרזת “נתיב אחד לכל קלט”.
- **W-6:** הערת pipeline והחלטות D-109–D-115 סונכרנו בענף העבודה; D-116 קיים ב-DECISIONS בענף fix. Main עדיין חסר D-116, והכותרות בראש WORKLOG/DECISIONS לא עודכנו לתאריך האחרון.
- **W-7:** שתי קריאות ghost בפועל תוקנו, וגם הוכח ותוקן באג סולם צבע rect ב-DOM (`0..1` הועבר ל-CSS שמצפה ל-`0..255`). הסורק עצמו מוגבל לגישות מילוליות `settings['key']`; הוא אינו מכסה כל צורת קריאה. הוא גם חובר לבדיקת s10-ui — אין להרחיב או להריץ זאת.

### 7.8 יכולות ודרישות שלא הוכח שהושלמו — ויש להחזיר למפת החובות

1. **ShapedRun ב-production:** ה-runtime הנטען ב-Worker הוא staged. `production-typography-runtime.js` מצהיר שאינו מפעיל shaping ב-pipeline. Worker מעביר `typographyRuntime` ל-`typeset`, אך `pipeline.js` אינו צורך אותו. `line-items.js` עדיין מפצל TextItem לפני shaping; `LineModel`/`PageModel` אינם glyph-authoritative; DOM משתמש ב-`textContent`; PDF משתמש ב-`cidOf(ch)` וב-subset לפי chars. TYP-SHAPING-01 נשאר blocker.
2. **S74 mark-width:** `pdf-mark-policy.js` מחובר ל-`exportPdf` ול-`exportPdfFromModel`, ומאפס רוחב `/W` של סימני ניקוד משולבים כדי להתאים את advance של PDF למדידה. זהו תיקון ממוקד לרוחב excess של FrankReal. הוא אינו מוסיף x/y offsets או cluster positions, ולכן אינו shaping כללי ואינו מוכיח attachment חזותי מלא.
3. **S75 body-first:** עדיין אינו ממומש. W-4 שינה default ל-`legacy`, והשאיר `unifiedSupport:false`. דרישת המשתמש נשארה פתוחה.
4. **תמונות/רקעים/DOCX:** D-107 כולל inline image, גאומטריית wrap, נכסים ותחולה בהערות שוליים; Stage1 תיעד אובדן תמונות DOCX, פערים בין raster/SVG, וחוסר parity בחלק מיצואי PDF/custom pages. W8 של SPLIT עוסק רק בשלישיית background settings והוא לא בוצע. אין למזג את כל דרישות התמונות תחת W8; יש לפרק לכל סוג נכס ולכל יעד.
5. **Settings background triad:** `background-page-type`, `background-image`, `background-texture` ו-`background-inset-mm` עדיין מסומנים `unifiedSupport:false`. זו יכולת מוצר חסרה, לא “פקדים מתים” שנסגרו.
6. **Performance:** P-2 מתועד כ-7.6x–12.8x על פני baseline היסטורי, מול חוזה 9C.3 של ≤2x; P-3 מתעד sorting כפול של content multiset. אין להריץ benchmark חדש לפי איסור המשתמש, אך אסור לסמן את הנושא “אופציונלי וסגור”. יש לבדוק מקור קוד ולבצע שימוש ידני במסמך הארוך כדי לזהות פגיעה מעשית, ולהציג למשתמש את החוב.
7. **Legacy residue:** `dom-renderer.js` ונתיבי `exportHtml`/`exportPdf` הישנים עוד קיימים. יש להחליט על סילוקם/הוצאתם מחבילת production לאחר מפת consumers מלאה. `legacy-settings-map.js` הוא adapter import של נתוני IMUD, ולא מנוע עימוד — אין להסיר אותו באופן גורף.
8. **UI acceptance:** טענות s10-ui/DOM-shim אינן קבלת משתמש. נדרשת בדיקה ידנית מלאה של editor, preview virtualization, click-to-editor, TOC navigation, zoom/scroll, settings persistence, import/export ו-recovery.
9. **היסטוריה:** 57 קובצי Library/צ'אטים עדיין לא הושלמו לפי PHASE1_SOURCE_RECONCILIATION. 20 נושאי SPLIT אינם תחליף לקריאת כל מקורות הדרישה.
10. **D-116 sync:** יש להוסיף את החלטת הכותרת מעל הקו ל-main `DECISIONS.md` ולתקן headers של פנקסים. אין לשנות את תוכנה של ההחלטה.

### 7.10 W-8, W-9, W-10 — החלטת ביקורת ולא סגירה

- **W-8 — Background settings:** ארבעת המפתחות `background-page-type`, `background-image`, `background-texture`, `background-inset-mm` נשארו חסומים/לא נתמכים בפרופיל unified לפי מסמכי SPLIT. זו יכולת מוצר חסרה ולא סגירה תיעודית. יש למפות אם היא חלק מהחוזה המשתמשי הפעיל; בהינתן דרישת “השלמת כל התוכנה”, יש להשאיר אותה פתוחה עד מימוש מלא או אישור משתמש מפורש להגבלה.
- **W-9 — Performance:** אין לסווג כ-P2 אופציונלי רק משום שאין benchmark אוטומטי מותר. חוזה 9C.3 מציין יעד ביצועים של עד פי 2 מן ה-baseline; הדוחות מציגים 7.6–12.8x. D-100 ביטל legacy visual parity, אך אינו כשלעצמו ביטול של דרישת ביצועים. יש לבדוק את מקור העלות ידנית ואת השימוש בפועל ב-very_long, בלי להריץ benchmark. אם אין אפשרות להוכיח עמידה ביעד ללא כלי אסור, התוצאה נשארת `NOT VERIFIED` ולא מוצהרת כתקינה.
- **W-10 — Chain/test debt:** הדוחות מציינים חוב של 28 סוויטות אדומות/שרשרת בדיקות לא נקייה לאחר הכריתה. אין להריץ, לתקן, להרחיב או לכתוב בדיקות כדי לטפל בכך, בהתאם להוראת המשתמש. יש להפריד זאת מחובות מוצר: אין להסיק שהמוצר עצמו תקין בגלל test history, ואין להסיק שכל 28 הסוויטות הן באג מוצר. כל עוד לא נעשתה בדיקת מקור ידנית שמזהה תלות runtime, סטטוסן `HISTORICAL TEST DEBT / NOT RE-EVALUATED`.

### 7.9 מה לא לעשות בגלל דוחות parity ישנים

דוח Iteration 006 משאיר F7 — paragraph-gap של 7.1pt מול 9.3pt — כגורם לפער במספר עמודים לעומת legacy. D-100 ביטל התאמה ל-PDF הישן ו-P6/P7. לכן אין לבצע את תוכנית “7px trailing gap” כדי לחקות את legacy. יש לבדוק רק אם התנהגות הגוף הנוכחית מפרה הוראת משתמש עדכנית ב-D-107: צפיפות, מרווחים, סיום פרק קצר, widow/orphan, fill, overflow או איזון. אם לא הוכחה הפרה כזו, F7 נשאר `LEGACY_PARITY_DIFFERENCE / NOT A PRODUCT BUG`.

## 8. סדר פעולות לכל טענה היסטורית

לא מתחילים מתיקון. תחילה מוכיחים מה נטען, היכן הוא נוצר, מה המצב בקוד, ומה באמת צורכים המשתמשים וה-export.

### 8.1 שחזור הטענה

לכל שורה ב-Worklog, Issue Registry, Decision, Stage report, Iteration report, PR או שיחת משתמש:

1. העתק את הטענה המדויקת, לרבות סייגים, תאריך, branch ו-commit.
2. קבע האם זו דרישת משתמש, החלטה, הצעת AI, תצפית, תוצאה מדודה, תיקון או מסקנה.
3. קבע אם הטענה עדיין בתוקף. בדוק החלטות מאוחרות שסתרו או שינו אותה.
4. מצא את ה-commit המדויק שבו נעשה השינוי הנטען. אם הדוח מצביע רק על ענף או PR, שחזר את ה-commit בפועל.
5. בדוק אם הקומיט נמצא ב-main, בענף הנוכחי, ב-PR פתוח בלבד, או ב-branch שננטש.
6. בדוק אם הקוד הוחלף או בוטל בקומיט מאוחר יותר.
7. סמן `STALE` אם התיאור מבוסס על שורות קוד/מספרי שורות ישנים, `CONFLICTED` אם יש דיווח סותר, ו-`CLAIM_ONLY` כאשר אין commit/קוד ברור.

### 8.2 עקיבת קוד ידנית

עבור כל תיקון/פעולה, עקוב אחר המסלול המלא:

`קלט UI / Import → normalization → settings resolver → Worker request → Parser → DocumentModel → item/style/font/asset resolver → MeasureAPI → LineItems → LineBreaker → Planner → notes/page-items → PageModel → materialization → DOM/HTML/PDF projection → exported artifact`.

בכל מעבר לרשום:

- מודול ופונקציית entry.
- נתוני input בפועל ושדות schema.
- ערכים שעוברים שינוי/נרמול.
- מי מוסיף או מוחק מידע.
- האם זה מקור סמכות, adapter או renderer.
- כל consumer ישיר ועקיף.
- fallback, default או inferred value.
- mutation, cache או serialization boundary.
- מי צורך את הערך אחריו.
- האם הנתון עדיין קיים ב-PageModel.
- האם DOM/HTML/PDF משתמשים בו ישירות או מחשבים אותו מחדש.

הכלל הוא **לא להסתפק ב-import graph**. פונקציה יכולה להיות imported ולא בשימוש; setting יכול להיות read אך לא להשפיע; PageModel יכול לשאת field אך renderer עשוי להתעלם ממנו; renderer יכול להיראות תקין בעוד PDF נבנה מנתיב נפרד.

### 8.3 סיווג פערים

לכל ממצא יש לשייך אחת מהקטגוריות:

- `MISSING`: אין מימוש.
- `PARTIAL`: מימוש קיים אך מכסה רק חלק מהסוגים/מצבים.
- `UNWIRED`: קיים אך אינו מחובר למסלול המוצר.
- `WRONG_AUTHORITY`: ערך נוצר ביותר ממקום אחד או לא במקום האחראי.
- `DUPLICATE_PATH`: קיימים שני מנגנונים שמייצרים תוצאה.
- `SILENT_FALLBACK`: פער מוסתר באמצעות fallback או ברירת מחדל.
- `LOSS`: מידע/תוכן/זהות נופלים לאורך הצינור.
- `GEOMETRY_DIVERGENCE`: x/y/width/height/baseline שונים בין שלבים/יעדים.
- `TYPOGRAPHY_DIVERGENCE`: glyph/cluster/advance/offset/font/mark שונה.
- `STATE_FAILURE`: מצב worker/UI/cache לא מתאפס או מתאושש.
- `RELEASE_MISMATCH`: אתר/Bundle/Worker/assets אינם מאותו source commit.
- `UNVERIFIED`: אין כרגע ראיה מספקת.
- `USER_DECISION_REQUIRED`: נדרשת הכרעה ולא נכון לנחש.

### 8.4 חוזה סגירת ממצא

אין לסגור ממצא לפני שיש תשובה לשאלות הבאות:

1. מה הייתה הבעיה המדויקת לפני התיקון?
2. באיזה שלב נוצרה ההחלטה השגויה?
3. מהו הנתון או התנאי שגרמו לה?
4. איזה קוד שונה ובאיזו שכבה?
5. מה כל הצרכנים שמושפעים מהשינוי?
6. האם נוצר מקור סמכות אחד ולא נוסף מסלול חלופי?
7. האם התוכן וה-source identity נשמרו?
8. האם הגדרות משתמש וברירות מחדל נשמרו?
9. האם המימוש מחובר למסלול המוצר העדכני?
10. האם התוצאה נראתה באתר ובתוצר HTML/PDF אמיתי לפי היקף ההשפעה?
11. האם תוקן גם ה-build שמפורסם, או רק source file?
12. האם נשארה מגבלה או סיכון שלא הוכרעו?

אם אחת התשובות חסרה, הממצא נשאר פתוח או מאומת חלקית. אין לסמן תיקון כשלם רק כי הקוד מתקמפל או כי הוסיפו פונקציה.

## 9. מבנה פנקס האימות — בתוך תוכנית זו

לכל דרישה תתועד רשומה אחת, ולא שורה נפרדת לכל דוח שמזכיר אותה. שדות חובה:

| שדה | פירוט |
|---|---|
| `REQ-ID` | מזהה קבוע, למשל `TYP-SHAPING-01`, `EXP-PDF-03` |
| `Canonical requirement` | ניסוח התוצאה שהמשתמש צריך לקבל |
| `Authority` | ציטוט/החלטה/מקור מחייב |
| `Historical claims` | דוחות, PR, commits ושיחות שטענו שבוצע |
| `Current code path` | קובצי source/fns ב-HEAD העדכני |
| `Inputs / outputs` | schema ושדות לאורך הצינור |
| `Consumers` | כל callers ו-renderers |
| `Known risks` | fallbacks, כפילויות, אובדן, קצוות |
| `Manual source review` | מה נקרא, באיזה commit ומה נמצא |
| `Live procedure` | פעולות המשתמש לבדיקת המוצר |
| `Artifact procedure` | בדיקת HTML/PDF בפועל |
| `Status / evidence level` | לפי סעיף 3 |
| `Fix commit` | קישור לקוד, אם יש |
| `Remaining work` | משימה מוגדרת ולא ניסוח כללי |
| `Closure decision` | מי קיבל, מתי, ועל סמך מה |

## 10. איסור על מדדי הצלחה מטעים

- מספר עמודים לבדו אינו מדד נכונות. דוחות Iteration 001–006 הראו שהבדלי page count יכולים לנבוע משילוב של line breaks, footnote budget, heading bands ו-paragraph gap.
- `contentPreserved=true` ברמת המנוע אינו מוכיח שה-PDF מצייר את כל הגליפים במקומם; דוח FrankReal הוכיח זאת.
- חילוץ Unicode נכון מ-PDF אינו מוכיח שהניקוד ממוקם נכון.
- PageModel יחיד אינו מוכיח glyph parity אם הוא שומר רק מחרוזת ולא ShapedGlyph.
- DOM ו-HTML זהים אינם מוכיחים PDF parity.
- Build success אינו מעיד על runtime correctness.
- `profile=unified` ב-build-info אינו מוכיח אפס קריאות legacy, אפס re-typeset או אפס hidden fallback.
- 0 diagnostics יכול לנבוע גם מכיסוי חסר או מכך שהמנגנון כלל לא הופעל. יש לוודא שהפעולה הנבדקת אכן התרחשה.
- אין להסיק שכל 253/259/265 הגדרות תקינות מספירה בלבד.
- אין להתייחס ל-PDF הישן כיעד חזותי. יש לאמת דרישה שאושרה, ולא לשחזר כל סטייה היסטורית.

---

# חלק ג — תכנית הביצוע המדורגת

# שלב 0 — נעילת מצב אמת, שימור עבודה ותכנון מעבר בטוח

**עדיפות:** P0 תפעולי.  
**תלות:** אין.  
**מטרה:** לאפשר מחקר ותיקון בלי לדרוס את ההתקדמות הקיימת ובלי להתקדם על בסיס source/deployment לא מזוהים.

## 0.1 בדיקת Git והענפים

- לקרוא את main HEAD, branch HEAD, ancestry, PR #72 ו-PR #73.
- ליצור רשימת commits בענף הניסוי שאינם ב-main ורשימת commits ב-main שאינם בענף.
- למפות קבצים ששונו בכל commit, במיוחד source, specs, audits, generated bundles ו-workflows.
- למפות את כל ה-PRs הפתוחים/סגורים הרלוונטיים, מצב merge, files changed, commits ותגובות; אין להסיק ממספר PR בלבד.
- לשמר branches ו-commits; אין force push ואין reset הרסני.
- להפריד את PR #73 לשלושה סוגי שינוי: (א) הסרת מנוע runtime; (ב) שמירת import mapper ותאימות הגדרות; (ג) workflows/tests changes. לא למזג את (ג). לבדוק אם (א) בטוח באופן עצמאי. לא להסיר `legacy-settings-map.js` עד שייבוא ההגדרות הועבר למנגנון קנוני אחר או הוכח שהקובץ נשאר כ-adapter בלבד.
- להשוות את שינויי PR #72 לקוד S74 בפועל, לא רק לתיאור.
- לעקוב אחרי תיעוד ישן שעדיין אומר “legacy default” מול קוד הניסוי שמנסה לקבע unified.

## 0.2 מצב build ו-Pages

- לקרוא build-info.json מהשורש ומה-preview.
- לקרוא manifest/sha של `app.bundle.js`, `engine-worker.bundle.js`, `styles.css`, catalog assets, font assets ו-ornament assets.
- להשוות ל-source commit המזוהה; אין להסתמך על cache-busting query בלבד.
- לוודא שה-worker bundle וה-main bundle מאותה בנייה.
- להפריד deployment של ניסוי מ-production root; אין לאשר cutover על בסיס preview path.
- לקבוע מנגנון deploy ידני שמותר לפי ההגבלות. אם אין אפשרות לפרוס בלי workflow, לתעד `DEPLOYMENT_BLOCKED` ולא לעקוף את ההוראה.

## 0.3 שימור תוצרים

- לשמור עותק read-only של PDFs/HTML ששימשו כראיות היסטוריות עם hash ו-source commit.
- לא להחליף artifacts קיימים ולא לעדכן baseline היסטורי כדי להתאים לתוצאה חדשה.
- לא לדרוס branch או bundle בלי לדעת את provenance.
- כל תיקון עתידי יישמר ב-commit ממוקד, עם שינוי source ו-generated bundle רק אם זהו חלק מתהליך build רגיל והגיוני למוצר.

## 0.4 תוצר ושער

תוצר: תמונת מצב אחת בתוך התוכנית: source commit, branch, PRs, deployment commit, asset version, unresolved branch changes, deployment method.

שער 0 נסגר רק כאשר אין ספק איזו גרסה היא source of truth לכל מסלול ומהו הסיכון בשילוב השינויים. אין לגעת עדיין בקוד המנוע.

---

# שלב 1 — השלמת חקירת כל המסמכים, הדוחות, השיחות והתרשימים

**עדיפות:** P0 ניהולי/הנדסי.  
**תלות:** שלב 0.  
**מטרה:** שלא תישאר דרישה או טענה היסטורית שמסתתרת במסמך שלא נקרא או לא קושרה לקוד.

## 1.1 מלאי מקורות מלא

לסרוק את עץ Git של branch/main ואת ספריית השיחות והקבצים של הפרויקט. לכל מקור לרשום שם, גרסה, commit/date, סוג, תחום, האם נקרא בשלמותו, מה חולץ, ומה נשאר לבדיקה.

לכלול לפחות:

- `spec/README.md`, `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`, `spec/01_MASTER_SPECIFICATION.md`, `spec/02_MASTER_WORK_PLAN.md`, `spec/03_UNIFIED_ITEM_CONTRACT.md`, `Software_Requirements_Specification.md`, `CANONICAL_DOCUMENT_MODEL.md`.
- `DECISIONS.md`, `OPEN_QUESTIONS.md`, `ISSUE_REGISTRY.md`, `WORKLOG.md`, `AGENTS_TRACKING.md`, `LAYOUT_DEPENDENCY_MAP.md`, README.
- כל 109 מסמכי Markdown תחת `audits/` שמופיעים בנספח א'.
- כל תרשים Mermaid/ASCII/טבלת pipeline בתוך מסמכי Markdown, ולאתר תרשימים שאינם תואמים לקוד.
- JSON reports, metrics, CSV, HTML, screenshots, PDFs, source maps, font conversion reports, build manifests ו-artifacts רלוונטיים.
- handoff prompts, pasted chats, ספרי שיחות, היסטוריית AI, שיחות קודמות של משתמש ודרישות שנכתבו בשיחות שלא נכנסו לריפו.
- מאגרי Red המקבילים/Old ו-Work, IMUD, V21/V23/Yellow/Green/Orange, רק כדי לזהות תיקון או דרישה שהוחמצו. אין למזג גרסאות מקבילות או להחזיר P6/P7.

**הסתייגות מחקרית:** ב-`PHASE1_SOURCE_RECONCILIATION_2026-11-25.md` תועד במפורש שחלק מארכיון ה-Library (57 קובצי היסטוריה/מועמדי מקור), קבצים גדולים, ZIP, PDFs ובינאריים לא נקראו כולם שורה-שורה. יש להשלים את ההצלבה הזו. עד אז אסור לטעון שההיסטוריה כולה נסגרה.

## 1.2 חילוץ דרישות משתמש

לכל דרישה יש לאתר את הניסוח המקורי וההקשר, ואז להבחין בין:

- בקשת משתמש מקורית.
- תיקון/הבהרה מאוחרת של המשתמש.
- החלטה מפורשת.
- הצעת AI שלא אושרה.
- יישום שנבחר.
- דיווח תוצאה.
- קבלת משתמש.

לבדוק במיוחד: התפתחות מדיניות שורות p-cut/p-end, הגדרת שורה דלילה, איזון טורים, H0–H7, H7 כביאור צד, notes glue, סוגריים חוצים, מילה ראשונה/drop word, defaults, Text IDs, gates, headers, TOC, images, inline fonts, folio, fonts and shaping, עורך↔תצוגה, export parity ודרישת הסרת מנוע מורשת.

## 1.3 reconciliation של החלטות

- לקרוא D-1 ועד ההחלטות האחרונות ב-main; לא להעתיק D-112..D-115 מהענף הישן אם הם כבר ב-main.
- לסמן כל OQ שנפתרה. OQ-12→D-112, OQ-13→D-113, OQ-14→D-114, OQ-15→D-115 אינן שאלות פתוחות עוד.
- לבדוק OQ-1..OQ-11 מול החלטות מאוחרות, דוחות Stage9b ודרישות המשתמש. לא להניח שכולן עדיין פתוחות.
- לזהות סתירות בין החלטות ישנות לבין בקשות מאוחרות ולתעד איזו החלטה גוברת.
- לסמן החלטה הנוגעת ל-old engine behavior בלבד, ולא לדרוש שחזור מלא של המנוע הישן כאשר D-100 ביטל parity חזותי כללי.

## 1.4 תרשימים ומפות

- להצליב `ENGINE_RUNTIME_PATHS`, `ENGINE_DUPLICATION_REGISTER`, `LAYOUT_DEPENDENCY_MAP`, STAGE1_CAPABILITY_MAP ו-diagrams שבתוך מסמכים עם source HEAD הנוכחי.
- בכל תרשים להראות input/output types, ownership, async boundary, serialization boundary, model transitions ו-runtime dispatch.
- לתקן תרשים מיושן רק לאחר source review; לא לכתוב תרשים תיאורטי שאינו תואם קוד.
- כל מנגנון חישוב כפול מסומן במפה גם אם דוח ישן הכריז שהוא נסגר.

## 1.5 תוצרים ושער

תוצר: Master claim ledger מלא בתוך המסמך/נספחו, עם 100% מן המקורות שמופו, שדות `read-complete`/`read-partial`/`not-read`, רשימת דרישות כפולות, unresolved user decision ו-links.

שער 1 נסגר רק אם כל מסמך משמעותי קיבל מעמד, כל דרישת משתמש חולצה, וכל החלטה סותרת הוכרעה או הופרדה למשימה שאינה תלויה בה. אין לסמן קבצים שלא נקראו כ-read.

---

# שלב 2 — מיפוי runtime עדכני והוכחת מסלול מוצר אחד

**עדיפות:** P0.  
**תלות:** 0–1.  
**מטרה:** להוכיח מה באמת רץ בדפדפן, ולא מה נקרא בתוכנית.

## 2.1 כניסות מוצר

לעקוב ידנית אחרי כל כניסה:

- פתיחה ראשונית עם ברירות המחדל.
- paste/typing בעורך.
- פתיחת TXT.
- פתיחת DOCX.
- טעינת preset/style set.
- טעינת template JSON.
- פתיחת project ZIP.
- טעינת fonts/assets.
- פעולת typeset מחדש לאחר שינוי setting.
- ביטול typeset.
- יצוא HTML.
- יצוא PDF.
- יצוא/ייבוא פרויקט.
- ניווט עורך↔תצוגה ו-TOC.

לכל מסלול להציג `entry → caller → worker/client → protocol → handler → engine → result → render/export`. לציין אם UI thread או Worker, sync/async, state/cache ו-error behavior.

## 2.2 Dispatch והסרת מנוע הישן

מקורות עיקריים לבדיקה:

- `red-build/src/engine/core/pipeline.js`
- `red-build/src/engine/layout/legacy-imud-flow.js`
- `red-build/src/ui/app-shell.js`
- `red-build/src/ui/browser-entry.js`
- `red-build/src/ui/engine-worker-main.js`
- `red-build/src/ui/worker-client.js`
- `red-build/src/ui/worker-protocol.js`
- `red-build/src/engine/output/export-api.js`
- `red-build/src/engine/output/dom-renderer.js`
- `red-build/src/engine/output/pagemodel-dom-renderer.js`

בצע חיפוש מקור ידני אחר כל dispatch, flag, env var, `_layout-profile`, `_imudRaw`, `legacyProfile`, `page.legacy`, `legacyTypeset`, `renderLegacyPage`, `exportPdf`, `exportPdfFromModel`, `exportHtml`, `exportHtmlFromModel`, `projectLegacyDocument`, `projectDocument`, `geometry-projector`, `legacy-projector`, `renderPage` וכל fallback.

לכל שימוש לרשום:

1. האם הוא עדיין runtime או רק תיעוד/מיגרציה.
2. מי יוצר את הדגל/ערך.
3. מי צורך אותו.
4. האם אפשר להגיע אליו מה-UI או import path.
5. האם הוא משנה engine selection או רק ממיר הגדרות.
6. האם ה-PDF/HTML מפעילים typeset נוסף.
7. האם renderer עושה measurement/wrapping/reflow.
8. האם PageModel חסר גורר שגיאה מפורשת או fallback שקט.

### הבחנה חיונית

`legacy-settings-map.js` עשוי להישאר כממיר/adapter לייבוא `default_settings.json` וערכות מקור. עצם הישארותו אינה מנוע שני. לעומת זאת, `legacy-imud-flow.js`, line breaker הישן, planner הישן, renderer legacy, projector legacy, dispatch flags ונתיבי export נפרדים הם חשודים למסלול מנוע כפול. יש למפות כל אחד בנפרד, לא למחוק את כולם תחת כותרת כללית “legacy”.

## 2.3 Build/runtime provenance

- לוודא ש-main, worker, CSS, assets ו-font catalog משויכים לאותו commit/build.
- לבדוק resource URL, MIME, cache headers, stale cache, service worker אם קיים, asset version, relative paths ו-deployment root.
- לוודא ש-root וה-preview אינם מציגים פרופילים שונים ללא כותרת/אזהרה.
- לבדוק console errors, unhandled rejections, worker errors, 404, font decode failures, bad MIME, blocked CORS, missing SVG, missing font, unresolved asset.
- לא להפעיל workflows לצורך בדיקה. זו סקירת מקור ובדיקת דפדפן ידנית בלבד.

## 2.4 שער

שער 2 נסגר כאשר מסלול מוצר יחיד מתועד מן הקלט עד DOM/HTML/PDF, כל dispatch/fallback מסווג, כל export נבחן, ואין unknown route שמשנה תוצאה. אם נמצא runtime legacy פעיל — משימת cutover נשארת פתוחה.

---

# שלב 3 — DocumentModel, Parser, שימור תוכן ומזהי מקור

**עדיפות:** P0.  
**תלות:** שלב 2.

## 3.1 Parser והתחביר

לעבור על:

- `parser/dfa-lexer.js`
- `parser/block-tokenizer.js`
- `parser/bracket-scanner.js`
- `core/pipeline.js`
- `notes/markers.js`
- `extensions/style-schema.js`
- import modules ל-TXT/DOCX/ZIP/templates.

לבדוק כללי:

- metadata בראש המסמך בלבד; שורת body שדומה למטא-data לא תסווג בטעות.
- H0–H7, prefix, dash grammar, Hebrew numerals, part/section semantics, level fallback, multiline title.
- endnote prefix, endnote class directive, plain endnote, numbered endnote, footnote delimiters, consecutive `[א][ב]`.
- editorial directives, custom styles, notes בתוך/סביב סוגריים, parentheses nesting/cross-paragraph.
- image syntax, file references, custom pages, ornaments, separators.
- Unicode normalization, gershayim/geresh, maqaf/hyphen, whitespace, NBSP, PUA markers, zero-width characters.
- invalid structural input: explicit diagnostic, no silent disappearance; document fixture must be structurally valid.

## 3.2 מודל תוכן וזהות

בהתאם ל-`CANONICAL_DOCUMENT_MODEL.md` ול-`spec/03_UNIFIED_ITEM_CONTRACT.md`:

- לכל DocumentItem יש stable id, sourceRange, source token, kind, content, style, font identity, asset identity, note anchors, reading order ו-semantic role.
- inline items אינם מחרוזת שטוחה בלבד: mixed font runs, mark clusters, note marker, punctuation, whitespace, images and atomic units נשמרים כפריטים/מקטעים מקושרים.
- כל split בין blocks/lines/pages משמר source identity ו-offsets.
- token→block→line→page→rendered fragment צריך להיות traceable.
- transformations reversible או משמרות source mapping.
- אין string sentinels שמוחקים את גבולות המקטעים בלי מיפוי חזרה מלא.
- `participates:none` לפי D-114 צריך להישמר ולפעול בהתאם לחוזה.

## 3.3 שימור תוכן

לבדוק בנפרד:

- אותיות, ניקוד, טעמים, סימני cantillation.
- גרש, גרשיים, מקפים, סוגריים, סימני שאלה/קריאה, סימני ציטוט.
- מספרים, גימטריה, סימני הערות.
- רווחים רגילים/מוגנים/רווחי שורה.
- תוכן footnote, side-note, endnote, TOC, headings, headers, gates, custom pages.
- מטא-נתונים: שם ספר, מחבר, נושא, תיאור, מהדורה.
- images/assets ו-source references.
- no duplicates, no lost fragments, no repeated notes, no moved text outside permitted order.

## 3.4 טענות היסטוריות לבדיקה מיוחדת

- F-01: metadata לא נדרס על ידי ברירות מחדל.
- F-02: Drop word מועבר ל-LineModel/PageModel וכל יעד פלט.
- F-07: H1 כפול אינו מופיע גם בשער וגם כעמוד נפרד בלי כוונה.
- F-08: H2 automatic/reset ו-section handling.
- F-13: מספור TOC עקבי.
- F-18: שימור תוכן מלא אינו מוכח רק במספר מילים; צריך לשמר identities ו-order.
- F19 מ-Iteration 001: חסר `סימן` ומספר גימטרי ב-sign band של המנוע החדש — לבדוק מול החלטות/קוד נוכחיים, לא להניח שנסגר.
- PUA scrub: U+E000/E101/E102/E103/E104 וכל protector אחר אינם דולפים לתצוגה/ייצוא, אך גם אינם גורמים להסרת מידע סמנטי.

## 3.5 שער

אין אובדן, כפילות, שינוי סדר, split אסור או metadata corruption. קלט פגום מדווח. כל source fragment ניתן למעקב עד ליעד הפלט. כל טענה היסטורית סווגה מחדש.

---

# שלב 4 — Font Resolver, Unicode, Bidi ו-Shaping אמיתי בייצור

<badge color="danger">P0 — חוסם Production טיפוגרפי</badge>

**תלות:** שלבים 2–3.  
**סיבה:** תיעוד ה-POC מראה במפורש כי shaping production עדיין לא בוצע, ודוח DOM/HTML/PDF מראה כשל גליפים אמיתי ב-FrankReal.

## 4.1 Resolver וגופן יחיד

לבדוק את:

- `typography/measure-api.js`
- `typography/font-metrics.js`
- `typography/font-keys.js`
- `typography/font-subset.js`
- `ui/imud-library.js`
- `ui/worker-client.js` / `engine-worker-main.js`
- `output/pdf-writer.js`
- `output/pagemodel-dom-renderer.js`
- font catalog ו-assets directories.

כל גופן חייב להיות מזוהה על ידי content hash, family, face index, weight/style, variation axes, source format ו-normalized bytes. אין fallback שקט ל-OS font או לטבלת רוחב מקורבת אם המוצר טוען לגופן נתמך.

להכריע באמצעות המימוש ולא באמצעות הצהרה:

- מה נתמך: TTF/glyf, OTF/CFF, CFF2, WOFF2 raw או normalized SFNT, variable fonts, color fonts, fonts with GSUB/GPOS.
- מה אינו נתמך: התוכנה מציגה unsupported-font/unsupported-feature diagnostic ברור; אין לבחור גופן אחר בשקט.
- איך Node/browser/Worker מקבלים את אותם bytes ואת אותה גרסת shaping/runtime.
- איך משתנים Variation axes ו-OpenType features; הם חלק מזהות ShapedRun ו-cache key.

## 4.2 Unicode / grapheme / script / bidi

- Unicode 18 itemization נבחנת מול הקוד האמיתי ולא רק ה-POC.
- שמירה על UTF-16 source ranges ו-extended grapheme clusters.
- Script, language, direction, embedding level, bidi controls, ZWJ/ZWNJ, mixed LTR/RTL, numbers, punctuation ו-mirroring.
- UAX #9 כולל visual ordering ברמת paragraph/line, L3 combining-mark order ו-L4 mirroring.
- Bidi_Control משפיע על resolution אך אינו מועבר כ-glyph input.
- ZWJ/ZWNJ נשארים shaping input ואינם מוסרים כ-control.
- אין פיצול EGC או surrogate pair.
- אין segmentation שגוי לפי per-grapheme diagnostic label כאשר אותו Script/level/font/features צריך להיות run אחד.

## 4.3 ShapedRun / ShapedGlyph חוזה Production

יש להטמיע תוצאה immutable לפני word splitting/line breaking, הכוללת לכל run/glyph:

- font hash/identity, face index, axes, Script, language, direction, bidi level, features.
- GID, cluster id, source UTF-16 range, glyph flags.
- advance X/Y, offset X/Y, control bounds ו-tight ink bounds.
- run transform, baseline relation, source item identity.
- diagnostics עבור missing glyph, fallback, unsupported feature/axis או invalid range.

המידע חייב לשרוד:

`paragraph itemization → ShapedRun → LineItems → MeasureAPI → line breaking → LineModel → PageModel → DOM/HTML/PDF`.

אין לחשב רוחב מחדש לפי cmap/hmtx לכל codepoint לאחר shaping. אין browser shaping מחדש של Unicode כדי להחליט glyph positions. אין PDF character-to-CID path שמכניס raw positive mark advances בניגוד למודל.

## 4.4 Line-edge shaping

שבירת שורה משנה shaping context. לבדוק BOT/EOT נכון כאשר run חוצה סוף שורה/תחילת שורה, reshape של השוליים, השפעה על advances ועל candidate width, יציבות של איטרציית reshape, ומניעת split cluster. אל תסתפק ב-paragraph-level POC.

## 4.5 Bounds ו-PDF font embedding

- להפריד `controlBounds` מ-`inkBounds`.
- CFF cubic Bézier bounds מה-POC אינם מוכיחים Quadratic glyf bounds.
- להוסיף/להשלים מתמטיקת quadratic curves, accumulated pen positions, offsets ו-run transforms.
- subset לפי GIDs בפועל ולא לפי Unicode inventory בלבד.
- לשמר composite glyph references, widths, ToUnicode, ActualText, multi-glyph clusters, ligatures ו-copy/paste.
- אין להעתיק GSUB/GPOS/GDEF subset בלי remapping נכון.
- PDF חייב להשתמש ב-positioned glyph data ולא ב-heuristic `visualOrderRtl` או per-character hmtx.

## 4.6 S74 / FrankReal mark defect

- לשחזר ידנית את `שְׁמַע` בגופן FrankReal Bold.
- להשוות את ה-DOM, HTML standalone ו-PDF מאותו PageModel.
- למדוד glyph origins, advances, offsets, mark attachment, word width, ink bounds ו-text extraction.
- לבדוק גם fonts עם zero raw mark advance וגם fonts עם non-zero raw mark advance.
- לבדוק shin/sin dot, sheva, patah, holam, multiple marks, mixed word, ligatures וסוגריים.
- לבדוק האם `pdf-mark-policy.js` מתקן רק את הדוגמה או מייצג כלל typography אחיד; אם זה special-case שלא מתיישב עם ShapedRun, לא לקבלו כפתרון סופי.
- לבדוק שהפתרון אינו מזיז את המילה/משנה את PageModel width באופן מלאכותי ואינו מוסיף negative spacing renderer-specific.

## 4.7 Worker runtime ו-HarfBuzz loading

- `tools/build-worker-bundle.js` תואר כ-CommonJS-only, ואילו HarfBuzzJS מגיע כ-ESM/WASM עם async initialization.
- לבחור packaging אחד: build-time pinned bundle + WASM, או async bootstrap ייעודי ו-explicit Worker readiness barrier.
- Node ו-browser Worker חייבים להשתמש באותה גרסת HarfBuzz, אותם font bytes ואותו Unicode runtime.
- failure לטעינת WASM/Font הוא error גלוי; אין fallback שקט ל-table metrics או browser native shaping.
- לוודא initialization לפני typeset, worker respawn, canceled job, retry ו-local offline serving.

## 4.8 גבול המרת פונטים

- אין mass conversion של 380 CFF assets או של כל 1,758/1,766 font entries רק כי stress run עבר.
- להשלים review ל-47 geometric outliers ול-46 font diagnostic sets, כולל glyph coverage ו-placement.
- להחליט אילו פונטים נכנסים ל-v1 support matrix. כל font שלא עבר proof נשאר לא פעיל/unsupported באופן מפורש.
- לשמור source font bytes, license/SIL OFL, provenance ו-converter version.
- לא לשנות `MAX_ERR_EM` או לסווג outlier כתקין רק כדי להעלים אזהרה.

## 4.9 שער

`TYP-SHAPING-01` נסגר רק כאשר אותו ShapedRun/ShapeGlyph הוא מקור המדידה והציור ב-MeasureAPI, LineModel, PageModel, DOM, HTML ו-PDF; אין per-character remeasurement/reshaping; ניקוד, טעמים, ligatures, bidi ו-extraction נכונים; font scope הוגדר; אין POC-only claim.

---

# שלב 5 — מדידה אחידה, LineModel ושבירת שורות

**עדיפות:** P0/P1.  
**תלות:** שלב 4, משום שמדידה ושבירת שורות חייבות לצרוך shaping authoritative.

## 5.1 Measure API

- נקודת מדידה אחת לכל Item/cluster/run.
- יחידות מוגדרות px/pt/mm, rounding אחד, epsilon אחד, baseline/ascent/descent אחד.
- natural width, ink width, advance width, whitespace glue, letter/word spacing, scaling ו-transform מוגדרים בנפרד.
- אין למדוד פעם אחת ב-breaker ופעם שנייה ב-projector.
- `MeasureAPI.forFamily` וכל API נגזר חייבים להשתמש באותו font/shape record ובאותו cache identity.
- DOM/PDF/HTML אינם מקבלים סמכות מדידה.

## 5.2 LineItems ו-Knuth–Plass

מקורות מרכזיים: `line/line-items.js`, `line/line-model.js`, `typography/kp-linebreak.js`, `typography/measure-api.js`, `layout/protectors.js`, `core/pipeline.js`.

לבדוק:

- כל סוג inline item עובר אותו breaker: text, mixed-font fragment, note marker, inline image (כאשר נתמך), protected word, custom style.
- Box/Glue/Penalty והעלות/penalty deterministic.
- break opportunities ברווחים, מקפים, NBSP, punctuation, Hebrew abbreviations, note-marker, bracket scopes, ZWJ/ZWNJ, clusters.
- protectors אינם מתפרקים או מתפצלים באופן שגוי כשהצירוף רחב מדי.
- `greedyFallback` אינו משנה semantics ולא מכניס מימוש חלופי קבוע שאינו שקוף.
- כל line מכילה ordered fragments, source offsets, ShapedRun refs, measured advances, glue allocation, baseline, break reason ו-constraints.

## 5.3 טיפוגרפיה של פסקאות ושורות

- `justify` נשאר ברירת המחדל המאושרת; אין להחליף את שורת p-cut לימין/מרכז.
- `p-end` (סיום פסקה) יכול להיות ממורכז ודלילות בה אינה בהכרח פגם.
- `p-cut` (סוף טור/עמוד עם המשך של אותה פסקה) חייב להישאר justify ואינו אמור להכיל מעט מדי מילים/רווחים קיצוניים אם היה מקום להכניס עוד מילה/מילים.
- להבחין בין sparse line באמצע פסקה, סוף טור/עמוד, סוף פסקה, ו-last line של paragraph.
- לזהות דלילות באמצעות inter-word space distribution/word count ולא רק bbox width (כי justify ממלא את השורה).
- אין לתקן באמצעות `text-align-last:right` או CSS שדוחה את ההחלטה של המנוע.
- טיפוגרפיית word spacing/letter spacing/glyph stretch צריכה להיות decision של engine בלבד.

## 5.4 First-word / Drop-word / Window

- Drop-word צריך להופיע ב-LineModel ובכל יעד, לא רק בנתון parser.
- First-word window חייב להשפיע על רוחב שתי השורות הרלוונטיות בהתאם לחוזה; לא על כל הטור ולא על שורה אחת בלבד.
- vertical align לפי cap-height וה-baseline, לא תחתית glyph ולא מרכז תיבה שגוי.
- לספור `windowWords` ולוודא שאין פערי accounting.
- לבדוק 1-word/2-word case, long first word, page/column crossing, heading after window, font change.

## 5.5 Parentheses ו-inline styling

- bracket scope נבנה לפני shaping ולפני measuring.
- nesting, unmatched opener/closer, cross paragraph/column/page, RTL order.
- unmatched opener policy, closing punctuation ו-paren size/advance משותפים למדידה ולרינדור.
- ensure font family/size/style segments remain per fragment; לא flatten mixed font word.
- PUA/sentinel markers נשמרים למקור ומוסרים רק במקרין לפי contract.

## 5.6 שער

LineModel אחד, deterministic, source-preserving, שכל פריטי ה-inline עוברים דרכו; כל מיקום ו-advance authoritative; p-cut/p-end/window/dropword/brackets/note markers נכונים; אין DOM/PDF measuring/reflow.

---

# שלב 6 — Planner, פריסת עמוד, איזון טורים וגאומטריה

**עדיפות:** P0/P1.  
**תלות:** שלבים 3–5.

## 6.1 Planner יחיד

מקורות מרכזיים: `layout/dp-planner.js`, `layout/plan-model.js`, `layout/page-templates.js`, `layout/column-flow.js`, `layout/balancing.js`, `layout/headings-escort.js`, `layout/retreat-loop.js`, `core/pipeline.js`.

- Planner קולט LineModel/constraints מלאים, ולא רק string/word count/line height.
- Page capacity ו-column capacity נגזרים מאותו page geometry contract.
- page margins, gutters, note reserves, spanning bands, ornaments, headers ו-footers כלולים בזמן placement, לא לאחריו.
- אחת בלבד לכל החלטת page/column break, balancing, move, retreat, rollback ו-reflow.
- state immutable או controlled, כל שינוי invalidates dependent geometry explicitly.
- no late mutation to geometry after plan freeze.

## 6.2 איזון טורים

- איזון הוא בחירת breakpoint, לא stretching של תוצאה שכבר נוצרה.
- בדיקת כל המועמדים: heights, free capacity, widows/orphans, headings, notes, spans, last line quality ו-reading order.
- שתי העמודות נבחנות ביחד; לא לחשב free capacity רק עבור column אחרון אם הטקסט יוזרם משני columns פתוחים.
- לא להזיז בלוק שלם כאשר ניתן לזרום לטורים הפתוחים.
- לא לעשות balance על spanning bands/shadow records באופן שמוציא אותם מסנכרון.
- reconcile notes בכל הטורים, לא רק האחרון.
- column bottom definition צריכה לכלול margins, ornaments, notes, bands, stretch וגאומטריית פריטי עמוד.
- סוף־פרק: stretch/compress רק לפי D-107 ומדיניות שאושרה; לא להחזיר P6/P7.

## 6.3 F7 — paragraph-gap model

דוחות Iteration 005/006 תיעדו פער בין paragraph gap של המקור (כ-7px trailing per block) לבין המודל המאוחד (כ-4px leading); נגזר ממנו פער מילוי/כ-10 עמודים על קורפוס מסוים. שינוי זה נדחה בזמנו בגלל השפעה רחבה על planner, escort, findSplit, bands ו-locks.

- לבדוק האם F7 טופל ב-commits מאוחרים יותר ומה מקור הערך הנוכחי.
- להשוות את ההתנהגות לדרישות המשתמש ולהחלטות D-107, לא להשתמש ב-old PDF כיעד parity.
- לבדוק paragraph top/middle/end, start of column/page, heading before paragraph, spanning band, note budget, terminal page.
- אם יש שינוי נדרש, לבצע אותו במודל הגאומטרי עצמו, לא כתוספת CSS ולא כהזזה post-layout.
- אין לשנות סדרי פיצול/נעילות באופן גורף ללא מיפוי impact וידיעת המשתמש אם ברירת מחדל משתנה.

## 6.4 Headings H0–H7

- H0 introduction, H1 part/section, H2 sign/chapter, H3 full-width/heading blocks, H4–H6 subheadings, H7 side note.
- כל רמה: grammar, metadata, font, size, color, spacing, width, alignment, page/column start, full-width, numbering, prefix, keep-with-next, note/side-note relationship.
- H1 לא משוכפל לשער ולגוף בניגוד לחוזה.
- H2 לא יוצר page-only heading ללא body כאשר אין לכך הוראה.
- H3 spanning band: mid-page placement, shadows, band top/tail padding, capacity, block gap suppression, escort, notes.
- Heading keep-with-next בודק בלוק גוף אמיתי אחרי side-note blocks, לא רק הבלוק הצמוד הראשון.
- אין consecutive headings invalid fixture; מסמך סופי מחייב text body.

## 6.5 Widow / orphan / sparse / empty / overflow

- כותרת ללא גוף; paragraph opening at bottom; single line below H3 band; sparse cut line; empty column; empty page; terminal residual; overflow; full-width content; images too big.
- אין לזהות p-end sparse כבעיה אם הוא סוף פסקה.
- אין לדווח widow עם שתי שורות כאשר ההגדרה המדויקת אינה מתקיימת.
- כל violation שמדווח חייב להיות נצפה בפועל; לא להסתיר findings או לשנות thresholds.
- כל fallback/rollback מוגבל, מנומק, שומר order ונותן שגיאה אם אין פתרון תקין.

## 6.6 שער

כל בלוק/שורה/פריט עמוד משובץ על ידי Planner יחיד, כל capacity/gap/height מוגדרים במקום אחד, reading order נשמר, no overflow hidden, no page/column holes unexplained. יש להסביר כל אי-איזון שנותר כתוצאת אילוצים אמיתית או לתקן את שורשו.

# שלב 7 — הערות, עוגנים, הערות צד, עיטורים וכל פריטי העמוד

**עדיפות:** P0/P1.  
**תלות:** שלבים 3–6.  
**מטרה:** כל פריט שאינו גוף טקסט רגיל הוא חלק מהמודל וה-PageModel, עם identity/geometry, ולא subsystem צדדי.

## 7.1 הערות שוליים

מקורות: `notes/markers.js`, `layout/footnote-budget.js`, `layout/dp-planner.js`, `core/pipeline.js`, `output/dom-renderer.js`, `output/geometry-projector.js`, `output/pdf-writer.js`.

לבדוק:

- delimiter settings: `fn-delim-open`, `fn-delim-close` וייבואם.
- note parsing בתוך פסקה, סוגריים, ציטוטים, multiline, consecutive notes.
- marker creation, marker style, numbering policy, reset per document/section/siman/page לפי ההגדרה.
- stable note identity: `tokenId`, `noteIndex`, `noteId`, `sourceRange` והעוגן המדויק.
- marker+anchor atomicity, NBSP glue, oversized pair, marker collision, custom marker collision.
- probe==reserved: אותו noteHeight משמש ל-budget ול-placement; אין wrap נפרד ב-renderer.
- note placement bottom anchored, columns, note lane width, separator line, note first-line policy, line pitch, alignment, continuation.
- note continuation across pages/columns: marker לא נעלם, note לא מוכפלת, text לא מוצג פעמיים, `(המשך)` אינו נספר כתוכן ואינו מופיע ללא note שנפתחה.
- paragraph spanning multiple pages: requeue semantics and marker identity across each fragment.
- behavior `footnotes-enabled=false`, inline mode, endnotes mode, footnote columns, long note split/move-whole/reject-to-body.
- footnote budget includes all columns, headings, spans, AQ/stretch and page geometry.
- if no legal fit: explicit unresolved condition, not silent clipping or note dropping.

יש לבחון מחדש היסטוריית F-BL2 (יז./כג. markers missing), F-02, F-18, F-13, marker collisions והערה שממשיכה בלי סמן. יש להבחין בין legacy report findings לבין unified current result.

## 7.2 הערות צד / H7

מקורות: `layout/side-notes.js`, `layout/headings-escort.js`, `dp-planner.js`, `output/dom-renderer.js`, `output/pagemodel-dom-renderer.js`, `geometry-projector.js`.

- H7/side-note token קשור לפסקת העוגן הנכונה — side note לפני paragraph, לא אחריו ולא במיקום unrelated.
- ownToken ו-anchorToken נשמרים ב-DocumentModel/LineModel/PageModel.
- מיקום נקבע לפי הטור של העוגן או המדיניות המאושרת, לא לפי זוגיות page בלבד כאשר זה שגוי.
- רוחב תיבה נגזר מהשטח הזמין, לא קבוע שמוציא אותה מחוץ לעמוד.
- wrapping/word widths/glyph positions נלקחים מה-ShapedRun/LineModel; renderer אינו reshaping/remeasuring.
- cascade/stacking מוגדרים; collision, page overflow, deferral ו-tail-page semantics מפורשים.
- RTL alignment; רווח בין מילים; line spacing; centered ink vs bounding box; font and baseline.
- טקסטים לא נדבקים ל-textContent של צומת אחר: DOM צריך להציג רווח/הפרדה סמנטית כדי copy/paste ו-extraction לא יאחד מילים.
- מדווחת חפיפה רק כאשר ink bounds חופפים בפועל, לא כשיש containment תקין או rounding בלבד.
- user-requested setting: default centered; alternative alignment follows associated column: headings on right-side column align left, headings on left-side column align right. Setting must persist and flow through resolver → DocumentModel/line model → PageModel → DOM/HTML/PDF.
- שינוי זה אינו CSS-only. יש להוכיח ש-x anchor / alignment policy נקבעים במנוע ומוקרנים ללא חישוב חדש.

בפרט יש לשחזר את דיווח המשתמש על H7: spacing inside side heading words, words stacking/overlay, issue is not only collisions between separate headings. בדיקה של שני H7 סמוכים אינה תחליף לבדיקת typography של H7 אחד.

## 7.3 הערות סיום

- syntax, title directive, source id, explicit number, counter/reset, body content vs class directive.
- `endnote-pages.js` page templates, column layout, continuation, page numbering, folio, TOC reference, title style.
- אין mixing של note class title עם body note.
- אין duplicate explicit markers / silent renumber.
- Endnote title style is independent of H2 style and uses correct font/size/color.
- Endnote references resolve to actual page/anchor/bookmark when PDF/HTML supports it.
- long endnote, multiple endnote groups, mixed fonts, PUA and parentheses.

## 7.4 עיטורים, קווים, פריטי עמוד ושערים

- כל `PageItem` type מתועד ב-contract וב-registry.
- ornaments top/bottom/side/chapter-end/H2/H3, dividers, rule, book furniture, page background, custom page, info-box, separator lines, gate blocks.
- `Kit 40` and three approved gate designs remain active by default per user decision.
- item geometry is reserved by Planner before placement; ornaments cannot overlap text or note lanes.
- same width/height/anchor/transform is used in DOM, HTML and PDF.
- SVG parser supports only explicit feature set; if unsupported, it must fail or use a single documented raster projection pipeline, not silently become black/empty.
- parse SVG fill, stroke, opacity, viewBox, transforms, definitions, use, clipPath, gradients/patterns as supported, embedded image policy, and external reference policy.
- verify gate SVG color issue from 27.11: recent raster fallback claims must be checked in actual PDF. Check color values before/after conversion, JPEG/WebP/PNG quality, transparency (JPEG does not preserve alpha), edge halos, line widths, fonts, and anti-aliasing.
- check image-backed backgrounds separately from vector ornament ink.
- distinguish vector SVG path support from raster image support. A renderer that draws an SVG in DOM is not proof the PDF draws the same asset.

## 7.5 Headers and folio

- every slot: recto/verso, left/center/right, text source, custom text, font, size, color, width, alignment, baseline, opening-page behavior and `same_as` handling.
- header fields resolve from actual book metadata, title/section/H2, first/last body words and user custom text.
- multiline H2 running header must use all needed source tokens; no truncated single line or mixed fonts.
- DOM header top is under the separator line exactly per approved design. Verify y/baseline/line coordinate from PageModel; don't patch with CSS offset.
- separator line color/width/position same in DOM/HTML/PDF.
- folio visibility/count pairs for body, TOC, gates, endnotes, blank pages and sign-open according to current decisions. Check all `start`, `initial`, `skip`, `count/show`, gematria and frame options.
- folio y/baseline and PDF ink bounds; no punctuation inserted with gematria.
- ensure no renderer has its own geometry formulas.

## 7.6 שער

- main, sub and back gate pages, page templates, order, blank page placement and transitions.
- title/subtitle/subject/description/edition/author/copyright and custom fields sourced from metadata or user input.
- block anchors, top positions, line wrapping, font family/weight/size/color, ornaments, SVGs, images, bleed and trim.
- no generic fallback text (e.g. default book title) overwrites metadata.
- H1/sign heading is not duplicated or consumed incorrectly.
- black/gray background bug: verify parseColor units once; no normalized 0–1 values divided again by 255.
- PDF and DOM colors/weights must match, including bold/regular font identity.
- page media/trim/bleed/crop marks are separated; do not treat intentional 3mm bleed as geometry mismatch.

## 7.7 תוכן עניינים (TOC)

- General and detailed TOC are distinct structural page items, not ordinary paragraphs in body flow.
- per-level controls: show/hide/inline/collapse/group, heading levels and numbering.
- heading title, page number, leader dots, separators (`|` as specified), color, font, size, alignment, indentation, row height, line wrap and page target.
- TOC title style is independent of H2 style.
- general/detailed title font does not accidentally inherit H2 font.
- black heading text and dark-gray page numbers according to current user requirement.
- correct page numbers after page assignment/insertions; no stale reference.
- anchors/bookmarks/links resolve in HTML/PDF.
- long heading wrapping, multi-page TOC, inline groups, collapse behavior, missing page number, page transition and final TOC row.
- TOC page count influences folio/count/show as approved.
- TOC must not be laid out or re-measured by a second renderer path.
- user-reported visual corruption must be reproduced on the actual output, not “closed” by semantic row counts.

## 7.8 שער סיום

- `SH-01` historical gate geometry and seven lines stacking should be reconciled against current PageModel and output.
- each page furniture element uses stable item kind, bounds and z-order.
- custom page geometry and background images must appear in PDF if the UI/product advertises them.

## 7.9 שער

All note/page-item/furniture kinds are present in the unified model, have stable identity, use a common budget/geometry, and appear in each supported output. No note, header, folio, TOC row, gate field or ornament is silently dropped.

---

# שלב 8 — PageModel immutable והקרנות DOM / HTML / PDF

<badge color="danger">P0 — חוסם שחרור</badge>

**תלות:** שלבים 3–7.

## 8.1 PageModel contract

מקורות: `core/page-model.js`, `core/materialize.js`, `layout/structural-stamps.js`, `output/pagemodel-dom-renderer.js`, `output/geometry-projector.js`, `output/pdf-writer.js`, `output/export-api.js`.

PageModel צריך להכיל, לכל item:

- page size, TrimBox/BleedBox/MediaBox, margins, columns and gutters.
- block/line/fragment/glyph positions and bounds.
- source identity, logical order, visual order, z-order.
- baseline, advance, offset, ink/control bounds, transform, clip.
- font file hash, face, GID, shaping clusters, source range, style and color.
- note anchor/body/placement, decorations, headers, folio, TOC, gates, images, links, bookmarks.
- diagnostic for every intentionally not-rendered or unsupported item.
- immutable schema version and explicit unit system.
- separate content hash and geometry hash; no timestamp/random/runtime ID in deterministic geometry hash.

`buildPageModel` must project a frozen plan; it must not make new layout decisions, re-wrap text or measure. `materialize` must consume LineModel and structural stamps, with zero hidden production fallback. `compat` routes are migration-only and must not be used by production.

## 8.2 DOM renderer

- one PageModel renderer for live preview and exported HTML.
- no CSS wrapping to re-decide line breaks.
- no browser shaping of Unicode as source authority once shaped glyph runs are integrated; browser can only draw supplied positions/glyph representation.
- stable physical coordinates and page scale.
- semantic text layer for selection/copy/accessibility must remain synchronized with positioned glyph visuals.
- no text node concatenation across line fragments; copy/paste order preserved.
- header/folio/TOC/notes/decorations use exact PageModel bounds.
- side heading setting, gates color, all fonts, weights, mixed fragments, punctuation, marks, images and ornaments.
- virtualization does not discard content/source identity; scroll positions and editor sync remain functional.

## 8.3 Standalone HTML

- exactly same PageModel and glyph positions as live DOM.
- embed fonts and assets locally or package them with valid references; no external network dependencies.
- same page dimensions, page count, text/links/notes/TOC/header/folio/gate images.
- CSS must not introduce independent wrapping, line-height, letter spacing or font fallback.
- open the exported HTML in a clean browser session and inspect without app state/cache.
- user-select/copy must produce logical text, not glyph order.

## 8.4 PDF

- PDF must consume same PageModel and same shaped GIDs/positions.
- no re-typeset when exported; no raw document path that bypasses PageModel.
- no per-character cmap→CID plus hmtx geometry for shaped Hebrew if it contradicts shaping result.
- PDF subset must include every GID referenced by PageModel; composite glyphs, font table remapping, widths, CID map, ToUnicode, ActualText and links work.
- all supported raster/vector assets are drawn; unsupported items are explicit export failure, not silent omission.
- text extraction preserves complete logical Hebrew text, markers, punctuation, nikud/trop, RTL reading order and notes.
- physical boxes: MediaBox/TrimBox/BleedBox/CropBox and page size correct; 3mm bleed when configured is intentional and must be checked by TrimBox, not misclassified.
- PDF outline/bookmarks, internal links, TOC destinations, page labels and metadata.
- transparency, clipping, color profiles, SVG raster fallback, image resolution and embedded fonts.

## 8.5 Cross-target parity

Compare **same input, same settings, same assets/fonts, same engine version and same frozen PageModel**. For each page and item:

- page count/order and page type.
- word logical sequence and source IDs.
- block, line, word and glyph positions.
- line widths, word advances, baseline, ink bounds and line spacing.
- font family/file/face, weight, style, glyph IDs and mark attachment.
- colors and opacity.
- notes, markers, anchors, TOC rows/links, headers, folios, decorations and image boxes.

Do not compare all rasterized page MediaBoxes without normalizing physical TrimBox/bleed. Do not take a page count match as parity. Do not use the old reference PDF as visual target; use the approved UI contract and same-PageModel cross-target identity.

## 8.6 Critical known parity defects

- FrankReal `שְׁמַע`: PDF 44.56796pt vs HTML 28.79297pt, difference ≈15.775pt from mark hmtx advances. Must be eliminated via shared glyph layout.
- Gate SVG color: recent rasterization patch not yet verified on real PDF; examine complex paths, fills/strokes, background color, transparency and vector/raster differences.
- Headers in DOM must sit below separator line with the same baseline/slot geometry as PDF.
- Side H7 typography must not break within a word or overlay glyphs.
- TOC title/rows/page numbers/leader separators and page targets.
- Raster image and custom page export path historically missing in PDF; verify on current code whether Stage8 closed every supported kind.

## 8.7 שער

No second measure/reflow/line-break in output paths; one PageModel controls content, geometry and shaping; HTML and PDF artifacts checked; any output capability difference documented and surfaced. No parity claim based solely on common PageModel object.

---

# שלב 9 — Settings, ברירות מחדל, Text IDs, templates ו-migrations

**עדיפות:** P1, כאשר פקד מת או value loss הוא P0.  
**תלות:** Stage 3/8 data contracts.

## 9.1 Settings resolver

- לפי D-112: actual product imported behavior is compatibility baseline; registry is fallback only.
- יש Resolver יחיד שמקבל source defaults, registry fallback, user deltas, imported template, style set and migration version in deterministic order.
- לא לשנות user values במהלך מעבר.
- אין מיזוג כפול או override שקט.
- unknown keys נשמרים לפי policy; ערך לא תקף מדווח ולא נעלם.
- settings שמיועדות ל-engine, ל-UI ול-serialization מופרדות סמנטית אך אינן מפוצלות ל-source of truth.

## 9.2 Audit מלא של כל הגדרה

לכל key:

- id, type, enum/range, default, min/max, unit, panel/control, label, help text.
- source default, fallback default, imported default, user override.
- serialization, save/restore, template import/export, style-set import.
- caller/consumer, exact effect, DOM/HTML/PDF impact.
- migration alias, duplicate aliases, deprecated key behavior.
- font resolver, color parser, numbering parser, boolean/string/number coercion.
- whether missing/invalid/unknown values error, fallback or drop.

Counts reported as 253/256/259/265 are historical snapshots. Recount and reconcile from current code plus generated bindings; do not trust historic table numbers.

## 9.3 Text IDs ו-prefixes

- all parser-recognized preamble identifiers.
- book name, author, topic, edition, subtitle, description.
- Heading 0–7 names and text templates.
- header source IDs and custom fields.
- TOC title/level/number/page label.
- gate fields, back cover, edition, author, copyright.
- notes, endnotes, separators, prefixes, suffixes, markers.
- first/last body words, first-word window, page/section numbering.
- labels/IDs that are hard-coded pseudo-settings.

Ensure Text IDs are not confused with labels. The absence of a centralized Text ID registry must be either corrected or deliberately documented; no silent aliases or key collisions.

## 9.4 Control → key → mechanism → output

For every visible control:

1. locate generated binding/control ID.
2. trace value read/write and persistence.
3. trace resolver output.
4. trace engine consumer.
5. trace PageModel field/geometry or UI-only function.
6. trace DOM/HTML/PDF effect.
7. verify no other key overwrites it.

For every mechanism requiring a setting, verify that a real setting exists and can be changed. For every key, verify an actual consumer and effect. Orphan mechanism/phantom key must be fixed or removed, not documented as alive.

## 9.5 Specific historically reported settings

- `page-num-format: gematria` enum compatibility.
- `fn-reset-mode` / `footnote-reset-policy` duplicate or undefined keys.
- `footnotes-enabled` cannot be silently forced on.
- `measure-impl` behavior and automatic metrics upgrade.
- `paren-style-scale` and source `s-paren` mapping.
- `count-toc-pages` vs `show-toc-folio`; `count-shaar-pages` vs display.
- `hdr-*` per-slot / recto/verso values.
- H0 body font/size, TOC fonts and independent title style.
- side-heading alignment selector requested by user.
- all default font keys loaded to Worker: no missing registration or silent table fallback.

## 9.6 Settings import adapter

`legacy-settings-map.js` is permitted to remain as a settings importer/migration adapter, if it performs only compatibility translation and not runtime typesetting. It must have a clearly bounded interface, exact key disposition, no duplicate engine selection behavior, and must not reintroduce legacy runtime dispatch.

## 9.7 שער

Every visible setting is wired and persists; all values resolved via one source; unknown/invalid values are explicit; text identifiers all inventoried; templates round-trip without losing supported settings; old import mapper is not engine code.

---

# שלב 10 — Assets, תמונות, DOCX, ZIP ו-project persistence

**עדיפות:** P1; data loss is P0.  
**תלות:** canonical model, PageModel, renderers.

## 10.1 Asset Resolver

- one resolver for image/font/ornament/logo/resource.
- identity, source bytes, MIME, content hash, physical dimensions, aspect ratio, orientation, alpha, scaling, fit mode, alt text and source location.
- magic-byte validation, not extension alone.
- safe path resolution, ZIP traversal prevention, duplicate name policy and missing asset handling.
- assets transferred to Worker via explicit protocol and replayed on respawn.
- no `media:null` state that has no consumer.
- no duplicated UI/Worker registries that diverge silently.

## 10.2 Images

- Inline PNG/JPG/JPEG per the user's approved syntax and any later approved format.
- images are first-class inline/page items before breaking/placement.
- natural dimensions read from PNG IHDR/JPEG SOF/SVG viewBox, not only declared size.
- aspect ratio preserved unless user explicitly asks to stretch.
- background image and image in text run have different layout roles but one asset identity model.
- raster and SVG DOM/HTML/PDF output paths covered.
- custom page images and gate backgrounds appear in all advertised targets.
- image cache, repeated references, resource cleanup, offline HTML and PDF embed.
- image not supported or invalid → explicit diagnostic, no silent drop.

## 10.3 DOCX import

Current Stage1 asset audit records that `docx-import.js` reads paragraph/text/paragraph style/footnote references but not `w:drawing`/`w:pict`, relationships or embedded `word/media/*`. Verify on HEAD.

- headings/style mapping, paragraphs, inline runs, bold/italic/font runs, tables/list if supported, images, alt text, links, footnotes/endnotes, sections, page breaks and metadata.
- if not implemented, UI must clearly state which elements are unsupported before/after import; no silent loss.
- DOCX import is reported as UI-thread path: inspect large file blocking, zip parsing and memory. Move work to worker only if architecture warrants and with one protocol, not a parallel importer.

## 10.4 ZIP / Project export-import

- file name safety, path traversal, entry size, decompression bomb limits, CRC/integrity, MIME, duplicate paths.
- settings, fonts, assets, custom styles, custom pages, document text and metadata round-trip.
- project export bundles exactly needed files; no external unresolved URL if offline product claims.
- re-open exported project; verify content and resource identities persist.
- missing/invalid resource yields clear warning/failure, not partial success.

## 10.5 שער

Every advertised resource type has a complete import→model→plan→DOM/HTML/PDF→project-archive path. Any unsupported capability is clearly declared and does not pretend to have been retained.

---

# שלב 11 — Worker, serialization, state, memory, performance and security

<badge color="danger">P0 — אמינות מסמכים גדולים והתאוששות</badge>

**תלות:** runtime mapping; data contracts; shaped model may affect memory.

## 11.1 `Invalid string length` — תיקון 27.11

Worklog reports:

- whole-document JSON serialization caused V8 maximum string length failures for very large inputs/results.
- `core/canonical-hash.js` now hashes array members incrementally while preserving `JSON.stringify(array)` hash equivalence.
- `bytesEstimate` uses a deterministic tree walk.
- Worker `_lastTypesetResult` is assigned only after serialization succeeds and is cleared on failure.

These are claims; reported validation was build/sanity and pure-function equivalence, not live acceptance. Verify in source and real use:

1. find all whole-document `JSON.stringify`, concatenations, joins, base64 encoders and HTML/PDF serialization paths.
2. map all payloads crossing worker protocol, postMessage structured clone and storage.
3. distinguish hash serialization from export serialization: incremental hashing does not prove large HTML/PDF serialization is safe.
4. inspect memory growth, duplicate copies of text/LineModel/PageModel, structured clone cost and base64 expansion.
5. check maximum supported input/page count by documented product limits, not arbitrary truncation.
6. load `very_long_test_text.txt` through UI, typeset, navigate, export PDF and HTML.
7. after any failure with a large file, immediately load a short file and typeset/export; ensure stale `_lastTypesetResult`, Worker state, progress and UI buttons are reset.
8. repeat one normal operation after cancel/restart/Worker respawn.
9. verify content count and final pages; no dropped tail or partial output.

## 11.2 Worker lifecycle

- worker startup/ready contract.
- protocol version and schema validation.
- unique request id, document/session id, monotonic progress.
- cancellation and termination semantics.
- stale responses ignored safely; latest request wins only according to explicit policy.
- font and asset registration replay after respawn.
- serialization failure, parse failure, out-of-memory, WASM failure and export failure produce actionable UI errors.
- no stuck loading spinner or busy state.
- no leaked buffers, font registries, object URLs, workers or stale callbacks.
- no race between registerFonts, setSettings and typeset.
- large job followed by small job; aborted job followed by successful job; export after failure; repeated quick edits.

## 11.3 Performance and memory

Do not use benchmarks or automated performance runs. Use manual real-use observation and source review only.

- identify repeated computation by code tracing.
- ensure one measure per shaped item, no renderer measurement.
- check cache identity, invalidation and memory retention.
- check virtualized page rendering does not materialize all DOM nodes at once.
- verify UI stays responsive enough for documented use; record actual times only as observational data, not a benchmark gate.
- avoid optimizing by hiding content, reducing resolution without disclosure, skipping notes or limiting pages silently.

## 11.4 Security and malformed input

Review source for:

- ZIP path traversal, malformed central directory, compressed-size expansion, CRC errors, large entry cap.
- XSS/HTML injection in content, metadata, SVG, custom styles and generated HTML.
- SVG script/foreignObject/event attributes/external href/data URI policy.
- local-file paths and external network references.
- malicious fonts/invalid tables, parser limits, recursion, enormous outline/path data.
- invalid numeric settings leading to infinite/NaN geometry.
- malformed brackets/notes/headings; parser must fail or diagnostic.
- PDF/HTML resource embedding and filename escaping.

Security review must be manual source review and controlled user-file import only; no automated fuzzing or scanners.

## 11.5 שער

large document can typeset/export; failed job does not poison later job; Worker recovers; no silent truncation; no stuck UI; supported malformed files fail safely; memory/resource lifecycle is bounded by design.

---

# שלב 12 — ממשק, פעולות משתמש, ייבוא, עריכה ותצוגה

**עדיפות:** P1; data loss or dead actions P0.  
**תלות:** stable engine and output paths.

## 12.1 UI inventory

למפות כל tab, panel, button, input, checkbox, select, slider, segmented control, menu, keyboard shortcut, modal, file picker ו-status indicator.

לכל control:

- what the user expects;
- handler and state update;
- persistence;
- engine setting/operation affected;
- whether layout is triggered immediately or only on explicit action;
- visible success/failure state;
- keyboard/RTL behavior;
- effect on current document/selection;
- recovery after failure.

## 12.2 Editor / preview synchronization

- click line/page in preview → editor caret/selection moves to correct source range.
- editor selection → preview highlights exact source item.
- virtualized pages load in view and sync doesn't jump to wrong page.
- H7/note/TOC markers have source anchors.
- multiple paragraphs with repeated text use identity, not string match alone.
- text direction, Hebrew selection, punctuation, note placeholders and PUA scrub do not break mapping.
- the user's report that live synchronization disappeared must be reproduced and resolved.

## 12.3 פעולות

- Open TXT/DOCX/project ZIP/template.
- Save, save-as, restore, reset.
- Typeset/retypeset explicit action.
- Cancel and recover.
- Navigate pages, zoom, virtualization, page selection.
- export PDF/HTML/project.
- font/asset catalog operations.
- settings search, panels, presets, import/export.
- diagnostics/status if exposed.

## 12.4 UI state vs engine state

- Do not persist transient busy state as settings.
- Don't trigger expensive typeset for every minor control unless specified.
- Settings changes after a prior typeset must visibly mark stale output or retypeset explicitly.
- No preview based on a different document/settings than export.
- errors must identify failure and preserve source document.

## 12.5 שער

All visible actions work in the real browser; settings/control effect confirmed; editor-preview sync works both directions; errors recover; no fake controls or hidden actions.

---

# שלב 13 — Cutover, הסרת Legacy ויישור main

<badge color="danger">P0 — תנאי למנוע יחיד</badge>

**תלות:** שלבים 2–12, ובמיוחד shaping/measure/Planner/PageModel/exports.

## 13.1 תנאי מקדים להסרה

לפני כל מחיקה:

- כל consumer of legacy mapped.
- כל behavior that matters migrated to canonical model/engine.
- import mapper separated from engine implementation.
- output paths use PageModel and shared glyph representation.
- settings/defaults and documents remain compatible.
- all open user requirements are mapped and either implemented or explicitly out of scope.
- no user-facing rollback flag that can select old engine.

## 13.2 Retirement map

Review each file/module independently:

- `layout/legacy-imud-flow.js`.
- `output/legacy-projector.js`.
- `dom-renderer` legacy branch.
- engine dispatch in `core/pipeline.js`.
- `_layout-profile`, `_imudRaw`, `_engine-force-unified` and aliases.
- legacy result/page markers.
- `exportPdf` old route and `exportPdfFromModel` route.
- `exportHtml` route and `exportHtmlFromModel` route.
- geometry projector facade/compat mode.
- old tokenizers, note markers, TOC, gate, page models, metrics tables and copied constants.
- old workers, worker protocols, bundle sources, imports, dead dependencies and stale generated assets.

For each path classify: live runtime; import adapter; compatibility input; dead; diagnostic only; migration-only; unresolved. Remove only when its consumers migrated. Don't erase provenance/reference docs.

## 13.3 Main and PR safety

- Branch `engine/legacy-parity-preview-20261119` is far ahead and behind main; do not merge wholesale.
- Reconcile commits by dependency group. Keep user decisions from main D-112–D-115.
- PR #73 workflow files are excluded; don't merge, rebase or trigger them by default.
- PR #72 specific S74 changes must be assessed against shared ShapedRun architecture; do not keep an independent PDF-only patch as final if it contradicts shared glyph positions.
- No force push, no delete branches until all relevant patches are safely landed and verified.
- Future engineering should happen on the branch selected by repo owner, ideally after a deliberate main sync; no claim that branch/main is aligned until actual ancestry and content are checked.

## 13.4 No hidden dual engine

The final user build must have one typesetting runtime. If there is an intentional compatibility adapter at the input edge, it must translate settings/document syntax and then terminate at the unified model. It must not have its own tokenizer/line breaker/planner/page placement/renderer.

## 13.5 שער

A complete source-level call graph proves no product path can call the old engine or old projector; no hidden fallback or profile switch remains; all original settings import works through bounded adapter; legacy source is removed or isolated outside runtime. PageModel runtime is the single source of truth.

---

# שלב 14 — Deployment, קבלה ידנית ושחרור Production

**עדיפות:** P0 לשחרור.  
**תלות:** כל השלבים הקודמים.

## 14.1 Manual build and deployment

- use existing documented build steps manually; do not start workflow.
- ensure `app.bundle.js`, `engine-worker.bundle.js`, `styles.css`, asset registry, font catalog and binary font resources are built from same source commit.
- verify build-info identifies commit and profile truthfully.
- verify deployed files by reading actual deployed content/headers/hash, not relying on stale browser cache.
- check root site; don't confuse preview path with production path.
- if the only deployment route triggers GitHub Actions, stop before triggering it and record `DEPLOYMENT_BLOCKED_BY_NO_WORKFLOWS`. A plan is not permission to violate this constraint.

## 14.2 Manual browser acceptance scenarios

Run as human user in a normal browser, not an automation harness:

1. open public root; identify visible build/version.
2. create/open a small known-good document.
3. edit Hebrew text, punctuation, parentheses and footnotes.
4. typeset; navigate between pages; verify no stale content.
5. click preview and editor to confirm two-way source synchronization.
6. change fonts, sizes, colors, H7 alignment, headers, TOC options, notes and folio settings; ensure each persists and changes the expected feature.
7. save and reopen project; ensure settings and assets restore.
8. import a supported DOCX and note explicitly any unsupported image/table features rather than silently dropping them.
9. export standalone HTML; open it independently without application state/network.
10. export PDF from same already typeset document; ensure no fresh typeset/re-pagination occurs.
11. close/reopen tab and perform a short operation after any long document.
12. repeat a failed/canceled operation and ensure recovery.

## 14.3 `very_long_test_text.txt` acceptance

- use exact file bytes and record SHA-256.
- verify structural validity according to user’s valid document constraints.
- load it through ordinary UI (not Node runner), trigger explicit typeset and wait for real completion.
- confirm full document loaded; record actual displayed progress/page count.
- navigate early/middle/late pages, including note-heavy, heading-heavy, H7, TOC, gate and long-line areas.
- inspect beginning and final pages to ensure no truncated tail.
- export HTML and PDF from that exact session.
- re-open the exported HTML in clean browser session.
- re-open PDF in an independent viewer.
- immediately load a short document after the long document; confirm state, Worker, UI and export still work.

## 14.4 PDF inspection with Python

Use Python tooling only as artifact inspection, not as a test suite/harness. Libraries may include PyMuPDF (`fitz`), `pypdf`, `pdfplumber`, `fontTools` and Pillow when appropriate. No VLM or OCR.

For each real exported PDF:

**Document structure**
- openability, page count, page dimensions, MediaBox/TrimBox/BleedBox/CropBox.
- metadata/title/author, bookmarks/outlines, links, page labels.
- file size and image/font resource inventory.

**Text and Unicode**
- extract full text page by page and whole-document.
- preserve Hebrew logical order, nikud, taamim, punctuation, brackets, gershayim, geresh, maqaf, note markers and metadata.
- detect unexpected missing/repeated spans by source ranges/known sample positions.
- don't mistake ligature or combining-cluster extraction for content loss; inspect ToUnicode/ActualText and compare logical source mapping.
- inspect copy/paste text in viewer for selected pages.

**Fonts and glyphs**
- enumerate all font resources, type, embedding, subsets and program bytes.
- confirm every font expected in the model exists in PDF.
- verify ToUnicode/CID-to-GID maps, missing GID, `.notdef`, composites, CFF/glyf outline compatibility.
- inspect real rendered glyph crops for Hebrew marks/nikud/trop, ligatures, brackets, mixed fonts and weights.
- measure glyph/word bounding boxes and actual relative mark position; text extraction alone does not close it.

**Geometry**
- text blocks/words/spans/character bboxes.
- positions of columns, line baselines, headers, separator lines, folio, note lanes, side headings, TOC, gates and ornaments.
- detect ink beyond TrimBox/content bounds, unexpected clipping, overlap, zero-sized boxes, misplaced text and unexpectedly empty regions.
- distinguish legitimate bleed from actual off-page content by comparing to TrimBox.
- compare same-page physical coordinates with DOM/HTML after normalizing unit scale and crop origin.

**Assets**
- list images, dimensions, colorspace, alpha/mask, resolution, compression, placement and page references.
- ensure all advertised raster/vector images appear; no missing background/custom-page content.
- check SVG raster fallback doesn't change color, transparency, aspect ratio, edges or scale.

**Notes/TOC/furniture**
- note markers and note bodies both present and associated; continuation behavior; page number and note text.
- TOC row/page targets and hyperlinks.
- headers under separator line; folio visibility and correct number.
- gate text/color/fonts/positions and ornaments.

**Manual report contents**
- PDF hash, source commit/build-info, source input hash, settings profile/version, total page count, font/image inventory, known pages examined, findings and screenshots/crops if needed.
- do not output an automated pass/fail runner; summarize inspected artifact and actual observed anomalies.

## 14.5 User acceptance and Release Readiness

A release candidate cannot be declared production-ready until:

- no P0 or P1 defect remains open without explicit user-approved limitation.
- ShapedRun is integrated into production and shared across outputs.
- no missing content/asset/marker/footnote/side note/TOC row.
- no stale or dual engine route.
- no hidden measuring/reflow during export.
- every supported setting and visible action is verified.
- all major document classes have been manually used: small, normal, long, note-heavy, headings/side-notes, gates/TOC, images/assets where supported.
- `very_long_test_text.txt` successfully typesets and exports; short document succeeds afterward.
- HTML and PDF artifact inspections agree with live DOM/PageModel.
- build provenance matches source and Worker.
- all remaining known limitations are documented and user-approved.
- user explicitly accepts the version.

# חלק ד — מטריצת דרישות, תיקונים היסטוריים וממצאים שצריך לסגור

## 11. מטריצת חובות קריטיות שנמצאו במחקר

הטבלה אינה קובעת שכל הפריטים עדיין פתוחים. היא קובעת שכל פריט חייב לעבור reconciliation מול HEAD הנוכחי ולזכות בהחלטת סגירה מנומקת.

| מזהה / משפחה | הטענה או הבעיה המקורית | שכבה שבה יש לאתר את השורש | מה חייבים לאמת עכשיו |
|---|---|---|---|
| F-01 | Defaults overwrite metadata | import/default resolver, parser, app-shell | metadata שנקלט נשאר מקור אמת; אין default שמחליף title/author/topic/edition |
| F-02 | Drop-word לא עובר ל-PageModel/DOM/PDF | dropword, line-model, materialize, renderers | word identity, glyph size/position, first-line window וה-render targets |
| F-03/F-04 | Full-width heading גורם page break מוקדם | heading mode, H3 band, DP planner, capacity | band placement, shadow reservation, free space, no forced flush אם לא נדרש |
| F-05 | numbering key collisions | settings registry, folio, notes markers | key unique, count/show distinct, imported settings אינם דורכים |
| F-06 | עמוד עם H2 בלבד | shaar/sign-open, heading escort, planner | body text נלווה כאשר נדרש; אין flush שנגרם מ-H3 או block sequencing |
| F-07 | H1 כפול | shaar-pages, H1 consumption, page template | H1 מוצג במקום המאושר פעם אחת; לא נשאר block נוסף בטעות |
| F-08 | H2 automatic/reset | chapter/sign logic, numbering, templates | reset happens exactly once and page opening semantics match decision |
| F-09 | parentheses scaling | bracket scanner, word overlays, shaping, projectors | size and advances match model in every output; unmatched/nested/cross-page |
| F-13 | TOC numbering mismatch | folio assignment, TOC row/pageRef, structural insertion | page refs after insertions; count vs show distinct |
| F-14 | line-height mismatch | MeasureAPI, line model, AQ, paragraph gaps, projection | actual baseline-to-baseline pitch and all block gaps; no mixed sources |
| F-18 | full content preservation unproven | document model, note mapping, PageModel, export | every source range represented exactly under split/duplicate policy |
| F19 / Iteration 001 | sign-band missing `סימן` + gematria number | parser/sign band composition, structural stamps, materialize | text content and number visible in DOM, HTML, PDF; page anchors/order |
| F-BL1 | full-math floor counted raw directives as body words | content accounting definition | historical audit methodology reconciled; no weakening of content requirement |
| F-BL2 | footnote markers יז./כג. missing | note start/marker enqueue/requeue | check actual current input, note IDs/markers per part, not global marker string only |
| F03-2 | early-ending pages / split-window/footnote commitment | findSplit, notes budget, fill of open columns | actual remaining capacity across all columns and legal break choices |
| F05 | folio position / folio suppressed on sign-open | PageModel folio geometry and show/count policy | folio placement, baseline, visibility by page type |
| F06/F07 | TOC, H1 duplicates and gate content | shaar/TOC structural planning | source items appear once, correct order and page refs |
| F09/F10 | parentheses and side-note size | style resolver, font resolver, shaping | family, font size, width, line pitch and per-word scope |
| F11 | header title source/continuation/slot positions | metadata, header builder, structural stamps | actual book metadata; header follows separator; all words and font slots |
| F12 | structural/empty pages | page templates, blank page furniture, numbering | no stray furniture; correct count/show; no unknown page type |
| U-8 | footnote budget and note space | footnote-budget, dp-planner, note renderer | reserve == placement == render; all columns; continuation; no overlap |
| U-9 | full-math / column bottoms balance | Planner, page geometry, diagnostics | don't revive P6/P7; verify explicit current C1–C12/approved user requirements instead |
| U-10 | AQ absolute factor / stretch semantics | balancing, settings, line heights | setting value changes intended geometry only; no unauthorized stretch |
| U-11/U-14 | MeasureAPI safety and API boundaries | measure-api, fonts, projectors | no mixed measurement authority or repeated font resolution |
| U-15 | heading alignment | headings, settings, page model | map to current side-heading alignment requirement and ensure stored setting |
| U-16/U-17 | prior validation/spec/check workflow issues | historical audit docs | do not implement test infrastructure; preserve valid user-level requirement only |
| M1–M4 | fonts registration, preface/heading font, mark advance contract | font loader, settings, MeasureAPI, shaping | actual font registered and same shaping metrics in all environments |
| W1/W2 | window flags missing in projection / first word wrong edge | line model, PageModel, projector | two narrow lines and exact first-word placement, no false audit/spacing |
| S1 | sign-band stamped lines counted as body lines | PageModel kinds, reading order | structural bands excluded from body line accounting but rendered as bands |
| RC-1 | bracket membership rule drops opening word | bracket scanner, overlay generation | correct scope for unmatched opener/closer and source mapping |
| RC-2 | introduction body 12pt vs 11.5pt | imported settings/style pipeline | source profile and visible font size/line pitch |
| RC-3 | sign rail/letter position | page template, span exemption, gate | marker centered in correct sign strip; no horizontal shift |
| RC-4 | margin notes wrong side/box/pitch/centering | side-note anchor, page side, geometry projector | side by anchor column, 50.5 width/9.6 pitch if still approved; actual ink bounds |
| RC-5 | page fill and column capacity | dp-planner/findSplit/pushLines | open-column free capacity sum, no whole-block move leaving empty space |
| RC-F1 | H3 band overlap with body | planner band anchor/shadow, capacity | both columns reserve same y-span; note budget included |
| RC-F2 | H2-bottom ornament overlaps title | ornament plan and header geometry | one rect/geometry source; correct reserve and actual ink gap |
| RC-F3 | chapter-end ornaments overlap text | usedHeight, AQ, capacity, flowTop | planner accounting uses final rendered geometry, including notes and spans |
| RC-A1 | DOM concatenates adjacent line words | DOM line/item semantics | text extraction and copy preserve separation without visual false spaces |
| RC-A2 | DP raggedEnd creates sparse lines | line breaker policy and cost | user-approved p-cut semantics; don't blindly force legacy style or use old PDF |
| RC-C1 | wrapped H2 pushes H3/flow top incorrectly | page templates, span anchor, replan | top flow incorporates all wrapped heading rows and rebuilding TOC pages |
| RC-D1 | heading escort sees adjacent side-note block as empty | planner keep-with-next | following text is resolved across side-note blocks and full paragraph structure |
| RC-E1 | H2/H3 decoration anchor/capacity mismatch | ornament-plan / geometry SSOT | anchor, spanning height, AQ and note budget align |
| RC-F5 | folio y-position and show on sign pages | folio geometry & profile policy | baseline and page-type visibility per user decisions |
| RC-F7 | paragraph gap 4px leading vs 7px trailing | Planner, paragraph item height, splitting/escort/bands | inspect current code after 24Nov; no blind application; resolve if current requirement requires it |
| R10 Iteration 003 | gate font weight/family wrong | font key resolution and block style | literal font identity vs heading role key; HTML/PDF weight parity |
| F1–F3 Iteration 005 | H3 band overlap and ornaments | planner/decorations | current placements and ink bounds; no geometry hidden in renderer |
| S74 | FrankReal combining marks in PDF | shaped GIDs/offsets/PDF subsetter | exact word and broad fonts/clusters on real PDF; PDF visual mark attachment |
| TYP-SHAPING-01 | no production shared shaping | itemization/MeasureAPI/LineModel/PageModel/renderers | production ShapedRun integration, not POC |
| CFF `manualReviewRequired` | 47 geometry outlier fonts | conversion and font catalog | manual review and approved support matrix; no mass activation |
| `Invalid string length` | large whole-document serialization | hashing/serialization/Worker state/export | live large doc and recovery with short doc afterward |
| Gate SVG black/gray | SVG color parse or unsupported vector ops | parseColor/SVG/PDF image XObject | real PDF raster and color checks across gate assets |
| DOCX images | importer ignores embedded image relationships | DOCX parser/asset model/export | explicitly support, or warn/document no support; never silently discard |
| UI sync | editor/preview link reported missing | token/source map, page virtualizer, preview events | two-way manual browser use on current live deployment |
| H7 typography | words in side heading visually corrupted | shaping, inline model, side-note renderer | single H7 word and multiple H7 notes; spacing/positions |
| DOM header position | header should be under separator line | header PageModel geometry | verify y/height from PageModel and PDF/HTML, not offset patch |

## 12. רשימת הכפילויות ההיסטוריות D1–D15

מפת `ENGINE_DUPLICATION_REGISTER.md` תיעדה 15 משפחות כפילות. הן אינן כולן בהכרח קיימות היום; כל אחת דורשת source re-check:

| D-ID | כפילות/סיכון שתועדו | אימות עדכני נדרש |
|---|---|---|
| D1 | font width/factor tables בארבעה מקומות | לרכז מקור font shaping/metrics אחד; לבדוק tables שהועתקו ל-PDF/legacy |
| D2 | word widths measured פעם בשבירה ופעם ב-projector | לאתר כל `measureTextWidth`; PDF/HTML/DOM צורכים LineModel shaped geometry |
| D3 | justify gap formula במספר מקרינים/הערות | לוגיקת glue allocation אחת בזמן layout; מקרינים לא מחשבים מחדש |
| D4 | baseline calculations בכמה מודולים | baseline/offsets מגיעים מה-ShapedRun/LineModel/PageModel בלבד |
| D5 | line-height נבנה מחדש ב-planner | LineModel measured pitch נשמר ונצרך |
| D6 | column used-height sums duplicated | helper/contract אחד ל-height accounting; כולל spans, notes, AQ, tail gaps |
| D7 | note wrapping duplicated ב-budget/planner/renderer | note line model אחד המשמש budget ו-placement ו-output |
| D8 | folio/header geometry PDF vs DOM | furniture geometry stamped once in PageModel |
| D9 | FIT epsilon values copied | one documented numeric tolerance in engine; no per-module variants |
| D10 | legacy constants copied into DOM/PDF | shared geometry/settings source; remove old copies when legacy retired |
| D11 | estimate-and-wrap repeated | one measure/wrap result, not re-estimate at projection |
| D12 | px/pt/mm conversions scattered | `typography/units.js` or single unit contract |
| D13 | multiple MeasureAPI instances/setup | one environment and shaped run per job; per-face views must share same font version/metrics |
| D14 | positive example of shared authority | preserve as pattern: one model field consumed by all targets |
| D15 | bracket/marker scanning duplicated | one parser/scope structure; no repeated regex reconstruction after split |

**שער:** לכל D1–D15 יש status current: `removed`, `still-live`, `boundary-adapter`, `necessary-independent`, `unverified`. `removed` דורש source refs/callers; לא די בהעברת helper למקום אחר אם עדיין יש חישוב מחדש.

## 13. ממצאי תמונות/Assets/Fonтs שמחייבים אימות חוזר

Stage1 E/F audit העלה historically:

1. no image picker in UI.
2. DOCX drawing/media not imported.
3. extension-based file classification; no magic bytes in old path.
4. raster `media:null` has no consumer.
5. separate theme-set mechanisms (one test-only, one live).
6. Worker asset registration handles SVG path more fully than raster.
7. no actual raster metadata parsing; width/height declared only.
8. PDF writer did not draw raster `d.image` and custom-page images in old path.
9. HTML/DOM uses CSS background image and 100% stretch in some cases; SVG ink may use contain.
10. `imud:` registry duplicated UI and Worker.
11. 1,315 WOFF2 fonts and ~443 SFNT catalog entries reported; PDF route relies on TTF/SFNT font slots.
12. custom page invalid images were dropped with error string rather than preserved.

Stage8 later says images became first-class in PageModel and transport. Therefore all eleven points must be rechecked against the current source and current PageModel/exports. Do not report them as current defects without verifying; do not report them closed merely because Stage8 claims them. The question is: does every supported asset type travel to DOM/HTML/PDF and project correct bounds/content?

## 14. Stage closure reports — מה בדיוק צריך להיבדק מחדש

| Report | Historical claim | Mandatory re-verification |
|---|---|---|
| `02_S7_CLOSURE_REPORT.md` | PageModel/invariants/geometry closure | current schema version, identity, glyph fields, immutable output, consumers |
| `03_S8_CLOSURE_REPORT.md` | materialization and projection pieces | current DOM/HTML/PDF same PageModel; zero remeasure; assets/notes/gates/fonts all targets |
| `04_S9_CLOSURE_REPORT.md` | header/folio/TOC and numbering closed | per-slot actual behavior and visual output; correct page anchors and styles |
| `05_S10_CLOSURE_REPORT.md` | UI/settings panels and controls | actual app browser operations, editor sync, settings effect/save/restore, errors |
| `02_S11_S13_COMPLETION_REPORT.md` | later S11–S13 functionality | exact list of requirements, branch/commit, status in main vs feature branch, live UI and output |
| `STAGE8_RENDER_PROJECTIONS.md` | six slices and projections | branch/commit current, DOM/HTML/PDF artifact, shaped glyph gap, images |
| `STAGE9_CUTOVER_MAP.md` | dispatch points and legacy inventory | current code vs stale line refs, current runtime, no legacy route in production |
| `STAGE9_SHADOW_*v5*` | 13/13 semantic gates | semantic assertions don't prove geometry/glyph/rendering/cutover; verify current implementation |
| `STAGE1_CAPABILITY_MAP.md` | 99 feature rows; some statuses uncertain | reconcile each row after later stage/iteration changes; no stale “verified” |
| `IMPLEMENTATION_STATUS.md` | 98 items mapped | each item links to code/commit/current output; percentage is not acceptance |

---

# חלק ה — מסמכי המחקר שנכללו במלאי ונספח מקורות

## 15. אינדקס דוחות הביקורת (`audits/`) — מלאי Markdown שנמצא בענף שנבדק

ב-tree של `engine/legacy-parity-preview-20261119` אותרו 109 קובצי Markdown תחת `audits/`. להלן הרשימה המלאה, מקובצת לפי תחום. זהו **אינדקס המקורות** שממנו יש לנהל reconciliation. עצם הופעת מסמך ברשימה אינה אומרת שכל שורה בו נקראה בשלמותה או שכל טענה שבו אומתה. דוחות המפתח המאוחרים והדוחות העוסקים בחסמים הטריים נקראו/נותחו לעומק שונה; חובת הקריאה המלאה של מקורות ארוכים/ארכיוניים נשארת בשלב 1.

### 15.1 ביקורת מצב, ארכיטקטורה ומדיניות

1. `audits/01_PROGRESS_AUDIT.md`
2. `audits/ENGINE_CURRENT_STATE.md`
3. `audits/ENGINE_RUNTIME_PATHS.md`
4. `audits/ENGINE_DUPLICATION_REGISTER.md`
5. `audits/ENGINE_CONTRACT_9C3.md`
6. `audits/GOLD_V21_GAP_ANALYSIS.md`
7. `audits/IMPLEMENTATION_STATUS.md`
8. `audits/STAGE1_CAPABILITY_MAP.md`
9. `audits/STAGE1_GATE_CROSSWALK_2026-11-19.md`
10. `audits/STAGE1_MAP_FORENSIC_FINDINGS_2026-11-19.md`
11. `audits/STAGE1_MAP_RECONCILIATION_2026-11-19.md`
12. `audits/STAGE1_MAP_RECONCILIATION_PROMPT_2026-11-19.md`
13. `audits/STAGE1_MAP_REVIEW_2026-11-19.md`
14. `audits/STAGE1_OPEN_DECISIONS_RECONCILIATION_2026-11-19.md`
15. `audits/RELATED_REPOSITORY_REUSE_AUDIT.md`
16. `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md`
17. `audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md`
18. `audits/CONTINUATION_AUDIT_A_B_C_2026-11-21.md`
19. `audits/PARITY_SESSION_HANDOFF_2026-11-19.md`
20. `audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md`
21. `audits/NEXT_PERFORMANCE_OPTIMIZATION_PROMPT_2026-11-19.md`
22. `audits/P6_P7_D97_CLASSIFICATION.md` — historical reference only; do not revive P6/P7.

### 15.2 Stage closure and current engine stages

23. `audits/02_S7_CLOSURE_REPORT.md`
24. `audits/03_S8_CLOSURE_REPORT.md`
25. `audits/04_S9_CLOSURE_REPORT.md`
26. `audits/05_S10_CLOSURE_REPORT.md`
27. `audits/02_S11_S13_COMPLETION_REPORT.md`
28. `audits/STAGE2_MODEL_COVERAGE.md`
29. `audits/STAGE3_MEASUREMENT.md`
30. `audits/STAGE4_LINE_ENGINE.md`
31. `audits/STAGE5_UNIFIED_PLANNER.md`
32. `audits/STAGE6_PAGE_ITEMS.md`
33. `audits/STAGE7_PAGE_MODEL.md`
34. `audits/STAGE8_RENDER_PROJECTIONS.md`
35. `audits/STAGE8_SLICE6_INVENTORY.md`
36. `audits/STAGE9_CUTOVER_MAP.md`
37. `audits/STAGE9_SHADOW_2026-11-18.md`
38. `audits/STAGE9_SHADOW_canonical_corpus_2026-11-18_v5.md`
39. `audits/STAGE9_SHADOW_canonical_corpus_v5_2026-11-18.md`
40. `audits/STAGE9_SHADOW_very_long_2026-11-18_v5.md`
41. `audits/S9B_FINAL_VERIFICATION_2026-11-18.md`
42. `audits/S9B_H7_GRAMMAR_2026-11-18.md`
43. `audits/S9B_NOTES_GLUE_2026-11-18.md`
44. `audits/S9B_SHAAR_BACK_2026-11-18.md`
45. `audits/S9B_TOC_D107_2026-11-18.md`

### 15.3 Stage 1 forensic subsystem maps

46. `audits/stage1/README.md`
47. `audits/stage1/B_RUNTIME_PATHS.md`
48. `audits/stage1/C_DATA_MODELS.md`
49. `audits/stage1/D_GEOMETRY_MEASUREMENT.md`
50. `audits/stage1/E_F_IMAGES_AND_FONTS.md`
51. `audits/stage1/G_NOTES_ANCHORS.md`
52. `audits/stage1/J_SETTINGS_AUDIT.md`
53. `audits/baseline_S0/summary.md`
54. `audits/baseline_stage1/summary.md`

### 15.4 Settings, UI, measure, performance and product behavior

55. `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`
56. `audits/CATALOG_IMPLEMENTATION_COMPLETENESS_AUDIT_2026-11-19.md`
57. `audits/UI_OPERATIONAL_AUDIT.md`
58. `audits/MEASURE_API_SAFETY_U11_U14_2026-11-20.md`
59. `audits/U8_FOOTNOTE_BUDGET_2026-11-20.md`
60. `audits/U10_AQ_ABSOLUTE_FACTOR_2026-11-20.md`
61. `audits/U15_HEADING_ALIGNMENT_2026-11-20.md`
62. `audits/U15_U16_U17_CONTRACT_ADJUDICATION_2026-11-21.md`
63. `audits/PERFORMANCE_BASELINE.md`
64. `audits/PERF_MEASURE_API_ROOT_CAUSE_2026-11-19.md`
65. `audits/FULLMATH_FLOOR_ROOT_CLOSURE_2026-11-17.md`
66. `audits/H3_SPACING_OLD_STYLE_PARITY_2026-11-17.md`
67. `audits/PHASE1_BROWSER_ACCEPTANCE.md`
68. `audits/PHASE1_RUNTIME_TRUTH_SNAPSHOT_2026-11-25.md`
69. `audits/PHASE1_SOURCE_RECONCILIATION_2026-11-25.md`
70. `audits/PHASE1_DOM_HTML_PDF_GLYPH_PARITY_2026-11-25.md`
71. `audits/BIDI_UNICODE18_RUNTIME_2026-11-24.md`

### 15.5 Shaping, font inventory, conversion and CFF

72. `audits/ICU4X_HARFBUZZ_SHARED_SHAPING_POC_2026-11-25.md`
73. `audits/PRODUCTION_SHAPEDRUN_INTEGRATION_CONTRACT_2026-11-25.md`
74. `audits/SHAPING_CONTRACT_GAP_2026-11-24.md`
75. `audits/SHAPING_INTEGRATION_BOUNDARIES_2026-11-24.md`
76. `audits/CFF_GEOMETRY_AND_LSB_REVIEW_2026-11-24.md`
77. `audits/legacy-parity-iteration/iteration-007/EXECUTION_PLAN.md`
78. `audits/legacy-parity-iteration/iteration-007/FONT_AUDIT.md`
79. `audits/legacy-parity-iteration/iteration-007/CFF_STRESS_FINDINGS.md`
80. `audits/legacy-parity-iteration/iteration-007/CONVERSION_VISUAL_REVIEW.md`
81. `audits/legacy-parity-iteration/iteration-007/RENDERER_SHAPING_GAP.md`
82. `audits/legacy-parity-iteration/iteration-007/S74_ROOT_FIX_2026-11-26.md`
83. `audits/PHASE2_FRANKREAL_HARFBUZZ_PROBE_2026-11-25.md`

### 15.6 Legacy parity iterations 001–006

85. `audits/legacy-parity-iteration/iteration-001/ROOT_CAUSE.md`
85. `audits/legacy-parity-iteration/iteration-001/FIX.md`
86. `audits/legacy-parity-iteration/iteration-001/TESTS.md`
87. `audits/legacy-parity-iteration/iteration-001/PDF_COMPARISON.md`
88. `audits/legacy-parity-iteration/iteration-002/ROOT_CAUSE.md`
89. `audits/legacy-parity-iteration/iteration-002/FIX.md`
90. `audits/legacy-parity-iteration/iteration-002/TESTS.md`
91. `audits/legacy-parity-iteration/iteration-002/PDF_COMPARISON.md`
92. `audits/legacy-parity-iteration/iteration-003/ROOT_CAUSE.md`
93. `audits/legacy-parity-iteration/iteration-003/FIXES.md`
94. `audits/legacy-parity-iteration/iteration-003/TESTS.md`
95. `audits/legacy-parity-iteration/iteration-003/PDF_COMPARISON.md`
96. `audits/legacy-parity-iteration/iteration-003/CONTENT_RECONCILIATION.md`
97. `audits/legacy-parity-iteration/iteration-003/VISUAL_PARITY_INVENTORY.md`
98. `audits/legacy-parity-iteration/iteration-004/AUDIT.md`
99. `audits/legacy-parity-iteration/iteration-005/ROOT_CAUSE.md`
100. `audits/legacy-parity-iteration/iteration-005/FIXES.md`
101. `audits/legacy-parity-iteration/iteration-005/BUILD_PROVENANCE.md`
102. `audits/legacy-parity-iteration/iteration-006/ROOT_CAUSE.md`
103. `audits/legacy-parity-iteration/iteration-006/FIXES.md`
104. `audits/legacy-parity-iteration/iteration-006/HANDOFF.md`

### 15.7 Export/preview evidence and benchmarking artifacts

105. `audits/parity-signature/README.md`
106. `audits/parity-signature/benchmark/2026-11-21-4f58947/BENCHMARK_REPORT.md`
107. `audits/pdf-export-forensic-comparison/README.md`
108. `audits/preview-evidence/2026-11-20-c5fec51/README.md`
109. `audits/preview-evidence/2026-11-21-4f58947/README.md`
110. `audits/legacy-parity-iteration/iteration-004/AUDIT.md` is already item 97; no duplicate source is counted. The current list contains 109 unique Markdown files as enumerated from the branch tree.

**הערה:** הרשימה ממוספרת לפי קבוצות; לפני הכרזה על שלב 1 סגור יש להריץ *מלאי קבצים read-only* ולוודא שהספירה/שמות תואמים ל-tree SHA שננעל בשלב 0. אין להריץ audit tool על התוכנה; קריאת Git tree ותוכן קבצים היא מחקר מקור בלבד.

## 16. מקורות קנוניים מחוץ ל-`audits/`

- `spec/README.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`
- `spec/01_MASTER_SPECIFICATION.md`
- `spec/02_MASTER_WORK_PLAN.md` (historical)
- `spec/03_UNIFIED_ITEM_CONTRACT.md`
- `spec/Software_Requirements_Specification.md`
- `spec/תכנית לשיפור תוכנת עימוד Red.MD` (historical)
- `spec/תוכנית הפעלה לחמשת הסוכנים.md` (historical)
- `CANONICAL_DOCUMENT_MODEL.md`
- `README.md`
- `WORKLOG.md`
- `ISSUE_REGISTRY.md`
- `DECISIONS.md`
- `OPEN_QUESTIONS.md`
- `AGENTS_TRACKING.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `very_long_test_text.txt` / `audits/very_long_test_text.txt`
- `red-build/src/**`, `red-build/ui/**`, `red-build/package.json`, `tools/**`
- `red-build/ui/assets/imud/**` (catalogs, settings sets, images, fonts, gates, ornaments)
- original repositories Red Old, IMUD_TORANI, V21/V23 and relevant branches/PRs as historical evidence only.

---

# חלק ו — סדר עבודה והגדרת Done

## 17. סדר עדיפויות ממשי

| עדיפות | תחום | למה קודם |
|---|---|---|
| P0-A | Git/deployment/source provenance | אסור לתקן או לאשר build לא מזוהה |
| P0-B | Runtime path / legacy switch / PageModel routing | בלי מסלול יחיד לא ניתן לדעת מה המשתמש מפעיל |
| P0-C | ShapedRun + Hebrew mark/glyph placement + shared DOM/HTML/PDF geometry | אין glyph-authoritative production path; S74 הוא תיקון רוחב בלבד |
| P0-D | content preservation / note IDs / `סימן` F19 / large document failure | אובדן/שיבוש תוכן או קריסה |
| P0-E | same PageModel to DOM/HTML/PDF, no re-typeset | תוצרי מוצר שונים אינם קבילים |
| P0-F | settings defaults/import and explicit failures | כל output עלול להיות שונה עקב settings loss |
| P1-A | Planner/line breaking/column balance/gaps/H3/H7 | איכות עימוד וליבה הנדסית |
| P1-B | notes, headers, folio, TOC, gates, ornaments | תפקוד ספר שלם |
| P0-G | תמונות inline / raster / DOCX media / assets בכל היעדים | D-107 כולל יכולות תוכן; קיימות ראיות היסטוריות לאובדן/היעדר parity |
| P1-C | background-* controls, assets/images/DOCX/ZIP | יכולות שלא הוכח שהן מחוברות בכל נתיבי הקלט/פלט |
| P1-D | UI sync and all actions | product usability |
| P1-E | worker recovery/security | production reliability |
| P1-F | ביצועים וזיכרון על very_long | חוב P-2/P-3 מול חוזה 9C.3; אין benchmark אוטומטי, אך אין לסווג כאופציונלי ללא הכרעה |
| P2-A | code simplification/dead code/dependency cleanup | only after correctness and cutover |
| P2-B | developer docs/release notes/operations | after architecture stable |

## 18. שערי ההתקדמות (Gates)

| Gate | What must be true | Evidence level required |
|---|---|---|
| G0 — Source identity | branch/commit/deployment/source assets known; no work lost | E2 |
| G1 — Requirement closure | 109 audit docs and project sources inventoried; key history and 57 remaining Library files reconciled; user decisions authoritative | E2 |
| G2 — Runtime truth | single active engine path, all entry/exit paths identified | E2 + E3 |
| G3 — Content model | source identities and content preserved for every item kind | E2 + E4 |
| G4 — Shaping/measurement | same shaping output drives line break and all renderers | E2 + E4 |
| G5 — Line breaking | one breaker, correct p-cut/p-end/windows/markers/brackets | E2 + E3 + E4 |
| G6 — Planner/geometry | one planner and capacity source; no hidden correction | E2 + E3 + E4 |
| G7 — Notes/page items | all supported note/page items and anchors survive all output paths | E3 + E4 |
| G8 — PageModel/rendering | DOM/HTML/PDF consume same immutable model, glyph-level parity | E2 + E4 |
| G9 — Settings/UI | controls/defaults/migrations persist and operate | E3 |
| G10 — Reliability | large/small/recovery/error cases work; no stale state | E3 |
| G11 — Cutover | no runtime legacy path or hidden fallback remains | E2 + E3 |
| G12 — Deployment | live source/build/Worker/assets same candidate | E2 + E3 |
| G13 — Release acceptance | user approves a complete candidate with known limitations disclosed | E3 + E4 + E5 |


### מצב השערים לפי הביקורת הנוכחית

| Gate | מצב 27.11 לאחר W-1..W-7 | החלטת ביקורת |
|---|---|---|
| G0 | PARTIAL | קוד live SHA ידוע; branch/PR promotion ל-main לא הוסדר |
| G1 | PARTIAL | שבעת דוחות SPLIT קיימים; 57 קובצי Library/היסטוריה לא הושלמו; D-116 חסר ב-main |
| G2 | PARTIAL | UI preview/export מחוברים ל-PageModel; renderer/export legacy residue נשאר |
| G3 | PARTIAL | מיפוי מסמך/פריטים קיים; image/DOCX/media completeness לא הוכחה |
| G4 | BLOCKED | HarfBuzz runtime staged/loaded אך pipeline אינו צורך אותו; אין ShapedRun ב-LineModel/PageModel |
| G5 | PARTIAL | LineItems/MeasureAPI פעילים אך pre-shaping split נשאר |
| G6 | PARTIAL | ליבת DP מתועדת; אין להחזיר F7 ל-legacy parity; בדוק רק מול החלטות משתמש |
| G7 | PARTIAL | S75 body-first חסר; note/image content עדיין דורש אימות מוצר |
| G8 | PARTIAL | PageModel משותף, אך DOM browser shaping ו-PDF per-character CID נפרדים |
| G9 | PARTIAL | W-3/W-5 מחוברים; background controls חסומים; UI acceptance מלא לא נעשה |
| G10 | PARTIAL | תיקוני serialization קיימים; אין כאן בדיקה עדכנית של fail/recover ו-large→small |
| G11 | PARTIAL | typesetter legacy הוסר; renderer/exports היסטוריים נשארו; PR #73 אסור למיזוג כפי שהוא |
| G12 | PARTIAL | live product SHA `bd8fa9d` מזוהה; source build-info placeholder ו-timestamp provenance דורשים יישוב |
| G13 | NOT ACCEPTED | אין E5 קבלת משתמש ואין E4 מלא לכל התוצרים והיכולות |

**Gates are not automated test gates.** They are manual source-review and manual product-artifact gates. If user’s prohibition prevents one evidence method, the plan does not secretly substitute a workflow; it records the limitation.

## 19. מחזור עבודה לכל תיקון

1. לבחור REQ/Issue אחת.
2. לקשור אותה למקור user decision ולדוח ההיסטורי.
3. לבדוק current code and consumers manually.
4. לשחזר בעזרת שימוש אמיתי בתוכנה או artifact אם אפשר; אם אין reproduction, לתעד מה חסר.
5. לאתר root cause בפונקציה/שכבת data flow הראשונה שבה הערך משתבש.
6. לתכנן שינוי קטן המתקן את מקור הסמכות, לא את התסמין.
7. לעבור על כל callers/consumers והגדרות תלויות.
8. לבצע שינוי ממוקד ולשמור commit ברור.
9. לבנות ידנית לפי build process הקיים, בלי test command/workflow.
10. לבדוק source bundle provenance ומבנה Worker.
11. לפרוס ידנית רק אם אפשר ללא workflow; אם לא, לעצור ולציין blocker.
12. לבצע שימוש ידני בדפדפן בהתאם להיקף.
13. לייצא HTML/PDF אמיתי אם רלוונטי ולבדוק ב-Python.
14. לסגור רק מה שהוכח; יתרת השורש נשארת backlog.
15. לעדכן את אותו פנקס/תוכנית; אין לפתוח מסמך מעקב מתחרה.

## 20. פורמט דיווח progress

כל עדכון למשתמש יהיה קצר ומבוסס:

- **בעיה:** התופעה ומה המשתמש אמור לראות.
- **שורש:** פונקציה/שכבה/נתון שגורמים לה.
- **שינוי:** קובץ/פונקציה ותיאור השינוי.
- **Commit:** hash וקישור.
- **Build/Deploy:** מה נבנה, מה פורסם, source commit ומה עדיין חסום.
- **תוצאה מעשית:** מה נבדק באתר/ב-HTML/PDF.
- **פתוח:** מה עדיין לא הוכח.

אין לדווח “הכול הושלם”, “עבר” או “תוקן” כאשר יש רק קוד/commit/build. אם אין תוצאה מוחשית, לדווח בדיוק מה חסר ולמה.

---

# חלק ז — הגדרת קבלה מפורטת לכל שכבת המוצר

## 21. מטריצת קבלה פונקציונלית

| תחום | דרישת Production | איך מאמתים ידנית |
|---|---|---|
| TXT input | טקסט מלא ו-Unicode נשמר | פתח מסמך עברי/ארוך; השווה source ו-output |
| DOCX input | תמיכה מתועדת בסוגי DOCX שהמוצר מבטיח | ייבא מסמך עם headings/runs/footnotes/images; ודא שאין השמטה שקטה |
| Project ZIP | round-trip של settings/text/assets | יצא, פתח מחדש ובדוק תוכן ומשאבים |
| Parser | metadata/heading/note grammar תקינים | דוגמאות תקינות וחריגות; בדוק source ranges |
| Settings | כל control מחובר, נשמר ומשפיע | שנה ערך, שמור, רענן/פתח מחדש ובדוק תוצאה |
| Fonts | בחירת family/face מדויקת | בדוק גופן משובץ, גליפים ורינדור |
| Shaping | shared glyph clusters and offsets | בדוק FrankReal/Guttman/mixed Hebrew-Latin |
| Line breaker | lines follow constraints, content preserved | בדוק p-cut/p-end, long words, marks, markers, windows |
| Planner | page/column flow and balance deterministic | עמודים עם H2/H3/spans/notes/short terminal section |
| Footnotes | marker/body/anchor/continuation coherent | מספר הערות, עמודים, פיצול ושורה אחרונה |
| Side notes H7 | glyph spacing, margin side, anchoring and alignment correct | H7 יחיד, רצף H7, עמוד עם שתי עמודות, user alignment setting |
| Endnotes | dedicated pages, markers, numbering | long endnote and multi-page continuation |
| TOC | styles/levels/page targets/links correct | general/detail, inline/collapse, long wrapped rows |
| Headers | under rule, right source/font/position | recto/verso, H2 multiple lines, long title |
| Folio | correct value/visibility/position | body, TOC, blank, gate, endnote, sign-open |
| Gates | fonts/colors/anchors/ornaments correct | main/sub/back gate; SVG complex fills/strokes |
| Images | aspect/dimensions/placement/exports correct | PNG/JPEG/SVG in body/gate/custom page as supported |
| DOM | page model and source sync correct | scroll, click, selection, editor sync, virtualized pages |
| HTML | standalone, offline assets, same layout | open clean browser with app closed/network unavailable |
| PDF | glyph-level and geometry parity | PyMuPDF/pdfplumber/font inspection and viewer crops |
| Large document | no crash, loss or worker stuck | very_long through ordinary UI, then short doc |
| Recovery | cancel/failure doesn't poison next job | intentionally cancel or use a malformed file; recover |
| Deployment | source/build/worker/assets match | build-info, deployed hashes and real browser requests |

## 22. Final Production stop-ship conditions

Any one of the following blocks release:

- proven or suspected loss/duplication of source text, note, marker, image or source anchor.
- ShapedRun not integrated but product claims full Hebrew font/nikud/trop support.
- FrankReal mark placement difference persists in PDF.
- DOM/HTML/PDF line/glyph positions diverge materially from same PageModel.
- live engine identity unclear, legacy dispatch reachable or export re-typesets.
- silent font/asset fallback.
- user-visible control has no effect or settings are lost on import/save.
- large document failure or stale worker result after failure.
- gate SVG/raster/custom-page item missing or color wrong in PDF.
- note marker/body split, duplicate, or continuation omission.
- user-reported H7/side-heading corruption or header position remains unexplained.
- TOC title/level/number/page target wrong.
- DOCX/import feature silently discards content it claims to support.
- build source, Worker bundle and deployed site are from different commits.
- deployment only possible by triggering forbidden workflows.
- any unapproved change to defaults/font/geometry or reintroduction of P6/P7.

## 23. Known limitations policy

A product may ship with explicitly limited features only if the user approves the limitations and the UI describes them. Examples:

- raw WOFF2 unsupported for PDF; supported fonts limited to listed normalized assets.
- no embedded DOCX images; import must warn before dropping them or be declared unsupported.
- no raster images in a certain export target; export must warn/fail, not silently omit.
- unsupported SVG features produce a visible issue.

A limitation is not accepted merely because it is difficult to implement. It must be categorized by impact, user expectation, source documents and acceptance.

---

# חלק ח — מסקנת המחקר ותכנית ההכרעה

## 24. מה אפשר לקבוע בביטחון מהמחקר שנעשה

### 24.1 עדכון לאחר ביקורת שבעת חלקי הסוכן

- שבעת מסמכי הביקורת נכתבו והועלו ל-main; הם שימושיים כאינדקס וכטענות root-cause, אך נקודת הסקירה שלהם `197225d` קדמה לקומיטי W-1–W-7 המאוחרים.
- קיים ענף fix עם תיקוני מוצר אמיתיים W-2, W-3, W-5 ו-W-7; W-4 תיקן אמת-חוזה בלבד; W-6 תיקן סנכרון תיעוד בענף; W-1 שינה artifacts של בדיקות ולכן אינו נחשב תיקון מוצר.
- קוד ה-preview וה-export הפעיל משתמש ב-PageModel, אך יש עדיין `dom-renderer` ו-legacy exports בתוך `export-api`.
- D-116 הוא הוראת משתמש מפורשת: headers מעל הקו. התיקון RC-HDR2 קיים ונפרס; יש לסנכרן את ההחלטה ל-main.
- ה-sanitizer של W-5 ושני תיקוני ה-ghost של W-7 נראים מחוברים בקוד. ה-rect color conversion תוקן ב-DOM ונפרס. ה-Worklog מדווח על בדיקת Live/PDF, אך artifacts עצמם אינם committed ולא נבדקו מחדש בביקורת זו.
- S74 מחבר מדיניות zero-advance לסימני ניקוד ב-/W של PDF; זו הפחתת רוחב מכוונת, לא מערכת shaping כללית.
- ה-Worker מאתחל HarfBuzz/Unicode 18 ומעביר runtime ל-typeset, אך `pipeline.js` אינו צורך אותו. אין Production ShapedRun.
- S75 body-first, תמונות ורקעים, DOCX images, ביצועים, 57 מקורות היסטוריים וקבלת UI מלאה נשארו פתוחים או לא מאומתים.


1. יש בפרויקט תוכנית ארכיטקטונית קנונית של עשרה שלבים, עם מודל תוכן אחיד, מדידה/שבירה חד־פעמית, Planner יחיד, PageModel immutable והקרנות טהורות.
2. יש דוחות שטוענים ששלבים 1–7 הושלמו וששלב 8 קיבל שש פרוסות, אך אלה חייבים להיבדק מול source HEAD העדכני.
3. יש מפת cutover/PR #73 שמראה שהסרת ה-legacy עדיין הייתה עבודה פתוחה, ו-PR #73 לא מוזג.
4. main והענף המאוחר diverged באופן משמעותי; אסור להתייחס אליהם כאל אותה גרסה.
5. Pages root מציג build ניסיוני של Unified מענף הניסוי ב-commit מוקדם יותר מה-branch HEAD, ולא main.
6. יש פגם shaping/PDF אמיתי שתועד כמדידה באותו PageModel: FrankReal marks רחבים/ממוקמים שונה ב-PDF.
7. HarfBuzz/ICU4X POC קיים, אך דוחות אומרים שהמימוש Production לא שונה עדיין כדי לשאת GID/cluster/offset through LineModel/PageModel/renderers.
8. CFF conversion stress אינו אישור להמרה המונית; `massConversionApproved=false` נשאר בדוח.
9. Worklog 27.11 מדווח על תיקון serialization גדול ועל תיקון gate SVG color, אך הראיות המתוארות אינן תחליף ל-live acceptance ו-PDF inspection.
10. Stage1 forensic reports זיהו historically DOCX image loss, raster/PDF gaps, multiple geometry calculations, settings/Text ID issues, note-anchor risks, and UI/runtime ambiguities. Stage8 and Iterations may have closed some; current source must decide.
11. Phase1 snapshot 25.11 documented a real live long-document run and exports (691 pages) with deterministic hashes, but left zero-legacy trace, full UI interactions, full console/network review and glyph parity open. That is not proof for 27.11 build.
12. There is no single document that currently proves every historical “done” claim in all five evidence layers E0–E5.

## 25. מה עדיין לא ניתן לטעון

- לא ניתן לטעון שהמנוע הישן הוסר לחלוטין מה-runtime.
- לא ניתן לטעון שה-PageModel carries full shaped-glyph geometry.
- לא ניתן לטעון ש-DOM/HTML/PDF are glyph-parity identical.
- לא ניתן לטעון שמסמכים גדולים עובדים בקביעות לאחר תיקון `Invalid string length` בלי שימוש חי.
- לא ניתן לטעון שכל gate SVG/raster image/custom page appears correctly in PDF.
- לא ניתן לטעון שכל פעולות ה-UI וה-editor-preview synchronization תקינות.
- לא ניתן לטעון שכל הגדרות המשתמש ו-Text IDs reconciled from current source.
- לא ניתן לטעון שכל 109 report contents and the historical Library archive have been read line-by-line; מלאי 109 Markdown documents אותר, מקורות מפתח נחקרו, והשלמת קריאת המקורות הנותרים היא משימה מפורשת בשלב 1.
- לא ניתן להכריז Production-ready לפני E3/E4/E5.

## 26. סדר הביצוע המומלץ בפועל

1. שער 0: source/branch/deployment truth, לא לשנות קוד.
2. שער 1: להשלים את קריאת המקורות ההיסטוריים ואת Master claim ledger.
3. שער 2: source-level runtime map; להכריע את PR #73/PR #72 בלי workflows.
4. לתקן את Production shaping/glyph model לפני fine tuning של שורות; זה חוסם את כל עבודת typography/export.
5. להשלים content/source identity, settings resolver, assets ו-LineModel.
6. להשלים Planner/balance/H7/notes/page items ושורשים שנותרו (כולל F7 לאחר בדיקת current source).
7. להבטיח PageModel ו-projections משותפים.
8. לסיים את legacy cutover והסרת runtime duplication.
9. להשלים UI, imports, settings, Worker, serialization and recovery.
10. Manual live acceptance על short, representative, very_long.
11. HTML/PDF artifact inspection מלא עם Python.
12. build/deploy provenance ידני ללא workflows; אם חסום, אין הכרזת Production.
13. קבלת משתמש מפורשת.

## 27. הוראת־על לסגירה

לא סוגרים “שלב” מפני שהמסמך שלו אומר `complete`. לא סוגרים “תיקון” מפני שקיים commit. לא סוגרים “parity” מפני שמספר עמודים זהה. לא סוגרים “content preservation” מפני שטקסט PDF extraction שווה כאשר glyph placement עדיין שגוי. לא סוגרים “engine unified” מפני ש-`profile=unified` מופיע ב-build-info. לא סוגרים “settings complete” מפני שכל keys רשומים.

**סגירה אמיתית היא שילוב של קוד נכון, חיבור למסלול המוצר, שימוש ידני בתוכנה החיה, בדיקת artifact והכרעת משתמש.** כל עוד אחד מאלה חסר, מצב הדרישה הוא חלקי או לא מאומת.

---

## 27.1 הוראת המשך מעודכנת לסוכן AI — מחייבת

**אתה ממשיך את אותה תוכנית; אל תתחיל מחקר חדש מאפס ואל תעתיק את מסמכי SPLIT כראיות סגירה.** נקודת העבודה היא ענף `fix/pdf-header-baseline-20261127` ב-HEAD `7100d103...`; ה-code deployment האחרון הוא `bd8fa9d` ב-gh-pages. `main` הוא `ae234613...` ומכיל את מסמכי SPLIT. PR #73 ישן, stale וכולל workflows; אסור למזג אותו או להפעיל workflows.

המשימות הבאות לפי סדר:

1. **עדכון מסמכי אמת:** סנכרן את D-116 ל-main `DECISIONS.md` בלי שינוי ניסוח ההחלטה; תקן את כותרות העדכון ב-DECISIONS/WORKLOG; הוסף מפת קישורים מ-SPLIT/1–7 ל-WORKLOG/ISSUE_REGISTRY ולענף ה-fix. אין לשנות קוד בשלב זה.
2. **W-2 cutover residue:** עקוב ידנית אחרי כל import/caller של `dom-renderer.js`, `legacy-projector.js`, `exportHtml` ו-`exportPdf`. הפרד קוד שאינו נצרך בנתיב המוצר. קבע מה חייב להימחק ומה ניתן להוציא מן ה-production bundle. אל תשאיר מנוע/renderer שני כ-fallback. אל תבצע מחיקה לפני שמפת consumers מלאה.
3. **Shaping P0:** בדוק מדוע Worker טוען runtime staged ומעביר אותו ל-typeset אך pipeline אינו צורך אותו. יש לבחור: לשלב ShapedRun ב-production end-to-end או להוציא את runtime staged מנתיב ה-worker הפעיל עד שהאינטגרציה שלמה; אין לשמור gate runtime חובה שאינו מספק shaping בפועל. מימוש מלא חייב להיות itemization לפני split, immutable ShapedRun/ShapedGlyph, measurement/breaking על אותם advances, reshape ב-BOT/EOT, העברה דרך LineModel/PageModel, ו-DOM/HTML/PDF שמציירים GIDs/positions/offsets מהמודל.
4. **S74 acceptance:** שמור את `applyCombinedMarkPolicy` רק ככלל שמייצג את מדיניות המדידה; בדוק ידנית PDF אמיתי ויזואלית/גאומטרית האם הסימנים מוצמדים גם ב-x וגם ב-y, ולא רק אם רוחב ה-/W אפס. אל תטען שהבעיה נסגרה על סמך רוחב או extraction בלבד.
5. **S75 Notes:** לממש body-first כפי שהמשתמש אישר: הגוף זורם תחילה, הערות תופסות את החלל שמתחת עד 50%, המשכים/markers נשארים זהותיים; לחלופין, אם נדרשת הכרעת משתמש חדשה, להציג את הפער ולא להפוך W-4 לסגירה.
6. **Images/DOCX/background:** לבנות מפת יכולת נפרדת ל-inline images לפי D-107, raster/SVG/custom-page/background, תמונות בהערות שוליים, ו-DOCX `w:drawing`/relationships/media. לכל פריט לקבוע input→model→planner→PageModel→DOM/HTML/PDF. אין לסמן תמיכה אם קובץ מוצג ב-DOM אך חסר ב-PDF.
7. **Settings/import:** להשלים מפת כל import entry point: template JSON, project ZIP, style-set, legacy defaults, extension imports, persisted overrides. לקבוע איזה sanitizer/transform חל בכל נתיב. סורק W-7 הוא literal-only ואינו הוכחת כיסוי כללי.
8. **Performance:** אין להריץ benchmark או script. בדוק ידנית את הקוד של P-2/P-3 ואת שימוש `very_long_test_text.txt` באתר החי, תעד זמני תגובה בפועל אם נמדדו במהלך שימוש רגיל; התייחס לחוזה 9C.3 ולחוב 7.6–12.8x כבעיה פתוחה עד הכרעה. אל תסווג W-9 כאופציונלי על דעת עצמך.
9. **Manual product acceptance:** אחרי תיקוני הקוד, בדוק ידנית באתר החי את כל זרימת המשתמש: טעינת TXT, תבנית IMUD, settings persistence, editor-preview sync, virtualization, TOC, headers, notes/H7, gate, export HTML, export PDF, cancel/failure recovery, ואז `very_long_test_text.txt` ואחריו מסמך קצר. שמור artifacts אמיתיים (PDF/HTML/screenshots) כתוצרים שניתן לפתוח; אין OCR/VLM.
10. **Deployment/promotion:** פריסה ידנית בלבד אם אין workflow. בדוק build-info/asset cache/app bundle/Worker/font/assets. אין PR/merge עד שהשינוי מופרד מכל `.github/workflows` וכל test-only changes. אין force-push.
11. **דיווח:** לכל סעיף ציין `SOURCE_PRESENT`, `SOURCE_CONNECTED`, `LIVE_REPORTED`, `LIVE_VERIFIED`, `ARTIFACT_VERIFIED` או `USER_ACCEPTED`. אין להשתמש ב-“הושלם” בלי הרמה המתאימה. תעד מה לא אומת.

**איסורים חוזרים:** אין להריץ, לכתוב, לערוך או להוסיף בדיקות/סקריפטי בדיקה/workflows/CI; אין P6/P7 או legacy PDF parity כיעד; אין CSS/post-layout workaround; אין fallback או מנוע שני; אין מחיקות מסוכנות; אין הכרזת Production לפני קבלת משתמש מפורשת.

# נספח טכני — קבצי מקור מרכזיים לעקיבת קוד

הנתיבים להלן הם נקודות כניסה למחקר, לא רשימה סגורה. כל שינוי מחייב לעקוב אחר imports/callers/consumers באופן מלא.

## A. Engine core / parser / models

- `red-build/src/engine/core/pipeline.js`
- `red-build/src/engine/core/page-model.js`
- `red-build/src/engine/core/materialize.js`
- `red-build/src/engine/core/canonical-hash.js`
- `red-build/src/engine/core/events.js`
- `red-build/src/engine/model/document-model.js`
- `red-build/src/engine/parser/dfa-lexer.js`
- `red-build/src/engine/parser/block-tokenizer.js`
- `red-build/src/engine/parser/bracket-scanner.js`
- `red-build/src/engine/core/legacy-settings-map.js`
- `red-build/src/engine/core/settings-registry.js`

## B. Typography / shaping / fonts

- `red-build/src/engine/typography/measure-api.js`
- `red-build/src/engine/typography/font-metrics.js`
- `red-build/src/engine/typography/font-keys.js`
- `red-build/src/engine/typography/font-subset.js`
- `red-build/src/engine/typography/production-typography-runtime.js`
- `red-build/src/engine/typography/harfbuzz-shaper.js`
- `red-build/src/engine/typography/unicode18-bidi-runtime.js`
- `red-build/src/engine/typography/kp-linebreak.js`
- `red-build/src/engine/line/line-items.js`
- `red-build/src/engine/line/line-model.js`
- `red-build/src/ui/imud-library.js`
- `red-build/src/ui/worker-protocol.js`
- `tools/build-worker-bundle.js`

## C. Layout/planning/notes/items

- `red-build/src/engine/layout/dp-planner.js`
- `red-build/src/engine/layout/plan-model.js`
- `red-build/src/engine/layout/page-templates.js`
- `red-build/src/engine/layout/column-flow.js`
- `red-build/src/engine/layout/balancing.js`
- `red-build/src/engine/layout/headings-escort.js`
- `red-build/src/engine/layout/retreat-loop.js`
- `red-build/src/engine/layout/footnote-budget.js`
- `red-build/src/engine/layout/side-notes.js`
- `red-build/src/engine/layout/endnote-pages.js`
- `red-build/src/engine/layout/structural-stamps.js`
- `red-build/src/engine/notes/markers.js`
- `red-build/src/engine/decoration/ornament-plan.js`
- `red-build/src/engine/decoration/ornament-ink.js`
- `red-build/src/engine/decoration/shaar-pages.js`
- `red-build/src/engine/decoration/toc-builder.js`
- `red-build/src/engine/decoration/assets-import.js`
- `red-build/src/engine/decoration/svg-sanitize.js`
- `red-build/src/engine/import/docx-import.js`
- `red-build/src/engine/import/zip-reader.js`

## D. Renderers / exports / UI / workers

- `red-build/src/engine/output/pagemodel-dom-renderer.js`
- `red-build/src/engine/output/dom-renderer.js`
- `red-build/src/engine/output/export-api.js`
- `red-build/src/engine/output/geometry-projector.js`
- `red-build/src/engine/output/pdf-writer.js`
- `red-build/src/engine/output/pdf-mark-policy.js`
- `red-build/src/engine/output/html-export.js`
- `red-build/src/ui/browser-entry.js`
- `red-build/src/ui/app-shell.js`
- `red-build/src/ui/preview-tab.js`
- `red-build/src/ui/settings-panel.js`
- `red-build/src/ui/engine-worker-main.js`
- `red-build/src/ui/worker-client.js`
- `red-build/src/ui/worker-protocol.js`
- generated bundles under `red-build/ui/`

---

**סוף התוכנית.**


---

# נספח עדכון — מקורות ביקורת הסוכן שנוספו ב-27.11.2026

מסמכי הביקורת נמצאים ב-main תחת:

- `audits/SPLIT/1` — תמונת-על, אמת-ריצה, טופולוגיה ו-RC-HDR2.
- `audits/SPLIT/2.md` — pipeline, dp-planner, structural-stamps, balancing.
- `audits/SPLIT/3.md` — projector, PDF writer, DOM/HTML projection.
- `audits/SPLIT/4.md` — settings registry, legacy map, bindings, UI.
- `audits/SPLIT/5.md` — 20 נושאים היסטוריים.
- `audits/SPLIT/6.md` — W-1 עד W-9 ותשתית בדיקות היסטורית.
- `audits/SPLIT/7.md` — טבלת ממצאים מאוחדת ופסק-דין.

מסמכי התקדמות הקוד ב-branch `fix/pdf-header-baseline-20261127`:

- `WORKLOG.md` — רשומות 27.11 W-1..W-7; יש להתייחס אליהן כטענות עם רמות ראיה ולא כהכרעה אוטומטית.
- `ISSUE_REGISTRY.md` — סטטוסי F-2/F-3/F-4/F-J והחובות הקשורות.
- `DECISIONS.md` — D-109..D-116; D-116 חסר ב-main ויש לסנכרן.
- `audits/RC_HDR2_20261127_VERIFICATION.md` — פרוטוקול כותרות מעל הקו.
- `audits/PHASE1_SOURCE_RECONCILIATION_2026-11-25.md` — הסתייגות 57 קובצי Library שלא הושלמו.
- `audits/PHASE1_DOM_HTML_PDF_GLYPH_PARITY_2026-11-25.md` — הוכחת פער glyph projection.
- `audits/PHASE2_FRANKREAL_HARFBUZZ_PROBE_2026-11-25.md` — POC/adapter, מגבלות WOFF2 וסטטוס production integration.
- `audits/PRODUCTION_SHAPEDRUN_INTEGRATION_CONTRACT_2026-11-25.md` — חוזה היעד ל-ShapedRun.
- `audits/legacy-parity-iteration/iteration-007/RENDERER_SHAPING_GAP.md` — קוד ההקרנות הקיים מול חוזה shaping.
- `audits/legacy-parity-iteration/iteration-007/CFF_STRESS_FINDINGS.md` — מגבלות אישור המרת CFF.

**הערת עקיבות:** מסמכי SPLIT נכתבו על snapshot `197225d`; תיקוני W-1..W-7 נוספו לאחר מכן בענף fix. כל טענה ב-SPLIT חייבת לקבל מיפוי ל-commit/file העדכני לפני שמסמנים אותה כסגורה.

**סוף גרסה מעודכנת.**
