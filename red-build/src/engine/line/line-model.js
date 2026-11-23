// src/engine/line/line-model.js — LineModel קנוני: הרכבה, justify חד-פעמי, שחזור (שלב 4)
'use strict';

/**
 * **חוזה:** spec/00 §4.1-10 — "לשמור לכל שורה: ordered fragments, source mapping,
 * measured advances, glue allocation, baseline metrics, break reason, line
 * constraints ו-diagnostics." §4.1-11 — "חלוקת הרווחים/המתיחה במנגנון שורות
 * אחד בלבד... אין למתוח מחדש ב-renderer."
 *
 * **כניסה יחידה:** layoutSequence(sequence, opts) — מקבל רצף מ-buildLineSequences
 * ומחזיר LineModel[]. ה-DP עצמו חי ב-kp-linebreak (המנוע הקיים, מורחב); כאן
 * ההרכבה, אילוצי האזור (wrap-around), תמונות ממורכזות, הקצאת glue חד-פעמית
 * ושחזור המקור.
 *
 * **תמונות צפות (§3.3 בהוראה — תיקון ספירה כפולה):** תמונת float אינה תיבה
 * בזרם השורה. היא מוצאת מהזרימה לפני השבירה, משתתפת דרך אילוץ האזור בלבד
 * (הרוחב האפקטיבי של השורות שבגובהה קטן ברוחב התמונה), וזהותה, ממדיה,
 * עוגנה וצדה נשמרים ב-LineModel (floatAreas) ובתוצאת הרצף (floats) — לא
 * בחריג renderer. מיקום צף סופי בעמוד שייך ל-Planner (שלב 5), אך כבר כאן
 * אין מדידת רוחב כפולה.
 */

const { breakItemSequence, glueWidths, STRETCH_RATIO, SHRINK_RATIO } = require('../typography/kp-linebreak');

/** גרסת חוזה מודל השורה. */
const LINE_MODEL_VERSION = 'line-model-v2(floats+justify-policy+gap-chars)';

/**
 * מדיניות יישור מופקת מהגדרות המסמך — מקור יחיד להחלטה (§3.7 בהוראה).
 * **ברירת המחדל האפקטיבית של המוצר (נבדקה ב-main):** גוף מיושר —
 * `text-align:justify; text-justify:inter-word` ב-DOM (החלטת 03.11(ד), "טורים
 * מיושרים באופן מושלם") ו־'justify' לכל שורה שאינה אחרונה במקרן ה-PDF
 * (`lastAlignOf`). השורה האחרונה לפי `body-last-line-align` (ברירת מחדל
 * center — בלי מתיחה). המנוע מקבל את המדיניות **במפורש מהגדרות המסמך** —
 * אין הנחת ragged; ההקצאה נעשית פעם אחת כאן וה-renderer צורך ואינו מותח.
 */
/** **RC-A2 (i006 — חוזה שבירת השורות של המקור):** פרופיל IMUD (הייחוס) שובר
 *  שורות במילוי גרידי מקסימלי — breakPara של המקור (§660). ה-DP האופטימלי
 *  (ברירת המחדל של RED — REQ-LB-02/03) נותר למסמכי ברירת המחדל. מדיניות אחת
 *  לכל מסמך, מאותו מקור הגדרות — לא ענף לפי עמוד/טקסט. */
function breakPolicyOf(settings) {
  const s = settings || {};
  const isImud = s['_layout-profile'] === 'imud' || s._imudRaw != null;
  return isImud ? 'greedy' : 'optimal';
}

function justifyPolicyOf(settings) {
  const s = settings || {};
  const last = String(s['body-last-line-align'] || 'center');
  return {
    body: 'stretch',
    lastLine: last === 'stretch' ? 'stretch' : last,
    source: 'effective-product-default (03.11(ד) justify + body-last-line-align)'
  };
}

