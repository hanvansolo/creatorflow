'use client';

import { useState } from 'react';
import { Play, Pause, RefreshCw, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const INTERVAL_PRESETS = [
  { label: '5 min', ms: 5 * 60 * 1000 },
  { label: '10 min', ms: 10 * 60 * 1000 },
  { label: '15 min', ms: 15 * 60 * 1000 },
  { label: '30 min', ms: 30 * 60 * 1000 },
  { label: '1 hour', ms: 60 * 60 * 1000 },
  { label: '3 hours', ms: 3 * 60 * 60 * 1000 },
  { label: '6 hours', ms: 6 * 60 * 60 * 1000 },
  { label: '12 hours', ms: 12 * 60 * 60 * 1000 },
  { label: '24 hours', ms: 24 * 60 * 60 * 1000 },
];

interface CronJobCardProps {
  jobName: string;
  label: string;
  intervalMs: number;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  lastResult: Record<string, unknown> | null;
  secret: string;
}

function formatInterval(ms: number): string {
  const preset = INTERVAL_PRESETS.find(p => p.ms === ms);
  if (preset) return preset.label;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export function CronJobCard({
  jobName,
  label,
  intervalMs,
  enabled,
  lastRunAt,
  lastStatus,
  lastResult,
  secret,
}: CronJobCardProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentEnabled, setCurrentEnabled] = useState(enabled);
  const [currentInterval, setCurrentInterval] = useState(intervalMs);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [localLastRun, setLocalLastRun] = useState(lastRunAt);
  const [localLastStatus, setLocalLastStatus] = useState(lastStatus);

  const apiBase = secret === '__jwt__' ? '/api/admin/cron' : `/api/admin/${secret}/cron`;

  async function handleRunNow() {
    setIsRunning(true);
    setRunResult(null);
    try {
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      setLocalLastRun(new Date().toISOString());
      setLocalLastStatus(data.success ? 'success' : 'error');
      setRunResult(data.success ? 'Completed' : `Error: ${data.error || data.result?.error || 'Unknown'}`);
    } catch (err) {
      setRunResult(`Failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      setLocalLastStatus('error');
    } finally {
      setIsRunning(false);
    }
  }

  async function handleToggleEnabled() {
    const newEnabled = !currentEnabled;
    setCurrentEnabled(newEnabled);
    await fetch(apiBase, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobName, enabled: newEnabled }),
    });
  }

  async function handleIntervalChange(newMs: number) {
    setCurrentInterval(newMs);
    await fetch(apiBase, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobName, intervalMs: newMs }),
    });
  }

  return (
    <Card className={!currentEnabled ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white">{label}</CardTitle>
          <div className="flex items-center gap-2">
            {localLastStatus === 'success' && <Badge variant="success">OK</Badge>}
            {localLastStatus === 'error' && <Badge variant="danger">Error</Badge>}
            {!localLastStatus && <Badge variant="outline">Idle</Badge>}
            <Badge variant={currentEnabled ? 'success' : 'secondary'}>
              {currentEnabled ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Interval selector */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Interval</label>
          <select
            value={currentInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {INTERVAL_PRESETS.map((preset) => (
              <option key={preset.ms} value={preset.ms}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Last run info */}
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Last run: {formatTimeAgo(localLastRun)}</span>
        </div>

        {/* Run result message */}
        {runResult && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
            runResult.startsWith('Completed')
              ? 'bg-green-900/20 text-green-400'
              : 'bg-red-900/20 text-red-400'
          }`}>
            {runResult.startsWith('Completed')
              ? <CheckCircle2 className="h-3.5 w-3.5" />
              : <XCircle className="h-3.5 w-3.5" />
            }
            {runResult}
          </div>
        )}

        {/* Last result summary */}
        {lastResult && !runResult && (
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-xs text-zinc-400">
            <pre className="max-h-20 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleRunNow}
            disabled={isRunning}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Run Now
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant={currentEnabled ? 'outline' : 'secondary'}
            onClick={handleToggleEnabled}
          >
            {currentEnabled ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
