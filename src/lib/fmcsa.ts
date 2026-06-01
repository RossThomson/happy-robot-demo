import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { carriers } from "@/db/schema";

export type McVerificationResult = {
  eligible: boolean;
  mcNumber: string;
  legalName: string | null;
  dbaName: string | null;
  status: string | null;
  source: "fmcsa" | "mock";
  reason?: string;
};

function normalizeMcNumber(mcNumber: string): string {
  return mcNumber.replace(/^MC[-\s]?/i, "").trim();
}

type FmcsaCarrierContent = {
  carrier?: {
    legalName?: string;
    dbaName?: string;
    allowedToOperate?: string;
    outOfService?: string;
    statusCode?: string;
  };
};

async function verifyWithFmcsa(
  mcNumber: string,
): Promise<McVerificationResult | null> {
  const webKey = process.env.FMCSA_WEB_KEY;

  if (!webKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number/${mcNumber}?webKey=${encodeURIComponent(webKey)}`,
      { next: { revalidate: 0 } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      content?: FmcsaCarrierContent;
    };

    const carrier = data.content?.carrier;

    if (!carrier) {
      return {
        eligible: false,
        mcNumber,
        legalName: null,
        dbaName: null,
        status: null,
        source: "fmcsa",
        reason: "Carrier not found in FMCSA database",
      };
    }

    const isOutOfService = carrier.outOfService === "Y";
    const canOperate = carrier.allowedToOperate === "Y";
    const eligible = canOperate && !isOutOfService;

    return {
      eligible,
      mcNumber,
      legalName: carrier.legalName ?? null,
      dbaName: carrier.dbaName ?? null,
      status: carrier.statusCode ?? null,
      source: "fmcsa",
      reason: eligible
        ? undefined
        : isOutOfService
          ? "Carrier is out of service"
          : "Carrier is not authorized to operate",
    };
  } catch {
    return null;
  }
}

async function verifyWithMock(mcNumber: string): Promise<McVerificationResult> {
  const carrier = await db.query.carriers.findFirst({
    where: eq(carriers.mcNumber, mcNumber),
  });

  if (!carrier) {
    return {
      eligible: false,
      mcNumber,
      legalName: null,
      dbaName: null,
      status: null,
      source: "mock",
      reason: "Carrier not found in mock registry",
    };
  }

  return {
    eligible: carrier.eligible,
    mcNumber: carrier.mcNumber,
    legalName: carrier.legalName,
    dbaName: carrier.dbaName,
    status: carrier.status,
    source: "mock",
    reason: carrier.eligible
      ? undefined
      : `Carrier status: ${carrier.status} (not eligible)`,
  };
}

export async function verifyMcNumber(
  rawMcNumber: string,
): Promise<McVerificationResult> {
  const mcNumber = normalizeMcNumber(rawMcNumber);

  if (!mcNumber) {
    return {
      eligible: false,
      mcNumber: rawMcNumber,
      legalName: null,
      dbaName: null,
      status: null,
      source: "mock",
      reason: "MC number is required",
    };
  }

  // const fmcsaResult = await verifyWithFmcsa(mcNumber);

  // if (fmcsaResult) {
  //   return fmcsaResult;
  // }

  return verifyWithMock(mcNumber);
}
