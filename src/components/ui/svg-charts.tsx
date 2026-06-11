"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

// --- COMMON TYPES ---
export interface ChartDataItem {
  label: string;
  value: number;
}

export interface DonutDataItem {
  name: string;
  value: number;
  color: string;
}

// ==========================================
// 1. AREA CHART (SVG based, interactive)
// ==========================================
interface AreaChartProps {
  data: ChartDataItem[];
  height?: number;
  color?: string; // hex or tailwind class
  gradientId?: string;
}

export function AreaChart({
  data,
  height = 200,
  color = "#10B981", // Emerald-500
  gradientId = "area-glow-grad"
}: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const width = 500;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Generate SVG path coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingY - (d.value / maxVal) * chartHeight;
    return { x, y, val: d.value, label: d.label };
  });

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  );

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none" role="img" aria-label="Area chart showing emissions trend over time">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = paddingY + chartHeight * r;
          const gridVal = Math.round(maxVal * (1 - r));
          return (
            <g key={idx} className="opacity-20">
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#6B7280"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 10}
                y={y + 3}
                fill="#9CA3AF"
                fontSize="9"
                textAnchor="end"
                className="font-mono"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Shaded Area fill */}
        <motion.path
          d={fillD}
          fill={`url(#${gradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Area Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Interactivity Dots & Vertical Cursor Line */}
        {points.map((p, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g key={idx}>
              {/* Trigger area helper */}
              <rect
                x={p.x - chartWidth / (data.length * 2)}
                y={paddingY}
                width={chartWidth / data.length}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Cursor vertical line */}
              {isHovered && (
                <line
                  x1={p.x}
                  y1={paddingY}
                  x2={p.x}
                  y2={height - paddingY}
                  stroke="#efefef"
                  strokeWidth="0.5"
                  strokeDasharray="2 2"
                  className="pointer-events-none opacity-40"
                />
              )}

              {/* Data circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isHovered ? 6 : 3}
                fill={isHovered ? color : "#1F2937"}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1.5}
                className="transition-all duration-150 pointer-events-none"
              />
            </g>
          );
        })}

        {/* Bottom Labels */}
        {points.map((p, idx) => {
          // Show every 2nd or 3rd label depending on data length to prevent overlap
          const showLabel = data.length <= 7 || idx % Math.round(data.length / 5) === 0;
          if (!showLabel) return null;

          return (
            <text
              key={idx}
              x={p.x}
              y={height - paddingY + 15}
              fill="#6B7280"
              fontSize="9"
              textAnchor="middle"
              className="font-medium"
            >
              {p.label}
            </text>
          );
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-20 bg-zinc-950/90 border border-white/10 rounded-xl px-3 py-1.5 shadow-xl text-[11px] backdrop-blur-md font-mono"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100 - 35}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-zinc-400">{points[hoveredIdx].label}</div>
          <div className="font-bold text-emerald-400">{points[hoveredIdx].val} kg CO₂</div>
        </div>
      )}

      {/* Screen Reader Table Fallback */}
      <table className="sr-only">
        <caption>Emissions trend over time</caption>
        <thead>
          <tr>
            <th scope="col">Time Period / Date</th>
            <th scope="col">Emissions (kg CO₂)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.value} kg CO₂</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 2. BAR CHART (SVG based, glowing bars)
// ==========================================
interface BarChartProps {
  data: ChartDataItem[];
  height?: number;
  color?: string;
}

export function BarChart({ data, height = 200, color = "#3B82F6" }: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map(d => d.value), 10);
  const width = 500;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const barCount = data.length;
  const totalGap = chartWidth * 0.4; // 40% spacing
  const barWidth = (chartWidth - totalGap) / barCount;
  const gap = totalGap / (barCount - 1 || 1);

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none" role="img" aria-label="Bar chart showing emissions data">
        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = paddingY + chartHeight * r;
          const gridVal = Math.round(maxVal * (1 - r));
          return (
            <g key={idx} className="opacity-15">
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#6B7280"
                strokeWidth="0.5"
              />
              <text
                x={paddingX - 10}
                y={y + 3}
                fill="#9CA3AF"
                fontSize="9"
                textAnchor="end"
                className="font-mono"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const x = paddingX + i * (barWidth + gap);
          const barH = (d.value / maxVal) * chartHeight;
          const y = height - paddingY - barH;
          const isHovered = hoveredIdx === i;

          return (
            <g key={i}>
              {/* Actual data bar */}
              <motion.rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx="4"
                fill={isHovered ? color : `${color}cc`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ originY: 1 }}
                transition={{ duration: 0.8, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all"
              />

              {/* Glowing shadow on hover */}
              {isHovered && (
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={barH + 4}
                  rx="6"
                  fill={color}
                  opacity="0.15"
                  className="pointer-events-none blur-sm"
                />
              )}

              {/* Label */}
              <text
                x={x + barWidth / 2}
                y={height - paddingY + 15}
                fill="#6B7280"
                fontSize="9"
                textAnchor="middle"
                className="font-medium"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-20 bg-zinc-950/90 border border-white/10 rounded-xl px-3 py-1.5 shadow-xl text-[11px] backdrop-blur-md font-mono"
          style={{
            left: `${((paddingX + hoveredIdx * (barWidth + gap) + barWidth / 2) / width) * 100}%`,
            top: `${((height - paddingY - (data[hoveredIdx].value / maxVal) * chartHeight) / height) * 100 - 35}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-zinc-400">{data[hoveredIdx].label}</div>
          <div className="font-bold text-blue-400">{data[hoveredIdx].value} kg CO₂</div>
        </div>
      )}

      {/* Screen Reader Table Fallback */}
      <table className="sr-only">
        <caption>Carbon emissions breakdown</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Emissions (kg CO₂)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.label}</td>
              <td>{d.value} kg CO₂</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// 3. DONUT CHART (SVG arcs)