/**
 * layoutSequence — הכניסה היחידה של מנוע השורות המאוחד.
 * @param {{blockId, blockKind, semantic, items:Array}} sequence — מ-buildLineSequences
 * @param {{maxWidthPx:number, justify?:'ragged'|'stretch', settings?:object, runts?:number, raggedEnd?:boolean, lineHeightPx?:number}} opts
 *   justify: דורס מפורש; settings: מקור המדיניות הקנוני; ללא שניהם — ברירת
 *   המחדל האפקטיבית של המוצר (justify).
 * @returns {{ok, lines:LineModel[], diagnostics, blockId, blockKind, semantic, floats, stats}}
 */
function layoutSequence(sequence, opts = {}) {
  const maxWidthPx = Number(opts.maxWidthPx);
  if (!sequence || !Array.isArray(sequence.items) || !sequence.items.length) {
    return { ok: false, lines: [], diagnostics: [{ code: 'empty-sequence', message: 'layoutSequence: רצף ריק' }], blockId: sequence && sequence.blockId, blockKind: sequence && sequence.blockKind, semantic: sequence && sequence.semantic, floats: [], stats: { lines: 0 } };
  }
  if (!Number.isFinite(maxWidthPx) || maxWidthPx <= 0) {
    return { ok: false, lines: [], diagnostics: [{ code: 'bad-max-width', message: `layoutSequence: רוחב שורה שגוי (${maxWidthPx})` }], blockId: sequence.blockId, blockKind: sequence.blockKind, semantic: sequence.semantic, floats: [], stats: { lines: 0 } };
  }
  const diagnostics = [];
  const items = sequence.items;
  // **Iteration-003 (מילת-חלון):** חד-פעמי לכל הרצף — מקטע הזרימה הראשון
  // בלבד; windowMark נצבר לסימון השורות לאחר ההרכבה.
  let windowDone = false;
  let windowMark = null;
  let windowPreLines = 0; // כמות שורות החלון שהורכבו מראש (גרידי)

  // ── מדיניות יישור (§3.7): מפורש מ-opts.justify, או מופק מהגדרות המסמך,
  //    או ברירת המחדל האפקטיבית של המוצר. לעולם לא הנחת ragged שקטה.
  const policy = opts.justify != null
    ? { body: opts.justify === 'stretch' ? 'stretch' : 'ragged', lastLine: opts.justify === 'stretch' ? 'stretch' : 'ragged', source: 'opts.justify (מפורש)' }
    : justifyPolicyOf(opts.settings);

  // ── תמונות בלוק/ממורכזות (§4.1-7): פריט פריסה בפני עצמו — לפי כלל הפריסה
  // שבאילוצי הפריט, לא הזזה על ידי renderer אחרי השבירה. תמונת inline נשארת
  // בזרימה; תמונת float מוצאת לאילוץ האזור (להלן).
  const centeredIdx = new Set();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind !== 'image' || !it.constraints) continue;
    const p = String(it.constraints.participates || 'inline');
    if (p === 'block' || p === 'centered') centeredIdx.add(i);
  }
  // פיצול הרצף למקטעים: [זרימה][תמונה ממורכזת][זרימה]... — כל מקטע זרימה נשבר
  // ב-DP; תמונה ממורכזת = LineModel בפני עצמה. סדר המקור נשמר בדיוק.
  const segments = [];
  let flow = [];
  for (let i = 0; i < items.length; i++) {
    if (centeredIdx.has(i)) {
      if (flow.length) segments.push({ type: 'flow', items: flow });
      segments.push({ type: 'centered-image', item: items[i], index: i });
      flow = [];
    } else {
      flow.push(items[i]);
    }
  }
  if (flow.length) segments.push({ type: 'flow', items: flow });

  const lines = [];
  const floats = [];
  for (const seg of segments) {
    if (seg.type === 'centered-image') {
      lines.push(centeredImageLine(seg.item, maxWidthPx, sequence));
      continue;
    }
    // ── תמונות צפות (§3.3): חילוץ מהזרימה לפני השבירה — התמונה משתתפת
    // באילוץ האזור בלבד; רוחבה אינו נספר שוב בתוך רוחב השורה.
    const ex = extractFloats(seg.items);
    for (const f of ex.floats) floats.push(f);
    if (!ex.kept.length) continue;
    // **Iteration-003 (legacy parity — מילת-חלון):** בפרופיל IMUD המילה
    // הראשונה של הפסקה מוצאת מהזרימה (כמו createDropWord/window של
    // המקור) ושתי השורות הראשונות נשברות ברוחב מוקטן (limitOf של המורשת).
    // החילוץ: רצף התיבות המוביל המחובר ב-glue פנימי (מילה אחת) + השמטת
    // ה-glue החיצוני שאחריו.
    if (opts.window && !windowDone && ex.kept.length && ex.kept[0].role === 'box') {
      let wEnd = 1;
      while (wEnd + 1 < ex.kept.length && ex.kept[wEnd].role === 'glue' && ex.kept[wEnd].internal && ex.kept[wEnd + 1].role === 'box') wEnd += 2;
      const winBoxes = ex.kept.slice(0, wEnd);
      const winText = winBoxes.map(b => (b.fragments || []).map(f => f.text).join('')).join('');
      let after = wEnd;
      if (ex.kept[after] && ex.kept[after].role === 'glue' && !ex.kept[after].internal) after++;
      ex.kept.splice(0, after);
      windowDone = true;
      windowMark = { words: [winText], widthPx: opts.window.widthPx };
      if (!ex.kept.length) continue;
      // **Iteration-003 (מילוי גרידי כמו limitOf של המורשת):** שורות 0–1
      // ממולאות גרידית ברוחב המוקטן (colW−חלון) — לא ע"י ה-DP. ה-DP ממטב
      // את כל השורות יחד ובפסקאות-חלון בחר לפעמים שורת-מילה-אחת (badness 0
      // בלי glue-stretch; נמדד: 'גם' בודדת בשורה 0) — ואז fixDropWordInColumns
      // מזג אותה קדימה והשמיט את שורת החלון כולה. הגרידי של המקור ממלא עד
      // גבול הרוחב — שורות 0–1 מלאות תמיד (אותה אריתמטיקה של limitOf).
      const narrowW = Math.max(40, maxWidthPx - opts.window.widthPx);
      const winWrap = { widthAt: (li) => (li < 2 ? narrowW : maxWidthPx) };
      let fillFrom = 0;
      let preCount = 0;
      for (let wLine = 0; wLine < 2; wLine++) {
        let wAcc = 0, lastBox = -1;
        for (let j = fillFrom; j < ex.kept.length; j++) {
          const it = ex.kept[j];
          const add = it.role === 'box' ? it.measuredAdvance : glueWidths(it).width;
          if (lastBox >= fillFrom && wAcc + add > narrowW - 0.75) break;
          wAcc += add;
          if (it.role === 'box') lastBox = j;
        }
        if (lastBox < fillFrom) break;
        const cut = { from: fillFrom, to: lastBox + 1, badness: 0, reason: 'window-greedy' };
        const lm = assembleLine(ex.kept, cut, maxWidthPx, winWrap, opts, policy, sequence, wLine, ex.floats);
        if (lm) { lines.push(lm); preCount++; }
        fillFrom = lastBox + 1;
        while (fillFrom < ex.kept.length && ex.kept[fillFrom].role === 'glue' && !ex.kept[fillFrom].internal) fillFrom++;
      }
      windowPreLines = preCount;
      if (fillFrom >= ex.kept.length) continue;
      ex.kept.splice(0, fillFrom);
    }
    // **Iteration-003:** אילוץ החלון משולב במנגנון האילוץ הפר-שורה של הצפות
    // (מינימום פר-שורה) — מקור אחד לאילוץ רוחב בשבירה ובהרכבה.
    const floatWrap = wrapConstraintOf(ex.floats, maxWidthPx, opts);
    // **Iteration-003:** אילוץ החלון חל רק כששורות החלון לא הורכבו כבר
    // בגרידי (windowPreLines) — השארית נשברת ברוחב מלא.
    const windowWrap = opts.window && !windowPreLines ? {
      widthAt: (li) => (li < 2 ? Math.max(40, maxWidthPx - opts.window.widthPx) : maxWidthPx)
    } : null;
    const wrap = floatWrap && windowWrap
      ? { widthAt: (li) => Math.min(floatWrap.widthAt(li), windowWrap.widthAt(li)) }
      : (floatWrap || windowWrap);
const res = breakItemSequence(ex.kept, maxWidthPx, {
      runts: opts.runts,
      raggedEnd: opts.raggedEnd,
      lineWidthAt: wrap ? (li) => wrap.widthAt(li) : null,
      policy: breakPolicyOf(opts.settings) // **RC-A2:** גרידי לפרופיל המקור (IMUD), KP לברירת המחדל
    });
    for (const d of res.diagnostics) diagnostics.push(d);
    let lineIdxInSeg = 0;
    for (const cut of res.lines) {
      const lm = assembleLine(ex.kept, cut, maxWidthPx, wrap, opts, policy, sequence, lineIdxInSeg, ex.floats);
      if (lm) { lines.push(lm); lineIdxInSeg++; }
    }
  }
  // אינדוקס רץ + isLast + סמנטיקה (§21: הרווח התחתון של כותרת 3 שייך לפריט כולו)
  for (let i = 0; i < lines.length; i++) {
    lines[i].index = i;
    lines[i].isLast = i === lines.length - 1;
    // **Iteration-003 (מילת-חלון):** שורה 0 נושאת את מילות החלון ורוחבן;
    // שורות 0–1 מסומנות window (נמדדו ברוחב מוקטן — הרינדרר מזיז את תיבת
    // השורה מעבר לחלון, כמו line--window-wrap ב-DOM וכמו limitOf במורשת).
    // **RC-2b (i004):** windowW חייב להישאר גם על שורה 1 — ההקרנה
    // (materialize: winShift) וה-DOM (line--window-wrap) בודקים
    // Number.isFinite(ln.windowW); בלי זה נמדדה שורה 1 ברוחב מוקטן
    // אך הוצגה מיושבת לרוחב מלא — רווחים של ~20pt (נמדד p43/p46) במקום
    // ~5pt, והרכב מילים צר מהייחוס.
    if (windowMark) {
      if (i < 2) { lines[i].window = true; lines[i].windowW = windowMark.widthPx; }
      if (i === 0) lines[i].windowWords = windowMark.words;
    }
    if (sequence.semantic && sequence.semantic.kind === 'heading3') {
      lines[i].semantic = {
        kind: 'heading3', itemId: sequence.semantic.itemId,
        linePitchPx: sequence.semantic.linePitchPx,
        bandPx: lines[i].isLast ? sequence.semantic.lastBandPx : sequence.semantic.linePitchPx,
        trailingSpacePx: lines[i].isLast ? sequence.semantic.trailingSpacePx : 0,
        rule: sequence.semantic.rule
      };
    }
  }
  return {
    ok: true, lines, diagnostics,
    blockId: sequence.blockId, blockKind: sequence.blockKind, semantic: sequence.semantic || null,
    floats,
    stats: { lines: lines.length, floats: floats.length, modelVersion: LINE_MODEL_VERSION }
  };
}

