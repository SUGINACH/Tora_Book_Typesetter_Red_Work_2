# Parity Signature — חתימה מבנית/גיאומטרית ישירה legacy↔unified

**כלי:** `tools/parity/parity-signature.js` · **הוראת יסוד:** audits/NEXT_LEGACY_PARITY_EXECUTION_PROMPT_2026-11-19.md סעיף ה · **תאריך:** 19.11.2026

## מה זה משווה

השוואת תוצאת שני המנועים על אותו קלט/הגדרות/גופנים/Node — **מהמבנים הקנוניים של כל צד בלבד**, בלי adapter מסנתז:

- **צד המורשת:** `result.pages[]` — עמודות (שורות עם words/sizePt/font/y/heightPx), `gateLines` (טקסט שער), `page.toc.rows` (שורות תוכן עניינים), folioDisplay, footnotes/sideNotes/decorations.
- **צד המאוחד:** `result.pageModel` — ה־PageModel הקנוני: שורות עם x/y/w/h/sizePt/align/kind + מילים עם x/w/color + sourceTokenId, גיאומטריית טורים, folio, footnotes/sideNotes/decorations/images.
- הפעלת המאוחד: דגל in-band `_engine-force-unified` — **אותה נקודת dispatch אחת** ב־`pipeline.js` (לצד `RED_UNIFIED_IMUD`); אין הסתעפות מנגנון.
- שדות חד-צדדיים (גופן לכל שורה במורשת; x/w לכל מילה במאוחד וכו') מתועדים ב־`layerFields` — "לא קיים בשכבה", לא מאופסים ולא מושמטים בשקט.
- כימות: `COORD_Q = 0.01pt`, מוגדר פעם אחת, מיושם סימטרית לשני הצדדים.
- **הערת סביבה:** הכלי אינו מגדיר `RED_ENABLE_STRETCH_RECLAIM` — כמו האפליקציה החיה בדפדפן (run-ours ההיסטורי מגדיר אותו; לכן מספרי העמודים של המורשת ב־long/very_long גבוהים בכמה עמודים מדוחות run-ours הישנים).

## פקודת שחזור

```bash
node tools/parity/parity-signature.js audits/<corpus>.txt --controls --determinism --out audits/parity-signature/<corpus>
# very_long דורש heap מוגדל:
node --max-old-space-size=2800 tools/parity/parity-signature.js audits/very_long_test_text.txt --controls --determinism --out audits/parity-signature/very_long_test_text
```

יציאה 0 רק על parity מלא (0 הבדלים) + כל ה־negative controls נתפסים + דטרמיניזם לכל מנוע. **כל עוד יש הבדלים — התוצאה FAIL וזה המצב האמיתי.**

## תוצאות — מדידה מתוקנת (19.11.2026, commit 9f654ac, Node 24.22.3)

> **תיקון הארנס (19.11, סשן הביצועים):** עד עדכון זה נרשמו הגופנים ישירות ב-measure-api
> בלבד ⇒ ה-fontResolver נותר ריק ⇒ המאוחד מדד מילים בקירוב-טבלה (מופע MeasureAPI חדש לכל
> קריאה) בזמן שהמורשת מדדה במטריקות אמת — פער מדידה מלאכותי בין המנועים באותו הרץ.
> מ-commit 0614c3e נרשמים הגופנים דרך fontResolver (נקודת הכניסה היחידה של ה-Worker החי).
> **השפעה:** מספרי העמודים של המאוחד השתנו (נתיב הייצור) — very_long ‏992→851, long ‏799→687,
> mid_long ‏191→165, no_long ‏66→57. המורשת לא הושפעה (אותם בתים מסונכרנים; 38/54/139/552/699).
> **הטבלה ההיסטורית להלן לתיעוד בלבד** — היא מדדה נתיב שאינו נתיב הייצור.

| קורפוס | מורשת | מאוחד | הבדלים | דטרמיניזם | controls |
|---|---|---|---|---|---|
| canonical | 38 עמ' | 37 עמ' | 2,489 | OK/OK | 9/9 ✓ |
| no_long | 54 | 57 | 16,250 | OK/OK | 9/9 ✓ |
| mid_long | 139 | 165 | 29,814 | OK/OK | 9/9 ✓ |
| long | 552 | 687 | 157,217 | OK/OK | 9/9 ✓ |
| very_long | 699 | 851 | 187,533 | OK/OK | 9/9 ✓ |

**מדידה היסטורית (טרום-תיקון הארנס, commit 23d09be — המאוחד בקירוב-טבלה, לא נתיב הייצור):**

| קורפוס | מורשת | מאוחד | הבדלים |
|---|---|---|---|
| canonical | 38 | 37 | 2,583 |
| no_long | 54 | 66 | 16,066 |
| mid_long | 139 | 191 | 31,693 |
| long | 552 | 799 | 160,360 |
| very_long | 699 | 992 | 192,315 |

**קטגוריות ההבדלים הראשונים (no_long):** page-count, page-columns-geometry (טור יחיד 552.3 בשער המאוחד מול דו-טורי במורשת), line-text/sizePt/y בשורות השער ("מקום בינה" 46pt Lia Sgula במורשת מול "בס״ד" 12pt במאוחד — פער ה־provenance המתועד), פוליו חסר/שונה, decorations.

## קבצים

- `diff.json` — עד 40 ההבדלים הראשונים + מספר כולל (כל ההבדלים נספרים תמיד).
- `manifest.json` — hashes של קלט/הגדרות/גופנים, Node, commit, זמני הרצה לכל מנוע.
- `negative-controls.json` — 9 הזרקות; כולן חייבות להיתפס.
- `signature-legacy.json` / `signature-unified.json` — **נשמרים ב־git רק ל־canonical** (דוגמת שחזור, ~850KB); לשאר הקורפוסים מחוץ לעץ (3–49MB כ"א) — משוחזרים בפקודה לעיל.
