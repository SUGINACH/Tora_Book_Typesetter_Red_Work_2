// src/engine/line/pipeline-bridge.js — הגשר המרכזי היחיד: DocumentModel → LineItems → LineModel → תצוגת שורות (שלב 4 מקטע ב׳)
'use strict';

/**
 * **מעמד (הוראת שלב 4 מקטע ב׳, §10):** זהו **גבול התאימות הזמני האחד והמרוכז**
 * מול רכיבי המורשת שטרם הומרו (dp-planner/renderers צורכים עדיין `line.words`
 * עד לשלבים 5/8). הוא נגזר **חד-כיוונית** מה-LineModel (אין בו שום החלטת
 * עימוד ואין מדידה): DocumentModel → buildContainerSequence (רצף + מדידה
 * יחידה) → layoutSequence (LineModel) → תצוגת שורות נגזרת. תנאי הסרתו מתועד
 * בשלבים 5–9 (כשה-Planner וה-renderer יצרכו LineModel ישירות).
 *
 * **מה נכנס לכאן במפורש (ולא לpipeline):**
 *  - החלטות סגנון בלבד (בלוק-לפני-מדידה, דפוס D-42): baseStyle לפי סוג בלוק
 *    (כותרות לפי רמה, גוף, הערות), שכבות-על פר-מילה (סוגריים/סגנון inline)
 *    בקואורדינטות מסמך.
 *  - סינתזת תיבות סמן תצוגה (מדיניות המספור של ה-pipeline זורמת כ-markerText
 *    על פריט הסמן של המודל — הזהות והעוגן מהמקור) ופלובק placeholder למצב
 *    inline (D-30: המפריד E000 — אותו פורמט כמו הנתיב החי).
 *  - גזירת תצוגת השורות המורשת (words/heightPx/isLast/...) מה-LineModel —
 *    **accessor טהור יחיד** (הוראה §11): כל טקסט לצורכי אבחון/כותרת/חשבונאות
 *    נגזר מכאן ואינו משמש כמקור לשבירה נוספת.
 */

const { buildContainerSequence, baseStyleOf } = require('./line-items');
const { layoutSequence } = require('./line-model');
const { MARK_TAG } = require('../notes/markers');

const ATOMIC = '\uE000';

/** טקסט שטוח של פריטי הטקסט של בלוק + מיפוי flat↔doc (חד-חד-ערכי על פני
 * ריצות הטקסט; תחביר הסמנים אינו חלק מהטקסט הקנוני — המודל כבר הסיר אותו).
 * ההחלטות ברמת הבלוק (dh, התאמת סגנונות מותאמים) ושכבות העל ברמת המילה
 * (סוגריים/סגנון inline) מחושבות על אותו טקסט — מקור אחד. */
function flatTextOf(blk) {
  let flat = '';
  const segs = []; // {flatStart, flatEnd, docStart, docEnd}
  for (const it of (blk.items || [])) {
    if (it.kind === 'text' && it.payload && Array.isArray(it.payload.runs) && it.payload.runs.length) {
      if (flat.length) flat += ' ';
      const runs = it.payload.runs;
      const base0 = it.sourceRange && Number.isFinite(it.sourceRange.start) ? it.sourceRange.start : 0;
      const r0 = Number.isFinite(runs[0].sourceStart) ? runs[0].sourceStart : 0;
      for (const r of runs) {
        const text = String(r.text == null ? '' : r.text);
        const docStart = base0 + (Number.isFinite(r.sourceStart) ? r.sourceStart : 0) - r0;
        segs.push({ flatStart: flat.length, flatEnd: flat.length + text.length, docStart, docEnd: docStart + text.length });
        flat += text;
      }
    } else if ((it.kind === 'image' || (it.kind && it.kind.startsWith('custom:'))) && it.sourceText != null) {
      // תמונות/פריטים מותאמים — טקסט המקור שלהם חלק מהחשבנאות
      // (הנתיב החי מציג אותו כמילה) ומהטקסט השטוח להתאמות סגנונות.
      if (flat.length) flat += ' ';
      const sr = it.sourceRange;
      segs.push({ flatStart: flat.length, flatEnd: flat.length + it.sourceText.length, docStart: sr && Number.isFinite(sr.start) ? sr.start : 0, docEnd: sr && Number.isFinite(sr.end) ? sr.end : it.sourceText.length });
      flat += it.sourceText;
    }
  }
  return { flat, segs };
}

