'use client';

import Image from 'next/image';
import type { TeamStats, MatchDetail, MatchEvent } from './types';

interface PitchShotMapProps {
  match: MatchDetail;
  events: MatchEvent[];
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
}

export default function PitchShotMap({ match, events, homeStats, awayStats }: PitchShotMapProps) {
  if (!homeStats && !awayStats) return null;

  const homeGoals = match.home_score ?? 0;
  const awayGoals = match.away_score ?? 0;
  const homeShotsTotal = homeStats?.shots_total ?? 0;
  const awayShotsTotal = awayStats?.shots_total ?? 0;
  const homeShotsOn = homeStats?.shots_on_target ?? 0;
  const awayShotsOn = awayStats?.shots_on_target ?? 0;
  const homeShotsOff = Math.max(0, homeShotsTotal - homeShotsOn);
  const awayShotsOff = Math.max(0, awayShotsTotal - awayShotsOn);
  const homeXg = homeStats?.expected_goals;
  const awayXg = awayStats?.expected_goals;
  const homeSaves = awayStats?.saves ?? 0;
  const awaySaves = homeStats?.saves ?? 0;

  // Extract goal events with player names
  const homeGoalEvents = events.filter(e =>
    ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type) &&
    (e.club_name === match.home_name || e.is_home === true)
  );
  const awayGoalEvents = events.filter(e =>
    ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type) &&
    (e.club_name === match.away_name || e.is_home === false)
  );

  const homeAccuracy = homeShotsTotal > 0 ? Math.round((homeShotsOn / homeShotsTotal) * 100) : 0;
  const awayAccuracy = awayShotsTotal > 0 ? Math.round((awayShotsOn / awayShotsTotal) * 100) : 0;

  return (
    <div className="rounded-xl bg-zinc-800 overflow-hidden">
      <h3 className="px-5 pt-4 pb-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
        Shot Analysis
      </h3>

      {/* Pitch */}
      <div className="relative mx-4 mb-2 rounded-xl overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Grass background with gradient halves */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 left-0 right-1/2 bg-gradient-to-br from-emerald-700 to-emerald-800" />
          <div className="absolute inset-0 left-1/2 right-0 bg-gradient-to-bl from-emerald-600 to-emerald-700" />
        </div>

        {/* Pitch lines SVG */}
        <svg viewBox="0 0 500 250" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Outer boundary */}
          <rect x="10" y="10" width="480" height="230" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" rx="2" />
          {/* Centre line */}
          <line x1="250" y1="10" x2="250" y2="240" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          {/* Centre circle */}
          <circle cx="250" cy="125" r="40" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <circle cx="250" cy="125" r="3" fill="rgba(255,255,255,0.3)" />
          {/* Left penalty area */}
          <rect x="10" y="55" width="70" height="140" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="10" y="85" width="25" height="80" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Left goal */}
          <rect x="2" y="100" width="8" height="50" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" rx="1" />
          {/* Right penalty area */}
          <rect x="420" y="55" width="70" height="140" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          <rect x="465" y="85" width="25" height="80" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
          {/* Right goal */}
          <rect x="490" y="100" width="8" height="50" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" rx="1" />
          {/* Penalty spots */}
          <circle cx="55" cy="125" r="2.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="445" cy="125" r="2.5" fill="rgba(255,255,255,0.3)" />
          {/* Penalty arcs */}
          <path d="M 80 95 A 40 40 0 0 1 80 155" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <path d="M 420 95 A 40 40 0 0 0 420 155" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        </svg>

        {/* Home attack zone overlay — attacking right */}
        <div className="absolute top-[8%] bottom-[8%] left-[52%] right-[4%] bg-yellow-400/8 rounded border border-yellow-400/15" />
        {/* Away attack zone overlay — attacking left */}
        <div className="absolute top-[8%] bottom-[8%] left-[4%] right-[52%] bg-blue-400/8 rounded border border-blue-400/15" />

        {/* Home stats — right side */}
        <div className="absolute right-[8%] top-[18%] flex flex-col items-center gap-2">
          <div className="bg-yellow-500 text-black rounded-lg px-3 py-1.5 text-center shadow-lg">
            <div className="text-xl font-black leading-none">{homeGoals}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Goals</div>
          </div>
          <div className="bg-yellow-400/25 text-yellow-300 rounded-lg px-3 py-1.5 text-center">
            <div className="text-lg font-bold leading-none">{homeShotsOn}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5">On Target</div>
          </div>
        </div>

        {/* Away stats — left side */}
        <div className="absolute left-[8%] top-[18%] flex flex-col items-center gap-2">
          <div className="bg-blue-500 text-white rounded-lg px-3 py-1.5 text-center shadow-lg">
            <div className="text-xl font-black leading-none">{awayGoals}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Goals</div>
          </div>
          <div className="bg-blue-400/25 text-blue-300 rounded-lg px-3 py-1.5 text-center">
            <div className="text-lg font-bold leading-none">{awayShotsOn}</div>
            <div className="text-[8px] font-bold uppercase tracking-wider mt-0.5">On Target</div>
          </div>
        </div>

        {/* Centre stats pill */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg">
            <span className="text-sm font-bold text-yellow-400 tabular-nums">{homeShotsTotal}</span>
            <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">Shots</span>
            <span className="text-sm font-bold text-blue-400 tabular-nums">{awayShotsTotal}</span>
          </div>
          {homeXg != null && awayXg != null && (
            <div className="flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg">
              <span className="text-sm font-bold text-yellow-400 tabular-nums">{Number(homeXg).toFixed(1)}</span>
              <span className="text-[10px] text-zinc-300 uppercase tracking-wider font-medium">xG</span>
              <span className="text-sm font-bold text-blue-400 tabular-nums">{Number(awayXg).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Goal scorer names — home (right half, bottom) */}
        {homeGoalEvents.length > 0 && (
          <div className="absolute right-[6%] bottom-[10%] flex flex-col items-end gap-0.5">
            {homeGoalEvents.slice(0, 3).map((g, i) => (
              <span key={i} className="text-[10px] font-semibold text-yellow-300 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                ⚽ {g.player_known_as || 'Goal'} {g.minute}'
                {g.event_type === 'penalty_scored' && ' (P)'}
                {g.event_type === 'own_goal' && ' (OG)'}
              </span>
            ))}
          </div>
        )}

        {/* Goal scorer names — away (left half, bottom) */}
        {awayGoalEvents.length > 0 && (
          <div className="absolute left-[6%] bottom-[10%] flex flex-col items-start gap-0.5">
            {awayGoalEvents.slice(0, 3).map((g, i) => (
              <span key={i} className="text-[10px] font-semibold text-blue-300 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                ⚽ {g.player_known_as || 'Goal'} {g.minute}'
                {g.event_type === 'penalty_scored' && ' (P)'}
                {g.event_type === 'own_goal' && ' (OG)'}
              </span>
            ))}
          </div>
        )}

        {/* Team names */}
        <div className="absolute right-3 bottom-1.5 text-[10px] font-bold text-yellow-400/50 uppercase tracking-wider">
          {match.home_name}
        </div>
        <div className="absolute left-3 bottom-1.5 text-[10px] font-bold text-blue-400/50 uppercase tracking-wider">
          {match.away_name}
        </div>
      </div>

      {/* Shot accuracy + details below pitch */}
      <div className="px-5 pb-4 pt-2">
        {/* Accuracy bars */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-zinc-400 w-14 text-right shrink-0 truncate">{match.home_name.split(' ').pop()}</span>
          <div className="flex-1 h-2.5 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${homeAccuracy}%` }} />
          </div>
          <span className="text-xs font-bold text-yellow-400 w-10">{homeAccuracy}%</span>
        </div>
        <div className="text-center text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Shot Accuracy</div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-zinc-400 w-14 text-right shrink-0 truncate">{match.away_name.split(' ').pop()}</span>
          <div className="flex-1 h-2.5 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${awayAccuracy}%` }} />
          </div>
          <span className="text-xs font-bold text-blue-400 w-10">{awayAccuracy}%</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-zinc-700/50 rounded-lg py-2 px-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-yellow-400">{homeShotsOff}</span>
              <span className="text-sm font-bold text-blue-400">{awayShotsOff}</span>
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Off Target</div>
          </div>
          <div className="bg-zinc-700/50 rounded-lg py-2 px-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-yellow-400">{awaySaves}</span>
              <span className="text-sm font-bold text-blue-400">{homeSaves}</span>
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Saves</div>
          </div>
          <div className="bg-zinc-700/50 rounded-lg py-2 px-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-yellow-400">{homeStats?.corners ?? 0}</span>
              <span className="text-sm font-bold text-blue-400">{awayStats?.corners ?? 0}</span>
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Corners</div>
          </div>
          <div className="bg-zinc-700/50 rounded-lg py-2 px-1">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-bold text-yellow-400">{homeStats?.fouls ?? 0}</span>
              <span className="text-sm font-bold text-blue-400">{awayStats?.fouls ?? 0}</span>
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mt-0.5">Fouls</div>
          </div>
        </div>
      </div>
    </div>
  );
}
