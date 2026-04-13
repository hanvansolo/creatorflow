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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 mr-8">
            <Image
              src={logo}
              alt="Footy Feed"
              height={52}
              className="h-13 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation — centered */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-center">
            <MegaMenu />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <UserMenu />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-300 hover:bg-zinc-700 hover:text-white lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={cn('border-t border-zinc-700 bg-zinc-900 lg:hidden', mobileMenuOpen ? 'block' : 'hidden')}>
        <div className="px-4 py-4">
          <MegaMenu vertical onItemClick={() => setMobileMenuOpen(false)} />
        </div>
      </div>
    </header>
  );
}
