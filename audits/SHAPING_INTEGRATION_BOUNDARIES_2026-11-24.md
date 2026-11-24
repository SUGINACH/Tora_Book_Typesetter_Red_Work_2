# מפת מסמכי התכנון — מקור סמכות יחיד

> עודכן: 15.11.2026  
> **הוראת חובה לכל אדם או סוכן AI שעובד במאגר:** לפני שינוי קוד יש לקרוא את `00_CURRENT_ENGINE_COMPLETION_PLAN.md`. זהו מסמך ביצוע פעיל יחיד.

## 0. קטלוג רכיבי המסמך והגדרות העימוד

הקטלוג [HTML העריך](קטלוג-רכיבי-מסמך-הגדרות-עימוד.html) וקובץ [נתוני המקור](קטלוג-רכיבי-מסמך-הגדרות-עימוד.data.json) הם מקור הייחוס התיעודי היחיד למלאי הגדרות, רכיבי מסמך/עמוד, ערכים, אפשרויות, ברירות מחדל, fallback והיסטוריית מפתחות. כל שינוי בקוד שמשפיע עליהם חייב לעדכן את הקטלוג באותו PR. אין לשכפל את רשימות ההגדרות במפרטים ובתוכניות; יש להפנות לכאן. אודיטים היסטוריים נשארים ראיות, לא קטלוג עדכני.

## 1. מסמך הביצוע המחייב

**[`00_CURRENT_ENGINE_COMPLETION_PLAN.md`](00_CURRENT_ENGINE_COMPLETION_PLAN.md)**

זהו מסמך התוכנית הנוכחית והיחיד שמגדיר את סדר העבודה. הוא מחלק את השלמת המנוע לעשרה שלבים, ומגדיר לכל שלב משימות, תוצרים, שער קבלה, גבולות ועקרונות ארכיטקטוניים. אין לבחור מסמך ישן כחלופה, ואין להמשיך לבצע שלבים מתוכנית ישנה שלא מופיעים בתוכנית זו.

## 2. מסמכי דרישות/ייחוס שנשארים שימושיים — אך אינם תוכנית ביצוע

| מסמך | מעמד מעתה | אופן השימוש |
|---|---|---|
| `01_MASTER_SPECIFICATION.md` | מקור דרישות פונקציונלי היסטורי | לחלץ דרישות משתמש שעדיין בתוקף; לא להשתמש בשלבי העבודה/הנחות המיזוג הישנים שבו כהוראות ביצוע |
| `תכנית לשיפור תוכנת עימוד Red.MD` | תוכנית ביצוע קודמת — מוחלפת | מקור להיסטוריית החלטות, ממצאים ודרישות; אין לבצע את סדר השלבים הישן |
| `תוכנית הפעלה לחמשת הסוכנים.md` | חלוקת תפקידים קודמת — מוחלפת | לשמר הכנות וידע; חלוקת העבודה החדשה נמצאת בסעיף 3.1 בתוכנית הקנונית |
| `02_MASTER_WORK_PLAN.md` | תוכנית מיזוג היסטורית — אינה פעילה | חומר רקע בלבד; הנחות Orange/UNIFIED ושלבי S0–S13 אינם מסלול העבודה הנוכחי |
| מסמכי S14/PRs/חוזים/ענפים | תיעוד מימוש וראיות | לבדוק מה קיים ומה הוכח; אינם מחליפים את עשרת שלבי התוכנית |

## 3. כללי הכרעה בין מסמכים

1. החלטות משתמש מפורשות גוברות על כל מסמך או הצעת AI.
2. תוכנית עשרת השלבים היא הסמכות לסדר הביצוע ולשערי ההשלמה.
3. מסמכי דרישות ישנים נשארים מקור פונקציונלי רק כאשר אינם סותרים את ההחלטות ואת התוכנית הקנונית.
4. `DECISIONS.md`, `WORKLOG.md`, `ISSUE_REGISTRY.md` ו-`OPEN_QUESTIONS.md` הם פנקסי מצב והכרעות. הם אינם תוכניות חלופיות.
5. קוד קיים או PR פתוח אינם הוכחה להשלמה. יש לאמת חיבור במסלול runtime פעיל ובדיקות על HEAD עדכני.
6. אם נמצא סתירה, אין לנחש: פותחים שאלה/החלטה מתועדת, וממשיכים רק בעבודה שאינה תלויה בה.

