# Shaping integration boundaries — מיפוי חוזה המימוש הקיים (24.11.2026)

## מעמד

**ביקורת עצמאית של נקודות החיבור, על HEAD `bdefac0795452d3c8e9a78f05caf932446a66823`.**
המסמך מבוסס על קוד הענף ועל Artifact `14954247955` מריצת
`45464251243`. הוא אינו מציג את ה-PoC כמימוש מנוע, ואינו משנה את ברירות
המחדל, את ה-renderers, את קטלוג הגופנים או את ה-LineBreaker.

המטרה היא למנוע אינטגרציה חלקית שבה HarfBuzz מחליף את מדידת הרוחב בלבד,
אבל פרטי הגליפים אובדים לפני DOM/PDF או מחושבים מחדש בכל יעד.

## 1. שערי הוכחה שכבר נסגרו ב-PoC

### 1.1 Runtime ו-Worker
- HarfBuzzJS `1.6.4`; HarfBuzz core `15.0.0`; Node `v22.23.5`.
- ESM נטען ב-Node באמצעות `import()`.
- ב-classic Worker נעשה שימוש ב-`importScripts()` ל-helper וב-`import()`
  דינמי למודול ESM; WASM נטען בהצלחה.
- Node ו-classic Worker החזירו JSON זהה byte-for-byte. ב-PoC v7
  SHA-256: `c06da4e4b69d3546e0be3f64a067c4caf0ab1191df8b91dd068cf1eb514926f2`.
- 15 font streams ו-617 מופעי glyph בחמש מחרוזות עבריות מנוקדות לכל stream.

### 1.2 חוזה clusters ו-ink extents
- Probe `A😀B`: אורך UTF-16 הוא 4, מספר Unicode scalars הוא 3;
  clusters צפויים ומתקבלים: `[0,1,3]`; GIDs: `[36,5857,37]`.
  לכן HarfBuzzJS `Buffer.addText` מחזיר offsets ביחידות UTF-16 התואמות
  ל-`String.length` ול-`sourceRange` במנוע. ההוכחה מכסה supplementary
  scalar אחד ב-LTR, ולא עדיין כל תרחישי RTL/ligature/cluster merging.
- מתוך 617 מופעי glyph מעוצבים: 449 outlines לא ריקים ו-449 ink extents
  סופיים; 168 outlines ריקים ללא extents; אפס outline לא-ריק ללא extents;
  אפס extents לא-סופיים.
- HarfBuzz glyph extents מוחזרים ביחידות font units. יש להמיר אותם ליחידות
  המנוע במקום אחד בלבד, לפי UPEM ו-scale של ה-run, תוך שילוב offsets
  ו-current pen position.

### 1.3 מקור CFF ו-WOFF2
- 3 מקורות WOFF2 מסוג CFF נורמלו ל-SFNT ב-build זמני באמצעות
  fontTools `4.68.0` ו-Brotli `1.2.1`. כל מקור נורמל פעמיים,
  עם byte-identical output ו-SHA-256 זהה.
- השוואת outlines בוצעה מול **המקור WOFF2 המקורי** בעזרת fontTools
  RecordingPen, ולא מול ה-SFNT המנורמל: Ambivalenti 444 GIDs,
  Mixtape Bold 204, Mixtape Regular 204 — סה"כ 852/852.
- לאחר נרמול ייצוגי מצומצם בלבד של `lineTo(start)` אפסי לפני
  `closePath`: אפס הבדלי רצף-פעולות, אפס הבדלי קואורדינטות,
  max delta אפס בכל שלושת הקבצים.
- WOFF2 גולמי נשאר unsupported ב-Blob של HarfBuzzJS; הקלט הנתמך
  ב-PoC הוא SFNT/TTF. ארבעת fixtures המנורמלים שנבדקו אינם הוכחה
  לנרמול מלא של 1,315 משפחות/קובצי WOFF2 בקטלוג.

