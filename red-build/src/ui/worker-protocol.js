// src/ui/worker-protocol.js — פרוטוקול Worker↔UI (REQ-UI-03, D-65)
'use strict';

/**
 * **D-65 — פרוטוקול מנוע ב־Worker:** הודעות מוגדרות סכמה, מזהי עבודה חד־חוזיים,
 * וסריאליזציה שממירה את תוצאת המנוע (Ledger/EventLog הם class-instances עם Map)
 * למבנה plain-JSON שעובר structured-clone בגבול ה־Worker.
 *
 * הסכמה (v1):
 *   → {type:'typeset-request', jobId, text, settings}
 *   → {type:'cancel', jobId}
 *   ← {type:'progress', jobId, stage, pct, label, pageIndex?, totalPages?, estimatedTotal?}
 *   ← {type:'typeset-result', jobId, result}      // result = serializeTypesetResult()
 *   ← {type:'typeset-error', jobId, message, stack?}
 *
 * **03.11 — v1.1 (ייצוא בדפדפן דרך ה־Worker; המנוע הכבד חי רק שם):**
 *   → {type:'register-font', jobId, name, bytes: ArrayBuffer}       // TTF למדידת גופן אמיתי
 *   ← {type:'register-font-result', jobId, name, ok, error?, glyphCount?}
 *   → {type:'export-request', jobId, kind:'pdf'|'zip', text, settings,
 *       fontBytes?: ArrayBuffer|null, fontName?: string, extensions?: object|null}
 *   ← {type:'export-result', jobId, kind, ok, error?, bytes?: Uint8Array, info?: object}
 *   ← {type:'export-error', jobId, message}
 */

const PROTOCOL_VERSION = 1;

/** **שלב 8 פרוסה 2 (§4.3 — העברת PageModel ב-Worker):** עטיפת transport
 * למודל העמוד: גרסה, ההאשים שחושבו בצד הבונה (הוכחת שלמות לצד המקבל)
 * ואומדן גודל ההעברה. המודל עצמו נתונים טהורים (מערכים/אובייקטים/פרימיטיבים)
 * — עובר structured-clone; ההקפאה מוחזרת בצד המקבל (page-model-transport). */
function serializePageModelTransport(model) {
  if (!model) return null;
  if (model.schema !== 'pagemodel-v1') {
    throw new Error(`protocol: unexpected page model schema ${model.schema}`);
  }
  if (typeof model.geometryHash !== 'string' || typeof model.contentHash !== 'string') {
    throw new Error('protocol: page model missing hashes');
  }
  return {
    transport: 'pagemodel-transport-v1',
    schema: model.schema,
    model,
    geometryHash: model.geometryHash,
    contentHash: model.contentHash,
    bytesEstimate: JSON.stringify(model).length
  };
}

/** סריאליזציית תוצאת מנוע → plain JSON עובר structured-clone (D-65). */
function serializeTypesetResult(result) {
  const { buildReport } = require('../audit/report-schema');
  const report = buildReport(result);
  return {
    schema: 'ui-result-v1',
    // **פרוסה 3 (§2.3) — המנוע המאוחד הוא היחיד:** תמיד 'unified' (מקרין PageModel).
    // שדה legacyProfile הוסר — אין עוד נתיב מורשת.
    legacyProfile: false,
    layoutHash: result.layoutHash,
    plannedLayoutHash: result.plannedLayoutHash,
    contentHashIn: result.contentHashIn,
    contentPreserved: result.contentPreserved,
    geometryNeutralVerified: result.geometryNeutralVerified,
    deterministic: report.deterministic,
    metadata: result.metadata,
    settings: result.settings,
    pages: result.pages,                 // עצמים פשוטים (columns/lines/template) — ניתנים להעברה
    report,                              // findings + counts + retreat (plain)
    trace: result.events.toTraceV2(),    // events: [{seq,stage,label,pageIndex,ts,payload}]
    ledger: result.ledger.toSchemaV2(),  // issues: [...] (lifecycle מלא)
    ledgerSummary: result.ledger.summary(),
    toc: result.toc,
    tocInsert: result.tocInsert,
    numberingAudit: result.numberingAudit,
    tokens: result.tokens.map(t => ({ id: t.id, type: t.type, level: t.level || null, raw: t.raw || '' })),
    droppedEvents: result.events.droppedEvents,
    // **שלב 8 פרוסה 2 (§4.3-4.4):** PageModel עובר בפועל לצרכן ה-UI — עטוף
    // חוזה transport עם ההאשים; הצד המקבל מאמת ומקפיא מחדש. אין מסלול
    // חלופי של מסמך-גולמי לצורך רינדור.
    pageModel: serializePageModelTransport(result.pageModel || null),
    // **S1-ח (gap-Gold-V21):** אבחון צילומי-מצב — additive; null כשכובה
    // (ברירת מחדל). חוזה ui-result-v1 נשמר: שדה חדש עם ברירת-מחדל ריקה.
    stageSnapshots: result.stageSnapshots || null,
    recommendations: result.recommendations || null,   // **S11:** המלצות עריכה עם הוכחות (plain)
    customStyles: result.customStyles ? { ok: result.customStyles.ok, count: result.customStyles.styles.length, errors: result.customStyles.errors } : null
  };
}

