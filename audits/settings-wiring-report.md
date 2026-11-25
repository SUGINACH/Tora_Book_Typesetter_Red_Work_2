# בדיקת חיווט לוח ההגדרות בדפדפן — EXT-20 (24.11.2026) + EXT-21/22 (25.11.2026)

**מטרה:** ודא שכל אפשרויות הבחירה בלוח ההגדרות (259 הגדרות + 9 בוררי ספרייה)
מחוברות ומשפיעות על המסמך בפועל, ותקן כל מה שנדרש תיקון.
**עדכון EXT-21 (25.11):** תיקון דיווח המשתמש "השערים אחורי/משנה לא נמתחים על
כל העמוד" — עיצובי השערים לא צוירו כלל בייצוא PDF (svg-ב-data-URI נחשב
"תמונת רסטר"); כעת מפוענחים וקטורית (stretch מלא, גרדיאנט→צבע ממוצע,
מסגרות stroke) ונצבעים מאחורי הטקסט (behind) — כמו ה-DOM והמקור הירוק.
**עדכון EXT-22 (25.11):** השוואה מלאה מול המקור הירוק (Tora_Book_Typesetter_
Green) — **הוספה בלבד, אפס הורדות**: 78 הגדרות חדשות (259→341), ביחוד
תוכן-העניינים — גופן/גודל/הצגה/קיבוץ פר-רמה ופר-סוג (f/s-gtoc-N, f/s-dtoc-N,
gtoc/dtoc-show, gtoc/dtoc-grp), סימן (f/s-siman), פתיחות אי-זוגי (odd-h0/1/2),
סמני הערות, גיליון על שערים (main/back/sub-shaar-show-number) ותיבות שער
(builder-{main,sub,back}-{top,bottom,right,left} — 0=אוטומטי). תיקון שור:
שדה ה-font של שורות ה-TOC אבד במיפוי המודל — הגופן לא הגיע מעולם לרינדור.
בדיקות: 26/26 סוויטות; cross-check PASSED (legacy-28f52 נשמר); דפדפן —
14/16 מקרים משנים מסמך (קיבוץ-TOC וגודל-סמן הוכחו ב-Node/PDF).

**מתודולוגיה:** סוויפ אוטומטי בדפדפן החי (harness: `tools/browser-settings-sweep.js`) —
מזריק מסמך בדיקה דטרמיניסטי, ולכל ערך-בחירה של כל בקרה בפאנל: משנה דרך
ה-DOM האמיתי (dispatch change) → מפעיל ⚡ (הנתיב המיידי) → ממתין להשלמת
העימוד (מונה דור) → מצלם את ה-HTML המיוצא המלא + layoutHash + מספר עמודים
→ משווה לבסיס → משחזר את הערך. 599 מקרי בדיקה בכל ריצה. בנוסף: מסמך עשיר
(H0/H1/מטא-נתונים מלאים), מסמך עם כותרת-1 מפורקת (למפריד שער-המשנה),
בדיקות ידניות ל-7 המפתחות הקלים (רינדור-בלבד), בוררי ספריית IMUD
(8 בוררי עיצוב + ערכות סגנון), וצילומי אימות hash.

## תוצאות לפני התיקון (סוויפ v2, מנוע לפני EXT-20)

