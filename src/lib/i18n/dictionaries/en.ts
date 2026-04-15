export type Dictionary = {
  nav: {
    news: string;
    live: string;
    fixtures: string;
    tables: string;
    matchReports: string;
    transfers: string;
    predictions: string;
    videos: string;
    whatIf: string;
    rules: string;
    about: string;
    contact: string;
    privacy: string;
    terms: string;
  };
  common: {
    readMore: string;
    loading: string;
    error: string;
    search: string;
    live: string;
    final: string;
    halfTime: string;
    fullTime: string;
    kickoff: string;
    competition: string;
    home: string;
    away: string;
    today: string;
    tomorrow: string;
    yesterday: string;
    selectLanguage: string;
  };
  home: {
    tagline: string;
    latestNews: string;
    liveNow: string;
    todaysFixtures: string;
    topScorers: string;
    standings: string;
  };
  footer: {
    tagline: string;
    navigation: string;
    resources: string;
    company: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    gambleResponsibly: string;
    disclaimer: string;
    trademarks: string;
  };
};

export const en: Dictionary = {
  nav: {
    news: 'News',
    live: 'Live Scores',
    fixtures: 'Fixtures',
    tables: 'Tables',
    matchReports: 'Match Reports',
    transfers: 'Transfers',
    predictions: 'Predictions',
    videos: 'Videos',
    whatIf: 'What If',
    rules: 'Rules',
    about: 'About',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
  },
  common: {
    readMore: 'Read more',
    loading: 'Loading...',
    error: 'Something went wrong',
    search: 'Search',
    live: 'LIVE',
    final: 'Final',
    halfTime: 'HT',
    fullTime: 'FT',
    kickoff: 'Kick-off',
    competition: 'Competition',
    home: 'Home',
    away: 'Away',
    today: 'Today',
    tomorrow: 'Tomorrow',
    yesterday: 'Yesterday',
    selectLanguage: 'Language',
  },
  home: {
    tagline: 'Football News Without the Waffle',
    latestNews: 'Latest News',
    liveNow: 'Live Now',
    todaysFixtures: "Today's Fixtures",
    topScorers: 'Top Scorers',
    standings: 'Standings',
  },
  footer: {
    tagline: 'Your one-stop destination for football news, fixtures, league tables, and match predictions.',
    navigation: 'Navigation',
    resources: 'Resources',
    company: 'Company',
    newsletterTitle: 'Football News Without the Waffle',
    newsletterSubtitle: 'Weekly roundup straight to your inbox.',
    gambleResponsibly: 'Please Gamble Responsibly. For help and advice visit',
    disclaimer: 'Not affiliated with FIFA, UEFA, or any football league.',
    trademarks: 'All football-related content and trademarks are property of their respective owners.',
  },
};
