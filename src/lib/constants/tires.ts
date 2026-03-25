// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export const TIRE_COLORS: Record<string, string> = {};

export function getTireStyle(_compound: string): { color: string; label: string } {
  return { color: '#666', label: 'Unknown' };
}
