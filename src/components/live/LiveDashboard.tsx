'use client';

import { useLiveSession } from '@/hooks/useLiveSession';
import { useLiveData } from '@/hooks/useLiveData';
import { useChartData } from '@/hooks/useChartData';
import { SessionHeader } from './SessionHeader';
import { FlagBanner } from './FlagBanner';
import { Leaderboard } from './Leaderboard';
import { RaceControlFeed } from './RaceControlFeed';
import { PitStopList } from './PitStopList';
import { LiveTrackMap } from './LiveTrackMap';
import { NoLiveSession } from './NoLiveSession';
import { GapChart } from './charts/GapChart';
import { PositionChart } from './charts/PositionChart';
import { LapTimeChart } from './charts/LapTimeChart';
import { TireStrategyChart } from './charts/TireStrategyChart';
import { BattleTrackerChart } from './charts/BattleTrackerChart';
import { FastestLapChart } from './charts/FastestLapChart';
import { SpeedTrapChart } from './charts/SpeedTrapChart';
import { SectorTimesChart } from './charts/SectorTimesChart';
import { resolveCircuitSlug } from '@/lib/constants/track-svgs';
import { Loader2 } from 'lucide-react';

export function LiveDashboard() {
  const {
    session,
    drivers,
    isLive,
    isLoading: sessionLoading,
    error: sessionError,
    refresh: refreshSession,
  } = useLiveSession();

  const {
    positions,
    intervals,
    stints,
    pitStops,
    raceControl,
    weather,
    laps,
    allLaps,
    isLoading: dataLoading,
    error: dataError,
    lastUpdated,
    getPositionDelta,
    getCurrentStint,
    getInterval,
    getLastLap,
    getBestLap,
  } = useLiveData(session?.session_key ?? null, isLive);

  const chartData = useChartData(
    allLaps,
    stints,
    intervals,
    positions,
    raceControl,
  );

  // Show loading state on initial load
  if (sessionLoading && !session) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
          <p className="text-zinc-400">Checking for live session...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (sessionError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-emerald-500 mb-4">Error: {sessionError}</p>
          <button
            onClick={refreshSession}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show no live session state
  if (!session || !isLive) {
    return (
      <NoLiveSession
        latestSession={session}
        isLoading={sessionLoading}
        onRefresh={refreshSession}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Flag Banner (full width, shown when flag is active) */}
      <FlagBanner messages={raceControl} />

      {/* Session Header */}
      <SessionHeader
        session={session}
        weather={weather}
        isLive={isLive}
        lastUpdated={lastUpdated}
      />

      {/* Main Content - Full Width Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Left sidebar - Track Map & Key Info */}
        <div className="xl:col-span-1 space-y-4">
          <LiveTrackMap
            sessionKey={session?.session_key ?? null}
            circuitSlug={resolveCircuitSlug(session?.circuit_short_name)}
            layoutImageUrl={resolveCircuitSlug(session?.circuit_short_name) ? `/images/tracks/${resolveCircuitSlug(session?.circuit_short_name)}.png` : null}
            drivers={drivers}
            isLive={isLive}
          />
          <BattleTrackerChart
            battles={chartData.battleData}
            drivers={drivers}
          />
          <FastestLapChart
            fastestLaps={chartData.fastestLaps}
            drivers={drivers}
            currentLap={chartData.currentLap}
          />
          <SectorTimesChart
            sectorData={chartData.sectorData}
            drivers={drivers}
          />
        </div>

        {/* Leaderboard - Main area */}
        <div className="xl:col-span-2">
          {dataLoading && positions.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <Leaderboard
              positions={positions}
              drivers={drivers}
              intervals={intervals}
              stints={stints}
              laps={laps}
              getPositionDelta={getPositionDelta}
              getCurrentStint={getCurrentStint}
              getInterval={getInterval}
              getLastLap={getLastLap}
              getBestLap={getBestLap}
              sessionType={session?.session_type}
            />
          )}
        </div>

        {/* Right sidebar - Race Control & Strategy */}
        <div className="xl:col-span-1 space-y-4">
          <RaceControlFeed messages={raceControl} drivers={drivers} />
          <PitStopList pitStops={pitStops} drivers={drivers} />
          <TireStrategyChart
            stintHistory={chartData.stintHistory}
            drivers={drivers}
            currentLap={chartData.currentLap}
            totalLaps={chartData.totalLaps}
          />
          <SpeedTrapChart
            speedData={chartData.speedTrapData}
            drivers={drivers}
          />
        </div>
      </div>

      {/* Race Analytics Charts */}
      {chartData.currentLap > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-white mb-4">Race Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <GapChart
              data={chartData.gapHistory}
              drivers={drivers}
              currentLap={chartData.currentLap}
            />
            <PositionChart
              positionHistory={chartData.positionHistory}
              drivers={drivers}
              currentLap={chartData.currentLap}
            />
            <LapTimeChart
              lapTimes={chartData.lapTimeHistory}
              drivers={drivers}
              currentLap={chartData.currentLap}
            />
          </div>
        </div>
      )}

      {/* Error indicator (if data fetch fails but we have some data) */}
      {dataError && positions.length > 0 && (
        <div className="text-center text-sm text-yellow-500 py-2">
          Warning: {dataError}. Showing last known data.
        </div>
      )}
    </div>
  );
}
