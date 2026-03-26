// @ts-nocheck
import { useMemo } from 'react';
import type {
  Lap,
  Stint,
  Interval,
  Position,
  RaceControlMessage,
} from '@/lib/api/openf1/types';
import {
  buildGapHistory,
  buildPositionHistory,
  buildLapTimeHistory,
  buildStintHistory,
  buildBattleData,
  buildFastestLaps,
  buildSpeedTrapData,
  buildSectorData,
  deriveCurrentLap,
  deriveTotalLaps,
  type GapDataPoint,
  type PositionHistoryPoint,
  type LapTimeData,
  type StintHistoryItem,
  type BattleData,
  type FastestLapData,
  type SpeedTrapData,
  type SectorData,
} from '@/lib/utils/live-chart-transforms';

export interface ChartData {
  gapHistory: GapDataPoint[];
  positionHistory: PositionHistoryPoint[];
  lapTimeHistory: LapTimeData[];
  stintHistory: StintHistoryItem[];
  battleData: BattleData[];
  fastestLaps: FastestLapData[];
  speedTrapData: SpeedTrapData[];
  sectorData: SectorData[];
  currentLap: number;
  totalLaps: number;
}

export function useChartData(
  allLaps: Lap[],
  stints: Stint[],
  intervals: Interval[],
  positions: Position[],
  raceControl: RaceControlMessage[],
): ChartData {
  const gapHistory = useMemo(() => buildGapHistory(allLaps), [allLaps]);
  const positionHistory = useMemo(() => buildPositionHistory(allLaps), [allLaps]);
  const lapTimeHistory = useMemo(() => buildLapTimeHistory(allLaps), [allLaps]);
  const stintHistory = useMemo(() => buildStintHistory(stints), [stints]);
  const battleData = useMemo(() => buildBattleData(intervals, positions), [intervals, positions]);
  const fastestLaps = useMemo(() => buildFastestLaps(allLaps), [allLaps]);
  const speedTrapData = useMemo(() => buildSpeedTrapData(allLaps), [allLaps]);
  const sectorData = useMemo(() => buildSectorData(allLaps), [allLaps]);
  const currentLap = useMemo(() => deriveCurrentLap(allLaps), [allLaps]);
  const totalLaps = useMemo(() => deriveTotalLaps(raceControl, currentLap), [raceControl, currentLap]);

  return {
    gapHistory,
    positionHistory,
    lapTimeHistory,
    stintHistory,
    battleData,
    fastestLaps,
    speedTrapData,
    sectorData,
    currentLap,
    totalLaps,
  };
}
