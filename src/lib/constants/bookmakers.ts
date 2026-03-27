export const BOOKMAKER_LOGOS: Record<string, string> = {
  'Bet365': 'https://www.google.com/s2/favicons?domain=bet365.com&sz=32',
  'Bwin': 'https://www.google.com/s2/favicons?domain=bwin.com&sz=32',
  '1xBet': 'https://www.google.com/s2/favicons?domain=1xbet.com&sz=32',
  'Unibet': 'https://www.google.com/s2/favicons?domain=unibet.com&sz=32',
  'William Hill': 'https://www.google.com/s2/favicons?domain=williamhill.com&sz=32',
  'Betfair': 'https://www.google.com/s2/favicons?domain=betfair.com&sz=32',
  'Paddy Power': 'https://www.google.com/s2/favicons?domain=paddypower.com&sz=32',
  'Betway': 'https://www.google.com/s2/favicons?domain=betway.com&sz=32',
  'Coral': 'https://www.google.com/s2/favicons?domain=coral.co.uk&sz=32',
  'Ladbrokes': 'https://www.google.com/s2/favicons?domain=ladbrokes.com&sz=32',
  'Sky Bet': 'https://www.google.com/s2/favicons?domain=skybet.com&sz=32',
  'Marathon Bet': 'https://www.google.com/s2/favicons?domain=marathonbet.com&sz=32',
  'Pinnacle': 'https://www.google.com/s2/favicons?domain=pinnacle.com&sz=32',
  'Betsson': 'https://www.google.com/s2/favicons?domain=betsson.com&sz=32',
  '888sport': 'https://www.google.com/s2/favicons?domain=888sport.com&sz=32',
  'Bet Victor': 'https://www.google.com/s2/favicons?domain=betvictor.com&sz=32',
  'Sportingbet': 'https://www.google.com/s2/favicons?domain=sportingbet.com&sz=32',
  '10Bet': 'https://www.google.com/s2/favicons?domain=10bet.com&sz=32',
  'NordicBet': 'https://www.google.com/s2/favicons?domain=nordicbet.com&sz=32',
  'Bovada': 'https://www.google.com/s2/favicons?domain=bovada.lv&sz=32',
  'DraftKings': 'https://www.google.com/s2/favicons?domain=draftkings.com&sz=32',
  'FanDuel': 'https://www.google.com/s2/favicons?domain=fanduel.com&sz=32',
};

export function getBookmakerLogo(name: string): string | null {
  // Try exact match first, then partial match
  if (BOOKMAKER_LOGOS[name]) return BOOKMAKER_LOGOS[name];
  const key = Object.keys(BOOKMAKER_LOGOS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return key ? BOOKMAKER_LOGOS[key] : null;
}
