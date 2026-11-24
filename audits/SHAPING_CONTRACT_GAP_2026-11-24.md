# ביקורת פער Shaping בין המדידה, PageModel ויעדי הפלט — 24.11.2026

## מעמד

**ממצא ארכיטקטוני מאומת בקוד; לא שינוי מימוש ולא אישור מעבר ל-Shaping.**

הביקורת בוצעה בענף `engine/legacy-parity-preview-20261119` על HEAD
`54e043c3699b2cbccc87345eb3a6e812ef892628`. מטרתה לזהות את חוזי הנתונים
האמיתיים בין המדידה, שבירת השורות, PageModel, DOM/HTML ו-PDF לפני בחירת
מימוש shaping משותף. לא נוספה תלות, לא שונו גופנים, לא נוצרו מסלולי עימוד
חדשים ולא הוחלף renderer.

## ממצאים מאומתים בקוד

### 1. מדידת הטקסט עדיין מבוססת תווים, לא shaping

ב-`red-build/src/engine/typography/measure-api.js`:

- `_charEm` (סביב שורות 199–214) פותר GID לכל תו בנפרד באמצעות
  `glyphIdOf(fontProfile, ch)`, ואז לוקח advance מתוך `hmtx`.
- `measureTextWidth` (סביב שורות 271–291) עובר על תווי המחרוזת, מוסיף
  advance לכל תו, kerning זוגי באמצעות `_kernEm`, ו-tracking.
- יש טיפול ייעודי בסימנים משולבים ובתווי bidi/format ברוחב אפס, אך אין
  יצירת רצף glyphs מעוצב, אין GSUB ligatures/substitutions כלליות, אין
  GPOS mark attachment/positioning כללי, ואין מיפוי cluster-to-glyph.

ב-`font-metrics.js` פרסר GPOS מוגבל ל-PairPos type 2 format 1 עם
XAdvance בלבד (ValueFormat1=0x0004 ו-ValueFormat2=0). זהו kerning זוגי
מוגבל, ולא shaping מלא.

### 2. הפילוח למילים נעשה לפני shaping

ב-`red-build/src/engine/line/line-items.js`:

- `buildContainerSequence` מפצל וממיר פריטי טקסט לתיבות לפני המדידה.
- `splitTextItem` יוצר מילים ו-fragments לפי ריצות המקור.
- שלב המדידה הקנוני מודד כל תיבה באמצעות `measureItem`, אך אין בשלב זה
  רצף shaped glyphs שממנו נגזרים רוחב המילה, נקודות השבירה והפוזיציות.

לכן אין עדיין חוזה שמבטיח שגבול מילה/שורה חופף לגבול shaping חוקי, במיוחד
במקרים שבהם substitution או mark positioning תלויים בהקשר.

### 3. DOM ו-HTML מבצעים shaping מחדש אחרי קביעת הגאומטריה

ב-`red-build/src/engine/output/pagemodel-dom-renderer.js`, בפונקציה
`renderModelLine` (שורות 64–124):

- המיקום של כל מילה נלקח מ-`wd.x` ומוקרן ל-span מוחלט.
- הטקסט הגולמי מועתק ל-`span.textContent`.
- הדפדפן מקבל את משפחת הגופן ואת הגודל, ומבצע shaping משלו על המחרוזת.

כלומר ה-PageModel מקבע תיבת מילה ומיקום, אך אינו מקבע את הגליפים ואת
ההיסטים שאותם הדפדפן מצייר. HTML העצמאי משתמש באותו מקרין DOM, ולכן חולק
את אותו פער.

### 4. PDF ממיר Unicode ל-GID תו-אחר-תו

ב-`red-build/src/engine/output/export-api.js`:

- מלאי ה-subsetting נאסף ממחרוזות הטקסט המצוירות.
- `buildSubset` מקבל תווים ומפיק GID-ים דרך cmap.
- אובייקט הגופן שמועבר לכותב ה-PDF מספק `cidOf(ch)`, כלומר lookup לפי תו.

ב-`red-build/src/engine/typography/font-subset.js`:

