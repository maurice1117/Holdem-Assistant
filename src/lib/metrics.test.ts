import { describe, expect, it } from "vitest";

import { sessionResults } from "../data";
import type { SessionResult } from "../types/poker";
import { filterRecordsByDate, getGameDates, getPlayers, getSessions } from "./data";
import {
  getBb100Leaderboard,
  getCumulativePnl,
  getEquityCurve,
  getPlayerTrend,
  getPlayerStats,
  getPnlLeaderboard,
  getRecentFormLeaderboard,
  getStabilityLeaderboard,
  getLatestGameDaySummary,
  filterRecentRecords,
} from "./metrics";

const record = (
  gameDate: string,
  sessionNumber: number,
  playerName: string,
  pnl: number,
  participated = true,
): SessionResult => ({
  game_date: gameDate,
  session_number: sessionNumber,
  player_name: playerName,
  pnl,
  participated,
});

describe("acceptance dataset", () => {
  it("contains the complete Clean_SessionResults baseline", () => {
    expect(sessionResults).toHaveLength(332);
    expect(getSessions(sessionResults)).toHaveLength(58);
    expect(getGameDates(sessionResults)).toHaveLength(6);
    expect(getPlayers(sessionResults)).toHaveLength(14);
  });

  it.each([
    ["6669", 8, 707.5, 1768.8, 0.5, 540, -250, 757.5],
    ["KK之王", 57, 6.5, 2.3, 0.456, 420, -250, 860],
    ["PPAW", 8, -877.5, -2193.75, 0.25, 105, -250, 877.5],
    ["z隕石毀滅者", 26, -33.5, -25.8, 0.5, 350, -250, 825],
    ["中", 23, -434.5, -377.8, 0.348, 250, -250, 882.5],
    ["大舅哥", 37, -880, -475.7, 0.378, 470, -250, 880],
    ["威", 4, -497.5, -2487.5, 0, -32.5, -250, 497.5],
    ["小騷屄", 2, 435, 4350, 1, 300, 135, 0],
    ["帥潮", 14, -1007.5, -1439.3, 0.286, 175, -250, 1007.5],
    ["強的可怕", 57, 1305, 457.9, 0.526, 327.5, -250, 565],
    ["我是你爸", 22, 607.5, 552.3, 0.5, 452.5, -250, 1142.5],
    ["河牌幹死你", 25, -478, -382.4, 0.48, 447.5, -250, 1235.5],
    ["淡水金城武", 47, 1156.5, 492.1, 0.574, 457.5, -250, 662.5],
    ["葉", 2, 119.5, 1195, 1, 92, 27.5, 0],
  ])(
    "calculates metrics for %s",
    (player, sessions, pnl, bb100, winRate, best, worst, maxDrawdown) => {
      const stats = getPlayerStats(sessionResults, player as string);
      expect(stats.playedSessions).toBe(sessions);
      expect(stats.totalPnl).toBe(pnl);
      expect(stats.bb100).toBeCloseTo(bb100 as number, 1);
      expect(stats.winRate).toBeCloseTo(winRate as number, 2);
      expect(stats.bestSession?.pnl).toBe(best);
      expect(stats.worstSession?.pnl).toBe(worst);
      if (maxDrawdown !== undefined) expect(stats.maxDrawdown).toBe(maxDrawdown);
    },
  );

  it("uses competition ranking for P&L ties", () => {
    const leaderboard = getPnlLeaderboard(sessionResults);
    expect(leaderboard.map(({ playerName, rank }) => [playerName, rank])).toEqual([
      ["強的可怕", 1],
      ["淡水金城武", 2],
      ["6669", 3],
      ["我是你爸", 4],
      ["小騷屄", 5],
      ["葉", 6],
      ["KK之王", 7],
      ["z隕石毀滅者", 8],
      ["中", 9],
      ["河牌幹死你", 10],
      ["威", 11],
      ["PPAW", 12],
      ["大舅哥", 13],
      ["帥潮", 14],
    ]);
  });

  it("leaves low-sample BB/100 players unranked", () => {
    const leaderboard = getBb100Leaderboard(sessionResults);
    expect(leaderboard.filter((entry) => entry.isQualified).map((entry) => entry.playerName))
      .toEqual(["我是你爸", "淡水金城武", "強的可怕", "KK之王", "z隕石毀滅者", "中", "河牌幹死你", "大舅哥", "帥潮"]);
    expect(leaderboard.find((entry) => entry.playerName === "大舅哥")).toMatchObject({
      playedSessions: 37,
      rank: 8,
      isQualified: true,
    });
    expect(leaderboard.find((entry) => entry.playerName === "6669")).toMatchObject({
      playedSessions: 8,
      rank: null,
      isQualified: false,
    });
  });

  it("combines Kai records under the canonical 大舅哥 player identity", () => {
    expect(sessionResults.some((record) => record.player_name === "Kai")).toBe(false);
    expect(getPlayerStats(sessionResults, "大舅哥")).toMatchObject({
      playedSessions: 37,
      totalPnl: -880,
    });
  });

  it("keeps WARNING records in all calculations", () => {
    const warningPnl = sessionResults
      .filter((item) => item.session_status === "WARNING" && item.player_name === "強的可怕")
      .reduce((sum, item) => sum + item.pnl, 0);
    expect(warningPnl).toBe(349.5);
    expect(getPlayerStats(sessionResults, "強的可怕").totalPnl).toBe(1305);
  });

  it("finds the tied largest loss without assigning one player", () => {
    const largestLoss = Math.min(...sessionResults.map((item) => item.pnl));
    expect(largestLoss).toBe(-250);
    expect(sessionResults.filter((item) => item.pnl === largestLoss)).toHaveLength(47);
  });
});

