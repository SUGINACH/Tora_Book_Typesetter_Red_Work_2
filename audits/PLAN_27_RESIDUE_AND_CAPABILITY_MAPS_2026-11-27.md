# מפות שארית ויכולת — תכנית §27.1 משימות 2, 4, 5, 6, 7, 8 (27.11.2026)

**בסיס קוד נבדק:** ענף `fix/pdf-header-baseline-20261127` ב-HEAD `abfbd4a` (מסונכרן ל-origin; פריסה חיה gh-pages `e766a64` — קוד מוצר `c00a278`+).
**היקף:** קריאת מקור ידנית בלבד (grep/עקיבת require). לא הורצו בדיקות, סקריפטים, benchmark או workflows (כמתחייב).
**רמות ראיה** (לפי §27.1-11): `SOURCE_PRESENT` / `SOURCE_CONNECTED` / `LIVE_REPORTED` / `LIVE_VERIFIED` / `ARTIFACT_VERIFIED` / `USER_ACCEPTED`. היכן שלא אומת — נאמר מפורשות.

---

## 1. משימה 2 — W-2 cutover residue: מפת consumers מלאה

### 1.1 dom-renderer.js (1,011 שורות) — `SOURCE_CONNECTED`

**מייצא:** `renderPage, renderLine, scrubPUAText, bgRgba, PT_CLASS, renderSpanningBand, renderDecorations, renderPageBackgroundAndShaar, renderShaarContent, renderCustomPageContent, applyCustomStyleSpec, fontStack` (dom-renderer.js:1011).

**צרכני מוצר (בקוד חי, לא בדיקות):**

| צרכן | מה נצרך | הערה |
|---|---|---|
| `engine/output/export-api.js:21` | `renderPage` | בשימוש **רק** בתוך `exportHtml()` המורשתי (שורה 71) — נתיב שאין לו קורא מוצר (ראה 1.3) |
| `engine/output/pagemodel-dom-renderer.js:24` | `PT_CLASS, bgRgba, fontStack` | **תלות מוצר אמיתית** — המרנדר הקנוני שולף 3 עזרי-סגנון מ-dom-renderer |

**צרכני בדיקה (אורקל):** 25+ סוויטות, בהן s10-ui, s12-export, s13-acceptance, s14-layout-audit, s8d/s8e, s9c-dom-preview, s9-headers, s4b-production-path, s60, s69, s77, pipeline, s6b/s6c, s7-notes, s8-decoration, s8b, s8g, s15, s2-heading3-spacing, s24, s11-extensions, negative-controls, s13-security-a11y (git grep על `red-build/tests`).

**מצב באנדל:** המודול כולו אגוד בשני באנדלי המוצר (`engine-worker.bundle.js`, `app.bundle.js` — כולל `renderPage`, שאינו נקרא במוצר).

### 1.2 legacy-projector.js — הקובץ אינו קיים; היורש הוא geometry-projector.js (68 שורות) — `SOURCE_CONNECTED`

- הקובץ `legacy-projector.js` **אינו קיים** בענף ה-fix. המקבילה הנוכחית היא `engine/output/geometry-projector.js` — facade מעבר מתועד (כותרת הקובץ: "מצב ביניים מתועד"; הסרה בשלב 9 לאחר הוכחת parity).
- **צרכנים:** `export-api.js:143` — `projectDocument` — בתוך `exportPdf()` המורשתי בלבד (`/* node-only */`); בדיקות המייבאות `projectPage/projectLine` (לפי כותרת הקובץ).
- **נתיב ה-PDF של המוצר (`exportPdfFromModel`) אינו צורם אותו כלל** — הוא צורם את ה-PageModel ישירות (export-api.js:531+, mapping ב-560–575).

### 1.3 exportHtml (מורשתי) — export-api.js:63 — `SOURCE_CONNECTED`

