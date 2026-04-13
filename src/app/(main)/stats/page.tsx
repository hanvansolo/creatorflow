// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Trophy, Target, AlertTriangle, ShieldAlert } from 'lucide-react';
import { getTopScorers, getTopAssists, getTopYellowCards, getTopRedCards } from '@/lib/api/football-api';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Statistics - Top Scorers, Assists & Cards',
  'Player leaderboards for top European football leagues. See top scorers, assists, yellow cards, and red cards for the Premier League, La Liga, Serie A, and more.',
  '/stats',
  ['football statistics', 'top scorers', 'top assists', 'yellow cards', 'red cards', 'player stats', 'leaderboards']
);

const STAT_COMPETITIONS = [
  { name: 'Premier League', leagueId: 39, season: 2025 },
  { name: 'La Liga', leagueId: 140, season: 2025 },
  { name: 'Serie A', leagueId: 135, season: 2025 },
  { name: 'Bundesliga', leagueId: 78, season: 2025 },
  { name: 'Ligue 1', leagueId: 61, season: 2025 },
  { name: 'Champions League', leagueId: 2, season: 2025 },
  { name: 'Championship', leagueId: 40, season: 2025 },
];

interface PlayerStat {
  rank: number;
  name: string;
  photo: string;
  team: string;
  value: number | null;
}

function extractPlayers(
  data: any,
  statExtractor: (stats: any) => number | null
): PlayerStat[] {
  if (!data?.response) return [];
  return data.response.slice(0, 10).map((item: any, idx: number) => ({
    rank: idx + 1,
    name: item.player?.name || 'Unknown',
    photo: item.player?.photo || '',
    team: item.statistics?.[0]?.team?.name || '',
    value: statExtractor(item.statistics?.[0]),
  }));
}

function LeaderboardCard({
  title,
  icon,
  accentColor,
  players,
  statLabel,
}: {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  players: PlayerStat[];
  statLabel: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        {icon}
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {players.length === 0 ? (
        <div className="p-6 text-center text-sm text-zinc-500">No data available</div>
      ) : (
        <div className="divide-y divide-zinc-800/50">
          {players.map((p) => (
            <div key={`${p.rank}-${p.name}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
              <span className="w-5 text-xs font-medium text-zinc-500 text-right">{p.rank}</span>
              {p.photo ? (
                <Image
                  src={p.photo}
                  alt={p.name}
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 rounded-full object-cover bg-zinc-700"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-zinc-700" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{p.name}</div>
                <div className="text-xs text-zinc-500 truncate">{p.team}</div>
              </div>
              <span className={`text-sm font-bold ${accentColor}`}>{p.value ?? 0}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: { league?: string };
}) {
  const leagueParam = searchParams.league || '39';
  const selectedLeagueId = parseInt(leagueParam, 10);
  const selectedComp = STAT_COMPETITIONS.find((c) => c.leagueId === selectedLeagueId) || STAT_COMPETITIONS[0];

  // Fetch all four leaderboards in parallel
  const [scorersRes, assistsRes, yellowRes, redRes] = await Promise.all([
    getTopScorers(selectedComp.leagueId, selectedComp.season).catch(() => null),
    getTopAssists(selectedComp.leagueId, selectedComp.season).catch(() => null),
    getTopYellowCards(selectedComp.leagueId, selectedComp.season).catch(() => null),
    getTopRedCards(selectedComp.leagueId, selectedComp.season).catch(() => null),
  ]);

  const scorers = extractPlayers(scorersRes, (s) => s?.goals?.total);
  const assists = extractPlayers(assistsRes, (s) => s?.goals?.assists);
  const yellows = extractPlayers(yellowRes, (s) => s?.cards?.yellow);
  const reds = extractPlayers(redRes, (s) => s?.cards?.red);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-br from-yellow-500/10 via-zinc-900/50 to-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Football Statistics</h1>
              <p className="mt-1 text-zinc-400">
                Player leaderboards across top European leagues
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Competition Selector + Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Competition Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {STAT_COMPETITIONS.map((comp) => {
            const isActive = comp.leagueId === selectedComp.leagueId;
            return (
              <Link
                key={comp.leagueId}
                href={`/stats?league=${comp.leagueId}`}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-yellow-400 text-zinc-900'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {comp.name}
              </Link>
            );
          })}
        </div>

        {/* 2x2 Grid of Leaderboards */}
        <div className="grid gap-6 md:grid-cols-2">
          <LeaderboardCard
            title="Top Scorers"
            icon={<Target className="h-4 w-4 text-yellow-400" />}
            accentColor="text-yellow-400"
            players={scorers}
            statLabel="Goals"
          />
          <LeaderboardCard
            title="Top Assists"
            icon={<Trophy className="h-4 w-4 text-emerald-400" />}
            accentColor="text-emerald-400"
            players={assists}
            statLabel="Assists"
          />
          <LeaderboardCard
            title="Most Yellow Cards"
            icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
            accentColor="text-amber-400"
            players={yellows}
            statLabel="Yellows"
          />
          <LeaderboardCard
            title="Most Red Cards"
            icon={<ShieldAlert className="h-4 w-4 text-red-400" />}
            accentColor="text-red-400"
            players={reds}
            statLabel="Reds"
          />
        </div>
      </div>
    </div>
  );
}
