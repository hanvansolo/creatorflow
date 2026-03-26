// @ts-nocheck
export interface SEOMetadata {
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
}

export interface ArticleMetadata extends SEOMetadata {
  publishedTime: string;
  modifiedTime?: string;
  author: string;
  section: string;
  tags: string[];
}

export interface RaceMetadata extends SEOMetadata {
  raceName: string;
  circuitName: string;
  country: string;
  raceDate: string;
  round: number;
  season: number;
}

export interface DriverMetadata extends SEOMetadata {
  firstName: string;
  lastName: string;
  nationality: string;
  team?: string;
  driverNumber?: number;
}

export interface TeamMetadata extends SEOMetadata {
  teamName: string;
  fullName: string;
  nationality: string;
  baseLocation: string;
}

export interface CircuitMetadata extends SEOMetadata {
  circuitName: string;
  officialName: string;
  country: string;
  location: string;
}

export interface VideoMetadata extends SEOMetadata {
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  uploadDate: string;
}

// JSON-LD Structured Data Types
export interface StructuredDataPerson {
  '@type': 'Person';
  name: string;
  nationality?: string;
  jobTitle?: string;
  memberOf?: StructuredDataOrganization;
  image?: string;
}

export interface StructuredDataOrganization {
  '@type': 'Organization' | 'SportsTeam';
  name: string;
  url?: string;
  logo?: string;
  location?: string;
}

export interface StructuredDataEvent {
  '@type': 'SportsEvent';
  name: string;
  startDate: string;
  endDate?: string;
  location: StructuredDataPlace;
  organizer?: StructuredDataOrganization;
  description?: string;
}

export interface StructuredDataPlace {
  '@type': 'Place';
  name: string;
  address: {
    '@type': 'PostalAddress';
    addressCountry: string;
    addressLocality?: string;
  };
}

export interface StructuredDataArticle {
  '@type': 'NewsArticle' | 'Article';
  headline: string;
  description: string;
  image: string | string[];
  datePublished: string;
  dateModified?: string;
  author: StructuredDataPerson | StructuredDataOrganization;
  publisher: StructuredDataOrganization;
  mainEntityOfPage: string;
}

export interface StructuredDataVideo {
  '@type': 'VideoObject';
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}

export interface StructuredDataWebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  publisher: StructuredDataOrganization;
  potentialAction?: {
    '@type': 'SearchAction';
    target: {
      '@type': 'EntryPoint';
      urlTemplate: string;
    };
    'query-input': string;
  };
}

export interface StructuredDataBreadcrumb {
  '@type': 'BreadcrumbList';
  itemListElement: {
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }[];
}

export type ContentType =
  | 'news'
  | 'race'
  | 'driver'
  | 'team'
  | 'circuit'
  | 'video'
  | 'deep-dive'
  | 'what-if'
  | 'regulation'
  | 'standings'
  | 'prediction'
  | 'live';
