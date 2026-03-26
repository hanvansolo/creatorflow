// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export async function getSessions(_params?: unknown) { return [] as any[]; }
export async function getLatestSession() { return null as any; }
export async function getCurrentSession() { return null as any; }
export async function getIntervals(_sessionKey: number) { return [] as any[]; }
export async function getLatestIntervals(_sessionKey: number) { return [] as any[]; }
export async function getPositions(_sessionKey: number) { return [] as any[]; }
export async function getLatestPositions(_sessionKey: number) { return [] as any[]; }
export async function getLaps(_sessionKey: number, _params?: unknown) { return [] as any[]; }
export async function getLatestLaps(_sessionKey: number) { return new Map(); }
export async function getStints(_sessionKey: number) { return [] as any[]; }
export async function getCurrentStints(_sessionKey: number) { return new Map(); }
export async function getPitStops(_sessionKey: number) { return [] as any[]; }
export async function getRaceControl(_sessionKey: number) { return [] as any[]; }
export async function getRecentRaceControl(_sessionKey: number, _limit?: number) { return [] as any[]; }
export async function getDrivers(_sessionKey: number) { return [] as any[]; }
export async function getWeather(_sessionKey: number) { return [] as any[]; }
export async function getLatestWeather(_sessionKey: number) { return null as any; }
export async function fetchAllLiveData(_sessionKey: number) {
  return {
    positions: [] as any[],
    intervals: [] as any[],
    stints: [] as any[],
    pitStops: [] as any[],
    raceControl: [] as any[],
    weather: null as any,
    laps: [] as any[],
  };
}
