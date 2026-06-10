import webpush from "web-push";
import cron from "node-cron";
import { storage } from "./storage";

const NOTIF_DATE_KEY = "last_daily_notif_date";

// Returns today's date in Cairo timezone as "YYYY-MM-DD"
function getCairoDateString(): string {
  const now = new Date();
  // Intl.DateTimeFormat gives Cairo calendar date correctly
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(now);
  // en-CA locale returns "YYYY-MM-DD" directly
  return parts;
}

// ── helper: send one push notification ───────────────────────────────────────
async function sendOne(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<'ok' | 'expired' | 'error'> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload,
    );
    return 'ok';
  } catch (err: unknown) {
    const code = (err as { statusCode?: number })?.statusCode;
    const body = (err as { body?: string })?.body;
    if (code === 410 || code === 404) return 'expired';
    console.error('[push] SEND FAILED — code:', code, '— body:', body, '— endpoint:', sub.endpoint.slice(-40));
    return 'error';
  }
}

export function setupVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:contact@oscardevs.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set — push notifications disabled");
    return;
  }

  const safePublicKey = publicKey.trim().replace(/\s+/g, "").replace(/=+$/, "");
  const safePrivateKey = privateKey.trim().replace(/\s+/g, "").replace(/=+$/, "");

  try {
    webpush.setVapidDetails(email, safePublicKey, safePrivateKey);
    console.log("[push] VAPID initialized");
  } catch (err) {
    console.warn("[push] VAPID initialization failed — push notifications disabled:", err);
  }
}

// In-process mutex: prevents two concurrent calls from both proceeding
let sendingInProgress = false;

export async function sendDailyVerseNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("[push] VAPID_PUBLIC_KEY not set — skipping daily notification");
    return;
  }

  // ── Mutex: block concurrent calls (race between main cron + backup cron) ──
  if (sendingInProgress) {
    console.log("[push] Already sending — skipping duplicate trigger");
    return;
  }
  sendingInProgress = true;

  try {
    const today = getCairoDateString();

    // ── DB guard: skip if already sent today (survives server restarts) ────
    const lastSentDate = await storage.getAppSetting(NOTIF_DATE_KEY);
    if (lastSentDate === today) {
      console.log(`[push] Daily notification already sent for ${today} — skipping`);
      return;
    }

    // ── Mark as sent in DB BEFORE sending (prevents duplicate on partial failure) ──
    await storage.setAppSetting(NOTIF_DATE_KEY, today);

    const month = new Date().getMonth() + 1;
    const day   = new Date().getDate();

    const calVerse = await storage.getCalendarDailyVerse(month, day);
    if (!calVerse) {
      console.warn(`[push] No calendar verse for ${month}/${day} — notification skipped`);
      return;
    }
    const refParts = calVerse.verseReference.match(/^(.+?)\s*(\d+):(\d+)$/);
    const bookName = refParts ? refParts[1].trim() : calVerse.verseReference;
    const chapter  = refParts ? parseInt(refParts[2]) : 1;
    const verseNum = refParts ? parseInt(refParts[3]) : 1;
    const dbVerse  = await storage.getVerseByReference(bookName, chapter, verseNum);
    const verseText = dbVerse?.text ?? calVerse.verseText;
    const verseRef  = `${bookName} ‎${chapter}:‎${verseNum}`;

    const subscriptions = await storage.getAllPushSubscriptions();
    if (subscriptions.length === 0) {
      console.log("[push] No active subscriptions");
      return;
    }

    const payload = JSON.stringify({
      title: "آية اليوم 📖",
      body: verseText.length > 120
        ? verseText.slice(0, 117) + `…\n— ${verseRef}`
        : `${verseText}\n— ${verseRef}`,
      url: "/",
    });

    let sent = 0, expired = 0, errors = 0;
    await Promise.all(subscriptions.map(async sub => {
      const result = await sendOne(sub, payload);
      if (result === 'ok')           { sent++; }
      else if (result === 'expired') { expired++; await storage.deletePushSubscription(sub.endpoint); }
      else                           { errors++; }
    }));

    console.log(`[push] Daily verse sent=${sent} expired_removed=${expired} errors=${errors} total=${subscriptions.length} date=${today}`);
  } catch (err) {
    console.error("[push] Error sending daily verse notification:", err);
  } finally {
    sendingInProgress = false;
  }
}

// ── Welcome notification (single subscription) ───────────────────────────────
export async function sendWelcomeNotification(endpoint: string): Promise<boolean> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return false;
  try {
    const subscriptions = await storage.getAllPushSubscriptions();
    const sub = subscriptions.find(s => s.endpoint === endpoint);
    if (!sub) return false;
    const payload = JSON.stringify({
      title: "أهلاً وسهلاً بعودتك 🙏",
      body: "نسعد بزيارتك. الكتاب المقدس معك دائماً.",
      url: "/",
    });
    const result = await sendOne(sub, payload);
    if (result === 'expired') await storage.deletePushSubscription(endpoint);
    return result === 'ok';
  } catch {
    return false;
  }
}

// ── Test notification (all subscriptions) ────────────────────────────────────
export async function sendTestNotification(): Promise<{ sent: number; total: number }> {
  const subscriptions = await storage.getAllPushSubscriptions();
  let sent = 0;
  const payload = JSON.stringify({
    title: "اختبار الإشعارات ✅",
    body: "وصل الإشعار بنجاح!",
    url: "/",
  });
  await Promise.all(subscriptions.map(async sub => {
    const r = await sendOne(sub, payload);
    if (r === 'ok') sent++;
    if (r === 'expired') await storage.deletePushSubscription(sub.endpoint);
  }));
  return { sent, total: subscriptions.length };
}

// ── Scheduling ────────────────────────────────────────────────────────────────
export function scheduleDailyNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  // Primary: 6:00 AM Cairo
  cron.schedule("0 6 * * *", sendDailyVerseNotification, { timezone: "Africa/Cairo" });
  console.log("[push] Daily notification scheduled at 6:00 AM Cairo time");

  // Backup: every 30 min within 6:00–7:59 AM Cairo window
  // Handles server sleep/restart at 6 AM — DB guard prevents double-send
  cron.schedule("*/30 * * * *", async () => {
    const now = new Date();
    const cairoHour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour: 'numeric', hour12: false }).format(now)
    );
    if (cairoHour >= 6 && cairoHour < 8) {
      const today = getCairoDateString();
      const lastSent = await storage.getAppSetting(NOTIF_DATE_KEY).catch(() => null);
      if (lastSent !== today) {
        console.log('[push] Backup check: sending missed daily notification for', today);
        await sendDailyVerseNotification();
      }
    }
  });
  console.log("[push] Backup 30-min check scheduled (window: 6:00-7:59 AM Cairo)");
}
