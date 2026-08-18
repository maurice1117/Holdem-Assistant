import { describe, expect, it } from "vitest";

import { sessionResults } from "../data";
import type { SessionResult } from "../types/poker";
import { filterRecordsByDate, getGameDates, getPlayers, getSessions } from "./data";
import {
  getBb100Leaderboard,
  getCumulativePnl,
  getEquityCurve,
  getPlayerStats,
  getPnlLeaderboard,
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
    expect(sessionResults).toHaveLength(148);
    expect(getSessions(sessionResults)).toHaveLength(25);
    expect(getGameDates(sessionResults)).toHaveLength(3);
    expect(getPlayers(sessionResults)).toHaveLength(10);
  });

  it.each([
    ["我是你爸", 14, 1035, 1478.6, 0.571, 452.5, -250, 692.5],
    ["強的可怕", 25, 512.5, 410, 0.48, 270, -250, 457],
    ["KK之王", 25, 194, 155.2, 0.4, 385, -250, undefined],
    ["河牌幹死你", 11, 177.5, 322.7, 0.545, 447.5, -250, undefined],
    ["大舅哥", 14, 177.5, 253.6, 0.429, 130, -155, undefined],
    ["淡水金城武", 25, 39.5, 31.6, 0.48, 272.5, -250, undefined],
    ["Kai", 3, -205, -1366.7, 0.333, 57.5, -250, undefined],
    ["Z隕石毀滅者", 3, -210, -1400, 0.333, 162.5, -215, undefined],
    ["中", 14, -584.5, -835, 0.214, 72.5, -250, undefined],
    ["帥潮", 14, -1007.5, -1439.3, 0.286, 175, -250, undefined],
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
      ["我是你爸", 1],
      ["強的可怕", 2],
      ["KK之王", 3],
      ["大舅哥", 4],
      ["河牌幹死你", 4],
      ["淡水金城武", 6],
      ["Kai", 7],
      ["Z隕石毀滅者", 8],
      ["中", 9],
      ["帥潮", 10],
    ]);
  });

  it("leaves low-sample BB/100 players unranked", () => {
    const leaderboard = getBb100Leaderboard(sessionResults);
    expect(leaderboard.filter((entry) => entry.isQualified).map((entry) => entry.playerName))
      .toEqual(["我是你爸", "強的可怕", "河牌幹死你", "大舅哥", "KK之王", "淡水金城武", "中", "帥潮"]);
    expect(leaderboard.find((entry) => entry.playerName === "Kai")).toMatchObject({
      playedSessions: 3,
      rank: null,
      isQualified: false,
    });
    expect(leaderboard.find((entry) => entry.playerName === "Z隕石毀滅者")).toMatchObject({
      playedSessions: 3,
      rank: null,
      isQualified: false,
    });
  });

  it("keeps WARNING records in all calculations", () => {
    const warningPnl = sessionResults
      .filter((item) => item.session_status === "WARNING" && item.player_name === "強的可怕")
      .reduce((sum, item) => sum + item.pnl, 0);
    expect(warningPnl).toBe(349.5);
    expect(getPlayerStats(sessionResults, "強的可怕").totalPnl).toBe(512.5);
  });

  it("finds the tied largest loss without assigning one player", () => {
    const largestLoss = Math.min(...sessionResults.map((item) => item.pnl));
    expect(largestLoss).toBe(-250);
    expect(sessionResults.filter((item) => item.pnl === largestLoss)).toHaveLength(19);
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
      sessionStdDev: null,
      stdBB100: null,
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
    expect(getSessions(august)).toHaveLength(14);
    expect(getGameDates(august)).toEqual(["2026-08-15"]);
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
});
