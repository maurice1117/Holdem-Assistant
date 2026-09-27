import { Dashboard } from "@/components/dashboard/dashboard";
import { getSessionResults } from "@/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <Dashboard records={await getSessionResults()} />;
}
