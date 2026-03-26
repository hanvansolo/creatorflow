// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, User } from 'lucide-react';
import { db, players, clubs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { PlayerWidget } from '@/components/widgets/ApiFootballWidget';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) return { title: 'Player Not Found | Footy Feed' };

  const name = player.knownAs || `${player.firstName} ${player.lastName}`;

  return createPageMetadata(
    `${name} - Stats, Career & Profile`,
    `${name} player profile, season statistics, career history, and transfer info.${player.currentClub ? ` Currently at ${player.currentClub.name}.` : ''}`,
    `/players/${slug}`,
    [name, player.position, player.nationality || '', player.currentClub?.name || ''].filter(Boolean)
  );
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const player = await db.query.players.findFirst({
    where: eq(players.slug, slug),
    with: { currentClub: true },
  });

  if (!player) notFound();

  const name = player.knownAs || `${player.firstName} ${player.lastName}`;

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/players"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Players
        </Link>

        {/* Player header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 border-2 border-emerald-500/30 overflow-hidden">
            {player.headshotUrl ? (
              <img src={player.headshotUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-8 w-8 text-zinc-500" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{name}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
              <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                {player.position}
              </span>
              {player.shirtNumber && <span>#{player.shirtNumber}</span>}
              {player.nationality && <span>{player.nationality}</span>}
              {player.currentClub && (
                <Link href={`/teams/${player.currentClub.slug}`} className="text-emerald-400 hover:text-emerald-300">
                  {player.currentClub.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* API-Football Player Widget — career stats, trophies, injuries */}
        {player.apiFootballId ? (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50">
            <PlayerWidget playerId={player.apiFootballId} />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <User className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Player data is being synced. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
