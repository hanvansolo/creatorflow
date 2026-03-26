import Link from 'next/link';
import { Home, Newspaper, Calendar } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600">
        <span className="text-3xl font-bold text-white">FF</span>
      </div>
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="mt-2 text-lg text-zinc-400">Page not found</p>
      <p className="mt-1 max-w-md text-sm text-zinc-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Home className="h-4 w-4" />
          Homepage
        </Link>
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Newspaper className="h-4 w-4" />
          News
        </Link>
        <Link
          href="/fixtures"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Calendar className="h-4 w-4" />
          Fixtures
        </Link>
      </div>
    </div>
  );
}