describe("metric rules", () => {
  it("counts pushes in win-rate denominator and breaks streaks", () => {
    const records = [
      record("2026-01-01", 1, "A", 10),
      record("2026-01-01", 2, "A", 20),
      record("2026-01-01", 3, "A", 0),
      record("2026-01-01", 4, "A", -5),
      record("2026-01-01", 5, "A", -10),
      record("2026-01-01", 6, "A", -15),
    ];
    const stats = getPlayerStats(records, "A");

    expect(stats).toMatchObject({
      wins: 2,
      losses: 3,
      pushes: 1,
      longestWinStreak: 2,
      longestLossStreak: 3,
      currentStreak: { type: "loss", count: 3 },
    });
    expect(stats.winRate).toBeCloseTo(2 / 6);
  });

  it("measures drawdown from an initial peak of zero", () => {
    const records = [
      record("2026-01-01", 1, "A", -20),
      record("2026-01-01", 2, "A", 5),
      record("2026-01-01", 3, "A", -10),
    ];
    expect(getPlayerStats(records, "A")).toMatchObject({
      peakPnl: 0,
      currentDrawdown: 25,
      maxDrawdown: 25,
    });
  });

  it("uses sample deviation and the configured bust threshold", () => {
    const records = [
      record("2026-01-01", 1, "A", -250),
      record("2026-01-01", 2, "A", -249.5),
    ];
    const stats = getPlayerStats(records, "A");

    expect(stats.bustCount).toBe(1);
    expect(stats.sessionStdDev).toBeCloseTo(Math.sqrt(0.125));
    expect(stats.stdBB100).toBeCloseTo((Math.sqrt(0.125) / 5) * 10);
  });

  it("returns null ratios for a player with no sessions", () => {
    expect(getPlayerStats([], "Nobody")).toMatchObject({
      playedSessions: 0,
      bb100: null,
      winRate: null,
      averagePnl: null,
      medianPnl: null,
      profitFactor: null,
      sessionStdDev: null,
      stdBB100: null,
      bustRate: null,
    });
  });

  it("ignores records where participated is false", () => {
    const records = [
      record("2026-01-01", 1, "A", 10),
      record("2026-01-01", 2, "A", 999, false),
    ];
    expect(getPlayerStats(records, "A")).toMatchObject({ playedSessions: 1, totalPnl: 10 });
  });

  it("calculates chronological cumulative P&L", () => {
    const records = [
      record("2026-01-02", 1, "A", -3),
      record("2026-01-01", 2, "A", 5),
      record("2026-01-01", 1, "A", 10),
    ];
    expect(getCumulativePnl(records, "A").map((point) => point.cumulativePnl)).toEqual([10, 15, 12]);
  });

  it("filters date ranges inclusively", () => {
    const august = filterRecordsByDate(sessionResults, {
      start: "2026-08-01",
      end: "2026-08-31",
    });
    expect(getSessions(august)).toHaveLength(26);
    expect(getGameDates(august)).toEqual(["2026-08-15", "2026-08-29"]);
  });

  it("carries P&L forward when a player misses a global session", () => {
    const records = [
      record("2026-01-01", 1, "A", 10),
      record("2026-01-01", 1, "B", -10),
      record("2026-01-01", 2, "B", 5),
    ];
    const curve = getEquityCurve(records);

    expect(curve[1].players.A).toEqual({
      participated: false,
      sessionPnl: null,
      cumulativePnl: 10,
    });
    expect(getPlayerStats(records, "A").playedSessions).toBe(1);
  });

  it("calculates transparent stability metrics", () => {
    const records = [
      record("2026-01-01", 1, "A", 20),
      record("2026-01-01", 2, "A", -10),
      record("2026-01-01", 3, "A", 30),
      record("2026-01-01", 4, "A", -250),
    ];

    expect(getPlayerStats(records, "A")).toMatchObject({
      medianPnl: 5,
      profitFactor: 50 / 260,
      bustCount: 1,
      bustRate: 0.25,
    });
  });

  it("ranks only profitable players with enough sessions for stability", () => {
    const profitable = Array.from({ length: 10 }, (_, index) =>
      record("2026-01-01", index + 1, "A", index === 0 ? -10 : 5),
    );
    const losing = Array.from({ length: 10 }, (_, index) =>
      record("2026-01-01", index + 1, "B", index === 0 ? 5 : -5),
    );

    const leaderboard = getStabilityLeaderboard([...profitable, ...losing]);
    expect(leaderboard[0]).toMatchObject({ playerName: "A", rank: 1, isQualified: true });
    expect(leaderboard[1]).toMatchObject({ playerName: "B", rank: null, isQualified: false });
  });

  it("summarizes the latest game day and detects new highs", () => {
    const records = [
      record("2026-01-01", 1, "A", -20),
      record("2026-01-01", 1, "B", 20),
      record("2026-01-02", 1, "A", 30),
      record("2026-01-02", 1, "B", -30),
      record("2026-01-02", 2, "A", 10),
      record("2026-01-02", 2, "B", -10),
    ];

    expect(getLatestGameDaySummary(records)).toMatchObject({
      gameDate: "2026-01-02",
      sessionCount: 2,
      participantCount: 2,
      dayChampion: { playerName: "A", pnl: 40 },
      largestWin: { player_name: "A", pnl: 30 },
      largestLoss: { player_name: "B", pnl: -30 },
      biggestRiser: { playerName: "A", positions: 1, currentRank: 1 },
      newHighPlayers: ["A"],
      activeStreaks: [
        { playerName: "A", type: "win", count: 2 },
        { playerName: "B", type: "loss", count: 2 },
      ],
    });
  });

  it("returns null when no participated records exist", () => {
    expect(getLatestGameDaySummary([])).toBeNull();
  });

  it("keeps each player's most recent participating sessions", () => {
    const records = [
      record("2026-01-01", 1, "A", 10),
      record("2026-01-01", 1, "B", -10),
      record("2026-01-01", 2, "A", 20),
      record("2026-01-01", 3, "B", 5),
      record("2026-01-01", 4, "A", 30),
    ];

    expect(filterRecentRecords(records, 2).map((item) => [item.player_name, item.session_number]))
      .toEqual([["B", 1], ["A", 2], ["B", 3], ["A", 4]]);
  });

  it("calculates rolling average and drawdown points", () => {
    const records = [
      record("2026-01-01", 1, "A", 10),
      record("2026-01-01", 2, "A", -4),
      record("2026-01-01", 3, "A", -8),
    ];

    expect(getPlayerTrend(records, "A", 2)).toMatchObject([
      { rollingAverage: 10, drawdown: 0 },
      { rollingAverage: 3, drawdown: 4 },
      { rollingAverage: -6, drawdown: 12 },
    ]);
  });

  it("compares recent average P&L with the preceding window", () => {
    const records = [
      record("2026-01-01", 1, "A", -10),
      record("2026-01-01", 2, "A", 0),
      record("2026-01-01", 3, "A", 10),
      record("2026-01-01", 4, "A", 20),
    ];

    expect(getRecentFormLeaderboard(records, 2)[0]).toMatchObject({
      playerName: "A",
      playedSessions: 2,
      totalPnl: 30,
      previousAveragePnl: -5,
      averagePnlChange: 20,
      isQualified: true,
    });
  });
});
