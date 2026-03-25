import type { OpenMeteoForecast, WeatherCondition } from '@/types/predictions';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather Codes mapping to our conditions
const WEATHER_CODE_MAP: Record<number, WeatherCondition> = {
  0: 'clear',           // Clear sky
  1: 'clear',           // Mainly clear
  2: 'partly_cloudy',   // Partly cloudy
  3: 'cloudy',          // Overcast
  45: 'cloudy',         // Fog
  48: 'cloudy',         // Depositing rime fog
  51: 'light_rain',     // Light drizzle
  53: 'light_rain',     // Moderate drizzle
  55: 'rain',           // Dense drizzle
  56: 'light_rain',     // Light freezing drizzle
  57: 'rain',           // Dense freezing drizzle
  61: 'light_rain',     // Slight rain
  63: 'rain',           // Moderate rain
  65: 'heavy_rain',     // Heavy rain
  66: 'light_rain',     // Light freezing rain
  67: 'rain',           // Heavy freezing rain
  71: 'cloudy',         // Slight snow (treat as cloudy)
  73: 'cloudy',         // Moderate snow
  75: 'cloudy',         // Heavy snow
  77: 'cloudy',         // Snow grains
  80: 'light_rain',     // Slight rain showers
  81: 'rain',           // Moderate rain showers
  82: 'heavy_rain',     // Violent rain showers
  85: 'cloudy',         // Slight snow showers
  86: 'cloudy',         // Heavy snow showers
  95: 'thunderstorm',   // Thunderstorm
  96: 'thunderstorm',   // Thunderstorm with slight hail
  99: 'thunderstorm',   // Thunderstorm with heavy hail
};

/**
 * Map WMO weather code to our weather condition type
 */
export function mapWeatherCode(code: number): WeatherCondition {
  return WEATHER_CODE_MAP[code] || 'partly_cloudy';
}

/**
 * Format date for Open-Meteo API (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Fetch weather forecast from Open-Meteo API
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  startDate: Date,
  endDate: Date
): Promise<OpenMeteoForecast> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'surface_temperature',
    ].join(','),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    timezone: 'auto',
  });

  const url = `${OPEN_METEO_BASE_URL}?${params}`;
  console.log(`Fetching weather for ${latitude}, ${longitude}...`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000), // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Find the closest hourly data to a target time
 */
export function findClosestHourlyData(
  forecast: OpenMeteoForecast,
  targetTime: Date
): {
  temperature: number;
  humidity: number;
  rainProbability: number;
  rainfall: number;
  weatherCode: number;
  windSpeed: number;
  trackTemperature: number;
  time: string;
} | null {
  if (!forecast.hourly?.time?.length) {
    return null;
  }

  const targetTimestamp = targetTime.getTime();
  let closestIndex = 0;
  let closestDiff = Infinity;

  for (let i = 0; i < forecast.hourly.time.length; i++) {
    const forecastTime = new Date(forecast.hourly.time[i]).getTime();
    const diff = Math.abs(forecastTime - targetTimestamp);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = i;
    }
  }

  return {
    time: forecast.hourly.time[closestIndex],
    temperature: forecast.hourly.temperature_2m[closestIndex],
    humidity: forecast.hourly.relative_humidity_2m[closestIndex],
    rainProbability: forecast.hourly.precipitation_probability[closestIndex],
    rainfall: forecast.hourly.precipitation[closestIndex],
    weatherCode: forecast.hourly.weather_code[closestIndex],
    windSpeed: forecast.hourly.wind_speed_10m[closestIndex],
    trackTemperature: forecast.hourly.surface_temperature[closestIndex],
  };
}

/**
 * Get weather condition description for display
 */
export function getWeatherDescription(condition: WeatherCondition): string {
  const descriptions: Record<WeatherCondition, string> = {
    clear: 'Clear',
    partly_cloudy: 'Partly Cloudy',
    cloudy: 'Cloudy',
    light_rain: 'Light Rain',
    rain: 'Rain',
    heavy_rain: 'Heavy Rain',
    thunderstorm: 'Thunderstorm',
  };
  return descriptions[condition];
}

/**
 * Determine if conditions are considered "wet" for race purposes
 */
export function isWetConditions(
  rainProbability: number,
  condition: WeatherCondition
): boolean {
  if (rainProbability > 40) return true;

  const wetConditions: WeatherCondition[] = [
    'light_rain',
    'rain',
    'heavy_rain',
    'thunderstorm',
  ];

  return wetConditions.includes(condition);
}
