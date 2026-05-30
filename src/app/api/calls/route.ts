import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { calls } from "@/db/schema";
import { requireApiKey } from "@/lib/auth";
import { db } from "@/lib/db";

const callSchema = z.object({
  call_id: z.string().optional(),
  mc_number: z.string().optional(),
  load_id: z.string().optional(),
  initial_rate: z.number().optional(),
  final_rate: z.number().optional(),
  negotiation_rounds: z.number().int().min(0).max(3).default(0),
  outcome: z.enum([
    "booked",
    "declined",
    "no_match",
    "ineligible_carrier",
    "abandoned",
  ]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
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
