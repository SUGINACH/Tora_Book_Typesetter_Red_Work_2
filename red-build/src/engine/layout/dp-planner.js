// src/engine/layout/dp-planner.js — Multi-column/page DP planner (REQ-BAL-01/02/04/08/10)
'use strict';

const crypto = require('crypto');
// **חוזה H3 (D-S2H3/CSS parity):** ריפודי פס כותרת 3 ממקור יחיד —
// אותו חוזה כמו מדידת ה-pipeline.
const { H3_TOP_PAD_PX, H3_BOTTOM_PAD_PX, H3_MARGIN_BOTTOM_PX, H3_FOLLOW_MIN_PX, h3BandHeightPx, h3BandRoomThresholdPx } = require('../core/h3-contract');
const { PAGE_TYPES, buildPageTemplate, isImudProfile } = require('./page-templates');
const { H0_TITLE_Y, H2_SIMAN_Y, H2_SIMAN_Y_SPAN, H2_TITLE_Y, H2_TITLE_Y_SPAN, H2_TITLE_LINE_PITCH_PX, GEO, FLOW_BOTTOM, SINGLE_W, SZ_CORE } = require('../core/imud-geometry'); // **G3/RC-3 (i004):** עוגני פתיחת-הסימן — מקור יחיד (S4.19)
const { Ledger } = require('../core/ledger');
const { runProtections } = require('./protections-matrix');
const { runRetreatLoop } = require('./retreat-loop');
const { generateCandidates } = require('./candidate-generator');
const { blockGapPx, colCapacityOf, planningUsedHeight, normalizeColumnGaps } = require('./column-flow'); // **שלב 5:** planningUsedHeight — מקור יחיד לגובה התפוס בזמן תכנון (חילוץ מ-#16); **פרוסה 2:** normalizeColumnGaps — נרמול פערים אחרי פיצול מחדש
const { fixDropWordInColumns } = require('../typography/protectors');
const { MARK_TAG } = require('../notes/markers'); // markerFragmentOf אינו נדרש כאן — הזיהוי לפי MARK_TAG ישירות (תבנית D-53)
const { moveLineForward } = require('./ordering');
const { optimalSplit } = require('./balancing'); // **EXT-8:** חלוקה גלובלית אופטימלית
const { getFootnotesReservedHeight, noteHeight, noteMetrics, stampNoteMetrics } = require('./footnote-budget'); // **שלב 5:** noteMetrics — מקור יחיד למדדי ההערה (חילוץ מ-#16); **פרוסה 2:** stampNoteMetrics — מדידה אחת ביצירה
const { stampNote, makeNoteRecord, NOTE_KINDS } = require('./notes-model'); // **שלב 6 פרוסה 2:** מודל ההערות המאוחד — זהות/עוגן + חותמת הערות-צד ביצירה
const CM = require('./constraint-matrix'); // **שלב 5:** מטריצת האילוצים המאוחדת (חילוץ שורש מ-#16/#17)
const { createTraceRecorder } = require('./decision-trace'); // **פרוסה 2 (§2.7):** תיעוד החלטות דטרמיניסטי קומפקטי
const { getDefaultSettings, findKey } = require('../core/settings-registry');
const { breakLines, FIT_EPS, STRETCH_RATIO, SHRINK_RATIO } = require('../typography/kp-linebreak');

/**
 * LineBreaker class — wraps breakLines for backward compatibility with tests.
 * Tests expect: new LineBreaker(api, cfg, windowApi, headingApi)
 */
class LineBreaker {
  constructor(api, cfg, windowApi, headingApi) {
    this.api = api;
    this.cfg = cfg;
    this.win = windowApi;
    this.winCache = new Map();
    this.hApi = headingApi;
    this.hCache = new Map();
    this.cache = new Map();
  }

  w(text, sizePt) {
    const key = sizePt + '|' + text;
    let v = this.cache.get(key);
    if (v === undefined) { v = this.api.measureTextWidth(text, sizePt, 0); this.cache.set(key, v); }
    return v;
  }
  hw(text, sizePt, apiOverride) {
    const useApi = apiOverride || this.hApi;
    if (!useApi) return this.w(text, sizePt);
    if (!useApi._hwCache) useApi._hwCache = new Map();
    const key = sizePt + '|' + text;
    let v = useApi._hwCache.get(key);
    if (v === undefined) { v = useApi.measureTextWidth(text, sizePt, 0); useApi._hwCache.set(key, v); }
    return v;
  }
  wWin(text, sizePt) {
    if (!this.win) return this.w(text, sizePt);
    const key = sizePt + '|' + text;
    let v = this.winCache.get(key);
    if (v === undefined) { v = this.win.measureTextWidth(text, sizePt, 0); this.winCache.set(key, v); }
    return v;
  }

  splitWords(text, opts) {
    const { fnOpen, fnClose } = this.cfg;
    const safe = String(text).trim();
    // Simple findNotes implementation
    const notes = [];
    let idx = 0;
    while (true) {
      const openIdx = safe.indexOf(fnOpen, idx);
      if (openIdx === -1) break;
      const closeIdx = safe.indexOf(fnClose, openIdx + fnOpen.length);
      if (closeIdx === -1) break;
      notes.push({ start: openIdx, end: closeIdx + fnClose.length });
      idx = closeIdx + fnClose.length;
    }
    let atomic = safe;
    for (const n of notes) {
      const inner = safe.slice(n.start + fnOpen.length, n.end - fnClose.length).replace(/\s+/g, '');
      atomic = atomic.slice(0, n.start + fnOpen.length) + inner + atomic.slice(n.end - fnClose.length);
    }
    const words = atomic.split(/\s+/).filter(Boolean);
    const escO = fnOpen.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const escC = fnClose.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const inWord = new RegExp(escO + '[\\s\\S]*?' + escC, 'g');
    const markerOf = (opts && typeof opts.markerOf === 'function') ? opts.markerOf : null;
    const markerSzPt = (opts && Number.isFinite(opts.markerSizePt)) ? opts.markerSizePt : null;
    const markerMw = (opts && typeof opts.markerMeasure === 'function') ? opts.markerMeasure : null;
    const bodySzPt = (opts && Number.isFinite(opts.bodySizePt)) ? opts.bodySizePt : null;
    const bodyMw = (opts && typeof opts.bodyMeasure === 'function') ? opts.bodyMeasure : markerMw;
    const canMeasureMarker = !!(markerOf && markerMw && markerSzPt != null && bodySzPt != null);
    const dispW = new Array(words.length).fill(null);
    let noteOrdinal = 0;
    const markerTextOf = () => {
      if (!markerOf) return 'א';
      return LineBreaker.markerWord(markerOf(noteOrdinal), this.cfg.fnNumSeparator);
    };
    const disp = words.map((word, wi) => {
      if (word.startsWith(fnOpen) && word.endsWith(fnClose)) {
        const mText = markerOf ? markerTextOf() : 'א';
        noteOrdinal++;
        if (markerOf && markerMw && markerSzPt != null) dispW[wi] = markerMw(mText, markerSzPt);
        return markerOf ? mText : 'א';
      }
      if (canMeasureMarker) {
        const m = word.match(inWord);
        if (m) {
          const full = word.replace(inWord, '\u0001');
          const parts = full.split('\u0001');
          if (parts.length === 2) {
            const mText = markerTextOf();
            noteOrdinal++;
            dispW[wi] = (parts[0] ? bodyMw(parts[0], bodySzPt) + bodyMw(' ', bodySzPt) : 0)
              + markerMw(mText, markerSzPt)
              + (parts[1] ? bodyMw(' ', bodySzPt) + bodyMw(parts[1], bodySzPt) : 0);
            return parts[0] + ' ' + mText + ' ' + parts[1];
          }
        }
      }
      return word.replace(inWord, ' א ');
    });
    const out = words.map(word => word.replace(//g, ' '));
    return { words, disp, out, notes, dispW };
  }

  static markerWord(n, sep) { return toGematria(n) + (sep != null ? sep : '.'); }

  breakPara(text, colWidthPx, sizePt, allowWindow, measureApi = null, opts = null) {
    const cfg = this.cfg;
    const mw = measureApi
      ? (t, sz) => measureApi.measureTextWidth(t, sz, 0)
      : (t, sz) => this.w(t, sz);
    const { disp, out, notes, dispW } = this.splitWords(text, opts);
    const spaceW = mw(' ', sizePt);
    const parenSize = sizePt - 2; // 12-2 = 10pt
    const wordWs = new Array(out.length);
    const wordParen = new Array(out.length);
    const endsInParen = new Array(out.length);
    const startsInParen = new Array(out.length);
    {
      let depth = 0;
      for (let i = 0; i < out.length; i++) {
        const wd = disp[i];
        if (dispW && dispW[i] != null) {
          wordWs[i] = dispW[i];
          if (out[i].startsWith(cfg.fnOpen) && out[i].endsWith(cfg.fnClose)) {
            wordParen[i] = false;
            startsInParen[i] = false;
            endsInParen[i] = false;
            continue;
          }
          let anyParen = false;
          for (let c = 0; c < wd.length; c++) {
            const ch = wd[c];
            if (ch === '(') depth++;
            const inParen = depth > 0;
            if (inParen) anyParen = true;
            if (c === 0) startsInParen[i] = inParen;
            endsInParen[i] = inParen;
            if (ch === ')' && depth > 0) depth--;
          }
          wordParen[i] = anyParen;
          continue;
        }
        let w = 0, seg = '', segParen = false;
        let anyParen = false;
        for (let c = 0; c < wd.length; c++) {
          const ch = wd[c];
          if (ch === '(') { depth++; segParen = true; }
          const inParen = depth > 0;
          if (inParen) anyParen = true;
          if (c === 0) startsInParen[i] = inParen;
          endsInParen[i] = inParen;
          if (ch === ')' && depth > 0) { depth--; if (depth === 0) segParen = false; }
        }
        wordParen[i] = anyParen;
        const sz = wordParen[i] ? parenSize : sizePt;
        wordWs[i] = mw(wd, sz);
      }
    }
    const lines = [];
    let i = 0;
    let hasWindow = false;
    let windowWords = null;
    const dropWordMode = cfg.dropWordMode || 'window';
    const dropWordCount = cfg.dropWordCount || 1;
    const dropWordMinLines = cfg.dropWordMinLines || 2;
    while (i < out.length) {
      let w = 0;
      let lineWords = [];
      let lineDisp = [];
      let lineDispW = [];
      let j = i;
      // Check for window word
      if (allowWindow && dropWordMode === 'window' && j < out.length && lines.length < dropWordMinLines) {
        const winW = this.wWin(out[j], sizePt * 1.5);
        if (winW > colWidthPx - FIT_EPS) {
          // Single word wider than column -> window mode
          hasWindow = true;
          windowWords = [out[j]];
          const line = { words: [disp[j]], heightPx: sizePt * 96 / 72 * 1.5, window: true, windowW: winW };
          lines.push(line);
          i = j + 1;
          continue;
        }
      }
      // Regular greedy fill
      while (j < out.length) {
        const addW = (lineWords.length ? spaceW : 0) + wordWs[j];
        if (w + addW > colWidthPx - FIT_EPS) break;
        w += addW;
        lineWords.push(out[j]);
        lineDisp.push(disp[j]);
        lineDispW.push(dispW[j] != null ? dispW[j] : wordWs[j]);
        j++;
      }
      if (!lineWords.length) {
        // Force at least one word
        lineWords.push(out[i]);
        lineDisp.push(disp[i]);
        lineDispW.push(dispW[i] != null ? dispW[i] : wordWs[i]);
        i++;
      } else {
        i = j;
      }
      lines.push({ words: lineDisp, widthPx: w, heightPx: sizePt * 96 / 72, isLast: i >= out.length, window: false });
    }
    return { lines, hasWindow, windowW: hasWindow ? this.wWin(windowWords[0], sizePt * 1.5) : 0 };
  }
}

// Hebrew gematria helper
function toGematria(n) {
  const letters = [
    '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י',
    'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ',
    'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', 'ל',
    'לא', 'לב', 'לג', 'לד', 'לה', 'לו', 'לז', 'לח', 'לט', 'מ',
    'מא', 'מב', 'מג', 'מד', 'מה', 'מו', 'מז', 'מח', 'מט', 'נ',
    'נא', 'נב', 'נג', 'נד', 'נה', 'נו', 'נז', 'נח', 'נט', 'ס',
    'סא', 'סב', 'סג', 'סד', 'סה', 'סו', 'סז', 'סח', 'סט', 'ע',
    'עא', 'עב', 'עג', 'עד', 'עה', 'עו', 'עז', 'עח', 'עט', 'פ',
    'פא', 'פב', 'פג', 'פד', 'פה', 'פו', 'פז', 'פח', 'פט', 'צ',
    'צא', 'צב', 'צג', 'צד', 'צה', 'צו', 'צז', 'צח', 'צט', 'ק',
    'קא', 'קב', 'קג', 'קד', 'קה', 'קו', 'קז', 'קח', 'קט', 'קי',
    'קיא', 'קיב', 'קיג', 'קיד', 'קטו', 'קטז', 'קיז', 'קיח', 'קיט', 'ככ',
    'ככא', 'ככב', 'ככג', 'ככד', 'ככה', 'ככו', 'ככז', 'ככח', 'ככט', 'ככל',
    'ככלא', 'ככלב', 'ככלג', 'ככלד', 'ככלה', 'ככלו', 'ככלז', 'ככלח', 'ככלט', 'ככלמ',
    'ככלמא', 'ככלמב', 'ככלמג', 'ככלמד', 'ככלמה', 'ככלמו', 'ככלמז', 'ככלמח', 'ככלמט', 'כככנ',
    'כככנא', 'כככנב', 'כככנג', 'כככנד', 'כככנה', 'כככנו', 'כככנז', 'כככנח', 'כככנט', 'כככס',
    'כככסא', 'כככסב', 'כככסג', 'כככסד', 'כככסה', 'כככסו', 'כככסז', 'כככסח', 'כככסט', 'כככע',
    'כככעא', 'כככעב', 'כככעג', 'כככעד', 'כככעה', 'כככעו', 'כככעז', 'כככעח', 'כככעט', 'כככפ'
  ];
  let result = '';
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const remainder = n % 1000;
    result = (letters[thousands] || 'א') + '׳';
    if (remainder > 0) {
      result += letters[remainder] || '';
    }
  } else {
    result = letters[n] || 'א';
  }
  return result;
}

/** גובה פריט כותרת inline (h4/h5/h6) בטור — גודל×1.45.
 * **S4.14 (מדידה שיטתית מעוגני הייחוס):** מרחק תווית-hN → עוגן הפסקה הבא
 * באותו טור, על פני כל המסמך: h4=24-25px (32 מדידות; 12.5pt), h5=22px
 * (7 מדידות; 11.5pt), h6=20px (5 מדידות; 10.5pt) — כלומר גודל×1.45 בדיוק
 * (24.2/22.2/20.3). הנוסחה הקודמת ×1.22+6 נתנה 26.3/24.7 — גבוהה ב-2 עד 2.5px
 * לכל כותרת, והפער הצטבר לשורה שלמה בעמודים עם כותרות מרובות. */
function headingItemH(level) {
  const sz = ({ 4: SZ_CORE.h4, 5: SZ_CORE.h5, 6: SZ_CORE.h6 })[level] || SZ_CORE.body;
  return sz * (96 / 72) * 1.45;
}

/** גלישת שורות גרידה גנרית (להערות). */
function wrapText(text, api, widthPx, sizePt) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = [], curW = 0;
  const spaceW = api.measureTextWidth(' ', sizePt, 0);
  for (const w of words) {
    const ww = api.measureTextWidth(w, sizePt, 0);
    const add = ww + (cur.length ? spaceW : 0);
    // **D-92:** רווח-ביטחון התאמת-דפדפן (הערות השוליים מרונדרות מחדש ב-DOM).
    if (cur.length && curW + add > widthPx - FIT_EPS) { lines.push(cur.join(' ')); cur = [w]; curW = ww; }
    else { cur.push(w); curW += add; }
  }
  if (cur.length) lines.push(cur.join(' '));
  return lines;
}

/**
 * **גשר הגדרות (S77):** ממיר את ה-raw של IMUD (default_settings.json) + הרשמה
 * לאובייקט הגדרות שהמנוע המאוחד משתמש בו — יחידת כניסה יחידה למודול ה-DP.
 * ערכי ההגדרה החיים (settings registry) גוברים על ה-raw; ברירות המחדל של המקור
 * נשמרות כ-fallback מדויק (אותן הערכים המכוילים).
 */
