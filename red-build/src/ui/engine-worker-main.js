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

const { typeset: defaultTypeset } = require('../engine/core/pipeline');
const { serializeTypesetResult, validateRequest, validateTypographyRuntimeInitRequest, progressMessage } = require('./worker-protocol');
const { loadProductionTypographyRuntime } = require('../engine/typography/production-typography-runtime');

let cancelledJobs = new Set();

// **שלב 3 (§3.1-2 — תיקון ביקורת PR #22):** מטמון נכסי מסמך בצד ה-Worker.
// Cache hit מחייב זהות של מזהים, מיפויי refs ותוכן bytes מלא. כך ה-deserialization
// אינו חוזר על עצמו עבור transport זהה, אך אין דילוג על אימות בגלל hash מקוצר או
// בגלל אותו אורך בתים. Transport שנדחה אינו נשמר במטמון.
let _docAssetsCache = null; // { fingerprint, resolver }
function _transportBytesView(value) {
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) return new Uint8Array(value);
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  return null;
}
function _transportRefs(asset) {
  return (Array.isArray(asset && asset.refs) ? asset.refs : [])
    .filter((ref) => typeof ref === 'string' && ref && !ref.startsWith('transport/'));
}
function _assetTransportFingerprint(assetsMsg) {
  return JSON.stringify(assetsMsg.assets.map((asset) => {
    const bytes = _transportBytesView(asset && asset.bytes);
    return [asset && asset.assetId || null, bytes ? bytes.byteLength : null, _transportRefs(asset)];
  }));
}
function _sameTransportBytesAsCache(assetsMsg, resolver) {
  for (const asset of assetsMsg.assets) {
    const incoming = _transportBytesView(asset && asset.bytes);
    if (!incoming || !asset || typeof asset.assetId !== 'string') return false;
    const resolved = resolver.resolveById(asset.assetId);
    if (!resolved.ok || !resolved.asset || !resolved.asset.bytes || resolved.asset.bytes.length !== incoming.length) return false;
    const cached = resolved.asset.bytes;
    for (let i = 0; i < incoming.length; i++) {
      if (incoming[i] !== cached[i]) return false;
    }
  }
  return true;
}
function _resolverForAssets(assetsMsg) {
  if (!assetsMsg || !Array.isArray(assetsMsg.assets) || !assetsMsg.assets.length) return null;
  const fp = _assetTransportFingerprint(assetsMsg);
  if (_docAssetsCache && _docAssetsCache.fingerprint === fp &&
      _sameTransportBytesAsCache(assetsMsg, _docAssetsCache.resolver)) {
    return _docAssetsCache.resolver;
  }
  const { AssetResolver } = require('../engine/assets/asset-resolver');
  const resolver = AssetResolver.fromTransport(assetsMsg);
  if (resolver.transportReport && resolver.transportReport.ok === false) {
    // פער הובלה אינו נבלע בשקט: נרשם לאבחון (הדחיות יצופו בדחיית מדידה מפורשת
    // של הפריטים שהתייחסו לנכסים החסרים — הכיסוי המלא נסגר בשער הצריכה של שלב 4).
    console.warn('[engine-worker] asset transport rejections:', JSON.stringify(resolver.transportReport.rejected));
    _docAssetsCache = null;
  } else {
    _docAssetsCache = { fingerprint: fp, resolver };
  }
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
async function handleExportRequest(msg, post) {
  try {
    const { exportPdfFromModel, exportProjectZip } = require('../engine/output/export-api');
    if (msg.kind === 'pdf') {
      if (msg.fontBytes == null) {
        post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: 'no-embedded-font' });
        return;
      }
      const u8 = msg.fontBytes instanceof ArrayBuffer ? new Uint8Array(msg.fontBytes) : new Uint8Array(msg.fontBytes.buffer, msg.fontBytes.byteOffset, msg.fontBytes.length);
      // המנוע המאוחד הוא היחיד — ייצוא מה-PageModel בלבד, אין נתיב מורשת.
      if (!_lastTypesetResult || !_lastTypesetResult.pageModel) {
        post({ type: 'export-result', jobId: msg.jobId, kind: 'pdf', ok: false, error: 'model-required: אין PageModel בזיכרון — הפעילו עימוד לפני ייצוא (אין עימוד שני ואין נתיב חלופי)' });
        return;
      }
      // **עיצובי שערים עשירים (תיקון DOM≠PDF — "שחור ב-DOM, אפור ב-PDF"):
      // ריסטוריזציה של אותם ה-SVG-ים שה-DOM מציג (OffscreenCanvas ב-Worker)
      // לפני הכתיבה — ה-PDF מקבל את אותו דיו בדיוק. סביבה ללא OffscreenCanvas
      // (Node) ⇒ מפה ריקה ⇒ הנתיב הווקטורי הקיים (מתועד; אין נפילה שקטה).
      let rasters = null;
      try {
        const { rasterizeModelDecorations } = require('../engine/output/svg-raster');
        rasters = await rasterizeModelDecorations(_lastTypesetResult.pageModel);
      } catch (e) { /* ריסטוריזציה כשלה — ייצוא וקטורי כמו קודם */ }
      const res = exportPdfFromModel(_lastTypesetResult.pageModel, msg.settings, u8, msg.fontName, rasters ? { rasters } : {});
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
function createEngineWorkerMain(post, options = {}) {
  if (typeof post !== 'function') throw new Error('engine-worker-main: post(message) required');
  const typeset = typeof options.typeset === 'function' ? options.typeset : defaultTypeset;
  const serializeResult = typeof options.serializeResult === 'function' ? options.serializeResult : serializeTypesetResult;
  const getTypographyRuntime = typeof options.getTypographyRuntime === 'function'
    ? options.getTypographyRuntime : () => null;
  const requireTypographyRuntime = options.requireTypographyRuntime === true;
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
    if (msg.type === 'typeset-request' && cancelledJobs.has(msg.jobId)) {
      cancelledJobs.delete(msg.jobId);
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
      const typographyRuntime = getTypographyRuntime();
      if (requireTypographyRuntime && (!typographyRuntime ||
          !typographyRuntime.unicode || typographyRuntime.unicode.unicodeVersion !== '18.0.0' ||
          !typographyRuntime.harfbuzz || typeof typographyRuntime.harfbuzz.shape !== 'function' ||
          typeof typographyRuntime.createShaper !== 'function')) {
        const error = new Error('Pinned Unicode 18 + HarfBuzz typography runtime is not initialized in this Worker');
        error.code = 'typography-runtime-not-initialized';
        throw error;
      }
      const result = typeset(msg.text, msg.settings, {
        onProgress: (info) => {
          if (!cancelledJobs.has(jobId)) post(progressMessage(jobId, info));
        },
        assets: docAssets,
        typographyRuntime
      });
      if (cancelledJobs.has(jobId)) {
        cancelledJobs.delete(jobId); // העבודה בוטלה — התוצאה נזרקת בזמן שנותרה מסומנת
        return;
      }
      // **פרוסה 5 (§4 — המודל נשאר בזיכרון ה-Worker לייצוא):** התוצאה הגולמית
      // (כולל pageModel שלא עובר ב-audit) נשמרת לבקשת ייצוא מהמודל — הייצוא
      // בפרופיל המאוחד צורך את אותו מודל בדיוק שנשלח ל-UI (אין עימוד שני).
      // **תיקון זיכרון (דיווח "מסמך קטן נכשל אחרי גדול"):** הסריאליזציה רצה
      // לפני ההשמה — כישלון בהעברת תוצאה ענקית לא משאיר את המודל הענק תקוע
      // בזיכרון ה-Worker (בכישלון: משוחרר מיד; ה-UI קיבל שגיאה ואין לוייצוא
      // מה להציע — אותו מצב כמו "אין עימוד בזיכרון").
      let serializedResult = null;
      try {
        serializedResult = serializeResult(result);
      } catch (e) {
        _lastTypesetResult = null; // שחרור מיידי — התוצאה לא נשלחה ולא תישלח
        throw e;
      }
      _lastTypesetResult = result;
      post({ type: 'typeset-result', jobId, result: serializedResult });
    } catch (e) {
      if (cancelledJobs.has(jobId)) { cancelledJobs.delete(jobId); return; }
      post({
        type: 'typeset-error', jobId,
        code: e && e.code ? e.code : null,
        message: e && e.message ? e.message : String(e)
      });
    }
  };
}

/** הרכבה עצמאית לסביבת Worker אמיתית (self.onmessage). */
function bootWorkerContext(ctx, options = {}) {
  let typographyRuntime = null;
  let runtimePromise = null;
  const loadRuntime = typeof options.loadTypographyRuntime === 'function'
    ? options.loadTypographyRuntime
    : loadProductionTypographyRuntime;
  const post = (message) => ctx.postMessage(message);
  // A real browser Worker always exposes location.href. Unit tests that invoke
  // this bootstrap with a minimal fakeSelf are not production Worker contexts.
  const isRealWorkerContext = !!(ctx && ctx.location && typeof ctx.location.href === 'string' && ctx.location.href);
  // **תכנית העל 27.11 §27.1.3 (TYP-SHAPING-01) — הכרעה:** ה-runtime ה-staged
  // (Unicode 18 + HarfBuzz; `production-typography-runtime.js` מצהיר
  // "staged-runtime-assets-not-production-enabled") אינו נצרך עדיין על ידי
  // `core/pipeline.js` — ה-pipeline מקבל את `env.typographyRuntime` ואינו
  // משתמש בו, והמדידה/השבירה/ההקרנות אינן צורות GIDs. לפיכך, עד השלמת
  // אינטגרציית ShapedRun end-to-end, ה-runtime אינו שער חובה בנתיב
  // ה-worker הפעיל: כישלון טעינת WASM/נכסים לא יחסום עימוד. ה-runtime עדיין
  // נטען ומאומת דרך הודעת `typography-runtime-init` המפורשת, ומועבר ל-typeset
  // רק אם אותחל. **בהשלמת האינטגרציה (itemization לפני פיצול, ShapedRun ב-
  // LineModel/PageModel, הקרנות GID) — להחזיר את הדגל ל-true.**
  const REQUIRES_SHAPING_RUNTIME_IN_ACTIVE_PATH = false;
  const handler = createEngineWorkerMain(post, {
    getTypographyRuntime: () => typographyRuntime,
    requireTypographyRuntime: isRealWorkerContext && REQUIRES_SHAPING_RUNTIME_IN_ACTIVE_PATH,
    ...(typeof options.typeset === 'function' ? { typeset: options.typeset } : {}),
    ...(typeof options.serializeResult === 'function' ? { serializeResult: options.serializeResult } : {})
  });

  function ensureTypographyRuntime() {
    if (typographyRuntime) return Promise.resolve(typographyRuntime);
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
      }).then((runtime) => {
        if (!runtime || !runtime.unicode || runtime.unicode.unicodeVersion !== '18.0.0' ||
            !runtime.harfbuzz || typeof runtime.harfbuzz.shape !== 'function' ||
            typeof runtime.createShaper !== 'function' || !runtime.assetDigests) {
          const error = new Error('Loaded typography runtime does not satisfy the pinned Unicode 18/HarfBuzz contract');
          error.code = 'invalid-typography-runtime';
          throw error;
        }
        typographyRuntime = runtime;
        return runtime;
      }).catch((error) => {
        runtimePromise = null;
        throw error;
      });
    }
    return runtimePromise;
  }

  function runtimeResult(jobId, runtime) {
    post({
      type: 'typography-runtime-result',
      jobId,
      ok: true,
      harfbuzzPackageVersion: runtime.manifest.harfbuzz.version,
      harfbuzzCoreVersion: runtime.harfbuzz.versionString(),
      unicodeVersion: runtime.unicode.unicodeVersion,
      assetCount: Object.keys(runtime.assetDigests).length,
      assetDigests: { ...runtime.assetDigests }
    });
  }

  function failedRuntimeResult(jobId, error) {
    post({
      type: 'typography-runtime-result',
      jobId,
      ok: false,
      code: error && error.code ? error.code : 'runtime-initialization-failed',
      message: error && error.message ? error.message : String(error)
    });
  }

  function handleRuntimeInit(message) {
    try {
      validateTypographyRuntimeInitRequest(message);
    } catch (error) {
      failedRuntimeResult(message && typeof message.jobId === 'string' ? message.jobId : null, error);
      return;
    }
    ensureTypographyRuntime().then(
      (runtime) => runtimeResult(message.jobId, runtime),
      (error) => failedRuntimeResult(message.jobId, error)
    );
  }

  function handleTypesetRequest(message) {
    // Validate before loading assets; malformed requests keep the protocol's normal error path.
    try {
      validateRequest(message);
    } catch (_) {
      handler(message);
      return;
    }
    // The actual browser Worker has location.href. Minimal fakeSelf contexts used
    // by the bundle's synchronous harness have no Worker location and exercise only
    // the protocol/bootstrap behavior. When the staged shaping runtime is not an
    // active-path requirement (§27.1.3), typeset proceeds without it: the pipeline
    // does not consume it yet, and a WASM/asset failure must not block typesetting.
    if (!isRealWorkerContext || !REQUIRES_SHAPING_RUNTIME_IN_ACTIVE_PATH) {
      handler(message);
      return;
    }
    ensureTypographyRuntime().then(() => {
      // A cancel may arrive while asset verification and module loading are pending.
      handler(message);
    }).catch((error) => {
      if (cancelledJobs.has(message.jobId)) {
        cancelledJobs.delete(message.jobId);
        return;
      }
      post({
        type: 'typeset-error',
        jobId: message.jobId,
        code: error && error.code ? error.code : 'runtime-initialization-failed',
        message: 'Typography runtime initialization failed; typesetting was not started: ' +
          (error && error.message ? error.message : String(error))
      });
    });
  }

  ctx.onmessage = (ev) => {
    const message = ev && ev.data;
    if (message && message.type === 'typography-runtime-init') {
      handleRuntimeInit(message);
      return;
    }
    if (message && message.type === 'typeset-request') {
      handleTypesetRequest(message);
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
