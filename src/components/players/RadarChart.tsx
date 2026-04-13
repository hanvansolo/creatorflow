'use client';

interface RadarChartProps {
  labels: string[];
  player1Values: number[]; // 0-100 scale
  player2Values: number[];
  player1Name: string;
  player2Name: string;
  player1Color?: string;
  player2Color?: string;
}

export default function RadarChart({
  labels,
  player1Values,
  player2Values,
  player1Name,
  player2Name,
  player1Color = '#facc15', // yellow-400
  player2Color = '#60a5fa', // blue-400
}: RadarChartProps) {
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 150;
  const n = labels.length;

  // Angle for each axis (starting from top, going clockwise)
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // start from top

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = startAngle + index * angleStep;
    const r = (value / 100) * maxRadius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function getPolygonPoints(values: number[]): string {
    return values
      .map((v, i) => {
        const p = getPoint(i, v);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  }

  // Grid levels at 33%, 66%, 100%
  const gridLevels = [33, 66, 100];

  function getGridPolygon(level: number): string {
    return Array.from({ length: n })
      .map((_, i) => {
        const p = getPoint(i, level);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  }

  // Label positions (pushed slightly outward)
  function getLabelPos(index: number): { x: number; y: number; anchor: string } {
    const angle = startAngle + index * angleStep;
    const r = maxRadius + 28;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);

    let anchor = 'middle';
    if (Math.cos(angle) > 0.3) anchor = 'start';
    else if (Math.cos(angle) < -0.3) anchor = 'end';

    return { x, y, anchor };
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[420px] h-auto"
        role="img"
        aria-label={`Radar chart comparing ${player1Name} and ${player2Name}`}
      >
        {/* Grid hexagons */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={getGridPolygon(level)}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="1"
            opacity={level === 100 ? 0.6 : 0.3}
          />
        ))}

        {/* Axis lines */}
        {Array.from({ length: n }).map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="#3f3f46"
              strokeWidth="1"
              opacity="0.4"
            />
          );
        })}

        {/* Player 1 polygon */}
        <polygon
          points={getPolygonPoints(player1Values)}
          fill={player1Color}
          fillOpacity="0.2"
          stroke={player1Color}
          strokeWidth="2"
        />

        {/* Player 2 polygon */}
        <polygon
          points={getPolygonPoints(player2Values)}
          fill={player2Color}
          fillOpacity="0.2"
          stroke={player2Color}
          strokeWidth="2"
        />

        {/* Data points - Player 1 */}
        {player1Values.map((v, i) => {
          const p = getPoint(i, v);
          return (
            <circle key={`p1-${i}`} cx={p.x} cy={p.y} r="4" fill={player1Color} />
          );
        })}

        {/* Data points - Player 2 */}
        {player2Values.map((v, i) => {
          const p = getPoint(i, v);
          return (
            <circle key={`p2-${i}`} cx={p.x} cy={p.y} r="4" fill={player2Color} />
          );
        })}

        {/* Axis labels */}
        {labels.map((label, i) => {
          const pos = getLabelPos(i);
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              textAnchor={pos.anchor as 'start' | 'middle' | 'end'}
              dominantBaseline="central"
              fill="#a1a1aa"
              fontSize="12"
              fontWeight="500"
            >
              {label}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: player1Color }}
          />
          <span className="text-zinc-300">{player1Name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: player2Color }}
          />
          <span className="text-zinc-300">{player2Name}</span>
        </div>
      </div>
    </div>
  );
}
