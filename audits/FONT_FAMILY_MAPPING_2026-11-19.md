# FONT_FAMILY_MAPPING — הצעת שיוך משפחות, פנים ו-aliases
> 2026-11-19 · ענף `audit/font-catalog-forensics-2026-11-19` · שלב 1 — הצעה בלבד; לא שונתה שום מפה בזמן-ריצה.
> נתונים מלאים: `font_family_mapping.json` (2,205 מיפויי legacy), `font_family_mapping.csv`, וטבלאות הנספחים: `imud_runtime_mapping_table.md` (451 רשומות הקטלוג הראשי) ו-`ext_families_summary.md` (773 משפחות הקטלוג המורחב).

## 1. שיטת ההכרעה (לפי סדר הראיות הנדרש)

1. **name IDs 16/17** (Typographic Family/Subfamily) — כשקיימים ותקינים. מיעוט קטן בלבד מהקובצים נושא אותם; נבדקו לכל קובץ.
2. **name IDs 1/2** (Family/Subfamily) — המקור העיקרי. בגופנים "מוגנים" (114 קבצים) טבלת השם מקולקלת/ריקה/זויפה ⇒ ירידה ל-3–4.
3. **OS/2 + head + post** — usWeightClass, usWidthClass, fsSelection/macStyle, italicAngle. **נמצאו סתירות מוכחות** (Alpha-Black=400; משקלי זבל 226/60/540 אצל Fontbit; תת-משפחה שקרית) ⇒ האלגוריתם אוסף "דעות" (קובץ/תת-משפחה/שם-משפחה/OS/2), וכשהן חלוקות — **שם הקובץ גובר** (ראיה פיזית לזהות ה-Face) עם סימון `weight-opinions-disagree`.
4. **צירי variable** — נרשמים כחלק מה-Face (אין בחירת ציר במנוע כיום).
5. **התאמת outlines/cmap/metrics** — digest לכל טבלה מ-sfnt המנופח (משמש את בדיקת ההתנגשויות ואת ביקורת הכפילויות).
6. **שמות קבצים** — ראיה מסייעת מובנית; בגופנים המוגנים — הראיה הראשית.

כללי ההכרעה הסופיים לכל רשומה (מוטמעים בסקריפט `font_family_map.py` שבנכסי הביקורת):
- משקל: דעות תואמות ⇒ הן המשקל; דעות חלוקות (פער ≥100) ⇒ שם-הקובץ; ערכי OS/2 לא-תקניים (1–9, לא-כפולות-100) ⇒ לא אמין.
- וריאציות עיצוב (Shadow/Outline/Hollow/Dots/Wireframe/Grunge/Pixel…) ⇒ **משפחה נפרדת** — לא מוזגות למשפחת טקסט (עומד בכלל 5 במטלה).
- רוחב (Condensed/Semi/Extra/Tzar/Wide) ⇒ Face נפרד (`width`) כשהדבר נתמך בנתונים; המקרה המיוחד של Noto-Serif-Hebrew מתועד בביקורת הכפילויות (הקבצים זהים — הצעת ה-Face הצר מסומנת כ-alias על אותו נכס עד לתמיכת-ציר).
- נטוי: italicAngle ≠ 0 / fsSelection bit0 / macStyle bit1 / תחשישי שם (italic/natui).

## 2. מספרי-ראש

| מדד | ערך |
|---|---|
| legacy names ממופים | **2,205** (451 imud + 1,315 ext + 439 priority-source) |
| שמות runtime ייחודיים | 1,721 |
| משפחות מוצעות (familyId) | **922** |
| משפחות רבות-פנים | 214 (עד 36 פנים: Noto Sans Hebrew) |
| התנגשויות (אותם familyId+faceId, **קווי-מתאר שונים**) | **45** — רשימה בסעיף 4 |
| זוגות "אותו Face, בילד שונה" | 18 |
| ביטחון: high / medium / orphan(pri) | 1,641 / 125 / 439 |

הטבלה המלאה של 451 רשומות הקטלוג הראשי: **`imud_runtime_mapping_table.md`** (נספח). סיכום 773 משפחות הקטלוג המורחב: **`ext_families_summary.md`**.

