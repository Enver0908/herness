import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { DashboardFrame, KnowledgePageContent, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="knowledge" data={data}>
      <KnowledgePageContent data={data} />
    </DashboardFrame>
  );
}
