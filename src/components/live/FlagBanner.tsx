'use client';

import { Flag, AlertTriangle, Car } from 'lucide-react';
import type { RaceControlMessage } from '@/lib/api/openf1/types';
import { FLAG_STYLES, detectSafetyCarFromMessage } from '@/lib/constants/flags';

interface FlagBannerProps {
  messages: RaceControlMessage[];
}

export function FlagBanner({ messages }: FlagBannerProps) {
  // Find the most recent active flag or safety car
  const activeFlag = messages.find(m => {
    if (m.flag === 'CLEAR' || m.flag === 'GREEN') return false;
    if (m.flag === 'YELLOW' || m.flag === 'DOUBLE YELLOW' || m.flag === 'RED') return true;
    if (m.category === 'SafetyCar') return true;
    return false;
  });

  if (!activeFlag) return null;

  // Check for safety car
  const scStatus = detectSafetyCarFromMessage(activeFlag.message);

  if (scStatus.type) {
    return (
      <div className="bg-yellow-500 text-black py-2 px-4">
        <div className="flex items-center justify-center gap-3">
          <Car className="h-5 w-5 animate-pulse" />
          <span className="font-bold uppercase">
            {scStatus.type === 'VSC' ? 'Virtual Safety Car' : 'Safety Car'}
          </span>
          <span className="text-sm">{scStatus.description}</span>
        </div>
      </div>
    );
  }

  // Check for flag
  if (activeFlag.flag) {
    const flagStyle = FLAG_STYLES[activeFlag.flag];
    if (!flagStyle) return null;

    const bgColor =
      activeFlag.flag === 'RED'
        ? 'bg-emerald-600'
        : activeFlag.flag === 'YELLOW' || activeFlag.flag === 'DOUBLE YELLOW'
          ? 'bg-yellow-500'
          : 'bg-zinc-800';

    const textColor =
      activeFlag.flag === 'YELLOW' || activeFlag.flag === 'DOUBLE YELLOW'
        ? 'text-black'
        : 'text-white';

    return (
      <div className={`${bgColor} ${textColor} py-2 px-4`}>
        <div className="flex items-center justify-center gap-3">
          {activeFlag.flag === 'RED' ? (
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          ) : (
            <Flag className="h-5 w-5 animate-pulse" />
          )}
          <span className="font-bold uppercase">{flagStyle.name}</span>
          {activeFlag.sector && <span className="text-sm">Sector {activeFlag.sector}</span>}
        </div>
      </div>
    );
  }

  return null;
}
