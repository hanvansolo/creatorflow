'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Map of common regions to their typical timezone
const REGION_TIMEZONES: Record<string, string> = {
  UK: 'Europe/London',
  US: 'America/New_York',
  DE: 'Europe/Berlin',
  NL: 'Europe/Amsterdam',
  FR: 'Europe/Paris',
  IT: 'Europe/Rome',
  ES: 'Europe/Madrid',
  AU: 'Australia/Sydney',
  JP: 'Asia/Tokyo',
  BR: 'America/Sao_Paulo',
  MX: 'America/Mexico_City',
  CA: 'America/Toronto',
  AE: 'Asia/Dubai',
  SG: 'Asia/Singapore',
  IN: 'Asia/Kolkata',
};

// Reverse lookup: timezone to region
function guessRegionFromTimezone(tz: string): string {
  // Common mappings
  if (tz.includes('London') || tz.includes('Dublin')) return 'UK';
  if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago') || tz.includes('Denver')) return 'US';
  if (tz.includes('Berlin') || tz.includes('Munich')) return 'DE';
  if (tz.includes('Amsterdam')) return 'NL';
  if (tz.includes('Paris')) return 'FR';
  if (tz.includes('Rome')) return 'IT';
  if (tz.includes('Madrid')) return 'ES';
  if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'AU';
  if (tz.includes('Tokyo')) return 'JP';
  if (tz.includes('Sao_Paulo')) return 'BR';
  if (tz.includes('Mexico')) return 'MX';
  if (tz.includes('Toronto') || tz.includes('Vancouver')) return 'CA';
  if (tz.includes('Dubai')) return 'AE';
  if (tz.includes('Singapore')) return 'SG';
  if (tz.includes('Kolkata') || tz.includes('Mumbai')) return 'IN';
  return 'UK'; // Default
}

interface LocationContextValue {
  region: string;
  timezone: string;
  setRegion: (region: string) => void;
  availableRegions: { code: string; name: string }[];
}

const LocationContext = createContext<LocationContextValue | null>(null);

const AVAILABLE_REGIONS = [
  { code: 'UK', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CA', name: 'Canada' },
  { code: 'AE', name: 'UAE' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
];

export function LocationProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState('UK');
  const [timezone, setTimezone] = useState('Europe/London');

  useEffect(() => {
    // Try to load saved preference
    const saved = localStorage.getItem('footyfeed_region');
    if (saved && REGION_TIMEZONES[saved]) {
      setRegionState(saved);
      setTimezone(REGION_TIMEZONES[saved]);
      return;
    }

    // Auto-detect from browser timezone
    try {
      const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const guessedRegion = guessRegionFromTimezone(browserTz);
      setRegionState(guessedRegion);
      setTimezone(browserTz); // Use actual browser timezone for accuracy
    } catch {
      // Fallback
      setRegionState('UK');
      setTimezone('Europe/London');
    }
  }, []);

  const setRegion = (newRegion: string) => {
    setRegionState(newRegion);
    setTimezone(REGION_TIMEZONES[newRegion] || 'Europe/London');
    localStorage.setItem('footyfeed_region', newRegion);
  };

  return (
    <LocationContext.Provider value={{ region, timezone, setRegion, availableRegions: AVAILABLE_REGIONS }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
