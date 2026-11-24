// src/engine/output/pagemodel-dom-renderer.js — **שלב 8 פרוסה 3 (§2): מקרין DOM טהור מ-PageModel בלבד.**
'use strict';

/**
 * חוזה (הוראת שלב 8 §2.2): המקרין הזה מקבל **עמוד מתוך PageModel** ומצייר
 * אותו בלבד. אסור לו למדוד גופנים/מילים, לחשב רוחבים, לשבור שורות, לבצע
 * wrapping/reflow, להחליט מיקום/סדר, לחשב מחדש חלוקת הערות, גיאומטריית
 * עיטורים, מידות תמונות או fit — ולא להשלים מידע חסר ב-fallback שקט.
 *
 * כל x/y/w/h, baseline, מידות, סדר שכבות, מפתח גופן, צבע, asset identity
 * ועוגן מגיעים מהמודל. מה שמותר: טעינת/פענוח משאבים לצורך ציור (תמונות,
 * data-URI של SVG) ואריזת-תצוגה בלבד (מחלקות CSS, כרום). אם חסר מידע
 * חיוני — המקרין מדווח diagnostic גלוי (dataset + onDiagnostic) ולא משלים
 * בעצמו (התיקון שייך לבונה המודל).
 *
 * מבנה ה-DOM שומר במכוון על אותם עוגנים שהאודיט החי בודק (.page/.column/
 * .line/.footnotes/.fn-rule/.side-note/.orn) — כך שכל כלי הבדיקה הקיימים
 * עובדים על הפרופיל המאוחד בלי שכפול מנגנונים.
 */

const { scrubPUAText } = require('../core/pua-text');
const { familyOfFontKey } = require('../typography/font-keys');
const { resolveAssetRef } = require('../decoration/asset-registry');
const { PT_CLASS, bgRgba, fontStack } = require('./dom-renderer');

const PT_TO_PX = 96 / 72;
const px2 = (v) => Math.round(v * 100) / 100;

/** צבע שאינו שחור — null אחרת (כמו הרנדרר הקיים; שחור ⇒ ירושת ברירת מחדל). */
function nonBlack(c) {
  if (!c || typeof c !== 'string') return null;
  const s = c.trim().toLowerCase();
  if (s === '#000' || s === '#000000' || s === 'black' || s === 'rgb(0, 0, 0)') return null;
  return c;
}

/** משפחת תצוגה למפתח גופן מהמודל (§2.2 — זהות מהמודל; 'body'/null ⇒ ירושת שורש). */
function familyOf(key) {
  const fam = familyOfFontKey(key);
  return fam ? fontStack(fam) : null;
}

// ─── שורת טקסט: תיבה ממוקמת מהמודל + מילים ממוקמות מהמודל ───
/**
 * כל שורה = div.line ממוקם ב-(x,y,w,h) מהמודל; כל מילה = span.w ממוקם
 * ב-x הסופי שלה (כולל הקצאת דבק/יישור שנקבעה בתכנון). הדפדפר אינו זז
 * דבר — גם לא מילים בתוך השורה. הקו-בסיס נופל באותה נוסחת half-leading
 * שבה הסמכות (attachBaselines) חישבה את baselineY במודל.
 */
/** **RC-A1 (i006 — רווח בין שורות של אותו טקסט לוגי):** השורות ממוקמות-מוחלט
 *  ואין ביניהן רווחי-זרימה; בתוך שורה מוכנסת צומת רווח (renderModelLine),
 *  אך בין שורות באותו מיכל לוגי — ביאור-צד, שורות הערה, פס — לא נוסף
 *  דבר, ו-textContent מתמזג בכל צומת-שורה (נמדד: 8,848 מילים מודבקות
 *  בביאורי-הצד + 626 בהערות-הגוף ב-very_long ⇒ רצפת הנפח של האודיט החי
 *  נכשלה 341,160 < 345,999; גם העתקה ונגישות נפגעות). מקור אחד לכל
 *  המיכלים: צומת רווח לפני כל שורה שאינה הראשונה באותו טקסט. הרווח
 *  אינו נראה (whitespace בתחילת מיכל ממוקט-מוחלט מתמוטם). */
function appendLineSep(container, doc, isFirstLogicalLine) {
  if (!isFirstLogicalLine && typeof doc.createTextNode === 'function') {
    container.appendChild(doc.createTextNode(' '));
  }
}

