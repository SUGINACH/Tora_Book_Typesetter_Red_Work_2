# פרומט ביצוע — הקמת ענף unified, תיקון ממשק, כלי parity מלא והתחלת השוואת legacy↔unified
**תאריך:** 19.11.2026  
**מאגר:** SUGINACH/Tora_Book_Typesetter_Red_Work_2  
**מסמך היסטורי מחייב:** audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md  
**מטרת־על של המיילסטון הבא:** תוצאת העימוד של המנוע המאוחד תהיה זהה לתוצאת מנוע המורשת החי בכל אספקט הניתן להשוואה, תוך שמירת החלטות המשתמש המפורשות. אין להכריז על השגת המיילסטון לפי דטרמיניזם או שימור מילים בלבד.

> **חובת עבודה — קטלוג רכיבי המסמך והגדרות העימוד:** `spec/קטלוג-רכיבי-מסמך-הגדרות-עימוד.html` (תצוגה עריכה/ייצוא) ו־`spec/קטלוג-רכיבי-מסמך-הגדרות-עימוד.data.json` (נתוני המקור). כל שינוי בקוד, בהגדרה, בערך ברירת מחדל, אפשרות, תחביר מקור, רכיב מסמך/עמוד, קבוע מוקשח או fallback מחייב בדיקה ועדכון של הקטלוג באותו PR/commit. אין לשכפל כאן טבלאות/רשימות של הגדרות או אפשרויות; יש להפנות לקטלוג. ערכי Registry, יבוא, ערך משתמש ו־fallback נשארים שכבות נפרדות. הקטלוג מתעד את הקוד אך אינו מחליף בדיקות runtime, PDF או החלטות משתמש.


---

# א. פתיחת סשן — שחזור מצב אחרי אתחול Sandbox

הנח שה־Sandbox וה־filesystem אותחלו מחדש. שום קובץ מקומי, branch checkout, npm install, build, artifact, log או זיכרון ריצה מהסשן הקודם אינם אמינים עד שחזורם מן Git.

1. התחל מ־pwd, git status --short --branch, git branch --show-current, git log -1 --oneline --decorate, git remote -v, git fetch --all --prune.
2. אמת מהו origin/main העדכני. נקודת הפתיחה הידועה היא main@710b4e75064f48edd290cd7381fc2c551a8a71f7, הכוללת את מיזוג PR #67; אם main התקדם, השתמש ב־HEAD החדש ותעד את השינוי.
3. בדוק שוב PRs פתוחים/טיוטות, ענפים, CI, deployments ו־gh-pages. אל תניח שהסטטוס מן הדוח ההיסטורי עדיין נכון.
4. בדוק git status לפני checkout/rebase. אם יש שינויים שלא committed, אל תדרוס, אל תבצע reset/clean ואל תזרוק stash. שמור אותם בענף/patch עם רישום ברור ובדוק מה מקורם.
5. בצע git fetch; אל תבצע push ישיר ל־main. אל תבצע force push. אין למחוק ענפים או PRs קיימים.
6. קרא במלואם:
   - spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md
   - DECISIONS.md, OPEN_QUESTIONS.md, WORKLOG.md, ISSUE_REGISTRY.md
   - CANONICAL_DOCUMENT_MODEL.md, spec/03_UNIFIED_ITEM_CONTRACT.md
   - audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md
   - audits/STAGE1_MAP_REVIEW_2026-11-19.md, audits/STAGE1_MAP_FORENSIC_FINDINGS_2026-11-19.md, audits/STAGE1_MAP_RECONCILIATION_PROMPT_2026-11-19.md, audits/STAGE1_MAP_RECONCILIATION_2026-11-19.md, audits/STAGE1_GATE_CROSSWALK_2026-11-19.md, audits/STAGE1_OPEN_DECISIONS_RECONCILIATION_2026-11-19.md
   - Stage8/Stage9 reports and latest issue registry entries.
