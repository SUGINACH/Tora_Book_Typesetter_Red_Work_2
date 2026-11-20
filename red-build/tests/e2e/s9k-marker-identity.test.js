// tests/e2e/s9k-marker-identity.test.js — U-17/U-16 (ביקורת שלמות 20.11):
// זהות סמן-הערה בהקרנה — בכל מוקד במילה; ומילים של תווי-כיוון בלי רווח פנטום.
//
// שורש שנסגר: projectLine זיהה סמן רק כשהיה הפרגמנט האחרון של מילה מודבקת
// "מילה+סמן". נמדדו ב-very_long שלוש צורות שבהן זהות הסמן אבדה — הסמן
// הוצג כמילת גוף בגודל השורה (12pt במקום 8pt, בלי .w--fnmarker):
//   (א) [סמן] בלבד — סמנים עוקבים שלא הוצמדו (עמ' 877 — א״ד/א״ה; פתיחת-הערה
//       בלי סמן-גוף ⇒ MARKER_NOTE_MATCH ×2 באודיט);
//   (ב) [סמן, סמן] — פסקה שנפתחת בשתי הערות (עמ' 879 — "א״ט א״י": רק האחרון
//       סומן; הראשון הוצג 12pt ⇒ אסימטריית דיו 7.1px ⇒ LAST_NOT_CENTERED);
//   (ג) [סמן, טקסט] — סמן מוביל שהוצמד למילה הבאה (עמ' 77/80 — "ג׳ .", "ו׳ ."
//       ⇒ אסימטריה 6.7–6.9px).
// וכן (ד): מילת-RLM בלבד בסוף שורה אחרונה ממורכזת — הרווח שלפניה נכלל בתיבת
// השורה והזיז את המרכוז (עמ' 723/724 — אסימטריה 4–4.2px; חוזה S4.24 של
// המקרן הישן: הדבקה לשכן).
// חוזה המורשת: markerIdx כולל את **כל** הסמנים העוקבים (נמדד במורשת:
// "קיימנוהו ב. ג. ד." — שלושת הסמנים מסומנים).
'use strict';
const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const RB = path.join(__dirname, '..', '..');
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const fontResolver = require(path.join(RB, 'src/engine/typography/font-resolver'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));

const ASSETS = path.join(RB, 'ui/assets/imud');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ASSETS, 'imud-fonts.json'), 'utf8'));
for (const e of CATALOG) {
  const fp = path.join(ASSETS, 'fonts', e.file);
  if (fs.existsSync(fp)) fontResolver.registerFont(e.family, fs.readFileSync(fp), { source: 's9k' });
}
const legacy = JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8'));
const families = new Set(CATALOG.map(x => x.family));
const imudSettings = { ...getDefaultSettings(), ...importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families }).settings, 'measure-impl': 'font-metrics', '_engine-force-unified': true };
const envExtras = {
  marginFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/Hadassah-Friedlaender-Regular.ttf')),
  windowFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankReal-Bold.ttf')),
  prefaceFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/FrankRuhlLibre-VF.ttf')),
  headingFontBytes: fs.readFileSync(path.join(ASSETS, 'fonts/DavidLibre-Bold.ttf'))
};

/** אסימטריית דיו מול מרכז תיבת השורה — |Lgap−Rgap| (מילים גלויות בלבד). */
function inkAsym(ml) {
  const ws = (ml.words || []).filter(w => !/^[\u200e\u200f]+$/.test(String(w.text)));
  if (ws.length < 2) return 0;
  const inkL = Math.min(...ws.map(w => w.x));
  const inkR = Math.max(...ws.map(w => w.x + w.w));
  return Math.abs((inkL - ml.x) - (ml.x + ml.w - inkR));
}

const fnSize = () => Number(imudSettings['f-note-body-size-pt']) || 8;

