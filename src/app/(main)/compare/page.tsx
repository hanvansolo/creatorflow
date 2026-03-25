import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, GitCompareArrows } from 'lucide-react';
import { db, drivers, teams, seasons, driverStandings, raceResults, races } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';
import { DriverSelector } from '@/components/compare/DriverSelector';
import { StatComparisonBar } from '@/components/compare/StatComparisonBar';
import { SeasonFormChart } from '@/components/compare/SeasonFormChart';
import { HeadToHeadRecord } from '@/components/compare/HeadToHeadRecord';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { F1_TEAMS } from '@/lib/constants/teams';
import { generateBaseMetadata, generateAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ d1?: string; d2?: string }> }): Promise<Metadata> {
  const { d1, d2 } = await searchParams;

  let driver1Name = '';
  let driver2Name = '';

  if (d1) {
    const [d] = await db.select({ firstName: drivers.firstName, lastName: drivers.lastName }).from(drivers).where(eq(drivers.slug, d1)).limit(1);
    if (d) driver1Name = `${d.firstName} ${d.lastName}`;
  }
  if (d2) {
    const [d] = await db.select({ firstName: drivers.firstName, lastName: drivers.lastName }).from(drivers).where(eq(drivers.slug, d2)).limit(1);
    if (d) driver2Name = `${d.firstName} ${d.lastName}`;
  }

  if (driver1Name && driver2Name) {
    return {
      ...generateBaseMetadata({
        title: `${driver1Name} vs ${driver2Name} - Driver Comparison`,
        description: `Head-to-head comparison of ${driver1Name} and ${driver2Name}. Career stats, season form, and race-by-race performance.`,
        tags: [driver1Name, driver2Name, 'player comparison', 'football head to head'],
      }),
      alternates: generateAlternates(`/compare?d1=${d1}&d2=${d2}`),
    };
  }

  return {
    ...generateBaseMetadata({
      title: 'Compare Football Players - Head-to-Head Stats',
      description: 'Compare any two football players head-to-head. Career statistics, goals, assists, trophies, and season performance.',
      tags: ['player comparison', 'football head to head', 'player stats'],
    }),
    alternates: generateAlternates('/compare'),
  };
}

