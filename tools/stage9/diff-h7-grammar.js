#!/usr/bin/env node
// tools/stage9/diff-h7-grammar.js — השוואת סיווג שורות בין שני הטוקנייזרים
'use strict';

/**
 * **9c (§5.1 בהוראה — תיקון חוב כלי אבחון):** בעבר החזיק הכלי עותק עצמאי
 * של HEADING_RE שהתיישן (בלי קבוצות המספר והציטוט של 9b.3) ודיווח דקדוק
 * שונה מהפרסר. כעת **אין עותק עצמאי**: הדקדוק המאוחד מיובא מ-dfa-lexer
 * (אותו אובייקט Regex בזהות) והדקדוק המורשת מיובא מ-legacy-imud-flow
 * (LEGACY_HEADING_RE — מיוצא ממקום השימוש בפועל ב-tokenizeDoc).
 * בדיקת s9c-h7-tool-parity מוכיחה זהות אובייקטים וקבוצות סמנטיות.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const RB = path.join(ROOT, 'red-build');

// הדקדוק המאוחד — מיובא מהפרסר (זהות אובייקט, לא עותק)
const { HEADING_RE } = require(path.join(RB, 'src/engine/parser/dfa-lexer'));
// הדקדוק המורשת — מיוצא מ-legacy-imud-flow ממקום השימוש בפועל (tokenizeDoc)
const { LEGACY_HEADING_RE } = require(path.join(__dirname, '..', 'layout-audit', 'legacy-text-utilities')); // **2ae45b9:** הדקדוק ההיסטורי עבר לכלי האודיט (המנוע הוסר)

/** הרצת ההשוואה על טקסט נתון — מיוצאת לבדיקות (בלי צריכת מערכת קבצים). */
function diffH7Grammar(text) {
  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
  let legacySide = 0, unifiedH7 = 0, legacySideNotUnified = 0, unifiedH7NotLegacy = 0;
  const samples = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const lm = line.match(LEGACY_HEADING_RE);
    const um = line.match(HEADING_RE);
    const legacyIsSide = !!(lm && Number(lm[1]) === 7); // HEADING_MODES[7]='side_note' תמיד במורשת
    const unifiedIsH7 = !!(um && um[2] !== undefined && Number(um[2]) === 7);
    if (legacyIsSide) legacySide++;
    if (unifiedIsH7) unifiedH7++;
    if (legacyIsSide && !unifiedIsH7) { legacySideNotUnified++; if (samples.length < 15) samples.push({ line: i + 1, text: line.slice(0, 100) }); }
    if (unifiedIsH7 && !legacyIsSide) { unifiedH7NotLegacy++; if (samples.length < 15) samples.push({ line: i + 1, text: '[U] ' + line.slice(0, 100) }); }
  }
  return { totalLines: lines.length, legacySide, unifiedH7, legacySideNotUnified, unifiedH7NotLegacy, samples };
}

/** CLI — בלי ארגומנט: הקורפוס הקנוני. */
function main() {
  const file = process.argv[2] || path.join(RB, 'tests/fixtures/canonical_corpus.txt');
  const text = fs.readFileSync(file, 'utf8');
  const r = diffH7Grammar(text);
  console.log(`שורות מקור: ${r.totalLines}`);
  console.log(`מורשת-מסווג-הערת-צד (כותרת 7): ${r.legacySide}`);
  console.log(`מאוחד-מסווג-H7: ${r.unifiedH7}`);
  console.log(`מורשת-בלבד (צד, לא H7 במאוחד): ${r.legacySideNotUnified}`);
  console.log(`מאוחד-בלבד: ${r.unifiedH7NotLegacy}`);
  console.log('\nדוגמאות לחוסר התאמה:');
  for (const s of r.samples) console.log(`  שורה ${s.line}: ${s.text}`);
}

if (require.main === module) main();

module.exports = { diffH7Grammar, HEADING_RE, LEGACY_HEADING_RE };
