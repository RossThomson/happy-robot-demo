import { HappyRobotClient } from "@happyrobot-ai/sdk";
import { NextResponse } from "next/server";

export async function POST() {
  const apiKey = process.env.HAPPYROBOT_API_KEY;
  const workflowId = process.env.HAPPYROBOT_WORKFLOW_ID;

  if (!apiKey || !workflowId) {
    return NextResponse.json(
      {
        error:
          "Web call is not configured. Set HAPPYROBOT_API_KEY and HAPPYROBOT_WORKFLOW_ID.",
      },
      { status: 503 },
    );
  }

  try {
    const client = new HappyRobotClient({ apiKey });
    const result = await client.voice.createToken({
      workflow_id: workflowId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to create voice token:", error);
    return NextResponse.json(
      { error: "Failed to create voice token" },
      { status: 500 },
    );
  }
}
