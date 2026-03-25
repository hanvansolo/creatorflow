'use client';

import Image from 'next/image';
import { TRACK_SVGS, DEFAULT_TRACK_SVG } from '@/lib/constants/track-svgs';

interface TrackLayoutProps {
  circuitSlug?: string;
  layoutImageUrl?: string | null;
  className?: string;
}

// Parse SVG path to extract coordinate points
function parsePathToPoints(pathData: string): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const regex = /([ML])\s*([\d.]+)\s+([\d.]+)/g;
  let match;

  while ((match = regex.exec(pathData)) !== null) {
    points.push({ x: parseFloat(match[2]), y: parseFloat(match[3]) });
  }

  return points;
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');
}

// SVG fallback for circuits without an official image
function TrackIcon({ slug, className = '' }: { slug?: string; className?: string }) {
  const pathData = slug ? (TRACK_SVGS[slug] || DEFAULT_TRACK_SVG) : DEFAULT_TRACK_SVG;
  const points = parsePathToPoints(pathData);

  const totalPoints = points.length;
  const sector1End = Math.floor(totalPoints * 0.33);
  const sector2End = Math.floor(totalPoints * 0.66);

  const sector1Path = pointsToPath(points.slice(0, sector1End + 1));
  const sector2Path = pointsToPath(points.slice(sector1End, sector2End + 1));
  const sector3Path = pointsToPath([...points.slice(sector2End), points[0]]);

  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={pathData} stroke="#374151" strokeWidth="4" />
      <path d={sector1Path} stroke="#ef4444" strokeWidth="2.5" />
      <path d={sector2Path} stroke="#22d3ee" strokeWidth="2.5" />
      <path d={sector3Path} stroke="#eab308" strokeWidth="2.5" />
    </svg>
  );
}

export function TrackLayout({
  circuitSlug,
  layoutImageUrl,
  className = '',
}: TrackLayoutProps) {
  // Use official F1 circuit image if available
  if (layoutImageUrl) {
    return (
      <div className={`${className} relative overflow-hidden rounded-lg bg-zinc-900 border border-zinc-700`}>
        <Image
          src={layoutImageUrl}
          alt={`${circuitSlug || 'Circuit'} layout`}
          width={600}
          height={338}
          className="w-full h-auto object-contain"
        />
      </div>
    );
  }

  // Fallback to SVG
  return (
    <div className={`${className} flex items-center justify-center rounded-lg bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 p-3`}>
      <TrackIcon slug={circuitSlug} className="w-full h-full min-h-[120px] max-h-[160px]" />
    </div>
  );
}
