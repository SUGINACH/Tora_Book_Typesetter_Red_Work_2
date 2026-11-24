# Iteration 007 — תוכנית ביצוע עצמאית להשלמת מנוע העימוד המאוחד

**תאריך:** 24.11.2026  
**ענף יעד:** `engine/legacy-parity-preview-20261119` בלבד  
**נקודת פתיחה מאומתת:** `f88fc7dcea8cbca29afdf70e85fcc0ab367c38e0`  
**מנהל הביצוע והביקורת:** ChatGPT — ביקורת בלתי תלויה, החלטות הנדסיות ואימות כל שלב.

---

## 0. הכרעת פתיחה

Iteration 006 קידמה את המנוע המאוחד באופן משמעותי, אך אין עדיין אישור parity ואין אישור שהמנוע עומד ביעד הארכיטקטוני הסופי.

הביצוע ב-Iteration 007 לא יהיה סבב נוסף של תיקונים נקודתיים. הוא נועד לסיים את העברת חוזי העימוד למקור סמכות אחד, ולוודא שה-DOM, ה-HTML וה-PDF הם מקרינים של אותה תוצאה סופית.

**סדר העדיפויות המחייב:**

1. אמת אחת למדידת גופנים, shaping ומיקום glyphs.
2. אמת אחת לשבירת שורות, לרוחבי מילים ולגאומטריית LineModel.
3. סגירת F7 — מרווחי פסקאות וחתיכות פסקה.
4. התאמה מלאה של PageModel, DOM, HTML ו-PDF.
5. parity מול המנוע הישן בכל חוזי העימוד, לא רק במספר העמודים.
6. פישוט, איחוד, ביצועים ולוח הגדרות שלם.

אין לשנות את המנוע הישן כדי לגרום להשוואה לעבור. המנוע הישן הוא oracle לקריאה ולהשוואה בלבד.

## 1. מצב המאגר והגבלות בטיחות

### 1.1 מצב Git שאומת

- מאגר: `SUGINACH/Tora_Book_Typesetter_Red_Work_2`.
- ענף העבודה קיים: `engine/legacy-parity-preview-20261119`.
- HEAD בעת כתיבת התוכנית: `f88fc7dcea8cbca29afdf70e85fcc0ab367c38e0`.
- `main` נמצא ב-`79b4de1781b0c8ebbf4512426b2d2aad363ee5fd`.
- הענף וה-main diverged: ענף העבודה 141 קומיטים קדימה ו-10 מאחורי main; נקודת המיזוג המשותפת היא `eafd27d5c8476789a52ebc1d89dc16fb920cbd9c`.
- עשרת הקומיטים הייחודיים ל-main שנבדקו מוסיפים חומרי השוואה וייצוא (PDF/HTML/מסמכי השוואה/טקסט מקור) תחת `audits/PDF Export Page Comparison - Old Engine VS New Engine/`; לא נמצאו בהם שינויי קוד. לכן אין צורך במיזוגם כדי לבצע Iteration 007, ואין לבצע מיזוג אוטומטי.
- דוח Iteration 006 ב-`audits/legacy-parity-iteration/iteration-006/` מכיל FIXES, ROOT_CAUSE ו-HANDOFF. ה-HEAD הוא קומיט תיעוד.
- בדיקת סטטוסים ל-HEAD החזירה רשימת סטטוסים ריקה; אין לפרש זאת כ-CI ירוק או כ-CI אדום.

### 1.2 כללי הגנה

- כל commit חדש ייכתב לענף העבודה בלבד.
- `main`, ענפי `rescue` והמנוע הישן יישארו ללא שינוי.
- אין merge, reset, force-push, מחיקה, שינוי baseline או שינוי lock ללא נימוק, diff והוכחה.
- לפני כל סדרת שינויי קוד יש לרשום branch, HEAD, working tree, remote וסטטוס CI; לאחריה לאמת מחדש.
- אין להסתמך על סביבת עבודה מקומית שלא אומתה מול ה-HEAD. אם סביבת Git/ריצה אינה זמינה, לא לדווח על בדיקות כאילו הורצו; יש להשתמש ב-CI וב-artifacts ולציין במפורש מה לא נבדק.
- אין לקדם שינוי מנוע רק מפני ש-`npm test` ירוק. נדרשים בדיקת מודל, בדיקת דפדפן, PDF/HTML, raster ו-overlay.
- אין להחליש בדיקות, להקטין גופן, לשנות רוחב טור, להוסיף margin מקומי, לכפות מספר עמודים או להכניס special case למסמך/עמוד/מילה.

