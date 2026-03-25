import type { FlagType } from '@/lib/api/openf1/types';

export interface FlagStyle {
  bg: string;
  text: string;
  name: string;
  description: string;
}

export const FLAG_STYLES: Record<FlagType, FlagStyle> = {
  GREEN: {
    bg: 'bg-green-500',
    text: 'text-green-500',
    name: 'Green Flag',
    description: 'Track clear, racing resumed',
  },
  YELLOW: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    name: 'Yellow Flag',
    description: 'Caution, danger ahead',
  },
  'DOUBLE YELLOW': {
    bg: 'bg-yellow-500',
    text: 'text-yellow-500',
    name: 'Double Yellow',
    description: 'Severe danger, be prepared to stop',
  },
  RED: {
    bg: 'bg-red-600',
    text: 'text-red-600',
    name: 'Red Flag',
    description: 'Session stopped',
  },
  CHEQUERED: {
    bg: 'bg-zinc-900',
    text: 'text-white',
    name: 'Chequered Flag',
    description: 'Session ended',
  },
  'BLACK AND WHITE': {
    bg: 'bg-gradient-to-r from-black to-white',
    text: 'text-white',
    name: 'Black & White Flag',
    description: 'Warning for unsportsmanlike conduct',
  },
  BLUE: {
    bg: 'bg-blue-500',
    text: 'text-blue-500',
    name: 'Blue Flag',
    description: 'Faster car approaching, let them pass',
  },
  BLACK: {
    bg: 'bg-black',
    text: 'text-white',
    name: 'Black Flag',
    description: 'Driver disqualified',
  },
  CLEAR: {
    bg: 'bg-zinc-700',
    text: 'text-zinc-400',
    name: 'Clear',
    description: 'Previous flag condition cleared',
  },
};

export function getFlagStyle(flag: FlagType | string | null): FlagStyle | null {
  if (!flag) return null;
  const normalized = flag.toUpperCase() as FlagType;
  return FLAG_STYLES[normalized] || null;
}

export interface SafetyCarStatus {
  type: 'SC' | 'VSC' | null;
  name: string;
  description: string;
}

export function detectSafetyCarFromMessage(message: string): SafetyCarStatus {
  const upperMessage = message.toUpperCase();

  if (upperMessage.includes('VIRTUAL SAFETY CAR') || upperMessage.includes('VSC')) {
    return {
      type: 'VSC',
      name: 'Virtual Safety Car',
      description: 'VSC deployed - reduced speed required',
    };
  }

  if (upperMessage.includes('SAFETY CAR') && !upperMessage.includes('VIRTUAL')) {
    return {
      type: 'SC',
      name: 'Safety Car',
      description: 'Safety Car deployed',
    };
  }

  return {
    type: null,
    name: '',
    description: '',
  };
}
