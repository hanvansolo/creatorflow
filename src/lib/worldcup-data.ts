// Server-only World Cup DB queries. Keep this OUT of any client component —
// it imports `db` (postgres). The client-safe config lives in `worldcup.ts`.
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { WORLD_CUP, type WorldCupMatch } from '@/lib/worldcup';

/**
 * Live + upcoming World Cup matches, soonest first (live games sort first
 * because their kick-off is already in the past). Defensive: returns [] if the
 * competition has no fixtures seeded yet — e.g. before the group-stage draw —
 * so callers can render a graceful "schedule coming soon" state.
 */
export async function getWorldCupMatches(limit = 6): Promise<WorldCupMatch[]> {
  try {
    const rows = await db.execute(sql`
      SELECT
        m.id, m.slug, m.kickoff, m.status, m.minute, m.round,
        m.home_score, m.away_score,
        hc.name AS home_name, hc.code AS home_code, hc.logo_url AS home_logo, hc.primary_color AS home_color,
        ac.name AS away_name, ac.code AS away_code, ac.logo_url AS away_logo, ac.primary_color AS away_color
      FROM matches m
      INNER JOIN clubs hc ON m.home_club_id = hc.id
      INNER JOIN clubs ac ON m.away_club_id = ac.id
      LEFT JOIN competition_seasons cs ON m.competition_season_id = cs.id
      LEFT JOIN competitions comp ON cs.competition_id = comp.id
      WHERE comp.slug = ${WORLD_CUP.competitionSlug}
        AND m.status <> 'finished'
      ORDER BY m.kickoff ASC
      LIMIT ${limit}
    `);

    return (rows as unknown as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      slug: (r.slug as string) ?? null,
      kickoff: r.kickoff instanceof Date ? r.kickoff.toISOString() : String(r.kickoff),
      status: String(r.status),
      minute: (r.minute as number) ?? null,
      round: (r.round as string) ?? null,
      homeName: (r.home_name as string) ?? '',
      homeCode: (r.home_code as string) ?? null,
      homeLogo: (r.home_logo as string) ?? null,
      homeColor: (r.home_color as string) ?? null,
      homeScore: (r.home_score as number) ?? null,
      awayName: (r.away_name as string) ?? '',
      awayCode: (r.away_code as string) ?? null,
      awayLogo: (r.away_logo as string) ?? null,
      awayColor: (r.away_color as string) ?? null,
      awayScore: (r.away_score as number) ?? null,
    }));
  } catch {
    return [];
  }
}
