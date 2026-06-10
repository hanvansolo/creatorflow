// @ts-nocheck
import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, MapPin, Radio, ArrowRight, Zap, CalendarDays, Table as TableIcon, BarChart3, Newspaper } from 'lucide-react';
import {
  createPageMetadata,
  jsonLdMultiple,
  JsonLdScript,
  generateFAQStructuredData,
  generateBreadcrumbStructuredData,
} from '@/lib/seo';
import {
  getWorldCupPhase,
  worldCupSportsEvent,
  WORLD_CUP,
  WORLD_CUP_LINKS,
  WORLD_CUP_SEO,
  WORLD_CUP_FAQ,
} from '@/lib/worldcup';
import { getWorldCupMatches } from '@/lib/worldcup-data';
import { WorldCupCountdown } from '@/components/worldcup/WorldCupCountdown';
import { HorizontalAd } from '@/components/ads/ProfitableAds';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return createPageMetadata(
    WORLD_CUP_SEO.title,
    WORLD_CUP_SEO.description,
    WORLD_CUP_LINKS.hub,
    WORLD_CUP_SEO.keywords as unknown as string[],
  );
}

const LIVE_STATUSES = ['live', 'halftime', 'extra_time', 'penalties'];

const FOLLOW_LINKS = [
  { href: WORLD_CUP_LINKS.live, label: 'Live scores', desc: 'Every goal, minute by minute', icon: Zap },
  { href: WORLD_CUP_LINKS.fixtures, label: 'Fixtures', desc: 'Full match schedule & kick-off times', icon: CalendarDays },
  { href: WORLD_CUP_LINKS.table, label: 'Groups & standings', desc: 'All 12 groups, live tables', icon: TableIcon },
  { href: '/predictions', label: 'Predictions', desc: 'AI score forecasts for every tie', icon: BarChart3 },
];

function statusLine(phase: ReturnType<typeof getWorldCupPhase>, isLiveNow: boolean): string {
  if (isLiveNow) return 'Matches are live right now';
  switch (phase) {
    case 'live':
      return 'The tournament is under way';
    case 'over':
      return 'The 2026 World Cup has finished';
    default:
      return 'Counting down to kick-off';
  }
}

function Crest({ name, code, logo, color, align }: { name: string; code: string | null; logo: string | null; color: string | null; align: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={name} className="h-6 w-6 shrink-0 object-contain" />
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: color || '#52525b' }} />
      )}
      <span className="truncate text-sm font-medium text-white/90 sm:text-base">{name}</span>
    </div>
  );
}

