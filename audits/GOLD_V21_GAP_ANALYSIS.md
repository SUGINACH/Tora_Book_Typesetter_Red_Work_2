# Gap Analysis — אבחון RED מול step-by-step-audit של Gold V21

> **מסמך:** משימת הפתיחה של סוכן 2 (תוכנית ההפעלה §3; תוכנית האב §מקבץ C, שלב 2).
> **תאריך:** 11.11.2026 (מחזור S1-ח) · **בסיס:** ‏34208e9 (main, לאחר PR #12).
> **מקור העיון:** ‏`Tora_Book_Typesetter_Gold` ‏ענף ‏V21 — קבצים שנבחנו לעומק:
> `work_doc/step-by-step-audit-Method.md` (השיטה המלאה), `scripts/step-by-step-audit.js`
> (ה-runner), `trace-manager.js`, `geometry-audit.js` (114KB), `audit-text-integrity.js`,
> `.github/workflows/step-by-step-audit.yml`.
> **מטרה:** מיפוי קיים/חסר/חלקי/לא-רלוונטי לפני מימוש (תוכנית האב §2.2), וסגירת
> הפערים שהוכחו — בוצע במחזור זה (ראו §4).

---

## 1. הבדל ארכיטקטוני מכריע (מסגרת לכל ההשוואה)

Gold V21 הוא מנוע **מבוסס-DOM**: לולאת typesetting מוטצת את ה-DOM, וה-step-by-step
audit מזריק `window.__runAuditCheckpoint(name)` ב-4 נקודות בתוך `typesetDocumentCore`
ומודד את הגיאומטריה **מה-DOM החי** (extractGeometry/enrichNode/getPageMetrics).

RED הוא מנוע **חישובי-תחילה** (SRS §1.1): pipeline חד-כיווני בלי לולאת
DOM-mutation; ה"גיאומטריה" היא מודל מחושב (`pages[].columns[][]`, `spanning`,
`footnotes`) שממנו נגזרים התצוגה, ‏HTML ו-PDF ממקור משותף (geometry-projector).

**נגזרת:** העתקת מנגנון Gold כמות שהוא (DOM extraction, iframe, postMessage)
**אינה רלוונטית** לארכיטקטורט RED — תוכנית האב §2.2 אוסרת זאת מפורשות
("אין להעתיק את geometry-audit.js בשלמותו מ-Gold; יש להעביר עקרונות/בדיקות רק
לאחר התאמה לחוזי RED"). ההשוואה להלן נעשה לפי **היכולת האבחונית** (מה ניתן
לדעת על ממצא וסביבתו), לא לפי שכפול מנגנון.

---

## 2. מיפוי יכולות — קיים / חלקי / לא-רלוונטי / חסר (טרום S1-ח)

| # | יכולת Gold V21 | מקור ב-Gold | מצב ב-RED טרום S1-ח | ראיה ב-RED |
|---|---|---|---|---|
| 1 | checkpoints בתוך הריצה (4 גלובליים + `--ppc` פר-עמוד) | `__runAuditCheckpoint` בתוך typesetDocumentCore | **קיים (שקול)** — ‏CP1–CP5 מוגדרים ב-pipeline כסדר קנוני אכוף; רישום אירועים בכל שלב (trace-v2, ‏18 שלבים) | `src/engine/core/pipeline.js` (CP1 פענוח → CP5 רינדור); `src/engine/core/events.js` |
| 2 | חתימות אלמנט יציבות (`tokenId\|type\|cls\|y\|h`) | `collectPageSignatures` | **חסר** — ל-ledger היו target/page/predicate אבל לא מצב-עמוד-מלא חתום | — (נסגר ב-S1-ח: `lineKeyOf` — `tokenId#lineIdx`) |
| 3 | delta בין checkpoints (added/removed/changed) | `computeDelta` | **חסר** — היה רק hash מצטבר (layoutHash/bodyGeometryHash) בלי פירוט מה השתנה | — (נסגר ב-S1-ח: `diffSnapshots`) |
| 4 | מדדי עמוד (bodyFlow/footnoteArea/twoColumnBlocks/pageCount) | `getPageMetrics` | **חלקי** — תבניות העמוד והגיאומטריה קיימות במודל (page-templates), ‏pageCount נרשם; לא נשמרו פר-checkpoint | (נסגר ב-S1-ח: pageCount/lineCount/סוגי-עמודים/סמני-הערות פר-צילום) |
| 5 | תיעוד כל אלמנטי העמוד (`pageElements`) | checkpoint issue schema | **חסר** — §2.4 בתוכנית האב סומן "חלקי" | (נסגר ב-S1-ח: `buildFindingsContext` — רכיבים אחרים שהשתנו בעמוד הממצא מאז הופעתו) |
| 6 | 7 קטגוריות סיבתיות | runner `--causality` | **חלקי** — ל-RED ‏10 מצבי חיים עשירים יותר (ledger-v2) אך ללא מיפוי רשמי מול Gold | `src/engine/core/ledger.js` (נסגר ב-S1-ח: `goldCausalityOf` — מיפוי מלא מתועד) |
| 7 | הרצת אודיט גיאומטרי בכל checkpoint | auditGeometry (12+ בדיקות) על חלץ ה-DOM | **קיים (שקול-חזק)** — ‏full-math-audit: ‏31 משפחות בדיקה על ה-DOM החי הסופי + אינווריאנטים C1–C12 ב-CI; ב-RED האודיט **מופרד** מהעימוד (המנוע חישובי) ולכן רץ על מצב סופי + אינווריאנטים בזמן ריצה | `tools/layout-audit/full-math-audit.js`; ‏`tools/layout-parity/verify-corpus.py`; ‏workflow ‏corpus-invariants |
| 8 | בידוד פרק (אין השפעה בין פרקים — H2 פותח עמוד) | runner מקבל מספר פרק | **קיים (נגזר)** — ‏H2 ‏פותח עמוד (SIGN_OPEN); ב-RED ניתן להריץ כל מסמך-משנה דרך fixtures; לא נדרש מנגנון ייעודי כי אין מצב משותף בין ריצות | `tests/fixtures/*`; ‏`page-templates` ‏SIGN_OPEN |
| 9 | per-page checkpoints (`--ppc`) — אבחון מתי בדיוק נוצרה בעיה בתוך הלולאה | flag ב-runner | **לא רלוונטי (ארכיטקטורה)** — ‏ב-Gold זה נדרש כי הלולאה הראשית מוטצת DOM לפני checkpoint ‏1 ובעיות נבלעות ב-`created-at-first-checkpoint`. ב-RED ה-DP מתועד לעומק: כל הפרה נרשמת ב-ledger **בזמן היווצרותה** עם stage ‏(`page-plan`/`protections`/`balance`/`notes-budget`) — המקביל המדויק של per-page קיים מבנית | `dp-planner.js` ‏(ledger.create בכל הפרה); ‏`retreat-loop.js` |
| 10 | `data-layout-*` — תיעוד החלטות המנוע על הבלוקים | §7.3 בשיטה | **קיים (שקול-חזק)** — ‏ל-RED יש רישום החלטות **עשיר יותר ברמת החלטה**: ‏ledger שומר לכל ממצא מועמדים, קיבולת לפני/אחרי, מסלול, סיבת נסיגה — נתוני "למה" של-Gold חסרים (אצלו רק התוצאה הגיאומטרית) | `ledger.js` ‏(candidates/capacity/rollback_reason); ‏`candidate-generator` |
| 11 | counterfactual — השבת פונקציה והשוואה | §7.4 (env vars) | **קיים (מתודולוגיה מוכחת)** — ‏ניסוי חד-משתני FIT_EPS ‏(S1-א): השהיית מנגנון יחיד → הוכחת שרשרת סיבתית מלאה ו-hash לפני/אחרי; מתועד כשיטת עבודה מחייבת (תוכנית האב §1.3-7) | `audits/P6_P7_D97_CLASSIFICATION.md` ‏(ניסוי ההשהיה); ‏DECISIONS ‏D-92 |
| 12 | CLI runner עם flags (`--causality`, `--deltas-only`, `--json`…) | `scripts/step-by-step-audit.js` | **קיים (שקול)** — ‏כלי RED: ‏`tools/layout-audit/run-full-math.js`, ‏`determinism-sweep`, ‏`verify-corpus`, ‏`perf-baseline` — ‏כולם אוטונומיים ב-Node וב-Actions; ה-delta/סיבתיות נגישים כעת ב-result.stageSnapshots (JSON טהור) לכל כלי חיצוני | `tools/*`; ‏workflows ‏×5 |
| 13 | trace ניהולי (מזהים, שעון) | `trace-manager.js` | **קיים (חזק יותר)** — ‏שעון לוגי דטרמיניסטי (P1-6) מאפשר השוואת טרייסים בין קומיטים; verbosity ‏4 רמות; ‏droppedEvents חייב 0 | `events.js` ‏(ts לוגי) |
| 14 | שמירת checkpoints מלאים ל-JSON חיצוני | `--json` | **לא נדרש (החלטה מתועדת)** — ‏המודל המלא דטרמיניסטי וניתן לשחזור מהקלט (אותו קלט ⇒ אותה תוצאה, ‏hash ‏מוכח); מה שנשמר הוא ה-deltas+ההקשרים (המידע האבחוני), לא צילומים מלאים כפולים — תוכנית האב §2.2 אוסרת שכפול snapshots מלאים ללא צורך | `stage-snapshots.js` ‏(תיעוד החלטה בכותרת המודול) |
| 15 | אינטגרציית CI — השוואת סיבתיות בין קומיטים | §11.3 (TBD גם ב-Gold) | **חלקי — פתוח משותף** — ‏גם ב-Gold זה סומן TBD; ב-RED ‏CI ‏כבר מריץ קורפוס/אינווריאנטים/דטרמיניזם בכל push; הרחבה עתידית אפשרית להשוות gold_causality.summary בין ריצות | workflows ‏×5; ‏(עתידי, ‏P3) |

## 3. מיפוי סיווג סיבתי — 10 מצבי RED → 7 קטגוריות Gold (§2.3)

מומש כפונקציה טהורה `goldCausalityOf` ומתועד בקוד ובבדיקה (ראו §4):

| RED (ledger-v2) | Gold V21 | הערה |
|---|---|---|
| correction-reverted | correction-reverted | זהות מלאה |
| reintroduced | correction-reverted | נתקן וחזר — דפוס הביטול של Gold |
| competing-repair-side-effect | correction-reverted | ריפוי שהתנגש בריפוי אחר — תיקון בוטל ע"י תיקון |
| resolved | fixed-by-stage | זהות מלאה |
| unresolved / not-comparable | unresolved | זהות מלאה |
| became-observable-later | couldnt-appear-before | היה קיים אך לא נצפה עד שלב מאוחר |
| created + העמוד לא היה קיים בצילום הקודם | couldnt-appear-before | כלל pageCount ‏של Gold ‏§4.1 |
| created בצילום הראשון | created-at-first-checkpoint | כלל Gold ‏§4.2 |
| created מאוחר, העמוד קיים | created-by-stage | כלל Gold ‏§4.3 |
| correction-blocked | לפי מקור היצירה (created-*) | חסימת תיקון אינה משנה מועד יצירה; המידע על החסימה נשאר במצבי RED העשירים |
| never-appeared (Gold) | — | לא מצב ריצה ב-RED: מכוסה ע"י negative-controls + ‏audit-sensitivity ‏(24 בדידות מוכיחות שהגלאים יורים על מקרים פגומים) |

## 4. מה נסגר במחזור זה (S1-ח)

הפערים שסומנו "חסר" במיפוי (שורות 2–6) נסגרו במימוש מותאם-ארכיטקטורה:

| רכיב חדש | קובץ | תפקיד |
|---|---|---|
| `stage-snapshots.js` | `red-build/src/audit/stage-snapshots.js` | צילומי-מצב (חתימות tokenId#lineIdx), ‏diffSnapshots ‏(added/removed/changed), ‏buildFindingsContext ‏(§2.4), ‏goldCausalityOf ‏(§2.3) |
| נקודות לכידה | `pipeline.js` — ‏4 נקודות | cp3-dp → cp3-structural → cp4-decorations → cp5-final; ‏opt-in ‏`audit-stage-snapshots` (ברירת מחדל: כבוי) |
| הקשר-עמוד בדוח | `report-schema.js` | `page_context` לכל ממצא עם עמוד + ‏`stage_snapshots` מטא בראש הדוח |
| העברה ב-Worker | `worker-protocol.js` | `stageSnapshots` ‏(additive; ‏null כשכבוי) — חוזה ui-result-v1 נשמר |
| בדיקות | `tests/audit/stage-snapshots.test.js` | 18 בדידות: יחידה (צילום/delta/סיבתיות/הקשר + negative control), אינטגרציה (4 צילומים, מונוטוניות), ‏no-op proof ‏(hash זהה עם/בלי), דטרמיניזם ביטים, חוזה דוח+Worker |

**הוכחות (רמות הראיה של תוכנית האב §2.3):**

- **קוד:** המודול מחובר ל-pipeline ב-4 נקודות; צרכן רשום ב-registry
  (`audit/stage-snapshots`); ‏פקד ‏UI ‏נוצר (chk-audit-stage-snapshots — dead-control ‏0).
- **בדיקה:** ‏18/18 עוברות; ‏37 ‏סוויטות ‏710/710 ‏בדידות ‏— ‏0 ‏כשלים; ‏scan-control ‏0 ‏הפרות.
- **ריצה בפועל:** ‏קנוני ‏`80f9ed6c82ea3855…` ‏**זהה לנעילת ה-determinism** גם עם
  המנגנון דלוק — ‏no-op proof; ‏נתוני הצילומים על הקורפוס הקנוני:
  cp3-dp(25) → cp3-structural(36) → cp4-decorations(36) → cp5-final(36);
  ‏deltas: ‏604 ‏שינויי-מיקום בהכנסה המבנית (שערים+TOC), ‏**0 שינויים** בפאס
  העיטורים ו-**0** עד הסוף — הוכחה פר-שורה של אינווריאנט T1 ‏(המקביל
  המפורט ל-bodyGeometryHash, ‏D-47); ‏final_stable=true; ‏סיכום Gold:
  8 ‏created-at-first-checkpoint, ‏9 ‏correction-reverted.
- **קבלת משתמש:** לא נדרשת לאבחון שקוף-לפריסה (אין שינוי פלט), אך המחזור
  כולו כפוף לסקירת בעל הפרויקט.

## 5. מסקנות והחלטות

1. **פער הגרעין נסגר:** ‏יכולת snapshot/diff ‏שדרשה תוכנית האב §2.2 מומשה במלואה
   (חתימות, ‏delta, ‏הקשר-עמוד, ‏סיווג Gold) — הפערים שנותרו מסוג "חלקי" בטבלת
   המצב (שלב 2.2/2.3/2.4, ‏מקבץ C, ‏נושא 15, ‏SRS §19) נסגרים איתה.
2. **RED חזק מ-Gold בשלושה מישורים** (תועלו מההשוואה, לא להזדקקות): ‏(א)
   רישום החלטות ברמת מועמד/קיבולת/נסיגה — ל-Gold רק תוצאה גיאומטרית; ‏(ב)
   דטרמיניזם מוכח (שעון לוגי ‏+ ‏hash ‏+ ‏no-op proofs) — ‏ל-Gold ‏אין; ‏(ג) הפרות
   נרשמות בזמן היווצרותן עם השלב — מקביל per-page-checkpoints ‏קיים מבנית.
3. **לא רלוונטי במפורש (החלטות מתועדות):** ‏DOM-extraction ‏מהחי, ‏iframe/postMessage
   runner, ‏--ppc ‏(מכוסה מבנית — סעיף 1), ‏שמירת צילומים מלאים (מנוגד ל"אין לשכפל
   snapshots מלאים"; ‏המודל ניתן לשחזור דטרמיניסטי). אין לפתוח מחדש אלא לפי החלטת משתמש.
4. **נותר פתוח (משותף לשני המאגרים, ‏P3):** ‏השוואת gold_causality.summary
   בין קומיטים ב-CI ‏(Gold ‏§11.3 ‏TBD) — ‏מועמד למחזור עתידי אם תידרש מגמתיות.
5. **מסלולי parity/ייחוס אינם חלק ממסמך זה ולא ייפתחו** ‏(D-99/D-100).

---
*מסמך זה תוצר משימת הפתיחה של סוכן 2 ואינו מחליף את מקורות האמת; במקרה
סתירה — הקוד, ‏WORKLOG ‏ו-DECISIONS גוברים.*
