import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "../data";
import { DashboardFrame, ReservationsPageContent, SetupScreen } from "../ui";

export const dynamic = "force-dynamic";

export default async function ReservationsPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="reservations" data={data}>
      <ReservationsPageContent data={data} />
    </DashboardFrame>
  );
}
