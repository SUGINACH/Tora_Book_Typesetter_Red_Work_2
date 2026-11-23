// tests/regress/rc-c1-h2-wrap-flow-push.test.js — G3/RC-C1 (i006):
// שורות כותרת-h2 עטופות דוחפות את ראש הזרימה — חוזה flowSection של המקור.
//
// **השורש (נמדד בייחוס p278 «בגדר פסול דלמעלה מעשרים אמה בנר חנוכה»):**
// המקור: top = FLOW_TOP + areaH + (h2Lines−1)×30 — כל שורה עטופה מעבר לראשונה
// מורידה את ראש הטורים בפס שלה (הרווח התחתון המוגדר נשמר). ה-H3 שאחרי כותרת
// דו-שורתית נחת ב-421.45px במדויק. המאוחד השתמש ב-contentBox.top קבוע
// (FLOW_TOP+284.25=391.45) — ה-H3 עלה 30px גבוה מדי ונגע בשורת-הכותרת השנייה
// (374.05–404.05px). בנוסף: פס שטוח בין שורות הכותרת (30px, כמו li×30 של המורשת)
// והבנייה החוזרת של D-63 (toc-builder) חייבת לשאת את הדגל — אותו שורש של RC-3c.
'use strict';
const path = require('path');
const fs = require('fs');
const { describe, it, assert, assertEq, assertClose, report } = require('../harness');
const RB = path.join(__dirname, '..', '..');

const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const FONT_DIR = path.join(RB, 'ui/assets/imud/fonts');
fontResolver.registerFont('Guttman Rashi', fs.readFileSync(path.join(FONT_DIR, 'Guttman-Rashi-Normal.ttf')), { source: 'rc-c1' });
fontResolver.registerFont('FrankReal', fs.readFileSync(path.join(FONT_DIR, 'FrankReal-Bold.ttf')), { source: 'rc-c1' });

