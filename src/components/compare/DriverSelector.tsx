// @ts-nocheck
'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface DriverOption {
  slug: string;
  name: string;
  code: string;
  teamColor: string;
}

interface DriverSelectorProps {
  drivers: DriverOption[];
  paramName: 'd1' | 'd2';
  selected: string;
  label: string;
}

export function DriverSelector({ drivers, paramName, selected, label }: DriverSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set(paramName, e.target.value);
    } else {
      params.delete(paramName);
    }
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <div className="flex-1">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="">Select a driver</option>
        {drivers.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.name} ({d.code})
          </option>
        ))}
      </select>
    </div>
  );
}
