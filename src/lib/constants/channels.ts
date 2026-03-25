// Verified YouTube Channel IDs for football content
export const YOUTUBE_CHANNELS = [
  // Analysis & Tactics (priority 1 - featured)
  {
    name: 'TIFO Football',
    channelId: 'UCGYYNGmyhZ_kwBF_lqqXdAQ',
    priority: 1,
    description: 'Football tactics and analysis',
  },
  {
    name: 'Football Daily',
    channelId: 'UCgIHBvQnklu3OSwkz0JmGXQ',
    priority: 1,
    description: 'Daily football news and debate',
  },
  {
    name: 'Statman Dave',
    channelId: 'UChmJdSMJLGMdmSP1fFTJHOA',
    priority: 1,
    description: 'Data-driven football analysis',
  },
  {
    name: 'The Overlap',
    channelId: 'UC29AKUN3ONFM7OVJyBTqHzA',
    priority: 1,
    description: 'Gary Neville football show',
  },
  {
    name: 'Rio Ferdinand Presents FIVE',
    channelId: 'UCAvr-8mY8gR7RMlhvsxnjhA',
    priority: 1,
    description: 'Rio Ferdinand football content',
  },
  // Broadcasters (priority 2)
  {
    name: 'Sky Sports Football',
    channelId: 'UCNAf1k0yIjyGu3k5AunAclg',
    priority: 2,
    description: 'Sky Sports football coverage',
  },
  {
    name: 'BT Sport',
    channelId: 'UC1g9ADA8rNhpQXXpqYnJkOA',
    priority: 2,
    description: 'BT Sport football highlights',
  },
  {
    name: 'ESPN FC',
    channelId: 'UCHxh1JJUq9HjjHFCJRGVplA',
    priority: 2,
    description: 'ESPN football coverage',
  },
  {
    name: 'Copa90',
    channelId: 'UCF1fG3gT44nGTPU2sVLoFWg',
    priority: 2,
    description: 'Football fan culture and stories',
  },
  // Entertainment & Opinion (priority 3)
  {
    name: 'Rabona TV',
    channelId: 'UCrPU8RoQCfl8IfJEPkbsIyA',
    priority: 3,
    description: 'Football entertainment and debate',
  },
  {
    name: 'HITC Sevens',
    channelId: 'UCEoM50lR7mVJbXjBQwsLGzw',
    priority: 3,
    description: 'Football list videos and history',
  },
  {
    name: 'Football Iconic',
    channelId: 'UCRPjxE3dI1OJiH1MxJQrHJw',
    priority: 3,
    description: 'Football stories and retrospectives',
  },
  {
    name: 'Footballers Stories',
    channelId: 'UCIByrCFSV0e0MgNSTiJJz0Q',
    priority: 3,
    description: 'Player biographies and stories',
  },
  {
    name: 'Premier League',
    channelId: 'UCG5qGWdu8nIRZqJ_GgDwQ-w',
    priority: 2,
    description: 'Official Premier League channel',
  },
  {
    name: 'Champions League',
    channelId: 'UCpM5LYQE-63NWQN7FkTcmtg',
    priority: 2,
    description: 'Official UEFA Champions League',
  },
] as const;

export type YouTubeChannel = (typeof YOUTUBE_CHANNELS)[number];
