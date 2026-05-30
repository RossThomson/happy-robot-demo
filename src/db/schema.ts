import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const carrierStatusEnum = pgEnum("carrier_status", [
  "Active",
  "Inactive",
]);

export const callOutcomeEnum = pgEnum("call_outcome", [
  "booked",
  "declined",
  "no_match",
  "ineligible_carrier",
  "abandoned",
]);

export const callSentimentEnum = pgEnum("call_sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const negotiationStatusEnum = pgEnum("negotiation_status", [
  "in_progress",
  "accepted",
  "declined",
]);

export const loads = pgTable("loads", {
  loadId: text("load_id").primaryKey(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  pickupDatetime: timestamp("pickup_datetime", {
    withTimezone: true,
  }).notNull(),
  deliveryDatetime: timestamp("delivery_datetime", {
    withTimezone: true,
  }).notNull(),
  equipmentType: text("equipment_type").notNull(),
  loadboardRate: numeric("loadboard_rate", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  weight: integer("weight").notNull(),
  commodityType: text("commodity_type").notNull(),
  numOfPieces: integer("num_of_pieces").notNull(),
  miles: integer("miles").notNull(),
  dimensions: text("dimensions").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const carriers = pgTable("carriers", {
  mcNumber: text("mc_number").primaryKey(),
  legalName: text("legal_name").notNull(),
  dbaName: text("dba_name"),
  status: carrierStatusEnum("status").notNull().default("Active"),
  eligible: boolean("eligible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const negotiationSessions = pgTable("negotiation_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  loadId: text("load_id")
    .notNull()
    .references(() => loads.loadId),
  listRate: numeric("list_rate", { precision: 10, scale: 2 }).notNull(),
  currentRound: integer("current_round").notNull().default(0),
  lastOfferedRate: numeric("last_offered_rate", { precision: 10, scale: 2 }),
  lastCounterRate: numeric("last_counter_rate", { precision: 10, scale: 2 }),
  status: negotiationStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const calls = pgTable("calls", {
  id: uuid("id").defaultRandom().primaryKey(),
  callId: text("call_id"),
  mcNumber: text("mc_number"),
  loadId: text("load_id").references(() => loads.loadId),
  initialRate: numeric("initial_rate", { precision: 10, scale: 2 }),
  finalRate: numeric("final_rate", { precision: 10, scale: 2 }),
  negotiationRounds: integer("negotiation_rounds").notNull().default(0),
  outcome: callOutcomeEnum("outcome").notNull(),
  sentiment: callSentimentEnum("sentiment").notNull(),
  extractedData: jsonb("extracted_data"),
  transcriptSummary: text("transcript_summary"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Load = typeof loads.$inferSelect;
export type Carrier = typeof carriers.$inferSelect;
export type Call = typeof calls.$inferSelect;
export type NegotiationSession = typeof negotiationSessions.$inferSelect;
