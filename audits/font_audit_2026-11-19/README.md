# תיקיית ביקורת הגופנים — 2026-11-19 (שלב 1: חקירה בלבד)

ענף: `audit/font-catalog-forensics-2026-11-19` · על בסיס `main` ב-commits `a4903bb` (2026-11-18).
**לא שונו קוד, מניפסטים פעילים, קובצי גופן או הגדרות.** כל התוכן — דוחות ונתוני ביקורת חדשים בלבד.

## הדוחות (מחוץ לתיקייה זו, ב-`audits/`)

| קובץ | תוכן |
|---|---|
| `FONT_INVENTORY_2026-11-19.md` | מלאי פורנזי מלא של 1,759 הקבצים |
| `FONT_DUPLICATES_AUDIT_2026-11-19.md` | כפילויות לפי קטגוריות א–ז, כולל סיכוני הסרה |
| `FONT_FAMILY_MAPPING_2026-11-19.md` | הצעת משפחות/פנים/aliases + התנגשויות |
| `FONT_CAPABILITY_MATRIX_2026-11-19.md` | יכולות Browser/Worker/PDF/HTML/עברית/Variable + הוכחות רצות |
| `FONT_CATALOG_PROPOSAL_2026-11-19.md` | schema קנוני, migration, מודולים לשינוי, סיכונים |
| `FONT_TEST_PLAN_2026-11-19.md` | בדיקות קבלה ומדדים |

## נתוני מכונה בתיקייה זו

- `font_inventory.json` / `font_inventory.csv` — מלאי מלא לכל קובץ (sha256, מטא-נתונים, כיסוי, רישוי, זיהוי קטלוגי, יכולת פרסור).
- `font_duplicates.json` — קבוצות כפילויות מוכחות/חשודות.
- `font_family_mapping.json` / `.csv` — 2,205 מיפויי legacy ⇒ familyId/faceId עם ביטחון וראיות.
- `font_capability_matrix.json` / `.csv` — יכולות לכל קובץ.
- `imud_runtime_mapping_table.md` — הטבלה המלאה של 451 רשומות הקטלוג הראשי.
- `ext_families_summary.md` — סיכום 773 משפחות הקטלוג המורחב.

## שחזור (reproducibility)

- `scripts/font_inventory.py` — סריקה ומלאי (fontTools 4.62.1, brotli 1.2.0, Python 3.12).
- `scripts/font_duplicates.py` — ניתוח כפילויות.
- `scripts/font_family_map.py` — הפקת המיפוי וההתנגשויות.
- `scripts/prove_capabilities.js` — הוכחות רצות מול המודולים האמיתיים של המנוע (Node 24.22.3).

סדר הרצה: `font_inventory.py` ⇒ `font_duplicates.py` ⇒ `font_family_map.py` (הפלטים ב-`scripts/out/` של סביבת ההרצה; כאן מסופקים כפלטים סופיים בלבד). הסקריפטים קריאים-בלבד כלפי נכסי הגופן.
