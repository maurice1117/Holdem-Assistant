import rawSessionResults from "./session-results.json";

import { normalizePlayerName } from "../config/players";
import { parseSessionResults } from "../lib/validation";

export const sessionResults = parseSessionResults(rawSessionResults).map((record) => ({
  ...record,
  player_name: normalizePlayerName(record.player_name),
}));
