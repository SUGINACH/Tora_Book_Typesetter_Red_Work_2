#!/usr/bin/env node
// tools/stage9/trace-h7.js — מעקב פריטי H7 לאורך הצינור (§3.1 — שלב 9b)
'use strict';
const fs = require('fs');
const path = require('path');
process.env.RED_ENABLE_STRETCH_RECLAIM = process.env.RED_ENABLE_STRETCH_RECLAIM || '1';
process.env.RED_RECLAIM_COMPRESS_MAX = process.env.RED_RECLAIM_COMPRESS_MAX || '20';

const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');
const { lexDocument } = require(path.join(RB, 'src/engine/parser/dfa-lexer'));
const { tokenizeDetailed } = require(path.join(RB, 'src/engine/parser/block-tokenizer'));
const { importImudSettings } = require(path.join(RB, 'src/engine/core/legacy-settings-map'));
const { getSettingDefs, getDefaultSettings } = require(path.join(RB, 'src/engine/core/settings-registry'));
const { registerFont } = require(path.join(RB, 'src/engine/typography/measure-api'));
const { typeset } = require(path.join(RB, 'src/engine/core/pipeline'));

const file = process.argv[2] || path.join(RB, 'tests/fixtures/canonical_corpus.txt');
const text = fs.readFileSync(file, 'utf8');

// מקור לפי הדקדוק המאוחד (טוקנים עם מזהים יציבים)
const defaults = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
const lexed = lexDocument(text, {});
const detailed = tokenizeDetailed(lexed.bodyLines, {
  fnOpen: String(defaults['fn-delim-open'] || '['),
  fnClose: String(defaults['fn-delim-close'] || ']'),
});
const h7Tokens = detailed.tokens.filter(t => t.type === 'heading' && t.level === 7);
console.log(`מקור (טוקנייזר מאוחד): טוקנים=${detailed.tokens.length}, H7=${h7Tokens.length}`);

// מקור לפי טוקנייזר המורשת (sideNote מוצמד לפסקה הבאה)
const { tokenizeDoc } = require(path.join(__dirname, '..', 'layout-audit', 'legacy-text-utilities')); // **2ae45b9:** פונקציית הטקסט עברה לכלי האודיט (המנוע הוסר)
const cfg = { fnOpen: String(defaults['fn-delim-open'] || '['), fnClose: String(defaults['fn-delim-close'] || ']') };
const legTok = tokenizeDoc(text, cfg);
const legSideParas = legTok.tokens.filter(t => t.sideNote);
console.log(`מקור (טוקנייזר מורשת): טוקנים=${legTok.tokens.length}, פסקאות עם sideNote=${legSideParas.length}, מילים=${legSideParas.reduce((n, t) => n + t.sideNote.split(/\s+/).filter(Boolean).length, 0)}`);
const h7leg = legTok.tokens.filter(t => t.type === 'h7');
console.log(`  מתוכם טוקני h7 מפורשים=${h7leg.length} (השאר מוצמדים לפסקאות)`);

// הרצת מאוחד וספירת הצבות
function registerAllFonts() {
  const FONTS = [
    ['Guttman Rashi', 'Guttman-Rashi-Normal.ttf'], ['Frank Ruhl Libre', 'FrankRuhlLibre-VF.ttf'],
    ['Alpha', 'Alpha-Regular.ttf'], ['AlphaBlack', 'Alpha-Black.ttf'], ['AlphaLight', 'Alpha-Light.ttf'],
    ['Lia Sgula', 'Sgula-Regular.ttf'], ['Livorna', 'Livorna-Regular.ttf'], ['FrankReal', 'FrankReal-Regular.ttf'],
    ['David Libre', 'DavidLibre-Regular.ttf'], ['Hadassah Friedlaender', 'Hadassah-Friedlaender.ttf']
  ];
  for (const [fam, f] of FONTS) {
    const fp = path.join(RB, 'ui/assets/imud/fonts', f);
    if (fs.existsSync(fp)) { const r = registerFont(fam, fs.readFileSync(fp)); if (!r.ok) console.error(`registerFont(${fam}): ${r.error}`); }
  }
}
function legacySettings() {
  const legacy = JSON.parse(fs.readFileSync(path.join(RB, 'ui/assets/imud/default_settings.json'), 'utf8'));
  const families = new Set();
  for (const cat of ['imud-fonts.json', 'fonts-extended.json']) {
    const p = path.join(RB, 'ui/assets/imud', cat);
    if (fs.existsSync(p)) for (const f of JSON.parse(fs.readFileSync(p, 'utf8'))) families.add(f.family);
  }
  const imp = importImudSettings(legacy, new Set(getSettingDefs().map(r => r.id)), { availableFonts: families });
  return { ...getDefaultSettings(), ...imp.settings, 'body-font': 'Guttman Rashi', 'measure-impl': 'font-metrics' };
}

