import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight, Grid3X3 } from "lucide-react";

import { getDailyPlayerResults, getGameDates, getPlayers } from "@/lib/data";
import { formatDateShort, formatPnl } from "@/lib/formatters";
import { getPlayerHref } from "@/lib/routes";
import type { DailyPlayerResult, DateRange, SessionResult } from "@/types/poker";

interface GameDayHeatmapProps {
  records: SessionResult[];
  dateRange?: DateRange;
}

function toneClass(value: number): string {
  if (value > 0) return "heatmap-cell-profit";
  if (value < 0) return "heatmap-cell-loss";
  return "heatmap-cell-neutral";
}

function heatmapStyle(value: number, maxAbs: number): CSSProperties {
  const intensity = maxAbs === 0 ? 0 : Math.min(Math.abs(value) / maxAbs, 1);
  const alpha = 0.12 + intensity * 0.36;
  if (value > 0) return { backgroundColor: `rgba(34, 197, 94, ${alpha})` };
  if (value < 0) return { backgroundColor: `rgba(239, 68, 68, ${alpha})` };
  return {};
}

export function GameDayHeatmap({ records, dateRange }: GameDayHeatmapProps) {
  const players = getPlayers(records, dateRange);
  const dates = getGameDates(records, dateRange);
  const dailyResults = getDailyPlayerResults(records, dateRange);
  const resultByKey = new Map(
    dailyResults.map((result) => [`${result.playerName}::${result.gameDate}`, result]),
  );
  const maxAbs = dailyResults.reduce((max, result) => Math.max(max, Math.abs(result.pnl)), 0);

  return (
    <section className="surface heatmap-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <Grid3X3 size={14} aria-hidden="true" />
            GAME DAY
          </div>
          <h2>每日戰績</h2>
          <p>玩家在各遊戲日的累積 P&amp;L · 點選玩家查看完整分析</p>
        </div>
      </div>
      <div className="heatmap-scroll">
        <table className="heatmap-table">
          <thead>
            <tr>
              <th scope="col">玩家</th>
              {dates.map((date) => (
                <th scope="col" key={date}>
                  {formatDateShort(date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player}>
                <th scope="row">
                  <Link href={getPlayerHref(player)} className="player-link">
                    {player}
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </th>
                {dates.map((date) => {
                  const result = resultByKey.get(`${player}::${date}`) as
                    | DailyPlayerResult
                    | undefined;
                  return (
                    <td key={date}>
                      {result ? (
                        <span
                          className={`heatmap-cell ${toneClass(result.pnl)}`}
                          style={heatmapStyle(result.pnl, maxAbs)}
                          title={`${player}\n${date}\nP&L ${formatPnl(result.pnl)}\n${result.playedSessions} 局`}
                        >
                          <b>{formatPnl(result.pnl)}</b>
                          <small>{result.playedSessions}局</small>
                        </span>
                      ) : (
                        <span className="heatmap-cell heatmap-cell-empty">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
