// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export type WeatherCondition = 'clear' | 'partly_cloudy' | 'cloudy' | 'light_rain' | 'rain' | 'heavy_rain' | 'thunderstorm';

export function mapWeatherCode(_code: number): WeatherCondition {
  return 'partly_cloudy';
}

export async function fetchWeatherForecast(
  _latitude: number,
  _longitude: number,
  _startDate: Date,
  _endDate: Date
) {
  return null;
}

export function findClosestHourlyData(_forecast: unknown, _targetTime: Date) {
  return null;
}

export function getWeatherDescription(_condition: WeatherCondition): string {
  return 'Unknown';
}

export function isWetConditions(_rainProbability: number, _condition: WeatherCondition): boolean {
  return false;
}
