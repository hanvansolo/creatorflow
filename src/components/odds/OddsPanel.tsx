'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { formatOdds, type OddsFormat } from '@/lib/utils/odds-format';
import { getBookmakerLogo } from '@/lib/constants/bookmakers';

const STORAGE_KEY = 'footyfeed_odds_format';

type MarketKey = 'Match Winner' | 'Over/Under' | 'Both Teams Score' | 'Double Chance';

const MARKET_TABS: { key: MarketKey; label: string }[] = [
  { key: 'Match Winner', label: 'Match Winner' },
  { key: 'Over/Under', label: 'Over/Under' },
  { key: 'Both Teams Score', label: 'Both Teams Score' },
  { key: 'Double Chance', label: 'Double Chance' },
];

const FORMAT_OPTIONS: { value: OddsFormat; label: string }[] = [
  { value: 'fractional', label: 'FRAC' },
  { value: 'decimal', label: 'DEC' },
  { value: 'american', label: 'US' },
];

interface OddsPanelProps {
  oddsData: {
    bookmakers: Array<{
      id: number;
      name: string;
      bets: Array<{
        id: number;
        name: string;
        values: Array<{ value: string; odd: string }>;
      }>;
    }>;
    update: string;
    isLive: boolean;
    homeName: string;
    awayName: string;
  } | null;
}

function getOutcomeLabels(
  market: MarketKey,
  homeName: string,
  awayName: string
): string[] {
  switch (market) {
    case 'Match Winner':
      return [homeName, 'Draw', awayName];
    case 'Over/Under':
      return [
        'Over 0.5', 'Under 0.5',
        'Over 1.5', 'Under 1.5',
        'Over 2.5', 'Under 2.5',
        'Over 3.5', 'Under 3.5',
      ];
    case 'Both Teams Score':
      return ['Yes', 'No'];
    case 'Double Chance':
      return ['Home/Draw', 'Home/Away', 'Draw/Away'];
    default:
      return [];
  }
}

function getOutcomeValueKey(market: MarketKey, label: string, homeName: string, awayName: string): string {
  if (market === 'Match Winner') {
    if (label === homeName) return 'Home';
    if (label === awayName) return 'Away';
    return 'Draw';
  }
  if (market === 'Double Chance') {
    if (label === 'Home/Draw') return 'Home/Draw';
    if (label === 'Home/Away') return 'Home/Away';
    return 'Draw/Away';
  }
  return label;
}

function findBetForMarket(
  bets: Array<{ id: number; name: string; values: Array<{ value: string; odd: string }> }>,
  market: MarketKey
) {
  if (market === 'Over/Under') {
    return bets.find(
      (b) => b.name.includes('Over/Under') || b.name.includes('Goals Over/Under')
    );
  }
  return bets.find((b) => b.name === market);
}

