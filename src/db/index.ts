import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, type PoolConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL!,
  max: 10,
};

const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
export type Db = typeof db;
