// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Position,
  Interval,
  Stint,
  PitStop,
  RaceControlMessage,
  Weather,
  Lap,
} from '@/lib/api/openf1/types';

const OPENF1_BASE = '/api/openf1';
const POLL_INTERVAL = 4000; // 4 seconds - matches OpenF1 update frequency

interface LiveDataState {
  positions: Position[];
  intervals: Interval[];
  stints: Stint[];
  pitStops: PitStop[];
  raceControl: RaceControlMessage[];
  weather: Weather | null;
  laps: Map<number, Lap>; // keyed by driver_number - last lap
  bestLaps: Map<number, Lap>; // keyed by driver_number - best lap (for qualifying)
  allLaps: Lap[]; // Full historical lap data for charts
  allPositions: Position[]; // Full historical position data for charts
  allIntervals: Interval[]; // Full historical interval data for charts
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface PositionHistory {
  [driverNumber: number]: number[]; // Array of last N positions
}

export function useLiveData(sessionKey: number | null, isLive: boolean) {
  const [state, setState] = useState<LiveDataState>({
    positions: [],
    intervals: [],
    stints: [],
    pitStops: [],
    raceControl: [],
    weather: null,
    laps: new Map(),
    bestLaps: new Map(),
    allLaps: [],
    allPositions: [],
    allIntervals: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [positionHistory, setPositionHistory] = useState<PositionHistory>({});
  const isFirstLoad = useRef(true);

  // Refs for stable callback references — updated each render cycle
  const stintsRef = useRef(state.stints);
  stintsRef.current = state.stints;
  const pitStopsRef = useRef(state.pitStops);
  pitStopsRef.current = state.pitStops;
  const intervalsRef = useRef(state.intervals);
  intervalsRef.current = state.intervals;
  const lapsRef = useRef(state.laps);
  lapsRef.current = state.laps;
  const bestLapsRef = useRef(state.bestLaps);
  bestLapsRef.current = state.bestLaps;
  const posHistoryRef = useRef(positionHistory);
  posHistoryRef.current = positionHistory;

  const fetchData = useCallback(async () => {
    if (!sessionKey) return;

    try {
      // Fetch all data in parallel
      const [positionsRes, intervalsRes, stintsRes, pitStopsRes, raceControlRes, weatherRes, lapsRes] =
        await Promise.all([
          fetch(`${OPENF1_BASE}/position?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/intervals?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/stints?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/pit?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/race_control?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/weather?session_key=${sessionKey}`, { cache: 'no-store' }),
          fetch(`${OPENF1_BASE}/laps?session_key=${sessionKey}`, { cache: 'no-store' }),
        ]);

      // Parse responses
      const [allPositions, allIntervals, stints, pitStops, raceControl, allWeather, allLaps]: [
        Position[],
        Interval[],
        Stint[],
        PitStop[],
        RaceControlMessage[],
        Weather[],
        Lap[]
      ] = await Promise.all([
        positionsRes.ok ? positionsRes.json() : [],
        intervalsRes.ok ? intervalsRes.json() : [],
        stintsRes.ok ? stintsRes.json() : [],
        pitStopsRes.ok ? pitStopsRes.json() : [],
        raceControlRes.ok ? raceControlRes.json() : [],
        weatherRes.ok ? weatherRes.json() : [],
        lapsRes.ok ? lapsRes.json() : [],
      ]);

      // Get latest position for each driver
      const latestPositions = new Map<number, Position>();
      for (const pos of allPositions) {
        const existing = latestPositions.get(pos.driver_number);
        if (!existing || new Date(pos.date) > new Date(existing.date)) {
          latestPositions.set(pos.driver_number, pos);
        }
      }
      const positions = Array.from(latestPositions.values()).sort(
        (a, b) => a.position - b.position
      );

      // Get latest interval for each driver
      const latestIntervals = new Map<number, Interval>();
      for (const int of allIntervals) {
        const existing = latestIntervals.get(int.driver_number);
        if (!existing || new Date(int.date) > new Date(existing.date)) {
          latestIntervals.set(int.driver_number, int);
        }
      }
      const intervals = Array.from(latestIntervals.values());

      // Get latest weather
      const weather = allWeather.length > 0
        ? allWeather.reduce((latest, current) =>
            new Date(current.date) > new Date(latest.date) ? current : latest
          )
        : null;

      // Get latest lap for each driver
      const laps = new Map<number, Lap>();
      for (const lap of allLaps) {
        const existing = laps.get(lap.driver_number);
        if (!existing || lap.lap_number > existing.lap_number) {
          laps.set(lap.driver_number, lap);
        }
      }

      // Get best lap for each driver (for qualifying)
      const bestLaps = new Map<number, Lap>();
      for (const lap of allLaps) {
        if (lap.lap_duration === null) continue;
        const existing = bestLaps.get(lap.driver_number);
        if (!existing || (existing.lap_duration !== null && lap.lap_duration < existing.lap_duration)) {
          bestLaps.set(lap.driver_number, lap);
        }
      }

      // Sort race control by date descending (most recent first)
      const sortedRaceControl = [...raceControl].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Update position history for delta calculation
      setPositionHistory(prev => {
        const newHistory = { ...prev };
        for (const pos of positions) {
          const driverHistory = newHistory[pos.driver_number] || [];
          // Keep last 5 positions
          newHistory[pos.driver_number] = [...driverHistory, pos.position].slice(-5);
        }
        return newHistory;
      });

      setState(prev => {
        // Never replace good data with empty data (handles API timeouts / red flags)
        const usePositions = positions.length > 0 ? positions : prev.positions;
        const useIntervals = intervals.length > 0 ? intervals : prev.intervals;
        const useStints = stints.length > 0 ? stints : prev.stints;
        const usePitStops = pitStops.length > 0 ? pitStops : prev.pitStops;
        const useLaps = laps.size > 0 ? laps : prev.laps;
        const useBestLaps = bestLaps.size > 0 ? bestLaps : prev.bestLaps;
        const useAllLaps = allLaps.length > 0 ? allLaps : prev.allLaps;
        const useAllPositions = allPositions.length > 0 ? allPositions : prev.allPositions;
        const useAllIntervals = allIntervals.length > 0 ? allIntervals : prev.allIntervals;
        const useRaceControl = sortedRaceControl.length > 0 ? sortedRaceControl.slice(0, 30) : prev.raceControl;

        // Deep-compare positions: only update if driver order or assignments changed
        const positionsChanged = usePositions.length !== prev.positions.length ||
          usePositions.some((p, i) =>
            !prev.positions[i] ||
            p.driver_number !== prev.positions[i].driver_number ||
            p.position !== prev.positions[i].position
          );

        // Deep-compare intervals: only update if gap values changed
        const intervalsChanged = useIntervals.length !== prev.intervals.length ||
          useIntervals.some(int => {
            const prevInt = prev.intervals.find(p => p.driver_number === int.driver_number);
            return !prevInt ||
              prevInt.gap_to_leader !== int.gap_to_leader ||
              prevInt.interval !== int.interval;
          });

        // Deep-compare laps: only update if lap numbers or durations changed
        const lapsChanged = useLaps.size !== prev.laps.size ||
          Array.from(useLaps.entries()).some(([driver, lap]) => {
            const prevLap = prev.laps.get(driver);
            return !prevLap ||
              prevLap.lap_number !== lap.lap_number ||
              prevLap.lap_duration !== lap.lap_duration;
          });

        const bestLapsChanged = useBestLaps.size !== prev.bestLaps.size ||
          Array.from(useBestLaps.entries()).some(([driver, lap]) => {
            const prevLap = prev.bestLaps.get(driver);
            return !prevLap || prevLap.lap_duration !== lap.lap_duration;
          });

        return {
          positions: positionsChanged ? usePositions : prev.positions,
          intervals: intervalsChanged ? useIntervals : prev.intervals,
          stints: useStints.length !== prev.stints.length ? useStints : prev.stints,
          pitStops: usePitStops.length !== prev.pitStops.length ? usePitStops : prev.pitStops,
          raceControl: useRaceControl,
          weather: weather || prev.weather,
          laps: lapsChanged ? useLaps : prev.laps,
          bestLaps: bestLapsChanged ? useBestLaps : prev.bestLaps,
          allLaps: useAllLaps.length !== prev.allLaps.length ? useAllLaps : prev.allLaps,
          allPositions: useAllPositions.length !== prev.allPositions.length ? useAllPositions : prev.allPositions,
          allIntervals: useAllIntervals.length !== prev.allIntervals.length ? useAllIntervals : prev.allIntervals,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        };
      });

      isFirstLoad.current = false;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live data',
      }));
    }
  }, [sessionKey]);

