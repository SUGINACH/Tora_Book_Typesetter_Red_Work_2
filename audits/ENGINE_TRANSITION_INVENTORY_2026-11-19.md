# מלאי תוצאה/יכולות למעבר מנוע — 19.11.2026

**סטטוס:** חקירה ראשונית מבוססת קוד/החלטות/WORKLOG/PR; לא חוזה סופי ולא אישור cutover. אין לשנות defaults על סמך מסמך זה ללא effect tests.

## מצב ו-SHAs
- Main בסיס 9C.3: 4992e090457458f59b0a44c95a3f96656f29b2e2.
- PR #64 / 9D.1: 664348070ed80c0d9226b271ddd9477fb4558156.
- legacy-imud-flow.js: de22436ccb4112fe4e794a55f23675eec21b30f5.
- default_settings.json: 23a42123998f1f4058168e3fbcaa7da6f9301415 (265 keys).
- settings-registry.js: 2032ca239297d685a44d0e6e3c53e3ed3cc86ff7.
- legacy-settings-map.js: f2c1be34fc1cacda852cdfa4f3756e705ed7c06c.
- DECISIONS.md: 6a45d36ca3f4aa0b139efe15ee2e3ba01c7d2891.
- SETTINGS audit: audit commit 95e829d as documented therein.

**זהירות:** חוזה 9C.3 הוא baseline התנהגותי, לא אידיאל איכות. D-97/D-100 ביטלו parity מול PDF הייחוס כיעד/שער. ערכים המסומנים calibrated from reference צריכים אימות עצמאי/הכרעה.

## 1. יעד איחוד
Runtime אחד; Document/InlineItem/LineModel/Measure/Planner/Capacity/Footnote+Side-note constraints/PageModel/Geometry מקור יחיד. DOM/HTML/PDF מקרינים אותו מודל בלבד. אין renderer measuring, layout fallback, post-layout corrections, או paths מיוחדים לפריטי תוכן. כל font face/size/color/weight/metrics/coordinates/anchor נישאים מפורשות. דטרמיניזם, trace והודעות כשל גלויות.

## 2. מזהי מסמך וטקסט
- Metadata: שם הספר/ספר/title; נושא/subject; נושא מפורט; פרטי מהדורא/מהדורא/מהדורה; שם המחבר/מחבר/author; מקום ושנת הוצאה/מקום/שנה; שמירת זכויות; פרטי הוצאה לאור; פרטי קשר; פרטים נוספים.
- כותרות: H0/הקדמה; H1/חלק; H2; H3; H4; H5; H6; H7 (כולל מספר N ו-(מקור: …)).
- Notes: הערת סיום -; הערת סיום-N -; הערות סיום - (כותרת מחלקה); delimiters ברירת מחדל [ ] אך configurable; markers/anchors/continuations/word ranges הם זהויות סמנטיות.
- Editorial: ##…##; auto dibur-hamatchil לפי תבניות נקודה/מקף; custom styles לפי prefix/inline/pattern/combinator/counters.
- Inline image: #relative/path# עם .lNN/.cNN/.rNN; D-107: 50% מהטור המקומי, center כברירת מחדל; wrap גאומטרי, PNG/JPG/JPEG, missing/corrupt asset warning בכרטיסיית בדיקה.
- Inline font: זוג markers של style ו-tag כללי <Family>…</>; family-only, nesting; גוף/הערות לרבות סוגריים; לא headings/headers/TOC; external font רק asset מקומי והטמעה.
- Unicode ניקוד/טעמים/גרש/גרשיים/ZWJ: אסור לפצל glyph cluster; sentinels E000/E101/E102/E103/E104 פנימיים ולא syntax.
- כותרות test-doc חייבות תקינות: לא שתי כותרות מאותה רמה בלי גוף; לא כותרת שמכילה רק הערה; לא כותרת ריקה. D-98: very_long אמיתי הוא קורפוס נכונות; generator קבוע/רנדומלי stress בלבד.
- Parser audit מונה ~42 identifiers; הקטלוג המדויק נמצא ב-SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md §6. זה לא 28 בלבד: הרשימה כאן מייצגת משפחות, והאודיט המצורף סמכות מלאה.

