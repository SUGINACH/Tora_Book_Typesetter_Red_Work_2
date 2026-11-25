# שלב 5 — Text IDs, הגדרות, UI, קבלה סופית והסרת legacy

# פרומפט לסוכן AI — שלב 5 מתוך 5
## מזהי טקסט והגדרות גנריות, UI מחובר, cutover וקבלה סופית

זהו השלב האחרון. אתה אותו סוכן יחיד שביצע שלבים 1–4. אין סוכני משנה. לפני שינוי אמת HEAD, branch, Pages, CI, PageModel, projection tests ו-open issues.

### תנאי כניסה
אל תתחיל אם שלב 2 לא הוכיח ShapedRun production, שלב 3 לא השלים pipeline ו-PageModel immutable, או שלב 4 לא הוכיח DOM/HTML/PDF parity ו-Browser E2E. אם שער קודם נכשל, חזור לתיקון השלב המתאים. אסור להשתמש בשלב 5 כדי לעקוף חסם.

### כללים
רק engine/legacy-parity-preview-20261119; אין merge/push ל-main, אין force-push ואין release tag ללא אישור המשתמש.
P6/P7 ו-PDF reference parity מחוץ לתחום.
Kit 40 ועיצובי השערים המקוריים נשארים פעילים אוטומטית.
אין לבחור תשובה ל-Q12/Q13/Q14 בשם המשתמש. הצג נתונים והשלכות; השאר open עד אישור מפורש.
אין לשכתב imported defaults/user settings/fallbacks בשקט.
אין להשאיר legacy runtime "ליתר ביטחון" אחרי סגירת המעבר; rollback הוא build/commit קודם, לא מנוע שני.
הצעות היסטוריות שלא אושרו לא הופכות לדרישות מימוש אוטומטיות; שמור אותן כ-needs user decision אם לא בוטלו.

### 1. Text IDs וגנריות
- בצע inventory עדכני של parser identifiers, prefixes, aliases, registry keys, labels, UI controls, defaults ו-consumers.
- צור/עדכן קובץ mapping נפרד: Text ID סמנטי (למשל Heading 2) → identifier/key בקוד. לכל שורה: parser prefix/grammar, label, alias, consumer, source ו-test.
- הוסף CI check שמאתר IDs יתומים/כפולים/aliases לא מוגדרים.
- פונקציות layout לא יבדקו ID ספציפי. הן יקבלו LayoutPolicy/constraints; הקישור ID→policy יוגדר ב-Registry/settings.
- בדוק hard-coded branches על H2/H3/H7 בתוך parser/planner/breaker/renderer. החלף אותם ב-policies רק לאחר root-cause mapping ובדיקות.
- הוכח הוספת סוג טקסט חדש דרך manifest/settings בלבד, ללא שינוי ליבת המנוע.

### 2. ברירות מחדל, Registry וקטלוג
- השווה current registry, imported defaults, setting sets, user overrides, fallbacks ו-hardcoded constants מול התנהגות runtime. הקטלוג הקודם הכיל 256 settings; הרץ inventory מחדש על HEAD.
- הצג registry default, imported value, user override ו-fallback בנפרד. אל תקרא לאחד מהם "default" בלי provenance.
- לכל setting יש consumer חי ו-effect test; פקד ללא אפקט מוסר או מקבל reason. setting dead לא נשאר ב-UI.
- persistence/versioning/migration שומרים user diff ומונעים דריסה בעת import/retype/reload.
- template/ZIP roundtrip משמר custom text styles, page types, themes, assets, fonts, aliases, coordinates, IDs ו-version manifest.
- עדכן catalog HTML ו-data JSON באותו PR/commit עם כל שינוי סמנטי.
- Q12: אין לבחור שכבת ברירת מחדל קנונית בלי הכרעת משתמש. Q13: אין לבחור סבילות Node↔Browser בלי נתונים והכרעה. Q14: אין לאשר סופית item contract בלי הכרעה מפורשת.

### 3. TOC, headers, notes ו-side headings
- הגדרות general/detail לבחירת heading levels עצמאיות; הגדרות inline/collapsed לכל אחת עצמאיות.
- Inline/collapsed: title שחור לפי רמת המקור, מקף, page number באפור כהה, ומפריד | בין פריטים.
- כותרת TOC ראשית משתמשת בטיפוגרפיית H2 כבסיס בלבד; controls ייעודיים מבודדים מ-H2 body behavior.
- ששת header slots נשלטים באופן עצמאי; כולל source/align/font/size/width/custom text ו-opening slots.
- H7/side notes שומרות whitespace ומונעות overlap דרך allocator משותף; tests ארוכים ו-RTL.
- H3 line pitch=single line-height; bottom pad נפרד ומוחל פעם אחת.
- folio = bare gematria no geresh/gershayim; note markers remain separate policy.
- כל UI control חייב להיות מחובר לצרכן runtime ולבדיקת effect. אין להחזיר UI ישן בשלמותו כשאפשר לשמר פונקציונליות בארכיטקטורה הקיימת.

