// tests/regress/rca1-dom-word-separation.test.js — RC-A1 (i006):
// רווח בין שורות של אותו טקסט לוגי במקרין ה-DOM (ביאור-צד, הערה, פס).
// לפני התיקון: textContent הדביק מילים בכל צומת-שורה (8,848+626 מילים ב-very_long).
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, report } = require('../harness');
const { renderModelPage } = require('../../src/engine/output/pagemodel-dom-renderer');

const docShim = {
  createElement: (t) => ({
    tagName: t, children: [], style: {}, dataset: {}, attrs: {}, className: '', dir: '',
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { this.children.push(c); return c; },
    classList: { add(c) { this.className = (this.className + ' ' + c).trim(); } },
    get textContent() { return this.children.length ? this.children.map((c) => c.textContent).join('') : this._text; },
    set textContent(v) { this._text = String(v); this.children = []; }
  }),
  createTextNode: (t) => ({ _t: String(t), get textContent() { return this._t; } })
};

const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const settings = {}; // המקרין קורא הגדרות רק לצבע/גופן — מינימום לבדיקה זו

function lineWithWords(y, words, extra = {}) {
  return {
    id: 'l' + y, area: extra.area || 'margin', x: extra.x != null ? extra.x : 686.3, y, w: 50, h: 9.6,
    isLast: false, kind: extra.kind || 'paragraph', align: 'center',
    sourceTokenId: extra.sourceTokenId != null ? extra.sourceTokenId : 't1',
    words: words.map((text, i) => ({ text, x: 700 + i * 10, sizePt: 6, fontKey: 'margin' }))
  };
}

describe('RC-A1 — רווח בין שורות של אותו טקסט לוגי במקרין ה-DOM', () => {
  it('ביאור-צד דו-שורתי: textContent מפריד בין המילים בצומת השורה', () => {
    const mp = {
      index: 0, type: 'regular', geometry: { width: 794, height: 1123 },
      lines: [
        lineWithWords(100, ['אחת', 'שתיים', 'שלוש'], { x: 686.3 }),
        lineWithWords(110, ['ארבע', 'חמש'], { x: 686.3 })
      ],
      sideNotes: [{ noteId: 'n1', itemKind: 'side-note', text: 'אחת שתיים שלוש ארבע חמש', x: 686.3, yTop: 95, heightPx: 30 }],
      footnotes: [], decorations: []
    };
    const root = renderModelPage(mp, settings, docShim, {});
    const find = (el, cls) => {
      if (!el || !el.tagName) return null;
      if (String(el.className).startsWith(cls)) return el;
      for (const c of (el.children || [])) { const r = find(c, cls); if (r) return r; }
      return null;
    };
    const sn = find(root, 'side-note');
    assert(sn, 'אלמנט side-note קיים');
    assertEq(wc(sn.textContent), 5, `מילים ב-textContent (התקבל «${sn.textContent}») — בלי רווח בין השורות היו 4`);
  });

  it('הערת גוף דו-שורתית: textContent שלם (שתי שורות, 5 מילים)', () => {
    const mp = {
      index: 0, type: 'regular', geometry: { width: 794, height: 1123 },
      lines: [],
      footnotes: [{
        noteId: 'f1', marker: 'א.', x: 100, y: 1000, w: 500, lineH: 9.6,
        words: [
          { text: 'אחת', x: 110, baselineY: 1000 }, { text: 'שתיים', x: 130, baselineY: 1000 },
          { text: 'שלוש', x: 150, baselineY: 1010 }, { text: 'ארבע', x: 170, baselineY: 1010 }, { text: 'חמש', x: 190, baselineY: 1010 }
        ]
      }],
      sideNotes: [], decorations: []
    };
    const root = renderModelPage(mp, settings, docShim, {});
    const find = (el, cls) => {
      if (!el || !el.tagName) return null;
      if (String(el.className).startsWith(cls)) return el;
      for (const c of (el.children || [])) { const r = find(c, cls); if (r) return r; }
      return null;
    };
    const fn = find(root, 'footnote');
    assert(fn, 'אלמנט footnote קיים');
    assertEq(wc(fn.textContent), 5, `מילים ב-textContent (התקבל «${fn.textContent}») — בלי רווח בין השורות היו 3`);
  });

  it('פס spanning דו-שורתי: textContent מפריד בין השורות', () => {
    const mp = {
      index: 0, type: 'regular', geometry: { width: 794, height: 1123 },
      spanning: { x: 120, y: 100, w: 552, h: 60 },
      lines: [
        { ...lineWithWords(108, ['כותרת', 'שורה'], { area: 'spanning', x: 120, kind: 'heading' }), w: 552 },
        { ...lineWithWords(130, ['שניה'], { area: 'spanning', x: 120, kind: 'heading' }), w: 552 }
      ],
      footnotes: [], sideNotes: [], decorations: []
    };
    const root = renderModelPage(mp, settings, docShim, {});
    const find = (el, cls) => {
      if (!el || !el.tagName) return null;
      if (String(el.className).startsWith(cls)) return el;
      for (const c of (el.children || [])) { const r = find(c, cls); if (r) return r; }
      return null;
    };
    const band = find(root, 'spanning-band');
    assert(band, 'אלמנט spanning-band קיים');
    assertEq(wc(band.textContent), 3, `מילים ב-textContent (התקבל «${band.textContent}») — בלי רווח היו 2`);
  });

  it('בין שני פסי mid-band שונים (token שונה) — אין רווח מטעה בתחילת השני', () => {
    const mp = {
      index: 0, type: 'regular', geometry: { width: 794, height: 1123 },
      lines: [
        { ...lineWithWords(300, ['פס', 'א'], { area: 'column', kind: 'heading', sourceTokenId: 't1' }), midBand: true },
        { ...lineWithWords(400, ['פס', 'ב'], { area: 'column', kind: 'heading', sourceTokenId: 't2' }), midBand: true }
      ],
      footnotes: [], sideNotes: [], decorations: []
    };
    const root = renderModelPage(mp, settings, docShim, {});
    const find = (el, cls) => {
      if (!el || !el.tagName) return null;
      if (String(el.className).startsWith(cls)) return el;
      for (const c of (el.children || [])) { const r = find(c, cls); if (r) return r; }
      return null;
    };
    const wrap = find(root, 'mid-bands');
    assert(wrap, 'מיכל mid-bands קיים');
    const lines = wrap.children.filter((c) => c.tagName === 'div' && String(c.className).startsWith('line'));
    assertEq(lines.length, 2, 'שתי שורות פס');
    assertEq(wc(lines[0].textContent), 2, 'שורה 1 — שתי מילים');
    assertEq(wc(lines[1].textContent), 2, 'שורה 2 — שתי מילים (רווח בין פסים שונים אינו מדביק ואינו מוסיף מילה)');
  });
});

report('rca1-dom-word-separation');
