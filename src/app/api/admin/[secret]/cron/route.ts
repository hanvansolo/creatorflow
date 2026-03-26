// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { db, cronSettings, aggregationJobs } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { runCronJob } from '@/lib/cron/run-job';

export const dynamic = 'force-dynamic';

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

const DEFAULT_JOBS = [
  { jobName: 'aggregate',   intervalMs: 15 * 60 * 1000,      label: 'News Aggregation' },
  { jobName: 'weather',     intervalMs: 30 * 60 * 1000,      label: 'Weather Updates' },
  { jobName: 'data-sync',   intervalMs: 6 * 60 * 60 * 1000,  label: 'Data Sync' },
  { jobName: 'ai-analysis', intervalMs: 6 * 60 * 60 * 1000,  label: 'AI Analysis' },
  { jobName: 'predictions', intervalMs: 12 * 60 * 60 * 1000, label: 'Predictions' },
  { jobName: 'roundup',           intervalMs: 60 * 60 * 1000,      label: 'Daily Roundup' },
  { jobName: 'match-regulations', intervalMs: 60 * 60 * 1000,      label: 'Regulation Matching' },
  { jobName: 'detect-incidents',  intervalMs: 5 * 60 * 1000,       label: 'Incident Detection' },
  { jobName: 'generate-preview',  intervalMs: 24 * 60 * 60 * 1000, label: 'Race Preview Generation' },
  { jobName: 'update-previews',   intervalMs: 30 * 60 * 1000,      label: 'Update Previews' },
  { jobName: 'generate-images',   intervalMs: 60 * 60 * 1000,      label: 'Generate Images' },
  { jobName: 'regenerate-images', intervalMs: 0,                   label: 'Regenerate Images' },
  { jobName: 'fix-images',        intervalMs: 0,                   label: 'Fix Images' },
  { jobName: 'reseed-calendar',   intervalMs: 0,                   label: 'Reseed Calendar' },
  { jobName: 'email-daily',       intervalMs: 24 * 60 * 60 * 1000, label: 'Daily Email' },
  { jobName: 'email-weekly',      intervalMs: 7 * 24 * 60 * 60 * 1000, label: 'Weekly Email' },
  { jobName: 'email-race-reminder', intervalMs: 0,                 label: 'Race Reminder Email' },
  { jobName: 'email-race-roundup', intervalMs: 0,                  label: 'Race Roundup Email' },
];

function validateSecret(secret: string): boolean {
  return secret === CRON_KEY;
}

/**
 * GET /api/admin/{secret}/cron
 * Returns all cron job settings + recent logs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (!validateSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get current settings from DB
  const settings = await db.select().from(cronSettings);
  const settingsMap = new Map(settings.map(s => [s.jobName, s]));

  // Merge defaults with DB settings
  const jobs = DEFAULT_JOBS.map(def => {
    const dbSetting = settingsMap.get(def.jobName);
    return {
      jobName: def.jobName,
      label: def.label,
      intervalMs: dbSetting?.intervalMs ?? def.intervalMs,
      enabled: dbSetting?.enabled ?? true,
      lastRunAt: dbSetting?.lastRunAt ?? null,
      lastStatus: dbSetting?.lastStatus ?? null,
      lastResult: dbSetting?.lastResult ?? null,
      updatedAt: dbSetting?.updatedAt ?? null,
    };
  });

  // Get recent aggregation job logs
  const recentLogs = await db
    .select()
    .from(aggregationJobs)
    .orderBy(desc(aggregationJobs.startedAt))
    .limit(20);

  return NextResponse.json({ jobs, recentLogs });
}

/**
 * PUT /api/admin/{secret}/cron
 * Update cron job settings (interval, enabled)
 * Body: { jobName: string, intervalMs?: number, enabled?: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (!validateSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { jobName, intervalMs, enabled } = body;

  if (!jobName || !DEFAULT_JOBS.some(j => j.jobName === jobName)) {
    return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
  }

  const defaultJob = DEFAULT_JOBS.find(j => j.jobName === jobName)!;

  // Upsert setting
  await db
    .insert(cronSettings)
    .values({
      jobName,
      intervalMs: intervalMs ?? defaultJob.intervalMs,
      enabled: enabled ?? true,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: cronSettings.jobName,
      set: {
        ...(intervalMs !== undefined && { intervalMs }),
        ...(enabled !== undefined && { enabled }),
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ success: true, jobName, intervalMs, enabled });
}

/**
 * POST /api/admin/{secret}/cron
 * Trigger a cron job immediately
 * Body: { jobName: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> }
) {
  const { secret } = await params;
  if (!validateSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { jobName } = body;

  if (!jobName || !DEFAULT_JOBS.some(j => j.jobName === jobName)) {
    return NextResponse.json({ error: 'Invalid job name' }, { status: 400 });
  }

  try {
    const { success, result } = await runCronJob(jobName);

    // Update last run info in DB
    await db
      .insert(cronSettings)
      .values({
        jobName,
        intervalMs: DEFAULT_JOBS.find(j => j.jobName === jobName)!.intervalMs,
        enabled: true,
        lastRunAt: new Date(),
        lastStatus: success ? 'success' : 'error',
        lastResult: result as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: cronSettings.jobName,
        set: {
          lastRunAt: new Date(),
          lastStatus: success ? 'success' : 'error',
          lastResult: result as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ success, jobName, result });
  } catch (error) {
    return NextResponse.json({
      success: false,
      jobName,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
