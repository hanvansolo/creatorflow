'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== MENU DATA =====

const COMPETITIONS = [
  { name: 'Premier League', slug: 'premier-league', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'La Liga', slug: 'la-liga', country: '🇪🇸' },
  { name: 'Serie A', slug: 'serie-a', country: '🇮🇹' },
  { name: 'Bundesliga', slug: 'bundesliga', country: '🇩🇪' },
  { name: 'Ligue 1', slug: 'ligue-1', country: '🇫🇷' },
  { name: 'Champions League', slug: 'champions-league', country: '🇪🇺' },
  { name: 'Europa League', slug: 'europa-league', country: '🇪🇺' },
  { name: 'Conference League', slug: 'conference-league', country: '🇪🇺' },
  { name: 'Championship', slug: 'championship', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Scottish Premiership', slug: 'scottish-premiership', country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { name: 'FA Cup', slug: 'fa-cup', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'EFL Cup', slug: 'efl-cup', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'MLS', slug: 'mls', country: '🇺🇸' },
  { name: 'Liga MX', slug: 'liga-mx', country: '🇲🇽' },
  { name: 'Brasileirão', slug: 'brasileirao', country: '🇧🇷' },
  { name: 'Eredivisie', slug: 'eredivisie', country: '🇳🇱' },
  { name: 'Primeira Liga', slug: 'primeira-liga', country: '🇵🇹' },
  { name: 'Saudi Pro League', slug: 'saudi-pro-league', country: '🇸🇦' },
  { name: 'Nations League', slug: 'nations-league', country: '🌍' },
  { name: 'World Cup', slug: 'world-cup', country: '🌍' },
];

const POPULAR_TEAMS = [
  { name: 'Arsenal', slug: 'arsenal' },
  { name: 'Manchester City', slug: 'manchester-city' },
  { name: 'Liverpool', slug: 'liverpool' },
  { name: 'Manchester Utd', slug: 'manchester-united' },
  { name: 'Chelsea', slug: 'chelsea' },
  { name: 'Tottenham', slug: 'tottenham-hotspur' },
  { name: 'Newcastle', slug: 'newcastle-united' },
  { name: 'Aston Villa', slug: 'aston-villa' },
  { name: 'Real Madrid', slug: 'real-madrid' },
  { name: 'Barcelona', slug: 'barcelona' },
  { name: 'Bayern Munich', slug: 'bayern-munich' },
  { name: 'PSG', slug: 'paris-saint-germain' },
  { name: 'Juventus', slug: 'juventus' },
  { name: 'Inter Milan', slug: 'inter-milan' },
  { name: 'AC Milan', slug: 'ac-milan' },
  { name: 'Dortmund', slug: 'borussia-dortmund' },
];

interface MenuItemConfig {
  label: string;
  href?: string;
  panel?: 'scores' | 'competitions' | 'teams' | 'news' | 'more';
}

const MENU_ITEMS: MenuItemConfig[] = [
  { label: 'Home', href: '/' },
  { label: 'Scores', panel: 'scores' },
  { label: 'Competitions', panel: 'competitions' },
  { label: 'Teams', panel: 'teams' },
  { label: 'News', panel: 'news' },
  { label: 'More', panel: 'more' },
];

// ===== MEGA MENU PANELS =====

function ScoresPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Scores & Fixtures</h3>
        <ul className="space-y-2">
          {[
            { label: 'Live Scores', href: '/live' },
            { label: 'Today\'s Fixtures', href: '/fixtures' },
            { label: 'Results', href: '/fixtures?tab=results' },
            { label: 'Match Reports', href: '/match-reports' },
          ].map(item => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="text-sm text-zinc-300 hover:text-white transition-colors">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Links</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League', href: '/fixtures?competition=premier-league' },
            { label: '🇪🇺 Champions League', href: '/fixtures?competition=champions-league' },
            { label: '🇪🇸 La Liga', href: '/fixtures?competition=la-liga' },
            { label: '🇮🇹 Serie A', href: '/fixtures?competition=serie-a' },
            { label: '🇩🇪 Bundesliga', href: '/fixtures?competition=bundesliga' },
            { label: '🇫🇷 Ligue 1', href: '/fixtures?competition=ligue-1' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700/50 hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetitionsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Competitions</h3>
      <div className="grid grid-cols-4 gap-x-6 gap-y-2">
        {COMPETITIONS.map(comp => (
          <Link
            key={comp.slug}
            href={`/tables?competition=${comp.slug}`}
            onClick={onClose}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            <span className="text-base">{comp.country}</span>
            {comp.name}
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <Link href="/tables" onClick={onClose} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
          All Competitions →
        </Link>
      </div>
    </div>
  );
}

function TeamsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-6">
      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Popular Teams</h3>
      <div className="grid grid-cols-4 gap-x-6 gap-y-2">
        {POPULAR_TEAMS.map(team => (
          <Link
            key={team.slug}
            href={`/teams/${team.slug}`}
            onClick={onClose}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800/50 hover:text-white transition-colors"
          >
            {team.name}
          </Link>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <Link href="/teams" onClick={onClose} className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
          All Teams →
        </Link>
      </div>
    </div>
  );
}

function NewsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {[
        { label: 'Latest News', href: '/news', desc: 'Breaking stories from 12+ sources' },
        { label: 'Match Reports', href: '/match-reports', desc: 'AI-powered post-match analysis' },
        { label: 'Transfers', href: '/transfers', desc: 'Latest transfer news & rumours' },
        { label: 'Videos', href: '/videos', desc: 'Highlights & analysis clips' },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col rounded-lg bg-zinc-800/50 p-4 hover:bg-zinc-700/50 transition-colors group"
        >
          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.label}</span>
          <span className="text-xs text-zinc-500 mt-1">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

function MorePanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid grid-cols-4 gap-6 p-6">
      {[
        { label: 'Predictions', href: '/predictions', desc: 'AI score forecasts & BTTS' },
        { label: 'League Tables', href: '/tables', desc: 'Standings for all leagues' },
        { label: 'Rules', href: '/rules', desc: 'Laws of the game explained' },
        { label: 'Search', href: '/search', desc: 'Find anything on Footy Feed' },
      ].map(item => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className="flex flex-col rounded-lg bg-zinc-800/50 p-4 hover:bg-zinc-700/50 transition-colors group"
        >
          <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.label}</span>
          <span className="text-xs text-zinc-500 mt-1">{item.desc}</span>
        </Link>
      ))}
    </div>
  );
}

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

  // Close on route change
  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  // Close on click outside
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
    timeoutRef.current = setTimeout(() => setOpenPanel(null), 200);
  }

  function handleClose() {
    setOpenPanel(null);
    onItemClick?.();
  }

  if (vertical) {
    // Mobile: simple list with all links
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
              pathname === item.href
                ? 'text-emerald-400 bg-zinc-800'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
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
    <div ref={menuRef} className="flex items-center gap-0.5 relative">
      {MENU_ITEMS.map((item) => {
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
                'px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'text-emerald-400' : 'text-zinc-300 hover:text-white'
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
                'flex items-center gap-0.5 px-3 py-2 text-sm font-medium transition-colors',
                openPanel === item.panel || isActive
                  ? 'text-emerald-400'
                  : 'text-zinc-300 hover:text-white'
              )}
            >
              {item.label}
              <ChevronDown className={cn(
                'h-3.5 w-3.5 transition-transform',
                openPanel === item.panel ? 'rotate-180' : ''
              )} />
            </button>
          </div>
        );
      })}

      {/* Search icon */}
      <Link
        href="/search"
        className={cn(
          'px-3 py-2 text-sm transition-colors',
          pathname === '/search' ? 'text-emerald-400' : 'text-zinc-300 hover:text-white'
        )}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Link>

      {/* Mega menu panel — full width dropdown */}
      {openPanel && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-[900px] max-w-[calc(100vw-2rem)] mt-1 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl shadow-black/50 z-50"
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {panels[openPanel]}
        </div>
      )}
    </div>
  );
}
