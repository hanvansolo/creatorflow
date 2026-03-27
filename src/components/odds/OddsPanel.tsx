'use client';

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { formatOdds, type OddsFormat } from '@/lib/utils/odds-format';
import { getBookmakerLogo } from '@/lib/constants/bookmakers';
import { OddsFormatToggle } from './OddsFormatToggle';

const STORAGE_KEY = 'footyfeed_odds_format';

interface OddsPanelProps {
  oddsData: {
    type: string;
    update?: string;
    bookmakers: Array<{
      id: number;
      name: string;
      bets?: Array<{
        id: number;
        name: string;
        values: Array<{ value: string; odd: string }>;
      }>;
    }>;
  };
}

export function OddsPanel({ oddsData }: OddsPanelProps) {
  const [format, setFormat] = useState<OddsFormat>('fractional');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as OddsFormat | null;
      if (saved && ['decimal', 'fractional', 'american'].includes(saved)) {
        setFormat(saved);
      }
    } catch {}
  }, []);

  const handleFormatChange = (newFormat: OddsFormat) => {
    setFormat(newFormat);
    try {
      localStorage.setItem(STORAGE_KEY, newFormat);
    } catch {}
  };

  const primaryBookmaker = oddsData.bookmakers[0];
  const matchWinnerBet = primaryBookmaker.bets?.find((b) => b.name === 'Match Winner');
  const goalsOUBet = primaryBookmaker.bets?.find((b) =>
    b.name?.includes('Over/Under') || b.name?.includes('Goals Over/Under')
  );
  const btsBet = primaryBookmaker.bets?.find((b) => b.name === 'Both Teams Score');

  if (!matchWinnerBet) return null;

  const homeOdd = matchWinnerBet.values?.find((v) => v.value === 'Home')?.odd;
  const drawOdd = matchWinnerBet.values?.find((v) => v.value === 'Draw')?.odd;
  const awayOdd = matchWinnerBet.values?.find((v) => v.value === 'Away')?.odd;

  const odds = [
    { label: 'Home Win', value: homeOdd },
    { label: 'Draw', value: drawOdd },
    { label: 'Away Win', value: awayOdd },
  ].filter((o): o is { label: string; value: string } => !!o.value);

  const minOdd = Math.min(...odds.map((o) => parseFloat(o.value)));
  const hasMultipleBookmakers = oddsData.bookmakers.length > 1;
  const updateTime = oddsData.update
    ? new Date(oddsData.update).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          Betting Odds
          {oddsData.type === 'live' && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500">{primaryBookmaker.name}</p>
            {updateTime && (
              <p className="text-[10px] text-zinc-600">Last updated: {updateTime}</p>
            )}
          </div>
          <OddsFormatToggle format={format} onFormatChange={handleFormatChange} />
        </div>
      </div>

      {/* Main odds cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {odds.map((odd) => {
          const isFavourite = parseFloat(odd.value) === minOdd;
          return (
            <div
              key={odd.label}
              className={`rounded-lg border p-4 text-center transition-all ${
                isFavourite
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-zinc-700/50 bg-zinc-800/80'
              }`}
            >
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">{odd.label}</p>
              <p className={`text-2xl font-black tabular-nums ${
                isFavourite ? 'text-emerald-400' : 'text-zinc-200'
              }`}>
                {formatOdds(odd.value, format)}
              </p>
              {isFavourite && (
                <p className="text-[9px] text-emerald-500 mt-1 font-semibold">FAVOURITE</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Goals Over/Under + Both Teams Score */}
      {(goalsOUBet || btsBet) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {goalsOUBet && goalsOUBet.values?.length > 0 && (
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/80 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">Goals Over/Under 2.5</p>
              <div className="flex items-center justify-around">
                {goalsOUBet.values.filter((v) => v.value === 'Over 2.5' || v.value === 'Under 2.5').map((v) => (
                  <div key={v.value} className="text-center">
                    <p className="text-[9px] text-zinc-500">{v.value}</p>
                    <p className="text-lg font-bold text-zinc-200 tabular-nums">{formatOdds(v.odd, format)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {btsBet && btsBet.values?.length > 0 && (
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-800/80 p-3">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-2">Both Teams Score</p>
              <div className="flex items-center justify-around">
                {btsBet.values.map((v) => (
                  <div key={v.value} className="text-center">
                    <p className="text-[9px] text-zinc-500">{v.value}</p>
                    <p className="text-lg font-bold text-zinc-200 tabular-nums">{formatOdds(v.odd, format)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compare odds from multiple bookmakers */}
      {hasMultipleBookmakers && (
        <details className="group mb-4">
          <summary className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
            Compare odds from {oddsData.bookmakers.length} bookmakers
          </summary>
          <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 bg-zinc-800/80">
                  <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Bookmaker</th>
                  <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Home</th>
                  <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Draw</th>
                  <th className="px-3 py-2 text-center text-[10px] uppercase tracking-wide text-zinc-500 font-medium">Away</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {oddsData.bookmakers.map((bk) => {
                  const mw = bk.bets?.find((b) => b.name === 'Match Winner');
                  if (!mw) return null;
                  const h = mw.values?.find((v) => v.value === 'Home')?.odd;
                  const d = mw.values?.find((v) => v.value === 'Draw')?.odd;
                  const a = mw.values?.find((v) => v.value === 'Away')?.odd;
                  const logo = getBookmakerLogo(bk.name);
                  return (
                    <tr key={bk.id} className="bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors">
                      <td className="px-3 py-2 text-xs text-zinc-300">
                        <span className="inline-flex items-center gap-2">
                          {logo && (
                            <Image
                              src={logo}
                              alt={bk.name}
                              width={16}
                              height={16}
                              className="rounded-sm"
                              unoptimized
                            />
                          )}
                          {bk.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-200 tabular-nums">{h ? formatOdds(h, format) : '-'}</td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-200 tabular-nums">{d ? formatOdds(d, format) : '-'}</td>
                      <td className="px-3 py-2 text-center text-xs font-semibold text-zinc-200 tabular-nums">{a ? formatOdds(a, format) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-zinc-600 text-center">
        Odds are for informational purposes only. Please gamble responsibly. 18+
      </p>
    </section>
  );
}