  useEffect(() => {
    if (!sessionKey) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        positions: [],
        intervals: [],
        stints: [],
        pitStops: [],
        raceControl: [],
        weather: null,
        laps: new Map(),
        bestLaps: new Map(),
        allLaps: [],
        allPositions: [],
        allIntervals: [],
      }));
      return;
    }

    // Initial fetch
    fetchData();

    // Only poll if session is live
    if (isLive) {
      const interval = setInterval(fetchData, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [sessionKey, isLive, fetchData]);

  // Calculate position deltas
  const getPositionDelta = useCallback(
    (driverNumber: number): number => {
      const history = posHistoryRef.current[driverNumber];
      if (!history || history.length < 2) return 0;
      return history[history.length - 2] - history[history.length - 1];
    },
    []
  );

  // Get current stint for a driver
  const getCurrentStint = useCallback(
    (driverNumber: number): Stint | null => {
      const driverStints = stintsRef.current.filter(s => s.driver_number === driverNumber);
      if (driverStints.length === 0) return null;
      return driverStints.reduce((latest, current) =>
        current.stint_number > latest.stint_number ? current : latest
      );
    },
    []
  );

  // Get pit stops for a driver
  const getDriverPitStops = useCallback(
    (driverNumber: number): PitStop[] => {
      return pitStopsRef.current
        .filter(p => p.driver_number === driverNumber)
        .sort((a, b) => b.lap_number - a.lap_number);
    },
    []
  );

  // Get interval for a driver
  const getInterval = useCallback(
    (driverNumber: number): Interval | null => {
      return intervalsRef.current.find(i => i.driver_number === driverNumber) || null;
    },
    []
  );

  // Get last lap for a driver
  const getLastLap = useCallback(
    (driverNumber: number): Lap | null => {
      return lapsRef.current.get(driverNumber) || null;
    },
    []
  );

  // Get best lap for a driver (for qualifying)
  const getBestLap = useCallback(
    (driverNumber: number): Lap | null => {
      return bestLapsRef.current.get(driverNumber) || null;
    },
    []
  );

  return {
    ...state,
    getPositionDelta,
    getCurrentStint,
    getDriverPitStops,
    getInterval,
    getLastLap,
    getBestLap,
    refresh: fetchData,
  };
}
