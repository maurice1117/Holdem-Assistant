import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { GAME_CONFIG } from "@/config/game";
import { formatNumber, formatPercent, formatPnl } from "@/lib/formatters";
import { getPlayerHref } from "@/lib/routes";
import type { RankedPlayerStats } from "@/types/poker";

function formatProfitFactor(value: number | null): string {
  if (value === null) return "—";
  if (!Number.isFinite(value)) return "∞";
  return formatNumber(value);
}

export function StabilityLeaderboard({ entries }: { entries: RankedPlayerStats[] }) {
  const qualified = entries.filter((entry) => entry.isQualified);
  const unqualified = entries.filter((entry) => !entry.isQualified);

  return (
    <section className="surface leaderboard-card stability-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            RISK &amp; CONSISTENCY
          </div>
          <h2>穩定獲利排行榜</h2>
          <p>依獲利因子排序；正式排名需至少 {GAME_CONFIG.minBb100Sessions} 局且總 P&amp;L 為正</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="leaderboard-table stability-table">
          <thead>
            <tr>
              <th scope="col">排名</th>
              <th scope="col">玩家</th>
              <th scope="col">獲利因子</th>
              <th scope="col">P&amp;L 中位數</th>
              <th scope="col">單局波動</th>
              <th scope="col">最大回撤</th>
              <th scope="col">爆掉率</th>
            </tr>
          </thead>
          <tbody>
            {[...qualified, ...unqualified].map((entry, index) => (
              <StabilityRow
                entry={entry}
                key={entry.playerName}
                showDivider={index === qualified.length && unqualified.length > 0}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StabilityRow({
  entry,
  showDivider,
}: {
  entry: RankedPlayerStats;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider ? (
        <tr className="sample-divider"><td colSpan={7}>未達排名條件</td></tr>
      ) : null}
      <tr>
        <td>
          {entry.rank === null ? (
            <span className="rank rank-muted">—</span>
          ) : (
            <span className="rank" data-rank={entry.rank <= 3 ? entry.rank : undefined}>#{entry.rank}</span>
          )}
        </td>
        <th scope="row">
          <span className="player-cell">
            <Link href={getPlayerHref(entry.playerName)} className="player-link">{entry.playerName}</Link>
            {!entry.isQualified ? (
              <span className="sample-badge">
                {entry.playedSessions < GAME_CONFIG.minBb100Sessions ? `${entry.playedSessions} 局` : "尚未獲利"}
              </span>
            ) : null}
          </span>
        </th>
        <td className="leaderboard-value">{formatProfitFactor(entry.profitFactor)}</td>
        <td className={`leaderboard-value ${(entry.medianPnl ?? 0) >= 0 ? "profit-value" : "loss-value"}`}>
          {entry.medianPnl === null ? "—" : formatPnl(entry.medianPnl)}
        </td>
        <td>{entry.sessionStdDev === null ? "—" : formatPnl(entry.sessionStdDev)}</td>
        <td className="loss-value">{formatPnl(-entry.maxDrawdown)}</td>
        <td>{formatPercent(entry.bustRate)}</td>
      </tr>
    </>
  );
}
