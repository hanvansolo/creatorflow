import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, Zap, Brain, BarChart3, Radio, Users } from 'lucide-react';
import { createPageMetadata } from '@/lib/seo';
import { getLocale } from '@/lib/i18n/locale';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { AUTHORS } from '@/lib/constants/authors';

export const metadata: Metadata = createPageMetadata(
  'About Footy Feed - Your Football News Hub',
  'Footy Feed aggregates breaking football news from 12+ trusted sources, delivers live scores, AI-powered match predictions, and in-depth tactical analysis.',
  '/about',
  ['about Footy Feed', 'football news aggregator', 'football news hub', 'about us']
);

export default async function AboutPage() {
  const locale = await getLocale();
  const t = getDictionary(locale);

  const features = [
    { icon: Zap, title: t.about.featNewsTitle, description: t.about.featNewsDesc },
    { icon: Radio, title: t.about.featLiveTitle, description: t.about.featLiveDesc },
    { icon: Brain, title: t.about.featAiTitle, description: t.about.featAiDesc },
    { icon: BarChart3, title: t.about.featCompareTitle, description: t.about.featCompareDesc },
    { icon: Zap, title: t.about.featTacticalTitle, description: t.about.featTacticalDesc },
    { icon: Users, title: t.about.featCoverageTitle, description: t.about.featCoverageDesc },
  ];

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">{t.about.heading}</h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">{t.about.intro}</p>
          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mt-4">{t.about.builtBy}</p>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-12 mb-6">{t.about.whatWeOffer}</h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6"
            >
              <feature.icon className="h-8 w-8 text-emerald-500 mb-3" />
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-12 mb-6">Our Team</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AUTHORS.map(author => (
            <Link
              key={author.slug}
              href={`/authors/${author.slug}`}
              className="group rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center gap-4 mb-3">
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white group-hover:text-emerald-400 transition-colors">
                    {author.name}
                  </h3>
                  <p className="text-xs text-emerald-500">{author.role}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">{author.bio}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{t.about.sources}</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">{t.about.sourcesBlurb}</p>
          <div className="flex flex-wrap gap-2">
            {['BBC Sport', 'Sky Sports', 'The Guardian', 'The Athletic', 'ESPN FC', 'Goal.com', 'Fabrizio Romano', 'David Ornstein', 'Football365', 'FourFourTwo', 'Mirror Football', 'Daily Mail Sport', 'Marca'].map((source) => (
              <span
                key={source}
                className="inline-block rounded-full bg-zinc-100 dark:bg-zinc-700 px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300"
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 prose prose-zinc dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">{t.about.disclaimer}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.about.disclaimerBody}</p>
        </div>
      </div>
    </div>
  );
}
