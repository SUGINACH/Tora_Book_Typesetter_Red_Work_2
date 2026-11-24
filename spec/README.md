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

**הכרעה מעודכנת לאחר PoC (24.11.2026):** HarfBuzzJS 1.6.4 הוכח
כמועמד runtime תקין ל-Node ול-classic Worker: ESM נטען מתוך Worker קלאסי
ב-`import()` דינמי, אתחול WASM הושלם, ו-JSON shaping זהה byte-for-byte
לריצת Node על אותה חבילת ESM/WASM. לכן אין צורך להפוך את ה-Worker ל-module
Worker ואין חסם עקרוני בעצם השימוש ב-ESM/WASM.

עם זאת, זו הוכחת runtime מבודדת בלבד. לא בוצעה אינטגרציה ב-`MeasureAPI`,
ב-LineBreaker, ב-PageModel או במקריני DOM/HTML/PDF; לא נבנה חוזה
ShapedRun/ShapedGlyph בייצור; ולא נוספה תלות קבועה ל-`package.json`
או ל-`build-worker-bundle.js`. שילוב מלא עדיין דורש חוזה משותף וראיות
end-to-end בכל יעדי הפלט.

נמצאה גם מגבלת קלט ממשית: HarfBuzzJS אינו מפענח WOFF2 גולמי בממשק Blob
שנבדק. בשני קובצי WOFF2 עבריים התקבלו 42 מופעי GID 0 וללא cmap עברי.
אותם קבצים, לאחר נרמול build-time ל-SFNT באמצעות fontTools/Brotli,
עיצבו עברית מנוקדת בכיסוי מלא. אין להעביר WOFF2 גולמי ל-HarfBuzz כאילו
הוא SFNT; יש לספק bytes מנורמלים/TTF או להוסיף decoder WOFF2 מוכח.
לא בוצעה המרה או החלפה של נכסי הייצור ב-PoC.

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


## הוכחת runtime Node ↔ classic Worker והגבלת WOFF2 — 24.11.2026

### סביבת הוכחה
- HarfBuzzJS: `1.6.4`; HarfBuzz core: `15.0.0`.
- Node: `v22.23.5`.
- Classic Worker אמיתי, שנוצר ללא `{ type: 'module' }`.
- ה-Worker טוען את קובץ ה-helper עם `importScripts()`, ואת HarfBuzz ESM
  באמצעות `import()` דינמי; קובצי WASM/JS מוגשים מקומית מאותו עץ נכסים
  שהועתק לחבילת הבדיקה.
- אותה חבילת ESM/WASM משמשת גם את Node וגם את הדפדפן. לא הוכנסה תלות
  לפרויקט המוצר ולא שונה ה-Worker הקיים.

### תוצאת הריצה המאומתת
- Workflow: `45439848821`; Artifact: `14942623161`;
  commit: `a97ee126d3f26b03a6a5ae37fd0fc7255cfd9ad1`.
- תוצאה: `passed_with_raw_woff2_limitations; normalized_sfnt_supported`.
- 11 מופעי גופן (7 SFNT מקוריים — כולל variable —, 2 WOFF2 גולמיים,
  ו-2 SFNT מנורמלים שנוצרו מהם); 5 מחרוזות עבריות מנוקדות לכל מופע;
  449 מופעי glyph בסך הכול.
- `exactNodeParity=true`; SHA-256 של תוצאת ה-Node ב-PoC v4:
  `c1622f69841d6f50fb66678d29fb68cd4f85f9ed64f847f2d817bdea309a9695`.

ה-PoC v4 הרחיב את ה-fixtures לשני גופני Mixtape המייצגים חריגי CFF
בביקורת v5; פרטים מלאים להלן.
- WOFF2 normalization toolchain ננעלה ל-`fontTools==4.68.0` ו-
  `brotli==1.2.1`; כל WOFF2 נורמל פעמיים לאותו קובץ פלט. שני ה-hashes
  זהים בכל זוג הרצות, עם `deterministicBytes=true`.
  הפלט כולל לכל glyph: GID, cluster, flags, x/y advances, x/y offsets
  ו-outline path. בנוסף מושווים direction/script/language/features,
  unitsPerEm, צירי variation ומצב coverage.
- בכל ששת ה-TTF הסטטיים ובגופן DejaVu baseline: כיסוי עברי וניקוד מלא,
  `notdefGlyphCount=0`.
