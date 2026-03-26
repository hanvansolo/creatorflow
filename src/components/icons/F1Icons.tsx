// @ts-nocheck
import { cn } from '@/lib/utils';

interface IconProps {
  className?: string;
  size?: number;
}

// Verified - Checkered flag with checkmark overlay
export function VerifiedIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Checkered flag pattern background */}
      <rect x="3" y="4" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="7" y="4" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="11" y="4" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="3" y="8" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="7" y="8" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="11" y="8" width="4" height="4" fill="currentColor" opacity="0.6" />
      <rect x="3" y="12" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="7" y="12" width="4" height="4" fill="currentColor" opacity="0.6" />
      {/* Flag pole */}
      <rect x="2" y="3" width="2" height="16" rx="1" fill="currentColor" opacity="0.8" />
      {/* Checkmark circle */}
      <circle cx="17" cy="16" r="6" fill="currentColor" />
      <path
        d="M14.5 16L16.5 18L20 14"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Unverified - Yellow caution flag style
export function UnverifiedIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Yellow flag waving shape */}
      <path
        d="M4 3V21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 4C4 4 8 2 12 4C16 6 20 4 20 4V14C20 14 16 16 12 14C8 12 4 14 4 14V4Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Exclamation mark */}
      <path
        d="M12 7V10"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="1" fill="white" />
    </svg>
  );
}

// Rumours - Paddock whispers / dual speech bubble
export function RumoursIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back speech bubble */}
      <path
        d="M21 11C21 13.2091 18.7614 15 16 15C15.2922 15 14.6155 14.8965 14 14.7101L11 17V14.1973C9.2066 13.4478 8 12.0576 8 10.5C8 8.01472 10.6863 6 14 6C17.3137 6 20 8.01472 20 10.5"
        fill="currentColor"
        opacity="0.4"
      />
      {/* Front speech bubble */}
      <path
        d="M16 14C16 16.7614 12.866 19 9 19C7.93913 19 6.93913 18.8192 6.03913 18.4998L3 21V17.5002C1.77461 16.4549 1 15.0913 1 13.5C1 10.4624 4.13401 8 8 8C11.866 8 15 10.4624 15 13.5"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Question marks indicating speculation */}
      <text x="7" y="15" fill="white" fontSize="6" fontWeight="bold">?</text>
    </svg>
  );
}

// Daily Roundup - Racing newspaper / pit board style
export function DailyRoundupIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pit board shape */}
      <rect x="3" y="2" width="18" height="16" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="4" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Racing stripes */}
      <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 11H20" stroke="currentColor" strokeWidth="1.5" />
      {/* P1 indicator */}
      <text x="8" y="16" fill="currentColor" fontSize="5" fontWeight="bold">P1</text>
      {/* Handle */}
      <path
        d="M12 18V22M10 22H14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Racing helmet icon - Alternative for verified/official
export function HelmetIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Helmet shape */}
      <path
        d="M4 13C4 8.58172 7.58172 5 12 5C16.4183 5 20 8.58172 20 13V15C20 16.1046 19.1046 17 18 17H6C4.89543 17 4 16.1046 4 15V13Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Visor */}
      <path
        d="M6 12H18C18 12 17 10 12 10C7 10 6 12 6 12Z"
        fill="currentColor"
      />
      {/* Visor opening */}
      <path
        d="M7 13H17"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Chin guard */}
      <path
        d="M8 17V19C8 19.5523 8.44772 20 9 20H15C15.5523 20 16 19.5523 16 19V17"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Steering wheel - For refresh/update
export function SteeringWheelIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Inner hub */}
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      {/* Spokes */}
      <path d="M12 9V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.4 13.5L5.8 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14.6 13.5L18.2 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Timing/refresh - Stopwatch style
export function TimingIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stopwatch body */}
      <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
      {/* Top button */}
      <rect x="10" y="2" width="4" height="3" rx="1" fill="currentColor" />
      {/* Side button */}
      <path d="M18 7L20 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Clock hands */}
      <path d="M12 9V13L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Racing flag - For news/articles