**הגבול:** הוכחות אלה סוגרות runtime, units של clusters, extents,
ו-vector extraction לשלושה SFNT מסוג CFF. הן אינן מוכיחות bidi paragraph
itemization, font fallback לפי grapheme, shaping של mixed-direction runs,
PDF subsetting של CFF, או DOM/HTML/PDF ink parity.

## 2. זרימת הנתונים הקיימת ונקודות אובדן

| שלב | קובץ/פונקציה | נתונים קיימים | מה חסר לחוזה shaping |
|---|---|---|---|
| מקור טקסט וריצות | `DocumentModel` / `payload.runs` | טקסט, `fontFamily`, טווחי מקור | script/bidi run, language/features, resolved font identity לפני הפילוח |
| פיצול למילים | `line-items.js::splitTextItem` | fragments, `runIndex`, `docStart/docEnd` | פיצול רק בגבולות grapheme/cluster מותרים; run segmentation שלא מנתק combining cluster |
| style + font identity | `wordStyleFor` / `fontIds` | `fontId` לפי alias/fragment | coverage לפי grapheme, axes, face index, מקור/נרמול |
| מדידה קנונית | `measure-api.js::measureItem` | advance פר-run, ascent/descent, segments | glyph infos/positions/clusters/extents; advance ו-ink bounds בנפרד |
| LineItem | `line-items.js::lineItemOf` | measured object, fragments, sourceRange, fontId, measuredAdvance | שמירת shapedRuns כנתון immutable; מיפוי glyph↔source |
| שבירת שורות | `kp-linebreak.js` / `line-model.js::layoutSequence` | תיבות, advances, break opportunities, glue allocation | cut opportunities לפי גבולות cluster חוקיים; reshape-context לגבול שורה |
| LineModel | `line-model.js` | ordered fragments, source ranges, measured advances, baseline, glue | shaped glyph sequence ו-ink bounds ברמת fragment/run |
| Materialization | `core/materialize.js::lineWidthsFromModel/projectLine` | רוחבים נצרכים מה-LineModel; ללא מדידה ב-production | העברת shaped data ללא remeasure או flatten |
| PageModel | `core/page-model.js::placeLine` | מיקום סופי, baseline, text, x/w/fontKey/color | כיום מושמט `fontId`, source fragments, glyph IDs/positions/clusters/extents |
| DOM/HTML | `pagemodel-dom-renderer.js::renderModelLine` | מיקום מוחלט ומחרוזת Unicode ב-span | הדפדפן מבצע shaping מחדש; אין ציור לפי GID ו-position data |
| PDF | `export-api.js`, `font-subset.js`, `pdf-writer.js` | inventory מתווים, cmap→GID, widths, CID/ToUnicode | subset לפי GIDs בפועל; mapping CID↔GID↔cluster; positioning; ToUnicode/ActualText לפי source text |

### מסקנת זרימת הנתונים
נקודת האינטגרציה הראשית למדידה היא `measureItem`, מפני שהיא נקראת פעם
אחת לכל תיבת מילה לפני שבירת השורות ומחזירה את ה-advance שעליו ה-LineBreaker
נשען. אין ליצור ShapingMeasureAPI נפרד. עם זאת, `measureItem` לבדו אינו
נקודת סגירה: יש להעביר את התוצאה דרך LineItem → LineModel → PageModel
→ כל היעדים בלי לאבד אותה.

## 3. גבול גופנים: מקור אחד, bytes אחד, זהות אחת

### 3.1 המצב הנוכחי
- `font-resolver.js::registerFont(alias, bytes, meta)` הוא נקודת הרישום
  הקנונית. הוא מחשב `fontId` מ-SHA-256 של bytes, מנתח דרך
  `font-metrics.parseFont`, ושומר את הפרנסר תחת אותו ID.
- `font-metrics.parseFont` מקבל SFNT signatures `0x00010000` ו-`OTTO`
  (כולל metrics של SFNT מסוג CFF אם הטבלאות הדרושות קיימות), אך WOFF2
  raw ו-TTC collections נדחים. אין ליצור parser/registry מקביל ל-HarfBuzz.
