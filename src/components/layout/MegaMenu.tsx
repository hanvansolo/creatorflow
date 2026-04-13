'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== DATA =====

const COMPETITIONS = [
  { name: 'Premier League', slug: 'premier-league', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { name: 'La Liga', slug: 'la-liga', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { name: 'Serie A', slug: 'serie-a', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { name: 'Bundesliga', slug: 'bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { name: 'Ligue 1', slug: 'ligue-1', logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { name: 'Champions League', slug: 'champions-league', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { name: 'Europa League', slug: 'europa-league', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { name: 'Conference League', slug: 'conference-league', logo: 'https://media.api-sports.io/football/leagues/848.png' },
  { name: 'Championship', slug: 'championship', logo: 'https://media.api-sports.io/football/leagues/40.png' },
  { name: 'Scottish Premiership', slug: 'scottish-premiership', logo: 'https://media.api-sports.io/football/leagues/179.png' },
  { name: 'FA Cup', slug: 'fa-cup', logo: 'https://media.api-sports.io/football/leagues/45.png' },
  { name: 'EFL Cup', slug: 'efl-cup', logo: 'https://media.api-sports.io/football/leagues/46.png' },
  { name: 'Eredivisie', slug: 'eredivisie', logo: 'https://media.api-sports.io/football/leagues/88.png' },
  { name: 'Primeira Liga', slug: 'primeira-liga', logo: 'https://media.api-sports.io/football/leagues/94.png' },
  { name: 'MLS', slug: 'mls', logo: 'https://media.api-sports.io/football/leagues/253.png' },
  { name: 'Copa Libertadores', slug: 'copa-libertadores', logo: 'https://media.api-sports.io/football/leagues/13.png' },
  { name: 'Saudi Pro League', slug: 'saudi-pro-league', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { name: 'Nations League', slug: 'nations-league', logo: 'https://media.api-sports.io/football/leagues/5.png' },
  { name: 'World Cup', slug: 'world-cup', logo: 'https://media.api-sports.io/football/leagues/1.png' },
  { name: 'League One', slug: 'league-one', logo: 'https://media.api-sports.io/football/leagues/41.png' },
];

const POPULAR_TEAMS = [
  { name: 'Arsenal', slug: 'arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
  { name: 'Man City', slug: 'manchester-city', logo: 'https://media.api-sports.io/football/teams/50.png' },
  { name: 'Liverpool', slug: 'liverpool', logo: 'https://media.api-sports.io/football/teams/40.png' },
  { name: 'Man United', slug: 'manchester-united', logo: 'https://media.api-sports.io/football/teams/33.png' },
  { name: 'Chelsea', slug: 'chelsea', logo: 'https://media.api-sports.io/football/teams/49.png' },
  { name: 'Tottenham', slug: 'tottenham-hotspur', logo: 'https://media.api-sports.io/football/teams/47.png' },
  { name: 'Newcastle', slug: 'newcastle-united', logo: 'https://media.api-sports.io/football/teams/34.png' },
  { name: 'Aston Villa', slug: 'aston-villa', logo: 'https://media.api-sports.io/football/teams/66.png' },
  { name: 'Real Madrid', slug: 'real-madrid', logo: 'https://media.api-sports.io/football/teams/541.png' },
  { name: 'Barcelona', slug: 'barcelona', logo: 'https://media.api-sports.io/football/teams/529.png' },
  { name: 'Bayern Munich', slug: 'bayern-munich', logo: 'https://media.api-sports.io/football/teams/157.png' },
  { name: 'PSG', slug: 'paris-saint-germain', logo: 'https://media.api-sports.io/football/teams/85.png' },
  { name: 'Juventus', slug: 'juventus', logo: 'https://media.api-sports.io/football/teams/496.png' },
  { name: 'Inter Milan', slug: 'inter-milan', logo: 'https://media.api-sports.io/football/teams/505.png' },
  { name: 'AC Milan', slug: 'ac-milan', logo: 'https://media.api-sports.io/football/teams/489.png' },
  { name: 'Dortmund', slug: 'borussia-dortmund', logo: 'https://media.api-sports.io/football/teams/165.png' },
];

function Logo({ src, name, size = 22 }: { src: string; name: string; size?: number }) {
  return <Image src={src} alt={name} width={size} height={size} className="object-contain" style={{ width: size, height: size }} unoptimized />;
}

// ===== LIVE DATA HOOK =====

interface MenuData {
  news: Array<{ title: string; slug: string; imageUrl: string; source: string; ago: number }>;
  matches: Array<{ id: string; status: string; minute: number; homeScore: number; awayScore: number; homeName: string; homeLogo: string; awayName: string; awayLogo: string; comp: string; kickoff: string }>;
}

function useMenuData(shouldFetch: boolean) {
  const [data, setData] = useState<MenuData | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (!shouldFetch || fetched.current) return;
    fetched.current = true;
    fetch('/api/menu-data')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, [shouldFetch]);

  return data;
}

function formatAgo(mins: number): string {
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

// ===== PANELS =====

function ScoresPanel({ onClose, data }: { onClose: () => void; data: MenuData | null }) {
  return (
    <div className="grid grid-cols-[180px_1fr_280px]">
      {/* Left nav */}
      <div className="border-r border-zinc-200 dark:border-zinc-700/50 p-4 space-y-1">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Scores & Fixtures</h3>
        {[
          { label: 'Live Scores', href: '/live' },
          { label: "Today's Fixtures", href: '/fixtures' },
          { label: 'Results', href: '/fixtures?tab=results' },
          { label: 'Match Reports', href: '/match-reports' },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={onClose} className="block rounded px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            {item.label}
          </Link>
        ))}
      </div>

      {/* Center: fixture cards */}
      <div className="p-4 border-r border-zinc-200 dark:border-zinc-700/50">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Today</h3>
        <div className="space-y-1">
          {data?.matches.slice(0, 6).map(m => {
            const isLive = ['live', 'halftime', 'extra_time', 'penalties'].includes(m.status);
            const isFt = m.status === 'finished';
            return (
              <Link key={m.id} href={`/matches/${m.id}`} onClick={onClose} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                {m.homeLogo && <Logo src={m.homeLogo} name={m.homeName} size={18} />}
                <span className="text-xs text-zinc-600 dark:text-zinc-400 w-16 truncate text-right">{m.homeName.split(' ').pop()}</span>
                <span className={cn('text-xs font-bold tabular-nums min-w-[28px] text-center', isLive ? 'text-emerald-500' : isFt ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400')}>
                  {isLive || isFt ? `${m.homeScore ?? 0}-${m.awayScore ?? 0}` : new Date(m.kickoff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 w-16 truncate">{m.awayName.split(' ').pop()}</span>
                {m.awayLogo && <Logo src={m.awayLogo} name={m.awayName} size={18} />}
                {isLive && <span className="text-[9px] font-bold text-emerald-500 ml-auto">{m.status === 'halftime' ? 'HT' : `${m.minute}'`}</span>}
                {isFt && <span className="text-[9px] text-zinc-400 ml-auto">FT</span>}
              </Link>
            );
          }) || <p className="text-xs text-zinc-400">Loading...</p>}
        </div>
      </div>

      {/* Right: news snippets */}
      <div className="p-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Latest</h3>
        <div className="space-y-2">
          {data?.news.slice(0, 3).map(article => (
            <Link key={article.slug} href={`/news/${article.slug}`} onClick={onClose} className="flex gap-2 rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
              {article.imageUrl && (
                <img src={article.imageUrl} alt="" className="w-16 h-10 rounded object-cover shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{article.title}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">{article.source} · {formatAgo(article.ago)}</p>
              </div>
            </Link>
          )) || <p className="text-xs text-zinc-400">Loading...</p>}
        </div>
      </div>
    </div>
  );
}

function CompetitionsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-5">
      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Competitions</h3>
      <div className="grid grid-cols-4 gap-x-4 gap-y-0.5">
        {COMPETITIONS.map(c => (
          <Link key={c.slug} href={`/tables?competition=${c.slug}`} onClick={onClose} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Logo src={c.logo} name={c.name} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{c.name}</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
        <Link href="/tables" onClick={onClose} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Competitions →</Link>
      </div>
    </div>
  );
}

function TeamsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-5">
      <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Popular Teams</h3>
      <div className="grid grid-cols-4 gap-x-4 gap-y-0.5">
        {POPULAR_TEAMS.map(t => (
          <Link key={t.slug} href={`/teams/${t.slug}`} onClick={onClose} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <Logo src={t.logo} name={t.name} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{t.name}</span>
          </Link>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-zinc-200 dark:border-zinc-700/50">
        <Link href="/teams" onClick={onClose} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">All Teams →</Link>
      </div>
    </div>
  );
}

function NewsPanel({ onClose, data }: { onClose: () => void; data: MenuData | null }) {
  return (
    <div className="grid grid-cols-[180px_1fr]">
      <div className="border-r border-zinc-200 dark:border-zinc-700/50 p-4 space-y-1">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Sections</h3>
        {[
          { label: 'Latest News', href: '/news' },
          { label: 'Match Reports', href: '/match-reports' },
          { label: 'Transfers', href: '/transfers' },
          { label: 'Videos', href: '/videos' },
          { label: 'Predictions', href: '/predictions' },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={onClose} className="block rounded px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            {item.label}
          </Link>
        ))}
      </div>
      <div className="p-4">
        <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Latest News</h3>
        <div className="grid grid-cols-2 gap-3">
          {data?.news.slice(0, 4).map(article => (
            <Link key={article.slug} href={`/news/${article.slug}`} onClick={onClose} className="group rounded-lg overflow-hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {article.imageUrl && (
                <img src={article.imageUrl} alt="" className="w-full h-24 object-cover rounded-t-lg" />
              )}
              <div className="p-2">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{article.title}</p>
                <p className="text-[9px] text-zinc-400 mt-1">{article.source} · {formatAgo(article.ago)}</p>
              </div>
            </Link>
          )) || <p className="text-xs text-zinc-400 col-span-2">Loading...</p>}
        </div>
      </div>
    </div>
  );
}

function MorePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-3 p-5">
      {[
        { label: 'Predictions', href: '/predictions', desc: 'AI score forecasts, BTTS & O/U', icon: '🎯' },
        { label: 'League Tables', href: '/tables', desc: 'Full standings', icon: '🏆' },
        { label: 'Rules', href: '/rules', desc: 'Laws of the game', icon: '📋' },
        { label: 'Search', href: '/search', desc: 'Find anything', icon: '🔍' },
      ].map(item => (
        <Link key={item.href} href={item.href} onClick={onClose} className="flex flex-col rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
          <span className="text-xl mb-1">{item.icon}</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{item.label}</span>
          <span className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

// ===== CONFIG =====

const MENU_ITEMS: Array<{ label: string; href?: string; panel?: string }> = [
  { label: 'Home', href: '/' },
  { label: 'Scores', panel: 'scores' },
  { label: 'Competitions', panel: 'competitions' },
  { label: 'Teams', panel: 'teams' },
  { label: 'News', panel: 'news' },
  { label: 'More', panel: 'more' },
];

// ===== MAIN =====

export function MegaMenu({ vertical = false, onItemClick }: { vertical?: boolean; onItemClick?: () => void }) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch live data when any panel opens
  const menuData = useMenuData(openPanel === 'scores' || openPanel === 'news');

  useEffect(() => { setOpenPanel(null); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenPanel(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const enter = useCallback((p: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenPanel(p);
  }, []);

  const leave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenPanel(null), 250);
  }, []);

  const close = useCallback(() => { setOpenPanel(null); onItemClick?.(); }, [onItemClick]);

  if (vertical) {
    return (
      <nav className="flex flex-col gap-1">
        {[
          { href: '/', label: 'Home' }, { href: '/live', label: 'Live Scores' },
          { href: '/news', label: 'News' }, { href: '/fixtures', label: 'Fixtures' },
          { href: '/tables', label: 'Tables' }, { href: '/transfers', label: 'Transfers' },
          { href: '/match-reports', label: 'Reports' }, { href: '/predictions', label: 'Predictions' },
          { href: '/videos', label: 'Videos' }, { href: '/rules', label: 'Rules' },
        ].map(item => (
          <Link key={item.href} href={item.href} onClick={onItemClick}
            className={cn('px-3 py-2 text-sm font-medium rounded-md', pathname === item.href ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50')}>
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  const panels: Record<string, React.ReactNode> = {
    scores: <ScoresPanel onClose={close} data={menuData} />,
    competitions: <CompetitionsPanel onClose={close} />,
    teams: <TeamsPanel onClose={close} />,
    news: <NewsPanel onClose={close} data={menuData} />,
    more: <MorePanel onClose={close} />,
  };

  return (
    <div ref={menuRef} className="relative flex items-center">
      <nav className="flex items-center">
        {MENU_ITEMS.map(item => {
          const isOpen = openPanel === item.panel;
          const isActive = item.href ? pathname === item.href
            : item.panel === 'scores' ? ['/live', '/fixtures', '/match-reports'].some(p => pathname.startsWith(p))
            : item.panel === 'news' ? ['/news', '/transfers', '/videos'].some(p => pathname.startsWith(p))
            : item.panel === 'competitions' ? pathname.startsWith('/tables')
            : item.panel === 'teams' ? pathname.startsWith('/teams')
            : false;

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} onMouseEnter={() => setOpenPanel(null)}
                className={cn('px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'text-emerald-400' : 'text-zinc-300 hover:text-white')}>
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.label} onMouseEnter={() => enter(item.panel!)} onMouseLeave={leave}>
              <button className={cn('flex items-center gap-0.5 px-3 py-2.5 text-sm font-semibold transition-colors',
                isOpen || isActive ? 'text-emerald-400' : 'text-zinc-300 hover:text-white')}>
                {item.label}
                <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
              </button>
            </div>
          );
        })}
        <Link href="/search" className="px-3 py-2.5 text-zinc-400 hover:text-white transition-colors" aria-label="Search">
          <Search className="h-4 w-4" />
        </Link>
      </nav>

      {openPanel && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-[960px] max-w-[calc(100vw-2rem)] rounded-b-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-50"
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={leave}
        >
          {panels[openPanel]}
        </div>
      )}
    </div>
  );
}
