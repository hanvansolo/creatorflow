'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';

interface Competition {
  name: string;
  slug: string;
  shortName: string;
  type: string;
  country: string;
  countryCode: string;
  description: string;
}

interface CompetitionSelectorProps {
  competitions: Competition[];
  selectedSlug: string;
  basePath: string;
  extraParams?: string;
}

const POPULAR_SLUGS = [
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'ligue-1',
  'eredivisie',
  'mls',
  'brasileirao',
  'champions-league',
  'liga-mx',
];

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

// Map South America continental competitions to Americas
const CONTINENTAL_REGION_MAP: Record<string, string> = {
  'South America': 'Americas',
  'Asia': 'Asia & Middle East',
  'Africa': 'Africa',
  'Europe': 'Europe',
  'World': 'Popular',
};

const REGION_TABS = ['Popular', 'Europe', 'Americas', 'Asia & Middle East', 'Africa', 'Oceania'];

function getRegion(comp: Competition): string {
  // Check if the country itself is a continent/region name
  if (CONTINENTAL_REGION_MAP[comp.country]) {
    return CONTINENTAL_REGION_MAP[comp.country];
  }
  for (const [region, codes] of Object.entries(REGIONS)) {
    if (codes.includes(comp.countryCode)) return region;
  }
  return 'Europe';
}

export default function CompetitionSelector({
  competitions,
  selectedSlug,
  basePath,
  extraParams = '',
}: CompetitionSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeRegion, setActiveRegion] = useState('Popular');

  const popularComps = useMemo(
    () => competitions.filter(c => POPULAR_SLUGS.includes(c.slug))
      .sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug)),
    [competitions]
  );

  const regionComps = useMemo(() => {
    if (activeRegion === 'Popular') return [];
    return competitions.filter(c => getRegion(c) === activeRegion);
  }, [competitions, activeRegion]);

  // Group region competitions by country
  const groupedByCountry = useMemo(() => {
    const groups: Record<string, Competition[]> = {};
    for (const c of regionComps) {
      if (!groups[c.country]) groups[c.country] = [];
      groups[c.country].push(c);
    }
    // Sort countries alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [regionComps]);

  const handleSelect = useCallback(
    (slug: string) => {
      const url = `${basePath}?competition=${slug}${extraParams}`;
      router.push(url);
    },
    [router, basePath, extraParams]
  );

  const handleSelectAll = useCallback(() => {
    const url = `${basePath}${extraParams ? `?${extraParams.replace(/^&/, '')}` : ''}`;
    router.push(url);
  }, [router, basePath, extraParams]);

  const showAll = basePath === '/fixtures' || basePath === '/live';

  return (
    <div className="mb-6 rounded-xl bg-zinc-800/60 border border-zinc-700/40 overflow-hidden">
      {/* Region tabs row */}
      <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide border-b border-zinc-700/30 bg-zinc-800/80">
        {REGION_TABS.map(region => (
          <button
            key={region}
            onClick={() => setActiveRegion(region)}
            className={`shrink-0 px-4 py-2 text-xs font-medium transition-all relative ${
              activeRegion === region
                ? 'text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {region}
            {activeRegion === region && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* League pills row */}
      <div className="px-3 py-2.5 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
          {/* "All" pill for fixtures/live */}
          {showAll && (
            <button
              onClick={handleSelectAll}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                !selectedSlug
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              All
            </button>
          )}

          {activeRegion === 'Popular' ? (
            // Flat list of popular leagues
            popularComps.map(comp => (
              <button
                key={comp.slug}
                onClick={() => handleSelect(comp.slug)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  selectedSlug === comp.slug
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {comp.shortName}
              </button>
            ))
          ) : (
            // Grouped by country
            groupedByCountry.map(([country, comps]) => (
              <div key={country} className="flex items-center gap-1 shrink-0">
                {/* Country label — only show if multiple leagues or to separate groups */}
                <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500 pl-2 pr-0.5 whitespace-nowrap">
                  {country}
                </span>
                {comps.map(comp => (
                  <button
                    key={comp.slug}
                    onClick={() => handleSelect(comp.slug)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                      selectedSlug === comp.slug
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                        : 'bg-zinc-700/60 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                    }`}
                  >
                    {comps.length === 1 ? comp.shortName : comp.shortName}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
