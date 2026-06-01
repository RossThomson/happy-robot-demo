import { NextRequest, NextResponse } from "next/server";

import { requireApiKey } from "@/lib/auth";
import { resetDashboardData } from "@/lib/reset-dashboard";

export async function POST(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  try {
    const result = await resetDashboardData();
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reset dashboard data" },
      { status: 500 },
    );
  }
}
