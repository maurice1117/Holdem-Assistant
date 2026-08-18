"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactPnl, formatDateShort, formatPnl } from "@/lib/formatters";
import type { CumulativePnlPoint, DailyPlayerResult } from "@/types/poker";

interface PlayerEquityChartProps {
  points: CumulativePnlPoint[];
}

interface PlayerDailyChartProps {
  results: DailyPlayerResult[];
}

export function PlayerEquityChart({ points }: PlayerEquityChartProps) {
  const data = points.map((point) => ({
    label: `${formatDateShort(point.gameDate)} #${point.sessionNumber}`,
    gameDate: point.gameDate,
    sessionNumber: point.sessionNumber,
    sessionPnl: point.sessionPnl,
    cumulativePnl: point.cumulativePnl,
  }));

  if (data.length === 0) {
    return <div className="chart-empty">這段期間沒有戰績。</div>;
  }

  return (
    <div className="detail-chart" role="img" aria-label="玩家累積 P&L 折線圖">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 14, left: 0, bottom: 6 }} accessibilityLayer>
          <CartesianGrid stroke="#1b2532" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758397", fontSize: 11 }}
            minTickGap={26}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758397", fontSize: 11 }}
            tickFormatter={formatCompactPnl}
            width={52}
          />
          <ReferenceLine y={0} stroke="#d6b35a" strokeOpacity={0.5} strokeWidth={1.5} />
          <Tooltip
            cursor={{ stroke: "#64748b", strokeDasharray: "4 4" }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload;
              if (!active || !row) return null;
              return (
                <div className="chart-tooltip">
                  <div className="tooltip-date">
                    {row.gameDate.replaceAll("-", "/")} · 第 {row.sessionNumber} 局
                  </div>
                  <div className="tooltip-players">
                    <div className="tooltip-player">
                      <strong>本局</strong>
                      <span className={row.sessionPnl >= 0 ? "profit-value" : "loss-value"}>
                        {formatPnl(row.sessionPnl)}
                      </span>
                    </div>
                    <div className="tooltip-player">
                      <strong>累積</strong>
                      <span className={row.cumulativePnl >= 0 ? "profit-value" : "loss-value"}>
                        {formatPnl(row.cumulativePnl)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#d6b35a"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PlayerDailyChart({ results }: PlayerDailyChartProps) {
  const data = results.map((result) => ({
    label: formatDateShort(result.gameDate),
    gameDate: result.gameDate,
    pnl: result.pnl,
    playedSessions: result.playedSessions,
  }));

  if (data.length === 0) {
    return <div className="chart-empty">這段期間沒有戰績。</div>;
  }

  return (
    <div className="detail-chart compact" role="img" aria-label="玩家每日 P&L 長條圖">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 6 }} accessibilityLayer>
          <CartesianGrid stroke="#1b2532" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758397", fontSize: 11 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#758397", fontSize: 11 }}
            tickFormatter={formatCompactPnl}
            width={52}
          />
          <ReferenceLine y={0} stroke="#d6b35a" strokeOpacity={0.45} strokeWidth={1.4} />
          <Tooltip
            cursor={{ fill: "rgba(100, 116, 139, 0.08)" }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload;
              if (!active || !row) return null;
              return (
                <div className="chart-tooltip">
                  <div className="tooltip-date">{row.gameDate.replaceAll("-", "/")}</div>
                  <div className="tooltip-players">
                    <div className="tooltip-player">
                      <strong>P&amp;L</strong>
                      <span className={row.pnl >= 0 ? "profit-value" : "loss-value"}>
                        {formatPnl(row.pnl)}
                      </span>
                    </div>
                    <div className="tooltip-player">
                      <strong>局數</strong>
                      <span>{row.playedSessions} 局</span>
                    </div>
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="pnl" radius={[5, 5, 0, 0]} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.gameDate} fill={row.pnl >= 0 ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