## 2. ממצאים הנדסיים מאומתים שמכתיבים את הסדר

### 2.1 מדיניות F7 — מקור הפער במספר העמודים

ב-`red-build/src/engine/layout/legacy-imud-flow.js`, באזור flowSection, נמצא במנוע המורשת:

- לאחר הצבת כל חתיכת פסקה בטור מתווסף `7px` ל-`block.cursor`.
- הדבר מתבצע גם כאשר הפסקה נחתכה והחתיכה אינה סוף הפסקה.
- הקוד מתעד במפורש שהמקור הוא `p{margin-bottom:7px}`, החל גם על `p-cut`.

לעומת זאת, בנתיב המאוחד:

- `column-flow.blockGapPx` מפיק כיום פער כניסה מהגדרת `grid-block-gap-pct` (בפרופיל הנוכחי 4px לפי דוח F7).
- `dp-planner.pushLines` מטביע את הפער על השורה הראשונה של בלוק, ולא על כל מקטע/חתיכה בסוף הצבה.
- `normalizeColumnGaps` מדכא פער בראש טור.
- `findSplit` מחשב את `maxFit` עם פער ראשוני אחד בלבד.
- `planningUsedHeight` מסכם שורה ו-`gapBeforePx`.

זו אינה רק בחירה בין 4 ל-7 פיקסלים: אלה שתי סמנטיקות שונות (פער מוביל לבלוק לעומת margin תחתון של כל חתיכה שהוצבה). תיקון F7 חייב לשחזר את החוזה האמיתי, לא להחליף מספר באופן מקומי.

הנתון של כ-10 עמודים בהפרש הוא תוצאה חזויה של ניתוח F7, לא יעד קבלה. **אין לכפות 699 עמודים.** יש להסביר את כל ההפרשים באמצעות רצפי תוכן, קיטועים, גאומטריה והחלטות מתועדות.

### 2.2 גופנים — פער מדידה/תצוגה מוכח

בענף נמצאו:

- 451 רשומות ב-`red-build/ui/assets/imud/imud-fonts.json`, כולן TTF (חלק מהשמות הם aliases/כפילויות מקור).
- 1,315 רשומות ב-`red-build/ui/assets/imud/fonts-extended.json`, בפורמט WOFF2.
- `imud-library.js` טוען WOFF2 ל-FontFace בדפדפן, אך מדלג על `engine.registerFont` עבורן.
- `MeasureAPI._bindProfile` עובר בשקיפות מ-`font-metrics` ל-`table` כאשר המשפחה אינה רשומה.
- `font-metrics.parseFont` קורא SFNT ואינו מפענח WOFF2.
- `tools/convert_imud_fonts.py` הקיים תלוי בנתיבי מערכת מוחלטים וממיר רק את קטלוג העדיפות הישן; הוא אינו תהליך build שחוזר על עצמו לכל הקטלוג המורחב.

מכאן: חלק מהגופנים שניתנים לבחירה מוצגים בפועל בגופן אמיתי אך נמדדים בקירוב; בנוסף, `exportPdfFromModel` בונה תתי-גופנים מתפקידי המודל מתוך רישומי Worker, ולכן גופן שלא נרשם עלול ליפול לגופן הגוף ב-PDF.

המרת WOFF2 ל-TTF היא הכרחית לשילוב הנוכחי, אך **אינה מספיקה כשלעצמה**: צריך לוודא תמיכה ב-outlines, glyph coverage, variable axes, kerning, GPOS, סימנים משולבים ו-PDF subset. אסור להכריז על גופן כזמין למדידה/ייצוא אם רק ההמרה הצליחה.

### 2.3 פער shaping בין הדפדפן ל-PDF

- התצוגה המאוחדת משתמשת ב-FontFace ובמנוע shaping של הדפדפן.
- `pdf-writer.js` משתמש ב-`visualOrderRtl` לסידור תווים, מחלק רצפים לפי זמינות glyphs ומצייר דרך מיפוי CID.
- מסלול כזה אינו הוכחה שהוא מבצע אותן פעולות GSUB/GPOS, mark positioning, cluster shaping ו-bidi שהדפדפן מבצע.
- `MeasureAPI` כולל מדיניות נפרדת ל-`_marks-advance` בין פרופיל מורשת לפרופיל מאוחד, ראיה לכך שכבר קיימים שני חוזי מיקום לסימנים משולבים.

לכן השוואת DOM/PDF אינה יכולה להסתפק ב-`geometryHash`: יש להשוות גם את רצף ה-glyphs, ה-advances, ה-offsets, ה-baselines ואת raster הדיו.

