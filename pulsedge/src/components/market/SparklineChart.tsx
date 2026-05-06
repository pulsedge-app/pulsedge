'use client';

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
}

export function SparklineChart({ points, width = 88, height = 32 }: SparklineProps) {
  if (points.length < 2) {
    return <div style={{ width, height }} className="rounded bg-white/5 animate-pulse" />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 2;

  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2);

  const pathD = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const fillD = `${pathD} L${width},${height} L0,${height} Z`;

  const positive = points[points.length - 1] >= points[0];
  const color = positive ? '#10b981' : '#ef4444';
  const fillColor = positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
      aria-hidden
    >
      <path d={fillD} fill={fillColor} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
