// Single source of truth for the 2026 FIFA World Cup site takeover.
//
// The homepage hero, the nav highlight, the SEO copy and the /world-cup hub all
// gate on `isWorldCupActive()`. Because that's a pure date check, the takeover
// turns itself on ~30 days before kick-off and turns itself off automatically
// after the final — no manual cleanup, no stale "World Cup" banner in August.
//
// IMPORTANT: this module is imported by client components (the nav), so it must
// stay free of any server-only imports (no `db`, no `postgres`). DB queries for
// World Cup matches live in `worldcup-data.ts`.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

export const WORLD_CUP = {
  edition: '2026 FIFA World Cup',
  shortName: 'World Cup 2026',
  competitionSlug: 'world-cup',
  hosts: 'USA, Canada & Mexico',
  teams: 48,
  totalMatches: 104,
  // Tournament window in UTC. Opening match 11 Jun 2026, final 19 Jul 2026.
  kickoff: '2026-06-11T16:00:00Z',
  start: '2026-06-11T00:00:00Z',
  end: '2026-07-19T23:59:59Z',
  // How many days before kick-off the takeover starts teasing the tournament.
  buildupDays: 30,
} as const;

export type WorldCupPhase = 'off' | 'buildup' | 'live' | 'over';

/** Where the tournament sits relative to `now`. */
export function getWorldCupPhase(now: Date = new Date()): WorldCupPhase {
  const start = new Date(WORLD_CUP.start).getTime();
  const end = new Date(WORLD_CUP.end).getTime();
  const buildupStart = start - WORLD_CUP.buildupDays * 86_400_000;
  const t = now.getTime();
  if (t < buildupStart) return 'off';
  if (t < start) return 'buildup';
  if (t <= end) return 'live';
  return 'over';
}

/** The takeover (hero + nav highlight + WC-led SEO) shows during buildup and the tournament. */
export function isWorldCupActive(now: Date = new Date()): boolean {
  const phase = getWorldCupPhase(now);
  return phase === 'buildup' || phase === 'live';
}

export const WORLD_CUP_LINKS = {
  hub: '/world-cup',
  fixtures: `/fixtures?competition=${WORLD_CUP.competitionSlug}`,
  table: `/tables?competition=${WORLD_CUP.competitionSlug}`,
  live: '/live',
} as const;

/** SEO copy used by the homepage + hub while the tournament is on. */
export const WORLD_CUP_SEO = {
  title: 'World Cup 2026: Live Scores, Fixtures, Groups & News',
  description:
    'Follow the 2026 FIFA World Cup across the USA, Canada & Mexico — live scores, the full fixture schedule, group standings, AI match predictions and breaking news, all in one place. No clickbait, no waffle.',
  keywords: [
    '2026 World Cup',
    'World Cup 2026',
    'FIFA World Cup 2026',
    'World Cup live scores',
    'World Cup fixtures',
    'World Cup 2026 schedule',
    'World Cup groups',
    'World Cup standings',
    'World Cup predictions',
    'World Cup news',
    'USA Canada Mexico World Cup',
  ],
} as const;

/** Shape returned by `getWorldCupMatches` (defined in worldcup-data.ts). */
export interface WorldCupMatch {
  id: string;
  slug: string | null;
  kickoff: string;
  status: string;
  minute: number | null;
  round: string | null;
  homeName: string;
  homeCode: string | null;
  homeLogo: string | null;
  homeColor: string | null;
  homeScore: number | null;
  awayName: string;
  awayCode: string | null;
  awayLogo: string | null;
  awayColor: string | null;
  awayScore: number | null;
}

/**
 * SportsEvent JSON-LD payload for the World Cup. Wrap with `jsonLd()` from
 * `@/lib/seo` before rendering in a <JsonLdScript>.
 */
export function worldCupSportsEvent() {
  return {
    '@type': 'SportsEvent',
    name: WORLD_CUP.edition,
    sport: 'Association football',
    description: WORLD_CUP_SEO.description,
    startDate: WORLD_CUP.start,
    endDate: WORLD_CUP.end,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: [
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Canada' },
      { '@type': 'Country', name: 'Mexico' },
    ],
    organizer: { '@type': 'Organization', name: 'FIFA', url: 'https://www.fifa.com' },
    url: `${SITE_URL}/world-cup`,
  };
}

/** Visible + JSON-LD FAQ content for the World Cup hub. */
export const WORLD_CUP_FAQ = [
  {
    question: 'When does the 2026 World Cup start?',
    answer:
      'The 2026 FIFA World Cup kicks off on 11 June 2026 and runs through to the final on 19 July 2026, hosted across the United States, Canada and Mexico.',
  },
  {
    question: 'How many teams are in the 2026 World Cup?',
    answer:
      'For the first time the World Cup expands to 48 teams playing 104 matches, up from 32 teams and 64 matches at previous tournaments.',
  },
  {
    question: 'Where can I follow World Cup live scores?',
    answer:
      'Footy Feed carries live World Cup scores, the full fixture schedule, group standings and match predictions. Follow every goal as it happens on our live scores and fixtures pages.',
  },
  {
    question: 'Which countries are hosting the 2026 World Cup?',
    answer:
      'The 2026 World Cup is co-hosted by the United States, Canada and Mexico — the first World Cup ever staged across three nations.',
  },
];
