'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== COMPETITION DATA WITH API-FOOTBALL LOGO URLs =====

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
  { name: 'League One', slug: 'league-one', logo: 'https://media.api-sports.io/football/leagues/41.png' },
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
];

const POPULAR_TEAMS = [
  { name: 'Arsenal', slug: 'arsenal', logo: 'https://media.api-sports.io/football/teams/42.png' },
  { name: 'Manchester City', slug: 'manchester-city', logo: 'https://media.api-sports.io/football/teams/50.png' },
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
  { name: 'West Ham', slug: 'west-ham-united', logo: 'https://media.api-sports.io/football/teams/48.png' },
  { name: 'Brighton', slug: 'brighton-and-hove-albion', logo: 'https://media.api-sports.io/football/teams/51.png' },
  { name: 'Everton', slug: 'everton', logo: 'https://media.api-sports.io/football/teams/45.png' },
  { name: 'Atletico Madrid', slug: 'atletico-madrid', logo: 'https://media.api-sports.io/football/teams/530.png' },
];

function CompLogo({ src, name }: { src: string; name: string }) {
  return (
    <Image
      src={src}
      alt={name}
      width={24}
      height={24}
      className="h-6 w-6 object-contain"
      unoptimized
    />
  );
}

// ===== PANEL COMPONENTS =====

function ScoresPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-[200px_1fr] min-h-[280px]">
      <div className="border-r border-zinc-200 dark:border-zinc-700 p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Scores & Fixtures</h3>
        <ul className="space-y-1">
          {[
            { label: 'Live Scores', href: '/live' },
            { label: 'Today\'s Fixtures', href: '/fixtures' },
            { label: 'Results', href: '/fixtures?tab=results' },
            { label: 'Match Reports', href: '/match-reports' },
          ].map(item => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="block rounded-md px-2 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-5">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Links by Competition</h3>
        <div className="grid grid-cols-2 gap-2">
          {COMPETITIONS.slice(0, 8).map(comp => (
            <Link
              key={comp.slug}
              href={`/fixtures?competition=${comp.slug}`}
              onClick={onClose}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <CompLogo src={comp.logo} name={comp.name} />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{comp.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitionsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-5">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Competitions</h3>
      <div className="grid grid-cols-4 gap-x-4 gap-y-1">
        {COMPETITIONS.map(comp => (
          <Link
            key={comp.slug}
            href={`/tables?competition=${comp.slug}`}
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <CompLogo src={comp.logo} name={comp.name} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{comp.name}</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <Link href="/tables" onClick={onClose} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
          All Competitions →
        </Link>
      </div>
    </div>
  );
}

function TeamsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-5">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Popular Teams</h3>
      <div className="grid grid-cols-4 gap-x-4 gap-y-1">
        {POPULAR_TEAMS.map(team => (
          <Link
            key={team.slug}
            href={`/teams/${team.slug}`}
            onClick={onClose}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <CompLogo src={team.logo} name={team.name} />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{team.name}</span>
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <Link href="/teams" onClick={onClose} className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors">
          All Teams →
        </Link>
      </div>
    </div>
  );
}

function NewsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-4 p-5">
      {[
        { label: 'Latest News', href: '/news', desc: 'Breaking stories from 12+ verified sources', icon: '📰' },
        { label: 'Match Reports', href: '/match-reports', desc: 'AI-powered post-match analysis & reports', icon: '📝' },
        { label: 'Transfers', href: '/transfers', desc: 'Latest transfer news, rumours & confirmed deals', icon: '🔄' },
        { label: 'Videos', href: '/videos', desc: 'Match highlights & analysis clips', icon: '🎬' },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
        >
          <span className="text-2xl mb-2">{item.icon}</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.label}</span>
          <span className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

function MorePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-4 p-5">
      {[
        { label: 'Predictions', href: '/predictions', desc: 'AI score forecasts, BTTS & over/under', icon: '🎯' },
        { label: 'League Tables', href: '/tables', desc: 'Full standings for all competitions', icon: '🏆' },
        { label: 'Rules', href: '/rules', desc: 'Laws of the game explained simply', icon: '📋' },
        { label: 'Search', href: '/search', desc: 'Find anything on Footy Feed', icon: '🔍' },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
        >
          <span className="text-2xl mb-2">{item.icon}</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.label}</span>
          <span className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

// ===== MENU CONFIG =====

interface MenuItemConfig {
  label: string;
  href?: string;
  panel?: string;
}

const MENU_ITEMS: MenuItemConfig[] = [
  { label: 'Home', href: '/' },
  { label: 'Scores', panel: 'scores' },
  { label: 'Competitions', panel: 'competitions' },
  { label: 'Teams', panel: 'teams' },
  { label: 'News', panel: 'news' },
  { label: 'More', panel: 'more' },
];

// ===== MAIN COMPONENT =====

interface MegaMenuProps {
  vertical?: boolean;
  onItemClick?: () => void;
}

export function MegaMenu({ vertical = false, onItemClick }: MegaMenuProps) {
  const pathname = usePathname();
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpenPanel(null); }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMouseEnter(panel: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenPanel(panel);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setOpenPanel(null), 250);
  }

  function handleClose() {
    setOpenPanel(null);
    onItemClick?.();
  }

  if (vertical) {
    return (
      <nav className="flex flex-col gap-1">
        {[
          { href: '/', label: 'Home' },
          { href: '/live', label: 'Live Scores' },
          { href: '/news', label: 'News' },
          { href: '/fixtures', label: 'Fixtures' },
          { href: '/tables', label: 'Tables' },
          { href: '/transfers', label: 'Transfers' },
          { href: '/match-reports', label: 'Reports' },
          { href: '/predictions', label: 'Predictions' },
          { href: '/videos', label: 'Videos' },
          { href: '/rules', label: 'Rules' },
          { href: '/search', label: 'Search' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors rounded-md',
              pathname === item.href ? 'text-emerald-400 bg-zinc-800' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  const panels: Record<string, React.ReactNode> = {
    scores: <ScoresPanel onClose={handleClose} />,
    competitions: <CompetitionsPanel onClose={handleClose} />,
    teams: <TeamsPanel onClose={handleClose} />,
    news: <NewsPanel onClose={handleClose} />,
    more: <MorePanel onClose={handleClose} />,
  };

  return (
    <div ref={menuRef} className="relative flex items-center">
      <nav className="flex items-center gap-0.5">
        {MENU_ITEMS.map((item) => {
          const isOpen = openPanel === item.panel;
          const isActive = item.href
            ? pathname === item.href
            : item.panel === 'scores' ? ['/live', '/fixtures', '/match-reports'].some(p => pathname.startsWith(p))
            : item.panel === 'news' ? ['/news', '/transfers', '/videos'].some(p => pathname.startsWith(p))
            : item.panel === 'competitions' ? pathname.startsWith('/tables')
            : item.panel === 'teams' ? pathname.startsWith('/teams')
            : item.panel === 'more' ? ['/predictions', '/rules', '/search'].some(p => pathname.startsWith(p))
            : false;

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onMouseEnter={() => setOpenPanel(null)}
                className={cn(
                  'px-3 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-emerald-500 dark:text-emerald-400 border-b-2 border-emerald-500'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-b-2 border-transparent'
                )}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <div
              key={item.label}
              onMouseEnter={() => handleMouseEnter(item.panel!)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={cn(
                  'flex items-center gap-0.5 px-3 py-2.5 text-sm font-semibold transition-colors border-b-2',
                  isOpen || isActive
                    ? 'text-emerald-500 dark:text-emerald-400 border-emerald-500'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border-transparent'
                )}
              >
                {item.label}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform ml-0.5', isOpen ? 'rotate-180' : '')} />
              </button>
            </div>
          );
        })}

        <Link
          href="/search"
          className={cn(
            'px-3 py-2.5 transition-colors',
            pathname === '/search' ? 'text-emerald-400' : 'text-zinc-400 hover:text-white'
          )}
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Link>
      </nav>

      {/* Dropdown panel — full width, appears below nav */}
      {openPanel && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-[960px] max-w-[calc(100vw-2rem)] mt-0 rounded-b-xl bg-white dark:bg-zinc-900 border border-t-0 border-zinc-200 dark:border-zinc-800 shadow-xl shadow-black/10 dark:shadow-black/40 z-50"
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {panels[openPanel]}
        </div>
      )}
    </div>
  );
}
