// src/ui/app-shell.js — מעטפת האפליקציה (S10.1: לשוניות, ⚡, רינדור־קל, סנכרונים)
'use strict';

/**
 * ארבע לשוניות (REQ-UI-01): עורך / הגדרות / בדיקה / תצוגה.
 *
 * **F-06 — היקף הנתיבים למנוע (מאוכף בסריקת callgraph-scan):**
 * בקובץ זה requestTypeset נקרא **רק** מתוך onExplicitRetypeset (כפתור ⚡ —
 * נתיב מיידי בלי debounce) אשר משרת גם את onDocumentAction (הדבקה/ייבוא —
 * פעולות מסמך מפורשות). שינויי הגדרות עוברים דרך onSettingChanged בלבד:
 * קלים ⇒ רינדור־מחדש מרוכז (בלי מנוע); כבדים ⇒ סימון המתנה + ⚡ מהבהב.
 */

const { getDefaultSettings, findKey } = require('../engine/core/settings-registry');
const { migrate, mergeWithDefaults } = require('../engine/output/project-io');
const { buildStatusStrip } = require('./status-strip');
const { generateTestDocument } = require('./test-doc-generator'); // **פער 1 (S6.1):** מסמכי בדיקה קבוע/רנדומלי — נושא 16 + SRS §16.1/§20.1
const { diffSettings } = require('./settings-persistence'); // **פער 2 (S6.1):** השתמרות הגדרות — SRS §17.1
const { buildEditorTab } = require('./editor-tab');
const { buildSettingsTab } = require('./settings-panel');
const { buildExtensionsPanel } = require('./extensions-panel');
const { importDocx } = require('../engine/import/docx-import');
const { applyEdit } = require('../engine/audit/text-edits'); // **S11:** מקור יחיד טהור — בלי pipeline
const { buildPreviewTab } = require('./preview-tab');
const { buildTestingTab } = require('./testing-tab');
const { WorkerEngineClient, RESTART_ERROR } = require('./worker-client');
const { classifyChange, getDebounceMs, policyTable } = require('./retypeset-policy');
const { receivePageModel } = require('./page-model-transport'); // **שלב 8 פרוסה 2 (§4.3):** קליטת PageModel מעבר לגבול ה-Worker
const { buildCaretMap } = require('./caret-map');

const TABS = [
  { id: 'editor', label: '✍️ עורך' },
  { id: 'settings', label: '⚙️ הגדרות' },
  { id: 'testing', label: '🔍 בדיקה' }
];

// **S75 (בקשה 3 — 12.11, פיצול ה-UI 40/60 כמראה GREEN):** התצוגה ירדה ממערכת
// הכרטיסיות והפכה לחלונית קבועה בצד שמאל (60% בברירת המחדל), גלויה תמיד;
// הכרטיסיות עורך/הגדרות/בדיקה בפאנל הימני (40%). מפריד גרירה ביניהם (בחירת
// המשתמש) מאפשר לשנות את החלוקה בעכבר — כמו #resizer של GREEN. מ-GREEN
// נלקח המראה החיצוני בלבד (צבעים/חלוקה) — לא צורת עימוד ההערות וכו'.
const SPLIT_KEY = 'tora-red-workspace-split';
const SPLIT_DEFAULT_PCT = 40; // רוחב הפאנל הימני (הכרטיסיות) באחוזים
const SPLIT_MIN_PCT = 18, SPLIT_MAX_PCT = 72;

function clampSplitPct(v) {
  if (!Number.isFinite(v)) return SPLIT_DEFAULT_PCT;
  return Math.min(SPLIT_MAX_PCT, Math.max(SPLIT_MIN_PCT, v));
}

function readSavedSplitPct() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(SPLIT_KEY);
    return raw == null ? null : clampSplitPct(parseFloat(raw));
  } catch (e) { return null; }
}

