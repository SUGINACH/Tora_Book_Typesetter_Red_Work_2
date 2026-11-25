# FONT_CATALOG_PROPOSAL — schema קנוני מוצע, תוכנית migration ותוכנית עבודה
> 2026-11-19 · ענף `audit/font-catalog-forensics-2026-11-19` · שלב 1 — **הצעה לאישור בלבד; לא שונה קוד או מניפסט.**

## 0. עקרונות מנחים (מגובה בממצאי החקירה)

1. הגופן הוא חלק מהמנוע המתמטי: הקטלוג הקנוני חייב להיות **מקור אמת אחד** של זהות (familyId/faceId) שממנו נגזרים מדידה, תצוגה ו-PDF.
2. מה שכבר טוב וקיים — **נשמר ומורחב, לא מוחלף**: `font-resolver.js` (זהות content-addressed + alias-conflict גלוי) הוא הבסיס הכשר ל-resolver היחיד; `MeasureAPI.forFontId` כבר קושר מדידה לזהות גופן; ה-alias-conflict הקיים עומד בדרישת "אין דריסה שקטה".
3. מה שחסר: מבנה Family/Face, רישום-נכסים לפי Face, descriptors ל-FontFace, החלטת פורמט עבור WOFF2/CFF/VF, בדיקת fsType, ו-aliases רשמיים במקום "ראשון-זוכה".

## 1. הסכמה (schema) מוצעת — `assets/imud/fonts-catalog.json` (שם עבודה)

```jsonc
{
  "schema": "font-catalog/1",
  "generatedBy": "tools/build_font_catalog.py (fontTools 4.62.1; pinned)",   // reproducible
  "families": [
    {
      "familyId": "alpha",                       // יציב, ייחודי, ascii
      "displayName": { "he": "אלפא", "en": "Alpha" },
      "category": "text",                        // text | display | symbol | rashi-note | latin-system
      "designNote": "FontBit 2001",              // מקור/עיצוב
      "defaultFaceId": "400-normal-normal",
      "aliases": ["Alpha", "אלפא רגיל", "AlphaBlack", "אלפא שחור", "AlphaLight", "אלפא קל", "AhavaBold", "…" ],
      // aliases: מיפוי legacy מפורש — כל שם ישן ⇒ familyId+faceId (לא ראשון-זוכה)
      "faces": [
        {
          "faceId": "900-normal-normal",
          "familyId": "alpha",
          "weight": 900, "style": "normal", "stretch": "normal",
          "syntheticOf": null,                    // אם ה-Face מסונתז מציר VF — יסומן
          "variableAxes": [],                     // ל-VF: [{tag:"wght", min:100, max:900, default:400}]
          "assets": [
            { "path": "fonts/Alpha-Black.ttf", "format": "ttf", "sha256": "<full>",
              "outline": "glyf", "bytes": 2732*…, "source": "imud-priority-converted (EXT-14)" }
          ],
          "metadata": { "unitsPerEm": 2048, "numGlyphs": 208, "ascenderEm": …, "descenderEm": …,
                        "capHeightEm": …, "hasKern": false,
                        "nameTableFamily": "Alpha", "nameTableSubfamily": "Black",
                        "os2WeightDeclared": 400,            // לתיעוד הסתירה בלבד
                        "weightResolution": "filename-token (os2 contradicts name)" },
          "capabilities": { "browser": true, "workerMeasure": true, "pdfEmbed": true,
                            "htmlEmbed": true, "licenseEmbed": "restricted-no-embedding" },
          "coverage": { "hebLetters": 27, "nikud": 16, "taamim": 0, "hebPunct": 5, "corpus": 44 },
          "provenance": { "origin": "IMUD_TORANI/fonts-priority (converted woff2→ttf)",
                          "copyright": "FontBit 2001", "licenseName": null, "licenseSource": "name-table" }
        }
      ]
    }
  ],
  "conflicts": [
    { "key": "david-libre/700",
      "files": ["David-Libre-Bold.ttf", "DavidLibre-Bold.ttf"],
      "status": "unresolved-requires-user-decision",       // אין בחירה שרירותית
      "evidence": { "sha256": [...], "copyrights": ["Monotype 2014", "meirsadan 2016"], "glyphs": [837, 851] } }
  ]
}
```

כללי הסכמה:
- **זהות**: faceId = `{weight}-{style}-{stretch}` (מספרי; VF מוסיף `axes`). familyId נגזר מ-name16/1 (slug) ותו-לאו.
- **Aliases**: מיפוי מלא legacy→(familyId,faceId) מה-`legacyMap` שהופק (2,205 רשומות; 1,721 ייחודיות runtime + 439 priority). כל שם ישן נשמר וממשיך להיפתר; שם שאינו חד-משמעי ⇒ רשומה ב-`conflicts` עם `status: ambiguous` — **לא בחירה שקטה**.
- **נכסים**: לכל Face רשימת assets; WOFF2 ו-TTF של אותו Face (Sgula) — שני נכסים עם `sha256` נפרד ותפקיד (display/html לעומת measure/pdf). אין יותר "משפחה=קובץ".
- **יכולות + רישוי**: לכל Face — עמודות המטריצה + `licenseEmbed` מ-fsType. Face לא-מלא מסומן; ה-UI וה-Worker מציגים/מדווחים.
- **מקור אמת אחד**: `fonts-extended.json`+`imud-fonts.json` הופכים ל-**adapter זמני** (קריאה בלבד, עם בדיקות) שמתרגם legacy→קטלוג קנוני עד להשלמת המיגרציה; אחר כך נמחקים. **לא נשארות שתי מערכות מיפוי מתחרות.**