7. מיד לאחר אימות שה־working tree נקי וש־origin/main מעודכן, צור את ענף המימוש החדש לפי סעיף ג (או ענף בשם ייחודי חדש אם השם כבר תפוס). זהו ענף עצמאי מן main; אל תמתין להשלמת תיקוני PR #65/#66 כדי להתחיל בו. עבודות תיקון PR ישנות ייעשו בענפים/PRs נפרדים ולא ייכנסו אוטומטית לענף המימוש.
8. בסיום שחזור הסביבה צור handoff מקומי/בריפו שמציין commit, branch, working tree, מה שוחזר, ומה לא שוחזר. כל תוצאה מקומית צריכה להישמר ב־commit או artifact מקושר לפני סיום סשן.

# ב. תיקוני חובות קודמים לפני מימוש מנוע

## B1. PR #66 — reconciliation ומפת היכולות
נקודת הבדיקה האחרונה שנשמרה: PR #66 על stage1/capability-map@1153effe7b74889071aa6084e025e0133b8761ef; המסמכים/PR body עדיין מציגים חלק מהנתונים הישנים ומסמך reconciliation מציין HEAD 9d86bfe. ה־base_sha שנשמר ב־PR metadata הוא 178bcc8e... מלפני מיזוג #67. GitHub עשוי לחשב mergeable באופן דינמי; בדוק מחדש את base/head/mergeable מול origin/main לפני כל פעולה, ואל תסתמך על מצב זה בדוח.

בצע:
1. fetch branch ו־main; עדכן את branch באופן נקי על base main החדש. אין לדרוס commits או לשנות history בכוח.
2. עדכן את כל המסמכים/כותרות/PR body ל־HEAD/base האמיתיים ולתאריך הריצה. אל תשאיר 9d86bfe כ־HEAD נוכחי אם אינו כזה.
3. יישב באופן מכני את מספר השורות וה־IDs במפה:
   - reconciliation מדווח 97→99 עקב פיצול AS-04 ל־AS-04, AS-06, AS-07.
   - ספירה עצמאית ראשונית זיהתה 96 IDs לפי תבנית uppercase פשוטה; ייתכן שהסיבה היא פורמט מזהה שונה/שורה חסרה. אל תעתיק את המספר 99 בלי ספירה מדויקת של כל שורות הטבלה, מזהה ייחודי לכל יכולת, תחום, וללא כפילויות.
   - הצג טבלת totals ל־13 התחומים, total rows, unique IDs, duplicate IDs, missing sequence IDs והבדלים מול 97 המקוריים.
4. עדכן את PR body: אל תטען ~85; אל תטען fontKey=0/4002 או 0 פסקאות; אל תציג את התיקון כ"סגירת שלב 1". ה־Gate Crosswalk עצמו קובע Q14 כחסם פתוח. הצג נכונה את העובדה ש־DocumentModel/LineModel/PageModel מכילים מידע, בעוד adapter החתימה קרא שכבה/שמות שדות שגויים.
5. השאר את Q14, Q12, Q13 ואת שאלת provenance של imud-book-title פתוחות. לאשר חוזה פריט או לבחור מדיניות מטא בשם המשתמש אסור.
6. בדיקת s9d: הגרסה ב־1153effe מתקנת את ה־digest לבדיקה מול נעילת DP המתועדת fdff19d8 ולא מול legacy 9C.3; זה נכון מבחינת שם/פרופיל. ודא שהבדיקה אכן משווה layoutHash, עושה negative control ושני טורי binding נבדקים. אל תחזיר את הטענה השגויה "legacy lock".
7. הפעל מחדש על ה־HEAD המעודכן npm test, test:determinism, cross-check, corpus-invariants, CI והבדיקות המתאימות. ודא שהבדיקה החדשה אכן רצה ב־npm test וב־CI.
8. רק אם כל האמור לעיל נכון, PR body מדויק, Q14 מסומן בבירור כפתוח ואין שינוי ברירות מחדל/מנוע מעבר להיקף — הכן את #66 למיזוג. אם אחת הדרישות לא הוכחה, השאר פתוח וכתוב מה חוסם. אין למזג רק כדי לנקות את רשימת PRs.

