# SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT — אודיט מלא של הגדרות, מזהי טקסט, תוויות, קידומות וברירות מחדל (שלב 1)

> **Commit:** `95e829d44e88f436c9397d82473cd9e2f4a698aa`. הפניות ל־`red-build/src/` אלא אם צוין.
> **שיטה:** מיפוי מלא (לא דגימה): קריאת כל המודולים הרלוונטיים + ספירה מתוסרפת על המודולים האמיתיים + הצלבת rg של כל מפתח רישום מול כל `red-build/src` (קריאה מילולית וקריאות משפחתיות `heading-${level}-*`, `header-${side}-${pos}-*`, `toc-level-${n}-*`).
> **היקף:** 253 הגדרות רישום · 265 מפתחות `default_settings.json` · 161 רשומות DISPOSITIONS + 15 FAMILY_RULES · 3 ערכות סגנון · ~42 מזהי טקסט של הפרסר · תבניות טקסט מיוצרות · 34 קבועים מוקשחים המתנהגים כהגדרות. **הכל מתועד בנספחים א׳-ב׳ בסוף המסמך (טבלאות מלאות).**

---

## 1. ספירות מפתח (עם ראיות)

| ממד | ספירה | ראייה |
|---|---|---|
| הגדרות ברישום | **253** (+1 נגזרת `settings_version`) | `settings-registry.js:34-311`; `getDefaultSettings()` → 254 מפתחות |
| פאנלים | **13** (11 הגדרות + 2 פעולה: BUILDER, IMPORTS) | `bindings.generated.js` PANELS; `settings-registry.js:5-23` |
| כיסוי תוויות | **253/253** תוויות עבריות; 0 חסרות; 0 יתומות; 0 כפולות; 0 סחיפת ברירות | `bindings.generated.js:7` + הצלבה מתוסרפת |
| סוגים | enum 52 · number 63 · font 29 · color 28 · bool 51 · string 30 | סריקת רישום |
| אימות עצמי | מזהה/בקרה כפולים ⇒ throw | `settings-registry.js:314-321` |
| מפתחות `default_settings.json` | **265** — 0 ללא disposition (כיסוי 100%) | `legacy-settings-map.js:383-469` |
| DISPOSITIONS | **161** (mapped 118 · merged 16 · ui-state 24 · removed 3) + 15 FAMILY_RULES | `legacy-settings-map.js:101-362` |
| דוח ייבוא ברירות | mapped 119 · merged 16 · uiState 127 · removed 3 · **unmapped 0** | הרצה על הקטלוג המוטמע (1,721 משפחות) |
| מקור מורשת למפתחות רישום | 134 עם מקור; **119 RED-native** | נספח א׳ |
| סטיות ערך (מיובא ≠ רישום) | **67** | §3 |
| ערכות סגנון (תלמוד/פרשנות/קונטרס) | 249 מפתחות כ"א; 0 לא ממופים | §5 |
| מזהי טקסט קבועים של הפרסר | **~42** | §6 |
| פסאודו-הגדרות מוקשחות | **34** | §8 |

## 2. מבנה הרישום וכיסוי צרכנים

- פקטורי `K(id,type,dflt,panel,control,consumers,testId,extra)` (`settings-registry.js:26-27`); כל רשומה נושאת פאנל, בקר, `consumers` (מזהי מנגנון) ו־`effect_test`.
- פילוח לפי פאנל: GRID 21 · TYPO 17 · NOTES 21 · HEADINGS 32 (8 רמות×מצב/גופן/צבע/גודל, `flatMap:96-103`) · HEADERS 51 (6 סלוטים×7 + מתגים, `:130-139`) · QUALITY 20 · ORNAMENTS 18 · TOC 20 · THEMES 44 · ADVANCED 8 · EXPORT 1.
- `derivePlacementFlags` (`:341-352`): `endnotes` מאלץ `endnotes-enabled=true`+`footnotes-enabled=false`; אחרת קלט משתמש נשמר (D-39/P0-4).
- **כיסוי צרכנים:** 40 מפתחות נקראים דרך משפחות תבניות (`heading-${level}-*` — `pipeline.js:312-314`, `dom-renderer.js:122/825/945/1241`, `geometry-projector.js:682-683`, `legacy-projector.js:209/232/598/601`, `line-font.js:21/33`; `header-${side}-${pos}-*` — `headers-builder.js:138-160`; `toc-level-${n}-show/inline` — `toc-builder.js:78/85/290/299`). הסורק העצמי מכסה זאת (`src/audit/scanners.js:39`). **מסקנה: לכל אחת מ־253 ההגדרות צרכן חי; אפס יתומות.**
- כתיבה: פאנל גנרי (`settings-panel.js:184-212`) → `app-shell.onSettingChanged` (`app-shell.js:157`); איפוס פר-שדה; מסלולים גורפים (ברירות מורשת `:202-217`, תבנית `:744-779`, ערכה `settings-panel.js:354-370`); השתמרות כהפרש-מעל-בסיס (`settings-persistence.js:82-96`, D-94).

## 3. רישום מול `default_settings.json` — 67 הסטיות (ראשי הפריטים; הטבלה המלאה בנספח א׳)

**עובדה מבנית:** קובץ ה־JSON הוא קובץ ההגדרות של המקור (אוצר מילים מורשת: `f-sh-title`, `prop-col`, `hdr-r-type`), לא פלט של הרישום. האפליקציה **מאתחלת עם ייבוא שלו** (`browser-entry.js:167-190`) — לכן **ברירות המחדל האפקטיביות במוצר = הערכים המיובאים**; ברירות הרישום מופיעות רק בהקשרי Node/בדיקות/RED חשופים.

