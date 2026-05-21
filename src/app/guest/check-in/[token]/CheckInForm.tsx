"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Lock, Eye } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function CheckInForm({ token }: { token: string }) {
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("submitting");
    setMessage("");

    const payload = Object.fromEntries(formData.entries());
    const response = await fetch("/api/forms/check-in", {
      body: JSON.stringify({ ...payload, token }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    if (!response.ok) {
      const result = (await response.json()) as { missingFields?: string[] };
      setState("error");
      setMessage(
        result.missingFields?.length
          ? `Missing fields: ${result.missingFields.join(", ")}`
          : "Please check the form and try again.",
      );
      return;
    }

    setState("success");
    setMessage("Submitted. Your host will review the record before export.");
  }

  if (state === "success") {
    return (
      <div className="panel p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-green-soft)]">
          <CheckCircle2 aria-hidden="true" className="text-[var(--accent-green)]" size={24} />
        </div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Check-in submitted
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          {message}
        </p>
      </div>
    );
  }

  return (
    <form action={submit} className="panel">
      <div className="border-b border-[var(--border-subtle)] px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Guest details
        </h2>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
          Required for Czech foreign police reporting
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <label className="field-label">
          Full name
          <input className="field-input" name="fullName" placeholder="As shown on passport" />
        </label>
        <label className="field-label">
          Date of birth
          <input className="field-input" name="dateOfBirth" type="date" />
        </label>
        <label className="field-label">
          Nationality
          <input className="field-input" name="nationality" placeholder="e.g. Czech Republic" />
        </label>
        <label className="field-label">
          Passport / ID number
          <input className="field-input" name="passportNumber" placeholder="Document number" />
        </label>
        <label className="field-label">
          Arrival date
          <input className="field-input" name="arrivalDate" type="date" />
        </label>
        <label className="field-label">
          Email for receipt
          <input className="field-input" name="email" type="email" placeholder="Optional" />
        </label>
      </div>

      {/* Privacy signals */}
      <div className="mx-5 mb-5 grid gap-2 rounded-lg bg-[var(--bg-muted)] p-3.5 sm:mx-6 sm:mb-6">
        <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
          <Lock aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-blue)]" size={12} />
          <span>Your data is <strong>encrypted at rest</strong> and stored securely.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
          <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-blue)]" size={12} />
          <span>This data is <strong>not sent to any AI model</strong>.</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
          <Eye aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--accent-blue)]" size={12} />
          <span>Your host <strong>reviews the record</strong> before any official export.</span>
        </div>
      </div>

      {/* Consent + submit */}
      <div className="border-t border-[var(--border-subtle)] px-5 py-4 sm:px-6">
        <p className="mb-4 text-xs leading-5 text-[var(--text-tertiary)]">
          By submitting, you confirm the details above are correct. A property
          manager will review the record before any official export is made.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-primary py-2.5 px-5 text-sm"
            disabled={state === "submitting"}
            type="submit"
          >
            {state === "submitting" ? (
              <>
                <Loader2 aria-hidden="true" className="animate-spin" size={14} />
                Submitting…
              </>
            ) : (
              "Submit check-in details"
            )}
          </button>
          {state === "error" && message ? (
            <p className="text-xs font-medium text-[var(--accent-red)]">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}
