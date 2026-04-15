import { en, type Dictionary } from './en';
import { es } from './es';
import { pt } from './pt';
import { ar } from './ar';
import { de } from './de';
import { fr } from './fr';
import type { Locale } from '../config';

const DICTIONARIES: Record<Locale, Dictionary> = { en, es, pt, ar, de, fr };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] || en;
}

export type { Dictionary };
