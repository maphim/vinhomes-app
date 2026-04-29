#!/usr/bin/env node
/**
 * Database migration script for Vercel deployments.
 * Runs drizzle-kit push to sync schema changes.
 *
 * Usage:
 *   node scripts/migrate.mjs          # push schema
 *   node scripts/migrate.mjs --generate  # generate migration files
 *
 * Environment:
 *   DATABASE_URL - required, PostgreSQL connection string
 */

import { execSync } from "child_process";

const args = process.argv.slice(2);
const shouldGenerate = args.includes("--generate");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set, skipping migration");
  process.exit(0);
}

try {
  if (shouldGenerate) {
    console.log("📦 Generating migration files...");
    execSync("npx drizzle-kit generate", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL },
    });
    console.log("✅ Migration files generated");
  }

  console.log("📦 Pushing schema to database...");
  execSync("npx drizzle-kit push", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL },
  });
  console.log("✅ Database schema is up to date");
} catch (err) {
  // Don't fail the build if migration fails (app can still work)
  console.warn("⚠️  Migration failed (non-fatal):", err.message);
  console.warn("   The app will still start, but schema may be out of sync.");
}
