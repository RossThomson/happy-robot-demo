import { NextRequest, NextResponse } from "next/server";

import { requireApiKey } from "@/lib/auth";
import { getMetrics } from "@/lib/metrics";

export async function GET(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const metrics = await getMetrics();
  return NextResponse.json(metrics);
}