function readConfig(imudRaw, settings) {
  // IMUD raw key -> RED registry ID key mapping (from legacy-settings-map.js DISPOSITIONS)
  // The settings object uses the registry ID (e.g., 'heading-4-size-pt') not the control name (e.g., 'rng-h4-size')
  const IMUD_TO_REGISTRY = {
    // Typography
    'font-body': 'body-font',
    'size-body': 'body-font-size-pt',
    'line-height-body': 'body-line-height',
    's-paren': 'paren-style-scale', // handled specially with transform
    's-paren-mode': null, // ui-state
    'body-last-line-align': 'body-last-line-align',
    // Drop word
    'drop-word-mode': 'first-word-mode',
    'drop-word-count': 'first-word-length',
    'drop-word-min-lines': 'first-word-threshold-lines',
    'font-first-word': 'first-word-font',
    'size-first-word': 'first-word-size-em',
    // DH
    'auto-dh': 'dh-auto-detect',
    'font-dh': 'dh-font',
    // Heading modes
    'mode-h0': 'heading-0-mode',
    'mode-h1': 'heading-1-mode',
    'mode-h2': 'heading-2-mode',
    'mode-h3': 'heading-3-mode',
    'mode-h4': 'heading-4-mode',
    'mode-h5': 'heading-5-mode',
    'mode-h6': 'heading-6-mode',
    'mode-h7': 'heading-7-mode',
    // Odd page starts (ui-state)
    'odd-h0': null, 'odd-h1': null, 'odd-h2': null,
    'h2-auto-siman': null, 'h2-reset-siman': null,
    'h2-top-distance': 'h2-top-offset',
    // Notes
    'en-line-prefix': 'en-line-prefix',
    'fn-delim-open': 'fn-delim-open',
    'fn-delim-close': 'fn-delim-close',
    // Font families (heading fonts)
    'f-h0': 'heading-0-font', 'f-h1': 'heading-1-font', 'f-h2': 'heading-2-font',
    'f-h3': 'heading-3-font', 'f-h4': 'heading-4-font', 'f-h5': 'heading-5-font',
    'f-h6': 'heading-6-font', 'f-h7': 'heading-7-font',
    // Heading sizes - use registry ID (e.g., heading-4-size-pt), not control name (rng-h4-size)
    's-h0': 'heading-0-size-pt', 's-h1': 'heading-1-size-pt', 's-h2': 'heading-2-size-pt',
    's-h3': 'heading-3-size-pt', 's-h4': 'heading-4-size-pt', 's-h5': 'heading-5-size-pt',
    's-h6': 'heading-6-size-pt', 's-h7': 'heading-7-size-pt',
    // Note body font
    'f-note-body': 'f-note-body-font',
    // Header fonts and sizes
    'f-hdr-r': 'header-recto-right-font', 'f-hdr-c': 'header-recto-center-font', 'f-hdr-l': 'header-recto-left-font',
    's-hdr-r': 'header-recto-right-size-pt', 's-hdr-c': 'header-recto-center-size-pt', 's-hdr-l': 'header-recto-left-size-pt',
    'f-hdr-verso-r': 'header-verso-right-font', 'f-hdr-verso-c': 'header-verso-center-font', 'f-hdr-verso-l': 'header-verso-left-font',
    // Header slot types
    'hdr-r-type': 'header-recto-right-source', 'hdr-c-type': 'header-recto-center-source', 'hdr-l-type': 'header-recto-left-source',
    'hdr-verso-r-type': 'header-verso-right-source', 'hdr-verso-c-type': 'header-verso-center-source', 'hdr-verso-l-type': 'header-verso-left-source',
    'hdr-verso-same-as-recto': 'header-verso-same-as-recto',
    'hdr-divider-style': 'header-separator-line',
    // Page numbering
    'page-num-position': 'page-num-position',
    'page-num-format': 'page-num-format',
    'page-num-frame': 'page-num-frame',
    'page-num-start-idx': 'page-num-start-idx',
    'page-num-initial-value': 'page-num-initial-value',
    // Column/proportion settings
    'prop-col': 'grid-col-width-pct', 'prop-margin': 'grid-margin-side-pct', 'prop-gutter': 'grid-gutter-pct', 'prop-gap': 'grid-gap-pct',
    'prop-mt': 'margin-top-px', 'prop-mb': 'margin-bottom-px', 'prop-mt-h2': 'h2-top-offset',
    // Other
    'fn-columns': 'footnote-columns',
    'fn-layout-mode': 'fn-layout-mode',
    'fn-reset-mode': 'footnote-reset-policy',
    'fn-title-text': 'fn-title-text',
    'f-note-title': 'f-note-title',
    's-note-title': 's-note-title',
    'f-note-body': 'f-note-body-font',
    's-note-body': 'f-note-body-size-pt',
    'note-numbering-style': 'footnote-marker-style',
    'note-marker-type': null, // ui-state
    'note-marker-size': 'note-marker-size',
    'note-listing-num-size': 'note-listing-num-size',
    'note-num-separator': 'note-num-separator',
    'note-rule-style': 'footnote-separator-rule',
    'avoid-orphans': 'avoid-orphans', 'avoid-widows': 'avoid-widows', 'avoid-runt-word': 'avoid-runt-word',
    'hdr-distinct-even-odd': 'hdr-distinct-even-odd',
    'hdr-alternating': 'hdr-alternating',
    'hdr-title-split': 'split-book-title',
    // TOC
    'enable-general-toc': 'enable-general-toc', 'enable-detailed-toc': 'enable-detailed-toc',
    'f-gtoc-1': 'f-gtoc-1', 's-gtoc-1': 's-gtoc-1', 'f-gtoc-2': 'f-gtoc-2', 's-gtoc-2': 's-gtoc-2',
    'f-gtoc-3': 'f-gtoc-3', 's-gtoc-3': 's-gtoc-3', 'f-gtoc-4': 'f-gtoc-4', 's-gtoc-4': 's-gtoc-4',
    'f-gtoc-5': 'f-gtoc-5', 's-gtoc-5': 's-gtoc-5', 'f-gtoc-6': 'f-gtoc-6', 's-gtoc-6': 's-gtoc-6',
    'f-gtoc-7': 'f-gtoc-7', 's-gtoc-7': 's-gtoc-7',
    'f-dtoc-1': 'f-dtoc-1', 's-dtoc-1': 's-dtoc-1', 'f-dtoc-2': 'f-dtoc-2', 's-dtoc-2': 's-dtoc-2',
    'f-dtoc-3': 'f-dtoc-3', 's-dtoc-3': 's-dtoc-3', 'f-dtoc-4': 'f-dtoc-4', 's-dtoc-4': 's-dtoc-4',
    'f-dtoc-5': 'f-dtoc-5', 's-dtoc-5': 's-dtoc-5', 'f-dtoc-6': 'f-dtoc-6', 's-dtoc-6': 's-dtoc-6',
    'f-dtoc-7': 'f-dtoc-7', 's-dtoc-7': 's-dtoc-7',
    // Shaar
    'show-main-shaar': 'show-main-shaar', 'show-back-shaar': 'show-back-shaar', 'show-sub-shaar': 'show-sub-shaar',
    'count-shaar-pages': 'count-shaar-pages', 'count-toc-pages': 'count-toc-pages',
    'main-shaar-count-numbering': 'main-shaar-count-numbering', 'main-shaar-show-number': 'main-shaar-show-number',
    'back-shaar-count-numbering': 'back-shaar-count-numbering', 'back-shaar-show-number': 'back-shaar-show-number',
    'sub-shaar-count-numbering': 'sub-shaar-count-numbering', 'sub-shaar-show-number': 'sub-shaar-show-number',
    'general-toc-count-numbering': 'general-toc-count-numbering', 'general-toc-show-numbering': 'general-toc-show-numbering',
    'detailed-toc-count-numbering': 'detailed-toc-count-numbering', 'detailed-toc-show-numbering': 'detailed-toc-show-numbering',
    // Footer
    'page-num-format': 'page-num-format',
    // fn-bar-max-height-px (legacy)
    'fn-bar-max-height-px': null, // removed
    // Background
    'cbg-regular-mode': 'cbg-regular-mode', 'cbg-regular-color': 'cbg-regular-color',
    'cbg-regular-opacity': 'cbg-regular-opacity', 'data-cbg-regular-img': 'data-cbg-regular-img',
    'cbg-h0Open-mode': 'cbg-h0Open-mode', 'cbg-h0Open-color': 'cbg-h0Open-color',
    'cbg-h0Open-opacity': 'cbg-h0Open-opacity', 'data-cbg-h0Open-img': 'data-cbg-h0Open-img',
    'cbg-h2Open-mode': 'cbg-h2Open-mode', 'cbg-h2Open-color': 'cbg-h2Open-color',
    'cbg-h2Open-opacity': 'cbg-h2Open-opacity', 'data-cbg-h2Open-img': 'data-cbg-h2Open-img',
  };

  const g = (k, d) => {
    // S77: הגדרה חיה של הרישום גוברת על ה-raw (הייבוא מסנכרן את ברירות
    // המחדל — התנהגות ברירת המחדל נשמרת במדויק)
    // תרגום אוצר-מילים: 'drop' של הרישום = 'window' של המקור (אותו
    // מנגנון מילת-חלון — כך מיפוי הייבוא); המנוע המורשת בודק 'window'.
    if (k === 'drop-word-mode' && settings) {
      const fm = settings['first-word-mode'];
      if (fm != null && fm !== '') return fm === 'drop' ? 'window' : String(fm);
    }
    // Map IMUD key to registry ID (not control name)
    const registryKey = IMUD_TO_REGISTRY[k];
    if (registryKey) {
      if (settings && settings[registryKey] !== undefined && settings[registryKey] !== null && settings[registryKey] !== '') {
        return settings[registryKey];
      }
    }
    const def = findKey(k);
    const rk = def ? def.id : null;  // Use registry ID, not control name
    if (rk && settings && settings[rk] !== undefined && settings[rk] !== null && settings[rk] !== '') return settings[rk];
    return (imudRaw && imudRaw[k] !== undefined && imudRaw[k] !== '' ? imudRaw[k] : d);
  };
  const b = (k, d) => {
    const v = g(k, d);
    return v === true || v === 'true' || v === '1' || v === 1;
  };
  const n = (k, d) => {
    const v = parseFloat(g(k, d));
    return isNaN(v) ? d : v;
  };
  return {
    fnOpen: String(g('fn-delim-open', '[')),
    fnClose: String(g('fn-delim-close', ']')),
    endPrefix: String(g('en-line-prefix', 'הערת סיום -')),
    dropWordMode: String(g('drop-word-mode', 'window')),
    dropWordCount: n('drop-word-count', 1),
    dropWordMinLines: n('drop-word-min-lines', 2),
    avoidRunt: b('avoid-runt-word', true),
    autoSimanH2: b('h2-auto-siman', true),
    resetSimanOnH1: b('h2-reset-siman', true),
    showMainShaar: b('show-main-shaar', true),
    showBackShaar: b('show-back-shaar', false),
    showSubShaar: b('show-sub-shaar', true),
    countSubShaar: b('sub-shaar-count-numbering', true),
    countGeneralToc: b('general-toc-count-numbering', true),
    countDetailedToc: b('detailed-toc-count-numbering', true),
    enableGeneralToc: b('enable-general-toc', true),
    enableDetailedToc: b('enable-detailed-toc', true),
    oddH0: b('odd-h0', true),
    oddH1: b('odd-h1', true),
    oddH2: b('odd-h2', false),
    // EXT-17 (גדלים נפרדים לסמן הערה/מספור ברשימה/מפריד): במקור שלוש
    // הגדרות עצמאיות — אצלנו היו נגזרות מגודל הגוף. ברירות המחדל של המקור:
    // ‏8/‏8/'.' (מילה-סמן בגוף, סמן ברשימת ההערות, המפריד אחרי המספר).
    fnMarkerSize: n('note-marker-size', 8),
    fnListingNumSize: n('note-listing-num-size', 8),
    fnNumSeparator: String(g('note-num-separator', '.')),
    // D-89 (כלל הכותרת התחתון): hdr-divider-style של המקור (black/gray/none).
    // פרופיל המורשת מכויל לייחוס — שם הכלל נמדד שחור מלא (43,62)-(553,63)pt
    // בכל עמודי הגוף/התוכן; 'none' מבטל.
    hdrDivider: String(g('hdr-divider-style', 'black')),
    // D-89 (עיצוב שערים): עיטור שער-המשנה מ-section_dividers.json
    // (shaar-sub-divider; 'none' = גל המובנה של המקור — כמו renderSubShaar).
    shaarSubDivider: String(g('shaar-sub-divider', 'none')),
    // EXT-19 (כותרות מתחלפות): החלפת החצאים בעמודים זוגיים (ברירת
    // המחדל במקור: כבוי — שני החצאים קבועים; hdr-title-split כבר ממומש
    // בפיצול שם הספר לחצאים ב-setHeader).
    hdrAlternating: b('hdr-alternating', false),
    hdrRType: String(g('hdr-r-type', 'book_title_split_r')),
    hdrCType: String(g('hdr-c-type', 'h2_without_siman')),
    hdrLType: String(g('hdr-l-type', 'book_title_split_l')),
    gtocShow: imudRaw && 'gtoc-show' in imudRaw ? imudRaw['gtoc-show'] : [1, 2, 3, 4, 5, 6],
    dtocShow: imudRaw && 'dtoc-show' in imudRaw ? imudRaw['dtoc-show'] : [2, 3, 4, 5, 6],
    // S5.2 (F2 — הערות סיום): כותרת עמודי הערות-הסיום מהמקור
    // (fn-title-text; ממופה ב-legacy-settings-map ל-endnote-title-text).
    fnTitleText: String(g('fn-title-text', 'הערות')),
    // S6.3 (חיבור הגדרות — "וכמויות של הגדרות שלא מחוברות"): טקסטי
    // השער האחורי משדות הפאנל של המקור (inp-book-back-*) — במקור הם
    // מקור התוכן של renderBackShaar; המטא-דאטה של המסמך רק מילאה את
    // השדות. ערך ריק בהגדרה ⇒ נפילה למטא (התנהגות קודמת).
    backCopyright: String(g('inp-book-back-copyright', '')),
    backPublishing: String(g('inp-book-back-publishing', '')),
    backContact: String(g('inp-book-back-contact', '')),
    backExtra: String(g('inp-book-back-extra', '')),
    // S6.3: גדלים מההגדרות — עד כאן היו קשיחים ב-SZ/בקוד (מכוילי
    // ייחוס); ערכי המקור גוברים (ברירות המחדל של default_settings.json).
    h0Size: n('s-h0', 17),
    h1Size: n('s-h1', 50),
    h1SubSize: n('s-sh-sub', 21),
    shTitle: n('s-sh-title', 46),
    shSub: n('s-sh-sub', 21),
    shDesc: n('s-sh-desc', 12),
    shSec: n('s-sh-sec', 11.5),
    shAuthor: n('s-sh-author', 15),
    shYear: n('s-sh-year', 12),
    fnBodySize: n('s-note-body', 8.5),
    gtocSizes: { 1: n('s-gtoc-1', 12), 2: n('s-gtoc-2', 11), 3: n('s-gtoc-3', 10.5), 4: n('s-gtoc-4', 10), 5: n('s-gtoc-5', 9.5), 6: n('s-gtoc-6', 9), 7: n('s-gtoc-7', 8.8) },
    dtocSizes: { 1: n('s-dtoc-1', 12), 2: n('s-dtoc-2', 11), 3: n('s-dtoc-3', 10.5), 4: n('s-dtoc-4', 10), 5: n('s-dtoc-5', 9.5), 6: n('s-dtoc-6', 9), 7: n('s-dtoc-7', 8.8) },
    // S6.3 (בקשת משתמש — "אי איזון = שני טורים מאותו בלוק שאינם
    // מסתיימים בגובה זהה סימטרי"): סף אי-האיזון מההגדרות (במקום
    // 60px קשיח) — imbalance-max-delta-px של המרשם (ברירת מחדל 5).
    imbalanceMaxDeltaPx: n('imbalance-max-delta-px', 5)
  };
}

/** חתימת פריסה דטרמיניסטית — ללא Date/random (REQ-GOV determinism).
 * תיקון S7-E2E: tokenId נמצא ב‑meta של pushLines (לא על השורה עצמה) — יש לחלץ משם,
 * אחרת hash/TOC מאבדים את מזהה הטוקן (באג V23: headingsForToc ריק). */
function lineTokenId(ln) {
  if (ln.tokenId != null) return ln.tokenId;
  if (ln.meta && ln.meta.tokenId != null) return ln.meta.tokenId;
  return '';
}

/**
 * **תיקון S8 (טור פנטום):** יישור מערך הטורים לאורך התבנית אחרי המרת סוג עמוד.
 * שומר על תוכן קיים בעמודות שנותרו; תורם עודפים (בלי תבנית) מוחזרים —
 * לא אמור לקרות (ההמרה מתבצעת בעמוד ריק/חדש), ואם קרה — נסיגה בטוחה.
 */
function reAlignColumns(page) {
  const n = page.template.columns.length;
  const old = page.columns || [];
  const next = Array.from({ length: n }, (_, i) => (old[i] ? old[i].slice() : []));
  let orphaned = 0;
  for (let i = n; i < old.length; i++) orphaned += old[i].length;
  if (orphaned > 0 && old[n - 1]) {
    // שורות בטור פנטום — מוחזרות לטור האחרון החוקי (BRZ-15: אין גניזה)
    next[n - 1].push(...old.slice(n).flat());
  }
  page.columns = next;
  return orphaned;
}

function layoutHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}`)),
    // **S4.10:** דפנסיביות — עמודי מנוע המורשת אינם מחויבים לכל השדות
    // (לפני כן p.sideNotes.length קרס על undefined). לעמודי DP אין שינוי ערך.
    fn: (p.footnotes || []).length, sn: (p.sideNotes || []).length
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **D-47 (תיקון P0-6):** hash של **הגיאומטריה הנמדדת בלבד** (הטורים/השורות) —
 * זהו האינווריאנט T1: פאס העיטורים/ההערות אסור לו לשנות את הפריסה שנמדדה.
 * בעבר ההשוואה CP4==CP5 השוותה משתנה לעצמו — טאוטולוגיה שאינה יכולה להיכשל.
 * כאן: hash נפרד של הטורים בלבד (בלי מרזבים/הערות צד שמשתנים כחוק בשלב ההערות)
 * — נבדק לפני ואחרי פאס העיטורים בpipeline; שינוי אמיתי בשורות ⇒ הבדיקה נכשלת.
 */
function bodyGeometryHash(pages) {
  const canon = pages.map(p => ({
    i: p.index, t: p.type,
    c: p.columns.map(col => col.map(ln => `${lineTokenId(ln)}:${(ln.words || []).join('\u00A7')}:${ln.seq != null ? 's' + ln.seq : ''}`))
  }));
  return crypto.createHash('sha256').update(JSON.stringify(canon), 'utf8').digest('hex');
}

/**
 * **תיקון P0-3 (שבירת סדר קריאה):** איזון חוקי מזיז שורות **קדימה בסדר הקריאה
 * בלבד** — הזזת גבול הטורים קדימה/אחורה תוך שמירת סדר המילים:
 *  - טור מוקדם (col0, נקרא ראשון) גבוה יותר ⇒ pop מסופו → unshift לראש col1 (קדימה).
 *  - טור מאוחר (col1, נקרא שני) גבוה יותר ⇒ shift מראשו → push לסוף col0 (הזזת הגבול
 *    אחורה — שומר סדר: השורה עדיין אחרי כל col0 ולפני שאר col1).
 * בעבר: pop מהטור המאוחר + unshift לראש הטור המוקדם — הציג את סוף פסקה לפני
 * תחילתה (רגרסיה חדשה שלא הייתה באף גרסה קודמת). כל השורות מתויגות seq
 * (סדר הצבה = סדר מסמך) ו‑protections-matrix מפיק reading-order-break אם
 * איזון עתידי יפר זאת — הבאג נעול לצמיתות בבדיקת רגרסיה.
 */

/**
 * Block = יחידת פריסה: heading או paragraph עם שורות שנמדדו.
 * @param {Array} blocks - [{kind:'heading'|'paragraph', lines:[...], notes:[...], token}]
 * @param {object} settings
 * @param {{measure:(t:string,s?:number)=>number}} env - חייב להכיל measure (entry יחיד — L1); אחרת throw (ללא קריסה שקטה)
 */
function planPages(blocks, settings, eventLog, ledger = new Ledger(), env = {}) {
  const measureFn = env && typeof env.measure === 'function' ? env.measure : null;
  if (!measureFn) {
    throw new Error('dp-planner: env.measure is required (single measurement entry — REQ-LB-01). Silent fallback to global is forbidden.');
  }
  // **פרוסה 2 (§2.7):** רשם ה-trace — opt-in (env.trace חיצוני או settings.
  // _plannerTrace); כבוי בברירת המחדל (קומפקטיות זיכרון). הספירות נשמרות
  // תמיד. המתכנן עצמו כבר אינו מודד — measureFn משמש רק להטבעה חד-פעמית
  // של הערות שלא נמדדו במקורן (CP2 אמור לחתום את כולן; בדיקת הטוהר מוכיחה 0).
  const trace = (env && env.trace) || createTraceRecorder({ enabled: settings['_plannerTrace'] === true });
  // **S10 (REQ-UI-03):** מזליף התקדמות מה‑DP — מכשור בלבד (no-op proof בבדיקה).
  // הערכת מספר העמודים: סכום גבהים נמדדים / קיבולת עמוד רגיל — מעודכנת בזמן אמת.
  const onProgress = env && typeof env.onProgress === 'function' ? env.onProgress : null;
  const estCapacity = (() => {
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    return Math.max(1, tpl.contentBox.height * Math.max(1, tpl.columns.length));
  })();
  const blockHeight = (b) => (b.lines || []).reduce((s, l) => s + (l.heightPx || 0), 0);
  const totalHeight = blocks.reduce((s, b) => s + blockHeight(b), 0);
  const estimatedPages = Math.max(1, Math.ceil(totalHeight / estCapacity));
  const pages = [];
  let pageIdx = 0;
  let seqCounter = 0; // סדר הצבה — סדר קריאה (תיקון P0-3)
  const lineH = Math.round(settings['body-font-size-pt'] * (96 / 72) * settings['body-line-height']);
  const imbMax = settings['imbalance-max-delta-px'];

  // **FX-1 (דוח 06, שלב 5 — חילוץ שורש מ-#17):** נעילת ליווי — הטור שאומת
  // למחסנית כותרת+ליווי הוא startCol של ההצבה עד השלמת שורות הליווי;
  // נאפס בכל עמוד חדש.
  let escortLockCol = 0;
  let escortLinesNeeded = 0;
  // **שלב 5 (אילוץ קשה — סדר קריאה מבני):** מונוטוניות טורים לאורך הזרימה —
  // אחרי ששורה כלשהי הוצבה בטור c, שורות המשך באותו עמוד אינן רשאיות לחזור
  // לטור מוקדם ממנו (הקריאה עוברת col0 מלמעלה למטה ואז col1). בלי זה, המילוי
  // החמדני של pushLines יכול להכניס שורה מאוחרת לסוף col0 אחרי שהזרימה כבר
  // עברה ל-col1 (נמדד: 49 הפרות reading-order ב-very_long לאחר FX-5 — האריזה
  // הצפופה חשפה את הפגם שהיה קיים אך נדיר). תיקון השורש: האילוץ חי בהצבה
  // עצמה, לא בגילוי לאחר המעשה (protections).
  let flowCol = 0;

  function newPage(type = PAGE_TYPES.REGULAR) {
    escortLockCol = 0;
    escortLinesNeeded = 0;
    flowCol = 0;
    const isRecto = pages.length % 2 === 0; // עמוד 1 = recto
    const tpl = buildPageTemplate(type, settings, isRecto);
    // **פרוסה 2 (§2.5):** dpPlanned — סימון עמוד הזרימה לחוזה ה-PagePlan
    // (finalizePagePlans ב-pipeline); openedBy — מעברי עמוד/סוג; reservations —
    // שמורות אחידות של שלב 6 (מנגנון ההרחבה של מודל הקיבולת).
    return { index: pageIdx++, type, template: tpl, columns: Array.from({ length: tpl.columns.length }, () => []), footnotes: [], sideNotes: [], headingsOnPage: [], balanceInfo: null, fnReservedHeightPx: 0, chapterOpening: false, dpPlanned: true, openedBy: null, reservations: [] };
  }

  let cur = newPage(PAGE_TYPES.REGULAR);

  // **FWD-1 (S8):** פס כותרת חוצה־טורים (spanning band) — כותרת שנמדדה ברוחב
  // מלא מוצבת בפס עליון חוצה־טורים במקום בטור חצי־רוחב (בעבר: נמדדה ברוחב מלא
  // והוצבה בטור רגיל ⇒ גלישה אופקית שקטה). הטורים מתחילים מתחת לפס.
  // **S5.2 / U-8 (מקור קיבולת יחיד):** כל חישובי ההצבה צורכים את
  // colCapacityOf(page) בלבד. תבנית תקינה יכולה להניב קיבולת 0 לאחר הפחתת
  // spanning/notes/reservations; אסור ל-fallback להחזיר שטח גולמי במקרה הזה.
  // ה-fallback נשמר רק לעמודים ישנים ללא template קנוני (אם יגיעו מנתיב תאימות).
  const colCapacity = (tpl, page) => {
    if (page && page.template && page.template.contentBox) return colCapacityOf(page);
    return tpl && tpl.contentBox ? tpl.contentBox.height - ((page && page.spanning && page.spanning.heightPx) || 0) : 0;
  };

  /**
   * גובה תפוס = שורות בלבד (**U-8 — אמנה אחת**: התקציב חי בקיבולת, לא ב-used).
   * תיקון P1-8: חתימה (col, page) — page נשמר לתאימות צרכנים; planningUsedHeight
   * עצמו כבר אינו צורך אותו.
   */
  // **שלב 5 (חילוץ שורש מ-#16):** גובה תפוס בזמן תכנון — מקור יחיד
  // (column-flow.planningUsedHeight); סמנטיקת הרינדור (עם aqStretch) חיה
  // ב-balancing.usedHeight — שני דגלים, שני מקורות מתועדים.
  const usedHeight = (col, page = cur) => planningUsedHeight(col, page);

  /**
   * **איחוד P1-1 (מנגנום תאום):** recomputeFnBudget ממשיך כעת דרך
   * footnote-budget.getFootnotesReservedHeight — מקור יחיד. בעבר היו שני מימושים
   * מקבילים; בדיקת probe==reserved רצה על מודול שהמנוע לא השתמש בו.
   */
  function recomputeFnBudget(page) {
    if (!settings['footnotes-enabled'] || !page.footnotes.length) { page.fnReservedHeightPx = 0; return 0; }
    const reserved = getFootnotesReservedHeight(page.footnotes, settings, measureFn) // **S70:** העברת הפונקציה עצמה שומרת על סימון ה-impl (להתאמת פקטורים);
    page.fnReservedHeightPx = reserved;
    return reserved;
  }

  /**
   * **FX-5 (דוח 06, שלב 5 — חילוץ שורש מ-#17):** בדיקת קיבולת ב-yPx אמיתיים.
   * הגרסה ההיסטורית (`ensureRoom(neededLines)`) מדדה `neededLines × lineH`
   * בעוד ההצבה צורכת heightPx — פער היחידות יצר עמודים ריקים פנטום (בלוק
   * שנכנס פיזית "נכשל" בבדיקה — FX-5) ובדיקות ליווי שקרסו על כותרות גבוהות
   * מ-lineH (FX-1). המחסנית כוללת את פער הכניסה של הבלוק (CM.stackHeightPx).
   */
  function ensureRoomFor(stackPx, fromCol = 0) {
    const cap = colCapacity(cur.template, cur);
    for (let c = fromCol; c < cur.columns.length; c++) {
      if (cap - usedHeight(cur.columns[c], cur) >= stackPx - CM.CAPACITY_EPS) return c;
    }
    return -1;
  }

  /** **U-8 (ביקורת שלמות 19.11) — הכלה ברמת העמוד:** המרזב פרוש על רוחב
   *  תיבת-התוכן כולה; כשהערה מתחייבת בעמוד, **כל** טורי העמוד חייבים לעמוד
   *  מעל המרזב (used ≤ cap−תקציב). בדיקת המחסנית של שורת הסמן לבדה אינה
   *  מספיקה: הסמן עשוי להיכנס לטור פנוי בעוד טור אחר כבר מלא מעבר למרזב
   *  (נמדד: no_long ‏p58 — חדירה 44.5px; mid_long ‏26 עמודים כאלה). אם תנאי
   *  זה נכשל — העמוד נסגר בלי ההערה (הקווים שהוצבו בלעדיה עומדים בקיבולת
   *  המלאה) וההערה עוברת עם שורת הסמן לעמוד הבא — F-17 נשמר. */
  function pageFitsNoteBudget() {
    const cap = colCapacity(cur.template, cur);
    for (let c = 0; c < cur.columns.length; c++) {
      if (usedHeight(cur.columns[c], cur) > cap + CM.CAPACITY_EPS) {
        return false;
      }
    }
    return true;
  }

  // **Iteration-001 (legacy parity — span_1col):** פס H3 באמצע עמוד. המנגנון:
  // רשומות-פס בתוך מערכי הטורים עצמם — כל שורת כותרת הופכת רשומה רגילה
  // (heightPx/gapBeforePx) בטור הימני, ו"צל" שקוף באותו גובה בטור השמאלי
  // (רזרבציה ללא טקסט). כל החשבונות הקיימים (planningUsedHeight, colCapacityOf,
  // containment, retreat) עובדים ללא מקרים מיוחדים; הפס מהווה מחסום-פלח
  // לאיזון/הזזות (האיזון פועל על פלח-הזנב בלבד) ולסדר-קריאה (הליכה מודעת-פלחים
  // ב-protections). הקרנה: materialize מקרין את שורות הפס ברוחב כל הטורים
  // וממורכזות; הצל מוקרן כשורה ריקה (מיפוי 1:1 של המודל נשמר).
  const isBandRec = (ln) => Boolean(ln && (ln.h3Band || ln.h3BandShadow || ln.h3BandTail));
  /** אינדקס תחילת פלח-הזנב — אחרי רשומת הפס האחרונה בטור (0 אם אין פסים). */
  function tailStartOf(col) {
    for (let i = col.length - 1; i >= 0; i--) if (isBandRec(col[i])) return i + 1;
    return 0;
  }
  /** האם לעמוד פסי-H3 באמצע (רשומות פס בתוך הטורים). */
  function pageHasMidBands(page) {
    return (page.columns || []).some(c => c.some(isBandRec));
  }
  /** פלח-הזנב של טור — עותק (הרשומות עצמן משותפות). */
  function tailSegmentOf(col) {
    return col.slice(tailStartOf(col));
  }
  /** איזון פלחי-הזנב של עמוד עם פסים — הפסים עצמם לא זזים (אמנת סינכרון
   *  הגבהים בין הטורים). cap של הפלח = קיבולת העמוד פחות הגובה שלפני הפס. */
  function resplitTailSegments(page, capAll) {
    if ((page.columns || []).length !== 2) return false;
    const s0 = tailStartOf(page.columns[0]), s1 = tailStartOf(page.columns[1]);
    const t0 = page.columns[0].slice(s0), t1 = page.columns[1].slice(s1);
    const h0 = planningUsedHeight(t0), h1 = planningUsedHeight(t1);
    if (Math.abs(h0 - h1) <= imbMax) return false;
    const pre0 = planningUsedHeight(page.columns[0].slice(0, s0));
    const pre1 = planningUsedHeight(page.columns[1].slice(0, s1));
    const preMax = Math.max(pre0, pre1);
    const cap = (capAll != null ? capAll : colCapacity(page.template, page)) - preMax;
    const best = optimalSplit([t0, t1], { cap });
    // **Iteration-001 (legacy parity):** אין פיצול חוקי — או שכל פיצול חוקי-
    // קיבולית שובר ווידוא/יתום/ליווי (unclean) — המילוי נשמר כמו המקור
    // (balanceBlock של המקור: מועמדי min-2; בלי מועמדים — הבלוק נשאר
    // במילויו ואי-האיזון מדווח). פיצול unclean היה יוצר יתומים שהנסיגה
    // נתקעת עליהם בתנודה (נמדד: very_long p43).
    if (!best || !best.clean) return false;
    const seq = [...t0, ...t1];
    const nt0 = seq.slice(0, best.k), nt1 = seq.slice(best.k);
    // GAP_HEAD_POLICY לראש כל פלח-זנב חדש (ראש טור לכל דבר — הפס מעליו)
    if (nt0.length && nt0[0].gapBeforePx) nt0[0] = { ...nt0[0], gapBeforePx: 0 };
    if (nt1.length && nt1[0].gapBeforePx) nt1[0] = { ...nt1[0], gapBeforePx: 0 };
    page.columns[0] = page.columns[0].slice(0, s0).concat(nt0);
    page.columns[1] = page.columns[1].slice(0, s1).concat(nt1);
    trace.emit(page.index, 'balance-resplit-tail', { k: best.k, delta: Math.round(best.delta), clean: best.clean });
    return true;
  }
  /** הצבת פס H3 באמצע העמוד — רשומות לכל שורות הכותרת בטור 0 (עם טקסט)
   *  וצל זהה בטור 1 (רזרבציה ללא טקסט; אותו seq של רשומת הטקסט).
   *  **טוהר מדידה (s5b):** גובה כל רשומת-פס = lineHeightPx המקורי מה-LineModel —
   *  הזנב של הפס (ריפוד תחתון 4 + שוליים 4) הוא רשומה סינתטית נפרדת
   *  (h3BandTail, בלי lineModel) — כמו gapBeforePx, גיאומטריה מתוכננת
   *  ולא שינוי מדידה. הזרימה ממשיכה מטור 0 מתחת לפס (כמו openBlock של המקור).
   *
   *  **RC-F1a (i005 — חוזה spanning אחיד):** עוגן הפס = התחתית המשותפת של
   *  כל הטורים הפתוחים לזרימה — blockBottom של המקור (‏max סמני הטורים,
   *  legacy-imud-flow §2005: `blockBottom() = max(cursor[0], cursor[1])`) —
   *  ועליו פער-הבלוק כמו לכל בלוק הנפתח מתחת לתוכן קיים (pushLines/gapHere),
   *  ואז ריפוד הפס העליון. הצל בכל טור משני מזמין את ההפרש עד העוגן
   *  (‏gapBeforePx גיאומטרי, קבוע כמו הפס עצמו — isFixedBandLine): שני
   *  הטורים מפנים את אותו טווח-y באותו מיקום, והתוכן ממשיך מתחת לפס
   *  באותו y בשני הטורים. עד כאן הצל הוצב בגובה המילוי של הטור המשני
   *  עצמו — הפרש הטורים שנותר אחרי איזון פלחי-הזנב (גרנולריות שורה)
   *  גרם לגוף הטור המשני לחדור לטווח הפס (919 זוגות חפיפה ב-154 עמ',
   *  מול 11 בייחוס — דוח v4/F1; הוכחה: p143 — פס 312.16–334.12 מול
   *  שורת גוף c1.52 ב-316.68). עוגן-max + מרווח-עד-העוגן סוגרים את השורש. */
  function pushH3BandRecords(blk, bandTotal) {
    const n = blk.lines.length;
    const tailPx = H3_BOTTOM_PAD_PX + H3_MARGIN_BOTTOM_PX;
    const gap = cur.columns[0].length ? blockGapPx(settings, lineH) : 0; // GAP_HEAD_POLICY: ראש טור ריק — אין פער (כמו בלוק ריק במקור)
    const usedAll = cur.columns.map(c => planningUsedHeight(c));
    const base = Math.max(...usedAll); // blockBottom של המקור
    const leadPx = gap + H3_TOP_PAD_PX; // פער הבלוק + ריפוד הפס — פעם אחת לפני השורה הראשונה
    const seqs = blk.lines.map(() => seqCounter++);
    for (let i = 0; i < n; i++) {
      const ln = blk.lines[i];
      cur.columns[0].push({
        ...ln,
        h3Band: true,
        kind: 'heading',
        gapBeforePx: i === 0 ? leadPx + (base - usedAll[0]) : 0,
        meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part, h3Band: true },
        seq: seqs[i]
      });
    }
    for (let c = 1; c < cur.columns.length; c++) {
      for (let i = 0; i < n; i++) {
        cur.columns[c].push({
          h3BandShadow: true,
          kind: 'h3band-shadow',
          synthetic: true,
          words: [],
          heightPx: blk.lines[i].heightPx || 0,
          gapBeforePx: i === 0 ? leadPx + (base - usedAll[c]) : 0,
          meta: { tokenId: blk.tokenId, h3BandShadow: true, docPart: blk.part },
          seq: seqs[i]
        });
      }
    }
    for (let c = 0; c < cur.columns.length; c++) {
      // הזנב — רשומה סינתטית בלי lineModel (טוהר המדידה נשמר; בלי seq — אינה תוכן)
      cur.columns[c].push({
        h3BandTail: true,
        kind: 'h3band-tail',
        synthetic: true,
        words: [],
        heightPx: tailPx,
        gapBeforePx: 0,
        meta: { tokenId: blk.tokenId, h3BandTail: true, docPart: blk.part }
      });
    }
    flowCol = 0; // הבלוק הבא נפתח בטור הימני מתחת לפס (כמו openBlock של המקור)
    eventLog.emit('page-plan', 'h3-band-midpage', { token: blk.tokenId, page: cur.index, heightPx: Math.round(bandTotal), lines: n }, cur.index);
    trace.emit(cur.index, 'h3-band-midpage', { token: blk.tokenId, heightPx: Math.round(bandTotal), lines: n, anchor: Math.round(base), leadPx });
  }

  function flushPage() {
    // איזון טורים: Δ≤5px (BRZ-3) — **EXT-8: החלוקה הגלובלית האופטימלית**
    // (פיצול רציף ממזער |lH−rH| בכפוף לקיבולת; סדר קריאה נשמר מבנית — תיקון P0-3
    // מובנה בהגדרת מרחב המצבים; הוכחת מינימליות ב-balancing.optimalSplit)
    // **Iteration-001 (legacy parity):** עמוד עם פסי H3 באמצע — האיזון פועל על
    // פלחי-הזנב בלבד (אחרי הפס האחרון); הפסים והצללים שלהם לעולם אינם זזים
    // בין טורים — אחרת שני הטורים מפסיקים להיות מסונכרנים בגובה הפס.
    if (cur.columns.length === 2) {
      const a0 = usedHeight(cur.columns[0], cur), b0 = usedHeight(cur.columns[1], cur);
      if (Math.abs(a0 - b0) > imbMax) {
        const cap = colCapacity(cur.template, cur);
        // **U-8:** התקציב כבר בתוך cap (לכל טור) — extraLast היה מכפיל אותו
        const best = optimalSplit(cur.columns, { cap });
        if (best && best.k !== cur.columns[0].length && !pageHasMidBands(cur)) {
          const seq = [...cur.columns[0], ...cur.columns[1]];
          cur.columns[0] = seq.slice(0, best.k);
          cur.columns[1] = seq.slice(best.k);
          // **FX-6 (פרוסה 2):** נרמול פערים אחרי הפיצול מחדש — ראש כל טור אינו
          // נושא פער-כניסה (אותו כלל GAP_HEAD_POLICY שבהצבה המקורית).
          normalizeColumnGaps(cur.columns[0]);
          normalizeColumnGaps(cur.columns[1]);
          trace.emit(cur.index, 'balance-resplit', { k: best.k, delta: Math.round(best.delta), clean: best.clean });
        } else if (pageHasMidBands(cur)) {
          resplitTailSegments(cur, cap);
        }
      }
      // מילה נופלת בין טורים (פורטר מ‑Gold) — גם שומר סדר (המילה חוצה את הגבול קדימה)
      // **S5.2 (תיקון 2) + פרוסה 2 (מדידה חוזרת — §2.3):** המיזוג מותר רק אם
      // השורה המקבלת נכנסת ברוחב הטור — **מרוחבי ה-LineModel שכבר נמדדו**
      // (naturalWidthPx של שורת המילה הבודדת + רווח טבעי מה-glue של השורה
      // המקבלת): אפס מדידה חוזרת בתכנון; מילה שאינה נכנסת נשארת בטור המקורי
      // (בלי גלישה אופקית שקטה — מחלקת D-92).
      // **Iteration-001:** בעמוד עם פסים — המיזוג רץ על פלחי-הזנב (קצה טור 0
      // הוא סמוך-קריאה לראש טור 1 רק בתוך אותו פלח; מעבר לפס אינו סמיכות)
      // — ואז כתיבה חזרה של הפלחים לטורים (המיזוג משנה את אורכי הפלחים).
      if (pageHasMidBands(cur)) {
        const s0 = tailStartOf(cur.columns[0]), s1 = tailStartOf(cur.columns[1]);
        const t0 = cur.columns[0].slice(s0), t1 = cur.columns[1].slice(s1);
        if (fixDropWordInColumns([t0, t1], 3, { colW: cur.template.columns[0].w })) {
          cur.columns[0] = cur.columns[0].slice(0, s0).concat(t0);
          cur.columns[1] = cur.columns[1].slice(0, s1).concat(t1);
          eventLog.emit('balance', 'fix-drop-word', { page: cur.index, tail: true }, cur.index);
        }
      } else if (fixDropWordInColumns(cur.columns, 3, { colW: cur.template.columns[0].w })) {
        eventLog.emit('balance', 'fix-drop-word', { page: cur.index }, cur.index);
      }
      const a = usedHeight(cur.columns[0], cur), b = usedHeight(cur.columns[1], cur);
      cur.balanceInfo = { before: [a0, b0], after: [a, b] };
      eventLog.emit('balance', 'column-balance', { page: cur.index, delta: Math.abs(a - b) }, cur.index);
    }
    // Invariant BRZ-14: element height ≤ container height (בכפוף לפס החוצה־טורים — FWD-1)
    for (const col of cur.columns) {
      if (usedHeight(col, cur) > colCapacity(cur.template, cur) + 0.5) {
        const rec = ledger.create('containment', `page#${cur.index}`, cur.index, { used: usedHeight(col, cur), cap: colCapacity(cur.template, cur) }, 'page-plan');
        ledger.transition(rec.issue_id, cur.type === PAGE_TYPES.FILLER ? 'not-comparable' : 'persists', 'page-plan', 'overflow after placement');
        trace.emit(cur.index, 'overflow-after-placement', { used: usedHeight(col, cur), cap: colCapacity(cur.template, cur) });
      }
    }
    trace.emit(cur.index, 'page-flush', { used: cur.columns.map(c => usedHeight(c, cur)), fn: cur.footnotes.length });
    pages.push(cur);
  }

  // **9b.3 (F-9b-1):** תור פריטי-שוליים הממתינים להצבת שורת העוגן הראשונה של
  // הפסקה המארחת שלהם — הפריט נכנס ל-sideNotes של העמוד שבו העוגן באמת מוצב
  // (לא העמוד שבו נפגש ה-H7). מנוקז ב-pushLines בהצבה הראשונה של המארחת;
  // שארית בסוף התכנון = ממצא מפורש.
  const pendingSideByHost = new Map(); // hostTokenId(String) → [rec, …]
  const hostByH7 = new Map(); // 9b.3: ownToken(H7) → hostTokenId הצפוי — לאימות העוגן
  function pushLines(lines, meta = {}, opts = {}) {
    // **FX-6 (פרוסה 2 — הפער כגיאומטריה מתוכננת):** פתיחת בלוק מתחת לתוכן
    // קיים בטור נושאת חותמת `gapBeforePx` על שורת הפתיחה — מקור יחיד שממנו
    // נגזרים גם שער הכניסה (needPx), גם usedHeight (planningUsedHeight)
    // וגם ההקרנה (DOM margin-top / PDF התקדמות-y). ראש טור/עמוד — הפער
    // מדוכא (GAP_HEAD_POLICY); בלוקים רצופים — פער בכל פתיחה. בעבר הפער
    // היה תנאי כניסה בלבד (pendingGap) ולא נצבר בשום מקום במורד הזרם.
    // **FX-1 (דוח 06, שלב 5):** startCol — הצבה מכוונת-ליווי: הטור שאומת
    // למחסנית כותרת+ליווי הוא נקודת הפתיחה. סדר הקריאה נשמר מבנית — אין
    // הצבה לטור מוקדם יותר מנקודת הפתיחה.
    const startCol = Math.max(0, Math.min(opts.startCol != null ? opts.startCol : escortLockCol, cur.columns.length - 1));
    const gap = meta.firstOfBlock ? blockGapPx(settings, lineH) : 0;
    let firstOfCall = true; // הפער שייך לשורה הראשונה של הקריאה בלבד
    let pendingFlushed = false; // 9b.3: ניקוז פריטי-שוליים ממתינים בהצבת השורה הראשונה בלבד
    const flushPendingSideFor = () => {
      if (pendingFlushed || meta.tokenId == null) return;
      const pend = pendingSideByHost.get(String(meta.tokenId));
      if (!pend) return;
      pendingSideByHost.delete(String(meta.tokenId));
      pendingFlushed = true;
      for (const rec of pend) {
        pushAnchoredMarginItem(rec); // cur = העמוד שבו שורת העוגן הראשונה הוצבה זה עתה
        trace.emit(cur.index, 'side-note-attached-to-host-page', { note: rec.ownToken, host: rec.anchorToken });
      }
    };
    for (const ln of lines) {
      let placed = false;
      // **שלב 5 (סדר קריאה מבני):** החיפוש מתחיל בטור הזרימה הנוכחי — שום
      // שורה אינה חוזרת לטור מוקדם מהזרימה (ראה flowCol לעיל).
      for (let c = Math.max(startCol, flowCol); c < cur.columns.length && !placed; c++) {
        // FX-6: החותמת — רק מתחת לתוכן קיים (דיכוי בראש טור/עמוד/אחרי פס).
        // **Iteration-001:** מתחת לפס H3 אין פער-כניסה נוסף — הזנב של הפס
        // (4+4px, בתוך heightPx של רשומת הפס) הוא ההפרדה, כמו openBlock של
        // המקור וכמו הפס העליון (עמוד ריק ⇒ gapHere=0 ממילא).
        const lastRec = cur.columns[c].length ? cur.columns[c][cur.columns[c].length - 1] : null;
        const afterBandRec = Boolean(lastRec && (lastRec.h3Band || lastRec.h3BandShadow || lastRec.h3BandTail));
        const gapHere = firstOfCall && gap > 0 && cur.columns[c].length > 0 && !afterBandRec ? gap : 0;
        const needPx = ln.heightPx + gapHere - CM.CAPACITY_EPS;
        if (colCapacity(cur.template, cur) - usedHeight(cur.columns[c], cur) >= needPx) {
          cur.columns[c].push({ ...ln, meta, seq: seqCounter++, ...(gapHere > 0 ? { gapBeforePx: gapHere } : {}) });
          firstOfCall = false;
          placed = true;
          flowCol = Math.max(flowCol, c); // מונוטוניות הזרימה
          flushPendingSideFor(); // 9b.3: העוגן החזותי הוצב — הפריט נכנס לעמוד זה
          trace.emit(cur.index, 'block-place', { token: meta.tokenId, col: c, lineH: ln.heightPx, gapPx: gapHere });
          // **FX-1:** נעילת ליווי — שורות גוף ראשונות אחרי הכותרת מקריעות את
          // המונה; בהשלמת שורות הליווי — שחרור הנעילה (ההצבה חוזרת לזרימה חופשית).
          if (escortLinesNeeded > 0 && ln.kind !== 'heading') {
            escortLinesNeeded--;
            if (escortLinesNeeded === 0) escortLockCol = 0;
          }
        }
      }
      if (!placed) {
        trace.emit(cur.index, 'block-overflow-newpage', { token: meta.tokenId, lineH: ln.heightPx });
        flushPage();
        cur = newPage(meta.forceType || PAGE_TYPES.REGULAR);
        cur.openedBy = meta.tokenId != null ? meta.tokenId : null; // מעבר עמוד — מי פתח
        cur.columns[0].push({ ...ln, meta, seq: seqCounter++ }); // טור חדש/עמוד חדש → ללא gap (ראש טור)
        firstOfCall = false;
        flushPendingSideFor(); // 9b.3: גם בפתיחת עמוד חדש — העוגן כאן
      }
    }
  }

  /**
   * **תקציב הערות לפני מיקום (F-17 probe==reserved) — כולל מדיניות הערה ארוכה
   * (REQ-FN-02) בזמן ההצבה**, כך שהתקציב תמיד עדכני (ללא תיקון פוסט‑הוק):
   *  - split: החלק הראשון נכנס למרזב העמוד; השאר נכנס לתור pendingBarNotes
   *    ונדחף לראש המרזב של העמוד הבא עם סימון המשך (isContinuation).
   *  - move-whole: ההערה כולה עוברת לעמוד הבא.
   *  - reject-to-body: ההערה חוזרת לגוף כplaceholder `[סמן: טקסט]` + רישום ledger.
   * fn-layout-mode (D-34): block ⇒ תקרת fn-bar-max-height-px נאכפת; continuous ⇒
   * אין תקרה (ההערות זורמות) — מנגנון אמיתי, לא מחלקת CSS בלבד.
   */
  const pendingBarNotes = [];
  function reserveNotes(blk) {
    const notes = (blk.notes || []);
    if (!notes.length) return null;
    // **FX-3 (דוח 06, שלב 5):** תמונת-מצב לשחזור דטרמיניסטי — ההתחייבות
    // חייבת להיות הפיכה כל עוד הפסקה עודנה בהכרעת מיקום. snap.clean=false
    // אחרי פעולות בעלות תופעות לוואי (פיצול/העברה/החזרה לגוף) — אין שחזור
    // אחריהן (המשכים שנוצרו, מצב הבלוק וה-ledger אינם הפיכים בבטחה).
    const snap = { clean: true, footLenBefore: cur.footnotes.length, fnBefore: cur.fnReservedHeightPx || 0, pendingBefore: pendingBarNotes.slice() };
    // המשכים מהעמוד הקודם קודם כל (שמירת סדר ההערות)
    const queue = [...pendingBarNotes.splice(0), ...notes];
    const barMax = settings['fn-layout-mode'] === 'continuous'
      ? Number.POSITIVE_INFINITY
      : (settings['fn-bar-max-height-px'] || Number.POSITIVE_INFINITY);
    for (const n of queue) {
      if (!settings['footnotes-enabled']) {
        // אין מרזב — ההערה חוזרת לגוף כplaceholder; לרזב לא אמורות להגיע הערות
        // כלל במצבים אלה (הpipeline לא שם אותן ב‑blk.notes). שומר בטוח: continue.
        continue;
      }
      // **S71.1 (R7-M4 שארית — בדיקה כפולה):** מעבר ישיר של measureFn — עטיפת
      // החץ שהייתה כאן איבדה את סימון ה-impl (measureWithImpl.impl), וב-impl B
      // (ייצוא PDF) הופעל פקטור הגופן שנועד לטבלת impl A בלבד ⇒ תקציב מרזב
      // מנופח והחלטות split/move-whole מוטות בגבול התקרה. כמו recomputeFnBudget.
      // **פרוסה 2 (מדידה אחת — §2.3 בביקורת):** הערה שכבר נמדדה (חותמת CP2
      // או הטבעה קודמת) אינה נמדדת שוב — noteHeight צורך את החותמת; הטבעה
      // חד-פעמית מתבצעת רק להערה שלא נמדדה מעולם (ונחתמת על המקור — כך
      // שגם העתקים עתידיים שלה לא יימדדו שוב).
      if (n.heightPx == null) stampNoteMetrics(n, settings, measureFn);
      const h = n.heightPx;
      const isCont = n.isContinuation === true;
      // הערה ארוכה מתקרת המרזב ⇒ מדיניות (block mode בלבד; continuous אין תקרה — D-34)
      if (Number.isFinite(barMax) && h > barMax && settings['long-footnote-policy'] !== 'allow') {
        if (settings['long-footnote-policy'] === 'split') {
          // **פיצול אמיתי של הטקסט (פרוסה 2 — מגבולות שורה מוחלטים):** החיתוך
          // נעשה בגבול שורה מהמבנה שכבר נמדד (noteRows) — לא בספירת מילים
          // עם מדידה חוזרת. החלק הראשון נכנס למרזב הזה; השאר נכנס לתור
          // pendingBarNotes עם סימון המשך (isContinuation) — טקסט חדש שמוטבע
          // פעם אחת בלבד (מדידתו הראשונה והאחרונה).
          // **שלב 6 פרוסה 2 (§7 — זהות וטווחים):** המקור וההמשך שומרים קישור
          // מפורש — continuationOf (noteId) + wordRange (טווח מילים במקור):
          // מילה לא נעלמת, לא מוכפלת ולא נסדרת מחדש; ההמשך נמדד כטקסט חדש
          // (חותמת משלו, כולל רוחב '(המשך)' בתקציב שורה 0 — §9).
          const fnLH = n.lineH || noteMetrics(settings).lineHeightPx;
          const rows = n.noteRows || [];
          const linesFit = Math.max(1, Math.floor(barMax / fnLH));
          if (!rows.length || n.linesCount == null || n.linesCount <= linesFit) {
            // כל ההערה נכנסת בגבול התקרה — אין צורך בפיצול
            cur.footnotes.push({ ...n, heightPx: h, mode: isCont ? 'split-rest' : 'normal', isContinuation: isCont });
            continue;
          }
          const cutRow = Math.min(linesFit, rows.length);
          const cutIdx = rows[cutRow - 1].wTo;
          const wordsArr = n.noteWords || String(n.text).replace(/\uE000/g, ' ').split(/\s+/).filter(Boolean);
          if (cutIdx >= wordsArr.length) {
            cur.footnotes.push({ ...n, heightPx: h, mode: isCont ? 'split-rest' : 'normal', isContinuation: isCont });
            continue;
          }
          const firstText = wordsArr.slice(0, cutIdx).join(' ');
          const restText = wordsArr.slice(cutIdx).join(' ');
          const srcNoteId = n.noteId || makeNoteRecord(n, { kind: NOTE_KINDS.FOOTNOTE, numberingScope: settings['footnote-reset-policy'], splitPolicy: 'split' }).noteId;
          cur.footnotes.push({
            ...n, text: firstText, heightPx: cutRow * fnLH, lineH: fnLH, linesCount: cutRow,
            noteRows: rows.slice(0, cutRow), noteWords: wordsArr.slice(0, cutIdx),
            mode: 'split-first', linesShown: cutRow,
            wordRange: { from: n.wordRange ? n.wordRange.from : 0, to: (n.wordRange ? n.wordRange.from : 0) + cutIdx }
          });
          // ההמשך נולד כרשומת חוזה מלאה (makeNoteRecord — זהות+עוגן+מדיניות,
          // עם fragmentIndex ל-noteId) — לא כשק חלקי של המקור.
          const frag = makeNoteRecord(
            { text: restText, marker: n.marker, tokenId: n.tokenId, noteIndex: n.noteIndex, part: n.part },
            {
              kind: NOTE_KINDS.FOOTNOTE,
              numberingScope: settings['footnote-reset-policy'],
              splitPolicy: 'split', continuationPolicy: 'split',
              continuationOf: srcNoteId,
              fragmentIndex: (n.fragmentSeq != null ? n.fragmentSeq : 0) + 1,
              wordRange: { from: (n.wordRange ? n.wordRange.from : 0) + cutIdx, to: (n.wordRange ? n.wordRange.from : 0) + wordsArr.length }
            }
          );
          frag.isContinuation = true;
          frag.mode = 'split-rest';
          frag.fragmentSeq = (n.fragmentSeq != null ? n.fragmentSeq : 0) + 1;
          pendingBarNotes.push(stampNoteMetrics(frag, settings, measureFn));
          snap.clean = false; // נוצר המשך חדש — אין שחזור בטוח
          eventLog.emit('notes-budget', 'fn-split', { token: n.tokenId, marker: n.marker, barMax, firstWords: cutIdx, firstRows: cutRow }, cur.index);
          trace.emit(cur.index, 'note-split', { token: n.tokenId, marker: n.marker, firstRows: cutRow, restRows: n.linesCount - cutRow });
          continue;
        }
        if (settings['long-footnote-policy'] === 'move-whole') {
          pendingBarNotes.push({ ...n, mode: 'moved-whole', deferredToNextPage: true });
          snap.clean = false; // הועברה לעמוד הבא — אין שחזור בטוח
          eventLog.emit('notes-budget', 'fn-moved-whole', { token: n.tokenId, marker: n.marker }, cur.index);
          trace.emit(cur.index, 'note-moved-whole', { token: n.tokenId, marker: n.marker });
          continue;
        }
        if (settings['long-footnote-policy'] === 'reject-to-body' && rejectToBody(n, `bar overflow ${h}>${barMax}`)) {
          snap.clean = false; // מוטציית בלוק+lines — אין שחזור בטוח
          trace.emit(cur.index, 'note-rejected-to-body', { token: n.tokenId, marker: n.marker });
          continue;
        }
      }
      cur.footnotes.push({ ...n, heightPx: h, lineH: n.lineH || noteMetrics(settings).lineHeightPx, isContinuation: isCont, mode: isCont ? 'split-rest' : 'normal' });
    }
    recomputeFnBudget(cur); // probe==reserved — פונקציה אחת (unified) לשני הצרכים
    return snap;
  }

  /**
   * **FX-3 (דוח 06, שלב 5):** שחזור דטרמיניסטי של התחייבות הערות — רק מנתיב
   * snap.clean (המשכים קודמים מוחזרים לתור; פעולות עם תופעות לוואי אינן הפיכות).
   */
  function uncommitNotes(page, snap) {
    page.footnotes.length = snap.footLenBefore;
    page.fnReservedHeightPx = snap.fnBefore;
    pendingBarNotes.length = 0;
    for (const p of snap.pendingBefore) pendingBarNotes.push(p);
  }

  /** **FX-3:** אינדקס שורת הסמן הראשונה של הבלוק (-1 אם אין). */
  function firstMarkerLineOf(blk) {
    return (blk.lines || []).findIndex(ln => (ln.words || []).some(w => String(w).includes(MARK_TAG)));
  }

  /**
   * **FX-3 (דוח 06, שלב 5):** התחייבות הערות בעמוד שבו שורת הסמן עומדת להיות
   * מוצבת, עם נסיגה דטרמיניסטית חד-פעמית אם התקציב חסם את שורת הסמן. F-17
   * נשמר לעמוד ההערה: התקציב נסגר בטרם שורת הסמן ושארית שורות הבלוק.
   * @param {object} blk — הפסקה
   * @param {object|null} markerLine — שורת הסמן (null ⇒ שורה ראשונה של הבלוק)
   */
  function reserveAtMarker(blk, markerLine) {
    const snap = reserveNotes(blk);
    if (!snap) return;
    const isFirst = !markerLine;
    const stack = CM.stackHeightPx([markerLine || blk.lines[0]], isFirst ? blockGapPx(settings, lineH) : 0);
    // **U-8:** גם התאמת שורת הסמן וגם הכלת כל טורי העמוד מעל המרזב —
    // אחרת העמוד נסגר בלי ההערה והיא עוברת עם הסמן לעמוד הבא (F-17).
    if (snap.clean && (ensureRoomFor(stack) === -1 || !pageFitsNoteBudget())) {
      uncommitNotes(cur, snap);
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      reserveNotes(blk);
      if (ensureRoomFor(stack) === -1 || !pageFitsNoteBudget()) {
        // מצב פתולוגי (הערה בגודל עמוד): מתועד, לא שקט
        ledger.create('fn-degenerate', blk.tokenId, cur.index, { reservedPx: cur.fnReservedHeightPx }, 'notes-budget');
      }
    }
  }

  /**
   * **תיקון P0-3 משלים — reject-to-body נשאר מסלול BRZ-15 לגיטימי** (השבה מלאה
   * לגוף; לעולם אין גניזת מילים). פועל בזמן הצבה בלבד (בתוך reserveNotes).
   */
  function rejectToBody(n, reason) {
    const blk = blocks.find(b => b.tokenId === n.tokenId && (b.notes || []).some(x => x.noteIndex === n.noteIndex));
    if (!blk) return false;
    // **D-53:** הסמן בשורות הוא יחידה מתויגת (`עוגן\u00A0\uE102סמן`). ההחלפה:
    // מורידים את התג ומדביקים את טקסט ההערה אחרי הסמן במפריד E000 —
    // `עוגן\u00A0סמן\uE000טקסט` — צורה אחידה עם inline (D-30), נספרת פעם אחת.
    const tagged = (l) => l.words && l.words.some(w => String(w).includes(MARK_TAG));
    const idx = (blk.lines || []).findIndex(tagged);
    if (idx >= 0) {
      blk.lines[idx].words = blk.lines[idx].words.map(w => {
        const sw = String(w);
        if (!sw.includes(MARK_TAG)) return w;
        const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
        return sw.replace(MARK_TAG, '') + '\uE000' + textE;
      });
    } else {
      const textE = String(n.text).replace(/\uE000/g, ' ').replace(/ /g, '\uE000');
      // **פרוסה 2:** סימון synthetic מפורש — שורה שנוצרה בזמן ההצבה (לא ממנוע השורות) — פוטרת מתועד באימות החוזה במקום לדווח שקרי על חוסר LineModel.
      blk.lines.push({ words: [`${n.marker}\uE000${textE}`], heightPx: lineH, isLast: false, tokenId: blk.tokenId, kind: 'paragraph', part: 'rest', synthetic: 'reject-to-body' });
    }
    const ni = (blk.notes || []).findIndex(x => x.noteIndex === n.noteIndex);
    if (ni >= 0) blk.notes.splice(ni, 1); // מקור־אמת יחיד: לא לספור פעמיים
    blk.rejectedNotes = blk.rejectedNotes || [];
    blk.rejectedNotes.push({ tokenId: n.tokenId, noteIndex: n.noteIndex, text: n.text, marker: n.marker, rejected: true, reason });
    ledger.create('fn-out-of-order', `rejected@p${cur.index}`, cur.index, { marker: n.marker, reason }, 'notes-budget');
    eventLog.emit('notes-budget', 'footnote-rejected-to-body', { token: n.tokenId, marker: n.marker, reason }, cur.index);
    return true;
  }


  // **שלב 6 פרוסה 2 (§§7/10):** יצירת פריט עוגן בשוליים (הערת-צד / תיבת
  // מידע) — רשומת מודל-ההערות המאוחד (זהות+עוגן+מדיניות) שמוטבעת בחותמת
  // מדידה **ביצירתה** (מדידה אחת): מכאן ההקצאה האנכית, ה-DOM וה-PDF קוראים
  // את אותה חותמת ואינם מודדים עוד. תיבת המידע נמדדת ברוחב הפנימי שלה
  // (רוחב-מוגדר פחות מסגרת/ריפוד) וגובה התיבה כולה נכנס לחותמת — התקציב
  // וההקצאה מקבלים את התיבה השלמה (אין הזמנה נסתרת בזמן ההצבה).
  function pushAnchoredMarginItem(rec) {
    const isBox = rec.itemKind === 'info-box';
    const kind = isBox ? NOTE_KINDS.INFO_BOX : NOTE_KINDS.SIDE_NOTE;
    const chrome = isBox && rec.boxSpec
      ? { pad: rec.boxSpec.padPx || 0, border: rec.boxSpec.borderPx || 0 }
      : { pad: 0, border: 0 };
    const outerW = (isBox && rec.boxSpec && Number(rec.boxSpec.widthPx) > 0) ? rec.boxSpec.widthPx : null;
    const record = makeNoteRecord({ ...rec, tokenId: rec.ownToken || rec.tokenId }, {
      kind,
      anchorId: rec.anchorToken,
      numberingScope: isBox ? 'style' : 'document',
      continuationPolicy: 'anchor-cascade',
      ...(isBox ? { splitPolicy: 'atomic' } : {})
    });
    stampNote(record, settings, measureFn, kind, {
      ...(outerW != null ? { widthPx: Math.max(12, outerW - 2 * (chrome.pad + chrome.border)) } : {}),
      ...(isBox && rec.boxSpec && Number(rec.boxSpec.sizePt) > 0 ? { sizePt: Number(rec.boxSpec.sizePt) } : {})
    });
    if (isBox) {
      record.boxChrome = chrome;
      record.heightPx = Math.round((record.heightPx + 2 * (chrome.pad + chrome.border)) * 1000) / 1000; // התיבה כולה — תקציב=הצבה=הקרנה
    }
    cur.sideNotes.push(record);
    return record;
  }

  for (let bi = 0; bi < blocks.length; bi++) {
    const blk = blocks[bi];
    const next = blocks[bi + 1];

    // **S10 (REQ-UI-03):** התקדמות שלב הפריסה — "עומד עמוד X מתוך כ־Y" (Y מוערך;
    // מעודכן לספירה הסופית בסיום ה‑DP). בדידות 32 בלוקים — אפס השפעה על הפריסה.
    if (onProgress && (bi & 31) === 0) {
      const est = Math.max(estimatedPages, cur.index + 1);
      onProgress({
        stage: 'page-plan',
        pct: 25 + Math.round(45 * (bi / Math.max(1, blocks.length))),
        label: `עומד עמוד ${cur.index + 1} מתוך כ־${est}`,
        pageIndex: cur.index + 1,
        estimatedTotal: est
      });
    }

    // REQ-HDG-02 (החלטה מאוחדת — headings-escort.applyHeadingModes, D-09):
    // הדגלים נקבעים בpipeline לפני ה‑DP; כאן רק צריכה.
    if (blk.kind === 'heading' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
      flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
      eventLog.emit('page-plan', 'heading-new-page-mode', { token: blk.tokenId }, cur.index);
    }
    // פתיחת חלק (H1) / פתיחת ספר (H0 — PT-04 טור רחיד): עמוד חדש + סימון chapterOpening (D-36)
    // **תיקון S8 (באג חבוי):** המרת סוג עמוד חייבת ליישר גם את מערך הטורים לתבנית
    // החדשה — בעבר נשאר מערך שני־טורי מעל תבנית חד־טורית ⇒ טור פנטום בלי תבנית.
    if (blk.kind === 'heading' && (blk.level === 1 || blk.level === 0)) {
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
      cur.chapterOpening = true;
      cur.type = PAGE_TYPES.PREFACE;
      cur.template = buildPageTemplate(PAGE_TYPES.PREFACE, settings, cur.isRecto !== false);
      reAlignColumns(cur);
      eventLog.emit('page-plan', 'part-opening', { token: blk.tokenId, level: blk.level }, cur.index);
      // **Iteration-003 (legacy parity — כותרת ההקדמה):** ה-h0 נצרך לפס
      // ממורכז בעוגן המכויל (H0_TITLE_Y=309) בתוך השטח השמור של התבנית
      // (H0_AREA_H) — כמו bands.push(kind:'h0-title') במורשת §1326. הזרימה
      // מתחילה מתחת לאזור; עד כאן הכותרת זרמה כשורה ראשונה בראש העמוד.
      if (blk.level === 0 && isImudProfile(settings) && cur.template.columns.length >= 1) {
        const startY = H0_TITLE_Y;
        let yy = startY;
        cur.spanning = {
          lines: blk.lines.map((ln) => {
            const rec = { ...ln, yPx: yy, meta: { tokenId: blk.tokenId, firstOfBlock: true, docPart: blk.part }, seq: seqCounter++ };
            yy += ln.heightPx || 0;
            return rec;
          }),
          heightPx: 0, // free band — חי בשטח השמור; אינו מקצץ את קיבולת הטורים
          freeBand: true, bandTopPx: startY, titleTopPadPx: 0, orn: null
        };
        eventLog.emit('page-plan', 'h0-title-band', { token: blk.tokenId, y: startY }, cur.index);
        continue; // הכותרת הוצבה בפס; הפסקאות ימלאו מתחת לאזור השמור
      }
    }

    // REQ-FN-05/06: heading mode=side-note → הערת שוליים בטור מקביל (H7 doctrine)
    if (blk.kind === 'heading' && blk.asSideNote) {
      // S7.1.2: הערת צד נצמדת לפסקה שהיא מבארת — הבלוק הבא (host) הוא העוגן החזותי.
      // **9b.3 (F-9b-1 — תיקון תזמון במנגנון התכנון):** הרשומה אינה נדחפת לעמוד
      // שבו נפגש ה-H7, אלא ממתינה בתור עד ששורת העוגן הראשונה של המארחת
      // מוצבת בפועל — ואז נכנסת ל-sideNotes של **אותו** עמוד. בעבר, כשה-H7
      // בסוף עמוד N והמארחת נפתחת ב-N+1, הפריט נותר ב-N והמקצה הציב אותו
      // בראש תיבת התוכן (עוגן חזותי בעמוד אחר) — נמדד: 16 פריטים ב-very_long.
      const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph');
      if (host) hostByH7.set(String(blk.tokenId), String(host.tokenId)); // 9b.3: לאימות העוגן הצפוי
      const rec = {
        text: blk.lines.map(l => l.words.join(' ')).join(' ').trim(),
        anchorToken: host ? host.tokenId : blk.tokenId,
        ownToken: blk.tokenId, isHeading: true, level: blk.level, itemKind: 'side-note'
      };
      if (host) {
        const k = String(host.tokenId);
        if (!pendingSideByHost.has(k)) pendingSideByHost.set(k, []);
        pendingSideByHost.get(k).push(rec);
      } else {
        // H7 ללא פסקה מארחת — ממצא מפורש (אינו נעלם בשקט); מוצמד לעצמו כבעבר
        const r7 = ledger.create('h7-without-host', `h7@${blk.tokenId}`, null,
          { token: blk.tokenId, text: rec.text.slice(0, 40) }, 'page-plan');
        ledger.transition(r7.issue_id, 'persists', 'page-plan',
          'H7 side note without a following host paragraph — anchored to itself (documented finding)');
        pushAnchoredMarginItem(rec);
      }
      eventLog.emit('page-plan', 'heading-side-note', { token: blk.tokenId }, cur.index);
      continue;
    }

    // **S11 (REQ-PAR-06):** דגלי פריסה של סגנונות מותאמים על פסקאות —
    // הדגלים נקבעו בפרה־פאס (pipeline) לפני המדידה; כאן רק צריכה (דפוס D-09).
    if (blk.kind === 'paragraph' && blk.customStyle) {
      const cs = blk.customStyle;
      if (cs.layoutMode === 'new-location' && blk.forcePageBreakBefore && cur.columns.some(c => c.length)) {
        flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
        eventLog.emit('page-plan', 'custom-style-new-location', { style: cs.id, token: blk.tokenId }, cur.index);
      }
      if ((cs.layoutMode === 'side-note' && blk.asSideNote) || (cs.layoutMode === 'info-box' && blk.asInfoBox)) {
        // הפסקה הופכת פריט עוגן בשוליים מעוגן לפסקה הבאה שאחריה (המארחת) — דפוס H7;
        // תיבת מידע (info-box) רוכבת על אותו מנגנון עוגן — דרך החוזה וה-registry (§11).
        // **FX-3:** הערות פנימיות של פסקת צד מחויבות כאן — הענף continue
        // מדלג על ההצבה הרגילה (התנהגות קודמת נשמרת).
        // **9b.3:** אותו תיקון תזמון כמו H7 — הפריט נכנס לעמוד שורת העוגן של המארחת.
        if ((blk.notes || []).length) reserveNotes(blk);
        const host = blocks.slice(bi + 1).find(b => b.kind === 'paragraph' && !(b.customStyle && (b.customStyle.layoutMode === 'side-note' || b.customStyle.layoutMode === 'info-box')));
        const recCS = {
          text: blk.lines.map(l => (l.words || []).join(' ')).join(' ').trim(),
          anchorToken: host ? host.tokenId : blk.tokenId,
          ownToken: blk.tokenId, isCustomStyle: cs.id,
          counterMark: cs.counterMark || null,
          itemKind: blk.asInfoBox ? 'info-box' : 'side-note',
          styleSpec: cs.styleSpec || null,
          boxSpec: blk.infoBoxSpec || null
        };
        if (host) {
          const k = String(host.tokenId);
          if (!pendingSideByHost.has(k)) pendingSideByHost.set(k, []);
          pendingSideByHost.get(k).push(recCS);
        } else {
          const rCS = ledger.create('margin-item-without-host', `mi@${blk.tokenId}`, null,
            { style: cs.id, token: blk.tokenId }, 'page-plan');
          ledger.transition(rCS.issue_id, 'persists', 'page-plan',
            'margin item without a following host paragraph — anchored to itself (documented finding)');
          pushAnchoredMarginItem(recCS);
        }
        eventLog.emit('page-plan', blk.asInfoBox ? 'custom-style-info-box' : 'custom-style-side-note', { style: cs.id, token: blk.tokenId }, cur.index);
        continue;
      }
      if (cs.layoutMode === 'full-width' && blk.fullWidth) {
        // פס חוצה־טורים (callout) — דפוס FWD-1 של H2; פס אחד בראש העמוד.
        // אם כבר יש פס/תוכן בעמוד — עמוד חדש (קריאה פותחת מיקום משלה).
        if (cur.spanning || cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.REGULAR); }
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: bandH,
          customStyle: cs
        };
        eventLog.emit('page-plan', 'custom-style-band', { style: cs.id, token: blk.tokenId, heightPx: bandH }, cur.index);
        continue;
      }
    }

    // **FX-3 (דוח 06, שלב 5 — תיקון שורש):** התחייבות ההערות הועברה להכרעת
    // המיקום (להלן, אחרי ensureRoomFor/findSplit) — בעבר רצה כאן, לפני שהיה
    // ידוע היכן הפסקה תוצב: פסקה שנדחקה כולה לעמוד הבא הותירה את הערותיה
    // מאחור (סמן בעמוד N+1, טקסט ההערה במרזב עמוד N — הוכח בדוח 06, FX-3;
    // אף בדיקת הגנה לא זיהתה זאת: המילים כולן קיימות, רק הקולוקציה הופרה).

    // **03.11(ד) — span_1col של המקור ל-H3–H6 (mode=full-width):** עד כאן כותרת
    // שנמדדה ברוחב מלא (674px) הוצבה בטור של 270px — שורה ברוחב 471px בטור
    // חצי-רוחב, נגררת בדפדפן לגלישה/חפיפה ("טקסטים אחד על השני" — דיווח משתמש 3).
    // עתה היא מוצבת בפס חוצה־טורים כמו H2 (FWD-1).
    // **Iteration-001 (legacy parity — span_1col אמיתי):** המקור ממשיך את כותרת
    // הענף **באותו עמוד** ושובר עמוד רק כשאין מקום לפס (legacy-imud-flow:
    // איזון הטורים לפני ההחלטה; סף max(60, גובה-פס+22)). עד כאן הענף שטף את
    // העמוד ללא תנאי בכל כותרת — 335 שבירות-עמוד בקורפוס ההשוואה (מול ~22
    // במקור), 239 מתוכן כשלעמוד הקודם נותר מקום פנוי — הגורם הדומיננטי לפער
    // 699→882 העמודים (מדידות ב-audits/legacy-parity-iteration/iteration-001).
    // עתה: איזון פלחי-הזנב → בדיקת מקום לפי סף המקור → הצבת הפס באמצע העמוד
    // (רשומות-פס בטור הימני + צל בשמאלי); רק אם אין מקום — שטיפה ופס עליון
    // (הנתיב הקיים, ללא שינוי לעמודים ריקים).
    if (blk.kind === 'heading' && blk.level >= 3 && blk.level <= 6 && blk.fullWidth) {
      const bandH3 = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
      const bandTotal = h3BandHeightPx(bandH3);
      const roomNeeded = h3BandRoomThresholdPx(bandTotal);
      const pageHasContent = cur.spanning || cur.columns.some(c => c.length);
      let placedMidPage = false;
      if (pageHasContent && cur.template.columns.length >= 2) {
        // כמו המקור (S4.12): איזון לפני החלטת ה-span — בלוק שמולא חמדנית מנפח
        // את התחתית ופוסל span שהיה נכנס בקלות אחרי איזון.
        resplitTailSegments(cur, colCapacity(cur.template, cur));
        const cap = colCapacity(cur.template, cur);
        const usedMax = Math.max(...cur.columns.map(c => usedHeight(c, cur)));
        // **RC-F1a (i005):** פער הבלוק של הפס עצמו נכלל בבדיקת המקום — כמו
        // curY של המקור (blockBottom כולל מרווח הפסקה העוקב) — אחרת הפס
        // נכנס ב-4px שאינם קיימים ושוקע לתוך תקרית הקיבולת.
        const bandGap = cur.columns[0].length ? blockGapPx(settings, lineH) : 0;
        if (cap - usedMax - bandGap >= roomNeeded - CM.CAPACITY_EPS) {
          pushH3BandRecords(blk, bandTotal);
          placedMidPage = true;
        }
      }
      if (!placedMidPage) {
        if (pageHasContent) {
          flushPage();
          cur = newPage(PAGE_TYPES.REGULAR);
        }
        if (!cur.spanning && cur.template.columns.length >= 2) {
          // **חוזה H3 (D-S2H3/CSS parity):** הפס נושא ריפוד עליון 8px פעם אחת,
          // ריפוד תחתון 4px + שוליים 4px פעם אחת אחרי השורה האחרונה — כמו
          // .block-h3-span ב-CSS המקורי. ה-line-height עצמו (1.22) נקבע במדידה
          // (core/pipeline.js). מקור יחיד: core/h3-contract.js.
          cur.spanning = {
            lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
            heightPx: bandTotal,
            titleTopPadPx: H3_TOP_PAD_PX,
            orn: null
          };
          eventLog.emit('page-plan', 'h3-spanning', { token: blk.tokenId, level: blk.level, heightPx: cur.spanning.heightPx }, cur.index);
          continue; // הכותרת בפס עליון; הבלוקים הבאים ימלאו את הטורים מתחת
        }
        // תבנית חד-טורית — נפילה לנתיב הכותרת הכללי (כמו המקור; הכותרת מוצבת בטור)
      } else {
        continue; // הפס הוצב באמצע העמוד; הבלוקים הבאים ימלאו מתחת לפס
      }
    }

    if (blk.kind === 'heading' && blk.level === 2) {
      // PT-05: עמוד חדש תמיד + סימון פתיחת סימן (D-36) + בניית תבנית מלאה
      // (בעבר בענף ה־else הוחלף סוג העמוד בלי בניית תבנית SIGN_OPEN —
      // נשארה תבנית REGULAR ללא h2-top-offset; תוקן ב‑S8 עם FWD-1)
      if (cur.columns.some(c => c.length)) { flushPage(); cur = newPage(PAGE_TYPES.SIGN_OPEN); }
      else if (cur.type !== PAGE_TYPES.SIGN_OPEN) {
        cur.type = PAGE_TYPES.SIGN_OPEN;
        cur.template = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, settings, cur.isRecto !== false);
        reAlignColumns(cur); // יישור טורים לתבנית (תיקון S8 — טור פנטום)
      }
      cur.chapterOpening = true;
      eventLog.emit('page-plan', 'h2-new-page', { token: blk.tokenId }, cur.index);
      // **Iteration-003 (legacy parity — חוזה פתיחת הסימן):** בפרופיל IMUD
      // כותרת ה-H2 היא פס ממורכז בעוגן המכויל (344.05px — bands של המורשת
      // §1351) בתוך אזור ה-h2 השמור של התבנית — לא שורה בטור. הפס חופשי
      // (freeBand): הוא חי בשטח השמור ואינו מקצץ קיבולת. הסימן נחתם
      // בהטבעה (structural-stamps — h2-siman).
      if (isImudProfile(settings) && cur.template.columns.length >= 2) {
        // **G3/RC-3 (i004) — הכיל הכפול של המורשת (S4.19, flowSection §1335):**
        // פתיחת-סימן שהמקטע שלה נפתח בכותרת רוחבית (h3-span —
        // HEADING_MODES[3]=span_1col היחידי) משתמשת באזור ובעוגנים מורמים: נמדד מהיחוס
        // (עמ' 11: סימן 284.9 / כותרת 321.1 / אזור 261.3) מול פתיחה רגילה (עמ' 24/38:
        // 307.88 / 344.05 / 284.25). במנוע המאוחד היה עוגן קבוע 344.05 בלבד — 69 מתוך 88
        // עמודי היחוס הם פתיחות-עם-span (הדומיננטי).
        const spanExempt = !!(next && next.kind === 'heading' && next.level === 3 && next.fullWidth);
        const startY = spanExempt ? H2_TITLE_Y_SPAN : H2_TITLE_Y;
        cur._h2SpanExempt = spanExempt; // לחותמת פס-הסימן (עוגן דואלי)
        // **Iteration-006 (G3/RC-C1 — שורות כותרת-h2 עטופות דוחפות את ראש הזרימה):**
        // כל שורה עטופה מעבר לראשונה מורידה את ראש הטורים ב-H2_TITLE_LINE_PITCH_PX —
        // הרווח התחתון של האזור נשמר (חוזה flowSection: top = FLOW_TOP + areaH +
        // (h2Lines−1)×30). הוכחת ייחוס p278 «בגדר פסול דלמעלה מעשרים אמה / בנר חנוכה»:
        // ה-H3 שאחרי כותרת דו-שורתית ב-421.45px במדויק; בלי הדחיפה ה-H3 עלה ל-391.45px
        // ונגע בשורת-הכותרת השנייה (374.05–404.05px) — נמדד במאוחד לפני התיקון.
        const h2ExtraLines = Math.max(0, blk.lines.length - 1);
        cur._h2ExtraLines = h2ExtraLines; // לבנייה החוזרת של D-63 (RC-3c — כמו _h2SpanExempt)
        if (spanExempt !== !!cur.template.h2SpanExempt || h2ExtraLines !== (cur.template.h2ExtraLines || 0)) {
          cur.template = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, settings, cur.isRecto !== false, { h2SpanExempt: spanExempt, h2ExtraLines });
          reAlignColumns(cur);
        }
        cur.spanning = {
          lines: blk.lines.map((ln, li) => {
            // **G3/RC-C1:** פס שטוח בין שורות הכותרת — כמו המורשת (y = עוגן + li×30,
            // h=30; נמדד בייחוס p278: Δ=30.0px במדויק מול 30.4 ב-heightPx היחסי).
            const rec = { ...ln, yPx: startY + li * H2_TITLE_LINE_PITCH_PX, meta: { tokenId: blk.tokenId, firstOfBlock: true, docPart: blk.part }, seq: seqCounter++ };
            return rec;
          }),
          heightPx: 0, // free band — חי בשטח השמור; אינו מקצץ את קיבולת הטורים
          freeBand: true, bandTopPx: startY, titleTopPadPx: 0, orn: null
        };
        eventLog.emit('page-plan', 'h2-spanning', { token: blk.tokenId, heightPx: 0, freeBand: true, y: startY }, cur.index);
        continue; // הכותרת הוצבה בפס; הבלוקים הבאים ימלאו את הטורים מתחת לאזור
      }
      // **FWD-1:** H2 שנמדדה ברוחב מלא (mode=full-width, ברירת המחדל) ⇒ פס
      // חוצה־טורים — לא טור חצי־רוחב. הטורים נמדדים מתחת לפס (colCapacity מותאם).
      if (blk.fullWidth && cur.template.columns.length >= 2) {
        const bandH = blk.lines.reduce((s, ln) => s + (ln.heightPx || 0), 0);
        // **S8 (F-08):** הזמנת עיטורי H2 בגודל סופי — בתוך גובה הפס, לפני כל מדידה
        const orn = blk.lines[0] && blk.lines[0].h2Orn;
        const topPad = orn && orn.scope && orn.scope.signTop ? orn.topPx : 0;
        const bottomPad = orn && orn.scope && orn.scope.signBottom ? orn.bottomPx : 0;
        cur.spanning = {
          lines: blk.lines.map((ln, i) => ({ ...ln, meta: { tokenId: blk.tokenId, firstOfBlock: i === 0, docPart: blk.part }, seq: seqCounter++ })),
          heightPx: topPad + bandH + bottomPad,
          titleTopPadPx: topPad,
          orn: orn || null
        };
        eventLog.emit('page-plan', 'h2-spanning', { token: blk.tokenId, heightPx: cur.spanning.heightPx, ornTop: topPad, ornBottom: bottomPad }, cur.index);
        continue; // הכותרת הוצבה בפס; הבלוקים הבאים ימלאו את הטורים מתחתיו
      }
    }

    // REQ-BAL-10: heading escort ≥2 שורות אחרי כותרת H1–H6 באותו טור.
    if (blk.kind === 'heading' && blk.level <= 6) {
      // **Iteration-006 (G4/RC-D1 — הליווי רואה דרך בלוקי-צד):** בלוק הערת-צד
      // (H7/asSideNote) שבין הכותרת לפסקה ריק את בדיקת הליווי — following=0 ⇒
      // הכותרת הוצבה בלי ליווי ושורת הפסקה הראשונה נכנסה לבדה לתחתית הטור
      // (נמדד: p50 — H4 t95, אחריו בלוק-צד t96, ואז פסקה t97 בת 14 שורות;
      // שורה אחת נותרה עם הכותרת, 13 בעמוד הבא — הפרת "מנע-כותרת-יתומה לא
      // ייצר אלמנת-גוף" מבעיה D). העוקב האמיתי לליווי = הבלוק הגופני הראשון
      // אחרי בלוקי-צד/בלוקים ריקים.
      let follower = null;
      for (let fj = bi + 1; fj < blocks.length; fj++) {
        const cand = blocks[fj];
        const isSide = cand.asSideNote === true || (cand.kind === 'heading' && cand.level === 7);
        if (!isSide && cand.lines && cand.lines.length) { follower = cand; break; }
      }
      const following = (follower && follower.lines) ? follower.lines.length : 0;
      if (following >= 1) {
        // **FX-1/FX-5 (דוח 06, שלב 5):** הבדיקה מודדת את המחסנית הפיזית האמיתית
        // (CM.escortStackHeightPx — גבהי הכותרת + פערי כניסה + שורות הליווי)
        // ותוצאתה מנוצלת להצבה מכוונת (escortLockCol/startCol) — בדיקה שאינה
        // קשורה להצבה יוצרת כותרות יתומות שאין להן תיקון (הוכח: FX-1 בדוח 06).
        const escortN = Math.min(CM.ESCORT_MIN_LINES, following);
        let escortStack = CM.escortStackHeightPx(blk, follower, () => blockGapPx(settings, lineH));
        // **Iteration-001 (escort×תקציב-הערות):** פסקת הליווי נושאת לעתים הערות
        // שיוקצו לתקציד המרזב בהצבה בפועל (FX-3 — reserveAtMarker לפני השורות).
        // בדיקת הליווי חייבת לראות את הקיבולת שאחרי ההקצאה: בלי זה נמדד
        // (very_long p43) כותרת-H4 מוצבת בתחתית הטור, התקציד מצטמצם, ושורת
        // הפתיחה של הפסקה נותרת בודדת (orphan-bottom שנסיגת האיזון נתקעה
        // עליו בתנודה). הערכה עליונה שמרנית — גובה ההערות החתום של הפסקה.
        if (settings['footnotes-enabled'] && (follower.notes || []).length) {
          escortStack += follower.notes.reduce((s, n) => s + noteHeight(n, settings, null), 0);
        }
        let pushed = false;
        let room = ensureRoomFor(escortStack);
        if (room === -1) {
          flushPage(); cur = newPage(blk.level === 2 ? PAGE_TYPES.SIGN_OPEN : PAGE_TYPES.REGULAR);
          room = ensureRoomFor(escortStack);
          pushed = true;
        }
        if (room !== -1) {
          eventLog.emit('page-plan', pushed ? 'heading-escort-push' : 'heading-escort-directed', { token: blk.tokenId, page: cur.index, col: room, stackPx: Math.round(escortStack) }, cur.index);
          escortLockCol = room;      // הצבה מכוונת: הכותרת ושורות הליווי — בטור שאומת
          escortLinesNeeded = escortN;
          trace.emit(cur.index, 'escort-directed', { token: blk.tokenId, col: room, stackPx: escortStack, pushed });
        } else {
          const rec = ledger.create('heading-escort', blk.tokenId, cur.index, { stackPx: Math.round(escortStack), capacityPx: colCapacity(cur.template, cur) }, 'protections');
          ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no column fits heading+escort even on fresh page (oversized block)');
        }
      }
    }

    // REQ-BAL-01: candidate search עם capacityBefore/capacityAfter + הקשר הבלוק הבא
    // **FX-5 (דוח 06, שלב 5):** הקיבולת נמדדת ב-yPx אמיתיים (גבהים + פער כניסה)
    // — לא בהמרת lineH; בלוק שנכנס פיזית לא יידחק עוד לעמוד חדש (עמוד ריק פנטום).
    const needStack = CM.stackHeightPx(blk.lines, blockGapPx(settings, lineH));
    let chosenCol = ensureRoomFor(needStack);
    if (chosenCol === -1) {
      // **RC-5d (i004) — בלוק שנכנס לעמוד כמכלול זורם, לא מוזז:** ensureRoomFor
      // בודק טור בודד; בלוק שאינו נכנס לאף טור בנפרד אך נכנס לסך השארית של כל
      // הטורים הפתוחים לזרימה — המורשת מזרימה אותו (breakPara חוצה-טורים,
      // טור-אחר-טור). הזרמה = נפילה לנתיב הרגיל למטה: pushLines ממלא את הטורים
      // הפתוחים זה אחר זה, ורק שארית שאינה נכנסת פותחת עמוד חדש מתוך pushLines
      // עצמו. נמדד לפני התיקון: מסלול זה הגיע ל-findSplit שם maxFit=linesCount ⇒
      // החלון דורש ≥1 ליעד ⇒ null ⇒ הזזה מלאה של הבלוק ושארית-העמוד כולה נשארת
      // ריקה (split-none free=530 עם 18/18 שורות — מקור הספירה לאחור של RC-5c).
      // גרסת הביניים הראשונה של התיקון דילגה ל-splitAt=0 ונפלה בטעות לענף
      // "אין פיצול חוקי" (flush+הזזה מלאה) — ההפך מכוונת התיקון; נמדד:
      // very_long 1021→1111 עמודים. המבנה כאן מבטיח ש-fitsPageTotal אינו
      // עובר כלל דרך ענף ההזזה.
      let totalFree = 0;
      for (let c = Math.max(0, flowCol); c < cur.columns.length; c++) {
        totalFree += Math.max(0, colCapacity(cur.template, cur) - usedHeight(cur.columns[c], cur));
      }
      const fitsPageTotal = needStack <= totalFree + CM.CAPACITY_EPS;
      if (!fitsPageTotal) {
        let splitAt = findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings, generateCandidates, trace, flowCol);
        if (splitAt > 0) {
          // **FX-3:** ההערות מחויבות לעמוד של החלק שבו שורת הסמן:
          // הסמן בחלק הראשון ⇒ כאן; הסמן בהמשך ⇒ בעמוד החדש (לאחר ה-flush).
          const splitMIdx = (blk.kind === 'paragraph' && (blk.notes || []).length && settings['footnotes-enabled'])
            ? firstMarkerLineOf(blk) : -1;
          // **RC-F1c (i005 — שעת הכלה בהתחייבות הסמן של נתיב הפיצול):** עד כאן
          // התחייבות ההערות כאן רצה **בלי שעת הכלה של U-8** (בניגוד ל-reserveAtMarker)
          // — נמדד ב-very_long/IMUD: p600, טור 0 ב-630px קיבל תקציב 112px ⇒
          // חריגת טור 34–63px שנתפסה רק באודיט ההקרנה. כעת: אם התקציב אינו
          // נכנס — הסמן וההערה עוברים יחד לעמוד הבא (F-17): החיתוך נסוג
          // לפני שורת הסמן; סמן בשורה 0 ⇒ אין חיתוך חוקי — נפילה לנתיב
          // "אין פיצול" (שטיפה + התחייבות מבוקרת בעמוד החדש דרך reserveAtMarker).
          if (blk.kind === 'paragraph' && splitMIdx >= 0 && splitMIdx < splitAt) {
            const snap = reserveNotes(blk);
            if (snap && snap.clean && !pageFitsNoteBudget()) {
              uncommitNotes(cur, snap);
              splitAt = splitMIdx > 0 ? splitMIdx : 0;
            }
          }
          if (splitAt > 0) {
            // **FX-6 (פרוסה 2):** החלק הראשון של הפיצול הוא פתיחת בלוק בפועל
            // בטור שמתחתיו תוכן קיים — חותמת פער כמו כל פתיחת בלוק (בעבר חלק
            // הפיצול לא סומן כלל כ-firstOfBlock ⇒ הפער לא נגבה גם כשער כניסה).
            pushLines(blk.lines.slice(0, splitAt - 1), { tokenId: blk.tokenId, part: 'first', firstOfBlock: true, docPart: blk.part });
            pushLines([blk.lines[splitAt - 1]], { tokenId: blk.tokenId, part: 'first', isLast: true });
            flushPage(); cur = newPage(PAGE_TYPES.REGULAR);
            cur.openedBy = blk.tokenId; // מעבר עמוד בפיצול — הבלוק פתח את העמוד החדש
            if (blk.kind === 'paragraph' && splitMIdx >= splitAt) reserveNotes(blk);
            pushLines(blk.lines.slice(splitAt), { tokenId: blk.tokenId, part: 'rest', docPart: blk.part });
            continue;
          }
        }
        // **FX-5/#16 — שמירת עמוד ריק:** אם העמוד ריק משורות גוף — אין טעם לאטום
        // אותו; הבלוק נכנס לכאן (בעבר נאטם עמוד ריק עם הערות יתומות).
        if (cur.columns.some(c => c.length)) {
          flushPage();
          cur = newPage(PAGE_TYPES.REGULAR);
        }
      }
      // fitsPageTotal=true: הבלוק זורם בנתיב הרגיל למטה (pushLines ממלא
      // את הטורים הפתוחים טור-אחר-טור — breakPara של המורשת). chosenCol
      // אינו בשימוש בהמשך; האיפוס לצורך קריאות בלבד.
      chosenCol = 0;
    }
    // **FX-3 (דוח 06, שלב 5):** התחייבות ההערות בעמוד שבו שורת הסמן נוחתת
    // בפועל. שורות שלפני הסמן ממלאות את העמודים הקודמים בלי תקציב (ההערה
    // לא תשהה שם); התקציב נסגר בטרם שורת הסמן ושארית השורות — F-17 נשמר
    // לעמוד ההערה.
    const hasNotes = blk.kind === 'paragraph' && (blk.notes || []).length && settings['footnotes-enabled'];
    const mIdx = hasNotes ? Math.max(0, firstMarkerLineOf(blk)) : 0;
    if (hasNotes && mIdx > 0) {
      pushLines(blk.lines.slice(0, mIdx), { tokenId: blk.tokenId, firstOfBlock: true, docPart: blk.part }, { startCol: escortLockCol });
    }
    if (hasNotes) reserveAtMarker(blk, mIdx > 0 ? blk.lines[mIdx] : null);
    pushLines(blk.lines.slice(mIdx), { tokenId: blk.tokenId, docPart: blk.part, ...(mIdx > 0 ? {} : { firstOfBlock: true }) }, { startCol: escortLockCol });

    if (blk.sideNoteText) pushAnchoredMarginItem({ text: blk.sideNoteText, anchorToken: blk.tokenId, ownToken: blk.tokenId, itemKind: 'side-note' });
  }

  // **9b.3 (F-9b-1):** שארית פריטי-השוליים שהמתינו למארחת שלא הוצבה מעולם —
  // ממצא מפורש (לא גניזה): מוכנסים לעמוד הפתוח הנוכחי, והמארחה תתועד.
  if (pendingSideByHost.size) {
    for (const [hostTok, recs] of [...pendingSideByHost.entries()]) {
      const rP = ledger.create('h7-host-not-placed', `host@${hostTok}`, null,
        { host: hostTok, items: recs.length }, 'page-plan');
      ledger.transition(rP.issue_id, 'persists', 'page-plan',
        `host paragraph ${hostTok} never placed — ${recs.length} side item(s) flushed to current page (documented)`);
      for (const rec of recs) pushAnchoredMarginItem(rec);
      pendingSideByHost.delete(hostTok);
    }
    eventLog.emit('page-plan', 'side-notes-host-flush', { remaining: 0 });
  }

  // **S6.0 (R3-C1 — אובדן תוכן בזנב):** פס חוצה-טורים (H3–H6) או הערת-צד
  // שנותרו לבד בעמוד האחרון (בלי שורות טור ובלי הערות) לא הופיעו בפלט
  // — הם נפלטו ב-flushPage אך התנאי לא כלל אותם ⇒ העמוד לא נסגר מעולם.
  if (cur.columns.some(c => c.length) || cur.footnotes.length
    || (cur.spanning && cur.spanning.lines && cur.spanning.lines.length)
    || (cur.sideNotes && cur.sideNotes.length) || pages.length === 0) flushPage();

  // המשכים שנותרו בתור בסוף המסמך — לא ראוי לגנוז (BRZ-15): נדחפים לעמוד האחרון
  if (pendingBarNotes.length) {
    const last = pages[pages.length - 1];
    const { lineHeightPx: tailLineH } = noteMetrics(settings); // **שלב 5 (#16):** מקור יחיד למדדי ההערה
    for (const n of pendingBarNotes) {
      // **שלב 5 (חילוץ שורש מ-#16 — חותמי מדדים בניקוז הזנב):** התקציב
      // (recomputeFnBudget) מחשב את הגובה מ-noteHeight ממילא, אך ההקרנה
      // צורכת את n.heightPx/n.lineH — בלי החותמים, המשך שנדחף לסוף המסמך
      // מתקדם שורה אחת בלבד ושורותיו חופפות את ההערה שאחריו (תקציב≠הקרנה —
      // בדיוק מחלקת הכשל ש-S70/S71.1 רדפו אחריה).
      last.footnotes.push({
        ...n, // mode/isContinuation preserved (moved-whole stays whole)
        ...(n.heightPx != null ? {} : { heightPx: noteHeight(n, settings, measureFn) }),
        ...(n.lineH != null ? {} : { lineH: tailLineH })
      });
    }
    recomputeFnBudget(last);
    // **שלב 5 (אין fallback שקט):** ההמשכים חייבים להישמר (BRZ-15 — אין אובדן
    // תוכן), אך אם תקציבם חורג מקיבולת העמוד האחרון — נרשם אבחון מפורש
    // (fn-tail-overflow) במקום גלישה שקטה. זהו מצב פתולוגי מבני (המשכים
    // שנצברו בסוף המסמך); לתקנת השורש המלאה נדרש מנגנון עמודי-גלישה להערות
    // — שלב B של התוכנית (דוח 06).
    const tailCap = colCapacityOf(last); // **U-8:** מודע-תקציב, כמו ההצבה
    const tailUsed = planningUsedHeight(last.columns[last.columns.length - 1], last);
    if (tailUsed > tailCap + CM.CAPACITY_EPS) {
      const rec = ledger.create('fn-tail-overflow', `tail@p${last.index}`, last.index,
        { usedPx: Math.round(tailUsed), capPx: Math.round(tailCap), notes: pendingBarNotes.length }, 'notes-budget');
      ledger.transition(rec.issue_id, 'persists', 'notes-budget', 'tail continuations exceed last-page capacity (structural; documented — stage B)');
    }
    eventLog.emit('notes-budget', 'fn-tail-continuation', { count: pendingBarNotes.length, page: last.index }, last.index);
    pendingBarNotes.length = 0;
  }

  // terminal residual fallback (REQ-BAL-04): אם העמוד האחרון ריק למחצה ויש מצב natural — סמן
  if (settings['allow-terminal-residual-fallback']) {
    const last = pages[pages.length - 1];
    if (last && last.columns.every(c => usedHeight(c, last) < colCapacity(last.template, last) * 0.5)) {
      last.terminalResidual = true; // לא מדווח כ‑underfill (B4)
    }
  }

  // **§3.2 (ביקורת PR #16 — העברת פתרון השורש למודל ההערות המאוחד):**
  // reconcileNotesAfterPlacement — אחרי ההצבה המלאה. שורש הפגם: reserveNotes
  // מחייב את **כל** הערות הבלוק בעמוד הסמן **הראשון** (FX-3); כשסמנים
  // מאוחרים של אותו בלוק נוחתים בעמוד הבא (פיצול פסקה / זרימה), ההערות
  // שלהם נשארות עמוד קודם לסמן — "הערה לפני העוגן" (הוכח בפועל:
  // very_long, 6 הפרות — ראה tools/audit-note-anchors.js). התיקון: העברה
  // קדימה של הערה לעמוד הסמן שלה **בקיבולת אמיתית מצטברת** — הטור האחרון
  // של עמוד היעד + התקציב הקיים + ההערות שכבר הועברו אליו. המשכים
  // (isContinuation/split-rest) אינם מוזזים כהערות מקוריות — הם קשורים
  // לזרימת הפיצול של המקור. אין מקום חוקי ⇒ לא מעבירים בכוח — נרשם
  // diagnostic אמיתי (fn-anchor-compromise). זהות נשמרת במלואה: noteId,
  // anchorId, continuationOf, wordRange, סמן ומספור — מוקזים בלבד.
  const reconcileNotesAfterPlacement = () => {
    if (!settings['footnotes-enabled']) return { moved: 0, blocked: 0, movedList: [] };
    // מיפוי טוקן-עוגן → שורות הסמן בפועל (עמוד/טור/שורה + טקסט הסמן)
    const markerLines = new Map();
    for (const pg of pages) {
      pg.columns.forEach((col, ci) => {
        col.forEach((ln, li) => {
          const tok = ln.tokenId != null ? String(ln.tokenId) : (ln.meta && ln.meta.tokenId != null ? String(ln.meta.tokenId) : null);
          if (!tok) return;
          for (const w of (ln.words || [])) {
            const s = String(w);
            const at = s.indexOf(MARK_TAG);
            if (at < 0) continue;
            if (!markerLines.has(tok)) markerLines.set(tok, []);
            markerLines.get(tok).push({ page: pg, col: ci, li, marker: s.slice(at + MARK_TAG.length) });
          }
        });
      });
    }
    const markerRecOf = (n) => {
      const tok = n.tokenId != null ? String(n.tokenId) : (n.anchorId != null ? String(n.anchorId) : null);
      if (!tok) return null;
      const cands = markerLines.get(tok) || [];
      if (!cands.length) return null;
      const mk = String(n.marker != null ? n.marker : '');
      if (mk) {
        const hit = cands.find(m => m.marker === mk);
        if (hit) return hit;
        // טקסט הסמן לא זוהה — נפילה לסמן היחיד של הטוקן בלבד (חד-משמעי);
        // ריבוי סמנים בלי התאמה ⇒ אין זיהוי בטוח — לא מזיזים (כיוון שמרני)
        return cands.length === 1 ? cands[0] : null;
      }
      return cands.length === 1 ? cands[0] : null;
    };
    let movedCount = 0;
    const movedList = [], blocked = [];
    for (const pg of pages) {
      if (!(pg.footnotes || []).length) continue;
      const keep = [];
      let changed = false;
      for (const n of pg.footnotes) {
        const isCont = n.isContinuation === true || n.mode === 'split-rest' || n.continuationOf != null;
        const rec = isCont ? null : markerRecOf(n);
        // חוקי: אין רשומת סמן / אותו עמוד / הסמן בעמוד מוקדם — אין מה לתקן
        if (!rec || rec.page === pg || rec.page.index < pg.index) { keep.push(n); continue; }
        const target = rec.page;
        // הכנסה לפי מיקום הסמן בסדר הקריאה של עמוד היעד — הסדר החזותי במרזב
        // עוקב אחר סדר הסמנים בגוף (מדויק ודטרמיניסטי).
        // **9b.4 (תיקון שורש — סדר המרזב אחרי יישור עוגן):** נמצא ב-very_long
        // (עמ' 834): פסקה חוצת-עמודים שסמן ההערה השני שלה נחת בעמוד הבא, בעוד
        // הערה של פסקה מאוחרת כבר ישבה שם. הסריקה הישנה (מהסוף, עם ברירת
        // מחדל "בסוף") השאירה את ההערה המועברת אחרי הערה שסמנה מאוחר יותר
        // בגוף — אינברסיית סדר מרזב. הכלל הנכון: ההערה נכנסת **לפני** הרשומה
        // הראשונה שסמנה אחרי סמנה שלנו בסדר הקריאה (עמודה/שורה); רשומות
        // שאין להן זיהוי סמן או שסמנן בעמוד אחר נשארות לפנינו (התנהגות
        // שמרנית, כפי שהייתה). אין רשומה כזו ⇒ בסוף הרשימה.
        const tRec = markerRecOf(n);
        let insertAt = target.footnotes.length;
        for (let i = 0; i < target.footnotes.length; i++) {
          const other = markerRecOf(target.footnotes[i]);
          if (other && other.page === target && (other.col > tRec.col || (other.col === tRec.col && other.li > tRec.li))) {
            insertAt = i;
            break;
          }
        }
        target.footnotes.splice(insertAt, 0, n);
        recomputeFnBudget(target);
        // **קיבולת מצטברת אמיתית (U-8 — אמנה אחת):** cap מודע-תקציב, used = שורות
        // בלבד — אותו אי-שוויון בדיוק (שורות ≤ cap−תקציב), כולל הערות שהועברו
        // קודם לאותו עמוד באותה סריקה.
        // **RC-F1c (i005 — סגירת חור רדום בשער ההכלה):** הבדיקה נעשתה על הטור
        // **האחרון** בלבד — מול אמנת U-8 המתועדת ("כל טורי העמוד חייבים לעמוד
        // מעל המרזב"). עמוד שטורו הראשון מלא (נמדד: very_long בהקשר IMUD —
        // p646, טור 0 ב-629.8 מול cap 566.8 אחרי העברת הערה בתקציב 64) קיבל
        // את ההערה בכוח ⇒ חריגת טור של 34–63px. כעת נבדקים כל הטורים —
        // בדיוק כמו pageFitsNoteBudget — שער אחד, אמנה אחת.
        const capWithFn = colCapacityOf(target);
        const allColsFit = target.columns.every(c => planningUsedHeight(c, target) <= capWithFn + CM.CAPACITY_EPS);
        if (allColsFit) {
          changed = true;
          movedCount++;
          movedList.push({ noteId: n.noteId || null, marker: n.marker, from: pg.index, to: target.index });
          eventLog.emit('notes-budget', 'fn-anchor-reconciled', { token: n.tokenId, marker: n.marker, from: pg.index, to: target.index }, target.index);
          trace.emit(target.index, 'note-anchor-reconciled', { token: n.tokenId, marker: n.marker, from: pg.index });
        } else {
          // אין מקום חוקי — לא מעבירים בכוח: נסיגה דטרמיניסטית + פשרה מדווחת
          target.footnotes.splice(insertAt, 1);
          recomputeFnBudget(target);
          keep.push(n);
          blocked.push({ noteId: n.noteId || null, marker: n.marker, notePage: pg.index, markerPage: target.index });
          const rec2 = ledger.create('fn-anchor-compromise', `${n.noteId || n.tokenId}@p${pg.index}`, pg.index,
            { marker: n.marker, notePage: pg.index, markerPage: target.index, reason: 'no-capacity-at-marker-page' }, 'notes-budget');
          ledger.transition(rec2.issue_id, 'persists', 'notes-budget',
            `note cannot move to marker page (capacity): marker p${target.index} > note p${pg.index}`);
        }
      }
      if (changed) {
        pg.footnotes = keep; // הוסרו רק המועברות; הסדר של הנשארות נשמר
        recomputeFnBudget(pg);
      }
    }
    if (movedCount || blocked.length) {
      eventLog.emit('notes-budget', 'fn-anchor-reconciliation', { moved: movedCount, blocked: blocked.length });
    }
    return { moved: movedCount, blocked: blocked.length, movedList };
  };
  const noteAnchorReconciliation = reconcileNotesAfterPlacement();

  // S5.1.4 + S5.1.5: הגנות AFTER every mutation, ואז לולאת נסיגה מאוחדת עם גלאי תנודה
  const assess = (page, s, lg) => runProtections(page, s, lg).violations;
  const retreat = runRetreatLoop({
    pages, settings, ledger, eventLog,
    repairFns: (() => {
      // **FX-2 (דוח 06, שלב 5):** תיקוני רישום-בלבד מסומנים mutates:false —
      // לולאת הנסיגה לא תתייג עוד הפרה סטטית (שאין לה תיקון פעיל) כ"תנודה
      // בין תיקונים מתחרים". התווית ההיסטורית היתה אבחון שקרי: שום תיקון לא רץ.
      const markNoLegalSplit = (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'no legal split exists (documented compromise)');
        }
      };
      markNoLegalSplit.mutates = false;
      const markReadingOrderBlocked = (violations, c) => {
        for (const v of violations) {
          const rec = c.ledger.issues.get(v.ledgerRef);
          if (rec) c.ledger.transition(rec.issue_id, 'correction-blocked', 'protections', 'line moved backward in reading order (bug-guard P0-3; not auto-repaired)');
        }
      };
      markReadingOrderBlocked.mutates = false;
      return {
        'column-imbalance': (violations, c) => {
          for (const v of violations) {
            const pg = pages.find(p => `page#${p.index}` === v.target);
            if (pg) balancePageSafe(pg, c.settings, c.ledger);
          }
        },
        'reading-order-break': markReadingOrderBlocked,
        'widow-bottom': markNoLegalSplit,
        'orphan-top': markNoLegalSplit
      };
    })(),
    assess
  });

  return { pages, ledger, retreat, hash: layoutHash(pages), bodyHash: bodyGeometryHash(pages), trace, noteAnchorReconciliation, hostByH7 };
}

