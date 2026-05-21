import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { DashboardFrame, MessagesPageContent, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="messages" data={data}>
      <MessagesPageContent data={data} />
    </DashboardFrame>
  );
}