## 2. ה-Resolver היחיד (על בסיס `font-resolver.js`)

```
resolveFontRequest({ familyId|legacyName, weight?, style?, stretch?, axisValues? })
  1. פתרון family: legacyName ⇒ aliases ⇒ familyId (התנגשות ⇒ שגיאה גלויה באבחון).
  2. פתרון Face בתוך המשפחה:
     a. התאמה מדויקת (weight, style, stretch, axis values).
     b. אין מדויק ⇒ סולם דטרמיניסטי **מתועד** (כללי CSS-4 בגרסה מוקדמת: אותו style; משקל-קרוב מצד-מולד; לעולם לא קפיצה למשפחה אחרת בלי דיווח `font-fallback` באבחון — כבר קיים ב-resolver הנוכחי).
     c. Face סינתטי (synthetic bold/italic) ⇒ מסומן `synthetic: true` — לא מוסתר.
  3. החזרת { familyId, faceId, fontId (content-addressed), asset לפי מסלול, capabilities, diagnostics }.
```
- אין שינוי ברירות מחדל שאושרו (D-107); ה-resolver מקבל את אותן הבחירות ופותר אותן ל-Face.
- הדגשה/הטיה **בתוך פסקה** (מטלה §6.1): בקשת bold על משפחה ⇒ Face Bold של **אותה משפחה** (למשל `גוטמן רש"י` + bold ⇒ `guttman-rashi/700`), בלי מעבר ל-`גוטמן רש"י מודגש` כ"משפחה" נפרדת — וכשאין Face — סינתזה מסומנת ומדווחת.

## 3. טעינה ורישום (מיפוי השינויים המדויק)

| היום (מסלול) | הפער | היעד |
|---|---|---|
| `imud-library.loadFont` — מטמון לפי **שם משפחה** | Face אחד נדרס ע"י שם; WOFF2 מדולג | מטמון לפי **faceId+asset**; דילוג מוסר; כישלון לא נשמר כהצלחה (כבר קיים מ-S5.2) |
| `new FontFace(family, buf)` בלי descriptors | התאמת משקל CSS שקריתה | descriptors מדויקים `{weight, style}` לכל Face; VF — טווח הציר |
| Worker: `registerFont(name, bytes)` — רישום יחיד לשם | נכון ל-TTF; חסר ל-WOFF2 | רישום לפי faceId דרך ה-resolver (כמו היום) **לכל Face בנפרד** — ולא דריסה בין פנים של אותה משפחה |
| `settings-panel` — רשימה שטוחה של 1,766 אפשרויות | כל משקל="משפחה"; כפילויות תוויות | בורר לפי משפחות עם פנים מתחת; סטטוס תמיכה; חיפוש עברית+אנגלית (aliases); מיון יציב; טעינה עצלה (קיימת) |
| `app-shell.FONT_SETTING_KEYS` | טעינה לפי שם-ערך | להריץ דרך ה-resolver (stack⇒family+faces) |

## 4. מדידה ⇄ תצוגה ⇄ PDF — אותו Face

- ה-`styleRef.fontIds` של `measureItem` (§3.1-6) כבר נועד לזה: יש לוודא שה-DOM/HTML/PDF מקרינים מאותו faceId (הפערים הקיימים: WOFF2 כלא-רשום; extraFonts נופל ל-F1; bold-CSS בלבד; VF במופע-ברירת-מחדל ב-PDF בגלל השמטת fvar במצמם).
- מדידה ב-weight שונה: כשנדרש Bold אמיתי — ה-Face האמיתי נמדד; סינתזה ⇒ המדידה ממשיכה להיות של הבסיס **במפורש** (דגל) ולא נסתר.

## 5. תוכנית migration (versioned, idempotent)

- `settings_version` 3 (היום 2) + `migrate-fonts-v3(settings)`:
  - כל מפתח `-font` קיים ⇒ legacyName ⇒ aliases ⇒ familyId+faceId; שמירה בפורמט חדש **לצד** הערך הישן (עד שני מייגרציות ברצף — ואז ניקוי).
  - ריצה חוזרת ⇒ זהות (idempotent): ערך שכבר בפורמט v3 לא משתנה.
  - היעדים: default_settings/ערכות `setting_sets/` (תלמוד/פרשנות/קונטרס), תבניות, ZIP פרויקט (settings.json), localStorage (settings-persistence), DOCX-import — **הכל דרך `importImudSettings`/`restore` — נקודת המרה אחת** (כבר קיימת כפורט אחד; יש להרחיב את `resolveStack` ל-resolver החדש).
  - שמות שאינם נפתרים ⇒ הודעת migration מפורשת (רשימת שמות קצרה, לא הפרות שקטות); נתוני משתמש ישנים **לא נדרסים**.