- בניית תת-הגופן מתחילה מ-Unicode characters וממירה אותם ל-GID.
- נשמרת סגירת רכיבים קומפוזיטיביים ומבוצע remapping של GID ישן לחדש.
- ה-cmap החדש נבנה מתווים שנשמרו. אין API שמקבל במפורש אוסף GID-ים
  שנוצרו מ-shaping, ואין טבלת mapping ל-clusters.

ב-`red-build/src/engine/output/pdf-writer.js`:

- `visualOrderRtl` מסדר תווים ומבצע שיקוף סוגריים באופן ידני.
- `emitWord` ממיר כל תו ל-CID/GID ומפיק Tj.
- `buildToUnicode` ממפה GID לתו Unicode יחיד.

המבנה הזה אינו מייצג ligature שגליף יחיד שלה מייצג כמה תווי מקור, וגם לא
כמה glyphs המשויכים לאותו cluster. כמו כן הוא אינו צורך offsets ו-advances
שנוצרו מ-shaping. אין להסיק מכך שה-PDF הנוכחי אינו מציג עברית רגילה; הממצא
הוא שחוזה הפלט הנוכחי אינו חוזה ShapedGlyph כללי.

## מסקנה

הפער אינו נפתר על ידי הוספת HarfBuzz למדידה בלבד. גם אם המנוע יחשב shaped
advances, שני המקרינים עדיין יציירו מחרוזות Unicode עצמאיות, וה-PDF עדיין
יבצע cmap lookup לכל תו. שינוי מקומי ב-`MeasureAPI` ייצור פער חדש ולא
יסגור את החוזה המשותף.

נדרש אובייקט shaping אחד, בלתי-תלוי ב-renderer, שנוצר לפני החלטות השבירה
ומלווה כל מילה/fragment עד ל-PageModel ולכל יעד פלט.

## דרישות מינימום לחוזה ShapedRun / ShapedGlyph

החוזה העתידי צריך לכלול, לכל run:

1. זהות גופן יציבה (כולל hash של bytes/גרסה), face index, ו-variation axes
   מפורשים ונורמליים.
2. script, language, direction, features, writing mode, וגבולות הריצה
   שנקבעו לאחר bidi/script/font segmentation.
3. טקסט מקור מלא וטווחי Unicode source indices; cluster level ומדיניות
   cluster מפורשת.
4. רצף glyphs מסודר: GID, cluster/source range, x/y advance, x/y offset,
   ו-ink bounds במערכת יחידות אחת.
5. מיפוי חד-משמעי glyph-to-source ו-source-to-glyphs, לרבות ligatures,
   combining marks ו-multiple glyphs per cluster.
6. ascent/descent ונתוני baseline הנגזרים מהגופן/הריצה, ללא מדידה מחדש
   ברנדרר.
7. גבולות shaping חוקיים בתחילת/סוף שורה, כולל כללי reshape של הקשרי
   תחילת/סוף טקסט כאשר שבירת שורה משנה את ההקשר.
8. diagnostics מפורשים עבור glyph חסר, fallback, axis/feature לא נתמך,
   או cluster שאינו ניתן לפיצול.

ה-LineBreaker צריך לשבור רק בגבולות cluster חוקיים. כל חישובי רוחב, שבירה,
justify ופוזיציות glyphs צריכים להיגזר מאותו shaping result; אין לאפשר
ל-DOM/HTML/PDF לחשב shaping שני.

## דרישות התאמה ליעדי הפלט

- **DOM/HTML:** אין די בהצבת מחרוזת Unicode ב-span, משום שהדפדפן יבצע shaping
  מחדש. יש להוכיח דרך ציור שמכבדת GID ו-position data מהמודל — למשל נתיב
  glyph מבוסס outlines או מנגנון רינדור אחר שנבחן מול אותו מקור גופן.
  בחירת המנגנון פתוחה; אין להניח מראש ש-SVG outline הוא פתרון מלא לכל
  סוגי הגופנים (Variable/Color/CFF/TrueType) ולכל תכונות הגופן.
- **PDF:** ה-subsetter צריך לשמר את GID-ים שנצרכו בפועל, למפותם ל-CID-ים
  חדשים בלי לאבד קשר ל-GID המקורי, ולכתוב advances/offsets מפורשים. יש
  להגדיר ToUnicode/ActualText לפי clusters, לא להניח GID→תו יחיד.
