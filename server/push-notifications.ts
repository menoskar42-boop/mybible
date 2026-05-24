import webpush from "web-push";
import cron from "node-cron";
import { storage } from "./storage";

export function setupVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:contact@oscardevs.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys not set — push notifications disabled");
    return;
  }

  webpush.setVapidDetails(email, publicKey, privateKey);
  console.log("[push] VAPID initialized");
}

export async function sendDailyVerseNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const verse = await storage.getCalendarDailyVerse(month, day);
    if (!verse) {
      console.warn("[push] No calendar verse found for today");
      return;
    }

    const subscriptions = await storage.getAllPushSubscriptions();
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title: "آية اليوم 📖",
      body: `${verse.verseText}\n— ${verse.verseReference}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
      )
    );

    // Remove expired subscriptions (410 Gone)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected") {
        const err = r.reason as { statusCode?: number };
        if (err.statusCode === 410) {
          await storage.deletePushSubscription(subscriptions[i].endpoint);
        }
      }
    }

    const sent = results.filter(r => r.status === "fulfilled").length;
    console.log(`[push] Sent to ${sent}/${subscriptions.length} subscribers`);
  } catch (err) {
    console.error("[push] Error sending daily verse notification:", err);
  }
}

export function scheduleDailyNotification() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return;

  cron.schedule("0 8 * * *", sendDailyVerseNotification, { timezone: "Africa/Cairo" });
  console.log("[push] Daily notification scheduled at 8:00 AM Cairo time");
}
