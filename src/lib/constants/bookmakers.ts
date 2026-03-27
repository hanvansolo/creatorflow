// Bookmaker logos — using logo.clearbit.com for high-quality logos
// Falls back to Google favicon if Clearbit doesn't have it
export const BOOKMAKER_LOGOS: Record<string, string> = {
  'Bet365': 'https://logo.clearbit.com/bet365.com',
  'Bwin': 'https://logo.clearbit.com/bwin.com',
  '1xBet': 'https://logo.clearbit.com/1xbet.com',
  'Unibet': 'https://logo.clearbit.com/unibet.com',
  'William Hill': 'https://logo.clearbit.com/williamhill.com',
  'Betfair': 'https://logo.clearbit.com/betfair.com',
  'Paddy Power': 'https://logo.clearbit.com/paddypower.com',
  'Betway': 'https://logo.clearbit.com/betway.com',
  'Coral': 'https://logo.clearbit.com/coral.co.uk',
  'Ladbrokes': 'https://logo.clearbit.com/ladbrokes.com',
  'Sky Bet': 'https://logo.clearbit.com/skybet.com',
  'Marathon Bet': 'https://logo.clearbit.com/marathonbet.com',
  'Marathonbet': 'https://logo.clearbit.com/marathonbet.com',
  'Pinnacle': 'https://logo.clearbit.com/pinnacle.com',
  'Betsson': 'https://logo.clearbit.com/betsson.com',
  '888sport': 'https://logo.clearbit.com/888sport.com',
  'Bet Victor': 'https://logo.clearbit.com/betvictor.com',
  'BetVictor': 'https://logo.clearbit.com/betvictor.com',
  'Sportingbet': 'https://logo.clearbit.com/sportingbet.com',
  '10Bet': 'https://logo.clearbit.com/10bet.com',
  'NordicBet': 'https://logo.clearbit.com/nordicbet.com',
  'Bovada': 'https://logo.clearbit.com/bovada.lv',
  'DraftKings': 'https://logo.clearbit.com/draftkings.com',
  'FanDuel': 'https://logo.clearbit.com/fanduel.com',
  'Betano': 'https://logo.clearbit.com/betano.com',
  'Betclic': 'https://logo.clearbit.com/betclic.com',
  'Betfred': 'https://logo.clearbit.com/betfred.com',
  'BoyleSports': 'https://logo.clearbit.com/boylesports.com',
  'Spreadex': 'https://logo.clearbit.com/spreadex.com',
  'BetMGM': 'https://logo.clearbit.com/betmgm.com',
  'PointsBet': 'https://logo.clearbit.com/pointsbet.com',
  'Sportsbet': 'https://logo.clearbit.com/sportsbet.com.au',
  'TAB': 'https://logo.clearbit.com/tab.com.au',
  'Betis': 'https://logo.clearbit.com/betus.com.pa',
  'Sporting Index': 'https://logo.clearbit.com/sportingindex.com',
  'Dunnbet': 'https://logo.clearbit.com/dunnbet.com',
};

export function getBookmakerLogo(name: string): string | null {
  if (BOOKMAKER_LOGOS[name]) return BOOKMAKER_LOGOS[name];
  // Partial match
  const key = Object.keys(BOOKMAKER_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  if (key) return BOOKMAKER_LOGOS[key];
  // Last resort — try Clearbit with the name directly
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `https://logo.clearbit.com/${domain}`;
}
