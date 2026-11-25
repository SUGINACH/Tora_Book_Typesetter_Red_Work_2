# שלב 1 — אמת בסיס, מפת דרישות ואתר חי Unified בלבד

# פרומפט לסוכן AI — שלב 1 מתוך 5
## אמת בסיס, מפת דרישות מלאה, והוכחת מנוע חדש בלבד באתר החי

אתה הסוכן היחיד שמבצע את תוכנית ההשלמה. אין ליצור סוכני משנה, אין לפצל עבודה מקבילה, ואין לדלג על שלב. אותו סוכן יבצע את חמשת השלבים בסדר 1→5, ויעבור לשלב הבא רק אחרי שער הקבלה של הקודם.

### מאגר וגבולות עבודה
- Repository: SUGINACH/Tora_Book_Typesetter_Red_Work_2
- Branch מותר: engine/legacy-parity-preview-20261119 בלבד.
- מפת הדרישות: spec/מפת-דרישות-מאומתת-ומעקב-מנוע-אחיד.html
- תוכנית ביצוע קנונית: spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md
- חוזה פריט: spec/03_UNIFIED_ITEM_CONTRACT.md
- אתר חי: https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/

### הוראות משתמש והחרגות
האתר הציבורי הרגיל צריך להציג את מצב המנוע החדש, ולהריץ Unified בלבד. אין להסתפק ב-profile label או ב-workflow success: יש להוכיח runtime.
P6/P7 מחוץ לתחום לחלוטין. PDF הייחוס ההיסטורי אינו יעד איכות. השוואת legacy↔unified על אותם קלטים היא בדיקת מיגרציה נפרדת ומותרת.
Kit 40 ועיצובי השערים המקוריים חייבים להישאר פעילים אוטומטית כברירת מחדל. אין לשנות ברירות מחדל, הגדרות משתמש, גופנים או assets ללא מקור משתמש מאושר.
Q12 (שכבת ברירת מחדל), Q13 (זהות Node↔Browser) ו-Q14 (אישור חוזה הפריט) עדיין פתוחות ב-OPEN_QUESTIONS.md; אל תכריע במקומו של המשתמש.
אין למחוק legacy בשלב זה. אין push ל-main, merge אוטומטי, force-push או שינוי ענף אחר.

### כללי הנדסה ודיווח
לפני כל שינוי אמת branch, HEAD, working tree, gh-pages HEAD, PRs ו-workflows. אל תסמוך על SHA מהעבר.
אין לסגור דרישה בגלל קובץ, פונקציה, POC או commit. נדרשים מסלול runtime, בדיקת אפקט, negative control, שימור תוכן ודטרמיניזם; לפי הסיכון גם Browser E2E ו-parity.
אין לתקן תסמין ב-CSS/margin/width או post-layout כאשר השורש במודל/measurement/planner. אין להוסיף fallback או מנוע שני כפתרון קבוע.
כל שינוי קטן וממוקד. בכל דיווח ציין SHA, פקודת בדיקה, תוצאה, run ID/artifact, skipped/pending ומגבלות. אל תטען בדיקה שלא רצה.
כל דרישה חדשה או שינוי סמנטי מעדכנים באותו שינוי את מפת הדרישות ואת קטלוג הרכיבים/ההגדרות.

### מטרת השלב
לנעול אמת בסיס עדכנית, למפות את כל דרישות המשתמש מכל מקורות הפרויקט והקבצים שהועלו, ולהוכיח שכתובת האתר הרגילה מריצה Unified בלבד ללא קריאה למסלול legacy.

### פעולות מחייבות

**1. אימות Git ופריסה**
- אמת HEAD של הענף המותר, git status, tree, PRs פתוחים ו-workflows פעילים.
- אמת gh-pages HEAD, build-info.json, root index, app bundle, Worker bundle, CSS, manifest, shaping assets, WASM, font assets.
- השווה blob SHA בין red-build/ui לבין root gh-pages; בדוק גם previews/engine-parity. תעד חוסר התאמה.
- אמת cache-busting, URL base, MIME של wasm/mjs, asset loading ו-build provenance.
- בדוק את preview-engine-parity.yml ואת Pages deploy workflow; ודא שהאתר root נבנה מאותו commit של ה-UI וה-Worker.

**2. מיפוי runtime מקצה לקצה**
עקוב אחרי UI → Worker client/transport → engine-worker-main → pipeline selection → parser/DocumentModel → shaping/measure → LineModel → planner → PageModel → DOM/HTML/PDF.
- אתר כל use של BRANCH_ENGINE_PROFILE, _engine-force-unified, _layout-profile, _imudRaw, legacyProfile ו-PageModel.
- חפש את כל הקריאות ל-legacyTypeset, legacy-imud-flow, legacy-projector, legacy schemas ו-fallbacks. סווג כל קריאה כ-test-only, shadow comparison, compatibility adapter או product runtime.
- בנה runtime trace/spy שמוכיח אפס קריאות layout ל-legacy באתר החי.
- בדוק שכשל חסר PageModel או typography runtime מציג שגיאה מפורשת ועוצר; אין להציג פלט legacy כאילו הוא Unified.
- בדיקת שלילה: השבת/שבש את דגל Unified בסביבה מבוקרת; בדיקת המוצר חייבת להיכשל מפורשות.

