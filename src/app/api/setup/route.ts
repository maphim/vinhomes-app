import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  const checks: { check: string; status: "ok" | "error"; detail: string }[] = [];

  // 1. Check AUTH_SECRET
  checks.push({
    check: "AUTH_SECRET",
    status: process.env.AUTH_SECRET ? "ok" : "error",
    detail: process.env.AUTH_SECRET
      ? `Đã cấu hình (${process.env.AUTH_SECRET.slice(0, 8)}...)`
      : "Thiếu! Cần thêm vào Vercel Environment Variables",
  });

  // 2. Check DATABASE_URL
  checks.push({
    check: "DATABASE_URL",
    status: process.env.DATABASE_URL ? "ok" : "error",
    detail: process.env.DATABASE_URL
      ? `Đã cấu hình (${process.env.DATABASE_URL.slice(0, 20)}...)`
      : "Thiếu! Cần add Neon Postgres Integration",
  });

  // 3. Check database connection
  if (process.env.DATABASE_URL) {
    try {
      const result = await db.execute(sql`SELECT 1+1 as test`);
      checks.push({
        check: "DB Connection",
        status: "ok",
        detail: "Kết nối database thành công",
      });
    } catch (err: any) {
      checks.push({
        check: "DB Connection",
        status: "error",
        detail: `Lỗi kết nối: ${err.message}`,
      });
    }
  }

  // 4. Check tables exist
  if (process.env.DATABASE_URL) {
    try {
      const tables = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      const tableNames = tables.rows.map((r: any) => r.table_name).sort();
      checks.push({
        check: "Tables",
        status: tableNames.length > 0 ? "ok" : "error",
        detail: tableNames.length > 0
          ? `${tableNames.length} tables: ${tableNames.join(", ")}`
          : "Chưa có bảng nào! Cần chạy: npx drizzle-kit push",
      });
    } catch (err: any) {
      checks.push({
        check: "Tables",
        status: "error",
        detail: `Không thể kiểm tra: ${err.message}`,
      });
    }
  }

  const allOk = checks.every((c) => c.status === "ok");
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kiểm tra hệ thống</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #f0f4f8; margin: 0; padding: 2rem; }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { font-size: 1.25rem; color: #1e293b; margin-bottom: 1rem; }
    .card { background: white; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.1); overflow: hidden; }
    .item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .item:last-child { border-bottom: none; }
    .icon { width: 1.5rem; text-align: center; }
    .ok .icon { color: #16a34a; }
    .error .icon { color: #dc2626; }
    .label { font-weight: 600; font-size: 0.875rem; color: #1e293b; min-width: 120px; }
    .detail { font-size: 0.75rem; color: #64748b; }
    .error .detail { color: #dc2626; }
    .banner { margin-top: 1rem; padding: 1rem; border-radius: 12px; text-align: center; font-size: 0.875rem; }
    .success { background: #dcfce7; color: #16a34a; }
    .fail { background: #fee2e2; color: #dc2626; }
    .btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.5rem; background: #1a73e8; color: white; text-decoration: none; border-radius: 6px; font-size: 0.875rem; }
    .btn-success { background: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Kiểm tra cấu hình</h1>
    <div class="card">
      ${checks.map(c => `
        <div class="item ${c.status}">
          <div class="icon">${c.status === "ok" ? "✅" : "❌"}</div>
          <div class="label">${c.check}</div>
          <div class="detail">${c.detail}</div>
        </div>
      `).join("")}
    </div>
    <div class="banner ${allOk ? 'success' : 'fail'}">
      ${allOk ? "✅ Hệ thống sẵn sàng! Đăng nhập ngay." : "⚠️ Cần khắc phục các lỗi trên."}
    </div>
    ${allOk ? '<a href="/login" class="btn btn-success">Đăng nhập</a>' : ''}
    ${
      !checks.find(c => c.check === "Tables") ||
      checks.find(c => c.check === "Tables")?.status === "error"
        ? '<a href="/api/seed" class="btn">Khởi tạo dữ liệu</a>'
        : ""
    }
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
