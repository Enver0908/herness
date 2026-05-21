import { isAppConfigured } from "@/lib/env";
import { requireDashboardData } from "./data";
import {
  DashboardFrame,
  EmptyState,
  OperationsSummary,
  RecentMessages,
  SetupScreen,
} from "./ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isAppConfigured()) return <SetupScreen />;
  const data = await requireDashboardData();

  return (
    <DashboardFrame active="overview" data={data}>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <OperationsSummary data={data} />
        <RecentMessages conversations={data.conversations.slice(0, 4)} />
      </div>
      <section className="panel">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Today&apos;s focus</h2>
        </div>
        <div className="panel-body grid gap-3 md:grid-cols-3">
          <FocusTile label="Open cases" value={String(data.operationCases.filter((c) => c.status === "open").length)} />
          <FocusTile label="Pending tasks" value={String(data.operationTasks.filter((t) => t.status === "pending").length)} />
          <FocusTile label="Missing compliance" value={String(data.complianceRecords.filter((r) => r.status === "missing").length)} />
        </div>
      </section>
      {data.properties.length === 0 ? (
        <EmptyState text="Start by adding a property from the Properties page." />
      ) : null}
    </DashboardFrame>
  );
}

function FocusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-3">
      <p className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
