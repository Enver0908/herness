import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { SettingsPageContent, DashboardFrame, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="settings" data={data}>
      <SettingsPageContent data={data} />
    </DashboardFrame>
  );
}
