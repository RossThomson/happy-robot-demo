import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireApiKey } from "@/lib/auth";
import { evaluateNegotiation } from "@/lib/negotiation";

const negotiateSchema = z.object({
  session_id: z.string().min(1),
  load_id: z.string().min(1),
  offered_rate: z.number().positive(),
  round: z.number().int().min(1).max(3).optional(),
});

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const body = negotiateSchema.parse(await request.json());
    const result = await evaluateNegotiation({
      sessionId: body.session_id,
      loadId: body.load_id,
      offeredRate: body.offered_rate,
      round: body.round,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to evaluate negotiation" },
      { status: 500 },
    );
  }
}
