import { and, desc, eq, ilike } from "drizzle-orm";

import { loads } from "@/db/schema";
import { db } from "@/lib/db";

export function formatLoad(load: typeof loads.$inferSelect) {
  return {
    load_id: load.loadId,
    origin: load.origin,
    destination: load.destination,
    pickup_datetime: load.pickupDatetime.toISOString(),
    delivery_datetime: load.deliveryDatetime.toISOString(),
    equipment_type: load.equipmentType,
    loadboard_rate: Number(load.loadboardRate),
    notes: load.notes,
    weight: load.weight,
    commodity_type: load.commodityType,
    num_of_pieces: load.numOfPieces,
    miles: load.miles,
    dimensions: load.dimensions,
  };
}

export async function searchLoads(filters: {
  origin?: string | null;
  destination?: string | null;
  equipment_type?: string | null;
  load_id?: string | null;
}) {
  const conditions = [];

  if (filters.load_id) {
    conditions.push(eq(loads.loadId, filters.load_id));
  }

  if (filters.origin) {
    conditions.push(ilike(loads.origin, `%${filters.origin}%`));
  }

  if (filters.destination) {
    conditions.push(ilike(loads.destination, `%${filters.destination}%`));
  }

  if (filters.equipment_type) {
    conditions.push(ilike(loads.equipmentType, `%${filters.equipment_type}%`));
  }

  const results = await db.query.loads.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(loads.pickupDatetime)],
    limit: 10,
  });

  return results.map(formatLoad);
}
