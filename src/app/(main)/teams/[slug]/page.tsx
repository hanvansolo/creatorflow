// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Shield, MapPin, Calendar, Users, ArrowRight, Newspaper, GitCompareArrows, Info } from 'lucide-react';
import { db, clubs, venues, newsArticles } from '@/lib/db';
import { eq, ilike, or, desc, sql } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { TeamWidget } from '@/components/widgets/ApiFootballWidget';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) return { title: 'Club Not Found | Footy Feed' };

  return createPageMetadata(
    `${club.name} - Squad, Stats & Fixtures`,
    `${club.name} squad, player stats, fixtures, results, and league standings. ${club.stadium ? `Home ground: ${club.stadium}.` : ''}`,
    `/teams/${slug}`,
    [club.name, club.shortName || '', 'squad', 'fixtures', 'stats'].filter(Boolean)
  );
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) notFound();

  // Fetch venue info for stadium capacity
  let venue = null;
  if (club.stadium) {
    venue = await db.query.venues.findFirst({
      where: ilike(venues.name, `%${club.stadium}%`),
    });
  }

  // Fetch related news articles mentioning the club
  const relatedNews = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .where(
      or(
        ilike(newsArticles.title, `%${club.name}%`),
        club.shortName ? ilike(newsArticles.title, `%${club.shortName}%`) : undefined,
        sql`${club.name} = ANY(${newsArticles.tags})`
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(3);

  const primaryColor = club.primaryColor || '#059669';
  const secondaryColor = club.secondaryColor || '#10b981';

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Full-width gradient banner */}
      <div
        className="relative h-36 sm:h-44"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}30 0%, ${secondaryColor}15 50%, transparent 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
      </div>

      <div className="mx-auto max-w-5xl px-4 -mt-20 relative z-10 sm:px-6 lg:px-8 pb-12">
        {/* Back link */}
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Teams
        </Link>

        {/* Club header */}
        <div className="mb-6 flex items-center gap-5">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-zinc-900/80 backdrop-blur-sm shadow-xl"
            style={{ borderColor: primaryColor }}
          >
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="h-14 w-14 object-contain" />
            ) : (
              <Shield className="h-10 w-10" style={{ color: primaryColor }} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{club.name}</h1>
            {club.manager && (
              <p className="text-sm text-zinc-400 mt-0.5">Manager: {club.manager}</p>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {club.founded && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Founded</span>
              </div>
              <p className="text-lg font-semibold text-white">{club.founded}</p>
            </div>
          )}
          {club.stadium && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Stadium</span>
              </div>
              <p className="text-sm font-semibold text-white truncate">{club.stadium}</p>
            </div>
          )}
          {venue?.capacity && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Capacity</span>
              </div>
              <p className="text-lg font-semibold text-white">{venue.capacity.toLocaleString()}</p>
            </div>
          )}
          {club.country && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Country</span>
              </div>
              <p className="text-sm font-semibold text-white">{club.country}</p>
            </div>
          )}
        </div>

        {/* Widget description */}
        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700/30 px-4 py-2.5">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-zinc-400">
            The widget below shows squad, fixtures, and statistics
          </p>
        </div>

        {/* API-Football Team Widget */}
        {club.apiFootballId ? (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50">
            <TeamWidget teamId={club.apiFootballId} />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Team data is being synced. Check back soon.</p>
          </div>
        )}

        {/* Related news */}
        {relatedNews.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Latest News</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden hover:border-emerald-500/30 transition-colors"
                >
                  {article.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">
                      {article.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1.5">
                      {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Compare link */}
        <div className="mt-6">
          <Link
            href={`/compare?team1=${slug}`}
            className="group inline-flex items-center gap-2 rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-5 py-3 hover:border-emerald-500/30 transition-colors"
          >
            <GitCompareArrows className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">
              Compare with another team
            </span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
