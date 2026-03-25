import { getTransport, FROM_EMAIL } from './transport';
import { db, newsletterSubscribers } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

/**
 * Get the current hour (0-23) in a given IANA timezone.
 */
function getCurrentHourInTimezone(tz: string): number {
  try {
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    return parseInt(timeStr, 10);
  } catch {
    return -1; // Invalid timezone
  }
}

/**
 * Group IANA timezones by UTC offset bucket so we can send
 * at ~8am local time for daily emails. Returns the set of
 * timezone strings where it's currently the target hour.
 */
export function getTimezonesAtHour(targetHour: number): Set<string> {
  const commonTimezones = [
    'Pacific/Auckland', 'Australia/Sydney', 'Australia/Perth',
    'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Asia/Dubai',
    'Europe/Moscow', 'Europe/Istanbul', 'Europe/Helsinki',
    'Europe/Berlin', 'Europe/Paris', 'Europe/London',
    'Atlantic/Azores', 'America/Sao_Paulo', 'America/New_York',
    'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Anchorage', 'Pacific/Honolulu', 'UTC',
  ];

  const matching = new Set<string>();
  for (const tz of commonTimezones) {
    if (getCurrentHourInTimezone(tz) === targetHour) {
      matching.add(tz);
    }
  }
  return matching;
}

/**
 * Map a subscriber's timezone to the nearest common timezone bucket.
 */
function matchesTimezoneSet(subscriberTz: string, activeTimezones: Set<string>): boolean {
  // Direct match
  if (activeTimezones.has(subscriberTz)) return true;

  // Check if subscriber's current hour matches any of the active timezone hours
  const subscriberHour = getCurrentHourInTimezone(subscriberTz);
  if (subscriberHour === -1) return false;

  for (const tz of activeTimezones) {
    if (getCurrentHourInTimezone(tz) === subscriberHour) return true;
  }
  return false;
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

  // Filter by timezone if targetLocalHour is set
  let toSend = subscribers;
  let skipped = 0;

  if (options?.targetLocalHour !== undefined) {
    const activeTimezones = getTimezonesAtHour(options.targetLocalHour);

    toSend = subscribers.filter(s => matchesTimezoneSet(s.timezone, activeTimezones));
    skipped = subscribers.length - toSend.length;

    if (toSend.length === 0) {
      return { sent: 0, failed: 0, skipped };
    }
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
