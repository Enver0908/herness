import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  Info,
  LogOut,
  LockKeyhole,
  MessageSquareText,
  Plus,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { DashboardData } from "@/lib/types";
import {
  approveAiDraft,
  approveCompliance,
  createKnowledgeDocument,
  createProperty,
  createReservation,
  deleteKnowledgeDocument,
  deleteProperty,
  deleteReservation,
  generateAiDraft,
  markComplianceExported,
  resetCompliance,
  runAiAutomation,
  toggleKnowledgeApproval,
  updateKnowledgeDocument,
  updateProperty,
  updateReservation,
} from "./actions";

type NavKey = "overview" | "compliance" | "messages" | "reservations" | "properties" | "knowledge";

const navItems: { href: string; key: NavKey; label: string }[] = [
  { href: "/dashboard", key: "overview", label: "Overview" },
  { href: "/dashboard/compliance", key: "compliance", label: "Compliance" },
  { href: "/dashboard/messages", key: "messages", label: "Messages" },
  { href: "/dashboard/reservations", key: "reservations", label: "Reservations" },
  { href: "/dashboard/properties", key: "properties", label: "Properties" },
  { href: "/dashboard/knowledge", key: "knowledge", label: "Knowledge" },
];

const statusStyles: Record<string, string> = {
  auto_sent: "bg-[var(--accent-green-soft)] text-[var(--accent-green)]",
  needs_review: "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]",
  draft: "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]",
  resolved: "bg-[var(--accent-slate-soft)] text-[var(--accent-slate)]",
};

const complianceStyles: Record<string, string> = {
  missing: "bg-[var(--accent-red-soft)] text-[var(--accent-red)]",
  submitted: "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]",
  approved: "bg-[var(--accent-green-soft)] text-[var(--accent-green)]",
  exported: "bg-[var(--accent-slate-soft)] text-[var(--accent-slate)]",
};

const riskStyles: Record<string, string> = {
  high: "bg-[var(--accent-red-soft)] text-[var(--accent-red)]",
  low: "bg-[var(--accent-green-soft)] text-[var(--accent-green)]",
  medium: "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]",
};

const deliveryStyles: Record<string, string> = {
  delivered: "bg-[var(--accent-green-soft)] text-[var(--accent-green)]",
  failed: "bg-[var(--accent-red-soft)] text-[var(--accent-red)]",
  not_sent: "bg-[var(--accent-slate-soft)] text-[var(--accent-slate)]",
  queued: "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]",
  sent: "bg-[var(--accent-green-soft)] text-[var(--accent-green)]",
  simulated: "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]",
};