// ==========================================
interface DonutChartProps {
  data: DonutDataItem[];
  size?: number;
  innerRadius?: number;
}

export function DonutChart({ data, size = 180, innerRadius = 55 }: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 80;
  const center = size / 2;

  let accumulatedAngle = 0;

  const arcs = data.map((d, i) => {
    const percentage = d.value / total;
    const angle = percentage * 360;
    
    // Coordinates
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + angle;
    accumulatedAngle += angle;

    // Convert polar coordinates to Cartesian
    const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
      const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
      return {
        x: centerX + r * Math.cos(angleInRadians),
        y: centerY + r * Math.sin(angleInRadians),
      };
    };

    const start = polarToCartesian(center, center, radius, startAngle);
    const end = polarToCartesian(center, center, radius, endAngle);
    const largeArcFlag = angle <= 180 ? "0" : "1";

    const pathData = [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y
    ].join(" ");

    return {
      path: pathData,
      color: d.color,
      name: d.name,
      value: d.value,
      percentage: Math.round(percentage * 100),
    };
  });

  const activeArc = hoveredIdx !== null ? arcs[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible select-none" role="img" aria-label="Donut chart showing breakdown of emissions by category">
          {/* Inner cutout mask effect */}
          {arcs.map((arc, idx) => {
            const isHovered = hoveredIdx === idx;
            const strokeW = isHovered ? 20 : 14;
            return (
              <motion.path
                key={idx}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeW}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ strokeLinecap: "round" }}
              />
            );
          })}
        </svg>

        {/* Center overlay details */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {activeArc ? (
            <>
              <span className="text-xl font-bold font-mono text-white">
                {activeArc.percentage}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold max-w-[80px] text-center truncate">
                {activeArc.name}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold font-mono text-white">
                {Math.round(total)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
                Total kg
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {arcs.map((arc, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
                isHovered
                  ? "bg-white/5 border-white/10"
                  : "bg-transparent border-transparent"
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: arc.color }}
              />
              <div className="text-xs">
                <span className="text-zinc-300 font-medium">{arc.name}</span>
                <span className="text-zinc-500 ml-2 font-mono">
                  {Math.round(arc.value)} kg ({arc.percentage}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Screen Reader Table Fallback */}
      <table className="sr-only">
        <caption>Breakdown of emissions by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Emissions (kg CO₂)</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {arcs.map((arc, i) => (
            <tr key={i}>
              <td>{arc.name}</td>
              <td>{Math.round(arc.value)} kg CO₂</td>
              <td>{arc.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
