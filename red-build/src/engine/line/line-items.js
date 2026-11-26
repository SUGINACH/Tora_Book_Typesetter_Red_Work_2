// src/engine/line/line-items.js — LineItem contract קנוני + בנאי הרצף (שלב 4, §4.1-1..3)
'use strict';

/**
 * **חוזה:** spec/00 §4.1-1 — "Line Item contract אחיד: box/glue/penalty או ייצוג
 * שקול, עם קישור ל-MeasuredItem ול-source identity." §4.1-3 — "לשמר fragments
 * של מילה אחת כאשר היא כוללת כמה משפחות גופן או סגנונות. שבירה אינה רשאית
 * למזג אותם למחרוזת שטוחה."
 *
 * **שלב 4 מקטע ב׳ — גבול מדידה יחיד (הוראה §5):** הבנייה מפורקת לשלושה שלבים
 * מחייבים: (א) הכנת הרצף — פיצול מילים/ריצות/glue/penalties/תמונות ופריטים
 * אטומיים תוך שמירת מקור וזהות; (ב) **מדידה קנונית אחת** לכל פריט שורה —
 * מעבר אחד, כל תיבה נמדדת בדיוק פעם אחת דרך measureItem היחיד, והתוצאה
 * הקפואה נקשרת לפריט; (ג) הזרמה — glue/penalty לפי הצמדות, והעברה ל-LineModel
 * ול-Planner בלי מדידה נוספת. אין כאן API מדידה שני ואין מדידת פסקה-ואז-מילה:
 * measureDocumentModel (measure-model) הוא מתזמר על אותם שלבים בדיוק.
 *
 * **זהות נגזרת-מקור (§3.5 בהוראה, תיקון שורש):** מזהי מילים/רווחים נגזרים
 * מזהות פריט המקור ומטווח המקור המוחלט שלהם — `#w@<docStart>-<docEnd>` /
 * `#g@<docStart>-<docEnd>` — ולא ממונה רץ. אותו מסמך ⇒ אותם מזהים בכל בנייה;
 * שינוי תוכן באותו טווח אינו יוצר התנגשות (מפתח המדידה של שלב 3 כולל טביעת
 * payload מלאה). sourceRange ממופה לקואורדינטות המסמך הקנוניות (לא אינדקס
 * מקומי בריצה), ו-blockId ממולא תמיד כשהוא ידוע.
 *
 * **שכבת סגנון פר-מילה (הוראה §7 — סגנון אמת):** המיכל יכול לשאת `baseStyle`
 * (גודל/גובה-שורה/משפחה/פקטור משפחה — לכותרות לפי רמה, לגוף, להערות) ופונקציית
 * `wordStyleOf(docStart, docEnd)` שמחזירה שכבת-על למילה (advanceFactor לסוגריים/
 * סגנון inline). ההחלטות מגיעות מה-pipeline (בלוק-לפני-מדידה — דפוס D-42) ואין
 * כאן שום החלטת פריסה.
 *
 * **תמונות (הוראה §6):** תמונה נמדדת דרך AssetResolver (ctx.assetResolver).
 * תמונה שלא נפתרה (אין resolver/נכס) אינה נעלמת ואינה מתרחבת לאפס בשקט:
 * היא נמדדת ברוחב טקסט המקור שלה (התנהגות המוצר הקיימת — ה-syntax מוצג כטקסט)
 * עם אבחון מפורש `image-unresolved-text-fallback` — לא פלובק שקט.
 */

const { measureItem, familyWidthProfileOf } = require('../typography/measure-api');
const fontResolver = require('../typography/font-resolver');
const { splitWordsOfRun } = require('./breaks');

/** פתרון סגנון פריט — מקור יחיד (הועבר לכאן בשלב 4 מקטע ב׳ כדי לנתק תלות
 * מעגלית measure-model ⇄ line-items): מזהי גופן לפי ריצה (מה-resolver), גודל
 * לפי סוג הפריט. measure-model מייצא הלאה לצרכנים קיימים — אותה פונקציה.
 * **§7 (סגנון אמת):** כשהמיכל מביא baseStyle מפורש (כותרות לפי רמה, גוף,
 * הערות) — הוא גובר; זהו הנתיב של ה-pipeline ממקטע ב׳. */
function resolveStyleFor(item, container, base) {
  const sizePt = item.kind === 'noteMarker' ? base.fnSize : base.bodySize;
  const fontIds = [];
  if (item.kind === 'text' && item.payload && Array.isArray(item.payload.runs)) {
    for (const run of item.payload.runs) {
      const fid = fontResolver.fontIdOfAlias(run.fontFamily) || fontResolver.fontIdOfAlias(base.defaultFamily);
      fontIds.push(fid);
    }
  } else if (base.defaultFamily) {
    fontIds.push(fontResolver.fontIdOfAlias(base.defaultFamily));
  }
  return {
    sizePt,
    lineHeight: item.kind === 'noteMarker' ? 1.2 : base.lineHeight,
    fontIds,
    family: (item.payload && item.payload.runs && item.payload.runs[0] && item.payload.runs[0].fontFamily) || base.defaultFamily,
    defaultFamily: base.defaultFamily
  };
}

/** בסיס סגנון לפי הגדרות — כולל פתרון פרופיל הרוחב למשפחה שאינה רשומה (§7).
 * משמש את ה-pipeline (baseStyle לכותרות) ואת buildLineSequences (ברירת מחדל). */
