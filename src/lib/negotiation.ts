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
  message: string;
  transferMessage?: string;
  agreedRate?: number;
};

function getFloorRatio(): number {
  const ratio = Number(process.env.NEGOTIATION_FLOOR_RATIO ?? "0.85");
  return Number.isFinite(ratio) ? ratio : 0.85;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
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
  const floorRate = roundCurrency(listRate * getFloorRatio());
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
      status: "declined",
      sessionId: input.sessionId,
      loadId: input.loadId,
      listRate,
      offeredRate: input.offeredRate,
      round: maxRounds,
      maxRounds,
      floorRate,
      message: "Best and final offer reached. Unable to agree on rate.",
    };
  }

  if (input.offeredRate >= listRate) {
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
      status: "accepted",
      sessionId: input.sessionId,
      loadId: input.loadId,
      listRate,
      offeredRate: input.offeredRate,
      round,
      maxRounds,
      floorRate,
      agreedRate: input.offeredRate,
      message: "Rate accepted. Proceeding with booking.",
      transferMessage: TRANSFER_MESSAGE,
    };
  }

  if (input.offeredRate < floorRate) {
    const counterRate =
      round === maxRounds ? listRate : roundCurrency((input.offeredRate + listRate) / 2);

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
        status: "declined",
        sessionId: input.sessionId,
        loadId: input.loadId,
        listRate,
        offeredRate: input.offeredRate,
        counterRate,
        round,
        maxRounds,
        floorRate,
        message: `Final counter offer of $${counterRate} is our best rate. Best and final offer reached.`,
      };
    }

    return {
      status: "countered",
      sessionId: input.sessionId,
      loadId: input.loadId,
      listRate,
      offeredRate: input.offeredRate,
      counterRate,
      round,
      maxRounds,
      floorRate,
      message: `Offer below minimum of $${floorRate}. Counter offer: $${counterRate}.`,
    };
  }

  const counterRate =
    round === maxRounds ? listRate : roundCurrency((input.offeredRate + listRate) / 2);

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
    return {
      status: "countered",
      sessionId: input.sessionId,
      loadId: input.loadId,
      listRate,
      offeredRate: input.offeredRate,
      counterRate,
      round,
      maxRounds,
      floorRate,
      message: `This is our final offer at $${counterRate}. Please confirm if you accept.`,
    };
  }

  return {
    status: "countered",
    sessionId: input.sessionId,
    loadId: input.loadId,
    listRate,
    offeredRate: input.offeredRate,
    counterRate,
    round,
    maxRounds,
    floorRate,
    message: `Counter offer: $${counterRate}.`,
  };
}
