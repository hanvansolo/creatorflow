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
        width={20}
        height={20}
        className="h-5 w-5 object-contain"
        unoptimized
      />
    );
  }
  return (
    <div
      className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
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
    <div className="relative bg-zinc-950 border-b border-zinc-800">
      <div className="flex items-center">
        {/* Live/Today label */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 shrink-0 border-r border-zinc-800 bg-zinc-900/50">
          {hasLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400">Live</span>
            </>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400">Scores</span>
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
                href={`/matches/${match.id}`}
                className={`flex items-center gap-2 px-3 py-2 shrink-0 border-r border-zinc-800/50 transition-colors hover:bg-zinc-800/60 min-w-[120px] ${
                  isLive ? 'bg-zinc-900/80' : ''
                }`}
              >
                {/* Match card */}
                <div className="flex flex-col items-center gap-1 w-full">
                  {/* Competition tag */}
                  {match.competition_short && (
                    <span className="text-[8px] font-medium text-zinc-500 uppercase tracking-wider truncate max-w-full">
                      {match.competition_short}
                    </span>
                  )}

                  {/* Teams + Score row */}
                  <div className="flex items-center gap-1.5 w-full justify-center">
                    {/* Home */}
                    <TeamLogo logo={match.home_logo} name={match.home_name} color={match.home_color} />

                    {/* Score / Time */}
                    <div className="flex flex-col items-center min-w-[36px]">
                      {isLive || isFinished ? (
                        <span className={`text-sm font-bold tabular-nums ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                          {match.home_score ?? 0} - {match.away_score ?? 0}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400 font-medium">
                          {formatTime(match.kickoff)}
                        </span>
                      )}
                    </div>

                    {/* Away */}
                    <TeamLogo logo={match.away_logo} name={match.away_name} color={match.away_color} />
                  </div>

                  {/* Status */}
                  <div className="h-3 flex items-center">
                    {isLive && (
                      <span className="text-[9px] font-bold text-emerald-400">
                        {match.status === 'halftime' ? 'HT' : `${match.minute}'`}
                      </span>
                    )}
                    {isFinished && (
                      <span className="text-[9px] font-medium text-zinc-500">FT</span>
                    )}
                    {!isLive && !isFinished && (
                      <span className="text-[9px] font-medium text-zinc-600">
                        {match.status === 'scheduled' ? '' : match.status?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </TickerScroller>

        {/* View all */}
        <Link
          href={hasLive ? '/live' : '/fixtures'}
          className="flex items-center px-3 sm:px-4 py-2.5 shrink-0 border-l border-zinc-800 text-[10px] sm:text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800/40 transition-colors whitespace-nowrap"
        >
          {hasLive ? 'All →' : 'All →'}
        </Link>
      </div>
    </div>
  );
}