function baseStyleOf(settings, kind, level) {
  const s = settings || {};
  let sizePt = Number.isFinite(s['body-font-size-pt']) ? s['body-font-size-pt'] : 12;
  let family = s['body-font'] || null;
  if (kind === 'heading' && level != null && Number.isFinite(s[`heading-${level}-size-pt`])) {
    sizePt = s[`heading-${level}-size-pt`];
    family = s[`heading-${level}-font`] || family;
  }
  const prof = familyWidthProfileOf(family, s);
  // For h4, h5, h6 use 1.45 pitch (headingItemH) instead of body line-height (1.34)
  // This matches the legacy engine and the mathematical audit expectations (S4.24).
  const headingPitch = (kind === 'heading' && level >= 4) ? 1.45
    : (Number.isFinite(s['body-line-height']) ? s['body-line-height'] : 1.34);
  return {
    sizePt,
    // **חוזה H3 (D-S2H3/CSS parity):** שורות כותרת 3 ב-line-height 1.22 של
    // ה-CSS המקורי — לא body-line-height הכללי. מקור יחיד: core/h3-contract.
    lineHeight: (kind === 'heading' && level === 3)
      ? H3_CONTRACT_LINE_HEIGHT
      : headingPitch,
    fnSize: Number.isFinite(s['f-note-body-size-pt']) ? s['f-note-body-size-pt'] : 8,
    family,
    defaultFamily: s['body-font'] || null,
    ...(prof ? { familyFactor: prof.factor, familyUnknownFloor: prof.floor } : {})
  };
}

/** גרסת חוזה פריט-השורה — חלק מזהות הרצף ומהאבחון.
 * v2: זהות נגזרת-מקור (ביטול המונה הרץ), sourceRange מוחלט + blockId,
 * מפרידים מדויקים בין פריטים (פער מקור), תיקון carry חוצה-ריצות.
 * v2.1 (מקטע ב׳): גבול מדידה יחיד — הכנה → מדידה אחת → הזרמה; baseStyle
 * ו-wordStyleOf לסגנון האמיתי; פלובק תמונה מאובחן. */
const LINE_ITEM_CONTRACT_VERSION = 'line-item-v2.1(single-measurement-boundary)';

/** קבועי כותרת 3 (חוזה H3 — core/h3-contract.js, D-S2H3/CSS parity): pitch
 * בין-שורות = line-height 1.22 של ה-CSS המקורי (גודל×96/72×1.22 — 21.96px
 * בברירת המחדל 13.5pt), הפס האחרון = pitch+ריפוד תחתון 4, הרווח שאחרי
 * ה-fragment האחרון = 4. ה-renderer אינו מוסיף ואינו מתקן. (הערכים
 * הישנים 34/38 שיקפו גובה שורה שכלל בטעות את הריפוד העליון.) */
const { H3_LINE_HEIGHT: H3_CONTRACT_LINE_HEIGHT, h3LineHeightPx, H3_BOTTOM_PAD_PX } = require('../core/h3-contract');
const H3_DEFAULT_SIZE_PT = 13.5;
const h3PitchOf = (settings) => h3LineHeightPx(
  (settings && Number.isFinite(settings['heading-3-size-pt'])) ? settings['heading-3-size-pt'] : H3_DEFAULT_SIZE_PT
);
const H3_LINE_PITCH_PX = h3LineHeightPx(H3_DEFAULT_SIZE_PT);
const H3_LAST_BAND_PX = H3_LINE_PITCH_PX + H3_BOTTOM_PAD_PX;

/**
 * בניית רצף פריטי-שורה של מסמך שלם.
 * @param {object} model — פלט buildDocumentModel
 * @param {object} ctx — { settings, assetResolver, direction, language, constraints,
 *                         instrument?:boolean }
 * @returns {{ok, sequences:[{blockId, blockKind, semantic, items}], rejected, stats, contractVersion, measureLog?}}
 */
function buildLineSequences(model, ctx = {}) {
  if (!model || !Array.isArray(model.blocks)) {
    return { ok: false, sequences: [], rejected: [{ code: 'no-model', message: 'buildLineSequences: מודל חסר' }], stats: { blocks: 0, items: 0 }, contractVersion: LINE_ITEM_CONTRACT_VERSION };
  }
  const settings = ctx.settings || {};
  const base = {
    bodySize: Number.isFinite(settings['body-font-size-pt']) ? settings['body-font-size-pt'] : 12,
    lineHeight: Number.isFinite(settings['body-line-height']) ? settings['body-line-height'] : 1.34,
    fnSize: Number.isFinite(settings['f-note-body-size-pt']) ? settings['f-note-body-size-pt'] : 8,
    defaultFamily: settings['body-font'] || null
  };
  const sequences = [];
  const rejected = [];
  let itemCount = 0;

  for (const blk of model.blocks) {
    // סמנטיקה של כותרת 3 (§21 בהוראה): פריט סמנטי אחד — הרווח התחתון שייך לכולו.
    let semantic = null;
    if (blk.kind === 'heading' && blk.level === 3) {
      const pitch3 = h3PitchOf(settings);
      semantic = {
        kind: 'heading3', itemId: blk.id,
        linePitchPx: pitch3, lastBandPx: pitch3 + H3_BOTTOM_PAD_PX,
        trailingSpacePx: H3_BOTTOM_PAD_PX,
        rule: 'bottom-space-once-after-last-fragment'
      };
    }
    const seq = buildContainerSequence(
      { ...blk, item0Kind: blk.items && blk.items[0] ? blk.items[0].kind : 'text' },
      ctx, { base, semantic }
    );
    if (seq) { sequences.push(seq); itemCount += seq.items.length; }
    for (const r of seq ? seq.rejected : []) rejected.push(r);
  }
  // גופי הערות שוברים באותו מנוע (§4.1-2: אין breaker נוסף להערות)
  // במודל שלב 2 גוף ההערה = פריט noteBody עם runs ב-payload; מוזר לכרטוס טקסט בסגנון רישום.
  const fnBase = {
    bodySize: Number.isFinite(settings['f-note-body-size-pt']) ? settings['f-note-body-size-pt'] : 8,
    lineHeight: 1.2,
    fnSize: Number.isFinite(settings['f-note-body-size-pt']) ? settings['f-note-body-size-pt'] : 8,
    defaultFamily: settings['f-note-body-font'] || settings['body-font'] || null
  };
  for (const note of (model.notes || [])) {
    const noteItems = (note.items && note.items.length)
      ? note.items
      : (note.kind === 'noteBody' && note.payload && Array.isArray(note.payload.runs) && note.payload.runs.length
        ? [{ id: `${note.id}#body`, kind: 'text', payload: { runs: note.payload.runs }, sourceRange: note.sourceRange, constraints: note.constraints }]
        : []);
    if (!noteItems.length) continue;
    const seq = buildContainerSequence(
      { id: note.id, kind: 'note', items: noteItems, item0Kind: 'text' },
      ctx, { base: fnBase, semantic: null }
    );
    if (seq) { sequences.push(seq); itemCount += seq.items.length; }
    for (const r of seq ? seq.rejected : []) rejected.push(r);
  }
  const out = {
    ok: rejected.length === 0,
    sequences, rejected,
    stats: { blocks: model.blocks.length + (model.notes || []).length, items: itemCount },
    contractVersion: LINE_ITEM_CONTRACT_VERSION
  };
  if (ctx.instrument && ctx.__measureLog) out.measureLog = ctx.__measureLog;
  return out;
}

