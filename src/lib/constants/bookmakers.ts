// Bookmaker logos — using Google's high-res favicon service (128px)
function gfav(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export const BOOKMAKER_LOGOS: Record<string, string> = {
  'Bet365': gfav('bet365.com'),
  'Bwin': gfav('bwin.com'),
  '1xBet': gfav('1xbet.com'),
  'Unibet': gfav('unibet.com'),
  'William Hill': gfav('williamhill.com'),
  'Betfair': gfav('betfair.com'),
  'Paddy Power': gfav('paddypower.com'),
  'Betway': gfav('betway.com'),
  'Coral': gfav('coral.co.uk'),
  'Ladbrokes': gfav('ladbrokes.com'),
  'Sky Bet': gfav('skybet.com'),
  'Marathon Bet': gfav('marathonbet.com'),
  'Marathonbet': gfav('marathonbet.com'),
  'Pinnacle': gfav('pinnacle.com'),
  'Betsson': gfav('betsson.com'),
  '888sport': gfav('888sport.com'),
  'Bet Victor': gfav('betvictor.com'),
  'BetVictor': gfav('betvictor.com'),
  'Sportingbet': gfav('sportingbet.com'),
  '10Bet': gfav('10bet.com'),
  'NordicBet': gfav('nordicbet.com'),
  'Bovada': gfav('bovada.lv'),
  'DraftKings': gfav('draftkings.com'),
  'FanDuel': gfav('fanduel.com'),
  'Betano': gfav('betano.com'),
  'Betclic': gfav('betclic.com'),
  'Betfred': gfav('betfred.com'),
  'BoyleSports': gfav('boylesports.com'),
  'Spreadex': gfav('spreadex.com'),
  'BetMGM': gfav('betmgm.com'),
  'PointsBet': gfav('pointsbet.com'),
  'Sportsbet': gfav('sportsbet.com.au'),
  'Sporting Index': gfav('sportingindex.com'),
  'Dunnbet': gfav('dunnbet.com'),
};

export function getBookmakerLogo(name: string): string {
  if (BOOKMAKER_LOGOS[name]) return BOOKMAKER_LOGOS[name];
  const key = Object.keys(BOOKMAKER_LOGOS).find(k =>
    name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())
  );
  if (key) return BOOKMAKER_LOGOS[key];
  // Fallback — try Google favicon with cleaned name
  const domain = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return gfav(domain);
}