function renderModelLine(ml, doc, relX, relY) {
  const el = doc.createElement('div');
  el.className = 'line'
    + (ml.isLast ? ' line--last' : '')
    + (ml.kind === 'heading' ? ' line--heading' : '')
    + (ml.kind === 'toc-title' ? ' toc-title' : '')
    // **Iteration-006 (RC-W1 — חלון קלאסי שקוע):** שורת ההמשך של פסקת-חלון
    // (window בלי windowWords) נמדדה ברוחב מוקטן — השפה הימנית תפוסה
    // בכוונה ע"י החלון המרחף (חוזה המקור: float height:1.25em על שתי
    // השורות; מדידת ייחוס p44: שורה 2 מסתיימת ב-472 מול קצה טור 513).
    // המחלקה מסמנת לאודיט החי לדלג על בדיקת היישור — אותה החלטה כמו
    // line--window-wrap במקרין המורשת (dom-renderer S4.26); הגיאומטריה
    // עצמה כבר מצומצמת במודל (w=colW−windowW, עוגן שמאלי בשפת הטור).
    + (ml.window && !ml.windowWords && ml.windowW ? ' line--window-wrap' : '');
  el.setAttribute('dir', 'rtl');
  el.style.position = 'absolute';
  el.style.left = `${px2(ml.x - relX)}px`;
  el.style.top = `${px2(ml.y - relY)}px`;
  el.style.width = `${px2(ml.w)}px`;
  el.style.height = `${px2(ml.h)}px`;
  el.style.lineHeight = `${px2(ml.h)}px`;
  if (ml.align) el.style.textAlign = ml.align === 'stretch' ? 'justify' : ml.align;
  if (ml.sizePt != null) el.style.fontSize = `${px2(ml.sizePt * PT_TO_PX)}px`;
  if (ml.bold) el.style.fontWeight = '700';
  if (ml.letterSpacingPx) el.style.letterSpacing = `${px2(ml.letterSpacingPx)}px`;
  // Diagnostic provenance from the immutable PageModel; no layout behavior changes.
  el.dataset.modelY = String(ml.y);
  el.dataset.modelH = String(ml.h);
  el.dataset.modelAQ = String(ml.aqStretch != null ? ml.aqStretch : 1);
  el.dataset.modelGap = String(ml.gapBeforePx != null ? ml.gapBeforePx : 0);
  if (ml.sourceTokenId != null) el.dataset.sourceTokenId = String(ml.sourceTokenId);
  if (ml.styleClass) el.dataset.styleClass = ml.styleClass;
  if (ml.id) el.dataset.id = ml.id;
  const tok = ml.sourceTokenId != null ? ml.sourceTokenId : null;
  if (tok != null) el.dataset.token = tok;
  // **תוויות רווח בין המילים:** המילים ממוקמות-מוחלט ולכן אין רווחי-זרימה
  // ביניהן; בלי צומת רווח מפורשת textContent מתמזג למילה אחת — שובר
  // ספירת נפח (רצפת האודיט), העתקה ונגישות. הרווח אינו נראה.
  let firstWord = true;
  for (const wd of (ml.words || [])) {
    if (!firstWord && typeof doc.createTextNode === 'function') el.appendChild(doc.createTextNode(' '));
    firstWord = false;
    const span = doc.createElement('span');
    // **Iteration-006 (RC-W1):** מילת-החלון (fontKey 'window') מסומנת
    // w--window — כמו במקרין המורשת; האודיט החי בודק את מיקומה (צמודה
    // לקצה הימני, הדיו הראשון בשורה) דרך המחלקה הזו בדיוק.
    span.className = 'w' + (wd.mk ? ' w--fnmarker' : '') + (wd.fontKey === 'window' ? ' w--window' : '');
    span.style.position = 'absolute';
    span.style.left = `${px2(wd.x - ml.x)}px`;
    span.style.top = '0';
    span.style.whiteSpace = 'pre';
    if (wd.sizePt != null) span.style.fontSize = `${px2(wd.sizePt * PT_TO_PX)}px`;
    const fam = familyOf(wd.fontKey);
    if (fam) span.style.fontFamily = fam;
    const col = nonBlack(wd.color);
    if (col) span.style.color = col;
    span.textContent = scrubPUAText(wd.text);
    el.appendChild(span);
  }
  return el;
}