export function DashboardFrame({ active, children, data }: { active: NavKey; children: ReactNode; data: DashboardData }) {
  const firstGuestToken = data.complianceRecords.find((r) => r.checkInToken)?.checkInToken;

  return (
    <main className="min-h-screen bg-[var(--bg-page)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-blue)]">
              <ShieldCheck aria-hidden="true" className="text-white" size={16} />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium text-[var(--text-muted)]">{data.organizationName}</p>
              <h1 className="text-sm font-semibold text-[var(--text-primary)]">HostOps CZ</h1>
            </div>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link className={item.key === active ? "nav-link nav-link-active" : "nav-link"} href={item.href} key={item.key} prefetch={false}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {firstGuestToken ? (
              <Link className="btn-primary hidden text-xs sm:inline-flex" href={`/guest/check-in/${firstGuestToken}`}>
                Guest form <ArrowUpRight aria-hidden="true" size={13} />
              </Link>
            ) : null}
            <Link className="nav-link inline-flex items-center gap-1.5" href="/logout">
              <LogOut aria-hidden="true" size={14} /> <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <Link className={item.key === active ? "nav-link nav-link-active shrink-0" : "nav-link shrink-0"} href={item.href} key={item.key} prefetch={false}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="border-b border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[var(--border-subtle)] sm:grid-cols-4">
          {data.metrics.map((metric) => (
            <div className="px-4 py-3 sm:px-6" key={metric.label}>
              <p className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{metric.label}</p>
              <p className="mt-0.5 text-xl font-semibold text-[var(--text-primary)]">{metric.value}</p>
              <p className="mt-0.5 text-[0.6875rem] text-[var(--text-tertiary)]">{metric.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6">{children}</div>
    </main>
  );
}

export function SetupScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <section className="panel max-w-lg p-6">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-amber-soft)]">
          <ShieldCheck aria-hidden="true" className="text-[var(--accent-amber)]" size={18} />
        </div>
        <h1 className="text-lg font-semibold">Setup required</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Add Supabase and encryption values to <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">.env.local</code>, then run the migration in <code className="rounded bg-[var(--bg-muted)] px-1 py-0.5 text-xs font-mono">supabase/migrations</code>.
        </p>
      </section>
    </main>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="rounded-md bg-[var(--bg-muted)] p-3 text-xs text-[var(--text-tertiary)]">{text}</p>;
}

export function OperationsSummary({ data }: { data: DashboardData }) {
  return (
    <Panel title="Operations health">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <SummaryRow label="Open cases" value={String(data.operationCases.filter((item) => item.status === "open").length)} />
        <SummaryRow label="Pending tasks" value={String(data.operationTasks.filter((item) => item.status === "pending").length)} />
        <SummaryRow label="Missing compliance" value={String(data.complianceRecords.filter((item) => item.status === "missing").length)} />
        <SummaryRow label="Approved exports" value={String(data.complianceRecords.filter((item) => item.status === "approved").length)} />
      </div>
    </Panel>
  );
}

export function RecentMessages({ conversations }: { conversations: DashboardData["conversations"] }) {
  return (
    <Panel title="Recent messages">
      {conversations.length === 0 ? (
        <EmptyState text="No recent guest conversations." />
      ) : (
        <div className="grid gap-2.5">
          {conversations.map((conversation) => (
            <article className="rounded-lg border border-[var(--border-subtle)] p-3" key={conversation.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{conversation.guestName}</h3>
                <span className={`pill ${statusStyles[conversation.status]}`}>{conversation.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{conversation.propertyName} · {conversation.channel}</p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{conversation.lastMessage}</p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function CompliancePageContent({ data }: { data: DashboardData }) {
  return (
    <Panel
      action={
        <a className="icon-button" href="/api/exports/ubyport" title="Download Ubyport export">
          <Download aria-hidden="true" size={15} />
        </a>
      }
      title="Compliance queue"
    >
      {data.complianceRecords.length === 0 ? (
        <EmptyState text="No compliance records yet. Create a reservation to generate a guest form." />
      ) : (
        <div className="overflow-x-auto">
          <table className="responsive-table w-full border-collapse text-left text-[0.8125rem]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[0.6875rem] font-medium uppercase text-[var(--text-muted)]">
                <th className="px-3 py-2">Guest</th>
                <th className="px-3 py-2">Property</th>
                <th className="px-3 py-2">Arrival</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {data.complianceRecords.map((record) => (
                <tr className="transition-colors hover:bg-[var(--bg-muted)]" key={record.id}>
                  <td className="px-3 py-2.5" data-label="Guest">{record.guestName}</td>
                  <td className="px-3 py-2.5" data-label="Property">{record.propertyName}</td>
                  <td className="px-3 py-2.5" data-label="Arrival">{record.arrivalDate}</td>
                  <td className="px-3 py-2.5" data-label="Status">
                    <span className={`pill ${complianceStyles[record.status]}`}>{record.status}</span>
                    {record.missingFields.length > 0 ? <p className="mt-1 text-[0.6875rem] text-[var(--accent-red)]">Missing: {record.missingFields.join(", ")}</p> : null}
                  </td>
                  <td className="px-3 py-2.5" data-label="Actions">
                    <ComplianceActions record={record} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

export function MessagesPageContent({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Panel
        action={
          <span className="internal-only-banner">
            <ShieldAlert aria-hidden="true" size={12} />
            Auto-send guarded
          </span>
        }
        title="AI automation queue"
      >
        {data.conversations.length === 0 ? (
          <EmptyState text="No guest conversations yet. WhatsApp, email, and PMS webhooks populate this queue." />
        ) : (
          <div className="grid gap-3">
            {data.conversations.map((conversation) => (
              <ConversationCard conversation={conversation} key={conversation.id} />
            ))}
          </div>
        )}
      </Panel>
      <div className="grid content-start gap-5">
        <CasesPanel data={data} />
        <TasksPanel data={data} />
      </div>
    </div>
  );
}

export function ReservationsPageContent({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Reservations">
        {data.reservations.length === 0 ? (
          <EmptyState text="Create a reservation to generate a guest check-in link." />
        ) : (
          <div className="grid gap-3">
            {data.reservations.map((reservation) => (
              <article className="rounded-lg border border-[var(--border-subtle)] p-3.5" key={reservation.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{reservation.guestName}</h3>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">{reservation.propertyName} · {reservation.arrivalDate} · {reservation.reservationStatus}</p>
                    <p className="mt-0.5 text-[0.6875rem] text-[var(--text-tertiary)]">{reservation.provider ?? "manual"} · {reservation.channel}</p>
                    <Link className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline" href={`/guest/check-in/${reservation.checkInToken}`}>
                      Check-in link <ArrowUpRight aria-hidden="true" size={11} />
                    </Link>
                  </div>
                  <form action={deleteReservation}>
                    <input name="reservationId" type="hidden" value={reservation.id} />
                    <button className="btn-ghost-danger">Delete</button>
                  </form>
                </div>
                <ReservationForm data={data} reservation={reservation} />
              </article>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="New reservation">
        <CreateReservationForm data={data} />
      </Panel>
    </div>
  );
}

export function PropertiesPageContent({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Properties">
        {data.properties.length === 0 ? (
          <EmptyState text="Add your first property using the form on this page." />
        ) : (
          <div className="grid gap-3">
            {data.properties.map((property) => (
              <article className="rounded-lg border border-[var(--border-subtle)] p-3" key={property.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{property.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{property.area} · {property.channel}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="pill bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]">{property.activeReservations} live</span>
                    <form action={deleteProperty}>
                      <input name="propertyId" type="hidden" value={property.id} />
                      <button className="btn-ghost-danger">Delete</button>
                    </form>
                  </div>
                </div>
                <PropertyForm property={property} />
              </article>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="New property">
        <CreatePropertyForm />
      </Panel>
    </div>
  );
}

export function KnowledgePageContent({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Knowledge base">
        {data.knowledgeDocuments.length === 0 ? (
          <EmptyState text="Add property-specific text before running AI automation." />
        ) : (
          <div className="grid gap-2.5">
            {data.knowledgeDocuments.map((document) => (
              <article className="rounded-lg border border-[var(--border-subtle)] p-3 text-[0.8125rem]" key={document.id}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{document.title}</h3>
                    <p className="text-[0.6875rem] text-[var(--text-muted)]">{document.propertyName}</p>
                  </div>
                  <CheckCircle2 aria-hidden="true" className={document.approved ? "text-[var(--accent-green)]" : "text-[var(--text-muted)]"} size={16} />
                </div>
                <p className="mt-1.5 max-h-16 overflow-hidden leading-relaxed text-[var(--text-secondary)]">{document.body}</p>
                <KnowledgeForm data={data} document={document} />
              </article>
            ))}
          </div>
        )}
      </Panel>
      <Panel title="Add knowledge source">
        <CreateKnowledgeForm data={data} />
        <div className="mt-4 grid gap-1.5">
          <SafetyRule icon={LockKeyhole} text="Identity data is encrypted and excluded from LLM prompts." />
          <SafetyRule icon={AlertTriangle} text="Refunds, emergencies, complaints, legal, and privacy cases are acknowledged and escalated." />
          <SafetyRule icon={MessageSquareText} text="Every auto-sent AI reply must cite approved property knowledge." />
        </div>
      </Panel>
    </div>
  );
}

function Panel({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
        {action}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] p-3">
      <p className="text-[0.6875rem] font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function ComplianceActions({ record }: { record: DashboardData["complianceRecords"][number] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {record.checkInToken ? <Link className="btn-info text-[0.6875rem]" href={`/guest/check-in/${record.checkInToken}`}>Form</Link> : null}
      {record.status === "submitted" ? (
        <form action={approveCompliance}>
          <input name="complianceId" type="hidden" value={record.id} />
          <button className="btn-approve text-[0.6875rem]">Approve</button>
        </form>
      ) : null}
      {record.status === "approved" ? (
        <form action={markComplianceExported}>
          <input name="complianceId" type="hidden" value={record.id} />
          <button className="btn-status text-[0.6875rem]">Mark exported</button>
        </form>
      ) : null}
      {record.status !== "missing" ? (
        <form action={resetCompliance}>
          <input name="complianceId" type="hidden" value={record.id} />
          <button className="btn-ghost-danger">Reset</button>
        </form>
      ) : null}
    </div>
  );
}

function ConversationCard({ conversation }: { conversation: DashboardData["conversations"][number] }) {
  return (
    <article className="rounded-lg border border-[var(--border-subtle)] p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{conversation.guestName}</h3>
          <span className="text-xs text-[var(--text-muted)]">{conversation.propertyName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`pill ${riskStyles[conversation.risk]}`}>{conversation.risk}</span>
          <span className={`pill ${statusStyles[conversation.status]}`}>{conversation.status.replace("_", " ")}</span>
        </div>
      </div>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{conversation.lastMessage}</p>
      <div className="mt-2 internal-only-banner">
        <Info aria-hidden="true" size={11} />
        Safe messages auto-send. Risky cases are acknowledged and escalated.
      </div>
      <AiDecisionPanel conversation={conversation} />
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.6875rem] text-[var(--text-muted)]">
        <span>{conversation.channel} · {conversation.language}</span>
        <span>Source: {conversation.source}</span>
        <span>Saved: {conversation.minutesSaved}min</span>
        <span>Approval: {conversation.approvalStatus ?? "none"}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <form action={runAiAutomation}>
          <input name="conversationId" type="hidden" value={conversation.id} />
          <button className="btn-approve text-[0.6875rem]">Run automation</button>
        </form>
        <details className="legacy-draft-tools">
          <summary>Legacy draft tools</summary>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <form action={generateAiDraft}>
              <input name="conversationId" type="hidden" value={conversation.id} />
              <button className="btn-info text-[0.6875rem]">Generate draft</button>
            </form>
            {conversation.status === "draft" ? (
              <form action={approveAiDraft}>
                <input name="conversationId" type="hidden" value={conversation.id} />
                <button className="btn-status text-[0.6875rem]">Approve internally</button>
              </form>
            ) : null}
          </div>
        </details>
      </div>
    </article>
  );
}

function AiDecisionPanel({ conversation }: { conversation: DashboardData["conversations"][number] }) {
  const latest = conversation.aiDecision;

  if (!latest) {
    return <div className="mt-2 rounded-md bg-[var(--bg-muted)] p-2 text-[0.6875rem] text-[var(--text-tertiary)]">No automation decision recorded yet.</div>;
  }

  return (
    <div className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-muted)] p-2.5 text-[0.6875rem] text-[var(--text-secondary)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-semibold text-[var(--text-primary)]">Latest decision</span>
        <span className={`pill ${riskStyles[latest.risk]}`}>{latest.risk}</span>
        <span className={`pill ${latest.canAutoSend ? statusStyles.auto_sent : statusStyles.needs_review}`}>{latest.canAutoSend ? "auto-send" : "escalated"}</span>
        <span className={`pill ${deliveryStyles[latest.deliveryStatus] ?? deliveryStyles.not_sent}`}>{latest.deliveryStatus.replace("_", " ")}</span>
      </div>
      <p className="mt-1 leading-relaxed">{latest.reason}</p>
    </div>
  );
}

function CasesPanel({ data }: { data: DashboardData }) {
  return (
    <Panel title="Operations cases">
      {data.operationCases.length === 0 ? (
        <EmptyState text="No manager review cases yet." />
      ) : (
        <div className="grid gap-2.5">
          {data.operationCases.map((item) => (
            <article className="rounded-lg border border-[var(--border-subtle)] p-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                <span className={`pill ${riskStyles[item.risk]}`}>{item.risk}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.guestName} · {item.propertyName}</p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--text-secondary)]">{item.summary}</p>
              {item.recommendedAction ? <p className="mt-2 rounded-md bg-[var(--bg-muted)] p-2 text-xs text-[var(--text-secondary)]">{item.recommendedAction}</p> : null}
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function TasksPanel({ data }: { data: DashboardData }) {
  return (
    <Panel title="Operations tasks">
      {data.operationTasks.length === 0 ? (
        <EmptyState text="No scheduled operation tasks yet." />
      ) : (
        <div className="grid gap-2.5">
          {data.operationTasks.map((item) => (
            <article className="rounded-lg border border-[var(--border-subtle)] p-3" key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-[var(--text-primary)]">{item.taskType.replaceAll("_", " ")}</h3>
                <span className={`pill ${deliveryStyles[item.deliveryStatus] ?? deliveryStyles.not_sent}`}>{item.deliveryStatus.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{item.guestName} · {item.propertyName}</p>
              <p className="mt-2 text-[0.6875rem] text-[var(--text-muted)]">Due: {item.dueAt ? new Date(item.dueAt).toLocaleString("en-GB") : "unscheduled"}</p>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ReservationForm({ data, reservation }: { data: DashboardData; reservation: DashboardData["reservations"][number] }) {
  return (
    <form action={updateReservation} className="mt-3 grid gap-2.5 sm:grid-cols-2">
      <input name="reservationId" type="hidden" value={reservation.id} />
      <PropertySelect properties={data.properties} selectedId={reservation.propertyId} />
      <Input defaultValue={reservation.guestName} label="Guest name" name="guestDisplayName" />
      <Input defaultValue={reservation.guestEmail} label="Guest email" name="guestEmail" type="email" />
      <Input defaultValue={reservation.arrivalDate} label="Arrival" name="arrivalDate" type="date" />
      <Input defaultValue={reservation.departureDate} label="Departure" name="departureDate" type="date" />
      <button className="btn-primary self-end text-xs">Save</button>
    </form>
  );
}

function CreateReservationForm({ data }: { data: DashboardData }) {
  return (
    <form action={createReservation} className="grid gap-2.5">
      <PropertySelect properties={data.properties} />
      <Input label="Guest name" name="guestDisplayName" />
      <Input label="Guest email" name="guestEmail" type="email" />
      <Input label="Arrival date" name="arrivalDate" type="date" />
      <Input label="Departure date" name="departureDate" type="date" />
      <button className="btn-primary text-xs">
        <Plus aria-hidden="true" size={13} /> Create reservation
      </button>
    </form>
  );
}

function PropertyForm({ property }: { property: DashboardData["properties"][number] }) {
  return (
    <form action={updateProperty} className="mt-3 grid gap-2">
      <input name="propertyId" type="hidden" value={property.id} />
      <Input defaultValue={property.name} label="Name" name="name" />
      <Input defaultValue={property.area} label="Area" name="area" />
      <Input defaultValue={property.address} label="Address" name="address" />
      <Input defaultValue={property.channel} label="Channel" name="channel" />
      <button className="btn-primary text-xs">Save</button>
    </form>
  );
}

function CreatePropertyForm() {
  return (
    <form action={createProperty} className="grid gap-2.5">
      <Input label="Name" name="name" />
      <Input label="Area" name="area" />
      <Input label="Address" name="address" />
      <Input label="Channel" name="channel" placeholder="Airbnb" />
      <button className="btn-primary text-xs">
        <Plus aria-hidden="true" size={13} /> Add property
      </button>
    </form>
  );
}

function KnowledgeForm({ data, document }: { data: DashboardData; document: DashboardData["knowledgeDocuments"][number] }) {
  return (
    <>
      <form action={updateKnowledgeDocument} className="mt-2.5 grid gap-2">
        <input name="knowledgeId" type="hidden" value={document.id} />
        <PropertySelect properties={data.properties} selectedId={document.propertyId} />
        <Input defaultValue={document.title} label="Title" name="title" />
        <Textarea defaultValue={document.body} label="Body" name="body" />
        <button className="btn-primary text-xs">Save</button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <form action={toggleKnowledgeApproval}>
          <input name="knowledgeId" type="hidden" value={document.id} />
          <input name="approved" type="hidden" value={String(!document.approved)} />
          <button className="btn-info text-[0.6875rem]">{document.approved ? "Unapprove" : "Approve"}</button>
        </form>
        <form action={deleteKnowledgeDocument}>
          <input name="knowledgeId" type="hidden" value={document.id} />
          <button className="btn-ghost-danger">Delete</button>
        </form>
      </div>
    </>
  );
}

function CreateKnowledgeForm({ data }: { data: DashboardData }) {
  return (
    <form action={createKnowledgeDocument} className="grid gap-2.5">
      <PropertySelect properties={data.properties} />
      <Input label="Title" name="title" />
      <Textarea label="Text or Markdown" name="body" />
      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
        <input className="rounded" name="approved" type="checkbox" />
        Approved for AI
      </label>
      <button className="btn-primary text-xs">
        <Plus aria-hidden="true" size={13} /> Add knowledge
      </button>
    </form>
  );
}

function PropertySelect({ properties, selectedId }: { properties: DashboardData["properties"]; selectedId?: string }) {
  return (
    <label className="field-label">
      Property
      <select className="field-input" defaultValue={selectedId ?? ""} name="propertyId" required>
        <option value="">Select property</option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>{property.name}</option>
        ))}
      </select>
    </label>
  );
}

function Input({ defaultValue, label, name, placeholder, type = "text" }: { defaultValue?: string; label: string; name: string; placeholder?: string; type?: string }) {
  return (
    <label className="field-label">
      {label}
      <input className="field-input" defaultValue={defaultValue} name={name} placeholder={placeholder} required={name !== "guestEmail" && name !== "departureDate" && name !== "channel"} type={type} />
    </label>
  );
}

function Textarea({ defaultValue, label, name }: { defaultValue?: string; label: string; name: string }) {
  return (
    <label className="field-label">
      {label}
      <textarea className="field-input min-h-20" defaultValue={defaultValue} name={name} required />
    </label>
  );
}

function SafetyRule({ icon: Icon, text }: { icon: ElementType; text: string }) {
  return (
    <div className="flex gap-2 rounded-md bg-[var(--bg-muted)] p-2.5 text-xs leading-5 text-[var(--text-secondary)]">
      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-blue)]" size={13} />
      <p>{text}</p>
    </div>
  );
}
