export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
}

export function formatPoints(points: number): string {
  return points % 1 === 0 ? points.toString() : points.toFixed(1);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatLapTime(time: string): string {
  // Assumes format like "1:23.456" or "1:23:456"
  return time.replace(/[:.]/g, (m, i) => (i === 1 ? ':' : '.'));
}

export function formatTrackLength(meters: number): string {
  const km = meters / 1000;
  return `${km.toFixed(3)} km`;
}

export function formatSpeed(kph: number): string {
  return `${Math.round(kph)} km/h`;
}

export function formatTemperature(celsius: number): string {
  return `${Math.round(celsius)}°C`;
}