- קוראי מוצר: **אפס**. `app-shell.js:714` מפרק במפורש רק `exportHtmlFromModel, exportProjectZip`, עם הערה: "W-2 (השלמת 9c.4): exportHtml של המורשת הוסר מה-destructure".
- קוראי בדיקה: s12-export (5 אתרים), s13-acceptance (2), s14-layout-audit (1).
- באנדל: קיים בשני הבאנדלים (מת במוצר).

### 1.4 exportPdf (מורשתי) — export-api.js:137–530 (~394 שורות) — `SOURCE_CONNECTED`

- מריץ **עימוד משלו** (pipeline + measure-api + font-subset + geometry-projector + pdf-writer, כולם `/* node-only */`).
- קוראי מוצר: **אפס**. `app-shell.js:754` ו-`engine-worker-main.js:114` קוראים `exportPdfFromModel` בלבד.
- קוראי בדיקה/כלים: d89-visual-fixes, pdf-targets, real-fonts, s12-export, s13-acceptance, s53-dp-notes-export, s60-monster-fixes, s4b-production-path, tools/layout-parity/run-ours.js, tools/perf-slice6.js.
- באנדל: ב-Worker (`skipNodeOnly:false` — tools/build-worker-bundle.js:24–26) הנתיב הכבד **אגוד במלואו** אף שאין לו קורא מוצר; ב-App (`skipNodeOnly:true`, שורה 33) גוף הפונקציה אגוד בלי התלויות הכבדות (חוזר `no-buffer` אם ייקרא — ואינו נקרא).

### 1.5 אין מרנדר/מנוע שני כ-fallback בנתיב החי — `SOURCE_CONNECTED`

- תצוגה: `preview-tab.js:13` → `renderModelPage` (pagemodel-dom-renderer) בלבד.
- HTML: `app-shell.js:714` → `exportHtmlFromModel`; הפונקציה זורקת "נדרש PageModel תקין — אין נתיב חלופי" (export-api.js:101).
- PDF: `app-shell.js:754` + `engine-worker-main.js:114` → `exportPdfFromModel`; שגיאת `model-required` ללא נפילה (export-api.js:536).
- סריקת קבצי הכניסה (worker-client, browser-entry, preview-tab, engine-worker-main) — אפס קריאות ל-`exportPdf`/`exportHtml` שאינן FromModel.

### 1.6 הכרעות (קביעה בלבד; לא בוצעו מחיקות — כמתחייב בתכנית)

1. **מה שאסור למחוק היום:** `dom-renderer.js` (אורקל 25+ סוויטות + 3 עזרים למרנדר המוצר), `exportHtml`/`exportPdf` המורשתיים (אורקל ~10 סוויטות; החלטת W-11 המתועדת), `geometry-projector.js` (תלות האורקל). מחיקה לפני הגירת הבדיקות = שבירת שרשרת הרגרסיה.
2. **מה ניתן להוציא מבאנדל המוצר (בטוח — אפס קוראי מוצר):**
   - א. חילוץ `PT_CLASS, bgRgba, fontStack` למודול משותף (בדפוס `line-font.js` הקיים — שכבר מאחד עזרים בין materialize למרנדרים); `pagemodel-dom-renderer` מחליף את הייבוא; `dom-renderer` ממשיך לייצא לצורך הבדיקות.
   - ב. פיצול `exportHtml`/`exportPdf` המורשתיים למודול נפרד (למשל `export-api-legacy.js`) שרק הבדיקות/הכלים מייבאים; `export-api.js` של המוצר נותר עם FromModel+ZIP בלבד.
   - ג. לאחר (ב): הוצאת `dom-renderer`, `export-api-legacy` ו-`geometry-projector` מ-`excludeSet` של שני הבאנדלים (ב-Worker נחסך נתיב העימוד המורשתי המלא; pipeline עצמו נשאר — הוא מנוע המוצר).
3. **מחיקה סופית:** רק לאחר הגירת סוויטות האורקל לנתיבי FromModel (שייך ל-CHAIN-DEBT-01/W-10), ואז גם `geometry-projector.js` יוסר כפי שמתועד בכותרתו.
4. **שיעור משקל מת:** ~1,473 שורות מקור (dom-renderer 1,011 + exportPdf מורשתי ~394 + geometry-projector 68) אגורות בבאנדל ה-Worker ללא קורא מוצר. (אמדן סטטי; לא נמדד — הרצת benchmark אסורה.)

