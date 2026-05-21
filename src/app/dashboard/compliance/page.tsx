import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { CompliancePageContent, DashboardFrame, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="compliance" data={data}>
      <CompliancePageContent data={data} />
    </DashboardFrame>
  );
}
