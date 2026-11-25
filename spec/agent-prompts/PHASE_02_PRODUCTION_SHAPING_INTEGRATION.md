# שלב 2 — שילוב ShapedRun אמיתי במנוע הייצור

# פרומפט לסוכן AI — שלב 2 מתוך 5
## Unicode 18, Bidi, HarfBuzz, FontResolver ו-ShapedRun במסלול הייצור

אתה אותו סוכן יחיד שהשלים את שלב 1. אין ליצור סוכני משנה או ענפים מקבילים. לפני תחילת העבודה קרא את PHASE1_RUNTIME_TRUTH, PHASE1_SOURCE_RECONCILIATION ואת מפת הדרישות; אמת מחדש HEAD ו-working tree.

### כללים מחייבים
- לעבוד רק ב-engine/legacy-parity-preview-20261119. אין שינוי main/legacy branches, אין force-push.
- P6/P7 וה-PDF ההיסטורי מחוץ לתחום.
- אין mass font conversion ללא שערי שלמות והכרעת משתמש. מסמכי העבודה האחרונים קבעו massConversionApproved=false; F7 ממתין לייצוב גופנים ו-shaping.
- אין להכניס HarfBuzz למדידה בלבד תוך השארת DOM/PDF מעצבים מחדש. כל תוצאת shaping חייבת להיות אובייקט קנוני המלווה את הטקסט עד PageModel והפלט.
- אין לפצל מילים/גרפמות לפני paragraph itemization ו-shaping; אין לאבד whitespace, ZWJ/ZWNJ, combining marks, niqqud, te'amim או source ranges.
- אין להחליף גופן/ברירת מחדל/alias ללא אישור. fallback חייב להיות explicit ו-diagnostic.
- advance geometry ו-ink bounds הם נתונים נפרדים. אין להשתמש ב-ink bounds למדידת fit.
- לכל שינוי: reproduce, root cause, focused failing test, negative control, content preservation, determinism, runtime integration, corpus audit, complexity reduction.

### מטרת השלב
להפוך את ה-POC של ICU4X/Unicode 18 + HarfBuzz לנתיב shaping אמיתי בתוך מנוע הייצור. POC/Worker parity היא הוכחת runtime בלבד. בסיום, LineBreaker יקבל widths/break opportunities המבוססים על ShapedRun, וכל שורה תשמור glyph records.

### 1. Font source ו-FontResolver
- הגדר Resolver יחיד שמחזיר family, face index, variation axes, font bytes/hash, מקור, normalized artifact אם נדרש, tables/coverage, fallback וסיבת הבחירה.
- WOFF2 אינו בהכרח input ישיר ל-HarfBuzz. אם נדרש SFNT normalization, שמור original immutable, normalized artifact deterministic ו-manifest source→target.
- הפרד glyf/loca, CFF/CFF2 ו-variable fonts; אין להניח שכל גופן דורש המרה.
- הוכח GID order, glyph count, UPEM, cmap, axes, outline geometry, composite dependencies, advances ו-side bearings מול המקור המקורי.
- בדוק CFF מול ה-WOFF2/SFNT המקורי באמצעות fontTools; אל תשווה רק לתוצר normalization.
- כל חריג מסווג בנפרד; אין להפעיל mass conversion לפני אישור.

### 2. Unicode 18, Bidi ו-paragraph itemization
- קבע paragraph base direction, bidi levels לפי UAX #9, script, language, grapheme boundaries, font/style spans ו-features לפני בניית word boxes.
- שמור logical source order בנפרד מ-visual run order.
- Bidi_Control משפיע על paragraph resolution אך אינו נשלח כ-glyph input ל-HarfBuzz; ZWJ/ZWNJ נשארים shaping input.
- runs בעלי Bidi levels שונים אינם מתאחדים רק בגלל script/direction זהים.
- inline style/font boundaries חייבים להיות חוקיים מול Extended Grapheme Clusters. אין לחתוך cluster בשקט.
- שמור absolute UTF-16 coordinates, source coverage מלאה, בלי surrogate/EGC splits ובלי source gaps/overlaps.

