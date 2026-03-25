// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Testing Event' };

export default function TestingEventPage() {
  return (
    <div className="container mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-white mb-4">Testing Event</h1>
      <p className="text-zinc-400">Coming soon.</p>
    </div>
  );
}
