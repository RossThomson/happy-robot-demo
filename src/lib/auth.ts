import { NextRequest, NextResponse } from "next/server";

export function validateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return false;
  }

  const headerKey = request.headers.get("x-api-key");
  return headerKey === apiKey;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function requireApiKey(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  return null;
}