/**
 * **מקטע ב׳ (הוראה §5/§10):** בניית רצף פריטי-שורה של מיכל יחיד — הכניסה
 * היחידה של ה-pipeline למנוע (אותו קוד שמשמש את buildLineSequences; אין מסלול
 * שני). המיכל: { id, kind, items, item0Kind?, baseStyle?, wordStyleOf?, semantic? }.
 * @returns {{blockId, blockKind, semantic, items, rejected}|null}
 */
function buildContainerSequence(cont, ctx = {}, opts = {}) {
  const settings = ctx.settings || {};
  const dir = ctx.direction || 'rtl';
  const lang = ctx.language || 'he';
  const constraints = ctx.constraints || null;
  const constraintsKey = constraints ? `w${constraints.availableWidthPx || 'auto'}` : '';
  const base = opts.base || {
    bodySize: Number.isFinite(settings['body-font-size-pt']) ? settings['body-font-size-pt'] : 12,
    lineHeight: Number.isFinite(settings['body-line-height']) ? settings['body-line-height'] : 1.34,
    fnSize: Number.isFinite(settings['f-note-body-size-pt']) ? settings['f-note-body-size-pt'] : 8,
    defaultFamily: settings['body-font'] || null
  };
  const blockId = cont.id;
  const env = {
    dir, lang, constraints, constraintsKey, ctx, blockId,
    base,
    baseStyle: cont.baseStyle || null,
    wordStyleOf: typeof cont.wordStyleOf === 'function' ? cont.wordStyleOf : null
  };
  const items = (cont.items || []).length ? cont.items : [];
  if (!items.length) return null;

  // ── שלב (א): הכנה — פיצול לתיבות עם זהות ומקור (בלי מדידה) ──
  const boxes = [];
  const rejected = [];
  for (const it of items) {
    if (it.kind === 'text') {
      splitTextItem(it, env, boxes, rejected);
    } else if (it.kind === 'noteMarker' || it.kind === 'image' || it.kind === 'atomicToken' || it.kind === 'anchor' || it.kind === 'glue' || it.kind === 'penalty' || (it.kind && (it.kind === 'custom' || it.kind.startsWith('custom:')))) {
      boxes.push({ source: it, word: null, joinedToPrev: false });
    } else {
      rejected.push({ itemId: it.id, kind: it.kind, code: 'unsupported-in-line-sequence', message: `פריט לא נתמך ברצף שורות: ${it.kind}` });
    }
  }

  // ── שלב (ב): מדידה קנונית אחת — כל תיבה נמדדת בדיוק פעם אחת ──
  for (const b of boxes) {
    b._item = boxItemFor(b, env); // מודד דרך measureItem היחיד ומקפיא את הקישור
  }

  // ── שלב (ג): הזרמה — צמידות (לפי המדידות) ואז glue/penalty ──
  applyMarkerJoins(boxes, env);
  const out = [];
  let prev = null;
  for (const b of boxes) {
    if (prev && !b.joinedToPrev) {
      out.push(glueItemFor(prev, b, env));
    } else if (prev && b.joinedToPrev) {
      out.push(internalGlueFor(prev, b, env));
      out.push({
        role: 'penalty', penaltyType: 'forbidden', cost: Number.POSITIVE_INFINITY,
        itemId: `${b.source.id}#join@${boxDocStart(b)}-${boxDocEnd(b)}`,
        kind: 'penalty', contractVersion: LINE_ITEM_CONTRACT_VERSION,
        sourceItemId: b.source.id, sourceRange: null, measured: null, measuredAdvance: 0,
        fragments: [], breakOpportunities: [], constraints: null, diagnostics: []
      });
    }
    out.push(b._item);
    prev = b;
  }
  if (!out.length) return null;
  out.push({ role: 'penalty', penaltyType: 'final', cost: 0, itemId: `${blockId}#end` });
  return {
    blockId, blockKind: cont.kind, semantic: opts.semantic || null,
    items: out, rejected
  };
}

