"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, GitCompareArrows, Layers3, Users } from "lucide-react";

import { ComparisonTrendChartShell } from "@/components/charts/comparison-trend-chart-shell";
import { EquityChartShell } from "@/components/charts/equity-chart-shell";
import { filterRecordsByDate, getGameDates, getPlayers, getSessions } from "@/lib/data";
import { formatDateLong, formatNumber, formatPercent, formatPnl } from "@/lib/formatters";
import {
  filterRecentRecords,
  getEquityCurve,
  getPlayerStats,
  getPnlLeaderboard,
} from "@/lib/metrics";
import type { RecentWindow, SessionResult } from "@/types/poker";

export function PlayerComparison({ records }: { records: SessionResult[] }) {
  const players = useMemo(() => getPlayers(records), [records]);
  const dates = useMemo(() => getGameDates(records), [records]);
  const defaultPlayers = useMemo(
    () => getPnlLeaderboard(records).slice(0, 2).map((entry) => entry.playerName),
    [records],
  );
  const [selectedPlayers, setSelectedPlayers] = useState(defaultPlayers);
  const [selectedDate, setSelectedDate] = useState("all");
  const [recentWindow, setRecentWindow] = useState<RecentWindow>("all");

  const comparison = useMemo(() => {
    const dateRange = selectedDate === "all" ? undefined : { start: selectedDate, end: selectedDate };
    const dateFiltered = filterRecordsByDate(records, dateRange).filter((record) => record.participated);
    const filtered = filterRecentRecords(dateFiltered, recentWindow).filter((record) =>
      selectedPlayers.includes(record.player_name),
    );
    const stats = selectedPlayers.map((player) => getPlayerStats(filtered, player));
    const sharedSessions = getSessions(filtered).filter((session) =>
      selectedPlayers.every((player) =>
        session.records.some((record) => record.player_name === player),
      ),
    ).length;

    return {
      curve: getEquityCurve(filtered),
      filtered,
      sharedSessions,
      stats,
    };
  }, [recentWindow, records, selectedDate, selectedPlayers]);

  const togglePlayer = (player: string) => {
    setSelectedPlayers((current) => {
      if (current.includes(player)) return current.length > 2 ? current.filter((item) => item !== player) : current;
      return current.length < 4 ? [...current, player] : current;
    });
  };

  return (
    <main className="dashboard-shell" id="main-content">
      <section className="dashboard-header comparison-header">
        <div>
          <div className="eyebrow">PLAYER COMPARISON</div>
          <h1>玩家比較</h1>
          <p>選擇 2～4 位玩家，從績效、風險與近期趨勢並排比較</p>
        </div>
        <div className="dashboard-filters">
          <label className="date-filter">
            <span><CalendarDays size={15} aria-hidden="true" />遊戲日期</span>
            <div className="select-wrap">
              <select value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)}>
                <option value="all">全部期間</option>
                {[...dates].reverse().map((date) => <option value={date} key={date}>{formatDateLong(date)}</option>)}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </label>
          <label className="date-filter">
            <span><Layers3 size={15} aria-hidden="true" />戰績範圍</span>
            <div className="select-wrap">
              <select value={recentWindow} onChange={(event) => setRecentWindow(event.target.value === "all" ? "all" : Number(event.target.value) as 5 | 10 | 20)}>
                <option value="all">全部局數</option>
                <option value="5">每位玩家最近 5 局</option>
                <option value="10">每位玩家最近 10 局</option>
                <option value="20">每位玩家最近 20 局</option>
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </label>
        </div>
      </section>

      <section className="surface comparison-selector-card">
        <div className="section-heading">
          <div>
            <div className="section-kicker"><Users size={14} aria-hidden="true" />SELECT PLAYERS</div>
            <h2>比較對象</h2>
            <p>已選 {selectedPlayers.length}/4 位；至少保留 2 位玩家</p>
          </div>
          <span className="comparison-shared"><GitCompareArrows size={15} />共同出席 {comparison.sharedSessions} 局</span>
        </div>
        <div className="comparison-player-grid">
          {players.map((player) => {
            const checked = selectedPlayers.includes(player);
            const disabled = checked ? selectedPlayers.length <= 2 : selectedPlayers.length >= 4;
            return (
              <button type="button" className={`comparison-player${checked ? " selected" : ""}`} disabled={disabled} aria-pressed={checked} onClick={() => togglePlayer(player)} key={player}>
                <span className="custom-checkbox">{checked ? <Check size={12} /> : null}</span>
                {player}
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface comparison-metrics-card">
        <div className="section-heading">
          <div><div className="section-kicker">SIDE BY SIDE</div><h2>核心指標</h2><p>所有數字均套用上方日期與局數篩選</p></div>
        </div>
        <div className="table-scroll">
          <table className="leaderboard-table comparison-table">
            <thead><tr><th scope="col">玩家</th><th scope="col">局數</th><th scope="col">總損益</th><th scope="col">平均 / 局</th><th scope="col">勝率</th><th scope="col" title="所有獲利加總 ÷ 所有虧損加總">賺賠比</th><th scope="col">單局波動</th><th scope="col">最大回撤</th></tr></thead>
            <tbody>
              {comparison.stats.map((stats) => (
                <tr key={stats.playerName}>
                  <th scope="row">{stats.playerName}</th>
                  <td>{stats.playedSessions}</td>
                  <td className={stats.totalPnl >= 0 ? "profit-value" : "loss-value"}>{formatPnl(stats.totalPnl)}</td>
                  <td className={(stats.averagePnl ?? 0) >= 0 ? "profit-value" : "loss-value"}>{stats.averagePnl === null ? "—" : formatPnl(stats.averagePnl)}</td>
                  <td>{formatPercent(stats.winRate)}</td>
                  <td>{stats.profitFactor === null ? "—" : Number.isFinite(stats.profitFactor) ? formatNumber(stats.profitFactor) : "∞"}</td>
                  <td>{stats.sessionStdDev === null ? "—" : formatPnl(stats.sessionStdDev)}</td>
                  <td className="loss-value">{formatPnl(-stats.maxDrawdown)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="comparison-chart-grid">
        <section className="surface equity-card">
          <div className="section-heading"><div><div className="section-kicker">PERFORMANCE CURVE</div><h2>累積戰績比較</h2><p>累積損益 · NT$</p></div></div>
          <EquityChartShell curve={comparison.curve} allPlayers={selectedPlayers} selectedPlayers={selectedPlayers} onTogglePlayer={togglePlayer} />
        </section>
        <section className="surface equity-card">
          <div className="section-heading"><div><div className="section-kicker">RECENT MOMENTUM</div><h2>5 局移動平均比較</h2><p>只在玩家實際參與時更新</p></div></div>
          <ComparisonTrendChartShell records={comparison.filtered} players={selectedPlayers} />
        </section>
      </div>
    </main>
  );
}