/** איזון בטוח עם rollback (REQ-BAL-09): snapshot כולל footnotes/sideNotes.
 * **EXT-8 — חלוקה גלובלית אופטימלית** (במקום טיפוס גרידי שורה-שורה):
 * מרחב המצבים החוקי = פיצולים רציפים של רצף הקריאה; המינימום הגלובלי של |lH−rH|
 * נמצא ב-O(n) (הוכחה ב-balancing.optimalSplit). סדר קריאה נשמר מבנית.
 * **U-8 (19.11):** הקיבולת מודעת-תקציב לכל טור; ה-|Δ| על שורות בלבד — התקציב
 * משותף לשני הטורים (המרזב פרוש על רוחב תיבת-התוכן כולה). */
function balancePageSafe(page, settings, ledger) {
  const deltaOf = () => {
    // **U-8:** התקציב משותף לשני הטורים (המרזב פרוש על כולם) — הוא אינו
    // משפיע על הפרש האיזון ואינו נכנס לחישוב ה-|Δ|.
    const hh = (c) => c.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    return Math.abs(hh(page.columns[0]) - hh(page.columns[1]));
  };
  const maxDelta = settings['imbalance-max-delta-px'];
  if (deltaOf() <= maxDelta) return true; // כבר מאוזן — אין התערבות (יציבות פריסה)
  if (!page.columns || page.columns.length < 2) return false;
  // **Iteration-001 (legacy parity):** עמוד עם פסי H3 באמצע — הפסים הם
  // מחסומים; האיזון פועל על פלחי-הזנב בלבד (רשומות הפס והצללים לא זזים
  // — אחרת שני הטורים מפסיקים להיות מסונכרנים בגובה הפס). ה-|Δ| של העמוד
  // כולו נגזר מהפלחים ממילא (הפסים שווים בשני הטורים).
  const isBandRecMod = (ln) => Boolean(ln && (ln.h3Band || ln.h3BandShadow || ln.h3BandTail));
  const hasBands = page.columns.some(c => c.some(isBandRecMod));
  if (hasBands) {
    const tailStart = (col) => {
      for (let i = col.length - 1; i >= 0; i--) if (isBandRecMod(col[i])) return i + 1;
      return 0;
    };
    const s0 = tailStart(page.columns[0]), s1 = tailStart(page.columns[1]);
    const t0 = page.columns[0].slice(s0), t1 = page.columns[1].slice(s1);
    const th0 = t0.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    const th1 = t1.reduce((s, ln) => s + (ln.heightPx || 0), 0);
    if (Math.abs(th0 - th1) <= maxDelta) return true; // פלחי-הזנב כבר מאוזנים
    const preMax = Math.max(
      page.columns[0].slice(0, s0).reduce((s, ln) => s + (ln.heightPx || 0), 0),
      page.columns[1].slice(0, s1).reduce((s, ln) => s + (ln.heightPx || 0), 0)
    );
    const capAll = colCapacityOf(page);
    const bestT = optimalSplit([t0, t1], { cap: capAll - preMax });
    // **Iteration-001 (legacy parity):** פיצול unclean אינו מוחל — המקור אינו
    // מפצל בלוק בלי מועמד min-2 חוקי; אי-האיזון נשאר מדווח.
    if (!bestT || !bestT.clean) {
      const recT = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: bestT ? 'unclean-seam' : 'capacity', tails: true, delta: Math.round(deltaOf()) }, 'balance');
      ledger.transition(recT.issue_id, 'correction-blocked', 'balance', bestT ? 'only unclean tail splits exist (widow/orphan/escort) — fill preserved like legacy balanceBlock' : 'no capacity-legal tail split exists (band barriers preserved)');
      return false;
    }
    const seqT = [...t0, ...t1];
    const nt0 = seqT.slice(0, bestT.k), nt1 = seqT.slice(bestT.k);
    if (nt0.length && nt0[0].gapBeforePx) nt0[0] = { ...nt0[0], gapBeforePx: 0 };
    if (nt1.length && nt1[0].gapBeforePx) nt1[0] = { ...nt1[0], gapBeforePx: 0 };
    const snapCols = page.columns.map(c => c.slice());
    page.columns[0] = page.columns[0].slice(0, s0).concat(nt0);
    page.columns[1] = page.columns[1].slice(0, s1).concat(nt1);
    const overflowsT = (c, ci) => {
      const hh = c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
      return hh > colCapacityOf(page, { colIndex: ci }) + 0.5;
    };
    if (page.columns.some(overflowsT)) {
      page.columns = snapCols;
      const recR = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity', tails: true }, 'balance');
      ledger.transition(recR.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after tail move');
      return false;
    }
    return true;
  }
  // **S5.2 (P-2 — קיבולת מאוחדת):** colCapacityOf — כולל הפס החוצה־טורים
  // (בעבר חושב מ-contentBox.height גולמי ⇒ איזון שגלש מתחת לפס בעמודי H2).
  // **U-8 (19.11):** תקציב ההערות בתוך cap לכל טור — extraLast הוסר (היה
  // מכפיל את התקציב על הטור האחרון).
  const cap = colCapacityOf(page);
  const best = optimalSplit(page.columns, { cap });
  if (!best || best.k === page.columns[0].length) {
    // **EXT-8:** אין פיצול חוקי, או שהנוכחי כבר האופטימלי הגלובלי — הפרש שנותר
    // מעל הסף הוא **פשרה מתועדת**: שלמות פסקה (הימנעות מיתום/ווידוא בגבול
    // התפר) גוברת על Δ≤5px (למשל: פסקה בת 15 שורות שנכנסת שלמה לטור אחד).
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index,
      { reason: best ? 'at-optimum' : 'capacity', delta: Math.round(deltaOf()), bestK: best ? best.k : null },
      'balance');
    ledger.transition(rec.issue_id, 'correction-blocked', 'balance',
      best ? 'global optimum reached: any further move creates widow/orphan at the seam (paragraph integrity preferred over Δ-threshold)'
           : 'hard reject: no capacity-legal split exists');
    return false;
  }
  const snapshot = { cols: page.columns.map(c => c.slice()), fn: page.footnotes.slice(), sn: page.sideNotes.slice() };
  const seq = [...page.columns[0], ...page.columns[1]];
  page.columns[0] = seq.slice(0, best.k);
  page.columns[1] = seq.slice(best.k);
  // **FX-6 (פרוסה 2):** נרמול פערים אחרי הפיצול מחדש — ראש כל טור אינו
  // נושא פער-כניסה (GAP_HEAD_POLICY). נעשה לפני בדיקת החריגה כדי שההשוואת
  // קיבולת תראה את הגיאומטריה האמיתית שתוקרן (כולל הפערים שנותרו בגוף הטור).
  normalizeColumnGaps(page.columns[0]);
  normalizeColumnGaps(page.columns[1]);
  // hard reject: חריגת קיבולת אחרי ההחלפה (הגנה כפולה — optimalSplit כבר מסנן) → rollback מלא
  // **S5.2 (P-2) + FX-6:** קיבולת אפקטיבית פר-טור (פס + תקציב על הטור האחרון + פערי
  // בלוקים) — מקור יחיד; הפערים קבועים ואינם מתמתחים עם aqStretch.
  const overflows = (c, ci) => {
    const hh = c.reduce((s, ln) => s + (ln.heightPx || 0) * (ln.aqStretch || 1) + (ln.gapBeforePx || 0), 0);
    return hh > colCapacityOf(page, { colIndex: ci }) + 0.5;
  };
  if (page.columns.some(overflows)) {
    page.columns = snapshot.cols; page.footnotes = snapshot.fn; page.sideNotes = snapshot.sn;
    const rec = ledger.create('rollback-compromise', `balance@p${page.index}`, page.index, { reason: 'capacity' }, 'balance');
    ledger.transition(rec.issue_id, 'correction-reverted', 'balance', 'hard reject: overflow after move (not soft ×2000)');
    return false;
  }
  return true;
}

