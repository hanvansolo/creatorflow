// @ts-nocheck
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Football Club Standings 2026 - League Table',
  'Current football 2026 league table standings with club points, wins, and season performance.',
  '/standings/constructors',
  ['football league table', 'club standings', 'team standings', 'football club points']
);

export default function ConstructorsStandingsPage() {
  // Redirect to main standings page (user can switch to constructors tab)
  redirect('/standings');
}