סטיות מייצגות (67 בסה"כ, כולן מתועדות בנספח א׳ עם דגל ≠):

| מפתח | מיובא | רישום | הערה |
|---|---|---|---|
| `body-font` | `Guttman Rashi` | `Frank Ruhl Libre` | D-91(ד) — האתחול החי הוא Guttman Rashi |
| `body-font-size-pt` / `body-line-height` | 12 / 1.34 | 14 / 1.4 | מתועד (`legacy-settings-map.js:104`) |
| `heading-{0..7}-font` | AlphaBlack/Lia Sgula/... | `David HB` ×8 | D-91(ה) — בפועל נמדד/מרונדר DavidLibre-Bold בזרימת המורשת |
| `heading-{0..7}-size-pt` | 26/50/17/…/6 | 20/18/16/…/12 | `s-h1=50` ו־`s-h7=6` חריגי טווח — נשמרים עם דיווח |
| `h2-top-offset` | 229 | 33 | `h2-top-distance:"22%"`→px |
| `aq-enabled` | **true** | false | ברירת המחדל החיה = AQ דלוק (S6.3) |
| `toc-detail-enabled` | true | false | |
| `page-num-format` | `gematria` | `hebrew` | ⚠ מחוץ ל־enum של RED — עובד רק דרך ענף `default:` (ראה F-J2) |
| `header-*-source` | book-name-first-half/h2/second-half | book-name/h2/h1, h1/h2/book-name | S77; `hdr-verso-c-type` **לא ממופא בכוונה** (`legacy-settings-map.js:195-197`) |
| `shaar-title-font` | `Lia Sgula` | `Bellefair` | resolveStack בוחר את המשפחה אם בקטלוג — הערת הרישום (`settings-registry.js:258` "אינה זמינה") **מיושנת** (F-J4) |
| `first-word-font/size-em/threshold-lines` | FrankReal/1.5/2 | ריק/2/3 | |
| `footnote-separator-rule` | `star` | `regular` | |
| `runt-min-width-pct` | 20 | 50 | |
| `toc-level-{3..6}-show` / `{4..7}-inline` | true / false | false / true | נגזרות מרשימות gtoc/dtoc (`:461-466`) |

## 4. `legacy-settings-map.js` — ממצאי התנגשויות

1. **F-J1 · מפתחות אוצר-מילים כפול (13)** — `page-num-position`, `page-num-format`, `page-num-frame`, `page-num-start-idx`, `page-num-initial-value`, `body-last-line-align`, `en-line-prefix`, `fn-delim-open/close`, `general/detailed-toc-count/show-numbering` — קיימים בשתי השפות. בנתיב ייבוא תבנית (`app-shell.js:756-759`) מפתחות שהם מזהי רישום **עוקפים את טבלת ה־disposition** — `page-num-position:"bottom_outer"` (איות מורשת) עובר גולמי, `mergeWithDefaults` מדווח not-in-enum אך **שומר** (`project-io.js:52-56`, kept:true) — ערך enum בלתי-חוקי עלול להגיע למנוע. אותו קלט דרך `loadSettingSet` כן עובר `NUMPOS_MAP` — **שתי תוצאות שונות לאותו קלט לפי נקודת הכניסה.**
2. **F-J2 · `page-num-format:'gematria'`** — לא ב־enum של RED (`['hebrew','decimal','daf-hebrew']`, `settings-registry.js:46`); שורד רק כי `folio.formatPageNumber` מטפל בכל דבר שאינו decimal/daf-hebrew כעברי (`folio.js:55-61`). עובד במקרה, לא לפי חוזה.
3. **F-J3 · 8 מפתחות DISPOSITIONS כפולים מילולית** — `s-h0`(155/324), `s-h1`, `s-sh-title/sub/desc/sec/author/year` — דריסה שקטה של מאוחר על מוקדם (זהותיים כרגע; מלכודת תחזוקה).
4. מיזוגים רבים-לאחד מאבדים (מתועדים עם מזהי בעיה): `main/back/sub-shaar-count-*` → `count-shaar-pages` (EXT-18); `avoid-orphans/widows` → חצי-עליון בלבד (`:257-258`); `aq-word-spacing` → `aq-enabled`; `h2-ornament-set`+`h2-title-ornament-*` → `h2-orn-top/bottom`; `h3-ornament-r/l` → `h3-side-orn` יחיד.
5. `h2-title-orn-mode` ב־`onlyIfAbsent` — שומר על חד-משמעות (`:265,396-398,417`).

## 5. ערכות סגנון (`setting_sets/{תלמוד,פרשנות,קונטרס}.json`)

- 249 מפתחות בכל ערכה: 13 RED-native (אוצר-מילים כפול) · 110 ממופים · 126 ui-state/removed · **0 לא ממופים** — אין no-op שקט.
- 9 מפתחות בערכות שאינם ב־default_settings.json (כולם מחרוזות ריקות, `^file-`/`^assets-folder-` → ui-state).
- **הבדלי הערכות: 17 מפתחות בלבד** — `size-body` 10/10.5/13 · `line-height-body` 1.25/1.28/1.4 · `body-last-line-align` right/center/right · `drop-word-mode` none/window/window · `s-h0` 22/24/30 · `s-h1` 40/44/56 · `s-h2` 14/15/20 · `s-h3` 11/12/15 · `s-h4` 10.5/11/14 · `s-h5` 10/10.5/13 · `s-h6` 9.5/10/12 · `fn-columns` 2/2/1 · `s-note-body` 7/7.5/8.5 · `prop-col` 36/38/42 · `prop-margin` 5/6/8 · `prop-gutter` 2/2/3 · `prop-gap` 1/1.5/3 · `page-num-position` bottom_outer/bottom_center/bottom_center.
- ⚠ `page-num-position:"bottom_outer"` (תלמוד) — בטוח דרך loadSettingSet, מסוכן דרך נתיב התבנית (F-J1). `page-num-format:"gematria"` בכולן (F-J2).

## 6. מזהי טקסט של הפרסר (~42; הטבלה המלאה בגוף העריכה של הסוכן — מרוכזים כאן)

**דקדוק כותרות** (`dfa-lexer.js:21`): `כותרת N - טקסט` (N=0..7) · `חלק <גימטריה> - טקסט` (רמה 1; ⚠ אות החלק נשמטת מטקסט הטוקן — `block-tokenizer.js:67-68`; המורשת ממספרת חלקים בעצמה `shaar-pages.js:112-131`) · `הקדמה - טקסט` (רמה 0).
**מטא־נתונים** (`dfa-lexer.js:13-19,69-83`; שלב PREAMBLE בלבד): ארוכים — `שם הספר`, `נושא`, `נושא מפורט`, `פרטי מהדורא`, `שם המחבר`, `מקום ושנת הוצאה`, `שמירת זכויות`, `פרטי הוצאה לאור`, `פרטי קשר`, `פרטים נוספים`; קצרים — `ספר`, `מחבר`, `מהדורא`, `מקום`, `שנה`, `מהדורה`, `editors`, `title`.
**הערות** (`dfa-lexer.js:24,32-38`; `block-tokenizer.js:44-92`): תחילית תוכן הערת-סיון (ברירת מחדל `הערת סיום -`, ניתנת להגדרה דרך `en-line-prefix`; `''` מכבה) · ממוספרת `הערת סיום-<n> - טקסט` (D-40) · כותרת מחלקה `הערות סיום - טקסט` · סוגרי הערה `[ … ]` (`fn-delim-open/close`; רווחים→E000 אטומי) · צורה עברית `]ם`.
**עריכה**: `##טקסט##` editorial (`block-tokenizer.js:93-99`).
**זיהוי אוטומטי**: דיבור המתחיל `^(.+?[.׃])\s+(.*)$` / `^(.+?\s*[-–—])\s+(.*)$` (`pipeline.js:54-59,380-384`).
**סנטינלים פנימיים** (לא מוקלדים ע"י משתמש): E000 אטום · E101 סוגריים · E102 סמן · E103/E104 סגנון מותאם (`pipeline.js:46-52`).
**מספור**: סגנוני סמן hebrew-geresh/decimal/parenthesis/asterisk (`markers.js:25-43`); מדיניות איפוס continuous/page/section/part (`markers.js:52-72`; מורשת `fn-reset-mode` ברירת מחדל `siman` — `legacy-imud-flow.js:907`).
**סגנונות מותאמים** (`extensions/style-schema.js`): טריגרים linePrefix/inlineMarker/pattern/combinator + layoutMode + counters.
**נבדק ולא נמצא (שליליים):** אין הוראת שבירת-עמוד בטקסט המקור (עמודים נובעים ממצבי כותרת/שערים); אין תחביר טווח-גופן inline (מיתוג גופן לפי רמת כותרת+סגנונות בלבד); אין הוראות TOC במקור (נוצר מזרם הכותרות).

## 7. תבניות טקסט מיוצרות — עקביות הלוך-וחזור

- **מחולל מסמך הבדיקה** (`test-doc-generator.js:310-328`): פולט `שם הספר - …`, `נושא - …`, `כותרת 2..7 - …`, `הערת סיום - …`, `הערות סיום - …`, `[note]`, `(parens)` — **כל מזהה שהוא פולט עובר round-trip**. פערי כיסוי (לא נפלטים): `כותרת 0/1`, `הקדמה`, `חלק`, הערות-סיום ממוספרות, `##…##`, טריגרים מותאמים.
- **שערים** (`shaar-content.js:66-91`): בס״ד/כותרת/משנה/תיאור/סעיפים/מחבר/שנה; ⚠ פיצול כותרת חלק מניח מקף (`splitPartTitle:33-42`) בעוד HEADING_RE כבר צרך את הראשון.
- **כותרות עליונות** (`headers-builder.js:62-166`): 12 מקורות (book-name-split, h1/h2, page-num, `f – l`...); גיליון (`folio.js:16-78`): גימטריה לפי D-37, מסגרות `(N)`/`[N]`/`❦`/`◇`.
- **TOC** (`toc-builder.js:141,267-281`): `טקסט … נקודות … עמודון` — העמודון בפורמט גיליון ללא מסגרת.

## 8. קבועים מוקשחים המתנהגים כהגדרות (34; לא ברישום — בלתי-נראים למשתמש)

כולם ב־`legacy-imud-flow.js` (הפרופיל החי) אלא אם צוין: **GEO** — PAGE_W/H 793.7/1122.5, COL_W 269.41, COL_R_X/COL_L_X 403.61/120.72, MARGIN_*, **FLOW_TOP 107.2, FLOW_H 915** (`:36-44`) · **SZ** — גדלים · HEADING_MODES · **FIT_EPS=0.75** (`:406`) · **GAP_COMPRESS_FLOOR=2** · **ALIGN_COMPRESS_MAX=30** · **LINE_DEMERIT=100** (kp-linebreak) · תקרות FN · תקציבי TOC · תיבות שער (GATE_BOX מוכפל DOM↔PDF) · מדדי DavidLibre מוקשחים (`dom-renderer.js:767`) · `RED_ENABLE_STRETCH_RECLAIM` (משתנה סביבה) · justify תמיד-דלוק (שלושת נתיבי הפלט).

## 9. אימות החלטות משתמש בקוד (הכל נוכחי)

| החלטה | אימות |
|---|---|
| D-91 fn-layout-mode=continuous | ✅ `settings-registry.js:148` |
| D-91 מספור פר-פרק 'section' | ✅ `:145` (+מיפוי siman→section `:240`) |
| D-91 תקרת מרזב = קיבולת עמוד | ✅ FN_FULL_CAP_PX (`legacy-imud-flow.js:900-904`; הערה: body-first של S75 הופך את התקרה האפקטיבית ל־50% מ־FLOW_H) |
| D-94 השתמרות כהפרש | ✅ `settings-persistence.js:82-96` |
| D-96 `json_theme_40` באתחול | ✅ json:3 → `browser-entry.js:175-182` → `ensureThemeSet(40)` (`imud-library.js:418-436`) |
| D-101/D-106 stretchLastBlockToBottom דלוק | ✅ `legacy-imud-flow.js:786-788,2409-2410`; alignColumnBottoms `pipeline.js:661-670`; RED_ENABLE_STRETCH_RECLAIM רק למשיכת-זנב |
| justify כברירת מחדל | ✅ מוקשח בשלושת הנתיבים (`dom-renderer.js:935-939`, `html-export.js:47`, `legacy-projector.js:106/352/357/406`) — אין הגדרה מכבה |

## 10. סטיות/ליקויים לטיפול (לתיעוד בלבד בשלב 1 — ללא שינוי ערכים)

| מזהה | חומרה | תיאור | פעולה נדרשת |
|---|---|---|---|
| F-J1 | בינונית | עקיפת disposition בנתיב תבנית ל־13 מפתחות אוצר-מילים כפול ⇒ enum בלתי-חוקי עלול להגיע למנוע | תיקון שורש בשלב 2+ (נתיב אחד לכל קלט); בדיקת שלילה |
| F-J2 | נמוכה | `gematria` מחוץ ל־enum — עובד דרך `default:` במקרה | תיעוד או הרחבת enum בהכרעה |
| F-J3 | נמוכה | 8 מפתחות DISPOSITIONS כפולים | ניקוי |
| F-J4 | נמוכה | הערת רישום מיושנת לגבי Lia Sgula | עדכון הערה |
| F-J5 | מבנית | **שתי שכבות ברירות מחדל** (רישום מול ייבוא) — 67 סטיות אפקטיביות; כל בדיקת "ברירת מחדל" חייבת להצהיר איזו שכבה | הכרעה פתוחה OQ-12 לפני חוזה המדידה של שלב 3 |

---

## נספח א׳ — טבלת 253 ההגדרות המלאה
## נספח ב׳ — טבלת 161 רשומות DISPOSITIONS המלאה

(הנספחים מופיעים להלן; נוצרו בסריקה מתוסרפת על המודולים האמיתיים ב־commit הנ"ל.)
## Appendix A — Full settings table (253 rows)

Legend: **imported value** = value produced by importing `default_settings.json` through the disposition table with the embedded font catalog; **≠** marks deviation from the registry default; **legacy source** = the default_settings.json key(s) mapping to this key; **declared consumers** = registry `consumers` field (three-layer contract); **read-by** = rg evidence of files referencing the key (literal or family template — top 3 shown); **affects layout** = audit classification (YES / YES (parsing) / YES (folio) / YES (numbering) / YES (decoration budget) / conditional / visual-only / no).

("panel" column shows the Hebrew panel name; written-by is uniform for all rows: settings-panel.js control → app-shell.onSettingChanged, plus reset button, template/style-set/legacy-defaults bulk paths, and diff-persistence — see §1.2.)

| # | key | type | default (registry) | imported value (default_settings.json via disposition) | legacy source key(s) | label (He) | panel | declared consumers (registry) | read-by (rg evidence) | affects layout |
|---|-----|------|--------------------|----------------------------------------------------|------------------------|------------|-------|------------------------------|-------------------|----------------|
| 1 | `page-size` | enum | `"A4"` | — | — | גודל עמוד | רשת העמוד ומספור | layout/page-templates | engine/core/legacy-settings-map.js<br>engine/layout/page-templates.js<br>engine/output/export-api.js | YES |
| 2 | `grid-col-width-pct` | number | `40` | — | — | רוחב טור (%) | רשת העמוד ומספור | layout/column-flow | engine/layout/column-flow.js<br>engine/layout/page-templates.js<br>engine/output/project-io.js | YES |
| 3 | `grid-margin-side-pct` | number | `7.5` | — | — | שוליים צדדיים (%) | רשת העמוד ומספור | layout/page-templates | engine/layout/page-templates.js<br>engine/output/project-io.js | YES |
| 4 | `grid-gutter-pct` | number | `2` | — | — | מרווח בין טורים (%) | רשת העמוד ומספור | layout/column-flow | engine/layout/column-flow.js<br>engine/layout/page-templates.js<br>engine/output/project-io.js | YES |
| 5 | `grid-block-gap-pct` | number | `2` | — | — | מרווח בין בלוקים (%) | רשת העמוד ומספור | layout/candidate-generator | engine/layout/column-flow.js<br>engine/layout/dp-planner.js | YES |
| 6 | `margin-top-px` | number | `20` | — | — | שוליים עליונים (px) | רשת העמוד ומספור | layout/page-templates | engine/layout/page-templates.js | YES |
| 7 | `margin-bottom-px` | number | `20` | — | — | שוליים תחתונים (px) | רשת העמוד ומספור | layout/page-templates | engine/layout/page-templates.js | YES |
| 8 | `binding-offset-px` | number | `0` | — | — | שולי תפירה (px) | רשת העמוד ומספור | layout/page-templates | engine/decoration/toc-builder.js<br>engine/layout/page-templates.js | YES |
| 9 | `h2-top-offset` | number | `33` | `229` **≠** | h2-top-distance | מרחק עליון H2 (px) | רשת העמוד ומספור | layout/page-templates | engine/core/legacy-settings-map.js<br>engine/decoration/ornament-plan.js<br>engine/layout/dp-planner.js +1 | YES |
| 10 | `column-divider-style` | enum | `"none"` | `"none"` | col-divider-style | סגנון מפריד טורים | רשת העמוד ומספור | decoration/dividers | engine/core/legacy-settings-map.js<br>engine/decoration/dividers.js<br>engine/output/dom-renderer.js +1 | visual-only |
| 11 | `page-num-format` | enum | `"hebrew"` | `"gematria"` **≠** | page-num-format | תבנית מספור עמודים | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/output/project-io.js | YES (folio) |
| 12 | `page-num-frame` | enum | `"none"` | `"none"` | page-num-frame | מסגרת מספר עמוד | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/output/dom-renderer.js +2 | YES (folio) |
| 13 | `page-num-position` | enum | `"bottom-center"` | `"bottom-center"` | page-num-position | מיקום מספר עמוד | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/layout/page-templates.js +3 | YES (folio) |
| 14 | `page-num-initial-value` | number | `1` | `1` | page-num-initial-value | ערך התחלתי של מספור | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/decoration/numbering-audit.js +1 | YES (folio) |
| 15 | `page-num-font` | font | `"ליבורנה מודגש"` | — | — | גופן מספר העמוד (ריק = גוף) | רשת העמוד ומספור | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js<br>engine/output/legacy-projector.js +2 | visual-only |
| 16 | `page-num-size-pt` | number | `11` | — | — | גודל מספר העמוד (pt) | רשת העמוד ומספור | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js<br>engine/output/legacy-projector.js | visual-only |
| 17 | `page-num-color` | color | `"#000000"` | — | — | צבע מספר העמוד | רשת העמוד ומספור | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js<br>engine/output/legacy-projector.js +1 | visual-only |
| 18 | `page-num-start-idx` | number | `1` | `1` | page-num-start-idx | עמוד תחילת התצוגה (סוד) | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/decoration/numbering-audit.js | YES (folio) |
| 19 | `count-shaar-pages` | bool | `false` | `false` | main-shaar-count-numbering, main-shaar-show-number, back-shaar-count-numbering, back-shaar-show-number, sub-shaar-count-numbering, sub-shaar-show-number | מניית עמודי שער במספור | רשת העמוד ומספור | decoration/folio | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js<br>engine/decoration/shaar-pages.js +1 | YES (numbering) |
| 20 | `count-toc-pages` | bool | `false` | — | — | מניית עמודי תוכן־עניינים | רשת העמוד ומספור | decoration/folio | engine/decoration/folio.js<br>engine/layout/page-templates.js | YES (numbering) |
| 21 | `count-endnote-pages` | bool | `false` | — | — | מניית עמודי הערות־סיום | רשת העמוד ומספור | decoration/folio, core/pipeline | engine/core/pipeline.js<br>engine/decoration/folio.js | YES (numbering) |
| 22 | `body-font` | font | `"Frank Ruhl Libre"` | `"Guttman Rashi"` **≠** | font-body | גופן גוף הטקסט | טיפוגרפיה וגוף הטקסט | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/ornament-plan.js +15 | YES |
| 23 | `body-color` | color | `"#000000"` | — | — | צבע גוף הטקסט | טיפוגרפיה וגוף הטקסט | output/dom-renderer, output/legacy-projector, output/geometry-projector | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js<br>engine/output/legacy-projector.js | visual-only |
| 24 | `body-font-size-pt` | number | `14` | `12` **≠** | size-body | גודל גוף הטקסט (pt) | טיפוגרפיה וגוף הטקסט | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/ornament-plan.js +13 | YES |
| 25 | `body-line-height` | number | `1.4` | `1.34` **≠** | line-height-body | גובה שורה (יחס) | טיפוגרפיה וגוף הטקסט | typography/kp-linebreak | engine/core/legacy-settings-map.js<br>engine/layout/dp-planner.js<br>engine/layout/legacy-imud-flow.js +3 | YES |
| 26 | `paren-style-scale` | number | `1` | — | — | סקאלת סוגריים | טיפוגרפיה וגוף הטקסט | core/pipeline, output/dom-renderer | engine/core/pipeline.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | YES |
| 27 | `first-word-mode` | enum | `"drop"` | `"drop"` | drop-word-mode | אופן מילה ראשונה | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/typography/dropword.js | YES |
| 28 | `first-word-length` | number | `1` | `1` | drop-word-count | אורך מילה ראשונה (מילים) | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/typography/dropword.js | YES |
| 29 | `first-word-threshold-lines` | number | `3` | `2` **≠** | drop-word-min-lines | סף שורות למילה ראשונה | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/typography/dropword.js | YES |
| 30 | `first-word-align-cap-top` | bool | `true` | — | — | יישור מילה ראשונה לקו בסיס גוף | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/typography/dropword.js | YES |
| 31 | `first-word-size-em` | number | `2` | `1.5` **≠** | size-first-word | first-word-size-em | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/core/legacy-settings-map.js<br>engine/typography/dropword.js | YES |
| 32 | `first-word-font` | font | `""` | `"FrankReal"` **≠** | font-first-word | גופן מילה ראשונה | טיפוגרפיה וגוף הטקסט | typography/dropword | engine/core/legacy-settings-map.js<br>engine/typography/dropword.js<br>ui/app-shell.js | YES |
| 33 | `first-word-color` | color | `"#000000"` | — | — | צבע מילה ראשונה | טיפוגרפיה וגוף הטקסט | output/legacy-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/legacy-projector.js | visual-only |
| 34 | `dh-auto-detect` | bool | `true` | `false` **≠** | auto-dh | זיהוי אוטומטי של דיבור־המתחיל | טיפוגרפיה וגוף הטקסט | parser/block-tokenizer | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js | YES |
| 35 | `dh-font` | font | `"David HB"` | — | font-dh | גופן דיבור־המתחיל | טיפוגרפיה וגוף הטקסט | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>ui/app-shell.js | YES |
| 36 | `dh-color` | color | `"#000000"` | — | — | צבע דיבור־המתחיל | טיפוגרפיה וגוף הטקסט | core/pipeline | engine/core/pipeline.js | visual-only |
| 37 | `heading-0-body-font` | font | `"Frank Ruhl Libre"` | `"Frank Ruhl Libre"` | f-h0-body | גופן גוף ההקדמה (f-h0-body) | טיפוגרפיה וגוף הטקסט | layout/legacy-imud-flow | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 38 | `endnote-title-font` | font | `"David Libre"` | `"David Libre"` | f-note-title | גופן כותרת עמודי ההערות (f-note-title) | הערות שוליים וסיום | layout/legacy-imud-flow | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js | YES |
| 39 | `body-last-line-align` | enum | `"center"` | `"center"` | body-last-line-align | יישור שורה אחרונה בפסקה | טיפוגרפיה וגוף הטקסט | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js +2 | YES |
| 40 | `heading-0-mode` | enum | `"full-width"` | `"new-page"` **≠** | mode-h0 | כותרת אפס — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 41 | `heading-0-font` | font | `"David HB"` | `"AlphaBlack"` **≠** | f-h0 | כותרת אפס — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 42 | `heading-0-color` | color | `"#000000"` | — | — | כותרת אפס — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 43 | `heading-0-size-pt` | number | `20` | `26` **≠** | s-h0 | כותרת אפס — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 44 | `heading-1-mode` | enum | `"full-width"` | `"new-page"` **≠** | mode-h1 | כותרת 1 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 45 | `heading-1-font` | font | `"David HB"` | `"Lia Sgula"` **≠** | f-h1 | כותרת 1 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 46 | `heading-1-color` | color | `"#000000"` | — | — | כותרת 1 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | visual-only |
| 47 | `heading-1-size-pt` | number | `18` | `50` **≠** | s-h1 | כותרת 1 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 48 | `heading-2-mode` | enum | `"full-width"` | `"new-page"` **≠** | mode-h2 | כותרת 2 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 49 | `heading-2-font` | font | `"David HB"` | `"AlphaBlack"` **≠** | f-h2 | כותרת 2 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 50 | `heading-2-color` | color | `"#000000"` | — | — | כותרת 2 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 51 | `heading-2-size-pt` | number | `16` | `17` **≠** | s-h2 | כותרת 2 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 52 | `heading-3-mode` | enum | `"full-width"` | `"full-width"` | mode-h3 | כותרת 3 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 53 | `heading-3-font` | font | `"David HB"` | `"Alpha"` **≠** | f-h3 | כותרת 3 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 54 | `heading-3-color` | color | `"#000000"` | — | — | כותרת 3 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 55 | `heading-3-size-pt` | number | `15` | `13.5` **≠** | s-h3 | כותרת 3 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 56 | `heading-4-mode` | enum | `"regular"` | `"regular"` | mode-h4 | כותרת 4 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 57 | `heading-4-font` | font | `"David HB"` | `"Alpha"` **≠** | f-h4 | כותרת 4 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 58 | `heading-4-color` | color | `"#000000"` | — | — | כותרת 4 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 59 | `heading-4-size-pt` | number | `14` | `12.5` **≠** | s-h4 | כותרת 4 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 60 | `heading-5-mode` | enum | `"regular"` | `"regular"` | mode-h5 | כותרת 5 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 61 | `heading-5-font` | font | `"David HB"` | `"AlphaLight"` **≠** | f-h5 | כותרת 5 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 62 | `heading-5-color` | color | `"#000000"` | — | — | כותרת 5 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 63 | `heading-5-size-pt` | number | `14` | `11.5` **≠** | s-h5 | כותרת 5 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 64 | `heading-6-mode` | enum | `"regular"` | `"regular"` | mode-h6 | כותרת 6 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 65 | `heading-6-font` | font | `"David HB"` | `"Noto Serif Hebrew"` **≠** | f-h6 | כותרת 6 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/core/pipeline.js:312-314 +6 | YES |
| 66 | `heading-6-color` | color | `"#000000"` | — | — | כותרת 6 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32<br>engine/layout/headings-escort.js:10 +4 | visual-only |
| 67 | `heading-6-size-pt` | number | `13` | `10.5` **≠** | s-h6 | כותרת 6 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 68 | `heading-7-mode` | enum | `"side-note"` | `"side-note"` | mode-h7 | כותרת 7 — אופן | כותרות 0–7 | layout/headings-escort | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 69 | `heading-7-font` | font | `"David HB"` | `"Hadassah Friedlaender"` **≠** | f-h7 | כותרת 7 — גופן | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js +8 | YES |
| 70 | `heading-7-color` | color | `"#000000"` | — | — | כותרת 7 — צבע | כותרות 0–7 | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/legacy-projector.js<br>engine/core/pipeline.js:312-314 +6 | visual-only |
| 71 | `heading-7-size-pt` | number | `12` | `6` **≠** | s-h7 | כותרת 7 — גודל (pt) | כותרות 0–7 | typography/measure-api | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js:312-314<br>engine/layout/column-flow.js:32 +5 | YES |
| 72 | `hdr-h1-title-mode` | enum | `"main"` | — | — | אופן כותרת H1 בכותרת עליונה | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js | YES |
| 73 | `header-enabled` | bool | `true` | — | — | כותרות עליונות מופעלות | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js<br>engine/layout/legacy-imud-flow.js<br>engine/layout/page-templates.js +4 | no (running heads = margin decoration) |
| 74 | `header-recto-right-source` | enum | `"book-name"` | `"book-name-first-half"` **≠** | hdr-r-type | עמוד ימני — מקור ימין | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 75 | `header-recto-center-source` | enum | `"h2"` | `"h2"` | hdr-c-type | עמוד ימני — מקור מרכז | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 76 | `header-recto-left-source` | enum | `"h1"` | `"book-name-second-half"` **≠** | hdr-l-type | עמוד ימני — מקור שמאל | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 77 | `header-verso-right-source` | enum | `"h1"` | `"book-name-first-half"` **≠** | hdr-verso-r-type | עמוד שמאלי — מקור ימין | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 78 | `header-verso-center-source` | enum | `"h2"` | — | — | עמוד שמאלי — מקור מרכז | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 79 | `header-verso-left-source` | enum | `"book-name"` | `"book-name-second-half"` **≠** | hdr-verso-l-type | עמוד שמאלי — מקור שמאל | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 80 | `header-verso-same-as-recto` | bool | `false` | — | — | עמוד שמאלי זהה לימני | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 81 | `split-book-title` | bool | `false` | — | — | פיצול שם הספר בין העמודים (חצי בכל צד) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js | YES |
| 82 | `header-separator-line` | enum | `"gray"` | — | — | קו הפרדה בכותרת עליונה | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 83 | `header-opening-dedicated` | bool | `false` | — | — | כותרת ייעודית לעמודי פתיחה | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js<br>engine/layout/legacy-imud-flow.js<br>engine/decoration/headers-builder.js:138-160 +3 | no (running heads = margin decoration) |
| 84 | `header-opening-right-source` | enum | `"none"` | — | — | פתיחה — מקור ימין | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 85 | `header-opening-center-source` | enum | `"book-name"` | — | — | פתיחה — מקור מרכז | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 86 | `header-opening-left-source` | enum | `"none"` | — | — | פתיחה — מקור שמאל | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 87 | `header-recto-right-align` | enum | `"right"` | — | — | עמוד ימני — סלוט ימין — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 88 | `header-recto-right-width-pct` | number | `33` | — | — | עמוד ימני — סלוט ימין — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 89 | `header-recto-right-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-r | עמוד ימני — סלוט ימין — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 90 | `header-recto-right-color` | color | `"#000000"` | — | — | עמוד ימני — סלוט ימין — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 91 | `header-recto-right-size-pt` | number | `11` | `15` **≠** | s-hdr-r | עמוד ימני — סלוט ימין — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 92 | `header-recto-right-custom-text` | string | `""` | `""` | hdr-r-custom | עמוד ימני — סלוט ימין — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 93 | `header-recto-center-align` | enum | `"center"` | — | — | עמוד ימני — סלוט מרכז — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 94 | `header-recto-center-width-pct` | number | `33` | — | — | עמוד ימני — סלוט מרכז — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 95 | `header-recto-center-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-c | עמוד ימני — סלוט מרכז — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 96 | `header-recto-center-color` | color | `"#000000"` | — | — | עמוד ימני — סלוט מרכז — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 97 | `header-recto-center-size-pt` | number | `11` | `11` | s-hdr-c | עמוד ימני — סלוט מרכז — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 98 | `header-recto-center-custom-text` | string | `""` | `""` | hdr-c-custom | עמוד ימני — סלוט מרכז — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 99 | `header-recto-left-align` | enum | `"left"` | — | — | עמוד ימני — סלוט שמאל — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 100 | `header-recto-left-width-pct` | number | `33` | — | — | עמוד ימני — סלוט שמאל — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 101 | `header-recto-left-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-l | עמוד ימני — סלוט שמאל — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 102 | `header-recto-left-color` | color | `"#000000"` | — | — | עמוד ימני — סלוט שמאל — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 103 | `header-recto-left-size-pt` | number | `11` | `15` **≠** | s-hdr-l | עמוד ימני — סלוט שמאל — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 104 | `header-recto-left-custom-text` | string | `""` | `""` | hdr-l-custom | עמוד ימני — סלוט שמאל — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 105 | `header-verso-right-align` | enum | `"right"` | — | — | עמוד שמאלי — סלוט ימין — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 106 | `header-verso-right-width-pct` | number | `33` | — | — | עמוד שמאלי — סלוט ימין — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 107 | `header-verso-right-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-verso-r | עמוד שמאלי — סלוט ימין — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 108 | `header-verso-right-color` | color | `"#000000"` | — | — | עמוד שמאלי — סלוט ימין — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 109 | `header-verso-right-size-pt` | number | `11` | `15` **≠** | s-hdr-verso-r | עמוד שמאלי — סלוט ימין — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 110 | `header-verso-right-custom-text` | string | `""` | `""` | hdr-verso-r-custom | עמוד שמאלי — סלוט ימין — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 111 | `header-verso-center-align` | enum | `"center"` | — | — | עמוד שמאלי — סלוט מרכז — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 112 | `header-verso-center-width-pct` | number | `33` | — | — | עמוד שמאלי — סלוט מרכז — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 113 | `header-verso-center-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-verso-c | עמוד שמאלי — סלוט מרכז — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 114 | `header-verso-center-color` | color | `"#000000"` | — | — | עמוד שמאלי — סלוט מרכז — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 115 | `header-verso-center-size-pt` | number | `11` | `11` | s-hdr-verso-c | עמוד שמאלי — סלוט מרכז — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 116 | `header-verso-center-custom-text` | string | `""` | `""` | hdr-verso-c-custom | עמוד שמאלי — סלוט מרכז — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 117 | `header-verso-left-align` | enum | `"left"` | — | — | עמוד שמאלי — סלוט שמאל — יישור | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 118 | `header-verso-left-width-pct` | number | `33` | — | — | עמוד שמאלי — סלוט שמאל — רוחב (%) | כותרות עליונות | decoration/headers-builder | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 119 | `header-verso-left-font` | font | `"David HB"` | `"Livorna"` **≠** | f-hdr-verso-l | עמוד שמאלי — סלוט שמאל — גופן | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 120 | `header-verso-left-color` | color | `"#000000"` | — | — | עמוד שמאלי — סלוט שמאל — צבע | כותרות עליונות | decoration/headers-builder, output/dom-renderer | engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426<br>engine/output/dom-renderer.js:776-778 +1 | no (running heads = margin decoration) |
| 121 | `header-verso-left-size-pt` | number | `11` | `15` **≠** | s-hdr-verso-l | עמוד שמאלי — סלוט שמאל — גודל (pt) | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 122 | `header-verso-left-custom-text` | string | `""` | `""` | hdr-verso-l-custom | עמוד שמאלי — סלוט שמאל — טקסט מותאם | כותרות עליונות | decoration/headers-builder | engine/core/legacy-settings-map.js<br>engine/decoration/headers-builder.js:138-160<br>engine/layout/legacy-imud-flow.js:1098,3426 +2 | no (running heads = margin decoration) |
| 123 | `note-placement-mode` | enum | `"footnotes"` | — | — | אופן הצבת הערות | הערות שוליים וסיום | core/pipeline, layout/dp-planner, layout/endnote-pages | engine/core/pipeline.js | YES |
| 124 | `footnotes-enabled` | bool | `true` | — | — | הערות שוליים מופעלות | הערות שוליים וסיום | layout/footnote-budget, core/pipeline | engine/core/pipeline.js<br>engine/layout/dp-planner.js<br>engine/layout/footnote-budget.js +2 | YES |
| 125 | `footnote-marker-style` | enum | `"hebrew-geresh"` | `"hebrew-geresh"` | note-numbering-style | סגנון סמן הערה | הערות שוליים וסיום | notes/markers | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/endnote-pages.js +3 | YES |
| 126 | `footnote-reset-policy` | enum | `"section"` | `"section"` | fn-reset-mode | מדיניות איפוס מונה הערות | הערות שוליים וסיום | notes/markers | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/endnote-pages.js +1 | YES |
| 127 | `footnote-columns` | number | `1` | `1` | fn-columns | מספר טורי הערות שוליים | הערות שוליים וסיום | layout/footnote-budget | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/footnote-budget.js +2 | YES |
| 128 | `footnote-separator-rule` | enum | `"regular"` | `"star"` **≠** | note-rule-style | קו הפרדה של סרגל הערות | הערות שוליים וסיום | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js +1 | visual-only |
| 129 | `fn-layout-mode` | enum | `"continuous"` | `"continuous"` | fn-layout-mode | אופן פריסת הערות (בלוק/רציף) | הערות שוליים וסיום | layout/dp-planner, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/dp-planner.js<br>engine/layout/legacy-imud-flow.js +1 | YES |
| 130 | `fn-placement-mode` | enum | `"body-first"` | — | — | מנגנון הצבת הערות (גוף תחילה / ישן) | הערות שוליים וסיום | layout/legacy-imud-flow | engine/layout/legacy-imud-flow.js | YES |
| 131 | `endnotes-enabled` | bool | `false` | — | — | הערות סיום מופעלות | הערות שוליים וסיום | layout/endnote-pages | engine/layout/endnote-pages.js | YES |
| 132 | `endnote-title-text` | string | `"הערות"` | `""` **≠** | fn-title-text | כותרת עמודי הערות | הערות שוליים וסיום | layout/endnote-pages | engine/core/legacy-settings-map.js<br>engine/layout/endnote-pages.js<br>engine/layout/legacy-imud-flow.js | YES |
| 133 | `endnote-columns` | number | `1` | — | — | מספר טורי הערות־סיום | הערות שוליים וסיום | layout/endnote-pages | engine/core/pipeline.js<br>engine/layout/endnote-pages.js<br>engine/output/dom-renderer.js +1 | YES |
| 134 | `f-note-body-font` | font | `"אסיסטנט קל מאוד"` | `"אסיסטנט קל מאוד"` | f-note-body | גופן גוף הערת־שוליים | הערות שוליים וסיום | layout/footnote-budget, layout/legacy-imud-flow | engine/core/legacy-settings-map.js<br>engine/layout/endnote-pages.js<br>engine/layout/footnote-budget.js +5 | YES |
| 135 | `s-note-body-font` | font | `"Frank Ruhl Libre"` | — | — | גופן גוף הערת־צד | הערות שוליים וסיום | layout/side-notes | engine/layout/side-notes.js<br>engine/output/geometry-projector.js | YES |
| 136 | `f-note-body-color` | color | `"#000000"` | — | — | צבע גוף הערת־שוליים | הערות שוליים וסיום | output/legacy-projector, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js<br>engine/output/legacy-projector.js | visual-only |
| 137 | `s-note-body-color` | color | `"#000000"` | — | — | צבע גוף הערת־צד | הערות שוליים וסיום | output/geometry-projector, output/dom-renderer | engine/output/geometry-projector.js | visual-only |
| 138 | `fn-bar-max-height-px` | number | `0` | — | — | תקרת גובה סרגל הערות (px) | הערות שוליים וסיום | layout/dp-planner | engine/core/legacy-settings-map.js<br>engine/layout/dp-planner.js<br>engine/layout/legacy-imud-flow.js | YES |
| 139 | `long-footnote-policy` | enum | `"split"` | — | — | מדיניות הערה ארוכה | הערות שוליים וסיום | layout/dp-planner | engine/layout/dp-planner.js<br>engine/layout/legacy-imud-flow.js | YES |
| 140 | `prevent-widows-top` | bool | `true` | `true` | avoid-widows | מנע אלמנות בראש עמוד | איכות עימוד | layout/protections-matrix | engine/core/legacy-settings-map.js<br>engine/layout/protections-matrix.js | YES |
| 141 | `prevent-widows-bottom` | bool | `true` | — | — | מנע אלמנות בסוף עמוד | איכות עימוד | layout/protections-matrix | engine/layout/protections-matrix.js | YES |
| 142 | `prevent-orphans-top` | bool | `true` | `true` | avoid-orphans | מנע יתומים בראש עמוד | איכות עימוד | layout/protections-matrix | engine/core/legacy-settings-map.js<br>engine/layout/protections-matrix.js | YES |
| 143 | `prevent-orphans-bottom` | bool | `true` | — | — | מנע יתומים בסוף עמוד | איכות עימוד | layout/protections-matrix | engine/layout/protections-matrix.js | YES |
| 144 | `widow-strictness` | enum | `"normal"` | — | — | מחמירות אלמנות/יתומים | איכות עימוד | layout/protections-matrix | engine/layout/candidate-generator.js<br>engine/layout/protections-matrix.js | YES |
| 145 | `runt-min-width-pct` | number | `50` | `20` **≠** | avoid-runt-word | רוחב מזערי לשורת־שדון (%) | איכות עימוד | typography/protectors | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/protections-matrix.js +2 | YES |
| 146 | `balance-chapter-end` | enum | `"balance"` | — | — | איזון סוף פרק | איכות עימוד | layout/balancing, core/pipeline | engine/core/pipeline.js<br>engine/layout/balancing.js<br>engine/output/project-io.js | YES |
| 147 | `allow-terminal-residual-fallback` | bool | `true` | — | — | שארית סופית מותרת כנפילה | איכות עימוד | layout/dp-planner | engine/layout/dp-planner.js | YES |
| 148 | `imbalance-max-delta-px` | number | `5` | — | — | סף אי־איזון טורים (px) | איכות עימוד | layout/balancing | engine/layout/balancing.js<br>engine/layout/dp-planner.js<br>engine/layout/legacy-imud-flow.js +1 | YES |
| 149 | `aq-enabled` | bool | `false` | `true` **≠** | aq-enabled, aq-word-spacing | איכות אוטומטית (AQ) מופעלת | איכות עימוד | layout/balancing, core/pipeline | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/balancing.js | YES |
| 150 | `aq-word-spacing-min` | number | `0.95` | `0.95` | aq-word-spacing-min | AQ — ריווח מילים מזערי | איכות עימוד | layout/balancing | engine/core/legacy-settings-map.js<br>engine/layout/balancing.js | YES |
| 151 | `aq-word-spacing-max` | number | `1.05` | `1.05` | aq-word-spacing-max | AQ — ריווח מילים מקסימלי | איכות עימוד | layout/balancing | engine/core/legacy-settings-map.js<br>engine/layout/balancing.js | YES |
| 152 | `aq-letter-spacing-min` | number | `0.97` | — | — | AQ — ריווח אותיות מזערי | איכות עימוד | layout/balancing | engine/layout/balancing.js | YES |
| 153 | `aq-letter-spacing-max` | number | `1.03` | — | — | AQ — ריווח אותיות מקסימלי | איכות עימוד | layout/balancing | engine/core/legacy-settings-map.js<br>engine/layout/balancing.js | YES |
| 154 | `aq-heading-spacing-min` | number | `0.95` | — | — | AQ — ריווח כותרות מזערי | איכות עימוד | layout/balancing | engine/layout/balancing.js | YES |
| 155 | `aq-heading-spacing-max` | number | `1.05` | — | — | AQ — ריווח כותרות מקסימלי | איכות עימוד | layout/balancing | engine/layout/balancing.js | YES |
| 156 | `aq-shared-load` | bool | `true` | `true` | aq-shared-load | AQ — עומס משותף | איכות עימוד | layout/balancing | engine/core/legacy-settings-map.js<br>engine/layout/balancing.js | YES |
| 157 | `aq-stretch-to-bottom` | bool | `true` | — | — | AQ — מתיחה עד תחתית | איכות עימוד | layout/balancing | engine/layout/balancing.js | YES |
| 158 | `aq-overshoot-clamp-px` | number | `20` | — | — | AQ — תקרת חריגה (px) | איכות עימוד | layout/balancing | engine/core/legacy-settings-map.js<br>engine/layout/balancing.js | YES |
| 159 | `aq-compress-first` | bool | `true` | — | — | AQ — כיווץ לפני מתיחה | איכות עימוד | layout/balancing | engine/layout/balancing.js | YES |
| 160 | `h2-orn-scope` | enum | `"both"` | `"both"` | h2-title-orn-mode, h2-orn-scope | היקף עיטורי H2 | עיטורים וגרפיקה | decoration/ornament-fit | engine/core/legacy-settings-map.js<br>engine/decoration/ornament-fit.js | YES (decoration budget) |
| 161 | `h2-orn-top` | enum | `"none"` | `"none"` | h2-ornament-set, h2-ornament-top-style, h2-title-ornament-top-style | עיטור עליון לסימן H2 | עיטורים וגרפיקה | decoration/ornament-fit | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/legacy-ornaments.js +3 | YES (decoration budget) |
| 162 | `h2-orn-bottom` | enum | `"none"` | `"none"` | h2-ornament-bottom-style, h2-title-ornament-bottom-style | עיטור תחתון לסימן H2 | עיטורים וגרפיקה | decoration/ornament-fit | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/legacy-ornaments.js +3 | YES (decoration budget) |
| 163 | `h2-orn-side` | enum | `"none"` | `"none"` | h2-title-ornament-r, h2-title-ornament-l | עיטור צד לכותרת H2 | עיטורים וגרפיקה | decoration/ornament-fit | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/legacy-ornaments.js +2 | YES (decoration budget) |
| 164 | `h2-orn-fit-to-text` | bool | `true` | `false` **≠** | h2-orn-fit-text | התאמת עיטור H2 לטקסט | עיטורים וגרפיקה | decoration/ornament-fit | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/ornament-fit.js | YES (decoration budget) |
| 165 | `h3-side-orn` | enum | `"none"` | `"none"` | h3-ornament-set, h3-ornament-r, h3-ornament-l | עיטורי צד H3 | עיטורים וגרפיקה | decoration/ornament-plan | engine/core/legacy-settings-map.js<br>engine/decoration/ornament-plan.js | YES (decoration budget) |
| 166 | `h3-side-orn-height-em` | number | `1` | — | — | גובה עיטור צד H3 (em) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js | YES (decoration budget) |
| 167 | `chapter-end-ornament` | enum | `"none"` | — | — | עיטור סוף פרק | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js<br>ui/settings-panel.js | YES (decoration budget) |
| 168 | `chapter-end-ornament-w-em` | number | `4` | — | — | רוחב עיטור סוף פרק (em) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js | YES (decoration budget) |
| 169 | `chapter-end-ornament-h-em` | number | `1.2` | — | — | גובה עיטור סוף פרק (em) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js | YES (decoration budget) |
| 170 | `heading-dividers-h3-h6` | bool | `false` | `false` | heading-divider-h3 | מפרידי כותרות H3–H6 | עיטורים וגרפיקה | decoration/dividers, decoration/ornament-plan | engine/core/legacy-settings-map.js<br>engine/decoration/dividers.js<br>engine/decoration/ornament-plan.js +7 | YES |
| 171 | `shaar-main-divider` | enum | `"none"` | — | — | קו מפריד בשער ראשי | עיטורים וגרפיקה | decoration/dividers | engine/decoration/dividers.js | shaar page rendering (visual) |
| 172 | `shaar-sub-divider` | enum | `"none"` | — | — | קו מפריד בשער משנה | עיטורים וגרפיקה | decoration/dividers | engine/decoration/dividers.js<br>engine/layout/legacy-imud-flow.js | shaar page rendering (visual) |
| 173 | `toc-general-enabled` | bool | `true` | `true` | enable-general-toc | תוכן־עניינים כללי מופעל | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/toc-builder.js +1 | YES |
| 174 | `toc-detail-enabled` | bool | `false` | `true` **≠** | enable-detailed-toc | תוכן־עניינים מפורט מופעל | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/toc-builder.js +1 | YES |
| 175 | `general-toc-count-numbering` | bool | `true` | `true` | general-toc-count-numbering | מספור שורות תוכן כללי | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/decoration/toc-builder.js +1 | YES |
| 176 | `detailed-toc-count-numbering` | bool | `true` | `true` | detailed-toc-count-numbering | מספור שורות תוכן מפורט | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/legacy-imud-flow.js | YES |
| 177 | `general-toc-show-numbering` | bool | `true` | `true` | general-toc-show-numbering | תצוגת גיליון בעמודי תוכן כלליים | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js | YES |
| 178 | `detailed-toc-show-numbering` | bool | `true` | `true` | detailed-toc-show-numbering | תצוגת גיליון בעמודי תוכן מפורטים | תוכן העניינים | decoration/toc-builder | engine/core/legacy-settings-map.js<br>engine/decoration/folio.js | YES |
| 179 | `toc-level-1-show` | bool | `true` | `true` | — | רמת תוכן 1 — הצגה | תוכן העניינים | decoration/toc-builder | engine/output/project-io.js<br>engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112 +1 | YES |
| 180 | `toc-level-1-inline` | bool | `false` | `false` | — | רמת תוכן 1 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 181 | `toc-level-2-show` | bool | `true` | `true` | — | רמת תוכן 2 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 182 | `toc-level-2-inline` | bool | `false` | `false` | — | רמת תוכן 2 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 183 | `toc-level-3-show` | bool | `false` | `true` **≠** | — | רמת תוכן 3 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 184 | `toc-level-3-inline` | bool | `false` | `false` | — | רמת תוכן 3 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 185 | `toc-level-4-show` | bool | `false` | `true` **≠** | — | רמת תוכן 4 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 186 | `toc-level-4-inline` | bool | `true` | `false` **≠** | — | רמת תוכן 4 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 187 | `toc-level-5-show` | bool | `false` | `true` **≠** | — | רמת תוכן 5 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 188 | `toc-level-5-inline` | bool | `true` | `false` **≠** | — | רמת תוכן 5 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 189 | `toc-level-6-show` | bool | `false` | `true` **≠** | — | רמת תוכן 6 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 190 | `toc-level-6-inline` | bool | `true` | `false` **≠** | — | רמת תוכן 6 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 191 | `toc-level-7-show` | bool | `false` | `false` | — | רמת תוכן 7 — הצגה | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 192 | `toc-level-7-inline` | bool | `true` | `false` **≠** | — | רמת תוכן 7 — שורה משורטטת (inline) | תוכן העניינים | decoration/toc-builder | engine/decoration/toc-builder.js:78,85,290,299<br>engine/layout/legacy-imud-flow.js:3111-3112<br>engine/core/legacy-settings-map.js:464-465 | YES |
| 193 | `background-color` | color | `"#ffffff"` | — | — | צבע רקע העמוד | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/output/dom-renderer.js<br>ui/retypeset-policy.js | visual-only |
| 194 | `background-opacity` | number | `1` | — | — | אטימות רקע | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/output/dom-renderer.js<br>ui/retypeset-policy.js | visual-only |
| 195 | `theme-set-id` | string | `"default"` | — | — | ערכת נושא פעילה | ערכות נושא, שערים ורקעים | decoration/page-decorations, decoration/shaar-pages | engine/core/legacy-settings-map.js<br>engine/decoration/page-decorations.js<br>engine/decoration/shaar-pages.js +3 | pages (shaar activation) |
| 196 | `show-shaar-sub` | bool | `false` | `true` **≠** | — | הצג שער משנה | ערכות נושא, שערים ורקעים | decoration/shaar-pages, decoration/theme-sets | engine/core/legacy-settings-map.js<br>engine/decoration/shaar-pages.js<br>engine/decoration/theme-sets.js | YES (inserts pages) |
| 197 | `shaar-main-image` | string | `""` | — | — | תמונת שער ראשי | ערכות נושא, שערים ורקעים | decoration/page-decorations, decoration/shaar-pages | engine/decoration/page-decorations.js<br>engine/decoration/shaar-pages.js<br>engine/decoration/theme-sets.js | shaar page rendering (visual) |
| 198 | `shaar-sub-image` | string | `""` | — | — | תמונת שער משנה | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>engine/decoration/theme-sets.js | shaar page rendering (visual) |
| 199 | `shaar-back-enabled` | bool | `true` | `true` | show-back-shaar | שער אחורי מופעל | ערכות נושא, שערים ורקעים | decoration/page-decorations, decoration/shaar-pages | engine/core/legacy-settings-map.js<br>engine/decoration/page-decorations.js<br>engine/decoration/shaar-pages.js +1 | YES (inserts pages) |
| 200 | `background-page-type` | enum | `"regular"` | — | — | מחלקת עמוד לרקע | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/core/legacy-settings-map.js<br>engine/decoration/page-decorations.js | visual-only |
| 201 | `background-image` | string | `""` | — | — | תמונת רקע | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>ui/retypeset-policy.js | visual-only |
| 202 | `background-texture` | string | `""` | — | — | טקסטורת רקע | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>ui/retypeset-policy.js | visual-only |
| 203 | `background-inset-mm` | number | `0` | — | — | שקיעת רקע מהשוליים (מ״מ) | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>ui/retypeset-policy.js | visual-only |
| 204 | `imud-shaar-main` | string | `""` | — | — | עיצוב שער ראשי (ספריית IMUD) | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>engine/decoration/shaar-pages.js<br>ui/imud-library.js +1 | YES |
| 205 | `imud-shaar-sub` | string | `""` | — | — | עיצוב שער משנה (ספריית IMUD) | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>ui/imud-library.js<br>ui/settings-panel.js | YES |
| 206 | `imud-shaar-back` | string | `""` | — | — | עיצוב שער אחורי (ספריית IMUD) | ערכות נושא, שערים ורקעים | decoration/page-decorations | engine/decoration/page-decorations.js<br>ui/imud-library.js<br>ui/settings-panel.js | YES |
| 207 | `imud-orn-top` | string | `""` | — | — | עיטור עליון H2 (IMUD) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js<br>ui/settings-panel.js | conditional (ornament images; budget via h2-orn-*=image) |
| 208 | `imud-orn-bottom` | string | `""` | — | — | עיטור תחתון H2 (IMUD) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js<br>ui/settings-panel.js | conditional (ornament images; budget via h2-orn-*=image) |
| 209 | `imud-orn-side` | string | `""` | — | — | עיטור צדדי (IMUD) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js<br>ui/settings-panel.js | conditional (ornament images; budget via h2-orn-*=image) |
| 210 | `imud-chapter-end` | string | `""` | — | — | עיטור סיום פרק (IMUD) | עיטורים וגרפיקה | decoration/ornament-plan | engine/decoration/ornament-plan.js<br>ui/settings-panel.js | YES (decoration budget) |
| 211 | `imud-divider` | string | `""` | `"spear"` **≠** | section-divider-style | מפריד מעוצב (IMUD) | עיטורים וגרפיקה | decoration/ornament-plan | engine/core/legacy-settings-map.js<br>engine/decoration/ornament-plan.js<br>ui/settings-panel.js | conditional (ornament images; budget via h2-orn-*=image) |
| 212 | `imud-book-title` | string | `""` | `"ספר מלכי המלוכה"` **≠** | inp-book-title | כותרת הספר בשער (עקיפה) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/output/dom-renderer.js +1 | no (content text) |
| 213 | `imud-book-subtitle` | string | `""` | `"ביאורים וחידושים עמוקים על מסכתות הש\"ס"` **≠** | inp-book-subtitle | כותרת־משנה בשער | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/dom-renderer.js<br>engine/output/shaar-content.js | no (content text) |
| 214 | `shaar-main-enabled` | bool | `true` | `true` | show-main-shaar | שער ראשי מופעל (כמקור) | ערכות נושא, שערים ורקעים | decoration/shaar-pages | engine/core/legacy-settings-map.js<br>engine/decoration/shaar-pages.js<br>engine/layout/legacy-imud-flow.js | YES (inserts pages) |
| 215 | `shaar-sub-enabled` | bool | `true` | `true` | show-sub-shaar | שער־משנה לכל חלק (כמקור) | ערכות נושא, שערים ורקעים | decoration/shaar-pages | engine/core/legacy-settings-map.js<br>engine/decoration/shaar-pages.js<br>engine/layout/legacy-imud-flow.js | YES (inserts pages) |
| 216 | `shaar-title-font` | font | `"Bellefair"` | `"Lia Sgula"` **≠** | f-sh-title | שער — גופן כותרת הספר | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/legacy-projector.js +2 | shaar page rendering (visual) |
| 217 | `shaar-title-color` | color | `"#000000"` | — | — | שער — צבע כותרת הספר | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 218 | `shaar-title-size-pt` | number | `46` | `46` | s-sh-title | שער — גודל כותרת הספר (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 219 | `shaar-subtitle-font` | font | `"David Libre"` | `"Livorna"` **≠** | f-sh-sub | שער — גופן כותרת־משנה | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js +1 | shaar page rendering (visual) |
| 220 | `shaar-subtitle-color` | color | `"#000000"` | — | — | שער — צבע כותרת־משנה | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 221 | `shaar-subtitle-size-pt` | number | `21` | `21` | s-sh-sub | שער — גודל כותרת־משנה (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 222 | `shaar-desc-font` | font | `"Frank Ruhl Libre"` | `"Livorna"` **≠** | f-sh-desc | שער — גופן התיאור | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js +1 | shaar page rendering (visual) |
| 223 | `shaar-desc-color` | color | `"#000000"` | — | — | שער — צבע התיאור | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 224 | `shaar-desc-size-pt` | number | `12` | `12` | s-sh-desc | שער — גודל התיאור (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 225 | `shaar-sections-font` | font | `"David Libre"` | `"David Libre"` | f-sh-sec | שער — גופן פרטי מהדורא | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js +1 | shaar page rendering (visual) |
| 226 | `shaar-sections-color` | color | `"#000000"` | — | — | שער — צבע פרטי מהדורא | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 227 | `shaar-sections-size-pt` | number | `11.5` | `11.5` | s-sh-sec | שער — גודל פרטי מהדורא (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 228 | `shaar-author-font` | font | `"David Libre"` | `"David Libre"` | f-sh-author | שער — גופן שם המחבר | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js +1 | shaar page rendering (visual) |
| 229 | `shaar-author-color` | color | `"#000000"` | — | — | שער — צבע שם המחבר | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 230 | `shaar-author-size-pt` | number | `15` | `15` | s-sh-author | שער — גודל שם המחבר (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 231 | `shaar-year-font` | font | `"David Libre"` | `"David Libre"` | f-sh-year | שער — גופן מקום ושנה | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js +1 | shaar page rendering (visual) |
| 232 | `shaar-year-color` | color | `"#000000"` | — | — | שער — צבע מקום ושנה | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 233 | `shaar-year-size-pt` | number | `12` | `12` | s-sh-year | שער — גודל מקום ושנה (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js | shaar page rendering (visual) |
| 234 | `shaar-back-text-font` | font | `"אסיסטנט קל מאוד"` | — | — | שער אחורי — גופן הטקסט | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer, layout/legacy-imud-flow | engine/layout/legacy-imud-flow.js<br>engine/output/shaar-content.js<br>ui/app-shell.js | shaar page rendering (visual) |
| 235 | `shaar-back-text-color` | color | `"#000000"` | — | — | שער אחורי — צבע הטקסט | ערכות נושא, שערים ורקעים | layout/legacy-imud-flow, output/geometry-projector, output/dom-renderer | engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js<br>engine/output/geometry-projector.js | shaar page rendering (visual) |
| 236 | `shaar-back-text-size-pt` | number | `10.5` | — | — | שער אחורי — גודל הטקסט (pt) | ערכות נושא, שערים ורקעים | output/shaar-content, output/dom-renderer | engine/output/shaar-content.js | shaar page rendering (visual) |
| 237 | `imud-book-desc` | string | `""` | `"בירור שיטות הראשונים והאחרונים ובירורי הלכות למעשה"` **≠** | inp-book-desc | תיאור (שער — נושא מפורט) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/shaar-content.js | no (content text) |
| 238 | `imud-book-sections` | string | `""` | `"מהדורה שניה ומורחבת בסייעתא דשמיא"` **≠** | inp-book-sections | פרטי מהדורא (שער) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/shaar-content.js | no (content text) |
| 239 | `imud-book-author` | string | `""` | `"הצעיר ידידיה בר אבא הלוי"` **≠** | inp-book-author | שם המחבר (שער) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/shaar-content.js | no (content text) |
| 240 | `imud-book-year` | string | `""` | `"ירושלים עיה\"ק תובב\"א שנת ה'תשפ\"ו"` **≠** | inp-book-year | מקום ושנת הוצאה (שער) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/output/shaar-content.js | no (content text) |
| 241 | `shaar-back-text` | string | `""` | — | inp-back-shaar-text | טקסט השער האחורי (שמירת זכויות) | ערכות נושא, שערים ורקעים | output/dom-renderer | engine/core/legacy-settings-map.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/dom-renderer.js +3 | shaar page rendering (visual) |
| 242 | `en-line-prefix` | string | `"הערת סיום -"` | `"הערת סיום -"` | en-line-prefix | קידומת הערת סיום (ריק = ביטול) | הערות שוליים וסיום | parser/dfa-lexer, parser/block-tokenizer | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/legacy-imud-flow.js +1 | YES (parsing) |
| 243 | `fn-delim-open` | string | `"["` | `"["` | fn-delim-open | תוחם פתיחת הערת שוליים | הערות שוליים וסיום | parser/bracket-scanner, parser/block-tokenizer | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/legacy-imud-flow.js | YES (parsing) |
| 244 | `fn-delim-close` | string | `"]"` | `"]"` | fn-delim-close | תוחם סגירת הערת שוליים | הערות שוליים וסיום | parser/bracket-scanner, parser/block-tokenizer | engine/core/legacy-settings-map.js<br>engine/core/pipeline.js<br>engine/layout/legacy-imud-flow.js | YES (parsing) |
| 245 | `trace-verbosity` | enum | `"standard"` | — | — | רמת תיעוד מסלול (trace) | מתקדם/מנוע | core/events, core/pipeline | engine/core/events.js<br>engine/core/pipeline.js | no (export/diag) |
| 246 | `diagnostics-enabled` | bool | `true` | — | — | אבחון מופעל | מתקדם/מנוע | audit/report-schema | audit/report-schema.js<br>engine/layout/retreat-loop.js | no (export/diag) |
| 247 | `audit-stage-snapshots` | bool | `false` | — | — | צילומי-מצב בנקודות הביקורת (אבחון סיבתי) | מתקדם/מנוע | audit/stage-snapshots | audit/stage-snapshots.js<br>engine/core/pipeline.js | no (export/diag) |
| 248 | `offline-guard` | bool | `true` | — | — | שומר נתק־מהרשת (exit 7) | מתקדם/מנוע | output/html-export | engine/extensions/style-schema.js<br>engine/output/html-export.js<br>ui/app-shell.js | no (export/diag) |
| 249 | `debounce-light-change-ms` | number | `350` | — | — | השהיית שינויים קלים (ms) | מתקדם/מנוע | ui/retypeset-policy | engine/layout/retreat-loop.js<br>ui/app-shell.js<br>ui/retypeset-policy.js | no (export/diag) |
| 250 | `measure-impl` | enum | `"table"` | — | — | measure-impl | מתקדם/מנוע | typography/measure-api, core/pipeline | engine/core/pipeline.js<br>engine/layout/legacy-imud-flow.js<br>engine/output/export-api.js +2 | YES |
| 251 | `pdf-crop-marks` | bool | `false` | — | — | pdf-crop-marks | מתקדם/מנוע | output/pdf-writer | engine/output/pdf-writer.js | no (export/diag) |
| 252 | `export-bleed-mm` | number | `3` | — | — | export-bleed-mm | מתקדם/מנוע | output/pdf-writer | engine/output/pdf-writer.js | no (export/diag) |
| 253 | `export-html-page-rules` | bool | `true` | — | — | export-html-page-rules | ייצוא (HTML/PDF/ZIP) ומדידה | output/html-export | engine/output/export-api.js | no (export/diag) |


## Appendix B — Full legacy DISPOSITIONS table (161 entries)

Legend: kind = mapped (value applied) / merged (folded into target, may be lossy) / ui-state (preserved under `_legacy-ui-state`, no engine effect) / removed (documented, with issue id). "transform" = named function in legacy-settings-map.js; `(inline)` = arrow function. Line = line of the **last** occurrence in the file (8 keys are defined twice — see §3.3-1).

| legacy key | kind | maps to (RED key) | transform | line |
|---|---|---|---|---|
| `font-body` | mapped | `body-font` | resolveStack | 103 |
| `size-body` | mapped | `body-font-size-pt` | parseFloat | 104 |
| `line-height-body` | mapped | `body-line-height` | parseFloat | 105 |
| `body-last-line-align` | mapped | `body-last-line-align` | — | 106 |
| `drop-word-mode` | mapped | `first-word-mode` | (inline) | 109 |
| `drop-word-count` | mapped | `first-word-length` | parseInt | 110 |
| `drop-word-min-lines` | mapped | `first-word-threshold-lines` | parseInt | 111 |
| `font-first-word` | mapped | `first-word-font` | firstFamily | 112 |
| `size-first-word` | mapped | `first-word-size-em` | parseFloat | 113 |
| `auto-dh` | mapped | `dh-auto-detect` | (inline) | 116 |
| `font-dh` | mapped | `dh-font` | firstFamily | 117 |
| `mode-h0` | mapped | `heading-0-mode` | (inline) | 120 |
| `mode-h1` | merged | `heading-1-mode` | (inline) | 121 |
| `mode-h2` | mapped | `heading-2-mode` | (inline) | 122 |
| `mode-h3` | mapped | `heading-3-mode` | (inline) | 123 |
| `mode-h4` | mapped | `heading-4-mode` | (inline) | 124 |
| `mode-h5` | mapped | `heading-5-mode` | (inline) | 125 |
| `mode-h6` | mapped | `heading-6-mode` | (inline) | 126 |
| `mode-h7` | mapped | `heading-7-mode` | (inline) | 127 |
| `odd-h0` | ui-state | `—` | — | ? |
| `odd-h1` | ui-state | `—` | — | ? |
| `odd-h2` | ui-state | `—` | — | ? |
| `h2-auto-siman` | ui-state | `—` | — | ? |
| `h2-reset-siman` | ui-state | `—` | — | ? |
| `h2-top-distance` | mapped | `h2-top-offset` | pctToPx | 137 |
| `en-line-prefix` | mapped | `en-line-prefix` | — | 140 |
| `fn-delim-open` | mapped | `fn-delim-open` | — | 141 |
| `fn-delim-close` | mapped | `fn-delim-close` | — | 142 |
| `f-h0` | mapped | `heading-0-font` | resolveStack | 147 |
| `f-h1` | mapped | `heading-1-font` | resolveStack | 148 |
| `f-h2` | mapped | `heading-2-font` | resolveStack | 149 |
| `f-h3` | mapped | `heading-3-font` | resolveStack | 150 |
| `f-h4` | mapped | `heading-4-font` | resolveStack | 151 |
| `f-h5` | mapped | `heading-5-font` | resolveStack | 152 |
| `f-h6` | mapped | `heading-6-font` | resolveStack | 153 |
| `f-h7` | mapped | `heading-7-font` | resolveStack | 154 |
| `s-h0` | mapped | `heading-0-size-pt` | parseFloat | 324 |
| `s-h1` | mapped | `heading-1-size-pt` | parseFloat | 325 |
| `s-h2` | mapped | `heading-2-size-pt` | parseFloat | 157 |
| `s-h3` | mapped | `heading-3-size-pt` | parseFloat | 158 |
| `s-h4` | mapped | `heading-4-size-pt` | parseFloat | 159 |
| `s-h5` | mapped | `heading-5-size-pt` | parseFloat | 160 |
| `s-h6` | mapped | `heading-6-size-pt` | parseFloat | 161 |
| `s-h7` | mapped | `heading-7-size-pt` | parseFloat | 162 |
| `f-note-body` | mapped | `f-note-body-font` | (inline) | 163 |
| `f-hdr-r` | mapped | `header-recto-right-font` | resolveStack | 172 |
| `f-hdr-c` | mapped | `header-recto-center-font` | resolveStack | 173 |
| `f-hdr-l` | mapped | `header-recto-left-font` | resolveStack | 174 |
| `s-hdr-r` | mapped | `header-recto-right-size-pt` | parseFloat | 175 |
| `s-hdr-c` | mapped | `header-recto-center-size-pt` | parseFloat | 176 |
| `s-hdr-l` | mapped | `header-recto-left-size-pt` | parseFloat | 177 |
| `f-hdr-verso-r` | mapped | `header-verso-right-font` | resolveStack | 178 |
| `f-hdr-verso-c` | mapped | `header-verso-center-font` | resolveStack | 179 |
| `f-hdr-verso-l` | mapped | `header-verso-left-font` | resolveStack | 180 |
| `s-hdr-verso-r` | mapped | `header-verso-right-size-pt` | parseFloat | 181 |
| `s-hdr-verso-c` | mapped | `header-verso-center-size-pt` | parseFloat | 182 |
| `s-hdr-verso-l` | mapped | `header-verso-left-size-pt` | parseFloat | 183 |
| `hdr-r-type` | mapped | `header-recto-right-source` | hdrSlotTypeMap | 190 |
| `hdr-l-type` | mapped | `header-recto-left-source` | hdrSlotTypeMap | 191 |
| `hdr-c-type` | mapped | `header-recto-center-source` | hdrSlotTypeMap | 192 |
| `hdr-verso-r-type` | mapped | `header-verso-right-source` | hdrSlotTypeMap | 193 |
| `hdr-verso-l-type` | mapped | `header-verso-left-source` | hdrSlotTypeMap | 194 |
| `hdr-r-custom` | mapped | `header-recto-right-custom-text` | — | 198 |
| `hdr-c-custom` | mapped | `header-recto-center-custom-text` | — | 199 |
| `hdr-l-custom` | mapped | `header-recto-left-custom-text` | — | 200 |
| `hdr-verso-r-custom` | mapped | `header-verso-right-custom-text` | — | 201 |
| `hdr-verso-c-custom` | mapped | `header-verso-center-custom-text` | — | 202 |
| `hdr-verso-l-custom` | mapped | `header-verso-left-custom-text` | — | 203 |
| `inp-book-title` | mapped | `imud-book-title` | — | 204 |
| `inp-book-subtitle` | mapped | `imud-book-subtitle` | — | 205 |
| `show-main-shaar` | mapped | `shaar-main-enabled` | (inline) | 210 |
| `show-sub-shaar` | mapped | `shaar-sub-enabled` | (inline) | 211 |
| `show-back-shaar` | mapped | `shaar-back-enabled` | (inline) | 212 |
| `f-sh-title` | mapped | `shaar-title-font` | resolveStack | 213 |
| `s-sh-title` | mapped | `shaar-title-size-pt` | parseFloat | 326 |
| `f-sh-sub` | mapped | `shaar-subtitle-font` | resolveStack | 215 |
| `s-sh-sub` | mapped | `shaar-subtitle-size-pt` | parseFloat | 327 |
| `f-sh-desc` | mapped | `shaar-desc-font` | resolveStack | 217 |
| `s-sh-desc` | mapped | `shaar-desc-size-pt` | parseFloat | 328 |
| `f-sh-sec` | mapped | `shaar-sections-font` | resolveStack | 219 |
| `s-sh-sec` | mapped | `shaar-sections-size-pt` | parseFloat | 329 |
| `f-sh-author` | mapped | `shaar-author-font` | resolveStack | 221 |
| `s-sh-author` | mapped | `shaar-author-size-pt` | parseFloat | 330 |
| `f-sh-year` | mapped | `shaar-year-font` | resolveStack | 223 |
| `s-sh-year` | mapped | `shaar-year-size-pt` | parseFloat | 331 |
| `inp-book-desc` | mapped | `imud-book-desc` | — | 225 |
| `inp-book-sections` | mapped | `imud-book-sections` | — | 226 |
| `inp-book-author` | mapped | `imud-book-author` | — | 227 |
| `inp-book-year` | mapped | `imud-book-year` | — | 228 |
| `inp-back-shaar-text` | mapped | `shaar-back-text` | — | 229 |
| `fn-bar-max-height-px` | removed | `—` | — | 235 |
| `fn-columns` | mapped | `footnote-columns` | parseInt | 236 |
| `fn-layout-mode` | mapped | `fn-layout-mode` | — | 237 |
| `fn-reset-mode` | mapped | `footnote-reset-policy` | (inline) | 240 |
| `fn-title-text` | mapped | `endnote-title-text` | — | 241 |
| `note-numbering-style` | mapped | `footnote-marker-style` | (inline) | 242 |
| `note-marker-type` | ui-state | `—` | — | ? |
| `note-marker-size` | ui-state | `—` | — | ? |
| `note-listing-num-size` | ui-state | `—` | — | ? |
| `note-num-separator` | ui-state | `—` | — | ? |
| `note-rule-style` | mapped | `footnote-separator-rule` | — | 252 |
| `note-header-orn-r` | removed | `—` | — | 253 |
| `note-header-orn-l` | removed | `—` | — | 254 |
| `avoid-orphans` | merged | `prevent-orphans-top` | (inline) | 257 |
| `avoid-widows` | merged | `prevent-widows-top` | (inline) | 258 |
| `avoid-runt-word` | mapped | `runt-min-width-pct` | (inline) | 259 |
| `h2-ornament-set` | merged | `h2-orn-top` | (inline) | 262 |
| `h2-ornament-top-style` | mapped | `h2-orn-top` | — | 263 |
| `h2-ornament-bottom-style` | mapped | `h2-orn-bottom` | — | 264 |
| `h2-title-orn-mode` | mapped | `h2-orn-scope` | (inline) | 265 |
| `h2-title-ornament-top-style` | merged | `h2-orn-top` | — | 266 |
| `h2-title-ornament-bottom-style` | merged | `h2-orn-bottom` | — | 267 |
| `h2-title-ornament-r` | mapped | `h2-orn-side` | — | 268 |
| `h2-title-ornament-l` | merged | `h2-orn-side` | — | 269 |
| `h2-orn-fit-text` | mapped | `h2-orn-fit-to-text` | — | 270 |
| `h3-ornament-set` | merged | `h3-side-orn` | — | 271 |
| `h3-ornament-r` | mapped | `h3-side-orn` | — | 272 |
| `h3-ornament-l` | merged | `h3-side-orn` | — | 273 |
| `section-divider-style` | merged | `imud-divider` | — | 274 |
| `heading-divider-h3` | mapped | `heading-dividers-h3-h6` | (inline) | 275 |
| `h2-orn-scope` | mapped | `h2-orn-scope` | — | 276 |
| `col-divider-style` | mapped | `column-divider-style` | (inline) | 277 |
| `page-num-position` | mapped | `page-num-position` | (inline) | 280 |
| `page-num-format` | mapped | `page-num-format` | — | 281 |
| `page-num-frame` | mapped | `page-num-frame` | — | 282 |
| `page-num-start-idx` | mapped | `page-num-start-idx` | parseInt | 283 |
| `page-num-initial-value` | mapped | `page-num-initial-value` | parseInt | 284 |
| `main-shaar-count-numbering` | merged | `count-shaar-pages` | — | 285 |
| `main-shaar-show-number` | merged | `count-shaar-pages` | — | 286 |
| `back-shaar-count-numbering` | merged | `count-shaar-pages` | — | 287 |
| `back-shaar-show-number` | merged | `count-shaar-pages` | — | 288 |
| `sub-shaar-count-numbering` | merged | `count-shaar-pages` | — | 289 |
| `sub-shaar-show-number` | merged | `count-shaar-pages` | — | 290 |
| `general-toc-count-numbering` | mapped | `general-toc-count-numbering` | — | 291 |
| `general-toc-show-numbering` | mapped | `general-toc-show-numbering` | — | 292 |
| `detailed-toc-count-numbering` | mapped | `detailed-toc-count-numbering` | — | 293 |
| `detailed-toc-show-numbering` | mapped | `detailed-toc-show-numbering` | — | 294 |
| `enable-general-toc` | mapped | `toc-general-enabled` | (inline) | 298 |
| `enable-detailed-toc` | mapped | `toc-detail-enabled` | (inline) | 299 |
| `style-set-select` | ui-state | `—` | — | ? |
| `active-theme-select` | ui-state | `—` | — | ? |
| `aq-enabled` | mapped | `aq-enabled` | (inline) | 308 |
| `aq-word-spacing` | mapped | `aq-enabled` | (inline) | 309 |
| `aq-word-spacing-min` | mapped | `aq-word-spacing-min` | parseFloat | 310 |
| `aq-word-spacing-max` | mapped | `aq-word-spacing-max` | parseFloat | 311 |
| `aq-word-spacing-threshold` | ui-state | `—` | — | ? |
| `aq-word-spacing-max-diff` | ui-state | `—` | — | ? |
| `aq-para-spacing` | ui-state | `—` | — | ? |
| `aq-para-spacing-max` | ui-state | `—` | — | ? |
| `aq-line-height` | ui-state | `—` | — | ? |
| `aq-line-height-max` | ui-state | `—` | — | ? |
| `aq-shared-load` | mapped | `aq-shared-load` | (inline) | 318 |
| `inp-book-back-copyright` | ui-state | `—` | — | ? |
| `inp-book-back-publishing` | ui-state | `—` | — | ? |
| `inp-book-back-contact` | ui-state | `—` | — | ? |
| `inp-book-back-extra` | ui-state | `—` | — | ? |
| `s-note-body` | ui-state | `—` | — | ? |
| `f-note-title` | mapped | `endnote-title-font` | resolveStack | 332 |
| `f-h0-body` | mapped | `heading-0-body-font` | resolveStack | 333 |
| `hdr-title-split` | ui-state | `—` | — | ? |
| `hdr-alternating` | ui-state | `—` | — | ? |

### Appendix B.1 — FAMILY_RULES (fallback dispositions, legacy-settings-map.js:341-362)

| regex | kind | to | line |
|---|---|---|---|
| `^f-` | ui-state | — | 342 |
| `^s-` | ui-state | — | 343 |
| `^data-` | ui-state | — | 344 |
| `^hdr-` | ui-state | — | 345 |
| `^builder-` | ui-state | — | 346 |
| `^dim-` | ui-state | — | 347 |
| `^aq-` | ui-state | — | 348 |
| `^inp-` | ui-state | — | 349 |
| `^(cbg\|data-cbg)-` | ui-state | — | 350 |
| `^prop-` | ui-state | — | 351 |
| `^page-` | ui-state | — | 352 |
| `^(show\|enable\|select\|main\|back\|sub\|shaar\|general\|detailed\|font\|size\|mode)-` | ui-state | — | 353 |
| `^file-` | ui-state | — | 359 (EXT-14) |
| `^assets-folder-` | ui-state | — | 360 |
| `^heading-divider-h[3-9]$` | mapped | heading-dividers-h3-h6 (`v !== 'none'`) | 361 |

---

*End of audit J. Generated on branch audit/stage1-engine-state-20261115 (base 95e829d). All file:line references verified against the working tree at audit time.*
