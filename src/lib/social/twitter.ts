const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.footy-feed.com';

// In-memory token cache (refreshed when expired)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Get a valid OAuth 2.0 User Access Token.
 * Auto-refreshes using the refresh token when expired.
 */
async function getRefreshToken(): Promise<string | null> {
  // First try DB (where we store rotated tokens)
  try {
    const { db, siteSettings } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');
    const [row] = await db.select({ value: siteSettings.value })
      .from(siteSettings).where(eq(siteSettings.key, 'twitter_refresh_token')).limit(1);
    if (row?.value) {
      console.log('[Twitter] Using refresh token from DB');
      return row.value;
    }
  } catch (e) {
    console.error('[Twitter] Failed to read refresh token from DB:', (e as Error).message);
  }
  // Fall back to env var
  return process.env.TWITTER_REFRESH_TOKEN || null;
}

async function getAccessToken(): Promise<string | null> {
  // Use cached token if still valid (with 5 min buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 300_000) {
    return cachedToken;
  }

  const refreshToken = await getRefreshToken();
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_PASS;

  // If we have a refresh token, use it to get a fresh access token
  if (refreshToken && clientId) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      if (clientSecret) {
        headers['Authorization'] = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
      }

      const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers,
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }).toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const data = await res.json();
        cachedToken = data.access_token;
        tokenExpiresAt = Date.now() + (data.expires_in * 1000);

        // Update refresh token if a new one was issued
        if (data.refresh_token && data.refresh_token !== refreshToken) {
          // Store new refresh token in DB for persistence across deploys
          try {
            const { db, siteSettings } = await import('@/lib/db');
            await db.insert(siteSettings).values({
              key: 'twitter_refresh_token',
              value: data.refresh_token,
              updatedAt: new Date(),
            }).onConflictDoUpdate({
              target: siteSettings.key,
              set: { value: data.refresh_token, updatedAt: new Date() },
            });
            console.log('[Twitter] Stored new refresh token in DB');
          } catch (e) {
            console.error('[Twitter] Failed to store refresh token:', e);
          }
        }

        console.log(`[Twitter] Token refreshed, expires in ${data.expires_in}s`);
        return cachedToken;
      }

      const errText = await res.text();
      console.error(`[Twitter] Token refresh failed ${res.status}: ${errText}`);
    } catch (e) {
      console.error('[Twitter] Token refresh error:', (e as Error).message);
    }
  }

  // Fall back to the static token from env
  const staticToken = process.env.TWITTER_OAUTH2_TOKEN;
  if (staticToken) {
    cachedToken = staticToken;
    tokenExpiresAt = Date.now() + 7200_000; // Assume 2h
    return staticToken;
  }

  return null;
}

// Known football hashtags for players, clubs, and competitions
const DRIVER_HASHTAGS: Record<string, string> = {
  'haaland': '#Haaland', 'erling': '#Haaland',
  'mbappe': '#Mbappe', 'kylian': '#Mbappe',
  'salah': '#Salah', 'mohamed': '#Salah',
  'bellingham': '#Bellingham', 'jude': '#Bellingham',
  'vinicius': '#Vinicius', 'vini': '#Vinicius',
  'saka': '#Saka', 'bukayo': '#Saka',
  'palmer': '#Palmer', 'cole': '#Palmer',
  'foden': '#Foden', 'phil': '#Foden',
  'yamal': '#Yamal', 'lamine': '#Yamal',
  'messi': '#Messi', 'lionel': '#Messi',
  'ronaldo': '#Ronaldo', 'cristiano': '#Ronaldo',
  'kane': '#Kane', 'harry': '#Kane',
  'de bruyne': '#DeBruyne', 'kevin': '#DeBruyne',
  'pedri': '#Pedri', 'gavi': '#Gavi',
  'rice': '#Rice', 'declan': '#Rice',
  'odegaard': '#Odegaard', 'martin': '#Odegaard',
  'bruno fernandes': '#BrunoFernandes',
  'son': '#Son', 'heung-min': '#Son',
  'guardiola': '#Guardiola', 'pep': '#Guardiola',
  'arteta': '#Arteta', 'klopp': '#Klopp',
  'ancelotti': '#Ancelotti', 'mourinho': '#Mourinho',
};

