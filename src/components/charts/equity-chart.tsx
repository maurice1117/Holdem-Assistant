"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompactPnl, formatDateShort, formatPnl } from "@/lib/formatters";
import type { EquityCurvePoint } from "@/types/poker";

const SERIES_COLORS = [
  "#d6b35a",
  "#2dd4bf",
  "#60a5fa",
  "#c084fc",
  "#f97316",
  "#a3e635",
  "#f472b6",
  "#94a3b8",
  "#38bdf8",
  "#fb7185",
];

interface EquityChartProps {
  curve: EquityCurvePoint[];
  allPlayers: string[];
  selectedPlayers: string[];
  onTogglePlayer: (player: string) => void;
}

interface ChartDatum {
  label: string;
  source: EquityCurvePoint;
  [key: string]: string | number | EquityCurvePoint | undefined;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
  selectedPlayers: string[];
}

function EquityTooltip({ active, payload, selectedPlayers }: TooltipProps) {
  const point = payload?.[0]?.payload.source;
  if (!active || !point) return null;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">
        {point.gameDate.replaceAll("-", "/")} · 第 {point.sessionNumber} 局
      </div>
      <div className="tooltip-players">
        {selectedPlayers.map((player) => {
          const playerPoint = point.players[player];
          return (
            <div className="tooltip-player" key={player}>
              <strong>{player}</strong>
              {playerPoint ? (
                <span>
                  {playerPoint.participated ? `本局 ${formatPnl(playerPoint.sessionPnl ?? 0)}` : "未參加"}
                  <b className={playerPoint.cumulativePnl >= 0 ? "profit-value" : "loss-value"}>
                    累積 {formatPnl(playerPoint.cumulativePnl)}
                  </b>
                </span>
              ) : (
                <span>這段期間未參加</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EquityChart({
  curve,
  allPlayers,
  selectedPlayers,
  onTogglePlayer,
}: EquityChartProps) {
  const playerIndex = useMemo(
    () => new Map(allPlayers.map((player, index) => [player, index])),
    [allPlayers],
  );
  const chartData = useMemo<ChartDatum[]>(
    () =>
      curve.map((point) => {
        const row: ChartDatum = {
          label: `${formatDateShort(point.gameDate)} #${point.sessionNumber}`,
          source: point,
        };
        for (const player of allPlayers) {
          const index = playerIndex.get(player);
          if (index !== undefined) row[`p${index}`] = point.players[player]?.cumulativePnl;
        }
        return row;
      }),
    [allPlayers, curve, playerIndex],
  );

  if (selectedPlayers.length === 0) {
    return <div className="chart-empty">請至少選擇一位玩家以顯示累積戰績。</div>;
  }

  return (
    <>
      <div className="equity-chart" role="img" aria-label="玩家累積 P&L 折線圖">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 14, left: 0, bottom: 6 }} accessibilityLayer>
            <CartesianGrid stroke="#1b2532" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#758397", fontSize: 11 }}
              minTickGap={38}
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
              content={<EquityTooltip selectedPlayers={selectedPlayers} />}
            />
            {selectedPlayers.map((player) => {
              const index = playerIndex.get(player) ?? 0;
              return (
                <Line
                  key={player}
                  type="monotone"
                  dataKey={`p${index}`}
                  name={player}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend" aria-label="圖表玩家圖例">
        {selectedPlayers.map((player) => {
          const index = playerIndex.get(player) ?? 0;
          return (
            <button type="button" key={player} onClick={() => onTogglePlayer(player)}>
              <span style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }} />
              {player}
            </button>
          );
        })}
      </div>
    </>
  );
}
