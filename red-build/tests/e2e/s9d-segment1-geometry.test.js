// tests/e2e/s9d-segment1-geometry.test.js — שלב ההעברה למנוע המאוחד, מקטע 1:
// גאומטריית עמוד וטורים מהחוזה המכויל של 9C.3 (audits/ENGINE_CONTRACT_9C3.md).
//
// מה שנבדק כאן — שלושת ההיבטים של המקטע:
//   1. מקור אמת יחיד: core/imud-geometry.js מזין גם את המורשת (GEO זהה מילולית)
//      וגם את תבניות העמוד של המנוע המאוחד בפרופיל IMUD.
//   2. הגריד של המנוע המאוחד בפרופיל IMUD = הגאומטריה המכוילת (טורים 269.41,
//      שפות 403.61/120.72, מרזב 13.48, תיבת תוכן 107.2–1022.2, טור רחב 552.3)
//      — לא הגריד הגנרי שיצר חור מרכזי של 134.9px (דוח חקירת האתר החי, ג.10).
//   3. שלילי: הנתיב הלא-IMUD (קורפוס ה-DP הכללי) אינו משתנה — אותם אחוזים
//      גנריים כמו קודם (אין רגרסיה לבדיקות הקיימות).
//   4. הקורפוס הקנוני בפרופיל DP הכללי: digest זהה לנעילת cross-check המתועדת
//      (fdff19d8; reconciliation 19.11 — תיקון: בעבר נטען "נעילת 9C.3 legacy" אך
//      הבדיקה הריצה getDefaultSettings בפרופיל DP ולא השוותה hash כלל).
//   5. דגל הבדיקה הדו-מנועי (RED_UNIFIED_IMUD) מריץ את המנוע המאוחד על
//      הגדרות IMUD — והפלט שלו נושא את התבנית המכוילת בפועל.
'use strict';