export function RacingFlagIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Flag pole */}
      <path d="M4 2V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Checkered pattern */}
      <rect x="6" y="3" width="4" height="4" fill="currentColor" />
      <rect x="14" y="3" width="4" height="4" fill="currentColor" />
      <rect x="10" y="7" width="4" height="4" fill="currentColor" />
      <rect x="6" y="11" width="4" height="4" fill="currentColor" />
      <rect x="14" y="11" width="4" height="4" fill="currentColor" />
      {/* White squares (using opacity) */}
      <rect x="10" y="3" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="6" y="7" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="14" y="7" width="4" height="4" fill="currentColor" opacity="0.3" />
      <rect x="10" y="11" width="4" height="4" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

// Tyre icon - For technical content
export function TyreIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer tyre */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      {/* Inner rim */}
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      {/* Tread grooves */}
      <path d="M12 2V7" stroke="currentColor" strokeWidth="1" />
      <path d="M12 17V22" stroke="currentColor" strokeWidth="1" />
      <path d="M2 12H7" stroke="currentColor" strokeWidth="1" />
      <path d="M17 12H22" stroke="currentColor" strokeWidth="1" />
      <path d="M4.93 4.93L8.17 8.17" stroke="currentColor" strokeWidth="1" />
      <path d="M15.83 15.83L19.07 19.07" stroke="currentColor" strokeWidth="1" />
      <path d="M4.93 19.07L8.17 15.83" stroke="currentColor" strokeWidth="1" />
      <path d="M15.83 8.17L19.07 4.93" stroke="currentColor" strokeWidth="1" />
      {/* Center hub */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// Podium icon - For standings/winners
export function PodiumIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* P1 - Center tallest */}
      <rect x="8" y="4" width="8" height="16" rx="1" fill="currentColor" />
      <text x="10.5" y="12" fill="white" fontSize="6" fontWeight="bold">1</text>
      {/* P2 - Left */}
      <rect x="1" y="8" width="7" height="12" rx="1" fill="currentColor" opacity="0.7" />
      <text x="3" y="15" fill="white" fontSize="5" fontWeight="bold">2</text>
      {/* P3 - Right */}
      <rect x="16" y="10" width="7" height="10" rx="1" fill="currentColor" opacity="0.5" />
      <text x="18" y="16" fill="white" fontSize="5" fontWeight="bold">3</text>
    </svg>
  );
}

// Speed/fast forward arrow - For trending
export function SpeedArrowIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speed lines */}
      <path d="M3 8H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M5 12H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M3 16H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      {/* Arrow */}
      <path
        d="M14 6L21 12L14 18V14H10V10H14V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Grid/Starting position
export function GridIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grid slots */}
      <rect x="2" y="3" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2" y="12" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="14" y="14" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* Car indicators */}
      <circle cx="6" cy="5.5" r="1.5" fill="currentColor" />
      <circle cx="18" cy="7.5" r="1.5" fill="currentColor" opacity="0.7" />
      <circle cx="6" cy="14.5" r="1.5" fill="currentColor" opacity="0.5" />
      <circle cx="18" cy="16.5" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

// Pit stop icon
export function PitStopIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wheel gun / impact wrench */}
      <rect x="4" y="10" width="12" height="4" rx="2" fill="currentColor" />
      {/* Socket */}
      <circle cx="18" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="12" r="1.5" fill="currentColor" />
      {/* Speed lines */}
      <path d="M2 7L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M2 17L5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      {/* Handle */}
      <rect x="6" y="6" width="3" height="4" rx="1" fill="currentColor" opacity="0.7" />
      <rect x="6" y="14" width="3" height="4" rx="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

// Overtake Boost icon (2026 Manual Override system - replaces DRS)
export function OvertakeBoostIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lightning bolt / boost indicator */}
      <path
        d="M13 2L4 14H11L10 22L20 9H13L13 2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Energy glow effect */}
      <path
        d="M13 2L4 14H11L10 22L20 9H13L13 2Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}

