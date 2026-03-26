// @ts-nocheck
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { db, clubs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createPageMetadata } from '@/lib/seo';
import { TeamWidget } from '@/components/widgets/ApiFootballWidget';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) return { title: 'Club Not Found | Footy Feed' };

  return createPageMetadata(
    `${club.name} - Squad, Stats & Fixtures`,
    `${club.name} squad, player stats, fixtures, results, and league standings. ${club.stadium ? `Home ground: ${club.stadium}.` : ''}`,
    `/teams/${slug}`,
    [club.name, club.shortName || '', 'squad', 'fixtures', 'stats'].filter(Boolean)
  );
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.slug, slug),
  });

  if (!club) notFound();

  return (
    <div className="min-h-screen bg-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/teams"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All Teams
        </Link>

        {/* Club header */}
        <div className="mb-8 flex items-center gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl border-2"
            style={{ borderColor: club.primaryColor || '#059669' }}
          >
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="h-12 w-12 object-contain" />
            ) : (
              <Shield className="h-8 w-8" style={{ color: club.primaryColor || '#059669' }} />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{club.name}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-400 mt-1">
              {club.stadium && <span>{club.stadium}</span>}
              {club.manager && <span>Manager: {club.manager}</span>}
              {club.country && <span>{club.country}</span>}
            </div>
          </div>
        </div>

        {/* API-Football Team Widget — shows squad, stats, fixtures, everything */}
        {club.apiFootballId ? (
          <div className="rounded-xl overflow-hidden border border-zinc-700/50">
            <TeamWidget teamId={club.apiFootballId} />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800 p-12 text-center">
            <Shield className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">Team data is being synced. Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
