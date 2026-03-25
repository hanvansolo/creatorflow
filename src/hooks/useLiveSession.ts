// TODO: Rewrite for Footy Feed (stubbed during F1→Soccer migration)

'use client';

export function useLiveSession() {
  return {
    session: null,
    drivers: [],
    isLive: false,
    isLoading: false,
    error: null,
    lastChecked: null,
    refresh: () => {},
  };
}
