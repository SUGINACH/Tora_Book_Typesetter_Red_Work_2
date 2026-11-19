# דוח אבחון ותיקון שורש פער הביצועים של המנוע המאוחד — 19.11.2026

> **הוראה מבוצעת:** `audits/NEXT_PERFORMANCE_OPTIMIZATION_PROMPT_2026-11-19.md`
> **ענף:** `engine/legacy-parity-preview-20261119` · **commits:** ‏0614c3e (תיקון הארנס+פרופיילר), 8d1e498 (תיקון מנוע), d841f92 (תוצאות+ארטיפקטים; מספרי SHAs לאחר rebase מעל עבודת הקטלוג המקבילה).
> **Node:** ‏v24.22.3 · **סביבה:** sandbox לינוקס, `--max-old-space-size=4200` לקורפוסים הגדולים.
> **מסגרת:** שיפור זמן תחת **פלט זהה ל-unified לפני התיקון** (הוכח בזהות ביט-לביט); יעד ה-median-unified≤legacy **טרם הושג** — מדווח בנפרד להלן.

---

## 1. ממצא מקדים מכריע — פגם בהארנס המדידה (§3.1: "שחזור baseline אמין")

שלושת כלי ה-parity (`benchmark.js`, `parity-signature.js`, וכלים נלווים) רשמו גופנים ישירות ב-`measure-api.registerFont` בלבד ⇒ **ה-fontResolver נותר ריק** ⇒ בכל הרצות הכלים מדד המנוע המאוחד מילים בנתיב ה-fallback (קירוב-טבלה, מופע MeasureAPI חדש לכל קריאה), בזמן שהמורשת מדדה במטריקות אמת — **פער מדידה מלאכותי בין המנועים באותו הרץ**, שאינו מייצג את נתיב הייצור (ה-Worker החי רושם דרך `fontResolver.registerFont` בלבד — `engine-worker-main.js:52`).

**הוכחה (ניסוי A/B, `scripts/font-reg-experiment.js`):** אותו very_long, אותן הגדרות —
| רישום | זמן unified | עמודים | layoutHash | מופעים חדשים | מטמון מחרוזות |
|---|---|---|---|---|---|
| measure-api בלבד (המצב הקודם) | 13,465ms | **992** | 33f30f2c | 670,807 | ‏6.8% hits |
| fontResolver (כמו Worker) | 12,474ms | **851** | 383fb795 | 333,456 | ‏47.0% hits |

