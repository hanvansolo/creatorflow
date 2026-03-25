'use client';

import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface TrackLayoutViewerProps {
  thumbnailUrl: string;
  circuitName: string;
}

export function TrackLayoutViewer({ thumbnailUrl, circuitName }: TrackLayoutViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Convert thumbnail URL to detail URL
  // /tracks/silverstone.svg -> /tracks/silverstone-detail.svg
  const detailUrl = thumbnailUrl.replace('.svg', '-detail.svg');

  return (
    <>
      {/* Track Layout Card */}
      <div
        className="relative bg-zinc-800 rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => setIsFullscreen(true)}
      >
        <img
          src={detailUrl}
          alt={`${circuitName} track layout`}
          className="w-full h-auto object-contain"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 rounded-full p-3">
            <ZoomIn className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-zinc-400 bg-zinc-900/80 px-2 py-1 rounded">
            Click to enlarge
          </span>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <img
            src={detailUrl}
            alt={`${circuitName} track layout`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