export default async function WorldCupPage() {
  const phase = getWorldCupPhase();
  const matches = await getWorldCupMatches(12);
  const isLiveNow = matches.some((m) => LIVE_STATUSES.includes(m.status));

  const structuredData = jsonLdMultiple([
    worldCupSportsEvent(),
    generateFAQStructuredData(WORLD_CUP_FAQ),
    generateBreadcrumbStructuredData([
      { name: 'Home', url: '/' },
      { name: WORLD_CUP.edition, url: WORLD_CUP_LINKS.hub },
    ]),
  ]);

  return (
    <>
      <JsonLdScript data={structuredData} />

      <div className="min-h-screen bg-zinc-950">
        {/* ── Hero header ── */}
        <header className="relative overflow-hidden border-b border-amber-300/15 bg-[#070b16]">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 ring-1 ring-amber-300/30">
                <Trophy className="h-4.5 w-4.5 text-amber-300" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                {statusLine(phase, isLiveNow)}
              </span>
              {isLiveNow && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300 ring-1 ring-emerald-400/30">
                  <Radio className="h-3 w-3" /> Live
                </span>
              )}
            </div>

            <h1 className="mt-4 text-4xl font-extrabold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {WORLD_CUP.edition}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Live scores, the full fixture schedule, group standings and AI predictions for the first
              48-team World Cup — co-hosted across the {WORLD_CUP.hosts}. No clickbait, no waffle.
            </p>

            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/55">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-white/40" />{WORLD_CUP.hosts}</span>
              <span className="text-white/25">·</span>
              <span>{WORLD_CUP.teams} teams</span>
              <span className="text-white/25">·</span>
              <span>{WORLD_CUP.totalMatches} matches</span>
              <span className="text-white/25">·</span>
              <span>11 Jun – 19 Jul 2026</span>
            </p>

            {phase !== 'live' && phase !== 'over' && (
              <div className="mt-7">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/40">Kick-off in</p>
                <WorldCupCountdown kickoff={WORLD_CUP.kickoff} />
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link href={WORLD_CUP_LINKS.fixtures} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-zinc-950 transition-colors hover:bg-amber-300">
                View fixtures <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={WORLD_CUP_LINKS.live} className="inline-flex items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15">
                Live scores
              </Link>
              <Link href={WORLD_CUP_LINKS.table} className="inline-flex items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15">
                Groups
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {/* ── Matches ── */}
          <section aria-label="World Cup matches">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-bold text-white">{isLiveNow ? 'Live & upcoming' : 'Upcoming matches'}</h2>
              <Link href={WORLD_CUP_LINKS.fixtures} className="text-sm font-semibold text-amber-300 hover:text-amber-200">
                Full schedule →
              </Link>
            </div>

            {matches.length > 0 ? (
              <div className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
                {matches.map((m) => {
                  const isLive = LIVE_STATUSES.includes(m.status);
                  const k = new Date(m.kickoff);
                  return (
                    <Link
                      key={m.id}
                      href={m.slug ? `/matches/${m.slug}` : WORLD_CUP_LINKS.fixtures}
                      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.05] ${isLive ? 'border-l-2 border-l-emerald-500' : ''}`}
                    >
                      <Crest name={m.homeName} code={m.homeCode} logo={m.homeLogo} color={m.homeColor} align="right" />
                      <div className="flex w-20 shrink-0 flex-col items-center">
                        {isLive ? (
                          <span className="text-lg font-bold tabular-nums text-emerald-300">{m.homeScore ?? 0}-{m.awayScore ?? 0}</span>
                        ) : (
                          <span className="text-sm font-semibold tabular-nums text-white/85">{k.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                        )}
                        <span className="text-[10px] text-white/40">
                          {isLive ? `${m.minute ?? ''}'`.trim() : k.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <Crest name={m.awayName} code={m.awayCode} logo={m.awayLogo} color={m.awayColor} align="left" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.03] px-6 py-12 text-center ring-1 ring-white/10">
                <CalendarDays className="mx-auto mb-3 h-9 w-9 text-white/30" />
                <p className="text-sm text-white/60">
                  The full match schedule is confirmed as the group-stage draw is finalised.
                </p>
                <Link href={WORLD_CUP_LINKS.fixtures} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200">
                  Browse the fixtures page <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </section>

          <HorizontalAd className="my-8" />

          {/* ── How to follow ── */}
          <section aria-label="How to follow the World Cup" className="mt-2">
            <h2 className="mb-4 text-xl font-bold text-white">Follow every match on Footy Feed</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {FOLLOW_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-start gap-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/10 transition-colors hover:bg-white/[0.06] hover:ring-amber-300/25"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-amber-300/20">
                    <l.icon className="h-4 w-4 text-amber-300" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 text-sm font-semibold text-white group-hover:text-amber-200">
                      {l.label} <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="mt-0.5 block text-xs text-white/55">{l.desc}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── About / format ── */}
          <section aria-label="About the 2026 World Cup" className="mt-10">
            <h2 className="mb-3 text-xl font-bold text-white">A new look for the World Cup</h2>
            <div className="space-y-3 text-sm leading-relaxed text-white/65">
              <p>
                The 2026 FIFA World Cup is the biggest in history — the first staged across three
                nations, with the United States, Canada and Mexico sharing hosting duties, and the first
                to feature {WORLD_CUP.teams} teams. That expansion pushes the tournament to{' '}
                {WORLD_CUP.totalMatches} matches across 12 groups, with the top two from each group plus the
                eight best third-placed sides advancing to a 32-team knockout round.
              </p>
              <p>
                The opening match kicks off on 11 June 2026 and the final is played on 19 July 2026.
                Footy Feed tracks all of it — live scores as goals go in, every fixture and result, group
                tables that update in real time, and AI-powered predictions for each tie.
              </p>
            </div>
          </section>

          {/* ── FAQ ── */}
          <section aria-label="World Cup FAQ" className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-white">World Cup 2026 FAQ</h2>
            <div className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
              {WORLD_CUP_FAQ.map((f) => (
                <div key={f.question} className="px-5 py-4">
                  <h3 className="text-sm font-semibold text-white">{f.question}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{f.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-400/10 to-emerald-500/5 p-5 ring-1 ring-amber-300/20">
            <Newspaper className="h-5 w-5 shrink-0 text-amber-300" />
            <p className="text-sm text-white/75">
              Want the headlines too? Catch every breaking World Cup story on our{' '}
              <Link href="/news" className="font-semibold text-amber-300 hover:text-amber-200">news feed</Link>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
