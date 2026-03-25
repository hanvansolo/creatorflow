import { Metadata } from 'next';
import { Newspaper, Zap, Brain, BarChart3, Radio, Users } from 'lucide-react';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata(
  'About Footy Feed - Your Football News Hub',
  'Footy Feed aggregates breaking football news from 12+ trusted sources, delivers live scores, AI-powered match predictions, and in-depth tactical analysis.',
  '/about',
  ['about Footy Feed', 'football news aggregator', 'football news hub', 'about us']
);

const features = [
  {
    icon: Newspaper,
    title: 'News Aggregation',
    description: 'We pull the latest football news from over 12 trusted sources including BBC Sport, Sky Sports, The Guardian, and The Athletic, giving you a complete picture in one place.',
  },
  {
    icon: Radio,
    title: 'Live Scores',
    description: 'Follow every match in real time with live scores, goal alerts, match events, minute-by-minute updates, and live league table changes.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Predictions',
    description: 'Our AI analyses team form, head-to-head records, squad strength, and match conditions to generate score predictions for every fixture.',
  },
  {
    icon: BarChart3,
    title: 'Player Comparisons',
    description: 'Compare any two players head-to-head with career statistics, season form, and match-by-match performance breakdowns.',
  },
  {
    icon: Zap,
    title: 'Tactical Deep-Dives',
    description: 'Understand football tactics from beginner to expert. Formations, pressing systems, set pieces, transitions, and rules explained simply.',
  },
  {
    icon: Users,
    title: 'Complete League Coverage',
    description: 'Full profiles for every player and club across top leagues, with career stats, biography, and current season performance.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">About Footy Feed</h1>

        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Footy Feed is your complete football hub. We aggregate breaking news from over 12 trusted football sources,
            deliver live scores, generate AI-powered match predictions, and provide in-depth tactical
            analysis — all in one place.
          </p>

          <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed mt-4">
            Built by fans, for fans. Whether you&apos;re a casual viewer catching up on headlines or a dedicated follower
            tracking every transfer and tactical shift, Footy Feed has you covered. Our goal is simple: make following
            football smarter, faster, and more enjoyable.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-12 mb-6">What We Offer</h2>

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

        <div className="mt-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Our Sources</h2>
          <p className="text-zinc-600 dark:text-zinc-300 mb-4">
            We aggregate content from the most trusted names in football journalism:
          </p>
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
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Disclaimer</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Footy Feed is an independent fan project and is not affiliated with, endorsed by, or connected to FIFA,
            UEFA, the Premier League, or any football club. All football-related trademarks, logos, and content are the property of their respective
            owners. News content is aggregated from publicly available RSS feeds and rewritten by AI for editorial
            purposes. We link back to original sources wherever possible.
          </p>
        </div>
      </div>
    </div>
  );
}