## B2. PR #65 — מילון/מפת ריפו
אין למזג את PR #65 כפי שהוא עד להשלמת ביקורת. ב־PROJECT_GLOSSARY.md בשורת Folio מופיע הניסוח השגוי "ensure geresh/gershayim placement/Unicode". זה הפוך מדרישת המשתמש וממימוש המורשת. תקן ל־**bare Hebrew gematria בלבד, ללא geresh/gershayim** בכל מספר עמוד מודפס ובמספר עמוד ב־TOC. D-108 מתעד זאת כהבהרה מפורשת ל־D-31. אל תכתוב שהיעדר גרש סותר את D-31; זו הייתה טעות בפרשנות הקודמת. ה־Glossary וה־Transition Inventory תוקנו כבר בענף PR #65; אמת את ה־diff לאחר fetch. בדוק כל טענה נוספת מול החלטות ומקורות, עדכן SHA/תאריך, והריץ בדיקות לינקים/עקביות. אפשר למזג רק אחרי ביקורת מלאה.

# ג. פתיחת ענף העבודה החדש — unified בלבד

1. צור מיד, לפני תיקון או מיזוג PRs קודמים, ענף חדש מן origin/main העדכני, בשם:
   engine/legacy-parity-preview-20261119
2. כל מימוש ה־unified/הצגה/בדיקות נעשים בענף זה בלבד. אין לעבוד על main ואין להשתמש ב־UNIFIED או branch היסטורי בלי לבדוק את מצבו.
3. הפעל את פרופיל unified במפורש בענף זה בלבד, בנתיב ה־UI/Worker האמיתי. אל תשנה את ברירת המחדל של main או את האתר הציבורי הקיים. branch preview אינו אישור cutover.
4. תן לענף ערך engineProfile חד־משמעי, הצג פס מצב/diagnostic שמזהה את profile ואת commit, והכשל אם חסר PageModel יהיה מפורש. אין fallback שקט ל־legacy.
5. שמור את מסלול legacy פעיל להשוואה בלבד עד שכל שערי parity והמשתמש יאשרו cutover. אין להסיר קוד legacy במסגרת פרוסה זו.

# ד. GitHub Pages — Preview מבודד שאינו דורס את האתר הציבורי

האתר הנוכחי משתמש ב־gh-pages orphan branch וב־deploy-pages.yml שמעלה את כל תוכן gh-pages לשורש Pages. ה־gh-pages HEAD הידוע הוא 90bfaf97... וה־index שלו נושא cache key 2026-11-18-s9c3. אין לשנות את התוכן בשורש האתר ואין להחליף את אתר הייצור בגירסת הניסוי.

