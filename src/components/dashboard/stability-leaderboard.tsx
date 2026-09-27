import Link from "next/link";
import { ChevronDown, ShieldCheck } from "lucide-react";

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
  const highlights = qualified.slice(0, 3);

  return (
    <section className="surface leaderboard-card stability-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            RISK &amp; CONSISTENCY
          </div>
          <h2>風險與穩定度</h2>
          <p>賺賠比＝總獲利 ÷ 總虧損；正式排名需至少 {GAME_CONFIG.minBb100Sessions} 局且總損益為正</p>
        </div>
      </div>
      <div className="stability-highlights" aria-label="穩定度前三名">
        {highlights.map((entry) => (
          <Link href={getPlayerHref(entry.playerName)} className="stability-highlight" key={entry.playerName}>
            <span className="rank" data-rank={entry.rank ?? undefined}>#{entry.rank}</span>
            <span className="stability-highlight-player">{entry.playerName}</span>
            <span>
              <small>賺賠比</small>
              <strong>{formatProfitFactor(entry.profitFactor)}</strong>
            </span>
            <span>
              <small>最大回撤</small>
              <strong className="loss-value">{formatPnl(-entry.maxDrawdown)}</strong>
            </span>
          </Link>
        ))}
      </div>
      <details className="recent-details">
        <summary>
          查看完整風險數據
          <span>{entries.length} 位玩家</span>
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <div className="table-scroll">
          <table className="leaderboard-table stability-table">
          <thead>
            <tr>
              <th scope="col">排名</th>
              <th scope="col">玩家</th>
              <th scope="col" title="所有獲利加總 ÷ 所有虧損加總">賺賠比</th>
              <th scope="col">單局損益中位數</th>
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
      </details>
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
