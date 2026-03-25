import Link from 'next/link';
import { VerifiedIcon, UnverifiedIcon, RumoursIcon, DailyRoundupIcon, TimingIcon } from '@/components/icons';
import { getTodayRoundup, getTodayArticlesByCategory } from '@/lib/api/daily-roundup';
import { formatDistanceToNow } from 'date-fns';

interface CategoryCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  summary: string | null;
  accentColor: string;
  borderColor: string;
}

function CategoryCard({ icon, label, count, summary, accentColor, borderColor }: CategoryCardProps) {
  if (count === 0) return null;

  return (
    <div className={`relative group overflow-hidden rounded-lg border ${borderColor} bg-zinc-900/80 p-4 transition-all duration-300 hover:scale-[1.02]`}>
      {/* Racing stripe accent */}
      <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`} />

      {/* Diagonal speed lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            currentColor 10px,
            currentColor 11px
          )`
        }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {icon}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-white">{label}</span>
            <span className={`text-2xl font-black tabular-nums ${accentColor.replace('bg-', 'text-')}`}>{count}</span>
          </div>
        </div>

        {summary ? (
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-zinc-600 italic">Generating summary...</p>
        )}
      </div>
    </div>
  );
}

export async function DailyRoundupWidget() {
  const [roundup, articles] = await Promise.all([
    getTodayRoundup(),
    getTodayArticlesByCategory(),
  ]);

  const totalArticles = articles.verified.length + articles.unverified.length + articles.rumour.length;

  // Don't show the widget if there are no articles today
  if (totalArticles === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
      {/* Full checkered flag pattern background at angle */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #fff 25%, transparent 25%),
            linear-gradient(-45deg, #fff 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #fff 75%),
            linear-gradient(-45deg, transparent 75%, #fff 75%)
          `,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
          transform: 'rotate(12deg) scale(1.5)',
          transformOrigin: 'center center',
        }}
      />

      {/* Top accent bar with gradient */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <DailyRoundupIcon className="text-emerald-500" size={36} />
              {/* Animated pulse effect */}
              <div className="absolute inset-0 animate-ping opacity-20">
                <DailyRoundupIcon className="text-emerald-500" size={36} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">DAILY ROUNDUP</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="font-medium text-zinc-400">{totalArticles} stories</span>
                {roundup?.lastUpdatedAt && (
                  <>
                    <span className="text-emerald-500">•</span>
                    <span className="flex items-center gap-1">
                      <TimingIcon size={12} className="text-zinc-500" />
                      {formatDistanceToNow(new Date(roundup.lastUpdatedAt), { addSuffix: true })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/news/roundup"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            View Full
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Category cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <CategoryCard
            icon={<VerifiedIcon className="text-green-400" size={28} />}
            label="Verified"
            count={articles.verified.length}
            summary={roundup?.verifiedSummary || null}
            accentColor="bg-green-500"
            borderColor="border-green-500/20 hover:border-green-500/40"
          />
          <CategoryCard
            icon={<UnverifiedIcon className="text-yellow-400" size={28} />}
            label="Unverified"
            count={articles.unverified.length}
            summary={roundup?.unverifiedSummary || null}
            accentColor="bg-yellow-500"
            borderColor="border-yellow-500/20 hover:border-yellow-500/40"
          />
          <CategoryCard
            icon={<RumoursIcon className="text-purple-400" size={28} />}
            label="Rumours"
            count={articles.rumour.length}
            summary={roundup?.rumourSummary || null}
            accentColor="bg-purple-500"
            borderColor="border-purple-500/20 hover:border-purple-500/40"
          />
        </div>
      </div>
    </div>
  );
}
