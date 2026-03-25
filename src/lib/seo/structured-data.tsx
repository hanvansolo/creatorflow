import { SITE_CONFIG } from './constants';
import type {
  StructuredDataArticle,
  StructuredDataEvent,
  StructuredDataOrganization,
  StructuredDataPerson,
  StructuredDataVideo,
  StructuredDataPlace,
  StructuredDataWebSite,
  StructuredDataBreadcrumb,
} from './types';

/**
 * Base publisher organization for all structured data
 */
export const publisherOrganization: StructuredDataOrganization = {
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}/images/logo.png`,
};

/**
 * Generate WebSite structured data for the root layout
 */
export function generateWebSiteStructuredData(): StructuredDataWebSite {
  return {
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    publisher: publisherOrganization,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Article structured data (JSON-LD)
 */
export function generateArticleStructuredData(params: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  url: string;
}): StructuredDataArticle {
  return {
    '@type': 'NewsArticle',
    headline: params.headline,
    description: params.description,
    image: params.image.startsWith('http') ? params.image : `${SITE_CONFIG.url}${params.image}`,
    datePublished: params.datePublished,
    dateModified: params.dateModified || params.datePublished,
    author: {
      '@type': 'Person',
      name: params.authorName,
    },
    publisher: publisherOrganization,
    mainEntityOfPage: params.url,
  };
}

/**
 * Generate SportsEvent structured data for races
 */
export function generateRaceStructuredData(params: {
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  circuitName: string;
  country: string;
  locality?: string;
}): StructuredDataEvent {
  const location: StructuredDataPlace = {
    '@type': 'Place',
    name: params.circuitName,
    address: {
      '@type': 'PostalAddress',
      addressCountry: params.country,
      addressLocality: params.locality,
    },
  };

  return {
    '@type': 'SportsEvent',
    name: params.name,
    description: params.description,
    startDate: params.startDate,
    endDate: params.endDate,
    location,
    organizer: {
      '@type': 'Organization',
      name: 'Football Association',
      url: 'https://www.fifa.com',
    },
  };
}

/**
 * Generate Person structured data for drivers
 */
export function generateDriverStructuredData(params: {
  name: string;
  nationality: string;
  teamName?: string;
  jobTitle?: string;
  image?: string;
}): StructuredDataPerson {
  const person: StructuredDataPerson = {
    '@type': 'Person',
    name: params.name,
    nationality: params.nationality,
    jobTitle: params.jobTitle || 'Professional Football Player',
    image: params.image,
  };

  if (params.teamName) {
    person.memberOf = {
      '@type': 'SportsTeam',
      name: params.teamName,
    };
  }

  return person;
}

/**
 * Generate SportsTeam structured data
 */
export function generateTeamStructuredData(params: {
  name: string;
  url?: string;
  logo?: string;
  location?: string;
}): StructuredDataOrganization {
  return {
    '@type': 'SportsTeam',
    name: params.name,
    url: params.url,
    logo: params.logo,
    location: params.location,
  };
}

/**
 * Generate VideoObject structured data
 */
export function generateVideoStructuredData(params: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}): StructuredDataVideo {
  return {
    '@type': 'VideoObject',
    name: params.name,
    description: params.description,
    thumbnailUrl: params.thumbnailUrl,
    uploadDate: params.uploadDate,
    duration: params.duration,
    contentUrl: params.contentUrl,
    embedUrl: params.embedUrl,
  };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(
  items: { name: string; url?: string }[]
): StructuredDataBreadcrumb {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SITE_CONFIG.url}${item.url}` : undefined,
    })),
  };
}

/**
 * Generate FAQ structured data for rich results
 */
export function generateFAQStructuredData(
  questions: { question: string; answer: string }[]
): { '@type': 'FAQPage'; mainEntity: object[] } {
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Homepage FAQ content for rich results
 */
export const HOMEPAGE_FAQ = [
  {
    question: 'What is Footy Feed?',
    answer: 'Footy Feed is the smartest way to follow football. We aggregate breaking news from 12+ trusted sources, provide AI-powered match predictions, live scores during matches, player comparisons, tactical deep-dives, and unique What If scenario simulations.',
  },
  {
    question: 'How does Footy Feed aggregate news?',
    answer: 'Footy Feed pulls news from top football sources including BBC Sport, Sky Sports, The Guardian, and official league channels. Our smart deduplication groups related stories and credibility ratings help you identify the most reliable sources.',
  },
  {
    question: 'How accurate are the AI match predictions?',
    answer: 'Our AI predictions use machine learning models trained on team form, head-to-head records, squad strength, and match conditions. Accuracy is tracked across the season so you can see how well our predictions perform.',
  },
  {
    question: 'What is the What If Simulator?',
    answer: 'The What If Simulator lets you explore alternate football realities. Ask questions like "What if Mbappe stayed at PSG?" or "What if VAR was removed?" and get AI-powered analysis considering team dynamics, player strengths, and historical precedents.',
  },
  {
    question: 'Does Footy Feed have live scores?',
    answer: 'Yes! During matches, Footy Feed provides real-time scores, goal alerts, match events, minute-by-minute updates, and live league table changes with beautiful visualizations.',
  },
  {
    question: 'Is Footy Feed free to use?',
    answer: 'Footy Feed offers free access to news, league tables, fixtures, player profiles, and many features. Some advanced features may require registration.',
  },
];

/**
 * Wrap structured data in JSON-LD format with @context
 */
export function jsonLd<T extends { '@type': string }>(data: T): object {
  return {
    '@context': 'https://schema.org',
    ...data,
  };
}

/**
 * Wrap multiple structured data items
 */
export function jsonLdMultiple<T extends { '@type': string }>(items: T[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': items,
  };
}

/**
 * JSON-LD script component props
 */
interface JsonLdScriptProps {
  data: object;
}

/**
 * Render JSON-LD script tag as a React component
 */
export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
