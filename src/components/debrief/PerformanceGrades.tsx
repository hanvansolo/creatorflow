// @ts-nocheck
import { Award } from 'lucide-react';

interface DriverGrade {
  grade: string;
  reason: string;
}

interface PerformanceGradesProps {
  grades: Record<string, DriverGrade>;
  driverNames: Record<string, { name: string; teamColor: string }>;
}

function getGradeColor(grade: string): string {
  switch (grade.toUpperCase()) {
    case 'A+': case 'A': return '#22c55e';
    case 'A-': case 'B+': return '#84cc16';
    case 'B': case 'B-': return '#eab308';
    case 'C+': case 'C': return '#f59e0b';
    case 'C-': case 'D+': return '#f97316';
    case 'D': case 'D-': return '#ef4444';
    case 'F': return '#dc2626';
    default: return '#a1a1aa';
  }
}

export function PerformanceGrades({ grades, driverNames }: PerformanceGradesProps) {
  const sortedEntries = Object.entries(grades).sort((a, b) => {
    const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    return gradeOrder.indexOf(a[1].grade) - gradeOrder.indexOf(b[1].grade);
  });

  if (sortedEntries.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
        <Award className="h-5 w-5 text-purple-500" />
        Driver Performance Grades
      </h3>
      <div className="space-y-2">
        {sortedEntries.map(([driverCode, { grade, reason }]) => {
          const driverInfo = driverNames[driverCode];
          const gradeColor = getGradeColor(grade);

          return (
            <div
              key={driverCode}
              className="flex items-center gap-3 rounded-lg bg-zinc-800/50 px-3 py-2.5"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-sm font-black"
                style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
              >
                {grade}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold"
                    style={{ color: driverInfo?.teamColor || '#a1a1aa' }}
                  >
                    {driverCode}
                  </span>
                  {driverInfo && (
                    <span className="text-sm text-zinc-400">{driverInfo.name}</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{reason}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
