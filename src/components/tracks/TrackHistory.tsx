// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

'use client';

interface TrackHistoryProps {
  circuitSlug: string;
  className?: string;
}

export function TrackHistory({ className = '' }: TrackHistoryProps) {
  return (
    <div className={`rounded-lg bg-zinc-800/50 p-6 text-center ${className}`}>
      <p className="text-zinc-500">Track history coming soon</p>
    </div>
  );
}
