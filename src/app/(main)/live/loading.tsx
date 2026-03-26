// @ts-nocheck
export default function LiveLoading() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
        {/* Session Header Skeleton */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-6 w-16 bg-zinc-800 rounded" />
            <div className="h-7 w-48 bg-zinc-800 rounded" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-24 bg-zinc-800 rounded" />
            <div className="h-4 w-4 bg-zinc-800 rounded" />
            <div className="h-4 w-32 bg-zinc-800 rounded" />
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Leaderboard Skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              {/* Header */}
              <div className="border-b border-zinc-700 bg-zinc-800/50 p-3">
                <div className="flex gap-4">
                  <div className="h-4 w-8 bg-zinc-700 rounded" />
                  <div className="h-4 w-16 bg-zinc-700 rounded" />
                  <div className="h-4 w-12 bg-zinc-700 rounded" />
                  <div className="h-4 w-10 bg-zinc-700 rounded" />
                </div>
              </div>
              {/* Rows */}
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 border-b border-zinc-800/50 animate-pulse"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="h-6 w-6 bg-zinc-800 rounded" />
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-zinc-800 rounded" />
                    <div>
                      <div className="h-4 w-12 bg-zinc-800 rounded" />
                      <div className="h-3 w-24 bg-zinc-800 rounded mt-1" />
                    </div>
                  </div>
                  <div className="ml-auto h-4 w-16 bg-zinc-800 rounded" />
                  <div className="h-5 w-5 bg-zinc-800 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            {/* Race Control Skeleton */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <div className="h-4 w-24 bg-zinc-700 rounded" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-4 w-4 bg-zinc-800 rounded" />
                    <div className="flex-1">
                      <div className="h-4 w-full bg-zinc-800 rounded" />
                      <div className="h-3 w-24 bg-zinc-800 rounded mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pit Stops Skeleton */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-800/50">
                <div className="h-4 w-20 bg-zinc-700 rounded" />
              </div>
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-1 bg-zinc-800 rounded" />
                      <div className="h-4 w-16 bg-zinc-800 rounded" />
                    </div>
                    <div className="h-4 w-12 bg-zinc-800 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