1. בנה workflow ייעודי המופעל על push לענף engine/legacy-parity-preview-20261119 ועל workflow_dispatch.
2. ה־workflow יבנה את האפליקציה השלמה מן הענף הנוכחי — לא UI mock/debug bundle. בדוק scripts קיימים; אל תנחש פקודת build. האפליקציה חייבת להכיל worker, CSS, כל assets, כל fonts, default_settings, settings registry, 12 panels, editor, preview, testing, imports/exports וכל התלויות המקומיות.
3. לאחר build, הזרם את התוכן לספריית משנה קבועה ב־gh-pages, למשל previews/engine-parity/. שמור את כל הקבצים הקיימים בשורש gh-pages ללא שינוי. אל תחליף את index.html בשורש ואל תמחק assets/production.
4. אם נדרש, בנה עם base path יחסי ל־/previews/engine-parity/. ודא בפועל ש־styles.css, app.bundle.js, Worker scripts, fonts, icons וכל asset נפתחים מה־subpath. בדוק במיוחד new Worker וטעינת fonts — אל תניח שיחסי נתיב יעבדו.
5. עדכן את ה־preview רק באמצעות workflow מורשה עם permissions מינימליות הנדרשות. אל תוסיף secrets; אל תחשוף token; אל תדחוף ישירות ל־gh-pages מהסביבה המקומית אם לא נדרש.
6. ודא ש־deploy-pages.yml הקיים רואה push ל־gh-pages ומעלה את כל האתר. לאחר פריסה בדוק URL, סטטוס HTTP, קבצי bundle, font load, worker, console errors ו־app readiness.
7. צור preview-info.json עם source branch, commit SHA, build timestamp, profile=unified, ותווית ברורה: "סביבת ניסוי — אינה אישור לנכונות המנוע או לאישור cutover".
8. כתוב קישור URL צפוי במסמך handoff. קישור אינו נחשב עובד עד שנפתח ונבדק בפועל. אם אי אפשר לפרוס בלי לסכן את אתר הייצור, עצור את הפריסה והצג חלופה; אין לדרוס את האתר.
9. לאחר כל שינוי משתמש־נראה משמעותי בממשק/במנוע, בנה מחדש ופרוס את preview לענף זה. בכל פריסה תועדו commit, run URL, deployment URL ו־browser audit. שינוי פנימי שאינו משפיע על התצוגה אינו מחייב פריסה, אך עדיין מחייב בדיקות.

# ה. מיילסטון הקבלה — legacy↔unified parity מלא

זו דרישת המוצר המרכזית. אין לפרש "parity" כשימור מילים בלבד או כשערי shadow סמנטיים.

ההשוואה נעשית על אותו commit, באותה סביבת ריצה, באותו מסמך, אותן הגדרות, אותם imported defaults, אותם fonts/assets, אותם locale/device/browser. צד legacy וצד unified מריצים את כל ה־pipeline שלהם. יש לשמר snapshot שאפשר לשחזר.

## היקף הזהות
בכל page ובכל רכיב:
1. מספר עמודים, סדר עמודים, page type, פתיחות, עמודים ריקים/מבניים, recto/verso, טורים, סדר קריאה.
2. גאומטריית page/columns/regions: page size, margins, gutters, binding offset, x/y/w/h, baselines, reserved areas, furniture, vertical spacing.
3. מספר שורות בכל עמוד/טור/בלוק; חלוקת פסקאות בין טורים/עמודים; כל break point; p-cut/p-end; מיקום כל מילה וכל סימן פיסוק.
4. ברמת מילה/מקטע/אות: source identity/range, text code points, grapheme clusters, order, x/y/width/height, font family/face, weight, sizePt, style, color, direction, letter/word spacing, superscript/subscript, marker/inline span. יש להשוות גם טווחי גופן מעורבים בתוך אותה מילה.
5. כל סוגי הכותרות H0–H7, מיקום/גודל/צבע/גופן/רווח/קווים; כל הכותרות העליונות והתחתונות.
6. תוכן עניינים כללי/מפורט, רמות, מספור, טקסטים, קישורים ויעדי עמוד.
7. הערות שוליים/צד/סיום, עוגנים, סמנים, מספור, split/continuation, סדר וגבולות אזור.
8. שערים קדמיים/אחוריים, metadata, title fields, ארבעת מקטעי השער האחורי, עיטורים, רקעים, קווים, מסגרות, תמונות.
9. כל עיצובי הטקסט, משפחות/פנים גופן, תמונות, צבעי דיו, שקיפות והטמעת גופנים.
10. DOM, HTML עצמאי ו־PDF: אותם מיקומים, גודל, פלט, קישורי תוכן, טקסט נבחר, bookmarks, ornaments ופונטים. DOM/HTML/PDF אינם רשאים לחשב עימוד מחדש.

הפק שני סוגי השוואה:
- **Structural/geometric signature**: השוואה מדויקת של נתוני מודל, שורה, מילה, קואורדינטות, סגנון וזהות מקור.
- **Rendered visual diff**: תמונות עמודים/PDF DOM snapshots עם חיתוך/יישור קנוני. הבדל raster של antialiasing מותר רק אם הוגדר והוכח שאינו שינוי גאומטרי; אין להשתמש בו כדי להסתיר הבדל מיקום, גודל, צבע או גופן.

