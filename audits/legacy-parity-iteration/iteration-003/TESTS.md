# TESTS — Iteration 003

כל התוצאות להלן הופקו מ-HEAD `2702834` + תיקון משקל-השערים של סשן זה (נדחף עם ה-artifacts), באותה סביבה (Node 24, Linux sandbox).

## 20 הבדיקות המחייבות אחרי קבוצת תיקונים (§9 בפרומפט)

| # | בדיקה | תוצאה | ראיה |
|---|---|---|---|
| 1 | Unit tests | ✓ | בתוך `npm test` (parser, s2-s6, s3-measure/cache/safety…) |
| 2 | Integration tests | ✓ | registry/imud-migration/setting-sets/source-variants/legacy-result-contract |
| 3 | npm test מלא | ✓ **90/90 קבצים, EXIT=0, 0 כשלים** | ריצה לאחר תיקון המשקל (הריצה הקודמת, טרום-דחיפה, גם 90/90) |
| 4 | Determinism | ✓ | `test:determinism` → `deterministic OK 8a6b23bd0e6d8439 pages: 37` |
| 5 | Cross-check | ✓ חלקי | byte-reproducibility של ייצוא הספר המלא מנתיב האפליקציה: שתי הרצות → PDF/HTML זהים ביט-לביט (md5 אחרי תיקון: `f5a0cc2a…`/`fbc5d416…`; לפניו: `f348fc9c…`/`017f527c…`, אותו layoutHash). כלי cross-check התלת-קורפוסי לא הורץ בסשן זה (הורץ בסשים קודמים על בסיס משותף). |
| 6 | Negative controls | ✓ | tests/audit/negative-controls.test.js בתוך הסוויטה |
| 7 | Content reconciliation | ✓ | `contentPreserved=true`, `mismatchKinds=0` (חשבונאות מולטי-סט מלאה ברמת המנוע, כולל windowWords והערות-צד) + reconciliation ברמת ה-PDF: 271/271 סוגים מוסברים (CONTENT_RECONCILIATION) |
| 8 | Overlap audit | ✓ | s14-layout-audit בסוויטה |
| 9 | Overflow audit | ✓ | s14 + s9-headers (חוזה חוץ-גבולות) |
| 10 | Page-model audit | ✓ | s8c/s8d/s8e/s8f/s8g בסוויטה |
| 11 | Bundle freshness | ✓ | באנדלים נבנו מחדש מהמקור אחרי כל שינוי (build-worker-bundle + gen-ui-bindings); s10-ui (D-65) ירוק |
| 12 | Export HTML | ✓ | `new-export.html` (57,145,165 תווים) מאותה ריצה |
| 13 | Export PDF | ✓ | `new-export.pdf` (21,094,698 בתים) מאותה ריצה |
| 14 | Raster | ✓ | **כל הספר**: 691 זיווגים מדודים (לא מדגם) — `page-map.csv` עמודת raster_diff |
| 15 | Overlay | ✓ | `overlays/` — 25 עמודי מפתח (אדום=ישן, כחול=חדש) |
| 16 | Difference images | ✓ | `diffs/` — 25 עמודי מפתח |
| 17 | Page mapping | ✓ | `page-map.csv` — 723 שורות, 699↔715, סיווג 8 קטגוריות |
| 18 | Geometry comparison | ✓ | עמודות body_top/bottom, lines, ink לכל זיווג; `pitch-body.json`; `forensics.json` (כותרות 62.4pt, גדלים, גופנים) |
| 19 | Visual review | ✓ | `visual-review/` — ביקורת VLM על 7 עמודי מפתח לפני/אחרי תיקון המשקל + הפרכה כמותית של קריאה חוזרת |
| 20 | Regression review | ✓ | `regressions.csv` — Iteration-002 מול 003 על אותם 10 עמודי ייחוס + מדדים גלובליים |

## בדיקות ספציפיות שנגעו בתיקוני האיטרציה

- `s9-headers` (פוליו/כותרות/מניית TOC) — ירוק (נכשל במהלך העבודה עקב R4; תוקן בשורש והורר מחדש).
- `s9j-head-align` — 6/6 (עודכן לחוזה צריכת H1: H1 נצרך לשער; H4 בודק רב-שורות בטור). עדכון ה-fixture מתועד בקומיט.
- `s9h-fn-budget` 4/4; `s9i-aq-factor` 4/4; `s9k-marker-identity` 6/6; `s14-layout-audit` ירוק.
- `d108-bare-folio` 17/17 (מניית >999).

## רגרסיות

- **אפס רגרסיות בבדיקות**: 90/90 לפני דחיפת `2702834` ו-90/90 אחרי תיקון המשקל.
- מדדי איכות מול Iteration-002 (`regressions.csv`): מחסור-טוקנים 4,541→718 (וכולם מוסברים); מדגם הרסטר ב-10 עמודי גוף 17.08%→16.86% (מוסבר: עמודי גוף מוכתמי-reflow); עמודי מבנה: 0.02%–1.5%.
- קומיט המשקל הוא שינוי-רינדור בלבד: layoutHash זהה (`63dcb54750e760b3…`), 715 עמודים לפני ואחרי — הוכחת אי-פגיעה בעימוד.

## הערות יושר

- הכשלים ההיסטוריים של CI (layout-audit/full-math-audit שתועדו ב-handoff 19.11) טופלו בזרמים שמוזגו לענף לפני Iteration-003; סוויטת `npm test` המקומית כוללת את הבדיקות המקבילות וירוקה.
- ביקורת ה-VLM היא כלי עזר: קריאתה את עוצמת-המשקל ב-p23 אחרי התיקון הופרכה במדידת דיו ישירה (2.903%=2.903%) — ההכרעה לפי מדידה, לא לפי רושם.
