// @ts-nocheck
'use client';

import type { WeatherCondition } from '@/types/predictions';
import { Card } from '@/components/ui/Card';
import { WeatherIcon } from './WeatherIcon';
import { Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { getWeatherDescription } from '@/lib/api/open-meteo';

interface WeatherData {
  temperatureCelsius: number;
  trackTemperatureCelsius?: number;
  humidityPercent: number;
  windSpeedKph: number;
  rainProbabilityPercent: number;
  weatherCondition: WeatherCondition;
  isForecast?: boolean;
}

interface WeatherWidgetProps {
  weather: WeatherData;
  sessionName?: string;
  compact?: boolean;
}

export function WeatherWidget({
  weather,
  sessionName = 'Race',
  compact = false,
}: WeatherWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <WeatherIcon condition={weather.weatherCondition} size={16} />
        <span>{Math.round(weather.temperatureCelsius)}°C</span>
        {weather.rainProbabilityPercent > 30 && (
          <span className="text-blue-500">
            {weather.rainProbabilityPercent}% rain
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{sessionName}</h3>
        <WeatherIcon condition={weather.weatherCondition} size={32} />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {getWeatherDescription(weather.weatherCondition)}
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="w-4 h-4 text-emerald-500" />
          <span>Air: {Math.round(weather.temperatureCelsius)}°C</span>
          {weather.trackTemperatureCelsius !== undefined && (
            <>
              <span className="text-gray-400">|</span>
              <span>Track: {Math.round(weather.trackTemperatureCelsius)}°C</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span>Humidity: {weather.humidityPercent}%</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Wind className="w-4 h-4 text-gray-500" />
          <span>Wind: {Math.round(weather.windSpeedKph)} km/h</span>
        </div>

        {weather.rainProbabilityPercent > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Rain: {weather.rainProbabilityPercent}% chance</span>
          </div>
        )}
      </div>

      {weather.isForecast && (
        <p className="text-xs text-gray-400 mt-3">
          Forecast - updated regularly
        </p>
      )}
    </Card>
  );
}

export function WeatherWidgetCompact({ weather }: { weather: WeatherData }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
      <WeatherIcon condition={weather.weatherCondition} size={24} />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{Math.round(weather.temperatureCelsius)}°C</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">{weather.windSpeedKph} km/h wind</span>
        </div>
        {weather.rainProbabilityPercent > 20 && (
          <p className="text-xs text-blue-500">
            {weather.rainProbabilityPercent}% rain chance
          </p>
        )}
      </div>
    </div>
  );
}