/** מיפוי מיקום flat → מיקום doc (הקטע המכסה; מילים אינן חוצות קטעים). */
function flatToDoc(segs, at) {
  for (const s of segs) {
    if (at >= s.flatStart && at < s.flatEnd) return s.docStart + (at - s.flatStart);
    if (at === s.flatEnd) return s.docEnd;
  }
  return null;
}
function docToFlat(segs, at) {
  for (const s of segs) {
    if (at >= s.docStart && at < s.docEnd) return s.flatStart + (at - s.docStart);
    if (at === s.docEnd) return s.flatEnd;
  }
  return null;
}

/** **D-42 (P1-2):** קדם-פאס סוגריים עגולים על הטקסט השטוח (בלי הערות) —
 * עבר הנה מה-pipeline (אותה לוגיקה בדיוק; ה-pipeline כבר אינו מודד בעצמו). */
function parenSpansOfFlat(flat) {
  const spans = [];
  const stack = [];
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '(') stack.push(i);
    else if (flat[i] === ')') {
      if (stack.length) { spans.push({ from: stack.pop(), to: i }); }
    }
  }
  return spans;
}

/**
 * שכבות-על פר-מילה בקואורדינטות מסמך: סוגריים (parenScale) וסגנונות inline
 * מותאמים (factor לפי styleId). הסיווג זהה לנתיב החי: סוגריים — תחילת המילה
 * בתוך הטווח (strictly inside); סגנון inline — חפיפת טווח המילה. עדיפות
 * סגנון inline על פני סוגריים (הסגנון תופס ראשון — שניהם לא חופפים בפועל).
 * @returns {{wordStyleOf:(docStart:number,docEnd:number)=>({advanceFactor:number,paren?:boolean,customStyleId?:string}|null), diagnostics:Array}}
 */
function wordOverlayFactory(blk, settings, customStyles) {
  const parenScale = Number(settings['paren-style-scale']) || 1;
  const { flat, segs } = flatTextOf(blk);
  const overlays = []; // {docFrom, docTo, advanceFactor, kind:'paren'|'custom', styleId?}
  const diagnostics = [];
  if (parenScale !== 1) {
    for (const sp of parenSpansOfFlat(flat)) {
      const docFrom = flatToDoc(segs, sp.from);
      const docTo = flatToDoc(segs, sp.to);
      if (docFrom == null || docTo == null) continue;
      overlays.push({ docFrom, docTo, advanceFactor: parenScale, kind: 'paren' });
    }
  }
  if (customStyles && customStyles.length) {
    const { matchInlineStyles, inlineSizeFactor } = require('../extensions/apply-styles');
    for (const im of matchInlineStyles(flat, customStyles)) {
      for (const r of im.ranges) {
        const docFrom = flatToDoc(segs, r.from);
        const docTo = flatToDoc(segs, r.to);
        if (docFrom == null || docTo == null) continue;
        overlays.push({
          docFrom, docTo,
          advanceFactor: inlineSizeFactor(im.style.style, settings['body-font-size-pt']),
          kind: 'custom', styleId: im.styleId
        });
      }
    }
  }
  if (!overlays.length) {
    return { wordStyleOf: null, flat, diagnostics };
  }
  const wordStyleOf = (docStart, docEnd) => {
    const flatStart = docToFlat(segs, docStart);
    if (flatStart == null) return null;
    // סגנון inline — חפיפה (אותו כלל like הנתיב החי)
    for (const ov of overlays) {
      if (ov.kind !== 'custom') continue;
      if (flatStart < ovFlatTo(ov, segs) && flatStart + (docEnd - docStart) > ovFlatFrom(ov, segs)) {
        return { advanceFactor: ov.advanceFactor, customStyleId: ov.styleId };
      }
    }
    // סוגריים — תחילת המילה בתוך הטווח (strictly inside)
    for (const ov of overlays) {
      if (ov.kind !== 'paren') continue;
      if (flatStart > ovFlatFrom(ov, segs) && flatStart < ovFlatTo(ov, segs)) {
        return { advanceFactor: ov.advanceFactor, paren: true };
      }
    }
    return null;
  };
  return { wordStyleOf, flat, diagnostics };
}

function ovFlatFrom(ov, segs) { return docToFlat(segs, ov.docFrom); }
function ovFlatTo(ov, segs) { return docToFlat(segs, ov.docTo); }

