import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "./data";
import {
  DashboardFrame,
  EmptyState,
  OperationsPerformance,
  RecentActivityFeed,
  SetupScreen,
} from "./ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="overview" data={data}>
      {/* Dashboard Overview Title row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">Dashboard Overview</h1>
          <p className="text-xs text-[var(--text-tertiary)]">Welcome back, Jana! (Last updated 2 mins ago)</p>
        </div>
        <div className="text-xs font-semibold text-[var(--text-muted)] bg-white/5 border border-white/10 rounded-md px-3 py-1.5 backdrop-blur-sm">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* Main Grid: SVG Performance trends and timeline feed */}
      <div className="grid gap-5 lg:grid-cols-[2.1fr_0.9fr]">
        <OperationsPerformance data={data} />
        <RecentActivityFeed data={data} />
      </div>

      {data.properties.length === 0 ? (
        <EmptyState text="Start by adding a property from the Properties page." />
      ) : null}
    </DashboardFrame>
  );
}
