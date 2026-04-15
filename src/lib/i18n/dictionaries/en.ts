export type Dictionary = {
  nav: {
    news: string; live: string; fixtures: string; tables: string;
    matchReports: string; transfers: string; predictions: string; videos: string;
    whatIf: string; rules: string; about: string; contact: string;
    privacy: string; terms: string;
  };
  common: {
    readMore: string; loading: string; error: string; search: string;
    live: string; final: string; halfTime: string; fullTime: string;
    kickoff: string; competition: string; home: string; away: string;
    today: string; tomorrow: string; yesterday: string; selectLanguage: string;
    viewAll: string; backTo: string; refresh: string; next: string; previous: string;
  };
  home: {
    tagline: string; latestNews: string; liveNow: string; todaysFixtures: string;
    topScorers: string; standings: string; moreNews: string; viewAllNews: string;
    explore: string; opinions: string; transferRumours: string; trending: string;
    leagueTable: string; fullTable: string; newsletter: string;
    newsletterBlurb: string; latestVideos: string; allVideos: string;
  };
  live: {
    heading: string; subheading: string; countLive: string; refreshHint: string;
    noneLive: string; nextMatchIn: string; checkFixtures: string;
    viewFixtures: string; viewTables: string;
  };
  fixtures: {
    heading: string; subheading: string; noMatches: string; tryDifferent: string;
  };
  tables: {
    heading: string; subheading: string; club: string; played: string;
    won: string; drawn: string; lost: string; gf: string; ga: string;
    gd: string; pts: string; form: string; noData: string; updatedAfter: string;
    key: string; champLeague: string; europaLeague: string; relegation: string;
    viewFixtures: string; viewTeams: string;
  };
  match: {
    notFound: string; matchCentre: string; blurb: string;
  };
  videos: {
    heading: string; noVideos: string; checkBack: string; latest: string;
  };
  predictions: {
    heading: string; subheading: string; homeWin: string; awayWin: string;
    draw: string; btts: string; confidence: string; score: string;
    prediction: string; none: string; blurb: string; correct: string;
    incorrect: string; upcoming: string;
  };
  matchReports: {
    heading: string; subheading: string; none: string; generatedAfter: string;
    label: string;
  };
  whatIf: {
    heading: string; subheading: string; intro: string; popular: string;
    recent: string; none: string; beFirst: string; back: string;
    shortAnswer: string; detailedAnalysis: string; exploreMore: string;
    entertainment: string; anotherQuestion: string; askSimulator: string;
    transfer: string; historical: string; regulation: string; championship: string;
  };
  rules: {
    heading: string; subheading: string; searchPlaceholder: string;
    all: string; laws17: string; varSpecial: string; quickNav: string;
    lawsHeading: string; varHeading: string; noRules: string;
    noMatch: string; notLoaded: string; clearSearch: string;
    keyPoints: string; morePoints: string; back: string; law: string;
    explanation: string; keyConcepts: string; otherRules: string;
    viewAll: string; relatedNews: string;
  };
  transfers: {
    heading: string; subheading: string; none: string; blurb: string;
    rumour: string; breaking: string;
  };
  search: {
    heading: string; placeholder: string; resultsFor: string;
    resultsCount: string; noResults: string; noResultsFor: string;
    enterQuery: string; enterQueryBlurb: string;
  };
  about: {
    heading: string; intro: string; builtBy: string; whatWeOffer: string;
    featNewsTitle: string; featNewsDesc: string;
    featLiveTitle: string; featLiveDesc: string;
    featAiTitle: string; featAiDesc: string;
    featCompareTitle: string; featCompareDesc: string;
    featTacticalTitle: string; featTacticalDesc: string;
    featCoverageTitle: string; featCoverageDesc: string;
    sources: string; sourcesBlurb: string;
    disclaimer: string; disclaimerBody: string;
  };
  contact: {
    heading: string; intro: string; otherWays: string;
    twitter: string; github: string;
  };
  legal: {
    lastUpdated: string; privacyHeading: string; termsHeading: string;
  };
  footer: {
    tagline: string; navigation: string; resources: string; company: string;
    newsletterTitle: string; newsletterSubtitle: string;
    gambleResponsibly: string; disclaimer: string; trademarks: string;
  };
};

