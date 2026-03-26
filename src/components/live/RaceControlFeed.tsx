// @ts-nocheck
'use client';

import { Flag, AlertTriangle, Car, Radio, Info } from 'lucide-react';
import type { RaceControlMessage, Driver } from '@/lib/api/openf1/types';
import { getFlagStyle, detectSafetyCarFromMessage } from '@/lib/constants/flags';
import { formatDistanceToNow } from 'date-fns';

interface RaceControlFeedProps {
  messages: RaceControlMessage[];
  drivers: Driver[];
}

function getMessageIcon(message: RaceControlMessage) {
  if (message.flag) {
    return <Flag className="h-4 w-4" />;
  }

  switch (message.category) {
    case 'SafetyCar':
      return <Car className="h-4 w-4" />;
    case 'Drs':
      return <Radio className="h-4 w-4" />;
    case 'CarEvent':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function getMessageColor(message: RaceControlMessage): string {
  if (message.flag) {
    const flagStyle = getFlagStyle(message.flag);
    return flagStyle?.text || 'text-zinc-400';
  }

  const scStatus = detectSafetyCarFromMessage(message.message);
  if (scStatus.type === 'SC') return 'text-yellow-500';
  if (scStatus.type === 'VSC') return 'text-yellow-500';

  switch (message.category) {
    case 'Flag':
      return 'text-yellow-500';
    case 'SafetyCar':
      return 'text-yellow-500';
    case 'CarEvent':
      return 'text-orange-500';
    default:
      return 'text-zinc-400';
  }
}

export function RaceControlFeed({ messages, drivers }: RaceControlFeedProps) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  if (messages.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Race Control</h3>
        <p className="text-sm text-zinc-500">No messages yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
        <h3 className="text-sm font-semibold text-white">Race Control</h3>
      </div>
      <div className="max-h-80 overflow-y-auto">
        <div className="divide-y divide-zinc-800/50">
          {messages.map((message, index) => {
            const driver = message.driver_number
              ? driverMap.get(message.driver_number)
              : null;
            const color = getMessageColor(message);

            return (
              <div key={index} className="px-4 py-3 hover:bg-zinc-800/30">
                <div className="flex items-start gap-3">
                  <div className={color}>{getMessageIcon(message)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{message.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      {message.lap_number && <span>Lap {message.lap_number}</span>}
                      {driver && (
                        <>
                          <span>•</span>
                          <span>{driver.name_acronym}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(message.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