- `imud-library.js::loadFont` מדלג על `registerFont` כאשר המקור הוא
  WOFF2. הדפדפן מקבל FontFace מה-WOFF2, בעוד Worker/MeasureAPI אינם מקבלים
  את אותם bytes ונופלים לפרופיל הטבלה/approximation עם diagnostic.
- ל-`fontResolver.resolveFont` יש fallback לפי alias/stack/default family,
  אך אין בו בחירת גופן לפי coverage של grapheme שלם. אין לחלק base letter
  ו-niqqud בין fonts שונים בלי מדיניות מפורשת.

### 3.2 חוזה מקור מוצע
רישום קנוני יחיד צריך לקבל **תוצר SFNT מנורמל** ואת provenance של המקור:
- `fontId`: hash של ה-bytes שהמנוע אכן מעצב/מודד (normalized SFNT).
- `sourceSha256`: hash של קובץ המקור WOFF2/TTF.
- `normalizedSha256`, `sourceFormat`, `normalizedFormat`,
  `normalizerName/version`, Brotli version כשנדרש, ו-`normalizationProfile`.
- `faceIndex`, `unitsPerEm`, `numGlyphs`, `glyphOrderHash`,
  variable axes/defaults ו-metadata של face.
- alias נשאר alias בלבד; הוא אינו זהות התוכן ואינו cache key של shaping.

הנרמול צריך להיות build/deploy asset pipeline דטרמיניסטי, עם manifest
חתום/ממוספר ו-failure מפורש. אין לדחוף אלפי קובצי SFNT מנורמלים למאגר
אם אפשר להפיקם בזמן build. אין להפעיל output בקטלוג לפני בדיקת כל קובצי
המקור, כולל variable, collections, symbol/partial-Hebrew ו-fonts שאינם
מכילים Hebrew.

## 4. גבול Runtime: asynchronous WASM מול מנוע סינכרוני

### מצב קיים
- HarfBuzzJS initialization דרך ESM/WASM היא asynchronous.
- `engine-worker-main.js::createEngineWorkerMain` מטפל בהודעות באופן
  סינכרוני, ו-`typeset()` סינכרוני.
- `worker-client.js` יכול לשלוח register-font/typeset/export מיד לאחר
  יצירת Worker; אין כרגע ready barrier של shaping.
- `inline-transport.js` מפעיל את אותו handler באותו תהליך באמצעות
  `queueMicrotask`; הוא אינו יכול להניח ש-HarfBuzz כבר initialized.

### תנאי אינטגרציה
לא להוסיף `await import()` בתוך `measureItem` ולא להפוך כל קריאת מדידה
ל-asynchronous. נדרש bootstrap אחד, גלובלי ובעל Promise יחיד:
1. initialize HarfBuzz + WASM לפני קבלת הודעות שמפעילות `typeset`.
2. לפרסם readiness מפורש ולשמר סדר הודעות: רישום גופנים לפני עימוד.
3. לשחזר את אותו readiness ב-respawn של Worker.
4. ל-Node/Inline יהיה אותו initialization contract; בדיקות ישירות ל-`typeset`
   חייבות לקבל initialized runtime לפני כניסה סינכרונית.
5. כשל init חייב להיות error גלוי ומאבחן; אין fallback שקט למדידת טבלה.
6. ה-runtime/wasm binary וגרסת HarfBuzz נכנסים ל-version/hash של shaping
   ול-cache key.

ה-PoC מוכיח dynamic import ב-classic Worker, אך אינו פותר עדיין את ה-ready
barrier ב-WorkerClient/InlineTransport ואת תאימות כל מסלולי Node.

## 5. חוזה ShapedRun / ShapedGlyph

המודל הקנוני צריך להיות עצמאי מ-DOM/PDF, immutable ו-versioned. הצעה:

```js
ShapedRun = {
  schemaVersion,
  fontId, sourceFontSha256, normalizedFontSha256,
  faceIndex, variationAxes, unitsPerEm,
  text, sourceRange: { start, end }, // UTF-16 document offsets
  script, language, direction, features,
  clusterLevel, shapingVersion, fontFallback: null | diagnostic,
  glyphs: [ShapedGlyph],
  advance: { x, y, unit: "font-units" },
  inkBounds: { xMin, yMin, xMax, yMax, unit: "font-units" }
};

ShapedGlyph = {
  gid, cluster,
  sourceRange: { start, end }, // UTF-16; כמה glyphs יכולים לחלוק cluster
  flags,
  xAdvance, yAdvance, xOffset, yOffset,
  inkBounds: { xBearing, yBearing, width, height },
  outlineRef // או outline path/cache key; מנגנון האחסון פתוח
};
```

### כללי המקור וה-cluster
- `cluster` הוא UTF-16 code-unit offset ביחס לטקסט שהוזן ל-buffer;
  לתיעוד מקור מוחלט מוסיפים `sourceRange.start`.
- RTL עלול להחזיר glyphs בסדר ויזואלי ו-cluster offsets שאינם עולים
  מונוטונית. אין לחשב `sourceEnd` לפי glyph הבא במערך. בונים boundaries
  מקבוצת cluster starts ייחודית, ממיינים אותם בסדר לוגי וממפים כל cluster
  לטווח הבא; כמה glyphs יכולים לשתף את אותו cluster.
- `MONOTONE_GRAPHEMES` לבדו אינו מחליף UAX #29 / script segmentation /
  bidi. אין לחתוך combining sequence, ligature או grapheme באמצע.
- כל ink position נגזר מ-pen origin + offsets + extents באותו coordinate
  convention. יש להוכיח סימני RTL ו-Y-axis במבחני יחידות לפני המרה ל-px.
- Font fallback נבחר עבור grapheme שלם, לא תו בודד. אם אף גופן אינו מכיל
  base+marks ביחד, יש diagnostic או מדיניות קומפוזיציה מפורשת — לא פיצול שקט.
- Cache key חייב לכלול לפחות: normalized fontId, faceIndex, canonical
  variation axes, script, language, direction, features, cluster level,
  source text/run boundary, HarfBuzz/normalizer version.

## 6. שבירת שורות ושילוב עם מודל הקיים