### 2.4 מסלול הייצוא המאוחד — הבהרה לאחר אימות הקריאות

החשש מ-`typeset` שני אינו מתקיים במסלול המוצר של פרופיל `unified`:

- `preview-tab.js` קורא ל-`renderModelPage`.
- ייצוא HTML המאוחד קורא ל-`exportHtmlFromModel`.
- `engine-worker-main.js` שומר את תוצאת העימוד ואת ה-PageModel; בייצוא PDF של פרופיל שאינו legacy הוא קורא ל-`exportPdfFromModel`.
- `app-shell.js` קורא ל-`exportPdfFromModel` או `exportHtmlFromModel` כשהפרופיל המאוחד פעיל.
- `exportPdf(text,...)` נשאר בנתיב התאימות של `legacy`.

זהו בסיס ארכיטקטוני נכון שיש לשמר. יש לאמת אותו ב-E2E וב-build החי, ולמנוע מסלולי PDF/HTML חלופיים או fallback לא מתועד.

## 3. שלב 007-A — שחזור baseline וראיות parity (Checkpoint ראשון)

### פעולות

1. לשמור snapshot בלתי משתנה של HEAD, ה-locks, build-info, קובצי ההגדרות וגרסאות הכלים.
2. לאסוף את תוצאות ה-CI המלאות של ה-HEAD הנוכחי ושל כל push עתידי: כל מטריצת Node, test, determinism, cross-check, layout-audit, full-math-audit ו-artifacts.
3. לבנות manifest לקורפוסים:
   - מסמך קנוני קטן;
   - `no_long`, `mid_long`, `long`;
   - `very_long_test_text.txt`;
   - הספר האמיתי שבו המשתמש הבחין בהבדלים;
   - fixtures ממוקדים: H2 ארוכה, פסקאות 1–4 שורות, חלון מילה ראשונה, פסקה שנחתכת בטור/עמוד, הערות, כותרות צד, עיטורי פתיחה/סיום פרק, שער ו-TOC.
4. לכל קלט לשמור hash של הטקסט וההגדרות, font manifest, engine commit, layoutHash, contentHash, PageModel, PDF, HTML, raster וחתימות שורות/עמודים.
5. לשחזר את תוצאות המנוע הישן ואת המאוחד על אותם קלטים/הגדרות/גופנים. אם baseline חסר או אינו תואם לאותו קלט, לסמן זאת ולא להשתמש בו כנעילה.

### תנאי קבלה

- לכל artifact יש provenance מלא: קלט, הגדרות, גופנים, commit, גרסת build וכלי הפקה.
- אין נעילת baseline חדשה לפני שהשוואת המקור והפלט ניתנת לשחזור.
- דוח ההשוואה מציג סטיות, ולא רק ציון כולל.

## 4. שלב 007-B — גופנים: מלאי, המרה ורישום אמיתי מקצה לקצה

### B1. מלאי מדויק

ליצור manifest אחד שממזג את שני הקטלוגים וממפה לכל משפחה:

- alias/משפחה ומשקל/סגנון;
- קובץ מקור ופורמט;
- SHA-256 של מקור;
- קובץ מדידה/ייצוא וקובץ תצוגה;
- SHA-256 של התוצר;
- unitsPerEm, glyph count, Unicode cmap, כיסוי עברית/ניקוד/טעמים/פיסוק;
- סוג outline (glyf או CFF/CFF2), טבלאות OpenType, צירי variation וערכי ברירת מחדל;
- סטטוס מדידה, הצגה, HTML embed ו-PDF subset;
- רישיון ומקור, ככל שמופיעים במאגר.

כפילויות שמות/קבצים יזוהו במפורש. אין למזג משפחות רק בגלל שמות דומים.

### B2. תהליך המרה בר-שחזור

לשכתב את `tools/convert_imud_fonts.py` ככלי repository-relative:

- אין נתיבי `/home/...` קשיחים.
- מקורות נקראים מן הנכסים שבמאגר; פלט נכתב לתיקיית build מוגדרת.
- המרה של כל 1,315 רשומות WOFF2, עם deduplication לפי hash בלבד ולא לפי שם.
- כשל של קובץ אחד מחזיר exit code שאינו אפס ומופיע בדוח; אין קטלוג חלקי שמסומן הצלחה.
- אין overwrite בלתי מבוקר של קובצי מקור.
- המרה שומרת metadata ורישוי, ומדווחת על אובדן/שינוי טבלאות.
- Variable fonts ייבדקו בנפרד: יש לשמר צירים או ליצור static instances דטרמיניסטיים לכל משקל/סגנון שבאמת ניתן לבחירה. אין להסתמך על ברירת מחדל לא מתועדת.
- גופני CFF/CFF2/TTC ופורמטים שאינם נתמכים ב-`font-subset` יקבלו נתיב תמיכה אמיתי או יוגדרו unavailable עד לתמיכה. אין לשנות סיומת בלבד ואין להציגם כ-TTF תקין.

