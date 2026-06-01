import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { loads, negotiationSessions } from "@/db/schema";

const TRANSFER_MESSAGE =
  "Transfer was successful and now you can wrap up the conversation.";

export type NegotiationInput = {
  sessionId: string;
  loadId: string;
  offeredRate: number;
  round?: number;
};

export type NegotiationResult = {
  status: "accepted" | "countered" | "declined";
  sessionId: string;
  loadId: string;
  listRate: number;
  offeredRate: number;
  counterRate?: number;
  round: number;
  maxRounds: number;
  floorRate: number;
  ceilingRate: number;
  message: string;
  transferMessage?: string;
  agreedRate?: number;
};

function getNegotiationRatio(
  envKey: string,
  defaultValue: number,
): number {
  const ratio = Number(process.env[envKey] ?? String(defaultValue));
  return Number.isFinite(ratio) ? ratio : defaultValue;
}

function getFloorRatio(): number {
  return getNegotiationRatio("NEGOTIATION_FLOOR_RATIO", 0.85);
}

function getCeilingRatio(): number {
  return getNegotiationRatio("NEGOTIATION_CEILING_RATIO", 1.1);
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function computeFloorRate(listRate: number): number {
  return roundCurrency(listRate * getFloorRatio());
}

export function computeCeilingRate(listRate: number): number {
  const ceiling = roundCurrency(listRate * getCeilingRatio());
  const floor = computeFloorRate(listRate);
  return Math.max(ceiling, floor);
}

/**
 * Broker counter when the carrier asks above the posted list rate.
 * Round 1 splits the gap between list and the carrier ask.
 * Later rounds split the gap between the last broker counter and the new ask,
 * so counters never move backward when the carrier moves toward the broker.
 * Clamped between floorRate (min pay) and ceilingRate (max pay).
 */
export function computeBrokerCounterRate(
  offeredRate: number,
  listRate: number,
  floorRate: number,
  ceilingRate: number,
  lastCounterRate: number | null = null,
): number {
  const anchor = lastCounterRate ?? listRate;
  const midpoint = roundCurrency((offeredRate + anchor) / 2);
  let counter = Math.max(
    floorRate,
    Math.min(midpoint, offeredRate, ceilingRate),
  );

  if (lastCounterRate !== null) {
    counter = Math.max(lastCounterRate, counter);
    counter = Math.min(counter, ceilingRate);
  }

  return roundCurrency(counter);
}

/**
 * Carrier accepted the posted rate, beat it, or met/beat our last counter.
 */
export function shouldAcceptCarrierOffer(
  offeredRate: number,
  listRate: number,
  lastCounterRate: number | null,
): boolean {
  if (offeredRate <= listRate) {
    return true;
  }
  if (lastCounterRate !== null && offeredRate <= lastCounterRate) {
    return true;
  }
  return false;
}

export async function evaluateNegotiation(
  input: NegotiationInput,
): Promise<NegotiationResult> {
  const load = await db.query.loads.findFirst({
    where: eq(loads.loadId, input.loadId),
  });

  if (!load) {
    throw new Error(`Load ${input.loadId} not found`);
  }

  const listRate = Number(load.loadboardRate);
  const floorRate = computeFloorRate(listRate);
  const ceilingRate = computeCeilingRate(listRate);
  const maxRounds = 3;

  let session = await db.query.negotiationSessions.findFirst({
    where: eq(negotiationSessions.sessionId, input.sessionId),
  });

  if (!session) {
    const [created] = await db
      .insert(negotiationSessions)
      .values({
        sessionId: input.sessionId,
        loadId: input.loadId,
        listRate: listRate.toFixed(2),
      })
      .returning();
    session = created;
  }

  const round = input.round ?? session.currentRound + 1;
  const lastCounterRate = session.lastCounterRate
    ? Number(session.lastCounterRate)
    : null;

  const baseResult = {
    sessionId: input.sessionId,
    loadId: input.loadId,
    listRate,
    offeredRate: input.offeredRate,
    maxRounds,
    floorRate,
    ceilingRate,
  };

  if (round > maxRounds) {
    await db
      .update(negotiationSessions)
      .set({
        status: "declined",
        currentRound: maxRounds,
        lastOfferedRate: input.offeredRate.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(negotiationSessions.sessionId, input.sessionId));

    return {
      ...baseResult,
      status: "declined",
      round: maxRounds,
      message: "Best and final offer reached. Unable to agree on rate.",
    };
  }

  if (
    shouldAcceptCarrierOffer(input.offeredRate, listRate, lastCounterRate)
  ) {
    const agreedRate = input.offeredRate;

    await db
      .update(negotiationSessions)
      .set({
        status: "accepted",
        currentRound: round,
        lastOfferedRate: input.offeredRate.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(negotiationSessions.sessionId, input.sessionId));

    return {
      ...baseResult,
      status: "accepted",
      round,
      agreedRate,
      message: "Rate accepted. Proceeding with booking.",
      transferMessage: TRANSFER_MESSAGE,
    };
  }

  const counterRate = computeBrokerCounterRate(
    input.offeredRate,
    listRate,
    floorRate,
    ceilingRate,
    lastCounterRate,
  );

  await db
    .update(negotiationSessions)
    .set({
      currentRound: round,
      lastOfferedRate: input.offeredRate.toFixed(2),
      lastCounterRate: counterRate.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(negotiationSessions.sessionId, input.sessionId));

  if (round === maxRounds) {
    await db
      .update(negotiationSessions)
      .set({ status: "declined", updatedAt: new Date() })
      .where(eq(negotiationSessions.sessionId, input.sessionId));

    return {
      ...baseResult,
      status: "declined",
      counterRate,
      round,
      message: `Final counter offer of $${counterRate} is our best rate. Best and final offer reached.`,
    };
  }

  const cappedAtCeiling = counterRate >= ceilingRate;
  const counterMessage = cappedAtCeiling
    ? `Counter offer: $${counterRate} (maximum rate for this load).`
    : `Counter offer: $${counterRate}.`;

  return {
    ...baseResult,
    status: "countered",
    counterRate,
    round,
    message: counterMessage,
  };
}
