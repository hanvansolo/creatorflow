// @ts-nocheck
'use client';

import type { WeatherCondition } from '@/types/predictions';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Droplets,
} from 'lucide-react';

interface WeatherIconProps {
  condition: WeatherCondition;
  size?: number;
  className?: string;
}

const WEATHER_ICONS: Record<WeatherCondition, typeof Sun> = {
  clear: Sun,
  partly_cloudy: CloudSun,
  cloudy: Cloud,
  light_rain: Droplets,
  rain: CloudRain,
  heavy_rain: CloudRain,
  thunderstorm: CloudLightning,
};

const WEATHER_COLORS: Record<WeatherCondition, string> = {
  clear: 'text-yellow-500',
  partly_cloudy: 'text-gray-400',
  cloudy: 'text-gray-500',
  light_rain: 'text-blue-400',
  rain: 'text-blue-500',
  heavy_rain: 'text-blue-600',
  thunderstorm: 'text-purple-500',
};

export function WeatherIcon({
  condition,
  size = 24,
  className = '',
}: WeatherIconProps) {
  const Icon = WEATHER_ICONS[condition] || Cloud;
  const colorClass = WEATHER_COLORS[condition] || 'text-gray-500';

  return <Icon size={size} className={`${colorClass} ${className}`} />;
}
