// @ts-nocheck
'use client';

import { useMemo } from 'react';
import { GitCompareArrows } from 'lucide-react';
import type { MatchDetail, PredictionData } from '@/components/match/types';

/* ---------- Form Badge ---------- */

function FormBadge({ result }: { result: string }) {
  const r = result.toUpperCase();
  let classes = 'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ';
  if (r === 'W') classes += 'bg-green-600 text-white';
  else if (r === 'D') classes += 'bg-zinc-600 text-zinc-200';
  else classes += 'bg-red-600 text-white';
  return <span className={classes}>{r}</span>;
}

/* ---------- Comparison Bar ---------- */

function ComparisonBar({
  label,
  homeValue,
  awayValue,
}: {
  label: string;
  homeValue: number;
  awayValue: number;
}) {
  const total = homeValue + awayValue;
  const homePct = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPct = total > 0 ? (awayValue / total) * 100 : 50;
  const homeHigher = homeValue > awayValue;
  const awayHigher = awayValue > homeValue;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-bold tabular-nums w-12 ${homeHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {homeValue}%
        </span>
        <span className="text-xs text-zinc-400 uppercase tracking-wider flex-1 text-center">
          {label}
        </span>
        <span className={`text-sm font-bold tabular-nums w-12 text-right ${awayHigher ? 'text-yellow-400' : 'text-zinc-300'}`}>
          {awayValue}%
        </span>
      </div>
      <div className="flex h-2 gap-0.5">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-l bg-yellow-400 transition-all duration-700"
            style={{ width: `${homePct}%` }}
          />
        </div>
        <div className="flex-1">
          <div
            className="h-full rounded-r bg-zinc-500 transition-all duration-700"
            style={{ width: `${awayPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- component ---------- */

interface HeadToHeadTabProps {
  match: MatchDetail;
  predictions: PredictionData | null;
}

export default function HeadToHeadTab({ match, predictions }: HeadToHeadTabProps) {
  const homeForm = predictions?.teams?.home?.last_5?.form?.split('') ?? [];
  const awayForm = predictions?.teams?.away?.last_5?.form?.split('') ?? [];
  const comparison = predictions?.comparison ?? {};
  const h2h = predictions?.h2h ?? [];

  const hasData = homeForm.length > 0 || awayForm.length > 0 || h2h.length > 0 || Object.keys(comparison).length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-500">
        <GitCompareArrows className="h-8 w-8" />
        <p className="text-sm">Head-to-head data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Team Key Header ---- */}
      <div className="rounded-lg bg-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-yellow-400" />
            <span className="text-sm font-semibold text-zinc-200">{match.home_name}</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Head-to-Head</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">{match.away_name}</span>
            <span className="inline-block h-3 w-3 rounded-sm bg-zinc-500" />
          </div>
        </div>
      </div>

      {/* ---- Form Guide ---- */}
      {(homeForm.length > 0 || awayForm.length > 0) && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Form Guide — Last 5
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { team: match.home_name, form: homeForm },
              { team: match.away_name, form: awayForm },
            ].map(({ team, form }) => (
              <div key={team}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {team}
                </p>
                <div className="flex gap-1.5">
                  {form.map((r, i) => (
                    <FormBadge key={i} result={r} />
                  ))}
                  {form.length === 0 && (
                    <span className="text-xs text-zinc-600">No data</span>
                  )}
                </div>
                {form.length > 0 && (
                  <p className="mt-1 text-[10px] text-zinc-500">
                    {form.filter((r) => r.toUpperCase() === 'W').length}W{' '}
                    {form.filter((r) => r.toUpperCase() === 'D').length}D{' '}
                    {form.filter((r) => r.toUpperCase() === 'L').length}L
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- Season Comparison ---- */}
      {Object.keys(comparison).length > 0 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Season Comparison
          </h3>
          <div className="divide-y divide-zinc-700/50">
            {Object.entries(comparison).map(([key, val]) => {
              const hNum = parseInt(val.home) || 0;
              const aNum = parseInt(val.away) || 0;
              const label = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <ComparisonBar
                  key={key}
                  label={label}
                  homeValue={hNum}
                  awayValue={aNum}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ---- Previous Meetings ---- */}
      {h2h.length > 0 && (
        <section className="rounded-lg bg-zinc-800 p-4">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-yellow-400">
            Previous Meetings
          </h3>
          <div className="space-y-2">
            {h2h.slice(0, 10).map((game, i) => {
              const homeTeam = game.teams?.home?.name ?? 'Home';
              const awayTeam = game.teams?.away?.name ?? 'Away';
              const homeGoals = game.goals?.home ?? game.score?.fulltime?.home ?? '?';
              const awayGoals = game.goals?.away ?? game.score?.fulltime?.away ?? '?';
              const date = game.fixture?.date
                ? new Date(game.fixture.date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';
              const comp = game.league?.name ?? '';

              return (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-zinc-900/60 px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-semibold ${
                        homeGoals > awayGoals ? 'text-yellow-400' : 'text-zinc-300'
                      }`}>
                        {homeTeam}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {homeGoals} - {awayGoals}
                      </span>
                      <span className={`font-semibold ${
                        awayGoals > homeGoals ? 'text-yellow-400' : 'text-zinc-300'
                      }`}>
                        {awayTeam}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {date && <span className="text-[10px] text-zinc-500">{date}</span>}
                      {comp && (
                        <>
                          <span className="text-zinc-700">|</span>
                          <span className="text-[10px] text-zinc-500">{comp}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
