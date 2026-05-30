import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "happy-robot-demo",
    timestamp: new Date().toISOString(),
  });
}
