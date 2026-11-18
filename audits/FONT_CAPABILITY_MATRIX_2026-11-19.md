# FONT_CAPABILITY_MATRIX — יכולות Browser/Worker/PDF/HTML/עברית/Variable לכל Face
> 2026-11-19 · ענף `audit/font-catalog-forensics-2026-11-19` · שלב 1.
> נתונים מלאים: `font_capability_matrix.json` + `font_capability_matrix.csv` (לכל אחד מ-1,759 הקבצים). הוכחות בפועל: `scripts/prove_capabilities.js` (מריץ את **המודולים האמיתיים** של המנוע) + הרצת `tests/e2e/real-fonts.test.js` (14/14 עוברות, כולל ספר-אמת שלם וייצוא PDF ב-Frank Ruhl Libre).

## 1. ההוכחה הרצה (פלט `prove_capabilities.js` — המנוע עצמו, לא קריאת קוד בלבד)

```
TTF glyf static (Alpha-Regular.ttf)              parseFont: OK | buildSubset: OK(7 glyphs,2732B)
TTF glyf default-design (Guttman-Rashi-Normal)   parseFont: OK | buildSubset: OK(7 glyphs,5600B)
TTF CFF/OTTO (Daniel-Regular.ttf)                parseFont: OK | buildSubset: FAIL(no-glyf-loca)
TTF CFF/OTTO (Kedem-Serif-Regular-Italic.ttf)     parseFont: OK | buildSubset: FAIL(no-glyf-loca)
TTF variable wght (FrankRuhlLibre-VF.ttf)        parseFont: OK | buildSubset: OK(7 glyphs,7184B)
TTF symbol no-unicode (Guttman-Logo1-Regular)    parseFont: FAIL(cmap:no-unicode-subtable) | buildSubset: n/a
WOFF2 (Avukado-Regular.woff2)                    parseFont: FAIL(bad-sfnt-version:0x774f4632) | n/a
WOFF2 CFF (Afek-Regular.woff2)                   parseFont: FAIL(bad-sfnt-version:0x774f4632) | n/a
WOFF2 variable (Segoe Ui Variable-Regular.woff2) parseFont: FAIL(bad-sfnt-version:0x774f4632) | n/a
measure-api.registerFont(WOFF2): FAIL(bad-sfnt-version:0x774f4632)
```

## 2. המטריצה לפי מחלקת-גופן (1,759 קבצים)

| מחלקה | כמות | Browser (FontFace) | Worker (מדידה) | PDF (הטמעה) | HTML (הטמעה) | העברית | Variable |
|---|---|---|---|---|---|---|---|
| TTF glyf סטטי | 343 | ✓ | **✓ (מדידת hmtx/cmap/kern אמיתית)** | **✓ (buildSubset OK)** | ✓ (data-URI) | לפי cmap (רובם מכסים 27 אותיות) | — |
| TTF **CFF/OTTO** | 101 | ✓ | ✓ (parseFont מקבל OTTO; hmtx נקרא) | **✗ — `subset:no-glyf-loca`** | ✓ | ✓ | — |
| WOFF2 glyf | 1,036 | ✓ | **✗** (registerFont מדולג ב-`imud-library.js:128-136`; גם אם היה נשלח — `bad-sfnt-version`) | **✗** (`exportPdfFromModel` נכשל במפורש: `font:bad-sfnt-version:0x774f4632`) | ✓ | לפי cmap | — |
| WOFF2 CFF | 279 | ✓ | ✗ | ✗ (כפול: woff2 ו-CFF) | ✓ | לפי cmap | — |
| TTF משתנה (VF) | 4 | ✓ (מופע-ברירת-מחדל בלבד) | ✓ (מטריקות **מופע ברירת המחדל** בלבד; `fvar` לא נקרא) | ✓-חלקי: המצמם **משמיט fvar/gvar** ⇒ מופע ברירת המחדל מוטמע | ✓ | לפי cmap | **✗ לכל מסלול — אין בחירת ציר בשום מקום במנוע** |
| WOFF2 משתנה | 79 | ✓ | ✗ | ✗ | ✓ | לפי cmap | ✗ |
| גופני-סמלים ללא cmap יוניקוד | 10 (9 WOFF2 + `Guttman-Logo1-Regular.ttf`) | ✓ | ✗ (`cmap:no-unicode-subtable`; החריג ה-TTF מתועד ב-EXT-14) | ✗ | ✓ | **✗ — 0 תווי טקסט** | — |
| **רישיון איסור-הטמעה (fsType=2)** | **41** | ✓ | ✓ | **✗-משפטית** (הכותב אינו בודק fsType; הטמעה כיום מפרה סימון) | ✓-משפטית | — | — |
| Preview&Print בלבד (fsType=4) | 199 | ✓ | ✓ | מותר להדפסה בלבד (לא לעריכה) | ✓ | — | — |

