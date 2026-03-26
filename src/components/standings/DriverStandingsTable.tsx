// @ts-nocheck
import Link from 'next/link';
import { cn, formatPoints } from '@/lib/utils';
import { F1_TEAMS } from '@/lib/constants/teams';
import { DriverAvatar } from '@/components/drivers/DriverAvatar';
import { CountryFlag } from '@/components/ui/CountryFlag';
import type { DriverStanding } from '@/types';

interface DriverStandingsTableProps {
  standings: DriverStanding[];
  compact?: boolean;
  limit?: number;
}

export function DriverStandingsTable({
  standings,
  compact = false,
  limit,
}: DriverStandingsTableProps) {
  const displayStandings = limit ? standings.slice(0, limit) : standings;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full">
        <thead className="bg-zinc-900">
          <tr className="text-left text-xs text-zinc-400">
            <th className="pl-4 pr-2 py-3 font-medium">Pos</th>
            <th className="px-2 py-3 font-medium">Driver</th>
            {!compact && <th className="px-4 py-3 font-medium">Team</th>}
            <th className="px-4 py-3 text-right font-medium">Points</th>
            {!compact && <th className="px-4 py-3 text-right font-medium">Wins</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {displayStandings.map((standing) => {
            const teamSlug = standing.driver?.currentTeam?.slug as keyof typeof F1_TEAMS;
            const teamColor = teamSlug ? F1_TEAMS[teamSlug]?.primaryColor : '#666';

            return (
              <tr
                key={standing.id}
                className="transition-colors hover:bg-zinc-900/50"
              >
                <td className="pl-4 pr-2 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-8 w-1 rounded-full"
                      style={{ backgroundColor: teamColor }}
                    />
                    <span
                      className={cn(
                        'font-bold',
                        standing.position === 1 && 'text-yellow-400',
                        standing.position === 2 && 'text-zinc-300',
                        standing.position === 3 && 'text-orange-400'
                      )}
                    >
                      {standing.position}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-3">
                  {standing.driver ? (
                    <Link
                      href={`/drivers/${standing.driver.slug}`}
                      className="flex items-center gap-3 hover:text-emerald-400"
                    >
                      <DriverAvatar
                        headshotUrl={standing.driver.headshotUrl}
                        firstName={standing.driver.firstName}
                        lastName={standing.driver.lastName}
                        code={standing.driver.code}
                        size="sm"
                      />
                      <CountryFlag nationality={standing.driver.nationality} size="sm" />
                      <div>
                        <div className="font-medium text-white">
                          {standing.driver.firstName} {standing.driver.lastName}
                        </div>
                        {compact && standing.driver.currentTeam && (
                          <div className="text-xs text-zinc-500">
                            {standing.driver.currentTeam.name}
                          </div>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <span className="text-zinc-400">Unknown Driver</span>
                  )}
                </td>
                {!compact && (
                  <td className="px-4 py-3">
                    {standing.driver?.currentTeam ? (
                      <Link
                        href={`/teams/${standing.driver.currentTeam.slug}`}
                        className="text-sm text-zinc-400 hover:text-white"
                      >
                        {standing.driver.currentTeam.name}
                      </Link>
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-white">
                    {formatPoints(standing.points)}
                  </span>
                </td>
                {!compact && (
                  <td className="px-4 py-3 text-right">
                    <span className="text-zinc-400">{standing.wins}</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