/**
 * פיצול פריט טקסט למילים — כל מילה שומרת fragments פר-ריצה (§4.1-3).
 * **תיקון שורש (§3.5):** מילה חוצת-ריצות ממשיכה רק כשהריצה הבאה פותחת
 * בהמשך המילה עצמו (תו ראשון, בלי רווח מוביל ובלי מפריד שנצבר). ריצה
 * שפותחת ברווח — סוגרת את המילה הפתוחה עם המפריד המדויק; בעבר המילים
 * התמזגו והרווח ביניהן אבד ("אחר בסוף" ⇒ "אחרבסוף" — הפרת §22).
 */
function splitTextItem(item, env, boxes, rejected) {
  const runs = (item.payload && item.payload.runs) || [];
  if (!runs.length) { rejected.push({ itemId: item.id, kind: 'text', code: 'text-no-runs', message: 'פריט טקסט ללא ריצות' }); return; }
  // היסט מוחלט של כל ריצה בקואורדינטות המסמך הקנוניות: sourceRange של הפריט
  // = canonicalBase + הריצה הראשונה; כל ריצה מוסטת לפי sourceStart שלה עצמה.
  const run0 = runs[0];
  const itemAbsStart = item.sourceRange && Number.isFinite(item.sourceRange.start) ? item.sourceRange.start : 0;
  const runDocOffset = (ri) => itemAbsStart + (Number.isFinite(runs[ri].sourceStart) ? runs[ri].sourceStart : 0) - (Number.isFinite(run0.sourceStart) ? run0.sourceStart : 0);
  const words = []; // {fragments, sep, sepRange} — sep = המפריד אחרי המילה (מדויק)
  let carry = null;        // מילה פתוחה שנמשכת לריצה הבאה
  let pendingSep = null;   // {text, fromRun, fromStart, toRun, toEnd} — מפריד שנצבר מסוף המילה האחרונה
  const addPending = (text, ri, start, end) => {
    if (!text) return;
    if (pendingSep) { pendingSep.text += text; pendingSep.toRun = ri; pendingSep.toEnd = end; }
    else pendingSep = { text, fromRun: ri, fromStart: start, toRun: ri, toEnd: end };
  };
  const flushSepToLastWord = () => {
    if (pendingSep && words.length) {
      const w = words[words.length - 1];
      w.sep = pendingSep.text; w.sepRange = pendingSep;
      pendingSep = null;
    }
  };
  for (let ri = 0; ri < runs.length; ri++) {
    const runText = String(runs[ri].text == null ? '' : runs[ri].text);
    const parts = splitWordsOfRun(runText);
    if (!parts.length) {
      // ריצת רווחים בלבד (או ריקה): רווחים שבה נצברים למפריד — לא אובדים.
      if (runText.length) addPending(runText, ri, 0, runText.length);
      continue;
    }
    for (let pi = 0; pi < parts.length; pi++) {
      const p = parts[pi];
      // מפריד בתוך הריצה: בין חלק k לחלק k+1 עומד בדיוק ה-sepAfter של חלק k
      // (splitWordsOfRun מבטיח רצף) — אין חישוב נוסף ואין ספירה כפולה.
      // רק בפתיחת ריצה (pi===0) ייתכנו רווחים מובילים של הריצה עצמה — הם
      // נצברים למפריד שבין המילים (מצטברים עם סוף-הריצה הקודמת, בלי כפילות).
      if (pi === 0 && p.start > 0) {
        addPending(runText.slice(0, p.start), ri, 0, p.start);
      }
      if (pi === 0 && carry !== null && p.start === 0 && pendingSep === null) {
        // המשך מילה מריצה קודמת — fragment נוסף של אותה מילה (גופן שונה באמצע מילה)
        words[carry].fragments.push({
          runIndex: ri, text: p.text, start: p.start, end: p.end,
          docStart: runDocOffset(ri) + p.start, docEnd: runDocOffset(ri) + p.end,
          fontFamily: runs[ri].fontFamily || null
        });
        if (p.sepAfter != null) {
          addPending(p.sepAfter, ri, p.end, p.end + p.sepAfter.length);
          carry = null;
        }
        // p.sepAfter === null ⇒ המילה ממשיכה גם לריצה הבאה — ה-carry נשאר פתוח
        continue;
      }
      if (carry !== null) {
        // מילה פתוחה שלא הומשכה (רווח מוביל/מפריד שנצבר) — נסגרת עם המפריד שנצבר
        if (pendingSep) { words[carry].sep = pendingSep.text; words[carry].sepRange = pendingSep; pendingSep = null; }
        carry = null;
      }
      if (words.length === 0 && pendingSep) {
        // רווחים מובילים של הפריט לפני המילה הראשונה — הטוקנייזר מסיר אותם
        // (blk.source.rawLead); אין לייחס אותם כמפריד שאחרי המילה הראשונה.
        pendingSep = null;
      }
      flushSepToLastWord();
      words.push({
        fragments: [{
          runIndex: ri, text: p.text, start: p.start, end: p.end,
          docStart: runDocOffset(ri) + p.start, docEnd: runDocOffset(ri) + p.end,
          fontFamily: runs[ri].fontFamily || null
        }],
        sep: null, sepRange: null // יוקצו כשהמילה הבאה תיפתח (המפריד המדויק שנצבר)
      });
      if (p.sepAfter != null) {
        addPending(p.sepAfter, ri, p.end, p.end + p.sepAfter.length);
      } else if (pi === parts.length - 1) {
        carry = words.length - 1; // המילה נמשכת לריצה הבאה
      }
    }
  }
  // המפריד שנצבר בסוף הפריט ולא נצרך — שייך בין תיבה אחרונה לבאה אחריה (מועבר ב-trailingSep)
  for (const w of words) {
    boxes.push({ source: item, word: w, joinedToPrev: false });
  }
  if (words.length && pendingSep) {
    boxes[boxes.length - 1].trailingSep = pendingSep; // בין פריט זה לפריט הבא (רווחי סוף-ריצה)
  }
}

