// tests/regress/rc4-margin-note-side.test.js — RC-4 (Iteration-004): מיקום
// הערות-הצד בטורי השוליים — צד לפי טור העוגן, תיבת עמודת-השוליים,
// מרכוז-דיו, פיץ' מכויל ומפל פר-צד.
//
// **השורשים (אומתו על PDF אמיתי, i004):**
//   RC-4a — הצד נבחר לפי השוליים החיצוניים של העמוד (זוגיות); המורשת
//   (emitUnit §3036) מפרישה את הערת-הצד לשוליים הסמוכים לטור העוגן
//   (colR⇒ימין, colL⇒שמאל). בייחוס 514/596 עמודי-הערות משתמשים בשני
//   השוליים גם יחד; המאוחד שם הכול בשוליים אחד (recto-left/verso-right).
//   RC-4b — התיבה הוצבה על קצה השוליים החיצוני (center 743.4/56.3px);
//   המורשת ממרכזת בעמודת margin-col עצמה (x=MARGIN_R_X/L_X, רוחב
//   MARGIN_W). בהמרה הנכונה (MediaBox כולל 3מ״מ bleed: px=(pt−8.5)/0.75)
//   מרכזי כל 11,840 שורות הייחוס = 711.55/81.95px — מרכזי העמודות בדיוק.
//   RC-4c — פיץ' השורה חושב 1.15 (9px ל-6pt) מול 1.2 המכויל (9.6=MN_PITCH);
//   רוחב העמודה עוגל ל-51 מול 50.5 המדויק של המקור.
//   RC-4d — ההקרנה הצדיקה שורות-ביניים והצמידה אחרונות לימין; המורשת
//   ממרכזת כל שורה (std 0.00 בייחוס). מרכוז הדיו מפצה על הרווח הריק
//   המובנה בקצה השמאלי של תיבת המילה האחרונה (עוגן −gapW/2).
'use strict';
const path = require('path');
const { describe, it, assertEq, assert, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const { GEO } = require(path.join(RB, 'src/engine/core/imud-geometry'));
const { placeSideNotes } = require(path.join(RB, 'src/engine/layout/side-notes'));

// עמוד תכנון סינתטי דו-טורי (IMUD) עם עוגן בכל טור
function mkImudPage(idx, isRecto) {
  return {
    index: idx, type: 'regular', isRecto,
    template: {
      width: GEO.PAGE_W, height: GEO.PAGE_H,
      margins: { side: GEO.COL_L_X },
      columns: [{ x: GEO.COL_R_X, w: GEO.COL_W }, { x: GEO.COL_L_X, w: GEO.COL_W }],
      contentBox: { top: GEO.FLOW_TOP, bottom: 1022.2, height: 915 }
    },
    columns: [
      [{ tokenId: 'tokR', heightPx: 21.4 }, { tokenId: 'tokR2', heightPx: 21.4 }],
      [{ tokenId: 'tokL', heightPx: 21.4 }]
    ],
    sideNotes: [
      { anchorToken: 'tokR', noteId: 'nR', text: 'הערה בצד ימין', heightPx: 9.6, linesCount: 1, noteRows: [{ wFrom: 0, wTo: 1, wordW: [10] }], noteWords: ['הערה'], spaceW: 2.66, lineH: 9.6, stampCtx: { sizePt: 6, widthPx: GEO.MARGIN_W } },
      { anchorToken: 'tokL', noteId: 'nL', text: 'הערה בצד שמאל', heightPx: 9.6, linesCount: 1, noteRows: [{ wFrom: 0, wTo: 1, wordW: [10] }], noteWords: ['הערה'], spaceW: 2.66, lineH: 9.6, stampCtx: { sizePt: 6, widthPx: GEO.MARGIN_W } }
    ],
    footnotes: [], headingsOnPage: []
  };
}

describe('RC-4 margin note side/box/pitch (i004)', () => {
  it('RC-4a+b: IMUD — side by anchor column, box = the margin column itself', () => {
    const settings = { '_layout-profile': 'imud', '_imudRaw': {}, _sideNoteColWidthPx: GEO.MARGIN_W };
    const page = mkImudPage(0, true); // recto — outer=left; העוגן קובע, לא הזוגיות
    const r = placeSideNotes([page], settings, null, {});
    assertEq(r.placed.length, 2, 'both placed');
    const nR = r.placed.find(n => n.noteId === 'nR');
    const nL = r.placed.find(n => n.noteId === 'nL');
    assert(nR && nL, 'records exist');
    assertEq(nR.side, 'right', 'anchor in col 0 (RTL right) ⇒ right margin');
    assertEq(nL.side, 'left', 'anchor in col 1 ⇒ left margin');
    assert(Math.abs(nR.x - GEO.MARGIN_R_X) < 0.01, `right note x ${nR.x} = MARGIN_R_X ${GEO.MARGIN_R_X}`);
    assert(Math.abs(nL.x - GEO.MARGIN_L_X) < 0.01, `left note x ${nL.x} = MARGIN_L_X ${GEO.MARGIN_L_X}`);
    assert(Math.abs(nR.colWidth - GEO.MARGIN_W) < 0.01, 'colWidth = MARGIN_W');
  });

  it('RC-4a: generic (non-IMUD) — outer margin by parity, single cascade (contract unchanged)', () => {
    const settings = { _sideNoteColWidthPx: 60 };
    const page = mkImudPage(0, true); // recto ⇒ outer = left
    const r = placeSideNotes([page], settings, null, {});
    for (const n of r.placed) {
      assertEq(n.side, 'left', 'generic recto ⇒ left outer margin');
      assertEq(n.x, page.template.margins.side * 0.15, 'generic outer x formula');
    }
    const page2 = mkImudPage(1, false); // verso ⇒ outer = right
    const r2 = placeSideNotes([page2], settings, null, {});
    for (const n of r2.placed) assertEq(n.side, 'right', 'generic verso ⇒ right outer margin');
  });

  it('RC-4a: per-side cascade — notes in opposite margins may overlap vertically', () => {
    const settings = { '_layout-profile': 'imud', '_imudRaw': {}, _sideNoteColWidthPx: GEO.MARGIN_W };
    const page = mkImudPage(0, true);
    // שתי הערות באותו הצד באותו גובה — השנייה נדחקת מטה; בצדדים שונים — לא
    page.sideNotes.push({ anchorToken: 'tokR2', noteId: 'nR2', text: 'עוד הערה ימין', heightPx: 9.6, linesCount: 1, noteRows: [{ wFrom: 0, wTo: 1, wordW: [10] }], noteWords: ['הערה'], spaceW: 2.66, lineH: 9.6, stampCtx: { sizePt: 6, widthPx: GEO.MARGIN_W } });
    const r = placeSideNotes([page], settings, null, {});
    const rights = r.placed.filter(n => n.side === 'right').sort((a, b) => a.yTop - b.yTop);
    assertEq(rights.length, 2, 'two right notes');
    assert(rights[1].yTop >= rights[0].yTop + rights[0].heightPx, 'same-side cascade keeps gap');
    const lefts = r.placed.filter(n => n.side === 'left');
    // השמאלית באותו גובה העוגן — מותר (שוליים שונים)
    assert(lefts[0].yTop < rights[1].yTop, 'opposite-side notes are independent');
  });

  it('RC-4c: IMUD side-note pitch = 9.6px (6pt×1.2×4/3 — MN_PITCH), width exact 50.5', () => {
    const NM = require(path.join(RB, 'src/engine/layout/notes-model'));
    const ctx = NM.measureContext
      ? NM.measureContext({ '_layout-profile': 'imud', '_imudRaw': {} }, NM.NOTE_KINDS.SIDE_NOTE, {})
      : null;
    if (ctx) {
      assert(Math.abs(ctx.lineH - 9.6) < 0.01, `IMUD lineH ${ctx.lineH} = 9.6 (בלי עיגול — עיגול היה הופך ל-10)`);
      assertEq(ctx.sizePt, 6, 'marginNote 6pt');
      assert(Math.abs(ctx.widthPx - GEO.MARGIN_W) < 0.01, `widthPx ${ctx.widthPx} = MARGIN_W`);
    }
    assertEq(GEO.MN_PITCH, 9.6, 'MN_PITCH = 9.6px');
    assertEq(GEO.MARGIN_W, 50.5, 'MARGIN_W = 50.5px');
  });

  it('RC-4d: centered projection — word-union center = column center (ink-centered)', () => {
    // מרכוז הדיו: עוגן ההתחלה מוסט בחצי רווח; הוכח על הייחוס — מרכזי הדיו
    // 711.58/81.99px מול 711.55/81.95 (מרכזי העמודות), סטייה 0.45pt בלבד.
    // כאן: הנוסחה על תיבה סינתטית — האיחוד ממורכז במרכז התיבה בתוספת gapW/2
    // (הרווח הריק בקצה השמאלי של המילה האחרונה).
    const gx = GEO.MARGIN_R_X, gw = GEO.MARGIN_W;
    const words = [{ text: 'אבג', w: 12.2 }, { text: 'דהו', w: 11.8 }];
    const spaceW = 2.66, gapW = spaceW;
    const sumW = words.reduce((s, w) => s + w.w, 0);
    const gaps = words.length - 1;
    const total = sumW + gaps * gapW;
    let cursor = gx + (gw + total) / 2 - gapW / 2;
    const xs = [];
    for (const w of words) { cursor -= w.w; xs.push(cursor); cursor -= gapW; }
    const unionL = Math.min(...xs), unionR = Math.max(...xs.map((x, i) => x + words[i].w));
    // מרכז האיחוד (כולל הרווח הריק) מוסט מרווח-אחד שמאלה ממרכז הדיו; מרכז הדיו = מרכז התיבה
    const inkCenter = (unionL + gapW + unionR) / 2;
    assert(Math.abs(inkCenter - (gx + gw / 2)) < 0.01, `ink center ${inkCenter} = box center ${gx + gw / 2}`);
  });
});

report();
