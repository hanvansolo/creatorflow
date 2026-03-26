// @ts-nocheck
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { Driver, Location } from '@/lib/api/openf1/types';
import { TRACK_SVGS, DEFAULT_TRACK_SVG } from '@/lib/constants/track-svgs';
import { getTrackFeatures } from '@/lib/constants/track-features';

interface LiveTrackMapProps {
  sessionKey: number | null;
  circuitSlug?: string;
  layoutImageUrl?: string | null;
  drivers: Driver[];
  isLive: boolean;
  mockLocations?: Location[];
  skipNormalization?: boolean;
}

interface CarPosition {
  driverNumber: number;
  x: number;
  y: number;
  teamColor: string;
  acronym: string;
}

const OPENF1_BASE = '/api/openf1';
const LOCATION_POLL_INTERVAL = 2000;

interface CircuitBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const DEFAULT_BOUNDS: CircuitBounds = {
  minX: -10000,
  maxX: 10000,
  minY: -10000,
  maxY: 10000,
};

function normalizeCoordinates(
  x: number,
  y: number,
  bounds: CircuitBounds,
  viewBoxSize: number = 100,
  padding: number = 8
): { x: number; y: number } {
  const rangeX = bounds.maxX - bounds.minX || 1;
  const rangeY = bounds.maxY - bounds.minY || 1;

  const normX = (x - bounds.minX) / rangeX;
  const normY = (y - bounds.minY) / rangeY;

  const usableSize = viewBoxSize - padding * 2;
  return {
    x: padding + normX * usableSize,
    // Invert Y: OpenF1 y increases northward, SVG y increases downward
    y: padding + (1 - normY) * usableSize,
  };
}

function calculateBounds(locations: { x: number; y: number }[]): CircuitBounds {
  if (locations.length === 0) return DEFAULT_BOUNDS;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  for (const loc of locations) {
    if (loc.x !== 0 || loc.y !== 0) {
      minX = Math.min(minX, loc.x);
      maxX = Math.max(maxX, loc.x);
      minY = Math.min(minY, loc.y);
      maxY = Math.max(maxY, loc.y);
    }
  }

  const paddingX = (maxX - minX) * 0.05;
  const paddingY = (maxY - minY) * 0.05;

  return {
    minX: minX - paddingX,
    maxX: maxX + paddingX,
    minY: minY - paddingY,
    maxY: maxY + paddingY,
  };
}

