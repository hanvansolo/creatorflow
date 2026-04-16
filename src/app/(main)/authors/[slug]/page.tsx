// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Newspaper, ArrowLeft } from 'lucide-react';
import { db, newsArticles } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { AUTHORS, getAuthorBySlug } from '@/lib/constants/authors';
import { createPageMetadata } from '@/lib/seo';
import { formatRelativeTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: 'Author Not Found' };
  return createPageMetadata(
    `${author.name} — ${author.role} | Footy Feed`,
    author.bio,
    `/authors/${slug}`,
    [author.name, author.role, 'football writer', 'Footy Feed']
  );
}

export function generateStaticParams() {
  return AUTHORS.map(a => ({ slug: a.slug }));
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      slug: newsArticles.slug,
      summary: newsArticles.summary,
      imageUrl: newsArticles.imageUrl,
      publishedAt: newsArticles.publishedAt,
    })
    .from(newsArticles)
    .where(eq(newsArticles.author, author.name))
    .orderBy(desc(newsArticles.publishedAt))
    .limit(30);

  return (
    <div className="min-h-screen">
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/about" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white mb-6">
            <ArrowLeft className="h-4 w-4" />
            About Footy Feed
          </Link>

          <div className="flex items-start gap-6">
            <Image
              src={author.avatar}
              alt={author.name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full border-2 border-emerald-500/30"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">{author.name}</h1>
              <p className="text-emerald-400 text-sm font-medium mt-1">{author.role}</p>
              <p className="text-zinc-400 text-sm mt-3 max-w-lg">{author.bio}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {author.specialities.map(s => (
                  <span key={s} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400 border border-zinc-700/50">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-6">
          <Newspaper className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">
            Articles by {author.name} ({articles.length})
          </h2>
        </div>

        {articles.length === 0 ? (
          <p className="text-zinc-500">No articles yet.</p>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="flex gap-4 group rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-emerald-500/30 transition-colors"
              >
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-20 w-28 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-20 w-28 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    <Newspaper className="h-6 w-6 text-zinc-600" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-sm text-zinc-400 line-clamp-2 mt-1">{article.summary}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(article.publishedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
