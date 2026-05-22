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
  Bell,
  Search,
  User,
  ChevronRight,
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
  { href: "/dashboard", key: "overview", label: "Dashboard" },
  { href: "/dashboard/properties", key: "properties", label: "Listings" },
  { href: "/dashboard/reservations", key: "reservations", label: "Bookings" },
  { href: "/dashboard/compliance", key: "compliance", label: "Compliance" },
  { href: "/dashboard/messages", key: "messages", label: "Messages" },
  { href: "/dashboard/knowledge", key: "knowledge", label: "Knowledge" },
];

const statusStyles: Record<string, string> = {
  auto_sent: "pill-success",
  needs_review: "pill-warning",
  draft: "pill-info",
  resolved: "pill-muted",
};

const complianceStyles: Record<string, string> = {
  missing: "pill-danger",
  submitted: "pill-info",
  approved: "pill-success",
  exported: "pill-muted",
};

const riskStyles: Record<string, string> = {
  high: "pill-danger",
  low: "pill-success",
  medium: "pill-warning",
};

const deliveryStyles: Record<string, string> = {
  delivered: "pill-success",
  failed: "pill-danger",
  not_sent: "pill-muted",
  queued: "pill-info",
  sent: "pill-success",
  simulated: "pill-info",
};

export function DashboardFrame({ active, children, data }: { active: NavKey; children: ReactNode; data: DashboardData }) {
  const firstGuestToken = data.complianceRecords.find((r) => r.checkInToken)?.checkInToken;

  // Calculate premium metrics values dynamically
  const autoResolved = data.conversations.filter(c => c.status === "auto_sent").length;
  const needsReview = data.conversations.filter(c => c.status === "needs_review").length + data.operationCases.filter(c => c.status === "open").length;
  const hoursSaved = data.conversations.reduce((acc, c) => acc + c.minutesSaved, 0) / 60;
  const activeListings = data.properties.length;

  return (
    <main className="min-h-screen bg-transparent pb-12">
      <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-slate-950/45 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2.5">
            {/* Custom HostOps tricolor Czech shield SVG logo */}
            <svg className="h-7 w-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L15 25V75L50 95L85 75V25L50 5Z" fill="#0d182e" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <path d="M50 5L15 25V75L50 50Z" fill="#3b82f6" />
              <path d="M50 50L85 75V25L50 5Z" fill="#ef4444" />
              <path d="M15 75L50 95L85 75L50 50Z" fill="#ffffff" />
            </svg>
            <span className="font-display font-bold text-base tracking-tight text-white hidden sm:block">HostOps CZ</span>
          </div>

          <nav className="hidden items-center gap-4 md:flex ml-6 h-full">
            {navItems.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  className={`text-xs font-semibold tracking-wide transition-all py-3 border-b-2 ${
                    isActive
                      ? "border-white text-white font-bold"
                      : "border-transparent text-[var(--text-tertiary)] hover:text-white"
                  }`}
                  href={item.href}
                  key={item.key}
                  prefetch={false}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2 text-[var(--text-muted)]" size={13} />
              <input
                type="text"
                placeholder="Search listings..."
                className="header-search pl-8 focus:outline-none"
              />
            </div>

            {/* Notification Icon */}
            <div className="relative cursor-pointer p-1.5 text-[var(--text-secondary)] hover:text-white transition-colors">
              <Bell size={16} />
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">5</span>
            </div>

            {/* Profile */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3">
              <span className="hidden text-xs font-semibold text-[var(--text-secondary)] lg:block">Jana Nováková</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white border border-white/20">
                JN
              </div>
            </div>

            {/* Logout */}
            <Link className="nav-link inline-flex items-center gap-1.5 hover:text-white" href="/logout">
              <LogOut aria-hidden="true" size={13} /> <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex gap-2 overflow-x-auto border-t border-[var(--border-subtle)] px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                className={`text-xs font-semibold shrink-0 px-3 py-1.5 rounded-full ${
                  isActive
                    ? "bg-white/10 text-white font-bold border border-white/10"
                    : "text-[var(--text-tertiary)] hover:text-white"
                }`}
                href={item.href}
                key={item.key}
                prefetch={false}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Only show metrics ribbon on the main Overview page */}
        {active === "overview" && (
          <section className="mb-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Hours Saved (Green glow) */}
            <div className="glass-card glow-green p-5 min-h-[140px] flex flex-col justify-between cursor-pointer">
              <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Hours saved this week</span>
                <ChevronRight size={14} className="text-white/40" />
              </div>
              <div className="z-10">
                <p className="text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight mt-2">
                  {hoursSaved.toFixed(1)} hours
                </p>
                <p className="text-[0.6875rem] text-[var(--accent-green)] mt-1 font-medium">Efficiency boosted</p>
              </div>
              {/* Green Sparkline */}
              <svg className="absolute bottom-0 left-0 w-full h-12 stroke-[var(--accent-green)] opacity-60 pointer-events-none" viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M0,25 Q15,10 30,22 T60,5 T90,18 T100,8" fill="none" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Card 2: Auto-resolved Messages (Blue glow) */}
            <div className="glass-card glow-blue p-5 min-h-[140px] flex flex-col justify-between cursor-pointer">
              <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Auto-resolved messages</span>
                <ChevronRight size={14} className="text-white/40" />
              </div>
              <div className="z-10">
                <p className="text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight mt-2">
                  {autoResolved}
                </p>
                <p className="text-[0.6875rem] text-blue-400 mt-1 font-medium">AI Assistant: 94%</p>
              </div>
              <MessageSquareText className="absolute right-4 bottom-4 text-blue-400 opacity-20 pointer-events-none" size={48} />
            </div>

            {/* Card 3: Needs human review (Amber glow) */}
            <div className="glass-card glow-amber p-5 min-h-[140px] flex flex-col justify-between cursor-pointer">
              <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Needs human review</span>
                <ChevronRight size={14} className="text-white/40" />
              </div>
              <div className="z-10">
                <p className="text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight mt-2">
                  {needsReview}
                </p>
                <p className="text-[0.6875rem] text-[var(--accent-amber)] mt-1 font-medium">Urgent pending cases</p>
              </div>
              <AlertTriangle className="absolute right-4 bottom-4 text-amber-500 opacity-20 pointer-events-none" size={48} />
            </div>

            {/* Card 4: Active Listings (Cyan glow) */}
            <div className="glass-card glow-cyan p-5 min-h-[140px] flex flex-col justify-between cursor-pointer">
              <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Active Listings</span>
                <ChevronRight size={14} className="text-white/40" />
              </div>
              <div className="z-10">
                <p className="text-3xl font-extrabold text-[var(--text-primary)] font-display tracking-tight mt-2">
                  {activeListings}
                </p>
                <p className="text-[0.6875rem] text-cyan-400 mt-1 font-medium">Avg. Occupancy: 86%</p>
              </div>
              {/* Cyan Sparkline bars */}
              <svg className="absolute bottom-0 right-4 w-24 h-12 stroke-[var(--accent-cyan)] opacity-30 pointer-events-none" viewBox="0 0 100 30">
                <line x1="10" y1="30" x2="10" y2="12" strokeWidth="4" strokeLinecap="round" />
                <line x1="25" y1="30" x2="25" y2="18" strokeWidth="4" strokeLinecap="round" />
                <line x1="40" y1="30" x2="40" y2="8" strokeWidth="4" strokeLinecap="round" />
                <line x1="55" y1="30" x2="55" y2="22" strokeWidth="4" strokeLinecap="round" />
                <line x1="70" y1="30" x2="70" y2="10" strokeWidth="4" strokeLinecap="round" />
                <line x1="85" y1="30" x2="85" y2="14" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
          </section>
        )}
        <div className="grid gap-5">{children}</div>
      </div>
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

export function OperationsPerformance({ data }: { data: DashboardData }) {
  const resCount = data.reservations.length;
  const convCount = data.conversations.length;

  const bookingsOffset = Math.min(resCount * 5, 30);
  const commsOffset = Math.min(convCount * 3, 20);

  const pB1_y = 280;
  const pB2_y = Math.max(100, 200 - bookingsOffset);
  const pB3_y = Math.max(120, 250 - bookingsOffset / 2);
  const pB4_y = Math.max(60, 120 - bookingsOffset);
  const pB5_y = Math.max(100, 220 - bookingsOffset / 2);
  const pB6_y = Math.max(50, 120 - bookingsOffset);
  const pB7_y = Math.max(80, 200 - bookingsOffset / 2);

  const bookingsPath = `M 50,${pB1_y} C 100,240 120,${pB2_y} 160,${pB2_y} C 200,${pB2_y} 230,${pB3_y} 270,${pB3_y} C 310,${pB3_y} 340,${pB4_y} 380,${pB4_y} C 420,${pB4_y} 450,${pB5_y} 490,${pB5_y} C 530,${pB5_y} 560,${pB6_y} 600,${pB6_y} C 640,${pB6_y} 670,${pB7_y} 710,${pB7_y}`;
  const bookingsArea = `${bookingsPath} L 710,300 L 50,300 Z`;

  const pG1_y = Math.max(100, 220 - commsOffset);
  const pG2_y = Math.max(120, 240 - commsOffset / 2);
  const pG3_y = Math.max(80, 180 - commsOffset);
  const pG4_y = Math.max(100, 220 - commsOffset / 2);
  const pG5_y = Math.max(70, 170 - commsOffset);
  const pG6_y = Math.max(90, 200 - commsOffset / 2);
  const pG7_y = Math.max(40, 70 - commsOffset);

  const commsPath = `M 50,${pG1_y} C 100,${pG1_y + 10} 120,${pG2_y} 160,${pG2_y} C 200,${pG2_y} 230,${pG3_y} 270,${pG3_y} C 310,${pG3_y} 340,${pG4_y} 380,${pG4_y} C 420,${pG4_y} 450,${pG5_y} 490,${pG5_y} C 530,${pG5_y} 560,${pG6_y} 600,${pG6_y} C 640,${pG6_y} 670,${pG7_y} 710,${pG7_y}`;
  const commsArea = `${commsPath} L 710,300 L 50,300 Z`;

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <h3 className="text-sm font-bold text-white font-display tracking-wide">Operations Performance</h3>
        <select className="bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-white px-2 py-1 focus:outline-none cursor-pointer">
          <option>All Time date</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-white font-display">Performance Trends, Oct 20-26</h4>
          <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>
              Bookings
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              Guest Communication
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              Revenue
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[220px]">
        <svg className="w-full h-full" viewBox="0 0 750 320" preserveAspectRatio="none">
          <defs>
            <linearGradient id="blue-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="green-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <line x1="50" y1="50" x2="710" y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
          <line x1="50" y1="100" x2="710" y2="100" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
          <line x1="50" y1="150" x2="710" y2="150" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
          <line x1="50" y1="200" x2="710" y2="200" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
          <line x1="50" y1="250" x2="710" y2="250" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="4 4" />
          <line x1="50" y1="300" x2="710" y2="300" stroke="rgba(255, 255, 255, 0.1)" />

          <text x="35" y="54" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">100</text>
          <text x="35" y="104" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">80</text>
          <text x="35" y="154" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">60</text>
          <text x="35" y="204" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">40</text>
          <text x="35" y="254" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">20</text>
          <text x="35" y="304" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="end">0</text>

          <text x="50" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">Oct 20</text>
          <text x="160" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">21</text>
          <text x="270" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">22</text>
          <text x="380" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">23</text>
          <text x="490" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">24</text>
          <text x="600" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">25</text>
          <text x="710" y="318" fill="rgba(255, 255, 255, 0.4)" fontSize="10" textAnchor="middle">26</text>

          <path d={bookingsArea} fill="url(#blue-grad)" />
          <path d={commsArea} fill="url(#green-grad)" />

          <path d={bookingsPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
          <path d={commsPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

          <circle cx="160" cy={pB2_y} r="4" fill="#3b82f6" stroke="#07080c" strokeWidth="1.5" />
          <circle cx="380" cy={pB4_y} r="4" fill="#3b82f6" stroke="#07080c" strokeWidth="1.5" />
          <circle cx="600" cy={pB6_y} r="4" fill="#3b82f6" stroke="#07080c" strokeWidth="1.5" />

          <circle cx="270" cy={pG3_y} r="4" fill="#10b981" stroke="#07080c" strokeWidth="1.5" />
          <circle cx="490" cy={pG5_y} r="4" fill="#10b981" stroke="#07080c" strokeWidth="1.5" />
          <circle cx="710" cy={pG7_y} r="4" fill="#10b981" stroke="#07080c" strokeWidth="1.5" />
        </svg>
      </div>
    </div>
  );
}

export function RecentActivityFeed({ data }: { data: DashboardData }) {
  const activities: {
    id: string;
    type: "booking" | "message_resolved" | "issue_review";
    guestName: string;
    detail: string;
    timeLabel: string;
  }[] = [];

  // Populate from actual database data
  data.reservations.slice(0, 2).forEach((r) => {
    activities.push({
      id: `res-${r.id}`,
      type: "booking",
      guestName: r.guestName,
      detail: "Booking confirmed",
      timeLabel: "5 mins ago",
    });
  });

  data.conversations.forEach((c) => {
    if (c.status === "auto_sent") {
      activities.push({
        id: `conv-res-${c.id}`,
        type: "message_resolved",
        guestName: c.guestName,
        detail: "Auto-resolved",
        timeLabel: "12 mins ago",
      });
    } else if (c.status === "needs_review") {
      activities.push({
        id: `conv-rev-${c.id}`,
        type: "issue_review",
        guestName: c.guestName,
        detail: "Needs Review",
        timeLabel: "1 hr ago",
      });
    }
  });

  // Fallback to match mockup if empty
  if (activities.length === 0) {
    activities.push(
      {
        id: "mock-act-1",
        type: "booking",
        guestName: "Markéta K.",
        detail: "Booking confirmed",
        timeLabel: "5 mins ago",
      },
      {
        id: "mock-act-2",
        type: "message_resolved",
        guestName: "Petr L.",
        detail: "Auto-resolved",
        timeLabel: "12 mins ago",
      },
      {
        id: "mock-act-3",
        type: "issue_review",
        guestName: "Jan M.",
        detail: "Needs Review",
        timeLabel: "1 hr ago",
      }
    );
  }

  // Group styles
  const typeIcons = {
    booking: {
      icon: User,
      colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)]",
      label: "Guest"
    },
    message_resolved: {
      icon: MessageSquareText,
      colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      label: "Message"
    },
    issue_review: {
      icon: AlertTriangle,
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      label: "Issue"
    }
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="text-sm font-bold text-white font-display tracking-wide border-b border-white/5 pb-4 mb-4">
        Recent Activity Feed
      </h3>

      <div className="flex flex-col gap-4">
        {activities.slice(0, 5).map((item) => {
          const config = typeIcons[item.type];
          const IconComponent = config.icon;
          return (
            <div key={item.id} className="flex gap-3 items-start group">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${config.colorClass}`}>
                <IconComponent size={14} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  {config.label}: <span className="text-[var(--text-primary)] capitalize font-semibold normal-case text-xs">{item.guestName}</span>
                </span>
                <span className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">{item.detail}</span>
                <span className="text-[9px] text-[var(--text-muted)] mt-1">{item.timeLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
