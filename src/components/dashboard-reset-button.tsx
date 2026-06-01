"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resetDashboardAction } from "@/app/dashboard/actions";

export function DashboardResetButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReset() {
    const confirmed = window.confirm(
      "Clear all calls and negotiation sessions? Loads and carriers will stay in place.",
    );
    if (!confirmed) return;

    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const result = await resetDashboardAction();
        setMessage(
          `Cleared ${result.calls_deleted} call(s) and ${result.negotiation_sessions_deleted} negotiation session(s).`,
        );
        router.refresh();
      } catch {
        setError("Reset failed. Check server logs and try again.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={isPending}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Resetting…" : "Reset dashboard data"}
      </button>
      {message ? (
        <p className="max-w-xs text-right text-xs text-green-700">{message}</p>
      ) : null}
      {error ? (
        <p className="max-w-xs text-right text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