אין טולרנס כללי שמכסה הפרשי פריסה. כל קוונטיזציה/דיוק floating-point מוגדרים מראש במקום אחד, מתועדים, ומיושמים סימטרית לשני הצדדים. כל חריג דורש סיווג, הוכחה והכרעה.

## כלי ההשוואה — לא להשתמש ב־adapter כמקור אמת
1. תקן/החלף את כלי החתימה כך שהוא קורא ישירות את המבנים הקנוניים בכל מנוע: DocumentModel, LineModel, PagePlan, PageModel, asset/font metadata ו־renderer output. אין לסנתז paragraphs מ־paraId שאינו קיים; אין hardcode engine=legacy בהרצת unified; אין להניח ש־fontKey שורה הוא שדה נכון אם יש כמה fonts בפרגמנט.
2. כל extractor חייב לשמור trace למקור: page → block → line → fragment → word/glyph → sourceRange/sourceAnchor. שדות שלא קיימים בצד מסוים צריכים להיות מסומנים "לא קיים בשכבה", ולא לאפס או להשמיט בלי אבחון.
3. צור manifest להשוואה שבו מפורטים לכל קובץ: hash, settings hash, font inventory hash, asset inventory hash, runtime/node/browser, commit, engine profile.
4. כשל signature יפיק diff ראשון מפורט + diff מלא ל־JSON artifact, כולל מספרי עמוד/טור/שורה/מילה ונתוני before/after.
5. הוכח את הרגישות של comparator באמצעות negative controls: שינוי מילה, שינוי גופן, שינוי גודל, שינוי color, שינוי x/y, הוספת הערה/עיטור/TOC link — כל אחד חייב להפעיל את השער הנכון.
6. בדוק את comparator על legacy מול legacy בשתי ריצות ועל unified מול unified, כדי לוודא ש־determinism אינו מבולבל עם parity.

# ו. ביצועים — unified אינו איטי מה־legacy

המשתמש קבע: אין מצב שריצת העימוד במנוע החדש תהיה ארוכה מזו של הישן.

1. בנה benchmark apples-to-apples. אותו process/Node version/host; אותם settings/fonts/assets; אותו source file. הרץ legacy ו־unified בסדר מתחלף, 2 warmups לפחות ו־7–10 מדידות תקינות לכל צד; דווח p50, p95, mean, min/max, peak memory ו־GC אם אפשר.
2. מדוד typeset end-to-end עד PageModel/תוצאת מנוע סופית. מדוד בנפרד Worker transport, DOM render, HTML export, PDF export. אין לערבב ביניהם.
3. קורפוסים: canonical, no_long, mid_long, long, very_long, וקובץ ספר אמיתי נוסף אם יש. very_long הוא מקור ההכרעה לפי D-98.
4. דווח page count ו־content parity יחד עם זמן. אם unified מהיר רק כי הוא משמיט תוכן, אינו מודד, מייצר פחות עמודים או מדלג על פריטים — זו רגרסיה/כשל, לא האצה.
5. תנאי קבלה מקומי: median unified ≤ median legacy בכל קורפוס ובכל מסלול typeset זהה. אם המדידות לא יציבות, שפר את יציבות הסביבה וחזור על המדידה; אין להגדיל סף כדי לקבל ירוק. CI performance gate יפעל על runner קבוע ויחסום רגרסיה מדידה. כל חריגה זמנית צריכה להופיע כ־FAIL, לא כ־PASS.
6. אם unified איטי יותר, פרופייל את hot path, הקצה האחראי, מספר קריאות מדידה, allocations, cache misses ו־iterations; תקן את מקור הכפילות/האלגוריתם. אין להסתפק בהגדלת cache, דילוג על שלבים, קיצור בדיקות או parallelism שמסתיר latency.
7. דווח על זמן ראשון/קר וחם בנפרד ועל זיכרון. אין להציג את חיסכון ה־PDF של Stage 8 כהוכחה לזמן typeset.
8. בדיקות פוליו חובה: page 1, 2, 15, 16, 21, 22, 99, 100, 101, 999, 1000, 1001, 5702; כל folio חייב להיות ללא U+05F3/U+05F4/ASCII apostrophe/quotation mark. בדוק גם תוויות TOC. בדיקות שלילה יזריקו U+05F3/U+05F4 ויוודאו שה־comparator נכשל. בדוק בנפרד שסמני הערות עם `hebrew-geresh` נשארים לפי הגדרותיהם — אין לערבב בין הערת שוליים ל־folio.

