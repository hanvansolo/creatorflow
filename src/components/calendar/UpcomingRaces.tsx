// @ts-nocheck
import { RaceWeekendCard } from './RaceWeekendCard';
import { CountdownTimer } from './CountdownTimer';
import type { Race } from '@/types';

interface UpcomingRacesProps {
  races: Race[];
  showCountdown?: boolean;
}

export function UpcomingRaces({ races, showCountdown = true }: UpcomingRacesProps) {
  if (races.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        <p>No upcoming races scheduled</p>
      </div>
    );
  }

  const nextRace = races[0];
  const otherRaces = races.slice(1, 4);

  return (
    <div className="space-y-6">
      {/* Next Race with Countdown */}
      {showCountdown && nextRace && (
        <div className="rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">
              Next Race
            </span>
            <h3 className="mt-2 text-2xl font-bold text-white">{nextRace.name}</h3>
            {nextRace.circuit && (
              <p className="mt-1 text-sm text-zinc-400">
                {nextRace.circuit.name}, {nextRace.circuit.country}
              </p>
            )}
            <div className="mt-4">
              <CountdownTimer targetDate={nextRace.raceDatetime} size="md" />
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Races List */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
          Upcoming Races
        </h4>
        <div className="space-y-2">
          {otherRaces.map((race) => (
            <RaceWeekendCard key={race.id} race={race} compact />
          ))}
        </div>
      </div>
    </div>
  );
}
