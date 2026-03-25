// OpenF1 OAuth2 Token Manager
// Acquires and caches bearer tokens for authenticated API access (paid tier)
// Tokens expire after 1 hour; we refresh at 50 minutes

const TOKEN_URL = 'https://api.openf1.org/token';
const TOKEN_REFRESH_BUFFER_MS = 10 * 60 * 1000; // Refresh 10 minutes before expiry

interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number; // seconds
}

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;
let tokenPromise: Promise<string | null> | null = null;

function getCredentials(): { username: string; password: string } | null {
  const username = process.env.OPENF1_USERNAME;
  const password = process.env.OPENF1_PASSWORD;

  if (!username || !password) {
    return null;
  }

  return { username, password };
}

async function acquireToken(): Promise<string | null> {
  const credentials = getCredentials();
  if (!credentials) {
    return null;
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
    });

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      console.error(`OpenF1 token request failed: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: TokenData = await response.json();

    cachedToken = data.access_token;
    // Set expiry with buffer so we refresh before it actually expires
    tokenExpiresAt = Date.now() + (data.expires_in * 1000) - TOKEN_REFRESH_BUFFER_MS;

    return cachedToken;
  } catch (error) {
    console.error('Failed to acquire OpenF1 token:', error);
    return null;
  }
}

/**
 * Get a valid OpenF1 bearer token.
 * Returns null if credentials are not configured (falls back to free tier).
 * Handles concurrent requests by deduplicating token acquisition.
 */
export async function getOpenF1Token(): Promise<string | null> {
  // No credentials configured - use free tier
  if (!getCredentials()) {
    return null;
  }

  // Token is still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  // Deduplicate concurrent token requests
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = acquireToken().finally(() => {
    tokenPromise = null;
  });

  return tokenPromise;
}

/**
 * Get authorization headers for OpenF1 API requests.
 * Returns empty object if no token is available (free tier fallback).
 */
export async function getOpenF1AuthHeaders(): Promise<Record<string, string>> {
  const token = await getOpenF1Token();
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}
