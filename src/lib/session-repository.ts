import { normalizePlayerName } from "../config/players";
import type { SessionResult } from "../types/poker";

import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { parseSessionResults } from "./validation";

interface DatabaseSessionResult {
  game_date: string;
  session_number: number;
  player_name: string;
  pnl: number;
  participated: boolean;
  source_sheet: string | null;
  source_row: number | null;
  session_status: "VALID" | "WARNING" | null;
  source_player_name: string | null;
}

export { isSupabaseConfigured };

export async function getActiveSessionResults(): Promise<SessionResult[]> {
  const supabase = getSupabaseAdmin();
  const { data: setting, error: settingError } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "active_import_version_id")
    .maybeSingle();

  if (settingError) throw settingError;
  const versionId = setting?.value?.version_id;
  if (typeof versionId !== "string") return [];

  const { data, error } = await supabase
    .from("session_results")
    .select("game_date, session_number, player_name, pnl, participated, source_sheet, source_row, session_status, source_player_name")
    .eq("import_version_id", versionId)
    .order("game_date")
    .order("session_number")
    .order("player_name");

  if (error) throw error;

  return parseSessionResults((data as DatabaseSessionResult[]).map((record) => ({
    ...record,
    source_sheet: record.source_sheet ?? undefined,
    source_row: record.source_row ?? undefined,
    session_status: record.session_status ?? undefined,
    source_player_name: record.source_player_name ?? undefined,
    player_name: normalizePlayerName(record.player_name),
  })));
}
