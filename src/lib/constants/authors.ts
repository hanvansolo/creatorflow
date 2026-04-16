export interface Author {
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  specialities: string[];
}

export const AUTHORS: Author[] = [
  {
    slug: 'james-whitfield',
    name: 'James Whitfield',
    role: 'Senior Football Writer',
    bio: 'James has covered English football for over a decade, with a focus on the Premier League and EFL. Known for breaking down complex tactical shifts into clear, readable analysis.',
    avatar: '/authors/james-whitfield.svg',
    specialities: ['Premier League', 'EFL', 'FA Cup', 'English football'],
  },
  {
    slug: 'sofia-martinez',
    name: 'Sofia Martínez',
    role: 'European Football Correspondent',
    bio: 'Sofia reports on La Liga, Serie A, and European competition. Fluent in four languages, she brings an insider perspective on transfers and tactics across the continent.',
    avatar: '/authors/sofia-martinez.svg',
    specialities: ['La Liga', 'Serie A', 'Champions League', 'Europa League', 'transfers'],
  },
  {
    slug: 'marcus-chen',
    name: 'Marcus Chen',
    role: 'Premier League Analyst',
    bio: 'Marcus combines data-driven analysis with tactical insight. He covers match predictions, player performance metrics, and the numbers behind the headlines.',
    avatar: '/authors/marcus-chen.svg',
    specialities: ['predictions', 'statistics', 'Premier League', 'Bundesliga'],
  },
  {
    slug: 'priya-sharma',
    name: 'Priya Sharma',
    role: 'Transfer News Editor',
    bio: 'Priya tracks every deal, rumour, and contract negotiation across world football. She cuts through the noise to report only what stands up to scrutiny.',
    avatar: '/authors/priya-sharma.svg',
    specialities: ['transfers', 'rumour', 'contracts', 'breaking news'],
  },
  {
    slug: 'tom-obrien',
    name: "Tom O'Brien",
    role: 'Live Coverage & Match Reports',
    bio: "Tom is the voice behind Footy Feed's live match coverage. From kickoff alerts to full-time reports, he delivers the action as it happens.",
    avatar: '/authors/tom-obrien.svg',
    specialities: ['match reports', 'live scores', 'World Cup', 'international'],
  },
];

/**
 * Pick an author for an article based on content signals.
 * Uses a deterministic hash of the title so the same article always gets
 * the same author (even on respin). Falls back to round-robin if no
 * speciality matches.
 */
export function pickAuthor(title: string, tags?: string[] | null, credibilityRating?: string | null): Author {
  const text = `${title} ${(tags || []).join(' ')} ${credibilityRating || ''}`.toLowerCase();

  // Try to match by speciality
  for (const author of AUTHORS) {
    for (const spec of author.specialities) {
      if (text.includes(spec.toLowerCase())) {
        return author;
      }
    }
  }

  // Deterministic fallback: hash the title to pick consistently
  const hash = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AUTHORS[hash % AUTHORS.length];
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS.find(a => a.slug === slug);
}