// Active Aero icon (2026 regulations)
export function ActiveAeroIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wing profile - adjustable */}
      <path
        d="M2 16C2 16 6 12 12 12C18 12 22 16 22 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Active element indicator */}
      <path
        d="M4 12C4 12 8 8 12 8C16 8 20 12 20 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
        strokeDasharray="2 2"
      />
      {/* Airflow arrows */}
      <path d="M8 6L12 3L16 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <path d="M6 20L12 18L18 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
      {/* Center activation point */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// Trophy icon - For winners/podium
export function TrophyIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trophy cup */}
      <path
        d="M8 2H16V4H19C20.1 4 21 4.9 21 6V8C21 10.21 19.21 12 17 12H16.83C16.42 13.17 15.54 14.14 14.41 14.69L15 17H17V19H7V17H9L9.59 14.69C8.46 14.14 7.58 13.17 7.17 12H7C4.79 12 3 10.21 3 8V6C3 4.9 3.9 4 5 4H8V2Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Handles */}
      <path d="M5 6V8C5 9.1 5.9 10 7 10V6H5Z" fill="currentColor" opacity="0.6" />
      <path d="M17 6V10C18.1 10 19 9.1 19 8V6H17Z" fill="currentColor" opacity="0.6" />
      {/* Base */}
      <rect x="8" y="19" width="8" height="3" rx="1" fill="currentColor" />
      {/* Star decoration */}
      <path d="M12 5L12.5 7H14L13 8L13.5 10L12 9L10.5 10L11 8L10 7H11.5L12 5Z" fill="white" opacity="0.8" />
    </svg>
  );
}

// Race Calendar icon
export function RaceCalendarIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Calendar base */}
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      {/* Top binding */}
      <path d="M7 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Divider line */}
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
      {/* Racing flag mini */}
      <rect x="8" y="13" width="3" height="3" fill="currentColor" />
      <rect x="11" y="13" width="3" height="3" fill="currentColor" opacity="0.4" />
      <rect x="8" y="16" width="3" height="3" fill="currentColor" opacity="0.4" />
      <rect x="11" y="16" width="3" height="3" fill="currentColor" />
    </svg>
  );
}

// Regulations/Rulebook icon
export function RegulationsIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Book shape */}
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* FIA badge */}
      <circle cx="12" cy="8" r="3" fill="currentColor" />
      <text x="10" y="10" fill="white" fontSize="4" fontWeight="bold">F</text>
      {/* Rule lines */}
      <path d="M8 14H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Strategy icon - Pit strategy
export function StrategyIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Race track outline */}
      <path
        d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 2"
      />
      {/* Pit entry */}
      <path
        d="M12 20L8 16L12 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stint markers */}
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <circle cx="20" cy="12" r="2" fill="currentColor" opacity="0.7" />
      <circle cx="8" cy="16" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

// Battle/Head-to-head icon
export function BattleIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left car silhouette */}
      <path
        d="M2 14L4 10H8L9 12H11V14L9 16H4L2 14Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Right car silhouette */}
      <path
        d="M22 14L20 10H16L15 12H13V14L15 16H20L22 14Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* VS spark in middle */}
      <path
        d="M12 8L10 12H11L10 16L14 11H13L14 8H12Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Target/Accuracy icon
export function TargetIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer ring */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      {/* Middle ring */}
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" opacity="0.6" />
      {/* Center bullseye */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      {/* Crosshairs */}
      <path d="M12 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 18V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 12H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Weather - Sunny
export function WeatherSunIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sun center */}
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      {/* Rays */}
      <path d="M12 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.22 4.22L6.34 6.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.66 17.66L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M19 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4.22 19.78L6.34 17.66" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M17.66 6.34L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Weather - Rain
