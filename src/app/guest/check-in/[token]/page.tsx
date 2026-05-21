import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { getGuestCheckInContext } from "@/lib/guest-check-in";
import { CheckInForm } from "./CheckInForm";

export const dynamic = "force-dynamic";

export default async function GuestCheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const context = await getGuestCheckInContext(token);

  if (context.status === "setup_required") {
    return <GuestMessage title="Setup required" text="Supabase environment variables are required before guest check-in links can be used." />;
  }

  if (context.status === "not_found") {
    return <GuestMessage title="Link unavailable" text="This check-in link is invalid or expired. Please contact your host for a new secure link." />;
  }

  return (
    <main className="min-h-screen bg-[var(--bg-page)] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-blue)]">
            <ShieldCheck aria-hidden="true" className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Secure check-in
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            {context.propertyName}
          </p>
        </div>

        {/* Guest context */}
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
          <Lock aria-hidden="true" className="shrink-0 text-[var(--accent-blue)]" size={16} />
          <div className="text-sm">
            <p className="text-[var(--text-secondary)]">
              Hello <strong className="text-[var(--text-primary)]">{context.guestName}</strong>.
              Your host needs these details before your{" "}
              <strong className="text-[var(--text-primary)]">{context.arrivalDate}</strong>{" "}
              arrival for Czech foreign police reporting.
            </p>
          </div>
        </div>

        {/* Form */}
        <CheckInForm token={token} />

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Token: {token.slice(0, 8)}…</span>
          <Link className="font-medium text-[var(--accent-blue)] hover:underline" href="/">
            HostOps CZ
          </Link>
        </div>
      </div>
    </main>
  );
}

function GuestMessage({ text, title }: { text: string; title: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] px-4">
      <section className="panel max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-amber-soft)]">
          <ShieldCheck aria-hidden="true" className="text-[var(--accent-amber)]" size={18} />
        </div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
        <Link className="mt-4 inline-flex text-sm font-medium text-[var(--accent-blue)] hover:underline" href="/">
          Return to HostOps CZ
        </Link>
      </section>
    </main>
  );
}