- שלבי ביצוע (לאחר אישור בלבד):
  1. בניית הקטלוג הקנוני מהמלאי (כלי `tools/build_font_catalog.py` — פין-גרסה של fontTools; פלט מגובה ב-`sha256` לכל נכס; דטרמיניסטי — מיון קבוע) + בדיקות סכמה.
  2. Resolver + aliases (הרחבת font-resolver) — ללא שינוי ברירות מחדל.
  3. חיבור imud-library לקטלוג הקנוני (טעינה לפי Face; הסרת דילוג WOFF2 **רק בצירוף** אפיק מדידה ל-WOFF2 או המרה מבוקרת) + descriptors.
  4. UI מקובץ לפי משפחות + סטטוס תמיכה.
  5. Migration v3 + בדיקות תאימות לאחור (תבניות/localStorage/ZIP).
  6. ניקוי נכסים — **commit נפרד** (כלל 9 במטלה): מחיקות מהרשימות המאושרות בביקורת הכפילויות בלבד, בכפוף לרישוי ולבדיקות.
  7. עדכון PROVENANCE/DECISIONS/WORKLOG (מצבם הנוכחי מתועד כמתוארן בדוח המלאי).

## 6. מודולים וקבצים שיידרשו לשינוי (מיפוי מדויק מהקוד)

| קובץ | שינוי צפוי |
|---|---|
| `red-build/src/ui/imud-library.js` | קטלוג קנוני; loadFont לפי Face; הסרת דילוג WOFF2 (בליווי אפיק מדידה); descriptors |
| `red-build/src/engine/typography/font-resolver.js` | הרחבה ל-Family/Face + בחירת-משקל/סגנון/ציר + aliases מהקטלוג |
| `red-build/src/engine/typography/measure-api.js` | כריכת מדידה ל-faceId (forFontId קיים); הפחתת תלות ב-body-font |
| `red-build/src/engine/typography/font-metrics.js` | (אופציונלי) קריאת fvar למדידת מופע; פרנסר CFF כבר תקין למדידה |
| `red-build/src/engine/typography/font-subset.js` | אפיק CFF או סימון pdfEmbed:false ל-CFF |
| `red-build/src/engine/output/export-api.js` | extraFonts לפי Face רשום; הסרת נפילה שקטה ל-/F1 (דיווח מפורש); בדיקת fsType |
| `red-build/src/engine/output/pdf-writer.js` | descriptors מה-Face (StemV לפי משקל); הטמעה לפי נכס |
| `red-build/src/ui/settings-panel.js` | בורר מקובץ; סטטוס תמיכה; חיפוש דו-לשוני |
| `red-build/src/ui/app-shell.js` | FONT_SETTING_KEYS⇒resolver; הודעות אמת (הסרת הענף המת) |
| `red-build/src/ui/browser-entry.js` | getExportFont לפי Face/נכס מדידה |
| `red-build/src/engine/core/legacy-settings-map.js` | resolveStack⇒resolver (aliases) |
| `red-build/src/ui/engine-worker-main.js` | רישום לפי faceId (פרוטוקול קיים) |
| `tools/convert_imud_fonts.py` | הפיכה לכלי מבוסס-מאגר + אימות שקילות אחרי המרה (digest) |
| מסמכים | PROVENANCE (מתוארך), DECISIONS (החלטה חדשה D-xxx לקטלוג הקנוני), WORKLOG, ISSUE_REGISTRY |

## 7. אומדן סיכונים וצמצומם

| סיכון | חומרה | צמצום |
|---|---|---|
| שינוי מדידה לגופנים שכיום נמדדים בטבלה/פרופיל (WOFF2) ⇒ שינוי שבירה/עמודים **מכוון ומוסבר** | גבוהה | מדורג: הדלקה לפי בחירת משתמש + דוח-שינוי; קנוני נעול בבדיקות layoutHash |
| המרת WOFF2 גורפת ⇒ גידול ~62MB בריפו/באנדלים | בינונית | המרה עצלה לנכסים בשימוש; החלטת גודל מתועדת (כמו D-87↔S6.3) |
| דריסת התנהגות קיימת של "משפחה=משקל" בהגדרות ישנות | בינונית | migration idempotent + aliases מלא; בדיקות תבניות/localStorage |
| רישוי: 41 איסורי-הטמעה (כולל Alpha/FrankReal/Livorna מ-D-107) | **גבוהה (משפטית)** | סימון licenseEmbed; הצגת הסטטוס; הכרעת משתמש לגבי ברירות המחדל המושפעות |
| רגרסיית ביצועים (טעינת פנים רבים) | נמוכה | טעינה עצלה קיימת; מטמון לפי Face; מדדי ביצועים (PERFORMANCE_BASELINE) לפני/אחרי |
| סיכון התנגשות עם סוכנים מקבילים | נמוכה | ענף ייעודי; אין ענפי-גופן פעילים אחרים (agent-3-font-yellow קפוא מ-2026-11-10) |
