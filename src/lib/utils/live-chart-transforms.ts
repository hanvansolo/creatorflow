import type {
  Lap,
  Stint,
  Interval,
  Position,
  RaceControlMessage,
} from '@/lib/api/openf1/types';

// Chart data interfaces (matching existing chart component props)

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

/**
 * Build gap-to-leader history from cumulative lap times.
 */
export function buildGapHistory(allLaps: Lap[]): GapDataPoint[] {
  if (allLaps.length === 0) return [];

  // Group lap durations by driver
  const byDriver = new Map<number, Map<number, number>>();
  for (const lap of allLaps) {
    if (lap.lap_duration === null) continue;
    if (!byDriver.has(lap.driver_number)) byDriver.set(lap.driver_number, new Map());
    byDriver.get(lap.driver_number)!.set(lap.lap_number, lap.lap_duration);
  }

  // Find all unique lap numbers
  const lapNumbers = [...new Set(allLaps.map(l => l.lap_number))].sort((a, b) => a - b);

  // Build cumulative times per driver
  const cumulativeByDriver = new Map<number, Map<number, number>>();
  for (const [driver, laps] of byDriver) {
    const cumulative = new Map<number, number>();
    let total = 0;
    for (const lapNum of lapNumbers) {
      const duration = laps.get(lapNum);
      if (duration !== undefined) {
        total += duration;
        cumulative.set(lapNum, total);
      }
    }
    cumulativeByDriver.set(driver, cumulative);
  }

  // For each lap, compute gap to leader
  const result: GapDataPoint[] = [];
  for (const lapNum of lapNumbers) {
    const gaps = new Map<number, number>();
    let minTime = Infinity;

    for (const [, cumulative] of cumulativeByDriver) {
      const time = cumulative.get(lapNum);
      if (time !== undefined && time < minTime) minTime = time;
    }

    for (const [driver, cumulative] of cumulativeByDriver) {
      const time = cumulative.get(lapNum);
      if (time !== undefined) {
        gaps.set(driver, time - minTime);
      }
    }

    result.push({ lap: lapNum, gaps });
  }

  return result;
}

/**
 * Build position history by ranking drivers by cumulative lap times.
 */
export function buildPositionHistory(allLaps: Lap[]): PositionHistoryPoint[] {
  if (allLaps.length === 0) return [];

  // Group lap durations by driver
  const byDriver = new Map<number, Map<number, number>>();
  for (const lap of allLaps) {
    if (lap.lap_duration === null) continue;
    if (!byDriver.has(lap.driver_number)) byDriver.set(lap.driver_number, new Map());
    byDriver.get(lap.driver_number)!.set(lap.lap_number, lap.lap_duration);
  }

  const lapNumbers = [...new Set(allLaps.map(l => l.lap_number))].sort((a, b) => a - b);

  // Build cumulative times
  const cumulativeByDriver = new Map<number, Map<number, number>>();
  for (const [driver, laps] of byDriver) {
    const cumulative = new Map<number, number>();
    let total = 0;
    for (const lapNum of lapNumbers) {
      const duration = laps.get(lapNum);
      if (duration !== undefined) {
        total += duration;
        cumulative.set(lapNum, total);
      }
    }
    cumulativeByDriver.set(driver, cumulative);
  }

  // For each lap, rank drivers by cumulative time
  const result: PositionHistoryPoint[] = [];
  for (const lapNum of lapNumbers) {
    const driversAtLap: { driver: number; time: number }[] = [];
    for (const [driver, cumulative] of cumulativeByDriver) {
      const time = cumulative.get(lapNum);
      if (time !== undefined) {
        driversAtLap.push({ driver, time });
      }
    }

    driversAtLap.sort((a, b) => a.time - b.time);

    const positions = new Map<number, number>();
    driversAtLap.forEach((d, idx) => positions.set(d.driver, idx + 1));

    result.push({ lap: lapNum, positions });
  }

  return result;
}

/**
 * Build lap time history from raw laps.
 */
export function buildLapTimeHistory(allLaps: Lap[]): LapTimeData[] {
  return allLaps
    .filter(l => l.lap_duration !== null)
    .map(l => ({
      driver_number: l.driver_number,
      lap_number: l.lap_number,
      lap_time: l.lap_duration!,
      is_pit_lap: l.is_pit_out_lap,
    }));
}

/**
 * Build stint history from raw stints, grouped by driver.
 */
