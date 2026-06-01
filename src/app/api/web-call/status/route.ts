import { NextResponse } from "next/server";

export async function GET() {
  const configured = Boolean(
    process.env.HAPPYROBOT_API_KEY && process.env.HAPPYROBOT_WORKFLOW_ID,
  );

  return NextResponse.json({ configured });
}
