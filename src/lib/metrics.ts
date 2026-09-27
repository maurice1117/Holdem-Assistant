import { GAME_CONFIG } from "../config/game";
import type {
  CumulativePnlPoint,
  DateRange,
  EquityCurvePoint,
  PlayerStats,
  PlayerTrendPoint,
  RankedPlayerStats,
  RecentFormEntry,
  RecentWindow,
  SessionResult,
} from "../types/poker";
import {
  compareSessionResults,
  getParticipatedRecords,
  getPlayers,
  getSessions,
} from "./data";

function getPlayerRecords(records: SessionResult[], playerName: string): SessionResult[] {
  return records
    .filter((record) => record.participated && record.player_name === playerName)
    .sort(compareSessionResults);
}

export function filterRecentRecords(
  records: SessionResult[],
  recentWindow: RecentWindow | number,
): SessionResult[] {
  if (recentWindow === "all") return records;

  const recentKeysByPlayer = new Map<string, Set<string>>();
  for (const player of getPlayers(records)) {
    const recent = getPlayerRecords(records, player).slice(-recentWindow);
    recentKeysByPlayer.set(
      player,
      new Set(recent.map((record) => `${record.game_date}#${record.session_number}`)),
    );
  }

  return records.filter((record) =>
    recentKeysByPlayer
      .get(record.player_name)
      ?.has(`${record.game_date}#${record.session_number}`),
  );
}

function sampleStandardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function getCumulativePnl(
  records: SessionResult[],
  playerName: string,
): CumulativePnlPoint[] {
  let cumulativePnl = 0;

  return getPlayerRecords(records, playerName).map((record) => {
    cumulativePnl += record.pnl;
    return {
      gameDate: record.game_date,
      sessionNumber: record.session_number,
      sessionPnl: record.pnl,
      cumulativePnl,
    };
  });
}

export function getPlayerTrend(
  records: SessionResult[],
  playerName: string,
  rollingWindow = 5,
): PlayerTrendPoint[] {
  const playerRecords = getPlayerRecords(records, playerName);
  let cumulativePnl = 0;
  let runningPeak = 0;

  return playerRecords.map((record, index) => {
    cumulativePnl += record.pnl;
    runningPeak = Math.max(runningPeak, cumulativePnl);
    const windowRecords = playerRecords.slice(Math.max(0, index - rollingWindow + 1), index + 1);

    return {
      gameDate: record.game_date,
      sessionNumber: record.session_number,
      sessionPnl: record.pnl,
      cumulativePnl,
      rollingAverage:
        windowRecords.reduce((sum, item) => sum + item.pnl, 0) / windowRecords.length,
      drawdown: runningPeak - cumulativePnl,
    };
  });
}

export function getPlayerStats(
  records: SessionResult[],
  playerName: string,
): PlayerStats {
  const playerRecords = getPlayerRecords(records, playerName);
  const playedSessions = playerRecords.length;
  const totalPnl = playerRecords.reduce((sum, record) => sum + record.pnl, 0);
  const totalBB = totalPnl / GAME_CONFIG.bigBlind;
  const wins = playerRecords.filter((record) => record.pnl > 0).length;
  const losses = playerRecords.filter((record) => record.pnl < 0).length;
  const pushes = playedSessions - wins - losses;

  let cumulativePnl = 0;
  let runningPeak = 0;
  let peakPnl = 0;
  let maxDrawdown = 0;
  let longestWinStreak = 0;
  let longestLossStreak = 0;
  let activeType: "win" | "loss" | "none" = "none";
  let activeCount = 0;

  for (const record of playerRecords) {
    cumulativePnl += record.pnl;
    runningPeak = Math.max(runningPeak, cumulativePnl);
    peakPnl = Math.max(peakPnl, cumulativePnl);
    maxDrawdown = Math.max(maxDrawdown, runningPeak - cumulativePnl);

    const resultType = record.pnl > 0 ? "win" : record.pnl < 0 ? "loss" : "none";
    if (resultType === "none") {
      activeType = "none";
      activeCount = 0;
    } else if (resultType === activeType) {
      activeCount += 1;
    } else {
      activeType = resultType;
      activeCount = 1;
    }
    if (activeType === "win") longestWinStreak = Math.max(longestWinStreak, activeCount);
    if (activeType === "loss") longestLossStreak = Math.max(longestLossStreak, activeCount);
  }

  const sessionStdDev = sampleStandardDeviation(playerRecords.map((record) => record.pnl));

  return {
    playerName,
    playedSessions,
    totalPnl,
    totalBB,
    bb100: playedSessions === 0 ? null : (totalBB / playedSessions) * 100,
    wins,
    losses,
    pushes,
    winRate: playedSessions === 0 ? null : wins / playedSessions,
    averagePnl: playedSessions === 0 ? null : totalPnl / playedSessions,
    bestSession:
      playerRecords.reduce<SessionResult | null>(
        (best, record) => (!best || record.pnl > best.pnl ? record : best),
        null,
      ),
    worstSession:
      playerRecords.reduce<SessionResult | null>(
        (worst, record) => (!worst || record.pnl < worst.pnl ? record : worst),
        null,
      ),
    peakPnl,
    currentDrawdown: runningPeak - cumulativePnl,
    maxDrawdown,
    sessionStdDev,
    stdBB100:
      sessionStdDev === null ? null : (sessionStdDev / GAME_CONFIG.bigBlind) * Math.sqrt(100),
    longestWinStreak,
    longestLossStreak,
    currentStreak: { type: activeType, count: activeCount },
    bustCount: playerRecords.filter((record) => record.pnl <= GAME_CONFIG.bustThreshold).length,
  };
}