### B3. רישום ומדידה

- לכל גופן בר-בחירה תהיה זהות תוכן אחת (fontId) המקשרת את FontFace, MeasureAPI, PageModel, HTML ו-PDF.
- כל גופן שמשמש במסמך (גוף, כותרות, חלון, הערות, כותרת צד, שער, header/footer, TOC) חייב להירשם ל-Worker לפני typeset.
- יש להסיר את הנפילה השקטה לטבלת קירוב עבור גופן שמוצהר כזמין. אם גופן אינו נטען או אינו נתמך — העימוד ייעצר עם diagnostic ברור, או יוצג למשתמש fallback שנבחר במפורש ונרשם בחוזה.
- timeout בטעינת גופן אינו רשאי להמשיך בשקט למדידה שונה. יש להבדיל בין font-loading failure לבין cancel.
- PDF חייב לקבל את הרישומים לכל role ולכל family, לא רק את גופן הגוף.
- HTML עצמאי יטמיע את קובצי התצוגה המתאימים לאותה זהות גופן.

### B4. בדיקות גופנים מחייבות

לכל משפחה (או לכל קובץ ייחודי לאחר deduplication) להריץ:

1. parse/decode תקין וקריאת טבלאות;
2. בדיקת Unicode cmap וכיסוי תווים;
3. בדיקת רוחבי glyph/advance מול fontTools או oracle בלתי תלוי;
4. בדיקות קרנינג, GSUB/GPOS, ניקוד וטעמים, combining marks, bidi, מספרים, סימני פיסוק וסוגריים;
5. בדיקת subset: אין glyph חסר/קומפוזיט ללא רכיבים/ToUnicode שגוי;
6. round-trip של טקסט נבחר מ-PDF;
7. דוגמת raster של אותו טקסט בדפדפן וב-PDF;
8. בדיקת deterministic bytes ו-cache isolation.

**שער B:** אין משפחת טקסט ב-picker שאינה מדידה ומיוצאת במפורש. חריגים (לוגו סימבולי/גופן דקורטיבי ללא cmap) מסווגים כ-assets גרפיים ולא כגופני טקסט.

## 5. שלב 007-C — חוזה Typography/Shaping/LineModel יחיד

### יעד

להחליף את ההנחה ש-`measureTextWidth` על מחרוזת מספיקה בחוזה טיפוגרפי מדויק, שאותו צורכים השבירה וכל המקרינים.

### פעולות

1. לבדוק האם אפשר להטמיע HarfBuzz (WASM) או מנוע shaping אחר אחד, דטרמיניסטי, בעל רישוי מתאים ותמיכה מלאה בגופנים שבמאגר. אם לא, יש להגדיר במפורש את היקף התמיכה ואת חסרונותיו; אין להמציא parser חלקי נוסף.
2. ה-shaper יפיק לכל run:
   - fontId מדויק;
   - glyph IDs;
   - clusters ומיפוי לטווחי Unicode המקוריים;
   - advanceX/advanceY ו-offsetX/offsetY;
   - bidi level וסדר חזותי;
   - מידע על ligatures, kerning ו-mark attachment.
3. LineModel ישמור את תוצאת ה-shaping שנמדדה. שבירת השורות, window, יישור, חלוקת רווחים, baseline והקרנת הדיו יצרכו את אותה תוצאה.
4. אין ל-DOM לבצע shaping גאומטרי עצמאי של מילים ממוקמות-מוחלט. יש לצייר positioned glyph runs או להשתמש בדרך מוכחת שמבטיחה את אותו advance/offset. CSS אינו מקור החלטה.
5. PDF writer לא יהפוך מחרוזות ל-char sequence באמצעות כלל RTL מקורב. הוא יקבל glyph runs מסודרים עם מיקומי glyph/cluster מהמודל.
6. אם PDF writer אינו מסוגל לצייר glyph IDs/offsets (למשל mark-to-base) יש להרחיבו או להחליפו בשכבת ציור תואמת. אין לקזז את הפער באמצעות שינוי x של מילה.
7. Font fallback ייקבע לפני line breaking ויירשם כ-run נפרד; אסור fallback פר-מקרין.
8. קובץ מדידה/שבירה/ציור יישאר בעל אותו fontId ותצורת variation בכל התהליך.

