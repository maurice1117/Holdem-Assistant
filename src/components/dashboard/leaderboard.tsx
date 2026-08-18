import { BadgeCheck } from "lucide-react";

import { formatBb100, formatPnl } from "@/lib/formatters";
import type { RankedPlayerStats } from "@/types/poker";

interface LeaderboardProps {
  title: string;
  subtitle: string;
  entries: RankedPlayerStats[];
  metric: "pnl" | "bb100";
}

function valueClass(value: number | null): string {
  if (value === null || value === 0) return "neutral-value";
  return value > 0 ? "profit-value" : "loss-value";
}

function LeaderboardRows({
  entries,
  metric,
}: Pick<LeaderboardProps, "entries" | "metric">) {
  return entries.map((entry) => {
    const value = metric === "pnl" ? entry.totalPnl : entry.bb100;
    return (
      <tr key={entry.playerName}>
        <td>
          {entry.rank === null ? (
            <span className="rank rank-muted">—</span>
          ) : (
            <span className="rank" data-rank={entry.rank <= 3 ? entry.rank : undefined}>
              #{entry.rank}
            </span>
          )}
        </td>
        <th scope="row">
          <span className="player-cell">
            {entry.playerName}
            {!entry.isQualified ? (
              <span className="sample-badge">樣本不足 · {entry.playedSessions}局</span>
            ) : null}
          </span>
        </th>
        <td className="sessions-cell">{entry.playedSessions}</td>
        <td className={`leaderboard-value ${valueClass(value)}`}>
          {metric === "pnl" ? formatPnl(entry.totalPnl) : formatBb100(entry.bb100)}
        </td>
      </tr>
    );
  });
}

export function Leaderboard({ title, subtitle, entries, metric }: LeaderboardProps) {
  const qualified = entries.filter((entry) => entry.isQualified);
  const lowSample = entries.filter((entry) => !entry.isQualified);

  return (
    <section className="surface leaderboard-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <BadgeCheck size={14} aria-hidden="true" />
            RANKING
          </div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th scope="col">排名</th>
              <th scope="col">玩家</th>
              <th scope="col">局數</th>
              <th scope="col">{metric === "pnl" ? "P&L (NT$)" : "BB/100局"}</th>
            </tr>
          </thead>
          <tbody>
            <LeaderboardRows entries={qualified} metric={metric} />
            {lowSample.length > 0 ? (
              <tr className="sample-divider">
                <td colSpan={4}>樣本不足</td>
              </tr>
            ) : null}
            <LeaderboardRows entries={lowSample} metric={metric} />
          </tbody>
        </table>
      </div>
    </section>
  );
}