### 3. חוזה ShapedRun / ShapedGlyph
הגדר schema versioned, immutable ונבדק. לכל ShapedRun:
- font fingerprint/bytes hash, family/face, axes, size, UPEM.
- script, language, direction, bidi level, features, writing mode.
- source text/range ב-UTF-16, cluster level/policy.
- glyph sequence מסודר ו-mapping דו-כיווני source cluster ↔ glyphs.
- לכל glyph: GID, cluster/source range, flags, x/y advance, x/y offset, control bounds/ink bounds ו-baseline data.
- ascent/descent/line metrics שמקורם בגופן.
- diagnostics לחוסר glyph, fallback, unsupported feature/axis, normalization issue או cluster invalid.
יחידות מספריות ו-rounding יהיו מוגדרים פעם אחת בלבד.

### 4. שילוב לפני פיצול/מדידה
- נקודת החיבור לפני splitTextItem/buildContainerSequence. אל תעצב מחדש כל word בנפרד לאחר אובדן הקשר הפסקתי.
- splitTextItem רשאי לפרוס slices של shaped runs רק בגבול break חוקי ו-cluster boundary.
- MeasureAPI.measureItem יהיה צרכן של shaped cluster slices ויגזור advances, ascent/descent, break opportunities ו-ink metrics.
- אין per-character hmtx path או browser measurement כמקור סמכות שני ב-production.
- כל רווח מקור שייך בדיוק ל-slice אחד או ל-layout-space token מפורש; אין להשמיט whitespace ואז להמציא gap.
- mixed-font words, inline styles, parentheses, note markers ו-atomic items חייבים לשמור IDs ו-source maps.

### 5. Line breaking וקצות שורה
- LineBreaker צורך advances ו-cluster boundaries מאותו ShapedRun.
- לאחר בחירת גבול שורה, בצע BOT/EOT reshaping לריצות הקצה המתאימות.
- חשב מחדש advance ובדוק width constraint. אם השתנה fit, בצע reconsideration bounded/deterministic; אין overflow שקט, scale או margin patch.
- שמור final line-shaped glyph records; אין reshaping מחדש ב-renderers.
- בדוק LTR/RTL, mixed levels, Hebrew punctuation, niqqud, te'amim, ligatures, kerning, combining marks, multi-font, Unicode controls, surrogate pairs ו-long paragraphs.

### 6. בדיקות/קורפוס
- Node ו-classic Worker חייבים להפיק JSON shaping זהה byte-for-byte לאותם bytes/settings.
- הרחב POC לקורפוס fixtures של גופנים אמיתיים, בלי mass conversion.
- negative controls: source range missing, cluster split, missing glyph, wrong font fingerprint, axis mismatch, dropped whitespace, wrong bidi level, BOT/EOT mismatch.
- הרץ npm tests, shaping tests, Unicode/Bidi conformance, Full Math, Corpus ו-determinism. שמור run IDs ו-artifacts.

### תוצרים
1. schema versioned ל-ShapedRun/ShapedGlyph ו-tests.
2. FontResolver/asset manifest עם original/normalized hashes.
3. paragraph itemization ו-Bidi/script/font runs.
4. production MeasureAPI המבוסס HarfBuzz advances.
5. LineModel עם shaped glyph slices ותוצאות line-edge shaping.
6. דוחות Node↔Worker/font parity, CFF/TTF/WOFF2 coverage ו-limitations.
7. עדכון מפת הדרישות, catalog, WORKLOG ו-ISSUE_REGISTRY.

### שער קבלה
- shaping מחובר למסלול typeset אמיתי, לא רק ל-POC או ל-Worker bootstrap.
- split/measure/break מקבלים clusters חוקיים ושומרים 100% source coverage.
- אותה תוצאת ShapedRun מזינה LineBreaker ונשמרת ב-LineModel.
- BOT/EOT מתכנס דטרמיניסטית ואין overflow בלתי מוסבר.
- Node↔Worker parity על fonts אמיתיים עוברת.
- כל negative controls גורמים לכשל צפוי.
- אין שינוי mass font assets או ברירות מחדל שלא אושר.
