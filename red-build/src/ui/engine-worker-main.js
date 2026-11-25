// src/ui/engine-worker-main.js — צד ה־Worker של המנוע (REQ-UI-03, D-65)
'use strict';

/**
 * נקודת הכניסה של ה־Worker: מריץ typeset() ומחזיר תוצאה מסוריאליזת פרוטוקול.
 * נטען הן ב־Worker אמיתי (דרך ה־bundle ב־ui/engine-worker.bundle.js) והן
 * in-process בבדיקות/Node (InlineEngine) — אותו קוד, אותו פרוטוקול.
 *
 * ביטול (cancel): המנוע סינכרוני; ב־Worker אמיתי הביטול הוא terminate+respawn
 * (הלקוח אחראי). כאן — סימון העבודה כמבוטלת וזריקת התוצאה (לא נשלחת).
 */

const { typeset } = require('../engine/core/pipeline');
const { serializeTypesetResult, validateRequest, validateTypographyRuntimeInitRequest, progressMessage } = require('./worker-protocol');
const { loadProductionTypographyRuntime } = require('../engine/typography/production-typography-runtime');

let cancelledJobs = new Set();

// **שלב 3 (§3.1-2 — תיקון ביקורת PR #22):** מטמון נכסי מסמך בצד ה-Worker. אותו
// transport (אותם מזהים+בתים) אינו מנותח מחדש ואינו מועבר שוב לפענוח בכל בקשה.
// זהו cache טהור של ה-deserialization בלבד: מקור האמת הוא הזהות הכתובת-תוכן
// שבהודעה עצמה — לא נוצר רישום נכסים מקבילי ולא נשמרים נתיבים מקומיים.
// ה-fingerprint נגזר מהמזהים ואורכי הבתים — אין טחינת תוכן נוספת לכל בקשה.
let _docAssetsCache = null; // { fingerprint, resolver }
function _resolverForAssets(assetsMsg) {
  if (!assetsMsg || !Array.isArray(assetsMsg.assets) || !assetsMsg.assets.length) return null;
  const fp = assetsMsg.assets.map((a) => `${a && a.assetId}:${(a && a.bytes && a.bytes.byteLength) || 0}`).join('|');
  if (_docAssetsCache && _docAssetsCache.fingerprint === fp) return _docAssetsCache.resolver;
  const { AssetResolver } = require('../engine/assets/asset-resolver');
  const resolver = AssetResolver.fromTransport(assetsMsg);
  if (resolver.transportReport && resolver.transportReport.ok === false) {
    // פער הובלה אינו נבלע בשקט: נרשם לאבחון (הדחיות יצופו בדחיית מדידה מפורשת
    // של הפריטים שהתייחסו לנכסים החסרים — הכיסוי המלא נסגר בשער הצריכה של שלב 4).
    console.warn('[engine-worker] asset transport rejections:', JSON.stringify(resolver.transportReport.rejected));
  }
  _docAssetsCache = { fingerprint: fp, resolver };
  return resolver;
}

/** טיפול register-font (03.11): רישום TTF למדידת גופן אמיתי בעימוד שיידרש.
 * **תיקון ביקורת PR #22 (מקור סמכות יחיד):** הרישום עובר דרך ה-Font Resolver
 * הקנוני (זהות content-addressed + שרשרת fallback מאובחנת) — ה-resolver מסנכרן
 * את מרשמי measure-api בעצמו (single entry point); לא נוצר מרשם מקבילי.
 * ה-fontId חוזר ל-UI כך שזהות הגופן זהה בשני הצדדים (מוכח בבדיקות E2E). */
/** **פרוסה 5 (§4):** תוצאת העימוד האחרונה בזיכרון ה-Worker — ה-PageModel שלה
 * משמש את ייצוא ה-PDF בפרופיל המאוחד (אותו מודל שנשלח ל-UI; אין עימוד שני). */
let _lastTypesetResult = null;

function handleRegisterFont(msg, post) {
  try {
    const fontResolver = require('../engine/typography/font-resolver');
    const u8 = msg.bytes instanceof ArrayBuffer ? new Uint8Array(msg.bytes) : new Uint8Array(msg.bytes.buffer, msg.bytes.byteOffset, msg.bytes.length);
    const reg = fontResolver.registerFont(msg.name, u8, { source: 'worker-register-font' });
    if (reg.ok) {
      const glyphCount = reg.record && reg.record.numGlyphs != null ? reg.record.numGlyphs : null;
      post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: true, glyphCount, fontId: reg.fontId });
    } else {
      post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: false, error: reg.code || reg.message || 'register-failed', code: reg.code || null });
    }
  } catch (e) {
    post({ type: 'register-font-result', jobId: msg.jobId, name: msg.name, ok: false, error: e && e.message ? e.message : String(e) });
  }
}

