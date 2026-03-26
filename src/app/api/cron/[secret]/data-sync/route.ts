// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import {
  db,
  competitions,
  competitionSeasons,
  seasons,
  clubs,
  matches,
  leagueStandings,
  venues,
} from '@/lib/db';
import {
  getLeagues,
  getTeams,
  getFixtures,
  getStandings,
  mapFixtureStatus,
} from '@/lib/api/football-api';
import { COMPETITIONS } from '@/lib/constants/competitions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for full sync

const CRON_KEY = process.env.CRON_KEY || process.env.ADMIN_API_KEY || 'dev-key';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ===== STEP 1: Sync competitions + seasons =====

async function syncCompetitionsAndSeasons() {
  const errors: string[] = [];
  const competitionMap = new Map<number, { competitionId: string; competitionSeasonId: string; season: number }>();

  for (const comp of COMPETITIONS) {
    try {
      // Upsert competition
      const existing = await db
        .select()
        .from(competitions)
        .where(eq(competitions.apiFootballId, comp.apiFootballId))
        .limit(1);

      let competitionId: string;

      if (existing.length > 0) {
        competitionId = existing[0].id;
        await db
          .update(competitions)
          .set({
            name: comp.name,
            shortName: comp.shortName,
            type: comp.type,
            country: comp.country,
            countryCode: comp.countryCode,
            tier: comp.tier,
            updatedAt: new Date(),
          })
          .where(eq(competitions.id, competitionId));
      } else {
        const [inserted] = await db
          .insert(competitions)
          .values({
            name: comp.name,
            slug: comp.slug,
            shortName: comp.shortName,
            type: comp.type,
            country: comp.country,
            countryCode: comp.countryCode,
            tier: comp.tier,
            apiFootballId: comp.apiFootballId,
            isActive: true,
          })
          .returning({ id: competitions.id });
        competitionId = inserted.id;
      }

      // Get current season from API
      let seasonYear = new Date().getFullYear();
      try {
        const leagueData = await getLeagues({ id: comp.apiFootballId });
        if (leagueData.response.length > 0) {
          const apiLeague = leagueData.response[0];
          const currentSeason = apiLeague.seasons.find((s) => s.current);
          if (currentSeason) {
            seasonYear = currentSeason.year;
          }
          // Update logo if available
          if (apiLeague.league.logo) {
            await db
              .update(competitions)
              .set({ logoUrl: apiLeague.league.logo })
              .where(eq(competitions.id, competitionId));
          }
        }
      } catch (err) {
        console.warn(`Could not fetch league info for ${comp.name}, using default year ${seasonYear}:`, err);
      }

      // Upsert season
      const existingSeason = await db
        .select()
        .from(seasons)
        .where(eq(seasons.year, seasonYear))
        .limit(1);

      let seasonId: string;

      if (existingSeason.length > 0) {
        seasonId = existingSeason[0].id;
      } else {
        const seasonName = `${seasonYear}/${String(seasonYear + 1).slice(2)}`;
        const [inserted] = await db
          .insert(seasons)
          .values({
            year: seasonYear,
            name: seasonName,
            isCurrent: true,
          })
          .returning({ id: seasons.id });
        seasonId = inserted.id;
      }

      // Upsert competition season
      const existingCS = await db
        .select()
        .from(competitionSeasons)
        .where(
          and(
            eq(competitionSeasons.competitionId, competitionId),
            eq(competitionSeasons.seasonId, seasonId),
          ),
        )
        .limit(1);

      let competitionSeasonId: string;

      if (existingCS.length > 0) {
        competitionSeasonId = existingCS[0].id;
        await db
          .update(competitionSeasons)
          .set({
            apiFootballSeason: seasonYear,
            status: 'active',
          })
          .where(eq(competitionSeasons.id, competitionSeasonId));
      } else {
        const [inserted] = await db
          .insert(competitionSeasons)
          .values({
            competitionId,
            seasonId,
            apiFootballSeason: seasonYear,
            status: 'active',
          })
          .returning({ id: competitionSeasons.id });
        competitionSeasonId = inserted.id;
      }

      competitionMap.set(comp.apiFootballId, {
        competitionId,
        competitionSeasonId,
        season: seasonYear,
      });

      console.log(`Synced competition: ${comp.name} (season ${seasonYear})`);
    } catch (err) {
      const msg = `Failed to sync competition ${comp.name}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { competitionMap, errors };
}

// ===== STEP 2: Sync clubs + venues =====

async function syncClubs(
  competitionMap: Map<number, { competitionId: string; competitionSeasonId: string; season: number }>,
) {
  const errors: string[] = [];
  let clubsUpserted = 0;
  let venuesUpserted = 0;

  console.log(`[syncClubs] competitionMap has ${competitionMap.size} entries`);
  console.log(`[syncClubs] COMPETITIONS has ${COMPETITIONS.length} items`);
  for (const comp of COMPETITIONS) {
    console.log(`[syncClubs] Looking up ${comp.name} (apiFootballId=${comp.apiFootballId})...`);
    const mapped = competitionMap.get(comp.apiFootballId);
    if (!mapped) {
      console.log(`[syncClubs] SKIP: ${comp.name} not in competitionMap`);
      continue;
    }

    try {
      console.log(`[syncClubs] Fetching teams for ${comp.name} (league=${comp.apiFootballId}, season=${mapped.season})...`);
      const teamsData = await getTeams(comp.apiFootballId, mapped.season);
      console.log(`Got ${teamsData.response.length} teams for ${comp.name}`, teamsData.errors);

      for (const teamEntry of teamsData.response) {
        const { team, venue } = teamEntry;

        try {
          // Upsert venue
          if (venue && venue.id) {
            const venueSlug = slugify(venue.name);
            const existingVenue = await db
              .select()
              .from(venues)
              .where(eq(venues.externalId, String(venue.id)))
              .limit(1);

            if (existingVenue.length > 0) {
              await db
                .update(venues)
                .set({
                  name: venue.name,
                  city: venue.city,
                  capacity: venue.capacity,
                  surfaceType: venue.surface,
                  imageUrl: venue.image,
                  updatedAt: new Date(),
                })
                .where(eq(venues.id, existingVenue[0].id));
            } else {
              await db.insert(venues).values({
                externalId: String(venue.id),
                name: venue.name,
                slug: venueSlug,
                city: venue.city,
                country: team.country,
                capacity: venue.capacity,
                surfaceType: venue.surface,
                imageUrl: venue.image,
              });
            }
            venuesUpserted++;
          }

          // Upsert club
          const clubSlug = slugify(team.name);
          const existingClub = await db
            .select()
            .from(clubs)
            .where(eq(clubs.apiFootballId, team.id))
            .limit(1);

          if (existingClub.length > 0) {
            await db
              .update(clubs)
              .set({
                name: team.name,
                code: team.code,
                country: team.country,
                stadium: venue?.name ?? null,
                logoUrl: team.logo,
                updatedAt: new Date(),
              })
              .where(eq(clubs.id, existingClub[0].id));
          } else {
            await db.insert(clubs).values({
              apiFootballId: team.id,
              name: team.name,
              slug: clubSlug,
              code: team.code,
              country: team.country,
              founded: team.founded,
              stadium: venue?.name ?? null,
              logoUrl: team.logo,
              isActive: true,
            });
          }
          clubsUpserted++;
        } catch (err) {
          const msg = `Failed to upsert club ${team.name}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(msg);
          errors.push(msg);
        }
      }

      console.log(`Synced ${teamsData.response.length} clubs for ${comp.name}`);
    } catch (err) {
      const msg = `Failed to sync clubs for ${comp.name}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { clubsUpserted, venuesUpserted, errors };
}

// ===== STEP 3: Sync standings =====

async function syncStandings(
  competitionMap: Map<number, { competitionId: string; competitionSeasonId: string; season: number }>,
) {
  const errors: string[] = [];
  let standingsUpserted = 0;

  // Only sync standings for league-type competitions
  const leagueComps = COMPETITIONS.filter((c) => c.type === 'league');

  for (const comp of leagueComps) {
    const mapped = competitionMap.get(comp.apiFootballId);
    if (!mapped) continue;

    try {
      const standingsData = await getStandings(comp.apiFootballId, mapped.season);

      if (standingsData.response.length === 0) continue;

      const standingGroups = standingsData.response[0].league.standings;

      for (const group of standingGroups) {
        for (const standing of group) {
          try {
            // Find the club by apiFootballId
            const club = await db
              .select()
              .from(clubs)
              .where(eq(clubs.apiFootballId, standing.team.id))
              .limit(1);

            if (club.length === 0) {
              console.warn(`Club not found for standing: ${standing.team.name} (API ID ${standing.team.id})`);
              continue;
            }

            const clubId = club[0].id;
            const formArray = standing.form ? standing.form.split('') : null;

            // Upsert standing
            const existingStanding = await db
              .select()
              .from(leagueStandings)
              .where(
                and(
                  eq(leagueStandings.competitionSeasonId, mapped.competitionSeasonId),
                  eq(leagueStandings.clubId, clubId),
                ),
              )
              .limit(1);

            if (existingStanding.length > 0) {
              await db
                .update(leagueStandings)
                .set({
                  position: standing.rank,
                  played: standing.all.played,
                  won: standing.all.win,
                  drawn: standing.all.draw,
                  lost: standing.all.lose,
                  goalsFor: standing.all.goals.for,
                  goalsAgainst: standing.all.goals.against,
                  goalDifference: standing.goalsDiff,
                  points: standing.points,
                  form: formArray,
                  group: standing.group || null,
                  updatedAt: new Date(),
                })
                .where(eq(leagueStandings.id, existingStanding[0].id));
            } else {
              await db.insert(leagueStandings).values({
                competitionSeasonId: mapped.competitionSeasonId,
                clubId,
                position: standing.rank,
                played: standing.all.played,
                won: standing.all.win,
                drawn: standing.all.draw,
                lost: standing.all.lose,
                goalsFor: standing.all.goals.for,
                goalsAgainst: standing.all.goals.against,
                goalDifference: standing.goalsDiff,
                points: standing.points,
                form: formArray,
                group: standing.group || null,
              });
            }
            standingsUpserted++;
          } catch (err) {
            const msg = `Failed to upsert standing for ${standing.team.name}: ${err instanceof Error ? err.message : String(err)}`;
            console.error(msg);
            errors.push(msg);
          }
        }
      }

      console.log(`Synced standings for ${comp.name}`);
    } catch (err) {
      const msg = `Failed to sync standings for ${comp.name}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { standingsUpserted, errors };
}