// ─── הרכבת שורה אחת ─────────────────────────────────────────────────────────

function assembleLine(items, cut, maxWidthPx, wrap, opts, policy, sequence, lineIdxInSeg, segFloats) {
  // הגלישה מעל glue פותח (שבירת השורה): הקטע מתחיל בתיבה הראשונה — ה-glue של
  // השבירה שייך למרווח הבין-שורות ואינו חלק מרוחב השורה (הוא נשמר ב-flow הקודם
  // כ-breakGlue לשחזור המקור — בלי ספירה כפולה).
  let from = cut.from;
  while (from < cut.to && items[from].role === 'glue' && !items[from].internal) from++;
  const seg = items.slice(from, cut.to);
  const boxes = seg.filter((x) => x.role === 'box');
  if (!boxes.length) return null; // אין שורות ריקות — תוצר לוואי אסור (§19)
  const effMax = wrap ? wrap.widthAt(lineIdxInSeg) : maxWidthPx;
  const isLastLine = cut.reason === 'final' || cut.reason === 'overflow-final';
  // עמודת השדה של המקור: סדר הפריטים והמפרידים כפי שנוצרו — לשחזור מדויק ולמיפוי מקור לכל פרגמנט
  const flow = seg.map((it) => it.role === 'glue'
    ? { type: 'glue', itemId: it.itemId, sep: it.sep != null ? it.sep : ' ', gapChars: it.gapChars != null ? it.gapChars : (it.sep != null ? it.sep : ' '), internal: !!it.internal, noteRef: it.noteRef || null }
    : { type: 'box', itemId: it.itemId, kind: it.kind });
  // ה-glue שעל נקודת החיתוך שייך למקור בין שתי השורות — נשמר בעמודת השדה לשחזור מדויק
  // (שימור מקור §22), מסומן breakGlue ואינו נכנס לרוחב השורה או להקצאת ה-glue.
  const atCut = items[cut.to];
  if (atCut && atCut.role === 'glue' && !atCut.internal) {
    flow.push({ type: 'glue', itemId: atCut.itemId, sep: atCut.sep != null ? atCut.sep : ' ', gapChars: atCut.gapChars != null ? atCut.gapChars : (atCut.sep != null ? atCut.sep : ' '), internal: false, breakGlue: true });
  }

  // פרגמנטים מסודרים עם זהות ומקור (§4.1-10)
  const fragments = [];
  for (const it of seg) {
    if (it.role !== 'box') continue;
    fragments.push({
      itemId: it.itemId,
      sourceItemId: it.sourceItemId,
      kind: it.kind,
      fontId: it.fontId,
      fragments: (it.fragments || []).map((f) => ({ ...f })),
      measuredAdvance: it.measuredAdvance,
      inkBounds: it.inkBounds,
      constraints: it.constraints,
      sourceRange: it.sourceRange || null,
      sourceAnchor: it.sourceAnchor || null,
      overlay: it.overlay || null, // §7: שכבת סגנון המילה (סוגריים/סגנון inline) — לגזירת spans
      ...(it.sourceText != null ? { sourceText: it.sourceText } : {}), // תמונות/אטומים — טקסט המקור (תצוגת המוצר)
      diagnostics: it.diagnostics || []
    });
  }

  // גאומטריית בסיס: מקסימום ascent/descent וגובה מהמדידות (לא חישוב מחדש)
  let ascent = 0, descent = 0, height = 0;
  for (const b of boxes) {
    const m = b.measured;
    if (m && m.ok) {
      ascent = Math.max(ascent, m.ascent || 0);
      descent = Math.max(descent, m.descent || 0);
      height = Math.max(height, m.height || 0);
    }
  }

  // הקצאת glue — פעם אחת כאן (§4.1-11): הרינדרר צורך allocationPx ואינו מותח מחדש.
  // מתיחה חלה רק כשמדיניות היישור stretch ואין זו השורה האחרונה (או שהמדיניות
  // מותחת גם אחרונה — body-last-line-align=stretch).
  const stretchThisLine = policy.body === 'stretch' && (!isLastLine || policy.lastLine === 'stretch');
  const glue = [];
  let natural = 0;
  for (const it of seg) {
    if (it.role === 'box') natural += it.measuredAdvance;
    else if (it.role === 'glue') {
      const g = it.measured && it.measured.ok ? it.measured.advance : 0;
      glue.push({
        itemId: it.itemId, sep: it.sep != null ? it.sep : ' ', gapChars: it.gapChars != null ? it.gapChars : (it.sep != null ? it.sep : ' '), internal: !!it.internal, noteRef: it.noteRef || null,
        naturalPx: g, stretchPx: g * STRETCH_RATIO, shrinkPx: g * SHRINK_RATIO,
        allocationPx: g // יתעדכן בהקצאה אם מדיניות היישור מותחת שורה זו
      });
      natural += g;
    }
  }
  const slack = effMax - natural;
  if (stretchThisLine && slack > 0 && glue.length) {
    // חלוקה דטרמיניסטית לפי משקלי מתיחה + השלמת שארית הגדולה (אין סחיפה)
    const totalStretch = glue.reduce((s, g) => s + g.stretchPx, 0);
    if (totalStretch > 0) {
      const exact = glue.map((g) => (g.stretchPx / totalStretch) * slack);
      const base = exact.map((x) => Math.floor(x));
      let rem = Math.round(slack - base.reduce((s, x) => s + x, 0));
      const order = glue.map((g, i) => i).sort((a, b) => (exact[b] - exact[a]) || (a - b));
      for (let k = 0; rem > 0 && k < order.length; k++, rem--) base[order[k]] += 1;
      for (let i = 0; i < glue.length; i++) glue[i].allocationPx = glue[i].naturalPx + base[i];
    }
  }

  // ── אזורי תמונה צפה לשורה זו (§3.3): זהות, צד, ממדים ועוגן — חלק ממודל
  // השורה והאילוצים שלה; הפרדה מפורשת בין תיבת הטקסט לאזור התמונה.
  const floatAreas = [];
  if (wrap && lineIdxInSeg < wrap.linesSpanned) {
    const f = wrap.float;
    floatAreas.push({
      itemId: f.itemId, sourceItemId: f.sourceItemId, side: f.side,
      widthPx: round3(f.widthPx), heightPx: round3(f.heightPx),
      lines: wrap.linesSpanned, anchor: f.anchor,
      sourceText: f.sourceText != null ? f.sourceText : null,
      ...(f.image && f.image.assetId != null ? { assetId: f.image.assetId } : {}),
      ...(f.image && f.image.resourcePath != null ? { resourcePath: f.image.resourcePath } : {}),
      ...(f.image && f.image.natural ? { natural: { ...f.image.natural } } : {}),
      ...(f.image && f.image.fit ? { fit: { ...f.image.fit } } : {})
    });
    // **פרוסה 2 (רוחב טקסט-המקור של צף):** ה-pipeline מטביע את המדידה החד-פעמית
    // של תחביר המקור (sourceTextWidthPx) בזמן התכנון — ההקרנה צורכת ואינה מודדת.
  }

  // **שלב 8 פרוסה 2 (§4.2 — תמונות ממדרגה ראשונה):** מלאי הנכסים של השורה —
  // לכל פריט תמונה בתיבות: זהות + הצהרה (assetId/מידות טבעיות/fit/placement
  // מהמודל דרך line-items) + רוחב מוקרן. ה-PageModel ייצרך את זה כמו שהוא —
  // אין למקרינים מה לחפש או לחשב מחדש. (עד כאן שדה .assets לא אויש כלל —
  // בדיקת האינטגריטי ב-page-model הייתה מתה.)
  const assets = [];
  for (const it of seg) {
    if (it.role !== 'box' || it.kind !== 'image') continue;
    assets.push({
      itemId: it.itemId,
      ...(it.image && it.image.assetId != null ? { assetId: it.image.assetId } : {}),
      ...(it.image && it.image.resourcePath != null ? { resourcePath: it.image.resourcePath } : {}),
      placement: (it.constraints && it.constraints.placement) || 'inline',
      align: (it.image && it.image.align) || null,
      advancePx: round3(it.measuredAdvance || 0),
      ...(it.image && it.image.natural ? { natural: { ...it.image.natural } } : {}),
      ...(it.image && it.image.fit ? { fit: { ...it.image.fit } } : {}),
      ...(it.image && it.image.altText != null ? { altText: it.image.altText } : {}),
      ...(it.sourceText != null ? { sourceText: it.sourceText } : {})
    });
  }
  for (const fa of floatAreas) {
    assets.push({
      itemId: fa.itemId, placement: 'float', side: fa.side,
      widthPx: fa.widthPx, heightPx: fa.heightPx, lines: fa.lines,
      ...(fa.assetId != null ? { assetId: fa.assetId } : {}),
      ...(fa.resourcePath != null ? { resourcePath: fa.resourcePath } : {}),
      ...(fa.natural ? { natural: { ...fa.natural } } : {}),
      ...(fa.fit ? { fit: { ...fa.fit } } : {}),
      ...(fa.anchor != null ? { anchor: fa.anchor } : {}),
      ...(fa.sourceText != null ? { sourceText: fa.sourceText } : {})
    });
  }

  return {
    modelVersion: LINE_MODEL_VERSION,
    index: 0, isLast: false,
    blockId: sequence.blockId,
    fragments,
    itemIds: boxes.map((b) => b.itemId),
    flow,
    naturalWidthPx: round3(natural),
    effectiveMaxWidthPx: round3(effMax),
    floatAreas,
    assets,
    glue,
    baseline: { ascentPx: round3(ascent), descentPx: round3(descent) },
    lineHeightPx: round3(height),
    breakReason: cut.reason || 'legal-cut',
    badness: cut.badness || 0,
    constraints: {
      maxWidthPx: round3(effMax),
      justify: policy.body,
      justifyLastLine: policy.lastLine,
      justifySource: policy.source
    },
    semantic: null,
    diagnostics: []
  };
}