export function WeatherRainIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cloud */}
      <path
        d="M20 15.5C20 17.433 18.433 19 16.5 19H7C4.23858 19 2 16.7614 2 14C2 11.4686 3.89347 9.38617 6.32645 9.05127C7.08976 6.16632 9.77307 4 13 4C16.866 4 20 7.13401 20 11C20 11.3407 19.9716 11.6748 19.9171 12H20C21.1046 12 22 12.8954 22 14C22 14.8284 21.5523 15.5 20 15.5Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Rain drops */}
      <path d="M8 21L7 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 21L11 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 21L15 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Upvote arrow
export function UpvoteIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Racing-style upward chevron */}
      <path
        d="M12 4L4 14H9V20H15V14H20L12 4Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Downvote arrow
export function DownvoteIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Racing-style downward chevron */}
      <path
        d="M12 20L20 10H15V4H9V10H4L12 20Z"
        fill="currentColor"
      />
    </svg>
  );
}

// Championship/Standings icon
export function ChampionshipIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Crown */}
      <path
        d="M3 8L6 16H18L21 8L16 12L12 6L8 12L3 8Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Crown base */}
      <rect x="5" y="16" width="14" height="3" rx="1" fill="currentColor" />
      {/* Jewels */}
      <circle cx="12" cy="11" r="1.5" fill="white" opacity="0.8" />
      <circle cx="8" cy="13" r="1" fill="white" opacity="0.6" />
      <circle cx="16" cy="13" r="1" fill="white" opacity="0.6" />
    </svg>
  );
}

// Dark Horse / Underdog pick
export function DarkHorseIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Horse head silhouette */}
      <path
        d="M20 6C20 6 18 4 15 4C12 4 10 6 10 8V10L8 12V14L10 16V18H12V16L14 14H16L18 12V10L20 8V6Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Sparkle stars */}
      <path d="M5 4L5.5 6L7 6.5L5.5 7L5 9L4.5 7L3 6.5L4.5 6L5 4Z" fill="currentColor" />
      <path d="M7 14L7.3 15L8 15.3L7.3 15.6L7 17L6.7 15.6L6 15.3L6.7 15L7 14Z" fill="currentColor" opacity="0.7" />
      {/* Eye */}
      <circle cx="14" cy="7" r="1" fill="white" />
    </svg>
  );
}

// Video/Play icon
export function VideoIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* TV/Monitor frame */}
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      {/* Play button */}
      <path d="M10 8L15 11L10 14V8Z" fill="currentColor" />
      {/* Stand */}
      <path d="M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17V20" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// External link icon
export function ExternalLinkIcon({ className, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Box */}
      <path
        d="M18 13V19C18 20.1046 17.1046 21 16 21H5C3.89543 21 3 20.1046 3 19V8C3 6.89543 3.89543 6 5 6H11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Arrow */}
      <path d="M15 3H21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Export all icons for easy importing
export const F1Icons = {
  Verified: VerifiedIcon,
  Unverified: UnverifiedIcon,
  Rumours: RumoursIcon,
  DailyRoundup: DailyRoundupIcon,
  Helmet: HelmetIcon,
  SteeringWheel: SteeringWheelIcon,
  Timing: TimingIcon,
  RacingFlag: RacingFlagIcon,
  Tyre: TyreIcon,
  Podium: PodiumIcon,
  SpeedArrow: SpeedArrowIcon,
  Grid: GridIcon,
  PitStop: PitStopIcon,
  OvertakeBoost: OvertakeBoostIcon,
  ActiveAero: ActiveAeroIcon,
  Trophy: TrophyIcon,
  RaceCalendar: RaceCalendarIcon,
  Regulations: RegulationsIcon,
  Strategy: StrategyIcon,
  Battle: BattleIcon,
  Target: TargetIcon,
  WeatherSun: WeatherSunIcon,
  WeatherRain: WeatherRainIcon,
  Upvote: UpvoteIcon,
  Downvote: DownvoteIcon,
  Championship: ChampionshipIcon,
  DarkHorse: DarkHorseIcon,
  Video: VideoIcon,
  ExternalLink: ExternalLinkIcon,
};
