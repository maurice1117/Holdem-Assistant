import type {
  DailyPlayerResult,
  DateRange,
  GameSession,
  SessionResult,
  SessionSummary,
} from "../types/poker";

export function getGlobalSessionKey(
  record: Pick<SessionResult, "game_date" | "session_number">,
): string {
  return `${record.game_date}::${record.session_number}`;
}

export function compareSessionResults(a: SessionResult, b: SessionResult): number {
  return (
    a.game_date.localeCompare(b.game_date) ||
    a.session_number - b.session_number ||
    a.player_name.localeCompare(b.player_name)
  );
}

export function filterRecordsByDate(
  records: SessionResult[],
  dateRange?: DateRange,
): SessionResult[] {
  if (!dateRange?.start && !dateRange?.end) return records;

  return records.filter(
    (record) =>
      (!dateRange.start || record.game_date >= dateRange.start) &&
      (!dateRange.end || record.game_date <= dateRange.end),
  );
}

export function getParticipatedRecords(
  records: SessionResult[],
  dateRange?: DateRange,
): SessionResult[] {
  return filterRecordsByDate(records, dateRange).filter((record) => record.participated);
}

export function getPlayers(records: SessionResult[], dateRange?: DateRange): string[] {
  return [...new Set(getParticipatedRecords(records, dateRange).map((record) => record.player_name))]
    .sort((a, b) => a.localeCompare(b));
}

export function getGameDates(records: SessionResult[], dateRange?: DateRange): string[] {
  return [...new Set(getParticipatedRecords(records, dateRange).map((record) => record.game_date))]
    .sort((a, b) => a.localeCompare(b));
}

export function getSessions(records: SessionResult[], dateRange?: DateRange): GameSession[] {
  const sessions = new Map<string, GameSession>();

  for (const record of getParticipatedRecords(records, dateRange).sort(compareSessionResults)) {
    const key = getGlobalSessionKey(record);
    const session = sessions.get(key) ?? {
      key,
      gameDate: record.game_date,
      sessionNumber: record.session_number,
      records: [],
    };
    session.records.push(record);
    sessions.set(key, session);
  }

  return [...sessions.values()];
}

export function getDailyPlayerResults(
  records: SessionResult[],
  dateRange?: DateRange,
): DailyPlayerResult[] {
  const dailyResults = new Map<string, DailyPlayerResult>();

  for (const record of getParticipatedRecords(records, dateRange)) {
    const key = `${record.player_name}::${record.game_date}`;
    const result = dailyResults.get(key) ?? {
      playerName: record.player_name,
      gameDate: record.game_date,
      pnl: 0,
      playedSessions: 0,
    };
    result.pnl += record.pnl;
    result.playedSessions += 1;
    dailyResults.set(key, result);
  }

  return [...dailyResults.values()].sort(
    (a, b) => a.gameDate.localeCompare(b.gameDate) || a.playerName.localeCompare(b.playerName),
  );
}

export function getSessionSummaries(
  records: SessionResult[],
  dateRange?: DateRange,
): SessionSummary[] {
  return getSessions(records, dateRange).map((session) => {
    const ordered = [...session.records].sort((a, b) => b.pnl - a.pnl);
    const largestWin = ordered[0]?.pnl ?? 0;
    const largestLoss = ordered.at(-1)?.pnl ?? 0;

    return {
      ...session,
      records: ordered,
      participantCount: ordered.length,
      winners: ordered.filter((record) => record.pnl === largestWin),
      losers: ordered.filter((record) => record.pnl === largestLoss),
      largestWin,
      largestLoss,
    };
  });
}
