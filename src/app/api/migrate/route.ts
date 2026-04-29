import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
export const dynamic = 'force-dynamic';

/**
 * POST /api/migrate
 * Manual endpoint to run DB schema migration.
 * This applies pending changes (new columns, enums, indexes).
 */
export async function POST() {
  try {
    const results: string[] = [];

    // 1. Add new enum values for order_status (pg_enum doesn't support ADD VALUE IF NOT EXISTS before PG 14)
    const newStatuses = ["cash_received", "transfer_pending", "transferred"];
    for (const status of newStatuses) {
      try {
        await db.execute(
          sql`ALTER TYPE order_status ADD VALUE ${sql.raw(`'${status}'`)}`,
        );
        results.push(`✅ Added enum value: ${status}`);
      } catch (e: any) {
        if (e.message?.includes("already exists")) {
          results.push(`⏭️  Enum value already exists: ${status}`);
        } else {
          results.push(`⚠️  Error adding ${status}: ${e.message}`);
        }
      }
    }

    // 2. Add delivery_date column if not exists
    try {
      await db.execute(
        sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date date`,
      );
      results.push(`✅ Added column: delivery_date`);
    } catch (e: any) {
      results.push(`⚠️  Error adding delivery_date: ${e.message}`);
    }

    // 3. Create indexes if not exists
    const indexes = [
      { name: "orders_created_at_idx", col: "created_at" },
      { name: "orders_status_idx", col: "status" },
      { name: "orders_building_id_idx", col: "building_id" },
      { name: "orders_customer_id_idx", col: "customer_id" },
      { name: "orders_delivery_date_idx", col: "delivery_date" },
    ];
    for (const idx of indexes) {
      try {
        await db.execute(
          sql`CREATE INDEX IF NOT EXISTS ${sql.raw(idx.name)} ON orders (${sql.raw(idx.col)})`,
        );
        results.push(`✅ Created index: ${idx.name}`);
      } catch (e: any) {
        results.push(`⚠️  Error creating index ${idx.name}: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      details: results,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// GET - show migration page
export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DB Migration - Vinhomes</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
    h1 { font-size: 1.25rem; }
    .btn { display: inline-block; margin-top: 1rem; padding: 0.75rem 2rem; background: #1a73e8; color: white; text-decoration: none; border-radius: 8px; font-size: 1rem; cursor: pointer; border: none; }
    .btn:hover { background: #1557b0; }
    .warning { color: #d97706; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🗄️ DB Migration</h1>
    <p class="warning">Run this to update the database schema after code changes.</p>
    <p style="font-size:0.875rem;color:#64748b;">
      Adds: delivery_date column, new order statuses (cash_received, transfer_pending, transferred), performance indexes
    </p>
    <button class="btn" onclick="runMigration()">▶️ Run Migration</button>
    <pre id="result" style="margin-top:1rem;text-align:left;font-size:0.75rem;background:#f8fafc;padding:1rem;border-radius:8px;max-height:300px;overflow:auto;"></pre>
    <script>
      async function runMigration() {
        const btn = document.querySelector('.btn');
        const result = document.getElementById('result');
        btn.disabled = true;
        btn.textContent = '⏳ Running...';
        result.textContent = 'Running migration...';
        try {
          const res = await fetch('/api/migrate', { method: 'POST' });
          const data = await res.json();
          result.textContent = JSON.stringify(data, null, 2);
          btn.textContent = '✅ Done';
        } catch(e) {
          result.textContent = 'Error: ' + e.message;
          btn.textContent = '❌ Failed';
        }
        btn.disabled = false;
      }
    </script>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