// ===== STEP 4: Sync fixtures =====

async function syncFixtures(
  competitionMap: Map<number, { competitionId: string; competitionSeasonId: string; season: number }>,
) {
  const errors: string[] = [];
  let matchesUpserted = 0;

  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 7);
  const to = new Date(now);
  to.setDate(to.getDate() + 14);

  const fromStr = formatDate(from);
  const toStr = formatDate(to);

  for (const comp of COMPETITIONS) {
    const mapped = competitionMap.get(comp.apiFootballId);
    if (!mapped) continue;

    try {
      const fixturesData = await getFixtures({
        league: comp.apiFootballId,
        season: mapped.season,
        from: fromStr,
        to: toStr,
      });

      for (const fix of fixturesData.response) {
        try {
          // Resolve home and away clubs
          const [homeClub] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.apiFootballId, fix.teams.home.id))
            .limit(1);

          const [awayClub] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.apiFootballId, fix.teams.away.id))
            .limit(1);

          if (!homeClub || !awayClub) {
            console.warn(
              `Skipping fixture ${fix.fixture.id}: missing club (home=${fix.teams.home.name}, away=${fix.teams.away.name})`,
            );
            continue;
          }

          // Resolve venue if present
          let venueId: string | null = null;
          if (fix.fixture.venue.id) {
            const [matchVenue] = await db
              .select()
              .from(venues)
              .where(eq(venues.externalId, String(fix.fixture.venue.id)))
              .limit(1);
            if (matchVenue) venueId = matchVenue.id;
          }

          // Generate slug: "arsenal-vs-chelsea-2026-03-25"
          const matchDate = formatDate(new Date(fix.fixture.date));
          const matchSlug = `${slugify(fix.teams.home.name)}-vs-${slugify(fix.teams.away.name)}-${matchDate}`;

          const status = mapFixtureStatus(fix.fixture.status.short);

          // Extract matchday number from round string if possible (e.g. "Regular Season - 15")
          const matchdayMatch = fix.league.round.match(/(\d+)$/);
          const matchday = matchdayMatch ? parseInt(matchdayMatch[1], 10) : null;

          // Upsert match
          const existingMatch = await db
            .select()
            .from(matches)
            .where(eq(matches.apiFootballId, fix.fixture.id))
            .limit(1);

          const matchData = {
            competitionSeasonId: mapped.competitionSeasonId,
            venueId,
            apiFootballId: fix.fixture.id,
            matchday,
            round: fix.league.round,
            homeClubId: homeClub.id,
            awayClubId: awayClub.id,
            kickoff: new Date(fix.fixture.date),
            status,
            minute: fix.fixture.status.elapsed,
            homeScore: fix.goals.home,
            awayScore: fix.goals.away,
            homeScoreHt: fix.score.halftime.home,
            awayScoreHt: fix.score.halftime.away,
            homeScoreEt: fix.score.extratime.home,
            awayScoreEt: fix.score.extratime.away,
            homePenalties: fix.score.penalty.home,
            awayPenalties: fix.score.penalty.away,
            referee: fix.fixture.referee,
            slug: matchSlug,
            updatedAt: new Date(),
          };

          if (existingMatch.length > 0) {
            await db
              .update(matches)
              .set(matchData)
              .where(eq(matches.id, existingMatch[0].id));
          } else {
            await db.insert(matches).values(matchData);
          }
          matchesUpserted++;
        } catch (err) {
          const msg = `Failed to upsert fixture ${fix.fixture.id}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(msg);
          errors.push(msg);
        }
      }

      console.log(`Synced ${fixturesData.response.length} fixtures for ${comp.name}`);
    } catch (err) {
      const msg = `Failed to sync fixtures for ${comp.name}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }

  return { matchesUpserted, errors };
}