function rankStats(
  stats: PlayerStats[],
  value: (stats: PlayerStats) => number,
): RankedPlayerStats[] {
  const sorted = [...stats].sort(
    (a, b) => value(b) - value(a) || a.playerName.localeCompare(b.playerName),
  );

  let currentRank = 0;

  return sorted.map((playerStats, index) => {
    if (index === 0 || value(playerStats) !== value(sorted[index - 1])) {
      currentRank = index + 1;
    }
    return { ...playerStats, rank: currentRank, isQualified: true };
  });
}

export function getPnlLeaderboard(
  records: SessionResult[],
  dateRange?: DateRange,
): RankedPlayerStats[] {
  const filtered = getParticipatedRecords(records, dateRange);
  return rankStats(
    getPlayers(filtered).map((playerName) => getPlayerStats(filtered, playerName)),
    (stats) => stats.totalPnl,
  );
}

export function getBb100Leaderboard(
  records: SessionResult[],
  dateRange?: DateRange,
): RankedPlayerStats[] {
  const filtered = getParticipatedRecords(records, dateRange);
  const stats = getPlayers(filtered).map((playerName) => getPlayerStats(filtered, playerName));
  const qualified = rankStats(
    stats.filter((playerStats) => playerStats.playedSessions >= GAME_CONFIG.minBb100Sessions),
    (playerStats) => playerStats.bb100 ?? Number.NEGATIVE_INFINITY,
  );
  const lowSample = stats
    .filter((playerStats) => playerStats.playedSessions < GAME_CONFIG.minBb100Sessions)
    .sort((a, b) => (b.bb100 ?? -Infinity) - (a.bb100 ?? -Infinity))
    .map((playerStats) => ({
      ...playerStats,
      rank: null,
      isQualified: false,
    }));

  return [...qualified, ...lowSample];
}

export function getRecentFormLeaderboard(
  records: SessionResult[],
  recentWindow: number,
): RecentFormEntry[] {
  const entries = getPlayers(records).map((playerName) => {
    const playerRecords = getPlayerRecords(records, playerName);
    const recentRecords = playerRecords.slice(-recentWindow);
    const previousRecords = playerRecords.slice(-recentWindow * 2, -recentWindow);
    const stats = getPlayerStats(recentRecords, playerName);
    const previousAveragePnl =
      previousRecords.length === 0
        ? null
        : previousRecords.reduce((sum, record) => sum + record.pnl, 0) /
          previousRecords.length;

    return {
      ...stats,
      rank: 0,
      isQualified: recentRecords.length >= recentWindow,
      previousAveragePnl,
      averagePnlChange:
        previousAveragePnl === null || stats.averagePnl === null
          ? null
          : stats.averagePnl - previousAveragePnl,
    };
  });

  return entries
    .sort((a, b) => b.totalPnl - a.totalPnl || a.playerName.localeCompare(b.playerName))
    .map((entry, index, sorted) => ({
      ...entry,
      rank:
        index > 0 && entry.totalPnl === sorted[index - 1].totalPnl
          ? sorted[index - 1].rank
          : index + 1,
    }));
}

export function getEquityCurve(
  records: SessionResult[],
  dateRange?: DateRange,
): EquityCurvePoint[] {
  const filtered = getParticipatedRecords(records, dateRange);
  const players = getPlayers(filtered);
  const cumulativeByPlayer = new Map(players.map((player) => [player, 0]));

  return getSessions(filtered).map((session) => {
    const recordsByPlayer = new Map(
      session.records.map((record) => [record.player_name, record]),
    );
    const playerPoints = Object.fromEntries(
      players.map((player) => {
        const record = recordsByPlayer.get(player);
        const cumulativePnl = (cumulativeByPlayer.get(player) ?? 0) + (record?.pnl ?? 0);
        cumulativeByPlayer.set(player, cumulativePnl);
        return [
          player,
          {
            participated: Boolean(record),
            sessionPnl: record?.pnl ?? null,
            cumulativePnl,
          },
        ];
      }),
    );

    return {
      key: session.key,
      gameDate: session.gameDate,
      sessionNumber: session.sessionNumber,
      players: playerPoints,
    };
  });
}
