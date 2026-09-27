import { notFound } from "next/navigation";

import { PlayerDetail } from "@/components/players/player-detail";
import { getSessionResults } from "@/data";
import { getPlayers } from "@/lib/data";

interface PlayerPageProps {
  params: Promise<{
    playerSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerSlug } = await params;
  const playerName = decodeURIComponent(playerSlug);
  const sessionResults = await getSessionResults();

  if (!getPlayers(sessionResults).includes(playerName)) {
    notFound();
  }

  return <PlayerDetail playerName={playerName} records={sessionResults} />;
}
