import type { Metadata } from 'next';

export const SITE_CONFIG = {
  name: 'Footy Feed',
  shortName: 'Footy Feed',
  description: 'Football news that gets straight to the point. Breaking news from 12+ sources, AI-powered match predictions, live scores, league tables, transfer tracker, tactical analysis, and What If scenarios. Everything you need to stay ahead of the game.',
  tagline: 'Football News Without the Waffle',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://footy-feed.com',
  locale: 'en_US',
  themeColor: '#00B140',
  twitterHandle: '@FootyFeed',
  creator: 'Footy Feed',
} as const;

export const DEFAULT_KEYWORDS = [
  'football news',
  'soccer news',
  'Premier League',
  'Champions League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'live scores',
  'match predictions',
  'league tables',
  'transfer news',
  'football analysis',
  'match highlights',
  'player stats',
  'football fixtures',
  'EPL',
  'UEFA',
  'World Cup',
];

// Feature descriptions for SEO and marketing
export const FEATURE_HIGHLIGHTS = {
  newsAggregator: {
    title: 'News Aggregator',
    description: 'Breaking football news from 12+ trusted sources including BBC Sport, Sky Sports, and The Guardian with smart deduplication and credibility ratings.',
  },
  aiPredictions: {
    title: 'AI Match Predictions',
    description: 'AI-powered match predictions with win/draw/loss probabilities, predicted scores, BTTS, and over/under based on form, head-to-head, and squad strength.',
  },
  liveScores: {
    title: 'Live Scores',
    description: 'Real-time match scores, goal alerts, match events, and minute-by-minute updates across all major leagues.',
  },
  whatIfSimulator: {
    title: 'What If Simulator',
    description: 'Explore alternate football realities with AI-powered analysis of hypothetical transfers, tactical changes, and rule scenarios.',
  },
  playerComparison: {
    title: 'Player Comparison',
    description: 'Compare any two players with detailed stats, season form, goals, assists, and performance metrics.',
  },
  tacticalAnalysis: {
    title: 'Tactical Analysis',
    description: 'Understand football tactics: formations, pressing systems, set pieces, transitions, and player roles explained from beginner to advanced.',
  },
  transferTracker: {
    title: 'Transfer Tracker',
    description: 'Live transfer updates, rumour tracker with probability scores, confirmed deals, and spending summaries by club.',
  },
  leagueTables: {
    title: 'League Tables',
    description: 'Live league tables for all major competitions with form guides, goal difference, and qualification zones.',
  },
} as const;

export const DEFAULT_METADATA: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} - Football News, Live Scores & Match Predictions`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_CONFIG.creator }],
  creator: SITE_CONFIG.creator,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [
      {
        url: '/images/og-default.png',
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: ['/images/og-default.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const CONTENT_SECTIONS = {
  NEWS: 'News',
  FIXTURES: 'Fixtures',
  PLAYERS: 'Players',
  TEAMS: 'Teams',
  TABLES: 'Tables',
  LIVE: 'Live Scores',
  VIDEOS: 'Videos',
  TACTICS: 'Tactical Analysis',
  WHAT_IF: 'What If Scenarios',
  PREDICTIONS: 'Predictions',
  TRANSFERS: 'Transfers',
} as const;
