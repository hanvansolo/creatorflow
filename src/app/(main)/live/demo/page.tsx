'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type {
  Session,
  Driver,
  Position,
  Interval,
  Stint,
  PitStop,
  RaceControlMessage,
  Weather,
  Lap,
  Location,
} from '@/lib/api/openf1/types';
import { SessionHeader } from '@/components/live/SessionHeader';
import { FlagBanner } from '@/components/live/FlagBanner';
import { Leaderboard } from '@/components/live/Leaderboard';
import { RaceControlFeed } from '@/components/live/RaceControlFeed';
import { PitStopList } from '@/components/live/PitStopList';
import { LiveTrackMap } from '@/components/live/LiveTrackMap';
import { GapChart } from '@/components/live/charts/GapChart';
import { TireStrategyChart } from '@/components/live/charts/TireStrategyChart';
import { PositionChart } from '@/components/live/charts/PositionChart';
import { LapTimeChart } from '@/components/live/charts/LapTimeChart';
import { SpeedTrapChart } from '@/components/live/charts/SpeedTrapChart';
import { SectorTimesChart } from '@/components/live/charts/SectorTimesChart';
import { BattleTrackerChart } from '@/components/live/charts/BattleTrackerChart';
import { FastestLapChart } from '@/components/live/charts/FastestLapChart';
import { Play, Pause, RotateCcw } from 'lucide-react';

// Track points for animation (Monza layout)
const trackPointsNormalized = [
  { x: 15.1, y: 62.2 },
  { x: 17.3, y: 44.4 },
  { x: 18.3, y: 36.9 },
  { x: 19.4, y: 31.6 },
  { x: 19.8, y: 23.1 },
  { x: 22.8, y: 17.7 },
  { x: 28, y: 14.2 },
  { x: 37.8, y: 11.7 },
  { x: 49.6, y: 11 },
  { x: 62.8, y: 9.2 },
  { x: 80.1, y: 5.2 },
  { x: 85.9, y: 7.8 },
  { x: 87.3, y: 17.4 },
  { x: 78.9, y: 21.8 },
  { x: 67.9, y: 26.1 },
  { x: 57.1, y: 32.3 },
  { x: 43.4, y: 40.8 },
  { x: 36.8, y: 46.9 },
  { x: 34.1, y: 51.3 },
  { x: 32, y: 56.3 },
  { x: 26.7, y: 91.2 },
  { x: 22, y: 95 },
  { x: 13.1, y: 87.9 },
  { x: 12.9, y: 77.9 },
];

// Mock session data
const mockSession: Session = {
  session_key: 9999,
  meeting_key: 1234,
  session_name: 'Race',
  session_type: 'Race',
  circuit_key: 1,
  circuit_short_name: 'Monza',
  country_key: 1,
  country_code: 'ITA',
  country_name: 'Italy',
  location: 'Monza',
  date_start: new Date().toISOString(),
  date_end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  gmt_offset: '02:00:00',
  year: 2026,
};

