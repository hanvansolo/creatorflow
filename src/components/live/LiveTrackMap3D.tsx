// @ts-nocheck
'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Driver, Location } from '@/lib/api/openf1/types';
import { getTrackFeatures } from '@/lib/constants/track-features';

interface LiveTrackMap3DProps {
  circuitSlug?: string;
  drivers: Driver[];
  locations: Location[];
  isLive: boolean;
}

// Track point data for Monza (normalized 0-100, will be scaled)
const TRACK_POINTS: Record<string, Array<{ x: number; y: number; z: number }>> = {
  monza: [
    { x: 15.1, y: 62.2, z: 0 },
    { x: 17.3, y: 44.4, z: 0 },
    { x: 18.3, y: 36.9, z: 0 },
    { x: 19.4, y: 31.6, z: 0 },
    { x: 19.8, y: 23.1, z: 0 },
    { x: 22.8, y: 17.7, z: 0 },
    { x: 28, y: 14.2, z: 0 },
    { x: 37.8, y: 11.7, z: 0 },
    { x: 49.6, y: 11, z: 0 },
    { x: 62.8, y: 9.2, z: 0 },
    { x: 80.1, y: 5.2, z: 0 },
    { x: 85.9, y: 7.8, z: 0 },
    { x: 87.3, y: 17.4, z: 0 },
    { x: 78.9, y: 21.8, z: 0 },
    { x: 67.9, y: 26.1, z: 0 },
    { x: 57.1, y: 32.3, z: 0 },
    { x: 43.4, y: 40.8, z: 0 },
    { x: 36.8, y: 46.9, z: 0 },
    { x: 34.1, y: 51.3, z: 0 },
    { x: 32, y: 56.3, z: 0 },
    { x: 26.7, y: 91.2, z: 0 },
    { x: 22, y: 95, z: 0 },
    { x: 13.1, y: 87.9, z: 0 },
    { x: 12.9, y: 77.9, z: 0 },
    { x: 15.1, y: 62.2, z: 0 }, // Close the loop
  ],
};

// Default track (simple oval)
const DEFAULT_TRACK = [
  { x: 20, y: 50, z: 0 },
  { x: 30, y: 20, z: 0 },
  { x: 50, y: 10, z: 0 },
  { x: 70, y: 20, z: 0 },
  { x: 80, y: 50, z: 0 },
  { x: 70, y: 80, z: 0 },
  { x: 50, y: 90, z: 0 },
  { x: 30, y: 80, z: 0 },
  { x: 20, y: 50, z: 0 },
];

// Parse simple SVG path commands (M, L, Q) into points
function parseSvgPath(path: string): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const commands = path.match(/[MLQ][^MLQ]*/gi) || [];

  for (const cmd of commands) {
    const type = cmd[0].toUpperCase();
    const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

    if (type === 'M' || type === 'L') {
      for (let i = 0; i < coords.length; i += 2) {
        points.push({ x: coords[i], y: coords[i + 1] });
      }
    } else if (type === 'Q') {
      // Quadratic bezier - sample points along curve
      const cpX = coords[0], cpY = coords[1];
      const endX = coords[2], endY = coords[3];
      const lastPoint = points[points.length - 1] || { x: 0, y: 0 };

      for (let t = 0.25; t <= 1; t += 0.25) {
        const x = Math.pow(1-t, 2) * lastPoint.x + 2 * (1-t) * t * cpX + Math.pow(t, 2) * endX;
        const y = Math.pow(1-t, 2) * lastPoint.y + 2 * (1-t) * t * cpY + Math.pow(t, 2) * endY;
        points.push({ x, y });
      }
    }
  }

  return points;
}

function Track({ points }: { points: Array<{ x: number; y: number; z: number }> }) {
  const linePoints = useMemo(() => {
    return points.map(p => new THREE.Vector3(
      (p.x - 50) * 0.1, // Center and scale
      0.01,
      (p.y - 50) * 0.1
    ));
  }, [points]);

  return (
    <group>
      {/* Track surface */}
      <Line
        points={linePoints}
        color="#4b5563"
        lineWidth={8}
      />
      {/* Track outline */}
      <Line
        points={linePoints}
        color="#1f2937"
        lineWidth={12}
      />
    </group>
  );
}

function PitLane({ path }: { path: string }) {
  const linePoints = useMemo(() => {
    const svgPoints = parseSvgPath(path);
    return svgPoints.map(p => new THREE.Vector3(
      (p.x - 50) * 0.1,
      0.005, // Slightly below track
      (p.y - 50) * 0.1
    ));
  }, [path]);

  if (linePoints.length < 2) return null;

  return (
    <group>
      {/* Pit lane - subtle gray */}
      <Line
        points={linePoints}
        color="#525252"
        lineWidth={4}
      />
    </group>
  );
}

function StartFinishLine({ position }: { position: THREE.Vector3 }) {
  return (
    <group position={position}>
      {/* Checkered line */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.5, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* S/F Label */}
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.15}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        S/F
      </Text>
    </group>
  );
}

