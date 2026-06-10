/**
 * Map a country (or meta-region like "Europe") to one of six broad regions
 * used for grouping live matches in sidebars.
 */
export type Region = 'Europe' | 'Americas' | 'Asia' | 'Africa' | 'Oceania' | 'International';

const EUROPE = new Set([
  'England', 'Spain', 'Germany', 'Italy', 'France', 'Portugal', 'Netherlands',
  'Belgium', 'Scotland', 'Wales', 'Northern Ireland', 'Republic of Ireland', 'Ireland',
  'Turkey', 'Russia', 'Ukraine', 'Poland', 'Czech Republic', 'Czechia', 'Slovakia',
  'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Cyprus', 'Croatia', 'Serbia',
  'Slovenia', 'Bosnia and Herzegovina', 'Montenegro', 'Albania', 'North Macedonia',
  'Austria', 'Switzerland', 'Denmark', 'Sweden', 'Norway', 'Finland', 'Iceland',
  'Estonia', 'Latvia', 'Lithuania', 'Belarus', 'Moldova', 'Georgia', 'Armenia',
  'Azerbaijan', 'Kazakhstan', 'Luxembourg', 'Malta', 'Andorra', 'San Marino',
  'Liechtenstein', 'Kosovo', 'Faroe Islands', 'Gibraltar', 'Europe',
]);

const AMERICAS = new Set([
  'USA', 'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile',
  'Uruguay', 'Paraguay', 'Peru', 'Colombia', 'Ecuador', 'Bolivia', 'Venezuela',
  'Costa Rica', 'Panama', 'Honduras', 'Guatemala', 'El Salvador', 'Nicaragua',
  'Jamaica', 'Cuba', 'Haiti', 'Dominican Republic', 'Trinidad and Tobago',
  'Americas', 'North America', 'South America', 'CONCACAF', 'CONMEBOL',
]);

const ASIA = new Set([
  'Japan', 'South Korea', 'Korea Republic', 'China', 'China PR', 'Saudi Arabia',
  'UAE', 'United Arab Emirates', 'Qatar', 'Iran', 'Iraq', 'Jordan', 'Lebanon',
  'Syria', 'Israel', 'Palestine', 'Kuwait', 'Bahrain', 'Oman', 'Yemen',
  'India', 'Pakistan', 'Bangladesh', 'Sri Lanka', 'Nepal',
  'Thailand', 'Vietnam', 'Indonesia', 'Malaysia', 'Singapore', 'Philippines',
  'Hong Kong', 'Taiwan', 'Chinese Taipei', 'Mongolia', 'Uzbekistan', 'Turkmenistan',
  'Kyrgyzstan', 'Tajikistan', 'Afghanistan', 'Asia',
]);

const AFRICA = new Set([
  'Egypt', 'Morocco', 'Algeria', 'Tunisia', 'Libya', 'Sudan', 'South Africa',
  'Nigeria', 'Ghana', 'Senegal', 'Ivory Coast', "Cote d'Ivoire", 'Cameroon',
  'Mali', 'Burkina Faso', 'Kenya', 'Uganda', 'Tanzania', 'Ethiopia', 'Rwanda',
  'Zambia', 'Zimbabwe', 'Angola', 'Mozambique', 'DR Congo', 'Congo DR',
  'Democratic Republic of the Congo', 'Congo', 'Gabon', 'Madagascar', 'Mauritius',
  'Africa',
]);

const OCEANIA = new Set([
  'Australia', 'New Zealand', 'Fiji', 'Papua New Guinea', 'Solomon Islands',
  'Vanuatu', 'Samoa', 'Tonga', 'Oceania',
]);

export function countryToRegion(country: string | null | undefined): Region {
  if (!country) return 'International';
  const c = country.trim();
  if (EUROPE.has(c)) return 'Europe';
  if (AMERICAS.has(c)) return 'Americas';
  if (ASIA.has(c)) return 'Asia';
  if (AFRICA.has(c)) return 'Africa';
  if (OCEANIA.has(c)) return 'Oceania';
  return 'International';
}

export const REGION_ORDER: Region[] = [
  'Europe',
  'Americas',
  'Asia',
  'Africa',
  'Oceania',
  'International',
];
