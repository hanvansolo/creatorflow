'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface TechnicalTermPopoverProps {
  term: string;
  definition: string;
  deepDiveSlug?: string;
  children: React.ReactNode;
}

export function TechnicalTermPopover({
  term,
  definition,
  deepDiveSlug,
  children,
}: TechnicalTermPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  return (
    <span
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="border-b border-dashed border-emerald-400/50 text-emerald-400 cursor-help transition-colors hover:border-emerald-400 hover:text-emerald-300">
        {children}
      </span>

      {isOpen && (
        <div
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 transform"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-xl">
            {/* Arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 transform">
              <div className="h-0 w-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-zinc-700" />
              <div className="absolute -top-[1px] left-1/2 h-0 w-0 -translate-x-1/2 transform border-l-[7px] border-r-[7px] border-t-[7px] border-transparent border-t-zinc-800" />
            </div>

            {/* Content */}
            <div className="flex items-start gap-2">
              <BookOpen className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{term}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                  {definition}
                </p>
                {deepDiveSlug && (
                  <Link
                    href={`/deep-dives/${deepDiveSlug}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Read full deep-dive →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
