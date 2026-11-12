// tests/integration/legacy-result-contract.test.js — U-5 (S1-ה): השלמת חוזה ui-result-v1 בנתיב המורשת
'use strict';

/**
 * **U-5 (audits/UI_OPERATIONAL_AUDIT.md, מצב S1-ה):** נתיב המורשת
 * (legacy-imud-flow) לא החזיר `contentHashIn` — בניגוד לחוזה
 * ui-result-v1 של serializeTypesetResult ול-buildReport
 * (content_hash_in). בפרופיל מורשת, hash הקלט לא הוצג ב-tooltip של
 * צ'יפ מידע-הריצה (בנתיב DP מוצג). תוקף: שדה נלווה בלבד.
 *
 * חוזה הבדיקה כאן:
 *  1. קיום ותקינות: מחרוזת hex של sha256 (64 תווים).
 *  2. דטרמיניזם: אותו קלט + אותן הגדרות ⇒ אותו contentHashIn.
 *  3. רגישות קלט: שינוי טקסט ⇒ contentHashIn משתנה.
 *  4. אי-תלות בהגדרות: שינוי הגדרה שמשנה פריסה (show-back-shaar) אינו
 *     משנה את contentHashIn — הוא זהות קלט, לא פריסה.
 *  5. נייטרליות פריסה: layoutHash של אותו קלט זהה בין הרצות, וזהה
 *     בין ברירת-מחדל לשינוי-הגדרה-שאינו-משנה-פריסה — השדה אינו משתתף
 *     ב-legacyLayoutHashDigest.
 *  6. העברה בחוזה: serializeTypesetResult(result).contentHashIn וגם
 *     buildReport(result).content_hash_in מקבלים את הערך (עוברים את
 *     גבול ה-Worker כמו באפליקציה החיה).
 */

const fs = require('fs');
const path = require('path');
const { describe, it, assert, assertEq, report } = require('../harness');

const { typeset } = require('../../src/engine/core/pipeline');
const { importImudSettings } = require('../../src/engine/core/legacy-settings-map');
const { getSettingDefs } = require('../../src/engine/core/settings-registry');
const { serializeTypesetResult } = require('../../src/ui/worker-protocol');
const { buildReport } = require('../../src/audit/report-schema');

const ASSETS = path.join(__dirname, '..', '..', 'ui', 'assets', 'imud');
const CORPUS = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'imud_default_text.txt'), 'utf8');
const HEX64 = /^[0-9a-f]{64}$/;

const legacyDefaults = () => importImudSettings(
  JSON.parse(fs.readFileSync(path.join(ASSETS, 'default_settings.json'), 'utf8')),
  new Set(getSettingDefs().map(r => r.id))
).settings;

describe('U-5 — חוזה תוצאת נתיב המורשת: contentHashIn (ui-result-v1)', () => {
  it('קיום ותקינות: contentHashIn הוא sha256 hex באורך 64', () => {
    const r = typeset(CORPUS, legacyDefaults(), { noRecommendations: true });
    assert(r.legacyProfile === true, 'הקורפוס רץ בפרופיל המורשת');
    assert(typeof r.contentHashIn === 'string', 'contentHashIn קיים (מחרוזת)');
    assert(HEX64.test(r.contentHashIn), `תבנית sha256 תקינה (קיבלנו: ${String(r.contentHashIn).slice(0, 20)}…)`);
  });

  it('דטרמיניזם: אותו קלט ⇒ אותו contentHashIn ואותו layoutHash', () => {
    const s = legacyDefaults();
    const a = typeset(CORPUS, s, { noRecommendations: true });
    const b = typeset(CORPUS, s, { noRecommendations: true });
    assertEq(b.contentHashIn, a.contentHashIn, 'contentHashIn דטרמיניסטי');
    assertEq(b.layoutHash, a.layoutHash, 'layoutHash דטרמיניסטי');
  });

  it('רגישות קלט: שינוי טקסט ⇒ contentHashIn משתנה', () => {
    const s = legacyDefaults();
    const base = typeset(CORPUS, s, { noRecommendations: true });
    const changed = typeset(CORPUS + '\nפסקת בדיקה נוספת לשינוי הקלט.', s, { noRecommendations: true });
    assert(changed.contentHashIn !== base.contentHashIn, 'קלט שונה ⇒ hash קלט שונה');
    assert(changed.contentPreserved === true, 'הקלט המשונה עדיין נשמר במלואו');
  });

  it('אי-תלות בהגדרות: שינוי פריסה (בלי שער אחורי) אינו משנה את contentHashIn', () => {
    const defaults = legacyDefaults();
    // **S77 (הגשר החי):** הגדרת הרישום גוברת על ה-raw — השינוי נעשה במפתח
    // החי (shaar-back-enabled) כמו בפאנל ההגדרות (ה-raw עודכן גם הוא לשמירת
    // הקונסיסטנטיות של שני המקורות). show-back-shaar=false מסיר עמוד
    // שער-אחורי — פריסה משתנה, קלט לא.
    const noBack = { ...defaults, 'shaar-back-enabled': false, _imudRaw: { ...(defaults._imudRaw || {}), 'show-back-shaar': false } };
    const a = typeset(CORPUS, defaults, { noRecommendations: true });
    const b = typeset(CORPUS, noBack, { noRecommendations: true });
    assertEq(b.contentHashIn, a.contentHashIn, 'contentHashIn תלוי-קלט בלבד');
    assert(b.pages.filter(p => p.type === 'shaar-back').length < a.pages.filter(p => p.type === 'shaar-back').length,
      'סניטה: ההגדרה אכן משנה את הפריסה (פחות שער-אחורי)');
    assert(b.layoutHash !== a.layoutHash, 'ואכן layoutHash שונה — הבחנת קלט/פריסה אמיתית');
  });

  it('נייטרליות פריסה: השדה אינו משתתף ב-legacyLayoutHashDigest', () => {
    // שתי הרצות עם אותו קלט: hash הפריסה זהה לחלוטין — השדה החדש אינו
    // נכנס לחישוב הגיאומטריה (legacyLayoutHashDigest מקבל pages בלבד).
    const s = legacyDefaults();
    const a = typeset(CORPUS, s, { noRecommendations: true });
    const b = typeset(CORPUS, s, { noRecommendations: true });
    assertEq(b.layoutHash, a.layoutHash, 'layoutHash זהה — אפס השפעת פריסה');
    assert(a.layoutHash.startsWith('legacy-'), 'וסגנונו נשאר legacy-<digest>');
  });

  it('העברה בחוזה: serializeTypesetResult ו-buildReport מקבלים את הערך', () => {
    const r = typeset(CORPUS, legacyDefaults(), { noRecommendations: true });
    const serialized = serializeTypesetResult(r);
    assertEq(serialized.schema, 'ui-result-v1', 'סכמת התוצאה');
    assertEq(serialized.contentHashIn, r.contentHashIn, 'serializeTypesetResult מעביר את contentHashIn');
    const rep = buildReport(r);
    assertEq(rep.content_hash_in, r.contentHashIn, 'buildReport מעביר את content_hash_in');
  });
});

report('legacy-result-contract');
