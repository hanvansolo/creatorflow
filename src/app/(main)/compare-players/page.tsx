import { Metadata } from 'next';
import Image from 'next/image';
import { getPlayerStats, ApiPlayer } from '@/lib/api/football-api';
import RadarChart from '@/components/players/RadarChart';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Compare Football Players - Side by Side Stats & Radar Charts',
  description:
    'Compare football players side by side with radar charts and detailed statistics. Goals, assists, passes, tackles, and more.',
};

interface ComparePlayersPageProps {
  searchParams: Promise<{ p1?: string; p2?: string; season?: string }>;
}

/** Safely sum a stat across all stat entries, treating null as 0. */
function sumStat(stats: ApiPlayer['statistics'], getter: (s: ApiPlayer['statistics'][0]) => number | null): number {
  return stats.reduce((acc, s) => acc + (getter(s) ?? 0), 0);
}

/** Total minutes played across all competitions */
function totalMinutes(stats: ApiPlayer['statistics']): number {
  return sumStat(stats, (s) => s.games.minutes);
}

/** Per-90-minute rate */
function per90(total: number, minutes: number): number {
  if (minutes === 0) return 0;
  return (total / minutes) * 90;
}

/** Compute radar values (0-100 scale) for a player */
function computeRadarValues(stats: ApiPlayer['statistics']): number[] {
  const mins = totalMinutes(stats);
  const goals = sumStat(stats, (s) => s.goals.total);
  const assists = sumStat(stats, (s) => s.goals.assists);
  const shotsTotal = sumStat(stats, (s) => s.shots.total);
  const shotsOn = sumStat(stats, (s) => s.shots.on);
  const passAccuracy = (() => {
    // Average pass accuracy weighted by appearances
    let totalAcc = 0;
    let totalApps = 0;
    for (const s of stats) {
      const apps = s.games.appearences ?? 0;
      const acc = s.passes.accuracy ?? 0;
      totalAcc += acc * apps;
      totalApps += apps;
    }
    return totalApps > 0 ? totalAcc / totalApps : 0;
  })();
  const tackles = sumStat(stats, (s) => s.tackles.total);
  const shotAccuracy = shotsTotal > 0 ? (shotsOn / shotsTotal) * 100 : 0;

  // We don't have dribble stats on ApiPlayer season stats, so derive from what's available.
  // The API doesn't return dribbles in the /players endpoint season stats.
  // We'll use key passes per 90 as a creativity proxy instead.
  // Actually, let's stick with the 6 requested axes and approximate dribble success as 50 (neutral) if unavailable.

  // Normalize to 0-100 scale with reasonable maximums for top-level football:
  // Goals per 90: max ~1.2 (elite striker)
  // Assists per 90: max ~0.6
  // Shot accuracy: already 0-100
  // Pass accuracy: already 0-100
  // Tackles per 90: max ~4.0
  // Dribble success: not available in season stats, we'll use rating as a proxy (0-10 -> 0-100)

  const goalsPer90 = per90(goals, mins);
  const assistsPer90 = per90(assists, mins);
  const tacklesPer90 = per90(tackles, mins);

  // Average rating across competitions
  const avgRating = (() => {
    let total = 0;
    let count = 0;
    for (const s of stats) {
      if (s.games.rating) {
        total += parseFloat(s.games.rating);
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  })();

  return [
    Math.min((goalsPer90 / 1.0) * 100, 100),       // Goals/90
    Math.min((assistsPer90 / 0.5) * 100, 100),      // Assists/90
    Math.min(shotAccuracy, 100),                      // Shot accuracy %
    Math.min(passAccuracy, 100),                      // Pass accuracy %
    Math.min((tacklesPer90 / 4.0) * 100, 100),      // Tackles/90
    Math.min((avgRating / 10) * 100, 100),           // Rating (proxy for dribble success)
  ];
}

/** Build comparison table rows */
function buildComparisonRows(p1: ApiPlayer, p2: ApiPlayer) {
  const s1 = p1.statistics;
  const s2 = p2.statistics;
  const m1 = totalMinutes(s1);
  const m2 = totalMinutes(s2);

  const rows: { label: string; v1: string; v2: string; raw1: number; raw2: number }[] = [
    {
      label: 'Appearances',
      v1: String(sumStat(s1, (s) => s.games.appearences)),
      v2: String(sumStat(s2, (s) => s.games.appearences)),
      raw1: sumStat(s1, (s) => s.games.appearences),
      raw2: sumStat(s2, (s) => s.games.appearences),
    },
    {
      label: 'Minutes Played',
      v1: m1.toLocaleString(),
      v2: m2.toLocaleString(),
      raw1: m1,
      raw2: m2,
    },
    {
      label: 'Goals',
      v1: String(sumStat(s1, (s) => s.goals.total)),
      v2: String(sumStat(s2, (s) => s.goals.total)),
      raw1: sumStat(s1, (s) => s.goals.total),
      raw2: sumStat(s2, (s) => s.goals.total),
    },
    {
      label: 'Assists',
      v1: String(sumStat(s1, (s) => s.goals.assists)),
      v2: String(sumStat(s2, (s) => s.goals.assists)),
      raw1: sumStat(s1, (s) => s.goals.assists),
      raw2: sumStat(s2, (s) => s.goals.assists),
    },
    {
      label: 'Goals per 90',
      v1: per90(sumStat(s1, (s) => s.goals.total), m1).toFixed(2),
      v2: per90(sumStat(s2, (s) => s.goals.total), m2).toFixed(2),
      raw1: per90(sumStat(s1, (s) => s.goals.total), m1),
      raw2: per90(sumStat(s2, (s) => s.goals.total), m2),
    },
    {
      label: 'Assists per 90',
      v1: per90(sumStat(s1, (s) => s.goals.assists), m1).toFixed(2),
      v2: per90(sumStat(s2, (s) => s.goals.assists), m2).toFixed(2),
      raw1: per90(sumStat(s1, (s) => s.goals.assists), m1),
      raw2: per90(sumStat(s2, (s) => s.goals.assists), m2),
    },
    {
      label: 'Shots (Total)',
      v1: String(sumStat(s1, (s) => s.shots.total)),
      v2: String(sumStat(s2, (s) => s.shots.total)),
      raw1: sumStat(s1, (s) => s.shots.total),
      raw2: sumStat(s2, (s) => s.shots.total),
    },
    {
      label: 'Shots on Target',
      v1: String(sumStat(s1, (s) => s.shots.on)),
      v2: String(sumStat(s2, (s) => s.shots.on)),
      raw1: sumStat(s1, (s) => s.shots.on),
      raw2: sumStat(s2, (s) => s.shots.on),
    },
    {
      label: 'Pass Accuracy %',
      v1: (() => {
        let totalAcc = 0, totalApps = 0;
        for (const s of s1) { const a = s.games.appearences ?? 0; totalAcc += (s.passes.accuracy ?? 0) * a; totalApps += a; }
        return totalApps > 0 ? (totalAcc / totalApps).toFixed(1) + '%' : '0%';
      })(),
      v2: (() => {
        let totalAcc = 0, totalApps = 0;
        for (const s of s2) { const a = s.games.appearences ?? 0; totalAcc += (s.passes.accuracy ?? 0) * a; totalApps += a; }
        return totalApps > 0 ? (totalAcc / totalApps).toFixed(1) + '%' : '0%';
      })(),
      raw1: (() => {
        let totalAcc = 0, totalApps = 0;
        for (const s of s1) { const a = s.games.appearences ?? 0; totalAcc += (s.passes.accuracy ?? 0) * a; totalApps += a; }
        return totalApps > 0 ? totalAcc / totalApps : 0;
      })(),
      raw2: (() => {
        let totalAcc = 0, totalApps = 0;
        for (const s of s2) { const a = s.games.appearences ?? 0; totalAcc += (s.passes.accuracy ?? 0) * a; totalApps += a; }
        return totalApps > 0 ? totalAcc / totalApps : 0;
      })(),
    },
    {
      label: 'Key Passes',
      v1: String(sumStat(s1, (s) => s.passes.key)),
      v2: String(sumStat(s2, (s) => s.passes.key)),
      raw1: sumStat(s1, (s) => s.passes.key),
      raw2: sumStat(s2, (s) => s.passes.key),
    },
    {
      label: 'Tackles',
      v1: String(sumStat(s1, (s) => s.tackles.total)),
      v2: String(sumStat(s2, (s) => s.tackles.total)),
      raw1: sumStat(s1, (s) => s.tackles.total),
      raw2: sumStat(s2, (s) => s.tackles.total),
    },
    {
      label: 'Interceptions',
      v1: String(sumStat(s1, (s) => s.tackles.interceptions)),
      v2: String(sumStat(s2, (s) => s.tackles.interceptions)),
      raw1: sumStat(s1, (s) => s.tackles.interceptions),
      raw2: sumStat(s2, (s) => s.tackles.interceptions),
    },
    {
      label: 'Yellow Cards',
      v1: String(sumStat(s1, (s) => s.cards.yellow)),
      v2: String(sumStat(s2, (s) => s.cards.yellow)),
      raw1: sumStat(s1, (s) => s.cards.yellow),
      raw2: sumStat(s2, (s) => s.cards.yellow),
    },
    {
      label: 'Red Cards',
      v1: String(sumStat(s1, (s) => s.cards.red)),
      v2: String(sumStat(s2, (s) => s.cards.red)),
      raw1: sumStat(s1, (s) => s.cards.red),
      raw2: sumStat(s2, (s) => s.cards.red),
    },
    {
      label: 'Penalties Scored',
      v1: String(sumStat(s1, (s) => s.penalty.scored)),
      v2: String(sumStat(s2, (s) => s.penalty.scored)),
      raw1: sumStat(s1, (s) => s.penalty.scored),
      raw2: sumStat(s2, (s) => s.penalty.scored),
    },
  ];

  // Add average rating
  const avgRating = (stats: ApiPlayer['statistics']) => {
    let total = 0, count = 0;
    for (const s of stats) {
      if (s.games.rating) { total += parseFloat(s.games.rating); count++; }
    }
    return count > 0 ? total / count : 0;
  };

  rows.unshift({
    label: 'Average Rating',
    v1: avgRating(s1).toFixed(2),
    v2: avgRating(s2).toFixed(2),
    raw1: avgRating(s1),
    raw2: avgRating(s2),
  });

  return rows;
}

export default async function ComparePlayersPage({ searchParams }: ComparePlayersPageProps) {
  const params = await searchParams;
  const p1Id = params.p1 ? parseInt(params.p1, 10) : null;
  const p2Id = params.p2 ? parseInt(params.p2, 10) : null;
  const season = params.season ? parseInt(params.season, 10) : 2025;

  // No players selected
  if (!p1Id || !p2Id) {
    return (
      <div className="min-h-screen bg-zinc-900 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Compare Players</h1>
          <p className="text-zinc-400 text-lg mb-8">
            Search for players to compare
          </p>
          <div className="bg-zinc-800 rounded-xl p-8 border border-zinc-700">
            <p className="text-zinc-500 mb-4">
              Add two player IDs as query parameters to compare them side by side.
            </p>
            <code className="text-yellow-400 bg-zinc-900 px-4 py-2 rounded text-sm">
              /compare-players?p1=PLAYER_ID&p2=PLAYER_ID&season=2025
            </code>
          </div>
        </div>
      </div>
    );
  }

  // Fetch both players in parallel
  const [res1, res2] = await Promise.all([
    getPlayerStats(p1Id, season),
    getPlayerStats(p2Id, season),
  ]);

  const player1 = res1.response?.[0] ?? null;
  const player2 = res2.response?.[0] ?? null;

  if (!player1 || !player2) {
    return (
      <div className="min-h-screen bg-zinc-900 px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Compare Players</h1>
          <p className="text-red-400">
            {!player1 && `Player 1 (ID: ${p1Id}) not found for season ${season}. `}
            {!player2 && `Player 2 (ID: ${p2Id}) not found for season ${season}.`}
          </p>
        </div>
      </div>
    );
  }

  const radarLabels = ['Goals/90', 'Assists/90', 'Shot Acc %', 'Pass Acc %', 'Tackles/90', 'Rating'];
  const p1Radar = computeRadarValues(player1.statistics);
  const p2Radar = computeRadarValues(player2.statistics);
  const comparisonRows = buildComparisonRows(player1, player2);

  // Primary team info (first stat entry)
  const p1Team = player1.statistics[0]?.team;
  const p2Team = player2.statistics[0]?.team;
  const p1Position = player1.statistics[0]?.games.position ?? 'Unknown';
  const p2Position = player2.statistics[0]?.games.position ?? 'Unknown';
  const p1Rating = player1.statistics.reduce((acc, s) => {
    if (s.games.rating) return acc + parseFloat(s.games.rating);
    return acc;
  }, 0);
  const p1RatingCount = player1.statistics.filter((s) => s.games.rating).length;
  const p2Rating = player2.statistics.reduce((acc, s) => {
    if (s.games.rating) return acc + parseFloat(s.games.rating);
    return acc;
  }, 0);
  const p2RatingCount = player2.statistics.filter((s) => s.games.rating).length;

  return (
    <div className="min-h-screen bg-zinc-900 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          Player Comparison
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          {season}/{season + 1} Season
        </p>

        {/* Player Header Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Player 1 */}
          <div className="bg-zinc-800 rounded-xl p-6 border border-yellow-400/30 flex flex-col items-center text-center">
            <div className="relative w-28 h-28 mb-4">
              <Image
                src={player1.player.photo}
                alt={player1.player.name}
                fill
                className="rounded-full object-cover border-2 border-yellow-400"
                unoptimized
              />
            </div>
            <h2 className="text-xl font-bold text-white">{player1.player.name}</h2>
            <p className="text-zinc-400 text-sm mt-1">
              {player1.player.age} yrs &middot; {player1.player.nationality}
            </p>
            {p1Team && (
              <div className="flex items-center gap-2 mt-3">
                <Image
                  src={p1Team.logo}
                  alt={p1Team.name}
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
                <span className="text-zinc-300 text-sm">{p1Team.name}</span>
              </div>
            )}
            <span className="mt-2 text-xs text-zinc-500 uppercase tracking-wide">{p1Position}</span>
            <div className="mt-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-4 py-2">
              <span className="text-yellow-400 font-bold text-lg">
                {p1RatingCount > 0 ? (p1Rating / p1RatingCount).toFixed(2) : 'N/A'}
              </span>
              <span className="text-zinc-500 text-xs ml-1">avg rating</span>
            </div>
          </div>

          {/* Player 2 */}
          <div className="bg-zinc-800 rounded-xl p-6 border border-blue-400/30 flex flex-col items-center text-center">
            <div className="relative w-28 h-28 mb-4">
              <Image
                src={player2.player.photo}
                alt={player2.player.name}
                fill
                className="rounded-full object-cover border-2 border-blue-400"
                unoptimized
              />
            </div>
            <h2 className="text-xl font-bold text-white">{player2.player.name}</h2>
            <p className="text-zinc-400 text-sm mt-1">
              {player2.player.age} yrs &middot; {player2.player.nationality}
            </p>
            {p2Team && (
              <div className="flex items-center gap-2 mt-3">
                <Image
                  src={p2Team.logo}
                  alt={p2Team.name}
                  width={24}
                  height={24}
                  className="object-contain"
                  unoptimized
                />
                <span className="text-zinc-300 text-sm">{p2Team.name}</span>
              </div>
            )}
            <span className="mt-2 text-xs text-zinc-500 uppercase tracking-wide">{p2Position}</span>
            <div className="mt-3 bg-blue-400/10 border border-blue-400/30 rounded-lg px-4 py-2">
              <span className="text-blue-400 font-bold text-lg">
                {p2RatingCount > 0 ? (p2Rating / p2RatingCount).toFixed(2) : 'N/A'}
              </span>
              <span className="text-zinc-500 text-xs ml-1">avg rating</span>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 mb-10">
          <h3 className="text-lg font-semibold text-white text-center mb-4">Performance Radar</h3>
          <RadarChart
            labels={radarLabels}
            player1Values={p1Radar}
            player2Values={p2Radar}
            player1Name={player1.player.name}
            player2Name={player2.player.name}
            player1Color="#facc15"
            player2Color="#60a5fa"
          />
        </div>

        {/* Comparison Table */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
          <h3 className="text-lg font-semibold text-white text-center py-4 border-b border-zinc-700">
            Detailed Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-3 px-4 text-right text-yellow-400 font-medium w-1/3">
                    {player1.player.lastname || player1.player.name.split(' ').pop()}
                  </th>
                  <th className="py-3 px-4 text-center text-zinc-400 font-medium w-1/3">Stat</th>
                  <th className="py-3 px-4 text-left text-blue-400 font-medium w-1/3">
                    {player2.player.lastname || player2.player.name.split(' ').pop()}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => {
                  const isCards = row.label.includes('Card');
                  // For cards, lower is better
                  const p1Wins = isCards ? row.raw1 < row.raw2 : row.raw1 > row.raw2;
                  const p2Wins = isCards ? row.raw2 < row.raw1 : row.raw2 > row.raw1;
                  const tie = row.raw1 === row.raw2;

                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-zinc-700/50 ${i % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-800/50'}`}
                    >
                      <td
                        className={`py-3 px-4 text-right font-medium ${
                          !tie && p1Wins ? 'text-yellow-400' : 'text-zinc-300'
                        }`}
                      >
                        {row.v1}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-500 text-xs uppercase tracking-wider">
                        {row.label}
                      </td>
                      <td
                        className={`py-3 px-4 text-left font-medium ${
                          !tie && p2Wins ? 'text-blue-400' : 'text-zinc-300'
                        }`}
                      >
                        {row.v2}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