// ─── תמונות ──────────────────────────────────────────────────────────────────

/** תמונה בלוק/ממורכזת — שורה בפני עצמה לפי כלל הפריסה שבאילוצים (§4.1-7). */
function centeredImageLine(item, maxWidthPx, sequence) {
  const m = item.measured;
  const w = m && m.ok ? m.advance : 0;
  const h = m && m.ok ? m.height : 0;
  return {
    modelVersion: LINE_MODEL_VERSION,
    index: 0, isLast: false,
    blockId: sequence.blockId,
    fragments: [{
      itemId: item.itemId, sourceItemId: item.sourceItemId, kind: 'image',
      fontId: null, fragments: [], measuredAdvance: w, inkBounds: m && m.inkBounds,
      constraints: item.constraints, sourceRange: item.sourceRange || null, sourceAnchor: null,
      sourceText: item.sourceText != null ? item.sourceText : null, // §22: טקסט המקור — תצוגה/חשבונאות עד שלב 8
      diagnostics: []
    }],
    itemIds: [item.itemId],
    naturalWidthPx: round3(w),
    effectiveMaxWidthPx: round3(maxWidthPx),
    floatAreas: [],
    // **שלב 8 פרוסה 2 (§4.2):** תמונת הבלוק/הממורכזת מוצהרת גם כאן — המלאי
    // של השורה נושא זהות נכס, מידות טבעיות, fit ומדיניות פריסה מהמודל.
    assets: [{
      itemId: item.itemId,
      ...(item.image && item.image.assetId != null ? { assetId: item.image.assetId } : {}),
      ...(item.image && item.image.resourcePath != null ? { resourcePath: item.image.resourcePath } : {}),
      placement: (item.constraints && item.constraints.placement) || 'centered',
      align: (item.image && item.image.align) || null,
      advancePx: round3(w),
      ...(item.image && item.image.natural ? { natural: { ...item.image.natural } } : {}),
      ...(item.image && item.image.fit ? { fit: { ...item.image.fit } } : {}),
      ...(item.image && item.image.altText != null ? { altText: item.image.altText } : {}),
      ...(item.sourceText != null ? { sourceText: item.sourceText } : {})
    }],
    glue: [],
    baseline: { ascentPx: round3(h), descentPx: 0 },
    lineHeightPx: round3(h),
    breakReason: 'image-block',
    badness: 0,
    constraints: { maxWidthPx: round3(maxWidthPx), align: (item.constraints && item.constraints.align) || 'center', placement: 'block' },
    semantic: null,
    diagnostics: []
  };
}

