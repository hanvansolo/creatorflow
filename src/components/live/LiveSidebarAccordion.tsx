'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

interface MatchItem {
  id: string;
  slug: string | null;
  href: string;
  status: string;
  home: { name: string; code: string | null; logo: string | null };
  away: { name: string; code: string | null; logo: string | null };
  home_score: number | null;
  away_score: number | null;
  competition: string | null;
  competition_logo: string | null;
  country: string | null;
}

interface Section {
  region: string;
  count: number;
  matches: MatchItem[];
}

export function LiveSidebarAccordion({ sections }: { sections: Section[] }) {
  // Open the first (largest) region by default; remember toggles
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    sections.forEach((s, i) => { init[s.region] = i === 0; });
    return init;
  });

  return (
    <div className="space-y-2">
      {sections.map(section => {
        const isOpen = open[section.region] ?? false;
        return (
          <div
            key={section.region}
            className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40"
          >
            <button
              type="button"
              onClick={() => setOpen(prev => ({ ...prev, [section.region]: !prev[section.region] }))}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-200">
                  {section.region}
                </span>
                <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                  {section.count}
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <ul className="divide-y divide-zinc-800/70 border-t border-zinc-800">
                {section.matches.map(m => (
                  <li key={m.id}>
                    <Link
                      href={m.href}
                      className="block px-3 py-2.5 hover:bg-zinc-800/50 transition-colors group"
                    >
                      {/* Competition line */}
                      {m.competition && (
                        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-500">
                          {m.competition_logo && (
                            <Image
                              src={m.competition_logo}
                              alt=""
                              width={12}
                              height={12}
                              className="h-3 w-3 object-contain"
                            />
                          )}
                          <span className="truncate">{m.competition}</span>
                        </div>
                      )}

                      {/* Teams + score grid */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {m.home.logo && (
                              <Image
                                src={m.home.logo}
                                alt=""
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain flex-shrink-0"
                              />
                            )}
                            <span className="truncate text-xs text-zinc-200 group-hover:text-white">
                              {m.home.code || m.home.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {m.away.logo && (
                              <Image
                                src={m.away.logo}
                                alt=""
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain flex-shrink-0"
                              />
                            )}
                            <span className="truncate text-xs text-zinc-200 group-hover:text-white">
                              {m.away.code || m.away.name}
                            </span>
                          </div>
                        </div>

                        {/* Score column */}
                        <div className="flex-shrink-0 text-right space-y-1">
                          <div className="text-xs font-semibold tabular-nums text-white">
                            {m.home_score ?? 0}
                          </div>
                          <div className="text-xs font-semibold tabular-nums text-white">
                            {m.away_score ?? 0}
                          </div>
                        </div>

                        {/* Status pill */}
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                            <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
                            {m.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
