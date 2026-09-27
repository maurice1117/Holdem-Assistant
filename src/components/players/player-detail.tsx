"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Gauge,
  Layers3,
  Percent,
  Trophy,
} from "lucide-react";

import {
  PlayerDailyChartShell,
  PlayerDrawdownChartShell,
  PlayerEquityChartShell,
  PlayerMovingAverageChartShell,
} from "@/components/charts/player-charts-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { GAME_CONFIG } from "@/config/game";
import {
  compareSessionResults,
  filterRecordsByDate,
  getDailyPlayerResults,
  getGameDates,
} from "@/lib/data";
import {
  formatBb100,
  formatDateLong,
  formatDateShort,
  formatNumber,
  formatPercent,
  formatPnl,
} from "@/lib/formatters";
import { filterRecentRecords, getCumulativePnl, getPlayerStats, getPlayerTrend } from "@/lib/metrics";
import type { RecentWindow, SessionResult } from "@/types/poker";

interface PlayerDetailProps {
  playerName: string;
  records: SessionResult[];
}

type ResultFilter = "all" | "win" | "loss" | "push";
type SortKey = "date" | "pnl";

function valueTone(value: number | null | undefined): "profit" | "loss" | "neutral" {
  if (!value) return "neutral";
  return value > 0 ? "profit" : "loss";
}

function resultType(pnl: number): ResultFilter {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "push";
}

function resultLabel(pnl: number): string {
  const type = resultType(pnl);
  if (type === "win") return "Win";
  if (type === "loss") return "Loss";
  return "Push";
}

function streakText(stats: ReturnType<typeof getPlayerStats>): string {
  if (stats.currentStreak.type === "none" || stats.currentStreak.count === 0) return "無連勝/連敗";
  return `${stats.currentStreak.count} 連${stats.currentStreak.type === "win" ? "勝" : "敗"}`;
}

function sessionDetail(record: SessionResult | null): string {
  if (!record) return "—";
  return `${formatDateShort(record.game_date)} · 第${record.session_number}局`;
}

