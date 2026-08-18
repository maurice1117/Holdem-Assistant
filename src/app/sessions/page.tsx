import { SessionsPage } from "@/components/sessions/sessions-page";
import { sessionResults } from "@/data";

export default function SessionsRoute() {
  return <SessionsPage records={sessionResults} />;
}