---

## 2. משימה 4 — S74 acceptance

- **`pdf-mark-policy.js` (60 שורות, אפס תלות):** מאומת ככלל המייצג את מדיניות המדידה בלבד — מאפס רוחב /W של גליפי סימנים משולבים לפי מיפוי התו→גליף של אותו גופן-כותב; `COMBINING_MARK_RE` הוא עותק ביט-לביט של measure-api (RC-M4) והסנכרון נעול בסוויטת s74. אין בניית מילה מחדש מ-hmtx גולמי. `SOURCE_CONNECTED` + עדות בדיקה (s74: MARK_UNITS=1793, BASE_UNITS=3275, רוחב PDF ≈ רוחב מודל ±0.5pt).
- **עדות חיה קיימת (W-11, `LIVE_VERIFIED` לציר x):** מסמך ניקוד ייעודי הוזרק לעורך החי; שְׁמַע ב-ToraWin ‏27.6pt = בדיוק סכום האותיות (10.63+8.78+8.19); זהות מול ה-DOM החי 27.58px⇒pt (פער 0.07%); הצמדה ב-x ‏2/2 ו-3/3 סימנים; בגוף 273/274.
- **הצמדה ב-y — אומתה גאומטרית (28.11, משימה 9): `ARTIFACT_VERIFIED`.** מסמך ניקוד ייעודי הוזרק לאתר החי (מילות-חלון מנוקדות כולל טעם U+05A8 — מקרה W-11 המדויק — ומילות גוף מנוקדות עם טיפחא U+0596); יוצא PDF אמיתי; ‏pdffonts מראה **ToraWin מוטמע** (גופן החלון מצויר בפועל). השוואת פרופילי-דיו DOM↔PDF בחיתוכי-דיו הדוקים (נטולת-יישור): **קורלציות 0.946 / 0.859 / 0.964 / 0.977** לארבע מילות המטרה — הניקוד מעל האותיות באותם גבהים יחסיים בשני הייצוגים; פסי-סימנים מעל פס-האותיות בכל החיתוכים; רוחבי-דיו גוף זהים (1.000/1.024). מילת החלון עם הטעם: ‏FrankReal ב-DOM (w--window) **וגם ב-PDF** — תצוגה=ייצוא לאחר W-11. Artifacts: nikud_book.pdf, domcrop_*/pdf_word_*/aligned_*, s74y_*.json (פריסה c567e88).

---

## 3. משימה 5 — S75 body-first: **הושלם** (29.11 — פורט 7f580ac בענף התיקונים)

- **דרישת המשתמש (S75, מאושרת):** הגוף זורם תחילה; הערות השוליים תופסות את החלל שמתחת עד תקרה 50%; המשכים/סמנים זהים.
- **המצב לאחר הפורט (7f580ac):** `fn-placement-mode` ברירת מחדל **body-first**, הפקד פעיל (unifiedSupport הוסר); SSOT ב-footnote-budget (bodyFirstCaps/bodyFirstStartsFloorPx/bodyFirstBudgetPx — clamp קפוא בשעת ההתחייבות); dp-planner: תקציב-מילוי דינמי (הגוף לעולם אינו נדחק), finalizeBodyFirstNotes בסגירת עמוד (הצבה לפי תחתית-הגוף בפועל; פיצול בגבול שורה; המשכים בראש העמוד הבא), splitNoteAtRow מאוחד.
- **הוכחות ידניות (E2+E3+E4):** legacy==pre-port ביט-לביט (sha256 c5ccb874…); body-first דטרמיניסטי (fa85f716…); מסמך עתיר-הערות: אפס חפיפות, מרזבים 13.8–27.8% מתחת לתקרה, מלאי 100/100; very_long: 677 עמ' (מול 691), מלאי מלא, אחרון שלם; התאוששות גדול→קטן תקינה. פירוט מלא ברשומת ה-Worklog של 29.11 בענף התיקונים.
- **הכרעת משתמש חדשה: לא נדרשה** — אישור S75 המקורי קוים. `SOURCE_CONNECTED` + `LIVE_VERIFIED` (מקומית, באנדלים אמיתיים) + `ARTIFACT_VERIFIED` (PDF).

