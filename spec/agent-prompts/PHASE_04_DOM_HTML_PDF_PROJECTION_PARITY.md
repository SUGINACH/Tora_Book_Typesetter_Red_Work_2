# שלב 4 — DOM, HTML ו-PDF מאותו PageModel

# פרומפט לסוכן AI — שלב 4 מתוך 5
## Projection יחיד ל-DOM/HTML/PDF, glyph positioning ו-parity

אתה אותו סוכן יחיד לאחר שער שלב 3. אל תתחיל אם אין PageModel immutable, LineModel עם glyph slices, ו-acceptance מלא של שלב 3. אמת HEAD וקרא את ה-artifacts; אין לסגור parity לפי snapshots ישנים.

### כללים
- DOM/HTML/PDF הם renderers טהורים של אותו PageModel; הם אינם מנועי עימוד.
- אין measure/wrap/reflow/line-break/balancing/note placement/geometry correction ב-renderer.
- אין browser shaping נוסף לטקסט שכבר קיבל GIDs ומיקומים.
- אין PDF per-character cmap layout או reverse-character RTL workaround.
- שימור text extraction/source maps הוא חובה; אין להמיר הכול לתמונה.
- אין CSS patch ייעודי ל-H3/TOC/side notes; geometry מגיע מה-PageModel.
- target limitation חייב להיות מפורש ומאובחן; אין שינוי בהחלטת המנוע לפי יעד.

### מטרת השלב
המסמך באתר, HTML עצמאי ו-PDF נוצרים מאותם placements/glyph records, עם אותה גאומטריה, סדר, טקסט, anchors, font identity ונכסים.

### 1. Render Projection API
- API משותף שמקבל immutable PageModel + target capabilities.
- raw document אינו input חלופי למסלול layout.
- כל renderer מאמת schema/version/assets/fonts/bounds/transforms/z-order/reading order.
- אסור DOM reads לצורך מדידה; אסור CSS wrapping; אסור line-break/layout decision.
- missing resource או unsupported glyph יוצרים explicit error/diagnostic.

### 2. Live DOM
- renderModelLine מצייר על בסיס GID/positions בלבד לריצות shaped.
- בחר מנגנון GID-capable proven (SVG paths, canvas/vector surface או אחר) רק אחרי בדיקת CFF/TrueType/variable/color fonts, clipping, variation axes ונגישות.
- השתמש ב-advances/offsets, baseline transforms, font scale ו-page coordinates מהמודל.
- spans יכולים לשמש semantic/accessibility אך אינם רשאים לבצע browser shaping שמזיז glyphs או reflow.
- שמור links, TOC anchors, note anchors, images, ornaments, gates, headers, selection/source overlays.

### 3. Standalone HTML
- אותו renderer ואותו PageModel כמו live DOM.
- כל assets/fonts embedded או packaged על פי manifest; offline; ללא network dependencies; ללא re-typeset.
- שומר multi-page scrolling, A4, links, images, ornaments, fonts, glyph positions ו-source accessibility.
- בדוק clean browser profile ללא localStorage/network; השווה ל-live DOM.
- אין export-specific CSS layout path או wrapping אחר.

### 4. PDF
- subset מתחיל מה-GIDs שנצרכו בפועל; סוגר composite dependencies; מייצר stable old GID→subset GID→CID map.
- כתיבת טקסט משתמשת במיקומי glyph/advances/offsets מהמודל; אין per-character cmap resolver כ-layout.
- ToUnicode מייצג many-to-one ו-one-to-many clusters; UTF-16BE היכן שמתאים ו-ActualText היכן שנדרש.
- שמור Hebrew text extraction/search, punctuation, niqqud/te'amim, links, bookmarks, images, page dimensions, clipping ו-recto/verso.
- font bytes/variation/subset חייבים להתאים לאלה של shaping. אין tofu/fallback שקט.

### 5. Cross-target parity
- אותו PageModel hash מוזרם לשלושת היעדים; אין ריצת engine שנייה ב-export.
- השווה line/word/glyph positions, font identity, glyph order, bounds, page geometry, notes, TOC refs, decorations, colors ו-source maps.
- Rasterize DOM/HTML/PDF בסביבה מקובעת; compare per-page diffs עם tolerance מוגדר מראש לאנטיאליאסינג בלבד, לא להזזת placements.
- extraction: PDF text, HTML source, links and copy/selection; detect loss/duplication.
- fixtures: short, long, very_long, RTL 2-column, mixed fonts, notes, side notes, gates, TOC, images, ornaments, variable fonts, CFF, ligatures and combining marks.
- page signature: geometry hash, glyph sequence hash, font manifest hash, source-content hash.

### 6. Browser E2E
- להריץ על Pages root בפועל, לא רק Node shim או preview subpath.
- לבדוק fonts/WASM/cache, Worker restart, repeated typeset, frozen PageModel, export buttons and error paths.
- full-page screenshots לכל עמוד; אין screenshot clipping.
- negative controls: mutate PageModel after freeze, omit glyph, wrong CID mapping, missing font, force browser reflow, drop source cluster; כל אחד חייב להיכשל בבדיקה המתאימה.

### תוצרים
- DOM/HTML/PDF projection adapters טהורים.
- GID-capable live/standalone HTML renderer.
- GID-based PDF subset writer עם ToUnicode/ActualText.
- projection parity report, raster diffs, extraction report, font/asset hashes.
- Browser E2E trace על Pages root.

### שער קבלה
- כל שלושת היעדים צורכים אותו PageModel ואותה glyph data.
- אין browser shaping/reflow/remeasure או PDF layout per-character cmap.
- geometry/order/font identity תואמים בתוך raster tolerance מוצהר.
- Hebrew extraction/search עובד ללא אובדן תוכן.
- HTML עצמאי offline, וכל נכס נטען או נכשל מפורשות.
- כל negative controls נכשלו כמצופה.
- Browser root E2E עבר על build נוכחי; אין לעבור להסרת legacy בלי זאת.