## 3. דוגמאות מייצגות (מאומתות בנתונים)

| legacyName(s) | file | familyId מוצע | faceId | confidence | הערות |
|---|---|---|---|---|---|
| `Guttman Rashi` / `גוטמן רש"י רגיל` | Guttman-Rashi-Normal.ttf | `guttman-rashi` | 400-normal-normal | high | גוף הספר (D-107) |
| `גוטמן רש"י מודגש` | Guttman-Rashi-Bold.ttf | `guttman-rashi` | 700-normal-normal | high | Face אמיתי |
| `AlphaBlack` / `אלפא שחור` | Alpha-Black.ttf | `alpha` | **900**-normal-normal | medium→מתוקן | OS/2 הצהיר 400 — נוכח השם "Black"; סומן `os2-weight-contradicts-name` |
| `אלפא רגיל` / `Alpha` | Alpha-Regular.ttf | `alpha` | 400-normal-normal | high | |
| `אלפא קל` / `AlphaLight` | Alpha-Light.ttf | `alpha` | 300-normal-normal | medium | |
| `Lia Sgula` + `ליה סגולה רגיל` | Sgula-Regular.ttf/.woff2 | `lia-sgula` | 400-normal-normal | high | שני נכסים (TTF+WOFF2) — אותו Face מוכח |
| `Frank Ruhl Libre` | FrankRuhlLibre-VF.ttf | `frank-ruhl-libre` | 400 + **ציר wght** | high | VF |
| `פרנק רוהל ליברה רגיל` | FrankRuhlLibre-Regular.ttf | `frank-ruhl-libre` | 400 | high | נכס סטטי v5.000 — גרסה ישנה מה-VF |
| `פרנק רוהל ליברה מודגש` | Frank-Ruhl-Libre-Bold.ttf | `frank-ruhl-libre` | 700 | high | |
| `דוד ליברה מודגש` | David-Libre-Bold.ttf | `david-libre` | 700 | high | **Monotype David Hadash** |
| (ללא רשומת קטלוג) | DavidLibre-Bold.ttf | `david-libre` | 700 | high | **עיצוב שונה (2016)** — התנגשות עם הקודם ⇒ ראה סעיף 4 |
| `פרנק רה רגיל/מודגש/בינוני (+נטויים)` | Frank-Re-*.ttf | `frank-re` | 400/700/500 (+italic) | high | 101 קבצי CFF/OTTO — מדידה בלבד |
| `אביר שחור` | Abir-Black.woff2 | `abir` | 900 | medium | name-table מרוקן — משקל משם הקובץ |
| `נוטו סריף עברית מודגש` | Noto-Serif-Hebrew-Bold.ttf | `noto-serif-hebrew` | 700 + ציר wdth | high | |
| `רמז דוד מודגש` | Rmz-David-Bold.ttf | `rmzdavid` | 700 | high | **גופן-סמלים — הצעה: סיווג category=symbol** |
| `האדסה שמן` וכדומה (Fontbit) | Bagsucake-2-*.woff2 | `fb-bagsu-cake` | 200…1000 | high (לאחר תיקון דעות) | nameID 99–102 הלא-תקניים סייעו |

**ברירות המחדל של D-107 במיפוי המוצע** (אומת מול `default_settings.json` + `legacy-settings-map.js`):

| שימוש | legacy stack במקור | familyId ⇒ faceId |
|---|---|---|
| גוף הספר | `'Guttman Rashi', 'Frank Ruhl Libre', serif` | `guttman-rashi` ⇒ 400 |
| H0 | `'AlphaBlack', 'David Libre', serif` | `alpha` ⇒ 900 |
| H1 | `'Lia Sgula', 'Bellefair', serif` | `lia-sgula` ⇒ 400 (40pt+…) |
| H2 | `'AlphaBlack', …` | `alpha` ⇒ 900 |
| H3/H4 | `'Alpha', …` | `alpha` ⇒ 400 |
| H5 | `'AlphaLight', …` | `alpha` ⇒ 300 |
| H6 | `'Noto Serif Hebrew', serif` | `noto-serif-hebrew` ⇒ 400 (VF) |
| H7 | `'Hadassah Friedlaender', …` | `hadassah-friedlaender` ⇒ 400 |
| גוף H0 | `'Frank Ruhl Libre', serif` | `frank-ruhl-libre` ⇒ 400 (VF) |
| מילה ראשונה | `'FrankReal', 'Frank Ruhl Libre', serif` | `frankreal` ⇒ 700 |
| גיליון (page-num) | `ליבורנה מודגש` (Livorna-Bold) | `livorna` ⇒ 700 |

