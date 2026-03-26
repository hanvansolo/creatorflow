'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, Shield } from 'lucide-react';

interface Club {
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
}

interface TeamSearchSelectorProps {
  clubs: Club[];
  paramName: 'team1' | 'team2';
  otherParam: string;
  selectedSlug: string | null;
  label: string;
}

export default function TeamSearchSelector({
  clubs,
  paramName,
  otherParam,
  selectedSlug,
  label,
}: TeamSearchSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = selectedSlug ? clubs.find(c => c.slug === selectedSlug) : null;

  const filtered = query.length > 0
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        (c.shortName && c.shortName.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 20)
    : clubs.slice(0, 20);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(clubSlug: string) {
    setIsOpen(false);
    setQuery('');
    const otherKey = paramName === 'team1' ? 'team2' : 'team1';
    const params = new URLSearchParams();
    params.set(paramName, clubSlug);
    if (otherParam) params.set(otherKey, otherParam);
    router.push(`/compare?${params.toString()}`);
  }

  function handleClear() {
    const otherKey = paramName === 'team1' ? 'team2' : 'team1';
    const params = new URLSearchParams();
    if (otherParam) params.set(otherKey, otherParam);
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-zinc-400 mb-2">{label}</label>

      {/* Selected club display */}
      {selected && !isOpen ? (
        <div
          className="flex items-center justify-between rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 cursor-pointer hover:border-zinc-600 transition-colors"
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          <div className="flex items-center gap-3">
            {selected.logoUrl ? (
              <img src={selected.logoUrl} alt="" className="h-6 w-6 object-contain" />
            ) : (
              <Shield className="h-6 w-6 text-zinc-500" />
            )}
            <span className="text-sm font-medium text-white">{selected.name}</span>
            {selected.primaryColor && (
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: selected.primaryColor }}
              />
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a team..."
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl shadow-black/40 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-zinc-500">
              No teams found
            </div>
          ) : (
            filtered.map(club => (
              <button
                key={club.slug}
                onClick={() => handleSelect(club.slug)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-700/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
              >
                {club.logoUrl ? (
                  <img src={club.logoUrl} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <Shield className="h-5 w-5 text-zinc-600" />
                )}
                <span className="text-sm text-zinc-200">{club.name}</span>
                {club.primaryColor && (
                  <span
                    className="ml-auto h-2 w-2 rounded-full"
                    style={{ backgroundColor: club.primaryColor }}
                  />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
