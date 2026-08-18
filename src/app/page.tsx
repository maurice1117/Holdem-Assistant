import { Dashboard } from "@/components/dashboard/dashboard";
import { sessionResults } from "@/data";

export default function HomePage() {
  return <Dashboard records={sessionResults} />;
}
