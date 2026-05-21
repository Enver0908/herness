import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { DashboardFrame, PropertiesPageContent, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="properties" data={data}>
      <PropertiesPageContent data={data} />
    </DashboardFrame>
  );
}
