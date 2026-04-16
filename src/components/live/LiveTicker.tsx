// @ts-nocheck
import Link from 'next/link';
import Image from 'next/image';
import { db, matches, clubs, competitionSeasons, competitions } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { TickerScroller } from './TickerScroller';

interface TickerMatch {
  id: string;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_name: string;
  home_code: string | null;
  home_color: string | null;
  home_logo: string | null;
  away_name: string;
  away_code: string | null;
  away_color: string | null;
  away_logo: string | null;
  kickoff: string;
  competition_short: string | null;
}

async function getTickerMatches(): Promise<TickerMatch[]> {
  try {
    // First try live matches
    const liveRows = await db.execute(sql`
      SELECT
        m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff,
        hc.name as home_name, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
        ac.name as away_name, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
        comp.short_name as competition_short
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY comp.name, m.kickoff
      LIMIT 30
    `);

    // Also get today's finished + scheduled to fill the bar
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

    const todayRows = await db.execute(sql`
      SELECT
        m.id, m.status, m.minute, m.home_score, m.away_score, m.kickoff,
        hc.name as home_name, hc.code as home_code, hc.primary_color as home_color, hc.logo_url as home_logo,
        ac.name as away_name, ac.code as away_code, ac.primary_color as away_color, ac.logo_url as away_logo,
        comp.short_name as competition_short
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.kickoff >= ${startOfDay} AND m.kickoff <= ${endOfDay}
      AND m.status NOT IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY m.kickoff
      LIMIT 30
    `);

    // Combine: live first, then today's others
    const liveIds = new Set((liveRows as any[]).map(r => r.id));
    const combined = [
      ...(liveRows as any[]),
      ...(todayRows as any[]).filter(r => !liveIds.has(r.id)),
    ];

    return combined;
  } catch {
    return [];
  }
}

function formatTime(kickoff: string): string {
  return new Date(kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function TeamLogo({ logo, name, color }: { logo: string | null; name: string; color: string | null }) {
  if (logo) {
    return (
      <Image
        src={logo}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 object-contain"
        unoptimized
      />
    );
  }
  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
      style={{ backgroundColor: color || '#52525b' }}
    >
      {name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

export async function LiveTicker() {
  const tickerMatches = await getTickerMatches();

  if (tickerMatches.length === 0) return null;

  const hasLive = tickerMatches.some(m => ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status));

  return (
    <div className="relative">
      <div className="flex items-center">
        {/* Live/Today label */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 shrink-0">
          {hasLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-red-400">Live</span>
            </>
          ) : (
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">Scores</span>
          )}
        </div>

        {/* Draggable scrollable ticker */}
        <TickerScroller>
          {tickerMatches.map((match) => {
            const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(match.status);
            const isFinished = match.status === 'finished';

            return (
              <Link
                key={match.id}
                href={`/matches/${(match as any).slug || match.id}`}
                className="shrink-0 mx-1 my-1.5"
              >
                <div className={`flex flex-col items-center justify-center rounded-xl px-5 py-3 w-[170px] h-[100px] transition-colors hover:bg-zinc-700/50 ${
                  isLive ? 'bg-zinc-800/40 ring-1 ring-emerald-500/30' : 'bg-zinc-800/30'
                }`}>
                  {/* Competition tag */}
                  {match.competition_short && (
                    <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider truncate max-w-[155px]">
                      {match.competition_short}
                    </span>
                  )}

                  {/* Teams + Score */}
                  <div className="flex items-center gap-2.5 mt-1">
                    <TeamLogo logo={match.home_logo} name={match.home_name} color={match.home_color} />

                    <div className="flex flex-col items-center min-w-[44px]">
                      {isLive || isFinished ? (
                        <span className={`text-lg font-bold tabular-nums ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                          {match.home_score ?? 0} - {match.away_score ?? 0}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-400 font-medium">
                          {formatTime(match.kickoff)}
                        </span>
                      )}
                    </div>

                    <TeamLogo logo={match.away_logo} name={match.away_name} color={match.away_color} />
                  </div>

                  {/* Status */}
                  {isLive && (
                    <span className="text-xs font-bold text-emerald-400 mt-1">
                      {match.status === 'halftime' ? 'HT' : `${match.minute}'`}
                    </span>
                  )}
                  {isFinished && (
                    <span className="text-xs font-medium text-zinc-500 mt-1">FT</span>
                  )}
                  {!isLive && !isFinished && (
                    <span className="text-xs font-medium text-zinc-600 mt-1">&nbsp;</span>
                  )}
                </div>
              </Link>
            );
          })}
        </TickerScroller>

        {/* View all */}
        <Link
          href={hasLive ? '/live' : '/fixtures'}
          className="flex items-center px-4 sm:px-5 py-3 shrink-0 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
        >
          All →
        </Link>
      </div>
    </div>
  );
}
