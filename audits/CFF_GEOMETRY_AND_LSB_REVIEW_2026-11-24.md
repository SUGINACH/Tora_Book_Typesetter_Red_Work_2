# CFF → glyf: ביקורת גאומטריה, Raster ו-LSB — 24.11.2026

## מעמד והיקף הראיות

דוח זה מפריד בין תקינות מבנית של המרה, התאמה גאומטרית, ומיקום גליף בפועל.
הוא אינו אישור להמרה גורפת.

- קוד הרחבת הדגימות: commit 0243acb0fed70a5369b33c5ff18a7f914540177c.
- תיקון scope של מחרוזת ה-subset: 8341469e54b3faa4d7bbfbc07b3c6fc6df867183;
  תיקון שדה הדיווח בנתיב החריגה: ee5973e3778eed39ea7978ba45b2e2c1506d4ccd.
- Artifact v5 הסופי: run 45421092959, artifact 14933789403, על
  commit ee5973e; הדוח cff-conversion-stress/report.json, schema
  cff-conversion-stress-v5.
- Artifact v4 נשמר כ-baseline: run 45410445175, artifact 14928151801.
- בדיקת LSB המבוקרת נשמרה גם ב-v5: 54 השוואות ישירות של אותו glyf עם
  LSB ישן/חדש, ללא כשלי אבחון.
- ריצת v5 ראשונה על 0243acb (45419183582) נכשלה בכל 47 שורות החריגה
  בגלל shadowing של שם משתנה Python: לולאת geometry דרסה את מחרוזת ה-Unicode
  ששימשה את בדיקת ה-subset. כל 137 תמונות ה-Raster הופקו; הכשל הופיע לאחר מכן
  במסלול DecomposingPen/Runtime. הבעיה תוקנה בהפרדת subset_sample ו-
  geometry_sample, ובתיקון מזהה GID ב-except; הריצה הסופית
  45421092959 עברה 380/380. אין מדובר בכשל גופן או בהמרה.

## תקינות מבנית — קטלוג CFF

| מדד | תוצאה |
|---|---:|
| קובצי גופן ייחודיים בקטלוג | 1,758 |
| גופני CFF שנבדקו | 380 |
| המרות שעברו | 380 |
| כשלי המרה | 0 |
| גופנים עם אבחוני Curve/LSB | 46 |
| גליפים באבחוני Curve/LSB | 1,285 |
| בדיקות FreeType מייצגות שנוצרו | 46 |
| כשלי יצירת בדיקות FreeType מייצגות | 0 |
| גופנים עם חריגת Bounding Box | 47 |
| השוואות Raster גאומטריות שהופקו | 137 |
| כשלי יצירת השוואת Raster | 0 |
| LSB diagnostics חמורים (absolute delta ≥ 10 font units) | 54 |
| בדיקות FreeType ל-LSB החמור | 54 |
| כשלי בדיקת FreeType ל-LSB החמור | 0 |
| חריגים חמורים שלא ניתן היה למפות | 0 |

כל 380 ההמרות עברו את הוכחת המבנה וה-Parser/Subsetter של המנוע. זו הוכחת
תקינות מבנית/ריצה במסלול שנבדק, לא הוכחת נאמנות גאומטרית מלאה של כל הגליפים.

## בדיקת גבולות — למה Bounding Box אינו מספיק

המדד המתוקן מבחין בין:
- גבולות עקומה אמיתיים של CFF;
- control box של TrueType, הכולל נקודות בקרה מחוץ לעקומה;
- LSB בפלט, שחייב להתאים ל-`glyf.xMin`.

סטיית CFF true curve-xMin מול LSB המקורי נשמרת כאבחון נפרד, ולא ככשל
phantom-point. אין להשתמש ב-LSB הישן כאשר הפלט TrueType קובע אותו מחדש
מ-`glyf.xMin`.

סטיית הגבולות המרבית בדוח:
- קובץ: `Shluk-Regular.woff2`
- GID: `380`
- `deltaEm = 0.0013171864592`

## השוואת Raster של קווי המתאר — 137/137 (Artifact v5)