export function PlayerDetail({ playerName, records }: PlayerDetailProps) {
  const playerAllRecords = useMemo(
    () =>
      records
        .filter((record) => record.participated && record.player_name === playerName)
        .sort(compareSessionResults),
    [playerName, records],
  );
  const gameDates = useMemo(() => getGameDates(playerAllRecords), [playerAllRecords]);
  const [selectedDate, setSelectedDate] = useState("all");
  const [recentWindow, setRecentWindow] = useState<RecentWindow>("all");
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");

  const detail = useMemo(() => {
    const dateRange =
      selectedDate === "all" ? undefined : { start: selectedDate, end: selectedDate };
    const dateFiltered = filterRecordsByDate(records, dateRange).filter(
      (record) => record.participated && record.player_name === playerName,
    );
    const filtered = filterRecentRecords(dateFiltered, recentWindow);
    const stats = getPlayerStats(filtered, playerName);
    const cumulative = getCumulativePnl(filtered, playerName);
    const dailyResults = getDailyPlayerResults(filtered).filter(
      (result) => result.playerName === playerName,
    );
    const trend = getPlayerTrend(filtered, playerName);
    const historyBase = [...filtered].sort((a, b) => {
      if (sortKey === "pnl") return b.pnl - a.pnl || compareSessionResults(b, a);
      return compareSessionResults(b, a);
    });
    const history =
      resultFilter === "all"
        ? historyBase
        : historyBase.filter((record) => resultType(record.pnl) === resultFilter);

    return { cumulative, dailyResults, filtered, history, stats, trend };
  }, [playerName, recentWindow, records, resultFilter, selectedDate, sortKey]);

  const dateSubtitle =
    selectedDate === "all"
      ? `${formatDateLong(gameDates[0])} 至今`
      : formatDateLong(selectedDate);

  return (
    <main className="dashboard-shell" id="main-content">
      <section className="dashboard-header player-header">
        <div>
          <Link href="/" className="back-link">
            <ArrowLeft size={15} aria-hidden="true" />
            戰績總覽
          </Link>
          <div className="eyebrow">PLAYER DETAIL</div>
          <h1>{playerName}</h1>
          <p>
            {detail.stats.playedSessions} 局 · {dateSubtitle}
          </p>
        </div>
        <div className="dashboard-filters">
        <label className="date-filter">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            遊戲日期
          </span>
          <div className="select-wrap">
            <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
              <option value="all">全部期間</option>
              {[...gameDates].reverse().map((date) => (
                <option value={date} key={date}>
                  {formatDateLong(date)}
                </option>
              ))}
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </label>
        <label className="date-filter">
          <span>
            <Layers3 size={15} aria-hidden="true" />
            戰績範圍
          </span>
          <div className="select-wrap">
            <select
              value={recentWindow}
              onChange={(event) =>
                setRecentWindow(event.target.value === "all" ? "all" : Number(event.target.value) as 5 | 10 | 20)
              }
            >
              <option value="all">全部局數</option>
              <option value="5">最近 5 局</option>
              <option value="10">最近 10 局</option>
              <option value="20">最近 20 局</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </label>
        </div>
      </section>

      {detail.filtered.length === 0 ? (
        <section className="surface empty-panel">這段期間沒有戰績。</section>
      ) : (
        <>
          <section className="kpi-grid player-kpi-grid" aria-label="玩家主要戰績">
            <KpiCard
              label="總損益"
              value={formatPnl(detail.stats.totalPnl)}
              detail="NT$"
              icon={<Trophy size={18} />}
              tone={valueTone(detail.stats.totalPnl)}
            />
            <KpiCard
              label="每 100 局大盲注收益"
              value={formatBb100(detail.stats.bb100)}
              detail={
                detail.stats.playedSessions < GAME_CONFIG.minBb100Sessions
                  ? `樣本不足 · ${detail.stats.playedSessions}局`
                  : `BB NT$${GAME_CONFIG.bigBlind}`
              }
              icon={<Gauge size={18} />}
              tone={valueTone(detail.stats.bb100)}
            />
            <KpiCard
              label="局數"
              value={String(detail.stats.playedSessions)}
              detail={`${detail.stats.wins}W · ${detail.stats.losses}L · ${detail.stats.pushes}P`}
              icon={<Layers3 size={18} />}
            />
            <KpiCard
              label="勝率"
              value={formatPercent(detail.stats.winRate)}
              detail={`${detail.stats.wins}W · ${detail.stats.losses}L · ${detail.stats.pushes}P`}
              icon={<Percent size={18} />}
            />
            <KpiCard
              label="平均每局損益"
              value={detail.stats.averagePnl === null ? "—" : `${formatPnl(detail.stats.averagePnl)} / 局`}
              detail="平均單局損益"
              icon={<Gauge size={18} />}
              tone={valueTone(detail.stats.averagePnl)}
            />
            <KpiCard
              label="最大回撤"
              value={`NT$${formatPnl(detail.stats.maxDrawdown).replace("+", "")}`}
              detail="歷史高點至低點"
              icon={<ArrowDownRight size={18} />}
              tone="loss"
            />
            <KpiCard
              label="最佳單局"
              value={detail.stats.bestSession ? formatPnl(detail.stats.bestSession.pnl) : "—"}
              detail={sessionDetail(detail.stats.bestSession)}
              icon={<ArrowUpRight size={18} />}
              tone="profit"
            />
            <KpiCard
              label="最差單局"
              value={detail.stats.worstSession ? formatPnl(detail.stats.worstSession.pnl) : "—"}
              detail={sessionDetail(detail.stats.worstSession)}
              icon={<ArrowDownRight size={18} />}
              tone="loss"
            />
          </section>

          <div className="detail-grid">
            <section className="surface detail-card wide">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">PLAYER CURVE</div>
                  <h2>累積戰績</h2>
                  <p>只顯示實際參與的局</p>
                </div>
              </div>
              <PlayerEquityChartShell points={detail.cumulative} />
            </section>

            <section className="surface detail-card">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">GAME DAY</div>
                  <h2>日別戰績</h2>
                  <p>每個遊戲日的累積損益</p>
                </div>
              </div>
              <PlayerDailyChartShell results={detail.dailyResults} />
            </section>
          </div>

          <div className="detail-grid trend-grid">
            <section className="surface detail-card">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">RECENT MOMENTUM</div>
                  <h2>5 局移動平均</h2>
                  <p>單局損益與近期平均走勢</p>
                </div>
              </div>
              <PlayerMovingAverageChartShell points={detail.trend} />
            </section>
            <section className="surface detail-card">
              <div className="section-heading">
                <div>
                  <div className="section-kicker">UNDERWATER</div>
                  <h2>回撤深度</h2>
                  <p>每局距離期間內歷史高點的差距</p>
                </div>
              </div>
              <PlayerDrawdownChartShell points={detail.trend} />
            </section>
          </div>

          <section className="surface detail-card">
            <div className="section-heading">
              <div>
                <div className="section-kicker">ADVANCED</div>
                <h2>進階數據</h2>
                <p>波動、回撤、連勝連敗與爆掉次數</p>
              </div>
            </div>
            <div className="advanced-grid">
              <StatPill label="歷史最高累積損益" value={formatPnl(detail.stats.peakPnl)} />
              <StatPill
                label="目前距離最高點"
                value={`NT$${formatPnl(detail.stats.currentDrawdown).replace("+", "")}`}
              />
              <StatPill
                label="最大回撤"
                value={`NT$${formatPnl(detail.stats.maxDrawdown).replace("+", "")}`}
              />
              <StatPill
                label="波動度 / 局"
                value={detail.stats.sessionStdDev === null ? "—" : formatNumber(detail.stats.sessionStdDev)}
              />
              <StatPill
                label="每 100 局收益波動"
                value={detail.stats.stdBB100 === null ? "—" : formatNumber(detail.stats.stdBB100)}
              />
              <StatPill label="最長連勝" value={`${detail.stats.longestWinStreak} 連勝`} />
              <StatPill label="最長連敗" value={`${detail.stats.longestLossStreak} 連敗`} />
              <StatPill label="目前 streak" value={streakText(detail.stats)} />
              <StatPill label="爆掉次數" value={`${detail.stats.bustCount} 次`} />
            </div>
          </section>

          <section className="surface detail-card">
            <div className="section-heading session-history-heading">
              <div>
                <div className="section-kicker">SESSION LOG</div>
                <h2>玩家每局紀錄</h2>
                <p>最新至最舊，可依結果與損益篩選</p>
              </div>
              <div className="history-controls">
                <label>
                  結果
                  <select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as ResultFilter)}>
                    <option value="all">全部</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                    <option value="push">Push</option>
                  </select>
                </label>
                <label>
                  排序
                  <select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)}>
                    <option value="date">日期</option>
                    <option value="pnl">損益</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="table-scroll">
              <table className="leaderboard-table session-history-table">
                <thead>
                  <tr>
                    <th scope="col">日期</th>
                    <th scope="col">局</th>
                    <th scope="col">損益</th>
                    <th scope="col">累積損益</th>
                    <th scope="col">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.history.map((record) => {
                    const cumulative = detail.cumulative.find(
                      (point) =>
                        point.gameDate === record.game_date &&
                        point.sessionNumber === record.session_number,
                    );
                    const type = resultType(record.pnl);
                    return (
                      <tr key={`${record.game_date}-${record.session_number}`}>
                        <td>{formatDateShort(record.game_date)}</td>
                        <td>第{record.session_number}局</td>
                        <td className={`leaderboard-value ${record.pnl > 0 ? "profit-value" : record.pnl < 0 ? "loss-value" : "neutral-value"}`}>
                          {formatPnl(record.pnl)}
                        </td>
                        <td className={`leaderboard-value ${(cumulative?.cumulativePnl ?? 0) > 0 ? "profit-value" : (cumulative?.cumulativePnl ?? 0) < 0 ? "loss-value" : "neutral-value"}`}>
                          {cumulative ? formatPnl(cumulative.cumulativePnl) : "—"}
                        </td>
                        <td>
                          <span className={`result-badge result-${type}`}>{resultLabel(record.pnl)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
