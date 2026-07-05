import { useState } from "react";

interface ChartDataPoint {
  date: string;
  blockedAttempts: number;
  riskIndex: number;
}

interface SecureChartProps {
  data: ChartDataPoint[];
}

export default function SecureChart({ data }: SecureChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Setup dimension variables
  const width = 500;
  const height = 180;
  const padding = 20;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Compute maximum values to normalize coordinates
  const maxAttempts = Math.max(...data.map((d) => d.blockedAttempts), 50);

  // Calculate coordinates for points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - (d.blockedAttempts / maxAttempts) * chartHeight;
    return { x, y, data: d };
  });

  // Construct SVG Path Strings
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : "";

  return (
    <div className="relative w-full rounded-xl bg-slate-900/40 p-4 border border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-display text-sm font-semibold tracking-wide text-gray-200 uppercase">
            Threat Intelligence Timeline
          </h4>
          <p className="text-[10px] font-mono text-gray-400">
            Autonomous intrusion blocks over the last 5 days
          </p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-cyan-400"></span>
            <span className="text-gray-400">Intercepted payloads</span>
          </div>
        </div>
      </div>

      <div className="relative h-48 w-full">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="h-full w-full overflow-visible"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = padding + chartHeight * ratio;
            return (
              <line
                key={i}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                className="stroke-slate-800/60"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Shaded area underneath */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Glowing Plot Line */}
          <path
            d={pathD}
            fill="none"
            className="stroke-cyan-400"
            strokeWidth="2.5"
            filter="url(#glow)"
          />

          {/* Render Coordinate Nodes */}
          {points.map((p, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g 
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Outer halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 8 : 4}
                  className="fill-cyan-400/20 stroke-cyan-400 transition-all duration-200"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                />
                {/* Inner core */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 4 : 2}
                  className="fill-white"
                />
                
                {/* Invisible hover helper column */}
                <rect
                  x={p.x - 15}
                  y={padding}
                  width="30"
                  height={chartHeight}
                  fill="transparent"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip UI Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div 
            className="absolute z-20 rounded bg-slate-950 border border-cyan-400/30 p-2 text-[10px] font-mono shadow-xl shadow-black/80 text-glow"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100 - 35}%`,
              transform: "translateX(-50%)"
            }}
          >
            <p className="text-gray-300 font-bold">{points[hoveredIndex].data.date}</p>
            <p className="text-cyan-400 mt-0.5">Blocked: {points[hoveredIndex].data.blockedAttempts} events</p>
            <p className="text-purple-400">Risk Mitigation: {points[hoveredIndex].data.riskIndex}%</p>
          </div>
        )}
      </div>

      {/* Date Axis labels bar */}
      <div className="flex justify-between px-4 mt-2 border-t border-slate-800/40 pt-2 text-[10px] font-mono text-gray-500">
        {data.map((d, i) => (
          <span key={i}>{d.date}</span>
        ))}
      </div>
    </div>
  );
}