/** טיפול register-assets (03.11): אוסף עיצובים לרישום המנוע — חיטוי SVG בפנים. */
function handleRegisterAssets(msg, post) {
  try {
    const { registerAssets } = require('../engine/decoration/asset-registry');
    const res = registerAssets(msg.collection, msg.items);
    post({ type: 'register-assets-result', jobId: msg.jobId, collection: msg.collection, registered: res.registered, rejected: res.rejected });
  } catch (e) {
    post({ type: 'register-assets-result', jobId: msg.jobId, collection: msg.collection, registered: 0, rejected: [{ id: '-', reason: e && e.message ? e.message : String(e) }] });
  }
}

/** טיפול export-request (03.11): PDF/ZIP במנוע המלא — הודף הכבד חי ב־Worker בלבד.
 * הפלט מועתק ל-Uint8Array טהור (בלי byteOffset) — structured-clone/transfer בטוחים. */
function handleExportRequest(msg, post) {
  try {
    const { exportPdf, exportPdfFromModel, exportProjectZip } = require('../engine/output/export-api');
    if (msg.kind === 'pdf') {
      if (msg.fontBytes == null) {
        post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: 'no-embedded-font' });
        return;
      }
      const u8 = msg.fontBytes instanceof ArrayBuffer ? new Uint8Array(msg.fontBytes) : new Uint8Array(msg.fontBytes.buffer, msg.fontBytes.byteOffset, msg.fontBytes.length);
      // **9c.1 (§12 בהוראת 9b — אין עימוד שני; אין נפילה שקטה):** הנתיב
      // המאוחד מייצא מה-PageModel שכבר חושב — בלבד. תוצאה מאוחדת בלי מודל
      // (למשל כשל העברה) אינה נופלת עוד בשקט לעימוד מחדש דרך exportPdf —
      // כשל מפורש. פרופיל המורשת ממשיך בנתיב הייצוא הישן עד 9c.4 (החלפת
      // ברירת המחדל והסרת המנוע — שם ה-dispatch הזה נמחק עמו).
      const isLegacyProfile = !!(_lastTypesetResult && _lastTypesetResult.legacyProfile === true);
      if (!isLegacyProfile) {
        if (!_lastTypesetResult || !_lastTypesetResult.pageModel) {
          post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: 'model-required: אין PageModel בזיכרון — הפעילו עימוד לפני ייצוא (אין עימוד שני ואין נתיב חלופי)' });
          return;
        }
        const res = exportPdfFromModel(_lastTypesetResult.pageModel, msg.settings, u8, msg.fontName);
        if (!res.ok) { post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: res.error }); return; }
        post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: true, bytes: new Uint8Array(res.bytes), info: res.info || null });
        return;
      }
      // **9c.4-marker:** נתיב מורשת — יוסר עם הסרת המנוע ב-9c.4.
      const res = exportPdf(msg.text, msg.settings, u8, msg.fontName);
      if (!res.ok) { post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: res.error }); return; }
      post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: true, bytes: new Uint8Array(res.bytes), info: res.info || null });
      return;
    }
    if (msg.kind === 'zip') {
      const bytes = exportProjectZip(msg.text, msg.settings, { extensions: msg.extensions || null });
      post({ type: 'export-result', jobId: msg.jobId, kind: 'zip', ok: true, bytes: new Uint8Array(bytes) });
      return;
    }
    post({ type: 'export-error', jobId: msg.jobId, message: `unknown export kind ${msg.kind}` });
  } catch (e) {
    post({ type: 'export-error', jobId: msg.jobId, message: e && e.message ? e.message : String(e) });
  }
}