### בדיקות קבלה

- לכל מילה ולכל run: רוחב/advance שהמנוע תכנן שווה לסכום ה-advances וה-offsets שמצוירים בפועל, בסבילות מפורשת ומנומקת.
- אין overflow או overlap שנובע מהבדל shaping.
- שורות מיושרות, חלונות, H2 ארוכות, ניקוד, טעמים, גרשיים, מספרים וערבוב עברית/לטינית נבדקים מול דפדפן ו-PDF.
- אין שימוש ב-font metrics approximation לגופנים זמינים.
- line-break hash אינו משתנה בין שתי הרצות זהות.

## 6. שלב 007-D — F7: מודל זרימה ומרווחי פסקה

### עקרון תכנון

אין ליצור שורת דיו מלאכותית או special-case ל-`h3BandTail` כדי לחקות margin. יש לייצג התקדמות זרימה שאינה דיו כחלק מחוזה כללי של מקטע/בלוק/חתיכה.

המודל צריך להבחין בין:
- גובה תוכן מצויר;
- מרווח/advance לפני ואחרי בלוק;
- סיום חתיכה שהוצבה בטור;
- קיבולת שנצרכה;
- מיקום הדיו בפועל.

כל אלה חייבים להיות מיוצגים פעם אחת ב-PagePlan/FlowModel ולשמש את כל האלגוריתמים.

### פעולות

1. לקבע במבחן את התנהגות המורשת: 7px אחרי **כל חתיכת פסקה שהוצבה**, כולל חתיכה שנקטעה, כפי שמוכח ב-`legacy-imud-flow.js`. אין להכליל לפריטים אחרים לפני אימות.
2. להגדיר מודל generic של block fragment / flow advance (non-ink) או שדה סמנטי שקול על סיום fragment. אין להוסיף fake LineModel, fake word או DOM node.
3. לעדכן מקור יחיד של חישוב vertical advance כך שיכלול את התוכן ואת ה-advance המתאים, ולחייב את:
   - `planningUsedHeight`;
   - `findSplit/maxFit`;
   - `pushLines`;
   - candidate generation;
   - escort/heading reservation;
   - balancing;
   - retreat/rollback;
   - normalization;
   - PagePlan validation;
   - PageModel;
   - DOM/HTML/PDF projection.
4. פיצול פסקה בין טורים/עמודים חייב לשמור את אותה סמנטיקה של margin-bottom בכל חתיכה, כולל חתיכה אחרונה לפני פתיחת עמוד.
5. להגדיר במפורש את האינטראקציה עם H3 spanning: אין כפל מרווח ואין דיכוי מקרי של מרווח מקור. ה-band, shadow וה-fragment advance חייבים להישאר מסונכרנים.
6. להפריד בין margin שאוכל קיבולת לבין ink geometry. ה-advance הלא-מצויר אינו יוצר div/line/PDF operator.
7. לעדכן את חוזי widow/orphan: שורה בודדת בסוף טור לא תיווצר כתופעת לוואי של margin או heading escort. יש לבדוק כל מעבר.

### מטריצת regression מחייבת

- פסקה של שורה אחת, שתי שורות, שלוש שורות וארבע שורות.
- פסקה שאינה נחתכת.
- פסקה שנחתכת באמצע טור.
- פסקה שנחתכת בין שני טורים.
- פסקה שנחתכת בסוף עמוד.
- פסקה שממשיכה בעמוד הבא.
- פסקה ראשונה בטור/עמוד (אין margin נוסף לפני התוכן).
- פסקאות עוקבות עם רווח אחד בלבד.
- פסקה לפני/אחרי כותרת מכל רמה.
- פסקה לפני/אחרי H3 spanning.
- פסקה עם הערות שוליים והזמנת מקום.
- retreat, split candidates, balancing ו-rollback.
- מסמך שהמקטע האחרון שלו קצר; אין מתיחה מלאכותית.
- בדיקות שליליות: הסרת/הכפלת ה-advance חייבת להפיל את האודיט.

### שער D

רק לאחר שהבדיקות הממוקדות והקורפוסים עוברים, לחדש baseline locks. כל שינוי במספר עמודים מוסבר באמצעות חתימת פיצולים/שורות/עמודים. 699 אינו מספר כפוי.

