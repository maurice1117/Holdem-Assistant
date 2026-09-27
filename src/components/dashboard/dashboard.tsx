"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Layers3,
  Trophy,
  Users,
} from "lucide-react";

import { EquityChartShell } from "@/components/charts/equity-chart-shell";
import { GAME_CONFIG } from "@/config/game";
import {
  filterRecordsByDate,
  getGameDates,
  getPlayers,
  getSessions,
} from "@/lib/data";
import { formatBb100, formatDateLong, formatPnl } from "@/lib/formatters";
import {
  getBb100Leaderboard,
  getEquityCurve,
  getRecentFormLeaderboard,
  getStabilityLeaderboard,
  getPnlLeaderboard,
  getLatestGameDaySummary,
  filterRecentRecords,
} from "@/lib/metrics";
import type { RecentWindow, SessionResult } from "@/types/poker";

import { GameDayHeatmap } from "./game-day-heatmap";
import { KpiCard } from "./kpi-card";
import { Leaderboard } from "./leaderboard";
import { LatestGameSummary } from "./latest-game-summary";
import { RecentFormLeaderboard } from "./recent-form-leaderboard";
import { StabilityLeaderboard } from "./stability-leaderboard";

interface DashboardProps {
  records: SessionResult[];
}

export function Dashboard({ records }: DashboardProps) {
  const gameDates = useMemo(() => getGameDates(records), [records]);
  const allPlayers = useMemo(() => getPlayers(records), [records]);
  const defaultPlayers = useMemo(() => {
    const leaders = getPnlLeaderboard(records)
      .filter((entry) => entry.isQualified)
      .slice(0, 3)
      .map((entry) => entry.playerName);
    return leaders.length > 0 ? leaders : allPlayers.slice(0, 3);
  }, [allPlayers, records]);

  const [selectedDate, setSelectedDate] = useState("all");
  const [recentWindow, setRecentWindow] = useState<RecentWindow>("all");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(defaultPlayers);
  const latestSummary = useMemo(() => getLatestGameDaySummary(records), [records]);

  const dashboard = useMemo(() => {
    const dateRange =
      selectedDate === "all" ? undefined : { start: selectedDate, end: selectedDate };
    const dateFilteredRecords = filterRecordsByDate(records, dateRange).filter(
      (record) => record.participated,
    );
    const filteredRecords = filterRecentRecords(dateFilteredRecords, recentWindow);
    const sessions = getSessions(filteredRecords);
    const activePlayers = getPlayers(filteredRecords);
    const pnlLeaderboard = getPnlLeaderboard(filteredRecords);
    const bb100Leaderboard = getBb100Leaderboard(filteredRecords);
    const pnlChampion = pnlLeaderboard[0] ?? null;
    const bb100Champion = bb100Leaderboard.find((entry) => entry.isQualified) ?? null;
    return {
      activePlayers,
      bb100Champion,
      bb100Leaderboard,
      curve: getEquityCurve(filteredRecords),
      dateRange,
      filteredRecords,
      pnlChampion,
      pnlLeaderboard,
      recentForm:
        recentWindow === "all"
          ? getRecentFormLeaderboard(dateFilteredRecords, 10)
          : getRecentFormLeaderboard(dateFilteredRecords, recentWindow),
      sessions,
      stabilityLeaderboard: getStabilityLeaderboard(dateFilteredRecords),
    };
  }, [records, recentWindow, selectedDate]);

  const togglePlayer = (player: string) => {
    setSelectedPlayers((current) =>
      current.includes(player)
        ? current.filter((selected) => selected !== player)
        : [...current, player],
    );
  };

  const dateSubtitle =
    selectedDate === "all"
      ? `${formatDateLong(gameDates[0])} – ${formatDateLong(gameDates.at(-1) ?? gameDates[0])}`
      : formatDateLong(selectedDate);

  if (dashboard.filteredRecords.length === 0) {
    return (
      <main className="dashboard-shell" id="main-content">
        <div className="empty-state">
          <h1>這段期間沒有戰績。</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-shell" id="main-content">
      <section className="dashboard-header">
        <div>
          <div className="eyebrow">PRIVATE TABLE · PERFORMANCE</div>
          <h1>德州撲克戰績分析</h1>
          <p>
            {dateSubtitle} · BB NT${GAME_CONFIG.bigBlind}
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
              <option value="5">每位玩家最近 5 局</option>
              <option value="10">每位玩家最近 10 局</option>
              <option value="20">每位玩家最近 20 局</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </div>
        </label>
        </div>
      </section>

      <section className="kpi-grid" aria-label="關鍵戰績指標">
        <KpiCard
          label="總局數"
          value={String(dashboard.sessions.length)}
          detail={`${selectedDate === "all" ? gameDates.length : 1} 個遊戲日`}
          icon={<Layers3 size={18} />}
        />
        <KpiCard
          label="玩家數"
          value={String(dashboard.activePlayers.length)}
          detail="期間內活躍玩家"
          icon={<Users size={18} />}
        />
        <KpiCard
          label="戰績王"
          value={dashboard.pnlChampion?.playerName ?? "—"}
          detail={dashboard.pnlChampion ? formatPnl(dashboard.pnlChampion.totalPnl) : "—"}
          icon={<Trophy size={18} />}
          tone="accent"
        />
        <KpiCard
          label="每 100 局收益王"
          value={dashboard.bb100Champion?.playerName ?? "—"}
          detail={
            dashboard.bb100Champion
              ? `${formatBb100(dashboard.bb100Champion.bb100)} · ${dashboard.bb100Champion.playedSessions} 局`
              : `期間內無玩家達 ${GAME_CONFIG.minBb100Sessions} 局`
          }
          icon={<Trophy size={18} />}
          tone="accent"
        />
      </section>

      {latestSummary ? <LatestGameSummary summary={latestSummary} /> : null}

      <section className="surface equity-card">
        <div className="section-heading chart-heading">
          <div>
            <div className="section-kicker">PERFORMANCE CURVE</div>
            <h2>累積戰績</h2>
            <p>預設顯示總損益前 3 名 · 可從右側自由比較</p>
          </div>
          <details className="player-selector">
            <summary>
              玩家
              <span>{selectedPlayers.length}/{allPlayers.length}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <div className="player-selector-menu">
              <div className="selector-actions">
                <button type="button" onClick={() => setSelectedPlayers(defaultPlayers)}>
                  前三名
                </button>
                <button type="button" onClick={() => setSelectedPlayers(allPlayers)}>
                  全選
                </button>
                <button type="button" onClick={() => setSelectedPlayers([])}>
                  全不選
                </button>
              </div>
              {allPlayers.map((player) => {
                const checked = selectedPlayers.includes(player);
                return (
                  <label key={player}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlayer(player)}
                    />
                    <span className="custom-checkbox" aria-hidden="true">
                      {checked ? <Check size={12} /> : null}
                    </span>
                    {player}
                  </label>
                );
              })}
            </div>
          </details>
        </div>
        <EquityChartShell
          curve={dashboard.curve}
          allPlayers={allPlayers}
          selectedPlayers={selectedPlayers}
          onTogglePlayer={togglePlayer}
        />
      </section>

      <RecentFormLeaderboard
        entries={dashboard.recentForm}
        window={recentWindow === "all" ? 10 : recentWindow}
      />

      <StabilityLeaderboard entries={dashboard.stabilityLeaderboard} />

      <details className="secondary-analysis">
        <summary>
          <span>
            <strong>完整數據</strong>
            <small>總損益、每 100 局收益與每日戰績</small>
          </span>
          <span className="secondary-analysis-action">
            <span className="secondary-analysis-expand-label">展開查看</span>
            <span className="secondary-analysis-collapse-label">收合內容</span>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
        </summary>
        <div className="secondary-analysis-content">
          <div className="leaderboard-grid">
            <Leaderboard
              title="總損益排行榜"
              subtitle="依期間累積損益排序"
              entries={dashboard.pnlLeaderboard}
              metric="pnl"
            />
            <Leaderboard
              title="每 100 局大盲注收益排行榜"
              subtitle={`正式排名門檻 · 至少 ${GAME_CONFIG.minBb100Sessions} 局`}
              entries={dashboard.bb100Leaderboard}
              metric="bb100"
            />
          </div>
          <GameDayHeatmap records={records} dateRange={dashboard.dateRange} />
        </div>
      </details>
    </main>
  );
}