# ז. חקירת שורשי ההפרש ותיקונם

לפני כל תיקון:
- שחזר את ההבדל באמצעות קלט/הגדרות/SHA זהים.
- הראה את השלב שבו שתי התוצאות נפרדות לראשונה: parse, normalize, resolve styles/assets, measure, line-break, page-plan, notes, furniture, PageModel, projection.
- הצבע על הנתון/פונקציה שגורמים לפער.
- הוסף test שהיה נכשל לפני התיקון ו־negative control.
- בצע תיקון במקור הסמכות היחיד. עדיף שינוי קטן, אחיד ומובן במקום שבו העובדה נוצרת.
- ודא שאין copy/duplicate logic, compatibility patch, branch-specific layout formula או post-layout correction.
- בדוק שכל פריט חדש או פער חדש זורם באותו חוזה כל הדרך.
- הוסף Trace/Diagnostic שמסביר למה מילה/שורה/כותרת/הערה הוצבו במקום הזה. אין להוסיף trace שמפעיל layout נוסף או משנה hash.

הפערים שאומתו ב־19.11 וצריך להתחיל מהם, לאחר שה־comparator ישיר:
1. הקדמה: legacy 11.5pt Frank Ruhl Libre לעומת unified 12pt Guttman Rashi.
2. windowWords: legacy 254 שורות לעומת unified 0.
3. עמוד ריק: legacy אחד לעומת unified אפס.
4. provenance של metadata מול imud-book-title: ההגדרה המיובאת "ספר מלכי המלוכה" דורסת metadata "מקום בינה"; אין לשנות את כלל S4.5 "override מפורש של משתמש גובר" בלי הכרעה לגבי provenance.
5. כותרות עליונות/שער/metadata: בדוח no_long נמצאו הבדלי סלוטים, תוכן ומיקומים.
6. כל יתר ההבדלים במפה: יש להוכיח את מקורם מחדש על HEAD הנוכחי; אין להסתמך על דו"ח 9a או shadow v5 מלפני 9c/9d.
7. אין להתחיל בהסרת legacy לפני parity מלא, חתימת UI/HTML/PDF, כל gates וסגירת ההחלטות הנדרשות.

# ח. שחזור ממשק המשתמש — לרבות הסנכרון שנעלם

ב־main נמצאו:
- app-shell.js מחבר onCaretMove ו־onActivatePage.
- caret-map.js ממפה caret↔page לפי token identities.
- preview-tab.js יודע לסמן caret-target.
- editor-tab.js הוא textarea, ומציג marker list נפרדת למפת שבירות.
- s10-ui.test.js כולל בדיקת shim לסמן→עמוד, עמוד→סמן ו־round-trip.
- S10_CLOSURE_REPORT טוען שהסנכרון עובד, אבל אינו מהווה בדיקת דפדפן אמיתי עדכנית.

לכן בצע trace מלא של האירועים/הנתונים במסלול החדש:
1. textarea click/keyup/select → source char offset → token/sourceRange → page → preview highlight + scroll.
2. click על מילה/שורה/אזור בעמוד/TOC → line/fragment/word sourceRange → editor selection/caret.
3. page-break markers → source offsets מדויקים → overlay/inline markers בתוך טקסט העורך.
4. שינוי טקסט, RTL, zoom, scroll, font load, virtualized page window, הערות, כותרות, נוכחות/היעדר sourceRange — הכל חייב להישאר מסונכרן.

