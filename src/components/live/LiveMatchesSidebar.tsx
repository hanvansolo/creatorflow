import Link from 'next/link';
import Image from 'next/image';
import { Radio } from 'lucide-react';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { countryToRegion, REGION_ORDER, type Region } from '@/lib/utils/country-region';
import { AffiliateBanner } from '@/components/ads/AffiliateBanner';
import { DisplayAd } from '@/components/ads/AdSlot';
import { LiveSidebarAccordion } from './LiveSidebarAccordion';

interface LiveRow {
  id: string;
  slug: string | null;
  status: string;
  minute: number | null;
  home_score: number | null;
  away_score: number | null;
  home_name: string;
  home_slug: string;
  home_code: string | null;
  home_logo: string | null;
  away_name: string;
  away_slug: string;
  away_code: string | null;
  away_logo: string | null;
  competition_name: string | null;
  competition_slug: string | null;
  competition_logo: string | null;
  competition_country: string | null;
}

async function fetchLive(excludeId?: string): Promise<LiveRow[]> {
  try {
    const rows = await db.execute(sql`
      SELECT
        m.id, m.slug, m.status, m.minute, m.home_score, m.away_score,
        hc.name AS home_name, hc.slug AS home_slug, hc.code AS home_code, hc.logo_url AS home_logo,
        ac.name AS away_name, ac.slug AS away_slug, ac.code AS away_code, ac.logo_url AS away_logo,
        comp.name AS competition_name, comp.slug AS competition_slug, comp.logo_url AS competition_logo,
        comp.country AS competition_country
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE m.status IN ('live', 'halftime', 'extra_time', 'penalties')
      ORDER BY comp.name, m.kickoff
    `);
    const list = rows as unknown as LiveRow[];
    return excludeId ? list.filter(r => r.id !== excludeId) : list;
  } catch {
    return [];
  }
}

function statusLabel(row: LiveRow): string {
  if (row.status === 'halftime') return 'HT';
  if (row.status === 'penalties') return 'Pen';
  if (row.status === 'extra_time') return 'ET';
  if (row.minute != null) return `${row.minute}'`;
  return 'LIVE';
}

type Grouped = Record<Region, LiveRow[]>;

function groupByRegion(rows: LiveRow[]): Grouped {
  const groups = {
    Europe: [], Americas: [], Asia: [], Africa: [], Oceania: [], International: [],
  } as Grouped;
  for (const r of rows) {
    const region = countryToRegion(r.competition_country);
    groups[region].push(r);
  }
  return groups;
}

export async function LiveMatchesSidebar({ excludeMatchId }: { excludeMatchId?: string }) {
  const rows = await fetchLive(excludeMatchId);
  const grouped = groupByRegion(rows);
  const activeRegions = REGION_ORDER.filter(r => grouped[r].length > 0);

  return (
    <aside className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-zinc-900/60 px-4 py-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
          Live Now
        </h2>
        <span className="ml-auto text-xs text-zinc-500">{rows.length}</span>
      </div>

      {/* Affiliate banner pinned at top of rail */}
      <AffiliateBanner variant="medium" className="!my-0" />

      {/* Live matches grouped by region */}
      {activeRegions.length === 0 ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center">
          <Radio className="mx-auto mb-2 h-6 w-6 text-zinc-700" />
          <p className="text-xs text-zinc-500">No other matches live right now</p>
        </div>
      ) : (
        <LiveSidebarAccordion
          sections={activeRegions.map(region => ({
            region,
            count: grouped[region].length,
            matches: grouped[region].map(r => ({
              id: r.id,
              slug: r.slug,
              href: `/matches/${r.slug || r.id}`,
              status: statusLabel(r),
              home: { name: r.home_name, code: r.home_code, logo: r.home_logo },
              away: { name: r.away_name, code: r.away_code, logo: r.away_logo },
              home_score: r.home_score,
              away_score: r.away_score,
              competition: r.competition_name,
              competition_logo: r.competition_logo,
              country: r.competition_country,
            })),
          }))}
        />
      )}

      {/* Sidebar display ad — sits below live matches and above the
          all-live-scores link. Whole sidebar is sticky on lg:+ so the
          ad stays visible as the user scrolls the match content. */}
      <DisplayAd className="!my-0" />

      {/* Footer link */}
      <Link
        href="/live"
        className="block rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center text-xs font-medium text-zinc-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-400"
      >
        View all live scores →
      </Link>
    </aside>
  );
}