הרחבת הדגימות ב-v5 בוחרת לכל אחד מ-47 הגופנים החריגים:
1. גליף בעל סטיית Bounding Box המרבית בכל הגופן
   (overall-worst-bounds, רזולוציה 3,072 px/em).
2. גליף אות עברית בסיסית בעל סטיית Bounding Box המרבית בתחום U+05D0–U+05EA
   (hebrew-base-max-bounds-delta, רזולוציה 1,536 px/em).
3. גליף ניקוד/טעם בעל סטיית Bounding Box המרבית בתחום U+0591–U+05C7
   (hebrew-mark-max-bounds-delta, רזולוציה 1,536 px/em), ככל שיש גליף
   ממופה עם outline לא ריק.

הבחירה לפי GID יציבה, מסירה כפילויות GID בתוך גופן, ומצרפת את ה-codepoints
מ-cmap. כל מקור ותוצר מצוירים באותו viewBox, עם padding משותף והיפוך ציר Y,
באמצעות CairoSVG. ההשוואה היא alpha-mask ואינה משתמשת ב-FreeType, hinting,
shaping, cmap או advance widths.

| סוג דגימה | מספר | IoU מינימלי | חציון | ממוצע | מקסימום |
|---|---:|---:|---:|---:|---:|
| גליף כללי בעל סטיית bounds מרבית | 47 | 0.978857 | 0.995055 | 0.993949 | 0.998892 |
| אות עברית בסיסית בעלת סטיית bounds מרבית | 47 | 0.983736 | 0.996169 | 0.994835 | 0.999320 |
| ניקוד/טעם בעל סטיית bounds מרבית | 43 | 0.982143 | 0.995544 | 0.994955 | 0.999788 |
| **סה"כ** | **137** | — | — | — | — |

מדדי ההפרש המרבי בכל סוג:
- כללי: symmetric difference 2.1143%, normalized alpha MAE 0.003253,
  normalized alpha RMSE 0.041287.
- אות עברית בסיסית: symmetric difference 1.6264%, MAE 0.002747,
  RMSE 0.034324.
- ניקוד/טעם: symmetric difference 1.7857%, MAE 0.001187,
  RMSE 0.023198.

### דגימות החריגה הבולטות

- **כללי:** Skechers-Regular.woff2, GID 32, U+0035 (ספרה 5):
  IoU 0.978857 והפרש סימטרי 2.1143%. שם הגליף בקובץ המקור הוא
  glyph 32, ואילו בתוצר הוא five; ההשוואה מבוססת GID ולא שם.
- **אות עברית בסיסית:** Kedem-Sans-Ultra-Light.ttf, GID 237, U+05D8:
  IoU 0.983736 והפרש סימטרי 1.6264%.
- **ניקוד/טעם:** Mixtape-Bold.woff2, GID 200, U+05BC (דגש):
  IoU 0.982143 והפרש סימטרי 1.7857%. אותו GID ב-
  Mixtape-Regular.woff2 קיבל IoU 0.985141.

### כיסוי, כפילויות ומגבלות

- 47/47 גופני החריגה קיבלו את כל הדגימות שנבחרו; 137/137 תמונות נוצרו;
  geometryRasterDiagnosticFailureCount=0,
  geometryRasterEvidenceMissingFonts=[].
- ארבעה גופנים לא סיפקו דגימת סימן עברי כשיר; לכן יש 43 דגימות marks.
- מתוך 137 קובצי ההפרש, 130 תמונות שונות פיקסלית. שבעה קבצים הם כפילויות
  מלאות בין וריאציות גופן: Frank-Re (4), Kedem Serif Ultra Light Italic
  (2 קבוצות דגימה), ו-Noyland (2). הדמיון הפיקסלי חל על תמונת ההפרש של אותו
  GID בלבד; אין להסיק מכך שכל קובצי הגופן או כל הגליפים שלהם זהים.
- השוואות Full-size שנבדקו עבור Skechers GID 32, Kedem GID 258 ו-Mixtape GID 27
  לא הראו עיוות גס גלוי. Contact sheets ברזולוציה מוגברת נבדקו עבור כל שלוש
  קטגוריות הדגימה; זו סקירה חזותית ממוקדת, לא אישור פרטני לכל גליף.