- Frank Ruhl Libre Variable: ציר `wght` קיים בטווח 300–900
  (ברירת מחדל 400); ה-PoC יישם במפורש `wght=900`, עם כיסוי מלא
  ו-`notdefGlyphCount=0`.

### WOFF2 — raw מול normalized SFNT
שני קובצי המקור שנבדקו:
- `Ambivalenti-Regular.woff2` — raw: כיסוי עברי `none`, חסרים
  12 אותיות בסיס ו-8 סימני ניקוד/טעם; 42 glyph results הם GID 0.
- `FrankBasic-1-regular.woff2` — אותה תוצאה: raw WOFF2 לא חשף
  cmap עברי, ו-42 glyph results הם GID 0.

שני הקבצים נורמלו זמנית ב-build-time על-ידי
`fontTools.ttLib.TTFont` עם `font.flavor=None` ו-Brotli decoder
(אותה משפחת כלי-המרה שכבר קיימת בפרויקט):
- Ambivalenti → `Ambivalenti-Regular.normalized.sfnt`, ‏50,440 bytes,
  UPEM=1000; כיסוי מלא, 0 glyphs חסרים.
- FrankBasic → `FrankBasic-1-regular.normalized.sfnt`, ‏51,140 bytes,
  UPEM=2048; כיסוי מלא, 0 glyphs חסרים.
- Ambivalenti SFNT SHA-256 (שתי הרצות): `087d2a9edda23ae76163806838c508f14d658f283fb6dc8b3e09ba87eb0d1bf4`.
- FrankBasic SFNT SHA-256 (שתי הרצות): `7a16211442d61632f124c99a00ff6f241c3d3fd109ae1968e5575e6d39226883`.
- ה-SFNT נבדק בפועל פעמיים מתוך אותו WOFF2 source; `normalizedSha256 == repeatSha256` ו-byte buffers זהים. זו הוכחת byte-determinism עבור שני fixtures אלה, לא עדיין הוכחה לכל 1,315 המשפחות.

כל שני ה-SFNT המנורמלים עוצבו עם רצפי GID/clusters/advances/offsets
ו-outlines תקינים, וה-parity מול Node היה byte-for-byte. הנכסים המנורמלים
נוצרו בתיקיית temp של GitHub Actions בלבד ונמחקו בסוף הריצה; לא הוכנסו
לספריית הגופנים של RED.

### מסקנות והשלכות ארכיטקטוניות
1. הטעינה של HarfBuzzJS ESM/WASM מתוך classic Worker אפשרית ומוכחת;
   אין הצדקה לשנות את ה-Worker ל-module Worker רק כדי לאפשר Shaping.
2. HarfBuzzJS לא מפענח WOFF2 גולמי דרך Blob API שנבדק. כדי לתת shaping
   אמיתי למשפחות WOFF2 יש לספק ל-HarfBuzz SFNT מנורמל/TTF, או לבנות
   decoder WOFF2 עצמאי ומוכח. אין להסתמך על parity של GID 0.
3. RED כבר מחזיק נתיב המרת WOFF2→TTF מבוסס fontTools/Brotli להכנת נכסים;
   ה-PoC הוכיח שניתן להשתמש באותו עיקרון ב-build-time. עדיין לא הוחלט
   אם הייצור יישען על TTF המוטמע הקיים, על SFNT נוסף ל-shaping, או על
   normalization pipeline קנוני משותף.
4. ה-PoC אינו הוכחת shaping של המנוע כולו: הוא אינו מזין shaped runs
   לשבירת שורות, אינו משנה את PageModel, ואינו מוכיח ציור glyph positions
   זהים ב-DOM/HTML/PDF. אין להתחיל מימוש renderer לפני חוזה
   ShapedRun/ShapedGlyph ו-tests מקצה לקצה.
5. HarfBuzz הוא shaping engine לריצות מוגדרות, לא bidi paragraph engine,
   font fallback resolver, line breaker או paginator. סגמנטציית bidi/script/
   font והחלטות line-break נשארות חלק מחוזה המנוע.

### קובצי PoC
- `tools/shaping-runtime-poc/shape-core.js`
- `tools/shaping-runtime-poc/classic-worker.js`
- `tools/shaping-runtime-poc/index.html`
- `tools/shaping-runtime-poc/run.js`
- `tools/shaping-runtime-poc/normalize_woff2.py`
- `.github/workflows/shaping-runtime-poc.yml`

