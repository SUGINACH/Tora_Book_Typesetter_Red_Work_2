# FIXES — Iteration 003

## מבנה הקומיטים

| קומיט | היקף | תוכן |
|---|---|---|
| `a08732b` | חטיבה A (+ חלק B–D) | שחזור מבנה שערים/TOC/כותרות/פוליו כמו המקור |
| `2702834` | חטיבות B–E | מילת-חלון, צפיפות גוף, תקציב הערות (+באנדלים) |
| (הפעם) | השלמת ביקורת | משקל גופני שערים (R10) + באנדלים + תוצרי iteration-003 |

`a08732b` — 16 קבצי מנוע: legacy-settings-map (הסרת כפילויות DISPOSITIONS, הפרדת show/count), folio, settings-registry, shaar-pages (צריכת H1), shaar-content (עוגנים מכוילים פר-פרופיל), toc-builder (תבנית TOC), gate-design.js (חדש — עיצוב שערים מכויל: פאנלים, שרשרת, כללים, עיטור), structural-stamps (חותמות shaarLayout/headerSlotGeo/tocLayout; מיקומים קבועים; פיץ' 1.3), markers (סמני הערות), materialize (צבע ornamentInk; כיבוד עוגן קיים; כותרות רצות לפי tokenId; איסוף סלוטים), headers-builder (עמוד ריק ללא ריהוט), dp-planner (מקבץ פתיחה), page-templates, notes-model, dom-renderer, export-api, pdf-writer.

`2702834` — 11 קבצי מנוע: line-model (מילת-חלון: חילוץ + קדם-שבירה חמדני + lineWidthAt), pipeline-bridge, pipeline (הסמנת חלון, חשבונאות windowWords, Math.ceil), balancing.js (מתיחת בלוק-אחרון של המורשת), materialize (פליטת חלון; בסיס), export-api (כיווץ בטיחות IMUD; פקטור אבסולוטי), kp-linebreak, + באנדלים.

## התיקון שהוסף בסשן זה (R10 — משקל גופן בשערים)

עקרון: אותו חוזה בכל השכבות — משפחה מילולית לבלוקי שער IMUD; מנהרת heading נשמרת לכותרות בלבד.

1. `typography/font-keys.js` — הוספת `literalFamilyKeyOf(fam)` (משפחה רשומה ⇒ עצמה כמפתח). מקור יחיד; ללא מנהרות תפקידיות.
2. `layout/structural-stamps.js` — `stampShaarLayout`: בפרופיל IMUD מפתח הגופן של בלוקי השער נפתר מילולית (`shaarKeyOf`); ב-DP נשמרת המנהרה (עיצוב RED המקורי). המדידה כבר הייתה מילולית (`measureOfFamily`) — עתה גם הרינדר: **תצוגה=ייצוא**.
3. `output/shaar-content.js` — דגלי `bold` הפכו פרופיליים (`bold: !imudProf` לכותרת-משנה/פרטי-מהדורא/זכויות; `bold:false` להמשך כותרת שער-משנה). DP שומר את עיצובו המקורי (בס״ד/כתר/שנה).
4. `output/dom-renderer.js` — `renderShaarContent`: משפחה מפורשת מהבלוק גוברת על הנגזרת מההגדרות (אותו חוזה כמו החותמת).
5. `output/html-export.js` — הסרת `font-weight:700` מה-CSS של מחלקות השער; המשקל בא מדגל הבלוק (inline) בלבד.
6. באנדלים נבנו מחדש מהמקור (`build-worker-bundle` + `gen-ui-bindings`).

**אימות התיקון:** p1/p23 — כל שורות השער באותו גופן-קובץ וגודל כמו הייחוס (Lia Sgula Regular 46/50pt, Livorna 21/12pt, David Libre Regular 21/11.5/15pt); דיו תת-רצועת ההמשך ב-p23: 2.903%=2.903%; אין אופרטורי Tr בשני הזרמים; אותו layoutHash (שינוי רינדור בלבד); 90/90 בדיקות; דטרמיניזם OK.

## מה לא נעשה

- לא תוקן פגם לפי מספר עמוד/טקסט; לא נוסף CSS מסתיר-פגם; לא הוחלף baseline; לא נוגע ב-main/rescue/legacy; לא הוספה מערכת layout מקבילית.
- לא בוצע cutover; PR-ים פתוחים לא מוזגו.
- שאריות פתוחות מתועדות (reflow גוף, חלוקת שורות TOC ב-5 עמודים, ריכוז פיץ') — ראו PDF_COMPARISON.
