# שלב 3 — איחוד מנוע השורות, התכנון והתנהגויות העימוד

# פרומפט לסוכן AI — שלב 3 מתוך 5
## DocumentModel, LineModel, planner יחיד, PageModel וכללי העימוד

אתה ממשיך כאותו סוכן יחיד אחרי שער שלב 2. אין סוכני משנה ואין עבודה מקבילה. אמת HEAD; קרא את דוחות שלבים 1–2 ואת המפה. אל תעבור ל-retire legacy לפני שיש חוזים ובדיקות שמוכיחים את המודל החדש.

### עקרונות
- מודל אחד, pipeline אחד, מקור סמכות אחד לכל החלטת layout.
- כל תוכן (טקסט, mixed fonts, תמונה, note marker, הערות, כותרות, עיטורים, TOC, שער ופריט מותאם) הוא פריט בחוזה אחיד.
- אין חישוב גאומטרי כפול, renderer שמודד או מזיז, CSS float עצמאי, או post-layout correction.
- שימור מלא של תוכן/סדר/whitespace/punctuation/glyph clusters/source anchors.
- אין P6/P7 ואין PDF reference parity.
- Kit 40 ושלושת עיצובי השערים המקוריים נשארים פעילים אוטומטית.
- Q12/Q13/Q14 אינן מוכרעות על ידי הסוכן. אין שינוי ערכי ברירת מחדל ללא מקור משתמש.
- אין להעתיק קוד ישן לפני ניתוח חוזה, תלות וסיכון.

### מטרת השלב
להשלים את השרשרת DocumentModel→MeasuredItem→LineModel→PagePlan→immutable PageModel. מדידה אחת, LineBreaker יחיד ו-Planner יחיד אחראים לכל ההחלטות. התנהגויות המשתמש שלא בוטלו משולבות בתוך החוזה הכללי.

### 1. DocumentModel ו-InlineItem
- כל block/item בעל id יציב, kind, sourceRange/sourceAnchor, parentId, order, styleRef, payload, constraints ו-diagnostics.
- פענוח תחבירי לפני measurement; source text נשמר או מקבל reversible map.
- לשמור font runs, inline style, image assets, notes, anchors ו-atomic tokens.
- אין parser per renderer או pipeline לפי סוג פריט.
- להפריד source Text IDs משמות settings/layout policies.

### 2. LineItem, LineModel ו-LineBreaker
- כל רצף inline נשבר באמצעות breaker יחיד. אין words[] layout עצמאי לצד LineModel.
- לשמור fragments של מילה מרובת גופנים/סגנונות בלי flatten.
- break opportunities מפורשים: spaces, hyphen rules, NBSP/protectors, note-marker adjacency, atomic/image items ו-legal grapheme/shaping cluster boundaries.
- justify מחושב במנוע פעם אחת; אין wrapping/remeasure בדפדפן.
- p-cut/p-end semantics נפרדות: p-end מסתיימת לפי יישור השורה האחרונה המוגדר; p-cut ממשיכה וצריכה איכות שורה תקינה.
- Drop Word/First-Word Window מוחל רק בתחילת פסקה אמיתית; שורת המשך אחרי column/page break אינה התחלה חדשה.
- sparse p-cut: בצע look-ahead להחזרת מילה/מילים חוקיות מתחילת ההמשך ובצע reflow. אל תפתור באמצעות right-align או tracking hack.
- widow/orphan/heading escort הם constraints; כל פשרה מדווחת.
- כל שורה תשמור fragments, source mapping, advances, glue, baseline, break reason ו-diagnostics.

### 3. Planner ו-column balancing
- Planner מקבל LineModel מלא, fragments, metrics, fonts, constraints, page templates, note budgets ו-geometry.
- איחוד fill/page break/balancing/chapter end/cross-column headings/page transitions/rollback תחת מודל אילוצים אחד.
- RTL reading order: right column first, then left, preserving order.
- body/note/header/ornament/gutter capacity מחושבת פעם אחת לפני placement.
- balance = בחירת breakpoint חוקי בזמן התכנון, לא DOM stretch. לשמור גבולות balance שאושרו; אין לפתוח איזון לפני H4–H6 ללא הכרעה.
- סוף פרק קצר אינו נמתח אוטומטית עד תחתית העמוד.
- אין empty column כתוצאה רגילה; structural fallback מוגדר ומדווח.
- אין feasible layout ⇒ diagnostic explicit ולא page שחורג בשקט.
- Trace לכל candidate, constraint, cost, chosen breakpoint, rollback וסיבת הבחירה.