const {
  PAGE_TYPES, buildPageTemplate
} = require(path.join(RB, 'src/engine/layout/page-templates'));
const {
  GEO, FLOW_BOTTOM, H2_AREA_H, H2_SPAN_AREA_H, H2_TITLE_LINE_PITCH_PX, H2_TITLE_Y, H2_TITLE_Y_SPAN
} = require(path.join(RB, 'src/engine/core/imud-geometry'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));
const { getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { materializeDocument } = require(path.join(RB, 'src/engine/core/materialize'));

const FLOW_TOP = GEO.FLOW_TOP;

describe('G3/RC-C1 — כותרת-h2 עטופה דוחפת את ראש הזרימה (i006)', () => {
  it('קבוע החוזה: פס שטוח 30px (נמדד בייחוס p278: Δ=30.0px במדויק)', () => {
    assertEq(H2_TITLE_LINE_PITCH_PX, 30, 'פס שורות כותרת-h2');
  });

  it('תבנית: h2ExtraLines מוריד את textTop בפס לכל שורה עטופה — בשני האזורים', () => {
    const s = { '_layout-profile': 'imud' };
    const one = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true, { h2ExtraLines: 0 });
    const two = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true, { h2ExtraLines: 1 });
    const three = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true, { h2ExtraLines: 2 });
    assertClose(one.contentBox.top, FLOW_TOP + H2_AREA_H, 0.001, 'חד-שורתית — ללא דחיפה (rc3 נשמר)');
    assertClose(two.contentBox.top, FLOW_TOP + H2_AREA_H + 30, 0.001, 'דו-שורתית +30');
    assertClose(three.contentBox.top, FLOW_TOP + H2_AREA_H + 60, 0.001, 'תלת-שורתית +60');
    // פתיחה עם span — אותה דחיפה על האזור המוקצץ
    const twoSpan = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true, { h2SpanExempt: true, h2ExtraLines: 1 });
    assertClose(twoSpan.contentBox.top, FLOW_TOP + H2_SPAN_AREA_H + 30, 0.001, 'span+דו-שורתית');
    // תחתית הזרימה קבועה — הקיבולת מצטמצמת, לא מתחלפת
    assertEq(two.contentBox.bottom, FLOW_BOTTOM, 'התחתית קבועה מהחוזה');
    assertEq(two.h2ExtraLines, 1, 'הדגל חי על התבנית');
    // ברירת מחדל: אפס — כותרת חד-שורתית אינה מושפעת
    const dflt = buildPageTemplate(PAGE_TYPES.SIGN_OPEN, s, true);
    assertEq(dflt.h2ExtraLines, 0, 'ברירת מחדל 0');
  });

  it('typeset מלא: כותרת דו-שורתית — דחיפה חיה + פס שטוח בין השורות', () => {
    const LONG = 'תורה דעת חסד ברכה אגדה דרש שבת חכמה מלכות אמת לימוד פשט סוד מצווה בינה גבורה שלום הלכה רמז עמל ';
    // כותרת שנעטפת בוודאות ברוחב H23_TITLE_W (331.38px) — מילים ארוכות ב-17pt
    const TITLE = 'בגדר פסול דלמעלה מעשרים אמה בנר חנוכה';
    const text = [
      'ספר - בדיקה', 'מחבר - בדיקה', '',
      'הקדמה - פתח דבר',
      'אמת ' + LONG.repeat(2) + 'עמל.', '',
      'כותרת 1 - חלק 1',
      `כותרת 2 - ${TITLE}`,
      'כותרת 3 - א. המתבאר בגדר הנ"ל מגמת והראשונים',
      'פסקה 1 של חלק 1 ' + LONG.repeat(4) + 'שלום.'
    ].join('\n');
    const settings = {
      ...getDefaultSettings(),
      '_layout-profile': 'imud',
      '_imudRaw': { 'h2-auto-siman': true },
      '_engine-force-unified': true,
      'first-word-mode': 'drop',
      'first-word-font': 'FrankReal',
      'body-font': 'Guttman Rashi',
      'body-font-size-pt': 12
    };
    const r = typeset(text, settings);
    const sign = r.pages.find(p => p.template && p.template.type === 'sign-open' && p.spanning && p.spanning.lines.length >= 2);
    assert(sign, 'עמוד פתיחת-סימן עם כותרת דו-שורתית');
    assertEq(sign.template.h2ExtraLines, sign.spanning.lines.length - 1, 'הדחיפה = שורות−1');
    const expected = sign.template.h2SpanExempt ? FLOW_TOP + H2_SPAN_AREA_H : FLOW_TOP + H2_AREA_H;
    assertClose(sign.template.contentBox.top, expected + (sign.spanning.lines.length - 1) * 30, 0.001,
      'textTop = FLOW_TOP + areaH + (שורות−1)×30');
    // פס שטוח בין שורות הכותרת — כמו y = עוגן + li×30 של המורשת
    const ys = sign.spanning.lines.map(l => l.yPx);
    const anchor = sign.template.h2SpanExempt ? H2_TITLE_Y_SPAN : H2_TITLE_Y;
    for (let i = 0; i < ys.length; i++) {
      assertClose(ys[i], anchor + i * 30, 0.001, `שורת כותרת ${i} בעוגן+${i}×30`);
    }
    // ההקרנה: אף שורת גוף לא עולה מעל textTop
    const projected = materializeDocument(r, r.settings, { mode: 'production' });
    const pg = projected.pages[sign.index];
    const bodyTop = Math.min(...((pg.lines || []).filter(l => l.sizePt === 12).map(l => l.y)));
    assert(bodyTop >= sign.template.contentBox.top - 0.6, `גוף מתחת לראש הזרימה (${bodyTop.toFixed(1)} ≥ ${sign.template.contentBox.top.toFixed(1)}−0.6)`);
  });

  it('הבנייה החוזרת של D-63 (toc-builder) נושאת את h2ExtraLines — המשך RC-3c', () => {
    // הוכחה חיה: בלי זה הדחיפה נמחקה בסוף התכנון (probe: top=368.5 במקום 398.5).
    // בדיקת היחידה: הפרמטר עובר בבנייה החוזרת דרך _h2ExtraLines של העמוד.
    const src = fs.readFileSync(path.join(RB, 'src/engine/decoration/toc-builder.js'), 'utf8');
    assert(src.includes('h2ExtraLines: p._h2ExtraLines || 0'),
      'הבנייה החוזרת מעבירה את _h2ExtraLines (נעילת חוזה מקור-יחיד — כמו RC-3c ל-h2SpanExempt)');
    const planner = fs.readFileSync(path.join(RB, 'src/engine/layout/dp-planner.js'), 'utf8');
    assert(planner.includes('cur._h2ExtraLines = h2ExtraLines'), 'המתכנן מטביע את הדגל על העמוד');
  });
});

report();