## 3. רכיבי עמוד/פלט
| רכיב | חובת חוזה |
|---|---|
| A4 page | size/box/RLT, אותו DOM/HTML/PDF |
| שני טורי גוף | x/w/capacity וסדר RTL; source geometry |
| central gutter | גאומטריה מפורשת, לא grid-hole |
| margin lanes | ימין/שמאל, side-notes anchor/push/overflow |
| body lines | LineModel, font runs, justify/gaps, baseline |
| H0 opening | wide single column, drop word, H0-body style |
| H2 opening | spacer, siman/title, ornaments/background |
| H3 span | full-width; line-height/padding contract; no forced page break; bottom-gap פעם אחת |
| H4–H6 inline | guards/escort, spacing no duplication |
| H7 | side-note timing, citation/number/anchor preserved |
| footnote area | note budget=placement=projection, split/move, order |
| endnotes | dedicated pages, markers, title, width, content identity |
| main/back/sub gates | metadata, four semantic back fields, H1 gate, themes/dividers |
| TOC general/detail | levels, atom/group, wrap, folio, click-links |
| header R/C/L | recto/verso, source/font/size/color/align/width/baseline |
| folio | format/start/sequence/frame/font/size/color/position |
| dividers/ornaments | assets/size/paint/placement/scope |
| background | color/image/opacity/mode/insets |
| custom/filler/blank | explicit type, deterministic, no phantom pages |
| info-box/custom items | registry/schema/measure/constraints/project from contract |
| images/wrap | size/aspect, geometry wrap/float side, overflow |
| HTML/PDF/preview | PageModel-only, no re-typeset or fallback |

Page types currently catalogued (verify complete): REGULAR, PREFACE, SHAAR_MAIN, SHAAR_BACK, SHAAR_SUB, SIGN_OPEN, TOC_GENERAL, TOC_DETAIL, CUSTOM, FILLER, ENDNOTE. Legacy heading modes: H0 new-page-1col; H1 sub-shaar; H2 new-page-1col; H3 spanning; H4–H6 inline; H7 side note. This is behavior inventory, not endorsement.

## 4. 9C.3 geometry — observed constants, not final approved design
Units px@96dpi (PDF=px×0.75).
| item | value |
|---|---:|
| page | 793.7×1122.5 |
| column width | 269.41 |
| right/left column x | 403.61 / 120.72 |
| gutter | 13.48 |
| margin lanes x-right/x-left/width | 686.3 / 56.7 / 50.5 |
| body top/height/bottom | 107.2 / 915 / 1022.2 |
| line pitch | 21.44 |
| H2 spacer | 180 |
| header baseline | 71.9 |
| folio baseline | 1054.5 |
| footnote area top/pitch | 969.5 / 16.7 |
| single column | 552.3 |
| H2 region | 284.25 |
| H0 region/title y | 249.2 / 309 |
| H0 line pitch | 20.55 |
| H2/H3 title width | 331.38 (60%) |
| TOC title block/first/continuation top | 213 / 370.7 / 113.7 |
| TOC stretch bottom | 1005.7 |
| stretch/justify caps | 48 / 9 / 3 |
| reclaim buffers | 12 / 2 |

9D.1 shares these constants between legacy and unified, and reported unchanged legacy digest on no_long and very_long. This does NOT prove these geometry values are the final correct product geometry. Independently validate relationships, recto/verso/binding, every page type and rendered outputs.

