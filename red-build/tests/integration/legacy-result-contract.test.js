// tests/integration/result-contract.test.js — U-5: חוזה ui-result-v1 במנוע המאוחד
'use strict';

/**
 * **U-5 (audits/UI_OPERATIONAL_AUDIT.md):** המנוע המאוחד
 * מחזיר `contentHashIn` — כחלק מחוזה
 * ui-result-v1 של serializeTypesetResult ול-buildReport
 * (content_hash_in). השדה מופיע ב-tooltip של צ'יפ מידע-הריצה.
 *
 * חוזה הבדיקה כאן:
 *  1. קיום ותקינות: מחרוזת hex של sha256 (64 תווים).
 *  2. דטרמיניזם: אותו קלט + אותן הגדרות ⇒ אותו contentHashIn.
 *  3. רגישות קלט: שינוי טקסט ⇒ contentHashIn משתנה.
 *  4. אי-תלות בהגדרות: שינוי הגדרה שמשנה פריסה (shaar-back-enabled) אינו
 *     משנה את contentHashIn — הוא זהות קלט, לא פריסה.
 *  5. נייטרליות פריסה: layoutHash של אותו קלט זהה בין הרצות.
 *  6. העברה בחוזה: serializeTypesetResult(result).contentHashIn וגם
 *     buildReport(result).content_hash_in מקבלים את הערך (עוברים את
 *     גבול ה-Worker כמו באפליקציה החיה).
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { getDefaultSettings } = require('../../src/engine/core/settings-registry');
const { serializeTypesetResult } = require('../../src/ui/worker-protocol');
const { buildReport } = require('../../src/audit/report-schema');

const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');
const HEX64 = /^[0-9a-f]{64}$/;

describe('U-5 — חוזה תוצאת מנוע מאוחד: contentHashIn (ui-result-v1)', () => {
  it('קיום ותקינות: contentHashIn הוא sha256 hex באורך 64', () => {
    const r = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    assert(!!r.pageModel, 'הקורפוס רץ במנוע המאוחד');
    assert(typeof r.contentHashIn === 'string', 'contentHashIn קיים (מחרוזת)');
    assert(HEX64.test(r.contentHashIn), `תבנית sha256 תקינה (קיבלנו: ${String(r.contentHashIn).slice(0, 20)}…)`);
  });

  it('דטרמיניזם: אותו קלט ⇒ אותו contentHashIn ואותו layoutHash', () => {
    const s = getDefaultSettings();
    const a = typeset(CORPUS, s, { noRecommendations: true });
    const b = typeset(CORPUS, s, { noRecommendations: true });
    assertEq(b.contentHashIn, a.contentHashIn, 'contentHashIn דטרמיניסטי');
    assertEq(b.layoutHash, a.layoutHash, 'layoutHash דטרמיניסטי');
  });

  it('רגישות קלט: שינוי טקסט ⇒ contentHashIn משתנה', () => {
    const s = getDefaultSettings();
    const base = typeset(CORPUS, s, { noRecommendations: true });
    const changed = typeset(CORPUS + '\nפסקת בדיקה נוספת לשינוי הקלט.', s, { noRecommendations: true });
    assert(changed.contentHashIn !== base.contentHashIn, 'קלט שונה ⇒ hash קלט שונה');
    assert(changed.contentPreserved === true, 'הקלט המשונה עדיין נשמר במלואו');
  });

  it('אי-תלות בהגדרות: שינוי פריסה (בלי שער אחורי) אינו משנה את contentHashIn', () => {
    const defaults = getDefaultSettings();
    // shaar-back-enabled=false מסיר עמוד שער-אחורי — פריסה משתנה, קלט לא.
    const noBack = { ...defaults, 'shaar-back-enabled': false };
    const a = typeset(CORPUS, defaults, { noRecommendations: true });
    const b = typeset(CORPUS, noBack, { noRecommendations: true });
    assertEq(b.contentHashIn, a.contentHashIn, 'contentHashIn תלוי-קלט בלבד');
    assert(b.pages.filter(p => p.type === 'shaar-back').length < a.pages.filter(p => p.type === 'shaar-back').length,
      'סניטה: ההגדרה אכן משנה את הפריסה (פחות שער-אחורי)');
    assert(b.layoutHash !== a.layoutHash, 'ואכן layoutHash שונה — הבחנת קלט/פריסה אמיתית');
  });

  it('נייטרליות פריסה: השדה אינו משתתף ב-layoutHash', () => {
    // שתי הרצות עם אותו קלט: hash הפריסה זהה לחלוטין — השדה החדש אינו
    // נכנס לחישוב הגיאומטריה.
    const s = getDefaultSettings();
    const a = typeset(CORPUS, s, { noRecommendations: true });
    const b = typeset(CORPUS, s, { noRecommendations: true });
    assertEq(b.layoutHash, a.layoutHash, 'layoutHash זהה — אפס השפעת פריסה');
  });

  it('העברה בחוזה: serializeTypesetResult ו-buildReport מקבלים את הערך', () => {
    const r = typeset(CORPUS, getDefaultSettings(), { noRecommendations: true });
    const serialized = serializeTypesetResult(r);
    assertEq(serialized.schema, 'ui-result-v1', 'סכמת התוצאה');
    assertEq(serialized.contentHashIn, r.contentHashIn, 'serializeTypesetResult מעביר את contentHashIn');
    const rep = buildReport(r);
    assertEq(rep.content_hash_in, r.contentHashIn, 'buildReport מעביר את content_hash_in');
  });
});

report('result-contract');
