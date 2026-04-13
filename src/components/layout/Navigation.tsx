'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/live', label: 'Live Scores' },
  { href: '/news', label: 'News' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/tables', label: 'Tables' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/match-reports', label: 'Reports' },
  { href: '/videos', label: 'Videos' },
  { href: '/predictions', label: 'Predictions' },
  { href: '/stats', label: 'Stats' },
  { href: '/rules', label: 'Rules' },
];

interface NavigationProps {
  className?: string;
  vertical?: boolean;
  onItemClick?: () => void;
}

export function Navigation({ className, vertical = false, onItemClick }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'flex gap-1',
        vertical ? 'flex-col' : 'items-center',
        className
      )}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              'relative px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'text-emerald-500 dark:text-emerald-400 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-emerald-500 dark:after:bg-emerald-400'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
            )}
          >
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/search"
        onClick={onItemClick}
        className={cn(
          'relative px-3 py-2 text-sm font-medium transition-colors',
          pathname === '/search'
            ? 'text-emerald-500 dark:text-emerald-400'
            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
        )}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Link>
    </nav>
  );
}