/**
 * סינתזת תיבות סמן תצוגה — פריטי הסמן של המודל מקבלים את הסמן שהקצה
 * ה-pipeline (מדיניות מספור + סגנון) כ-markerText; הזהות, העוגן (noteRef)
 * וטווח המקור נשמרים מהמודל. במצב inline — הסמן הופך placeholder אטומי
 * `${marker}\uE000${text}` (D-30, אותו פורמט כמו הנתיב החי) עם תג הסמן
 * בשדה נפרד (המדידה בלי התג — כמו measureWithParen של הנתיב החי).
 * @param {object} blk — בלוק המודל
 * @param {Map<string,{marker:string,inlineText?:string}>} notesByRef — הקצאות ה-pipeline לפי noteRef
 */
function displayItemsOf(blk, notesByRef) {
  const out = [];
  for (const it of (blk.items || [])) {
    if (it.kind !== 'noteMarker') { out.push(it); continue; }
    const noteRef = it.payload && it.payload.noteRef;
    const assign = notesByRef && noteRef ? notesByRef.get(noteRef) : null;
    if (!assign) {
      // בלי הקצאה (לא אמור לקרות — ה-pipeline מקצה לכל note-ref) — הסמן הגולמי
      // של המקור, עם אבחון מפורש. לא נעלם.
      out.push({
        ...it,
        payload: { ...it.payload, markerText: (it.sourceText || '').replace(/[[\]]/g, '') },
        diagnostics: [...(it.diagnostics || []), { code: 'note-marker-unassigned', message: 'סמן הערה ללא הקצאת מדיניות — הוצג טקסט המקור הגולמי' }]
      });
      continue;
    }
    if (assign.inlineText != null) {
      // מצב inline: placeholder אטומי אחד (סמן + טקסט ההערה) — D-30/D-53
      const text = String(assign.inlineText).replace(/\uE000/g, ' ').replace(/ /g, ATOMIC);
      out.push({
        id: `${it.id}#inline`,
        kind: 'atomicToken',
        parentId: it.parentId,
        sourceRange: it.sourceRange,
        sourceText: it.sourceText,
        payload: { text: `${assign.marker}${ATOMIC}${text}`, markerTag: MARK_TAG, noteRef, delimiters: it.payload && it.payload.delimiters },
        constraints: { atomic: true, participates: 'inline', splittable: 'never', bindToNeighbor: true }
      });
      continue;
    }
    out.push({
      ...it,
      payload: { ...it.payload, markerText: assign.marker }
    });
  }
  return out;
}

/**
 * בניית הרצף ושבירתו לבלוק מודל אחד — הכניסה של ה-pipeline למנוע השורות.
 * @param {object} blk — בלוק ה-DocumentModel
 * @param {object} spec — { settings, kind, level, widthPx, lineHeightPx, runts,
 *   notesByRef?, customStyles?, semantic?, baseStyle?, measureCtx? }
 * @returns {{lines:Array, view:Array, floats:Array, diagnostics:Array, rejected:Array, sequence}}
 */