// Mock drivers with 2026 grid
const mockDrivers: Driver[] = [
  { driver_number: 1, name_acronym: 'VER', first_name: 'Max', last_name: 'Verstappen', full_name: 'Max VERSTAPPEN', broadcast_name: 'M VERSTAPPEN', team_name: 'Red Bull Racing', team_colour: '3671C6', country_code: 'NED', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 11, name_acronym: 'PER', first_name: 'Sergio', last_name: 'Perez', full_name: 'Sergio PEREZ', broadcast_name: 'S PEREZ', team_name: 'Red Bull Racing', team_colour: '3671C6', country_code: 'MEX', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 44, name_acronym: 'HAM', first_name: 'Lewis', last_name: 'Hamilton', full_name: 'Lewis HAMILTON', broadcast_name: 'L HAMILTON', team_name: 'Ferrari', team_colour: 'E80020', country_code: 'GBR', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 16, name_acronym: 'LEC', first_name: 'Charles', last_name: 'Leclerc', full_name: 'Charles LECLERC', broadcast_name: 'C LECLERC', team_name: 'Ferrari', team_colour: 'E80020', country_code: 'MON', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 63, name_acronym: 'RUS', first_name: 'George', last_name: 'Russell', full_name: 'George RUSSELL', broadcast_name: 'G RUSSELL', team_name: 'Mercedes', team_colour: '27F4D2', country_code: 'GBR', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 12, name_acronym: 'ANT', first_name: 'Andrea', last_name: 'Antonelli', full_name: 'Andrea ANTONELLI', broadcast_name: 'A ANTONELLI', team_name: 'Mercedes', team_colour: '27F4D2', country_code: 'ITA', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 4, name_acronym: 'NOR', first_name: 'Lando', last_name: 'Norris', full_name: 'Lando NORRIS', broadcast_name: 'L NORRIS', team_name: 'McLaren', team_colour: 'FF8000', country_code: 'GBR', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 81, name_acronym: 'PIA', first_name: 'Oscar', last_name: 'Piastri', full_name: 'Oscar PIASTRI', broadcast_name: 'O PIASTRI', team_name: 'McLaren', team_colour: 'FF8000', country_code: 'AUS', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 14, name_acronym: 'ALO', first_name: 'Fernando', last_name: 'Alonso', full_name: 'Fernando ALONSO', broadcast_name: 'F ALONSO', team_name: 'Aston Martin', team_colour: '229971', country_code: 'ESP', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 18, name_acronym: 'STR', first_name: 'Lance', last_name: 'Stroll', full_name: 'Lance STROLL', broadcast_name: 'L STROLL', team_name: 'Aston Martin', team_colour: '229971', country_code: 'CAN', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 10, name_acronym: 'GAS', first_name: 'Pierre', last_name: 'Gasly', full_name: 'Pierre GASLY', broadcast_name: 'P GASLY', team_name: 'Alpine', team_colour: 'FF87BC', country_code: 'FRA', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 7, name_acronym: 'DOO', first_name: 'Jack', last_name: 'Doohan', full_name: 'Jack DOOHAN', broadcast_name: 'J DOOHAN', team_name: 'Alpine', team_colour: 'FF87BC', country_code: 'AUS', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 55, name_acronym: 'SAI', first_name: 'Carlos', last_name: 'Sainz', full_name: 'Carlos SAINZ', broadcast_name: 'C SAINZ', team_name: 'Williams', team_colour: '1868DB', country_code: 'ESP', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 23, name_acronym: 'ALB', first_name: 'Alex', last_name: 'Albon', full_name: 'Alex ALBON', broadcast_name: 'A ALBON', team_name: 'Williams', team_colour: '1868DB', country_code: 'THA', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 22, name_acronym: 'TSU', first_name: 'Yuki', last_name: 'Tsunoda', full_name: 'Yuki TSUNODA', broadcast_name: 'Y TSUNODA', team_name: 'RB', team_colour: '6692FF', country_code: 'JPN', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 30, name_acronym: 'LAW', first_name: 'Liam', last_name: 'Lawson', full_name: 'Liam LAWSON', broadcast_name: 'L LAWSON', team_name: 'RB', team_colour: '6692FF', country_code: 'NZL', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 77, name_acronym: 'BOT', first_name: 'Valtteri', last_name: 'Bottas', full_name: 'Valtteri BOTTAS', broadcast_name: 'V BOTTAS', team_name: 'Sauber', team_colour: '52E252', country_code: 'FIN', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 27, name_acronym: 'HUL', first_name: 'Nico', last_name: 'Hulkenberg', full_name: 'Nico HULKENBERG', broadcast_name: 'N HULKENBERG', team_name: 'Sauber', team_colour: '52E252', country_code: 'GER', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 87, name_acronym: 'BEA', first_name: 'Oliver', last_name: 'Bearman', full_name: 'Oliver BEARMAN', broadcast_name: 'O BEARMAN', team_name: 'Haas', team_colour: 'B6BABD', country_code: 'GBR', headshot_url: null, meeting_key: 1234, session_key: 9999 },
  { driver_number: 31, name_acronym: 'OCO', first_name: 'Esteban', last_name: 'Ocon', full_name: 'Esteban OCON', broadcast_name: 'E OCON', team_name: 'Haas', team_colour: 'B6BABD', country_code: 'FRA', headshot_url: null, meeting_key: 1234, session_key: 9999 },
];

