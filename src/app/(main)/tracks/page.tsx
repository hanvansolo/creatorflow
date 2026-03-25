import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin, Ruler, CornerUpRight, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { db, circuits, races, seasons } from '@/lib/db';
import { eq, asc, inArray } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

const CURRENT_YEAR = 2026;

export const metadata: Metadata = createPageMetadata(
  `Football Stadiums ${CURRENT_YEAR} - Every Ground in the League`,
  `All football stadiums for the ${CURRENT_YEAR} season. Stadium guides, venue statistics, capacity, and comprehensive ground guides.`,
  '/tracks',
  ['football stadiums', 'football grounds', 'Premier League stadiums', 'stadium guides', 'football venues']
);

async function getCircuits() {
  // Get the current season
  const [season] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.year, CURRENT_YEAR))
    .limit(1);

  if (!season) {
    return { currentCircuits: [], historicCircuits: [] };
  }

  // Get all races for this season to find current circuits
  const seasonRaces = await db
    .select({
      circuitId: races.circuitId,
      round: races.round,
      raceName: races.name,
    })
    .from(races)
    .where(eq(races.seasonId, season.id))
    .orderBy(asc(races.round));

  const currentCircuitIds = seasonRaces.map(r => r.circuitId).filter(Boolean) as string[];

  // Get current calendar circuits with full details
  const currentCircuits = currentCircuitIds.length > 0 ? await db
    .select()
    .from(circuits)
    .where(inArray(circuits.id, currentCircuitIds))
  : [];

  // Sort current circuits by race round
  const circuitRoundMap = new Map(seasonRaces.map(r => [r.circuitId, { round: r.round, raceName: r.raceName }]));
  const sortedCurrentCircuits = currentCircuits
    .map(c => ({
      ...c,
      round: circuitRoundMap.get(c.id)?.round || 0,
      raceName: circuitRoundMap.get(c.id)?.raceName || '',
    }))
    .sort((a, b) => a.round - b.round);

  return { currentCircuits: sortedCurrentCircuits, season };
}

export default async function TracksPage() {
  const { currentCircuits, season } = await getCircuits();

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
            <MapPin className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Football Stadiums {CURRENT_YEAR}</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            {currentCircuits.length} stadiums for the {CURRENT_YEAR} football season
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {currentCircuits.length === 0 ? (
          <Card className="bg-zinc-900/50">
            <CardContent className="py-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-zinc-600" />
              <h2 className="mt-4 text-xl font-semibold text-white">
                No Circuits Available
              </h2>
              <p className="mt-2 text-zinc-400">
                Circuit data for {CURRENT_YEAR} has not been loaded yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentCircuits.map((circuit) => (
              <Link
                key={circuit.id}
                href={`/tracks/${circuit.slug}`}
                className="group"
              >
                <Card className="h-full overflow-hidden transition-all hover:border-emerald-500/50 hover:bg-zinc-800/50">
                  <CardContent className="p-0">
                    {/* Circuit Image/Layout */}
                    <div className="relative aspect-video bg-zinc-800">
                      {circuit.layoutImageUrl ? (
                        <img
                          src={circuit.layoutImageUrl}
                          alt={`${circuit.name} layout`}
                          className="h-full w-full object-contain p-4"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <MapPin className="h-12 w-12 text-zinc-700" />
                        </div>
                      )}
                      {/* Round badge */}
                      {'round' in circuit && circuit.round && (
                        <div className="absolute left-3 top-3">
                          <Badge variant="default" className="bg-emerald-600">
                            Round {circuit.round}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Circuit Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-emerald-400">
                            {circuit.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
                            <CountryFlag nationality={circuit.country} size="sm" />
                            <span>{circuit.country}</span>
                          </div>
                        </div>
                      </div>

                      {'raceName' in circuit && circuit.raceName && (
                        <p className="mt-2 text-xs text-zinc-500">{circuit.raceName}</p>
                      )}

                      {/* Stats */}
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                        {circuit.lengthMeters && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3 w-3" />
                            {(circuit.lengthMeters / 1000).toFixed(3)} km
                          </span>
                        )}
                        {circuit.turns && (
                          <span className="flex items-center gap-1">
                            <CornerUpRight className="h-3 w-3" />
                            {circuit.turns} turns
                          </span>
                        )}
                        {circuit.firstGrandPrixYear && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Since {circuit.firstGrandPrixYear}
                          </span>
                        )}
                      </div>

                      {/* Circuit type badges */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {circuit.circuitType && (
                          <Badge
                            variant={
                              circuit.circuitType === 'street'
                                ? 'warning'
                                : circuit.circuitType === 'permanent'
                                  ? 'success'
                                  : 'default'
                            }
                            className="text-[10px]"
                          >
                            {circuit.circuitType}
                          </Badge>
                        )}
                        {circuit.direction && (
                          <Badge variant="secondary" className="text-[10px]">
                            {circuit.direction === 'clockwise' ? 'Clockwise' : 'Anti-clockwise'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
