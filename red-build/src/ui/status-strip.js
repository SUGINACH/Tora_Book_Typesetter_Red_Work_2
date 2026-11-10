// src/ui/status-strip.js — פס מצב ואזהרות (S10.1-6: המתנה, שומר־נתק, גופנים, מנוע)
'use strict';

/**
 * רצועת מצב עליונה: מצב מנוע + התקדמות ("עמוד X מתוך Y"), מחוון שינויים
 * ממתינים (קלים/כבדים), כפתור ⚡ מהבהב (כבדים — F-06), כפתור ⏹ ביטול העבודה
 * הפעילה (אודיט תפעולי S1-ה/U-1: המנגנון קיים ב-worker-client אך לא היה
 * נגיש למשתמש כפעולה מפורשת), צ'יפ מידע ריצה (S1-ה/U-2: hash פריסה/קלט,
 * מזהה ריצה, זמן ריצה — תכנית אב §7.1), שומר נתק־מהרשת, מצב טעינת גופנים.
 * נגישות: aria-live להתקדמות; הכפתורים עם תווית מלאה.
 */

function buildStatusStrip(doc, opts) {
  const root = doc.createElement('div');
  root.className = 'status-strip';
  root.setAttribute('role', 'status');

  // ---- מצב מנוע + התקדמות ----
  const engine = doc.createElement('span');
  engine.className = 'chip chip--engine';
  engine.setAttribute('aria-live', 'polite');
  engine.textContent = '⏳ מנוע: פנוי';

  const progress = doc.createElement('span');
  progress.className = 'chip chip--progress';
  progress.setAttribute('aria-live', 'polite');
  progress.textContent = '';

  // ---- שינויים ממתינים + ⚡ ----
  const pending = doc.createElement('span');
  pending.className = 'chip chip--pending';
  pending.textContent = 'אין שינויים ממתינים';

  const bolt = doc.createElement('button');
  bolt.type = 'button';
  bolt.className = 'btn btn--bolt';
  bolt.textContent = '⚡ עדכן ועמד מחדש';
  bolt.setAttribute('aria-label', 'עדכן ועמד מחדש — נתיב מיידי בלי השהיה');
  bolt.title = 'שינויים כבדים ממתינים — לחיצה מריצה עימוד מלא מיידי (בלי debounce)';
  bolt.addEventListener('click', () => opts.onExplicitRetypeset && opts.onExplicitRetypeset());
  let blinking = false;

  // ---- כפתור ביטול העבודה הפעילה (S1-ה/U-1 — אודיט תפעולי סוכן 1) ----
  // גלוי רק כשהמנוע עמל (setEngineState מסתיר/מציג). הביטול עצמו חי ב-app-shell
  // (engine.cancel — terminate+respawn בדפדפן; סימון+הודעה ב-inline) — כאן רק UI.
  const cancelBtn = doc.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn btn--cancel';
  cancelBtn.textContent = '⏹ בטל';
  cancelBtn.setAttribute('aria-label', 'ביטול העימוד הפעיל');
  cancelBtn.title = 'קטיעת העימוד הרץ — המנוע יופעל מחדש אוטומטית בפעולה הבאה';
  cancelBtn.style.display = 'none';
  cancelBtn.addEventListener('click', () => opts.onCancel && opts.onCancel());

  // ---- שומר נתק־מהרשת ----
  const offline = doc.createElement('span');
  offline.className = 'chip chip--offline';
  offline.textContent = '🔌 שומר נתק: פעיל';

  // ---- גופנים ----
  const fonts = doc.createElement('span');
  fonts.className = 'chip chip--fonts';
  fonts.textContent = '🔤 גופנים: מוכנים';

  // ---- עמודים ----
  const pages = doc.createElement('span');
  pages.className = 'chip chip--pages';
  pages.textContent = '📄 0 עמודים';

  // ---- מידע ריצה (S1-ה/U-2 — תכנית אב §7.1: "כל תוצאת עימוד מציגה hash,
  // סטטוס שימור תוכן, מספר עמודים, זמן ריצה") ----
  // גלוי לאחר כל עימוד שהושלם; הפרטים המלאים (מזהה ריצה, hash קלט/פריסה
  // במלואם, גרסת נכסים) ב-tooltip (title). מתרוקן בניקוי המסמך.
  const runInfo = doc.createElement('span');
  runInfo.className = 'chip chip--runinfo';
  runInfo.setAttribute('role', 'status');
  runInfo.setAttribute('aria-live', 'polite');
  runInfo.textContent = '';

  // ---- הודעות חולפות (S11: ייבוא/סירוב פורמט/החלת המלצה — חוק 14 בלי חלונות) ----
  const notice = doc.createElement('span');
  notice.className = 'chip chip--notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  notice.textContent = '';
  let noticeTimer = null;

  for (const el of [engine, progress, pending, bolt, cancelBtn, offline, fonts, pages, runInfo, notice]) root.appendChild(el);

  return {
    root, bolt, cancelBtn,
    setEngineState(state, info) {
      if (state === 'working') {
        engine.textContent = '⚙️ מנוע: עמל…';
        progress.textContent = info && info.label ? info.label : '';
        cancelBtn.style.display = ''; // **S1-ה/U-1:** הביטול נגיש רק בזמן עבודה
      } else if (state === 'error') {
        engine.textContent = '❌ מנוע: שגיאה';
        progress.textContent = (info && info.message) || '';
        cancelBtn.style.display = 'none';
      } else {
        engine.textContent = '⏳ מנוע: פנוי';
        progress.textContent = '';
        cancelBtn.style.display = 'none';
      }
    },
    setPending({ light, heavy }) {
      const parts = [];
      if (light) parts.push('קלים (רינדור בקרוב)');
      if (heavy) parts.push('כבדים — נדרש ⚡');
      pending.textContent = parts.length ? `⏳ שינויים ממתינים: ${parts.join(' · ')}` : 'אין שינויים ממתינים';
      this.setBlink(!!heavy);
    },
    setBlink(on) {
      blinking = on;
      bolt.classList.toggle('blink', on);
      bolt.setAttribute('aria-live', on ? 'assertive' : 'off');
    },
    getBlink() { return blinking; },
    setOffline(active) {
      offline.textContent = active ? '🔌 שומר נתק: פעיל' : '⚠️ שומר נתק: כבוי';
      offline.classList.toggle('chip--warn', !active);
    },
    setFonts(status) {
      const map = { loading: '🔤 גופנים: נטענים…', ready: '🔤 גופנים: מוכנים', error: '🔤 גופנים: שגיאת טעינה' };
      fonts.textContent = map[status] || map.ready;
    },
    setPages(n) { pages.textContent = `📄 ${n} עמודים`; },
    /** **S1-ה/U-2:** מידע הריצה שהושלמה — hash מקוצר + שימור + עמודים + זמן בצ'יפ;
     * הפרטים המלאים ב-tooltip. אובייקט ריק/בלי layoutHash ⇒ פינוי הצ'יפ. */
    setRunInfo(info) {
      info = info || {};
      if (!info.layoutHash) {
        runInfo.textContent = '';
        runInfo.title = '';
        runInfo.classList.remove('chip--warn');
        return;
      }
      const short = String(info.layoutHash).slice(0, 8);
      const parts = [`🔒 ${short}`];
      if (info.contentPreserved != null) parts.push(info.contentPreserved ? 'שימור ✓' : 'שימור ✗');
      if (info.pages != null) parts.push(`${info.pages} עמ׳`);
      if (info.ms != null && Number.isFinite(info.ms)) {
        parts.push(info.ms < 1000 ? `${Math.max(1, Math.round(info.ms))} מ״ש` : `${(info.ms / 1000).toFixed(1)} שנ׳`);
      }
      runInfo.textContent = parts.join(' · ');
      runInfo.classList.toggle('chip--warn', info.contentPreserved === false);
      const tip = [];
      if (info.jobId) tip.push(`מזהה ריצה: ${info.jobId}`);
      tip.push(`hash פריסה: ${info.layoutHash}`);
      if (info.contentHashIn) tip.push(`hash קלט: ${info.contentHashIn}`);
      if (info.engineVersion) tip.push(`גרסת נכסים: ${info.engineVersion}`);
      runInfo.title = tip.join('\n');
    },
    /** הודעה חולפת (8 שניות) — ייבוא, סירוב פורמט, החלת המלצה. */
    setNotice(text) {
      notice.textContent = String(text != null ? text : '');
      notice.classList.toggle('chip--notice-on', !!text);
      if (noticeTimer != null) clearTimeout(noticeTimer);
      if (text) noticeTimer = setTimeout(() => { notice.textContent = ''; notice.classList.remove('chip--notice-on'); noticeTimer = null; }, 8000);
    }
  };
}

module.exports = { buildStatusStrip };
