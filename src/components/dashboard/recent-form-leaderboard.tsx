import Link from "next/link";
import { Activity, ArrowDownRight, ArrowUpRight, ChevronDown, Minus } from "lucide-react";

import { formatPercent, formatPnl } from "@/lib/formatters";
import { getPlayerHref } from "@/lib/routes";
import type { RecentFormEntry } from "@/types/poker";

function valueClass(value: number | null): string {
  if (value === null || value === 0) return "neutral-value";
  return value > 0 ? "profit-value" : "loss-value";
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return <span className="neutral-value">—</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <span className={`recent-trend ${valueClass(value)}`}>
      <Icon size={13} aria-hidden="true" />
      {formatPnl(value)} / 局
    </span>
  );
}

export function RecentFormLeaderboard({
  entries,
  window,
}: {
  entries: RecentFormEntry[];
  window: 5 | 10 | 20;
}) {
  const highlights = entries.slice(0, 3);

  return (
    <section className="surface leaderboard-card recent-form-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <Activity size={14} aria-hidden="true" />
            RECENT FORM
          </div>
          <h2>近期戰力榜</h2>
          <p>每位玩家最近 {window} 局；趨勢為相較前一段的平均每局變化</p>
        </div>
      </div>

      <div className="recent-highlights" aria-label="近期戰力前三名">
        {highlights.map((entry) => (
          <Link
            href={getPlayerHref(entry.playerName)}
            className="recent-highlight"
            key={entry.playerName}
          >
            <span className="rank" data-rank={entry.rank ?? undefined}>#{entry.rank}</span>
            <span className="recent-highlight-player">{entry.playerName}</span>
            <span className={`recent-highlight-value ${valueClass(entry.totalPnl)}`}>
              {formatPnl(entry.totalPnl)}
            </span>
            <Trend value={entry.averagePnlChange} />
          </Link>
        ))}
      </div>

      <details className="recent-details">
        <summary>
          查看完整排名與數據
          <span>{entries.length} 位玩家</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="table-scroll">
          <table className="leaderboard-table recent-form-table">
            <thead>
              <tr>
                <th scope="col">排名</th>
                <th scope="col">玩家</th>
                <th scope="col">局數</th>
                <th scope="col">近期損益</th>
                <th scope="col">平均 / 局</th>
                <th scope="col">勝率</th>
                <th scope="col">較前期</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.playerName}>
                  <td>
                    <span className="rank" data-rank={(entry.rank ?? 0) <= 3 ? entry.rank ?? undefined : undefined}>
                      #{entry.rank}
                    </span>
                  </td>
                  <th scope="row">
                    <span className="player-cell">
                      <Link href={getPlayerHref(entry.playerName)} className="player-link">
                        {entry.playerName}
                      </Link>
                      {!entry.isQualified ? (
                        <span className="sample-badge">未滿 {window} 局</span>
                      ) : null}
                    </span>
                  </th>
                  <td className="sessions-cell">{entry.playedSessions}</td>
                  <td className={`leaderboard-value ${valueClass(entry.totalPnl)}`}>
                    {formatPnl(entry.totalPnl)}
                  </td>
                  <td className={`leaderboard-value ${valueClass(entry.averagePnl)}`}>
                    {entry.averagePnl === null ? "—" : formatPnl(entry.averagePnl)}
                  </td>
                  <td>{formatPercent(entry.winRate)}</td>
                  <td><Trend value={entry.averagePnlChange} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
