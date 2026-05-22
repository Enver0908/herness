"use client";

import Link from "next/link";
import { useState, useTransition, useMemo, useEffect, ElementType, ReactNode } from "react";
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
  Home,
  Building,
  Calendar,
  FileText,
  RefreshCw,
  MessageSquare,
  BookOpen,
  Settings,
  Send,
  Clock,
  Sparkles,
  Check,
  AlertCircle
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
  approveAndSendCustomReply,
  updateOrganizationSettings,
  triggerUbyportSync,
} from "./actions";

type NavKey = "overview" | "compliance" | "messages" | "reservations" | "properties" | "knowledge" | "sync" | "settings";

const navItems: { href: string; key: NavKey; label: string; icon: ElementType }[] = [
  { href: "/dashboard", key: "overview", label: "Dashboard", icon: Home },
  { href: "/dashboard/properties", key: "properties", label: "Listings", icon: Building },
  { href: "/dashboard/reservations", key: "reservations", label: "Bookings", icon: Calendar },
  { href: "/dashboard/compliance", key: "compliance", label: "Compliance", icon: FileText },
  { href: "/dashboard/sync", key: "sync", label: "Sync", icon: RefreshCw },
  { href: "/dashboard/messages", key: "messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/knowledge", key: "knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/dashboard/settings", key: "settings", label: "Settings", icon: Settings },
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
    <div className="min-h-screen flex bg-transparent">
      {/* Desktop left sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-950/70 border-r border-[var(--border-default)] backdrop-blur-md shrink-0 sticky top-0 h-screen p-5 justify-between z-40">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {/* Tricolor Czech shield SVG */}
            <svg className="h-8 w-8 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5L15 25V75L50 95L85 75V25L50 5Z" fill="#0d182e" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
              <path d="M50 5L15 25V75L50 50Z" fill="#3b82f6" />
              <path d="M50 50L85 75V25L50 5Z" fill="#ef4444" />
              <path d="M15 75L50 95L85 75L50 50Z" fill="#ffffff" />
            </svg>
            <div className="flex flex-col animate-fade-in">
              <span className="font-display font-extrabold text-base tracking-tight text-white leading-tight">HostOps CZ</span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Compliance & Automation</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <Link
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-[var(--accent-blue-soft)] text-white border border-[rgba(59,130,246,0.25)] shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                      : "text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                  href={item.href}
                  key={item.key}
                  prefetch={false}
                >
                  <Icon size={14} className={isActive ? "text-blue-400" : "text-[var(--text-muted)]"} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white border border-white/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
              AS
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-bold text-white">Alex S. Admin</span>
              <span className="text-[9px] text-[var(--text-muted)]">Operations Manager</span>
            </div>
          </div>
          <Link className="nav-link inline-flex items-center gap-2 hover:text-white mt-1 border border-white/5 py-1.5" href="/logout">
            <LogOut size={13} /> <span className="text-xs">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--border-default)] bg-slate-950/45 backdrop-blur-md py-3.5 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Brand elements for mobile view only */}
            <div className="flex items-center gap-2.5 md:hidden">
              <svg className="h-6 w-6 shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 5L15 25V75L50 95L85 75V25L50 5Z" fill="#0d182e" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                <path d="M50 5L15 25V75L50 50Z" fill="#3b82f6" />
                <path d="M50 50L85 75V25L50 5Z" fill="#ef4444" />
                <path d="M15 75L50 95L85 75L50 50Z" fill="#ffffff" />
              </svg>
              <span className="font-display font-bold text-sm tracking-tight text-white">HostOps CZ</span>
            </div>

            {/* Desktop utilities */}
            <div className="hidden md:flex items-center gap-4 w-72 relative">
              <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={13} />
              <input
                type="text"
                placeholder="Search resources, records..."
                className="header-search pl-9 pr-4 py-2 w-full focus:outline-none bg-slate-900/50 border border-white/5 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-[var(--text-muted)] bg-white/5 border border-white/10 rounded-md px-3 py-1.5 backdrop-blur-sm">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {/* Notification Badge */}
              <div className="relative cursor-pointer p-1.5 text-[var(--text-secondary)] hover:text-white transition-colors">
                <Bell size={16} />
                <span className="absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">5</span>
              </div>

              {/* Profile display for mobile only */}
              <div className="flex items-center gap-2 border-l border-white/10 pl-3 md:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border border-white/20">
                  AS
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Scrollbar */}
          <nav className="flex gap-2 overflow-x-auto border-t border-[var(--border-subtle)] mt-2 pt-2 md:hidden">
            {navItems.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  className={`text-xs font-semibold shrink-0 px-3 py-1.5 rounded-full transition-all ${
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

        {/* Content wrap */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 w-full">
          {/* Metrics Ribbon for Overview page */}
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
      </div>
    </div>
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Calculate statistics
  const stats = useMemo(() => {
    const total = data.complianceRecords.length;
    const missing = data.complianceRecords.filter(r => r.status === "missing").length;
    const submitted = data.complianceRecords.filter(r => r.status === "submitted").length;
    const approved = data.complianceRecords.filter(r => r.status === "approved").length;
    const exported = data.complianceRecords.filter(r => r.status === "exported").length;
    return { total, missing, submitted, approved, exported };
  }, [data.complianceRecords]);

  // Filter compliance records
  const filteredRecords = useMemo(() => {
    return data.complianceRecords.filter(record => {
      const matchSearch =
        record.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.ubyportId && record.ubyportId.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "all" || record.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data.complianceRecords, searchTerm, statusFilter]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="grid gap-5">
      {/* Statistics Cards */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-slate-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Forms</span>
          <span className="text-2xl font-extrabold text-white mt-1 leading-none">{stats.total}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-red-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Missing Forms</span>
          <span className="text-2xl font-extrabold text-red-500 mt-1 leading-none">{stats.missing}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-blue-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Submitted</span>
          <span className="text-2xl font-extrabold text-blue-500 mt-1 leading-none">{stats.submitted}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-emerald-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Approved</span>
          <span className="text-2xl font-extrabold text-emerald-500 mt-1 leading-none">{stats.approved}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between border-l-2 border-slate-600">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Exported</span>
          <span className="text-2xl font-extrabold text-slate-400 mt-1 leading-none">{stats.exported}</span>
        </div>
      </section>

      {/* Main Grid Panel */}
      <Panel
        action={
          <div className="flex gap-2">
            <a className="icon-button" href="/api/exports/ubyport" title="Download Ubyport export CSV">
              <Download aria-hidden="true" size={15} />
            </a>
          </div>
        }
        title="Compliance Reports Queue"
      >
        {/* Table Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between mb-4 border-b border-white/5 pb-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" size={13} />
            <input
              type="text"
              placeholder="Filter by guest name, property..."
              className="field-input pl-8 py-1.5 text-xs w-full focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {["all", "missing", "submitted", "approved", "exported"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold capitalize border transition-all ${
                  statusFilter === status
                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                    : "bg-white/5 border-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <EmptyState text="No compliance records found matching your filters." />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <table className="responsive-table w-full border-collapse text-left text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[0.6875rem] font-medium uppercase text-[var(--text-muted)]">
                    <th className="px-3 py-2">Guest Name</th>
                    <th className="px-3 py-2">Property</th>
                    <th className="px-3 py-2">Check-in / Check-out</th>
                    <th className="px-3 py-2">Nationality</th>
                    <th className="px-3 py-2">Ubyport ID</th>
                    <th className="px-3 py-2">Registration Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {paginatedRecords.map((record) => (
                    <tr className="transition-colors hover:bg-[var(--bg-muted)]" key={record.id}>
                      <td className="px-3 py-2.5 font-medium" data-label="Guest">{record.guestName}</td>
                      <td className="px-3 py-2.5" data-label="Property">{record.propertyName}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-[var(--text-secondary)]" data-label="Arrival/Departure">
                        {record.arrivalDate} {record.departureDate ? ` / ${record.departureDate}` : ""}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)]" data-label="Nationality">
                        {record.nationality}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-mono font-semibold text-blue-400" data-label="Ubyport ID">
                        {record.ubyportId}
                      </td>
                      <td className="px-3 py-2.5" data-label="Status">
                        <span className={`pill ${complianceStyles[record.status]}`}>{record.status}</span>
                        {record.missingFields.length > 0 ? (
                          <p className="mt-1 text-[0.6875rem] text-[var(--accent-red)]">
                            Missing: {record.missingFields.join(", ")}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5" data-label="Actions">
                        <ComplianceActions record={record} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-white/5 rounded border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 text-white transition-colors"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded border transition-all ${
                        currentPage === page
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-white/5 border-white/5 text-[var(--text-tertiary)] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-white/5 rounded border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/10 text-white transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

export function MessagesPageContent({ data }: { data: DashboardData }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    data.conversations.length > 0 ? data.conversations[0].id : null
  );
  const [filter, setFilter] = useState<"all" | "needs_review" | "resolved" | "auto_sent">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  // Find selected conversation
  const selectedConversation = useMemo(() => {
    return data.conversations.find((c) => c.id === selectedId) || null;
  }, [data.conversations, selectedId]);

  // Sync draft reply text when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      setReplyText(selectedConversation.aiReply && selectedConversation.aiReply !== "No AI draft yet." ? selectedConversation.aiReply : "");
    } else {
      setReplyText("");
    }
  }, [selectedConversation]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return data.conversations.filter((c) => {
      const matchSearch =
        c.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.propertyName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "needs_review" && c.status === "needs_review") ||
        (filter === "resolved" && c.status === "resolved") ||
        (filter === "auto_sent" && c.status === "auto_sent");
      return matchSearch && matchFilter;
    });
  }, [data.conversations, searchTerm, filter]);

  // Actions
  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;
    const formData = new FormData();
    formData.append("conversationId", selectedId);
    formData.append("customBody", replyText);
    startTransition(async () => {
      try {
        await approveAndSendCustomReply(formData);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to send message");
      }
    });
  };

  const handleSendDraft = async () => {
    if (!selectedId || !selectedConversation) return;
    const draftText = selectedConversation.aiReply;
    if (!draftText || draftText === "No AI draft yet.") {
      alert("No draft response is currently available.");
      return;
    }
    const formData = new FormData();
    formData.append("conversationId", selectedId);
    formData.append("customBody", draftText);
    startTransition(async () => {
      try {
        await approveAndSendCustomReply(formData);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to send draft");
      }
    });
  };

  const handleRunAutomation = async () => {
    if (!selectedId) return;
    const formData = new FormData();
    formData.append("conversationId", selectedId);
    startTransition(async () => {
      try {
        await runAiAutomation(formData);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to trigger AI automation");
      }
    });
  };

  const handleGenerateDraft = async () => {
    if (!selectedId) return;
    const formData = new FormData();
    formData.append("conversationId", selectedId);
    startTransition(async () => {
      try {
        await generateAiDraft(formData);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to generate AI draft");
      }
    });
  };

  // Find related reservation for check-in/out dates
  const selectedReservation = useMemo(() => {
    if (!selectedConversation) return null;
    return data.reservations.find(r => r.guestName === selectedConversation.guestName) || null;
  }, [data.reservations, selectedConversation]);

  const settings = data.organizationSettings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 min-h-[650px] bg-slate-900/10 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Left panel: Conversation list */}
      <div className="flex flex-col border-r border-white/5 bg-slate-950/40 h-[650px]">
        {/* Search & Tabs */}
        <div className="p-4 flex flex-col gap-3 border-b border-white/5 shrink-0 bg-slate-950/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-[var(--text-muted)]" size={13} />
            <input
              type="text"
              placeholder="Search chats..."
              className="field-input pl-8 py-1.5 text-xs w-full focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(["all", "needs_review", "resolved", "auto_sent"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-1.5 px-0.5 rounded text-[9px] font-bold uppercase text-center border transition-all truncate ${
                  filter === tab
                    ? "bg-blue-600/30 border-blue-500/50 text-blue-400"
                    : "bg-transparent border-transparent text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                }`}
                title={tab.replace("_", " ")}
              >
                {tab === "needs_review" ? "Review" : tab === "auto_sent" ? "Auto" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs text-[var(--text-muted)]">No chats found.</p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === selectedId;
              const hasDraft = c.aiReply && c.aiReply !== "No AI draft yet.";
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 cursor-pointer transition-all flex flex-col gap-1.5 hover:bg-white/5 ${
                    isActive ? "bg-blue-600/10 border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[150px]">{c.guestName}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`pill ${riskStyles[c.risk]} text-[8px] px-1 py-0.5`}>{c.risk}</span>
                      <span className={`pill ${statusStyles[c.status]} text-[8px] px-1 py-0.5`}>{c.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span className="truncate">{c.propertyName}</span>
                    <span className="shrink-0">{c.channel}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-[var(--text-secondary)] line-clamp-2">
                    {c.lastMessage}
                  </p>
                  {hasDraft && c.status === "needs_review" && (
                    <div className="mt-1 flex items-center gap-1.5 text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded w-fit">
                      <Sparkles size={8} /> AI Draft Prepared
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Workspace */}
      <div className="flex flex-col h-[650px] bg-slate-950/20">
        {selectedConversation ? (
          <>
            {/* Workspace Header */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-2 bg-slate-950/40 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-white">{selectedConversation.guestName}</h3>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {selectedConversation.propertyName} · {selectedConversation.channel} · Language: {selectedConversation.language}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedReservation && (
                    <span className="text-[10px] font-semibold bg-white/5 border border-white/10 text-[var(--text-secondary)] px-2.5 py-1 rounded">
                      Status: {selectedReservation.reservationStatus}
                    </span>
                  )}
                  <span className={`pill ${statusStyles[selectedConversation.status]}`}>
                    {selectedConversation.status.replace("_", " ")}
                  </span>
                </div>
              </div>

              {selectedReservation && (
                <div className="text-[10px] text-[var(--text-muted)] flex flex-wrap gap-x-4 gap-y-1">
                  <span>Check-in: <strong className="text-white">{selectedReservation.arrivalDate}</strong></span>
                  {selectedReservation.departureDate && (
                    <span>Check-out: <strong className="text-white">{selectedReservation.departureDate}</strong></span>
                  )}
                  {selectedReservation.guestEmail && (
                    <span>Email: <strong className="text-white">{selectedReservation.guestEmail}</strong></span>
                  )}
                </div>
              )}
            </div>

            {/* Message Feed Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[var(--bg-inset)]">
              {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((msg) => {
                  if (msg.direction === "inbound") {
                    return (
                      <div key={msg.id} className="flex gap-2 max-w-[85%] self-start animate-fade-in">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[9px] font-bold text-white shrink-0">
                          G
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="bg-slate-800/80 border border-white/5 p-3 rounded-2xl rounded-tl-none text-xs text-[var(--text-secondary)] leading-relaxed">
                            {msg.body}
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] ml-1">
                            {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  } else if (msg.direction === "outbound") {
                    return (
                      <div key={msg.id} className="flex gap-2 max-w-[85%] self-end flex-row-reverse animate-fade-in">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shrink-0">
                          A
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="bg-blue-600/25 border border-blue-500/30 p-3 rounded-2xl rounded-tr-none text-xs text-white leading-relaxed">
                            {msg.body}
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] mr-1">
                            {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    // ai_draft message representation
                    return (
                      <div key={msg.id} className="flex gap-2 max-w-[85%] self-end flex-row-reverse animate-fade-in">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-[9px] font-bold text-white shrink-0">
                          AI
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <div className="bg-amber-500/5 border border-dashed border-amber-500/40 p-3 rounded-2xl rounded-tr-none text-xs text-amber-300/90 leading-relaxed backdrop-blur-sm">
                            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                              <Sparkles size={10} /> AI Prepared Draft
                            </div>
                            {msg.body}
                          </div>
                          <span className="text-[9px] text-[var(--text-muted)] mr-1">
                            {new Date(msg.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    );
                  }
                })
              ) : (
                <div className="m-auto text-center">
                  <p className="text-xs text-[var(--text-muted)]">No message history.</p>
                </div>
              )}
            </div>

            {/* Decision Panel Details */}
            {selectedConversation.aiDecision && (
              <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40">
                <AiDecisionPanel conversation={selectedConversation} />
              </div>
            )}

            {/* Reply Workspace Panel */}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 shrink-0">
              <form onSubmit={handleSendCustom} className="flex flex-col gap-3">
                <div className="relative">
                  <textarea
                    placeholder="Type an outbound message, or edit the AI-generated draft..."
                    className="field-input w-full min-h-24 pr-4 py-2.5 text-xs focus:outline-none resize-none"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isPending}
                  />
                  {isPending && (
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                      <span className="text-[10px] text-white/70 animate-pulse font-medium">Sending reply...</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleGenerateDraft}
                      disabled={isPending}
                      className="btn-secondary text-[10px] py-1.5 px-3"
                    >
                      <Sparkles size={11} className="text-amber-400" />
                      Draft
                    </button>
                    <button
                      type="button"
                      onClick={handleRunAutomation}
                      disabled={isPending}
                      className="btn-secondary text-[10px] py-1.5 px-3"
                      title="Simulates AI triage trigger"
                    >
                      <RefreshCw size={11} className="text-blue-400" />
                      Run AI
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {selectedConversation.aiReply && selectedConversation.aiReply !== "No AI draft yet." && (
                      <button
                        type="button"
                        onClick={handleSendDraft}
                        disabled={isPending}
                        className="btn-approve text-[10px] py-1.5 px-3 flex items-center gap-1"
                      >
                        <Check size={11} />
                        Approve & Send Draft
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isPending || !replyText.trim()}
                      className="btn-primary text-[10px] py-1.5 px-3 flex items-center gap-1"
                    >
                      <Send size={11} />
                      Send Custom
                    </button>
                  </div>
                </div>
              </form>

              {/* Safety Rules Banner */}
              {settings && (
                <div className="mt-3 flex items-center gap-2 rounded border border-white/5 bg-slate-900/30 px-3 py-2 text-[10px] text-[var(--text-muted)] animate-fade-in">
                  <Clock size={12} className="text-blue-400 shrink-0" />
                  <p className="leading-tight">
                    <strong>Rules Grounding Enforced:</strong> Quiet Hours ({settings.quietHoursStart} - {settings.quietHoursEnd}) · Tourist Tax ({settings.localTouristTaxCzk} CZK) · Czech Compliance RLS active.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="m-auto text-center flex flex-col gap-2 items-center p-6">
            <MessageSquare size={32} className="text-[var(--text-muted)] opacity-40" />
            <p className="text-xs text-[var(--text-muted)]">Select a conversation from the list to start triaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SyncPageContent({ data }: { data: DashboardData }) {
  const [isPending, startTransition] = useTransition();
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; count?: number; error?: string } | null>(null);

  const logs = data.ubyportSyncLogs || [];

  // Calculate sync statistics
  const stats = useMemo(() => {
    const totalRuns = logs.length;
    const successRuns = logs.filter(l => l.status === "success").length;
    const failedRuns = logs.filter(l => l.status === "failed").length;
    const totalSyncedCount = logs.filter(l => l.status === "success").reduce((acc, curr) => acc + curr.recordCount, 0);
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 100;
    const lastSyncTime = logs.length > 0 ? new Date(logs[0].createdAt).toLocaleString("en-GB") : "Never";

    return { totalRuns, successRuns, failedRuns, totalSyncedCount, successRate, lastSyncTime };
  }, [logs]);

  const handleSync = async () => {
    setSyncStatus(null);
    startTransition(async () => {
      try {
        const result = await triggerUbyportSync();
        setSyncStatus({ success: true, count: result?.count || 0 });
      } catch (err) {
        setSyncStatus({ success: false, error: err instanceof Error ? err.message : "Sync execution failed" });
      }
    });
  };

  return (
    <div className="grid gap-5">
      {/* Statistics section */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5 flex flex-col justify-between border-l-2 border-blue-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total Synced Forms</span>
          <p className="text-3xl font-extrabold text-white mt-1 leading-none">{stats.totalSyncedCount}</p>
          <span className="text-[10px] text-[var(--text-muted)] mt-2">Exported to Police registry</span>
        </div>
        <div className="glass-card p-5 flex flex-col justify-between border-l-2 border-emerald-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Sync Success Rate</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1 leading-none">{stats.successRate}%</p>
          <span className="text-[10px] text-[var(--text-muted)] mt-2">{stats.successRuns} of {stats.totalRuns} runs succeeded</span>
        </div>
        <div className="glass-card p-5 flex flex-col justify-between border-l-2 border-amber-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Last Sync Run</span>
          <p className="text-lg font-bold text-white mt-2 leading-tight">{stats.lastSyncTime}</p>
          <span className="text-[10px] text-[var(--text-muted)] mt-2">Automatic schedule active</span>
        </div>
        <div className="glass-card p-5 flex flex-col justify-between border-l-2 border-red-500">
          <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Failed Runs</span>
          <p className="text-3xl font-extrabold text-red-500 mt-1 leading-none">{stats.failedRuns}</p>
          <span className="text-[10px] text-[var(--text-muted)] mt-2">Needs manual retry</span>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Sync Trigger and Explanation */}
        <Panel title="Ubyport Manual Export Trigger">
          <div className="flex flex-col gap-4">
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              Under Czech Republic legal guidelines, all foreign tourists visiting Prague properties must be reported to the police registry within 3 working days. The Ubyport API integration automatically takes compliance records marked as <strong>Approved</strong>, compiles them into the official CSV template format, uploads the payload, and records audit logs.
            </p>

            <div className="rounded-lg bg-slate-900/40 border border-white/5 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Manual Export Engine</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <Check size={8} /> Supabase Integration Ready
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Pressing the button below will immediately check for forms in status <code className="text-emerald-400 font-semibold bg-white/5 px-1 rounded">Approved</code>, format them into CZ police standards, trigger the sync, and transition them to <code className="text-slate-400 font-semibold bg-white/5 px-1 rounded">Exported</code>.
              </p>

              {syncStatus && (
                <div className={`p-3 rounded border text-xs animate-fade-in ${
                  syncStatus.success
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/15 border-red-500/30 text-red-300"
                }`}>
                  {syncStatus.success ? (
                    <p>✓ Ubyport Sync completed successfully. Synced <strong>{syncStatus.count}</strong> approved guest compliance records.</p>
                  ) : (
                    <p>✗ Sync failed: {syncStatus.error}</p>
                  )}
                </div>
              )}

              <button
                onClick={handleSync}
                disabled={isPending}
                className="btn-primary text-xs w-full py-2.5 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-transform"
              >
                <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
                {isPending ? "Syncing with Ubyport..." : "Trigger Manual Sync Now"}
              </button>
            </div>
          </div>
        </Panel>

        {/* Sync History Logs */}
        <Panel title="Sync History & Log Audits">
          {logs.length === 0 ? (
            <EmptyState text="No sync executions recorded yet." />
          ) : (
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[var(--text-muted)] uppercase text-[9px] font-bold">
                    <th className="py-2 px-2">Timestamp</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Records</th>
                    <th className="py-2 px-2">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2.5 px-2 font-mono text-[var(--text-secondary)]">
                        {new Date(log.createdAt).toLocaleString("en-GB")}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className={`pill ${log.status === "success" ? "pill-success" : "pill-danger"} text-[9px] px-1.5 py-0.5`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-white">
                        {log.recordCount} records
                      </td>
                      <td className="py-2.5 px-2 text-[var(--text-muted)] truncate max-w-[150px]" title={log.errorMessage}>
                        {log.errorMessage || "No errors"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

export function SettingsPageContent({ data }: { data: DashboardData }) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const settings = data.organizationSettings;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateOrganizationSettings(formData);
        setSuccessMsg("Organization compliance settings saved successfully.");
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save settings");
      }
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Main Settings Form */}
      <Panel title="Prague Local Regulations & Compliance Settings">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded animate-fade-in">
              ✓ {successMsg}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field-label">
              Quiet Hours Start
              <input
                type="text"
                name="quietHoursStart"
                placeholder="22:00"
                defaultValue={settings?.quietHoursStart || "22:00"}
                className="field-input text-xs"
                required
                disabled={isPending}
              />
            </label>
            <label className="field-label">
              Quiet Hours End
              <input
                type="text"
                name="quietHoursEnd"
                placeholder="06:00"
                defaultValue={settings?.quietHoursEnd || "06:00"}
                className="field-input text-xs"
                required
                disabled={isPending}
              />
            </label>
          </div>

          <label className="field-label">
            Local Prague Tourist Tax (CZK per person/night)
            <input
              type="number"
              name="localTouristTaxCzk"
              placeholder="50"
              defaultValue={settings?.localTouristTaxCzk ?? 50}
              className="field-input text-xs"
              required
              disabled={isPending}
            />
          </label>

          <label className="field-label">
            Waste & Trash Sorting Guidelines
            <textarea
              name="wasteSortingRules"
              placeholder="E.g., Yellow bins for plastics, blue bins for paper, green for glass. Common garbage bin in the courtyard."
              defaultValue={settings?.wasteSortingRules || ""}
              className="field-input min-h-24 text-xs font-sans"
              required
              disabled={isPending}
            />
          </label>

          <label className="field-label">
            Other Custom Rules & Prague Quiet Hours Policies
            <textarea
              name="otherRules"
              placeholder="E.g., No parties, smoking is forbidden indoors, keep voice down in communal hallways at all times."
              defaultValue={settings?.otherRules || ""}
              className="field-input min-h-24 text-xs font-sans"
              disabled={isPending}
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="btn-primary self-start text-xs py-2 px-4 shadow-[0_0_12px_rgba(59,130,246,0.2)] mt-2 hover:scale-[1.01] active:scale-[0.99] transition-transform"
          >
            {isPending ? "Saving changes..." : "Save Settings"}
          </button>
        </form>
      </Panel>

      {/* Guidance and AI Grounding explanation */}
      <Panel title="AI Grounding Dashboard Information">
        <div className="flex flex-col gap-4 text-xs leading-relaxed text-[var(--text-secondary)]">
          <p>
            The values configured on this settings dashboard serve as a <strong>dynamic knowledge ground</strong> for the automated AI triage logic.
          </p>

          <div className="flex gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-4">
            <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-white text-[11px]">How the AI Triage engine integrates settings:</span>
              <ul className="list-disc list-inside space-y-1 text-[var(--text-tertiary)]">
                <li>
                  <strong>Quiet Hours Enforcement:</strong> Inbound queries requesting check-ins or checkout extensions that clash with local quiet hours ({settings?.quietHoursStart || "22:00"} to {settings?.quietHoursEnd || "06:00"}) are automatically identified. The bot declines or flags reviews immediately.
                </li>
                <li>
                  <strong>Tourist Tax Queries:</strong> Auto-reply quotes the local tax amount dynamically (currently configured to <strong>{settings?.localTouristTaxCzk ?? 50} CZK</strong> per guest/night) instead of a hardcoded value.
                </li>
                <li>
                  <strong>Trash Disposal Questions:</strong> Guest inquiries on recycling are answered using your specific waste sorting rules.
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-4">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white text-[11px]">Supabase Persistence:</span>
              <p className="text-[var(--text-tertiary)] mt-1">
                Data is saved directly in the <code className="text-blue-400 font-mono text-[10px]">organization_settings</code> table. Any change here automatically takes effect on all properties connected to the pilot organization.
              </p>
            </div>
          </div>
        </div>
      </Panel>
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
    <section className="panel animate-fade-in">
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
    <div className="rounded-lg border border-[var(--border-subtle)] p-3 hover:border-white/10 transition-colors">
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
            <article className="rounded-lg border border-[var(--border-subtle)] p-3 hover:bg-white/5 transition-colors" key={item.id}>
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
            <article className="rounded-lg border border-[var(--border-subtle)] p-3 hover:bg-white/5 transition-colors" key={item.id}>
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
      <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
        <input className="rounded bg-slate-900 border-white/10" name="approved" type="checkbox" />
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
      <select className="field-input cursor-pointer" defaultValue={selectedId ?? ""} name="propertyId" required>
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
    <div className="flex gap-2 rounded-md bg-[var(--bg-muted)] p-2.5 text-xs leading-5 text-[var(--text-secondary)] border border-white/5">
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
