// @ts-nocheck — Stub API data typed as 'any', will be properly typed when rewritten for Footy Feed
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Cpu, Eye, Flame, Gauge, Lightbulb, Settings, Zap } from 'lucide-react';
import { getDeepDiveBySlug } from '@/lib/api/technical-deep-dives';
import { generateArticleMetadata, generateAlternates, SITE_CONFIG } from '@/lib/seo';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  aerodynamics: {
    icon: <Gauge className="h-5 w-5" />,
    label: 'Aerodynamics',
    color: 'text-blue-400',
  },
  power_unit: {
    icon: <Zap className="h-5 w-5" />,
    label: 'Power Unit',
    color: 'text-yellow-400',
  },
  regulations: {
    icon: <BookOpen className="h-5 w-5" />,
    label: 'Regulations',
    color: 'text-purple-400',
  },
  strategy: {
    icon: <Settings className="h-5 w-5" />,
    label: 'Strategy',
    color: 'text-green-400',
  },
  tyres: {
    icon: <Flame className="h-5 w-5" />,
    label: 'Tyres',
    color: 'text-emerald-400',
  },
  technology: {
    icon: <Cpu className="h-5 w-5" />,
    label: 'Technology',
    color: 'text-cyan-400',
  },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  beginner: {
    label: 'Beginner',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'Great for new fans',
  },
  intermediate: {
    label: 'Intermediate',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    description: 'Some F1 knowledge helpful',
  },
  advanced: {
    label: 'Advanced',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    description: 'For technical enthusiasts',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const deepDive = await getDeepDiveBySlug(slug);

  if (!deepDive) {
    return { title: 'Not Found | Footy Feed' };
  }

  const categoryLabel = CATEGORY_CONFIG[deepDive.category]?.label || 'Technical';

  return {
    ...generateArticleMetadata({
      title: deepDive.title,
      description: deepDive.summary || `Technical deep-dive into ${deepDive.title}`,
      publishedTime: deepDive.createdAt?.toISOString() || new Date().toISOString(),
      author: SITE_CONFIG.creator,
      section: categoryLabel,
      tags: deepDive.tags || [categoryLabel, 'football tactics', 'football analysis'],
    }),
    alternates: generateAlternates(`/deep-dives/${slug}`),
  };
}

export default async function DeepDiveDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const deepDive = await getDeepDiveBySlug(slug);

  if (!deepDive) {
    notFound();
  }

  const categoryConfig = CATEGORY_CONFIG[deepDive.category] || CATEGORY_CONFIG.technology;
  const difficultyConfig = DIFFICULTY_CONFIG[deepDive.difficulty || 'intermediate'];
  const keyConcepts = (deepDive.keyConcepts as { term: string; definition: string }[]) || [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/deep-dives"
          className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deep-Dives
        </Link>

        {/* Header */}
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          {/* Category & Difficulty */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 ${categoryConfig.color}`}>
              {categoryConfig.icon}
              <span className="text-sm font-medium">{categoryConfig.label}</span>
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${difficultyConfig.color}`}>
              {difficultyConfig.label} — {difficultyConfig.description}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-white">{deepDive.title}</h1>

          {/* Summary */}
          <p className="text-lg text-zinc-300">{deepDive.summary}</p>

          {/* Meta */}
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {deepDive.viewCount} views
            </span>
          </div>
        </div>

        {/* Main Explanation */}
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">The Details</h2>
          <div
            className="prose prose-invert prose-zinc max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white prose-li:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(deepDive.explanation) }}
          />
        </div>

        {/* Key Concepts */}
        {keyConcepts.length > 0 && (
          <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
              <Lightbulb className="h-5 w-5 text-yellow-400" />
              Key Concepts
            </h2>
            <div className="space-y-4">
              {keyConcepts.map((concept, index) => (
                <div key={index} className="border-l-2 border-zinc-700 pl-4">
                  <dt className="font-semibold text-white">{concept.term}</dt>
                  <dd className="mt-1 text-zinc-400">{concept.definition}</dd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real World Example */}
        {deepDive.realWorldExample && (
          <div className="mb-8 rounded-xl border border-zinc-800 bg-gradient-to-br from-emerald-500/10 to-zinc-900/50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Real-World Example</h2>
            <p className="text-zinc-300">{deepDive.realWorldExample}</p>
          </div>
        )}

        {/* Tags */}
        {deepDive.tags && deepDive.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {deepDive.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown to HTML converter for basic formatting
function formatMarkdown(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (match) => {
      if (match.startsWith('<')) return match;
      return match;
    });
}