const path = require('path');
const fs = require('fs');
const { describe, it, assertEq, assertClose, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { GEO, FLOW_BOTTOM, SINGLE_W, H2_AREA_H, H0_AREA_H,
  TOC_FIRST_TOP, TOC_CONT_TOP, TOC_STRETCH_BOTTOM } = require('../../src/engine/core/imud-geometry');
const { buildPageTemplate, isImudProfile, PAGE_TYPES } = require('../../src/engine/layout/page-templates');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const legacyFlow = require('../../src/engine/layout/legacy-imud-flow');

// הגדרות בנתיב החי (כמו run-ours.js): default_settings.json → importImudSettings
function liveImudSettings() {
  const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
  const { getSettingDefs } = require('../../src/engine/core/settings-registry');
  const legacy = JSON.parse(fs.readFileSync(
    path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (!fs.existsSync(p)) continue;
    for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const imp = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families });
  return { ...getDefaultSettings(), ...imp.settings };
}

describe('s9d-segment1 — מקור אמת יחיד לגאומטריה', () => {
  it('legacy-imud-flow מקבל את GEO שלו מ-core/imud-geometry (זהות מלאה)', () => {
    assertEq(legacyFlow.GEO.PAGE_W, GEO.PAGE_W, 'PAGE_W');
    assertEq(legacyFlow.GEO.COL_R_X, GEO.COL_R_X, 'COL_R_X');
    assertEq(legacyFlow.GEO.COL_L_X, GEO.COL_L_X, 'COL_L_X');
    assertEq(legacyFlow.GEO.COL_W, GEO.COL_W, 'COL_W');
    assertEq(legacyFlow.GEO.LINE_H, GEO.LINE_H, 'LINE_H');
    assertEq(legacyFlow.FLOW_BOTTOM, FLOW_BOTTOM, 'FLOW_BOTTOM');
  });

  it('ערכי החוזה עצמם — כיול הייחוס של 9C.3', () => {
    assertEq(GEO.PAGE_W, 793.7, 'PAGE_W');
    assertEq(GEO.PAGE_H, 1122.5, 'PAGE_H');
    assertEq(GEO.COL_W, 269.41, 'COL_W');
    assertEq(GEO.COL_R_X, 403.61, 'COL_R_X');
    assertEq(GEO.COL_L_X, 120.72, 'COL_L_X');
    assertClose(GEO.COL_R_X - (GEO.COL_L_X + GEO.COL_W), 13.48, 0.01, 'gutter');
    assertEq(GEO.FLOW_TOP, 107.2, 'FLOW_TOP');
    assertEq(GEO.FLOW_H, 915, 'FLOW_H');
    assertEq(FLOW_BOTTOM, 1022.2, 'FLOW_BOTTOM');
    assertEq(SINGLE_W, 552.3, 'SINGLE_W');
    assertEq(H2_AREA_H, 284.25, 'H2_AREA_H');
    assertEq(H0_AREA_H, 249.2, 'H0_AREA_H');
    assertEq(TOC_FIRST_TOP, 370.7, 'TOC_FIRST_TOP');
    assertEq(TOC_CONT_TOP, 113.7, 'TOC_CONT_TOP');
    assertEq(TOC_STRETCH_BOTTOM, 1005.7, 'TOC_STRETCH_BOTTOM');
  });
});

describe('s9d-segment1 — תבנית עמוד IMUD במנוע המאוחד', () => {
  const settings = liveImudSettings();

  it('פרופיל IMUD מזוהה מההגדרות המיובאות (נתיב העלייה החי)', () => {
    assertEq(isImudProfile(settings), true, 'isImudProfile');
  });

  it('עמוד גוף דו-טורי: טורים, מרזב ותיבת תוכן מהחוזה', () => {
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    assertEq(tpl.imud, true, 'imud flag');
    assertEq(tpl.columns.length, 2, 'two columns');
    assertClose(tpl.columns[0].x, GEO.COL_R_X, 0.01, 'right col x');
    assertClose(tpl.columns[0].w, GEO.COL_W, 0.01, 'right col w');
    assertClose(tpl.columns[1].x, GEO.COL_L_X, 0.01, 'left col x');
    assertClose(tpl.columns[1].w, GEO.COL_W, 0.01, 'left col w');
    assertClose(tpl.gutter, 13.48, 0.01, 'gutter');
    assertClose(tpl.contentBox.top, GEO.FLOW_TOP, 0.01, 'contentBox.top');
    assertClose(tpl.contentBox.bottom, FLOW_BOTTOM, 0.01, 'contentBox.bottom');
    assertClose(tpl.contentBox.height, GEO.FLOW_H, 0.01, 'contentBox.height');
  });

  it('אין חור מרכזי: מרווח בין הטורים = 13.48px (לא 134.9)', () => {
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    // RTL: הטור הימני מתחיל אחרי סוף הטור השמאלי — המרווח ביניהם הוא המרזב
    const gap = tpl.columns[0].x - (tpl.columns[1].x + tpl.columns[1].w);
    assertClose(gap, 13.48, 0.01, 'central gap');
  });

  it('עמוד הקדמה: טור רחב 552.3px', () => {
    const tpl = buildPageTemplate(PAGE_TYPES.PREFACE, settings, true);
    assertEq(tpl.columns.length, 1, 'single column');
    assertClose(tpl.columns[0].x, GEO.COL_L_X, 0.01, 'x');
    assertClose(tpl.columns[0].w, SINGLE_W, 0.01, 'w');
  });

  it('binding-offset מוחל על שפות שני הטורים (recto/verso)', () => {
    const withBinding = { ...settings, 'binding-offset-px': 10 };
    const recto = buildPageTemplate(PAGE_TYPES.REGULAR, withBinding, true);
    const verso = buildPageTemplate(PAGE_TYPES.REGULAR, withBinding, false);
    // recto: שני הטורים מוסטים +10; verso: מוסטים -10
    assertClose(recto.columns[0].x, GEO.COL_R_X + 10, 0.01, 'recto right x');
    assertClose(recto.columns[1].x, GEO.COL_L_X + 10, 0.01, 'recto left x');
    assertClose(verso.columns[0].x, GEO.COL_R_X - 10, 0.01, 'verso right x');
    assertClose(verso.columns[1].x, GEO.COL_L_X - 10, 0.01, 'verso left x');
    // רוחבי הטורים והמרזב אינם משתנים מה-binding
    for (const tpl of [recto, verso]) {
      assertClose(tpl.columns[0].w, GEO.COL_W, 0.01, 'col w unchanged');
      assertClose(tpl.columns[0].x - (tpl.columns[1].x + tpl.columns[1].w), 13.48, 0.01, 'gutter unchanged');
    }
  });

  it('פס כותרת עליונה: headerHeight נושא את נקודת-הייחוס 71.9 מהחוזה (HEADER_BASELINE)', () => {
    // הערת חוזה (reconciliation 19.11): השדה `headerHeight` בתבנית מאוכלס מ-
    // GEO.HEADER_BASELINE — נקודת ייחוס/גאומטריית הפס, לא "גובה" במובן המילולי.
    // הסמנטיקה תיקבע בהבהרת חוזה נפרדת (ראה STAGE1_OPEN_DECISIONS_RECONCILIATION §3).
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, settings, true);
    assertClose(tpl.headerHeight, GEO.HEADER_BASELINE, 0.01, 'headerHeight=HEADER_BASELINE');
  });
});

