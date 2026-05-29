import webpush from "web-push";
import cron from "node-cron";
import { storage } from "./storage";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// ── استمرارية التاريخ بين إعادة تشغيل السيرفر ──────────────────────────────
const DATA_DIR = join(process.cwd(), "data");
const NOTIF_DATE_FILE = join(DATA_DIR, "last-daily-notif.txt");

function loadLastNotifDate(): string {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    if (!existsSync(NOTIF_DATE_FILE)) return "";
    return readFileSync(NOTIF_DATE_FILE, "utf8").trim();
  } catch { return ""; }
}

function saveLastNotifDate(date: string): void {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(NOTIF_DATE_FILE, date, "utf8");
  } catch (err) {
    console.error("[push] Failed to save notif date:", err);
  }
}

// ── helper: إرسال إشعار واحد مع تسجيل النتيجة
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

  // Strip whitespace, newlines, padding — keep only valid Base64url chars
  const safePublicKey = publicKey.trim().replace(/\s+/g, "").replace(/=+$/, "");
  const safePrivateKey = privateKey.trim().replace(/\s+/g, "").replace(/=+$/, "");

  try {
    webpush.setVapidDetails(email, safePublicKey, safePrivateKey);
    console.log("[push] VAPID initialized");
  } catch (err) {
    console.warn("[push] VAPID initialization failed — push notifications disabled:", err);
  }
}

export async function sendDailyVerseNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("[push] VAPID_PUBLIC_KEY not set — skipping daily notification");
    return;
  }

  try {
    // ── الحصول على آية اليوم (مع fallback)
    const today = new Date();
    const month = today.getMonth() + 1;
    const day   = today.getDate();

    const calVerse = await storage.getCalendarDailyVerse(month, day);
    if (!calVerse) {
      console.warn(`[push] No calendar verse for ${month}/${day} — notification skipped. Run seed to populate calendar_daily_verses.`);
      return;
    }
    const verseText = calVerse.verseText;
    const verseRef  = calVerse.verseReference;

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
      if (result === 'ok')      { sent++; }
      else if (result === 'expired') { expired++; await storage.deletePushSubscription(sub.endpoint); }
      else                      { errors++; }
    }));

    markDailyNotifSent();
    console.log(`[push] Daily verse sent=${sent} expired_removed=${expired} errors=${errors} total=${subscriptions.length}`);
  } catch (err) {
    console.error("[push] Error sending daily verse notification:", err);
  }
}

// ── إرسال إشعار ترحيبي لاشتراك واحد (endpoint محدد)
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

// ── إرسال إشعار اختبار لكل الاشتراكات (للتشخيص فقط)
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

// tracks which calendar date the daily notification was last sent
// loaded from disk on startup so server restarts don't lose state
let lastDailyNotifDate = loadLastNotifDate();
console.log("[push] Last daily notif date:", lastDailyNotifDate || "(none)");

export function scheduleDailyNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  cron.schedule("0 6 * * *", sendDailyVerseNotification, { timezone: "Africa/Cairo" });
  console.log("[push] Daily notification scheduled at 6:00 AM Cairo time");

  // Backup: check every 30 min — only within 6:00-7:59 AM window (handles server sleep at 6 AM)
  // Narrow window prevents re-sending if server restarts later in the day
  cron.schedule("*/30 * * * *", async () => {
    const now = new Date();
    const cairoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));
    const cairoHour = cairoTime.getHours();
    const today = cairoTime.toISOString().split('T')[0];
    if (cairoHour >= 6 && cairoHour < 8 && today !== lastDailyNotifDate) {
      console.log('[push] Backup check: sending missed daily notification for', today);
      await sendDailyVerseNotification();
    }
  });
  console.log("[push] Backup 30-min check scheduled (window: 6:00-7:59 AM Cairo)");
}

// Called by sendDailyVerseNotification to mark today as sent — persisted to disk
export function markDailyNotifSent() {
  const today = new Date().toISOString().split('T')[0];
  lastDailyNotifDate = today;
  saveLastNotifDate(today);
}
