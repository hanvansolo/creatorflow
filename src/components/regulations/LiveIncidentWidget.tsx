'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Scale, Clock, CheckCircle, XCircle, HelpCircle, ChevronRight, Siren } from 'lucide-react';
import type { LiveIncident } from '@/lib/api/regulations';

interface LiveIncidentWidgetProps {
  raceId?: string;
  raceName?: string;
  isLive?: boolean;
  initialIncidents?: LiveIncident[];
}

const statusConfig = {
  noted: {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-700/50',
    label: 'Noted',
  },
  under_investigation: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    label: 'Under Investigation',
  },
  no_action: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    label: 'No Further Action',
  },
  penalty_applied: {
    icon: XCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Penalty Applied',
  },
};

const incidentTypeLabels: Record<string, string> = {
  collision: 'Collision',
  track_limits: 'Track Limits',
  unsafe_release: 'Unsafe Release',
  impeding: 'Impeding',
  speeding: 'Speeding',
  technical_infringement: 'Technical Infringement',
  other: 'Incident',
};

function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function IncidentCard({ incident }: { incident: LiveIncident }) {
  const status = statusConfig[incident.status as keyof typeof statusConfig] || statusConfig.noted;
  const StatusIcon = status.icon;

  return (
    <div className={`p-3 rounded-lg border border-zinc-800 ${status.bg}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={`h-4 w-4 ${status.color}`} />
          <span className={`text-xs font-semibold ${status.color}`}>
            {status.label}
          </span>
        </div>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(incident.occurredAt)}
        </span>
      </div>

      {/* Incident Type & Description */}
      <div className="mb-2">
        <span className="text-xs font-medium text-white">
          {incidentTypeLabels[incident.incidentType] || incident.incidentType}
        </span>
        {incident.lap && (
          <span className="text-xs text-zinc-500 ml-2">Lap {incident.lap}</span>
        )}
      </div>
      <p className="text-xs text-zinc-400 line-clamp-2">{incident.description}</p>

      {/* Drivers */}
      {incident.drivers && incident.drivers.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {incident.drivers.map((driver) => (
            <span
              key={driver}
              className="px-1.5 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 rounded font-mono"
            >
              {driver}
            </span>
          ))}
        </div>
      )}

      {/* Penalty */}
      {incident.penaltyDetails && (
        <div className="mt-2 p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
          <span className="text-xs font-semibold text-emerald-400">
            {incident.penaltyDetails}
          </span>
        </div>
      )}

      {/* Related Regulations */}
      {incident.matchedRegulations && incident.matchedRegulations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {incident.matchedRegulations.slice(0, 2).map((reg) => (
            <Link
              key={reg.regulationId}
              href={`/regulations/${reg.articleNumber}`}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"
            >
              <Scale className="h-2.5 w-2.5" />
              Art. {reg.articleNumber}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function LiveIncidentWidget({
  raceId,
  raceName,
  isLive = false,
  initialIncidents = [],
}: LiveIncidentWidgetProps) {
  const [incidents, setIncidents] = useState<LiveIncident[]>(initialIncidents);

  // Poll for updates when live
  useEffect(() => {
    if (!isLive || !raceId) return;

    const fetchIncidents = async () => {
      try {
        const res = await fetch(`/api/incidents?raceId=${raceId}`);
        if (res.ok) {
          const data = await res.json();
          setIncidents(data.incidents);
        }
      } catch (e) {
        console.error('Failed to fetch incidents:', e);
      }
    };

    // Initial fetch
    fetchIncidents();

    // Poll every 30 seconds
    const interval = setInterval(fetchIncidents, 30000);
    return () => clearInterval(interval);
  }, [isLive, raceId]);

  if (!isLive && incidents.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50">
      {/* Racing stripe accent */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-yellow-500 to-red-600" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isLive && (
              <div className="relative">
                <Siren className="h-6 w-6 text-emerald-500" />
                <div className="absolute inset-0 animate-ping opacity-30">
                  <Siren className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            )}
            <div>
              <h3 className="text-lg font-black text-white">
                {isLive ? 'LIVE INCIDENTS' : 'STEWARDS DECISIONS'}
              </h3>
              {raceName && (
                <p className="text-xs text-zinc-500">{raceName}</p>
              )}
            </div>
          </div>
          {isLive && (
            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-600 rounded-full text-xs font-bold text-white animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              LIVE
            </span>
          )}
        </div>

        {/* Incidents List */}
        {incidents.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No incidents reported</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.slice(0, 3).map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}

        {/* View All Link */}
        {incidents.length > 3 && (
          <Link
            href={`/races/${raceId}/incidents`}
            className="mt-4 flex items-center justify-center gap-2 p-2 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            View all {incidents.length} incidents
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
