import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertCircle, MessageCircle, Clock, RefreshCw } from 'lucide-react';
import { getTodayRoundup, getTodayArticlesByCategory } from '@/lib/api/daily-roundup';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Daily Football News Roundup',
  description: 'AI-generated summary of today\'s football news, organized by credibility: verified facts, unverified reports, and rumours.',
};

interface RoundupSectionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  borderColor: string;
  summary: string | null;
  articleCount: number;
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    sourceName: string | null;
  }>;
}

function RoundupSection({ title, icon, iconColor, borderColor, summary, articleCount, articles }: RoundupSectionProps) {
  if (articleCount === 0) {
    return (
      <div className={`rounded-lg border ${borderColor} bg-zinc-900/50 p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={iconColor}>{icon}</div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <span className="text-sm text-zinc-500">({articleCount} stories)</span>
        </div>
        <p className="text-zinc-500 italic">No stories in this category today.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${borderColor} bg-zinc-900/50 p-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={iconColor}>{icon}</div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <span className="text-sm text-zinc-500">({articleCount} stories)</span>
      </div>

      {summary ? (
        <p className="text-zinc-300 leading-relaxed mb-6">{summary}</p>
      ) : (
        <p className="text-zinc-500 italic mb-6">Summary being generated...</p>
      )}

      {articles.length > 0 && (
        <div className="border-t border-zinc-800 pt-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Top Stories</h3>
          <ul className="space-y-2">
            {articles.slice(0, 5).map((article) => (
              <li key={article.id}>
                <Link
                  href={`/news/${article.slug}`}
                  className="flex items-start gap-2 text-sm text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="text-zinc-600 mt-1">•</span>
                  <span>
                    {article.title}
                    {article.sourceName && (
                      <span className="text-zinc-500 ml-2">({article.sourceName})</span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default async function DailyRoundupPage() {
  const [roundup, articles] = await Promise.all([
    getTodayRoundup(),
    getTodayArticlesByCategory(),
  ]);

  const totalArticles = articles.verified.length + articles.unverified.length + articles.rumour.length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/news"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All News
            </Link>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-white">Daily News Roundup</h1>
          <p className="mt-2 text-zinc-400">
            AI-generated summary of today's F1 news
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            <span>•</span>
            <span>{totalArticles} stories today</span>
            {roundup?.lastUpdatedAt && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Updated {formatDistanceToNow(new Date(roundup.lastUpdatedAt), { addSuffix: true })}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roundup Sections */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Verified Section */}
        <RoundupSection
          title="Verified News"
          icon={<CheckCircle className="h-6 w-6" />}
          iconColor="text-green-500"
          borderColor="border-green-500/20"
          summary={roundup?.verifiedSummary || null}
          articleCount={articles.verified.length}
          articles={articles.verified.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            sourceName: a.sourceName,
          }))}
        />

        {/* Unverified Section */}
        <RoundupSection
          title="Unverified Reports"
          icon={<AlertCircle className="h-6 w-6" />}
          iconColor="text-yellow-500"
          borderColor="border-yellow-500/20"
          summary={roundup?.unverifiedSummary || null}
          articleCount={articles.unverified.length}
          articles={articles.unverified.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            sourceName: a.sourceName,
          }))}
        />

        {/* Rumour Section */}
        <RoundupSection
          title="Rumours & Speculation"
          icon={<MessageCircle className="h-6 w-6" />}
          iconColor="text-purple-500"
          borderColor="border-purple-500/20"
          summary={roundup?.rumourSummary || null}
          articleCount={articles.rumour.length}
          articles={articles.rumour.map(a => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            sourceName: a.sourceName,
          }))}
        />

        {/* No articles notice */}
        {totalArticles === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500">No articles have been published today yet.</p>
            <p className="text-zinc-600 text-sm mt-2">Check back later for the daily roundup.</p>
          </div>
        )}

        {/* Footer note */}
        <div className="text-center text-sm text-zinc-600 pt-4">
          <p>
            This roundup is automatically updated every 3 hours.{' '}
            <Link href="/news" className="text-zinc-400 hover:text-white underline">
              View all news articles
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