function layoutModelBlock(blk, spec) {
  const settings = spec.settings || {};
  const items = spec.items || displayItemsOf(blk, spec.notesByRef || null);
  const baseStyle = spec.baseStyle || baseStyleOf(settings, spec.kind, spec.level);
  // כותרות: המוצר מציג/מודד את כל שורת הכותרת בגופן הרמה (S4.26; line-font.js
  // lineFontFamily) — ריצות inline בכותרת אינן גוברות על גופן הרמה בתצוגה.
  // הפרגמנטים שומרים את family המקור (§7 — אין אובדן נתון); המדידה בגופן הרמה.
  if (spec.kind === 'heading') baseStyle.familyOverridesRuns = true;
  const { wordStyleOf } = spec.wordOverlay
    ? { wordStyleOf: spec.wordOverlay }
    : wordOverlayFactory(blk, settings, spec.customStyles || null);
  // סמנטיקת כותרת 3 (D-S2H3, §21/§13 בהוראה): פריט סמנטי אחד — הרווח
  // התחתון שייך לכולו ומופיע פעם אחת אחרי ה-fragment האחרון; ה-pitch נגזר
  // מהחוזה לפי גודל הכותרת בפועל (core/h3-contract — מקור יחיד).
  const { h3PitchOf, H3_BOTTOM_PAD_PX } = require('./line-items');
  const semantic = (spec.kind === 'heading' && spec.level === 3)
    ? (() => {
        const pitch3 = h3PitchOf(settings);
        return {
          kind: 'heading3', itemId: blk.id,
          linePitchPx: pitch3, lastBandPx: pitch3 + H3_BOTTOM_PAD_PX,
          trailingSpacePx: H3_BOTTOM_PAD_PX,
          rule: 'bottom-space-once-after-last-fragment'
        };
      })()
    : null;
  const sequence = buildContainerSequence(
    { id: blk.id, kind: spec.kind, items, item0Kind: items[0] ? items[0].kind : 'text', baseStyle, wordStyleOf },
    Object.assign({ settings }, spec.measureCtx || {}),
    { semantic }
  );
  if (!sequence) {
    return { lines: [], view: [], floats: [], diagnostics: [{ code: 'empty-sequence', message: `בלוק ללא פריטים: ${blk.id}` }], rejected: [], sequence: null };
  }
  const res = layoutSequence(sequence, {
    maxWidthPx: spec.widthPx,
    settings,
    runts: spec.runts,
    lineHeightPx: spec.lineHeightPx,
    // **Iteration-003 (מילת-חלון):** רוחב החלון מה-pipeline (פרופיל IMUD)
    // — השורות 0–1 נשברות ברוחב מוקטן והמילה מסומנת על שורה 0.
    ...(spec.window ? { window: spec.window } : {})
  });
  // **שלב 8 פרוסה 2 (§4.2 — מדידה אחת לטקסט-המקור של צף):** תחביר המקור של
  // תמונה צפה נספר ב-words לחשבונאות התוכן ומוצג כמילה (התנהגות המוצר עד
  // שלב 8) — אך אינו בזרימת ה-LineModel. עד כאן ההקרנה מדדה אותו מחדש
  // (נפילה); כאן הוא נמדד פעם אחת בזמן התכנון ומוטבע על ה-floatArea.
  // legacyViewOfLines עצמו נשאר accessor טהור — ההטבעה לפני הקריאה אליו.
  const mApi = spec.measureCtx && spec.measureCtx.measure;
  if (mApi && res.lines) {
    const szPt = spec.kind === 'heading' && spec.level != null
      ? (settings[`heading-${spec.level}-size-pt`] || settings['body-font-size-pt'])
      : settings['body-font-size-pt'];
    for (const ln of res.lines) {
      for (const fa of (ln.floatAreas || [])) {
        if (fa.sourceText != null && fa.sourceTextWidthPx == null) {
          fa.sourceTextWidthPx = mApi.measureTextWidth(fa.sourceText, szPt, 0);
        }
      }
    }
  }
  const diagnostics = [...(res.diagnostics || []), ...sequence.rejected];
  const view = legacyViewOfLines(res.lines, {
    kind: spec.viewKind || spec.kind, level: spec.level, blockId: blk.id
  });
  return { lines: res.lines, view, floats: res.floats || [], diagnostics, rejected: sequence.rejected, sequence };
}

/**
 * **Accessor טהור יחיד (הוראה §11):** גזירת תצוגת שורה מורשת מ-LineModel.
 * חד-כיווני, בלי מדידה ובלי החלטות עימוד: words (מהפרגמנטים; סמנים מתויגים
 * כמו הנתיב החי; יחידות צמודות ממוזגות ב-NBSP; תמונות כטקסט המקור שלהן),
 * heightPx (=lineHeightPx), widthPx, isLast, parenSpans/customSpans מהשכבות-על.
 * ה-LineModel המלא נשמר בהתייחסות (`lineModel`) — כך הוא מגיע ל-Planner
 * ולרנדרר בלי שיטוח.
 */