## 4. החרגות שאסור להחזיר

- P6/P7 אינם חלק ממסלול העבודה, ממדדי הקבלה או מהתאמת שורות/מילים.
- PDF הייחוס אינו יעד התאמה.
- אין להקים מחדש תשתיות שכבר קיימות ללא הוכחת חוסר.
- אין להחזיק מסלול עימוד מקביל כפתרון קבוע.
- אין למחוק legacy לפני הוכחת המסלול המאוחד מקצה לקצה.

## 5. מצב עדכון

עדכון של תוכנית זו ייעשה רק באמצעות גרסה חדשה ומפורשת של המסמך הקנוני, עם תיעוד החלטה ב-`DECISIONS.md`. אין ליצור קובץ "roadmap" נוסף ללא הכרעה מפורשת שמחליפה את המסמך הנוכחי.


## בקרת שלמות הקטלוג מול המימוש

- [דוח בקרה מעמיקה — 19.11.2026](../audits/CATALOG_IMPLEMENTATION_COMPLETENESS_AUDIT_2026-11-19.md)
- [קטלוג רכיבי המסמך והגדרות העימוד](קטלוג-רכיבי-מסמך-הגדרות-עימוד.html)


## דוחות ביקורת טכניים עדכניים

הדוחות הבאים הם ראיות וממצאים, לא תוכנית ביצוע חלופית. סדר העבודה המחייב
נותר ב-`00_CURRENT_ENGINE_COMPLETION_PLAN.md`.

- [CFF Geometry / Raster / LSB Review — 24.11.2026](../audits/CFF_GEOMETRY_AND_LSB_REVIEW_2026-11-24.md)
- [Shared Shaping Contract Gap — 24.11.2026](../audits/SHAPING_CONTRACT_GAP_2026-11-24.md)



- [Shaping integration boundaries — 24.11.2026](../audits/SHAPING_INTEGRATION_BOUNDARIES_2026-11-24.md)


- [Unicode 18 UTF-16 Bidi runtime POC — 24.11.2026](../audits/BIDI_UNICODE18_RUNTIME_2026-11-24.md)


## 15. ICU4X Unicode 18 → HarfBuzz shared shaping proof (25.11.2026)

The earlier sections documented the integration boundary before itemizer output was
passed to HarfBuzz. That PoC boundary has now been exercised end-to-end without
changing production RED renderers.

Workflow `45504394154`, Artifact `14972097998`, code HEAD
`9e2d59d06a4eba208e5c4f69b65986651693be18` passed:
- Node and browser classic Worker independently instantiate the pinned Unicode
  18.0.0 Bidi/grapheme WASM and itemize the same paragraph.
- The resulting three Hebrew ScriptRuns at levels [1,3,1] are passed directly
  to HarfBuzz; RLE/PDF remain in the lossless source partition but are excluded
  from shaping.
- Absolute UTF-16 grapheme starts are supplied per scalar through
  `Buffer.add(codePoint, cluster)`; HarfBuzz uses MONOTONE_CHARACTERS.
  All returned clusters remain on the original ICU4X grapheme boundaries.
- 11/11 fully covered fonts passed the shared-run probe; 118 glyph instances.
  The broader 15-font/five-string suite passed 617 glyph/source-range checks.
- Node/classic Worker full-result parity is exact.
- Original-source CFF outline comparison and tight cubic ink bounds both
  matched 852/852 glyphs in the tested three-font CFF corpus.

**Still not production integration:** this does not yet feed RED's LineItem,
LineModel, PageModel, DOM or PDF output. Production line-edge reshaping, bidi L3/L4,
script/font fallback, glyph-ID based DOM drawing, PDF GID/CID and ToUnicode/ActualText,
quadratic glyf bounds and full renderer parity remain open. The earlier description
of HarfBuzz and itemizer as isolated POCs is superseded only for the tested
ICU4X-to-HarfBuzz bridge, not for the production engine.
Full data and limits: `audits/ICU4X_HARFBUZZ_SHARED_SHAPING_POC_2026-11-25.md`.