function createApp(doc, opts = {}) {
  const settings = getDefaultSettings();
  // **ענף preview (engine/legacy-parity-preview-20261119):** הענף מוגדר כסביבת
  // המנוע המאוחד. מרגע הפיכת המאוחד למנוע היחיד (הסרת legacy) אין עוד דגל
  // dispatch — branchProfile נשאר לתצוגה/לשמירת הגדרות לא-מחוברות בלבד.
  const branchProfile = opts.branchEngineProfile === 'unified' ? 'unified' : null;
  const branchBuildInfo = opts.branchBuildInfo || null; // { commit, builtAt } — מוזרק מ־build-info.json בזמן פריסה
  let text = '';
  let result = null;            // תוצאה מסוריאליזת פרוטוקול (D-65)
  let pageModelObj = null;      // **שלב 8 פרוסה 2 (§4.4):** PageModel שהתקבל מה-Worker — מאומת וקפוא מחדש
  const engineProfile = 'unified'; // **מנוע יחיד (2ae45b9):** אין עוד פרופיל legacy — קבוע לכל התוצאות
  let caretMapObj = null;
  let lightDirty = false, heavyDirty = false;
  let typesetGen = 0; // **S5.2 (5):** דור עימוד — מונה תוצאות שהושלמו; חוזה: st.gen (אודיט חי בוחן שינוי)
  let lightTimer = null;
  let lastLightRefreshMs = null;
  const perf = (typeof performance !== 'undefined' && performance.now) ? performance : { now: () => Date.now() };

  // ================= פער 2 (S6.1): השתמרות הגדרות — SRS §17.1 =================
  // בסיס = מצב ברירות-המחדל אחרי האתחול (applyLegacyDefaults source:'boot').
  // נשמר רק ההפרש של המשתמש מהבסיס — עדכון ברירות מחדל בגרסה חדשה לא נחסם.
  // בלי opts.settingsPersistence (Node/בדיקות ישנות) — כל המנגנון לא-פעיל.
  const persist = opts.settingsPersistence || null;
  let settingsBaseline = null; // null ⇒ עדיין לא הוחלו ברירות האתחול — אין שמירה
  let persistTimer = null;

  function captureSettingsBaseline() { settingsBaseline = { ...settings }; }

  function schedulePersistSettings() {
    if (!persist || !settingsBaseline) return;
    if (persistTimer != null) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => { persistTimer = null; persistSettingsNow(); }, 250);
  }

  function persistSettingsNow() {
    if (!persist || !settingsBaseline) return { ok: false, reason: 'inactive' };
    const diff = diffSettings(settingsBaseline, settings);
    const res = persist.save(diff);
    if (!res.ok) {
      status.setNotice('שמירת ההגדרות בדפדפן נכשלה — ההגדרות לא ישוחזרו לאחר ריענון.');
    }
    return res;
  }

  /** שחזור ההפרש השמור מעל ברירות-המחדל (נקרא מה-boot אחרי applyLegacyDefaults).
   * מפתחות לא מוכרים ברישום נדלגים; מפתחות _ פנימיים (הרחבות) עוברים כמו שהם. */
  function restorePersistedSettings() {
    if (!persist) return { restored: 0, skipped: [] };
    const diff = persist.load();
    if (!diff) return { restored: 0, skipped: [] };
    const { getSettingDefs } = require('../engine/core/settings-registry');
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    let applied = 0;
    const skipped = [];
    for (const [k, v] of Object.entries(diff)) {
      if (k.startsWith('_')) { settings[k] = v; applied++; continue; } // הרחבות/מצב פנימי
      if (k === 'settings_version' || !regKeys.has(k)) { skipped.push(k); continue; }
      settings[k] = v;
      applied++;
    }
    if (applied) {
      settingsPanel.refreshValues();
      // **פער 2 (S6.1):** הגדרה ששוחזרה עשויה לדרוש גופן שטרם נטען (למשל החלפת
      // גוף הספר) — טעינה ברקע; כישלון אינו חוסם (fallback מערכת, מתועד).
      loadFontsForCurrentSettings().catch(() => { /* fallback מערכת — מתועד */ });
      if (result) markHeavyDirty('הגדרות שמורות הוחלו — נדרש עימוד (⚡)');
    }
    return { restored: applied, skipped };
  }
  // ================= סוף פער 2 =================

  // בדיקות/Node: תעבורה inline (אותו פרוטוקול) — נטענת בעצלתיים כדי ש־bundle
  // הדפדפן לא יגרור את המנוע (שם רץ Worker אמיתי — ראו inline-transport.js).
  function makeDefaultTransport() {
    const { createInlineTransport } = require('./inline-transport');
    return createInlineTransport();
  }
  // **03.11(ג) (תיקון ייצוא PDF שנתלה):** לקוח יחיד לכל הצרכנים. בעבר נוצרו
  // שני WorkerEngineClient על אותו Worker — השני דרס את worker.onmessage
  // של הראשון, והתשובות ל-register-font של ספריית IMUD לעולם לא הגיעו
  // ⇒ loadFont נתלה ⇒ הייצוא נתקע אחרי "מייצר PDF במנוע…" בלי קובץ ובלי שגיאה.
  const engine = opts.engineClient || new WorkerEngineClient(opts.transport || makeDefaultTransport());

  // ================= חלקי ה־UI =================
  // **S1-ה (אודיט תפעולי סוכן 1):** onCancel — נתיב הביטול המפורש למשתמש (U-1);
  // engineVersion — מזהה גרסת הנכסים המוצג במידע הריצה (U-2).
  const engineVersion = opts.engineVersion || null;
  const status = buildStatusStrip(doc, {
    onExplicitRetypeset: () => onExplicitRetypeset(),
    onCancel: () => onCancelTypeset(),
    // **ענף preview:** צ'יפ פרופיל מנוע — מזהה profile + commit + תווית ניסוי.
    branchProfile,
    branchBuildInfo
  });
  // **ענף preview:** הצ'יפ מוצג מיד בעליה — מחוור חייבת לראות את הפרופיל בענף הניסיון.
  if (branchProfile) {
    status.setBranchProfile(branchProfile, branchBuildInfo);
    // build-info.json נטען בַּאַסִינקְצִיה מהַשֶרת (fetch) — כשמגיע מעדכנים את הצ'יפ עם commit/חותמת זמן.
    if (opts.branchBuildInfoPromise && typeof opts.branchBuildInfoPromise.then === 'function') {
      opts.branchBuildInfoPromise.then((info) => { status.setBranchProfile(branchProfile, info || branchBuildInfo); }).catch(() => {});
    }
  }

  const editor = buildEditorTab(doc, {
    onTextChange: (t) => { text = t; markHeavyDirty('טקסט השתנה'); },
    onDocumentAction: (action, payload) => onDocumentAction(action, payload),
    onImportTxt: () => opts.onRequestTxtImport && opts.onRequestTxtImport(),
    onImportDocx: () => opts.onRequestDocxImport && opts.onRequestDocxImport(),
    onClearDocument: () => onDocumentAction('clear', ''),
    onCaretMove: (charIndex) => onCaretMove(charIndex),
    onJumpToPage: (pageIndex) => { switchTab('preview'); preview.scrollToPage(pageIndex); },
    // **פער 1 (S6.1):** מסמכי בדיקה — הזרקה דרך פעולת מסמך מפורשת (F-06)
    onGenerateTestDocument: (mode) => onGenerateTestDocument(mode)
  });

  const settingsPanel = buildSettingsTab(doc, {
    getSettings: () => settings,
    onSettingChanged: (key, value) => onSettingChanged(key, value),
    onResetField: (key) => onResetField(key),
    onSaveTemplate: () => opts.onSaveTemplate && opts.onSaveTemplate(saveTemplateJson()),
    onLoadTemplate: () => opts.onLoadTemplate && opts.onLoadTemplate(),
    onOpenBuilder: () => opts.onOpenBuilder && opts.onOpenBuilder(),
    onOpenImports: () => opts.onOpenImports && opts.onOpenImports(),
    // **03.11 (EXT-14):** ספריית IMUD — בוררי עיצובים + ברירות המקור + הודעות
    imudLibrary: opts.imudLibrary || null,
    onNotice: (msg) => status.setNotice(msg),
    onApplyLegacyDefaults: (imported) => applyLegacyDefaults(imported, { source: 'panel' })
  });

  /** טעינת כל הגופנים שההגדרות הנוכחיות דורשות — גם מחסניות (loadFontStack פותר
   * מול הקטלוג). מקור יחיד לשני הצרכנים: applyLegacyDefaults ושחזור ההגדרות
   * השמורות (פער 2 — הגדרה ששוחזרה עשויה לדרוש גופן שטרם נטען). */
  const FONT_SETTING_KEYS = [
    'body-font', 'first-word-font', 'dh-font', 'f-note-body-font',
    // **Iteration-006 (RC-M3 — השלמת מפתחות גופן שלא נטענו):** שלושה מפתחות
    // גופן מההגדרות לא היו ברשימה — הגופן שלהם לעולם לא נרשם ב-Worker ⇒ המדידה
    // נפלה בשקיפות לקירוב הטבלה בעוד הרינדור השתמש במחסנית אחרת (measure≠render).
    // ההוכחה החיה: גוף ההקדמה (heading-0-body-font='Frank Ruhl Libre') —
    // נמדד בטבלה ורונדר ב-Guttman ⇒ רווחי דיו 4–15px ב-19 שורות הקדמה
    // (אודיט p42/p411). גם ביאורי-הצד וכותרת הערות-הסיום נפגעו באותו דפוס.
    'heading-0-body-font', 's-note-body-font', 'endnote-title-font',
    // **S75 (בקשה 2):** גופן הגיליון — ברירת המחדל החדשה 'ליבורנה מודגש' חייבת
    // להיטען (FontFace לתצוגה + registerFont למדידה/ייצוא) כשאר גופני ההגדרות.
    'page-num-font',
    ...Array.from({ length: 8 }, (_, i) => `heading-${i}-font`),
    'shaar-title-font', 'shaar-subtitle-font', 'shaar-desc-font', 'shaar-sections-font',
    'shaar-author-font', 'shaar-year-font', 'shaar-back-text-font'
  ];
  for (const side of ['recto', 'verso']) {
    for (const pos of ['right', 'center', 'left']) FONT_SETTING_KEYS.push(`header-${side}-${pos}-font`);
  }
  async function loadFontsForCurrentSettings() {
    if (!opts.imudLibrary || typeof opts.imudLibrary.loadFontStack !== 'function') return;
    const seen = new Set();
    for (const k of FONT_SETTING_KEYS) {
      const v = settings[k];
      if (!v || seen.has(v)) continue;
      seen.add(v);
      try { await opts.imudLibrary.loadFontStack(v); } catch (e) { /* גופן חיצוני — fallback מערכת, מתועד */ }
    }
  }

  /** **03.11(ד):** החלת ברירות המחדל המקוריות — נתיב יחיד לשני הקוראים:
   * כפתור הפאנל והאתחול בעלייה (boot). אחרי ההחלה נטענים כל הגופנים
   * שההגדרות החדשות דורשות (גוף/כותרות/כותרות-עליונות/שערים) — בלי זה
   * הערכים נכונים אבל הדפדפן מציג גופן מערכת ו"החלפת גופן לא עושה כלום".
   * @param {object} imported - הגדרות מיובאות (importImudSettings)
   * @param {{source?:string, retypeset?:boolean}} [opts2] - panel: כן עימוד; boot: עימוד רק אם יש טקסט
   */
  async function applyLegacyDefaults(imported, opts2 = {}) {
    Object.assign(settings, imported);
    settingsPanel.refreshValues();
    await loadFontsForCurrentSettings();
    const wantRetypeset = opts2.retypeset !== undefined ? opts2.retypeset : true;
    if (wantRetypeset) onExplicitRetypeset();
    // **S5.2 (4):** מרוץ אתחול: החלה עם {retypeset:false} כשכבר קיימת תוצאה
    // (המשתמש הדביק במהלך האתחול) — ההגדרות השתנו אך שום דגל לא סומן ⇒
    // פער שקט בין התצוגה לבין מה שייצא. סימון כבד: ⚡ מהבהב עד עימוד.
    else if (result) markHeavyDirty('ברירות המחדל הוחלו — נדרש עימוד (⚡)');
    // **פער 2 (S6.1):** boot ⇒ בסיס ההפרש (ברירות המחדל הן נקודת האפס);
    // panel ⇒ בחירת ערכת/ברירות היא פעולה מפורשת — שמירה מיידית (SRS §17.1
    // "preset toggles"; בלי debounce — המשתמש לחץ והלך).
    if (opts2.source === 'boot') { if (settingsBaseline == null) captureSettingsBaseline(); }
    else persistSettingsNow();
  }

  // **S11:** סקציית הרחבות מסמך — בתחתית לשונית ההגדרות (מנותק מ־12 פאנלי הרישום).
  // שינוי הרחבות = כבד (F-06): אין עימוד אוטומטי — ⚡ בלבד.
  // **S5.2 (4):** האירוע ההתחלתי של הפאנל (bundle=null בבנייה) אינו "שינוי" —
  // בלי זה כל אפליקציה נולדת "מלוכלכת" (⚡ מהבהב בריק, לפני שאפשר בכלל לייצא
  // משהו) ודגל הכבד מאבד משמעות לחייץ הייצוא ולמרוץ האתחול.
  let extensionsHadBundle = false;
  const extensions = buildExtensionsPanel(doc, {
    onBundleChange: (bundle) => {
      if (bundle && bundle.styles.length) {
        settings._customStyles = JSON.stringify(bundle.styles.map(s => ({
          id: s.id, name: s.name, trigger: s.trigger, layoutMode: s.layoutMode,
          style: s.style, counter: s.counter, linkedOrnaments: s.linkedOrnaments
        })));
      } else delete settings._customStyles;
      if (bundle && bundle.pages.length) {
        settings._customPages = JSON.stringify({ pages: bundle.pages });
      } else delete settings._customPages;
      if (bundle) { extensionsHadBundle = true; markHeavyDirty('הרחבות השתנו'); }
      else if (extensionsHadBundle) { extensionsHadBundle = false; markHeavyDirty('הרחבות הוסרו'); }
      schedulePersistSettings(); // **פער 2 (S6.1):** הרחבות הן חלק מההגדרות — נשמרות גם כן
    },
    onRequestImport: () => opts.onRequestExtensionsImport && opts.onRequestExtensionsImport(),
    onExport: () => opts.onSaveExtensions && opts.onSaveExtensions(extensions.exportText()),
    onShare: () => { status.setNotice(extensions.shareText()); }
  });
  settingsPanel.root.appendChild(extensions.root);

  const preview = buildPreviewTab(doc, {
    onActivatePage: (pageIndex) => onActivatePage(pageIndex),
    onDebugDownload: (pageIndex) => opts.onDebugDownload && opts.onDebugDownload(buildDebugJson(pageIndex), pageIndex),
    // **S12 (REQ-EXP-01..04):** נתיב הייצוא האחיד — מקור יחיד לטקסט/הגדרות/הרחבות.
    onExport: (kind) => onExportRequest(kind),
    // **פרוסה 3 (§2.3/§2.6-5):** שגיאת פרופיל ודיאגנוסטיקות מקרין המודל — גלויות
    // בפס המצב (אין השתקה; שום פריט לא נעלם בשקט).
    onProfileError: (msg) => status.setNotice('שגיאת תצוגה: ' + msg),
    onModelDiagnostic: (pageIndex, d) => status.setNotice(`אבחון תצוגה (עמוד ${pageIndex + 1}): ${d.kind}`)
  });

  const testing = buildTestingTab(doc, {
    onActivateFinding: (f) => activateFinding(f), // כלל 2: נתיב ההפעלה האחיד
    onApplyRecommendation: (rec) => applyRecommendation(rec) // **S11:** החלה על המקור
  });

  // ================= בניית שלד =================
  const root = doc.createElement('div');
  root.className = 'app';
  root.dir = 'rtl';

  const header = doc.createElement('header');
  header.className = 'app-header';
  // **S75 (בקשה 3):** הבר העליון מצטמצם לשורה אחת בלבד (app-title + פס המצב +
  // policy-help) ברוחב כל הדף — מעל הכרטיסיות והתצוגה. תוכן העזרה נפתח
  // כתפריט צף מתחת לשורה ואינו מרחיב אותה.
  const title = doc.createElement('h1');
  title.className = 'app-title app-title--brand';
  title.textContent = 'Imudify';
  title.setAttribute('aria-label', 'Imudify — תוכנת עימוד תורנית');
  header.appendChild(title);
  header.appendChild(status.root);
  // טבלת המדיניות מוצגת בעזרה (REQ-UI-02: policy table rendered in UI help)
  const help = doc.createElement('details');
  help.className = 'policy-help';
  const helpSum = doc.createElement('summary');
  helpSum.textContent = 'מדיניות עדכון (קל/כבד)';
  help.appendChild(helpSum);
  const helpBody = doc.createElement('div');
  helpBody.className = 'policy-help__body';
  for (const row of policyTable()) {
    const d = doc.createElement('div');
    d.className = `policy-row policy-row--${row.cls}`;
    const b = doc.createElement('strong'); b.textContent = row.labelHe;
    const keys = doc.createElement('div'); keys.className = 'policy-keys'; keys.textContent = row.keys.join(' · ');
    const beh = doc.createElement('div'); beh.className = 'policy-beh'; beh.textContent = row.behaviorHe;
    d.appendChild(b); d.appendChild(keys); d.appendChild(beh);
    helpBody.appendChild(d);
  }
  help.appendChild(helpBody);
  header.appendChild(help);
  root.appendChild(header);

  const tabbar = doc.createElement('nav');
  tabbar.className = 'tabbar';
  tabbar.setAttribute('role', 'tablist');
  tabbar.setAttribute('aria-label', 'לשוניות ראשיות');
  const tabBtns = new Map();
  for (const t of TABS) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'tabbtn';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', t.id === 'editor' ? 'true' : 'false');
    b.dataset.tab = t.id;
    b.textContent = t.label;
    b.addEventListener('click', () => switchTab(t.id));
    tabbar.appendChild(b);
    tabBtns.set(t.id, b);
  }

  // **S75 (בקשה 3):** מבנה חדש — סביבת עבודה מפוצלת: ימין = מערכת הכרטיסיות
  // (עורך/הגדרות/בדיקה, מתחלפות כרגיל); מפריד גרירה; שמאל = התצוגה, חלונית
  // קבועה שגלויה כל הזמן (ירדה ממערכת הכרטיסיות). ברירת המחדל 40% ימין /
  // 60% שמאל; הגרירה משנה את החלוקה (נשמרת ב-localStorage).
  const main = doc.createElement('main');
  main.className = 'app-main';
  const workspace = doc.createElement('div');
  workspace.className = 'workspace';
  const workPane = doc.createElement('section');
  workPane.className = 'work-pane';
  workPane.setAttribute('aria-label', 'אזור העבודה — עורך, הגדרות ובדיקה');
  workPane.appendChild(tabbar);
  const workPanels = doc.createElement('div');
  workPanels.className = 'work-panels';
  const panels = new Map([
    ['editor', editor.root], ['settings', settingsPanel.root],
    ['testing', testing.root]
  ]);
  for (const [id, el] of panels) {
    el.classList.add(id === 'editor' ? 'active' : 'inactive');
    workPanels.appendChild(el);
  }
  workPane.appendChild(workPanels);
  const resizer = doc.createElement('div');
  resizer.className = 'pane-resizer';
  resizer.setAttribute('role', 'separator');
  resizer.setAttribute('aria-orientation', 'vertical');
  resizer.setAttribute('aria-label', 'שינוי חלוקת האזורים — גרירה או חצים');
  resizer.tabIndex = 0;
  resizer.title = 'גרירה משנה את החלוקה בין הכרטיסיות לתצוגה';
  const previewPane = doc.createElement('section');
  previewPane.className = 'preview-pane-wrap';
  previewPane.setAttribute('aria-label', 'תצוגה');
  preview.root.classList.remove('tab-panel');
  preview.root.classList.add('preview-pane');
  previewPane.appendChild(preview.root);
  workspace.appendChild(workPane);
  workspace.appendChild(resizer);
  workspace.appendChild(previewPane);
  main.appendChild(workspace);
  root.appendChild(main);

  // ---- מפריד הגרירה (S75): עכבר + מקלדת, שמירה ב-localStorage ----
  let splitPct = readSavedSplitPct() != null ? readSavedSplitPct() : SPLIT_DEFAULT_PCT;
  function applySplit() {
    workPane.style.flexBasis = `${splitPct}%`;
  }
  function setSplitPct(v) {
    splitPct = clampSplitPct(v);
    applySplit();
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(SPLIT_KEY, String(splitPct));
    } catch (e) { /* אחסון לא זמין — החלוקה נשארת לסשן זה */ }
    return splitPct;
  }
  applySplit();
  if (typeof doc !== 'undefined') {
    resizer.addEventListener('mousedown', (ev) => {
      if (ev.button !== 0) return;
      ev.preventDefault();
      resizer.classList.add('resizing');
      const move = (e) => {
        if (typeof workspace.getBoundingClientRect !== 'function') return;
        const rect = workspace.getBoundingClientRect();
        if (!rect || !rect.width) return;
        // RTL: הפאנל הימני (הכרטיסיות) נמשך מ-x ועד קצה הסביבה הימני
        const pct = ((rect.right - e.clientX) / rect.width) * 100;
        setSplitPct(pct);
      };
      const up = () => {
        resizer.classList.remove('resizing');
        if (typeof doc.removeEventListener === 'function') {
          doc.removeEventListener('mousemove', move);
          doc.removeEventListener('mouseup', up);
        }
      };
      if (typeof doc.addEventListener === 'function') {
        doc.addEventListener('mousemove', move);
        doc.addEventListener('mouseup', up);
      }
    });
    resizer.addEventListener('keydown', (ev) => {
      // RTL: חץ שמאלה מרחיב את הפאנל הימני, ימינה מצמצם
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); setSplitPct(splitPct + 2); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); setSplitPct(splitPct - 2); }
    });
  }

  function switchTab(id) {
    if (id === 'preview') return; // **S75:** התצוגה תמיד גלויה — אין לשונית להחליף
    for (const [pid, el] of panels) el.classList.toggle('active', pid === id);
    for (const [bid, b] of tabBtns) b.setAttribute('aria-selected', bid === id ? 'true' : 'false');
  }

  // ================= נתיבי המנוע המפורשים (F-06) =================

  /** ⚡ — הנתיב המיידי היחיד להרצת המנוע מה־UI (בלי debounce; מנקה המתנות). */
  function onExplicitRetypeset() {
    if (lightTimer != null) { clearTimeout(lightTimer); lightTimer = null; }
    lightDirty = false; heavyDirty = false;
    status.setPending({ light: false, heavy: false });
    status.setEngineState('working', { label: 'מתחיל עימוד…' });
    // **Iteration-006 (RC-M1 — שער גופני-ההגדרות לפני העימוד):** המדידה
    // בפרופיל המאוחד היא הפריסה (מילים ממוקמות-מוחלט מהמודל) — עימוד שרץ
    // לפני שרישום הגופנים שההגדרות דורשות הושלם ב-Worker נופל בשקיפות
    // למדידת הטבלה המקורבת (חוזה _bindProfile) ⇒ שבירות שונות ורווחי-דיו
    // של 4–15px בשפה הימנית של שורות מיושרות (נמדד בייחוס p42: «האיסור,»
    // 51.8px בטבלה מול 43.8px בפועל). המירוץ הוכח בדפדפן החי: הזרקה אחרי
    // 3.5 שנ' ⇒ 12 מילים בשורה (טבלה); המתנה לגופנים ⇒ 13 מילים
    // (font-metrics) = המודל ב-Node והייחוס. השער: loadFontStack אידמפוטנטי
    // (appliedFontsReady משותף עם האתחול — אין טעינה כפולה); תקרת 12 שנ'
    // שומרת תגובתיות גם אם מקור גופן נתקע (אז הנפילה לטבלה — המתנהגות
    // המתועדת). גופן חיצוני/חסר — catch מתועד, לא חסימה.
    Promise.race([
      loadFontsForCurrentSettings().catch(() => { /* fallback מערכת — מתועד */ }),
      new Promise((resolve) => setTimeout(resolve, 12000))
    ]).then(() => {
      const started = perf.now();
      const req = engine.requestTypeset({
        text, settings,
        onProgress: (m) => status.setEngineState('working', m) // "עמוד X מתוך Y"
      });
      const jobId = req && req.jobId ? req.jobId : null; // **S1-ה/U-2:** מזהה הריצה לתצוגה
      req.promise.then((res) => {
      if (res && res.cancelled) return;
      result = res;
      // **שלב 8 פרוסה 2 (§4.3-4.4 — חוזה ההעברה):** המודל עבר structured-clone —
      // אימות סכמה/האשים והקפאה מחדש בצד הצרכן. כשל העברה אינו נבלע: הודעה
      // מפורשת (המסלול הגולמי נשאר לתצוגה הקיימת עד פרוסה 3 — אין רינדור
      // ממסמך-גולמי חדש, רק המשך התצוגה הקיימת).
      try {
        const received = receivePageModel(res && res.pageModel);
        pageModelObj = received.ok ? received.model : null;
        if (!received.ok && res && res.pageModel) {
          status.setNotice('העברת מודל העמוד נכשלה: ' + received.error + ' (התצוגה ממשיכת מסלול קיים)');
        }
      } catch (e) {
        pageModelObj = null;
      }
      // **ענף preview (§ג.4 בהוראה):** כשל מפורש כשחסר PageModel — אין fallback
      // שקט ואין המשך תצוגה כאילו הכול תקין. התצוגה הקיימת נשמרת כמו שהיא,
      // אך מצב המנוע הופך לשגיאה. (מנוע היחיד הוא המאוחד — בדיקת ה-fallback
      // ל־legacy בוטלה עמו.)
      if (branchProfile === 'unified') {
        if (!pageModelObj) {
          status.setEngineState('error', { message: 'ענף preview: תוצאת המנוע המאוחד הגיעה ללא PageModel תקין — אין fallback. דווחו זאת.' });
        }
      }
      typesetGen++; // **S5.2 (5):** +1 על כל עימוד שהושלם (בדיוק במקום ההשמה ל-result) — ביטול/החלפה אינם נספרים
      applyResultToViews();
      status.setEngineState('idle');
      // **9c.3:** מספר העמודים בסטטוס מהמקור הקנוני — ה-PageModel במאוחד
      // (applyResultToViews כבר קרא ל-setPages מאותו מקור); כאן לצורך סדר
      // ההודעות בלבד.
      status.setPages(canonicalPages().length);
      // **S1-ה/U-2 (תכנית אב §7.1):** כל תוצאת עימוד מציגה hash, שימור, עמודים
      // וזמן ריצה; הפרטים המלאים (מזהה ריצה, hash קלט, גרסה) ב-tooltip של הצ'יפ.
      status.setRunInfo({
        jobId, layoutHash: result.layoutHash, contentHashIn: result.contentHashIn || null,
        pages: canonicalPages().length, ms: perf.now() - started,
        contentPreserved: result.contentPreserved, engineVersion
      });
    }).catch((e) => {
      const msg = e && e.message ? e.message : String(e);
      // **S5.2:** בקשה שהוחלפה/בוטלה (single-flight) — ה-Worker הוזרם מחדש והבקשה
      // שירשרה אותה כבר בדרך; זו אינה שגיאת מנוע אמיתית ואין להציג "שגיאה" למשתמש.
      if (msg === RESTART_ERROR) return;
      status.setEngineState('error', { message: msg });
    });
    });
  }

  /** **S1-ה/U-1:** ביטול מפורש של העימוד הפעיל — כפתור ⏹ בפס המצב (גלוי רק בזמן
   * עבודה). המנגנון ב-worker-client (terminate+respawn בדפדפן; סימון ב-inline)
   * — כאן רק הקריאה והחזרת המצב לפנוי. התוצאה המבוטלת אינה מיושמת (ההבטחה
   * נדחית ב-RESTART_ERROR או נפרדת כ-cancelled — שני הנתיבים שקטים ב-S5.2). */
  function onCancelTypeset() {
    try { if (engine && typeof engine.cancel === 'function') engine.cancel(); } catch (e) { /* best-effort */ }
    status.setEngineState('idle');
  }

  /** פעולות מסמך מפורשות — הדבקה / ייבוא TXT / פתיחה. פעולה שלמה ⇒ עימוד מיידי. */
  function onDocumentAction(action, payload) {
    if (action === 'clear') {
      // **S6.0 (R8-M1 — ספר רפאים):** ביטול עימוד ממריץ לפני הניקוי —
      // בעבר תוצאה שהגיעה אחרי הניקוי "החייתה" את המסמך שנמחק (עמודים
      // מוצגים מול עורך ריק; ייצוא רץ על טקסט ריק).
      try { if (engine && typeof engine.cancel === 'function') engine.cancel(); } catch (e) { /* best-effort */ }
      text = '';
      editor.setText('');
      result = null;
      pageModelObj = null; // **פרוסה 2:** ניקוי המודל עם המסמך (engineProfile קבוע — המנוע היחיד הוא המאוחד)
      caretMapObj = null;
      preview.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 }, settings);
      testing.setResult({ pages: [], report: { findings: [], counts: {} }, trace: { events: [] }, tokens: [], droppedEvents: 0 });
      editor.setPageBreaks([]);
      status.setPages(0);
      status.setPending({ light: false, heavy: false });
      status.setEngineState('idle');
      status.setRunInfo({}); // **S1-ה/U-2:** ניקוי המסמך מרוקן גם את מידע הריצה
      return;
    }
    if (action === 'paste' || action === 'import-txt' || action === 'open') {
      text = String(payload != null ? payload : '');
      editor.setText(text);
      onExplicitRetypeset(); // פעולת מסמך מפורשת — נתיב מיידי (progress מוצג)
    }
  }

  // ================= פער 1 (S6.1): מסמכי בדיקה — נושא 16 + SRS §16.1 =================
  /** הזרקת מסמך בדיקה (קבוע/רנדומלי) — דרך פעולת מסמך מפורשת ('open') כדי לעבור
   * בנתיב המיידי המוכח (F-06). המחולל ניתן להחלפה מבחוץ (opts.generateTestDocument)
   * לבדיקות — בדפדפן זה המחולל האמיתי (test-doc-generator.js). */
  const genDoc = opts.generateTestDocument || generateTestDocument;
  function onGenerateTestDocument(mode) {
    const doc2 = genDoc({ mode: mode === 'random' ? 'random' : 'fixed', scale: 'full' });
    onDocumentAction('open', doc2);
    const words = String(doc2).split(/\s+/).filter(Boolean).length;
    status.setNotice(`הוזרק מסמך בדיקה ${mode === 'random' ? 'רנדומלי (טקסט חדש)' : 'קבוע (דטרמיניסטי)'} — ${words.toLocaleString('he-IL')} מילים. מתבצע עימוד…`);
  }
  // ================= סוף פער 1 =================

  // ================= מדיניות שינויי הגדרות (D-64) =================

  function onSettingChanged(key, value) {
    const definition = findKey(key);
    if (branchProfile === 'unified' && definition && definition.unifiedSupport === false) {
      settingsPanel.refreshValues();
      status.setNotice(`ההגדרה «${key}» עדיין אינה מחוברת למודל המאוחד; השינוי לא הוחל ולא ישנה את הפלט.`);
      return;
    }
    settings[key] = value;
    // **03.11 (EXT-14):** בחירת גופן מהספרייה — טעינה חיה (FontFace לתצוגה +
    // registerFont במנוע למדידת font-metrics ולייצוא PDF). כישלון טעינה אינו
    // חוסם: המערכת נופלת לגופן המערכת (מתועד בהודעה).
    // **EXT-14 (05.11):** הודעה מדויקת לפי סיווג האמת — משפחה מהקטלוג המורחב
    // (קובץ WOFF2 במקור, לא מוטמע) מדווחת בשמה הנכון; לא כל "מחוץ לספרייה".
    if (/-(font)$/.test(key) && value && opts.imudLibrary) {
      const fontSt = typeof opts.imudLibrary.fontStatus === 'function' ? opts.imudLibrary.fontStatus(value) : null;
      opts.imudLibrary.loadFont(value).then((buf) => {
        if (!buf) {
          const msg = fontSt === 'extended-catalog'
            ? `הגופן «${value}» מהקטלוג המורחב של המקור — קובץ הגופן (WOFF2) אינו מוטמע בריפו; נעשה שימוש בגופן מערכת.`
            : `הגופן «${value}» אינו בספרייה המוטמעת — נעשה שימוש בגופן חלופי.`;
          status.setNotice(msg);
        }
      }).catch(() => { /* כבר דווח בהודעה */ });
    }
    if (classifyChange(key) === 'light') scheduleLightRefresh();
    else markHeavyDirty();
    schedulePersistSettings(); // **פער 2 (S6.1):** כל שינוי הגדרה נשמר (SRS §17.1)
  }

  /** רינדור־מחדש קל: מרוכז לפי debounce-light-change-ms (D-44) — בלי מנוע. */
  function scheduleLightRefresh() {
    lightDirty = true;
    status.setPending({ light: true, heavy: heavyDirty });
    if (lightTimer != null) clearTimeout(lightTimer);
    const ms = getDebounceMs(settings);
    lightTimer = setTimeout(() => {
      lightTimer = null;
      runLightRefresh();
    }, ms);
  }

  function runLightRefresh() {
    if (!result) { lightDirty = false; status.setPending({ light: false, heavy: heavyDirty }); return; }
    const t0 = perf.now();
    // **S5.2 (7):** רינדור־קל שומר זום ויעד גלילה (עדכון צבע רקע לא אמור לקפוץ
    // לראש המסמך); רק מסמך חדש באמת מאפס תצוגה — הנתיב הזה הוא keepView.
    preview.setResult(result, settings, { keepView: true, pageModel: pageModelObj, profile: engineProfile }); // רינדור בלבד — אותם עמודים, הגדרות חדשות, אותו פרופיל
    lastLightRefreshMs = perf.now() - t0;
    lightDirty = false;
    status.setPending({ light: false, heavy: heavyDirty });
  }

  /** כבד ⇒ אין עימוד אוטומטי (F-06): סימון + ⚡ מהבהב. */
  function markHeavyDirty(why) {
    heavyDirty = true;
    status.setPending({ light: lightDirty, heavy: true });
  }

  function onResetField(key) {
    const row = findKey(key);
    if (!row) return;
    onSettingChanged(key, row.default); // מסלול המדיניות הרגיל (קל/כבד)
    settingsPanel.refreshValues();
  }

  // ================= S11: ייבוא DOCX + החלת המלצות =================

  /** ייבוא קובץ DOCX (בתים) — המרה במקור היחיד; סירוב פורמט = הודעה עברית בלי קריסה (חוק 14). */
  function importDocxFile(bytes, fileName) {
    const res = importDocx(bytes, fileName);
    if (res.ok) {
      onDocumentAction('open', res.text); // נתיב מיידי (progress מוצג)
      status.setNotice(res.message);
    } else {
      status.setNotice(res.message); // «פורמט לא נתמך» — לא נטען, לא קורס
    }
    return res.ok;
  }

  /** החלת המלצה על טקסט המקור — החלת העריכה באותה פונקציה שהוכיחה אותה (מקור יחיד). */
  function applyRecommendation(rec) {
    if (!rec || !rec.edit || rec.edit.lineFromIdx == null || rec.edit.lineToIdx == null) return false;
    const lines = String(text).split('\n');
    const next = applyEdit(lines, { type: rec.edit.type, fromLine: rec.edit.lineFromIdx, toLine: rec.edit.lineToIdx });
    if (next == null) { status.setNotice('ההמלצה לא הוחלה — השורות במקור השתנו מאז חישובה.'); return false; }
    text = next;
    editor.setText(text);
    onExplicitRetypeset(); // פעולה מפורשת — נתיב מיידי
    status.setNotice('ההמלצה הוחלה והמסמך עומד מחדש.');
    return true;
  }

  // ================= S12: ייצוא (HTML עצמאי / PDF / ZIP) =================

  /** בקשת ייצוא — קריאה בלבד (F-06: אין עימוד/אין שינוי מצב); הפלט דרך opts.onExportFile
   * (בדפדפן: הורדה; בבדיקות: בדיקת הבתים). PDF דורש גופן מוטמע — opts.embeddedFont (בתים)
   * או נתיב הדפדפן: opts.remoteExport + opts.getExportFont (TTF לפי שם משפחה, אסינכרוני)
   * ⇒ הייצוא הכבד רץ ב־Worker (03.11). */
  /** **S5.2 (3):** נעילת כפתורי הייצוא בזמן ייצוא מרוחק — מנע לחיצה כפולה ⇒ ייצוא כפול. */
  function setExportBusy(busy) {
    if (preview && typeof preview.setExportBusy === 'function') preview.setExportBusy(!!busy);
  }

  async function runRemotePdfExport() {
    try {
      const font = await opts.getExportFont(settings['body-font']);
      if (!font || !font.bytes) {
        status.setNotice('ייצוא PDF דורש גופן TTF — לגופן שנבחר לא נמצא קובץ מוטמע. נא לבחור גופן מהסט המוטמע או לטעון TTF.');
        return { ok: false, reason: 'no-embedded-font' };
      }
      const res = await engine.requestExport({ kind: 'pdf', text, settings, fontBytes: font.bytes, fontName: font.name });
      if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
      const fbNote = font.fallbackFor
        ? ` (הגופן «${font.fallbackFor}» אינו בספרייה — הוטמע «${font.name}» במקומו)`
        : '';
      status.setNotice(`יוצא PDF — ${res.info && res.info.pages ? res.info.pages : '?'} עמודים, ${res.info && res.info.outline ? res.info.outline : 0} סימניות, טקסט נבחר.${fbNote}`);
      return { ok: true, kind: 'pdf', data: res.bytes, info: res.info };
    } catch (e) {
      status.setNotice('ייצוא PDF נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  async function runRemoteZipExport() {
    try {
      const res = await engine.requestExport({ kind: 'zip', text, settings, extensions: extensions.getBundle ? extensions.getBundle() : null });
      if (opts.onExportFile) opts.onExportFile('zip', res.bytes, 'book-project.zip');
      status.setNotice('יוצאה חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות+ערכה).');
      return { ok: true, kind: 'zip', data: res.bytes };
    } catch (e) {
      status.setNotice('ייצוא ZIP נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  function onExportRequest(kind) {
    if (!result) { status.setNotice('אין תוצאה לייצוא — העמוד עוד לא בוצע.'); return null; }
    // **S5.2 (3):** ייצוא = צילום מצב אחד. בעבר, PDF/ZIP הוזרמו למנוע עם הטקסט/ההגדרות
    // **הנוכחיים** בזמן ש-HTML רינדר את **התוצאה האחרונה** — שני קבצים סותרים
    // מאותו "ייצוא". אם יש שינויים שלא הוחלו (קלים/כבדים) — ייצוא נעצר בהודעה;
    // המשתמש ילחץ ⚡ ואז כל הנתיבים יצאו מאותו מצב בדיוק.
    if (lightDirty || heavyDirty) {
      status.setNotice('קיימים שינויים שלא הוחלו — הפעילו עימוד (⚡) לפני ייצוא');
      return { ok: false, kind, reason: 'dirty' };
    }
    // **W-2 (השלמת 9c.4):** exportHtml של המורשת הוסר מה-destructure — ה-HTML
    // נוצר מה-PageModel בלבד (exportHtmlFromModel).
    const { exportHtmlFromModel, exportProjectZip } = require('../engine/output/export-api');
    try {
      if (kind === 'html') {
        const fontCss = (typeof opts.getExportFontCss === 'function' && opts.getExportFontCss()) || '';
        // **פרוסה 4 (§3 — HTML מה-PageModel):** המנוע המאוחד מייצא מהמודל
        // שכבר חושב — אותו מקרין כמו התצוגה החיה; אין typeset נוסף.
        // חסר-מודל = כשל מפורש (אין נפילה לייצוא מהתוצאה הגולמית).
        if (!pageModelObj) {
          status.setNotice('ייצוא HTML דורש PageModel — אין נתיב חלופי (הפעילו עימוד מחדש).');
          return { ok: false, kind, reason: 'no-page-model' };
        }
        const html = exportHtmlFromModel(pageModelObj, settings, doc, { title: (result.metadata && result.metadata['ספר']) || 'ספר', fontCss });
        if (opts.onExportFile) opts.onExportFile('html', html, 'book.html');
        status.setNotice('יוצא HTML עצמאי מה-PageModel (חד־קובץ, offline, אין עימוד שני).');
        return { ok: true, kind, data: html };
      }
      if (kind === 'pdf') {
        // **נתיב הדפדפן (03.11):** המנוע הכבד חי ב־Worker — הייצוא שם עם TTF שנשלף לפי הגופן.
        if (opts.remoteExport && typeof opts.getExportFont === 'function') {
          status.setNotice('מייצא PDF במנוע (Worker)…');
          setExportBusy(true);
          // fire-and-forget — ההורדה וההודעות בסיום; **S5.2 (3):** שחרור הנעילה בסיום/כשל
          runRemotePdfExport().then(() => setExportBusy(false), () => setExportBusy(false));
          return { ok: true, kind, pending: true };
        }
        if (typeof Buffer === 'undefined') {
          // סביבה ללא מודול בואפרים וללא נתיב מרוחק — הודעה מפורשת (לא כשל שקט)
          status.setNotice('ייצוא PDF דורש גופן מוטמע או נתיב Worker — השתמשו בייצוא ה־HTML העצמאי.');
          return { ok: false, reason: 'no-buffer-in-browser' };
        }
        if (!opts.embeddedFont) {
          status.setNotice('ייצוא PDF דורש גופן מוטמע — נא לטעון גופן (TTF) בהגדרות המסמך.');
          return { ok: false, reason: 'no-embedded-font' };
        }
        // **המנוע המאוחד בלבד:** ייצוא מה-PageModel שכבר חושב — כמו הנתיב החי ב-Worker.
        // חסר-מודל (או שאין תוצאת עימוד כלל) = כשל מפורש; אין נפילה שקטה לעימוד מחדש.
        if (!pageModelObj) {
          status.setNotice('ייצוא PDF דורש PageModel — אין נתיב חלופי (הפעילו עימוד קודם).');
          return { ok: false, kind, reason: 'no-page-model' };
        }
        const { exportPdfFromModel } = require('../engine/output/export-api');
        const res = exportPdfFromModel(pageModelObj, settings, opts.embeddedFont);
        if (!res.ok) { status.setNotice('ייצוא PDF נכשל: ' + res.error); return res; }
        if (opts.onExportFile) opts.onExportFile('pdf', res.bytes, 'book.pdf');
        status.setNotice(`יוצא PDF מה-PageModel — ${res.info.pages} עמודים, ${res.info.outline} סימניות, טקסט נבחר.`);
        return { ok: true, kind, data: res.bytes, info: res.info };
      }
      if (kind === 'zip') {
        // **נתיב הדפדפן (03.11):** חבילת הפרויקט נבנית ב־Worker (zip-writer חי שם)
        if (opts.remoteExport) {
          status.setNotice('מייצא חבילת ZIP במנוע (Worker)…');
          setExportBusy(true);
          runRemoteZipExport().then(() => setExportBusy(false), () => setExportBusy(false)); // **S5.2 (3):** שחרור הנעילה בסיום/כשל
          return { ok: true, kind, pending: true };
        }
        const bytes = exportProjectZip(text, settings, {
          extensions: extensions.getBundle ? extensions.getBundle() : null
        });
        if (opts.onExportFile) opts.onExportFile('zip', bytes, 'book-project.zip');
        status.setNotice('יוצאה חבילת פרויקט ZIP (מסמך+הגדרות+הרחבות+ערכה).');
        return { ok: true, kind, data: bytes };
      }
    } catch (e) {
      status.setNotice('הייצוא נכשל: ' + (e && e.message ? e.message : String(e)));
      return { ok: false, error: String(e && e.message || e) };
    }
    return null;
  }


  /** **9c.3 + W-2 (השלמת 9c.4):** מערך העמודים הקנוני של התוצאה הנוכחית —
   * עמודי ה-PageModel בלבד (מקור האמת לגיאומטריה ולתוכן); אין עוד פרופיל
   * legacy. כל צרכן ה-UI (מחוונים, מפת שבירות, סמן↔עמוד) נגזר מכאן — אין
   * תלות סמויה ב-result.pages. */
  function canonicalPages() {
    if (engineProfile === 'unified' && pageModelObj && Array.isArray(pageModelObj.pages)) return pageModelObj.pages;
    return result ? result.pages : [];
  }

  function applyResultToViews() {
    // **9c.3:** מפת הסמן נבנית מהמקור הקנוני לפי הפרופיל — העמודים מה-PageModel
    // במאוחד (sourceTokenId בכל שורה), מעמודי התוצאה במורשת. הטוקנים הם מידע
    // זהות מקור (DocumentModel) — לא גיאומטריה; אין עימוד ואין מדידה כאן.
    const pages = canonicalPages();
    caretMapObj = buildCaretMap(text, result.tokens, pages);
    // **פרוסה 3 (§2.1–§2.3):** התצוגה מחוברת ל-PageModel בפרופיל המאוחד —
    // profile=unified כשהתוצאה ממנוע ה-DP ומודל קיים; legacy ממשיך ברנדרר
    // הישן (מצב תעבור מפורש עד שלב 9). ברירת המחדל החיה אינה משתנה.
    preview.setResult(result, settings, { pageModel: pageModelObj, profile: engineProfile });
    testing.setResult(result, { pageModel: pageModelObj, profile: engineProfile });
    testing.setRecommendations(result.recommendations || null); // **S11:** המלצות עם הוכחות
    // מפת שבירות עמודים לעורך (⏎ — תצוגה בלבד, F-01) — מהמקור הקנוני (9c.3)
    const breaks = [];
    for (const pg of pages) {
      if (pg.index === 0) continue;
      const toks = caretMapObj.tokensByPage.get(pg.index) || [];
      const tokId = toks[0];
      const tok = tokId ? result.tokens.find(t => t.id === tokId) : null;
      breaks.push({
        pageIndex: pg.index,
        firstWord: tok ? String(tok.raw || '').split(/\s+/)[0] || '' : ''
      });
    }
    editor.setPageBreaks(breaks);
    status.setPages(pages.length);
    status.setPending({ light: lightDirty, heavy: heavyDirty });
  }

  // ================= סנכרונים והפעלות =================

  /** כיוון א׳: סמן בעורך ⇒ הדגשת עמוד בתצוגה. */
  function onCaretMove(charIndex) {
    if (!caretMapObj) return;
    const page = caretMapObj.caretToPage(charIndex);
    if (page != null) preview.setCaretHighlight(page);
  }

  /** כיוון ב׳: לחיצה על עמוד / שורת TOC ⇒ מיקום הסמן בעורך. */
  function onActivatePage(pageIndex) {
    if (!caretMapObj) return;
    const caret = caretMapObj.pageToCaret(pageIndex);
    if (caret != null) editor.setCaret(caret);
  }

  /** כלל 2 (Working_rules): נתיב ההפעלה האחיד לכל ממצא — קפיצה + הדגשה + סמן. */
  function activateFinding(f) {
    switchTab('preview');
    preview.highlightIssue(f); // כולל scrollToPage
    if (f && f.page != null && caretMapObj) {
      const caret = caretMapObj.pageToCaret(Number(f.page));
      if (caret != null) editor.setCaret(caret);
    }
  }

  // ================= תבניות (REQ-UI-07) =================

  function saveTemplateJson() {
    return JSON.stringify({ format: 'tora-typesetter-template', version: 1, settings }, null, 2);
  }

  function loadTemplateJson(json) {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    if (raw.format !== 'tora-typesetter-template') throw new Error('תבנית לא מוכרת (format שגוי)');
    // **S4.6 (ביקורת 3) — חיבור מיגרציית המדור הקודם למסלול הטעינה בפועל:**
    // מפתחות שאינם ברישום RED עוברים דרך importImudSettings (טבלת ה-disposition)
    // במקום להישאר "לא מוכרים". ערכי ui-state נשמרים ב-_legacy-ui-state (לא אובדם).
    const { getSettingDefs } = require('../engine/core/settings-registry');
    const migrated = migrate(raw.settings || {});
    const regKeys = new Set(getSettingDefs().map(r => r.id));
    const known = {};
    for (const [k, v] of Object.entries(migrated)) {
      if (k === 'settings_version' || k.startsWith('_')) { known[k] = v; continue; }
      if (regKeys.has(k)) known[k] = v;
    }
    const { merged, unknownKeys, issues } = mergeWithDefaults(known);
    const unsupportedUnifiedKeys = [];
    if (branchProfile === 'unified') {
      for (const definition of getSettingDefs()) {
        if (definition.unifiedSupport === false
          && Object.prototype.hasOwnProperty.call(merged, definition.id)
          && JSON.stringify(merged[definition.id]) !== JSON.stringify(definition.default)) {
          unsupportedUnifiedKeys.push(definition.id);
          delete merged[definition.id];
        }
      }
    }
    for (const [k, v] of Object.entries(merged)) settings[k] = v;
    if (unsupportedUnifiedKeys.length) {
      status.setNotice('התבנית כוללת הגדרות שעדיין אינן נתמכות בפרופיל המאוחד; הן לא הוחלו: ' + unsupportedUnifiedKeys.join(', '));
    }
    settingsPanel.refreshValues();
    markHeavyDirty(); // הגדרות השתנו — המשתמש יחליט מתי לעמד (⚡)
    schedulePersistSettings(); // **פער 2 (S6.1):** טעינת תבנית = שינוי הגדרות — נשמר (SRS §17.1)
    return { unknownKeys, issues, unsupportedUnifiedKeys };
  }

  /** **S4.6:** גובה תיבת התוכן בפועל של הגדרות העמוד הנוכחיות — להמרות אחוז⇒פיקסל
   * במיפוי מדור קודם (h2-top-distance). נפילה ל-1040 (A4) אם אין גיאומטריה. */
  function currentContentHeightPx() {
    try {
      const { buildPageTemplate } = require('../engine/layout/page-templates');
      const t = buildPageTemplate('regular', settings, true);
      if (t && t.contentBox && Number(t.contentBox.height) > 0) return Number(t.contentBox.height);
    } catch (e) { /* תבנית לא זמינה — ברירת המחדל בהמשך */ }
    return 1040;
  }

  // ================= דיבאג פר־עמוד (V21) =================

  function buildDebugJson(pageIndex) {
    if (!result) return { error: 'אין תוצאה — עמדו את המסמך תחילה' };
    const ledgerSlice = (result.ledger.issues || []).filter(rec => rec.page === pageIndex || String(rec.target || '').includes(`p${pageIndex}`));
    const traceSlice = (result.trace.events || []).filter(ev => ev.pageIndex === pageIndex);
    const findingsSlice = (result.report.findings || []).filter(f => Number(f.page) === pageIndex);
    // **9c.3 + W-2 (השלמת 9c.4):** בפרופיל המאוחד הגיאומטריה והתוכן של העמוד
    // מה-PageModel — מקור האמת. ענף התוצאה הגולמית שלהלן הוא אבחון הגנתי
    // בלבד (תוצאה ללא מודל לא אמורה להיווצר במנוע היחיד) — לא רנדרר.
    if (engineProfile === 'unified' && pageModelObj && Array.isArray(pageModelObj.pages)) {
      const mp = pageModelObj.pages.find(p => p.index === pageIndex);
      if (!mp) return { error: `עמוד ${pageIndex} לא נמצא ב-PageModel` };
      return {
        schema: 'page-debug-v1',
        profile: 'unified',
        source: 'PageModel',
        pageIndex,
        type: mp.type,
        geometry: mp.geometry,                      // מידות/שוליים/טורים מהמודל
        ...(mp.spanning ? { spanning: mp.spanning } : {}),
        ...(mp.shaar ? { shaar: mp.shaar } : {}),
        ...(mp.custom ? { custom: { boxes: mp.custom.boxes.length, images: mp.custom.images.length } } : {}),
        lines: (mp.lines || []).map(ln => ({
          id: ln.id, sourceTokenId: ln.sourceTokenId != null ? ln.sourceTokenId : null,
          kind: ln.kind || null, area: ln.area || null,
          x: ln.x, y: ln.y, w: ln.w, h: ln.h,
          words: (ln.words || []).length, projected: ln.projected !== false
        })),
        footnotes: (mp.footnotes || []).map(n => ({ noteId: n.noteId, anchorId: n.anchorId || null, marker: n.marker || null })),
        sideNotes: (mp.sideNotes || []).map(n => ({ noteId: n.noteId, anchorId: n.anchorId || null })),
        images: (mp.images || []).length,
        decorations: (mp.decorations || []).length,
        folioDisplay: mp.folioDisplay || '',
        pageNumber: mp.pageNumber != null ? mp.pageNumber : null,
        findings: findingsSlice,
        ledger: ledgerSlice,                          // פרוסת ledger לעמוד זה
        trace: traceSlice,                            // פרוסת מסלול לעמוד זה
        layoutHash: result.layoutHash
      };
    }
    const pg = result.pages.find(p => p.index === pageIndex);
    if (!pg) return { error: `עמוד ${pageIndex} לא נמצא` };
    return {
      schema: 'page-debug-v1',
      profile: 'legacy',
      pageIndex,
      type: pg.type,
      template: pg.template,                       // גיאומטריה מלאה: מידות/שוליים/טורים/תיבת תוכן
      contentBox: pg.template && pg.template.contentBox,
      columns: (pg.columns || []).map(c => c.map(ln => ({
        tokenId: ln.tokenId != null ? ln.tokenId : (ln.meta && ln.meta.tokenId),
        heightPx: ln.heightPx, words: (ln.words || []).length, kind: ln.kind || null
      }))),
      footnotes: (pg.footnotes || []).length,
      header: pg.header ? { slots: pg.header.slots ? Object.keys(pg.header.slots) : ['legacy'] } : null,
      folioDisplay: pg.folioDisplay || '',
      findings: findingsSlice,
      ledger: ledgerSlice,                          // פרוסת ledger לעמוד זה
      trace: traceSlice,                            // פרוסת מסלול לעמוד זה
      layoutHash: result.layoutHash
    };
  }

  // ================= מצב התחלתי =================
  status.setOffline(settings['offline-guard'] !== false);
  status.setFonts(opts.fontStatus || 'ready');

  return {
    root, switchTab, editor, settingsPanel, preview, testing, status, engine, extensions,
    // **שלב 8 פרוסה 2 (§4.4 — המודל בצרכן ה-UI):** גישה ל-PageModel שהתקבל
    // מה-Worker (מאומת + קפוא מחדש). פרוסה 3 תעביר את ה-DOM לצריכתו הבלעדית.
    pageModel: () => pageModelObj,
    // **S75 (בקשה 3):** שליטה/בדיקה של חלוקת סביבת העבודה (המפריד)
    getSplitPct: () => splitPct,
    setSplitPct,
    onExplicitRetypeset, onDocumentAction, onSettingChanged, onResetField,
    onCancelTypeset, // **S1-ה/U-1:** נתיב ביטול מפורש (לבדיקות/אבחון)
    scheduleLightRefresh, activateFinding, saveTemplateJson, loadTemplateJson, buildDebugJson,
    importDocxFile, applyRecommendation, // **S11:** ייבוא DOCX + החלת המלצות
    exportRequest: onExportRequest, // **S12:** ייצוא (html/pdf/zip) — קריאה בלבד
    refreshFontCatalog: (families) => settingsPanel.refreshFontCatalog && settingsPanel.refreshFontCatalog(families), // **03.11**
    imudLibrary: opts.imudLibrary || null, // **03.11:** ספריית IMUD לניפוי/הרחבות
    applyLegacyDefaults, // **03.11(ד):** נתיב יחיד להחלת ברירות המקור (פאנל + אתחול)
    getState: () => ({ lightDirty, heavyDirty, lastLightRefreshMs, hasResult: !!result, pages: canonicalPages().length, layoutHash: result ? result.layoutHash : null, gen: typesetGen }),
    setText: (t) => { text = String(t != null ? t : ''); editor.setText(text); },
    getText: () => editor.getText(),
    getSettings: () => settings,
    // **S6.1 — פער 1:** הזרקת מסמכי בדיקה (קבוע/רנדומלי) — נתיב מסמך מפורש
    onGenerateTestDocument,
    // **S6.1 — פער 2:** השתמרות הגדרות (SRS §17.1) — נקודות כניסה ל-boot ולבדיקות
    captureSettingsBaseline, restorePersistedSettings, persistSettingsNow,
    clearPersistedSettings: () => (persist ? persist.clear() : false)
  };
}

module.exports = { createApp, TABS };