---

## 4. משימה 6 — מפת יכולת Images/DOCX/רקעים (input→model→planner→PageModel→DOM/HTML/PDF)

כלל התכנית: "אין לסמן תמיכה אם קובץ מוצג ב-DOM אך חסר ב-PDF."

### 4.1 תמונות inline (D-107ג)

| שלב | מצב | אסמכתא |
|---|---|---|
| קלט (parser) | ✓ | `parser/inline-content.js:158` — run מסוג image עם sourceText |
| מודל | ✓ | `model/document-model.js:144`, `model/kinds.js:20` (IMAGE), `model/validate.js:137` |
| נכסים | ✓ ב-Worker | `assets/asset-resolver.js` (content-addressed; PNG/JPG/JPEG/GIF/BMP/WebP/SVG) + `engine-worker-main.js:61` (`AssetResolver.fromTransport`, דוח דחיות גלוי) |
| מדידה | ✓ | `measure-api.js:756` — measureItem לתמונה דרך ה-resolver |
| מנוע שורות | ✓ חלקי | `line/breaks.js:112-115` — תמונה כפריט אטומי; `line/pipeline-bridge.js:49,349-371` — מיפוי לתיבת מילה |
| PageModel | ✓ | `core/page-model.js:288-330` — מערך `images` עם גאומטריה סופית (float: צד+תיבת עמודה+שורת עוגן; inline: תיבת המילה) |
| DOM | ✓ | `output/pagemodel-dom-renderer.js:370+` — ציור עם resolveAssetRef + אבחונות (pmr-image-without-geometry / asset-unresolved) |
| HTML | ✓ | דרך renderModelPage בתוך exportHtmlFromModel |
| **PDF** | **✗** | **`export-api.js:560-575` — מיפוי העמודים מעביר lines/footnotes/folio/header/decorations בלבד; `mp.images` אינו מועבר; ל-pdf-writer אין ציור תמונות inline** |

**פסק:** תמונות inline = DOM/HTML בלבד; **חסרות ב-PDF ⇒ אין לסמן תמיכה.**

**כניסת נכסים במוצר: ✗** — `app-shell.js:461` שולח ל-typeset רק `text, settings` (בלי assets); אין UI לייבוא ZIP עם טקסט+תמונות או בחירת תיקייה (דרישת D-107ג); `register-assets` משמש לעיצובי SVG בלבד (imud-library). פרוטוקול ההובלה קיים ומוכן (`asset-transport-v1`, worker-client.js:179-208) אך אין שולח מוצר.

**גלישת טקסט סביב תמונה (D-107ג, מודל גאומטרי): ✗** — אין מנגנון wrap/bands במנוע השורות; תמונות אטומות בשורה; float ממוקם בצד+עמודה אך אין מסלולי טקסט דו-צדדיים.

**תמונות בהערות שוליים (D-107ג): ✗** — אין טיפול תמונה ב-notes/footnote-lanes.

### 4.2 DOCX — w:drawing/relationships/media: **✗ בקלט**

`import/docx-import.js` — אפס מופעי w:drawing/image/media/png/jpg (grep). ייבוא DOCX = טקסט בלבד. תמונות DOCX אינן מיובאות כלל.

### 4.3 תמונות עמוד מותאם (custom pages)

מודל ✓ (`page-model.js:356` custom.images), DOM ✓ (`pagemodel-dom-renderer.js:244` class custom-image), **PDF ✗** (אינן במיפוי הייצוא). סכמת ההרחבות כוללת מערך `images` מאומת בייבוא (`extensions/extensions-io.js:65,71`, `validateImages` ב-style-schema.js:274) — ערוץ הקלט המאומת היחיד לתמונות, אך היעד שלהן (עמודים מותאמים) אינו מגיע ל-PDF.