const TEAM_HASHTAGS: Record<string, string> = {
  'manchester city': '#ManCity', 'man city': '#ManCity',
  'arsenal': '#Arsenal', 'gunners': '#Arsenal',
  'liverpool': '#Liverpool', 'reds': '#Liverpool',
  'manchester united': '#MUFC', 'man united': '#MUFC',
  'chelsea': '#Chelsea', 'blues': '#Chelsea',
  'tottenham': '#Spurs', 'spurs': '#Spurs',
  'real madrid': '#RealMadrid', 'madrid': '#RealMadrid',
  'barcelona': '#Barcelona', 'barca': '#Barcelona',
  'bayern': '#FCBayern', 'munich': '#FCBayern',
  'psg': '#PSG', 'paris': '#PSG',
  'juventus': '#Juventus', 'juve': '#Juventus',
  'inter milan': '#Inter', 'inter': '#Inter',
  'ac milan': '#ACMilan', 'milan': '#ACMilan',
  'napoli': '#Napoli', 'dortmund': '#BVB',
  'newcastle': '#NUFC', 'aston villa': '#AVFC',
  'west ham': '#WHUFC', 'brighton': '#BHAFC',
};

const GP_HASHTAGS: Record<string, string> = {
  'premier league': '#PremierLeague', 'epl': '#PremierLeague',
  'champions league': '#UCL', 'ucl': '#UCL',
  'europa league': '#UEL', 'uel': '#UEL',
  'la liga': '#LaLiga', 'serie a': '#SerieA',
  'bundesliga': '#Bundesliga', 'ligue 1': '#Ligue1',
  'fa cup': '#FACup', 'league cup': '#CarabaoCup',
  'world cup': '#WorldCup', 'euro': '#EURO',
  'copa america': '#CopaAmerica', 'nations league': '#NationsLeague',
  'community shield': '#CommunityShield',
  'super cup': '#SuperCup', 'club world cup': '#ClubWorldCup',
  'carabao cup': '#CarabaoCup',
};

// Generic football topic hashtags as fallback
const TOPIC_HASHTAGS: Record<string, string> = {
  'transfer': '#TransferNews', 'signing': '#TransferNews', 'contract': '#TransferNews',
  'var': '#VAR', 'referee': '#VAR', 'offside': '#VAR',
  'injury': '#InjuryUpdate', 'injured': '#InjuryUpdate', 'fitness': '#InjuryUpdate',
  'tactics': '#FootballTactics', 'formation': '#FootballTactics', 'pressing': '#FootballTactics',
  'goal': '#Goals', 'hat trick': '#HatTrick', 'hat-trick': '#HatTrick',
  'penalty': '#Penalty', 'red card': '#RedCard', 'yellow card': '#YellowCard',
  'clean sheet': '#CleanSheet', 'shutout': '#CleanSheet',
  'derby': '#Derby', 'rivalry': '#Derby',
  'relegation': '#Relegation', 'promoted': '#Promotion', 'promotion': '#Promotion',
  'golden boot': '#GoldenBoot', 'top scorer': '#GoldenBoot',
  'manager': '#ManagerNews', 'sacked': '#ManagerNews', 'appointed': '#ManagerNews',
  'pre-season': '#PreSeason', 'friendly': '#PreSeason',
  'youth': '#YouthFootball', 'academy': '#Academy',
  'record': '#FootballRecord', 'historic': '#FootballHistory', 'history': '#FootballHistory',
  'retirement': '#Retirement', 'farewell': '#Farewell',
};

