import { NextRequest, NextResponse } from "next/server";

import { requireApiKey } from "@/lib/auth";
import { searchLoads } from "@/lib/loads";

export async function GET(request: NextRequest) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const loads = await searchLoads({
    origin: searchParams.get("origin"),
    destination: searchParams.get("destination"),
    equipment_type: searchParams.get("equipment_type"),
    load_id: searchParams.get("load_id"),
  });

  return NextResponse.json({ count: loads.length, loads });
}
