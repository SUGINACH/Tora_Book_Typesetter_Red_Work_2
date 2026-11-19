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

## תוצאות (19.11.2026, commit 23d09be, Node 24.22.3)

| קורפוס | מורשת | מאוחד | הבדלים | דטרמיניזם | controls |
|---|---|---|---|---|---|
| canonical | 38 עמ' | 37 עמ' | 2,583 | OK/OK | 9/9 ✓ |
| no_long | 54 | 66 | 16,066 | OK/OK | 9/9 ✓ |
| mid_long | 139 | 191 | 31,693 | OK/OK | 9/9 ✓ |
| long | 552 | 799 | 160,360 | OK/OK | 9/9 ✓ |
| very_long | 699 | 992 | 192,315 | OK/OK | 9/9 ✓ |

**קטגוריות ההבדלים הראשונים (no_long):** page-count, page-columns-geometry (טור יחיד 552.3 בשער המאוחד מול דו-טורי במורשת), line-text/sizePt/y בשורות השער ("מקום בינה" 46pt Lia Sgula במורשת מול "בס״ד" 12pt במאוחד — פער ה־provenance המתועד), פוליו חסר/שונה, decorations.

## קבצים

- `diff.json` — עד 40 ההבדלים הראשונים + מספר כולל (כל ההבדלים נספרים תמיד).
- `manifest.json` — hashes של קלט/הגדרות/גופנים, Node, commit, זמני הרצה לכל מנוע.
- `negative-controls.json` — 9 הזרקות; כולן חייבות להיתפס.
- `signature-legacy.json` / `signature-unified.json` — **נשמרים ב־git רק ל־canonical** (דוגמת שחזור, ~850KB); לשאר הקורפוסים מחוץ לעץ (3–49MB כ"א) — משוחזרים בפקודה לעיל.
