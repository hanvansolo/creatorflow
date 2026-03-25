import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'Football Top Scorers 2026 - Golden Boot Standings',
  'Current football 2026 top scorers standings with goals, assists, appearances, and golden boot tracker.',
  '/standings/drivers',
  ['football top scorers', 'golden boot', 'top scorers table', 'football goal scorers']
);

export default function DriversStandingsPage() {
  // Redirect to main standings page with drivers tab as default
  redirect('/standings');
}