registerAllFonts();
const uniSettings = (() => { const s2 = { ...legacySettings() }; delete s2['_layout-profile']; delete s2['_imudRaw']; return s2; })();
const r = typeset(text, uniSettings, {});
if (r.legacyProfile) { console.error('נפל למורשת'); process.exit(2); }

// 1) כמה פריטי צד הוצבו
const placed = (r.sideNotes && r.sideNotes.placed) || [];
const deferred = (r.sideNotes && r.sideNotes.deferred) || [];
console.log(`\nמאוחד: placed=${placed.length}, deferred=${deferred.length}`);

// 2) כיסוי ownToken: כל טוקן H7 של המקור קיבל פריט?
const ownTokens = new Set(placed.map(p => String(p.ownToken)));
const missing = h7Tokens.filter(t => !ownTokens.has(String(t.id)));
console.log(`  ownToken מכסה ${h7Tokens.length - missing.length}/${h7Tokens.length} טוקני H7; חסרים: ${missing.length}`);
if (missing.length) {
  for (const m of missing.slice(0, 10)) console.log(`    - token ${m.id}: "${String(m.text).slice(0, 60)}"`);
}

// 3) כפילויות ownToken (פריט אחד לכל H7)
const counts = new Map();
for (const p of placed) counts.set(String(p.ownToken), (counts.get(String(p.ownToken)) || 0) + 1);
const dupes = [...counts.entries()].filter(([, c]) => c > 1);
console.log(`  ownToken בפריט בודד: ${counts.size - dupes.length}/${counts.size}${dupes.length ? ` — כפילויות: ${dupes.length}` : ''}`);

// 4) anchorToken מצביע לפסקה מארחת תקינה — ומיקום הפריט ביחס לעוגן
// מיפוי tokenId -> עמוד הופעה ראשון (מהמקרין הישן כעזר)
const firstPageByToken = new Map();
for (const pg of r.pages) {
  for (const col of (pg.columns || [])) for (const ln of col) {
    const tok = ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId);
    if (tok != null && !firstPageByToken.has(tok)) firstPageByToken.set(tok, pg.index);
  }
}
let anchorOk = 0, anchorMissing = 0, placedBeforeAnchor = 0, noAnchorLine = 0;
for (const p of placed) {
  const anchorPage = firstPageByToken.get(p.anchorToken);
  if (anchorPage == null) { anchorMissing++; continue; }
  if (p.page > anchorPage) placedBeforeAnchor++; // הפריט אחרי העוגן — תקין (המשך)
  else if (p.page === anchorPage) anchorOk++;
  else { placedBeforeAnchor++; }
}
console.log(`  עוגן באותו עמוד: ${anchorOk}, עוגן חסר בגוף: ${anchorMissing}, פריט לפני/בלי עוגן בעמוד: ${placedBeforeAnchor}`);

// 5) טקסט שמור? השוואת מילים בין טוקני H7 לפריטים
const srcWords = h7Tokens.flatMap(t => String(t.text).split(/\s+/).filter(Boolean)).length;
const placedWords = placed.reduce((n, p) => n + String(p.text || '').split(/\s+/).filter(Boolean).length, 0);
console.log(`  מילים: מקור ${srcWords}, מוצב ${placedWords}`);

// 6) השוואה למורשת — marginNotes
const legSettings = legacySettings();
const rl = typeset(text, legSettings, {});
if (!rl.legacyProfile) { console.error('מורשת לא הופעלה'); process.exit(2); }
let legMarginNotes = 0, legMarginWords = 0;
for (const pg of rl.pages) for (const mn of (pg.marginNotes || [])) { legMarginNotes++; legMarginWords += String(mn.lines ? mn.lines.map(l => l.text).join(' ') : mn.text || '').split(/\s+/).filter(Boolean).length; }
console.log(`\nמורשת: marginNotes=${legMarginNotes}, מילים=${legMarginWords}`);
console.log(`\nמסקנה: מקור H7=${h7Tokens.length} | מאוחד placed=${placed.length} | מורשת marginNotes=${legMarginNotes}`);
