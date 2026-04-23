'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronDown, Search, Star } from 'lucide-react';

interface Competition {
  name: string;
  slug: string;
  shortName: string;
  type: string;
  country: string;
  countryCode: string;
  description: string;
}

interface Props {
  competitions: Competition[];
  selectedSlug: string;
  basePath: string;
}

// Same region mapping as CompetitionSelector so the two stay consistent.
const REGIONS: Record<string, string[]> = {
  Europe: [
    'GB', 'ES', 'IT', 'DE', 'FR', 'NL', 'PT', 'BE', 'TR', 'AT', 'CH', 'DK',
    'GR', 'HR', 'CZ', 'PL', 'NO', 'SE', 'RU', 'UA', 'RO', 'RS', 'HU', 'BG',
    'FI', 'IS', 'IE', 'AD', 'SM', 'FO', 'AL', 'BA', 'SK', 'SI', 'LV', 'LT',
    'EE', 'MD', 'ME', 'XK', 'MK', 'LU', 'MT', 'CY', 'GE', 'EU',
  ],
  Americas: [
    'US', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'EC', 'PY', 'UY', 'VE',
    'CR', 'HN', 'GT', 'PA', 'BO', 'SV', 'JM', 'CA',
  ],
  'Asia & Middle East': [
    'SA', 'JP', 'KR', 'IN', 'CN', 'TH', 'VN', 'MY', 'ID', 'IR', 'IQ',
    'JO', 'KW', 'QA', 'AE', 'UZ', 'BH', 'OM', 'SG', 'HK', 'PH', 'MM',
    'KH', 'LB', 'SY', 'IL', 'AS',
  ],
  Africa: [
    'EG', 'ZA', 'MA', 'TN', 'DZ', 'GH', 'NG', 'KE', 'TZ', 'UG', 'CI',
    'CM', 'SN', 'SD', 'ZM', 'ZW', 'AF',
  ],
  Oceania: ['AU', 'NZ'],
};

const CONTINENTAL_REGION_MAP: Record<string, string> = {
  'South America': 'Americas',
  'Asia': 'Asia & Middle East',
  'Africa': 'Africa',
  'Europe': 'Europe',
  'World': 'Popular',
};

const REGION_ORDER = ['Popular', 'Europe', 'Americas', 'Asia & Middle East', 'Africa', 'Oceania'] as const;
type Region = typeof REGION_ORDER[number];

const POPULAR_SLUGS = [
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'ligue-1',
  'champions-league',
  'europa-league',
  'eredivisie',
  'mls',
  'brasileirao',
  'liga-mx',
  'primeira-liga',
  'saudi-pro-league',
  'championship',
];

function regionOf(c: Competition): Region {
  if (CONTINENTAL_REGION_MAP[c.country]) {
    return CONTINENTAL_REGION_MAP[c.country] as Region;
  }
  for (const [region, codes] of Object.entries(REGIONS)) {
    if (codes.includes(c.countryCode)) return region as Region;
  }
  return 'Europe';
}

