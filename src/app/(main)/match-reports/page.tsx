// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, FileText, Calendar } from 'lucide-react';
import { db, newsArticles, newsSources } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { AdSlot } from '@/components/ads/AdSlot';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Match Reports - Post-Match Analysis | Footy Feed',
  'Read in-depth post-match reports and analysis from the Premier League, Champions League, La Liga, Serie A, and more. Professional match reports with stats, key moments, and tactical breakdowns.',
  '/match-reports',
  ['match reports', 'post-match analysis', 'football reports', 'Premier League reports', 'Champions League reports', 'match analysis']
);

interface MatchReport {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  publishedAt: Date;
  tags: string[] | null;
}

async function getMatchReports(): Promise<MatchReport[]> {
  const reports = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
      tags: newsArticles.tags,
    })
    .from(newsArticles)
    .where(sql`'Match Report' = ANY(${newsArticles.tags})`)
    .orderBy(desc(newsArticles.publishedAt))
    .limit(50);

  return reports;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function extractCompetition(tags: string[] | null): string | null {
  if (!tags) return null;
  // Tags are: ["Match Report", "Competition Name", "Home Team", "Away Team"]
  return tags.length >= 2 ? tags[1] : null;
}

function extractTeams(tags: string[] | null): { home: string; away: string } | null {
  if (!tags || tags.length < 4) return null;
  return { home: tags[2], away: tags[3] };
}

export default async function MatchReportsPage() {
  const reports = await getMatchReports();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-emerald-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Match Reports</h1>
                <p className="mt-1 text-zinc-400">
                  In-depth post-match analysis and reports from top football competitions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-zinc-600" />
            <h2 className="mt-4 text-lg font-medium text-zinc-300">No match reports yet</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Match reports are generated automatically after games finish. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, index) => {
              const competition = extractCompetition(report.tags);
              const teams = extractTeams(report.tags);

              return (
                <Link
                  key={report.id}
                  href={`/news/${report.slug}`}
                  className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-emerald-500/50 hover:bg-zinc-900"
                >
                  {/* Image */}
                  {report.imageUrl ? (
                    <div className="relative aspect-video overflow-hidden">
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      {competition && (
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                            {competition}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      {teams ? (
                        <div className="text-center">
                          <div className="text-lg font-bold text-zinc-300">
                            {teams.home} vs {teams.away}
                          </div>
                          {competition && (
                            <div className="mt-1 text-xs text-emerald-500">{competition}</div>
                          )}
                        </div>
                      ) : (
                        <FileText className="h-10 w-10 text-zinc-700" />
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-white group-hover:text-emerald-400 line-clamp-2">
                      {report.title}
                    </h2>
                    {report.summary && (
                      <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
                        {report.summary}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(report.publishedAt)}</span>
                      <span className="rounded-full bg-emerald-600/20 px-2 py-0.5 text-emerald-400">
                        Match Report
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Ad slot */}
        <div className="mt-8">
          <AdSlot slot="match-reports-bottom" />
        </div>
      </div>
    </div>
  );
}
