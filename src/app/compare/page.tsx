import { PlayerComparison } from "@/components/compare/player-comparison";
import { getSessionResults } from "@/data";

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  return <PlayerComparison records={await getSessionResults()} />;
}
