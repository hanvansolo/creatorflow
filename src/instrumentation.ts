/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the server starts. Sets up recurring timers
 * that call the existing cron API endpoints at scheduled intervals.
 * Reads interval/enabled settings from the cron_settings DB table.
 */

const DEFAULT_JOBS = [
  { name: 'aggregate',         path: '/api/cron/{secret}/aggregate',         intervalMs: 15 * 60 * 1000,      delayMs: 30_000   },
  { name: 'youtube',           path: '/api/cron/{secret}/youtube',           intervalMs: 60 * 60 * 1000,      delayMs: 60_000   },
  { name: 'weather',           path: '/api/cron/{secret}/weather',           intervalMs: 30 * 60 * 1000,      delayMs: 90_000   },
  { name: 'data-sync',         path: '/api/cron/{secret}/data-sync',         intervalMs: 6 * 60 * 60 * 1000,  delayMs: 120_000  },
  { name: 'ai-analysis',       path: '/api/cron/{secret}/ai-analysis',       intervalMs: 6 * 60 * 60 * 1000,  delayMs: 150_000  },
  { name: 'predictions',       path: '/api/cron/{secret}/predictions',       intervalMs: 12 * 60 * 60 * 1000, delayMs: 180_000  },
  { name: 'roundup',           path: '/api/cron/{secret}/roundup',           intervalMs: 60 * 60 * 1000,      delayMs: 240_000  },
  { name: 'match-regulations', path: '/api/cron/{secret}/match-regulations', intervalMs: 60 * 60 * 1000,      delayMs: 270_000  },
  { name: 'detect-incidents',  path: '/api/cron/{secret}/detect-incidents',  intervalMs: 5 * 60 * 1000,       delayMs: 300_000  },
  { name: 'generate-preview',  path: '/api/cron/{secret}/generate-preview',  intervalMs: 24 * 60 * 60 * 1000, delayMs: 330_000  },
  { name: 'update-previews',   path: '/api/cron/{secret}/update-previews',   intervalMs: 30 * 60 * 1000,      delayMs: 360_000  },
  { name: 'generate-images',   path: '/api/cron/{secret}/generate-images',   intervalMs: 60 * 60 * 1000,      delayMs: 390_000  },
  { name: 'email-daily',       path: '/api/cron/{secret}/email-daily',       intervalMs: 60 * 60 * 1000,      delayMs: 420_000  }, // Hourly - sends to subscribers where it's 8am
  { name: 'email-weekly',      path: '/api/cron/{secret}/email-weekly',      intervalMs: 60 * 60 * 1000,      delayMs: 450_000  }, // Hourly on Sundays - sends where it's 10am
  { name: 'email-race-reminder', path: '/api/cron/{secret}/email-race-reminder', intervalMs: 12 * 60 * 60 * 1000, delayMs: 480_000  }, // Every 12h - checks for races in 3 days
  { name: 'email-race-roundup', path: '/api/cron/{secret}/email-race-roundup', intervalMs: 12 * 60 * 60 * 1000, delayMs: 510_000  }, // Every 12h - checks for races in last 2 days
  { name: 'live-sync',          path: '/api/cron/{secret}/live-sync',          intervalMs: 2 * 60 * 1000,       delayMs: 60_000   }, // Every 2 min - live match scores, events, stats + AI analysis
  { name: 'fix-images',         path: '/api/cron/{secret}/fix-images',         intervalMs: 30 * 60 * 1000,      delayMs: 540_000  }, // Every 30 min - re-scrape missing article images
];

async function loadSettingsFromDB(): Promise<Map<string, { intervalMs: number; enabled: boolean }>> {
  const settings = new Map<string, { intervalMs: number; enabled: boolean }>();
  try {
    // Dynamic import to avoid issues during build
    const { db, cronSettings } = await import('@/lib/db');
    const rows = await db.select().from(cronSettings);
    for (const row of rows) {
      settings.set(row.jobName, {
        intervalMs: row.intervalMs,
        enabled: row.enabled ?? true,
      });
    }
  } catch (error) {
    console.log('[CRON] Could not load settings from DB, using defaults:', error instanceof Error ? error.message : error);
  }
  return settings;
}

async function updateJobStatus(jobName: string, status: string, result: unknown) {
  try {
    const { db, cronSettings } = await import('@/lib/db');
    const defaultJob = DEFAULT_JOBS.find(j => j.name === jobName);
    await db
      .insert(cronSettings)
      .values({
        jobName,
        intervalMs: defaultJob?.intervalMs ?? 900_000,
        enabled: true,
        lastRunAt: new Date(),
        lastStatus: status,
        lastResult: result as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: cronSettings.jobName,
        set: {
          lastRunAt: new Date(),
          lastStatus: status,
          lastResult: result as Record<string, unknown>,
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error(`[CRON] Failed to update job status for ${jobName}:`, error instanceof Error ? error.message : error);
  }
}

async function runCronJob(name: string, url: string) {
  const timestamp = new Date().toISOString();
  console.log(`[CRON ${timestamp}] Running: ${name}`);

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log(`[CRON ${timestamp}] ${name} completed:`, JSON.stringify(data));
      await updateJobStatus(name, 'success', data);
    } else {
      console.error(`[CRON ${timestamp}] ${name} failed (${response.status}):`, JSON.stringify(data));
      await updateJobStatus(name, 'error', data);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[CRON ${timestamp}] ${name} error:`, msg);
    await updateJobStatus(name, 'error', { error: msg });
  }
}

export async function register() {
  // Only run on the Node.js server runtime (not edge, not during build)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Escape hatch to disable all crons
  if (process.env.DISABLE_CRON === 'true') {
    console.log('[CRON] Scheduler disabled via DISABLE_CRON=true');
    return;
  }

  const secret = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';
  // Use internal port for self-fetch — Railway uses PORT env var (usually 8080)
  const port = process.env.PORT || '3000';
  const baseUrl = `http://localhost:${port}`;

  // Load settings from DB (intervals + enabled/disabled)
  const dbSettings = await loadSettingsFromDB();

  const activeJobs = DEFAULT_JOBS.filter(job => {
    const setting = dbSettings.get(job.name);
    return setting ? setting.enabled : true;
  });

  console.log(`[CRON] Initializing scheduler (${activeJobs.length}/${DEFAULT_JOBS.length} jobs active)`);
  console.log(`[CRON] Base URL: ${baseUrl}`);

  for (const job of activeJobs) {
    const url = `${baseUrl}${job.path.replace('{secret}', secret)}`;
    const setting = dbSettings.get(job.name);
    const intervalMs = setting?.intervalMs ?? job.intervalMs;
    const intervalMinutes = Math.round(intervalMs / 60_000);

    // Initial delayed run
    setTimeout(() => {
      runCronJob(job.name, url);

      // Then repeat at interval
      setInterval(() => runCronJob(job.name, url), intervalMs);
    }, job.delayMs);

    console.log(`[CRON]   ${job.name}: every ${intervalMinutes}m (first run in ${job.delayMs / 1000}s)`);
  }

  // Log skipped jobs
  const skippedJobs = DEFAULT_JOBS.filter(job => {
    const setting = dbSettings.get(job.name);
    return setting && !setting.enabled;
  });
  for (const job of skippedJobs) {
    console.log(`[CRON]   ${job.name}: DISABLED`);
  }

  console.log('[CRON] Scheduler initialized');
}
