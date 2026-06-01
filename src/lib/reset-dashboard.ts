import { calls, negotiationSessions } from "@/db/schema";
import { db } from "@/lib/db";

export type ResetDashboardResult = {
  calls_deleted: number;
  negotiation_sessions_deleted: number;
};

/** Clears call metrics and negotiation session state; leaves loads and carriers intact. */
export async function resetDashboardData(): Promise<ResetDashboardResult> {
  const deletedCalls = await db
    .delete(calls)
    .returning({ id: calls.id });

  const deletedSessions = await db
    .delete(negotiationSessions)
    .returning({ id: negotiationSessions.id });

  return {
    calls_deleted: deletedCalls.length,
    negotiation_sessions_deleted: deletedSessions.length,
  };
}