// Starting order
const initialPositionOrder = [1, 4, 44, 16, 63, 81, 11, 14, 55, 22, 12, 10, 23, 18, 30, 7, 77, 27, 87, 31];

// Historical data interfaces for charts
interface GapDataPoint {
  lap: number;
  gaps: Map<number, number>;
}

interface PositionHistoryPoint {
  lap: number;
  positions: Map<number, number>;
}

interface LapTimeData {
  driver_number: number;
  lap_number: number;
  lap_time: number;
  is_pit_lap?: boolean;
}

interface StintHistoryItem {
  driver_number: number;
  stints: Array<{
    compound: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
    lap_start: number;
    lap_end: number | null;
  }>;
}

interface PitStopWithTires {
  driver_number: number;
  lap_number: number;
  pit_duration: number;
  compound_before?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
  compound_after?: 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';
}

interface SpeedTrapData {
  driver_number: number;
  speed: number;
  lap_number: number;
}

interface SectorData {
  driver_number: number;
  sector_1: number;
  sector_2: number;
  sector_3: number;
  lap_number: number;
}

interface BattleData {
  driver_ahead: number;
  driver_behind: number;
  gap: number;
  position: number;
}

interface FastestLapData {
  driver_number: number;
  lap_time: number;
  lap_number: number;
}

// Race simulation state
interface RaceState {
  lap: number;
  totalLaps: number;
  positions: number[];
  gaps: Map<number, number>;
  trackProgress: Map<number, number>;
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  currentStints: Map<number, Stint>;
  isRunning: boolean;
  // Historical data for charts
  gapHistory: GapDataPoint[];
  positionHistory: PositionHistoryPoint[];
  lapTimeHistory: LapTimeData[];
  stintHistory: StintHistoryItem[];
  pitStopsWithTires: PitStopWithTires[];
  // New chart data
  speedTrapData: SpeedTrapData[];
  sectorData: SectorData[];
  fastestLaps: FastestLapData[];
}

function createInitialState(): RaceState {
  const initialGaps = new Map(initialPositionOrder.map((d, i) => [d, i * 1.5]));
  const initialPositions = new Map(initialPositionOrder.map((d, i) => [d, i + 1]));
  const initialStints = new Map(mockDrivers.map(d => {
    const compound = (['SOFT', 'MEDIUM', 'HARD'] as const)[Math.floor(Math.random() * 3)];
    return [d.driver_number, {
      driver_number: d.driver_number,
      compound,
      stint_number: 1,
      lap_start: 1,
      lap_end: null,
      tyre_age_at_start: 0,
      meeting_key: 1234,
      session_key: 9999,
    }];
  }));

  // Create initial stint history
  const stintHistory: StintHistoryItem[] = mockDrivers.map(d => ({
    driver_number: d.driver_number,
    stints: [{
      compound: initialStints.get(d.driver_number)!.compound,
      lap_start: 1,
      lap_end: null,
    }],
  }));

  return {
    lap: 1,
    totalLaps: 53,
    positions: [...initialPositionOrder],
    gaps: initialGaps,
    trackProgress: new Map(initialPositionOrder.map((d, i) => [d, 1 - (i * 0.04)])),
    pitStops: [],
    raceControl: [{
      message: 'LIGHTS OUT AND AWAY WE GO!',
      category: 'Other',
      flag: 'GREEN',
      lap_number: 1,
      driver_number: null,
      scope: 'Track',
      sector: null,
      date: new Date().toISOString(),
      meeting_key: 1234,
      session_key: 9999,
    }],
    currentStints: initialStints,
    isRunning: true,
    // Historical data
    gapHistory: [{ lap: 1, gaps: new Map(initialGaps) }],
    positionHistory: [{ lap: 1, positions: new Map(initialPositions) }],
    lapTimeHistory: [],
    stintHistory,
    pitStopsWithTires: [],
    // New chart data
    speedTrapData: [],
    sectorData: [],
    fastestLaps: [],
  };
}