**השלכות:**
1. מספרי ה-parity שדווחו עד כה (66/191/799/992 עמ' למאוחד) היו מנופחים ע"י ההארנס — **כמחצית מפער העמודים ב-very_long (293→152) היה ארטיפקט**. המורשת לא נפגעה (ה-resolver מסונכרן ל-measure-api עם אותם בתים; 38/54/139/552/699 נשמרו).
2. כל מדידת ביצועים קודמת של המאוחד מדדה נתיב שאינו נתיב הייצור.
3. **הטבלאות ב-`audits/parity-signature/README.md` עודכנו** (מדידה מתוקנת + היסטורית); benchmark.json‏@060695e סומן כהיסטורי.

**תיקון:** שלושת הכלים עברו ל-`fontResolver.registerFont` (commit 6545f60). מכאן ואילך כל המספרים בדוח זה הם בהארנס המתוקן.

## 2. Baseline תקף — טרום-תיקון מנוע (§3.1)

```bash
node --max-old-space-size=4200 tools/parity/benchmark.js canonical no_long mid_long long very_long \
  --runs 7 --warmups 2 --out audits/parity-signature/benchmark/2026-11-19-0614c3e-prefix/benchmark.json
```
מטא-דאטה מלאה בקובץ: command, node, commit, settingsSha256, fontsSha256, inputSha256+bytes לכל קורפוס, warmups=2, runs=7, p50/p95/mean/min/max, עמודים, זיכרון (heapUsed/maxRSS), pageDelta.

| קורפוס | מורשת p50 (עמ') | מאוחד p50 (עמ') | יחס |
|---|---|---|---|
| canonical | 8ms (38) | 119ms (37) | ×15.2 |
| no_long | 62ms (54) | 686ms (57) | ×11.1 |
| mid_long | 229ms (139) | 2,108ms (165) | ×9.2 |
| long | 664ms (552) | 10,716ms (687) | ×16.1 |
| very_long | 881ms (699) | 12,904ms (851) | ×14.6 |

כל ההרצות: סדר מתחלף legacy→unified בwarmups ובמדידות; typeset בלבד (PageModel בתוך ה-typeset; אין דפדפן/PDF במדידה — §3.2). **טענת הדוח הקודם "114,412 קריאות measureItem ב-very_long" נופתה: זהו מספרו של mid_long; very_long = 668,736.**

## 3. פרופיילר חוזר — הפרדה מפורשת בין שני המטמונים (§3.3)

כלי חדש: `tools/parity/perf-profiler.js` (תרחישים: passes/multi/keys/exports/single) + `tools/parity/cpuprofile-analyze.js`. עטיפות חיצוניות בלבד (measureItem + MeasureAPI.prototype.measureTextWidth) — **אפס שינוי קוד מנוע**; עטיפת measure-api נטענת לפני ה-pipeline (line-items מבצע destructuring בזמן ייבוא — סדר קריטי, מתועד בכלי).

**הפרדת המטמונים:**
1. **מטמון MeasuredItem הגלובלי** (`_itemMeasureCache`/`_itemCacheGet`/`_itemCacheSet`, קיבולת 65,536, ניקוי-באצווה 8,192): ‏calls/hits/misses/intra-inter-pass (hit מזוהה לפי זהות אובייקט — cache-hit מחזיר את אותה מופע קפואה), insertions, **evictions** (נגזר: לפני+הכנסות-אחרי), entries/capacity.
2. **מטמון מחרוזות MeasureAPI** (`this.cache` + `stats.calls/hits`): דלתא פר-פאס מדויקת (קריאה לפני/אחרי כל קריאה) + מופעים חדשים (freshInstances — WeakMap, ללא החזקה).

### 3.1 תוצאות passes (מאומת ב-`audits/parity-signature/benchmark/2026-11-19-0614c3e-prefix/profiler-passes.json`)

| קורפוס (פריטים) | P1 קר | P2 חם | P3 חם | P4 מנוקה | hit-rate חם | מסקנה |
|---|---|---|---|---|---|---|
| small (309) | 58.4ms | 12.5ms | 10.5ms | 14.2ms | 100% | תועלת ×4.5 בריצה חוזרת |
| canonical (5,956) | 231.5ms | 162.1ms | 106.7ms | 162.2ms | 100% | תועלת ×2.2 |
| no_long (45,849) | 993ms | 874.8ms | 741.2ms | 1,007.5ms | 100% | תועלת ×1.34 בלבד |
| mid_long (114,412) | 2,541ms | 2,876ms | 2,662ms | 2,636ms | **0%** | thrashing — המטמון אינו מניב דבר |
| long (554,424) | 14,754ms | 16,426ms | 18,933ms | 21,956ms | **0%** | thrashing + החמרה עם הצטברות |
| very_long (668,736) | 15,208ms | 15,275ms | 15,043ms | 14,958ms | **0%** | thrashing מלא |

### 3.2 השערת ה-LRU — אומתה במלואה (§3.4)

- **גדלי working-set:** ‏309 / 5,956 / 45,849 / 114,412 / 554,424 / 668,736 פריטים מול קיבולת 65,536. מעל הקיבולת — סריקה מחזורית: בחזרה לראש המסמך הערכים כבר נדחקו ⇒ **0% hits לנצח** (P2=P4 בדיוק).
- **Evictions לריצה:** very_long ‏606,208–671,744 (הכנסות שלא נקראו לעולם); mid_long ‏49,152–114,688.
- **בתוך ה-pass עצמו:** ‏0 hits בפאס ראשון בכל הגדלים — עקבי עם חוזה גבול המדידה היחיד (s4b: כל פריט נמדד פעם אחת). **המטמון אינו יכול להועיל בתוך typeset בודד — רק בין ריצות.**
- **זיהום חוצי-קורפוסים (multi):** canonical אחרי very_long — **445.7ms לעומת 272.8ms בריצה קרה נקייה (פגיעה של 63%)**: 0% hits + עלות evict. סדר ה-warmups ב-benchmark (קורפוסים קטנים לפני גדולים) מחמם את הקטנים ומשאיר את הגדולים ב-thrashing — כפי שנמדד.
- **מסקנה:** אפס-hit ב-very_long אינו מוכיח שהמטמון חסר תועלת בכל גודל (small/canonical/no_long מרוויחים ×1.3–4.5 בריצה חוזרת), אך מעל הקיבולת הוא עלות טהורה.

### 3.3 יציבות מפתחות — הוכחה מלאה (§3.5)

תרחיש keys (חישוב מפתח משוחזר — אותה נוסחה): canonical ‏**5,956/5,956** ו-no_long ‏**45,849/45,849** מפתחות זהים בין שתי ריצות זהות; same-key→same-id ‏100%; **אפס הבדלים בכל רכיבי המפתח** (payload, constraints, style, ctxConstraints, ctxKey, direction, language, id, kind). המזהים יציבים ודטרמיניסטיים; אין שדה מתנגד בין ריצות.

### 3.4 פרופיל CPU אמיתי (§3.3/§4) — before, נתיב הייצור

```bash
node --cpu-prof --cpu-prof-dir=<dir> --max-old-space-size=4200 tools/parity/perf-profiler.js single very_long --out <dir>/profiler.json
node tools/parity/cpuprofile-analyze.js <dir>/*.cpuprofile
```
very_long, ריצה בודדת, 15,059ms מדגומים (`2026-11-19-0614c3e-prefix/cpu-very_long.cpuprofile`):

| קטגוריה | self-time | הערות |
|---|---|---|
| **בניית מפתח מטמון** | **24.66%** (3,713ms) | _canonicalStringify 1,030 + אנונימיים + _itemCacheKey 476 + **פנימיות Node crypto (encode/update/Hash/digest/encodeUtf8String) ~2,260** |
| GC | 15.50% (2,334ms) | מוזן מזרם האשפה: מפתחות, באפרים, מופעים חד-פעמיים |
| measureItem (self+בניית פריט) | 11.18% | כולל ~1.2s עטיפת הפרופיילר עצמו |
| מטמון מחרוזות (מדידת אמת) | 5.98% | |
| הקפאה עמוקה | 4.78% | חוזה immutability |
| פעולות מטמון פריטים | 4.34% | get+set+evict |
| בדיקת שימור תוכן (norm) | 3.68% | pipeline.js:1044 — מיון מלא של מילות המסמך ×2 |
| שאר המנוע | 28.92% | planner/line/PageModel/decorations |

**ממצא מבני נוסף:** ‏50% מקריאות measureItem הן **glue** (רווחים; no_long: ‏22,695 glue / 23,145 text / 9 noteMarker) — ולכל פריט glue/noteMarker/atomic/fallback נוצר **מופע MeasureAPI חדש** (very_long בנתיב הייצור: 333,456 מופעים; בהארנס הישן: 670,807). מטמון המחרוזות של מופע חד-פעמי מת עם הקריאה.

**לגבי טענת הדוח הקודם (">50% במפתחות/SHA/הקפאה/GC"):** הנתון המדויק — מפתח+קריפטו 24.7% + הקפאה 4.8% + GC ‏15.5% = **45%** בקירוב (ללא עטיפת הפרופיילר); "מעל 50%" היה ניפוח, אך הכיוון נכון.

## 4. טבלת אבחון שורש (§4)

| עלות | מיקום | קריאות (very_long) | זמן | % מ-typeset | פאס ראשון/חוזר | ראיה | ודאות |
|---|---|---|---|---|---|---|---|
| בניית מפתח (קנוניזציה×4+join+SHA-256) | measure-api `_itemCacheKey` | 668,736 | ~3.7s | 24.7% | שניהם — ואינה מניבה hits בתוך ריצה | cpuprofile+profiler | גבוהה |
| הכנסות+evict חסרות תועלת (working-set>קיבולת) | measure-api מטמון פריטים | 668,736 הכנסות | ~0.65s | 4.3% | שניהם | evict=606k-672k לריצה | גבוהה |
| מופעי fallback חד-פעמיים | measure-api ‏measureItem (glue/noteMarker/atomic/fallback) | 333,456 | חלק מה-GC | — | שניהם | freshInstances | גבוהה |
| GC | זרם אשפה (מפתחות/באפרים/מופעים) | — | ~2.3s | 15.5% | שניהם | GC observer+cpuprofile | גבוהה |
| הקפאה עמוקה | measure-api `_deepFreeze` | פר פריט טרי | ~0.7s | 4.8% | נדרש לחוזה | cpuprofile | גבוהה |
| בדיקת שימור (norm) | pipeline.js:1044 | 2×~125k מילים | ~0.55s | 3.7% | שניהם | cpuprofile | גבוהה |
| מדידת אמת (מחרוזות+מטריקות) | MeasureAPI | 737,438 | ~0.9s | 6.0% | נדרש | cpuprofile | גבוהה |

**שורש:** שכבת המדידה משלמת מס קבוע לכל פריט (מפתח קנוני קריפטוגרפי + הקשר מופע חד-פעמי) שתוכנן לשימוש-חוזר בין ריצות — אך חוזה גבול המדידה מבטיח שאין שימוש-חוזר בתוך ריצה, ומעל 65,536 פריטים אין שימוש-חוזר כלל.

## 5. הפתרון שנבחר — מינימלי, מקור סמכות יחיד (§5)

שלושה שינויים מתואמים ב-**measure-api.js בלבד** (commit 8d1e498), כולם הוזלת עלות ללא שינוי מדיניות/פלט:
1. **`_fastKeyHash`** (96-bit לא-קריפטוגרפי: ‏3×32-bit FNV-1a/מיקום-מעורב/sdbm + אורך, murmur3 finalization; סף birthday ≈ 2⁻⁵⁸ ל-10⁷ מחרוזות) מחליף את sha256Hex **במפתח המטמון בתהליך בלבד**. אותם רכיבי תוכן בדיוק ובאותו סדר — הגנת ההתנגשות של PR #22 (שלמות הרכיבים) נשמרת; sha256Hex נשאר לזהויות content-addressed (גופנים/נכסים).
2. **`_canonicalStringifyStable`** — מֵימוֹ קנוני לפי זהות (WeakMap) עבור ctx.constraints (אותה הפניה לכל אורך ה-typeset).
3. **`_sharedMeasureApi`** — מופעי fallback משותפים לפי (impl|family|sizePt) = בדיוק ארגומנטי הבנאי הקודם; מנוקים ב-registerFont/clearRegisteredFonts (אותה סיבת S6.0 — מנע פרופיל-גופן מת).

**מועמדות שנבדקו ונדחו לעת עתה** (§5: "אין לבחור מראש"):
- **bypass דינמי למסמכים מעל הקיבולת** — החיסכון הפוטנציאלי הגדול (ביטול המפתח כליל: ~25%), אך דורש מדיניות אדפטיבית (ניטור miss-streak) עם פינות-בעיה לא-מבוטלות במחזור-חיי Worker (כיבוי-קבע אחרי מסמך גדול פוגע בריצות-חוזרות של מסמך קטן שבא אחריו — כיום הן מרוויחות מהמטמון מהריצה השנייה). לא הוכח בטוח בכל תרחישי המוצר ⇒ לא יושם.
- **הסרת המטמון** — נדחה: תועלת מדודה ×1.3–4.5 בריצות חוזרות של מסמכים עד ~45k פריטים (זרימת העריכה במוצר החי).
- **מפתח לפי item.id בלבד** — נדחה מטעמי PR #22 (עריכת מסמך: אותו מזהה, תוכן אחר ⇒ מדידה מיושנת).
- **דילוג על הקפאה/בדיקת שימור** — נדחה: חוזה immutability ובדיקות האמת של ה-pipeline.

**תיעוד השלכות (§5, שינוי מפתח):** המפתח הוא מטמון בתהליך בלבד — אינו נשמר בין תהליכים, אינו חוצה Worker, אינו חלק מזהות תוכן כלשהי; שינוי הפורמט (ik2→ik3) שקול לניקוי מטמון — אין השפעה על invalidation (חית הסביבה עדיין במפתח ⇒ שינוי גופנים מפריד נכון), ‏Worker lifecycle, ‏font registration או asset resolver.

## 6. תנאי קבלה — ההוכחות (§6)

1. **שקילות פלט בתוך unified לפני/אחרי — הוכחה ביט-לביט:** ‏5 קורפוסים × (מספר עמודים, layoutHash, **טביעת-אצבע עמוקה של PageModel** — גיאומטריה+שורות+מילים(x,w,text,color,token)+footnotes+sideNotes+decorations+folio+header+TOC, כימות 0.01pt, רצף פוליו מלא, דטרמיניזם כפול כולל ריצה עם מטמון מנוקה) — **זהים במלואם** (`identity-before/after.json` ב-`2026-11-19-<fix>-after-fix/`; השוואה בוצעה מול stash של תיקון המנוע).
2. **דטרמיניזט:** ‏`test:determinism` ‏fdff19d8/37 ✓; ‏parity-signature ‏--determinism ‏OK/OK בכל 5 הקורפוסים (כולל very_long, בלי OOM — heap 4200).
3. **נעילות legacy:** cross-check ‏**PASS** — canonical ‏fdff19d8 (37p), very_long ‏fa1f06e2 (1216p), ‏very_long legacy-28f52 (695p). אין חידוש hash.
4. **parity-signature לפני/אחרי:** מספרי ההבדלים לא השתנו מהתיקון (הפלט זהה) — המדידה המתוקנת: ‏38/37=2,489 · 54/57=16,250 · 139/165=29,814 · 552/687=157,217 · 699/851=187,533; controls ‏9/9; ‏parity **עדיין FAIL** — המיילסטון אינו מושלם.
5. **benchmark (אותה סביבה, 7 ריצות/2 warmups):**

| קורפוס | מורשת p50 | מאוחד לפני | מאוחד אחרי | שיפור |
|---|---|---|---|---|
| canonical | 8ms | 119ms | **97ms** | **−18.5%** |
| no_long | 62ms | 686ms | **561ms** | **−18.2%** |
| mid_long | 229ms | 2,108ms | **1,885ms** | **−10.6%** |
| long | 664ms | 10,716ms | **8,776ms** | **−18.1%** |
| very_long | 881ms | 12,904ms | **10,679ms** | **−17.2%** |

המאוחד עדיין איטי ×7.6–12.8 מהמורשת — **היעד median≤legacy טרם הושג** (השאר ארכיטקטוני: מנוע פריטים immutable מול נתיב רזה; מחוץ להיקף פתרון-מינימלי-אחד).
6. **npm test מלא:** ‏EXIT=0, ‏84 סוויטות, 0 כשלים (כולל s3-cache-collision ‏13/13, s3-immutability ‏9/9, s3-font-sync ‏10/10, d108-bare-folio ‏17/17, s10-ui ‏44/44 לאחר בניית באנדלים מחדש — בדיקת D-65 תפסה את היעדר הבנייה ונפתרה בבנייה, לא בנטרול).
7. **פרופיילר אחרי (very_long):** מופעים חדשים 333,456→**1,806**; מטמון מחרוזות 47%→**92%** hits; ‏GC ‏2,334→1,750ms; ‏measureItem ‏7,899→6,189ms. ‏s13-perf (ארטיפקט בדיקה): ‏269→**290 עמ'/שנייה**.

## 7. שחזור מלא

```bash
git checkout engine/legacy-parity-preview-20261119
# baseline לפני/אחרי (הארנס המתוקן):
node --max-old-space-size=4200 tools/parity/benchmark.js canonical no_long mid_long long very_long \
  --runs 7 --warmups 2 --out <file>
# פרופיילר (הפרדת מטמונים, GC, יציבות מפתחות):
node --max-old-space-size=4200 --expose-gc tools/parity/perf-profiler.js passes small canonical no_long mid_long long very_long --out <file>
node --max-old-space-size=4200 --expose-gc tools/parity/perf-profiler.js multi --out <file>
node --max-old-space-size=4200 --expose-gc tools/parity/perf-profiler.js keys canonical no_long --out <file>
# פרופיל CPU:
node --cpu-prof --cpu-prof-dir=<dir> --max-old-space-size=4200 tools/parity/perf-profiler.js single very_long --out <file>
node tools/parity/cpuprofile-analyze.js <dir>/*.cpuprofile
# parity + controls + דטרמיניזם:
node --max-old-space-size=4200 tools/parity/parity-signature.js audits/very_long_test_text.txt --controls --determinism --out audits/parity-signature/very_long_test_text
# נעילות:
cd red-build && npm test && npm run test:determinism && cd .. && node tools/cross-check.js
```
ארטיפקטים בעץ: `audits/parity-signature/benchmark/2026-11-19-{1b7716a-baseline,0614c3e-prefix,<fix>-after-fix}/` (קבצים: benchmark.json, profiler-*.json, cpu-very_long.cpuprofile, identity-before/after.json; ‏~720KB סה"כ).

## 8. פתוחים לסשן הבא

1. **השאר הארכיטקטוני** (×7.6–12.8): מנוע הפריטים ה-immutable מול הנתיב הרזה של המורשת — דורש הכרעות עיצוב (לא פתרון-מינימלי): הצעת המשך טבעית — הזלת בניית המפתח גם עבור ה-payload (חישוב אינקרמנטלי בלי מחרוזת משורשרת), ובחינת bypass מבוקל עם חימום-מחדש מוגדר היטב.
2. **norm (בדיקת שימור, 3.7%):** מיון מלא ×2 של מילות המסמך — מועמד להוזלה (multiset בספירה) — שינוי ב-pipeline, דורש בדיקה שקילות נפרדת.
3. **layout-audit/full-math-audit ב-CI** עדיין נכשלים בענף (HEADER_POSITION עמ' 7 — בעיית מנוע אמיתית קיימת, לא קשורה לתיקון זה).
4. **השלמת D-108 מעל 999 במורשת** (מסמך 1000+ עמודים) — בדיקה משלימה מתועדת.