// ─── עיטור: דיו מהמודל בלבד (§2.2) ───
function renderModelDecoration(d, doc, diags) {
  const el = doc.createElement('div');
  el.className = d.cssClass || 'orn';
  if (d.slot) el.dataset.slot = d.slot;
  if (d.kindStyle) el.dataset.kindStyle = d.kindStyle;
  el.style.position = 'absolute';
  el.style.left = `${px2(d.x)}px`;
  el.style.top = `${px2(d.y)}px`;
  el.style.width = `${px2(d.w)}px`;
  el.style.height = `${px2(d.h)}px`;
  if (d.ornId) el.dataset.ornId = d.ornId;
  if (d.zOrder != null) el.style.zIndex = String(d.zOrder);
  const ink = d.ink || (d.image ? { type: 'image', uri: null, ref: d.image } : null);
  if (ink && ink.type === 'image') {
    const uri = (ink.ref ? (resolveAssetRef(ink.ref) || {}).uri : null) || ink.uri || (d.image ? (resolveAssetRef(d.image) || {}).uri : null);
    if (uri) {
      el.style.backgroundImage = `url("${uri}")`;
      el.style.backgroundSize = '100% 100%';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.dataset.inkMissing = '1';
      diags.push({ kind: 'pmr-decoration-ink-missing', ornId: d.ornId || null, slot: d.slot || null });
    }
  } else if (ink && ink.type === 'svg' && ink.uri) {
    el.style.backgroundImage = `url("${ink.uri}")`;
    el.style.backgroundSize = 'contain';
    el.style.backgroundPosition = 'center center';
    el.style.backgroundRepeat = 'no-repeat';
  } else if (ink && ink.type === 'rule') {
    el.style.borderTop = '0.75px solid #000';
    el.style.height = '0px';
  } else if (ink && ink.type === 'rect' && ink.color) {
    el.style.backgroundColor = `rgb(${ink.color[0]}, ${ink.color[1]}, ${ink.color[2]})`;
  } else if (d.kindStyle && d.kindStyle !== 'none') {
    el.dataset.inkMissing = '1';
    diags.push({ kind: 'pmr-decoration-ink-missing', ornId: d.ornId || null, slot: d.slot || null });
  }
  if (d.inkMissing) { el.dataset.inkMissing = '1'; if (!d.kindStyle) diags.push({ kind: 'pmr-decoration-ink-missing', ornId: d.ornId || null, slot: d.slot || null }); }
  return el;
}

// ─── עמוד שלם ───
/**
 * @param {object} mp — עמוד מתוך PageModel (model.pages[i])
 * @param {object} settings — הגדרות (ברירות מחדל גלובליות בלבד: גוף/רקע/כרום)
 * @param {object} doc — מפעל DOM
 * @param {object} [opts] — { onDiagnostic?: (d)=>void }
 * @returns {HTMLElement} אלמנט העמוד
 */
