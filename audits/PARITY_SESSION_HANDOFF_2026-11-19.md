# PARITY_SESSION_HANDOFF — 19.11.2026 (סשן הקמת תשתית ההוכחה legacy↔unified)

> **מסמך מעבר בין סשנים למיילסטון ה־parity.** נכתב בסוף סשן 19.11 (המשך ישיר של
> `audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md` — ההוראה שבוצעה כאן).
> לקריאה ראשונה בסשן הבא, לפני כל פעולה.

## 1. מצב Git בסיום הסשן

| ענף | HEAD | מצב |
|---|---|---|
| `main` | `aedf5ba` | התקדם מ־710b4e7 (PRs #68/#69 — תיעוד: דרישות משתמש + תיקון פוליו D-108). לא נדחף מקומית דבר ישירות אליו. |
| `engine/legacy-parity-preview-20261119` | `f603c92` | **ענף המימוש** — נוצר מ־main@aedf5ba; aa35cde (פרופיל unified), 23d09be (כלי parity), 060695e (הקטנת ארטיפקטים), 0f0bcc6 (benchmark), b86ed2c (handoff), **f603c92 (פרוסה 1: פוליו חשוף D-108 בשני המנועים)**. |
| `stage1/capability-map` (PR #66) | `99917fa` | מוזג main@aedf5ba (מיזוג `2fc59e8`, נקי) + ספירה מכנית 99/99/13 + D-108 + PR body מדויק. **CI ירוק.** |
| `docs/repo-map-glossary-20261119` (PR #65) | `a333023` | מוזג main + מלאי 478 (0 חסר/עודף/כפול) + Folio=bare gematria נאמת. **CI ירוק (draft).** |
| `gh-pages` | `4b88186` | שורש הייצור ללא שינוי (עדיין s9c3); נוסף `previews/engine-parity/` בלבד. |

## 2. מה נפרס ואומת בפועל

**Preview חי:** https://suginach.github.io/Tora_Book_Typesetter_Red_Work_2/previews/engine-parity/
- מקור: commit `f603c92` (run 44519229682, success). **אומת בדפדפן אחרי פרוסה 1:** 31 עמודים, 26 פוליו מוצגים — ב, ג, ד… יד, **טו, טז** (הצורות המיוחדות!), יז… כו — **אפס גרש/גרשיים** (D-108 בעין; צילום: download/preview-folio-bare-f603c92.png). build-info: profile=unified, commit=f603c92.
- Workflow: `.github/workflows/preview-engine-parity.yml` — בונה את שתי החבילות מהמקור, מזרים ל־`gh-pages:previews/engine-parity/` בלבד, push ל־gh-pages מפעיל את `deploy-pages.yml` הקיים.
- **אומת בדפדפן אמיתי (19.11):** כל הנכסים 200 (bundles/styles/fonts/icons/build-info); האפליקציה עולה; פס מצב מציג "⚙ מנוע: unified (ניסיון) · 060695e" + tooltip "סביבת ניסוי — אינה אישור לנכונות המנוע או לאישור cutover"; Worker מעמד (6 עמודים ב־260ms); PageModel מגיע בשלמות (`pagemodel-v1`); גופנים נטענים מה־subpath.
- **שורש הייצור לא נפגע** (נבדק: index עדיין `2026-11-18-s9c3`).

## 3. מנגנון פרופיל הענף (לא לשבור)

- `pipeline.js`: `forceUnifiedImud = RED_UNIFIED_IMUD env OR settings['_engine-force-unified']===true` — **נקודת dispatch אחת**, ללא מנגנון מקבילי. הוכח: IMUD בלי דגל=legacy; עם דגל=unified+PageModel; דיפולט רגיל=unified כמקודם.
- `browser-entry.js`: `BRANCH_ENGINE_PROFILE='unified'` → `createApp({branchEngineProfile, branchBuildInfoPromise})`; fetch `build-info.json` (יחסי — עובד מה־subpath).
- `app-shell.js`: מזריק את הדגל ל־settings; **כשל מפורש** אם התוצאה legacy (fallback שקט) או בלי PageModel תקין.
- `status-strip.js`: `setBranchProfile` — צ'יפ פרופיל.
- ב־main שום דבר מזה לא רץ (הענף מזריק; main לא).

## 4. כלי ההוכחה שנבנו (סעיפים ה+ו בהוראה)

- **`tools/parity/parity-signature.js`** — חתימה ישירה מהמבנים הקנוניים: מורשת=`result.pages` (עמודות+gateLines+toc.rows), מאוחד=`result.pageModel` (x/y/w/h/sizePt/align+מילים x/w/color+sourceTokenId). שדות חד-צדדיים מתועדים ב־layerFields; כימות COORD_Q=0.01pt סימטרי; manifest מלא; 9 negative controls (כולל הזרקת גרשיים לפוליו) — **כולם נתפסים**; דטרמיניזם נפרד לכל מנוע. תוצאות ב־`audits/parity-signature/` (+README).
- **`tools/parity/benchmark.js`** — apples-to-apples, סדר מתחלף, warmups, p50/p95. **תוצאה: FAIL — unified איטי פי 9–17** (no_long 59→677ms; very_long 977→13,433ms). פירוט ב־`audits/parity-signature/benchmark.json`.

### טבלת parity (19.11 אחרי פרוסה 1, Node 24.22.3, בלי stretch env — כמו האפליקציה החיה)

| קורפוס | מורשת | מאוחד | הבדלים | benchmark p50 |
|---|---|---|---|---|
| canonical | 38 | 37 | 2,583 | — |
| no_long | 54 | 66 | 16,066 | 60ms / 657ms |
| mid_long | 139 | 191 | 31,693 | 238 / 2,216 |
| long | 552 | 799 | 160,360 | 628 / 10,834 |
| very_long | 699 | 992 | 192,315 | 977 / 13,433 |

**פרוסה 1 נסגרה (f603c92):** הפרת D-108 בפוליו תוקנה בשורש — `toBareGematria`
ב-decoration/folio.js הוא מקור הפורמט הקנוני של שני המנועים (בלי גרש/גרשיים/
מפריד גם באלפים: 1000=א, 5702=התשב); אתרי הפוליו/TOC במורשת מייבאים אותו;
סמני הערות לא נפגעו (D-108: "אין להסיק"); פענוח האודיט עודכן לחשוף
(מועמדים קנוניים + atLeast — נסגר באג קיים שפענח 'א׳' תמיד כ-1); מפת הגיליונות
בתצוגה עברה למפתח מספרי. בדיקות: d108-bare-folio (13) בשרשרת npm test (84/84);
fdff19d8 ו-legacy-28f52 נשמרו; parity-signature מראה פוליו חשוף וזהה בפורמט
בכל 4 הקורפוסים. מספרי ההבדלים לא השתנו — השארית בקטגוריית page-folio היא
הבדלי **מספור/מבנה** (עמ' 3: מורשת ממוספרת, מאוחד לא), לא פורמט.

**ההבדלים הממוקמים שנותרו** (ראה diff.json): כותרת שער "מקום בינה" 46pt Lia Sgula
(מורשת) מול "בס״ד" 12pt (מאוחד) — פער provenance (המתנה להכרעת משתמש);
גיאומטריית שער (דו-טורי מול 552.3 יחיד); מספרי עמודים (54/66 וכו'); windowWords.

## 5. בדיקות ו־CI בסיום הסשן

- מקומית (ענף preview, `f603c92`): `npm test` ‏84 סוויטות/0 כשלים (כולל d108-bare-folio חדשה); `test:determinism` ‏fdff19d8/37; `s10-ui` ‏44/44; `s9d` ‏11/11; run-ours מקומי: legacy-28f52/695 עמ' נשמר.
- CI ענף preview (060695e): `corpus-invariants` ✓, `preview-engine-parity` ✓, **`CI` — layout-audit נכשל: `HEADER_POSITION (עמוד 7, high)` — בעיית עימוד אמיתית במנוע המאוחד** (שוחזרה מקומית; יציאה 1 = בעיות אמיתיות, לא תשתית). **`full-math-audit` נכשל — אותה סיבה.** אלה כשלים אמיתיים של המנוע המאוחד — לא להסתירם ולא "להרוק"; הם ייסגרו כשפערי ה־parity יתוקנו.
- PR #66 / PR #65: CI ירוק. **שניהם מוכנים למיזוג מבחינת הביקורת** (B1/B2 הושלמו; Q14/Q12/Q13/provenance מסומנים פתוחים בגוף ה־PR). לא מוזגו — ההחלטה אצל המשתמש.

## 6. browser audit של סנכרון העורך (סעיף ח בהוראה)

נבדק בדפדפן אמיתי מול ה־preview החי:
- **כיוון א׳ (סמן→עמוד): עובד.** סמן באמצע הטקסט (offset 1494) → `caret-target` על עמוד 5 מתוך 6.
- **כיוון ב׳ (לחיצה על עמוד גוף→סמן): עובד.** עמוד 5 → סמן 30; עמוד 6 → סמן 50. עמודי שער/TOC כראוי לא מזיזים (אין להם טוקנים מהמקור). Round-trip תקין בגבולות סמנטיקת הטוקן-הראשון.
- **סמני שבירה בתוך הטקסט: חסרים.** קיימת רק רשימת ⏎ חיצונית מתחת ל־textarea (F-01) — בדיוק הרגרסיה שהמשתמש דיווח. **הפיצ'ר אינו קיים** למרות שהמודולים קיימים; דרוש מימוש overlay מבוסס sourceRange בתוך שכבת הטקסט של העורך (הוראה ח: בלי regex, בלי חישוב שורות כפול, בלי לשנות את textarea.value).

## 7. החלטות שנשמרו (לא לפתוח)

D-108 (פוליו גימטריה חשופה — **המאוחד מפר כרגע, יתוקן במסגרת parity**), D-100 (אין PDF-reference parity; יש engine-vs-engine), D-98 (very_long קובע), D-96/D-107 (ערכת 40+שלושה שערים), S75/S76, S4.5 (provenance — פתוח להכרעה), Q12/Q13/Q14 פתוחים.

## 8. הצעד הבא המדויק (סשן הבא)

1. `git fetch && git checkout engine/legacy-parity-preview-20261119 && git pull` — לקרוא מסמך זה.
2. לאשר שפריסת `0f0bcc6` הושלמה (run חדש של preview-engine-parity) וה־preview עדיין תקין.
3. **תיקון פער השורש הראשון** (הוראה ז): הפוליו — `toGematria` במסלול הפוליו של המאוחד מוסיף גרשיים (ראה "ב׳" בחי); תיקון במקור היחיד (decoration/folio), בדיקות bare-folio ל־1/2/15/16/21/22/99/100/101/999/1000/1001/5702 + שלילה U+05F3/U+05F4 + עדכון ה־parity tool (קטגוריית page-folio חייבת להתאפס).
4. במקביל: פרופייל ביצועים של המאוחד (פי 9–17 איטי — חוסם מוצר); פער ה־provenance ("ספר מלכי המלוכה" דורס מטא) ממתין להכרעת המשתמש (§3.2-1 במפת היכולות).
5. מיזוג PRs #65/#66 באישור המשתמש.

## 9. מה לא נעשה בסשן זה (ולמה)

- לא תוקן אף פער מנוע (הוראה: "רק לאחר שכלי ההוכחה מוכיחים את ההפרשים" — הכלים הושלמו ומוכיחים; התיקון הראשון בסשן הבא).
- לא הוסר קוד legacy כלשהו; לא שונתה ברירת מחדל של main.
- לא בוצע rendered visual diff (raster) — החתימה המבנית/גיאומטרית הושלמה; visual diff ייבנה אחרי צמצום הפערים המבניים.
- WORKLOG/ISSUE_REGISTRY לא עודכנו בענף המנוע (הוראה י: לעדכן בכל פרוסה — לבצע בסשן הבא עם תיקון הפוליו).
