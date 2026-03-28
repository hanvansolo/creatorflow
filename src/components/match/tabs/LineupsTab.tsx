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
} from '@/components/match/types';
import PitchVisualization from '@/components/match/PitchVisualization';

/* ---------- helpers ---------- */

const POS_ORDER: Record<string, number> = { G: 0, D: 1, M: 2, F: 3 };

function posBadgeColor(pos: string): string {
  switch (pos?.charAt(0)?.toUpperCase()) {
    case 'G':
      return 'bg-amber-600/30 text-amber-300';
    case 'D':
      return 'bg-blue-600/30 text-blue-300';
    case 'M':
      return 'bg-emerald-600/30 text-emerald-300';
    case 'F':
      return 'bg-red-600/30 text-red-300';
    default:
      return 'bg-zinc-700 text-zinc-400';
  }
}

function posGroup(pos: string): string {
  switch (pos?.toUpperCase()) {
    case 'G':
    case 'GK':
    case 'GOALKEEPER':
      return 'GK';
    case 'D':
    case 'DEF':
    case 'DEFENDER':
      return 'DEF';
    case 'M':
    case 'MID':
    case 'MIDFIELDER':
      return 'MID';
    case 'F':
    case 'FWD':
    case 'FORWARD':
    case 'ATTACKER':
      return 'FWD';
    default:
      return pos?.toUpperCase() ?? 'N/A';
  }
}

const GROUP_ORDER = ['GK', 'DEF', 'MID', 'FWD'];

function squadDisplayName(p: SquadPlayer): string {
  return p.knownAs || [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown';
}

/* ---------- sub-components ---------- */

function PlayerRow({
  number,
  name,
  pos,
  slug,
}: {
  number: number;
  name: string;
  pos: string;
  slug?: string;
}) {
  const inner = (
    <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800/60">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[10px] font-bold text-zinc-300">
        {number}
      </span>
      <span className="flex-1 truncate text-sm text-zinc-200">{name}</span>
      <span
        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${posBadgeColor(
          pos,
        )}`}
      >
        {pos}
      </span>
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
}

export default function LineupsTab({
  match,
  lineups,
  homeSquad,
  awaySquad,
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
    <div className="space-y-6">
      {/* Pitch visualization */}
      {hasLineups && (
        <PitchVisualization
          homeLineup={homeLineup}
          awayLineup={awayLineup}
          homeColor={match.home_color}
          awayColor={match.away_color}
        />
      )}

      {/* Starting XI or Squad */}
      {hasLineups ? (
        <>
          {/* Starting XI */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Users className="h-4 w-4 text-emerald-400" />
              Starting XI
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Home */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {homeLineup.team.name}
                  </p>
                  <span className="text-xs text-zinc-600">
                    {homeLineup.formation}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {homeLineup.startXI.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                    />
                  ))}
                </div>
              </div>

              {/* Away */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {awayLineup.team.name}
                  </p>
                  <span className="text-xs text-zinc-600">
                    {awayLineup.formation}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {awayLineup.startXI.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Substitutes */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Substitutes
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {homeLineup.team.name}
                </p>
                <div className="space-y-0.5">
                  {homeLineup.substitutes.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {awayLineup.team.name}
                </p>
                <div className="space-y-0.5">
                  {awayLineup.substitutes.map(({ player }) => (
                    <PlayerRow
                      key={player.id}
                      number={player.number}
                      name={player.name}
                      pos={player.pos}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Coaches */}
          {(homeLineup.coach || awayLineup.coach) && (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                Coaches
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
                      <p className="text-sm text-zinc-200">
                        {homeLineup.coach.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {homeLineup.team.name}
                      </p>
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
                      <p className="text-sm text-zinc-200">
                        {awayLineup.coach.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {awayLineup.team.name}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Fallback: Squad by position */
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            <Users className="h-4 w-4 text-emerald-400" />
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
                      <div className="space-y-0.5">
                        {groupedHome[g].map((p) => (
                          <Link
                            key={p.id}
                            href={`/players/${p.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800/60"
                          >
                            {p.headshotUrl ? (
                              <Image
                                src={p.headshotUrl}
                                alt={squadDisplayName(p)}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-500">
                                {p.shirtNumber ?? '-'}
                              </span>
                            )}
                            <span className="flex-1 truncate text-sm text-zinc-200">
                              {squadDisplayName(p)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${posBadgeColor(
                                p.position,
                              )}`}
                            >
                              {posGroup(p.position)}
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
                      <div className="space-y-0.5">
                        {groupedAway[g].map((p) => (
                          <Link
                            key={p.id}
                            href={`/players/${p.slug}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800/60"
                          >
                            {p.headshotUrl ? (
                              <Image
                                src={p.headshotUrl}
                                alt={squadDisplayName(p)}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-500">
                                {p.shirtNumber ?? '-'}
                              </span>
                            )}
                            <span className="flex-1 truncate text-sm text-zinc-200">
                              {squadDisplayName(p)}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${posBadgeColor(
                                p.position,
                              )}`}
                            >
                              {posGroup(p.position)}
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
