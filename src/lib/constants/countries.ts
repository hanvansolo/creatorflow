// Map nationality names to ISO 3166-1 alpha-2 country codes
export const NATIONALITY_TO_COUNTRY_CODE: Record<string, string> = {
  'American': 'US',
  'Argentine': 'AR',
  'Australian': 'AU',
  'Austrian': 'AT',
  'Belgian': 'BE',
  'Brazilian': 'BR',
  'British': 'GB',
  'Canadian': 'CA',
  'Chinese': 'CN',
  'Colombian': 'CO',
  'Danish': 'DK',
  'Dutch': 'NL',
  'Finnish': 'FI',
  'French': 'FR',
  'German': 'DE',
  'Indian': 'IN',
  'Indonesian': 'ID',
  'Italian': 'IT',
  'Japanese': 'JP',
  'Mexican': 'MX',
  'Monegasque': 'MC',
  'New Zealand': 'NZ',
  'New Zealander': 'NZ',
  'Polish': 'PL',
  'Portuguese': 'PT',
  'Russian': 'RU',
  'South African': 'ZA',
  'Spanish': 'ES',
  'Swedish': 'SE',
  'Swiss': 'CH',
  'Thai': 'TH',
  'Venezuelan': 'VE',
};

// Convert ISO country code to flag emoji
// Uses regional indicator symbols (Unicode)
export function countryCodeToFlag(countryCode: string): string {
  const code = countryCode.toUpperCase();
  // Regional indicator symbols start at U+1F1E6 for 'A'
  const offset = 0x1F1E6 - 65; // 65 is char code for 'A'
  return String.fromCodePoint(
    code.charCodeAt(0) + offset,
    code.charCodeAt(1) + offset
  );
}

// Convert nationality to flag emoji
export function nationalityToFlag(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  const countryCode = NATIONALITY_TO_COUNTRY_CODE[nationality];
  if (!countryCode) return null;
  return countryCodeToFlag(countryCode);
}

// Get country code from nationality
export function getCountryCode(nationality: string | null | undefined): string | null {
  if (!nationality) return null;
  return NATIONALITY_TO_COUNTRY_CODE[nationality] || null;
}
