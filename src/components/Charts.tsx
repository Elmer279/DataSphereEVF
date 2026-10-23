/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface LinePoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LinePoint[];
}

export function EngagementLineChart({ data }: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return <div className="text-sm text-gray-400 p-4 font-mono">No chart data.</div>;

  // Let's reverse data so it goes left-to-right chronologically
  const sortedData = [...data].reverse();

  // SVG dimensions
  const svgWidth = 520;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...sortedData.map(d => d.value), 25); // cap at min 25 for scale
  const minVal = 0;

  // Coordinate mapping helper
  const getX = (index: number) => {
    return paddingLeft + (index / (sortedData.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    const ratio = (value - minVal) / (maxVal - minVal);
    // SVG 0 is at top, so subtract from chartHeight
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Build the SVG path string
  let pathD = '';
  let shadowD = '';

  sortedData.forEach((d, i) => {
    const x = getX(i);
    const y = getY(d.value);
    if (i === 0) {
      pathD = `M ${x} ${y}`;
      shadowD = `M ${x} ${paddingTop + chartHeight} L ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
      shadowD += ` L ${x} ${y}`;
    }

    if (i === sortedData.length - 1) {
      shadowD += ` L ${x} ${paddingTop + chartHeight} Z`;
    }
  });

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">Student Engagement Metric</h4>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Active Hours Index</span>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-50 text-[#002B6D] font-medium border border-blue-100">
          Updated Live
        </div>
      </div>

      <div className="w-full overflow-x-auto select-none">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto min-w-[400px]">
          <defs>
            {/* Ambient line gradient */}
            <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#002B6D" />
            </linearGradient>

            {/* Below-line area shadow gradient */}
            <linearGradient id="chartAreaShadow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis labels */}
          {gridLines.map((ratio, index) => {
            const val = minVal + ratio * (maxVal - minVal);
            const y = paddingTop + chartHeight - ratio * chartHeight;
            return (
              <g key={`grid-line-${index}`} className="opacity-60">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-gray-400 font-mono text-[10px]"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* Area Shadow below line */}
          {shadowD && (
            <path d={shadowD} fill="url(#chartAreaShadow)" className="transition-all duration-300" />
          )}

          {/* Core connection Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="url(#chartGradient)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {/* Clickable points / hover zones */}
          {sortedData.map((d, i) => {
            const x = getX(i);
            const y = getY(d.value);
            const isHovered = hoveredIndex === i;

            return (
              <g key={`chart-point-${d.label || i}-${i}`}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 7 : 4}
                  className={`${
                    isHovered ? 'fill-sky-400 stroke-[#002B6D]' : 'fill-[#002B6D] stroke-white'
                  } transition-all duration-200 cursor-pointer`}
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
                <text
                  x={x}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  className={`font-mono text-[10px] ${
                    isHovered ? 'fill-[#002B6D] font-bold' : 'fill-gray-400'
                  } transition-colors duration-150`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Embedded Floating Tooltip */}
      <div className="h-6 flex justify-center items-center mt-2">
        {hoveredIndex !== null ? (
          <div className="text-xs bg-slate-900 text-white font-mono px-3 py-1 rounded-md shadow-xs animate-fade-in flex gap-2">
            <span className="text-sky-300 font-bold">{sortedData[hoveredIndex].label}:</span>
            <span>{sortedData[hoveredIndex].value} Engagement Index</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 font-mono">Hover over dots for exact session indices</span>
        )}
      </div>
    </div>
  );
}

interface StackedBarItem {
  name: string;
  Completed: number;
  Enrolled: number;
  'Leaves/Others': number;
}

interface StackedBarChartProps {
  data: StackedBarItem[];
}

export function CompletionStackedBarChart({ data }: StackedBarChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{ district: string; category: string; val: number } | null>(null);

  const colors = {
    'Completed': '#002B6D',    // Navy Blue
    'Enrolled': '#0ea5e9',     // Sky Blue
    'Leaves/Others': '#f59e0b' // Amber Yellow/Orange
  };

  return (
    <div className="relative w-full bg-white rounded-xl border border-gray-100 p-5 shadow-xs">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono">ALS Cohort Distribution</h4>
          <span className="text-xl font-bold text-gray-900 tracking-tight">ALS Completion Rates</span>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#002B6D]"></span>
            <span className="text-[11px] text-gray-500 font-mono">Graduated</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#0ea5e9]"></span>
            <span className="text-[11px] text-gray-500 font-mono">In Program</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#f59e0b]"></span>
            <span className="text-[11px] text-gray-500 font-mono">Others/Leave</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {data.map((district, idx) => {
          const total = district.Completed + district.Enrolled + district['Leaves/Others'];
          const completedPct = (district.Completed / total) * 100;
          const enrolledPct = (district.Enrolled / total) * 100;
          const othersPct = (district['Leaves/Others'] / total) * 100;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-800">{district.name}</span>
                <span className="text-xs text-gray-500 font-mono">
                  Completion: <b className="text-emerald-600 font-bold font-sans">{Math.round(completedPct)}%</b>
                </span>
              </div>

              {/* Stacked bar container */}
              <div className="h-7 w-full bg-slate-100 rounded-lg overflow-hidden flex shadow-inner border border-slate-200">
                {/* Completed */}
                <div
                  className="h-full relative cursor-pointer hover:brightness-110 active:brightness-95 transition-all duration-300"
                  style={{ width: `${completedPct}%`, backgroundColor: colors.Completed }}
                  onMouseEnter={() => setHoveredBar({ district: district.name, category: 'Graduated & Passed', val: district.Completed })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Enrolled */}
                <div
                  className="h-full relative cursor-pointer hover:brightness-110 active:brightness-95 transition-all duration-300 border-l border-white/20"
                  style={{ width: `${enrolledPct}%`, backgroundColor: colors.Enrolled }}
                  onMouseEnter={() => setHoveredBar({ district: district.name, category: 'Active Enrolled', val: district.Enrolled })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Others/Leave */}
                <div
                  className="h-full relative cursor-pointer hover:brightness-110 active:brightness-95 transition-all duration-300 border-l border-white/20"
                  style={{ width: `${othersPct}%`, backgroundColor: colors['Leaves/Others'] }}
                  onMouseEnter={() => setHoveredBar({ district: district.name, category: 'On Leave/Inactive', val: district['Leaves/Others'] })}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Category Detail display */}
      <div className="mt-5 h-6 flex justify-center items-center">
        {hoveredBar ? (
          <div className="text-xs font-mono text-gray-600 bg-slate-50 px-3 py-1 rounded-sm border border-slate-200">
            <span className="font-semibold text-slate-800">{hoveredBar.district}: </span>
            <span className="text-indigo-600 font-bold">{hoveredBar.category}</span> = <span className="font-bold">{hoveredBar.val} learners</span>
          </div>
        ) : (
          <span className="text-[10px] text-gray-400 font-mono">Hover sections of the stacked bars for numerical totals</span>
        )}
      </div>
    </div>
  );
}
