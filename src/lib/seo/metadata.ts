// @ts-nocheck
import type { Metadata } from 'next';
import { SITE_CONFIG, DEFAULT_METADATA } from './constants';
import type {
  SEOMetadata,
  ArticleMetadata,
  RaceMetadata,
  DriverMetadata,
  TeamMetadata,
  CircuitMetadata,
  VideoMetadata,
} from './types';

/**
 * Generate base metadata with common fields
 */
export function generateBaseMetadata(seo: SEOMetadata): Metadata {
  // Truncate title to 48 chars at word boundary (leaves room for " | Footy Feed" suffix)
  let title = seo.title;
  if (title.length > 48) {
    title = title.slice(0, 48).replace(/\s+\S*$/, '');
    // Ensure we didn't trim too aggressively
    if (title.length < 30) title = seo.title.slice(0, 48);
  }
  // Truncate description to 155 chars at a word boundary
  let description = seo.description;
  if (description.length > 155) {
    description = description.slice(0, 155).replace(/\s+\S*$/, '') + '...';
  }
  const rawImage = seo.image || '/api/og/default';
  // Ensure absolute URL for OG/Twitter — relative URLs don't work for social crawlers
  const image = rawImage.startsWith('http') ? rawImage : `${SITE_CONFIG.url}${rawImage}`;
  const imageAlt = seo.imageAlt || seo.title;

  return {
    title,
    description,
    keywords: seo.tags,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
    },
    robots: seo.noIndex ? { index: false, follow: false } : undefined,
  };
}

/**
 * Generate article metadata for news articles and deep dives
 */
export function generateArticleMetadata(article: ArticleMetadata): Metadata {
  const baseMetadata = generateBaseMetadata(article);

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'article',
      publishedTime: article.publishedTime,
      modifiedTime: article.modifiedTime,
      authors: [article.author],
      section: article.section,
      tags: article.tags,
    },
  };
}

/**
 * Generate race/event metadata
 */
export function generateRaceMetadata(race: RaceMetadata): Metadata {
  const title = `${race.raceName} - ${race.season} Football`;
  const description =
    race.description ||
    `${race.raceName} at ${race.circuitName} in ${race.country}. Round ${race.round} of the ${race.season} season. Full schedule, match times, venue guide, and match preview.`;

  return generateBaseMetadata({
    title,
    description,
    image: race.image,
    tags: [
      race.raceName,
      race.circuitName,
      race.country,
      'football',
      'soccer',
      `${race.season} football`,
      'match',
    ],
  });
}

/**
 * Generate driver profile metadata
 */
export function generateDriverMetadata(driver: DriverMetadata): Metadata {
  const fullName = `${driver.firstName} ${driver.lastName}`;
  const title = `${fullName} - Player Profile`;
  const description =
    driver.description ||
    `${fullName} football player profile with career statistics, goals, assists, and trophy history. ${driver.nationality} player${driver.team ? ` currently playing for ${driver.team} in the ${new Date().getFullYear()} season` : ''}.`;

  return generateBaseMetadata({
    title,
    description,
    image: driver.image,
    tags: [fullName, driver.nationality, driver.team || '', 'football player', 'soccer'].filter(
      Boolean
    ) as string[],
  });
}

/**
 * Generate team profile metadata
 */
export function generateTeamMetadata(team: TeamMetadata): Metadata {
  const title = `${team.teamName} - Football Club Profile`;
  const description =
    team.description ||
    `${team.fullName} football club profile with current squad, league standings, match results, and performance history. ${team.nationality} club based in ${team.baseLocation}.`;

  return generateBaseMetadata({
    title,
    description,
    image: team.image,
    tags: [team.teamName, team.fullName, team.nationality, 'football club', 'soccer', 'team profile'],
  });
}

/**
 * Generate circuit/track metadata
 */
export function generateCircuitMetadata(circuit: CircuitMetadata): Metadata {
  const title = `${circuit.circuitName} - Stadium Guide`;
  const description =
    circuit.description ||
    `${circuit.officialName} football stadium guide. Located in ${circuit.location}, ${circuit.country}. Stadium layout, capacity, facilities, weather conditions, and complete match history.`;

  return generateBaseMetadata({
    title,
    description,
    image: circuit.image,
    tags: [
      circuit.circuitName,
      circuit.officialName,
      circuit.country,
      circuit.location,
      'football stadium',
      'football ground',
      'venue',
    ],
  });
}

/**
 * Generate video metadata
 */
export function generateVideoMetadata(video: VideoMetadata): Metadata {
  const baseMetadata = generateBaseMetadata({
    title: video.title,
    description: video.description,
    image: video.thumbnailUrl,
    tags: video.tags,
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'video.other',
      videos: [
        {
          url: video.videoUrl,
          width: 1280,
          height: 720,
          type: 'text/html',
        },
      ],
    },
  };
}

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}

/**
 * Generate alternates with canonical URL
 */
export function generateAlternates(path: string) {
  return {
    canonical: getCanonicalUrl(path),
  };
}

/**
 * Create static page metadata
 */
export function createPageMetadata(
  title: string,
  description: string,
  path: string,
  additionalKeywords?: string[]
): Metadata {
  return {
    ...generateBaseMetadata({
      title,
      description,
      tags: additionalKeywords,
    }),
    alternates: generateAlternates(path),
  };
}
