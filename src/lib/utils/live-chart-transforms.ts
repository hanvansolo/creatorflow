// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export interface GapDataPoint {
  lap: number;
  gaps: Map<number, number>;
}

export interface PositionHistoryPoint {
  lap: number;
  positions: Map<number, number>;
}

export interface LapTimeData {
  driver_number: number;
  lap_number: number;
  lap_time: number;
  is_pit_lap?: boolean;
}

export interface StintHistoryItem {
  driver_number: number;
  stints: Array<{
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
    lap_start: number;
    lap_end: number | null;
  }>;
}

export interface BattleData {
  driver_ahead: number;
  driver_behind: number;
  gap: number;
  position: number;
}

export interface FastestLapData {
  driver_number: number;
  lap_time: number;
  lap_number: number;
}

export interface SpeedTrapData {
  driver_number: number;
  speed: number;
  lap_number: number;
}

export interface SectorData {
  driver_number: number;
  sector_1: number;
  sector_2: number;
  sector_3: number;
  lap_number: number;
}

export function buildGapHistory(_allLaps: unknown[]): GapDataPoint[] {
  return [];
}

export function buildPositionHistory(_allLaps: unknown[]): PositionHistoryPoint[] {
  return [];
}

export function buildLapTimeHistory(_allLaps: unknown[]): LapTimeData[] {
  return [];
}

export function buildStintHistory(_stints: unknown[]): StintHistoryItem[] {
  return [];
}

export function buildBattleData(_intervals: unknown[], _positions: unknown[]): BattleData[] {
  return [];
}

export function buildFastestLaps(_allLaps: unknown[]): FastestLapData[] {
  return [];
}

export function buildSpeedTrapData(_allLaps: unknown[]): SpeedTrapData[] {
  return [];
}

export function buildSectorData(_allLaps: unknown[]): SectorData[] {
  return [];
}

export function deriveCurrentLap(_allLaps: unknown[]): number {
  return 0;
}

export function deriveTotalLaps(_raceControl: unknown[], _currentLap: number): number {
  return 0;
}