/** בחירת נקודת פיצול עם הגנות widow/orphan (≥2 שורות לכל צד). */
function findSplit(blk, cur, colCapacity, usedHeight, lineH, ledger, eventLog, settings = {}, candidatesFn = null, trace = null, fromCol = 0) {
  const cap = colCapacity(cur.template, cur);
  // **RC-5c (i004) — המקום הפנוי הוא של כל הטורים שהזרימה עוד יכולה למלא:**
  // עד כאן נספר רק הטור האחרון — part1 נמדד לשטח של טור אחד אך pushLines
  // הציב אותו מהטור הראשון של הזרימה ⇒ הטור השני לא מולא מעולם, ואיזון
  // ה-flush משך את העמוק לחצי הסך — עמודים שלמים עצרו ~5 שורות מעל התחתית
  // (הוכח: NEW p136 עוצר ב-y649 מול OLD p140 שממלא שני טוריו עד y769
  // באותו תוכן; מקור הדומיננטי של עמודי גוף שאינם מגיעים לתחתית). המורשת
  // ממלאת את שארית שני הטורים בטרם עוברת עמוד (breakPara זורם טור-אחר-טור).
  let free = 0;
  for (let c = Math.max(0, fromCol); c < cur.columns.length; c++) {
    free += Math.max(0, cap - usedHeight(cur.columns[c], cur));
  }
  // **FX-5 (פרוסה 2 — השלמת תיקון השורש):** maxFit נספר מהגבהים האמיתיים
  // (heightPx מצטבר + פער הכניסה של הבלוק) מול המקום הפנוי — לא מהמרת
  // lineH. ההמרה ההיסטורית (floor(free/lineH)) פסלה פיצולים חוקיים בכל בלוק
  // שאינו אחיד-גבהים (כותרות/פסקאות-גוף גבוהות): maxFit נמוך מהאמת ⇒ החלון
  // התכווץ ⇒ הזזה מלאה על פיצול שהיה נכנס.
  const gap0 = blockGapPx(settings, lineH);
  let maxFit = 0, acc = 0;
  for (let i = 0; i < blk.lines.length; i++) {
    const add = (i === 0 ? gap0 : 0) + (blk.lines[i].heightPx || 0);
    if (acc + add > free + CM.CAPACITY_EPS) break;
    acc += add; maxFit = i + 1;
  }
  // **שלב 5 (#16) + פרוסה 2 (מקור יחיד):** חלון הפיצול החוקי —
  // constraint-matrix.legalSplitWindow: **RC-5b (i004):** בגבול העמוד המינימום
  // הוא שורה אחת לכל צד (זרימה גרידית כמו המורשת — זנבות 1-2 שורות בראש
  // העמוד הבא קיימים בייחוס, 43 עמודים; S4.18). המינימום 2-לכל-צד נשאר
  // לפיצולים הפנימיים בין טורים. null ⇒ אין פיצול חוקי → הזזה מלאה.
  const win = CM.legalSplitWindow(blk.lines.length, maxFit, { minPerSide: 1 });
  if (!win) {
    if (trace) trace.emit(cur.index, 'split-none', { token: blk.tokenId, lines: blk.lines.length, maxFit, free: Math.round(free) });
    return 0; // אין פיצול חוקי → הזזה מלאה
  }

  if (candidatesFn) {
    // **RC-5a (i004):** המועמדים מקבלים את **המקום הפנוי בפועל** של הטור
    // היעד (cap−used) — לא את הקיבולת המלאה. הניקוד ממזער את השארית
    // בטור הנוכחי (מילוי גרידי כמו המורשת); עם הקיבולת המלאה הוא
    // התנהג כאילו הטור ריק ואיזן את גובה שני חלקי הבלוק (חצי-חצי).
    const cands = candidatesFn(blk, maxFit, free, settings, ledger, { minPerSide: 1 });
    if (cands.length) {
      eventLog.emit('protections', 'candidate-split', { token: blk.tokenId, at: cands[0].cut, score: cands[0].score });
      if (trace) trace.emit(cur.index, 'split-candidate', {
        token: blk.tokenId, cut: cands[0].cut, score: cands[0].score,
        window: [win.lo, win.hi], candidates: cands.length,
        rejected: (cands.rejections || []).length
      });
      return cands[0].cut;
    }
    if (trace) trace.emit(cur.index, 'split-candidates-exhausted', { token: blk.tokenId, window: [win.lo, win.hi], rejected: (cands.rejections || []).length });
  }
  eventLog.emit('protections', 'legal-split', { token: blk.tokenId, at: maxFit });
  if (trace) trace.emit(cur.index, 'split-legal-maxfit', { token: blk.tokenId, at: maxFit, window: [win.lo, win.hi] });
  return maxFit;
}

module.exports = { planPages, layoutHash, bodyGeometryHash, lineTokenId, moveLineForward, balancePageSafe, readConfig, LineBreaker, GEO, FLOW_BOTTOM, SINGLE_W, SZ: SZ_CORE, headingItemH, wrapText };