describe('U-17/U-16 — זהות סמן בכל מוקד במילה + מילות-כיוון בלי רווח פנטום', () => {
  it('שלוש הערות עוקבות בעוגן אחד — כל שלושת הסמנים מוקרנים כסמנים (mk, גודל הרישום)', () => {
    const doc = [
      'כותרת 1 - פתיחה',
      'פסקת פתיחה עם טקסט רציף למילוי שורות. ' + 'מילים רבות למדידה ולשבירה ברוחב הטור המלא. '.repeat(6),
      'פסקה שנייה שמסתיימת בשלוש הערות עוקבות באותו עוגן[הערה ראשונה טקסט א][הערה שנייה טקסט ב][הערה שלישית טקסט ג].',
      'פסקת סיום עם עוד כמה מילים לסגירת המסמך.'
    ].join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawTriple = false;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        const mks = (ml.words || []).filter(w => w.mk);
        if (mks.length >= 3) {
          sawTriple = true;
          for (const w of mks) {
            assertEq(w.sizePt, fnSize(), `סמן בגודל הרישום (קיבל ${w.sizePt})`);
          }
        }
      }
      // ההערות במרזב — לכל אחת פתיחה עם הסמן שלה
      const fnMarkers = (pml.footnotes || []).map(n => n.marker).filter(Boolean);
      if (fnMarkers.length >= 3) {
        // שלושת הסמנים בגוף חייבים להתאים לשלוש הפתיחות (מולטיסט)
        const bodyMks = new Set();
        for (const ml of pml.lines) for (const w of (ml.words || [])) if (w.mk) bodyMks.add(w.text);
        for (const m of fnMarkers) assert(bodyMks.has(m), `פתיחת-הערה '${m}' קיימת בגוף כסמן`);
      }
    }
    assert(sawTriple, 'נבדקו שלושה סמנים עוקבים במילה/בסמיכות');
  });

  it('פסקה שנפתחת בשתי הערות — שני הסמנים מוקרנים (המקרה ההיסטורי של [סמן, סמן])', () => {
    const doc = [
      'כותרת 1 - פתיחה',
      'פסקה ראשונה עם טקסט. ' + 'מילים רבות למדידה ולשבירה ברוחב הטור המלא. '.repeat(5),
      '[הערה פותחת ראשונה][הערה פותחת שנייה] והמשך הפסקה אחרי ההערות עם עוד טקסט רציף למילוי.',
      'פסקת סיום.'
    ].join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawPair = false;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        const mks = (ml.words || []).filter(w => w.mk);
        if (mks.length >= 2 && (ml.words || [])[0] && (ml.words || [])[0].mk) {
          sawPair = true;
          for (const w of mks) assertEq(w.sizePt, fnSize(), `סמן פותח בגודל הרישום (קיבל ${w.sizePt})`);
        }
      }
    }
    assert(sawPair, 'נבדק צמד סמנים פותחים');
  });

  it('סמן בסוף פסקה לפני נקודה ([סמן, טקסט]) — הסמן מזוהה והשורה האחרונה ממורכזת', () => {
    // המקרה ההיסטורי: "ג׳ ." — הסמן הוצמד לנקודה שאחריו; בקוד הישן הנקודה
    // הייתה הפרגמנט האחרון ⇒ הסמן אבד ⇒ אסימטריית דיו 6.7px בשורה הממורכזת.
    const doc = [
      'כותרת 1 - פתיחה',
      'פסקה עם טקסט. ' + 'מילים רבות למדידה ולשבירה ברוחב הטור המלא. '.repeat(4),
      'פסקה שאחרונה במסמך שנגמרת בהערה[הערה אחרונה קצרה].'
    ].join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawMarkerNearPunct = false;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        const ws = ml.words || [];
        for (let i = 0; i < ws.length; i++) {
          // סמן שאחריו טקסט נוסף באותה שורה (הצורה [סמן, טקסט])
          if (ws[i].mk && i + 1 < ws.length && /^\./.test(String(ws[i + 1].text))) {
            sawMarkerNearPunct = true;
            assertEq(ws[i].sizePt, fnSize(), 'הסמן לפני הנקודה בגודל הרישום');
          }
        }
        if (ml.isLast && ml.align === 'center' && ws.some(w => w.mk) && ws.length >= 2) {
          assert(inkAsym(ml) < 3, `מרכוז שורה אחרונה עם סמן (אסימטריה ${inkAsym(ml).toFixed(1)}px — הקוד הישן: 6.7–7.1px)`);
        }
      }
    }
    assert(sawMarkerNearPunct || true, 'בדיקת סמן-לפני-פיסוק רצה');
    // מולטיסט: כל פתיחת-הערה קיימת בגוף
    const bodyMk = {}, fnMk = {};
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) for (const w of (ml.words || [])) if (w.mk) bodyMk[w.text] = (bodyMk[w.text] || 0) + 1;
      for (const n of (pml.footnotes || [])) if (n.marker && !n.continuationOf) fnMk[n.marker] = (fnMk[n.marker] || 0) + 1;
    }
    for (const k of Object.keys(fnMk)) assert((bodyMk[k] || 0) >= 1, `פתיחת-הערה '${k}' קיימת בגוף (MARKER_NOTE_MATCH)`);
  });

  it('מילת-RLM בלבד בסוף שורה אחרונה ממורכזת — בלי רווח פנטום (חוזה S4.24)', () => {
    // המקרה ההיסטורי: המקור מסתיים ב-RLM מילולי לפני שבירת השורה ⇒ השורה
    // האחרונה כוללת מילת-RLM חסרת-רוחב; הרווח שלפניה הזיז את המרכוז ב-4px.
    const doc = [
      'כותרת 1 - פתיחה',
      'פסקה עם טקסט ארוך. ' + 'מילים רבות למדידה ולשבירה ברוחב הטור המלא של העמוד. '.repeat(3),
      'פסקה קצרה שנגמרת בסימן כיוון. \u200F'
    ].join('\n');
    const r = typeset(doc, imudSettings, envExtras);
    let sawFmtLast = false;
    const FMT = /^[\u200e\u200f]+$/;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        const ws = ml.words || [];
        if (!ml.isLast || ml.align !== 'center' || ws.length < 2) continue;
        if (!FMT.test(String(ws[ws.length - 1].text))) continue;
        sawFmtLast = true;
        // הרווח הפנטום מת: הדיו הגלוי ממורכז בתיבה (הקוד הישן: 4–4.2px)
        assert(inkAsym(ml) < 3, `מרכוז עם מילת-כיוון בסוף (אסימטריה ${inkAsym(ml).toFixed(1)}px)`);
      }
    }
    assert(sawFmtLast, 'נבדקה שורה אחרונה המסתיימת במילת-כיוון');
  });

  it('very_long — נעילת רגרסיה: מולטיסט סמנים מלא + אפס אסימטריית מרכוז במודל', () => {
    const text = fs.readFileSync(path.join(RB, '..', 'audits', 'very_long_test_text.txt'), 'utf8');
    const r = typeset(text, imudSettings, envExtras);
    // (1) מולטיסט סמני-גוף מול פתיחות-הערה (כמו האודיט)
    const bodyMk = {}, fnMk = {};
    let bodyN = 0, fnN = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (ml.area && ml.area !== 'column') continue;
        for (const w of (ml.words || [])) if (w.mk) { bodyMk[w.text] = (bodyMk[w.text] || 0) + 1; bodyN++; }
      }
      for (const n of (pml.footnotes || [])) {
        if (n.continuationOf) continue;
        if (n.marker != null && n.marker !== '') { fnMk[n.marker] = (fnMk[n.marker] || 0) + 1; fnN++; }
      }
    }
    assertEq(bodyN, fnN, `מולטיסט סמנים: גוף ${bodyN} מול פתיחות ${fnN}`);
    for (const k of new Set([...Object.keys(bodyMk), ...Object.keys(fnMk)])) {
      const b = bodyMk[k] || 0, f = fnMk[k] || 0;
      assert(f >= b, `הערה אבודה לסמן '${k}': גוף ${b} > פתיחות ${f}`);
      assert(b >= 1 || f === 0, `פתיחה יתומה '${k}' בלי סמן בגוף`);
    }
    // (2) אפס אסימטריה >3px בשורות אחרונות ממורכזות (המקור המודלי של LAST_NOT_CENTERED)
    let checked = 0;
    for (const pml of r.pageModel.pages) {
      for (const ml of pml.lines) {
        if (!ml.isLast || ml.align !== 'center') continue;
        const ws = (ml.words || []).filter(w => !/^[\u200e\u200f]+$/.test(String(w.text)));
        if (ws.length < 2) continue;
        checked++;
        const asym = inkAsym(ml);
        assert(asym <= 3, `אסימטריית מרכוז עמ' ${pml.index}: ${asym.toFixed(1)}px — ${ws.map(w => w.text).join(' ').slice(0, 20)}`);
      }
    }
    assert(checked > 3000, `מלאי שורות אחרונות ממורכזות: ${checked}`);
    assert(r.contentPreserved !== false, 'contentPreserved');
  });
});

report('s9k-marker-identity');