כל ערכי הגודל/המשקל של D-107 לא שונו ולא ישונו במסגרת משימה זו.

## 4. התנגשויות גלויות — 45 (דורשות הכרעה/סיווג; לא נפתרו בשרירות)

מקרי-מפתח (הרשימה המלאה ב-`font_family_mapping.json` → `conflicts_sameFamilyFace_differentContent`):
1. **`david-libre/700`** — שני עיצובים שונים (Monotype מול 2016) ⇒ **הפרדה לשתי משפחות** ומיפוי-מחדש של `דוד ליברה מודגש` + הכינוי `DavidLibre-Bold` שבקוד. **הכרעת משתמש נדרשת.**
2. `rmzdavid`, `rmzfrank`, `frankruhlmf`, `kedem-serif-ml-aaa/200-italic`, `mehir*` (×5), `bloomfild-pro`, `booster`, `bagsu-cake`, `batkol`, `mia`, `munchies`, `einstein-hebeng`, `nirmala-ui/text`, `astrobol`, `baba`, `omes`, `it-nishnushim`, `animator`, `asli`, `balata`, `conditor`, `coherenti-pro`, `almoni/ultra-black`, `assistant/extra-light` — זוגות/קבוצות בעלי hmtx שונה או סדרות-גרסה (1 מול 2, ‑5 מול ‑4). הכרעה מוצעת: קנוני לפי digest; השאר aliases/נכסים ישנים מסומנים — עד אישור.
3. משפחות ראווה (`baba`, `krisper`, `babadots` וכו') — וריאציות עיצוב; ההצעה כבר מפרידה אותן; שנותרו ברשימה נובעות מתחשישי-שם לא-סטנדרטי (`Dots2` וכד') — יסווגו ידנית בקטלוג הקנוני.

כל התנגשות נוספה עם הראיות (digest, מטא-נתונים, שמות) — ואין בחירה שרירותית אוטומטית (עומד בדרישת "התנגשות גלויה").

## 5. Aliases — תחולה ושימור

- **8 קבצים דו-שמיים** (עברית+אנגלית): ממופים לאותו familyId+faceId עם שני aliases (עומד על הכפל-המכוון של S4.26/S6.3 לתאימות CSS מקורית).
- **19 שמות imud כפולים** + **26 שמות ext כפולים** (אותו legacyName ⇒ שני קבצים): בקטלוג הקנוני ה-legacyName ייפתר ל-Face אחד (קנוני); הקובץ השני יישאר נכס/alias מתועד עם סימון ההבדל (בילד/גרסה/עיצוב-שונה) — לפי ביקורת הכפילויות.
- **439 שמות הקטלוג המקור** (`fonts-priority.json`) ממופים ל-TTF המוסב — תאימות לאחור למלאי ההיסטורי.
- `DavidLibre-Bold.ttf` (היתום) — יירשם כ-alias `DavidLibre-Bold` שבשימוש הקוד (loadHeadingFont) עם הפנייה מפורשת.

## 6. מה מחסר בנתוני המקור להשלמת ההכרעה (רשימת פערים)

- ל-114 הגופנים ה"מוגנים" אין טבלת שם אמינה — ההצעה נשענת על שמות קבצים (medium confidence). אימות עיצוב-עין (sample rendering) מומלץ ל-125 הרשומות שנותרו ב-medium.
- ל-45 ההתנגשויות — הכרעה סופית חלקית בלבד (ראה סעיף 4).
- סיווג קטגוריה (text/symbol/display/rashi…) — מוצע בסכמה; המלאי מספק ראיות (0 תווי-טקסט ⇒ symbol) אך טרם הוכרע לכל משפחה.
