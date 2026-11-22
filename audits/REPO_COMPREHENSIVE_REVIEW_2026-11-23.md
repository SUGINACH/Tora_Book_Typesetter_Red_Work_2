# סקירה עמוקה מקיפה של הריפו — Tora Book Typesetter RED (Work_2)

> **מסמך סקירה היסטורי, ארכיטקטוני ואיכותי** · 23.11.2026 · נכתב על ידי Z.AI (סוכן הביקורת)
> **בסיס הבדיקה:** `main@67ff42b` (22.11.2026) · **ענף העבודה החי:** `engine/legacy-parity-preview-20261119@e2ea575` (איטרציה 004, שערי G1/G2)
> **היקף:** מבנה מלא · כל התוכניות שנכתבו וטיב השלמתן · גישות מנוע העימוד · השוואת המנועים מכל הבחינות · תיעוד היסטורי של הקומיטים · שיחות ה-AI המתועדות · ממצאי איכות והמלצות.

---

## תוכן עניינים

1. [תקציר מנהלים](#1-תקציר-מנהלים)
2. [הריפו במבט-על](#2-הריפו-במבט-על)
3. [ציר הזמן ההיסטורי (02.11–23.11.2026)](#3-ציר-הזמן-ההיסטורי-0211-23112026)
4. [התוכניות שנכתבו לאורך הזמן וטיב השלמתן](#4-התוכניות-שנכתבו-לאורך-הזמן-וטיב-השלמתן)
5. [חקירת גישות מנוע העימוד](#5-חקירת-גישות-מנוע-העימוד)
6. [השוואת המנועים מכל הבחינות](#6-השוואת-המנועים-מכל-הבחינות)
7. [תיעוד היסטורי של הקומיטים](#7-תיעוד-היסטורי-של-הקומיטים)
8. [שיחות ה-AI המתועדות](#8-שיחות-הai-המתועדות)
9. [ממצאי איכות ופערי תיעוד](#9-ממצאי-איכות-ופערי-תיעוד)
10. [מסקנות והמלצות](#10-מסקנות-והמלצות)
11. [נספח א׳ — מתודולוגיית הסקירה](#נספח-א--מתודולוגיית-הסקירה)

---

## 1. תקציר מנהלים

**מהו הפרויקט.** מנוע עימוד תורני RTL בעברית, בנוי מאפס עם אפס תלויות ריצה — פענוח DFA, שבירת שורות Knuth-Plass, תכנון עמודים, הערות שוליים/סיום/צד, עיטורים ושערים, כותרות עליונות, תוכן-עניינים, ממשק מלא ב-Worker, ייצוא HTML עצמאי ו-PDF 1.4 טהור. הריפו `Red_Work_2` הוא הדור השמיני במשפחה של שמונה ריפואים (ראו §2.4), והוא היחיד שפעיל.

**עלילת העל במשפט אחד.** בעשרים ואחד ימים עבר הפרויקט חמישה עידנים: בנייה מהירה (02–03.11, `v25-unified-rc1`) → חיזוק איכותי מבוסס-ראיות (04–12.11, 98/98 פריטי תוכנית, דטרמיניזם נעול) → התוכנית הקנונית למנוע מאוחד (15–18.11, שלבים 1–9b) → **קטובר שנכשל** (9c.4/9c.5, 18–19.11: הוחזר ל-9C.3 לאחר שהתגלה שה-CI בדק מנוע אחר מזה שקיבלו המשתמשים) → מסע parity מדוד (19–23.11, ענף preview עם איטרציות 001–004 והוכחות על PDF אמיתי).

**הממצא המרכזי של סקירה זו.** הארכיטקטורה הקנונית (PageModel כמקור-אמת יחיד + מקרינים טהורים) הושלמה והוכחה בשלבים 2–8, והיא עדיפה על מנוע המורשת בכל מדד ארכיטקטוני וביצועי (ייצוא PDF מ-43.2 שניות ל-2.19 שניות, 94.9% חיסכון); אך **היא עדיין אינה משחזרת את תוצר מנוע המורשת**: 699 עמודים (ישן) מול 715 (חדש, איטרציה 003→004), זהות שורות 1:1 של 19.8% בלבד, ופערים גיאומטריים מדודים שחלקם תוקנו (G1 סוגריים, G2 הקדמה/חלון) וחלקם ממתינים (G3 אות-סימן, G4 הערות-שוליים, G5 מילוי עמודים — הדומיננטי). עד השלמת parity מלאה, מנוע המורשת נשאר נתיב ברירת המחדל החי ב-main, בהתאם לכלל המחייב של הריפו עצמו: לא להסיר מורשת לפני הוכחה מקצה לקצה.

**פערי תיעוד שגילתה הסקירה (§9).** הספריות המרכזיות לא עודכנו אחרי ה-18/19.11: [WORKLOG.md](/WORKLOG.md) נקטע ב-9b.5 (18.11), [DECISIONS.md](/DECISIONS.md) חסר שורות (D-1–D-29, D-89/90, D-102–D-105) ואין לו כלל רישום לעידן האיחוד (13–18.11), ייצואי שיחות ה-Z.AI חיים רק על ענפי-צד ולא ב-main, ותיקיית [audits/OLD_VS_NEW](/audits/OLD_VS_NEW) מכילה קובץ-פסולת יחיד בן בית אחד. המלצות מרוכזות ב-§10.

---

## 2. הריפו במבט-על

### 2.1 זהות ומטרה

`Tora_Book_Typesetter_Red_Work_2` הוא ריפו העבודה הפעיל של ספר-העימוד התורני. [README.md](/README.md) מגדיר: «מנוע עימוד תורני (RTL, עברית) — בנייה מאפס, אפס תלויות ריצה», כשהתוכנית המחייבת היחידה היא [spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md](/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) («תוכנית השלמת המנוע בעשרה שלבים»). העיקרון המנחה: מודל פריטים אחיד, צינור עימוד יחיד, מדידה ושבירה פעם אחת, PageModel יחיד, ומקרינים (DOM/HTML/PDF) שאינם מקבלים החלטות עימוד.

### 2.2 סטטיסטיקה (נמדד בסקירה זו, 23.11.2026)

| מדד | ערך |
|---|---|
| קומיטים ב-main | **303** |
| קומיטים בכל ההפניות (45 ענפים) | **1,001** |
| טווח תאריכים | **02.11.2026 – 22.11.2026** (21 ימי פעילות; 07–08.11 ו-13–14.11 ללא קומיטים) |
| קבצים במעקב | 2,271 |
| נפח עץ-עבודה | ~482MB (מתוכם ~234MB ארטיפקטים של השוואת PDF/HTML ב-[audits](/audits)) |
| קוד מנוע+UI (`red-build/src`) | 121 קבצי JS · **39,579 שורות** (המנוע לבדו: 98 קבצים, ~30,074 שורות) |
| קבצי בדיקה (`red-build/tests`) | 85 קבצי בדיקה |
| pull requests | ~69 (מיזוגי merge ב-main: #1–#32, #46–#49, #64, #66; השאר מוזגו ב-squash) |
| מחברים | 13 זהויות (ראו §7.1) |

### 2.3 מפת התיקיות

```
Red_Work_2/
├── red-build/              # האפליקציה והמנוע
│   ├── src/engine/         # 98 קבצים: parser, typography, measure, model, line, layout, notes, decoration, output, core, assets, audit, import, extensions
│   ├── src/ui/             # app-shell, settings-panel, editor/preview/testing tabs, worker-protocol/client
│   ├── ui/                 # index.html + bundles (engine-worker.bundle.js, app.bundle.js)
│   └── tests/              # unit/integration/layout/e2e/audit/negative-controls/fixtures/artifacts
├── audits/                 # 60+ דוחות ביקורת, תוכניות שלב, baselines, השוואות PDF
├── spec/                   # 11 מסמכי תכנון (בהם התוכנית הקנונית המחייבת)
├── ai-chat/                # 6 קבצי תיעוד שיחות AI (ראו §8)
├── tools/                  # כלי build/אבחון/parity (stage9/, layout-audit, layout-parity)
├── scripts/, scripts-stage5/, archive/debug/   # תחזוקה והיסטוריה (read-only)
├── DECISIONS.md            # רישום החלטות D-30..D-108
├── ISSUE_REGISTRY.md       # 175 שורות / 166 זהויות
├── WORKLOG.md              # 4,051 שורות (02–18.11.2026)
├── CANONICAL_DOCUMENT_MODEL.md / CUTOVER.md / LAYOUT_DEPENDENCY_MAP.md / MIGRATION.md / AGENTS_TRACKING.md / PROVENANCE.md / OPEN_QUESTIONS.md / RELEASE_NOTES.md / OPERATIONS.md / SECURITY.md / ACCESSIBILITY.md
└── .github/workflows/      # CI: בדיקות, corpus-invariants, preview engine-parity
```

### 2.4 משפחת הריפואים (מתוך [audits/RELATED_REPOSITORY_REUSE_AUDIT.md](/audits/RELATED_REPOSITORY_REUSE_AUDIT.md), 15.11)

| ריפו | תפקיד | יחס ל-Red_Work_2 |
|---|---|---|
| **IMUD_TORANI** | המוצר המקורי מדור ראשון | מקור הגופנים, ההגדרות (`default_settings.json`, פרופיל `_layout-profile='imud'`), הנכסים והטקסטים לבדיקה |
| **Tora_Book_Typesetter_Yellow** (V22) | התוכנה המקורית | מקור פרובננס בלבד; חוקי ההנדסה שלה תורגמו לתובנות מתועדות |
| **Tora_Book_Typesetter_Orange** | מנוע היסטורי + קורפוס בדיקה | בסיס המיזוג ההיסטורי (D-01); `orange_very_long_test_text.txt` מיובא לפיקסטורות (R-RC8) |
| **Tora_Book_Typesetter_Gold** (V21) | קו-ייחוס אבחון סיבתי | מנותח ב-[audits/GOLD_V21_GAP_ANALYSIS.md](/audits/GOLD_V21_GAP_ANALYSIS.md) |
| **Tora_Book_Typesetter_Green** (V23) | renderer-bridge, geometry-audit | פרובננס בלבד (R-RC10) |
| **Tora_Book_Typesetter_Red** | RED מקביל (R-series) | מקור 3 שימושים מאושרים (R-RC1 תיקון סוגריים-מרקר, R-RC2, R-RC3) |
| **Tora_Book_Typesetter_Red_Work** | חלוץ מוקדם | מקור תיקון heading-rollback |
| **Tora_Book_Typesetter_React** | מימוש TS+React מלא | אסור למזג; משמש אזכור-חוזה בלבד (R-RC7) |

**שורה תחתונה:** שמונה ריפואים, וכלל מחייב (§1.1-15 בריפו-ביקורת): אין לייבא רכיב שמחייב מסלול עימוד שני, שכבת תאימות קבועה או בעלות כפולה.

---

## 3. ציר הזמן ההיסטורי (02.11–23.11.2026)

> הציר משוחזר מ-[WORKLOG.md](/WORKLOG.md) (02–18.11), מהיסטוריית ה-git שנמדדה בסקירה זו, מדוחות [audits](/audits) ומתיעוד השיחות (§8). כל קומיט מקושר לקישור חי.

### 3.1 עידן א׳ — ההיווצרות (02–03.11.2026): הבנייה מאפס והשלמת S0–S13

**02.11** — הריפו נוצר ([459cd8a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/459cd8a)). הגנזה בוצעה בשיחות **Qwen Coder** (תיעוד: 4 יצואי-qwen ב-[ai-chat](/ai-chat), §8.1) דרך ענפי עבודה אוטומטיים ("task snapshot" — PR [#1](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/1)–[#32](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/32)). ההוראה המכוננת: «כתוב את הגרסא המושלמת… אל תעתיק מהריפאים הקודמים אלא תכתוב הכל מחדש לפי התכנית». התוכניות המייסדות: [spec/01_MASTER_SPECIFICATION.md](/spec/01_MASTER_SPECIFICATION.md) ו-[spec/02_MASTER_WORK_PLAN.md](/spec/02_MASTER_WORK_PLAN.md) (S0–S13, בסיס מיזוג = Orange, החלטה D-01).

באותו יום בוצעה **ביקורת העל הראשונה** — [audits/01_PROGRESS_AUDIT.md](/audits/01_PROGRESS_AUDIT.md) על `main@7d0203b`: 6 ממצאי P0 + 8 P1 (אובדן תוכן אמיתי בהערות-סיום, חשבונאות מילים שבורה, רגרסיית סדר-קריאה, דיכוי ממצאים, "הוכחה" טאוטולוגית) והכרעת-על: «הפרויקט מצוי בשליש הדרך». עוד באותו יום נסגרו כולם: סגירת S7 + back-fills ([48f6a0a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/48f6a0a)), S0 governance (DECISIONS/ISSUE_REGISTRY/WORKLOG/CI/negative-controls), 107 בדיקות ירוקות.

**03.11** — יום-העל של העידן הראשון: S8 עיטורים/שערים ([211d799](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/211d799)), S9 כותרות/פוליו/TOC ([ab9c1a8](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/ab9c1a8)), S10 UI מלא ([9bff136](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/9bff136)), S11 הרחבות/DOCX ([4f5b27c](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/4f5b27c)), S12 ייצוא מושלם + שכבת מדידה מתמטית ([e78d10b](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/e78d10b)), S13 QA/אבטחה/נגישות ([a9538bc](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/a9538bc)) — והתג **`v25-unified-rc1`** עם 305/305 בדיקות ([דוח ההשלמה](/audits/02_S11_S13_COMPLETION_REPORT.md)). עוד באותו יום: שלוש ביקורות חיצוניות יושמו (S4.5–S4.7, [70caa1d](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/70caa1d)/[5722416](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/5722416)), קריסת ספרי-אמת תוקנה ([f048ecf](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/f048ecf), D-83/D-84), ו**ה-DP המת הוחי** — Knuth-Plass היה מת מאז S1 (off-by-one) והוחזר לחיים ב-[6936a85](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/6936a85) (EXT-5, D-79; hash ננעל מחדש `7ccad899`).

### 3.2 עידן ב׳ — חיזוק ואיכות מבוססת-ראיות (04–12.11.2026)

מרתון S4.9–S4.27 (04–05.11): פורט התנהגות המקור (parity 72.2%→88.9%), אינווריאנטים מוחלטים, D-89 (חמישה תסמיני-עין משתמש), D-92 (FIT_EPS=0.75px — 74 שורות חופפות תוקנו ל-0). "בדיקה מפלצתית" S5.x (06.11, 630 בדיקות): שישה סורקים מקבילים, ~40 תיקוני שורש. אחרי יומיים של הפסקה (07–08.11) העלה המשתמש את מסמכי הדרישות: [Software_Requirements_Specification.md](/spec/Software_Requirements_Specification.md) ו-[spec/סיכום בקשות מAI.md](</spec/סיכום בקשות מAI.md>) (09.11). המשך: ייבוא 1,315 משפחות-גופנים (S6.3, 10.11), D-98 (very_long כמסמך בדיקה ראשי), D-100 (11.11) — **ביטול מלא של בדיקת ה-parity לייחוס** והעברת הסמכות לאינווריאנטים C1–C12, סגירת "כל הפערים" S65–S72 (עמוד-תחתית-טורים: 74.7%→0.8% עמודים עם Δ>5px), ו-[audits/IMPLEMENTATION_STATUS.md](/audits/IMPLEMENTATION_STATUS.md) (11.11): **98/98 פריטי תוכנית הושלמו** — נותר רק שער G6 (קבלת משתמש). S73–S77 (12.11) השלימו סדרת תיקוני טיפוגרפיה ו-859 בדידות; נרשמה החלטת המשתמש הכבדה **D-107** (שאלון 12.11: סמנטיקה, ברירות מחדל, תמונות inline, ובראשן — **מטרת P0: פישוט ואיחוד מנוע העימוד**).

### 3.3 עידן ג׳ — התוכנית הקנונית: בניית המנוע המאוחד (15–18.11.2026)

**15.11** — נכתבה [spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md](/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) v1.0: תוכנית עשרת השלבים, «מסמך הביצוע היחיד והמחייב», שהחליפה את כל התוכניות הקודמות. במקביל בוצע **שלב 1** — נעילת מצב-אמת: [audits/ENGINE_CURRENT_STATE.md](/audits/ENGINE_CURRENT_STATE.md), [audits/ENGINE_RUNTIME_PATHS.md](/audits/ENGINE_RUNTIME_PATHS.md), [audits/ENGINE_DUPLICATION_REGISTER.md](/audits/ENGINE_DUPLICATION_REGISTER.md) (רישום D1–D15, §5.3), [audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md](/audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md), [audits/RELATED_REPOSITORY_REUSE_AUDIT.md](/audits/RELATED_REPOSITORY_REUSE_AUDIT.md); baseline 849/849 בדיקות; נמצאי הבסיס F-BL1..F-BL4.

**16–17.11** — הסערה הארכיטקטונית: שלב 2 מודל המסמך הקנוני ([red-build/src/engine/model/](/red-build/src/engine/model), round-trip char-exact על 3.4MB), שלב 3 מדידה מאוחדת, שלב 4 מנוע-שורות יחיד, שלב 5 מתכנן-עמודים יחיד (very_long: 1,335→1,089 עמודים, −18.5%), שלב 6 פריטי-עמוד/הערות/עיטורים כחוזים (סגירת SIDE_NOTE_OVERLAP p.107 בשורש), שלב 7 **PageModel** (`pagemodel-v1`, immutable, 11 אינווריאנטים, geometryHash+contentHash), שלב 8 מקרינים טהורים (DOM/HTML/PDF מהמודל בלבד). אבני-דרך: [1efd7b6](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/1efd7b6) — **full-math PASS ראשון מאז שלב 1**; [14daab7](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/14daab7) תיקון H3 (חוזה CSS משותף לשני המנועים); 1,130 בדידות; פריסות חיות מסונכרנות (?v=2026-11-17-h3fbl).

**18.11** — הכנת הקטובר: **9a** מיפוי נתיבי המורשת ([audits/STAGE9_CUTOVER_MAP.md](/audits/STAGE9_CUTOVER_MAP.md): 4 נקודות דיספטצ׳ D1–D4, יחידות הסרה 9c1–9c5) + כלי [shadow-compare](/tools/stage9/shadow-compare.js); מסקנה מחייבת: «9c (הסרות) חסום עד הכרעת F-9a-1…F-9a-8». **9b.1–9b.5** העבירו את כל תיקוני-השורש לנתיב המאוחד: כלי צללים v5 (13/13 שערים בשני הקורפוסים), D-107 ב-TOC, דקדוק כותרות מלא (H7: 1,147→2,042), הדבקת הערות חוצות-שורות, שער-אחורי. [WORKLOG.md](/WORKLOG.md) מסתיים כאן («עדכון אחרון: 18.11 — 9b.5»).

### 3.4 עידן ד׳ — הקטובר שנכשל וההחזרה (18–19.11.2026)

חמש יחידות ה-9c בוצעו בזו אחר זו: **9c.1** PDF מה-PageModel ([2ad438a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/2ad438a)), **9c.2** HTML מה-PageModel ([a32537a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/a32537a)), **9c.3** DOM כמקרין PageModel ([158055d](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/158055d) + [19507eb](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/19507eb); הפריסה `4992e09` הפכה לבסיס הקנוני **9C.3**), **9c.4** היפוך ברירת-המחדל למנוע המאוחד ([39ae293](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/39ae293) + [b324782](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/b324782) + [9186db4](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/9186db4)) ו-**9c.5** הסרת התוצאות הכפולות ([719236e](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/719236e)).

**ואז התגלה הכשל.** [audits/UNIFIED_ENGINE_MIGRATION_PLAN.md](/audits/UNIFIED_ENGINE_MIGRATION_PLAN.md) (19.11) — הפוסט-מורטם — אבחן שלושה עיוורונות מבניים: (1) **ה-CI בדק מנוע אחר מזה שקיבלו המשתמשים**: `run-ours.js` חובר מחדש ב-9c.4 לקרוא ישירות ל-`legacyTypeset` בזמן שהנתיב החי עבר למנוע המאוחד; (2) בדיקת ה-parity בוטלה ב-D-100 ללא תחליף; (3) אבחון s14 רץ על `renderPage` הישן עם פיקסטורה זהה ל-placeholder. נמצאו פערי העברה מסוג C: טורים בגריד 40% במקום גיאומטריית IMUD (חור-מרכז 134.9px מול מרזב 13.48px), **רגרסיית הגרשיים בפוליו (D-108)** — המשתמש: «למה למספר העמוד נוספו גרשיים כאלה כ״ד ???», פס-כותרת 9pt, fontKey חסר על 100% מהשורות (0/5,059), ועוד. **main הוחזר ל-9C.3** — קומיטי 9c.4/9c.5 אינם אבות-של-main ושרדו רק בענפי-צד ([chore/asset-version-s9c4](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/chore/asset-version-s9c4), [chore/asset-version-s9c5](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/chore/asset-version-s9c5), [stage9c/dead-code](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/stage9c/dead-code)).

**19.11** — יום השיקום השיטתי (הצפוף ביותר בריפו: 199 קומיטים בכל ההפניות): [audits/ENGINE_CONTRACT_9C3.md](/audits/ENGINE_CONTRACT_9C3.md) (החוזה המחייב של תוצר 9C.3), תוכנית ההגירה המדורגת מחדש (10 פרוסות עם הוכחות שקילות מול בסיסי A/B), [audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md](/audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md) (איחוד נורמטיבי של דרישות המשתמש עם ציטוטים מתועדים מהשיחות), [audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md](/audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md) (פרומט הביצוע למיילסטון: **«תוצאת העימוד של המנוע המאוחד תהיה זהה לתוצאת מנוע המורשת החי בכל אספקט הניתן להשוואה»**), מפת היכולות v2.1 (99 שורות, PR [#66](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/66)), שלב 9d מקטע 1 — חוזה גיאומטריה משותף (PR [#64](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/pull/64)), ונוצר ענף העבודה המרכזי של העידן הבא: [engine/legacy-parity-preview-20261119](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/engine/legacy-parity-preview-20261119).

### 3.5 עידן ה׳ — מסע ה-parity המדוד (19–23.11.2026)

ענף ה-parity נבנה כסביבת-ניסוי מבודדת: preview חי נפרס אוטומטית (workflow `preview-engine-parity`) ל-`previews/engine-parity/` ב-gh-pages, `engineProfile` מפורש בסרגל המצב, אין נפילה שקטה למורשת, ואין מיזוג/cutover ללא כל השערים. העבודה מתועדת ב-[audits/PARITY_SESSION_HANDOFF_2026-11-19.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/engine/legacy-parity-preview-20261119/audits/PARITY_SESSION_HANDOFF_2026-11-19.md) ובסדרת [audits/legacy-parity-iteration/](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/engine/legacy-parity-preview-20261119/audits/legacy-parity-iteration):

| איטרציה | תאריך | קומיטים | מה שתוקן | תוצאה מדודה |
|---|---|---|---|---|
| 001 | 21.11 | [78ee6e3](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/78ee6e3) | פסי H3 באמצע העמוד כמו המקור (`span_1cl`) | — |
| 002 | 21.11 | [ff14757](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/ff14757) | סוגריים ב-10pt כמו המקור (`s-paren` ⇒ `paren-style-scale`) | — |
| 003 | 22.11 | [a08732b](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/a08732b) + [2702834](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/2702834) + [567f5bc](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/567f5bc) | שחזור מבנה שערים/TOC/כותרות/פוליו; מילת-חלון; צפיפות גוף; תקציב הערות; משקל גופן שערים | **699→715 עמודים** (מתוך 882); פער הצטברות מתחיל ~p150 |
| 004 | 22–23.11 | [c034b0d](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/c034b0d) → [e2ea575](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/e2ea575) | פתרון סתירות מדדים; הוכחת 5 שורשים על PDF אמיתי; **G1** חברות סוגריים (בוצע+אומת); **G2** סגנון הקדמה+רוחב שורת-חלון+סוגריים אבסולוטי (בוצע+אומת); G3–G5 ממתינים | סוגריים: 0 גליפים בגודל שגוי (מול 1,782); הקדמה 11.5pt/חלון 17.2pt = OLD בדיוק; 90 קבוצות בדידות ירוקות |

במקביל העלה המשתמש את חומרי ההשוואה ל-main: [163dce8](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/163dce8) (20.11), [67534e2](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/67534e2) (21.11 19:55), [eb0dc36](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/eb0dc36) (22.11 19:47) ו-[67ff42b](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/67ff42b) — תיקיית [<u>audits/PDF Export Page Comparison - Old Engine VS New Engine</u>](</audits/PDF Export Page Comparison - Old Engine VS New Engine/>) עם שני ייצואי PDF ישן/חדש, ייצואי HTML ביניים, טקסט-מקור משותף (3.4MB, «מקום בינה», נתנאל דיינובסקי) ודוחות ההשוואה v1/v2/v3 (ראו §6.2).

**מצב חי בעת כתיבת שורות אלה (23.11):** G3 (מיקום אות-סימן במרכז-עמוד), G4 (תזוזת הערות-שוליים ~27pt) ו-G5 (מילוי עמודים — הדומיננטי של +16 העמודים; עקומת drift: NEW חסכנית בתחילה ומצטברת) עדיין פתוחים ומוגדרים כקבוצות העבודה הבאות בתיעוד האיטרציה.
---

## 4. התוכניות שנכתבו לאורך הזמן וטיב השלמתן

### 4.1 מפת כל התוכניות (כרונולוגית)

| # | תוכנית | תאריך | מעמד נוכחי (לפי [spec/README.md](/spec/README.md)) | טיב השלמה — לפי הראיות |
|---|---|---|---|---|
| 1 | [spec/01_MASTER_SPECIFICATION.md](/spec/01_MASTER_SPECIFICATION.md) | 02.11 | מאגר דרישות בלבד (אין הוראות ביצוע) | נוצד והושלם כמסד; 9 חלקים, 17 חוקי-ברזל, ~280 מפתחות הגדרות, ספר-סתירות K-1..K-15 |
| 2 | [spec/02_MASTER_WORK_PLAN.md](/spec/02_MASTER_WORK_PLAN.md) — S0–S13 | 02.11 | היסטורי | **הושלם כמעט מלא**: כל השלבים נסגרו 02–03.11; תג `v25-unified-rc1`; 305/305 בדידות; נותר רק G6 — קבלת משתמש עמוד-עמוד (בבעלות המשתמש) |
| 3 | [MONSTER_24_CHECKLIST.md](/spec/MONSTER_24_CHECKLIST.md) | 05.11 (מקור חיצוני) | ארטיפקט סגירה | **24/24 סגורים** («נעול-בבדידות» / «מנגנון חי+ראיה» / «עובדה היסטורית נעולה») |
| 4 | [Software_Requirements_Specification.md](/spec/Software_Requirements_Specification.md) | הועלה 09.11 | מקור דרישות | 20 קבוצות-סעיף ממופות 100% ב-[IMPLEMENTATION_STATUS](/audits/IMPLEMENTATION_STATUS.md); הפער האמיתי היחיד (SRS-12-2 split-book-title) נסגר ב-S65/D-102 |
| 5 | [spec/סיכום בקשות מAI.md](</spec/סיכום בקשות מAI.md>) | הועלה 09.11 | מקור דרישות (פנקס ציטוטי-משתמש) | 20 נושאים, כולם ממופים ✅ (11.11) |
| 6 | [spec/תכנית לשיפור תוכנת עימוד Red.MD](</spec/תכנית לשיפור תוכנת עימוד Red.MD>) v2.0 | 10.11 | הוחלף | כל האשכולות A–D בוצעו; באשכול E נותר פריט יחיד — בדיקת ספר-דוגמה וקבלת משתמש |
| 7 | [spec/תוכנית הפעלה לחמשת הסוכנים.md](</spec/תוכנית הפעלה לחמשת הסוכנים.md>) | 10.11 | הוחלף (החלוקה החדשה: סעיף 3.1 בתוכנית הקנונית) | **5/5 משימות פתיחה הושלמו** ([AGENTS_TRACKING.md](/AGENTS_TRACKING.md), 17.11) — ראו §4.3 |
| 8 | [spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md](/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) v1.0 | **15.11** | **מסמך הביצוע היחיד והמחייב** | שלבים 1–8 הושלמו (15–17.11); שלב 9 בעיצומו (9a/9b בוצעו; 9c נוסה, נכשל, הוחזר; 9d חוזה-גיאומטריה); שלב 10 פתוח — ראו §4.2 |
| 9 | [spec/03_UNIFIED_ITEM_CONTRACT.md](/spec/03_UNIFIED_ITEM_CONTRACT.md) | 15.11 | חוזה ארכיטקטוני (תוצר שלב 1) | מומש בשלב 2 ([red-build/src/engine/model/](/red-build/src/engine/model)); **Q14 — אישור החוזה על ידי בעל הפרויקט — עדיין פתוח**, והוא החוסם הפורמלי של סגירת שלב 1 |
| 10 | [audits/UNIFIED_ENGINE_MIGRATION_PLAN.md](/audits/UNIFIED_ENGINE_MIGRATION_PLAN.md) | 19.11 | התוכנית המנחה של עידן ה-parity | בביצוע: פרוסות גיאומטריה/גופנים/כותרות/פוליו קודמות בוצעו באיטרציות 001–004; המשך מותנה בשערי parity |
| 11 | [audits/STAGE1_CAPABILITY_MAP.md](/audits/STAGE1_CAPABILITY_MAP.md) v2.1 | 19.11 | טבלת מעקב מחייבת | 99 יכולות / 13 תחומים; reconciliation פורנזי הפריך סגירה מוקדמת של v1 — ראו §4.4 |

### 4.2 תוכנית עשרת השלבים — מצב שלב-לשלב

| שלב | שם | מצב בפועל | ראיות |
|---|---|---|---|
| 1 | נעילת מצב-אמת + חוזה פריטים | **בוצע 15.11** (אך סגירה פורמלית חסומה ב-Q14) | 5 דוחות ביקורת + baseline 849/849; הפרכת סגירת-v1 ב-[STAGE1_MAP_RECONCILIATION_2026-11-19.md](/audits/STAGE1_MAP_RECONCILIATION_2026-11-19.md) |
| 2 | מודל מסמך ופריטים קנוני | **בוצע 16.11** | [CANONICAL_DOCUMENT_MODEL.md](/CANONICAL_DOCUMENT_MODEL.md); round-trip char-exact על 3.4MB |
| 3 | נכסים, סגנונות, מדידה מאוחדת | **בוצע 16.11** | [audits/STAGE3_MEASUREMENT.md](/audits/STAGE3_MEASUREMENT.md); MeasuredItem (advance נפרד מ-inkBounds) |
| 4 | מנוע שורות יחיד | **בוצע 16.11** (מקטע א׳+ב׳) | [red-build/src/engine/line/](/red-build/src/engine/line); `words[]` הוחלף ב-Item stream בנתיב הייצור |
| 5 | מתכנן יחיד | **בוצע 17.11** (פרוסות 1+2) | 4,536/4,536 בלוקים זהים-ביטית ב-very_long; 0 מדידות בתכנון |
| 6 | פריטי-עמוד, הערות, עיטורים, רהיטים | **בוצע 17.11** (פרוסות 1–3) | חוזה עיטורים מלא; הדבקת הערות לעוגנים; סגירת F-BL2 (SIDE_NOTE_OVERLAP p.107) |
| 7 | PageModel יחיד | **בוצע 17.11** | `pagemodel-v1`; very_long: 344,639 בדיקות, 0 הפרות |
| 8 | מקרינים טהורים | **בוצע 17.11** (פרוסות 1–6) | DOM/HTML/PDF מהמודל; PDF ללא typeset שני (43.2s→2.19s, ‎−94.9%); [audits/STAGE8_SLICE6_INVENTORY.md](/audits/STAGE8_SLICE6_INVENTORY.md) |
| 9 | קטובר מלא + הוכחת שקילות + הסרת מורשת | **בעיצומו; הניסיון הראשון נכשל והוחזר** | 9a+9b בוצעו (18.11); 9c.1–9c.3 הופקו ומרכיבים את 9C.3; 9c.4/9c.5 בוטלו; מסע parity חלופי רץ (§3.5) |
| 10 | קבלה סופית + תיעוד + הרחבה | **פתוח** (מותנה ב-9) | מסמכי מסירה (RELEASE_NOTES/MIGRATION/OPERATIONS/SECURITY/ACCESSIBILITY) קיימים מ-S13; מדריכי מפתח-מנוע טרם נכתבו |

### 4.3 תוכנית חמשת הסוכנים וענפיה

התוכנית (10.11) חילקה את העבודה לחמישה סוכנים, שכל אחד קיבל משימת-פתיחה מדידה; כולן הושלמו ותועדו ב-[AGENTS_TRACKING.md](/AGENTS_TRACKING.md):

| סוכן | תפקיד | ענף | משימת הפתיחה ותוצרה |
|---|---|---|---|
| 1 | UI ותפעול | [feature/agent-1-ui-orange](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/feature/agent-1-ui-orange) | [audits/UI_OPERATIONAL_AUDIT.md](/audits/UI_OPERATIONAL_AUDIT.md) |
| 2 | מנוע ואבחון סיבתי | [feature/agent-2-debug-gold](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/feature/agent-2-debug-gold) (+3 ענפי-ספין) | [audits/GOLD_V21_GAP_ANALYSIS.md](/audits/GOLD_V21_GAP_ANALYSIS.md) + U-5 חוזה תוצאה |
| 3 | גופנים וביצועים | [feature/agent-3-font-yellow](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/feature/agent-3-font-yellow) | [audits/perf_baseline/](/audits/perf_baseline) + [PERFORMANCE_BASELINE.md](/audits/PERFORMANCE_BASELINE.md) (צוואר-בקבוק P-1: 92% מהטעינה = 6.9MB אוספי עיטורים) |
| 4 | בדיקות ו-baseline | [feature/agent-4-testing-green](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/feature/agent-4-testing-green) | [audits/baseline_S0](/audits/baseline_S0) — 672 בדידות, HARD 4/4 |
| 5 | תיעוד ושחרור | [feature/agent-5-docs-release](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/feature/agent-5-docs-release) | טבלאות מעקב וסנכרון מסמכים |

החלוקה החדשה (תוכנית קנונית §3.1) הפרידה את התפקידים מחדש — מודל/פאנסר | ליבת מנוע | נכסים/גופנים | בדיקות | אינטגרציה/ארכיטקטורה — והיא זו שרלוונטית מ-15.11 ואילך.

### 4.4 הערכת אמינות ההשלמות — מבט ביקורתי

- **אמינות גבוהה במיוחד** בטענות שננעלו בבדידות/hash: ספירות הבדידות לאורך הזמן (388→672→849→1,130→…→90 קבוצות ב-parity) מגובות בארטיפקטים ב-[audits](/audits) וב-gh-pages; דטרמיניזם ננעל שוב ושוב (`75b8c605`→`7ccad899`→`80f9ed6c`→`fdff19d8`; מורשת `legacy-28f52`).
- **תיקון-יושר מתועד**: גרסה 1 של מפת היכולות הכריזה «~85 שורות, שלב 1 סגור» — הביקורת הפורנזית (19.11) הפריכה את רוב טענות-הראש כארטיפקטים של ה-adapters («0 פסקאות» — בפועל 262 בלוקים; «fontKey=0» — לפי-עיצוב בפרגמנטים) וקבעה: **שלב 1 אינו סגור** (8/9 תנאים; Q14 נותר). זה מודל של תרבות ראיות מתקנת-עצמה.
- **הכרזות שיש לקרוא בזהירות**: (1) [IMPLEMENTATION_STATUS.md](/audits/IMPLEMENTATION_STATUS.md) (98/98, 11.11) מתייחס לתוכניות שקדמו לתוכנית הקנונית בלבד ואינו מכסה את עידן האיחוד; (2) טבלת היכולות ב-[README.md](/README.md) היא «תמונת מצב היסטורית מ-11.11» ואינה מצב עדכני; (3) שלבים 9–10 של התוכנית הקנונית פתוחים מיסודם.
- **לקח הקטובר** (ראו §3.4): הכרזת השלמה ללא בדיקה של המנוע שהמשתמשים באמת מקבלים היא בדיוק הכשל ששבר את 9c.4. מאז, כל טענה בענף ה-parity מחויבת אימות על PDF אמיתי בנתיב האפליקציה.

---

## 5. חקירת גישות מנוע העימוד

### 5.1 הגישה ההיסטורית — מנוע המורשת (IMUD)

[red-build/src/engine/layout/legacy-imud-flow.js](/red-build/src/engine/layout/legacy-imud-flow.js) (3,741 שורות כיום) מוגדר בראשו: «פורט נאמן של מנוע העימוד המקורי (פרופיל IMUD)». שני מקורות אמת: [audits/layout-reference.json](/audits/layout-reference.json) (חילוץ מתמטי מ-PDF הגרסה הישנה) ו-`typesetter.js` של IMUD_TORANI. זו אינה מודול בצינור — **זה מנוע שני שלם**: tokenizer משלו, שובר-שורות חמדן (greedy) עם חלון מילה-ראשונה, flowSection, תקציבי הערות, הערות-צד בפיץ׳ קבוע 9.6px, בוני TOC/שערים/פוליו, חשבונאות תוכן ופורמט result נפרד (`legacyProfile`). הפעלתו נעשית בדיספטצ׳ [red-build/src/engine/core/pipeline.js](/red-build/src/engine/core/pipeline.js) (כיום שורות ~117–120): `if (_layout-profile==='imud' && _imudRaw) return legacyTypeset(...)` — כלומר **בחירת המנוע היא תוצר-לוואי של נוכחות נכס IMUD בטעינה**, לא הגדרת משתמש; לאחר ההחזרה נוסף דגל סביבה `RED_UNIFIED_IMUD=1` ל-CI כדי לבדוק את שני המנועים על קלט זהה.

### 5.2 הגישה הקנונית — המנוע המאוחד (PageModel)

הצינור (מ-[CANONICAL_DOCUMENT_MODEL.md](/CANONICAL_DOCUMENT_MODEL.md)):

```
DocumentModel → MeasuredItem (מדידה אחת) → LineModel (שבירה אחת)
→ Planner → PagePlan → PageModel (pagemodel-v1, immutable)
→ מקרינים טהורים: DOM (pagemodel-dom-renderer) | HTML (html-export) | PDF (pdf-writer)
```

עקרונות הליבה: **החלטה אחת לכל עובד** — מדידה ושבירה פעם אחת; פריט (Item) עם זהות דטרמיניסטית (`id` מ-`sha256` של מקור+סוג+מיקום, ללא `Date.now`/`Math.random`); מילה רב-גופנית ניתנת לייצוג (runs פר-גופן) — דבר שהמודל הישן לא ידע; הערה מקושרת מבנית (noteRef⇄markerRef) במקום 6+ אתרי-פענוח-חוזרים של placeholder PUA; תמונה היא פריט-זרם אמיתי; מנגנון הרחבה יחיד ([red-build/src/engine/model/registry.js](/red-build/src/engine/model/registry.js)) — סוג חדש אסור שיצור ענף pipeline/breaker/planner/projector חדש. אחרי בניית ה-PageModel מוצהר חוזה-גבול (§22 ב[core/page-model.js](/red-build/src/engine/core/page-model.js)): **אף מקרן לא רשאי להזיז פריט, למדוד מילה, לשבור שורה, לחשב תקציב, לאזן או לקבוע סדר קריאה**.

### 5.3 רישום הכפילויות שגילה שלב 1 (D1–D15)

[audits/ENGINE_DUPLICATION_REGISTER.md](/audits/ENGINE_DUPLICATION_REGISTER.md) תיעד 15 כפילויות חישוב פעילות ו-11 מודלים מתחרים, בהן: **D1** טבלאות פקטור-רוחב גופן ×4 עם ערכים סותרים (David 1.00 מול 1.04); **D2** מדידת מילה פעמיים בכל שורה + CSS-דפדפן כמנוע-רוחב שלישי; **D3** נוסחת יישור ×4; **D6** צבירת גובה-טור ×6; **D9** משפחת אפסילון 0.75px בשלושה מקומות מול 0.5px במתכנן; **D13** שלוש הפעלות MeasureAPI שחייבות להסכים (חי / ייצוא-מחדש / הקרנה) — שורש הסחיפה ההיסטורית EXT-13; **D14** תקדימים-חיוביים לשימור; וסיכום: 2 מסלולי ריצה, 2 שוברי-שורות, 2 מקריני CP5, 4 מקורות רוחב-מילה, 2 פורמטי `pages[]`. אותו קלט (very_long) הפיק **שלושה תוצרים שונים**: מורשת-Node 695 עמודים, מורשת-דפדפן 699, DP 1,335.

### 5.4 מפגש הגישות — נקודת הפיצול וההחלטה

הבעיה שהתוכנית הקנונית נועדה לפתור נוסחה ב[spec/03_UNIFIED_ITEM_CONTRACT.md](/spec/03_UNIFIED_ITEM_CONTRACT.md) §9: «שני מנועים חיים במקביל — הפיצול `pipeline.js:123-126` (מורשת=ברירת מחדל)». שתי הגישות לא התחרו על «איזה יפה יותר» אלא על **מקור הסמכות**: המורשת מקודדת את התנהגות המוצר המקורי (ולכן היא ה-spec), המאוחד מקודד ארכיטקטורה נקייה (ולכן הוא הכלי). ההכרעה המסומנת בריפו: **המנוע המאוחד חייב להשתוות למורשת לפני שהמורשת תימחק** (אינווריאנט 10 בחוזה; איסור מחיקה מוקדמת ב-[spec/README.md](/spec/README.md) §4). הקטובר הכפול (ראו §6) הוכיח שקיצור-דרך בהכרעה הזו נכשל; מסע ה-parity הוא הביצוע המדוד שלה.
---

## 6. השוואת המנועים מכל הבחינות

### 6.1 טבלת-אם: מנוע מורשת מול מנוע מאוחד

| בחינה | מנוע המורשת (legacy IMUD) | המנוע המאוחד (PageModel) | הכרעת הסקירה |
|---|---|---|---|
| **מעמד ב-main** | **נתיב ברירת-המחדל החי** (דיספטצ׳ pipeline.js:117–120; `preview-tab` ברירת מחדל `profile='legacy'`) | נתיב ניסיוני בענף parity; ב-main זמין דרך דגל סביבה | מכוון: מורשת = ה-spec; מאוחד = הארכיטקטורה |
| **ארכיטקטורה** | מונוליט יחיד (3,741 שורות) — tokenizer+שבירה+תכנון+הערות+עיטורים+פוליו כולם פנימיים | מודל-שכבות: 98 קבצים, model→measure→line→layout→core→output, חוזים כתובים | מאוחד עדיף מבחינת ארכיטקטורה באופן חד-משמעי |
| **שבירת שורות** | חמדן (greedy) + חלון מילה-ראשונה + FIT_EPS | Knuth-Plass (DP) על Item stream; המורשת מייבאת את קיצורי ההזדמנויות מ-[line/breaks.js](/red-build/src/engine/line/breaks.js) (SSOT) | SSOT מוכח בפועל |
| **מדידה** | בפני-עצמו; פקטורים כפולים (D1) | MeasuredItem אחת (advance ≠ inkBounds), מטמון מלא-מפתח, נכסים בזהויות `ast-<sha>` | סגירת EXT-13 (סחיפת חי↔ייצוא 2–17%) |
| **תכנון עמודים** | flowSection ידני | PagePlan/ColumnModel חוזיים + מטריצת-אילוצים + decision-trace | עקיבות-סיבתית ניתנת לביקורת |
| **ייצוא PDF** | **typeset שני מלא** (export-api מריץ עימוד נוסף עם font-metrics בכפייה) | מה-PageModel בלבד (`exportPdfFromModel`, 0 עימוד-חוזר) | **very_long: 43.24s → 2.19s (‎−94.9%)**; parity מילים 359,584=359,584 |
| **מקרינים** | 4 מימושים (renderPage, renderLegacyPage, legacy-projector 784 ש׳, geometry-projector 878 ש׳) | 3 מקרינים טהורים + materialize יחיד ([core/materialize.js](/red-build/src/engine/core/materialize.js)); geometry-projector צומצם ל-facade בן 68 ש׳ | הכפלת הגיאומטריה חוסלה |
| **דטרמיניזם** | נעול (`legacy-28f52`; `legacy-28f526e1c9caf52a` ל-very_long) | נעול (`80f9ed6c`→`f6f32c40`→`fdff19d8`; parity-branch: PDF md5 זהה בין שני נתיבים) | שניהם דטרמיניסטיים — ה-parity הוא המבחן הפתוח |
| **זהות תוצר (very_long)** | 695–699 עמודים | 882 (לפני איטרציות) → 715 (איטרציה 003/004) | פער +16 עמודים = פער ההשוואה הפעיל (RC-5) |
| **מספר הרצות עימוד לספר** | 2 (חי + ייצוא) | 1 | חיסכון ארכיטקטוני מוכח |
| **זיכרון** | נמדד ב-baselines; פגיע מהעימוד הכפול | PageModel 61.2MB על very_long (נמדד) | שקיל בערך; הכפלת העבודה נחסכה |
| **בדיקות** | מכוסה בסוויטות המשותפות + legacy locks | 90 קבוצות ירוקות בענף parity (אחרי G2) | תשתית הבדיקה מכסה את שני המנועים |
| **הרחבה** | קשה (מונוליט) | registry אחד; «סוג חדש = descriptor אחד» | מנצח מבחינת יכולת-תחזוקה |

### 6.2 מבחן ה-PDF — ההשוואה המציאותית בין התוצרים

מקור הנתונים: [<u>audits/PDF Export Page Comparison - Old Engine VS New Engine</u>](</audits/PDF Export Page Comparison - Old Engine VS New Engine/>) (הועלה 20–22.11) — ייצואי PDF של אותו מקור («מקום בינה», 3.4MB) מהמורשת (הייחוס: **«העימוד במנוע הישן הוא העימוד הרצוי»**) ומהמנוע המאוחד, ועליהם דוחות v1/v2/v3.

**מגמת ההתכנסות (מדודה):**

| מדד | OLD (מורשת) | NEW — ייצוא ראשון (20–21.11) | NEW — איטרציה 003→004 (22.11 19:47) | יעד |
|---|---|---|---|---|
| עמודים | 699 | 882 | **715** | 699 |
| ספאנים | 317,620 | — | 319,103 | ≈ |
| ציורים וקטוריים | 907 | — | 1,816 | ≈ |
| גופנים מוטמעים | 12 | 8 | 12 (משפחות זהות) | ≈ |
| גליפי סוגריים בגודל שגוי | 0 | 1,782 ב-12pt | **0** (G1, 23.11) | 0 |
| גוף הקדמה | 11.5pt | 12pt | **11.5pt + חלון 17.2pt** (G2, 23.11) | OLD |
| מילת-חלון | 254 שורות | 0 (אבדה כליל) | שוחזרה באיטרציה 003 | OLD |

**ממצאי דוח v3 (22.11) — שש שאלות המשתמש נענו במדידה:** מרווח-חלון 18.3pt מול 2.5pt; הערות-צד בשני צידי העמוד מול צד-אחד-פר-עמוד שנגרר לקצה; **התנגשויות bbox: 11 זוגות (ישן) מול 668 ב-121 עמודים (חדש; דומיננט: פסי H3 חוצי-טור — 410)**; 184 עיטורי «רומח» בתוך הגוף מול 0; גדלים/גופנים תואמים להגדרות פרט ל-4 אי-שוויונות מיפוי; והסבר מדוע הדוח הקודם לא גילה — בייצוא 21.11 התכונות כלל לא היו קיימות. שורשי ההמשך (מתוך [iteration-004/AUDIT.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/engine/legacy-parity-preview-20261119/audits/legacy-parity-iteration/iteration-004/AUDIT.md)): RC-3 אות-סימן בשוליים במקום מרכז-עמוד; RC-4 הערות-שוליים ~27pt החוצה; RC-5 מילוי עמודים (חציון 726.5 מול 767.5; 41.8% טורים מלאים מול 62.3%) — הדומיננטי ב-+16 העמודים.

### 6.3 ביצועים (מ-[audits/perf_baseline/perf-baseline.json](/audits/perf_baseline/perf-baseline.json) ו-[audits/perf_slice6/perf-slice6.json](/audits/perf_slice6/perf-slice6.json))

| מסמך | מורשת | מאוחד |
|---|---|---|
| very_long (3.4MB) — עימוד | ~1.06s (797 עמודים, 11.11) | 15.7s (תכנון-DP מלא) — בפיתוח; יעד ההשוואה הפורמלי הוצהר בפרומט (median ≤ median, 7–10 ריצות) |
| ייצוא PDF very_long | 43.24s (עימוד שני) | **2.19s מהמודל** |
| טעינת דפדפן | 7.5MB/13 משאבים; 92% מהם אוספי עיטורים (P-1) | ללא שינוי (UI משותף) |

הערת הסקירה: יתרון העימוד-היחיד מוכח; זמן העימוד-המאוחד בפני-עצמו עדיין איטו משמעותית מהמורשת (ה-DP יקר) — זהו פער גלוי שמסע ה-parity לא נדרש לסגור כדי להשיג זהות תוצרים, אך נדרש לסגור לפני קטובר מוצרי (יעדי benchmark מוגדרים בפרומט הביצוע).

### 6.4 איכות, דטרמיניזם ובטיחות-תוכן — שני המנועים

- שימור תוכן: שניהם מוכיחים שימור מלא (very_long: 359,584=359,584 מילים; מעטפת 0.9595 בהשוואת ה-PDF); הבדלי הטוקנים שדווחו (253+18) סווגו ואומתו — עיקרם מספור-עמודים ופרגמנטים של חילוץ.
- אינווריאנטים: C1–C12 ב-CI (`corpus-invariants`); full-math PASS מ-17.11; אודיט-גיאומטריה בדפדפן אמיתי (very_long: 699/699 עמודים, 0 בעיות, לאחר סגירת F-BL2).
- קונטרול-שלילה: בקרות שליליות מוכיחות שהבדיקות יכולות להיכשל (ערך שהוטמע בריפו מהלקח של 01_PROGRESS_AUDIT).

---

## 7. תיעוד היסטורי של הקומיטים

### 7.1 פילוח לפי מחבר (main, 303 קומיטים)

| מחבר | קומיטים | זהות |
|---|---|---|
| SUGINACH | 157 | בעל הריפו — בעיקר «Add files via upload» (העלאות קבצים דרך האתר) |
| Z User | 64 | סוכן העבודה (בעיקר ענף ה-parity, 19–22.11) |
| Z.ai Independent Audit | 35 | סוכן ביקורת עצמאית (ביקורות 02.11 ואילך) |
| qwen.ai[bot] | 22 | הבוט של Qwen Coder (הגנזה, 02.11) |
| Z.ai Assistant / z-ai / Z.ai Agent / Z.ai / engine-dev / RED Builder / S10 Builder / SUGINACH dev / SUGINACH CI | 25 | זהויות סוכני-עבודה נוספות לאורך העידנים |

הפרדת הזהויות משקפת את ארכיטקטורת העבודה (§8): המשתמש מעלה, סוכנים מבצעים, בוטים מפרסים.

### 7.2 צפיפות קומיטים ליום (כל ההפניות, 1,001)

| תאריך | קומיטים | עידן / אירוע מרכזי |
|---|---|---|
| 02.11 | 61 | א׳ — היווצרות |
| 03.11 | 31 | א׳ — יום-העל S8–S13 |
| 04–05.11 | 48 | ב׳ — מרתון S4.9–S4.27 |
| 06.11 | 9 | ב׳ — בדיקה מפלצתית |
| 07–08.11 | 0 | הפסקה |
| 09–11.11 | 141 | ב׳ — דרישות, D-98, D-100, 98/98 |
| 12.11 | 88 | ב׳ — S73–S77, D-107 |
| 13–14.11 | 0 | הפסקה (הכנת התוכנית הקנונית) |
| 15–16.11 | 103 | ג׳ — שלבים 1–5 |
| 17.11 | 80 | ג׳ — שלבים 6–8 |
| 18.11 | 56 | ג׳/ד׳ — 9a, 9b, 9c.1–9c.3 |
| **19.11** | **199** | **ד׳ — ההחזרה, 9C.3, פרומט parity, ענפי ביקורת (היום הצפוף ביותר)** |
| 20–22.11 | 88 | ה׳ — איטרציות 001–004, השוואות |

### 7.3 קומיטים מפתחים (כרונולוגיים, מקושרים)

| תאריך | קומיט | אירוע |
|---|---|---|
| 02.11 | [459cd8a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/459cd8a) | יצירת הריפו |
| 02.11 | [fe56913](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/fe56913) | ביקורת 01 — ה-P0/P1 המייסדים |
| 02.11 | [48f6a0a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/48f6a0a) | סגירת S7 + back-fills |
| 03.11 | [211d799](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/211d799) → [a9538bc](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/a9538bc) | S8→S13; תג v25-unified-rc1 |
| 03.11 | [6936a85](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/6936a85) | החייאת Knuth-Plass (EXT-5, D-79) |
| 03.11 | [f048ecf](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/f048ecf) | קריסת ספרי-אמת (D-83/D-84) |
| 05.11 | (סדרת S4.x) | D-89, D-92; MONSTER_24 24/24 |
| 10–11.11 | (S6.x→S72) | 1,315 גופנים; D-98; D-100; IMPLEMENTATION_STATUS 98/98 |
| 12.11 | (S73–S77) | D-107 — מטרת ה-P0: איחוד המנוע |
| 15.11 | [spec/00](/spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md) | התוכנית הקנונית — המסמך המחייב היחיד |
| 17.11 | [1efd7b6](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/1efd7b6) | full-math PASS ראשון מאז שלב 1 |
| 18.11 | [2ad438a](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/2ad438a) → [19507eb](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/19507eb) | 9c.1→9c.3; פריסת 9C.3 (4992e09) — בסיס קנוני |
| 18–19.11 | [9186db4](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/9186db4), [719236e](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/719236e) | 9c.4/9c.5 — **הקטובר שנכשל והוחזר** (נותרו בענפי-צד) |
| 19.11 | [eafd27d](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/eafd27d) | PR #66 — מפת היכולות (99 שורות) |
| 20.11 | [163dce8](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/163dce8) | תיקיית השוואת PDF ישן/חדש — עידן ה׳ |
| 21.11 | [78ee6e3](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/78ee6e3), [ff14757](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/ff14757) | איטרציות parity 001, 002 |
| 22.11 | [a08732b](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/a08732b) → [567f5bc](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/567f5bc) | איטרציה 003 — 715 עמודים |
| 22.11 | [eb0dc36](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/eb0dc36), [67ff42b](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/67ff42b) | ייצואי ההשוואה 22.11 19:47 |
| 22–23.11 | [8b40fe9](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/8b40fe9), [97f9f07](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/97f9f07), [e2ea575](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/commit/e2ea575) | איטרציה 004 — G1/G2 בוצעו ואומתו על PDF אמיתי |

### 7.4 מלאי הענפים (45 הפניות מרוחקות, מקוצר לפי תפקיד)

| קבוצה | ענפים | תפקיד |
|---|---|---|
| פריסה | `gh-pages` (מתעדכן אוטומטית; `previews/engine-parity/` נפרס מ-CI) | האתר החי + preview-ניסוי |
| **ענף העבודה החי** | [`engine/legacy-parity-preview-20261119`](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/tree/engine/legacy-parity-preview-20261119) | מסע ה-parity, איטרציות 001–004 |
| ענפי-הצלה | `rescue/engine-parity-local-20261119` | גיבוי מקומי לפני המיזוגים |
| שלבי התוכנית | `stage2/`, `stage5*`, `stage6*`, `stage8a–8e`, `stage9/cutover`, `stage9b/*` (5), `stage9c/*` (4), `stage9d/segment1-geometry-contract`, `chore/asset-version-s9b–s9c5` | כל פרוסה שלב עם ענף + PR + cache-buster |
| סוכנים | `feature/agent-1..5` (+4 ענפי-ספין) | תוכנית חמשת הסוכנים |
| ביקורת | `audit/stage1-engine-state-20261115`, `audit/font-catalog-forensics-2026-11-19`, `audit/engine-transition-inventory-20261119`, `audit/user-reported-issues-2026-11-18`, `audit/stage1-map-review-20261119`, `stage1/capability-map` | ביקורות עומק |
| תיעוד | `docs/*` (5), `branding/imudify-20261117`, ענפי `fix/*` | תיקים, גלוסרי, מיתוג |
| היסטורי | `chore/asset-version-s8e` | פריסות ישנות |
---

## 8. שיחות ה-AI המתועדות

### 8.1 ארכיטקטורת שלוש-השכבות של העבודה המתועדת

הריפו מתעד מערכת עבודה ייחודית בת שלוש שכבות-סוכנים, שכל אחת מהן מתועדת בקבצים חיים:

1. **Qwen Coder** (02.11) — הבורא: כתב את שלד-הגרסה-המושלמת מאפס לפי התוכניות (הוראת המשתמש: «אל תעתיק מהריפאים הקודמים אלא תכתוב הכל מחדש»).
2. **Z.AI (GLM)** — המבצע: סוכן הקוד שהריץ את כל השלבים; זיכרון-העל שלו הוא קובץ-מעבר-הסשנים, מכיוון שהסנדבוקס מתאפס בין הודעות — «יש לקרוא אותו ראשון בכל סשן חדש».
3. **ChatGPT (gpt-6/gpt-6-t-mini)** — המנהל/הסוקר: סקר את התוכניות והריפו, ניסח את שאלון ההכרעות (D-107), והפיק את «הוראות הביצוע» שהועברו ל-Z.AI שלב-אחר-שלב (1→9c), כולל הפקודה לטיפול ברגרסיית 9c.4/9c.5 ולהחזרת 9C.3 החירום.

### 8.2 מלאי השיחות המתועדות (קישורים חיים)

| קובץ | פלטפורמה | תקופה | מה הוא מתעד |
|---|---|---|---|
| [ai-chat/qwen-chat-export-enf884mnf.txt](/ai-chat/qwen-chat-export-enf884mnf.txt) (72KB) | Qwen | 02.11 | הסשן הראשי: 17 קבצי מנוע נכתבו מאפס; toc-builder, dp-planner, balancing, ledger, folio |
| [ai-chat/qwen-chat-export-de3453mf.txt](/ai-chat/qwen-chat-export-de3453mf.txt) (48KB) | Qwen | 02.11 | שכבת הבדיקות נכתבה מאפס (28 unit); 9 באגים קריטיים; S0–S6 ירוקים |
| [ai-chat/qwen-chat-export-ee3ef5.txt](/ai-chat/qwen-chat-export-ee3ef5.txt) + [ow232w3we5.txt](/ai-chat/qwen-chat-export-ow232w3we5.txt) (60KB; כפיל של אותה שיחה) | Qwen | 02.11 | ביקורת התקדמות: BRZ-15 «אין אובדן מילים שקט» נכשל ב-11/14 e2e; שורש `note-placement-mode` |
| [ai-chat/SESSION_HANDOFF.md](/ai-chat/SESSION_HANDOFF.md) (62KB, 708 שורות) | **פרוטוקול Z.ai** | 02–12.11 | זיכרון-העל של סוכן העבודה: מהלך הסשנים (S74–S77 והיסטוריה), «חוקי ברזל» (0 בעיות עימוד — התוצאה היחידה הקבילה; כל push מחייב בניית Pages; הסנדבוקס מתאפס — מה שלא נדחף אובד), נעילות-hash, מצב-עץ בסוף סשן |
| [ai-chat/ChatGPT.md](/ai-chat/ChatGPT.md) (1.1MB, 18,711 שורות, 73 זוגות פרומפט/תשובה) | ChatGPT | 10–19.11 | ערוץ הניהול: חוות-דעת על התוכניות → כתיבת התוכנית → סטטוסים → שאלון D-107 → **הוראות ביצוע שלב-אחר-שלב (1→9c)** → מיתוג Imudify → משימת קטלוג-גופנים → **טיפול חירום ברגרסיית 9c.4/9c.5 + החזרת 9C.3** |
| [`ai-chat/שיחת צ'אט AI (Z.AI).md`](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/font-catalog-forensics-2026-11-19/ai-chat/%D7%A9%D7%99%D7%97%D7%AA%20%D7%A6%27%D7%90%D7%98%20AI%20(Z.AI).md) (1.16MB, 26,459 שורות) — **בענף ביקורת בלבד** | Z.AI (GLM) | 15–18.11 | הביקורת הפורנזית (06_FORENSIC_UNIFICATION_AUDIT) + ביצוע שלבים 1–9c (PR #18–#52) |
| [`שיחת צ'אט AI (Z.AI).md`](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/font-catalog-forensics-2026-11-19/%D7%A9%D7%99%D7%97%D7%AA%20%D7%A6%27%D7%90%D7%98%20AI%20(Z.AI).md) שורשי (1.25MB, 28,525 שורות) — **בענף ביקורת בלבד** | Z.AI (GLM) | 15–19.11 | המשך הייצוא: 9c המלא + תחילת ביקורת קטלוג-הגופנים (הזרע לענף `audit/font-catalog-forensics`) |
| [`ai-chat/דוח בדיקה.html`](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/audit/font-catalog-forensics-2026-11-19/ai-chat/%D7%93%D7%95%D7%97%20%D7%91%D7%93%D7%99%D7%A7%D7%94.html) (39KB) — **בענף ביקורת בלבד** | סוכן בדיקה | 18.11 | בדיקת קוד-מול-אתר-חי: **בזילה מלאה בין main לאתר החי** — 42 רכיבים, 28 קריטיים |
| [`audits/PARITY_SESSION_HANDOFF_2026-11-19.md`](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/engine/legacy-parity-preview-20261119/audits/PARITY_SESSION_HANDOFF_2026-11-19.md) — **בענף parity** | Z.AI | 19–21.11 | קובץ-המעבר של מסע ה-parity: U-15/16/17 נסגרו; preview חי 17/17; PDF md5 זהה בין שני נתיבים |

### 8.3 פרוטוקול ההעברה בין סשנים (ערך מתודולוגי)

קובץ-המעבר הוא פטנט-תהליך של הפרויקט: כל סשן נפתח ב-`git pull && cat ai-chat/SESSION_HANDOFF.md`, מתעדכן בסופו, ומכיל את מלוא ההקשר (פקודות משתמש מילוליות, שורשים שתוקנו, נעילות, צעדים הבאים). הסקירה ממליצה להמשיך את הפרוטוקול הזה גם בענף ה-parity (כבר נעשה דרך PARITY_SESSION_HANDOFF) ולרכז ב-[ai-chat](/ai-chat) את כל ייצואי השיחות (ראו המלצה #3).

---

## 9. ממצאי איכות ופערי תיעוד שגילתה סקירה זו

| # | ממצא | חומרה | ראיה |
|---|---|---|---|
| 9.1 | **WORKLOG נקטע ב-18.11**: כל עידן הקטובר-הכושל ומסע ה-parity (19–23.11) לא נרשמו ביומן העבודה המרכזי; התיעוד פזור בענפים וב-audits בלבד | גבוהה (רצף הוכחות) | [WORKLOG.md](/WORKLOG.md) — «עדכון אחרון: 18.11.2026» |
| 9.2 | **DECISIONS.md חסר שורות**: D-1–D-29, D-32/33/35/38, D-89/90, D-102–D-105 חסרים מהקובץ (69 שורות מתוך ~79 שהונפקו; החסרים מתועדים ב-WORKLOG/ISSUE_REGISTRY/CUTOVER) | גבוהה (מקור-סמכות סדוק) — חוק 0.1.2 של התוכנית עצמה דורש רישום כל החלטה | [DECISIONS.md](/DECISIONS.md) |
| 9.3 | **אין רישום החלטות לעידן האיחוד (13–18.11)**: כל הקטובר 9c נעשה ללא D-entries; גם כרגע אין D-109+ להכרעות ה-parity | גבוהה | חלון בטבלה בין D-101/D-107 ל-D-108 |
| 9.4 | **שכפול D-106/D-101**: אותה החלטה (יישור תחתיות-טורים) נרשמה פעמיים במספור שונה; שורת D-108 מנותקת מהטבלה (שורה ריקה מפרידה); כותרת «עדכון אחרון 17.11» אינה מתעדכנת | בינונית | [DECISIONS.md](/DECISIONS.md) |
| 9.5 | **ייצואי שיחות ה-Z.AI חיים רק בענפי-צד**: שתי גרסאות של השיחה (26,459 ו-28,525 שורות) + דוח-בדיקה קיימים רק בענף הביקורת; אם יימחק — ההיסטוריה של מי שביצע את השלבים אובדת | גבוהה (שימור היסטוריה) | `git ls-tree` על `origin/audit/font-catalog-forensics-2026-11-19` |
| 9.6 | **היסטוריית 9c.4/9c.5 בסיכון**: קומיטי הקטובר הכושל (9186db4, c612298 וכו׳) אינם נגישים מ-main ושרדו רק בענפי `chore/asset-version-*` / `stage9c/dead-code` | בינונית | §3.4; `git merge-base --is-ancestor` שלילי |
| 9.7 | **תיקיית OLD_VS_NEW מכילה פסולת**: קובץ `1` בן בית אחד (תבנית-באג מוכרת מהעבר); ההשוואה האמיתית חיה בתיקיית «PDF Export Page Comparison» | נמוכה | [audits/OLD_VS_NEW](/audits/OLD_VS_NEW) |
| 9.8 | **פערי סטטוס בין מסמכים**: README מציג מצב 11.11; IMPLEMENTATION_STATUS 98/98 מ-11.11 (קודם לתוכנית הקנונית); שלבים 1–4 בספר התוכנית לא סומנו «הושלם» בטבלת §5 שלו אף ש-AGENTS_TRACKING (17.11) קבע «שלבים 1–7 הושלמו» | בינונית (עקביות) | §4.4 |
| 9.9 | **ענייני פתוחים מסוכללים מהרישום המרכזי**: גיליון F-J6 (רגרסיית גרשיים-פוליו, D-108) והשאריות G3/G4/G5 של איטרציה 004 מתועדים בענף parity אך לא ב-ISSUE_REGISTRY | בינונית | [ISSUE_REGISTRY.md](/ISSUE_REGISTRY.md) (עדכון אחרון ~18.11) |

**איזון הוגן:** הריפו מקיים תרבות ראיות יוצאת-דופן (בדיקות-שלילה, נעילות-hash, ביקורות שמפריכות את עצמן); הפערים לעיל הם בעיקר **פערי עדכון-רציף** שנוצרו במעבר הסוער 19–22.11, לא פגמי-שיטה.

---

## 10. מסקנות והמלצות

**מסקנות:**

1. **הארכיטקטורה הושלמה, הפונקציונליות בדרך**: המנוע המאוחד הוכח כסופר-סט ארכיטקטוני של המורשת (SSOT, מקרינים טהורים, ייצוג-יחיד, ‎−94.9% בייצוא), אך עדיין אינו משחזר את התוצר — ולכן נכון שהמורשת נשארת ברירת-המחדל.
2. **תהליך ה-parity נכון מתודולוגית**: איטרציות 001–004 פועלות לפי «הוכח שורש → תקן → ייצא מלא בנתיב-האפליקציה → מדוד מחדש → השווה», עם פתרון סתירות-מדדים (מדד-פיץ׳ יחיד, פר-טור/פר-בלוק) — זו השיטה שצריך להמשיך בה עד G5.
3. **נקודת הכשל ההיסטורית אובחנה ושוקמה**: הכשל הכפול (CI-מנוע-אחר + ביטול-parity-בלי-תחליף) תוקן מבנית (preview מבודד, engineProfile מפורש, בדיקת-צללים, בסיסי A/B); הסיכון להישנות נמוך.
4. **התיעוד מפגר אחרי המציאות** (סעיף 9) — בעיקר WORKLOG/DECISIONS/ISSUE_REGISTRY שנעצרו ב-18.11.

**המלצות (לפי סדר עדיפויות):**

1. **להשלים את שערי G3–G5 באיטרציה 004** (מיקום אות-סימן; תזוזת הערות-שוליים; מילוי-עמודים — הדומיננטי של +16), באותה שיטת הוכחה; להכריע את עקומת ה-drift רק אחרי G5.
2. **לעדכן את פנקסי-המצב המרכזיים**: השלמת WORKLOG ל-19–23.11; השלמת DECISIONS.md (השורות החסרות + רישום הכרעות ה-parity כ-D-109 ואילך); רישום F-J6 והשאריות G3–G5 ב-ISSUE_REGISTRY.
3. **למזג את ייצואי שיחות ה-Z.AI ל-main** (הם ראיית-ביצוע ראשית) ולהמשיך את PARITY_SESSION_HANDOFF כיומן החי.
4. **להגן על היסטוריית הקטובר**: לתעד ב-[CUTOVER.md](/CUTOVER.md) את קומיטי 9c.4/9c.5 שנמצאים רק בענפי-צד (או לתייג אותם בתגית `cutover-failed-9c4`).
5. **לסלק את הפסולת**: מחיקת [audits/OLD_VS_NEW/1](/audits/OLD_VS_NEW) — שורת ניקיון אחת.
6. **לקבל הכרעת Q14** (אישור חוזה הפריטים) — החוסם הפורמלי של סגירת שלב 1, בידי בעל הפרויקט.
7. **לפני קטובר מוצרי כלשהו**: להשלים את מטריצת-הקבלה של שלב 10 ובדיקת benchmark מלאה (median≤median) — ולמזג ל-main רק לאחר שערי parity מלאים, כפי שהריפו עצמו מחייב.

---

## נספח א׳ — מתודולוגיית הסקירה

**מקורות שנקראו במלואם או נדגמו שיטתית** (על ידי הסוקר): [README.md](/README.md), [DECISIONS.md](/DECISIONS.md) (מלא, כולל אימות שורות ארוכות), [ISSUE_REGISTRY.md](/ISSUE_REGISTRY.md) (מלא, 557 שורות), [WORKLOG.md](/WORKLOG.md) (4,051 שורות — ראש, זנב ודגימות מפוזרות), [spec/README.md](/spec/README.md) + כל 11 מסמכי [spec](/spec), [audits/ENGINE_CURRENT_STATE.md](/audits/ENGINE_CURRENT_STATE.md), [audits/ENGINE_RUNTIME_PATHS.md](/audits/ENGINE_RUNTIME_PATHS.md), [audits/ENGINE_DUPLICATION_REGISTER.md](/audits/ENGINE_DUPLICATION_REGISTER.md), [audits/ENGINE_CONTRACT_9C3.md](/audits/ENGINE_CONTRACT_9C3.md), [audits/UNIFIED_ENGINE_MIGRATION_PLAN.md](/audits/UNIFIED_ENGINE_MIGRATION_PLAN.md), [audits/STAGE9_CUTOVER_MAP.md](/audits/STAGE9_CUTOVER_MAP.md), [CUTOVER.md](/CUTOVER.md), [CANONICAL_DOCUMENT_MODEL.md](/CANONICAL_DOCUMENT_MODEL.md), [LAYOUT_DEPENDENCY_MAP.md](/LAYOUT_DEPENDENCY_MAP.md), [MIGRATION.md](/MIGRATION.md), דוחות הסגירה 01–05, [STAGE1_CAPABILITY_MAP.md](/audits/STAGE1_CAPABILITY_MAP.md) ומשפחת ה-reconciliation, [audits/RELATED_REPOSITORY_REUSE_AUDIT.md](/audits/RELATED_REPOSITORY_REUSE_AUDIT.md), [audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md](/audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md), [audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md](/audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md), [ai-chat/SESSION_HANDOFF.md](/ai-chat/SESSION_HANDOFF.md) (מלא), [ai-chat/ChatGPT.md](/ai-chat/ChatGPT.md) (1.1MB — ראש/אמצע/זנב + זיהוי מבנה), ייצואי qwen (ראשי כל אחד), ו-[iteration-004/AUDIT.md](https://github.com/SUGINACH/Tora_Book_Typesetter_Red_Work_2/blob/engine/legacy-parity-preview-20261119/audits/legacy-parity-iteration/iteration-004/AUDIT.md) (מלא, ענף parity).

**פקודות אימות שהופעלו** (בריפו מקומי מסונכרן): `git fetch --prune`; `git rev-list --count` (main/ ‎--all); `git log --pretty` לפילוח מחברים/תאריכים; `git for-each-ref` למלאי הענפים; `git ls-tree` על ענפי-צד (גילוי קבצי ה-Z.AI בענף הביקורת, תיקיות ה-iteration בענף ה-parity, מבנה gh-pages); `git merge-base --is-ancestor` לאימות שקומיטי 9c.4/9c.5 אינם ב-main; ספירת קבצים/שורות ב-`red-build/src` וב-`red-build/tests`; מיפוי רצף ה-PRs מהיסטוריית המיזוגים; אימות סכומי-baseline מול דוחות הביקורת.

**כללי הסקירה:** כל טענה מספרית במסמך זה מגובה במקור מקושר; מסמכים בענפים שאינם main מסומנים ככאלה; לא שונה שום קוד; הסקירה לא הסתמכה על VLM או ראייה אנושית — קריאת מסמכים, git וספירות בלבד.

---

*נכתב על ידי Z.AI · 23.11.2026 · בסיס `main@67ff42b` · ענף פרסום: `docs/repo-comprehensive-review-2026-11-23`*
