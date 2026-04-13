// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Newspaper,
  Shield,
  Banknote,
  FileText,
  BarChart3,
  Activity,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  db,
  players,
  clubs,
  newsArticles,
  playerSeasonStats,
  competitionSeasons,
  competitions,
  seasons,
} from '@/lib/db';
import { eq, ilike, or, desc, sql, and } from 'drizzle-orm';
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

function getRatingColor(rating: number): string {
  if (rating >= 7.5) return 'text-emerald-400';
  if (rating >= 7.0) return 'text-green-400';
  if (rating >= 6.5) return 'text-yellow-400';
  if (rating >= 6.0) return 'text-orange-400';
  return 'text-red-400';
}

function getRatingDotColor(rating: number): string {
  if (rating >= 7.0) return 'bg-emerald-400';
  if (rating >= 6.5) return 'bg-yellow-400';
  return 'bg-red-400';
}

function StatCard({
  label,
  value,
  subValue,
  accent = false,
  warn = false,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p
        className={`text-xl font-bold ${
          warn ? 'text-yellow-400' : accent ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      {subValue && <p className="text-[10px] text-zinc-500 mt-0.5">{subValue}</p>}
    </div>
  );
}

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
  const fullName = `${player.firstName} ${player.lastName}`;
  const posStyle = POSITION_COLORS[player.position] || POSITION_COLORS.MID;

  // Fetch season stats with competition, club, and season info
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
      seasonName: seasons.name,
      seasonYear: seasons.year,
    })
    .from(playerSeasonStats)
    .innerJoin(competitionSeasons, eq(playerSeasonStats.competitionSeasonId, competitionSeasons.id))
    .innerJoin(competitions, eq(competitionSeasons.competitionId, competitions.id))
    .innerJoin(seasons, eq(competitionSeasons.seasonId, seasons.id))
    .leftJoin(clubs, eq(playerSeasonStats.clubId, clubs.id))
    .where(eq(playerSeasonStats.playerId, player.id))
    .orderBy(desc(seasons.year));

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

  // Aggregate totals across all competitions for the current season (most recent)
  const currentSeasonYear = seasonStats.length > 0 ? seasonStats[0].seasonYear : null;
  const currentSeasonStats = currentSeasonYear
    ? seasonStats.filter((s) => s.seasonYear === currentSeasonYear)
    : [];

  // Compute aggregated stats for the primary stats dashboard
  const agg = {
    appearances: currentSeasonStats.reduce((sum, s) => sum + (s.appearances ?? 0), 0),
    minutesPlayed: currentSeasonStats.reduce((sum, s) => sum + (s.minutesPlayed ?? 0), 0),
    goals: currentSeasonStats.reduce((sum, s) => sum + (s.goals ?? 0), 0),
    assists: currentSeasonStats.reduce((sum, s) => sum + (s.assists ?? 0), 0),
    yellowCards: currentSeasonStats.reduce((sum, s) => sum + (s.yellowCards ?? 0), 0),
    redCards: currentSeasonStats.reduce((sum, s) => sum + (s.redCards ?? 0), 0),
    cleanSheets: currentSeasonStats.reduce((sum, s) => sum + (s.cleanSheets ?? 0), 0),
    penaltiesScored: currentSeasonStats.reduce((sum, s) => sum + (s.penaltiesScored ?? 0), 0),
    penaltiesMissed: currentSeasonStats.reduce((sum, s) => sum + (s.penaltiesMissed ?? 0), 0),
    shotsOnTarget: currentSeasonStats.reduce((sum, s) => sum + (s.shotsOnTarget ?? 0), 0),
    tackles: currentSeasonStats.reduce((sum, s) => sum + (s.tackles ?? 0), 0),
    interceptions: currentSeasonStats.reduce((sum, s) => sum + (s.interceptions ?? 0), 0),
    saves: currentSeasonStats.reduce((sum, s) => sum + (s.saves ?? 0), 0),
    passAccuracy: (() => {
      const vals = currentSeasonStats.filter((s) => s.passAccuracy).map((s) => Number(s.passAccuracy));
      return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    })(),
    averageRating: (() => {
      const vals = currentSeasonStats.filter((s) => s.averageRating).map((s) => Number(s.averageRating));
      return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
    })(),
  };

  // Ratings from all competitions for form indicator
  const ratingsForForm = currentSeasonStats
    .filter((s) => s.averageRating)
    .map((s) => Number(s.averageRating))
    .slice(0, 5);

  // Career history: group by season, aggregate across competitions
  const careerSeasons = new Map<
    number,
    { seasonName: string; clubName: string; clubSlug: string | null; apps: number; goals: number; assists: number; rating: number | null; ratingCount: number; ratingSum: number }
  >();
  for (const s of seasonStats) {
    const year = s.seasonYear;
    const existing = careerSeasons.get(year);
    if (existing) {
      existing.apps += s.appearances ?? 0;
      existing.goals += s.goals ?? 0;
      existing.assists += s.assists ?? 0;
      if (s.averageRating) {
        existing.ratingSum += Number(s.averageRating);
        existing.ratingCount += 1;
      }
    } else {
      careerSeasons.set(year, {
        seasonName: s.seasonName || `${year}/${(year + 1).toString().slice(-2)}`,
        clubName: s.clubName || 'Unknown',
        clubSlug: s.clubSlug,
        apps: s.appearances ?? 0,
        goals: s.goals ?? 0,
        assists: s.assists ?? 0,
        rating: s.averageRating ? Number(s.averageRating) : null,
        ratingCount: s.averageRating ? 1 : 0,
        ratingSum: s.averageRating ? Number(s.averageRating) : 0,
      });
    }
  }
  const careerHistory = Array.from(careerSeasons.values()).map((c) => ({
    ...c,
    rating: c.ratingCount > 0 ? c.ratingSum / c.ratingCount : null,
  }));

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* ===== HERO SECTION ===== */}
      <div
        className="relative"
        style={{
          background:
            player.position === 'GK'
              ? 'linear-gradient(135deg, rgba(234,179,8,0.2) 0%, rgba(234,179,8,0.05) 50%, transparent 100%)'
              : player.position === 'DEF'
              ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.05) 50%, transparent 100%)'
              : player.position === 'MID'
              ? 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.05) 50%, transparent 100%)'
              : 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.05) 50%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 pb-8 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/players"
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Players
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Player photo */}
            <div className="relative flex-shrink-0">
              <div
                className={`flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center rounded-2xl bg-zinc-900/80 backdrop-blur-sm border-2 overflow-hidden shadow-2xl ${posStyle.bg}`}
              >
                {player.headshotUrl ? (
                  <img
                    src={player.headshotUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className={`h-16 w-16 ${posStyle.accent}`} />
                )}
              </div>
              {/* Rating badge */}
              {agg.averageRating && (
                <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border-2 border-yellow-400/60 shadow-lg">
                  <span
                    className={`text-lg font-bold ${getRatingColor(Number(agg.averageRating))}`}
                  >
                    {agg.averageRating}
                  </span>
                </div>
              )}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{name}</h1>
              {name !== fullName && (
                <p className="text-sm text-zinc-500 mt-0.5">{fullName}</p>
              )}

              <div className="flex items-center gap-3 text-sm text-zinc-400 mt-2 flex-wrap">
                <span
                  className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${posStyle.bg} ${posStyle.accent}`}
                >
                  {posStyle.label}
                  {player.detailedPosition ? ` (${player.detailedPosition})` : ''}
                </span>
                {player.shirtNumber && (
                  <span className="text-zinc-300 font-medium">#{player.shirtNumber}</span>
                )}
                {player.nationality && (
                  <span className="flex items-center gap-1.5">
                    <img
                      src={`https://flagcdn.com/16x12/${countryToCode(player.nationality)}.png`}
                      alt={player.nationality}
                      className="h-3 w-4 object-cover rounded-sm"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {player.nationality}
                  </span>
                )}
                {age !== null && <span>{age} years old</span>}
              </div>

              {/* Quick info row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap text-sm">
                {player.currentClub && (
                  <Link
                    href={`/teams/${player.currentClub.slug}`}
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {player.currentClub.logoUrl && (
                      <img
                        src={player.currentClub.logoUrl}
                        alt=""
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    <span className="font-medium">{player.currentClub.name}</span>
                  </Link>
                )}
                {player.height && (
                  <span className="text-zinc-400">{player.height} cm</span>
                )}
                {player.weight && (
                  <span className="text-zinc-400">{player.weight} kg</span>
                )}
                {player.preferredFoot && (
                  <span className="text-zinc-400 capitalize">{player.preferredFoot} foot</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-12">
        {/* Info cards row */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {player.currentClub && (
            <Link
              href={`/teams/${player.currentClub.slug}`}
              className="group rounded-lg bg-zinc-800/60 border border-zinc-700/40 px-4 py-3 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-3.5 w-3.5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Club
                </span>
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Market Value
                </span>
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Contract Until
                </span>
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
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                  Preferred Foot
                </span>
              </div>
              <p className="text-sm font-semibold text-white capitalize">
                {player.preferredFoot}
              </p>
            </div>
          )}
        </div>

        {/* ===== SEASON STATS DASHBOARD ===== */}
        {currentSeasonStats.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">
                  Season Stats{' '}
                  <span className="text-sm font-normal text-zinc-500">
                    {currentSeasonStats[0]?.seasonName || `${currentSeasonYear}/${((currentSeasonYear || 0) + 1).toString().slice(-2)}`}
                  </span>
                </h2>
              </div>

              {/* Form indicator */}
              {ratingsForForm.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Form
                  </span>
                  <div className="flex items-center gap-1.5">
                    {ratingsForForm.map((r, i) => (
                      <div
                        key={i}
                        className={`h-3 w-3 rounded-full ${getRatingDotColor(r)} shadow-sm`}
                        title={`${r.toFixed(1)} rating`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <StatCard label="Appearances" value={agg.appearances} subValue={`${agg.minutesPlayed.toLocaleString()} mins`} />
              <StatCard label="Goals" value={agg.goals} accent={agg.goals > 0} />
              <StatCard label="Assists" value={agg.assists} accent={agg.assists > 0} />
              <StatCard label="Shots on Target" value={agg.shotsOnTarget} />
              {agg.passAccuracy && (
                <StatCard label="Pass Accuracy" value={`${agg.passAccuracy}%`} accent={Number(agg.passAccuracy) >= 80} />
              )}
              <StatCard label="Tackles" value={agg.tackles} />
              <StatCard label="Interceptions" value={agg.interceptions} />
              {(player.position === 'GK' || player.position === 'DEF') && (
                <StatCard label="Clean Sheets" value={agg.cleanSheets} accent={agg.cleanSheets > 0} />
              )}
              {player.position === 'GK' && (
                <StatCard label="Saves" value={agg.saves} accent={agg.saves > 0} />
              )}
              <StatCard
                label="Yellow Cards"
                value={agg.yellowCards}
                warn={agg.yellowCards > 0}
              />
              <StatCard
                label="Red Cards"
                value={agg.redCards}
                warn={agg.redCards > 0}
              />
              {(agg.penaltiesScored > 0 || agg.penaltiesMissed > 0) && (
                <StatCard
                  label="Penalties"
                  value={agg.penaltiesScored}
                  subValue={`${agg.penaltiesMissed} missed`}
                  accent={agg.penaltiesScored > 0}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <BarChart3 className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Season statistics are being synced. Check back soon.</p>
          </div>
        )}

        {/* ===== PER-COMPETITION BREAKDOWN ===== */}
        {currentSeasonStats.length > 1 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">By Competition</h2>
            </div>
            <div className="space-y-3">
              {currentSeasonStats.map((stat, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 p-4"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {stat.clubLogoUrl && (
                      <img src={stat.clubLogoUrl} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <p className="text-sm font-medium text-yellow-400">
                      {stat.competitionName}
                    </p>
                    {stat.clubName && (
                      <Link
                        href={`/teams/${stat.clubSlug}`}
                        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        {stat.clubName}
                      </Link>
                    )}
                    {stat.averageRating && (
                      <span
                        className={`ml-auto text-sm font-bold ${getRatingColor(Number(stat.averageRating))}`}
                      >
                        {Number(stat.averageRating).toFixed(1)}
                      </span>
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
                      <p className="text-lg font-semibold text-zinc-300">
                        {(stat.minutesPlayed ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Tackles</p>
                      <p className="text-lg font-semibold text-zinc-300">{stat.tackles ?? 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">YC</p>
                      <p
                        className={`text-lg font-semibold ${(stat.yellowCards ?? 0) > 0 ? 'text-yellow-400' : 'text-zinc-500'}`}
                      >
                        {stat.yellowCards ?? 0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">RC</p>
                      <p
                        className={`text-lg font-semibold ${(stat.redCards ?? 0) > 0 ? 'text-red-400' : 'text-zinc-500'}`}
                      >
                        {stat.redCards ?? 0}
                      </p>
                    </div>
                    {(player.position === 'GK' || player.position === 'DEF') && (
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">CS</p>
                        <p className="text-lg font-semibold text-zinc-300">
                          {stat.cleanSheets ?? 0}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== CAREER HISTORY TABLE ===== */}
        {careerHistory.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Career History</h2>
            </div>
            <div className="overflow-x-auto rounded-lg border border-zinc-700/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-800/80 border-b border-zinc-700/40">
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Season
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Team
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Apps
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Goals
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Assists
                    </th>
                    <th className="px-4 py-3 text-center text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {careerHistory.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-zinc-700/20 hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-zinc-300 font-medium whitespace-nowrap">
                        {row.seasonName}
                      </td>
                      <td className="px-4 py-3">
                        {row.clubSlug ? (
                          <Link
                            href={`/teams/${row.clubSlug}`}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            {row.clubName}
                          </Link>
                        ) : (
                          <span className="text-zinc-400">{row.clubName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-semibold">
                        {row.apps}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-semibold">
                        {row.goals}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-semibold">
                        {row.assists}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.rating ? (
                          <span
                            className={`font-bold ${getRatingColor(row.rating)}`}
                          >
                            {row.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== RELATED NEWS ===== */}
        {relatedNews.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="h-4 w-4 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">Related News</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="group rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden hover:border-yellow-500/30 transition-colors"
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

/** Map common nationality names to ISO 3166-1 alpha-2 country codes for flag icons */
function countryToCode(nationality: string): string {
  const map: Record<string, string> = {
    'Afghanistan': 'af', 'Albania': 'al', 'Algeria': 'dz', 'Argentina': 'ar', 'Armenia': 'am',
    'Australia': 'au', 'Austria': 'at', 'Azerbaijan': 'az', 'Belgium': 'be', 'Bolivia': 'bo',
    'Bosnia and Herzegovina': 'ba', 'Brazil': 'br', 'Bulgaria': 'bg', 'Burkina Faso': 'bf',
    'Cameroon': 'cm', 'Canada': 'ca', 'Cape Verde': 'cv', 'Chile': 'cl', 'China': 'cn',
    'Colombia': 'co', 'Comoros': 'km', 'Congo': 'cg', 'Congo DR': 'cd', 'Costa Rica': 'cr',
    'Croatia': 'hr', 'Cuba': 'cu', 'Curacao': 'cw', 'Czech Republic': 'cz', 'Czechia': 'cz',
    'Denmark': 'dk', 'DR Congo': 'cd', 'Ecuador': 'ec', 'Egypt': 'eg', 'El Salvador': 'sv',
    'England': 'gb-eng', 'Equatorial Guinea': 'gq', 'Estonia': 'ee', 'Ethiopia': 'et',
    'Finland': 'fi', 'France': 'fr', 'Gabon': 'ga', 'Gambia': 'gm', 'Georgia': 'ge',
    'Germany': 'de', 'Ghana': 'gh', 'Greece': 'gr', 'Grenada': 'gd', 'Guatemala': 'gt',
    'Guinea': 'gn', 'Guinea-Bissau': 'gw', 'Haiti': 'ht', 'Honduras': 'hn', 'Hungary': 'hu',
    'Iceland': 'is', 'India': 'in', 'Indonesia': 'id', 'Iran': 'ir', 'Iraq': 'iq',
    'Ireland': 'ie', 'Israel': 'il', 'Italy': 'it', 'Ivory Coast': 'ci', 'Cote D\'Ivoire': 'ci',
    'Jamaica': 'jm', 'Japan': 'jp', 'Jordan': 'jo', 'Kazakhstan': 'kz', 'Kenya': 'ke',
    'Korea Republic': 'kr', 'South Korea': 'kr', 'Kosovo': 'xk', 'Kuwait': 'kw',
    'Latvia': 'lv', 'Lebanon': 'lb', 'Libya': 'ly', 'Lithuania': 'lt', 'Luxembourg': 'lu',
    'Madagascar': 'mg', 'Malawi': 'mw', 'Mali': 'ml', 'Malta': 'mt', 'Martinique': 'mq',
    'Mauritania': 'mr', 'Mexico': 'mx', 'Moldova': 'md', 'Montenegro': 'me', 'Morocco': 'ma',
    'Mozambique': 'mz', 'Namibia': 'na', 'Netherlands': 'nl', 'New Zealand': 'nz',
    'Nicaragua': 'ni', 'Niger': 'ne', 'Nigeria': 'ng', 'North Macedonia': 'mk', 'Norway': 'no',
    'Oman': 'om', 'Pakistan': 'pk', 'Palestine': 'ps', 'Panama': 'pa', 'Paraguay': 'py',
    'Peru': 'pe', 'Philippines': 'ph', 'Poland': 'pl', 'Portugal': 'pt', 'Puerto Rico': 'pr',
    'Qatar': 'qa', 'Republic of Ireland': 'ie', 'Romania': 'ro', 'Russia': 'ru', 'Rwanda': 'rw',
    'Saudi Arabia': 'sa', 'Scotland': 'gb-sct', 'Senegal': 'sn', 'Serbia': 'rs',
    'Sierra Leone': 'sl', 'Slovakia': 'sk', 'Slovenia': 'si', 'Somalia': 'so',
    'South Africa': 'za', 'Spain': 'es', 'Sri Lanka': 'lk', 'Sudan': 'sd', 'Suriname': 'sr',
    'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy', 'Tanzania': 'tz', 'Thailand': 'th',
    'Togo': 'tg', 'Trinidad and Tobago': 'tt', 'Tunisia': 'tn', 'Turkey': 'tr', 'Turkiye': 'tr',
    'Uganda': 'ug', 'Ukraine': 'ua', 'United Arab Emirates': 'ae', 'United States': 'us',
    'USA': 'us', 'Uruguay': 'uy', 'Uzbekistan': 'uz', 'Venezuela': 've', 'Vietnam': 'vn',
    'Wales': 'gb-wls', 'Yemen': 'ye', 'Zambia': 'zm', 'Zimbabwe': 'zw',
  };
  return map[nationality] || nationality.toLowerCase().slice(0, 2);
}
