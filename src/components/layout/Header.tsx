'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { UserMenu } from './UserMenu';
import { cn } from '@/lib/utils';
import logo from '@/app/logo.png';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl dark:bg-zinc-900/95">
      {/* Top row: Logo + User */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src={logo}
              alt="Footy Feed"
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <UserMenu />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Centered navigation */}
      <div className="hidden md:block border-t border-zinc-800/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <MegaMenu />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'border-t border-zinc-700 bg-zinc-900 md:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="px-4 py-4">
          <MegaMenu vertical onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>
    </header>
  );
}