/** ולידציה הודעת בקשה מה־UI (worker-side). @throws Error על סכמה שגויה */
function validateRequest(msg) {
  if (!msg || typeof msg !== 'object') throw new Error('protocol: message must be object');
  if (msg.type === 'typeset-request') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.text !== 'string') throw new Error('protocol: text must be string');
    if (!msg.settings || typeof msg.settings !== 'object') throw new Error('protocol: settings required');
    // **שלב 3 (§3.1-2 — Worker transport):** נכסי מסמך עוברים בפרוטוקול מוגדר — מזהים + בתים בלבד; אין נתיבים מקומיים.
    if (msg.assets != null) {
      if (msg.assets.schema !== 'asset-transport-v1') throw new Error('protocol: assets must be asset-transport-v1');
      if (!Array.isArray(msg.assets.assets)) throw new Error('protocol: assets.assets must be array');
      for (const a of msg.assets.assets) {
        if (typeof a.assetId !== 'string' || !a.assetId.startsWith('ast-')) throw new Error('protocol: asset id must be ast-*');
        if (!(a.bytes instanceof ArrayBuffer) && !(a.bytes && a.bytes.byteLength != null)) {
          throw new Error('protocol: asset bytes must be ArrayBuffer/TypedArray');
        }
      }
    }
    return true;
  }
  if (msg.type === 'cancel') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    return true;
  }
  // **03.11 (v1.1):** רישום גופן למדידה (TTF bytes) — לפני עימוד במדידת גופן אמיתי
  if (msg.type === 'register-font') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.name !== 'string' || !msg.name) throw new Error('protocol: name required');
    if (!(msg.bytes instanceof ArrayBuffer) && !(msg.bytes && msg.bytes.byteLength != null)) {
      throw new Error('protocol: bytes (ArrayBuffer/TypedArray) required');
    }
    return true;
  }
  // **03.11 (v1.1):** רישום אוסף נכסי עיצוב (SVG מחוטא) ברישום שבמנוע — לרינדור עימוד/ייצוא
  if (msg.type === 'register-assets') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (typeof msg.collection !== 'string' || !msg.collection) throw new Error('protocol: collection required');
    if (!Array.isArray(msg.items)) throw new Error('protocol: items array required');
    return true;
  }
  // **03.11 (v1.1):** בקשת ייצוא PDF/ZIP — רץ ב־Worker (המנוע המלא + שימת Buffer בדפדפן)
  if (msg.type === 'export-request') {
    if (typeof msg.jobId !== 'string' || !msg.jobId) throw new Error('protocol: jobId required');
    if (msg.kind !== 'pdf' && msg.kind !== 'zip') throw new Error('protocol: kind must be pdf|zip');
    if (typeof msg.text !== 'string') throw new Error('protocol: text must be string');
    if (!msg.settings || typeof msg.settings !== 'object') throw new Error('protocol: settings required');
    if (msg.fontBytes != null && !(msg.fontBytes instanceof ArrayBuffer) && !(msg.fontBytes && msg.fontBytes.byteLength != null)) {
      throw new Error('protocol: fontBytes must be ArrayBuffer/TypedArray or null');
    }
    return true;
  }
  throw new Error(`protocol: unknown message type ${msg && msg.type}`);
}


/**
 * Validate the explicit, worker-context-only request to load the pinned local
 * typography runtime. Kept separate from validateRequest so the in-process
 * synchronous typesetting handler remains unchanged.
 */
function validateTypographyRuntimeInitRequest(msg) {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) {
    throw new Error('protocol: typography runtime init message must be an object');
  }
  if (msg.type !== 'typography-runtime-init') {
    throw new Error('protocol: typography runtime init type required');
  }
  if (typeof msg.jobId !== 'string' || !msg.jobId || msg.jobId.length > 128) {
    throw new Error('protocol: typography runtime init jobId must be a non-empty string of at most 128 characters');
  }
  return true;
}

/** בניית הודעת התקדמות (worker-side). */
function progressMessage(jobId, info) {
  return {
    type: 'progress', jobId,
    stage: info.stage, pct: info.pct, label: info.label,
    pageIndex: info.pageIndex != null ? info.pageIndex : null,
    totalPages: info.totalPages != null ? info.totalPages : null,
    estimatedTotal: info.estimatedTotal != null ? info.estimatedTotal : null
  };
}

module.exports = { PROTOCOL_VERSION, serializeTypesetResult, serializePageModelTransport, validateRequest, validateTypographyRuntimeInitRequest, progressMessage };
