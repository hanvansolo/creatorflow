interface RaceRecord {
  raceName: string;
  round: number;
  driver1Pos: number | null;
  driver2Pos: number | null;
  driver1Points: number;
  driver2Points: number;
}

interface HeadToHeadRecordProps {
  records: RaceRecord[];
  driver1: { code: string; name: string; color: string };
  driver2: { code: string; name: string; color: string };
}

export function HeadToHeadRecord({ records, driver1, driver2 }: HeadToHeadRecordProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
        <p className="text-sm text-zinc-500">No head-to-head race data available yet.</p>
      </div>
    );
  }

  const d1Wins = records.filter(
    (r) => r.driver1Pos !== null && r.driver2Pos !== null && r.driver1Pos < r.driver2Pos
  ).length;
  const d2Wins = records.filter(
    (r) => r.driver1Pos !== null && r.driver2Pos !== null && r.driver2Pos < r.driver1Pos
  ).length;

  return (
    <div>
      {/* Summary */}
      <div className="mb-4 flex items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: driver1.color }}>{d1Wins}</p>
          <p className="text-xs text-zinc-500">{driver1.code}</p>
        </div>
        <div className="text-sm font-medium text-zinc-500">vs</div>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color: driver2.color }}>{d2Wins}</p>
          <p className="text-xs text-zinc-500">{driver2.code}</p>
        </div>
      </div>

      {/* Race-by-race */}
      <div className="space-y-1">
        {records.map((r) => {
          const d1Won = r.driver1Pos !== null && r.driver2Pos !== null && r.driver1Pos < r.driver2Pos;
          const d2Won = r.driver1Pos !== null && r.driver2Pos !== null && r.driver2Pos < r.driver1Pos;

          return (
            <div
              key={r.round}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: d1Won
                  ? `${driver1.color}10`
                  : d2Won
                  ? `${driver2.color}10`
                  : '#18181b',
              }}
            >
              <span className="w-8 text-xs text-zinc-500">R{r.round}</span>
              <span
                className="w-10 text-center font-bold"
                style={{ color: d1Won ? driver1.color : '#a1a1aa' }}
              >
                {r.driver1Pos ? `P${r.driver1Pos}` : 'DNF'}
              </span>
              <div className="flex-1 text-center text-zinc-400">{r.raceName}</div>
              <span
                className="w-10 text-center font-bold"
                style={{ color: d2Won ? driver2.color : '#a1a1aa' }}
              >
                {r.driver2Pos ? `P${r.driver2Pos}` : 'DNF'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
