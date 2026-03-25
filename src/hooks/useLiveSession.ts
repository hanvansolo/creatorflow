'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Session, Driver } from '@/lib/api/openf1/types';

const OPENF1_BASE = '/api/openf1';
const SESSION_CHECK_INTERVAL = 30000; // Check for new session every 30 seconds

interface LiveSessionState {
  session: Session | null;
  drivers: Driver[];
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useLiveSession() {
  const [state, setState] = useState<LiveSessionState>({
    session: null,
    drivers: [],
    isLive: false,
    isLoading: true,
    error: null,
    lastChecked: null,
  });

  const checkSession = useCallback(async () => {
    try {
      // Fetch the latest session
      const sessionsRes = await fetch(`${OPENF1_BASE}/sessions?session_key=latest`, {
        cache: 'no-store',
      });

      if (!sessionsRes.ok) {
        throw new Error(`Failed to fetch session: ${sessionsRes.status}`);
      }

      const sessions: Session[] = await sessionsRes.json();
      const session = sessions[0] || null;

      if (!session) {
        setState(prev => ({
          ...prev,
          session: null,
          drivers: [],
          isLive: false,
          isLoading: false,
          error: null,
          lastChecked: new Date(),
        }));
        return;
      }

      // Check if session is currently live
      const now = new Date();
      const start = new Date(session.date_start);
      const end = new Date(session.date_end);

      // Add buffer time (sessions can start early or run late)
      const bufferMs = 30 * 60 * 1000; // 30 minutes
      const adjustedStart = new Date(start.getTime() - bufferMs);
      const adjustedEnd = new Date(end.getTime() + bufferMs);

      const isLive = now >= adjustedStart && now <= adjustedEnd;

      // Fetch drivers for this session
      let drivers: Driver[] = [];
      if (session) {
        const driversRes = await fetch(
          `${OPENF1_BASE}/drivers?session_key=${session.session_key}`,
          { cache: 'no-store' }
        );
        if (driversRes.ok) {
          drivers = await driversRes.json();
        }
      }

      setState({
        session,
        drivers,
        isLive,
        isLoading: false,
        error: null,
        lastChecked: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check session',
        lastChecked: new Date(),
      }));
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkSession();

    // Set up polling for session status
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [checkSession]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    checkSession();
  }, [checkSession]);

  return {
    ...state,
    refresh,
  };
}
