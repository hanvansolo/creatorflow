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
  'arteta': '#Arteta', 'klopp': '#Klopp', 'slot': '#Slot',
  'ancelotti': '#Ancelotti', 'mourinho': '#Mourinho',
  'madueke': '#Madueke', 'noni': '#Madueke',
  'raphinha': '#Raphinha',
  'wirtz': '#Wirtz', 'florian': '#Wirtz',
  'lewandowski': '#Lewandowski',
  'neymar': '#Neymar',
  'alexander-arnold': '#TAA', 'trent': '#TAA',
  'van dijk': '#VanDijk', 'virgil': '#VanDijk',
  'martinez': '#Martinez',
  'grealish': '#Grealish', 'jack': '#Grealish',
  'rashford': '#Rashford', 'marcus': '#Rashford',
  'osimhen': '#Osimhen',
  'xhaka': '#Xhaka', 'granit': '#Xhaka',
  'modric': '#Modric', 'luka': '#Modric',
  'rodri': '#Rodri',
  'szoboszlai': '#Szoboszlai',
  'caicedo': '#Caicedo',
  'isak': '#Isak', 'alexander': '#Isak',
  'watkins': '#Watkins', 'ollie': '#Watkins',
  'gordon': '#Gordon', 'anthony': '#Gordon',
  'gyokeres': '#Gyokeres', 'viktor': '#Gyokeres',
  'kvaratskhelia': '#Kvaratskhelia', 'kvara': '#Kvaratskhelia',
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
  'mls': '#MLS', 'liga mx': '#LigaMX',
  'eredivisie': '#Eredivisie', 'primeira liga': '#PrimeiraLiga',
  'scottish': '#SPFL', 'championship': '#EFLChampionship',
  'saudi': '#SaudiProLeague',
  // Countries for internationals
  'england': '#England', 'france': '#France', 'germany': '#Germany',
  'spain': '#Spain', 'italy': '#Italy', 'brazil': '#Brazil',
  'argentina': '#Argentina', 'portugal': '#Portugal', 'netherlands': '#Netherlands',
  'belgium': '#Belgium', 'uruguay': '#Uruguay', 'colombia': '#Colombia',
  'mexico': '#Mexico', 'usa': '#USMNT', 'japan': '#Japan',
  'south korea': '#SouthKorea', 'morocco': '#Morocco', 'senegal': '#Senegal',
  'nigeria': '#Nigeria', 'ghana': '#Ghana', 'cameroon': '#Cameroon',
  'switzerland': '#Switzerland', 'croatia': '#Croatia', 'denmark': '#Denmark',
  'sweden': '#Sweden', 'norway': '#Norway', 'scotland': '#Scotland',
  'wales': '#Wales', 'ireland': '#Ireland', 'poland': '#Poland',
  'turkey': '#Turkey', 'austria': '#Austria', 'czech': '#CzechRepublic',
  'serbia': '#Serbia', 'ukraine': '#Ukraine', 'egypt': '#Egypt',
  'australia': '#Socceroos', 'canada': '#CanMNT',
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

