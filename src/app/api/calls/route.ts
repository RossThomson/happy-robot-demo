import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { calls } from "@/db/schema";
import { requireApiKey } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_NEGOTIATION_ROUNDS = 3;

const callSentiments = ["positive", "neutral", "negative"] as const;
type CallSentiment = (typeof callSentiments)[number];

function clampNegotiationRounds(value: unknown): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : 0;

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(
    MAX_NEGOTIATION_ROUNDS,
    Math.max(0, Math.trunc(parsed)),
  );
}

function normalizeSentiment(value: unknown): CallSentiment {
  if (typeof value !== "string") {
    return "neutral";
  }

  const normalized = value.trim().toLowerCase();
  if (callSentiments.includes(normalized as CallSentiment)) {
    return normalized as CallSentiment;
  }

  if (normalized.includes("positive")) {
    return "positive";
  }
  if (normalized.includes("negative")) {
    return "negative";
  }

  return "neutral";
}

const callSchema = z.object({
  call_id: z.string().optional(),
  mc_number: z.string().optional(),
  load_id: z.string().optional(),
  initial_rate: z.coerce.number().optional(),
  final_rate: z.coerce.number().optional(),
  negotiation_rounds: z
    .unknown()
    .transform(clampNegotiationRounds)
    .default(0),
  outcome: z.enum([
    "booked",
    "declined",
    "no_match",
    "ineligible_carrier",
    "abandoned",
  ]),
  sentiment: z
    .unknown()
    .optional()
    .transform((value) => normalizeSentiment(value)),
  extracted_data: z.record(z.string(), z.unknown()).optional(),
  transcript_summary: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const body = callSchema.parse(await request.json());

    const [record] = await db
      .insert(calls)
      .values({
        callId: body.call_id,
        mcNumber: body.mc_number,
        loadId: body.load_id,
        initialRate:
          body.initial_rate !== undefined
            ? body.initial_rate.toFixed(2)
            : undefined,
        finalRate:
          body.final_rate !== undefined ? body.final_rate.toFixed(2) : undefined,
        negotiationRounds: body.negotiation_rounds,
        outcome: body.outcome,
        sentiment: body.sentiment,
        extractedData: body.extracted_data,
        transcriptSummary: body.transcript_summary,
      })
      .returning();

    return NextResponse.json({ success: true, call: record }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to record call" },
      { status: 500 },
    );
  }
}