## 7. שלב 007-E — DOM, HTML ו-PDF: הקרנות זהות מאותו PageModel

### חוזה

`PageModel` הוא מקור הגאומטריה היחיד. מקרין אינו מודד, אינו שובר שורות, אינו משנה x/y, אינו מחלק מילים, אינו מבצע wrapping/reflow, אינו מחליט על fallback, ואינו משלים נתון חסר בשקט.

### פעולות

1. לבדוק את כל שדות המודל הדרושים לציור: page/column bounds, line boxes, glyph runs, baselines, word clusters, gaps/flow advances, ornaments, notes, side headings, furniture, gates, TOC, colors, font IDs, z-order ו-assets.
2. לוודא ש-`renderModelPage`, `exportHtmlFromModel` ו-`exportPdfFromModel` צורכים את אותם נתוני ציור ולא גוזרים גאומטריה מחדש.
3. להוסיף בדיקה מבנית שתיכשל אם המקרינים קוראים ל-`measureText`, `MeasureAPI`, `wrap`, `lineBreak`, או משנים מיקום/גודל של פריט.
4. לבטל fallback ל-`exportPdf(text)` או `exportHtml(result)` בפרופיל unified; חסר PageModel הוא שגיאה מפורשת.
5. להבטיח שה-PDF מקבל כל font role וכל asset הדרושים מהמודל/מניפסט, ולא מגופן-ברירת-מחדל בלבד.
6. להפיק overlay מדויק של DOM מול PDF raster באותו גודל עמוד ו-DPI. להשוות:
   - גבולות עמוד וטורים;
   - קווי בסיס וגובה שורות;
   - תיבות מילה ו-glyph;
   - הערות, markers ו-side headings;
   - headers/folios;
   - gates/TOC/structural pages;
   - ornaments, images, fills, strokes ו-z-order.
7. להריץ browser screenshots ו-PDF raster באותם inputs. ההשוואה לא תשתמש ב-CSS bounding boxes בלבד: יש לבדוק גם ink pixels וגאומטריית glyph.
8. ליצור דוחות diff לפי עמוד/רכיב, ולא רק תמונה כוללת. כל סטייה חייבת להיות מסווגת: model, shaping, renderer, asset או expected legacy difference.
9. ליישר את HTML העצמאי לתצוגה החיה (fonts, @font-face, page sizes, asset URLs, print styles) ולבדוק אותו בדפדפן נפרד.

### שער E

אותו PageModel ואותו glyph-run manifest בכל שלושת הנתיבים; 0 מדידות/שבירות/החלטות מיקום במקרינים; אין הפרשי גאומטריה בלתי מוסברים בין DOM, HTML ו-PDF.

## 8. שלב 007-F — השלמת legacy parity לכל חוזי העימוד

להשיב בדיקת parity ישירה מול המנוע הישן, בלי להסתמך רק על הנעילות העצמיות של המנוע החדש. ה-workflow הקיים `layout-parity.yml` מציין ש-D-100 הסיר את השוואת הייחוס והשאיר אינווריאנטים מוחלטים. הדרישה הנוכחית לפרויקט מחייבת שער נוסף, נפרד ומוגבל לענף הניסוי, שאינו משנה את main.

יש לייצר/להפעיל השוואה של שני המנועים על אותו טקסט, אותן הגדרות, אותם bytes של גופנים ואותם assets, ולשמור את שני הפלטים.

### ממדי parity

1. Content, paragraphs, tokens, word sequence.
2. Line sequence, word-to-line assignment, line breaking, justification, first/last line.
3. Column sequence, page sequence, page/column breaks, page count.
4. Windows: זכאות, מיקום, גודל, מרווח, שורות פסקה 1–4.
5. Headings H0–H7: wrapping, font/size/color, spacing, reservation, escort, orphan/widow.
6. H3 spanning: band, shadow, top/bottom padding, capacity, y/width.
7. Ornaments: type, asset, scale, anchor, gaps, reservation, start/end of chapter.
8. Side headings and notes: wrapping, width, placement, collisions, markers.
9. Footnotes: marker, numbering, font, wrapping, columns, splitting, reservation, separators.
10. Folios: display text, sequence, font, size, color, x/y/baseline.
11. Running headers/footers: text, slot, font, alignment, geometry, chapter context.
12. Gates and structural pages: main/sub/back, title/author, images/background, positions.
13. TOC: counts, levels, line breaks, dotted leaders, links, page labels.
14. Font identities, glyphs, sizes, variation axes, colors and fallback decisions.
15. RTL/bidi, brackets, punctuation, Hebrew numbers, mixed Latin/numeric runs.
16. Overflow, overlap, widow/orphan, missing ink, content loss and capacity reservations.

