# BUILD_PROVENANCE — Iteration 005

> שחזור ה-build שעליו מבוסס דוח v4, סגירת ה-BLOCKER (F14), ורישום ההוכחות.
> כל הכלים/הפקודות מתועדים כך שכל תוצר ניתן לשחזור מלא.

## 1. מצב המאגר בפתיחת האיטרציה (אומת 2026-11-23)

| בדיקה | תוצאה |
|---|---|
| Branch (remote, ענף העבודה) | `engine/legacy-parity-preview-20261119` @ `2c2ee1f` |
| Working tree | נקי (רק `red-build/package-lock.json` מוכל ב-ignore) |
| עצי העבודה המקומיים | נמצאו **שני קוויים** במחסן המקומי (ראו §1.1) |
| Baseline OLD | `origin/main:audits/PDF Export Page Comparison - Old Engine VS New Engine/PDF File Export - Old Engine.pdf` → md5 `7c0fe033b494b2c15c6cde2c95656356` = `work/ref-pdfs/old-engine.pdf` (699 עמ') — **אומת מחדש** |
| מקור הטקסט | `work/ref-pdfs/source-text.txt` (עותק מקומי של "Source text – the source text....txt", origin/main) |
| דוח v4 | `origin/main:audits/.../pdf-export-comparison-v4.html` (חולץ לעיון; אינו חלק מענף העבודה) |
| CI | `ci.yml` רץ על כל push לענף העבודה (npm test ×node 18/20/22 + determinism + cross-check) |
| Pages | `preview-engine-parity.yml` פורס build מלא (unified) ל-gh-pages root + `previews/engine-parity/` בכל push לענף העבודה |

### 1.1 גילוי: שני קוויים מקומיים — טופל ללא איבוד נתונים

ה-clone המקומי בסביבה זו עמד על `706b0fa` — **קו ישן** ("ענף ההצלה"/unified-stream,
13 commitים מקומיים מעל בסיס-המיזוג `eafd27d`) שקדם לעבודת ה-parity. ענף העבודה
ב-remote התקדם בינתיים ב-30..73 commitים (Iterations 001–004, G1–G5).

פעולות (הפיכות, ללא דריסה/איבוד):

1. `git fetch origin` (עדכון refs בלבד).
2. `git branch backup/local-unified-stream-706b0fa 706b0fa` — שימור מלא של הקו המקומי
   (בנוסף ל-`backup/local-parity-8d1bc96` הקיים).
3. `git checkout -b engine/i005-continue origin/engine/legacy-parity-preview-20261119` —
   עבודה מכאן והלאה מ-tip ה-remote; push ישירות לענף העבודה
   (`git push origin HEAD:engine/legacy-parity-preview-20261119`, fast-forward בלבד).
   לא בוצע reset/checkout הרסני, לא merge, לא force-push, לא מגע ב-main/rescue.

## 2. BLOCKER — שחזור ה-build של v4: **הוכח כניתן לשחזור מלא (byte-identical)**

### 2.1 הטענה שנבדקה (F14 בדוח v4)

> "המחלקות `mid-bands` ו־`rh--right/center/left` שמופיעות ביצואי ה־HTML (21/22/23-11)
> לא קיימות באף קובץ מקור או באנדל ב־repo — היצוא נוצר מ־build מקומי שטרם הועלה."

וכן בשורש F1: "פסי הביניים באמצע-עמוד נוספו בגרסת ה-build שיצרה את היצוא ואינם
במקור המחויב."

### 2.2 ממצאי הבדיקה העצמאית

1. **המחלקות קיימות במקור המחויב של ענף העבודה** — `red-build/src/engine/output/pagemodel-dom-renderer.js`:
   - שורה 155: `root.className = (PT_CLASS[page.type] || 'page') + ' pmr-page';`
   - שורה 249: `mbWrap.className = 'mid-bands';`
   - שורה 497: `` span.className = `rh rh--${s.pos}`; `` — **בניית template**, ולכן חיפוש
     מחרוזת מילולית אחר `rh--right` בקוד מחזיר "לא נמצא" גם כשהמנגנון קיים ופעיל.
   - `mid-bands` הוכנס ב-commit `78ee6e33` (iteration-001, 2026-11-21 20:42) — "פסי H3
     באמצע העמוד כמו המקור (span_1cl)" — ואושרר ב-`322806f`, `9e28218` לפניו.
   - ה-bundles המחויבים (`red-build/ui/app.bundle.js`, `engine-worker.bundle.js`) מכילים
     את אותן מחלקות (סונכרנו ב-`0bc115a`, `6c46eb3`, `e3f1097`, `5387c2d`).
2. **מדוע הדוח טעה**: `mid-bands` אכן אינו קיים בענף **main** (שם יושב הדוח) — הבודק
   כנראה חיפש ב-main/ב-checkout מיושן ולא בענף העבודה שיצר את הייצוא; `rh--right`
   אינו מופיע מילולית בשום ref מפני שהוא נבנה דינמית. **המסקנה "build מקומי שלא
   הועלה" שגויה.**
3. **ההוכחה החלוטה — שחזור byte-identical** (ראו §3): מה-HEAD המחויב `2c2ee1f`
   (עץ נקי, ללא שינויים מקומיים) הופקו מחדש HTML ו-PDF מאותו PageModel בנתיב
   האפליקציה — והם **זהים ביט-לביט** לייצוא v4 שנמצא בעבודה המקומית.

### 2.3 הכרעה

- **F14 נסגר כטעות בדיקה**: אין build מקומי שאינו מאוחסן. כל מה שיצר את ייצואי
  21/22/23-11 מצוי בענף העבודה במאגר.
- תיקוני G3/G4/G5 **כן** נבדקו על ייצוא שמקורו בקוד המחויב (הייצוא אומת כאן
  כניתן לשחזור מלא מ-`2c2ee1f`, הכולל את G1–G4; ייצוא G5 תועד בזמנו ב-hash
  `326937ae` ב-AUDIT.md של i004, והקוד מחויב ב-`c66a25d`).
- F1 עצמו (חפיפות פס-חוצה-טורים) נותר בעיה אמיתית לתיקון — אך השורש שלו הוא
  **במנגנון המחויב** (`pushH3BandRecords`/צל-טור ב-dp-planner.js), לא בקוד נסתר.

## 3. מתכון השחזור (Reproduction)

```bash
# דרישות: node ≥ 18 (נבדק על v24.22.3), ללא תלויות חיצוניות (red-build ללא deps)
git fetch origin
git checkout engine/legacy-parity-preview-20261119   # = 2c2ee1f בעת הכתיבה
git status        # חייב להיות נקי
node /home/z/my-project/scripts/i004-app-export.js
# (הסקריפט: RED_UNIFIED_IMUD=1; פונטים דרך font-resolver; ייבוא IMUD default
#  settings; Kit-40 gate themes; typeset; exportPdfFromModel + exportHtmlFromModel
#  מאותו pageModel. מקור הטקסט: work/ref-pdfs/source-text.txt)
```

### 3.1 טבלת זהויות (נקבעו פעמיים בהפרש שעות — מקור מחויב מול קובץ עבודה קיים)

| Artifact | SHA-256 | בפועל |
|---|---|---|
| `g1-export.pdf` (ייצוא v4, 700 עמ') | `c262e1cb0d07938d544cd2c5b040e7bd1366b3f028feba7ee204694f914ee98b` | זהה ביט-לביט לבנייה מחדש מ-`2c2ee1f` |
| `g1-export.html` | `22cdc04e878f18aeb676f00ad39505ca41651f19a69d1d4df98adcb3c9ab6e6d` | זהה ביט-לביט לבנייה מחדש מ-`2c2ee1f` |

פלט הריצה מחדש (2026-11-23, node v24.22.3):

```
typeset: 700 pages in 15359ms (hash 918e11cf062cdabb) [profile: dp]
pdf exported: 21079250 bytes in 1299ms
html exported: 57331157 chars in 2537ms
```

- Source commit: `2c2ee1f` (ענף `engine/legacy-parity-preview-20261119`)
- Build identifier: layoutHash `918e11cf062cdabb` (מודפס בזמן typeset)
- הגדרות המסמך: `ui/assets/imud/default_settings.json` (מיובאות דרך
  `importImudSettings` עם `contentHeightPx: 1040`, `measure-impl: font-metrics`,
  Kit-40 לשלושת תפקידי השערים)
- metadata של ה-HTML: title `i004-g1`
- ספירות מחלקות ב-HTML: `pmr-page` ×700 (מספר העמודים), `mid-bands` ×298,
  `rh--right` ×684, `rh--center` ×683, `rh--left` ×684

### 3.2 הערת שקיפות

במהלך הריצה מחדש נכתבו הקבצים בערוץ הפלט של הסקריפט (`work/iter004-export/`)
על גבי העותקים הקיימים. לפני ההרצה תועדו ה-SHA-256 של הקבצים המקוריים;
הבנייה מחדש החזירה **בדיוק אותם ערכים** — כלומר לא אבד מידע, וזה עצמו
מהווה את הוכחת השחזור. להמשך העבודה ייצורים חדשים ייכתבו לנתיבים נפרדים
(`work/iter005-export/`) כדי שכל דור ייצוא יישמר.