export function buildHashtags(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(' ')}`.toLowerCase();
  const hashtags: string[] = [];
  const seen = new Set<string>();

  function add(tag: string) {
    if (hashtags.length >= 5) return;
    const lower = tag.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      hashtags.push(tag);
    }
  }

  // 1. Match known competitions
  for (const [keyword, tag] of Object.entries(GP_HASHTAGS)) {
    if (text.includes(keyword)) { add(tag); break; }
  }

  // 2. Match known players
  for (const [keyword, tag] of Object.entries(DRIVER_HASHTAGS)) {
    if (hashtags.length >= 4) break;
    if (keyword.length <= 4) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(text)) add(tag);
    } else {
      if (text.includes(keyword)) add(tag);
    }
  }

  // 3. Match known clubs
  for (const [keyword, tag] of Object.entries(TEAM_HASHTAGS)) {
    if (hashtags.length >= 4) break;
    if (text.includes(keyword)) add(tag);
  }

  // 4. Match topics
  for (const [keyword, tag] of Object.entries(TOPIC_HASHTAGS)) {
    if (hashtags.length >= 4) break;
    if (text.includes(keyword)) add(tag);
  }

  // 5. SMART FALLBACK: Convert article tags into hashtags
  // RSS tags often contain team names, player names, and topics
  if (hashtags.length < 3) {
    const skipWords = new Set([
      'football', 'soccer', 'sport', 'news', 'breaking', 'update', 'latest',
      'live', 'match', 'game', 'report', 'analysis', 'feature', 'opinion',
      'video', 'watch', 'highlights', 'preview', 'review', 'blog', 'liveblog',
      'newsstory', 'gossip', 'rumour', 'rumor', 'extra time', 'extratime',
      'features', 'newsround', 'stories',
    ]);

    for (const rawTag of (tags || [])) {
      if (hashtags.length >= 4) break;
      // Clean the tag — remove special chars, keep words
      const cleaned = rawTag.trim().replace(/[^a-zA-Z0-9\s-]/g, '');
      if (cleaned.length < 3 || cleaned.length > 25) continue;
      if (skipWords.has(cleaned.toLowerCase())) continue;

      // Convert to hashtag: "Manchester City" → "#ManchesterCity"
      const hashTag = '#' + cleaned.split(/[\s-]+/).map(w =>
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join('');

      if (hashTag.length >= 4 && hashTag.length <= 25) {
        add(hashTag);
      }
    }
  }

  // 6. TITLE EXTRACTION: Pull proper nouns from the title
  if (hashtags.length < 3) {
    // Find capitalized words in the original title (proper nouns = teams, players, countries)
    const properNouns = title.match(/[A-Z][a-z]{2,}/g) || [];
    const skipNouns = new Set(['The', 'And', 'For', 'But', 'Not', 'With', 'Has', 'Have', 'Was', 'Were', 'Are', 'His', 'Her', 'How', 'Why', 'What', 'Who', 'New', 'Set', 'Out', 'Off', 'Top', 'Big', 'All', 'Can', 'May', 'Will', 'Get', 'Got', 'Put', 'Run', 'Let', 'Old', 'End', 'Key', 'Win', 'Way']);

    for (const noun of properNouns) {
      if (hashtags.length >= 4) break;
      if (skipNouns.has(noun)) continue;
      if (noun.length >= 4) {
        add(`#${noun}`);
      }
    }
  }

  // 7. Always add #Football at the end
  add('#Football');

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
  imageUrl?: string,
  summary?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();

  if (!token) {
    return { success: false, error: 'Twitter credentials not configured. Set TWITTER_OAUTH2_TOKEN and TWITTER_REFRESH_TOKEN.' };
  }

  try {
    const url = `${SITE_URL}/news/${slug}`;
    const allHashtags = buildHashtags(title, tags || []);
    // X best practice: max 1-2 hashtags, links in reply not main tweet
    const topHashtags = allHashtags.split(' ').slice(0, 2).join(' ');

    // Build tweet: title + summary + link + 2 hashtags
    const summarySnippet = summary
      ? summary.slice(0, 100).replace(/\s+\S*$/, '...')
      : '';

    let text: string;
    if (summarySnippet) {
      text = `📰 ${title}\n\n${summarySnippet}\n\n${url}\n\n${topHashtags}`;
    } else {
      text = `📰 ${title}\n\n${url}\n\n${topHashtags}`;
    }

    if (text.length > 280) {
      // Drop summary to fit
      text = `📰 ${title}\n\n${url}\n\n${topHashtags}`;
    }
    if (text.length > 280) {
      text = `📰 ${title.slice(0, 280 - url.length - topHashtags.length - 8)}...\n\n${url}\n\n${topHashtags}`;
    }

    // Post main tweet (no link — better algorithm treatment)
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
 * Upload an image to Twitter and return the media_id.
 * Fetches the image from a URL, converts to base64, uploads via v1.1 media/upload.
 */
async function uploadMediaToTwitter(
  imageUrl: string,
  token: string
): Promise<string | null> {
  try {
    // Fetch the image
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) {
      console.error(`[Twitter] Failed to fetch image: ${imgRes.status}`);
      return null;
    }

    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // Upload to Twitter media endpoint
    const formData = new URLSearchParams();
    formData.append('media_data', base64);

    const uploadRes = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
      signal: AbortSignal.timeout(20000),
    });

    const uploadText = await uploadRes.text();
    let uploadData;
    try { uploadData = JSON.parse(uploadText); } catch { uploadData = {}; }

    if (uploadRes.ok && uploadData.media_id_string) {
      console.log(`[Twitter] Media uploaded: ${uploadData.media_id_string}`);
      return uploadData.media_id_string;
    }

    console.error(`[Twitter] Media upload failed ${uploadRes.status}: ${uploadText.slice(0, 200)}`);
    return null;
  } catch (e) {
    console.error(`[Twitter] Media upload error:`, (e as Error).message);
    return null;
  }
}

/**
 * Post a custom tweet with exact text (no auto-formatting).
 * Used for kickoff alerts, goal alerts, etc.
 * Optionally attaches an image if imageUrl is provided.
 */
export async function postCustomTweet(
  text: string,
  imageUrl?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: 'Twitter credentials not configured' };
  }

  try {
    // Upload image if provided
    let mediaId: string | null = null;
    if (imageUrl) {
      mediaId = await uploadMediaToTwitter(imageUrl, token);
    }

    const tweetBody: Record<string, any> = { text: text.slice(0, 280) };
    if (mediaId) {
      tweetBody.media = { media_ids: [mediaId] };
    }

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetBody),
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await res.text();
    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (res.ok && data.data?.id) {
      console.log(`[Twitter] Custom tweet posted: ${data.data.id}${mediaId ? ' (with image)' : ''}`);
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
