import { notFound } from 'next/navigation';
import { Settings, Shield, Code, Mail, Users } from 'lucide-react';
import { db, cronSettings, aggregationJobs, siteSettings, contactMessages, newsletterSubscribers } from '@/lib/db';
import { desc } from 'drizzle-orm';
import { getSession } from '@/lib/auth';
import { CronJobCard } from '@/components/admin/CronJobCard';
import { JobLogTable } from '@/components/admin/JobLogTable';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { ScriptsEditor } from '@/components/admin/ScriptsEditor';
import { ContactMessages } from '@/components/admin/ContactMessages';
import { NewsletterSubscribers } from '@/components/admin/NewsletterSubscribers';

export const dynamic = 'force-dynamic';

const DEFAULT_JOBS = [
  { jobName: 'aggregate',         intervalMs: 15 * 60 * 1000,      label: 'News Aggregation',    description: 'Fetches RSS feeds from football news sources' },
  { jobName: 'youtube',           intervalMs: 60 * 60 * 1000,      label: 'YouTube Videos',      description: 'Fetches latest videos from football YouTube channels' },
  { jobName: 'weather',           intervalMs: 30 * 60 * 1000,      label: 'Weather Updates',     description: 'Fetches forecasts for upcoming races' },
  { jobName: 'data-sync',         intervalMs: 6 * 60 * 60 * 1000,  label: 'Data Sync',           description: 'Syncs standings and results from Jolpica-F1' },
  { jobName: 'ai-analysis',       intervalMs: 6 * 60 * 60 * 1000,  label: 'AI Analysis',         description: 'Generates AI insights and race debriefs' },
  { jobName: 'predictions',       intervalMs: 12 * 60 * 60 * 1000, label: 'Predictions',         description: 'Generates race predictions for upcoming races' },
  { jobName: 'roundup',           intervalMs: 60 * 60 * 1000,      label: 'Daily Roundup',       description: 'Generates AI summaries for the daily news roundup' },
  { jobName: 'match-regulations', intervalMs: 60 * 60 * 1000,      label: 'Regulation Matching', description: 'Links articles to relevant football regulations' },
  { jobName: 'detect-incidents',  intervalMs: 5 * 60 * 1000,       label: 'Incident Detection',  description: 'Detects race incidents from news during live sessions' },
  { jobName: 'generate-preview',  intervalMs: 24 * 60 * 60 * 1000, label: 'Race Previews',       description: 'Generates AI race previews for upcoming races' },
  { jobName: 'update-previews',   intervalMs: 30 * 60 * 1000,      label: 'Update Previews',     description: 'Updates race previews after sessions (runs during race weekends)' },
  { jobName: 'generate-images',   intervalMs: 60 * 60 * 1000,      label: 'Generate Images',     description: 'Creates AI images for articles missing images' },
  { jobName: 'regenerate-images', intervalMs: 0,                   label: 'Regenerate Images',   description: 'Regenerates existing AI images with improved prompts' },
  { jobName: 'fix-images',        intervalMs: 0,                   label: 'Fix Images',          description: 'Repairs broken image refs (runs after aggregation)' },
  { jobName: 'reseed-calendar',   intervalMs: 0,                   label: 'Reseed Calendar',     description: 'Reseeds 2026 race calendar, sessions and circuits from latest data' },
  { jobName: 'email-daily',       intervalMs: 24 * 60 * 60 * 1000, label: 'Daily Email',         description: 'Sends daily news roundup to newsletter subscribers (8am)' },
  { jobName: 'email-weekly',      intervalMs: 7 * 24 * 60 * 60 * 1000, label: 'Weekly Email',    description: 'Sends weekly roundup to newsletter subscribers (Sunday)' },
  { jobName: 'email-race-reminder', intervalMs: 0,                 label: 'Race Reminder Email', description: 'Sends race weekend reminder 3 days before race' },
  { jobName: 'email-race-roundup', intervalMs: 0,                  label: 'Race Roundup Email',  description: 'Sends race results roundup after a race' },
];

const SCRIPT_KEYS = [
  { key: 'script_head', description: 'Scripts injected into <head> (analytics, meta tags)' },
  { key: 'script_body_start', description: 'Scripts injected at the start of <body> (GTM noscript)' },
  { key: 'script_body_end', description: 'Scripts injected before </body> (chat widgets, tracking)' },
];

