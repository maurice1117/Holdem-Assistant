import { notFound } from "next/navigation";

import { PlayerDetail } from "@/components/players/player-detail";
import { sessionResults } from "@/data";
import { getPlayers } from "@/lib/data";

interface PlayerPageProps {
  params: Promise<{
    playerSlug: string;
  }>;
}

export function generateStaticParams() {
  return getPlayers(sessionResults).map((playerName) => ({
    playerSlug: playerName,
  }));
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { playerSlug } = await params;
  const playerName = decodeURIComponent(playerSlug);

  if (!getPlayers(sessionResults).includes(playerName)) {
    notFound();
  }

  return <PlayerDetail playerName={playerName} records={sessionResults} />;
}
