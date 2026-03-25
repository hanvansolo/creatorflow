import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, MapPin, ChevronRight, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { db, clubs, competitions, competitionSeasons, leagueStandings } from '@/lib/db';
import { eq, asc, and } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata(
  'Football Clubs - All Teams, Squads & Standings',
  'Every football club in the top leagues. Club profiles with squad rosters, league standings, kits, and club history.',
  '/teams',
  ['football clubs', 'football teams', 'soccer teams', 'club profiles', 'squads', 'league standings', 'Premier League teams']
);

interface TeamsPageProps {
  searchParams: Promise<{ competition?: string }>;
}

async function getClubs(competitionSlug?: string) {
  // If filtering by competition, find the competition and get clubs from standings
  if (competitionSlug) {
    const [comp] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.slug, competitionSlug))
      .limit(1);

    if (comp) {
      const [compSeason] = await db
        .select()
        .from(competitionSeasons)
        .where(and(
          eq(competitionSeasons.competitionId, comp.id),
          eq(competitionSeasons.status, 'active')
        ))
        .limit(1);

      if (compSeason) {
        const standings = await db.query.leagueStandings.findMany({
          where: eq(leagueStandings.competitionSeasonId, compSeason.id),
          with: { club: true },
          orderBy: asc(leagueStandings.position),
        });

        return standings
          .filter((s) => s.club && s.club.isActive)
          .map((s) => s.club!);
      }
    }
  }

  // Default: all active clubs
  return db
    .select()
    .from(clubs)
    .where(eq(clubs.isActive, true))
    .orderBy(asc(clubs.name));
}

async function getCompetitions() {
  return db
    .select()
    .from(competitions)
    .where(eq(competitions.isActive, true))
    .orderBy(asc(competitions.name));
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const { competition } = await searchParams;
  const [allClubs, allCompetitions] = await Promise.all([
    getClubs(competition),
    getCompetitions(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold text-white">Football Clubs</h1>
          </div>
          <p className="mt-2 text-zinc-400">
            Browse all clubs across the top football leagues
          </p>

          {/* Competition filter */}
          {allCompetitions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/teams"
                className={`rounded-full px-3 py-1 text-sm transition-colors ${
                  !competition
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                All
              </Link>
              {allCompetitions.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/teams?competition=${comp.slug}`}
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    competition === comp.slug
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {comp.shortName || comp.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {allClubs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-zinc-400">No clubs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allClubs.map((club) => {
              const clubColor = club.primaryColor || '#666';

              return (
                <Link
                  key={club.id}
                  href={`/teams/${club.slug}`}
                  className="group block"
                >
                  <Card className="overflow-hidden transition-colors hover:border-zinc-600">
                    <div
                      className="h-1"
                      style={{ backgroundColor: clubColor }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Club Logo */}
                        <div
                          className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800"
                          style={{ borderLeft: `3px solid ${clubColor}` }}
                        >
                          {club.logoUrl ? (
                            <Image
                              src={club.logoUrl}
                              alt={club.name}
                              width={48}
                              height={48}
                              className="h-10 w-10 object-contain"
                            />
                          ) : (
                            <span className="text-lg font-bold text-white">
                              {(club.shortName || club.name).slice(0, 3).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Club Info */}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white transition-colors group-hover:text-emerald-400">
                            {club.name}
                          </p>
                          {club.shortName && (
                            <p className="text-xs text-zinc-500">{club.shortName}</p>
                          )}

                          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            {club.stadium && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {club.stadium}
                              </span>
                            )}
                            {club.manager && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {club.manager}
                              </span>
                            )}
                          </div>

                          {club.country && (
                            <p className="mt-1 text-xs text-zinc-600">{club.country}</p>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 flex-shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Click on any club to view their full profile, squad, and season statistics.
        </p>
      </div>
    </div>
  );
}
