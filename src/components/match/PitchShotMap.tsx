'use client';

import type { TeamStats, MatchDetail } from './types';

interface PitchShotMapProps {
  match: MatchDetail;
  homeStats: TeamStats | null;
  awayStats: TeamStats | null;
}

function StatBadge({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <div className={`flex flex-col items-center px-2 py-1.5 rounded-md ${color}`}>
      <span className="text-lg sm:text-xl font-black leading-none">{value}</span>
      <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider mt-0.5 opacity-80">{label}</span>
    </div>
  );
}

export default function PitchShotMap({ match, homeStats, awayStats }: PitchShotMapProps) {
  if (!homeStats && !awayStats) return null;

  const homeGoals = match.home_score ?? 0;
  const awayGoals = match.away_score ?? 0;
  const homeShotsTotal = homeStats?.shots_total ?? 0;
  const awayShotsTotal = awayStats?.shots_total ?? 0;
  const homeShotsOn = homeStats?.shots_on_target ?? 0;
  const awayShotsOn = awayStats?.shots_on_target ?? 0;
  const homeShotsOff = (homeStats?.shots_off_target ?? 0) || Math.max(0, homeShotsTotal - homeShotsOn);
  const awayShotsOff = (awayStats?.shots_off_target ?? 0) || Math.max(0, awayShotsTotal - awayShotsOn);
  const homeSaves = awayStats?.saves ?? 0; // Away keeper saves = home shots saved
  const awaySaves = homeStats?.saves ?? 0; // Home keeper saves = away shots saved
  const homeXg = homeStats?.expected_goals;
  const awayXg = awayStats?.expected_goals;

  // Shot accuracy percentages for bar widths
  const homeAccuracy = homeShotsTotal > 0 ? Math.round((homeShotsOn / homeShotsTotal) * 100) : 0;
  const awayAccuracy = awayShotsTotal > 0 ? Math.round((awayShotsOn / awayShotsTotal) * 100) : 0;

  return (
    <div className="rounded-lg bg-zinc-800 overflow-hidden">
      <h3 className="px-4 pt-3 pb-2 text-sm font-bold uppercase tracking-wider text-yellow-400">
        Shot Analysis
      </h3>

      {/* Pitch graphic */}
      <div className="relative mx-3 mb-3 rounded-lg overflow-hidden" style={{ aspectRatio: '2.2/1' }}>
        {/* Pitch background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-800 to-emerald-900">
          {/* Pitch markings */}
          <svg viewBox="0 0 440 200" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            {/* Outer boundary */}
            <rect x="5" y="5" width="430" height="190" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            {/* Center line */}
            <line x1="220" y1="5" x2="220" y2="195" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            {/* Center circle */}
            <circle cx="220" cy="100" r="30" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <circle cx="220" cy="100" r="2" fill="rgba(255,255,255,0.3)" />
            {/* Left penalty area */}
            <rect x="5" y="45" width="55" height="110" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <rect x="5" y="70" width="20" height="60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            {/* Left goal */}
            <rect x="0" y="82" width="5" height="36" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            {/* Right penalty area */}
            <rect x="380" y="45" width="55" height="110" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <rect x="415" y="70" width="20" height="60" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            {/* Right goal */}
            <rect x="435" y="82" width="5" height="36" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            {/* Penalty spots */}
            <circle cx="42" cy="100" r="2" fill="rgba(255,255,255,0.3)" />
            <circle cx="398" cy="100" r="2" fill="rgba(255,255,255,0.3)" />
          </svg>

          {/* Home attack zone (left half, right side = attacking towards right goal) */}
          <div className="absolute left-[52%] top-[10%] right-[5%] bottom-[10%] bg-yellow-400/10 rounded-sm border border-yellow-400/20" />
          {/* Away attack zone */}
          <div className="absolute left-[5%] top-[10%] right-[52%] bottom-[10%] bg-blue-400/10 rounded-sm border border-blue-400/20" />

          {/* Home stats overlay — right side (attacking right) */}
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
            <StatBadge value={homeGoals} label="Goals" color="bg-yellow-500/90 text-black" />
            <StatBadge value={homeShotsOn} label="On Target" color="bg-yellow-400/20 text-yellow-300" />
          </div>

          {/* Away stats overlay — left side (attacking left) */}
          <div className="absolute left-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5">
            <StatBadge value={awayGoals} label="Goals" color="bg-blue-500/90 text-white" />
            <StatBadge value={awayShotsOn} label="On Target" color="bg-blue-400/20 text-blue-300" />
          </div>

          {/* Center stats */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 bg-black/60 rounded-full px-3 py-1">
              <span className="text-xs font-bold text-yellow-400">{homeShotsTotal}</span>
              <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Shots</span>
              <span className="text-xs font-bold text-blue-400">{awayShotsTotal}</span>
            </div>
            {homeXg != null && awayXg != null && (
              <div className="flex items-center gap-3 bg-black/60 rounded-full px-3 py-1">
                <span className="text-xs font-bold text-yellow-400">{Number(homeXg).toFixed(1)}</span>
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider">xG</span>
                <span className="text-xs font-bold text-blue-400">{Number(awayXg).toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Team names at edges */}
          <div className="absolute right-2 bottom-1 text-[9px] font-bold text-yellow-400/60 uppercase">
            {match.home_name}
          </div>
          <div className="absolute left-2 bottom-1 text-[9px] font-bold text-blue-400/60 uppercase">
            {match.away_name}
          </div>
        </div>
      </div>

      {/* Shot accuracy bars */}
      <div className="px-4 pb-3 space-y-2">
        {/* Home accuracy */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-16 text-right shrink-0">{match.home_name}</span>
          <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-700" style={{ width: `${homeAccuracy}%` }} />
          </div>
          <span className="text-[10px] font-bold text-yellow-400 w-8">{homeAccuracy}%</span>
        </div>
        <div className="text-center text-[9px] text-zinc-500 uppercase tracking-wider">Shot Accuracy</div>
        {/* Away accuracy */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-16 text-right shrink-0">{match.away_name}</span>
          <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full transition-all duration-700" style={{ width: `${awayAccuracy}%` }} />
          </div>
          <span className="text-[10px] font-bold text-blue-400 w-8">{awayAccuracy}%</span>
        </div>

        {/* Saves row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-700/50">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Saves</span>
            <span className="text-xs font-bold text-yellow-400">{awaySaves}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-500">Off Target</span>
            <span className="text-xs font-bold text-yellow-400">{homeShotsOff}</span>
            <span className="text-[10px] text-zinc-600 mx-1">|</span>
            <span className="text-xs font-bold text-blue-400">{awayShotsOff}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-400">{homeSaves}</span>
            <span className="text-[10px] text-zinc-500">Saves</span>
          </div>
        </div>
      </div>
    </div>
  );
}
