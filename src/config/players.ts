const PLAYER_ALIASES: Record<string, string> = {
  Kai: "大舅哥",
};

export function normalizePlayerName(playerName: string): string {
  return PLAYER_ALIASES[playerName] ?? playerName;
}