export const en: Dictionary = {
  nav: {
    news: 'News', live: 'Live Scores', fixtures: 'Fixtures', tables: 'Tables',
    matchReports: 'Match Reports', transfers: 'Transfers', predictions: 'Predictions',
    videos: 'Videos', whatIf: 'What If', rules: 'Rules', about: 'About',
    contact: 'Contact', privacy: 'Privacy Policy', terms: 'Terms of Service',
  },
  common: {
    readMore: 'Read more', loading: 'Loading...', error: 'Something went wrong',
    search: 'Search', live: 'LIVE', final: 'Final', halfTime: 'HT', fullTime: 'FT',
    kickoff: 'Kick-off', competition: 'Competition', home: 'Home', away: 'Away',
    today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday',
    selectLanguage: 'Language', viewAll: 'View all', backTo: 'Back to',
    refresh: 'Refresh', next: 'Next', previous: 'Previous',
  },
  home: {
    tagline: 'Football News Without the Waffle',
    latestNews: 'Latest News', liveNow: 'Live Now', todaysFixtures: "Today's Fixtures",
    topScorers: 'Top Scorers', standings: 'Standings', moreNews: 'More News',
    viewAllNews: 'View all news', explore: 'EXPLORE',
    opinions: 'OPINIONS & ANALYSIS', transferRumours: 'TRANSFER RUMOURS',
    trending: 'TRENDING', leagueTable: 'LEAGUE TABLE', fullTable: 'Full table',
    newsletter: 'NEWSLETTER',
    newsletterBlurb: 'Get the best football news delivered weekly. No spam, no waffle.',
    latestVideos: 'LATEST VIDEOS', allVideos: 'All videos',
  },
  live: {
    heading: 'Live Scores',
    subheading: 'Real-time scores and match events across all leagues',
    countLive: 'matches live right now',
    refreshHint: 'Refresh the page for the latest scores',
    noneLive: 'No live matches right now',
    nextMatchIn: 'Next match in',
    checkFixtures: 'Check the fixtures page for upcoming matches',
    viewFixtures: 'View full fixtures', viewTables: 'League tables',
  },
  fixtures: {
    heading: 'Fixtures & Results',
    subheading: "Live scores, today's matches, and recent results",
    noMatches: 'No matches scheduled for this date.',
    tryDifferent: 'Try selecting a different date or competition.',
  },
  tables: {
    heading: 'League Tables',
    subheading: 'Live standings across all major competitions',
    club: 'Club', played: 'P', won: 'W', drawn: 'D', lost: 'L',
    gf: 'GF', ga: 'GA', gd: 'GD', pts: 'Pts', form: 'Form',
    noData: 'No standings data available for this competition yet.',
    updatedAfter: 'Standings are updated after each matchday.',
    key: 'Key:', champLeague: 'Champions League', europaLeague: 'Europa League',
    relegation: 'Relegation', viewFixtures: 'View Fixtures', viewTeams: 'View Teams',
  },
  match: {
    notFound: 'Match Not Found', matchCentre: 'Match Centre',
    blurb: 'Full match details, stats, timeline and AI analysis for',
  },
  videos: {
    heading: 'Football Videos', noVideos: 'No videos available yet',
    checkBack: 'Check back later for the latest content',
    latest: 'Latest Videos',
  },
  predictions: {
    heading: 'Match Predictions',
    subheading: 'AI-powered predictions with score forecasts and BTTS analysis',
    homeWin: 'Home Win', awayWin: 'Away Win', draw: 'Draw',
    btts: 'BTTS', confidence: 'Confidence', score: 'Score',
    prediction: 'Prediction', none: 'No Predictions Available',
    blurb: 'AI predictions will appear here once upcoming matches are scheduled and analysed. Check back closer to match day.',
    correct: 'Correct', incorrect: 'Incorrect', upcoming: 'Upcoming',
  },
  matchReports: {
    heading: 'Match Reports',
    subheading: 'In-depth post-match analysis and reports from top football competitions',
    none: 'No match reports yet',
    generatedAfter: 'Match reports are generated automatically after games finish. Check back soon!',
    label: 'Match Report',
  },
  whatIf: {
    heading: 'What If Simulator',
    subheading: 'Explore alternate football realities',
    intro: 'Ever wondered what could have been? Ask any hypothetical football question and our AI will simulate the scenario.',
    popular: 'Popular Scenarios', recent: 'Recent Scenarios',
    none: 'No Scenarios Yet',
    beFirst: 'Be the first to ask a What If question!',
    back: 'Back to What If Simulator', shortAnswer: 'The Short Answer',
    detailedAnalysis: 'Detailed Analysis', exploreMore: 'Explore More Scenarios',
    entertainment: 'AI-generated analysis for entertainment purposes.',
    anotherQuestion: 'Have another question?', askSimulator: 'Ask the simulator',
    transfer: 'Transfer Scenario', historical: 'Historical Analysis',
    regulation: 'Regulation Change', championship: 'Championship Impact',
  },
  rules: {
    heading: 'Laws of the Game',
    subheading: 'All 17 Laws of the Game plus VAR protocol, explained in plain English.',
    searchPlaceholder: 'Search rules... (e.g. offside, handball, VAR)',
    all: 'All', laws17: '17 Laws', varSpecial: 'VAR & Special Rules',
    quickNav: 'Quick Navigation', lawsHeading: 'The 17 Laws',
    varHeading: 'VAR & Special Rules', noRules: 'No rules found',
    noMatch: 'No rules match your search. Try a different search term.',
    notLoaded: 'Rules have not been loaded yet.', clearSearch: 'Clear search',
    keyPoints: 'Key Points', morePoints: 'more key points',
    back: 'Back to Laws of the Game', law: 'Law of the Game',
    explanation: 'Full Explanation', keyConcepts: 'Key Concepts',
    otherRules: 'Other Rules', viewAll: 'View all rules',
    relatedNews: 'Related News',
  },
  transfers: {
    heading: 'Transfer News',
    subheading: 'Latest rumours, confirmed deals, and transfer window updates',
    none: 'No Transfer News Yet',
    blurb: 'Transfer news articles will appear here when available.',
    rumour: 'Rumour', breaking: 'Breaking',
  },
  search: {
    heading: 'Search', placeholder: 'Search football news...',
    resultsFor: 'Results for', resultsCount: 'results',
    noResults: 'No results found', noResultsFor: 'No articles found for',
    enterQuery: 'Search Football News',
    enterQueryBlurb: 'Enter a search term to find articles by title, content, or summary.',
  },
  about: {
    heading: 'About Footy Feed',
    intro: 'Footy Feed is your complete football hub — aggregating news from trusted sources, live scores, AI-powered predictions, and in-depth tactical analysis from across world football.',
    builtBy: 'Built by fans, for fans. We cut through the noise to bring you only what matters.',
    whatWeOffer: 'What We Offer',
    featNewsTitle: 'News Aggregation',
    featNewsDesc: 'The latest headlines from BBC Sport, Sky Sports, The Guardian, The Athletic, and more — all in one place.',
    featLiveTitle: 'Live Scores',
    featLiveDesc: 'Real-time scores, minute-by-minute updates, and match events across every major league.',
    featAiTitle: 'AI-Powered Predictions',
    featAiDesc: 'Score forecasts, BTTS analysis, and probability models generated by AI for every upcoming fixture.',
    featCompareTitle: 'Player Comparisons',
    featCompareDesc: 'Head-to-head stats, form breakdowns, and season-long analysis for every top-flight player.',
    featTacticalTitle: 'Tactical Deep-Dives',
    featTacticalDesc: 'AI analysis of formations, pressing systems, and tactical trends from across Europe.',
    featCoverageTitle: 'Complete League Coverage',
    featCoverageDesc: 'Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Champions League, and more.',
    sources: 'Our Sources',
    sourcesBlurb: 'We aggregate from trusted football publications including:',
    disclaimer: 'Disclaimer',
    disclaimerBody: 'Footy Feed is an independent football news aggregator. We are not affiliated with FIFA, UEFA, any football league, club, or player. All trademarks and content belong to their respective owners.',
  },
  contact: {
    heading: 'Contact Us',
    intro: "Have feedback, spotted an issue, or just want to say hello? We'd love to hear from you.",
    otherWays: 'Other Ways to Reach Us',
    twitter: 'Follow us on Twitter/X for updates.',
    github: 'Report bugs or feature requests on GitHub.',
  },
  legal: {
    lastUpdated: 'Last updated:',
    privacyHeading: 'Privacy Policy', termsHeading: 'Terms of Service',
  },
  footer: {
    tagline: 'Your one-stop destination for football news, fixtures, league tables, and match predictions.',
    navigation: 'Navigation', resources: 'Resources', company: 'Company',
    newsletterTitle: 'Football News Without the Waffle',
    newsletterSubtitle: 'Weekly roundup straight to your inbox.',
    gambleResponsibly: 'Please Gamble Responsibly. For help and advice visit',
    disclaimer: 'Not affiliated with FIFA, UEFA, or any football league.',
    trademarks: 'All football-related content and trademarks are property of their respective owners.',
  },
};
