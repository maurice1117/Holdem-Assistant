export function getPlayerHref(playerName: string): string {
  return `/players/${encodeURIComponent(playerName)}`;
}