### מדדי השוואה

- Exact: content, word order, tokens/markers, settings mapping, element presence, sequence of logical lines (לפי חריגים מתועדים).
- Geometric: x/y/w/h/baseline/glyph extents עם tolerance מנומק לפי DPI והמרת יחידות.
- Visual: raster diff/overlay ומדדים לפי רכיב.
- Pagination: exact page/column breaks כשזהו חוזה המקור; כל סטייה אחרת נרשמת עם הסבר root cause ולא מוחלקת בציון.
- אין ציון כולל שיכול להסתיר כשל בתחום אחד באמצעות הצלחה בתחום אחר.

### פריטים מ-Iteration 006 שיש לפתוח מחדש

- שתי חפיפות H3/פס שנותרו וההשוואה לייחוס.
- שתי חפיפות עיטורים שנותרו.
- F8 footnote wrapping.
- F9 marker fonts.
- F12 structural pages.
- TOC full audit.
- F4 running header book words.
- body/page/column parity.
- F7 לאחר תיקונו.
- F1/F2/F3 residual overlaps ותחומי ornaments בכל המצבים.

## 9. שלב 007-G — פישוט ואיחוד המנוע (בלי מחיקות מסוכנות)

לנהל רישום חי של כפילויות ולסגור אחריות כפולה רק לאחר הוכחת parity.

עדיפויות לפי `audits/ENGINE_DUPLICATION_REGISTER.md`:

- D1: טבלאות font factors ופרופילי רוחב כפולים.
- D2: מדידת רוחבי מילה/פרגמנט ביותר ממקום אחד.
- D3: חלוקת רווחים/יישור בכמה מקרינים.
- D4: baseline וחישובי ascent/half-leading כפולים.
- D5: גזירת line height במספר מודולים.
- D6: usedHeight וגובה טור מחושבים מחדש.
- D7/D11: מדידת/עטיפת הערות פעמיים.
- D8/D10: גאומטריית header/folio/gate כפולה בין DOM ו-PDF.
- D9/D12: epsilons והמרות יחידות מפוזרים.
- D13: מסלולי MeasureAPI/מדידה שונים.
- שני parser/line-breaker/planner/page schemas/numbering flows נשארים עד להסרתם לאחר parity; אין למחוק אותם בתחילת העבודה.

### כלל איחוד

לכל ערך בעל משמעות גאומטרית יהיה מקור סמכות יחיד, API אחד, וצרכנים ברורים. אם נדרש adapter לתאימות, עליו להיות בשפה של המודל, זמני, עם תאריך/תנאי הסרה ובדיקה שמונעת ממנו להפוך למנוע חלופי.

## 10. שלב 007-H — לוח הגדרות מלא והוספת אלמנטים

לאחר שיציבות חוזי העימוד הוכחה:

1. לבצע מיפוי מלא של `settings-registry`, כל רכיבי UI, import/export, defaults, saved settings ו-legacy mappings.
2. לכל הגדרה: ID, תווית, תיאור, סוג, יחידות, ברירת מחדל, טווח/אופציות, scope (document/page/element), השפעה גאומטרית/חזותית, retypeset policy, serialization ו-legacy mapping.
3. להפיק בדיקת completeness אוטומטית: אין הגדרה ללא UI אם היא user-facing; אין control ללא registry; אין ID כפול; אין default סותר; כל הגדרה עוברת round-trip.
4. לתעד הגדרות שאינן ניתנות לעריכה בממשק כסיסטם-קונפיגורציה ולא להציג אותן כהגדרות משתמש.
5. להגדיר Element Contract חדש: schema, content, styleRef/fontId, measurement/shaping, layout constraints, reservation, placement, accessibility, PageModel projection, HTML/PDF projection, editing UI, serialization/import/export ו-test fixture.
6. הוספת אלמנט חדש תיעשה דרך registry/adapter תקני, ללא שינויי special-case במנוע הליבה.

## 11. שלב 007-I — ביצועים, דטרמיניזם ותחזוקה

### Benchmark

להשוות Legacy ו-Unified באותה סביבת ריצה, אותם גופנים ואותם קלטים, לאחר warm-up וגם ב-cold start:

- parsing/tokenization;
- font loading/parsing/shaping;
- line-breaking;
- pagination/planning;
- materialization/PageModel;
- Worker serialization/transfer;
- DOM render;
- HTML export;
- PDF export;
- peak memory ו-cache growth.