function legacyViewOfLines(lines, extras = {}) {
  const out = [];
  for (const ln of lines) {
    const words = [];
    const parenSpans = [];
    const customSpans = [];
    let cur = null;         // מילה נוכחית (בנייה)
    let curMeta = null;     // שכבות-על של המילה הנוכחית
    const flushWord = () => {
      if (cur === null) return;
      const wi = words.length;
      words.push(cur);
      if (curMeta && curMeta.paren) parenSpans.push(wi);
      if (curMeta && curMeta.customStyleId) customSpans.push({ wi, styleId: curMeta.customStyleId });
      cur = null; curMeta = null;
    };
    for (const step of (ln.flow || [])) {
      if (step.type === 'glue') {
        if (step.internal) {
          // המשך יחידה צמודה — המילה הבאה נצמדת ב-NBSP (כמו bindMarkersToNeighbors)
          if (cur !== null) cur += '\u00A0';
          continue;
        }
        flushWord();
        continue;
      }
      // תיבה: טקסט הפרגמנטים; סמן — עם תג (D-53); placeholder inline — עם תג; תמונה — טקסט המקור
      const f = (ln.fragments || []).find(x => x.itemId === step.itemId);
      let text = null;
      let meta = null;
      if (f) {
        if (f.kind === 'noteMarker') {
          text = MARK_TAG + ((f.fragments || []).map(x => x.text).join(''));
        } else if (f.kind === 'atomicToken') {
          text = MARK_TAG + ((f.fragments || []).map(x => x.text).join(''));
        } else if (f.kind === 'image') {
          text = imageWordOf(f);
        } else {
          text = (f.fragments || []).map(x => x.text).join('');
        }
        if (f.overlay) meta = { paren: !!f.overlay.paren, customStyleId: f.overlay.customStyleId || null };
      }
      if (text == null) text = '';
      if (cur !== null) {
        cur += text; // תיבה נוספת של אותה יחידה צמודה
        if (meta && meta.customStyleId) curMeta = meta;
      } else {
        cur = text;
        curMeta = meta;
      }
    }
    flushWord();
    // **תמונות מחוץ לזרימה (§12/§22):** שורת תמונת בלוק/ממורכזת — אין לה flow;
    // המילה נגזרת מהפרגמנט (טקסט המקור). תמונה צפה — האזור רשום בשורה, וטקסט
    // המקור שלה נספר כאן (חשבונאות שימור תוכן + תצוגת המוצר עד שלב 8).
    if (!words.length) {
      for (const f of (ln.fragments || [])) {
        const text = f.kind === 'image'
          ? (f.sourceText != null ? f.sourceText : (f.fragments || []).map(x => x.text).join(''))
          : (f.fragments || []).map(x => x.text).join('');
        if (text) words.push(text);
      }
    }
    for (const fa of (ln.floatAreas || [])) {
      if (fa.sourceText != null) words.push(fa.sourceText);
    }
    const view = {
      // שדות מורשת (נגזרים — מקור האמת ב-LineModel)
      words,
      widthPx: ln.naturalWidthPx,
      heightPx: ln.lineHeightPx,
      isLast: ln.isLast,
      kind: extras.kind || 'paragraph',
      ...(extras.level != null ? { level: extras.level } : {}),
      ...(extras.tokenId != null ? { tokenId: extras.tokenId } : {}),
      measureW: ln.effectiveMaxWidthPx,
      // שכבות-על לזיהוי spans ברינדור (כמו הנתיב החי — מדדי מילים)
      ...(parenSpans.length ? { parenSpans } : {}),
      ...(customSpans.length ? { customSpans } : {}),
      // ה-LineModel המלא — מגיע ל-Planner/רנדרר בלי שיטוח (שער §17: "LineModel מלא מגיע ל-Planner")
      lineModel: ln,
      // **Iteration-003 (מילת-חלון):** דגלי החלון עוברים ל-view — ה-DOM
      // (line--window-wrap / w--window) והמקרן (הזחת תיבת השורה + פליטת
      // המילה ב-1.5× בגופן החלון) צורכים אותם.
      ...(ln.window ? { window: true } : {}),
      ...(ln.windowW != null ? { windowW: ln.windowW } : {}),
      ...(ln.windowWords ? { windowWords: ln.windowWords } : {}),
      // סמנטיקה (H3 — D-S2H3): מוצמדת לשורה; שום שלב אינו מוסיף רווח נוסף
      ...(ln.semantic ? { semantic: ln.semantic } : {})
    };
    out.push(view);
  }
  return out;
}

/** מילת תצוגה של תמונה — טקסט המקור שלה (ההתנהגות הקיימת: ה-syntax מוצג עד
 * שלב 8 יצרוך את הפריט עצמו). הזהות המלאה נשמרת ב-LineModel/פרגמנט. */
function imageWordOf(fragment) {
  if (fragment.sourceText != null) return fragment.sourceText;
  return (fragment.fragments || []).map(x => x.text).join('');
}

module.exports = {
  layoutModelBlock, legacyViewOfLines, displayItemsOf, flatTextOf, wordOverlayFactory
};