export function LiveTrackMap({ sessionKey, circuitSlug, layoutImageUrl, drivers, isLive, mockLocations, skipNormalization = false }: LiveTrackMapProps) {
  const [locations, setLocations] = useState<Location[]>(mockLocations || []);
  const [isLoading, setIsLoading] = useState(!mockLocations);
  const [trackOutline, setTrackOutline] = useState<string>('');

  // Accumulated location history for building the track outline
  const trackHistoryRef = useRef<Location[]>([]);
  const stableBoundsRef = useRef<CircuitBounds>(DEFAULT_BOUNDS);
  const initialFetchDone = useRef(false);

  const driverMap = useMemo(
    () => new Map(drivers.map(d => [d.driver_number, d])),
    [drivers]
  );

  // Sync locations with mockLocations prop when it changes
  useEffect(() => {
    if (mockLocations) {
      setLocations(mockLocations);
    }
  }, [mockLocations]);

  // Fetch locations
  useEffect(() => {
    if (mockLocations) return;

    if (!sessionKey || !isLive) {
      setIsLoading(false);
      return;
    }

    const fetchLocations = async () => {
      try {
        let url: string;

        if (!initialFetchDone.current) {
          // First fetch: wide 30-minute window to build track outline
          // even during red flags / stoppages
          const since = new Date(Date.now() - 1800000).toISOString();
          url = `${OPENF1_BASE}/location?session_key=${sessionKey}&date>${since}`;
        } else {
          // Subsequent: narrow 10-second window for position updates only
          const since = new Date(Date.now() - 10000).toISOString();
          url = `${OPENF1_BASE}/location?session_key=${sessionKey}&date>${since}`;
        }

        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const recentLocations: Location[] = await res.json();

        // Only mark initial fetch done when we actually got data
        if (recentLocations.length > 0) {
          initialFetchDone.current = true;
        }

        if (recentLocations.length > 0) {
          const validNew = recentLocations.filter(loc => loc.x !== 0 || loc.y !== 0);

          // On first load, use all data for track outline; on subsequent, accumulate
          if (trackHistoryRef.current.length === 0) {
            trackHistoryRef.current = validNew;
          } else {
            // Append new data, trim to last 10 minutes to prevent memory bloat
            const cutoff = Date.now() - 600000;
            trackHistoryRef.current = [
              ...trackHistoryRef.current.filter(loc => new Date(loc.date).getTime() > cutoff),
              ...validNew,
            ];
          }

          // Calculate stable bounds from ALL accumulated data
          stableBoundsRef.current = calculateBounds(trackHistoryRef.current);

          // Build track outline from the driver with the most data points
          const byDriver = new Map<number, Location[]>();
          for (const loc of trackHistoryRef.current) {
            if (!byDriver.has(loc.driver_number)) byDriver.set(loc.driver_number, []);
            byDriver.get(loc.driver_number)!.push(loc);
          }

          let bestLocs: Location[] = [];
          for (const locs of byDriver.values()) {
            if (locs.length > bestLocs.length) bestLocs = locs;
          }

          if (bestLocs.length > 20) {
            const sorted = [...bestLocs].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );
            // Downsample to ~200 points for smooth rendering
            const step = Math.max(1, Math.floor(sorted.length / 200));
            const sampled = sorted.filter((_, i) => i % step === 0);
            const pathD = sampled
              .map((loc, i) => {
                const p = normalizeCoordinates(loc.x, loc.y, stableBoundsRef.current);
                return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
              })
              .join(' ');
            setTrackOutline(pathD);
          }

          // Get latest location per driver for current positions
          const latestByDriver = new Map<number, Location>();
          for (const loc of recentLocations) {
            if (loc.x === 0 && loc.y === 0) continue;
            const existing = latestByDriver.get(loc.driver_number);
            if (!existing || new Date(loc.date) > new Date(existing.date)) {
              latestByDriver.set(loc.driver_number, loc);
            }
          }
          setLocations(Array.from(latestByDriver.values()));
        }
        // When no new data, keep existing locations (don't clear)

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        setIsLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, LOCATION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [sessionKey, isLive, mockLocations]);

  // Convert locations to car positions using stable accumulated bounds
  const carPositions: CarPosition[] = useMemo(() => {
    const bounds = stableBoundsRef.current;
    return locations
      .filter(loc => loc.x !== 0 || loc.y !== 0)
      .map(loc => {
        const driver = driverMap.get(loc.driver_number);
        const position = skipNormalization
          ? { x: loc.x, y: loc.y }
          : normalizeCoordinates(loc.x, loc.y, bounds);
        return {
          driverNumber: loc.driver_number,
          x: position.x,
          y: position.y,
          teamColor: driver?.team_colour ? `#${driver.team_colour}` : '#666',
          acronym: driver?.name_acronym || `${loc.driver_number}`,
        };
      });
  }, [locations, driverMap, skipNormalization]);

  // Whether we have enough data for data-driven rendering
  const hasLiveTrack = trackOutline.length > 0;

  // Fallback: pre-made SVG track and features
  const trackPath = circuitSlug ? (TRACK_SVGS[circuitSlug] || DEFAULT_TRACK_SVG) : DEFAULT_TRACK_SVG;
  const trackFeatures = getTrackFeatures(circuitSlug);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Track Map</h3>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live positions
          </span>
        )}
      </div>

      <div className="relative aspect-square p-4 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30">
        {/* Official circuit image as background */}
        {layoutImageUrl && (
          <img
            src={layoutImageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-contain opacity-30 pointer-events-none p-4"
          />
        )}
        <svg viewBox="0 0 100 100" className="relative w-full h-full" fill="none">

          {hasLiveTrack ? (
            <>
              {/* Data-driven track outline (from location data) */}
              <path
                d={trackOutline}
                stroke="#374151"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={trackOutline}
                stroke="#4b5563"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : (
            <>
              {/* Pre-made SVG track (fallback when no location data) */}
              <path
                d={trackPath}
                stroke="#374151"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d={trackPath}
                stroke="#4b5563"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />

              {/* Static track features (only with pre-made SVG) */}
              <g>
                <line
                  x1={trackFeatures.startFinish.x1}
                  y1={trackFeatures.startFinish.y1}
                  x2={trackFeatures.startFinish.x2}
                  y2={trackFeatures.startFinish.y2}
                  stroke="#ffffff"
                  strokeWidth="3"
                />
                <line
                  x1={trackFeatures.startFinish.x1}
                  y1={trackFeatures.startFinish.y1}
                  x2={trackFeatures.startFinish.x2}
                  y2={trackFeatures.startFinish.y2}
                  stroke="#000000"
                  strokeWidth="3"
                  strokeDasharray="1.5 1.5"
                />
                <text
                  x={(trackFeatures.startFinish.x1 + trackFeatures.startFinish.x2) / 2}
                  y={Math.min(trackFeatures.startFinish.y1, trackFeatures.startFinish.y2) - 3}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#ffffff"
                  fontWeight="bold"
                >
                  S/F
                </text>
              </g>

              {/* Sector markers */}
              {(['s1', 's2', 's3'] as const).map((sector, idx) => {
                const colors = ['#ef4444', '#eab308', '#22c55e'];
                const labels = ['S1', 'S2', 'S3'];
                const s = trackFeatures.sectors[sector];
                return (
                  <g key={sector}>
                    <line
                      x1={s.x - 2} y1={s.y - 2}
                      x2={s.x + 2} y2={s.y + 2}
                      stroke={colors[idx]}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <text
                      x={s.x + (s.labelOffset?.x || 4)}
                      y={s.y + (s.labelOffset?.y || 1)}
                      fontSize="2.5"
                      fill={colors[idx]}
                      fontWeight="bold"
                    >
                      {labels[idx]}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {/* Car positions (shown in both modes, but only accurate in data-driven mode) */}
          {carPositions.map(car => (
            <g key={car.driverNumber}>
              <circle
                cx={car.x}
                cy={car.y}
                r={2.5}
                fill={car.teamColor}
                opacity={0.3}
              />
              <circle
                cx={car.x}
                cy={car.y}
                r={1.5}
                fill={car.teamColor}
                stroke="#000"
                strokeWidth={0.3}
              />
              <text
                x={car.x}
                y={car.y - 3.5}
                textAnchor="middle"
                fontSize="2.5"
                fill="white"
                fontWeight="bold"
              >
                {car.acronym}
              </text>
            </g>
          ))}
        </svg>

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
            <div className="text-sm text-zinc-500">Loading positions...</div>
          </div>
        )}

        {/* No data message - only when not live and no track at all */}
        {!isLoading && carPositions.length === 0 && !hasLiveTrack && !isLive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-sm text-zinc-500 text-center">
              <p>No position data available</p>
              <p className="text-xs mt-1">Positions update during live sessions</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {carPositions.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-800/30">
          <div className="flex flex-wrap gap-2">
            {carPositions.slice(0, 6).map(car => (
              <div key={car.driverNumber} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: car.teamColor }}
                />
                <span className="text-xs text-zinc-400">{car.acronym}</span>
              </div>
            ))}
            {carPositions.length > 6 && (
              <span className="text-xs text-zinc-500">+{carPositions.length - 6} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
