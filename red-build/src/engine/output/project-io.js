// src/engine/output/project-io.js — Project JSON export/import with settings_version + migrations (S4.1.2, S12)
'use strict';

const { getDefaultSettings, registry, derivePlacementFlags } = require('../core/settings-registry');

/**
 * מיפויי נדידה v1→v2: כינויים ישנים מכל 5 הריפואים → מפתח canonical.
 * ערכים לא־ידועים נשמרים (font-picker preserve-missing-value — IMUD port).
 */
const MIGRATIONS = [
  { version: 2, renames: {
    'pageNumFormat': 'page-num-format',
    'pageNumFrame': 'page-num-frame',
    'pageNumPosition': 'page-num-position',
    'initialPageNumber': 'page-num-initial-value',
    'bodyFontSize': 'body-font-size-pt',
    'lineHeight': 'body-line-height',
    'colWidthPct': 'grid-col-width-pct',
    'marginSidePct': 'grid-margin-side-pct',
    'gutterPct': 'grid-gutter-pct',
    'balanceChapterEnd': 'balance-chapter-end',
    'tocLevel1Show': 'toc-level-1-show',
    'avoid-runt-word': 'runt-min-width-pct' // פנטום Yellow/Green → מנגנון אמיתי כאן
  } }
];

function migrate(raw) {
  let s = { ...raw };
  const from = Number(s.settings_version || 1);
  for (const m of MIGRATIONS) {
    if (m.version > from) {
      for (const [oldK, newK] of Object.entries(m.renames)) {
        if (oldK in s && !(newK in s)) { s[newK] = s[oldK]; delete s[oldK]; }
      }
      s.settings_version = m.version;
    }
  }
  if (!s.settings_version) s.settings_version = 2;
  return s;
}

/** איחוד עם defaults; אי‑התאמות מדווחות ולא מושמטות (audit deltas attributable).
 * **F-J1 (W-5, 27.11) — מצב sanitize לנתיבי הייבוא:** ערך בלתי-חוקי (enum/טווח)
 * מתורגם קודם דרך translateLegacyValue (ערך מעידן המקור); אם אין תרגום ישים —
 * נופל לברירת המחדל של הרישום. הפעולה מתועדת ב-issue (action) — הערך הבלתי-חוקי
 * לעולם אינו מגיע למנוע בשקט ("נתיב אחד לכל קלט"). ברירת המחדל (בלי opts)
 * משמרת את ההתנהגות ההיסטורית (kept) לצרכנים קיימים. */
function mergeWithDefaults(migrated, opts = {}) {
  const defs = getDefaultSettings();
  // derivePlacementFlags **אחרי** האיחוד — mode הוא מקור־האמת; דגלים שהומרו מקובץ
  // v1 ישן (ללא mode) נגזרים שוב כך שלעולם לא ייווצר מצב סותר מאובדן הערות (BRZ-15).
  const merged = derivePlacementFlags({ ...defs, ...migrated, settings_version: 2 });
  // **S4.6:** מפתחות פנימיים (קו-תחתון — נכסי זמן-ריצה כמו _legacy-ui-state/_customStyles)
  // אינם "מפתחות לא מוכרים" — הם מבנה נתונים מתועד; ערכיהם עוברים במיזוג.
  const unknownKeys = Object.keys(migrated).filter(k => !(k in defs) && !k.startsWith('_'));
  const issues = [];
  const sanitize = !!(opts && opts.sanitizeIllegal);
  const translateValue = (opts && typeof opts.translateValue === 'function') ? opts.translateValue : null;
  for (const r of registry) {
    let v = merged[r.id];
    let illegal = false;
    if (r.type === 'enum' && r.enum && !r.enum.includes(v)) illegal = true;
    if (r.type === 'number' && ((r.min != null && v < r.min) || (r.max != null && v > r.max))) illegal = true;
    if (!illegal) continue;
    if (sanitize) {
      let action = 'reverted-to-default';
      let out = r.default;
      if (translateValue) {
        const t = translateValue(r.id, v, (opts && opts.translateCtx) || {});
        if (t !== undefined) {
          const okEnum = !(r.type === 'enum' && r.enum && !r.enum.includes(t));
          const okRange = !(r.type === 'number' && ((r.min != null && t < r.min) || (r.max != null && t > r.max)));
          if (okEnum && okRange) { out = t; action = 'translated-legacy-value'; }
        }
      }
      merged[r.id] = out;
      issues.push({ key: r.id, value: v, reason: r.type === 'enum' ? 'not-in-enum' : 'out-of-range', kept: false, action, applied: out });
    } else {
      issues.push({ key: r.id, value: v, reason: r.type === 'enum' ? 'not-in-enum' : 'out-of-range', kept: true });
    }
  }
  return { merged, unknownKeys, issues };
}

function exportProject(pagesData, settings, meta) {
  return JSON.stringify({
    format: 'tora-typesetter-project',
    format_version: 1,
    engine: 'red-unified',
    exported_at: (meta && meta.timestamp) || null, // דטרמיניסטי: אין Date() אוטומטי בליטה
    settings,
    meta: meta || {},
    pages: pagesData
  }, null, 2);
}

function importProject(json) {
  const raw = typeof json === 'string' ? JSON.parse(json) : json;
  if (raw.format !== 'tora-typesetter-project') throw new Error('unknown project format');
  const migrated = migrate(raw.settings || {});
  // **F-J1 (W-5):** ערך בלתי-חוקי בפרויקט מיובא — תרגום/החזרה לברירת מחדל, לא מעבר שקט למנוע.
  const { translateLegacyValue } = require('../core/legacy-settings-map');
  const { merged, unknownKeys, issues } = mergeWithDefaults(migrated, { sanitizeIllegal: true, translateValue: translateLegacyValue });
  return { settings: merged, pages: raw.pages || [], meta: raw.meta || {}, unknownKeys, issues };
}

module.exports = { migrate, mergeWithDefaults, exportProject, importProject, MIGRATIONS };