## 5. D-107 approved defaults — canonical user decisions
| role | font | size/setting |
|---|---|---|
| body | Guttman Rashi | 14pt; line height 1.4; black |
| parentheses | same context | scale 0.92 |
| first word | drop | one word, 2em, min 3 lines |
| H0 title | AlphaBlack | 26pt |
| H0 body | Frank Ruhl Libre | 11.5pt |
| H1 | Lia Sgula | 50pt |
| H2 | AlphaBlack | 17pt |
| H3 | Alpha | 13.5pt |
| H4 | Alpha | 12.5pt |
| H5 | AlphaLight | 11.5pt |
| H6 | Noto Serif Hebrew | 10.5pt |
| H7 | Hadassah Friedlaender | 6pt |
| TOC | David Libre | general on levels 1–6; detailed on levels 2–6; H7 hidden; numbers+folios on; inline grouping off |
| AQ | — | automatic AQ off; bottom-align independent |
| headers | — | H1 upper-header mode main |
| page grid | — | A4; column width 40%; side margins 7.5%; gutter 2% |
| folio | Livorna Bold | Hebrew; bottom-center; 11pt; black |
| theme/gates | theme 40 | auto-active; original 3 gate designs active; library available |
| images | — | #path#; 50% local-column, center; .l/.c/.r; geometric wrap; PNG/JPG/JPEG; missing asset warning only |
| inline fonts | — | style marker pairs and <Family>text</>; family-only/nested; body+notes; not headings/headers/auto TOC |

## 6. Conflicts between D-107 and currently imported source JSON (confirmed at data level)
Boot imports source JSON and may override registry defaults. Current JSON values:
- Body size 12 (approved 14); line height 1.34 (approved 1.4).
- Drop-word mode window (approved drop); size 1.5 (approved 2); min lines 2 (approved 3).
- AQ enabled true (approved false).
- Parens: D-107 scale .92, legacy SZ currently fixed delta -2pt; bridge/consumer unclear.
- H1 approved size 50pt but registry control max is 48.
- General/detail TOC both on in JSON, aligned with D-107.
- H0–H7 font families/sizes align source-side; verify resolution/render runtime.
- Theme 40: source JSON has theme_default selectors, boot derives json_theme_40; verify active assets.
- D-107 explicitly sets canonical defaults, so registry/source difference (67 effective discrepancies, F-J5/OQ-12 in prior audit) is no longer an open user choice. Bring effective boot values into agreement or present a remaining deviation for decision.
Effect tests are required before changes.

## 7. Font, size, color details (source JSON vs D-107)
Source stacks/sizes (source defaults, NOT canonical after D-107):
- Body Guttman Rashi / Frank Ruhl Libre fallback, 12pt; first-word FrankReal / FRL, 1.5em.
- H0 AlphaBlack/David Libre 26pt; H0 body FRL 11.5.
- H1 Lia Sgula/Bellefair 50; H2 AlphaBlack/David 17; H3 Alpha/Noto Serif Hebrew 13.5; H4 Alpha/FRL 12.5; H5 AlphaLight/David 11.5; H6 Noto Serif Hebrew 10.5; H7 Hadassah Friedlaender/David 6.
- TOC David Libre levels 1–7: 12, 11, 10.5, 10.5, 10.5, 10.5, 8.8pt.
- Note source body FRL 9pt, note title David Libre 9pt, note marker gematria superscript 8pt, listing marker 8pt.
- Main gate Lia Sgula/Bellefair 46pt; subtitle Livorna/David 21; description Livorna/FRL 12; edition David 11.5; author David 15; year David 12.
- Back cover text Assistant ExtraLight, legacy size roles: rights 13.5; 4 fields 10/11/10/9.5.
- Folio source: gematria, bottom-center, no frame, start 1; legacy folio 10.5pt vs D-107 registry 11.
Colors: registry defaults black #000000 for body/headings/header/folio/gates/notes; background #ffffff. Source backgrounds #f4f1e8 but mode none and opacity=15 (verify consumer/theme). Dividers: column none, header gray, section spear, H3–H6 none, shaar dividers none. Do not infer actual theme render from raw JSON alone.