- **HTML export ו-live DOM:** חייבים להשתמש באותו shaped representation
  ובאותה הקרנה, ולא להפעיל shaping של הדפדפן כשלב קובע נוסף.

## בדיקת HarfBuzzJS

נבדקה חבילת `harfbuzzjs` בגרסה `1.6.4` מול המקור הציבורי
`https://github.com/harfbuzz/harfbuzzjs` וה-README שלה.

- ה-API מספק Buffer shaping, glyph infos ו-glyph positions (GID,
  cluster, x/y advance ו-offset), ותומך בהגדרת direction/script/language,
  features ו-variations.
- ה-package מוגדר כ-ESM (`type: module`), הכניסה היא
  `dist/index.mjs`, וה-init משתמש ב-`await` ברמת המודול. המימוש מפיק
  מודול HarfBuzz JS ו-WASM נפרד.
- `tools/build-worker-bundle.js` של הפרויקט הוא bundler CommonJS פנימי
  שמייצר classic Worker. הוא פותר `require` יחסי, אינו בונה ESM ואינו
  מספק loader ל-WASM חיצוני. אין בפרויקט כרגע שכבת runtime dependencies
  או תהליך build שמוכיח שילוב של ESM+WASM זה ב-Node וב-classic Worker.

**הכרעה:** HarfBuzzJS הוא מועמד פונקציונלי ל-shaping, אך אינו תלות שניתן
להוסיף ישירות לבאנדל הנוכחי. לפני שילוב נדרשת הוכחה קטנה ודטרמיניסטית של
אותו font+text+axes+features ב-Node וב-classic Worker, כולל hash זהה של
תוצאות shaping, טעינת WASM מקומית/מוטמעת, disposal וזיכרון. אם לא ניתן
להוכיח זאת, יש לבחון build self-contained או חלופה אחרת. לא בוצעה התקנה
או הוספת תלות ב-commit זה.

HarfBuzz מבצע shaping לריצות שסופקו לו; הוא אינו מחליף את אלגוריתם ה-bidi
של הפסקה, סגמנטציית script/font, שבירת שורות או pagination. שלבים אלה
יישארו באחריות המנוע ויזינו לרכיב shaping ריצות מוגדרות.

## גבולות ומבחני קבלה לפני מימוש

- אין שינוי במנוע או ברינדור במסגרת ביקורת זו.
- אין שינוי בקטלוג הגופנים, ב-font fallback, בברירות המחדל או ב-subsetting.
- אין להסיק הצלחה ממבחן shaping ב-Node בלבד; נדרשת אותה בדיקה ב-classic Worker.
- יש להוסיף fixtures עבריים: ניקוד, דגש, שווא, קמץ קטן, מקפים, גרש/גרשיים,
  ליגטורות, אותיות סופיות, סוגריים, עברית+לטינית+ספרות, כיווני bidi מעורבים,
  fallback בין גופנים, glyph חסר ו-variation axes.
- נדרשת השוואה בין advances, offsets, glyph IDs ו-clusters, ובהמשך גם
  השוואת דיו ב-DOM/HTML/PDF.
- נדרש round-trip של text extraction/ActualText ב-PDF בלי אובדן המקור.
- נדרשת הוכחת determinism, no hidden renderer measurement, ו-zero shaping
  divergence בין שלושת היעדים.
- אין להתחיל את F7/fragment-flow correction לפני שגופנים ו-shaping יציבים,
  בהתאם לסדר העבודה המחייב.

## קובצי מקור שנבדקו

- `red-build/src/engine/typography/measure-api.js`
- `red-build/src/engine/typography/font-metrics.js`
- `red-build/src/engine/line/line-items.js`
- `red-build/src/engine/output/pagemodel-dom-renderer.js`
- `red-build/src/engine/output/export-api.js`
- `red-build/src/engine/typography/font-subset.js`
- `red-build/src/engine/output/pdf-writer.js`
- `tools/build-worker-bundle.js`
- `red-build/package.json`