1. Itemization של paragraph: bidi runs (אלגוריתם UAX #9), script runs,
   language, font/grapheme fallback, style/feature runs.
2. Shaping של הריצות לפני יצירת תיבות המדידה. גבולות run ייקבעו לפי font,
   script, direction, language, feature/variation state — לא רק לפי CSS run.
3. `measureItem` יחזיר `advancePx` מסכום positions של אותו ShapedRun,
   `inkBounds` אמיתי, ascent/descent ובקשות שבירה חוקיות.
4. `LineItem` ישמור את ה-ShapedRuns המקוריים ואת מיפוי source fragments.
5. `LineModel` ישמור אותם לפי סדר זרימה ויקבע את מיקומי ה-runs/glyphs
   אחרי allocation של glue/justify. אין לשנות advances פנימיים של glyphs
   בגלל justify; יש להוסיף inter-word allocation בין runs/words.
6. כאשר שורה נשברת בתוך paragraph context שמשפיע על shaping, יש לבצע
   reshape רק ל-context window הנדרש ולשמר source ranges; אין לחתוך glyph
   sequence שרירותית לפי סכום advance.
7. Materialization יקרין את ה-LineModel כפי שהוא. אין `measureTextWidth`
   ב-production materializer.

## 7. DOM/HTML: לא לבצע shaping מחדש

ה-DOM הקיים מציב מילה במיקום מוחלט אך מקצה `span.textContent`; הדפדפן
מעצב מחדש את הטקסט. לאחר ShapedRun, הטקסט הגולמי אינו יכול להיות מקור
הדיו של המילה.

נדרשת הקרנה לפי GID/positions:
- אפשרות outline paths מ-HarfBuzz, עם cache keyed לפי `fontId/gid/axes`;
  יש לבחון נפח, reuse ו-memory לפני שכפול paths לכל PageModel.
- אפשרות glyph atlas או renderer מבוסס fonts/paths שמסוגל לצייר GID ישיר.
  בחירה פתוחה; אין להניח ש-SVG path מכסה color fonts או כל variation.
- semantic text נפרד חייב להישאר ל-accessibility, selection, copy/paste,
  search ו-screen readers. אין להפוך טקסט ל-SVG בלבד בלי שכבת טקסט נגישה.
- HTML standalone צריך לכלול את אותם glyph assets/IDs ואת אותו coordinate
  model; אין להסתמך על FontFace shaping מקומי.

## 8. PDF: subset לפי GID ו-preserve clusters

### המצב הקיים
- `font-subset.js` מתחיל מ-Unicode chars, עושה cmap→GID, יוצר
  `glyf/loca` ו-cmap חדש; הוא אינו מקבל ישירות inventory של shaped GIDs.
- `pdf-writer.js::cidHex` ממפה תווים ל-CID דרך `cidOf(ch)` אחרי
  `visualOrderRtl`.
- `buildToUnicode` מניח GID/CID→Unicode scalar יחיד.
- writer בונה `CIDFontType2` ו-`FontFile2`; אין הוכחה ל-CFF
  CIDFontType0/FontFile3 embedding או CFF subsetting.
- offsets/advances של HarfBuzz אינם נכנסים ל-writer.

### חוזה נדרש
- inventory של GIDs שנצרכו ב-ShapedRuns, כולל closure של composite glyphs
  ורישום mapping `sourceGid → subsetGid → CID`.
- widths/metrics ותנועת glyphs נגזרים מאותו shaped result; אין cmap remap
  לפי תווים בשלב הכתיבה.
- bidi סדרוּת נלקחת מהמודל, לא מ-`visualOrderRtl` נוסף ב-PDF.
- ToUnicode חייב לתמוך במיפוי cluster שלם לטקסט מקור (UTF-16BE string),
  ובמקרים מורכבים `ActualText`/marked content כדי למנוע אובדן או שכפול
  טקסט בחילוץ. יש לבדוק pdftotext ו-reader בפועל.
- להחליט ולבדוק מסלול embedding לכל outline format (glyf/TrueType ו-CFF);
  אין לעקוף CFF embedding על ידי המרה אוטומטית שלא עברה את שערי הגאומטריה.
- glyph offsets יומרו לאופרציות מיקום PDF מדויקות; אין להסתמך על
  browser/PDF text layout או על סדר Unicode.

## 9. Bidi ו-script itemization — פער נפרד מ-HarfBuzz

ה-PoC הנוכחי מעביר `direction=RTL`, `script=Hebr`, `language=he`
למחרוזות עבריות שכל אחת מהן היא run יחיד. הוא אינו מבצע paragraph bidi
itemization.

במימוש הקיים:
- DOM מגדיר `dir=rtl` ומוסר מחרוזת לדפדפן, שבוחר את סדר הריצות בעצמו.
- PDF משתמש ב-`visualOrderRtl` המבוסס על regex בסיסי לאותיות לטיניות/ספרות
  וכללי glue/mirroring מקומיים. זה אינו מקור bidi משותף.
- HarfBuzz מעצב run שכבר סווג; הוא אינו מחליף את bidi paragraph algorithm.

לפני production shaping נדרש מקור סמכות יחיד ל-UAX #9 itemization, עם
logical→visual run mapping ומיפוי חזרה לטווחי מקור. יש לבדוק עברית+לטינית+
ספרות, סוגריים, סימני פיסוק, nested isolates/embeddings, neutrals ו-mark
attachment. אין לנסות לפתור bidi על ידי היפוך מחרוזת או על ידי `visualOrderRtl`
נוסף בתוך ה-shaper.

## 10. סדר ביצוע ושערי קבלה

1. **Contract tests בלבד:** UTF-16/cluster mapping (כולל RTL descending clusters,
   ligature ומספר glyphs לכל cluster), extents/pen positions, units ו-axes.
2. **Font source pipeline:** WOFF2→SFNT דטרמיניסטי לקטלוג; manifest של מקור/
   normalized hash/tool/face/axes/coverage; בדיקת TTC, variable, symbol,
   partial Hebrew ו-CFF; אין production activation.
3. **Runtime bootstrap:** HarfBuzz/WASM readiness barrier משותף Worker+Inline;
   test של respawn, ordering, failed init ו-no silent fallback.
4. **Paragraph itemization:** bidi/script/language/font segmentation;
   fallback לפי grapheme; מיפוי source ranges.
5. **Measure/Line integration:** `measureItem` כנקודת מדידה אחת; shaped
   runs ב-LineItem/LineModel; break only at safe opportunities; reshape after
   line break when context requires.
6. **PageModel preservation:** shape data + final positions + ink bounds
   עוברים את materialize/placeLine/hash/transport ללא אובדן.
7. **DOM/HTML projection:** same glyphs and positions; semantic text layer;
   no browser shaping affecting visible ink.
8. **PDF projection:** GID subset/embedding/cluster ToUnicode/ActualText;
   no per-character cmap reshaping.
9. **End-to-end parity:** fixture corpus זהה ב-DOM/HTML/PDF; השוואת positions,
   glyph IDs, ink bounds ו-rasterized ink; extraction/selection/accessibility.
10. **Only then F7:** לאחר יציבות גופנים+shaping, לחזור ל-fragment-flow
    contract ולתקן את הפער הכללי ללא חריגי מיקום.

### Fixtures מחייבים לפני חיבור
- עברית מנוקדת: אות בסיס + כמה marks (niqqud, dagesh, shin/sin dot,
  cantillation/tropes), כולל mark stacking.
- ligatures ו-GSUB/GPOS context; אותיות סופיות.
- עברית+Latin+ספרות+סימני פיסוק/סוגריים באותו paragraph עם bidi isolates.
- surrogate pairs / emoji ו-cluster boundaries.
- fallback: font ראשי חסר mark יחיד; fallback שמכיל את כל grapheme;
  fallback שאף אחד אינו מכסה — diagnostic.
- variable axes: default/min/max ובחירת ציר מפורשת; cache key נבדק.
- WOFF2/TTF/OTF-CFF, symbol fonts, partial Hebrew, glyph 0.
- paragraph/line split, justify, beginning/end of run and line; PDF extraction
  של ligature/mark cluster, DOM copy/paste, HTML standalone.
- Node, classic Worker, InlineTransport ו-browser rasterization determinism.

## 11. מצב והחלטות פתוחות

- HarfBuzzJS 1.6.4 נשאר מועמד ה-runtime; PoC הוכיח classic Worker + Node,
  WASM, UTF-16 cluster אחד, extents ו-CFF outlines לשלושה WOFF2 originals
  לאחר normalizing SFNT.
- לא הוכח עדיין async initialization barrier מול `WorkerEngineClient`,
  `inline-transport` וה-API הסינכרוני של `typeset()`.
- לא הוכח עדיין paragraph bidi itemization/fallback-by-grapheme.
- לא נבחר מנגנון DOM/HTML שמצייר GID בלי shaping מחדש.
- לא נבחר מנגנון PDF CFF embedding או GID-based subsetting.
- לא בוצעה שום אינטגרציה ב-production. `TYP-SHAPING-01` נשאר פתוח.
- `FNT-CFF-GEO-01` / `FNT-CFF-APPROVAL-01` נשארים פתוחים; אין mass
  conversion approval. F7 נשאר ממתין לייצוב גופנים ו-shaping.


## 12. PoC v10 — semantics של glyphExtents וגבולות הדיו (24.11.2026)

### ריצה ו-Artifact
- Commit: `a7db7e8b28e343bbf71bf6dd9eabf0f835e7a2ee`.
- Run: `45467805796`; Artifact: `14955353770`; conclusion: success.
- HarfBuzzJS 1.6.4 / HarfBuzz core 15.0.0.
- השוואה מול fontTools בשני מדדים נפרדים לכל אחד מ-852 GIDs בשלושה
  קובצי CFF מקוריים (Ambivalenti 444, Mixtape Bold 204, Mixtape Regular 204).

### תוצאות מדויקות

| מדד | תוצאה |
|---|---:|
| HB glyphExtents מול fontTools ControlBoundsPen | 852/852 התאמות |
| control-bound mismatches | 0 |
| סטיית control bounds מרבית | 0 font units |
| HB glyphExtents מול fontTools BoundsPen (true curve bounds) | 433/852 התאמות |
| true curve bound disagreements | 419 |
| פער curve bounds מרבי | 56.1117434352 font units |
| glyphs ריקים עם אפס-area agreement | 3 |
| HB extents חסרים | 0 |

פירוט לפי גופן:
- Ambivalenti: control 444/444; true curve 430 התאמות ו-14 הבדלים;
  max true-curve delta 56.1117434352.
- Mixtape Bold: control 204/204; true curve 2 התאמות ו-202 הבדלים;
  max true-curve delta 27.1715025721.
- Mixtape Regular: control 204/204; true curve 1 התאמה ו-203 הבדלים;
  max true-curve delta 27.6752283218.

### מסקנה הנדסית — תיקון לחוזה ShapedGlyph הקודם
HarfBuzzJS `glyphExtents` תואם בדיוק ל-control-point bounding box
(`ControlBoundsPen`), לא ל-tight curve bounding box (`BoundsPen`).
לכן אין לקרוא לערך זה `inkBounds` ואין להשתמש בו כאילו הוא גבול הדיו
המדויק. הוא יכול לשמש `controlBounds` שמרני בלבד.

בחוזה ShapedRun/ShapedGlyph יש להפריד:
- `controlBounds`: תיבת נקודות הבקרה שמספקת HarfBuzz, עם provenance ברור.
- `inkBounds`: גבול עקומה הדוק שייגזר מנתיב ה-outline באמצעות חישוב
  extrema אנליטי של quadratic/cubic Bézier segments, כולל endpoints,
  נגזרות, contours ו-transform/position של הגליף.
- אם outline format/renderer אינו מספק נתיב שממנו אפשר לחשב bounds מדויקים,
  `inkBounds` יסומן unavailable/diagnostic; אין להחליף אותו בשקט ב-control box.

לפני שילוב production נדרש pure-JS deterministic path-bounds test ולהשוות
מול fontTools BoundsPen לכל 852 GIDs, כולל empty outlines, quadratic/cubic
curves, contours סגורים ו-extrema פנימיים. ה-PoC הנוכחי עדיין אינו מוכיח
pen accumulation, signs ב-RTL, transformed run-level bounds או ink parity
בין DOM/HTML/PDF.

### חוזה source ranges — אימות נוסף
- 75/75 מחרוזות RTL עם סדר clusters מונוטוני לא-עולה.
- 617/617 glyphs עם absolute UTF-16 sourceRange תקין.
- 345 clusters ייחודיים; 220 קבוצות multi-glyph cluster; 272 glyphs
  החוזרים על cluster של glyph אחר.
- אפס source-range errors, אפס surrogate-pair splits ואפס source-coverage gaps.
- `A😀B`: clusters [0,1,3], source ranges [37,38), [38,40), [40,41).

### גבול המסקנה
הבדיקה מאשרת את semantics של `glyphExtents` בשלושת CFF fixtures ובגרסת
HarfBuzz שנבדקה. אין להסיק ממנה שכל outline format או כל variation mode
מחזירים אותן תכונות, ואין לראות בה מימוש של ink-bounds engine. ה-production
engine לא שונה; `TYP-SHAPING-01` נשאר פתוח.