### 4. Editor, Preview, Diagnostics
- Verify bidirectional source-range navigation; page markers מופיעים בתוך העורך כממשק overlay ולא כתווים במקור.
- Editor selection highlights correct page; click Preview returns exact caret/selection; round-trip no drift.
- settings changes classified light/heavy. אין retypeset בכל keystroke; explicit reflow path, progress/cancel/error.
- diagnostics עבריים כוללים סוג/חומרה/עמוד/טור/שורה/source range/stage/cause; click navigates and highlights.
- screenshot/report PDF כולל עמוד מלא, כותרת/סיבת ממצא וסימניות כאשר workflow מאושר; אין clipping.
- כל interaction נבדק בדפדפן אמיתי, לא רק DOM shim.

### 5. Legacy retirement ו-cutover
- inventory לכל legacy dispatch, adapter, feature flag, fallback ו-words[] consumer שנותרו.
- סווג: input compatibility, test-only shadow, dead code, active runtime dependency.
- הסר adapters/dispatch רק אחרי שכל הצרכנים צורכים unified model; כל מחיקה ב-PR קטן נפרד עם dead-code proof ו-negative tests.
- איחד flags; אין selector בין legacy ל-Unified במוצר. בקשה חסרה במנוע החדש נכשלת במפורש, לא נופלת ל-legacy.
- ודא ש-Pages root הוא build Unified אחד עם provenance, hashes ו-browser acceptance. אין preview נפרד שמטעה את המשתמש.
- השאר source history/read-only fixtures אם נדרשים לבדיקה; לא להשאיר runtime product path.
- אין merge ל-main, tag release או הכרזה על סיום בלי אישור משתמש מפורש.

### 6. Final acceptance matrix
על אותו HEAD:
- npm full test, Node versions כפי שהוגדרו, Full Math, Corpus Invariants, Layout Audit, determinism, resource integrity.
- shaping/font matrix כולל actual catalog fonts והחרגות.
- Browser E2E באתר Pages root הרגיל.
- very_long_test_text.txt וקלטים סינתטיים תקינים.
- DOM/HTML/PDF raster, geometry, glyph order, source extraction parity.
- TOC general/detail independence, collapsed format/title isolation.
- side notes, H3, notes, parentheses, widows/orphans, sparse lines, empty columns.
- Kit40/gates, headers, folio >999, images/fonts, extension/template roundtrip.
- negative controls לכל audit מהותי.
- performance apples-to-apples; measure typeset בנפרד מ-render/export.
- zero legacy runtime calls, zero dropped content, zero silent fallback, zero missing PageModel.
אל תשתמש במסמך בדיקה סינתטי לא תקין: אין שתי כותרות רצופות באותה רמה ללא גוף ביניהן; אין כותרת המכילה הערת שוליים בלבד; כותרת סופית חייבת להכיל טקסט אמיתי.

### תוצרים סופיים
- audits/FINAL_ENGINE_ACCEPTANCE.md עם SHA/command/run ID/artifact/result/coverage.
- audits/UNIFIED_ENGINE_CUTOVER.md ו-audits/LEGACY_RETIREMENT_REGISTER.md.
- text-id-map, updated catalog/settings schema, developer guide ו-extension guide.
- מפת דרישות HTML מעודכנת עם כל הראיות והחלטות המשתמש הפתוחות.
- Release Readiness report עם limitations ו-open decisions.
- commits נפרדים ל-legacy retirement, catalog/docs ו-release prep.

### שער סיום
- pipeline יחיד: DocumentModel → shaping/measure → LineModel → planner → immutable PageModel → DOM/HTML/PDF.
- כל סוגי התוכן ופריטי העימוד משולבים באותו חוזה.
- אין legacy runtime path או fallback שקט.
- content/order/source anchors/font identity/glyph positions/geometry/determinism מוכחים.
- Browser root, HTML ו-PDF parity עברו על אותו HEAD.
- כל 20 נושאי הדרישות מסווגים active/transformed/user decision/superseded/excluded.
- Q12/Q13/Q14 נשארות פתוחות אם לא התקבלה הכרעת משתמש מפורשת.
- אין release tag, merge ל-main או הכרזה על מוצר סופי ללא אישור משתמש.