describe('s9d-segment1 — שלילי: הנתיב הלא-IMUD אינו משתנה', () => {
  it('בלי פרופיל IMUD — הגריד הגנרי של ה-DP כמו קודם', () => {
    const plain = getDefaultSettings();
    assertEq(isImudProfile(plain), false, 'not imud');
    const tpl = buildPageTemplate(PAGE_TYPES.REGULAR, plain, true);
    // הנוסחה הגנרית ההיסטורית — חייבת להישאר בדיוק כפי שהייתה ב-9C.3
    const marginSide = tpl.width * plain['grid-margin-side-pct'] / 100;
    const contentW = tpl.width - 2 * marginSide;
    const cw = contentW * plain['grid-col-width-pct'] / 100;
    assertClose(tpl.columns[0].w, cw, 0.01, 'generic col width');
    assertClose(tpl.columns[0].x, marginSide + contentW - cw, 0.01, 'generic right x');
    assertEq(tpl.imud, undefined, 'no imud flag');
  });

  it('RED_UNIFIED_IMUD=1 מריץ את המאוחד על הגדרות IMUD; בלי הדגל — מורשת', () => {
    const { typeset } = require('../../src/engine/core/pipeline');
    const { registerFont, unregisterFont } = require('../../src/engine/typography/measure-api');
    const fontPath = path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf');
    const reg = registerFont('Guttman Rashi', fs.readFileSync(fontPath));
    assertEq(reg.ok, true, 'registerFont');
    const doc = ['שם הספר - ספר בדיקת גיאומטריה', '', 'כותרת 2 - פרק ראשון',
      'טקסט למילוי ' + 'מילים רבות לטור הימני ולטור השמאלי '.repeat(6)].join('\n');
    try {
      // ברירת מחדל: dispatch למורשת
      const legacyRes = typeset(doc, liveImudSettings(), { noRecommendations: true });
      assertEq(legacyRes.legacyProfile, true, 'legacy profile flag');
      // הדגל: המנוע המאוחד — והתבניות שלו מהחוזה
      process.env.RED_UNIFIED_IMUD = '1';
      try {
        const unifiedRes = typeset(doc, liveImudSettings(), { noRecommendations: true });
        assertEq(unifiedRes.legacyProfile, undefined, 'unified has no legacy profile');
        // עמוד דו-טורי כלשהו עם תוכן (REGULAR או SIGN_OPEN — שניהם דו-טוריים)
        const regular = unifiedRes.pages.find(p =>
          (p.type === PAGE_TYPES.REGULAR || p.type === PAGE_TYPES.SIGN_OPEN) && (p.columns[0] || []).length);
        assertClose(regular.template.columns[0].x, GEO.COL_R_X, 0.01, 'unified right col x');
        assertClose(regular.template.gutter, 13.48, 0.01, 'unified gutter');
      } finally {
        delete process.env.RED_UNIFIED_IMUD;
      }
    } finally {
      unregisterFont('Guttman Rashi');
    }
  });
});

describe('s9d-segment1 — הקורפוס הקנוני בפרופיל DP הכללי: נעילת cross-check', () => {
  it('digest של הקורפוס הקנוני (DP כללי) זהה לנעילה המתועדת fdff19d8 (cross-check-locks, חודשה ב-9b.2/D-107)', () => {
    // מקור הנעילה: tools/cross-check-locks.json — "canonical (DP)" lockHash=fdff19d8,
    // חודשה ב-18.11 (9b.2, D-107: 36→37 עמ\', עמוד toc-detail חדש) עם תיעוד מלא
    // בקובץ הנעילות. בדיקה זו מריצה את אותו קלט/הגדרות בדיוק כמו cross-check
    // (typeset + getDefaultSettings) ומשווה את layoutHash לנעילה — ללא golden מומצא.
    const { typeset } = require('../../src/engine/core/pipeline');
    const { registerFont, unregisterFont } = require('../../src/engine/typography/measure-api');
    const fixture = path.join(__dirname, '..', 'fixtures', 'canonical_corpus.txt');
    if (!fs.existsSync(fixture)) { console.error('   (fixture לא נמצא — דילוג מבלי להיכשל)'); return; }
    const fontPath = path.join(RB, 'ui/assets/imud/fonts/Guttman-Rashi-Normal.ttf');
    registerFont('Guttman Rashi', fs.readFileSync(fontPath));
    try {
      const text = fs.readFileSync(fixture, 'utf8');
      const res = typeset(text, getDefaultSettings(), { noRecommendations: true });
      // פרופיל: DP כללי (לא IMUD, לא מורשת) — כמו cross-check
      assertEq(res.legacyProfile === true, false, 'not legacy profile');
      // הנעילה המתועדת
      assertEq(String(res.layoutHash).startsWith('fdff19d8'), true,
        `layoutHash ${String(res.layoutHash).slice(0, 16)} ≠ lock fdff19d8`);
      assertEq(res.pages.length > 0, true, 'pages exist');
      // שלילה: קלט מוטמע קלות חייב לשנות את ה-digest (הבדיקה מזהה שינוי אמיתי)
      const mutated = text + '\nשורת תוכן נוספת לשינוי ה-digest לצורך בדיקת השלילה';
      const res2 = typeset(mutated, getDefaultSettings(), { noRecommendations: true });
      assertEq(String(res2.layoutHash).startsWith('fdff19d8'), false,
        'negative control failed: mutated input must change the digest');
    } finally {
      unregisterFont('Guttman Rashi');
    }
  });
});

report('s9d-segment1-geometry');
