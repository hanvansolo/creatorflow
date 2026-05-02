/**
 * Web Push send helper. Loops over active subscriptions and pushes the
 * payload to each. On 404/410 (subscription expired), the row is flagged
 * `active = false` so future runs skip it. Other errors are logged but
 * don't cascade — one bad subscription shouldn't kill the whole batch.
 */

import webpush from 'web-push';
import { db, pushSubscriptions } from '@/lib/db';
import { eq, inArray } from 'drizzle-orm';

let configured = false;

function configure() {
  if (configured) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@footy-feed.com';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** Image to show in the expanded notification (Android-only). */
  image?: string;
  /** Tag de-dupes notifications — re-using a tag replaces the previous one. */
  tag?: string;
  /** Beep again even if a notification with the same tag is showing. */
  renotify?: boolean;
  /** Don't auto-dismiss — useful for breaking news / final whistles. */
  requireInteraction?: boolean;
}

interface SendResult {
  attempted: number;
  delivered: number;
  expired: number;
  failed: number;
}

const CONCURRENCY = 25;

export async function sendPushToAll(payload: PushPayload): Promise<SendResult> {
  if (!configure()) {
    console.warn('[push] VAPID keys not configured; skipping send');
    return { attempted: 0, delivered: 0, expired: 0, failed: 0 };
  }

  const subs = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.active, true));

  if (subs.length === 0) {
    return { attempted: 0, delivered: 0, expired: 0, failed: 0 };
  }

  const dataString = JSON.stringify(payload);
  const expiredIds: string[] = [];
  let delivered = 0;
  let failed = 0;

  // Simple concurrency-limited batch sender.
  for (let i = 0; i < subs.length; i += CONCURRENCY) {
    const chunk = subs.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          dataString,
          { TTL: 60 * 60, urgency: 'high' as any },
        );
        delivered++;
      } catch (err: any) {
        const status = err?.statusCode;
        if (status === 404 || status === 410) {
          expiredIds.push(sub.id);
        } else {
          failed++;
          console.error(`[push] send failed (${status}):`, err?.body || err?.message);
        }
      }
    }));
  }

  if (expiredIds.length > 0) {
    await db
      .update(pushSubscriptions)
      .set({ active: false })
      .where(inArray(pushSubscriptions.id, expiredIds));
  }

  return { attempted: subs.length, delivered, expired: expiredIds.length, failed };
}
