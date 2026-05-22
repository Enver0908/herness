import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { SyncPageContent, DashboardFrame, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="sync" data={data}>
      <SyncPageContent data={data} />
    </DashboardFrame>
  );
}
