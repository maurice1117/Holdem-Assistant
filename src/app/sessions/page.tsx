import { SessionsPage } from "@/components/sessions/sessions-page";
import { getSessionResults } from "@/data";

export const dynamic = "force-dynamic";

export default async function SessionsRoute() {
  return <SessionsPage records={await getSessionResults()} />;
}
