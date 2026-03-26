// @ts-nocheck
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const WIDGET_SCRIPT = 'https://widgets.api-sports.io/3.1.0/widgets.js';

interface WidgetConfigProps {
  apiKey: string;
  theme?: 'dark' | 'grey' | 'white' | 'blue';
  lang?: string;
  refresh?: number;
  showLogos?: boolean;
}

/** Global config widget — include once per page */
export function WidgetConfig({
  apiKey,
  theme = 'dark',
  lang = 'en',
  refresh = 30,
  showLogos = true,
}: WidgetConfigProps) {
  return (
    <>
      <Script
        src={WIDGET_SCRIPT}
        type="module"
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />
      <div
        dangerouslySetInnerHTML={{
          __html: `<api-sports-widget
            data-type="config"
            data-sport="football"
            data-key="${apiKey}"
            data-lang="${lang}"
            data-theme="${theme}"
            data-show-error="false"
            data-show-logos="${showLogos}"
            data-refresh="${refresh}"
            data-favorite="false"
            data-standings="true"
            data-team-squad="true"
            data-team-statistics="true"
            data-player-statistics="true"
          ></api-sports-widget>`,
        }}
      />
    </>
  );
}

/** Games/fixtures widget — shows matches for a specific date or live */
export function GamesWidget({ leagueId, date, className }: {
  leagueId?: number;
  date?: string; // YYYY-MM-DD
  className?: string;
}) {
  const attrs = [
    'data-type="games"',
    leagueId ? `data-league-id="${leagueId}"` : '',
    date ? `data-date="${date}"` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: `<api-sports-widget ${attrs}></api-sports-widget>` }} />
    </div>
  );
}

/** Standings widget — league table */
export function StandingsWidget({ leagueId, season, className }: {
  leagueId: number;
  season?: number;
  className?: string;
}) {
  const attrs = [
    'data-type="standings"',
    `data-league-id="${leagueId}"`,
    season ? `data-season="${season}"` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: `<api-sports-widget ${attrs}></api-sports-widget>` }} />
    </div>
  );
}

/** Single game detail widget */
export function GameWidget({ gameId, className }: {
  gameId: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{
        __html: `<api-sports-widget data-type="game" data-game-id="${gameId}"></api-sports-widget>`,
      }} />
    </div>
  );
}

/** H2H widget — head to head between two teams */
export function H2HWidget({ teamId1, teamId2, className }: {
  teamId1: number;
  teamId2: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{
        __html: `<api-sports-widget data-type="h2h" data-team-id-1="${teamId1}" data-team-id-2="${teamId2}"></api-sports-widget>`,
      }} />
    </div>
  );
}

/** Team widget — squad, stats, etc. */
export function TeamWidget({ teamId, className }: {
  teamId: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{
        __html: `<api-sports-widget data-type="team" data-team-id="${teamId}"></api-sports-widget>`,
      }} />
    </div>
  );
}

/** Player widget */
export function PlayerWidget({ playerId, className }: {
  playerId: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{
        __html: `<api-sports-widget data-type="player" data-player-id="${playerId}"></api-sports-widget>`,
      }} />
    </div>
  );
}

/** Leagues widget — browse all leagues */
export function LeaguesWidget({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{
        __html: `<api-sports-widget data-type="leagues"></api-sports-widget>`,
      }} />
    </div>
  );
}