function SectorMarker({ position, label, color }: { position: THREE.Vector3; label: string; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.12}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

interface CarMarkerProps {
  position: THREE.Vector3;
  color: string;
  acronym: string;
  targetPosition?: THREE.Vector3;
}

function CarMarker({ position, color, acronym, targetPosition }: CarMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentPos = useRef(position.clone());

  useFrame((_, delta) => {
    if (meshRef.current && targetPosition) {
      // Smooth interpolation towards target
      currentPos.current.lerp(targetPosition, delta * 2);
      meshRef.current.position.copy(currentPos.current);
    }
  });

  return (
    <group position={position}>
      {/* Car dot with glow */}
      <mesh ref={meshRef} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow effect */}
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      {/* Driver label */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {acronym}
      </Text>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial color="#1a1a2e" />
    </mesh>
  );
}

function Scene({
  trackPoints,
  cars,
  sectorPositions,
  startFinishPosition,
  pitLanePath,
}: {
  trackPoints: Array<{ x: number; y: number; z: number }>;
  cars: Array<{ position: THREE.Vector3; color: string; acronym: string }>;
  sectorPositions: { s1: THREE.Vector3; s2: THREE.Vector3; s3: THREE.Vector3 };
  startFinishPosition: THREE.Vector3;
  pitLanePath?: string;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />

      {/* Ground */}
      <Ground />


      {/* Track */}
      <Track points={trackPoints} />

      {/* Start/Finish */}
      <StartFinishLine position={startFinishPosition} />

      {/* Sector markers */}
      <SectorMarker position={sectorPositions.s1} label="S1" color="#ef4444" />
      <SectorMarker position={sectorPositions.s2} label="S2" color="#eab308" />
      <SectorMarker position={sectorPositions.s3} label="S3" color="#22c55e" />

      {/* Cars */}
      {cars.map((car, i) => (
        <CarMarker
          key={i}
          position={car.position}
          color={car.color}
          acronym={car.acronym}
        />
      ))}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={15}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export function LiveTrackMap3D({ circuitSlug, drivers, locations, isLive }: LiveTrackMap3DProps) {
  const [isClient, setIsClient] = useState(false);

  // Handle SSR - only render canvas on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get track points
  const trackPoints = useMemo(() => {
    return TRACK_POINTS[circuitSlug || ''] || DEFAULT_TRACK;
  }, [circuitSlug]);

  // Create driver lookup
  const driverMap = useMemo(() => {
    return new Map(drivers.map(d => [d.driver_number, d]));
  }, [drivers]);

  // Convert locations to 3D car positions
  const cars = useMemo(() => {
    return locations
      .filter(loc => loc.x !== 0 || loc.y !== 0)
      .map(loc => {
        const driver = driverMap.get(loc.driver_number);
        return {
          position: new THREE.Vector3(
            (loc.x - 50) * 0.1,
            0.15,
            (loc.y - 50) * 0.1
          ),
          color: driver?.team_colour ? `#${driver.team_colour}` : '#666666',
          acronym: driver?.name_acronym || `${loc.driver_number}`,
        };
      });
  }, [locations, driverMap]);

  // Sector positions (based on track layout)
  const sectorPositions = useMemo(() => {
    const s1Idx = Math.floor(trackPoints.length * 0.33);
    const s2Idx = Math.floor(trackPoints.length * 0.66);
    const s3Idx = Math.floor(trackPoints.length * 0.9);

    return {
      s1: new THREE.Vector3(
        (trackPoints[s1Idx].x - 50) * 0.1,
        0,
        (trackPoints[s1Idx].y - 50) * 0.1
      ),
      s2: new THREE.Vector3(
        (trackPoints[s2Idx].x - 50) * 0.1,
        0,
        (trackPoints[s2Idx].y - 50) * 0.1
      ),
      s3: new THREE.Vector3(
        (trackPoints[s3Idx].x - 50) * 0.1,
        0,
        (trackPoints[s3Idx].y - 50) * 0.1
      ),
    };
  }, [trackPoints]);

  // Start/finish position
  const startFinishPosition = useMemo(() => {
    return new THREE.Vector3(
      (trackPoints[0].x - 50) * 0.1,
      0,
      (trackPoints[0].y - 50) * 0.1
    );
  }, [trackPoints]);

  // Get pit lane path from track features
  const pitLanePath = useMemo(() => {
    const features = getTrackFeatures(circuitSlug);
    return features.pitLane?.path;
  }, [circuitSlug]);

  if (!isClient) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
          <h3 className="text-sm font-semibold text-white">3D Track Map</h3>
        </div>
        <div className="aspect-square flex items-center justify-center bg-zinc-900">
          <span className="text-zinc-500">Loading 3D view...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">3D Track Map</h3>
        {isLive && (
          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            Live positions
          </span>
        )}
      </div>

      <div className="aspect-square bg-zinc-900">
        <Canvas
          camera={{ position: [0, 8, 8], fov: 50 }}
          style={{ background: '#0a0a0f' }}
        >
          <Scene
            trackPoints={trackPoints}
            cars={cars}
            sectorPositions={sectorPositions}
            startFinishPosition={startFinishPosition}
            pitLanePath={pitLanePath}
          />
        </Canvas>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-800/30">
        <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
          <span>Drag to rotate</span>
          <span>•</span>
          <span>Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
