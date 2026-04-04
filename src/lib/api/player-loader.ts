import { db, players, clubs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getSquad } from '@/lib/api/football-api';

// Rate limit: max 10 squad API loads per hour to save API calls
let squadLoadCount = 0;
let squadLoadResetTime = Date.now() + 3600000;
const MAX_SQUAD_LOADS_PER_HOUR = 10;

/**
 * Get players for a club — loads from DB if cached, otherwise fetches from API and stores.
 * Returns array of players. Call this from any page that needs squad data.
 */
export async function getOrLoadSquad(clubId: string): Promise<any[]> {
  // 1. Check if we already have players for this club
  const existing = await db
    .select()
    .from(players)
    .where(eq(players.currentClubId, clubId));

  if (existing.length > 0) return existing;

  // 2. Get the club's API Football ID
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1);
  if (!club?.apiFootballId) return [];

  // 3. Rate limit — max 10 squad loads per hour
  const now = Date.now();
  if (now > squadLoadResetTime) { squadLoadCount = 0; squadLoadResetTime = now + 3600000; }
  if (squadLoadCount >= MAX_SQUAD_LOADS_PER_HOUR) {
    console.log(`[PlayerLoader] Rate limited — skipping ${club.name}`);
    return [];
  }
  squadLoadCount++;

  // 3. Fetch from API
  try {
    const squadData = await getSquad(club.apiFootballId);
    if (!squadData.response?.[0]?.players) return [];

    const squadPlayers = squadData.response[0].players;
    const inserted = [];

    for (const p of squadPlayers) {
      const posMap: Record<string, string> = { 'Goalkeeper': 'GK', 'Defender': 'DEF', 'Midfielder': 'MID', 'Attacker': 'FWD' };
      const position = posMap[p.position] || p.position || 'MID';
      const nameParts = p.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || p.name;
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + p.id;

      try {
        // Upsert — update if exists by apiFootballId, insert if new
        const [existingPlayer] = await db.select().from(players).where(eq(players.apiFootballId, p.id)).limit(1);

        if (existingPlayer) {
          await db.update(players).set({
            knownAs: p.name,
            position,
            shirtNumber: p.number,
            headshotUrl: p.photo,
            currentClubId: clubId,
            updatedAt: new Date(),
          }).where(eq(players.id, existingPlayer.id));
          inserted.push({ ...existingPlayer, knownAs: p.name, position, shirtNumber: p.number, headshotUrl: p.photo });
        } else {
          const [newPlayer] = await db.insert(players).values({
            firstName,
            lastName,
            slug,
            knownAs: p.name,
            position,
            shirtNumber: p.number,
            headshotUrl: p.photo,
            currentClubId: clubId,
            apiFootballId: p.id,
          }).returning();
          inserted.push(newPlayer);
        }
      } catch { /* skip individual errors */ }
    }

    console.log(`[PlayerLoader] Loaded ${inserted.length} players for ${club.name}`);
    return inserted;
  } catch (err) {
    console.error(`[PlayerLoader] Failed to load squad for ${club.name}:`, err);
    return [];
  }
}

/**
 * Get players for a club by API Football team ID
 */
export async function getOrLoadSquadByApiId(apiTeamId: number): Promise<any[]> {
  const [club] = await db.select().from(clubs).where(eq(clubs.apiFootballId, apiTeamId)).limit(1);
  if (!club) return [];
  return getOrLoadSquad(club.id);
}
