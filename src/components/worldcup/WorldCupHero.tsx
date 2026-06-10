import Link from 'next/link';
import { Trophy, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getWorldCupPhase,
  isWorldCupActive,
  WORLD_CUP,
  WORLD_CUP_LINKS,
  type WorldCupMatch,
} from '@/lib/worldcup';
import { getWorldCupMatches } from '@/lib/worldcup-data';
import { WorldCupCountdown } from './WorldCupCountdown';

const LIVE_STATUSES = ['live', 'halftime', 'extra_time', 'penalties'];

function Team({
  name,
  code,
  logo,
  color,
  align,
}: {
  name: string;
  code: string | null;
  logo: string | null;
  color: string | null;
  align: 'left' | 'right';
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2',
        align === 'right' ? 'flex-row-reverse text-right' : 'text-left',
      )}
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-5 w-5 shrink-0 object-contain" />
      ) : (
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full"
          style={{ backgroundColor: color || '#52525b' }}
        />
      )}
      <span className="truncate text-sm font-medium text-white/90">{code || name}</span>
    </div>
  );
}

function MatchRow({ m }: { m: WorldCupMatch }) {
  const isLive = LIVE_STATUSES.includes(m.status);
  const kickoff = new Date(m.kickoff);
  return (
    <Link
      href={m.slug ? `/matches/${m.slug}` : WORLD_CUP_LINKS.fixtures}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06]"
    >
      <Team name={m.homeName} code={m.homeCode} logo={m.homeLogo} color={m.homeColor} align="right" />
      <div className="flex w-14 shrink-0 flex-col items-center">
        {isLive ? (
          <span className="text-base font-bold tabular-nums text-emerald-300">
            {m.homeScore ?? 0}-{m.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-sm font-semibold tabular-nums text-white/85">
            {kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        )}
        <span className="text-[10px] text-white/40">
          {isLive
            ? `${m.minute ?? ''}'`.trim()
            : kickoff.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
        </span>
      </div>
      <Team name={m.awayName} code={m.awayCode} logo={m.awayLogo} color={m.awayColor} align="left" />
    </Link>
  );
}

/**
 * The World Cup takeover band that sits at the very top of the homepage while
 * the tournament is on. Renders nothing the rest of the year.
 */
export async function WorldCupHero() {
  if (!isWorldCupActive()) return null;

  const phase = getWorldCupPhase();
  const matches = await getWorldCupMatches(5);
  const isLiveNow = matches.some((m) => LIVE_STATUSES.includes(m.status));

  return (
    <section
      aria-label="2026 FIFA World Cup"
      className="relative overflow-hidden border-b border-amber-300/15 bg-[#070b16]"
    >
      {/* Floodlit-pitch ambience — warm gold + pitch green, deliberately not a purple blob. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 right-8 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <div className="grid items-center gap-7 lg:grid-cols-[1.1fr_1fr]">
          {/* Identity + status + CTAs */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/15 ring-1 ring-amber-300/30">
                <Trophy className="h-4 w-4 text-amber-300" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                {phase === 'live' ? 'The World Cup is here' : 'Counting down'}
              </span>
              {isLiveNow && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  Live now
                </span>
              )}
            </div>

            <h2 className="mt-3 text-3xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              {WORLD_CUP.edition}
            </h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
              <MapPin className="h-3.5 w-3.5 text-white/40" />
              {WORLD_CUP.hosts} · {WORLD_CUP.teams} teams · {WORLD_CUP.totalMatches} matches
            </p>

            {phase === 'buildup' && !isLiveNow && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Kick-off in</p>
                <WorldCupCountdown kickoff={WORLD_CUP.kickoff} />
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <Link
                href={WORLD_CUP_LINKS.hub}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300"
              >
                World Cup hub <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={WORLD_CUP_LINKS.fixtures}
                className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
              >
                Fixtures
              </Link>
              <Link
                href={WORLD_CUP_LINKS.table}
                className="inline-flex items-center rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
              >
                Groups
              </Link>
            </div>
          </div>

          {/* Match strip */}
          <div className="rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10">
            <div className="flex items-center justify-between px-2 py-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                {isLiveNow ? 'Live & next up' : 'First up'}
              </span>
              <Link
                href={WORLD_CUP_LINKS.fixtures}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200"
              >
                All fixtures →
              </Link>
            </div>
            <div className="mt-1 space-y-1">
              {matches.length > 0 ? (
                matches.map((m) => <MatchRow key={m.id} m={m} />)
              ) : (
                <p className="px-3 py-7 text-center text-sm text-white/50">
                  The full match schedule lands as the draw is finalised.{' '}
                  <Link href={WORLD_CUP_LINKS.fixtures} className="font-semibold text-amber-300 hover:text-amber-200">
                    Browse fixtures →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