### 4.4 דיו-תמונה בעיטורים (d.image)

DOM ✓ (`pagemodel-dom-renderer.js:139-141` דרך resolveAssetRef), **PDF ✗** — מסנן העיטורים בייצוא (export-api.js:566) משאיר רק `d.raster` או `pdfOps`; `rasterizeModelDecorations` מרסטר **SVG בלבד** (svg-raster.js:83-84 — `ink.type !== 'svg' ⇒ continue`).

### 4.5 עיטורי SVG (שערים) — הדפוס המוכח

DOM ✓, HTML ✓, **PDF ✓** דרך רסטר: svgNeedsRaster → JPEG (DCTDecode XObject, pdf-writer.js:288-342). זהו דפוס שלוש-הנתיבים היחיד המוכר (1be7671).

### 4.6 רקעים (W-8 — פתוח)

רקע rect (מילוי) → pdfOps ✓ שלושה נתיבים; רקע SVG עשיר → רסטר ✓; **רקע תמונה → ✗ ב-PDF** (כמו 4.4). W-8 ("עיצובי רקע בשלושה נתיבים") נותר פתוח כמתועד.

---

## 5. משימה 7 — מפת נקודות כניסה Settings/import וכיסוי ה-sanitizer

| # | נקודת כניסה | אסמכתא | חיטוי/טרנספורם |
|---|---|---|---|
| 1 | ייבוא TXT | browser-entry.js onRequestTxtImport → onDocumentAction('import-txt') | לא רלוונטי (טקסט בלבד) |
| 2 | ייבוא DOCX | browser-entry.js onRequestDocxImport → importDocxFile → docx-import | טקסט בלבד; **בלי תמונות** |
| 3 | ייבוא הרחבות JSON | extensions-panel.js:112 → importExtensions (extensions-io.js:47) | אימות סכמה מלא all-or-nothing; פורמט/JSON/סגנונות/עמודים/תמונות — דחייה מאובחנת בעברית |
| 4 | תבנית JSON | app-shell.js:854 loadTemplateJson → legacy-settings-map importImudSettings + translateLegacyValue | **W-5 F-J1**: ערך בלתי-חוקי מתורגם דרך disposition או חוזר לברירת מחדל, עם תיעוד פעולה; אומת קצה-לקצה (gematria→hebrew, bogus→default) |
| 5 | פרויקט ZIP | export-api.js:786 importProjectZip → project-io importProject | **W-5 F-J1** — אותו חיטוי בשני הנתיבים |
| 6 | השתמרות הגדרות (localStorage) | settings-persistence.js (browser-entry.js:106) | הפרש מול בסיס + אימות פורמט/גרסה קפדני; JSON שבור ⇒ אין שחזור. **חיטוי פר-מפתח בשחזור אינו קיים במודול עצמו** (הערכים אומתו ברישום בזמן השמירה; עריכת-יד של ה-localStorage עוקפת) — תצפית שארית, סיכון נמוך |
| 7 | רישום גופן לעובד | engine-worker-main.js handleRegisterFont → font-resolver | זהות content-addressed, כניסה יחידה (תיקון PR #22) |
| 8 | רישום עיצובים (SVG) | register-assets → asset-registry | חיטוי svg-sanitize בתוך הרישום |
| 9 | נכסי מסמך ל-typeset | worker-client.js:184+ (asset-transport-v1) | דוח תחבורה גלוי בעובד; **אין שולח מוצר** (app-shell אינו מעביר assets) |

**מגבלת W-7 (כהערת התכנית):** סורק ה-ghostKeys הוא literal-only (גישות `settings['key']` מילוליות + INTERNAL_KEYS מתועדת) — הוא אינו הוכחת כיסוי כללי (גישה דינמית/מפתח נגזר אינה נסרקת). הכיסוי שנבדק כאן הוא מיפוי נתיבי הכניסה והחיטוי המופעל בכל אחד — לא הוכחת שלמות גלובלית.

---

## 6. משימה 8 — ביצועים P-2/P-3 (סקירת קוד בלבד; לא הורץ דבר)

- **P-2 — פתוח (כמתועד):** מסקירת הקוד, `measure-api.js:515,577-613` — מפתחות ik3 דרך `_fastKeyHash` + memo מסלול-סביבה במקום sha256 (הוזלת הטופס, −10.6%..−18.5%, פלט זהה-ביט לפי התיעוד). **חוב מספר הקריאות ×7.6–12.8 עצמו נותר בענף** — פתוח עד הכרעה (חוזה 9C.3; PERF_MEASURE_API_ROOT_CAUSE_2026-11-19 §5). לא נמדד כלום בסשן זה.
- **P-3 — נפתר בענף ה-fix (תיקון פסק SPLIT/2):** המיון הכפול של בדיקת שימור התוכן **הוחלף** בהשוואת multiset מבוססת-מונה — `pipeline.js:1271-1285`: `cnt()` (reduce למפת מונים) + איחוד מפתחות ב-Set, ללא sort כלל. ההחלפה נכנסה ב-`2ae45b9` (W-1, "make unified layout engine sole engine"), ומתועדת גם כתיקון D-83 (קריסת "Maximum call stack size exceeded" מעל 125,154 מילים ב-sort+join). **שורת P-3 ב-SPLIT/2 אינה עדכנית ל-HEAD abfbd4a** — לעדכון בפנקס הטענות.
- **very_long באתר החי:** ה-W-11 רשם עימוד חי של 489 עמודים וייצוא PDF עם 0 שגיאות קונסולה, אך **זמני תגובה לא תועדו במספרים**. יתועדו במהלך האימות החי (משימה 9) אם יימדדו בשימוש רגיל — כנדרש.
- **W-9:** נותר פתוח; איני מסווג אותו אופציונלי מטעם עצמי (כהוראת התכנית).

---

## 7. סיכום רמות ראיה

| טענה | רמה |
|---|---|
| מפת consumers (1.1–1.5) | SOURCE_CONNECTED (עקיבת require ידנית מלאה) |
| הכרעות הוצאה מבאנדל (1.6) | קביעה מבוססת-מקור; טרם בוצעה |
| pdf-mark-policy = מדיניות מדידה בלבד (2) | SOURCE_CONNECTED + בדיקות |
| S74 הצמדה ב-x | LIVE_VERIFIED (W-11) |
| S74 הצמדה ב-y | **ARTIFACT_VERIFIED (28.11 — קורלציות 0.86–0.98, ToraWin מוטמע)** |
| S75 body-first | הושלם (29.11, 7f580ac) — LIVE_VERIFIED+ARTIFACT_VERIFIED; legacy קפוא ביט-לביט |
| תמונות inline: DOM/HTML ✓ PDF ✗ | SOURCE_CONNECTED |
| נכסי תמונה: אין כניסת מוצר | SOURCE_CONNECTED |
| DOCX תמונות: לא נתמך בקלט | SOURCE_CONNECTED |
| מפת כניסות import + חיטוי (5) | SOURCE_CONNECTED (F-J1 גם אומת E2E בעבר) |
| P-2 פתוח | SOURCE_CONNECTED |
| P-3 נפתר (2ae45b9) | SOURCE_CONNECTED (תיקון פסק) |

**מה לא אומת במסמך זה:** קבלת משתמש מפורשת (עדיין נדרשת להכרזת Production). עדכון 28.11: הצמדת-y של S74 אומתה במשימה 9 (לעיל); זמני תגובה בפועל תועדו באימות החי (אתר 9.9–10.3s; עימוד 489 עמ' 14.8s, ‏691 עמ' 29.0s; ייצוא PDF ‏20MB ‏2.6s; מסמך קצר 7–8s; אפס שגיאות קונסולה) — חוב המדידה ×7.6–12.8 (P-2) עצמו נותר פתוח כיוון שאינו זמן-קצה אלא מסקירת מספר-קריאות.
