import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { DriverStandingsTable } from '@/components/standings/DriverStandingsTable';
import { ConstructorStandingsTable } from '@/components/standings/ConstructorStandingsTable';
import { ChampionshipChart } from '@/components/standings/ChampionshipChart';
import { db, seasons, driverStandings, constructorStandings, drivers, teams, races } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import type { DriverStanding, ConstructorStanding } from '@/types';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Standings 2026 - League Tables & Top Scorers',
  'Live football 2026 league standings. Club points, wins, goals, goal difference, and interactive league table charts.',
  '/standings',
  ['football standings', 'league table', 'Premier League table', 'top scorers', 'football leaderboard', 'football 2026 standings', 'league standings']
);

async function getStandings() {
  // Get 2026 season
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, 2026))
    .limit(1);

  if (!season) {
    return { driverStandingsList: [], constructorStandingsList: [], chartData: [], chartDrivers: [] };
  }

  // Get driver standings with driver and team info
  const driverStandingsData = await db
    .select({
      id: driverStandings.id,
      seasonId: driverStandings.seasonId,
      driverId: driverStandings.driverId,
      raceId: driverStandings.raceId,
      position: driverStandings.position,
      points: driverStandings.points,
      wins: driverStandings.wins,
      podiums: driverStandings.podiums,
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
        slug: drivers.slug,
        code: drivers.code,
        number: drivers.number,
        nationality: drivers.nationality,
        headshotUrl: drivers.headshotUrl,
        helmetImageUrl: drivers.helmetImageUrl,
        worldChampionships: drivers.worldChampionships,
        raceWins: drivers.raceWins,
        podiums: drivers.podiums,
        polePositions: drivers.polePositions,
        fastestLaps: drivers.fastestLaps,
        careerPoints: drivers.careerPoints,
        isActive: drivers.isActive,
        currentTeamId: drivers.currentTeamId,
      },
    })
    .from(driverStandings)
    .innerJoin(drivers, eq(driverStandings.driverId, drivers.id))
    .where(eq(driverStandings.seasonId, season.id))
    .orderBy(asc(driverStandings.position));

  // Get team info for each driver
  const driverStandingsList: DriverStanding[] = await Promise.all(
    driverStandingsData.map(async (standing) => {
      let currentTeam = undefined;
      if (standing.driver.currentTeamId) {
        const [team] = await db
          .select({
            id: teams.id,
            name: teams.name,
            slug: teams.slug,
            primaryColor: teams.primaryColor,
            worldChampionships: teams.worldChampionships,
            isActive: teams.isActive,
          })
          .from(teams)
          .where(eq(teams.id, standing.driver.currentTeamId))
          .limit(1);
        currentTeam = {
          id: team.id,
          name: team.name,
          slug: team.slug,
          primaryColor: team.primaryColor || undefined,
          worldChampionships: team.worldChampionships || 0,
          isActive: team.isActive ?? true,
        };
      }

      return {
        id: standing.id,
        seasonId: standing.seasonId || '',
        driverId: standing.driverId || '',
        position: standing.position,
        points: parseFloat(standing.points || '0'),
        wins: standing.wins || 0,
        podiums: standing.podiums || 0,
        driver: {
          id: standing.driver.id,
          firstName: standing.driver.firstName,
          lastName: standing.driver.lastName,
          slug: standing.driver.slug,
          code: standing.driver.code || undefined,
          number: standing.driver.number || undefined,
          nationality: standing.driver.nationality || undefined,
          headshotUrl: standing.driver.headshotUrl || undefined,
          helmetImageUrl: standing.driver.helmetImageUrl || undefined,
          worldChampionships: standing.driver.worldChampionships || 0,
          raceWins: standing.driver.raceWins || 0,
          podiums: standing.driver.podiums || 0,
          polePositions: standing.driver.polePositions || 0,
          fastestLaps: standing.driver.fastestLaps || 0,
          careerPoints: parseFloat(standing.driver.careerPoints || '0'),
          isActive: standing.driver.isActive ?? true,
          currentTeamId: standing.driver.currentTeamId || undefined,
          currentTeam,
        },
      };
    })
  );

  // Get constructor standings with team info
  const constructorStandingsData = await db
    .select({
      id: constructorStandings.id,
      seasonId: constructorStandings.seasonId,
      teamId: constructorStandings.teamId,
      position: constructorStandings.position,
      points: constructorStandings.points,
      wins: constructorStandings.wins,
      team: {
        id: teams.id,
        name: teams.name,
        slug: teams.slug,
        primaryColor: teams.primaryColor,
        worldChampionships: teams.worldChampionships,
        carImageUrl: teams.carImageUrl,
        isActive: teams.isActive,
      },
    })
    .from(constructorStandings)
    .innerJoin(teams, eq(constructorStandings.teamId, teams.id))
    .where(eq(constructorStandings.seasonId, season.id))
    .orderBy(asc(constructorStandings.position));

  const constructorStandingsList: ConstructorStanding[] = constructorStandingsData.map((standing) => ({
    id: standing.id,
    seasonId: standing.seasonId || '',
    teamId: standing.teamId || '',
    position: standing.position,
    points: parseFloat(standing.points || '0'),
    wins: standing.wins || 0,
    team: {
      id: standing.team.id,
      name: standing.team.name,
      slug: standing.team.slug,
      primaryColor: standing.team.primaryColor || undefined,
      worldChampionships: standing.team.worldChampionships || 0,
      carImageUrl: standing.team.carImageUrl || undefined,
      isActive: standing.team.isActive ?? true,
    },
  }));

  // Build championship chart data
  // Get all standings rows with race info for the chart
  const allStandingsForChart = await db
    .select({
      driverId: driverStandings.driverId,
      raceId: driverStandings.raceId,
      points: driverStandings.points,
      driverCode: drivers.code,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
      teamColor: teams.primaryColor,
      raceRound: races.round,
      raceName: races.name,
    })
    .from(driverStandings)
    .innerJoin(drivers, eq(driverStandings.driverId, drivers.id))
    .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
    .innerJoin(races, eq(driverStandings.raceId, races.id))
    .where(eq(driverStandings.seasonId, season.id))
    .orderBy(asc(races.round));

  // Group by round for recharts format
  const roundsMap = new Map<number, Record<string, string | number>>();
  const driverInfoMap = new Map<string, { code: string; name: string; color: string; finalPoints: number }>();

  for (const row of allStandingsForChart) {
    const round = row.raceRound;
    const code = row.driverCode || `${row.driverFirstName[0]}${row.driverLastName[0]}`;
    const points = parseFloat(row.points || '0');

    if (!roundsMap.has(round)) {
      roundsMap.set(round, { round: `R${round}`, roundName: row.raceName });
    }
    roundsMap.get(round)![code] = points;

    // Track driver info (last entry wins for finalPoints)
    driverInfoMap.set(code, {
      code,
      name: `${row.driverFirstName} ${row.driverLastName}`,
      color: row.teamColor || '#666666',
      finalPoints: points,
    });
  }

  const chartData = Array.from(roundsMap.values()).sort(
    (a, b) => parseInt(String(a.round).replace('R', '')) - parseInt(String(b.round).replace('R', ''))
  );
  const chartDrivers = Array.from(driverInfoMap.values());

  return { driverStandingsList, constructorStandingsList, chartData, chartDrivers };
}

export default async function StandingsPage() {
  const { driverStandingsList, constructorStandingsList, chartData, chartDrivers } = await getStandings();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Championship Standings</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            2026 football league standings
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="drivers" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="drivers">Drivers</TabsTrigger>
            <TabsTrigger value="constructors">Constructors</TabsTrigger>
            <TabsTrigger value="chart">Battle Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <DriverStandingsTable standings={driverStandingsList} />
          </TabsContent>

          <TabsContent value="constructors">
            <ConstructorStandingsTable standings={constructorStandingsList} />
          </TabsContent>

          <TabsContent value="chart">
            <ChampionshipChart data={chartData} drivers={chartDrivers} />
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Standings are updated after each race weekend.
          {driverStandingsList.length === 0 && ' No standings data available.'}
          {driverStandingsList.length > 0 && driverStandingsList[0].points === 0 && ' The 2026 season has not yet started.'}
        </p>
      </div>
    </div>
  );
}