הערות מבניות מאומתות בקוד:
- **Browser**: הכל עובד (FontFace של TTF/OTF/WOFF2/VF). תיאורית descriptors חסרה: `new FontFace(family, buf)` ללא `weight/style` (למעט `David Libre` 700 ב-`loadHeadingFont`) ⇒ התאמת משקל CSS נופלת לסינתזה.
- **Worker**: רישום עובר דרך `font-resolver.registerFont` (content-addressed, alias-conflict מדווח) ואז מסתנכרן ל-`measure-api` — **מסלול יחיד ותקין מבחינה ארכיטקטונית**; הפער: WOFF2 אינו נשלח אליו כלל (דילוג מפורש), ו-101 ה-CFF נרשמים אך מדידתם מלאה בעוד ה-PDF שלהם נכשל.
- **PDF**: `exportPdfFromModel` רושם את הגוף מחדש מהבתים שהועברו (`registerFont` ⇒ כשל מפורש ל-WOFF2); המצמם `font-subset.js` תומך **glyf/loca בלבד** (`no-glyf-loca` ל-CFF); גופני-משפחה נוספים (extraFonts) נבנים מהרישום בפועל — **משפחה לא-רשומה (WOFF2) ⇒ נפילה שקטה ל-/F1** בהתאם להערה ב-`export-api.js:433` ("נפילה שקטה ל-/F1 — מתועד"); FontDescriptor-ים עם StemV קבועים (80/120) ולא מהמשקל האמיתי.
- **HTML**: `exportFontCss` מטמיע @font-face data-URI לכל משפחה שנטענה — עובד לכל הפורמטים (WOFF2 בפורמט woff2; TTF ב-truetype).
- **Bold/Italic**: **אין בכלל מנגנון Face לפי בקשה**. הדגשה מיושמת כ-CSS בלבד (`dom-renderer.js:205-206,714,890,1013`; `pagemodel-dom-renderer.js:65`; `html-export.js` classes), המדידה מתעלמת מהמשקל לחלוטין (`dropword.js:11` — "bold/inline משנים רוחב מדידה? לא — אותם תאים נשמרים"), וב-PDF אין כלל טיפול במשקל למעט גופני-תפקיד קבועים (F2 FrankReal/F3 DavidLibre-Bold). **משמעות: DOM=סינתזה, מדידה=רגיל, PDF=רגיל — פער שיטתי בין שלושת המסלולים.**

## 3. הפער ההיסטורי ב-WOFF2 — מצב נוכחי מוכח