/** מדידה דרך measureItem היחיד — עם ספירת-הוכחה לבדיקות (גבול מדידה יחיד, §5). */
function measuredVia(item, style, env) {
  if (env.ctx && env.ctx.instrument) {
    if (!env.ctx.__measureLog) env.ctx.__measureLog = new Map();
    const k = String(item.id);
    env.ctx.__measureLog.set(k, (env.ctx.__measureLog.get(k) || 0) + 1);
  }
  return measureItem(item, style, env.ctx);
}

/** הזרמת תיבה אחת לרצף: בניית פריט-מילה קנוני + מדידה דרך measureItem היחיד.
 * הסגנון נפתר מהמיכל (baseStyle או resolveStyleFor המשותף) + שכבת-על פר-מילה. */
function boxItemFor(b, env) {
  const src = b.source;
  let style = styleForContainer(env, b);
  // שכבת-על פר-מילה (§7): סוגריים/סגנון inline — advanceFactor על הרוחב בלבד.
  if (env.wordStyleOf && b.word) {
    const f0 = b.word.fragments[0];
    const fN = b.word.fragments[b.word.fragments.length - 1];
    const ov = env.wordStyleOf(f0.docStart, fN.docEnd);
    if (ov) {
      b._overlay = ov;
      if (Number.isFinite(ov.advanceFactor) && ov.advanceFactor > 0 && ov.advanceFactor !== 1) {
        style = { ...style, advanceFactor: ov.advanceFactor };
      }
    }
  }
  if (b.word) {
    // פריט-מילה: kind 'text' עם ריצות-הפרגמנטים — נמדד כמכלול (advance = Σ פרגמנטים)
    const f0 = b.word.fragments[0];
    const fN = b.word.fragments[b.word.fragments.length - 1];
    const docStart = f0.docStart, docEnd = fN.docEnd;
    const wordItemId = `${src.id}#w@${docStart}-${docEnd}`;
    const runsPayload = b.word.fragments.map((f) => ({ text: f.text, fontFamily: f.fontFamily || (style && style.family) || undefined }));
    const measureStyle = wordStyleFor(style, b.word.fragments);
    const m = measuredVia({ id: wordItemId, kind: 'text', payload: { runs: runsPayload } }, measureStyle, env);
    const fragments = b.word.fragments.map((f, k) => ({
      itemId: wordItemId,
      runIndex: f.runIndex,
      text: f.text,
      start: f.start, end: f.end,
      docStart: f.docStart, docEnd: f.docEnd,
      fontId: (m.ok && m.segments && m.segments[k] && m.segments[k].fontId) || null,
      fontFamily: f.fontFamily || null,
      advancePx: (m.ok && m.segments && m.segments[k] && m.segments[k].advancePx) || 0
    }));
    return lineItemOf({
      role: 'box', kind: 'text', itemId: wordItemId, sourceItemId: src.id,
      fragments,
      measured: m,
      overlay: b._overlay || null,
      sourceRange: {
        blockId: env.blockId, itemId: src.id,
        runIndex: f0.runIndex,
        start: docStart, end: docEnd,
        runLocal: { start: f0.start, end: fN.end }
      },
      constraints: (src.constraints && { ...src.constraints }) || null
    });
  }
  // פריט מודל שלם (noteMarker/image/atomic/...) — תיבה בפני עצמה
  let m = measuredVia(src, style, env);
  // **תמונה שלא נפתרה (§6):** מדידת טקסט-המקור המאובחנת — התנהגות המוצר
  // הקיימת (ה-syntax מוצג כטקסט) + אבחון מפורש. אין פלובק שקט ואין אפס-רוחב.
  if (!m.ok && src.kind === 'image' && src.sourceText) {
    const fb = measuredVia(
      { id: `${src.id}#text-fallback`, kind: 'atomicToken', payload: { text: src.sourceText } },
      style, env
    );
    if (fb.ok) {
      m = {
        ...fb, kind: 'image', itemId: src.id,
        diagnostics: [...(fb.diagnostics || []), {
          code: 'image-unresolved-text-fallback',
          assetId: src.payload && src.payload.assetId,
          resourcePath: src.payload && src.payload.resourcePath,
          reason: m.code || 'asset-measure-failed',
          message: `תמונה לא נפתרה (${m.code || 'asset-measure-failed'}) — נמדדה כטקסט המקור שלה (התנהגות המוצר; אבחון מפורש, לא שקט)`
        }]
      };
    }
  }
  const sr = src.sourceRange || null;
  const itemNoteRef = (src.payload && src.payload.noteRef) || null;
  // **שלב 8 פרוסה 2 (§4.2 — תמונות פריטים ממדרגה ראשונה):** זהות הנכס וההצהרה
  // עולות מה-payload אל פריט השורה — כך שה-LineModel (וה-PageModel אחריו)
  // נושאים assetId/מידות-טבעיות/fit/placement בלי שהמקרינים יחפשו אותם מחדש.
  const imgPayload = src.kind === 'image' && src.payload ? {
    // **פרוסה 2 (תיקון שורש — זהות קנונית):** כשה-resolver פתר את הנכס,
    // הזהות היא ה-id מכתובת-התוכן (contentAssetId — מה ש-resolvedAssetIds
    // מחזיר); ה-id על בסיס הנתיב נשמר כ-declaredAssetId לעקיבות.
    assetId: src.payload.contentAssetId != null ? src.payload.contentAssetId
      : (src.payload.assetId != null ? src.payload.assetId : null),
    ...(src.payload.contentAssetId != null && src.payload.assetId != null
      ? { declaredAssetId: src.payload.assetId } : {}),
    resourcePath: src.payload.resourcePath != null ? src.payload.resourcePath : null,
    align: src.payload.align != null ? src.payload.align : null,
    widthPct: src.payload.widthPct != null ? src.payload.widthPct : null,
    natural: (src.payload.naturalWidth != null && src.payload.naturalHeight != null)
      ? { w: src.payload.naturalWidth, h: src.payload.naturalHeight,
          ...(src.payload.aspectRatio != null ? { aspectRatio: src.payload.aspectRatio } : {}) }
      : null,
    fit: src.payload.fit != null ? { ...src.payload.fit } : null,
    altText: src.payload.altText != null ? src.payload.altText : null
  } : null;
  return lineItemOf({
    role: 'box', kind: src.kind, itemId: src.id, sourceItemId: src.id,
    fragments: (m.ok && m.segments ? m.segments.map((s) => ({ itemId: src.id, runIndex: 0, text: s.text, start: 0, end: String(s.text || '').length, docStart: sr ? sr.start : null, docEnd: sr ? sr.end : null, fontId: s.fontId, fontFamily: s.family || null, advancePx: s.advancePx })) : []),
    measured: m,
    overlay: b._overlay || null,
    sourceText: src.sourceText != null ? src.sourceText : null, // תמונות/אטומים — טקסט המקור לתצוגת המוצר
    image: imgPayload, // **§4.2:** ההצהרה המלאה של התמונה — מהמודל, בלי חישוב במקרינים
    sourceRange: { blockId: env.blockId, itemId: src.id, runIndex: 0, start: sr ? sr.start : null, end: sr ? sr.end : null },
    sourceAnchor: itemNoteRef,
    noteRef: itemNoteRef,
    constraints: (src.constraints && { ...src.constraints }) || null,
    atomic: src.kind !== 'text' // כל פריט שאינו מילת-טקסט — אטום ברצף (§4.1-5)
  });
}