- דגימות ה-base וה-mark נבחרות לפי סטיית Bounding Box המרבית בכל קטגוריה,
  ולא לפי Hausdorff distance או Raster IoU מקסימלי. לכן הן מייצגות כיסוי
  עברי נוסף, אך אינן הוכחה שהן הגליפים בעלי סטיית העקומה הגדולה ביותר בכל
  הקטגוריה.
- 137 דגימות אינן מכסות את כל 22,169 הגליפים המצטברים ב-47 הגופנים החריגים.
  לא בוצע Raster comparison לכל 1,285 הגליפים באבחוני Curve/LSB.
- Raster Diff מבוסס CairoSVG ב-3,072/1,536 px/em; זו מדידה מספרית ברזולוציה
  גבוהה, לא Hausdorff distance ולא הוכחה אנליטית לשוויון Bézier curves.
  היא אינה מודדת shaping, hinting או rendering בדפדפן/FreeType.
- אין להסיק מכך שאפס כשלי אבחון פירושו שההמרה מאושרת. Skechers, Kedem ו-
  Mixtape נשארים מועמדים לסקירה ידנית ממוקדת.

## הערת Shaping לחריגי Mixtape — 24.11.2026

ה-WOFF2 המקורי של `Mixtape-Bold` ו-`Mixtape-Regular` אינו נקרא ישירות
על ידי HarfBuzzJS 1.6.4; לאחר נרמול fontTools/Brotli ל-SFNT התוצרים זוהו
כ-CFF (`OTTO`, טבלת `CFF `), ועוצבו בחמש מחרוזות עבריות מנוקדות לכל גופן
עם 0 `.notdef` ו-Node/classic Worker parity מלא. Run `45439848821`,
Artifact `14942623161`. זו הוכחת shaping למדגם מחרוזות בלבד; אין להסיק
ממנה שכל 204 glyph outlines בכל משקל נבדקו, ואין שינוי בהחלטת CFF conversion:
`massConversionApproved=false`, `manualReviewRequired=true`.

## בדיקת השפעת LSB על מיקום הגליף — 54/54

ב-Artifact v5 הסופי בוצעו שלושה רינדורים ב-FreeType לכל אחד מ-54 הגליפים:

1. גופן המקור CFF.
2. גופן TrueType מומר עם ה-LSB המקורי של CFF.
3. אותו גופן TrueType מומר עם LSB שנגזר מ-`glyf.xMin`.

הרינדורים הופקו באותו גודל, baseline, canvas ו-layout engine בסיסי
(`Pillow ImageFont.Layout.BASIC`). אלה בדיקות glyph-by-glyph, ולא בדיקות
shaping של מחרוזות עבריות מלאות.

| מקור ההשוואה | IoU מינימלי | IoU חציוני | IoU ממוצע | IoU מקסימלי |
|---|---:|---:|---:|---:|
| CFF מקור מול glyf עם LSB ישן | 0.000000 | 0.368336 | 0.332136 | 0.562197 |
| CFF מקור מול glyf עם LSB remapped | 0.982911 | 0.994281 | 0.994015 | 1.000000 |

הההשוואה הישירה נוספה ב-commit `54e043c3699b2cbccc87345eb3a6e812ef892628` ונכללה מחדש ב-Artifact v5
ונבדקה מתוך run `45411976892`, Artifact `14929191082`. המדד
`copiedSourceLsbVsRemappedLsb` משווה שתי גרסאות של אותו מתאר glyf:
עותק אחד עם LSB המקור והעותק השני עם LSB שנגזר מ-`glyf.xMin`. שניהם
נטענים ומרונדרים ב-FreeType/Pillow באותו גודל, baseline, canvas ו-BASIC
layout. השינוי היחיד המכוון ביניהם הוא ערך ה-LSB ב-hmtx.