export function buildStintHistory(stints: Stint[]): StintHistoryItem[] {
  const byDriver = new Map<number, Stint[]>();
  for (const stint of stints) {
    if (!byDriver.has(stint.driver_number)) byDriver.set(stint.driver_number, []);
    byDriver.get(stint.driver_number)!.push(stint);
  }

  const result: StintHistoryItem[] = [];
  for (const [driverNumber, driverStints] of byDriver) {
    const sorted = [...driverStints].sort((a, b) => a.stint_number - b.stint_number);
    result.push({
      driver_number: driverNumber,
      stints: sorted.map(s => ({
        compound: s.compound,
        lap_start: s.lap_start,
        lap_end: s.lap_end,
      })),
    });
  }

  return result;
}

/**
 * Build battle data from latest intervals and positions.
 * Finds consecutive drivers with gaps under 1.0 second.
 */
export function buildBattleData(intervals: Interval[], positions: Position[]): BattleData[] {
  const sorted = [...positions].sort((a, b) => a.position - b.position);
  const battles: BattleData[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const behind = sorted[i + 1];
    const interval = intervals.find(int => int.driver_number === behind.driver_number);
    const gap = interval?.interval;

    if (gap !== null && gap !== undefined && Math.abs(gap) <= 1.0 && Math.abs(gap) > 0) {
      battles.push({
        driver_ahead: sorted[i].driver_number,
        driver_behind: behind.driver_number,
        gap: Math.abs(gap),
        position: sorted[i].position,
      });
    }
  }

  return battles;
}

/**
 * Build fastest lap data - best lap time per driver.
 */
export function buildFastestLaps(allLaps: Lap[]): FastestLapData[] {
  const bestByDriver = new Map<number, FastestLapData>();

  for (const lap of allLaps) {
    if (lap.lap_duration === null || lap.is_pit_out_lap) continue;
    const existing = bestByDriver.get(lap.driver_number);
    if (!existing || lap.lap_duration < existing.lap_time) {
      bestByDriver.set(lap.driver_number, {
        driver_number: lap.driver_number,
        lap_time: lap.lap_duration,
        lap_number: lap.lap_number,
      });
    }
  }

  return Array.from(bestByDriver.values());
}

/**
 * Build speed trap data from lap st_speed field.
 */
export function buildSpeedTrapData(allLaps: Lap[]): SpeedTrapData[] {
  // Return best speed trap per driver (latest lap with st_speed)
  const bestByDriver = new Map<number, SpeedTrapData>();

  for (const lap of allLaps) {
    if (lap.st_speed === null) continue;
    const existing = bestByDriver.get(lap.driver_number);
    if (!existing || lap.st_speed > existing.speed) {
      bestByDriver.set(lap.driver_number, {
        driver_number: lap.driver_number,
        speed: lap.st_speed,
        lap_number: lap.lap_number,
      });
    }
  }

  return Array.from(bestByDriver.values());
}

/**
 * Build sector times data from lap sector durations.
 */
export function buildSectorData(allLaps: Lap[]): SectorData[] {
  // Return latest sector data per driver
  const latestByDriver = new Map<number, SectorData>();

  for (const lap of allLaps) {
    if (
      lap.duration_sector_1 === null ||
      lap.duration_sector_2 === null ||
      lap.duration_sector_3 === null
    ) continue;

    const existing = latestByDriver.get(lap.driver_number);
    if (!existing || lap.lap_number > existing.lap_number) {
      latestByDriver.set(lap.driver_number, {
        driver_number: lap.driver_number,
        sector_1: lap.duration_sector_1,
        sector_2: lap.duration_sector_2,
        sector_3: lap.duration_sector_3,
        lap_number: lap.lap_number,
      });
    }
  }

  return Array.from(latestByDriver.values());
}

/**
 * Derive current lap number from all laps data.
 */
export function deriveCurrentLap(allLaps: Lap[]): number {
  if (allLaps.length === 0) return 0;
  return Math.max(...allLaps.map(l => l.lap_number));
}

/**
 * Derive total laps from race control messages or use fallback.
 */
export function deriveTotalLaps(
  raceControl: RaceControlMessage[],
  currentLap: number
): number {
  // Try to extract from race control messages (e.g., "LAP 15/53")
  for (const msg of raceControl) {
    const match = msg.message.match(/LAP\s+\d+\/(\d+)/i);
    if (match) return parseInt(match[1], 10);
  }

  // Check for chequered flag (race ended)
  const chequered = raceControl.find(m => m.flag === 'CHEQUERED');
  if (chequered?.lap_number) return chequered.lap_number;

  // Fallback: current lap + buffer for chart scaling
  return currentLap > 0 ? currentLap + 10 : 60;
}