**3. Browser E2E באתר החי**
בדוק את URL root הרגיל ללא query וללא תת-נתיב Preview:
- טעינת UI, עורך, הגדרות, ייבוא/הדבקה, טעינת פונטים, Worker ו-WASM.
- typeset למסמך קצר ול-very_long_test_text.txt, PageModel, progress/cancel/error.
- שינוי setting בעל אפקט מוכח; Preview navigation; HTML export; PDF export היכן שנתמך.
- console/network errors, 404, cache stale, RTL, font fallback ו-Worker restart.
שמור Playwright trace, screenshots של עמוד מלא, network manifest, source commit ו-build-info. אם לא ניתן להריץ Browser E2E, אל תמציא הצלחה: כתוב workflow אוטומטי וחסום את שער הקבלה עד לריצה.

**4. Reconcilation מלא של הדרישות והמקורות**
קרא/בדוק את:
- spec/00_CURRENT_ENGINE_COMPLETION_PLAN.md, spec/01_MASTER_SPECIFICATION.md, spec/Software_Requirements_Specification.md, spec/03_UNIFIED_ITEM_CONTRACT.md, spec/MONSTER_24_CHECKLIST.md.
- spec/סיכום בקשות מAI.md: כל 20 הנושאים.
- DECISIONS.md, OPEN_QUESTIONS.md, WORKLOG.md, ISSUE_REGISTRY.md, LAYOUT_DEPENDENCY_MAP.md.
- audits/USER_REQUIREMENTS_AND_UI_HISTORY_2026-11-19.md, ENGINE_CURRENT_STATE, ENGINE_RUNTIME_PATHS, ENGINE_DUPLICATION_REGISTER, Stage1–9, SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT, H3, TOC, H7, Notes, shaping, font and UI audits.
- הקבצים שהועלו/הספרייה: handoff, סיכומי שיחות, chat_history_2026-11-12, Pasted text/markdown מ-19–24.11, תוכניות תיקון ומחקרים. סווג duplicates והיסטוריה; אל תשליך דרישה שלא בוטלה.
- כל מסמך/בדיקה/workflow בקוד. עבור binary/font/image/PDF/artifact ציין אם נסרק metadata בלבד או נבדק לעומק.
- Coverage_Audit.xlsx הוא audit לכיסוי כתב-יד בדיני שבת, לא דרישות תוכנת RED; תעד את ההחרגה.
מפה כל אחד מ-20 נושאי הבקשות ל-Requirement IDs. כל נושא יסווג active, transformed by later decision, user decision, superseded או excluded. אין נושא לא ממופה.

**5. אודיט settings/Text IDs**
- הפק inventory עדכני לכל parser IDs, prefixes, aliases, registry keys, labels, UI controls, defaults, imported defaults, fallbacks ו-hardcoded constants.
- הקטלוג העדכני כולל 256 settings; אין להעתיק ספירות או ערכים מהאודיט ההיסטורי של 253 בלי בדיקה מחדש.
- בדוק אם קיים קובץ נפרד של Text ID → code identifier; אם לא, פתח דרישה/תוצר מפורש.
- בדוק פונקציות layout שתלויות ישירות ב-H2/H3/H7; תעד hard-coded policies, אל תשנה אותן עדיין ללא תכנון.

### תוצרים
1. audits/PHASE1_RUNTIME_TRUTH.md — מפת runtime, deployment provenance, hashes ו-zero legacy call trace.
2. audits/PHASE1_BROWSER_ACCEPTANCE.md — תוצאות Browser E2E ו-artifacts.
3. audits/PHASE1_SOURCE_RECONCILIATION.md — כל 20 נושאי המקור, מסמכים שהועלו, החלטות, סתירות ו-open questions.
4. מפת HTML מעודכנת עם coverage matrix, מצב/ראיות נוכחיים ו-source inventory.
5. baseline manifest: corpus hash, settings, fonts/assets, engine/build version.
6. עדכון ISSUE_REGISTRY/WORKLOG/קטלוג באותו PR/commit לפי הצורך.

### שער קבלה
- Root Pages מריץ Unified ללא query.
- Browser runtime trace מוכיח אפס קריאות legacy במסלול המוצר.
- ה-UI/Worker/PageModel/assets מתאימים לאותו commit.
- כשל Unified אינו מפעיל fallback.
- Browser E2E רץ בפועל על root או שהשער נשאר פתוח עם workflow מוכן; אין להכריז על הצלחה מדומה.
- כל 20 הנושאים ההיסטוריים ממופים.
- Q12/Q13/Q14 נשארות open עד הכרעת משתמש.
- מפת הדרישות וה-catalog עדכניים ב-Git.
