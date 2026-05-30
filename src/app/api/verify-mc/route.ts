import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireApiKey } from "@/lib/auth";
import { verifyMcNumber } from "@/lib/fmcsa";

const verifyMcSchema = z.object({
  mc_number: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const body = verifyMcSchema.parse(await request.json());
    const result = await verifyMcNumber(body.mc_number);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to verify MC number" },
      { status: 500 },
    );
  }
}