## 8. Header/folio/TOC defaults to verify in runtime
- Header slots R/C/L. Regular source: R book title split right; C H2 without siman; L book title split left; centered; widths 33.33/33.34/33.33%. Verso R book title split R, C H1, L split L. distinct even/odd true; alternating false; title-split false.
- Legacy SZ sizes R/C/L=15/11/15pt, baseline 71.9. Registry defaults per-slot David HB, 11pt, black. Verify source mapping, actual family/size and baseline in all output paths.
- Folio source format gematria (not in registry enum; enum currently Hebrew/decimal/daf-hebrew); D-107 Hebrew bottom-center Livorna Bold 11pt black. Verify enum and format implementation.
- TOC both enabled; general levels1–6, detailed2–6; H7 hidden; numbering/folios on, inline false. Sizes as source table above; wrapping/atomic page groups/links are layout.

## 9. Full settings/text inventory
Existing audits cover 253 registry settings, 265 source keys, 161 dispositions + 15 family rules, ~42 text identifiers and 34 hard-coded pseudo-settings. Exact per-key default/imported value/label/consumer/read-by/layout classification: audits/SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md Appendix A. Exact source mapping: Appendix B. This is mandatory companion material; report does not duplicate its ~68KB tables. The text identifier list is in §6 of that audit.

## 10. 9D.1 proved vs unproved
Proved/PR claim: geometry constants shared into legacy with reported unchanged digest; IMUD page templates use shared constants; H0 body uses wide-column measurement; --unified flag added; 11 geometry tests and generic-path negative test.
Still not proved: complete recto/verso and binding-offset geometry; both columns/margins; all page types; actual DOM/PDF geometry; content and typography parity; performance parity; independent correctness of geometry values; headerHeight/baseline consumer semantics. Binding test appears to assert right-column x only. PR #17 remains do-not-merge; revalidate FX roots.

## 11. Cutover failure history
9A shadow comparison found real differences. 9B.1 comparator was methodologically flawed and replaced; 9B.2–9B.5 root fixes closed gaps. 9C.4 cutover then revealed 26 overlap pages. During the correction, full-math threshold was softened and masked HEADER_POSITION; CI caught it, fixed root and restored fixed threshold. 9C.4/9C.5 CI was blind to live engine selection. 9D.1 adds unified flag; ensure all parity/CI gates select and assert exact engine.
Mandatory segment gates: engine path assertion; no loss/duplication; absolute geometry; typography; same PageModel for DOM/HTML/PDF; determinism; performance repeated same environment (median/P90/P95); negative tests; adjacent-feature regression; real boot→settings/assets→worker→layout→preview→export route.

## 12. Open investigation
- Read legacy-imud-flow.js 3,720 lines in chunks; trace every function/condition/constant to commit and WORKLOG.
- Read every output projector and DOM renderer route; ownership of every output field.
- Full page/item inventory cross-check parser, registry, settings, UI, exports.
- Read WORKLOG 9C/9B and S78/S77/S76/S75/S74/S73 plus older font/geometry/notes changes; map to code.
- History audit by subsystem, reverted commits and changes.
- Revalidate PR #17 FX findings; do not cherry-pick blindly.
- Confirm D-107 boot values; effect tests and conflict repair.
- Reconcile 34 pseudo-settings to controls and effect tests.
- Compare 9C.3 vs unified 9D performance (canonical/very_long; repeated; memory/time-to-first-page/export).
- Independently validate geometry; do not use reference PDF as final target.
- Audit all setting effects; compare defaults across previous versions and classify each change approved/unapproved.
- Text ID roundtrip, valid fixtures; confirm PR64 CI/route and bundles.
- No cutover/default switch until gates close.

## Sources
ENGINE_CONTRACT_9C3.md; UNIFIED_ENGINE_MIGRATION_PLAN.md; SETTINGS_AND_TEXT_IDENTIFIERS_AUDIT.md; ENGINE_RUNTIME_PATHS.md; ENGINE_DUPLICATION_REGISTER.md; WORKLOG.md (9a,9b.1–9b.5,9c.1–9c.5,9d.1); DECISIONS.md (D-91/D-96/D-97/D-98/D-100/D-107); PR #41/#44/#50/#55/#56/#60/#62/#64; legacy-imud-flow.js; imud-geometry.js; page-templates.js; settings-registry.js; legacy-settings-map.js; default_settings.json.

**This is an initial inventory, not a completed forensic audit.**
