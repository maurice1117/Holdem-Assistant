import rawSessionResults from "./session-results.json";

import { normalizePlayerName } from "../config/players";
import { getActiveSessionResults, isSupabaseConfigured } from "../lib/session-repository";
import { parseSessionResults } from "../lib/validation";
import type { SessionResult } from "../types/poker";

export const sessionResults = parseSessionResults(rawSessionResults).map((record) => ({
  ...record,
  player_name: normalizePlayerName(record.player_name),
}));

/**
 * Local development and first production boot use the checked-in dataset until
 * an admin publishes the first Supabase import.
 */
export async function getSessionResults(): Promise<SessionResult[]> {
  if (!isSupabaseConfigured()) return sessionResults;

  const activeResults = await getActiveSessionResults();
  return activeResults.length > 0 ? activeResults : sessionResults;
}
