// @ts-nocheck
'use client';

interface FormGuideProps {
  teamName: string;
  form: string; // "WWDLW"
  goalsFor?: string | null; // average goals scored
  goalsAgainst?: string | null; // average goals conceded
  className?: string;
}

export default function FormGuide({
  teamName,
  form,
  goalsFor,
  goalsAgainst,
  className = '',
}: FormGuideProps) {
  const results = (form || '').split('').filter((r) => 'WDL'.includes(r.toUpperCase()));
  if (results.length === 0) return null;

  const wins = results.filter((r) => r.toUpperCase() === 'W').length;
  const draws = results.filter((r) => r.toUpperCase() === 'D').length;
  const losses = results.filter((r) => r.toUpperCase() === 'L').length;
  const winRate = Math.round((wins / results.length) * 100);

  return (
    <div className={`rounded-lg bg-zinc-900/60 p-3 ${className}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {teamName}
      </p>

      {/* Form badges */}
      <div className="flex gap-1.5 mb-2">
        {results.map((r, i) => {
          const upper = r.toUpperCase();
          let classes = 'h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold ';
          if (upper === 'W') classes += 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30';
          else if (upper === 'D') classes += 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30';
          else classes += 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30';
          return (
            <span key={i} className={classes}>
              {upper}
            </span>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[11px]">
        <span className="text-zinc-400">
          <span className="font-bold text-emerald-400">{wins}W</span>{' '}
          <span className="font-bold text-amber-400">{draws}D</span>{' '}
          <span className="font-bold text-red-400">{losses}L</span>
        </span>
        <span className="text-zinc-600">|</span>
        <span className="text-zinc-400">
          Win rate:{' '}
          <span className={`font-bold ${winRate >= 60 ? 'text-emerald-400' : winRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
            {winRate}%
          </span>
        </span>
        {goalsFor && goalsAgainst && (
          <>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">
              Avg: <span className="font-bold text-zinc-200">{goalsFor}</span> scored,{' '}
              <span className="font-bold text-zinc-200">{goalsAgainst}</span> conceded
            </span>
          </>
        )}
      </div>
    </div>
  );
}
