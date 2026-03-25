import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock, FileText } from 'lucide-react';

interface JobLog {
  id: string;
  jobType: string | null;
  status: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  itemsProcessed: number | null;
  errorMessage: string | null;
  metadata: unknown;
}

interface JobLogTableProps {
  logs: JobLog[];
}

function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-GB', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export function JobLogTable({ logs }: JobLogTableProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-3 h-8 w-8 text-zinc-600" />
          <p className="text-sm text-zinc-400">No job logs yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5" />
          Recent Job Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-400">
                <th className="pb-3 pr-4">Job</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Started</th>
                <th className="pb-3 pr-4">Duration</th>
                <th className="pb-3 pr-4">Items</th>
                <th className="pb-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-zinc-800/50">
                  <td className="py-2.5 pr-4 font-medium text-white">
                    {log.jobType || 'unknown'}
                  </td>
                  <td className="py-2.5 pr-4">
                    {log.status === 'completed' && <Badge variant="success">Done</Badge>}
                    {log.status === 'running' && <Badge variant="warning">Running</Badge>}
                    {log.status === 'failed' && <Badge variant="danger">Failed</Badge>}
                    {!log.status && <Badge variant="outline">—</Badge>}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-400">
                    {formatDate(log.startedAt)}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-400">
                    {getDuration(log.startedAt, log.completedAt)}
                  </td>
                  <td className="py-2.5 pr-4 text-zinc-400">
                    {log.itemsProcessed ?? '—'}
                  </td>
                  <td className="py-2.5 text-zinc-500">
                    {log.errorMessage ? (
                      <span className="text-emerald-400" title={log.errorMessage}>
                        {log.errorMessage.slice(0, 60)}
                        {log.errorMessage.length > 60 ? '...' : ''}
                      </span>
                    ) : log.metadata && typeof log.metadata === 'object' ? (
                      <span title={JSON.stringify(log.metadata)}>
                        {Object.entries(log.metadata as Record<string, unknown>)
                          .filter(([k]) => k !== 'duration_ms')
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                          .slice(0, 80)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