/** מטפל הודעות — pure, מקבל post חיצוני (מבודד לבדיקות). */
function createEngineWorkerMain(post) {
  if (typeof post !== 'function') throw new Error('engine-worker-main: post(message) required');
  return function onMessage(msg) {
    try {
      validateRequest(msg);
    } catch (e) {
      post({ type: 'typeset-error', jobId: (msg && msg.jobId) || null, message: e.message });
      return;
    }
    if (msg.type === 'cancel') {
      cancelledJobs.add(msg.jobId);
      return;
    }
    if (msg.type === 'register-font') { handleRegisterFont(msg, post); return; }
    if (msg.type === 'register-assets') { handleRegisterAssets(msg, post); return; }
    if (msg.type === 'export-request') { handleExportRequest(msg, post); return; }
    const jobId = msg.jobId;
    try {
      // **שלב 3 (§3.1-2):** נכסי מסמך שהועברו בפרוטוקול — נבנים ל-AssetResolver בצד ה-Worker
      // (זהות תוכן מאומתת מחדש מהבתים; אין גישה למערכת הקבצים ואין נתיבים מקומיים).
      // תיקון ביקורת PR #22: ההודעה מגיעה מהלקוח החי (requestTypeset.assets) ולא
      // רק תיאורטית; ה-resolver משוחזר במטמון לפי זהות ה-transport (בלי פענוח חוזר).
      const docAssets = _resolverForAssets(msg.assets);
      const result = typeset(msg.text, msg.settings, {
        onProgress: (info) => {
          if (!cancelledJobs.has(jobId)) post(progressMessage(jobId, info));
        },
        assets: docAssets
      });
      if (cancelledJobs.has(jobId)) {
        cancelledJobs.delete(jobId); // העבודה בוטלה — התוצאה נזרקת בזמן שנותרה מסומנת
        return;
      }
      // **פרוסה 5 (§4 — המודל נשאר בזיכרון ה-Worker לייצוא):** התוצאה הגולמית
      // (כולל pageModel שלא עובר ב-audit) נשמרת לבקשת ייצוא מהמודל — הייצוא
      // בפרופיל המאוחד צורך את אותו מודל בדיוק שנשלח ל-UI (אין עימוד שני).
      _lastTypesetResult = result;
      post({ type: 'typeset-result', jobId, result: serializeTypesetResult(result) });
    } catch (e) {
      if (cancelledJobs.has(jobId)) { cancelledJobs.delete(jobId); return; }
      post({ type: 'typeset-error', jobId, message: e && e.message ? e.message : String(e) });
    }
  };
}

/** הרכבה עצמאית לסביבת Worker אמיתית (self.onmessage). */
function bootWorkerContext(ctx, options = {}) {
  const handler = createEngineWorkerMain((m) => ctx.postMessage(m));
  const loadRuntime = typeof options.loadTypographyRuntime === 'function'
    ? options.loadTypographyRuntime
    : loadProductionTypographyRuntime;
  let runtimePromise = null;

  const handleRuntimeInit = (msg) => {
    try {
      validateTypographyRuntimeInitRequest(msg);
    } catch (error) {
      ctx.postMessage({
        type: 'typography-runtime-result',
        jobId: msg && typeof msg.jobId === 'string' ? msg.jobId : null,
        ok: false,
        code: 'invalid-runtime-init-request',
        message: error && error.message ? error.message : String(error)
      });
      return;
    }

    if (!runtimePromise) {
      runtimePromise = Promise.resolve().then(() => {
        const workerHref = ctx && ctx.location && ctx.location.href;
        if (typeof workerHref !== 'string' || !workerHref) {
          const error = new Error('Worker location.href is required to resolve local typography runtime assets');
          error.code = 'worker-location-unavailable';
          throw error;
        }
        const baseUrl = new URL('./assets/shaping-runtime/', workerHref).href;
        return loadRuntime({ baseUrl });
      });
    }

    const currentPromise = runtimePromise;
    currentPromise.then((runtime) => {
      ctx.postMessage({
        type: 'typography-runtime-result',
        jobId: msg.jobId,
        ok: true,
        harfbuzzPackageVersion: runtime.manifest.harfbuzz.version,
        harfbuzzCoreVersion: runtime.harfbuzz.versionString(),
        unicodeVersion: runtime.unicode.unicodeVersion,
        assetCount: Object.keys(runtime.assetDigests).length,
        assetDigests: { ...runtime.assetDigests }
      });
    }).catch((error) => {
      if (runtimePromise === currentPromise) runtimePromise = null;
      ctx.postMessage({
        type: 'typography-runtime-result',
        jobId: msg.jobId,
        ok: false,
        code: error && error.code ? error.code : 'runtime-initialization-failed',
        message: error && error.message ? error.message : String(error)
      });
    });
  };

  ctx.onmessage = (ev) => {
    const message = ev && ev.data;
    if (message && message.type === 'typography-runtime-init') {
      handleRuntimeInit(message);
      return;
    }
    handler(message);
  };
}

// ב־Worker אמיתי: self קיים ואין require/module (ה־bundle מספק אותם); ב־Node — לא.
if (typeof self !== 'undefined' && typeof self.postMessage === 'function' && typeof self.onmessage !== 'undefined' && typeof window === 'undefined') {
  bootWorkerContext(self);
}

module.exports = { createEngineWorkerMain, bootWorkerContext };