export function OddsPanel({ oddsData }: OddsPanelProps) {
  const [format, setFormat] = useState<OddsFormat>('fractional');
  const [activeMarket, setActiveMarket] = useState<MarketKey>('Match Winner');

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

  if (!oddsData || !oddsData.bookmakers?.length) return null;

  const { homeName, awayName, bookmakers, isLive, update } = oddsData;

  const outcomeLabels = getOutcomeLabels(activeMarket, homeName, awayName);

  // Build the grid data: for each outcome, for each bookmaker, find the odds
  const gridData = useMemo(() => {
    const data: Record<string, Record<number, string>> = {};
    const bestOdds: Record<string, { odd: number; bookmaker: string; formatted: string }> = {};

    for (const label of outcomeLabels) {
      data[label] = {};
      const valueKey = getOutcomeValueKey(activeMarket, label, homeName, awayName);

      for (const bk of bookmakers) {
        const bet = findBetForMarket(bk.bets || [], activeMarket);
        if (!bet) continue;
        const val = bet.values.find((v) => v.value === valueKey);
        if (val) {
          data[label][bk.id] = val.odd;
          const numOdd = parseFloat(val.odd);
          if (!bestOdds[label] || numOdd > bestOdds[label].odd) {
            bestOdds[label] = { odd: numOdd, bookmaker: bk.name, formatted: val.odd };
          }
        }
      }
    }

    return { data, bestOdds };
  }, [bookmakers, activeMarket, outcomeLabels, homeName, awayName]);

  // Filter to only markets that have data from at least one bookmaker
  const availableMarkets = MARKET_TABS.filter((tab) => {
    return bookmakers.some((bk) => findBetForMarket(bk.bets || [], tab.key));
  });

  const updateTime = update
    ? new Date(update).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-bold text-white tracking-tight">Odds Comparison</h2>
          {isLive && (
            <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/30">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          )}
          {updateTime && (
            <span className="text-[10px] text-zinc-500 ml-2">Updated {updateTime}</span>
          )}
        </div>

        {/* Format Toggle */}
        <div className="inline-flex rounded-lg border border-zinc-700/50 overflow-hidden">
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleFormatChange(opt.value)}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                format === opt.value
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/50'
              } ${opt.value !== 'fractional' ? 'border-l border-zinc-700/50' : ''}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Market Tabs */}
      <div className="flex gap-0 border-b border-zinc-800 overflow-x-auto scrollbar-hide">
        {availableMarkets.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveMarket(tab.key)}
            className={`shrink-0 px-4 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
              activeMarket === tab.key
                ? 'bg-emerald-500/15 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Best Odds Summary Bar */}
      {Object.keys(gridData.bestOdds).length > 0 && (
        <div className="px-5 py-2.5 bg-zinc-800/40 border-b border-zinc-800 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider shrink-0">Best Odds:</span>
          <div className="flex items-center gap-0 text-xs">
            {outcomeLabels
              .filter((label) => gridData.bestOdds[label])
              .map((label, i, arr) => (
                <span key={label} className="shrink-0 flex items-center">
                  <span className="text-emerald-400 font-bold">{label}</span>
                  <span className="text-white font-semibold mx-1">
                    {formatOdds(gridData.bestOdds[label].formatted, format)}
                  </span>
                  <span className="text-zinc-500">@ {gridData.bestOdds[label].bookmaker}</span>
                  {i < arr.length - 1 && (
                    <span className="text-zinc-600 mx-2.5">|</span>
                  )}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="relative overflow-x-auto scrollbar-hide">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-zinc-800/60">
              {/* Sticky outcome column header */}
              <th className="sticky left-0 z-10 bg-zinc-800/95 backdrop-blur-sm min-w-[120px] px-4 py-3 text-left text-[10px] uppercase tracking-wider text-zinc-500 font-semibold border-r border-zinc-700/40">
                Outcome
              </th>
              {bookmakers.map((bk) => {
                const logo = getBookmakerLogo(bk.name);
                return (
                  <th
                    key={bk.id}
                    className="min-w-[90px] w-[90px] px-2 py-3 text-center border-r border-zinc-800/40 last:border-r-0"
                  >
                    <div className="flex items-center justify-center" title={bk.name}>
                      {logo ? (
                        <img
                          src={logo}
                          alt={bk.name}
                          className="h-8 w-auto max-w-[75px] object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[75px]">
                          {bk.name}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {outcomeLabels.map((label) => {
              const rowData = gridData.data[label] || {};
              const best = gridData.bestOdds[label];
              const bestOddValue = best?.odd;

              return (
                <tr key={label} className="hover:bg-zinc-800/30 transition-colors">
                  {/* Sticky outcome label */}
                  <td className="sticky left-0 z-10 bg-zinc-900/95 backdrop-blur-sm px-4 py-2.5 text-xs font-medium text-zinc-300 border-r border-zinc-700/40 whitespace-nowrap">
                    {label}
                  </td>
                  {bookmakers.map((bk) => {
                    const odd = rowData[bk.id];
                    if (!odd) {
                      return (
                        <td
                          key={bk.id}
                          className="px-2 py-2.5 text-center text-xs text-zinc-600 border-r border-zinc-800/40 last:border-r-0"
                        >
                          -
                        </td>
                      );
                    }
                    const numOdd = parseFloat(odd);
                    const isBest = bestOddValue !== undefined && Math.abs(numOdd - bestOddValue) < 0.001;

                    return (
                      <td
                        key={bk.id}
                        className={`px-2 py-2.5 text-center text-xs tabular-nums border-r border-zinc-800/40 last:border-r-0 transition-colors ${
                          isBest
                            ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                            : 'text-zinc-200 font-medium'
                        }`}
                      >
                        {formatOdds(odd, format)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* No data for market */}
      {outcomeLabels.every((label) => Object.keys(gridData.data[label] || {}).length === 0) && (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-zinc-500">No odds available for this market</p>
        </div>
      )}

      {/* Responsible Gambling */}
      <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/80">
        <p className="text-[10px] text-zinc-600 text-center">
          Odds are for informational purposes only. 18+ | Please gamble responsibly |{' '}
          <a
            href="https://www.begambleaware.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-400 transition-colors"
          >
            BeGambleAware.org
          </a>
        </p>
      </div>
    </section>
  );
}