הדרישה היא לא רק רשימת "⏎ עמוד כ״ב" מתחת ל־textarea. יש להציג סימונים במקום הנכון בתוך הטקסט עצמו בלי להכניס אותם ל־textarea.value או למסמך המקור. בנה פתרון UI יחיד שמשתמש ב־sourceRange/anchors מהמודל. אין להשתמש ב־regex/חיפוש מחרוזת שמניח טקסט ייחודי ואין לחשב שוב חלוקת שורות באופן נפרד. אם textarea אינו מסוגל לספק overlay מדויק מספיק, בחן editor surface עם שכבת טקסט מסונכרנת/overlay שמכבדת RTL, wrapping, selection, scroll ו־accessibility. אל תחליף רכיב לפני הוכחת סיבה; אל תשאיר שני עורכים פעילים.

## בדיקות UI מחייבות
- browser E2E אמיתי, לא רק DOM shim, מול האפליקציה המלאה בענף preview.
- test caret→page בכמה מקומות: תחילת/אמצע/סוף פסקה, כותרת, טקסט מוסגר, מילה עם ניקוד, הערת שוליים.
- test page/word click→caret על sourceRange המדויק.
- test page-break marker inline במיקום המדויק, שמירת טקסט byte-for-byte ו־getText()/export ללא סימנים.
- test round-trip page→editor→page, כולל עמוד וירטואלי שלא היה DOM-rendered קודם.
- test TOC click, issue activation, footnote anchor, zoom/scroll.
- בדוק ב־browser שהמשתמש רואה את הסימונים וההתנהגות; אל תסתפק ב־assert של פונקציה פרטית.
- אם הבדיקה נכשלת, דווח מה חסר ואל תכתוב שהפיצ'ר קיים רק משום שהמודול קיים.

# ט. שימור מלא של התוכנה וההגדרות ב־Preview
ענף ה־Preview הוא build מלא של התוכנה:
- כל ההגדרות מהרישום, כל ה־12 panels, preset/settings import/export, local persistence, font management, library/assets, editor, preview, testing, diagnostics, Worker, cancellation/progress, exports.
- כל כפתור פעיל מחובר לפעולה; אין mock buttons, placeholder tabs או נתונים סטטיים במקום המנוע.
- ברירות המחדל D-107 נשמרות; kit 40 ושלושת השערים פעילים אוטומטית.
- הממשק מציג בבירור שהמנוע הוא unified experimental branch. אין לשנות את default profile של main.
- יש לצרף קישור Preview רק אחרי Deploy success ו־browser smoke pass. קישור preview אינו אישור לנכונות המנוע.

# י. משמעת בדיקות, סגירת פרוסה ו־PR

בכל פרוסה משמעותית:
1. npm test מלא.
2. npm run test:determinism.
3. cross-check locks; corpus-invariants; negative controls.
4. כל בדיקות המודל/notes/ornaments/assets/fonts/page-model.
5. full-math/layout-audit בדפדפן אמיתי על very_long, בנוסף ל־small smoke.
6. signatures legacy↔unified; עד הפער האחרון הדוח חייב להראות FAIL עם רשימת הבדלים, לא "green" מלאכותי.
7. benchmark apples-to-apples.
8. HTML/PDF export validation — מספר עמודים/טקסט/קישורים/גופנים/תמונות/מיקום.
9. Deploy ל־branch preview אחרי שינוי משתמש־נראה ואימות browser.
10. שמור artifacts ודוחות עם commit, config hash, corpus hash, font/assets hashes, Node/browser version, test command ותוצאה.

כל PR קטן, ממוקד, עם שינוי שורשי אחד. אין לערבב ריפקטור רחב, תיקון UI, ניקיון מסמכים וברירות מחדל באותו PR. עדכן WORKLOG, ISSUE_REGISTRY, capability map, dependency map ו־handoff. אם יש חסימה, ציין אותה והמשך בעבודה שאינה תלויה בה.

