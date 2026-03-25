'use client';

import { useLocation } from '@/context/LocationContext';
import { RegionSelector } from '@/components/ui/RegionSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Globe } from 'lucide-react';

export function TimezoneCard() {
  const { timezone } = useLocation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="h-4 w-4" />
          Your Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Region</span>
          <RegionSelector />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Timezone</span>
          <span className="font-mono text-sm text-white">{timezone}</span>
        </div>
        <p className="text-xs text-zinc-500">
          All session times will be shown in your local timezone.
        </p>
      </CardContent>
    </Card>
  );
}