/**
 * חילוץ תמונות float מזרימת הטקסט (§3.3 — תיקון ספירה כפולה):
 * התמונה משתתפת באילוץ האזור ובחישוב רוחב הטקסט, ואינה נספרת שוב כתיבה
 * בתוך רוחב השורה. זהות התמונה, המיקום הסמנטי (עוגן שכן), הממדים והצד
 * נשמרים ומוחזרים — המיקום הצף הסופי בעמוד שייך ל-Planner (שלב 5).
 */
function extractFloats(items) {
  const floats = [];
  const kept = [];
  let lastKeptBox = null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.role === 'box' && it.kind === 'image' && it.constraints
      && (it.constraints.wrap === 'start' || it.constraints.wrap === 'end')
      && String(it.constraints.participates || 'inline') === 'inline') {
      let nextBox = null;
      for (let k = i + 1; k < items.length && !nextBox; k++) {
        if (items[k].role === 'box') nextBox = items[k];
      }
      floats.push({
        itemId: it.itemId, sourceItemId: it.sourceItemId, kind: 'image',
        side: it.constraints.wrap,
        widthPx: it.measuredAdvance,
        heightPx: (it.measured && it.measured.ok && it.measured.height) || 0,
        inkBounds: it.inkBounds, constraints: it.constraints,
        sourceRange: it.sourceRange || null,
        sourceText: it.sourceText != null ? it.sourceText : null, // §22: טקסט המקור — לתצוגה/חשבונאות עד שלב 8
        // **שלב 8 פרוסה 2 (§4.2):** הצהרת התמונה עולה גם לצף — assetId/מידות
        // טבעיות/fit מהפריט; ה-LineModel אוסף אותה ל-assets (רשומה אחת לצף).
        image: it.image || null,
        anchor: {
          prevItemId: lastKeptBox ? lastKeptBox.itemId : null,
          nextItemId: nextBox ? nextBox.itemId : null
        }
      });
      continue; // התמונה אינה ממשיכה בזרימת הטקסט — היא אילוץ אזור בלבד
    }
    kept.push(it);
    if (it.role === 'box') lastKeptBox = it;
  }
  return { floats, kept };
}

