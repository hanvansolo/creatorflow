export type OddsFormat = 'decimal' | 'fractional' | 'american';

// Convert decimal odds (e.g. "2.50") to fractional (e.g. "3/2")
export function decimalToFractional(decimal: string | number): string {
  const dec = parseFloat(String(decimal));
  if (isNaN(dec) || dec <= 1) return String(decimal);

  const numerator = dec - 1;
  // Find the closest simple fraction
  const tolerance = 0.01;
  let bestNum = 1, bestDen = 1, bestDiff = Math.abs(numerator - 1);

  for (let den = 1; den <= 100; den++) {
    const num = Math.round(numerator * den);
    const diff = Math.abs(numerator - num / den);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestNum = num;
      bestDen = den;
      if (diff < tolerance) break;
    }
  }

  // Simplify with GCD
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const g = gcd(bestNum, bestDen);
  return `${bestNum / g}/${bestDen / g}`;
}

// Convert decimal odds to American (e.g. 2.50 -> "+150", 1.50 -> "-200")
export function decimalToAmerican(decimal: string | number): string {
  const dec = parseFloat(String(decimal));
  if (isNaN(dec) || dec <= 1) return String(decimal);

  if (dec >= 2) {
    return `+${Math.round((dec - 1) * 100)}`;
  } else {
    return `-${Math.round(100 / (dec - 1))}`;
  }
}

export function formatOdds(decimal: string | number, format: OddsFormat): string {
  if (format === 'fractional') return decimalToFractional(decimal);
  if (format === 'american') return decimalToAmerican(decimal);
  return parseFloat(String(decimal)).toFixed(2);
}