export default async function AdminPage() {
  const session = await getSession();

  // Only allow admin and superadmin roles
  if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
    notFound();
  }

  // Fetch all data in parallel
  const [settings, recentLogs, scriptSettings, messages, subscribers] = await Promise.all([
    db.select().from(cronSettings),
    db.select().from(aggregationJobs).orderBy(desc(aggregationJobs.startedAt)).limit(20),
    db.select().from(siteSettings),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(50),
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.subscribedAt)).limit(200),
  ]);

  const settingsMap = new Map(settings.map(s => [s.jobName, s]));
  const scriptsMap = new Map(scriptSettings.map(s => [s.key, s]));

  const jobs = DEFAULT_JOBS.map(def => {
    const dbSetting = settingsMap.get(def.jobName);
    return {
      ...def,
      intervalMs: dbSetting?.intervalMs ?? def.intervalMs,
      enabled: dbSetting?.enabled ?? true,
      lastRunAt: dbSetting?.lastRunAt?.toISOString() ?? null,
      lastStatus: dbSetting?.lastStatus ?? null,
      lastResult: (dbSetting?.lastResult as Record<string, unknown>) ?? null,
    };
  });

  // Merge script keys with DB settings
  const scripts = SCRIPT_KEYS.map(def => {
    const dbSetting = scriptsMap.get(def.key);
    return {
      key: def.key,
      description: def.description,
      value: dbSetting?.value || '',
      updatedAt: dbSetting?.updatedAt?.toISOString() ?? null,
    };
  });

  const tabs = [
    { id: 'jobs', label: 'Scheduled Jobs', icon: <Settings className="h-4 w-4" /> },
    { id: 'messages', label: `Messages${messages.filter(m => m.status === 'unread').length ? ` (${messages.filter(m => m.status === 'unread').length})` : ''}`, icon: <Mail className="h-4 w-4" /> },
    { id: 'subscribers', label: `Subscribers (${subscribers.filter(s => s.status === 'active').length})`, icon: <Users className="h-4 w-4" /> },
    { id: 'scripts', label: 'Scripts & Analytics', icon: <Code className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-500" />
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
              <p className="mt-1 text-zinc-400">
                Signed in as {session?.email} ({session?.role})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminTabs tabs={tabs}>
          {{
            jobs: (
              <div className="space-y-8">
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Settings className="h-5 w-5" />
                    Scheduled Jobs
                  </h2>
                  <p className="mb-4 text-sm text-zinc-400">
                    Changes take effect on the next server restart. Use &quot;Run Now&quot; to trigger immediately.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {jobs.map((job) => (
                      <CronJobCard
                        key={job.jobName}
                        jobName={job.jobName}
                        label={job.label}
                        intervalMs={job.intervalMs}
                        enabled={job.enabled}
                        lastRunAt={job.lastRunAt}
                        lastStatus={job.lastStatus}
                        lastResult={job.lastResult}
                        secret="__jwt__"
                      />
                    ))}
                  </div>
                </div>

                <JobLogTable logs={recentLogs} />
              </div>
            ),
            messages: (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <Mail className="h-5 w-5" />
                  Contact Messages
                </h2>
                <ContactMessages
                  messages={messages.map(m => ({
                    ...m,
                    createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
                  }))}
                  secret="__jwt__"
                />
              </div>
            ),
            subscribers: (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <Users className="h-5 w-5" />
                  Newsletter Subscribers
                </h2>
                <NewsletterSubscribers
                  subscribers={subscribers.map(s => ({
                    ...s,
                    subscribedAt: s.subscribedAt?.toISOString() ?? new Date().toISOString(),
                  }))}
                />
              </div>
            ),
            scripts: (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                  <Code className="h-5 w-5" />
                  Scripts & Analytics
                </h2>
                <p className="mb-6 text-sm text-zinc-400">
                  Add Google Analytics, Meta Pixel, chat widgets, and other third-party scripts to your site.
                </p>
                <ScriptsEditor scripts={scripts} secret="__jwt__" />
              </div>
            ),
          }}
        </AdminTabs>
      </div>
    </div>
  );
}
