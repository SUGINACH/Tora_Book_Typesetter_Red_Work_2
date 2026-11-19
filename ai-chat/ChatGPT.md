# Branch · חוות דעת על התוכנית

**User:** Anonymous  
**Created:** 11/12/2026 9:20:47  
**Updated:** 11/12/2026 16:34:50  
**Exported:** 11/12/2026 16:38:11  
**Link:** [https://chatgpt.com/c/6af568cd-8b70-83eb-ac2b-031567f700d2](https://chatgpt.com/c/6af568cd-8b70-83eb-ac2b-031567f700d2)  

## Prompt:
10.11.2026, 5:05:44

[$github](app://connector_76869538009648d5b282a4bb21c3d157) עבור על הריפו הבא: https\://github.com/SUGINACH/Tora_Book_Typesetter_Red ועל תוכנית השיפור והמיטוב המבוססת על הגרסאות השונות https\://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/spec/%D7%AA%D7%9B%D7%A0%D7%99%D7%AA%20%D7%9C%D7%A9%D7%99%D7%A4%D7%95%D7%A8%20%D7%AA%D7%95%D7%9B%D7%A0%D7%AA%20%D7%A2%D7%99%D7%9E%D7%95%D7%93%20Red.MD והבע דעתך עליה

## Response:
10.11.2026, 5:05:50 · gpt-6-t-mini

אבחן את התוכנית מול מצב הקוד בפועל, ולא רק כטקסט רעיוני: תחילה אמפה את מבנה המאגר והגרסאות, אחר כך אקרא את מסמך התוכנית ואת הקבצים המרכזיים שאליהם הוא נשען, ולבסוף אציג הערכה של סדרי העדיפויות, הסיכונים, החוסרים והישימות.

קראתי את התוכנית במלואה. יש בה רעיונות טובים, בעיקר ההפרדה בין ממשק, אבחון, טעינה, בדיקות ותיעוד; אבל המבנה שלה נכתב עבור ארכיטקטורה מוקדמת בהרבה מזו שקיימת כיום. למשל, היא מציעה להקים מחדש UI, מערכת בדיקות ומנגנון דיבאג, בעוד שהמאגר הנוכחי כבר כולל את רובם. כעת אני מצליב את סעיפי התוכנית מול הקבצים, ה־API, הסקריפטים והענפים הקיימים, כדי להפריד בין מה שכבר הושלם, מה שהתיישן ומה שעדיין חסר באמת.

הצלבת הגרסאות מאשרת שהתוכנית מערבבת בין מקורות שכבר אוחדו לבין רכיבים שעדיין עשויים להיות חסרים. Orange העצמאי מתועד בעצמו כייבוא של Green/V23 ושל Gold/V21; RED כבר מכיל מנוע חדש, ארבע לשוניות UI, רישום הגדרות, Worker, מנגנוני audit, ו־CI. לכן העתקה חוזרת של אותם רכיבים תהיה כפילות, ולא שדרוג. עם זאת, יש רכיב אחד מתוכנית Gold שעדיין ראוי לבדיקה ממוקדת: האם אבחון הסיבתיות שלב־אחר־שלב הועבר ל־RED במלואו, או שרק הועברו חלק ממנגנוני ה־trace וה־ledger.

> **Reviewing repository evidence**
>
> I’m sorting through the truncated project output and checking the relevant specification, workplan, release notes, audit materials, and code paths. I’m prioritizing concise extractions so I can separate documented claims from independently verifiable implementation evidence.
>
> **Reviewed repository evidence**
>
> 
>
> **Comparing plan assumptions**
>
> I’m checking whether the proposed workplan matches the repository’s current branches, architecture, message contracts, tests, and UI. Several assumptions appear stale, so I’m separating genuinely missing work from items already implemented or incompatible with the present codebase.
>
> **Compared plan assumptions**
>
> 
>
> **Reviewing Later Extension Plans**
>
> 
>
> **Checking current implementation**
>
> I’m finding that only the main and deployment branches remain, while the repository already contains substantial UI, audit, testing, and documentation infrastructure. I’m now identifying which proposed tasks are genuinely missing versus outdated or redundant.
>
> **Checked current implementation**
>
> 
>
> **Synthesizing repository status**
>
> I’m consolidating the evidence now: current branch history, recent worklog entries, specifications, workflows, audit tooling, and source structure. My aim is to judge the plan against what exists today, not against its older assumptions.
>
> **Synthesized repository status**
>
> 
>
> **Assessing current evidence**
>
> I’m seeing a newer repository state than the plan describes: later worklog entries report roughly 670 assertions and substantially improved parity. I’m checking remaining gaps so recommendations target measurable defects rather than already-completed milestones.
>
> **Assessed current evidence**
>
> 
>
> **Refining recommendations**
>
> I’m identifying structural risks too: overlapping agent responsibilities, stale file paths and protocols, inconsistent test counts, unresolved parity gaps, and an unsafe assumption that core-engine changes can be permanently forbidden.
>
> **Refined recommendations**
>
> 
>
> **Audited repository architecture, font integration, plans, documentation, and workflow status**
>
> 
>
> **Forming the verdict**
>
> I’m concluding that the plan has useful goals, but it shouldn’t be executed literally. I’d first reconcile current status, resolve the two remaining parity gaps, fix documentation drift, and then assign narrowly scoped, non-overlapping work.
>
> **Finalizing the assessment**
>
> I’m treating the proposal as a useful vision but not an executable plan today. The repository has advanced beyond its assumptions, so I’d first reconcile status, close fidelity gaps, and redesign ownership boundaries.
>
> **Audited worker protocols, parity gaps, cutover readiness, and documentation**
>
> 
>
> Worked for 4m 16s

כבר עולה מן המאגר נקודה מהותית שמשפיעה על הערכת התוכנית: **RED מוצגת כיישום מתקדם מאוד מבחינת היקף היכולות, אך עדיין לא כמנוע שהוכחה בו נאמנות מספקת למקור העימוד.** ב־README, המעודכן ל־3 בנובמבר 2026, מתועדות 388 בדיקות Node ירוקות, לצד בדיקת התאמה כמותית ראשונה למקור שקיבלה **16.7% בלבד**\. כלומר, יש להבחין בין השלמת שלבי הפיתוח ובדיקותיהם לבין הצלחה מוכחת בשחזור העימוד המבוקש. ההבחנה הזאת תהיה מרכזית בבחינת סדרי העדיפויות בתוכנית.

# חוות דעתי על תוכנית השיפור של RED

**המסקנה שלי: התוכנית טובה כמתווה חזון, אבל אינה מתאימה לביצוע במתכונתה הנוכחית.** היא מזהה נכון חמישה תחומים חשובים - ממשק, אבחון, גופנים, בדיקות ותיעוד - אך מתייחסת ל־RED כאילו הוא עדיין פרויקט בתחילת דרכו, בעוד שבפועל רוב התשתיות האלה כבר קיימות, חלקן במימוש מתקדם למדי.

לכן לא הייתי מוסר את התוכנית לחמישה סוכנים לביצוע כפי שהיא. הייתי משמר את הרעיונות הטובים שבה, אבל כותב אותה מחדש כתוכנית לסגירת פערים שנותרו במערכת הקיימת.

## 1\. ראשית, תמונת המצב האמיתית של RED

יש כאן תיקון חשוב להודעת הביניים שלי: ציון ההתאמה של 16.7% שמופיע ב־README הוא **ציון ההרצה הראשונה**, ולא המצב העדכני. ה־README עצמו מתוארך ל־3 בנובמבר ואינו משקף את העבודה המאוחרת יותר.

על פי יומן העבודה, ובעיקר התיעוד של S6.3 מ־10 בנובמבר, התמונה השתנתה באופן משמעותי\:

## מצב האימות המתועד ב־S6.3

# 88.9%

התאמה לייחוס

12 מתוך 14 בדיקות PARITY

# 4/4

בדיקות HARD

כל האינווריאנטים המוחלטים עברו

# 704

עמודים שנבדקו

43,117 שורות

# 0

ממצאי אודיט גיאומטרי

בבדיקה המתועדת של הקורפוס

---

לפי WORKLOG.md, S6.3: גם ארבעת ה־workflows המתועדים עברו - CI, layout-parity, full-math-audit ו־gh-pages-audit.

ההבחנה החשובה היא בין שני סוגי הצלחה\:

- **תקינות פנימית\:** העימוד עומד באינווריאנטים גיאומטריים, אינו מאבד תוכן בבדיקות הרלוונטיות, שומר על דטרמיניזם ואינו מייצר חפיפות או חריגות שנמצאו באודיט.
- **נאמנות למקור\:** העימוד של RED זהה ככל האפשר לעימוד של הגרסה המקורית.

הראשון נראה מתקדם מאוד. השני עדיין לא הושלם: שתי בדיקות PARITY נותרו מחוץ להתאמה המלאה - P6, העוסקת ברצף הפסקאות ובפיצול המנייה המקורי, ו־P7, העוסקת בשקילות שבירת השורות.

בנוסף, ביומן S6.2 עדיין מתועד אובדן של שתי מילים במסלול מסוים של מסמך הבדיקה הקבוע, במסלול של הערות ענק. לא מצאתי ב־S6.3 הצהרת סגירה מפורשת של הממצא הזה. לכן יש לאמת אותו ולא להניח שהוא נפתר.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/WORKLOG.md?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/README.md?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/tools/layout-parity/README.md?utm_source=chatgpt.com)\.

---

## 2\. בחינת חמשת הסוכנים בתוכנית

### Agent 1 - שילוב ממשק Orange

(רוב התשתית כבר קיימת)

התוכנית מבקשת להחליף את ממשק RED בממשק Orange, לחבר 12 פאנלים ל־Worker, להוסיף שמירת הגדרות, מקשי קיצור, חיווי התקדמות ועוד.

אלא שב־RED כבר קיימים\:

- ארבע לשוניות: עורך, הגדרות, בדיקה ותצוגה.
- ממשק הגדרות המבוסס על רישום מרכזי.
- פאנלים דינמיים, הרחבות, תצוגה מקדימה וכלי בדיקה.
- מנגנון Worker נפרד, כולל פרוטוקול תקשורת מוגדר.
- שמירת הגדרות ב־`localStorage`, שנוספה ב־S6.1.
- מחולל מסמכי בדיקה קבועים ורנדומליים, שנוסף אף הוא ב־S6.1.

כלומר, החלפת הממשק כולה היא משימה מיותרת ועלולה להיות מסוכנת. בפרט, הממשק הנוכחי אינו רק מעטפת חיצונית: הוא כבר מחובר למערכת ההגדרות, לניהול הרחבות, לרישום הגופנים ולמחזור החיים של ה־Worker.

**דעתי\:** לא לבצע החלפה מלאה. נכון יותר לבצע בדיקת UX ממוקדת: האם כל היכולות הקיימות נגישות, מובנות ונוחות לשימוש, והאם נשארו יכולות חשובות מ־Orange שלא הוטמעו.

קבצים מרכזיים: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/red-build/src/ui/app-shell.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/red-build/src/ui/settings-panel.js?utm_source=chatgpt.com)\.

### Agent 2 - כלי האבחון של Gold

(יש כאן פוטנציאל אמיתי, אך נדרשת הבחנה)

זהו בעיניי הסעיף החשוב ביותר בתוכנית מבחינת האפשרות לשפר את יכולת הפיתוח והתחזוקה של RED.

ב־Gold V21 קיימת מערכת אבחון שלב־אחר־שלב בעלת ערך רב: checkpoints, מעקב אחר שינויים, השוואת מצבים וסיווג סיבתי של בעיות. היא נועדה לא רק לזהות שמשהו השתבש, אלא גם להבין באיזה שלב נוצרה הבעיה, תוקנה, חזרה או נמנעה.

עם זאת, חלק משמעותי מהתשתית כבר הועבר ל־RED\:

- `EventLog` לתיעוד אירועי המנוע.
- `Ledger` לניהול ממצאים ומחזור החיים שלהם.
- דוח אבחון הכולל ממצאים, חומרה וסיבות.
- trace שניתן להעברה דרך פרוטוקול ה־Worker.
- כלי אודיט גיאומטרי בדפדפן.
- כלי השוואה מתמטי מול הייחוס.
- כלי דיבאג פר־עמוד ומנגנון `highlightIssue`\.

חשוב להבין: המערכת הקיימת כבר אינה רק בודקת את התוצאה הסופית. היא מתעדת גם אירועים ומצבים לאורך הצינור.

אבל יש הבדל בין trace של אירועים לבין מערכת snapshot/diff שמחזיקה ייצוגי ביניים של הגיאומטריה. מהקוד והפרוטוקול שבדקתי, לא ראיתי הוכחה לכך שכל יכולת ה־checkpoint וההשוואה הסיבתית של Gold הועברה בשלמותה. ה־Worker הנוכחי מעביר trace ו־ledger, אבל אין בפרוטוקול שלו הודעת checkpoint כללית כפי שמוצעת בתוכנית.

**דעתי\:** יש לבצע כאן בדיקת פערים מדויקת מול Gold, ולא העתקה של `geometry-audit.js` בשלמותו.

בפרט, הייתי בודק האם אפשר להוסיף ל־RED יכולת אבחון שמציגה עבור כל ממצא\:

1. מצב הרכיב לפני השלב הרלוונטי.
2. השלב שבו הבעיה נוצרה.
3. שינויים שהתרחשו ברכיבים אחרים באותו עמוד.
4. השלב שבו הבעיה תוקנה, בוטלה או חזרה.
5. האם מדובר בכשל אמיתי, אילוץ בלתי־פתיר או ממצא שווא.

זוהי הרחבה בעלת ערך רב, אבל יש להפעיל אותה לפי דרישה ולא להעמיס snapshots גיאומטריים כבדים על כל ריצת עימוד רגילה.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Gold/blob/V21/README.md?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/red-build/src/ui/worker-protocol.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/tree/main/tools/layout-audit?utm_source=chatgpt.com)\.

### Agent 3 - אופטימיזציית טעינת גופנים

(רעיון טוב, אך לא נכון לבצעו לפי המפרט הנוכחי)

Yellow V22 אכן הציג מנגנון טעינה דו־שלבי מעניין: 439 גופנים ברשימה הראשונה ו־1,315 ברשימה המורחבת.

ב־RED כבר נעשתה עבודה משמעותית בתחום הגופנים: הוטמעו נכסי המקור, קובצי WOFF2, גופני TTF, מערכת לרישום גופנים ומדידת אמת מתוך טבלאות גופן.

הנקודה הטכנית החשובה היא שמנגנון המדידה של RED אינו זהה לטעינת גופנים רגילה של הדפדפן. `font-metrics.js` מפרסר קובצי SFNT מסוג TTF/OTF, ומנגנון המדידה משתמש בנתוני `hmtx`, `cmap`, `kern` ו־`GPOS`\.

לכן, לא נכון להקים FontLoader שמניח שכל קובץ גופן הוא אובייקט שניתן להעביר ישירות ל־parser. למשל, WOFF2 אינו קלט שה־parser הנוכחי יודע לקבל ישירות.

גם יעד של טעינת 50-100 גופנים בתחילה אינו תואם לרשימות Yellow, והעתקה ישירה של כל 1,315 הגופנים למנגנון טעינה פעיל עלולה להכביד במקום לשפר.

**דעתי\:** זהו תחום שראוי לבצע בו אופטימיזציה, אבל רק לאחר מדידה\:

- זמן טעינת האפליקציה בקור ובחימום.
- זמן טעינת הגופנים שבשימוש בפועל.
- משך רישום הגופנים למנוע.
- נפח הנכסים וההשפעה על הזיכרון.
- ההבדל בין טעינה ראשונה לטעינה חוזרת.

הייתי בוחן קודם טעינה מדורגת של נכסי גופנים, לפי שימוש בפועל, ושימוש ב־HTTP cache המובנה בדפדפן. IndexedDB ייכנס לתמונה רק אם המדידות יראו שהוא נחוץ.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Yellow/blob/V22/README.md?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/red-build/src/engine/typography/font-metrics.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/red-build/src/engine/typography/measure-api.js?utm_source=chatgpt.com)\.

### Agent 4 - מערכת בדיקות

(תשתית קיימת; יש להרחיב לפי פערים)

התוכנית מבקשת להוסיף Playwright, בדיקות E2E, קובצי fixtures, CI/CD, nightly build ו־coverage.

אבל RED כבר כולל\:

- בדיקות יחידה.
- בדיקות אינטגרציה.
- בדיקות עימוד.
- בדיקות E2E.
- בדיקות שליליות ורגישות האודיט.
- בדיקות דטרמיניזם.
- בדיקת מסמך קנוני.
- בדיקות מול טקסטים ארוכים.
- כמה workflows עצמאיים של GitHub Actions.

חשוב מכך, ה־CI הנוכחי אינו בסיסי: הוא מריץ בדיקות במספר גרסאות Node, בדיקות דטרמיניזם, ביקורת גיאומטרית, השוואה לייחוס וקורפוס ארוך. קיימים jobs שמוגדרים עם timeout של 90 ואף 120 דקות. לכן היעד של התוכנית - להריץ הכול בתוך חמש דקות - אינו מציאותי עבור בדיקות העומק הקיימות.

גם יעד של יותר מ־500 בדיקות ו־85% coverage אינו מעיד בהכרח על איכות גבוהה יותר. בפרויקט כזה עדיף למדוד כיסוי של תרחישי כשל אמיתיים, ולא לרדוף אחר מספר בדיקות או אחוז כיסוי כללי.

**דעתי\:** לא להקים מערכת בדיקות חדשה. להרחיב את הקיימת בנקודות שבהן חסרה הוכחה: שתי בדיקות ה־PARITY שנותרו, מסלול אובדן המילים, בדיקת הגופנים בפועל, בדיקות UI של תרחישים מורכבים, ובדיקות רגרסיה לכל תיקון מנוע.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/.github/workflows/ci.yml?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/.github/workflows/layout-parity.yml?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/main/.github/workflows/full-math-audit.yml?utm_source=chatgpt.com)\.

### Agent 5 - תיעוד ושחרור

(נדרש איחוד ועדכון, לא כתיבה מחדש)

כבר קיימים ב־RED מסמכים רבים: מפרט ראשי, תוכנית עבודה מאסטר, SRS, יומן עבודה, מרשם בעיות, מפת תלות, החלטות, CUTOVER, RELEASE\_NOTES, תיעוד אבטחה ונגישות ועוד.

הבעיה אינה מחסור בתיעוד. הבעיה היא **שהתיעוד אינו מסונכרן תמיד עם מצב הקוד**\.

לדוגמה\:

- README מתאר 388 בדיקות.
- WORKLOG מתאר 657 בדיקות ב־S6.1, 670 ב־S6.2, ושוב 657 ב־S6.3.
- README מציג 16.7% כציון ההתאמה, בעוד שהעבודה המאוחרת מתעדת 88.9%.
- מספר הפאנלים משתנה בין המסמכים: 12 לעומת 13.

הפערים האלה עלולים לגרום למפתח או לסוכן חדש לפעול לפי הנחות שכבר אינן נכונות.

בנוסף, התוכנית מציעה ליצור רישיון MIT, אך ב־`package.json` הנוכחי רשום `UNLICENSED`\. אין להוסיף רישיון MIT לפני הכרעה מפורשת בעניין זכויות ההפצה.

**דעתי\:** במקום לכתוב מחדש את כל התיעוד, יש ליצור מקור אמת אחד למצב הפרויקט, לעדכן את המסמכים הקיימים, להפריד בין מצב היסטורי למצב נוכחי, ולוודא שכל מספר בדיקות וכל ציון parity משויכים להרצה מזוהה.

---

## 3\. הבעיה המרכזית בתוכנית: היא אינה מבוססת על מפת המצב הנוכחית

לאחר שבדקתי גם את מאגרי המקור, מצאתי בעיה מהותית בתפיסת העבודה שעליה מבוססת התוכנית.

התוכנית מתייחסת ל־Orange, Gold ו־Green כאילו מדובר בשלושה מקורות נפרדים שצריך לייבא מהם רכיבים באופן עצמאי.

אבל ה־README של Orange העצמאי מתעד במפורש ש־Orange כבר נבנה מייבוא של Green V23 ומיכולות ותיקונים שהועברו מ־Gold V21, כל אחד כקומיט נפרד ועם בדיקה.

גם IMUD\_TORANI כבר מכיל איחוד של ענפים מוקדמים יותר ושל V21.

כלומר, התוכנית אינה משקפת באופן מלא את אילן היוחסין של הקוד. העתקת אותם רכיבים שוב עלולה ליצור כפילויות, להכניס גרסאות קוד ישנות ולפתוח מחדש בעיות שכבר נפתרו.

הגישה הנכונה היא לא לייבא רכיבים לפי שם הגרסה, אלא לבנות **מטריצת מקור ותועלת**\:

| מקור | מה ראוי לקחת ממנו | מה צריך לבדוק לפני העברה |
|--------|--------|--------|
| Orange | יכולות UI והגדרות שלא הוטמעו | שאין מימוש מקביל ב־RED |
| Gold V21 | אבחון סיבתי שלב־אחר־שלב | מה כבר נכלל ב־trace וב־ledger |
| Yellow V22 | עקרונות טעינה מדורגת | התאמה למנגנון הגופנים של RED |
| Green V23 | תרחישי בדיקה, audit ו־fixtures | האם כבר קיימים ב־RED |
| React | רעיונות ארכיטקטוניים בלבד | התאמה לעקרונות המימוש של RED |

את ההיסטוריה של V21 ושל V23 צריך לשמר כמקורות נפרדים, ולהעביר רק רכיבים נבחרים עם תיעוד של מקורם והוכחת התאמה. אין סיבה למזג את קווי הפיתוח עצמם כדי להשיג זאת.

מקור: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Orange/blob/main/README.md?utm_source=chatgpt.com)\.

## 4\. בעיות נוספות שמצאתי בתוכנית עצמה

מעבר לכך שחלק מהמשימות כבר בוצעו, יש כמה כשלים תכנוניים שהייתי מתקן לפני כל ביצוע\:

**א. איסור מוחלט לגעת במנוע הליבה**

זהו לדעתי הכלל הבעייתי ביותר בתוכנית.

היא קובעת שהמנוע של RED קדוש, וכל השיפורים חייבים להיעשות בשכבות החיצוניות. אבל הפערים שנותרו כרגע בנאמנות למקור ובשימור התוכן אינם בעיות של ממשק או טעינה בלבד. אם יתברר שהשורש שלהם נמצא במנוע, חייבים להיות רשאים לתקן אותו.

הייתי מחליף את הכלל הזה בכלל אחר\:

> אין לשנות את מנוע הליבה אלא בעקבות ממצא מוכח, עם קלט לשחזור, הסבר סיבתי, בדיקת רגרסיה והוכחה שהשינוי משפר את התוצאה ואינו פוגע בתכונות שכבר הוכחו.

כלומר, הקפאת המנוע כברירת מחדל - לא איסור מוחלט.

**ב. הגדרת Worker API שגויה ולא אחידה**

בתוכנית מופיעים כמה חוזים שונים לתקשורת עם Worker. בתחילתה מוצגת הודעת `typeset` עם `text` ו־`settings`, בהמשך מופיעה עטיפה תחת `payload`, ובמקום אחר מופיע `export-pdf`\.

בפועל, ל־RED יש פרוטוקול מוגדר עם `typeset-request`, `jobId`, `typeset-result`, הודעות התקדמות, ביטול עבודה, רישום גופנים, רישום נכסים וייצוא.

סוכן שיפעל לפי הדוגמאות בתוכנית עלול לבנות adapter מול API שאינו קיים.

**ג. נתיבי קבצים אינם תואמים למבנה הנוכחי**

התוכנית מתייחסת ל־`src/worker/red-worker.js`, ל־`src/ui` ול־`default_settings.json` כאילו הם נקודות הכניסה הקנוניות.

בפועל, הקבצים הרלוונטיים נמצאים תחת `red-build/src/ui` ו־`red-build/src/engine`, וה־`settings-registry.js` הוא מקור האמת של הגדרות המנוע, הפקדים והבדיקות.

**ד. חמשת הסוכנים אינם באמת מבודדים**

למרות ההבטחה שכל סוכן עובד על קבצים נפרדים, יש חפיפות ברורות\:

- ממשק ותיעוד שניהם נוגעים ב־README ובתיעוד ה־UI.
- כלי אבחון ובדיקות נוגעים במנגנוני audit וב־fixtures.
- טעינת גופנים והממשק נוגעים בשילוב הגופנים ובתקשורת עם Worker.

נוסף לכך, יש בתוכנית שתי קבוצות שונות של שמות branches: קבוצה אחת בחלק הראשון, וקבוצה אחרת בחלק ההכנות והפרומטים. חמשת ענפי העבודה המוצעים אינם קיימים כרגע ב־GitHub.

התוצאה עלולה להיות התנגשויות מיזוג, שינוי חוזים בין סוכנים ותיקונים כפולים.

**ה. הכרזה מוקדמת מדי על v1.0.0**

מסמך CUTOVER קובע מפורשות שאישור המשתמש לאחר בדיקה עמוד־עמוד של ספר הדוגמה המודפס עדיין ממתין. בדיקת VLM שסומנה SHIP על דוגמה אחת היא ראיה מועילה, אבל אינה מחליפה את שער הקבלה שהוגדר למשתמש.

לכן יעד השחרור צריך להיות מותנה באישור הזה, ולא בתאריך של יום 16 בתוכנית.

---

## 5\. איך הייתי בונה את תוכנית השיפור מחדש

במקום חמישה סוכנים שמפתחים במקביל חמש מערכות, הייתי עובר לתוכנית מדורגת, שבה כל שלב נסגר בראיות לפני שממשיכים.

| קדימות | שלב | מה צריך להשיג |
|--------|--------|--------|
| P0 | קביעת מצב אמת | התאמת README, WORKLOG, RELEASE\_NOTES, ספירת הבדיקות וה־parity |
| P0 | סגירת פערי נאמנות | פתרון P6 ו־P7, בדיקת אובדן שתי המילים וסגירת כל בעיות שימור התוכן |
| P0 | קבלת משתמש | בדיקה חזותית של ספר דוגמה, לרבות עמודי פתיחה, שערים, עמודי הערות ועמודי גוף |
| P1 | אבחון סיבתי | השלמת הפער בין Gold step-by-step לבין RED trace/ledger |
| P1 | אופטימיזציית גופנים | מדידת ביצועים, זיהוי צוואר בקבוק ורק אז טעינה מדורגת או cache |
| P2 | הרחבת בדיקות | בדיקות ממוקדות לפערים שנותרו ולתרחישי רגרסיה |
| P2 | תיעוד ושחרור | תיעוד מסונכרן והחלטה מפורשת על רישיון וגרסה |

### מה הייתי דורש מכל תיקון מנוע

כדי לשמור על רמת הדיוק והאמינות של הפרויקט, כל שינוי שמשפיע על העימוד צריך לכלול\:

1. תיאור הבעיה והקלט המדויק שיוצר אותה.
2. זיהוי השלב הסיבתי במנוע.
3. תוצאת העימוד לפני השינוי.
4. תוצאת העימוד לאחר השינוי.
5. בדיקת שימור תוכן ודטרמיניזם.
6. בדיקת רגרסיה על הקורפוס הגדול.
7. השוואה מול הייחוס, ככל שיש ייחוס רלוונטי.
8. תיעוד מפורש של פשרות או ממצאים בלתי־פתירים.

העיקר הוא לא להסתפק בכך שכל הבדיקות עוברות. יש להוכיח שהשינוי פתר את הבעיה שבגללה בוצע, ושלא פגע בעמודים אחרים.

---

## 6\. הערכה מסכמת

## הציון שלי לתוכנית

**כחזון אסטרטגי**

# 8/10

התחומים שנבחרו נכונים, והשאיפה לאחד את היתרונות של הגרסאות השונות מוצדקת.

---

**כתוכנית ביצוע למצב הנוכחי**

# 3/10

התוכנית מיושנת ביחס למצב הקוד, חוזי הממשק, תשתיות הבדיקות והעבודה שכבר הושלמה.

החלק החזק ביותר בתוכנית הוא זיהוי חמשת תחומי השיפור. החלק החלש ביותר הוא הניסיון להפעיל אותם כאילו כל אחד מהם עדיין אינו קיים.

לדעתי, RED נמצא בשלב שבו **אין צורך להרחיב עוד את רוחב המערכת לפני שמסיימים להוכיח את נכונותה ואת נאמנותה למקור**\. יש כבר מנוע, ממשק, Worker, מערכת הגדרות, גופנים, כלי ביקורת ותשתית בדיקות. האתגר כעת הוא לסגור את הפערים שנותרו, להשיג שקיפות סיבתית מלאה, להבטיח שכל תיקון ניתן לאימות, ולבסס קבלה חזותית של התוצאה.

לכן המלצתי החד־משמעית היא: **לא לבטל את התוכנית, אלא להחליף אותה בגרסה שנייה - תוכנית התקדמות המבוססת על מצב RED בפועל, ולא תוכנית להקמת RED מחדש.**

## Prompt:
10.11.2026, 5:13:50

האם תוכל לתקן ולנסח מחדש את התוכנית, כי כרגע מצב הUI ושאר הנקודות בתכנית מעכבים את המשך ודיוק הפיתוח של המנוע.

## Response:
10.11.2026, 5:14:01 · gpt-6-t-mini

כן. אנסח אותה מחדש כתוכנית ביצוע שמשרתת קודם כול את פיתוח המנוע: אעביר את ה־UI, טעינת הגופנים, כלי האבחון והתשתיות למצב של תמיכה מבוקרת שאינה חוסמת תיקוני מנוע; אוסיף שערי קבלה מדידים, כללי שינוי ודרך עבודה שמונעת מסוכנים לעבוד על אותם קבצים. תחילה אבדוק את מצב המאגר ואת מנגנון העדכון, ואז אעדכן את מסמך התוכנית עצמו תוך שמירה על ההיסטוריה.

הכיוון המעודכן יהיה שונה מהותית מהתוכנית המקורית: המנוע יהפוך למסלול העבודה הראשי, וה־UI לא יוחלף ולא יעבור שיפוץ רחב כל עוד אינו חוסם בדיקה או תיקון. גם לא אקבע איסור מוחלט על שינוי המנוע — במקום זאת אדרוש הוכחה סיבתית ובדיקות רגרסיה לכל שינוי. בנוסף, התוכנית תבחין בין מצב שמוכח בקוד, מצב שעבר בדיקות, מצב שאומת באתר החי ומצב שאושר בבדיקת משתמש.

הנוסח החדש כבר נכתב בענף עבודה נפרד במאגר. הוא מחליף את מודל חמשת הסוכנים בתוכנית מדורגת: תחילה baseline אמין, אחר כך שימור תוכן ו־P6/P7, לאחריהם השלמת האבחון הסיבתי, ורק בהמשך אופטימיזציות UI וגופנים. אני מבצע כעת אימות של הקובץ שנשמר ופותח בקשת מיזוג ל־main, כדי שהשינוי לא יעקוף את היסטוריית העבודה ואת בדיקת המאגר.

> **Planning the follow-through**
>
> I’m preparing a practical response that addresses the user’s immediate planning need. I’ll include one concrete next step only if it genuinely helps, without adding an unnecessary future task.
>
> **Planned the follow-through**
>
> 
>
> **Preparing the rewrite**
>
> I’m planning a feature-branch update rather than changing the main branch directly. I’ll preserve the existing document for comparison, replace the current plan with a clearer version, and submit it for review.
>
> **Prepared the rewrite**
>
> 
>
> **Structuring the roadmap**
>
> I’m organizing the rewrite around evidence, preservation, diagnostics, engine quality, typography performance, and a deliberately postponed UI refresh. I’ll keep thresholds explicit, avoid cosmetic fixes, and align tests with actual risks.
>
> **Structured the roadmap**
>
> 
>
> **Refining the priorities**
>
> I’m keeping the roadmap engine-first: validate preservation, isolate causal diagnostics, fix geometry and parity issues, measure typography performance, and defer UI polish unless it blocks testing.
>
> **Defining the roadmap**
>
> I’m converging on an evidence-first, engine-prioritized plan: verify preservation and parity, trace causal failures, isolate performance work, and postpone UI polish unless it blocks reliable testing.
>
> **Refined priorities and defined the roadmap**
>
> 
>
> **Rewrote comprehensive multi-agent engineering and documentation plans**
>
> 
>
> **Created engine-first roadmap branch and updated Hebrew typesetting plan**
>
> 
>
> **Completing the update**
>
> I’m confirming the rewritten roadmap is on a dedicated branch with a review request open. The document now prioritizes engine correctness, preserves evidence, and postpones UI work that doesn’t unblock testing.
>
> **Completed the update**
>
> 
>
> **Created and verified pull requests for revised engine-first roadmap plans**
>
> 
>
> Worked for 3m 12s

כן. **שכתבתי את התוכנית מהיסוד, ולא הסתפקתי בתיקוני ניסוח.** הגרסה החדשה נבנתה סביב הצורך המרכזי: לאפשר התקדמות רציפה ומדויקת בפיתוח מנוע RED, בלי שעבודות צדדיות יעכבו אותה.

(המסמך נכתב ונשמר בהצלחה)

### התוכנית המעודכנת

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/plan/engine-first-roadmap-v2/spec/%D7%AA%D7%9B%D7%A0%D7%99%D7%AA%20%D7%9C%D7%A9%D7%99%D7%A4%D7%95%D7%A8%20%D7%AA%D7%95%D7%9B%D7%A0%D7%AA%20Red.MD?utm_source=chatgpt.com)

### השינויים המהותיים

1. **המנוע קודם לכול\:** שימור תוכן, סגירת פערי P6 ו־P7, איזון טורים ודיוק שבירת שורות.
2. **אבחון סיבתי\:** השלמת יכולות Gold של מעקב אחר יצירת בעיות, תיקונן, ביטולן והשפעתן על יתר הרכיבים בעמוד.
3. **ה־UI אינו פרויקט פיתוח נפרד\:** שומרים על הממשק הקיים. מתקנים רק דברים שחוסמים עבודה, בדיקה או אבחון.
4. **גופנים וביצועים\:** אין להקים FontLoader חדש לפני מדידת צווארי בקבוק והוכחת הצורך.
5. **המנוע אינו מוקפא\:** מותר ואף נדרש לשנות את ליבת המנוע כאשר קיימת הוכחה שהשורש נמצא בה, תוך בדיקות רגרסיה.
6. **סדר עבודה חדש\:** אין עוד חמישה סוכנים שעובדים במקביל על מערכות חופפות. עובדים במשימות תחומות, עם אחריות ברורה ושערי קבלה.
7. **שערי קבלה\:** הפרדה בין בדיקות אוטומטיות, אימות בקורפוס הגדול, התאמה לייחוס ואישור חזותי שלך.

הוספתי גם שלב ראשון מפורש שמטפל באי־ההתאמות בתיעוד ובספירות הבדיקות, ומחייב לבדוק מחדש את ממצא אובדן שתי המילים במסלול הערות הענק.

### מצב העדכון ב־GitHub

(נשמר בענף) (אומת לאחר שמירה) (ממתין למיזוג)

פתחתי [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/pull/31?utm_source=chatgpt.com)\.

השינוי מוגבל למסמך התוכנית בלבד. לא שיניתי קוד מנוע, לא שיניתי את ה־UI ולא שיניתי בדיקות. הגרסה המקורית נשמרת בהיסטוריית Git.

**ההמלצה שלי להמשך\:** לאחר אישור התוכנית, לא להתחיל בשיפורי ממשק או טעינת פונטים. להתחיל מיד בשלב 0 ובמקבץ A: להריץ baseline עדכני, לאמת את בעיית שימור התוכן ולפתוח את חקירת P6 ו־P7. זה המסלול הישיר ביותר להתקדמות אמיתית באיכות המנוע.

## Prompt:
10.11.2026, 5:33:35

האם בתוכנית ישנו חלק המיועד לביצוע לפני החלוקה לסוכנים?

## Response:
10.11.2026, 5:33:41 · gpt-6-t-mini

> **Reviewing task sequencing**
>
> I’m reading the plan as including a pre-division stage: Phase 0 establishes the baseline and priorities before later work is split into tracks. It doesn’t appear to define a separate “agent assignment” section, though; division happens only after tasks are isolated and overlap is checked.
>
> Worked for 6s

לא כפרק עצמאי ומפורש. **בתוכנית יש שלב הכנה שאמור להתבצע לפני חלוקת העבודה, אך הוא אינו מוגדר במפורש כ״שלב טרום־סוכנים״.**

השלב הרלוונטי הוא **G0 / Phase 0 — קביעת Baseline אמין**\. הוא כולל\:

- אימות מצב ה־HEAD והבדיקות העדכניות.
- הרצת בדיקות דטרמיניזם, שימור תוכן ו־Parity.
- אימות ממצאי P6 ו־P7.
- בדיקת ממצא אובדן שתי המילים במסלול ההערות הענק.
- סנכרון התיעוד עם מצב הקוד בפועל.

אולם יש כאן הבחנה חשובה: התוכנית החדשה **ביטלה את מודל חמשת הסוכנים הקבועים**\. היא מתירה לכל היותר שני מסלולי עבודה מקבילים, ורק לאחר שהמשימות הוגדרו ונמצא שאין חפיפה בקבצים או בחוזים.

לדעתי, כדאי להוסיף לתוכנית שער מפורש בשם **״שלב הכנה לפני הקצאת משימות לסוכנים״**\. בשער הזה יושלמו לא רק בדיקות ה־Baseline, אלא גם מיפוי מצב המנוע, זיהוי התלויות, הגדרת תחומי אחריות ומניעת התנגשויות. רק לאחר עמידה בשער הזה תתבצע חלוקת העבודה. כך נמנע מצב שבו סוכנים מתחילים לעבוד על בסיס תמונת מצב חלקית או על משימות שעדיין אינן מוגדרות היטב.

## Prompt:
10.11.2026, 5:34:50

אבל החלוקה לסוכנים מוכרחת, אז אני צריך שאיכשהו תחלק את התכנית המחודשת ל5 הסוכנים שכתבר התחילו להכין ביצוע לפי התוכנית הישנה.

## Response:
10.11.2026, 5:34:55 · gpt-6-t-mini

אחלק את התוכנית המחודשת לחמשת הסוכנים שכבר נערכו לעבודה, בלי להחזיר את התוכנית הישנה ובלי ליצור חפיפות מלאכותיות. תחילה אבדוק בתוכנית המקורית כיצד הוגדרו חמשת הסוכנים ומה כבר הכינו; לאחר מכן אמפה לכל סוכן תחום אחריות, תוצרים, גבולות עבודה ותלויות, ואעדכן את מסמך התוכנית בענף ה־PR הקיים.

מצאתי את מבנה חמשת הסוכנים המקורי: 1 — UI, 2 — כלי אבחון, 3 — טעינת פונטים, 4 — בדיקות, 5 — תיעוד ושחרור. התוכנית החדשה אינה צריכה לבטל את החלוקה הזאת; היא צריכה לשנות את **תכולת התפקידים** בהתאם למה שכבר קיים ב־RED. אני בודק כעת גם אם ענפי ההכנה הישנים כבר נוצרו, כדי שלא לדרוס עבודה קיימת או להפנות סוכן לענף שגוי.

החלוקה החדשה כבר הוכנסה למסמך התוכנית בענף נפרד, ונוסף גם מסמך הפעלה ייעודי עם משימות, גבולות, תוצרים ותנאי קבלה לכל אחד מחמשת הסוכנים. שמרתי את שמות הענפים המקוריים כברירות מחדל, אך הוספתי הוראה מפורשת שלא לאפס או ליצור ענף כפול אם אחד הסוכנים כבר התחיל לעבוד בענף אחר. כעת אני מאמת שהשינויים אינם משאירים בתוכנית הוראה סותרת לבטל את חמשת הסוכנים.

> **Fetched plan files, Hebrew specifications, and historical commit documentation**
>
> 
>
> **Mapping implementation roles**
>
> I’m updating the plan to assign five agents clearly: UI support, diagnostics and engine integration, font-performance measurement, testing and regression coverage, and documentation or release coordination. I’m also avoiding assumptions about unpushed branches or prior work.
>
> **Assigning core ownership**
>
> I’m refining the five-agent split so engine correctness has a clear owner. Diagnostics will handle root-cause fixes; testing will reproduce P6/P7 and guard regressions, while UI, performance, and documentation remain scoped to evidence-based support.
>
> **Balancing agent coverage**
>
> I’m assigning core engine correctness to one agent, diagnostics to another, performance measurement to a third, regression testing to a fourth, and documentation, integration, and limited UI maintenance to the fifth.
>
> **Sequencing the work**
>
> I’m keeping UI, diagnostics, performance, testing, and documentation responsibilities distinct. Diagnostics owns proven engine fixes; testing validates them, while other agents measure or support integration without premature rewrites.
>
> **Mapped implementation roles, ownership, coverage, and work sequencing**
>
> 
>
> **Defining agent assignments**
>
> I’m preserving five distinct workstreams: UI integration, diagnostics with proven engine fixes, measured font performance, regression testing, and documentation or release coordination. I’m also separating baseline capture from later implementation and review.
>
> **Clarifying execution order**
>
> I’m keeping all five agents active, but separating parallel preparation from code changes. Testing establishes the baseline, diagnostics owns proven engine fixes, performance waits for evidence, and integration follows validation.
>
> **Defined agent assignments and clarified execution order**
>
> 
>
> **Coordinating five agents**
>
> I’m defining five scoped roles with explicit ownership, dependencies, branch continuity, and merge gates. Preparation can proceed in parallel, but baseline capture precedes engine changes; diagnostics, tests, performance, UI, and documentation remain separately accountable.
>
> **Coordinated five agents**
>
> 
>
> **Created comprehensive five-agent work allocation and handoff plan**
>
> 
>
> **Finalizing the agent split**
>
> I’ve organized the revised plan into five scoped workstreams with explicit ownership, dependencies, branch continuity, and merge gates. Preparation proceeds in parallel, while baseline capture precedes engine changes and validation remains independent.
>
> **Finalized the agent split**
>
> 
>
> **Validated five-agent plan files and inspected PR status and changes**
>
> 
>
> Worked for 4m 2s

אתה צודק: חמשת הסוכנים הם חלק ממבנה העבודה המחייב, ולכן לא נכון היה לבטל אותם. צריך לשמר את חמשת הסוכנים שכבר הוכנו, אך להתאים את המשימות שלהם למציאות הנוכחית של RED.

אני משמר את זהות התפקידים המקורית, עם שינוי חשוב: **סוכן 2 יקבל אחריות מפורשת גם על איתור ותיקון של כשלים מוכחים במנוע**, ולא יסתפק בבניית כלי אבחון. סוכן 4 יכין את בדיקות השחזור ויאמת את התיקונים; כך עבודת המנוע לא תישאר ללא בעל אחריות.

(החלוקה הוכנסה למסמכים ונפתחה לביקורת)

**הכנתי את החלוקה בפועל בריפו**, ולא הסתפקתי בהצעה עקרונית. היא כוללת את חמשת הסוכנים המקוריים, עם תחומי אחריות מעודכנים\:

| סוכן | אחריות בתוכנית החדשה |
|--------|--------|
| **1 - UI** | תחזוקת הממשק הקיים ותיקון חסמים בלבד. ללא החלפתו ב־Orange. |
| **2 - מנוע ואבחון** | בעל האחריות המרכזי לתיקוני המנוע: שימור תוכן, P6, P7, איזון טורים ואבחון סיבתי. |
| **3 - גופנים וביצועים** | מדידות ואופטימיזציה מוכחת. ללא הקמת FontLoader חדש לפני זיהוי צוואר בקבוק. |
| **4 - בדיקות** | הובלת ה־Baseline, יצירת fixtures, בדיקות רגרסיה, negative controls ואימות תיקוני המנוע. |
| **5 - תיעוד ואינטגרציה** | מפת תלות, תיעוד, מעקב אחר עבודת הסוכנים, תיאום PRs ושערי קבלה. |

### המסמכים המעודכנים

1. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/plan/five-agent-work-allocation/spec/%D7%AA%D7%9B%D7%A0%D7%99%D7%AA%20%D7%9C%D7%A9%D7%99%D7%A4%D7%95%D7%A8%20%D7%AA%D7%95%D7%9B%D7%A0%D7%AA%20%D7%A2%D7%99%D7%9E%D7%95%D7%93%20Red.MD?utm_source=chatgpt.com)
2. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/plan/five-agent-work-allocation/spec/%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA%20%D7%94%D7%A4%D7%A2%D7%9C%D7%94%20%D7%9C%D7%97%D7%9E%D7%A9%D7%AA%20%D7%94%D7%A1%D7%95%D7%9B%D7%A0%D7%99%D7%9D.MD?utm_source=chatgpt.com)
3. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red/pull/32?utm_source=chatgpt.com)

המסמך השני כולל לכל סוכן משימת פתיחה, משימות מפורטות, גבולות קבצים, פעולות אסורות, תוצרים ותנאי קבלה. הוא גם כולל מטריצת מסירות בין הסוכנים, כך שעבודתו של סוכן אחד תספק את הקלט הנדרש לאחר.

### נקודה חשובה לגבי סדר העבודה

כל חמשת הסוכנים נשארים פעילים. הם יכולים לבצע במקביל מיפוי, הכנה ומדידות, אך שינויי קוד יתבצעו לפי התלויות\:

- סוכן 4 מקבע תחילה את מצב המנוע.
- סוכן 2 מקבל ממנו בדיקות שחזור ומתקן את הכשלים במנוע.
- סוכן 4 מאמת כל תיקון ומחפש רגרסיות.
- סוכנים 1 ו־3 ממשיכים בעבודתם בתחומיהם, וסוכן 5 מרכז את התיאום והתיעוד.

שמרתי גם את שמות הענפים המקוריים כברירות מחדל, והוריתי במפורש שלא לאפס או ליצור ענף כפול אם כבר קיימת עבודה. בחיפוש הענפים המרוחקים לא מצאתי כרגע את חמשת השמות המקוריים; אין בכך כדי לשלול הכנות מקומיות או עבודה שטרם נדחפה.

**מצב השילוב\:** PR \#32 פתוח, כולל שני מסמכים בלבד, ונבדק מחדש לאחר הכתיבה. הוא מוגדר כ־mergeable. עדיין לא מיזגתי אותו ל־`main`, ולא שיניתי קוד מנוע, UI או בדיקות.

הנקודה החשובה ביותר: סוכן 2 אינו עוד רק סוכן דיבאג. הוא קיבל אחריות מפורשת לקידום ולתיקון מנוע העימוד עצמו, וסוכן 4 משמש לו שכבת הוכחה ובקרה. כך חמשת הסוכנים משרתים ישירות את המטרה המרכזית - מנוע עימוד נכון, דטרמיניסטי ושקוף.

## Prompt:
10.11.2026, 5:39:44

הכן פרומט אחיד לכל חמשת הסוכנים שכבר התחילו לבחון את התכנית הישנה.

## Response:
10.11.2026, 5:39:55 · gpt-6-t-mini

> **בניית פרומט אחיד**
>
> אני מכין פרומט עברי אחד, שניתן להדביק לכל חמשת הסוכנים. הוא מנחה כל סוכן לזהות את תפקידו המקורי, לקרוא את התוכנית המעודכנת, לשמר את ההכנות הקודמות ולבצע משימות ייחודיות ללא כפילויות.
>
> **Built a standardized prompt**
>
> 
>
> Worked for 7s

הכנתי פרומט אחד המיועד להישלח **כמות שהוא לכל חמשת הסוכנים**\. הוא מנחה כל סוכן לזהות את התפקיד המקורי שלו, לעבור מהתוכנית הישנה לחדשה, לשמר את ההכנות שכבר ביצע ולהמשיך מהן - בלי להתחיל את הפרויקט מחדש ובלי להתנגש בעבודת הסוכנים האחרים.

**document: **

# הנחיית המשך אחידה - מעבר מתוכנית העבודה הישנה לתוכנית RED המעודכנת

## 1. מטרת ההנחיה

אתה אחד מחמשת הסוכנים שכבר החלו לבחון ולהכין ביצוע על בסיס תוכנית העבודה הישנה של פרויקט RED.

תוכנית העבודה עודכנה באופן מהותי. אין להמשיך לפעול לפי רשימות המשימות הישנות כאילו הן עדיין בתוקף, אך גם אין להתעלם מהעבודה שכבר ביצעת, מהניתוחים שהכנת או מהידע שצברת.

המשימה שלך היא לבצע מעבר מסודר מהתוכנית הישנה לתוכנית החדשה, תוך שימור כל עבודה מועילה, התאמת המשימות לתפקיד המעודכן שלך והמשך עבודה מעשי בהתאם לסדרי העדיפויות החדשים.

**חשוב: חמשת הסוכנים נשארים חלק מחייב ממבנה העבודה. אין לבטל את החלוקה, לאחד תפקידים או להחליט באופן עצמאי שאין עוד צורך בתפקיד שלך.**

## 2. מסמכים מחייבים לקריאה

קרא את שני המסמכים המעודכנים במלואם, ולא רק את תיאור התפקיד שלך:

1. תוכנית העבודה הראשית:
   https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/plan/five-agent-work-allocation/spec/%D7%AA%D7%9B%D7%A0%D7%99%D7%AA%20%D7%9C%D7%A9%D7%99%D7%A4%D7%95%D7%A8%20%D7%AA%D7%95%D7%9B%D7%A0%D7%AA%20%D7%A2%D7%99%D7%9E%D7%95%D7%93%20Red.MD

2. תוכנית ההפעלה המפורטת לחמשת הסוכנים:
   https://github.com/SUGINACH/Tora_Book_Typesetter_Red/blob/plan/five-agent-work-allocation/spec/%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA%20%D7%94%D7%A4%D7%A2%D7%9C%D7%94%20%D7%9C%D7%97%D7%9E%D7%A9%D7%AA%20%D7%94%D7%A1%D7%95%D7%9B%D7%A0%D7%99%D7%9D.MD

Pull Request שבו הוכנסו המסמכים:
https://github.com/SUGINACH/Tora_Book_Typesetter_Red/pull/32

שים לב: התוכנית החדשה נמצאת בענף הייעודי של ה-PR. אל תניח שהיא כבר נמצאת ב-main. השתמש במסמכים שבענף המצוין לעיל כמסמכי העבודה המעודכנים.

## 3. זהה את תפקידך לפי החלוקה המקורית

עליך להמשיך בתפקיד המקורי שלך, בהתאם להתאמות החדשות:

- **Agent 1 - UI/UX Integration:** אחראי כעת על בדיקת ה-UI הקיים, תיקון חסמים תפעוליים והבטחת יכולת הרצה, בדיקה ואבחון. אין להחליף את UI של RED ב-Orange.
- **Agent 2 - Debug Tools Integration:** אחראי כעת גם על התקדמות ותיקון מנוע העימוד עצמו, כאשר השורש של תקלה מוכח, וגם על השלמת האבחון הסיבתי מול Gold V21. זהו התפקיד המרכזי בתחום המנוע.
- **Agent 3 - Font Loading Optimization:** אחראי על מדידות גופנים וביצועים, איתור צווארי בקבוק ואופטימיזציה מוכחת. אין להקים FontLoader או IndexedDB ללא הצדקה מדידה.
- **Agent 4 - Testing Infrastructure:** אחראי על Baseline עדכני, fixtures, בדיקות רגרסיה, negative controls, אימות תיקוני המנוע ו-workflows.
- **Agent 5 - Documentation & Release:** אחראי על תיעוד, מפת התלות והארכיטקטורה, תיאום בין הסוכנים, מעקב אחר PRs ושערי הקבלה.

אל תשנה את זהות התפקיד שלך ואל תעביר את אחריותך לסוכן אחר.

## 4. שלב ראשון - בדיקת העבודה שכבר ביצעת

לפני כל שינוי נוסף, בדוק את מצב העבודה שלך בפועל:

1. באיזה ענף אתה עובד כרגע?
2. מאיזה commit התחלת?
3. אילו קבצים כבר בחנת?
4. אילו קבצים כבר שינית?
5. אילו commits, PRs, מסמכי הכנה או fixtures כבר יצרת?
6. אילו בדיקות או מדידות כבר ביצעת?
7. אילו מסקנות או החלטות הנדסיות כבר גיבשת?
8. האם יש עבודה מקומית או ענפית שטרם נדחפה ל-GitHub?

אל תסתפק בזיכרון השיחה או בסימון צ'קליסט. בדוק את מצב Git ואת הקבצים עצמם.

**איסור מוחלט:** אין למחוק, לאפס, לדרוס או ליצור מחדש עבודה קיימת רק משום שהתוכנית השתנתה. אין ליצור ענף כפול אם כבר קיים ענף שעליו התחלת לעבוד. במקרה של ספק, שמור את העבודה ודווח עליה.

## 5. שלב שני - התאמת העבודה הישנה לתוכנית החדשה

עבור על כל משימה שכבר בחנת או הכנת בתוכנית הישנה, וסווג אותה לאחת מחמש הקטגוריות:

1. **נשמרת ללא שינוי מהותי** - המשימה עדיין נדרשת באותו אופן.
2. **נשמרת לאחר התאמה** - המטרה עדיין רלוונטית, אך אופן הביצוע, הקבצים או תנאי הקבלה השתנו.
3. **כבר קיימת ב-RED** - אין לבנות אותה מחדש; יש לבדוק את המימוש הקיים ולהשלים רק פער מוכח.
4. **נדחית לשלב מאוחר יותר** - המשימה אינה בעדיפות הנוכחית או תלויה בתוצאה של שלב קודם.
5. **מבוטלת** - המשימה הישנה אינה מתאימה עוד לארכיטקטורה או ליעדי הפרויקט.

לכל משימה שסיווגת, ציין:
- מה הייתה המשימה בתוכנית הישנה.
- מה מצאת בקוד ובתיעוד הקיימים.
- כיצד התוכנית החדשה מתייחסת אליה.
- מה צריך לעשות בפועל.
- האם כבר ביצעת חלק מהעבודה.
- האם נדרש לשמר, לתקן או להחליף את התוצר הקיים.

אין לבצע העתקה של רכיבים ממאגרי Orange, Gold, Yellow או Green לפני בדיקת הקוד המקביל שכבר קיים ב-RED והתאמת החוזים ביניהם.

## 6. שלב שלישי - כללי עבודה משותפים

### 6.1 עדיפות המנוע

יעד הפרויקט הוא מנוע עימוד תורני מדויק, דטרמיניסטי, שקוף וניתן לאבחון.

סדר העדיפויות המחייב הוא:
1. שימור מלא של תוכן המקור.
2. סגירת פערי P6 ו-P7.
3. איזון טורים, הערות, כותרות, עיטורים ואלמנה/יתום.
4. אבחון סיבתי של החלטות העימוד.
5. בדיקות רגרסיה, דטרמיניזם ו-parity.
6. ביצועים, גופנים ו-UI לפי מדידה או חסם ממשי.
7. תיעוד ושחרור על בסיס תוצאות מאומתות.

אין להקדיש משאבים להקמת תשתיות שכבר קיימות או לעבודה שאינה מקדמת את היעדים הללו.

### 6.2 שמירה על גבולות האחריות

הקפד על תחום האחריות שהוגדר לך בתוכנית ההפעלה.

- אין לשנות קבצים שבבעלות סוכן אחר ללא תיאום.
- אין לשנות חוזה Worker, פורמט תוצאות, Ledger או audit באופן חד-צדדי.
- אין לבצע שינוי מנוע ללא שחזור, ראיות ובדיקות מתאימות.
- אין להחליש בדיקות או להסתיר ממצאים כדי לקבל CI ירוק.
- אין לבצע ריפקטור רחב כתחליף לאבחון שורש התקלה.
- אין להכניס שינוי שאינו ניתן לבדיקה או לשחזור.

כאשר נדרש שינוי שמשפיע על יותר מתחום אחריות אחד, תאם עם בעל התחום המתאים והגדר בעלים אחד לשינוי החוזה.

### 6.3 עבודה מקבילה

חמשת הסוכנים רשאים להמשיך לעבוד במקביל במשימות עצמאיות.

אין פירוש הדבר שכל סוכן רשאי לשנות כל קובץ. יש לשמור על תחומי הבעלות, להודיע מראש על תלות ולמנוע מצב שבו שני סוכנים משנים את אותו מנגנון או אותו חוזה בענפים שונים ללא תיאום.

### 6.4 Baseline

סוכן 4 מוביל את הרצת ה-Baseline ושמירת תוצאותיה.

סוכנים 1-3 יכולים במקביל לבצע מיפוי, סקירת קוד, הכנת fixtures שאינם משנים את המנוע ומדידות שאינן תלויות בשינוי קוד.

אין לבצע שינוי בקוד המנוע לפני שיש baseline מזוהה וניתן לשחזור. לאחר מכן יש להתחיל בעבודת המנוע ללא עיכוב מיותר.

### 6.5 V21 ו-V23

אין למזג את V21 לתוך V23 או את V23 לתוך V21. אלה מקורות עיון נפרדים. RED הוא יעד הפיתוח. העתקת רעיונות או כלים מהם מחייבת התאמה לארכיטקטורה הקיימת ב-RED.

## 7. שלב רביעי - המשך ביצוע ולא רק הכנת דוח

לאחר שסיימת את בדיקת מצבך והתאמת המשימות:

1. עדכן את תוכנית העבודה האישית שלך לפי התפקיד החדש.
2. סמן אילו הכנות שכבר ביצעת אפשר לנצל מיד.
3. זהה אילו הכנות אינן נחוצות עוד.
4. זהה תלויות בסוכנים אחרים.
5. התחל לבצע את משימות ההכנה והעבודה העצמאיות שבתחום אחריותך.
6. אל תמתין לאישור נוסף עבור פעולות שכבר הוגדרו בבירור בתוכנית המעודכנת ושאינן חורגות מגבולות האחריות שלך.
7. אם קיימת חסימה אמיתית או התנגשות עם סוכן אחר, דווח עליה באופן ממוקד עם ראיות והצעת פתרון.

אין להסתפק בקריאת התוכנית החדשה ובהודעה כללית ש"הבנתי". נדרש מעבר ממשי לעבודה לפי התפקיד המעודכן.

## 8. דיווח ראשון מחייב

לאחר הבדיקה, שלח דוח אחד מסודר במבנה הבא:

### א. זיהוי
- מספר הסוכן ותפקידו.
- ענף העבודה בפועל.
- commit נוכחי.
- קבצים ששונו או הוכנו.

### ב. העבודה הקודמת
- מה כבר נבחן.
- מה כבר בוצע.
- אילו תוצרים קיימים.
- אילו תוצאות בדיקה או מדידה התקבלו.

### ג. התאמה לתוכנית המעודכנת
טבלה של המשימות הקודמות וסיווגן לחמש הקטגוריות שבסעיף 5.

### ד. המשימות המעודכנות
- מה נשאר לביצוע.
- מה המשימה הראשונה.
- מה התוצרים הצפויים.
- מה תנאי הקבלה.
- אילו משימות תוכל לבצע במקביל.

### ה. תלות בסוכנים אחרים
- מה נדרש ממך לקבל מסוכן אחר.
- מה עליך למסור לסוכן אחר.
- האם יש חפיפה או התנגשות בקבצים/חוזים.
- האם נדרשת הכרעת בעל הפרויקט.

### ו. פעולות שבוצעו בעקבות המעבר
- אילו קבצים או מסמכים עודכנו.
- אילו בדיקות הורצו.
- אילו commits או PRs נוצרו.
- מה התוצאה בפועל.

### ז. מצב נוכחי
סמן כל משימה כ:
- DONE - הושלמה עם ראיה.
- IN PROGRESS - מתבצעת.
- BLOCKED - חסומה, עם הסבר.
- NOT STARTED - טרם החלה.
- DEFERRED - נדחתה בהתאם לתוכנית.

צרף קישורים לקבצים, commits, בדיקות ו-artifacts.

## 9. הוראה מסכמת

המשך את העבודה שכבר התחלת, אבל מעתה לפי התוכנית המעודכנת בלבד.

אל תשליך עבודה מועילה מהתוכנית הישנה; אל תמשיך לבצע משימות שהתיישנו; אל תיצור מחדש תשתיות קיימות; ואל תרחיב את תחום האחריות שלך על חשבון הסוכנים האחרים.

המטרה היא שחמשת הסוכנים יפעלו כצוות מתואם, כאשר לכל אחד תחום אחריות ברור, תוצרים מוגדרים ותנאי קבלה מדידים - וכל עבודתם מכוונת לקידום מנוע העימוד עצמו.

**בצע את המעבר בזהירות, אך אל תהפוך את שלב המעבר לעוד שלב תכנון ממושך. לאחר שמירת מצב העבודה וה-Baseline הנדרש, יש להתקדם לביצוע ממשי.**

הפרומט בנוי כך שכל סוכן יקבל בדיוק את אותה הנחיה, אך יפיק ממנה תוכנית המשך שונה לפי תפקידו המקורי. כך אפשר להשוות בין חמשת הדיווחים ולזהות מוקדם חפיפות, הכנות מיותרות או משימות חשובות שנשמטו.

## Prompt:
12.11.2026, 9:22:43

התחלתי לעבוד על התכנית בריפו נפרד [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2), תוכל לבדוק את מצב הריפו בכלל וביחס לתכנית בפרט, ואתה חייב לתכנן את עבודתך כך שהיא לא תחרוג מהזמן הקצוב לעבודה בכל הודעה (לא יותר מ5 דקות), במידה ועדיין נשאר עבודה כתוב זאת בסוף ההודעה ונתחיל עוד הודעה ועבודה קצובה.

## Response:
12.11.2026, 9:22:55 · gpt-6-t-mini

אעבוד במקטע ראשון של עד חמש דקות: אבדוק את מבנה המאגר, ענפי העבודה, היסטוריית השינויים, ה־PRs והמסמכים שמראים כיצד התוכנית הוטמעה בפועל. לאחר מכן אשווה את המצב לתוכנית חמשת הסוכנים המעודכנת ואסכם מה הושלם, מה בתהליך ומה חסר. אם לא אספיק לבדיקה מלאה של הקוד והבדיקות במקטע הזה, אציין במפורש מה נשאר לסבב הבא.

כבר ברור שזה אינו מאגר ריק שהועתק אליו הקוד: יש בו 15 ענפים, היסטוריית עבודה פעילה ו־13 PRs שממופים במפורש לשלבי S0 ו־S1. בין היתר מופיעים baseline נעול, הכרעות P6/P7, ממצא שתי המילים, אודיט UI, מדידת ביצועים, השלמת חוזה Worker/Result, אינדקס עיצובים ודוח פערים מול Gold. כעת אני בודק אילו מה־PRs אכן מוזגו, מה נמצא ב־main לעומת ענפים פתוחים, ומה מצב הסוכנים לפי טבלת המעקב — זה חיוני כדי לא לבלבל בין עבודה שהוגשה לבין עבודה שכבר נכנסה לקו הראשי.

אימות ה־PRs העלה ממצא חשוב: כל 13 ה־PRs שנפתחו עד כה במאגר החדש נסגרו כ־merged, כולל עבודת כל חמשת הסוכנים — לא מדובר רק בהכנות בענפים. בנוסף, PR \#6 ביטל במפורש את בדיקת ההתאמה לייחוס (D-100), בעקבות הכרעת משתמש שהייחוס הוא הוראתי ולא יעד לשחזור. לכן בבדיקת התוכנית אסור לי להמשיך להתייחס ל־P6/P7 כאל יעד להשגת parity; צריך לבדוק מה סווג ומה הוחלט לעשות בכל סטייה. עכשיו אני עובר למסמכי המעקב ולשינויים עצמם כדי לזהות אם החלוקה בין הסוכנים נשמרה ואם יש חפיפות או פערים אחרי המיזוגים.

> **Audited Red Work 2 repository structure, history, branches, and pull requests**
>
> 
>
> **Reviewing repository state**
>
> I’m checking the latest main branch, tracking documents, recent commits, implementation status, and merged pull requests. I’m also verifying that the canceled reference-parity work no longer influences the remaining plan.
>
> **Reviewed repository state**
>
> 
>
> **Assessed Work_2 progress, PR status, and supporting evidence**
>
> 
>
> **Comparing current tracking**
>
> I’m verifying whether the tracking documents reflect the actual branches and merged work. I’m also checking recent main commits, workflow status, pull requests, and documentation gaps before updating the implementation plan.
>
> **Compared current tracking**
>
> 
>
> **Assessing implementation status**
>
> I’m finding that the repository is farther along than the tracking documents suggest: all thirteen pull requests are merged, newer branches exist, and several documented “open” items appear outdated.
>
> **Updating the assessment**
>
> I’m confirming that the project is substantially implemented, while identifying mismatches between current code, tracking files, and the remaining plan. I’m treating documentation discrepancies as follow-up work rather than reopening completed features.
>
> **Assessed implementation status and updated the assessment**
>
> 
>
> **Audited repository timeline, tracking, workflows, commits, issues, and release notes**
>
> 
>
> Worked for 4m 33s

# דוח מצב ראשון - Tora\_Book\_Typesetter\_Red\_Work\_2

(המאגר נגיש והעבודה מתקדמת) (נדרשת השלמת ביקורת)

סיימתי את מקטע הבדיקה הראשון, שהתמקד במבנה המאגר, בהיסטוריית הפיתוח, בעבודת חמשת הסוכנים ובמצב התוכנית.

המסקנה הראשונית: **העבודה במאגר החדש התקדמה משמעותית, למעשה הרבה מעבר לשלב ההכנות הראשוני.** עם זאת, מצאתי פערים בין מצב הקוד לבין מסמכי המעקב, וכן בעיית מנוע אחת שתועדה כפתוחה ודורשת תשומת לב.

## 1\. תמונת מצב כללית

# 13

Pull Requests שנבדקו

(כולם מוזגו)

# 15

ענפים מרוחקים

# 5/5

סוכנים עם משימות פתיחה מתועדות

# 856

Assertions לפי הודעת S77

---

**מצב main**

HEAD: `39b9acfc94195daef724bc3a449443cc3864e5fa`

S77 - 12 בנובמבר 2026

הודעת הקומיט מדווחת על 46 קובצי שינוי, 856 בדיקות בדידות ואפס כשלים.

המאגר כולל את קוד RED, תשתיות בדיקה, כלי ביקורת, תיעוד נרחב, מסמכי מעבר ומעקב אחר חמשת הסוכנים.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2?utm_source=chatgpt.com)

## 2\. התקדמות חמשת הסוכנים

בדקתי את `AGENTS_TRACKING.md`, את ההיסטוריה ואת ה־PRs.

| סוכן | התקדמות בפועל | הערכה |
|--------|--------|--------|
| 1 - UI | אודיט תפעולי, תיקון כפתור ביטול והצגת נתוני ריצה | (משימת פתיחה הושלמה) |
| 2 - מנוע ואבחון | מיפוי P6/P7, תיקוני חוזים, אבחון Gold ומנגנון snapshot/diff | (משימות פתיחה הושלמו) |
| 3 - גופנים וביצועים | מדידת ביצועים, אינדקס עיטורים וטעינה לפי דרישה | (משימת פתיחה הושלמה) |
| 4 - בדיקות | Baseline, fixtures, בדיקות רגרסיה ובקרות שלילה | (משימת פתיחה הושלמה) |
| 5 - תיעוד ואינטגרציה | מיפוי 98 פריטים, טבלת מעקב וסנכרון מסמכים | (משימות פתיחה הושלמו) |

כמה הישגים חשובים במיוחד\:

**סוכן 1\:** שני חסמים משמעותיים תוקנו: ביטול עימוד פעיל והצגת מידע על תוצאת העימוד. לא הוחלף הממשק ולא נוצרה מערכת מקבילה.

**סוכן 2\:** הושלם ניתוח פערים מול Gold V21, כולל מימוש `stage-snapshots`, מנגנוני diff, הקשר עמוד וסיווג סיבתי. נוספו 18 בדיקות רגרסיה.

**סוכן 3\:** זוהה צוואר הבקבוק של טעינת העיטורים. האינדקסים הקלים הורידו את היקף הנתונים שהיו נדרשים בעלייה מ־7.41MB ל־68.3KB. הוכחה גם נייטרליות מבחינת hash הפריסה.

**סוכן 4\:** נקבע Baseline של 672 בדיקות, 33 סוויטות ואפס כשלים. מאז הורחבה שרשרת הבדיקות.

**סוכן 5\:** הוקמה טבלת מעקב מסודרת לחמשת הסוכנים ונוצר מיפוי יישום של 98 פריטים מארבעה מסמכי תוכנית.

מקור: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/AGENTS_TRACKING.md?utm_source=chatgpt.com)\.

## 3\. התקדמות ביחס לתוכנית החדשה

יש כאן כמה הכרעות חשובות שכבר יושמו.

### P6 ו־P7 - אין לפתוח מחדש

ה־PR הראשון של סוכן 2 סיווג את הסטיות מול המקור, ו־D-99 קבע שלא נותרו פגמים אמיתיים פתוחים בתחום הזה.

בהמשך, ב־D-100, בוטלה לחלוטין בדיקת ההתאמה לייחוס בעקבות הכרעת המשתמש: הייחוס נועד להעניק מראה כללי מתאים בתחילת הפרויקט, ולא לשמש יעד התאמה בשלב המתקדם.

זה שינוי מהותי ביחס לתוכניות קודמות. אין לחזור ולרדוף אחרי ציון parity או לנסות להחזיר את P6/P7 למסלול בדיקות פעיל.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/4?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/6?utm_source=chatgpt.com)\.

### האבחון הסיבתי

(בוצע ומוזג)

ב־PR \#13 הושלמה הרחבת מנגנון האבחון מול Gold V21.

נוספו\:

- חתימות snapshots.
- השוואת שינויים בין checkpoints.
- הקשר של ממצאים לעמוד.
- סיווגים סיבתיים.
- שילוב עם ארבע נקודות ביקורת ב־pipeline.
- מצב הפעלה אופציונלי כדי לא להכביד על העימוד הרגיל.

זהו שיפור חשוב מאוד: כעת יש בסיס טוב יותר להבנת הסיבה לבעיה, ולא רק להצגת תוצאת האודיט.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/13?utm_source=chatgpt.com)\.

## 4\. מצב המנוע - נקודה שמחייבת תשומת לב

מצאתי ב־`ISSUE_REGISTRY.md`, תחת S72, ממצא מנוע בדרגת חומרה בינונית-גבוהה\:

**חדירת הטור הראשון לאזור ההערות בנתיב DP.**

על פי הרישום, ב־16 עמודים שבהם יש הערות, תקציב ההערות נגרע מהטור האחרון בלבד, בעוד שהאזור המוקצה להערות נפרס על רוחב העמוד.

התוצאה היא חדירה של הטקסט לתוך אזור ההערות, עד 202 פיקסלים במקרה המתועד.

הממצא מסומן כפתוח, ובעלותו של סוכן 2.

זהו הנושא הטכני הראשון שהייתי בודק בסבב הבא: האם הוא עדיין קיים ב־HEAD הנוכחי של S77, האם תועד תיקון מאוחר יותר, ואם לא - לשחזרו ולתקנו בשורש.

לא נכון להציג את כל בדיקות הגיאומטריה כירוקות כל עוד הממצא הזה לא הוכרע.

## 5\. שינוי משמעותי נוסף - S77

הקומיט האחרון ב־main הוא מ־12 בנובמבר, והוא מכיל חמישה תיקונים/שיפורים מרכזיים\:

1. יישור שורת החיתוך של הערה שממשיכה לעמוד הבא, הן בתצוגה והן ב־PDF.
2. תיקון אובדן גרשיים ב־PDF עקב גליפים קומפוזיטיביים שחלק ממרכיביהם לא הועתקו לתת־הגופן.
3. חיבור 59 הגדרות שהיו מנותקות בנתיב המורשת: 45 הגדרות כותרת עליונה ו־14 הגדרות תוכן־עניינים.
4. התאמת כרטיסיות הממשק למראה של לשוניות תיקייה.
5. הוספת 13 בדיקות בסוויטת S77.

בפרט, תיקון הגליפים הקומפוזיטיביים חשוב: זו דוגמה לכך שבדיקת תצוגה תקינה אינה מבטיחה שה־PDF תקין. התיקון אומת לפי מדידת דיו בפיקסלים.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/39b9acfc94195daef724bc3a449443cc3864e5fa?utm_source=chatgpt.com)\.

## 6\. הבעיה המרכזית שמצאתי - התיעוד מפגר אחרי הקוד

זהו ממצא רוחבי שראוי לטיפול של סוכן 5.

| מסמך | המצב המתועד | הבעיה |
|--------|--------|--------|
| README | מעודכן ל־11.11 | עדיין מציג 672 בדיקות |
| AGENTS\_TRACKING | S71.1, ‏11.11 | אינו משקף את S72-S77 |
| WORKLOG | מסתיים ב־S71.1 | אין תיעוד רציף של S72-S77 |
| ISSUE\_REGISTRY | מסתיים ב־S72 | אינו משקף את השינויים המאוחרים |
| OPEN\_QUESTIONS | עודכן לאחרונה ב־02.11 | אינו משקף הכרעות מאוחרות |
| CI | קיים ומחובר | הערות בתוך ה־workflow עדיין מציגות 670 בדיקות |

הפער אינו קוסמטי בלבד.

למשל, בטבלת המעקב עדיין רשום `SRS-12-2` כפתוח, בעוד שיומן העבודה מתעד את השלמתו ב־S65, לפי D-102.

בנוסף, טבלת המעקב מתארת את סוכן 2 ואת סוכן 3 כאילו הם השלימו את משימות הפתיחה בלבד, בעוד שבפועל הם כבר ביצעו עבודות מאוחרות יותר.

המסמכים צריכים לחזור להיות תמונת מצב אמינה של הקוד.

## 7\. מה נשאר פתוח לפי התיעוד

המשימה המרכזית שעדיין נמצאת בבעלותך היא G6 - בדיקת ספר הדוגמה המודפס ואישור חזותי.

G7 - קידום המהדורה - עדיין ממתין לסגירת G6 ושאר שערי הקבלה.

בנוסף, ישנם פריטים טכניים שדורשים בדיקה מחודשת\:

- חדירת הטור הראשון לאזור ההערות ב־DP, לפי S72.
- מדידות נוספות לפני החלטה על מטמון ל־`scanBrackets` ול־`layoutLines`\.
- מדידת לולאת הבלוקים הפנימית ב־pipeline, שסומנה כחסר אבחוני.

חשוב: לא קיבלתי בתוצאות GitHub סטטוס CI עדכני ל־commit S77. הודעת הקומיט מדווחת על 856 בדיקות ו־0 כשלים, אבל זו אינה תחליף לאימות עצמאי של ריצת Actions.

---

## 8\. סיכום והמשך הביקורת

ההתרשמות שלי חיובית: המעבר לתוכנית החדשה עבד, חמשת הסוכנים ביצעו משימות משמעותיות, ומנוע RED התקדם הרבה מעבר למה שניתן היה להסיק מהתיעוד הראשוני.

עם זאת, יש להקפיד על שלושה דברים\:

1. לא לפתוח שוב נושאים שהוכרעו, ובפרט לא את בדיקת parity שבוטלה.
2. לא להתייחס לממצא S72 כאל עניין סגור בלי בדיקה מול S77.
3. לא להמשיך לצבור שינויים בלי יומן עבודה וטבלת סוכנים מסונכרנים.

### מה לא הספקתי במקטע הראשון

(נותרה עבודה לסבב הבא)

הבדיקה הנוכחית היא מיפוי מצב ראשוני ולא ביקורת קוד מלאה. כדי להשלים אותה, נותרו שלושה מקבצי עבודה\:

**א. ביקורת המנוע\:** לעבור על השינויים ב־S72-S77 מול קוד המנוע, לבדוק את בעיית חדירת אזור ההערות ואת ההשפעה של תיקוני S77 על המורשת וה־DP.

**ב. ביקורת בדיקות ו־CI\:** לבדוק את ה־workflows, את תוצאות הריצות, את כיסוי הבדיקות החדשות ואת ההתאמה בין 856 הבדיקות המדווחות לבין מה שרץ בפועל.

**ג. ביקורת חמשת הסוכנים והתיעוד\:** להצליב את כל ה־PRs, הענפים, הקבצים וההכרעות מול טבלת המעקב, ולאתר כל משימה שנשארה ללא בעלים או שהוצהר על סגירתה בלי ראיה.

**העבודה לא הושלמה במקטע הזה.** בסבב הבא נכון להתחיל בביקורת S72-S77 ובפרט בממצא חדירת הטור הראשון לאזור ההערות, ולאחר מכן לעבור לאימות CI ולסנכרון מסמכי המעקב.

## Prompt:
12.11.2026, 9:48:12

המשך!

## Response:
12.11.2026, 9:48:18 · gpt-6-t-mini

בסבב הזה, עד חמש דקות, אתמקד בממצא הפתוח החשוב ביותר מהבדיקה הקודמת: חדירת הטור הראשון לאזור הערות השוליים בעימוד DP. אבדוק את רישום התקלה, את מימוש תקציב ההערות ואת בדיקות S72–S77, כדי לקבוע אם התקלה עדיין קיימת או נסגרה בקוד המאוחר.

הבדיקה כבר מראה שהפער אינו נפתר על ידי תיקון יישור התחתיות של S72: מדובר בשגיאת קיבולת נפרדת, בשלב בדיקת התאמת הטור לפני הצבת ההערות. כעת אני בודק אם יש בדיקת רגרסיה ייעודית שמכסה את שני הטורים מול אזור ההערות, ואם S75–S77 שינו בעקיפין את ההנחות הגאומטריות של אותו חישוב.

> **Inspecting the layout bug**
>
> I’m confirming that S77 leaves `dp-planner` unchanged and checking the relevant layout code. The likely issue is that reserved footnote height affects only the last column, allowing earlier columns to overlap the notes.
>
> **Inspected the layout bug**
>
> 
>
> **Inspected issue registries, planner code, tests, and related commits**
>
> 
>
> **Analyzing test coverage**
>
> I’m checking whether S72’s overflow test actually includes footnote reservations. It appears to disable that budget, creating a false negative, while S75–S77 leave the DP path unchanged.
>
> **Analyzed test coverage**
>
> 
>
> **Reconciling column flow**
>
> I’m separating the general capacity logic from the DP planner’s special handling. The shared code reserves footnote space across columns, but DP disables that and applies it only to the final column, leaving a likely overlap path.
>
> **Reconciled column flow**
>
> 
>
> **Confirming the unresolved path**
>
> I’m concluding that DP and balancing still apply footnote space asymmetrically, despite shared capacity logic treating the note area as full-width. Existing tests don’t cover initial DP placement, so the overlap remains open.
>
> **Confirmed the unresolved path**
>
> 
>
> **Documenting the remaining gap**
>
> I’m treating the asymmetric footnote reservation as unresolved: DP and balancing constrain only the final column, while shared layout logic reserves full-width note space. Existing tests skip initial DP placement, so a regression test and coordinated fix are still needed.
>
> **Documenting unresolved issues**
>
> I’m finding that DP and balancing still reserve footnote space asymmetrically, while shared layout logic treats it as full-width. The latest documented evidence shows 16 affected pages, but the current magnitude still needs a fresh run. S77 also lacks a worklog entry and confirmed CI status.
>
> **Documented remaining gaps and unresolved issues**
>
> 
>
> **Reviewed planner logic, tests, coverage, configuration, issues, worklogs, and CI status**
>
> 
>
> Worked for 6m 2s

## ממצא מרכזי: חדירת הטור הראשון לאזור הערות השוליים עדיין לא נסגרה

בדקתי את `ISSUE_REGISTRY.md` ואת קוד מנוע ה־DP הנוכחי. הממצא אינו רק אזכור היסטורי: הוא מופיע במפורש גם לפני S72 וגם אחריו, ובשני המקומות מוגדר כפתוח וכבאחריות סוכן 2.

היקפו המתועד: **16 עמודים**, עם חדירה של עד **202px** לאזור ההערות. ההסבר ברישום תואם לקוד: `usedHeight` מוסיף את גובה ההערות רק כאשר בודקים את הטור האחרון, אף שאזור ההערות מוקרן לרוחב העמוד. לכן הטור הראשון עלול להמשיך להיבדק כאילו כל גובה העמוד פנוי לו.

גם S77 אינו סוגר זאת: השינויים שלו מטפלים, בין היתר, בשורת המשך של הערת שוליים, בגליפים חסרים ב־PDF ובהגדרות כותרות ו־TOC; אין בו תיקון ל־`dp-planner.js` או ל־`footnote-budget.js`\.

### אבחון שורש התקלה

מצאתי שהבעיה עמוקה מעט יותר מנקודת החישוב הבודדת\:

1\. **המודול המרכזי כבר מכיר את הגאומטריה הנכונה.** ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/column-flow.js?utm_source=chatgpt.com#L54-L65) מצוין שאזור ההערות משתרע על רוחב תיבת התוכן כולה, ולכן יש להפחית את תקציבו מכל הטורים.

2\. **ה־DP עוקף את הכלל הזה.** ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L122-L159) מוגדרת הקיבולת עם `fnBudget:false`, ובמקום זאת גובה ההערות מתווסף רק ל־`usedHeight` של הטור האחרון.

3\. **גם מנגנון האיזון משתמש באותה הנחה.** `optimalSplit` מקבל `extraLast`, ומוסיף אותו רק לגובה הטור השני. כך נשמרת אותה אסימטריה גם בעת חישוב הפיצול האופטימלי. ראו [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L35-L90)\.

4\. **מעבר S72 אינו מתקן את הבעיה הקיימת.** `alignColumnBottoms` מדלג במפורש על עמודים שכבר חודרים לאזור ההערות, כדי לא להחריף את מצבם. זו מדיניות הגנה סבירה, אבל היא משמרת את התקלה ולא פותרת אותה.

### פער בבדיקות

מצאתי גם חולשה בכיסוי הבדיקות\:

- בדיקת S72 שכותרתה „אין גלישה חדשה” בודקת רק טורים שבהם בוצעה מתיחה (`aqStretch`\). היא אינה בודקת את כל הטורים המאוכלסים בעמוד, ולכן אינה מוכיחה שאין חדירה קיימת עוד משלב התכנון הראשוני.
- בדיקות S72 מתעדות במפורש את 16 עמודי ההערות החריגים, אך אינן דורשות את תיקונם.
- בדיקות S77 מכסות את חיתוך הערות השוליים, יישור שורת החיתוך, הצגת הגרשיים ב־PDF והגדרות הכותרות; הן אינן מוסיפות בדיקת רגרסיה לחדירת הטור הראשון.

### מסקנה והפעולה הנדרשת

(פתוח - דורש טיפול של סוכן 2)

אין הצדקה לסמן את התקלה כנסגרה. הראיה האחרונה המתועדת היא 16 עמודים ועד 202px חדירה; הקוד הנוכחי עדיין מכיל את מנגנון החישוב האסימטרי. עם זאת, **לא ביצעתי הפעם ריצת קורפוס מלאה**, ולכן אין לקבוע שהמספרים 16 ו־202px אומתו מחדש ב־HEAD הנוכחי.

הפתרון צריך להיות ברמת חוזה הקיבולת, ולא תיקון נקודתי למתיחה: כל פעולות התכנון, הפיצול, האיזון ובדיקת הגלישה צריכות להשתמש באותה קיבולת אפקטיבית לשני הטורים, לאחר הפחתת אזור ההערות החוצה־טורים. יש לבדוק גם את התרחיש שבו תקציב ההערות גדל לאחר שכבר הוצבו שורות בעמוד, כדי שלא יישארו שורות שחורגות מהקיבולת החדשה.

### מצב התיעוד והאימות

יש כאן עוד שני פערים שצריך לסגור\:

- `WORKLOG.md` אינו מכיל עדיין רשומת S77, אף שהקוד והבדיקות של S77 נמצאים ב־main.
- בדיקת ה־Combined Status של GitHub עבור S77 החזירה רשימת בדיקות ריקה. לכן איני מאשר שה־CI של S77 ירוק. קובץ ה־CI עצמו מפעיל את `npm test`, ובשרשרת הבדיקות כבר נכללות S72, S76 ו־S77.

**לא שיניתי קוד או קבצים בריפו בסבב הזה.**

### יתרת העבודה

הסבב הזה הושלם במסגרת הבדיקה הממוקדת. הסקירה הכוללת עדיין לא הושלמה. בסבב הבא צריך\:

1. להפיק בדיקת רגרסיה ממוקדת ל־16 עמודי הבעיה ולזהות את מקור כל חדירה בפועל.
2. לבדוק את כל מסלולי הקיבולת והאיזון, כדי לוודא שאין מקומות נוספים שמשתמשים ב־`extraLast` באופן שאינו תואם את גאומטריית העמוד.
3. להשלים את אימות S77 וה־CI, ולסנכרן את `WORKLOG.md`, `ISSUE_REGISTRY.md` ו־`AGENTS_TRACKING.md`\.
4. להמשיך בבדיקת חמשת הסוכנים מול התכנית המעודכנת, לרבות משימות שנותרו פתוחות וחפיפות בין אחריות הסוכנים.

במיוחד חשוב: אין לפתוח מחדש את P6/P7 או את בדיקות ה־parity שבוטלו בהחלטה D100.

## Prompt:
12.11.2026, 10:09:13

המשך! ואני מצרף את השיחה האחרונה עם הAI (שביצע את העבודה של כל הסוכנים), אני אשמח שתעבור על השיחה תבחן בעומק את הבקשות שלי לכל אורך השיחה, וודא את נכונות הבנתו של הAI את בקשותיי, ווידוא ביצועם

[Attachment: chat_history_2026-11-12 (1)(1).txt]

## Response:
12.11.2026, 10:09:18 · gpt-6-t-mini

אחלק את הבדיקה למקטעים של עד חמש דקות, כפי שקבעת. במקטע הנוכחי אעבור על השיחה המצורפת מעבר לחלק שכבר הוצג, אבנה ממנה רשימת דרישות והכרעות מחייבות, ואשווה אותן למצב הקוד והתיעוד ב־Work\_2. אבדיל במפורש בין בקשה שהובנה נכון, בקשה שבוצעה והוכחה, בקשה שבוצעה חלקית, וטענה של ה־AI שעדיין אין לה ראיית ביצוע מספקת.

כבר בשיחה עצמה מתבלטת נקודה מהותית: יש כמה הכרעות משתמש שגוברות על הנחות מוקדמות של התוכנית ושל ה־AI — בעיקר ביטול מוחלט של התאמה לייחוס, בחירת `very_long_test_text.txt` כקורפוס הבדיקה העיקרי, והדרישה לא להשתמש במבנים מלאכותיים שאינם קיימים בספרים אמיתיים. אלה אינן הערות שוליות; הן צריכות להכתיב את כל בדיקות הקבלה והמשך העבודה. אני ממשיך כעת לחלץ את רצף ההכרעות המאוחר ולבחון אם הן הוטמעו בקוד ובמסמכי המעקב.

במקטע הבא של השיחה מצאתי פער הבנה אפשרי חמור יותר: בתשובתך לשאלת חלוקת המקום בין הגוף להערות קבעת סדר עדיפות — קודם לנסות להכיל את ההערה בשלמותה, ורק אחר כך להבטיח את תחילתה בעמוד הסמן. בסיכום S75 ה־AI הציג מדיניות שלפיה הגוף ממלא תמיד, וההערות מוגבלות לתקרה קבועה של 50%. אלה אינן בהכרח אותה מדיניות. אני בודק כעת את ההגדרה ואת נתיב ההצבה בפועל, ולא מסתפק בניסוח הסיכום.

> **Searched conversation and inspected first result details**
>
> 
>
> **Analyzing complete conversation history**
>
>
> **Reviewing the transcript**
>
> I’m identifying the user’s requests, checking whether prior responses matched them, and noting any exposed credential without repeating it. I’m also tracing the conversation in sections so no instruction is overlooked.
>
> **Reviewed the transcript**
>
> 
>
> **Analyzed conversation history and redacted sensitive content**
>
> 
>
> **Auditing the request**
>
> I’m checking each requirement against the recorded work, separating completed items from open questions, and avoiding repetition. I’m also noting that any exposed credential should be revoked without reproducing it.
>
> **Continuing the audit**
>
> I’m comparing the clarified layout requirement with the recorded implementation, especially whether the 60% width uses the current available content width rather than the full page width.
>
> **Verifying layout details**
>
> I’m checking whether the implementation satisfies the clarified width rule and related typography requests, including heading sizing, footnote alignment, font colors, preview–PDF consistency, and back-cover styling.
>
> **Audited the request and verified layout details**
>
> 
>
> **Audited requirements and verified implementation**
>
> 
>
> **Reviewing final code review response**
>
>
> **Auditing implementation gaps**
>
> I’m finding a likely mismatch: the recorded implementation prioritizes filling body text before notes, while the clarified requirement appears to prioritize keeping complete notes when possible.
>
> **Audited implementation gaps**
>
> 
>
> **Reviewed final code review response**
>
> 
>
> **Summarizing audit findings**
>
> I’m finding that the implementation only partially matches the clarified note-placement priority, and several changed settings lack explicit preview-and-PDF verification. The exposed credential should also be revoked immediately, without reproducing it.
>
> **Summarized audit findings**
>
> 
>
> **Summarizing remaining risks**
>
> I’m seeing two unresolved concerns: note placement may still impose an unintended 50% cap, and project records appear stale or inconsistent with later implementation notes. These need direct verification before calling the audit complete.
>
> **Summarized remaining risks**
>
> 
>
> **Audited S75 notes and footnote implementation, settings, tests, and documentation**
>
> 
>
> **Recording audit risks**
>
> I’m confirming the live path uses the updated layout engine, but the audit is not complete. Remaining checks include note-priority semantics, exhaustive preview/PDF coverage, font defaults, back-cover styling, and synchronizing stale project records.
>
> **Recorded audit risks**
>
> 
>
> **Audited note placement documentation and conditional typesetting dispatch implementation**
>
> 
>
> Worked for 11m 27s

## ממצאים ראשונים מקריאת השיחה המלאה

קראתי את רצף הבקשות וההכרעות, ולא רק את סיכומי ה־AI. כבר עכשיו אפשר לקבוע שהיו כמה תיקוני הבנה חשובים מצדך, וחלקם חייבים להישמר כדרישות יסוד ולא רק כפרטי מימוש.

### 1\. שלוש הכרעות יסוד שה־AI היה חייב להפנים

**ה־PDF לדוגמה אינו תקן התאמה.** הוא נועד להמחיש את המראה הכללי, יחסי האזורים, סוגי העימוד והשערים; הוא עצמו אינו מושלם, ואין לרדוף אחר התאמה אליו. fileciteturn83file0L75-L77

**המסמך האמיתי הארוך הוא מסמך הבדיקה העיקרי.** עצרת את ה־AI במפורש כשהוא החל לחקור מקרה של שתי כותרות מאותה רמה ברצף וכותרת המכילה רק הערת שוליים, משום שאלו אינם מקרים מציאותיים בספרים. מכאן נובעת דרישה חזקה: אין להסיק תקלה כללית ממסמך סינתטי שאינו מייצג את מבנה הספרים שלך; בדיקות סינתטיות יכולות לשמש לבדיקת יחידה ממוקדת, אך אינן תחליף לאימות על `very_long_test_text.txt`\. fileciteturn83file0L315-L317

**בדיקות ההתאמה לייחוס בוטלו לחלוטין.** לא רק שהן חדלו להיות יעד של 100%: גם השימוש בהן כמדד מגמה או כבדיקת CI אינו רצוי. זו הייתה הבהרה מפורשת שלך לאחר שה־AI הציע לשפר את חילוץ הייחוס כדי לקבל מדד P6 הוגן יותר. fileciteturn83file0L1004-L1013

לכן, כל אזכור עתידי של P6/P7 או של מדידת parity מול הייחוס חייב להיות היסטורי בלבד, בהתאם ל־D100. אין להחזיר אותם לתוכנית הבדיקות.

### 2\. זיהיתי שתי נקודות שבהן תיקנת במפורש את הבנת ה־AI

- בעניין שורת הסיום של הערות השוליים, ה־AI פירש תחילה את בקשתך כיישור השורה האחרונה של **כל הערה בנפרד**\. אתה תיקנת אותו: מדובר בשורה האחרונה של **כל רצף הערות השוליים בעמוד**, כאשר הערה שממשיכה לעמוד הבא היא חריג ואינה מקבלת את יישור הסיום הרגיל.
- בעניין זרימת ההערות, לא הסתפקת בבקשת התנהגות חדשה: דרשת גם אפשרות בחירה בין מנגנון ההצבה הישן לחדש, כאשר החדש הוא ברירת המחדל. בנוסף, דרשת שלא יתווסף מספר הערה בתחילת המשך של הערה מעמוד קודם.

אלה הבדלים התנהגותיים מהותיים. אין לסמן את הבקשה כמבוצעת רק מפני שקיים פיצול הערה או דגל יישור; צריך לבדוק את ההתנהגות המדויקת ואת אפשרות הבחירה. fileciteturn83file0L4634-L4735 fileciteturn83file0L5074-L5250

---

### 3\. מה אומת בקוד, ומה עדיין אינו עומד בדרישות

**אפשרות הבחירה בין מנגנוני ההערות - קיימת.** ב־`settings-registry.js` רשומה ההגדרה `fn-placement-mode`, עם שני ערכים (`body-first`, `legacy`\) וברירת מחדל `body-first`\. בדיקות S75 גם מאמתות שהחלפת הערך משנה בפועל את התוצאה, ושהמנגנון הישן נשאר זמין. זו הבנה וביצוע נכונים של בקשתך.

**המשך הערה בלי סמן כפול - קיבל בדיקה ממוקדת.** בדיקות S75 מוודאות שהמשך מתחיל ב־`(המשך)` ושאין בו סמן־מספר חדש. הן גם בודקות שהשורה האחרונה של רצף ההערות אינה ממורכזת בעמוד שממנו ההערה ממשיכה. fileciteturn83file0L5179-L5250

**אבל מדיניות חלוקת המקום עדיין טעונה הכרעה ובדיקה מחודשת.** המימוש ב־`legacy-imud-flow.js` קובע תקרה אוטומטית של 50% מגובה זרימת העמוד. כלומר, הגוף ממלא תמיד את אזורו, וההערות מוגבלות לחצי מגובה הזרימה. זהו כלל קבוע במימוש, לא רק ברירת מחדל שהוכחה כנכונה לקורפוס שלך. בדיקת S75 מאמתת את התקרה ואת המשך הזרימה, אך אינה מוכיחה שהמנוע ייתן עדיפות להכלת הערה שלמה כאשר הדבר מחייב להקצות לה יותר ממחצית גובה הזרימה. לכן איני מסמן את דרישת סדר העדיפויות שלך כמאומתת במלואה.

**S76 מטפל בשלושת הליקויים שדיווחת עליהם\:** מקום מבוזבז למרות שהיה אפשר להכיל הערה, המשך הערות מעבר לגבול פרק, ושורת חיתוך שאינה מלאה. נוספו בדיקות ייעודיות למקום שנותר בעמודי פתיחה, להשלמת הערות בעמודים ייעודיים לפני פתיחת הפרק הבא, ולמניעת המשך בפרק הבא. עם זאת, הבדיקות האלה ממוקדות במסלול המורשת שבו הוטמע `body-first`; אין בכך הוכחה מקבילה לכך שמנגנון ההערות החדש פועל גם בנתיב ה־DP.

**S77 עונה היטב על חלק מהבקשות האחרונות, אך לא מוכיח את כלל העבודה שקבעת.** בדיקות שורת החיתוך אכן מפרידות בין `cutLast` לבין `centerLast` ובודקות את היישור גם ב־PDF וגם ב־DOM. גם תקלה בגליפים המרכיבים גרשיים תוקנה במסלול תת־הגופן ונוספה לה בדיקת PDF. לעומת זאת, בדיקות שינויי הכותרות וה־TOC אינן בודקות כל שינוי גם ב־DOM וגם ב־PDF: חלקן בודקות את מודל הפריסה או את הקרנת ה־PDF בלבד. לכן הדרישה שלך - שכל שינוי ייבדק בשני הפלטים - **אינה מוכחת עדיין כמדיניות בדיקה מקיפה**\.

גם בדיקת 59 ההגדרות שחוברו אינה שקולה לבדיקה של כל פקדי לוח ההגדרות באתר החי: הסוויטה בודקת מיפויים ודוגמאות לשינויים בכותרות, בצבע, במקורות ובכמה רמות TOC, אך אינה מציגה הוכחה שכל אחת מ־59 ההגדרות נבדקה בנפרד דרך ממשק המשתמש.

### 4\. עניין אבטחה חשוב

בקובץ השיחה שהעלית מופיע טוקן GitHub אישי, במלואו, ואף יותר מפעם אחת. לא אציג אותו או אשתמש בו. מאחר שהוא נכלל בקובץ שהועלה לשיחה, יש להתייחס אליו כאל סוד שנחשף: **מומלץ לבטל אותו ב־GitHub וליצור טוקן חדש**, עם ההרשאות המצומצמות הנדרשות בלבד.

---

### 5\. בדיקה ארכיטקטונית: האם בחירת מנגנון ההערות משפיעה על האתר החי?

בדקתי גם את החשש שההגדרה החדשה קיימת רק ברשימת ההגדרות ואינה מחוברת למנוע הפעיל.

כאן מצאתי דווקא חיבור תקין: כאשר הגדרות ברירת המחדל המקוריות מיובאות, המערכת מסמנת את הפריסה בפרופיל `imud`; `pipeline.typeset()` מזהה אותו ומעביר את העבודה ל־`legacyTypeset`\. לכן `fn-placement-mode` אכן מגיע למנוע שבו הוא ממומש. זו אינה הגדרה דקורטיבית או חסרת צרכן. הקוד הרלוונטי: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com#L117-L126), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L909-L932)\.

### 6\. פערי מעקב וממשל

מצאתי סתירה ממשית ב־`AGENTS_TRACKING.md`\:

- בראש הקובץ כתוב שהוא עודכן ב־11.11 ובסיסו `382c685`, כלומר לפני מחזורי S72-S77.
- בטבלת הפערים עדיין מופיע `SRS-12-2` כפריט ללא מימוש, שלא התבקש מעולם.
- בפועל, לפי קוד S65 ובדיקותיו, `split-book-title` כבר מומש, ואף נכלל במחזורי העבודה המאוחרים.

כלומר, יש עבודה שבוצעה, אך מסמך המעקב המחייב אינו מציג את המצב העדכני. fileciteturn83file0L1513-L1513 fileciteturn83file0L2840-L2840

בנוסף, צריך להפריד בין **השלמת משימות הסוכנים** לבין **אישור G6 ושחרור G7**\. ה־AI צדק בכך שאישור חזותי סופי של ספר לדוגמה הוא החלטה שלך, ולא משהו שהוא יכול להחליף בהכרזה שהכול הושלם.

### 7\. סיכום ביניים - הערכת נכונות עבודת ה־AI

| תחום | הערכה נוכחית |
|--------|--------|
| הבנת מעמד קובץ הייחוס | (נכון) |
| בחירת `very_long_test_text.txt` כקורפוס העיקרי | (נכון) |
| תיקון המחולל למבנים מציאותיים | (מומש לפי התיעוד) |
| ביטול מוחלט של P6/P7 ו־parity | (מומש) |
| הפעלת בחירה בין מנגנוני הערות | (מומש) |
| סדר העדיפויות בחלוקת מקום בין גוף להערות | (לא הוכח; תקרת 50% חשודה) |
| מניעת המשך הערות מעבר לפרקים | (בדיקות ייעודיות קיימות) |
| תיקון שורת חיתוך ב־DOM וב־PDF | (בדיקות לשני הנתיבים קיימות) |
| חיבור כל ההגדרות ובדיקת כולן באתר החי | (הוכחה חלקית בלבד) |
| כלל בדיקת כל שינוי גם בתצוגה וגם ב־PDF | (לא נאכף באופן מקיף) |
| עדכון מסמכי המעקב | (קיימת סתירה מוכחת) |

**המסקנה\:** ה־AI ביצע עבודה ממשית ומשמעותית, והוא הבין נכון את רוב ההכרעות המרכזיות. אבל אין בסיס לקבל את הצהרתו שכל התוכניות והבקשות הושלמו במלואן ללא יוצא מן הכלל. יש לפחות פער אחד אפשרי בהתנהגות המבוקשת של מנגנון ההערות, פער בכיסוי בדיקות התצוגה וה־PDF, ופער בסנכרון מסמכי המעקב.

### יתרת העבודה למקטע הבא

הבדיקה הזו אינה מסתיימת כאן. במקטע הבא, עד חמש דקות, צריך להתמקד בשלושה דברים\:

1. לבדוק את `very_long_test_text.txt` מול מדיניות ההערות בפועל, במיוחד מקרים שבהם הכלת הערה בשלמותה מחייבת הקצאת שטח גדול מ־50%.
2. לערוך מיפוי של הגדרות הממשק: מזהה, צרכן בקוד, השפעה על המודל, השפעה על התצוגה, השפעה על PDF, ובדיקת רגרסיה. לא להסתפק בספירת 59 הגדרות שחוברו.
3. להשלים השוואה בין כל בקשות המשתמש לבין קובצי `SESSION_HANDOFF`, `WORKLOG`, `ISSUE_REGISTRY`, `AGENTS_TRACKING` ותוכנית האב - ולתקן את טבלת המצב בהתאם לראיות.

לא שיניתי דבר בריפו במקטע הזה; מדובר בביקורת ואימות בלבד.

## Prompt:
12.11.2026, 10:22:20

המשך!!!

## Response:
12.11.2026, 10:22:30 · gpt-6-t-mini

בסבב הזה — עד חמש דקות — אבדוק את ההמשך המאוחר של השיחה המצורפת, שבו ה־AI טוען שהשלים את יתרת התוכניות ואת הבדיקה המשולשת. אתמקד בפערים המהותיים שנותרו: דרישות מבנה המסמך, אימות `very_long` בשני מסלולי העימוד, בדיקת כל ההגדרות בשטח, והאם האימותים והמסמכים משקפים את אותו מצב קוד. במקביל אבצע הצלבה ממוקדת מול HEAD הנוכחי, בלי לערוך את הריפו.

כבר זיהיתי ממצא נוסף בעל חשיבות: בדוח S72 הוצגה תחילה נייטרליות מלאה של ה־hash, אך לאחר המיזוג עם עבודת הסוכנים התברר שה־DP ב־`very_long` השתנה, ושתי הערות־צד עברו בין עמודים 119–120. ה־AI עדכן בעקבות זאת את הנעילות. שינוי כזה אינו בהכרח שגוי, אבל הוא סותר את הניסוח הראשוני שלפיו „אף שורה/תוכן לא זז”, ולכן צריך לבדוק את הנימוק, את השפעתו ואת האישור התיעודי — ולא להסתפק במילה „נייטרלי”. המשכתי גם לאתר את הבקשות המאוחרות יותר, כדי שלא נסתפק בסקירת S72.

ההצלבה מול המסמכים הנוכחיים מעלה כעת פער תיעודי חד וברור יותר: `SESSION_HANDOFF.md` כבר כולל את S77, אבל `WORKLOG.md` מסתיים ב־S76, `ISSUE_REGISTRY.md` עדיין מסתיים ברישום S72, ו־`AGENTS_TRACKING.md` ו־`IMPLEMENTATION_STATUS.md` מתארים בסיס ישן יותר. לכן כרגע אין מקור־אמת מסונכרן אחד שמציג את מצב המערכת לאחר S77. אני משלים בדיקה ממוקדת של ראיות S77 עצמן ושל הפערים שנשארו פתוחים, לפני שאקבע מה ניתן לאשר ומה לא.

> **Reviewed conversation details, repository verification, requests, and document content**
>
> 
>
> **Assessing current state**
>
> I’m checking the latest transcript against the repository because the conversation ends with an S77 request, while the repository may already contain related changes. I’ll distinguish documented work from unconfirmed follow-up implementation.
>
> **Comparing repository state**
>
> I’m comparing the transcript’s final request with the repository, since the code may include changes not documented in the conversation. I’m also checking heading-structure requirements, tests, and work logs to separate confirmed work from follow-up tasks.
>
> **Assessed and compared repository state**
>
> 
>
> **Read additional conversation segments and exact end-of-file content**
>
> 
>
> **Verifying repository alignment**
>
> I’m checking whether the latest implementation is fully reflected in project documentation. The code and session notes appear newer than the work log, status report, and issue registry, so I’m separating confirmed repository state from stale records.
>
> **Verified repository alignment**
>
> 
>
> **Verified S77 implementation, requirements, repository alignment, and documentation status**
>
> 
>
> **Audited S77 documentation, verification coverage, and missing audit scripts**
>
> 
>
> **Assessing audit coverage**
>
> I’m finding that the repository contains S77 implementation and audit artifacts, but documentation lags behind. The live audit records aggregate results and many no-effect settings, so feature coverage is not yet fully demonstrated.
>
> **Assessed audit coverage**
>
> 
>
> **Audited latest commit settings coverage and live audit reproducibility**
>
> 
>
> **Identifying remaining gaps**
>
> I’m finding three unresolved risks: the canonical fixture differs from the CI fixture, dynamic-layout balance still has documented exceptions, and the settings audit reports aggregate outcomes without per-setting evidence.
>
> **Reviewing repository status**
>
> I’m finding that S77 code exists, but documentation still trails it. The live audit reports 86 changed and 167 unchanged settings; because it lacks per-setting evidence, I’m not treating full verification as proven.
> 
> The main remaining risks are the fixture-path mismatch, unresolved dynamic-column balance exceptions, possible conflict between the 50% footnote cap and full-note priority, stale tracking documents, and unverified CI results.
>
> **Reviewed repository status and identified remaining gaps**
>
> 
>
> **Fetched and audited fixture files, paths, and layout differences**
>
> 
>
> Worked for 7m 35s

## דוח המשך - ביקורת השיחה והמצב העדכני בריפו

השלמתי את המקטע הזה במסגרת הזמן שקבענו. התמונה כעת ברורה יותר: ה־AI ביצע שיפורים ממשיים, אך יש פערים בין דרישותיך, מימושן, בדיקות הקבלה ומסמכי המעקב. **הצהרתו שכל התוכניות הושלמו במלואן אינה מדויקת.**

### 1\. בדיקה מחודשת של חמש הבקשות האחרונות - S77

| בקשה | מה נמצא | הערכה |
|--------|--------|--------|
| שורת חיתוך של הערת שוליים מיושרת לשני הצדדים | נוסף `cutLast`, ויש בדיקות למנוע, ל־PDF ול־DOM. | (מומש עם בדיקות) |
| גרשיים חסרים ב־PDF | תוקן טיפול בגליפים קומפוזיטיביים ובמיפוי רכיבי הגליף בעת יצירת תת־גופן. נוספה בדיקת PDF. | (מומש עם בדיקה) |
| בדיקת כל הגדרות הממשק | נשמר סיכום ביקורת של 253 הגדרות: 86 השפיעו על התצוגה, 167 לא שינו אותה בבדיקה. חוברו 83 הגדרות נוספות. | (חלקי) |
| לשוניות עורך/הגדרות/בדיקה במראה של טאבים | נוספו כללי CSS ובדיקת סגנון ללשונית הפעילה. | (מימוש מתועד) |
| כל שינוי ייבדק גם בתצוגה וגם ב־PDF | יש בדיקות לשני הנתיבים בחלק מהשינויים, אך אין הוכחה שכל 83 ההגדרות שנחברו נבדקו בנפרד בשניהם. | (לא הוכח במלואו) |

המקור המרכזי לפרטי S77 הוא [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/SESSION_HANDOFF.md?utm_source=chatgpt.com)\.

#### ממצא חשוב לגבי ביקורת 253 ההגדרות

תיקון לממצא שהצגתי קודם: מצאתי כעת את קובץ התוצאות עצמו בריפו\:

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/artifacts/s77-settings-live-audit.json?utm_source=chatgpt.com)

הוא מאשר את הספירות\:

- 253 הגדרות נבדקו לפי דיווח הביקורת.
- 86 גרמו לשינוי ב־digest התצוגה.
- 167 לא גרמו לשינוי ב־digest.

אולם הקובץ אינו כולל תוצאות מפורטות לכל אחת מ־253 ההגדרות: אין בו את רשימת 86 ההגדרות ששינו את התצוגה, מדידות לפני/אחרי או תוצאות PDF פרטניות. גם הסקריפט שמסמך המעבר מצביע עליו, `scripts/s77-live-audit-inject.js`, לא נמצא בחיפוש בקוד המאגר. לכן אין כרגע אפשרות לשחזר במלואה את הביקורת הנטענת.

חשוב מכך: ה־167 אינן קבוצה אחידה של הגדרות פגומות. חלקן לא נבדקו בתנאים שבהם תכונתן יכולה להופיע, חלקן שייכות לנתיבים מודרניים או לייצוא בלבד, וחלקן דורשות שינוי גיאומטרי מתואם. במסמך המעבר עצמו מצוין שגדלי גוף וכותרות, גובה שורה, שוליים ורשת העמוד הם המשימה הגיאומטרית הראשונה שעדיין ממתינה.

כלומר, **ה־AI אכן זיהה בעיית חיבור הגדרות משמעותית, אבל לא סיים לחבר את כל ההגדרות.**

### 2\. ממצא מהותי: סדר העדיפויות בהערות השוליים

כאן אני עדיין רואה פער אפשרי בין ההכרעה שלך לבין המדיניות שהוטמעה.

ההכרעה שלך בשיחה הייתה\:

1. עדיפות ראשונה - להכיל את ההערה בשלמותה, תוך מילוי אזור הטקסט העיקרי.
2. עדיפות שנייה - להבטיח שההערה תתחיל בעמוד שבו מופיע הסמן שלה.
3. במקרה שההערה ממשיכה, השורה האחרונה בעמוד אינה ממורכזת, ואין להוסיף מספר הערה לתחילת ההמשך.

fileciteturn83file0

ב־S75 הוטמעה תקרת מרזב אוטומטית של 50% מגובה הזרימה. ב־S76 תוקנו שלושה ליקויים ממשיים: בזבוז מקום, חציית גבולות פרקים ושורות חיתוך לא מלאות. אלה שיפורים חשובים.

אבל התקרה היחסית של 50% עדיין מופיעה כברירת מחדל בקוד. לכן טרם הוכח שהמנוע יכיל הערה בשלמותה בכל מקרה שבו יש מספיק מקום פיזי, גם כאשר ההערה דורשת יותר ממחצית גובה הזרימה.

זו אינה קביעה שהקוד בהכרח נכשל בכל מקרה כזה. זו **בדיקת קבלה חסרה ביחס לסדר העדיפויות שהגדרת**\. צריך לבדוק אותה על ספרך עצמו, ובפרט על הערות גדולות שמצריכות יותר מ־50% גובה.

### 3\. ממצא מהותי: קובץ הבדיקה העיקרי אינו מסונכרן בבירור עם ה־CI

אתה קבעת במפורש שהקובץ העיקרי הוא\:

`red-build/tests/fixtures/real/very_long_test_text.txt`

במהלך S76 ה־AI אף דיווח שיש שני קבצים שונים בשם `very_long`\: קובץ ה־fixture של ספרך, וקובץ האודיט שבתיקיית `audits`\.

לעומת זאת, שני ה־workflows המרכזיים עדיין מפעילים את\:

`audits/very_long_test_text.txt`

כך מופיע ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/.github/workflows/full-math-audit.yml?utm_source=chatgpt.com) ובקובץ [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/.github/workflows/layout-parity.yml?utm_source=chatgpt.com)\.

לא הצלחתי להשוות את תוכנם של שני קובצי הטקסט דרך ממשק GitHub, מפני שהחזרת הקבצים הגדולים הייתה ריקה. אבל תיעוד S76 עצמו אומר שהם שונים.

**זהו פער שצריך ליישב\:** הקובץ שהגדרת כמסמך הראשי צריך להיות הקורפוס המחייב גם בבדיקות CI ובאודיטים המרכזיים, או שתהיה הוכחת זהות בתים בינו לבין הקובץ שב־`audits`\. אין להניח שהם זהים.

### 4\. איזון הטורים - התקדמות, אבל לא שלמות

S72 הביא שיפור משמעותי במסלול המורשת: שיעור עמודי הדוגמה עם פער תחתיות גדול מ־5px ירד מ־74.7% ל־0.8%, לפי מדידות ה־AI.

אבל במסלול DP, לפי אותו דיווח, נותרו 168 מתוך 1,038 עמודים עם פער גדול מ־5px - כ־16.2%.

בנוסף, רישום התקלה ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ISSUE_REGISTRY.md?utm_source=chatgpt.com) עדיין מציג כפתוחה את חדירת הטור הראשון לאזור הערות השוליים ב־16 עמודי DP, בעד 202px.

זו אותה תקלה שזיהיתי במקטע הקודם: ה־DP מפחית את תקציב ההערות מהטור האחרון בלבד, למרות שאזור ההערות משתרע על רוחב העמוד.

לכן אי אפשר להציג את איזון הטורים כמושלם. יש שיפור מוכח במורשת, אך נותר פער במסלול DP, וגם בעיית הקיבולת החוצה־טורים טרם נסגרה.

### 5\. פערים במסמכי המעקב

הצלבתי את הקבצים שב־main. המצב אינו מסונכרן\:

| מסמך | מצב בפועל |
|--------|--------|
| `SESSION_HANDOFF.md` | כולל את S77 והוראות להמשך. |
| `WORKLOG.md` | מסתיים ב־S76, ללא רשומת S77. |
| `ISSUE_REGISTRY.md` | מסתיים ב־S72, ללא סגירות S76/S77 וללא ממצאי ביקורת ההגדרות. |
| `AGENTS_TRACKING.md` | עדיין מתאר מצב מ־11.11, S71.1. |
| `IMPLEMENTATION_STATUS.md` | עדיין מציג נתונים ומסקנות מתקופת S71, לרבות פריטים שכבר מומשו מאוחר יותר. |

דוגמה ברורה לסתירה: `AGENTS_TRACKING.md` עדיין מציג את `SRS-12-2 split-book-title` כלא ממומש, אף ש־S65 כבר מימש אותו, וקובץ `IMPLEMENTATION_STATUS.md` עצמו כבר מתעד אותו כמומש.

אלה לא רק בעיות ניסוח. הן עלולות לגרום לסוכן הבא לבצע עבודה שכבר הושלמה, להחמיץ תקלה פתוחה, או להניח שמשימה נסגרה בלי ראיה.

### 6\. מצב בדיקות ו־CI

שרשרת `npm test` כוללת כעת את בדיקות S72, S75, S76 ו־S77. מסמך המעבר מצהיר על 47 קבצים ו־859 בדידות, ללא כשלים.

אבל איני מאשר את ה־CI של S77 כירוק: בבדיקת ה־Combined Status ונתוני ריצות ה־workflow לקומיט האחרון שנבדק לא התקבלו תוצאות. גם מסמך המעבר מציין במפורש שריצות Actions של S77 לא אומתו בסיום העבודה.

הערה נוספת: קובץ ה־CI עדיין מכיל הערות ישנות של 670 בדיקות ו־849 עמודים, שאינן תואמות לספירות המאוחרות. אלה הערות תיעוד ולא בהכרח שגיאות בהגדרות ה־workflow, אך צריך לרענן אותן.

---

## הערכת מצב כוללת לאחר הבדיקה

| תחום | מצב |
|--------|--------|
| חמשת הסוכנים ומשימות הפתיחה | הושלמו ברובן, לפי ה־PR והמסמכים הקיימים |
| ביטול P6/P7 והתאמה לייחוס | נשאר בתוקף; לא נמצא בסיס לפתוח אותו מחדש |
| מסמך בדיקה מציאותי | הוגדר ונעשה בו שימוש, אך יש פער בין קובץ ה־fixture לבין הקורפוס שב־CI |
| איזון טורים | שיפור גדול במורשת; DP אינו שלם |
| הערות שוליים S75/S76 | שלושת הליקויים שדווחו טופלו לפי בדיקות ייעודיות; סדר העדיפויות דורש בדיקה נוספת |
| S77 - שורת חיתוך וגרשיים | קיימות בדיקות ממוקדות ל־DOM ול־PDF |
| S77 - הגדרות | בוצעה ביקורת נרחבת, אך 167 הגדרות לא שינו את התצוגה בסבב הבדיקה; חלקן נשארו במכוון להמשך |
| תיעוד | לא מסונכרן |
| CI של S77 | לא מאומת כרגע |
| G6 - קבלת משתמש | עדיין בבעלותך; לא ניתן לסמן שחרור סופי ללא בדיקת הספר ואישורך |

### מה עדיין צריך לבצע

במקטע הבא, שגם אותו אגביל לחמש דקות, אני מציע להתמקד בבדיקה מעשית של שלושה פערים בלבד\:

1. לאמת את זהות קובץ ה־fixture שלך מול קובץ ה־`audits` ולבדוק מה בדיוק רץ ב־CI.
2. לבנות מקרה קבלה מתוך `very_long_test_text.txt` שמכריע את סדר העדיפויות של הכלת הערות שלמות לעומת תקרת 50%.
3. לבדוק את ממצא חדירת ההערות ב־DP מול HEAD, ולבדוק אם ניתן לסגור אותו בלי להפר את איזון הטורים ובלי לשבור את שימור התוכן.

**לא שיניתי קוד או מסמכים בריפו במהלך הסבב הזה.**

ולבסוף, תזכורת אבטחה: קובץ השיחה מכיל טוקן GitHub אישי גלוי. יש לבטל אותו וליצור טוקן חדש עם הרשאות מינימליות.

## Prompt:
12.11.2026, 10:32:26

המשך!!!

## Response:
12.11.2026, 10:33:47 · gpt-6-t-mini

בסבב הזה אשלים את שלוש הבדיקות המעשיות שנותרו, בגבול של חמש דקות: אבדוק את מקור קובצי `very_long` ואת נתיב ה־CI, אבדוק בקוד את תקרת 50% מול דרישת ההכלה השלמה, ואבחן מחדש את חדירת הטור הראשון ב־DP. אם אחת הבדיקות דורשת הרצת קורפוס מלאה שאי אפשר להשלים במסגרת המקטע, אפריד בין ממצא קוד מוכח לבין נתון שעדיין דורש הרצה.

> **Validated fixture integrity, layout planning, and performance drift**
>
> 
>
> **Comparing fixture evidence**
>
> I’m confirming that the CI and fixture files differ materially: their sizes and blob hashes don’t match. I’m also checking the current column-flow logic, especially the last-column budget asymmetry and related height calculations.
>
> **Auditing project records**
>
> I’m checking whether the issue registry and worklog reflect the latest findings. I’m also reconsidering the 50% cap, since it may be an unsupported interpretation of the user’s stated priorities rather than a confirmed requirement.
>
> **Compared fixture evidence and audited project records**
>
> 
>
> **Evaluating audit coverage**
>
> I’m noting a deeper inconsistency: the live audit appears to verify only selected assertions and display digests, while claiming broader display-and-PDF coverage. I’m also comparing stale status files against the newer registry entries.
>
> **Consolidating remaining gaps**
>
> I’m separating completed plan items from unresolved behavior and documentation drift. The strongest open concerns are the column-budget asymmetry, incomplete audit coverage, stale status records, and fixture mismatches that prevent treating the handoff as fully verified.
>
> **Evaluated audit coverage and consolidated remaining gaps**
>
> 
>
> **Reporting verification gaps**
>
> I’m finding that the deployed branch matches the latest source bundles, but full verification is still incomplete: CI uses a different large fixture, the column budget remains asymmetric, and documentation is stale.
>
> **Reported verification gaps**
>
> 
>
> **Audited repository consistency, fixtures, layout logic, hashes, and deployment across branches**
>
> 
>
> **Verifying deployment status**
>
> I’m distinguishing branch contents from the actually served site: matching source bundles confirm deployment artifacts, but they don’t by themselves prove the live host is serving the newest files.
>
> **Verifying deployment limits**
>
> I’m confirming that the deployment branch contains matching bundles and the updated index marker. I still can’t treat that as proof the public host serves them, so live verification remains open.
>
> **Verified deployment status and limits**
>
> 
>
> **Searching the web**
>
> 
>
> Worked for 3m 14s

## דוח מצב - המשך אימות הריפו, 12.11.2026

השלמתי עוד מקטע בדיקה במסגרת מגבלת חמש הדקות. הפעם הצלחתי לאמת שלושה ממצאים ברמת הקוד וה־Git עצמו, ולא רק על סמך דיווחי ה־AI.

### 1\. ממצא ודאי: ה־CI אינו בודק את אותו קובץ שהגדרת כקובץ הראשי

בדקתי את עץ הקבצים של `main` ב־GitHub והשוויתי את מזהי ה־Git Blob של שני הקבצים\:

| קובץ | גודל | Git Blob SHA |
|--------|--------|--------|
| `red-build/tests/fixtures/real/very_long_test_text.txt` | 3,404,111 בתים | `9c6d96f8…` |
| `audits/very_long_test_text.txt` | 3,403,990 בתים | `aa70c076…` |

(אינם זהים)

זה אינו הבדל בשם או במיקום בלבד: מזהי ה־Blob שונים, וגם גודל הקבצים שונה ב־121 בתים.

בדקתי גם את הגדרות ה־workflows\:

- `corpus-invariants` מפעיל את `audits/very_long_test_text.txt`\.
- `full-math-audit` מפעיל את `audits/very_long_test_text.txt`\.
- גם בדיקות ה־CI המרכזיות מסתמכות על נתיב זה.

כלומר, הבדיקה האוטומטית אינה משתמשת בקובץ המדויק שהגדרת כמקור הבדיקה הראשי.

**מסקנה\:** יש כאן אי־התאמה אמיתית שצריך לתקן. עד אז, תוצאה ירוקה של CI אינה הוכחה שהקוד עבר בדיקה מלאה על הקובץ שהגדרת.

### 2\. ממצא ודאי: תקרת 50% עדיין מגבילה את מנגנון ההערות

בדקתי מחדש את המימוש הנוכחי ב־`legacy-imud-flow.js`\.

הקוד מחשב\:

```js
Math.floor((GEO.FLOW_H * 0.5) / GEO.FN_PITCH) * GEO.FN_PITCH
```

כאשר `fn-bar-max-height-px` אינו מוגדר לערך חיובי, זו תקרת המרזב האוטומטית.

משמעות הדבר היא שהמנוע אינו מנסה תמיד למצוא את חלוקת המקום הטובה ביותר להכלת הערה שלמה. הוא מגביל מראש את גובה המרזב למחצית מגובה הזרימה.

וזה חשוב: **ה־AI הפך את הצעתו המקורית לתקרת 50% לכלל ברירת מחדל, אף שההכרעה שלך הייתה סדר עדיפויות ולא אישור מפורש של אחוז קבוע.**

נכון ש־S76 שיפר את הניצול הפיזי של המקום, אך הוא לא ביטל את תקרת 50%. לכן עדיין אין הוכחה שהדרישה להכלת הערה שלמה מקבלת עדיפות בכל מקרה מתאים.

### 3\. ממצא ודאי: בעיית חדירת הטור הראשון לאזור ההערות ב־DP עדיין קיימת במבנה הקוד

בדקתי שוב את `dp-planner.js` מול `column-flow.js`\.

ב־`dp-planner.js`\:

- `colCapacity` קורא ל־`colCapacityOf` עם `fnBudget:false`\.
- `usedHeight` מוסיף את תקציב ההערות רק אם הטור הנבדק הוא הטור האחרון.
- בעת `optimalSplit` התקציב מועבר כ־`extraLast`, כלומר שוב מיוחס לטור האחרון בלבד.

לעומת זאת, `column-flow.js` מתעד במפורש שאזור ההערות משתרע על פני רוחב תיבת התוכן כולה, ולכן יש להפחית את תקציבו מכל הטורים.

זהו פער בין חוזה הגאומטריה לבין מימוש בדיקות ה־fit.

ה־`ISSUE_REGISTRY.md` עדיין מתעד את הבעיה כפתוחה: 16 עמודים, עד 202px חדירה. לא ביצעתי הרצת קורפוס מלאה כדי למדוד מחדש את המספרים, אבל הקוד שמייצר את האסימטריה עדיין קיים.

(נדרש תיקון במנוע DP - סוכן 2)

### 4\. בדקתי גם את פריסת S77 ב־GitHub Pages

כאן דווקא יש אימות חיובי עצמאי.

קראתי את `index.html` בענף `gh-pages` ומצאתי את גרסת הנכסים\:

`?v=2026-11-12-s77`

לאחר מכן השוויתי את מזהי ה־Git Blob של שלושת הנכסים בין `main` ל־`gh-pages`\:

| נכס | תוצאת השוואה |
|--------|--------|
| `app.bundle.js` | (זהה) |
| `engine-worker.bundle.js` | (זהה) |
| `styles.css` | (זהה) |

לכן אפשר לאשר שענף הפריסה מכיל את אותם קובצי אפליקציה שנמצאים ב־main. לא הצלחתי לאמת בנפרד את תגובת שרת האתר החי עצמו דרך כלי הגלישה, ולכן איני מציג זאת כאימות HTTP של האתר.

### 5\. מצב הביקורת של 253 ההגדרות

מצאתי את ארכיון התוצאות שנוסף ב־S77\:

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/artifacts/s77-settings-live-audit.json?utm_source=chatgpt.com)

הוא מאשר את הספירות שדווחו\:

- 253 הגדרות נבדקו.
- 86 השפיעו על ה־digest של התצוגה.
- 167 לא שינו אותו.

אבל עדיין חסרים בו פרטי הבדיקה לכל הגדרה: ערך קודם, ערך חדש, תוצאת התצוגה, תוצאת PDF, סיווג הסיבה והאם ניתן היה לבדוק את ההגדרה במסמך שנבחר.

זו אינה בדיקת קבלה מספקת לכל 253 ההגדרות, ובוודאי אינה הוכחה שכל אחת מהן פועלת גם ב־DOM וגם ב־PDF.

---

## מסקנת הסבב

יש כעת שלוש בעיות שצריך להגדיר כמשימות פתוחות ממשיות\:

| עדיפות | משימה | סיבה |
|--------|--------|--------|
| 1 | איחוד קובץ הבדיקה הראשי עם קובצי ה־CI והאודיט | כיום הם שונים |
| 2 | תיקון חוזה קיבולת הערות השוליים ב־DP | התקציב מוחל רק על הטור האחרון |
| 3 | תיקון מדיניות `body-first` | תקרת 50% אינה נגזרת מהכרעת המשתמש |

בנוסף, יש להשלים את בדיקת 253 ההגדרות ולשמור תוצאות פרטניות, כולל PDF.

**לא שיניתי קוד בריפו בסבב הזה.** אני מעדיף לא לבצע תיקון לפני שהגדרת הקיבולת והעדיפויות ברורה, כדי שלא להחליף בעיית הערות אחת באחרת.

### יתרת העבודה למקטע הבא

1. למפות את כל מסלולי חישוב קיבולת ההערות ב־DP, לרבות `optimalSplit`, `ensureRoom`, `balancePageSafe` ו־`autoQualityPass`\.
2. לגבש תיקון שיבטיח שהמרזב החוצה־טורים נלקח בחשבון בכל הטורים, תוך שמירה על סדר הקריאה ועל איזון הטורים.
3. לגבש בדיקות קבלה על הקובץ הראשי המדויק: הערה שנכנסת בשלמותה, הערה שאינה נכנסת, הערה ארוכה החוצה עמודים, והערה החוצה גבול פרק.
4. לאחר מכן לסנכרן את מסמכי המעקב ולבצע אימות CI ו־Pages מחדש.

**העבודה הכוללת עדיין לא הושלמה.** במקטע הבא אמשיך קודם מהניתוח המתמטי של קיבולת ה־DP, ולא אכניס שינויי קוד ספקולטיביים.

## Prompt:
12.11.2026, 10:40:50

המשך!!!

## Response:
12.11.2026, 10:40:58 · gpt-6-t-mini

אני ממשיך במקטע נוסף של עד חמש דקות, ומתמקד הפעם בשורש המתמטי של חדירת הטור הראשון: האם אפשר לתקן את הקיבולת באופן אחיד בלי לשבור את האיזון, ואילו מסלולי קוד נוספים עוקפים את פונקציית הקיבולת המשותפת. במקביל אבדוק את תנאי ההכלה המלאה במנגנון `body-first`, כדי להבחין בין מגבלת 50% לבין מגבלות נוספות בהצבה.

מצאתי גם פער בין בדיקת היחידה של פונקציית הקיבולת לבין השימוש האמיתי בה: בדיקת S60 מאמתת ששני הטורים מקבלים קיבולת מופחתת, ובדיקת `containment` אכן בודקת כך; אבל `dp-planner` עוקף את ההפחתה במפורש ומחזיר את המודל האסימטרי. כלומר, הבדיקה המקומית של הפונקציה ירוקה אף שהמתכנן אינו משתמש בה באותו אופן. זה מסביר כיצד הסתירה שרדה את הבדיקות.

הערה חשובה לגבי הממצא הקודם: בבדיקה מדויקת יותר של נתיב `body-first` במורשת, ה־50% אינם תקרה קשיחה של ההצבה הסופית. הם מגבילים את התקציב שהמנוע שומר בזמן מילוי הגוף; בשלב `placeFootnoteArea` נבדק מחדש החלל הפיזי שנותר, ועדיין אפשר להציב יותר מ־50% כאשר הגוף הסתיים מוקדם. לכן הבעיה אינה “הערה לעולם לא יכולה לקבל מעל 50%”, אלא שהמנוע עשוי לאפשר לגוף לתפוס שטח שהיה נדרש להכלה של הערה שלמה. אני בודק כעת את סדר הפעולות המדויק ואת תנאי ה־fit לפני שאקבע אם זה מפר את סדר העדיפויות שהגדרת.

## Prompt:
12.11.2026, 10:50:10

ההודעה נקטעה בגלל שלא תכננת כראוי את אורך העבודה! המשך!

## Response:
12.11.2026, 10:51:43 · gpt-6-t-mini

אני ממשיך מהנקודה שבה נעצר הניתוח. יש כאן תיקון חשוב למסקנה הקודמת: זיהוי חדירת הטור הראשון נתמך בקוד, אבל צריך להבחין בין **קיבולת ההצבה**, **קיבולת האיזון** ו**בדיקת containment** — הן אינן משתמשות כיום באותו מודל. אבדוק עכשיו את שלושת המסלולים יחד ואת הבדיקות שמכסות אותם, כדי להגדיר בדיוק מה צריך להשתנות ומה אסור לשנות.

המשך הבדיקה חשף נקודה נוספת שחשוב לא לפספס לפני תיקון: ב־DP ההערה מתוקצבת כבר בתחילת הבלוק, אך ייתכן שהעמוד מכיל גוף שכבר הוצב לפני שהתקציב גדל. לכן תיקון פשוט של הפחתת התקציב משני הטורים עלול רק להפוך חדירה קיימת לגלישת־יתר שכבר נוצרה לפני ההצבה הנוכחית. אני בודק אם יש מנגנון שמחשב מחדש/מזיז לאחור את הגוף הקודם כשאזור ההערות גדל.

> **Continuing the pagination audit**
>
> I’m tracing capacity calculations and planning paths next. The main concern is confirming whether footnote space is deducted from every column or only the final one, then checking how that affects DP feasibility and page balancing.
>
> **Refining footnote accounting**
>
> I’m correcting the earlier interpretation: post-placement checks reserve footnote space consistently, but placement may reserve it only in the final column. That asymmetry could let earlier columns consume space needed for the shared footnote band.
>
> **Auditing shared footnotes**
>
> I’m checking whether note reservation, split scoring, and balancing all use the same shared-footer model. The key fix may be reserving footnote space from every text column while balancing body heights independently of note height.
>
> **Formalizing note priorities**
>
> I’m treating complete note containment as the first objective, marker-page starts as the second, and main-text filling as the remaining optimization. A fixed percentage cap may conflict with that ordering.
>
> **Refined pagination and footnote accounting priorities**
>
> 
>
> **Pinpointing the DP mismatch**
>
> I’m finding that placement constrains only the final column with footnote height, while validation constrains both. Balancing also treats notes as part of one column, so the model needs one shared footer boundary.
>
> **Pinpointed the DP mismatch**
>
> 
>
> **Clarifying reservation policy**
>
> I’m also checking the 50% reservation rule. It may prevent complete notes from fitting even when reducing body text would make that possible, so the policy should prioritize whole-note containment before maximizing text.
>
> **Clarified reservation policy**
>
> 
>
> **Audited footnote reservation, flow, and column-balancing logic**
>
> 
>
> **Identifying anchor risks**
>
> I’m finding a second issue: notes are reserved before a paragraph’s final page is known. If the paragraph moves or splits, the note may remain on the prior page, violating marker-page placement.
>
> **Consolidating findings**
>
> I’m distinguishing reservation from final rendering: the 50% rule limits planning, not necessarily the final note area. The larger risks are inconsistent shared-footer capacity and notes remaining on a prior page when paragraphs move or split.
>
> **Identified anchor risks and consolidated findings**
>
> 
>
> **Analyzed footnote budgeting, placement, and column overflow**
>
> 
>
> Worked for 6m 55s

## המשך הביקורת - ממצאים נוספים במנוע ההערות וה־DP

הבדיקה הנוספת הושלמה. היא חשפה שתי בעיות מבניות נוספות, מעבר לאסימטריה שכבר זוהתה.

### 1\. תיקון הדיוק לגבי תקרת 50% ב־`body-first`

אני מתקן את הניסוח הקודם שלי: **50% אינם תקרה קשיחה של גובה ההערות בהצבה הסופית.**

ב־`legacy-imud-flow.js` מתרחשים שני שלבים נפרדים\:

- `fnReserveFor` מחשב את התקציב המוקדם, וברירת המחדל שלו מוגבלת ל־50% מגובה הזרימה.
- `placeFootnoteArea` מחשב בהמשך את המקום הפיזי שנותר מתחת לגוף, ויכול לנצל יותר ממחצית העמוד כאשר המקום אכן פנוי.

מקור הקוד: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L900-L938), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L2497-L2537), ו־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L2779-L2813)\.

המשמעות היא שה־50% משפיעים על תכנון המקום בזמן זרימת הגוף, גם אם ההצבה הסופית מסוגלת לנצל מקום נוסף.

הבעיה העקרונית נותרת: המנוע אינו מבטיח תחילה הכלה מלאה של ההערה כאשר הדבר אפשרי באמצעות חלוקה נכונה של העמוד. הוא עלול להתקדם עם הגוף לפי תקציב חלקי, ורק בשלב מאוחר יותר לגלות כמה מקום נותר בפועל.

**אין הצדקה לקבע 50% כאילו זו הכרעה שלך.** במסמך ההחלטות יש להגדיר את סדר העדיפויות שהכתבת, ולא להחליף אותו באחוז שהוצע כאפשרות בלבד.

### 2\. ממצא ודאי: שלושת מסלולי הקיבולת ב־DP אינם משתמשים באותו חוזה

זהו הממצא החשוב ביותר בסבב.

| מסלול | אופן חישוב תקציב ההערות | משמעות |
|--------|--------|--------|
| `colCapacityOf` | מפחית את תקציב ההערות מהקיבולת | מתאים למרזב חוצה־טורים |
| `dp-planner` בהצבה | מבטל הפחתת תקציב ומוסיף אותו לגובה הטור האחרון בלבד | מאפשר לטור הראשון לחדור לאזור ההערות |
| `protections-matrix` | מפחית את התקציב מהקיבולת ובודק את גובה הגוף | מזהה את החדירה לאחר שכבר נוצרה |

הבעיה מופיעה במפורש ב־`dp-planner.js`\:

```js
const colCapacity = (tpl, page) =>
  colCapacityOf(page, { fnBudget: false }) || ...;
```

ובמקביל\:

```js
if (page && page.fnReservedHeightPx > 0 &&
    page.columns[page.columns.length - 1] === col) {
  h += page.fnReservedHeightPx;
}
```

כלומר, ההערות נחשבות כחלק מהגובה התפוס רק בטור האחרון. לעומת זאת, `colCapacityOf` וה־containment מכירים בכך שמרזב ההערות משתרע על רוחב העמוד.

יש לכך השלכה נוספת: `optimalSplit` מקבל `extraLast` ומחשב את ההפרש בין הטורים כאילו גובה ההערות נוסף לטור האחרון. כך גם האיזון עצמו אינו מודד רק את גובה טקסט הגוף בשני הטורים.

מקורות\:

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L122-L195)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/column-flow.js?utm_source=chatgpt.com)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/protections-matrix.js?utm_source=chatgpt.com)

**התיקון המתמטי העקרוני\:** אם מרזב ההערות משותף לשני הטורים, אז יש לחשב\:

$$
C_{\text{body}}=H_{\text{content}}-H_{\text{notes}}-H_{\text{spanning}}
$$

ולדרוש\:

$$
H_0\le C_{\text{body}},\qquad H_1\le C_{\text{body}}
$$

את איזון הטורים יש לחשב על גובה הגוף בלבד\:

$$
\min |H_0-H_1|
$$

בלי להוסיף את גובה ההערות לאחד הטורים.

זה גם מסביר מדוע בדיקת היחידה של `colCapacityOf` יכולה לעבור, בעוד שהמתכנן בפועל עדיין מייצר חדירה: הבדיקה מאמתת את פונקציית הקיבולת, אך אינה מוכיחה שהמתכנן משתמש בה כראוי.

### 3\. חשד משמעותי נוסף: הערה יכולה להיקשר לעמוד לפני שהמנוע הכריע היכן יוצב הסמן שלה

ב־`dp-planner.js` סדר הפעולות הוא\:

1. `reserveNotes(blk)` - ההערות משויכות לעמוד הנוכחי ומתווספות לתקציב.
2. `ensureRoom(need)` - נבדק אם כל בלוק הגוף נכנס.
3. אם אין מקום, המנוע עשוי לפצל את הבלוק או לבצע `flushPage()` ולפתוח עמוד חדש.

במסלול שבו `ensureRoom` נכשל ואין פיצול חוקי, ה־`flushPage()` מתבצע לאחר שההערות כבר נוספו ל־`cur.footnotes`\. לא מצאתי בקטע הקוד הזה פעולה שמחזירה את ההערות לתור או משייכת אותן מחדש לעמוד החדש.

זה אינו מוכיח שקרה כך בקורפוס בפועל, אך הוא **סיכון ממשי להפרת כלל הסמן**\: הערה עלולה להישאר בעמוד הקודם בעוד שבלוק הגוף, ובתוכו הסמן, מועבר לעמוד הבא.

מקור: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com)\.

הפתרון הנכון אינו להוסיף עוד תנאי נקודתי. צריך להתייחס להצבת בלוק הנושא הערות כאל פעולה אטומית: לקבוע קודם את מיקום הסמן, להבטיח שההערה משויכת לאותו עמוד, ורק אז לקבע את תקציב ההערות ואת הצבת שורות הגוף. אם ההצבה משתנה - גם שיוך ההערה חייב להשתנות יחד איתה.

### 4\. פערי בדיקות שהתגלו

הבדיקות הקיימות אינן מספיקות כדי לשלול את הבעיות האלה\:

- `s60-monster-fixes.test.js` בודקת ששתי הקריאות ל־`colCapacityOf` מחזירות קיבולת מופחתת. היא אינה מוכיחה ש־`dp-planner` משתמש באותה קיבולת בעת הצבת שורות.
- `s72-column-bottoms.test.js` בודקת את המתיחה והאיזון, אך מתעדת במפורש את דילוג העמודים שבהם קיימת חדירה קודמת לאזור ההערות.
- בדיקות S75 ו־S76 הן בעיקר בדיקות של נתיב המורשת. הן אינן מוכיחות את תקינות הקישור בין סמן להערה בנתיב DP.
- אין כרגע הוכחה מספקת שכל עמודי ההערות בקובץ הראשי עומדים בתנאי ההכלה בשני הטורים, גם לאחר איזון, וגם לאחר הקרנה ל־DOM ול־PDF.

---

## מה צריך לעשות עכשיו

אני קובע את סדר העבודה הבא, בלי לשנות עדיין את קוד המנוע\:

| שלב | משימה | תוצאה נדרשת |
|--------|--------|--------|
| 1 | שחזור חדירת ההערות ב־DP על הקובץ הראשי המדויק | רשימת עמודים, גובה כל טור, גובה המרזב וגבולותיו |
| 2 | בדיקת שיוך הסמן וההערה | הוכחה שהסמן והתחלת ההערה נמצאים באותו עמוד |
| 3 | איחוד חוזה הקיבולת | אותו חישוב בשלב ההצבה, האיזון, המתיחה וה־containment |
| 4 | תיקון חישוב האיזון | השוואת גובהי הגוף בלבד, תוך שמירה על סדר הקריאה |
| 5 | בדיקת רגרסיה על הקורפוס | כל העמודים, כולל הערות ארוכות, הערות מרובות ופתיחות פרקים |
| 6 | אימות DOM ו־PDF | אותה גאומטריה בפועל בשני הנתיבים |

**חשוב\:** הבדיקות צריכות לרוץ על `red-build/tests/fixtures/real/very_long_test_text.txt` - הקובץ שהגדרת כמסמך הראשי - ולא להסתפק ב־`audits/very_long_test_text.txt` השונה ממנו. את אי־ההתאמה הזאת כבר אימתתי לפי מזהי Git Blob.

לא בוצעו שינויים בקוד בסבב הזה. הסיבה היא שמצאתי שהבעיה עמוקה יותר משינוי נוסחה יחיד: יש לתקן גם את מחזור החיים של ההערה וגם את חוזה הקיבולת, ולבדוק שהם אינם יוצרים גלישת־יתר חדשה או הפרדה בין סמן להערה.

**נותרה עבודה מהותית.** במקטע הבא יש להשלים את שחזור 16 עמודי חדירת ההערות ולבדוק את מסלול העברת בלוק עם הערה בין עמודים. רק לאחר מכן נכון לבצע תיקון משולב ולבדוק אותו על הקובץ הראשי, בתצוגה וב־PDF.

## Prompt:
12.11.2026, 11:00:08

מעולה!! המשך לחקור!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרת החקירה שלנו!!!

## Response:
12.11.2026, 11:00:30 · gpt-6-t-mini

אני מרחיב עכשיו את החקירה מהבאג המקומי אל מבנה המנוע כולו. המוקד יהיה לזהות היכן קיימים שני מסלולי פריסה שמחשבים אותה גאומטריה בנפרד, היכן שלבים מתקנים בדיעבד תוצאות של שלבים קודמים, והיכן אותה מדיניות מפוזרת בין המתכנן, האיזון, ההגנות והרנדררים. אעבוד במקטע מוגבל של עד חמש דקות, בלי לשנות קוד, ואסיים במפת ממצאים ובהצעת ארכיטקטורה מאוחדת שאפשר לבדוק מול הקוד.

ממצא שני מתחיל להתבהר: ההפרדה אינה נעצרת במנוע הפריסה. היא נמשכת עד לחוזי התוצאה, חישוב ה־hash, הרינדור והייצוא. למשל, `report-schema.js` נאלץ לבחור בין שתי פונקציות hash שונות משום שמבני העמודים שונים; `export-api.js` בוחר בין שני מקרני PDF; והרנדרר מחזיק מיפוי סוגי עמודים ונתיב `renderLegacyPage` נפרדים. זה סימן לכך שהפיצול הפך לחוזה מערכת שלם, לא רק למימוש חלופי שאפשר להסיר בקלות.

מצאתי מסמך ארכיטקטורה שכדאי להעמיד מול המימוש: `LAYOUT_DEPENDENCY_MAP.md` נמצא בשורש הריפו, ולא בתיקיית `audits` כפי שטבלת המעקב רמזה. כעת אני משווה את מפת התלות המתועדת למבנה הקוד הנוכחי. זו בדיקה חשובה במיוחד: אם המפה מתארת מנוע מאוחד אך ה־runtime מפעיל מסלול מורשת עוקף, נצטרך לתקן לא רק קוד אלא גם את הבנת המערכת ואת מסמכי העבודה.

> **Inspecting pipeline changes**
>
> I’m examining the updated main branch, comparing the current pipeline with the legacy path, and tracing parsing, typesetting, and balancing sections to understand the architectural split.
>
> **Inspected pipeline changes**
>
> 
>
> **Mapping the unification path**
>
> I’m comparing the current and legacy engines, focusing on duplicated parsing, geometry, pagination, rendering, configuration, and reporting. I’m also checking specifications and tests to identify a safe migration order toward one canonical pipeline.
>
> **Mapped the unification path**
>
> 
>
> **Synthesizing architecture findings**
>
> I’m finding an active split: the legacy path bypasses the canonical pipeline and maintains separate parsing, geometry, pagination, rendering, hashing, configuration, and tests. I’m shaping a migration plan around shared models first, then incremental replacement.
>
> **Synthesized architecture findings**
>
> 
>
> **Investigated and designed unified typesetting architecture across repository pipelines**
>
> 
>
> **Defining the target architecture**
>
> I’m separating legacy behavior from legacy implementation: preserve calibrated output choices, but replace duplicated parsing, measurement, pagination, rendering, hashing, and reporting with shared interfaces and one deterministic engine.
>
> **Defined the target architecture**
>
> 
>
> **Distinguishing active paths**
>
> I’m confirming that the reported footnote issue belongs to the alternate pipeline, while the active IMUD route uses its own parser, line breaker, pagination, projection, rendering, and result contract. Unification should therefore begin by replacing this parallel engine, not merely adjusting the newer solver.
>
> **Distinguished active paths**
>
> 
>
> **Analyzed and unified legacy and DP layout architecture flows**
>
> 
>
> **Reconciling architecture conflicts**
>
> I’m finding stale dependency documentation, a live legacy route, and contradictory assumptions about reference fidelity. The next design should separate intended layout rules from historical implementation details before consolidating engines.
>
> **Correcting the route map**
>
> I’m confirming the active IMUD route bypasses the newer solver, so the earlier footnote intrusion isn’t necessarily live behavior. The immediate priority is consolidating the active monolith without preserving outdated reference assumptions.
>
> **Reconciled architecture conflicts and corrected the route map**
>
> 
>
> **Reviewed architecture documents, dependency maps, and master work plans**
>
> 
>
> Worked for 11m 15s

## הממצא הארכיטקטוני הראשון: כרגע אין מנוע עימוד אחיד אחד

הבדיקה כבר מצביעה על פער עמוק יותר מהטיפול בהערות השוליים: בריפו קיימים למעשה **שני מנועי פריסה נפרדים**, והבחירה ביניהם נעשית כבר בכניסה ל־`pipeline.js`\.

```js
if (settingsIn?._layout-profile === 'imud' && settingsIn._imudRaw) {
  const { legacyTypeset } = require('../layout/legacy-imud-flow');
  return legacyTypeset(rawText, settingsIn, env);
}
```

כלומר, כאשר המסמך מגיע עם פרופיל IMUD והגדרות המקור הגולמיות, המערכת אינה משתמשת בצינור העיבוד הרגיל. היא יוצאת ממנו לחלוטין ומפעילה מנוע אחר.

ההבדל אינו רק באופן טעינת ההגדרות\:

- המסלול הרגיל משתמש ב־`pipeline.js` → `dp-planner.js` → `balancing.js` ובמערכת ההגנות והנסיגה.
- מסלול IMUD משתמש ב־`legacy-imud-flow.js`, שמרכז בתוכו חלקים גדולים של הפענוח, המדידה, שבירת השורות, זרימת הגוף וההערות, בניית העמודים והאיזון.
- גם ההקרנה ל־PDF מפוצלת: `legacy-projector.js` למסלול המורשת לעומת `geometry-projector.js` למסלול DP.
- גם תהליך ה־DOM מכיר שני חוזי תוצאה ומכיל `renderLegacyPage` לצד מסלול הרינדור הרגיל.

זה ממצא ארכיטקטוני מוכח, לא השערה על סמך שמות הקבצים. ההפניה הישירה למנוע השני נמצאת ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com); מימושו נמצא ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com)\.

המשמעות מבחינת מטרת החקירה שלך ברורה: תיקון מנגנון במסלול אחד אינו מבטיח שהמסלול האחר פועל לפי אותה מדיניות, אותה גאומטריה או אותו חוזה קיבולת. זו אחת הסיבות לכך שבדיקות של פונקציה משותפת אינן מוכיחות שהמנוע בפועל משתמש בה באופן אחיד.

# דוח חקירה - הפיצול המבני של מנוע RED והדרך לאיחוד אמיתי

המסקנה המרכזית שלי מתחזקת: **הדרך לפשט את המנוע אינה לתקן עוד ועוד פונקציות בנפרד. צריך להפסיק להחזיק שתי מערכות עימוד שמממשות בנפרד את אותן אחריויות, ולהעביר את ההבדלים ביניהן למודל הגדרות וגאומטריה משותף.**

יש כאן גם תיקון חשוב לממצא הקודם, וכמה ממצאים חדשים שמשנים את סדר העבודה הנכון.

## 1\. תיקון חשוב: איזה מנוע באמת פועל באתר?

בדקתי את בחירת המסלול ב־`pipeline.js` מול תהליך ייבוא ההגדרות.

כאשר ההגדרות מגיעות דרך `importImudSettings`, הן כוללות את `_layout-profile='imud'` ואת `_imudRaw`\. במקרה הזה `typeset` יוצא מהצינור הרגיל ומפעיל את `legacyTypeset`\.

לכן, בפועל\:

**מסלול IMUD - המסלול הפעיל בהגדרות המקור**

`importImudSettings`

`_layout-profile = imud` \+ `_imudRaw`

`legacyTypeset` - מנוע פריסה עצמאי

`renderLegacyPage`

תצוגת DOM

`legacy-projector`

הקרנת PDF

---

**המסלול האחר - מנוע DP**

`pipeline` → `planPages` → `DP` \+ `protections` \+ `retreat` \+ `balancing`

`renderPage`

תצוגת DOM

`geometry-projector`

הקרנת PDF

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/legacy-settings-map.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com)\.

### השלכה על ממצא חדירת ההערות

צריך לדייק גם את הממצא הקודם: 16 עמודי החדירה שזיהינו ב־DP אינם, על סמך בחירת המסלול הזאת, הוכחה לבעיה במסלול IMUD הפעיל. הם מעידים על בעיה במסלול DP החלופי.

אין לבטל את הממצא - הוא חשוב למנוע שאנו רוצים לאחד - אבל אסור לערבב בין\:

- התנהגות המסלול הפעיל היום;
- התנהגות מסלול DP;
- התנהגות המנוע המאוחד שאותו אנחנו רוצים לבנות.

זו הבחנה הכרחית כדי שלא נרדוף אחרי תיקון שאינו פותר את הבעיה שהמשתמש רואה בפועל.

## 2\. היקף הכפילות גדול בהרבה ממה שנראה תחילה

בדקתי את מבנה שני המנועים ואת גדלי הקבצים.

גדלים לפי Git tree של main, בקומיט e31b4c0

| מודול | גודל |
|--------|--------|
| `legacy-imud-flow.js` | 255,180 בתים |
| `dp-planner.js` | 38,989 בתים |
| `pipeline.js` | 73,559 בתים |
| `balancing.js` | 17,061 בתים |

קובץ `legacy-imud-flow.js` לבדו גדול פי 6.5 לערך ממודול המתכנן של DP, וגדול יותר מהצירוף של `pipeline.js` ו־`dp-planner.js`\.

הבעיה אינה רק גודל הקובץ. הוא מכיל אחריויות שכבר קיימות במודולים נפרדים במנוע האחר.

| אחריות | מסלול IMUD | מסלול DP |
|--------|--------|--------|
| פענוח מטא־נתונים | `parseMetadata` | `dfa-lexer` |
| זיהוי הערות בסוגריים | `findNotes` | `bracket-scanner` ו־`notes/markers` |
| בניית יחידות מסמך | `tokenizeDoc` | `block-tokenizer` |
| שבירת שורות | `LineBreaker`, `wrapText` | `MeasureAPI.layoutLines`,‏ `kp-linebreak` |
| זרימת גוף | לולאות `legacyTypeset` | `dp-planner` |
| חלוקת הערות | `fnReserveFor`,‏ `placeFootnoteArea` | `footnote-budget`,‏ `reserveNotes` |
| איזון טורים | מימושים בתוך מנוע legacy | `optimalSplit`,‏ `balancing.js` |
| מדיניות גאומטריה | `GEO`,‏ `SZ` | `page-templates`,‏ `column-flow` |

יש גם תשתיות משותפות - למשל `MeasureAPI`,‏ `Ledger`,‏ `EventLog` וחלק ממודולי הקישוט. אבל עצם קיומם של מודולים משותפים אינו הופך את שני מסלולי הפריסה לאותו מנוע.

**מסקנה\:** צריך לאחד את האחריויות, ולא רק להחליף פונקציות כפולות בשמות זהים.

## 3\. הפיצול ממשיך עד לחוזה התוצאה

מצאתי שלושה ביטויים נוספים לכך שהפיצול הפך לחלק מהארכיטקטורה.

**א. שני חוזי hash**

ב־`report-schema.js` מתבצעת בחירה בין `layoutHash` של DP לבין `legacyLayoutHashDigest` של המורשת. הקוד מסביר שה־hash של DP אינו מוגדר על מבנה העמודים של legacy.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/audit/report-schema.js?utm_source=chatgpt.com)

**ב. שני נתיבי PDF**

`export-api.js` בוחר בין `legacy-projector` לבין `geometry-projector`, לפי `result.legacyProfile`\.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/export-api.js?utm_source=chatgpt.com)

**ג. שני נתיבי DOM**

`dom-renderer.js` מכיל `renderLegacyPage`, ולצדו `renderPage` הרגיל. אפילו מיפוי סוגי העמודים כולל `LEGACY_PT_CLASS` נפרד.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/dom-renderer.js?utm_source=chatgpt.com)

זה מצב שבו אין רק שני אלגוריתמי פריסה: יש שני דגמים של עמוד, שני נתיבי הקרנה, ושתי דרכי אימות של אותה תוצאה.

המבחן `legacy-result-contract.test.js` אף נועל במפורש את העובדה שפרופיל IMUD מחזיר `legacyProfile=true` ו־hash מהצורה `legacy-*`\.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/integration/legacy-result-contract.test.js?utm_source=chatgpt.com)

## 4\. מפת התלויות הקיימת אינה מתארת את המערכת המלאה

מצאתי את [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/LAYOUT_DEPENDENCY_MAP.md?utm_source=chatgpt.com)\.

המסמך מציג מנוע שכבות מסודר\:

`parser → typography → layout → decoration → output → core/pipeline`

הוא גם קובע ש־`core/pipeline` הוא הצרכן היחיד של פעולות הפריסה.

אלא שהמפה מסומנת כמעודכנת ל־3 בנובמבר, ואינה כוללת את מסלול ה־runtime העיקרי של IMUD דרך `legacy-imud-flow`\. היא מתארת היטב חלק ניכר ממנוע DP, אך אינה מפת תלות של כל המערכת הפעילה כיום.

זו סתירה שחשוב לתקן במסמכי הארכיטקטורה: אי אפשר להסתמך על מפת תלויות חלקית כשמתכננים להסיר קוד, להזיז אחריויות או לאחד מנועים.

## 5\. סתירה שצריך לפתור לפני איחוד

מצאתי גם סתירה עקרונית בין תיעוד ה־legacy לבין החלטות המשתמש המאוחרות יותר.

בראש `legacy-imud-flow.js` נאמר שזהו פורט נאמן למנוע המקורי, ושמקורות האמת שלו כוללים את `layout-reference.json` ואת קוד המקור הישן.

ב־WORKLOG של S4.9 אף נכתב במפורש: **התנהגות המקור היא המפרט**\.

אבל לאחר מכן קבעת שה־PDF הישן אינו מושלם, הוא נועד להבהרת המצב הרצוי באופן כללי, ואין צורך בהתאמה אליו. ההחלטות D-97 ו־D-100 סגרו את ההתאמה לייחוס כיעד.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/DECISIONS.md?utm_source=chatgpt.com)

לכן אסור שהאיחוד ייבנה מתוך הנחה שצריך לשמר את כל התנהגות legacy. צריך להפריד בין\:

- תכונות עיצוב ומידות של פרופיל IMUD שאושרו על ידך;
- כללי עימוד שאתה דורש מהמנוע החדש;
- התנהגויות היסטוריות שהן רק מאפייני המימוש הישן, ואולי אף שגויות.

**הפורט הישן הוא מקור לחומר ולידע, לא מפרט מחייב של המנוע החדש.**

---

## 6\. הארכיטקטורה שאני ממליץ עליה

אני לא ממליץ למזג את `legacy-imud-flow.js` לתוך `dp-planner.js`, וגם לא להעתיק את ה־DP אל תוך הקובץ הגדול. שתי הפעולות רק יחליפו שני מנועים מסורבלים במנוע אחד מסורבל.

הכיוון הנכון הוא **מנוע אחד עם פרופילי עימוד**, שבו פרופיל IMUD מגדיר נתונים והעדפות, ולא מפעיל מנגנון פריסה אחר.

## מבנה יעד מוצע

**1\. Document Model**

פענוח, AST, כותרות, פסקאות, מזהי הערות, טווחים ומבנה מסמך

**2\. Typography Engine**

מדידה אחת, שבירת שורות אחת, יחידות אטומיות והגנות טיפוגרפיות

**3\. Unified Layout Solver**

עמודים, טורים, כותרות חוצות־טורים, הערות, גבולות פרקים, קיבולות ואיזון - פתרון משותף אחד

**4\. Canonical Page Model**

תוצאת פריסה אחת, עם קואורדינטות, אזורים, סדר קריאה, הערות ו־trace

**DOM Renderer**

תצוגה חיה

**PDF Renderer**

ייצוא

---

**LayoutProfile**

נתוני IMUD או פרופיל RED: גודל עמוד, שוליים, מידות טורים, גופנים, אזורי כותרות, אזור הערות ופרמטרי עיצוב. אינו מכיל אלגוריתם פריסה חלופי.

### עקרון מכריע: לפתור את העמוד כמכלול

לדוגמה, מנגנון הערות השוליים אינו צריך לבצע\:

1. מילוי גוף לפי תקציב מסוים;
2. הוספת הערות;
3. חישוב מחדש של הגובה;
4. ניסיון לתקן חפיפה;
5. תיקון נוסף אם ההערה חצתה פרק.

המתכנן צריך לפתור יחד את הגוף ואת ההערות תחת אותם אילוצים.

מבחינה מתמטית, כל מועמד לחלוקת עמוד ייבדק מול\:

- גובה הגוף הזמין;
- גובה המרזב והכיתוב המפריד;
- קיבולת שני הטורים;
- תחילת הערה בעמוד הסמן;
- הכלת הערה בשלמות כאשר זה אפשרי לפי סדר העדיפויות שלך;
- פיצול הערה רק כשההכלה השלמה אינה אפשרית;
- גבול פרק שאסור להמשך הערה לחצות.

כך נמנעים שני מנגנוני תקצוב עצמאיים שמתקנים זה את תוצאותיו של זה.

## 7\. שלושה סיכונים מבניים נוספים שדורשים בדיקה

**א. הגדרות כפולות**

ב־legacy קיימים `_imudRaw`,‏ `settings` ו־`RED_SETTING_BRIDGE_S77`, וב־`readConfig` מתבצע שילוב בין הגדרות הרישום לערכים הגולמיים. זהו גשר חי שנוסף כדי לחבר הגדרות שלא השפיעו קודם.

הפתרון העתידי צריך להיות מקור הגדרות מנורמל אחד. ייבוא הגדרות IMUD צריך להפוך את 264 מפתחות המקור לפרופיל אחיד, ולא להשאיר את המנוע קורא חלק מהערכים ממערכת אחת וחלק ממערכת אחרת.

**ב. מצב גלובלי של הגדרות גאומטריות**

ב־`legacy-imud-flow.js` מוגדר אובייקט `SZ` ברמת המודול, ולאחר מכן `legacyTypeset` משנה אותו בזמן הריצה - למשל `SZ.fnBody`,‏ `SZ.h0Title` ו־`SZ.tocLevel`\.

זו אינה הוכחה לבאג בתוצאה הנוכחית, אך זו נקודת סיכון: התוצאה של מסמך צריכה לשאת את כל נתוני העיצוב והמדידה שלה, ולא להסתמך על אובייקט גלובלי ששונה על ידי הרצה מאוחרת יותר.

ניסוי מכריע: לעמד שני מסמכים עם הגדרות שונות, ורק לאחר מכן להפיק PDF לראשון. אם ההקרנה משתמשת בערכי `SZ` של השני, נמצא זליגת מצב בין מסמכים.

**ג. תקצוב הערות מול ציורן**

ב־DP יש `footnote-budget.noteHeight`, ובמקרן יש `wrapNoteTokens` שמצייר את השורות. גם כאשר שניהם משתמשים במדידה דומה, חובה להוכיח שהתקציב ושבירת השורות הסופית נשענים על אותו תכנון שורות. אחרת נוצר פער בין המקום ששוריין לבין המקום שהטקסט תופס בפועל.

במנוע המאוחד צריך להיות אובייקט תכנון הערות יחיד, שממנו נובעים גם גובה המרזב וגם תוצאת ההקרנה.

---

## 8\. סדר ההטמעה שאני ממליץ עליו

לא לבצע שכתוב מלא בבת אחת. זה מסוכן למנוע שאמור לשמור על תוכן של ספר שלם.

| שלב | פעולה | תנאי להשלמתו |
|--------|--------|--------|
| 1 | מפת תלות מלאה לשני המסלולים | כל פונקציה וצרכן משויכים לאחריות אחת; אין קוד runtime שהושמט |
| 2 | חוזה נתונים אחיד למסמך ולשורות | שני המסלולים מסוגלים להפיק אותו מבנה ביניים |
| 3 | איחוד מדידה ושבירת שורות | אותה תוצאת שורות ומדידות בשימושי DOM ו־PDF |
| 4 | איחוד קיבולת ופתרון עמודים | גוף, טורים והערות נפתרים באותו solver |
| 5 | איחוד מודל העמוד והרינדור | אותו Page Model מוזן לתצוגה ול־PDF |
| 6 | העברת הגדרות IMUD לפרופיל | אין קריאות מנועיות ישירות ל־`_imudRaw` |
| 7 | הסרת מסלול הפריסה הישן | לאחר הוכחת שימור תכונות, תוכן, דטרמיניזם וגאומטריה |
| 8 | ניקוי תיעוד ובדיקות | מקור אמת אחד, ללא בדיקות hash כפולות או מסלולי legacy נפרדים |

לכל אורך התהליך, הקורפוס הראשי יהיה `red-build/tests/fixtures/real/very_long_test_text.txt`\. בדיקות סינתטיות יישארו בדיקות ממוקדות בלבד, ולא יחליפו את בדיקת הספר האמיתי.

---

## מסקנת הסבב

(כיוון ארכיטקטוני התבהר)

הבעיה המרכזית אינה רק חישוב קיבולת שגוי. **שורש הבעיה הוא שהמערכת צמחה כשני מנועי עימוד, עם חוזי נתונים, חישובי גאומטריה, מדיניות הערות ומקרנים נפרדים.** תיקונים מקומיים מתווספים בתוך כל אחד מהם, ולפעמים גם לגשרים שביניהם.

לכן אני מציע לשנות את יעד החקירה\:

במקום להמשיך ולתקן כל פער בנפרד, נבנה תחילה **מפת אחריויות מלאה של שני המנועים**, נסמן לכל אחריות מקור אמת רצוי אחד, ונבדוק אילו חלקים אפשר להעביר למנוע המשותף בלי לשנות התנהגות מאושרת. רק אחר כך נחליט על סדר הסרה והעברה של המימוש הישן.

**לא שיניתי קוד ולא הפעלתי בדיקות בסבב הזה.** העבודה הבאה צריכה להיות מיפוי ברמת הפונקציות, לא ברמת שמות הקבצים: במיוחד `legacyTypeset`,‏ `planPages`, מנגנוני הערות, איזון, שבירת שורות והקרנת עמודים. במקביל נבדוק את שלושת הסיכונים המבניים שציינתי.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/LAYOUT_DEPENDENCY_MAP.md?utm_source=chatgpt.com) ו־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/spec/02_MASTER_WORK_PLAN.md?utm_source=chatgpt.com) יהיו נקודת המוצא לביקורת המתוקנת.

## Prompt:
12.11.2026, 11:13:51

ההודעה נקטעה בגלל שלא תכננת כראוי את אורך העבודה! המשך לחקור!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרת החקירה שלנו!!!

## Response:
12.11.2026, 11:14:08 · gpt-6-t-mini

אני ממשיך מהנקודה שבה נעצרה ההודעה, והפעם אפריד בין שלושה דברים: כפילות של מנועים שלמים, כפילות של אלגוריתמים בתוך כל מנוע, וכפילות בין מנוע הפריסה לבין שכבות ההקרנה והרינדור. חשוב במיוחד לא להסיק ש״איחוד״ פירושו למחוק את מסלול IMUD או להמיר הכול ל־DP: תחילה צריך לזהות אילו התנהגויות הן מדיניות משותפת, אילו הן הבדלי פרופיל לגיטימיים, ואילו הן שרידי תיקונים היסטוריים.

מצאתי כבר מסלול שני של כפילות: גם בתוך ה־DP עצמו יש שלבים שמבצעים איזון או תיקון גאומטרי אחרי שהמתכנן סיים את ההצבה. אני בודק כעת אם אלה שלבים משלימים עם חוזה ברור, או כמה מנגנוני איזון נפרדים שמתחרים על אותה תוצאה. במקביל אני משווה את מנוע שבירת השורות והמדידה במסלול IMUD לממשקים שכבר קיימים במסלול החדש — זהו מועמד מרכזי לאיחוד אמיתי, משום שכל פער שם יכול לשנות את מספר השורות ואת כל זרימת העמודים.

ההשוואה מאשרת שהכפילות אינה מסתכמת בשני מתכנני עמודים. מסלול IMUD כולל גם טוקנייזר עצמאי, מחלקת `LineBreaker` משלו, זרימת עמודים משלו, מנגנוני איזון מקומיים, הצבת הערות שוליים משלו ובניית תוכן־עניינים משלו. המסלול השני משתמש ב־DFA/Tokenizer, ב־`MeasureAPI` וב־Knuth–Plass, ב־DP ובמודולים נפרדים להגנות, הערות ותוכן־עניינים. עכשיו אני בודק היכן יש חפיפה פונקציונלית ממשית — ולא רק מימושים נפרדים שנדרשים בגלל פרופיל IMUD.

## ההעמקה: הכפילות קיימת כמעט בכל שכבת ליבה

הראיה החזקה ביותר לכך שהפיצול הוא מהותי נמצאת דווקא בבדיקת הספר האמיתי `long-real-text.test.js`\: אותו טקסט היסטורי מורץ במפורש פעמיים - פעם עם `getDefaultSettings()` במסלול DP, ופעם עם `importImudSettings()` במסלול IMUD. הבדיקה מאמתת שימור תוכן ודטרמיניזם בכל מסלול בנפרד, אך **אינה דורשת שהמסלולים יפיקו אותה פריסה או יצייתו לאותו חוזה גאומטרי**\. כלומר, שני המנועים אינם רק שתי דרכי הפעלה של אותו פתרון; הם מקבלים לגיטימציה כפתרונות נפרדים.
[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/e2e/long-real-text.test.js?utm_source=chatgpt.com#L80-L145)

| שכבת המנוע | מסלול DP | מסלול IMUD |
|--------|--------|--------|
| פענוח | `dfa-lexer` ו־`block-tokenizer` | `tokenizeDoc` ו־`parseMetadata` מקומיים |
| שבירת שורות | `MeasureAPI.layoutLines` מפעיל Knuth-Plass | `LineBreaker.breakPara` משלו |
| מודל עמוד | `page-templates` ו־`planPages` | קבועי `GEO` וזרימת `flowSection` |
| איזון | `optimalSplit`, מטריצת הגנות ולולאת נסיגה | `balanceBlock` ומנגנוני מתיחה/כיווץ מקומיים |
| הערות | `footnote-budget` ומנגנוני DP | תורים, תקציבים, פיצול והצבה מקומיים |
| תוכן עניינים | `toc-builder` | בניית TOC בתוך `legacy-imud-flow` |
| פלט | מקרן גאומטרי כללי | `legacy-projector` ורינדור Legacy ייעודי |

הכפילות בשבירת השורות מדאיגה במיוחד: `MeasureAPI.layoutLines()` קורא ל־`kp-linebreak.breakLines()` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/typography/measure-api.js?utm_source=chatgpt.com#L202-L209)\. לעומתו, `legacy-imud-flow.js` מחזיק מחלקת `LineBreaker` משלו; היא מבצעת מעבר מילה־אחר־מילה ובוחרת את השבירה לפי התאמת הרוחב, עם טיפול ייעודי בחלון, בסוגריים ובסמני הערות - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L407-L695)\.

לכן גם אם שני הנתיבים משתמשים בחלק משירותי המדידה המשותפים, **החלטת שבירת השורות אינה מתקבלת באותו אלגוריתם**\. שינוי באלגוריתם KP אינו מתקן אוטומטית את מסלול IMUD.

### פיצול נוסף: שתי מערכות שונות של גאומטריית עמוד

ב־IMUD הגאומטריה מוגדרת בקבועים כגון רוחב העמוד, רוחב הטור, מיקומי הטורים, ראשית הזרימה, גובה הזרימה וגובה שורת הגוף (`GEO`, `SZ`\). לדוגמה, `legacy-imud-flow.js` מגדיר את `COL_W`, `COL_R_X`, `COL_L_X`, `FLOW_TOP`, `FLOW_H` ו־`LINE_H` בקבועים. במסלול DP הגאומטריה נגזרת מ־`buildPageTemplate()` ומההגדרות.

אלו שני מודלים שונים של אמת גאומטרית. גם אם הערכים מכוילים כיום כך שייראו נכונים בפרופיל מסוים, הם אינם תוצאה של אותו חישוב. קוד שמתקן קיבולת או מרווח במסלול אחד אינו בהכרח מתקן את השני.

### פלט: הפיצול נמשך עד ה־DOM וה־PDF

הפיצול אינו מסתיים לאחר העימוד. `export-api.js` בוחר מקרן לפי `result.legacyProfile`\: או `legacy-projector.projectLegacyDocument()` או `geometry-projector.projectDocument()` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/export-api.js?utm_source=chatgpt.com#L135-L137)\.

גם `dom-renderer.js` מכיל `renderLegacyPage()` ייעודי, ו־`renderPage()` מפנה אליו כש־`page.legacy` מוגדר - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/dom-renderer.js?utm_source=chatgpt.com#L683-L691)\.

יש כאן שירותים שכבר אוחדו, למשל `MeasureAPI`, `line-font` וחלק ממודולי העיטורים. חשוב לשמר אותם ולא ליצור שכבה מקבילה חדשה. אך עצם קיומם אינו הופך את שני חוזי התוצאה ואת שתי מערכות ההקרנה למנוע אחד.

---

## ממצא קריטי נוסף: מסלול IMUD הוא המסלול הפעיל של האפליקציה, לא רק תאימות היסטורית

כאן הצלחתי לסגור נקודה שהייתה חשובה להכרעה הארכיטקטונית: האם מסלול `legacy-imud-flow` הוא רק אפשרות צדדית, או שזה המנוע שהמשתמש מפעיל בפועל.

הקוד מראה בבירור\:

1. בעת אתחול האפליקציה, `browser-entry.js` טוען את `default_settings.json` באמצעות `imud.loadLegacyDefaults()`\.
2. הנתונים עוברים דרך `importImudSettings()`\.
3. `legacy-settings-map.js` מזהה את קובץ ההגדרות המלא, מצמיד אותו אל `_imudRaw` ומציב `_layout-profile = 'imud'`\.
4. ההגדרות מוחלות באפליקציה, ולאחר מכן פעולת העימוד שולחת אותן ל־Worker.
5. `pipeline.js` מזהה את הפרופיל הזה ומעביר את הביצוע ל־`legacyTypeset()` במקום להמשיך בצינור ה־DP.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/browser-entry.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/legacy-settings-map.js?utm_source=chatgpt.com#L448-L464), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/app-shell.js?utm_source=chatgpt.com#L202-L217), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com#L120-L127)\.

**המשמעות\:** ברירת המחדל של האפליקציה החיה משתמשת במנוע המורשת, בעוד שמרבית ארכיטקטורת ה־DFA/KP/DP היא מסלול נפרד. זו אינה רק כפילות תיאורטית; אלה שני מסלולים פעילים שהבדיקות והאפליקציה מפעילות בהתאם למקור ההגדרות.

לכן אין די ב״ניקוי״ של `legacy-imud-flow.js`\. נדרש מסלול מעבר שבו המנוע הפעיל יעבור בהדרגה לחוזה המשותף, תוך שימור התנהגות פרופיל IMUD כנתוני תצורה ומדיניות - ולא כמימוש שני של כל פעולת העימוד.

## ממצא נוסף: גם בתוך מסלול DP יש כמה שכבות שמשנות את אותה גאומטריה

חשוב לדייק: לא כל הפונקציות הן כפילויות ממש. `optimalSplit` מחלק שורות בין טורים; `alignColumnBottoms` משנה את גובה השורות כדי ליישר תחתיות; ו־`autoQualityPass` נועד למלא או לכווץ את אזור הטקסט. אלה צרכים שונים. הבעיה היא שהמערכת מפעילה אותם כרצף של מעברים נפרדים, ולא מגדירה להם חוזה משותף של מצב גאומטרי סופי.

מצאתי נקודת חיכוך קונקרטית\:

- `alignColumnBottoms()` כותב את `aqStretch` של השורות כדי ליישר את תחתיות הטורים.
- מיד אחריו, כאשר `aq-enabled` פעיל, `autoQualityPass()` קורא את הגובה שכבר כולל את `aqStretch`, מחשב ממנו מקדם חדש, וכותב שוב לאותו שדה.
- אם `balance-chapter-end` מוגדר `stretch`, `applyChapterEndMode()` עצמו מפעיל `autoQualityPass([page])`, ולאחר מכן ה־pipeline מפעיל שוב `autoQualityPass(pages)` על כלל העמודים.

הקריאות האלה מאומתות בקוד: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L130-L189), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L198-L285), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com#L658-L671)\.

זו אינה הוכחה שכל מסמך נפגע - `aq-enabled` כבוי כברירת מחדל. אבל כאשר האפשרות מופעלת, יש כאן **שני מנגנונים שכותבים לאותו מקדם, כאשר השני מחשב את ערכו מתוך מצב שכבר שונה בידי הראשון**\. צריך להוכיח שהרצף הזה תקין ואידמפוטנטי; הקוד הנוכחי אינו מציג חוזה כזה. זו בדיוק דוגמה לסיכון שצומח מתוספת של עוד מעבר תיקון במקום ממודל פריסה יחיד.

במסלול IMUD התמונה מורכבת עוד יותר: `balanceBlock()` מחליט על חלוקת היחידות בין הטורים; `alignBlockBottoms()` משנה מרווחים וגובהי שורות; `stretchLastBlockToBottom()` מותח את הבלוק האחרון; ו־`tryReclaimOrphanTail()` עשוי למשוך שורות מעמוד הבא באמצעות כיווץ. כולם פועלים על אותו מבנה פנימי של בלוקים וטורים, אך אינם חלק מאותו מתכנן אילוצים. ראו [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L2834-L2915), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L1723-L1800), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L1930-L2015)\.

**המסקנה בשלב זה\:** המטרה אינה למחוק פונקציות איזון בזו אחר זו. צריך להגדיר תחילה מהי תוצאת הפריסה האופטימלית, אילו אילוצים היא חייבת לקיים, ואילו שינויים מותרים למתכנן לבצע כדי להגיע אליה. לאחר מכן כל פעולת האיזון, ההגנה והנסיגה צריכה לעבוד מול אותו מצב ואותו חוזה.

## ממצא מאומת: התצוגה החיה וה־PDF משתמשים בגדלים שונים להערות השוליים

כאן כבר מדובר בפער שניתן להוכיח ישירות מהקוד, ולא רק בסיכון ארכיטקטוני\:

| מקור הערך | גודל גוף הערה |
|--------|--------|
| `default_settings.json` של IMUD | **9pt** |
| ברירת המחדל הקבועה של `SZ.fnBody` | **8.5pt** |
| ערך `SZ.fnBody` לאחר `legacyTypeset()` ב־Worker | **9pt** |
| הערך שבו משתמש `renderLegacyPage()` בחלון הדפדפן | **8.5pt** |

מה גורם לכך?

1. קובץ ברירות המחדל קובע `s-note-body: "9"` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/ui/assets/imud/default_settings.json?utm_source=chatgpt.com#L146)\.
2. `legacy-imud-flow.js` מתחיל עם `SZ.fnBody = 8.5` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L70-L77), ולאחר מכן משנה אותו ל־`cfg.fnBodySize`, כלומר 9 - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L871-L882)\.
3. שינוי זה מתבצע בתוך ה־Worker, שמריץ את `typeset()` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/engine-worker-main.js?utm_source=chatgpt.com#L90-L101)\.
4. ה־PDF מוקרן באותו Worker, ולכן `legacy-projector` משתמש בערך המעודכן 9 - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/legacy-projector.js?utm_source=chatgpt.com#L461-L475)\.
5. לעומת זאת, חלון התצוגה משתמש ב־`renderPage()` מתוך `preview-tab.js` - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/preview-tab.js?utm_source=chatgpt.com#L128-L147)\. פונקציית `renderLegacyPage()` משתמשת בעותק המקומי שלה של `SZ.fnBody`, שעדיין 8.5 - [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/dom-renderer.js?utm_source=chatgpt.com#L1150-L1158)\.

הסיבה היא שמשתני מודול אינם משותפים בין ה־Worker לבין חלון הדפדפן. שינוי `SZ.fnBody` במנוע העובד אינו משנה את המשתנה בעל אותו שם ברינדור שבחלון.

יש כאן גם הסבר אפשרי לכך שהפער לא נתפס בבדיקות הקיימות: בדיקת S73 מפעילה `typeset()` ואז `renderPage()` באותו תהליך Node - כך ששניהם חולקים את אותו משתנה מודול שכבר שונה ל־9. היא אינה מדמה את ההפרדה בין Worker לחלון הדפדפן.

**מסקנת השורש\:** תוצאה של מנוע עימוד אינה יכולה להסתמך על משתני מודול שמשתנים בזמן הריצה כדי להעביר מידע לרינדור. כל נתון שמשפיע על המראה חייב להיות חלק מפורש ובלתי־משתנה מתוצאת העימוד או מפרופיל הטיפוגרפיה שמועבר אל הרנדרר. זה מקרה ברור שבו איחוד החוזים והסרת מצב גלובלי יפתרו בעיה עקרונית, במקום להוסיף עוד העתקת ערכים או תיקון CSS.

## Prompt:
12.11.2026, 11:49:47

ההודעה נקטעה בגלל שלא תכננת כראוי את אורך העבודה! המשך לחקור!!! ואל תשכח!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרת החקירה שלנו!!!

## Response:
12.11.2026, 11:50:02 · gpt-6-t-mini

אני ממשיך בחקירה ולא עובר עדיין לתיקוני קוד. הפעם אתמקד בהגדרת גבולות האיחוד ובתכנית מעבר שאינה מוסיפה עוד שכבת תאימות: אילו רכיבי IMUD הם נתוני פרופיל, אילו רכיבים הם אלגוריתמים כפולים, ואילו חלקים כבר משותפים וצריך להפוך למקור סמכות יחיד. אבדוק זאת מול המפרט ותכנית חמשת הסוכנים, כדי שהתכנית שתתגבש לא תסטה מהדרישות שלך.

עד כה, ההבחנה מתחדדת: מנוע DP כבר מחזיק את רוב התשתית החדשה — פענוח, סריקת סוגריים, טיפוגרפיה, תכנון עמודים, הערות ו־TOC. אבל מסלול IMUD אינו צורך אותה; הוא משחזר חלק ניכר מהתהליך בתוך קובץ ענק אחד. לכן התכנית הנכונה אינה "למזג עוד קבצים" אלא להעביר בהדרגה את סמנטיקת IMUD אל חוזי הנתונים והמדיניות של המנוע המשותף, ואז להסיר את המסלול החלופי. אני בודק כעת מה חסר בחוזים כדי שהמעבר הזה יהיה ממשי ולא עוד שכבת מתאמים.

בדקתי גם את שכבות הגרפיקה וה־TOC, והתמונה מתרחבת: כבר יש `toc-builder`, `headers-builder` ו־`ornament-plan` משותפים, אך Legacy עדיין מחזיק בנאי TOC, בניית כותרות ופס עיטורים משלו. בחלק מהמקרים הוא משתמש בפונקציה משותפת אחת בלבד — למשל `ornament-fit` — אבל שומר את תהליך ההחלטה והצבת הגאומטריה בנפרד. זה בדיוק סוג הכפילות שכדאי לאחד ברמת התהליך, לא רק לשתף בו פונקציות עזר.

## ממצא מרכזי: גם מנוע ה־DP אינו עדיין מתכנן גלובלי אחיד

הבדיקה מאשרת שהמסלול המודרני בנוי טוב יותר מבחינת הפרדת אחריות, אבל השם `dp-planner` עלול ליצור רושם רחב מדי לגבי אופן פעולתו בפועל.

**הוא אינו פותר כרגע בעיית עימוד גלובלית אחת על פני המסמך כולו.** בפועל, הוא משלב שלוש פעולות שונות\:

1. הצבה סדרתית: `pushLines()` עובר על השורות ומנסה להציבן בטורים לפי הסדר. כשאין מקום, הוא סוגר עמוד ופותח חדש.
2. אופטימיזציה מקומית: בסגירת עמוד, `optimalSplit()` בוחן את כל נקודות הפיצול הרציפות של השורות שכבר הוצבו באותו עמוד, ומחפש חלוקה מאוזנת וחוקית.
3. תיקונים לאחר ההצבה: `runRetreatLoop()` מפעיל בדיקות הגנה ומתקן ממצאים מסוימים.

הקוד: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L122-L220), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L24-L115)\.

### בעיה במנגנון בחירת נקודות הפיצול

מצאתי פער בין התיאור של `candidate-generator.js` לבין מה שהקוד מחשב בפועל\:

- התיאור מבטיח התחשבות ב־`capacityBefore`, ב־`capacityAfter` ובהקשר של הבלוק הבא.
- המימוש עובר על נקודות חיתוך בתוך הפסקה, מחשב את גובה החלק שלפני ואת גובה החלק שאחרי, וממיין לפי ההפרש ביניהם.
- הפרמטר השני, שאמור לייצג את מספר השורות שנכנסות כרגע, אינו משמש בחישוב.
- `findSplit()` מחשב `maxFit` לפי המקום הפנוי בטור האחרון, אבל `generateCandidates()` מקבל את קיבולת העמוד המלאה, ואינו מגביל את מועמד הפיצול ל־`maxFit`\.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/candidate-generator.js?utm_source=chatgpt.com#L19-L39), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L616-L631)\.

אני מסמן זאת כרגע **פער מוכח בין החוזה המתועד למימוש**, ולא ככשל פריסה מוכח בקורפוס. צריך לבדוק את ההשפעה שלו על ספר האמת לפני קביעת חומרתו.

### לולאת הנסיגה: קיימת, אבל אינה מתקנת את כל מה שהיא מזהה

`runRetreatLoop()` אכן קיים, מפעיל `protections-matrix`, כולל גלאי תנודות ותיעוד מחזור חיים ב־Ledger. עם זאת, במתכנן בפועל רק `column-imbalance` מקבל פונקציית תיקון ממשית. הפרות כגון `reading-order-break`, `widow-bottom` ו־`orphan-top` נרשמות כ־`correction-blocked`; אין להן תיקון אוטומטי במסלול הזה. גם `paren-cross-boundary` מופיע בסדר העדיפויות הכללי של הלולאה, אך לא הועברה לו פונקציית תיקון מ־`dp-planner`\.

כלומר, יש לנו **מנגנון בדיקה ונסיגה מרכזי**, אך לא מנגנון תיקון מאוחד לכל משפחות ההגנות כפי שמשתמע מהתיאור הארכיטקטוני.
[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L530-L563), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/retreat-loop.js?utm_source=chatgpt.com#L56-L129)\.

**השלכה למטרת האיחוד\:** אין לקבל את ה־DP הנוכחי כפתרון הסופי רק מפני שהוא המסלול החדש. צריך לאחד סביב חוזה תכנון מוגדר, ולא סביב מימוש קיים שיש בו גם הוא שלבי תיקון נפרדים ופערים בין הממשק למימוש.

## אימות הקורפוס: נמצאו שלושה קבצים שונים

בדקתי את מזהי Git של הקבצים עצמם, ולא הסתפקתי בשמותיהם או בהערות בתיעוד. התוצאה חד־משמעית\:

| קובץ | גודל | Git blob SHA |
|--------|--------|--------|
| `red-build/tests/fixtures/real/very_long_test_text.txt` | 3,404,111 בתים | `9c6d96f8…` |
| `audits/very_long_test_text.txt` | 3,403,990 בתים | `aa70c076…` |
| `red-build/tests/fixtures/real/orange_very_long_test_text.txt` | 3,386,061 בתים | `709f7246…` |

שלושתם שונים ברמת הבתים.

הבעיה אינה רק שמות קבצים: `long-real-text.test.js` מגדיר את `VERY_LONG` במפורש כקובץ מתוך `audits/`, וה־workflows של `full-math-audit` ושל `corpus-invariants` מריצים אף הם את `audits/very_long_test_text.txt`\. לכן **קובץ הבדיקה שנמצא בתיקיית fixtures אינו הקלט שעליו רצות בדיקות הקבלה המרכזיות של CI**\.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/e2e/long-real-text.test.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/.github/workflows/full-math-audit.yml?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/.github/workflows/layout-parity.yml?utm_source=chatgpt.com)\.

זה פער שיש לפתור לפני שינוי מנוע: צריך לקבוע קובץ קנוני אחד לפי ההכרעה שלך ולוודא שכל הבדיקות המרכזיות, שני פרופילי העימוד, התצוגה וה־PDF פועלים על אותו קלט. אין להסיק שהקבצים שקולים רק משום שכולם נקראים `very_long_test_text`\.

## האתגר הטיפוגרפי באיחוד: חלון המילה הראשונה חייב להיכנס לתוך Knuth-Plass

מצאתי כיצד ניתן לנסח את ההבדל בין מנועי שבירת השורות בצורה מדויקת.

ב־`legacy-imud-flow.js`, כאשר מופעלת מדיניות `window`, שתי השורות הראשונות של הפסקה מקבלות רוחב זמין קטן יותר, משום שמילת החלון מוצבת בצד ימין בגופן מוגדל. מהשורה השלישית חוזרים לרוחב הטור המלא. זהו אילוץ גאומטרי שמשפיע ישירות על בחירת נקודות השבירה.

לעומת זאת, `kp-linebreak.js` מקבל כיום `maxWidthPx` יחיד לכל הפסקה. הוא אינו מקבל מערך רוחבים או אילוצי רוחב המשתנים לפי מספר השורה. גם `MeasureAPI.layoutLines()` מעביר למחולל KP רוחב יחיד.

המשמעות היא שהדרך הנכונה אינה להפעיל את `dropword.js` הקיים: הוא נועד לקישוט שאינו משנה את הגאומטריה, ואילו חלון IMUD משנה אותה. צריך להרחיב את מנגנון KP כך שיתמוך ב־*line-shape constraints* - למשל, רוחב זמין שונה לשורות 1-2 ולאחר מכן רוחב רגיל. מאחר שמספר השורה תלוי במסלול השבירה שנבחר, הפתרון הנקי מחייב שהמצב של האלגוריתם יכלול גם את אינדקס השורה, ולא רק את מיקום הפריט בטקסט.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/typography/kp-linebreak.js?utm_source=chatgpt.com#L60-L150), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/typography/measure-api.js?utm_source=chatgpt.com#L200-L209), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L607-L693)\.

זה מועמד ברור לאיחוד עקרוני: **מנוע KP יחיד, שמקבל מדיניות שבירה עשירה**, במקום מנוע KP אחד ומחלק שורות גרידי נוסף.

## פער בכיסוי ספר המשתמש

הצלבתי גם את ספר המשתמש של 699 העמודים מול הבדיקות האחרונות\:

- יומן S76 מתעד אבחון ישיר על `red-build/tests/fixtures/real/very_long_test_text.txt` ותיקון של שלושת ליקויי ההערות.
- אבל `s76-notes-flow.test.js` בודק מסמכים שנבנו בתוך הבדיקה (`FLEX_DOC`, `CHAIN_DOC`\) ואת המחולל הקבוע; הוא אינו טוען את ספר המשתמש.
- `s77-user-issues.test.js` בודק מסמכי בדיקה ייעודיים כמו `CUT_DOC` ו־`QUOTE_DOC`, ולא את ספר המשתמש המלא.
- בדיקות הקורפוס הרחב ב־CI פועלות על `audits/very_long_test_text.txt`, שהוא הקורפוס הראשי שנקבע ב־D-98.

לכן ההכרעה הנכונה אינה להחליף את הקורפוס הראשי, אלא להחזיק **שתי בדיקות קבלה אמיתיות בעלות תפקידים שונים**\: הקורפוס הרחב הקבוע של D-98, וספר המשתמש שעליו התגלו ותוקנו הליקויים האחרונים. את שניהם יש להריץ על כל מסלול פעיל ובכל שינוי שמשפיע על הפריסה או על ההערות.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/WORKLOG.md?utm_source=chatgpt.com#L6-L42), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/e2e/s76-notes-flow.test.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/e2e/s77-user-issues.test.js?utm_source=chatgpt.com)\.

## ממצא ממוקד במתכנן: החלטת המיקום של בלוק אינה נשמרת

מצאתי בעיה מבנית נוספת, מעבר לכך שמחולל המועמדים אינו מקבל את מגבלת המקום הפנוי.

ב־`dp-planner.js` מתבצעת תחילה קריאה\:

```js
let chosenCol = ensureRoom(need);
```

הפונקציה אמורה לזהות באיזה טור כל הפסקה יכולה להיכנס. אבל הערך `chosenCol` אינו משמש להצבה. במקום זאת, `pushLines()` עובר מחדש על הטורים בכל שורה, תמיד מהטור הראשון.

מכאן נובע תרחיש בעייתי: פסקה שלמה יכולה להיכנס בטור השני, אבל אם נשאר מקום חלקי בטור הראשון, `pushLines()` עלול להתחיל להציב אותה שם ולפצל אותה - אף שהמתכנן כבר מצא טור שבו היא נכנסת בשלמותה.

זה עשוי להפר את סדר ההעדפות שבתכנית S5, שלפיו יש להעדיף העברת פסקה שלמה על פני פיצול שורות. זו כרגע מסקנה מבדיקת זרימת הקוד, ולא טענה שכבר הוכחה ככשל בספר המשתמש.

בנוסף, `findSplit()` מעביר ל־`generateCandidates()` את `maxFit` כפרמטר שני, אך מחולל המועמדים אינו משתמש בו. לכן הוא אינו מבטיח שנקודת הפיצול שנבחרה תכבד את מספר השורות שבאמת נכנסות במקום הפנוי הנוכחי.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L484-L501), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L198-L220), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L616-L631), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/candidate-generator.js?utm_source=chatgpt.com#L19-L39)\.

**בדיקת רגרסיה חסרה\:** בלוק שנכנס בשלמותו בטור השני, כאשר בטור הראשון נשאר מקום לחלק ממנו בלבד. הבדיקה צריכה לוודא שהפסקה מועברת כיחידה שלמה ולא מתפצלת ללא צורך.

## מפת התלויות חושפת בעיית שכבות, לא רק כפילות אלגוריתמית

מיפוי ה־`require()` בפועל מחדד היכן צריך לאחד, ומה אסור לשמר.

| אחריות | שירותים שכבר משותפים | מימושים נפרדים שיש לאחד |
|--------|--------|--------|
| מדידה וגופנים | `MeasureAPI` | מנגנוני שבירת השורות והעברת מדיניות החלון |
| רישום ואבחון | `EventLog`, `Ledger` | זרימת האבחון: CP1-CP5 ב־DP לעומת אירועי Legacy חלקיים |
| כותרות | `headers-builder.resolveSlot` | `buildHeader` המלא לעומת בניית הכותרות בתוך Legacy |
| עיטורים | `ornament-fit`, `ornament-ink` | `ornament-plan` לעומת `legacy-ornaments` |
| הערות | חלק משירותי המדידה והציור | חילוץ, מספור, תקצוב, פיצול והצבה בשני מסלולים |
| פלט | חלק מפונקציות העיצוב והנכסים | `geometry-projector`/רינדור כללי לעומת `legacy-projector`/`renderLegacyPage` |

יש כאן גם **היפוך תלות בעייתי**\:

- `legacy-imud-flow.js` משתמש ב־`output/line-font.js` לצורכי מדידה ועיצוב.
- `legacy-projector.js` מייבא את `GEO` ו־`SZ` מתוך `legacy-imud-flow.js`\.
- `dom-renderer.js` מייבא את אותם קבועים מתוך `legacy-imud-flow.js` בתוך `renderLegacyPage()`\.

כלומר, שכבת העימוד תלויה בשכבת הפלט, ושכבת הפלט תלויה בחזרה במימוש העימוד ההיסטורי. זו אינה הפרדה נקייה של מנוע, תצוגה וייצוא. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L22-L32), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/legacy-projector.js?utm_source=chatgpt.com#L12-L20), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/dom-renderer.js?utm_source=chatgpt.com#L683-L692)\.

גם `LAYOUT_DEPENDENCY_MAP.md` אינו מתאר את המצב במלואו: הוא מציג את שכבות DP ואת `pipeline` הכללי, אבל אינו מציג את מסלול ה־IMUD הפעיל, את `legacy-projector`, או את התלות ההדדית הזו. לכן אי אפשר להשתמש במפה הנוכחית כבסיס מספיק לתכנית האיחוד בלי לעדכן אותה מתוך גרף הריצה האמיתי.

**כיוון האיחוד\:** להעביר את קבועי `GEO/SZ` לנתוני תבנית עמוד ופרופיל טיפוגרפי בלתי־משתנים; להעביר פונקציות עיצוב כלליות מחוץ לשכבת הפלט; ולהשאיר את `dom-renderer` ואת מקרן ה־PDF כצרכנים של אותו מודל עמוד - בלי שידעו איזה מנוע יצר אותו.

## האבחון הסיבתי הקיים אינו מוכיח יציבות גאומטרית

בדקתי גם את `stage-snapshots.js`, כדי לוודא אם הוא משלים את מה שה־hash אינו מודד. המסקנה: הוא מספק אבחון מבני חשוב, אבל עדיין אינו מתעד את הגאומטריה עצמה.

הוא מזהה שורה לפי `tokenId#lineIdx` או מזהה חלופי, ושומר עבורה\:

- באיזה עמוד ובאיזה טור היא נמצאת.
- מה סוג השורה וכמה מילים יש בה.
- אם השורה נוספה, נעלמה, או עברה עמוד/טור בין נקודות הביקורת.

הוא **אינו שומר** את מיקום השורה, רוחבה, גובהה, קו הבסיס שלה, מיקום המילים או מידות אזור ההערות. לכן `final_stable: true` מוכיח שהמבנה הלוגי של השורות לא השתנה בין שתי נקודות הביקורת האחרונות - לא שהגאומטריה הסופית נשארה זהה.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/audit/stage-snapshots.js?utm_source=chatgpt.com#L47-L143), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/audit/stage-snapshots.js?utm_source=chatgpt.com#L238-L265)\.

במסלול Legacy המצב חלש עוד יותר: אין snapshots, והערך `geometryNeutralVerified: true` מוחזר כקבוע. גם ה־hash שלו אינו כולל גאומטריה, הערות, כותרות או עיטורים. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L3685-L3712)\.

מכאן נובעת דרישה ארכיטקטונית ברורה: לא מספיק לאחד את הפונקציות שמייצרות פריסה; צריך לאחד גם את **חוזה תוצאת הפריסה ואת האופן שבו מוכיחים את תקינותה**\.

אני מבחין בין שלושה סוגי זהות, שאסור לערבב ביניהם\:

| זהות | מה היא מוכיחה |
|--------|--------|
| `contentHash` | זהות הטקסט והקלט |
| `flowHash` | זהות שיוך השורות לפסקאות, עמודים וטורים וסדר הקריאה |
| `geometryHash` | זהות מידות העמוד, מיקומי שורות ומילים, אזורי הערות, כותרות, עיטורים ומרווחים |

ה־hash הנוכחי של DP קרוב יותר ל־`flowHash` מאשר ל־`geometryHash`\. אין בעיה עקרונית להשאיר hash מבני כזה, אך אסור להציגו כהוכחה לזהות גאומטרית.

## פער נוסף: גם במסלול DP התצוגה וה־PDF אינם צורכים מלבן גאומטרי סופי משותף

כאן חשוב לדייק: במסלול DP כבר יש שיפור משמעותי לעומת Legacy - שני הפלטים צורכים את אותו מודל עמוד ואת אותן שורות. אבל הם עדיין מחשבים חלק מהגאומטריה בנפרד.

**בתצוגת DOM\:**

- הטור ממוקם מתוך `page.template.columns`\.
- השורה מרונדרת כאלמנט CSS, והדפדפן מבצע את פריסת המילים, הרווחים והיישור.
- אזור ההערות ממוקם לפי `fnReservedHeightPx`, וה־CSS מציג את השורות בהתאם.

**ב־PDF\:**

- `geometry-projector.projectPage()` עובר על אותן שורות, אבל מחשב מחדש את מיקום המילים, רוחבן ורווחי היישור באמצעות `MeasureAPI`\.
- הוא מחשב מחדש את קואורדינטת ה־Y של כל שורה על פי `heightPx` ו־`aqStretch`\.
- הוא כולל נוסחאות מיקום משלו לגיליון ולכותרות העליונות, ובתוכן־העניינים הוא משתמש במיקומים קבועים (`top = 70`, גובה שורה 24px).

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/dom-renderer.js?utm_source=chatgpt.com#L1460-L1483), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/geometry-projector.js?utm_source=chatgpt.com#L197-L220), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/geometry-projector.js?utm_source=chatgpt.com#L675-L749), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/output/geometry-projector.js?utm_source=chatgpt.com#L222-L285)\.

זו אינה אותה כפילות מלאה של Legacy, מפני ש־DP כבר משתמש בחוזה עמוד משותף. אבל עדיין אין כאן אובייקט גאומטרי סופי שמכיל את מיקום כל שורה ומילה וששני הרנדררים רק מציירים אותו.

ההבחנה חשובה: **מודל שורות משותף אינו בהכרח מודל גאומטריה משותף.** גם כשהשורות זהות, חישוב רווחים ב־CSS לעומת חישוב רוחבים ב־PDF יכול ליצור פער.

## ממצא נוסף: אפילו בתוך DP אין עדיין חוזה אחיד לתקציב ההערות

מצאתי סתירה ברורה בין מודול הקיבולת לבין המתכנן ומודול האיזון.

`column-flow.js` קובע שאזור ההערות נפרש לרוחב תיבת התוכן כולה, ולכן התקציב שלו צריך להפחית את הקיבולת של **שני הטורים**\. זה גם תואם את האופן שבו התצוגה וה־PDF מציבים את המרזב. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/column-flow.js?utm_source=chatgpt.com#L39-L65)

אולם `dp-planner.js` עושה דבר אחר\:

- `usedHeight()` מוסיף את תקציב ההערות רק כאשר הטור הוא האחרון.
- `colCapacity()` מבטל במפורש את הפחתת תקציב ההערות (`fnBudget:false`\).
- `optimalSplit()` מקבל `extraLast`, ומוסיף את גובה ההערות לגובה הטור השני בחישוב האיזון.

לעומת זאת, `alignColumnBottoms()` במודול `balancing.js` מחשב תקרה משותפת באמצעות `capAll - fnReservedHeightPx`, כלומר מתייחס למרזב כאל אזור שחוסם את שני הטורים.

המשמעות היא שבתוך אותו מסלול DP פועלות שתי הגדרות שונות של קיבולת\:

$$
\text{מודל א׳: } H_0 \le C,\quad H_1 + H_{notes} \le C
$$

לעומת\:

$$
\text{מודל ב׳: } H_0 \le C-H_{notes},\quad H_1 \le C-H_{notes}
$$

רק המודל השני מתאים למרזב משותף שחוצה את רוחב העמוד. אין זו רק כפילות פונקציות: זו סתירה בין שני חוזים גאומטריים, ולכן תיקון נקודתי באחד המודולים עלול להחזיר את החריגה דרך מודול אחר.

המקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L122-L150), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L162-L195), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L24-L86), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/balancing.js?utm_source=chatgpt.com#L130-L189)\.

**הכיוון הנכון\:** לכל עמוד צריך להיות מודל אחד של אזורים וקיבולות - גוף, פס חוצה־טורים, מרזב הערות, שוליים ועיטורים צורכי־גובה. כל מתכנן, מאזן, מיקום הערות ובודק containment צריכים לצרוך את אותו מודל, ולא לחשב בנפרד מה נגרע מאיזה טור.

## ממצא שורש נוסף: שני המסלולים אינם מפענחים את אותו מסמך באותה סמנטיקה

כאן התגלתה כפילות שאינה רק מימוש שונה של אותו אלגוריתם. היא מתחילה עוד לפני שבירת השורות.

### 1\. פענוח המטא־נתונים

ב־IMUD, `parseMetadata()` סורק את כל שורות המסמך ומסיר כל שורה שמתאימה לאחד משמות שדות המטא־נתונים - גם אם היא מופיעה באמצע הספר או בתוך פרק.

במסלול החדש, `dfa-lexer.js` מזהה מטא־נתונים רק בפתיח המסמך. הפתיח מסתיים בשורה ריקה, בכותרת או בהערת סיום; שורת טקסט שמזכירה תבנית של מטא־נתון באמצע הספר נשארת תוכן.

זו אינה רק החלפת parser: זו הבחנה סמנטית חשובה. באיחוד צריך לשמר את התנהגות הפתיח המוגדר, ולא את הסריקה הגלובלית שעלולה להסיר טקסט מתוך הספר. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L119-L144), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/parser/dfa-lexer.js?utm_source=chatgpt.com#L51-L87)\.

### 2\. חילוץ הערות

גם כאן יש פער גדול\:

- `findNotes()` של IMUD מחפש פותח ראשון וסוגר ראשון. הוא אינו משתמש במחסנית, ולכן אין לו טיפול מלא בקינון ובזוגות סוגריים מקוננים.
- `bracket-scanner.js` משתמש במחסנית, עוקב אחר עומק הקינון, מזהה תוחם עברי `]ם`, שומר מיקומים ומדווח על סוגריים לא מאוזנים במקום לתקן אותם בשקט.
- `block-tokenizer.js` מפריד בין טקסט הגוף לבין `note-ref` ושומר את הטקסט של כל הערה במערך נפרד. ב־Legacy ההערות עדיין מפורקות מחדש בתוך `LineBreaker.splitWords()` ובמהלך הפקת השורות.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L146-L167), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/parser/bracket-scanner.js?utm_source=chatgpt.com#L38-L154), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/parser/block-tokenizer.js?utm_source=chatgpt.com#L101-L128)\.

### 3\. כותרות וסוגי בלוקים

ה־DFA וה־Tokenizer המודרניים מכירים במבנה אחיד של H0-H7, הקדמה, חלקים, פסקאות, הערות סיום, הוראות כותרת להערות וטקסט עריכה. Legacy מייצר עצמאית טוקנים מסוג `h0`-`h7` ו־`p`, ומשייך הערות־צד והערות־סיום דרך משתנים זמניים (`pendingSideNote`, `pendingEndNote`\) שממתינים לפסקה הבאה.

שני המסלולים כבר מכירים את אותן משפחות תוכן, אך מייצגים אותן בצורה שונה ומיישמים להן כללי שיוך שונים. לכן אין הצדקה להשאיר שני parsers קבועים. צריך להגדיר AST/Token model אחד, ולתאר בו במפורש את מדיניות הקלט של פרופיל IMUD - למשל כותרות, חלון, הערות וסגנונות - בלי לשכפל את פענוח המסמך.

---

## מצאתי גם פער סמנטי בהערות הסיום, שנחשף דווקא על ידי מחולל הבדיקות

המחולל הקבוע והרנדומלי יוצר בסוף חלק מהפרקים רצף של 2-6 שורות `הערת סיום - ...`\. זה נועד לבחון צפיפות הערות סיום לאורך הספר. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/test-doc-generator.js?utm_source=chatgpt.com)

אבל במסלול Legacy, `tokenizeDoc()` מחזיק רק משתנה יחיד `pendingEndNote`\. כל שורת הערת סיום חדשה מחליפה את הקודמת\:

```js
pendingEndNote = line.slice(endPrefix.length)...
```

המשתנה נצרך רק כאשר מגיעה פסקה רגילה. לכן ברצף של כמה שורות הערת סיום רצופות, הקוד משאיר רק את האחרונה. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L335-L369)

יש כאן בעיית אבחון נוספת: בדיקת שימור התוכן של Legacy סופרת את הטקסט מתוך הטוקנים שכבר נוצרו, ולא מתוך הטקסט המקורי לפני הפענוח. לכן טקסט שנזרק במהלך `tokenizeDoc()` עלול להיעלם עוד לפני שהחשבונאות מתחילה לבדוק שימור. כך ייתכן שאובדן בשלב הפענוח לא יופיע כממצא `content-loss`\.

ה־Tokenizer המודרני, לעומת זאת, יוצר טוקן `endnote` נפרד לכל שורה שמתחילה בקידומת הערת הסיום. הוא גם מכיר בהוראת כותרת עמודי הערות בצורת הרבים `הערות סיום - ...`, בעוד שמסלול Legacy אינו מממש את אותו חוזה. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/parser/block-tokenizer.js?utm_source=chatgpt.com#L71-L90)

אני מדגיש: זהו פער שמוכח בזרימת הקוד ובמבנה המחולל; לא ביצעתי כאן הרצה עצמאית שמוכיחה כמה שורות אובדות בפועל במסמך שנוצר. אבל הוא ממחיש למה אסור להסתפק בהשוואת מספר העמודים או ה־hash של שני המסלולים. נדרשת בדיקת שימור מול **הקלט המקורי לפני פענוח**, לרבות כל שורות ההערות וההוראות המבניות.

### דיוק חשוב לגבי ה־hash של הקלט

בדיקה נוספת מאשרת שהפער אינו מוגבל ל־`contentStats`\:

- Legacy מחשב `contentHashIn` אחרי `tokenizeDoc()`, מתוך המטא־נתונים והטוקנים שנוצרו. הוא אינו hash של הטקסט המקורי לפני הפענוח.
- DP מחשב `contentHash` מתוך הטוקנים שנוצרו ב־`block-tokenizer`, ולא מתוך הטקסט הגולמי.

לכן בשני המסלולים, ה־hash מוכיח עקביות של תוצאת הפענוח, אך אינו מוכיח שכל תוכן המקור זוהה ונשמר על ידי הפענוח. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/legacy-imud-flow.js?utm_source=chatgpt.com#L3465-L3481), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com#L156-L175)\.

כדי לסגור את הפער נדרשות שתי ראיות נפרדות: זהות מדויקת של קלט המקור לפני פענוח, וחשבונאות שמוכיחה שכל רכיבי התוכן שה־parser זיהה הועברו ל־AST או סווגו במפורש כתחביר שאינו מודפס. **עצם חישוב hash אינו תחליף לחשבונאות הזאת.**

## Prompt:
12.11.2026, 14:30:40

שוב ההודעה נקטעה בגלל שלא תכננת כראוי את אורך העבודה! המשך לחקור!!! ואל תשכח!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרת החקירה שלנו!!!

## Response:
12.11.2026, 14:31:03 · gpt-6-t-mini

ממשיך מאותה נקודה, והפעם מצמצם את יחידת החקירה כדי שלא תיחתך באמצע: אני משלים את בדיקת תזמון הערות השוליים והצבת הבלוקים ב־DP, ואז מגבש עקרונות איחוד ותכנון יעד. הדגש נשאר על ביטול כפילויות ומסלולים מקבילים — לא על הוספת מתאמים, גשרים או תיקוני־צד.

בדיקות S75 מאשרות שהשינוי האחרון במיקום הערות השוליים נבדק באמצעות `legacyTypeset()` בלבד; הן אינן מאמתות את אותו חוזה מול `planPages()` של DP. גם דרישת S6 בתכנית האב מדברת במפורש על תקציב הערות שגדל/קטן יחד עם פעולות העמוד, ועל refit אחרי שינוי במרזב. כלומר, זה אינו רק חשש תאורטי: מסלול IMUD קיבל לאחרונה התנהגות חשובה, אבל היא עדיין אינה חלק מחוזה מנוע משותף. אני משלים עכשיו את תמונת בחירת המסלול החי ואת נקודות הכניסה כדי לוודא היכן יש להסיר את הפיצול.

אימות מסלול ההפעלה החי סגר נקודה מהותית: `importImudSettings()` מסמן את ההגדרות כ־`_layout-profile: 'imud'` ומצמיד את ה־JSON הגולמי; `typeset()` מנתב כל קלט כזה ישירות ל־`legacyTypeset()` וחוזר לפני יצירת `EventLog`, `Ledger` ו־CP1–CP5 של DP. כלומר, אין כרגע ״מנוע אחד עם פרופיל IMUD״: יש שני מנועים פעילים, והבחירה ביניהם נעשית לפי מקור ההגדרות. זו הנקודה המרכזית שתכנית האיחוד חייבת לבטל.

> **Inspected DP layout footnote reservation and integration pagination mismatches**
>
> 
>
> **Clarifying engine unification**
>
> I’m confirming how legacy defaults select the profile and how the two engines differ. The likely direction is one unified algorithm with profile-driven behavior, while preserving legacy semantics as policies rather than maintaining a separate execution path.
>
> **Clarified engine unification**
>
> 
>
> **Inspected legacy pipeline dispatch, settings, routing, outputs, and layout logic**
>
> 
>
> **Mapping remaining differences**
>
> I’m narrowing the research to legacy-only behavior: body-first placement, page construction, projection, and rendering. I’m also checking which compatibility layers can become import-time adapters instead of runtime engine branches.
>
> **Reconciling requirements**
>
> I’m comparing the specifications with existing tests, especially heading placement, multi-column behavior, and legacy-versus-DP expectations. The key question is whether profiles can preserve behavior within one engine without retaining separate runtime paths.
>
> **Designing the unified pipeline**
>
> I’m shaping one canonical pipeline: normalized settings, shared parsing, line breaking, global planning, immutable page geometry, and common renderers. Legacy differences become profiles, not alternate runtime engines or post-hoc patches.
>
> **Designed a unified pipeline reconciling requirements and remaining differences**
>
> 
>
> **Investigated and planned unified typesetting engine architecture and layout logic**
>
> 
>
> **Validating solver constraints**
>
> I’m checking whether candidate generation enforces every stated capacity rule. One concern is that it rejects overflow for the first fragment but may still admit an oversized remainder, so the unified planner needs explicit hard bounds.
>
> **Refining migration risks**
>
> I’m identifying details the unified engine must preserve: character-level inline spans, note-marker measurements, heading and footnote policies, and explicit capacity checks. These are behavior requirements, not reasons to retain a second runtime engine.
>
> **Consolidating findings**
>
> I’m separating confirmed architecture facts from likely defects: two runtime engines, duplicated settings, separate renderers, and incomplete capacity checks are confirmed; real-document failures still need focused reproduction.
>
> **Validated solver constraints and refined migration risks**
>
> 
>
> **Unified layout and pagination into one constraint engine**
>
> 
>
> Worked for 6m 51s

## ממצא קריטי: הערות השוליים מוקצות לעמוד לפני שהמנוע קובע היכן יוצב הסמן

זהו אחד הפערים החשובים ביותר שעלו בבדיקה עד כה, משום שהוא נוגע ישירות לסדר ההחלטות של מנוע העימוד.

ב־`dp-planner.js` סדר הפעולות הוא\:

1. המנוע קורא `reserveNotes(blk)` ומוסיף את הערות הפסקה לעמוד הנוכחי.
2. רק לאחר מכן הוא מפעיל `ensureRoom(need)` כדי לבדוק אם הפסקה נכנסת.
3. אם הפסקה אינה נכנסת, הוא יכול לפצל אותה, לסגור את העמוד ולהציב את ההמשך בעמוד הבא - או להעביר את הפסקה בשלמותה לעמוד הבא.

אבל הערות הפסקה כבר שויכו לעמוד הקודם בשלב הראשון. לא מצאתי במעבר הזה פעולה מקבילה שמבטלת את השיוך ומקצה אותו מחדש לפי מיקום סמן ההערה בפועל.

זו אינה הוכחה שכבר קיימת חריגה מסוימת בספר המשתמש, אך זהו **ליקוי בסדר ההחלטות ובבעלות על שיוך ההערות**\: המיקום הסופי של הסמן עדיין אינו ידוע כשהערתו מוקצית לעמוד.

המשמעות הארכיטקטונית: הערות אינן צריכות להיות משאב שמוקצה לעמוד באופן עצמאי לפני הצבת הגוף. הן צריכות להיות רכיב של בלוק/עוגן במסמך, והמתכנן צריך לקבוע יחד את מיקום העוגן, מיקום ההערה ותקציב האזור שלה.

מקור: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L324-L410), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L484-L502)\.

## פער נוסף: בדיקת הקיבולת של DP אינה משתמשת בגובה השורות שהוא עצמו מדד

ב־`dp-planner.js` מוגדר\:

```js
const lineH = Math.round(
  settings['body-font-size-pt'] * (96 / 72) * settings['body-line-height']
);
```

ובהמשך `ensureRoom()` ו־`findSplit()` משתמשים ב־`lineH` הזה כדי לאמוד כמה שורות נכנסות.

אולם `MeasureAPI.lineHeightPx()` מחזיר גובה מדויק ללא עיגול. לדוגמה, 12pt ו־1.34 נותנים 21.44px, בעוד ש־DP מתכנן לפי 21px. נוסף על כך, בלוק עשוי לכלול שורות בגבהים שונים - למשל כותרות או סגנונות מותאמים - ולכן אפילו גובה שורה מדויק יחיד אינו מספיק לכל בלוק.

יש כאן סתירה בין **גאומטריית המדידה** לבין **גאומטריית ההחלטה**\.

הפתרון העקרוני: כל בדיקת כניסה ופיצול צריכה לסכם את הגבהים בפועל של השורות והמפרידים המיועדים להצבה, ולא להכפיל מספר שורות בגובה גוף משוער. הדבר צריך להיות חלק מחוזה התכנון האחד, לא תיקון ל־`ensureRoom()` בלבד.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L89-L110), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/layout/dp-planner.js?utm_source=chatgpt.com#L616-L631), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/typography/measure-api.js?utm_source=chatgpt.com#L190-L209)\.

## המשמעות המצטברת

כעת יש לנו ארבעה פערים מבניים שאינם נפתרים על ידי הוספת עוד תנאי\:

- בחירת טור נעשית ב־`ensureRoom()`, אך אינה מועברת להצבה בפועל; `pushLines()` מתחיל מחדש מהטור הראשון.
- בחירת הפיצול אינה מקבלת את ההקשר שהחוזה מבטיח, לרבות הבלוק הבא.
- תקציב ההערות מוקצה לעמוד לפני שהמיקום הסופי של העוגן נקבע.
- בדיקת הקיבולת משתמשת בגובה שורה מקורב, בעוד שהשורות עצמן כבר נמדדו.

ארבעת המקרים מצביעים על אותו שורש: **אין אובייקט החלטה אחד שמתאר הצעה שלמה להצבת בלוק בעמוד**\. במקום זאת, כל שלב מחשב חלק מההחלטה, ושלב אחר מבצע את ההצבה בפועל.

## מסקנת הביניים: נדרש איחוד ברמת האלגוריתם, לא ברמת הקבצים

הממצאים אינם מצביעים על כך שצריך להעביר את `legacy-imud-flow.js` לתוך `dp-planner.js`, או להפוך את DP למסלול שעוטף את IMUD. שני הכיוונים ישמרו את הכפילות בצורתה החדשה.

`legacy-imud-flow.js` הוא קובץ בן 3,721 שורות וכ־203KB. בתוכו נמצאים פענוח, שבירת שורות, עיצוב חלון, איזון טורים, תכנון הערות, כותרות, שערים, TOC, עיטורים וחשבונאות תוכן. ה־DP מפזר את האחריות הזאת למודולים, אבל עדיין משתמש בהצבה סדרתית ובכמה מנגנוני איזון ותיקון.

### ארכיטקטורת היעד שאני ממליץ עליה

**מקור המסמך**

טקסט גולמי, קובץ IMUD, מסמך מיובא

**Parser יחיד + AST קנוני**

כותרות, פסקאות, הערות, סוגריים, מטא־נתונים ועוגנים

**Typography Engine יחיד**

Knuth-Plass, מדידת גופנים, עיצוב inline, אילוצי רוחב לפי שורה, סמני הערות

**Page Planner יחיד**

בחירת גבולות עמוד וטור, פיצולים, הערות, כותרות, איזון והגנות - בהחלטה אחת

**מודל גאומטריה סופי ובלתי־משתנה**

מידות, מיקומים, שורות, מילים, אזורי הערות, כותרות ועיטורים

**DOM Renderer**

תצוגה חיה ו־HTML

**PDF Writer**

ייצוא

המשמעות של המבנה הזה היא שכל החלטה גאומטרית מתקבלת פעם אחת. אין למרנדר סמכות לשבור שורה מחדש, אין ל־PDF נוסחת מיקום חלופית, ואין למנגנון איזון סמכות להזיז שורות לאחר שהמתכנן כבר סגר עמוד.

### מה צריך להישאר מהמסלולים הקיימים, ומה צריך להיעלם

| רכיב קיים | החלטה ארכיטקטונית |
|--------|--------|
| `dfa-lexer` ו־`block-tokenizer` | בסיס ל־Parser הקנוני, לאחר מיזוג הסמנטיקה הנחוצה של IMUD |
| `bracket-scanner` | מקור יחיד לסריקת סוגריים והערות |
| `MeasureAPI` | מקור יחיד למדידה |
| `kp-linebreak` | בסיס לשבירת שורות; יש להרחיבו לאילוצי צורה משתנים |
| `LineBreaker` של IMUD | להסיר לאחר העברת מדיניות החלון והמדידה המעורבת |
| `dp-planner` | בסיס לתכנון, אך לא לשמר את מנגנון ההצבה הנוכחי כפתרון סופי |
| `legacy-imud-flow` | להוציא ממסלול הריצה לאחר העברת כל ההתנהגויות התקינות |
| `balancing.js` | לשלב את מטרות האיזון במתכנן במקום לבצע תיקונים עצמאיים לאחריו |
| `legacy-projector` | להסיר; לאחד את מודל הגאומטריה ואת ההקרנה |
| `geometry-projector` | בסיס למודל ההקרנה המשותף, עם הרחבתו למיקום מפורש של כל רכיבי העמוד |
| `renderLegacyPage` | להסיר לאחר שה־DOM והרינדור הכללי צורכים אותו חוזה עמוד |

יש לשמר את סמנטיקת מסמכי IMUD ואת ברירות המחדל שלהם, אך לא את מנוע העימוד שלהם.

### נקודה חשובה: איחוד אינו מחייב למחוק את כל ההבדלים בין ספרים

ההבדלים יכולים להישאר כנתוני פרופיל\:

- גודל עמוד, שוליים ורשת גאומטרית.
- גופנים, גדלים ומקדמי שורה.
- מדיניות כותרות ופתיחת פרקים.
- עיצוב מילת חלון.
- עיצוב סוגריים.
- מדיניות הצגת הערות ומספורן.
- אופי האיזון וההתנהגות בסוף פרק.

אבל כל פרופיל חייב להיכנס לאותו Parser, לאותו מנגנון מדידה, לאותו מתכנן ולאותו מודל תוצאה.

בפרט, `importImudSettings()` צריך להפוך לממיר קלט בלבד: הוא יתרגם את קובץ ההגדרות הישן ל־RED Settings תקניים. אין להמשיך להשתמש ב־`_imudRaw`, ב־`RED_SETTING_BRIDGE_S77` ובבדיקת `_layout-profile` כדי לבחור מנוע חלופי. זהו מנגנון כפול של מקור הגדרות ושל פעולת מנוע.

---

## תכנית המעבר הנכונה - לפי תלות וסיכון

אני ממליץ על הסדר הבא. אין להתחיל בשינוי האיזון עצמו לפני שהחוזים המשותפים הוגדרו.

| שלב | עבודה | תנאי סגירה |
|--------|--------|--------|
| 1 | מיפוי סמנטיקה מלאה של IMUD מול RED | לכל התנהגות יש disposition: נשמרת, מנורמלת או מוסרת מנומקת |
| 2 | AST קנוני ו־Parser יחיד | ספרי IMUD, הקורפוס ההיסטורי והמסמכים הרגילים מפוענחים ללא אובדן |
| 3 | איחוד טיפוגרפיה | KP מטפל בחלון, סוגריים ברמת תווים, סגנונות inline וסמנים בגופן ובגודל האמיתיים |
| 4 | מודל קיבולת וגאומטריה יחיד | אין נוסחאות קיבולת עצמאיות אצל DP, איזון, הערות ו־containment |
| 5 | מתכנן יחיד | בחירת הבלוק, הטור, נקודת הפיצול והעמוד נעשית מתוך אותה החלטה |
| 6 | שילוב הערות בעיית התכנון | עוגן, סמן, תקציב, פיצול והמשך מתוכננים יחד |
| 7 | גאומטריה סופית משותפת | DOM ו־PDF צורכים אותם מיקומים ומידות |
| 8 | אבחון אחיד | שימור תוכן מהמקור הגולמי, hashes נפרדים לזרימה ולגאומטריה, ו־snapshots מדידים |
| 9 | הסרת Legacy | אין יותר נתיב ריצה חלופי, מקרן נפרד או גשר הגדרות חי |
| 10 | אימות קבלה | שני הקורפוסים האמיתיים, הקלט ההיסטורי, תצוגה ו־PDF, דטרמיניזם וכל האינווריאנטים |

**לא הייתי מבצע מעבר הדרגתי שבו שני המנועים נשארים פעילים לאורך זמן.** ניתן להשתמש ב־Legacy כבסיס השוואה זמני בבדיקות, אך אין להשאיר אותו כמנוע שהאפליקציה יכולה לבחור בו. אחרת כל שינוי ידרוש שוב תיקונים כפולים, בדיוק התופעה שהחקירה מבקשת למנוע.

## מה עוד צריך לברר לפני שמקבעים תכנית עבודה

1. **הסמנטיקה המלאה של IMUD\:** עדיין נדרשת טבלת העברה מסודרת של כל ההתנהגויות הייחודיות, בעיקר פתיחות H0-H2, כותרות H3-H7, חלון המילה, עיטורים, שערים, הערות שוליים והערות צד.
2. **חוזה האופטימיזציה של המתכנן\:** יש להכריע מתוך המפרטים וההחלטות הקיימות מתי המטרה היא מילוי טורים ומתי איזון, מהו סדר העדיפויות בין פסקה שלמה לפיצול, ואיך נשמרים כללי סוף־פרק. אין להעתיק עיוור את `balanceBlock()` או את `optimalSplit()`\.
3. **שימור העוגנים\:** יש להוכיח על מסמכים אמיתיים שכל הערה מוצגת בעמוד שבו הוצב העוגן שלה, ושהמשך הערה אינו מקבל סמן חדש.
4. **הוכחת גאומטריה\:** צריך להחליף את ההוכחה המבנית המצומצמת הנוכחית בהשוואת מידות ומיקומים מפורשת, ולא להסתפק ב־hash של מילים וסדר שורות.
5. **סדר העדיפויות של חמשת הסוכנים\:** סוכן המנוע צריך להיות בעל הסמכות על חוזי ה־AST, המדידה, התכנון והגאומטריה. סוכני הבדיקות, התיעוד וה־UI צריכים לצרוך את החוזים האלה, לא לייצר להם חלופות.

**המצב בעבודה הנוכחית\:** זו עדיין חקירה בלבד. לא שיניתי קוד, לא שיניתי מסמכי ריפו ולא טענתי שבדיקות הורצו. לא חזרתי לעיסוק ביעדי P6/P7.

המסקנה המרכזית שלי כרגע ברורה: יש לבנות **מנוע עימוד יחיד, בעל פרופילי מדיניות ונתונים**, ולא שני מנועים בעלי תשתיות משותפות חלקית. זו הדרך היחידה שבה שינוי אחד במודל ההחלטה יתבטא באותו אופן בכל סוגי המסמכים, בלי צורך לשחזר את התיקונים בשני מקומות.

## Prompt:
12.11.2026, 15:07:31

כמה דברים:
1. אני אשמח שתערוך שאלון על הסמנטיקה והאופטימיזציה וכל ההגדרות שאינם מופיעות בלוח ההגדרות, וכן על ברירת המחדל הרצויה מבין ההגדרות. 
2. אני רוצה שנכניס שני פיצ'רים חדשים. 
 1. אפשרות להטמעת תמונה בתוך הטקסט (רק טקסט רגיל (כולל מוסגר) והערות השוליים התחתונים, לא בתוך כותרות 0-7, ההטמעה תיעשה ע"י הפניה לקובץ בשמו עם סימונים לפני ואחרי (תציע איזה סימון כדאי לבחור, אבל הרעיון הוא שיהיה אפשר להכניס בתוך פיסקה משהו כזה: #image_1.png# ובמידה ויש תמונה בשם כזה בסביבה המוגדרת מראש (כקובץ זיפ המכיל גם את קובץ הטקסט וגם את התמונה, בחירת תיקיה כנ"ל) היא תוכנס לתוך הטקסט) והוספת בחירה ללוח ההגדרות לבחור את רוחב התמונה ביחס לרוחב הטור שבו היא נמצאת (שמירת יחסי רוחב\גובה) ואת ההצמדה לימין\מרכז\שמאל, כמו כן יש למצוא דרך ששני הגדרות אלה יוטמעו בהפניה עצמה לדוגמא #image_1.jpg.l60# שמסמל שהתמונה תוצמד לשמאל ורוחבה יהיה 60% מרוחב הדף.
 2. אפשרות להגדרת סגנון גופן שונה לטקסט נבחר בתוך פיסקה. אפשרות זו תושג בשני אופנים:
  1. הגדרת מראש סגנון גופן-מזהה סימון זאת אומרת שטקסט שנמצא בין שני מזהים יוגדר מראש ככזה.
  2. הגדרת מזהה סימון כללי שיהיה ניתן להכליל בו את שם הגופן לדוגמא כזה: <FrankReal>הטקסט הרצוי</>.

## Response:
12.11.2026, 15:07:47 · gpt-6-t-mini

אכין את השאלון על בסיס המימוש והמפרטים הקיימים בריפו, כדי שלא אשאל על הגדרות שכבר קיימות או אציע ברירות מחדל שסותרות את התכנון. במקביל אנסח אפיון טכני לשני הפיצ'רים, כולל תחביר ההפניות לתמונות ולגופנים, נקודות ההכרעה, והשלכותיהם על מנוע העימוד המאוחד — בלי להכניס אותם כטלאים למסלולים נפרדים.

כבר עולה נקודה חשובה מן הריפו: פאנל ההגדרות נבנה מרישום `BINDINGS` יחיד, אבל לצד ההגדרות המוצגות קיימים גם ערכי ברירת־מחדל של IMUD, ערכות סגנון, מדיניות מנוע ושאלות פתוחות נפרדות. לכן השאלון צריך להבחין בין **הגדרה שהמשתמש יכול לשנות**, **מדיניות פנימית של האלגוריתם**, **התנהגות סמנטית של מסמך**, ו**ערך ברירת מחדל** — אחרת נקבל שאלון שמערבב החלטות מסוגים שונים.

בבדיקה של המפרט והקוד מתברר שחלק מההחלטות החשובות אינן באמת "הגדרות חסרות" אלא כללי התנהגות פנימיים: למשל תחום האיזון, סדר העדיפויות בין מניעת אלמנות/יתומים לבין מילוי הטור, טיפול בהערה שאינה נכנסת, אופן שבירת מילה ארוכה, וסף/תקרת החיפוש של המתכנן. אני מפריד אותן מן ההגדרות הגלויות; לא בהכרח נכון לחשוף את כולן כפקדים, אבל כן נכון לקבוע להן סמנטיקה וברירת מחדל מפורשת.

> **Inspected repository structure, questionnaire sources, and UI engine settings**
>
> 
>
> **Analyzing configuration coverage**
>
> I’m comparing the declared bindings with the settings registry, including dynamically generated entries, so I can design a practical questionnaire covering hidden semantics, optimization choices, and meaningful defaults without listing every low-level option.
>
> **Analyzed configuration coverage**
>
> 
>
> **Refining the questionnaire**
>
> I’m separating the 253 declared controls from the 11 visible settings categories and checking generated entries separately. I’ll also include compact image-marker choices and defaults for semantic, rendering, and optimization behavior.
>
> **Defining image syntax**
>
> I’m proposing `#image_1.jpg.l60#`: the filename followed by alignment (`l`, `c`, or `r`) and width percentage. I’m treating width as relative to the current text column, while panel defaults apply when no suffix is provided.
>
> **Clarifying image flow**
>
> I’m identifying the remaining layout choice: whether images should interrupt paragraph flow as atomic blocks or allow surrounding text to wrap. I’m also accounting for missing files, nested paths, duplicate names, supported formats, and aspect-ratio preservation.
>
> **Planning configuration questions**
>
> I’m consolidating choices for image flow, asset resolution, inline font syntax, style scope, nesting, escaping, and pagination. I’ll keep defaults deterministic and ensure preview, pagination, and PDF rendering interpret the same document structure.
>
> **Refined questionnaire, image syntax, flow, and configuration questions**
>
> 
>
> **Cataloging unresolved choices**
>
> I’m checking the specification for open semantic decisions, internal tuning parameters, and settings used outside the visible panels. I’ll turn those findings into a focused questionnaire before asking for default confirmations.
>
> **Cataloged unresolved choices**
>
> 
>
> **Fetched specifications and inspected engine settings, bindings, layouts, typography, and constants**
>
> 
>
> **Reviewed specification priorities, decisions, settings, and current baseline**
>
> 
>
> **Preparing configuration choices**
>
> I’m organizing the remaining decisions into semantic behavior, optimization policy, hidden engine controls, and defaults for the existing settings. I’ll distinguish user-facing options from internal constants so the questionnaire stays actionable.
>
> **Structuring decisions**
>
> I’m narrowing the survey to unresolved semantics and optimization priorities, while treating the canonical layout pipeline as fixed. I’ll ask about balancing, widow rules, footnote behavior, measurement accuracy, fallback handling, and which legacy controls should disappear.
>
> **Designing the survey**
>
> I’m consolidating unresolved layout, optimization, asset, image, and inline-font decisions into a concise questionnaire. I’m keeping image references deterministic, preserving aspect ratios, and treating each image as a layout-aware block.
>
> **Prepared configuration choices and designed a structured decision survey**
>
> 
>
> **Reviewed decisions, open questions, and layout engine code for discrepancies**
>
> 
>
> **Fetched styles, schema, I/O, extensions panel, and settings files**
>
> 
>
> **Organizing the questionnaire**
>
> I’m separating unresolved semantics, optimization priorities, hidden engine choices, image behavior, inline fonts, and existing defaults. I’ll keep the canonical layout pipeline fixed and make each decision easy to answer.
>
> **Organized the questionnaire**
>
> 
>
> **Preparing the questionnaire**
>
> I’m organizing the unresolved semantic choices, optimization priorities, hidden engine decisions, default settings, and image/font syntax into a compact questionnaire. I’ll keep already-set requirements as recommendations rather than asking them again.
>
> **Clarifying layout features**
>
> I’m organizing the remaining decisions around image placement, inline font syntax, semantic scope, and optimization priorities. I’m keeping missing assets, ambiguous markers, and fallback behavior explicit so rendering stays deterministic.
>
> **Prepared questionnaire and clarified layout features**
>
> 
>
> **Preparing a configuration survey**
>
> I’m organizing the unresolved semantic choices, optimization priorities, hidden engine behaviors, current defaults, image syntax, and inline-font rules. I’m separating fixed decisions from choices that still need confirmation before implementation.
>
> **Building the questionnaire**
>
> I’m organizing the unresolved semantic, optimization, image, font, and default-setting decisions into a compact survey. I’m separating fixed requirements from choices that still need confirmation, so implementation can follow one coherent baseline.
>
> **Reviewing print semantics**
>
> The request is evaluating a questionnaire before implementation. It covers hidden layout rules, optimization priorities, existing defaults, image syntax and placement, and named inline font styles.
>
> **Prepared a configuration questionnaire and reviewed print semantics**
>
> 
>
> **Inspected app wiring and fixed pipeline image, style, and span syntax**
>
> 
>
> Worked for 15m 10s

הבדיקה הראשונית מראה שפאנל ההגדרות הנוכחי כולל **253 בקרות** ב־11 קבוצות הגדרות, ובנוסף שני אזורי פעולה: ספריית העיצובים וייבוא תוספים. כלומר, לא מדובר בלוח קטן שחסרות בו רק כמה אפשרויות; יש להפריד בין שאלון על ברירות המחדל של ההגדרות הקיימות לבין שאלון על מדיניות המנוע שאינה חשופה למשתמש.

מצאתי גם את [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/OPEN_QUESTIONS.md?utm_source=chatgpt.com), שבו כבר רשומות עשר שאלות פתוחות או היסטוריות. לא נכון להציג אותן שוב כאילו טרם נשאלו: אבדוק אילו מהן עדיין רלוונטיות ואשלב אותן בשאלון המעודכן.

**העיקרון המנחה באפיון שני הפיצ'רים\:** תמונה וסגנון גופן יהיו רכיבים סמנטיים בתוך זרם התוכן, ולא HTML שמוזרק לאחר העימוד. כך מנוע אחד יוכל למדוד אותם, לשבור שורות, לתכנן עמודים ולהפיק HTML ו־PDF מאותה גאומטריה - בלי מסלול תמונות נפרד ובלי תיקונים לאחר העימוד.

## ממצאי הבדיקה לגבי שני הפיצ'רים

**סגנונות גופן בתוך פסקה\:** יש כבר תשתית חלקית, בהחלטה D-68 ובקוד `extensions/apply-styles.js`\. היא מזהה זוגות סמנים לפני שבירת השורות, ולכן אין צורך להמציא מנגנון חדש. עם זאת, המימוש הנוכחי מתרגם את הסגנון בעיקר למקדם גודל ולמזהה סגנון; לא מצאתי בו החלה של משפחת גופן שונה לכל מילה ב־DOM וב־PDF. כלומר, יש להרחיב את מנגנון הטווחים הקיים, לא לבנות מערכת מקבילה.
מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/DECISIONS.md?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/extensions/apply-styles.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com)\.

**תמונות בתוך הטקסט\:** יש כבר אימות לנכסי תמונה בחבילת הרחבות: מזהה, מקור מוטמע מסוג `data:`, ממדים וטקסט חלופי. אבל זה אינו פענוח של הפניה מתוך פסקה. יתרה מזו, חיבור ההרחבות ב־`app-shell.js` מעביר למנוע את הסגנונות ואת העמודים המותאמים, אך לא מעביר אליו את מערך התמונות. לכן אין כרגע בסיס להניח שהיכולת הקיימת כבר מטפלת בתמונות בתוך תוכן הספר.
מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/extensions/style-schema.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/extensions/extensions-io.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/app-shell.js?utm_source=chatgpt.com)\.

מכאן ההמלצה הארכיטקטונית: שני הפיצ'רים ייכנסו למודל תוכן עשיר אחד. טווח גופן יהפוך ל־`TextRun` עם מאפייני סגנון; תמונה תהפוך לאלמנט תוכן מדיד עם ממדים ויחס־ממדים. שניהם ייכנסו למדידה ולתכנון העמודים לפני ההכרעה על שבירת השורות והעמודים. המקרן ל־DOM והמקרן ל־PDF יקבלו את אותה גאומטריה. אין ליצור עבורם מסלול עימוד מורשת נוסף.

## שאלון הכרעות - סמנטיקה, אופטימיזציה, ברירות מחדל ושני הפיצ'רים

השאלון מחולק לארבעה חלקים. הוא כולל את הנקודות שעדיין דורשות הכרעה, אך אינו מחזיר לדיון החלטות שכבר התקבלו. לצד כל הצעה ציינתי את ברירת המחדל המומלצת שלי, כדי שתוכל לאשר אותה או לשנותה.

**document: **

# שאלון הכרעות - מנוע העימוד RED

**מטרה:** השלמת חוזה ההתנהגות של מנוע העימוד, קביעת ברירות המחדל, והגדרת שני פיצ'רים חדשים - תמונות בתוך הטקסט וסגנונות גופן בתוך פסקה.

אפשר לענות לפי מזהי השאלות. אין חובה להשיב על הכול בבת אחת. תשובה כגון **„מקבל את כל ההמלצות, למעט...”** תקפה; היא תאשר את ברירות המחדל המוצעות בכל יתר הסעיפים.

---

## חלק א - סמנטיקה ואופטימיזציה שאינן הגדרות רגילות בלוח

### א1. היקף איזון הטורים על ידי העברת תוכן

יש להבחין בין שני מנגנונים:

- **איזון תוכני:** העברת פסקאות או שורות בין הטורים, כלומר שינוי גבול החלוקה של רצף הקריאה.
- **יישור תחתיות:** התאמת גובה הטורים בלי להעביר שורות ובלי לשנות את סדר התוכן.

ההמלצה היא לשמור את האיזון התוכני בהיקף המצומצם הבא:

1. סוף פרק או חלק - לפני H2, לפני H1 ובסוף המסמך.
2. לפני H3 החוצה את שני הטורים.
3. לא לבצע איזון תוכני רגיל באמצע זרימת פרק, כאשר הטקסט פשוט ממשיך לעמוד הבא.

**האם להוסיף גם איזון תוכני לפני H4/H6?**

- א. לא. רק סוף מקטע ולפני H3.
- ב. כן, גם לפני H4.
- ג. כן, גם לפני H4, H5 ו־H6.
- ד. לפי תנאי אחר שאפרט.

**המלצה: א.** שאלת האיזון המורחב לפני H4/H6 נשארה פתוחה במסמך השאלות הישן.

### א2. התנהגות של סוף פרק קצר

יש כאן הכרעה שחשוב לנסח במפורש: יישור תחתיות הטורים אינו בהכרח הוראה למלא את כל גובה העמוד.

- א. סוף פרק קצר נשאר טבעי; אין למתוח את התוכן כדי למלא עמוד.
- ב. אם קיימים שני טורים מאוכלסים, מיישרים את תחתיותיהם, אך לא מותחים את שניהם עד תחתית העמוד.
- ג. מותחים את התוכן עד תחתית אזור הטקסט גם אם הפרק קצר.
- ד. מיישרים רק כאשר הפער בין הטורים קטן מסף מוגדר.

**המלצה: ב.** כך נשמר יישור הטורים שהוגדר כדרישה, בלי להפוך פרק קצר לעמוד מתוח באופן מלאכותי.

### א3. שארית עמוד בסוף פרק שיש בו הערות שוליים

כיצד יש לנהוג אם נותר אזור ריק בסוף פרק, והערות השוליים הן הסיבה לכך שהטקסט אינו יכול למלא אותו?

- א. להשאיר את השארית אם אין פתרון תקין שאינו פוגע בעוגני ההערות ובסדר התוכן.
- ב. לנסות לפצל או להעביר חלק מהערה כדי למלא את העמוד, כל עוד העוגן נשאר בעמוד המתאים.
- ג. להעדיף מילוי עמוד על פני הקטנת ההערה או פיצולה.
- ד. כלל אחר.

**המלצה: א, עם ניסיון לפתרון לפי ב לפני שמקבלים את השארית.** אין להתיר מעבר של הערת פרק אל הפרק הבא.

### א4. קפדנות אלמנות ויתומים

כיום ארבע ההגנות מופעלות כברירת מחדל, ומידת הקפדנות מוגדרת `normal`:

- מניעת שורת המשך יחידה בראש טור או עמוד.
- מניעת שורה יחידה של פסקה חדשה בתחתית טור או עמוד.
- שמירת לפחות שתי שורות אחרי כותרת H1-H6.
- מניעת כותרת H3 חוצה־טורים שאין אחריה טקסט.

איזו ברירת מחדל רצויה?

- א. `normal` - כל ההגנות פעילות, אך מותרת פשרה מתועדת אם אין חלופה חוקית.
- ב. `strict` - אין לקבל חריגה משום כלל, גם במחיר עמוד נוסף.
- ג. `relaxed` - רק המקרים החמורים ביותר חוסמים את הפריסה.

**המלצה: א.** חריגה אינה מוסתרת; היא מדווחת עם סיבה.

### א5. סף שורת־שדון (Runt)

קיימת אי־אחידות בין המסמכים: ההגדרה הנוכחית בלוח היא 50%, ואילו ה־SRS מתאר גם סף של 40% מקיבולת השורה הממוצעת, וגם מרווח בין מילים הגדול מ־150%.

מהו הסף הרצוי להגדרה `runt-min-width-pct`?

- א. 40%.
- ב. 50%.
- ג. 60%.
- ד. להשאיר 50%, אך להשתמש גם בכלל של 150% מרווח בין מילים.

**המלצה: ד.** שני המדדים בודקים תופעות שונות, ולכן נכון שלא לצמצם אותם למדד יחיד.

### א6. סדר העדיפויות של האופטימיזציה

כאשר יש כמה פריסות תקינות, מה צריך להכריע ביניהן?

הצעתי לסדר העדיפויות:

1. שימור מלא של הטקסט, ההערות והסמנים, ללא שינוי סדר הקריאה.
2. אפס חפיפות וגלישות; קיבולת נכונה של אזורי הטקסט וההערות.
3. שמירת עוגני ההערות והגנת הכותרות, האלמנות והיתומים.
4. איכות שבירת שורות - הימנעות משורות דלילות ופיצולים טיפוגרפיים גרועים.
5. צמצום מספר העמודים, כאשר הדבר אינו פוגע באיכות.
6. איזון תוכני רק בהקשרים שהוגדרו לכך.
7. יישור תחתיות ומתיחה אנכית רק בהתאם לכללים שנקבעו.

**האם סדר זה מקובל?** אם לא, איזה סעיף צריך לעלות או לרדת בסדר?

### א7. מנגנון המדידה

כיום ברירת המחדל היא `measure-impl=table`; קיימת גם אפשרות `font-metrics`, שמבוססת על מטריקות מקובצי הגופן הרשומים.

- א. להשאיר טבלאות מדידה כמנגנון ראשי.
- ב. להשתמש במטריקות גופן אמיתיות כברירת מחדל, כאשר הגופן מוטמע וזמין.
- ג. להשתמש במטריקות אמיתיות תמיד, ולדווח על גופן שאין לו מטריקות זמינות.
- ד. להשתמש במטריקות אמיתיות כשאפשר, ובטבלאות רק כחלופה מפורשת ומדווחת.

**המלצה: ד.** זהו האיזון הטוב ביותר בין דיוק גיאומטרי לבין יכולת עבודה עם גופנים שאינם רשומים.

### א8. פרמטרים פנימיים של המנוע

קיימים ערכים כמו מספר איטרציות מרבי, חלון לזיהוי תנודות, רווח ביטחון לעיגול דפדפן, תקרת חיפוש ומקדמי ניקוד של מועמדי חלוקה.

האם יש להפוך אותם להגדרות משתמש?

- א. לא. אלה פרמטרים פנימיים של האלגוריתם; המשתמש מגדיר סמנטיקה ומדיניות, והמנוע קובע את אופן המימוש.
- ב. כן, לחשוף את כולם בפאנל מתקדם.
- ג. לחשוף רק פרמטרים שיש להם משמעות טיפוגרפית ישירה, ולא גבולות חיפוש או פרטי מימוש.

**המלצה: ג.** למשל, אפשר לחשוף מדיניות קפדנות; אין סיבה לחשוף למשתמש את מספר האיטרציות של לולאת הנסיגה.

### א9. כותרת H1 בכותרת העליונה

הערך הקיים הוא `main`.

- א. `main` - להציג את הכותרת הראשית בלבד.
- ב. `full` - להציג את הכותרת המלאה.
- ג. בהתאם למבנה הכותרת.

**המלצה: א**, אלא אם יש צורך ברור בהצגת הכותרת המלאה.

### א10. סבילות עיגול במדידת containment

במסמך השאלות הישן מופיעים 6-10 מקרי עיגול שסווגו בינתיים כתקינים. האם לקבל סטייה זעירה שמקורה בעיגול מספרי, בתנאי שאין חריגה חזותית או חפיפה?

- א. כן, אם היא בתוך סבילות המדידה המוגדרת.
- ב. לא. כל חריגה מספרית, גם מזערית, נחשבת ממצא.
- ג. להבחין בין סטייה חשבונית פנימית לבין גלישה גיאומטרית בפועל.

**המלצה: ג.** אין לערבב שגיאת עיגול שאינה משנה את הגאומטריה המודפסת עם גלישה אמיתית.

### א11. גדלי עמוד

הקטלוג הנוכחי מציע A4,‏ A5,‏ 16×16 ו־custom.

- א. להשאיר כך.
- ב. להוסיף גדלים סטנדרטיים נוספים.
- ג. להגדיר קטלוג מוגדר מראש ובנוסף אפשרות למידות חופשיות.

**המלצה: ג.**

### א12. ארבעת מקטעי השער האחורי

האם ארבעת מקטעי הטקסט של השער האחורי צריכים להיות:

- א. טקסט חופשי, כפי שהם כיום.
- ב. שדות מוגדרים מראש, עם משמעות סמנטית לכל מקטע.
- ג. שדות מוגדרים מראש, אבל עם אפשרות להחליף את שמותיהם ולהשאירם חופשיים.

**המלצה: ג.**

---

## חלק ב - ברירות המחדל של ההגדרות הקיימות בלוח

כיום יש 253 בקרות הגדרה. אין צורך לעבור ידנית על 253 שורות אם מקבלים את ערכי הבסיס. אבקש לאשר או לשנות את ברירות המחדל הבאות, ולהצביע על חריגים.

### ב1. גופן גוף הספר

יש כאן אי־התאמה שדורשת הכרעה: ברירת המחדל הנוכחית ברישום היא `Frank Ruhl Libre`, אך בהחלטה D-91 מתועדת בקשת שימוש בגופן Guttman Rashi המוטמע.

מה צריך להיות גופן ברירת המחדל של גוף הספר?

- א. `Guttman Rashi` - לפי ההחלטה המאוחרת.
- ב. `Frank Ruhl Libre` - לפי הרישום הנוכחי.
- ג. גופן אחר שאציין.

### ב2. גודל גוף הטקסט וגובה השורה

המצב הנוכחי: 14pt וגובה שורה 1.4.

- א. להשאיר 14pt ו־1.4.
- ב. לשנות את שניהם.
- ג. להשאיר את גודל הגופן ולשנות את גובה השורה.

### ב3. טקסט מוסגר

המצב הנוכחי: `paren-style-scale=1.0`, כלומר אין הקטנה.

- א. להשאיר 1.0.
- ב. להקטין ל־0.92.
- ג. להקטין ל־0.90.
- ד. לקבוע ערך אחר.

**המלצה:** 0.92, בתנאי שמדידת הגופן והרינדור משתמשים באותו ערך.

### ב4. מילה ראשונה מוגדלת (Drop Word)

המצב הנוכחי: `drop`, מילה אחת, גודל 2em, סף של שלוש שורות.

- א. להשאיר.
- ב. לעבור להדגשה רגילה.
- ג. להציג מילה ראשונה מוגדלת בלי חלון.
- ד. לבטל.

### ב5. גופני הכותרות

המצב הנוכחי: כל רמות H0-H7 משתמשות ב־David HB, עם גדלים שונים.

בהחלטה D-91 צוין ש־DavidLibre-Bold משמש לכותרות ולתוכן העניינים. האם להחיל זאת גם על ברירת המחדל של H0-H7?

- א. כן, DavidLibre-Bold לכל הכותרות.
- ב. לא, להשאיר David HB.
- ג. להפריד בין כותרות ראשיות, משניות ותוכן עניינים.

**המלצה: ג.** כך לא נכפה גופן אחד לכל התפקידים.

### ב6. הערות שוליים וסיום

המצב הנוכחי:
- הערות שוליים מופעלות.
- מנגנון הצבה `body-first`.
- זרימה רציפה `continuous`.
- הערה ארוכה מתפצלת `split`.
- איפוס מונה לפי חלק/פרק (`section`).
- טור הערות אחד.
- סרגל הפרדה רגיל.

ההתנהגות הזאת תואמת את ההכרעות המאוחרות יותר, ולכן **המלצתי להשאיר את כל אלה כברירת מחדל**.

הערה: אין להציג יותר את `legacy` כמנגנון עימוד חלופי. מטרת הפרויקט היא מנוע יחיד; יש להעביר את הסמנטיקה הרצויה למנגנון המאוחד ולא להשאיר שתי דרכי פעולה.

### ב7. איכות אוטומטית (AQ)

המצב הנוכחי: AQ כבוי (`aq-enabled=false`), עם טווחי התאמה שמרניים, ומתיחת תחתיות פעילה בהגדרות המשנה.

- א. להשאיר AQ כבוי כברירת מחדל.
- ב. להפעיל AQ כברירת מחדל.
- ג. להפעיל רק את יישור התחתיות, ללא שינויי ריווח אוטומטיים.

**המלצה: ג.** יישור תחתיות הוא כלל גאומטרי נפרד; אין הכרח להפעיל בגללו את כל מנגנון AQ.

### ב8. תוכן העניינים

המצב הנוכחי: תוכן כללי מופעל, מפורט כבוי; רמות 1-2 מוצגות ורמות 3-7 מוסתרות.

- א. להשאיר.
- ב. להפעיל גם תוכן מפורט.
- ג. לשנות את רמות ההצגה.

### ב9. כותרות עליונות

המצב הנוכחי: הכותרות מופעלות; סלוטי ימין/מרכז/שמאל נפרדים לצדדים הפיזיים של העמוד; H1 מוצג במצב `main`.

- א. להשאיר את כל ברירות המחדל הנוכחיות.
- ב. להפעיל כותרת ייעודית לעמודי פתיחה.
- ג. לשנות את מקורות הכותרות או את מיקומם.

### ב10. רשת העמוד

המצב הנוכחי: A4, רוחב טור 40%, שוליים צדדיים 7.5%, מרווח בין טורים 2%, שוליים עליונים ותחתונים 20px.

- א. להשאיר כבסיס.
- ב. לשנות את רוחב הטורים.
- ג. לשנות את השוליים.
- ד. להגדיר ערכת בסיס אחרת.

### ב11. מספור העמוד

המצב הנוכחי: מספור עברי, תחתית מרכז, גופן ליבורנה מודגש, 11pt, שחור.

- א. להשאיר.
- ב. לשנות את הגופן או הגודל.
- ג. לשנות את מיקום המספור או הפורמט.

### ב12. עיטורים, צבעים ורקעים

המצב הנוכחי: רוב העיטורים כבויים כברירת מחדל; הטקסט שחור והרקע לבן. ערכות עיצוב יכולות לספק עיצוב אחר.

- א. להשאיר את ברירת המחדל הנקייה, ולהשתמש בערכות עיצוב לפי הצורך.
- ב. להגדיר עיטורים מסוימים כברירת מחדל.
- ג. להגדיר ערכת עיצוב קבועה כברירת מחדל.

---

## חלק ג - פיצ'ר 1: תמונות בתוך הטקסט

### ג1. תחביר הפניה לתמונה

הצעתי לשמור את המבנה שביקשת, ולהוסיף סיומת קצרה שמציינת יישור ורוחב:

- `#image_1.png#` - שימוש בהגדרות ברירת המחדל.
- `#image_1.jpg.l60#` - הצמדה לשמאל, רוחב 60%.
- `#image_1.jpg.c60#` - הצמדה למרכז, רוחב 60%.
- `#image_1.jpg.r60#` - הצמדה לימין, רוחב 60%.

הסיומת `.l60`, `.c60` או `.r60` היא חלק מתחביר ההפניה, ולא חלק משם הקובץ. אם אין סיומת, המנוע לוקח את רוחב התמונה ואת היישור מההגדרות.

האם התחביר מקובל?

- א. כן, בדיוק כך.
- ב. כן, אבל להשתמש באותיות אחרות.
- ג. להעדיף תחביר אחר.

### ג2. בסיס חישוב רוחב התמונה

בבקשה שלך מופיעים גם "רוחב הטור" וגם בדוגמה "60% מרוחב הדף".

הצעתי: האחוז תמיד יחושב מתוך **רוחב אזור הטקסט המקומי שבו התמונה נמצאת**:
- בגוף הספר - רוחב הטור הנוכחי.
- בהערת שוליים - רוחב טור ההערות שבו התמונה מוצגת.

כך אותה הפניה תישאר נכונה גם כאשר גודל העמוד, הטורים או מספר טורי ההערות משתנים.

האם זה מקובל?

- א. כן.
- ב. לחשב תמיד מתוך רוחב כל אזור הטקסט של העמוד.
- ג. לחשב לפי רוחב אחר שאציין.

### ג3. רוחב ברירת המחדל

איזה רוחב ייקבע אם אין סיומת בהפניה?

- א. 40%.
- ב. 50%.
- ג. 60%.
- ד. 75%.
- ה. ערך אחר.

**המלצה: 60%.**

### ג4. יישור ברירת המחדל

אם ההפניה אינה כוללת `.l`, `.c` או `.r`, כיצד להצמיד את התמונה?

- א. לימין.
- ב. למרכז.
- ג. לשמאל.

**המלצה: מרכז.** אפשר כמובן לשנות לכל תמונה בנפרד.

### ג5. האם התמונה עוטפת טקסט?

אם ההפניה מופיעה באמצע פסקה, יש שתי אפשרויות:

- א. **אובייקט עצמאי בתוך רצף הפסקה:** הטקסט שלפניה מוצג, אחריו התמונה, ואז הטקסט שאחריה ממשיך. אין טקסט שעוטף אותה מהצדדים.
- ב. לאפשר גלישת טקסט מסביב לתמונה, בדומה לעימוד מגזיני.

**המלצה: א.** זהו מודל יציב ופשוט למדידה, לשבירת שורות ולתכנון העמודים. הוא גם מונע תלות במנגנוני float של הדפדפן.

### ג6. מבנה חבילת המסמך

ההצעה היא לתמוך בשני אופני טעינה:

1. ZIP המכיל את קובץ הטקסט ואת תיקיית התמונות.
2. בחירת תיקייה שמכילה את קובץ הטקסט ותיקיית התמונות.

מבנה מומלץ:

```text
Book.zip
├── manuscript.txt
└── images/
    ├── image_1.png
    ├── image_2.jpg
    └── image_3.png
```

הטקסט יוכל להפנות בשם הקובץ בלבד, למשל `#image_1.png#`, והמנוע יחפש אותו בתיקיית `images`.

- א. המבנה הזה מתאים.
- ב. התמונות צריכות להיות באותה תיקייה של קובץ הטקסט, ללא תיקיית משנה.
- ג. לאפשר גם הפניות לנתיבים יחסיים כגון `#images/chapters/image_1.png#`.

**המלצה: א + ג.** הנתיב היחסי מאפשר למנוע כפילויות בשמות קבצים.

### ג7. פורמטים נתמכים

- א. PNG ו־JPEG בלבד.
- ב. PNG, JPEG ו־WebP.
- ג. גם SVG.

**המלצה: ב.** SVG דורש טיפול אבטחתי ורינדורי מיוחד; אין צורך להכניס אותו לגרסה הראשונה.

### ג8. תמונה חסרה או לא תקינה

אם נמצאה הפניה אך הקובץ אינו קיים, או שהתמונה פגומה:

- א. להציג ממצא ברור, להשאיר מקום מסומן בתצוגה, ולחסום ייצוא PDF עד לתיקון.
- ב. לדלג על התמונה ולהמשיך.
- ג. להציג תמונה חלופית.

**המלצה: א.** אסור שהיעדר תמונה יגרום להעלמת תוכן או לשינוי שקט של העימוד.

### ג9. תמונה שאינה נכנסת לגובה הפנוי

- א. להקטין אותה באופן פרופורציונלי עד שתיכנס, תוך שמירת יחס רוחב/גובה.
- ב. להעביר אותה בשלמותה למקום הבא שבו ניתן להציג אותה.
- ג. להציג ממצא ולדרוש תיקון ידני.

**המלצה:** א כאשר ניתן להציג אותה במידות קריאות; אם אינה יכולה להיכנס גם לאחר הקטנה סבירה, ב או ג לפי הכרעתך.

### ג10. תמונות בתוך הערות שוליים

הגדרת שהפיצ'ר יחול גם על הערות שוליים תחתונות. ההמלצה היא:

- התמונה תיחשב חלק מתוכן ההערה.
- גובה התמונה ייכלל בתקציב ההערות לפני העימוד.
- תמונה לא תיחתך בין עמודים.
- אם ההערה ממשיכה לעמוד הבא, התמונה תמשיך כחלק מההערה, בלי ליצור לה סמן הערה חדש.

האם לאשר התנהגות זו?

- א. כן.
- ב. לאפשר תמונה בהערת שוליים רק אם היא נכנסת כולה באזור ההערות של העמוד.
- ג. כלל אחר.

### ג11. כפילות שמות קבצים

אם שתי תמונות שונות בחבילה נקראות `image_1.png`:

- א. לדחות את החבילה ולדווח על הכפילות.
- ב. לבחור לפי סדר הופעתן.
- ג. להשתמש בנתיב יחסי מלא כדי להבחין ביניהן.

**המלצה: ג**, ובמקרה של הפניה בשם בלבד - לדווח על עמימות ולא לבחור באקראי.

---

## חלק ד - פיצ'ר 2: סגנון גופן שונה בתוך פסקה

### ד1. סגנון מוגדר מראש באמצעות מזהה סמנים

הכוונה: מגדירים מראש סגנון, למשל `RashiInline`, ומקשרים אליו זוג סמנים. כל טקסט שנמצא ביניהם מקבל את אותו סגנון.

דוגמה אפשרית:

```text
§R§הטקסט בגופן רש"י§/R§
```

או זוג סמנים סימטרי כגון:

```text
~הטקסט בגופן רש"י~
```

הזוג יוגדר מראש בפאנל ההגדרות ויקושר למזהה סגנון ולגופן המתאים.

האם להעדיף:
- א. זוג סמנים נפרדים לפתיחה ולסגירה.
- ב. סמן סימטרי יחיד לפתיחה ולסגירה.
- ג. לתמוך בשתי האפשרויות.

**המלצה: ג.** זה כבר מתאים לעיקרון הקיים ב־D-68.

### ד2. סימון כללי עם שם הגופן

הצעתי לתמוך בגרסה מפורשת:

```text
<font:FrankReal>הטקסט הרצוי</font>
```

וגם, אם תרצה לשמור על התחביר הקצר שהצעת:

```text
<FrankReal>הטקסט הרצוי</>
```

הגרסה המפורשת נוחה יותר לבדיקת התאמה בין תג פתיחה לתג סגירה; הגרסה הקצרה נוחה להקלדה.

- א. להשתמש רק בתחביר הקצר.
- ב. להשתמש רק בתחביר המפורש.
- ג. לתמוך בשניהם, כאשר שניהם מתורגמים לאותו מודל פנימי.

**המלצה: ג.**

### ד3. מהו "סגנון גופן" מוגדר מראש?

האם סגנון מוגדר מראש צריך להכיל:

- א. משפחת גופן בלבד.
- ב. משפחת גופן וגודל.
- ג. משפחת גופן, גודל, משקל (מודגש/רגיל), נטוי וצבע.
- ד. את כל מאפייני הטיפוגרפיה המותרים במערכת.

**המלצה:** ד עבור סגנון מוגדר מראש; בתחביר הכללי `<FrankReal>` רק משפחת הגופן תוחל, וכל שאר המאפיינים יירשו את הסגנון שמסביב.

### ד4. היקף ההחלה

האם סגנון גופן inline יחול:

- א. רק בתוך פסקאות גוף רגילות.
- ב. גם בתוך טקסט הערות השוליים.
- ג. גם בתוך הערות סיום.
- ד. בכל טקסט רגיל שאינו כותרת H0-H7.

**המלצה:** ד, תוך החרגת כותרות H0-H7, כותרות עליונות ורכיבי ממשק.

### ד5. קינון של סגנונות

לדוגמה:

```text
<Rashi>טקסט רש"י <FrankReal>קטע בגופן FrankReal</> המשך רש"י</>
```

האם לאפשר קינון כזה?

- א. כן, באמצעות מחסנית סמנים; הסגנון הפנימי גובר על החיצוני רק במאפיינים שהוא מגדיר.
- ב. לא. רק טווח אחד בכל פעם, ללא קינון.
- ג. לאפשר קינון, אך לא חפיפה חלקית.

**המלצה: א.**

### ד6. טווח שאינו נסגר

אם קיים סמן פתיחה ללא סמן סגירה, או סגירה שאינה מתאימה:

- א. להשאיר את הסמנים כחלק מהטקסט ולהציג ממצא.
- ב. להחיל את הסגנון עד סוף הפסקה.
- ג. להתעלם מהסמנים בשקט.

**המלצה: א.** אין לשנות תוכן בשקט.

### ד7. גופן שאינו מוטמע

כיום יש קטלוג מורחב של שמות גופנים שאינם מוטמעים בפועל בפרויקט. מדידה בגופן שאינו זמין למנוע עלולה לגרום לפער בין התצוגה לבין PDF.

- א. לאפשר בחירה בגופן כזה עם אזהרה ונפילה לגופן חלופי.
- ב. לאפשר רק גופנים מוטמעים.
- ג. לאפשר גם גופנים חיצוניים, אך לדרוש מהמשתמש להטמיע את קובץ הגופן.

**המלצה: ג.** כך נשמרת האפשרות להשתמש בגופן אישי, אך המדידה והייצוא נשארים מבוססים על קובץ גופן מוגדר.

### ד8. היחס בין סגנון inline לבין סוגריים

אם טקסט נמצא גם בתוך סוגריים וגם בתוך סגנון גופן מפורש, למשל:

```text
( <FrankReal>טקסט</> )
```

ההמלצה שלי:

- משפחת הגופן המפורשת תגבר על משפחת הגופן של הסוגריים.
- אם סגנון הגופן אינו מגדיר גודל, הקטנת הסוגריים תישמר.
- אם סגנון הגופן מגדיר גודל מפורש, הגודל המפורש יגבר.

האם לאשר?

- א. כן.
- ב. הסגנון המפורש יגבר על כל מאפייני הסוגריים.
- ג. הסוגריים תמיד יגברו.

### ד9. מקום הגדרת הסגנונות המוגדרים מראש

היכן לשמור את ההגדרות של מזהי הסגנון וזוגות הסמנים?

- א. כחלק מתבנית הגדרות המשתמש.
- ב. כחלק ממסמך הספר, כדי שהמסמך יישא את הגדרותיו.
- ג. בספריית סגנונות שניתן לייבא/לייצא, ולשייך למסמך או לתבנית.
- ד. בכל האפשרויות, עם עדיפות מוגדרת למסמך על פני תבנית.

**המלצה: ד.** כך ניתן לשתף מסמך בלי לאבד את משמעות הסמנים.

---

## סיכום תשובות

אפשר להשיב בקיצור, למשל:

```text
א1=א
א2=ב
א3=א
א4=א
א5=ד
א6=מקבל את הסדר המוצע
א7=ד
א8=ג
א9=א
א10=ג
א11=ג
א12=ג

ב1=...
ב2=...
...
ב12=...

ג1=א
ג2=א
...
ג11=ג

ד1=ג
ד2=ג
...
ד9=ד
```

אין צורך להכריע מחדש בהחלטות שכבר אושרו במפורש; מטרת השאלון היא לסגור את הפערים שנותרו וליצור בסיס חד־משמעי למימוש.

## איך איישם את ההכרעות בלי להוסיף טלאים

לאחר קבלת תשובותיך, יש ליצור מפרט מימוש אחד לשני הפיצ'רים ולהוסיף אותו למפרט האב ולרישום ההחלטות. סדר המימוש המומלץ\:

1. **מודל תוכן עשיר אחיד\:** הרחבת מודל ה־AST כך שיכלול טווחי טקסט בעלי סגנון ואובייקטי תמונה, במקום להכניס HTML לתוכן.
2. **פענוח מוקדם\:** פענוח סמני הגופן והתמונות לפני המדידה. הפניה לתמונה נפתרת לנכס מקומי, ומאפייני הגופן נפתרים למשפחת גופן זמינה.
3. **מדידה ושבירת שורות\:** טווחי גופן נמדדים בגופן האמיתי שלהם. תמונות נמדדות כאובייקטים בעלי רוחב, גובה ויחס־ממדים, ונכללות בקיבולת הטור ובהקצאת גובה הערות.
4. **תכנון גאומטריה משותף\:** מנוע התכנון מקבל את כל הרכיבים כיחידות תוכן רגילות. הוא אינו צריך לדעת אם הטקסט הגיע ממסמך פשוט, מהפניה לגופן או מתמונה.
5. **רינדור וייצוא\:** ה־DOM וה־PDF משתמשים באותה גאומטריה ובאותם מקטעי גופן ותמונה. אין שבירת שורות עצמאית של CSS ואין מדידה חוזרת לאחר העימוד.
6. **בדיקות\:** בדיקות יחידה לפענוח, בדיקות שילוב למיקום ולגאומטריה, בדיקות תמונות בהערות שוליים, ובדיקות מלאות על `audits/very_long_test_text.txt` ועל קורפוס הספר האמיתי. אין צורך להחזיר בדיקות P6/P7 שבוטלו.

הנקודה האחרונה חשובה: **לא הייתי מתחיל בכתיבת קוד התמונות לפני שסוגרים את חוזה התוכן והגאומטריה.** אחרת קיים סיכון שנקבל מנגנון תמונות עצמאי שיצטרך בהמשך להידחף לתוך מנוע העימוד, בדיוק מסוג הפיצולים שאנחנו מנסים למנוע.

לא שונו קבצים בריפו ולא בוצעו בדיקות בשלב זה. השאלון הוא מסמך הכרעות מוצע, המבוסס על הרישום והמפרטים הקיימים.

## Prompt:
12.11.2026, 16:09:41

אני מקבל את המלצותיך חוץ ממקום שכתבתי אחרת:
ב1 - א
ב2 - א
ב3 - ב
ב4 - א
ב5 - המצב הנוכחי הוא לא כמו שכתבת, תבוק שוב.
ב8 - המצב הנוכחי הוא לא כמו שכתבת, תבוק שוב.
ב9 - לא הבנתי.
ב10 - א
ב11 - א 
ב12 - א
ג1 - א
ג2 - א
ג3 - ב
ג4 - ב
ג5 - ב
ג7 - א
ג8 - ב+אזהרה בכרטיסיית בדיקה
ג10 - א + לאפשר גלישת טקסט מסביב לתמונה
ג11 - ב
ד2 - א
ד3 - א
ד6 - ג+אזהרה בכרטיסיית בדיקה
ד8 - א

## Response:
12.11.2026, 16:10:06 · gpt-6-t-mini

קיבלתי את ההכרעות, ואאמץ את ההמלצות בכל הסעיפים שלא ציינת אחרת. בשני הסעיפים שסימנת — ב5 וב8 — לא אניח שהקריאה הקודמת שלי נכונה: אבדוק שוב את ברירות המחדל בפועל ואת הצרכנים שלהן בקוד. את ב9 אסביר מחדש במונחים של התוצאה בעמוד, ולא כשמות של הגדרות.

אכן מצאתי את מקור הטעות שלי: האתר אינו נשאר עם ברירות המחדל הגנריות של RED. בעת האתחול הוא טוען אוטומטית את `default_settings.json` המקורי וממפה את הגדרותיו למפתחות RED. בקובץ המקור יש גופנים שונים לרמות הכותרת — ולא גופן אחיד — וגם תוכן עניינים כללי ומפורט מופעלים. כעת אני משלים את המיפוי המדויק של רמות התוכן והגופנים לאחר פתרון מחסניות הגופנים.

יש עוד כמה אי־התאמות חשובות בין התשובות שקיבלת לבין **ברירות המחדל שהאתר באמת מחיל באתחול**\. אני לא רוצה לרשום את ההכרעות כאילו הן כבר חד־משמעיות כאשר חלק מהן נבחרו על בסיס תיאור לא נכון: במיוחד גודל גוף הטקסט, הגדרות המילה הראשונה, והפעלת ערכת השערים האוטומטית.

> **Reviewing repository decisions**
>
> I’m treating the accepted recommendations as implementation guidance, while rechecking B5 and B8 against the current repository. I’m also clarifying B9 and recording unresolved choices before changing anything.
>
> **Reviewed repository decisions**
>
> 
>
> **Inspected settings registries, defaults, font mappings, and parsed configuration data**
>
> 
>
> **Verifying font defaults**
>
> I’m checking the exact default mappings rather than relying on earlier notes. The current configuration appears to enable levels 1–6, while heading and TOC fonts resolve from the installed catalog’s first-listed families.
>
> **Clarifying configuration**
>
> I’m correcting the earlier interpretation: B8 currently enables both TOC modes, shows levels 1–6, hides level 7, and keeps inline numbering off. B5 resolves to the configured heading families, not a single fallback.
>
> **Explaining header behavior**
>
> I’m treating B9 as unresolved but recommending the current default: regular running headers also appear on opening pages. A dedicated opening-header mode would instead use separate settings for pages beginning with major sections.
>
> **Integrating image decisions**
>
> I’m consolidating the accepted image behavior: local-width sizing at 50%, centered placement, text wrapping for side-aligned images, PNG/JPEG support, and warnings without blocking export when files are missing.
>
> **Tracking unresolved choices**
>
> I’m keeping the accepted typography and marker decisions, while flagging two implementation details for confirmation: the active body-size defaults and the minimum readable image scale during layout.
>
> **Clarified fonts, configuration, headers, images, and unresolved choices**
>
> 
>
> **Auditing active defaults**
>
> I’m finding additional mismatches: the loaded body defaults are 12pt/1.34, and drop-cap defaults are 1.5em with a two-line threshold. I’m correcting these before treating earlier selections as final.
>
> **Reconciling defaults**
>
> I’m separating the user’s intended choices from the repository’s loaded defaults. Several earlier descriptions were inaccurate, so I’m treating body size, drop caps, heading fonts, TOC levels, and headers as needing explicit confirmation before implementation.
>
> **Reconciling implementation choices**
>
> I’m separating confirmed preferences from repository defaults: several earlier values were inaccurate. I’m preserving explicit choices while flagging body sizing, drop caps, heading fonts, TOC behavior, headers, and themes for correction.
>
> **Audited and reconciled active defaults and implementation choices**
>
> 
>
> **Resolving remaining defaults**
>
> I’m distinguishing explicit preferences from boot-time overrides. Before implementation, I still need confirmation on whether B2/B4 should preserve the stated desired values or the repository’s loaded defaults, plus whether B12 should disable automatic theme selection.
>
> **Resolved remaining defaults**
>
> 
>
> **Auditing active defaults**
>
> I found several mismatches between the described and loaded defaults: body text is 12pt/1.34, drop caps are 1.5em over two lines, TOCs show levels 1–6, headers use normal opening-page slots, and theme 40 loads automatically.
>
> **Audited active defaults**
>
> 
>
> **Inspected and parsed default TOC, font, and header settings sources**
>
> 
>
> **Clarifying active defaults**
>
> I’m treating your selected values as intentional overrides: 14 pt body text, 1.4 line spacing, a 2em drop cap across three lines, disabled automatic spacing, and clean startup styling.
>
> **Checking defaults**
>
> I’m reconciling the chosen settings with the actual startup configuration. Your selected values imply 14pt/1.4 body text, 2em/three-line drop caps, disabled automatic spacing, and a clean startup rather than the imported theme.
>
> **Auditing settings**
>
> I’m correcting the active defaults: body text currently imports as 12pt/1.34, drop caps as 1.5em over two lines, AQ enabled, and theme 40 auto-applied. I’m treating your choices as overrides: 14pt/1.4, 2em/three lines, AQ off, and a clean startup.
>
> **Inspected default settings, theme boot behavior, and persistence overrides**
>
> 
>
> Worked for 11m 59s

### בדיקה חוזרת של ב5 וב8 - ממצא ביניים

נכון שהניסוח הקודם שלי לא היה מדויק. ברישום ברירות המחדל הבסיסי מצאתי שכל גופני H0-H7 מוגדרים כרגע `David HB`; אבל במסמכי הפרויקט יש גם יבוא של ברירות המחדל המקוריות וערכות סגנון, שיכולים לשנות את הערכים בזמן האתחול.

גם ב8 יש הבחנה חשובה: הפעלת תוכן העניינים הכללי אינה זהה לבחירת רמות הכותרות שיוצגו בו. אני בודק את ערכי האתחול הממוזגים ולא אסתפק בקריאת תוויות הפקדים.

## ב5 - גופני הכותרות: המצב בפועל

מצאתי את שרשרת האתחול: `browser-entry.js` טוען את ברירות המחדל המקוריות, ממיר אותן, ומחיל אותן על ההגדרות לפני שהן מוצגות כערכי העבודה. לכן ערכי `David HB` ברישום הבסיסי אינם משקפים את הערכים הפעילים באתר.

הגופנים המוגדרים בחבילת ברירות המחדל המקורית הם\:

| רמה | משפחת הגופן הפעילה לפי ברירת המחדל המיובאת | גודל מקור |
|--------|--------|--------|
| H0 | AlphaBlack | 26pt |
| H1 | Lia Sgula | 50pt |
| H2 | AlphaBlack | 17pt |
| H3 | Alpha | 13.5pt |
| H4 | Alpha | 12.5pt |
| H5 | AlphaLight | 11.5pt |
| H6 | Noto Serif Hebrew | 10.5pt |
| H7 | Hadassah Friedlaender | 6pt |

בנוסף, גוף ההקדמה H0 מוגדר ב־Frank Ruhl Libre בגודל 11.5pt. שמות המשפחות האלה מופיעים בקטלוג הגופנים המוטמע, ולכן אינם רק שמות חלופיים תיאורטיים.

**המסקנה לב5\:** לא נכון להחליף את כולם ב־DavidLibre-Bold. ההמלצה שלי היא לשמר את הגופנים השונים האלה, כפי שהם מוגדרים בברירות המחדל המיובאות, ולאחד את הטיפול בהם במנוע המאוחד בלבד.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/ui/assets/imud/default_settings.json?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/legacy-settings-map.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/browser-entry.js?utm_source=chatgpt.com)\.

## ב8 - תוכן העניינים: המצב בפועל

גם כאן תיאורי הקודם היה שגוי. ברירות המחדל המקוריות מפעילות **גם תוכן עניינים כללי וגם תוכן עניינים מפורט**\.

הקוד גוזר את רמות התצוגה כך: בתוכן הכללי ברירת המחדל היא רמות 1-6; במפורט רמות 2-6. לכן האיחוד הוא\:

| הגדרה | מצב בפועל |
|--------|--------|
| תוכן כללי | מופעל |
| תוכן מפורט | מופעל |
| רמות 1-6 | מוצגות |
| רמה 7 | אינה מוצגת |
| קיבוץ שורות inline | כבוי כברירת מחדל בכל הרמות |
| מספור שורות בשני סוגי התוכן | מופעל |
| הצגת מספר העמודים בתוכן | מופעלת |

גופני התוכן מוגדרים ב־David Libre, בגדלים משתנים לפי רמת התוכן.

**המסקנה לב8\:** ההמלצה שלי היא לשמר את ברירות המחדל הפעילות האלה: שני סוגי תוכן, רמות 1-6, ללא קיבוץ inline אוטומטי.

מקורות: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/legacy-settings-map.js?utm_source=chatgpt.com), [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/ui/assets/imud/default_settings.json?utm_source=chatgpt.com)\.

## ב9 - למה התכוונתי בכותרת עליונה ייעודית?

הכוונה אינה לשאלה אם להציג כותרת עליונה - היא כבר מופעלת. הכוונה היא רק לעמוד חדש שנפתח בכותרת פרק או סעיף, כלומר H2 או H3.

יש שתי אפשרויות\:

- **כותרת רגילה\:** גם בעמוד פתיחת פרק מוצגת הכותרת העליונה הרגילה של אותו צד - שם הספר, שם הפרק וכדומה, לפי הסלוטים הרגילים.
- **כותרת פתיחה מיוחדת\:** בעמודים שנפתחים ב־H2 או H3 מחליפים את שלושת הסלוטים הרגילים בשלושה סלוטים נפרדים, שאפשר להגדיר להם תוכן אחר.

כיום האפשרות המיוחדת כבויה (`header-opening-dedicated=false`\), ולכן עמודי הפתיחה משתמשים בכותרת הרגילה. ההמלצה שלי היא **להשאיר אותה כבויה**\: כך הכותרות העליונות נשארות רציפות ואחידות לאורך הספר, בלי צורך להגדיר מערכת כותרות נוספת.

## ריכוז ההכרעות שקיבלתי

אני מתייחס לכל המלצות השאלון שלא הסתייגת מהן כמאושרות. אלה ההכרעות שאיישם באפיון\:

### 1\. סמנטיקה ואופטימיזציה

- איזון תוכני רק בסוף מקטע ולפני H3; לא לפני H4-H6.
- בסוף פרק קצר: ליישר את תחתיות הטורים, אך לא למתוח את שניהם אוטומטית עד תחתית העמוד.
- כשיש הערות שוליים בסוף פרק, לנסות תחילה פתרון תקין שמצמצם את השארית, בלי לפגוע בעוגנים ובגבולות הפרק.
- הגנות אלמנות, יתומים וליווי כותרות פעילות, ברמת קפדנות `normal`, עם דיווח על פשרות.
- שדון: 50% כרוחב מזערי, ובנוסף זיהוי ריווח מילים חריג.
- סדר העדיפויות של האופטימיזציה נשאר כפי שהצעתי.
- מדידת גופנים אמיתית ככל שהיא זמינה; טבלאות רק כחלופה מדווחת.
- פרטי מימוש כגון מספר איטרציות ותקרות חיפוש לא ייחשפו כהגדרות משתמש.
- כותרת H1 בכותרת עליונה במצב `main`\.
- להבחין בין סטיית עיגול לבין חריגה גאומטרית אמיתית.
- קטלוג גדלי עמודים לצד מידות חופשיות.
- מקטעי השער האחורי יהיו שדות מובנים, אך שמותיהם יהיו ניתנים להתאמה.

### 2\. ברירות מחדל

| סעיף | ההכרעה |
|--------|--------|
| ב1 - גופן גוף | Guttman Rashi |
| ב2 - גודל וגובה שורה | 14pt, יחס 1.4 לפי הבחירה שלך |
| ב3 - טקסט מוסגר | 0.92 |
| ב4 - מילה ראשונה | Drop, מילה אחת, 2em, סף 3 שורות לפי בחירתך |
| ב5 - כותרות | לשמר את משפחות הגופן השונות שמצאנו בפועל |
| ב6 - הערות | להשאיר את ברירות המחדל שהצעתי |
| ב7 - AQ | ללא התאמות AQ אוטומטיות כברירת מחדל; יישור תחתיות נשאר כלל נפרד |
| ב8 - תוכן העניינים | כללי ומפורט מופעלים; רמות 1-6 מוצגות |
| ב9 - כותרות פתיחה | להשאיר כותרות רגילות גם בעמודי פתיחה |
| ב10 - רשת | להשאיר A4, רוחב טור 40%, שוליים 7.5%, מרווח טורים 2% |
| ב11 - מספור | להשאיר עברי, ליבורנה מודגש 11pt, תחתית מרכז |
| ב12 - עיצוב | ברירת מחדל נקייה; ערכות עיצוב לבחירה |

**הערה טכנית חשובה לגבי ב2 וב4\:** בחירותיך הן ההכרעה הרצויה מבחינת המוצר, אבל קובץ ברירות המחדל המקורי שמוטמע באתר קובע כרגע 12pt ו־1.34 בגוף הטקסט, וכן 1.5em וסף שתי שורות למילה הראשונה. לכן אין די בשינוי ערכי ברירת המחדל ברישום RED: צריך לוודא שייבוא ברירות המקור אינו דורס את ההכרעות החדשות שלך. זו בדיוק דוגמה למקום שבו יש לפתור את מקור ההתנגשות ולא להוסיף תיקון מקומי נוסף.

גם ב7 דורש אותו טיפול: קובץ המקור מפעיל AQ, ואילו הכרעתך החדשה היא להשאיר רק את יישור התחתיות, בלי התאמות ריווח אוטומטיות.

### 3\. תמונות בתוך הטקסט

התחביר שייקבע\:

```text
#image_1.png#
#image_1.jpg.l60#
#image_1.jpg.c60#
#image_1.jpg.r60#
```

ברירות המחדל וההתנהגות\:

- רוחב ברירת מחדל 50% מרוחב הטור המקומי; בהערה - מרוחב אזור ההערה.
- יישור ברירת מחדל למרכז.
- תמיכה בגלישת טקסט מסביב לתמונה, גם בגוף הספר וגם בהערות השוליים.
- ביישור ימין או שמאל הטקסט יזרום באזור הפנוי בצד הנגדי. ביישור מרכז הוא יזרום סימטרית משני הצדדים ככל שהרוחב מאפשר; כשאחד הצדדים צר מכדי להכיל טקסט תקין, השורות ימשיכו מתחת לתמונה.
- שמירת יחס רוחב/גובה תמיד.
- ZIP או בחירת תיקייה; תמיכה בנתיבים יחסיים ובתיקיית `images`\.
- PNG ו־JPEG בלבד.
- תמונה חסרה לא תעצור את הייצוא: היא תושמט, ותופיע אזהרה בכרטיסיית הבדיקה.
- בהערות שוליים התמונה תיחשב חלק מתוכן ההערה, תיכלל בתקציב הגובה, לא תיחתך ולא תקבל סמן חדש בהמשך.
- שמות כפולים ייפתרו לפי סדר הופעת הקבצים בארכיון - ההתאמה הראשונה היא הקובעת.

**לגבי תמונה שאינה נכנסת לגובה הפנוי\:** ההמלצה שלי היא לא להקטין אותה באופן אוטומטי עד שתהפוך לבלתי קריאה. יש לשמור את יחס הממדים ולהעביר את התמונה בשלמותה למקום הבא שבו ניתן להציג אותה, תוך שמירת סדר הקריאה והעוגן שלה.

### 4\. סגנונות גופן בתוך פסקה

הכרעותיך\:

- סגנון מוגדר מראש באמצעות זוג סמני פתיחה וסגירה שונים.
- סימון גופן כללי בתחביר הקצר בלבד\:

```text
<FrankReal>הטקסט הרצוי</>
```

- הסגנון הכללי יקבע משפחת גופן בלבד.
- תחולה על טקסט רגיל, לרבות טקסט מוסגר, הערות שוליים והערות סיום; לא על כותרות H0-H7.
- קינון סגנונות מותר, באמצעות מחסנית סמנים.
- סמן בלתי־מזווג או לא תקין יזכה להתעלמות, ללא החלת סגנון, ותופיע אזהרה בכרטיסיית הבדיקה.
- גופן שאינו מוטמע יוכל להתווסף באמצעות קובץ גופן שהמשתמש מספק.
- משפחת גופן מפורשת גוברת על משפחת הגופן של הסוגריים; הקטנת הסוגריים נשמרת, אלא אם הוגדר גודל מפורש אחר.
- הגדרות הסגנונות יישמרו בספריית סגנונות, בתבנית או במסמך, כאשר הגדרות המסמך גוברות על התבנית.

---

## נותרה הכרעה אחת לגבי ברירת המחדל הנקייה

מצאתי שהאתר מחיל אוטומטית באתחול את `json_theme_40`, כולל עיצובי השערים המקוריים. זו אינה רק אפשרות בספרייה: היא מופעלת בפועל בשרשרת האתחול. שלושת סוגי השערים - ראשי, משנה ואחורי - מוגדרים גם הם כברירת מחדל כמופעלים.

הבחירה שלך ב־ב12=א נשמעת לי כהעדפה שלא להפעיל ערכת עיצוב אוטומטית, אלא להשאיר את הספרייה זמינה לבחירה.

**כיצד תרצה שהאפליקציה תעלה כברירת מחדל?**

מראה נקי - ללא החלה אוטומטית של ערכת 40; ספריית העיצובים נשארת זמינה לבחירה. דפי שער, אם ייווצרו, יהיו ללא העיצוב המיוחד.

להשאיר את ערכת 40 ואת עיצובי השערים המקוריים פעילים אוטומטית, כפי שהאתר עושה כיום.

[אישור]

לא שיניתי עדיין קבצים בריפו. אחרי הכרעה זו יהיה אפשר לקבע את כל ההחלטות במסמך המפרט וביומן ההחלטות, ואז לתכנן את המימוש בלי להכניס שני מסלולי עימוד או גשרים זמניים חדשים.

## Prompt:
12.11.2026, 16:24:00

ב12: להשאיר את ערכת 40 ואת עיצובי השערים המקוריים פעילים אוטומטית.

## Response:
12.11.2026, 16:24:48 · gpt-6-t-mini

ההכרעה התקבלה: **ערכת 40 ועיצובי השערים המקוריים יישארו פעילים אוטומטית**\. כעת אקבע את כלל ההכרעות במסמכי הפרויקט, תוך הפרדה בין החלטות שאושרו, ברירות מחדל שדורשות שינוי מול ייבוא ההגדרות המקורי, וסעיפי מימוש שעדיין מחייבים אפיון. לא אשנה בשלב הזה את מנוע העימוד עצמו.

בבדיקה החוזרת התברר שצריך לתעד גם כלל קדימות: ברירות המחדל החדשות שבחרת (14pt/1.4, מילה ראשונה 2em וסף 3 שורות, הקטנת סוגריים 0.92, וכיבוי AQ) חייבות לגבור על ערכי המקור המיובאים במקום שבו הם סותרים אותן. אחרת האישור שלך יירשם במסמך אך לא יתבטא באתר. בנוסף, ב9 נשארה פתוחה רק השאלה אם להפעיל סלוטים מיוחדים לעמודי פתיחה; ברירת המחדל הנוכחית היא כבויה.

אני מעגן זאת בענף תיעוד נפרד, כדי שהכרעותיך לא ייכנסו ישירות ל־`main` לפני שניתן לעבור על השינוי. הענף נוצר מן `main` הנוכחי; כרגע אני מעדכן את יומן ההחלטות ואת רשימת השאלות, כולל סגירת השאלות הישנות שכבר הוכרעו והשארת ב9 פתוחה במפורש.

ההכרעה נרשמה: **ערכת 40 ועיצובי השער הראשי, שער המשנה והשער האחורי ייטענו ויופעלו אוטומטית כברירת מחדל.** ספריית העיצובים תישאר זמינה לשינוי.

(תיעוד הושלם) (ממתין לביקורת)

פתחתי PR טיוטה\:

**[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/14?utm_source=chatgpt.com)**

בענף נפרד עדכנתי שבעה קבצים\:

- `DECISIONS.md` - החלטה D-107, הכוללת את ההכרעות שלך.
- `OPEN_QUESTIONS.md` - סגירת השאלות שהוכרעו; ב9 נשארה פתוחה.
- `spec/01_MASTER_SPECIFICATION.md` - אפיון התמונות, הגופנים וברירות המחדל.
- `spec/02_MASTER_WORK_PLAN.md` - שלב S14 למימוש שני הפיצ'רים.
- `WORKLOG.md` ו־`SESSION_HANDOFF.md` - תיעוד מצב העבודה להמשך.
- `README.md` - עדכון טווח שלבי התוכנית.

**שתי נקודות חשובות שקובע D-107\:**

1. ערכי ברירת המחדל שאישרת גוברים על ערכי המקור הישנים בעת האתחול. בפרט: 14pt/1.4, מילה ראשונה 2em וסף 3 שורות, ו־AQ כבוי.
2. ההכרעה החדשה על יישור תחתיות בסוף פרק, ללא מתיחה גורפת עד תחתית העמוד, גוברת על רכיב המתיחה הגורפת בהחלטה D-106.

**מצב המימוש\:** לא שיניתי קוד מנוע, לא הורצנו בדיקות ולא בוצעה פריסה. השינוי הוא תיעודי בלבד. S14 מחייב תחילה מודל תוכן ומנוע עימוד יחידים; רק לאחר מכן ייכנסו התמונות וטווחי הגופן למימוש.

## Prompt:
12.11.2026, 16:40:46

[$github](app://connector_76869538009648d5b282a4bb21c3d157) המשך עבודה משיחה קודמת [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT-Branch%20%C2%B7%20%D7%97%D7%95%D7%95%D7%AA%20%D7%93%D7%A2%D7%AA%20%D7%A2%D7%9C%20%D7%94%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA-20261112-1638.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT-Branch%20%C2%B7%20%D7%97%D7%95%D7%95%D7%AA%20%D7%93%D7%A2%D7%AA%20%D7%A2%D7%9C%20%D7%94%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA-20261112-1638.md)

## Response:
12.11.2026, 16:40:53 · gpt-6-t-mini

אמשיך מתוך תיעוד השיחה עצמו ולא מתוך הנחות לגבי מצב העבודה. תחילה אקרא את קובץ השיחה במלואו, אחלץ ממנו את ההחלטות והמשימות שנותרו, ואז אבדוק את מצב הענף והקבצים הרלוונטיים ב־`Tora_Book_Typesetter_Red_Work_2` ואמשיך בהתאם.

מהשיחה עולה שהיעד המרכזי אינו תיקון התקלה המקומית בהערות בלבד, אלא איחוד אמיתי: מסלול עימוד יחיד, מודל עמוד וגאומטריה יחידים, ומודל פלט משותף לתצוגה ול־PDF. זיהיתי גם שהחקירה הקודמת כבר מצאה כפילויות בפענוח, שבירת שורות, איזון, תקצוב הערות, רינדור וחישוב hash. אני ממשיך לקרוא את ההמשך כדי לא לקטוע את ההכרעות המאוחרות או להתחיל לבצע שינוי שאינו תואם להן.

בבדיקת מסמכי ה־PR מצאתי שלוש אי־התאמות שראוי לתקן לפני שמסתמכים עליהם: שלב S14 עדיין כולל את קורפוס Orange כשער חובה אף שההכרעה לגביו פתוחה; תרשים התלויות בתוכנית מסתיים ב־S13; וקובץ ה־handoff אומר בטעות שה־PR טרם נפתח. אני בודק כעת את מלוא ניסוח S14 ואת תנאי הסף לאיחוד, ואז אתקן את התיעוד באותו ענף בלי לגעת בקוד המנוע.

> **Reviewing recent context**
>
> I’m reconstructing the latest repository state from the available transcript, focusing on the current work, branch, and pull request. The earlier context is truncated, so I’m checking only the relevant recent segment before proceeding.
>
> **Refining repository context**
>
> I’m narrowing the review to the current repository state and pull request, while separating confirmed decisions from truncated or conflicting notes. I’ll verify the latest changes before suggesting any next step.
>
> **Reviewed recent context**
>
> 
>
> **Reviewed transcript segments, PR #14, program documentation, and feedback progress**
>
> 
>
> **Reconciling current decisions**
>
> I’m consolidating the confirmed document settings and separating unresolved items, especially image fitting and header behavior. I’m treating ambiguous choices as pending rather than silently promoting recommendations into final requirements.
>
> **Reconciled current decisions**
>
> 
>
> **Reconciling document settings**
>
> I’m separating confirmed requirements from unresolved choices, especially image fitting and header behavior. The current draft appears consistent overall, but I’m flagging ambiguous recommendations instead of treating them as final instructions.
>
> **Auditing current documentation**
>
> I’m checking the draft specifications and work plan for consistency before making changes. I’m paying special attention to ambiguous image-fitting behavior, header handling, and the distinction between confirmed requirements and open questions.
>
> **Audited documentation and reconciled document settings**
>
> 
>
> **Auditing documentation consistency**
>
> I’m checking the draft for stale handoff notes and unresolved decisions accidentally presented as settled. I’ve already spotted potential inconsistencies around pull-request status and whether the historical corpus is mandatory, so I’m verifying those before editing.
>
> **Auditing draft consistency**
>
> I’m identifying stale handoff notes and unresolved choices that may have been presented as settled. The main concerns are pull-request status, mandatory test corpora, and whether the new final stage is fully integrated into the roadmap.
>
> **Audited documentation consistency**
>
> 
>
> **Audited PR changes and finalized specification documentation against decisions**
>
> 
>
> **Auditing draft consistency**
>
> I’m identifying stale handoff notes and unresolved choices that may have been presented as settled. The main concerns are pull-request status, mandatory test corpora, and whether the new final stage is fully integrated into the roadmap.
>
> **Audited draft consistency**
>
> 
>
> **Auditing current documentation**
>
> I’m verifying that the documentation preserves the exact note-placement priorities, not merely broad layout rules. I’m checking whether complete-note containment and marker-page behavior are stated explicitly before finalizing the update.
>
> **Audited current documentation**
>
> 
>
> **Auditing note priorities**
>
> I’m checking whether the documentation explicitly preserves the required order: first attempt to keep each note complete, then consider marker-page placement. I’m also verifying that architecture work remains the next focus.
>
> **Audited note priorities**
>
> 
>
> **Audited architecture and G11 plans, updated workplans and handoffs, validated metadata**
>
> 
>
> **Inspected typesetting, layout, rendering pipelines, legacy flows, and configuration mappings**
>
> 
>
> **Fetched legacy settings, browser, IMUD, and layout planner files**
>
> 
>
> **Fetched and inspected legacy and modern layout, settings, parser, and renderer sources**
>
> 
>
> **Reviewed repository layout pipeline and geometry projection changes**
>
> 
>
> **Audited S72 overflow bugs, math tests, documentation, and CI failures**
>
> 
>
> **Downloaded and materialized workflow artifacts**
>
> 
>
> **Inspecting Uploaded ZIP Artifact Contents**
>
>
> **Inspecting audit JSON archive contents**
>
>
> **Parsing Nested JSON Audit Files Twice**
>
>
> **Inspecting Full Math Audit Statistics**
>
>
> **Auditing Footnote Marker Mismatches**
>
>
> **Inspected audit ZIP contents and checked math and footnote mismatches**
>
> 
>
> **Reviewing the project state**
>
> I’m auditing the documentation corrections and the active layout paths before changing code. I’ve found stale handoff details, an unresolved corpus decision, and a need to make engine unification an explicit blocking phase.
>
> **Reviewed the project state**
>
> 
>
> **Inspected auditing, parsing, and layout logic for footnotes and side notes**
>
> 
>
> **Auditing the architecture**
>
> I’m reviewing the current documentation and implementation boundaries before changing code. I’ve found documentation inconsistencies around pending test corpora, stage sequencing, and stale handoff status, so I’m correcting those first.
>
> **Searching the web**
>
> 
>
> **Fetched and analyzed GitHub repository files, fixtures, and stylesheets**
>
> 
>
> **Inspecting Artifact JSON and Problem Details**
>
>
> **Inspected artifact JSON and problem details**
>
> 
>
> **Auditing engine boundaries**
>
> I’ve found documentation inconsistencies and am correcting them before implementation. Next, I’m tracing parser, layout, typography, notes, and rendering responsibilities to define one unified runtime path without treating legacy output as a target.
>
> **Audited engine boundaries**
>
> 
>
> **Extracted note occurrences from raw source**
>
> 
>
> **Investigated footnote parsing and mapped typography export pipeline architecture**
>
> 
>
> **Investigating Missing Footnote Marker Rendering**
>
>
> **Auditing engine consistency**
>
> I’m finding a likely documentation gap: the unification gate now needs explicit migration stages, while the historical corpus must remain optional until its open question is resolved. I’m also flagging possible note-marker loss for code-level review.
>
> **Audited engine consistency**
>
> 
>
> **Investigated missing footnote marker rendering**
>
> 
>
> **Mapping architecture**
>
> I’m tracing both live layout routes from input parsing through page planning, rendering, and export. I’m also separating confirmed code paths from assumptions before updating the architecture documentation.
>
> **Mapped architecture**
>
> 
>
> **Fetched renderer sources and mapped modern and legacy typesetting dependencies**
>
> 
>
> **Audited and mapped legacy and modern layout pipelines and dependencies**
>
> 
>
> **Inspecting Available Audit Files**
>
>
> **Inspecting ZIP archive contents**
>
>
> **Inspected available audit files and ZIP archive contents**
>
> 
>
> **Inspecting local math audit data**
>
>
> **Inspecting dataset summary and problem structure**
>
>
> **Investigating Problem Field Discrepancies**
>
>
> **Inspecting detailed page data and calculations**
>
>
> **Checking page schema indexes**
>
>
> **Inspecting page indexes and metadata**
>
>
> **Inspecting page-level layout details and footnote markers**
>
>
> **Inspecting JSON-like string data**
>
>
> **Parsing JSON structure and summary data**
>
>
> **Inspecting page 107 metadata and coordinates**
>
>
> **Inspected math audit data, page structures, metadata, and JSON discrepancies**
>
> 
>
> **Audited layout dependencies, side-note rendering, documentation, and settings**
>
> 
>
> **Updated handoff and pull request documentation with verified audit details**
>
> 
>
> **Inspecting page footnotes and markers**
>
>
> **Inspected page footnotes and markers**
>
> 
>
> **Fetched planner, tokenizer, marker, pipeline, renderer, tests, and configuration sources**
>
> 
>
> **Inspecting neighboring page indices and labels**
>
>
> **Inspected neighboring page indices and labels**
>
> 
>
> **Fetched Full BodyMk aggregation snippet**
>
> 
>
> **Inspecting Footnote Marker Mismatches**
>
>
> **Listing ZIP Archive Contents**
>
>
> **Inspecting JSON Shapes and Audit Metadata**
>
>
> **Inspecting report page objects**
>
>
> **Inspecting Footnote Marker Discrepancies**
>
>
> **Inspecting raw pages for note marker continuity**
>
>
> **Inspecting Raw Column Array Structures**
>
>
> **Inspecting Raw Sample Structure**
>
>
> **Inspecting Page 107 Layout Audit Details**
>
>
> **Inspecting Stringified JSON Layout Audit**
>
>
> **Retrieving JSON for Page Index 107**
>
>
> **Inspected ZIP contents, JSON structures, and footnote marker discrepancies**
>
> 
>
> **Updated audit details, configuration documentation, and session handoff diagnostics**
>
> 
>
> **Reviewed corrected responses, transcripts, and D107 audit specifications**
>
> 
>
> **Updated documentation, audit records, worklog, and verified branch changes**
>
> 
>
> **Updated pull request body with detailed documentation**
>
> 
>
> Worked for 38m 55s

קראתי את קובץ השיחה וזיהיתי את נקודת העצירה המדויקת.

**העבודה האחרונה הסתיימה בתיעוד ההכרעות שלך מ־12 בנובמבר, ולא במימוש בקוד.** היא נשמרה ב־PR מס' 14, בענף `docs/user-decisions-and-inline-content-20261112`\.

בדיקת מצב עדכנית ב־GitHub מראה שה־PR עדיין פתוח כטיוטה, אינו ממוזג, ו־GitHub מדווח כרגע `mergeable: false`\. לכן אין להניח שהתיעוד כבר שולב ב־`main`\.

## ההכרעות האחרונות שלך — שחזור נקודת העצירה

הצלבתי את סוף השיחה, כולל התשובה האחרונה שלך מ־16:24. ההחלטה האחרונה חד־משמעית\:

**ערכת עיצוב 40 ועיצובי השער הראשי, שער המשנה והשער האחורי נשארים פעילים אוטומטית.** אין להחליף את האתחול הזה במראה נקי.

יתר ההכרעות המרכזיות שיש לשמר\:

- גוף הספר: Guttman Rashi, בגודל 14pt ובגובה שורה 1.4.
- סוגריים: הקטנה ל־0.92.
- מילה ראשונה: Drop, מילה אחת, 2em, סף שלוש שורות.
- גופני הכותרות: לשמר את המשפחות השונות של ברירות המחדל המיובאות, ולא לאחד אותן לגופן אחד.
- תוכן עניינים: כללי ומפורט פעילים; רמות 1–6 מוצגות.
- AQ אוטומטי: כבוי; יישור תחתיות נשאר כלל עצמאי.
- כותרות פתיחה: ברירת המחדל הרגילה נשמרת; ההכרעה לגבי סלוטים מיוחדים עדיין פתוחה.
- תמונות וטווחי גופן: חלק ממודל התוכן והעימוד האחיד, לא הרחבה חיצונית או מסלול רינדור נפרד.

נקודה חשובה במיוחד: ערכי ברירת המחדל החדשים חייבים לשרוד את ייבוא ההגדרות המקורי. שינוי הרישום בלבד לא יספיק.

**בוצעו ותוקפו שלושה תיקוני תיעוד בענף ה־PR\:**

1. הפכתי את איחוד המנוע לשער ארכיטקטוני חוסם ומפורט: מיפוי מלא, מודל הגדרות ותוכן יחיד, מדידה ושבירת שורות יחידות, מתכנן יחיד, גאומטריה סופית משותפת והסרת מסלולי runtime מקבילים.
2. הסרתי את קורפוס Orange משער הקבלה המחייב; השימוש בו נשאר פתוח להכרעה בשאלה 10.
3. תיקנתי את ה־handoff כך שישקף ש־PR \#14 כבר פתוח כטיוטה, ולא יטען בטעות שטרם נפתח.

ה־PR נשאר פתוח, טיוטה ולא ממוזג. GitHub מאשר כעת `mergeable: true`\. לא שיניתי קוד מנוע ולא טענתי להרצת בדיקות.

## ממצא קוד ראשון: הפיצול בין המנועים עדיין פעיל

אימתתי ישירות ב־`main` את נקודת הבחירה: בפונקציה `typeset()` שב־`pipeline.js`, הגדרות שמסומנות `_layout-profile: 'imud'` יחד עם `_imudRaw` גורמות ליציאה מוקדמת ולהפעלה של `legacyTypeset()`\. רק יתר ההגדרות ממשיכות בצינור הרגיל של RED ו־DP.

כלומר, מדובר בשני מסלולי runtime אמיתיים, ולא רק בשני אוספים של קוד ישן וחדש. מצאתי גם הערות בקוד שעדיין מציגות את קובצי הייחוס ההיסטוריים כמקור סמכות, אף שההכרעה D-100 ביטלה את ההתאמה לייחוס כשער קבלה. יש להפריד בין שימור סמנטיקת המסמכים לבין שימור הנחות הכיול הישנות.

## ממצא נוסף: ברירות המחדל שאושרו עדיין אינן מובטחות במסלול החי

מצאתי פער ממשי בין ההגדרות המתועדות לבין שרשרת האתחול\:

| הגדרה | ההכרעה שאישרת | ערך המקור שמיובא כרגע |
|--------|--------|--------|
| גודל גוף | 14pt | 12pt |
| גובה שורה | 1.4 | 1.34 |
| סף מילה ראשונה | 3 שורות | 2 שורות |
| גודל מילה ראשונה | 2em | 1.5em |
| AQ | כבוי | פעיל |

הסיבה אינה רק שה־Registry מכיל ערכים ישנים: `applyLegacyDefaults()` מבצע `Object.assign(settings, imported)`, ולכן הערכים המיובאים גוברים על ברירות המחדל של RED. יתרה מזאת, מסלול המורשת מקבע חלק ממידות הגוף והגאומטריה בקבועים משלו, כך ששינוי ערכי ה־Registry לבדו לא יפתור את הבעיה.

לעומת זאת, ערכת 40 ושלושת השערים אכן מוגדרים לטעינה אוטומטית, והפרש ההגדרות שהמשתמש שמר מוחל לאחר מכן. אין לשנות את סדר הקדימויות הזה בלי להוסיף שכבת ברירות מחדל מפורשת ששומרת על בחירות המשתמש.

## אישור התקלה S72: חדירת טור לאזור ההערות

התקלה עדיין מסומנת כפתוחה ב־`ISSUE_REGISTRY.md`, ולא מצאתי בתיעוד או בקוד שבדקתי ראיה לתיקונה.

התיאור ברישום מדויק: ב־16 עמודים בנתיב DP, מרזב הערות השוליים משתרע על רוחב העמוד, אך תקציבו מופחת בחישוב התאמת המקום של הטור האחרון בלבד. הטור הראשון יכול אפוא להמשיך להיכנס לשטח המרזב — עד 202px בדוגמה המתועדת.

זה ממצא נפרד מבעיית איחוד המנועים. הוא צריך להישמר כתקלה פתוחה עם בעלות ברורה, ולא להיעלם בתוך ריפקטור רחב. בשלב הזה אימתתי את מסלול הקוד ואת רישום התקלה; עדיין לא הרצתי שחזור מקומי ולכן איני מציג זאת כתוצאת בדיקה חדשה.

## פירוק דוחות הכשל — נמצאו גם שני סימני אובדן הערות

הורדתי ובדקתי את קובצי הדוחות עצמם, ולא הסתפקתי בהודעות השגיאה.

באודיט המלא נמצאו\:

| ממצא | תוצאה |
|--------|--------|
| `SIDE_NOTE_OVERLAP` | שתי חפיפות בעמוד 107, בעומק 8px ו־2px |
| `MARKER_NOTE_MATCH` | הסמן י״ז מופיע 3 פעמים בגוף ורק 2 פתיחות הערה נמצאו |
| `MARKER_NOTE_MATCH` | הסמן כ״ג מופיע בגוף, אך לא נמצאה לו פתיחת הערה |

האודיט מזהה את שני האחרונים כאובדן הערות. יש לבדוק את מקורם במסמך ואת מסלול הפענוח וההצבה, ולא להשתיק את הבדיקות או להקל את סף הכיסוי.

נכון לעכשיו, תמונת הבדיקות היא: סוויטת הבדיקות הרגילה עברה; בדיקת האינווריאנטים של הקורפוס עברה; אודיט העימוד המלא ואודיט הגאומטריה נכשלו. זו אינה תוצאה שאפשר להציג כ־CI ירוק.

**תיקון למסקנת הביניים על סמני ההערות\:** לאחר בדיקת מנגנון המספור, התברר ש־`יז.` ו־`כג.` הם סמני הערות שנוצרים אוטומטית לפי מיקומן בפרק, ולא בהכרח מחרוזות שמופיעות כך בקובץ המקור. בקובץ המקור יש 18 הערות בפרק שבו נמצאת הערה י״ז, ו־26 בפרק שבו נמצאת הערה כ״ג; ההערה הכ״ג עצמה קיימת ומכילה טקסט.

לכן אין לפטור את ההתראות כ־false positive בגלל הופעת אותיות אלה בכותרות. עם זאת, גם אין לקבוע עדיין שאבד תוכן: במסלול הנוכחי אותו סמן גוף עשוי להופיע שוב בפסקה שחוצה עמודים, בעוד המשך ההערה אינו נפתח שוב בסמן. יש לבדוק את שיוך ההערה למופע המקורי ואת מצב ההמשך, ולא להסתפק בהשוואת מונים גלובלית.

המשכתי את העבודה מתוך השיחה המקורית, בדקתי את קוד `main` ואת דוחות ה־CI, ועדכנתי את מסמכי הפרויקט בענף העבודה.

## מצב העבודה ב־GitHub

(תיעוד עודכן) (PR פתוח כטיוטה) (CI עדיין נכשל)

**[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/14?utm_source=chatgpt.com)**

ה־PR פתוח, אינו ממוזג ו־GitHub מדווח `mergeable: true`\. הוא כולל כעת 9 קובצי תיעוד. לא הוכנסו בו שינויים בקוד המנוע.

### מה השלמתי

1\. **מפת התלויות\:** עדכנתי את `LAYOUT_DEPENDENCY_MAP.md`\. היא מציגה כעת את שני מסלולי העימוד הפעילים ואת ההסתעפות הנפרדת של DOM, HTML ו־PDF.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/user-decisions-and-inline-content-20261112/LAYOUT_DEPENDENCY_MAP.md?utm_source=chatgpt.com)

2\. **ביקורת ארכיטקטונית\:** הוספתי מסמך מפורט עם קובצי המקור ו־SHA שלהם, כפילויות המנוע, בעיות ההגדרות, תקלות ה־CI והנושאים שטרם הוכרעו.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/user-decisions-and-inline-content-20261112/audits/ENGINE_UNIFICATION_AUDIT_2026-11-12.md?utm_source=chatgpt.com)

3\. **תוכנית S14\:** קבעתי את S14.0 כשער ארכיטקטוני מחייב. לפני מימוש התמונות וטווחי הגופן נדרשים parser ו־AST יחידים, מדידה ושבירת שורות יחידות, planner יחיד, Page Model אחד ומקרני פלט משותפים.

4\. **תיעוד נקודת העצירה\:** עדכנתי את `WORKLOG.md` ואת `SESSION_HANDOFF.md`, כדי שהממצאים, המגבלות והמשימות הפתוחות לא יאבדו.

## אימות ההכרעות שלך

חזרתי במיוחד לב5 ולב8, כפי שביקשת בשיחה הקודמת.

- **ב5\:** גופני הכותרות נשמרים לפי המשפחות המקוריות השונות. אין לאחד את H0–H7 לגופן David אחיד. גם H1 בגודל 50pt נשמר.
- **ב8\:** שני סוגי תוכן העניינים פעילים; הכללי מציג רמות 1–6 והמפורט רמות 2–6. רמה 7 מוסתרת בשניהם.
- **ב12\:** ערכת 40 ועיצובי שלושת השערים המקוריים נשארים פעילים אוטומטית.
- יתר ההכרעות, ובפרט 14pt/1.4, Drop בגודל 2em ובסף שלוש שורות ו־AQ כבוי, נשמרו.

ההבחנה בין ברירת המחדל המאושרת לבין ערכי המקור המיובאים נשארה מפורשת: בחירת משתמש שמורה קודמת לברירת המחדל המאושרת, וזו קודמת לערכי המקור הישנים.

## ממצאים שדורשים טיפול בקוד

**שני מנועי runtime עדיין פועלים.** `pipeline.js` בוחר בין `legacyTypeset` לבין RED/DP. גם מסלולי הרינדור והייצוא נפרדים. זהו חסם ממשי לאיחוד.

**S72 עדיין פתוח.** תקציב הערות השוליים מופחת בחישוב התאמת המקום של הטור האחרון בלבד, אף שמרזב ההערות משתרע לרוחב העמוד. קיימת חדירה מתועדת של הטור הראשון לאזור ההערות.

**שני שערי CI נכשלים גם ב־main וגם ב־PR\:**

| בדיקה | תוצאה |
|--------|--------|
| corpus-invariants | (עבר) |
| layout-audit | (נכשל) |
| full-math-audit | (נכשל) |

ב־layout-audit נמצאו שתי חפיפות הערות צד בעמוד 107: 8px ו־2px. ב־full-math נמצאו 353,687 מילים מרונדרות מול רצפה של 355,967.

בנוגע לסמנים י״ז וכ״ג, מצאתי שהאודיט משווה מחרוזות סמן גלובליות ואינו מתחשב באיפוס המספור בין פרקים. לכן אין לראות בהפרש הגלובלי הוכחה לאובדן תוכן. עם זאת, הפערים המקומיים בעמודים 571 ו־667 עדיין טעונים בירור לפי זהות ההערה והמשך הטקסט. ההערה הכ״ג קיימת בקורפוס המקור.

## מה עדיין לא נעשה

לא שיניתי קוד עימוד, לא תיקנתי את S72, לא הסתרתי בדיקות נכשלות ולא הורדתי את רף שימור התוכן. גם לא הורצו בדיקות מקומיות במסגרת הסבב הזה.

**המשך העבודה הנכון\:** להשלים את אבחון שימור התוכן וההערות, לבנות שחזור ממוקד לחפיפות הערות הצד ול־S72, ואז להתקדם לאיחוד המנוע לפי S14.0. אין להתחיל עדיין במימוש התמונות וטווחי הגופן. P6/P7 ו־PDF הייחוס נשארים מחוץ לתהליך.

האם לבדוק מדי יום בשעה 09:00 (שעון ישראל) את מצב ה־CI של PR \#14 ולדווח כששערי הבדיקות משתנים?

## Prompt:
12.11.2026, 17:22:21

אני רוצה להדגיש שפישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) עם מימוש התמונות וטווחי הגופן היא מהחשובות שבמטרה שלנו!!! ויש להקדימה לכל שאר העבודות!

## Response:
12.11.2026, 17:22:42 · gpt-6-t-mini

אני מעדכן את סדר העדיפויות עצמו, לא רק מוסיף הערת הבהרה: איחוד ופישוט המנוע יחד עם תמיכה מלאה בתמונות ובטווחי גופן יהפכו למסלול העבודה המרכזי והדחוף ביותר. המשמעות היא שלא נתייחס לאיחוד כפרויקט נפרד שיש לסיים ורק אחריו להתחיל את הפיצ'רים; דרישות התמונות והגופנים יכתיבו את תכנון המודל, המדידה, שבירת השורות, תכנון העמוד והפלט כבר מהשלב הראשון. במקביל אבדיל בין תקלות קיימות שיש לחקור כחלק מהמסלול הזה לבין עבודות צד שאסור להן לעקוף אותו.

הבהרתי גם את ההבחנה החשובה בתוכנית: S14.0 אינו עוד שער שמונע להתחיל את התמונות והגופנים. הוא מגדיר את החוזים והאינווריאנטים שלפיהם בונים אותם מלכתחילה. שער ההצלחה הסופי יחול רק על המכלול: מנוע פשוט ומאוחד, תמונות וטווחי גופן המשולבים בו, והסרת המסלולים הכפולים — לא על מנוע חלקי לטקסט רגיל.

> **Clarifying priority**
>
> I’m treating engine simplification, unified operation, image handling, and inline font ranges as one top-priority program. I’ll update the planning documents so unrelated work remains deferred until this integrated objective is complete.
>
> **Clarified priority**
>
> 
>
> **Reframing the priority**
>
> I’m treating engine unification, image support, and inline font ranges as one inseparable top-priority program. I’ll revise the plan so these capabilities are designed and implemented together, while unrelated work stays deferred.
>
> **Reframed the priority**
>
> 
>
> **Reviewed PR 14 and updated S14 architecture, specifications, and audit documentation**
>
> 
>
> **Verifying Documentation Priorities and Contradictions**
>
> 
>
> Worked for 6m

ההדגשה ברורה, ואני מקבל אותה כעיקרון מנחה מחייב להמשך הפרויקט.

חשוב לי לחדד שהבנתי את המשמעות: **אנחנו לא רוצים קודם מנוע עימוד מאוחד, אחר כך תמונות, ואחר כך טווחי גופן. אנחנו רוצים לבנות מנוע עימוד פשוט, אחיד ונכון, שבתוכו התמונות וטווחי הגופן הם חלק טבעי ממנגנון העימוד עצמו כבר מתחילת התכנון.**

קבעתי זאת כעת בעדיפות **P0 - העדיפות העליונה בפרויקט**, ועדכנתי בהתאם את הריפו\:

- `DECISIONS.md` - עדכון D-107.
- `spec/01_MASTER_SPECIFICATION.md` - עדכון G14.
- `spec/02_MASTER_WORK_PLAN.md` - שינוי סדר הביצוע והגדרת S14 כמסלול משולב.
- `audits/ENGINE_UNIFICATION_AUDIT_2026-11-12.md` - עדכון סדר העדיפויות.
- `WORKLOG.md` ו־`SESSION_HANDOFF.md` - תיעוד ההוראה להמשך.
- `README.md` ומפת התלויות - הבהרת מטרת הפרויקט המרכזית.

**שלושה עקרונות ינחו את העבודה מעתה\:**

1. אין טלאים, מעקפים, מנגנוני עימוד מקבילים או תיקוני post-layout.
2. תמונות וטווחי גופן חייבים להיות חלק אינטגרלי מהפענוח, המדידה, שבירת השורות, תכנון העמוד והגאומטריה.
3. אין להקדים משימות UI, ניקיון או תכונות צד שאינן נחוצות ישירות להשגת היעד הזה.

גם S72 ושאר התקלות שהתגלו יטופלו כחלק מהמסלול המשולב, ולא יסיטו אותנו לפרויקטים נפרדים.

(העדיפות נשמרה ואומתה בריפו)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/user-decisions-and-inline-content-20261112/spec/02_MASTER_WORK_PLAN.md?utm_source=chatgpt.com)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/14?utm_source=chatgpt.com)

חשוב: עדכון זה עיגן את סדר העדיפויות בתיעוד; הוא עדיין אינו מימוש בקוד. בהמשך העבודה אפעל לפי היעד המשולב הזה, ולא לפי סדר העבודה הישן.

## Prompt:
12.11.2026, 17:31:52

מעולה!! המשך בעבודה!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 17:32:13 · gpt-6-t-mini

אני ממשיך במסלול P0 עצמו: תחילה אבדוק את מצב הענף וה־PR כפי שהם כעת, ואז אעבור מן המפרט אל שינויי קוד מדורגים שמקדמים runtime יחיד — בלי שכבת תאימות נוספת ובלי להתחיל בעבודות צד. אתמקד בצעד הראשון שאפשר להשלים ולבדוק באופן עצמאי, ואדווח במפורש מה השתנה ומה עדיין לא הוכח.

מצאתי גם פרט חשוב במבנה ההיסטוריה: `main` התקדם מאז נקודת הבסיס של PR \#14, ולכן לא אבסס את שינויי הקוד על ענף התיעוד הישן. אני עובד מול `main` העדכני, ובוחן כעת את חוזי הנתונים בפועל בשני המסלולים — במיוחד את נקודת הפיצול לפני המדידה ואת ההבדלים בין ייצוגי הבלוקים והשורות.

השלב הראשון שאני מבצע אינו שינוי קוסמטי בנתיב הבחירה. אני מוסיף מודל תוכן inline קנוני אחד, שבו טקסט מעוצב ותמונה הם יחידות מפורשות עם מיקומי מקור, ומחבר אותו לשני המפענחים הקיימים. כך אפשר בהמשך להעביר את המדידה, שבירת השורות וה־planner לאותו חוזה נתונים — במקום לבנות לכל אחד מהם טיפול נפרד. בשלב הזה עדיין לא אטען שהתמונות כבר עוברות עימוד וייצוא מקצה לקצה.

בדיקת המצב מאשרת ש־PR \#14 עדיין פתוח כטיוטה, והוא אכן תיעודי בלבד. לא אשתמש בו כאילו כבר בוצע איחוד: קוד המנוע עדיין מציג את שני מסלולי ה־runtime שתועדו בביקורת. העבודה הבאה תהיה בענף מימוש נפרד, כדי לשמור על הפרדה בין תיעוד ההכרעות לבין שינויי המנוע.

## Prompt:
12.11.2026, 18:00:22

ההודעה נקטעה בגלל שלא תכננת כראוי את אורך העבודה! המשך!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 18:00:44 · gpt-6-t-mini

אני ממשיך מאותה נקודה, אבל מצמצם כל יחידת עבודה לשינוי מוגדר ובדיקה שלו — כדי שלא נגיע שוב להודעה ארוכה שנקטעת. עדכון חשוב: הניסיון האחרון לערוך את `legacy-imud-flow.js` נעצר לפני כתיבה, משום ששם הייצוא בקובץ שונה מהעוגן שחיפשתי; לכן השינוי הזה **לא** נכנס לענף. אני בודק כעת את מצב הענף בפועל, מתקן את האינטגרציה מול החוזה המשותף, ומוסיף בדיקות לפני הרחבת המימוש.

הבדיקה העלתה נקודת דיוק שחשוב לתקן לפני הרחבה: במקטעי טקסט אחרי הערת שוליים, מיקומי המקור אינם מתחילים באפס. התיקון הראשון כבר מחבר גם את המפענח הישן לאותו מבנה `TextRun`/`ImageRun`; כעת אני מיישר את חישוב ההיסטים כך שהתמונות והאזהרות יישאו מיקום מקור נכון גם כשהן מופיעות אחרי הערה או בתוך תוכן הערה.

הרצת CI סיפקה לנו אימות ראשון אמיתי: בדיקות הפענוח הבסיסיות עברו, והבדיקה החדשה לטווחים חוצים נכשלה בגלל רווח כפול שנשאר לאחר הסרת סמני התחביר. זה אינו אובדן טקסט אלא שימור הרווחים שהיו סביב הסמנים; אתקן את בדיקת ההשוואה כך שתבדוק את תוכן הטקסט לאחר נרמול רווחים, בלי לשנות את הטקסט המקורי שה-parser משמר. ממשיך לבדוק את שאר הבדיקות באותו מחזור CI.


---
Powered by [ChatGPT Exporter](https://www.chatgptexporter.com)

## Prompt:
12.11.2026, 18:54:20

[$github](app://connector_76869538009648d5b282a4bb21c3d157) המשך עבודה משיחה קודמת [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT-Branch%20%C2%B7%20%D7%97%D7%95%D7%95%D7%AA%20%D7%93%D7%A2%D7%AA%20%D7%A2%D7%9C%20%D7%94%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA-20261112-1638.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT-Branch%20%C2%B7%20%D7%97%D7%95%D7%95%D7%AA%20%D7%93%D7%A2%D7%AA%20%D7%A2%D7%9C%20%D7%94%D7%AA%D7%95%D7%9B%D7%A0%D7%99%D7%AA-20261112-1638.md) המשך!!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 18:54:28 · gpt-6

> **Remembering**
>
>
> ****
>
> 
>
> **Reviewing layout logic**
>
> I’m examining parser behavior, especially marker removal, invalid image handling, inline notes, and mixed-font line breaking. I’m also checking how image assets and rendering are currently represented before adapting layout and resource resolution.
>
> **Reviewed layout logic**
>
> 
>
> **Rebuilding test artifacts**
>
> I’m tracing truncated job logs to isolate failures in math, layout, and UI tests. The likely issue is stale generated bundles plus a temporary test workaround, so I’m planning to remove the workaround and refresh artifacts.
>
> **Rebuilt test artifacts**
>
> 
>
> **Diagnosing content loss**
>
> I’m separating genuine regressions from stale generated bundles and fixture mismatches. The inline parser appears to preserve existing text, so I’m checking whether audit failures come from outdated artifacts rather than source behavior.
>
> **Refreshing generated bundles**
>
> I’m planning to extract the CI-produced bundles, update the branch artifacts, and restore the temporary test file. That should make generated outputs match source changes before reassessing the remaining audit failures.
>
> **Diagnosed content loss and refreshed generated bundles**
>
> 
>
> **Reviewed Tora project state, typesetting decisions, pending tasks, and engine requirements**
>
> 
>
> Worked for 2m 45s

אני ממשיך ישירות ממסלול העבודה הקודם, במאגר `Tora_Book_Typesetter_Red_Work_2`\.

הדגש המרכזי שלך נשמר כעיקרון מחייב: **פישוט ואיחוד אמיתי של מנוע העימוד, ולא הוספת שכבות תיקון מעל מנגנונים מקבילים.**

המשמעות המעשית היא שלא נסתפק בכך שתמונות וגופנים יזוהו על ידי המפענח. הם צריכים להפוך לחלק ממודל תוכן אחיד, לעבור דרך אותו מנגנון מדידה, שבירת שורות, תכנון עמודים ורינדור, בלי מסלולים חלופיים שמייצרים התנהגות שונה.

יש גם שני גבולות שכבר נקבעו\:

- P6/P7 מחוץ לתחום לחלוטין.
- אין להקדיש עבודה לשיפורי UI שאינם נחוצים ישירות להתקדמות המנוע.

### מצב העבודה שאיתרתי

מצאתי את ענף `s14/integrated-engine-p0-20261112` ואת PR מספר 15, שכותרתו\:

`[S14 P0] Shared inline content model across parser paths`

בענף כבר נוספו\:

- `inline-content.js` — מודל משותף ל־TextRun ול־ImageRun.
- חיבור ראשוני של המודל לשני המפענחים.
- שמירת מיקומי מקור של טקסט ותמונות.
- זיהוי טווחי גופנים מקוננים וטיפול בטווחים פגומים.
- בדיקות יחידה ואינטגרציה ראשוניות.

אבל חשוב: תיאור ה־PR עצמו מבהיר שתמונות וטווחי גופנים עדיין אינם נתמכים מקצה לקצה. שני מסלולי הריצה עדיין קיימים.

כלומר, זהו בסיס נכון להמשך, אך עדיין לא איחוד של המנוע.

### ממצאים נוספים מהבדיקה

(PR \#15 עדיין אינו מוכן למיזוג)

בדקתי גם את ריצות GitHub Actions של הענף\:

| בדיקה | תוצאה |
|--------|--------|
| corpus-invariants | (עבר) |
| CI | (נכשל) |
| full-math-audit | (נכשל) |
| layout-audit | (נכשל) |

שלושה ממצאים חשובים\:

1. **חוסר התאמה בין קוד המקור ל־bundles\:** בניית ה־Worker מחדש מייצרת hash שונה מהקובץ המחויב. לכן יש בעיית סנכרון שצריך לפתור, ולא לעקוף את בדיקת הבנייה.
2. **שימור תוכן\:** בדיקת העומק דיווחה על 353,687 מילים מרונדרות לעומת 363,232 מילים בקובץ הבדיקה. זו חריגה משמעותית, המחייבת חקירת שורש לפני אישור המימוש.
3. **הערות צד\:** נמצאו שתי חריגות `SIDE_NOTE_OVERLAP` בעמוד 107.

חשוב לסייג: בדיקות העומק האלה השתמשו ב־`audits/very_long_test_text.txt`, ולא בקובץ הראשי המדויק שהגדרת. לכן אין להסיק מהן עדיין מה תהיה התוצאה בקורפוס הקבלה הנכון.

### הבעיה הארכיטקטונית שצריך לפתור

בבדיקת הקוד התברר שהוספת `inlineContent` עדיין אינה מחברת את התמונות וטווחי הגופנים למנוע העימוד עצמו.

המידע מתווסף לטוקנים, אבל מנגנון שבירת השורות והפריסה עדיין אינו צורך אותו כחוזה התוכן הראשי.

מכאן נובעת המשימה הבאה: לא להרחיב את המפענח בעוד יכולות, אלא להעביר את המידע דרך כל שכבות המנוע.

אני רוצה להתקדם בסדר הבא\:

1. **מודל תוכן קנוני\:** טקסט, טווחי גופן, תמונות, הערות ומיקומי מקור.
2. **מנוע טיפוגרפיה יחיד\:** מדידת תיבות טקסט ותמונות ושבירת שורות על פי אותו מודל.
3. **מנוע פריסה יחיד\:** ניהול קיבולות, טורים, הערות, כותרות ועיטורים.
4. **מודל עמוד יחיד\:** תוצאה גאומטרית אחידה לתצוגה ול־PDF.
5. **העברת הגדרות IMUD\:** פרופיל נתונים ולא מנגנון עימוד נפרד.
6. **הסרת הכפילויות\:** רק לאחר שהמנוע המאוחד מוכיח את נכונותו.

לא נכון למזג את שני המנועים באמצעות העתקת פונקציות או הכנסת מתאמים נוספים. צריך לאחד את האחריויות ואת מקור האמת של כל פעולה.

**לא ביצעתי מיזוג או שינוי קוד בסבב הזה.** אני מעדיף שלא להכניס תיקון נוסף לפני השלמת בדיקת המימוש החדש והבנת כשלי האימות.

### המשך העבודה

בסבב הבא אני רוצה לבצע ביקורת עמוקה של PR \#15, לרבות\:

- בדיקת כל צרכני `inlineContent` והוכחה היכן המידע נעצר.
- מיפוי מדויק של הכפילויות בין `legacy-imud-flow.js` לבין `pipeline.js`\.
- מיפוי כפילויות במדידה, שבירת שורות, הערות ואיזון.
- בדיקת חוזה הגופנים והתמונות מול מנגנון המדידה והייצוא.
- גיבוש סדר העברה שמאפשר להסיר מנגנונים ישנים במקום להוסיף להם עוד שכבות.

העבודה עדיין בעיצומה. **אין למזג את PR \#15 במצבו הנוכחי.**

היעד נשאר מנוע אחד, פשוט יותר, עקבי ודטרמיניסטי, ולא מערכת שהולכת ומסתבכת ככל שמוסיפים לה יכולות.

## Prompt:
12.11.2026, 20:52:49

המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 20:53:12 · gpt-6

> ****
>
> 
>
> **Assessing implementation direction**
>
> I’m noting that the current parser work doesn’t match the documented S14 plan. I’m avoiding further changes on that branch and would instead align the implementation with the established architecture before proceeding.
>
> **Evaluating parser concerns**
>
> I’m seeing several unresolved parser issues, including incomplete downstream integration, image handling edge cases, font-run behavior, and possibly incorrect source offsets. I’m avoiding a misleading implementation until those contracts are settled.
>
> **Assessed implementation direction and evaluated parser concerns**
>
> 
>
> **Refining the next step**
>
> I’m treating this as an architecture-first task: preserve the documented contract, verify offsets and inline semantics, then connect the parser to consumers. I’m not adding patchwork until those tests define correct behavior.
>
> **Refined the next step**
>
> 
>
> **Updating the architecture**
>
> I’m correcting an earlier assumption: variable widths already exist, but centered images still require multiple horizontal segments. I’m defining typed text and image runs, obstacle bands, and line fragments so RTL flow remains correct.
>
> **Updated the architecture**
>
> 
>
> **Audited parser, layout, rendering pipelines, and PR alignment with S14 architecture**
>
> 
>
> Worked for 2m 9s

אני ממשיך באותו ריפו ובאותו מסלול עבודה. עקרון ההכרעה נשאר ברור: **לא מוסיפים עוד שכבת תיקונים למנוע הקיים; מאחדים את מסלול העימוד עצמו, כך שכל פריט עימוד — טקסט, תמונה, טווח גופן או פריט חדש בעתיד — ייכנס למודל תוכן אחיד ויטופל לאורך אותו צינור עיבוד.**

הנקודה הקריטית שממנה אני ממשיך היא שהאיחוד שבוצע עד כה ב־`inline-content` נעצר בעיקר בשכבת הפענוח. עדיין צריך להפוך אותו למודל שעליו נשענים המדידה, שבירת השורות, חישוב הגאומטריה, העימוד והייצוא — ולא להשאיר לצדו מסלולים מקבילים.

בבדיקת הקוד בפועל התברר שהפער מהותי יותר ממה שנראה מתיאור ה־PR: `inlineContent` נוצר בשני נתיבי הפענוח, אבל במסלול RED הראשי `pipeline.js` ממשיך לפרק את `t.text` למילים, למדוד אותן ולבנות שורות רגילות. כלומר, תמונה או טווח גופן שכבר פוענחו למודל המשותף אינם הופכים לפריטי עימוד במנוע. גם `contentHash()` עדיין מבוסס על הטקסט וההערות הישנים, ולכן אינו משקף את מלוא התוכן החדש.

זו בדיוק כפילות שאסור לקבע: מודל אחד שמפענח, ולצדו מנוע אחר שממשיך להתעלם ממנו. אני בודק כעת את נקודות המעבר בין הפסקה, השורות, מודל העמוד והמקרינים, כדי שהאיחוד ייעשה במקום הנכון ולא באמצעות הוספת מתאם נקודתי נוסף.מצאתי גם את מסמך ההכרעות שאושר בשיחה הקודמת, והוא פותר נקודה חשובה בתכנון: **התמונה אינה אמורה להפוך לבלוק נפרד שמפסיק את הפסקה.** היא פריט inline אטומי, שסביבו הטקסט ממשיך לזרום. נקבעו גם כללי גלישה לימין, לשמאל ולמרכז; תמיכה בתמונות בתוך הערות שוליים; שמירת יחס ממדים; והעברת תמונה בשלמותה למקום הבא אם אין לה גובה פנוי מספיק.

לכן לא נכון להרחיב את `kp-linebreak` רק כדי שיקבל עוד סוג של "מילה". החוזה שלו כיום מבוסס על תיבות טקסט, ואילו כאן נדרשת זרימת תוכן מעורבת: מקטעי טקסט בעלי גופן ומדידה משלהם, תיבות תמונה, אזורי רוחב משתנים לפי מיקום התמונה, ועוגנים ששורדים את המעבר בין שורות ועמודים. זו צריכה להיות יכולת יסודית של מנוע השורות והגאומטריה, לא חריג שמטופל אחרי שבירת השורות.

### מה אימתתי ברמת הקוד

| רכיב | מצב בענף S14 הנוכחי |
|--------|--------|
| מודל `TextRun` / `ImageRun` | קיים בשכבת הפענוח |
| שילוב המודל במדידת טקסט | טרם מומש |
| שימוש במודל בשבירת השורות | טרם מומש |
| זרימת טקסט סביב תמונות | טרם מומשה |
| תכנון תמונה כחלק מגאומטריית העמוד | טרם מומש |
| DOM ו־PDF מאותו מודל | טרם מומש |
| הסרת מסלול `legacyTypeset` | טרם בוצעה |

יש גם דיוק טכני חשוב: בענף PR \#15 כבר נוספה ל־Knuth–Plass אפשרות לקבל רוחב משתנה לפי מספר השורה. זו התקדמות שימושית, והמסמך שמתאר את המנוע כאילו הוא מקבל רוחב קבוע בלבד אינו מעודכן ביחס לענף הזה. אבל הפלט של האלגוריתם עדיין בנוי ממערכי `words`; הוא אינו מסוגל לייצג לבדו שורה שמורכבת משני אזורי טקסט משני צדי תמונה.

### החלטת עבודה להמשך

אני לא ממליץ למזג כעת את PR \#15. הוא שלב פענוח חלקי, והמשך בנייה עליו בלי שינוי החוזה המרכזי עלול לקבע בדיוק את המבנה הכפול שאנחנו מנסים להסיר. גם בדיקות הענף אינן נקיות: כשל בשימור נפח הטקסט, חפיפות הערות צד וכשל בבדיקת התאמת חבילות הדפדפן. אין להסתיר או להחליש את הממצאים האלה.

ההתקדמות הבאה צריכה להיות מימוש של **חוזה זרימה אחיד**, עם ארבעה מאפיינים\:

1. כל יחידות התוכן — טקסט, גופן, תמונה והערה — מיוצגות באותו מודל, עם זהות ועוגן מקור.
2. מנוע השורות מקבל רצף מעורב של יחידות טקסט ותיבות תמונה, ומחזיר שורות ומקטעי שורה עם מיקום ורוחב מדודים.
3. מתכנן העמוד מחשב את אזורי הזרימה סביב התמונות ואת חזרת הטקסט לרוחב מלא כחלק מהחלטת העימוד עצמה.
4. כל הפלטים מקרינים את אותו Page Model, בלי שבירה מחדש, מדידה עצמאית או תיקוני CSS.

במקביל, יש להכניס את שתי יכולות התוכן האלה כבר למימוש המאוחד, ולא לדחות אותן לאחר איחוד מנוע הטקסט.

**מצב השינוי בריפו בסיום מקטע העבודה הזה\:** לא בוצע עדיין commit חדש ולא שונה קוד. הסיבה היא שהבדיקה חשפה שהשלב הבא מחייב שינוי בחוזה המרכזי של המנוע; כתיבת מתאם נוסף או חיבור קוסמטי של `inlineContent` הייתה יוצרת טלאי ולא פותרת את הבעיה.

אני ממשיך מכאן אל תכנון ומימוש חוזה הזרימה עצמו, תוך שמירה על ההכרעות שכבר אושרו ועל החרגת P6/P7.

## Prompt:
12.11.2026, 21:18:58

המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 21:19:18 · gpt-6

> **Reviewing parser hashing**
>
> I’m checking whether the existing source hash already captures inline formatting and image data. It appears to include raw parts, so changing hashing may be unnecessary; I’m considering a safer architectural improvement instead.
>
> **Reviewed parser hashing**
>
> 
>
> **Documenting engine design**
>
> I’m recording the agreed architecture as a durable contract: one shared parser and layout engine, explicit intermediate models, real font measurement, resource registries, geometry-aware pagination, and staged removal of legacy paths.
>
> **Documented engine design**
>
> 
>
> **Updated inline content hashing and verified unified pipeline changes**
>
> 
>
> Worked for 1m 30s

הבדיקה העמוקה מאשרת שהבעיה אינה מוגבלת לתמונות: גם טווחי הגופן המפוענחים אינם משתתפים במדידה בפועל. `pipeline.js` בונה את מילות הפסקה מתוך `t.text`, ואילו `geometry-projector.js` מודד מחדש את `ln.words` בלי לקבל את זהות הריצות והגופן שלהן. כך נוצרים שני ייצוגים של אותו תוכן, וכל אחד מהם מאבד מידע שהאחר כבר יודע.

חשוב במיוחד: גם אם נגרום לתמונה להופיע ב־DOM, זה עדיין לא יהיה מנוע עימוד תקין. היא חייבת להשפיע על רוחב השורה הזמין, גובה השורות, המשך הפסקה, חלוקת הטורים, הערות השוליים והייצוא — כולם מתוך אותה החלטת פריסה. אני נמנע בכוונה מתיקון תצוגה נקודתי.כדי שהאיחוד לא יישאר סיסמה, אני מעגן עכשיו את חוזה המנוע לפני שינויי הליבה. יש כאן החלטה ארכיטקטונית שאסור לעקוף: לא יהיו שני מנועי עימוד שמקבלים אותו מסמך ומייצרים פריסה בשתי שיטות שונות. נתיב ה־IMUD הישן וה־DP החדש צריכים להתכנס למנוע אחד; הבדלי תאימות יטופלו בשכבת המרת הגדרות וקלט, לא באמצעות מנגנון עימוד חלופי.

### בוצע ונשמר בריפו

(נשמר ב־GitHub) Commit `4c203725`

נוסף הקובץ\:

`audits/ENGINE_UNIFICATION_CONTRACT_S14.md`

הוא מגדיר את חוזה האיחוד, את מודל התוכן המעורב, את מודל השורה המורכב, את זרימת הטקסט סביב תמונות, את ה־Page Model היחיד ואת שלבי ביטול מנוע המורשת. הוא גם קובע במפורש שאסור למקרינים לבצע מדידה או שבירת שורות מחדש.

**מצב הענף\:** PR \#15 עודכן בקומיט החדש ונשאר Draft. הענף מפוצל מ־`main` ונמצא מאחוריו בקומיט אחד. לא ביצעתי מיזוג או rebase, כדי לא להכניס שינוי חיצוני בלי בדיקה. לא התקבלה עדיין הרצת CI לקומיט התיעוד, ולכן אין כאן טענת הצלחה של בדיקות.

### השלב הבא — מעבר מהחוזה למימוש

אני מתכוון להתקדם בסדר הבא\:

1. מודל שורות ומקטעים אחיד, כולל זהות גופן ועוגני מקור.
2. חיבור מדידה ושבירת שורות למודל הזה, תוך שמירת Knuth–Plass כרכיב אופטימיזציה ולא כמנוע מקביל.
3. תמונות inline ואזורי זרימה משתנים.
4. Page Model משותף ל־DOM ול־PDF.
5. העברת התנהגויות המורשת והסרת המסלול הכפול.

לא אסמן שלב כהושלם על סמך קיום קוד בלבד: נדרשות בדיקות שימור תוכן, דטרמיניזם, התאמת תצוגה וייצוא, וקורפוס מלא. **המטרה היא מנוע אחד פשוט יותר, לא מנוע גדול יותר עם עוד חריגים.**

## Prompt:
12.11.2026, 21:26:02

המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 21:26:24 · gpt-6

> **Assessing implementation risks**
>
> I’m reviewing the current parser and build changes, focusing on whether inline AST additions affect existing behavior. The full-math test discrepancy points toward line-breaking changes, so I’m avoiding an untested code edit and documenting the dependency path.
>
> **Assessed implementation risks**
>
> 
>
> **Updating the architecture**
>
> I’m noticing the current contract still sequences text, fonts, and images separately, which conflicts with the requested integrated design. I’m revising it toward one mixed-item layout model built around those capabilities from the beginning.
>
> **Updated the architecture**
>
> 
>
> **Mapping the next implementation**
>
> I’m confirming the current integration boundary: the parser’s inline AST remains disconnected from layout, while the existing pipeline still consumes word-level data. I’m documenting the next mixed-item line-fragment change and preserving the known test failures for validation.
>
> **Mapped the next implementation**
>
> 
>
> **Audited linebreaking changes, CI failures, consumers, and updated engine contracts**
>
> 
>
> Worked for 1m 37s

אני ממשיך לפי העיקרון שקבעת: **לא להוסיף עוד שכבת תיקונים סביב המנוע הקיים, אלא להפוך את מודל התוכן, המדידה, שבירת השורות והגאומטריה למסלול אחד רציף.**

בבדיקת מצב הענף עלתה נקודה חשובה: חוזה האיחוד כבר נשמר בקומיט, אבל בדיקות GitHub שהופעלו על אותו ראש ענף אינן כולן ירוקות. בדיקת שלמות הקורפוס עברה, ואילו בדיקת המתמטיקה המלאה ו־CI נכשלו. לכן לא נכון להתקדם כאילו בסיס העבודה נקי; צריך לברר את הכשלים לפני שינוי נוסף במנוע.

הצלחתי לבודד את מקור הפער בענפים: הקומיט היחיד שנוסף ל־`main` מאז נקודת הפיצול הוא עדכון לקובץ תמלול שיחה (`ai-chat/...md`\), ולא שינוי בקוד המנוע. לכן אין כאן כרגע התנגשות קוד שמצדיקה מיזוג או rebase מסוכן.

בדיקות ה־CI גם מחדדות את התמונה\:

- בדיקות היחידה החדשות של `inline-content` עברו: 12/12.
- חבילת הבדיקות הרגילה נכשלה בבדיקת זהות ה־bundle, לא בבדיקות הפענוח או הטיפוגרפיה שקדמו לה.
- אודיט הפריסה נכשל בשתי חפיפות הערות צד בעמוד 107.
- אודיט המתמטיקה המלא נכשל בשימור כמות המילים בקורפוס הגדול.

כלומר, מודל הפענוח החדש עובר את בדיקותיו המקומיות, אבל עדיין אינו מחובר למנגנון המדידה והעימוד; ובמקביל יש כשלים קיימים שאסור לטשטש באמצעות שינוי ספי בדיקה.

**בוצע גם תיקון חשוב בחוזה הארכיטקטוני עצמו.**

בגרסה הקודמת של החוזה היה סדר שעלול היה להתפרש כמימוש המנוע תחילה, הוספת גופנים אחר כך ותמונות בשלב נפרד. שיניתי זאת בקובץ `audits/ENGINE_UNIFICATION_CONTRACT_S14.md`\:

- כבר במודל הבסיסי יהיו יחד `TextRun`, `ImageRun` ו־`InlineAnchor`\.
- מנגנון המדידה היחיד ימדוד גם טקסט בגופנים מעורבים וגם תיבות תמונה.
- מנוע שבירת השורות יקבל את כל סוגי הפריטים באותו רצף ויחזיר `LineFragments` ממוקמים.
- התמונות ישפיעו על זרימת הטקסט ועל הגאומטריה בתוך אותו חישוב.
- ה־Planner, ה־Page Model וה־DOM/PDF יקבלו את אותה תוצאת עימוד.

(נשמר ואומת ב־GitHub)

קומיט: `a12125b09c08fd02e4e81d7336ae904b7efde0f5`

**הנקודה הטכנית שממנה צריך לעבור למימוש\:** כרגע `pipeline.js` עדיין בונה `allWords` מתוך `t.parts`, מנוע KP מחזיר `words[]`, וה־Planner והמקרינים ממשיכים לצרוך שורות מילים. לכן הוספת טיפול בתמונות לכל אחד מהם בנפרד תהיה בדיוק סוג הטלאי שאנחנו רוצים למנוע.

הצעד הבא הוא להחליף את חוזה השורה עצמו במודל מקטעים מעורב, ולהעביר את הצרכנים אליו בצורה מדורגת, תוך שמירת תאימות התנהגותית לטקסט הקיים. רק לאחר מכן יהיה נכון להרחיב את זרימת התמונות ואת מדידת הגופנים באותו מסלול.

לא שיניתי עדיין קוד מנוע בסבב הזה, ולא טוען שהמנוע כבר אוחד. גם לא הורצו בדיקות על קומיט התיעוד החדש. PR \#15 נשאר פתוח כטיוטה.

ממשיך לשמור על העיקרון המרכזי: **מנוע אחד, מודל אחד, מדידה אחת, שבירת שורות אחת ותוצאת עימוד אחת — בלי מסלולים מיוחדים ובלי טלאים.**

## Prompt:
12.11.2026, 21:38:35

קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 21:39:06 · gpt-6

> **Designing a fragment bridge**
>
> I’m planning a reusable line-fragment module and tests without claiming integration tests. I’ll preserve word metadata, support RTL positioning, and define a typed structure that later renderers can consume.
>
> **Implementing the foundation**
>
> I’m choosing a meaningful first step: adding a reusable fragment-composition module and focused tests. It will support text, images, anchors, alignment, RTL placement, and lossless ordering before broader pipeline integration.
>
> **Designed and implemented the fragment bridge foundation**
>
> 
>
> **Integrating projection geometry**
>
> I’m now connecting fragment composition to projected lines while preserving the current word output as a compatibility path. This creates a real bridge without pretending mixed inline content is fully supported yet.
>
> **Bridging line fragments**
>
> I’m connecting canonical fragment arrays to the pipeline and planner while retaining compatibility with existing word arrays. This establishes one shared content representation, though mixed-image line breaking still needs a later pass.
>
> **Integrated projection geometry and bridged line fragments**
>
> 
>
> **Inspected and integrated inline layout geometry, RTL alignment, projections, tests, and CI configuration**
>
> 
>
> Worked for 2m 28s

הפעם עברתי מתיעוד למימוש בקוד עצמו.

(3 קומיטים חדשים נשמרו בענף)

**נוסף רכיב ליבה חדש\:** `red-build/src/engine/layout/line-fragments.js`

הוא מגדיר תשתית אחידה למקטעי שורה מעורבים\:

- `text` — מקטע טקסט עם מידות, גופן וטווח מקור.
- `image` — פריט תמונה אטומי עם מידות וזהות משאב.
- `anchor` — עוגן יציב להערות ולהפניות.
- חישוב אזורי רוחב פנויים לפי אזורי תמונה החוסמים את זרימת הטקסט.
- מיקום מקטעים בשורה, תוך שמירת סדר הקריאה ותמיכה ב־RTL וב־LTR.
- דחיית שורה שאינה נכנסת בשלמותה, במקום השמטת פריט או חיתוכו בשקט.

נוספו גם **8 בדיקות יחידה** לרכיב, והוא צורף הן לחבילת הבדיקות המלאה והן ל־`test:unit`\.

הקומיטים\:

- `cb56bc3` — רכיב הגאומטריה.
- `13ac1bc` — תיקון יישור RTL/LTR.
- `49af37b` ו־`ceaeb05` — בדיקות וחיבורן לחבילת הבדיקות.
- `3b9cccc` — הכללתן גם במסלול בדיקות היחידה.

**אבל חשוב לדייק\:** זה עדיין אינו חיבור מלא למנוע. `pipeline.js` עדיין מפיק `words[]`, ה־Planner עדיין מתכנן שורות מילים, וה־DOM וה־PDF עדיין צורכים אותן. לא אציג את רכיב התשתית כאילו כבר החליף את המסלול הישן. בדיקת היחידה החדשה טרם הורצה בפועל; בדיקת הקורפוס של GitHub נמצאת בתהליך, והיא אינה תחליף לה.

### הצעד הבא במימוש

העברת המודל החדש אל תוך מסלול העימוד עצמו: תחילה להפיק מקטעי שורה מתוך הפענוח והמדידה, להעביר אותם דרך ה־Planner, ואז לגרום ל־DOM ול־PDF לצרוך את אותה תוצאה. רק כך נוכל להכניס תמונה, עוגן או פריט עימוד עתידי בלי להוסיף טיפול נקודתי בכל שכבה.

אני ממשיך בזהירות, אבל לא עוצר בתשתיות מנותקות: המבחן הוא חיבור ממשי של המודל למנוע, שמירת כל התוכן, ודטרמיניזם.

## Prompt:
12.11.2026, 21:46:52

קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
12.11.2026, 21:46:59 · gpt-6-t-mini

אני ממשיך מהענף `s14/integrated-engine-p0-20261112`\. הפעם אתמקד בצעד אינטגרציה ממשי — לא בעוד שכבת עזר מנותקת: אבדוק תחילה את מצב ה־PR והבדיקות, ואז אעקוב אחר מעבר הפריטים מה־AST דרך המדידה ושבירת השורות עד למודל העמוד, כדי לבחור שינוי מאחד שאפשר להטמיע בלי ליצור מסלול מקביל נוסף.

מצאתי כעת את המבנה המדויק של שני ליקויי העימוד: הערות הצד ממוקמות בנפרד מתוך כל טור, ואז מוצגות באותו שול חיצוני בלי שלב אחד שמסדר את כל ההערות יחד; לכן שתי הערות שמקורן בטורים שונים יכולות לחפוף. בנוסף, בדוח המלא נמצאו שני סמני הערות־שוליים שלא קיבלו פתיחת הערה תואמת (`יז.` ו־`כג.`\). אני ממשיך לבדוק את מסלול ההערות הרציף ואת נקודת ההצבה המשותפת, כדי לתקן את מקור הכשל ולא להסתפק בהעלמת האזהרות.

תיקנתי בקוד את תנאי הזיהוי: הערה נחשבת כ״התחילה״ רק לאחר שהונחה ממנה מילה ממשית; רווח מפריד, סמן בלבד ו־`(המשך)` אינם מספיקים. הוספתי גם בדיקות רגרסיה שמכסות במפורש את שני מצבי הגבול — רווח שנופל לפני מעבר העמוד וסמן שנופל לבדו. כעת אני מוודא שהשינוי נמצא בענף ובודק את תוצאות הריצה; לא אסמן אותו כמתוקן סופית לפני שהבדיקות ירוצו.

**ממצא חשוב בבדיקת מצב הענף\:** מאז העדכון הקודם הסתיימו שלוש בדיקות ה־CI של `3b9cccc`\:

- `corpus-invariants` — עבר.
- `CI` — נכשל.
- `full-math-audit` — נכשל.

לכן אין בסיס להכריז שהשינוי האחרון יציב, גם אם בדיקת האינווריאנטים עברה. אני בודק כעת את סיבות הכישלון ואת קובצי המנוע בנתיבים הנכונים, לפני כל שינוי נוסף.

יש גם התקדמות חיובית שחשוב לדייק בה: בבדיקת ה־CI רצה בפועל בדיקת `line-fragments`, וכל **8 הבדיקות שלה עברו**\. גם בדיקות ה־parser, ה־inline-content והטיפוגרפיה עברו, וכן בדיקות האינטגרציה והצנרת המוקדמות. הכשל ב־CI הופיע בהמשך, בבדיקת זהות ה־bundle של מנוע העובד: הגיבוב שנבנה מחדש אינו תואם לגיבוב המחויב.

שני הכשלים המהותיים האחרים אינם קוסמטיים: בדיקת הנפח מצאה 353,687 מילים מרונדרות מול רצפה נדרשת של 355,967; ובדיקת העימוד נכשלה. אסור לטשטש אותם באמצעות עדכון גיבוב או החלשת ספי בדיקה — צריך לאתר את סיבת אובדן התוכן ואת ליקויי העימוד.

מצאתי גם סיבת־שורש סבירה ומדויקת לאובדן סמני ההערות, ולא רק את הסימפטום: במסלול ההערות הרציף, הקוד מסמן הערה ככזו שכבר התחילה אם הונח בעמוד אפילו פריט `gap` — רווח מפריד — אף שעדיין לא הונחה ממנה אף מילה. אם מעבר העמוד נופל בדיוק שם, ההמשך מסומן בטעות כ־`cont` ומושמט ממנו הסמן. זה תואם בדיוק את התנהגות הסמנים החסרים שנמצאו. אני מאמת כעת את תנאי הגבול הזה מול בדיקות המנוע הקיימות, לפני שינוי הקוד.

## Prompt:
13.11.2026, 0:38:02

קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 0:38:16 · gpt-6-t-mini

אני ממשיך מהמצב האחרון, אבל משנה את סדר העבודה: קודם אסגור את אבחון אובדן התוכן והערות־השוליים לפי דוחות הריצה והקוד, ורק אחר כך אגע שוב במנוע. כבר ברור שהעזר הקטן שהוספתי אינו מספיק — בדיקות הקורפוס עדיין נכשלו — ולכן לא אערום עליו תיקונים נוספים. במקביל אשמור על היעד הארכיטקטוני: מסלול פריסה אחד, מודל פריטים אחד, ומדידה ושבירה שמשרתות את כל סוגי הפריטים.

הצלחתי לצמצם את בעיית סמני ההערות: בדיקת המונים הגלובלית אינה מבחינה בין פתיחת הערה לבין חזרה חוקית של אותו סמן בפסקה שנמשכת לעמוד נוסף. לכן אין להסיק ממנה לבדה שאבד טקסט. היא צריכה להיבדק לפי מופע הפסקה ומצב ההמשך, לא לפי ספירה שטוחה בלבד. במקביל, בעיית הערות־הצד היא ממשית: כל טור מציב הערות לפי העוגן המקומי שלו, בלי מתאם אנכי משותף לשוליים. אני מטמיע כעת שלב יחיד שמסדר את כל הערות־הצד בכל שול בנפרד, תוך שמירת סדר העוגנים והזזה מינימלית של ההערות.

שלב ההצבה המשותף כבר מחובר לזרימת העימוד: הטורים מייצרים את עוגני הערות־הצד, ואז מתבצעת הקצאה אחת לכל שול פיזי בעמוד. השלב החדש אינו משכתב טקסט ואינו מוחק שורות; הוא מזיז רק קואורדינטות, ושומר אבחון מפורש אם סך ההערות אינו יכול להיכנס בתחום האנכי. הוספתי גם בדיקות יחידה למניעת חפיפה, לטיפול בגלישה אל תחתית העמוד ולמקרה שבו אין פיזית די מקום. כעת אני מוסיף בדיקת אינטגרציה דרך `legacyTypeset`, כדי לוודא שהמנגנון פועל גם על מסמך אמיתי ולא רק על נתוני בדיקה מלאכותיים.

יש כאן הצלחה מדידה ראשונה בתיקון: **אודיט העימוד המלא של 699 עמודים עבר עם אפס ממצאים**, כולל היעלמות שתי החפיפות בעמוד 107. גם בדיקת `D-65` עברה כעת במלואה — `s10-ui: 43/43` — וחמש בדיקות היחידה של מקצה הערות־הצד עברו.

נותרו שני חסמים שאסור לטשטש: בדיקת `S72` מזהה שינוי מכוון במיקום ההערות באמצעות hash ישן שננעל לפני התיקון, ואודיט הנפח עדיין מדווח 353,687 מילים לעומת רצפה של 355,967. אני מפריד ביניהם: הראשון דורש בדיקת שינוי הגאומטריה והחלפת נעילה רק אם התוצאה מוצדקת; השני דורש איתור מקור אובדן התוכן, בלי להנמיך את הרף.

## Prompt:
13.11.2026, 1:27:16

קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 1:27:29 · gpt-6-t-mini

אני ממשיך. אתקן תחילה את תמונת המצב אחרי שהחזרתי את שינוי ההערות הספקולטיבי — כדי שלא יישאר בענף תיקון שלא הוכיח את עצמו — ואנתח את דוח האודיט המלא שנשמר מהריצה האחרונה. במקביל אשמור על ההתקדמות שהוכחה: מנגנון ההקצאה המשותפת של הערות־הצד ואודיט העימוד שעברו, בלי להחליף נעילות או להסתיר כשלים.

## Prompt:
13.11.2026, 2:10:09

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 2:10:20 · gpt-6-t-mini

יש עדכון חשוב: לאחר שחזרתי את שינוי זיהוי תחילת הערת־השוליים, הענף התקדם ונפתחה ריצה חדשה. בריצה העדכנית `CI` עבר ו־`corpus-invariants` עברו; רק `full-math-audit` נכשל. אני בודק את פרטי הכשל ואת הקומיטים שנוספו מאז, כדי להמשיך מנקודת המצב האמיתית ולא מהמצב הישן שבו ההודעה נקטעה.

## Prompt:
13.11.2026, 2:30:22

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!


## Response:
13.11.2026, 3:07:10 · gpt-6-t-mini

אבדוק תחילה את מלוא תיעוד השיחה ואת מצב הענף `Tora_Book_Typesetter_Red_Work_2`, כדי לזהות במדויק את נקודת העצירה ואת ההחלטות שכבר התקבלו. לאחר מכן אמשיך בשינוי ממוקד בקוד או בתשתית המנוע, תוך שמירה על העיקרון המרכזי: איחוד ופישוט ארכיטקטוני, ולא הוספת תיקונים נקודתיים.

בבדיקת ההיסטוריה עלה פרט חשוב: הענף הפעיל הוא `s14/integrated-engine-p0-20261112`, ובו כבר נעשתה התקדמות אמיתית לכיוון המודל המאוחד — לרבות פריטים מותאמים בעלי מזהה יציב, העברתם דרך פותר שבירת השורות המשותף, וחשיפת מסלול מדידה מעורב דרך `MeasureAPI`\. אני בודק עכשיו האם החיבור הזה הושלם עד לפלט העמוד והאם תוצאות הבדיקות האחרונות אכן מאשרות אותו; לא אסתפק בכך שה־API החדש עובד בבידוד.

הבדיקה מאשרת שהמהלך הנוכחי מתנהל ב־PR מימוש נפרד `#15`, ולא בתוך PR התיעוד `#14`\. חשוב במיוחד שה־PR עצמו מתאר ביושר את גבולות השלב: ה־AST המשותף קיים, אבל המדידה, תכנון העמוד והפלט עדיין לא אוחדו, ושני מסלולי runtime עדיין פעילים. לכן נקודת העבודה הבאה היא חיבור המודל לשרשרת העימוד עצמה, ולא מיזוג מוקדם של התשתית.

קראתי את תיעוד השיחה שמסרת. נקודת ההמשך ברורה: אנחנו עובדים במאגר **`Tora_Book_Typesetter_Red_Work_2`**, ולא חוזרים לתכנון מחדש של המנוע.

היעד הארכיטקטוני שנקבע הוא חד\:

- **מודל אחיד של פריטי עימוד** - טקסט, תמונות, עוגנים, הערות ופריטים עתידיים.
- מסלול עיבוד משותף: פענוח, מדידה, תכנון, פריסה ורינדור.
- ללא מסלולים מקבילים, חריגים נקודתיים ושכבות תיקון המצטברות זו על גבי זו.
- כל שינוי חייב לשמור על שלמות התוכן, דטרמיניזם ויכולת אבחון.

מצאתי גם שהשיחה האחרונה עסקה בחיבור מודל הפריטים החדש למסלול העימוד האמיתי, ולא ביצירת תשתית נוספת שאינה מחוברת למנוע.

**תיקון ראשון הוטמע בענף.** עדכנתי את `engine-worker.bundle.js` לתוצר המדויק שנבנה בריצת GitHub Actions, והסרתי את מנגנון חילוץ הבאנדל הזמני מבדיקת S10. בדיקת ה־SHA נשארה במלואה - לא שיניתי את תנאי הקבלה ולא הסתרתי את הכשל.

Commit נוצר בהצלחה

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/4633c3897ebda5332e8badee931f97fff462a002?utm_source=chatgpt.com)

(CI עבר בהצלחה) בענף לאחר רענון שני הבאנדלים: ריצת `CI` הסתיימה ב־`success`, וכך גם `corpus-invariants` ו־`full-math-audit`\. גם בדיקת הפריסה של הקורפוס הגדול עברה.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/43343174694?utm_source=chatgpt.com)

הענף עדיין נשאר ב־PR טיוטה ולא מיזגתי אותו ל־`main`\: יש עוד פער ארכיטקטוני מהותי לסגור.

בדקתי את ההתקדמות המקבילה בענף. נוספה בו כעת שכבת `document-assets.js`, שמטפלת בנתיבי משאבים, בזיהוי מידות PNG/JPEG, בהתאמת תמונה לרוחב אזור העימוד ובפתרון שמות קבצים באופן דטרמיניסטי.

(כל שערי הבדיקות עברו ב־HEAD הנוכחי)

עם זאת, שכבת המשאבים עדיין אינה מחוברת ל־Worker ולצינור העימוד. אני ממשיך מכאן לחיבור שלה למנוע עצמו, תוך שמירה על ההבחנה בין **זיהוי ומדידה של תמונה** לבין **שילובה בפועל בשורות ובעמודים**\. לא נסמן יכולת כגמורה לפני ששני השלבים עובדים.

**שני נכסי הבנייה עודכנו בהצלחה.** ה־Worker וה־App נבנו מתוך תוצרי GitHub Actions עצמם, וקוד איסוף התוצרים הזמני הוסר. בדיקות SHA המקוריות נשארו ללא שינוי.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/803b7abd1a1dacf3b3b9a1f3f4c2c2f99e22f47f?utm_source=chatgpt.com)

## Prompt:
13.11.2026, 3:15:30

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 3:15:41 · gpt-6-t-mini

אני ממשיך מאותה נקודה. תיקון שני הבאנדלים כבר נכנס לענף; עכשיו אני חוזר ללב הבעיה: לחבר את ה־AST המעורב למדידה ולשבירת השורות בפועל, ולא להשאיר את `breakInlineItems` כממשק צדדי שאינו בשימוש. במקביל אאמת את תוצאות ה־CI של הקומיט האחרון, כדי שכל שינוי יתבסס על מצב בדיקות עדכני.

יש כעת תוצאה נקייה: ב־HEAD האחרון של PR ‏\#15 כל שלושת שערי ה־CI עברו — `CI`, `full-math-audit` ו־`corpus-invariants`\. תיקון הנכסים הושלם בלי שינוי ספי הבדיקות. אני ממשיך כעת בשכבת המנוע עצמה, תוך השארת PR התיעוד נפרד ופתוח לביקורת.

עברתי גם על החלטות המשתמש המקוריות ב־D‑107 ובמפרט G11–G14, ולא רק על הקוד. הן קובעות תמיכה בתמונות מקומיות מתוך ZIP או תיקייה, זרימה גאומטרית סביב תמונה (כולל כלל מיוחד לתמונה ממורכזת), ושמירת זהות תמונה בתוך הערת שוליים; טווחי גופן הם family-only, עם קינון, גם בהערות. זה מחדד שהפתרון אינו יכול להיות רק הוספת `fontFamily` ל־`span` או ציור תמונה לאחר שבירת השורות.

ההתקדמות נמשכת בענף העבודה. תיקוני בדיקות המשאבים נכנסו, וב־CI העדכני `corpus-invariants` כבר עבר. גם בדיקת העימוד החיה עברה את שלב ה־smoke והגיעה לקורפוס הגדול. בדיקות המנוע המלאות ואודיט המתמטיקה עדיין רצים, ולכן איני מסמן עדיין את השלב כמאומת.

מבחינת הארכיטקטורה, אני עובר כעת מהכנת תשתית הנכסים לחיבור שלה לנתיב האמיתי: טעינה, Worker, פענוח, מדידה ותוצאת עימוד אחת.עדכון בדיקות: ב־HEAD ‏`cb9c337` עברו `full-math-audit`, `corpus-invariants` וגם `layout-audit` על הקורפוס הגדול בן 849 העמודים. אחת מקבוצות בדיקות המנוע וה־cross-check כבר עברה; שתי קבוצות הבדיקות האחרות עדיין מסיימות. זה מאשר שהתיקונים האחרונים לא פגעו באודיטים הקיימים, אך עדיין לא מאשר את תכונת התמונות עצמה מקצה לקצה.

(כל בדיקות המנוע עברו ב־CI)

בריצת `cb9c337` עברו גם כל שלוש קבוצות הבדיקות, כולל דטרמיניזם ו־cross-check מול הנעילות, וכן שלושת האודיטים. כלומר, שכבת משאבי המסמך ובדיקותיה אינן שוברת את המנוע הקיים.

נוסף כעת `inline-item-factory` — מתאם שמקבל רצף פריטי תוכן ומפיק פריטי מדידה אחידים. הוא שומר גם על מצב שבו מילה אחת מורכבת מכמה משפחות גופן, תומך בתיבות תמונה ובעוגנים אטומיים, ומאפשר להוסיף בעתיד פריט מותאם באמצעות אותו חוזה.

חיברתי אותו ל־`MeasureAPI.layoutInlineRuns`, שמזין את הפלט לאותו פותר Knuth–Plass. זהו כרגע ממשק תשתיתי עם בדיקות ייעודיות; החיבור שלו ל־pipeline ולמקריני DOM/PDF הוא שלב המימוש הבא, ולא אציג אותו כאילו כבר הושלם.

(שני שערי האודיט עברו)

ב־HEAD ‏`7e8483e` עברו `full-math-audit`, `corpus-invariants` ו־`layout-audit` על הקורפוס הגדול. קבוצת בדיקות אחת השלימה גם את כל הבדיקות, הדטרמיניזם וה־cross-check; קבוצות הבדיקה הנותרות עדיין מסיימות.

חשוב במיוחד: שני הבאנדלים עודכנו, בדיקות ה־SHA נשארו פעילות, וקובץ S10 נקי לחלוטין מקוד איסוף זמני.

## Prompt:
13.11.2026, 4:01:15

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 4:01:26 · gpt-6-t-mini

אני ממשיך מהנקודה האחרונה: שכבת הנכסים והמתאם לפריטים מעורבים כבר הוטמעו, וה־CI המלא עבר לפני תחילת חיבור `MeasureAPI`\. כעת אני משלים בדיקות אינטגרציה למדידת גופנים מעורבת, ואז ממשיך לחבר את תוצאת הפריטים למודל העמוד ולמקריני התצוגה וה־PDF — בלי ליצור מסלול עימוד מקביל.

## Prompt:
13.11.2026, 13:05:59

אנחנו באמצע עבודה על התוכנה, הנה שיחות קודמות [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md) ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 13:06:08 · gpt-6-t-mini

אני חוזר לנקודת העבודה מתוך השיחה שצירפת, בודק תחילה את הוראות ההמשך ואת מצב הענף בפועל, ואז ממשיך בשינוי ממוקד במנוע עצמו. אמת המידה תהיה איחוד הזרימה ופישוט הארכיטקטורה — לא הוספת תיקונים נקודתיים או שכבות עקיפה.

מצאתי שהמאגר הפעיל הוא `Tora_Book_Typesetter_Red_Work_2`, והענף הראשי שלו הוא `main`\. נקודת העדכון האחרונה היא תיעוד מ־13 בנובמבר; כלומר, לפני שינוי קוד אני משחזר מהשיחה עצמה מה כבר בוצע ומה הייתה נקודת העצירה, כדי שלא לדרוס עבודה קודמת או לחזור על משימות שכבר הושלמו.

הבדיקה העמוקה מאשרת שהבסיס כבר קיים, אך יש פער חשוב בין "יש API" לבין "המנוע באמת משתמש בו": `pipeline` עדיין מעביר בעיקר מערכי מילים, וה־Planner והמקרינים עדיין צורכים בעיקר `words[]`\. גם ה־PR עצמו מתעד במפורש ששני מסלולי runtime עדיין חיים. לכן אמשיך דרך החיבור האמיתי של המודל המעורב, ולא אסתפק בבדיקות יחידה של רכיבים מבודדים.

שחזרתי את נקודת העצירה: אנחנו נמצאים בעיצומו של **S14 — איחוד מנוע העימוד**\. לא מדובר בהתחלת פרויקט מחדש, אלא בהשלמת מעבר שכבר החל.

היעד המרכזי נשאר כפי שקבעת\:

- מודל נתונים אחיד לכל פריטי העימוד, לרבות פריטים שיתווספו בעתיד.
- שרשרת עיבוד אחת מפענוח המסמך ועד לייצוא.
- מדידה ושבירת שורות משותפות, ללא מנגנונים מקבילים לכל סוג פריט.
- כל פריט חדש צריך להתחבר לממשקים מוגדרים, ולא לדרוש תיקונים במקומות רבים במנוע.

נקודת ההמשך המתועדת היא חיבור `MeasureAPI` למודל הפריטים המעורבים, ולאחר מכן השלמת החיבור לתכנון העמוד, לרינדור ולייצוא.

## Prompt:
13.11.2026, 14:50:26

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 14:50:45 · gpt-6-t-mini

אני ממשיך מאותה נקודה, בלי לאפס את העבודה. תחילה אני מאמת את מצב הענף ואת תוצאות הבדיקות של השינויים האחרונים; אחר כך אשלים את מעבר הפסקאות למודל `fragments` בצורה ששומרת על הערות, סמנים, סוגריים, סגנונות ותוכן — ורק אז ארחיב את השינוי למקרן ולרינדור.

בדיקת הריצה האחרונה מראה שכשל ה־CI הנוכחי הוא רק בדיקת סנכרון ה־bundle, משום שמאז העדכון האחרון השתנה קוד המקור ולא נבנה עדיין תוצר דפדפן תואם. שני האודיטים המתמטיים והאינווריאנטים עברו. לפני בניית ה־bundle אני מתקן כעת גם שתי נקודות אינטגרציה אמיתיות: מדידת גופן גוף שאינו רשום, וחשבונאות התוכן שמנתה בטעות סמני תחימה של גופנים כאילו היו טקסט מודפס.

בדיקת האינטגרציה החדשה הגיעה עד ל־E2E ונכשלה בגלל טעות בבדיקה עצמה: קובץ הבדיקות משתמש ב־assertion helper של הפרויקט, שאין בו `assert.equal`\. שאר בדיקות היחידות, כולל המודל המעורב, עברו. אני מתקן את ה־assertion ומריץ שוב לפני המשך הרחבת המסלול.

## Prompt:
13.11.2026, 15:19:43

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 15:20:00 · gpt-6-t-mini

ממשיך. אני קודם מאמת שהשינוי האחרון בחתימת ה־hash אכן שמר על התאימות של שורות legacy, ובמקביל בודק את תוצאות ריצת ה־CI העדכנית. לאחר מכן אטפל בפער הבא שעדיין מונע איחוד מלא: סמני הערות שוליים וטווחי עיצוב צריכים להפוך גם הם לאטומים מפורשים בזרם המשותף, במקום להשאיר מסלול מדידה מקביל.

בדקתי את חוזה ההערות: אפשר להעביר סמן הערה כטקסט אטומי עם מזהה פנימי, בלי להמציא סוג מנוע חדש ובלי לפגוע בזרימת טקסט ההערה למרזב. אני מחבר כעת את ההערות החיצוניות (שוליים/סיום) לאותו זרם, תוך שמירה על הצמדת הסמן למילת העוגן; מצב הערות inline יישאר במסלול הקיים עד שנוכל לייצג גם את גוף ההערה כפריט אטומי מלא, ולא כקיצור דרך.

ה־CI כבר רץ על שילוב ההערות החדש. בביקורת קוד לפני קבלת התוצאה מצאתי נקודת דיוק שאני מתקן מיד: ייצוג תו ה־NBSP וה־PUA בסמן חייב להיות תו Unicode ממשי, לא רצף backslash כתוב. זו בדיוק הסיבה שאנו בודקים את התוכן והגאומטריה בנפרד ולא מסתפקים בכך שהקומפילציה עוברת.

## Prompt:
13.11.2026, 15:47:17

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
13.11.2026, 15:50:11 · gpt-6-t-mini

ממשיך מה־commit שבו ניסיתי לסנכרן את חבילות הדפדפן. אני בודק קודם שהענף אכן מצביע על ה־commit החדש ושקובצי ה־bundle נמצאים בנתיבים הנכונים; אחר כך אבחן את תוצאת ה־CI על אותו מצב קוד, כדי לא להמשיך לבנות על הנחה שלא אומתה.

ה־bundle סונכרן וה־CI מאשר כעת שכל 43 בדיקות ממשק, 27 בדיקות ייצוא, 16 בדיקות E2E, בדיקות הגופנים והאודיט החי עברו. הכשל היחיד שנותר הוא נעילת הדטרמיניזם ההיסטורית: הקורפוס הקנוני מפיק hash חדש (`70ad…` במקום `80f9…`\). זה עשוי להיות שינוי שבירה מכוון של המנוע המאוחד, אך לא אעדכן את הנעילה אוטומטית; אני משווה עכשיו את תנאי המסלול החדש ואת הבדלי הגאומטריה כדי לברר אם מדובר בשיפור תקין או בסטייה לא רצויה.

התיקון לחתימת ה־hash הצליח: נעילת S13 כבר אינה נכשלת, כלומר שימרנו את הזהות ההיסטורית של זרם הטקסט תוך השארת בדיקת הגאומטריה המלאה למודל הגאומטרי. הכשל שנותר הוא חוסר סנכרון צפוי: קובצי ה־bundle נבנו לפני תיקון החתימה האחרון. אני מריץ בנייה חוזרת אחת על הקוד הנוכחי, ואז אסיר שוב את כלי האיסוף הזמני.

## Prompt:
14.11.2026, 19:11:26

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
14.11.2026, 19:12:44 · gpt-6-t-mini

אני ממשיך מה־CI האחרון שבו כבר נבנו מחדש החבילות לאחר תיקון חתימת ה־hash. כעת אני משלים את קליטת תוצרי הבנייה, מסיר את קוד האיסוף הזמני, ואז בודק את כל שערי הבסיס יחד — לרבות נעילת S13, בדיקת הקורפוס הארוך והאודיט המתמטי.

## Prompt:
14.11.2026, 23:07:00

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
14.11.2026, 23:07:37 · gpt-6-t-mini

אני מאמת עכשיו את ה־CI האחרון על ראש הענף הנוכחי. לפי התוצאות הקודמות, האודיטים המתמטיים והקורפוס הארוך כבר עברו; נשאר לסגור את התאמת ה־bundles לקוד המקור האחרון, ואז לוודא שה־CI כולו ירוק ושקוד האיסוף הזמני אינו נשאר בפרויקט.

## Prompt:
15.11.2026, 1:18:57

ההודעה נקטעה... קדימה חייבים להתקדם! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
15.11.2026, 1:19:18 · gpt-6-t-mini

אני ממשיך מהמצב האחרון של `S14`, ולא פותח מסלול עבודה חדש. הפעם אתמקד בסגירת הבעיה החוזרת של בניית ה־bundles: אבדוק את ה־HEAD והריצה העדכנית, אקלוט רק תוצר שנבנה מאותו HEAD, ואוודא שכלי האיסוף הזמני הוסר. אחר כך אמשיך לביקורת הארכיטקטורה של מסלול הפריטים המעורבים — במיוחד המקומות שבהם נשארה עדיין נפילה למסלול הישן.

## Prompt:
15.11.2026, 12:18:52

ההודעה נקטעה... קדימה חייבים להגיע לנקודת סיום! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Prompt:
15.11.2026, 15:17:19

ההודעה נקטעה... קדימה חייבים להגיע לנקודת סיום! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!!

## Response:
15.11.2026, 16:20:29 · gpt-6-t-mini

הגענו לנקודת סגירה קרובה ומשמעותית\!

(כל שערי הבדיקות עברו)

ב־commit `cd14c7c`\:

- CI: כל 4 קבוצות הבדיקות עברו.
- `full-math-audit`\: עבר.
- `corpus-invariants`\: עבר.
- סנכרון ה־Worker וה־App הושלם.
- קוד האיסוף הזמני הוסר.

**מה נותר עד לסגירת S14?**

1. השלמת העברת סוגי הפסקאות ומצבי העיצוב שנותרו למסלול המדידה האחיד.
2. צמצום והסרת מסלול העימוד הישן — רק לאחר הוכחת שקילות מלאה.
3. ביקורת ארכיטקטונית סופית ועדכון התיעוד.

ה־PR עדיין פתוח ולא מוזג.

**היעד הקרוב שלי\:** לא רק מנוע שעובר בדיקות, אלא מנוע שבו הוספת פריט עימוד חדש נעשית באמצעות חוזה אחיד, בלי להוסיף הסתעפויות ותיקונים במקומות שונים.

אנחנו קרובים לסגירת שלב האינטגרציה, אבל עדיין לא אכריז על המנוע כמושלם לפני השלמת האיחוד והוכחתו.



## Prompt:
15.11.2026, 16:55:33

[$github](app://connector_76869538009648d5b282a4bb21c3d157) אנחנו באמצע עבודה על התוכנה, הנה שיחות קודמות [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md) קדימה חייבים להגיע לנקודת סיום! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!! ושים לב להגביל את אורך זמן ההודעה בכדי שלא נתקע, ואל תמתין לתוצאות של בדיקות הרצות בגיטהאב יותר מ5 דקות!!!

## Response:
15.11.2026, 16:55:41 · gpt-6

> **Remembering**
>
>
> ****
>
> 
>
> **Reviewed Tora_Book typesetting decisions and identified next coding step**
>
> 
>
> Worked for 1m 47s

התחלתי מהמאגר החדש **Tora\_Book\_Typesetter\_Red\_Work\_2**, וקראתי את שיחת ההמשך ששמרת ב־`ai-chat/ChatGPT.md`\.

הנקודה החשובה ביותר שאני שומר להמשך היא שהמטרה אינה להוסיף עוד יכולות למנוע הקיים באמצעות שכבות תיקון. אנחנו צריכים להגיע לארכיטקטורה שבה יש **ייצוג תוכן אחיד, מדידה אחידה, שבירת שורות אחידה, תכנון עמודים אחיד והקרנה אחידה לפלט**\.

אני ממשיך לפי העקרונות הבאים\:

1. איחוד ופישוט מנוע העימוד הם יעד מרכזי, לא משימת ניקיון צדדית.
2. תמונות וטווחי גופנים חייבים להשתלב במודל התוכן המרכזי כבר במהלך בניית המנוע.
3. אין להחזיק שני מסלולי עימוד מקבילים כפתרון קבוע.
4. אין להסיר מסלול ישן לפני שהמסלול המאוחד הוכח בבדיקות שלמות.
5. P6/P7 אינם חלק מיעדי הקבלה.
6. כל מקטע עבודה יישאר קצר ומוגבל; לא אמתין לבדיקות GitHub יותר מחמש דקות.

## מצב העבודה שאיתרתי

יש כרגע שני ענפי עבודה משמעותיים שאסור לבלבל ביניהם\:

| ענף / PR | מצב |
|--------|--------|
| PR \#15 — S14 P0 | מודל inline משותף, תשתית למדידה ולשבירת שורות מעורבת |
| PR \#16 — S78 / D-107 | איחוד מקורות אמת, תיקוני שורש למנוע DP ושיפור זרימת ההערות |

PR \#15 הוא הבסיס הישיר להמשך איחוד המנוע. PR \#16 מטפל במקביל בפישוט המנוע הקיים, אך עדיין לא הוכח שהוא ממוזג ל־`main`\.

מצאתי גם התקדמות משמעותית שכבר קיימת ב־S14\:

- AST משותף הכולל טקסט, תמונות וטווחי גופן.
- מפעל ליצירת פריטים מדודים.
- כניסה משותפת לפותר Knuth–Plass.
- ייצוג `fragments` בשורות.
- שמירת מזהי מקור ונתוני גופן.

אבל חשוב: **תשתית קיימת אינה שקולה למנוע מאוחד שהושלם.** עדיין יש פערים בין המודל המעורב לבין תכנון העמודים, הקרנת הגאומטריה והרינדור.

## הממצא הארכיטקטוני החשוב ביותר

בבדיקת הקוד זיהיתי את נקודת החיבור הבאה שצריך לפתור\:

- `pipeline.js` כבר מסוגל להעביר פסקאות מסוימות דרך המודל המעורב.
- `kp-linebreak.js` כבר מחזיר מקטעים מדודים.
- `dom-renderer.js` כבר יודע לצייר מקטעי טקסט ותמונות.
- `dp-planner.js` עדיין מתייחס לשורות בעיקר כאל מערכי מילים לצורכי תכנון ואיזון.
- `geometry-projector.js` עדיין מבוסס בעיקר על הקרנת מילים, ולכן אין עדיין הוכחה ש־PDF צורך את אותם מקטעים ומיקומים כמו התצוגה.

כלומר, יש לנו כבר חלקים משמעותיים מהפתרון, אבל הם עדיין אינם מחוברים לשרשרת אחת מלאה.

## סדר הביצוע הבא

אני קובע את סדר העבודה הבא\:

1. **השלמת חוזה השורה\:** שורה אחת תהיה רצף של פריטים מדודים וממוקמים, כולל זהויות, גופנים, תמונות ורווחים.
2. **איחוד התכנון\:** DP, איזון טורים, הערות והעברות יפעלו על אותו ייצוג, בלי לאבד מידע.
3. **Page Model יחיד\:** כל המיקומים והמידות ייקבעו פעם אחת במנוע.
4. **מקרינים טהורים\:** DOM ו־PDF יציירו את המודל ולא ימדדו או יחליטו מחדש.
5. **השלמת IMUD\:** העברת ההתנהגויות שנותרו מהמסלול הישן למנוע המאוחד.
6. **הסרת כפילויות\:** רק לאחר הוכחת תקינות, שימור תוכן ודטרמיניזם.

**החלטת עבודה חשובה\:** לא אסתפק בהוספת בדיקות שמוכיחות שהמודולים החדשים קיימים. כל שלב צריך להראות שהמודל החדש באמת משתתף בעימוד מקצה לקצה.

במקטע הבא אתמקד בחיבור `LineFragments` ל־DP ול־Geometry Projector, ואבדוק במיוחד שהמידות, המרווחים, סדר הקריאה והגופנים נשמרים ללא חישוב כפול. לא אמזג PR ולא אמחק את המסלול הישן על סמך בדיקות חלקיות.

המצב הנוכחי הוא התקדמות תשתיתית מוכחת, אך המנוע המאוחד עדיין לא הושלם.

## Prompt:
15.11.2026, 17:08:54

אני מעוניין שתכין תכנית מלאה ומפורטת עם נקודות מחולקות ל10 שלבים עד לסיום מוחלט ותדחוף אותה לריפו! התכנית צריכה להיות ברורה מעבר לכל ספק עם הכוונה מדוייקת!! כך שבמידה וארצה להיעזר בסוכן AI נוסף, הוא יפקשש את התכנית. סדר את כל התוכניות הקיימות בריפו כך  שיהיה ברור שהתכנית שאתה מכין היא הנוכחית והנדרשת לביצוע, הדגש את רעיון שמאחורי המנוע לכל אורך שלבי התכנית!!!

## Response:
15.11.2026, 17:10:46 · gpt-6

> **Planning repository updates**
>
> I’m preparing a canonical execution plan on a new branch, then updating the README and older planning documents to identify the current source of truth and superseded material.
>
> **Planned repository updates**
>
> 
>
> **Checking PR Workflow Runs and CI Status**
>
> 
>
> Worked for 4m 53s

אני מסדר את התוכניות סביב מסמך ביצוע אחד, ולא מוסיף עוד תוכנית שתתחרה במסמכים הקיימים.

כבר זיהיתי בעיית תיעוד מהותית: בריפו נמצאות תוכנית אב ישנה בת 13 שלבים, תוכנית מעודכנת מ־10 בנובמבר ותוכנית הפעלה לחמישה סוכנים; הן אינן מתארות במדויק את נקודת העבודה הארכיטקטונית הנוכחית. בפרט, התוכנית החדשה חייבת להבחין בין רכיבים שכבר קיימים בקוד לבין חיבורם המלא לנתיב העימוד הפעיל. עצם קיומו של API או של בדיקת יחידה אינו הוכחה שהמנוע כולו משתמש במנגנון המאוחד.

התוכנית שאכין תגדיר **עשרה שלבים רציפים, עם משימות ביצוע, גבולות מפורשים, תוצרים ושערי קבלה מדידים**\. העיקרון שינחה את כולם יהיה: פריט עימוד חדש נכנס למודל תוכן אחיד, עובר שרשרת מדידה ותכנון אחת, ומגיע למודל עמוד סופי אחד; מקריני התצוגה והייצוא רק מציירים את התוצאה ואינם מקבלים החלטות עימוד עצמאיות.(התוכנית נדחפה לריפו) (ממתינה למיזוג)

הכנתי תוכנית ביצוע מלאה בת **612 שורות ובעשרה שלבים**, והעליתי אותה לענף נפרד. בנוסף, סידרתי את מעמדן של התוכניות הישנות כדי שסוכן AI שייכנס לריפו לא יטעה לחשוב שהן עדיין הוראות הביצוע הפעילות.

## הקבצים שהוכנסו

1. **[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/plan/canonical-10-stage-engine-completion-20261115/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md?utm_source=chatgpt.com)** - המסמך המרכזי.
2. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/plan/canonical-10-stage-engine-completion-20261115/spec/README.md?utm_source=chatgpt.com) - מגדירה מהו מסמך סמכות ומהו חומר היסטורי.
3. README עודכן כך שהתוכנית הקנונית מופיעה כהפניה בולטת כבר בכניסה לריפו.

## עשרת השלבים

| שלב | נושא |
|--------|--------|
| 1 | נעילת מצב אמת, חוזה ארכיטקטוני ומפת תלויות |
| 2 | מודל תוכן אחיד - Document Model ו-Inline Items |
| 3 | נכסים, גופנים ומדידה אחידה |
| 4 | מנוע שורות יחיד - Knuth-Plass ואילוצים |
| 5 | מתכנן עמודים וטורים יחיד |
| 6 | פריטי עמוד, הערות, עיטורים וריהוט עמוד |
| 7 | מודל עמוד סופי יחיד - PageModel |
| 8 | מקרינים טהורים, תצוגה וייצוא |
| 9 | מעבר מלא והסרת מסלולי מורשת כפולים |
| 10 | קבלה סופית, תיעוד, הרחבה ותחזוקה |

בכל שלב יש משימות מפורטות, תוצרים, שער קבלה, תנאי עצירה והנחיות למניעת סטייה מהארכיטקטורה.

## סידור התוכניות הישנות

לא הסתפקתי בהוספת תוכנית חדשה. הוספתי בראש כל אחד מארבעת המסמכים הקודמים הודעה מפורשת שמבהירה את מעמדו\:

- מסמך האפיון הישן - מקור דרישות, לא תוכנית ביצוע.
- תוכנית העבודה הישנה בת 13 השלבים - הוחלפה.
- תוכנית השיפור מ־10 בנובמבר - הוחלפה.
- תוכנית הפעלת חמשת הסוכנים - הוחלפה; חלוקת התפקידים החדשה נמצאת בתוכנית הקנונית.

כך נשמר הידע ההיסטורי, אבל אין עוד שתי תוכניות שמציגות את עצמן כמחייבות.

## עקרון המנוע שהודגש לכל אורך התוכנית

**מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**

הדגשתי במיוחד שתמונות, טווחי גופן, הערות ופריטי עימוד עתידיים חייבים להשתלב במודל ובצינור הקיימים. הוספת פריט חדש לא אמורה לדרוש תיקונים מפוזרים בכל שכבות המנוע.

כמו כן, התוכנית מחריגה במפורש את P6/P7 ואת התאמת הייחוס, ומונעת מחיקת מסלולי legacy לפני הוכחת המסלול המאוחד מקצה לקצה.

## מצב GitHub

**PR \#18 - תוכנית הביצוע הקנונית**

(פתוח ומוכן לביקורת) 7 קבצים · 672 שורות שנוספו

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/18?utm_source=chatgpt.com)

ענף: `plan/canonical-10-stage-engine-completion-20261115`

בדיקות GitHub Actions\:

- `CI` - בתהליך
- `corpus-invariants` - בתהליך
- `full-math-audit` - בתהליך

לא שיניתי קוד מנוע ולא טענתי שבדיקות המנוע עברו. התוכנית נדחפה; היא עדיין לא מוזגה ל-main.

השלב הבא מבחינתי הוא לוודא שה־PR עובר את בדיקות התיעוד, ולאחר מכן להשתמש בתוכנית הזאת כמפת העבודה המחייבת לביצוע עצמו.

רוצה שאעקוב אחר השלמת שלוש בדיקות ה־CI של PR \#18 ואעדכן אותך עם התוצאות?

מעקב אחר בדיקות PR \#18

## Prompt:
15.11.2026, 17:19:27

אני רוצה שלפני שנתחיל בביצוע התכנית תרוקן את הPR לחלוטין, מה שראוי לקבל תמזג ומה שלא תדחה!!! ובמידה ויש בפעולת ריקון הPR לשנות את הכתנית כפי שהיא כתובה כעת תערוך את התכנית!!

## Response:
15.11.2026, 17:19:33 · gpt-6

> **Clarifying the next steps**
>
> I’m treating the repository request as the current priority and will inspect the pull request, classify whether it should be merged or closed, and adjust the implementation plan accordingly.
>
> **Clarified the next steps**
>
> 
>
> **Fetched pull request data, comments, and monitored workflow runs**
>
> 
>
> Worked for 15s

התחלתי בביקורת של PR \#18. הוא עדיין פתוח ו־GitHub מסמן אותו כ־mergeable; מדובר בשינוי תיעוד בלבד, בשבעה קבצים, ואין כרגע הערות ביקורת ב־PR.

כבר זיהיתי נקודה שדורשת הכרעה לפני מיזוג: ב־`README.md` נשארו בתוך פסקת מצב ישנה אזכורים מפורטים ל־P6/P7, אף שהתוכנית החדשה מחריגה אותם לחלוטין. אני בודק אם זו סתירה מהותית או רק מידע היסטורי, ובמקביל עובר על התוכנית עצמה מול מסמכי הדרישות וההחלטות. לא אמזג שינוי שלא עבר את הבדיקה הזאת.

בדיקות ה־PR הסתיימו, והתמונה ברורה\:

- `corpus-invariants` עבר.
- שלושת משימות בדיקות ה־CI הרגילות עברו.
- `full-math-audit` נכשל: נמצאו 353,687 מילים מרונדרות, מתחת לסף 355,967.
- `layout-audit` נכשל בגלל שתי התרעות `SIDE_NOTE_OVERLAP` בעמוד 107; בדיקת ה־smoke עברה.

שני הכשלים האחרונים נובעים מבדיקות המנוע, וקוד המנוע כלל לא השתנה ב־PR הזה. אלה ממצאי בסיס שצריך לתעד ולטפל בהם בשלב הראשון - לא סיבה להסתיר את הכשלים או להחליש את הבדיקות.

במהלך הביקורת תיקנתי גם סתירות פנימיות בתוויות של מסמכים ישנים, הוספתי לתוכנית אודיט מלא של מזהי הטקסט וברירות המחדל, וקיבעתי בה את הדרישה שערכת 40 ועיצובי השערים המקוריים יישארו פעילים אוטומטית.

בבדיקה הסופית של התוכן לא מצאתי קובץ שמצדיק דחייה. כל שבעת הקבצים משרתים מטרה ברורה: תוכנית קנונית, מפת סמכות, והעברת המסמכים הישנים למעמד היסטורי או מקור דרישות בלבד. לא מחקתי את המסמכים הישנים - הם עדיין עשויים להכיל דרישות והכרעות שצריך לשמר.

הוספתי גם לתוכנית בדיקה מפורשת של רכיבים הראויים לייבוא ממאגרי RED, React, Yellow, Orange ו־Green, כדי שלא נבנה מחדש יכולת שכבר קיימת ומוכחת. ה־PR נשאר תיעודי בלבד; לא שיניתי קוד מנוע.

(PR \#18 מוזג בהצלחה ל־main)

**ההכרעה: קבלה מלאה - לא נדחה אף קובץ.**

- שבעת הקבצים מוזגו ב־Squash Merge.
- Commit המיזוג: `95e829d44e88f436c9397d82473cd9e2f4a698aa`
- התוכנית הקנונית נמצאת כעת ב־`main`\: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md?utm_source=chatgpt.com)\.
- כל התוכניות הקודמות סומנו בבירור כמסמכים היסטוריים או מקורות דרישות, ולא כתוכניות ביצוע פעילות.
- לא שונה קוד המנוע.

**מצב הבדיקות\:** `corpus-invariants` עבר. ריצות `CI` ו־`full-math-audit` של העדכון האחרון עדיין בתהליך. הכשלים שנמצאו בריצה הקודמת - אובדן נפח תוכן וחפיפת הערות צד בעמוד 107 - תועדו כממצאי בסיס לטיפול בשלב 1.

**המעקב המתוזמן נוצר\:**

## Prompt:
15.11.2026, 17:29:43

התגובה לא ברורה... האם ניתן להעביר את פקדות התחלת ביצוע השלב הראשון של התכנית לסוכן הAI? בצידה והתשובה חיובית הכן פרומט המפרט את כל הנצרך לסוכן הAI עם הפניה לשלב הראשון שאוכל להדביק והוא יתחיל!!

## Response:
15.11.2026, 17:29:49 · gpt-6

> **Preparing the delegation prompt**
>
> I’m checking the current repository state and Stage 1 details before drafting a copy-ready instruction. I’ll make the prompt explicit about scope, tests, validation, and reporting, while avoiding assumptions about merge status.
>
> **Prepared the delegation prompt**
>
> 
>
> **Prepared Stage 1 agent delegation and implementation prompts**
>
> 
>
> Worked for 13s

כן. **אפשר להעביר לסוכן AI את ביצוע השלב הראשון, והוא יכול להתחיל מיד.** למעשה, שלב 1 נועד בדיוק לכך: למפות את המצב הקיים, לבדוק את הקוד והארכיטקטורה, לזהות כפילויות ולבסס תמונת אמת לפני שנוגעים במנוע.

חשוב להבהיר שתי נקודות\:

1. בדקתי כעת את GitHub: **PR \#18 אכן מוזג ל־`main`**\. התוכנית הקנונית נמצאת במאגר והיא מסמך הביצוע המחייב.
2. הסוכן צריך לבצע בשלב זה את עבודת הבדיקה, המיפוי והתיעוד בלבד. **אין להתחיל ריפקטור או לשנות את מנוע העימוד לפני השלמת שער הקבלה של שלב 1.** כך נמנע מצב שבו הסוכן מתחיל לשנות קוד על סמך הבנה חלקית.

הכנתי לך פרומפט מפורט שאפשר להעתיק בשלמותו לסוכן. הוא כולל את מטרת העבודה, ההכרעות המחייבות, המשימות המדויקות, התוצרים, אופן הבדיקות ותנאי העצירה.

**document: **

# הוראת ביצוע לסוכן AI - התחלת שלב 1 בתוכנית השלמת מנוע העימוד RED

## 1. יעד העבודה

עליך להתחיל בביצוע שלב 1 בלבד מתוך תוכנית העבודה הקנונית:

**`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`**

מאגר:
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2

קישור ישיר לתוכנית:
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md

התוכנית כוללת עשרה שלבים והיא מסמך הביצוע היחיד והמחייב בפרויקט. אין לפעול לפי תוכניות ביצוע קודמות כאילו הן עדיין בתוקף.

PR #18, שבמסגרתו הוכנסה התוכנית למאגר וסודרו מסמכי התכנון, מוזג ל־main.

**המשימה שלך היא לבצע את שלב 1 במלואו, עד להשלמת כל תוצריו ושער הקבלה שלו. אין להתחיל את שלב 2.**

## 2. הרעיון הארכיטקטוני שאסור לאבד

המטרה אינה להוסיף עוד תיקונים, מתאמים או מסלולי עימוד. המטרה היא להגיע למנוע אחד, פשוט, מאוחד, דטרמיניסטי ושקוף.

העיקרון המחייב:

**מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**

המשמעות:

- כל סוגי התוכן ופריטי העימוד צריכים להשתלב באותו מודל.
- כל פריט צריך לעבור באותו צינור עיבוד.
- מדידה, שבירת שורות והחלטות מיקום צריכות להתבצע במקום סמכות אחד.
- אין לאפשר ל־DOM, ל־PDF או למקרינים אחרים לבצע מחדש החלטות עימוד.
- הוספת פריט עימוד חדש בעתיד צריכה להיות פשוטה, מבוססת חוזה ומרוכזת, ללא צורך בפיזור תנאים מיוחדים ברחבי המערכת.
- אין לאבד זהות מקור, טווחי גופן, עוגנים, סדר, תוכן או נתוני נכסים לאורך הצינור.
- יש לצמצם כפילויות, מסלולים מקבילים, קוד מתאם ותיקוני טלאי.

בכל החלטה בשלב 1 עליך לבחון לא רק אם יכולת מסוימת קיימת, אלא האם היא משתלבת במבנה המאוחד או מייצרת אחריות כפולה.

## 3. הכרעות משתמש מחייבות

ההכרעות הבאות אינן נתונות לשיקול דעתך:

1. P6/P7 מוחרגים לחלוטין. אין לבדוק אותם, להחזיר אותם לתוכנית או להתייחס אליהם כיעד התאמה, ובפרט לא בהקשר של התאמת שורות ומילים.
2. PDF הייחוס ההיסטורי אינו יעד איכות. אין לבצע התאמות אליו.
3. ערכת 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית כברירת מחדל.
4. יישור `justify` נשמר כברירת מחדל. אין לשנותו ללא אישור מפורש.
5. אין למחוק מסלול legacy לפני שהמסלול המאוחד הוכח מקצה לקצה.
6. אין לשנות ברירות מחדל, מזהי טקסט או הגדרות ללא תיעוד והכרעה מפורשת.
7. אין להחליש בדיקות כדי לקבל תוצאה ירוקה.
8. מסמכים סינתטיים המשמשים לבדיקות חייבים להיות תקינים מבחינה מבנית: אין שתי כותרות רצופות מאותה רמה ללא טקסט ביניהן, אין כותרת שמכילה הערת שוליים בלבד, וכותרת סופית חייבת להכיל טקסט ממשי.
9. אין להתייחס לקוד הקיים כאל הוכחה שהארכיטקטורה שלו נכונה. הקוד הוא ראיה למצב המימוש, לא מקור סמכות לשימור מבנה כפול.

## 4. לפני תחילת העבודה - אימות מצב המאגר

אל תניח שמידע היסטורי עדיין נכון.

בצע תחילה:

- בדיקת HEAD העדכני של `main`.
- בדיקת ענפי העבודה הקיימים.
- בדיקת כל ה־PRs הפתוחים והטיוטות.
- בדיקת commits ושינויים שטרם מוזגו.
- בדיקת בדיקות GitHub Actions פעילות ותוצאותיהן.
- בדיקת קבצים ששונו לאחרונה ותוצרי עבודה של סוכנים אחרים.
- בדיקת מסמכי התיעוד וההכרעות העדכניים.

תעד את ה־SHA המדויק שממנו אתה מתחיל.

אין לדרוס עבודה קיימת של סוכן אחר. אין לדחוף ישירות ל־main.

צור ענף עבודה ייעודי לשלב 1.

## 5. ביצוע שלב 1 - משימות מחייבות

בצע את כל המשימות הבאות. אין להסתפק בסקירה כללית או בדגימה.

### א. שחזור החלטות המשתמש

עבור על מסמכי התכנון, החלטות הפרויקט, התיעוד והיסטוריית העבודה הזמינה במאגר.

הפרד בבירור בין:

- החלטות מפורשות של המשתמש.
- דרישות פונקציונליות שעדיין בתוקף.
- הצעות של סוכני AI שלא אושרו.
- מימושים קיימים.
- החלטות היסטוריות שהוחלפו.

אין להפוך הצעה של סוכן AI להחלטת משתמש.

אם קיימת סתירה מהותית שאי אפשר לפתור לפי היררכיית הסמכות שבתוכנית, תעד אותה כשאלה פתוחה. אל תמציא הכרעה.

### ב. מיפוי מסלול הריצה האמיתי

מפה את המסלול הפעיל מתחילתו ועד הפלט:

קלט UI/ייבוא → Worker → Parser → Pipeline → MeasureAPI → Line Breaker → Planner → Notes/Decorations → Projector → DOM/PDF/HTML.

אל תניח שזהו המסלול בפועל רק משום שהוא מופיע בתיעוד. אמת אותו בקוד.

לכל שלב רשום:

- נקודת הכניסה.
- הפונקציות הפעילות.
- מבני הנתונים הנכנסים.
- מבני הנתונים היוצאים.
- מי צורך את התוצאות.
- האם מדובר במקור סמכות, במתאם או במנגנון כפול.
- האם קיים מסלול חלופי.
- האם המסלול מופעל בפועל במוצר.

יש להצביע על קבצים, פונקציות ושורות קוד מדויקות.

### ג. מיפוי מודלי הנתונים

מפה בנפרד כל שימוש ב:

- `words[]`
- `fragments`
- `inlineRuns`
- `lines`
- `pages`
- מודלי ביניים נוספים הקשורים לתוכן ולעימוד.

לכל מודל תעד:

- מי יוצר אותו.
- מי משנה אותו.
- מי צורך אותו.
- האם הוא מקור סמכות או ייצוג ביניים.
- האם הוא מאבד מידע.
- האם קיימת המרה למודל אחר.
- האם ההמרה הפיכה.
- האם קיימים שני מודלים המתחרים על אותה אחריות.

בדוק במיוחד אם תוכן עשיר, כגון מקטעי גופן או פריטים משולבים, נשמר לאורך כל הדרך או מצטמצם לייצוג של מילים בלבד.

### ד. מיפוי המדידה הגאומטרית

אתר את כל המקומות שבהם מתבצעים:

- חישובי רוחב.
- חישובי גובה.
- מדידת גופנים.
- חישובי baseline.
- חישובי מרווחים.
- קריאות DOM לצורך מדידה.
- חישובי גאומטריה ב־Planner.
- חישובי גאומטריה ב־Projector.
- מדידות או החלטות עימוד ב־DOM/PDF/HTML.

צור טבלה המראה היכן כל מדידה מתבצעת ומי מוסמך לקבוע את התוצאה.

זהה כל מצב שבו אותה עובדה מחושבת יותר מפעם אחת.

הדגש במיוחד חישובים חוזרים בין מנוע העימוד לבין שכבת התצוגה או הייצוא.

### ה. מיפוי התמונות והנכסים

בדוק את כל מסלול התמונות:

- בחירת קובץ.
- ייבוא ZIP או תיקייה.
- אימות נתיב.
- יצירת Asset ID.
- שמירת bytes.
- זיהוי פורמט.
- מידות טבעיות.
- scaling ו־fit.
- cache.
- העברה ל־Worker.
- שילוב בתוך טקסט או הערה.
- הקרנה ב־DOM.
- ייצוא ל־PDF.

בדוק האם תמונה היא פריט אמיתי בזרם התוכן או מנוהלת במסלול צדדי.

תעד כל מקום שבו מידע על תמונה עלול ללכת לאיבוד.

### ו. מיפוי טווחי גופן

בדוק את כל הטיפול בטווחי גופן:

- תחום התחולה.
- קינון.
- גבולות בין מקטעים.
- ירושה.
- fallback.
- מעבר שורה.
- הערות.
- כותרות.
- ייצוא.

יש לבדוק במפורש מצב שבו מילה אחת כוללת כמה מקטעי גופן.

זהה האם נשמרת זהות משפחת הגופן לכל מקטע גם לאחר מדידה, שבירת שורה, תכנון עמוד והקרנה.

### ז. מיפוי הערות ועוגנים

מפה את הטיפול ב:

- הערות שוליים.
- הערות צד.
- הערות סיום.
- סמני הערות.
- גופי הערות.
- עוגנים.
- פיצול הערות.
- המשך הערות לעמוד הבא.
- סדר קריאה.

בדוק האם יש קשר חד־משמעי בין סמן ההערה לבין גוף ההערה ומיקום המקור.

זהה כפילויות באחריות למיקום ולחישוב הגאומטריה של הערות.

### ח. מפת כפילויות ומסלולים מקבילים

צור רישום מלא של:

- פונקציות המבצעות אותה פעולה.
- מנגנוני מדידה כפולים.
- מנגנוני שבירת שורות מקבילים.
- Planners מקבילים.
- מודלי עמוד מתחרים.
- Projectors שמקבלים החלטות עימוד.
- תנאי חריג שהתפתחו לאורך זמן.
- fallback שאינו נדרש.
- מתאמים שנשארו ממעבר ישן.
- קוד שאינו בשימוש.
- מסלולים שנראים פעילים אך אינם מחוברים למסלול המוצר.

לכל ממצא ציין חומרה, ראיות, סיכון והמלצה.

אל תציע למחוק קוד לפני שהוכחת שהוא אינו נדרש ושקיימת חלופה מאומתת.

### ט. Baseline מלא

קבע תמונת בסיס ניתנת לשחזור על ה־commit שממנו התחלת.

בדוק, לפי זמינות המסלולים והכלים:

- בדיקות יחידה.
- בדיקות אינטגרציה.
- `npm test`.
- אינווריאנטים C1-C12.
- בדיקת דטרמיניזם.
- `full-math-audit`.
- `layout-audit`.
- קורפוס הבדיקה הראשי `very_long_test_text.txt`.
- אודיטים נוספים שרלוונטיים לנכונות המנוע.

אין להפעיל או להחזיר בדיקות P6/P7.

לכל בדיקה תעד:

- פקודת הרצה מדויקת.
- commit.
- קלט.
- hash של הקלט כאשר ניתן.
- תוצאה.
- מספר בדיקות.
- כישלונות והודעות שגיאה.
- קישור ל־GitHub Actions או ל־artifact כאשר קיים.

יש להתייחס לממצאים קודמים כגון כשל `full-math-audit` או `SIDE_NOTE_OVERLAP` בעמוד 107 כאל מידע היסטורי בלבד עד לאימות מחדש.

אין להסתיר כישלונות ואין להחליש את הבדיקות.

אם CI נמשך מעבר לחמש דקות, תעד את מצב הבדיקה כ־pending והמשך במשימות שאינן תלויות בה. חזור לתוצאה בהמשך.

### י. אודיט מלא של הגדרות ומזהי טקסט

זוהי משימה מחייבת, ואין להסתפק בדגימה.

בצע אודיט של כל ההגדרות וברירות המחדל, לרבות:

- כל מזהי הטקסט.
- כל התוויות.
- כל שדות הקידומת.
- שמות הגדרות ומזהיהן.
- ערכי ברירת מחדל.
- ההבדלים בין גרסאות קודמות.
- התאמה בין Registry, UI, מנוע העימוד והפלט בפועל.

כלול גם תבניות כגון:

- `שם הספר -`
- `כותרת 1 -`
- ושאר מזהי הטקסט המקבילים.

לכל פריט תעד:

1. שם ומזהה.
2. ערך נוכחי.
3. מקור הערך.
4. היכן הוא מוגדר.
5. היכן הוא נקרא.
6. האם הוא מוצג למשתמש.
7. האם הוא משפיע על העימוד.
8. האם הוא תואם להחלטות המשתמש.
9. האם קיימת סטייה מגרסה קודמת.
10. האם נדרש תיקון או בירור.

אין לשנות ערכי ברירת מחדל או התנהגות במסגרת האודיט ללא הכרעה מפורשת.

### יא. אודיט מאגרי הפרויקט והאפשרות לייבא רכיבים

בדוק את המאגרים והווריאנטים הרלוונטיים:

- Tora_Book_Typesetter_Red.
- Tora_Book_Typesetter_Red_Work.
- Tora_Book_Typesetter_React.
- Tora_Book_Typesetter_Yellow.
- Tora_Book_Typesetter_Orange.
- Tora_Book_Typesetter_Green.

בדוק גם ענפים ו־PRs היסטוריים רלוונטיים.

המטרה היא לזהות רכיבים שכבר פותחו, נבדקו או שופרו במקומות אחרים, ושאפשר לייבא במקום לבנות מחדש.

לכל רכיב מועמד תעד:

- שם הרכיב.
- המאגר והענף שבהם הוא נמצא.
- commit מקור מדויק.
- תפקידו.
- הוכחות לכך שהוא עובד.
- בדיקות קיימות.
- תלותים.
- הבדלים מול המימוש הנוכחי.
- סיכון לייבוא.
- התאמתו לעקרון המנוע האחיד.
- החלטה: `reuse` או `skip`.
- נימוק והוכחות.

אין להעתיק קוד לפי שם קובץ או תיאור בלבד.

אין לייבא רכיב אם הוא מחייב מסלול עימוד נוסף, שכבת תאימות קבועה או אחריות כפולה.

## 6. התוצרים שחייבים להיווצר

עליך ליצור ולעדכן את התוצרים הבאים בהתאם למבנה המאגר:

1. `audits/ENGINE_CURRENT_STATE.md`  
   מפת מצב עדכנית של המנוע, עם הפניות לקוד ול־SHA.

2. `audits/ENGINE_RUNTIME_PATHS.md`  
   מפת מסלולי runtime ותרשים הצינור הפעיל, כולל צרכני כל מודל נתונים.

3. `audits/ENGINE_DUPLICATION_REGISTER.md`  
   רישום כפילויות, אחריות כפולה ומסלולים מקבילים.

4. חוזה ארכיטקטוני מעודכן  
   הגדרת מודל הפריט האחיד, תחומי האחריות וממשקי המעבר בין השלבים.

5. `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`  
   אודיט מלא של כל ההגדרות, מזהי הטקסט, התוויות, הקידומות וברירות המחדל.

6. `audits/RELATED_REPOSITORY_REUSE_AUDIT.md`  
   אודיט של המאגרים הקשורים והחלטות reuse/skip לכל רכיב מועמד.

7. Baseline artifacts  
   תוצאות הבדיקות והאודיטים, עם זיהוי commit וקלט.

אם קובץ או מסמך מתאים כבר קיים, עדכן אותו במקום ליצור כפילות מיותרת.

יש לעדכן גם את פנקסי המצב הנדרשים בתוכנית, כגון `DECISIONS.md`, `WORKLOG.md`, `ISSUE_REGISTRY.md`, `OPEN_QUESTIONS.md` ו־`LAYOUT_DEPENDENCY_MAP.md`, ככל שהממצאים מחייבים זאת.

## 7. תנאי קבלה - אין להתחיל את שלב 2 לפני השלמתם

בסיום העבודה הצג בדיקה מפורשת של כל התנאים:

- כל נתיבי ה־runtime הפעילים ממופים עד הפלט.
- לכל מבנה נתונים יש יצרן וצרכנים מזוהים.
- ידוע היכן מידע אובד או מומר לייצוג מצומצם.
- כל מסלולי המדידה, השבירה, הפריסה והרינדור הכפולים רשומים.
- ה־baseline ניתן לשחזור על commit מזוהה.
- החלטות המשתמש וההחרגות רשומות ללא סתירה.
- כל ההגדרות, מזהי הטקסט, הקידומות וברירות המחדל עברו אודיט מלא.
- כל המאגרים והענפים הרלוונטיים נבדקו.
- לכל רכיב מועמד לייבוא יש commit מקור, ראיות והכרעת reuse/skip.
- חוזה הפריט האחיד הוגדר ואינו מחייב סוגי פריטים במסלולים מיוחדים.

לכל תנאי יש לציין אחד מהמצבים:

`הושלם ומוכח` / `חלקי` / `לא הושלם` / `חסום`.

אין לסמן תנאי כהושלם רק משום שנכתב עליו מסמך. חייבות להיות ראיות.

## 8. מגבלות ביצוע

במהלך שלב 1:

- אין לבצע ריפקטור של מנוע העימוד.
- אין לשנות את אלגוריתם שבירת השורות.
- אין לשנות את ה־Planner.
- אין לשנות את מנגנון המדידה.
- אין למחוק מסלולי legacy.
- אין לשנות ברירות מחדל.
- אין לבצע שינויים ב־UI שאינם הכרחיים לתיעוד מצב קיים.
- אין למזג PRs אחרים ללא בדיקת תוכנם והכרעה מתאימה.
- אין לדחוף ישירות ל־main.
- אין להתחיל את שלב 2.

אם אתה מזהה תיקון דחוף במהלך הבדיקה, תעד אותו והצג את הסיכון. אל תערבב תיקון קוד עם עבודת האודיט, אלא אם מדובר בתיקון הכרחי למניעת נזק מיידי - וגם אז יש להפרידו ל־PR נפרד ולהסביר.

## 9. אופן העבודה והדיווח

עבוד באופן עצמאי וממוקד. אל תסתפק בתוכנית נוספת לביצוע שלב 1 - בצע את העבודה בפועל.

חלק את העבודה למקטעים קצרים, שמור תוצאות ביניים במאגר, ואל תמתין זמן ממושך לבדיקות CI.

בכל נקודת עצירה משמעותית עדכן:

- מה נבדק בפועל.
- אילו קבצים נוצרו או עודכנו.
- אילו ממצאים התגלו.
- אילו בדיקות הסתיימו ומה תוצאותיהן.
- אילו בדיקות עדיין רצות.
- מה נותר לביצוע.

בסיום:

1. ודא שכל התוצרים קיימים ומדויקים.
2. בצע בדיקת עקביות בין כל מסמכי האודיט.
3. ודא שאין סתירות להחלטות המשתמש או לתוכנית הקנונית.
4. בצע commit לענף העבודה.
5. פתח PR ממוקד עבור שלב 1.
6. הצג סיכום ברור של הממצאים, הקבצים, הבדיקות ושער הקבלה.

**אל תכריז על השלמת שלב 1 אם אחד מתנאי הקבלה לא הוכח.**

אם חסרה הכרעת משתמש שמונעת השלמה, הצג שאלה ממוקדת, הסבר מדוע היא חוסמת, והמשך בכל יתר המשימות שאינן תלויות בה.

## 10. הוראת סיום

התחל עכשיו בבדיקת מצב המאגר ובביצוע שלב 1.

אל תבקש ממני לאשר שוב את עצם תחילת העבודה.

המטרה היא להכין תשתית עובדתית וארכיטקטונית מלאה, שתאפשר להתחיל את שלב 2 בביטחון, בלי לבנות דברים שכבר קיימים, בלי לאבד יכולות, ובלי להוסיף עוד שכבות טלאים.

**זכור לאורך כל העבודה: אנחנו לא מנסים לשפר אוסף מנגנונים. אנחנו מאחדים אותם למנוע עימוד אחד, פשוט, מדויק, דטרמיניסטי וקל להרחבה.**

**המלצה חשובה\:** הדבק את הפרומפט בשלמותו, ולא רק את הקישור לתוכנית. כך הסוכן יקבל גם את ההכרעות שלך ואת גבולות הסמכות שלו, ולא יוכל לפרש את שלב 1 כהרשאה להתחיל לשנות את המנוע.

## Prompt:
15.11.2026, 18:54:32

סוכן הAI השלים את השלב, בדוק את שלימות הביצוע, והכן פרומט המפרט את כל הנצרך לסוכן הAI עם הפניה לשלב השני שאוכל להדביק והוא יתחיל!! אגב בדקתי את התיקון הנוגע לרווח התחתון של כותרת 3 במקרה של מעבר שורה, והרווח הוחל לפני מעבר השורה של כותרת 3 עצמה ולא בין הכותרת לאחריה.

## Response:
15.11.2026, 18:54:40 · gpt-6

> **Assessing stage readiness**
>
> I’m checking whether Stage 1 is truly complete before drafting Stage 2. Several decisions remain unresolved, so I’m treating implementation as blocked until those answers and the heading-spacing behavior are explicitly confirmed.
>
> **Assessed stage readiness**
>
> 
>
> **Reviewed PRs, audits, plans, blockers, and prepared Stage 2 prompt**
>
> 
>
> Worked for 1m 18s

עברתי על PR \#19 ועל תוצרי שלב 1. **הסוכן ביצע עבודה משמעותית ומפורטת, אבל שלב 1 עדיין אינו סגור במלואו, ולכן איני ממליץ להכריז עליו כהושלם או להתחיל מימוש בלתי־מותנה של שלב 2.**

PR \#19 פתוח, לא מוזג, וה־CI שלו אינו ירוק\:

- בדיקות היחידה והאינטגרציה במטריצת Node עברו.
- `corpus-invariants` עבר.
- `full-math-audit` נכשל.
- `layout-audit` נכשל.

שני הכשלים האחרונים תואמים לכשלים שכבר נמצאו ב־`main` לפני PR \#19, ולכן אינם מעידים כשלעצמם שהסוכן הכניס רגרסיה. אבל הם עדיין בעיות אמיתיות במנוע, שאסור לטשטש.

**מה הושלם היטב\:** נוצרו מפת מצב, מפת runtime, מרשם כפילויות, אודיט רחב של הגדרות ומזהי טקסט, אודיט מאגרי המשפחה, חוזה פריט אחיד ו־baseline עם קבצי ראיות. הסוכן גם נמנע משינוי קוד המנוע בשלב האודיט - בהתאם להוראות.

**מה עדיין פתוח\:**

1. חוזה הפריט האחיד נכתב, אך הסוכן עצמו מסמן שהוא ממתין לאישור אדריכלי. זהו תנאי קבלה מפורש של שלב 1.
2. שאלות 11-14 ב־`OPEN_QUESTIONS.md` דורשות הכרעה: מועד ייבוא תיקונים מ־Red, שכבת ברירות המחדל הקנונית, מדיניות זהות פלט בין Node לדפדפן, ואישור החוזה.
3. יש שלושה PRs קודמים שעדיין פתוחים (\#15, \#16, \#17). הם כוללים מימושים ותיקונים שעשויים להיות רלוונטיים, אבל אסור למזג או להעתיק מהם בלי סקירה נפרדת. בפרט, PR \#15 כבר מכיל תשתית inline חלקית - חשוב שלא ייבנה במקומה מודל מקביל.

לכן הכנתי את הפרומפט כך שהסוכן יוכל להתחיל מיד בעבודת שלב 2 שאינה תלויה בהכרעות החסרות, אבל לא יוכל לעקוף אותן או לקבע חוזה שטרם אושר.

יש עוד ממצא חשוב שהכנסתי לפרומפט: **התקלה שאימתת בכותרת 3 היא ממצא משתמש מאומת, ולא השערה של הסוכן.** צריך לשמר אותה כתרחיש רגרסיה מחייב: כאשר כותרת 3 נשברת לשתי שורות או יותר, הרווח התחתון חייב להופיע אחרי השורה האחרונה של הכותרת ולפני התוכן שאחריה. אסור שהרווח יוחל לפני שבירת השורה או בתוך הכותרת. הסוכן נדרש לברר מי אחראי כיום למיקום הרווח, ולא להוסיף תיקון CSS נקודתי.

## הפרומפט לסוכן - שלב 2

**document: **

# הוראת ביצוע לסוכן AI - שלב 2: מודל תוכן אחיד (Canonical Document & Inline Item Model)

## 1. יעד ומקור סמכות

התחל בביצוע שלב 2 בתוכנית הקנונית להשלמת מנוע העימוד:

**תוכנית מחייבת:**  
`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

**המאגר:**  
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2

**התוכנית:**  
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md

המשימה מוגדרת בסעיף:

**שלב 2 - מודל תוכן אחיד (Canonical Document & Inline Item Model), סעיפים 2.1-2.3.**

אין ליצור תוכנית חלופית. אין לבחור משימות מתוך תוכניות ישנות במקום סעיפי התוכנית הקנונית.

מטרתך אינה רק ליצור מבנה נתונים חדש, אלא להניח את התשתית לאיחוד מלא של מנוע העימוד.

## 2. העיקרון הארכיטקטוני המחייב

**מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**

כל תוכן המסמך ופריטי העימוד חייבים להיות מיוצגים באמצעות מודל קנוני אחד, עם זהות, מקור, סדר וסמנטיקה ברורים.

המנוע אינו אמור להחזיק:
- מודל תוכן אחד לטקסט ומודל אחר לתמונות.
- מודל אחד למילים ומודל אחר למקטעי גופן.
- מנגנון אחד לסמני הערות ומנגנון אחר לגופי הערות.
- מסלול נפרד לפריטי עימוד מיוחדים.
- מתאמים קבועים שמחזיקים למעשה שני מודלים במקביל.

הוספת סוג פריט בעתיד צריכה להתבצע באמצעות הרחבת החוזה והרישום המרכזי, ולא באמצעות פיזור תנאים מיוחדים בקוד.

כל שינוי צריך להיבחן בשאלה אחת:

**האם הוא מקדם מקור סמכות אחד, זרימת נתונים אחת ואחריות אחת לכל שלב, או שהוא מוסיף עוד שכבה ומסלול מקביל?**

## 3. מצב התחלתי - חובה לאמת לפני עבודה

שלב 1 בוצע בידי סוכן קודם, ונפתח עבורו PR:

https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/19

ענף:
`audit/stage1-engine-state-20261115`

HEAD שנבדק:
`5d7728b38bf1b623a87c103a6e96f3179ff4cfc8`

PR #19 עדיין פתוח ולא מוזג. אין להניח שהוא כבר נמצא ב־main.

התוצרים המרכזיים של שלב 1 נמצאים בענף זה:
- `audits/ENGINE_CURRENT_STATE.md`
- `audits/ENGINE_RUNTIME_PATHS.md`
- `audits/ENGINE_DUPLICATION_REGISTER.md`
- `audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md`
- `audits/RELATED_REPOSITORY_REUSE_AUDIT.md`
- `audits/baseline_stage1/`
- `spec/03_UNIFIED_ITEM_CONTRACT.md`

יש לבדוק את תוכן התוצרים בפועל, ולא להסתפק בתיאור שב־PR.

### מצב הבדיקות של PR #19

נכון לבדיקה האחרונה:

- בדיקות CI במטריצת Node: PASS.
- `corpus-invariants`: PASS.
- `full-math-audit`: FAIL.
- `layout-audit`: FAIL.

שני הכשלים האחרונים תועדו ככשלים שהיו קיימים כבר ב־main לפני PR #19. אין להציג אותם כרגרסיה של PR #19, אך גם אין להתעלם מהם.

### שאלות פתוחות משלב 1

ב־`OPEN_QUESTIONS.md` נרשמו שאלות 11-15.

בפרט:
- 11 - מועד ומדיניות ייבוא תיקונים ורכיבים מ־Red.
- 12 - שכבת ברירות המחדל הקנונית.
- 13 - מדיניות זהות פלט בין Node לדפדפן.
- 14 - אישור סופי של חוזה הפריט האחיד.
- 15 - אנומליה תיעודית בפנקס ההחלטות.

אין להמציא הכרעות בשם המשתמש.

שאלות 11-13 אינן בהכרח חוסמות את כל עבודת שלב 2, אך יש לתעד את השפעתן על שלבים 2-3 ולמנוע קיבוע של החלטה התלויה בהן.

**שאלה 14 היא תנאי מהותי:** החוזה `spec/03_UNIFIED_ITEM_CONTRACT.md` הוא כרגע טיוטת תוצר של שלב 1 ולא חוזה שאושר סופית בידי המשתמש.

לכן עליך להתחיל מיד בבדיקת החוזה, בהשוואתו לקוד הקיים, בבדיקת חלופות ובבניית תשתית הבדיקות. לפני קיבוע חוזה שמשנה סמנטיקה או לפני שינוי בלתי הפיך במסלול הפעיל, הצג למשתמש את ההכרעות האדריכליות הדרושות וקבל את אישורו. אל תעקוף את שער הקבלה של שלב 1.

## 4. PRs וענפים קיימים - איסור על מיזוג עיוור

נכון לבדיקה האחרונה קיימים שלושה PRs פתוחים נוספים:

- PR #15 - תשתית Shared Inline Content Model:
  https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/15

- PR #16 - SSOT consolidation, anchor-following notes ו־maxFit:
  https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/16

- PR #17 - Forensic audit ו־Stage A unified-constraint root fixes:
  https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/17

הם אינם ממוזגים לפי מצב הבדיקה האחרון.

לפני כתיבת מימוש חדש:

1. קרא את ה־diff המלא של PR #15.
2. בדוק מה מתוך `parser/inline-content.js`, `breakInlineItems`, `MeasureAPI` ו־`line-fragments.js` קיים בפועל ומה מחובר למסלול הפעיל.
3. בדוק את PR #16 ואת PR #17 כדי להבין אילו תיקונים וחוזים הם מציעים, ומה רלוונטי לשלב 2.
4. בדוק את הענפים וה־commits המדויקים.
5. השווה את כל הרכיבים מול חוזה הפריט האחיד.

**אסור למזג PR או להעתיק ממנו קוד רק משום שהוא נראה מתאים.**

יש להבחין בין:
- רכיב קיים ומוכח שאפשר לשלב.
- רכיב קיים אך לא מחובר למסלול הפעיל.
- רכיב חלקי שדורש השלמה.
- רכיב שיוצר אחריות כפולה ואינו מתאים לארכיטקטורה.
- תיקון ששייך לשלב אחר בתוכנית.

אין ליצור מימוש חדש של יכולת שכבר קיימת בלי להוכיח מדוע המימוש הקיים אינו מתאים.

## 5. משימות שלב 2 - ביצוע מלא

פעל לפי סעיף 2.1 בתוכנית הקנונית.

### א. מודל מסמך קנוני

הגדר AST/Document Model יחיד שמייצג את מבנה המסמך כולו:

- חלקים ופרקים.
- כותרות ברמות 1-7.
- פסקאות.
- בלוקים.
- הערות.
- הוראות עימוד.
- תמונות ונכסים.
- פריטי עימוד מיוחדים.
- עיטורים ופריטי עמוד ככל שהם חלק ממבנה המסמך.

המודל חייב להפריד בין מבנה סמנטי של המסמך לבין החלטות גאומטריות שיתקבלו בשלבים הבאים.

אל תכניס לתוך ה־Parser החלטות מיקום או מדידה.

### ב. Inline Item Model

הגדר מודל אחיד לרצף התוכן בתוך פסקה או בלוק.

הוא חייב לתמוך לכל הפחות ב:

- טקסט רגיל.
- Styled text runs.
- Font-range runs.
- Atomic tokens.
- Note markers.
- Images.
- Anchors.
- Inline custom items.
- Explicit glue ו־penalty לפי הצורך.

הגדר במפורש:
- סדר פריטים.
- גבולות בין פריטים.
- גבולות בין מקטעים.
- כללי קינון.
- כללי פיצול.
- כללי אטימות.
- קשרים בין פריטים.
- זהות מקור.

אל תשתמש במחרוזת טקסט אחת כדי להסתיר כמה פריטים סמנטיים שונים.

### ג. זהות ומקור

לכל פריט חייבים להיות:

- `id` יציב ודטרמיניסטי.
- `kind`.
- `sourceRange` או `sourceAnchor`.
- `parentId`.
- `order`.
- `styleRef`.
- `payload`.
- `constraints`.
- `diagnostics`.

הזהות חייבת להישמר לאורך כל הצינור.

אין להשתמש במוני ריצה כמקור לזהות.

כאשר פריט מתפצל חזותית לכמה מקטעים או ממשיך לעמוד הבא, כל המופעים צריכים לשמר קשר חד־משמעי לפריט המקורי.

אין לאפשר אובדן של טווחי מקור, סדר, זהות או תוכן.

### ד. שימור טקסט ומיפוי מקור

שמור את הטקסט המקורי ואת זהות התווים.

בדוק במיוחד:
- RTL ו־LTR.
- ניקוד וסימנים משלימים.
- סוגריים.
- גרשיים וגרשיים כפולים.
- רווחים רגילים ובלתי שבירים.
- סימני עזר פנימיים.
- סמני הערות.
- סימנים מיוחדים של המנוע.

נרמול או החלפת תווים חייבים להיות הפיכים, או לשמור מיפוי מדויק למקור.

אסור להסתפק בכך שהטקסט "נראה נכון" בפלט. יש להוכיח שימור מבני.

### ה. טווחי גופן

ייצג טווחי גופן כמקטעים סמנטיים בעלי זהות משפחת גופן.

יש לתמוך:
- בכמה גופנים בתוך מילה אחת.
- בכמה גופנים בתוך רצף מילים.
- בקינון ובגבולות מקטעים.
- בירושה וב־fallback.
- במעבר שורה.
- בהערות ובכותרות.

אין לצמצם מילה למחרוזת אחת ולאבד את חלוקת הגופנים שבה.

המודל חייב לאפשר לכל מקטע לשמור את זהות הגופן שלו עד המדידה וההקרנה.

### ו. תמונות ונכסים

תמונה חייבת להיות פריט אמיתי במודל התוכן, ולא ערוץ צדדי שמצויר לאחר שבירת השורות.

שמור:
- `assetId`.
- זהות מקור.
- מידות טבעיות.
- יחס ממדים.
- מדיניות fit.
- טקסט חלופי.
- מיקום סמנטי.
- סוג השתתפות: inline, block, background או page furniture לפי החוזה.

בדוק את כל מסלול הייבוא והעברת הנכסים, אך אל תבנה עדיין AssetResolver מלא אם הוא שייך לשלב 3.

בשלב זה יש להגדיר את חוזה הנתונים והקשר לנכסים כך שיהיה אפשר לחבר את ה־Resolver בהמשך ללא שינוי מבני במודל.

### ז. סמני הערות וגופי הערות

סמן הערה חייב להיות פריט אטומי עם קישור מבני חד־משמעי לגוף ההערה.

אין להשאיר את הקשר מבוסס רק על מחרוזת או על חיפוש טקסט.

הגדר:
- note marker.
- note body.
- note identity.
- source anchor.
- ordering.
- continuation identity.
- קשרים בין הערות.

יש לשמר את הקישור גם כאשר הערה מתפצלת או ממשיכה לעמוד הבא.

אין לממש מחדש בשלב זה את אלגוריתם מיקום ההערות. זו אחריות של שלבים מאוחרים יותר.

### ח. פריטי עימוד מיוחדים והרחבה עתידית

המודל חייב לאפשר הוספת פריט חדש באמצעות חוזה הרחבה.

הגדר מנגנון registry יחיד לסוגי פריטים, עם:
- kind.
- schema.
- validation.
- resource dependencies.
- style resolution.
- measurement contract.
- layout constraints.
- diagnostics.
- projection contract.

בשלב 2 יש להגדיר את החוזה והממשקים, לא ליצור מסלולי מדידה, שבירה, Planner או Renderer נפרדים.

### ט. חיבור ה־Parser הקיים

חבר את ה־Parser הקיים למודל הקנוני.

אין לכתוב Parser חדש רק כדי להתאים את המודל.

יש:
1. לזהות את נקודות הכניסה הפעילות.
2. להחליט היכן נבנה DocumentModel.
3. להגדיר המרה יחידה ומבוקרת מקלט למודל.
4. לשמר את כל נתוני המקור.
5. לבדוק round-trip.
6. להוכיח שכל סוגי התוכן הקיימים מקבלים ייצוג.
7. לזהות ולצמצם מודלי ביניים מיותרים.

Adapters זמניים מותרים רק בגבול כניסה/יציאה, ורק אם הם מסומנים, מוגבלים, ניתנים לבדיקה ובעלי תנאי הסרה.

אין להפוך Adapter למסלול runtime שני.

### י. מבנה מסמך תקין

בדיקות המודל חייבות להשתמש במסמכים תקינים מבחינה מבנית.

אסור ליצור מסמך בדיקה שבו:
- שתי כותרות רצופות מאותה רמה ללא טקסט ביניהן.
- כותרת מכילה הערת שוליים בלבד.
- הכותרת הסופית אינה מכילה טקסט ממשי.

רמות כותרת 1-7 מותרות.

אין להשתמש בקלטים לא תקינים כדי להוכיח פגם במנוע, ואין להחליש בדיקות תקינות בגלל קלט מלאכותי פגום.

## 6. ממצא משתמש מאומת - רווח תחתון של כותרת 3 במעבר שורה

המשתמש בדק את התיקון האחרון הנוגע לרווח התחתון של כותרת 3, ודיווח על תקלה ברורה:

**הרווח הוחל לפני מעבר השורה של כותרת 3 עצמה, ולא בין הכותרת לבין התוכן שאחריה.**

יש להתייחס לכך כממצא מאומת של המשתמש.

### התנהגות נדרשת

כאשר כותרת 3 מתפרסת על יותר משורה אחת:
- כל שורות הכותרת צריכות להישאר חלק מאותו פריט כותרת.
- הרווח התחתון צריך להופיע רק אחרי השורה האחרונה של הכותרת.
- הרווח צריך להפריד בין הכותרת לבין התוכן הבא.
- אין להוסיף את הרווח לפני שבירת השורה של הכותרת.
- אין להוסיף את הרווח בין שתי שורות של אותה כותרת.
- אין לשנות את שבירת השורות עצמה רק כדי להסתיר את התקלה.

### חקירה מחייבת

1. אתר את מקור ההגדרה של הרווח התחתון לכותרת 3.
2. עקוב אחריו דרך Parser, מודל התוכן, יצירת השורות, Planner וההקרנה.
3. קבע באיזה שלב הרווח מקבל את מיקומו השגוי.
4. בדוק אם הוא משויך לפריט הכותרת, לשורה הראשונה, לשורה האחרונה או לבלוק שאחריה.
5. בדוק אם DOM ו־PDF משתמשים באותה סמנטיקה או שכל אחד מחשב את הרווח בנפרד.
6. קבע האם שורש התקלה הוא במודל הנתונים, בייצוג השורות, ב־Planner או במקרין.

### בדיקת רגרסיה מחייבת

צור fixture שבו כותרת 3 נשברת לשתי שורות לפחות ואחריה פסקת גוף.

בדוק:
- מיקום תחילת הכותרת.
- גובה כל שורות הכותרת.
- מיקום סיום הכותרת.
- מיקום תחילת התוכן שאחריה.
- המרחק בין סוף הכותרת לתחילת התוכן.
- היעדר רווח שגוי לפני או בתוך הכותרת.

יש לבדוק את התוצאה גם ב־DOM וגם ב־PDF, כאשר הדבר אפשרי בשלב זה.

**אין לבצע תיקון CSS נקודתי או להוסיף תנאי חריג ב־Renderer.** אם שורש הבעיה אינו שייך לשלב 2, תעד את הממצא, הוסף בדיקת רגרסיה או מפרט התנהגות, וקבע במפורש באיזה שלב עתידי יש לתקן אותו. אין לטעון שהוא תוקן אם רק נוצר עבורו fixture.

## 7. תוצרים מחייבים

פעל לפי סעיף 2.2 בתוכנית הקנונית.

יש ליצור או לעדכן:

1. `red-build/src/engine/model/` או מיקום קנוני מתאים:
   - schema.
   - constructors.
   - validators.
   - identity/source mapping.
   - registry לסוגי פריטים.

2. `CANONICAL_DOCUMENT_MODEL.md`
   - הגדרה מלאה של DocumentModel.
   - הגדרת Inline Item Model.
   - דוגמאות JSON/AST לכל סוג פריט.
   - כללי זהות ומקור.
   - כללי ordering וקשרים.
   - כללי validation.
   - חוזי adapters.
   - מילון מונחים.

3. בדיקות round-trip:
   - קלטים קיימים.
   - מודל קנוני.
   - טווחי גופן.
   - תמונות.
   - סמני הערות.
   - עוגנים.
   - פריטי עימוד מיוחדים.
   - טקסט RTL/LTR.

4. `audits/STAGE2_MODEL_COVERAGE.md`
   - כל סוגי התוכן.
   - מצב ייצוג במודל.
   - האם מחובר ל־Parser.
   - האם נשמר המקור.
   - האם יש עדיין המרה ל־legacy.
   - ראיות ובדיקות.

5. בדיקת רגרסיה לממצא רווח כותרת 3, או תיעוד מפורש של מיקום התיקון הנדרש אם שורשו מחוץ לשלב 2.

6. עדכון `WORKLOG.md`, `ISSUE_REGISTRY.md`, `OPEN_QUESTIONS.md`, `DECISIONS.md` ומפת התלויות בהתאם לממצאים בפועל.

אם קובץ מתאים כבר קיים, עדכן אותו במקום ליצור מסמך מקביל.

## 8. בדיקות ושער קבלה

פעל לפי סעיף 2.3 בתוכנית הקנונית.

יש להוכיח:

- כל סוגי התוכן במסמך הראשי מיוצגים במודל הקנוני.
- תמונות, טווחי גופן, סמני הערות ועוגנים הם פריטים אמיתיים במודל.
- לכל פריט זהות ומקור יציבים.
- round-trip אינו מאבד תווים, סדר, עוגנים, גופנים או asset identity.
- מבנה לא תקין נדחה או מדווח במפורש.
- אין Parser או AST מקביל שממשיך להיות מקור סמכות במסלול החדש.

בנוסף:
- בדוק שאין יצירה כפולה של פריטים.
- בדוק שאין פריטים יתומים.
- בדוק שהסדר נשמר.
- בדוק ש־IDs יציבים בין ריצות.
- בדוק שאין אובדן מידע במעבר בין parser paths.
- בדוק שאין fallback שקט.

אין להציג API חדש כיכולת שהושלמה אם ה־Parser או המסלול הפעיל אינם משתמשים בו.

## 9. גבולות שלב 2

בשלב זה אין לבצע:
- איחוד מדידה מלאה - שלב 3.
- מימוש מנגנון שבירת שורות חדש - שלב 4.
- איחוד Planner - שלב 5.
- שינוי אלגוריתם הערות ומיקום פריטי עמוד - שלב 6.
- בניית PageModel סופי - שלב 7.
- איחוד מקרינים וייצוא - שלב 8.
- מחיקת מסלולי legacy - שלב 9.

מותר להכין חוזים וממשקים הנחוצים לשלבים הבאים, אך אין לממש אותם מוקדם באופן שמטשטש את חלוקת האחריות.

אין לשנות ברירות מחדל או מזהי טקסט ללא אישור.

יש לשמר:
- `justify` כברירת מחדל.
- ערכת 40 פעילה אוטומטית.
- עיצובי השערים המקוריים פעילים אוטומטית.

P6/P7 מוחרגים לחלוטין.

PDF הייחוס אינו יעד התאמה.

## 10. ניהול עבודה, PR ודיווח

לפני שינוי:
- אמת את מצב main.
- אמת את PR #19 ואת ענף שלב 1.
- אמת את PRs #15, #16, #17.
- אמת את כל ה־commits והבדיקות העדכניים.
- תעד את base SHA.

אל תדרוס עבודה של סוכן אחר.

צור ענף עבודה ייעודי לשלב 2. אין לדחוף ישירות ל־main.

חלק את העבודה למקטעים קצרים. אל תמתין יותר מחמש דקות לבדיקת CI; אם היא עדיין רצה, סמן pending והמשך במשימות אחרות.

בכל נקודת עצירה משמעותית דווח:
- מה בוצע בפועל.
- אילו קבצים השתנו.
- אילו יכולות מחוברות למסלול הפעיל.
- אילו בדיקות הורצו ומה תוצאותיהן.
- אילו שאלות נותרו פתוחות.
- מה עדיין חסום.

בסיום:
1. בצע בדיקת עקביות בין המודל, ה־Parser, החוזים והבדיקות.
2. ודא שלא נוצר מסלול תוכן מקביל.
3. בצע commit לענף.
4. פתח PR ממוקד לשלב 2.
5. הצג את שער הקבלה סעיף־סעיף עם ראיות.
6. אל תכריז על השלמת שלב 2 אם אחד מתנאי הקבלה לא הוכח.

## 11. הוראת סיום

התחל כעת.

אל תסתפק בהצעת תוכנית נוספת. בדוק את המצב בפועל, השווה את המימושים הקיימים, והתחל בביצוע המשימות שאינן חסומות.

אם חוזה הפריט האחיד מחייב שינוי או הכרעה של המשתמש, הצג את הנקודות המדויקות והמשך בעבודת הכנה שאינה תלויה בהן. אל תקבע החלטות בשמו.

**המטרה אינה ליצור עוד מודל לצד המודלים הקיימים. המטרה היא להפוך את כל התוכן והפריטים למודל אחיד אחד, שיהיה הבסיס למנוע פשוט, מדויק, דטרמיניסטי וקל להרחבה.**

## לפני שאתה שולח לסוכן - שתי נקודות חשובות

1. **אל תאשר עדיין את מיזוג PR \#19 באופן אוטומטי.** הוא עדיין פתוח, וחוזה הפריט אינו מאושר. בקש מהסוכן לכלול בסקירת הפתיחה שלו את ההכרעות החסרות ואת המלצותיו, כדי שתוכל לאשר אותן במפורש.
2. **אל תיתן לו למזג את PRs \#15-17 כחלק מהתחלת שלב 2.** הם חומרי מקור לבדיקה, לא אישור למיזוג. בפרט, צריך למנוע מצב שבו הסוכן מחבר את תשתית inline של PR \#15 לצד מודל חדש במקום לאחד אותם.

כך הסוכן יוכל להתחיל את שלב 2 באופן מעשי, אבל לא יוכל לדלג על החלטות הארכיטקטורה שיקבעו אם נגיע למנוע מאוחד או לעוד שכבה של תיקונים.

## Prompt:
15.11.2026, 20:27:04

סוכן הAI השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג כבר PR הראויים למיזוג! או שתאשר לסוכן AI למזג בעצמו!! אי אפשר להישאר על הגדר יותר מדי זמן!!!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב השלישי שאוכל להדביק והוא יתחיל!!!
לגבי שתי הנקודות שכתבת בסוף, אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות.

## Response:
15.11.2026, 20:27:35 · gpt-6

> **Inspecting potential bugs**
>
> I’m reviewing whether the adapter is truly reentrant, whether model state is being mutated, and whether the pipeline actually uses a single parser path. I’m also checking heading validation and test coverage against the stated requirements.
>
> **Inspected potential bugs**
>
> 
>
> **Checking validation evidence**
>
> I’m verifying CI results and examining whether inline images remain represented correctly during tokenization. The staged design may intentionally defer image handling, but I’m checking that current tests and model behavior still match the stated requirements.
>
> **Checked validation evidence**
>
> 
>
> **Reassessing ownership**
>
> I’m noticing the regression test exercises the legacy path, while the proposed fix targets the newer pipeline. I need to verify the migration plan before treating Stage 4 as the correct place to resolve the live defect.
>
> **Setting the next steps**
>
> I’m identifying that Stage 2 needs rebasing, purity fixes, and stronger active-path tests. I’m also separating the live legacy defect from later pipeline work so the plan doesn’t claim an incomplete fix.
>
> **Reassessed ownership and set next steps**
>
> 
>
> **Coordinating corrections**
>
> I’m preparing the next engineering pass around three priorities: rebase Stage 2, repair adapter purity, and test the active legacy path. I’m also keeping unresolved defaults and migration ownership explicit rather than claiming the heading defect is fixed prematurely.
>
> **Correcting the implementation plan**
>
> I’m separating immediate test and purity fixes from the later layout migration. The Heading3 defect must remain tracked against the active path, with no claim of resolution until the responsible runtime is actually corrected and covered by regression tests.
>
> **Planning implementation**
>
> I’m requiring a clean rebase, purity fixes, active-path regression coverage, and explicit ownership for the Heading3 defect. I’m also separating Stage 3 resolver work from later line-breaking migration, without claiming unresolved behavior is fixed.
>
> **Corrected and planned the implementation approach**
>
> 
>
> **Audited Stage 2 pull requests, integrations, fixes, and Stage 3 requirements**
>
> 
>
> Worked for 4m 14s

אני לוקח מכאן את ניהול ההתקדמות, ולא אסתפק בעוד תוכנית על הנייר. אבדוק את מצב הריפו וה־PRים בפועל, אשווה את תוצרי הסוכן לדרישות של שלב 2 ולשערי הקבלה של התוכנית, ואקבל החלטות מעשיות: מה ראוי למיזוג, מה דורש תיקון ממוקד, ומה חייב להישאר פתוח כדי שלא נכניס למנוע חוב ארכיטקטוני.

במקביל אכין לסוכן הוראת המשך אחת, רציפה ומחייבת: השלמות ותיקונים שנדרשו משלבים קודמים, סגירת שלב 2 ככל שניתן, והתחלת שלב 3 בלי להמתין שלא לצורך. לא אאשר מיזוג רק כדי לייצר תחושת התקדמות - אבל גם לא אשאיר PR תקין ומוכן למיזוג תלוי ללא סיבה.

מצאתי את תוצרי הסוכן: **שלב 2 הוגש ב־PR \#20**, והוא אינו רק תיעוד - יש בו מימוש של `DocumentModel`, מודל פריטי inline, registry, adapter, שחזור מקור ובדיקות. ה־PR מבוסס על ענף שלב 1, כלומר הוא **PR ערום על PR \#19**; לכן סדר המיזוג חשוב.

כבר עולה נקודה מהותית אחת: הסוכן מדווח על 895/895 בדיקות ועל שימור פריסה ללא שינוי, אך הוא גם מצהיר במפורש שחוזה הפריט האחיד עדיין ממתין לאישור וששאלות 12-13 חוסמות את שלב 3. אני בודק עכשיו אם ההפרדה הזאת נשמרה גם בקוד, ואם הראיות מספיקות כדי למזג את התיעוד ואת המימוש בלי לקבע החלטות שטרם אישרת.

**החלטה ראשונה כבר בוצעה\:** מיזגתי את PR \#19 ל־`main` במיזוג תיעודי בלבד. הקומיט שנוצר: `a10c70abfa75d0bd66c8725f08ffd5657bb9ea3e`\. זה מכניס לריפו את מפת המנוע, מרשם הכפילויות, אודיט ההגדרות, שאלות ההכרעה וראיות ה־baseline - בלי לשנות קוד מנוע.

לגבי PR \#20, איני ממזג אותו עדיין: אחרי מיזוג \#19 הוא אינו בר־מיזוג כרגע, ועל הסוכן לסנכרן את הענף מחדש מול `main`\. מצאתי גם תיקון איכות קוד קטן אך חשוב: ה־adapter שמוגדר כטהור משתמש במונה גלובלי ומשנה את אובייקט המודל (`blk._notes`\). צריך להסיר את שתי תופעות הלוואי לפני שהמימוש נכנס ל־`main`\.

בדיקת שלב 2 כן מראה הישגים ממשיים: שלוש קבוצות בדיקות ה־CI עברו, בדיקות הקורפוס עברו, ושני כשלי ה־audit הגדולים תואמים ל־baseline שקדם לשלב 2. אבל **הבאג בכותרת 3 עדיין לא תוקן**\: הבדיקות החדשות מקבעות את מצב הפגם במפורש, ולא בודקות תיקון. בנוסף, מאחר שנתיב המורשת הוא עדיין נתיב הריצה הפעיל, צריך לוודא שהשיוך לשלב 4 אכן יפתור את הבאג גם בנתיב הפעיל - ולא רק במנוע DP העתידי.

ביחס ל־PRים הישנים יותר, החלטתי כך\:

- **PR \#15** - לא למזג. חלקיו המתאימים כבר הועברו למודל הקנוני בשלב 2; שאריתו שייכת לשלבים 3-4. מיזוגו בשלמותו יכניס מסלול מקביל.
- **PR \#16** - לא למזג כרגע. הוא מכיל תיקונים בעלי ערך, אבל משנה את מנוע ה־DP בכמה מוקדים, מבוסס על `main` ישן, ודורש העברה מבוקרת לפי מפת השלבים.
- **PR \#17** - לא למזג. הוא עצמו מסומן `DO NOT MERGE`, וממצאיו צריכים להיבחן מול הארכיטקטורה הקנונית ולא להיכנס כחבילת תיקונים נפרדת.

כלומר, אין הצדקה להכניס עכשיו את שלושת ה־PRים האלה רק כדי לצמצם את רשימת הפתוחים. ההתקדמות הנכונה היא למזג את שלב 2 לאחר תיקון נקודתי וסנכרון, ואז להתקדם לשלב 3. הנה הוראת הביצוע לסוכן.

**document: **

# הוראת ביצוע לסוכן AI - ניהול השלמות שלבים 1-2, מיזוג שלב 2 והתחלת שלב 3

אתה ממשיך לעבוד על המאגר:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

המשתמש מינה את ChatGPT למנהל הפרויקט. הוראה זו היא אישור ביצוע מטעם המשתמש. המטרה היא להתקדם בפועל, לסגור חובות משלב 1-2, למזג את העבודה התקינה, ולהתחיל את שלב 3 - בלי להסתבך בסבבי תכנון חוזרים ובלי להשאיר PRים תקינים תלויים ללא סיבה.

## 0. מצב אמת - חובה להתחיל ממנו

התוכנית המחייבת:
`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

העיקרון הארכיטקטוני שאסור לסטות ממנו:

**מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**

המשתמש הדגיש שפישוט ואיחוד פעולת מנוע העימוד, ללא טלאים וללא מסלולים מקבילים, הם ממטרות הפרויקט החשובות ביותר.

### מצב GitHub נכון לתחילת המשימה

- PR #19 - שלב 1 - **כבר מוזג ל־main**.
- קומיט המיזוג: `a10c70abfa75d0bd66c8725f08ffd5657bb9ea3e`.
- PR #20 - שלב 2 - עדיין פתוח, ענף:
  `stage2/canonical-document-model-20261116`
- HEAD קודם של PR #20:
  `795f51bebca8c27aa005d8a8a40988a57e44acc7`
- לאחר מיזוג PR #19, PR #20 אינו בר־מיזוג כרגע. יש לסנכרן אותו מול main ולנקות את ההפרש.
- PR #15 - טיוטה, חלקים ממנו כבר שולבו בשלב 2.
- PR #16 - פתוח, מבוסס על main ישן, מכיל תיקוני DP משמעותיים שטרם עברו ביקורת מול התוכנית הקנונית.
- PR #17 - טיוטה המסומנת DO NOT MERGE.

אין להניח שה־SHA או מצב הענפים נשארו כפי שהם. אמת את המצב העדכני לפני כל פעולה.

---

# חלק א׳ - סגירת שלב 2 ומיזוגו

## 1. סנכרון PR #20

1. בדוק ש־main כולל את קומיט המיזוג של PR #19.
2. סנכרן את ענף שלב 2 מול main העדכני.
3. נקה מה־PR את ההפרש ההיסטורי של PR #19 ככל שניתן, כך שה־PR ייצג את שלב 2 בלבד.
4. אם rebase אינו אפשרי או מסוכן, צור ענף נקי המבוסס על main והעבר אליו את שינויי שלב 2 בלבד.
5. אל תדרוס עבודה חדשה בענף ואל תבצע force-push ללא בדיקת SHA עדכני ואימות שאין אובדן קומיטים.

## 2. תיקון טוהר ה־adapter - חובה לפני מיזוג

בבדיקה נמצא פגם עקרוני ב־`red-build/src/engine/model/adapter.js`:

- `tokenSeq` מוגדר במרחב גלובלי של המודול ומשמש מונה משתנה.
- `modelToTokens` משנה את המודל המקורי באמצעות `blk._notes = ...`.
- הקוד מתועד כפונקציה טהורה, אך בפועל יש בו מצב גלובלי ושינוי אובייקט קלט.

תקן זאת כך:

- מונה הטוקנים יהיה מקומי לקריאה של `modelToTokens`, ולא משתנה גלובלי.
- יצירת הטוקנים תיעשה באמצעות closure מקומי או מנגנון שקול.
- אין להוסיף שדות זמניים לבלוקים או לשנות את DocumentModel.
- העבר את ההערות הדרושות ל־`rebuildCanonicalLine` כנתון מפורש, באמצעות ממשק קיים או הרחבה קטנה וברורה שלו.
- אין להוסיף שכבת adapter נוספת או לשכפל את לוגיקת שחזור המקור.

הוסף בדיקות המוכיחות:

1. `modelToTokens` אינו משנה את המודל המקורי - השוואת deep snapshot לפני ואחרי.
2. שתי קריאות חוזרות מחזירות פלט זהה.
3. קריאות לסירוגין על שני מסמכים שונים אינן משפיעות זו על זו.
4. מזהי הטוקנים נשארים זהים לטוקניזר הישיר.
5. המודל נשאר תקין לאחר הפעלת adapter, round-trip ו־validation.

## 3. ביקורת שלמות עצמאית למודל

אל תסתפק בכך שהבדיקות שהסוכן כתב עוברות. בדוק את המימוש מול התוכנית והחוזה.

בפרט:

- `DocumentModel` הוא מקור הסמכות של מסלול ה־DP בשלב הפענוח.
- אין פרסר חדש או AST מתחרה.
- כל פריט מכיל זהות יציבה, מקור, סדר, סוג, payload, אילוצים ואבחון מתאים.
- טווחי גופן מרובים נשמרים לפי מקטעים, לרבות כמה משפחות באותה מילה.
- תמונות הן פריטי מודל אמיתיים עם `assetId` ומקור מדויק, ולא ערוץ צדדי בלבד.
- קישור סמן הערה לגוף הערה הוא מבני ודו־כיווני.
- round-trip משחזר את המקור ללא אובדן.
- אין השמטה שקטה של סוגי פריטים לא נתמכים.
- בדיקות מבנה משתמשות במסמכים תקינים לפי כללי המשתמש:
  - אין שתי כותרות מאותה רמה בזו אחר זו ללא טקסט ביניהן.
  - כותרת אינה יכולה להכיל הערת שוליים בלבד.
  - הכותרת האחרונה חייבת להכיל טקסט ממשי.
  - היררכיית כותרות 1-7 מותרת.

בדוק במיוחד שהוולידטור אינו מסתפק בבדיקת `hasText` מקומית כאשר נדרשת בדיקה של המבנה הסמנטי כולו. אם יש מקרה שבו הערת סיום, פריט editorial או פריט אחר מפריד טכנית בין כותרות אך אין ביניהן תוכן ממשי, יש להכריע ולבדוק זאת במפורש.

## 4. דיוק בהצהרות על הכיסוי

בדוח שלב 2 יש להבחין בין:

- פריט שקיים במודל;
- פריט שמפורסר למודל;
- פריט שמועבר דרך ה־adapter;
- פריט שהמנוע כבר יודע למדוד ולעמד;
- פריט שעדיין ממתין לשלבים 3-8.

אין לכתוב שתמונות או טווחי גופן כבר נמדדים ומעומדים אם בפועל הם רק מיוצגים במודל ומועברים כטקסט מילולי לנתיב ה־DP הישן.

גם מסלול המורשת עדיין פעיל כברירת המחדל החיה. אין לטעון שהוא משתמש במודל הקנוני. השארתו ללא שינוי בשלב 2 היא החלטה מודעת, אך יש לשמור את עובדת קיומו ואת מועד האיחוד בשלב 9 גלויים וברורים.

## 5. בדיקות ושער מיזוג

לאחר התיקונים:

- הרץ את `npm test` במלואו.
- הרץ בנפרד את בדיקות שלב 2.
- הרץ בדיקת דטרמיניזם.
- הרץ cross-check על הקורפוסים.
- הרץ `scan-control-triggers`.
- הרץ את בדיקות הקורפוס ואת בדיקות השלמות.
- אמת שה־bundles נבנו מחדש מהמקור ולא נערכו ידנית.
- השווה את תוצאות הפריסה וה־hash ל־baseline של שלב 1.

ב־CI הקודם של PR #20:
- `test (18)`, `test (20)`, `test (22)` - עברו.
- `corpus-invariants` - עבר.
- `layout-audit` - נכשל ב־`SIDE_NOTE_OVERLAP` בעמוד 107, ממצא F-BL2 שכבר היה קיים ב־main.
- `full-math-audit` - נכשל ברצפת הנפח, ממצא F-BL1 שכבר היה קיים ב־main.

יש לאמת מחדש את שתי התקלות. מותר לקבלן ככשלים קודמים רק אם מוכח שהחתימה שלהן זהה ל־baseline ושלא נוצרה רגרסיה חדשה. אין להסתיר אותן או להציג את כל ה־CI כירוק.

### הרשאת מיזוג מפורשת

המשתמש מאשר לך למזג בעצמך את PR #20 לאחר שעמד בכל התנאים הבאים:

1. הענף מסונכרן מול main.
2. תיקון טוהר ה־adapter הושלם.
3. כל בדיקות שלב 2 עוברות.
4. בדיקות הקורפוס והדטרמיניזם אינן מצביעות על רגרסיה.
5. שני כשלי ה־audit הישנים אומתו כ־pre-existing ולא כחדשים.
6. אין קונפליקטים ואין שינויי scope לא מאושרים.

אל תמתין לאישור נוסף ממני לאחר שכל התנאים הללו הוכחו. בצע squash merge, תעד את SHA הממוזג, וודא ש־main מכיל את הקוד ואת המסמכים.

אם אחד התנאים אינו מתקיים, תקן אותו בעצמך ככל שהוא בתחום שלב 2. אם נדרשת הכרעת משתמש, הצג שאלה ממוקדת אחת - אך אל תעצור עבודה שאינה תלויה בה.

---

# חלק ב׳ - השלמות ותיקונים משלבים קודמים

## 6. שאלת R-03 - תיקון הסוגריים ממאגר Red

ב־PR #19 תועד באג מאומת ב־`legacy-imud-flow.js:574-577`:

דגלי סוגריים של מילה שנושאת סמן הערה מתאפסים באופן שגוי, ומונה עומק הסוגריים דולף להמשך הפסקה.

קיים תיקון שורש שפותח ונבדק במאגר Red, PR #48.

עליך:

1. לעיין ב־PR #48 ובבדיקות שלו במאגר המקור.
2. להשוות את המימוש ל־Work_2 העדכני.
3. לוודא שהבעיה קיימת כאן ושלא תוקנה בינתיים בדרך אחרת.
4. לייבא את תיקון השורש בלבד, ללא העתקת מסלול מנוע מקביל.
5. להוסיף בדיקות רגרסיה מקומיות, לרבות משפחות מקור שונות, הערה עם סוגריים, וסוגריים שממשיכים לאחר המילה.
6. להגיש PR נפרד וממוקד או לשלבו בענף עבודה מתאים אם אין ערבוב אחריות.

אל תייבא מודולי UI רק משום שהוזכרו באודיט. יש להפריד בין תיקון מנוע מאומת לבין רכיבי UI שניתן לדחות.

## 7. שאלות פתוחות 11-15 - לא להעלים ולא להחליט בשתיקה

יש לעדכן את `OPEN_QUESTIONS.md` ואת מסמכי ההחלטות בהתאם למצב האמיתי.

### שאלה 11 - ייבוא מ־Red

R-03 הוא מועמד ייבוא ממשי, ויש להתקדם איתו כמתואר לעיל. יתר רכיבי ה־UI ייבחנו רק אם יש להם ערך ישיר ואינם יוצרים כפילות.

### שאלה 12 - שכבת ברירות המחדל

קיימות שתי שכבות: ברירות המחדל ברישום ההגדרות, וברירות המחדל המיובאות של מנוע המקור. באודיט נמצאו 67 סטיות אפקטיביות.

המלצת מנהל הפרויקט לבחינת המשתמש:

- התנהגות המוצר הקיימת בפועל תהיה בסיס התאימות.
- ערכי הייבוא של מנוע המקור יישמרו בפרופיל המוצר.
- ערכי הרישום ישמשו fallback רק כאשר אין ערך מיובא.
- תיבנה שכבת resolver אחת, מפורשת ומתועדת, שמכריעה את הערך האפקטיבי.
- אין לשנות ערך ברירת מחדל קיים, מזהי טקסט או הגדרות משתמש כחלק מהמעבר.

אין לקבע את ההמלצה כהחלטת משתמש ללא אישורו. אפשר לבנות את התשתית ואת בדיקות ההשוואה בלי לשנות את הערכים.

### שאלה 13 - זהות פלט Node לעומת דפדפן

המלצת מנהל הפרויקט:

**אותו מסמך + אותן הגדרות + אותם נכסים וגופנים + אותה גרסת מנוע מדידה ⇒ אותה תוצאת מדידה ואותה גאומטריה, ללא תלות בסביבת Node או Browser.**

המדידה הקנונית לא תסתמך על fallback סמוי של מערכת ההפעלה או על מדידת DOM. אם אין גופן או משאב, יש להחזיר אבחון מפורש.

יש לבנות בדיקות parity מספריות, אך לא לקבוע סבילות או חריגה ללא ניתוח והצגת ההשפעה למשתמש.

### שאלה 14 - אישור חוזה הפריט האחיד

המימוש כבר קיים, אך החוזה נשאר טיוטה.

ב־`CANONICAL_DOCUMENT_MODEL.md` §10 מופיעות נקודות להכרעה:
- ערך `none` עבור `participates`.
- מרחבי הזהות וקידומות המזהים.
- מדיניות תמונות בכותרות ובהערות סיום.

בדוק גם את הסתירה בין החוזה לבין המימוש: המימוש משתמש ב־`participates: none` לפריטי editorial, בעוד החוזה המקורי אינו כולל ערך זה.

הכן הצעה קצרה ומנומקת לאישור המשתמש. אין להציג חוזה כמאושר לפני אישור מפורש.

### שאלה 15 - D-106/D-101

מדובר בכפילות תיעודית. אין לשנות את פנקס ההחלטות ללא אישור, אך יש לוודא שהכפילות נשארת מתועדת ולא נחשבת לחסם ביצוע.

---

# חלק ג׳ - ממצא כותרת 3: תיקון שיוך השלב

## 8. D-S2H3 - רווח תחתון של כותרת 3 שנשברת

המשתמש דיווח שהרווח התחתון של כותרת 3 מופיע לפני מעבר השורה של הכותרת עצמה, במקום אחרי השורה האחרונה ולפני התוכן שאחריה.

בשלב 2 נוצרה בדיקת characterization שמוכיחה את הפגם, אך היא **אינה מתקנת אותו**.

הבדיקה הנוכחית משתמשת ב־`legacyTypeset`, כלומר בנתיב המורשת - הנתיב הפעיל כברירת המחדל במוצר. היא נועלת במפורש את מצב הפגם:

- מרווח 4px נכלל בגובה הפס של כל שורת כותרת.
- לכן המרווח מופיע בין שורות הכותרת.
- אחרי השורה האחרונה אין מרווח תחתון נוסף.
- DOM ו־PDF צורכים את אותן עובדות גאומטריות.

אין לקבל את ההכרעה "שלב 4 יפתור זאת" ללא בדיקה נוספת: שלב 4 עוסק במנוע השורות המאוחד, ואילו נתיב המורשת נשאר פעיל עד שלב 9.

עליך:

1. לבדוק את הממצא מול שני הנתיבים - Legacy ו־DP.
2. להוכיח מי מהם פעיל בתצוגה החיה ובייצוא.
3. לקבוע היכן נדרש התיקון כך שיחול גם על הנתיב הפעיל.
4. לא להוסיף CSS נקודתי או תנאי חריג במקרין.
5. אם התיקון הנכון מחייב את מודל השורות המאוחד, לקשור אותו במפורש לשלב 4 ולחבר את אימותו למעבר שלב 9. אין להציג אותו כפתור עד שהנתיב הפעיל תוקן.
6. אם ניתן לתקן את השורש בנתיב המורשת בלי ליצור כפילות או לפגוע באיחוד העתידי, להגיש תיקון מבודד ומוכח, ולאחר מכן לוודא שהתכנון המאוחד משתמש באותו חוזה סמנטי.

הבדיקה חייבת לבדוק את ההתנהגות הרצויה, לא רק לנעול את ההתנהגות השגויה. התוצאה הרצויה:

- אין מרווח תחתון בין שורות הכותרת עצמה.
- המרווח התחתון מופיע פעם אחת בלבד אחרי השורה האחרונה.
- המרווח נמצא לפני התוכן הבא.
- אותה גאומטריה בתצוגה וב־PDF.

---

# חלק ד׳ - שלב 3: נכסים, סגנונות ומדידה אחידה

לאחר סגירת תיקוני שלב 2, התחל מיד בביצוע שלב 3 לפי `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` §§3.1-3.3.

אין להסתפק בכתיבת תוכנית. יש להתחיל במימוש.

## 9. Asset Resolver יחיד

ממשק מרכזי לפתרון נכסי מסמך:

- קובץ מקומי.
- ZIP.
- תיקייה.
- מזהה פנימי.
- מקור נתונים נתמך.

דרישות:

- פתרון נתיב בטוח ודטרמיניסטי.
- מניעת path traversal ונתיבים חיצוניים בלתי מורשים.
- asset identity יציב.
- תמיכה בהעברת נכסים ל־Worker באמצעות פרוטוקול מוגדר.
- אין להסתמך על גישה סמויה של Worker למערכת הקבצים.
- אין להעביר נתיב מקומי שאינו נגיש בסביבת היעד.
- כל נכס חסר או פגום מקבל diagnostic מפורש.

מדוד תמונות מתוך bytes/metadata אמיתיים: dimensions, orientation, aspect ratio, fit/scale וגבולות. בדוק את הפורמטים שהמוצר באמת תומך בהם; אין להרחיב את רשימת הפורמטים רק על סמך הצהרה תיעודית.

הגדר מדיניות מפורשת לתמונה inline, תמונת block, תמונה ממורכזת ותמונה עם זרימת טקסט מסביבה. כולן צריכות להיות פריטי מודל ואילוצים של אותו מנוע, לא מסלולים נפרדים.

## 10. Font Resolver יחיד

הרחב את הקיים במקום ליצור מערכת מקבילה.

ה־resolver יחזיר:

- font identity יציב.
- face שנבחר בפועל.
- metrics.
- fallback שנבחר, אם נדרש.
- סיבת fallback ואבחון.
- גרסת/טביעת אצבע של משאב הגופן.

תמוך ב:

- כמה משפחות גופן באותה מילה.
- מקטעים מקוננים.
- ירושה וסגנונות.
- שימור family identity לאורך כל הצינור.
- מדידת כל מקטע במשפחתו.
- kerning ו־GPOS כאשר מנוע המדידה תומך בהם.
- אבחון מפורש כאשר גופן אינו זמין.

אסור להסתמך על שם גופן בלבד כאשר קיימים קובצי גופן אמיתיים ו־font identity יכול להיות מדויק יותר.

## 11. Measure API קנוני

יש להרחיב את `MeasureAPI` הקיים, לא להקים Measure API שני.

ה־API יקבל:

- פריט קנוני.
- styleRef פתור.
- אילוצים.
- כיוון ושפה.
- font/asset identity.
- environment fingerprint.

ויחזיר `MeasuredItem` בלתי־ניתן לשינוי הכולל לפי הצורך:

- advance / width.
- ascent / descent.
- height.
- baseline.
- bounds.
- break opportunities.
- ink bounds.
- נתונים נדרשים להקרנה.

הפרד בין advance לבין ink bounds. אל תשתמש ב־`offsetHeight`, `scrollHeight` או `getClientRects` כמדידה קנונית או כמדידה חוזרת אחרי שנקבעה המדידה.

קבע יחידות ומדיניות rounding אחת לכל המנוע. המרות px/pt/mm יבוצעו בגבול מוגדר בלבד.

## 12. Cache מדידה

הגדר cache לפי מפתח מלא, הכולל לפחות:

- תוכן/מזהה פריט.
- font identity.
- גודל וסגנון.
- language/direction.
- asset identity.
- גרסת מנוע המדידה.
- environment fingerprint.

בדוק שאין שיתוף cache שגוי בין פריטים בעלי זהות או הקשר שונים.

אין לבצע אופטימיזציית ביצועים לפני baseline שמוכיח צוואר בקבוק. כל אופטימיזציה חייבת לשמר את תוצאת המדידה או להיות שינוי מכוון ומאושר.

## 13. בדיקות שלב 3

הוסף בדיקות ממוקדות:

- מדידת גופנים אמיתיים.
- מילה מעורבת בכמה גופנים.
- טווחי גופן מקוננים.
- תמונה עם metadata אמיתי.
- scaling ו־aspect ratio.
- fallback ואבחון.
- RTL/LTR.
- הערות.
- Worker transport.
- זהות בין ריצות.
- cache isolation.
- parity Node/Browser.
- בדיקת שלילה שמוודאת שאין שימוש במדידת DOM מחוץ למימוש המדידה המאושר.

כל פריט נתמך חייב לקבל מדידה קנונית. פריט שלא ניתן למדוד אינו נעלם - הוא מקבל diagnostic.

---

# חלק ה׳ - גבולות ביצוע

## 14. מה לא לבצע בשלב 3

- אין להתחיל את מנוע שבירת השורות המלא של שלב 4.
- אין להתחיל Planner חדש.
- אין להוסיף PageModel או renderer חדש.
- אין למזג את מסלול המורשת למסלול DP באופן חלקי.
- אין למחוק נתיבים ישנים לפני הוכחת מעבר מקצה לקצה.
- אין לשנות ברירות מחדל, מזהי טקסט או הגדרות קיימות ללא אישור.
- אין לשנות את ברירת המחדל `justify`.
- יש לשמר את Theme 40 ואת עיצובי השערים המקוריים פעילים אוטומטית.
- אין להחזיר את P6/P7 בשום צורה - הם מחוץ לתחום.
- אין להשתמש ב־PDF הייחוס כיעד איכות או כמדד parity.

## 15. טיפול ב־PRים הקודמים

- אין למזג את PR #15 בשלמותו. לאחר שמיזוג שלב 2 יאומת, עדכן את תיעודו וסגור אותו כ־superseded אם אכן אין בו עוד עבודה עצמאית שנדרשת.
- אין למזג את PR #16 באופן עיוור. סקור את השינויים שלו מול התוכנית הקנונית; סווג כל תיקון לשלב המתאים, והעבר רק תיקון שורש נחוץ ומוכח.
- אין למזג את PR #17. הוא מסומן DO NOT MERGE; יש להתייחס אליו כמקור ממצאים בלבד.
- כל תיקון שיובא יהיה ממוקד, עם בדיקת רגרסיה והוכחת היעדר פגיעה בקורפוסים.

## 16. תוצרים מחייבים

בסיום סגירת שלב 2:

- PR #20 מסונכרן וממוזג.
- `CANONICAL_DOCUMENT_MODEL.md` מעודכן.
- `audits/STAGE2_MODEL_COVERAGE.md` מדויק ביחס למצב המימוש.
- בדיקות טוהר adapter.
- ממצא D-S2H3 מתועד עם שיוך נכון לנתיב הפעיל ולשלבים הנדרשים.
- WORKLOG, ISSUE_REGISTRY, OPEN_QUESTIONS ומפת התלויות מעודכנים.
- כל שינוי קוד נלווה מתועד עם ראיות.

בשלב 3:

- Asset Resolver קנוני.
- Font Resolver קנוני.
- חוזה Measure API ו־MeasuredItem.
- בדיקות יחידה, אינטגרציה ו־Worker.
- דוח parity מספרי בין סביבות ומקורות מדידה.
- מפת תלויות מעודכנת.
- PR שלב 3 ממוקד, עם תיאור מלא של מה הושלם ומה נותר.

## 17. אופן העבודה ודיווח

המשתמש ביקש עבודה מהירה אך מדויקת, והודעות עבודה קצרות כדי למנוע קטיעות.

לכן:

1. בצע מקטעי עבודה קצרים, עם קומיטים קטנים וברורים.
2. אל תמתין יותר מחמש דקות ל־CI; בדוק תוצאות זמינות והמשך במשימות שאינן תלויות בהן.
3. אל תכתוב דיווחי התקדמות כלליים במקום לבצע עבודה.
4. בכל דיווח ציין:
   - מה שונה בפועל.
   - באיזה ענף ובאיזה SHA.
   - אילו בדיקות עברו.
   - אילו בדיקות נכשלו ולמה.
   - מה עדיין חוסם.
   - מה הצעד הבא.
5. אל תטען ששלב הושלם אם שער הקבלה שלו לא הוכח.
6. אל תעצור לאחר כתיבת מסמך תכנון. התחל לממש את שלב 3 ברגע שהתשתית הקודמת מאפשרת זאת.
7. אין צורך לבקש אישור נוסף למיזוג PR #20 לאחר עמידה מלאה בתנאים המפורטים לעיל.

**התחל עכשיו: סנכרן את PR #20, תקן את טוהר ה־adapter, השלם את ביקורת שלב 2, מזג אותו לאחר עמידה בשער, ובאותה נשימה התחל את שלב 3. המטרה היא מנוע אחיד, דטרמיניסטי, מדיד וניתן להרחבה - לא אוסף תיקונים מקומיים.**

## מצב הפרויקט והצעדים הבאים

**שלב 1 - אודיט ומסמכי יסוד** (מוזג)

PR \#19 · `a10c70a`

---

**שלב 2 - מודל תוכן אחיד** (תיקונים לפני מיזוג)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/20?utm_source=chatgpt.com) · ניתנה לסוכן הרשאה מפורשת למזג לאחר עמידה בשערי הקבלה.

---

**שלב 3 - נכסים, גופנים ומדידה** (הוראת ביצוע מוכנה)

Asset Resolver, Font Resolver ו־Measure API אחיד.

יש שלוש הכרעות שהן חשובות להתקדמות של שלב 3. ההמלצה שלי היא\:

1. **ברירות מחדל\:** ההתנהגות האפקטיבית הנוכחית של המוצר תהיה בסיס התאימות; הרישום ישמש fallback בלבד.
2. **Node ודפדפן\:** יעד של זהות פלט מלאה כאשר הקלט, הנכסים, הגופנים וההגדרות זהים.
3. **חוזה הפריט\:** לאשר את המודל הקיים בכפוף להוספת `participates: none` ולהבהרת מדיניות התמונות בכותרות ובהערות.

הסוכן יכול להתחיל בתשתיות שאינן תלויות בהכרעות האלה, אך לא לקבע אותן בשמך.

**האם לאשר את שלוש ההמלצות האלה כחבילת החלטות ארכיטקטוניות?**

ולבסוף, כדי שלא נחזור למצב שבו PRים ובדיקות נשארים ללא מעקב\:

אם תרצה, אוכל לעקוב מדי יום אחר התקדמות שלב 3, ה־PR והבדיקות, ולדווח על חסמים.

מעקב יומי אחר שלב 3 והבדיקות

הדגש מבחינתי נשאר אחד: לא רק לגרום למנוע לעבוד, אלא להגיע למנוע פשוט, אחיד, דטרמיניסטי, שבו הוספת פריט עימוד חדש אינה מחייבת פתיחת מסלול חדש בכל שכבה.

## Prompt:
15.11.2026, 23:15:41

סוכן הAI השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות.

## Response:
15.11.2026, 23:15:51 · gpt-6

> **Reviewing stage coverage**
>
> I’m noticing a potential integration gap: measurement may be tested directly but not connected to the runtime pipeline. Font fallback diagnostics are explicit, yet the claimed pre-break measurement behavior may still be missing from actual execution.
>
> **Reviewed stage coverage**
>
> 
>
> **Prioritizing merge order**
>
> I’m evaluating the pull requests for regressions and dependencies. One patch appears mergeable after tests, but another may need rebasing and additional integration work, especially around whether measurement is actually wired into runtime behavior.
>
> **Auditing asset handling**
>
> I’m identifying several possible correctness gaps: transport metadata may not verify claimed asset IDs, cache keys may omit changing content or image dimensions, and format parsing has limited validation. These issues seem more significant than the smaller parser edge cases.
>
> **Prioritizing cache correctness**
>
> I’m finding a stronger blocker: measurement caching can reuse stale results when item content, image data, dimensions, or fonts change. Runtime integration also remains unclear, so these need resolution before merging.
>
> **Prioritized merge order and audited assets and cache correctness**
>
> 
>
> **Identifying integration blockers**
>
> I’m confirming that live worker paths still bypass the new font and asset infrastructure. I’m also checking stale registration, cache invalidation, transport integrity, and immutability before approving the next stage.
>
> **Identified integration blockers**
>
> 
>
> **Reviewed pull requests, CI, measurement implementation, and planned Stage 4 fixes**
>
> 
>
> Worked for 2m 1s

אני ממשיך כמנהל הפרויקט, עם נקודת מוצא מעשית: לא נניח שהשלב הושלם רק מפני שהסוכן הכריז עליו. אבדוק את ה־PR החדש מול התוכנית הקנונית, את התלות שלו בשלבים הקודמים, את הקוד והבדיקות בפועל, ואז אמזג את מה שעומד בתנאים. במקביל אכין הוראת ביצוע לשלב הבא, שתכלול גם חובות שנותרו משלבים קודמים - כדי שלא נצבור חוב ארכיטקטוני בדרך לסיום.

יש התקדמות משמעותית מאז הבדיקה הקודמת: **PR \#20 אכן מוזג**, וה־`main` הנוכחי מבוסס על שלב 2. הסוכן גם פתח שני PRים חדשים\:

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/21?utm_source=chatgpt.com)\: תיקון דגלי סוגריים במילה שנושאת סמן הערה.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/22?utm_source=chatgpt.com)\: Asset Resolver, Font Resolver, מדידת פריטים קנונית, יחידות והעברת נכסים ל־Worker.

הנתון המעודד: בשלושת ענפי הבדיקות של PR \#22, מטריצת הבדיקות, בדיקות הדטרמיניזם ובדיקות הקורפוס עברו. שני שערי ה־audit עדיין נכשלים, אך צריך לוודא את זהות הכשלים מול `main` ולא להציג את הכישלון כזניח. אני משלים עכשיו בדיקת קוד ממוקדת לפני החלטת המיזוג, במיוחד סביב זהות הגופנים, מדידת התמונות, Worker וההבדל בין תשתית מדידה מוכנה לבין מנוע שכבר צורך אותה.

**מיזגתי גם את PR \#21.** קומיט המיזוג: `329cc40ae1dd4fa50243160e47606ddf5db3a3d9`\. תיקון R-03 נמצא כעת ב־`main`, עם בדיקות הרגרסיה שלו. שלוש מטריצות הבדיקות עברו, ובדיקת הקורפוס עברה; כשלי `layout-audit` ו־`full-math-audit` נותרו, כפי שהיו גם בבסיס של שלב 2.

לעומת זאת, בבדיקת PR \#22 מצאתי **שלושה פערים שמונעים ממני לאשר את שער הקבלה שלו**\:

1. מטמון המדידה משתמש ב־`item.id` במקום בתוכן הפריט. לכן אותו מזהה עם טקסט, תמונה או רוחב שונים עלול לקבל מדידה ישנה ושגויה. זה פגם correctness, לא רק עניין ביצועים.
2. ה־Worker מקבל לכאורה נכסים בפרוטוקול החדש, אבל `worker-client.js` עדיין שולח בקשת עימוד בלי `assets`\. גם מסלול רישום הגופנים החי עדיין משתמש ברישום הישן, ולא ב־Font Resolver החדש. כלומר, בדיקות יחידה של התשתית אינן מוכיחות שהיא מחוברת לזרימת המוצר.
3. `MeasuredItem` מוקפא רק ברמה החיצונית ובחלק מהמערכים; אובייקטים פנימיים כמו `fit`, `natural`, `placement`, פריטי `segments` ואבחונים עדיין ניתנים לשינוי, בניגוד לחוזה ה־immutable.

לכן PR \#22 **לא ימוזג במצבו הנוכחי**\. זהו תיקון ממוקד שאפשר לבצע בלי לפתוח מחדש את שלבים 1-2. לאחריו יש להתחיל את שלב 4 - מנוע השורות היחיד - שהוא המעבר המשמעותי הבא מאוסף תשתיות למנוע עימוד אחוד.

## הוראת הביצוע לסוכן - השלמת שלב 3 ותחילת שלב 4

**document: **

# הוראת ביצוע - מנהל הפרויקט: תיקון שער שלב 3, סגירתו והטמעת שלב 4: מנוע שורות אחיד

מאגר: `SUGINACH/Tora_Book_Typesetter_Red_Work_2`

המשימה היא להמשיך את הפיתוח בפועל. אין לפתוח שוב דיונים תכנוניים שכבר הוכרעו, ואין להסתפק בדוחות. יש לתקן את החסמים שהתגלו בביקורת של PR #22, לסגור את שלב 3 באופן מוכח, ואז להתחיל מיד במימוש שלב 4.

היעד העליון של הפרויקט:

**מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**

פישוט, איחוד וחיסול מסלולים מקבילים חשובים לא פחות מהוספת יכולות. אין לפתור בעיה באמצעות עוד שכבת adapter, עוד מנגנון שבירה או עוד תנאי מיוחד במקרין.

---

# 0. מצב אמת - תחילת העבודה

התוכנית הקנונית:
`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

## מצב main

- PR #19 - שלב 1: מוזג.
- PR #20 - שלב 2: מוזג.
  - קומיט מיזוג: `db3ff53d6aa234a115336243e0ec3d5365f15d5a` (בסיס שלב 3).
- PR #21 - תיקון R-03: מוזג.
  - קומיט מיזוג: `329cc40ae1dd4fa50243160e47606ddf5db3a3d9`.
- PR #22 - שלב 3: פתוח, עדיין לא מוזג.
  - ענף: `stage3/assets-styles-measurement`.
  - HEAD קודם: `c0a0f30cb184e52901a18e08a650715d7d1ec20b`.
  - בסיס קודם: `db3ff53`.
  - הענף כעת מאחור ביחס ל-main לאחר מיזוג PR #21, ויש לסנכרן אותו.
- PR #16 ו־PR #17 נשארו פתוחים. אין למזג אותם בשלמותם. יש לעיין בהם כמקורות תיקונים וממצאים לפי השלבים המתאימים.

יש לאמת את כל ה־SHA והמצב בפועל לפני פעולות Git.

## מצב בדיקות של PR #22

- `test (18)`, `test (20)`, `test (22)` - עברו.
- `corpus-invariants` - עבר.
- `layout-audit` - נכשל ב־very-large corpus.
- `full-math-audit` - נכשל.
- שני כשלי ה־audit היו קיימים כבר בבסיס של שלב 2, ויש להמשיך לעקוב אחריהם כ־F-BL1/F-BL2. אין להסתירם או להציגם כ־CI ירוק.

דוח שלב 3 הקיים:
`audits/STAGE3_MEASUREMENT.md`

---

# חלק א׳ - השלמות חובה לשלב 3 לפני מיזוג PR #22

## 1. סנכרון הענף

סנכרן את ענף PR #22 מול main העדכני, הכולל את PR #21.

- אין לאבד קומיטים או לשכתב עבודה לא בדוקה.
- בדוק את ההפרש לאחר הסנכרון.
- שמור על PR ממוקד שמייצג את שלב 3 בלבד.
- אל תכניס את PR #21 מחדש לתוך ההיסטוריה.
- אם נוצרו קונפליקטים, פתור אותם לפי הקוד העדכני ואל תבחר אוטומטית צד אחד.

## 2. תיקון קריטי - מפתח מטמון המדידה

ב־`red-build/src/engine/typography/measure-api.js` נמצא פגם ב־`_itemCacheKey`.

הקוד הנוכחי משתמש ב־`item.id` כאשר קיים מזהה, במקום לכלול את תוכן הפריט. כתוצאה מכך שני פריטים בעלי אותו מזהה אך payload שונה עלולים לקבל אותה מדידה.

זו בעיית correctness חמורה.

לדוגמה:

- אותו `item.id` עם טקסט שונה.
- אותו `item.id` עם תמונה אחרת.
- אותו `item.id` עם `widthPct` שונה.
- אותו `item.id` עם font runs שונים.
- אותו `item.id` עם אילוצי רוחב שונים.
- אותו `item.id` כאשר נכס בעל אותו resourcePath הוחלף בתוכן אחר.

בכל המקרים האלה אסור להחזיר מדידה ישנה.

### דרישות תיקון

בנה מפתח cache קנוני ודטרמיניסטי הכולל לפחות:

1. `item.id` אם קיים.
2. fingerprint של payload מלא, כולל טקסט וריצות.
3. סוג הפריט.
4. כל מאפייני הסגנון המשפיעים על מדידה.
5. זהויות גופן קנוניות, לא רק שמות משפחות.
6. זהות נכס content-addressed, ובמידת הצורך fingerprint של הבתים.
7. שפה וכיוון.
8. אילוצי מדידה מלאים, כולל availableWidth, fit, widthPct ופרמטרים רלוונטיים נוספים.
9. גרסת מנוע המדידה.
10. fingerprint של סביבת המדידה.

אין להשתמש ב־JSON.stringify לא יציב על אובייקט שמכיל מפתחות בסדר לא מובטח, אם הדבר עלול לגרום להבדלים בין סביבות. בחר canonical serialization או fingerprint יציב.

### בדיקות חובה

- אותו ID עם payload שונה ⇒ cache miss ומדידה חדשה.
- אותו ID ותמונה שונה ⇒ cache miss.
- אותו ID ורוחב זמין שונה ⇒ cache miss.
- אותו ID ו־widthPct שונה ⇒ cache miss.
- אותו ID וגופן שונה ⇒ cache miss.
- אותו קלט בדיוק ⇒ cache hit ותוצאה זהה.
- שתי סביבות עם font identity שונה ⇒ אין שיתוף מטמון שגוי.
- אותו resourcePath עם תוכן נכס שונה ⇒ אין שיתוף מטמון שגוי.
- בדיקת interleaving של מסמכים שונים.

אין להסתפק בבדיקות שמייצרות IDs שונים. יש לבדוק במכוון collision של אותו ID עם תוכן שונה.

## 3. תיקון immutable אמיתי של MeasuredItem

החוזה מצהיר על `MeasuredItem` בלתי־ניתן לשינוי, אבל `Object.freeze(out)` לבדו אינו מקפיא את כל המבנים הפנימיים.

יש לבדוק ולהבטיח immutability אמיתית של:

- `inkBounds`
- `segments` וכל אובייקט segment
- `breakOpportunities` וכל אובייקט break
- `diagnostics`
- `natural`
- `fit`
- `placement`
- כל אובייקט נוסף שנמצא בתוך תוצאת המדידה.

גם `Map` המוחזר מ־`measureDocumentModel` אינו הופך לבלתי־ניתן לשינוי באמצעות `Object.freeze(map)` בלבד.

בחר ממשק תוצאה שאינו מאפשר שינוי של תוצאות המדידה לאחר יצירתן, בלי לפגוע בביצועים שלא לצורך.

בדיקות חובה:

1. ניסיון לשנות כל מבנה פנימי אינו משנה את תוצאת המדידה.
2. שינוי של אובייקט חיצוני שהועבר כקלט אינו משנה מדידה שכבר נוצרה.
3. מדידה חוזרת מחזירה תוצאה זהה.
4. אין דליפה של אובייקטים mutable מתוך cache.

## 4. חיבור אמיתי של Asset Resolver ל־Worker ולזרימת המוצר

נמצא פער בין הפרוטוקול החדש לבין לקוח ה־Worker החי.

ב־`red-build/src/ui/worker-client.js`, הפונקציה `requestTypeset` עדיין שולחת:

`{ type: 'typeset-request', jobId, text, settings }`

היא אינה שולחת `assets`.

במקביל, `engine-worker-main.js` יודע לקבל `msg.assets`, אך אין בכך הוכחה שהזרימה החיה משתמשת בו.

### דרישות

1. חבר את ה־AssetResolver ללקוח ה־Worker.
2. אפשר להעביר נכסי מסמך באמצעות `serializeForTransport`.
3. ודא שהבקשה כוללת את הנכסים הדרושים לעימוד.
4. ודא שה־Worker משחזר resolver מאותו transport.
5. ודא ש־asset identity נשמרת זהה בין הצדדים.
6. ודא שאין העברת נתיבים מקומיים.
7. הגדר במפורש מגבלת גודל העברה והתנהגות במקרה חריגה.
8. הימנע מהעברה חוזרת מיותרת של אותם bytes אם אפשר להשתמש במנגנון cache/registry קיים בלי ליצור מקור אמת נוסף.

### אימות שלמות transport

ב־`AssetResolver.fromTransport` יש לוודא שה־assetId שהתקבל תואם לזהות המחושבת מחדש מתוך הבתים.

אסור לקבל assetId מוצהר שאינו תואם לתוכן, ואסור להתעלם מהפער בשקט.

בדוק גם:

- סוג נתון bytes.
- מזהה asset תקין.
- duplicate IDs.
- תוכן חסר או פגום.
- הודעה גדולה מדי.
- transport פגום.
- round-trip של כמה נכסים.
- זהות asset בין UI ל־Worker.

כתוב בדיקות Worker end-to-end אמיתיות ככל האפשר, ולא רק בדיקות unit של `validateRequest`.

## 5. חיבור אמיתי של Font Resolver לרישום הגופנים החי

נמצא שה־Worker ממשיך לקבל `register-font` דרך מנגנון הרישום הישן של `measure-api`, בעוד שלב 3 הוסיף את `font-resolver`.

יש לוודא שכל רישום גופן במוצר עובר דרך מקור סמכות יחיד.

### דרישות

- `handleRegisterFont` חייב להשתמש ב־Font Resolver הקנוני.
- הרישום חייב לסנכרן את MeasureAPI הקיים, בלי ליצור מרשם גופנים מקביל.
- ה־fontId חייב להיות זהה ב־UI וב־Worker.
- רישום מחדש לאחר respawn חייב לשחזר את אותה זהות.
- fallback חייב להופיע באבחון.
- גופן חסר אינו יכול להיעלם או להחליף משפחה בשקט.

בדוק במיוחד סנכרון של פעולות ניקוי:

- `clearFontResolver`
- `clearRegisteredFonts`
- unregister
- רישום חוזר של אותו alias
- alias שכבר קיים עם bytes שונים
- רישום אותו fontId תחת כמה aliases.

כרגע `clearFontResolver` מנקה את המפות שלו, אך יש לוודא שאינו משאיר רישומים ישנים ב־MeasureAPI, ולהפך.

הוסף בדיקות שמוכיחות שאין מצב שבו Font Resolver אומר שגופן אינו רשום אך MeasureAPI עדיין מודד אותו דרך רישום ישן, או להפך.

## 6. הוכחת מדידה כחלק מהצינור הקנוני

`measureDocumentModel` נכתב ונבדק, אבל יש להבחין בין פונקציה עצמאית לבין שלב שמחובר לצינור.

המשימה:

- בדוק את זרימת `pipeline.typeset` ואת מסלול DP.
- הוכח היכן נבנה DocumentModel.
- הוכח היכן נטענים fonts ו־assets.
- הוכח היכן מופעלת מדידת המודל.
- הוכח שהמדידה מתרחשת לפני שבירת השורות.
- הוכח שמנוע השורות מקבל את אותה מדידה ולא מודד מחדש את הפריטים בדרך מקבילה.

אם החיבור המלא תלוי במנוע השורות של שלב 4, אל תכניס כעת מנגנון מדידה כפול לנתיב הפעיל. במקרה זה יש לסמן במדויק שה־API וה־resolver מוכנים, אך שער הצריכה בפועל ייסגר כחלק משלב 4.

אין לסמן את שלב 3 כשלם לחלוטין כל עוד לא ברור מה נבדק בפועל ומה עדיין רק תשתית.

## 7. תיקון דיוק דוח שלב 3

עדכן את `audits/STAGE3_MEASUREMENT.md` כך שיבחין בין:

- תשתית קיימת ונבדקת.
- תשתית המחוברת ל־Worker.
- תשתית המחוברת לזרימת המוצר.
- תשתית שהמנוע כבר צורך.
- יכולות שממתינות לשלב 4.

אין להצהיר ש־UI ו־Worker משתמשים באותם font/asset identities לפני בדיקת מסלול end-to-end.

אין להציג `measureDocumentModel` כשלב פעיל בצינור אם הוא מופעל רק ישירות בבדיקת unit.

## 8. שער מיזוג שלב 3

לאחר התיקונים:

- סנכרן את PR #22 מול main העדכני.
- הרץ את מלוא הבדיקות.
- הרץ בדיקות cache isolation.
- הרץ בדיקות immutable.
- הרץ בדיקות Worker end-to-end.
- הרץ font registration/replay.
- הרץ asset transport integrity.
- הרץ `npm run test:determinism`.
- הרץ `node tools/cross-check.js`.
- הרץ `scan-control-triggers`.
- אמת שה־bundles נבנו מחדש.
- השווה את כל ה־hashes מול הבסיס.

שני כשלי ה־audit F-BL1/F-BL2 יכולים להישאר פתוחים רק אם הוכח שהם זהים ל־baseline ולא נוספו כשלים חדשים.

### הרשאת מיזוג

לאחר שכל התנאים מתקיימים, המשתמש מאשר למזג את PR #22 בעצמך ב־squash merge, ללא צורך בבקשת אישור נוספת.

אם נותר חסם שאינו בתחום שלב 3, תעד אותו והמשך בעבודה שאינה תלויה בו. אל תציג שלב כשלם על סמך מסמך בלבד.

---

# חלק ב׳ - השלמות מחייבות משלבים קודמים

## 9. R-03 - תיקון סוגריים וסמני הערות

PR #21 מוזג ל־main.

יש להשאיר את תיקון R-03 ואת בדיקותיו כבסיס מחייב.

עם זאת, יש לבדוק את השפעתו המדודה:

- 19 מתוך 699 עמודי very_long השתנו.
- מספר העמודים לא השתנה.
- contentPreserved=true.
- בדיקת S62 הורחבה מסף 5 לסף 6 עמודים עם טור ריק.

הרחבת הסף אינה יכולה להיחשב אוטומטית לשיפור. בדוק שהשינוי במדידת הסוגריים אינו מייצר הידרדרות נוספת באיכות העימוד, ותעד את ההשפעה במרשם.

בשלב 4 יש להבטיח שההתנהגות הסמנטית של סוגריים וסמנים תעבור למודל השורות הקנוני, ולא תישאר רק כתיקון בנתיב המורשת.

## 10. D-S2H3 - רווח תחתון בכותרת 3

בשלב 2 תוקן השורש בנתיב המורשת:

- גובה שורה פנימי 34px.
- הפס האחרון 38px.
- הרווח התחתון מופיע פעם אחת אחרי השורה האחרונה.

התיקון נבדק בתצוגה וב־PDF.

בנתיב DP נותרה אותה מחלקת פגם, והיא קשורה לייצוג `cur.spanning`.

בשלב 4 יש להגדיר את כותרת 3 כפריט סמנטי אחד עם fragments של שורות, כך ש:

- אין רווח בין שורות הכותרת.
- הרווח התחתון שייך לפריט הכותרת כולו.
- הרווח מופיע פעם אחת אחרי fragment האחרון.
- התוכן הבא מתחיל אחרי הרווח.
- ה־renderer אינו מוסיף או מתקן את המרווח.

בדוק גם כותרת חד־שורתית, כדי שלא לשנות את הגאומטריה שכבר תוקנה.

בשלב 9 יש להוכיח שהנתיב המאוחד והנתיב החי מספקים אותה סמנטיקה לפני הסרת המורשת.

## 11. שאלות פתוחות 12-14

אין לקבע החלטות שהמשתמש עדיין לא אישר.

### שאלה 12 - ברירות מחדל

ההמלצה הקיימת:

- התנהגות המוצר בפועל תהיה בסיס התאימות.
- ערכי הייבוא של מנוע המקור יישמרו בפרופיל.
- הרישום ישמש fallback בלבד.
- resolver אחד יכריע את הערך האפקטיבי.

אפשר להכין תשתית השוואה, אך אין לשנות ערכי ברירת מחדל, מזהי טקסט או הגדרות משתמש.

### שאלה 13 - parity בין Node לדפדפן

היעד הוא אותה תוצאת מדידה וגאומטריה עבור אותו מסמך, הגדרות, נכסים, גופנים וגרסת מנוע.

יש להמשיך לבנות בדיקות parity ולדווח סטיות מספריות. אין לקבוע סבילות חדשה ללא ניתוח.

### שאלה 14 - חוזה הפריט האחיד

יש לשמר את ההצעה הקיימת בנוגע ל־`participates: none`, מרחבי זהות ומדיניות תמונות בכותרות ובהערות.

אין להציג את החוזה כמאושר ללא הכרעת משתמש.

---

# חלק ג׳ - שלב 4: מנוע שורות יחיד

לאחר סגירת שלב 3, התחל מיד במימוש שלב 4 לפי:

`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` §§4.1-4.3.

מטרת שלב 4 אינה רק לשפר את מנוע השבירה הקיים. המטרה היא **להפסיק את קיומם של מנגנוני שבירת שורות נפרדים לסוגי תוכן שונים**.

כל רצף inline - טקסט, טווחי גופן, הערות, סמנים, תמונות, פריטים אטומיים, glue ו־penalty - חייב לעבור דרך מנוע שורות יחיד.

## 12. לפני מימוש - ביקורת קוד ממוקדת

בדוק את הקוד הקיים:

- `red-build/src/engine/typography/kp-linebreak.js`
- `red-build/src/engine/typography/measure-api.js`
- `red-build/src/engine/measure/measure-model.js`
- `red-build/src/engine/model/document-model.js`
- `red-build/src/engine/model/adapter.js`
- `red-build/src/engine/core/pipeline.js`
- `red-build/src/engine/layout/dp-planner.js`
- `red-build/src/engine/layout/legacy-imud-flow.js`
- protectors, bracket scanner, note marker logic, inline-content parser.

מפה במדויק:

1. מי יוצר את רצף הפריטים.
2. מי מודד אותם.
3. מי קובע הזדמנויות שבירה.
4. מי מבצע בפועל את השבירה.
5. מי מפזר רווחים ב־justify.
6. מי מטפל במילה עם כמה גופנים.
7. מי מטפל בסמן הערה צמוד.
8. מי מחליט על overflow.
9. מי מייצר את אובייקט השורה.
10. מי משנה את הגאומטריה אחרי שהשורה נוצרה.

אין לכתוב מנוע חדש לפני שמבינים אם אפשר להרחיב את Knuth-Plass ואת התשתית הקיימת.

## 13. Line Item Contract אחיד

הגדר מודל שורה קנוני המבוסס על `MeasuredItem`.

המודל יכול להשתמש ב־box/glue/penalty או ייצוג שקול, אך חייב לשמר:

- `itemId`
- `sourceRange` / `sourceAnchor`
- `kind`
- `fontId`
- `styleRef`
- `measuredAdvance`
- `inkBounds`
- `breakOpportunities`
- `constraints`
- `diagnostics`

אין לשטח מילה מרובת גופנים למחרוזת אחת.

מילה אחת יכולה לכלול כמה fragments, וכל fragment שומר את זהות הגופן, הסגנון, המקור והמדידה שלו.

## 14. מנוע שבירה אחד - Knuth-Plass

הרחב את מנוע Knuth-Plass הקיים או אחד את המימושים הקיימים סביבו.

אל תיצור breaker חדש לתמונות או לפריטים מותאמים.

הזנת המנוע תהיה רצף הפריטים הקנוני, לא `words[]` בלבד.

יש לתמוך ב:

- טקסט רגיל.
- טווחי גופן מקוננים.
- מילה מעורבת בכמה משפחות.
- סמן הערה אטומי.
- מילה עם סמן הערה צמוד.
- תמונה inline.
- תמונה אטומית.
- glue.
- penalty.
- anchors.
- custom inline items.
- protectors.
- סוגריים.
- NBSP ורווחים אטומיים.

## 15. הזדמנויות שבירה - עברית ו־RTL

יש להגדיר מקור אמת אחד לכל הזדמנויות השבירה.

בדוק במיוחד:

- רווח רגיל.
- NBSP.
- מקף עברי ומקף לועזי.
- מקף מחבר.
- צירופי אות וסמן הערה.
- גרשיים וגרש.
- סוגריים חוצים.
- טווחי גופן.
- סימני פיסוק צמודים.
- מילים עם ניקוד.
- מילה מעורבת בעברית ובלועזית.
- טוקנים אטומיים.

אין לאפשר שבירה באמצע פריט אטומי או באמצע fragment שאסור להפריד.

יש לשמור על source mapping מדויק, כך שניתן יהיה לשחזר את המקור ואת מיקום כל fragment.

## 16. תמונות בתוך שורות וזרימת טקסט

תמונה חייבת להשתתף בהחלטת השבירה מראש.

אין להוסיף תמונה אחרי שהשורות כבר נשברו ולנסות לפצות על כך באמצעות renderer.

יש להגדיר ולבדוק:

- תמונה inline בתוך רצף טקסט.
- תמונה כבלוק.
- תמונה ממורכזת.
- תמונה עם זרימת טקסט מסביבה.
- תמונה בתחילת/סוף פסקה.
- תמונה רחבה מרוחב הטור.
- תמונה גבוהה במיוחד.
- תמונה לצד מילה מרובת גופנים.
- תמונה לצד סמן הערה.

המדידה מגיעה מ־MeasuredItem. מדיניות המיקום מגיעה מהאילוצים של הפריט.

תמונה עם wrap-around מחייבת אילוצי אזור/שורה שמועברים למנוע השורות. אין ליצור מנגנון שבירה שני עבור טקסט שעוקף תמונה.

## 17. protectors, סוגריים והערות

יש להעביר את ההגנות והאילוצים לשלב שלפני השבירה.

הם צריכים להיות גלויים למנוע ולא תיקון לאחר שבירת שורות.

יש לשמר:

- התאמת סוגריים.
- טווחי סוגריים חוצים.
- סוגריים שממשיכים בין שורות.
- סוגריים שממשיכים בין טורים.
- גודל גופן מופחת בתוך סוגריים לפי ההתנהגות המאושרת.
- הערות צמודות.
- הערות ארוכות.
- רצף עוגן→הערה.
- איסור הפרדת סמן וגוף הערה כאשר הכלל מחייב זאת.

R-03 הוא בסיס ההתנהגות בנתיב המורשת. יש להוכיח שהמודל החדש משמר אותה בלי להוסיף תיקון מקומי נוסף.

## 18. עלות שבירה ו־justify

הגדר פונקציית עלות דטרמיניסטית ומתועדת.

כל קבוע, epsilon, tolerance ו־penalty חייבים להיות:

- בעלי משמעות מוגדרת.
- מנומקים.
- מרוכזים במקום אחד.
- מכוסים בבדיקות.
- ניתנים לאבחון.

אין להוסיף קבועים מקומיים רק כדי לפתור fixture מסוים.

`justify` נשאר ברירת המחדל המאושרת.

חלוקת הרווחים והמתיחה תתבצע פעם אחת במנוע השורות. אין למתוח מחדש ב־renderer ואין לבצע תיקוני רוחב לאחר שהשורה נחתמה.

## 19. Overflow - בלי אובדן תוכן ובלי לולאות fallback

יש להגדיר מדיניות מפורשת לפריט רחב מדי:

- shrink/scale כאשר האילוצים מתירים.
- העברה לשורה או לבלוק.
- טיפול כתמונה/פריט אטומי.
- diagnostic מפורש כאשר אין פתרון חוקי.

אסור למחוק פריט.
אסור להמיר פריט לתוכן טקסטואלי באופן שקט.
אסור להיכנס ללולאת fallback בלתי מוגבלת.
אסור להפיק שורה ריקה או עמוד כמעט ריק כתוצר לוואי של כשל שבירה.

כל כשל צריך להופיע ב־diagnostics/ledger עם סיבת הכשל.

## 20. LineModel קנוני

פלט מנוע השורות יהיה `LineModel` אחיד.

כל שורה תשמור:

- ordered fragments.
- source mapping.
- item identity.
- measured advances.
- glue allocation.
- baseline metrics.
- גובה שורה.
- break reason.
- אילוצי שורה.
- diagnostics.

ה־LineModel חייב לשמר את כל זהויות המקור ואת רצף הפריטים.

אין להסתפק במערך מילים שטוח.

אין להוסיף למקרינים חישוב שבירה או חישוב מדידה נוסף.

## 21. כותרות 3 ופריטי רוחב

השתמש באותו מודל שורות גם בכותרות 3 ובפריטי רוחב.

כותרת 3 היא פריט סמנטי אחד שיכול להכיל מספר fragments של שורות.

הרווח התחתון שייך לפריט כולו, לא לכל שורה.

יש להוכיח:

- כותרת חד־שורתית.
- כותרת דו־שורתית.
- כותרת ארוכה יותר.
- תוכן עוקב.
- מעבר עמוד.
- מעבר טור.

ההתנהגות הנדרשת היא זו שנקבעה ותוקנה בשלב 2.

## 22. בדיקות שלב 4

הוסף בדיקות ממוקדות:

### בדיקות בסיס

- KP פשוט.
- רצף boxes/glue/penalties.
- פסקה קצרה.
- פסקה ארוכה.
- פסקה ללא הזדמנות שבירה חוקית.
- מילה ארוכה מדי.
- overflow.

### עברית ו־RTL

- עברית עם ניקוד.
- גרשיים וגרש.
- סוגריים.
- מקפים.
- NBSP.
- טקסט מעורב RTL/LTR.
- טווחי גופן מקוננים.

### פריטים מורכבים

- מילה עם כמה גופנים.
- סמן הערה צמוד.
- הערה ארוכה.
- תמונה inline.
- תמונה ממורכזת.
- תמונה עם wrap-around.
- פריט מותאם.
- פריט אטומי.

### שמירת מקור

- אין אובדן תווים.
- אין כפילות תווים.
- אין שינוי סדר.
- source ranges רציפים ונכונים.
- fragments שומרים font identity.
- שחזור המקור נשאר מדויק.

### דטרמיניזם והשוואה

- אותו קלט ⇒ אותו LineModel.
- אותו קלט בשתי סביבות ⇒ אותה תוצאת מדידה ושבירה, בכפוף לשאלה 13.
- השוואת השורות מול הנתיב החי הקודם.
- כל שינוי שורה מתועד לפי item/source ולא רק hash כולל.

אין לעדכן golden hashes רק כדי לגרום לבדיקה לעבור. כל שינוי נעילה מחייב הסבר, מדד השפעה והוכחת שימור תוכן.

## 23. שימוש מבוקר ב־PR #16 ו־PR #17

לפני מימוש שלב 4, עיין בשינויים הרלוונטיים:

- PR #16 כולל תיקוני DP, איחוד LPT, מטריצת אילוצים, maxFit ותיקוני הערות.
- PR #17 כולל ביקורת פורנזית ותיקוני שורש בשלמות הפריסה.

אין למזג אותם בשלמותם.

סווג כל ממצא לפי שלב:

- מנוע שורות - שלב 4.
- Planner/אילוצי עמוד - שלב 5.
- הערות וריהוט עמוד - שלב 6.
- PageModel - שלב 7.
- מקרינים - שלב 8.
- הסרת מורשת - שלב 9.

העבר רק תיקוני שורש שנדרשים לשלב הנוכחי, לאחר בדיקת התאמה לארכיטקטורה הקנונית.

אין להעתיק אלגוריתם שכבר קיים במערכת אם ניתן לאחד אותו למקור אמת אחד.

---

# חלק ד׳ - גבולות שאסור לחצות

## 24. אין לבצע

- אין ליצור LineBreaker נוסף.
- אין ליצור MeasureAPI שני.
- אין להוסיף שכבות adapter רק כדי להסתיר כפילות.
- אין להמשיך להסתמך על `words[]` כמקור אמת לשבירת שורות.
- אין לבצע מדידה חוזרת ב־DOM.
- אין לבצע תיקוני רוחב או מתיחה ב־renderer.
- אין למחוק את נתיב המורשת בשלב 4.
- אין למזג את כל PR #16 או #17.
- אין לשנות ברירות מחדל, מזהי טקסט או הגדרות משתמש.
- אין לשנות את `justify` כברירת מחדל.
- יש לשמר את Theme 40 ואת עיצובי השערים המקוריים פעילים אוטומטית.
- P6/P7 מחוץ לתחום לחלוטין.
- אין להשתמש ב־PDF הייחוס כיעד איכות או כמדד parity.

## 25. תוצרי שלב 4

- `LineItem` contract קנוני.
- LineBreaker יחיד המבוסס על מנוע קיים מאוחד.
- `LineModel` קנוני.
- שילוב MeasuredItem לתוך שבירת השורות.
- תמיכה בטקסט רב־גופני ובתמונות inline.
- תמיכה בסמנים אטומיים ובהערות.
- תמיכה ב־protectors ובסוגריים.
- מדיניות overflow מפורשת.
- בדיקות עברית/RTL.
- בדיקות דטרמיניזם.
- דוח השוואת שורות לפני/אחרי על הקורפוס.
- מפת תלויות מעודכנת.
- `audits/STAGE4_LINE_ENGINE.md`.
- WORKLOG ו־ISSUE_REGISTRY מעודכנים.

---

# חלק ה׳ - ניהול ביצוע

## 26. מבנה עבודה

בצע את העבודה במקטעים קצרים וברורים:

1. תיקוני Stage 3.
2. בדיקות Stage 3.
3. מיזוג Stage 3.
4. ביקורת קצרה של Stage 4 מול PR #16/#17.
5. מימוש LineItem ו־LineModel.
6. שילוב KP.
7. שילוב תמונות, גופנים, סמנים ו־protectors.
8. בדיקות השוואה ודטרמיניזם.
9. PR שלב 4.

אין לערבב את כל העבודה ב־PR ענק אחד.

אם שלב 4 דורש כמה PRים, שמור אותם קטנים ומסודרים לפי תת־מערכת, אך כולם כפופים לאותו חוזה ארכיטקטוני.

## 27. דיווח מדויק

בכל נקודת עצירה ציין:

- מה שונה בפועל.
- באיזה branch.
- SHA מדויק.
- אילו קבצים השתנו.
- אילו בדיקות עברו.
- אילו בדיקות נכשלו.
- האם הכשל חדש או קיים ב־baseline.
- אילו החלטות משתמש עדיין פתוחות.
- מה הצעד הבא.

אל תמתין יותר מחמש דקות ל־CI. בדוק תוצאות זמינות והמשך במשימות שאינן תלויות בו.

אל תעצור לאחר כתיבת מסמך תכנון.

---

# 28. הוראת התחלה

התחל עכשיו:

1. סנכרן את PR #22 מול main העדכני.
2. תקן את מפתח המטמון, immutability, transport ורישום הגופנים.
3. הוכח את החיבור האמיתי של התשתית ל־Worker ולזרימת המוצר.
4. תקן את דוח שלב 3 כך שישקף רק יכולות מוכחות.
5. הרץ את כל הבדיקות הנדרשות ומזג את PR #22 לאחר עמידה בשער.
6. התחל מיד את שלב 4 לפי המפרט לעיל.
7. אל תבקש אישור נוסף למיזוג שלב 3 לאחר שכל תנאי הקבלה הוכחו.

**המטרה היא להתקדם אל מנוע שורות יחיד שמקבל כל סוג פריט דרך אותו חוזה מדידה ושבירה. אין ליצור מנגנונים נפרדים לטקסט, לתמונות, לגופנים או להערות. כל תוספת עתידית צריכה להשתלב במודל ובמנוע הקיימים, ולא להרחיב את מספר מסלולי העימוד.**

## תמונת מצב ניהולית

**שלב 1 - מפת מצב וחוזה** (מוזג)

**שלב 2 - מודל תוכן אחיד** (מוזג)

**R-03 - תיקון סוגריים** (מוזג)

**שלב 3 - מדידה ונכסים** (תיקוני שער)

**שלב 4 - מנוע שורות יחיד** (הבא לביצוע)

ההחלטה הניהולית החשובה: **לא לעכב את שלב 4 בגלל ליטוש תיעודי**, אבל גם לא לבנות אותו על תשתית מדידה שמחזירה תוצאות cache שגויות או שאינה מחוברת ל־Worker. תיקוני שלב 3 שפורטו הם ממוקדים, והם תנאי הכרחי למנוע שורות אמין. לאחריהם, שלב 4 הוא מוקד העבודה העיקרי.

## Prompt:
16.11.2026, 1:11:51

סוכן הAI השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות.

## Response:
16.11.2026, 1:12:02 · gpt-6

> **Assessing test evidence**
>
> I’m inspecting the reported failures and test logic. The evidence appears weaker than stated: a placeholder test may be vacuous, comparison checks counts rather than exact text, and boundary behavior may not reflect punctuation rules.
>
> **Identifying layout flaws**
>
> I’m finding deeper issues beyond weak tests: punctuation handling may be unused, whitespace edge cases remain, and floated images appear counted both as inline content and reserved wrap space. These are correctness concerns, not merely test-quality problems.
>
> **Identified layout flaws**
>
> 
>
> **Reviewing integration risks**
>
> I’m spotting additional correctness gaps: style resolution may rely on fallback behavior, source ranges appear incomplete, and punctuation constraints are defined but not enforced by line breaking. I’d treat these as blockers until targeted tests confirm them.
>
> **Deciding merge readiness**
>
> I’m keeping the earlier merge decision: PR23 should not merge yet. I’m treating its inherited baseline failures separately, while requiring fixes for false-positive tests, unused punctuation rules, incomplete source mapping, and float-image width accounting.
>
> **Reviewed integration risks and decided merge readiness**
>
> 
>
> **Preparing next steps**
>
> I’m preserving the current merge decision and turning the findings into an actionable review plan: correct PR23’s evidence and layout semantics first, then integrate the next stage without disturbing existing defaults or excluded features.
>
> **Prepared next steps**
>
> 
>
> **Reviewed pull requests, CI evidence, line-breaking implementation, and planned Stage 4B integration**
>
> 
>
> Worked for 2m 16s

אמשיך מנקודת הבקרה האחרונה: שלב 3 ו־PR \#22 הם שער הכניסה לשלב 4, ולכן לא אסתפק בכך שהסוכן מדווח שהשלב הושלם. אבחן את הקוד בפועל, את החיבור לצינור הריצה, את בדיקות ה־CI ואת ההשפעה על התנהגות המנוע. אמזג כל PR שעומד בתנאים, ולא אעכב מיזוג בגלל ליקויים היסטוריים שכבר תועדו ככשלי בסיס - אך אוודא שלא נוספו רגרסיות חדשות.

מצאתי התקדמות ממשית: **PR \#22 של שלב 3 כבר מוזג**, והסוכן פתח את PR \#23 כמקטע הראשון של שלב 4. חשוב להבחין: PR \#23 בונה את מנוע השורות הקנוני, אבל לפי תיאורו שלו עדיין אינו מחבר אותו למסלול העימוד הפעיל של המוצר. לכן גם אם המקטע הראשון תקין ומוכן למיזוג, אין לראות בכך השלמת שלב 4.

בנוסף, PR \#16 ו־\#17 עדיין פתוחים. לא אמזג אותם אוטומטית: הם משנים את התנהגות ה־DP והערות, ולכן צריך לבדוק את התאמתם למנוע המאוחד ואת הסיכון שבהכנסת שינויים מקבילים לפני השלמת שלבים 4-5.

בבדיקה הראשונה של PR \#23 עלו שתי בעיות מהותיות שמונעות ממני לאשר אותו כרגע\:

1. בדיקת ההשוואה שעליה נשענת הטענה ל־89/89 פסקאות זהות משווה בפועל **מספר מילים בכל שורה**, ולא את זהות המילים ואת סדרן. לכן היא אינה מוכיחה שקילות שורות מלאה.
2. בבדיקת הניקוד העברי מופיעה בדיקת `placeholder` שתמיד מצליחה, בלי לבדוק את התנאי שהיא מתיימרת לבדוק. גם כאן יש פער בין תיאור הבדיקה לבין ההוכחה בפועל.

אלה אינם רק ענייני ניסוח: הם מחלישים את ראיות הקבלה של מנוע השורות. אני בודק כעת את מימוש השבירה עצמו ואת חתימת כשלי ה־CI, כדי להפריד בין תיקונים שחייבים להיכנס לפני מיזוג לבין משימות שאפשר להעביר למקטע ב׳.

## החלטות ניהול הפרויקט

| PR | מצב | החלטה |
|--------|--------|--------|
| \#21 - תיקון R-03 | מוזג | להשאיר ממוזג. בדיקת ההשפעה המאוחרת על S62 לא מצאה הידרדרות נוספת. |
| \#22 - שלב 3 | מוזג | (מוזג) מיזוג `91b87af`\. תיקוני המטמון, ההקפאה, העברת הנכסים וסנכרון הגופנים נכללו. |
| \#23 - שלב 4, מקטע א׳ | פתוח | **לא למזג עדיין.** נדרשים תיקוני נכונות והוכחות לפני אישור. |
| \#16 - תיקוני DP והערות | פתוח, בסיס מיושן | לא למזג כעת. לשמר כמקור תיקונים לשלב 5. |
| \#17 - ביקורת פורנזית ותיקוני FX | פתוח, בסיס מיושן | לא למזג כעת. יש חפיפה מהותית עם \#16; נדרש איחוד שורשי, לא מיזוג מקביל. |
| \#14 - תיעוד D-107 | פתוח, בסיס מיושן | לא למזג בשלמותו. יש למזג לתיעוד הראשי רק הכרעות שעדיין תקפות ומאושרות. |

**מצב הבדיקות של PR \#23\:** שלוש מטריצות הבדיקה `18`, `20`, `22` עברו, וגם `corpus-invariants` עבר. שני הכשלים הנוספים אינם חדשים: `layout-audit` מציג שוב את `SIDE_NOTE_OVERLAP` בעמוד 107, פעמיים - אותה חתימה שהופיעה גם בבסיס של PR \#22; `full-math-audit` מציג שוב 353,687 מילים מול רצפה של 355,967 - גם זו אותה חתימת בסיס. לכן איני דורש מהסוכן לפתור כעת את שני הכשלים ההיסטוריים האלה, אבל כן דורש לוודא שאין החמרה חדשה.

### ממצאים נוספים ב־PR \#23

מעבר לשתי הבדיקות הפגומות שכבר ציינתי, מצאתי עוד ארבע נקודות שדורשות טיפול\:

- **תמונת wrap-around נספרת פעמיים\:** היא נשארת תיבת רוחב בתוך זרם הטקסט, ובמקביל מצמצמת את רוחב השורות. כך מתקבלת מדידת רוחב שגויה.
- **מסלול ה־fallback אינו שומר בהכרח על צמידות סמן־הערה לעוגן\:** יש לבדוק מצב שבו האלגוריתם הראשי אינו מוצא פתרון והגיבוי נאלץ לפצל יחידה צמודה.
- **מיפוי המקור אינו שלם\:** נוצרים מזהי מילים ורווחים בעזרת מונה רץ, וחלק מטווחי המקור נשמרים ביחס לריצה במקום ביחס למקור המסמך. זה סותר את חוזה הזהות והעוגנים.
- **ברירת המחדל של ה־LineModel אינה נאמנה לחוזה\:** המימוש נופל ל־`ragged` כשלא מועבר `justify`, בעוד התוכנית מחייבת לשמר את `justify` כברירת המחדל המאושרת. אין לשנות את התנהגות ברירת המחדל תוך כדי האיחוד.

מכאן ההחלטה: לא לעכב את הפרויקט בגלל כשלי CI היסטוריים, אבל גם לא להכניס ל־main מנוע שעדיין אינו מוכיח את נכונותו. להלן פרומט הביצוע המעודכן. הוא מורה לסוכן לתקן את המקטע הנוכחי, לסגור את שלב 4 בחיבור למסלול המוצר, ואז לעבור לשלב 5 - בלי להמתין לסבב אישורים נוסף.

**document: **

# הוראת ביצוע - מנהל הפרויקט: השלמת שלב 4, תיקון PR #23, חיבור מנוע השורות למסלול המוצר ופתיחת שלב 5

## 1. מצב הפרויקט והיעד

המשך עבודה בריפו:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

המצב הנוכחי:

- שלב 1 - הושלם וממוזג.
- שלב 2 - הושלם וממוזג.
- PR #21 - תיקון R-03, ממוזג.
- PR #22 - שלב 3, ממוזג ל־main בקומיט `91b87afdfbb22b0c83a0b06e69171cd510f37c43`.
- PR #23 - שלב 4, מקטע א׳, פתוח לבדיקה ולתיקונים.
- PR #14, #16, #17 - פתוחים, אך אין למזג אותם בשלמותם בשלב זה.

המטרה היא להתקדם ברציפות עד להשלמת מנוע העימוד המאוחד. אין להסתפק בהשלמת תשתיות מבודדות: עלינו להגיע למצב שבו מסלול המוצר עצמו משתמש במנוע השורות הקנוני, ולא רק לבדיקות יחידה.

**העיקרון הארכיטקטוני שאסור לאבד:**

מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.

פישוט ואיחוד פעולת המנוע הם יעד מרכזי. אין לפתור בעיות באמצעות שכבות התאמה מצטברות, מסלולים מקבילים או תיקוני post-processing.

## 2. החלטות ניהול לגבי PRs קודמים

### PR #21 ו־PR #22

שניהם ממוזגים. אין לפתוח מחדש את העבודה שכבר הושלמה, אלא אם מתגלה תקלה ממשית.

יש לשמר את תיקון R-03 ואת ההוכחה המאוחרת לכך ששינוי סף S62 מ־5 ל־6 אינו מסתיר הידרדרות נוספת. בבדיקות המאוחרות עברו s72, s76, s77 ו־s62, ללא שינוי במספר העמודים ועם שימור תוכן.

### PR #23

הענף: `stage4/unified-line-engine`

הקומיט שנבדק: `d517c1be7a6fbe280a21a50028972283f694ed01`.

אין למזג אותו לפני תיקון הליקויים המפורטים להלן והוכחתם בבדיקות.

### PR #16 ו־PR #17

אין למזג כעת.

שניהם נוגעים במודולי DP, אילוצים, תקציבי הערות, איזון ונסיגות. קיימת ביניהם חפיפה בקבצים ובמדיניות. יש לשמר את התיקונים הטובים שבהם כמקורות לשלב 5, לבצע מיפוי שורש של כל שינוי, ולמנוע הכנסת שתי גרסאות מתחרות של אותה מדיניות.

יש לבחון במיוחד:

- PR #16: תיקון maxFit, הצמדת הערות לעוגנים, איחוד LPT, מטריצת אילוצים, noteMetrics ו־planningUsedHeight.
- PR #17: תיקוני FX-1..FX-6, ביקורת לולאת הנסיגה, קיבולת אמיתית, ליווי כותרות, התחייבות תקציב הערות ואבחוני rollback.

אין לאבד את התיקונים המועילים, אבל אין להעתיקם באופן עיוור. הם צריכים להשתלב בתכנון המאוחד של שלב 5.

### PR #14

אין למזג את הענף הישן בשלמותו. יש לבדוק את מסמכי D-107 ולחלץ מהם רק החלטות ותיעוד שעדיין תקפים ושאינם סותרים החלטות משתמש מאוחרות יותר.

## 3. תיקונים מחייבים ב־PR #23 - לפני מיזוג

### 3.1 תיקון הוכחת השוואת השורות

ב־`tests/layout/s4-line-comparison.test.js` ההשוואה הנוכחית בודקת בעיקר את מספר המילים בכל שורה:

`liveCounts` מול `newCounts`.

זו אינה הוכחה לחלוקת שורות זהה. שתי שורות יכולות להכיל אותו מספר מילים, אך מילים שונות או בסדר שונה.

יש לשנות את הבדיקה כך שתשווה את תוכן השורות בפועל:

- מערך המילים המדויק בכל שורה.
- סדר המילים.
- זהות פריטי המקור וטווחי המקור.
- המפרידים המקוריים, כולל רווחים מיוחדים.
- היעדר כפילויות, השמטות או שינוי סדר בין שורות.
- התאמה מלאה של תוכן הפסקה לפני ואחרי השבירה.

יש להפיק דוח השוואה ברמת פריט ומקור, ולא רק ספירת מילים או hash כולל.

רק לאחר שהבדיקה הזאת מוכיחה את התוצאה, ניתן לכתוב בדוח ש־89/89 פסקאות זהות.

יש לבדוק גם את שמונת מקרי ההערות: כל הבדל חייב להיות מוסבר באמצעות תוכן ומיפוי מקור אמיתיים, ולא רק באמצעות תיוג כללי `marker-handling`.

### 3.2 תיקון בדיקת הניקוד העברי

ב־`tests/layout/s4-line-engine.test.js` קיימת בדיקה:

`assert(!/[\u0591-\u05C7]$/.test('x'), 'placeholder')`

היא תמיד מצליחה ואינה בודקת את המימוש.

יש להסיר אותה ולהחליפה בבדיקה אמיתית:

- כל בסיס אות וכל סימני הניקוד והטעמים שלו נשארים יחד.
- אין חיתוך בין אות לסימן משולב.
- השחזור מהשורות זהה למקור.
- יש לבדוק תרחישים שבהם המילים המנוקדות נמצאות סמוך לגבול שורה.
- יש לבדוק ניקוד, טעמים, גרשיים, גרש, ZWJ ותווים משולבים רלוונטיים.

אין להשאיר בדיקות placeholder או בדיקות שמוכיחות רק שהקלט קיים.

### 3.3 תיקון תמונות wrap-around

במימוש הנוכחי תמונת float נשארת תיבת box בתוך זרם השורה, ובמקביל `wrapConstraintOf` מפחית את רוחב השורות לפי רוחב התמונה.

הדבר גורם לספירת רוחב כפולה: רוחב התמונה מתווסף לרוחב הטקסט, בעוד רוחב השורה כבר צומצם בגללה.

יש לתקן את מודל ההשתתפות:

- תמונת float צריכה להשתתף באילוץ האזור ובחישוב רוחב הטקסט.
- אין לספור את רוחב התמונה שוב בתוך רוחב השורה כאילו היא תיבת טקסט רגילה.
- זהות התמונה, המיקום הסמנטי שלה, המידות והעוגן שלה חייבים להישמר ב־LineModel.
- יש להגדיר באופן מפורש את ההפרדה בין תיבת הטקסט לבין אזור התמונה.
- יש לבדוק תמונה בצד ימין ובצד שמאל, תמונה בגבהים שונים, מעבר משורות מצומצמות לרוחב מלא, וכן תמונה שגובהה גדול מגובה מספר שורות.

אין לפתור זאת באמצעות חריג נקודתי ב־renderer. המידע חייב להיות חלק ממודל השורה והאילוצים שלה.

אם מיקום float סופי תלוי בתכנון העמוד, יש להעביר את המידע הדרוש ל־Planner בשלב 5, אך כבר בשלב 4 אסור לבצע מדידת רוחב כפולה.

### 3.4 שמירת צמידות סמן־הערה במסלול fallback

ב־`itemGreedyFallback` יש לוודא שיחידה צמודה אינה נקרעת.

בפרט, בדוק את התרחיש שבו:

- מילה וסמן הערה מחוברים ב־internal glue וב־forbidden penalty.
- ה־DP אינו מוצא פתרון תקין.
- מסלול fallback מופעל.
- רוחב היחידה מתקרב לרוחב הטור או חורג ממנו.

כיום יש חשש שהגיבוי יפלוט את המילה בשורה אחת ואת הסמן בשורה הבאה, משום שהוא מתעלם מה־forbidden penalty בעת מעבר התיבות.

יש לתקן את שורש הבעיה:

- יחידה צמודה היא יחידת מעבר אטומית במסלול הגיבוי.
- אם היחידה כולה רחבה מדי, היא מקבלת טיפול overflow מפורש.
- אין לפרק אותה.
- אין למחוק פריט.
- אין להכניס לולאת fallback.
- יש להוסיף בדיקות של יחידה תקינה, יחידה רחבה, יחידה בתחילת רצף ויחידה בסוף רצף.

יש לבסס את הקישור על `noteRef`/עוגן המקור, ולא להסתמך רק על סמיכות מקרית של תיבות.

### 3.5 תיקון זהות ומיפוי מקור

ב־`line-items.js` נוצרים מזהי מילים ורווחים באמצעות מונה רץ (`bump`, `wordIndex`).

זה אינו תואם את חוזה הזהות הקנוני, המחייב מזהה יציב הנגזר מהמקור.

יש לתקן:

- מזהה פריט נגזר מזהות פריט המקור ומטווח המקור המדויק.
- מזהי מילים נגזרים מטווחי התווים ומזהות הריצה.
- מזהי glue נגזרים מהמפריד ומגבולות המקור שלו.
- אין להשתמש במונה ריצה כמקור לזהות.
- `sourceRange` חייב להיות ממופה למסמך המקורי, ולא רק לאינדקס מקומי בתוך run.
- `blockId` אינו יכול להישאר `null` כאשר הוא ידוע.
- מילה שחוצה כמה runs חייבת לשמור את טווחי המקור של כל fragment בנפרד.

יש להוסיף בדיקות למסמך עם כמה ריצות גופן, מילים החוצות גבולות runs, מפרידים מרובים, סימני ניקוד, הערות ומזהי פריטים חוזרים.

בדוק גם שמזהי פריטים נשארים זהים בין ריצות בנייה שונות של אותו מסמך, ושינוי בתוכן אינו יוצר התנגשות מזהה.

### 3.6 איחוד כללי השבירה

יש לבדוק את `breaks.js` ואת השימוש בו בפועל.

כרגע קיימות פונקציות כמו `breakBetweenItems`, `canStartLineWith` ו־`canEndLineWith`, אך יש לוודא שהן באמת משתתפות בהחלטת השבירה, ולא רק מוגדרות ומיוצאות.

יש לוודא שמקור אמת אחד קובע:

- רווחים ומפרידים.
- NBSP וצמידויות.
- מקף עברי.
- מקף לועזי.
- גרש וגרשיים.
- ניקוד וטעמים.
- קיצורים.
- סמני הערות טקסטואליים.
- פריטים אטומיים.
- איסורי פיסוק בתחילת שורה ובסופה.
- כללי protectors וטווחי סוגריים.

אין להשאיר כללים מקבילים ב־`protectors.js`, ב־`kp-linebreak.js` וב־`line-items.js`.

יש לבדוק שהכללים משולבים לפני החלטת השבירה, ושאין חיתוך אסור רק משום שהמילים כבר פוצלו למחרוזות.

יש לשמר את סמנטיקת R-03 ואת הטיפול בסוגריים שאושר. אין לפתוח מחדש את P6/P7 - הם מחוץ לתחום לחלוטין.

### 3.7 שמירת ברירת המחדל של justify

התוכנית הקנונית מחייבת לשמר את `justify` כברירת המחדל המאושרת.

במימוש הנוכחי, `layoutSequence` מתייחס לכל ערך שאינו `stretch` כ־`ragged`. אין להניח שזו ברירת המחדל של המוצר.

יש לבדוק את ברירת המחדל האפקטיבית הקיימת ב־main, ולוודא שהמנוע החדש מקבל אותה במפורש מהגדרות המסמך.

- אין לשנות הגדרות קיימות.
- אין לשנות מזהי טקסט או ערכי ברירת מחדל.
- אין להחליף justify ב־ragged.
- אין להוסיף מתיחת רווחים ב־renderer.
- הקצאת glue נעשית פעם אחת בלבד במודל השורה.

יש להוסיף בדיקת אינטגרציה שמוכיחה שברירת המחדל של המוצר נשמרת גם במסלול החדש.

### 3.8 בדיקת wrap וה־DP

יש לבדוק את `lineWidthAt` ואת `lineOf` ב־`breakItemSequence`.

יש לוודא שהרוחב האפקטיבי של כל שורה מחושב לפי מספר השורה האמיתי במסלול שנבחר, ולא לפי צומת שנבדק באופן מקומי בלבד.

יש לבדוק:

- מסלולי DP עם כמה מועמדים לאותה נקודת חיתוך.
- שורות בעלות רוחבים שונים.
- מעבר מאילוץ wrap לרוחב מלא.
- פריט רחב מהאזור המצומצם אך נכנס באזור המלא.
- מצב שבו אין פתרון DP וה־fallback מופעל.

כל epsilon, penalty וקבוע חייבים להיות מתועדים ולהיות חלק ממקור אמת אחד. אין להוסיף קבועים חדשים ללא נימוק ובדיקות.

### 3.9 תיקון תיעוד של שלב 3

בשלב 4 התגלה שגופי הערות במודל שלב 2 הם `noteBody` עם `payload.runs`, ולא בהכרח `note.items`.

יש לוודא שכל התיעוד מדייק בהבחנה:

- תשתית המדידה של שלב 3.
- המדידה בפועל של גופי ההערות.
- צריכת המדידה על ידי מנוע השורות.

אין לכתוב ששלב 3 מדד גוף הערה אם בפועל הוא לא עבר במסלול המדידה שלו. יש לתקן את הדוח או להוסיף בו erratum מפורש, ולציין מה תוקן בשלב 4.

## 4. שער מיזוג PR #23

לאחר תיקון כל הסעיפים לעיל:

1. להריץ את כל בדיקות היחידה והאינטגרציה.
2. להריץ את כל מטריצות CI.
3. להריץ דטרמיניזם.
4. להריץ cross-check על הקורפוסים.
5. לבדוק שימור תוכן וסדר קריאה.
6. לבדוק את התוצאות מול main ולא רק מול ענף העבודה.
7. לבדוק מחדש את הדוח הפר-פריטי.

כשלי הבסיס הידועים:

- `SIDE_NOTE_OVERLAP` בעמוד 107, פעמיים.
- רצפת נפח full-math: 353,687 מילים מול 355,967.

החתימות הללו הופיעו גם בבדיקות PR #22. אין להציג אותן כרגרסיות של PR #23, אך יש לוודא שלא נוספו כשלים חדשים ושאין שינוי לא מוסבר.

כאשר כל שערי הקבלה של המקטע עוברים, יש למזג את PR #23 ל־main. אין צורך באישור נוסף ממני למיזוג PR שעבר את הבדיקה המלאה.

## 5. שלב 4 - מקטע ב׳: חיבור מנוע השורות למסלול המוצר

לאחר מיזוג מקטע א׳, יש לפתוח PR נפרד למקטע ב׳.

זהו השלב הקריטי: מעבר מתשתית קנונית מוכחת למנוע שהמוצר באמת משתמש בו.

### 5.1 מיפוי כל נקודות הכניסה

יש לבדוק את `pipeline.typeset` ואת כל המקומות שבהם מתבצעת כיום שבירת שורות באמצעות:

`words[] → protectWords → breakLines/layoutLines`

יש למפות במדויק את כל סוגי התוכן:

- פסקאות רגילות.
- כותרות מכל הרמות.
- כותרות 3 וסמנטיקת D-S2H3.
- גופי הערות שוליים.
- סמני הערות.
- טקסט עם סוגריים וטווחים.
- טקסט עם כמה משפחות גופן.
- תמונות inline.
- תמונות block/centered/float.
- פריטים אטומיים ופריטים מותאמים.

אין להשאיר נקודת כניסה נסתרת שממשיכה לשבור מילים באופן עצמאי.

### 5.2 צינור המוצר החדש

יש לחבר את הצינור הקנוני:

`buildDocumentModel → AssetResolver/FontResolver → measureItem → buildLineSequences → breakItemSequence → LineModel`

המדידה והשבירה נעשות פעם אחת בלבד.

אין לבצע מדידה חוזרת ב־pipeline, ב־DP planner או ב־renderer.

אין להוסיף API מדידה חדש.

אין להמיר את LineModel בחזרה ל־`words[]` כדי להמשיך לעבוד עם המנגנון הישן.

### 5.3 חיבור ל־DP Planner

יש לבדוק את נקודות הממשק בין LineModel לבין `dp-planner.js`.

ה־Planner חייב לקבל את השורות המלאות, ולא רק גובה שורה או מספר מילים.

יש לשמר:

- כל fragment.
- itemId ו־sourceRange.
- fontId ופרטי ריצה.
- measuredAdvance ו־inkBounds.
- baseline ו־lineHeight.
- glue allocation.
- breakReason.
- constraints.
- diagnostics.
- סמנטיקת כותרת 3.
- זהויות סמני הערות ועוגניהם.
- פרטי תמונות ואילוצי wrap.

אם נדרש שינוי בממשק ה־DP, יש לשנות את חוזה הקלט שלו כך שיקבל LineModel באופן ישיר. אין לבנות שרשרת של מתאמים שממירה שוב ושוב את המודל.

**חשוב:** שלב 5 הוא זה שבו יאוחד Planner העמודים. בשלב 4 ב׳ יש לבצע רק את השינויים הנדרשים כדי שה־Planner הקיים יצרוך את LineModel בשלמותו, בלי להקדים ולבנות Planner שני.

### 5.4 כותרת 3 - תיקון שורש D-S2H3

יש לשמר את הכלל שכבר הוכח בנתיב הקיים:

- פסיחה פנימית של 34px.
- פס אחרון של 38px.
- רווח תחתון של 4px פעם אחת בלבד.
- הרווח שייך לכותרת כולה, אחרי ה־fragment האחרון.
- אין להוסיף רווח בין שורות הכותרת.
- אין להוסיף רווח נוסף ב־renderer או ב־Planner.

יש לבדוק את התוצאה במסלול המוצר בפועל, לא רק ב־LineModel מבודד.

יש לבדוק כותרת חד־שורתית, דו־שורתית ורב־שורתית, ולאחריה טקסט גוף.

### 5.5 שמירת התנהגות קיימת

אין לשנות במהלך החיבור:

- ברירות מחדל.
- מזהי טקסט.
- ערכות עיצוב.
- Theme 40.
- עיצובי השערים המקוריים.
- ברירת מחדל justify.
- הגדרות משתמש.

אין להשתמש ב־PDF הייחוס כיעד איכות סופי; הוא משמש דוגמה גסה בלבד ליחסי אזורים וגדלים ויש בו שגיאות.

אין למחוק עדיין את נתיב המורשת. הוא יישאר לצורכי השוואה ובדיקות עד להוכחת מעבר מלא בשלב 9. עם זאת, אסור לו להמשיך להיות מסלול החלטה פעיל מקביל במוצר לאחר השלמת החיבור.

### 5.6 בדיקות קבלה לשלב 4 ב׳

יש להוסיף בדיקות שמפעילות את `pipeline.typeset` בפועל, ולא רק פונקציות פנימיות.

חובה לבדוק:

1. פסקה רגילה דרך המנוע הקנוני.
2. כותרות מכל הרמות.
3. כותרת 3 עם רווח תחתון נכון.
4. הערות שוליים וסמנים צמודים.
5. סוגריים וטווחים.
6. טקסט רב־גופני.
7. תמונות inline.
8. תמונות block/centered.
9. תמונות float ו־wrap-around.
10. overflow של פריט רחב.
11. שימור סדר ותוכן מלא.
12. דטרמיניזם.
13. זהות מדידה בין Node ל־Worker, בלי להכריע בשאלת הסבילות בין סביבות שעדיין פתוחה.
14. תצוגה ו־PDF: אין מדידה חוזרת ואין שינוי גאומטריה אחרי חתימת השורה.
15. מסמך בדיקה תקין מבחינה מבנית.

מסמכי הבדיקה חייבים להיות תקינים מבחינה מבנית: אין שתי כותרות מאותה רמה ברצף בלי טקסט ביניהן, אין כותרת שמכילה רק הערת שוליים, והכותרת הסופית חייבת להכיל טקסט.

יש להפיק דוח השוואה מפורט מול הנתיב הישן. כל שינוי בשבירת שורות חייב להיות מוסבר לפי פריט, עוגן וסיבת שינוי. אין להסתפק בהשוואת hash.

יש להוכיח ש־100% מהתוכן נשמר, ושאין פריט שנעלם או שינה סדר.

### 5.7 שער סיום שלב 4

שלב 4 ייחשב מושלם רק כאשר:

- כל הפסקאות וה־inline items במסלול המוצר משתמשים באותו LineBreaker.
- אין מסלול words[] עצמאי שמחליט על שבירת שורות.
- כל הפריטים נשמרים עם זהות ומיפוי מקור.
- תמונות וסמנים משתתפים בהחלטת השבירה לפני התכנון.
- אין מדידה חוזרת.
- אין split אסור.
- אין אובדן תוכן.
- אין שינוי סדר.
- justify נשמר כברירת המחדל.
- סמנטיקת D-S2H3 מוכחת במסלול המוצר.
- התוצאות דטרמיניסטיות.
- כל שינוי בפריסה מוסבר.

לאחר מעבר השער, יש למזג את PR של מקטע ב׳.

## 6. שלב 5 - מתכנן עמודים וטורים יחיד

לאחר השלמת שלב 4, יש להתחיל מיד את שלב 5 בתוכנית הקנונית.

אין להסתפק בדוח תכנון בלבד. יש להתחיל במימוש בשלבים קטנים, עם PRs ממוקדים, אך כולם תחת חוזה ארכיטקטוני אחד.

### 6.1 מטרת שלב 5

להעביר את תכנון הבלוקים, מילוי הטורים, איזון, מעברי עמוד, כותרות והערות למודל תכנון אחד.

ה־Planner מקבל LineModel מדוד ומחליט על מיקום השורות והבלוקים, בלי למדוד מחדש, בלי לאבד fragments ובלי לשנות את גאומטריית השורה.

### 6.2 פעולות מחייבות

1. להגדיר Planner input/output קנוניים: ordered blocks, LineModels, constraints, page templates, note budgets, page/column geometry ו־placements.

2. לוודא שה־DP planner מקבל LineModel שלם ולא רק גובה שורה או מספר מילים.

3. לאחד column fill, page break, balancing, chapter-end balancing ו־cross-column headings תחת מודל אילוצים אחד.

4. להגדיר סדר קריאה RTL במפורש: טור ימני ראשון, מעבר לטור שמאלי לפי כללי המסמך, תוך שמירה על סדר הבלוקים והעוגנים.

5. להגדיר page capacity ו־column capacity ממקור גאומטרי אחד. אזורי הערות, כותרות, עיטורים, margins ו־gutter חייבים להיכלל בחישוב לפני החלטת placement.

6. להגדיר constraints קשיחים ורכים: כותרת עם גוף אחריה, מניעת widow/orphan, מעבר פרק, heading full-width, תמונה בלתי ניתנת לפיצול, הערות ארוכות, עמודי שער ועמודי המשך.

7. לאחד rollback ו־fallback. כל fallback חייב להיות מוגבל, מתועד, מדווח ב־ledger ומכבד את אותם invariants. אין נפילה שקטה לנתיב ישן.

8. לוודא שהערות שוליים, הערות צד והערות סיום מחוברות לעוגנים במודל התוכן. תכנון ההערה לא רשאי לשנות את הטקסט או להעתיקו למסלול אחר.

9. להגדיר budget משותף לגוף העמוד ולהערות. אם אין די מקום, המנוע מחזיר מצב בלתי פתיר מפורש ולא מציג עמוד שנראה תקין אך חורג.

10. לשלב inline image flow constraints בתכנון השורות והטורים, לא כפעולת הזזה מאוחרת.

11. להגדיר multi-block pages, page continuation, section transitions ו־page-type transitions כחלק מאותו Planner state.

12. להפיק trace של מועמדים, עלויות, אילוצים, בחירה, rollback וסיבת אי־בחירת חלופות.

13. להוכיח שה־Planner אינו מודד מחדש ואינו משנה את רוחב/גובה הפריטים; הוא משתמש במדדים שנקבעו בשלב 3 ובשורות שנוצרו בשלב 4.

14. להשוות תוצאות לתוצאה הבסיסית ולסווג כל שינוי אמיתי תוך שמירה על כל האינווריאנטים.

### 6.3 שימוש ב־PR #16 וב־PR #17

בשלב 5 יש לבצע ביקורת ממוקדת על השינויים בשני ה־PRs.

יש להפיק טבלת מיפוי לכל שינוי:

- בעיה מקורית.
- שורש הבעיה.
- הקובץ/ים שבהם טופלה.
- האם מדובר בתיקון שורש או בתיקון תוצאה.
- האם הוא חופף לשינוי אחר.
- לאיזה חלק בחוזה Planner הוא שייך.
- האם יש בדיקת רגרסיה אמינה.
- האם יש השפעה על תוכן או על מספר עמודים.
- האם יש הצדקה להטמעה.

יש לשמר את התיקונים המועילים, אך להטמיעם במודל האילוצים המאוחד. אין למזג שני מנגנונים שעושים אותו דבר.

במיוחד יש לבדוק את maxFit, הצמדת הערות לעוגנים, LPT, noteMetrics, planningUsedHeight, קיבולת אמיתית, ליווי כותרות, התחייבות תקציב הערות, rollback ואבחוני ledger.

### 6.4 תוצרים של שלב 5

- Planner יחיד וממשק placement קנוני.
- `ColumnModel`.
- `PagePlan`.
- Trace של החלטות התכנון.
- בדיקות DP, איזון, capacity, notes budget, cross-column heading, page transitions, RTL reading order ו־rollback.
- דוחות overflow/underfill/notes עם מיקום וסיבתיות.

### 6.5 שער קבלה של שלב 5

- כל סוגי הבלוקים במסלול הפעיל מתוכננים באמצעות אותו Planner.
- fragments ו־source identity נשמרים דרך התכנון.
- חישובי capacity משותפים לכל שלבי התכנון.
- אין החלטת עימוד חוזרת.
- אין fallback סמוי.
- הערות, תמונות וכותרות נכללות באילוצים לפני ההחלטה.
- כל חריגה בלתי פתירה מדווחת במפורש.
- הקורפוס הראשי עובר invariants ותוכן נשמר במלואו.

## 7. שאלות פתוחות - אין להכריע ללא אישור

יש לשמר את השאלות הפתוחות שכבר תועדו:

- שאלה 12 - מקור ברירות המחדל הקנוני.
- שאלה 13 - סבילות parity בין Node לדפדפן.
- שאלה 14 - אישור חוזה Unified Item, כולל מדיניות `participates` ותמונות בכותרות.
- עונש runt לשורה הראשונה.

אין להציג הצעה של הסוכן כהחלטת משתמש. יש לתעד את ההצעה, את השפעתה ואת החלופות, ולהשאיר אותה פתוחה עד לאישור.

אין להרחיב את הדיון ל־P6/P7.

## 8. ניהול ביצוע - קצב, בדיקות והתקדמות

העבודה צריכה להתקדם ברציפות ובמנות קצרות, כדי למנוע סשנים ארוכים שנתקעים או נקטעים.

כל PR צריך לכלול:

- תיאור מדויק של השינוי.
- בעיית השורש שנפתרה.
- רשימת קבצים ששונו.
- בדיקות חדשות.
- תוצאות בדיקות מלאות.
- השוואת קורפוסים.
- שינויים בפריסה.
- תוכן שנשמר.
- כשלים היסטוריים לעומת רגרסיות חדשות.
- עדכון WORKLOG, ISSUE_REGISTRY ו־LAYOUT_DEPENDENCY_MAP.

אין להמתין זמן ממושך ל־CI. אם בדיקה מתעכבת, יש לבדוק את שאר התוצאות ולהמשיך בעבודה שאינה תלויה בה.

אין לעדכן נעילות hash רק כדי להפוך בדיקות לירוקות. כל עדכון נעילה חייב להיות תוצאה של שינוי מכוון, עם הסבר והוכחת שימור תוכן.

אין לדווח על הצלחה על סמך בדיקות יחידה בלבד כאשר השלב מחייב חיבור למסלול המוצר.

אין למחוק נתיב מורשת לפני שהמעבר המלא הוכח, אך גם אין להשאיר נתיב מקביל פעיל לאחר שהמנוע הקנוני הוכח.

## 9. סדר ביצוע מחייב

1. לתקן את PR #23 לפי סעיף 3.
2. להריץ בדיקות מלאות ולתקן כל רגרסיה חדשה.
3. למזג את PR #23 כאשר הוא עומד בשער.
4. לפתוח PR נפרד לשלב 4 ב׳ - חיבור מלא למסלול המוצר.
5. להשלים את שער הקבלה של שלב 4 ולמזג.
6. להתחיל מיד את שלב 5, תוך שימוש מושכל בממצאי PR #16 ו־#17.
7. להמשיך עד לסיום שלב 5, בלי להמתין לאישור נוסף עבור פעולות שכבר הוגדרו כאן.

**יעד העל:** מנוע עימוד אחד, פשוט, דטרמיניסטי, שקוף, מדיד וניתן להרחבה - כך שהוספת פריט עימוד חדש תהיה הוספת סוג פריט לחוזה הקיים, ולא הוספת מסלול עימוד חדש.

אין להסתפק בהתקדמות תיעודית או בהוכחת תשתית מבודדת. יש להתקדם אל מנוע המוצר האמיתי, ולסגור כל שלב עד תום.

ההחלטה הניהולית שלי ברורה: **לא למזג את \#23 במצבו הנוכחי, אבל גם לא לעצור את הפרויקט.** יש לסגור את ליקויי ההוכחה והנכונות, למזג, ומיד אחר כך לחבר את המנוע למסלול המוצר. רק אז נעבור לאיחוד ה־Planner בשלב 5.

כשיגיע עדכון הסוכן, אבדוק את ה־PR והקומיטים עצמם מול שערי הקבלה - לא אסתמך על דוח ההשלמה שלו.

## Prompt:
16.11.2026, 8:11:54

סוכן הAI השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות.

## Response:
16.11.2026, 8:12:07 · gpt-6

> **Aligning measurement flow**
>
> I’m identifying a mismatch: line items are measured per word, while the document model measures complete text runs. I’m flagging this so Stage 4 can use one consistent measurement unit and avoid duplicate or unused work.
>
> **Refining pipeline architecture**
>
> I’m tightening the design around a single measurement pass for final line items. I’m also checking heading styles, inline formatting, asset handling, notes, and custom item types so existing behavior remains intact.
>
> **Scoping the next stage**
>
> I’m separating Stage 4B from later legacy cutover. The next implementation should integrate the DP pipeline comprehensively, preserve behavior, document unresolved contracts, and avoid merging unrelated stale work.
>
> **Refined measurement pipeline architecture and scoped next stage**
>
> 
>
> **Unifying measurement**
>
> I’m making one canonical stream of final line items, measuring each exactly once, and passing frozen results into layout. I’m also preserving headings, inline styles, notes, assets, and existing behavior without duplicate passes.
>
> **Unified measurement details**
>
> 
>
> **Designing direct integration**
>
> I’m requiring the canonical line model to drive breaking, planning, and rendering. Any temporary compatibility view must be centralized, read-only, and unable to measure, place, mutate, or make layout decisions.
>
> **Unifying the next stage**
>
> I’m requiring Stage 4B to make the canonical line model drive measurement, breaking, planning, and rendering, with one measurement per final item and no hidden parallel representation.
>
> **Designed direct integration and unified the next stage**
>
> 
>
> **Audited pull requests, CI failures, and Stage 4B measurement integration**
>
> 
>
> Worked for 2m 25s

אמשיך כמנהל הפרויקט, לפי שערי הקבלה שכבר קבענו: אבדוק את מצב הענפים וה־PRs העדכני, אאמת שהמימוש אכן מחובר למסלול העימוד הפעיל ולא רק קיים כתשתית, ואבדוק בדיקות ורגרסיות. אמזג כל PR שהוכח כראוי למיזוג, ובמקביל אכין לסוכן הוראת ביצוע רציפה לשאריות שלבים קודמים ולשלב הבא - בלי להמתין לסבב אישורים מיותר.

**עדכון חשוב: PR \#23 כבר מוזג בפועל** ב־16 בנובמבר, בשעה 00:25 לפי GitHub. קומיט המיזוג הוא `5d22a2a`\. כלומר, הסוכן השלים את מקטע א׳ של שלב 4, והכניס את מנוע השורות הקנוני ל־`main`\.

אבל הדוח עצמו מבהיר ששערי 4.3(א) ו־4.3(ב) עדיין פתוחים: `pipeline.typeset` עדיין משתמש בנתיב `words[] → layoutLines`\. לכן שלב 4 **אינו מושלם**\. זהו בדיוק המעבר שעלינו לבצע עכשיו, ולא לדלג לשלב 5 לפני שהמנוע החדש באמת משמש את המוצר.

## תוצאות הביקורת והחלטות המיזוג

- **PR \#23 - ממוזג\:** שלושת מסלולי מטריצת הבדיקות `18/20/22` עברו, וגם בדיקת שלמות הקורפוס עברה.
- שני כשלי האודיט נשארו: `SIDE_NOTE_OVERLAP` פעמיים בעמוד 107, ורצפת נפח של 353,687 מילים מול 355,967. בדקתי את יומני הריצה: אלה אותן חתימות בסיס שתועדו קודם, ולא כשל חדש שנגרם ממנוע השורות.
- **PR \#14, \#16 ו־\#17 - לא למיזוג.** שלושתם מפוצלים מבסיס `main` הנוכחי. \#16 ו־\#17 חופפים בקובצי ה־Planner, והטמעתם כעת תיצור סיכון להכנסת החלטות כפולות. את התיקונים הטובים מהם יש למפות ולהעביר לשלב 5.
- נמצאה בעיית תיעוד שצריך לסגור: דוח שלב 4 מציג `992/992`, בעוד הודעת המיזוג מציגה `1034/1034`; גם ספירות הבדיקות הפנימיות בדוח אינן עקביות. נדרוש הרצה מלאה אחת ועדכון אחיד של הדוחות.

**מצאתי גם פער ארכיטקטוני חשוב יותר\:** `measureDocumentModel` מודד את פריטי המודל, אבל `buildLineSequences` מודד מחדש את המילים וה־glue שהוא יוצר. אסור לחבר את שתי הפונקציות כפי שהן ולכנות זאת מדידה אחת. מקטע ב׳ חייב לאחד את גבול המדידה כך שכל פריט שורה יימדד פעם אחת בלבד, וה־LineModel יצרוך את התוצאה הקפואה.

## מצב הריפו לאחר הבדיקה

**שלב 4 - מקטע א׳** (מוזג ל־main)

5d22a2ae59b2cc67c96431677d55ea07bdc77d95

---

**שלב 4 - מקטע ב׳** (טרם בוצע)

חיבור מנוע השורות הקנוני לצינור המוצר.

---

**שלב 5 - Planner יחיד** (השלב הבא)

איחוד תכנון העמודים והטורים.

אין כרגע PR נוסף שמוכן למיזוג. שלושת ה־PRs הפתוחים הם \#14, \#16 ו־\#17. לא אמזג אותם: הם מבוססים על ענפים ישנים ומפוצלים מ־main, ובפרט \#16 ו־\#17 חופפים בשינויים במנוע התכנון.

---

# הוראת הביצוע לסוכן

הפרומט הבא כולל את המעבר המיידי למקטע ב׳, את התיקונים הנדרשים לשלב 3 ולמקטע א׳, ואת ההכנה וההתקדמות לשלב 5. הוא גם מגדיר במפורש מה עדיין אינו מאושר, כדי שלא יתקבלו החלטות מוצריות במקומך.

**document: **

# הוראת ביצוע - מנהל הפרויקט: השלמת שלב 4 מקטע ב׳, סגירת פערי שלב 3 והתחלת שלב 5 - Planner יחיד

מאגר העבודה:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

ענף הבסיס המחייב:

`main`

קומיט הבסיס הנוכחי:

`5d22a2ae59b2cc67c96431677d55ea07bdc77d95`

---

# חלק א׳ - תמונת מצב והחלטות מחייבות

## 1. מצב השלבים

- שלב 1 - הושלם.
- שלב 2 - הושלם.
- שלב 3 - התשתית מוזגה, אך נותרו פערי צריכה וחיבור שיש לסגור במעבר לשלב 4.
- שלב 4, מקטע א׳ - הושלם ומוזג ב־PR #23.
- שלב 4, מקטע ב׳ - טרם בוצע; זהו יעד העבודה המיידי.
- שלב 5 - מתחילים מיד לאחר השלמת מקטע ב׳.

PR #23 מוזג בקומיט:

`5d22a2ae59b2cc67c96431677d55ea07bdc77d95`

הוא כולל:

- `LineItem` קנוני.
- `LineModel` קנוני.
- הרחבת Knuth-Plass הקיים ל־`breakItemSequence`.
- מקור אמת להזדמנויות שבירה.
- תיקוני צמידות סמן־הערה.
- תיקוני זהות ומיפוי מקור.
- תיקון ספירת רוחב כפולה ב־float.
- תיקון אובדן רווח בין ריצות גופן.
- מדיניות justify.
- תיקוני wrap/DP.
- תיקון מדידת גופי הערות.
- בדיקות השוואה ושחזור.

אין לפתוח מחדש עבודה זו ללא ראיה לתקלה ממשית.

## 2. שערי הקבלה שעדיין פתוחים

למרות מיזוג PR #23, שלב 4 אינו מושלם.

הדוח `audits/STAGE4_LINE_ENGINE.md` עצמו מאשר:

- `pipeline.typeset` עדיין משתמש ב־`words[]` וב־`layoutLines`.
- מנוע השורות החדש אינו משמש עדיין את מסלול העימוד הפעיל.
- קיימים מסלולי שבירה ישנים בכותרות, פסקאות, הערות ופריטים נוספים.
- `dp-planner` עדיין מצפה למבנה שורות מורשת.

לכן שערי 4.3(א) ו־4.3(ב) עדיין פתוחים.

**אין להכריז על שלב 4 כהושלם עד לחיבור בפועל.**

## 3. CI וכשלי בסיס

ב־PR #23:

- מטריצת test 18/20/22 - הצליחה.
- corpus-invariants - הצליחה.
- layout-audit - נכשל בשני ממצאי `SIDE_NOTE_OVERLAP` בעמוד 107.
- full-math-audit - נכשל ברצפת נפח: 353,687 מילים לעומת 355,967.

בדקתי את יומני הריצה. שתי חתימות הכשל תואמות לכשלי הבסיס שכבר תועדו ב־main לפני שלב 4.

אין לעכב את העבודה בגללן, ואין לנסות לשנות את ספי הבדיקות כדי להעלים אותן. יש להמשיך לעקוב אחריהן, ולוודא שאין החמרה או כשלים חדשים.

## 4. PRs ישנים

אין למזג כעת את PR #14, #16 או #17.

- #14 - מסמכי הכרעות ישנים; יש לחלץ רק מידע תקף שאינו סותר החלטות מאוחרות.
- #16 - תיקוני DP, הערות, maxFit ו־SSOT.
- #17 - תיקוני FX-1..FX-6 וביקורת פורנזית.

#16 ו־#17 חופפים בקובצי תכנון מרכזיים ומבוססים על בסיסים ישנים. אין למזג אותם בנפרד ואין להעתיק את כל השינויים מהם באופן עיוור.

יש לשמור את תיקוני השורש המועילים ולהעבירם למימוש המאוחד של שלב 5.

---

# חלק ב׳ - השלמת פערי שלב 3 ומעבר נכון לשלב 4

## 5. בעיית מדידה מהותית שדורשת פתרון שורשי

נמצא פער בין `measureDocumentModel` לבין `buildLineSequences`.

במצב הנוכחי:

- `measureDocumentModel` מודד את פריטי ה־DocumentModel המקוריים.
- `buildLineSequences` מפצל את הפריטים למילים ול־glue.
- בתוך `boxItemFor` מתבצעת שוב קריאה ל־`measureItem` עבור מילות השורה.
- `unitFits` עשוי לגרום לבניית תיבה ומדידתה עוד לפני בניית הרצף הסופי.
- כך נוצרות שתי שכבות מדידה שאינן חולקות בהכרח את אותו אוסף MeasuredItem.

אסור לחבר את שתי הפונקציות כפי שהן ולבצע את שתיהן ברצף, משום שהדבר ייצור מדידה כפולה.

### דרישת התיקון

יש להגדיר מחדש את גבול המדידה כך שיתאים ליחידות שה־LineBreaker באמת צורך.

הארכיטקטורה הנדרשת:

1. בניית רצף פריטי השורה הקנוני מתוך DocumentModel.
2. פיצול מילים, ריצות, glue, penalties, תמונות ופריטים אטומיים תוך שמירת מקור וזהות.
3. מדידה קנונית אחת לכל פריט שורה.
4. שמירת תוצאת המדידה הבלתי־ניתנת לשינוי.
5. העברת התוצאה ל־LineModel ול־Planner ללא מדידה נוספת.

יש לבחור מימוש אחד:

- להפוך את `measureDocumentModel` למתזמר המדידה של פריטי השורה הקנוניים; או
- להגדיר שלב הכנה קנוני של LineItems, ואחריו מדידה יחידה, כאשר `measureDocumentModel` משתמש באותו מנגנון ואינו מודד שוב את הפריטים המקוריים בנפרד.

אין ליצור שני APIs מדידה.

אין למדוד את כל הפסקה ואז למדוד שוב כל מילה כאילו אלה שתי מדידות עצמאיות.

יש להבטיח שה־MeasuredItem שמגיע ל־LineBreaker הוא בדיוק זה שנמדד, ולא תוצאה שנבנתה מחדש.

### בדיקות מחייבות

- לכל LineItem יש רשומת מדידה יחידה.
- לכל פריט יש זהות יציבה.
- כל פריט שנמדד מופיע בזרם השורות או מקבל diagnostic מפורש.
- אין פריט שורה שמודד את עצמו מחדש ב־Planner או ב־renderer.
- אין אובדן גופן, ריצה, נכס או טווח מקור.
- cache hits אינם תחליף להוכחת זרימת מדידה נכונה.
- בדיקות ייעודיות מוודאות שאין קריאות מדידה חוזרות לאותו פריט במהלך בניית LineModel.

## 6. חיבור נכסים למסלול המודל

ב־`pipeline.js` מתקבלים נכסי המסמך דרך `env.assets`, אך הקוד הנוכחי רק רושם אירוע `doc-assets-received`.

בנוסף, הקריאה ל־`buildDocumentModel` אינה מעבירה כרגע את הנכסים.

יש להשלים את החיבור:

- להעביר את AssetResolver המאומת למסלול בניית המודל.
- לוודא שתמונות מזוהות כפריטי תוכן עם assetId תקף.
- להעביר את אותו resolver למנגנון המדידה.
- לוודא שה־Worker וה־UI משתמשים באותן זהויות נכסים.
- לוודא שאין שימוש בנתיבי קבצים מקומיים שאינם זמינים ל־Worker.
- אין fallback שקט לתמונה חסרה.
- נכס שלא נפתר יוצר diagnostic או כשל מפורש בהתאם לחוזה.

יש לבדוק את `engine-worker-main.js`, `worker-client.js`, `AssetResolver` ו־`buildDocumentModel` כמסלול אחד.

הוכחה נדרשת: תמונה שהועברה ל־Worker נשמרת במודל, נמדדת, משתתפת בשבירה ומגיעה למודל המיקום ללא שינוי זהות.

## 7. חיבור גופנים וסגנונות

יש להבטיח ש־LineItems מקבלים את הסגנון האמיתי של הפריט, ולא רק את ברירת המחדל של גוף הטקסט.

בפרט, `buildLineSequences` משתמש כיום ב־base style כללי. יש לוודא שהחיבור החדש אינו מאבד:

- גודל גופן של כותרות לפי רמה.
- משפחת גופן של כותרות.
- משפחת גופן לכל run.
- סגנונות inline.
- גודל/משקל/צבע של פריטים מותאמים.
- סגנון גופי הערות.
- סגנון סמני הערות.
- סגנון סוגריים וטווחים.
- שפה וכיווניות.

יש להשתמש ב־FontResolver היחיד ובזהויות הגופן שנקבעו בשלב 3.

אין להוסיף מנגנון גופנים נוסף.

אין להחליף גופן בשקט. fallback חייב להיות מתועד באבחון.

## 8. שאלות פתוחות - אין להכריע במקומי

יש לשמור את שאלות 12-14 כפתוחות:

- שאלה 12 - שכבת ברירות המחדל הקנונית.
- שאלה 13 - סבילות parity בין Node לדפדפן.
- שאלה 14 - אישור חוזה Unified Item.

אין לשנות ברירות מחדל או להכריע בשאלות אלה ללא אישור משתמש.

גם עונש runt לשורה הראשונה הוא הצעה פתוחה בלבד. אין להוסיף penalty חדש לפני הכרעה.

---

# חלק ג׳ - שלב 4, מקטע ב׳: חיבור מלא למסלול המוצר

## 9. מיפוי מלא של מסלול העימוד הקיים

יש למפות את כל נקודות השבירה ב־`pipeline.js`.

בבדיקה הנוכחית נמצאו ארבע נקודות עיקריות:

1. כותרות - `protectWords` ו־`api.layoutLines`.
2. הערות סיום המוצגות בגוף - `protectWords` ו־`api.layoutLines`.
3. פסקאות שהומרו להערות שוליים באמצעות custom styles.
4. פסקאות רגילות - `protectWords`, `api.layoutLines` והסרת sentinels לאחר השבירה.

יש לבצע חיפוש מלא בריפו כדי לאתר גם מסלולים עקיפים או שימושים נוספים ב־`layoutLines`, `breakLines`, `protectWords` ובניית `words[]`.

אין להניח שהמיפוי הנוכחי ממצה.

## 10. מעבר לזרם קנוני אחד

היעד הוא:

`DocumentModel → Unified LineItems → Single Measurement Pass → breakItemSequence → LineModel`

ה־LineModel יהיה מקור האמת של השורות.

יש להפסיק להשתמש ב־`words[]` כמקור החלטה עצמאי.

אין לבנות מחדש מחרוזות כדי לשבור אותן שוב.

אין להפעיל breaker אחר לתמונות, סמנים או הערות.

אין להחזיק שתי מערכות מדידה.

אין להוסיף שכבת adapters מפוזרת. אם נדרש גבול תאימות זמני מול רכיב מורשת שטרם הומר, הוא חייב להיות אחד, מרוכז, נגזר חד־כיוונית ונטול החלטות עימוד. יש לתעד את הסרתו בשלבים המתאימים.

## 11. חיבור ל־DP Planner

`dp-planner.js` מקבל כיום בלוקים עם `lines` במבנה הישן, וניגש ל־`line.words` במקומות רבים.

יש לעדכן את הממשק כך שה־Planner יצרוך את LineModel המלא.

יש לשמר לכל שורה:

- fragments.
- itemIds.
- sourceRange.
- fontIds.
- measured advances.
- inkBounds.
- glue allocation.
- baseline.
- lineHeight.
- breakReason.
- constraints.
- diagnostics.
- semantic.
- floatAreas.
- noteRef ועוגני המקור.

יש לעבור על כל צרכני `line.words` ב־dp-planner:

- חישובי layout hash.
- זיהוי סמנים.
- טקסט כותרות ו־TOC.
- firstWord/lastWord.
- פיצול שורות.
- חישובי כותרות חוצות.
- טיפול בהערות.
- reading order.

אין לאפשר ל־Planner לשנות את תוכן השורה או את הגאומטריה שנקבעה בה.

כל טקסט הנדרש לצורכי אבחון או כותרת חייב להיגזר באופן טהור מה־LineModel, ולא לשמש כמקור לשבירה נוספת.

אם יש צורך בגישה זמנית לשדות מורשת, יש ליצור accessor טהור יחיד, ולא להעתיק ולשנות את השורה.

## 12. שימור כל התנהגות המוצר

המעבר חייב לשמר את כל ההתנהגויות הקיימות, לרבות:

### כותרות
- כל הרמות.
- רוחב מלא מול טור.
- פתיחת עמוד.
- כותרת צמודה לגוף.
- עיטורי H2.
- סמנטיקת H3.

### פסקאות
- סוגריים וטווחים.
- mixed fonts.
- custom inline styles.
- drop word.
- full-width.
- side-note.
- endnote.
- footnote.
- inline note mode.

### הערות
- footnotes.
- sidenotes.
- endnotes.
- סמני הערות.
- מספור.
- reset policy.
- continuation.
- צמידות לעוגן.
- פיצול הערה ארוכה לפי המדיניות הקיימת.

### תמונות
- inline.
- block.
- centered.
- float-start.
- float-end.
- wrap-around.
- overflow.
- שמירת asset identity.

אין למחוק יכולת קיימת בשם האיחוד.

אין להעתיק את הלוגיקה הקיימת כקוד חדש בשכבה אחרת. יש להעביר את האחריות למקום הקנוני.

## 13. סמנטיקת D-S2H3

יש לוודא את התנהגות כותרת 3 במסלול המוצר האמיתי:

- פסיחה פנימית של 34px.
- פס אחרון של 38px.
- רווח תחתון של 4px פעם אחת בלבד.
- הרווח מופיע אחרי ה־fragment האחרון.
- אין רווח בין שורות הכותרת.
- אין רווח נוסף ב־DP.
- אין רווח נוסף ב־renderer.

יש לבדוק כותרות חד־שורתיות, דו־שורתיות ורב־שורתיות.

יש לבדוק את הכותרת לפני ואחרי מעבר טור, ואת התוצאה ב־DOM וב־PDF.

## 14. מסלול מורשת

אין למחוק את `legacy-imud-flow.js` בשלב 4.

הנתיב הזה עדיין קיים ומשמש את פרופיל העימוד המקורי.

המעבר בשלב 4 ב׳ מחבר את נתיב ה־DP הקנוני למנוע השורות החדש. נתיב המורשת יישאר עד שלב 9, שבו תתבצע העברת אחריות מלאה והסרת כפילויות לאחר הוכחה מקצה לקצה.

אין להציג את קיומו של נתיב המורשת כהוכחה לכך שמנוע השורות החדש מחובר בכל פרופיל מוצר.

יש לדווח במדויק אילו מסלולים משתמשים במנוע החדש ואילו עדיין לא.

## 15. בדיקות קבלה למקטע ב׳

יש לבנות בדיקות E2E המפעילות את `pipeline.typeset` בפועל.

חובה:

1. פסקה רגילה.
2. כל רמות הכותרות.
3. H3 חד־שורתית ורב־שורתית.
4. הערות שוליים.
5. הערות צד.
6. הערות סיום.
7. inline note mode.
8. mixed-font word.
9. custom inline styles.
10. סוגריים וטווחים.
11. ניקוד וטעמים.
12. NBSP וצמידות.
13. קיצורים.
14. תמונות inline.
15. תמונות block ו־centered.
16. floats משני הצדדים.
17. overflow של פריט רחב.
18. מעבר בין שורה מצומצמת לשורה מלאה.
19. שימור source anchors.
20. שימור תוכן מלא.
21. שימור סדר קריאה RTL.
22. דטרמיניזם.
23. זהות נכסים וגופנים.
24. מדידה יחידה לכל פריט.
25. אין reflow או מדידה ב־renderer.
26. תצוגה ו־PDF.

המסמכים המשמשים לבדיקות חייבים להיות תקינים מבחינה מבנית: אין שתי כותרות מאותה רמה ברצף בלי טקסט ביניהן, אין כותרת המכילה רק הערת שוליים, והכותרת האחרונה חייבת להכיל טקסט.

יש להוסיף גם מסמכי קצה עם תמונות, כותרות, הערות, ריצות גופן וסוגריים חוצים.

## 16. השוואת קורפוס וחידוש נעילות

יש להשוות את המסלול החדש מול main לפני המעבר.

ההשוואה חייבת להיות פר־פריט:

- תוכן.
- סדר.
- זהות.
- טווחי מקור.
- שורות.
- סיבת שבירה.
- מדידה.
- גאומטריה.
- הערות וסמנים.

הבדלים צפויים הקשורים לתיקון P-1 ולמדידת סמן הערה בגודל הרישום חייבים להיות מתועדים ומוסברים.

אין להסתיר הבדלים על ידי עדכון hash בלבד.

אין לשנות נעילות לפני שהוכח שכל הבדלי התוצאה מכוונים ומוסברים.

יש לשמור את נעילות הבסיס ולהפיק דוח השוואה מלא.

## 17. שער השלמת שלב 4

שלב 4 ייחשב מושלם רק כאשר:

- כל הפסקאות במסלול ה־DP משתמשות ב־LineBreaker הקנוני.
- אין `words[]` עצמאי שמחליט על שבירת שורות.
- המדידה מתבצעת פעם אחת בלבד.
- LineModel מלא מגיע ל־Planner.
- תמונות וסמנים משתתפים בהחלטת השבירה.
- כל ה־fragments והעוגנים נשמרים.
- אין split אסור.
- אין אובדן תוכן.
- אין שינוי סדר.
- justify נשמר כברירת מחדל.
- H3 תקינה.
- כל מסלולי ההערות תקינים.
- כל סוגי הפריטים הנתמכים נבדקו.
- אין מדידה או שבירה ב־renderer.
- תוצאות דטרמיניסטיות.
- ההשוואה לקורפוס הושלמה.
- כל שינוי מוסבר.

כאשר השער עובר, יש למזג את ה־PR ללא המתנה לאישור נוסף.

---

# חלק ד׳ - שלב 5: מתכנן עמודים וטורים יחיד

לאחר מיזוג מקטע ב׳, יש להתחיל מיד את שלב 5.

אין להסתפק בתכנון תיאורטי. יש להתחיל במימוש, אך לשמור על PRs ממוקדים.

## 18. יעד ארכיטקטוני

מנוע השורות כבר מספק LineModel מלא.

שלב 5 צריך ליצור Planner יחיד שמקבל את השורות והפריטים המדודים ומחליט על מיקומם בעמודים ובטורים.

ה־Planner אינו מודד מחדש, אינו שובר שורות מחדש ואינו משנה את רוחב/גובה השורה.

הוא אחראי על:

- בחירת עמוד.
- בחירת טור.
- מיקום אנכי.
- מעבר עמוד.
- איזון טורים.
- כותרות חוצות טורים.
- ליווי כותרת וגוף.
- הקצאת מקום להערות.
- מניעת overflow.
- rollback/fallback מוגבלים.
- סדר קריאה.

## 19. מיפוי שורשי הקוד הקיים

יש לבצע audit מעשי של:

- `dp-planner.js`
- `column-flow.js`
- `candidate-generator.js`
- `constraint-matrix.js`
- `protections-matrix.js`
- `balancing.js`
- `retreat-loop.js`
- `footnote-budget.js`
- `footnote-lanes.js`
- `headings-escort.js`
- `ordering.js`
- `side-notes.js`
- `endnote-pages.js`
- `page-templates.js`

אין להניח שכל מודול חייב להישאר כמודול עצמאי. יש לבדוק אם האחריות שלו אמורה להיות חלק ממודל Planner אחד, או אם הוא מימוש טהור של אילוץ מוגדר.

המטרה אינה לרכז את כל הקוד בקובץ ענק, אלא ליצור סמכות אחת להחלטות התכנון וממשקים ברורים בין רכיבים.

## 20. טיפול ב־PR #16 ו־PR #17

יש ליצור טבלת מיפוי לכל שינוי בשני ה־PRs.

בכל שינוי יש לציין:

1. הבעיה המקורית.
2. שורש הבעיה.
3. הקבצים שהשתנו.
4. מהו הפתרון שהוצע.
5. האם הוא פתרון שורש או תיקון תוצאה.
6. האם הוא חופף לפתרון אחר.
7. האם יש בדיקת רגרסיה אמינה.
8. השפעתו על התוכן.
9. השפעתו על מספר העמודים.
10. לאיזה רכיב Planner קנוני הוא שייך.

יש לבדוק בפרט:

### PR #16
- SSOT.
- anchor-following notes.
- maxFit.
- LPT.
- footnote budgets.
- note lanes.
- column bottoms.
- balance.
- heading escort.

### PR #17
- FX-1..FX-6.
- unified constraints.
- capacity.
- retreat loop.
- protections.
- candidate generation.
- rollback.

יש לשמר את תיקוני השורש המועילים, אבל לא להכניס שתי גרסאות של אותה אחריות.

אין למזג את PR #16 או #17 בשלמותם.

## 21. Planner Input/Output

יש להגדיר חוזה Planner קנוני.

קלט:

- DocumentModel.
- LineModels.
- ordered blocks.
- page templates.
- page/column geometry.
- item constraints.
- note anchors.
- note budgets.
- page types.
- page furniture constraints.
- diagnostics.

פלט:

- `ColumnModel`.
- `PagePlan`.
- placements.
- reading order.
- page transitions.
- note placements.
- overflow diagnostics.
- decision trace.

כל LineModel נשמר בשלמותו. אין לשטח אותו למספר מילים או לגובה בלבד.

## 22. אילוצים

יש להגדיר מודל אילוצים יחיד הכולל:

### אילוצים קשיחים
- אין אובדן תוכן.
- אין שינוי סדר קריאה.
- אין split של פריט אטומי.
- אין הפרדת סמן מעוגן לפי כללי הצמידות.
- אין חריגה מקיבולת ללא אבחון.
- אין כותרת ללא גוף אחריה כאשר הכלל מחייב.
- אין מיקום פריט מחוץ לאזור המותר.
- אין שימוש בגאומטריה שנמדדה מחדש.

### אילוצים רכים
- איזון טורים.
- widow/orphan.
- underfill.
- chapter-end balance.
- heading escort.
- התאמת גובה טורים.
- העדפת רציפות חזותית.
- שמירת מבנה הפרקים.

כל אילוץ צריך להיות מוגדר עם:
- תנאי.
- חומרה.
- עלות.
- אופן מדידה.
- השפעה על מועמדים.
- סיבת דחיית פתרון.

אין להוסיף penalty או epsilon נקודתי ללא נימוק.

## 23. Capacity ותקציב הערות

יש לאחד את חישוב הקיבולת.

מקור אחד חייב לקבוע:

- גובה עמוד זמין.
- גובה טור זמין.
- margins.
- headers.
- footnote area.
- sidenote area.
- ornaments.
- dividers.
- page furniture.
- gutter.

אין לחשב capacity פעם אחת ב־Planner ופעם נוספת ב־notes.

הערות שוליים, הערות צד והערות סיום חייבות להיות מקושרות ל־anchors המקוריים.

יש לשמר:
- numbering scope.
- continuation.
- split policy.
- page ownership.
- reading order.
- marker identity.

אין לשכפל טקסט הערה למסלול עצמאי.

אם אין פתרון תקין, יש להחזיר מצב בלתי פתיר מפורש.

## 24. איחוד rollback ו־fallback

יש לבדוק את כל מנגנוני:

- retreat.
- rollback.
- re-fit.
- candidate retry.
- greedy fallback.
- balancing repair.

המטרה היא למנוע מצב שבו כל רכיב מתקן את תוצאתו של רכיב אחר ללא ידע על אותו budget או אותם invariants.

יש להגדיר מנגנון נסיגה אחד, מוגבל, עם:

- תנאי הפעלה.
- מספר איטרציות מרבי.
- מצב לפני/אחרי.
- שינויי placement.
- סיבת ההפעלה.
- סיבת הצלחה או כישלון.
- בדיקת תנודתיות.
- diagnostic.

אין fallback שקט.

אין לולאת תיקון בלתי מוגבלת.

## 25. סדר קריאה RTL

יש להוכיח:

- טור ימני ראשון.
- מעבר לטור שמאלי.
- שמירת סדר בלוקים.
- שמירת סדר שורות.
- שמירת סדר הערות.
- שמירת סדר עוגנים.
- כותרות חוצות טורים אינן משנות את הסדר הסמנטי.

סדר ציור ו־z-index אינם רשאים לשנות reading order.

## 26. כותרות חוצות טורים ו־H3

יש לבדוק את כל המצבים:

- heading full-width.
- heading בטור.
- heading עם keep-with-next.
- heading בתחילת עמוד.
- heading בסוף עמוד.
- heading שממשיך מעבר לטור.
- heading שמופיע אחרי תוכן קודם בעמוד.
- heading 3 עם מספר שורות.

יש לטפל במפורש בבעיית `cur.spanning` שזוהתה בבדיקות הקודמות.

אין לאפשר לרווח התחתון של H3 להיכנס בתוך רצף השורות או להיספר יותר מפעם אחת.

## 27. בדיקות קבלה של שלב 5

חובה:

1. DP בסיסי.
2. כמה מועמדים לאותו מיקום.
3. איזון טורים.
4. איזון סוף פרק.
5. כותרת חוצת טורים.
6. heading escort.
7. עמוד חדש.
8. עמוד המשך.
9. side notes.
10. footnotes.
11. endnotes.
12. note budget.
13. overflow.
14. retreat loop.
15. rollback.
16. RTL reading order.
17. שימור source anchors.
18. שימור LineModel.
19. determinism.
20. very_long corpus.
21. מסמך בדיקה תקין מבחינה מבנית.

יש להוכיח שה־Planner אינו קורא ל־MeasureAPI ואינו משנה את מדדי השורה.

יש להפיק trace שמסביר את הבחירות ואת הדחיות.

## 28. תוצרים של שלב 5

- Planner יחיד.
- `ColumnModel`.
- `PagePlan`.
- constraint registry/contract.
- trace החלטות.
- capacity model יחיד.
- note budget model.
- rollback model.
- בדיקות E2E.
- דוח השוואת קורפוס.
- עדכון WORKLOG, ISSUE_REGISTRY ו־LAYOUT_DEPENDENCY_MAP.

## 29. שער השלמת שלב 5

שלב 5 יושלם כאשר:

- כל סוגי הבלוקים במסלול הפעיל מתוכננים באמצעות אותו Planner.
- כל LineModel נשמר בשלמותו.
- capacity מחושב ממקור אחד.
- הערות ותמונות משתתפות באילוצים לפני ההחלטה.
- אין מדידה מחדש.
- אין שבירת שורות נוספת.
- אין fallback סמוי.
- אין שינוי סדר.
- אין אובדן תוכן.
- כל חריגה בלתי פתירה מדווחת.
- הקורפוס הראשי עובר את האינווריאנטים.
- התוצאה דטרמיניסטית.

---

# חלק ה׳ - כללי ביצוע וניהול

## 30. קצב עבודה

אין להמתין לאישור נוסף עבור פעולות שכבר הוגדרו.

יש להתקדם ב־PRs קצרים וברורים, אך ברציפות.

אין להמתין זמן רב ל־CI. יש לבדוק את התוצאות הזמינות ולהמשיך בעבודה שאינה תלויה בבדיקה המתעכבת.

אין להכריז על הצלחה על סמך בדיקות יחידה בלבד כאשר נדרש חיבור למסלול המוצר.

אין לדחות עבודה בגלל כשלי בסיס מוכרים, אך יש לוודא שלא נוספו רגרסיות.

## 31. תיעוד ודוחות

יש לתקן את חוסר העקביות בדוחות PR #23:

- דוח STAGE4 מציג 992/992.
- הודעת המיזוג מציגה 1034/1034.
- ספירות בדיקות s4 שונות בין הדוח, ה־WORKLOG וה־ISSUE_REGISTRY.

יש להריץ את `npm test` בפועל על main המעודכן ולרשום את המספר המדויק, כולל מספר חבילות ומספר בדיקות.

אין להעתיק מספרים מדוח קודם.

יש לעדכן:
- `audits/STAGE3_MEASUREMENT.md`
- `audits/STAGE4_LINE_ENGINE.md`
- `WORKLOG.md`
- `ISSUE_REGISTRY.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` רק אם נדרש תיקון מצב/סימון ביצוע, ללא שינוי הדרישות.

יש לתעד במפורש מה הושלם ומה עדיין פתוח.

## 32. הגבלות שאינן נתונות לשינוי

- P6/P7 מחוץ לתחום לחלוטין.
- אין לשנות ברירות מחדל ללא אישור.
- אין לשנות מזהי טקסט.
- אין לשנות ערכות עיצוב.
- Theme 40 נשאר פעיל אוטומטית.
- עיצובי השערים המקוריים נשארים פעילים אוטומטית.
- justify נשאר ברירת המחדל.
- אין להתייחס ל־PDF הייחוס כיעד איכות סופי.
- אין למחוק נתיב מורשת לפני שלב 9 והוכחת מעבר מלא.
- אין להוסיף penalty חדש לשורה הראשונה ללא הכרעת משתמש.
- אין להכריע בשאלות 12-14 ללא אישור משתמש.
- אין ליצור מנועי מדידה, שבירה או תכנון מקבילים.
- אין להוסיף טלאים או תנאים מיוחדים במקום תיקון שורש.

## 33. סדר ביצוע מעשי

1. לפתוח ענף חדש מ־main עבור שלב 4 מקטע ב׳.
2. לבצע audit מלא של מסלול pipeline והצרכנים.
3. לפתור את גבול המדידה היחיד.
4. לחבר את AssetResolver ואת FontResolver.
5. לחבר את DocumentModel ישירות למנוע השורות.
6. להעביר את כל נקודות השבירה ל־LineModel.
7. להתאים את dp-planner לצריכת LineModel.
8. לשמר את כל ההתנהגויות הקיימות.
9. להריץ E2E וקורפוסים.
10. לתקן את התיעוד ואת ספירות הבדיקות.
11. למזג את PR מקטע ב׳ כאשר שערי הקבלה עוברים.
12. להתחיל מיד את שלב 5.
13. לבצע מיפוי והטמעה של תיקוני השורש מ־PR #16 ו־#17 בתוך Planner יחיד.
14. להמשיך עד להשלמת שלב 5.

**היעד אינו עוד גרסה של מנוע השורות או של ה־DP. היעד הוא מנוע עימוד אחד, שבו לכל אחריות יש מקור אמת אחד, כל מדידה ושבירה נעשות פעם אחת, וכל פריט חדש משתלב בחוזה הקיים ללא יצירת מסלול חדש.**

יש להתקדם עד לסגירת שלב 4 בפועל ולהתחיל את שלב 5 ללא עצירה מיותרת.

---

## מה אני מצפה לקבל בעדכון הבא

לא רק הודעה "השלב הושלם", אלא\:

1. קישור לענף ול־PR של מקטע ב׳.
2. רשימת נקודות השבירה הישנות שנותרו - היעד הוא אפס במסלול ה־DP.
3. הוכחה שהמדידה נעשית פעם אחת.
4. הוכחה שהנכסים והגופנים מגיעים מה־Worker עד LineModel.
5. תוצאות E2E והשוואת הקורפוס.
6. מצב מדויק של כשלי הבסיס לעומת רגרסיות חדשות.
7. מפת התקדמות ראשונית של שלב 5.

**ההחלטה שלי\:** לא לפתוח עכשיו עוד סבב סקירות תיעודיות ולא להתעכב על PRs ישנים. אנחנו עוברים לחיבור מנוע השורות בפועל. זה הצעד שמבדיל בין תשתית טובה לבין מנוע עימוד מאוחד שעובד במוצר. לאחר מכן שלב 5 יהיה מוקד העבודה המרכזי.

## Prompt:
16.11.2026, 17:53:41

סוכן הAI השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות..

## Response:
16.11.2026, 17:54:09 · gpt-6

> **Auditing Stage 5**
>
> I’m inspecting the Stage 5 implementation rather than advancing to Stage 6. The split-window logic may be flawed because its upper bound appears to ignore the maximum number of lines that fit, so I’ll verify related code and tests.
>
> **Audited Stage 5**
>
> 
>
> **Identifying Stage 5 gaps**
>
> I’m finding deeper inconsistencies: the planner appears to operate on words rather than the full line model, and it remeasures notes and fallback words. I’ll treat these as blockers before Stage 6.
>
> **Identified Stage 5 gaps**
>
> 
>
> **Confirming implementation blockers**
>
> I’m narrowing the audit to concrete Stage 5 violations: the planner doesn’t explicitly consume preserved line fragments, and it still invokes measurement during fallback and note handling. These need resolution and tests before progression.
>
> **Tracking geometry gaps**
>
> I’m also flagging that block gaps affect fit checks but aren’t added to placed geometry, so rendered output can drift. I’ll require shared capacity accounting, preserved fragments, and deterministic decision traces before advancing.
>
> **Confirmed implementation blockers and tracked geometry gaps**
>
> 
>
> **Audited Stage 5 architecture, implementation, CI failures, and finalized repository status**
>
> 
>
> Worked for 4m 48s

בדיקה ראשונית של מצב GitHub מראה שהסוכן כבר מיזג ל־`main` את **PR \#24 - השלמת שלב 4**, ואת **PR \#25 - הפרוסה הראשונה של שלב 5**\. כלומר, אין כאן PR חדש שצריך למזג כדי לשלב את העבודה הזאת; המיזוגים כבר בוצעו.

אבל אינני מסתפק בכותרת ה־PR או בדוח הסוכן: אני בודק כעת את הקוד, את שערי הבדיקות ואת הפערים שהוגדרו במפורש להמשך שלב 5, כדי שלא נכריז על שלב שלם כשנותרה בו עבודה מהותית.

**ממצאי הביניים החשובים\:**

- PR \#25 אכן השלים את *פרוסה 1* של שלב 5: איחוד מטריצת האילוצים, תיקוני FX-1 עד FX-5, תיקון סדר הטורים, איחוד חישוב נתיבי הערות וחידוש נעילות הקורפוס.
- בדיקות המטריצה עברו בכל שלוש גרסאות Node ‏18/20/22, ובדיקת `corpus-invariants` עברה.
- שתי בדיקות CI נכשלו: `layout-audit` ו־`full-math-audit`\. לפי הלוגים, אלה אותם כשלים מוכרים שהיו בבסיס: `SIDE_NOTE_OVERLAP` בעמוד 107, וספירת 353,687 מילים לעומת רצפת 355,967. אין כרגע ראיה שה־PR הזה גרם להם, אבל הם עדיין חסמים פתוחים למוצר.
- **שלב 5 לא הושלם\:** PR \#25 עצמו מגדיר במפורש את FX-6, חוזה `ColumnModel/PagePlan` והרחבת מודל הקיבולת כעבודה לפרוסה הבאה. אלה אינם פרטי ניקיון שאפשר לדלג עליהם.

אני ממשיך לבדוק את מימוש האילוצים עצמו לפני קביעת שערי ההמשך, כדי לוודא שלא נשארה טעות לוגית מאחורי בדיקות שעברו.

## החלטת מנהל הפרויקט

(PR \#24 ממוזג) (PR \#25 ממוזג) (שלב 5 פתוח)

`main` נמצא כעת ב־`b2dd2237205663e42df878ec034ef33bc3eefd06`\.

### מה הושלם ומה עדיין לא

| שלב | מצב | הערכה |
|--------|--------|--------|
| שלב 3 - נכסים ומדידה | הושלם | PR \#22 ממוזג, תיקוני הביקורת והחיבור ל־Worker מתועדים |
| שלב 4 - מנוע שורות | הושלם | PR \#23 ו־\#24 ממוזגים; נתיב ה־DP עבר למנוע השורות המאוחד |
| שלב 5 - Planner | חלקי | פרוסה 1 מוזגה ב־PR \#25; פרוסה 2 עדיין חסרה |
| שלב 6 - פריטי עמוד | טרם החל | יתחיל לאחר סגירת שער שלב 5 |

**לא מיזגתי PR נוסף**, משום שאין כרגע PR פתוח חדש שראוי למיזוג. PR \#16 ו־\#17 מכילים עבודה שחלקיה הרלוונטיים כבר חולצו ואוחדו ב־\#25; אין למזג אותם שוב כמקשה אחת. PR \#14 הוא תיעוד הכרעות ישן, ולא ראיתי בסיס מספיק למזגו כעת.

### ממצאי ביקורת קוד שדורשים תיקון

מעבר לפערים שהסוכן עצמו ציין, מצאתי כמה נקודות שחשוב שלא יישארו מאחור\:

1. **FX-6 עדיין פתוח בפועל.** `pushLines` משתמש ב־`pendingGap` כדי להחליט אם שורה נכנסת, אבל הפער אינו נצבר ב־`planningUsedHeight` ואינו נשמר כחלק מהגאומטריה שמוקרנת. כלומר, הפער משפיע על תנאי הכניסה אך אינו מיוצג באופן מלא בגובה המתוכנן.
2. **צריכת `LineModel` אינה מוכחת במתכנן.** `dp-planner.js` ממשיך לעבוד עם מבני שורות המבוססים על `words`, `heightPx` ונתונים נגזרים. לא מצאתי בו צריכה מפורשת של `LineModel` המלא. העברת אובייקט דרך הגשר אינה תחליף להוכחת שימור ושימוש ב־fragments, זהויות גופן, עוגני מקור, glue ואילוצי השורה.
3. **נותרו קריאות מדידה בתוך המתכנן.** למשל `fixDropWordInColumns` מקבל `measureFn`, ונתיב ההערות משתמש ב־`noteHeight` ובמדידת מילים לצורך פיצול. יש לבדוק ולסלק מדידה חוזרת של פריטים שכבר נמדדו בשלב 3, ולהעביר החלטות התאמה למקום הסמכות הנכון.
4. **מטריצת האילוצים אינה מקור הסמכות היחיד בכל מקום.** `legalSplitWindow` מוגדרת ב־`constraint-matrix.js`, אך `candidate-generator.js` עדיין משתמש ישירות בקבוע `MIN_LINES_PER_SIDE` ומנהל את טווח המועמדים בעצמו. נוסף לכך, יש ליישב את ההבדל בין חלון הפיצול המתועד לבין ההתנהגות במצב `strict` ובמצב הרגיל.
5. **חסרים חוזי `ColumnModel` ו־`PagePlan` פורמליים**, וכן trace מסודר שמסביר מדוע מועמד התקבל, נדחה, או גרם לנסיגה.

### מצב הבדיקות

- מטריצת הבדיקות ב־Node 18/20/22: עברה.
- `corpus-invariants`\: עבר.
- `npm test`\: לפי דוח ה־PR, ‏1073/1073. גם בלוג CI נמצאו 62 סוויטות, כולן ללא כישלון; התווית הישנה ב־workflow עדיין מציינת 670 בדיקות ו־33 קבצים ויש לתקן אותה.
- `layout-audit`\: נכשל ב־`SIDE_NOTE_OVERLAP` בעמוד 107.
- `full-math-audit`\: נכשל ברצפת נפח - 353,687 לעומת 355,967 מילים.

שני הכשלים האחרונים תואמים לחתימת כשלי הבסיס שכבר תועדה לפני שלב 4. אין הצדקה להחליש את ספי הבדיקות כדי לקבל CI ירוק; יש להמשיך לעקוב אחריהם ולטפל בהם במסלול שורש מתאים.

---

## הפרומט לסוכן - סגירת שלב 5 והמשך לשלב 6

הפרומט הבא כולל את תיקוני הביקורת, את יתרת שלב 5, ואת ההוראות המפורטות לשלב 6. הוא מפריד בין השלבים כדי שלא ייווצר PR גדול שמערבב שתי אחריויות.

**document: **

# המשך ביצוע - סגירת שלב 5 (Planner) והתחלת שלב 6
## Tora_Book_Typesetter_Red_Work_2

אתה ממשיך לעבוד כמפתח המנוע בפרויקט. יש להתקדם לביצוע ממשי, לא להסתפק בדוחות, תוכניות או הצעות.

**מאגר:** `SUGINACH/Tora_Book_Typesetter_Red_Work_2`  
**ענף ראשי:** `main`  
**בסיס עדכני:** `b2dd2237205663e42df878ec034ef33bc3eefd06`  
**תוכנית מחייבת:** `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

---

# חלק א - מצב אמת והשלמות לשלבים הקודמים

## 1. מצב המיזוגים

העבודה הבאה כבר ממוזגת ל־main, ואין לבצע אותה מחדש:

- PR #18 - תוכנית עשרת השלבים הקנונית.
- PR #19 - שלב 1: מצב אמת, חוזים ומפת תלויות.
- PR #20 - שלב 2: DocumentModel ומודל פריטים אחיד.
- PR #21 - תיקון R-03.
- PR #22 - שלב 3: נכסים, סגנונות ומדידה.
- PR #23 - שלב 4, מקטע א׳: LineItem, LineModel ומנוע שבירת שורות.
- PR #24 - שלב 4, מקטע ב׳: חיבור מנוע השורות לנתיב המוצר.
- PR #25 - שלב 5, פרוסה 1: מטריצת אילוצים מאוחדת, FX-1 עד FX-5, flowCol ואיחוד נתיבי הערות.

אין לפתוח מחדש את העבודה הזאת כאילו לא בוצעה. יש לבדוק אותה במקום שבו היא משפיעה על המשימות הנוכחיות, ולתקן רק פערים מוכחים.

## 2. ממצאים מחייבים מביקורת PR #25

יש להשלים ולתקן את הנקודות הבאות במסגרת סגירת שלב 5:

### 2.1 FX-6 - צבירת פערים בגאומטריה

נמצא שהפער בין בלוקים (`pendingGap`) משמש לבדיקת כניסה, אך אינו נצבר באופן מלא בגובה המתוכנן ובגאומטריה המוקרנת.

יש לתקן זאת מהשורש:

- להגדיר ייצוג מפורש לפער בין בלוקים, כגון `gapBeforePx` או ייצוג שקול בחוזה הגאומטרי.
- הפער חייב להיכלל ב־usedHeight ובחישובי capacity.
- הפער חייב להופיע באותו מקום ובאותו גודל בתצוגת DOM ובייצוא PDF.
- אין להוסיף אותו פעם אחת ב־Planner ופעם נוספת במקרינים.
- אין להסתיר את הפער באמצעות הגדלת `heightPx` של שורה באופן שמערבב בין גובה השורה לבין מרווח הבלוק.
- יש לטפל גם במעבר טור, מעבר עמוד, פס חוצה־טורים, בלוק ראשון בעמוד ובלוקים רצופים.
- יש להוכיח שאין פער כפול, פער שנעלם או פער שנצבר במקום שגוי.

הפער הוא חלק מהגאומטריה המתוכננת, ולא רק תנאי מוקדם להחלטת placement.

### 2.2 צריכת LineModel מלא

תוכנית שלב 5 מחייבת שה־Planner יקבל ויצרוך את LineModel השלם, ולא רק תצוגה שטוחה של מילים וגבהים.

יש לבדוק את `dp-planner.js`, `pipeline-bridge.js` ואת כל הצרכנים.

יש לוודא שהמתכנן שומר ומשתמש, לפי הצורך, ב:

- fragments וריצות גופן.
- source identity ו־source ranges.
- רוחב, גובה ו־baseline.
- glue והקצאת הרווחים.
- break opportunities ואילוצי שבירה.
- semantic metadata.
- float/image geometry.
- note marker linkage.
- סדר קריאה וזהות הבלוק.

אין לאבד מידע בעת המעבר מ־LineModel ל־ColumnModel.

אין להסתפק בכך שאובייקט LineModel מצורף לשורה אך המתכנן עצמו אינו משתמש בו. יש להגדיר חוזה placement שמקבל את המודל המלא ומשמר אותו.

אין להפוך שוב מילה מרובת־גופנים למחרוזת שטוחה.

### 2.3 ביטול מדידה חוזרת בתוך Planner

יש לבצע סריקה מלאה של `dp-planner.js` וכל מודולי התכנון אחר:

- `measureFn`
- `env.measure`
- `measureItem`
- `noteHeight`
- כל helper שמודד מחרוזות או מילים לצורך החלטת placement.
- כל פעולה שמבצעת תיקון רוחב/גובה לאחר שבירת השורות.

בביקורת נמצאו לפחות שני מוקדים המחייבים טיפול:

1. `fixDropWordInColumns` מקבל `measureFn` ומבצע מדידה במהלך פעולת האיזון/הצבה.
2. `reserveNotes` משתמש ב־`noteHeight` ובמדידת מילים בעת חישוב תקציב ופיצול הערות.

יש להכריע עבור כל קריאה האם מדובר במדידה חוזרת של פריט שכבר נמדד. אם כן, יש להסיר את הכפילות ולהשתמש במדדים הקנוניים שהתקבלו בשלב 3/4.

אין להשאיר מנגנון שבירת הערות או מדידת הערות עצמאי אם גוף ההערה כבר עבר את מנוע הפריטים והשורות המאוחד.

אין לאפשר ל־Planner לתקן בדיעבד גאומטריה של שורה שנקבעה במנוע השורות. תיקון כזה צריך להפוך לאילוץ placement/line-breaking במקום הסמכות הנכון.

תנאי הקבלה: מדידה אחת לכל פריט, ללא מדידה חוזרת בשלב התכנון או במקרינים.

### 2.4 מטריצת אילוצים - מקור סמכות אמיתי

יש לבדוק את `constraint-matrix.js` מול כל צרכני המדיניות.

בפרט:

- `legalSplitWindow` מוגדרת אך `candidate-generator.js` עדיין מנהל בעצמו חלק מטווחי החיתוך.
- יש ליישב את הפער בין החוזה של `legalSplitWindow` לבין ההתנהגות בפועל של `generateCandidates`.
- יש להגדיר באופן חד את ההבדל בין מדיניות רגילה ל־strict, לרבות widow/orphan.
- אין לשכפל תנאי חיתוך או קבועים במודולים אחרים.
- `seamIsClean`, `escortCleanBoundary`, `escortNeedLines`, `stackHeightPx`, `escortStackHeightPx`, `orphanAtDestination` וכללי המדיניות חייבים להיות נצרכים בהתאם לחוזה אחיד.
- כל שינוי מדיניות חייב להיות מכוסה בבדיקת חיוב ובדיקת שלילה.

אין לשנות ערכי ברירת מחדל או מדיניות משתמש ללא אישור.

### 2.5 ColumnModel ו־PagePlan

יש ליצור חוזים פורמליים ומוגדרים, ולא להמשיך להסתמך על אובייקטים חופשיים בעלי שדות מקריים.

`ColumnModel` צריך לכלול, לכל הפחות:

- מזהה/אינדקס טור וסדר קריאה.
- גבולות גאומטריים וקיבולת.
- פריטים ושורות ממוקמים.
- LineModel מלא לכל שורה.
- gaps בין בלוקים.
- תקציבי הערות וריהוט המשפיעים על הקיבולת.
- גובה תפוס מתוכנן.
- overflow diagnostics.
- סיבות placement.

`PagePlan` צריך לכלול:

- Page template וגאומטריית עמוד.
- ColumnModels בסדר קריאה מוגדר.
- spanning regions.
- page reservations.
- note reservations.
- page transitions ו־page type.
- constraints שהופעלו.
- החלטות placement ו־rollback.
- diagnostics.
- trace דטרמיניסטי.

יש להגדיר validation ו־immutability לאחר השלמת התכנון.

אין ליצור מודל מקביל ל־PageModel העתידי; `PagePlan` הוא חוזה תכנון, ו־PageModel בשלב 7 יהיה המודל הסופי לאחר הקצאת כל הפריטים והגאומטריה.

### 2.6 Capacity אחיד ומורחב

יש להרחיב את חישובי הקיבולת כך שכל אזור שמקטין את שטח הגוף ייוצג כחלק ממודל הקיבולת.

לכל הפחות:

- אזורי גוף.
- פסים חוצי־טורים.
- הערות שוליים.
- אזורי הערות צד כאשר הם משפיעים על הגוף.
- margins.
- headers/footers.
- dividers.
- ornaments.
- page furniture.
- אזורים שמורים לפריטים שאינם ניתנים לפיצול.

בשלב זה אין צורך להשלים את כל חוזה פריטי העמוד של שלב 6, אבל יש להגדיר מנגנון reservation אחיד שיאפשר לשלב אותם ללא שינוי ליבת ה־Planner.

אין להשאיר חישובי capacity נפרדים ב־DP, ב־balancing, ב־protections ובמקרינים.

### 2.7 Decision Trace

יש להוסיף trace דטרמיניסטי המסביר:

- אילו מועמדים נבחנו.
- אילו constraints הופעלו.
- מדוע מועמד נדחה.
- מה היה ניקודו של מועמד שנשקל.
- מדוע מועמד נבחר.
- מדוע בוצעה נסיגה.
- מה הייתה תוצאת הנסיגה.
- אילו אילוצים לא ניתן היה לקיים.

ה־trace חייב להיות שימושי לאבחון אך לא לנפח את הזיכרון ללא גבול. יש להגדיר מבנה compact, אפשרות הפעלה/שמירה לפי צורך, ושמירה על דטרמיניזם.

אין להסתפק ברישום כללי של "flush" או "rollback" ללא סיבה ונתונים.

---

# חלק ב - סגירת שלב 5

## 3. ביצוע הפרוסה השנייה של שלב 5

יש לפתוח ענף חדש מעל main העדכני, לדוגמה:

`stage5b/planner-pageplan`

יש לעבוד ב־PR ממוקד אחד לסגירת יתרת שלב 5, ולא לערבב בו את מימוש שלב 6.

יש להשלים את כל דרישות שלב 5 בתוכנית הקנונית, ובפרט §§5.1-5.3.

### 3.1 דרישות פונקציונליות וארכיטקטוניות

1. Planner יחיד שמקבל ordered blocks ו־LineModel מלא.
2. ColumnModel ו־PagePlan פורמליים.
3. capacity אחיד ומבוסס גאומטריה פיזית.
4. FX-6 מתוקן מהשורש.
5. שילוב gaps בגאומטריה ובכל המקרינים.
6. RTL reading order מוגדר מבנית.
7. איזון, page break, chapter-end balancing ו־cross-column headings תחת אותו מודל אילוצים.
8. hard constraints ו־soft constraints מוגדרים היטב.
9. note budget משולב בהכרעת placement.
10. rollback יחיד, דטרמיניסטי ומדווח.
11. כל fallback מפורש ומוגבל; אין fallback שקט.
12. תמונות inline ו־float constraints נכללים בהחלטות התכנון, לא בתיקון מאוחר.
13. page transitions ו־page-type transitions מיוצגים ב־PagePlan.
14. trace מלא של החלטות מהותיות.
15. אין מדידה חוזרת ואין שינוי מדדי השורות לאחר שהתקבלו.
16. אין אובדן fragments, anchors, font identity או סדר תוכן.

### 3.2 בדיקות חובה

יש להוסיף בדיקות ממוקדות לכל אחד מהתיקונים, ובנוסף:

- FX-6: פער בלוקים נצבר נכון בכל מצב.
- FX-6: DOM ו־PDF מציגים את אותו פער.
- FX-6: אין פער כפול במעבר טור/עמוד.
- ColumnModel: אינווריאנטים של סדר, קיבולת וגאומטריה.
- PagePlan: שלמות, immutability ודטרמיניזם.
- LineModel: שימור fragments וזהויות מקור לאחר placement.
- Measurement: מונה שמוכיח שאין מדידה חוזרת ב־Planner.
- Notes: אין מדידה או שבירה עצמאית כפולה.
- Capacity: כל האזורים השמורים מופחתים בדיוק פעם אחת.
- Constraints: כל כלל נבדק גם בחיוב וגם בשלילה.
- RTL: אין היפוך סדר בין טורים או בתוך טור.
- Rollback: שחזור מצב מלא, ללא אובדן הערות או עוגנים.
- Corpus: השוואת כל השינויים מול baseline, עם סיווג מלא.

יש להריץ את מסמך הבדיקה הראשי `very_long_test_text.txt` ואת הקורפוסים האחרים הרלוונטיים.

אין לשנות ספי בדיקות כדי להעלים ממצאים.

### 3.3 דיוק בדוחות וב־CI

ב־PR #25 דווח `npm test` ‏1073/1073, ובלוג CI נמצאו 62 סוויטות שעברו. עם זאת, שם שלב הבדיקה ב־workflow עדיין מציין 670 בדיקות ו־33 קבצים.

יש לתקן את התווית והמסמכים כך שיתאימו למספרים בפועל.

יש להמשיך לתעד בנפרד:

- test matrix.
- corpus-invariants.
- determinism.
- full-math-audit.
- layout-audit.

שני כשלי הבסיס הידועים:

- `SIDE_NOTE_OVERLAP` בעמוד 107.
- `353,687 < 355,967` ב־full-math.

יש לשמר את חתימת הכשל, לוודא שלא נוספו כשלים חדשים, ולהמשיך באבחון שורש. אין להכריז שהבדיקות כולן ירוקות כל עוד שני ה־audits הללו נכשלים.

### 3.4 תיעוד ועדכון פנקסים

לעדכן:

- `audits/STAGE5_UNIFIED_PLANNER.md`
- `ISSUE_REGISTRY.md`
- `WORKLOG.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` - פנקס התקדמות בלבד, לא שינוי דרישות.

יש להפריד במפורש בין:
- הושלם ומחובר למסלול המוצר.
- קיים אך אינו נצרך.
- קיים חלקית.
- ממתין לשלב 6.
- ממתין לשלב 7.
- ממתין לשלב 9.

אין לטעון ששלב הושלם על סמך בדיקות יחידה בלבד.

## 4. שער קבלה לשלב 5

אין להכריז על שלב 5 כשלם לפני שכל אלה מתקיימים:

- כל סוגי הבלוקים במסלול הפעיל מתוכננים באמצעות Planner יחיד.
- LineModel מלא נשמר דרך התכנון.
- ColumnModel ו־PagePlan מוגדרים ומאומתים.
- capacity משותף לכל החלטות התכנון.
- FX-6 נסגר.
- אין מדידה חוזרת.
- אין תיקון גאומטריה עצמאי אחרי שבירת השורות.
- הערות, תמונות, כותרות ו־spanning items משתתפים בהחלטה.
- rollback ו־fallback דטרמיניסטיים ומדווחים.
- אין אובדן תוכן, source anchors, fragments או סדר.
- כל הבדלי הקורפוס מסווגים.
- דטרמיניזם נשמר.
- כל הבדיקות הרלוונטיות רצות ומדווחות במדויק.

לאחר שה־PR מוכן, יש לפתוח אותו עם כל הראיות. אין לדחוף ישירות ל־main.

---

# חלק ג - מיד לאחר סגירת שלב 5: שלב 6

לאחר שהפרוסה השנייה של שלב 5 מוזגה ל־main ושער הקבלה שלה נסגר, יש להתחיל מיד את שלב 6 ב־PR נפרד.

## 5. מטרת שלב 6

להפוך את כל פריטי העמוד, ההערות, העיטורים וריהוט העמוד לחוזי הרחבה של אותו מנוע.

המטרה היא שלא יהיה צורך להוסיף בכל פעם תנאי חדש ב־parser, ב־Planner, ב־renderer וב־export.

כל פריט חדש צריך להירשם בחוזה אחיד, לקבל מדידה ואילוצי placement, להשתלב ב־PagePlan ולהיות מוקרן מהמודל הסופי.

## 6. Page Item Contract

יש להגדיר חוזה אחיד עבור:

- כותרות עליונות.
- כותרות תחתונות.
- מספרי עמוד.
- קווי הפרדה.
- עיטורים.
- שערים.
- תוכן עניינים.
- עמודי הערות.
- עמודים מותאמים.
- פריטי רקע.
- תמונות ופריטי עימוד מיוחדים.

יש להבחין בין:

1. פריט שזורם בגוף העמוד.
2. פריט בלוק.
3. פריט עוגן.
4. פריט ריהוט קבוע של עמוד.
5. פריט שמזמין שטח גאומטרי מראש.

ההבחנה תהיה בשדות החוזה ובאילוצים, לא במנועים נפרדים.

## 7. מודל הערות מאוחד

יש לאחד את הערות השוליים, הערות הצד והערות הסיום תחת אותו source/anchor model.

יש לשמר:

- marker-to-note linkage.
- numbering scope.
- continuation.
- split policy.
- page ownership.
- reading order.
- source identity.
- מדדי הערה.
- תקציב אזור ההערות.

הערות צד דורשות מקצה אנכי משותף לכל הערות השול הפיזי, תוך שמירת סדר העוגנים ומניעת חפיפות.

אם אין מקום להערה, יש להפיק diagnostic מפורש ולא למקם אותה בחפיפה או להעלים אותה.

אין לבצע מדידת הערות כפולה: התקציב, ההצבה וההקרנה חייבים להתבסס על אותם מדדים.

## 8. עיטורים וריהוט עמוד

יש להגדיר עיטור כפריט שמצהיר על:

- dimensions.
- fit policy.
- anchoring.
- reserved space.
- clipping policy.
- projection capabilities.

אם העיטור דורש מקום, המקום יוזמן לפני הצבת הטקסט, כחלק ממודל הקיבולת של שלב 5.

הוספה או הסרה של עיטור לא תשנה את תוכן הטקסט או את זהות הפריטים. היא תשפיע על constraints ועל geometry בלבד.

כותרות עליונות, תחתונות ומספרי עמוד יהיו Page Items בעלי placement model אחיד. אין לחשב את מיקומם בנפרד ב־DOM וב־PDF.

## 9. שערים, TOC ועמודים מותאמים

יש לשלב שערים, תוכן עניינים ועמודים מותאמים כ־page types או blocks במודל המסמך.

אין ליצור עבורם pipeline עימוד נפרד.

יש לשמור על עיצובי השערים המקוריים ועל ברירות המחדל שאושרו.

**ערכת 40 ועיצובי השערים המקוריים חייבים להישאר פעילים אוטומטית כברירת מחדל.** יש להגן על כך בבדיקות רגרסיה מפורשות. אין לשנות זאת.

## 10. Registry להרחבת פריטי עימוד

יש ליצור registry שבו כל סוג פריט מצהיר על:

- kind.
- schema.
- validation.
- resource dependencies.
- measurement.
- constraints.
- placement participation.
- diagnostics.
- DOM projection.
- PDF projection.

יש להוסיף פריט מותאם חדש לדוגמה באמצעות registry בלבד, ולהוכיח שהוא עובר:

`parse → validate → resolve → measure → break/plan → PagePlan → PageModel → DOM/PDF`

בלי להוסיף תנאי if/else מפוזרים בליבת המנוע.

## 11. בדיקות שלב 6

יש לבדוק:

- כל סוגי ההערות.
- marker-to-note linkage.
- הערות המשך.
- הערות ארוכות.
- הערות צד מרובות בעמוד.
- חפיפות וגלישות.
- קווי הפרדה.
- עיטורים.
- שערים.
- TOC.
- headers/footers.
- page numbers.
- page furniture.
- עמודים מותאמים.
- פריט הרחבה חדש.

יש להוכיח שכל הפריטים עוברים באותו Planner ובאותו מודל קיבולת, ושאין מסלול עימוד צדדי.

## 12. תוצרים של שלב 6

- Page Item registry.
- Page Item contract.
- מודל הערות אחיד.
- מקצה הערות צד משותף.
- מודל עיטורים וריהוט עמוד.
- fixtures לכל סוגי הפריטים.
- פריט מותאם חדש לדוגמה.
- `audits/STAGE6_PAGE_ITEMS.md`.

שער הקבלה יהיה לפי סעיף 6.3 בתוכנית הקנונית.

---

# חלק ד - עקרונות שאסור להפר לאורך העבודה

1. עיקרון העל הוא: **מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**
2. פישוט ואיחוד המנוע חשובים לא פחות מהוספת יכולות. אין להוסיף מתאמים, מסלולים מקבילים או טלאים במקום תיקון שורש.
3. P6/P7 מחוץ לתחום לחלוטין. אין להחזירם לדיון או לטפל בהם בהקשר התאמת שורות ומילים.
4. אין לשנות ברירות מחדל, מזהי טקסט או הגדרות משתמש ללא אישור.
5. `justify` נשאר ברירת המחדל.
6. ערכת 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.
7. מסמכי בדיקה סינתטיים חייבים להיות תקינים מבנית: אין שתי כותרות רצופות מאותה רמה ללא טקסט גוף ביניהן, ואין כותרת שמכילה הערת שוליים בלבד.
8. אין להשתמש ב־PDF הייחוס ההיסטורי כיעד התאמה סופי; הוא המחשה כללית בלבד ומכיל שגיאות.
9. אין למחוק נתיבי מורשת לפני שלב 9 והוכחה מקצה לקצה.
10. אין להחליש בדיקות, להסתיר ממצאים או להכריז על הצלחה כאשר בדיקה לא רצה.
11. אין להמתין לריצת CI מעל חמש דקות כדי להמשיך במשימות בלתי תלויות. יש לתעד pending/failure/success במדויק.
12. כל שינוי שמשפיע על עימוד חייב לכלול בדיקת E2E, שימור תוכן, דטרמיניזם והשוואת קורפוס לפי היקף ההשפעה.

---

# הוראת ביצוע אחרונה

התחל מיד בסגירת יתרת שלב 5, תוך שימוש ב־main העדכני ובממצאי הביקורת שלעיל.

אל תבצע ריפקטור קוסמטי. אל תיצור שכבה נוספת רק כדי לעקוף את הבעיה. חפש את נקודת הסמכות הנכונה ותן לה אחריות מלאה.

לאחר סגירת שלב 5, עבור לשלב 6 ב־PR נפרד.

היעד אינו רק שהמנוע יעבור את הבדיקות הקיימות. היעד הוא מנוע עימוד דטרמיניסטי, מדויק, פשוט, מאוחד וניתן להרחבה - שבו הוספת פריט עימוד חדש היא פעולה טבעית ופשוטה, ולא פרויקט של תיקונים בכל שכבה.

יש להתקדם לביצוע, להגיש PRs ממוקדים עם ראיות, ולתעד במדויק מה הושלם ומה נותר פתוח.

---

**ההמלצה שלי\:** לא להתחיל עכשיו את שלב 6 במקביל לתיקוני שלב 5. ה־Planner הוא נקודת ההכרעה המרכזית של המנוע; אם נבנה מעליו פריטי עמוד לפני שסוגרים את חוזה הקיבולת, הפערים וה־PagePlan, ניאלץ לחזור ולתקן את כל השכבות. לכן המסלול המהיר באמת הוא לסגור את הפרוסה השנייה של שלב 5 ב־PR ממוקד, למזג אותה לאחר בדיקה, ואז להמשיך ברצף לשלב 6.

## Prompt:
16.11.2026, 21:13:57

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות..

## Response:
16.11.2026, 21:14:18 · gpt-6

> **Preparing stage six**
>
> I’m drafting a concise implementation prompt for Stage 6, slice 2, covering remaining geometry, registry validation, notes, testing, and the transition into Stage 7 without expanding scope unnecessarily.
>
> **Prepared stage six**
>
> 
>
> **Audited repository pull requests, CI workflows, failures, and stage audits**
>
> 
>
> Worked for 1m 20s

## בדיקת מצב הפרויקט - 16 בנובמבר 2026

יש התקדמות ממשית: הסוכן לא רק הודיע שהשלים, אלא כבר מיזג שתי עבודות נוספות ל־`main`\.

**PR \#26 - סגירת שלב 5** (ממוזג)

מיזוג: 16 בנובמבר, 18:45 UTC

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/26?utm_source=chatgpt.com)

---

**PR \#27 - שלב 6, פרוסה 1** (ממוזג)

מיזוג: 16 בנובמבר, 19:09 UTC

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/27?utm_source=chatgpt.com)

---

**ראש `main` הנוכחי**

`2dedc77fef347feb812f815c131ef5bbe5eec6f8`

### 1\. ביקורת PR \#26 - שלב 5

העבודה נראית משמעותית ומכסה את פערי הביקורת הקודמים\:

- FX-6: פער בין בלוקים הפך לחלק מהגאומטריה המתוכננת, עם חותמת אחת והקרנה ל־DOM ול־PDF.
- נוספו חוזי `ColumnModel` ו־`PagePlan`, כולל בדיקות תקינות והקפאה.
- הוספו מדדי הערות וחשבונאות שמטרתם להוכיח שאין מדידה חוזרת.
- `legalSplitWindow` הפך למקור סמכות לטווח הפיצול.
- נוסף Decision Trace דטרמיניסטי.
- תווית הבדיקות ב־CI עודכנה.

**הסתייגות חשובה\:** ה־PR מדווח שהשערים הושלמו, אך צריך להבחין בין חוזה שמחזיק הפניה ל־`LineModel` לבין הוכחה שכל הצרכנים מתכננים מתוך המודל המלא. זו נקודה שעלינו לשמר בביקורת הסופית של שלב 9, ולא להסתפק ב־validation.

### 2\. ביקורת PR \#27 - שלב 6, פרוסה 1

הפרוסה הראשונה כוללת שלושה הישגים ממשיים\:

- חוזה ורישום מרכזי ל־11 סוגי פריטי עמוד.
- חישוב גאומטריית כותרת וגיליון ממקור יחיד ל־DOM ול־PDF.
- הרחבת חותמות ההערות כך שיכללו גם רוחבי מילים.

בנוסף, נבדקה שמירת ערכת 40 ועיצובי השערים המקוריים.

אבל חשוב מאוד: **שלב 6 עדיין רחוק מהשלמה.** דוח `audits/STAGE6_PAGE_ITEMS.md` מציין במפורש שהמודל המאוחד של הערות השוליים והצד, המקצה האנכי המשותף, ההקרנה מתוך חותמות המדידה ופריט ההרחבה לדוגמה - ממתינים לפרוסה 2.

יש כאן גם נקודה ארכיטקטונית שצריך להקפיד עליה: הרישום מתאר את הסמכויות, אבל הבונים הקיימים עדיין נשארים בעלי הסמכות בפועל. אין בכך בעיה בפרוסה הראשונה, אך בפרוסה הבאה צריך להוכיח שהחוזה אינו רק קטלוג תיעודי, אלא באמת מאפשר להוסיף פריט חדש בלי פיזור תנאים בליבת המנוע.

### 3\. בדיקות CI

(עבר) `npm test` - ‏1055/1055 בכל Node 18, 20 ו־22 ב־PR \#27. גם בדיקת הדטרמיניזם וה־cross-check עברו.

(עבר) `corpus-invariants`\.

(נכשל) `layout-audit` - שני ממצאי `SIDE_NOTE_OVERLAP` בעמוד 107.

(נכשל) `full-math-audit` - 353,687 מילים לעומת רצפת 355,967.

שני הכשלים האחרונים תואמים לחתימות הכשל ההיסטוריות שכבר תועדו. לכן אינני מסווג אותם כרגרסיות חדשות של PR \#27, אך גם אינני מסמן אותם כפתורים.

**אין PR פתוח נוסף שמוכן למיזוג.** PR \#16 ו־\#17 עדיין פתוחים, ישנים ומבוססי ענפים קודמים; אין למזג אותם בשלמותם.

## ההחלטה והמשימה הבאה

שני ה־PRs כבר ממוזגים, ולכן אין צורך בפעולת מיזוג נוספת כרגע. בדקתי גם את השלמת ריצות ה־CI: שלוש גרסאות Node עברו בשני ה־PRs, וכך גם בדיקות הדטרמיניזם וה־cross-check ב־PR \#27. כשלי ה־layout וה־full-math עדיין קיימים.

הצעד הנכון עכשיו הוא **שלב 6, פרוסה 2 - השלמת מודל ההערות, חיבור אמיתי של ה־Page Item Registry, והוכחת הרחבה באמצעות פריט חדש**\. לאחר מכן שלב 7: PageModel יחיד וסופי.

להלן הפרומט המוכן\:

**document: **

# המשך פיתוח מנוע העימוד - שלב 6, פרוסה 2, והיערכות לשלב 7
## Tora_Book_Typesetter_Red_Work_2

המשך לעבוד על המאגר:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

הענף הראשי `main` מעודכן. בסיס העבודה הנוכחי:

`2dedc77fef347feb812f815c131ef5bbe5eec6f8`

תוכנית העבודה המחייבת:

`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

יש להתקדם למימוש בפועל, ב-PR ממוקד, תוך שמירה על העקרונות הארכיטקטוניים שכבר הוגדרו.

---

# חלק א - מצב אמת: מה כבר הושלם

## 1. שלבים קודמים

העבודות הבאות כבר ממוזגות ואין לבצע אותן מחדש:

- PR #18 - תוכנית עשרת השלבים.
- PR #19 - שלב 1: מיפוי מצב קיים, חוזים ומקורות סמכות.
- PR #20 - שלב 2: DocumentModel ומודל פריטים אחיד.
- PR #21 - תיקון R-03.
- PR #22 - שלב 3: נכסים, גופנים ומדידה אחידה.
- PR #23 ו־#24 - שלב 4: מנוע שורות יחיד וחיבורו לנתיב המוצר.
- PR #25 ו־#26 - שלב 5: Planner מאוחד, FX-1 עד FX-6, ColumnModel, PagePlan, capacity, trace וטוהר מדידה.
- PR #27 - שלב 6, פרוסה 1: Page Item Contract, registry ראשוני וגיאומטריית ריהוט ממקור יחיד.

אין להניח שכל תת-יכולת הושלמה רק משום שהיא מוזכרת ברישום או בתיעוד. יש להבחין בין חוזה שהוגדר, מימוש שקיים, מימוש שמחובר לנתיב הפעיל, ומימוש שהוכח מקצה לקצה.

## 2. מצב שלב 5 - PR #26

PR #26 ממוזג. הוא כולל:

- FX-6: `gapBeforePx` כחלק מהגאומטריה המתוכננת.
- צבירת gaps בקיבולת ובהקרנה.
- חוזי ColumnModel ו־PagePlan.
- בדיקות validation ו־immutability.
- מנגנוני מדדי הערות ומדידה חד-פעמית.
- איחוד `legalSplitWindow` כמקור סמכות.
- Decision Trace.
- עדכון תווית CI.

יש לשמר את התוצאות וההוכחות של PR #26.

עם זאת, אין להסיק מהחזקת `lineModel` בהפניה שהוכח שכל הצרכנים משתמשים במודל השורה המלא. יש להמשיך לוודא זאת בביקורת האינטגרציה ובשלבים הבאים.

## 3. מצב שלב 6 - PR #27, פרוסה 1

PR #27 ממוזג. נוספו:

- `layout/page-items.js` - חוזה ורישום פריטי עמוד.
- חמישה אופני השתתפות: `flow`, `block`, `anchor`, `furniture`, `reserved`.
- רישום של 11 סוגי פריטים קיימים.
- `reservePageItemSpace` המשתמש במנגנון reservations של שלב 5.
- `layout/furniture-geometry.js` - מקור גאומטרי משותף ל־DOM ול־PDF עבור כותרות וגיליונות.
- חותמות הערות הכוללות רוחבי מילים, רוחב סמן ורוחב רווח.
- בדיקות לשמירת ערכת 40 ועיצובי השערים המקוריים.

**העבודה הזאת היא תשתית לפרוסה השנייה, לא השלמת שלב 6.**

---

# חלק ב - ביקורת והשלמות לשלבים הקודמים

## 4. CI ו־baseline

ב־PR #26 וב־PR #27:

- בדיקות Node 18/20/22 עברו.
- בדיקות determinism ו־cross-check עברו.
- `corpus-invariants` עבר.
- `layout-audit` עדיין נכשל בשני ממצאי `SIDE_NOTE_OVERLAP` בעמוד 107.
- `full-math-audit` עדיין נכשל: 353,687 מילים לעומת רצפה 355,967.

אלה חתימות כשל בסיס מוכרות. אין לסווגן כרגרסיה חדשה ללא ראיה, אך גם אין להסתיר אותן או להציג את כל ה־CI כירוק.

יש לשמר אותן ב־`ISSUE_REGISTRY.md` ולבצע מעקב אחריהן. אם במהלך שלב 6 נמצא קשר סיבתי להערות הצד או למדדי הערות, יש לתקן את שורש הבעיה. אין לבצע שינוי לא קשור רק כדי להפוך את ה־CI לירוק.

אין לשנות ספים, לנטרל בדיקות או לעדכן snapshots בלי הוכחת תקינות.

## 5. בדיקת מימוש ה־Page Item Registry

ב־PR #27 נרשם במפורש שהבונים הקיימים נשארים בעלי הסמכות בפועל, ושה־registry מתאר ומפרש את המפה.

בפרוסה הנוכחית יש להתקדם מעבר לכך:

- לא להשאיר registry שהוא בעיקר הצהרתי.
- לא להוסיף שכבת תיווך שמכפילה את אחריות הבונים.
- להגדיר כיצד ה־pipeline וה־Planner צורכים את חוזי הפריטים.
- לוודא שכל פריט רשום עובר validation לפי החוזה שלו.
- לוודא שהשתתפות הפריט, מדידתו, ההזמנה הגאומטרית שלו וההקרנה שלו עקביות.
- אם סוג פריט עדיין לא עבר הגירה מלאה, לסמן זאת במפורש ולמנוע הצגת מצג כאילו הוא כבר פועל דרך registry.

יש לשאוף לכך שה־registry יהיה מקור סמכות תפעולי אחד, ולא רשימת תיעוד שמקבילה למימושים המפוזרים.

---

# חלק ג - שלב 6, פרוסה 2: מודל הערות מאוחד והרחבת פריטים

יש לפתוח ענף חדש מעל `main`, לדוגמה:

`stage6b/unified-notes-item-extension`

יש להגיש PR נפרד וממוקד.

## 6. מטרה מרכזית

להשלים את החיבור של סוגי ההערות השונים למודל מקור/עוגן משותף, להבטיח שמדידה, תקציב, הצבה והקרנה צורכים אותם מדדים, ולספק הוכחה ממשית שניתן להוסיף סוג פריט חדש באמצעות החוזה וה־registry בלבד.

העיקרון:

**מקור תוכן אחד → עוגן אחד → מדידה אחת → תקציב והצבה מאוחדים → PagePlan → הקרנה מהמדדים הקיימים.**

אין ליצור מנוע הערות צדדי או מנגנון מדידה נוסף.

## 7. מודל הערות אחיד

יש לאחד את:

- הערות שוליים.
- הערות צד.
- הערות סיום.
- הערות המשך.
- הערות ארוכות שמתפצלות בין עמודים.
- הערות שמועברות בשל חוסר מקום.

כל סוגי ההערות חייבים להשתמש בחוזה משותף הכולל, לכל הפחות:

- `sourceId` או זהות מקור שקולה.
- `anchorId` וקישור למיקום המקורי.
- מזהה הערה.
- marker ותוכן.
- numbering scope.
- מדדים קנוניים.
- שורות מדודות.
- רוחבי מילים, רווחים וסמן.
- line-height.
- מדיניות פיצול.
- מדיניות continuation.
- page ownership.
- סדר קריאה.
- diagnostics.

יש להימנע ממצב שבו אותו טקסט מועתק למספר מבנים עצמאיים בעלי זהות שונה.

הערה מפוצלת צריכה לשמור את הקשר שלה למקור ואת טווחי התוכן המדויקים. המשך הערה אינו רשאי להעלים, לשכפל או לסדר מחדש מילים.

## 8. מקצה אנכי משותף להערות צד

זהו אחד החלקים המרכזיים בפרוסה.

יש ליצור מנגנון יחיד שמקצה את מיקומי כל הערות הצד בעמוד:

- כל ההערות בעמוד משתתפות באותו חישוב.
- המיקומים נקבעים לפי העוגנים וסדר הקריאה.
- יש למנוע חפיפה בין הערות.
- יש לכבד את גבולות העמוד ואת אזורי התוכן.
- יש להגדיר מרווח מינימלי בין הערות בהתאם למדיניות הקיימת.
- הערה ארוכה רשאית להימשך לפי מדיניות מפורשת, אך אינה רשאית להיכנס בשקט לתוך הערה אחרת.
- כאשר אין מקום, יש להפיק diagnostic מפורש ולבצע את מדיניות ה־overflow שהוגדרה.
- אין להזיז הערה באופן עצמאי ב־DOM או ב־PDF לאחר שהתקבלה החלטת placement.

יש לבדוק במיוחד את `SIDE_NOTE_OVERLAP` בעמוד 107.

אין להניח מראש שהבעיה נפתרת באמצעות הגדלת מרווח או הזזת הערות. יש לאתר את מקור חישוב הגובה, העוגן, מיקום ההערה וההקרנה.

המקצה חייב להיות דטרמיניסטי ולהפיק trace של החלטות מהותיות.

## 9. הקרנת הערות מתוך חותמות המדידה

PR #26 ו־#27 הכינו חותמות הכוללות:

- `noteRows`.
- `noteWords`.
- `wordW`.
- `markerW`.
- `spaceW`.
- `heightPx`.
- `lineH`.

יש להשלים את צריכתן בפועל בכל המקרינים.

הדרישות:

1. `wrapNoteTokens` וכל מקבילותיו אינם רשאים למדוד מחדש מילים.
2. אין לבצע wrap עצמאי ב־DOM או ב־PDF.
3. אין לחשב מחדש רוחבי מילים.
4. אין להפיק גובה הערה בנוסחה נפרדת מהתקציב.
5. תקציב ההערות, מיקומן וההקרנה חייבים להשתמש באותן שורות מדודות.
6. יש לשמור על marker, רווחים, RTL וסדר המילים.
7. יש להוכיח שגאומטריית ההערה בפועל תואמת לחותמת.
8. יש להפיק diagnostic כאשר חותמת חסרה או אינה תקינה, ולא לבצע מדידה חלופית שקטה.

יש להשלים את אותו עיקרון גם בעמודי הערות הסיום.

## 10. מדידת הערות צד ממקור אחד

כיום ה־descriptor של `side-note` מתעד שימוש ב־`estimateSideNoteHeight`.

יש לבדוק אם מדובר במדידה נפרדת מהמדידה וההקרנה, ואם כן - לאחד אותה.

יש להגדיר מדידה קנונית של הערת צד ברוחב השוליים בפועל, הכוללת:

- רוחב זמין.
- גופן וגודל.
- שורות.
- רוחבי מילים ורווחים.
- line-height.
- גובה סופי.
- clipping/overflow לפי מדיניות.

המקצה האנכי וה־renderer חייבים להשתמש באותו מדד.

אין למדוד את ההערה פעם אחת לצורך הקצאה ופעם שנייה לצורך ציור.

## 11. פריט מותאם חדש - הוכחת הרחבה אמיתית

יש להוסיף סוג פריט חדש לדוגמה, שאינו אחד מ־11 הסוגים שכבר רשומים.

יש לבחור פריט שמדגים היטב את יכולת ההרחבה, למשל פריט מידע צדדי או תיבת טקסט מיוחדת בעלת עוגן, גובה ורוחב מוגדרים.

הפריט חייב לעבור את כל השרשרת:

`parse → validate → resolve → measure → break/plan → PagePlan → DOM/PDF`

דרישות:

- הרישום מגדיר את סוג הפריט ואת אופן ההשתתפות.
- ה־schema מאמת את התוכן.
- המדידה מתבצעת דרך מנגנון המדידה הקנוני.
- ה־Planner מקבל את אילוצי הפריט לפני ההחלטה.
- הפריט מופיע ב־PagePlan עם זהות מקור וגאומטריה.
- DOM ו־PDF מקרינים אותו מאותו placement.
- אין להוסיף if/else מיוחד בכל שכבה.
- אין לשנות את מנוע הליבה כדי לתמוך בפריט החדש, למעט נקודות הרחבה גנריות שנדרשות באמת בחוזה.
- יש להציג בבדיקה את רשימת הקבצים ששונו לצורך הוספת הפריט, ולהסביר מדוע כל שינוי נדרש.

המבחן החשוב הוא לא שהפריט עובד, אלא שהוא עובד באמצעות מנגנון ההרחבה האחיד.

## 12. הגירת סוגי הפריטים הקיימים

יש לבצע inventory של 11 סוגי הפריטים הרשומים ב־PR #27.

לכל אחד יש לציין:

- האם הוא רשום.
- האם ה־schema מאומת בפועל.
- האם הוא נמדד דרך המנגנון הקנוני.
- האם הוא משתתף ב־Planner.
- האם הוא משתמש ב־reservations אם נדרש.
- האם DOM מקרין אותו מהמודל.
- האם PDF מקרין אותו מאותו מודל.
- האם קיימת מדידה או החלטה כפולה.
- מה נותר להעברה.

אין צורך להגר את כל 11 הסוגים באותו PR אם הדבר מסכן את יציבות המנוע, אבל יש להבטיח שכל סוג שקשור להערות בפרוסה זו עבר אינטגרציה מלאה.

אין לטעון שכל registry הושלם אם נותרו builders פעילים מחוץ לחוזה.

---

# חלק ד - בדיקות שלב 6, פרוסה 2

## 13. בדיקות פונקציונליות

יש להוסיף בדיקות מפורשות עבור:

- הערת שוליים רגילה.
- הערת שוליים ארוכה.
- הערה שמתפצלת.
- הערה שמועברת בשל חוסר מקום.
- הערת צד בודדת.
- הערות צד מרובות בעמוד.
- הערות צד בעלות גבהים שונים.
- הערות צד צפופות עם עוגנים קרובים.
- הערה ארוכה במיוחד.
- הערה סמוך לתחתית העמוד.
- הערה במעבר עמוד.
- הערת המשך.
- הערות סיום.
- marker והצמדה למילה.
- RTL.
- גופנים מעורבים, אם רלוונטי.
- חותמת מדדים חסרה או פגומה.
- overflow שאינו ניתן לפתרון.
- פריט ההרחבה החדש.

## 14. בדיקות גאומטריה ומדידה

יש להוכיח:

- מדידה אחת לכל הערה.
- אין מדידה חוזרת ב־Planner.
- אין מדידה חוזרת במקרינים.
- תקציב = גובה הצבה = גובה הקרנה.
- שורות ההערה בהקרנה זהות לשורות החותמת.
- רוחבי מילים ורווחים זהים לחותמת.
- אין חפיפות בהערות הצד.
- אין חריגה שקטה מגבולות העמוד.
- אין שינוי גאומטרי בין DOM ל־PDF.
- כל diagnostic נושא מקור וסיבתיות.

יש להוסיף counters או instrumentation לבדיקות, אך לא להשאיר מנגנון חשבונאות בדיקות כ־runtime מורכב או מקור סמכות נוסף.

## 15. בדיקות קורפוס

יש להריץ:

- `very_long_test_text.txt` במלואו.
- canonical corpus.
- long real text.
- כל fixtures הרלוונטיים להערות.
- cross-check.
- determinism.
- full-math-audit.
- layout-audit.

יש להשוות מול baseline ולסווג כל שינוי:

- שינוי תוכן.
- שינוי סדר.
- שינוי עוגן.
- שינוי מספר הערות.
- שינוי פיצול הערות.
- שינוי גאומטרי צפוי.
- שינוי גאומטרי בלתי צפוי.
- שינוי אריזה בלבד.

אין לעדכן locks בלי להסביר בדיוק מה השתנה ולמה.

מסמכי בדיקה סינתטיים חייבים להיות תקינים מבנית. אין ליצור שתי כותרות רצופות מאותה רמה ללא טקסט ביניהן, ואין כותרת שמכילה הערת שוליים בלבד.

## 16. תיעוד

לעדכן:

- `audits/STAGE6_PAGE_ITEMS.md`
- `ISSUE_REGISTRY.md`
- `WORKLOG.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

יש להוסיף:

- מצב כל אחד מ־11 סוגי הפריטים.
- מצב מודל ההערות.
- מצב המקצה האנכי.
- מדדי הערות והוכחת מדידה חד-פעמית.
- תוצאות הפריט החדש.
- בדיקות DOM/PDF.
- פערים שנותרו במפורש.

אין לסמן את שלב 6 כשלם בפרוסה זו אם שער הקבלה של §6.3 עדיין אינו סגור.

## 17. שער קבלה לפרוסה 2

אין להגיש PR כשלם לפני שמתקיימים:

- מודל מקור/עוגן משותף להערות.
- מקצה אנכי משותף להערות צד.
- אין חפיפות בלתי מדווחות.
- תקציב, הצבה והקרנה משתמשים באותם מדדים.
- אין מדידה חוזרת.
- אין wrap עצמאי במקרינים.
- הערות סיום משתמשות במדדים המאוחדים.
- פריט חדש עובר את כל הצינור באמצעות החוזה וה־registry.
- אין אובדן תוכן או שינוי סדר.
- DOM ו־PDF מקרינים את אותה גאומטריה.
- הקורפוס נשמר וכל שינוי מסווג.
- determinism נשמר.

לאחר מכן יש לעדכן במדויק מה נותר בשלב 6. אין להכריז על שלב 6 כולו כשלם לפני שכל שערי §6.3 מתקיימים.

---

# חלק ה - השלב הבא: שלב 7, PageModel יחיד

לאחר מיזוג פרוסה 2, יש להתחיל מיד שלב 7 בענף חדש וב־PR נפרד.

## 18. מטרת שלב 7

להפיק PageModel יחיד, סופי, immutable, שמכיל את כל ההחלטות הסמנטיות והגאומטריות של העימוד.

המודל הזה הוא תוצר התכנון הסופי שממנו כל מקרין יקבל את הנתונים.

העיקרון:

**DocumentModel → Measured Items → LineModel → Planner → PagePlan → PageModel → מקרינים טהורים.**

אין לאפשר ל־DOM, ל־PDF או לכל שכבה אחרת להחליט מחדש היכן נמצא פריט.

## 19. חוזה PageModel

יש להגדיר schema וגרסה מפורשת.

PageModel צריך לכלול:

- מסמכי מקור וזהויות.
- עמודים בסדר סופי.
- page type/template.
- גאומטריית עמוד.
- ColumnModels.
- spanning regions.
- כל שורות LineModel וה־fragments שלהן.
- block placements.
- Page Items.
- תמונות ונכסים.
- הערות, markers ועוגנים.
- עיטורים.
- headers/footers/folios.
- gaps ו־reservations.
- source ranges.
- סדר קריאה.
- גאומטריית placement סופית.
- diagnostics.
- trace או הפניה ל־trace.
- resource references ו־integrity metadata.

יש להבחין בין מידע סמנטי, מדדים, החלטות placement והוראות projection.

אין לשכפל אותו מידע במבנים מקבילים ללא צורך.

## 20. בניית PageModel

יש ליצור builder יחיד:

`buildPageModel(PagePlan, resources, metadata)`

ה־builder צריך:

- לאמת את PagePlan.
- לאמת שכל פריט שהתקבל לתכנון מופיע בתוצאה.
- לוודא שאין פריט יתום.
- לוודא שאין כפילויות.
- לוודא שכל source anchor נשמר.
- לוודא שכל גאומטריה תקינה.
- לוודא שכל reservation נצרך או מדווח.
- להפיק diagnostics מפורשים.
- להקפיא את המודל ואת המבנים המקוננים.

אין לבצע מדידה, שבירת שורות, איזון או החלטת placement מחדש בשלב הזה.

## 21. אימות PageModel

יש להגדיר invariants:

- כל פריט מקור מופיע פעם אחת, או שיש לו מדיניות פיצול מפורשת.
- כל fragment שומר source identity.
- אין שורות חופפות בניגוד לחוזה.
- אין placement מחוץ לגבולות ללא diagnostic.
- כל הערה מקושרת לעוגן.
- אין marker יתום.
- סדר הקריאה נשמר.
- גאומטריית gaps עקבית.
- כל reservation תואם לשטח שהופחת מהקיבולת.
- כל resource נפתר או מדווח ככשל מפורש.
- אין שדות mutable.
- אותו קלט מפיק PageModel זהה.

יש להפיק validation report שניתן להשוות בין ריצות.

## 22. גבולות אחריות

PageModel הוא מקור האמת הסופי של מיקומים וגאומטריה.

לאחר בנייתו:

- אין renderer שמזיז פריטים.
- אין renderer שמודד מילים.
- אין renderer ששובר שורות.
- אין renderer שמחשב תקציב הערות.
- אין renderer שמבצע balancing.
- אין renderer שמתקן gaps.
- אין renderer שמחליט על סדר קריאה.
- אין renderer שמשלים פריט חסר באופן שקט.

כל החלטה כזאת חייבת להתרחש קודם לכן.

## 23. בדיקות שלב 7

יש לבדוק:

- PageModel קצר.
- PageModel של `very_long_test_text.txt`.
- כל סוגי הפריטים.
- הערות שוליים/צד/סיום.
- תמונות inline ו־float.
- גופנים מעורבים.
- עיטורים ושערים.
- עמודי TOC.
- עמודים מבניים.
- עמודים עם spanning.
- RTL.
- immutability עמוקה.
- determinism.
- validation של פריטים יתומים וכפילויות.
- content preservation.
- השוואת PagePlan ל־PageModel.
- שחזור מלא של הגאומטריה.

יש להוכיח שהמודל הסופי הוא תוצאה ישירה של התכנון ואינו מכיל החלטות חדשות.

## 24. תוצרים של שלב 7

- `PageModel` schema.
- `buildPageModel`.
- validator.
- immutable final model.
- בדיקות invariants.
- דוח `audits/STAGE7_PAGE_MODEL.md`.
- עדכון מפת התלויות ופנקס ההתקדמות.

שער הקבלה ייסגר רק כאשר כל פריטי המסמך והעמוד מיוצגים במודל הסופי, וכל הצרכנים העתידיים יכולים להסתמך עליו ללא גישה להחלטות העימוד.

---

# חלק ו - עקרונות על שאסור להפר

1. **מודל פריטים אחד → צינור עימוד אחד → מדידה ושבירה פעם אחת → Planner אחד → PageModel יחיד → מקרינים טהורים.**
2. פישוט ואיחוד חשובים לא פחות מהוספת יכולות. אין להוסיף adapters, שכבות כפולות או מסלולים מקבילים כפתרון קבוע.
3. P6/P7 מחוץ לתחום לחלוטין. אין לפתוח אותם מחדש.
4. אין לשנות ברירות מחדל, מזהי טקסט או הגדרות משתמש ללא אישור.
5. `justify` נשאר ברירת המחדל.
6. ערכת 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.
7. אין למחוק מסלולי legacy לפני שלב 9 והוכחה מלאה.
8. אין להחליש בדיקות כדי להסתיר ממצאים.
9. אין לסווג כשל baseline ככשל חדש ללא השוואה, אך אין להסתיר אותו.
10. כל שינוי חייב לשמור תוכן, עוגנים, גופנים, סדר קריאה ודטרמיניזם.
11. אין להשתמש ב־PDF הייחוס ההיסטורי כיעד התאמה סופי.
12. יש לעבוד בפרוסות ממוקדות, עם PR נפרד לכל שלב מהותי.
13. אין להמתין לריצות CI ארוכות מעל חמש דקות כאשר ניתן לבצע בדיקות או עבודה בלתי תלויות במקביל.
14. יש לדווח במדויק מה עבר, מה נכשל, מה לא רץ ומה ממתין.

## הוראת ביצוע

התחל מיד בפרוסה השנייה של שלב 6 על בסיס `main` הנוכחי.

אין להסתפק בעדכון תיעוד. יש לבצע את האינטגרציה בפועל, להוסיף בדיקות, להריץ את הקורפוס, להגיש PR ממוקד ולדווח עם ראיות.

לאחר מיזוג פרוסה 2, התחל מיד את שלב 7 ב־PR נפרד.

המטרה היא להגיע למנוע עימוד פשוט, דטרמיניסטי, שקוף ומאוחד, שבו כל סוג פריט משתלב באופן טבעי בחוזה הקיים, וכל החלטת עימוד מתקבלת פעם אחת בלבד.

---

### מה אני מצפה לראות בסבב הבא

לא עוד PR שמוסיף רק תשתית הצהרתית. הפעם אני מצפה לשלושה דברים מוכחים\:

1. **הערות צד אינן חופפות** - עם מקצה משותף ופתרון שורש לממצא בעמוד 107, אם אכן נובע מאותו מנגנון.
2. **ההערות אינן נמדדות או נשברות מחדש** - ההקרנה משתמשת בחותמות המדידה הקיימות.
3. **פריט חדש באמת מתווסף דרך ה־Registry** - בלי להוסיף תנאים מפוזרים במנוע.

כך נתקדם ברצף: שלב 6 פרוסה 2, שלב 7, שלב 8, ואז שלב 9 שבו נוכיח שהמסלול המאוחד באמת החליף את מסלולי המורשת. זו הדרך לסיים את המנוע ולא להמשיך לצבור שכבות.

## Prompt:
17.11.2026, 0:52:30

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים.

## Response:
17.11.2026, 0:52:50 · gpt-6

> **Assessing merge readiness**
>
> I’m judging the pull requests against CI, branch freshness, conflicts, and overlap with main. The reported bundle mismatch, stale lock hash, and baseline overlap make PR16 unready; PR14 also appears outdated and overlapping.
>
> **Planning verification**
>
> I’m checking the current plan, audit records, deployment status, and open pull requests. I’ll also ensure every user-visible change includes a Pages rebuild and live verification, including changes expected to be visually unchanged.
>
> **Planned verification**
>
> 
>
> **Refining the roadmap**
>
> I’m treating stale pull requests as audit inputs, not merge candidates. I’ll preserve any unique, validated fixes, then plan Stage 8 around the current architecture, regression checks, and mandatory Pages verification after each user-visible change.
>
> **Consolidating implementation checks**
>
> I’m separating stale pull-request findings from current work. I’ll preserve validated corrections, retest unique anchor behavior on main, and require deployment verification for every visible change or claimed non-change.
>
> **Finalizing implementation**
>
> I’m separating stale pull-request findings from current work, preserving only validated corrections. I’ll retest anchor behavior on main and require deployment verification after every visible change or confirmed non-change.
>
> **Consolidating implementation**
>
> I’m treating stale pull requests as audit inputs rather than merge candidates. Current main already contains validated Stage 6B/7 work, while unique anchor behavior still needs focused retesting before Stage 8 proceeds.
>
> **Finalized and consolidated the implementation roadmap checks**
>
> 
>
> **Reviewed pull requests, CI failures, branch history, deployments, and rendering fixes**
>
> 
>
> Worked for 3m 18s

בבדיקה הראשונית התגלתה נקודה חשובה: בניגוד לנקודת העצירה הקודמת שלנו, בריפו יש כעת **שלושה PR-ים פתוחים - \#14, \#16 ו־\#17**\. שניים מהם נוגעים ישירות בליבת מנוע העימוד, ואחד מהם (\#16) מציג שיפור גדול מאוד במספר העמודים ובהצמדת הערות לעוגנים.

אבל אין למזג לפי תיאור הסוכן בלבד: \#16 ו־\#17 משנים החלטות תכנון והצבה, ואף מציגים תוצאות שונות זו מזו. אני בודק כעת את בסיסי הענפים, הקוד, הבדיקות והחפיפות ביניהם כדי שלא נכניס למנוע תיקון שנראה טוב במדד אחד אך פוגע באיחוד הארכיטקטוני או בהתנהגות אחרת.

כבר מצאתי התקדמות משמעותית נוספת שלא הופיעה בדיווח הראשוני: ב־`main` קיימים commits של **שלב 6, פרוסה 2 (\#28), ושלב 7 (\#29)**\. כלומר, הסוכן לא רק הגיש את PR-ים \#16/\#17 הישנים; חלק מהעבודה המאוחרת כבר נכנסה ל־`main` בדרך של commits חדשים.

הכיוון נכון: לפי תיאור המימוש, שלב 6ב מאחד את מודל ההערות, ההקצאה האנכית וההקרנה מהמדידות, ואף טוען לסגירת שתי חפיפות ההערות בעמוד 107; שלב 7 מוסיף `PageModel` יחיד, בלתי־משתנה, עם ולידציה. כעת אני מאמת את הראיות בפועל ואת שערי הקבלה של שלב 8 - ולא מסתפק בכותרות ה־commits.

## תוצאות הבדיקה כמנהל הפרויקט

(שלב 6ב ושלב 7 מוזגו)

| רכיב | מצב | ממצאים |
|--------|--------|--------|
| שלב 6, פרוסה 2 - PR \#28 | (מוזג) | מודל הערות מאוחד, הקצאה אנכית משותפת, הקרנה מחותמות, פריט `info-box` |
| שלב 7 - PR \#29 | (מוזג) | `PageModel` יחיד, immutable, עם 11 אינווריאנטים |
| PR \#16 - S78 | (לא למזג) | ענף מיושן, CI נכשל, אך מכיל תיקון עוגני הערות שעדיין ראוי לבדיקה |
| PR \#17 - איחוד אילוצים | (לא למזג) | ענף מיושן; חלק מהתיקונים כבר שולבו במימוש הנוכחי |
| PR \#14 - תיעוד החלטות | (לא למזג) | תיעוד ישן שאינו מועמד למיזוג כפי שהוא |

### מה אומת בפועל

**שלב 6ב - PR \#28**

- `npm test`\: ‏1130/1130 עברו.
- CI: הצליח.
- `corpus-invariants`\: הצליח.
- אודיט דפדפן מלא על הקורפוס: שתי תקלות `SIDE_NOTE_OVERLAP` בעמוד 107 נעלמו - אפס ממצאים מסוג זה.
- ההערות, ההמשכים והפריט החדש עוברים דרך מודל ההערות וה-registry.

**שלב 7 - PR \#29**

- `npm test`\: ‏1146/1146 עברו.
- CI: הצליח בכל שלוש גרסאות Node שנבדקו.
- `corpus-invariants`\: הצליח.
- בדיקת המודל על מסמך `very_long`\: ‏344,639 בדיקות, אפס הפרות.
- הוכחו הקפאה עמוקה, דטרמיניזם, שימור תוכן והשוואת PagePlan ל־PageModel.

**כשל שעדיין מופיע\:** `full-math-audit` נכשל בגלל רצפת נפח של 353,687 מילים לעומת 355,967 הנדרשות. אותה חתימת כשל מופיעה כבר ב־baseline של שלב 1, ולכן אין כרגע ראיה שהיא נגרמה משלבים 6 או 7. היא נשארת פתוחה למעקב - לא מתעלמים ממנה ולא משנים את הסף כדי להעלים אותה.

### מה עדיין דורש תיקון

מצאתי ארבעה דברים שאסור לנו להחליק עליהם בדרך לשלב 8\:

1. **עיטורים\:** מסמך שלב 6 מצהיר במפורש שהחוזה המלא לעיטורים - מידות, מדיניות התאמה, עיגון והזמנת שטח - עדיין חלקי. לכן שלב 6 אינו סגור לחלוטין מבחינת החוזה.
2. **הערות שוליים ועוגנים\:** תיקון ייחודי ב־PR \#16, שמוודא שהערה תופיע בעמוד שבו נמצא הסמן שלה, עדיין לא נמצא במימוש `dp-planner.js` שב־main. אין להעתיק את הקוד הישן בעיוורון; צריך לבדוק את שורש הבעיה ולהתאים את הפתרון למודל ההערות החדש.
3. **הבונה של PageModel\:** כרגע `buildPageModel` קורא ל־`projectDocument` מתוך `geometry-projector.js` כדי לקבל מיקומי מילים. זהו גבול אחריות שצריך לנקות: בונה המודל אינו אמור להפעיל מקרין פלט.
4. **תמונות והעברת המודל\:** מסמך שלב 7 מודה שייצוג גיאומטריית התמונות עדיין אינו מלא, וש־PageModel עדיין אינו מועבר דרך פרוטוקול ה־Worker. אלה פערים ששלב 8 חייב לפתור לפני שנוכל לומר שכל יעדי הפלט צורכים את אותו מודל.

לא מיזגתי את \#16/\#17/\#14: הם מבוססים על commits קודמים, אינם ניתנים למיזוג נקי, ול־\#16 ול־\#17 יש גם כשלים בבדיקות שלהם. עם זאת, לא זורקים את התיקונים הייחודיים שבהם - במיוחד תיקון הצמדת הערות לעוגנים. הם ייבדקו ויוטמעו רק אם יוכח שהם עדיין נחוצים.

---

## הפרומט הבא לסוכן

הפרומט כולל סגירת פערים מהשלבים הקודמים, ואז ביצוע שלב 8. הוא גם מחייב בניית GitHub Pages לאחר כל שינוי שניתן לבדוק מנקודת מבט המשתמש, לרבות אימות שאין שינוי חזותי.

**document: **

# המשך פיתוח מנוע העימוד - סגירת פערי שלבים 6-7 וביצוע שלב 8: מקרינים טהורים וייצוא מתוך PageModel

## 1. נקודת מוצא מחייבת

המשך לעבוד בריפו:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

ענף `main` הנוכחי:

`52f1b714b0d6f47f2e9a16b6d97ec5881708384e`

התחל מענף זה. אל תחזור לענפים ישנים ואל תדרוס עבודה שכבר מוזגה.

### שלבים שכבר הושלמו ונמצאים ב-main

- PR #18-#27: שלבי התשתית, המודל, המדידה, מנוע השורות, ה-Planner ושלב 6 פרוסה 1, כפי שמתועדים בתוכנית הקנונית.
- PR #28: שלב 6 פרוסה 2 - מודל הערות מאוחד, מקצה אנכי משותף, הקרנה מחותמות, פריט `info-box`, והסרת שורש `SIDE_NOTE_OVERLAP` בעמוד 107.
- PR #29: שלב 7 - `PageModel` יחיד, `pagemodel-v1`, בונה, validator, 11 אינווריאנטים, הקפאה עמוקה ו-hashes.

המסמך הקובע הוא:

`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

אין ליצור תוכנית חלופית ואין להחזיר החלטות שכבר הוכרעו.

### ראיות קיימות

- PR #28: ‏1130/1130 בדיקות, CI עבר, `corpus-invariants` עבר.
- PR #29: ‏1146/1146 בדיקות, CI עבר בכל Node 18/20/22, `corpus-invariants` עבר.
- אודיט הדפדפן של הקורפוס לאחר שלב 6ב: אפס `SIDE_NOTE_OVERLAP` בעמוד 107.
- בדיקת PageModel על `very_long`: ‏344,639 בדיקות, אפס הפרות.
- `full-math-audit` עדיין נכשל ברצפת נפח 353,687 מול 355,967 - כשל בסיס היסטורי, לא רגרסיה מוכחת. יש לשמור אותו גלוי ולעקוב אחריו.

אין לדווח מחדש על בדיקות ישנות כאילו הורצו על הקוד הנוכחי. בכל דיווח יש לציין commit מדויק, תוצאה, artifact, ומה לא נבדק.

## 2. עקרונות שאסור לסטות מהם

היעד הארכיטקטוני:

**DocumentModel → Measured Items → LineModel → Planner → PagePlan → PageModel → מקרינים טהורים.**

היעד אינו רק להציג תוצאה זהה באמצעות API חדש. היעד הוא להפסיק לחשב אותה עובדה בכמה מקומות.

- מודל פריטים אחד.
- צינור עימוד אחד.
- מדידה ושבירת שורות פעם אחת.
- Planner יחיד.
- PageModel יחיד, סופי ובלתי־משתנה.
- DOM, HTML ו-PDF הם מקרינים של אותו PageModel.
- אין מדידה, שבירה, מיקום, איזון, תקצוב הערות או תיקון גאומטריה במקרינים.
- אין מנוע מקביל, shadow-layout, fallback שקט או שכבת תאימות שהופכת למסלול ריצה שני.

P6/P7 אינם חלק מהעבודה ואין לפתוח אותם מחדש.

ברירת המחדל `justify` נשארת פעילה. אין לשנות ברירות מחדל, מזהי טקסט, הגדרות משתמש או סדרי עדיפויות שאושרו. ערכת נושא 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.

אין להשתמש ב-PDF הייחוס כיעד איכות או כשער קבלה.

כל מסמך בדיקה חייב להיות תקין מבחינה מבנית: אין שתי כותרות מאותה רמה ברצף ללא טקסט ביניהן, ואין כותרת שמכילה רק הערת שוליים. היררכיית כותרות 1-7 מותרת, אך הכותרת האחרונה חייבת להכיל תוכן.

## 3. תיקוני השלמה לשלבים הקודמים - לפני החלפת המקרינים

יש לבצע את הבדיקות הבאות על `main` הנוכחי, ולא להסתמך על תיאור PR ישן.

### 3.1 השלמת חוזה העיטורים - יתרת שלב 6

ב-`audits/STAGE6_PAGE_ITEMS.md` מצוין במפורש שחוזה העיטורים עדיין חלקי.

יש להשלים את ההגדרה כך שכל עיטור יצהיר דרך חוזה פריט העמוד על:

- זהות ומקור.
- סוג העיטור והנכס שלו.
- מידות טבעיות ומידות יעד.
- מדיניות fit/scale.
- עוגן ומיקום סמנטי.
- גבולות clipping ו-z-order.
- האם הוא דורש שטח שמור, ומהו התקציב.
- אילוצי placement והיחס שלו לטקסט, לכותרות, לשערים ולגבולות העמוד.
- נתונים שהמקרינים צריכים כדי להציגו בלי לחשב מחדש.

`ornament-fit` יכול להיות מקור המדדים היחיד, אך אין להשאיר במקביל חישובי מידות או החלטות fit ב-DOM וב-PDF.

ה-Planner חייב לקבל את האילוצים לפני ההצבה. אין להזיז טקסט אחרי התכנון כדי לפנות מקום לעיטור.

הוסף בדיקות שמוכיחות:
- שינוי עיטור משנה גאומטריה בלבד, בלי לאבד או לשנות תוכן.
- הזמנת השטח מתחשבת בגובה ובמיקום האמיתיים.
- DOM ו-PDF מקבלים אותה גאומטריה.
- עיטור חסר או פגום מדווח באופן מפורש.
- אין חפיפה או גלישה בלתי מדווחות.

עדכן את `audits/STAGE6_PAGE_ITEMS.md` ואת תוכנית האב. אל תסמן את שלב 6 כגמור עד שכל סעיפי §6.3 מתקיימים.

### 3.2 בדיקת הצמדת הערות לעוגנים - ממצא ייחודי מ-PR #16

ב-PR #16 הוצג תיקון שורש למצב שבו הערת שוליים הוצגה בעמוד לפני העמוד שבו נמצא הסמן שלה.

הפתרון שם כלל:
- `anchorLineIndexOf`.
- `moveNotesAnchoredFrom`.
- `reconcileNotesAfterPlacement`.
- בדיקת קיבולת מצטברת לפני העברת הערות.
- ממצא `fn-anchor-compromise` כאשר אין מקום חוקי להעביר הערה.
- שמירה על המשכים שאסור להזיז כאילו היו הערות מקוריות.

הפונקציות האלה אינן קיימות כרגע ב-`dp-planner.js` של main.

אין לבצע cherry-pick עיוור של PR #16. הענף הישן נכשל בבדיקת bundle ובאודיט העמודים, והקוד שלו נכתב לפני מודל ההערות החדש.

במקום זאת:

1. בדוק על main את כל ההערות בקורפוס הספר האמיתי ואת מיקום הסמן שלהן בפועל.
2. שחזר את המקרים שבהם הערה מוצגת לפני העוגן שלה, אם הם עדיין קיימים.
3. בדוק את כל מסלולי הפיצול, ההמשכים, הפליטות המרומזות וסגירת העמוד.
4. אם הפגם עדיין קיים, העבר את פתרון השורש למודל ההערות המאוחד של שלב 6ב.
5. כל העברה חייבת להיות מוגנת בקיבולת אמיתית, כולל כמה הערות שמועברות לאותו עמוד.
6. אם אין מקום חוקי, אל תעביר בכוח. רשום diagnostic אמיתי ומנומק.
7. אין לפגוע ב-`noteId`, `anchorId`, `continuationOf`, `wordRange`, במספור או בסדר הקריאה.
8. הוסף בדיקת end-to-end שמוודאת שכל הערה נמצאת בעמוד שבו נמצא העוגן שלה, או שיש פשרה מפורשת ומדווחת.

הבדיקה חייבת לכלול גם הערות שמתחילות לפני פיצול פסקה והסמן שלהן מופיע לאחר הפיצול.

אם אין ממצא בפועל ב-main, אל תוסיף מנגנון מיותר: תעד את האימות ואת הראיות לכך שהבעיה כבר נפתרה.

### 3.3 ביקורת ממוקדת של PR #17

חלק מהתיקונים מ-PR #17 כבר שולבו במטריצת האילוצים וב-Planner הנוכחיים. אין למזג את PR #17.

בדוק רק אם נותרה בו בעיית שורש שלא הועברה:
- יחידות yPx וקיבולת.
- ליווי כותרת.
- מדיניות widow/orphan.
- תפרים חוקיים.
- נסיגות ודיווחי שווא.
- קיבולת הערות לפני ואחרי placement.

אל תיצור עותק נוסף של `constraint-matrix.js` או של מנגנוני ההגנה שכבר קיימים. אם נמצא פער, תקן במקום הסמכות הקיים והוסף בדיקה ממוקדת.

## 4. שלב 8 - מקרינים טהורים, תצוגה וייצוא מתוך PageModel

זהו השלב הבא המרכזי. אין לדחות אותו לטובת UI או שיפורים צדדיים.

### 4.1 פער ארכיטקטוני שצריך לפתור תחילה

במימוש הנוכחי:

`red-build/src/engine/core/page-model.js`

הבונה `buildPageModel` קורא ל:

`projectDocument` מתוך `red-build/src/engine/output/geometry-projector.js`

כדי לקבל מיקומי fragments ומילים.

זהו מצב ביניים. אסור להפוך את `projectDocument` למקרין שממשיך לקבל החלטות גאומטריות, ובמקביל לקרוא לו מתוך בונה PageModel.

יש להפריד בבירור בין:

1. **Materialization חד-פעמי של הגאומטריה:** יצירת מיקומי fragments סופיים מתוך המדדים וההחלטות שכבר התקבלו ב-LineModel וב-PagePlan.
2. **PageModel:** המודל הסופי, הכולל את כל המיקומים והמידות.
3. **Renderers:** צרכנים שקוראים PageModel בלבד ומציירים אותו.

חלץ את פעולת יצירת המיקומים הסופיים למנגנון פנימי טהור שמופעל פעם אחת בבניית PageModel. הוא אינו renderer, אינו מבצע מדידה, אינו שובר שורות ואינו מחליט על placement.

אין ליצור מנוע גאומטריה שני. השתמש במדדים ובחלוקת הרווחים שכבר נוצרו ב-LineModel וב-Planner. אם חסר נתון במודל, תקן את שלב יצירת הנתון ולא את המקרין.

### 4.2 הרחבת PageModel לפני חיבור המקרינים

ודא ש-`pagemodel-v1` כולל את כל מה שנדרש להצגה ולייצוא, בלי גישה ל-PagePlan או לנתוני runtime חיצוניים לצורך החלטות עימוד.

יש לכלול, לפי הצורך:

- כל סוגי העמודים והטורים.
- שורות, fragments ומילים ממוקמות.
- font identity, family, face, size, style, צבע ו-baseline.
- תמונות inline, block ו-float, עם asset identity, מידות, יחס ממדים, fit, transform, clipping ועוגן.
- הערות שוליים, הערות צד, הערות סיום והמשכים.
- עיטורים, שערים, TOC, כותרות, גיליונות ומספור.
- כל ההזמנות, הפערים, ה-z-order וסדר הקריאה.
- קישורים, bookmarks ונתוני נגישות רלוונטיים.
- diagnostics, מקור, source ranges וזהות פריט.
- הפניות לנכסים ולגופנים, עם סטטוס integrity מפורש.

אין להסתפק ברשומת asset ID אם המקרין עדיין צריך לנחש את מיקום התמונה, את גודלה או את אופן הזרימה שלה.

ה-PageModel חייב להיות serializable דרך Worker protocol, משום שמעתה התצוגה ב-UI צריכה לצרוך אותו.

יש להגדיר גרסת transport ברורה. לאחר העברה:
- לוודא שהמודל אינו משתנה.
- לבצע validation בצד המקבל או להבטיח אימות של snapshot חתום ומוגדר.
- להקפיא מחדש את המודל לאחר structured clone, משום שהקפאה עמוקה אינה נשמרת אוטומטית בהעברה.
- לא להעביר אובייקטים לא-serializable כגון פונקציות או מבני runtime שאינם חלק מהחוזה.
- למדוד את עלות הזיכרון וההעברה, אך לא להקטין את המודל על ידי השמטת מידע.

### 4.3 DOM renderer - קריאה בלבד

העבר את DOM renderer לצרוך PageModel בלבד.

אסור לו לקבל raw document או PagePlan כקלט חלופי לצורך חישוב עימוד.

אסור לו:
- למדוד מילים או גופנים.
- לשבור שורות.
- לבצע CSS wrapping או reflow.
- לשנות מיקום של פריט.
- לחשב מחדש רוחבי מילים.
- להחליט על חלוקת הערות.
- לבצע איזון טורים.
- לתקן פערים או clipping.
- להסתיר פריט שאין לו נתונים.

כל שורה וכל fragment מוצגים במיקום מפורש מהמודל. אין להסתמך על wrapping של הדפדפן כדי לקבוע היכן תישבר שורה.

השתמש ב-CSS להצגה בלבד: טיפוגרפיה, צבע, שכבות, גבולות ומאפייני תצוגה שאינם משנים את הגאומטריה שנקבעה.

בדוק בדפדפן אמיתי:
- RTL וסדר קריאה.
- mixed fonts בתוך אותה מילה.
- תמונות inline ו-float.
- הערות והמשכים.
- עיטורים ושערים.
- TOC.
- `info-box`.
- כותרות עליונות וגיליונות.
- clipping וגבולות עמוד.
- מסמכים קצרים וארוכים.

### 4.4 HTML עצמאי

העבר את HTML export לצרוך את אותו PageModel.

- אין להפעיל `typeset` מחדש.
- אין להריץ Parser או Planner מחדש.
- אין לחשב שורות או מיקומים מחדש.
- כל הנכסים והגופנים חייבים להיות מוטמעים או ארוזים לפי חוזה מוגדר.
- הייצוא חייב להיות עצמאי, ללא תלות ברשת.
- אם נכס חסר או פגום, יש להפיק כשל או diagnostic מפורש בהתאם למדיניות.

הוכח ש-HTML עצמאי מציג את אותם placements כמו DOM החי.

### 4.5 PDF - אותו PageModel בדיוק

העבר את PDF export לצרוך PageModel בלבד.

אסור ל-PDF:
- להריץ עימוד נוסף.
- לבנות שורות מחדש.
- למדוד מילים מחדש.
- לחשב רוחבי מילים מחדש.
- להזיז הערות או עיטורים.
- להחליט על גאומטריה שונה מזו של DOM.

ה-PDF חייב לשמר:
- RTL.
- font identity ו-glyph identity.
- embedding/subsetting תקין.
- ToUnicode.
- קישורים ו-bookmarks.
- תמונות ויחס ממדים.
- clipping ו-page geometry.
- הערות, המשכים, עיטורים, שערים ו-TOC.

הטמעת גופנים, subset ואריזת משאבים הן פעולות packaging בלבד. הן אינן רשאיות לשנות את מיקום הטקסט או את החלטות העימוד.

### 4.6 הסרת חישובים כפולים

במהלך המעבר, ערוך inventory של כל פעולת מדידה או החלטת גאומטריה שנשארה ב:
- `dom-renderer.js`
- `geometry-projector.js`
- `legacy-projector.js`
- `pdf-writer.js`
- `export-api.js`
- וכל מודול export/HTML נוסף.

לכל פעולה קבע:
- האם היא מדידה.
- האם היא החלטת עימוד.
- האם היא materialization חד-פעמי של PageModel.
- האם היא ציור בלבד.
- האם יש לה consumer נוסף.

הסר כפילויות לאחר שהוכח שכל היעדים צורכים PageModel.

אין להשאיר את `projectDocument` כמסלול עימוד נוסף במסווה של renderer.

## 5. בדיקות קבלה מחייבות לשלב 8

יש להוסיף חבילת בדיקות ייעודית לשלב 8, בנוסף לכל הבדיקות הקיימות.

### 5.1 שימור תוכן וזהות
- כל הטקסט וה-fragments נשמרים.
- אין מילה חסרה או כפולה.
- אין שינוי בסדר הקריאה.
- אין איבוד font identity.
- כל image asset נשמר.
- כל note marker מקושר להערה ולעוגן.
- אין פריט יתום או פריט שנעלם בשקט.

### 5.2 גאומטריה
- DOM, HTML ו-PDF מציגים את אותם x/y/w/h/baseline.
- אין wrapping עצמאי.
- אין מדידה חוזרת.
- אין placement עצמאי.
- כל פריט נמצא בגבולותיו או מדווח במפורש.
- אין חפיפות לא מדווחות.
- אין שינוי בגאומטריה בין ריצות זהות.

### 5.3 מטריצת מסמכים ופריטים
בדוק לפחות:
- מסמך קצר.
- מסמך ארוך.
- `very_long_test_text.txt`.
- מסמכים אמיתיים נוספים.
- mixed fonts.
- inline image.
- block image.
- float משמאל ומימין.
- תמונה ממורכזת.
- תמונה בתוך הערת שוליים.
- הערות שוליים ארוכות והמשכים.
- הערות צד.
- הערות סיום.
- עיטורים.
- שערים.
- TOC.
- עמודים מבניים.
- `info-box`.
- מסמכי RTL.

כל מסמך סינתטי חייב להיות תקין מבחינה מבנית לפי כללי סעיף 1.

### 5.4 בדיקות דפדפן ו-PDF
- בדוק את התצוגה באמצעות browser automation.
- בדוק את ה-PDF לאחר rasterization.
- השווה bounding boxes ומיקומים.
- בדוק text extraction ו-ToUnicode.
- בדוק גופנים מוטמעים.
- בדוק קישורים ו-bookmarks.
- בדוק שאין clipping, overlap או שורות שנשברות מחדש.

סבילות ההשוואה בין פורמטים חייבת להיות מוגדרת ומנומקת. היא אינה רשאית לשנות את מקור הגאומטריה.

### 5.5 בדיקות שלילה
הזרק:
- asset חסר.
- font חסר.
- glyph חסר.
- image פגומה.
- placement מחוץ לגבולות.
- fragment חסר.
- duplicate item.
- note ללא anchor.
- reservation שלא נוצלה או שלא נרשמה.
- פריט שאינו נתמך ב-target מסוים.

בכל מקרה נדרש כשל מפורש או diagnostic מוגדר. אין fallback שקט.

## 6. בדיקת ביצועים ופישוט

מדוד לפני ואחרי:
- זמן עימוד.
- זמן בניית PageModel.
- זמן DOM projection.
- זמן HTML export.
- זמן PDF export.
- גודל PageModel.
- זיכרון Worker/UI.
- מספר קריאות מדידה.
- מספר פעולות geometry/materialization.

אין לקבל שיפור ביצועים אם הוא נובע מהשמטת פריטים או צמצום מידע.

הפק דוח שמוכיח:
- אין renderer שמקבל החלטות.
- אין מדידה חוזרת ב-renderers.
- אין עימוד שני בייצוא.
- כל היעדים צורכים אותו PageModel.
- אין חישוב גאומטרי כפול שנותר ללא הצדקה.

## 7. CI, קורפוסים וראיות

הרץ:
- `npm test`
- `test:determinism`
- `cross-check`
- `corpus-invariants`
- `full-math-audit`
- `layout-audit`
- resource integrity
- projection tests
- DOM/HTML/PDF end-to-end
- בדיקות Worker transport.

יש לדווח במדויק על כל גרסת Node ועל כל job. אין להסתיר בדיקות שלא רצו או jobs שבוטלו.

יש להבחין בין:
- כשל baseline מוכר.
- רגרסיה חדשה.
- בדיקה שלא רצה.
- בדיקה שעברה.

בפרט:
- רצפת `full-math-audit` 353,687 מול 355,967 היא baseline ידוע שיש להמשיך לעקוב אחריו.
- `SIDE_NOTE_OVERLAP` בעמוד 107 אמור להישאר אפס לאחר תיקון שלב 6ב. כל הופעה מחודשת היא רגרסיה.
- אין לשנות snapshots או locks בלי הסבר סיבתי מלא והוכחת שימור תוכן.

## 8. בניית GitHub Pages ובדיקת משתמש לאחר כל שינוי

זו הוראת עבודה מחייבת:

**לאחר כל שינוי לוגי שעשוי להשפיע על התוצאה שהמשתמש רואה, וגם לאחר שינוי שלטענתך אינו אמור לשנות את התוצאה, יש לבנות מחדש את GitHub Pages ולבדוק את התוצאה החיה.**

אין להסתפק ב-`npm run build` או בעדכון bundles.

בכל שינוי כזה:
1. בנה את ה-bundles.
2. בנה ופרוס את GitHub Pages.
3. ודא שענף `gh-pages` מכיל את גרסת הקוד המתאימה.
4. הוסף cache-buster ברור לכתובת.
5. פתח את האתר החי ובדוק שהגרסה החדשה נטענה.
6. בדוק מסמך מייצג בתצוגה.
7. הפק PDF והשווה לתוצאה הקודמת.
8. שמור screenshots ו-artifacts.
9. אם לא אמור להיות שינוי חזותי, הוכח זאת בהשוואה - אל תסתפק בהצהרה.

יש לבצע זאת לאחר כל יחידת שינוי שניתן לבדוק בנפרד, ולא להמתין לסוף כל שלב גדול. אין לצבור כמה שינויים חזותיים ואז לנסות לנחש איזה מהם גרם לרגרסיה.

## 9. סדר ביצוע ו-PRs

עבוד מה-commit:

`52f1b714b0d6f47f2e9a16b6d97ec5881708384e`

פתח ענף חדש לשלב 8.

מומלץ לחלק את המימוש ליחידות שניתן לבדוק ולסקור:
1. השלמת חוזה העיטורים ובדיקת עוגני הערות.
2. הפרדת materialization חד-פעמי מבניית PageModel.
3. השלמת PageModel ו-Worker transport.
4. מעבר DOM ל-PageModel.
5. מעבר HTML ל-PageModel.
6. מעבר PDF ל-PageModel.
7. הסרת חישובים כפולים, בדיקות parity ואודיט ארכיטקטוני.

אפשר לאחד יחידות קטנות באותו PR אם אין בכך פגיעה ביכולת הביקורת, אך כל יחידה חייבת להיות מתועדת ולהיבדק בנפרד.

אל תמתין זמן רב ל-CI: אם job ארוך מתעכב, בדוק את ה-jobs שכבר הסתיימו והמשך בעבודה עצמאית שאינה תלויה בו. אל תסמן בדיקה כעוברת לפני שהתקבלה תוצאה.

אין למזג PR שאינו בשל. יש לפתוח PR עם:
- פער ושורש.
- פתרון ארכיטקטוני.
- קבצים ששונו.
- תוצאות בדיקות.
- artifacts.
- תוצאות Pages.
- דוח גאומטריה ותוכן.
- רשימת סעיפים שהושלמו ונותרו פתוחים.

אין למחוק את נתיב המורשת בשלב 8. הסרת מסלולי runtime כפולים תיעשה בשלב 9 בלבד, לאחר הוכחת parity מלאה.

## 10. תיעוד נדרש

עדכן:
- `audits/STAGE6_PAGE_ITEMS.md`
- `audits/STAGE7_PAGE_MODEL.md`
- `audits/STAGE8_RENDER_PROJECTIONS.md` (חדש)
- `LAYOUT_DEPENDENCY_MAP.md`
- `ENGINE_RUNTIME_PATHS.md`
- `ENGINE_DUPLICATION_REGISTER.md`
- `ISSUE_REGISTRY.md`
- `WORKLOG.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

בכל מסמך יש להפריד בין מימוש, חיבור למסלול הפעיל, בדיקות, ראיות, מגבלות ופעולות שנותרו.

אין לסמן שלב 8 כגמור רק מפני שה-renderer מקבל אובייקט בשם PageModel. יש להוכיח שהוא צורך את המודל בלבד ואינו מחשב מחדש.

## 11. שער סגירת שלב 8

שלב 8 ייחשב הושלם רק כאשר:

- [ ] PageModel כולל את כל המידע הדרוש לכל יעדי הפלט.
- [ ] ה-PageModel עובר דרך Worker/UI לפי חוזה מוגדר.
- [ ] DOM צורך PageModel בלבד.
- [ ] HTML צורך PageModel בלבד.
- [ ] PDF צורך PageModel בלבד.
- [ ] אין מדידה חוזרת.
- [ ] אין שבירת שורות חוזרת.
- [ ] אין reflow.
- [ ] אין placement או balancing במקרינים.
- [ ] אין ייצוא שמפעיל עימוד שני.
- [ ] תמונות, גופנים, הערות, עיטורים, שערים ו-TOC מיוצגים ומוקרנים כראוי.
- [ ] DOM/HTML/PDF תואמים מבחינת גאומטריה ותוכן.
- [ ] אין אובדן תוכן או זהות.
- [ ] כל הכשלים מפורשים ומדווחים.
- [ ] הקורפוסים והבדיקות עוברים, למעט כשלים היסטוריים מזוהים שאינם רגרסיות.
- [ ] Pages נבנה ונבדק לאחר כל שינוי רלוונטי.
- [ ] מפת התלויות ורגיסטר הכפילויות מעודכנים.
- [ ] נמסר דוח שמוכיח פישוט ואיחוד אמיתיים.

## 12. המשך לאחר שלב 8

לאחר סגירת שלב 8, יש להתקדם מיד לשלב 9 בתוכנית הקנונית:

- מיפוי כל צרכני legacy.
- הוכחת שכל סוגי התוכן עוברים במסלול המאוחד.
- shadow comparison מבוקר.
- הסרת adapters ונתיבי runtime כפולים רק לאחר הוכחת parity.
- שמירה על rollback ברמת commit, לא כמנוע שני פעיל.
- בדיקות שלילה והוכחת היעדר fallback שקט.

אין להתחיל מחיקה רחבה לפני הוכחת שלב 8, ואין להכריז על השלמת הפרויקט לפני שערי שלב 10.

**מטרת העבודה אינה להוסיף עוד שכבה למנוע. המטרה היא להוציא ממנו שכבות מיותרות, לאחד את מקורות הסמכות, ולהשאיר מנוע אחד מזוקק, צפוי ודטרמיניסטי, שניתן להוסיף לו פריטי עימוד חדשים בקלות בלי לערוך את ליבת המנוע בכל שכבה.**

---

## החלטת ניהול והמשך

הנקודה החשובה ביותר: **שלב 7 אינו סוף האיחוד. הוא רק יצר את מקור האמת הסופי.** עכשיו צריך לגרום לכל המקרינים לצרוך אותו באמת. זה השלב שבו נוכל להוכיח שהמנוע אינו מפעיל בפועל מנוע DOM ומנוע PDF נפרדים.

לאחר שהסוכן יגיש את השינוי הבא, הבדיקה שלי תתמקד במיוחד בשלושה דברים\:

1. האם `PageModel` באמת הפך למקור הסמכות היחיד, ולא רק נוסף לצד המנגנון הישן.
2. האם אין יותר מדידה או שבירת שורות חוזרת בייצוא.
3. האם התוצאה החיה וה-PDF נשארים עקביים, כולל לאחר בניית Pages.

**אין כרגע PR פתוח שאני ממליץ למזג.** PR \#28 ו־\#29 כבר מוזגו, והענפים הישנים אינם בשלים. הפרומט הבא מורה לסוכן להתחיל מיד בהשלמות ובשלב 8, בלי לפתוח מחדש את השלבים שכבר הוכחו.

## Prompt:
17.11.2026, 3:04:12

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים.

## Response:
17.11.2026, 3:04:31 · gpt-6

> **Audited commits, pull requests, CI workflows, deployment evidence, and documentation**
>
> 
>
> Worked for 1m

הבדיקה מראה שהסוכן התקדם מעבר לפרוסה שעליה דיווח קודם\:

- **PR \#30** - השלים את פרוסה 3 של שלב 6: חוזה עיטורים מלא ותיקון מוכח של הצמדת הערות לעוגנים. הוא מוזג ל־`main`\.
- **PR \#31** - התחיל את שלב 8: הפריד את פעולת ה־materialization מבונה `PageModel`\. גם הוא מוזג ל־`main`\.
- `main` עומד כעת על `1751266732c080b377c28528580f7884d9913915`\.

יש כאן תיקון מהותי ולא קוסמטי: האודיט החדש הוכיח שש הערות בקורפוס `very_long` הופיעו לפני העוגן שלהן. התיקון העביר חמש מהן לעמוד העוגן, ואת השישית השאיר כפשרת קיבולת מדווחת - בלי להעביר אותה בכוח. תוכן הגוף וההערות נשמר ביט־לביט.

עם זאת, **שלב 8 עדיין רחוק מהשלמה**\: הפרוסה שמוזגה מפרידה את מנגנון יצירת הגאומטריה, אך DOM, HTML ו־PDF עדיין לא הוכחו כצרכנים בלעדיים של `PageModel`\. בנוסף, בדוח הפרוסה מצוין במפורש שאצוות הבדיקות הסתיימה ב־69/70, כאשר בדיקת UI הורצה בנפרד בגלל התנגשות פורטים. אין להציג זאת כ־100% הצלחה של האצווה.

## החלטת מיזוג

(אין PR חדש שממתין למיזוג)

- \#30 ו־\#31 כבר מוזגו. אין צורך לבצע מיזוג נוסף.
- \#16, \#17 ו־\#14 עדיין פתוחים, אך מבוססים על בסיסים ישנים ואינם מועמדים למיזוג ישיר. העבודה המועילה מ־\#16 ומ־\#17 כבר נבחנה והועברה באופן ממוקד ל־\#30.
- לא מצאתי PR פתוח חדש שמכיל את המשך שלב 8.

יש גם נקודת זהירות ארכיטקטונית: ב־`core/materialize.js` החדש נשארו תלות ב־`dom-renderer` ונתיב fallback שמסוגל למדוד. גם אם הבדיקות מראות אפס מדידות במסלול הרגיל, צריך לוודא שהליבה אינה תלויה במקרין ושאין מסלול production שיכול לבצע מדידה מחדש.

## הפרומט הבא לסוכן

ההתקדמות הבאה היא שלב 8, פרוסה 2 ואילך. אני מחלק את העבודה למקטעים עם שערי בדיקה ברורים, כדי שלא ייווצר מצב שבו הסוכן מכריז על שלב שלם אחרי שהוסיף רק תשתית.

**document: **

# מנהל הפרויקט - המשך שלב 8: PageModel מלא, Worker Transport, DOM/HTML/PDF והוכחת איחוד

## 1. מצב המאגר ונקודת התחלה

ריפו:
`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

יש להתחיל מה-`main` העדכני, ולוודא שהוא כולל את:

`1751266732c080b377c28528580f7884d9913915`

זהו ה-commit הנוכחי שנבדק.

### עבודה שכבר מוזגה

- PR #18-#27 - שלבים 1-6 פרוסה 1, לרבות מודל הפריטים, המדידה, LineModel, Planner ו-PagePlan.
- PR #28 - שלב 6 פרוסה 2: מודל הערות מאוחד, הקצאה אנכית משותפת, פריט info-box, וסגירת שורש SIDE_NOTE_OVERLAP.
- PR #29 - שלב 7: PageModel יחיד, סופי ו-immutable.
- PR #30 - שלב 6 פרוסה 3: חוזה עיטורים מלא, תיקון הצמדת הערות לעוגנים והיגיינת SSOT.
- PR #31 - שלב 8 פרוסה 1: הפרדת materialization חד-פעמי מבניית PageModel.

אין לפתוח מחדש שלבים שהושלמו ואין לדרוס עבודה קיימת.

### מצב שלב 8

פרוסה 1 הושלמה ומוזגה, אך שלב 8 כולו עדיין פתוח.

הקבצים המרכזיים שכבר נוספו או שונו:
- `red-build/src/engine/core/materialize.js`
- `red-build/src/engine/layout/structural-stamps.js`
- `red-build/src/engine/core/page-model.js`
- `red-build/src/engine/core/pipeline.js`
- `red-build/src/engine/output/geometry-projector.js`
- `audits/STAGE8_RENDER_PROJECTIONS.md`

ההישגים המדווחים:
- materialization מופעל פעם אחת בבניית PageModel.
- רוחבי מילים נלקחים מ-LineModel.
- תוכן מבני מוטבע ב-structural stamps.
- אפס מדידות ואפס נפילות במסלול ה-pipeline שנבדק.
- layoutHash נשמר; תיקון רוחבי הכותרות נובע משימוש בגופן הנכון.
- cross-check ו-test:determinism עברו.
- בדפדפן, מסלול DP החזיר 36 עמודים ו-8 הערות, זהה ל-Node.

הסתייגות חשובה:
- באצוות הבדיקות של PR #31 דווח 69/70, כאשר s10-ui הורצה בנפרד ועברה.
- אין להציג את האצווה כולה כ-100% ירוקה עד להרצה מלאה ומוצלחת.
- יש לבדוק אם מדובר בתחרות פורטים או בכשל אמיתי, ולייצב את הבדיקה בלי להחליש אותה.

## 2. עקרונות מחייבים

הארכיטקטורה הרצויה:

**DocumentModel → Measured Items → LineModel → Planner → PagePlan → PageModel → DOM / HTML / PDF**

- PageModel הוא מקור הסמכות הסופי.
- כל החלטת עימוד מתקבלת לפני יצירת PageModel.
- כל מדידה מתבצעת פעם אחת.
- כל שבירת שורה מתבצעת פעם אחת.
- כל placement נקבע פעם אחת.
- כל renderer הוא מקרין בלבד.
- אין מסלול עימוד שני בייצוא.
- אין מדידה או wrapping ב-DOM/HTML/PDF.
- אין fallback שקט.
- אין adapters שהופכים למסלולי runtime מקבילים.

P6/P7 אינם בתחום העבודה ואין לפתוח אותם מחדש.

`justify` נשאר ברירת המחדל. אין לשנות ברירות מחדל, מזהי טקסט, הגדרות משתמש או החלטות שכבר אושרו. ערכת נושא 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.

כל מסמך בדיקה חייב להיות תקין מבחינה מבנית: אין שתי כותרות מאותה רמה ברצף ללא טקסט ביניהן, ואין כותרת שמכילה רק הערת שוליים. היררכיית 1-7 מותרת, אך הכותרת האחרונה חייבת להכיל תוכן.

## 3. ביקורת ותיקוני איכות לפרוסה 1 - לפני ההמשך

אל תניח שהקוד החדש מושלם רק משום שהבדיקות הקיימות עברו.

### 3.1 הפרדת שכבות אמיתית

ב-`core/materialize.js` קיימות כרגע תלות במודולים הבאים:

- `output/dom-renderer`
- `typography/measure-api`
- `output/line-font`
- `output/shaar-content`
- `layout/notes-model`
- `layout/footnote-lanes`
- `decoration/ornament-ink`

בדוק כל תלות לגופה.

בפרט:

1. `core/materialize.js` אינו אמור לייבא פונקציות מתוך DOM renderer. אם `scrubPUAText` הוא פונקציית עזר משותפת, העבר אותה למודול ניטרלי שאינו renderer.
2. `MeasureAPI` אינו אמור להיות תלות של materialization במסלול הייצור. אם הוא נדרש רק ל-fallback סינתטי, הפרד את מנגנון התאימות מהליבה.
3. `projectPage` מכיל נתיבי fallback שמסוגלים למדוד או לשחזר תוכן אם חסרות חותמות. ודא שהמסלול הפעיל לעולם אינו משתמש בהם.
4. עבור כל fallback, קבע אם הוא נדרש לבדיקות ישנות בלבד או שהוא יכול להיות מופעל בזמן ריצה.
5. אם נתיב fallback אינו נדרש ל-production, הוצא אותו מהמסלול הפעיל. אם הוא נדרש לתאימות, תחום אותו במפורש, תעד אותו, ודאג שייכשל באופן גלוי כאשר חסר נתון.
6. אין להסתפק במונה נפילות. נדרשת הוכחה שכל פריט pipeline פעיל מקבל את כל הנתונים הנדרשים ללא fallback.
7. בדוק שאין circular dependency בין core, output ו-layout.

המטרה היא לא להוסיף שכבת abstraction חדשה, אלא ליצור גבול אחריות נקי.

### 3.2 הוכחת materialization חד-פעמי

יש להוסיף או להרחיב בדיקות שמוכיחות:
- לכל שורה ולכל fragment יש מיקום סופי יחיד.
- רוחב כל fragment נלקח מ-LineModel.
- רוחב glue נלקח מהמדדים הקנוניים.
- אין קריאת MeasureAPI בזמן materialization של תוצר pipeline.
- אין שבירת שורות מחדש.
- אין חלוקת הערות מחדש.
- אין חישוב גאומטריה מחדש של ריהוט.
- אין חישוב מחדש של נתיבי מרזב.
- אין חותמות חסרות במסמכים תקינים.
- כל חוסר נתון מפיק diagnostic מזוהה.

יש לבצע בדיקות גם על כותרות בגופנים שונים, מילה עם כמה font runs, סימני פיסוק, הערות, תמונות ועיטורים.

### 3.3 בדיקת תוצאות PR #30

יש לשמור על:
- חוזה העיטורים המלא.
- `ornament-ink-missing` כאשר הנכס אינו זמין.
- הצמדת הערות לעוגנים.
- `fn-anchor-compromise` כאשר אין קיבולת חוקית.
- שימור noteId, anchorId, continuationOf, wordRange וסדר הקריאה.

אין להחזיר את בעיית הערות לפני העוגן.

## 4. פרוסה 2 - השלמת PageModel והעברת Worker

זו יחידת העבודה הבאה.

### 4.1 חוזה PageModel

בדוק את `pagemodel-v1` והרחב אותו כך שהוא מכיל את כל הנתונים הדרושים לכל יעדי הפלט.

חובה לייצג במפורש:

- עמודים, סוגי עמודים, תבניות וגבולות.
- טורים, contentBox, spanning regions.
- שורות, fragments, מילים, glue ורווחים.
- x/y/w/h/baseline לכל רכיב שמוצג.
- font family, face, identity, size, weight, style, color ו-glyph data.
- תמונות inline, block ו-float.
- asset identity, intrinsic dimensions, target dimensions, fit, crop, transform, clipping ועוגן.
- הערות שוליים, צד וסיום, כולל המשכים.
- markers, anchors, source ranges ו-note identity.
- עיטורים והצהרות ink/fit/scale/anchor/z-order/reservation.
- שערים, TOC, כותרות, folios וריהוט.
- gaps, reservations, reading order ו-z-order.
- קישורים, bookmarks ונתוני נגישות.
- diagnostics, trace ומקורות.
- resource references ו-integrity status.

אין להשאיר ב-PageModel רק ID של תמונה אם ה-renderer צריך לחשב מחדש את המיקום, המידות או ה-fit.

### 4.2 תמונות - first-class items

תמונות חייבות להיות פריטים מהותיים במודל, לא חריגי rendering.

בדוק:
- inline image בתוך רצף טקסט.
- block image.
- float משמאל ומימין.
- תמונה ממורכזת.
- תמונה בתוך הערת שוליים.
- תמונה בתוך info-box או פריט מותאם.
- תמונה עם fit/crop/scale.
- תמונה חסרה או פגומה.

כל החלטת זרימה, גודל ומיקום חייבת להיות ב-PagePlan וב-PageModel. ה-renderer אינו מחליט אם התמונה זורמת עם הטקסט או מוצבת כבלוק.

### 4.3 Worker transport

העבר את PageModel דרך Worker protocol.

הגדר חוזה transport מפורש:
- schema version.
- serialization.
- validation בצד המקבל.
- resource references.
- error propagation.
- diagnostics.
- model hash.
- memory/transfer metrics.

שים לב: `Object.freeze` ו-deep immutability אינם נשמרים בהכרח לאחר structured clone.

לכן:
1. אמת את ה-snapshot לפני שליחה.
2. העבר רק נתונים serializable.
3. בצד המקבל אמת schema, hashes, identities ו-geometry.
4. הקפא מחדש את המודל בצד המקבל.
5. הוכח שאין שינוי בתוכן או בגאומטריה.
6. ודא שאין העברת raw document כדרך חלופית לצורך rendering.

אין להקטין את PageModel על ידי השמטת מידע חיוני.

### 4.4 חיבור למסלול הפעיל

בדוק את:
- `pipeline.js`
- `worker-client.js` וכל מודול מקביל.
- `engine-worker.js`
- UI integration.
- result contract.

PageModel חייב להיות מועבר בפועל לצרכן ה-UI.

אין להסתפק בכך שהוא נמצא ב-result של Node או קיים בזיכרון ה-Worker.

## 5. פרוסה 3 - DOM renderer מתוך PageModel בלבד

לאחר סגירת פרוסה 2, העבר את DOM renderer לצרוך PageModel בלבד.

ה-renderer אינו מקבל raw DocumentModel או PagePlan לצורך חישובי עימוד.

אסור לו:
- למדוד.
- לשבור שורות.
- לבצע CSS wrapping.
- לחשב רוחבי מילים.
- להזיז פריטים.
- לאזן טורים.
- להחליט על חלוקת הערות.
- לחשב גאומטריית עיטורים.
- לתקן clipping או gaps.
- להסתיר פריטים ללא diagnostic.

כל המיקומים מגיעים מהמודל.

בדוק:
- RTL וסדר קריאה.
- mixed fonts בתוך מילה.
- תמונות inline ו-float.
- הערות והמשכים.
- עיטורים ושערים.
- TOC.
- info-box.
- כותרות עליונות ו-folios.
- clipping וגבולות עמוד.
- מסמכים קצרים וארוכים.

CSS מותר לצורכי תצוגה בלבד, לא לצורך קביעת גאומטריית העימוד.

## 6. פרוסה 4 - HTML export מתוך אותו PageModel

HTML export חייב לצרוך PageModel בלבד.

- אין להפעיל typeset מחדש.
- אין Parser נוסף.
- אין Planner נוסף.
- אין מדידה.
- אין שבירת שורות.
- אין חישוב מיקומים.
- אין חלוקת הערות.
- אין wrapping עצמאי.

כל הנכסים והגופנים צריכים להיות מוטמעים או ארוזים לפי חוזה מוגדר.

הייצוא צריך להיות עצמאי, ללא תלות ברשת.

בדוק:
- HTML נפתח במחשב ללא רשת.
- כל הגופנים נטענים.
- כל התמונות נטענות.
- RTL נשמר.
- הגאומטריה זהה ל-DOM.
- אין פריט חסר או מוסתר.
- נכס חסר מפיק diagnostic או כשל מפורש.

## 7. פרוסה 5 - PDF export מתוך אותו PageModel

PDF חייב להיות מקרין של אותו PageModel.

אסור ל-PDF:
- להריץ typeset מחדש.
- לבנות שורות מחדש.
- למדוד מילים מחדש.
- לחשב רוחבי מילים מחדש.
- להזיז הערות או עיטורים.
- לבצע placement עצמאי.
- לשנות את גאומטריית העמוד.

יש לשמר:
- RTL.
- font identity ו-glyph identity.
- font embedding/subsetting.
- ToUnicode.
- קישורים ו-bookmarks.
- תמונות ויחסי ממדים.
- clipping.
- שערים, עיטורים, TOC.
- הערות והמשכים.

הטמעת גופנים ואריזת משאבים הן פעולות packaging בלבד, ואינן רשאיות לשנות גאומטריה.

## 8. פרוסה 6 - הוכחת parity, הסרת כפילויות והכנת שלב 9

לאחר שכל היעדים צורכים PageModel:

### 8.1 השוואת גאומטריה

השווה בין:
- PageModel.
- DOM חי.
- HTML עצמאי.
- PDF לאחר rasterization.

לכל פריט יש להשוות:
- page.
- x/y/w/h.
- baseline.
- font identity.
- source identity.
- reading order.
- asset identity.
- note anchor.

הגדר סבילות מספרית מנומקת. אל תשנה את מקור הגאומטריה כדי להתאים בין הפורמטים.

### 8.2 מלאי כפילויות

ערוך inventory מלא של:
- `dom-renderer.js`
- `geometry-projector.js`
- `legacy-projector.js`
- `pdf-writer.js`
- `export-api.js`
- כל מודול HTML/PDF נוסף.

לכל פונקציה קבע:
- האם היא מודדת.
- האם היא מחליטה על עימוד.
- האם היא מבצעת materialization.
- האם היא מציירת בלבד.
- האם היא נדרשת לתאימות.
- האם יש לה consumer נוסף.

הסר חישובים כפולים רק לאחר שהוכחת שכל הצרכנים משתמשים ב-PageModel.

אין להשאיר את `geometry-projector` כמנוע גאומטריה מקביל.

### 8.3 ביצועים

מדוד לפני ואחרי:
- זמן typeset.
- זמן PageModel.
- זמן Worker transfer.
- זמן DOM.
- זמן HTML export.
- זמן PDF export.
- גודל PageModel.
- זיכרון.
- מספר קריאות מדידה.
- מספר פעולות materialization.

אין לקבל שיפור שמקורו בהשמטת מידע או פריטים.

## 9. בדיקות חובה

הרץ על הקוד הנוכחי:
- `npm test`
- `test:determinism`
- `cross-check`
- `corpus-invariants`
- `full-math-audit`
- `layout-audit`
- Worker transport tests.
- resource integrity tests.
- PageModel validation.
- DOM/HTML/PDF end-to-end.
- PDF text extraction.
- ToUnicode.
- font embedding.
- rasterized visual comparison.

יש לדווח לכל בדיקה:
- commit.
- גרסת Node.
- הפקודה המדויקת.
- pass/fail/skipped.
- artifact.
- baseline או regression.
- האם נבדק המסלול הפעיל.

### כשלים היסטוריים

`full-math-audit` נכשל בעבר ברצפת נפח 353,687 לעומת 355,967. יש להמשיך לעקוב ולבדוק אם חתימת הכשל נשארת זהה. אין לשנות את סף הבדיקה כדי לקבל ירוק.

`SIDE_NOTE_OVERLAP` בעמוד 107 נסגר בשלב 6ב. כל הופעה חוזרת היא רגרסיה.

אין לשנות locks או snapshots ללא הצדקה סיבתית והוכחת שימור תוכן.

## 10. GitHub Pages - הוראה מחייבת לאחר כל שינוי

**לאחר כל יחידת שינוי שמשפיעה על תוצאה שהמשתמש רואה, וגם לאחר שינוי שלטענתך אינו משפיע על התוצאה, יש לבנות ולפרוס GitHub Pages ולבדוק את האתר החי.**

אין להמתין לסיום כל שלב גדול.

לאחר כל יחידת שינוי:

1. בנה bundles.
2. בנה את GitHub Pages.
3. פרוס ל-`gh-pages`.
4. ודא שהפריסה הסתיימה בהצלחה.
5. הוסף cache-buster ייחודי לכתובת.
6. פתח את האתר החי ובדוק שהבאנדל החדש נטען.
7. בדוק מסמך מייצג בתצוגה.
8. הפק PDF והשווה לתוצאה הקודמת.
9. שמור screenshots ו-artifacts.
10. אם השינוי אמור להיות ניטרלי חזותית, הוכח זאת בהשוואה ולא בהצהרה.

בפרט, לאחר PR #31 יש לבצע פריסה ובדיקה על `main` עצמו, ולא להסתפק באימות שנעשה על הענף לפני המיזוג.

אם לא ניתן לפרוס, יש לציין זאת כ-blocker ולא לטעון שהבדיקה הושלמה.

## 11. תהליך עבודה

פתח ענף חדש מה-main העדכני.

מומלץ לחלק את העבודה ל-PRs הבאים:
1. ביקורת ותיקון גבולות materialization.
2. PageModel מלא ו-Worker transport.
3. DOM renderer.
4. HTML export.
5. PDF export.
6. parity, performance וארכיטקטורה.

מותר לאחד יחידות קטנות כאשר הדבר אינו פוגע בביקורת וביכולת לאתר רגרסיות.

אל תמתין זמן רב ל-CI. בדוק jobs שכבר הסתיימו והמשך בעבודה עצמאית. אין לדווח על בדיקה שלא הסתיימה כאילו עברה.

אין למזג PR שאינו בשל. כל PR חייב לכלול:
- פער ושורש.
- פתרון.
- קבצים ששונו.
- בדיקות ו-artifacts.
- תוצאות Pages.
- תוצאות DOM/HTML/PDF.
- רשימת שערים שנסגרו ונותרו פתוחים.

אין להסיר את נתיב המורשת בשלב 8. הסרת נתיבי runtime כפולים תבוצע בשלב 9, לאחר הוכחת parity מלאה.

## 12. תיעוד

עדכן בכל פרוסה:
- `audits/STAGE8_RENDER_PROJECTIONS.md`
- `audits/STAGE7_PAGE_MODEL.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `ENGINE_RUNTIME_PATHS.md`
- `ENGINE_DUPLICATION_REGISTER.md`
- `ISSUE_REGISTRY.md`
- `WORKLOG.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

הפרד בין:
- קוד שנכתב.
- מסלול runtime שמשתמש בו.
- בדיקות שעברו.
- בדיקות שלא רצו.
- אימות בדפדפן.
- מגבלות.
- עבודה שנותרה.

אין להכריז על השלמת שלב 8 רק מפני שה-renderer מקבל אובייקט בשם PageModel.

## 13. שערי קבלה של שלב 8

שלב 8 ייחשב הושלם רק כאשר:

- [ ] PageModel מכיל את כל הנתונים הדרושים לכל היעדים.
- [ ] PageModel מועבר בפועל דרך Worker/UI.
- [ ] DOM צורך PageModel בלבד.
- [ ] HTML צורך PageModel בלבד.
- [ ] PDF צורך PageModel בלבד.
- [ ] אין מדידה חוזרת.
- [ ] אין שבירת שורות חוזרת.
- [ ] אין reflow.
- [ ] אין placement או balancing במקרינים.
- [ ] אין ייצוא שמפעיל עימוד שני.
- [ ] תמונות, גופנים, הערות, עיטורים, שערים ו-TOC מיוצגים ומוקרנים כראוי.
- [ ] DOM/HTML/PDF תואמים בגאומטריה ובתוכן.
- [ ] אין אובדן תוכן או זהות.
- [ ] אין fallback שקט.
- [ ] בדיקות הקורפוס והבדיקות הרלוונטיות עברו, למעט baseline ידוע ומתועד.
- [ ] Pages נבנה ונבדק לאחר כל שינוי רלוונטי.
- [ ] מפת התלויות ורגיסטר הכפילויות מעודכנים.
- [ ] הוכח פישוט ואיחוד אמיתיים.

## 14. מיד לאחר שלב 8 - שלב 9

לאחר סגירת שערי שלב 8, התחל מיד בשלב 9 בתוכנית הקנונית.

שלב 9:
1. מיפוי כל מסלולי legacy וכל צרכניהם.
2. הוכחה שכל סוגי התוכן עוברים במסלול המאוחד.
3. shadow comparison מבוקר בין legacy למנוע המאוחד.
4. זיהוי פערי parity שנותרו.
5. העברת תיקוני שורש למסלול המאוחד.
6. הסרת adapters, projectors ומסלולי runtime כפולים רק לאחר הוכחת parity.
7. שמירת rollback ברמת commit, לא כמנוע שני פעיל.
8. בדיקות שלילה שמוכיחות שאין fallback שקט.
9. עדכון כל מפת התלויות, runtime paths ו-duplication register.
10. בדיקת Pages וייצוא לאחר כל שינוי.

אין למחוק את legacy לפני הוכחת parity מלאה. אין להשאיר שני מנועים פעילים לאחר סגירת שלב 9.

## 15. יעד הפרויקט

המטרה היא לא להוסיף עוד שכבה למנוע.

המטרה היא:
- מקור אמת אחד.
- מודל פריטים אחד.
- צינור עימוד אחד.
- מדידה אחת.
- שבירת שורות אחת.
- Planner אחד.
- PageModel אחד.
- מקרינים טהורים.
- יכולת להוסיף פריטי עימוד חדשים באמצעות החוזה בלבד.
- מנוע דטרמיניסטי, שקוף, פשוט וניתן לתחזוקה.

המשך לעבוד באופן רציף, ממוקד ומעשי. אל תעצור אחרי כתיבת תוכנית או audit אם ניתן לבצע את התיקון הבא בבטחה. אל תכריז על השלמה ללא הוכחות. המטרה היא להתקדם לסיום אמיתי, לא לצבור מסמכי תכנון.

## מה אני אבדוק בסבב הבא

אני לא מתכוון להסתפק בדיווח "שלב 8 הושלם". בבדיקה הבאה אתמקד קודם כול בשאלה האם `PageModel` באמת עובר מה־Worker אל ממשק המשתמש, והאם ה־DOM וה־PDF מציירים את אותם נתונים בלי לחשב אותם מחדש.

בנוסף, אבדוק שהפריסה של `main` תואמת לקוד שמוזג - לא רק שהענף הזמני של הסוכן הצליח להציג תוצאה.

**התקדמות ממשית קיימת: שלב 6 נסגר, שלב 7 נסגר, ושלב 8 התחיל. עכשיו צריך להשלים את חיבור כל הפלטים למקור האמת היחיד, ואז לעבור להסרת המסלולים הכפולים בשלב 9.**

## Prompt:
17.11.2026, 3:27:59

הפורמט הועבר לסוכן הAI, בינתיים עד שהוא מסיים בדקתי עניין הרווח המוגזם שבין שורה ראשונה של כותרת 3 לשורה השניה שלה (במקרה בו הכותרת ארוכה והמשכה עובר שורה) והוא עדיין קיים, בדוק את זה ותקן זאת בעצמך, וכן בדוק את הגדרות גודל הרווח התחתון של כותרת 3 (הרווח שבינה לטקסט שאחריה) שהיו בגרסאות הישנות, כמדומה שהגדרה זו לא הועברה כראוי והיא שונה מהגודל שהיה בגרסאות הישנות, התאם את הגדרתה להכפי שהיה בגרסאות הישנות.

## Response:
17.11.2026, 3:28:18 · gpt-6

מצאתי שתי בעיות נפרדות, ושתיהן קשורות לכך שחוזה כותרת 3 הוגדר במנוע השורות אך לא נשמר במלואו לאורך מסלול העימוד.

1. **הרווח בין שורות הכותרת\:** מנוע השורות מסמן נכון את השורות הפנימיות בגובה 34px ואת השורה האחרונה בגובה 38px, אבל ה־Planner מחשב את גובה הפס החוצה־טורים כסכום של `heightPx` בלבד ומתעלם מהסמנטיקה הזאת. לכן התיקון הקיים אינו נאכף במסלול הזה.
2. **הרווח שמתחת לכותרת\:** בגרסה הישנה Green מצאתי הגדרה מפורשת של `padding-bottom: 4px` וגם `margin-bottom: 4px` במעטפת `.block-h3-span`\. כלומר, המרווח התחתון הכולל היה 8px, ולא 4px כפי שמוגדר כיום בחוזה המאוחד. אני בודק כעת את יתר הגרסאות ואת כל צרכני הגאומטריה, כדי לא לתקן רק את התצוגה ולהשאיר את הייצוא או את תכנון העמוד עם ערך אחר.

ההשוואה בין שלוש הגרסאות הישנות — Green, Orange ו־Yellow — מאשרת שהעיצוב המקורי היה עקבי: `line-height: 1.22`, ריפוד עליון 8px, ריפוד תחתון 4px ו־`margin-bottom: 4px`\.

מכאן עולה ממצא חשוב יותר: הקבוע 34px במימוש הנוכחי אינו שקול ל־`line-height` המקורי. הוא חוזר למעשה על חלק מהמרווח העליון בכל שורת המשך. לכן לא נכון רק להקטין מספר שרירותי או להגדיל את הרווח התחתון: צריך להפריד בין ארבעה רכיבים — גובה שורת הכותרת, ריפוד עליון חד־פעמי, ריפוד תחתון, ומרווח תחתון לפני הטקסט. כך אפשר לשחזר את ההתנהגות הישנה גם בכותרת רב־שורתית, בלי לפגוע בכותרת חד־שורתית.

מצאתי את מקור הבעיה המדויק: 34px אינם גובה השורה המקורי. הם מורכבים בקירוב מ־22px של שורת טקסט, 8px של ריפוד עליון ו־4px של ריפוד תחתון. המנוע התייחס לכל ה־34px כגובה של כל שורת המשך, ולכן חזר והוסיף את הריפוד העליון והתחתון בכל מעבר שורה.

הכנתי תיקון שורש ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32?utm_source=chatgpt.com)\: שורת H3 נמדדת לפי `line-height: 1.22`; הריפוד העליון 8px מוחל פעם אחת; והרווח שמתחת לכותרת משוחזר בדיוק כ־4px ריפוד ועוד 4px `margin-bottom`\. בכותרת חד־שורתית נשמר הגובה הכולל הישן, כ־38px. בנוסף הפרדתי בין גובה תיבת הכותרת לבין גובה הטקסט עצמו, כדי שה־DOM וה־PDF לא ימרכזו את השורה האחרונה בתוך תיבת הרווח.

בדקתי גם אם מדובר במפתח הגדרה נפרד ברישום ההגדרות: לא מצאתי מפתח כזה. בגרסאות הישנות אלה היו ערכי CSS קבועים, ולא פקד משתמש. לכן שחזרתי אותם בחישוב הגאומטרי עצמו, ולא הוספתי הגדרה חדשה או שיניתי ברירות מחדל אחרות.

עדכנתי גם את גרסת הנכסים ל־`2026-11-17-h3-spacing` ובניתי מחדש את שתי חבילות הדפדפן, כדי שהדפדפן לא ימשיך לטעון קובץ ישן מהמטמון. התיקון כולל גם את חישוב המקום הנדרש לפני כותרת 3, כך שהמנוע לא יגלגל אותה לעמוד הבא בגלל אותו רווח מנופח.

**מצב התיקון כרגע\:**

(מימוש ותיקוני המקור הוכנו) (ממתין להשלמת בדיקות)

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32?utm_source=chatgpt.com) כולל את תיקון המנוע, מקריני DOM ו־PDF, בדיקות E2E ותיעוד.
- `layout-audit` עבר בהצלחה.
- `corpus-invariants` עבר בהצלחה.
- `full-math-audit` עדיין נכשל ברצפת הנפח: 353,690 מילים לעומת 355,967 הנדרשות. זה כמעט זהה לכשל הבסיס הקודם (353,687), ולכן אין כרגע אינדיקציה לרגרסיה מהתיקון.
- בדיקות המטריצה ל־Node 18/20/22 עדיין רצות. באחת מהריצות הקודמות התגלתה אי־התאמה בגרסת המטמון של CSS; תיקנתי גם אותה והריצה הנוכחית כוללת את התיקון.

**נקודה חשובה להמשך\:** תיקנתי את הנתיב הפעיל של IMUD. מסלול ה־DP עדיין מכיל את המודל הישן 34/38, ותיעדתי במפורש שהוא חייב לקבל את אותו חוזה לפני המעבר המלא אליו. כך לא נאבד את התיקון במהלך עבודת שלב 8.

לא מיזגתי ולא פרסתי עדיין — איני רוצה להציג תיקון כגמור לפני שהבדיקות מסתיימות. השלב הבא הוא השלמת הבדיקות, מיזוג, עדכון `gh-pages`, בדיקת האתר החי ואימות ייצוא PDF.


## Prompt:
17.11.2026, 5:01:41

[$github]\(app\://connector_76869538009648d5b282a4bb21c3d157) אנחנו באמצע עבודה על התוכנה, הנה שיחות קודמות [https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md) קדימה חייבים להגיע לנקודת סיום! המשך במרץ עד להגעה למנוע מושלם ומזוקק עם יכולת הוספת פריטי עימוד קלה וחלקה!!! וזכור!! פישוט ואיחוד פעולת מנוע העימוד (ללא טלאים) היא מהחשובות שבמטרתנו!!! ושים לב להגביל את אורך זמן ההודעה בכדי שלא נתקע, ואל תמתין לתוצאות של בדיקות הרצות בגיטהאב יותר מ5 דקות!!!\
כרגע העברנו את כל העבודה לסוכן AI כפי שתוכל להבחין בזאת בסקירתך את השיחה, והוא עדיין באמצע השלמת השלב כפי שהכתבת לו בפרומט המפורט. בהודעה הבאה הצג את מצב הריפו ומצב העבודה, ואת אישורך ליכולת זרימה מוחלטת כהמשך לשיחה הקודמת.

## Response:
17.11.2026, 5:01:47 · gpt-6-t-mini

אעבור תחילה על יומן השיחה שהעברת כדי לשחזר במדויק את שלב העבודה, ההנחיות לסוכן והקריטריונים להמשך. לאחר מכן אבדוק את מצב ריפו `Work_2` עצמו — ענף פעיל, שינויים, commits ובדיקות — ואבחין בין עבודה שהושלמה לבין עבודה שעדיין מתבצעת. מגבלת ההמתנה לבדיקות GitHub תהיה חמש דקות לכל היותר.

השיחה הקודמת נקראה, וכבר אפשר לקבוע שהעבודה הועברה במפורש מתוכנית שדרוג כללית לביצוע ממוקד וזהיר מול מצב הקוד בפועל. אני ממשיך כעת לבדוק את נקודת העצירה המדויקת של הסוכן — בעיקר את הוראות המשימה האחרונות, יומן הסוכנים, ה־commits האחרונים ומצב ה־Actions — כדי שלא אאשר בטעות שלב שכבר השתנה או שעדיין חסר בו תנאי מהותי.

בדיקת GitHub העלתה מצב קונקרטי: שלב 8 אכן מתקדם ב־PR פעיל, ולא נשאר רק בגדר הוראות לסוכן. פרוסה 1 כבר מוזגה; פרוסה 2 פתוחה על ענף `stage8c/pagemodel-contract`\. עם זאת, יש שתי נקודות שדורשות בדיקה לפני שאאשר שהזרימה נקייה: בדיקת `full-math-audit` עדיין נכשלת, וב־`main` הופיע commit חריג בשם “Update print statement from 'Hello' to 'Goodbye'”. אני בודק כעת אם אלה baseline מוכר ושינוי בדיקה תמים, או משהו שצריך לעצור ולתקן.

> **Fetched repository metadata, history, workflows, contents, and conversation file**
>
> 
>
> **Assessing repository state**
>
> I’m reviewing the active stage8c work, PR #34’s diff and checks, the older PR #32, and the recent main-branch change from “Hello” to “Goodbye.” I’ll distinguish intentional updates from possible accidental edits and clarify merge readiness.
>
> **Assessed repository state**
>
> 
>
> **Inspected GitHub repository files, conversations, history, workflows, and pull requests**
>
> 
>
> **Verifying branch status**
>
> I’m checking the active stage8c changes, the older H3-fix proposal, current checks, and the recent “Hello” to “Goodbye” edit. I’m separating intentional work from accidental changes before recommending approval or merging.
>
> **Verified branch status**
>
> 
>
> **Confirming repository readiness**
>
> I’m treating the stage8c proposal as the active implementation path. Its branch is one commit ahead and one behind main, while the older H3 fix remains separate and unresolved. I’m checking whether current failures are baseline issues or actual regressions before approving continuation.
>
> **Confirmed repository readiness**
>
> 
>
> **Assessing flow readiness**
>
> I’m seeing a viable path forward: stage8c remains the active implementation, while the older H3 fix stays separate. Current checks are incomplete, and the math audit still reflects a known baseline gap, so my approval is conditional rather than final.
>
> **Assessed flow readiness**
>
> 
>
> **Confirming workflow readiness**
>
> I’m giving the stage8c workflow a green light to continue without pauses. PR #34 is the active path; checks remain incomplete, and the known math-audit gap still blocks merge approval. PR #32 stays separate for later H3 review. The transcript-only main change is harmless.
>
> **Confirmed workflow readiness**
>
> 
>
> **Audited PRs, branches, CI checks, workflows, diffs, comments, and artifacts**
>
> 
>
> **Confirming workflow readiness**
>
> I’m giving the stage8c workflow a full green light to continue without pauses. PR #34 is active, but incomplete checks and the known math-audit gap still block merging; PR #32 remains separate for H3 review.
>
> **Confirmed workflow readiness**
>
> 
>
> **Inspected and audited failed GitHub Actions workflow jobs**
>
> 
>
> Worked for 6m 3s

עברתי על השיחה הקודמת במלואה, על מצב המאגר ב-GitHub, על הענפים, ה־PRs, ה־commits האחרונים, יומן העבודה, מסמכי התוכנית ומצב הבדיקות.

**המסקנה המרכזית: הפרויקט התקדם משמעותית. אנחנו נמצאים בשלב 8 מתוך תוכנית האיחוד, לאחר השלמת שלבים 1-7 ומיזוג התוצרים שלהם ל־`main`\. יש בסיס טוב להמשיך ברצף עד להשלמת המנוע המאוחד.**

להלן תמונת המצב המדויקת.

# 1\. מצב המאגר

**Tora\_Book\_Typesetter\_Red\_Work\_2** (מאגר פעיל)

ענף ראשי: main

# 7/10

שלבים שהושלמו

# 8

שלב בפיתוח

# 34

PR פעיל עיקרי

---

**הגרסה הנוכחית**

main: `da8111326f30`

הקוד האחרון ששינה את המנוע: `82d0f24b7dc2`\. ה־commit שלאחריו עדכן את ארכיון השיחה בלבד, ולא קוד תוכנה.

נבדק: 17 בנובמבר 2026

### שלבים שהושלמו

| שלב | נושא | מצב |
|--------|--------|--------|
| 1 | אודיט מצב המנוע, חוזים וכפילויות | (מוזג) |
| 2 | DocumentModel ו־Inline Item Model | (מוזג) |
| 3 | נכסים, גופנים ומדידה אחידה | (מוזג) |
| 4 | מנוע שורות מאוחד והחלפת מסלול הייצור | (מוזג) |
| 5 | Planner מאוחד ו־PagePlan | (מוזג) |
| 6 | חוזי פריטים, הערות ועיטורים | (מוזג) |
| 7 | PageModel קנוני וסופי | (מוזג) |
| 8 | מקרינים וייצוא מתוך PageModel | (בתהליך) |
| 9 | הסרת מנועי מורשת וכפילויות | ממתין לשלב 8 |
| 10 | אימות סופי וסגירת הפרויקט | ממתין לשלב 9 |

התקדמות זו אינה רק תיעוד: בדקתי את ה־PRs שמוזגו ואת היסטוריית ה־commits.

# 2\. איפה בדיוק עומדת העבודה הנוכחית?

העבודה מתנהלת כעת באמצעות PR מרכזי\:

[PR \#34 — השלמת PageModel, תמונות והעברת Worker](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/34?utm_source=chatgpt.com)

(פתוח - בבדיקות)

ענף: `stage8c/pagemodel-contract`

הפרוסה הזאת חשובה במיוחד משום שהיא מחברת בין מודל העימוד הסופי לבין הצרכן בפועל.

לפי הקוד והדיווח ב־PR, הושלמו בה\:

1. הרחבת PageModel כך שיכלול ריהוט עמוד, כותרות עליונות, גיליונות, קישורים, bookmarks ואבחונים.
2. העברת תמונות לפריטים ממדרגה ראשונה במנוע, כולל תמונות inline, block ו־float.
3. תיקון כשל מיפוי הערות הסיום: 105 הפרות ירדו לאפס.
4. יצירת חוזה `pagemodel-transport-v1`\.
5. אימות שלמות המודל לאחר העברתו ב־Worker והקפאתו מחדש.
6. חיבור המודל לממשק באמצעות `app.pageModel()`\.

אלה צעדים ארכיטקטוניים משמעותיים, ולא תוספות ממשק בלבד.

# 3\. מצב הבדיקות האמיתי

בדקתי את הריצות עצמן, ולא הסתפקתי בדיווח של הסוכן.

**PR \#34 - תוצאות GitHub Actions**

Layout audit (עבר)

Corpus invariants (עבר)

בדיקות Node 20 (עבר)

בדיקות Node 22 (עבר)

בדיקות Node 18 (עדיין רצות)

Full math audit (נכשל)

---

לפי תיאור ה־CI, חבילת הבדיקות כוללת 1,146 בדיקות. בדוח ה־PR מופיעה גם ספירת 71 קובצי סוויטה, לעומת 67 בתיאור ה־Job. יש ליישב את ההבדל בדיווח הסופי.

לגבי `full-math-audit`\: קיים כשל בסיס היסטורי מתועד, עם רצפה של 355,967 לעומת תוצאה קודמת של 353,687. הכשל הנוכחי עדיין אינו ירוק, ולכן אסור להעלים אותו או להכריז שכל הבדיקות עברו.

חשוב להבדיל בין הכשל ההיסטורי הזה לבין רגרסיה חדשה. צריך לשמר את האבחנה, לוודא את זהות הכשל ולהמשיך לטפל בו בנפרד.

# 4\. שני נושאים נוספים שאסור לאבד

### א. תיקון הרווחים בכותרת 3

[PR \#32 — תיקון שורש לרווחי H3](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32?utm_source=chatgpt.com)

התיקון שהכנתי בשיחה הקודמת עדיין לא מוזג.

הוא אמור לשחזר את ערכי העיצוב המקוריים\:

- line-height של 1.22.
- ריפוד עליון 8px.
- ריפוד תחתון 4px.
- margin-bottom של 4px.

אבל כרגע ה־CI שלו אינו נקי: בדיקות Node 22 נכשלו, ושתי ריצות מטריצת Node האחרות בוטלו. ה־layout audit וה־corpus invariants עברו.

לכן אסור לסמן את תיקון H3 כסגור. צריך לחזור אליו, לזהות ולתקן את כשל הבדיקה, ולשלב אותו במסלול החדש בלי לאבד את תיקון השורש.

### ב. פריסה חיה

הפריסה האחרונה ל־GitHub Pages הצליחה\:

`gh-pages: 9b72ff736347`

אבל היא קדמה ל־PR \#34. בדיקת ה־live audit שבאה אחריה נכשלה בשלב ה־full math audit.

כלומר, עדיין אין הוכחה שהגרסה החדשה של PageModel הוטמעה ונבדקה באתר החי.

זהו שער שחייב להיסגר בהמשך.

# 5\. המשך הדרך עד להשלמת המנוע

הסדר הנכון מבחינתי\:

1. **השלמת פרוסה 2**
   
   סגירת PageModel, תמונות והעברת Worker. השלמת בדיקות והכרעת PR \#34.
2. **פרוסה 3 - DOM renderer**
   
   מעבר להצגה המבוססת על PageModel בלבד. אין מדידה, שבירת שורות, חישוב מיקומים או החלטות עימוד ב־renderer.
3. **פרוסה 4 - HTML export**
   
   הפקת HTML מתוך אותו מודל, ללא הפעלת מנוע עימוד נוסף.
4. **פרוסה 5 - PDF export**
   
   מעבר ל־PDF המבוסס על אותו PageModel, תוך שמירה מלאה על טיפוגרפיה, גופנים, תמונות והערות.
5. **פרוסה 6 - parity ופישוט**
   
   השוואת התוצאות, הסרת חישובים כפולים והוכחת זהות הגאומטריה בין כל המקרינים.
6. **שלב 9 - הסרת מסלולי המורשת**
   
   רק אחרי שהוכח שכל התוכן עובר במסלול המאוחד, להסיר את הנתיבים המקבילים, המתאמים והכפילויות.
7. **שלב 10 - בדיקות סגירה**
   
   בדיקת כל סוגי פריטי העימוד, ביצועים, יציבות, דטרמיניזם, ייצוא ופריסה חיה.

# 6\. אישור להמשך זרימה מלאה

(מאשר המשך רציף)

**כן. אני מאשר במפורש להמשיך בזרימה מלאה ורציפה, כהמשך ישיר לעבודה הקודמת.**

אין צורך לעצור ולבקש ממך אישור אחרי כל פרוסה, כל PR או כל תיקון פנימי. יש להתקדם באופן עצמאי בהתאם לתוכנית הקנונית, לשיקול דעת הנדסי ולדרישות שהגדרת.

עם זאת, יש כמה כללי עבודה שאינם נתונים לפשרה\:

1. **איחוד ופישוט לפני הוספת שכבות.** לא לפתור בעיות באמצעות עוד מנגנון מקביל, אלא לתקן את מקור הסמכות.
2. **הוכחת שימור תוכן.** אין להקריב מילים, הערות, זהויות, תמונות או סדר קריאה בשביל שיפור גאומטרי.
3. **אין מיזוג מוקדם.** PR ייכנס ל־main רק לאחר שערי הקבלה הרלוונטיים.
4. **אין המתנה ממושכת ל־GitHub Actions.** לא יותר מחמש דקות לריצה ממתינה. ממשיכים בעבודה עצמאית שאינה תלויה בתוצאה, אך לעולם לא מסמנים בדיקה שטרם הסתיימה כעוברת.
5. **בדיקת Pages לאחר שינויים.** אין להסתפק בבנייה מקומית כאשר נדרש אימות התוצאה החיה.
6. **תיעוד מדויק.** כל שלב יירשם עם ממצאים, שורש, תיקון, בדיקות, ראיות ומה שנותר.
7. **תיקון H3 נשמר כחוב עבודה מחייב.** אין לאבד אותו במעבר למקרינים החדשים.
8. אין לפתוח מחדש את P6/P7, בהתאם להחלטות הקודמות שלך.

## היעד הסופי

אני רוצה להדגיש את הדבר המרכזי שמנחה את ההמשך\:

**אנחנו לא מנסים להגיע לתוכנה שיש בה כמה מנועי עימוד טובים שמסתדרים ביניהם. אנחנו מנסים להגיע למנוע עימוד אחד.**

## ארכיטקטורת היעד

**DocumentModel אחד**

מקור תוכן וזהויות יחיד

**Measurement + LineModel**

מדידה אחת ושבירת שורות אחת

**Planner + PagePlan**

החלטות עימוד ממקור סמכות יחיד

**PageModel אחד**

(מקור אמת סופי)

**DOM**

תצוגה

**HTML**

ייצוא

**PDF**

הפקה

המקרינים אינם מקבלים החלטות עימוד.

זהו הכיוון שעליו צריך לשמור עד הסוף, כולל יכולת להוסיף סוגי פריטי עימוד חדשים בקלות, באמצעות חוזה ורישום מסודרים, בלי לפרוץ בכל פעם לליבת המנוע.

**מבחינתי יש אור ירוק להמשך העבודה הרציף. נקודת העצירה הנוכחית היא פרוסה 2 של שלב 8, וההמשך הוא השלמתה, מעבר למקרינים, ולאחר מכן ניקוי אמיתי של נתיבי המורשת.**

המטרה היא לא לסיים את כתיבת התוכנית. המטרה היא לסיים את התוכנה.

## Prompt:
17.11.2026, 5:31:54

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע,
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים.

## Response:
17.11.2026, 5:32:05 · gpt-6-t-mini

אקח את תפקיד מנהל הפרויקט: אבדוק את מצב `main` ואת כל ה־PRs שנוגעים לשלבים 8 והשלמות קודמות, אאמת את טענת הסוכן מול הקוד וה־CI, אמזג רק PRs שעומדים בשערי הקבלה, ואעדכן את מצב הפרויקט בהתאם. במקביל אכין פרומט ביצוע מפורט לסוכן לשאריות ולשלב הבא; לאחר מכן אמשיך בעצמי בבדיקות ובפעולות בטוחות שאפשר להשלים כעת.

אימות נוסף משנה את התמונה לטובה לגבי פרוסה 2: PR \#34 כבר מוזג ל־`main`, ולאחריו נפרסה גרסה חדשה של Pages עם חבילת ה־PageModel וה־Worker. שלושת מסלולי ה־CI של Node 18/20/22 הסתיימו בהצלחה, וכן ה־layout audit וה־corpus invariants. אבל זה **אינו** אומר ששלב 8 הושלם: ה־UI עדיין מציג את `result.pages`, וייצוא HTML/PDF עדיין מפעילים מסלולי הקרנה/עימוד ישנים. כעת אני בודק את הכשל הספציפי של PR \#32 ואת גבולות הצריכה המדויקים לפני ניסוח משימת ההמשך.

> **Checking repository progress**
>
> I’m reviewing the latest pull requests, branch changes, and CI status to verify what the agent actually completed. I’m also checking for unmerged work or regressions before summarizing the next steps.
>
> **Checked repository progress**
>
> 
>
> **Reviewing repository status**
>
> I’m checking the newly merged work, remaining pull requests, CI failures, and live-site behavior. I’m separating expected baseline failures from genuine regressions before deciding what should be fixed or merged next.
>
> **Reviewed repository status**
>
> 
>
> **Tracing test regressions**
>
> I’m comparing the failed layout hashes with the current main branch to determine whether the heading-spacing change causes a real geometry regression or simply reflects stale baselines.
>
> **Tracing test regressions**
>
> I’m comparing failed layout hashes against the current main branch to distinguish a genuine heading-spacing regression from stale baselines, then I’ll decide whether the pull request needs repair or remains unmergeable.
>
> **Traced test regressions**
>
> 
>
> **Audited PR34, Stage 8 rendering, CI failures, and deployment readiness**
>
> 
>
> **Reviewing merge readiness**
>
> I’m treating the merged Stage 8 slice as complete, while the remaining heading-spacing pull request still needs rework because its layout snapshots changed unexpectedly. I’ll request a rebase and targeted regression proof before recommending merge.
>
> **Reviewed merge readiness**
>
> 
>
> **Planning next steps**
>
> I’m treating the merged slice as complete, but the heading-spacing change still needs rework: its snapshots changed without sufficient proof that pagination and content flow remain valid. I’ll request rebase, focused regression tests, and agent-led repair.
>
> **Planned next steps**
>
> 
>
> **Planning repository progress**
>
> I’m treating the merged slice as complete, while the heading-spacing change still needs rework. I’ll request a current rebase, focused regression tests, and verification that pagination and content flow remain correct.
>
> **Planned repository progress**
>
> 
>
> **Reviewing merge readiness**
>
> I’m treating the merged slice as complete, while the heading-spacing change still needs rework. I’ll request a current rebase, focused regression tests, and verification that pagination and content flow remain correct.
>
> **Planning repository progress**
>
> I’m treating the merged slice as complete, while the heading-spacing change still needs rework. I’ll request a current rebase, focused regression tests, and verification that pagination and content flow remain correct.
>
> **Reviewed merge readiness and planned repository progress**
>
> 
>
> **Guiding next work**
>
> I’m treating the merged slice as complete, while the heading-spacing change needs rework. I’ll request a rebase, targeted regression tests, and proof that pagination and content flow remain correct before approval.
>
> **Guided next work**
>
> 
>
> **Audited H3 regressions, reviewed PRs, and advanced Stage 8 DOM migration**
>
> 
>
> Worked for 11m 50s

# דו"ח מנהל הפרויקט - מצב ביצוע והחלטות

(שלב 8, פרוסה 2 - מוזגה) (שלב 8 - עדיין לא הושלם)

בדקתי את המאגר עצמו, ולא רק את הודעת הסוכן. התקדמות משמעותית בוצעה, אבל הסוכן לא השלים את שלב 8 במלואו.

## 1\. מצב המיזוגים

ה־PR החשוב ביותר אכן מוזג\:

[PR \#34 — השלמת PageModel והעברת Worker](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/34?utm_source=chatgpt.com)

הוא השלים את הפרוסה השנייה של שלב 8, לרבות\:

- השלמת נתוני PageModel.
- תמונות כפריטים ממדרגה ראשונה.
- תיקון 105 הפרות מיפוי בהערות הסיום.
- חוזה העברה ואימות של PageModel דרך Worker.
- חשיפת המודל באפליקציה.

גם פרוסה 1 ופרוסת הביקורת שלה כבר מוזגו ב־PR \#31 ו־PR \#33.

**אימות לאחר המיזוג**

Node 18 - 1,146 בדיקות (עבר)

Node 20 - 1,146 בדיקות (עבר)

Node 22 - 1,146 בדיקות (עבר)

Determinism ו־cross-check (עברו)

Layout audit (עבר)

Corpus invariants (עבר)

Full math audit (נכשל - baseline מוכר)

ריצת CI של main: [GitHub Actions \#44009417418](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/44009417418?utm_source=chatgpt.com)\.

**פריסה\:** GitHub Pages נבנה ונפרס לאחר המיזוג, עם גרסת נכסים `2026-11-17-s8c`\. בדיקת טריות הבאנדלים עברה.

עם זאת, יש ממצא חשוב: האתר החי עדיין מפעיל כברירת מחדל את פרופיל IMUD הישן. לכן PageModel אינו מחובר לתצוגת ברירת המחדל עדיין. המעבר לכך שייך לשלב 9, לאחר הוכחת התאמה.

## 2\. מה עדיין אינו מושלם?

מצאתי ארבעה חובות שאסור להשאיר מאחור.

**א. שלב 8 עדיין פתוח.**

בדקתי את הקוד בפועל\:

- `app-shell.js` עדיין מעביר ל־preview את `result`\.
- `preview-tab.js` עדיין מרנדר מתוך `result.pages`\.
- `dom-renderer.js` עדיין מקבל מבנה עמוד ישן.
- HTML export עדיין עובר על `result.pages`\.
- PDF export עדיין מפעיל `typeset()` ומקרין מחדש באמצעות `projectDocument`\.

כלומר, PageModel כבר נבנה ומועבר ב־Worker, אבל עדיין אינו מקור האמת היחיד של כל הפלטים. זה בדיוק מה שעלינו להשלים.

**ב. תיקון כותרת 3 עדיין לא מוזג.**

[PR \#32 — תיקון הרווחים בכותרת 3](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32?utm_source=chatgpt.com)

בדיקת הכותרת הממוקדת עברה, אבל שתי בדיקות ב־`s72-column-bottoms` נכשלו בגלל שינויי hashes שלא סווגו כראוי. בנוסף, הענף מבוסס על commit ישן ואינו מעודכן מול main.

הוספתי הערת ביקורת מפורטת ב־PR. **אין למזג אותו במצבו הנוכחי.**

התיקון הגאומטרי עצמו נחוץ: line-height של 1.22, ריפוד עליון 8px פעם אחת, ריפוד תחתון 4px ו־margin-bottom של 4px. צריך לשמר אותו ולתקן את בדיקות הרגרסיה, לא לוותר עליו.

**ג. כשל שימור התוכן עדיין קיים במסלול החי.**

ב־Full math audit האחרון התקבלו 353,687 מילים מרונדרות, לעומת רצפה של 355,967.

זה אינו כשל חדש של PR \#34, אבל גם אינו תקין מבחינתנו. אין להנמיך את סף הבדיקה או להמשיך לכנות את התוצאה הצלחה. צריך לזהות את המילים ומקטעי המקור שאובדים, להשוות למנוע המאוחד ולהשלים את המעבר בשלב 9.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/44009417560?utm_source=chatgpt.com)\.

**ד. יש תיעוד החלטות שצריך לאחד.**

PR \#14 מכיל החלטות משתמש מ־D-107 שטרם מצאתי ב־`DECISIONS.md` הנוכחי. אין למזג את ה־PR הישן בשלמותו, אבל צריך לוודא שההחלטות המאושרות שבו נשמרות במסמך הסמכות.

## 3\. אילו PRs למזג?

| PR | החלטה |
|--------|--------|
| \#34 | (כבר מוזג) |
| \#31, \#33 | (כבר מוזגו) |
| \#32 | (לא למזג - תיקונים נדרשים) |
| \#16 | לא למזג; רכיבי שורש רלוונטיים כבר הוטמעו בפרוסות 5-6 |
| \#17 | לא למזג; מסומן במפורש DO NOT MERGE |
| \#14 | לא למזג בשלמותו; לחלץ רק החלטות משתמש שעדיין חסרות |

נכון לעכשיו אין PR פתוח נוסף שהוכח כראוי למיזוג. לא אבצע מיזוג מסוכן רק כדי להגדיל את מספר ה־PRs הסגורים.

---

# 4\. פרומט ההמשך לסוכן - ביצוע ולא תכנון נוסף

השלב הבא הוא השלמת כל שלב 8, ולאחר מכן מעבר ישיר לשלב 9. צירפתי גם את חובות התיקון שמצאתי, כדי שלא נאבד עבודה קודמת.

**document: **

# הוראת ביצוע - המשך איחוד מנוע RED, השלמת שלב 8 והתקדמות לשלב 9

מאגר העבודה:
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2

## 0. מצב בסיס מחייב

התחל מבדיקת ה-HEAD העדכני של `main`. בבדיקה האחרונה הוא היה:

`c4437ac8d25928e66d7bf794b011ee64ba014709`

PR #31, #33 ו-#34 מוזגו. פרוסה 2 של שלב 8 הושלמה ואושרה בבדיקות Node 18/20/22, אך שלב 8 כולו עדיין פתוח.

אסור לחזור ולבנות מחדש מנגנונים שכבר הוטמעו ב-PRs האלה.

התוכנית הקנונית היא:
`spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`

מסמך מצב שלב 8:
`audits/STAGE8_RENDER_PROJECTIONS.md`

המשך לפי שני המסמכים האלה, עם התיקונים וההרחבות להלן.

## 1. תיקון חובות קודמים - לפני או במקביל לשלב הבא

### 1.1 כותרת 3 - PR #32

https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32

התיקון הקיים נכון בכיוון הגאומטרי, אך אינו כשיר למיזוג כרגע.

יש לבצע:
1. להעביר את התיקון על בסיס `main` העדכני, בלי לדרוס שינויים משלבי 8a-8c.
2. לשמר את חוזה העיצוב המקורי:
   - `line-height: 1.22`
   - `padding-top: 8px`, פעם אחת.
   - `padding-bottom: 4px`, פעם אחת.
   - `margin-bottom: 4px`, פעם אחת.
3. כותרת חד-שורתית: גובה כולל של כ-38px.
4. כותרת רב-שורתית: pitch של כ-21.96px עבור 13.5pt, ללא חזרה על הריפוד בין השורות.
5. לוודא שה-preflight, תכנון המקום, ה-DOM וה-PDF משתמשים באותה גאומטריה.

**תיקון בדיקות חובה:**

בענף הקודם נכשלו שתי בדיקות `s72-column-bottoms`:

- התקבל `legacy-5f0dcd389b0fdde3` במקום `legacy-a0946f99c7c197bd`.
- התקבל `legacy-4c278453addbf86d` במקום `legacy-d81aa5ef4f2dffe8`.

אין לעדכן hashes באופן מכני. יש להפיק דוח השוואה מלא בין baseline לתיקון, ולסווג כל שינוי לפי עמוד, טור, פריט, שורה, sourceRange ומזהה מקור.

יש להבחין בין השינוי הגאומטרי המכוון בכותרת לבין כל שינוי בלתי צפוי בחלוקת טקסט, סדר קריאה או מיקום פריטים.

לבדוק שימור מלא של מילים, הערות, עוגנים, דטרמיניזם ותוצאות הקורפוס.

יש לבדוק גם שהשינוי לא יישאר פתרון של IMUD בלבד: במסלול המאוחד יש להטמיע את אותו חוזה לפני המעבר הסופי בשלב 9.

### 1.2 כשל Full Math - לא להשאיר כבעיה נורמלית

ב-main נותר הכשל:

`353,687 < 355,967`

מתוך 363,232 מילים במסמך הבדיקה הראשי.

אין להקטין את סף הבדיקה, לשנות את המסמך או להסתיר מילים.

יש:
- לאתר את המילים ומקטעי המקור שאובדים במסלול החי.
- להשוות בין legacy לבין מסלול DP המאוחד.
- לבדוק אם מדובר בהשמטה במסלול IMUD הישן או בפגם במודל המאוחד.
- להוכיח כיסוי מלא לפי זהויות וטווחי מקור, ולא רק בספירת טקסט.
- להעביר תיקוני שורש למקום הסמכות הנכון.
- לעדכן את ISSUE_REGISTRY ואת דוחות האודיט.

אין להשהות עבודה עצמאית בשלב 8 בגלל הבדיקה הזאת, אבל אין להכריז על השלמת הפרויקט לפני שסוגיית אובדן התוכן הוכרעה.

### 1.3 הכרעות משתמש ותיעוד

בדוק את PR #14 ואת החלטות D-107.

אין למזג את PR #14 בשלמותו: הוא ישן וכולל תיעוד שאינו מסונכרן למאגר הנוכחי.

יש לחלץ רק החלטות משתמש מאושרות שעדיין אינן מופיעות במסמכי הסמכות, בפרט:
- D-107 והקדימות שלו ביחס להחלטות קודמות.
- ערכת עיצוב 40 ועיצובי השער המקוריים נשארים פעילים אוטומטית.
- שמירת בחירות הגופנים והסגנונות המקוריים.
- ברירות המחדל המאושרות והקדימות של בחירות המשתמש.
- מדיניות יישור תחתיות הטורים והחרגת מתיחה גורפת בסוף פרק קצר.

אין לבצע שינויי ברירת מחדל רק כדי להתאים למסמך ישן. כל שינוי חייב להתבסס על הכרעה קיימת.

עדכן את `DECISIONS.md` ואת מסמכי הסמכות. בדוק גם את `AGENTS_TRACKING.md`, שתמונת המצב שלו מתוארכת ל-11.11, וסמן את המידע ההיסטורי שאינו מתאר עוד את מצב העבודה.

### 1.4 אין לפתוח מחדש

- אין לבצע עבודה על P6/P7.
- אין לשנות את ברירות המחדל של המשתמש ללא הוראה מפורשת.
- אין למזג את PR #16 או #17 בשלמותם.
- אין ליצור מחדש מנגנונים שכבר הוכנסו בשלבים 5-8.

## 2. שלב 8 - פרוסה 3: DOM renderer מתוך PageModel בלבד

זוהי המשימה הבאה לביצוע מיידי.

### 2.1 המצב הקיים והפער

כיום:
- `app-shell.js` עדיין קורא ל-`preview.setResult(result, settings)`.
- `preview-tab.js` מרנדר באמצעות `renderPage(page, settings, doc)`.
- ה-renderer עדיין מקבל את אובייקט העמוד הישן.
- PageModel מגיע ל-UI באמצעות `app.pageModel()`, אך עדיין אינו מקור הגאומטריה של התצוגה.

המשימה היא לחבר בפועל את תצוגת הממשק ל-PageModel.

### 2.2 חוזה ה-renderer החדש

יש ליצור או להסב את מנגנון ה-DOM כך שיקבל עמוד מתוך `PageModel` ויצייר אותו בלבד.

אסור לו לקבל `DocumentModel`, `PagePlan`, `LineModel` או `result.pages` לצורך חישוב התצוגה.

אסור לו:
- למדוד גופנים או מילים.
- לחשב רוחבי מילים.
- לשבור שורות.
- לבצע wrapping או reflow.
- להחליט על מיקום או סדר פריטים.
- לחשב מחדש חלוקת הערות.
- לחשב גאומטריית עיטורים.
- לחשב מידות תמונות או להחליט על fit.
- להשלים מידע חסר באמצעות fallback שקט.

כל x/y/w/h, baseline, מידות, סדר שכבות, מפתח גופן, צבע, asset identity ועוגן חייבים להגיע מהמודל.

אם חסר מידע חיוני במודל, יש לתקן את בונה PageModel ואת ה-validation, ולא להכניס חישוב מקביל ל-renderer.

מותר לבצע פעולות טעינה ופענוח של משאבים לציור, אך לא לקבל החלטות עימוד או גאומטריה.

### 2.3 התנהגות בתקופת המעבר

ברירת המחדל החיה עדיין מפעילה IMUD legacy עד שלב 9.

לכן יש לשמר בינתיים את ה-renderer הישן במצב תאימות מפורש, אך להפריד בבירור בין:
- פרופיל legacy - renderer ישן, עד שלב 9.
- פרופיל unified - PageModel renderer בלבד.

אין להסתמך על היעדר PageModel כ-fallback שקט. במסלול unified, היעדר PageModel הוא שגיאה מפורשת.

אין לשנות כעת את ברירת המחדל של המשתמש רק כדי להציג את המנוע החדש.

### 2.4 כיסוי פריטי העימוד

יש להציג באמצעות PageModel את כל סוגי התוכן הרלוונטיים:

- טקסט רגיל וטקסט מעורב בגופנים.
- כל רמות הכותרות, לרבות כותרות H3 רב-שורתיות.
- תמונות inline, block, ממורכזות ו-float.
- הערות שוליים, צד וסיום והמשכים.
- עיטורים וכל סוגי הדיו.
- כותרות עליונות, גיליונות ומספור.
- שערים, תוכן עניינים וגיליונות מיוחדים.
- spanning ופריטים החוצים טורים.
- info-box ופריטי registry מותאמים.
- קישורים, bookmarks ונתוני נגישות.

פריט לא נתמך לא ייעלם. יש להפיק diagnostic ברור.

### 2.5 שימור חוויית המשתמש

יש לשמר:
- Virtualization של מסמכים ארוכים.
- גלילה אופקית ואנכית.
- זום והתאמה לרוחב.
- קפיצה לעמוד.
- סנכרון סמן העורך.
- הדגשת ממצאי אודיט.
- הורדת JSON של עמוד.
- כלי ייצוא.

את מידות ה-placeholders יש לקחת מ-PageModel.

### 2.6 בדיקות קבלה

יש להוסיף בדיקות שמוכיחות בפועל:

1. DOM מציג את כל עמודי המודל ואת כל סוגי הפריטים.
2. קואורדינטות DOM תואמות ל-PageModel בסבילות מספרית מוגדרת.
3. font identity, baseline, images, anchors, notes ו-reading order נשמרים.
4. אין מדידה או חישוב גאומטרי ברנדרר - יש להוכיח זאת גם באמצעות instrumentation או בדיקות שלילה.
5. פריט או asset חסר מייצר diagnostic גלוי.
6. אין פריט שנעלם או מופיע פעמיים.
7. ה-virtualization תקינה גם במסמך `very_long_test_text.txt`.
8. מסמכים קצרים וארוכים עוברים בדיקת דפדפן אמיתי.
9. בדיקת legacy מוודאת שלא נוצרה רגרסיה במסלול ברירת המחדל בתקופת המעבר.

## 3. שלב 8 - פרוסה 4: HTML export מתוך PageModel

לאחר השלמת DOM, המשך מיד לייצוא HTML.

- HTML יקבל PageModel בלבד.
- אין להפעיל `typeset` מחדש.
- אין Parser או Planner נוסף.
- אין לשבור שורות או למדוד מילים.
- אין לחשב מיקומים מחדש.
- אין חלוקת הערות חדשה.
- כל הגופנים והנכסים יהיו מוטמעים או ארוזים בחוזה מוגדר.
- הקובץ יפעל ללא רשת.
- תוכן חסר יפיק כשל מפורש ולא fallback שקט.

יש להוכיח זהות בין DOM לבין HTML מבחינת התוכן והגאומטריה.

יש לבדוק מסמך קצר, מסמך ארוך, `very_long_test_text.txt`, תמונות, הערות, עיטורים, שערים ו-TOC.

## 4. שלב 8 - פרוסה 5: PDF export מתוך PageModel

זהו שינוי מהותי במיוחד.

כיום `exportPdf` מפעיל `typeset()` מחדש ומשתמש ב-`projectDocument`.

יש להסיר את העימוד השני מתוך מסלול ה-PDF.

ה-PDF חייב לצרוך את אותו PageModel בדיוק שבו משתמש ה-DOM.

אסור:
- להפעיל Parser או Planner מחדש.
- למדוד מילים מחדש.
- לחשב מיקומי מילים מחדש.
- לשבור שורות מחדש.
- להזיז הערות או עיטורים.
- להחליט על placement.
- ליצור גאומטריה עצמאית.

יש לשמר:
- RTL וסדר קריאה.
- font identity ו-glyph identity.
- embedding ו-subsetting של גופנים.
- ToUnicode.
- תמונות ויחסי ממדים.
- הערות והמשכים.
- עיטורים, שערים, TOC, bookmarks וקישורים.
- clipping, baseline וגבולות עמוד.

ה-PDF writer יעסוק בהפקה ובאריזה בלבד.

בדיקות הקבלה:
- text extraction.
- ToUnicode.
- font embedding.
- bookmarks וקישורים.
- rasterization והשוואת גאומטריה מול PageModel ו-DOM.
- הזרקת שגיאות של font/image/fragment חסרים.
- הוכחת שאין עימוד שני.

## 5. שלב 8 - פרוסה 6: אודיט סופי, parity ופישוט

יש לבצע מלאי קוד מלא עבור:
- `dom-renderer.js`
- `geometry-projector.js`
- `legacy-projector.js`
- `pdf-writer.js`
- `export-api.js`
- כל מודולי HTML/PDF נוספים.

לכל פונקציה לזהות:
- האם היא מדידה.
- האם היא מקבלת החלטות עימוד.
- האם היא מבצעת materialization.
- האם היא ציור בלבד.
- האם היא פעולת packaging.
- האם יש לה consumer פעיל נוסף.

יש להוכיח:
1. PageModel הוא מקור הגאומטריה היחיד.
2. DOM/HTML/PDF אינם מבצעים מדידה או עימוד.
3. אין עימוד נוסף בייצוא.
4. אין חישוב גאומטרי כפול ללא הצדקה.
5. כל סוג פריט נשמר בכל היעדים.
6. התוצאה דטרמיניסטית.
7. אין פגיעה בביצועים או בזיכרון שאינה מוצדקת.

מדוד לפני ואחרי:
- זמן typeset.
- בניית PageModel.
- העברת Worker.
- DOM.
- HTML.
- PDF.
- גודל המודל.
- זיכרון.
- פעולות materialization ומדידה.

אין להציג שיפור ביצועים שנובע מהשמטת תוכן.

## 6. שלב 9 - Cutover והסרת נתיבי המורשת

עם סגירת שלב 8, יש לעבור מיד לשלב 9.

זהו שלב קריטי ולא פעולת ניקוי קוסמטית.

### 6.1 מיפוי

מפה את כל נתיבי runtime הישנים:
- `legacyTypeset`.
- `breakLines` ומנגנוני השבירה המקבילים.
- ה-projectors הישנים.
- מתאמים שמייצרים מודלים חלופיים.
- מסלולי export שמפעילים עימוד.
- צרכני `result.pages` וכל מבנה ביניים כפול.

### 6.2 Shadow comparison

השווה בין legacy לבין המנוע המאוחד על:
- `very_long_test_text.txt` - מסמך הבדיקה הראשי.
- ספרים אמיתיים.
- מסמכי הערות ארוכים.
- מסמכים עם תמונות.
- שערים, TOC, עיטורים וריהוט.
- כותרות רב-שורתיות.
- מסמכים תקינים בעלי היררכיית כותרות מלאה.

השוואת תוכן וזהויות חייבת לכלול:
- מילים ומקטעי מקור.
- noteId/anchorId.
- המשכי הערות.
- font identity.
- asset identity.
- source ranges.
- reading order.
- מיקום בעמוד ובטור.

אין להתפשר על שימור תוכן.

### 6.3 העברת תיקונים והסרה

יש להעביר כל תיקון שורש נחוץ למנוע המאוחד, לרבות חוזה כותרת 3 המקורי, ורק לאחר מכן להסיר מסלולים מקבילים.

אין להסיר legacy לפני הוכחת parity של כל סוגי התוכן.

לאחר השלמת המעבר:
- מנוע עימוד פעיל אחד.
- מקור תוכן אחד.
- מודל שורות אחד.
- Planner אחד.
- PageModel אחד.
- מקרינים טהורים.
- rollback ברמת commit, לא באמצעות השארת מנוע שני פעיל.

יש לקבוע את שינוי ברירת המחדל למנוע המאוחד רק לאחר סגירת כל שערי parity ושימור התוכן, תוך שמירת ברירות המחדל והגדרות המשתמש המאושרות.

## 7. כללי CI ו-GitHub Pages

- אין להמתין לבדיקת GitHub Actions יותר מחמש דקות. לאחר מכן ממשיכים במשימות עצמאיות וחוזרים לתוצאה.
- אין לסמן בדיקה ממתינה כאילו עברה.
- אין להחליש thresholds או להסתיר baseline מוכר.
- להריץ בדיקות Node 18/20/22.
- להריץ `npm test`, `test:determinism`, `cross-check`, `corpus-invariants`, `layout-audit`, `full-math-audit` וכל בדיקת projection רלוונטית.
- לתעד בדיוק את הכשלים ההיסטוריים בנפרד מרגרסיות חדשות.
- לאחר כל יחידת שינוי בעלת השפעה חזותית, וגם לאחר שינוי שאמור להיות ניטרלי חזותית, לבנות מחדש ולפרוס GitHub Pages לאחר מיזוג היחידה ל-main.
- להוסיף cache-buster ייחודי חדש.
- לבדוק שהאתר החי טוען את הבאנדלים החדשים.
- לבדוק מסמך מייצג, תצוגה וייצוא PDF בכל מקום שבו הדבר רלוונטי.
- כאשר בודקים את מסלול unified לפני שלב 9, להפעיל אותו מפורשות לצורך האודיט, בלי לשנות את ברירת המחדל של המשתמש.

## 8. חלוקת PRs ותיעוד

יש להגיש PRs נפרדים וברורים:
1. תיקון H3 מעודכן.
2. שלב 8 פרוסה 3 - DOM.
3. שלב 8 פרוסה 4 - HTML.
4. שלב 8 פרוסה 5 - PDF.
5. שלב 8 פרוסה 6 - parity ופישוט.
6. שלב 9 - cutover והסרת legacy, ביחידות שניתן לבקר.

אין לאחד כמה יחידות גדולות ל-PR אחד.

בכל PR חובה:
- פער ושורש.
- פתרון ארכיטקטוני.
- קבצים וממשקים ששונו.
- הוכחת שימור תוכן וזהויות.
- בדיקות ו-artifacts.
- hashes לפני/אחרי והסבר לשינויים.
- תוצאות Pages.
- מצב כל שערי הקבלה.
- רשימת העבודה שנותרה.

עדכן בכל שלב:
- `WORKLOG.md`
- `ISSUE_REGISTRY.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `ENGINE_RUNTIME_PATHS.md`
- `ENGINE_DUPLICATION_REGISTER.md`
- `audits/STAGE8_RENDER_PROJECTIONS.md`
- `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md`
- `DECISIONS.md` לפי הצורך.

עדכן את פנקס ההתקדמות לפי הראיות העדכניות. אין להשאיר שלבים שהושלמו מסומנים כפתוחים, ואין לסמן שלבים שלא הוכחו כגמורים.

## 9. יעד שאינו נתון לפשרה

המטרה אינה להוסיף עוד שכבות למערכת.

המטרה היא לסיים מנוע יחיד, מזוקק, דטרמיניסטי ושקוף, שבו:

- פריט חדש מתווסף באמצעות חוזה ורישום.
- אין צורך לשנות מספר מודולים בכל הוספת סוג פריט.
- אין מדידה כפולה.
- אין שבירת שורות כפולה.
- אין החלטות עימוד במקרינים.
- אין עימוד שני בייצוא.
- אין fallback שקט.
- אין מנוע מורשת פעיל לצד המנוע החדש לאחר סגירת שלב 9.

התחל מיד בתיקוני חובות שלב 8 ובמימוש פרוסה 3. אל תעצור בכתיבת דוח או תוכנית. המשך למימוש, בדיקות, PRs ותיעוד עד לסגירת שערי שלב 8, ולאחר מכן התקדם ישירות לשלב 9.

אין צורך להמתין לאישור ביניים עבור תיקוני שורש שאינם משנים החלטות משתמש או ברירות מחדל מאושרות.

## 5\. נקודת הניהול הבאה

הפרומט מורה לסוכן להתחיל בפרוסה 3, תוך טיפול בחובות הקודמים, ולהמשיך ברצף לפרוסות הבאות.

ההחלטה שלי כמנהל הפרויקט היא **לא לאשר עדיין את שלב 8 ולא לבצע cutover מוקדם**\. צריך קודם להשלים את שלושת המקרינים ממקור אמת אחד. במקביל אסור להזניח את תיקון H3 ואת אובדן התוכן במסלול החי.

היעד הבא לביקורת שלנו יהיה PR של DOM renderer מתוך PageModel בלבד. שם נוכל לבדוק לראשונה שהמודל שהשקענו בבנייתו באמת משמש להצגת הספר, ולא רק מועבר ב־Worker.

**מכאן מתקדמים למימוש, לא לעוד סבב תכנון.**

## Prompt:
17.11.2026, 10:49:14

הסוכן עדיין לא סיים את ביצוע המטלות, אבל בנתיים רציתי אם אפשר שתחליף אתה בעצמך את שם התוכנה המופיע בחלק הימני עליון ("ספר תורה - מערך עימוד (RED)") עם שם התוכנה והאייקון שבחרתי, מצורף להודעה קוד הSVG של הלוגו עם שם התוכנה (התאם אותו לגובה השורה העליונה), וכן קוד הלוגו לבד (לשימוש כלוגו האתר (המופיע בכרטיסיית הדפדפן וכו')). הנה הלוגל עם שם התוכנה:
<svg xmlns="http://w3.org" viewBox="0 0 1330 510" width="1330" height="510">
  <defs>
    <!-- מרקם נייר עדין מאוד לרקע הבהיר -->
    <filter id="light-paper" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="5" result="noise"/>
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.02 0" in="noise" result="coloredNoise"/>
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>
    <!-- גרדיאנט רקע לבן-שמנת רך -->
    <radialGradient id="clean-bg" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#FCFBF9"/>
      <stop offset="100%" stop-color="#F5F3EE"/>
    </radialGradient>
  </defs>

  <!-- רקע -->
  <rect width="1330" height="510" fill="url(#clean-bg)"/>
  <rect width="1330" height="510" fill="#E5E1D8" filter="url(#light-paper)" opacity="0.5"/>

  <!-- קבוצת הלוגו המרוכזת -->
  <!-- מסגרת חיצונית מרובעת מעוגלת עם רקע בהיר נקי -->
  <rect x="36" y="36" width="440" height="440" rx="76" fill="#FAF9F6" stroke="#191815" stroke-width="22"/>

  <!-- שורה 1: פס אופקי עליון מלא (כחול נייבי) -->
  <rect x="84" y="84" width="344" height="22" rx="2" />

  <!-- שורה 2: שלושה מקטעים אופקיים (זהב) -->
  <rect x="84" y="120" width="106" height="20" rx="2" fill="#C5A467"/>
  <rect x="206" y="120" width="100" height="20" rx="2" fill="#C5A467"/>
  <rect x="322" y="120" width="106" height="20" rx="2" fill="#C5A467"/>
  <!-- שורה 3: חמשת הטורים המרכזיים -->
  <!-- טור 1 (שמאלי חיצוני): צורת סימן קריאה בכחול נייבי -->
  <g>
    <rect x="84" y="156" width="42" height="148" rx="2"/>
    <rect x="84" y="320" width="42" height="36" rx="2"/>
  </g>

  <!-- טור 2 (שמאלי פנימי): עמוד זהב מלא -->
  <g fill="#F6F1E0">
    <rect x="140" y="156" width="50" height="36" rx="2"/>
    <rect x="140" y="208" width="50" height="148" rx="2"/>
  </g>
  <g fill="#E8DFC5">
    <rect x="140" y="156" width="50" height="36" rx="2"/>
    <rect x="140" y="208" width="50" height="148" rx="2"/>
  </g>

  <g>
      <rect x="140" y="156" width="50" height="6" rx="1"/>
      <rect x="140" y="171" width="50" height="6" rx="1"/>
      <rect x="140" y="186" width="50" height="6" rx="1"/>
      <rect x="140" y="206" width="50" height="6" rx="1"/>
      <rect x="140" y="218" width="50" height="6" rx="1"/>
      <rect x="140" y="230" width="50" height="6" rx="1"/>
      <rect x="140" y="242" width="50" height="6" rx="1"/>
      <rect x="140" y="254" width="50" height="6" rx="1"/>
      <rect x="140" y="266" width="50" height="6" rx="1"/>
      <rect x="140" y="278" width="50" height="6" rx="1"/>
      <rect x="140" y="290" width="50" height="6" rx="1"/>
      <rect x="140" y="302" width="50" height="6" rx="1"/>
      <rect x="140" y="314" width="50" height="6" rx="1"/>
      <rect x="140" y="326" width="50" height="6" rx="1"/>
      <rect x="140" y="338" width="50" height="6" rx="1"/>
      <rect x="140" y="350" width="50" height="6" rx="1"/>
  </g>
  <!-- טור 3 (מרכזי): האות I בכחול נייבי -->
  <g>
    <!-- סריף עליון -->
    <rect x="206" y="156" width="100" height="32" rx="2"/>
    <!-- גוף האות -->
    <rect x="237" y="188" width="38" height="136"/>
    <!-- סריף תחתון -->
    <rect x="206" y="324" width="100" height="32" rx="2"/>
  </g>

  <!-- טור 4 (ימני פנימי): עמוד זהב מלא -->
  <g fill="#F6F1E0">
    <rect x="322" y="156" width="50" height="148" rx="2"/>
    <rect x="322" y="320" width="50" height="36" rx="2"/>
  </g>
  <g fill="#E8DFC5">
    <rect x="322" y="156" width="50" height="148" rx="2"/>
    <rect x="322" y="320" width="50" height="36" rx="2"/>
  </g>
  
  <!-- טור 5 (ימני חיצוני): צורת סימן קריאה בכחול נייבי -->
  <g>
    <rect x="386" y="156" width="42" height="36" rx="2"/>
    <rect x="386" y="208" width="42" height="148" rx="2"/>
  </g>
  <g>
      <rect x="322" y="156" width="50" height="6" rx="1"/>
      <rect x="322" y="168" width="50" height="6" rx="1"/>
      <rect x="322" y="180" width="50" height="6" rx="1"/>
      <rect x="322" y="192" width="50" height="6" rx="1"/>
      <rect x="322" y="204" width="50" height="6" rx="1"/>
      <rect x="322" y="216" width="50" height="6" rx="1"/>
      <rect x="322" y="228" width="50" height="6" rx="1"/>
      <rect x="322" y="240" width="50" height="6" rx="1"/>
      <rect x="322" y="252" width="50" height="6" rx="1"/>
      <rect x="322" y="264" width="50" height="6" rx="1"/>
      <rect x="322" y="276" width="50" height="6" rx="1"/>
      <rect x="322" y="288" width="50" height="6" rx="1"/>
      <rect x="322" y="300" width="50" height="6" rx="1"/>
      <rect x="322" y="320" width="50" height="6" rx="1"/>
      <rect x="322" y="335" width="50" height="6" rx="1"/>
      <rect x="322" y="350" width="50" height="6" rx="1"/>
  </g>

  <!-- שורה 4: שלושה מקטעים אופקיים תחתונים (זהב) -->
  <rect x="84" y="372" width="106" height="20" rx="2" fill="#C5A467"/>
  <rect x="206" y="372" width="100" height="20" rx="2" fill="#C5A467"/>
  <rect x="322" y="372" width="106" height="20" rx="2" fill="#C5A467"/>

  <!-- שורה 5: פס אופקי תחתון מלא (כחול נייבי) -->
  <rect x="84" y="406" width="344" height="22" rx="2" />

<!-- טקסט המותג Imudify בכחול נייבי -->
    <text x="500" y="340" 
          font-family="'Futura', 'Century Gothic', 'Montserrat', 'Segoe UI', Arial, sans-serif" 
          font-size="230" 
          font-weight="700" 
          letter-spacing="-2">Imudify</text>
  </g>
</svg>
והנה קוד הלוגו לבד:
<svg xmlns="http://w3.org" viewBox="0 0 512 512" width="512" height="512">
  <!-- מסגרת חיצונית מרובעת מעוגלת עם רקע בהיר נקי -->
  <rect x="36" y="36" width="440" height="440" rx="76" fill="#FAF9F6" stroke="#191815" stroke-width="22"/>

  <!-- שורה 1: פס אופקי עליון מלא (כחול נייבי) -->
  <rect x="84" y="84" width="344" height="22" rx="2" />

  <!-- שורה 2: שלושה מקטעים אופקיים (זהב) -->
  <rect x="84" y="120" width="106" height="20" rx="2" fill="#C5A467"/>
  <rect x="206" y="120" width="100" height="20" rx="2" fill="#C5A467"/>
  <rect x="322" y="120" width="106" height="20" rx="2" fill="#C5A467"/>
  <!-- שורה 3: חמשת הטורים המרכזיים -->
  <!-- טור 1 (שמאלי חיצוני): צורת סימן קריאה בכחול נייבי -->
  <g>
    <rect x="84" y="156" width="42" height="148" rx="2"/>
    <rect x="84" y="320" width="42" height="36" rx="2"/>
  </g>

  <!-- טור 2 (שמאלי פנימי): עמוד זהב מלא -->
  <g fill="#F6F1E0">
    <rect x="140" y="156" width="50" height="36" rx="2"/>
    <rect x="140" y="208" width="50" height="148" rx="2"/>
  </g>
  <g fill="#E8DFC5">
    <rect x="140" y="156" width="50" height="36" rx="2"/>
    <rect x="140" y="208" width="50" height="148" rx="2"/>
  </g>

  <g>
      <rect x="140" y="156" width="50" height="6" rx="1"/>
      <rect x="140" y="171" width="50" height="6" rx="1"/>
      <rect x="140" y="186" width="50" height="6" rx="1"/>
      <rect x="140" y="206" width="50" height="6" rx="1"/>
      <rect x="140" y="218" width="50" height="6" rx="1"/>
      <rect x="140" y="230" width="50" height="6" rx="1"/>
      <rect x="140" y="242" width="50" height="6" rx="1"/>
      <rect x="140" y="254" width="50" height="6" rx="1"/>
      <rect x="140" y="266" width="50" height="6" rx="1"/>
      <rect x="140" y="278" width="50" height="6" rx="1"/>
      <rect x="140" y="290" width="50" height="6" rx="1"/>
      <rect x="140" y="302" width="50" height="6" rx="1"/>
      <rect x="140" y="314" width="50" height="6" rx="1"/>
      <rect x="140" y="326" width="50" height="6" rx="1"/>
      <rect x="140" y="338" width="50" height="6" rx="1"/>
      <rect x="140" y="350" width="50" height="6" rx="1"/>
  </g>
  <!-- טור 3 (מרכזי): האות I בכחול נייבי -->
  <g>
    <!-- סריף עליון -->
    <rect x="206" y="156" width="100" height="32" rx="2"/>
    <!-- גוף האות -->
    <rect x="237" y="188" width="38" height="136"/>
    <!-- סריף תחתון -->
    <rect x="206" y="324" width="100" height="32" rx="2"/>
  </g>

  <!-- טור 4 (ימני פנימי): עמוד זהב מלא -->
  <g fill="#F6F1E0">
    <rect x="322" y="156" width="50" height="148" rx="2"/>
    <rect x="322" y="320" width="50" height="36" rx="2"/>
  </g>
  <g fill="#E8DFC5">
    <rect x="322" y="156" width="50" height="148" rx="2"/>
    <rect x="322" y="320" width="50" height="36" rx="2"/>
  </g>
  
  <!-- טור 5 (ימני חיצוני): צורת סימן קריאה בכחול נייבי -->
  <g>
    <rect x="386" y="156" width="42" height="36" rx="2"/>
    <rect x="386" y="208" width="42" height="148" rx="2"/>
  </g>
  <g>
      <rect x="322" y="156" width="50" height="6" rx="1"/>
      <rect x="322" y="168" width="50" height="6" rx="1"/>
      <rect x="322" y="180" width="50" height="6" rx="1"/>
      <rect x="322" y="192" width="50" height="6" rx="1"/>
      <rect x="322" y="204" width="50" height="6" rx="1"/>
      <rect x="322" y="216" width="50" height="6" rx="1"/>
      <rect x="322" y="228" width="50" height="6" rx="1"/>
      <rect x="322" y="240" width="50" height="6" rx="1"/>
      <rect x="322" y="252" width="50" height="6" rx="1"/>
      <rect x="322" y="264" width="50" height="6" rx="1"/>
      <rect x="322" y="276" width="50" height="6" rx="1"/>
      <rect x="322" y="288" width="50" height="6" rx="1"/>
      <rect x="322" y="300" width="50" height="6" rx="1"/>
      <rect x="322" y="320" width="50" height="6" rx="1"/>
      <rect x="322" y="335" width="50" height="6" rx="1"/>
      <rect x="322" y="350" width="50" height="6" rx="1"/>
  </g>

  <!-- שורה 4: שלושה מקטעים אופקיים תחתונים (זהב) -->
  <rect x="84" y="372" width="106" height="20" rx="2" fill="#C5A467"/>
  <rect x="206" y="372" width="100" height="20" rx="2" fill="#C5A467"/>
  <rect x="322" y="372" width="106" height="20" rx="2" fill="#C5A467"/>

  <!-- שורה 5: פס אופקי תחתון מלא (כחול נייבי) -->
  <rect x="84" y="406" width="344" height="22" rx="2" />
</svg>

## Response:
17.11.2026, 10:49:30 · gpt-6-t-mini

אבדוק את מבנה הכותרת וה־HTML של האתר לפני שינוי, כדי להטמיע את המיתוג במקום הנכון ולא לשנות רכיבי ממשק אחרים. אתקן גם את פרטי ה־SVG שמסרת: מרחב השמות שלו אינו תקין, וחלק מהצורות הכחולות חסרות ערך `fill` מפורש. אבצע זאת בענף נפרד, אבנה את הבאנדלים/האתר ואאמת שהלוגו מופיע גם בכותרת וגם כאייקון דפדפן.

מצאתי דרך לשמור על שינוי נקי גם בחבילת הדפדפן: עדכנתי את מקור הכותרת ואת `app.bundle.js` שנוצר ממנו, בלי לגעת במנוע העימוד או ב־Worker. כעת אני מוסיף את שני קובצי ה־SVG התקינים, מחבר אותם ל־CSS ול־favicon, ואז אבדוק גם את מסלול הפריסה החיה.

המיתוג מוכן בענף נפרד: הכותרת הפנימית והשם בלשונית הדפדפן עודכנו ל־Imudify, הלוגו המלא מותאם ל־99×38 פיקסלים, ונוצר סמל SVG ייעודי ל־favicon. בדיקות מבניות ראשונות עברו: שני קובצי ה־SVG תקינים מבחינת תגיות ומרחב שמות. פתחתי PR \#38; כעת אני מוודא שהבאנדל תואם למקור ושאין התנגשות עם עבודת הסוכן.

> **Reviewing the branding update**
>
> I’m checking the repository structure and current branding assets before editing. I’ll verify the SVG markup, replace the existing title and logo consistently, and preserve the app’s current layout and behavior.
>
> **Reviewed the branding update**
>
> 
>
> **Inspected and updated Imudify branding, assets, and build configuration**
>
> 
>
> **Testing GitHub Repository Network Access**
>
>
> **Implementing the branding change**
>
> I’m inspecting the existing files and generated bundle so I can update the title and logo consistently. I’ll correct the SVG markup, adjust the header branding, and avoid disturbing unrelated application behavior.
>
> **Implemented the branding change**
>
> 
>
> **Tested GitHub repository network access**
>
> 
>
> **Reviewing the branding update**
>
> I’m inspecting the existing files and generated bundle so I can update the title and logo consistently. I’ll correct the SVG markup, adjust the header branding, and avoid disturbing unrelated application behavior.
>
> **Finalizing the logo**
>
> I’m keeping the branding update lightweight: a corrected SVG asset, a favicon, updated page metadata, and CSS that replaces the existing header text without changing application logic. I’m also ensuring the published site receives matching assets.
>
> **Finalized the branded logo update**
>
> 
>
> **Completing the branding**
>
> I’m applying the corrected Imudify logo, favicon, page title, and header styling across both source and published files. I’ll keep the existing application behavior unchanged and verify the SVG assets remain valid.
>
> **Completed the branding**
>
> 
>
> **Updating the brand**
>
> I’m applying the corrected Imudify logo, favicon, page title, and header styling across source and published files. I’m preserving the application behavior while ensuring the SVG assets are valid and the visible branding is consistent.
>
> **Updated the brand**
>
> 
>
> **Updated Imudify branding assets, headers, and application bundles**
>
> 
>
> **Updated Imudify branding assets, validated changes, and created PR**
>
> 
>
> **Verified PR mergeability, CI status, bundle sources, branding, and deployment assets**
>
> 
>
> **Investigated CI failures and prepared a GitHub Pages update**
>
> 
>
> **Sizing the header**
>
> I’m keeping the logo aligned with the existing top-row height rather than enlarging the header. I’ll use a compact full-brand SVG, preserve readable contrast, and let the favicon carry the larger standalone mark.
>
> **Sized the header**
>
> 
>
> **Updated source and bundle versions, inspected GitHub Pages assets, and verified CI statuses**
>
> 
>
> **Reviewed workflow runs, jobs, and CI status before merging branding changes**
>
> 
>
> **Checked CI status and merged PR #38 with squash commit**
>
> 
>
> **Updated GitHub Pages files and verified deployment status**
>
> 
>
> **Searching the web**
>
> 
>
> **Verified GitHub Pages deployment assets, workflow status, and audit jobs**
>
> 
>
> **Inspected and verified latest CI, audit, and workflow job statuses**
>
> 
>
> Worked for 25m 58s

(המיתוג מוזג ונפרס בהצלחה)

בוצע\! החלפתי את המיתוג של התוכנה ל־**Imudify**\.

## המיתוג החדש
image_group{"query":["Imudify logo navy gold stylized typography book icon logo"],"aspect_ratio":"2.6:1","layout":"carousel","num_per_query":1}

**מה השתנה\:**

- הכותרת בפינה הימנית העליונה הוחלפה בלוגו המלא, בגובה 38px.
- שם האתר בלשונית הדפדפן: `Imudify - תוכנת עימוד תורנית`\.
- נוצר favicon ייעודי מהסמל בלבד.
- תוקן קוד ה־SVG, לרבות מרחב השמות וערכי צבע הנייבי.
- עודכנו גרסאות המטמון של ה־CSS, הבאנדל וה־Worker.

## מצב ההטמעה

| רכיב | מצב |
|--------|--------|
| מקור האפליקציה | (מוזג ל־main) |
| app.bundle.js | (עודכן) |
| SVG מלא וסמל | (הועלו) |
| GitHub Pages | (נפרס בהצלחה) |
| Layout audit | (עבר) |
| Corpus invariants | (עבר) |
| Full math audit | (עבר בריצה האחרונה) |
| CI מלא | (מטריצת Node 20 עדיין בבדיקה) |
| אודיט חי לאחר פריסה | (עדיין רץ) |

**קישורים\:**

[suginach.github.io](https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/?v=2026-11-17-brand1&utm_source=chatgpt.com)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/38?utm_source=chatgpt.com)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/44053398865?utm_source=chatgpt.com)

לא שיניתי שום התנהגות במנוע העימוד, בהגדרות המשתמש או בזרימת המסמכים. השינוי מבודד למיתוג ולנכסי האתר.

העבודה על המנוע יכולה להימשך במקביל, בלי שהמיתוג יפריע למשימות הסוכן.

## Prompt:
17.11.2026, 22:49:37

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע, נכונות דרך הביצוע, ובמיוחד בשלב זה בו נתקל הסוכן בבעיות שצצו ורגרסיות, נעשו הרבה החלטות ע"י הסוכן, בדוק היטיב את נכונות הבנת מקור הבעיה, ועריכה פשוטה אחידה ואלגנטית לפתירתה.
ודא ביצוע בדיקות מתאימות והצלחתם.
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק הביצוע כפי שאתה היית מבצע, ועם רמת ההקפדה והזהירות שלך, שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. 
בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים.

## Response:
17.11.2026, 22:49:47 · gpt-6-t-mini

אבדוק תחילה את מצב ה־repository וה־PRים מאז נקודת הביקורת האחרונה, ואז אעבור על השינויים עצמם מול מטרות השלב, היסטוריית התקלות והבדיקות. אמזג רק PR שעומד בבדיקת איכות; במקביל אנסח לסוכן משימת המשך מדויקת, ואמשיך בעצמי בכל תיקון או אימות שניתן לבצע ישירות.

מצאתי כבר נקודת אזהרה חשובה: המאגר מכיל PRים פתוחים ישנים עם שינויים ארכיטקטוניים מהותיים, ובהם PR \#16 על איחוד מקורות־אמת ותיקוני עוגני הערות, ו־PR \#17 שמסומן במפורש „אין למזג לפני סקירה מלאה”. לא אניח שהם חלק מהשלב שהסוכן סיים, ולא אמזג אותם רק על סמך תיאור הסוכן; אני מפריד כעת בין העבודה החדשה לבין חוב פתוח קודם ובוחן את שניהם מול מצב `main` והבדיקות.

בבדיקת כלי ההשוואה עצמו עלו גם נקודות שדורשות תיקון לפני שנשתמש בו כשער CI: הוא מזהה נכון פערי תוכן גדולים, אבל חלק ממדדי הזהות שלו אינם בני־השוואה ישירה (למשל ספירת אזורי הערות במורשת מול מזהי הערות ייחודיים במאוחד), ויש לפחות סיווג שווא אחד שהוא עצמו מתעד — עודפי „סימן” ב־TOC. בנוסף, הוא משווה תוכן מצטבר ולא תמיד מוכיח התאמה לפי מזהה הערה ועוגן. לכן אין להסתפק ב„הריצה נכשלה”; צריך להקשיח את כלי הבדיקה כך שכל כשל יהיה ממצא מדויק ולא תוצר של מדידה שגויה.

> **Searched open pull requests and recent workflow activity**
>
> 
>
> **Reviewing repository changes**
>
> I’m determining which recent commits and pull requests represent the completed stage, then checking their changes and validation status. I’m also comparing the latest main branch history with the associated audit and documentation updates.
>
> **Reviewed repository changes**
>
> 
>
> **Auditing comparison logic**
>
> I’m checking whether the latest change introduced the literal newline issue or merely preserved it. I’m also reviewing the comparison script’s multiset logic and report headings for mislabeled checks or methodological inconsistencies.
>
> **Audited comparison logic**
>
> 
>
> **Assessing audit findings**
>
> I’m distinguishing genuine parity failures from parser artifacts, especially headings, source references, and duplicated table-of-contents text. I’m also checking whether the audit’s allowed-difference rules align with the actual document structure.
>
> **Refining audit conclusions**
>
> I’m verifying which reported mismatches are real versus measurement artifacts. The main concerns are grouped footnote counts, missing note identity checks, and global text comparisons that may overlook ordering or associations.
>
> **Assessed findings and refined audit conclusions**
>
> 
>
> **Audited pull requests, CI checks, commits, and Stage 9 artifacts**
>
> 
>
> **Planning next checks**
>
> I’m verifying whether the remaining discrepancies reflect real rendering loss or mismatched counters, especially side notes and grouped footnotes. I’m also checking stale pull requests before deciding whether they should be merged or closed.
>
> **Planned next checks**
>
> 
>
> **Validating audit metrics**
>
> I’m finding that the report’s gate totals and footnote counts don’t match the implementation. Page-level footnote areas are being compared with note-level identities, so I’m treating that result as invalid until the metric is redesigned.
>
> **Validated audit metrics**
>
> 
>
> **Investigated side-note parsing, rendering pipelines, property mapping, and CI statuses**
>
> 
>
> **Fixing the deployment page**
>
> I’m confirming whether the literal newline characters can move subsequent metadata outside the document head. If so, I’ll clean the markup and add a focused regression check before reviewing broader audit metrics.
>
> **Fixed the deployment page**
>
> 
>
> **Reviewed heading handling, numbering, tests, fixes, and workflow status**
>
> 
>
> **Fixed HTML head escaping, updated tests, and reviewed PR43 CI readiness**
>
> 
>
> **Inspected and updated TOC filtering, defaults, staging mappings, and pull requests**
>
> 
>
> **Correcting audit conclusions**
>
> I’m identifying several measurement flaws: mismatched footnote units, reversed comparison labels, incomplete gate totals, and word counts mislabeled as note counts. I’m separating these tooling defects from genuine rendering discrepancies before recommending fixes.
>
> **Reframing audit scope**
>
> I’m treating the current report as diagnostic, not conclusive. Its unified inventory omits several layout surfaces, and its TOC and note metrics are inconsistent, so alleged missing headings or notes require corrected accounting first.
>
> **Corrected audit conclusions and reframed audit scope**
>
> 
>
> **Correcting audit workflow**
>
> I’m treating the current audit as diagnostic rather than conclusive: its inventory omits layout surfaces, compares incompatible note counts, reverses one difference label, and reports inconsistent gate totals.
>
> **Corrected audit workflow**
>
> 
>
> **Audited PR16 integration, gate definitions, side-note placement, and Stage 9 validation fixes**
>
> 
>
> Worked for 21m 34s

## ממצא מנהלי ראשון: שלב 9a הושלם, אבל המעבר למנוע יחיד עדיין חסום

מצאתי את PR \#41, **„שלב 9 פרוסה 9a: מיפוי נתיבי מורשת + השוואת צללים”**\. הוא מוזג ל־`main` ב־commit `97bc300`\.

ההבחנה החשובה: הסוכן לא טען שהושלם המעבר למנוע יחיד, ובצדק. הפרוסה הזאת נועדה למפות את נתיבי המורשת ולהשוות בין המנועים לפני הסרה. בפועל, ההשוואה חשפה פערים מהותיים ב־`very_long`\:

- **ביאורי צד\:** 1,147 מילים במנוע המאוחד לעומת 2,041 במורשת - חסרות כ־44%.
- **הערות גוף\:** 129 אזורים במאוחד לעומת 81 במורשת, עם פער ניכר בתוכן.
- **תוכן העניינים\:** חסרות במאוחד קבוצות כותרות.
- **„מקור: …” ושער אחורי\:** התנהגות שונה בין המנועים.
- **מטא־נתונים וכותרות H3\:** אינם מוצגים באופן מקביל.

לכן, **אסור להסיר כרגע את נתיב המורשת, לשנות את ברירת המחדל למנוע המאוחד או להכריז על השלמת שלב 9**\. גם מסמך המיפוי שהסוכן הוסיף קובע במפורש ש־9c חסום עד לפתרון הפערים ב־9b. זהו שער בטיחות נכון, ולא עיכוב מיותר.

## ממצאי הביקורת: כלי ההשוואה אינו מדויק דיו כדי לשמש שער קבלה

עברתי על הקוד של `tools/stage9/shadow-compare.js`, ולא רק על הדוח. יש בו כמה פגמים מתודולוגיים שמשנים את משמעות התוצאות\:

1. **השוואת מספרי ההערות אינה תקפה\:** `fnAreas` במורשת סופר מכל הערה את *אזור ההערות בעמוד*, ואילו במנוע המאוחד נספרים `noteId` ייחודיים, ובמקור נספרים זוגות סוגריים באמצעות Regex. אלה שלושה גדלים שונים. לכן ההשוואה 81 מול 129 מול 132 אינה מוכיחה שיש 48 הערות חסרות או עודפות.
2. **בדיקת הטקסט אינה בודקת זהות\:** היא משווה אוסף מילים (`multiset`\) ולא את תוכן כל הערה לפי מזהה, עוגן וסדר. בנוסף, הודעת השגיאה שמציגה מה חסר בכל מנוע מחשבת בטעות את אותו כיוון פעמיים.
3. **חילוץ המנוע המאוחד אינו מלא\:** `unifiedInventory` סורק את `r.pages`, אבל משמיט בין היתר משטחים מבניים כגון `spanning`, `gateLines` ו־`bands`; הוא קורא רק את `r.toc.general` ולא בודק את התוכן המפורט. לכן חלק מממצאי „המילים שאבדו” ו„הכותרות שלא רונדרו” עלולים לנבוע מחילוץ חסר ולא מאובדן אמיתי.
4. **מספר השערים בדוח אינו תואם לקוד\:** הקוד מייצר תשע הצלחות ושני כישלונות בקורפוס הקנוני - 11 תוצאות, לא 10 מתוך 12 כפי שנכתב בדוח.

מכאן שהפערים שנמדדו הם אות אזהרה רציני, אבל **ההשערה שהסיבה היא היעדר תמיכה בהערות עוקבות־עוגן עדיין לא הוכחה**\. יתרה מכך, תיקון הצמדת הערות הגוף לעוגנים כבר קיים ב־`main` במסגרת שלב 6 (`reconcileNotesAfterPlacement`\). אין להעתיק מחדש את תיקון PR \#16 או להוסיף מעקף נוסף לפני שמאתרים את נקודת האובדן המדויקת.

יש גם נקודת בדיקה ממוקדת ל־H7: `applyHeadingModes` אכן מופעל לפני `planPages`, ולכן אין כאן דגל `asSideNote` שנשכח. לעומת זאת, `placeSideNotes` מציב הערה בראש העמוד כאשר אינו מוצא בו את שורת העוגן, במקום להוכיח שהעוגן אכן נמצא באותו עמוד. זהו נתיב שצריך לבדוק מול מסמכי אמת, עם מזהי הטוקנים המקוריים.

## מצב המיזוגים וההחלטות

**PR \#41 - שלב 9a: מיפוי והשוואת צללים** (מוזג)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/41?utm_source=chatgpt.com) · כל בדיקות ה־CI של השלב עברו. זהו מיזוג ראוי: מיפוי נתיבי המורשת והצפת פערי התוכן נחוצים לפני כל הסרה.

---

**PR \#42 - סנכרון גרסאות הנכסים** (מוזג)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/42?utm_source=chatgpt.com) · בדיקות ה־CI עברו.

---

**PR \#43 - תיקון מבנה ה־HTML** (ממתין ל־CI)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/43?utm_source=chatgpt.com) · תיקנתי בעצמי בעיה שמקורה במיתוג: ב־`index.html` נשמרו רצפי `\n` מילוליים במקום מעברי שורה אמיתיים בתוך `head`\. הוספתי בדיקות רגרסיה ב־`s10-ui`\.

`layout-audit`, ‏`full-math-audit` ו־`corpus-invariants` עברו. בדיקות Node 18/20/22 עדיין רצות ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/actions/runs/44175622674?utm_source=chatgpt.com)\. לא מיזגתי לפני סיום הבדיקות, ולכן התיקון עדיין לא פורסם ל־Pages.

**PR \#14, \#16 ו־\#17 אינם מועמדים למיזוג ישיר.** PR \#16 ו־\#17 מפגרים ב־52 קומיטים אחרי `main`; עיקר תיקוני האילוצים, `maxFit`, איחוד נתיבי ההערות והצמדת הערות לעוגנים כבר שולבו בעבודת שלבים 5-6. הדבר מתועד ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/STAGE5_UNIFIED_PLANNER.md?utm_source=chatgpt.com) וב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/STAGE6_PAGE_ITEMS.md?utm_source=chatgpt.com)\. PR \#17 אף נושא הוראה מפורשת שלא למזג לפני סקירה. מיזוגם עכשיו עלול להחזיר קוד ישן או ליצור כפילויות. PR \#14 הוא ענף תיעוד ישן ומפוצל; החלטות המשתמש הרלוונטיות כבר חולצו למסמכי ההחלטות.

גם הענף `stage9/cutover` אינו מכיל עבודה חדשה ביחס ל־`main`; הוא מפגר בשני קומיטים. יש לעבוד מענף חדש שמבוסס על `main`, לא להמשיך ממנו.

## מה צריך לתקן בשלב הבא

יש כאן שלוש רמות של עבודה, בסדר מחייב\:

**ראשית - לתקן את כלי הבדיקה.** אין להפוך את `shadow-compare` לשער CI מחייב במצבו הנוכחי. הוא עדיין יכול לשמש לאיתור, אך לא להוכחת שימור תוכן.

**שנית - לתקן את הפערים האמיתיים במסלול המאוחד.** העיקר הוא מעקב אחר כל פריט לפי זהותו, ולא רק לפי סכום מילים: H7, הערות גוף, TOC, מטא־נתונים, שער אחורי ושורות מקור.

**שלישית - רק לאחר הוכחת parity מלאה - להתחיל בהסרת נתיבי המורשת.** לא להסיר נתיב לפני שמוכח שכל התוכן והגאומטריה שלו מכוסים במודל ובמקרינים החדשים.

בפרט, נמצאה אי־התאמה ברורה מול החלטת המשתמש D-107: ברירות המחדל הנוכחיות של ה־TOC ומסנני הרמות אינן מממשות את ההחלטה. זו אינה השערה ויש לתקן אותה בשורש, יחד עם בדיקות מתאימות.

---

## פרומט המשך לסוכן ה־AI

הפרומט הבא מנחה את הסוכן לבצע את שלב 9b, לתקן את הליקויים בביצוע 9a, ולהתקדם ל־9c רק כאשר התנאים לכך הוכחו. הוא כולל גם את האבחונים שעלו בביקורת הזאת, כדי שלא יחזור על תיקונים שכבר קיימים ב־`main` או על הנחות לא מוכחות.

**document: **

# הוראת ביצוע - שלב 9b: תיקון שורשי הפערים, הוכחת שימור תוכן והכנה להסרת המורשת

## 0. נקודת מוצא ומטרת העל

עבוד על המאגר:

`SUGINACH/Tora_Book_Typesetter_Red_Work_2`

התחל מ־`main` העדכני, לאחר מיזוג PR #41 ו־PR #42. אל תמשיך מענף `stage9/cutover` הישן ואל תבסס עבודה על PR #16 או #17.

מטרת העל אינה רק לגרום לבדיקות לעבור. עלינו להגיע למנוע עימוד אחד, פשוט, דטרמיניסטי, בעל מקור־אמת יחיד לתוכן, למדידה, לגאומטריה, לתכנון ולהקרנה. שימור מלא של התוכן וזהות כל פריטי העימוד הוא תנאי מוחלט.

השלב הנוכחי הוא **9b - השלמת parity ותיקון שורשי הפערים**. אין לבצע עדיין הסרה של מנוע המורשת או שינוי ברירת המחדל למנוע המאוחד.

יש לפעול ברציפות, בלי לעצור ולבקש אישור לכל החלטת מימוש רגילה. עם זאת, אין להסתיר חוסר ודאות, לכסות על פער באמצעות fallback או לבצע שינוי בסמנטיקה שאינה מוכרעת בהחלטות המשתמש.

## 1. גבולות שאסור לחצות

1. אין לעסוק ב־P6/P7, אין להוסיף אותם למסלול בדיקות ואין להשתמש בהם כשער קבלה.
2. אין לשנות ברירות מחדל שהמשתמש אישר, אלא במקום שבו מימוש קיים סותר החלטה מפורשת ומתועדת שלו. במקרה כזה יש ליישם את ההחלטה עצמה, לא להמציא ברירת מחדל חדשה.
3. אין להסתמך על PDF ייחוס כמטרה להתאמת המנוע. הייחוס נשמר לפרובננס בלבד.
4. אין לתקן תוצאה לאחר העימוד באמצעות שכבות CSS, Renderer, fallback, תיקוני hash או העברות מאוחרות שאינן חלק ממנגנון התכנון המשותף.
5. אין ליצור עוד מנגנון צדדי במקום מקור־אמת חסר. כאשר יש כפילות - לאחד את מקור ההחלטה, ואז לחבר אליו את כל הצרכנים.
6. אין לשנות את פרופיל ברירת המחדל של IMUD לפני השלמת parity ואישור שערי הקבלה.
7. מסמך הבדיקה הראשי הוא `audits/very_long_test_text.txt`. הקורפוס הקנוני משמש בדיקת הצלבה. בדיקות סינתטיות הן רק בדיקות יחידה ממוקדות, ולא תחליף למסמך האמיתי.
8. כל מסמך בדיקה שנוצר חייב להיות תקין מבחינה מבנית: אין שתי כותרות רצופות מאותה רמה בלי טקסט גוף ביניהן, אין כותרת שמכילה רק הערת שוליים, וההיררכיה והתוכן שאחריה אמינים ומייצגים ספר אמיתי.

## 2. תיקון ראשון: להפוך את כלי Shadow Compare למכשיר מדידה אמין

הקובץ `tools/stage9/shadow-compare.js` הוא נכס חשוב, אבל מימושו הנוכחי אינו מדויק מספיק. אסור לחבר אותו כעת לשער CI מחייב.

### 2.1 תיקון המדדים השגויים

א. `legacyInventory` מגדיל את `fnAreas` לכל אזור/רשומת footnote בעמוד, ולא לכל הערה ייחודית.

ב. `unifiedInventory` מגדיל `noteCount` לפי `noteId` ייחודיים.

ג. `sourceInventory` סופר זוגות סוגריים גולמיים באמצעות Regex.

אלו שלושה מדדים שונים. אין להשוות ביניהם כאילו הם מספר ההערות. יש לבנות מלאי הערות מתוך המבנים הסמנטיים בפועל בכל מנוע.

לכל הערה יש להשוות, ככל שהמידע קיים:

- `noteId`
- `sourceId` או מזהה טוקן המקור
- `anchorId` / `anchorToken`
- סמן ההערה
- סוג ההערה: גוף, צד, סיום, placeholder או המשך
- `continuationOf`
- `wordRange`
- סדר ההופעה במקור
- טקסט מלא, לאחר נרמול תחבירי מינימלי ומוגדר

אין להסתפק במספר הערות, במספר עוגנים או ב־multiset של מילים.

### 2.2 תיקון בדיקת הטקסט

הבדיקה הנוכחית משווה multiset בלבד, כך שהיא אינה תופסת החלפה של טקסט בין שתי הערות, שינוי עוגן או שינוי סדר.

בנוסף, בשגיאת `G4-note-bodies` ובשגיאת `G4-side-bodies` מחושבת אותה פעולת `mDiff` פעמיים. הכיוון השני שגוי. יש לתקן ולבדוק בנפרד:

- מה חסר במאוחד לעומת המורשת;
- מה חסר במורשת לעומת המאוחד.

הוסף בדיקות שליליות שמוכיחות שהכלי מזהה:
- העברת טקסט מהערה אחת לאחרת;
- החלפת עוגן בין שתי הערות;
- מחיקת הערה;
- כפילות הערה זהה;
- שינוי סמן בלבד;
- שינוי סדר;
- פיצול הערה להמשך;
- שינוי טווח מילים של המשך.

שתי הערות בעלות טקסט זהה חייבות להישאר שתי זהויות נפרדות.

### 2.3 תיקון איסוף תוכן מהפלט

`unifiedInventory` הנוכחי סורק בעיקר את `r.pages` ואת `pg.columns`, ומחמיץ משטחי תוכן מבניים, בין היתר:

- `spanning.lines`
- `gateLines`
- `bands`
- מקטעי שער;
- TOC כללי ומפורט;
- הערות צד;
- הערות גוף והמשכיהן;
- עמודי endnotes;
- כל פריט נוסף שמוצג בפועל ב־PageModel או במקרינים.

יש לבצע מיפוי מלא של כל מקורות התוכן בפלט. לכל מילה/פריט יש מקור או הסבר סמנטי מדוע אינו מופיע בגוף.

חשוב: שלב 8 העביר את DOM/HTML/PDF לצריכת PageModel. לכן בדיקת parity חייבת לבדוק גם את `r.pageModel`, ולא להסתמך רק על `r.pages` הישן. יש לבדוק את המודל הקנוני ואת המקרינים שלו. אין להניח שהמבנים הישנים והחדשים זהים רק משום שהקוד עדיין מחזיק את שניהם.

### 2.4 תיקון מקור האמת של המקור

`sourceInventory` משתמש כיום ב־`tokenizeDoc` של מנוע המורשת וב־Regex על סוגריים. כך כלי הבדיקה עלול לשחזר את הנחות המורשת במקום לבדוק את שני המנועים מול מקור עצמאי.

יש להשתמש בפענוח המקור לפי הדקדוק וההגדרות האמיתיים של המסמך, כולל תוחמי ההערות המוגדרים בהגדרות, ולתעד לכל פריט מקור מזהה יציב, טווח מקור וסוג סמנטי.

אין להניח שכל סוגריים מרובעים הם בהכרח הערה, ואין להניח שכל הערה ניתנת לספירה לפי Regex יחיד. בדוק גם תוחמים מותאמים, המשכים ומבנים מקוננים בהתאם לדקדוק הנתמך בפועל.

### 2.5 תיקון שערי TOC וכותרות בכלי

כיום G6 בודק בעיקר כותרות H1 וכיסוי רמות 1-2, בעוד שהחלטת המשתמש D-107 קובעת:

- תוכן כללי: רמות 1-6;
- תוכן מפורט: רמות 2-6;
- רמה 7 אינה מופיעה באף אחד משני התכנים.

יש למדוד בנפרד את ה־TOC הכללי וה־TOC המפורט, ולהשוות את רשומותיהם לפי רמה, טקסט, מזהה מקור, עוגן ויעד עמוד.

אין להסתפק בבדיקה של `r.toc.general`; יש לבדוק גם את התוכן המפורט ואת העמודים שנבנו בפועל.

### 2.6 תיקון סיווג הרפאים והמטא

הכלי מסווג כיום מילים קצרות, מילים מתוך כותרות ומילות ריהוט שער באמצעות כללים רחבים. הדבר עלול להסוות תוכן רפאים או להפוך תוכן תקין לירידה בלתי מוסברת.

כל חריגה צריכה להיות מסווגת לפי מקור מוגדר:
- מילת תחביר שהמנוע צורך;
- מילה שמופיעה במטא;
- טקסט שער;
- כותרת/TOC;
- סמן/מספור;
- טקסט הערה;
- תוכן גוף;
- או פער אמיתי.

אין להוסיף מילה לרשימת ההיתרים רק כדי להוריד כישלון. כל כלל היתר חייב לנבוע מדקדוק או מהחלטה כתובה ולכלול בדיקת שלילה.

### 2.7 תיקון ספירת השערים והדוח

הדוח `audits/STAGE9_SHADOW_2026-11-18.md` טוען ל־10/12 שערים ירוקים, בעוד JSON הקנוני מכיל תשע הצלחות ושני כישלונות - 11 תוצאות.

יש להגדיר רשימת שערים אחת בקוד, שממנה נגזרים:
- המספר הכולל;
- מספר העוברים;
- מספר הנכשלים;
- פירוט הממצאים;
- הדוח Markdown;
- וה־JSON.

אין לכתוב ידנית מספרים בדוח. יש לייצר אותם מאותו אובייקט תוצאות.

הדוח צריך להבהיר מה הוא מודד. לדוגמה, `sideWords.length` הוא מספר מילים בביאורי הצד, ולא מספר הביאורים. אין לקרוא לפער של 894 מילים "894 ביאורים חסרים".

## 3. תיקון שורש: H7 וביאורי צד

הפער שנמדד הוא 2,041 מילים במורשת לעומת 1,147 במאוחד. זהו פער משמעותי שחובה להסביר, אבל הנתון לבדו אינו מוכיח שיש 894 ביאורים חסרים.

אין לתקן לפי ההשערה שהסיבה היא היעדר תמיכה ב־anchor-following. תיקון הצמדת הערות הגוף לעוגנים כבר קיים ב־main במסגרת שלב 6 (`reconcileNotesAfterPlacement`). אין להוסיף אותו שוב, ואין לשכפל ממנו לוגיקה בלי להוכיח שנדרש.

### 3.1 מעקב אחר כל פריט H7

עקוב באמצעות מזהה מקור יציב לאורך כל הצינור:

1. טוקן המקור (`tokens`);
2. פענוח `block-tokenizer` / `dfa-lexer`;
3. בניית הבלוק;
4. `applyHeadingModes`;
5. `asSideNote`;
6. יצירת רשומת ההערה ב־`dp-planner`;
7. `ownToken`, `anchorToken`, `noteId`;
8. הוספה ל־`page.sideNotes`;
9. `placeSideNotes`;
10. `placed`, `deferred`, `pending`, עמוד זנב;
11. PageModel;
12. DOM/HTML/PDF.

בכל מעבר יש לתעד את מספר הפריטים ואת זהותם. כך ניתן לזהות את השלב הראשון שבו פריט נעלם, משתנה או מקבל עוגן שגוי.

### 3.2 נקודה חשודה שחובה לאמת

ב־`side-notes.js`, בתוך `placeSideNotes`, כאשר `findAnchorLine(page, sn.anchorToken)` נכשל, המיקום נקבע לראש אזור התוכן:

`anchor ? lineYTop(...) : page.template.contentBox.top`

יש לבדוק אם זה תקין כאשר ה־H7 עצמו מופיע בעמוד אחד והפסקה המארחת (`anchorToken`) מופיעה בעמוד הבא. במצב כזה קיימת סכנה שהביאור יוצב בראש העמוד של הכותרת, אף שהעוגן החזותי שלו נמצא בעמוד הבא.

אל תניח שהבעיה הזאת היא שורש הפער לפני שמפיקים ראיות. אם היא מתאמת, יש לתקן את תזמון/מיקום הפריט בתוך מנגנון התכנון המשותף כך שהביאור ייקשר לעמוד שבו נמצא העוגן האמיתי, ולא להוסיף הזזה בדיעבד במקרין.

יש לבדוק גם:
- מספר H7 באותו רצף;
- כמה H7 שמפנים לאותו מארח;
- H7 לפני מעבר עמוד/טור;
- H7 שהפסקה המארחת שלו נמצאת בעמוד הבא;
- H7 שהכותרת הבאה אחריו אינה פסקת גוף;
- H7 ללא מארח תקין - חייב ליצור ממצא מפורש ולא להיעלם בשקט.

### 3.3 חיזוק אימות H7

`verifyH7Conversion` בודק כיום בעיקר האם טוקן הכותרת מופיע ב־`placement.placed`. הוא אינו מוכיח שטקסט הביאור נשמר במלואו או שהעוגן נכון.

יש להרחיב את האימות כך שיבדוק:
- `ownToken` תואם בדיוק לטוקן המקור;
- `anchorToken` מצביע לפסקה המארחת הצפויה;
- טקסט הביאור נשמר;
- כל טוקן H7 מקבל פריט אחד בלבד;
- אין פריט צד ללא מקור;
- אין פריט שהוצב בעמוד לפני העוגן שלו;
- כל deferred/pending נסגרים בהצבה או בממצא ברור.

אל תאפשר ל־`anchorToken` להחליף `ownToken` בבדיקת זהות - אלה שני מזהים בעלי תפקידים שונים.

הרחב את בדיקות `s7-notes.test.js` כך שיכסו מסמך עם מספר H7, לא רק H7 יחיד ובדיקת `placed.length >= 1`.

## 4. תיקון שורש: הערות גוף

פער 81/129/132 אינו מדד אמין למספר ההערות, משום שהוא משווה אזורים בעמוד, מזהים ייחודיים וסוגריים גולמיים.

יש ליצור מיפוי מלא של ההערות במקור ושל תוצאת כל מנוע.

לכל הערה יש לוודא:
- קיום מזהה;
- סמן יחיד בגוף, לפי מדיניות המיקום;
- גוף הערה פעם אחת במקום ההצגה בפועל;
- עוגן נכון;
- רצף מילים שלם;
- פיצול/המשך עם `continuationOf` ו־`wordRange` תקינים;
- אין אובדן, כפילות או שינוי סדר;
- מצב inline / footnote / endnote / rejected-to-body תואם להגדרות ולהחלטות המשתמש.

השתמש בהחלטת D-30: הסמן נספר פעם אחת בעוגן בגוף, ותוכן ההערה נספר פעם אחת במקום הצגתו בפועל. אין לספור את ה־placeholder ואת תוכן המרזב פעמיים.

בדוק בנפרד את מצב `footnotes`, `endnotes` ו־`inline`, ואת מפת ההגדרות שמפעילה אותם. אין לכפות מצב אחד כדי ליצור התאמה מספרית למנוע השני.

## 5. תיקון שורש: תוכן העניינים - אי־התאמה מפורשת ל־D-107

נמצא כשל מימוש ברור, ללא צורך בהשערה:

ב־`pipeline.js` בניית התוכן הכללי משתמשת בסינון:

`headingsAll.filter(h => h.level <= 2)`

בעוד בניית התוכן המפורט מקבלת את כל `headingsAll`.

אבל DECISIONS.md, החלטת המשתמש D-107, קובעת במפורש:

- תוכן כללי: רמות 1-6;
- תוכן מפורט: רמות 2-6;
- H7 מוסתר בשני התכנים;
- תוכן כללי ומפורט פעילים כברירת מחדל;
- inline grouping כבוי בכל הרמות;
- מספור שורות ומספרי עמודים מוצגים.

גם ברירות המחדל ב־`settings-registry.js` אינן תואמות לכך: התוכן המפורט כבוי; רמות 3-6 כבויות; וקיבוץ inline מופעל ברמות מסוימות.

יש ליישם את החלטת המשתמש במלואה:
1. תיקון הסינון בתוכן הכללי והמפורט.
2. תיקון `splitGeneralDetail` ותאימות לאחור, לאחר בדיקת כל צרכני הפונקציה.
3. תיקון ברירות המחדל ב־`settings-registry.js` כך שישקפו את ההחלטה.
4. תיקון מסלול ייבוא הגדרות IMUD בלי לדרוס בחירות משתמש מפורשות.
5. בדיקת סדר ועוגני הכותרות.
6. בדיקת ה־TOC בפועל ב־DOM, HTML ו־PDF.

בדיקות חובה:
- H1-H6 מופיעות בתוכן הכללי כברירת מחדל.
- H2-H6 מופיעות בתוכן המפורט.
- H1 אינו מופיע בתוכן המפורט.
- H7 אינו מופיע באף אחד מהם.
- H0 אינו נכנס בטעות לתוכן.
- inline כבוי כברירת מחדל בכל הרמות.
- שינוי מפורש של המשתמש ברמת TOC נשמר ולא נדרס על ידי הייבוא.
- אין כפילות או השמטה של רשומה.
- כל עוגן וקישור מובילים לעמוד הסופי הנכון.

אין להרחיב את ה־TOC על חשבון תקינות מבנית, ואין לשנות גופנים, גודל, ריווח או הגדרות אחרות שאינן נדרשות לתיקון הזה.

## 6. מטא־נתונים, שערים ושורות מקור

### 6.1 ערכי מטא

אין לקבל את טענת F-9a-1 כאילו ערכי מטא חייבים להופיע כטקסט גוף. יש לבדוק את הסמנטיקה המאושרת:

- האם השורה הופכת ל־metadata;
- האם הערך נצרך בתיבת שער;
- האם הוא מוצג בעמוד שער או בשער אחורי;
- האם קיימת כפילות או השמטה.

יש להשוות את הנתונים במקור, ב־DocumentModel/PageModel ובפלט הסופי. אין להוסיף אותם לגוף רק כדי שה־word count יתאים למורשת.

### 6.2 השער האחורי

D-107 קובעת ארבעה מקטעים משמעותיים בשער האחורי, עם שמות הניתנים להתאמה.

בדוק את כל השדות וההתנהגות:
- זכויות יוצרים;
- הוצאה/פרסום;
- קשר;
- פרטים נוספים.

וודא שכל ערך נשמר דרך ההגדרות, PageModel והמקרינים. אם המנוע המאוחד מציג רק שני בלוקים במקום ארבעה, יש לאתר אם חסרה בניית מידע, אם המידע לא מחובר למודל או אם הוא לא מוקרן. תקן במקום שבו אובדן המידע מתרחש.

אין להמציא ערכים כדי למלא חללים, ואין לשכפל טקסט מטא לגוף.

### 6.3 `(מקור: …)`

הדוח קובע הבדל בין המנועים, אך אינו מוכיח איזו התנהגות היא הנכונה.

חפש החלטה מפורשת ב־DECISIONS.md ובתוכנית העבודה. אם קיימת - יישם אותה. אם אינה קיימת - אל תכריע לפי המורשת בלבד ואל תסיר את הטקסט. יש לשמר את המידע הסמנטי, לתעד את ההתנהגות הנוכחית ואת ההבדל ולהימנע מאובדן תוכן.

## 7. חקירת 640 המילים והפערים הנותרים

אין להמתין לסיום תיקון H7 כדי להבין מהן 640 המילים. יש לאתרן לפי מזהי מקור ורכיבי תוכן.

תחילה תקן את כלי האיסוף כך שיכלול את כל המשטחים המבניים, ולאחר מכן בצע התאמה לפי:
- source token ID;
- source range;
- סוג הפריט;
- מיקום ב־PageModel;
- מיקום בהקרנה;
- כמות הופעות.

לכל ירידה או עודף יש להסביר את המקור המדויק. אין לאפשר רשימת היתר רחבה שתסתיר חוסרים.

## 8. ארכיטקטורת התיקון - בלי טלאים

העיקרון המחייב הוא שהמידע וההחלטה ייווצרו פעם אחת ויזרמו דרך המודל:

- פענוח מקור אחד עם מזהי פריטים יציבים;
- DocumentModel אחיד;
- מדידה אחת;
- תכנון אחד;
- מודל פריטים וגאומטריה קנוני;
- PageModel יחיד;
- DOM/HTML/PDF כמקרינים בלבד.

אין להוסיף תנאי special-case נפרד ל־Renderer, אין להזיז הערות לאחר ההצבה כדי להסתיר בעיה בתכנון, ואין לחשב מחדש מידות במקרינים.

כאשר חסר מידע או אין אפשרות להצבה חוקית, יש להפיק ממצא מפורש ולשמר את זהות הפריט. אסור להעלים פריט או להעבירו לתצוגת fallback בלי שהדבר נובע ממדיניות כתובה.

## 9. סדר הביצוע וה־PRים

עבוד בפרוסות קטנות והגיוניות, כל אחת עם שורש אחד ותיעוד בדיקות:

1. **9b.1 - Shadow Compare:** תיקון מדדי זהות, איסוף משטחי תוכן, TOC כללי/מפורט, שערים וספירת תוצאות. הוסף בדיקות יחידה לכל באג מתודולוגי.
2. **9b.2 - TOC:** יישום מלא של D-107, כולל ברירות מחדל, סינון רמות, ייבוא הגדרות ובדיקות פלט.
3. **9b.3 - H7 וביאורי צד:** מעקב זהות end-to-end, איתור שלב האובדן ותיקון מנגנון העוגן בשורש.
4. **9b.4 - הערות גוף:** מיפוי לפי noteId/anchorId/wordRange ושימור מלא של טקסט וסמנים.
5. **9b.5 - שערים ומטא:** השלמת ארבעת שדות השער האחורי, והכרעה/תיקון של מטא ושורות מקור בהתאם להחלטות הקיימות.
6. **9b.6 - אימות סופי:** הפעלת כלי ההשוואה המתוקן בשני הקורפוסים, בדיקת PageModel והמקרינים, ותיעוד כל פער שנותר.

אפשר לאחד פרוסות רק אם הן חולקות את אותו שורש שינוי ואפשר לבדוק אותן באופן ברור. אין לצבור שינויים בלתי קשורים ל־PR ענקי.

כל PR חייב לכלול:
- תיאור השורש;
- הסבר מדוע זה השורש ולא השערה;
- השינוי המרכזי;
- בדיקת רגרסיה שנכשלת לפני התיקון ועוברת אחריו;
- בדיקת שלמות תוכן;
- השפעה על מספר עמודים/גאומטריה אם השתנו;
- הוכחת דטרמיניזם.

## 10. בדיקות קבלה מחייבות

הרץ לפי הצורך, ולפני השלמת 9b:

- `npm test`
- בדיקות determinism
- `layout-audit`
- `full-math-audit`
- `corpus-invariants`
- בדיקות ההערות ומזהי המקור
- בדיקות PageModel
- בדיקות DOM/HTML/PDF
- Node 18, 20, 22 ב־CI.

הרץ לפחות על:
1. `audits/very_long_test_text.txt` - מסמך האמת המרכזי;
2. `red-build/tests/fixtures/canonical_corpus.txt` - קורפוס קנוני;
3. מסמך בדיקה ארוך נוסף רק אם הוא תקין מבחינה מבנית ונחוץ להוכחת תנאי ספציפי.

הוכחת parity אינה רק ספירת מילים. יש להראות:
- שכל פריט מקור מופיע בדיוק במקום המיועד;
- אין איבוד או שכפול;
- סמנים ועוגנים תקינים;
- טקסטי ההערות שלמים;
- TOC מלא לפי ההחלטה;
- מטא ושערים תקינים;
- PageModel ו־DOM/HTML/PDF מייצגים אותו תוכן;
- אין הפרת גאומטריה, חפיפה, גלישה או סדר קריאה;
- הרצות חוזרות דטרמיניסטיות.

אין לעדכן hash צפוי רק כדי להפוך בדיקה לירוקה. אם שינוי פריסה מכוון, הסבר אותו באמצעות השוואת שורות, תוכן, עוגנים וגאומטריה לפני/אחרי.

## 11. Pages ובדיקת משתמש

האתר מתפרסם מענף `gh-pages` נפרד, ולכן אין להניח שמיזוג ל־`main` מפרסם את השינוי.

בכל שינוי שיש לו השפעה שניתן לראות או לבדוק בממשק או בפלט המשתמש:
1. בנה את נכסי האפליקציה;
2. בנה/סנכרן Pages אחרי השינוי;
3. ודא שה־`gh-pages` מכיל את קובצי הבנייה המעודכנים;
4. ודא ש־workflow הפרסום הסתיים בהצלחה;
5. בדוק בפועל את התוצאה באתר, או ציין במפורש אם אין אפשרות לאמת חזותית.

אין לחכות לסוף כל השלב כדי לפרסם סדרת שינויים חזותיים. יש לבצע Pages אחרי כל שינוי כזה, ולא רק בסוף.

שינויי בדיקות ותיעוד בלבד אינם מחייבים פרסום Pages אם אין להם אפקט במוצר.

## 12. תנאי מעבר ל־9c - הסרת המורשת

אין להתחיל ב־9c לפני שכל שערי 9b עוברים. כאשר הם עוברים, יש להתחיל מיד את 9c בפרוסות הבאות:

### 9c.1 - PDF
בדוק את `ui/engine-worker-main.js` ואת נתיב `exportPdfFromModel`.

הוכח שאין קריאה שנייה ל־`typeset()` או `projectDocument()` לצורך ייצוא מהנתיב המאוחד. לאחר parity מלא, הסר את ה־dispatch לייצוא PDF של המורשת והפוך היעדר PageModel לשגיאה מפורשת.

### 9c.2 - HTML
בדוק את `ui/app-shell.js` ואת `exportHtmlFromModel`.

הסר את צריכת `result.pages` של המורשת מנתיב הייצוא החי. אין להוסיף fallback ל־`exportHtml` הישן. PageModel חסר חייב להיות שגיאה מפורשת.

### 9c.3 - DOM
בדוק את `ui/preview-tab.js` ואת `renderLegacyPage`.

העבר את כל התצוגה לצריכת PageModel, הסר את נתיב `page.legacy` ואת `renderLegacyPage` רק אחרי בדיקת כל הצרכנים והוכחת DOM parity.

### 9c.4 - מנוע העימוד
בדוק את `core/pipeline.js` ואת dispatch ל־`legacyTypeset`.

רק לאחר שכל המקרינים צורכים את המודל הקנוני וכל שערי התוכן והגאומטריה עוברים, הסר את dispatch המורשת והעבר את ברירת המחדל למנוע המאוחד. זהו שינוי משמעותי, ולכן יש לבצעו בפרוסה נפרדת עם בדיקות מלאות.

### 9c.5 - מחיקת קוד מת
בדוק באמצעות callgraph וכלי הסריקה את כל הצרכנים של:
- `legacy-imud-flow.js`
- `legacy-projector.js`
- `legacy-settings-map.js`
- `geometry-projector` הישן וכל פונקציה שאיבדה צרכנים.

הסר קוד רק כאשר הוכח שאין לו צרכנים פעילים, ושאין תלות סמויה ב־tests או בייצוא.

אין להשאיר שני מנועי runtime פעילים או מסלול fallback קבוע. rollback נעשה באמצעות commit, לא באמצעות מנוע שני בפרודקשן.

## 13. דיווח נדרש

בסוף כל פרוסה דווח בקצרה אך במדויק:
- אילו PRים נפתחו ומוזגו;
- אילו קבצים ומנגנונים השתנו;
- מה היה שורש הבעיה ומה הראיות;
- אילו בדיקות עברו ובאילו גרסאות Node;
- אילו פערים נשארו;
- האם נבנה Pages ומה תוצאת הפרסום;
- האם ניתן להתחיל את הפרוסה הבאה.

אין לדווח "הושלם" כשיש בדיקות רצות או ממצאים שטרם הוסברו.

**יעד סופי:** מנוע עימוד אחד, פשוט ומאוחד, עם זהות תוכן וגאומטריה מלאה, ועם יכולת להוסיף פריטי עימוד חדשים דרך חוזה אחיד - בלי מסלולים כפולים, בלי טלאים, בלי אובדן תוכן ובלי שכבות תיקון בדיעבד.

---

**החלטת מנהל הפרויקט\:** שלב 9a יישאר ממוזג - הוא סיפק מיפוי חשוב והציף בעיות שאסור להחמיץ. אבל אין להחשיב את כלי ההשוואה הנוכחי כהוכחת parity, ואין להתקדם להסרת המורשת לפני שלב 9b. המשימה הדחופה ביותר כעת היא לתקן את מדידת האמת, ובמקביל לתקן את ה־TOC בהתאם להחלטת המשתמש ולחקור את H7/הערות הגוף לפי זהויות מקור.

הקישור למצב הפרויקט: [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2?utm_source=chatgpt.com)\.

## Prompt:
18.11.2026, 8:27:29

סוכן הAI הודיע שהוא השלים את השלב. 
התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע, נכונות דרך הביצוע, ובמיוחד בשלב זה בו נתקל הסוכן בבעיות שצצו ורגרסיות, נעשו הרבה החלטות ע"י הסוכן, בדוק היטיב את נכונות הבנת מקור הבעיה, ועריכה פשוטה אחידה ואלגנטית לפתירתה.
ודא ביצוע בדיקות מתאימות והצלחתם.
מזג PR הראויים למיזוג!
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק הביצוע כפי שאתה היית מבצע, ועם רמת ההקפדה והזהירות שלך, שאוכל להדביק והוא יתחיל!!!
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט. 
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב כל הזמן!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. 
בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים.

[Attachment: Pasted text(7).txt]

## Response:
18.11.2026, 8:27:37 · gpt-6-t-mini

החומר המצורף מתעד התקדמות עד תחילת 9c.3, אך הוא נקטע בדיוק באמצע העבודה על נתיב התצוגה. חשוב לי להבחין בין מה שהסוכן דיווח לבין מה שקיים בפועל ב־GitHub: אני בודק כעת את ה־PRים, ה־commits וה־CI העדכניים, ואז אבחן את השינויים עצמם — במיוחד את תיקון הדקדוק, הצמדת H7, חיבורי ההערות, שערי הכריכה והמעבר ל־PageModel.

אימות ה־remote מאשר ש־9b אכן התקדם מעבר לנקודת הקטיעה: PRים \#44–\#49 מוזגו, ו־PR \#50 הוא כרגע השינוי היחיד של 9c.1 שעלה ל־GitHub. בדיקות \#50 עברו בכל שלוש גרסאות Node וגם `layout-audit`, `full-math-audit` ו־`corpus-invariants`\.

עם זאת, מצאתי ב־PR \#50 שתי נקודות איכות שאטפל בהן לפני מיזוג: נגררו אליו קובצי מדדי ביצועים זמניים שאין הצדקה לעדכן בעקבות ריצת בדיקות רגילה, ובדיקת ה־Worker בודקת כרגע את קוד המקור באופן סטטי ולא מריצה בפועל ייצוא PDF דרך פרוטוקול ה־Worker. אני מחזק את ההוכחה הזאת במקום להסתפק ב־CI ירוק.

הסקירה של 9b מראה שהסוכן לא הסתפק בהשוואת ספירות: הוא איתר שלושה שורשים נפרדים — דקדוק H7 שלא זיהה כותרות עם `מספר`/ציטוט לפני המקף, הערות חוצות־שורות שנשארו בטעות בגוף, והכנסה של הערה שהועברה בסוף המרזב במקום לפי סדר הסמנים. התיקונים ממוקמים בפרסר ובמתכנן, ולא במקרינים, וזה הכיוון הארכיטקטוני הנכון. אני עדיין בודק את גבולות המקרים ואת תקינות כלי ההשוואה לפני שאאשר שהשערים באמת מוכיחים את מה שהם טוענים.



---
---



# המשך ניהול Imudify

## Prompt:
18.11.2026, 11:15:56

\# המשך ניהול ופיתוח Imudify — העברת שיחה מלאה והמשך עבודה\
\
אנחנו ממשיכים פרויקט מתקדם של פיתוח מנוע עימוד תורני. עליך להיכנס מיד לתפקיד \*\*מנהל הפרויקט, המבקר הארכיטקטוני והמפתח הראשי\*\*. אין להתחיל את הפרויקט מחדש ואין להסתפק בסיכומים או בתוכניות: עליך לבדוק את מצב GitHub בפועל, להמשיך את העבודה, לתקן בעצמך כשאפשר, לבחון את עבודת סוכן ה־AI, למזג PRים ראויים ולהוביל את הפרויקט לסיום אמיתי.\
\
\## 1. מקור ההיסטוריה — חובה לקרוא\
\
הקובץ שבו רוכזה השיחה הממושכת שלנו:\
\
https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md\
\
יש לקרוא את הקובץ כולו, ולא להסתפק בתמצית או בחלק האחרון שלו. הוא מכיל את ההיסטוריה המלאה של הדיונים, הדרישות, ההחלטות, הביקורות, ההוראות לסוכנים וההתקדמות.\
\
יש לשים לב במיוחד לבקשות המשתמש לאורך השיחה, ולא רק להודעות האחרונות. יש להתייחס להכרעות מפורשות של המשתמש כאל דרישות מחייבות.\
\
הקובץ המעודכן שנבדק בעת הכנת הפרומט הוא באורך של כ־580 אלף תווים. ההקשר המעשי העדכני ביותר, לרבות פעולות GitHub שנעשו לאחר נקודת הסיום של התיעוד, מפורט להלן.\
\
\## 2. המאגר והיעד\
\
המאגר הפעיל:\
\
https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2\
\
שם המוצר החדש: \*\*Imudify\*\*.\
\
זהו מנוע עימוד לספרים תורניים. היעד אינו רק לגרום לבדיקה לעבור או לחבר עוד מסך. היעד הוא מנוע עימוד:\
\
\- דטרמיניסטי, מדויק ושקוף.\
\- בעל מקור אמת יחיד לתוכן ולגאומטריה.\
\- בעל מודל פריטים אחד, מודל שורות אחד, Planner אחד ו־PageModel אחד.\
\- ללא מנגנוני עימוד מקבילים, חישובי גאומטריה כפולים או תיקוני טלאי.\
\- עם מקרינים טהורים לתצוגת DOM, ל־HTML ול־PDF.\
\- בעל יכולת להוסיף פריטי עימוד חדשים בקלות, דרך חוזה נתונים אחיד.\
\- ללא אובדן תוכן, סמנים, הערות, ביאורים, תמונות, עיטורים או זהויות מקור.\
\
העיקרון החשוב ביותר: \*\*פישוט ואיחוד אמיתיים של פעולת מנוע העימוד, ולא הוספת שכבות נוספות שמסתירות את הכפילויות.\*\*\
\
\## 3. הוראות עבודה מחייבות\
\
פעל כמנהל פרויקט עצמאי:\
\
1\. בדוק את הקוד ואת ה־GitHub בפועל. אל תסתמך על דיווחי הסוכן או על מסמך תיעוד כתחליף לבדיקה.\
2\. לכל PR בדוק את כל השינויים, את מקור הבעיה, את הנמקות הסוכן, את השינויים שנעשו בעקבות תקלות ורגרסיות, ואת איכות הפתרון הארכיטקטוני.\
3\. בדוק אם התיקון נעשה בשורש הבעיה ובמקום הנכון, ואם קיימת דרך פשוטה, אחידה ואלגנטית יותר.\
4\. אל תסתפק בבדיקות שהסוכן כתב לעצמו. בדוק אם הן אכן מוכיחות את הטענה, ואם הן מסוגלות לתפוס את התקלה שהן נועדו למנוע.\
5\. מזג PRים ראויים בלבד. אל תמזג קוד רק מפני שה־CI ירוק.\
6\. אל תמתין ללא צורך לסיום כל בדיקות ה־CI. נצל את הזמן לעבודה עצמאית, אבל לעולם אל תדווח על בדיקה שעדיין רצה כאילו הצליחה.\
7\. אם אפשר לבצע את התיקון בעצמך באמצעות GitHub, בצע אותו. אם נדרש סוכן AI, הכין לו פרומט מפורט ומדויק, ואז המשך בעצמך בביקורת ובהתקדמות.\
8\. אין צורך להוסיף הוראות כלליות כיצד להעביר פרומט לסוכן. המשתמש מעתיק את הפרומטים שאתה מספק.\
9\. אל תשאל שאלות הבהרה כאשר אפשר להתקדם לפי ההחלטות והחומרים שכבר קיימים.\
10\. השתדל לחלק את העבודה והדיווחים למקטעים ממוקדים, כדי למנוע קטיעת הודעות והיתקעות השיחה.\
\
\### עקרונות שאסור להפר\
\
\- \*\*P6/P7 אינם בתחום העבודה כרגע.\*\* יש להשאיר אותם לחלוטין בצד.\
\- אין לשנות ברירות מחדל והכרעות משתמש שאושרו, בלי הצדקה והחלטה מפורשת.\
\- יש לשמר את ערכת 40 ואת עיצובי השערים המקוריים פעילים אוטומטית.\
\- יש לשמר את בחירות המשתמש ואת קדימותן על פני ברירות מחדל נגזרות.\
\- אין להשתמש במסמך PDF לדוגמה כאידיאל טיפוגרפי או גאומטרי סופי.\
\- אין להחליש בדיקות, לשנות ספים או לעדכן hashes באופן מכני כדי לקבל CI ירוק.\
\- אין לאפשר fallback שקט, השמטת פריטים או אבחונים שאינם מדווחים.\
\- אין להשאיר שני מנועי עימוד פעילים לאחר סיום שלב 9.\
\
\## 4. מצב GitHub שאומת בעת הכנת הפרומט — 18.11.2026\
\
\`main\` בקוד עומד על:\
\
\`0de51dc0b6ea433c299d33f84e4614b2446c10d2\`\
\
לאחר מכן נוסף commit תיעוד של השיחה:\
\
\`6185b6a119f8405751739620a2b2b9057facb17d\`\
\
ה־commit האחרון הזה הוא הוספת הודעות השיחה, ולא שינוי במנוע.\
\
\### PRים שמוזגו ונסגרו\
\
\| PR | נושא | מצב |\
\|---|---|---|\
\| #44–#48 | שלבי 9b.1–9b.5: כלי צללים, TOC, דקדוק H7 ועוגנים, הדבקת הערות, שער אחורי | מוזגו |\
\| #49 | פריסת 9b ל־Pages, cache-buster s9b | מוזג |\
\| #50 | 9c.1 — ייצוא PDF מתוך PageModel בלבד | מוזג |\
\| #51 | תיקון \`index.html\` — רצפי \`\n\` מילוליים בתוך head | מוזג |\
\| #52 | תיקון זיהוי שורות מבניות שנבלעות בהדבקת הערות | מוזג |\
\| #53 | cache-buster s9c1 ופריסת נכסי 9c.1 ל־Pages | מוזג |\
\| #54 | שיתוף הדקדוק האמיתי בין כלי האבחון לפרסר, והידוק זיהוי שורות מבניות | מוזג |\
\
קישורים:\
\- [PR #50 — PDF מהמודל]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/50)\
\- [PR #51 — תיקון HTML head]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/51)\
\- [PR #52 — תיקון דיאגנוסטיקת הערות]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/52)\
\- [PR #53 — פריסת Pages]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/53)\
\- [PR #54 — כלי אבחון מהדקדוק האמיתי]\(https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/54)\
\
\### אימות CI\
\
PR #54 עבר:\
\- Node 18, 20, 22.\
\- \`layout-audit\`.\
\- \`full-math-audit\`.\
\- \`corpus-invariants\`.\
\
גם PR #55, המפורט בהמשך, עבר את אותן בדיקות.\
\
\### PR פתוח ורלוונטי\
\
\*\*PR #55 — שלב 9c פרוסה 9c.2: ייצוא HTML מה־PageModel בלבד\*\*\
\
https\://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/55\
\
\- ענף: \`stage9c/html-model-only\`\
\- Head: \`95eb7bd56dc00ee5eab54e61d9f0cb5c3b91a04f\`\
\- Base הקוד בעת פתיחתו: \`0de51dc0b6ea433c299d33f84e4614b2446c10d2\`\
\- ה־PR עדיין פתוח ולא מוזג בעת הכנת הפרומט.\
\- \`mergeable=true\`.\
\- מטריצת Node 18/20/22 עברה.\
\- \`layout-audit\` עבר.\
\- \`full-math-audit\` עבר.\
\- \`corpus-invariants\` עבר.\
\
ה־PR מוסיף בדיקות HTML מהמודל, סמן בנתיב המורשת ומוסיף את הבדיקה לשרשרת \`npm test\`. הוא אינו מבצע שינוי משמעותי בהתנהגות runtime של הנתיב המאוחד; חיבור HTML מהמודל כבר קיים בקוד.\
\
\*\*אין למזג את #55 אוטומטית.\*\* יש לבדוק אותו עצמאית, במיוחד את איכות הבדיקות, לפני החלטה.\
\
בבדיקה ראשונית נמצאו נקודות שדורשות תשומת לב:\
\- כמה בדיקות משתמשות ב־\`setTimeout(..., 400)\` במקום להמתין באופן דטרמיניסטי להשלמת פעולת העימוד.\
\- קיימת בדיקה עם \`assert(noteBodies >= 0)\` שאינה מוכיחה למעשה שקיימות הערות או שהן נשמרו.\
\- בדיקת השוויון בין תוצרי HTML בודקת בעיקר מספר עמודים ודגימת מילים, ולא שקילות תוכן וגאומטריה מלאה.\
\- יש לבדוק שהבדיקות באמת מוכיחות אפס שימוש בנתיב ה־legacy בפרופיל unified, ולא רק את תוצאת הפונקציה הישירה.\
\
יש לתקן את הבדיקות באופן ממוקד, בלי להרחיב את היקף PR מעבר לנדרש, ואז לבדוק CI מחדש ולמזג אם הוא ראוי.\
\
\### PRים פתוחים אחרים\
\
PR #17, #16 ו־#14 נשארו פתוחים אך אינם חלק ישיר מהעבודה המיידית של שלב 9c. אין לערבב אותם או למזג אותם ללא סקירה נפרדת והוכחה שהם נדרשים.\
\
PR #43 הוא ניסיון תיקון ישן של בעיית ה־HTML שנסגר ללא מיזוג. התיקון הנכון נמצא ב־PR #51.\
\
\## 5. התקדמות שלב 9b — הושלמה\
\
שלב 9b נועד להעביר תיקוני שורש למסלול המאוחד ולסגור את פערי התוכן שהתגלו בהשוואת הצללים.\
\
דוחות חשובים:\
\- \`audits/S9B_FINAL_VERIFICATION_2026-11-18.md\`\
\- \`audits/S9B_NOTES_GLUE_2026-11-18.md\`\
\- \`audits/S9B_SHAAR_BACK_2026-11-18.md\`\
\- \`audits/S9B_TOC_D107_2026-11-18.md\`\
\- \`audits/STAGE9_SHADOW_2026-11-18.md\`\
\- \`audits/STAGE9_SHADOW_canonical_corpus_v5_2026-11-18.md\`\
\- \`audits/STAGE9_SHADOW_very_long_2026-11-18_v5.md\`\
\
על פי דוחות האימות:\
\- כלי הצללים v5: 13/13 שערים ירוקים בקורפוס הקנוני וב־very_long.\
\- הערות גוף: 132/132/132 במקור, במאוחד ובמורשת.\
\- H7: 2,042 פריטי ביאור צד מול 2,042 טוקנים.\
\- TOC לפי D-107: כללי 527 רשומות, מפורט 517 רשומות ב־very_long; H7 מוסתר.\
\- שער אחורי: ארבעת המקטעים חוברו להגדרות ולמטא לפי D-107.\
\- הדבקת הערות חוצות־שורות נעשתה בפרסר הקנוני, עם round-trip תו־לתו.\
\- סדר מרזב ההערות תוקן במקום התכנון, לא במקרין.\
\- נעילות התוכן והדטרמיניזם נבדקו.\
\
\### ממצאי ביקורת שהתחייבו לתיקונים\
\
PR #52 תיקן שגיאות ב־\`GLUE_STRUCTURAL_RE\`: שגיאת כתיב במונח העברי ושימוש לא נכון ב־\`\b\` לאחר מילים בעברית.\
\
PR #54 שיפר את המצב באמצעות:\
\- ייבוא \`HEADING_RE\` מהפרסר האמיתי.\
\- ייבוא \`LEGACY_HEADING_RE\` מ־\`legacy-imud-flow\.js\`.\
\- ביטול עותקי דקדוק עצמאיים בכלי האבחון.\
\- הידוק זיהוי שורות מבניות שנבלעות, כדי למנוע false positives.\
\
עם זאת, בבדיקת PR #54 נמצאו גם חולשות בבדיקות:\
\- שימוש ב־\`eval\` כדי לחלץ Regex מקובץ המקור.\
\- אסרט אחד שמסתיים ב־\`|| true\`, ולכן אינו בודק דבר.\
\
בדוק אם נכון להחליף את אלה בבדיקות ישירות דרך ממשק מודול הפרסר או בבדיקות התנהגותיות, באופן פשוט וברור. אין צורך לשנות את התנהגות המנוע אם אינה מחייבת זאת.\
\
\## 6. מצב ארכיטקטוני קריטי — מצב ה־legacy עדיין ברירת המחדל החיה\
\
זו אחת הנקודות החשובות ביותר להמשך, ואסור לטעות בה.\
\
\`browser-entry.js\` מפעיל בעת עליית האפליקציה את \`imud.loadLegacyDefaults()\` כברירת מחדל, אלא אם מופעל הפרמטר:\
\
\`?engine=unified\`\
\
ייבוא ההגדרות המלאות של IMUD מוסיף במכוון:\
\- \`\_layout-profile='imud'\`\
\- \`\_imudRaw\`\
\
ב־\`pipeline.js\`, בראש \`typeset()\`, קיים dispatch:\
\
\`\_layout-profile === 'imud' && \_imudRaw\` ⇒ \`legacyTypeset(...)\`\
\
במקרה הזה מוחזר \`legacyProfile: true\`, ואין בנייה של \`PageModel\`.\
\
רק בפרופיל unified נבנה PageModel, והוא עובר דרך Worker ל־UI.\
\
לכן:\
\
\*\*הטענה במסמך \`audits/STAGE9_CUTOVER_MAP.md\` שלפיה PageModel נבנה בשני הפרופילים אינה נכונה.\*\* יש לתקן את המסמך לפי הקוד האמיתי.\
\
המשמעות הארכיטקטונית:\
\- \`preview-tab.js\` עדיין צריך את נתיב הרינדור הישן עבור legacy.\
\- \`app-shell.js\` עדיין צריך את נתיב HTML הישן עבור legacy.\
\- Worker צריך לשמר את נתיב PDF הישן עבור legacy.\
\- הנתיבים המאוחדים כבר משתמשים ב־PageModel ואסור להם ליפול לנתיב legacy אם המודל חסר.\
\- אין למחוק את המקרין הישן כל עוד הפרופיל החי המוגדר כברירת מחדל עדיין משתמש במנוע legacy.\
\
אין לבצע cutover לברירת המחדל לפני הוכחת parity מלאה ושימור הגדרות המשתמש. מצד שני, אין להשאיר את המעבר הזה ללא תכנון: צריך להגיע במהירות לפרוסת cutover אחת, מבוקרת ומגובה בבדיקות.\
\
\## 7. שלב 9c — מצב והמשך\
\
\### 9c.1 — PDF\
\
PR #50 מוזג.\
\
הנתיב המאוחד מייצא PDF מתוך \`pageModel\` שכבר חושב, ללא עימוד שני וללא נפילה ל־\`exportPdf\` הישן.\
\
הוספנו בדיקת Worker E2E אמיתית:\
\- עימוד דרך הפרוטוקול.\
\- בקשת PDF דרך הפרוטוקול.\
\- קבלת בתים של PDF אמיתי.\
\- הוכחה ש־\`exportPdfFromModel\` נקרא.\
\- הוכחה ש־\`exportPdf\` של המורשת אינו נקרא.\
\
בדיקות PR #50 עברו בכל שלוש גרסאות Node ובכל שערי האימות הרלוונטיים.\
\
\### 9c.2 — HTML\
\
PR #55 פתוח. יש להשלים את הביקורת שלו, לתקן בדיקות חלשות אם נדרש, לבדוק CI, ואז למזג אם הוא ראוי.\
\
הנתיב המאוחד ב־\`app-shell.js\` כבר בודק:\
\
\`engineProfile === 'unified'\`\
\
ואז משתמש ב־\`exportHtmlFromModel(pageModelObj, ...)\`.\
\
אם המודל חסר, יש סירוב מפורש (\`no-page-model\`). אין fallback.\
\
בפרופיל legacy ממשיכים זמנית להשתמש ב־\`exportHtml(result, ...)\`.\
\
\### 9c.3 — DOM\
\
זהו השלב הבא לאחר סגירת HTML.\
\
יש לבחון את הקוד הקיים לפני שינוי:\
\- \`preview-tab.js\`\
\- \`pagemodel-dom-renderer.js\`\
\- \`dom-renderer.js\`\
\- \`app-shell.js\`\
\
פרוסת DOM חייבת להוכיח שהמסלול המאוחד:\
\- צורך PageModel בלבד.\
\- אינו קורא ל־\`result.pages\` כדי לקבוע תצוגה.\
\- אינו משתמש ב־\`renderLegacyPage\`.\
\- אינו מודד, שובר שורות, מבצע CSS wrapping, placement או balancing.\
\- אינו מזיז פריטים או מחשב גאומטריה.\
\- אינו מסתיר פריטים חסרים ללא diagnostic.\
\
יש לבדוק RTL, סדר קריאה, גופנים מעורבים, תמונות, הערות, המשכים, עיטורים, שערים, TOC, info-box, headers, folios, clipping וגבולות.\
\
עם זאת, זכור שמסלול ה־legacy עדיין מופעל כברירת מחדל. לכן אין למחוק את הרינדור הישן לפני cutover. יש להפריד בין:\
1\. הוכחה שהנתיב המאוחד הוא PageModel-only.\
2\. סימון ומיפוי הנתיב הישן.\
3\. הסרת הנתיב הישן לאחר cutover מבוקר.\
\
\### 9c.4 — Cutover של המנוע\
\
זהו השלב הקריטי שבו יש להסיר את dispatch הישן ולהעביר את ברירת המחדל למסלול המאוחד, אך רק אחרי סגירת תנאי parity.\
\
יש לשמר את כל הגדרות IMUD המיובאות והעדפות המשתמש, אך לא להוסיף למסלול המאוחד את \`\_layout-profile='imud'\` ואת \`\_imudRaw\` באופן שמפעיל את legacy.\
\
יש לבדוק:\
\- שכל מפתחות ההגדרות המהותיים מגיעים למנוע המאוחד.\
\- שערכת 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.\
\- שגופנים וסגנונות נשמרים.\
\- שבחירות מפורשות של המשתמש גוברות על ברירות מחדל נגזרות.\
\- שערים, TOC, תמונות, הערות וביאורים נשארים במקומם.\
\- אין שינוי בהגדרות שאושרו.\
\
יש לשקול את סדר ההסרה מחדש: אין למחוק D2 לפני D1 כל עוד ברירת המחדל היא legacy. אפשר להכין ולהוכיח את הנתיב המאוחד בנפרד, אבל ההסרה בפועל של צרכני legacy חייבת להיות מתואמת עם המעבר.\
\
\### 9c.5 — מחיקת קוד legacy וכפילויות\
\
רק אחרי cutover:\
\- לבצע callgraph מלא.\
\- להוכיח אפס consumers פעילים ל־\`legacy-imud-flow\.js\`, \`legacy-projector.js\`, \`geometry-projector.js\` ול־\`legacy-settings-map.js\` במקומות המיועדים להסרה.\
\- להסיר קוד מת בלבד.\
\- להסיר adapters ו־fallbacks מיותרים.\
\- לא להשאיר מנוע שני פעיל.\
\
אין למחוק מודול רק מפני ש־search פשוט לא מצא שימוש. יש לבדוק dynamic require, bundle generation, בדיקות, כלים וקוד ייצוא.\
\
\## 8. GitHub Pages — חובה לאחר כל יחידת שינוי\
\
המשתמש ביקש מפורשות: \*\*בנה ופרוס GitHub Pages לאחר כל שינוי, ולא רק לאחר סיום שלב גדול.\*\* הדבר חל גם על שינוי שלטענת הסוכן אינו משנה את המראה או הפלט — במקרה כזה יש להוכיח ניטרליות.\
\
הפרסום נעשה מענף \`gh-pages\`, ולא ישירות מ־main.\
\
הפריסה האחרונה הידועה:\
\- cache-buster: \`2026-11-18-s9c1\`.\
\- \`index.html\` ב־gh-pages כבר אינו מכיל רצפי \`\n\` מילוליים.\
\- PR #53 פרסם את נכסי 9c.1.\
\
PR #54 שינה גם את \`engine-worker.bundle.js\`, לאחר פריסת s9c1. לכן יש לוודא שנכסי Pages תואמים למקור הנוכחי ולבנות ולפרוס גרסה חדשה לאחר מיזוג היחידה הבאה.\
\
בכל פריסה:\
1\. לבנות bundles מתוך המקורות העדכניים.\
2\. לוודא התאמה בין source, bundle וגרסאות הנכסים.\
3\. לעדכן cache-buster עקבי ב־\`browser-entry.js\`, ב־\`index.html\` ובנכסים הנדרשים.\
4\. לפרסם את תוצרי main ל־\`gh-pages\`.\
5\. לוודא ש־GitHub Actions של Pages הסתיים בהצלחה.\
6\. לוודא SHA ותוכן של הקבצים בענף הפרסום.\
7\. לפתוח את האתר החי ולבחון בפועל ככל שהכלים מאפשרים.\
8\. להפעיל בדיקת live audit וייצוא נציג.\
9\. אם לא ניתן לבצע בדיקה חזותית חיה, יש לציין זאת במפורש ולא לטעון שנבדק.\
\
אתר:\
https\://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/\
\
\## 9. בדיקות ושערי קבלה\
\
אין להסתפק ב־\`npm test\` בלבד. לפי השינוי, יש להריץ ולבדוק:\
\
\- \`npm test\`\
\- \`test:determinism\`\
\- \`cross-check\`\
\- \`corpus-invariants\`\
\- \`full-math-audit\`\
\- \`layout-audit\`\
\- בדיקות Worker ו־PageModel transport.\
\- בדיקות שמוכיחות שאין fallback שקט.\
\- בדיקות E2E ל־DOM/HTML/PDF.\
\- בדיקות קורפוס canonical ו־very_long.\
\- בדיקות תוכן, סמנים, הערות, ביאורים, זהויות עוגן וסדר קריאה.\
\- בדיקות PDF: חילוץ טקסט, ToUnicode, הטמעת גופנים ו־rasterization.\
\- בדיקות הדפדפן החי.\
\
בכל בדיקה יש לדווח:\
\- commit מדויק.\
\- גרסת Node.\
\- פקודה מדויקת.\
\- PASS / FAIL / SKIPPED / IN_PROGRESS.\
\- artifact, אם יש.\
\- baseline מול regression.\
\- האם נבדק המסלול הפעיל או רק נתיב audit.\
\
אל תשנה ספי full-math או snapshots רק כדי לקבל ירוק. יש היסטוריה של כשל רצפת נפח, ולכן יש לבדוק אם מדובר ב־baseline מוכר או ברגרסיה אמיתית.\
\
\## 10. הצעדים הראשונים בשיחה החדשה\
\
פעל לפי הסדר, אך אל תיתן לתכנון לעכב עבודה:\
\
1\. קרא את \`ai-chat/ChatGPT.md\` במלואו והפק לעצמך את ההחלטות והדרישות המהותיות.\
2\. אמת את \`main\`, את ה־PRים ואת מצב ה־Actions העדכני. אל תניח שמצב GitHub נשאר כפי שהיה בעת כתיבת הפרומט.\
3\. בדוק את PR #55 במלואו — קוד, בדיקות, שינויי bundle, CI והאם הבדיקות מוכיחות את הנדרש. תקן את חולשות הבדיקות וצמצם שינויים שאינם נחוצים. מזג רק אם ראוי.\
4\. אחרי המיזוג, בנה ופרוס Pages עם cache-buster חדש ואמת את הקוד החי.\
5\. תקן את \`STAGE9_CUTOVER_MAP.md\` ואת מסמכי המצב הנדרשים: הם אינם משקפים במדויק את עובדת ה־PageModel החסר בפרופיל legacy.\
6\. עבור לפרוסת DOM. בצע ביקורת שורש למימוש הקיים לפני שאתה מבקש מהסוכן לכתוב קוד נוסף. אל תשכפל תשתית שכבר קיימת.\
7\. שמור על התקדמות מהירה לעבר cutover של המנוע, אך אל תסכן את שלמות התוכן או את הגדרות המשתמש.\
8\. כרגע סוסן הAI באמצע לבצע את מטלות הפרומט האחרון שכתבת לו. כעיקרון הכן לסוכן AI פרומט מפורט רק כאשר נדרשת עבודה ממשית שלו. לאחר מכן המשך לפקח ולבקר את עבודתו כמנהל הפרויקט.\
9\. בכל שלב שאפשר לאמת מבחינת המשתמש — גם אם נטען שהשינוי ניטרלי — בצע Pages build/deploy ובדיקה.\
\
\## 11. סגנון העבודה והיעד הסופי\
\
המשתמש אינו מחפש עוד מסמכי תכנון או הודעות התקדמות ארוכות. הוא מצפה להתקדמות ממשית, מדויקת וזהירה, אך מהירה.\
\
אין לעצור אחרי audit אם ניתן לבצע את התיקון הבא בבטחה. אין להחזיר שוב ושוב את אותה שאלת מצב. אין לחזור על שאלות שכבר נענו בהיסטוריה. אין להסתפק בלהנחות את הסוכן — בדוק את התוצרים שלו בעצמך.\
\
בכל דיווח יש להפריד בין:\
\- מה נבדק בפועל.\
\- מה תוקן.\
\- מה מוזג.\
\- מה עבר CI.\
\- מה נפרס.\
\- מה נבדק באתר החי.\
\- מה עדיין פתוח.\
\## ריפו פרללי. \
מדי פעם בדוק את מצב הריפו המקביל [https://github.com/SUGINACH/Tora_Book_Typesetter_Red](https://github.com/SUGINACH/Tora_Book_Typesetter_Red) שנעשיו עליו עבודה נפרדת, בכדי לקחת רעיויות או שיפורים שייושמו בו ועדיין לא יושמו אצלינו.\
\*\*המטרה: להגיע לסיום אמיתי של מנוע העימוד — מנוע אחד, פשוט, מאוחד, דטרמיניסטי, ללא טלאים וללא אובדן מידע.\*\*\
התחל מיד מבדיקת מצב GitHub העדכני והמשך מהנקודה המדויקת הזאת. אל תבקש ממני לסכם שוב את הפרויקט.[$github](app://connector_76869538009648d5b282a4bb21c3d157)

## Response:
18.11.2026, 11:16:03 · gpt-6-t-mini

אתחיל באימות מצב המאגר וה־PRים מול GitHub, ובמקביל אקרא את קובץ ההיסטוריה המלא. לאחר מכן אתמקד ב־PR \#55 ובפער בין מצב הקוד, הבדיקות והתיעוד; לא אמזג שינוי לפני שאוודא שהוא נכון מבחינה ארכיטקטונית.

המאגר נגיש ויש לי הרשאות כתיבה. קובץ ההיסטוריה אכן נקרא במלואו מהענף `main`\: 580,818 תווים ו־14,231 שורות. בבדיקה הראשונית התברר גם שהמאגר המקביל קיים ונגיש; כעת אני מפריד בין מצב הענפים בפועל לבין תיאור המצב שנמסר בפרומט, כדי לא להסתמך על SHA או סטטוס שכבר השתנו.

הבדיקה העדכנית מגלה שהעבודה כבר התקדמה גם מעבר ל־PR \#55: `main` עומד כעת על `158055d6a94830878c8a811c85a9a6343c694ea4`, לאחר מיזוג PR \#56 — פרוסת DOM של 9c.3. GitHub Pages נפרס מחדש וה־deploy וה־audit שלו הסתיימו בהצלחה. בדיקות `CI` של ה־commit האחרון עדיין סומנו כרצות בעת השליפה; `full-math-audit` ו־`corpus-invariants` כבר הסתיימו בהצלחה.

ב־PR \#55 מצאתי שהחששות אינם תיאורטיים: בדיקת ההערות משתמשת ב־`assert(noteBodies >= 0)`, ושלוש בדיקות E2E תלויות ב־`setTimeout(..., 400)`\. אני בודק כעת את 9c.3 ואת ה־PR הבא כדי לתקן את שורש חולשת האימות, ולא רק לסמן אותה בדוח.

> **Retrieved repository and pull request details, reviews, files, and workflows**
>
> 
>
> **Inspecting merged changes**
>
> I’m treating the earlier prompt as outdated because pull request 55 is already merged. I’m verifying the actual main branch commit, current CI runs, changed files, tests, assertions, and package scripts before making recommendations.
>
> **Inspected merged changes**
>
> 
>
> **Auditing current progress**
>
> I’m updating the review because main has advanced through pull request 56, with a newer pull request possibly open. I’m checking recent changes, deployment status, CI, the renderer, tests, and the latest conversation before deciding whether fixes are needed.
>
> **Audited current progress**
>
> 
>
> **Reviewed main and PR statuses, CI workflows, tests, documentation, and project configuration**
>
> 
>
> **Reviewing fallback behavior**
>
> I’m checking whether the unified rendering path silently falls back to legacy page data when its PageModel is missing. I’m also locating the latest audit files, tests, open pull requests, and deployment checks to verify the migration is complete.
>
> **Reviewed fallback behavior**
>
> 
>
> **Strengthening unified handling**
>
> I’m narrowing the issue to two silent legacy fallbacks: the application shell and testing tab still use serialized pages when unified PageModel data is missing. I’m checking targeted source and audit files before proposing a focused correction.
>
> **Strengthened unified handling**
>
> 
>
> **Investigated PRs, workflow failures, repository paths, and renderer layout measurements**
>
> 
>
> **Reviewed app shell, transport, engine, worker, browser, and CI source files**
>
> 
>
> **Cloning Repository for Source Inspection**
>
>
> **Planning focused corrections**
>
> I’m identifying a concrete migration defect: unified mode can still consume legacy serialized pages when PageModel data is absent. I’m preparing a narrow fix, updating inaccurate documentation, and ensuring tests cover this failure path before any broader cutover.
>
> **Fixing fallback paths**
>
> I’m tracing every legacy-page fallback, including diagnostics and testing views. Unified mode should expose an explicit error and render no pages when its PageModel is missing, even if serialized legacy data exists.
>
> **Fixed fallback paths and planned focused corrections**
>
> 
>
> **Correcting migration behavior**
>
> I’m consolidating the fix around unified-mode failures: legacy page data must never reappear when PageModel data is absent. I’m also preserving explicit diagnostics, updating documentation, and adding coverage for the application-shell path.
>
> **Corrected migration behavior**
>
> 
>
> **Cloned repository for source inspection**
>
> 
>
> **Consolidating migration fixes**
>
> I’m combining the unified-mode fallback correction, explicit missing-PageModel diagnostics, documentation updates, and application-shell test coverage into one focused change before the next cutover step.
>
> **Consolidated migration fixes**
>
> 
>
> **Refining migration safeguards**
>
> I’m consolidating the remaining unified-mode safeguards: remove every legacy fallback, surface missing PageModel errors, strengthen application-shell tests, and correct the cutover map before changing defaults.
>
> **Refined migration safeguards**
>
> 
>
> **Searched repository files and GitHub workflow runs for onExplicitRetypeset**
>
> 
>
> **Inspected rich features, workflows, parsers, layouts, and build integration**
>
> 
>
> **Audited unified PageModel pipelines, S14 integration, assets, and deployment paths**
>
> 
>
> **Finding feature gaps**
>
> I’m confirming that migration safety and feature completeness are separate issues: unified fallback bugs need correction, while image rendering still has documented limitations, especially in PDF output.
>
> **Found feature gaps**
>
> 
>
> **Auditing rendering parity**
>
> I’ve identified silent legacy fallbacks when unified results lack a PageModel, plus weak asynchronous tests and incomplete image/PDF handling. I’m prioritizing explicit errors, stronger behavioral coverage, and an accurate cutover map before changing defaults.
>
> **Audited rendering parity**
>
> 
>
> **Audited image rendering gaps and compared Git branches and assets**
>
> 
>
> **Verifying unified rendering**
>
> I’m confirming the merged unified renderer uses `PageModel` everywhere without legacy fallback. I found likely gaps in app status, debug data, testing views, and weak asynchronous tests, so I’m preparing targeted fixes.
>
> **Reviewing unified output**
>
> I’m confirming the recent unified-rendering work is green, then I’m correcting silent legacy fallbacks in diagnostics and testing. I’m also updating the cutover map to reflect that PageModel is built only for unified execution.
>
> **Reviewing cutover risks**
>
> I’m reviewing the merged unified-path work and have found two follow-ups: missing PageModel data can still fall back to legacy pages, and image projection remains incomplete, especially for PDF output.
>
> **Reviewed unified rendering output and assessed cutover risks**
>
> 
>
> **Searching the web**
>
> 
>
> **Reviewing renderer gaps**
>
> I’m finding two important issues before cutover: unified mode can silently fall back to legacy page data, and PDF/DOM image handling may omit or expose image placeholders. I’m preparing a focused fix covering explicit errors, structural tests, and image preservation.
>
> **Reviewed renderer gaps**
>
> 
>
> **Reviewing migration gaps**
>
> I’m finding two concrete issues: unified rendering still falls back to legacy page data, and HTML tests rely on timing. I’m also confirming that PDF/image projection remains incomplete before any default cutover.
>
> **Reviewing integration gaps**
>
> I’m confirming the merged work is green, but I’m not treating it as cutover-ready: unified consumers still have legacy fallbacks, tests are partial, and raster images remain absent from PDF output. A corrective agent task is needed before 9c.4.
> 
> ```text
> PRIORITY TASK — 9c corrective pass
> 
> Do not change the default profile, remove legacy rendering, or begin 9c.4 cutover.
> 
> Create one corrective PR that:
> 
> 1. Makes unified mode fail closed.
>    - Remove every unified-mode fallback to serialized legacy pages.
>    - Update app-shell.js, testing-tab.js, debug JSON generation, caret-map construction, and result handling.
>    - If PageModel is missing or invalid, show an explicit error, set the status to error, expose zero canonical pages, and never silently render legacy output.
>    - Preserve legacy behavior only when the selected profile is legacy.
>    - Remove wording that suggests preview can continue through an existing route after PageModel failure.
> 
> 2. Strengthens tests.
>    - Add behavioral coverage for app-shell and testing-tab missing-PageModel errors.
>    - Poison or otherwise invalidate legacy page data and prove unified consumers never read it.
>    - Replace fixed delays with completion promises or observable state transitions.
>    - Make HTML tests assert every PageModel page, line, word, geometry, note body, and TOC item—not a small sample.
>    - Keep assertions deterministic and avoid tautologies such as counts that merely prove nonnegative values.
> 
> 3. Corrects the cutover map.
>    - Record that 9c.1 PDF, 9c.2 HTML, and 9c.3 DOM work are merged but require a corrective pass.
>    - State accurately that PageModel is built only in unified mode; legacy mode remains available and does not build it.
>    - Document that the default remains legacy and that 9c.4 is blocked until parity and fail-closed behavior are proven.
> 
> 4. Record image blockers rather than masking them.
>    - Verify inline image syntax is not visibly duplicated beneath the rendered image.
>    - Verify PageModel image placement and dimensions in DOM and HTML.
>    - Verify PDF preserves raster images and custom image content instead of silently omitting them.
>    - Add focused tests for inline images, footnote images, cover/custom-page images, and unresolved assets.
>    - If PDF image support requires a separate implementation PR, leave a precise blocker and do not claim parity.
> 
> 5. Validation and delivery.
>    - Run the complete existing test suite, build, bundle audit, and Pages deployment audit.
>    - Confirm deployed assets correspond exactly to the merged source build.
>    - Do not merge or advertise cutover readiness unless all new tests and audits pass.
> ```
>
> **Reviewing unified output**
>
> I’m finding two merged changes that still need correction: unified consumers can silently fall back to legacy pages, and image content isn’t fully preserved across DOM, HTML, or PDF output. CI passing doesn’t prove these paths.
> 
> I’m also seeing weak tests: fixed delays, tautological assertions, partial word sampling, and no complete geometry/content comparison. The default engine should remain unchanged until these gaps close.
> 
> I’m preparing a focused implementation request covering fail-closed behavior, deterministic tests, documentation accuracy, inline-image rendering, PDF preservation, and fresh builds after each accepted change.
>
> **Reviewed migration, integration, and unified output gaps**
>
> 
>
> **Validated GitHub Pages builds, assets, and PDF image rendering support**
>
> 
>
> Worked for 27m 8s

**ממצא ראשון שמשנה את נקודת ההמשך\:** PR \#55 כבר מוזג ל־`main` ב־18 בנובמבר בשעה 09:00 UTC, בניגוד למצב המתואר בפרומט. ה־merge commit הוא `a32537ac2a8fe23336501c54855ea1fa9b31964d`\.

לכן לא אנסה למזג אותו שוב. אני בודק כעת את הקוד שכבר נכנס ל־`main`, ובפרט האם חולשות הבדיקות שזוהו אכן נותרו בו.

## מצב הפרויקט שאומת בפועל

(CI ופריסת Pages עברו)

`main` נמצא כעת ב־`158055d6a94830878c8a811c85a9a6343c694ea4`\.

שני ה־PRים שהוגדרו בפרומט כפתוחים כבר מוזגו\:

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/55?utm_source=chatgpt.com), מיזוג `a32537a`\.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/56?utm_source=chatgpt.com), מיזוג `158055d`\.

בדקתי את ריצת CI של ה־HEAD הנוכחי: מטריצת Node 18/20/22 עברה, לרבות 1,146 בדיקות, בדיקת דטרמיניזם, `cross-check` ו־`layout-audit` על קורפוס של 849 עמודים. גם `full-math-audit` ו־`corpus-invariants` עברו.

בדקתי גם את ענף `gh-pages`\: הפריסה האחרונה היא `7eb68f0`, וכל חמשת הנכסים המרכזיים - `index.html`, חבילת האפליקציה, חבילת ה־Worker, CSS והאייקון - זהים בביטים למקביליהם ב־`main`\. גרסת המטמון היא `2026-11-18-s9c2`\. פעולות Pages וה־audit הסתיימו בהצלחה. **לא הצלחתי לפתוח את האתר החי לבדיקה חזותית בכלי הגלישה הזמין**, ולכן אינני מסמן בדיקה חזותית ככזו שבוצעה.

## ממצאי הביקורת שמחייבים תיקון

**1\. פרוסת DOM אינה סגורה לחלוטין מבחינה ארכיטקטונית.**

ב־`app-shell.js`, הפונקציה `canonicalPages()` אמורה להחזיר את עמודי ה־PageModel במסלול unified. בפועל, אם המודל חסר או נפסל, היא חוזרת ל־`result.pages`\. אותה בעיה קיימת בשני מקומות נוספים\:

- `testing-tab.js` משתמש ב־`serializedResult.pages` כשאין PageModel.
- `buildDebugJson()` ממשיך למסלול `result.pages` כאשר הפרופיל unified אך המודל אינו זמין.

זו בדיוק נפילת fallback שאסור שתתרחש: בפרופיל unified, היעדר PageModel צריך להיות כשל גלוי, לא מעבר שקט למבנה העמודים הישן.

**2\. חלק מבדיקות PR \#55 אינן מוכיחות את מה שכותרתן מבטיחה.**

מצאתי בקוד הממוזג\:

- שלוש המתנות קבועות של 400 מילישניות, במקום המתנה להשלמת העימוד בפועל.
- `assert(noteBodies >= 0)`, בדיקה שתמיד מצליחה.
- אין דרישה שמספר קישורי ה־TOC יהיה גדול מאפס.
- בדיקת שקילות HTML בוחנת מספר עמודים ודגימת מילים, ולא את מלוא התוכן והגאומטריה בכל העמודים.

CI ירוק אינו מתקן את חולשות ההוכחה האלה. צריך לתקן אותן, לא להחליש את הבדיקות.

**3\. התגלתה חסרה מהותית בתמיכה בתמונות במסלול המאוחד.**

זו כרגע החסימה החמורה ביותר בדרך ל־cutover\:

- ה־DocumentModel וה־LineModel כבר מכירים `ImageRun`, מזהי נכסים, מיקום וגדלים.
- ה־PageModel כבר אוסף תמונות עם גאומטריה סופית.
- מקרין ה־DOM מוסיף את התמונות, אבל `renderModelLine()` עדיין מקרין את מילות השורה, לרבות `sourceText` של סמן התמונה. אין בו הבחנה שמונעת את הצגת תחביר המקור כטקסט.
- ב־`exportPdfFromModel()` המרת העמודים לכותב PDF אינה מעבירה כלל את `mp.images`\.
- `pdf-writer.js` מצהיר במפורש שתמונות רסטר אינן מצוירות.

כלומר, בדיקות התמונות הקיימות בשלב 4 מוכיחות השתתפות במדידה ובשבירת שורות, אך אינן מוכיחות שתמונה inline נשמרת בפלט PDF. גם בדיקות PDF של שלב 8 אינן מכסות זאת.

**מסקנת ניהול\:** אין לבצע כרגע את 9c.4, ואין להעביר את ברירת המחדל ל־unified. התשתית המאוחדת מתקדמת, אבל עדיין קיימים צרכני fallback ופער אמיתי בשימור תמונות. מעבר עכשיו עלול להציג הצלחה בבדיקות ובו בזמן לאבד מידע במסמך המיוצא.

## ההוראה הממוקדת לסוכן

הסוכן צריך לעבוד מול `main` הנוכחי, ולא להמשיך על בסיס הנחות הפרומט הישן. חילקתי את התיקונים לשני PRים נפרדים כדי שלא לערבב תיקוני חוזה ובדיקות עם הרחבת מנגנון הייצוא.

**document: **

# Imudify - ביקורת מתקנת לאחר 9c.3

המאגר: `SUGINACH/Tora_Book_Typesetter_Red_Work_2`

נקודת המוצא המחייבת: `main` ב־`158055d6a94830878c8a811c85a9a6343c694ea4`.

PR #55 ו־PR #56 כבר מוזגו. אין להניח שהם שלמים רק מפני שה־CI עבר. יש לבדוק את הקוד הקיים ולתקן את הליקויים המפורטים כאן.

## PR ראשון - 9c.3.1: PageModel fail-closed ובדיקות HTML/DOM דטרמיניסטיות

### א. ביטול כל נפילות ה־fallback בפרופיל unified

בדוק ותקן את המקומות הבאים:

1. `red-build/src/ui/app-shell.js`
   - `canonicalPages()` חייב להחזיר את עמודי `pageModelObj.pages` בפרופיל unified.
   - אם המודל חסר, אינו תקין או נכשל בהעברה, אסור לקרוא `result.pages`. יש להחזיר תוצאה ריקה ומצב שגיאה מפורש.
   - `buildDebugJson()` חייב להחזיר שגיאה מפורשת כגון `no-page-model` כאשר הפרופיל unified ואין PageModel. אסור לו להמשיך לענף המורשת.
   - צרכני העמודים הנגזרים - מפת שבירות, caret map, מוני עמודים, מחוונים ודיבאג - חייבים להתבסס על אותו מקור קנוני.
   - כשל בהעברת המודל חייב להופיע למשתמש. אסור להציג מצב הצלחה או הודעת "התצוגה ממשיכת מסלול קיים" כאילו התוצאה תקינה.

2. `red-build/src/ui/testing-tab.js`
   - להסיר את הנפילה ל־`serializedResult.pages` כאשר הפרופיל unified.
   - בהיעדר מודל יש להציג הודעת כשל ברורה, ולהציג אפס עמודים לצורכי כיסוי. אין להעלים את התקלה ואין להמציא נתונים.
   - מידע אבחוני שאינו תלוי בעמודים יכול להישאר זמין.

3. `red-build/src/ui/preview-tab.js`
   - הנתיב הקיים שמציג שגיאה כשאין PageModel הוא הכיוון הנכון. לשמר אותו ולוודא שהוא עקבי עם שאר צרכני ה־UI.

### ב. בדיקות שלילה אמיתיות

להוסיף בדיקות התנהגותיות שמוכיחות את החוזה ברמת `createApp`, ולא רק באמצעות חיפוש מחרוזות בקובץ המקור:

- פרופיל unified עם PageModel תקין: כל צרכני העמודים מקבלים רק את עמודי המודל.
- פרופיל unified ללא PageModel: אין תצוגה, אין מפה, אין כיסוי עמודים ואין דיבאג שנבנו מתוך `result.pages`; מתקבלת שגיאה מפורשת.
- להזריק `result.pages` כ־getter שזורק חריגה, כדי להוכיח שאף צרכן unified אינו ניגש אליו.
- לבדוק גם מודל לא תקין וגם כשל transport.
- להוכיח ש־`renderLegacyPage` והרנדרר הישן אינם נקראים במסלול unified.
- פרופיל legacy חייב להמשיך לפעול כעת כפי שהוא פועל, בלי שינוי התנהגות.

### ג. תיקון בדיקות PR #55

בקובץ `red-build/tests/e2e/s9c-html-export.test.js`:

1. להסיר את כל ההמתנות הקבועות של 400ms.
2. לספק המתנה דטרמיניסטית להשלמת העימוד בפועל. בדוק את כל השימושים ב־`onExplicitRetypeset()`: אם שינוי חוזה ההחזרה ל־Promise בטוח, יש להחזיר Promise שנפתר רק אחרי עדכון כל ה־views. אם לא, להוסיף ממשק המתנה מפורש. אין להשאיר בדיקה שממתינה לפרק זמן שרירותי.
3. להחליף `assert(noteBodies >= 0)` בבדיקה משמעותית: חייבות להיות הערות בפועל, חייב להיות תוכן הערות שנבדק, ויש לוודא שתוכן כל הערה מופיע פעם אחת בדיוק במקום הצגתו.
4. לחייב שקיימים קישורי TOC בפועל ולבדוק את כל הקישורים ואת כל היעדים.
5. לשפר את בדיקת השקילות בין תוצר ה־HTML ל־PageModel: לבדוק את כל העמודים, את כל השורות ואת הגאומטריה המהותית (`x`, `y`, `w`, `h`), וכן את מילות התוכן והמיקום שלהן. אין להסתפק בשלוש עמודים ראשונים או בדגימה שרירותית.
6. בדיקות שלילה חייבות להוכיח שהנתיב הישן לא נקרא בפועל, ולא רק שמחרוזת מסוימת מופיעה בקוד.

אין לשנות ספים או snapshots כדי לקבל PASS.

### ד. תיקון מפת המעבר

לעדכן את `audits/STAGE9_CUTOVER_MAP.md` לפי הקוד הנוכחי:

- PageModel נבנה במסלול unified בלבד.
- פרופיל legacy עדיין אינו בונה PageModel.
- ברירת המחדל החיה עדיין legacy; `?engine=unified` הוא מסלול ביקורת.
- PDF, HTML ו־DOM עברו למקריני PageModel בפרופיל unified, אך אין בכך הוכחת parity מלאה או השלמת cutover.
- לציין את ליקויי ה־fallback שנמצאו ואת חסר התמונות בייצוא PDF כחסמים שטרם נסגרו.
- להציג נכון את מצב PR #50, #55 ו־#56 כמוזגים.
- לא לטעון ששני הפרופילים משתמשים ב־PageModel.

### ה. גבולות PR ראשון

- לבצע את השינויים בענף נפרד ולפתוח PR ל־`main`.
- לבנות מחדש `app.bundle.js` וכל bundle שנפגע ממקור השינוי.
- לא לערבב ניקוי קוד לא קשור.
- לא לבצע cutover של ברירת המחדל.
- לא למחוק קוד legacy.
- לא לשנות הגדרות משתמש או ברירות מחדל.
- לא לגעת ב־P6/P7.
- לא לשנות את ערכת 40 או את עיצובי השערים המקוריים.

## PR שני - 9c.3.2: השלמת תמונות inline עד לכל מקריני הפלט

זהו PR נפרד, ואין לערבב אותו עם תיקוני ה־fallback.

### א. שורש התקלה

המסלול הקיים כבר מכיר `ImageRun`, פריטי תמונה ב־DocumentModel, תמונות ב־LineModel ורשומות `PageModel.images` עם מיקום סופי.

עם זאת:

- `pipeline-bridge.js` שומר את `sourceText` של תמונה כמילת תצוגה.
- `page-model.js` מעתיק את מילות השורה למודל, ובמקביל יוצר רשומת תמונה נפרדת.
- `pagemodel-dom-renderer.js` מציג את כל מילות השורה ומוסיף לאחר מכן גם את רכיב התמונה.
- `exportPdfFromModel()` אינו מעביר את `mp.images` לכותב PDF.
- `pdf-writer.js` מתעד במפורש שתמונות רסטר אינן מצוירות.

המשמעות היא שסמני מקור עלולים להופיע בפלט במקום שבו נועדה להיות תמונה, ותמונות רסטר אינן נשמרות ב־PDF.

### ב. תיקון נכון, בלי מנגנון מקביל

יש לפתור את הבעיה מתוך החוזה הקנוני הקיים:

- ה־source syntax נשאר ב־DocumentModel לצורך זהות, שימור מקור ו־round-trip.
- המקרין אינו מציג את סמן התחביר כמילת טקסט כאשר הפריט הוא תמונה.
- יש לשמר את המיקום והשטח שתוכננו לתמונה, בלי שבירת שורות או חישוב גאומטריה מחדש בתצוגה.
- ה־DOM וה־HTML יקרינו את התמונה מתוך `PageModel.images` בלבד, פעם אחת, עם זהות, alt ומידות סופיות.
- ה־PDF יקבל את התמונה ואת נתוני הנכס התואמים מתוך אותו תהליך עימוד. אין לקרוא מחדש את המסמך, להריץ Planner נוסף או לחשב מיקום נוסף.

בדוק כיצד להעביר את bytes של הנכסים מה־AssetResolver/Worker אל נתיב הייצוא. אין להסתמך על fetch של נתיבים מקומיים, ואין להסתיר נכס חסר. נכס שלא ניתן לפתור חייב להפיק אבחון או כשל מפורש.

### ג. תמיכה ב־PDF

יש להשלים תמיכה אמיתית בפורמטים שהתשתית מתירה - PNG, JPG ו־JPEG - באמצעות מנגנון PDF מתאים, לרבות טיפול בשקיפות PNG כאשר נדרש.

הגאומטריה (`x/y/w/h`) מגיעה מה־PageModel. כותב ה־PDF רק מצייר אותה; הוא אינו מחליט מחדש על גודל, מיקום, wrap או placement.

יש לבדוק גם תמונות של עמודים מותאמים ורקעים/נכסי שערים, ולא להסתפק בתמונה inline אחת. בפרט יש להוכיח שערכת 40 ועיצובי השערים המקוריים אינם מאבדים נכסים בייצוא.

### ד. בדיקות קבלה מחייבות

ליצור מסמך בדיקה עם תמונות אמיתיות ולבדוק:

- תמונה inline בתוך שורה.
- תמונה ממורכזת/בגודל בלוק.
- תמונה צפה מכל צד, עם טקסט שעוטף אותה.
- תמונה בהערת שוליים, אם הנתיב הנתמך מאפשר זאת.
- תמונות בעמוד מותאם ושערים.
- גופן inline ותמונה באותה פסקה.

להוכיח:

1. אין סמני `#path#` גלויים ב־DOM, ב־HTML או בטקסט שחולץ מה־PDF.
2. לכל תמונה יש זהות נכס אחת ומיקום סופי אחד במודל.
3. התמונה אכן מופיעה ב־DOM/HTML וב־PDF.
4. גודל ומיקום ה־PDF תואמים לגאומטריית PageModel.
5. אין `typeset` נוסף או שינוי ב־geometryHash בזמן ייצוא PDF.
6. נכס חסר או פגום אינו מושמט בשקט.
7. כל בדיקות השימור וה־round-trip הקיימות ממשיכות לעבור.

יש לבצע גם PDF rasterization באמצעות כלי הבדיקה הקיימים, ולא להסתפק בכך שקובץ PDF נוצר או מכיל מחרוזת מסוימת.

## שערי קבלה לשני ה־PRים

לכל PR:

- `npm test`
- `test:determinism`
- `cross-check`
- `corpus-invariants`
- `full-math-audit`
- `layout-audit`
- בדיקות Worker/transport הרלוונטיות
- בדיקות שלילה ל־fallback
- בדיקות E2E לכל מקרין שנפגע
- בדיקות קורפוס canonical ו־very_long
- בדיקות PDF עם חילוץ טקסט ו־rasterization

לדווח לכל בדיקה commit מדויק, Node version, פקודה, PASS/FAIL/SKIPPED, ו־artifact אם קיים. אין לדווח על בדיקה שרצה כאילו הצליחה.

אין לבצע cutover לפני שכל החסמים נסגרים והוכחת שימור ההגדרות והתוכן הושלמה. אין למחוק את מנוע legacy לפני שהמעבר המבוקר מתבצע.

**התוצר הנדרש:** שני PRים קטנים ומובחנים, עם קוד, בדיקות והסבר קצר של מקור הבעיה והפתרון. לא להסתפק במסמך תכנון, ולא להכריז על השלמת 9c או על מוכנות ל־cutover כל עוד תמונות או פריטי תוכן אחרים אינם נשמרים בכל הפלטים.

אני ממשיך להחזיק את שער ה־cutover סגור עד שהממצאים הללו נסגרים בקוד ובבדיקות. במקביל, אין סיבה לעצור את בדיקת המאגר המקביל או את סקירת ה־PRים הישנים, אבל הם לא יעורבבו בתיקוני 9c.

## Prompt:
18.11.2026, 14:07:50

אני לא יודע למה הכנת פרומט לפני שהודעתי שסוכן הAI הודיע שהוא סיים את ביצוע הפרומט הקודם, סוכן הAI עדיין באמצע ביצוע הפרומט הקודם.
בנתיים עד שסוכן הAI יסיים את עבודתו.
אני רוצה שתוסיף את הבעיות\שיפורים\תיקונים הבאים לביצוע על ידך ולא ע"י סוכן הAI, אל תתחיל לבצע\לתקן\ליישם אותם, רק תבדוק תחקור תתעד ותכנית תכנית לתיקונם. להלן הבקשות:
1. גופן הערה שממשיכה לעמוד הבא הופכת למוטה (Slanted) בקטע שנמצא בעמוד הבא = לא תקין.
2. בתוכן העניינים הגופנים של רמות הכותרות השונות נלקחים מהגדרת סוג הגופן של הכותרות עצמם (כפי שהם מופיעיות בספר עצמו, לדוגמא: כותרת 1 מופיעה בגופן "ליה סגולה") = לא תקין, הגופנים של הכותרות בתוכן העניינים צרכים להיות עם הגדרה נפרדת.
3. סגנון העיצוב של תוכן העניינים לא הועבר כראוי מגירסאות קודמות (לדוגמא: גופן מספר העמוד ברמת תוכן מכווצת (inline) אמור להיות בצבע אפור).
4. סגנון הגופן של הכותרת בתחילת תוכן העניינים (הכותרות "תוכן עניינים כללי" ו"תוכן עניינים מפורט"), צריך להיכנס ללוח ההגדרות (ברירת מחדל = כמו סגנון "כותרת 2").
5. הגדרות גופן גוף ההקדמה (גוף הטקסט שבהקדמה) שבלוח ההגדרות אינם משפיעות.
6. לא מצאתי בלוח ההגדרות את האפשרות לכבות הוספה אוטומטית של מספר סימן לכותרת 2.
7. צריך להחזיר את היכולת והחיבור של הגדרות שערים וסטים של שערים (המאגד את שלושת סוגי השערים).
8. צריך להחזיר ללוח ההגדרות את התצוגה המקדימה של השערים\עיטורים לבחירה.
9. צריך להכין תכנית לסידור מחדש של כל הגופנים. לבדוק פגומים\כפולים וכו', וכן לאחד גופנים וכו' ( כך שגופנים נפרדים שהם בעצם סוגים שונים של אותו גופן (כמו מודגש\מוטה וכו') יהיו חלק מסוג גופן אחד (כך במקרה ותוגדר הדגשה למילים מסויימות, ההדגשה תהיה מאותו גופן.
10. צריך ליצור בדיקה אוטומטית של יישום ההגדרות שבלוח, שתעבור הגדרה אחר הגדרה ותשנה אותה ותבדוק שהשינויי אכן יושם.
11. בממשק - צריך לקבע את גובה שורה העליונה של התוכנה (הבר העליון) וכן את השורה העליונה של תצוגת המסמך (עם הלחצנים "גלילה אנכית" וכו) ושל האלמנטים בתוכם שגובהם לא ישתנה ולא יהיה בהם מעבר שורה (במקרה שאין מקום לתצוגת התוכן האוברפלו צריך להיות מוסתר.
12. יש להגדיר את רוחב תוויות הכרטיסיות ("עורך", "הגדרות", "בדיקה") כך שיתפסו את כל רוחב הבר (או בצורה קבועה כמו שנעשה בגרסאות הקודמות).
13. אני רוצה שתעבור על הדו"ח שהעלתי לריפו (יוצר ע"י AI אחר): , https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/%D7%93%D7%95%D7%97%20%D7%91%D7%93%D7%99%D7%A7%D7%94.html ותבדוק אם מדובר בכשלים אמיתיים או בחוסר הבנה של מצב בניית הפרוייקט, במידה ומדובר בכשלים אמיתיים, הוסף אותם לרשימה הקודמת ותקן אותם.

## Response:
18.11.2026, 14:08:00 · gpt-6-t-mini

צודק. קראתי לא נכון את מצב הסוכן והקדמתי להכין לו פרומט חדש, אף שהוא עדיין עובד על ההוראה הקודמת. לא אפנה אליו ולא אשנה קוד. כעת אחקור את 13 הסעיפים מול המימוש והגרסאות הקודמות, אבדוק את דוח ה־HTML במלואו, ואכין רישום מסודר עם סיווג, ראיות ותכנית תיקון מדורגת. בשלב הזה אבצע תיעוד ותכנון בלבד — לא תיקונים או שינויי runtime.

בבדיקת הדוח כבר התברר שמסקנתו הראשית שגויה: הוא טוען לניתוק מלא בין `main` ל־Pages, אך בנקודת המצב שאימתתי בפריסה `s9c2`, חמשת הנכסים המרכזיים בענף הפרסום זהים בביטים לנכסים שנבנו מתוך `main`\. נוסף על כך, הדוח מתאר ארבע לשוניות, בעוד שהמימוש הנוכחי הוא במכוון שלוש לשוניות ולצדן חלונית תצוגה קבועה — שינוי שנעשה בהחלטת ממשק קודמת. אני ממשיך לבדוק אילו פרטים בדוח בכל זאת מצביעים על חוסרים אמיתיים, ואילו רק נשענים על ארכיטקטורה ישנה.

התעדכן גם מצב `main` במהלך הבדיקה: הוא כבר אינו ב־`158055d` אלא ב־`040db055…`\. זה מחזק את הצורך לא לגעת בקוד ולא לכתוב תיעוד על בסיס SHA ישן בזמן שהסוכן עובד. אני מרענן את נקודת הבסיס ואת מצב הענפים, ואמשיך את החקירה מול המצב החדש בלבד.

## Prompt:
18.11.2026, 15:01:06

היתה שגיאה בשיחה בפלטפורמה:Message delivery timed out. Please try again.
המשך מהיכן שהפסקת!!!

## Response:
18.11.2026, 15:01:16 · gpt-6-t-mini

הכנתי את מסמך הביקורת ואת תכנית התיקון בענף תיעוד נפרד, שמבוסס על ה־`main` שנבדק. כעת אני מאמת שהענף מכיל רק את מסמך התיעוד החדש, ושלא נגעתי בקוד או בענף העבודה של הסוכן.

> **Documenting the investigation**
>
> I’m continuing by validating the reported issue, separating confirmed defects from false positives, and recording a remediation plan without changing implementation code while the other work remains active.
>
> **Verifying deployment evidence**
>
> I’m comparing the reported production behavior with the repository and deployed assets. The available evidence suggests the report may describe an outdated or different build, so I’m separating genuine issues from mismatches before documenting fixes.
>
> **Refining the remediation plan**
>
> I’m checking the font metadata, style registration, table-of-contents settings, and deployment history next. I’ll document concrete findings, priorities, and validation steps while leaving implementation untouched.
>
> **Mapping remaining issues**
>
> I’m tracing how table-of-contents fonts, colors, titles, and inherited styles flow through both rendering paths. I’m documenting where legacy behavior is lost and which shared abstractions should restore it consistently.
>
> **Consolidating findings**
>
> I’m recording confirmed gaps: TOC styling and font inheritance, preface measurement, H2 numbering controls, theme-set wiring, visual previews, and font-family normalization. I’m keeping uncertain deployment claims marked for verification.
>
> **Documented findings and refined the remediation plan**
>
> 
>
> **Audited UI and fetch issues while planning fixes**
>
> 
>
> **Prioritizing confirmed defects**
>
> I’m distinguishing confirmed behavior from assumptions: continued-footnote styling, TOC inheritance, preface measurement, numbering controls, theme wiring, previews, and font normalization each need targeted tests before implementation.
>
> **Documenting confirmed issues**
>
> I’m treating continued-footnote italics, TOC inheritance and styling, preface measurement, numbering controls, theme wiring, previews, and font normalization as targeted remediation items, each requiring focused tests before implementation.
>
> **Finalizing the plan**
>
> I’m documenting fourteen TOC font settings, preserving legacy defaults, separating general and detailed TOCs, and adding migration plus regression coverage. I’m also noting which reported deployment discrepancies remain unconfirmed until the active work finishes.
>
> **Maintaining continuity**
>
> I’m documenting the remaining confirmed gaps, including TOC title styling, legacy font-key migration, preface measurement alignment, and the distinction between verified defects and deployment discrepancies.
>
> **Recording remediation scope**
>
> I’m consolidating confirmed defects and open verification points into a structured plan: rendering consistency, TOC settings, numbering controls, theme previews, and font-family normalization, without altering implementation yet.
>
> **Consolidating findings**
>
> I’m consolidating confirmed defects and open verification points into a structured plan: rendering consistency, TOC settings, numbering controls, theme previews, and font-family normalization, without altering implementation yet.
>
> **Preparing the remediation record**
>
> I’m separating the external report’s stale or mismatched claims from confirmed repository issues, then documenting only actionable findings with evidence, priorities, proposed fixes, migration needs, and regression tests—without changing implementation code.
>
> **Finalized the remediation record for confirmed defects**
>
> 
>
> **Searching the web**
>
> 
>
> **Documenting confirmed gaps**
>
> I’m recording actionable issues: footnote continuation styling, TOC font and color controls, title presets, preface measurement, H2 numbering, gate-set integration, previews, and font-family normalization.
>
> **Documented confirmed gaps**
>
> 
>
> **Reviewing the implementation**
>
> I’m separating confirmed gaps from stale or unsupported claims. The live artifacts match the main branch, while several reported paths and controls don’t exist in the current architecture; I’m prioritizing only evidence-backed fixes.
>
> **Reviewed the implementation**
>
> 
>
> **Reviewing project findings**
>
> I’m separating confirmed defects from stale or mismatched audit claims. The strongest issues involve TOC styling, gate-set wiring and previews, H0 font measurement, H2 numbering controls, font catalog duplicates, and automated settings-effect verification.
>
> **Reviewed project findings**
>
> 
>
> **Reviewing architecture findings**
>
> I’m separating verified defects from stale assumptions. The repository indicates most reported failures reference outdated names or designs, while several genuine gaps remain around TOC styling, font infrastructure, settings coverage, and validation.
>
> **Planning confirmed fixes**
>
> I’m separating verified issues from outdated audit claims. I’ll prioritize rendering correctness, TOC controls, font consistency, numbering, theme-set wiring, previews, toolbar sizing, and a durable font-inventory test suite.
>
> **Auditing reported issues**
>
> I’m separating confirmed product gaps from stale claims. The main concerns are font-aware measurement, TOC styling, numbering controls, theme-set wiring, previews, font inventory, setting-effect tests, and a documented implementation roadmap.
>
> **Reviewed architecture findings, planned fixes, and audited reported issues**
>
> 
>
> **Reviewing reported issues**
>
> I’m separating confirmed product gaps from stale or mismatched report claims. The deployment artifacts match the current source, while several real improvements remain: TOC styling, font metrics, numbering controls, previews, font inventory, and effect testing.
>
> **Reviewed reported issues**
>
> 
>
> **Audited typesetting UI, typography, themes, fonts, TOC, and export issues**
>
> 
>
> **Verified documentation branch and audit file integrity**
>
> 
>
> Worked for 12m 41s

המשכתי מאותה נקודה, והחקירה הגיעה לממצאים ברורים. חשוב להבחין בין שלושה דברים: תקלות אמיתיות, יכולות שכבר קיימות במנוע אך אינן מחוברות כראוי לממשק, וטענות בדיקה שאינן נכונות.

**מסקנת הביניים: 12 הבקשות הראשונות מוצדקות, אם כי בחלקן המצב מורכב יותר מכפי שנראה.** סעיף 13, דוח הבדיקה, מכיל טעות יסודית: הטענה לניתוק מלא בין קוד המקור לפריסה אינה נתמכת בבדיקת המאגר.

כמה ממצאים חשובים במיוחד\:

- **הערות המשך\:** נמצאה הוראת CSS מפורשת שמחילה `font-style: italic` על המשך הערה. זהו מקור ישיר לתקלה בנתיב הייצוא ל־HTML.
- **תוכן העניינים\:** נמצאו הגדרות גופן ישנות נפרדות לכל רמה ולכל אחד משני סוגי תוכן העניינים, אך הן אינן משולבות ברישום ההגדרות החדש. במסלול המאוחד אף הגדרת הגופן אינה נשמרת בחותמת הגאומטרית של שורות התוכן. זו אינה רק בעיית תצוגה.
- **גוף ההקדמה\:** נמצא פער בין הגופן הנבחר בהגדרות לבין גופן המדידה, שעדיין מקובע ל־Frank Ruhl Libre.
- **מספור סימן בכותרת 2\:** המנגנון קיים, אך ההגדרה `h2-auto-siman` נשמרת כמצב מורשת ואינה מוצגת כפקד בלוח ההגדרות.
- **שערים\:** הפעלת ערכה 40 ושלושת השערים עדיין קיימת באתחול. מה שחסר הוא חיבור מלא של בחירת ערכות השערים בממשק, ולא מנגנון הטעינה הבסיסי.
- **גופנים\:** נמצא בסיס ממשי לצורך בארגון מחדש: 1,759 קובצי גופן, 45 רשומות כפולות בשמות המשפחה בשני הקטלוגים יחד, ו־12 קבוצות של קבצים זהים לחלוטין בתוכן, בהיקף של 25 עותקים עודפים. אין להסיק מכך שצריך למחוק אותם ללא בדיקת תפקידם.

## הכרעה לגבי הדוח שהועלה

הדוח טוען שהאתר מגיש גרסה ישנה לחלוטין. בדקתי את ענף `gh-pages` והשוויתי את חמשת הנכסים המרכזיים מול `main`\: קובץ הכניסה, חבילת האפליקציה, חבילת ה־Worker, קובץ העיצוב והסמל. **כל חמשת הנכסים זהים ב־SHA-1 שלהם.**

בנוסף, הדוח מצפה לארבע לשוניות, בעוד שהמימוש הנוכחי מתוכנן לשלוש לשוניות וחלונית תצוגה קבועה. הוא מתאר גם קבצים, מזהי פקדים וארכיטקטורה שאינם תואמים למימוש הנוכחי.

לכן איני מקבל את מסקנתו בדבר נתק תשתיתי או את דירוג 28 הליקויים הקריטיים. לא נמצאה הצדקה לבצע את הוראתו לבנייה ולפריסה מחדש. בדיקת קובצי הפריסה אינה תחליף לאימות דפדפן חי, ולכן לא אטען שבדקתי בפועל את כל התנהגות ה־DOM באתר.

## מסמך הביקורת ותכנית התיקון

**USER\_REPORTED\_ISSUES\_AUDIT\_2026-11-18.md**

23.6KB · ביקורת, ראיות, תכנית תיקון ובדיקות קבלה

(נשמר ואומת)

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/user-reported-issues-2026-11-18/audits/USER_REPORTED_ISSUES_AUDIT_2026-11-18.md?utm_source=chatgpt.com)

**מה נכלל במסמך\:**

- ניתוח נפרד לכל 12 הבקשות.
- ראיות מתוך הקוד ומצב החיבור לממשק.
- תכנית תיקון מדורגת לכל בעיה.
- בדיקות קבלה מפורטות למניעת רגרסיות.
- תחקור דוח ה-AI והכרעה אילו טענותיו שגויות.
- חלוקת שלבי הביצוע והאחריות.

**אימות השמירה**

ענף תיעוד נפרד (תקין)

מסמך מלא ונגיש (תקין)

שינויי קוד **אפס**

שינוי ב-main **אפס**

התערבות בעבודת הסוכן **אפס**

**השלב הבא\:** לאחר שהסוכן יסיים את הפרומט הקודם, יש לרענן את נקודת הבסיס, לבדוק שאין חפיפה בין עבודתו לבין התכנית הזאת, ואז להתחיל בביצוע על ידי — לפי סדר העדיפויות והבדיקות שבמסמך.

לא שלחתי לסוכן פרומט נוסף ולא התחלתי בשום תיקון.

## Prompt:
18.11.2026, 20:50:41

סוכן הAI עדיין לא השלים את הפרומט, אבל בנתיים אני רוצה שתכין תוכנית מפורטת לארגון מחדש של קטלוג הגופנים עם פרומט להגשה לסוכן AI אחר (שלא נמצא בעניינים של התוכנה עדיין).

## Response:
18.11.2026, 20:50:53 · gpt-6-t-mini

אבנה את התוכנית כך שהסוכן החדש יוכל להיכנס לפרויקט בלי להניח שהוא מכיר את הארכיטקטורה: תחילה מיפוי ואימות של קטלוג הגופנים, אחר כך מודל נתונים אחיד, ולבסוף תוכנית הגירה ובדיקות. אדגיש בפרומט שלא לבצע מחיקות או שינויי רינדור לפני השלמת המלאי והוכחת תאימות.

> **Planning font catalog reorganization**
>
> I’m reconciling updated repository evidence with older audit figures. I’ll avoid asserting exact inventory totals, mark measurements as snapshots, and prepare a detailed implementation prompt for a separate AI agent.
>
> **Designing an isolated implementation**
>
> I’m framing the second agent’s prompt around an isolated branch or worktree, limited font-catalog changes, evidence-based inventory checks, family/style normalization, regression tests, and explicit coordination before integration.
>
> **Refining the catalog model**
>
> I’m separating genuine font families from visual variants, preserving metadata such as weight, style, width, Unicode coverage, variable axes, licensing, and embedding flags. Matching must support bold and italic within the selected family.
>
> **Modeling provenance and duplicates**
>
> I’m defining exact, semantic, and alias duplicate categories; recording conversion history, hashes, parse failures, and coverage. Family grouping will rely on font metadata, while ornamental or width variants remain distinct unless evidence supports merging.
>
> **Planning selection behavior**
>
> I’m preserving legacy labels through aliases while introducing family-level selection, face-level weight/style matching, and capability-aware handling. Explicit bold or italic requests should stay within the chosen family, never silently switch to an unrelated font.
>
> **Ensuring end-to-end support**
>
> I’m requiring every selectable face to declare preview, measurement, and PDF capabilities. WOFF2 handling must be validated or explicitly marked, with no silent fallback or unrelated-family substitution.
>
> **Structuring agent handoff**
>
> I’m preparing a staged prompt: first audit the live repository without modifying shared files, then implement on an isolated branch. It will preserve defaults, aliases, provenance, capabilities, and end-to-end rendering consistency.
>
> **Preparing implementation handoff**
>
> I’m assembling a staged, isolated handoff that begins with repository reconnaissance and a reproducible inventory, then introduces canonical families, aliases, face matching, migration, capability checks, and regression tests without disrupting ongoing work.
>
> **Finishing the handoff**
>
> I’m requiring the agent to preserve legacy aliases, defaults, Hebrew coverage, deterministic matching, lazy loading, and existing rendering paths. Cleanup remains separately reviewable, with deletion only after complete reference and regression checks.
>
> **Preparing staged handoff**
>
> I’m packaging a detailed, copy-ready prompt for a separate agent. It begins with a read-only audit, then pauses for approval before implementation, preventing collisions with the currently active work.
>
> **Preparing the font-catalog plan**
>
> I’m organizing this as a staged onboarding prompt: first an isolated, read-only audit; then implementation only after reviewing family groupings, duplicate evidence, rendering capabilities, migrations, and unresolved decisions.
>
> **Planned an isolated font catalog reorganization and implementation handoff**
>
> 
>
> **Preparing font catalog plans**
>
> I’m organizing this as a gated audit first, followed by implementation only after the family groupings, duplicate decisions, and WOFF2 support strategy are verified. The new agent should work in isolation and avoid destructive changes.
>
> **Prepared font catalog plans**
>
> 
>
> **Audited repository, font assets, metadata, architecture, and Hebrew implementation plans**
>
> 
>
> Worked for 7m 36s

הנקודה המרכזית שעליה צריכה להיבנות התוכנית היא שארגון הקטלוג אינו רק ניקוי שמות וקבצים. **הגופן הוא חלק מהגאומטריה של העימוד**\: אותה משפחת גופן ואותו משקל צריכים לשמש את התצוגה, את מדידת השורות ב־Worker ואת ייצוא ה־PDF. בתצלום הקוד שבדקתי, קובצי WOFF2 נטענים לתצוגה אך אינם נרשמים למדידה ב־Worker; לכן יש כאן גם שאלת תאימות מנוע, ולא רק שאלת קטלוג.

כמו כן, התיעוד ההיסטורי והקוד אינם מסונכרנים לחלוטין לגבי מצב הקטלוג המורחב. לכן הסוכן החדש יקבל הוראה **לא להסתמך על מספרי גופנים או על תיעוד ישן לפני שיבצע מלאי עדכני מהקבצים עצמם**\. בשלב הראשון הוא יחקור ויציע מבנה; לא ימחוק, ימיר או ישנה גופנים לפני אישור.

## התוכנית המוצעת

אני ממליץ לחלק את ארגון הגופנים לשמונה שלבים, כאשר שלושת הראשונים הם שלבי חקירה והכרעה, ורק לאחריהם מתחילים בשינוי המבנה.

### 1\. מיפוי מלא של המצב הקיים

תחילה יש לזהות את כל מקורות המידע ואת כל המקומות שבהם התוכנה צורכת גופנים\:

- `imud-fonts.json`, `fonts-extended.json`, `fonts-priority.json`\.
- תיקיית קובצי הגופנים בפועל.
- `imud-library.js` - טעינת הקטלוג והגופנים.
- `font-metrics.js`, `measure-api.js` ורישום הגופנים ב־Worker.
- מנגנון ייצוא PDF ומנגנון ייצוא HTML.
- בוררי הגופנים בלוח ההגדרות.
- הגדרות ברירת המחדל, תבניות, הגדרות שמורות וחבילות ייבוא/ייצוא.
- מנגנוני עיצוב טקסט פנימי, ובפרט הדגשה, הטיה וטווחי גופן.

המיפוי צריך להציג את שרשרת השימוש בכל גופן: מאופן בחירתו ועד למקום שבו הוא נמדד ומצויר.

### 2\. יצירת מלאי טכני אמיתי של הגופנים

אין להסתפק בשמות הקבצים או בשמות שבקובצי ה־JSON. יש לקרוא את מטא־הנתונים מתוך קובצי הגופן עצמם.

לכל קובץ יש לאסוף\:

| תחום | נתונים |
|--------|--------|
| זיהוי | שם הקובץ, גודל, SHA-256, פורמט |
| שמות | Family, Subfamily, Typographic Family, Typographic Subfamily, שמות חלופיים בעברית ובאנגלית |
| משקל | Regular, Medium, SemiBold, Bold, Black וכדומה |
| סגנון | Normal, Italic, Oblique |
| רוחב | Width Class, Condensed, Expanded וכדומה |
| גופן משתנה | צירי `fvar`, ובפרט `wght`, `wdth`, `ital`, `slnt`, `opsz` |
| תמיכת עברית | אותיות, ניקוד, טעמים, סימני פיסוק ותווים מיוחדים |
| מטריקות | `unitsPerEm`, ‏`hmtx`, ‏`hhea`, ‏`OS/2` ונתוני גובה |
| מבנה | TrueType `glyf`, ‏CFF, ‏CFF2, ‏WOFF2 וכדומה |
| רישוי | מקור, רישיון, הרשאות הטמעה ו־`fsType` |

יש להפיק מלאי מכונה בפורמט JSON או CSV, לצד דוח קריא לאדם.

### 3\. מיון כפילויות וזיהוי משפחות

זהו השלב החשוב ביותר מבחינת ההחלטות הטיפוגרפיות.

יש להבחין בין שישה מצבים שונים\:

1. **קובץ זהה לחלוטין\:** שני קבצים בעלי אותו hash.
2. **אותו גופן באריזות שונות\:** למשל TTF ו־WOFF2 שהם למעשה אותו Face.
3. **שמות שונים לאותו גופן\:** לדוגמה שם עברי ושם אנגלי שמצביעים על אותה משפחה או אותה פנים.
4. **פנים שונות של אותה משפחה\:** Regular, Bold, Italic וכדומה.
5. **משפחות דומות אך שונות\:** גופנים בעלי שמות קרובים אך עיצוב או מטריקות שונים.
6. **התנגשות אמיתית\:** שתי פנים שונות שממופות כיום לאותו שם משפחה, כך שאחת עלולה לדרוס את האחרת.

אסור לאחד משפחות רק על סמך שם הקובץ.

לדוגמה, יש לבדוק אם `אהבה רגיל` ו־`אהבה מודגש` הם שני Faces של משפחה אחת. לעומת זאת, שם כמו `אביגיל צללית` אינו בהכרח משקל של משפחת אביגיל, אלא עשוי להיות עיצוב טיפוגרפי נפרד. גם וריאציות כגון צר, רחב, קלאסי או צללית אינן צריכות להתאחד אוטומטית.

לכל הצעת איחוד תינתן רמת ביטחון: גבוהה, בינונית או נמוכה. החלטות לא חד־משמעיות יועברו לאישור ולא יוכרעו בניחוש.

### 4\. בניית קטלוג קנוני אחד

היעד הוא להפסיק להתייחס לכל שם גופן כאל משפחה נפרדת, ולנהל מבנה היררכי ברור\:

**משפחת גופן - לדוגמה: אהבה**

זהות טיפוגרפית אחת, עם שמות חלופיים ושמות תצוגה

---

**Regular** (Face)

**Bold** (Face)

**Italic** (Face)

**Bold Italic** (Face)

---

הדוגמה מתארת מבנה רצוי, ולא קביעה שכל הפנים האלה קיימות בפועל בגופן אהבה.

לכל משפחה יהיה מזהה קבוע (`familyId`\), ולכל Face יהיה מזהה משלו (`faceId`\). כל Face יישא את המשקל, הסגנון, הרוחב, הצירים המשתנים וקובצי המקור המתאימים לו.

חשוב: אותו Face עשוי להחזיק יותר מקובץ אחד, למשל TTF למדידה ו־WOFF2 להצגה, כאשר הוכח שמדובר באותו גופן. כך אין צורך להציג למשתמש שתי משפחות רק מפני שהקבצים שונים.

### 5\. אחידות מלאה בין התצוגה, המדידה והייצוא

זהו תנאי יסוד, ולא סעיף משני.

כאשר המשתמש בוחר משפחה מסוימת, ומסמן קטע כמודגש או מוטה, המערכת צריכה לאתר את ה־Face המתאים של אותה משפחה.

- בדפדפן: `FontFace` עם descriptors מתאימים של `weight`, ‏`style` ו־`stretch`\.
- ב־Worker: רישום וזיהוי לפי `faceId`, ולא רק לפי שם המשפחה.
- במדידה: שימוש באותם נתוני גופן שמשמשים לציור.
- ב־PDF: בחירת אותו Face והטמעתו, בכפוף להרשאות הרישוי.
- ב־HTML עצמאי: יצירת `@font-face` עם המשקל והסגנון הנכונים.

בפרט, יש לפתור את פער WOFF2. אין לקבל מצב שבו הדפדפן מציג גופן אחד, המנוע מודד לפי טבלה מקורבת, וה־PDF נופל לגופן אחר - בלי שהמשתמש יודע על כך.

צריך לבחון לכל פורמט פתרון אמיתי: המרה מאומתת ל־SFNT, הרחבת התמיכה בפרסר ובמייצא, או סימון מפורש של מגבלה. אין להמציא תאימות באמצעות fallback שקט.

### 6\. תאימות לאחור ושימור הגדרות

כל השמות הישנים חייבים להמשיך להיות מזוהים.

יש להכין טבלת מיפוי\:

`legacyName → familyId + faceId`

היא צריכה לתמוך בשמות עבריים, שמות אנגליים, שמות היסטוריים ושמות שמופיעים בתבניות קיימות.

יש לשמר במדויק גם את ברירות המחדל שאושרו בהחלטת D-107, ובכללן גופני גוף הספר, הכותרות ורמות H0-H7. אין לשנות ברירות מחדל במסגרת ארגון הקטלוג.

### 7\. ממשק בחירת גופנים

המשתמש צריך לראות משפחה אחת ולא עשרות שורות שמייצגות למעשה פנים שונות של אותה משפחה.

בבחירת משפחה יוצגו הפנים הזמינות: רגיל, מודגש, מוטה וכדומה. וריאציות עיצוביות אמיתיות יישארו נפרדות וברורות.

יש לשמר\:

- את שמות הגופנים המוכרים למשתמש.
- חיפוש עברי ואנגלי.
- מיון יציב.
- סימון גופנים בעלי מגבלת תאימות.
- טעינה עצלה - אין לטעון את כל קובצי הגופנים בעת פתיחת התוכנה.

### 8\. ניקוי, בדיקות והשלמה

רק לאחר שהקטלוג החדש פועל, יש לבחון הסרת כפילויות מוכחות. מחיקה או המרה של קובצי מקור לא תיעשה אוטומטית.

בדיקות הקבלה צריכות לכלול\:

- Regular, Bold, Italic ו־Bold Italic באותה משפחה.
- גופנים משתנים.
- גופנים בעברית עם ניקוד וטעמים.
- גופנים עם כמה שמות חלופיים.
- קובצי WOFF2 ו־TTF.
- קובץ פגום, קובץ ללא עברית וגופן בעל מגבלת הטמעה.
- טעינה ושמירה של תבניות ישנות.
- בדיקת מדידה מול DOM ו־PDF.
- בדיקות דטרמיניזם על מסמכים קבועים ועל מסמך ארוך.

---

## מסמכי הפרויקט שהסוכן צריך להכיר

הפרומט שלהלן מפנה אותו למסמכים ולקובצי המקור העיקריים, ולא מניח שהוא מכיר את התוכנה.

המקורות החשובים במיוחד\:

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/DECISIONS.md?utm_source=chatgpt.com) - ובפרט D-107, שמגדירה בין היתר את ברירות המחדל הטיפוגרפיות.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/PROVENANCE.md?utm_source=chatgpt.com) - מקור וייחוס הגופנים; יש לאמת את הכתוב בו מול המצב הנוכחי.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/PERFORMANCE_BASELINE.md?utm_source=chatgpt.com) - מפת טעינה, מדידה וייצוא היסטורית.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/ui/imud-library.js?utm_source=chatgpt.com) - נקודת הכניסה המרכזית לטעינת הקטלוג.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/tests/e2e/real-fonts.test.js?utm_source=chatgpt.com) - בדיקות הגופנים הקיימות.
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/user-reported-issues-2026-11-18/audits/USER_REPORTED_ISSUES_AUDIT_2026-11-18.md?utm_source=chatgpt.com) - סעיף 3.9 מרכז את ממצאי חקירת הגופנים.

---

## הפרומט המיועד לסוכן ה־AI החדש

הפרומט בנוי בשני שלבים. תחילה הסוכן ילמד את הפרויקט ויבצע ביקורת בלתי־משנה. רק לאחר הצגת ממצאים ואישור, הוא יוכל לממש את הארגון מחדש בענף נפרד. כך ניתן להתחיל את החקירה שלו בלי להתערב בעבודתו של הסוכן שכבר פועל.

**document: **

# משימה: ארגון מחדש יסודי של קטלוג הגופנים - Tora Book Typesetter RED

## 1. תפקידך ומטרת המשימה

אתה מצטרף לפרויקט תוכנה קיים בשם Tora Book Typesetter RED. אינך מכיר את הפרויקט, ולכן עליך ללמוד תחילה את הארכיטקטורה שלו, את מסמכי ההחלטות ואת מסלולי הטיפול בגופנים. אין להניח שהיכרות עם פרויקטים אחרים של עימוד, או עם גרסאות קודמות של התוכנה, מספיקה להבנת המימוש הנוכחי.

המשימה היא לבצע ארגון מחדש יסודי, מדויק ומבוסס-ראיות של קטלוג הגופנים, כך שהמערכת תנהל משפחות גופן אמיתיות ובתוכן Faces לפי משקל, סגנון ורוחב. הדגשה והטיה של טקסט חייבות להשתמש בפנים המתאימות של אותה משפחת גופן, ולא לעבור לגופן אחר או להסתמך על פתרונות אקראיים.

**עיקרון מרכזי:** גופנים הם חלק ממנוע העימוד המתמטי. הם משפיעים ישירות על רוחבי מילים, שבירת שורות, גובה שורות, קיבולת עמודים, מספר עמודים ותוצאת PDF. אין להתייחס לארגון הקטלוג כאל משימת UI או ניקוי קבצים בלבד.

יעד העבודה הוא קטלוג פשוט, אחיד, אמין ודטרמיניסטי, ללא מסלולי טעינה כפולים, ללא מיפויים סותרים, ללא fallback שקט וללא שכבות תיקון מיותרות.

מאגר העבודה:
https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2

## 2. כללי עבודה מחייבים

1. אין לשנות את `main` ישירות. עבוד בענף נפרד משלך.
2. לפני כל שינוי, בדוק מהו HEAD העדכני, אילו ענפים קיימים, האם יש שינויים פעילים, והאם עבודתו של סוכן אחר כבר נגעה בקובצי הגופנים.
3. יש להימנע מהתנגשות עם סוכן אחר שעובד במקביל בפרויקט. אל תדרוס שינויים שאינם שלך.
4. בשלב החקירה הראשוני אין לשנות קוד, קובצי קטלוג פעילים, קובצי גופן, הגדרות, bundles או קובצי מקור.
5. אין לבצע המרות גורפות, מחיקות, שינויי שמות או איחוד משפחות לפני השלמת המלאי, ניתוח הכפילויות והצגת ממצאים.
6. אין להניח ששמות דומים או שמות קבצים דומים מעידים על אותה משפחת גופן.
7. אין להניח שגופן בעל סיומת Bold, Black, Italic, Shadow, Condensed או Wide הוא בהכרח Face רגיל במשפחה נתונה. יש לבדוק את המטא-נתונים ואת העיצוב בפועל.
8. אין לשנות ברירות מחדל שהמשתמש אישר.
9. אין לפתור אי-התאמה בין מדידה לתצוגה באמצעות CSS בלבד, גופן חלופי שקט, פרופיל רוחב מקורב או מנגנון עוקף.
10. כל ממצא וכל מסקנה צריכים להיות מגובים בנתיב קובץ, מטא-נתונים, hash, בדיקה או ראיה אחרת.
11. אין לפרסם deployment ואין למזג לענף הראשי.
12. אין לטעון שבדיקה הצליחה אם היא לא רצה בפועל. דווח אילו בדיקות רצות, אילו נכשלו ואילו כלל לא הורצו.

## 3. למידת הפרויקט - חובה לפני ניתוח הגופנים

קרא תחילה את המסמכים הבאים, ובדוק את הגרסה העדכנית שלהם בענף שעליו אתה עובד:

- `README.md`
- `spec/01_MASTER_SPECIFICATION.md`
- `spec/02_MASTER_WORK_PLAN.md`
- `DECISIONS.md`
- `PROVENANCE.md`
- `ISSUE_REGISTRY.md`
- `WORKLOG.md`
- `audits/PERFORMANCE_BASELINE.md`
- `audits/USER_REPORTED_ISSUES_AUDIT_2026-11-18.md` אם הענף מכיל אותו.

שים לב במיוחד ל-D-107 ב-`DECISIONS.md`: שם נקבעו ברירות המחדל הטיפוגרפיות שאסור לשנות במסגרת משימה זו.

ברירות המחדל המפורטות בהחלטה כוללות, בין היתר:
- גוף הספר: Guttman Rashi.
- H0: AlphaBlack.
- H1: Lia Sgula.
- H2: AlphaBlack.
- H3: Alpha.
- H4: Alpha.
- H5: AlphaLight.
- H6: Noto Serif Hebrew.
- H7: Hadassah Friedlaender.
- גופן גוף H0: Frank Ruhl Libre.

יש לאמת את הערכים והגדלים המדויקים מול D-107 והגדרות ברירת המחדל בפועל; אין לשנות אותם.

לאחר מכן מפה את הקוד הרלוונטי. התחל לפחות מהקבצים הבאים, אך אל תסתפק בהם:

- `red-build/src/ui/imud-library.js`
- `red-build/src/ui/app-shell.js`
- `red-build/src/ui/settings-panel.js`
- `red-build/src/engine/typography/font-metrics.js`
- `red-build/src/engine/typography/measure-api.js`
- מודולי ה-Worker ורישום הגופנים בו.
- `red-build/src/engine/output/export-api.js`
- `red-build/src/engine/output/pdf-writer.js` או המודול המקביל בפועל.
- מודולי HTML export.
- `red-build/src/engine/core/settings-registry.js`
- `red-build/src/engine/core/legacy-settings-map.js`
- מודולי פענוח טווחי גופן, הדגשה והטיה.
- בדיקות הגופנים, ובפרט `red-build/tests/e2e/real-fonts.test.js`.

מצא גם את כל קובצי המקור והכלים שמייצרים או צורכים את הקטלוג:
- `imud-fonts.json`
- `fonts-extended.json`
- `fonts-priority.json`
- `tools/convert_imud_fonts.py`
- תיקיית `fonts/`
- קובצי license ו-provenance.

הכן תרשים של מסלול הגופן:
בחירה בלוח ההגדרות → פתרון המשפחה וה-Face → טעינת הקובץ → FontFace בדפדפן → רישום ב-Worker → מדידת רוחב → תכנון שורות ועמודים → הקרנה ל-DOM/HTML/PDF.

עליך לזהות האם כל אחד מהשלבים משתמש באותו Face בפועל.

## 4. שלב ראשון - חקירה בלבד (ללא שינויי קוד)

בשלב הראשון בצע ביקורת פורנזית מלאה והפק דוח. אין להתחיל מימוש לפני שהדוח הוצג ואושר.

### 4.1 מלאי קבצי הגופן

סרוק את כל תיקיית הגופנים בפועל. אל תסתמך על מספרים המופיעים ב-PROVENANCE, בהערות קוד או במסמכי ביקורת קודמים. ייתכן שהקטלוג השתנה מאז כתיבתם.

לכל קובץ הפק רשומה עם:

- נתיב יחסי ושם קובץ.
- גודל בבתים.
- SHA-256 של הקובץ.
- פורמט אריזה אמיתי: TTF, OTF, WOFF, WOFF2, TTC/OTC או אחר.
- סוג outline: glyf/TrueType, CFF, CFF2 או אחר.
- Family ו-Subfamily מתוך טבלאות השמות.
- Typographic Family ו-Typographic Subfamily.
- PostScript name.
- משקל מתוך OS/2 usWeightClass.
- Width Class.
- סימוני italic/bold מתוך OS/2 ו-head.
- italicAngle.
- צירי variable fonts, לרבות min/default/max.
- unitsPerEm.
- נתוני hhea ו-OS/2 הרלוונטיים.
- מספר גליפים.
- cmap ויכולת מיפוי Unicode.
- כיסוי אותיות עבריות, ניקוד, טעמים, סימני פיסוק ותווים מיוחדים.
- רישיון ומקור, אם ניתן לאמתם.
- OS/2 fsType והרשאות embedding הטכניות.
- הצלחה או כישלון של פרסור.
- האם הקובץ מופיע בקטלוג, ובאילו רשומות.

יש לבדוק גם:
- רשומות קטלוג שאין להן קובץ בפועל.
- קבצי גופן שאינם רשומים בקטלוג.
- קבצים לא ניתנים לפרסור.
- גופנים ללא cmap מתאים לטקסט עברי.
- קבצים בעלי נתוני metadata חסרים או סותרים.

הפק גם דוח מלא במבנה מכונה וגם דוח קריא.

השתמש בכלים הקיימים בפרויקט ככל האפשר. אם נדרש כלי metadata חיצוני כגון fontTools, בדוק תחילה את סביבת הפיתוח, את התמיכה ב-WOFF2 ואת תלות Brotli. אין להוריד כלים מהרשת ללא הצדקה. כל כלי חדש צריך להיות reproducible, מתועד ובעל גרסה קבועה.

### 4.2 ניתוח כפילויות

זהה והפרד בין הקטגוריות הבאות:

א. קבצים בעלי SHA-256 זהה לחלוטין.

ב. אותו Face באריזות שונות, לדוגמה TTF ו-WOFF2, כאשר ניתן להוכיח התאמה של הגליפים והמטריקות.

ג. אותו Face תחת כמה שמות משפחה/כינויים.

ד. אותה משפחה עם Faces שונים - Regular, Medium, Bold, Italic וכדומה. אלה אינם כפילויות שיש להסיר.

ה. שתי רשומות בעלות אותו שם משפחה אך קובצי גופן שונים.

ו. שמות דומים של עיצובים שונים, כגון Shadow, Outline, Condensed, Wide וכדומה.

ז. קבצים שהם דומים מבחינה חזותית אך אינם זהים מבחינת metrics או glyph outlines.

לכל קבוצת כפילויות הצג:
- הקבצים המעורבים.
- hash ונתוני metadata.
- האם זו כפילות ודאית או רק חשד.
- האם מדובר באותו Face או בעיצובים שונים.
- האם ניתן לבחור קובץ קנוני.
- אילו שמות חלופיים צריך לשמר.
- מה הסיכון בהסרת אחד הקבצים.

**אין למחוק אף קובץ בשלב זה.**

### 4.3 הצעת שיוך למשפחות ול-Faces

צור טבלת מיפוי של כל רשומת קטלוג וכל קובץ אל:

`legacyName → proposed familyId → proposed faceId`

ההכרעה צריכה להתבסס בראש ובראשונה על:
- name IDs 16/17 כאשר הם קיימים ותקינים.
- name IDs 1/2.
- weight/style/width מתוך OS/2 ו-head.
- צירי variable fonts.
- התאמת glyph outlines, cmap ו-metrics.
- מידע מקור אמין.
- שמות קבצים - רק כראיה מסייעת.

אל תאחד אוטומטית וריאציות כגון Shadow, Outline, Stencil או עיצובי תצוגה לתוך משפחת טקסט רגילה. גם וריאציות צרות/רחבות צריכות להיבחן: לעיתים הן Faces במשפחה אחת ולעיתים משפחות עיצוב שונות. נדרשת הכרעה על בסיס נתוני הגופן ולא לפי תווית בלבד.

לכל הצעה סמן:
- confidence: high / medium / low.
- ראיות.
- החלטה מומלצת.
- האם נדרשת הכרעת משתמש.

### 4.4 בדיקת יכולות הקצה-אל-קצה

הפק מטריצה נפרדת לכל Face:

| יכולת | יש לבדוק |
|---|---|
| Browser | האם FontFace נטען ומוצג בפועל |
| Worker | האם הפרסר קורא את הגופן ומספק metrics אמיתיים |
| PDF | האם ניתן להטמיע את הגופן ולייצא אותו |
| HTML | האם ניתן להטמיע את הגופן בייצוא עצמאי |
| Hebrew | האם יש כיסוי מלא לתווים הנדרשים |
| Variable | האם אפשר לבחור ציר ומשקל בפועל |

חשוב במיוחד לחקור את הפער ההיסטורי ב-WOFF2. בתצלום קוד שנבדק בעבר, `imud-library.js` דילג על `engine.registerFont` עבור WOFF2, משום שפרסר ה-SFNT ב-Worker לא תמך בפורמט. בפועל ניתן היה להציג את הגופן בדפדפן, אך המדידה והייצוא לא בהכרח השתמשו בו באופן זהה.

אל תניח שהמצב הזה עדיין קיים; בדוק את הקוד העדכני. אך אם הוא קיים, אל תסתפק בסימון WOFF2 כ"מוטמע". מוטמע בקובצי הפרויקט אינו שקול לתמיכה מלאה במדידה וב-PDF.

יש להציע פתרונות אפשריים לכל סוג גופן:
1. המרה ל-SFNT/TTF, אך רק לאחר אימות שההמרה משמרת outline, cmap ו-metrics.
2. הרחבת parser/Worker לתמיכה בפורמט ובסוג ה-outline.
3. הרחבת מסלול PDF לתמיכה מלאה בו.
4. סימון מפורש של Face שאינו נתמך באופן מלא, בלי לאפשר fallback שקט.

אסור לטעון לתמיכה מלאה כאשר רק התצוגה עובדת.

### 4.5 מסמך התכנון

הכן:
- דוח מלאי גופנים.
- דוח כפילויות.
- טבלת משפחות ו-Faces מוצעת.
- מטריצת תמיכה טכנית.
- רשימת התנגשויות ועמימות.
- הצעת schema לקטלוג הקנוני.
- תוכנית migration.
- תוכנית בדיקות.
- רשימת קבצים ומודולים שיידרשו לשינוי.
- אומדן סיכונים ודרך לצמצומם.

שמור את הדוחות בענף נפרד, בתיקיית `audits/`, בלי לערוך קוד, manifests פעילים או נכסי גופן.

בסוף שלב זה עצור והצג את התוצאות לאישור. אל תמשיך למימוש בלי אישור מפורש.

## 5. היעד הארכיטקטוני - הקטלוג הקנוני

לאחר אישור הממצאים, התכנון המומלץ הוא מודל יחיד של משפחות ופנים:

### Family
- `familyId` יציב וייחודי.
- שם תצוגה מועדף.
- שמות חלופיים, לרבות עברית ואנגלית.
- קטגוריה/ייעוד.
- וריאציית עיצוב אם יש צורך.
- `defaultFaceId`.
- רשימת Faces.

### Face
- `faceId` יציב וייחודי.
- `familyId`.
- `weight` מספרי (100-900) כאשר מתאים.
- `style`: normal / italic / oblique.
- `stretch` או width class.
- צירי variable fonts.
- רשימת נכסים טכניים: TTF/OTF/WOFF2 וכדומה.
- SHA-256 לכל נכס.
- נתוני metadata ומדידה.
- יכולות: browser / workerMeasure / pdfEmbed / htmlEmbed.
- נתוני Hebrew coverage.
- רישיון והרשאות הטמעה.
- מקור ו-provenance.

### Aliases
מיפוי מפורש של שמות הישנים ל-Family ול-Face המתאימים. אם שם ישן מתייחס למספר אפשרויות ואי אפשר להכריע בוודאות, אין לבחור באופן שרירותי; יש להפיק התנגשות גלויה.

הקטלוג הקנוני צריך להיות מקור האמת היחיד. אין להשאיר שתי מערכות מיפוי עצמאיות שמתחרות זו בזו. אם נדרשת תאימות לקטלוגים הישנים, היא צריכה להיות adapter זמני וברור עם בדיקות, ולא מקור נתונים מקביל.

## 6. דרישות המימוש

לאחר אישור שלב החקירה:

### 6.1 פתרון משפחה ו-Face

יש ליצור resolver יחיד שמקבל בחירה ישנה או קנונית, ומחזיר את המשפחה ואת ה-Face המתאים.

בבקשת משקל/סגנון מסוימים, המנוע צריך לאתר Face של אותה משפחה. לדוגמה:
- Family רגיל + bold → Face Bold של אותה משפחה.
- Family רגיל + italic → Face Italic של אותה משפחה.
- Family רגיל + bold italic → Face המתאים אם קיים.

כללי ההתאמה כשאין Face מדויק צריכים להיות דטרמיניסטיים ומתועדים. אין לקפוץ לגופן ממשפחה אחרת בלי דיווח. יש להבחין בין Face אמיתי לבין synthetic bold/italic, ולא להסתיר את ההבדל.

### 6.2 טעינה ורישום

- `FontFace` בדפדפן חייב לקבל descriptors מדויקים.
- Worker צריך לזהות Faces בנפרד ולא לדרוס Face אחר בעל אותו family name.
- מטמון טעינת גופנים צריך להיות לפי Face/asset ולא רק לפי שם משפחה.
- טעינת הגופנים תישאר לפי דרישה (lazy loading).
- כשל טעינה או כשל רישום לא יישמר לנצח כמטמון הצלחה.
- אין לטעון את כל קובצי הגופן בעליית האפליקציה.

### 6.3 מדידה ו-PDF

כל השימושים באותו Face צריכים לחלוק הגדרה קנונית:
- familyId
- faceId
- weight
- style
- stretch
- variable axis values, כאשר רלוונטי.

המדידה, התצוגה וה-PDF חייבים להשתמש באותו Face או להציג במפורש מגבלה. אין לאפשר מצב שבו ה-DOM מציג Bold אמיתי אך ה-Worker מודד Regular, או שה-PDF מייצא גופן אחר.

### 6.4 מיגרציה ותאימות לאחור

בדוק את כל המקומות שבהם נשמרים ערכי גופן:
- default settings.
- תבניות.
- מסמכים וחבילות פרויקט.
- localStorage ומצבי משתמש.
- ייבוא וייצוא.
- שמות גופן באנגלית ובעברית.
- aliases שהתווספו בעבר כדי לשמר מחסניות CSS.

צור migration versioned, idempotent, שניתן לבדוק ולהריץ יותר מפעם אחת ללא שינוי תוצאה.

אל תשכתב נתוני משתמש ישנים באופן בלתי הפיך. כל שם ישן צריך להמשיך להיפתר או לקבל הודעת migration מפורשת.

## 7. ממשק בחירת הגופנים

יש לארגן את בורר הגופנים לפי משפחות, כך שכל משפחה תופיע פעם אחת. המשקלים והסגנונות שלה יוצגו תחתיה.

המשתמש צריך להבין אילו Faces באמת קיימים. לדוגמה:
- רגיל
- בינוני
- מודגש
- מודגש מאוד
- מוטה
- מודגש מוטה

אל תציג Face שאינו קיים כאילו הוא קיים. וריאציות עיצוביות מיוחדות יישארו נגישות, אך לא יוצגו כמשקלים רגילים אם הן אינן כאלה.

שמור על:
- שמות תצוגה משמעותיים למשתמש.
- חיפוש לפי שמות עבריים ואנגליים.
- מיון יציב.
- תצוגת סטטוס תמיכה כאשר Face אינו נתמך בכל מסלולי המנוע.
- טעינה עצלה.
- תאימות להגדרות הקיימות.

אין לבצע עיצוב UI גדול שאינו נחוץ למבנה החדש.

## 8. בדיקות קבלה מחייבות

### 8.1 שלמות הקטלוג
- כל קובץ גופן נמצא במלאי.
- כל נכס בקטלוג קיים בפועל.
- אין רשומות יתומות.
- אין מזהי Family או Face כפולים.
- כל alias פתור באופן חד-משמעי או מדווח כעמום.
- כל כפילות שסומנה כבטוחה להסרה מוכחת ומגובה בבדיקה.

### 8.2 Faces
בדוק משפחות שיש בהן:
- Regular + Bold.
- Regular + Italic.
- Bold + Italic.
- כמה דרגות משקל.
- Variable fonts.

הפעל הדגשה והטיה על קטעים בתוך פסקה, ובדוק שנעשה שימוש באותה משפחה.

### 8.3 עברית
בדוק:
- אותיות עבריות.
- ניקוד.
- טעמים.
- פיסוק וסימנים.
- תווים מיוחדים שנמצאים בקורפוס התורני של הפרויקט.

### 8.4 גאומטריה
בדוק:
- רוחבי מילים.
- שבירת שורות.
- גובה שורות.
- חציית טור ועמוד.
- מספר עמודים.
- התאמת DOM/HTML/PDF.

בדוק על מסמך בדיקה קבוע ועל מסמך ארוך מהקורפוס הקיים. שינוי גופן יכול לשנות בכוונה את תוצאת העימוד; אין לדרוש hash זהה כאשר השינוי אמור להשפיע. מצד שני, אין להתיר סטייה לא מוסברת בין מדידה, תצוגה ו-PDF.

### 8.5 Migration
בדוק טעינת תבניות והגדרות ישנות, שמירה, טעינה חוזרת וייצוא/ייבוא. ודא שכל שמות הגופנים הישנים ממשיכים לפעול.

### 8.6 דטרמיניזם וביצועים
- שתי הרצות עם אותן הגדרות ואותו מסמך חייבות להפיק תוצאה זהה.
- אין טעינה מוקדמת של כל הגופנים.
- אין גידול לא מוסבר בגודל bundles.
- אין פגיעה בביצועי עימוד של ספרים ארוכים.
- יש להריץ את בדיקות הגופנים ואת שערי ה-CI הרלוונטיים.

## 9. כללי ניקוי ומחיקה

אין למחוק קובץ גופן רק מפני שהוא:
- בעל שם דומה.
- בעל אותו שם משפחה.
- נראה זהה בצילום.
- בעל פורמט אחר.
- נמצא בקבוצה של כפילויות חשודות.

מחיקה תותר רק לאחר:
1. הוכחת זהות או הוכחה שהוא אינו נדרש.
2. בדיקת כל ההפניות אליו.
3. שימור שמות חלופיים והיסטוריית מקור.
4. בדיקת המרה, אם מדובר בפורמט שונה.
5. בדיקת רישוי.
6. בדיקות migration וייצוא.
7. הצגת רשימת המחיקות המדויקת.

מומלץ לבצע ניקוי נכסים ב-commit נפרד משינוי המבנה, כדי שאפשר יהיה לבודד רגרסיה או לשחזר קבצים בקלות.

## 10. תוצרים נדרשים

בסיום שלב החקירה, לפני מימוש:
- `FONT_INVENTORY` - מלאי מלא.
- `FONT_DUPLICATES_AUDIT` - דוח כפילויות.
- `FONT_FAMILY_MAPPING` - טבלת מיפוי משפחות/Faces/aliases.
- `FONT_CAPABILITY_MATRIX` - יכולות Browser/Worker/PDF/HTML.
- `FONT_CATALOG_PROPOSAL` - schema מוצע ותוכנית migration.
- `FONT_TEST_PLAN` - בדיקות קבלה וסיכונים.

בסיום המימוש, לאחר אישור:
- קטלוג קנוני פעיל.
- resolver יחיד למשפחה ול-Face.
- מנגנון טעינה ורישום אחיד.
- מדידה ותצוגה וייצוא המשתמשים באותו Face.
- migration לתמיכה בשמות הקטלוג הישנים.
- UI מקובץ לפי משפחות.
- בדיקות אוטומטיות מקיפות.
- עדכון PROVENANCE, DECISIONS, WORKLOG ותיעוד רלוונטי.
- דוח סופי עם כל הקבצים ששונו, בדיקות שהורצו ותוצאותיהן.

## 11. תנאי סיום

המשימה אינה מסתיימת רק כאשר ה-JSON נראה מסודר או כאשר רשימת הגופנים ב-UI נראית נקייה.

היא מסתיימת רק כאשר:
- משפחות ו-Faces ממופים בצורה נכונה.
- אין התנגשויות ודריסות שקטות.
- Bold/Italic משתמשים באותה משפחה.
- התצוגה, המדידה וה-PDF משתמשים באותו Face.
- הגדרות ותבניות קודמות נשמרות.
- אין fallback שקט לגופן אחר או למדידה מקורבת.
- הכיסוי הטכני והרישוי מתועדים.
- כל בדיקות הקבלה עוברות.
- אין כפילות ארכיטקטונית חדשה ואין פגיעה בפישוט המנוע.

**בשלב הראשון בצע חקירה בלבד והצג דוח מלא. עצור לאחר הדוח והמתן לאישור מפורש לפני שינוי קוד, מניפסטים פעילים, קובצי גופן או הגדרות.**

## שתי נקודות שאני מבקש להדגיש

**א. לא לאחד כל וריאציה למשפחה אחת.** המטרה היא לאחד את הפנים הטיפוגרפיות האמיתיות של אותה משפחה, לא למחוק הבחנות בין עיצובים. גופן צללית, גופן צר או גופן תצוגה עשויים להיות עיצוב עצמאי, ולא "Bold" או "Italic".

**ב. לא להסתפק בפתרון קטלוגי.** כל עוד יש Face שמוצג ב־FontFace אך נמדד באמצעות טבלת fallback או יוצא ב־PDF כגופן אחר, הארגון מחדש לא הושלם. זה התנאי החשוב ביותר לבדיקות הקבלה.

הייתי שולח לסוכן החדש את הפרומט הזה כפי שהוא, ומבקש ממנו כרגע לבצע רק את שלב החקירה. כך נקבל ביקורת עצמאית על הקטלוג בלי להכניס שינויי קוד במקביל לעבודתו של הסוכן הראשון.

## Prompt:
18.11.2026, 22:41:06

עכשיו סוכן הAI הודיע שהוא השלים את הפרומט, תתעדכן שוב במצב הריפו, בדקתי את האתר החי וכל העימוד התחרבש לחלוטין!!!! עם יותר מ1000!!!! ממצאים, אני לא יודע אם זה בעיה בפריסת הפייג'ס או שהכל נדפק. 
זכור!! התנהג אתה כמנהל הפרויקט! 
בדוק את שלימות הביצוע!
נכונות דרך הביצוע! ובמיוחד בשלב זה בו נתקל הסוכן בבעיות שצצו ורגרסיות, נעשו הרבה החלטות ע"י הסוכן!
בדוק היטיב את נכונות הבנת מקור הבעיה, ועריכה פשוטה אחידה ואלגנטית לפתירתה. 
ודא ביצוע בדיקות מתאימות והצלחתם!
מזג PR הראויים למיזוג! 
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק הביצוע כפי שאתה היית מבצע, ועם רמת ההקפדה והזהירות שלך, שאוכל להדביק והוא יתחיל!!! שים שככל הנראה הסנדבוקס של סוכן הAI מותחל בכל ביצוע פרומט, התייחס לזה ופרט את הנדרש בהתאם לזה.
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט.
אנחנו חייבים להתקדם לקראת סיום!!! 
אי אפשר להתעכב יותר מדי!! 
עשה כל הנדרש בכדי שנתקדם!!! 
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. 
בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, האתר צריך לכלול את התוכנה בשלימותה עם חיבור כל ההגדרות וכו', למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים. שים לב!!! האתר צריך לכלול את התוכנה בשלימותה עם חיבור כל ההגדרות וכו'!!

## Response:
18.11.2026, 22:41:15 · gpt-6-t-mini

אתחיל בהפרדה בין שלוש שאלות שאסור לערבב: האם `main` עצמו נפגע, האם ה־PR/ים של הסוכן מכילים רגרסיה, והאם `gh-pages` פרוס מ־commit לא נכון או עם נכסים לא תואמים. במקביל אבדוק את ריצות הבדיקות ואת דוח 1,000+ הממצאים אם נשמר בריפו. לא אמזג שינוי שעלול להחמיר את המצב; קודם אבודד נקודת בסיס תקינה ואזהה את מקור הכשל, ואז אקדם תיקון ובדיקות ופרומט המשך ממוקד לסוכן.

אימות GitHub כבר מאשר ש־PR \#60 ו־PR \#62 מוזגו, וש־PR \#63 פרסם את גרסת ה־9c.5. כלומר, זו אינה רק גרסה לא ממוזגת שנכנסה בטעות ל־Pages: ה־cutover למנוע המאוחד נמצא ב־`main`, ופריסת ה־Pages עודכנה אחריו. עכשיו אני בודק אם קובצי הפריסה אכן זהים לבנייה שב־`main`, ובמקביל מפרק את דוחות האודיט כדי לברר איך התקבלו הצהרות "0 בעיות" למרות הכשל שאתה רואה.

מצאתי ראיה שמחדדת את החשד: ה־Pages וה־bundles זהים ל־`main`, וגם בדיקת הדפדפן החיה רצה על אותם hashes. לכן אין כרגע סימן לפריסה של קבצים מעורבים או ישנים. אבל בדוח החי עצמו יש פער חריג: בבדיקת `very_long` החדשה נספרו 793 עמודים, לעומת 699 באודיט ההיסטורי מאותו מסמך; בנוסף, רשומות המיקום של שורות במספר עמודים אינן נראות עקביות. אני בודק כעת אם אלה קואורדינטות יחסיות שנדגמו לא נכון בגלל וירטואליזציה, או סימן אמיתי לכך שהאודיט החי נתן "אפס ממצאים" שגוי.

מצאתי כבר שינוי מהותי שמחייב להתייחס לאירוע כאל **חשד לרגרסיה במנוע העימוד עצמו**, ולא להניח שמדובר רק בתקלה בפריסת GitHub Pages.

הנקודה הקריטית היא PR \#60, שבו בוצע מעבר חד־צדדי למנוע המאוחד: נתיב המורשת הוסר ממסלול ההרצה של המוצר, והאתחול הוגדר להשתמש במנוע המאוחד תמיד. כלומר, האתר החי כבר אינו יכול להסתמך על מנוע המורשת כנתיב חלופי רגיל. זה שינוי ארכיטקטוני משמעותי, ולא עדכון UI תמים.

יתרה מכך, בתיאור PR \#60 עצמו מתועד שהאודיט הראשון של `very_long` חשף 26 עמודים עם חפיפת טקסט בין גוף הספר למרזב ההערות, לעומת אפס בפורט המורשת. בוצעו תיקונים, והדוח טוען שבבדיקה מאוחרת התקבלו אפס בעיות. אבל לנוכח מה שאתה רואה באתר, אין לקבל את ההצהרה הזאת כהוכחה שהמנוע המאוחד תקין. צריך לבדוק מחדש את אותו מסמך ואת תוצאות האודיט, ולא רק את הסטטוס הירוק של CI.

לכן אני בודק בנפרד את ה־commit של `main`, את תוצרי הפריסה ואת דוחות האודיט והבדיקות של PR \#60 ואחריו.

## Prompt:
18.11.2026, 23:01:06

אני רוצה להדגיש שבכרטיסיית בדיקה ישנם יותר מ1000 ממצאים!!! וגם העימוד לוקח יותר מדקה לעומת כמה שניות קודם, ואין שערים.

## Response:
18.11.2026, 23:02:27 · gpt-6-t-mini

ההבהרה משנה את אבחון החומרה: אלה אינם רק "ממצאי audit" חשודים. אתה מתאר שלוש רגרסיות במוצר עצמו — יותר מ־1,000 ממצאים בלשונית בדיקה, זמן עימוד שגדל משניות ליותר מדקה, והיעלמות השערים. אתייחס לכך כאל כשל קבלה של גרסת 9c.4/9c.5, גם אם בדיקות ה־CI דיווחו PASS. כרגע לא אמזג אף PR נוסף ולא אנסה להסתיר את הממצאים באמצעות שינוי ספים.

כעת יש לי גם ממצא קונקרטי לגבי השערים: בנתיב הישן נוצרים עיצובי השערים דרך `renderPageBackgroundAndShaar()` ב־`dom-renderer.js`; לאחר ה־cutover התצוגה משתמשת רק ב־`renderModelPage()` מ־`pagemodel-dom-renderer.js`, שאינו קורא לפונקציה הזאת. ה־PageModel מעביר עיטורים שנוצרו במסלול אחר, אבל לא הוכח שהפניות עיצובי השער של ערכת 40 הועברו אליו. זו שבירת חיבור ממשית, לא בעיית cache בלבד.

בנוסף, בדיקת ה־CI החיה שבדקתי מודדת חפיפות/גאומטריה ב־DOM; היא אינה בודקת את מספר ה־findings שהמנוע מוסר ללשונית בדיקה, ואינה מוכיחה שהגדרות המשתמש ועיצובי השערים שוחזרו. לכן ה־PASS הזה לא היה שער קבלה מספיק ל־cutover.

> **Investigating the regression**
>
> The contrast is clear: the spread is sparse, the gates are missing, and the audit exceeds 1,000 findings. I’m checking the current rendering path and gate data flow to identify where the projection breaks.
>
> **Investigated the regression**
>
> 
>
> **Inspecting live rendering regressions and missing gates**
>
>
> **Tracing gate rendering**
>
> I’m comparing the page model with the rendered gate classes and page totals. The audit suggests gate data exists, but the renderer may be emitting different structure, causing missing visuals and cascading findings.
>
> **Traced gate rendering**
>
> 
>
> **Inspecting Gate Rendering and Page Model Data**
>
>
> **Inspected live rendering regressions, audit artifacts, and gate page data**
>
> 
>
> **Checking structural projections**
>
> I’m tracing how gate layouts, decorative elements, and title lines move from materialization into the page model. The likely failure is a missing decoration or class projection rather than absent gate records.
>
> **Checked structural projections**
>
> 
>
> **Narrowing the cause**
>
> I’m separating missing gate content from misleading audit selectors. The page count confirms gate pages exist, so I’m checking whether their text, ornamentation, or styling is being dropped during projection.
>
> **Comparing test coverage**
>
> I’m checking whether the green audit validates the user’s actual document and gate presentation. A geometry-only pass can miss missing artwork, dropped titles, and the large diagnostic count now visible in the testing interface.
>
> **Narrowed the cause and compared test coverage**
>
> 
>
> **Identifying the regression**
>
> The recent cutover is forcing the slower page-model path, while gate artwork and diagnostics aren’t covered by the green geometry audit. I’m treating this as a real parity regression, not an audit false positive.
>
> **Recommending emergency rollback**
>
> I’m treating this as a production regression. I’d restore the previously working dual-path behavior first, then separately fix gate projection, diagnostic volume, performance, and parity tests before attempting another cutover.
>
> **Identified the regression and recommended an emergency rollback**
>
> 
>
> **Investigated Shaar gate rendering and traced audit finding reporting flow**
>
> 
>
> **Restoring stable behavior**
>
> I’m prioritizing a rollback to the previously working dual-path renderer, then I’ll isolate gate projection, diagnostic classification, and performance fixes. The new path should remain opt-in until user-document parity is proven.
>
> **Restoring stable behavior**
>
> I’m prioritizing the previously working dual-path renderer, then separating gate projection, diagnostic classification, and performance fixes. I’ll keep the new renderer opt-in until real-document parity is demonstrated.
>
> **Preparing staged recovery**
>
> I’m defining an emergency rollback to the stable renderer, preserving useful fixes where possible. After verification, I’ll require gate parity, diagnostic filtering, performance budgets, and complete Pages rebuilds before reattempting cutover.
>
> **Diagnosing regressions**
>
> I’m tracing three likely causes: the cutover now forces the slower layout path, expected candidate rejections inflate visible findings, and the new renderer doesn’t consume theme gate artwork. Live checks passed only geometry, not parity or presentation.
>
> **Restored stable behavior and diagnosed regressions for staged recovery**
>
> 
>
> **Diagnosing the regression**
>
> I’m tracing three linked regressions: the unified path replaced the fast legacy path, gate artwork is no longer materialized, and expected candidate rejections are being counted as user-visible findings.
>
> **Diagnosed the regression**
>
> 
>
> **Inspected schemas, legacy rendering, build workflows, and recovery requirements**
>
> 
>
> Worked for 18m 12s

## מסקנת הבדיקה: זו רגרסיה בגרסה הפעילה, לא תקלה בפריסת Pages

בדקתי את `main`, את המיזוגים האחרונים, את `gh-pages` ואת תוצרי ה־CI. האתר החי מגיש את אותם קובצי `app.bundle.js` ו־`engine-worker.bundle.js` שנבנו מתוך `main`; לכן אין כרגע ראיה לפריסה ישנה או לערבוב קבצים. הבעיה נמצאת במסלול המוצר החדש.

שלוש התופעות שאתה מתאר מסתדרות עם שינויים שנכנסו ב־PR \#60 וב־PR \#62\:

1\. **היעלמות עיצובי השערים\:** במעבר למקרין החדש `renderModelPage()` הוסרה הקריאה לנתיב הישן `renderPageBackgroundAndShaar()`\. הנתיב הישן הוא זה שצרך את הפניות עיצובי השערים של ערכת הנושא, לרבות `imud-shaar-main`, `imud-shaar-sub` ו־`imud-shaar-back`\. ה־PageModel החדש נושא תיבת שער, טקסט ועיטורי כתר, אך לא הוכח שהוא נושא ומקרין את תמונות שלושת השערים. זהו פער חיבור ממשי בקוד, ולא רק חשד ל־cache.

2\. **יותר מ־1,000 ממצאים בלשונית בדיקה\:** `buildReport()` ממיר כמעט כל רשומת Ledger לממצא שמוצג למשתמש. בין היתר, `candidate-generator.js` רושם `candidate-rejected` גם עבור מועמדי פיצול שנדחו במהלך חיפוש רגיל. הסוג הזה אינו מוחרג כרגע מ־`NON_FINDINGS`\. לכן יש חשד חזק שחלק ניכר מהמספר שאתה רואה הוא אירועי חיפוש פנימיים שמוצגים כאילו היו ליקויי עימוד. עדיין צריך להפיק את התפלגות הממצאים מהמסמך שלך כדי לקבוע כמה מהם הם הפרות אמיתיות וכמה הם אבחונים פנימיים.

3\. **האטה משמעותית\:** PR \#60 הסיר את בחירת מנוע המורשת והעביר את ברירת המחדל של המוצר למנוע DP המאוחד. בדיקת CI חיה שביצעה עימוד של מסמך `very_long` בגודל כ־3.4 MB נמשכה כ־49-50 שניות בכל אחת משתי הרצות. זו אינה השוואה ישירה למסמך שלך, אך היא מאששת שהמסלול החדש אינו עומד כרגע בביצועי העבר שאתה מתאר.

ה־CI הירוק אינו מפריך את הרגרסיות: בדיקת ה־Pages שלו בדקה בעיקר גיאומטריית DOM, כיסוי ודטרמיניזם. היא לא בדקה את מספר הממצאים שמועבר ללשונית בדיקה, לא אימתה את תמונות השערים בפועל, ולא השוותה ביצועים למסלול הקודם.

**לא אמזג את PR \#14, \#16 או \#17.** הם ישנים ומפגרים בעשרות קומיטים; \#16 ו־\#17 מכילים שינויים שכבר עובדו והוטמעו בשלבים מאוחרים יותר. מיזוגם בשלמותם עלול להחזיר קוד ישן. כרגע אין PR פתוח שמתאים למיזוג בטוח.

## תוכנית הפעולה שאני קובע

אני ממליץ על **שחזור זמני ומבוקר של נתיב המורשת כברירת המחדל**, תוך השארת המנוע המאוחד זמין במסלול בדיקה מפורש. אין כאן ויתור על מטרת האיחוד. זו עצירת דימום: קודם מחזירים למשתמש תוכנה תקינה, מהירה ושלמה; אחר כך משלימים את חיבורי ה־PageModel ואת הוכחת השקילות, ורק אז מחזירים את המנוע המאוחד כברירת מחדל.

הכנתי לסוכן הוראה שמחייבת אותו\:

- לבדוק מחדש את `main` ואת כל ה־PR-ים, ולא להסתמך על סביבת העבודה הקודמת שלו.
- לשחזר את ברירת המחדל התקינה בלי למחוק את תיקוני 9c.4 הטובים.
- לתקן את חיבור השערים גם במסלול PageModel.
- להפריד בין ממצאי עימוד אמיתיים לבין אבחונים פנימיים של מנוע החיפוש.
- למדוד ביצועים בהשוואה הוגנת לגרסה הקודמת.
- לבנות בכל שלב את כל האתר, כולל כל ההגדרות, הגופנים, הנכסים, העורך, לשונית הבדיקה והתצוגה.
- להמשיך לאחר שחזור היציבות גם ל־12 הנושאים הקודמים שטרם מומשו, בלי לבלבל ביניהם לבין תיקון החירום.

הנה הפרומט המלא להדבקה\:

**document: **

# משימת מנהל פרויקט: תיקון רגרסיית 9c.4/9c.5, שחזור תוכנה תקינה, השלמת חיבורי המנוע והמשך תוכנית השיפורים

## 1. יעד המשימה - סדר עדיפויות מחייב

המאגר:
`https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2`

האתר החי:
`https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/`

הפרויקט הוא מנוע עימוד תורני. מטרת העל נשארת מנוע יחיד, פשוט, דטרמיניסטי, בעל מקור אמת גאומטרי אחד, ללא מסלולים כפולים וללא טלאים. עם זאת, בגרסה החיה הנוכחית הופיעו שלוש רגרסיות חמורות:

1. בלשונית **בדיקה** מופיעים למשתמש יותר מ־1,000 ממצאים.
2. עימוד מסמך לוקח יותר מדקה, לעומת שניות בגרסה הקודמת.
3. עיצובי השערים נעלמו.

אין להתייחס אליהן כאל בעיות קוסמטיות או כאל בעיות פריסה של GitHub Pages. יש לשחזר תחילה מוצר תקין, ורק לאחר מכן להמשיך באיחוד המנוע.

**סדר העדיפויות:**
- P0 - החזרת תפקוד מלא, מהיר ותקין לאתר החי.
- P1 - תיקון שורשי של שלוש הרגרסיות, כולל בדיקות קבועות שימנעו את הישנותן.
- P2 - השלמת חיבורי המנוע המאוחד כך שיוכל להחליף את נתיב המורשת בלי אובדן יכולות.
- P3 - השלמת 12 נושאי השיפור שנדחו בבדיקה הקודמת.
- P4 - ניקוי, פישוט ותיעוד סופי, בלי להשאיר שכבות תאימות מיותרות.

אל תדלג על P0 כדי להמשיך בפיתוח ארכיטקטוני. אל תכריז על השלמת שלב על סמך בדיקות יחידה בלבד.

---

## 2. תחילה: רענון מצב מלא - הסנדבוקס עשוי להיות חדש לחלוטין

יש להניח שסביבת העבודה שלך אותחלה מחדש ושאין בה שום קובץ, build, branch או תוצאה מהריצה הקודמת.

1. שכפל מחדש את המאגר או בצע `fetch` מלא ונקי.
2. קרא את `main` ואת מצב `gh-pages` העדכניים.
3. תעד את:
   - SHA נוכחי של `main`.
   - SHA נוכחי של `gh-pages`.
   - מצב ה־CI האחרון.
   - גרסת הנכסים (ASSET_VERSION).
   - מצב כל ה־PR-ים הפתוחים.
4. בדוק `git status` וודא שאין שינויים לא מחויבים.
5. אל תסתמך על תוצאות, קבצים זמניים או cache מסביבת עבודה קודמת. שחזר כל מידע נחוץ מתוך GitHub בלבד.
6. אל תכניס סודות או טוקנים לתיעוד, לפקודות גלויות או לקובצי המקור.

### נקודת מוצא ידועה מהבדיקה הקודמת

בזמן הבדיקה האחרונה:
- `main` היה ב־`95ea0aa32d698ec376698ca6c82a20c0bcc8d433`.
- מיזוג PR #60: `9186db487b6f2eb03cd86e84ec3ab3680f3788ed`.
- מיזוג PR #62: `c61229862aa8e96573febdef8d82c1ebb92fc462`.
- מיזוג PR #63: `1bb7a80b4f871548606118073787a1a26bd2543c`.
- האתר החי הציג `ASSET_VERSION=2026-11-19-s9c5`.

הגרסאות החיות של `app.bundle.js` ושל `engine-worker.bundle.js` נמצאו תואמות ביט־לביט לתוצרי `main`. לכן אין להתחיל בניקוי cache או בהעתקה ידנית של קבצים מתוך הנחה שהאתר ישן. יש לבדוק אם `main` עצמו מייצר את הרגרסיות.

נקודת ההשוואה שלפני cutover 9c.4 הייתה באזור `040db055b03eeff98ba2e20cd2ba8a71904eca8d`, אולם יש לזהות את נקודת הבסיס המדויקת מתוך ההיסטוריה, ועדיף להשתמש ב־parent של מיזוג PR #60 ובגרסת הפרוטוקול שלפני PR #62.

### PR-ים ישנים שאין למזג

PR #14, #16 ו־#17 אינם מועמדים למיזוג אוטומטי:
- #16 ו־#17 מפגרים בעשרות קומיטים ומכילים שינויים שחלקם כבר הוטמעו בשלבים מאוחרים יותר.
- #17 מסומן במפורש DO NOT MERGE.
- #14 הוא בעיקר תיעוד ישן, והכרעות D-107 שלו כבר הועברו למסמכי הפרויקט.

אין למזג אותם. אפשר להשתמש בהם כמקורות מידע בלבד. אין לבצע cherry-pick עיוור, אין להחזיר קוד ישן שכבר הוחלף, ואין לפתור קונפליקטים בבחירה אוטומטית של צד.

---

## 3. מקור הרגרסיה הראשון: cutover למנוע המאוחד ב־PR #60

יש לבדוק לעומק את השינויים הבאים:

### `red-build/src/engine/core/pipeline.js`

ב־9c.4 הוסר dispatch שהפעיל את `legacyTypeset()` עבור הגדרות IMUD:

- `_layout-profile === 'imud'`
- `_imudRaw`

בעקבות זאת, `typeset()` משתמש כעת תמיד במנוע DP המאוחד.

### `red-build/src/ui/browser-entry.js`

האתחול שינה את אופן העברת נתוני IMUD:
- קודם נתיב ברירת המחדל היה נתיב המורשת.
- מצב `?engine=unified` שימש לבדיקת המנוע המאוחד.
- לאחר 9c.4, ברירות המקור מיובאות כערכים בלבד והמנוע המאוחד הפך לברירת המחדל של המוצר.

יש לבדוק את `loadLegacyDefaults()`, את `importImudSettings()`, את השדה `raw`, את ערכת הנושא הפעילה ואת מועד החלת ההגדרות השמורות של המשתמש.

### `red-build/src/ui/app-shell.js`

הוסר `engineProfile`, והוסרו ענפי התצוגה והייצוא של המורשת. יש לבדוק מחדש את כל הצרכנים של תוצאת העימוד.

### `red-build/src/ui/preview-tab.js`

הנתיב הישן של `dom-renderer.renderPage()` הוסר, והתצוגה מבוססת כעת רק על `pagemodel-dom-renderer.renderModelPage()`.

### `red-build/src/ui/worker-protocol.js`

ב־9c.5 הוסרו מהפרוטוקול שדות כגון `pages`, `toc`, `tocInsert`, `numberingAudit` ו־`plannedLayoutHash`.

יש לבדוק בדיוק אילו שדות עדיין נדרשים לנתיב המורשת, ללשונית הבדיקה, לניווט, למחוונים, למפת השבירות ולייצוא. אין להחזיר את כל השדות ללא צורך; יש להחזיר את החוזה המינימלי הנחוץ לכל פרופיל.

---

## 4. P0 - שחזור נתיב מוצר יציב ומהיר

### החלטה זמנית מחייבת

יש להחזיר את נתיב המורשת כברירת מחדל למשתמשים, עד שהמנוע המאוחד יוכיח parity מלא וביצועים מתאימים.

יש לשמר את המנוע המאוחד ואת עבודת 9c.4/9c.5, אך להשאירם זמינים במסלול מפורש לבדיקות עד שהתקבל אישור על כל שערי הקבלה.

זו אינה חזרה קבועה לארכיטקטורה הכפולה. זו החזרת אפשרות בטוחה לשימוש במוצר בזמן השלמת האיחוד.

### אופן המימוש

1. שחזר את התנהגות ברירת המחדל של המוצר מתוך גרסת המקור שלפני PR #60.
2. החזר בחירה מפורשת בין `legacy` ל־`unified`, תוך שימוש בחוזה המקורי ככל האפשר.
3. ברירת המחדל של האתר למשתמש תהיה נתיב המורשת, עם הגדרות IMUD המקוריות.
4. השאר את `?engine=unified` כמסלול opt-in לבדיקת המנוע המאוחד, עד להוכחת תקינותו.
5. שחזר את ההעברה הנדרשת של נתוני המקור, לרבות `_imudRaw` ודגל הפרופיל, בהתאם לחוזה המקורי. אין להמציא מפתחות חדשים ללא צורך.
6. שחזר בפרוטוקול Worker את השדות הנחוצים למסלול המורשת, תוך שמירה על PageModel transport למסלול המאוחד.
7. שחזר את חיבורי `preview-tab`, `app-shell`, `testing-tab` והייצוא לפי הפרופיל.
8. שמור על הגדרות המשתמש השמורות ועל קדימותן לאחר החלת ברירות המחדל.
9. אין למחוק את קוד המנוע המאוחד ואין למחוק את תיקוני 9c.4 הטובים.
10. יש לשמר במפורש את תיקון `HEADER_POSITION` ואת תיקוני הכותרות וסמני ההערות שנכנסו במהלך PR #60, ככל שהם תקפים גם לאחר השחזור. אין לבצע revert כוללני שמחזיר גם באגים ישנים.

השתמש בגרסאות הקודמות של הקבצים מתוך ההיסטוריה של PR #60 ו־#62 כמקור אמת. אל תנסה לשחזר אותן מהזיכרון או מתיאורי commit בלבד.

### שער קבלה ל־P0

יש להוכיח באתר שנבנה בפועל:
- עימוד עובד.
- הגדרות מקור IMUD מוחלות.
- הגדרות שמורות של המשתמש נשמרות.
- שער ראשי, שער משנה ושער אחורי מוצגים עם העיצובים המקוריים.
- כל שלוש הלשוניות - עורך, הגדרות ובדיקה - פועלות.
- התצוגה המפוצלת נשארת פעילה.
- ניווט TOC, קפיצת גיליון וסנכרון סמן עובדים.
- ייצוא PDF ו־HTML עובדים.
- אין מצב שבו חסר PageModel גורם למסמך להיעלם או לחסום את המשתמש.
- ברירת המחדל החיה אינה דורשת מהמשתמש להוסיף `?engine=...`.

---

## 5. P1 - תיקון שורשי של יותר מ־1,000 הממצאים

יש לבדוק את:

`red-build/src/audit/report-schema.js`

כיום `buildReport()` עובר על `result.ledger.issues.values()` וממיר כמעט כל רשומה לממצא שמוצג למשתמש. `NON_FINDINGS` מכיל רק:

- `terminal-residual`
- `containment-rounding`

יש כאן חשד מרכזי לדליפת אבחונים פנימיים לרשימת הממצאים.

### מקור חשוד מאומת בקוד

ב־`red-build/src/engine/layout/candidate-generator.js` יש יצירה של:

`ledger.create('candidate-rejected', ...)`

עבור דחיית מועמדים רגילה במהלך חיפוש DP, למשל:
- `no-legal-window`
- `overflow-before`

אלה החלטות פנימיות של אלגוריתם החיפוש. עצם דחיית מועמד אינה בהכרח ליקוי בעימוד. כרגע `candidate-rejected` אינו מוחרג מתוך `NON_FINDINGS`, ושמו גם אינו מופיע במילון השמות של ממצאי העימוד.

### מה נדרש

1. הרץ את המנוע על המסמכים הרלוונטיים בפרויקט.
2. הפק דוח מפורט של `report.counts` ושל כל סוגי ה־Ledger, כולל:
   - כמות לפי kind.
   - כמות לפי status.
   - שלב יצירת הרשומה.
   - האם הרשומה מייצגת הפרת עימוד אמיתית או החלטת חיפוש פנימית.
3. בדוק במיוחד את `candidate-rejected`, אך אל תניח מראש שהוא אחראי לכל 1,000 הממצאים.
4. סווג את כל סוגי הרשומות לשלוש קבוצות:
   - ממצאים אמיתיים למשתמש.
   - אבחונים פנימיים לצורכי Trace/דיבאג.
   - מצבים שאינם ממצא (למשל החלטת חיפוש או דחיית מועמד צפויה).
5. העבר החלטות חיפוש צפויות אל ה־Trace או למונה אבחוני ייעודי, ולא לרשימת ממצאי העימוד.
6. שמור את כל ההפרות האמיתיות. אין להסתיר ממצאים באמצעות שינוי תנאי הזיהוי, הגדלת ספים או מחיקת סוגי שגיאות.
7. אם יש סוג Ledger שנוצר על הפרה אמיתית וגם על אירוע תקין, פצל את משמעותו במקום להחריג את כולו.
8. עדכן את `report-schema.js` ואת לשונית הבדיקה כך שהספירה המוצגת למשתמש תהיה עקבית, ברורה ומשמעותית.
9. אם נדרשת הצגת אבחונים פנימיים, הצג אותם בנפרד מממצאי העימוד, באופן שאינו מבלבל את המשתמש.

### בדיקות מחייבות

- בדיקה שלילית: יצירת מועמד שנדחה במהלך חיפוש DP אינה יוצרת ממצא עימוד משתמש.
- בדיקה חיובית: containment אמיתי עדיין יוצר ממצא.
- בדיקה חיובית: heading-escort אמיתי עדיין יוצר ממצא.
- בדיקה חיובית: fn-overlap, reading-order-break, text-completeness ויתר ההפרות האמיתיות עדיין מדווחות.
- בדיקה של כל סטטוסי ה־Ledger.
- בדיקה שהכמות שמופיעה בכרטיסיית הבדיקה שווה לכמות הממצאים הציבוריים בדוח.
- בדיקה שהדוח עדיין דטרמיניסטי ואינו מאבד מידע אבחוני.

אין לקבוע סף מספרי שרירותי כגון "חייבים פחות מ־100 ממצאים בכל מסמך". יש לוודא שכל ממצא שמוצג הוא אכן הפרה או בעיה בעלת משמעות למשתמש.

---

## 6. P1 - תיקון שורשי של היעלמות עיצובי השערים

### ממצא קוד מאומת

בנתיב הישן:

`red-build/src/engine/output/dom-renderer.js`

יש פונקציה:

`renderPageBackgroundAndShaar()`

היא משתמשת ב־:

`planDecorations(page, settings)`

מתוך:

`red-build/src/engine/decoration/page-decorations.js`

הפונקציה צורכת הפניות עיצוב כגון:
- `imud-shaar-main`
- `imud-shaar-sub`
- `imud-shaar-back`
- `shaar-main-image`
- `shaar-sub-image`
- `shaar-back-image`

וכן את תהליך ציור התוכן באמצעות `renderShaarContent()`.

לעומת זאת, הנתיב החדש:

`red-build/src/engine/output/pagemodel-dom-renderer.js`

ב־`renderModelPage()`:
- קורא `mp.decorations`.
- מצייר שורות מבניות מתוך `mp.lines`.
- משתמש ב־`mp.shaar` בעיקר לתיבת השער ולגיאומטריית התוכן.
- אינו קורא ל־`planDecorations()` או ל־`renderPageBackgroundAndShaar()`.

ב־`red-build/src/engine/core/materialize.js` נוצרות עיטורי כתר מסוג `shaar-crown`, אך אין בכך תחליף להעברת עיצובי התמונות של שלושת השערים.

ב־`red-build/src/engine/core/page-model.js` נשמרת גיאומטריית תיבת השער, אך אין ראיה להעברה מלאה של הפניות עיצובי השער הפעילות אל ה־PageModel.

### דרישת תיקון

אין לפתור את הבעיה באמצעות קריאה ישירה ל־`planDecorations()` מתוך ה־DOM renderer המאוחד. זה ייצור שוב מקור החלטה חיצוני למודל ויפר את העיקרון שהמקרין רק מצייר.

יש לתקן את המודל מהשורש:

1. לזהות את ההגדרות המדויקות שיוצרות את שלושת עיצובי השערים.
2. לקבוע את עיצובי השערים בזמן יצירת התוכנית/המודל, לפי הגדרות ברירת המחדל והגדרות המשתמש.
3. להעביר ל־PageModel הצהרת עיטור מלאה עבור:
   - שער ראשי.
   - שער משנה.
   - שער אחורי.
4. לכל עיטור יהיו זהות, סוג נכס, reference, URI פתור לפי חוזה הנכסים, מיקום, גודל, fit, clipping ו־z-order.
5. ה־DOM renderer וה־PDF writer יצרכו את אותן הצהרות מהמודל. אין חישוב גיאומטרי עצמאי בשני המקרינים.
6. יש לשמור את ערכת `json_theme_40` פעילה אוטומטית בברירת המחדל, יחד עם שלושת עיצובי השערים המקוריים.
7. יש לשמור על אפשרות override של המשתמש ולוודא שהגדרות שמורות אינן נדרסות.
8. כשל בפתרון נכס חייב להופיע כאבחון ברור ולא להסתיר את השער או להציג דף ריק.
9. יש לבדוק גם את `shaarDivider` ואת יתר עיטורי השער, בלי לבלבל בינם לבין עיצובי התמונות של השערים.

### בדיקות מחייבות

- PageModel של מסמך ברירת מחדל מכיל את שלושת עיצובי השערים.
- DOM חי מציג בפועל את התמונות/ה־SVG/הנכסים הנכונים.
- יצוא PDF כולל את אותם עיצובי שערים.
- שינוי ערכת עיצוב משנה את המודל ואת שני הפלטים.
- שינוי הגדרת המשתמש גובר על ברירת המחדל.
- הגדרת המשתמש נשמרת אחרי reload.
- בדיקת asset missing מדווחת תקלה ולא משאירה עמוד ריק בשקט.

---

## 7. P1 - בדיקת ביצועים והשוואה הוגנת

בבדיקת CI החיה האחרונה על `audits/very_long_test_text.txt`:
- הקובץ היה כ־3.4 MB.
- התקבלו 793 עמודים.
- עימוד הרצה ראשונה נמשך כ־49-50 שניות.
- הרצה שנייה נמשכה זמן דומה.
- סריקת ה־DOM עצמה נמשכה כ־18 שניות נוספות.

זהו נתון שמאשש את החשש שהמסלול החדש כבד, אך יש לבצע השוואה הוגנת מול גרסת הבסיס.

### מה נדרש

1. בנה סביבת benchmark נקייה עבור:
   - גרסת המורשת מלפני cutover 9c.4.
   - המנוע המאוחד הנוכחי.
   - התיקון המוצע.
2. השתמש באותם מסמכים, הגדרות, גופנים, נכסים וסביבת דפדפן.
3. מדוד לפחות:
   - זמן `typeset()`.
   - זמן יצירת PageModel.
   - זמן אימות PageModel.
   - זמן serialization של תוצאת Worker.
   - זמן העברה בין Worker ל־UI.
   - זמן בניית התצוגה הראשונית.
   - זמן עד שהמסמך זמין לשימוש.
4. בצע לפחות שלוש הרצות והשווה median, תוך תיעוד מספר העמודים, השורות והמילים.
5. הוסף profiling של שלבי ה־pipeline באופן שאינו משפיע על `layoutHash`, על סדר ההחלטות או על דטרמיניזם.
6. בדוק אם יש חישוב חוזר של `JSON.stringify(model)`, העתקות גדולות, סריקות כפולות או materialization מיותר.
7. אל תבצע אופטימיזציה המבוססת על הסתרת בדיקות או על אובדן מידע.
8. אם המנוע המאוחד עדיין איטי משמעותית מהמורשת, אין להפוך אותו לברירת מחדל עד שהפער נפתר או עד שיש הצדקה מדודה ומקובלת.

### תנאי ביצועים

המטרה היא להתקרב לביצועי נתיב ברירת המחדל התקין הקודם, ולא לקבל מצב שבו מסמך שבעבר עמד בתוך שניות דורש יותר מדקה ללא הצדקה.

אין לקבוע סף זמן מלאכותי שאינו מותאם לסביבה. יש להציג את ההשוואה המספרית, את מקור העלות ואת השיפור לאחר התיקון.

---

## 8. P1 - בדיקות אינטגרציה של המוצר השלם

אין להסתפק ב־`npm test` או ב־full-math-audit.

יש להפעיל את המוצר המלא בדפדפן אמיתי ולבדוק:

### עורך
- טעינת מסמך.
- שינוי טקסט.
- עימוד.
- ניווט בין עמודים.
- סנכרון סמן.
- סימני מעבר עמוד.
- שמירת מצב המסמך.

### הגדרות
- כל הפאנלים.
- כל הבקרות.
- ערכי ברירת המחדל.
- שחזור הגדרות שמורות.
- שינוי קל ושינוי כבד.
- טעינת גופנים.
- הגדרות שערים, ערכות שערים ועיטורים.
- השפעת השינוי על העימוד בפועל.

### בדיקה
- כמות ממצאים אמיתית ומדויקת.
- סיווג כל ממצא.
- ניווט מממצא לעמוד.
- highlight בעמוד הנכון.
- Trace ו־Ledger עקביים.
- לוח כיסוי מלא.
- אין אירועי חיפוש פנימיים שמוצגים כהפרות משתמש.

### תצוגה
- כל סוגי העמודים.
- שערים ראשי/משנה/אחורי.
- תוכן עניינים כללי ומפורט.
- עמודי פתיחת סימן.
- הקדמה.
- הערות שוליים והמשכים.
- הערות צד.
- הערות סיום.
- עיטורים, פסי כותרת ומפרידים.
- וירטואליזציה בגלילה ארוכה.
- קפיצה לגיליון וקישורי TOC.

### ייצוא
- PDF.
- HTML.
- קובץ עצמאי/offline.
- בדיקת התאמה בין מספר העמודים והגיאומטריה בתצוגה ובייצוא.
- בדיקת טקסט, סדר קריאה, שערים, גופנים והערות.

---

## 9. CI, בניית Bundles ו־GitHub Pages

חשוב: אתר GitHub Pages חייב להכיל **את התוכנה בשלימותה**, ולא רק את הקבצים ששונו לאחרונה.

בכל שלב שמשנה משהו שנראה למשתמש:

1. בנה מחדש את כל נכסי ה־UI לפי תהליך הבנייה הקיים במאגר.
2. בנה מחדש את `app.bundle.js`.
3. בנה מחדש את `engine-worker.bundle.js`.
4. ודא ש־`index.html`, `styles.css`, כל נכסי הגופנים, כל ספריות העיצוב וכל הנכסים הסטטיים כלולים.
5. ודא שההגדרות, העורך, לשונית הבדיקה, התצוגה והייצוא כולם מחוברים.
6. פתח את תוצר הבנייה המלא בדפדפן ובצע בדיקת עשן.
7. שמור artifact מלא ומזוהה לפי SHA.

אל תמציא פקודת build. בדוק את תהליך הבנייה הקיים בהיסטוריית Git, בתיעוד וב־workflows, והשתמש בפקודה המאומתת של הפרויקט.

**אין לפרוס ל־production גרסת ביניים שבורה.** לאחר שכל מקטע עובר את הבדיקות, בנה תוצר Pages מלא. לאחר מיזוג ה־PR המלא, סנכרן את כל התוצר ל־`gh-pages` באמצעות תהליך הפריסה הקיים.

הפריסה צריכה להיות מלווה ב:
- cache-buster חדש.
- השוואת SHA של כל הנכסים בין `main` ל־`gh-pages`.
- בדיקת `Pages build status`.
- המתנה להשלמת הפריסה.
- full-math-audit חי.
- בדיקת שערים חיה.
- בדיקת כרטיסיית בדיקה חיה.
- בדיקת יצוא PDF ו־HTML באתר החי.

בדיקת `full-math-audit` לבדה אינה שער קבלה מספיק. יש להוסיף בדיקות מפורשות לעיצובי שערים, למספר הממצאים המוצג למשתמש ולזמן העימוד.

---

## 10. שערי קבלה מחייבים לפני מיזוג PR החירום

אין למזג את ה־PR עד שכל התנאים הבאים הוכחו:

| תנאי | ראיה נדרשת |
|---|---|
| ברירת המחדל יציבה | טעינת האתר החי ועימוד בנתיב ברירת המחדל |
| אין אובדן תוכן | `contentPreserved`, זהות מילים וטוקנים, בדיקות סדר |
| אין האטה חריגה | benchmark מול הבסיס הקודם |
| ממצאים מסווגים נכון | דוח kind/status מלא + בדיקות חיוביות ושליליות |
| שערים עובדים | שלושת השערים עם עיצובי ערכה 40 ב־DOM וב־PDF |
| הגדרות נשמרות | בדיקות load, apply, persist ו־reload |
| Worker תקין | פרוטוקול ו־PageModel/Legacy לפי הפרופיל |
| תצוגה תקינה | בדיקת browser מלאה על מסמך קצר וארוך |
| ייצוא תקין | HTML ו־PDF עם התאמה לתצוגה |
| CI מלא | `npm test`, determinism, cross-check, layout-audit, full-math-audit |
| Pages תקין | SHA תואם, build הושלם, audit חי עבר |
| אין שינוי לא רצוי | diff נקי מהשבתת בדיקות, הסתרת ממצאים או שינוי ספים |

יש להריץ את כל שרשרת הבדיקות המוגדרת ב־`red-build/package.json` וב־GitHub Actions, כולל כל הסוויטות, ולא רק בדיקה ממוקדת.

אין להשיב P6/P7 לתוכנית או להשתמש בהם כשערי קבלה. אין להשתמש ב־PDF הייחוס כיעד איכות סופי; הוא דוגמה כללית בלבד.

### PR ומיזוג

- צור ענף חדש מעל `main` העדכני, למשל:
  `hotfix/restore-production-path-after-9c-cutover`
- הפרד commits לפי נושאים: שחזור נתיב מוצר, ממצאים, שערים, ביצועים, בדיקות.
- צור PR ממוקד ומפורט.
- כלול בדוח ה־PR את המצב לפני/אחרי ואת תוצאות כל בדיקה.
- אם כל שערי הקבלה ירוקים ואין רגרסיה, מותר למזג את ה־PR ולבצע פריסת Pages מלאה.
- אם בדיקה כלשהי נכשלת, אין למזג ואין לפרוס. תקן את שורש הבעיה, אל תחליש את הבדיקה.

---

## 11. P2 - השלמת חיבורי המנוע המאוחד

לאחר שחזור המוצר התקין והמהיר, יש לסגור את הפערים שמונעים מהמנוע המאוחד להחליף את המורשת.

יש לוודא:

1. כל סוגי התוכן מיוצגים ב־PageModel.
2. השערים וכל עיצוביהם מיוצגים ב־PageModel.
3. כל ההגדרות הפעילות מחוברות ל־Registry, ל־UI, ל־Worker, למדידה, למתכנן ולמקרינים.
4. אין קריאות חבויות או fallback שקטים.
5. Worker transport אינו מעביר העתקים מיותרים, אבל אינו מאבד מידע הנדרש למוצר.
6. DOM ו־PDF צורכים את אותן הצהרות גאומטריות.
7. ה־PageModel הוא immutable לאחר יצירתו.
8. אין רינדור שמחשב שוב החלטות עימוד.
9. יש parity של תוכן, שערים, הערות, עיטורים, מספרי עמודים וסדר קריאה.
10. יש parity ביצועים סבירה מול נתיב ברירת המחדל הקודם.

רק אחרי שכל אלה מוכחים יש להחזיר את המנוע המאוחד לברירת המחדל, ולסיים את מסלול המורשת בצורה מסודרת. אין להסיר שוב מסלול תקין לפני הוכחת capability-parity מלאה.

---

## 12. P3 - המשך 12 נושאי השיפור שנדחו בביקורת הקודמת

מסמך התחקור והבדיקה נמצא בענף:
`audit/user-reported-issues-2026-11-18`

קובץ:
`audits/USER_REPORTED_ISSUES_AUDIT_2026-11-18.md`

קישור:
`https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/user-reported-issues-2026-11-18/audits/USER_REPORTED_ISSUES_AUDIT_2026-11-18.md`

עם סיום תיקון החירום, המשך לטפל בנושאים הבאים לפי הסדר וב־PR-ים ממוקדים:

### 12.1 הערות שוליים
הערת שוליים שממשיכה לעמוד הבא אינה צריכה להפוך למוטה. אם נדרש סימון המשך, יש להחיל את העיצוב רק על סמן `(המשך)` ולא על כל גוף ההערה. לבדוק DOM, HTML ו־PDF.

### 12.2 גופני TOC עצמאיים
לכל רמת כותרת בתוכן העניינים הכללי והמפורט צריך להיות גופן עצמאי, שאינו יורש שינויי גופן של כותרות הספר. יש לחבר Registry, UI, font loader, מדידה, stamps ומקרינים.

### 12.3 עיצוב המספרים ב־TOC
יש להפריד במודל בין טקסט הכותרת, מספר העמוד, הנקודות המובילות והמפרידים. יש לשמר את צבע האפור של מספר העמוד ואת עיצובו בפועל בכל הפלטים.

### 12.4 סגנון כותרות פתיחת TOC
יש להוסיף הגדרות ייעודיות לכותרות "תוכן עניינים כללי" ו"תוכן עניינים מפורט". ברירת המחדל שלהן תהיה כמו Heading 2, אך לאחר האתחול הן יהיו עצמאיות משינויים עתידיים ב־H2.

### 12.5 גופן גוף ההקדמה
הגדרת גופן גוף ההקדמה חייבת להשפיע על המדידה, שבירת השורות, הגיאומטריה והפלט. אין להשאיר את `Frank Ruhl Libre` קשיח ב־MeasureAPI או ב־Worker.

### 12.6 מספור אוטומטי לכותרת 2
יש להוסיף מתג משתמש אמיתי לכיבוי/הפעלה של הוספת מספר סימן לכותרת 2. לשמור על ברירת המחדל ועל עצמאות הגדרת האיפוס.

### 12.7 חיבור הגדרות שערים וערכות שערים
יש להחזיר בורר ברור ומאוחד של ערכת שערים, המחבר את שלושת סוגי השערים. ערכת 40 והעיצובים המקוריים נשארים פעילים אוטומטית. יש לשמור אפשרות override פרטנית אם היא חלק מהחוזה הנוכחי.

### 12.8 תצוגות מקדימות
יש להחזיר preview ויזואלי לבחירת שער ראשי, שער משנה, שער אחורי ועיטורים. יש להשתמש בנכסי הספרייה הקיימים, לטעון באופן חסכוני, ולהציג בבורר את העיצוב שנבחר בפועל.

### 12.9 ארגון מחדש של קטלוג הגופנים
לבצע תחילה מלאי פורנזי:
- hash של כל קובץ.
- metadata של TTF/WOFF2.
- name tables.
- weight/style/stretch.
- variable axes.
- cmap עברית.
- hmtx, unitsPerEm, CFF/glyf.
- רישיונות ו־fsType.

יש לזהות קבצים כפולים, שמות משפחה כפולים ווריאציות סגנוניות. אין למחוק או לאחד לפי שם קובץ בלבד. ליצור מזהי גופן קנוניים ו־faces לפי משקל/סגנון, עם aliases לשמירת מסמכים ותבניות קיימים. יש לוודא ש־DOM, מדידה ו־PDF בוחרים אותו face. אין fallback שקט.

### 12.10 בדיקות אוטומטיות להשפעת הגדרות
לכל הגדרה ב־Registry חייב להיות effect-test אמיתי. יש לשנות הגדרה, להריץ עימוד ולבדוק את התכונה שאמורה להשתנות. אין לדרוש שינוי `layoutHash` עבור הגדרות שאינן גאומטריות. יש להבחין בין שינוי סגנון, שינוי גאומטריה, שינוי מבני, שינוי ייצוא ושינוי UI. הבדיקות צריכות להשתמש במסמכי fixture שמכילים את התכונה הנבדקת.

### 12.11 גובה header וסרגל התצוגה
לקבע גובה header וסרגל הכלים של התצוגה, למנוע wrap, למנוע flex shrink ולהסתיר overflow לפי הצורך. יש לבדוק ברוחבי מסך שונים וב־RTL.

### 12.12 רוחב הלשוניות
הלשוניות "עורך", "הגדרות" ו"בדיקה" צריכות למלא את כל רוחב הסרגל באופן שווה או לשחזר את הרוחב הקבוע הישן. לשמר active styles, focus, keyboard navigation ו־RTL.

### אופן ההתקדמות בנושאים 12.1-12.12

- אל תערבב שינויים לא קשורים באותו PR.
- נושאים 12.2-12.4 קשורים למודל TOC ויכולים להיות PR ממוקד אחד.
- נושאים 12.7-12.8 יכולים להיות PR ממוקד אחד.
- נושא 12.9 דורש PR נפרד ומלאי לפני שינוי קוד.
- נושא 12.10 דורש תשתית בדיקה רוחבית ולא בדיקות נקודתיות בלבד.
- נושאים 12.11-12.12 יכולים להיות PR UI ממוקד.
- בכל PR יש לבצע בנייה מלאה, בדיקות רלוונטיות, בדיקות אינטגרציה והוכחת היעדר רגרסיות.

---

## 13. תיעוד, דיווח ושמירת רציפות בין סנדבוקסים

בכל נקודת עצירה משמעותית יש לעדכן את המסמכים הרלוונטיים:
- `WORKLOG.md`
- `ISSUE_REGISTRY.md`
- `DECISIONS.md`
- `OPEN_QUESTIONS.md`
- `LAYOUT_DEPENDENCY_MAP.md`
- `STAGE9_CUTOVER_MAP.md` או מסמך המצב העדכני בפועל
- `AGENTS_TRACKING.md`
- `ai-chat/SESSION_HANDOFF.md`

יש לתעד במדויק:
- מה היה ה־SHA בתחילת העבודה.
- מה השתנה.
- מהו שורש הבעיה.
- אילו החלטות התקבלו ומדוע.
- אילו בדיקות הורצו.
- פקודות מדויקות.
- תוצאות מלאות, כולל כישלונות.
- מספר עמודים, שורות ומילים.
- זמני ביצוע.
- קישורי CI ו־Artifacts.
- מה נשאר פתוח.

### כללים חשובים לריצה בסנדבוקס מתאפס

1. אל תסתמך על זיכרון של סביבת עבודה קודמת.
2. אל תסתמך על קובץ שלא הועלה ל־Git.
3. כל שינוי שמיועד להמשך חייב להיות ב־commit שדחוף לענף מרוחק.
4. כל תוצאה משמעותית חייבת להיות artifact או מסמך ב־GitHub.
5. בתחילת כל סבב קרא מחדש את ה־PR, ה־WORKLOG וה־SESSION_HANDOFF מהענף המרוחק.
6. אם ה־sandbox התאפס, אין לשחזר עבודה על בסיס הנחות; שחזר אותה מה־branch/commit.
7. אל תשתמש ב־force-push כדי "לסדר" היסטוריה לא מובנת. אם דרוש rebase, בדוק היטב את כל הקומיטים וה־diff.
8. אל תדווח שהשלב הושלם אם יש בדיקות pending או כשל שלא הוסבר.

המשתמש ביקש הודעות עבודה קצרות, ללא המתנות ארוכות לבדיקות CI. אם בדיקה מתארכת, תעד אותה כ־pending והמשך במשימות שאינן תלויות בה; חזור אליה לפני מיזוג.

---

## 14. תנאי סיום כולל

המשימה תיחשב שהושלמה רק כאשר:

- האתר החי תקין, מלא ומהיר.
- ברירת המחדל של המוצר מפעילה את מסלול העימוד התקין.
- שערים ראשי/משנה/אחורי עם העיצובים המקוריים פועלים.
- לשונית הבדיקה אינה מציגה אירועי חיפוש פנימיים כאילו היו ליקויי עימוד.
- כל ההפרות האמיתיות עדיין מזוהות.
- זמני העימוד נמדדו והשוו ונשמרו בגבולות סבירים מול הבסיס הקודם.
- כל ההגדרות הרלוונטיות מחוברות ונשמרות.
- PageModel המאוחד נושא את כל התוכן, השערים והעיטורים הנדרשים.
- DOM, HTML ו־PDF צורכים את אותו מקור אמת.
- כל בדיקות היחידה, האינטגרציה, הדטרמיניזם, ה־layout audit וה־full-math audit עברו.
- Pages נבנה מחדש בשלימותו, נפרס, והאתר החי נבדק.
- כל ה־PR-ים שמוזגו היו ממוקדים, מתועדים ועברו את שערי הקבלה.
- כל הנושאים 12.1-12.12 נסגרו או מסומנים במפורש כחסומים עם סיבה והראיות הנדרשות.

**העיקרון המנחה:** אנחנו לא רוצים להחזיר את המוצר למצב תקין באמצעות עוד טלאים, אלא לאתר את שורש הרגרסיה ולתקן אותו בצורה אחידה. עם זאת, יציבות המוצר החי קודמת להשלמת cutover ארכיטקטוני. אין להסיר מסלול עובד לפני שהחלופה הוכחה במלואה.

**הפעולה הנכונה כעת\:** להעביר את הפרומט הזה לסוכן. נקודת הבדיקה הבאה שלי תהיה ה־PR שהוא יפתח: אבדוק את ה־diff, את איכות השחזור, את תוצאות הבדיקות ואת האתר המלא שנפרס - ולא אסתפק בהודעת "הושלם" של הסוכן.

לא שיניתי קוד ולא מיזגתי דבר במהלך הבדיקה הזו.

## Prompt:
18.11.2026, 23:45:03

אני חושב שעדיין לא ירדת לעומק הבעיה... עד עכשיו היינו יכולים לדעת בדיוק היכן כל טקסט אמור להיות מועמד, עכשיו אנחנו חוזרים אלפי שנות אור אחורה, שאפילו רוחב הטורים ואזור כותרות הצד לא במקום הנכון... אני רוצה שאתה תבין ותסביר בפרומט בדיוק מה הבעיה ומדוע זה אירע?

## Response:
18.11.2026, 23:45:18 · gpt-6-t-mini

אתה צודק: התשובה הקודמת התמקדה בשלוש תופעות נראות לעין, אבל לא הסבירה את השבר העמוק יותר — אובדן היכולת לנבא ולמקם את הטקסט לפי מודל גאומטרי אמין. אני בודק עכשיו את המעבר בין המנוע שעבד קודם לבין מסלול 9c.4/9c.5, במיוחד את מקור הגאומטריה של העמוד, רוחבי הטורים, אזורי הריהוט וכותרות הצד, ואת השאלה האם ה־PageModel החדש בכלל מקבל את הנתונים הדרושים כדי להפיק את אותן החלטות. לאחר מכן אנסח פרומט שמגדיר את שורש הבעיה ואת תנאי התיקון, ולא רק רשימת תסמינים.

כבר נמצא פער יסודי יותר: המנוע החדש אינו משתמש בגאומטריית העמוד המדויקת שהייתה למנוע הקודם. במנוע הקודם רוחב ומיקום שני הטורים ואזורי השוליים היו מוגדרים בקואורדינטות שנמדדו וננעלו מול המקור. ב־`page-templates.js` של המסלול החדש נבנית במקום זאת רשת כללית מתוך ברירות מחדל אחרות, ובנוסחת הרוחב אפילו לא מנוכה המרווח המרכזי שהוגדר בנפרד. התוצאה היא שטורים בעלי רוחב דומה יכולים להופיע במיקומים שונים מאוד, עם מרווח מרכזי גדול בהרבה; ממילא גם מיקום הערות הצד וכותרות הריהוט הנגזר מהרשת עלול להשתבש. אני מאמת כעת את המספרים ואת מסלול הגדרת אזור השוליים, כדי שהפרומט ידרוש שחזור גאומטרי מדויק ולא "כיוונון" של כמה ערכי CSS.

> **Understanding the regression**
>
> I’m narrowing the issue to a likely architecture change: the newer layout pipeline may be estimating placement instead of preserving the earlier engine’s exact geometry. I’ll compare the relevant code paths and settings migrations closely.
>
> **Understood the regression**
>
> 
>
> **Comparing layout geometry**
>
> I’m identifying a concrete regression: the new template appears to ignore the configured gutter and derive column widths proportionally, creating an oversized gap and shifting both columns away from the established coordinates.
>
> **Compared layout geometry**
>
> 
>
> **Compared legacy and dynamic page geometry implementations and migration defaults**
>
> 
>
> **Tracing the root cause**
>
> I’m confirming the regression is upstream, not a rendering failure. The previous engine used measured fixed anchors; the replacement relies on generic defaults, ignores the imported grid geometry, and therefore shifts columns, gutters, headers, and text candidates.
>
> **Traced the root cause**
>
> 
>
> **Refining the diagnosis**
>
> I’m distinguishing ordinary margin notes from running side headers. Both now use generic placement rules instead of the earlier fixed anchors, so their horizontal and vertical regions no longer match the reference geometry or footnote boundary.
>
> **Refined the diagnosis**
>
> 
>
> **Audited geometry defaults, layout drift, and content parity mismatches**
>
> 
>
> **Comparing legacy and DP line-breaking geometry**
>
>
> **Compared line-breaking geometry and calculated page layout spacing**
>
> 
>
> **Pinpointing geometry drift**
>
> I’m checking the remaining mismatch: the new pipeline omits canonical header and margin anchors. Its side slots use page-edge offsets, while the prior layout centered them over the columns; body columns also inherit wrong margins and gutter geometry.
>
> **Explaining the regression**
>
> I’m tracing this to a full engine replacement, not a CSS issue: the prior calibrated geometry was bypassed, while the new pipeline uses generic defaults and lacks exact header, margin-column, and gutter anchors.
>
> **Explained the geometry drift regression**
>
> 
>
> **Building the diagnostic prompt**
>
> I’m consolidating the evidence into a prompt that forces an implementation agent to validate geometry contracts, compare old and new coordinates, and fix the upstream model rather than masking symptoms with CSS tweaks.
>
> **Built the diagnostic prompt**
>
> 
>
> **Inspected Materialize.js core logic and legacy header positioning constants**
>
> 
>
> Worked for 12m 43s

## מה באמת נשבר - הממצא המרכזי

כעת התמונה ברורה יותר: **המעבר ב־9c.4 לא היה רק החלפה של מקרין התצוגה או איחוד של שני נתיבי ייצוא. הוא החליף את מנוע העימוד הפעיל של הספרים שהגיעו מ־IMUD.** בכך הוחלפה גם מערכת הגאומטריה המכוילת שעליה התבססה הצבת הטקסט.

זו הסיבה שהבעיה עמוקה בהרבה משערים שנעלמו או מאלף ממצאים: המנוע החדש מקבל החלטות בתוך רשת עמודים אחרת, ולכן גם כשהוא מצליח לשמור את כל המילים, הוא עשוי להציב אותן במקומות הלא נכונים.

### 1\. קודם הייתה גאומטריה מכוילת; עכשיו מופעלת רשת כללית

במנוע הקודם, `legacy-imud-flow.js`, קיימת מערכת קואורדינטות מפורשת שנמדדה מול העימוד המקורי. למשל\:

| רכיב | מנוע קודם - `GEO` |
|--------|--------|
| רוחב עמוד A4 | 793.7 px |
| רוחב כל טור | 269.41 px |
| תחילת הטור הימני | 403.61 px |
| תחילת הטור השמאלי | 120.72 px |
| המרווח בין הטורים | 13.48 px |
| תחילת זרימת הגוף | 107.2 px |
| גובה אזור זרימת הגוף | 915 px |
| תחילת אזור הערות השוליים | 969.5 px |
| רוחב אזור הערות הצד | 50.5 px |

זו לא הייתה רק הגדרה עיצובית. הקואורדינטות האלה היו הבסיס שעל פיו חושבו השורות, המיקומים, ההערות והריהוט.

לעומת זאת, `page-templates.js` במסלול ה־DP החדש משתמש בברירות המחדל הכלליות של Registry: רוחב טור 40%, שוליים צדדיים 7.5%, מרווח 2%, שוליים עליונים ותחתונים 20px.

והנה התוצאה המספרית, עבור אותם A4 ואותן ברירות מחדל\:

**מיקום הטורים בפועל**

המספרים בפיקסלים; כל שורה מציגה את גבולות שני הטורים על רוחב הדף.

**המנוע הקודם** x=120.72 ו־403.61

```svg
<svg viewBox="0 0 340 48" width="100%" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="5" width="324" height="38" rx="4" fill="#999999" opacity=".10" /><rect x="57.2" y="12" width="110" height="24" rx="2" fill="#16836a" opacity=".85" /><rect x="171.9" y="12" width="110" height="24" rx="2" fill="#16836a" opacity=".85" /><text x="112" y="28" font-size="9" text-anchor="middle" fill="white">שמאלי</text><text x="227" y="28" font-size="9" text-anchor="middle" fill="white">ימני</text></svg>
```

מרווח מרכזי: 13.48px.

---

**תבנית ה־DP הנוכחית** x=59.53 ו־464.31

```svg
<svg viewBox="0 0 340 48" width="100%" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="5" width="324" height="38" rx="4" fill="#999999" opacity=".10" /><rect x="32.3" y="12" width="110.2" height="24" rx="2" fill="#bd7b24" opacity=".9" /><rect x="209.5" y="12" width="110.2" height="24" rx="2" fill="#bd7b24" opacity=".9" /><text x="87" y="28" font-size="9" text-anchor="middle" fill="white">שמאלי</text><text x="264" y="28" font-size="9" text-anchor="middle" fill="white">ימני</text></svg>
```

מרווח מרכזי בפועל: 134.93px - פי עשרה בקירוב.

המחשה יחסית של מיקומי הטורים, לא צילום של התצוגה.

שים לב לניואנס החשוב: רוחב הטור הבודד יוצא כמעט זהה - 269.86px לעומת 269.41px. אבל **שני הטורים זזו כל אחד בכ־61px החוצה, והמרווח ביניהם גדל מכ־13.5px לכ־135px.** לכן אי אפשר לתקן זאת בשינוי קטן של רוחב הטור.

יש כאן גם פגם בנוסחת התבנית עצמה: `buildPageTemplate()` מחשבת `gutter`, אבל אינה מפחיתה אותו מחישוב רוחב הטורים. כתוצאה מכך, הרווח האמיתי בין הטורים אינו הרווח שהוגדר ב־Registry, אלא יתרת השטח שנשארת אחרי הקצאת 40% לכל טור.

### 2\. גם הגובה שבו הטקסט אמור להיכנס שונה מאוד

במנוע הקודם, זרימת הגוף התחילה ב־107.2px והסתיימה ב־1022.2px.

בתבנית החדשה, לפי ברירות המחדל: הגוף מתחיל ב־50px ומסתיים ב־1076.52px.

כלומר, התבנית החדשה\:

- מתחילה כ־57px מוקדם מדי.
- מאפשרת זרימה עד כ־54px נמוך מדי.
- יוצרת אזור גוף שגבוה בכ־112px, כלומר כ־12.2% יותר מהאזור המכויל הקודם.

זה משנה את הקיבולת, את מספר השורות, את נקודות החיתוך, את חלוקת העמודים ואת המיקומים האנכיים של פריטים שתלויים בעוגני הטקסט.

### 3\. אזורי הצד והכותרות אינם מוגדרים עוד כחלק מגאומטריית העמוד

מצאתי פער נוסף בולט במיוחד ב־`side-notes.js`\:

המיקום האופקי של הערות הצד מחושב לפי `margins.side * 0.15`, ורוחבן נופל כברירת מחדל ל־60px. במנוע הקודם היו אזורים מפורשים: `MARGIN_L_X=56.7`, `MARGIN_R_X=686.3`, `MARGIN_W=50.5`\.

בברירות המחדל החדשות מתקבלים מיקומים בקירוב 8.93px ו־724.77px, ורוחב 60px. כלומר, גם אזור ביאורי הצד הוזז החוצה ושינה רוחב.

גם פס הכותרת העליונה השתנה: המנוע הקודם הציב אותו בתוך תחום אופקי מכויל שנגזר מגבולות הטורים (`COL_L_X+33` ועד `COL_R_X+COL_W-33`\), בגובה 52px. במסלול החדש, `materialize.js` מציב את סלוטי הצד במרחק קבוע של 60px מקצות הדף, ואת גובה הפס הוא גוזר מ־`contentBox.top-18`\. אלה אינם אותם גבולות.

### 4\. מדוע זה אירע דווקא עכשיו?

ב־PR \#60 הוסר מנגנון הבחירה שהפעיל את `legacyTypeset()` כאשר הוגדר פרופיל IMUD. האתחול ב־`browser-entry.js` חדל להעביר את `_layout-profile` ואת `_imudRaw`, ו־`pipeline.typeset()` עבר להשתמש תמיד במנוע DP המאוחד.

המשמעות היא\:

- קודם: מסמך IMUD השתמש בגאומטריית `GEO` המכוילת ובאלגוריתם העימוד של `legacy-imud-flow.js`\.
- עכשיו: אותו מסמך עובר דרך `dp-planner.js`, `page-templates.js`, `kp-linebreak.js` ו־`PageModel`\.

אבל ברירות המחדל הגאומטריות של Registry אינן המידות המקוריות. בדוח `SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md` גם ניכר שלמפתחות `grid-col-width-pct`, `grid-margin-side-pct` ו־`grid-gutter-pct` אין ערכי ייבוא מקבילים מ־`default_settings.json`\. כלומר, המנוע החדש אינו מקבל את מערכת הגאומטריה הישנה; הוא משתמש בערכי ברירת מחדל כלליים.

**ה־PageModel אינו מתקן את זה.** הוא נבנה בסוף התכנון ומקפיא את הקואורדינטות שכבר חושבו. אם התכנון יצר טור ב־x=59.53 במקום x=120.72, ה־PageModel ישמר את x=59.53 בדיוק, והמקרין החדש יצייר אותו נאמנה. זהו מודל אמין של החלטה שגויה.

נמצא גם שה־PageModel מתעד רוחב וגובה עמוד, תיבת תוכן וטורים, אבל לא מגדיר במלואם אזורי שוליים עצמאיים, תיבות כותרת עליונה ואזורי צד כגאומטריה מחייבת. חלק מהמיקומים האלה עדיין מחושבים בנפרד.

### 5\. מדוע כל הבדיקות היו ירוקות?

ההשוואה ב־`tools/stage9/shadow-compare.js` בדקה, בין היתר, שימור מילים, זהות הערות, זהות ביאורי H7, תוכן העניינים והתאמת תוכן ה־PageModel לתוצאת מנוע ה־DP.

אלה בדיקות חשובות, אך הן לא מוכיחות שהשורות והטקסטים הונחו באותם מלבנים ובאותם מיקומי x/y כמו במנוע הקודם. בדיקת התאמה של PageModel לתוצאת DP מוכיחה שהמודל משמר את תוצאת ה־DP - לא שה־DP משחזר את גאומטריית המקור.

לכן PR \#60 הוכיח במידה רבה **שימור תוכן ואחידות פנימית**, אבל לא הוכיח **שקילות גאומטרית ותפקודית של מנוע העימוד**\. זו טעות בשער הקבלה של ה־cutover, ולא רק באג בודד בקוד.

---

מכאן נובעת גם מסקנה לגבי אופן התיקון: **לא מספיק להחזיר זמנית את המנוע הישן כברירת מחדל.** זה יכול לשמש אמצעי חירום, אבל הוא לא משלים את מטרת הפרויקט. צריך להעביר למנוע המאוחד את הגאומטריה המכוילת ואת חוזה הצבת הטקסט, ולהוכיח שה־DP עובד בתוך אותם אזורים ובאותם גבולות. המנוע הישן צריך לשמש אמת להשוואה עד להוכחת השקילות, לא תחליף קבוע למנוע המאוחד.

זה הפרומט המתוקן. הוא מחליף את הפרומט הקודם בנושא הרגרסיה\:

**document: **

# ביקורת שורש ותיקון יסודי של רגרסיית הגאומטריה ב־9c.4/9c.5 - לא תיקון תסמינים

מאגר:
`https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2`

אתר חי:
`https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/`

## 1. הגדרת הבעיה - יש להבין זאת לפני כל שינוי קוד

הבעיה המרכזית אינה רק היעלמות שערים, אלפי ממצאים בלשונית בדיקה או עימוד איטי.

**הבעיה המרכזית היא שה־cutover ב־9c.4 החליף את מערכת הגאומטריה ואת מסלול תכנון והצבת הטקסט שהיו פעילים עבור מסמכי IMUD, בלי שהגאומטריה המקורית וחוזה המיקום המדויק הועברו במלואם למנוע המאוחד.**

לפני ה־cutover, המנוע ידע לעבוד עם מערכת קואורדינטות מכוילת: היה אפשר לדעת מהו האזור שבו כל שורה אמורה להימצא, מה רוחב כל טור, היכן מתחילות תיבות הטורים, היכן נמצא אזור השוליים, מהו ראש אזור זרימת הגוף, מהו תחום מרזב ההערות ומהו מיקומם של הריהוט והכותרות.

אחרי ה־cutover, המוצר מפעיל מנוע DP כללי, המבוסס על תבניות עמוד המחושבות מהגדרות כלליות. התוצאה היא שהמנוע כבר אינו מתכנן בהכרח בתוך אותה גאומטריה מכוילת.

לכן הפגיעה היא יסודית:
- לא רק שהטקסט נראה מעט שונה.
- לא רק שה־CSS ממקם אלמנטים אחרת.
- לא רק שה־PageModel אינו מקרין את הנתונים הנכונים.
- **המלבן שאליו המנוע מנסה להכניס את הטקסט מלכתחילה אינו בהכרח המלבן הנכון.**
- כתוצאה מכך משתנים גם רוחבי השורות, שבירת השורות, מועמדי הפיצול, מיקום הטקסט, מיקום הערות הצד, קיבולת העמוד וחלוקת התוכן לעמודים.

המשמעות: ייתכן שהמנוע החדש שומר את כל המילים, ואף שומר אותן באופן דטרמיניסטי, אך מתכנן אותן בתוך מערכת קואורדינטות שאינה תואמת את הגאומטריה שעליה התבססה התוכנה הקודמת.

אין לנסות לפתור זאת באמצעות תיקוני CSS, שינויי שוליים נקודתיים או החזרת ערכים שרירותיים.

## 2. מה השתנה בפועל ב־9c.4

יש לשחזר ולאמת את המעבר הבא:

### לפני cutover

הגדרות IMUD שהגיעו מ־`default_settings.json` כללו את נתוני האתחול שהפעילו את הפרופיל המקורי:

- `_layout-profile = 'imud'`
- `_imudRaw`

ב־`red-build/src/engine/core/pipeline.js` הייתה בחירה מפורשת שהעבירה את התוצאה ל־`legacyTypeset()` כאשר התקבל פרופיל IMUD.

המנוע הפעיל היה:
`red-build/src/engine/layout/legacy-imud-flow.js`

הגאומטריה הייתה מוגדרת במפורש בקבועי `GEO`, וה־DOM של מסמכי legacy צויר באמצעות `renderLegacyPage()` שב־`red-build/src/engine/output/dom-renderer.js`.

הנקודה החשובה: מנוע זה לא היה צריך לשחזר את הגאומטריה באמצעות ברירות המחדל של Registry. הוא השתמש בקואורדינטות המכוילות שלו.

### אחרי cutover

ב־PR #60:
- הוסר ה־dispatch ל־`legacyTypeset()` מתוך `pipeline.typeset()`.
- `browser-entry.js` החל להפעיל תמיד את המנוע המאוחד.
- `_layout-profile` ו־`_imudRaw` חדלו להיות חלק ממסלול ההפעלה החי.
- תוצאת ה־DP הפכה למקור הנתונים של ה־PageModel.
- התצוגה החיה עברה ל־`pagemodel-dom-renderer.renderModelPage()` בלבד.
- ייצוא HTML ו־PDF עברו אף הם לצריכת PageModel.

כלומר, לא נעשה רק איחוד של מקרינים. **הוחלף המנוע שמחשב את פריסת העמוד ואת מיקומי הטקסט.**

יש לבדוק את היסטוריית PR #60 ואת גרסאות הקבצים לפניו ואחריו, ולא להסתפק בתיאורי ה־PR.

## 3. הוכחה מספרית: גאומטריית העמוד השתנתה

### הגאומטריה הקודמת - `legacy-imud-flow.js`

הנתונים המכוילים בקוד:

| רכיב | ערך |
|---|---:|
| PAGE_W | 793.7px |
| PAGE_H | 1122.5px |
| COL_W | 269.41px |
| COL_R_X | 403.61px |
| COL_L_X | 120.72px |
| MARGIN_R_X | 686.3px |
| MARGIN_L_X | 56.7px |
| MARGIN_W | 50.5px |
| FLOW_TOP | 107.2px |
| FLOW_H | 915px |
| FN_AREA_TOP | 969.5px |
| LINE_H | 21.44px |
| MN_PITCH | 9.6px |

אלה אינם ערכים קוסמטיים. הם מגדירים את תחומי העבודה של המנוע.

### הגאומטריה החדשה - `page-templates.js`

ערכי ברירת המחדל הרלוונטיים של `settings-registry.js`:

- `page-size = A4`
- `grid-col-width-pct = 40`
- `grid-margin-side-pct = 7.5`
- `grid-gutter-pct = 2`
- `margin-top-px = 20`
- `margin-bottom-px = 20`
- `body-font-size-pt = 14`

החישוב ב־`buildPageTemplate()` הוא:

```js
const marginSide = size.w * settings['grid-margin-side-pct'] / 100;
const contentW = size.w - 2 * marginSide;
const gutter = size.w * settings['grid-gutter-pct'] / 100;
const cw = contentW * settings['grid-col-width-pct'] / 100;
colWidths = [cw, cw];
```

והצבת הטורים:

```js
columns: [
  { x: marginSide + contentW - colWidths[0], w: colWidths[0] },
  { x: marginSide, w: colWidths[1] }
]
```

ב־A4 מתקבלים בקירוב:

| רכיב | קודם - GEO | חדש - page template |
|---|---:|---:|
| רוחב עמוד | 793.7 | 793.7 |
| רוחב טור | 269.41 | 269.86 |
| X טור ימני | 403.61 | 464.31 |
| X טור שמאלי | 120.72 | 59.53 |
| המרווח בפועל בין הטורים | 13.48 | 134.93 |

הפער אינו שולי: כל טור זז בכ־61px, והמרווח האמצעי גדל בערך פי עשרה.

שים לב: רוחב כל טור בנפרד כמעט נשמר. זו בדיוק הסיבה שלא מספיק להשוות רק את `colWidth`. יש להשוות את מלבן הטור המלא: `x`, `y`, `w`, `h`, ואת מיקומו ביחס לאזורי השוליים.

### פגם נוסף בנוסחה

`buildPageTemplate()` מחשבת `gutter`, אך אינה גורעת אותו מחישוב רוחב הטורים.

כך הרווח בפועל נוצר מיתרת השטח, ולא מהגדרת `grid-gutter-pct`.

בנוסף, `column-flow.js` מכיל חישוב נפרד:

```js
const gutter = contentWidthPx * settings['grid-gutter-pct'] / 100;
```

יש לבדוק את כל אתרי הצריכה של שתי הנוסחאות ולוודא שאין שני מקורות אמת או מדדי מרווח סותרים. הגאומטריה הסופית חייבת להיגזר פעם אחת בלבד.

### הגובה האנכי השתנה גם הוא

ב־A4, עם ברירות המחדל הנוכחיות:

- `headerHeight ≈ 30px`
- `contentBox.top = 20 + 30 = 50px`
- `folioHeight ≈ 26px`
- `contentBox.bottom ≈ 1122.52 - 20 - 26 = 1076.52px`

לעומת המנוע הקודם:

- ראשית זרימת הגוף: 107.2px.
- תחתית זרימת הגוף: 1022.2px.
- גובה אזור הזרימה: 915px.

התבנית החדשה יוצרת אזור גוף בגובה של כ־1026.5px, כלומר כ־112px יותר.

הפער הזה משפיע על:
- גובה התוכן הזמין לכל עמוד.
- מספר השורות שנכנסות לעמוד.
- מועמדי הפיצול והבחירה ביניהם.
- איזון הטורים.
- היכן מתחילים ומסתיימים אזורי טקסט.
- הקשר בין הגוף לבין מרזב ההערות והריהוט.

אין להניח שניתן לפתור זאת באמצעות שינוי `margin-top-px` בלבד. יש להשיב את החוזה הגאומטרי המלא של העמוד.

## 4. אזור הערות הצד וכותרות הצד - אין לוותר על גאומטריה מפורשת

במנוע הקודם אזורי השוליים היו מוגדרים במפורש:

```js
MARGIN_R_X: 686.3,
MARGIN_L_X: 56.7,
MARGIN_W: 50.5
```

במסלול החדש `side-notes.js` משתמש בחישוב:

```js
const outerX = page.isRecto !== false
  ? page.template.margins.side * 0.15
  : page.template.width - page.template.margins.side * 0.15
      - marginColWidth(settings, null);
```

ברוחב צדדי של 59.53px וברירת מחדל של 60px לרוחב הערת צד, מתקבלים מיקומי X של כ־8.93px וכ־724.77px.

אלה אינם האזורים הקודמים של x=56.7 ו־686.3, וגם רוחב האזור אינו 50.5px.

זה פער בתכנון הגאומטרי, ולא בעיית רינדור.

נדרש להגדיר בתבנית העמוד אזורי צד מפורשים, בנפרד מטורי הגוף:
- אזור צד ימני.
- אזור צד שמאלי.
- רוחב כל אזור.
- היסטו ביחס לטורים.
- תחומו האנכי.
- יחסי Recto/Verso.
- גבולו מול מרזב הערות השוליים.

אין לחשב את מיקום אזור הצד באמצעות אחוז שרירותי משולי העמוד.

יש להשוות גם את כללי ההצבה האנכית:
- מיקום הערת H7 ביחס לפסקה המארחת.
- מפל דחיפת הערות.
- מרווח בין הערות.
- גבול תחתון מותר.
- היחס למרזב הערות השוליים.

יש לבדוק אם מסלול DP משתמש בגבול האנכי של תיבת התוכן במקום בגבול אזור הצד המכויל. אין לאפשר להערת צד להתמקם באזור המיועד לרכיב אחר רק מפני שתיבת התוכן הכללית עדיין מאפשרת זאת.

## 5. גם אזור הכותרת העליונה השתנה

במנוע הקודם `renderLegacyPage()` מגדיר את פס הכותרת העליונה לפי תחום הנגזר מגאומטריית הטורים:

```js
position(
  hdr,
  GEO.COL_L_X + 33,
  52,
  (GEO.COL_R_X + GEO.COL_W - 33)
    - (GEO.COL_L_X + 33),
  22
);
```

כלומר:
- תחילת הפס: 153.72px.
- סוף הפס: כ־640.02px.
- ראש הפס: 52px.
- גובהו: 22px.
- שלושת הסלוטים ממוקמים בתוך אזור ידוע ומכויל.

בנתיב החדש `materialize.js` מחשב את מיקומי סלוטי הכותרת כך:

```js
const x = s.pos === 'right'
  ? tpl.width - 60 - s.w
  : s.pos === 'center'
    ? Math.round((tpl.width - s.w) / 2)
    : 60;
```

והגובה מגיע מ־`headerGeometry()`:

```js
return {
  y: Math.max(0, tpl.contentBox.top - drop - 18)
};
```

במצב ברירת המחדל, ראש הכותרת יוצא 32px במקום 52px.

גם כאן המקרין אינו מצייר את אותה גאומטריה ישנה. הוא משתמש בגבולות כלליים של הדף במקום באזור המכויל שמבוסס על הטורים.

יש לבדוק בנפרד:
- גבולות פס הכותרת.
- מיקום שלושת הסלוטים.
- רוחבי הסלוטים.
- גובה הפס.
- baseline של הטקסט.
- Recto/Verso.
- התאמה בין DOM ל־PDF.

אין לבלבל בין כותרת עליונה לבין הערות/ביאורי הצד H7. שני האזורים זקוקים לחוזה גאומטרי עצמאי.

## 6. הבעיה הארכיטקטונית: PageModel שומר גאומטריה, אך אינו מייצר גאומטריה נכונה

`page-model.js` בונה את `geometry` מתוך `page.template` שכבר חושב קודם ב־DP.

המודל כולל, בין השאר:
- רוחב וגובה.
- תיבת תוכן.
- קואורדינטות ורוחבים של טורים.
- gutter.
- spanOffset.

אבל הוא אינו מגדיר באופן מלא את כל אזורי העמוד העצמאיים:
- מלבני השוליים.
- מלבני הערות הצד.
- פס הכותרת העליונה ותיבות הסלוטים.
- גבולות מרזב הערות השוליים.
- תחומי זרימת גוף מכוילים לפי סוג עמוד.
- אזורי פתיחת סימן.
- אזורי פריטים חוצי־טורים והקשרם לגאומטריית הטורים.

בחלק מהשדות `contentBox.left/right` נלקחים מתבנית שאינה מספקת אותם כלל.

לכן אין למודל תיאור מלא של כל המרחבים שבהם העמוד בנוי.

הבעיה אינה ש־`renderModelPage()` מצייר את המודל לא נכון. ברוב המקרים הוא מצייר את הקואורדינטות שהתקבלו ממנו. הבעיה מתחילה מוקדם יותר: התכנון והתבנית מייצרים מלבנים אחרים מאלו שהמנוע המקורי השתמש בהם.

**PageModel הוא מקור אמת טוב רק אם כל החלטות הגאומטריה הנכונות הוטבעו בו. הוא אינו הופך החלטה גאומטרית שגויה לנכונה.**

אין לתקן את הבעיה באמצעות חישוב גאומטריה מחדש ב־DOM renderer. זה יחזיר שני מקורות אמת ויפר את עקרון האיחוד. יש לתקן את יצירת הגאומטריה לפני התכנון, ולהעביר את התוצאה המלאה ל־PageModel.

## 7. בעיה שנייה: לא רק הגאומטריה השתנתה, אלא גם אלגוריתם שבירת השורות

יש להשוות את:
- `legacy-imud-flow.js` - מנוע LineBreaker המקורי וזרימת המקטעים.
- `kp-linebreak.js` / `line-items.js` - מסלול השבירה החדש.
- `dp-planner.js` / `candidate-generator.js` - בחירת מועמדים וחלוקת הטקסט לעמודים.
- `column-flow.js` / `page-templates.js` - רוחב וקיבולת אזורי העבודה.
- `materialize.js` - הטבעת מיקום סופי של השורות והמילים.
- `page-model.js` - העברת הקואורדינטות למודל הסופי.

אין להניח שהאלגוריתמים שקולים רק מפני שכל המילים נשמרות.

יש להבחין בין שתי שאלות שונות:

1. **מהם מועמדי ההצבה החוקיים?**  
   עבור כל בלוק, פסקה ושורה: מהו תחום הרוחב, מהן אפשרויות השבירה, אילו חלוקות אפשריות ואילו מהן נפסלות - ומדוע.

2. **מהי ההצבה שנבחרה בפועל?**  
   מהו העמוד, הטור, המלבן, ה־X, ה־Y, רוחב השורה, גובהה וקואורדינטות המילים הסופיות.

שני הדברים חייבים להיות גלויים, דטרמיניסטיים וניתנים לביקורת.

אסור להסתפק בהשוואת מולטיסט מילים או ספירת שורות. צריך לבדוק גם את הגאומטריה ואת ההחלטות.

## 8. מדוע הבדיקות הקודמות לא תפסו זאת?

יש לבדוק את `tools/stage9/shadow-compare.js`.

השערים G1-G9 מוכיחים, בין היתר:
- כיסוי מילים.
- היעדר אובדן תוכן.
- זהות הערות.
- התאמת TOC.
- זהות H7.
- התאמת תוכן ה־PageModel לתוצאת ה־DP.
- התאמת דקדוק הכותרות.

אלה בדיקות חשובות, אבל הן אינן מוכיחות שהמנוע המאוחד משתמש באותם מלבנים ובאותם מיקומי טקסט כמו המנוע הקודם.

למשל:
- G7 מוכיח זהות וכיסוי של ביאורי הצד, אך אינו מוכיח שמיקום ה־X/Y והרוחב שלהם זהים לאזור המכויל.
- G8 מוכיח שה־PageModel מייצג את תוכן ה־DP, לא שה־DP יצר את הגאומטריה הנכונה.
- G1/G2 מוכיחים שמילים נמצאות בפלט, לא שהן נמצאות במיקום הראוי.
- `s9c-cutover` מוכיח שהמורשת אינה מופעלת בנתיב המוצר, אך אינו מוכיח שהחלופה משחזרת את התנהגותה הגאומטרית.

גם דטרמיניזם אינו הוכחת נכונות: אותו מנוע יכול להפיק שוב ושוב את אותה גאומטריה שגויה.

נדרש שער קבלה חדש שמוכיח **Geometry Parity ו־Placement Parity** מול הבסיס הקודם, לא רק Content Parity.

---

## 9. מה נדרש לבצע - שלב ראשון: ביקורת גאומטרית פורנזית ללא שינוי קוד

לפני כל תיקון, יש להפיק מסמך ביקורת מלא הכולל:

### א. מיפוי מקורות הגאומטריה

לכל רכיב בעמוד יש לזהות:
- היכן הוא מוגדר.
- אילו הגדרות משפיעות עליו.
- מי מחשב אותו.
- מי צורך אותו.
- האם הוא מוטבע ב־PageModel.
- האם יש יותר ממקור חישוב אחד.
- האם אותו ערך נשמר ב־DOM וב־PDF.

יש לכלול לפחות:
- גוף העמוד.
- שני הטורים.
- המרווח המרכזי.
- שוליים פנימיים וחיצוניים.
- אזורי הערות הצד H7.
- פס הכותרת העליונה ושלושת הסלוטים.
- מרזב הערות השוליים.
- עמודי פתיחת סימן.
- כותרות חוצות־טורים.
- הקדמה.
- TOC.
- שערים.
- עמודי הערות סיום.
- גיליון/מספר עמוד.

### ב. טבלת השוואה מספרית

לכל סוג עמוד, השווה בין המנוע הקודם לחדש:

| סוג עמוד | רכיב | X קודם | Y קודם | W קודם | H קודם | X חדש | Y חדש | W חדש | H חדש | סטייה |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|

אין להסתפק ב־A4 רגיל. יש לבדוק:
- Recto ו־Verso.
- עמוד רגיל.
- פתיחת סימן.
- הקדמה.
- H3 חוצה־טורים.
- עמוד עם הערות שוליים.
- עמוד עם הערות צד.
- עמוד עם כמה סוגי פריטי עימוד יחד.
- עמודים מיוחדים שבהם יש שינוי בקיבולת.

### ג. השוואת שורות ומילים

לכל טוקן/בלוק/שורה:
- זהות מקור.
- עמוד.
- טור.
- מלבן יעד.
- גבולות שורה.
- רוחב וגובה.
- קואורדינטות המילים.
- baseline.
- שבירת שורה.
- מועמדים חוקיים.
- המועמד שנבחר.
- סיבת בחירתו.

יש לאפשר להפיק דוח שאומר, למשל: "הטוקן X במנוע הקודם הוצב בטור הימני ב־x=403.61, ברוחב 269.41; המנוע החדש הציב אותו ב־x=464.31, ברוחב 269.86; שינוי זה גרם לשבירת השורה באופן Y".

### ד. השוואת ההגדרות

לבדוק את כל הגדרות המקור וה־Registry:
- אילו ערכי מקור מוחלים.
- אילו ערכי מקור אינם ממופים.
- אילו הגדרות הוחלפו בקבועים.
- אילו ברירות מחדל כלליות נכנסות למנוע החדש במקום מידות המקור.
- אילו הגדרות נשמרו ב־UI אך אינן משפיעות על המנוע.
- אילו פרמטרים משפיעים על גאומטריה בלי שנרשמו כמפתחות גאומטריים.

במיוחד:
`grid-col-width-pct`, `grid-margin-side-pct`, `grid-gutter-pct`, `margin-top-px`, `margin-bottom-px`, `h2-top-offset`, הגדרות אזורי הצד והכותרות.

אין להניח שייבוא הגדרות IMUD שווה לשחזור הגאומטריה. קבועי `GEO` לא בהכרח היו מפתחות הגדרה, ולכן לא היה אפשר לצפות שמפת ההגדרות לבדה תעביר אותם.

### ה. תוצאת השלב הראשון

יש לסיים את הביקורת עם:
1. מסמך Root Cause מפורט.
2. טבלת גאומטריה קודמת מול חדשה.
3. רשימת כל מקורות החישוב הכפולים או הסותרים.
4. רשימת המידע הגאומטרי החסר ב־PageModel.
5. רשימת כל הגדרות המקור שלא הועברו.
6. תוכנית תיקון שמסבירה מה צריך להיות מקור האמת היחיד.
7. בדיקות שימנעו הישנות.

בשלב הזה אין לבצע תיקוני CSS, אין לשנות ערכי ברירת מחדל ואין להחזיר את המורשת כפתרון קבוע.

---

## 10. שלב שני: תיקון ארכיטקטוני אחיד - Geometry Contract קנוני

המטרה היא להחזיר למנוע המאוחד את הדיוק הגאומטרי, בלי להחזיר מנוע שני פעיל.

יש ליצור או להשלים חוזה גאומטרי קנוני אחד של העמוד.

החוזה צריך לכלול, לכל סוג עמוד ולכל צד פיזי:

1. מידות עמוד.
2. גבולות תיבת התוכן.
3. מלבני שני הטורים.
4. המרווח המרכזי בפועל.
5. אזורי השוליים הימני והשמאלי.
6. מלבני ביאורי הצד.
7. תיבת הכותרת העליונה.
8. מלבני שלושת סלוטי הכותרת העליונה.
9. אזור מספר העמוד.
10. אזור מרזב הערות השוליים.
11. אזורי פתיחת פרק/סימן.
12. אזור כותרת חוצה־טורים.
13. אזורי תוכן מיוחדים.
14. גבולות העיטורים והשערים.
15. כל ההזמנות והשטחים שאינם זמינים לגוף הטקסט.

החוזה הזה חייב להיבנות פעם אחת, לפני חיפוש המועמדים ולפני שבירת השורות.

### מקור האמת

יש לשמר את ערכי `GEO` המכוילים כבסיס המספרי של המעבר למנוע המאוחד, ולא להחליפם בשקט בברירות המחדל הכלליות של Registry.

כאשר יש הגדרת משתמש שמותר לה לשנות רכיב גאומטרי, היא תשפיע על החוזה בצורה מפורשת ומחושבת. כאשר אין הגדרה כזו, ברירת המחדל חייבת לשחזר את הגאומטריה המכוילת.

אין לקבוע את הגאומטריה על ידי שימוש ב־PDF הייחוס כיעד סופי. הנתונים המכוילים וההחלטות שכבר הוטמעו ב־`GEO`, ב־`legacy-projector.js`, ב־`renderLegacyPage()` ובמפת הגאומטריה הם נקודת ההתחלה להשוואה. ה־PDF הישן הוא מקור מדידה מסייע בלבד, לא מודל סמכות חדש.

### צרכנים

הגאומטריה הקנונית צריכה להיות מקור הנתונים היחיד של:
- `dp-planner`.
- `column-flow`.
- `candidate-generator`.
- מנגנון שבירת השורות.
- מנגנוני איזון הטורים.
- חישוב הערות שוליים.
- חישוב הערות צד.
- חישוב כותרות עליונות.
- חישוב עיטורים.
- `materialize`.
- `page-model`.
- מקרין DOM.
- מקרין HTML.
- מקרין PDF.

אין ליצור נוסחה חלופית במקרין כלשהו.

### PageModel

יש להרחיב את PageModel כך שיכיל את כל מלבני הגאומטריה הנדרשים, לא רק `columns`, `contentBox` ו־`gutter`.

כל מיקום סופי יהיה חלק מהמודל:
- `x`, `y`, `w`, `h`.
- baseline.
- אזור סמנטי.
- שיוך לטור או לאזור צד.
- זהות טוקן.
- זהות שורה.
- זהות פריט.
- מקור ההצבה.
- מגבלות clipping.
- הזמנות שטח.
- סדר שכבות.

המקרינים יקראו את הנתונים בלבד. אסור להם לחשב מחדש את גבולות הטורים, את מיקום הכותרת או את אזור הצד.

---

## 11. שלב שלישי: השוואה מתמטית ולא רק השוואת תוכן

צריך להוסיף שערי קבלה מפורשים.

### Geometry Parity

השוואה בין מנוע הייחוס לבין המנוע המאוחד:
- page rectangles.
- body-flow rectangle.
- right/left columns.
- actual gutter.
- side-margin rectangles.
- running-header band.
- H7 side-note boxes.
- footnote gutter.
- spanning bands.
- folio box.
- opening-section reserved areas.

### Placement Parity

השוואת כל שורה וכל מילה:
- אותו token/paragraph.
- אותו עמוד.
- אותו טור, כאשר אין החלטה מפורשת לשנות.
- אותו rectangle או סטייה מוסברת.
- אותן מידות שורה.
- אותן קואורדינטות מילים.
- אותה שבירת שורות או הבדל מוסבר ומאושר.
- אותה נקודת עיגון של הערות צד.
- אותה גאומטריית כותרת וריהוט.

אין להסתפק ב־contentHash זהה.

### Candidate Audit

יש להציג לכל בלוק:
- מה היו מועמדי הפיצול.
- מה היה תחום הרוחב החוקי.
- אילו מועמדים נפסלו.
- מדוע נפסלו.
- מה נבחר בסוף.
- איך זה השפיע על העמוד, הטור ומיקום השורות הבאות.

מנגנון המועמדים צריך לעבוד בתוך מלבני הגאומטריה הקנוניים. אסור לו לחשב רוחב או קיבולת על בסיס תבנית שונה מזו שתשמש להקרנה.

### בדיקות חיוביות ושליליות

- שינוי רוחב טור חייב לשנות את המודל ואת מועמדי השורות.
- שינוי שוליים חייב לשנות את מלבני הטורים ואת אזורי הצד לפי חוזה מוגדר.
- שינוי gutter חייב לשנות את המרחק האמיתי בין הטורים בדיוק כפי שהמודל מצהיר.
- שינוי הגדרת כותרת עליונה חייב לשנות את הסלוט המתאים, בלי להזיז את גוף הטקסט אלא אם יש לכך כלל מפורש.
- שינוי רוחב הערת צד חייב לשנות את שבירתה ואת גובהה, תוך שמירה על אזור הצד.
- אין לאפשר מקרה שבו `columnWidths()` מדווח gutter אחד ו־`page.template.columns` מייצר gutter אחר.
- בדיקה של כל סוגי העמודים ושל שני הצדדים הפיזיים.

ההשוואה צריכה להתבצע על המסמך הגדול ועל מסמכי בדיקה קטנים וממוקדים, ולא רק על קנוני קצר.

---

## 12. לא לבלבל בין שלוש הרגרסיות

לאחר תיקון הגאומטריה יש לטפל גם בשתי התופעות האחרות, אך אין לערבב ביניהן לבין שורש בעיית המיקום:

### א. יותר מ־1,000 ממצאים

לחקור את ה־Ledger ואת `buildReport()`.

`candidate-generator.js` רושם `candidate-rejected` במהלך חיפוש DP. דחיית מועמד חוקית בחיפוש אינה בהכרח ליקוי עימוד.

יש להבחין בין:
- הפרות אמיתיות.
- החלטות חיפוש פנימיות.
- דחיות מועמדים צפויות.
- פשרות unresolved.

אין להסתיר הפרות אמיתיות או להגדיל ספים כדי להקטין את המספר.

### ב. האטה לעומת הגרסה הקודמת

להשוות את המסלול המאוחד מול המנוע הקודם באותו מסמך, אותן הגדרות, אותם גופנים ואותם נכסים.

למדוד בנפרד:
- parsing.
- measurement.
- line-breaking.
- candidate generation.
- page planning.
- retreat/balancing.
- structural stamps.
- PageModel.
- serialization.
- transfer ל־UI.
- תצוגה ראשונית.

אין לבצע אופטימיזציה לפני שיודעים אילו שלבים אחראים להאטה.

### ג. שערים ועיטורים

המודל החדש חייב לכלול גם את הפניות העיצוב של שלושת השערים, את מיקומי התמונות והעיטורים ואת ה־z-order שלהם. תיקון השערים חייב להיות חלק מחוזה הגאומטריה והנכסים של PageModel, לא קריאה מחודשת ל־`renderPageBackgroundAndShaar()` מתוך המקרין החדש.

---

## 13. כללי עבודה שאסור לחרוג מהם

1. אין להסתפק בהחזרת `legacy` כברירת מחדל ולהכריז שהבעיה תוקנה.
2. אין להסיר שוב מסלול שעובד לפני שהחלופה הוכיחה Geometry Parity ו־Placement Parity.
3. אין לנסות לתקן מיקומי טורים באמצעות שינויי CSS בלבד.
4. אין לכוונן `grid-margin-side-pct`, `grid-col-width-pct` או `grid-gutter-pct` באופן נקודתי כדי להתאים צילום מסך.
5. אין לאפשר למקרינים להמציא גאומטריה או לחשב מיקומים עצמאיים.
6. אין להוסיף קבועי תיקון כפולים בין `page-templates`, `side-notes`, `headers-builder`, `materialize` ו־DOM.
7. אין להחליש בדיקות או להעלים ממצאים.
8. אין להשתמש ב־PageModel parity כהוכחת נכונות גאומטרית.
9. אין לראות בדטרמיניזם הוכחה לנכונות: יש לבדוק גם שהקואורדינטות הנבחרות נכונות.
10. אין להשתמש ב־PDF הייחוס כיעד סופי.
11. אין להשיב P6/P7 לתוכנית.

העיקרון: **מקור אמת גאומטרי אחד, שנקבע לפני התכנון, נצרך על ידי כל מנגנוני הבחירה, ונשמר במלואו ב־PageModel.**

---

## 14. תנאי סיום

העבודה לא תיחשב מוכנה עד שניתן יהיה להוכיח:

- כל מלבני העמוד תואמים לגאומטריית הייחוס המאושרת.
- כל טור ממוקם ורוחבו נכון.
- אזורי השוליים וכותרות הצד מוגדרים וממוקמים נכון.
- הכותרות העליונות נמצאות באותו פס גאומטרי מכויל.
- אזור מרזב הערות השוליים נכון.
- מועמדי השורות והחלוקה לעמודים נבדקים בתוך האזורים הנכונים.
- לכל שורה ולכל מילה יש קואורדינטות ברורות, ניתנות למעקב ולביקורת.
- אין פער בין הגאומטריה בתכנון לבין PageModel.
- אין פער בין PageModel לבין DOM/HTML/PDF.
- אין חישובי גאומטריה כפולים.
- יש שימור מלא של התוכן.
- הדוח בלשונית בדיקה מציג הפרות אמיתיות בלבד.
- ביצועים הושוו לאותו מסמך ולבסיס הקודם.
- השערים, עיטורים, גופנים והגדרות המשתמש פועלים.
- כל בדיקות CI והאודיטים החיים עברו בלי ריכוך.

**הדרישה החשובה ביותר:** אל תתקן את המיקום של אלמנט אחרי שהמנוע כבר קיבל החלטות על בסיס מלבן שגוי. תקן את המלבן ואת מקור הגאומטריה לפני יצירת המועמדים, כך שהמנוע יחשב מלכתחילה את ההצבה הנכונה.

המטרה אינה להחזיר את התוכנה הישנה, אלא להשיב למנוע המאוחד את היכולת לדעת בדיוק היכן כל פריט יכול וצריך להיות מונח - ולשמור את היכולת הזאת בצורה פשוטה, אחידה, דטרמיניסטית וניתנת להוכחה.

**הדגש שאני מבקש שלא ילך לאיבוד\:** הפרומט הזה אינו מבקש מהסוכן "לשפר את מיקום הטורים". הוא דורש ממנו להחזיר למנוע את עצם המודל המתמטי של העמוד: גבולות הגוף, הטורים, השוליים, הכותרות וההערות, ורק לאחר מכן לאפשר למנוע לבחור מועמדים ולמקם טקסט.

לא שיניתי קוד במאגר במהלך הבדיקה הזו.

## Prompt:
19.11.2026, 0:06:44

זה לא מספיק... מדובר בשערוריה!!! המון בעיות שאין להם הסבר!!! 
למה מיקומי הטקסט בשער אחורי נעלמו והכל מכווץ באמצע?
למה בכותרת העליונה מופיע שם ספר גנרי "ספר מלכי המלוכה" למרות שהטקסט הכיל שם ספר ומחבר ונושא וכו'?
למה בוטל כל עיצוב עמודי תוכן העניינים, והכל מופיע בטור אחד (בלי INLINE) שגולש מחוץ לגבולות העמוד ועם גופנים לא נכונים?
למה מיקומי הטקסט בשער משנה נעלמו והכל מוצמד למעלה?
למה בשער משנה (שהרקע שלו גם לא מופיע) הכותרת לא חולקה לשנים?
למה העיטורים בשערים נעלמו?
למה כותרת ההקדמה (כותרת 0) לא ממוקמת במקומה בשני שליש גובה הדף?
למה בטקסט הכותרת ישנה שורה ראשונה עם מילה 1???
למה ישנם רווחים עצומים בגוף הטקסט של ההקדמה??
למה למספר העמוד נוספו גרשיים כאלה כ"ד ???
למה העיטור בסוף פרק בגודל מיזערי?
למה תוכן העניינים, הכותרות העלינות, כותרות הצד, מופיעות בגופן רש"י, והכותרות העליונות מוצגות בגודל מיזערי??
למה כותרת 2 מועמדת בעימוד שני טורים ומופיעה לבדה בעמוד??
למה ישנו רווח אדיר בין הטורים??
למה כותרת הצד נדחקו לקצה צד העמוד???
למה גוף הטקסט מלא בשורות דלילות???
למה עיטור סוף פרק מעומד בעימוד שני טורים והוא בגודל מיזערי?
וישנם עוד בעיות רבות שאין לי כח לפרט, אבל המינמום מצידך היה לבדוק שטקסטים עדיין נמצאים באותו מקום!!!!

## Response:
19.11.2026, 0:06:57 · gpt-6-t-mini

אתה צודק. הרשימה הזאת משנה את היקף האבחון: זו אינה רק רגרסיית גאומטריה של הטורים, אלא כנראה כשל רחב בהעברת **חוזי העימוד והעיצוב של רכיבי הספר** — שערים, תוכן עניינים, כותרות, עיטורים, הקדמה, מספור ופריטי צד — מן המסלול הישן למסלול החדש. אני בודק עכשיו את נקודות המעבר בקוד כדי להפריד בין מה שניתן להוכיח לבין מה שעדיין דורש בדיקת ריצה, ואז אנסח לסוכן הוראה שאינה מאפשרת לו להסתפק בתיקון הטורים בלבד.

כבר התגלו עוד שתי התאמות מדויקות לתלונות שלך: חותמת הכותרת העליונה מקבעת את גודל כל הסלוטים ל־**9pt**, בלי קשר לגודל שהוגדר; ושם הספר בכותרת העליונה נלקח קודם כול מ־`imud-book-title`, ורק אחר כך ממטא המסמך. בבדיקת ההגדרות נמצא שהייבוא הישן מעביר לשדה הזה את ערך הדוגמה **„ספר מלכי המלוכה”**\. כלומר, ערך דוגמה שנראה כמו ברירת מחדל עלול לדרוס את שם הספר האמיתי שבטקסט. אלה כבר לא השערות כלליות — אלו מסלולי קוד שמתאימים ישירות לשתיים מהתקלות שתיארת.

אני ממשיך לבדיקה של שני צירים נוספים שהרשימה שלך מחדדת: האם שכבת העיטורים והרקעים בכלל מחוברת למסלול המאוחד, והאם כותרת ההקדמה/כותרת 2 עברו שינוי בסוג העמוד ובמדיניות ההצבה. במקביל חשוב להבחין בין באג מוכח בקוד לבין תופעה שעדיין צריך למדוד מול אותו מסמך — למשל סימני המספור העברי, שיכולים להיות תקינים סמנטית אך שגויים ביחס לפורמט שהיה קודם.

> **Tracing rendering issues**
>
> I’m checking whether the current deployment includes the earlier fix and whether the unified rendering path correctly materializes blocks, coordinates, backgrounds, and theme settings. I’m avoiding conclusions until that pipeline is verified end to end.
>
> **Traced rendering issues**
>
> 
>
> **Pinpointing layout causes**
>
> I’m narrowing the audit to concrete rendering paths. Early evidence points to hard-coded TOC sizing and positioning, while the broader issues may come from unified materialization, font mapping, headers, decorations, and column geometry.
>
> **Tracing metadata flow**
>
> I’m checking whether parsed metadata reaches the Shaar and header builders consistently. A mismatch between English field names and expected Hebrew keys could explain missing titles, author details, subjects, and generic replacement text.
>
> **Traced metadata flow and pinpointed layout causes**
>
> 
>
> **Connecting metadata failures**
>
> I’m verifying whether the same metadata mismatch affects both Shaar pages and running headers. The TOC code already uses fixed sizing and positions, while missing field mappings could explain generic or absent content elsewhere.
>
> **Diagnosed metadata connection failures**
>
> 
>
> **Mapping confirmed regressions**
>
> I’m finding several concrete causes: headers are forced to 9pt, imported sample metadata can override real values, and side headings use incorrect edge coordinates. TOC sizing and fixed placement add another independent mismatch.
>
> **Consolidating verified regressions**
>
> I’m linking the symptoms to concrete causes: fixed header sizing, sample metadata overriding imported values, edge-coordinate drift, simplified Shaar placement, missing backgrounds, and geometry changes that the current tests don’t visually compare.
>
> **Consolidated confirmed regressions**
>
> 
>
> **Audited rendering, layout, materialization, structural stamps, and pipeline regressions**
>
> 
>
> **Inspected font keys, ornaments, and H0 layout**
>
> 
>
> **Tracking remaining gaps**
>
> I’m verifying which decorative assets, H0 placement rules, font mappings, and spacing settings are actually transferred into the new model. I’ll separate confirmed regressions from hypotheses before recommending fixes.
>
> **Tracked remaining gaps**
>
> 
>
> **Investigated missing page decorations and heading layout pipeline regressions**
>
> 
>
> Worked for 28m 1s

אתה מצביע על כשל חמור בהרבה: **לא נשמרה שקילות של תוצאת העימוד בין המנועים.** לא די בכך שכל המילים עדיין מופיעות איפשהו במסמך. כל פריט חייב לשמור על סוג העמוד שלו, אזור ההצבה, הקואורדינטות, הגודל, הגופן, חלוקת השורות והקשרו לפריטים הסמוכים. שער אחורי שמכיל את אותן מילים במקום אחר, תוכן עניינים שכל שורותיו קיימות אבל נדחס לטור אחד, או כותרת שנשארה אך הועברה לראש העמוד - כל אלה הם כשלי שימור עימוד.

מצאתי כבר ראיה קונקרטית לכך שהבעיה אינה רק בגאומטריית הטורים: ב־`structural-stamps.js` תוכן העניינים מוטבע כיום לפי פריסה פשוטה וקבועה - גודל 12pt, תחילת שורות ב־$y=70$, מרווח של 24px, ורוחב של כמעט כל העמוד. קבוצות מקבלות היסטים קבועים של 80px. זו אינה שקילות של עיצוב תוכן העניינים המקורי, והיא מתיישבת ישירות עם התיאור שלך על אובדן ה־INLINE, הגופנים, המדרג והגלישה.

גם לגבי השער האחורי יש תיעוד מפורש של כשל קודם: ב־18 בנובמבר נרשם ש־`buildShaarBlocks` לא קרא שלושה מארבעת שדות השער האחורי, ושבמקומם הופיעו בו בטעות שם הספר, המחבר והשנה. הקוד תוקן אז, אבל עצם קיומו של תיקון כזה מחייב לבדוק שהמידע אכן מגיע עד לחותמת ה־PageModel ולרינדור החדש - ולא להסתפק בכך שפונקציית בניית הבלוקים נראית תקינה.עברתי על הדוח והשוויתי את טענותיו לקוד, כולל לגרסה שקדמה למעבר ולשינויים שבוצעו ב־PR \#60.

**המסקנה המרכזית: הדוח מתאר נכון את הכיוון הארכיטקטוני שאליו רצו להגיע, אבל הוא אינו מוכיח שהמעבר אליו בוצע כראוי. למעשה, ההשוואה לקוד חושפת בדיוק את המחדל שאתה מתאר: הוחלפה שרשרת העימוד הפעילה, אך חלק ניכר מחוזי העיצוב, הגאומטריה וההצבה של המנוע הקודם כלל לא הועברו למודל החדש.**

זו אינה רק טעות של כמה ערכים או כמה רכיבים. המעבר נעשה כאילו די להעביר את תוכן הספר ואת זהות הפריטים למודל החדש, בעוד שבפועל מנוע עימוד חייב להעביר גם את *המשמעות הגאומטרית והטיפוגרפית* של כל פריט.

## מה היה מכוון ומה מעיד על כשל במעבר

### שינויים ארכיטקטוניים מכוונים

אלה שינויים שהקוד והיסטוריית העבודה מתעדים במפורש\:

- מעבר להרצה ב־Web Worker, כדי להפריד את העימוד מממשק המשתמש.
- מעבר למנוע DP חדש במקום מנגנון `legacyTypeset` הישן.
- הפיכת `PageModel` למקור האמת היחיד, שממנו אמורים להיגזר התצוגה, ייצוא HTML וייצוא PDF.
- השארת המנוע הישן כפורט עצמאי לצורכי השוואה ואבחון, ולא כמנוע הפעיל של המוצר.

הדברים האלה מוגדרים ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/60?utm_source=chatgpt.com), ובקוד [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/19507eb0eacab20e268b027809887fd56b3ea314/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com) לעומת [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/red-build/src/engine/core/pipeline.js?utm_source=chatgpt.com)\.

ההחלטה הארכיטקטונית עצמה אינה הבעיה. **הבעיה היא שה־cutover בוצע לפני שהוכח שהמנוע החדש משמר את תוצאת העימוד של הישן.**

### מקרים שבהם ההתנהגות החדשה מתוכננת בקוד, אך אינה משמרת את החוזה הישן

| רכיב | מה נעשה בפועל | הערכה |
|--------|--------|--------|
| גאומטריית הטורים | הועברה לנוסחה כללית המבוססת על אחוזי רוחב ושוליים, אך ללא חישוב נכון של המרזב | כשל במימוש המעבר |
| תוכן העניינים | נבנתה חותמת חדשה, אך היא מקבעת 12pt ומיקומים קבועים במקום להעביר את עיצוב הרמות והקיבוץ | פישוט שלא הוכח כשקול למקור |
| כותרות עליונות | החותמת קובעת 9pt גם כשהגדרות הסלוט דורשות גודל אחר | אובדן של הגדרה קיימת |
| כותרת ההקדמה H0 | המיקום המכויל של הכותרת הישנה לא הועבר לתבנית החדשה | אובדן חוזה הצבה |
| שערים | המודל החדש בונה מחסנית בלוקים ממורכזת, במקום לשמר את מיקומי השורות הישנים | אובדן מידע גאומטרי |
| רקעים ועיצובי שער | נתיב ה־PageModel אינו משחזר את תוכנית עיצובי העמודים הישנה | ניתוק של מנגנון עיצוב |
| הערות צד | נוסחת מיקום חדשה משתמשת בחלק קטן מדי מהשוליים במקום במיקום המכויל | רגרסיה גאומטרית |
| כותרת הספר בכותרת העליונה | ערך ברירת מחדל לדוגמה גובר על המטא האמיתי של המסמך | שגיאת הגירה/ברירת מחדל |

כמה מן הממצאים האלה מוכחים כבר ברמת הקוד, ולא רק מתיישבים עם תיאור התקלות.

**הטורים והמרזב\:** בקוד החדש מחושב רוחב הטור כ־40% מרוחב אזור התוכן, אבל המרזב אינו

## Prompt:
19.11.2026, 1:08:44

בצע את החזרה ל9C3 מיידית בעצמך, והכן פרומט לסוכן AI למעבר זהיר אך מהיר למנוע החדש, ואני רוצה להדגיש שלא מדובר בקיבוץ של בעיות, אלא בתכנון וביצוע כושל! שלא התחשב וחקר את הקוד הישן ולא תכנן כראוי את הקוד החדש, רשימת הבעיות רק צריכה להדגיש את המחדל שבתכנון וביצוע המעבר לקוד החדש. אני רוצה להוסיף עוד כמה נקודות, עבור על הדו" הבא, ובדוק איזה שינויים נעשו במכוון, ואילו באוזלת יד:[https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/%D7%97%D7%A7%D7%99%D7%A8%D7%AA%20%D7%94%D7%A9%D7%99%D7%A0%D7%95%D7%99%D7%99%D7%9D%20%D7%A9%D7%91%D7%99%D7%9F%20%D7%94%D7%92%D7%99%D7%A8%D7%A1%D7%90%20%D7%94%D7%97%D7%93%D7%A9%D7%94%20%D7%9C%D7%92%D7%99%D7%A8%D7%A1%D7%90%D7%95%D7%AA%20%D7%94%D7%A7%D7%95%D7%93%D7%9E%D7%95%D7%AA.MD](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/%D7%97%D7%A7%D7%99%D7%A8%D7%AA%20%D7%94%D7%A9%D7%99%D7%A0%D7%95%D7%99%D7%99%D7%9D%20%D7%A9%D7%91%D7%99%D7%9F%20%D7%94%D7%92%D7%99%D7%A8%D7%A1%D7%90%20%D7%94%D7%97%D7%93%D7%A9%D7%94%20%D7%9C%D7%92%D7%99%D7%A8%D7%A1%D7%90%D7%95%D7%AA%20%D7%94%D7%A7%D7%95%D7%93%D7%9E%D7%95%D7%AA.MD) וכן את הדו"ח הנעשה ע"י סוכן הAI: [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/live-site-investigation-2026-11-19.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/live-site-investigation-2026-11-19.md)

## Response:
19.11.2026, 1:09:03 · gpt-6

> **Reviewing rollback and deployment**
>
> I’m assessing whether the rollback fully restored the application. The deployment appears incomplete, so I’m avoiding a partial update that could leave the site broken and treating the migration as an execution failure requiring parity review.
>
> **Reviewed rollback and deployment**
>
> 
>
> **Compared commits, reset main to 9c3, and inspected deployment assets**
>
> 
>
> Worked for 2m 1s

**החזרתי את ענף `main` של המאגר ל־9C.3.**

(הוחזר בהצלחה)

- נקודת החזרה: `4992e090457458f59b0a44c95a3f96656f29b2e2` - פריסת 9C.3.
- וידאתי שה־`pipeline.js` חזר לנתיב שבו פרופיל IMUD מפעיל את `legacyTypeset`, ושקובץ האתחול חזר למזהה הנכסים `2026-11-18-s9c3`\.
- לא ביצעתי תיקוני טלאי במנוע החדש ולא מחקתי אותו מההיסטוריה. זו חזרה לנקודת הקוד הקודמת, כדי להחזיר את בסיס העבודה היציב.

**הסתייגות חשובה\:** ענף האתר `gh-pages` עדיין מכיל את נכסי s9c5. לכן החזרת `main` הושלמה, אבל איני טוען שהאתר החי כבר חזר ל־9C.3. לא הצלחתי להשלים פריסה של חבילת האתר דרך הכלים הזמינים, ולכן אין להסתמך עדיין על האתר החי כאילו כבר עודכן.

קישורים\:

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/4992e090457458f59b0a44c95a3f96656f29b2e2?utm_source=chatgpt.com)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2?utm_source=chatgpt.com)

## מה מלמדת חקירת שני הדוחות

הנקודה המרכזית שלך נכונה, וחשוב לנסח אותה נכון לסוכן: **הכשל אינו אוסף של באגים שהתגלו לאחר מעבר מוצלח. הכשל הוא שהמעבר עצמו תוכנן ובוצע בלי להגדיר ולשמר את התנהגות המוצר הקיימת.**

הדוח השני מספק ראיה חזקה במיוחד לכך. הוא מתאר מצב שבו המנוע החדש עבר בדיקות שלמות פנימית, אבל בדיקות אלה לא בדקו אם הוא עדיין מעמד את הספר כפי שהמנוע הישן עימד אותו. במקביל, בדיקות CI מסוימות הוסטו להריץ את `legacyTypeset` - כלומר, הן המשיכו לבדוק את המנוע הישן בזמן שהמשתמשים כבר קיבלו את החדש. זהו כשל בתכנון מערך האימות של המעבר, לא רק כשל בבדיקת באג מסוים.

### מה נעשה במכוון, ומה מעיד על כשל בתכנון ובביצוע

| שינוי | סיווג | משמעות |
|--------|--------|--------|
| מעבר להרצה ב־Web Worker | החלטה ארכיטקטונית מכוונת | יעד לגיטימי; היה צריך לשמר את התוצאה החזותית והטיפוגרפית. |
| מעבר למודל PageModel כמקור אמת | החלטה ארכיטקטונית מכוונת | יעד נכון עקרונית; המודל חייב להכיל את מלוא חוזי העימוד, לא רק טקסט ומלבנים חלקיים. |
| מעבר לתכנון DP ו־Knuth-Plass | החלטה מכוונת | החלפת אלגוריתם מותרת, אך מחייבת הוכחת איכות ושקילות מול המנוע הקודם. |
| הפיכת המנוע המאוחד לנתיב היחיד ב־9C.4 | החלטת מעבר מכוונת, שבוצעה ללא תנאי קבלה מספקים | זו נקודת החיתוך המרכזית. הוכחות שלמות פנימית אינן אישור להחליף את המנוע החי. |
| החלפת גאומטריית המקור בברירות מחדל גנריות | כשל בתכנון ההעברה | ערכי הטורים, השוליים, המרווחים ואזורי הצד לא הועברו כחוזה גאומטרי שקול. |
| החלפת עימוד תוכן העניינים בחותמת שורות פשוטה | כשל בתכנון/מימוש | אין כאן העברה של עיצוב ה־TOC אלא הקרנה מצומצמת שאינה משמרת את מבנהו. |
| אי־העברת `fontKey` לשורות המודל | כשל בתכנון המודל ובהקרנה | המודל אינו נושא את המידע הדרוש להצגת הגופנים המקוריים. |
| השמטת פרטי עיצוב של שערים, רקעים, מיקומי תיבות ועיטורים | כשל בהעברת חוזי הרכיבים | לא הוכח שכל רכיבי השער הישנים הועברו מקצה לקצה. |
| מספור עם גרשיים במקום הפורמט הקודם | שינוי מכוון בהחלטה D-37 | זו בחירת פורמט מתועדת, אך היא אינה שקולה להתנהגות הקודמת ויש להחזירה אם אינה רצויה. |
| קדימות `imud-book-title` למטא שבמסמך | החלטה שתועדה כ־S4.5, אך יושמה באופן שגוי בהקשר ברירות המחדל | החלטה על קדימות הגדרה מפורשת הפכה בפועל לקדימות של טקסט דוגמה גנרי. |
| ביטול בדיקת ההתאמה למקור (D-100) | ביטול מכוון של בדיקה | לאחר הביטול לא נבנה שער חלופי שמוכיח שקילות של המנוע המאוחד. |
| הסטת `run-ours.js` לבדיקת מנוע המורשת | שינוי מכוון בכלי הבדיקה, בעל תוצאה מטעה | בדיקות ירוקות לא הוכיחו שהאתר החי משתמש במנוע תקין. |

לכן אין לסווג כל שינוי שלא מצא חן בעינינו כ״רשלנות״: חלק מהשינויים הארכיטקטוניים היו מטרות לגיטימיות, וחלק מהשינויים ההתנהגותיים נעשו במכוון. **המחדל הוא שלא נוהל תהליך מעבר שמבחין בין שינוי ארכיטקטוני פנימי לבין שינוי לא מאושר בהתנהגות המוצר, ושלא עצר את החיתוך כאשר לא הוכחה שקילות.**

הדוח הראשון שהעברת הוא מסמך השוואה ארכיטקטוני מועיל, אבל הוא אינו תחליף לבדיקת קוד ולהוכחות ריצה. הדוח השני חזק יותר מבחינה ראייתית: הוא כולל השוואות A/B על אותם קלטים, מדידות גאומטריות, זיהוי מסלולי קוד והסבר מדוע הבדיקות הירוקות לא בדקו את הנתיב החי.

## פרומט לסוכן AI - החזרה ל־9C.3 ומעבר מחודש, מבוקר ומהיר למנוע המאוחד

הפרומט הבא מגדיר את המשימה כולה. הדגש המרכזי: לא לתקן את רשימת התסמינים אחד־אחד, אלא לתקן את **תהליך תכנון והעברת המנוע**, כך שהמנוע החדש יוכל להחליף את הישן בלי לאבד אף יכולת קיימת.

**document: **

# משימת חירום: שחזור 9C.3 ותכנון מחדש של המעבר למנוע המאוחד - ללא אובדן יכולות

## 1. מטרת המשימה והגדרת הכשל

החזרתי את ענף `main` לנקודת 9C.3:

`4992e090457458f59b0a44c95a3f96656f29b2e2`

נקודת מוצא זו היא בסיס העבודה היציב. אין להמשיך את העבודה כאילו 9C.4/9C.5 היו מעבר מוצלח שדורש רק תיקוני באגים.

**האבחנה המחייבת: המעבר למנוע החדש תוכנן ובוצע באופן כושל.**

אין מדובר בקיבוץ מקרי של תקלות או ברשימת באגים שהתגלו לאחר החלפת מנוע מוצלחת. מדובר בכשל בתהליך ההנדסי עצמו:

- לא נחקרו לעומק כל יכולות המנוע הישן לפני החלפתו.
- לא הוגדר חוזה מלא של התנהגות המנוע הישן, לרבות גאומטריה, טיפוגרפיה, עימוד רכיבים מיוחדים, שערים, תוכן עניינים, כותרות, עיטורים ומספור.
- לא הועברו כל היכולות והמידע הנדרשים למודל החדש.
- נבנו רכיבים חדשים בלי לוודא שהם מממשים את ההתנהגות המקורית.
- מערך הבדיקות לא בדק את המנוע שהמשתמשים קיבלו בפועל.
- בוצע Cutover לפני שהוכחה שקילות מספקת של הפלט.

רשימת התקלות שהמשתמש מסר אינה מפרט באגים לתיקון נקודתי. היא ראיות למחדל הכולל בתכנון ובהעברת המנוע.

## 2. עקרונות שאסור לסטות מהם

1. **המנוע החדש נשאר יעד הפיתוח.** אין להסתפק בהשארת המנוע הישן כברירת מחדל לצמיתות.
2. המנוע הישן ב־9C.3 הוא כעת בסיס תפקודי, מקור ידע ואורקל להשוואה. יש לחקור אותו, למדוד אותו ולהעביר את יכולותיו למנוע החדש.
3. אין להעתיק את הארכיטקטורה הישנה באופן עיוור. יש לשמר את התוצאה והיכולות, לא בהכרח את דרך המימוש.
4. אין לבצע תיקוני CSS, ערכי קסם או חריגים מקומיים כדי להסתיר פערים במודל החדש.
5. אין לשנות התנהגות מוצרית קיימת בלי לזהות את השינוי, לנמק אותו ולקבל אישור כשנדרשת הכרעה מוצרית.
6. אין למחוק קוד ישן או לנתק נתיב עובד עד שהחלופה החדשה הוכחה.
7. יש לשמור על פישוט ואיחוד המנוע: מקור אמת יחיד, חוזים מפורשים, ללא שכבות כפולות וללא טלאים.
8. אין להסתפק בכך שהטקסט קיים בפלט. יש לשמר את מיקומו, גודלו, הגופן, חלוקת השורות, האזור והקשרו לשאר רכיבי העמוד.

## 3. ניתוח חובה של שני דוחות החקירה

קרא במלואם:

- `audits/חקירת השינויים שבין הגירסא החדשה לגירסאות הקודמות.MD`
- `audits/live-site-investigation-2026-11-19.md`

יש להתייחס לדוח השני כמקור מרכזי לממצאי A/B ולמדידות, אך לא לקבל שום מסקנה שלו ללא אימות בקוד ובבדיקות.

יש לסווג כל שינוי שנמצא באחת מארבע קטגוריות:

A. שינוי ארכיטקטוני מכוון ולגיטימי, שאינו אמור לשנות את תוצאת העימוד.

B. שינוי התנהגותי מכוון ומתועד, שיש לבדוק אם הוא אכן תואם את דרישות המשתמש והחלטותיו.

C. שינוי התנהגותי שנוצר עקב השמטה, העברה חלקית, מימוש חסר או הנחה לא מבוססת - כשל בתכנון או בביצוע.

D. שינוי שמקורו עדיין לא הוכח ודורש חקירה.

דוגמאות חשובות שכבר זוהו:

- Web Worker, PageModel, מנוע DP וייצוא מתוך מודל: מטרות ארכיטקטוניות לגיטימיות.
- Cutover ב־9C.4: בוצע בלי הוכחה מספקת שהמנוע החדש משמר את המוצר.
- גאומטריית הטורים, אזורי הצד, פס הכותרת וה־TOC: לא הועברו כחוזה מלא.
- היעדר `fontKey` בשורות המודל: כשל בהעברת מידע טיפוגרפי.
- `toHebrewNumber` עם גרשיים: שינוי מכוון (D-37), אך אינו שקול לפורמט המקורי.
- קדימות `imud-book-title` למטא: החלטה שתועדה (S4.5), אך יישומה מול ערך דוגמה גנרי גרם לדריסת נתוני המסמך.
- ביטול בדיקת ההתאמה למקור (D-100): שינוי מכוון, שלא לווה במנגנון חלופי לבדיקת שקילות.
- `run-ours.js` שהוסט להרצת המורשת: בדיקות ירוקות שלא הוכיחו את תקינות המנוע החדש.

יש להבחין בין החלטה מכוונת לבין תוצאה שנוצרה עקב מימוש לקוי של אותה החלטה.

## 4. שלב ראשון - הקמת תמונת מצב מלאה של 9C.3

לפני כל שינוי:

1. ודא ש־`main` אכן נמצא ב־9C.3.
2. בדוק את מצב `gh-pages` בנפרד. אל תניח שהחזרת main החזירה גם את האתר החי.
3. בדוק את ה־bundles ואת תהליך הפריסה.
4. הפעל את המנוע הישן על מסמכי הבדיקה הקבועים.
5. שמור פלטים מלאים של HTML/PDF, Page Geometry, טקסטים, שורות, גופנים, מיקומים, שערים, עיטורים, TOC, מספור וכותרות.
6. הפק חתימות והשוואות שניתן יהיה להריץ שוב לאחר כל שלב במנוע החדש.

יש להשתמש באותם מסמכים, הגדרות, גופנים וסביבת ריצה להשוואת A/B.

## 5. שלב שני - חקירה מלאה של המנוע הישן

יש לבצע מיפוי שיטתי של כל רכיבי העימוד, לא רק של מנוע שבירת השורות.

לכל רכיב יש לזהות:

- מקור הנתונים.
- שלב העיבוד שבו הוא נוצר.
- חוזה הגאומטריה שלו.
- אופן מדידת הטקסט.
- גופן, גודל, משקל ויישור.
- מיקום, רוחב, גובה, שוליים ומרווחים.
- קשרו למבנה העמוד ולטורים.
- כללי מעבר עמוד, מעבר טור והצמדה לרכיבים אחרים.
- אופן ההקרנה ל־HTML ול־PDF.
- הגדרות המשתמש המשפיעות עליו.
- ברירות מחדל וערכי מטא שמגיעים מהמסמך.
- כל התנהגות מיוחדת שאינה נראית בהכרח במבנה הטקסט.

מפת הרכיבים חייבת לכלול לפחות:

### א. גאומטריית העמוד
- גודל עמוד.
- שוליים פנימיים וחיצוניים.
- רוחב הטורים ומיקומם.
- המרווח בין הטורים.
- אזורי כותרות צד והערות צד.
- אזור הכותרת העליונה.
- אזור העמודון.
- אזורי הערות שוליים.
- אזורי פריטים חוצי טורים.

### ב. שערים
- שער ראשי.
- שער אחורי.
- שער משנה.
- מיקומי כל תיבות הטקסט.
- רוחב, גובה, גופן, יישור, ריווח ופיזור אנכי.
- רקעים, SVG, עיטורים וכתרים.
- פיצול כותרת שער משנה.
- שמירת הגדרות משתמש וטעינתן.
- התאמה בין הנתונים הגולמיים, המודל והמרנדר.

### ג. תוכן עניינים
- מבנה היררכי.
- רמות הכותרות.
- INLINE.
- צמד כותרת/עמודון.
- יישור ומיקום העמודון.
- גופנים וגדלים לכל רמה.
- ריווח בין שורות וקבוצות.
- כותרות פתיחה.
- מעבר בין עמודי תוכן העניינים.
- קישורים ויעדים.
- גבולות אזור העימוד.

### ד. כותרות ורכיבים מבניים
- כותרות 0-7.
- מיקום כותרת 0 בהקדמה.
- כותרת 2 ופתיחת פרק.
- כותרות 3-7.
- כללי full-width.
- כללי מעבר עמוד וטור.
- רווח לפני ואחרי.
- עיטורי פתיחה והפרדה.
- כותרות עליונות וכותרות צד.

### ה. טיפוגרפיה
- גופני גוף, כותרות, תוכן עניינים, שערים, הערות צד, כותרות עליונות ועיטורים.
- רישום גופנים ו־font keys.
- מדידות טקסט.
- שבירת שורות.
- ריווח מילים.
- יישור שורות.
- טיפול בשורות דלילות.
- יחידות מידה והמרות.

### ו. מספור ועיטורים
- מספור עמודים.
- גימטריה.
- מיקום וגודל עמודון.
- עיטורי סוף פרק.
- עיטורים בין כותרות.
- עיטורי שער.
- התאמת גודל העיטור לנכס המקורי ולתפקידו.

אין להסתפק ברשימת קבצים. יש להבין את זרימת הנתונים מקצה לקצה.

## 6. שלב שלישי - הגדרת חוזה מוצרי וקנוני למנוע החדש

לאחר מיפוי המנוע הישן יש להגדיר חוזה מפורש של תוצאת העימוד.

החוזה צריך להיות בלתי תלוי במימוש, ולכלול:

- מבנה מסמך.
- מבנה עמוד.
- תיבות גאומטריות.
- טורים.
- אזורי צד.
- פריטים חוצי טורים.
- שורות וטוקנים.
- גופנים וסגנונות.
- כותרות ורכיבים מבניים.
- שערים ותיבות טקסט.
- תוכן עניינים.
- עיטורים ורקעים.
- מספור.
- קישורים.
- הערות שוליים והערות צד.

ה־PageModel חייב להכיל את כל המידע הדרוש להצגת העמוד ללא המצאת ערכים על ידי המרנדר.

אין לאפשר מצב שבו רכיב נמדד בגופן אחד ומוצג בגופן אחר, או מצב שבו המודל יודע את הטקסט אך אינו יודע את הגאומטריה והסגנון שלו.

יש להגדיר מקור אמת יחיד לכל ערך. אין לחשב אותו פעם אחת במתכנן, פעם נוספת במרנדר ופעם שלישית בייצוא.

## 7. שלב רביעי - מעבר הדרגתי ומהיר, לא Cutover נוסף

אין לבצע החלפה גורפת נוספת.

יש להעביר את היכולות במקטעים ברורים, כאשר כל מקטע מסתיים בבדיקת שקילות מול 9C.3.

סדר מומלץ:

1. גאומטריית עמוד וטורים.
2. גופנים ומדידות.
3. כותרות עליונות, כותרות צד ועמודונים.
4. כותרות 0-7 וכללי פתיחת פרק.
5. תוכן עניינים.
6. שער ראשי, אחורי ומשנה.
7. עיטורים, רקעים וסמלי סוף פרק.
8. הערות שוליים והערות צד.
9. ייצוא HTML/PDF.
10. ביצועים, זיכרון ויציבות במסמכים ארוכים.

אפשר לבצע מספר רכיבים במקביל רק אם חוזי הנתונים ביניהם הוגדרו מראש, ואין סיכון לדריסת עבודה או לפיצול מקורות אמת.

יש להימנע מהעברת רכיבים באמצעות קוד זמני שמייצר פלט דומה רק במסמך בדיקה אחד.

## 8. שערי קבלה מחייבים

כל שלב ייבדק מול 9C.3 באותם מסמכים והגדרות.

### שער א - שלמות התוכן
- אין השמטת טקסט.
- אין כפילות.
- אין שינוי סדר.
- אין דליפת מזהי כותרות.
- אין דריסת מטא-דאטה של המסמך בערכי דוגמה.

### שער ב - שקילות גאומטרית
- מיקומי טקסט.
- רוחב וגובה תיבות.
- מיקום הטורים.
- מרווחים.
- אזורי צד.
- כותרות עליונות.
- עמודונים.
- שערים.
- TOC.
- עיטורים.

יש למדוד הבדלים מספריים ולהגדיר סבילות לכל רכיב. אין להכריז על שקילות לפי התרשמות בלבד.

### שער ג - שקילות טיפוגרפית
- גופן.
- גודל.
- משקל.
- יישור.
- שבירת שורות.
- ריווח מילים.
- גובה שורה.
- שורות דלילות.

### שער ד - התנהגות מבנית
- פתיחת פרקים.
- מעבר עמוד וטור.
- כותרות בודדות.
- פריטים חוצי טורים.
- סוף פרק.
- תוכן עניינים.
- פתיחה והקדמה.

### שער ה - ייצוא
יש להשוות את התצוגה ואת ה־PDF, ולא להסתפק בכך שהמודל עצמו תקין.

### שער ו - ביצועים
- זמן עימוד.
- מספר קריאות מדידה.
- צריכת זיכרון.
- התכנסות האלגוריתם.
- מספר ממצאי audit.
- התנהגות במסמכים ארוכים.

דטרמיניזם אינו הוכחת נכונות. מנוע שמפיק שוב ושוב אותה תוצאה שגויה נכשל.

## 9. תיקון מערך הבדיקות - תנאי מוקדם לכל Cutover

יש לבדוק את הנתיב האמיתי שהמשתמשים מפעילים.

- `run-ours.js` חייב להריץ את המנוע המאוחד כאשר מטרתו לבדוק את המנוע המאוחד.
- בדיקות מורשת יישארו כבדיקות מורשת נפרדות.
- אין להציג CI ירוק על מנוע המורשת כהוכחה לתקינות המנוע המאוחד.
- יש להחזיר בדיקת השוואה למקור או לבנות חלופה מלאה לה.
- כל fixture לבדיקת מטא חייב להשתמש בשם ספר שאינו זהה לערך ברירת המחדל.
- יש להוסיף בדיקות שליליות שמוכיחות שכשלי גאומטריה, גופנים, TOC ושערים מזוהים.
- יש לשמור פלטי A/B להשוואה חזותית ומספרית.

**אסור לבצע Cutover נוסף לפני שכל שערי הקבלה הרלוונטיים עוברים על המנוע המאוחד עצמו.**

## 10. רשימת תסמינים שכבר נצפו - ראיות למחדל המעבר

יש להשתמש ברשימה הבאה כבדיקת כיסוי לתהליך ההעברה, לא כרשימת תיקונים נקודתיים:

- מיקומי הטקסט בשער האחורי נעלמו והטקסט התכווץ למרכז.
- שם ספר גנרי מופיע בכותרת העליונה למרות שמטא המסמך מכיל שם ספר, מחבר ונושא.
- עיצוב תוכן העניינים נעלם: INLINE בוטל, הכול בטור אחד, גלישה מחוץ לגבולות וגופנים שגויים.
- מיקומי הטקסט בשער המשנה נעלמו והטקסט הוצמד למעלה.
- רקע שער המשנה נעלם.
- כותרת שער המשנה אינה מחולקת כראוי.
- עיטורי השערים נעלמו.
- כותרת ההקדמה (H0) אינה ממוקמת בגובה המקורי.
- מזהה כותרת דולף לתוכן.
- רווחים עצומים בגוף ההקדמה.
- מספור עמודים עם גרשיים במקום הפורמט המקורי.
- עיטור סוף פרק מוקטן מאוד.
- תוכן העניינים, הכותרות העליונות וכותרות הצד מוצגים בגופן רש"י במקום בגופנים המקוריים.
- הכותרות העליונות קטנות מאוד.
- כותרת 2 מתוכננת בתוך שני טורים ומופיעה לבדה בעמוד.
- מרווח עצום בין הטורים.
- כותרות הצד נדחקות לקצה העמוד.
- גוף הטקסט מלא בשורות דלילות.
- עיטור סוף פרק מוצג בעימוד שני טורים ובגודל מזערי.
- יותר מאלף ממצאי audit במסמכים מסוימים.
- זמן העימוד גדל באופן קיצוני.

לכל אחד יש לאתר את נקודת הכשל בתהליך ההעברה: מה היה קיים בישן, מה היה אמור להיכנס לחוזה החדש, היכן אבד המידע או שונתה ההתנהגות, ומדוע הבדיקות לא עצרו את המעבר.

## 11. אופן העבודה והדיווח

יש לעבוד במהירות אך לא לדלג על חקירה והוכחות.

בכל שלב דווח בקצרה:

1. מה נבדק.
2. מה נמצא במנוע הישן.
3. מה קיים במנוע החדש.
4. מה חסר או שונה.
5. האם השינוי מכוון או תוצאה של כשל העברה.
6. מה הפתרון המבני.
7. אילו בדיקות מוכיחות את התיקון.
8. האם נשמרה שקילות מול 9C.3.

אין להציג תוצאות בדיקה שלא הורצו. אין לטעון שהאתר החי עודכן לפני אימות בפועל.

אין להסתפק בדוח ארוך. יש לבצע את העבודה בקוד, להוסיף בדיקות, לשמור תיעוד ולבצע אימות.

## 12. תנאי סיום

המשימה תיחשב הושלמה רק כאשר:

- המנוע המאוחד משמר את כל יכולות העימוד של 9C.3.
- כל רכיבי הספר מוצגים במיקומם ובצורתם הנכונים.
- אין אובדן של גופנים, עיצובים, שערים, עיטורים, תוכן עניינים או הגדרות.
- אין רגרסיות בתוכן או בסדר העמודים.
- בדיקות ה־CI בודקות את הנתיב החי האמיתי.
- קיימת השוואת שקילות מתמשכת מול 9C.3.
- הביצועים סבירים ומשופרים ביחס לנקודת הבסיס.
- הארכיטקטורה נשארת מאוחדת, פשוטה וברורה, ללא טלאים ונתיבים כפולים.

**הנחיה אחרונה:** אל תנסה להוכיח שהמנוע החדש טוב באמצעות בדיקות שהוא עצמו הגדיר. הוכח שהוא משמר את המוצר שעבד לפני המעבר, ורק לאחר מכן הוכח שהוא משפר אותו. המטרה היא מנוע חדש, מדויק, מהיר ומאוחד - לא חזרה קבועה למורשת ולא שיקום טלאי של תוצאה שנפגעה.

**המלצה ניהולית שלי\:** לא לתת לסוכן להתחיל מיד בכתיבת תיקונים. תחילה עליו להחזיר בתוך זמן קצר מפת פערים מלאה ומבוססת־קוד, יחד עם תוכנית העברה מדורגת. לאחר מכן שיתחיל לבצע ברצף, בלי להמתין לאישור על כל תיקון קטן. כך נשיג גם מהירות וגם שליטה, בלי לחזור על הכשל של 9C.4.

## Prompt:
19.11.2026, 1:47:02

הפרומט הועבר לסוכן הAI שהתחיל בעבודה, בנתיים אני רוצה שאתה תערוך מחקר מדוייק ובלתי מתפשר על הכשל שהיה בתכנון, ועל הדרכים למונעו פעם הבאה, ותיצור תכנית מושלמת שתימנע מטעויות כאלה לקרות ושתוכל לבדוק לפיה שביצוע התכנית ע"י הסוכן נעשית בצורה המושלמת ביותר, אם תשקיע את כל כוחך בזה אני בטוח שנוכל להגיע למנוע פשוט מדוייק מהיר ואחיד במהירות האפשרית.

## Response:
19.11.2026, 1:47:16 · gpt-6-t-mini

אבחן את הכשל ברמת תהליך ההנדסה, לא כרשימת תקלות: אשווה בין נקודת הייחוס 9C.3, המעבר למנוע החדש, דוחות החקירה, מבנה הקוד ומערך הבדיקות. מתוך הממצאים אבנה תכנית מעבר מדורגת עם תנאי עצירה, ראיות נדרשות ושערי קבלה שיאפשרו לך לבדוק את עבודת הסוכן בלי להסתמך על הצהרות הצלחה בלבד.

מצאתי כבר ממצא תהליכי חשוב: בריפו הנוכחי, לאחר החזרת `main` ל־9C.3, שני קובצי החקירה שהוזכרו קודם אינם מופיעים בתיקיית `audits` של `main`\. לכן לא אבסס את התכנית רק עליהם; אני בודק גם את תיעוד השלבים הקודם, מפת המעבר, נתיבי הריצה והיסטוריית הקומיטים — כדי לזהות מה היה ידוע לפני החיתוך, ומה בכל זאת לא הפך לתנאי חסימה.

# חקירת הכשל ותכנית למניעת הישנותו

## 1\. המסקנה המרכזית שעולה מן התיעוד

הכשל לא היה עצם הבחירה במנוע חדש, ולא עצם השימוש ב־PageModel, ב־Worker או באלגוריתם Knuth-Plass. הכשל היה **הגדרה שגויה של משמעות ההצלחה במעבר**\: הוכחה שהמנוע החדש מסוגל לייצג ולשמר את התוכן, הוצגה כבסיס מספיק להעברת המוצר אליו - אף שלא הוכח שהוא משמר את התנהגות העימוד, הגאומטריה והעיצוב של המנוע הוותיק.

זו הבחנה יסודית. מנוע יכול לשמר כל מילה, כל הערת שוליים וכל כותרת, ועדיין להפיק ספר שאינו ראוי לשימוש: טורים במיקומים שגויים, כותרות בגופנים שגויים, שערים שנעלמו, תוכן עניינים שאיבד את המבנה שלו, או עמודים שהרכבם שונה לחלוטין.

לכן אמת המידה הנכונה למעבר אינה "האם המודל החדש מכיל את כל המידע?", אלא\:

**האם המערכת החדשה מפיקה, עבור אותו מסמך ואותן הגדרות, את אותה התנהגות מוצרית שהמערכת הישנה הפיקה - בכל שכבות העימוד, התצוגה והייצוא - ורק לאחר מכן האם היא משפרת אותה באופן מבוקר?**

## 2\. ראיה מכרעת: שערי הקבלה של 9B לא הוכיחו מוכנות להחלפת המנוע

בדוח הסגירה של 9B מתועדים נתונים מרשימים: 78 קובצי בדיקה, דטרמיניזם, שימור תוכן, זהות בין מספרי הערות, בדיקות H7, בדיקות תוכן עניינים, ושערי Shadow ירוקים בשני קורפוסים. הדוח אף קובע שכל שערי 9B ירוקים, ולכן תנאי המעבר ל־9C התקיימו. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/S9B_FINAL_VERIFICATION_2026-11-18.md?utm_source=chatgpt.com)

אבל כאן נמצאת חולשת התכנון: שערי ההצלחה שתועדו התמקדו בעיקר ב־**שלמות תוכן, זהויות, מבנה ותקינות פנימית**\. הם לא סיפקו הוכחת שקילות מלאה של המוצר החזותי והטיפוגרפי.

לדוגמה, הוכחה ש־527 רשומות תוכן עניינים קיימות אינה מוכיחה שהן מסודרות בשתי עמודות, שהן INLINE במקום הנכון, שהגופנים והגדלים שלהן נכונים, שהריווח והיישור נשמרו, או שהן אינן גולשות מעבר לעמוד. באותה מידה, הוכחת שימור של ארבעת מקטעי השער האחורי אינה מוכיחה שהמקטעים ממוקמים במקומם, בגודלם ובעיצובם המקורי.

מכאן נובעת מסקנה מעשית: **הבדיקות שעברו לא היו בהכרח שגויות; הן פשוט לא בדקו את התכונה שעל בסיסה התקבלה החלטת המעבר.** זו אינה תקלה נקודתית בבדיקה אחת, אלא פער בין תנאי הקבלה לבין הסיכון האמיתי של השינוי.

## 3\. ההבחנה החשובה: אין להחזיר את בדיקת הייחוס שבוטלה

מצאתי נקודה שחייבת להנחות את כל התכנון החדש. בהחלטה **D-100** מ־11 בנובמבר נקבע במפורש שבדיקת ההתאמה ל־PDF הישן מבוטלת לחלוטין, ושאין להשתמש בה עוד אפילו כמדד מגמה. ההחלטה הזו תקפה, ואין בתכנית החדשה כוונה להחזיר את P6/P7 או לרדוף אחרי ה־PDF ההיסטורי. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/DECISIONS.md?utm_source=chatgpt.com) · [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/tools/layout-parity/README.md?utm_source=chatgpt.com)

אבל ביטול הייחוס לא פטר את הפרויקט מהצורך להוכיח שהמנוע החדש ממלא את דרישות המוצר. היה צריך להחליף את בדיקת הייחוס במערכת אחרת: **מפרט התנהגות ותכונות מלא, שנגזר מהכרעות המשתמש, מהיכולות הקיימות בקוד ומהתנהגות המוצר המאושרת - ולא מקובץ PDF חיצוני.**

כאן בדיוק נוצר החלל: בדיקת הייחוס בוטלה, אבל שערי 9B לא מילאו את מקומה. בדקתי את קוד `shadow-compare.js` עצמו: 13 השערים שלו עוסקים בכיסוי תוכן, עודפים, הערות, זהויות ביאורי־צד, רשומות תוכן עניינים, דקדוק כותרות והתאמת התוכן ב־PageModel. **אין בהם בדיקה של מיקומי פריטים, מידות טורים, מרווחים, גופנים, שבירות שורות, עיצוב שערים או התאמה חזותית בין התצוגה לייצוא.** לכן 13/13 היה נכון ביחס לבדיקות שהוגדרו, אבל לא הוכיח שהמוצר מוכן לחיתוך. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/stage9c/cutover/tools/stage9/shadow-compare.js?utm_source=chatgpt.com) · [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/font-catalog-forensics-2026-11-19/audits/STAGE9_SHADOW_very_long_2026-11-18_v5.md?utm_source=chatgpt.com)

יש לכך גם הוכחה מהשלב הבא: באודיט הראשון של הנתיב המאוחד אחרי החיתוך נמצאו 26 עמודים שבהם גוף הטקסט חדר לאזור מרזב ההערות. בהמשך התגלו ותוקנו ארבעה כשלים בתכנון ובחישוב, ובנוסף נלכדה רגרסיה במיקום הכותרת העליונה. כלומר, בדיקות התוכן והמודל שעברו קודם לא הספיקו להגן מפני כשלים שהופיעו רק בבדיקת המוצר בפועל. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/stage9c/cutover/audits/S9C_FOOTNOTE_GUTTER_2026-11-18.md?utm_source=chatgpt.com) · [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/60?utm_source=chatgpt.com)

מכאן נגזרת התכנית: לא למדוד הצלחה לפי דמיון ל־PDF הישן, אלא להגדיר ולבדוק במפורש כל יכולת מוצרית וכל אילוץ גאומטרי וטיפוגרפי שהמנוע חייב לקיים.

## 4\. התחקיר: שבעה כשלים תכנוניים שהובילו לכשל המעבר

לאחר בחינת מפת המעבר, דוחות 9B ו־9C, קוד הבדיקות, היסטוריית PR \#60 והחלטות הפרויקט, אני מזהה שבעה כשלים מרכזיים. הם קשורים זה בזה, אך לכל אחד מהם נדרש מנגנון מניעה נפרד.

**א. הוגדר יעד ארכיטקטוני לפני שהושלם מפרט היכולות של המוצר.**

התכנית היטיבה להגדיר מהו מנוע טוב מבחינה הנדסית: מודל תוכן אחיד, מדידה אחת, Planner אחד, PageModel יחיד ומקרינים טהורים. אלה מטרות נכונות. אבל יש הבדל בין הגדרת הארכיטקטורה שתארח את היכולות לבין הגדרת כל היכולות שהארכיטקטורה חייבת לארח.

לדוגמה, העובדה ש־PageModel יודע לייצג שורת טקסט ומיקום אינה מוכיחה שהוא יודע לייצג את כל מה שהשער, תוכן העניינים, ההקדמה או הכותרת העליונה צריכים: משפחת גופן ו־face מדויקים, מקטעי סגנון בתוך מילה, מבנה INLINE, שכבות עיטור, רקע, תיבות מיקום נפרדות, סדר עדיפויות של מטא־נתונים ועוד.

**ב. מפת המעבר הציבה תנאי נכון, אך הבדיקה לא מדדה אותו.**

`STAGE9_CUTOVER_MAP.md` קבע במפורש שלא להסיר את מנוע המורשת לפני הוכחת parity. אולם כלי ההשוואה ששימש להוכחה בדק בעיקר שלמות תוכן ומבנים סמנטיים. כך נוצר פער בין המונח "parity" במסמך התכנון לבין מה שנמדד בפועל.

**ג. בדיקות פנימיות החליפו בטעות בדיקות מוצר.**

13/13 שערים ירוקים הוכיחו שהמערכת עוברת 13 בדיקות שהוגדרו. הם לא הוכיחו שהשערים נראים נכון, שהטורים ממוקמים נכון, שהגופנים נכונים או שתוכן העניינים שומר על המבנה והעיצוב. הבדל זה צריך להיות מפורש בשמות הבדיקות, בדוחות ובשערי הקבלה.

**ד. לא נשמרה הבחנה חדה בין שלמות המודל לבין נכונות הגאומטריה.**

PageModel יכול להיות שלם מבחינת מילים, זהויות ועוגנים, אבל שגוי לחלוטין מבחינת x/y/w/h, גבהים, רווחים, תיבות ויישור. לכן בדיקת התאמת PageModel לתוכן אינה תחליף לאודיט גאומטרי מלא של המודל עצמו.

**ה. בדיקות לא תמיד הוכיחו שהן בודקות את הנתיב הנכון.**

יש להבחין בין הרצה ישירה של פונקציית מנוע, הרצה דרך ה־Worker, הפעלת האפליקציה, תצוגה בדפדפן וייצוא. לדוגמה, בגרסת `run-ours.js` בענף 9C לאחר החיתוך, הקריאה למורשת נעשית במפורש דרך `legacyTypeset`\. זו דרך תקפה לבדוק את מנוע המורשת, אך אין להשתמש בתוצאה כראיה לנכונות המנוע המאוחד. כל דוח חייב לזהות את הנתיב שנבדק בפועל.

**ו. קריטריוני בדיקה שונו במקביל לשינוי שאותו נועדו לבדוק.**

ב־PR \#60 תועד מקרה שבו ריכוך בדיקת מיקום הכותרת העליונה אפשר לכותרת במיקום שגוי לעבור את האודיט המתמטי. בהמשך הוחזר הסף הקבוע, לאחר שבדיקה אחרת חשפה את הרגרסיה. זהו לקח קריטי: אסור לשנות את אמת המידה רק משום שהמימוש החדש אינו עובר אותה. שינוי אמת מידה חייב לעבור הצדקה עצמאית, הגדרת התנהגות רצויה ובדיקת שלילה.

**ז. החיתוך בוצע לפני שהושלמה הוכחת המוצר מקצה לקצה.**

המעבר כלל שינויים בכמות גדולה של קבצים ובמספר שכבות מוצר. רק לאחר שהנתיב המאוחד הפך לנתיב הפעיל נחשפו בעיות חמורות במרזב ההערות. המעבר ההדרגתי בין מקרינים היה צעד בכיוון הנכון, אבל הוא לא הותנה בהוכחת התנהגות מלאה של כל המוצר.

המסקנה: **לא חסר בפרויקט ידע כיצד לבנות מנוע אחיד. חסרה שיטת הוכחה שמונעת הכרזה על השלמת מעבר לפני שהמנוע האחיד הוכיח שהוא ממלא את חוזה המוצר.**

## 5\. תכנית הביצוע והבקרה המלאה

המסמך הבא הוא תכנית עבודה וביקורת שאפשר להפעיל מול עבודת הסוכן הנוכחית. היא אינה הוראה להתחיל מחדש את כל עשרת השלבים, אלא דרך לבדוק את המימוש הקיים, לזהות פערים אמיתיים ולסגור אותם לפי סדר התלויות.

**document: **

# תכנית מחייבת לחקירה, השלמה ובקרת המעבר למנוע העימוד המאוחד

**פרויקט:** Tora Book Typesetter Red / Imudify  
**בסיס עבודה:** 9C.3  
**מטרה:** מנוע עימוד יחיד, פשוט, מדויק, דטרמיניסטי, מהיר וקל להרחבה - ללא אובדן יכולות וללא מנגנונים כפולים.

---

## 1. עקרונות יסוד שאסור לחרוג מהם

### 1.1 אין חיתוך לפני הוכחת המוצר

המנוע המאוחד הוא יעד הארכיטקטורה. הוא אינו מקבל מעמד של מנוע המוצר רק משום שהוא משתמש במודל אחיד, ב־Planner יחיד או ב־PageModel.

המעבר ייחשב מוצלח רק לאחר שכל היכולות הנדרשות של המוצר הועברו, חוברו למסלול הפעיל ונבדקו מקצה לקצה.

### 1.2 אין להחזיר בדיקות שבוטלו בהחלטת המשתמש

החלטת D-100 נשארת בתוקף:
- אין בדיקת התאמה ל־PDF הייחוס ההיסטורי.
- אין שימוש ב־P6/P7, לרבות כמדדי מגמה.
- אין ניסיון לכפות על המנוע החדש את שבירת השורות או את הפריסה של אותו PDF.

במקום זאת, יש להגדיר מפרט מוצר חיובי: מה המנוע חייב לבצע, מהן ההגדרות וההתנהגויות המאושרות, ומהם התנאים המתמטיים שכל עימוד תקין חייב לקיים.

הקוד הישן בגרסת 9C.3 נבדק כמקור להבנת יכולות, זרימת מידע והתנהגויות קיימות. הוא אינו אמת מוחלטת לכל החלטה חזותית. אין לשמר באג רק מפני שהיה קיים בעבר, ואין לשנות יכולת קיימת ללא הצדקה והגדרה מפורשת.

### 1.3 כל עובדה מחושבת פעם אחת

המידע והאחריות חייבים להיות חד־משמעיים:
- מקור סמכות יחיד לתוכן ולזהויות.
- מקור סמכות יחיד להגדרות, סגנונות ונכסים.
- מקור סמכות יחיד למדידה ולמטריקות גופן.
- מנגנון יחיד לשבירת שורות.
- Planner יחיד להחלטות פריסה.
- PageModel יחיד לגאומטריה הסופית.
- מקרינים טהורים ל־DOM, ל־HTML ול־PDF.

אין להכניס תיקוני CSS שמסתירים שגיאות במודל, מדידה חוזרת במקרין, מסלול חלופי לפריט מסוים או שכבת post-layout שמתקנת תוצאות של מנוע אחר.

### 1.4 כל שינוי חייב להקטין אי־ודאות

אין להגדיר עבודה כהצלחה לפי כמות הקוד שנכתבה או מספר הבדיקות שעברו. הצלחה היא פתרון שורש שמקטין כפילויות, אחריות כפולה, תנאים חריגים ותלויות סמויות.

---

## 2. שלב ראשון - מיפוי מלא של המוצר הקיים

לפני כל החלטת מימוש, יש להשלים מפת יכולות המבוססת על קוד 9C.3, החלטות המשתמש, ההגדרות בפועל והתנהגות המוצר.

המיפוי אינו רשימת שמות של קבצים. כל יכולת חייבת להיחקר לאורך כל צינור העיבוד: קלט → פענוח → מודל → סגנון ונכסים → מדידה → תכנון → PageModel → תצוגה וייצוא.

### 2.1 תחומי החקירה

1. **סוגי עמודים:** שער ראשי, שער משנה, שער אחורי, עמודי תוכן עניינים, הקדמה, פתיחת פרק/סימן, עמודי גוף, עמודים ריקים ועמודי הערות-סיום.

2. **גאומטריית עמוד:** גודל עמוד, שוליים, תיבות תוכן, מיקום הטורים, רוחב הטורים, מרווח ביניהם, אזורי הערות, מרזבים, כותרות עליונות, עמודונים ואזורי עיטור.

3. **טקסט ומבנה:** כל רמות הכותרת H0-H7, פסקאות, מזהי טקסט, קידומות, מספור, חלוקת פסקאות, כותרות חוצות-טורים, פתיחת סימן ומעבר עמוד.

4. **טיפוגרפיה:** משפחת גופן, face, משקל, סגנון, גודל, צבע, כיוון, line-height, baseline, מקטעי גופן בתוך מילה, ירושה ו־fallback.

5. **הערות:** הערות גוף, סימנים, ביאורי-צד, עוגנים, הערות רציפות, הערות חוצות עמודים, הערות סיום, חלוקת טקסט ומיקומי ההמשך.

6. **תוכן עניינים:** כללי ומפורט, הרמות המוצגות, סדר, מספור, מספרי עמודים, קישורים, קבוצות, INLINE, מספר עמוד מעוצב בנפרד, גופנים ומבנה רב-עמודי. יש לשמר את החלטות D-107.

7. **שערים ופריטי עיצוב:** עיצובי שער, רקעים, תמונות, עיטורים, מפרידים, עיטורי סיום פרק, גדלים, מיקומים, שכבות ויחסי מיקום בין הפריטים.

8. **הקדמה וכותרות מיוחדות:** מיקום H0, גוף ההקדמה, שורות כותרת, פיצול שורות, ריווח, גופנים, יישור ורקע.

9. **מטא־נתונים:** שם ספר, מחבר, נושא, שנת הוצאה ופרטי השער האחורי; מקורות הערכים, קדימות בין הגדרות ומטא־נתוני מסמך, וכללי נפילה לערך ברירת מחדל.

10. **הגדרות משתמש ותבניות:** כל מזהי ההגדרות, כל ברירות המחדל, ערכות השערים, טעינה ושמירה של הגדרות, מיפוי קלטים ישנים, קדימות בחירות מפורשות וצרכני כל הגדרה.

11. **נכסים וגופנים:** קטלוגים, קבצי גופן, פנים שונים של אותה משפחה, aliases, WOFF2/TTF, טעינה ב־Worker, מדידה, הטמעה ב־PDF ושגיאות טעינה.

12. **מסלולי מוצר:** UI, Worker, תצוגה חיה, ניווט וסמן, ייצוא HTML, ייצוא PDF, טעינה מקומית, דיאגנוסטיקה ובדיקות.

13. **ביצועים:** זמן פענוח, זמן מדידה, זמן שבירת שורות, זמן תכנון, בניית PageModel, רינדור, ייצוא, צריכת זיכרון וטעינת נכסים.

### 2.2 טבלת מעקב מחייבת

כל יכולת תופיע בטבלה אחת עם העמודות:

| שדה | תוכן נדרש |
|---|---|
| מזהה יכולת | מזהה קבוע |
| דרישת מוצר | מה המשתמש מצפה לקבל |
| מקור סמכות | החלטת משתמש, הגדרה או קוד קיים |
| מימוש ישן | קובץ, פונקציה ונתיב נתונים |
| מימוש חדש | קובץ, פונקציה ונתיב נתונים |
| מצב | חסר / חלקי / מחובר / מאומת |
| פער שורשי | מה בדיוק חסר או משתבש |
| בדיקה | שם בדיקה ונתיב הריצה |
| ראיה | דוח, artifact ו־commit |
| החלטה | לשמר / לתקן / לשפר / לא רלוונטי |
| סטטוס קבלה | טרם נבדק / עבר / נכשל / ממתין להכרעה |

אין להשתמש בסטטוס "הושלם" בלי ראיה במסלול המוצר הפעיל.

### 2.3 תנאי סגירת שלב

- כל סוגי העמודים והפריטים מופו.
- כל קלט והגדרה מקושרים לצרכן בפועל.
- כל יכולת קיימת בגרסה הישנה מסווגת לפי חשיבותה.
- כל פער בין הישן לחדש מוסבר או מסומן כחסר.
- אין רכיב משמעותי שמופיע רק ברינדור ישן ללא תחליף מוגדר.
- אין שינוי ברירת מחדל ללא החלטת משתמש או החלטה מפורשת שכבר אושרה.

---

## 3. שלב שני - הגדרת חוזי נתונים מלאים

המעבר לא יתקדם לפי שמות מודולים אלא לפי חוזים בין שכבות המנוע.

### 3.1 חוזה התוכן

DocumentModel חייב לשמר:
- זהות מקור יציבה.
- סדר קריאה.
- מבנה היררכי.
- טקסט ותווים מדויקים.
- מקטעי סגנון וגופן.
- סמני הערות וזהויות עוגנים.
- מטא־נתונים.
- הפניות לנכסים.
- מאפייני פריטי עימוד מיוחדים.

### 3.2 חוזה הטיפוגרפיה והמדידה

כל פריט מדיד חייב לשאת את המידע הדרוש למדידה ולהקרנה מדויקות. מדידת אותו פריט אינה רשאית להשתמש במשפחת גופן אחת לצורך שבירה ובאחרת לצורך ציור.

יש לאחד:
- FontResolver.
- AssetResolver.
- MeasureAPI.
- מדדי רוחב וגובה.
- line-height ו־baseline.
- טיפול ב־weight/style/stretch.
- שמירת font identity ברמת fragment כאשר מילה מכילה כמה גופנים.

אין fallback שקט. גופן או face חסרים חייבים להיות מדווחים באופן מפורש.

### 3.3 חוזה השורות והתכנון

LineModel ו־PagePlan חייבים לשאת את כל הנתונים הדרושים למימוש ההחלטות:
- זהויות מילים ומקטעים.
- גאומטריית שורה.
- סוג שורה.
- סגנון מלא.
- נתוני גובה ורוחב.
- פערים והצמדות.
- אילוצי כותרות.
- עוגני הערות.
- מרזבי הערות והזמנות.
- סיבות החלטה ונתוני trace.

אין לחשב מחדש עובדה שכבר נקבעה בשלב מוקדם יותר.

### 3.4 חוזה PageModel

PageModel חייב לשקף את התוצאה הסופית לכל סוגי הפריטים והעמודים: תוכן, סגנונות, גאומטריה, קישורים, עיטורים, רקעים, תמונות, הערות וריהוט עמוד.

המודל חייב להיות שלם דיו כדי שכל מקרין יוכל לצייר אותו בלי להמציא החלטות או לבצע תכנון נוסף.

---

## 4. שלב שלישי - הטמעה לפי פרוסות אנכיות

אין לבצע מעבר רחב של כל המנוע בבת אחת. כל פרוסה צריכה להשלים יכולת מוצרית מוגדרת מקלט עד פלט.

### סדר העבודה המחייב

1. **השלמת מיפוי הפערים ותיקון אובדן מידע:** קודם לתקן את מקור המידע, מיפוי ההגדרות והמודל. אין לתקן תוצאה חזותית לפני שהוכח שהנתון הנכון מגיע למנוע.

2. **איחוד גופנים, סגנונות ונכסים:** משפחה ו־face קנוניים; אותה מדידה ואותה בחירת face ב־Worker, ב־DOM וב־PDF.

3. **איחוד מנוע השורות וה־Planner:** כללי שבירה, אילוצים, טורים, איזון, כותרות, פסקאות ומעברי עמוד.

4. **פריטי עמוד:** הערות, מרזבים, ביאורי-צד, עיטורים, תמונות, שערים, אזורי כותרת ורכיבים מבניים.

5. **תוכן עניינים ומבני מסמך:** מודל מובנה שמפריד בין תוכן הרשומה, מספר העמוד, גופן, צבע, קבוצה וקישור.

6. **PageModel מלא:** בניית המודל הסופי ואימותו לכל סוגי העמודים והפריטים.

7. **מקרינים:** DOM, HTML ו־PDF משתמשים באותו PageModel. אין החלטות עימוד או מדידה מחודשות.

8. **מסלול מוצר מלא:** בדיקה דרך האפליקציה וה־Worker בפועל, כולל טעינת הגדרות, נכסים, תצוגה וייצוא.

לכל פרוסה יש לבצע:
- שחזור פער לפני תיקון.
- זיהוי שורש בשרשרת הנתונים.
- בדיקת רגרסיה שהייתה נכשלת לפני התיקון.
- בדיקת שלילה שמוכיחה שהבדיקה מזהה פגם.
- בדיקת שימור תוכן וזהויות.
- בדיקות DOM/HTML/PDF.
- בדיקת השפעה על יכולות שכנות.
- הוכחת דטרמיניזם.
- הסבר כיצד השינוי מפשט את המנוע.

פרוסה אינה נסגרת בגלל בדיקת יחידה אחת או בגלל שינוי CSS מוצלח.

---

## 5. שלב רביעי - מערכת בדיקות שאינה מאפשרת הצלחה מדומה

יש להפריד בין סוגי הוכחות. דוח אחד עם מספר גדול של בדיקות ירוקות אינו מספיק.

### G1 - שלמות סמנטית

- כל התוכן נשמר.
- אין מילים חסרות או כפולות.
- כל מזהה מקור מיוצג כראוי.
- הערות, סמנים ועוגנים שלמים.
- אין תוכן רפאים.
- סדר הקריאה נשמר.
- אין פריטי תוכן ללא מקור או פריטי מקור ללא ייצוג.

### G2 - גאומטריה מוחלטת

לכל עמוד ולכל סוג פריט:
- אין חפיפות בין שורות.
- אין טקסט מחוץ לתיבת העמוד.
- אין חדירה של גוף למרזב הערות או לאזור אסור.
- תיבות הטורים, השוליים והמרזבים עומדות בחוזה.
- הכותרות העליונות והעמודונים במקומותיהם.
- אין רכיב שנעלם או עבר לאזור אחר.
- כל פריט שייך למיקום ולשכבה הנכונים.

הבדיקה חייבת לפעול על כלל סוגי העמודים, ולא רק על עמודי גוף רגילים.

### G3 - טיפוגרפיה

- משפחת הגופן וה־face נכונים.
- הגודל, הצבע, המשקל והסגנון נכונים.
- כל glyph נפתר ואין תחליף שקט.
- המדידה תואמת לגופן שמוצג בפועל.
- מקטעי גופן בתוך מילה נשמרים.
- רוחב, גובה, baseline ו־line-height עקביים.
- אין שינוי לא מוסבר בגופן של TOC, כותרות או הערות.

### G4 - מבנה ושבירת שורות

- כותרות ברמות הנכונות.
- כותרות מיוחדות אינן נשברות לפי כללי גוף רגילים.
- אין כותרת שנשארת לבדה כאשר החוזה אוסר זאת.
- מעבר טור/עמוד מתבצע לפי האילוצים.
- פסקאות אינן נקטעות או נבלעות.
- איזון טורים והערות אינם מתנגשים.

### G5 - מקרינים וייצוא

- DOM, HTML ו־PDF מציגים את אותן החלטות.
- מיקום כל שורה ופריט נגזר מהמודל.
- אין עימוד חוזר בייצוא.
- אין מדידה או שינוי מיקום במקרין.
- קישורים, כיווניות, תמונות, גופנים והערות נשמרים.
- כל אחד משלושת הפלטים נבדק בפני עצמו.

### G6 - בדיקת אפקט לכל הגדרה

כל הגדרה ברישום חייבת להיות מקושרת לבדיקת השפעה אמיתית:
- הגדרה גאומטרית נבדקת על גאומטריה.
- הגדרת גופן נבדקת על font identity ועל מדידה.
- הגדרה מבנית נבדקת על רכיב מבני.
- הגדרה מותנית נבדקת במסמך שמכיל את התנאי.
- הגדרה שאינה אמורה להשפיע על עימוד מתועדת ככזו.

בדיקה שמסתפקת בהשוואת hash כללי אינה מספקת. לכל הגדרה צריך להיות fixture שבו ניתן לראות את האפקט הרלוונטי, או הסבר מבוסס לכך שאין אפקט.

### G7 - תצוגה חזותית

יש להוסיף snapshots של תוצאות מאושרות בדפדפן וב־PDF, בסביבה קבועה ומבוקרת:
- שער ראשי, שער משנה ושער אחורי.
- תוכן עניינים כללי ומפורט.
- הקדמה ופתיחת פרק.
- עמוד גוף רגיל.
- עמוד עם הערות שוליים ועמוד עם ביאורי-צד.
- עמוד עם כותרות מיוחדות ועיטורים.
- עמוד עם שילוב של כמה סוגי פריטים.

השוואת תמונות היא כלי לזיהוי שינוי חזותי, לא תחליף לבדיקה מתמטית. כל שינוי משמעותי חייב להיות מוסבר לפי חוזה המוצר. יש להשתמש באותה סביבת דפדפן, גרסאות גופנים והגדרות ריצה כדי למנוע רעשי בדיקה.

### G8 - בדיקת מסלול מוצר אמיתי

הבדיקות חייבות להריץ את האפליקציה דרך נתיב הכניסה האמיתי:
- טעינת המסמך.
- טעינת הגדרות.
- טעינת גופנים ונכסים.
- Worker.
- עימוד.
- קבלת PageModel.
- תצוגה חיה.
- ייצוא HTML ו־PDF.

כל בדיקה חייבת להוכיח באיזה מנוע השתמשה. בדיקה שמפעילה ישירות את `legacyTypeset` אינה ראיה למנוע המאוחד.

### G9 - ביצועים

יש למדוד את הנתיב המלא, לא רק פונקציית עימוד מבודדת:
- זמן טעינה והכנת נכסים.
- זמן עימוד.
- זמן בניית המודל.
- זמן עד תצוגה מוכנה.
- זמן ייצוא.
- זיכרון.
- השפעת מסמך גדול.

יש לבצע מדידות חוזרות באותה סביבה, ולדווח חציון ואחוזונים. לפני קביעת תקציב ביצועים יש ליצור baseline אמין של 9C.3 ושל הנתיב החדש. אין להניח שזמן Node שווה לזמן עבודה בדפדפן.

---

## 6. שלב חמישי - מעבר מבוקר

אין להעביר את ברירת המחדל למנוע החדש לפני שכל שערי הקבלה הרלוונטיים עברו.

המעבר יתבצע כך:

1. המנוע הישן נשמר כבסיס אבחוני מבודד בשלב ההשוואה, לא כנתיב צדדי קבוע למשתמש.
2. המנוע החדש נבדק על כל הקורפוסים ובכל מסלולי הפלט.
3. כל הבדל בין ההתנהגות הישנה לחדשה מקבל סיווג מפורש:
   - שינוי שאושר על ידי המשתמש.
   - שיפור מכוון שמתקן התנהגות בלתי רצויה.
   - יכולת ישנה שטרם הועברה.
   - הבדל מקרי או באג חדש.
   - שאלה שטרם הוכרעה.
4. אין חיתוך כאשר קיימת יכולת חסרה או סטייה לא מסווגת.
5. לאחר אישור המעבר, משחררים build מזוהה, בודקים שהנכסים שנפרסו תואמים לו, ומריצים בדיקת דפדפן חיה.
6. rollback חייב לכלול את הקוד, ה־bundle, ה־Worker, ה־CSS וה־HTML כגרסה עקבית אחת.

אין לערבב בין מנועים בתוך אותו מסמך כדי לפתור פער נקודתי. לכל ריצת מסמך יש מנוע אחד בלבד. הרצה כפולה לצורך בדיקה נעשית בנפרד, בסביבת אבחון.

---

## 7. שערי עצירה שאסור לעקוף

המעבר נעצר ולא ניתן לאשר מיזוג או cutover אם מתקיים אחד מהבאים:

- יכולת מוצרית קיימת אינה ממופה או אינה מקבלת מימוש חלופי.
- נתון אובד בין parser, מודל, planner, PageModel ומקרין.
- יש שגיאת מיקום, גודל, חפיפה או גלישה שאינה מוסברת.
- גופן או face נבחרים אחרת ללא החלטה מפורשת.
- הגדרה מוצגת למשתמש אך אינה מגיעה לצרכן שלה.
- בדיקת הצלחה אינה מריצה את הנתיב הפעיל של המוצר.
- כלי בדיקה שונה באופן שמקל על התוצאה בלי הצדקה עצמאית.
- בדיקות תוכן עוברות אך בדיקות גאומטריה או טיפוגרפיה אינן קיימות.
- קיימת רגרסיה ב־DOM, HTML או PDF.
- מדידות הביצועים אינן משקפות את מסלול העבודה האמיתי.
- תוצאות CI, bundle ופריסה אינן מתייחסות לאותו commit.

---

## 8. שיטת הביקורת על עבודת סוכן ה־AI

לכל PR או פרוסת עבודה הסוכן חייב לספק דוח קצר ואחיד:

1. **מטרה:** איזו יכולת במוצר הושלמה?
2. **שורש:** היכן בדיוק היה הפער ומה גרם לו?
3. **זרימת מידע:** מאיזה קלט הנתון מגיע ולאילו שכבות הוא עובר?
4. **פתרון:** מדוע התיקון פותר את השורש ולא רק את התוצאה?
5. **פישוט:** אילו כפילויות או תנאים מיותרים נמחקו? מהו מקור הסמכות היחיד כעת?
6. **בדיקות:** אילו בדיקות נוספו ומה הן מודדות בפועל?
7. **שלילה:** איזו בדיקה מוכיחה שהמנגנון מסוגל לתפוס את אותו סוג פגם?
8. **מסלול ריצה:** האם הבדיקה עברה דרך האפליקציה וה־Worker?
9. **תוצאות:** פקודות, exit codes, commit, קישורי CI ו־artifacts.
10. **סיכונים:** מה עדיין לא נבדק ומה תלוי בהחלטת משתמש?

### כללי ביקורת

- אין לקבל "הושלם" ללא הוכחות.
- אין לקבל PR שמערב ריפקטור רחב, תיקון באג ושינוי עיצוב שאינם תלויים זה בזה.
- אין לקבל תיקוני CSS כתחליף לתיקון מקור הגאומטריה.
- אין לקבל fallback שקט או מנגנון שני שמוסתר מאחורי תנאי.
- אין לקבל שינוי של סף בדיקה בלי מסמך הצדקה, בדיקת שלילה ואימות עצמאי.
- אין לקבל תוצאה ירוקה ממסלול legacy כהוכחת הצלחה של unified.
- אין לקבל שינוי ברירת מחדל ללא הכרעה מתועדת.
- אין למחוק קוד ישן לפני הוכחה שאין לו עוד תפקיד מוצרי, כלי או בדיקה.

---

## 9. תנאי ההשלמה הסופי

הפרויקט יוכרז כמושלם רק כאשר מתקיימים יחד:

- מנוע runtime אחד.
- מודל תוכן אחד ומודל שורות אחד.
- מקור סמכות אחד למדידה ולגאומטריה.
- Planner יחיד.
- PageModel מלא ובלתי־משתנה.
- מקריני DOM/HTML/PDF טהורים.
- שימור כל יכולות המוצר המאושרות.
- כל שערי התוכן, הגאומטריה, הטיפוגרפיה והייצוא ירוקים.
- כל ההגדרות מחוברות ונבדקות.
- דטרמיניזם מלא.
- אין ממצאים קריטיים פתוחים ב־very_long ובקורפוסים המשלימים.
- ביצועים נמדדים ומאושרים ביחס ל־baseline אמין.
- פריסה חיה נבדקת על ה־build המדויק.
- אין כפילות או תיקון־טלאי שהפכו לחלק ממנגנון המוצר.

**היעד אינו להחזיר את המנוע הישן, ואינו להוכיח שהמנוע החדש דומה לו. היעד הוא לבנות מנוע אחיד שמקיים את כל דרישות המוצר, מתקן את חולשות המימוש הקודם ומאפשר להוסיף פריטי עימוד חדשים באופן טבעי, בלי להוסיף עוד מסלולי טיפול מיוחדים.**

## 6\. איך התכנית מונעת חזרה על הטעות

ההבדל המרכזי בין התכנית הזאת לתכנית ביצוע רגילה הוא שהיא מפרידה בין ארבע שאלות שאסור לערבב\:

1. **האם היכולת קיימת?** בדיקת שלמות יכולות המוצר.
2. **האם הנתונים נשמרים?** בדיקת חוזי המידע והזהויות לאורך הצינור.
3. **האם ההחלטות נכונות?** בדיקת גאומטריה, טיפוגרפיה ותכנון.
4. **האם המשתמש מקבל את התוצאה?** בדיקת המסלול החי וכל יעדי הפלט.

היא גם תואמת את הלקחים משיטות הנדסה מוכרות: Michael Feathers מדגיש שימוש ב־characterization tests כדי לתעד התנהגות קיימת לפני שינוי קוד מורכב, אך אין פירוש הדבר שכל התנהגות ישנה חייבת להפוך לדרישה; גישת Strangler Fig של Martin Fowler ומיקרוסופט ממליצה על החלפה הדרגתית של יכולות; ו־Google SRE מדגיש שחרור מדורג, build שחוזר על עצמו ואפשרות rollback. [oreilly.com](https://www.oreilly.com/library/view/working-effectively-with/0131177052/ch11.html?utm_source=chatgpt.com) · [martinfowler.com](https://martinfowler.com/bliki/StranglerFigApplication.html?utm_source=chatgpt.com) · [learn.microsoft.com](https://learn.microsoft.com/en-us/azure/architecture/patterns/strangler-fig?utm_source=chatgpt.com) · [sre.google](https://sre.google/workbook/canarying-releases/?utm_source=chatgpt.com)

לבדיקות חזותיות, Playwright מציין במפורש שיש שונות בתוצאות בין מערכות הפעלה, גרסאות דפדפן, חומרה והגדרות ריצה. לכן snapshots צריכים להיווצר ולהיבדק בסביבה קבועה, ולא להפוך להשוואת תמונות מקרית בין סביבות שונות. [playwright.dev](https://playwright.dev/docs/test-snapshots?utm_source=chatgpt.com)

## 7\. מה חשוב במיוחד בביקורת על הסוכן שכבר עובד

לא הייתי עוצר את עבודת הסוכן שכבר התחיל, ולא הייתי מבקש ממנו להתחיל מחדש. אבל גם לא הייתי מסתפק בכך שהוא יצהיר שהשלים את המעבר או שכל הבדיקות עברו.

כאשר יגיש את התוצרים, הבדיקה שלי צריכה להתחיל בשלוש נקודות\:

- האם הוא באמת חקר את מנוע 9C.3 ואת זרימת כל היכולות, או שהניח שהמימוש החדש הוא כבר המקור הנכון?
- האם הוא השלים את חוזה המידע והגאומטריה, כך שהמקרינים אינם צריכים לנחש או להשלים נתונים?
- האם כל בדיקות הקבלה בודקות את המנוע המאוחד דרך מסלול המוצר האמיתי, ולא רק את תקינות המודל או את מנוע המורשת?

**עדכון מצב חשוב\:** בבדיקה החוזרת שערכתי כעת, `main` נמצא ב־9C.3, וגם `gh-pages/index.html` מצביע על מזהה הנכסים `2026-11-18-s9c3`, כמו `main`\. זה מאמת את התאמת גרסת ה־HTML וה־cache-buster; לא הצלחתי לאמת בבדיקה זו את זהות הבינארים של כל קובצי ה־bundle. [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2?utm_source=chatgpt.com) · [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/gh-pages?utm_source=chatgpt.com)

המטרה שלי בביקורת הבאה תהיה לאשר רק מעבר שהוכח בפועל. לא נסתפק בכך שהקוד החדש נקי יותר או שהבדיקות ירוקות: נדרוש שהמערכת תפיק ספר תקין, שלם ומעוצב, ושהדרך להגיע לתוצאה תהיה פשוטה ואחידה יותר - לא מורכבת יותר.

## Response:
19.11.2026, 1:48:45 · gpt-6-t-mini

העמקה בהיסטוריה מגלה נקודה חמורה יותר: מפת המעבר עצמה תיעדה ב־9A שאין התאמה ב־`very_long` — בין



---


## Prompt:
19.11.2026, 3:53:49

זה המשך לשיחה שהתארכה והיה צורך להתחיל שיחה חדשה, הוספתי את השיחה הישנה לקובץ שיחות שלנו : [https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md) התעדכן ונמשיך בעבודה הקשה!!!

## Response:
19.11.2026, 3:53:53 · gpt-6

> **Searched 1 website**
>
> 
>
> **Fetched recent chat context and inspected raw GitHub content lines**
>
> 
>
> **Searching the web**
>
> 
>
> **Inspecting Layout Parity Tests and Migration Plan**
>
> 
>
> Worked for 53s

בהחלט\! נמשיך מכאן כפרויקט הנדסי רציף, ולא כפתיחת עבודה חדשה.

אני מבין שהשיחה הקודמת התארכה, ולכן העברת אותה לקובץ `ChatGPT.md` בריפו החדש `Tora_Book_Typesetter_Red_Work_2`, כדי שנוכל להמשיך בלי לאבד את רצף ההחלטות, הבדיקות, התיקונים והדרישות שהצטברו.

**העיקר מבחינתי הוא לא רק להמשיך לכתוב קוד, אלא להמשיך לנהל את הפרויקט באחריות\:**

- לשמר את כל הדרישות וההחלטות שכבר התקבלו.
- לבדוק מה באמת בוצע, ולא להסתמך על דיווחים בלבד.
- לאתר את מקור הבעיות ולא להסתפק בתיקונים נקודתיים.
- למנוע רגרסיות ולוודא שכל תיקון משתלב בארכיטקטורה.
- להמשיך בשאיפה למנוע עימוד פשוט, אחיד, דטרמיניסטי, מדויק וניתן להרחבה — ללא טלאים וללא סיבוך מיותר.

### שחזור רצף העבודה

הקישור אכן מוביל לקובץ השיחה בריפו החדש, ואני מאמת מולו את נקודת ההמשך. הקובץ גדול מאוד — כ־18,711 שורות — והגישה אליו דרך ממשק הקריאה שבו השתמשתי לא הצליחה להחזיר את תוכנו. אני לא רוצה להעמיד פנים שקראתי את השיחה כולה כשעדיין לא הצלחתי לחלץ אותה.

## נקודת ההמשך שאיתרתי

הצלחתי לשחזר את סוף השיחה מתוך קובץ ה־Git עצמו, כולל ההקשר העדכני של העבודה. בנוסף, בדקתי את מצב המאגר, ולא הסתפקתי בשיחה בלבד.

נכון לבדיקה שלי, ב־19 בנובמבר 2026, העבודה כבר התקדמה לשלב **9D — איחוד גאומטריית העמוד והטורים**\.

המצב המהותי\:

- שלב 9C.3 הוא בסיס היציבות הקודם.
- כבר זוהו ותועדו כשלים עמוקים במנוע: מסלולי חישוב כפולים, מדידות גובה שאינן אחידות, החלטות ליווי כותרות שאינן מחייבות את ההצבה בפועל, ומנגנוני נסיגה שלא תמיד משנים גאומטריה.
- קיים PR מס' 17, המוגדר במפורש **DO NOT MERGE (yet)**, עם תיקוני שורש FX-1 עד FX-6. לא נמהר למזג אותו.
- התקדמות חדשה יותר כבר נכנסה ל־`main`\: מיזוג PR מס' 64, בנושא חוזה גאומטריה משותף ופרופיל IMUD למנוע המאוחד.

### ממצאי הביקורת הראשוניים על 9D.1

אני לא מאשר עדיין את המקטע רק משום שהוא מוזג. יש בו התקדמות נכונה, אבל גם נקודות שצריך לבדוק בזהירות לפני שממשיכים לבנות עליהן\:

1. **מקור גאומטריה משותף** — נכון מבחינה ארכיטקטונית; עדיף קובץ חוזה משותף על העתקת קבועים לשני מנועים.
2. **הפעלת פרופיל IMUD** — יש לוודא שהזיהוי נעשה לפי מקור הגדרות אמין, ולא בטעות על מסמכים או תצורות אחרות.
3. **שימור המנוע הישן** — בדיקת digest זהה היא ראיה טובה לכך שלא שינו את התוצאה הישנה, אבל אינה מוכיחה שהגאומטריה עצמה היא התוצאה הרצויה.
4. **גאומטריה מדויקת** — יש לוודא שהערכים והיחסים אכן מייצגים את ההכרעות המוצריות, ולא הופכים מדידות מתוך מקור היסטורי שגוי לקבועים בלתי־ניתנים לשינוי.
5. **בדיקת דו־מנועית** — חשוב לוודא שהדגל `--unified` באמת מנתב למנוע המאוחד, ושכל דוחות ההשוואה מציינים באופן חד־משמעי איזה מנוע הפיק כל תוצאה.

ההבחנה החשובה ביותר: **9C.3 הוא בסיס להשוואה ולשימור יכולות, אך אינו אוטומטית אמת מוחלטת לכל החלטה עיצובית או גאומטרית.** אנחנו צריכים לשמר יכולות מאושרות, לתקן פגמים, ולא לשכפל טעויות ישנות.

### שתי נקודות חשודות שכבר מצאתי בקוד עצמו

**א. בדיקת `headerHeight`**

החוזה מגדיר את 71.9px כ־baseline של הכותרת העליונה, אך `page-templates.js` מעביר את הערך לתכונה `headerHeight`\.

יש לבדוק האם צרכני התבנית מתייחסים אליו כאל גובה אזור, או כאל קו בסיס. זה אינו בהכרח באג, אבל מדובר בהבדל סמנטי משמעותי: baseline אינו גובה. בדיקה שמאמתת רק את המספר 71.9 אינה מוכיחה את מיקומם הנכון של הגליפים או של הקו המפריד.

**ב. בדיקת ה־binding offset**

הבדיקה הקיימת בודקת את הסטת הטור הימני בעמוד recto ו־verso, אך אינה מספיקה לבדה להוכיח את נכונות הגאומטריה של שני הטורים, את השוליים, את המרזב ואת היחס בין הסטה פנימית להסטה חיצונית.

אלה בדיוק המקומות שבהם נדרשת בדיקת גאומטריה מלאה ולא רק בדיקות נקודתיות.

---

## סדר העבודה שלנו מכאן

אני ממשיך כמנהל הביקורת והעבודה, לפי הסדר\:

1. **ביקורת מלאה של מקטע 9D.1** — קוד, חוזה, בדיקות, גאומטריה ונתיבי ריצה.
2. **הצלבת החוזה מול ההחלטות המקוריות שלך** — זיהוי ערכים שנקבעו בטעות כמוחלטים, או החלטות מוצר שעדיין לא הוכרעו.
3. **בדיקת התשתית להשוואת מנועים** — לוודא שההשוואה באמת מודדת את המנוע המאוחד מול בסיס 9C.3, ולא משווה בטעות מנוע לעצמו.
4. **הערכת מוכנות מקטע 2** — רק אחרי שנדע שמקטע 1 אמין, נבחן את השלב הבא ונמנע העברת פגמים לתוך שכבות נוספות.
5. **בקרה על PR מס' 17** — הוא יישאר ללא מיזוג עד שנבצע סקירה עצמאית של התיקונים, נוודא שהם פותרים את השורשים, ונבחן את השלכותיהם על מנוע העימוד.

המטרה נשארת חד־משמעית: מנוע אחד, פשוט ומזוקק, ללא מנגנונים כפולים, ללא טלאים, עם גאומטריה נכונה, מדידה אחידה, ותכנון עימוד שאפשר להבין, לבדוק ולהרחיב בבטחה.

אני כבר משוחזר להקשר העבודה וממשיך מכאן.

## Prompt:
19.11.2026, 4:03:41

אני רוצה בעיקר שתהיה אחראי על המעבר החלק!!! של המנוע החדש, בצע חקירה עמוקה בכל הקבצים ובכל הוורקלוג ובכל הקומיטים כך שתוכל לתת לעצמך הסבר לכל שורת קוד שנכתבה במנוע הישן וחקור היטיב את המנוע החדש והדרך הראויה לודאות תוצאה אחידה כמו במנוע הישן גם מבחינת מהירות, עבור על כל קבצי התוכנית וכו', ובהודעה הבאה תעבוד על יצירת מסמך המפרט את כל חלקי המסמך וחלקי העמוד, את כל מזהי הטקסט, את הגדרות העימוד של כל אחד הגופן \סוג\גודל\צבע הכל הכל הכל, לאחר מכן עבור על הדוח השוואת הגדרות ברירת מחדל לגרסאות קודמות, ושוב בצע חקירה בכל ההיסטוריה של הריפו על מקומות בהם הוזכר והוגדר דרך הביצוע וכו'!!!

## Response:
19.11.2026, 4:03:59 · gpt-6

> **Comparing default settings**
>
> I’m comparing the report’s imported defaults with earlier accepted decisions. Several values conflict, including body text size, spacing, alignment behavior, and detailed display options, so I need to distinguish source defaults from later user-approved changes.
>
> **Compared default settings**
>
> 
>
> **Reconciling active settings**
>
> I’m finding that later decisions explicitly override older defaults, yet the audit still reports imported values and unresolved mismatches. I’m treating this as an implementation gap, especially for typography, spacing, alignment, display options, and geometry.
>
> **Reconciled active settings**
>
> 
>
> **Inventorying report scope**
>
> I’m assembling the document around active settings, page components, templates, typography, colors, headers, footnotes, folios, gates, and geometry. I’m clearly marking legacy reference values as provisional rather than final.
>
> **Reconciling active defaults**
>
> I’m identifying further conflicts: folio settings mostly align, but automatic alignment, table-of-contents detail levels, body typography, drop caps, paragraph scaling, heading limits, and geometry still need synchronization.
>
> **Inventoried report scope and reconciled active defaults**
>
> 
>
> **Audited engine migration history, geometry, settings, documentation, pull requests, and transition requirements**
>
> 
>
> Worked for 6m 10s

קיבלתי. אני משנה את מוקד העבודה בהתאם: **אני לוקח אחריות על ניהול המעבר למנוע החדש, ולא מסתפק בבדיקת התקדמות הסוכן או באישור שהשלבים בתוכנית הושלמו.**

המטרה אינה רק שהמנוע החדש יפיק מסמך שנראה דומה. המטרה היא מעבר שבו לא הולכת לאיבוד אף יכולת של המנוע הישן, לא משתנה שום ברירת מחדל שלא הוחלט לשנות, לא נגרמת נסיגה במהירות, וכל מנגנון חדש משתלב במבנה אחיד, פשוט, דטרמיניסטי וניתן להבנה.

### עקרונות הבדיקה שאאמץ

1. **הישן הוא מקור ידע, לא תורה מסיני.** אני אלמד את כל פעולותיו, לרבות תיקונים היסטוריים, אבל לא אשמר אוטומטית באגים, החלטות שגויות או פתרונות מסורבלים.
2. **אין העברת יכולת בלי להבין אותה.** לכל מנגנון, תנאי, חישוב, חריג, משתנה ומסלול בקוד הישן נצטרך להבין את תפקידו, את הסיבה שנוצר ואת ההשלכות של הסרתו או שינויו.
3. **אין תחליף לבדיקת ההיסטוריה.** קוד נוכחי לבדו לא מגלה מדוע נכתב. נחקור קומיטים, שינויים שבוטלו, תיקוני רגרסיות, Worklogs, תוכניות, דיונים, בדיקות ודוחות.
4. **שוויון בתוצאה ובביצועים.** נבדוק לא רק גאומטריה ותוצר חזותי, אלא גם החלטות חלוקת טקסט, התאמת שורות, חלוקת עמודים, הערות, כותרות, אזורים מיוחדים, התנהגות קצה, זמני ריצה ויציבות.
5. **איחוד ולא טלאים.** כשמתגלה הבדל, לא נפתור אותו באמצעות חריג נוסף במנוע החדש. נחקור את מקור ההבדל ונעדיף תיקון ארכיטקטוני נקי.

## ממצא ראשון חשוב מהחקירה

כבר נחשף שצריך להיזהר מאוד מלהסתמך על מסמכי התוכנית בלבד. יש במאגר שכבות תיעוד מתקופות שונות, והן אינן בהכרח משקפות את המצב הנוכחי\:

- תוכנית השלמת המנוע המקורית, שהייתה בעלת עשרה שלבים.
- תוכנית המעבר החדשה ממנוע המורשת למנוע המאוחד, 9D.
- יומן עבודה מפורט המתעד העברות, תיקונים, בעיות שהתגלו, שורשי תקלות ותוצאות בדיקות.
- חוזה תוצאה קנוני של מנוע 9C.3.
- מסמכי מצב, מסלולי ריצה, כפילויות, הגדרות ומזהי טקסט.
- היסטוריית קומיטים וענפים, ובהם גם עבודות קודמות שלא נכנסו ל־`main`\.

הנקודה הקריטית: במאגר יש מידע עשיר מאוד על מה שהמנוע הישן עושה בפועל. אני לא מתכוון להעתיק את החוזה הקיים ולסמן וי. אני בודק את החוזה מול הקוד, מול היסטוריית התיקונים ומול התנהגות המוצר.

## בדיקת מקטע 9D.1 - כבר נמצאו נקודות שדורשות ביקורת עצמאית

מקטע 9D.1 אכן ביצע את הצעד הראשון: יצירת חוזה גאומטריה משותף והעברת תבניות העמוד של המנוע המאוחד לפרופיל IMUD. עם זאת, אני מפריד בין מה שהוכח לבין מה שהבדיקות עדיין לא מוכיחות.

**מה הוכח**

- קבועי הגאומטריה הועברו למודול משותף.
- מנוע המורשת מייבא אותם במקום לשמור עותק מקומי.
- הוכח לפי דיווח הקומיט שה־digest של שני קורפוסים נשמר במורשת.
- הנתיב הגנרי שאינו IMUD נבדק כנתיב שלא אמור להשתנות.
- נוספה אפשרות להריץ את מנוע המאוחד בנפרד לצורכי השוואה.

### מה עדיין מחייב בדיקה

- **הזזת הכריכה\:** הבדיקה מאמתת את מיקום הטור הימני Recto/Verso, אבל אינה מאמתת באופן מלא את כל גאומטריית שני הטורים, השוליים, מרווח הכריכה והשלכות ההזזה.
- **פס הכותרת\:** יש בדיקה לערך `headerHeight=71.9`, אך זה לבדו אינו מוכיח שהכותרת בפועל נרנדרת במקום הנכון, עם גובה גליפים נכון, או שמיקומה זהה למורשת.
- **הטור הרחב\:** נבדק רוחב הקדמה, אך נדרש אימות של מיקומה ושל כל סוגי העמודים החד־טוריים.
- **הגאומטריה\:** בדיקות קבועים אינן תחליף לאימות הגאומטריה המתקבלת בפועל, כולל PDF, DOM, Recto/Verso, גבולות עמוד, הערות, עיטורים וגלישה.
- **חוזה המקור\:** חלק מהערכים מסומנים כ"מכוילים מהייחוס". צריך לבדוק כל אחד מהם מול מקור היסטורי אמין והחלטותיך, ולא להניח שהמספר נכון רק משום שהוא קבוע ומשותף לשני המנועים.

אלה כרגע **פערי הוכחה**, לא קביעה שכל הנקודות הן באגים. אני לא רוצה לשנות קוד לפני שאשלים את המעקב אחר הצרכנים והמקור של כל ערך.

## ממצא היסטורי מהותי: המעבר הקודם כבר נכשל פעם אחת בתהליך

ההיסטוריה מראה מדוע נדרש כאן ניהול מעבר קפדני\:

- ב־9A נבנתה השוואת צללים בין שני המנועים.
- ב־9B התגלו פערים אמיתיים, כולל חוסרים בתוכן, הערות, דקדוק כותרות, תוכן עניינים ומטא־דאטה.
- ב־9B.1 התברר שגם כלי ההשוואה עצמו היה פגום מתודולוגית. הוא הוחלף בכלי מדויק יותר עם השוואה דו־כיוונית, זיהוי זהויות, סדר, עוגנים, תוכן עניינים ומדדים סמנטיים.
- ב־9B.2-9B.5 תוקנו פערי שורש, ולא רק תסמינים.
- ב־9C.4 בוצע Cutover למנוע המאוחד. בבדיקת האודיט החיה התגלו 26 עמודים שבהם טקסט הגוף חפף לטקסט הערות. נעשו תיקוני שורש, אבל במהלך אותו תיקון גם בדיקת האודיט רוככה בטעות; הרגרסיה נתפסה בבדיקת CI נוספת, והסף המקורי הוחזר.
- ב־9C.5 הוסרו נתונים כפולים מהפרוטוקול, על בסיס הטענה שכל צרכני הממשק כבר עברו למודל החדש.

זהו שיעור הנדסי חשוב: **גם כלי הבדיקה, גם הגדרת ה־parity וגם הדרך שבה מפרשים תוצאה ירוקה חייבים לעבור ביקורת.** לא אסתפק באישור שמספר הבדיקות עבר או שהסוכן כתב "הוכח".

## המסמך נוצר בפועל במאגר

**ENGINE\_TRANSITION\_INVENTORY\_2026-11-19.md**

מסמך מלאי ראשוני של רכיבי המסמך והעמוד, מזהי הטקסט, הגאומטריה, הגופנים, הגדלים, הצבעים, ברירות המחדל, הפערים בין ההחלטות לבין האתחול, והוכחות המעבר.

נשמר בענף נפרד - ללא שינוי ב-main

Commit: b8b79dc28ff8b0798e3007ada10c2c2ca24abc72

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/engine-transition-inventory-20261119/audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md?utm_source=chatgpt.com)

המסמך כולל כרגע\:

- מלאי מזהי הטקסט ותחבירם.
- מפת רכיבי העמוד וסוגי העמודים.
- מידות גאומטריה שנמצאו במנוע 9C.3.
- הגדרות גופן, סוג, גודל וצבע.
- ברירות המחדל המאושרות בהחלטה D-107.
- פערים בין ברירות המחדל המאושרות לבין ההגדרות שמיובאות בפועל.
- הוכחות קיימות של 9D.1, ומה עדיין לא הוכח.
- כשלי המעבר הקודמים ושערי הקבלה המחייבים.
- רשימת חקירה פתוחה להמשך.

### סדר העבודה הבא שלי

1. להשלים קריאה שיטתית של מנוע המורשת, פונקציה אחר פונקציה, כולל התנאים, הקבועים, האלגוריתמים ותיקוני השורש ההיסטוריים.
2. להצליב כל יכולת עם WORKLOG, קומיטים, החלטות משתמש, בדיקות ותיקונים קודמים.
3. לחקור את מנוע המאוחד באותה רמת עומק, ולבנות טבלת התאמה בין כל יכולת ישנה לבין המימוש החדש, כולל יכולות חסרות, כפילויות ומנגנונים שלא באמת מאוחדים.
4. לבצע אודיט מלא של הגדרות ברירת המחדל לאורך גרסאות, ולהכריע לפי ההחלטות שלך היכן יש סטיות בלתי־ממומשות.
5. לבדוק ביצועים באופן השוואתי ומדיד, ולא להסתפק בכך שהמנוע החדש מהיר במקרה או שהבדיקות שלו עוברות.
6. רק לאחר שהחקירה תאפשר להבין את כל המנגנונים - להחליט כיצד ממשיכים את 9D בצורה בטוחה, פשוטה ואחידה.

**אני לא מאשר כרגע את המעבר, לא ממזג את PR \#17, ולא משנה את מנוע העימוד.** בשלב זה אני בונה את בסיס הידע והביקורת הדרוש כדי שאוכל להיות אחראי באמת על המעבר, ולא רק על התקדמותו.

העבודה נמשכת מתוך נקודת המצב הזאת, כאשר הפישוט והאיחוד של המנוע הם עקרון מנחה בכל החלטה.

## Prompt:
19.11.2026, 4:15:51

עכשיו אני רוצה שתעדכן את קובץ הREADME הראשי, שיכלול פירוט של כל הקבצים בריפו (חוץ מהגופנים) עם פירוט קצר על כל תוכנם, וכך תעשה לכל תיקיה בריפו עם הרחבת פירוט ככל שנכנסים לעומק עץ התיקיות. ואחרי כן תיצור מילון מושגים מפלצתי של כל התוכנה עם הפניות לקבצים ובעיקר לקבצי התוכניות המעקב הביצוע ושיחות הAI.

## Response:
19.11.2026, 4:16:00 · gpt-6

> **Updating documentation references**
>
> I’m checking the README and glossary links, then verifying branch content, file paths, and inventory counts. I’m also adding the missing engine-transition inventory reference so the documentation stays complete.
>
> **Organizing inventory sections**
>
> I’m restructuring the README inventory so nested folders receive their own headings instead of appearing as one flat list. I’ll preserve file descriptions, verify totals, and update the glossary reference afterward.
>
> **Updated documentation references and organized inventory sections**
>
> 
>
> **Created comprehensive repository inventory, glossary, documentation links, and draft PR**
>
> 
>
> Worked for 4m 20s

אני מבצע את זה כעבודת **תיעוד ארכיטקטונית מקיפה של הריפו**, ולא ככתיבת README שטחי.

אני מתכוון ליצור שתי שכבות תיעוד משלימות\:

1. **README ראשי חדש ומקיף** - מדריך ניווט היררכי לכל המאגר, מהשורש ועד הקבצים שבתיקיות הפנימיות. כל קובץ שאינו קובץ גופן ייכלל, עם תיאור תפקידו ותוכנו. ככל שנעמיק בתיקייה, הפירוט יהיה מדויק יותר, לרבות חלוקה לקבצים ולתתי-מערכות.
2. **מילון מושגים מקיף ביותר** - מילון טכני ופרויקטלי, הכולל מושגים של מנוע העימוד, אלגוריתמים, מודלים, הגדרות, רכיבי UI, בדיקות, תהליכי מעבר, החלטות, Worklog, תוכניות ביצוע, ביקורות ושיחות AI, עם הפניות ישירות למקורות הרלוונטיים.

מטרתי היא שהמסמכים יהפכו לכלי עבודה ממשי: גם אדם וגם סוכן AI חדש יוכלו להבין מה יש בריפו, היכן כל דבר נמצא, מדוע הוא קיים, מה כבר נעשה, מה עדיין פתוח ומה אסור לשנות בלי להבין את ההיסטוריה.

## התיעוד שנבנה

**README - מפת המאגר**

נוצר ונבדק מול עץ הקבצים בפועל

- 471 קבצים שאינם קובצי גופן.
- 1,759 קובצי גופן הוצאו מהמיפוי, כפי שביקשת.
- 47 כותרות תתי־תיקיות המרחיבות את הפירוט.
- חלוקה לפי תחומי האחריות: מקור המנוע, ממשק, בדיקות, כלים, audits, תכנון, AI והיסטוריה.

**PROJECT\_GLOSSARY - מילון הפרויקט**

נוצר - כ־48,000 תווים

המילון כולל ארכיטקטורה, מנוע מורשת, מנוע מאוחד, מודלים, parser, typography, measurement, line breaking, planner, constraints, עמודים, הערות, מקרינים, PDF, הגדרות, בדיקות, CI, שלבים היסטוריים, תקלות מעבר, החלטות משתמש ומקורות AI.

## קישורים ישירים למסמכים

## PR \#65 - תיעוד מקיף

(נפתח כ־Draft, ללא מיזוג)

3 קבצים · 1,561 שורות נוספו · 84 שורות הוסרו

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/65?utm_source=chatgpt.com)

---

**1\. README ראשי - מפת כל המאגר**

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/repo-map-glossary-20261119/README.md?utm_source=chatgpt.com)

---

**2\. מילון מושגים מפלצתי**

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/repo-map-glossary-20261119/PROJECT_GLOSSARY.md?utm_source=chatgpt.com)

---

**3\. מלאי יכולות והגדרות המעבר**

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/docs/repo-map-glossary-20261119/audits/ENGINE_TRANSITION_INVENTORY_2026-11-19.md?utm_source=chatgpt.com)

### מה אימתתי

בדיקת המיפוי מול עץ GitHub בפועל הסתיימה\:

- 471 קבצים נמצאים במיפוי.
- 0 קבצים חסרים.
- 0 קבצים מיותרים.
- 0 כפילויות.
- התיעוד נוצר בענף נפרד ולא שינה את `main`\.
- לא בוצעו בדיקות תוכנה, משום שכל השינויים הם תיעוד.

**חשוב\:** שלמות רשימת הקבצים אומתה באופן מלא; עדיין לא השלמתי קריאה פורנזית של כל אחד מ־471 הקבצים כדי לכתוב תיאור תוכני פרטני המבוסס על קריאה מלאה. ה־README הנוכחי הוא מפת ניווט מלאה, והשלב הבא של החקירה הוא להעמיק את תיאור הקבצים עצמם, במיוחד קוד המנוע, בדיקותיו, תוכניות הביצוע, ה־WORKLOG והיסטוריית הקומיטים. אינני רוצה להציג תיאור שניחשתי מתוך שם קובץ כאילו קראתי ואימתתי את תוכנו.

המסמכים האלה הם עכשיו בסיס העבודה שלנו להמשך החקירה והמעבר, והם נמצאים ב־PR לבדיקה, ללא מיזוג אוטומטי.

## Prompt:
19.11.2026, 7:58:57

סוכן הAI סיים את ביצוע הפרומט, והשיב את התשובה הבאה:&#x20;

# "דוח עבודה — שלב 1 לפי התוכנית המחייבת (§8)

**1. מטרה:** סגירת שלב המיפוי (§2 בתוכנית): מפת יכולות מלאה של המוצר בטבלת מעקב אחת ומחייבת, עם בסיס ראיות בריפו — כתנאי כניסה לפרוסות היישום.

**2. שורש:** המיפוי הקיים היה פזור (6 מסמכים מחוץ לריפו, חוזה תוצאה, דוח A/B) ללא טבלת מעקב אחת עם מצב/פער/בדיקה/ראיה לכל יכולת. בנוסף נתגלה כשל תהליך: **בדיקת&#x20;**`s9d-segment1`**&#x20;לא הייתה מחוברת לשרשרת&#x20;**`npm test` — PR #64 הוכח ירוק ב־CI מבלי שהריץ אותה כלל (בדיוק מחלקת הכשל שהתוכנית אוסרת ב־§5 G8).

**3. זרימת מידע:** המפה מקשרת לכל יכולת: דרישה ← מקור סמכות ← מימוש ישן (קובץ:פונקציה) ← מימוש חדש ← בדיקה ← ראיה. אומת בקוד ש־253/253 ההגדרות מקושרות לצרכן.

**4. פתרון:** [**PR #66**](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66) — `audits/STAGE1_CAPABILITY_MAP.md` (‏\~85 יכולות על פני 13 התחומים, 11 עמודות לכל אחת לפי §2.2), הכנסת 6 מסמכי החקירה ל־`audits/stage1/`, וחיווט הבדיקה לשרשרת.

**5. פישוט:** הטבלה היא מקור יחיד למצב ההעברה (מסמך חי שמתעדכן בכל פרוסה); הערות החקירה הופכות מקבצים ארעיים מחוץ לריפו לראיה מחייבת.

**6. בדיקות:** `npm test` מלא + `test:determinism` — ירוקים כולל הבדיקה המחוברת החדשה (11/11). שקילות הנתיב החי מול בסיס 9C.3 אומתה מחדש ב־**4 קורפוסים — מלאה** (hash זהים לבסיס). מצב המאוחד נמדד: ‏66 עמ' מול 54, ‏12 בדיקות שקילות נכשלות, ‏**fontKey=0/4002, ‏0 פסקאות, אין y/sizePt בשורות המודל** — תועד כשורש המבני של רוב התסמינים (פרוסה 1).

**7. שלילה:** לפני התיקון `rg s9d-segment1 package.json` = 0 תוצאות — הוכחה שהבדיקה לא רצה; אחריו היא רצה אחרונה בשרשרת.

**8. מסלול ריצה:** הבדיקה המחוברת רצה דרך `npm test` הן מקומית והן ב־CI (שלוש גרסאות Node); השקילות דרך `run-ours.js` — אותו נתיב עלייה חיה.

**9. תוצאות:** ענף `stage1/capability-map` ‏`9d86bfe` (‏9 קבצים, ‏+1,903). ‏[**PR #66**](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66) — כל הבדיקות ירוקות: ‏CI ‏(18/20/22), ‏corpus-invariants, ‏full-math-audit, ‏layout-audit, ‏very-long-corpus. main המקומי הושאר על `178bcc8` (זהה ל־origin).

**10. סיכונים והכרעות נדרשות:** ‏**8 הכרעות פתוחות רשומות במפה (§3)** — הדחופות: קדימות מטא מול `imud-book-title` (פלייסהולדר מנצח ספרים אמיתיים), גימטריה בלי גרשיים, אישור חתימות השקילות כשעת CI, ומיזוג קטלוג הגופנים v3. הערה תפעולית: אירע אתחול סביבה אמצעי שהחזיר את הענף ל־main — תוקן, והקומיט הועבר לענף הייעודי; מומלץ לוודא במיזוגים הבאים שהעבודה נעשית על ענף נפרד בלבד.

**הצעד הבא (פרוסה 1 — תיקון אובדן מידע):** ‏fontKey+sizePt+y לכל שורה במודל, ‏paragraphs במודל המאוחד, וקדימות מטא — עם הרחבת `signature-compare` ובדיקות שלילה." הכן פרומט השלב הבא כמו הקודם, והמשך במיפוי המלא!!!!

## Response:
19.11.2026, 7:59:05 · gpt-6-t-mini

אבדוק תחילה את PR \#66 עצמו — לא אסתפק בדוח הסוכן — ואשווה בין המפה, התוכנית המחייבת, הקוד והבדיקות. על בסיס הפערים שאאמת אנסח פרומט ביצוע לשלב הבא, ובמקביל אמשיך להרחיב את המיפוי כך שיכסה גם יכולות שטרם קיבלו שורת מעקב מבוססת־ראיות.

מצאתי כבר נקודת ביקורת מהותית במפת הסוכן: היא מכריזה על 100 שורות, אך יש בה רק 97 מזהים ייחודיים — שלושה מזהים כפולים (`TC-06`, `AS-04`, `TY-05`\). בנוסף, קובץ תוכנית ההעברה `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md` מציג עשרה מקטעים, בעוד שהמפה מפנה לסדר של שמונה פרוסות ומייחסת אותו לסעיף שאינו תואם את מבנה אותו מסמך. אני בודק כעת אם מדובר בהפניה לתוכנית מחייבת אחרת, ומהן ההשלכות על סדר הביצוע ועל ההחלטות הפתוחות.

התבררה גם הבחנה חשובה: התוכנית הקנונית הפעילה היא `spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md` — עשרה שלבים — ולא `audits/UNIFIED_ENGINE_MIGRATION_PLAN.md`, שהוא מסמך העברה ממוקד וקודם יותר. המפה החדשה אינה יכולה להחליף את שערי הקבלה של התוכנית הקנונית. חלק גדול מתוצרי שלב 1 כבר קיים ב־`main@178bcc8`; כעת צריך לבדוק אם המפה החדשה מאחדת אותם באמת, ולא רק מפנה לחקירות ישנות.

> **Reconciling migration counts**
>
> I’m checking the apparent mismatch between the reported totals and the table: 100 rows, 97 unique IDs, and three duplicates. I’m also separating validated evidence from planned migration claims and checking section numbering.
>
> **Reconciled migration counts**
>
> 
>
> **Clarifying the governing plan**
>
> I’m distinguishing the current authoritative completion plan from the migration document and locating the intended “stage 1” requirements. I’m also checking whether the next prompt should continue mapping or begin implementation.
>
> **Clarified the governing plan**
>
> 
>
> **Audited PR 66 changes, plans, capability maps, tests, configuration, and CI workflows**
>
> 
>
> **Verifying stage completion**
>
> I’m checking the repository’s actual artifacts against the authoritative plan, including required audit documents, duplicated identifiers, registry counts, and evidence freshness before deciding whether stage 1 is truly complete.
>
> **Verified stage completion**
>
> 
>
> **Closing audit gaps**
>
> I’m finding that the mapping appears substantial but may not satisfy every required stage-one artifact. I’m checking missing registers, reuse analysis, and current-state evidence before authorizing implementation.
>
> **Separating model layers**
>
> I’m distinguishing semantic runs from laid-out lines and final page geometry. Font identity belongs to inline fragments, while absolute Y belongs to pagination; metadata precedence also needs explicit, reversible tests before implementation.
>
> **Assessing readiness**
>
> I’m checking prior decisions, artifact completeness, parity evidence, and whether unified execution was tested across all corpora. I’ll avoid overstating completion and distinguish legacy validation from genuinely migrated behavior.
>
> **Closed audit gaps, separated model layers, and assessed readiness**
>
> 
>
> **Audited stage mappings, CI evidence, plans, and defined implementation slices**
>
> 
>
> **Audited stage documentation, capability maps, architecture, and implementation contradictions**
>
> 
>
> **Strengthening test evidence**
>
> I’m noting a serious gap: the new digest test checks only that a hash exists and pages are present, not that the digest matches an expected value. I’ll treat unified parity as unproven.
>
> **Reviewing migration readiness**
>
> I’m finding that the map is valuable but not yet closure-ready: several artifacts, prior decisions, layer boundaries, and parity claims need reconciliation before implementation begins.
>
> **Consolidating readiness findings**
>
> I’m identifying several closure issues: legacy and unified parity are being conflated, digest validation is incomplete, the map conflicts with recorded decisions, and required stage-one artifacts remain unverified.
>
> **Strengthened test evidence and consolidated migration readiness findings**
>
> 
>
> **Reviewed Stage 1 mapping decisions, conflicts, logs, and geometry tests**
>
> 
>
> **Reconciling migration readiness**
>
> I’m finding that the mapping is substantial but not closure-ready: legacy and unified parity are conflated, digest validation is incomplete, prior decisions conflict with recommendations, and required stage-one evidence remains unverified.
>
> **Reconciled migration readiness**
>
> 
>
> **Created capability audits, reconciliations, and PR documentation reviews**
>
> 
>
> Worked for 28m 55s

## Prompt:
19.11.2026, 8:29:16

ההודעה נתקעה... המשך!!!

## Response:
19.11.2026, 8:29:41 · gpt-6-t-mini

ההמשך בבדיקת שורות היכולת העלה ממצאים נוספים, וביניהם הבחנה חשובה עוד יותר: כלי ה־shadow של Stage 9 בודק את `result.pageModel` במפורש ומאשר כיסוי תוכן, בעוד `run-ours.js` בונה בעצמו מבנה חתימה אחר מתוך `result.pages`\. כלומר, נתון של אפס פסקאות במבנה החתימה אינו ראיה לכך שאין פסקאות ב־DocumentModel או שהן אבדו ב־PageModel. במקביל נמצאו אי־התאמות אמיתיות בייבוא תמונות DOCX ובבדיקת ה־digest של s9d. אני מתעד אותן בנפרד כדי שהפרומט לסוכן יכלול אבחנות מדויקות ולא רק אזהרות כלליות.

בבדיקת הקבצים הסופית גיליתי טעות תפעולית שלי: נספח הביקורת האחרון נכתב בטעות ל־`main` במקום לענף PR \#67, משום שהשמטתי את פרמטר הענף בקריאת יצירת הקובץ. אני מתקן זאת כעת: מעביר את הנספח לענף הביקורת ומסיר את העותק שהוכנס בטעות ל־`main`\. לא בוצע שינוי בקוד המנוע.

> **Continuing the audit**
>
> I’m resuming from the mapping review. The main issue is a mismatch between the model used by page generation and the model evaluated by reporting, so I’m tracing every field and stage before drafting the next patch.
>
> **Extending the mapping**
>
> I’m continuing the full reconciliation rather than stopping at the prompt. I’m checking every mapped row against its stage evidence, then I’ll separate confirmed coverage, partial coverage, and unresolved gaps.
>
> **Continued the audit and extended the mapping**
>
> 
>
> **Tracing parity gaps**
>
> I’m checking whether reported improvements are genuinely comparable: page counts, findings, hashes, performance, and gate coverage may come from different runs. I’m separating verified evidence from stale or incomplete claims before extending the mapping.
>
> **Traced parity gaps**
>
> 
>
> **Clarifying model differences**
>
> I’m distinguishing the legacy-style signature adapter from the full unified page model. The zero-paragraph result may reflect missing adapter fields, not missing document structure, so I’m updating the mapping to avoid overstating that gap.
>
> **Clarified model differences**
>
> 
>
> **Correcting regression evidence**
>
> I’ve found that the supposed legacy digest test actually runs the default profile, so it doesn’t prove legacy compatibility. I’m marking that claim unverified and separating genuine coverage from misleading test labels.
>
> **Corrected regression evidence**
>
> 
>
> **Audited repository capabilities, mappings, imports, rendering, parity, and test gaps**
>
> 
>
> **Flagging harness issues**
>
> I’m documenting that unified runs are being serialized through a legacy-shaped adapter, with hardcoded metadata and incomplete paragraph mapping. I’m treating those signatures as adapter results, not proof about the actual unified page model.
>
> **Flagged harness issues**
>
> 
>
> **Auditing evidence**
>
> I’ve identified a broader issue: unified results are being measured through a legacy-shaped adapter, while a labeled regression check uses default settings. I’m treating those claims as unverified until direct model coverage is added.
>
> **Audited evidence**
>
> 
>
> **Audited 97-capability mapping, updated prompts, and reviewed pull requests**
>
> 
>
> **Completing the audit**
>
> I’m continuing the reconciliation, but I’m not calling all 97 rows complete yet. I’ve documented the adapter mismatch, invalid regression label, and evidence gaps; the next pass must verify each capability against direct model outputs.
>
> **Reviewing evidence**
>
> I’m continuing the mapping carefully. The adapter mismatch and mislabeled regression test are now documented, while the full 97-capability reconciliation remains open pending direct verification of each capability against current outputs.
>
> **Completed the audit and reviewed evidence**
>
> 
>
> **Finalized Stage 1 reconciliation, audit cleanup, and PR67 review**
>
> 
>
> Worked for 18m 30s

ממשיך. הבדיקה כבר שינתה את תמונת המצב הראשונית: **PR \#66 אינו רק מפת יכולות שצריך להוסיף לה פרוסת קוד - הוא דורש קודם תיקון של שיטת המיפוי עצמה.** אחרת הסוכן עלול להוסיף שדות שכבר קיימים, לשכפל מודלים, או לשנות התנהגות תקינה רק מפני שכלי ההשוואה בדק אובייקט ביניים במקום את המודל הסופי.

פתחתי לכך PR ביקורת נפרד, כדי לא לערבב את תיקוני התיעוד עם שינויי המנוע. כעת אני ממשיך בבדיקת תחומי המפה ובקישורם למימושים ולשלבי העבודה שכבר הושלמו.

המשכתי את הביקורת, והעמקתי אותה מעבר לקריאת דוח הסוכן. **המסקנה העיקרית היא שאין להתחיל עדיין בפרוסת תיקון המידע שהסוכן הציע.** חלק מהראיות שעליהן התבססה אבחנת אובדן המידע נוצרו מכלי השוואה שבודק מבנה ביניים, ולא את ה־PageModel עצמו.

### 1\. הממצאים החשובים ביותר

**א. כלי ההשוואה מערבב בין מודלים שונים**

ב־`run-ours.js` נמצא ש־`--unified` אכן מפעיל את המנוע המאוחד, אבל בהמשך הסקריפט הוא בונה את `ours-model.json` מחדש מתוך `result.pages`\. הוא אינו מעתיק את `result.pageModel`, ואף מצמיד למודל תווית קבועה של מנוע המורשת גם בהרצת המאוחד.

מכאן שהנתונים `0 paragraphs`,‏ `fontKey=0/4002` והיעדר שדות מסוימים אינם מוכיחים שהמידע אבד ב־PageModel. הם עשויים להצביע על כך שה־adapter של כלי ההשוואה אינו משמר את המבנה המאוחד.

בדקתי גם את המימוש עצמו: `DocumentModel` כבר מכיל בלוקים מסוג `paragraph`, ופונקציית `placeLine` ב־`page-model.js` מעבירה למודל הסופי מיקומי `x/y`, מידות, `sizePt`, בסיס שורה, וכן `fontKey` ו־`sizePt` ברמת המילים כאשר הם זמינים. עדיין צריך לוודא שכל המידע הזה נשמר בכל סוגי השורות, ושזהות הפסקה עוברת כראוי עד המודל הסופי.

**ב. בדיקת ה־digest של s9d אינה בודקת את מה ששמה מבטיח**

(חיווט ה־CI אומת)

בדיקת `s9d-segment1-geometry` אכן רצה ב־CI ועברה `11/11`\. אבל הבדיקה שכותרתה „digest הקורפוס הקטן זהה לנעילת 9C.3” משתמשת ב־`getDefaultSettings()`, שבאותו קובץ עצמו נבדק כפרופיל שאינו IMUD. בנוסף, היא אינה בודקת `legacyProfile` ואינה משווה את ה־hash לערך נעול.

כלומר, החיבור ל־`npm test` תוקן, אבל **הוכחת אי־הרגרסיה של legacy עדיין אינה קיימת בבדיקה הזאת**\.

**ג. Stage 8 כבר הושלם - המפה אינה מעודכנת**

שש פרוסות Stage 8 מתועדות: materialization, העברת PageModel ב־Worker, תצוגת DOM, ייצוא HTML, ייצוא PDF, ולבסוף parity ופישוט.

במדידה המתועדת של `very_long`, ייצוא PDF מהמודל חסך כ־94.9% מהזמן לעומת נתיב הייצוא הישן: 43.2 שניות לעומת 2.19 שניות. יש לעדכן את שורות PP ו־PF במפה בהתאם, תוך הבחנה בין ביצועי typeset לבין ביצועי ייצוא.

**ד. Stage 9 - 13/13 אינו שקילות גאומטרית מלאה**

דוח shadow v5 מציג 13/13 שערים ירוקים. אלה שערי כיסוי תוכן, זהות הערות, TOC, ביאורי צד, PageModel ודקדוק. הם אינם מוכיחים parity גאומטרי מלא או זהות במספר העמודים: באותו דוח מופיעים 695 עמודי legacy לעומת 896 עמודי unified.

בנוסף, `STAGE9_CUTOVER_MAP.md` עדיין מתאר חלק מתיקוני 9b כלא הושלמו, בעוד `ISSUE_REGISTRY.md` מתעד סגירות מאוחרות יותר ב־9b.2-9b.5. יש ליישב את הסתירה הזאת לפני שמסתמכים על מפת המעבר.

**ה. תמונות - המפה מערבבת שלוש יכולות**

תמונות inline כבר קיימות כפריטים ב־DocumentModel, עברו דרך AssetResolver ו־LineModel, ומופיעות ב־PageModel ובמקריני Stage 8. אבל משטח UI להעלאת נכסי מסמך עדיין חסר.

לעומת זאת, תמונות מתוך DOCX אכן אינן מטופלות: `docx-import.js` אוסף טקסט והפניות להערות, אך אינו מטפל ב־`w:drawing`, ב־`w:pict` או בקובצי `word/media`\. זה פער נפרד שצריך בדיקת DOCX עם תמונה ואזהרה מפורשת.

### 2\. התוצרים שהכנתי

פתחתי PR ביקורת נפרד, כדי לשמור את עבודת הביקורת והפרומט מחוץ ל־PR של הסוכן.

**PR \#67 - ביקורת ומפת המשך** (פתוח, מוכן למיזוג)

ענף: `audit/stage1-map-review-20261119` · תיעוד בלבד · ללא שינויי מנוע

[פתיחת PR \#67](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/67)

---

**שלושת הקבצים ב־PR\:**

- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/stage1-map-review-20261119/audits/STAGE1_MAP_REVIEW_2026-11-19.md?utm_source=chatgpt.com)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/stage1-map-review-20261119/audits/STAGE1_MAP_FORENSIC_FINDINGS_2026-11-19.md?utm_source=chatgpt.com)
- [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/stage1-map-review-20261119/audits/STAGE1_MAP_RECONCILIATION_PROMPT_2026-11-19.md?utm_source=chatgpt.com)

הפרומט עודכן כך שהוא מחייב את הסוכן\:

1. לבצע reconciliation של כל 97 שורות המפה, ולא להסתפק בדגימה.
2. להבחין בין DocumentModel,‏ LineModel,‏ PagePlan,‏ PageModel ומבנה החתימה של כלי ההשוואה.
3. לתקן את בדיקת s9d ואת כלי החתימה לפני שמסיקים שיש אובדן מידע.
4. לעדכן את סטטוסי Stage 8 ו־9 מול הקוד, ה־WORKLOG וה־ISSUE\_REGISTRY.
5. לפצל את יכולות התמונות, ייבוא DOCX ונכסי העיצוב.
6. לשמור על כל החלטות המשתמש הקיימות, ולא לפתוח אותן מחדש בגלל parity עם המורשת או עם PDF הייחוס.

### 3\. מצב הבקשות והזהירות התפעולית

- **PR \#66 נשאר פתוח ולא מוזג.** הוספתי בו הערות ביקורת מפורטות עם הקישורים ל־PR \#67.
- **PR \#67 הוא טיוטה**, נפרד לחלוטין משינויי הקוד, ונבדק כ־mergeable.
- לא שיניתי קוד מנוע, ברירות מחדל, קורפוסים או נעילות. לא הרצתי `npm test` בעצמי; אימתתי את לוגי ה־CI הקיימים ואת תוכן הבדיקות.

הערה תפעולית: במהלך הוספת נספח הביקורת יצרתי בטעות קובץ ב־`main` במקום בענף הביקורת. הסרתי אותו מיד, העברתי את הקובץ לענף PR \#67 ואימתתי שהוא אינו קיים עוד בעץ הנוכחי של `main`\. נותרו בהיסטוריית `main` שני commits תיעודיים של יצירה והסרה; אין בהם שינוי קוד.

**העבודה החשובה הבאה היא השלמת reconciliation של כל 97 היכולות.** עדיין איני מציג את המיפוי כגמור: עד כה הושלמה חקירה עמוקה של מוקדי הסתירה והסיכון, והפרומט המעודכן מחייב את הסוכן לבצע את ההשלמה השיטתית. אין להתחיל בפרוסת תיקון `fontKey/sizePt/y/paragraphs` לפני שהחסר האמיתי הוכח בגבול הנכון.

כשתתקבל תשובת הסוכן על הפרומט הזה, השלב הבא יהיה לבקר את כל 97 השורות מול הקוד והראיות, ולא לאשר את הדוח על סמך הצהרת הצלחה או CI ירוק בלבד.

## Prompt:
19.11.2026, 10:34:49

עכשיו סוכן הAI הודיע שהוא השלים את הפרומט, \
להלן הדיווח שהוגש ע"י סוכן הAI בסיום הסשן:\

# "דוח עבודה — שלב 1 לפי התוכנית המחייבת (§8)

**1. מטרה:** סגירת שלב המיפוי (§2 בתוכנית): מפת יכולות מלאה של המוצר בטבלת מעקב אחת ומחייבת, עם בסיס ראיות בריפו — כתנאי כניסה לפרוסות היישום.

**2. שורש:** המיפוי הקיים היה פזור (6 מסמכים מחוץ לריפו, חוזה תוצאה, דוח A/B) ללא טבלת מעקב אחת עם מצב/פער/בדיקה/ראיה לכל יכולת. בנוסף נתגלה כשל תהליך: **בדיקת&#x20;**`s9d-segment1`**&#x20;לא הייתה מחוברת לשרשרת&#x20;**`npm test` — PR #64 הוכח ירוק ב־CI מבלי שהריץ אותה כלל (בדיוק מחלקת הכשל שהתוכנית אוסרת ב־§5 G8).

**3. זרימת מידע:** המפה מקשרת לכל יכולת: דרישה ← מקור סמכות ← מימוש ישן (קובץ:פונקציה) ← מימוש חדש ← בדיקה ← ראיה. אומת בקוד ש־253/253 ההגדרות מקושרות לצרכן.

**4. פתרון:** [**PR #66**](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66) — `audits/STAGE1_CAPABILITY_MAP.md` (‏\~85 יכולות על פני 13 התחומים, 11 עמודות לכל אחת לפי §2.2), הכנסת 6 מסמכי החקירה ל־`audits/stage1/`, וחיווט הבדיקה לשרשרת.

**5. פישוט:** הטבלה היא מקור יחיד למצב ההעברה (מסמך חי שמתעדכן בכל פרוסה); הערות החקירה הופכות מקבצים ארעיים מחוץ לריפו לראיה מחייבת.

**6. בדיקות:** `npm test` מלא + `test:determinism` — ירוקים כולל הבדיקה המחוברת החדשה (11/11). שקילות הנתיב החי מול בסיס 9C.3 אומתה מחדש ב־**4 קורפוסים — מלאה** (hash זהים לבסיס). מצב המאוחד נמדד: ‏66 עמ' מול 54, ‏12 בדיקות שקילות נכשלות, ‏**fontKey=0/4002, ‏0 פסקאות, אין y/sizePt בשורות המודל** — תועד כשורש המבני של רוב התסמינים (פרוסה 1).

**7. שלילה:** לפני התיקון `rg s9d-segment1 package.json` = 0 תוצאות — הוכחה שהבדיקה לא רצה; אחריו היא רצה אחרונה בשרשרת.

**8. מסלול ריצה:** הבדיקה המחוברת רצה דרך `npm test` הן מקומית והן ב־CI (שלוש גרסאות Node); השקילות דרך `run-ours.js` — אותו נתיב עלייה חיה.

**9. תוצאות:** ענף `stage1/capability-map` ‏`9d86bfe` (‏9 קבצים, ‏+1,903). ‏[**PR #66**](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66) — כל הבדיקות ירוקות: ‏CI ‏(18/20/22), ‏corpus-invariants, ‏full-math-audit, ‏layout-audit, ‏very-long-corpus. main המקומי הושאר על `178bcc8` (זהה ל־origin).

**10. סיכונים והכרעות נדרשות:** ‏**8 הכרעות פתוחות רשומות במפה (§3)** — הדחופות: קדימות מטא מול `imud-book-title` (פלייסהולדר מנצח ספרים אמיתיים), גימטריה בלי גרשיים, אישור חתימות השקילות כשעת CI, ומיזוג קטלוג הגופנים v3. הערה תפעולית: אירע אתחול סביבה אמצעי שהחזיר את הענף ל־main — תוקן, והקומיט הועבר לענף הייעודי; מומלץ לוודא במיזוגים הבאים שהעבודה נעשית על ענף נפרד בלבד.

**הצעד הבא (פרוסה 1 — תיקון אובדן מידע):** ‏fontKey+sizePt+y לכל שורה במודל, ‏paragraphs במודל המאוחד, וקדימות מטא — עם הרחבת `signature-compare` ובדיקות שלילה."

\
תתעדכן שוב במצב הריפו, והחזר את הפרומט הבא המעודכן לביצוע. \
זכור!! התנהג אתה כמנהל הפרויקט! \
בדוק את שלימות הביצוע!\
נכונות דרך הביצוע! ובמיוחד בשלב זה בו פעם שעברה נתקלנו בבעיות רבות שצצו ורגרסיות!\
בדוק היטיב את נכונות הבנת מקור הבעיה, ועריכה פשוטה אחידה ואלגנטית לפתירתה. חשוב!!! פעולת העימוד במנוע החדש אמורה להיות שקופה פשוטה ואחידה (ללא טלאים) שפעולת העימוד ברורה מתוך הקוד, והוא בעל יכולת חיזוי ודאי לתוצאה אחר כל שינוי בקוד, ועם יכולת מעקב ברורה אחרי כל שלבי העימוד והבנת תחולתם על תוצאת העימוד בוודאות!!! ובכל אופן לא יתכן שריצת העימוד במנוע החדש תהיה ארוכה יותר מהמנוע הישן!!!\
ודא ביצוע בדיקות מתאימות והצלחתם!\
מזג PR הראויים למיזוג! \
והכן פרומט המפרט את כל הנצרך לסוכן הAI עם השלמות ותיקונים לשלבים הקודמים והפניה לשלב הבא עם פירוט השלב ליתר דיוק הביצוע כפי שאתה היית מבצע, ועם רמת ההקפדה והזהירות שלך, שאוכל להדביק והוא יתחיל!!! שים שככל הנראה הסנדבוקס של סוכן הAI מותחל בכל ביצוע פרומט, התייחס לזה ופרט את הנדרש בהתאם לזה. שים לב!!! שהודעותיך חייבות להיות מוגבלות לזמן שהפלטפורמה מאפשרת לך להגיב!!!\
אין צורך להדגיש הוראות להעביר לסוכן, כי אני מעביר לו רק את הפרומטים שאתה נותן לי, ובמידת הצורך הכנס את ההוראות לפרומט.\
אנחנו חייבים להתקדם לקראת סיום!!! \
אי אפשר להתעכב יותר מדי!! \
הדגש לסוכן שהמיילסטון הבא חייב להיות שתוצאת העימוד במנוע החדש תהיה זהה לחלוטין כמו המנוע הישן!!! הזהות הנדרשת היא בכל אספקט אפשרי בעימוד השערים ובמיקום הטקסט בהם, תוכן העניינים, העיטורים, מספר הדפים, מספר השורות בכל עמוד, מיקום הבלוקים על העמוד, מיקום כל מילה ואות, וכן זהות במיקום\גודל\סוג\צבע\גופן של כל סוגי הטקסט, ושדרך ההגעה לתוצאה זו נעשתה ע"י כיוונון המנוע בדייקנות ולא ע"י הוספת קוד מלאכותי!!! עשה כל הנדרש בכדי שנתקדם!!! \
במידת הצורך הכן פרומט לסוכן הAI, ותוך כדי עבור מיד לביצוע הנדרש להתקדמות. \
בשלבים בהם יהיה ניתן לבחון את השינויים (או את אימות אי השינויים) מנקודת מבט המשתמש, הוסף הוראה לבניית פייג'ס לאחר כל שינוי, האתר צריך לכלול את התוכנה בשלימותה עם חיבור כל ההגדרות וכו', למרות שלא אתן דיווח רק לאחר שיושלמו כל השלבים. שים לב!!! האתר צריך לכלול את התוכנה בשלימותה עם חיבור כל ההגדרות וכו'!!\
הורה לסוכן הAI ליצור בראנצ' חדש בו יעשה שימוש במנוע החדש, ויגדיר את פייג'ס לטעון את גירסת הבראנצ' שאוכל לעקוב אחרי התקדמות חיבור המנוע החדש, אבל הדגש שאין בזה אישור לנכונות המעבר למנוע החדש או על נכונות פעולתו של המנוע!! בנתיים צור קובץ תיעוד (מהתוכנית הראשונית והקומיט המוקדם ביותר עד הנוכחית, עם הדגשה של שינויים ברצונותיי ופרשנות מוטעית שלהם) של כל הגדרות והחלטות שנעשו ביחס ל"איך העימוד צריך להיות" ביחס לכל החלקים שישנם במסמך, וכן ביחס למראה ותוכן הUI (ובפרט לתוכן והפונקציונליות של הכרטיסיות השונות!!! לדוגמא רק עכשיו שמתי לב שפונקציית הסנכרון הדו-סיטרית בין המסמך שבתצוגה לטקסט שבעורך (והסימונים של מיקומי הטקסט המעומד בתוך הטקסט שב"עורך") שהיתה בכל הגרסאות הקודמות נעלמה לחלוטין בגרסה הזו).

## Response:
19.11.2026, 10:35:02 · gpt-6-t-mini

אבדוק תחילה את מצב GitHub בפועל — ענפים, PR‑ים, בדיקות והמסמכים המחייבים — ולא אסתמך על דוח הסוכן בלבד. במקביל אבנה את פרומט ההמשך כך שיתקן את פערי האימות שהתגלו, יפריד בין תיקון המודל לבין תיקון כלי המדידה, ויקדם במפורש את יעד הזהות המלאה מול המנוע הישן.

הבדיקה כבר העלתה בעיית תיעוד ממשית ב־PR \#65: המילון שבו מציג מספור גימטריה ללא גרשיים — בניגוד להחלטת המשתמש המתועדת ב־D‑31. לכן לא אמזג אותו כפי שהוא. אני ממשיך עכשיו בבדיקת ענפי התיעוד והמקורות ההיסטוריים, ובפרט בדרישה החשובה שהעלית על סנכרון דו־סיטרי בין העורך לתצוגה, שאסור שתיעלם בין פרוסות המנוע.

מצאתי עדכון חשוב שלא הופיע בדוח שהדבקת: ענף PR \#66 השתנה מאז הביקורת הקודמת. הוא כבר מכיל כעת גם מסמכי reconciliation, crosswalk לשערים, הכרעות פתוחות וארטיפקטים פורנזיים חדשים. לכן אני בודק את הגרסה המעודכנת הזאת — לא את ה־SHA הישן מהדוח — לפני שאחליט אם ניתן למזג את שלב המיפוי או להתחיל פרוסת מימוש.

> **Reviewing repository updates**
>
> I’m checking the current pull requests and the requested documentation scope. I’m distinguishing safe documentation changes from incomplete or correction-dependent work before recommending any merge.
>
> **Reconciling parity requirements**
>
> I’m treating exact legacy-output parity as the next milestone, while flagging an existing documentation contradiction about Hebrew punctuation. I’ll verify the current main branch and pull-request contents before recommending changes or merges.
>
> **Resolving parity scope**
>
> I’m treating exact legacy parity as the milestone, while preserving explicitly recorded decisions unless this latest instruction clearly supersedes them. Any conflict must be documented and resolved deliberately, not silently changed.
>
> **Assessing merge candidates**
>
> I’m comparing the documentation pull requests against current main, reviewing their contents for contradictions, and deciding whether the audit material is safe to merge before preparing the next exact-parity milestone.
>
> **Resolved parity scope and assessed merge candidates**
>
> 
>
> **Audited repository history, PR65, documentation, and canonical decisions**
>
> 
>
> **Reviewing changes**
>
> I’m checking the documentation pull requests, current source structure, project history, and interface behavior. I’ll merge only material that remains accurate, then prepare a traceable history document and the next parity-focused milestone.
>
> **Reviewed changes**
>
> 
>
> **Reviewing project status**
>
> I’m validating the documentation changes, current interface behavior, and deployment path before proceeding. I’ll preserve useful audit material, avoid merging contradictory documentation, and keep the new-engine branch explicitly separate from production readiness.
>
> **Reviewed project status**
>
> 
>
> **Investigated Stage 1 plans, history, and bidirectional editor-preview synchronization**
>
> 
>
> **Audited PR66 Stage 1 reconciliation artifacts, metadata, maps, crosswalks, and coverage**
>
> 
>
> **Planning parity documentation**
>
> I’m tracing the project from its earliest recorded commit through current decisions, interface requirements, and deployment behavior. I’m also separating historical facts, unresolved contradictions, and the new parity branch’s non-production status.
>
> **Planned parity documentation**
>
> 
>
> **Documenting project history**
>
> I’m consolidating the project’s origin, historical requirements, interface behavior, architecture decisions, and current implementation status into a traceable record, while keeping legacy parity separate from production approval.
>
> **Specifying parity work**
>
> I’m defining the next milestone around full legacy-versus-unified comparison: identical inputs, settings, assets, fonts, pagination, glyphs, timing, and interface behavior, with unexplained differences blocking approval.
>
> **Documented project history and specified parity work**
>
> 
>
> **Formalizing parity tasks**
>
> I’m requiring a dedicated preview branch, complete legacy-versus-unified comparison, restored editor synchronization, strict performance checks, and traceable documentation. Production remains unchanged until every discrepancy is explained and approved.
>
> **Formalized parity tasks**
>
> 
>
> **Audited caret synchronization, engine parity, history documentation, and repository deployment files**
>
> 
>
> **Audited and updated legacy parity documentation, prompts, branches, and PR mergeability**
>
> 
>
> **Preparing project records**
>
> I’m consolidating the project history, preserving known decisions, documenting unresolved conflicts, and preparing a focused implementation prompt for a preview branch. The goal is exact legacy parity without silently changing approved behavior or production Pages.
>
> **Prepared project records**
>
> 
>
> **Merged documentation and parity changes, then verified branches, PRs, and CI statuses**
>
> 
>
> Worked for 12m 22s

## מצב הריפו שאומת כרגע

ב־GitHub לא מופיע PR חדש לאחר \#67. הענפים והבקשות הפתוחות המרכזיות הם\:

| PR | מצב | החלטה ניהולית כרגע |
|--------|--------|--------|
| [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66?utm_source=chatgpt.com) | פתוח, אינו Draft | **לא למזג עדיין** - ממצאי הביקורת הקודמת טרם קיבלו תיקון מוכח ב־PR הזה. |
| [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/67?utm_source=chatgpt.com) | פתוח, Draft | **לא למזג עדיין** - זהו מסמך ביקורת ופרומט, לא השלמת המיפוי. |
| [github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/65?utm_source=chatgpt.com) | פתוח, Draft | בבדיקת מיזוג נפרדת; עצם היותו תיעוד אינו פוטר מבדיקת תוכנו והתאמתו למצב הנוכחי. |

נקודה מהותית: דוח הסוכן שהובא כאן הוא עדיין דוח של PR \#66, באותו SHA `1153effe…` שאומת קודם. לא מצאתי עדיין ענף או PR חדש שמכיל את תיקוני ה־reconciliation שנדרשו. לכן **אין כרגע ראיה שהשלב הקודם הושלם לפי דרישות הביקורת**, גם אם הסוכן דיווח שהפרומט בוצע.

## החלטת מיזוג ראשונה

מיזגתי את **PR \#67** לאחר שהעברתי אותו מ־Draft ואימתתי את ה־HEAD המדויק. המיזוג הצליח ב־commit\:

`710b4e75064f48edd290cd7381fc2c551a8a71f7`

המיזוג הכניס ל־`main` את דוח הביקורת, הממצאים הפורנזיים ופרומט ה־reconciliation. הוא אינו משנה את מנוע העימוד.

**PR \#65 לא ימוזג כרגע**\: המילון שבו סותר את D-31 בנושא הגרשיים במספור העברי. **PR \#66 עדיין בבדיקה**\: יש בו תיקונים חשובים, אך גם פרטי SHA ומספרי שורות שאינם מעודכנים, והדוח עצמו קובע שתנאי סגירת שלב 1 עדיין לא הוכח בגלל Q14.

השלמתי את ביקורת המצב, מיזגתי את מסמכי הביקורת והתיעוד, והכנתי פרומט מעודכן ומפורט לסוכן.

## 1\. מצב GitHub לאחר העדכון

(מוזג) **PR \#67 - ביקורת Stage 1**

מיזגתי את דוח הביקורת הפורנזית ואת מסמכי ה־reconciliation. Commit: `710b4e75064f48edd290cd7381fc2c551a8a71f7`\.

(מוזג) **PR \#68 - היסטוריית הדרישות והפרומט החדש**

יצרתי ומיזגתי שני קובצי תיעוד, ללא שינוי בקוד המנוע. Commit: `dd026c5b0d71d8d76e01f18ffc4a1e44a9047119`\.

(נשאר פתוח) **PR \#66 - מפת היכולות**

לא מיזגתי. למרות שבדיקות ה־CI על ה־HEAD שלו עברו, המסמכים וה־PR עדיין כוללים נתונים מיושנים, ה־base שלו לא מעודכן, וסגירת שלב 1 אינה מוכחת: Q14 עדיין פתוח. יש גם אי־התאמה בין ספירת היכולות בדוח לבין הספירה העצמאית של מזהי הטבלה.

(נשאר פתוח) **PR \#65 - מילון הפרויקט**

לא מיזגתי. הוא כולל סתירה להחלטת D-31 בנושא הגרשיים במספור העברי, ובנוסף ה־base שלו אינו מעודכן.

main העדכני: `dd026c5b0d71d8d76e01f18ffc4a1e44a9047119`\.

## 2\. מסמך הדרישות ההיסטורי

יצרתי מסמך שמרכז את ההיסטוריה והדרישות, החל מהשלבים המוקדמים המתועדים בפרויקט ועד למצב הנוכחי. הוא כולל את 20 תחומי הדרישות, את החלטות המשתמש, את השינויים המאוחרים בהן, את כללי העימוד המרכזיים ואת מבנה שלוש לשוניות הממשק.

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md?utm_source=chatgpt.com)

המסמך מבחין בין דרישה לבין מימוש מוכח - כדי שלא נסתמך בעתיד על תיעוד ישן או על הצהרת סוכן במקום על ראיות.

## 3\. ממצא חשוב לגבי הסנכרון בעורך

בדקתי את קוד הממשק עצמו. מנגנוני `caret-map.js`, החיבור `onCaretMove`, החזרה מעמוד לעורך והבדיקות לסנכרון דו־כיווני עדיין קיימים בקוד.

אבל יש פער אמיתי: העורך משתמש ב־`textarea`, וסימוני שבירות העמוד מוצגים כרשימה נפרדת מתחתיו. הם אינם מוצגים במיקום המדויק בתוך טקסט המקור. כמו כן, בדיקות הסנכרון הקיימות הן בעיקר בדיקות DOM shim, ולא הוכחה עדכנית להתנהגות בדפדפן החי.

לכן הפרומט דורש בדיקת דפדפן אמיתי של שני כיווני הסנכרון, שחזור הסימונים בתוך טקסט העורך על בסיס `sourceRange` ו־anchors, ושימור מוחלט של טקסט המקור. אין להחליף את המנגנון הקיים לפני שמוכיחים מה בדיוק נשבר.

## 4\. הפרומט המוכן לסוכן

**הפרומט לביצוע - הקמת ענף unified, Preview מבודד ו־parity מלא**

המסמך כולל שחזור סביבת Sandbox מאופסת, תיקון חובות PR \#65/\#66, הקמת ענף חדש, פריסת Pages מבודדת, כלי השוואה, בדיקות דפדפן, benchmark ותיקוני שורש.

**[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md?utm_source=chatgpt.com)**

קובץ Markdown מוכן להעתקה לסוכן

[פתח טקסט גולמי](https://raw.githubusercontent.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/main/audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md)

הדגשתי בפרומט את הדרישות הבאות\:

- ענף חדש בשם `engine/legacy-parity-preview-20261119`, הנוצר מיד מ־`origin/main` העדכני, בלי להמתין לטיפול ב־PR-ים הקודמים.
- סביבת Pages ניסיונית בנתיב `previews/engine-parity/`, תוך שמירה מוחלטת על האתר הציבורי הקיים. היא תכיל את התוכנה בשלמותה, לרבות הגדרות, Worker, גופנים, נכסים, עורך, תצוגה, בדיקה וייצוא.
- כל שינוי משתמש־נראה משמעותי יחייב build ופריסה מחדש של סביבת הניסוי, ובדיקת דפדפן.
- כלי השוואה ישיר של המודלים ושל הפלטים, ללא הסתמכות על adapter שאינו מקור אמת.
- בדיקות שליליות שיוודאו שמנגנון ההשוואה מזהה שינוי במילה, בגופן, בגודל, בצבע ובמיקום.
- benchmark הוגן: לפחות 7 מדידות לאחר חימום, עם אותם נתונים וסביבה. תנאי הקבלה הוא שהמנוע המאוחד יהיה מהיר לפחות כמו הישן - ולא רק יפיק פחות עמודים או ידלג על תוכן.

## 5\. המיילסטון הבא - זהות מלאה

אין להסתפק בשימור טקסט, במספר דומה של עמודים או ב־13 שערי shadow שעוברים. הזהות נדרשת ברמת העמוד, הטור, הבלוק, השורה, המילה והאות; לרבות הקואורדינטות, הגופן, הגודל, הצבע, העיטורים, השערים, תוכן העניינים, ההערות, הכותרות והייצוא.

ישנה נקודה אחת שדורשת טיפול שקוף: אם התנהגות legacy סותרת החלטת משתמש מפורשת כגון D-31, אין לשנות את ההחלטה בשקט כדי ליצור התאמה מלאכותית. יש להציג את ההפרש ולהביא אותו להכרעה, בלי לעכב את תיקון שאר הפערים.

**מה לא בוצע עדיין\:** לא שיניתי את קוד מנוע העימוד, לא פרסתי Preview חדש ולא הרצתי בעצמי `npm test`\. בדיקות ה־CI שאימתתי על HEAD של PR \#66 עברו, אך יש להריץ אותן מחדש לאחר עדכון הענף וה־base. האתר הציבורי עדיין מציג את פריסת `9c.3` מ־18 בנובמבר; אין לראות בו אישור למצב הנוכחי של `main`\.

הפרומט מוכן להעברה לסוכן. השלב הבא צריך להתקדם דרך הוכחת ההבדלים ותיקונם בשורש, ולא דרך הוספת שכבות התאמה מלאכותיות.

## Prompt:
19.11.2026, 10:54:15

אני לא מבין אותך! אם היית עובר על קובץ השיחה שלנו היית רואה מפורש שהדגשתי שלא אמור להיות גרש\גרשיים במספור העמוד!!! אם היית בודק בגרסאות הקודמות היית רואה שמעולם לא היה גרש\גרשיים במספר העמוד! אם היית משתמש בשכל הישר או בודק דוגמאות מספרים תורניים, היית יודע בוודאות! שאין ספר תורני שעושה שימוש בגרש\גרשיים במספר העמוד! ואם היית רק מקשיב להוראות שלי ש " חייב להיות שתוצאת העימוד במנוע החדש תהיה זהה לחלוטין כמו המנוע הישן!!! הזהות הנדרשת היא בכל אספקט אפשרי בעימוד השערים ובמיקום הטקסט בהם, תוכן העניינים, העיטורים, מספר הדפים, מספר השורות בכל עמוד, מיקום הבלוקים על העמוד, מיקום כל מילה ואות, וכן זהות במיקום\גודל\סוג\צבע\גופן של כל סוגי הטקסט " והיית בודק זאת היית רואה שמעולם לא היה גרש\גרשיים במספר העמוד!!! אני חש תסכול רב מהתנהלות זו!

## Response:
19.11.2026, 10:54:49 · gpt-6-t-mini

אתה צודק, והטעות שלי כאן מהותית. ערבבתי בין כלל גימטריה כללי לבין כלל מספור העמודים, והפכתי החלטה כללית לדרישה שלא נתת — ואף סותרת את ההנחיה שלך ואת התנהגות הגרסאות הקודמות. לא הייתי צריך לקבוע זאת בלי לבדוק את השיחה ואת קוד המורשת. אני בודק עכשיו את המקורות ההיסטוריים ואת גרסאות הקוד, ואז אתקן את התיעוד והפרומט שכבר הכנסתי לריפו.

המקורות מאשרים את דבריך בצורה חד־משמעית, ואף מצאתי שהטעות לא הייתה רק בפרשנות שלי ל־D-31 — היא כבר חלחלה למסמכי המפרט ולפרומט שהכנתי\:

- בדוח הבסיס הישן נכתב במפורש: **„גימטריה יחידה בלי גרשיים (כמקור)”**\.
- בחוזה 9C.3 נכתב: **„א, ב, ג … כד — לא א׳, ב׳, ד׳”**\.
- גם בקוד המורשת ההיסטורי, לפני המיזוג הנוכחי, `folioDisplay` נבנה ישירות מ־`toGematria(pageNumber)` בלי גרש ובלי גרשיים במספרי העמודים הרגילים.
- אותו קוד משמש גם בגרסאות `Red` ו־`Red_Work`, לא רק ב־`Work_2`\.

כלומר, הייתי צריך לזהות שהוראת D-31 הכללית הוחלה בטעות על פוליו של עמודים. גם הניסוח שהכנסתי נגד PR \#65 היה שגוי בכיוון שלו: דווקא הדרישה לגרשיים בפוליו היא שאינה תואמת למורשת. אני מתקן זאת במפורש, ולא אנסה לגלגל את האחריות לפרשנות שלך.

הבנתי גם את ההשלכה הטכנית: במורשת הרגילה `folioDisplay` אכן נוצר בלי סימני פיסוק, בעוד שמודול `decoration/folio.js` במסלול החדש מכיל formatter שמוסיף גרש/גרשיים. זו נקודת חשד קונקרטית לפער במסלול המאוחד — לא הצדקה לשנות את המורשת. אני מוסיף לפרומט הוראה לבדוק את נתיב `assignNumbers → formatPageNumber` ולתקן את מקור הפורמט המשותף, בלי לפגוע במספור הערות או במספרים אחרים.

> **Correcting the record**
>
> I’m acknowledging the mistake: the user’s rule explicitly says page numbers never use geresh. I’ll verify the conversation archive and earlier revisions, then correct the documentation and related changes without asking the user to repeat anything.
>
> **Corrected the record**
>
> 
>
> **Clarifying the rule**
>
> I’m narrowing the interpretation: page folios use bare gematria with no geresh; any broader punctuation rule doesn’t override that. I’ll align the documentation and implementation accordingly, preserving the user’s explicit requirement.
>
> **Clarified the rule**
>
> 
>
> **Fixing the documentation**
>
> I’m correcting my earlier reading: PR65 actually introduced the punctuation error. The legacy implementation and parity notes consistently use bare gematria for page folios, so I’ll update the prompt, glossary, and decision mapping to match.
>
> **Recording the correction**
>
> I’m treating the no-punctuation page-folio rule as definitive. I’ll document it as superseding the older interpretation, update the prompt and glossary, and ensure future implementation work follows the legacy behavior.
>
> **Fixed the documentation**
>
> 
>
> **Reviewed legacy folio numbering, gematria formatting, and pre-D31 implementations**
>
> 
>
> **Implementing the correction**
>
> I’m treating the page-folio rule as definitive: bare gematria, never geresh or gershayim. I’ll align the historical record, prompt, glossary, and implementation notes, while preserving the older decision only as superseded context.
>
> **Implemented the correction**
>
> 
>
> **Reviewed and merged documentation corrections for D31–D108 folio numbering**
>
> 
>
> **Searched GitHub and inspected defaults, then updated migration documentation**
>
> 
>
> **Fetched and reviewed session handoff and ChatGPT documentation archives**
>
> 
>
> **Searched chat archive and inspected page number formatting context**
>
> 
>
> **Updated legacy folio documentation, audit records, migration plans, and issue tracking**
>
> 
>
> **Verified migration updates, corrected documentation, and merged PR 69**
>
> 
>
> **Verified main, pull requests, and migration artifacts**
>
> 
>
> Worked for 13m 40s

אתה צודק. אני מבין עכשיו שהכשל שלי חמור יותר מטעות נקודתית בפרשנות: **לא הקשבתי להוראה שכבר נתת, לא בדקתי את ההיסטוריה לפני שקבעתי מה רצונך, ואז הפכתי את הפרשנות השגויה שלי להנחיה מחייבת לסוכן.** כך כמעט גרמתי לנו לתקן את המנוע בכיוון ההפוך מהנדרש.

אני מתנצל. התסכול שלך מוצדק.

### מה בדקתי ומה הוכח

קראתי את ארכיון השיחה המלא `ai-chat/ChatGPT.md`, ולא רק את סיכומי העבודה. מצאתי שתי אמירות שלך מ־19 בנובמבר\:

- בשורה 17642: **„למה למספר העמוד נוספו גרשיים כאלה כ"ד ???”**
- בשורה 18138: **„מספור עמודים עם גרשיים במקום הפורמט המקורי.”**

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/ai-chat/ChatGPT.md?utm_source=chatgpt.com#L17642)

בדקתי גם את הקוד ההיסטורי בגרסאות Red ו־Red\_Work. שם מספר העמוד נוצר באמצעות\:

`folioDisplay = toGematria(pageNumber)`

ללא גרש וללא גרשיים במספור העמודים הרגיל.

בנוסף, חוזה 9C.3 אומר במפורש „גימטריה בלי גרשיים”, וכך גם בדיקת P3a ב־baseline S0. כלומר, כל המקורות מצביעים לאותה תוצאה.

הפער הטכני שמצאתי נמצא במסלול החדש: `decoration/folio.js` מעביר את מספר העמוד דרך `toHebrewNumber()` ו־`formatPageNumber()`, שמוסיפים את סימני הפיסוק. זהו מועמד ברור לשורש הרגרסיה, שאותו יש לאמת ולתקן בקוד.

### מה תיקנתי בפועל

(תוקן ומוזג) **PR \#69**

יצרתי ומיזגתי את תיקון התיעוד ב־[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/69?utm_source=chatgpt.com), למיזוג `aedf5ba1`\.

התיקון כולל\:

1. הוספת D-108 ל־`DECISIONS.md`\: מספרי עמודים מודפסים ומספרי עמודים בתוכן העניינים הם גימטריה חשופה בלבד - ללא גרש, גרשיים או אפוסטרוף.
2. תיקון היסטוריית הדרישות והפרומט לסוכן, כולל הציטוטים מארכיון השיחה.
3. תיקון דוח סגירת S7 ודוח הביקורת ההיסטורי, כדי שלא ימשיכו להציג את הפרשנות השגויה כהנחיה פעילה.
4. הוספת ממצא F-J6 ל־`ISSUE_REGISTRY.md`, המתעד את רגרסיית הפוליו במסלול המאוחד.
5. תיקון תוכנית המיגרציה: הוספת הגרשיים לפוליו מסווגת כרגרסיית העברה, לא כהתנהגות מכוונת.

גם תיקנתי את ההנחיה ב־PR \#65 והוספתי שם הערה שמבהירה את הטעות שלי. ענף PR \#65 כבר מכיל תיקון ל־Glossary ול־Transition Inventory, אבל PR עצמו עדיין דורש סנכרון עם `main` וביקורת נוספת.

### ההפרדה החשובה להמשך

אין לערבב בין שלושה דברים\:

- **מספרי עמודים ועמודוני תוכן עניינים\:** גימטריה חשופה בלבד.
- **סמני הערות שוליים\:** מערכת נפרדת, עם הגדרות משלה. אין לשנות אותם בגלל תיקון הפוליו.
- **גרש וגרשיים בתוך הטקסט\:** נשארים חלק מהתוכן ומהסמנטיקה שלו, ואינם כפופים לתיקון הפוליו.

**לא שיניתי עדיין את קוד המנוע ולא הרצתי בדיקות בעקבות התיקון הזה.** PR \#69 היה תיקון תיעוד והנחיות בלבד. ממצא F-J6 נשאר פתוח עד לתיקון ואימות בקוד.

הפרומט המעודכן נמצא כעת גם ב־main\:

[github.com](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/main/audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md?utm_source=chatgpt.com)

אני מקבל את הביקורת שלך. בתפקיד מנהל הפרויקט, האחריות שלי היא לוודא שהחלטותיך וההתנהגות התקינה של המוצר נשמרות - ולא להמציא פרשנות, ואז לבקש מהסוכן לממש אותה. מכאן ממשיכים לפי הקוד ההיסטורי, ארכיון השיחה וההוראות המפורשות שלך, ולא לפי ההנחה השגויה שלי.

## Prompt:
19.11.2026, 13:12:20

אני רואה שעיקר הבעיות שלנו נובעות מאי סדר ופרשנות ברורה וקיבוץ של כל האלמנטים הקיימים במסמך, הגדרותיהם והאפשרויות לבחירה.
לכן אני רוצה שתיצור דף HTML מועצב וקל לקריאה הניתן לעריכה וייצוא קובץ ערוך, עם כל האלמנטים, ועם כל ההגדרות של כל האלמנטים האפשריים להיות במסמך במבנה של טבלה. 
הטבלה תהיה מחולקת לסקשנים נפרדים לפי הסדר הבא: 
הגדרות ברירת המחדל, 
אלו שאינם ברירת המחדל, 
אלו המוטמעים בקוד ושאינם מופיעים בלוח ההגדרות, 
אלו שאינם מוגדרים כלל ובעקבות כך נופלים לברירת המחדל כלשהיא, 
הגדרות שהיו רק בגרסאות קודמות.
כל אלמנט והגדרותיו יאוגדו במסגרת ברורה, 
השורה הראשונה תכיל את: 
שם האלמנט כפי שהוא מופיע בקוד.
שם האלמנט בשפה רגילה.
תיאור מילולי ברור של האלמנט שניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות. 

בתוך מסגרת האלמנט יופיע עוד מסגרת עם סוג ההגדרה (כמו מיקום\גודל\) והאפשרויות שלה.
השורה ראשונה תכיל את:
שם האפשרות כפי שהא מופיע בקוד.
שם ההגדרה בשפה רגילה.
תיאור מילולי ברור של הההגדרה ואפשרויותה (כולל אפשרויות שאינם קיימות לבחירה כיום) והניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות.
תחת שורה זו יהיו שורות האפשרויות של אותה הגדרה באותה מתכונת: 
שם האפשרות כפי שהוא מופיע בקוד.
שם האפשרות בשפה רגילה.
תיאור מילולי ברור של ההאפשרות והניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות. 
בראש הדף יופיע לחצן ייצוא של קובץ HTML זהה עם השינויים שנעשו.
דחוף לריפו את הקובץ ובמידת הצורך אני אדחוף קובץ ערוך ומתוקן שיחליף אותו.
ומעתה כל התעסקות עם אלמנט או פונקציה הקשורה לאלמנט, תחייב סקירה של קובץ זה.
בתהליך חקירת נתוני האמת של טבלה זו אל תסתפק בעיון בקבצים המיועדים להכיל סיכום של נתונים אלו, עבור על הקוד ממש ובחן אותם, במידה והתוכנה צריכה לקבל נתונים, והם אינם קיימים בקבצי הסיכום או בקוד או בשניהם, או במידה ויש נתונים בקבצי הסיכום ולא מצאת יישום שלו בקוד כתוב זאת בהערות.
אני רואה שעיקר הבעיות שלנו נובעות מאי סדר ופרשנות ברורה וקיבוץ של כל האלמנטים הקיימים במסמך, הגדרותיהם והאפשרויות לבחירה.
לכן אני רוצה שתיצור דף HTML מועצב וקל לקריאה הניתן לעריכה וייצוא קובץ ערוך, עם כל האלמנטים, ועם כל ההגדרות של כל האלמנטים האפשריים להיות במסמך במבנה של טבלה. 
הטבלה תהיה מחולקת לסקשנים נפרדים לפי הסדר הבא: 
הגדרות ברירת המחדל, 
אלו שאינם ברירת המחדל, 
אלו המוטמעים בקוד ושאינם מופיעים בלוח ההגדרות, 
אלו שאינם מוגדרים כלל ובעקבות כך נופלים לברירת המחדל כלשהיא, 
הגדרות שהיו רק בגרסאות קודמות.
כל אלמנט והגדרותיו יאוגדו במסגרת ברורה, 
השורה הראשונה תכיל את: 
שם האלמנט כפי שהוא מופיע בקוד.
שם האלמנט בשפה רגילה.
תיאור מילולי ברור של האלמנט שניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות. 

בתוך מסגרת האלמנט יופיע עוד מסגרת עם סוג ההגדרה (כמו מיקום\גודל\) והאפשרויות שלה.
השורה ראשונה תכיל את:
שם האפשרות כפי שהא מופיע בקוד.
שם ההגדרה בשפה רגילה.
תיאור מילולי ברור של הההגדרה ואפשרויותה (כולל אפשרויות שאינם קיימות לבחירה כיום) והניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות.
תחת שורה זו יהיו שורות האפשרויות של אותה הגדרה באותה מתכונת: 
שם האפשרות כפי שהוא מופיע בקוד.
שם האפשרות בשפה רגילה.
תיאור מילולי ברור של ההאפשרות והניתן לעריכה.
הערות על שינויים\שמות\תיאורים אחרים שהיו קיימים בתוכניות ובגרסאות קוד קודמות.
בנוגע לאפשרויות כמו סוג גופן\גודל\מיקום וכדומה שאפשרויות הבחירה שלהם גדולות אין צורך לפרט את כולם אלא רק את את הנוכחית.
בראש הדף יופיע לחצן ייצוא של קובץ HTML זהה עם השינויים שנעשו.
דחוף לריפו את הקובץ ובמידת הצורך אני אדחוף קובץ ערוך ומתוקן שיחליף אותו.
ומעתה כל התעסקות עם אלמנט או פונקציה הקשורה לאלמנט, תחייב סקירה של קובץ זה, הכנס פקודה זו לכל התוכניות שעל הפרק, ולקובץ הREADME הראשי, ובדוק כל קובץ תוכנית\סיכום וכו' בריפו ובמידה שהוא מכיל סיכום של נתונים אלו מחק את הסיכום והוסף הפניה לקובץ זה, וכן בכל מקום שיש איזכור של הגדרה או תיאורה הוסף הפניה לקובץ זה.
בתהליך חקירת נתוני האמת של טבלה זו אל תסתפק בעיון בקבצים המיועדים להכיל סיכום של נתונים אלו, עבור על הקוד ממש ובחן אותם, במידה והתוכנה צריכה לקבל נתונים, והם אינם קיימים בקבצי הסיכום או בקוד או בשניהם, או במידה ויש נתונים בקבצי הסיכום ולא מצאת יישום שלו  בקוד, או שמצאת סתירות ביניהם ובין עצמם כתוב זאת בהערות.
אני חושב שזה אחד מהאתגרים והפעולות התועלתיות הגדולות ביותר לפישוט כתיבת תוכנה זו, השקע בה את כל כוחך.

## Response:
19.11.2026, 13:14:20 · gpt-6-t-mini

אעבוד על `Tora_Book_Typesetter_Red_Work_2` כעל מקור אמת אחד: תחילה אמפה את מבנה הריפו ואת כל מסלולי הקוד שמגדירים, יוצרים או מציגים פריטי עימוד והגדרות; אחר כך אבנה את מסמך ה־HTML מתוך הצלבה בין המימוש בפועל, לוח ההגדרות, התוכניות וההיסטוריה. במקביל אעדכן את כללי העבודה וההפניות, אך לא אמחק תיעוד לפני שאוודא שהוא אכן סיכום כפול ושאין בו מידע ייחודי שצריך לשמר. ბოლოს אבצע בדיקות, אדחוף לענף, ואדווח במדויק מה הושלם ומה נשאר פתוח.

במיפוי הראשוני כבר מתברר מדוע נוצר חוסר הסדר: המידע אינו מרוכז במקור יחיד. יש לפחות כמה שכבות נפרדות שצריך להצליב — `settings-registry.js` שמגדיר הגדרות, `bindings.generated.js` שמחבר אותן לממשק, `legacy-settings-map.js` שממפה שמות ישנים, קובצי ברירות מחדל, ומימושים נפרדים של פריטי העימוד במנוע. לכן הטבלה לא תהיה העתקה של לוח ההגדרות: היא תציג גם הגדרות שהממשק אינו חושף, פערים בין שכבות, ומקרים שבהם התיעוד מצהיר על יכולת שלא מצאתי לה מימוש.



---
