/**
 * Send a one-off test push to every active subscriber. Run with:
 *   DATABASE_URL=... NEXT_PUBLIC_VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:contact@footy-feed.com npx tsx scripts/send-test-push.ts
 *
 * The path-based aliases used in the app (@/lib/...) don't work in plain
 * tsx scripts, so this re-implements the send logic against the same
 * push_subscriptions table.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import webpush from 'web-push';

async function main() {
  const url = process.env.DATABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contact@footy-feed.com';

  if (!url) { console.error('DATABASE_URL not set'); process.exit(1); }
  if (!publicKey || !privateKey) {
    console.error('Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY');
    process.exit(1);
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const sql = postgres(url, { prepare: false });
  const subs = await sql<{ id: string; endpoint: string; p256dh: string; auth: string }[]>`
    SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE active = TRUE
  `;
  console.log(`Found ${subs.length} active subscribers`);

  if (subs.length === 0) {
    console.log('No subscribers yet — open the site and opt in via the banner first.');
    await sql.end();
    return;
  }

  const payload = JSON.stringify({
    title: '✅ Footy Feed push works',
    body: 'Tap to open. Goal alerts will arrive like this.',
    url: '/',
    tag: 'test-push',
    requireInteraction: false,
  });

  let delivered = 0;
  let expired = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60, urgency: 'high' as any },
      );
      delivered++;
    } catch (err: any) {
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        expiredIds.push(sub.id);
        expired++;
      } else {
        failed++;
        console.error(`  fail (${status}): ${err?.body || err?.message}`);
      }
    }
  }

  if (expiredIds.length > 0) {
    await sql`UPDATE push_subscriptions SET active = FALSE WHERE id = ANY(${expiredIds as any})`;
  }

  console.log(`\nDelivered: ${delivered}, Expired: ${expired}, Failed: ${failed}`);
  await sql.end();
}

main().catch(e => { console.error('FAIL:', e); process.exit(1); });