/**
 * המפריד המדויק בין שתי תיבות עוקבות (§3.1/§22 — שחזור מלא של המקור):
 * (א) שתי מילים מאותו פריט טקסט — ה-sep שנצבר בפיצול (מחרוזת מדויקת, כולל
 *     רווחים מרובים וריצות-רווח שלמות שביניהן).
 * (ב) תיבות מפריטים שונים — רווחי סוף-הפריט שנצברו + הפער המוחלט במקור
 *     (nextStart − prevEnd ברווחים; תחביר סמנים שייך לטווח הפריט עצמו ואינו
 *     נכנס לפער). מדויק לחלוטין עבור המודל הקנוני של שלב 2.
 */
function separatorOf(prevBox, nextBox) {
  const prevSrc = prevBox.source, nextSrc = nextBox.source;
  const sameItem = prevSrc === nextSrc || (prevSrc.id != null && prevSrc.id === nextSrc.id);
  if (sameItem && prevBox.word && nextBox.word && prevBox.word.sep != null) {
    const r = prevBox.word.sepRange || { fromRun: 0, fromStart: 0, toRun: 0, toEnd: prevBox.word.sep.length };
    return { sep: prevBox.word.sep, range: r, owner: prevSrc };
  }
  // בין פריטים (או מילה-אחרונה בפריט): רווחי סוף + הפער המוחלט
  const tail = (prevBox.word && prevBox.trailingSep) ? prevBox.trailingSep.text : '';
  const prevEnd = boxDocEnd(prevBox);
  const nextStart = boxDocStart(nextBox);
  const gap = (Number.isFinite(prevEnd) && Number.isFinite(nextStart)) ? Math.max(0, nextStart - prevEnd) : 1;
  const sep = tail + ' '.repeat(gap);
  const r = (prevBox.word && prevBox.trailingSep) ? prevBox.trailingSep : { fromRun: 0, fromStart: 0, toRun: 0, toEnd: 0 };
  return {
    sep, owner: prevSrc,
    range: { fromRun: r.fromRun, fromStart: r.fromStart, toRun: r.toRun, toEnd: r.toEnd + gap },
    crossItem: !sameItem
  };
}

/** המיקום המוחלט של תחילת/סיום תיבה בקואורדינטות המסמך הקנוניות. */
function boxDocStart(b) {
  if (b.word && b.word.fragments[0]) return b.word.fragments[0].docStart;
  const sr = b.source && b.source.sourceRange;
  return sr && Number.isFinite(sr.start) ? sr.start : 0;
}
function boxDocEnd(b) {
  if (b.word) {
    const fN = b.word.fragments[b.word.fragments.length - 1];
    return fN ? fN.docEnd : 0;
  }
  const sr = b.source && b.source.sourceRange;
  return sr && Number.isFinite(sr.end) ? sr.end : 0;
}

