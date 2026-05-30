import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { loads } from "@/db/schema";
import { requireApiKey } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatLoad } from "@/lib/loads";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = requireApiKey(request);
  if (authError) return authError;

  const { id } = await context.params;

  const load = await db.query.loads.findFirst({
    where: eq(loads.loadId, id),
  });

  if (!load) {
    return NextResponse.json({ error: "Load not found" }, { status: 404 });
  }

  return NextResponse.json({ load: formatLoad(load) });
}
