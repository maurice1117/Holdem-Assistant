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

import { getSessions } from "@/lib/data";
import { formatCompactPnl, formatDateShort, formatPnl } from "@/lib/formatters";
import type { SessionResult } from "@/types/poker";

const COLORS = ["#d6b35a", "#2dd4bf", "#60a5fa", "#c084fc"];

export default function ComparisonTrendChart({
  records,
  players,
}: {
  records: SessionResult[];
  players: string[];
}) {
  const data = useMemo(() => {
    const recentByPlayer = new Map(players.map((player) => [player, [] as number[]]));

    return getSessions(records).map((session) => {
      const row: Record<string, string | number | null> = {
        label: `${formatDateShort(session.gameDate)} #${session.sessionNumber}`,
        gameDate: session.gameDate,
        sessionNumber: session.sessionNumber,
      };
      const recordsByPlayer = new Map(
        session.records.map((record) => [record.player_name, record]),
      );

      players.forEach((player, index) => {
        const record = recordsByPlayer.get(player);
        if (!record) {
          row[`p${index}`] = null;
          return;
        }
        const recent = recentByPlayer.get(player) ?? [];
        recent.push(record.pnl);
        if (recent.length > 5) recent.shift();
        recentByPlayer.set(player, recent);
        row[`p${index}`] = recent.reduce((sum, value) => sum + value, 0) / recent.length;
      });
      return row;
    });
  }, [players, records]);

  return (
    <>
      <div className="equity-chart" role="img" aria-label="玩家五局移動平均比較圖">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 14, left: 0, bottom: 6 }} accessibilityLayer>
            <CartesianGrid stroke="#1b2532" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#758397", fontSize: 11 }} minTickGap={38} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#758397", fontSize: 11 }} tickFormatter={formatCompactPnl} width={52} />
            <ReferenceLine y={0} stroke="#d6b35a" strokeOpacity={0.5} strokeWidth={1.5} />
            <Tooltip
              cursor={{ stroke: "#64748b", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload;
                if (!active || !row) return null;
                return (
                  <div className="chart-tooltip">
                    <div className="tooltip-date">{row.gameDate.replaceAll("-", "/")} · 第 {row.sessionNumber} 局</div>
                    <div className="tooltip-players">
                      {players.map((player, index) => {
                        const value = row[`p${index}`];
                        return value === null || value === undefined ? null : (
                          <div className="tooltip-player" key={player}>
                            <strong>{player}</strong>
                            <span className={value >= 0 ? "profit-value" : "loss-value"}>{formatPnl(value)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }}
            />
            {players.map((player, index) => (
              <Line key={player} type="monotone" dataKey={`p${index}`} name={player} stroke={COLORS[index]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} connectNulls isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        {players.map((player, index) => (
          <span className="comparison-legend-item" key={player}>
            <i style={{ backgroundColor: COLORS[index] }} />{player}
          </span>
        ))}
      </div>
    </>
  );
}