async function getAllDrivers() {
  const allDrivers = await db
    .select({
      slug: drivers.slug,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      code: drivers.code,
      teamSlug: teams.slug,
    })
    .from(drivers)
    .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
    .where(eq(drivers.isActive, true))
    .orderBy(asc(drivers.lastName));

  return allDrivers.map((d) => ({
    slug: d.slug,
    name: `${d.firstName} ${d.lastName}`,
    code: d.code || `${d.firstName[0]}${d.lastName[0]}`,
    teamColor: d.teamSlug ? (F1_TEAMS[d.teamSlug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666',
  }));
}

async function getDriverData(slug: string) {
  const [driver] = await db
    .select()
    .from(drivers)
    .where(eq(drivers.slug, slug))
    .limit(1);

  if (!driver) return null;

  let team = null;
  if (driver.currentTeamId) {
    const [t] = await db.select().from(teams).where(eq(teams.id, driver.currentTeamId)).limit(1);
    team = t;
  }

  return { driver, team };
}

async function getSeasonFormData(driverId1: string, driverId2: string, code1: string, code2: string) {
  const [season] = await db.select().from(seasons).where(eq(seasons.year, 2026)).limit(1);
  if (!season) return [];

  const standings1 = await db
    .select({ points: driverStandings.points, raceId: driverStandings.raceId })
    .from(driverStandings)
    .where(and(eq(driverStandings.seasonId, season.id), eq(driverStandings.driverId, driverId1)));

  const standings2 = await db
    .select({ points: driverStandings.points, raceId: driverStandings.raceId })
    .from(driverStandings)
    .where(and(eq(driverStandings.seasonId, season.id), eq(driverStandings.driverId, driverId2)));

  // Get race rounds
  const allRaceIds = new Set([...standings1.map(s => s.raceId), ...standings2.map(s => s.raceId)].filter(Boolean));
  if (allRaceIds.size === 0) return [];

  const raceData = await db
    .select({ id: races.id, round: races.round, name: races.name })
    .from(races)
    .where(eq(races.seasonId, season.id))
    .orderBy(asc(races.round));

  const s1Map = new Map(standings1.map(s => [s.raceId, parseFloat(s.points || '0')]));
  const s2Map = new Map(standings2.map(s => [s.raceId, parseFloat(s.points || '0')]));

  return raceData
    .filter(r => s1Map.has(r.id) || s2Map.has(r.id))
    .map(r => ({
      round: `R${r.round}`,
      roundName: r.name,
      [code1]: s1Map.get(r.id) ?? 0,
      [code2]: s2Map.get(r.id) ?? 0,
    }));
}

async function getHeadToHeadRecords(driverId1: string, driverId2: string) {
  const [season] = await db.select().from(seasons).where(eq(seasons.year, 2026)).limit(1);
  if (!season) return [];

  const results1 = await db
    .select({
      raceId: raceResults.raceId,
      position: raceResults.position,
      points: raceResults.points,
    })
    .from(raceResults)
    .innerJoin(races, eq(raceResults.raceId, races.id))
    .where(and(eq(raceResults.driverId, driverId1), eq(races.seasonId, season.id)));

  const results2 = await db
    .select({
      raceId: raceResults.raceId,
      position: raceResults.position,
      points: raceResults.points,
    })
    .from(raceResults)
    .innerJoin(races, eq(raceResults.raceId, races.id))
    .where(and(eq(raceResults.driverId, driverId2), eq(races.seasonId, season.id)));

  const r1Map = new Map(results1.map(r => [r.raceId, r]));
  const r2Map = new Map(results2.map(r => [r.raceId, r]));

  // Get races where both competed
  const commonRaceIds = [...r1Map.keys()].filter(id => r2Map.has(id));
  if (commonRaceIds.length === 0) return [];

  const raceInfo = await db
    .select({ id: races.id, name: races.name, round: races.round })
    .from(races)
    .where(eq(races.seasonId, season.id))
    .orderBy(asc(races.round));

  return raceInfo
    .filter(r => commonRaceIds.includes(r.id))
    .map(r => ({
      raceName: r.name,
      round: r.round,
      driver1Pos: r1Map.get(r.id)?.position ?? null,
      driver2Pos: r2Map.get(r.id)?.position ?? null,
      driver1Points: parseFloat(r1Map.get(r.id)?.points || '0'),
      driver2Points: parseFloat(r2Map.get(r.id)?.points || '0'),
    }));
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ d1?: string; d2?: string }>;
}) {
  const { d1, d2 } = await searchParams;
  const allDrivers = await getAllDrivers();

  const data1 = d1 ? await getDriverData(d1) : null;
  const data2 = d2 ? await getDriverData(d2) : null;

  const driver1 = data1?.driver;
  const driver2 = data2?.driver;
  const team1 = data1?.team;
  const team2 = data2?.team;

  const color1 = team1?.slug ? (F1_TEAMS[team1.slug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666';
  const color2 = team2?.slug ? (F1_TEAMS[team2.slug as keyof typeof F1_TEAMS]?.primaryColor || '#666') : '#666';

  const code1 = driver1?.code || (driver1 ? `${driver1.firstName[0]}${driver1.lastName[0]}` : 'D1');
  const code2 = driver2?.code || (driver2 ? `${driver2.firstName[0]}${driver2.lastName[0]}` : 'D2');

  // Get comparison data if both drivers selected
  let seasonFormData: Record<string, string | number>[] = [];
  let h2hRecords: { raceName: string; round: number; driver1Pos: number | null; driver2Pos: number | null; driver1Points: number; driver2Points: number }[] = [];

  if (driver1 && driver2) {
    seasonFormData = await getSeasonFormData(driver1.id, driver2.id, code1, code2);
    h2hRecords = await getHeadToHeadRecords(driver1.id, driver2.id);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/standings"
            className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Standings
          </Link>
          <div className="flex items-center gap-3">
            <GitCompareArrows className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Head to Head</h1>
          </div>
          <p className="mt-2 text-zinc-400">Compare any two drivers side by side</p>

          {/* Driver Selectors */}
          <div className="mt-6 flex gap-4">
            <DriverSelector
              drivers={allDrivers}
              paramName="d1"
              selected={d1 || ''}
              label="Driver 1"
            />
            <div className="flex items-end pb-2.5">
              <span className="text-sm font-bold text-zinc-500">VS</span>
            </div>
            <DriverSelector
              drivers={allDrivers}
              paramName="d2"
              selected={d2 || ''}
              label="Driver 2"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {!driver1 || !driver2 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-16">
            <GitCompareArrows className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-lg font-medium text-zinc-400">Select two drivers to compare</p>
            <p className="mt-1 text-sm text-zinc-500">
              Choose drivers from the dropdowns above to see a detailed comparison.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Driver Cards */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { driver: driver1, team: team1, color: color1 },
                { driver: driver2, team: team2, color: color2 },
              ].map(({ driver, team, color }) => (
                <Link
                  key={driver.id}
                  href={`/drivers/${driver.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:bg-zinc-800/50"
                  style={{ borderTopColor: color, borderTopWidth: '2px' }}
                >
                  {driver.headshotUrl ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-full bg-zinc-800">
                      <Image src={driver.headshotUrl} alt={`${driver.firstName} ${driver.lastName}`} fill className="object-cover object-top" sizes="56px" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-400">
                      {driver.code || `${driver.firstName[0]}${driver.lastName[0]}`}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {driver.number && (
                        <span className="text-lg font-bold" style={{ color }}>#{driver.number}</span>
                      )}
                      <p className="font-medium text-white">{driver.firstName} {driver.lastName}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                      {driver.nationality && <CountryFlag nationality={driver.nationality} size="sm" />}
                      {team?.name || 'No team'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Career Stats Comparison */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Career Statistics</h2>
              <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
                <StatComparisonBar label="Championships" value1={driver1.worldChampionships || 0} value2={driver2.worldChampionships || 0} color1={color1} color2={color2} />
                <StatComparisonBar label="Race Wins" value1={driver1.raceWins || 0} value2={driver2.raceWins || 0} color1={color1} color2={color2} />
                <StatComparisonBar label="Podiums" value1={driver1.podiums || 0} value2={driver2.podiums || 0} color1={color1} color2={color2} />
                <StatComparisonBar label="Pole Positions" value1={driver1.polePositions || 0} value2={driver2.polePositions || 0} color1={color1} color2={color2} />
                <StatComparisonBar label="Fastest Laps" value1={driver1.fastestLaps || 0} value2={driver2.fastestLaps || 0} color1={color1} color2={color2} />
                <StatComparisonBar
                  label="Career Points"
                  value1={parseFloat(driver1.careerPoints || '0')}
                  value2={parseFloat(driver2.careerPoints || '0')}
                  color1={color1}
                  color2={color2}
                  format={(v) => v.toLocaleString()}
                />
              </div>
            </div>

            {/* Season Form Chart */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">2026 Season Form</h2>
              <SeasonFormChart
                data={seasonFormData}
                driver1={{ code: code1, name: `${driver1.firstName} ${driver1.lastName}`, color: color1 }}
                driver2={{ code: code2, name: `${driver2.firstName} ${driver2.lastName}`, color: color2 }}
              />
            </div>

            {/* Head-to-Head Race Record */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">2026 Race Record</h2>
              <HeadToHeadRecord
                records={h2hRecords}
                driver1={{ code: code1, name: `${driver1.firstName} ${driver1.lastName}`, color: color1 }}
                driver2={{ code: code2, name: `${driver2.firstName} ${driver2.lastName}`, color: color2 }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
