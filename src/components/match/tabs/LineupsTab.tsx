// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { Users, UserCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type {
  MatchDetail,
  LineupData,
  SquadPlayer,
  MatchEvent,
} from '@/components/match/types';
import { PitchVisualization } from '@/components/match/PitchVisualization';

/* ---------- helpers ---------- */

const POS_ORDER: Record<string, number> = { G: 0, D: 1, M: 2, F: 3 };

function posGroup(pos: string): string {
  switch (pos?.toUpperCase()) {
    case 'G': case 'GK': case 'GOALKEEPER': return 'GK';
    case 'D': case 'DEF': case 'DEFENDER': return 'DEF';
    case 'M': case 'MID': case 'MIDFIELDER': return 'MID';
    case 'F': case 'FWD': case 'FORWARD': case 'ATTACKER': return 'FWD';
    default: return pos?.toUpperCase() ?? 'N/A';
  }
}

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'FWD'];

function squadDisplayName(p: SquadPlayer): string {
  return p.knownAs || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown';
}

/* ---------- Player Row (BBC style) ---------- */

function PlayerRow({
  number,
  name,
  pos,
  isHome,
  slug,
  events,
}: {
  number: number;
  name: string;
  pos: string;
  isHome: boolean;
  slug?: string;
  events?: MatchEvent[];
}) {
  // Find card/sub events for this player
  const yellowCard = events?.find(
    (e) => e.event_type === 'yellow card' && (e.player_known_as === name || [e.player_first_name, e.player_last_name].filter(Boolean).join(' ') === name),
  );
  const redCard = events?.find(
    (e) => (e.event_type === 'red card' || e.event_type === 'yellowred' || e.event_type === 'second yellow') &&
      (e.player_known_as === name || [e.player_first_name, e.player_last_name].filter(Boolean).join(' ') === name),
  );
  const subOff = events?.find(
    (e) => e.event_type?.toLowerCase().includes('subst') &&
      (e.player_known_as === name || [e.player_first_name, e.player_last_name].filter(Boolean).join(' ') === name),
  );

  const inner = (
    <div className="flex items-center gap-3 py-2 px-2 hover:bg-zinc-700/30 transition-colors rounded">
      {/* Shirt number circle */}
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
        isHome ? 'bg-yellow-400 text-black' : 'bg-zinc-500 text-black'
      }`}>
        {number}
      </span>
      {/* Player name */}
      <span className="flex-1 text-sm text-zinc-200">{name}</span>
      {/* Card icons */}
      {yellowCard && (
        <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
          <span className="inline-block h-3.5 w-2.5 rounded-sm bg-yellow-400" />
          <span className="text-zinc-500">{yellowCard.minute}&apos;</span>
        </span>
      )}
      {redCard && (
        <span className="flex items-center gap-0.5 text-[10px] text-red-500">
          <span className="inline-block h-3.5 w-2.5 rounded-sm bg-red-500" />
          <span className="text-zinc-500">{redCard.minute}&apos;</span>
        </span>
      )}
      {/* Sub icon */}
      {subOff && (
        <span className="flex items-center gap-1 text-[10px]">
          <span className="text-red-400">↓</span>
          <span className="text-zinc-500">{subOff.minute}&apos;</span>
          {subOff.second_player_known_as && (
            <span className="text-green-400">
              ↑ {subOff.second_player_known_as}
            </span>
          )}
        </span>
      )}
    </div>
  );

  if (slug) {
    return <Link href={`/players/${slug}`}>{inner}</Link>;
  }
  return inner;
}

/* ---------- component ---------- */

interface LineupsTabProps {
  match: MatchDetail;
  lineups: LineupData[];
  homeSquad: SquadPlayer[];
  awaySquad: SquadPlayer[];
  events?: MatchEvent[];
}

export default function LineupsTab({
  match,
  lineups,
  homeSquad,
  awaySquad,
  events = [],
}: LineupsTabProps) {
  const hasLineups = lineups.length >= 2;
  const homeLineup = lineups[0] ?? null;
  const awayLineup = lineups[1] ?? null;

  /* fallback: group squad by position */
  const groupedHome = useMemo(() => {
    const groups: Record<string, SquadPlayer[]> = {};
    homeSquad.forEach((p) => {
      const g = posGroup(p.position);
      (groups[g] ??= []).push(p);
    });
    return groups;
  }, [homeSquad]);

  const groupedAway = useMemo(() => {
    const groups: Record<string, SquadPlayer[]> = {};
    awaySquad.forEach((p) => {
      const g = posGroup(p.position);
      (groups[g] ??= []).push(p);
    });
    return groups;
  }, [awaySquad]);

  return (
    <div className="space-y-4">
      {/* Pitch visualization */}
      {hasLineups && (
        <PitchVisualization
          lineups={lineups}
          homeName={match.home_name}
          awayName={match.away_name}
        />
      )}

      {/* Manager + Formation header */}
      {hasLineups && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-yellow-400">{homeLineup.team.name}</p>
                {homeLineup.coach && (
                  <p className="text-xs text-zinc-500">Manager: {homeLineup.coach.name}</p>
                )}
              </div>
              <span className="text-sm font-bold text-zinc-300">{homeLineup.formation}</span>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-zinc-300">{awayLineup.team.name}</p>
                {awayLineup.coach && (
                  <p className="text-xs text-zinc-500">Manager: {awayLineup.coach.name}</p>
                )}
              </div>
              <span className="text-sm font-bold text-zinc-300">{awayLineup.formation}</span>
            </div>
          </div>
        </div>
      )}

      {/* Starting XI or Squad */}
      {hasLineups ? (
        <>
          {/* Starting XI */}
          <section className="rounded-lg bg-zinc-800 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
              Starting XI
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Home */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {homeLineup.team.name}
                </p>
                <div className="divide-y divide-zinc-700/50">
                  {homeLineup.startXI.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                      isHome={true}
                      events={events}
                    />
                  ))}
                </div>
              </div>

              {/* Away */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {awayLineup.team.name}
                </p>
                <div className="divide-y divide-zinc-700/50">
                  {awayLineup.startXI.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                      isHome={false}
                      events={events}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Substitutes */}
          <section className="rounded-lg bg-zinc-800 p-4">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
              Substitutes
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {homeLineup.team.name}
                </p>
                <div className="divide-y divide-zinc-700/50">
                  {homeLineup.substitutes.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                      isHome={true}
                      events={events}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {awayLineup.team.name}
                </p>
                <div className="divide-y divide-zinc-700/50">
                  {awayLineup.substitutes.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                      isHome={false}
                      events={events}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Match Officials */}
          {(homeLineup.coach || awayLineup.coach) && (
            <section className="rounded-lg bg-zinc-800 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
                Match Officials
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {homeLineup.coach && (
                  <div className="flex items-center gap-3">
                    {homeLineup.coach.photo && (
                      <Image
                        src={homeLineup.coach.photo}
                        alt={homeLineup.coach.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-zinc-200">{homeLineup.coach.name}</p>
                      <p className="text-[10px] text-zinc-500">{homeLineup.team.name} Manager</p>
                    </div>
                  </div>
                )}
                {awayLineup.coach && (
                  <div className="flex items-center gap-3">
                    {awayLineup.coach.photo && (
                      <Image
                        src={awayLineup.coach.photo}
                        alt={awayLineup.coach.name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-zinc-200">{awayLineup.coach.name}</p>
                      <p className="text-[10px] text-zinc-500">{awayLineup.team.name} Manager</p>
                    </div>
                  </div>
                )}
              </div>
              {match.referee && (
                <div className="mt-3 pt-3 border-t border-zinc-700">
                  <p className="text-xs text-zinc-500">
                    Referee: <span className="text-zinc-300">{match.referee}</span>
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        /* Fallback: Squad by position */
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Squad
          </h3>

          {homeSquad.length === 0 && awaySquad.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-zinc-500">
              <UserCircle className="h-8 w-8" />
              <p className="text-sm">Lineups not available yet</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Home squad */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {match.home_name}
                </p>
                {GROUP_ORDER.map((g) =>
                  groupedHome[g]?.length ? (
                    <div key={g} className="mb-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {g}
                      </p>
                      <div className="divide-y divide-zinc-700/50">
                        {groupedHome[g].map((p) => (
                          <Link
                            key={p.id}
                            href={`/players/${p.slug}`}
                            className="flex items-center gap-3 py-2 px-2 hover:bg-zinc-700/30 transition-colors rounded"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
                              {p.shirtNumber ?? '-'}
                            </span>
                            <span className="flex-1 truncate text-sm text-zinc-200">
                              {squadDisplayName(p)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>

              {/* Away squad */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {match.away_name}
                </p>
                {GROUP_ORDER.map((g) =>
                  groupedAway[g]?.length ? (
                    <div key={g} className="mb-3">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                        {g}
                      </p>
                      <div className="divide-y divide-zinc-700/50">
                        {groupedAway[g].map((p) => (
                          <Link
                            key={p.id}
                            href={`/players/${p.slug}`}
                            className="flex items-center gap-3 py-2 px-2 hover:bg-zinc-700/30 transition-colors rounded"
                          >
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-500 text-xs font-bold text-black">
                              {p.shirtNumber ?? '-'}
                            </span>
                            <span className="flex-1 truncate text-sm text-zinc-200">
                              {squadDisplayName(p)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