לשמור median, p95, זיכרון ושיעור cache hits. היעד: המנוע המאוחד אינו איטי מהמנוע הישן על אותו workload. לפני optimizations, לא לשנות אלגוריתם שמשפיע על הפלט רק כדי להוריד זמן; לבצע profiling ולתקן root cause. לשמור ביצועי full-book, לא רק fixture קטן.

### דטרמיניזם

אותו קלט+הגדרות+font manifest+assets+commit חייבים להניב:
- אותם DocumentModel/LineModel/PagePlan/PageModel hashes;
- אותן שבירות שורה/טור/עמוד;
- אותם glyph runs ומיקומים;
- אותם PDF bytes כאשר תצורת הייצוא זהה (למעט מטא-נתונים שהוגדרו במפורש כלא-דטרמיניסטיים — ואסור שיהיו כאלה בייצוא הקנוני).

## 12. שערי שחרור סופיים

אין להכריז על completion עד שכולם מתקיימים:

- כל קבוצות 007-B עד 007-I נסגרו בראיות ובקומיטים.
- full test suite + determinism + cross-check ירוקים בכל מטריצת CI.
- browser layout audit ו-full-math ink audit עברו עם coverage מלא על הקורפוס הגדול.
- PDF/HTML/DOM נבדקו מאותו PageModel ו-font manifest.
- כל העמודים/הטורים/השורות/המילים והאלמנטים נכללו ב-parity audit מול הישן.
- אין סטיות מהותיות בלתי מוסברות, נפילות גופן שקטות, materialization fallbacks או מקרינים שמבצעים החלטות.
- כל baseline/lock עודכנו רק לאחר השוואה עצמאית, עם הסבר לכל שינוי.
- רישום הכפילויות מציג מה אוחד, מה נשאר ולמה.
- benchmark מוכיח שהמנוע החדש מהיר לפחות כמו הישן.
- בדיקת הגדרות מוכיחה כיסוי מלא, import/export round-trip ויכולת הרחבה תקנית.

## 13. סדר עבודה מעשי ו-checkpoints

| Checkpoint | עבודה | תנאי מעבר |
|---|---|---|
| 007-A | baseline, provenance ו-CI | נתוני ייחוס מלאים וחוזרים |
| 007-B | כל הגופנים: manifest, conversion, registration, tests | אין גופן בר-בחירה שנמדד בקירוב/לא זמין לייצוא |
| 007-C | shaping + LineModel + line-breaking | מדידה ושבירה זהות לדיו שהמקרינים מציירים |
| 007-D | F7 generic flow fragment advances | מטריצת פיצול מלאה + ספרי אמת בלי פערי gap לא מוסברים |
| 007-E | DOM/HTML/PDF projections | אותו PageModel ואותו glyph-run; overlays תקינים |
| 007-F | legacy parity כולל F8/F9/F12/TOC/F4 | אין סטיות מהותיות לא מוסברות |
| 007-G | איחוד והסרת כפילויות | מפת אחריות יחידה ובדיקות guard |
| 007-H | הגדרות ו-Element Contract | completeness ו-round-trip מלאים |
| 007-I | ביצועים ו-release gate | מהיר לפחות כמו הישן וכל שערי האיכות ירוקים |

**אין לדלג על checkpoint ואין לבצע lock refresh באמצע שלב תלוי-גופן/שבירה.** כל שלב יסתיים ב-commit קטן ומובן, דוח קצר, artifacts ובדיקת CI. המשך לשלב הבא הוא החלטת מנהל הפרויקט לאחר ביקורת עצמאית, לא אישור אוטומטי של דיווח סוכן.

---

## 14. החלטות ביצוע מיידיות

1. אין לבצע merge מ-main; עשרת הקומיטים הייחודיים ל-main שנבדקו הם חומרי השוואה בלבד.
2. אין לבצע כעת שינוי ב-F7 לפני סגירת השפעת הגופנים וה-shaping, כדי לא לחדש locks יותר מפעם אחת.
3. אין לבצע המרה עיוורת של WOFF2 ל-TTF. תחילה manifest ויכולת parser/subsetter, ואז המרה מלאה עם gates.
4. אין להכריז שכל המקרינים כבר שווי-ערך משום שהם משתמשים באותו PageModel. יש להוכיח glyph-level parity.
5. אין לגעת במנוע הישן או ב-main.
6. לאחר השלמת 007-A וביקורת הנתונים, תחילת הקוד היא 007-B — גופנים — ולא שינוי קוסמטי או תיקון נקודתי נוסף.