function buildHashtags(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  const hashtags: string[] = [];
  const seen = new Set<string>();

  function add(tag: string) {
    const lower = tag.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      hashtags.push(tag);
    }
  }

  // Match GPs first (most specific)
  for (const [keyword, tag] of Object.entries(GP_HASHTAGS)) {
    if (text.includes(keyword)) { add(tag); break; }
  }

  // Match drivers (allow short names like "max", "spa" etc)
  for (const [keyword, tag] of Object.entries(DRIVER_HASHTAGS)) {
    if (hashtags.length >= 4) break;
    // For short keywords (3-4 chars), require word boundary match
    if (keyword.length <= 4) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) add(tag);
    } else {
      if (text.includes(keyword)) add(tag);
    }
  }

  // Match teams
  for (const [keyword, tag] of Object.entries(TEAM_HASHTAGS)) {
    if (hashtags.length >= 4) break;
    if (text.includes(keyword)) add(tag);
  }

  // If we still only have #Football or nothing, try topic hashtags
  if (hashtags.length === 0) {
    for (const [keyword, tag] of Object.entries(TOPIC_HASHTAGS)) {
      if (hashtags.length >= 3) break;
      if (text.includes(keyword)) add(tag);
    }
  }

  // Always add #Football
  add('#Football');

  // If we only have #Football, extract a word from the title as fallback
  if (hashtags.length === 1) {
    // Use the article tags if available
    const cleanTags = (tags || [])
      .map(t => t.replace(/[^a-zA-Z0-9]/g, ''))
      .filter(t => t.length >= 4 && t.length <= 18 && t.toLowerCase() !== 'football');

    for (const t of cleanTags.slice(0, 2)) {
      add(`#${t}`);
    }
  }

  return hashtags.join(' ');
}

/**
 * Post to Twitter/X with headline, link, and auto-tags.
 * Uses OAuth 2.0 User Context with auto-refresh.
 * The article URL auto-generates a Twitter Card with the image from OG tags.
 */
export async function postToTwitter(
  title: string,
  slug: string,
  tags?: string[],
  imageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();

  if (!token) {
    return { success: false, error: 'Twitter credentials not configured. Set TWITTER_OAUTH2_TOKEN and TWITTER_REFRESH_TOKEN.' };
  }

  try {
    const url = `${SITE_URL}/news/${slug}`;
    const hashtags = buildHashtags(title, tags || []);

    let text = `${title}\n\n${url}\n\n${hashtags}`;
    if (text.length > 280) {
      const maxTitle = 280 - url.length - hashtags.length - 6;
      text = `${title.slice(0, maxTitle)}...\n\n${url}\n\n${hashtags}`;
    }

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await res.text();
    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    // If token expired, clear cache and retry once
    if (res.status === 401 || res.status === 403) {
      cachedToken = null;
      tokenExpiresAt = 0;

      const freshToken = await getAccessToken();
      if (freshToken && freshToken !== token) {
        // Retry with fresh token
        const retryRes = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${freshToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
          signal: AbortSignal.timeout(15000),
        });

        const retryText = await retryRes.text();
        let retryData;
        try { retryData = JSON.parse(retryText); } catch { retryData = { raw: retryText }; }

        if (retryRes.ok && retryData.data?.id) {
          console.log(`[Twitter] Posted tweet ${retryData.data.id} (after token refresh)`);
          return { success: true, id: retryData.data.id };
        }
      }
    }

    if (res.ok && data.data?.id) {
      console.log(`[Twitter] Posted tweet ${data.data.id}`);
      return { success: true, id: data.data.id };
    }

    return {
      success: false,
      error: `${res.status}: ${data.detail || data.title || data.errors?.[0]?.message || responseText.slice(0, 200)}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

/**
 * Post a custom tweet with exact text (no auto-formatting).
 * Used for kickoff alerts, goal alerts, etc.
 */
export async function postCustomTweet(
  text: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Twitter credentials not configured' };
  }

  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text.slice(0, 280) }),
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await res.text();
    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (res.ok && data.data?.id) {
      console.log(`[Twitter] Custom tweet posted: ${data.data.id}`);
      return { success: true, id: data.data.id };
    }

    return {
      success: false,
      error: `${res.status}: ${data.detail || data.title || data.errors?.[0]?.message || responseText.slice(0, 200)}`,
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
