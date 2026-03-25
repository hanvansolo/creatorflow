// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export interface SyncResult {
  driverStandingsUpdated: number;
  constructorStandingsUpdated: number;
  raceResultsUpdated: number;
  errors: string[];
}

const emptySyncResult: SyncResult = {
  driverStandingsUpdated: 0,
  constructorStandingsUpdated: 0,
  raceResultsUpdated: 0,
  errors: [],
};

export async function syncCurrentStandings(_seasonYear?: number): Promise<SyncResult> {
  return { ...emptySyncResult };
}

export async function syncSeasonResults(_year: number): Promise<SyncResult> {
  return { ...emptySyncResult };
}

export async function fullDataSync(): Promise<{
  standings: SyncResult;
  currentYearResults: SyncResult;
  previousYearResults: SyncResult;
}> {
  return {
    standings: { ...emptySyncResult },
    currentYearResults: { ...emptySyncResult },
    previousYearResults: { ...emptySyncResult },
  };
}
