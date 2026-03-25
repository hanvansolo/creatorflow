'use client';

import { useLocation } from '@/context/LocationContext';
import { Globe } from 'lucide-react';

export function RegionSelector() {
  const { region, setRegion, availableRegions } = useLocation();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-zinc-400" />
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {availableRegions.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
    </div>
  );
}
