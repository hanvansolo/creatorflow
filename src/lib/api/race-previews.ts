// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

export async function getUpcomingRacesWithoutPreviews(_daysAhead?: number) {
  return [] as any[];
}

export async function generateRacePreview(..._args: unknown[]) {
  return null as any;
}

export async function saveRacePreview(_raceId: string, _content: unknown) {
  return null as any;
}

export async function generateUpcomingPreviews(_daysAhead?: number) {
  return { generated: 0, results: [] as any[] };
}

export async function getRacePreviewByRaceId(_raceId: string) {
  return null as any;
}

export async function getRacePreviewBySlug(_raceSlug: string) {
  return null as any;
}

export async function getPublishedPreviews(_limit?: number) {
  return [] as any[];
}

export async function getOrGeneratePreview(_raceId: string, _raceName: string, _circuitId: string | null, _raceDatetime: Date | null) {
  return null as any;
}

export async function getNextRacePreview() {
  return null as any;
}

export async function updatePreviewsAfterSessions() {
  return { updated: 0, results: [] as any[] };
}

export async function getPreviewUpdates(_raceId: string) {
  return [] as any[];
}