export default function LiveDemoPage() {
  const [raceState, setRaceState] = useState<RaceState>(createInitialState);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Reset race
  const resetRace = useCallback(() => {
    setRaceState(createInitialState());
    setLastUpdated(new Date());
  }, []);

  // Animate cars around the track
  useEffect(() => {
    if (!raceState.isRunning) return;

    const interval = setInterval(() => {
      setRaceState(prev => {
        const newProgress = new Map(prev.trackProgress);
        const newGaps = new Map(prev.gaps);
        let newPositions = [...prev.positions];
        const newRaceControl = [...prev.raceControl];
        const newPitStops = [...prev.pitStops];
        const newStints = new Map(prev.currentStints);
        let newLap = prev.lap;

        // Move each car based on their speed
        prev.positions.forEach((driverNum, posIndex) => {
          const currentProgress = newProgress.get(driverNum) || 0;
          const baseSpeed = 0.012;
          const positionBonus = (20 - posIndex) * 0.0002;
          const randomVariation = (Math.random() - 0.5) * 0.002;
          const speed = baseSpeed + positionBonus + randomVariation;

          let newProgressValue = currentProgress + speed;

          if (newProgressValue >= 1) {
            newProgressValue = newProgressValue - 1;
            if (posIndex === 0 && newLap < prev.totalLaps) {
              newLap++;
              if (newLap % 10 === 0 || newLap === prev.totalLaps) {
                newRaceControl.unshift({
                  message: newLap === prev.totalLaps
                    ? 'CHEQUERED FLAG'
                    : `LAP ${newLap}/${prev.totalLaps}`,
                  category: 'Other',
                  flag: newLap === prev.totalLaps ? 'CHEQUERED' : null,
                  lap_number: newLap,
                  driver_number: null,
                  scope: 'Track',
                  sector: null,
                  date: new Date().toISOString(),
                  meeting_key: 1234,
                  session_key: 9999,
                });
              }
            }
          }

          newProgress.set(driverNum, newProgressValue);
        });

        // Track historical data and pit stops with tires
        let newPitStopsWithTires = [...prev.pitStopsWithTires];
        let newStintHistory = prev.stintHistory;

        // Simulate pit stops
        if (Math.random() < 0.005 && newLap > 10 && newLap < prev.totalLaps - 5) {
          const pitDriver = newPositions[Math.floor(Math.random() * 15) + 3];
          const driver = mockDrivers.find(d => d.driver_number === pitDriver);
          const currentStint = newStints.get(pitDriver);

          if (driver && currentStint && currentStint.stint_number < 3) {
            const pitDuration = 2.2 + Math.random() * 0.8;
            const compounds: ('SOFT' | 'MEDIUM' | 'HARD')[] = ['SOFT', 'MEDIUM', 'HARD'];
            const newCompound = compounds.filter(c => c !== currentStint.compound)[Math.floor(Math.random() * 2)];

            newPitStops.unshift({
              driver_number: pitDriver,
              lap_number: newLap,
              pit_duration: pitDuration,
              date: new Date().toISOString(),
              meeting_key: 1234,
              session_key: 9999,
            });

            // Track pit stop with tire info for chart
            newPitStopsWithTires.unshift({
              driver_number: pitDriver,
              lap_number: newLap,
              pit_duration: pitDuration,
              compound_before: currentStint.compound,
              compound_after: newCompound,
            });

            // Update stint history
            newStintHistory = prev.stintHistory.map(item => {
              if (item.driver_number === pitDriver) {
                const updatedStints = [...item.stints];
                // Close current stint
                if (updatedStints.length > 0) {
                  updatedStints[updatedStints.length - 1].lap_end = newLap - 1;
                }
                // Add new stint
                updatedStints.push({
                  compound: newCompound,
                  lap_start: newLap,
                  lap_end: null,
                });
                return { ...item, stints: updatedStints };
              }
              return item;
            });

            newStints.set(pitDriver, {
              ...currentStint,
              compound: newCompound,
              stint_number: currentStint.stint_number + 1,
              lap_start: newLap,
              tyre_age_at_start: 0,
            });

            newRaceControl.unshift({
              message: `${driver.name_acronym} PIT STOP - ${newCompound}`,
              category: 'Other',
              flag: null,
              lap_number: newLap,
              driver_number: pitDriver,
              scope: 'Driver',
              sector: null,
              date: new Date().toISOString(),
              meeting_key: 1234,
              session_key: 9999,
            });
          }
        }

        // Simulate overtakes
        if (Math.random() < 0.02 && newLap > 1) {
          const overtakePos = Math.floor(Math.random() * 18) + 1;
          const driver1 = newPositions[overtakePos];
          const driver2 = newPositions[overtakePos + 1];
          if (driver1 && driver2) {
            newPositions[overtakePos] = driver2;
            newPositions[overtakePos + 1] = driver1;

            const d1 = mockDrivers.find(d => d.driver_number === driver1);
            const d2 = mockDrivers.find(d => d.driver_number === driver2);

            newRaceControl.unshift({
              message: `${d2?.name_acronym} OVERTAKES ${d1?.name_acronym} FOR P${overtakePos + 1}`,
              category: 'Other',
              flag: null,
              lap_number: newLap,
              driver_number: driver2,
              scope: 'Driver',
              sector: null,
              date: new Date().toISOString(),
              meeting_key: 1234,
              session_key: 9999,
            });
          }
        }

        while (newRaceControl.length > 15) {
          newRaceControl.pop();
        }
        while (newPitStops.length > 10) {
          newPitStops.pop();
        }
        while (newPitStopsWithTires.length > 20) {
          newPitStopsWithTires.pop();
        }

        // Update gaps
        const leaderProgress = newProgress.get(newPositions[0]) || 0;
        newPositions.forEach((driverNum) => {
          const driverProgress = newProgress.get(driverNum) || 0;
          let gap = (leaderProgress - driverProgress);
          if (gap < 0) gap += 1;
          newGaps.set(driverNum, gap * 90);
        });

        // Track historical data when lap changes
        let newGapHistory = prev.gapHistory;
        let newPositionHistory = prev.positionHistory;
        let newLapTimeHistory = prev.lapTimeHistory;

        if (newLap > prev.lap) {
          // Record gap history for this lap
          newGapHistory = [...prev.gapHistory, {
            lap: newLap,
            gaps: new Map(newGaps),
          }];
          // Keep last 60 laps
          if (newGapHistory.length > 60) {
            newGapHistory = newGapHistory.slice(-60);
          }

          // Record position history
          const posMap = new Map(newPositions.map((d, i) => [d, i + 1]));
          newPositionHistory = [...prev.positionHistory, {
            lap: newLap,
            positions: posMap,
          }];
          if (newPositionHistory.length > 60) {
            newPositionHistory = newPositionHistory.slice(-60);
          }

          // Generate lap times for each driver
          const lapTimes: LapTimeData[] = newPositions.map((driverNum, posIndex) => ({
            driver_number: driverNum,
            lap_number: newLap,
            lap_time: 81 + Math.random() * 1.5 + posIndex * 0.05,
            is_pit_lap: newPitStops.some(p => p.driver_number === driverNum && p.lap_number === newLap),
          }));
          newLapTimeHistory = [...prev.lapTimeHistory, ...lapTimes];
          // Keep last 1000 lap time entries
          if (newLapTimeHistory.length > 1000) {
            newLapTimeHistory = newLapTimeHistory.slice(-1000);
          }

          // Generate speed trap data for this lap
          const newSpeedTrapEntries: SpeedTrapData[] = newPositions.map((driverNum, posIndex) => ({
            driver_number: driverNum,
            speed: 340 + Math.random() * 20 - posIndex * 0.3,
            lap_number: newLap,
          }));

          // Generate sector times for this lap
          const newSectorEntries: SectorData[] = newPositions.map((driverNum, posIndex) => ({
            driver_number: driverNum,
            sector_1: 26 + Math.random() * 0.8 + posIndex * 0.02,
            sector_2: 28 + Math.random() * 0.8 + posIndex * 0.02,
            sector_3: 27 + Math.random() * 0.8 + posIndex * 0.02,
            lap_number: newLap,
          }));

          // Update fastest laps - find best lap time per driver
          const updatedFastestLaps: FastestLapData[] = [];
          const fastestByDriver = new Map<number, FastestLapData>();

          // Include previous fastest laps
          prev.fastestLaps.forEach(fl => {
            const existing = fastestByDriver.get(fl.driver_number);
            if (!existing || fl.lap_time < existing.lap_time) {
              fastestByDriver.set(fl.driver_number, fl);
            }
          });

          // Check new lap times
          lapTimes.forEach(lt => {
            if (!lt.is_pit_lap) {
              const existing = fastestByDriver.get(lt.driver_number);
              if (!existing || lt.lap_time < existing.lap_time) {
                fastestByDriver.set(lt.driver_number, {
                  driver_number: lt.driver_number,
                  lap_time: lt.lap_time,
                  lap_number: lt.lap_number,
                });
              }
            }
          });

          fastestByDriver.forEach(fl => updatedFastestLaps.push(fl));

          return {
            ...prev,
            lap: newLap,
            positions: newPositions,
            gaps: newGaps,
            trackProgress: newProgress,
            raceControl: newRaceControl,
            pitStops: newPitStops,
            currentStints: newStints,
            isRunning: newLap < prev.totalLaps,
            gapHistory: newGapHistory,
            positionHistory: newPositionHistory,
            lapTimeHistory: newLapTimeHistory,
            stintHistory: newStintHistory,
            pitStopsWithTires: newPitStopsWithTires,
            speedTrapData: newSpeedTrapEntries,
            sectorData: newSectorEntries,
            fastestLaps: updatedFastestLaps,
          };
        }

        return {
          ...prev,
          lap: newLap,
          positions: newPositions,
          gaps: newGaps,
          trackProgress: newProgress,
          raceControl: newRaceControl,
          pitStops: newPitStops,
          currentStints: newStints,
          isRunning: newLap < prev.totalLaps,
          gapHistory: newGapHistory,
          positionHistory: newPositionHistory,
          lapTimeHistory: newLapTimeHistory,
          stintHistory: newStintHistory,
          pitStopsWithTires: newPitStopsWithTires,
        };
      });

      setLastUpdated(new Date());
    }, 100);

    return () => clearInterval(interval);
  }, [raceState.isRunning]);

  // Convert race state to component props
  const mockPositions: Position[] = raceState.positions.map((driverNum, idx) => ({
    driver_number: driverNum,
    position: idx + 1,
    date: new Date().toISOString(),
    meeting_key: 1234,
    session_key: 9999,
  }));

  const mockIntervals: Interval[] = raceState.positions.map((driverNum, idx) => ({
    driver_number: driverNum,
    gap_to_leader: idx === 0 ? null : raceState.gaps.get(driverNum) || 0,
    interval: idx === 0 ? null : (raceState.gaps.get(driverNum) || 0) - (raceState.gaps.get(raceState.positions[idx - 1]) || 0),
    date: new Date().toISOString(),
    meeting_key: 1234,
    session_key: 9999,
  }));

  const mockStints: Stint[] = Array.from(raceState.currentStints.values());

  const mockWeather: Weather = {
    air_temperature: 24,
    track_temperature: 42,
    humidity: 45,
    pressure: 1013,
    rainfall: 0,
    wind_speed: 3.2,
    wind_direction: 180,
    date: new Date().toISOString(),
    meeting_key: 1234,
    session_key: 9999,
  };

  // Convert track progress to locations (recalculates every render for smooth animation)
  const mockLocations: Location[] = raceState.positions.map(driverNum => {
    const progress = raceState.trackProgress.get(driverNum) || 0;
    const totalPoints = trackPointsNormalized.length;
    const clampedProgress = Math.min(Math.max(progress, 0), 0.9999);
    const exactIndex = clampedProgress * totalPoints;
    const index = Math.floor(exactIndex) % totalPoints;
    const nextIndex = (index + 1) % totalPoints;
    const t = exactIndex - Math.floor(exactIndex);

    const p1 = trackPointsNormalized[index];
    const p2 = trackPointsNormalized[nextIndex];

    return {
      driver_number: driverNum,
      x: p1.x + (p2.x - p1.x) * t,
      y: p1.y + (p2.y - p1.y) * t,
      z: 0,
      date: new Date().toISOString(),
      meeting_key: 1234,
      session_key: 9999,
    };
  });

  // Position history for deltas
  const positionHistory = useMemo(() => {
    const history: Record<number, number[]> = {};
    mockPositions.forEach((pos) => {
      const prevPos = initialPositionOrder.indexOf(pos.driver_number) + 1;
      history[pos.driver_number] = [prevPos, pos.position];
    });
    return history;
  }, [mockPositions]);

  // Mock laps
  const mockLaps = useMemo(() => {
    const laps = new Map<number, Lap>();
    mockDrivers.forEach(driver => {
      const baseLapTime = 81 + Math.random() * 2;
      laps.set(driver.driver_number, {
        driver_number: driver.driver_number,
        lap_number: raceState.lap,
        lap_duration: baseLapTime,
        duration_sector_1: 26 + Math.random() * 0.5,
        duration_sector_2: 28 + Math.random() * 0.5,
        duration_sector_3: 27 + Math.random() * 0.5,
        i1_speed: 320 + Math.random() * 10,
        i2_speed: 295 + Math.random() * 10,
        st_speed: 340 + Math.random() * 15,
        is_pit_out_lap: false,
        segments_sector_1: null,
        segments_sector_2: null,
        segments_sector_3: null,
        date_start: new Date().toISOString(),
        meeting_key: 1234,
        session_key: 9999,
      });
    });
    return laps;
  }, [raceState.lap]);

  const getPositionDelta = useCallback((driverNumber: number): number => {
    const history = positionHistory[driverNumber];
    if (!history || history.length < 2) return 0;
    return history[0] - history[1];
  }, [positionHistory]);

  const getCurrentStint = useCallback((driverNumber: number): Stint | null => {
    return raceState.currentStints.get(driverNumber) || null;
  }, [raceState.currentStints]);

  const getInterval = useCallback((driverNumber: number): Interval | null => {
    return mockIntervals.find(i => i.driver_number === driverNumber) || null;
  }, [mockIntervals]);

  const getLastLap = useCallback((driverNumber: number): Lap | null => {
    return mockLaps.get(driverNumber) || null;
  }, [mockLaps]);

  const getBestLap = useCallback((driverNumber: number): Lap | null => {
    return mockLaps.get(driverNumber) || null; // Demo uses last lap as best lap
  }, [mockLaps]);

  const progressPercent = (raceState.lap / raceState.totalLaps) * 100;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Full-width header bar */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500">
        <div className="mx-auto max-w-[1800px] px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-white animate-pulse" />
                <span className="text-white font-bold text-lg">LIVE SIMULATION</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-white/30" />
              <span className="hidden sm:block text-white/90 font-medium">
                Italian Grand Prix - Monza
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Lap Counter - always visible */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/20">
                <span className="text-white/70 text-xs font-medium">LAP</span>
                <span className="text-white font-bold text-xl tabular-nums">
                  {raceState.lap}<span className="text-white/50 text-lg">/{raceState.totalLaps}</span>
                </span>
              </div>
              <button
                onClick={() => setRaceState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
              >
                {raceState.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {raceState.isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={resetRace}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1800px] px-4 py-4 sm:px-6 space-y-4">
        {/* Flag Banner */}
        <FlagBanner messages={raceState.raceControl} />

        {/* Session Header */}
        <SessionHeader
          session={mockSession}
          weather={mockWeather}
          isLive={true}
          lastUpdated={lastUpdated}
        />

        {/* Main Content - Full Width Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Left sidebar - Track Map & Key Info */}
          <div className="xl:col-span-1 space-y-4">
            <LiveTrackMap
              sessionKey={mockSession.session_key}
              circuitSlug="monza"
              drivers={mockDrivers}
              isLive={raceState.isRunning}
              mockLocations={mockLocations}
              skipNormalization={true}
            />
            <BattleTrackerChart
              battles={mockIntervals.slice(1).map((interval, idx) => ({
                driver_ahead: raceState.positions[idx],
                driver_behind: raceState.positions[idx + 1],
                gap: Math.abs(interval.interval || 0),
                position: idx + 1,
              })).filter(b => b.gap <= 1.0)}
              drivers={mockDrivers}
            />
            <FastestLapChart
              fastestLaps={raceState.fastestLaps}
              drivers={mockDrivers}
              currentLap={raceState.lap}
            />
            <SectorTimesChart
              sectorData={raceState.sectorData}
              drivers={mockDrivers}
            />
          </div>

          {/* Leaderboard - Main area */}
          <div className="xl:col-span-2">
            <Leaderboard
              positions={mockPositions}
              drivers={mockDrivers}
              intervals={mockIntervals}
              stints={mockStints}
              laps={mockLaps}
              getPositionDelta={getPositionDelta}
              getCurrentStint={getCurrentStint}
              getInterval={getInterval}
              getLastLap={getLastLap}
              getBestLap={getBestLap}
            />
          </div>

          {/* Right sidebar - Race Control & Strategy */}
          <div className="xl:col-span-1 space-y-4">
            <RaceControlFeed messages={raceState.raceControl} drivers={mockDrivers} />
            <PitStopList pitStops={raceState.pitStopsWithTires.map(p => ({ ...p, date: new Date().toISOString(), meeting_key: 1234, session_key: 9999 }))} drivers={mockDrivers} />
            <TireStrategyChart
              stintHistory={raceState.stintHistory}
              drivers={mockDrivers}
              currentLap={raceState.lap}
              totalLaps={raceState.totalLaps}
            />
            <SpeedTrapChart
              speedData={raceState.speedTrapData}
              drivers={mockDrivers}
            />
          </div>
        </div>

        {/* Race Analytics Charts */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-4">Race Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Gap Evolution Chart */}
            <GapChart
              data={raceState.gapHistory}
              drivers={mockDrivers}
              currentLap={raceState.lap}
            />

            {/* Position Changes Chart */}
            <PositionChart
              positionHistory={raceState.positionHistory}
              drivers={mockDrivers}
              currentLap={raceState.lap}
            />

            {/* Lap Time Chart */}
            <LapTimeChart
              lapTimes={raceState.lapTimeHistory}
              drivers={mockDrivers}
              currentLap={raceState.lap}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