function renderModelPage(mp, settings, doc, opts = {}) {
  const diags = [];
  const geo = mp.geometry || {};
  const root = doc.createElement('article');
  root.className = (PT_CLASS[mp.type] || 'page') + ' pmr-page';
  root.dataset.pageIndex = String(mp.index);
  root.setAttribute('id', `page-${mp.index}`);
  root.setAttribute('dir', 'rtl');
  if (geo.width != null) { root.style.width = `${px2(geo.width)}px`; root.dataset.modelWidth = String(geo.width); }
  if (geo.height != null) { root.style.height = `${px2(geo.height)}px`; root.dataset.modelHeight = String(geo.height); }
  // ברירות מחדל גלובליות (הגדרות משתמש — לא החלטות עימוד): גוף/רקע
  const bf = settings['body-font'];
  if (bf) root.style.fontFamily = fontStack(bf);
  const bodyCol = nonBlack(settings['body-color']);
  if (bodyCol) root.style.color = bodyCol;
  const bsPt = Number(settings['body-font-size-pt']);
  if (Number.isFinite(bsPt) && bsPt > 0) root.style.fontSize = `${px2(bsPt * PT_TO_PX)}px`;
  const bg = settings['background-color'];
  const bgOp = settings['background-opacity'];
  if (bg && bg !== '#ffffff') root.style.backgroundColor = bgRgba(bg, bgOp != null ? bgOp : 1);
  else if (Number.isFinite(bgOp) && bgOp < 1) root.style.backgroundColor = bgRgba('#ffffff', bgOp);

  // (1) עיטורי רקע (סלוטים מהמודל: page-*/shaar-* — מתחת לתוכן)
  const decoAll = mp.decorations || [];
  const isBg = (d) => /^(page-|shaar-)/.test(String(d.slot || '')) || d.kind === 'page-background' || d.kind === 'page-texture' || d.kind === 'shaar-crown';
  for (const d of decoAll) {
    if (!isBg(d)) continue;
    root.appendChild(renderModelDecoration(d, doc, diags));
  }

  // (2) תיבת השער (כרום בלבד — variant + rect מהמודל) ושורותיה החותמות
  if (mp.shaar) {
    const wrap = doc.createElement('div');
    wrap.className = `shaar-content shaar-content--${mp.shaar.variant}`;
    wrap.setAttribute('dir', 'rtl');
    wrap.style.position = 'absolute';
    wrap.style.left = `${px2(mp.shaar.box.x)}px`;
    wrap.style.top = `${px2(mp.shaar.box.y)}px`;
    wrap.style.width = `${px2(mp.shaar.box.w)}px`;
    wrap.style.height = `${px2(mp.shaar.box.h)}px`;
    for (const ln of mp.lines.filter(l => l.area === 'structural')) {
      wrap.appendChild(renderModelLine(ln, doc, mp.shaar.box.x, mp.shaar.box.y));
    }
    root.appendChild(wrap);
  } else if ((mp.lines || []).some(l => l.area === 'structural')) {
    // שורות מובנות בלי תיבה (TOC/כותרת הערות) — מוקרנות ישירות בקואורדינטות העמוד
    for (const ln of mp.lines.filter(l => l.area === 'structural')) {
      root.appendChild(renderModelLine(ln, doc, 0, 0));
    }
  }

  // (3) עמוד מותאם — תיבות ותמונות בגיאומטריה סופית מהמודל
  if (mp.custom) {
    for (const b of (mp.custom.boxes || [])) {
      const el = doc.createElement('div');
      el.className = 'custom-box';
      el.setAttribute('dir', 'rtl');
      el.style.position = 'absolute';
      el.style.left = `${px2(b.x)}px`; el.style.top = `${px2(b.y)}px`;
      el.style.width = `${px2(b.w)}px`; el.style.height = `${px2(b.h)}px`;
      el.textContent = scrubPUAText(b.text || '');
      root.appendChild(el);
    }
    for (const im of (mp.custom.images || [])) {
      const el = doc.createElement('div');
      el.className = 'custom-image';
      el.style.position = 'absolute';
      el.style.left = `${px2(im.x)}px`; el.style.top = `${px2(im.y)}px`;
      el.style.width = `${px2(im.w)}px`; el.style.height = `${px2(im.h)}px`;
      if (im.src) el.style.backgroundImage = `url("${im.src}")`;
      else { el.dataset.assetMissing = '1'; diags.push({ kind: 'pmr-custom-image-missing' }); }
      root.appendChild(el);
    }
  }

  // (4) פס חוצה-טורים — מלבן הפס מהמודל; שורותיו בתוכו בקואורדינטות יחסיות
  if (mp.spanning) {
    const band = doc.createElement('div');
    band.className = 'spanning-band';
    band.setAttribute('dir', 'rtl');
    band.style.position = 'absolute';
    band.style.left = `${px2(mp.spanning.x)}px`;
    band.style.top = `${px2(mp.spanning.y)}px`;
    band.style.width = `${px2(mp.spanning.w)}px`;
    band.style.height = `${px2(mp.spanning.h)}px`;
    let firstSpanningLine = true;
    for (const ln of mp.lines.filter(l => l.area === 'spanning')) {
      appendLineSep(band, doc, firstSpanningLine); // **RC-A1:** רווח בין שורות הפס
      firstSpanningLine = false;
      band.appendChild(renderModelLine(ln, doc, mp.spanning.x, mp.spanning.y));
    }
    root.appendChild(band);
  }

  // **(4.2) Iteration-001 (legacy parity) — פסי H3 באמצע עמוד:** שורות הפס
  // הן גיאומטריית עמוד (רוחב כל הטורים, ממורכזות) — הן מרונדרות במיכל
  // עמוד-מוחלט ולא בתוך קופסת טור בודד (בתוך טור היו מקבלות left שלילי
  // ונחתכות בהקשרי clipping). הקואורדינטות מהמודל — טהור.
  const midBandLines = mp.lines.filter(l => l.area === 'column' && l.midBand === true && l.projected !== false);
  let prevMidBandToken = null;
  if (midBandLines.length) {
    const mbWrap = doc.createElement('div');
    mbWrap.className = 'mid-bands';
    mbWrap.setAttribute('dir', 'rtl');
    mbWrap.style.position = 'absolute';
    mbWrap.style.left = '0';
    mbWrap.style.top = '0';
    mbWrap.style.width = `${px2(geo.width)}px`;
    mbWrap.style.height = `${px2(geo.height)}px`;
    for (const ln of midBandLines) {
      // **RC-A1:** רווח בין שורות של אותו פס (אותו token) — לא בין פסים שונים
      appendLineSep(mbWrap, doc, prevMidBandToken == null || ln.sourceTokenId !== prevMidBandToken);
      prevMidBandToken = ln.sourceTokenId != null ? ln.sourceTokenId : null;
      mbWrap.appendChild(renderModelLine(ln, doc, 0, 0));
    }
    root.appendChild(mbWrap);
  }

  // (4.5) עמודי הערות-סיום — שורות area=endnotes בקואורדינטות עמוד מוחלטות
  // מההקרנה (החותמות של buildEndnotePages). הקרנה טהורה — המיקומים סופיים
  // במודל; הקיבוץ לפי kind/sourceTokenId (נתוני זהות מהמודל) מייצר את
  // העוגנים שהאודיט והנגישות מצפים להם: .endnote-title + .endnote-note.
  const enLines = mp.lines.filter(l => l.area === 'endnotes');
  if (enLines.length) {
    const enWrap = doc.createElement('div');
    enWrap.className = 'endnote-list';
    enWrap.setAttribute('dir', 'rtl');
    enWrap.style.position = 'absolute';
    enWrap.style.left = '0';
    enWrap.style.top = '0';
    enWrap.style.width = '100%';
    for (const ln of enLines) {
      if (ln.kind === 'endnote-title') {
        const h = doc.createElement('h2');
        h.className = 'endnote-title';
        h.setAttribute('dir', 'rtl');
        h.style.position = 'absolute';
        h.style.left = `${px2(ln.x)}px`;
        h.style.top = `${px2(ln.y)}px`;
        h.style.width = `${px2(ln.w)}px`;
        h.style.height = `${px2(ln.h)}px`;
        h.style.lineHeight = `${px2(ln.h)}px`;
        if (ln.sizePt != null) h.style.fontSize = `${px2(ln.sizePt * PT_TO_PX)}px`;
        const fam = familyOf((ln.words || [])[0] && ln.words[0].fontKey);
        if (fam) h.style.fontFamily = fam;
        h.textContent = scrubPUATText((ln.words || []).map(w => w.text).join(' '));
        enWrap.appendChild(h);
        continue;
      }
      const note = doc.createElement('div');
      note.className = 'endnote-note';
      note.setAttribute('dir', 'rtl');
      if (ln.sourceTokenId != null) note.dataset.token = ln.sourceTokenId;
      note.style.position = 'absolute';
      note.style.left = `${px2(ln.x)}px`;
      note.style.top = `${px2(ln.y)}px`;
      note.style.width = `${px2(ln.w)}px`;
      note.appendChild(renderModelLine(ln, doc, ln.x, ln.y));
      enWrap.appendChild(note);
    }
    root.appendChild(enWrap);
  }

  // (5) טורים — התיבות מ-geometry; השורות ילדות ישירות של הטור (עוגן האודיט)
  const colTops = (geo.columns || []).map(() => (geo.contentBox ? geo.contentBox.top : 0) + (geo.spanOffset || 0));
  const colsWrap = doc.createElement('div');
  colsWrap.className = 'columns';
  (geo.columns || []).forEach((c, ci) => {
    const colEl = doc.createElement('section');
    colEl.className = 'column';
    colEl.style.position = 'absolute';
    const colHeight = Math.max(0, (geo.contentBox ? geo.contentBox.height : 0) - (geo.spanOffset || 0));
    colEl.style.left = `${px2(c.x)}px`;
    colEl.style.width = `${px2(c.w)}px`;
    colEl.style.top = `${px2(colTops[ci])}px`;
    colEl.style.height = `${px2(colHeight)}px`;
    colEl.dataset.modelX = String(c.x);
    colEl.dataset.modelW = String(c.w);
    colEl.dataset.modelTop = String(colTops[ci]);
    colEl.dataset.modelHeight = String(colHeight);
    colEl.dataset.modelBottom = String(colTops[ci] + colHeight);
    for (const ln of mp.lines.filter(l => l.area === 'column' && l.col === ci && l.projected !== false && l.midBand !== true)) {
      colEl.appendChild(renderModelLine(ln, doc, c.x, colTops[ci]));
    }
    colsWrap.appendChild(colEl);
  });
  root.appendChild(colsWrap);

  // (6) תמונות — מלאי הנכסים בגיאומטריה סופית מהמודל (כולל צפים; §2.2)
  for (const im of (mp.images || [])) {
    if (im.x == null || im.y == null) {
      // נתון חסר במודל — diagnostic גלוי, לא השלמה שקטה (§2.2)
      diags.push({ kind: 'pmr-image-without-geometry', itemId: im.itemId || null, assetId: im.assetId || null });
      continue;
    }
    const el = doc.createElement('div');
    el.className = 'pmr-img';
    el.setAttribute('role', 'img');
    if (im.altText) el.setAttribute('aria-label', scrubPUAText(im.altText));
    if (im.itemId != null) el.dataset.itemId = String(im.itemId);
    if (im.assetId != null) el.dataset.assetId = String(im.assetId);
    el.style.position = 'absolute';
    el.style.left = `${px2(im.x)}px`; el.style.top = `${px2(im.y)}px`;
    el.style.width = `${px2(im.w)}px`; el.style.height = `${px2(im.h)}px`;
    const ref = im.resourcePath || null;
    const uri = ref ? (resolveAssetRef(ref) || {}).uri : null;
    if (uri) {
      el.style.backgroundImage = `url("${uri}")`;
      el.style.backgroundSize = '100% 100%';
      el.style.backgroundRepeat = 'no-repeat';
    } else {
      el.dataset.assetMissing = '1';
      diags.push({ kind: 'pmr-image-asset-unresolved', itemId: im.itemId || null, assetId: im.assetId || null });
    }
    root.appendChild(el);
  }

  // (7) הערות-צד/תיבות מידע — כרום+זהות מהרשומה; שורות הטקסט בתוכה (עוגן
  // האודיט: .side-note/.margin-note עם textContent לספירת המילים).
  const marginLines = mp.lines.filter(l => l.area === 'margin');
  for (const sn of (mp.sideNotes || [])) {
    const isBox = sn.itemKind === 'info-box';
    const el = doc.createElement('aside');
    el.className = 'side-note' + (isBox ? ' info-box' : '');
    if (sn.noteId != null) el.dataset.noteId = String(sn.noteId);
    if (sn.anchorId != null) el.dataset.anchor = String(sn.anchorId);
    el.setAttribute('dir', 'rtl');
    el.style.position = 'absolute';
    if (sn.x != null) { el.style.left = `${px2(sn.x)}px`; el.style.right = 'auto'; }
    if (sn.yTop != null) el.style.top = `${px2(sn.yTop)}px`;
    if (sn.w) el.style.width = `${px2(sn.w)}px`;
    if (sn.heightPx != null) el.style.height = `${px2(sn.heightPx)}px`;
    if (sn.boxChrome && isBox) {
      const ch = sn.boxChrome;
      if (ch.background) el.style.backgroundColor = ch.background;
      if (ch.border > 0) el.style.border = `${ch.border}px solid ${ch.borderColor || '#1a1a1a'}`;
      if (ch.pad) el.style.padding = `${ch.pad}px`;
    }
    // שורות הטקסט של אותה הערה: אותו עמוד-שוליים (x) בטווח התיבה (yTop..yTop+h)
    const own = marginLines.filter(l => l.x != null && sn.x != null && Math.abs(l.x - sn.x) < 0.01
      && l.y != null && sn.yTop != null && l.y >= sn.yTop - 0.01 && l.y <= sn.yTop + (sn.heightPx || 0) + 0.01);
    let firstOwnLine = true; // **RC-A1:** רווח בין שורות הביאור (טקסט אחד לוגי)
    for (const ln of own) {
      appendLineSep(el, doc, firstOwnLine);
      firstOwnLine = false;
      el.appendChild(renderModelLine(ln, doc, sn.x, sn.yTop));
    }
    if (!own.length && sn.text) {
      // רשומה בלי שורות מוקרנות — דיאגנוסטיק גלוי; הטקסט אינו נעלם (§2.4)
      diags.push({ kind: 'pmr-side-note-without-lines', noteId: sn.noteId || null, anchorId: sn.anchorId || null });
      const p = doc.createElement('div');
      p.className = 'pmr-missing';
      p.dataset.missing = 'side-note-lines';
      p.textContent = scrubPUAText(sn.text).slice(0, 200);
      el.appendChild(p);
    }
    root.appendChild(el);
  }
  // שורות margin שלא שויכו לשום רשומה — מוקרנות בקואורדינטות העמוד + דיאגנוסטיק
  const claimed = new Set();
  for (const sn of (mp.sideNotes || [])) {
    for (const l of marginLines) {
      if (l.x != null && sn.x != null && Math.abs(l.x - sn.x) < 0.01
        && l.y != null && sn.yTop != null && l.y >= sn.yTop - 0.01 && l.y <= sn.yTop + (sn.heightPx || 0) + 0.01) claimed.add(l.id);
    }
  }
  for (const ln of marginLines) {
    if (claimed.has(ln.id)) continue;
    diags.push({ kind: 'pmr-margin-line-orphan', lineId: ln.id || null });
    const el = renderModelLine(ln, doc, 0, 0);
    el.classList.add('pmr-orphan-margin');
    root.appendChild(el);
  }

  // (8) מרזב הערות — אריזת-תצוגה של כיסוי הרשומות (נגזרת מנתוני המודל בלבד);
  // הקו-המפריד (עיטור fn-rule מהמודל) מוצב בתוכה — כמו שהאודיט בודק.
  const fnNotes = mp.footnotes || [];
  if (fnNotes.length) {
    const fnRules = decoAll.filter(d => d.kind === 'fn-rule');
    const xs = fnNotes.map(n => n.x).filter(v => v != null).concat(fnRules.map(r => r.x));
    const ys = fnNotes.map(n => n.y).filter(v => v != null).concat(fnRules.map(r => r.y));
    const area = doc.createElement('div');
    area.className = `footnotes footnotes--${settings['fn-layout-mode']}`;
    area.style.position = 'absolute';
    if (xs.length && ys.length) {
      const minX = Math.min(...xs), minY = Math.min(...ys);
      const maxX = Math.max(...fnNotes.map(n => (n.x != null && n.w != null ? n.x + n.w : null)).filter(v => v != null)
        .concat(fnRules.map(r => r.x + r.w)));
      area.style.left = `${px2(minX)}px`;
      area.style.top = `${px2(minY)}px`;
      if (maxX != null) area.style.width = `${px2(maxX - minX)}px`;
      area.style.bottom = 'auto';
    }
    for (const r of fnRules) area.appendChild(renderModelDecoration(r, doc, diags));
    for (const n of fnNotes) {
      const el = doc.createElement('div');
      el.className = 'footnote';
      if (n.noteId != null) el.dataset.noteId = String(n.noteId);
      if (n.anchorId != null) el.dataset.anchor = String(n.anchorId);
      if (n.continuationOf != null) el.dataset.continuationOf = String(n.continuationOf);
      el.setAttribute('dir', 'rtl');
      el.style.position = 'absolute';
      if (n.x != null) el.style.left = `${px2(n.x - (xs.length ? Math.min(...xs) : 0))}px`;
      if (n.y != null) el.style.top = `${px2(n.y - (ys.length ? Math.min(...ys) : 0))}px`;
      if (n.w) el.style.width = `${px2(n.w)}px`;
      // שורות ההערה: קיבוץ לפי baselineY (נתון מהמודל) — שורה k בגובה lineH
      const lineH = n.lineH || 0;
      const rows = new Map();
      for (const wd of (n.words || [])) {
        const key = wd.baselineY != null ? wd.baselineY : 0;
        if (!rows.has(key)) rows.set(key, []);
        rows.get(key).push(wd);
      }
      const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
      if (!sortedRows.length && n.text) {
        diags.push({ kind: 'pmr-footnote-without-words', noteId: n.noteId || null });
      }
      sortedRows.forEach(([baselineY, words], k) => {
        // **RC-A1:** רווח בין שורות ההערה (טקסט אחד לוגי) — textContent שלם
        appendLineSep(el, doc, k === 0);
        const row = doc.createElement('div');
        row.className = 'fn-row';
        row.style.position = 'relative';
        if (lineH > 0) { row.style.height = `${px2(lineH)}px`; row.style.lineHeight = `${px2(lineH)}px`; }
        let firstFnWord = true;
        for (const wd of words) {
          if (!firstFnWord && typeof doc.createTextNode === 'function') row.appendChild(doc.createTextNode(' '));
          firstFnWord = false;
          const span = doc.createElement('span');
          span.className = 'w' + (wd.mk ? ' w--fnmarker' : '');
          span.style.position = 'absolute';
          span.style.left = `${px2(wd.x - (n.x != null ? n.x : 0))}px`;
          span.style.top = '0';
          span.style.whiteSpace = 'pre';
          if (wd.sizePt != null) span.style.fontSize = `${px2(wd.sizePt * PT_TO_PX)}px`;
          const fam = familyOf(wd.fontKey);
          if (fam) span.style.fontFamily = fam;
          span.textContent = scrubPUAText(wd.text);
          row.appendChild(span);
        }
        void baselineY; void k;
        el.appendChild(row);
      });
      area.appendChild(el);
    }
    root.appendChild(area);
  }

  // (9) כותרת עליונה — סלוטים במיקומים סופיים מהמודל
  if (mp.header && (mp.header.slots || []).length) {
    const el = doc.createElement('div');
    el.className = `running-head head--sep-${settings['header-separator-style'] || 'none'}`;
    el.style.position = 'absolute';
    el.style.top = `${px2(mp.header.y)}px`;
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '14px';
    for (const s of mp.header.slots) {
      if (!s.text) continue;
      const span = doc.createElement('span');
      span.className = `rh rh--${s.pos}`;
      span.style.position = 'absolute';
      // **Iteration-006 (G6/RC-F1):** סלוט כותרת = שורה אחת תמיד (חוזה הייחוס —
      // כותרת-מרכז ארוכה נשארת שורה אחת וחופפת את מילות-הצד, p647-653). בלי
      // nowrap הדפדפן שובר לשתי שורות בתיבת 14px ⇒ שורות מודבקות זו על זו.
      span.style.whiteSpace = 'nowrap';
      if (s.x != null) { span.style.left = `${px2(s.x)}px`; span.style.right = 'auto'; }
      if (s.w != null) span.style.width = `${px2(s.w)}px`;
      if (s.align) span.style.textAlign = s.align;
      if (s.sizePt != null) span.style.fontSize = `${px2(s.sizePt * PT_TO_PX)}px`;
      const fam = familyOf(s.fontKey);
      if (fam) span.style.fontFamily = fam;
      const col = nonBlack(s.color);
      if (col) span.style.color = col;
      span.textContent = scrubPUAText(s.text);
      el.appendChild(span);
    }
    root.appendChild(el);
  }

  // (10) גיליון — מלבן+טקסט+זהות מהמודל; הכרום (מסגרת) מההגדרות
  if (mp.folio && mp.folio.text && settings['page-num-position'] !== 'none') {
    const el = doc.createElement('footer');
    el.className = `folio folio--${settings['page-num-position']} folio--frame-${settings['page-num-frame']}`;
    el.style.position = 'absolute';
    if (mp.folio.x != null) { el.style.left = `${px2(mp.folio.x)}px`; el.style.right = 'auto'; }
    if (mp.folio.y != null) { el.style.top = `${px2(mp.folio.y)}px`; el.style.bottom = 'auto'; }
    if (mp.folio.w != null) el.style.width = `${px2(mp.folio.w)}px`;
    if (mp.folio.sizePt != null) el.style.fontSize = `${px2(mp.folio.sizePt * PT_TO_PX)}px`;
    const fam = familyOf(mp.folio.fontKey);
    if (fam) el.style.fontFamily = fam;
    const col = nonBlack(mp.folio.color);
    if (col) el.style.color = col;
    if (mp.folio.baselineY != null && mp.folio.y != null) el.style.lineHeight = `${px2(mp.folio.baselineY - mp.folio.y)}px`;
    if (isCssFrame(settings['page-num-frame'])) {
      const badge = doc.createElement('span');
      badge.className = `page-num-badge page-num-frame-${settings['page-num-frame'] === 'circle' ? 'circle' : 'box'}`;
      badge.textContent = mp.folio.text;
      el.appendChild(badge);
    } else {
      el.textContent = mp.folio.text;
    }
    root.appendChild(el);
  }

  // (11) עיטורי חזית — השאר (מעל התוכן; zOrder מהמודל)
  for (const d of decoAll) {
    if (isBg(d) || d.kind === 'fn-rule') continue;
    root.appendChild(renderModelDecoration(d, doc, diags));
  }

  // **9c.3 (§4.3 — TOC click בתצוגה החיה):** מלבני הקישור מהמודל
  // (document.tocLinks) מוקרנים כשכבת-על לחיצה — אותה הקרנה כמו בייצוא
  // ה-HTML העצמאי. הקריאה מעבירה את הרשימה דרך opts.tocLinks; היעדים
  // הם ה-id של אלמנטי העמוד (#page-N) — קליק מסונכרן ב-preview-tab.
  if (Array.isArray(opts.tocLinks)) {
    for (const l of opts.tocLinks) {
      if (l.page !== mp.index) continue;
      const a = doc.createElement('a');
      a.className = 'toc-link';
      a.setAttribute('href', `#page-${l.targetPage}`);
      a.setAttribute('dir', 'rtl');
      if (a.style) {
        a.style.position = 'absolute';
        a.style.left = `${Math.round(l.x * 100) / 100}px`;
        a.style.top = `${Math.round(l.y * 100) / 100}px`;
        a.style.width = `${Math.round(l.w * 100) / 100}px`;
        a.style.height = `${Math.round(l.h * 100) / 100}px`;
      }
      root.appendChild(a);
    }
  }

  // חשבונאות גלויה (§2.4): פריט שלא מוקרן — diagnostic בר-צפייה, לא היעלמות
  const projectedLineIds = new Set([...(mp.lines || [])].map(l => l.id));
  for (const ln of (mp.lines || [])) {
    if (ln.projected === false) diags.push({ kind: 'pmr-line-not-projected', lineId: ln.id || null });
  }
  void projectedLineIds;
  if (diags.length) {
    root.dataset.pmDiagnostics = String(diags.length);
    if (opts.onDiagnostic) for (const d of diags) opts.onDiagnostic(d);
  }
  return root;
}

function isCssFrame(v) { return v === 'circle' || v === 'square'; }

module.exports = { renderModelPage };
