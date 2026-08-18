export interface SessionResult {
  game_date: string;
  session_number: number;
  player_name: string;
  pnl: number;
  participated: boolean;
  source_sheet?: string;
  source_row?: number;
  session_status?: "VALID" | "WARNING";
}

export interface DateRange {
  start?: string;
  end?: string;
}

export interface GameSession {
  key: string;
  gameDate: string;
  sessionNumber: number;
  records: SessionResult[];
}

export interface CumulativePnlPoint {
  gameDate: string;
  sessionNumber: number;
  sessionPnl: number;
  cumulativePnl: number;
}

export interface EquityCurvePlayerPoint {
  participated: boolean;
  sessionPnl: number | null;
  cumulativePnl: number;
}

export interface EquityCurvePoint {
  key: string;
  gameDate: string;
  sessionNumber: number;
  players: Record<string, EquityCurvePlayerPoint>;
}

export interface PlayerStats {
  playerName: string;
  playedSessions: number;
  totalPnl: number;
  totalBB: number;
  bb100: number | null;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number | null;
  averagePnl: number | null;
  bestSession: SessionResult | null;
  worstSession: SessionResult | null;
  peakPnl: number;
  currentDrawdown: number;
  maxDrawdown: number;
  sessionStdDev: number | null;
  stdBB100: number | null;
  longestWinStreak: number;
  longestLossStreak: number;
  currentStreak: {
    type: "win" | "loss" | "none";
    count: number;
  };
  bustCount: number;
}

export interface RankedPlayerStats extends PlayerStats {
  rank: number | null;
  isQualified: boolean;
}

export interface DailyPlayerResult {
  playerName: string;
  gameDate: string;
  pnl: number;
  playedSessions: number;
}

export interface SessionSummary extends GameSession {
  participantCount: number;
  winners: SessionResult[];
  losers: SessionResult[];
  largestWin: number;
  largestLoss: number;
}
