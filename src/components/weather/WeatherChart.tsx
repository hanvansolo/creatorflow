// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

'use client';

interface WeatherChartProps {
  circuitSlug: string;
  className?: string;
}

export function WeatherChart({ className = '' }: WeatherChartProps) {
  return (
    <div className={`rounded-lg bg-zinc-800/50 p-6 text-center ${className}`}>
      <p className="text-zinc-500">Weather data coming soon</p>
    </div>
  );
}
