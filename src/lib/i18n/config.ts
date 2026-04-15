export const LOCALES = ['en', 'es', 'pt', 'ar', 'de', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  ar: 'العربية',
  de: 'Deutsch',
  fr: 'Français',
};

export const LOCALE_BCP47: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
  ar: 'ar',
  de: 'de-DE',
  fr: 'fr-FR',
};

export const RTL_LOCALES: Locale[] = ['ar'];

// Country → locale mapping. Countries not listed default to 'en'.
export const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es',
  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', IQ: 'ar',
  JO: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar',
  LY: 'ar', SD: 'ar', SY: 'ar', PS: 'ar',
  // German
  DE: 'de', AT: 'de', CH: 'de',
  // French
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr', SN: 'fr', CI: 'fr', CM: 'fr',
  MG: 'fr', BF: 'fr', NE: 'fr', ML: 'fr', TD: 'fr', GN: 'fr', RW: 'fr',
  BJ: 'fr', HT: 'fr', TG: 'fr', CG: 'fr', GA: 'fr',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeForCountry(country?: string | null): Locale {
  if (!country) return DEFAULT_LOCALE;
  return COUNTRY_TO_LOCALE[country.toUpperCase()] || DEFAULT_LOCALE;
}
