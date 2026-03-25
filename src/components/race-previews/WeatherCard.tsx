import { Cloud, CloudRain, Sun, Thermometer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherAnalysis {
  expectedConditions: string;
  rainProbability: number;
  temperatureRange: string;
  impact: string;
}

interface WeatherCardProps {
  weather: WeatherAnalysis;
  className?: string;
}

function getWeatherIcon(conditions: string) {
  const lower = conditions.toLowerCase();
  if (lower.includes('rain') || lower.includes('wet')) {
    return <CloudRain className="h-8 w-8 text-blue-400" />;
  }
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return <Cloud className="h-8 w-8 text-zinc-400" />;
  }
  return <Sun className="h-8 w-8 text-yellow-500" />;
}

function getRainColor(probability: number): string {
  if (probability >= 70) return 'text-blue-400';
  if (probability >= 40) return 'text-amber-400';
  return 'text-green-400';
}

export function WeatherCard({ weather, className }: WeatherCardProps) {
  return (
    <div className={cn('rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Weather Outlook</h2>
          <p className="text-zinc-400">{weather.expectedConditions}</p>
        </div>
        {getWeatherIcon(weather.expectedConditions)}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CloudRain className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Rain Chance</span>
          </div>
          <span className={cn('text-2xl font-bold', getRainColor(weather.rainProbability))}>
            {weather.rainProbability}%
          </span>
        </div>

        <div className="rounded-lg bg-zinc-900/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Thermometer className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Temperature</span>
          </div>
          <span className="text-xl font-bold text-white">{weather.temperatureRange}</span>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-700/30 bg-zinc-900/30 p-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wide block mb-1">
          Strategic Impact
        </span>
        <p className="text-sm text-zinc-300">{weather.impact}</p>
      </div>
    </div>
  );
}