## יא. החלטות שאסור לשנות באופן חד־צדדי
- D-31: אין להחיל על folio. D-108 קובע שמספרי עמודים ותוויות folio ב־TOC מוצגים בגימטריה חשופה ללא גרש/גרשיים, בדיוק כמו legacy. המקור הישיר לכוונת המשתמש נמצא ב־`ai-chat/ChatGPT.md`: הודעתו מ־19.11.2026 00:06:44, שורה 17642: „למה למספר העמוד נוספו גרשיים כאלה כ״ד ???”; ובשורה 18138: „מספור עמודים עם גרשיים במקום הפורמט המקורי.” יש לקרוא את קובץ השיחה המלא מן Git אחרי אתחול Sandbox; אין להסיק מהיעדר תוצאה בכלי fetch מוגבל שהארכיון ריק.
- D-100: אין PDF-reference parity ואין P6/P7; כן נדרשת engine-vs-engine parity לפי ההוראה החדשה.
- D-98: very_long הוא המסמך הראשי; generator הוא רק stress test והוא חייב להיות תקין מבנית.
- D-96/D-107: ערכת 40 ושלושת השערים המקוריים פעילים אוטומטית.
- S75/S76: מדיניות הערות body-first והיישום המאוחר; לא לפתוח מחדש.
- S4.5: explicit user override גובר על metadata; provenance מיובא הוא שאלה פתוחה.
- אין שינוי ברירות מחדל/מזהי טקסט/הגדרות/גופנים בלי הוכחה והחלטה.

## יב. מה נדרש להחזיר בסיום הסשן

דוח קצר, מדויק, עם:
1. branch + HEAD + main base + PR links.
2. אילו PRs קודמים תוקנו/מוזגו/נשארו פתוחים ומדוע.
3. פריסת preview: URL אמיתי, source SHA, workflow run, תוצאת browser check; אם לא נפרס — הסיבה.
4. סטטוס ה־UI: מה נמצא, מה תוקן, האם bidirectional sync עובד בדפדפן, האם inline text markers מוצגים ומדויקים.
5. כלי parity: אילו שכבות הוא משווה, negative controls, artifacts וקישור JSON/HTML/PDF diff.
6. טבלת parity לכל קורפוס: pages, lines, words/glyphs, headings, notes, TOC, ornaments, fonts/colors/geometry — PASS/FAIL ומספר הבדלים.
7. benchmark: p50/p95 typeset של שני המנועים באותם תנאים; יחס unified/legacy; memory; PASS/FAIL.
8. בדיקות: פקודות, מספרים, commit ו־Actions links.
9. root cause של כל תיקון, השכבה המדויקת ומדוע לא נוצר מנגנון מקביל/טלאי.
10. blockers / user decisions שמחייבים הכרעה אחת ממוקדת.
11. next-step exact command/checkpoint. אל תכתוב שהמיילסטון הושלם כל עוד קיימים differences או unified איטי יותר.

**התחל בביצוע בפועל:** שחזר את הסביבה, אמת את main, וצור מיד את ענף המימוש העצמאי לפי סעיף ג — אין להמתין לתיקון או מיזוג PR #65/#66. במקביל או לאחר יצירת הענף, פתח ענפי תיקון נפרדים ל־PR #66 ול־PR #65 וטפל בהם לפי B1–B2; אל תכניס תיקוני תיעוד לא קשורים לענף המנוע. לאחר יצירת ענף המימוש, הכן Preview מבודד לפי סעיף ד, והשלים קודם את כלי ה־signature/benchmark ואת ה־browser audit של סנכרון העורך. רק לאחר שכלי ההוכחה מוכיחים את ההפרשים, תקן את פער השורש הראשון. אל תתחיל בריפקטור מנוע רחב לפני שיש השוואה אמינה, ואל תעצור לאחר כתיבת תכנית בלבד.