/** היסט מוחלט של טווח מפריד (מריצות הפריט שבבעלותו). */
function sepRangeAbs(range, owner) {
  const runs = (owner.payload && owner.payload.runs) || [];
  const run0 = runs[0];
  const itemAbsStart = owner.sourceRange && Number.isFinite(owner.sourceRange.start) ? owner.sourceRange.start : 0;
  const off = (ri) => itemAbsStart + (runs[ri] && Number.isFinite(runs[ri].sourceStart) ? runs[ri].sourceStart : 0) - (run0 && Number.isFinite(run0.sourceStart) ? run0.sourceStart : 0);
  return {
    start: off(range.fromRun) + range.fromStart,
    end: off(range.toRun) + range.toEnd
  };
}

/** glue בין שתי תיבות — המפריד המקורי המדויק נשמר (sep + gapChars) לשחזור מלא.
 * **מקטע ב׳ (המדידה = הדיו):** רוחב השבירה של ה-glue הוא רוחב הצורה
 * **המרונדרת** — מרווח בודד (הרנדררים מצמצמים רצפי רווחים: white-space:normal
 * ב-DOM, gapW בודד במקרן ה-PDF; כך גם נהג הנתיב החי — split(/\s+/)). אין למדוד
 * רצף-רווחים מלא כרוחב שהדיו לעולם אינו מציג; המקור המדויק נשמר ב-gapChars
 * לשחזור ביט-לביט (§22). */
function glueItemFor(prevBox, nextBox, env) {
  const style = styleForContainer(env, prevBox);
  const { sep, range, owner } = separatorOf(prevBox, nextBox);
  const abs = sepRangeAbs(range, owner);
  const glueItemId = `${owner.id}#g@${abs.start}-${abs.end}`;
  const m = measuredVia({ id: glueItemId, kind: 'glue', payload: { text: ' ' } }, style, env);
  return lineItemOf({
    role: 'glue', kind: 'glue', itemId: glueItemId, sourceItemId: owner.id,
    sep, gapChars: sep,
    measured: m,
    sourceRange: { blockId: env.blockId, itemId: owner.id, runIndex: range.fromRun, start: abs.start, end: abs.end },
    constraints: null
  });
}

/** glue פנימי של יחידה צמודה (מקביל פנימי ל-NBSP במנוע הקיים): רוחב רווח לצורך
 * הפריסה (זהה לנתיב החי — bindMarkersToNeighbors מדביק ב-NBSP), פנימי —
 * אסור לדלג בפתיחת שורה ואסור לחתוך בו (ה-penalty האסור שאחריו מבטיח זאת).
 * הקישור מבוסס noteRef — זהות העוגן נשמרת על ה-glue לשלבי התכנון. */
function internalGlueFor(prevBox, nextBox, env) {
  const style = styleForContainer(env, prevBox);
  const { sep, range, owner } = separatorOf(prevBox, nextBox);
  const abs = sepRangeAbs(range, owner);
  const glueItemId = `${nextBox.source.id}#j@${abs.start}-${abs.end}`;
  // המדידה ברוחב רווח (כמו המנוע הקיים: NBSP מוצג ברוחב רווח)
  const m = measuredVia({ id: glueItemId, kind: 'glue', payload: { text: ' ' } }, style, env);
  const noteRef = (nextBox.source.kind === 'noteMarker' && nextBox.source.payload && nextBox.source.payload.noteRef)
    || (prevBox.source.kind === 'noteMarker' && prevBox.source.payload && prevBox.source.payload.noteRef) || null;
  return lineItemOf({
    role: 'glue', kind: 'glue', itemId: glueItemId, sourceItemId: owner.id,
    sep: '\u00A0', internal: true, gapChars: sep, noteRef,
    measured: m,
    sourceRange: { blockId: env.blockId, itemId: owner.id, runIndex: range.fromRun, start: abs.start, end: abs.end },
    constraints: null
  });
}

/** צמידת סמני הערה לעוגן — לפי הכללים התקפים (P1-3/BRZ-11), מנוסח פעם אחת.
 * הקישור מותר לפריט עם זהות עוגן (noteRef) ואילוץ bindToNeighbor — סמן
 * הערה של המודל, ו-placeholder inline מסונתז (D-30). **מקטע ב׳:** פועל
 * אחרי המדידה — הרוחבים מהמדידות הקפואות (אין מדידה כפולה). */
function applyMarkerJoins(boxes, env) {
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (!b.source) continue;
    const bindable = (b.source.kind === 'noteMarker')
      || (b.source.kind === 'atomicToken' && b.source.constraints && b.source.constraints.bindToNeighbor);
    if (!bindable) continue;
    if (!(b.source.payload && b.source.payload.noteRef)) continue; // בלי זהות עוגן — אין צמידה
    const prev = i > 0 ? boxes[i - 1] : null;
    const next = i + 1 < boxes.length ? boxes[i + 1] : null;
    if (prev && !prev.joinedToPrev && !(prev.source && (prev.source.kind === 'noteMarker' || (prev.source.kind === 'atomicToken' && prev.source.constraints && prev.source.constraints.bindToNeighbor)))) {
      if (unitFits(prev, b, env)) { b.joinedToPrev = true; continue; }
    }
    if (!prev && next) {
      if (unitFits(b, next, env)) { next.joinedToPrev = true; continue; }
    }
  }
}

/** בדיקת התאמת יחידה צמודה לרוחב — כולל רוחב הדבק הפנימי (רוחב רווח, כמו
 * ה-NBSP בנתיב החי). יחידה חורגת ⇒ הצמדה מתבטלת והטיפול עובר לערוץ
 * ה-overflow המפורש של המנוע (לא גלישה שקטה). */
