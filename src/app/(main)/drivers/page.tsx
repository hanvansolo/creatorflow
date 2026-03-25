import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Users, Trophy, Flag, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { db, drivers, teams, driverStandings, seasons } from '@/lib/db';
import { eq, and, asc, desc } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Players 2026 - Complete Squads, Profiles & Career Stats',
  'Every football player in the top leagues. Full profiles with career statistics, goals, assists, trophy history, and head-to-head comparisons.',
  '/drivers',
  ['football players', 'player profiles', 'player stats', 'football squads 2026', '2026 players', 'player comparison', 'football career statistics']
);

export default async function DriversPage() {
  // Get all active drivers with their teams
  const allDrivers = await db
    .select({
      id: drivers.id,
      slug: drivers.slug,
      code: drivers.code,
      firstName: drivers.firstName,
      lastName: drivers.lastName,
      headshotUrl: drivers.headshotUrl,
      number: drivers.number,
      nationality: drivers.nationality,
      raceWins: drivers.raceWins,
      podiums: drivers.podiums,
      careerPoints: drivers.careerPoints,
      teamId: teams.id,
      teamName: teams.name,
      teamColor: teams.primaryColor,
    })
    .from(drivers)
    .leftJoin(teams, eq(drivers.currentTeamId, teams.id))
    .where(eq(drivers.isActive, true))
    .orderBy(asc(teams.name), asc(drivers.lastName));

  // Get 2026 season standings for positions
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, 2026))
    .limit(1);

  let standingsMap: Record<string, { position: number | null; points: number }> = {};
  if (season) {
    const standings = await db
      .select({
        driverId: driverStandings.driverId,
        position: driverStandings.position,
        points: driverStandings.points,
      })
      .from(driverStandings)
      .where(eq(driverStandings.seasonId, season.id));

    standingsMap = standings.reduce((acc, s) => {
      if (s.driverId) {
        acc[s.driverId] = {
          position: s.position,
          points: parseFloat(s.points || '0'),
        };
      }
      return acc;
    }, {} as Record<string, { position: number | null; points: number }>);
  }

  // Group drivers by team
  const driversByTeam = allDrivers.reduce((acc, driver) => {
    const teamName = driver.teamName || 'No Team';
    if (!acc[teamName]) {
      acc[teamName] = {
        color: driver.teamColor,
        drivers: [],
      };
    }
    acc[teamName].drivers.push(driver);
    return acc;
  }, {} as Record<string, { color: string | null; drivers: typeof allDrivers }>);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Drivers</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            All football players for the 2026 season
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {Object.entries(driversByTeam).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-zinc-400">No drivers found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(driversByTeam).map(([teamName, { color, drivers: teamDrivers }]) => (
              <div key={teamName}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color || '#666' }}
                  />
                  <h2 className="text-xl font-bold text-white">{teamName}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamDrivers.map((driver) => {
                    const standing = standingsMap[driver.id];
                    return (
                      <Link
                        key={driver.id}
                        href={`/drivers/${driver.slug}`}
                        className="block group"
                      >
                        <Card className="hover:border-zinc-600 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              {/* Driver Image */}
                              <div
                                className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 border-2"
                                style={{ borderColor: color || '#666' }}
                              >
                                {driver.headshotUrl ? (
                                  <Image
                                    src={driver.headshotUrl}
                                    alt={`${driver.firstName} ${driver.lastName}`}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                                    {driver.code}
                                  </div>
                                )}
                              </div>

                              {/* Driver Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {driver.nationality && (
                                    <CountryFlag
                                      nationality={driver.nationality}
                                      size="sm"
                                    />
                                  )}
                                  <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                                    {driver.firstName} {driver.lastName}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    style={{
                                      borderColor: color || '#666',
                                      color: color || '#666',
                                    }}
                                  >
                                    {driver.code}
                                  </Badge>
                                  {driver.number && (
                                    <span className="text-sm text-zinc-500">
                                      #{driver.number}
                                    </span>
                                  )}
                                </div>

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                  {standing && (
                                    <span className="flex items-center gap-1">
                                      <Trophy className="h-3 w-3" />
                                      P{standing.position} ({standing.points} pts)
                                    </span>
                                  )}
                                  {driver.raceWins && driver.raceWins > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Flag className="h-3 w-3" />
                                      {driver.raceWins} wins
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Arrow */}
                              <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
