import { desc, eq, sql } from "drizzle-orm";

import { calls, loads } from "@/db/schema";
import { db } from "@/lib/db";

export async function getMetrics() {
  const allCalls = await db.query.calls.findMany({
    orderBy: [desc(calls.createdAt)],
  });

  const totalCalls = allCalls.length;
  const bookedCalls = allCalls.filter((call) => call.outcome === "booked");
  const conversionRate =
    totalCalls === 0 ? 0 : bookedCalls.length / totalCalls;

  const avgNegotiationRounds =
    totalCalls === 0
      ? 0
      : allCalls.reduce((sum, call) => sum + call.negotiationRounds, 0) /
        totalCalls;

  const rateDeltas = bookedCalls
    .map((call) => {
      const initial = call.initialRate ? Number(call.initialRate) : null;
      const final = call.finalRate ? Number(call.finalRate) : null;
      if (initial === null || final === null) return null;
      return final - initial;
    })
    .filter((value): value is number => value !== null);

  const avgRateDelta =
    rateDeltas.length === 0
      ? 0
      : rateDeltas.reduce((sum, value) => sum + value, 0) / rateDeltas.length;

  const outcomeCounts = allCalls.reduce<Record<string, number>>((acc, call) => {
    acc[call.outcome] = (acc[call.outcome] ?? 0) + 1;
    return acc;
  }, {});

  const sentimentCounts = allCalls.reduce<Record<string, number>>((acc, call) => {
    acc[call.sentiment] = (acc[call.sentiment] ?? 0) + 1;
    return acc;
  }, {});

  const callsOverTime = allCalls.reduce<Record<string, number>>((acc, call) => {
    const day = call.createdAt.toISOString().slice(0, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});

  const laneCounts = await db
    .select({
      lane: sql<string>`${loads.origin} || ' -> ' || ${loads.destination}`,
      count: sql<number>`count(${calls.id})::int`,
    })
    .from(calls)
    .innerJoin(loads, eq(calls.loadId, loads.loadId))
    .groupBy(loads.origin, loads.destination)
    .orderBy(sql`count(${calls.id}) desc`)
    .limit(5);

  return {
    summary: {
      total_calls: totalCalls,
      booked_calls: bookedCalls.length,
      conversion_rate: Number(conversionRate.toFixed(4)),
      avg_negotiation_rounds: Number(avgNegotiationRounds.toFixed(2)),
      avg_rate_delta: Number(avgRateDelta.toFixed(2)),
    },
    outcome_counts: outcomeCounts,
    sentiment_counts: sentimentCounts,
    calls_over_time: Object.entries(callsOverTime).map(([date, count]) => ({
      date,
      count,
    })),
    top_lanes: laneCounts.map((row) => ({
      lane: row.lane,
      count: row.count,
    })),
    recent_calls: allCalls.slice(0, 20).map((call) => ({
      id: call.id,
      call_id: call.callId,
      mc_number: call.mcNumber,
      load_id: call.loadId,
      initial_rate: call.initialRate ? Number(call.initialRate) : null,
      final_rate: call.finalRate ? Number(call.finalRate) : null,
      negotiation_rounds: call.negotiationRounds,
      outcome: call.outcome,
      sentiment: call.sentiment,
      transcript_summary: call.transcriptSummary,
      created_at: call.createdAt.toISOString(),
    })),
  };
}