function unitFits(a, b, env) {
  const maxW = env.constraints && Number.isFinite(env.constraints.availableWidthPx) ? env.constraints.availableWidthPx : null;
  const wa = advanceOf(a);
  const wb = advanceOf(b);
  if (maxW == null) return true; // אין אילוץ ידוע — הצמדה נשמרת (ההחלטה הסופית ב-KP)
  const spaceW = glueSpaceWidth(env);
  return (wa + spaceW + wb) <= maxW;
}

/** רוחב תיבה — מהמדידה הקפואה שלה (שלב ב׳; אין מדידה בזמן הצמדה). */
function advanceOf(b) {
  if (b._adv != null) return b._adv;
  const it = b._item;
  b._adv = it && it.measured && it.measured.ok ? it.measured.advance : 0;
  return b._adv;
}

/** רוחב רווח הדבק הפנימי — מדידה דרך measureItem היחיד (מטומן לפי מפתח שלב 3). */
function glueSpaceWidth(env) {
  const style = styleForContainer(env, null);
  const m = measuredVia({ id: '#join-space', kind: 'glue', payload: { text: ' ' } }, style, env);
  return m && m.ok ? m.advance : 0;
}

/** סגנון המיכל — baseStyle מפורש (הוראה §7) או resolveStyleFor המשותף. */
function styleForContainer(env, box) {
  if (env.baseStyle) {
    // סמן הערה נמדד בגודל הרישום גם כשהמיכל בסגנון אחר (חוזה שלב 3)
    if (box && box.source && box.source.kind === 'noteMarker' && env.baseStyle.fnSize != null) {
      return { ...env.baseStyle, sizePt: env.baseStyle.fnSize, lineHeight: 1.2 };
    }
    return env.baseStyle;
  }
  return resolveStyleFor((box && box.source && box.source.kind) || 'text', box && box.source ? box.source : { kind: 'text' }, {
    bodySize: env.base.bodySize, lineHeight: env.base.lineHeight,
    fnSize: env.base.fnSize, defaultFamily: env.base.defaultFamily
  });
}

/** סגנון מילה: fontIds לפי הריצות של אותה מילה בלבד. **familyOverridesRuns
 * (§7/§12):** בכותרות המוצר מודד ומציג את השורה בגופן הרמה (S4.26) — ריצות
 * inline אינן גוברות במדידה; family המקורי נשמר בפרגמנט (אין אובדן נתון). */
function wordStyleFor(style, fragments) {
  const base0 = (style && style.fontIds && style.fontIds[0]) || null;
  const ids = fragments.map((f) => {
    if (style && style.familyOverridesRuns) {
      return fontResolver.fontIdOfAlias(style.family || '') || base0;
    }
    return fontResolver.fontIdOfAlias(f.fontFamily || (style && style.family) || '') || base0;
  });
  return { ...style, fontIds: ids };
}

/** הרכבת LineItem סופי — כל שדות החוזה מולאו; הקישור ל-MeasuredItem שלם. */
function lineItemOf(base) {
  const m = base.measured;
  const ok = !!(m && m.ok);
  return {
    contractVersion: LINE_ITEM_CONTRACT_VERSION,
    role: base.role,                 // 'box' | 'glue' | 'penalty'
    kind: base.kind,                 // text/noteMarker/image/atomicToken/anchor/glue/penalty
    itemId: base.itemId,
    sourceItemId: base.sourceItemId != null ? base.sourceItemId : base.itemId,
    sourceRange: base.sourceRange || null,
    sourceAnchor: base.sourceAnchor || null,
    fontId: ok && m.segments && m.segments[0] ? (m.segments[0].fontId || null) : null,
    styleRef: base.styleRef || null,
    atomic: !!base.atomic,
    // קישור למדידה (§4.1-1): ה-MeasuredItem הקפוא עצמו + השדות שחייבים להישמר ישירות
    measured: m || null,
    measuredAdvance: ok ? m.advance : 0,
    inkBounds: ok ? m.inkBounds : null,
    breakOpportunities: ok ? m.breakOpportunities : [],
    constraints: base.constraints || null,
    diagnostics: ok ? (m.diagnostics || []) : [{ code: m && m.code, message: m && m.message, measureFailed: true }],
    // פרגמנטים (§4.1-3): מילה מרובת גופנים — לעולם לא מחרוזת שטוחה
    fragments: base.fragments || [],
    // טקסט מקור של פריט שלם (תמונה/אטום) — לתצוגת המוצר עד שלב 8
    sourceText: base.sourceText != null ? base.sourceText : null,
    // **שלב 8 פרוסה 2 (§4.2):** הצהרת התמונה (assetId/מידות/fit/placement) —
    // מועברת מהמודל לפריט השורה; ה-LineModel יאסוף אותה ל-assets של השורה.
    image: base.image || null,
    // שכבת-על של סגנון המילה (§7: סוגריים/סגנון inline) — נשמרת על הפריט
    // ומועברת לפרגמנטים של ה-LineModel (לזיהוי span-ים בגזירת התצוגה)
    overlay: base.overlay || null,
    // glue/penalty semantics
    sep: base.sep != null ? base.sep : null,
    gapChars: base.gapChars != null ? base.gapChars : null, // המפריד המקורי המדויק (לשחזור §22)
    internal: !!base.internal,
    noteRef: base.noteRef || null,   // זהות העוגן של יחידה צמודה (סמן הערה)
    penaltyType: base.penaltyType || null,
    cost: base.cost != null ? base.cost : 0
  };
}

module.exports = {
  LINE_ITEM_CONTRACT_VERSION, buildLineSequences, buildContainerSequence,
  resolveStyleFor, baseStyleOf,
  H3_LINE_PITCH_PX, H3_LAST_BAND_PX, h3PitchOf, H3_BOTTOM_PAD_PX
};
