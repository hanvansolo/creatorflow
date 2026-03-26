// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User, Newspaper, Shield, Banknote, FileText, BarChart3, Activity } from 'lucide-react';
import { db, players, clubs, newsArticles, playerSeasonStats, competitionSeasons, competitions } from '@/lib/db';
import { eq, ilike, or, desc, sql } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const POSITION_COLORS: Record<string, { accent: string; bg: string; label: string }> = {
  GK: { accent: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Goalkeeper' },
  DEF: { accent: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: 'Defender' },
  MID: { accent: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30', label: 'Midfielder' },
  FWD: { accent: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: 'Forward' },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) return { title: 'Player Not Found | Footy Feed' };

  const name = player.knownAs || `${player.firstName} ${player.lastName}`;

  return createPageMetadata(
    `${name} - Stats, Career & Profile`,
    `${name} player profile, season statistics, career history, and transfer info.${player.currentClub ? ` Currently at ${player.currentClub.name}.` : ''}`,
    `/players/${slug}`,
    [name, player.position, player.nationality || '', player.currentClub?.name || ''].filter(Boolean)
  );
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) notFound();

  const name = player.knownAs || `${player.firstName} ${player.lastName}`;
  const posStyle = POSITION_COLORS[player.position] || POSITION_COLORS.MID;

  // Fetch season stats with competition and club info
  const seasonStats = await db
    .select({
      appearances: playerSeasonStats.appearances,
      starts: playerSeasonStats.starts,
      minutesPlayed: playerSeasonStats.minutesPlayed,
      goals: playerSeasonStats.goals,
      assists: playerSeasonStats.assists,
      yellowCards: playerSeasonStats.yellowCards,
      redCards: playerSeasonStats.redCards,
      cleanSheets: playerSeasonStats.cleanSheets,
      penaltiesScored: playerSeasonStats.penaltiesScored,
      penaltiesMissed: playerSeasonStats.penaltiesMissed,
      passAccuracy: playerSeasonStats.passAccuracy,
      shotsOnTarget: playerSeasonStats.shotsOnTarget,
      tackles: playerSeasonStats.tackles,
      interceptions: playerSeasonStats.interceptions,
      saves: playerSeasonStats.saves,
      averageRating: playerSeasonStats.averageRating,
      competitionName: competitions.name,
      competitionShortName: competitions.shortName,
      clubName: clubs.name,
      clubSlug: clubs.slug,
      clubLogoUrl: clubs.logoUrl,
    })
    .from(playerSeasonStats)
    .innerJoin(competitionSeasons, eq(playerSeasonStats.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .leftJoin(clubs, eq(playerSeasonStats.clubId, clubs.id))
    .where(eq(playerSeasonStats.playerId, player.id));

  // Fetch related news articles mentioning the player
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
        ilike(newsArticles.title, `%${name}%`),
        player.knownAs && player.knownAs !== name
          ? ilike(newsArticles.title, `%${player.knownAs}%`)
          : undefined,
        ilike(newsArticles.title, `%${player.lastName}%`)
      )
    )
    .orderBy(desc(newsArticles.publishedAt))
    .limit(3);

  // Calculate age
  let age: number | null = null;
  if (player.dateOfBirth) {
    const dob = new Date(player.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Position-colored gradient banner */}
      <div
        className="relative h-32 sm:h-40"
        style={{
          background: player.position === 'GK'
            ? 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, transparent 100%)'
            : player.position === 'DEF'
            ? 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, transparent 100%)'
            : player.position === 'MID'
            ? 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, transparent 100%)'
            : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
      </div>

      <div className="mx-auto max-w-5xl px-4 -mt-16 relative z-10 sm:px-6 lg:px-8 pb-12">
        {/* Back link */}
        <Link
          href="/players"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Players
        </Link>

        {/* Player header */}
        <div className="mb-6 flex items-center gap-5">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur-sm border-2 overflow-hidden shadow-xl ${posStyle.bg}`}>
            {player.headshotUrl ? (
              <img src={player.headshotUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <User className={`h-10 w-10 ${posStyle.accent}`} />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{name}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1 flex-wrap">
              <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${posStyle.bg} ${posStyle.accent}`}>
                {posStyle.label}
                {player.detailedPosition ? ` (${player.detailedPosition})` : ''}
              </span>
              {player.shirtNumber && <span className="text-zinc-300 font-medium">#{player.shirtNumber}</span>}
              {player.nationality && <span>{player.nationality}</span>}
              {age !== null && <span>{age} years old</span>}
            </div>
          </div>
        </div>

        {/* Info cards row */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {player.currentClub && (
            <Link
              href={`/teams/${player.currentClub.slug}`}
              className="group rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Club</span>
              </div>
              <p className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
                {player.currentClub.name}
              </p>
              <span className="text-[10px] text-zinc-500">View team &rarr;</span>
            </Link>
          )}
          {player.marketValue && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <Banknote className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Market Value</span>
              </div>
              <p className="text-lg font-semibold text-white">
                &euro;{Number(player.marketValue).toFixed(1)}m
              </p>
            </div>
          )}
          {player.contractUntil && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Contract Until</span>
              </div>
              <p className="text-sm font-semibold text-white">
                {new Date(player.contractUntil).toLocaleDateString('en-GB', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}
          {player.preferredFoot && (
            <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Preferred Foot</span>
              </div>
              <p className="text-sm font-semibold text-white capitalize">{player.preferredFoot}</p>
            </div>
          )}
        </div>

        {/* Physical info */}
        {(player.height || player.weight) && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {player.height && (
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Height</span>
                </div>
                <p className="text-lg font-semibold text-white">{player.height} cm</p>
              </div>
            )}
            {player.weight && (
              <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Weight</span>
                </div>
                <p className="text-lg font-semibold text-white">{player.weight} kg</p>
              </div>
            )}
          </div>
        )}

        {/* Season Stats */}
        {seasonStats.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Season Statistics</h2>
            </div>
            <div className="space-y-4">
              {seasonStats.map((stat, i) => (
                <div key={i} className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {stat.clubLogoUrl && (
                      <img src={stat.clubLogoUrl} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <p className="text-sm font-medium text-emerald-400">{stat.competitionName}</p>
                    {stat.clubName && (
                      <Link href={`/teams/${stat.clubSlug}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                        {stat.clubName}
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Apps</p>
                      <p className="text-xl font-bold text-white">{stat.appearances ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Goals</p>
                      <p className="text-xl font-bold text-white">{stat.goals ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Assists</p>
                      <p className="text-xl font-bold text-white">{stat.assists ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Minutes</p>
                      <p className="text-lg font-semibold text-zinc-300">{(stat.minutesPlayed ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">YC</p>
                      <p className={`text-lg font-semibold ${(stat.yellowCards ?? 0) > 0 ? 'text-yellow-400' : 'text-zinc-500'}`}>{stat.yellowCards ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">RC</p>
                      <p className={`text-lg font-semibold ${(stat.redCards ?? 0) > 0 ? 'text-red-400' : 'text-zinc-500'}`}>{stat.redCards ?? 0}</p>
                    </div>
                    {(player.position === 'GK' || player.position === 'DEF') && (
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">CS</p>
                        <p className="text-lg font-semibold text-zinc-300">{stat.cleanSheets ?? 0}</p>
                      </div>
                    )}
                    {stat.averageRating && (
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Rating</p>
                        <p className={`text-xl font-bold ${Number(stat.averageRating) >= 7 ? 'text-emerald-400' : Number(stat.averageRating) >= 6 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {Number(stat.averageRating).toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Season statistics are being synced. Check back soon.</p>
          </div>
        )}

        {/* Related news */}
        {relatedNews.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Related News</h2>
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
      </div>
    </div>
  );
}
