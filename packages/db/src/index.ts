import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

let _db: Database | undefined;

function createDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env (local) or Vercel environment variables (production).",
    );
  }
  return drizzle(neon(url), { schema });
}

const handler: ProxyHandler<Database> = {
  get(_, prop) {
    if (prop === Symbol.toPrimitive || prop === Symbol.iterator || prop === "toJSON") {
      return undefined;
    }
    if (!_db) _db = createDb();
    return Reflect.get(_db, prop);
  },
};

export const db: Database = new Proxy({} as Database, handler);
