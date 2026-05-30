import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: Database | undefined;
};

function createClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return postgres(url, { max: 10 });
}

function getDb(): Database {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const client = globalForDb.client ?? createClient();

  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }

  globalForDb.db = drizzle(client, { schema });
  return globalForDb.db;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});
