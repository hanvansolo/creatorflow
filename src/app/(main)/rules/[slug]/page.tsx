// @ts-nocheck
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scale, BookOpen, Newspaper, Eye } from 'lucide-react';
import { db, tacticalAnalysis, newsArticles } from '@/lib/db';
import { eq, or, ne, and, desc, ilike, sql } from 'drizzle-orm';
import { generateBaseMetadata, generateAlternates } from '@/lib/seo';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const rules = await db
    .select()
    .from(tacticalAnalysis)
    .where(eq(tacticalAnalysis.slug, slug))
    .limit(1);

  if (rules.length === 0) {
    return { title: 'Rule Not Found | Footy Feed' };
  }

  const rule = rules[0];
  return {
    ...generateBaseMetadata({
      title: `${rule.title} - Football Rules Explained`,
      description: rule.summary,
      tags: [
        'football rules',
        'laws of the game',
        ...(rule.tags || []),
      ],
    }),
    alternates: generateAlternates(`/rules/${slug}`),
  };
}

export default async function RuleDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const rules = await db
    .select()
    .from(tacticalAnalysis)
    .where(eq(tacticalAnalysis.slug, slug))
    .limit(1);

  if (rules.length === 0) {
    notFound();
  }

  const rule = rules[0];
  const concepts = (rule.keyConcepts || []) as Array<{ term: string; definition: string }>;

  // Get related rules (same category, excluding current)
  const relatedRules = await db
    .select({
      id: tacticalAnalysis.id,
      title: tacticalAnalysis.title,
      slug: tacticalAnalysis.slug,
      summary: tacticalAnalysis.summary,
      category: tacticalAnalysis.category,
      difficulty: tacticalAnalysis.difficulty,
    })
    .from(tacticalAnalysis)
    .where(
      and(
        or(
          eq(tacticalAnalysis.category, 'laws'),
          eq(tacticalAnalysis.category, 'var')
        ),
        ne(tacticalAnalysis.slug, slug)
      )
    )
    .orderBy(tacticalAnalysis.title)
    .limit(6);

  // Get related news articles based on rule tags
  let relatedArticles: any[] = [];
  if (rule.tags && rule.tags.length > 0) {
    try {
      const searchTerms = rule.tags.slice(0, 3);
      const conditions = searchTerms.map((tag: string) =>
        ilike(newsArticles.title, `%${tag}%`)
      );
      relatedArticles = await db
        .select({
          id: newsArticles.id,
          title: newsArticles.title,
          slug: newsArticles.slug,
          publishedAt: newsArticles.publishedAt,
          source: newsArticles.source,
          imageUrl: newsArticles.imageUrl,
        })
        .from(newsArticles)
        .where(or(...conditions))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(5);
    } catch {
      // Silently fail if news query has issues
    }
  }

  const paragraphs = rule.explanation.split('\n\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-gradient-to-b from-emerald-950/30 to-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">
          {/* Breadcrumb */}
          <Link
            href="/rules"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Laws of the Game
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                rule.category === 'var'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {rule.category === 'var' ? 'VAR & Special Rules' : 'Law of the Game'}
            </span>
            {rule.difficulty && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  rule.difficulty === 'advanced'
                    ? 'bg-red-500/20 text-red-400'
                    : rule.difficulty === 'intermediate'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {rule.difficulty}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white">{rule.title}</h1>
          <p className="mt-2 text-zinc-400 text-lg">{rule.summary}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-2">
            {/* Full Explanation */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-emerald-400" />
                Full Explanation
              </h2>
              <div className="space-y-4">
                {paragraphs.map((paragraph, i) => (
                  <p key={i} className="text-zinc-300 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Key Concepts */}
            {concepts.length > 0 && (
              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-400" />
                  Key Concepts
                </h2>
                <dl className="space-y-4">
                  {concepts.map((concept, i) => (
                    <div key={i} className="border-l-2 border-emerald-500/30 pl-4">
                      <dt className="text-sm font-semibold text-emerald-400">{concept.term}</dt>
                      <dd className="text-sm text-zinc-400 mt-0.5">{concept.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Tags */}
            {rule.tags && rule.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {rule.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/rules?q=${encodeURIComponent(tag)}`}
                    className="rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-white hover:border-emerald-500/50 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Related News */}
            {relatedArticles.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Newspaper className="h-4 w-4 text-emerald-400" />
                  Related News
                </h3>
                <div className="space-y-3">
                  {relatedArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="block group"
                    >
                      <p className="text-sm text-zinc-300 group-hover:text-white transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {article.source}
                        {article.publishedAt &&
                          ` · ${new Date(article.publishedAt).toLocaleDateString()}`}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Rules */}
            {relatedRules.length > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-emerald-400" />
                  Other Rules
                </h3>
                <div className="space-y-2">
                  {relatedRules.map((related) => (
                    <Link
                      key={related.id}
                      href={`/rules/${related.slug}`}
                      className="block rounded-lg bg-zinc-800/50 px-3 py-2 hover:bg-zinc-800 transition-colors"
                    >
                      <p className="text-sm text-zinc-300 font-medium truncate">
                        {related.title}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                        {related.summary}
                      </p>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/rules"
                  className="block text-center text-xs text-emerald-400 hover:text-emerald-300 mt-3 transition-colors"
                >
                  View all rules
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
