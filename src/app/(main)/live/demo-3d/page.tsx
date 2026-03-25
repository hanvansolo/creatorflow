'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
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

// Dynamically import 3D component to avoid SSR issues
const LiveTrackMap3D = dynamic(
  () => import('@/components/live/LiveTrackMap3D').then(mod => ({ default: mod.LiveTrackMap3D })),
  { ssr: false, loading: () => <div className="aspect-square bg-zinc-900 animate-pulse rounded-xl" /> }
);

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

// Starting order (will change during race simulation)
const initialPositionOrder = [1, 4, 44, 16, 63, 81, 11, 14, 55, 22, 12, 10, 23, 18, 30, 7, 77, 27, 87, 31];

// Tire strategies
const tireStrategies: Record<number, { compound: 'SOFT' | 'MEDIUM' | 'HARD'; stintLength: number }[]> = {
  1: [{ compound: 'MEDIUM', stintLength: 25 }, { compound: 'HARD', stintLength: 28 }],
  4: [{ compound: 'HARD', stintLength: 30 }, { compound: 'MEDIUM', stintLength: 23 }],
  44: [{ compound: 'MEDIUM', stintLength: 22 }, { compound: 'HARD', stintLength: 31 }],
  16: [{ compound: 'SOFT', stintLength: 18 }, { compound: 'MEDIUM', stintLength: 20 }, { compound: 'HARD', stintLength: 15 }],
};

// Race simulation state
interface RaceState {
  lap: number;
  totalLaps: number;
  positions: number[];
  gaps: Map<number, number>;
  trackProgress: Map<number, number>; // 0-1 progress around track
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  currentStints: Map<number, Stint>;
  isRunning: boolean;
}

export default function LiveDemo3DPage() {
  const [raceState, setRaceState] = useState<RaceState>({
    lap: 1,
    totalLaps: 53,
    positions: [...initialPositionOrder],
    gaps: new Map(initialPositionOrder.map((d, i) => [d, i * 1.5])),
    trackProgress: new Map(initialPositionOrder.map((d, i) => [d, 1 - (i * 0.04)])),
    pitStops: [],
    raceControl: [],
    currentStints: new Map(mockDrivers.map(d => [d.driver_number, {
      driver_number: d.driver_number,
      compound: 'MEDIUM' as const,
      stint_number: 1,
      lap_start: 1,
      lap_end: null,
      tyre_age_at_start: 0,
      meeting_key: 1234,
      session_key: 9999,
    }])),
    isRunning: true,
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [show3D, setShow3D] = useState(true);

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
        let newLap = prev.lap;

        // Move each car based on their speed (position affects speed slightly)
        prev.positions.forEach((driverNum, posIndex) => {
          const currentProgress = newProgress.get(driverNum) || 0;
          // Base speed + small random variation + position-based speed (leaders slightly faster)
          const baseSpeed = 0.012;
          const positionBonus = (20 - posIndex) * 0.0002;
          const randomVariation = (Math.random() - 0.5) * 0.002;
          const speed = baseSpeed + positionBonus + randomVariation;

          let newProgressValue = currentProgress + speed;

          // Check if crossed start/finish
          if (newProgressValue >= 1) {
            newProgressValue = newProgressValue - 1;
            // Leader completed a lap
            if (posIndex === 0 && newLap < prev.totalLaps) {
              newLap++;
              // Add lap completion message
              if (newLap % 5 === 0 || newLap === prev.totalLaps) {
                newRaceControl.unshift({
                  message: newLap === prev.totalLaps
                    ? 'CHEQUERED FLAG - RACE COMPLETE'
                    : `LAP ${newLap}/${prev.totalLaps} COMPLETED`,
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

        // Occasionally simulate overtakes
        if (Math.random() < 0.02 && newLap > 1) {
          const overtakePos = Math.floor(Math.random() * 18) + 1;
          const driver1 = newPositions[overtakePos];
          const driver2 = newPositions[overtakePos + 1];
          if (driver1 && driver2) {
            // Swap positions
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

        // Keep only last 20 race control messages
        while (newRaceControl.length > 20) {
          newRaceControl.pop();
        }

        // Update gaps based on progress
        const leaderProgress = newProgress.get(newPositions[0]) || 0;
        newPositions.forEach((driverNum, idx) => {
          const driverProgress = newProgress.get(driverNum) || 0;
          let gap = (leaderProgress - driverProgress);
          if (gap < 0) gap += 1; // Handle lap difference
          newGaps.set(driverNum, gap * 90); // Convert to seconds (roughly 90s lap)
        });

        return {
          ...prev,
          lap: newLap,
          positions: newPositions,
          gaps: newGaps,
          trackProgress: newProgress,
          raceControl: newRaceControl,
          pitStops: newPitStops,
          isRunning: newLap < prev.totalLaps,
        };
      });

      setLastUpdated(new Date());
    }, 100); // 10fps for smooth animation

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

  // Convert track progress to location coordinates
  const mockLocations: Location[] = useMemo(() => {
    return raceState.positions.map(driverNum => {
      const progress = raceState.trackProgress.get(driverNum) || 0;
      const totalPoints = trackPointsNormalized.length;
      // Clamp progress to [0, 1) to avoid index out of bounds
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
  }, [raceState.trackProgress, raceState.positions]);

  // Position history for deltas
  const positionHistory = useMemo(() => {
    const history: Record<number, number[]> = {};
    mockPositions.forEach((pos, idx) => {
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

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        {/* Demo Banner */}
        <div className="rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-red-400 text-sm font-bold uppercase tracking-wider">
                Live Race Simulation
              </span>
              <p className="text-zinc-400 text-xs mt-0.5">
                Lap {raceState.lap}/{raceState.totalLaps} • Italian Grand Prix • Monza
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShow3D(!show3D)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                {show3D ? 'Show 2D Map' : 'Show 3D Map'}
              </button>
              <button
                onClick={() => setRaceState(prev => ({ ...prev, isRunning: !prev.isRunning }))}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  raceState.isRunning
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {raceState.isRunning ? 'Pause' : 'Resume'}
              </button>
            </div>
          </div>
        </div>

        {/* Flag Banner */}
        <FlagBanner messages={raceState.raceControl} />

        {/* Session Header */}
        <SessionHeader
          session={mockSession}
          weather={mockWeather}
          isLive={true}
          lastUpdated={lastUpdated}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leaderboard */}
          <div className="lg:col-span-2">
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

          {/* Sidebar */}
          <div className="space-y-4">
            {show3D ? (
              <LiveTrackMap3D
                circuitSlug="monza"
                drivers={mockDrivers}
                locations={mockLocations}
                isLive={raceState.isRunning}
              />
            ) : (
              <LiveTrackMap
                sessionKey={mockSession.session_key}
                circuitSlug="monza"
                drivers={mockDrivers}
                isLive={true}
                mockLocations={mockLocations}
                skipNormalization={true}
              />
            )}
            <RaceControlFeed messages={raceState.raceControl} drivers={mockDrivers} />
            <PitStopList pitStops={raceState.pitStops} drivers={mockDrivers} />
          </div>
        </div>
      </div>
    </div>
  );
}
