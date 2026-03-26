// @ts-nocheck
import Link from 'next/link';
import { db, matches, clubs, competitionSeasons, competitions } from '@/lib/db';
import { eq, and, gte, lte, asc, inArray, sql } from 'drizzle-orm';

interface TickerMatch {
  id: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_name: string;
  home_code: string | null;
  home_color: string | null;
  away_name: string;
  away_code: string | null;
  away_color: string | null;
  kickoff: string;
  competition_short: string | null;
}

async function getTickerMatches(): Promise<TickerMatch[]> {
  try {
    // First try live matches
    const liveRows = await db.execute(sql`
      SELECT
        m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff,
        hc.name as home_name, hc.code as home_code, hc.primary_color as home_color,
        ac.name as away_name, ac.code as away_code, ac.primary_color as away_color,
        comp.short_name as competition_short
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY comp.name, m.kickoff
      LIMIT 20
    `);

    if ((liveRows as any[]).length > 0) {
      return liveRows as any[];
    }

    // No live matches — show today's fixtures
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const todayRows = await db.execute(sql`
      SELECT
        m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff,
        hc.name as home_name, hc.code as home_code, hc.primary_color as home_color,
        ac.name as away_name, ac.code as away_code, ac.primary_color as away_color,
        comp.short_name as competition_short
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.kickoff >= ${startOfDay} AND m.kickoff <= ${endOfDay}
      ORDER BY m.kickoff
      LIMIT 20
    `);

    return todayRows as any[];
  } catch {
    return [];
  }
}

function formatTime(kickoff: string): string {
  return new Date(kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export async function LiveTicker() {
  const tickerMatches = await getTickerMatches();

  if (tickerMatches.length === 0) return null;

  const hasLive = tickerMatches.some(m => ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status));

  return (
    <div className="relative bg-zinc-950 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 py-2">
          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Live</span>
              </>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Today</span>
            )}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-zinc-800 shrink-0" />

          {/* Scrollable ticker */}
          <div className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1">
              {tickerMatches.map((match) => {
                const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status);
                const isFinished = match.status === 'finished';
                const isScheduled = match.status === 'scheduled';

                return (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}`}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 shrink-0 transition-colors hover:bg-zinc-800 ${
                      isLive ? 'bg-zinc-900 border border-emerald-500/20' : 'bg-zinc-900/50'
                    }`}
                  >
                    {/* Home */}
                    <div className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: match.home_color || '#52525b' }}
                      />
                      <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">
                        {match.home_code || match.home_name?.slice(0, 3).toUpperCase()}
                      </span>
                    </div>

                    {/* Score / Time */}
                    {isLive ? (
                      <div className="flex items-center gap-1 min-w-[40px] justify-center">
                        <span className="text-[11px] font-bold text-emerald-400">
                          {match.home_score ?? 0} - {match.away_score ?? 0}
                        </span>
                      </div>
                    ) : isFinished ? (
                      <div className="flex items-center gap-1 min-w-[40px] justify-center">
                        <span className="text-[11px] font-bold text-white">
                          {match.home_score} - {match.away_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-500 min-w-[40px] text-center">
                        {formatTime(match.kickoff)}
                      </span>
                    )}

                    {/* Away */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-semibold text-zinc-300 whitespace-nowrap">
                        {match.away_code || match.away_name?.slice(0, 3).toUpperCase()}
                      </span>
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: match.away_color || '#52525b' }}
                      />
                    </div>

                    {/* Status indicator */}
                    {isLive && (
                      <span className="text-[9px] font-bold text-emerald-400 ml-0.5">
                        {match.status === 'halftime' ? 'HT' : `${match.minute}'`}
                      </span>
                    )}
                    {isFinished && (
                      <span className="text-[9px] font-medium text-zinc-600 ml-0.5">FT</span>
                    )}
                  </Link>
                );
              })}

              {/* View all link */}
              <Link
                href={hasLive ? '/live' : '/fixtures'}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 shrink-0 text-[10px] font-medium text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800 transition-colors whitespace-nowrap"
              >
                {hasLive ? 'All live →' : 'All fixtures →'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