**הפער עדיין קיים ב-HEAD (a4903bb)**, בדיוק כפי שתואר בתצלום הקוד ההיסטורי: `imud-library.js:121-136` — דילוג מפורש על `engine.registerFont` עבור `\.woff2$`. לפיכך, לכל 1,315 משפחות ה-WOFF2 (קטלוג מורחב):
- **תצוגה**: אמיתית (FontFace).
- **מדידה**: נפילה שקופה לטבלה המכוילת / פרופילי-רוחב (`FONT_WIDTH_PROFILES`, רצפת 0.6em) — כלומר **מדידה ≠ תצוגה באופן שיטתי**.
- **PDF**: נכשל במפורש (`font:bad-sfnt-version`) כשה-WOFF2 הוא גופן-הגוף; נפילה שקטה ל-/F1 כשהוא גופן-כותרת/גיליון (לא רשום) — **PDF ≠ תצוגה**.
- הודעת המעטפת ב-`app-shell.js:536-538` ("אינו מוטמע בריפו") אינה מושגת לעולם (`fontStatus` מחזיר `embedded`) — מטעה ותואם את מצב טרום-S6.3.

**"מוטמע בקבצי הפרויקט" ≠ תמיכה מלאה** — ההבחנה שנדרשה במטלה: הקבצים קיימים בריפו מאז S6.3, אך מסלולי המדידה וה-PDF אינם צורכים אותם.

## 4. גודל הבעיה לפי רשומות-קטלוג

| מסלול | רשומות runtime שמסלולן תקין (1,766) |
|---|---|
| מדידה+PDF+תצוגה | **443** בלבד (25%) — קטלוג ה-TTF המומר |
| תצוגה בלבד (מדידה מקורבת; PDF כושל/נופל) | **1,315** (75%) |
| מתוך ה-443: PDF נכשל (CFF) | 101 |
| מתוך ה-443: מדידה נכשלת (סמלים) | 1 (`Guttman-Logo1`) |
| **מדידה+PDF+תצוגה תקינים בפועל** | **342** (19%) |

## 5. אפיקי הפתרון לכל סוג (לתכנון השלב הבא — אישור נדרש)

| סוג | אפיק א' — המרה ל-SFNT | אפיק ב' — הרחבת parser/Worker | אפיק ג' — הרחבת מסלול PDF | אפיק ד' — סימון "אינו נתמך" |
|---|---|---|---|---|
| WOFF2 (1,315) | המרה ל-TTF **לאחר אימות outline+cmap+metrics** (מוכח נאמן ב-Sgula; כלי ההמרה קיים ותועד; דורש הוספת 62MB בערך + החלטת גודל) | פרנסר WOFF2 ב-Worker (Brotli ב-JS — תלות חדשה; אינו עומד בדוקטרינת אפס-תלויות) | המרה בזמן-ייצוא | Face מסומן `workerMeasure:false / pdfEmbed:false` — **בלי fallback שקט**; כבררת מחדל זמנית מגובה במטריצה |
| CFF (380; 101 רשומים) | המרה ל-TTF (בעזרת fontTools) — משנה את הקבצים/מוסיפה נכסים | פרנסר CFF במדידה קיים כבר; הפער הוא ב-`font-subset` | הרחבת buildSubset ל-CFF (מורכב; נדרש כותב CFF ב-PDF) | סימון `pdfEmbed:false` ל-101 ה-CFF הרשומים |
| VF (83) | יצירת מופעים סטטיים (instancing) | הוספת הבחירת-ציר ל-`font-resolver`/`MeasureAPI` | הטמעת ציר (PDF/Type5 אינו נתמך; instancing לפני הטמעה) | סימון `variable:false` עד לתמיכה |
| fsType=2 (41) | — | — | **חסימת הטמעה + הודעה מפורשת** (כולל Alpha/FrankReal/Livorna — ברירות D-107!) | סימון `pdfEmbed:license-blocked` |

**המלצת הביקורת** (טרום-אישור, בהתאם לחוזה "אין fallback שקט"): אפיק א'+ד' — המרה מבוקרת של ה-WOFF2 שבשימוש בפועל (עצל, לפי בחירת משתמש) עם אימות-שקילות של digest-טבלאות (כמו Sgula), וסימון יכולות מפורש בקטלוג לכל Face שאינו מלא; אין לסמן WOFF2 כ"מוטמע=תמיכה מלאה".