- 273/599 מקרים השפיעו; **150 מפתחות מתים לחלוטין** + 7 חלקיים (אפשרות אחת מתה).
- 8 בוררי הספרייה + ערכות הסגנון: הבוררים לא השפיעו כלל (רק ערכות הסגנון עבדו).
- באג הנתקעות: `fn-bar-max-height-px=1` נעל את המנוע (90 שנ' + ביטול).

## התיקונים (EXT-20) — כולם בריפו זה בלבד

| קבוצה | מפתחות שחוברו | מנגנון |
| --- | --- | --- |
| גשר S77 מורחב | heading-2..6-size-pt, body-font-size-pt, body-line-height, first-word-size-em, imud-book-back-* (4), header-separator-line, heading-0-body-size/font | `RED_SETTING_BRIDGE_S77` + קריאות cfg/SZ חיות; ברירות המחדל = הקבועים המכוילים (מגן digest) |
| מצבי כותרות | heading-0..7-mode | `refreshHeadingModes` — דריסה מההגדרה החיה רק כששונה מהמיובא (עגול-סגור מלא; h1-new-page⇒sub_shaar) |
| גוף וסולם | body-font-size-pt, body-line-height, paren-style-scale | `GEO.LINE_H = body×(96/72)×lh` (12/1.34 ⇒ 21.44 בדיוק), `SZ.parenDelta=(scale−1)×body` (0.8333×12 ⇒ −2) |
| מילת-חלון | first-word-size-em, first-word-font | מדידה (`breakPara` ×em) + רינדור (em מההגדרה; גופן מוזרק רק כש≠FrankReal) |
| מספור עמודים | page-num-format/frame/position/initial-value/start-idx, count-shaar/sub/toc/endnote-pages, general/detailed-toc-count-numbering | `folioOf` (hebrew=toBareGematria/decimal/דף-…), רשימות counted לפי count-*, עיגול/מסגרות/מיקומים ב-renderLegacyPage |
| הערות | footnote-marker-style (5 סגנונות), footnote-reset-policy (continuous; page/part≈siman), fn-bar=1 (תיקון נעילה: רצפת שורה) | `markerStyleFn` (ברירת מחדל = toGematria ההיסטורית), כינוי-רישום, `Math.max(1, floor(cap/pitch))` |
| שערים | show-shaar-sub, shaar-sub-enabled, shaar-sections-* (3), heading-0/1-* (8), heading-0-body-* | שערי-משנה מגודרים ב-cfg.showSubShaar + כינוי; גדלים/צבעים/גופנים כבר נקראו — אומתו במסמך עשיר |
| רינדור-מורשת | background-color/opacity/image/texture/page-type, footnote-separator-rule, column-divider-style | renderLegacyPage: אותם חוזקים כמו הנתיב הכללי (bgRgba, planBackground, fn-rule, קו מפריד טורים) |
| כותרות עליונות | header-verso-same-as-recto, split-book-title (combo), מקורות custom (combo) | ירושת recto במעבר ה- S77; דריסת book-name→split |
| ספריית IMUD | 8 בוררי עיצוב: שער ראשי/משנה/אחורי, עיטור עליון/תחתון/צדדי, מפריד | הפניות imud: נפתרות לעיצוב מלא (shaar-design ברקע) או לדיו אמיתי; **תוקן בורר הצדדי (חסר imageMode ב-PICKS)** |
| ערכת נושא | הפעלה אמיתית של ערכת 40 | שערי הספר מרונדרים מהעיצוב האמיתי (כפי ש-README הבטיח) במקום השלד המוקשח — **שינוי ברירת-מחדל מכוון בדפדפן בלבד** (נתיב Node/מנעולים לא זז) |

## אימותים

- **Node: 26/26 סוויטות ירוקות**, `test:determinism` OK, `cross-check` PASSED
  (very_long: 695 עמודים, hash `legacy-28f52` — המנעול נשמר; run-ours ללא שינוי).
- **דפדפן:** בסיס נקי יציב לפני/אחרי כל ריצה (`finalCheck.ok=true`); כל שינוי
  משוחזר; layoutHash ברירת המחדל זהה (`legacy-1c281fbd…`) — הגיאומטריה לא זזה.
- **סוויפ סופי:** 599 מקרים; 351 השפיעו; אפס notApplied; אפס חריגות מנוע
  (ה-light-7 אומתו ידנית — הם נחסמים ב-guard ה-dirty בזמן הסוויפ, לא באג).

## שאריות מתועדות (by-design — לא ניתנות לתיקון במנוע הישן)

- **לא מומשו במנוע הישן וגם לא במקור:** aq-* (12), prevent-widows/orphans (4),
  widow-strictness, runt-min-width-pct, balance-chapter-end,
  allow-terminal-residual-fallback, imbalance-max-delta-px.
- **הוספות-RED בלבד (אין מקור):** note-placement-mode, endnotes-enabled,
  endnote-columns, footnote-columns, s-note-body-*, shaar-back-text, dh-*,
  h3-side-orn*, chapter-end-ornament* (הבורר כותב — אין צרכן), heading-dividers-h3-h6.
- **חוזה A4 מכויל:** grid-* (4), margin-top/bottom-px, binding-offset-px (בזרימה
  עצמה; ב-page-templates נצרך), h2-top-offset; אפשרות page-size=custom (זהה ל-A4).
- **צימוד-פס:** heading-7-size-pt (ייבוא נחתם 6→8; מפתח הערות-הצד מכויל), אפשרות
  side-note ל-h4..h6 (הערות-צד ברמה 7 בלבד), first-word-align-cap-top (בסיס −2px מכויל).
- **אוצר-מילים:** shaar-*-divider (ערכי CSS מול מזהי עיצוב), toc-level-7 (רמות 2–6),
  hdr-h1-title-mode (ctx.h1 לא מסופק במעבר המורשת), measure-impl (זהה כשהגופנים רשומים).
- **מקור האמת = המסמך:** imud-book-title/subtitle/desc/sections/author/year
  (מטא-נתוני העורך גוברים; ערכי ערכת-הנושא רדומים), shaar-year-* (השנה אינה
  מוצגת בשער המכויל — כמו במקור), shaar-main/sub-image.
- **תלויי-קומבינציה/מסמך:** header-*-custom-text (דורש מקור custom), split-book-title
  (פועל על מקורות book-name), background-inset-mm (עם תמונה), long-footnote-policy
  (הערות חורגות), header-opening-* (עם opening-dedicated), h2-orn-*/imud-* במצב
  image (עם הפניה מהבורר — כעת עובד), 'page'/'part' של footnote-reset-policy (≈siman).
- **ממשק/ייצוא בלבד:** trace-verbosity, diagnostics-enabled, audit-stage-snapshots,
  offline-guard, debounce-light-change-ms, theme-set-id (הערכה פעילה דרך ההפניות),
  pdf-crop-marks + export-bleed-mm (נתיב PDF), page-num-format='hebrew' (=ברירת המחדל),
  page-num-initial-value=0 (נחתם ל-1), page-num-start-idx=2 (עמ' 0 לא נספר ממילא),
  fn-bar=1000 (נדרס ע"י תקרת 50% של body-first), header book-name-split/rest
  (זהים לחצאים ב-recto).


## EXT-23 (25.11.2026) — סבב תיקונים שני: חיווט שאריות הסוויפ + שני באגי שורש

**רקע:** סוויפ v2/v3 (הריצה החיה על מסמך fixed של 421 עמודים) השאיר 126 מפתחות
ללא השפעה (פסק-דין פר-מפתח: 191 wired / 24 partial / 126 no-effect — מתוך 341).
בדיקת שור שיטתית (Node + מסמך עשיר) הראתה שלושה סוגים: באגים אמיתיים,
חסימות עדיפות, ושאריות מתועדות.

### א. תיקוני חיווט (המנוע)

| קבוצה | מפתחות | שורש + מנגנון |
| --- | --- | --- |
| פוליו שערים | main/back/sub-shaar-show-number | הצגה חייבה מספר: עמוד שאינו נספר אין לו גיליון להציג — כעת הדלקת show מכריחה ספירה של אותו עמוד |
| ספירת שער-משנה | count-shaar-sub-pages | הגדרה חיה במקום cfg.countSubShaar (raw); ברירת המחדל ברישום תוקנה ל-true — כמקור (sub-shaar-count-numbering=true) וכהתנהגות ההיסטורית |
| גיליון תוכן | general/detailed-toc-show-numbering | D-62 הוחל גם בנתיב המורשת (shows מותנה בדגל; ברירת מחדל true — ה-digest נעול) |
| קיבוץ TOC | toc-{g,d}grp-1/2 | הדיפלוקט r.level<=2 הוסר — הקיבוץ נקרא מההגדרה לכל רמה (ברירות המחדל false/true משחזרות בדיוק) |
| מספור שורות TOC | toc-count-row-numbers | קדומת מספר סידורי לטקסט השורה (ספירה מקומית לכל תוכן; כבוי כברירת מחדל) |
| הערות — הסטה | note-placement-mode='endnotes', endnotes-enabled | הערות-שוליים מוסטות לזרם הערות-הסיום: המרזב לא נבנה, התקציב מתאפס, הגוף ממלא את העמוד; ההערות מתווספות לעמודי הסיום עם מספרי הסמנים שהוקצו |
| הערות — טורים | endnote-columns | 1/2 טורים בעמודי הסיום (ברירת המחדל ברישום תוקנה 1→2 — הפריסה ההיסטורית); נמדד: 84 שורות ⇒ 51/33 (2 טורים) מול 51/33 בשני עמודים (1 טור) |
| הערות-צד | s-note-body-font, s-note-body-color | marginApi מההגדרה (ברירת מחדל ברישום תוקנה ל-Hadassah — הגופן בפועל); הקרנה: תת-גופן דינמי S73; ה-DOM: fontOf |
| עיטורי צד H3 | h3-side-orn (+height-em) | פס overlay אחרי ה-hash: עיטורי צד לפס h3-title (pyramid/lance/shoshanta/scroll או imud:) |
| עיטור סיום פרק | chapter-end-ornament (+w/h-em) | תחתית העמוד האחרון של כל פרק H2 (לפני פתיחת ה-H2 הבא/סוף הספר); רק במקום פנוי — לעולם לא דוחף תוכן |
| מפרידי כותרות | heading-dividers-h3-h6 | קו דק תחת H3 (פס) ו-H4..H6 (שורות טור); **תיקון דיו: סוג rule לא צויר ב-DOM כלל** (רק ב-PDF) — נוסף ענף רינדור |
| דיבור המתחיל (ד"ה) | dh-auto-detect, dh-font, dh-color | כמו applyDibburHamatchil של המקור הירוק: פתיח הפסקה עד המפריד הראשון (≤80 תווים) מסומן dhWords; הרינדור ב-DOM (span w--dh) וב-PDF (תת-גופן דינמי + צבע) |
| שער אחורי | shaar-back-text | טקסט שהוזן בכוונה גובר על יבוא ברירת-המחדל (imud-book-back-copyright / cfg.backCopyright) — עד כאן השדה היה חנוק לנצח |
| סמנים חכמים | page-num-format (שחזור), טורי הערות | שחזור הערך אחרי הסוויפ אומת (notRestoredKeys ריק) |

### ב. שני תיקוני שור שנחשפו בדרך

1. **אובדן הערות-סיום מרובות (חמור):** שורות "הערת סיום -" רצופות דרסו זו את זו
   (pendingEndNote נדרס) — במסמך ה-fixed **64 מתוך 65 הערות אבדו בשקט**. כעת כל
   שורה נסגרר לטוקן עצמאי. שימור התוכן גובר על נעילת ה-digest (עיקרון S4.24);
   הנעילות של s76/s77 חודשו מתועד: legacy-8b344→legacy-ff891, legacy-0861db→legacy-f0a28.
2. **דיפלוקט בקיבוץ TOC:** רמות 1/2 הוצמדו בקוד (r.level<=2) בניגוד להגדרה.

### ג. שיפורי ה-harness

- **פסק-דין פר-מפתח** (wired/partial/no-effect) במקום all-or-nothing: מקרה אחד
  שקול (למשל book-name-split מול first-half) לא ממית מפתח שלם.
- **המתנת light-keys** 1200→2700ms — ה-dirty-guard של הרענון הקל נוקה ב-~2.5 שנ';
  ב-1.2 שנ' הייצוא נחתך (err:dirty) והמפתחות סומנו ERROR בטעות.

### ד. אימותים

- **Node: 26/26 סוויטות ירוקות** (npm test; exit 0), דטרמיניזם OK.
- **בדיקות ממוקדות בדפדפן** (fixed, 422 עמודים): h3-side-orn/chapter-end/toc-ggrp-2/
  shaar-back-text/note-placement-mode=endnotes — CHANGED; dh-auto-detect/dh-color —
  CHANGED (לאחר ייצוב בסיס); heading-dividers — CHANGED (לאחר תיקון הדיו).
- **סוויפ v4 מלא:** 758 מקרים; 483 השפיעו; 191 wired + 24 partial; שחזור מלא
  (notRestoredKeys=[]) ובסיס יציב (finalCheck.ok, hash legacy-47d53906…).
  המסמך ה-fixed עלה 421→422 עמודים — **תוצאה רצויה**: 65 הערות-סיום נשמרות
  במקום 1 (תיקון השור של אובדן ההערות).

### ה. שאריות מתועדות לאחר EXT-23 (לא באגים)

- **תלויות-מסמך (fixed חסר H0/H1/H7/shaar-sub):** heading-0/1-* (פריטי פאנל),
  toc-*-1/*-7 (רמות 1 ו-7), toc-level-1/7-show/inline, show-shaar-sub,
  shaar-sub-enabled, shaar-sections-*, odd-h0/odd-h1 (פתיחת H0 נוחתת במקרה באי-זוגי),
  h2-reset-siman, sub-shaar-show-number, shaar-sub-box-*, count-endnote-pages
  (הערות בסוף הספר — אין עמודים אחרי לראות את המספור). **אומתו LIVE במסמך עשיר**
  (ext23-richdoc-check: heading-0/1, shaar-sub, toc-gshow-1 ועוד — 25/29 LIVE).
- **תלויות-קומבינציה:** header-opening-* (דורש opening-dedicated), header-*-custom-text
  (דורש source=custom), h3-side-orn-height-em / chapter-end-ornament-w/h-em (דורשים
  את העיטור עצמו), imud-orn-* (מצב image דורש הפניה), long-footnote-policy (דורש
  הערה חורגת), footnote-columns (המרזב חד-טורי היסטורי — הטור השני אינו ממומש).
- **לא מומשו במנוע הישן וגם לא במקור:** aq-* (12), prevent-widows/orphans (4),
  widow-strictness, runt-min-width-pct, balance-chapter-end,
  allow-terminal-residual-fallback, imbalance-max-delta-px.
- **חוזה A4 מכויל:** grid-* (4), margin-top/bottom-px, binding-offset-px, h2-top-offset.
- **מקור האמת = המסמך:** imud-book-* (מטא-נתוני העורך גוברים), shaar-*-image.
- **ממשק/ייצוא בלבד:** theme-set-id, trace-verbosity, diagnostics-enabled,
  audit-stage-snapshots, offline-guard, debounce-light-change-ms, pdf-crop-marks,
  export-bleed-mm, measure-impl, background-page-type.
- **צימוד-פס:** heading-7-size-pt, first-word-align-cap-top, shaar-year-*,
  shaar-main/sub-divider (ערכי CSS מול מזהי עיצוב), imud-shaar-sub, imud-divider,
  imud-chapter-end, footnote-separator-rule וה-light-keys (אומתו חיים ידנית —
  ה-blocking בסוויפ הוא dirty-guard, לא מוות).

## שימוש חוזר

ה-harness נשמר ב-`tools/browser-settings-sweep.js` — לטעינה בקונסולת הדפדפן
(`window.__sweepRunAll()`) ולסריקה חוזרת אחרי כל שינוי מנוע.