| מדד השוואה ישירה — אותו glyf, LSB ישן מול חדש | מינימום | חציון | ממוצע | מקסימום |
|---|---:|---:|---:|---:|
| IoU | 0.000000 | 0.368832 | 0.332899 | 0.564007 |
| Binary symmetric-difference ratio | 0.435993 | 0.631168 | 0.667101 | 1.000000 |
| Normalized alpha MAE | 0.001591 | 0.017555 | 0.017759 | 0.041756 |

כל 54 ההשוואות הישירות הופקו; אפס כשלי אבחון, אפס תוצאות חסרות, ואף
השוואה אחת אינה זהה (0/54 עם הפרש אפס). דוגמה קיצונית: Likritz GID 8
(`parenright`) קיבל IoU=0 בין ה-LSB הישן לחדש; ב-Ktav-Yad .notdef
GID 0 התקבל IoU≈0.265957. זהו ניסוי מבוקר שמבודד את תרומת ה-LSB ומאשר
שהערך הישן מזיז את הדיו בפועל, לא רק את מדד ה-Bounding Box.

השוואת המקור CFF מול glyf עם ה-LSB המתוקן נשארה טובה: IoU מינימלי
0.982911, חציוני 0.994281, ממוצע 0.994015 ומקסימלי 1.0. ההפרש הקטן
שנותר כולל המרת outline ורסטריזציה, ואינו מיוחס ל-LSB לבדו.

### ריכוז החריגים

- `Likritz-Hebrew.woff2`: ‏53 גליפים חמורים (GID 3–56); ברבים מהם
  ה-LSB הישן הוא כ-50–65 יחידות בעוד `glyf.xMin` קרוב ל-0.
- `Ktav-Yad-Clm-Bold-Italic.woff2`: ‏GID 0 (`.notdef`), עם LSB מקור
  0 ו-`glyf.xMin` של כ-50 יחידות.
- 54/54 גליפים קיבלו בדיקת FreeType; אין השמטה שקטה.

## מקרה Ploni — הפרדת סוגי גבולות

הכשל שיוחס בעבר ל-`Ploni-Regular.ttf`, GID 725 (`uniFB4F`) היה השוואה
בין סוגי גבול שאינם שקולים:
- גבול עקומת CFF האמיתי: `xMin ≈ 39`.
- נקודת בקרה חיצונית של TrueType: `xMin = -72`.
- בפלט TrueType ה-LSB הנכון הוא `-72`, ולכן אין היסט אופקי של GlyphSet.
- שימוש ב-LSB הישן `39` היה יוצר היסט שגוי של 111 יחידות.

אין להחזיר את המדד הקודם או את ה-LSB הישן.

## החלטות והמשך

- `MAX_ERR_EM` לא שונה.
- לא הופעל fallback אוטומטי של DecomposingPen; 47 ההמרות החלופיות שנבדקו
  בעבר לא שיפרו את סטיית הגבולות ביחס להמרה הישירה.
- `manualReviewRequired = true`.
- `manualReviewStatus = required`.
- `massConversionApproved = false`.
- אין לשלב את התוצרים בקטלוג הפעיל ואין לייצר הפצה גורפת לפני השלמת
  הסקירה הגאומטרית וקבלת החלטה מפורשת על החריגים.
- אין לטפל בחריג באמצעות כלל מותאם לגופן/גליף. אם תתגלה בעיה אמיתית,
  הפתרון יהיה תיקון אלגוריתמי כללי הנתמך בבדיקות corpus.

## קובצי מקור ובדיקות

- `tools/stress_prove_cff_conversion.py`
- `tools/prove_font_conversion.py`
- `tools/test_raw_glyf_bounds.py`
- Baseline Artifact v4: `14928151801`, run `45410445175` (commit `797467f`).
- Controlled LSB Artifact v4: `14929191082`, run `45411976892` (commit `54e043c`), completed success.
- Expanded geometry + controlled LSB Artifact v5: `14933789403`, run `45421092959` (commit `ee5973e`), completed success.
- CI on `ee5973e`: run `45421093007`; all four jobs (Node 18/20/22 and Layout Audit) completed success.
- Full Math: run `45421093122` (691/691 pages, zero issues, determinism IDENTICAL).
- Preview: run `45421092974` success; Corpus invariants: run `45421092888` success.

