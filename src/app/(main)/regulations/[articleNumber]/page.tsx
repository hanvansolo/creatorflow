// @ts-nocheck — Stub API data typed as 'any', will be properly typed when rewritten for Footy Feed
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Scale, Wrench, DollarSign, Newspaper, Clock } from 'lucide-react';
import { getRegulationByArticleNumber, getArticlesForRegulation } from '@/lib/api/regulations';
import { RegulationFullDisplay } from '@/components/regulations/RegulationFullDisplay';
import { formatRelativeTime } from '@/lib/utils';
import { generateBaseMetadata, generateAlternates } from '@/lib/seo';

interface PageProps {
  params: Promise<{ articleNumber: string }>;
}

const categoryConfig = {
  sporting: {
    icon: Scale,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    label: 'Sporting Regulations',
  },
  technical: {
    icon: Wrench,
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    label: 'Technical Regulations',
  },
  financial: {
    icon: DollarSign,
    color: 'bg-green-500',
    textColor: 'text-green-400',
    label: 'Financial Regulations',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { articleNumber } = await params;
  const decodedNumber = decodeURIComponent(articleNumber);
  const regulation = await getRegulationByArticleNumber(decodedNumber);

  if (!regulation) {
    return {
      title: 'Regulation Not Found | Footy Feed',
    };
  }

  const categoryLabel = categoryConfig[regulation.category as keyof typeof categoryConfig]?.label || 'Regulation';
  const description = regulation.simplifiedExplanation || regulation.officialText.substring(0, 160);

  return {
    ...generateBaseMetadata({
      title: `Article ${regulation.articleNumber}: ${regulation.articleTitle} - Football ${categoryLabel}`,
      description,
      tags: ['football regulations', categoryLabel, regulation.articleTitle, 'football rules', 'match rules'],
    }),
    alternates: generateAlternates(`/regulations/${articleNumber}`),
  };
}

export default async function RegulationDetailPage({ params }: PageProps) {
  const { articleNumber } = await params;
  const decodedNumber = decodeURIComponent(articleNumber);
  const regulation = await getRegulationByArticleNumber(decodedNumber);

  if (!regulation) {
    notFound();
  }

  const config = categoryConfig[regulation.category as keyof typeof categoryConfig] || categoryConfig.sporting;
  const Icon = config.icon;

  // Get related articles that reference this regulation
  const relatedArticles = await getArticlesForRegulation(regulation.id, 5);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <Link
              href="/regulations"
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Regulations
            </Link>
            <span className="text-zinc-600">/</span>
            <Link
              href={`/regulations?category=${regulation.category}`}
              className={`flex items-center gap-1 ${config.textColor} hover:underline`}
            >
              <Icon className="h-4 w-4" />
              {config.label}
            </Link>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${config.color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className={`text-sm font-bold ${config.textColor}`}>
                Article {regulation.articleNumber}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {regulation.articleTitle}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Regulation Display */}
        <RegulationFullDisplay regulation={regulation} />

        {/* Related News Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <Newspaper className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-white">Related News</h2>
            </div>
            <div className="space-y-3">
              {relatedArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                >
                  <h3 className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {article.title}
                  </h3>
                  {article.publishedAt && (
                    <span className="flex items-center gap-1 text-xs text-zinc-500 flex-shrink-0 ml-4">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(article.publishedAt.toISOString())}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-zinc-800">
          <Link
            href="/regulations"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all regulations
          </Link>
        </div>
      </div>
    </div>
  );
}