// ===== ROUTE HANDLER =====

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ secret: string }> },
) {
  try {
    const { secret } = await params;

    if (secret !== CRON_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting football data sync from API-Football...');
    const startTime = Date.now();

    // Step 1: Competitions + Seasons
    console.log('Step 1: Syncing competitions and seasons...');
    const { competitionMap, errors: compErrors } = await syncCompetitionsAndSeasons();

    // Step 2: Clubs + Venues
    console.log('Step 2: Syncing clubs and venues...');
    const { clubsUpserted, venuesUpserted, errors: clubErrors } = await syncClubs(competitionMap);

    // Step 3: Standings
    console.log('Step 3: Syncing league standings...');
    const { standingsUpserted, errors: standingErrors } = await syncStandings(competitionMap);

    // Step 4: Fixtures
    console.log('Step 4: Syncing fixtures...');
    const { matchesUpserted, errors: fixtureErrors } = await syncFixtures(competitionMap);

    const allErrors = [...compErrors, ...clubErrors, ...standingErrors, ...fixtureErrors];
    const duration = Date.now() - startTime;

    console.log(`Football data sync completed in ${duration}ms with ${allErrors.length} errors`);

    return NextResponse.json({
      success: allErrors.length === 0,
      source: 'API-Football',
      competitions: competitionMap.size,
      clubsUpserted,
      venuesUpserted,
      standingsUpserted,
      matchesUpserted,
      errors: allErrors,
      duration_ms: duration,
    });
  } catch (error) {
    console.error('Football data sync failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