export default function CompetitionSidebar({
  competitions,
  selectedSlug,
  basePath,
}: Props) {
  const [query, setQuery] = useState('');
  // Popular is expanded by default; others collapsed. Search auto-expands
  // regions that contain matches (computed below).
  const [openRegions, setOpenRegions] = useState<Record<Region, boolean>>({
    Popular: true,
    Europe: false,
    Americas: false,
    'Asia & Middle East': false,
    Africa: false,
    Oceania: false,
  });

  const trimmedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!trimmedQuery) return competitions;
    return competitions.filter(
      (c) =>
        c.name.toLowerCase().includes(trimmedQuery) ||
        c.country.toLowerCase().includes(trimmedQuery) ||
        c.shortName.toLowerCase().includes(trimmedQuery),
    );
  }, [competitions, trimmedQuery]);

  // Make sure the region containing the selected league is open on mount.
  const selectedRegion = useMemo<Region | null>(() => {
    const sel = competitions.find((c) => c.slug === selectedSlug);
    if (!sel) return null;
    if (POPULAR_SLUGS.includes(sel.slug)) return 'Popular';
    return regionOf(sel);
  }, [competitions, selectedSlug]);

  const popular = useMemo(
    () =>
      filtered
        .filter((c) => POPULAR_SLUGS.includes(c.slug))
        .sort(
          (a, b) =>
            POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug),
        ),
    [filtered],
  );

  // Region → country → competitions tree.
  const byRegion = useMemo(() => {
    const tree: Record<Region, Record<string, Competition[]>> = {
      Popular: {},
      Europe: {},
      Americas: {},
      'Asia & Middle East': {},
      Africa: {},
      Oceania: {},
    };
    for (const c of filtered) {
      const r = regionOf(c);
      if (!tree[r][c.country]) tree[r][c.country] = [];
      tree[r][c.country].push(c);
    }
    return tree;
  }, [filtered]);

  // Count of comps per region (for the badge in the header).
  const regionCounts = useMemo(() => {
    const counts: Record<Region, number> = {
      Popular: popular.length,
      Europe: Object.values(byRegion.Europe).reduce((n, list) => n + list.length, 0),
      Americas: Object.values(byRegion.Americas).reduce((n, list) => n + list.length, 0),
      'Asia & Middle East': Object.values(byRegion['Asia & Middle East']).reduce((n, list) => n + list.length, 0),
      Africa: Object.values(byRegion.Africa).reduce((n, list) => n + list.length, 0),
      Oceania: Object.values(byRegion.Oceania).reduce((n, list) => n + list.length, 0),
    };
    return counts;
  }, [popular, byRegion]);

  const toggleRegion = (r: Region) => {
    setOpenRegions((prev) => ({ ...prev, [r]: !prev[r] }));
  };

  // When searching, force-open regions that have matches so the user can
  // see results without clicking through every region.
  const regionOpen = (r: Region) => {
    if (trimmedQuery.length > 0 && regionCounts[r] > 0) return true;
    if (selectedRegion === r) return true;
    return openRegions[r];
  };

  const linkFor = (slug: string) => `${basePath}?competition=${slug}`;

  const LeagueRow = ({ comp }: { comp: Competition }) => (
    <Link
      href={linkFor(comp.slug)}
      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
        selectedSlug === comp.slug
          ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      <span className="truncate">{comp.name}</span>
      {comp.type !== 'league' && (
        <span className="shrink-0 text-[9px] uppercase tracking-wider text-zinc-500">
          Cup
        </span>
      )}
    </Link>
  );

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/60">
      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search leagues…"
            className="w-full rounded-md bg-zinc-800/80 border border-zinc-700/50 pl-8 pr-2 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500/40 focus:outline-none"
          />
        </div>
        {trimmedQuery && (
          <p className="mt-1.5 text-[10px] text-zinc-500">
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      <nav className="max-h-[70vh] overflow-y-auto p-2">
        {REGION_ORDER.map((region) => {
          const count = regionCounts[region];
          if (count === 0 && trimmedQuery) return null;
          const open = regionOpen(region);

          return (
            <div key={region} className="mb-1">
              <button
                type="button"
                onClick={() => toggleRegion(region)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  {region === 'Popular' && <Star className="h-3 w-3 text-amber-400" />}
                  {region}
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-500">
                    {count}
                  </span>
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open && count > 0 && (
                <div className="mt-1 space-y-0.5">
                  {region === 'Popular'
                    ? popular.map((c) => <LeagueRow key={c.slug} comp={c} />)
                    : Object.entries(byRegion[region])
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([country, comps]) => (
                          <div key={country} className="mt-1">
                            <div className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                              {country}
                            </div>
                            <div className="space-y-0.5">
                              {comps
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((c) => (
                                  <LeagueRow key={c.slug} comp={c} />
                                ))}
                            </div>
                          </div>
                        ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