ה-PoC נשאר harness בדיקה בלבד. אין `harfbuzzjs` ב-runtime dependencies,
אין שינוי ב-`MeasureAPI`, ב-`build-worker-bundle.js), ב-PDF writer,
ב-DOM renderer, ב-font registry, או בקובצי הקטלוג.


### שער דטרמיניזם לנרמול WOFF2 — אומת ב-Artifact v4

ה-runnable PoC נועל את כלי הנרמול ומבצע שתי המרות עצמאיות לכל מקור WOFF2,
לאותו pipeline, לנתיבי temp נפרדים. הוא משווה את כל הבתים ואת SHA-256 של
כל תוצר; כל mismatch נכשל את ה-workflow. Artifact `14942416493` הראה
`deterministicBytes=true` לשני המקורות שנבדקו. הרחבת ההוכחה לכל קטלוג WOFF2
עדיין נדרשת לפני שהנרמול יוגדר כ-build pipeline קנוני.


## הוכחת shaping לגופני CFF מייצגים (Mixtape) — 24.11.2026

### תוצאת PoC v4
- Workflow: `45439848821`; Artifact: `14942623161`; commit:
  `a97ee126d3f26b03a6a5ae37fd0fc7255cfd9ad1`.
- HarfBuzzJS `1.6.4`, HarfBuzz core `15.0.0`, Node `v22.23.5`.
- 15 font streams; חמש מחרוזות עבריות מנוקדות לכל stream; 617 glyph instances.
  `exactNodeParity=true`; SHA-256 של תוצאת Node:
  `c1622f69841d6f50fb66678d29fb68cd4f85f9ed64f847f2d817bdea309a9695`.
- ה-Worker הוא classic Worker, לא module Worker; `importScripts()` טוען helper,
  `import()` דינמי טוען ESM, ו-WASM נטען. תוצאת Worker זהה byte-for-byte
  ל-Node עבור GID, clusters, glyph flags, x/y advances, x/y offsets ו-outline paths.

### Mixtape — הוכחת CFF ממשית
שני קובצי ה-WOFF2 של Mixtape נורמלו ל-SFNT על ידי fontTools/Brotli, עם
`fontTools==4.68.0` ו-`brotli==1.2.1`. בדיקת table tags וזיהוי SFNT signature
הראו `CFF ` וחתימת `OTTO` — לא `glyf/loca`:

| מקור | תוצר SFNT | גודל | Glyphs | UPEM | SHA-256 | Format |
|---|---|---:|---:|---:|---|---|
| Mixtape-Bold.woff2 | Mixtape-Bold.normalized.sfnt | 47,956 | 204 | 1000 | `41a60f8dc6b837bee17d662a2979dd4b3d5fee366be2b3e3b25bfd8ee1e90d76` | CFF |
| Mixtape-Regular.woff2 | Mixtape-Regular.normalized.sfnt | 47,012 | 204 | 1000 | `e7c15710dfdb9c512d5eee0e9aa3deac5d1af43474aa3e51e8cd550177079819` | CFF |

לכל תוצר בוצעו שתי המרות עצמאיות; ה-byte buffers וה-SHA-256 היו זהים
(`deterministicBytes=true`). כל אחד משני משקלי Mixtape עוצב בחמש מחרוזות
הבדיקה: 42 glyph instances, כיסוי מלא של אותיות וניקוד, `notdefGlyphCount=0`,
ללא codepoints חסרים. HarfBuzz החזיר outlines לכל GID ברצפים אלה, ו-Worker
החזיר אותם byte-for-byte כמו Node.

### WOFF2 raw לעומת normalized
- raw `Mixtape-Bold.woff2` ו-`Mixtape-Regular.woff2`: HarfBuzzJS Blob לא
  מפענח WOFF2 גולמי; 42/42 glyph results לכל fixture היו GID 0, cmap עברי
  לא נחשף. הם מסומנים `unsupported` ואינם נספרים כהצלחת shaping.
- normalized SFNT של שני הקבצים: שניהם CFF, Hebrew/niqqud coverage מלא,
  0 `.notdef`, ותוצאות shaping תקינות. לכן מגבלת WOFF2 היא decode/format
  boundary ולא מגבלת HarfBuzz לעיבוד CFF outlines.
- Ambivalenti normalized SFNT הוא גם CFF: 444 glyphs, UPEM 1000, 50,440 bytes,
  SHA-256 `087d2a9edda23ae76163806838c508f14d658f283fb6dc8b3e09ba87eb0d1bf4`;
  גם הוא עבר coverage מלא ו-Node/Worker parity.
- FrankBasic normalized SFNT הוא glyf/loca: 440 glyphs, UPEM 2048,
  51,140 bytes, SHA-256 `7a16211442d61632f124c99a00ff6f241c3d3fd109ae1968e5575e6d39226883`.

### גבול ההוכחה
- שתי משפחות Mixtape בלבד נבדקו עבור CFF; זו הוכחת CFF parsing/shaping עובדת
  על fixtures אלה, לא הוכחה שכל קובצי CFF/WOFF2 בקטלוג תקינים.
- בכל גופן נבדקו חמש מחרוזות בלבד (42 glyph instances), לא כל 204 ה-GIDs.
  נדרשת בדיקה של glyph-to-path לכל GID בשני הקבצים לפני מסקנה על שלמות outlines
  של הגופן כולו, ובנוסף בדיקות shaping corpus ייעודיות לרצפים נוספים.
- אין עדיין integration ב-MeasureAPI/LineBreaker/PageModel/DOM/PDF; ה-PoC
  אינו משנה font registry, asset pipeline, production bundles או renderer.
- אין לאשר WOFF2 raw או להסתמך על raw `Blob` ל-shaping. יש לספק SFNT/TTF
  מנורמל ב-build-time; נרמול קנוני לכל הקטלוג עדיין לא נבנה.


## Full CFF glyph-outline sweep — כל GID בכל גופן CFF שנבדק (24.11.2026)

- Workflow: `45441777638`; Artifact: `14942924363`;
  commit: `e1c01fdc15e4d63e21404a74bc8f36f7e68ab392`.
- נוספה בדיקה שקוראת `maxp.numGlyphs` ואז מפעילה `font.glyphToPath(gid)`
  עבור כל GID מ-0 ועד numGlyphs-1 בכל SFNT שזוהה בו `CFF`/`CFF2`.
  ערך שאינו string גורם ל-workflow להיכשל; מחרוזת ריקה נספרת כגליף ללא דיו,
  ולא כשגיאה. לכל הגליפים נוצר FNV-1a digest דטרמיניסטי של GID ו-path.
- תוצאות Node; Worker החזיר בדיוק אותם מספרים ו-digests:

| CFF SFNT | GIDs | עם outline לא ריק | outline ריק | סך תווי paths | digest |
|---|---:|---:|---:|---:|---|
| Ambivalenti-Regular.normalized.sfnt | 444 | 443 | 1 | 89,720 | `54a1505e` |
| Mixtape-Bold.normalized.sfnt | 204 | 203 | 1 | 105,218 | `5fd1c7a3` |
| Mixtape-Regular.normalized.sfnt | 204 | 203 | 1 | 102,150 | `b5f16556` |
| **סה"כ** | **852** | **849** | **3** | **297,088** | — |

- `exactNodeParity=true`; output SHA-256 של Node/Worker shaping + outline sweep:
  `9c878d6c41dffc1143b81668cf2ed44f0765a1b9e0d789d298df1ed41b597d61`.
- כל 852 הקריאות הסתיימו ללא exception או תוצאה שאינה string. שלושת ה-empty
  outlines נשמרו בנפרד ומפורשים כגליפים ללא מתאר גלוי, לא ככשל extraction.
- המשמעות: HarfBuzzJS CFF outline extraction פועל עבור כל GID בשלושת קובצי
  SFNT שנבדקו, כולל שני משקלי Mixtape שהופיעו בחריגי CFF v5. זו אינה השוואת
  Bézier mathematically מול מקור, ואינה הוכחה שכל glyph paths נאמנים לאחר
  normalization; זהו full-GID API sweep עם digest ו-Node/Worker parity.
- Raw WOFF2 נשאר unsupported; ה-sweep נעשה על SFNT מנורמל (CFF/CFF2),
  לא על WOFF2 גולמי. לא הוכנסו נכסים מנורמלים ל-production.


## הוכחת Node/Worker + CFF source-vector parity מורחבת — 24.11.2026

### ריצה וארטיפקט
- Commit: c3433737a5cff373e85e8f5da8ce3b7dce757ff4.
- Workflow: 45451884094; Artifact: 14948224078; conclusion: success.
- Report result: passed_with_raw_woff2_limitations; normalized_sfnt_supported.
- HarfBuzzJS 1.6.4; HarfBuzz core 15.0.0; Node v22.23.5.
- 15 font streams, 5 Hebrew/niqqud cases per stream, 617 glyph instances.
- Classic Worker (not module Worker), dynamic ESM import and WASM all passed.
  exactNodeParity=true; Node/Worker output SHA-256:
  6f2ff5e91d7e138d5551a0f943ec2140e1b4940e035fce9ac9a856cd7b51e7bc.
  ההשוואה כוללת GID, cluster, flags, x/y advances, offsets, paths, variation,
  coverage ו-full outline sweep metadata.

### כיסוי הגופנים
מתוך 15 streams:
- 7 קובצי SFNT/TTF קיימים (כולל baseline DejaVu Sans וגופן
  Frank Ruhl Libre Variable עם wght=900) — כיסוי עברי וניקוד מלא,
  notdefGlyphCount=0.
- 4 קובצי WOFF2 גולמיים — כל אחד החזיר 42/42 GID 0; הם סווגו
  unsupported ואינם נספרים כהצלחת shaping.
- 4 קובצי SFNT שנוצרו מאותם WOFF2 — כיסוי מלא, אפס codepoints חסרים,
  notdefGlyphCount=0.

### נרמול WOFF2 דטרמיניסטי
הנרמול נעשה פעמיים לכל מקור באמצעות
fontTools==4.68.0 ו-brotli==1.2.1; byte buffers ו-SHA-256
היו זהים בכל זוג הרצות:

| מקור WOFF2 | תוצר SFNT | Format | GIDs | Bytes | SHA-256 |
|---|---|---|---:|---:|---|
| Ambivalenti-Regular.woff2 | Ambivalenti-Regular.normalized.sfnt | CFF | 444 | 50,440 | 087d2a9edda23ae76163806838c508f14d658f283fb6dc8b3e09ba87eb0d1bf4 |
| FrankBasic-1-regular.woff2 | FrankBasic-1-regular.normalized.sfnt | glyf/loca | 440 | 51,140 | 7a16211442d61632f124c99a00ff6f241c3d3fd109ae1968e5575e6d39226883 |
| Mixtape-Bold.woff2 | Mixtape-Bold.normalized.sfnt | CFF | 204 | 47,956 | 41a60f8dc6b837bee17d662a2979dd4b3d5fee366be2b3e3b25bfd8ee1e90d76 |
| Mixtape-Regular.woff2 | Mixtape-Regular.normalized.sfnt | CFF | 204 | 47,012 | e7c15710dfdb9c512d5eee0e9aa3deac5d1af43474aa3e51e8cd550177079819 |

הקבצים המנורמלים נוצרו ב-temp של Actions בלבד ונמחקו בסיום; אין שינוי
בקטלוג או בנכסי הייצור. ה-proof חל על ארבעת fixtures האלה, ולא על כל
1,315 משפחות הקטלוג המורחב.

### CFF source-vector proof — 852/852 GIDs
נבדקו כל קווי המתאר של שלושת SFNT מסוג CFF:
- Ambivalenti: 444 GIDs.
- Mixtape Bold: 204 GIDs.
- Mixtape Regular: 204 GIDs.
- סך הכול: 852 glyphs; 849 עם outline לא ריק ו-3 outlines ריקים
  (אחד בכל גופן). המקור והפלט הסכימו לגבי כל שלושת ה-empty outlines.

ההשוואה נעשתה בין SVG paths שהופקו מ-HarfBuzz לבין פעולות
fontTools RecordingPen של אותו GID בגופן המקור. נמצא הבדל ייצוג
סמנטי בלבד: HarfBuzz SVG serializer פלט לעיתים lineTo מפורש לנקודת
תחילת הקונטור מיד לפני closePath, בעוד fontTools מייצג את אותה סגירה
ב-closePath בלבד. הבודק מנרמל רק את קטע הסגירה המפורש הזה כאשר
נקודת הקצה שווה לנקודת תחילת הקונטור; הוא אינו מסיר קו בעל אורך,
אינו משנה כיוון/סדר קונטורים ואינו משטח עקומות.

תוצאות:
- 852/852 התאמות מלאות של רצף הפעולות לאחר הנרמול המצומצם.
- 852/852 התאמות קואורדינטות בתוך סבילות 1e-5 יחידות גופן.
- coordinateMismatches=0; operationSequenceMismatches=0.
- maxCoordinateDeltaFontUnits=0 בכל שלושת הגופנים.
- 484 קטעי סגירה כפולים הוסרו בייצוג ההשוואה בלבד.
- cffSourceOutlineComparison.passed=true.

זו הוכחת נאמנות וקטורית של outlines עבור כל GID בשלושת ה-fixtures
הללו לאחר normalization; היא אינה הוכחה שכל גופני CFF/WOFF2 בקטלוג
תקינים, ואינה אישור mass conversion. היא גם אינה הוכחה ל-render parity
של DOM/PDF.

### מצב שערי הפרויקט על אותו commit
- Shaping PoC 45451884094: success.
- Corpus 45451884137: success.
- Preview 45451884196: success.
- Full Math 45451884021: success.
- Layout Audit בתוך CI 45451884168: success.
- Node 18/20/22 בתוך CI 45451884168: עדיין in progress בעת כתיבת
  העדכון; אין להכריז על CI מלא כ-green עד לסיום שלושת ה-jobs.

### גבולות שאינם משתנים
- WOFF2 raw נשאר unsupported בקלט Blob של HarfBuzzJS; נדרש SFNT/TTF
  מנורמל ב-build-time.
- הנרמול אינו pipeline קנוני לכל הקטלוג ולא נוסף ל-production.
- אין integration ב-MeasureAPI, LineBreaker, PageModel, DOM/HTML או PDF.
- font-subset.js הנוכחי ממוקד glyf/loca; הוכחת outlines CFF אינה
  מוכיחה embedding/subsetting של CFF ב-PDF.
- TYP-SHAPING-01 נשאר פתוח עד חוזה ShapedRun/ShapedGlyph ו-end-to-end
  shaping-before-line-break/render/export parity.


## PoC v7 — UTF-16 clusters, glyph extents ו-CFF source parity (24.11.2026)

### ריצה ו-Artifact
- Commit: `bdefac0795452d3c8e9a78f05caf932446a66823`.
- Run: `45464251243`; Artifact: `14954247955`; conclusion: success.
- HarfBuzzJS 1.6.4 / HarfBuzz core 15.0.0 / Node v22.23.5.
- 15 font streams, 5 מקרי עברית מנוקדת לכל stream, 617 glyph instances.
- Node/classic Worker: `exactNodeParity=true`, output SHA-256
  `c06da4e4b69d3546e0be3f64a067c4caf0ab1191df8b91dd068cf1eb514926f2`.

### UTF-16 source clusters
Probe `A😀B`:
- `utf16Length=4`, `unicodeScalarCount=3`.
- expected/actual clusters: `[0,1,3]`.
- expected/actual GIDs: `[36,5857,37]`.
- HarfBuzz cluster offsets are UTF-16 code-unit offsets, matching the engine's
  JavaScript `sourceRange` coordinates for this probe.
- הוכח supplementary scalar אחד ב-LTR. עדיין נדרשות בדיקות RTL, descending
  cluster order, ligatures, multiple glyphs per cluster ו-cluster source-end
  mapping.

### Glyph ink extents
- Shaped glyph instances: 617.
- Outlines לא ריקים: 449; extents סופיים: 449.
- Outlines ריקים ללא extents: 168.
- `outlinedGlyphsMissingExtents=0`; `invalidExtents=0`.
- היחידות בדוח: font units. טרם הוכח שילוב מלא של pen position, offsets,
  sign conventions ו-Y-axis ב-px של המנוע.

### CFF source-vector proof
השוואה מול WOFF2 המקורי שנפתח ישירות ב-fontTools, לא מול SFNT מנורמל:
- Ambivalenti-Regular: 444/444 GIDs.
- Mixtape Bold: 204/204.
- Mixtape Regular: 204/204.
- סך הכול 852/852 operation+coordinate matches; אפס mismatches,
  `maxCoordinateDeltaFontUnits=0`, glyph order ו-UPEM תואמים.
- canonicalization מסיר רק explicit zero-length `lineTo(start)` מיד לפני
  `closePath`; אינו משנה קו בעל אורך או Bézier.
- ההוכחה מוגבלת לשלושה מקורות CFF. WOFF2 raw עדיין unsupported ב-HarfBuzzJS
  Blob; רק ה-SFNT המנורמל מעוצב.

### תוצאה והגבלות
- הוכחת Node/classic Worker, WASM, UTF-16 cluster probe ו-ink extents
  עברה; אין בה production changes.
- היא אינה מוכיחה bidi paragraph itemization, grapheme fallback, mixed-script
  segmentation, line-break reshape, DOM/HTML/PDF renderer parity או PDF
  subsetting/embedding.
- הקוד ב-`tools/shaping-runtime-poc/` נשאר harness בדיקה; אין תלות
  `harfbuzzjs` ב-production runtime.
- דוח גבולות האינטגרציה שנוסף:
  `audits/SHAPING_INTEGRATION_BOUNDARIES_2026-11-24.md`.

### מצב Actions על commit bdefac0 בעת כתיבת העדכון
- Shaping PoC 45464251243: success.
- Full Math 45464251359: success.
- Preview 45464251312: success.
- Corpus 45464251303: success.
- Layout Audit בתוך CI 45464251283: success.
- Node 18/20/22 באותו CI: in_progress בעת הבדיקה; אין להכריז על CI מלא כ-green
  עד לסיום שלושת ה-jobs.


## PoC v10 — תיקון semantics של glyphExtents (24.11.2026)

Run `45467805796`, Artifact `14955353770`, commit
`a7db7e8b28e343bbf71bf6dd9eabf0f835e7a2ee` הסתיים success.

### השוואה לכל 852 ה-GIDs של שלושה מקורות CFF מקוריים

| מדד | תוצאה |
|---|---:|
| HarfBuzz glyphExtents מול fontTools ControlBoundsPen | 852/852 |
| Control-bound mismatches | 0 |
| Max control-bound delta | 0 font units |
| HarfBuzz glyphExtents מול fontTools BoundsPen (tight curve) | 433/852 |
| True-curve disagreements | 419 |
| Max true-curve delta | 56.1117434352 font units |

Ambivalenti: 444 control matches; 14 true-curve disagreements.
Mixtape Bold: 204 control matches; 202 true-curve disagreements.
Mixtape Regular: 204 control matches; 203 true-curve disagreements.

**מסקנה:** `glyphExtents` ב-HarfBuzzJS 1.6.4 תואם ל-control-point box
ולא לגבול העקומה האמיתי. אין להשתמש בו כ-`inkBounds`. החוזה חייב
להפריד `controlBounds` שמרני מ-`inkBounds` הדוק. האחרון ייגזר מ-outline
path באמצעות חישוב extrema אנליטי של Bézier; אם לא ניתן לחשבו, יש לסמן
unavailable/diagnostic ולא להחליף אותו ב-control box.

### Source range proof (PoC v9/v10)
75/75 cases RTL עברו מונוטוניות לא-עולה של clusters; 617/617 glyphs
קיבלו absolute UTF-16 sourceRange תקין; 345 clusters ייחודיים, 220
multi-glyph cluster groups, 272 glyphs עם cluster חוזר, אפס range errors,
אפס surrogate splits ואפס source coverage gaps. Probe `A😀B` החזיר
clusters [0,1,3] ו-ranges [37,38), [38,40), [40,41).

Node/classic Worker: `exactNodeParity=true`; 15 font streams,
617 glyph instances, HarfBuzz core 15.0.0. CFF source outlines:
852/852 operation+coordinate matches מול WOFF2 המקוריים; אפס mismatches.


## Unicode 18 UTF-16 Bidi POC (24.11.2026)

Workflow `45480673152`, Artifact `14962026789`, code commit
`96e357e74ac625f47bdb5844b8f2e310ec24b09f` passed:
39/39 library unit tests, 4/4 official Unicode 18 Bidi conformance tests,
3/3 doc tests, WASM build, classic Worker execution and exact Node/Worker
JSON parity. Ten mixed-direction fixtures generated 13 paragraphs, 44 logical
runs and 37 line probes. UTF-16 surrogate, empty text, paragraph direction
and L1 trailing whitespace probes passed. Full details:
`audits/BIDI_UNICODE18_RUNTIME_2026-11-24.md`.

This remains a POC: L3/L4, script/font itemization, grapheme fallback,
RED line-breaker integration and renderer parity are still open.


- [ICU4X Unicode 18 → HarfBuzz shared shaping POC — 25.11.2026](../audits/ICU4X_HARFBUZZ_SHARED_SHAPING_POC_2026-11-25.md)
