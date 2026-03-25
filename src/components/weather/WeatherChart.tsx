'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import { getCircuitHistoricalWeather } from '@/lib/constants/circuit-data';

interface WeatherChartProps {
  circuitSlug: string;
  className?: string;
}

// Generate simulated race weekend data based on historical averages
function generateRaceWeekendData(weather: {
  avgTempC: number;
  avgTrackTempC: number;
  avgHumidity: number;
  rainChance: number;
}) {
  // Simulate a race weekend: Friday to Sunday with hourly-ish data points
  const sessions = [
    { time: 'Fri AM', session: 'FP1 Prep', timeOfDay: 0.4 },
    { time: 'Fri PM', session: 'FP1', timeOfDay: 0.6 },
    { time: 'Fri Eve', session: 'FP2', timeOfDay: 0.8 },
    { time: 'Sat AM', session: 'FP3 Prep', timeOfDay: 0.5 },
    { time: 'Sat Mid', session: 'FP3', timeOfDay: 0.7 },
    { time: 'Sat PM', session: 'Quali', timeOfDay: 0.85 },
    { time: 'Sun AM', session: 'Warm-up', timeOfDay: 0.5 },
    { time: 'Sun Mid', session: 'Pre-Race', timeOfDay: 0.75 },
    { time: 'Sun PM', session: 'Race', timeOfDay: 0.9 },
  ];

  return sessions.map((s, i) => {
    // Add some realistic variation based on time of day
    const tempVariation = Math.sin(s.timeOfDay * Math.PI) * 5 + (Math.random() - 0.5) * 3;
    const trackTempMultiplier = s.timeOfDay > 0.6 ? 1.2 : 0.85;
    const humidityVariation = (1 - s.timeOfDay) * 15 + (Math.random() - 0.5) * 10;

    // Rain chance varies - slightly higher in afternoon
    const rainVariation = s.timeOfDay > 0.7 ? 10 : -5;

    return {
      time: s.time,
      session: s.session,
      airTemp: Math.round(weather.avgTempC + tempVariation),
      trackTemp: Math.round((weather.avgTrackTempC + tempVariation * 1.5) * trackTempMultiplier),
      humidity: Math.round(Math.max(20, Math.min(95, weather.avgHumidity + humidityVariation))),
      rainChance: Math.round(Math.max(0, Math.min(100, weather.rainChance + rainVariation + (Math.random() - 0.5) * 15))),
    };
  });
}

export function WeatherChart({ circuitSlug, className = '' }: WeatherChartProps) {
  const weather = getCircuitHistoricalWeather(circuitSlug);

  if (!weather) {
    return (
      <div className={`rounded-lg bg-zinc-800/50 p-6 text-center ${className}`}>
        <p className="text-zinc-500">Weather data not available for this circuit</p>
      </div>
    );
  }

  const data = generateRaceWeekendData(weather);

  return (
    <div className={`rounded-lg bg-zinc-800/50 border border-zinc-700 p-4 ${className}`}>
      <h3 className="text-sm font-medium text-zinc-300 mb-4">
        Typical Race Weekend Conditions
      </h3>

      {/* Temperature Chart */}
      <div className="mb-6">
        <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Temperature</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={{ stroke: '#4b5563' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={{ stroke: '#4b5563' }}
                domain={['auto', 'auto']}
                unit="°C"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                iconSize={10}
              />
              <Line
                type="monotone"
                dataKey="airTemp"
                name="Air Temp"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="trackTemp"
                name="Track Temp"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Humidity & Rain Chart */}
      <div>
        <h4 className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Humidity & Rain Chance</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={{ stroke: '#4b5563' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={{ stroke: '#4b5563' }}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#fff', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                iconSize={10}
              />
              <Area
                type="monotone"
                dataKey="rainChance"
                name="Rain Chance"
                fill="#3b82f6"
                fillOpacity={0.3}
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                name="Humidity"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-2 text-center border-t border-zinc-700 pt-4">
        <div>
          <p className="text-lg font-bold text-blue-400">{weather.avgTempC}°C</p>
          <p className="text-[10px] text-zinc-500">Avg Air</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">{weather.avgTrackTempC}°C</p>
          <p className="text-[10px] text-zinc-500">Avg Track</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-400">{weather.avgHumidity}%</p>
          <p className="text-[10px] text-zinc-500">Humidity</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${weather.rainChance >= 30 ? 'text-blue-400' : 'text-zinc-400'}`}>
            {weather.rainChance}%
          </p>
          <p className="text-[10px] text-zinc-500">Rain</p>
        </div>
      </div>

      {weather.notes && (
        <p className="mt-3 text-xs text-zinc-500 italic text-center border-t border-zinc-700 pt-3">
          {weather.notes}
        </p>
      )}
    </div>
  );
}