### 4. כותרות, הערות, סוגריים ופריטי עמוד
- היררכיית H0–H7 נשמרת; H2/H3/page opening behavior נקבע דרך policies/settings, לא if על Text ID.
- H3 multiline: inter-line baseline pitch = line-height בלבד. bottom gap נפרד ומופעל פעם אחת לאחר fragment אחרון.
- H7/side notes שומרות כל spaces/source text/font segment; allocate shared vertical stack; no overlap עם body, notes, footnote line, headers או page edge. אין CSS patch.
- Parentheses: nested/cross-paragraph/cross-column/cross-page state נשמר; no style leakage; bracket note content מופרד.
- Footnotes/endnotes: marker-to-noteRef, numbering/reset, body-first budget, splitting/continuation, no duplicate count/no content loss.
- Inline images: source syntax/overrides, intrinsic dimensions/aspect ratio; participate in measure/break/plan, not CSS float.
- Ornaments/running headers/folio are PageItems; reserve space before layout.
- Folio uses bare Hebrew gematria without geresh/gershayim, including TOC labels.
- Kit 40 and original gates active by default; protect in regression.

### 5. TOC — דרישות משתמש עדכניות
- General TOC and detailed TOC have independent selectable heading-level sets. Selecting or hiding a level in one must not affect the other.
- Each TOC independently controls inline/collapsed per heading level; no shared setting key.
- Collapsed format: black title styled by source heading level, then " - ", dark-gray page number; repeat with " | " separators.
- Main TOC title ("תוכן עניינים כללי"/"תוכן עניינים מפורט") uses Heading 2 typography as a base, but dedicated isolated settings; H2 body mode/page-break/escort/ornament/margins must not leak into TOC title.
- Row style, pageRef, source hierarchy and click navigation are preserved.
- TOC built structurally before PageModel; no DOM insertion after layout. Page number derived from pageRef, never guessed from index.
- Level 7 grouping/visibility is tested separately; hidden child entries cannot be dropped before group rules are applied.

### 6. PageModel
- One immutable PageModel stores geometry, pages/columns/blocks/lines/fragments/glyph slices, page items, note regions, headers/footers, links, assets, z-order, clipping, reading order, source anchors and diagnostics.
- Each placement records final bounds, baseline, advances/ink bounds, transform, font identity and placement reason.
- Coordinate system, units, RTL semantics, rounding and transforms are uniform.
- geometry/content hashes and validator prove no missing/duplicate items, orphan anchors, invalid bounds or silent omissions.
- Freeze PageModel; any mutation requires rerun of planning.

### 7. Tests
- Main corpus: very_long_test_text.txt. Synthetic documents supplementary only and structurally valid: no consecutive same-level headings without intervening body text, no heading containing only a footnote, and terminal heading must contain real text.
- Fixtures: empty columns, H2/H3, 2-line H3, widow/orphan, p-cut runt, long note, adjacent H7, parentheses across pages, images, mixed-font, TOC levels/groups, headers, gates, folio >999, missing fonts.
- Negative controls per diagnostic; content/source hash and reading order preserved.
- Run Full Math, Corpus Invariants, determinism, Layout Audit, shaping tests and Browser tests relevant to planning.

### תוצרים
DocumentModel/InlineItem schema, LineModel/Breaker, planner, note allocator, PageItem registry, independent TOC controls and isolated title settings, H3 contract, immutable PageModel, validators, test fixtures, trace and coverage update.

### שער קבלה
- One authoritative pipeline from source to PageModel.
- One measure source, one breaker, one planner; no words[] layout path or renderer correction.
- All user layout requirements not excluded are represented by tests.
- TOC independence/format/title isolation pass.
- H7 preserves text and never overlaps; H3 pitch is correct.
- very_long source content/order fully preserved; synthetic documents valid; negative controls detect injected defects.
- PageModel immutable and deterministic.
