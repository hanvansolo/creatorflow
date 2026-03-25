import { db, aiAnalysis } from '@/lib/db';
import { desc, gte } from 'drizzle-orm';
import { updateAIAdjustments, getAIAdjustments } from '@/lib/constants/driver-traits';

/**
 * Load and apply the latest AI adjustments from the database
 *
 * This aggregates adjustments from all AI analyses in the last 7 days,
 * with more recent analyses weighted more heavily.
 */
export async function loadLatestAIAdjustments(): Promise<Record<string, number>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all recent AI analyses
  const recentAnalyses = await db
    .select({
      confidenceAdjustments: aiAnalysis.confidenceAdjustments,
      createdAt: aiAnalysis.createdAt,
    })
    .from(aiAnalysis)
    .where(gte(aiAnalysis.createdAt, sevenDaysAgo))
    .orderBy(desc(aiAnalysis.createdAt))
    .limit(50); // Limit to last 50 analyses

  if (recentAnalyses.length === 0) {
    console.log('No recent AI analyses found');
    return {};
  }

  // Aggregate adjustments with time-based weighting
  const weightedAdjustments: Record<string, { sum: number; weight: number }> = {};
  const now = Date.now();

  for (const analysis of recentAnalyses) {
    if (!analysis.confidenceAdjustments || typeof analysis.confidenceAdjustments !== 'object') {
      continue;
    }

    // Calculate weight based on age (newer = higher weight)
    const ageHours = (now - new Date(analysis.createdAt!).getTime()) / (1000 * 60 * 60);
    const weight = Math.max(0.1, 1 - (ageHours / (7 * 24))); // Linear decay over 7 days

    const adjustments = analysis.confidenceAdjustments as Record<string, number>;

    for (const [teamSlug, adjustment] of Object.entries(adjustments)) {
      if (typeof adjustment !== 'number') continue;

      if (!weightedAdjustments[teamSlug]) {
        weightedAdjustments[teamSlug] = { sum: 0, weight: 0 };
      }
      weightedAdjustments[teamSlug].sum += adjustment * weight;
      weightedAdjustments[teamSlug].weight += weight;
    }
  }

  // Calculate weighted averages
  const finalAdjustments: Record<string, number> = {};
  for (const [teamSlug, { sum, weight }] of Object.entries(weightedAdjustments)) {
    if (weight > 0) {
      // Clamp to -0.2 to +0.2 range
      finalAdjustments[teamSlug] = Math.max(-0.2, Math.min(0.2, sum / weight));
    }
  }

  // Update the cache
  updateAIAdjustments(finalAdjustments);

  console.log(`Loaded AI adjustments from ${recentAnalyses.length} analyses:`, finalAdjustments);
  return finalAdjustments;
}

/**
 * Ensure AI adjustments are loaded before generating predictions
 * Returns the current adjustments (loading fresh if cache is stale)
 */
export async function ensureAIAdjustmentsLoaded(): Promise<Record<string, number>> {
  const current = getAIAdjustments();

  // If cache is stale or empty, reload from database
  if (current.isStale || Object.keys(current.adjustments).length === 0) {
    return await loadLatestAIAdjustments();
  }

  return current.adjustments;
}

/**
 * Get a summary of recent AI analyses for display
 */
export async function getRecentAIAnalysisSummary() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentAnalyses = await db
    .select({
      id: aiAnalysis.id,
      source: aiAnalysis.source,
      analysisType: aiAnalysis.analysisType,
      summary: aiAnalysis.summary,
      teamUpdates: aiAnalysis.teamUpdates,
      driverUpdates: aiAnalysis.driverUpdates,
      createdAt: aiAnalysis.createdAt,
    })
    .from(aiAnalysis)
    .where(gte(aiAnalysis.createdAt, twentyFourHoursAgo))
    .orderBy(desc(aiAnalysis.createdAt))
    .limit(10);

  return recentAnalyses;
}
