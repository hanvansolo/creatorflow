import { db, testingEvents, testingSessions, testingResults, teams } from '@/lib/db';
import { eq, desc, asc } from 'drizzle-orm';
import { updateTestingAdjustments, getTestingAdjustments } from '@/lib/constants/driver-traits';

interface TeamTestingData {
  teamSlug: string;
  bestLapTimeMs: number;
  totalLaps: number;
  longRunPaceMs: number | null;
  reliabilityIssueCount: number;
}

/**
 * Load testing results from the most recent testing event and
 * convert into team car potential adjustments.
 *
 * Adjustments are on a -1.5 to +1.5 scale (added to the 1-10 base rating):
 * - Pace ranking:       -1.0 (slowest) to +1.0 (fastest)
 * - Mileage bonus:      0 to +0.3 (more laps → better reliability/preparedness)
 * - Reliability bonus:  -0.2 (issues) to +0.2 (clean running)
 */
export async function loadTestingAdjustments(): Promise<Record<string, number>> {
  // Get the most recent testing event that has results
  const [latestEvent] = await db
    .select({ id: testingEvents.id, status: testingEvents.status })
    .from(testingEvents)
    .orderBy(desc(testingEvents.startDate))
    .limit(1);

  if (!latestEvent || latestEvent.status === 'upcoming') {
    console.log('No testing data available for adjustments');
    return {};
  }

  // Get all sessions for this event
  const sessions = await db
    .select({ id: testingSessions.id })
    .from(testingSessions)
    .where(eq(testingSessions.eventId, latestEvent.id));

  if (sessions.length === 0) return {};

  // Get all results across all sessions
  const allResults = [];
  for (const session of sessions) {
    const results = await db
      .select({
        teamId: testingResults.teamId,
        bestLapTimeMs: testingResults.bestLapTimeMs,
        totalLaps: testingResults.totalLaps,
        longRunPaceMs: testingResults.longRunPaceMs,
        reliabilityIssues: testingResults.reliabilityIssues,
      })
      .from(testingResults)
      .where(eq(testingResults.sessionId, session.id));

    allResults.push(...results);
  }

  if (allResults.length === 0) return {};

  // Get team slugs by ID
  const allTeams = await db.select({ id: teams.id, slug: teams.slug }).from(teams);
  const teamIdToSlug = new Map(allTeams.map(t => [t.id, t.slug]));

  // Aggregate per team: best lap time, total laps, reliability issues
  const teamData = new Map<string, TeamTestingData>();

  for (const r of allResults) {
    const slug = teamIdToSlug.get(r.teamId!) || '';
    if (!slug) continue;

    const existing = teamData.get(slug);
    if (!existing) {
      teamData.set(slug, {
        teamSlug: slug,
        bestLapTimeMs: r.bestLapTimeMs || 999999,
        totalLaps: r.totalLaps || 0,
        longRunPaceMs: r.longRunPaceMs,
        reliabilityIssueCount: r.reliabilityIssues ? 1 : 0,
      });
    } else {
      if (r.bestLapTimeMs && r.bestLapTimeMs < existing.bestLapTimeMs) {
        existing.bestLapTimeMs = r.bestLapTimeMs;
      }
      existing.totalLaps += r.totalLaps || 0;
      if (r.longRunPaceMs && (!existing.longRunPaceMs || r.longRunPaceMs < existing.longRunPaceMs)) {
        existing.longRunPaceMs = r.longRunPaceMs;
      }
      if (r.reliabilityIssues) {
        existing.reliabilityIssueCount++;
      }
    }
  }

  const teamsArray = [...teamData.values()];
  if (teamsArray.length === 0) return {};

  // Sort by best lap time to rank pace
  const sortedByPace = [...teamsArray].sort((a, b) => a.bestLapTimeMs - b.bestLapTimeMs);
  const fastestMs = sortedByPace[0].bestLapTimeMs;
  const slowestMs = sortedByPace[sortedByPace.length - 1].bestLapTimeMs;
  const paceRange = Math.max(slowestMs - fastestMs, 1); // Avoid division by zero

  // Find max laps for mileage normalization
  const maxLaps = Math.max(...teamsArray.map(t => t.totalLaps), 1);

  // Calculate adjustments per team
  const adjustments: Record<string, number> = {};

  for (const team of teamsArray) {
    // Pace adjustment: +1.0 for fastest, -1.0 for slowest (linear interpolation)
    const paceNormalized = 1 - (team.bestLapTimeMs - fastestMs) / paceRange;
    const paceAdj = (paceNormalized * 2) - 1; // Map 0-1 to -1 to +1

    // Mileage bonus: 0 to +0.3 based on percentage of max laps completed
    const mileageAdj = (team.totalLaps / maxLaps) * 0.3;

    // Reliability: +0.2 for clean, -0.2 for multiple issues
    const reliabilityAdj = team.reliabilityIssueCount === 0
      ? 0.2
      : team.reliabilityIssueCount <= 2
        ? 0
        : -0.2;

    // Total adjustment clamped to -1.5 to +1.5
    const total = Math.max(-1.5, Math.min(1.5, paceAdj + mileageAdj + reliabilityAdj));
    adjustments[team.teamSlug] = Math.round(total * 100) / 100; // Round to 2 decimals
  }

  // Update the cache
  updateTestingAdjustments(adjustments);

  console.log(`Loaded testing adjustments from ${teamsArray.length} teams:`, adjustments);
  return adjustments;
}

/**
 * Ensure testing adjustments are loaded before generating predictions.
 * Uses a cache with 30-minute TTL (same as AI adjustments).
 */
export async function ensureTestingAdjustmentsLoaded(): Promise<Record<string, number>> {
  const current = getTestingAdjustments();

  if (current.isStale || Object.keys(current.adjustments).length === 0) {
    return await loadTestingAdjustments();
  }

  return current.adjustments;
}
