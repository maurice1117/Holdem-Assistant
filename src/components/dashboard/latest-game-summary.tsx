import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Crown, Flame, Sparkles, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { formatDateLong, formatPnl } from "@/lib/formatters";
import { getPlayerHref } from "@/lib/routes";
import type { LatestGameDaySummary } from "@/types/poker";

export function LatestGameSummary({ summary }: { summary: LatestGameDaySummary }) {
  return (
    <section className="surface latest-summary-card">
      <div className="section-heading">
        <div>
          <div className="section-kicker"><Sparkles size={14} aria-hidden="true" />LATEST GAME DAY</div>
          <h2>最新戰局摘要</h2>
          <p>{formatDateLong(summary.gameDate)} · {summary.sessionCount} 局 · {summary.participantCount} 位玩家</p>
        </div>
      </div>

      <div className="latest-summary-grid">
        <SummaryItem
          icon={<Crown size={17} />}
          label="當日總冠軍"
          player={summary.dayChampion.playerName}
          value={formatPnl(summary.dayChampion.pnl)}
          tone="profit"
        />
        <SummaryItem
          icon={<ArrowUpRight size={17} />}
          label="最大單局勝利"
          player={summary.largestWin.player_name}
          value={formatPnl(summary.largestWin.pnl)}
          tone="profit"
        />
        <SummaryItem
          icon={<ArrowDownRight size={17} />}
          label="最大單局虧損"
          player={summary.largestLoss.player_name}
          value={formatPnl(summary.largestLoss.pnl)}
          tone="loss"
        />
        <SummaryItem
          icon={<TrendingUp size={17} />}
          label="排名進步最多"
          player={summary.biggestRiser?.playerName ?? null}
          value={summary.biggestRiser ? `上升 ${summary.biggestRiser.positions} 名` : "本次無變化"}
          detail={summary.biggestRiser ? `目前第 ${summary.biggestRiser.currentRank} 名` : undefined}
        />
      </div>

      <div className="latest-stories">
        <div className="latest-story">
          <span><Sparkles size={14} />創下個人累積新高</span>
          <strong>
            {summary.newHighPlayers.length > 0
              ? summary.newHighPlayers.map((player, index) => (
                  <span key={player}>
                    {index > 0 ? "、" : ""}<Link href={getPlayerHref(player)}>{player}</Link>
                  </span>
                ))
              : "本次無人創新高"}
          </strong>
        </div>
        <div className="latest-story">
          <span><Flame size={14} />目前連勝／連敗</span>
          <strong>
            {summary.activeStreaks.length > 0
              ? summary.activeStreaks.slice(0, 4).map((streak, index) => (
                  <span key={streak.playerName}>
                    {index > 0 ? " · " : ""}
                    <Link href={getPlayerHref(streak.playerName)}>{streak.playerName}</Link>
                    {` ${streak.count} 連${streak.type === "win" ? "勝" : "敗"}`}
                  </span>
                ))
              : "目前沒有 2 局以上的連勝或連敗"}
          </strong>
        </div>
      </div>
    </section>
  );
}

function SummaryItem({
  detail,
  icon,
  label,
  player,
  tone = "neutral",
  value,
}: {
  detail?: string;
  icon: ReactNode;
  label: string;
  player: string | null;
  tone?: "profit" | "loss" | "neutral";
  value: string;
}) {
  return (
    <article className="latest-summary-item">
      <span className="latest-summary-icon">{icon}</span>
      <div><span>{label}</span>{player ? <Link href={getPlayerHref(player)}>{player}</Link> : <strong>—</strong>}</div>
      <strong className={tone === "profit" ? "profit-value" : tone === "loss" ? "loss-value" : "neutral-value"}>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}
