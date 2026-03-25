// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export async function getSessions(_params?: unknown) { return []; }
export async function getLatestSession() { return null; }
export async function getCurrentSession() { return null; }
export async function getIntervals(_sessionKey: number) { return []; }
export async function getLatestIntervals(_sessionKey: number) { return []; }
export async function getPositions(_sessionKey: number) { return []; }
export async function getLatestPositions(_sessionKey: number) { return []; }
export async function getLaps(_sessionKey: number, _params?: unknown) { return []; }
export async function getLatestLaps(_sessionKey: number) { return new Map(); }
export async function getStints(_sessionKey: number) { return []; }
export async function getCurrentStints(_sessionKey: number) { return new Map(); }
export async function getPitStops(_sessionKey: number) { return []; }
export async function getRaceControl(_sessionKey: number) { return []; }
export async function getRecentRaceControl(_sessionKey: number, _limit?: number) { return []; }
export async function getDrivers(_sessionKey: number) { return []; }
export async function getWeather(_sessionKey: number) { return []; }
export async function getLatestWeather(_sessionKey: number) { return null; }
export async function fetchAllLiveData(_sessionKey: number) {
  return {
    positions: [],
    intervals: [],
    stints: [],
    pitStops: [],
    raceControl: [],
    weather: null,
    laps: [],
  };
}
