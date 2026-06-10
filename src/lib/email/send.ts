import { getTransport, FROM_EMAIL } from './transport';
import { db, newsletterSubscribers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

/**
 * Get the current hour (0-23) in a given IANA timezone. Returns -1 on
 * invalid tz strings (Intl will throw, we swallow).
 */
function getCurrentHourInTimezone(tz: string): number {
  try {
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    return parseInt(timeStr, 10);
  } catch {
    return -1;
  }
}

interface SendOptions {
  /** If set, only send to subscribers where it's currently this hour locally */
  targetLocalHour?: number;
}

export async function sendToAllSubscribers(
  subject: string,
  html: string,
  options?: SendOptions
): Promise<{ sent: number; failed: number; skipped: number }> {
  const subscribers = await db
    .select({
      email: newsletterSubscribers.email,
      timezone: newsletterSubscribers.timezone,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, 'active'));

  if (subscribers.length === 0) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  // Filter by timezone if targetLocalHour is set. Per-subscriber check:
  // get THEIR current local hour and compare to the target. This works
  // for half-hour-offset zones (India, Newfoundland) which the old
  // bucket-of-common-zones approach silently dropped.
  let toSend = subscribers;
  let skipped = 0;

  if (options?.targetLocalHour !== undefined) {
    const target = options.targetLocalHour;
    toSend = subscribers.filter(s => getCurrentHourInTimezone(s.timezone) === target);
    skipped = subscribers.length - toSend.length;

    if (toSend.length === 0) {
      return { sent: 0, failed: 0, skipped };
    }
  }

  // Guard: if SMTP isn't configured, fail fast with a clear message
  // instead of nodemailer silently sending with bogus credentials.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[email] SMTP_HOST/SMTP_USER not set — skipping sends');
    return { sent: 0, failed: toSend.length, skipped };
  }

  const transport = getTransport();
  let sent = 0;
  let failed = 0;

  // Send in batches of 10
  const batchSize = 10;
  for (let i = 0; i < toSend.length; i += batchSize) {
    const batch = toSend.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map(async ({ email }) => {
        try {
          const personalizedHtml = html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(email));

          await transport.sendMail({
            from: FROM_EMAIL,
            to: email,
            subject,
            html: personalizedHtml,
          });
          sent++;
        } catch (error) {
          console.error(`Failed to send to ${email}:`, error);
          failed++;
        }
      })
    );

    if (i + batchSize < toSend.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return { sent, failed, skipped };
}

export async function sendTestEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = getTransport();
  const personalizedHtml = html.replace(/\{\{EMAIL\}\}/g, encodeURIComponent(to));

  await transport.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `[TEST] ${subject}`,
    html: personalizedHtml,
  });
}