/**
 * אילוץ אזור לתמונות הצפות של מקטע: הצפה הראשונה קובעת את הרוחב לשורות
 * 0..K-1 כאשר K = ceil(displayH / lineHeight). דטרמיניסטי, מנוסח פעם אחת;
 * אילוץ הזרימה בלבד — אין מנגנון שבירה שני. צדדים שונים (start/end) אינם
 * משנים את הפחתת הרוחב (אותו אזור מוקטן); הצד נשמר בזהות ה-float לתכנון.
 */
function wrapConstraintOf(floats, maxWidthPx, opts) {
  if (!floats.length) return null;
  const f = floats[0];
  const imgH = f.heightPx || 0;
  const lineH = Number(opts.lineHeightPx) > 0 ? Number(opts.lineHeightPx) : (imgH || 1);
  const linesSpanned = Math.max(1, Math.ceil(imgH / lineH));
  const reduced = Math.max(0, maxWidthPx - (f.widthPx || 0));
  return {
    float: f, linesSpanned,
    widthAt: (li) => (li < linesSpanned ? reduced : maxWidthPx)
  };
}

// ─── שחזור מקור (§22: אין אובדן/כפילות/שינוי סדר) ───────────────────────────

/** שחזור טקסט הרצף מתוך השורות — לפי עמודת השדה (flow):
 * סדר הפריטים והמפרידים המדויקים (gapChars — המקור עצמו; sep ליחידות צמודות
 * מוצג כרווח ההצמדה) משחזרים את המקור מוות אובדן, כפילות או שינוי סדר. */
function reconstructTextOfLines(lines) {
  let out = '';
  const textOf = (ln, itemId) => {
    const f = ln.fragments.find((x) => x.itemId === itemId);
    if (!f) return null;
    if (f.kind === 'text' || f.kind === 'noteMarker' || f.kind === 'atomicToken') {
      return (f.fragments || []).map((x) => x.text).join('');
    }
    return ''; // תמונה/עוגן — אינם טקסט; זהותם נשמרת בפרגמנט
  };
  for (const ln of lines) {
    for (const step of (ln.flow || [])) {
      if (step.type === 'glue') out += step.gapChars != null ? step.gapChars : step.sep;
      else out += (textOf(ln, step.itemId) || '');
    }
  }
  return out;
}

function round3(x) { return Math.round((Number(x) || 0) * 1000) / 1000; }

module.exports = { layoutSequence, reconstructTextOfLines, justifyPolicyOf, LINE_MODEL_VERSION };
