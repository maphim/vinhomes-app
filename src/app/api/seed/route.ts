import { NextResponse } from "next/server";
import { db } from "@/db";
import { zones, buildings, products, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Seed data for Vinhomes Smart City
const ZONES_DATA = [
  { code: "sapphire-1", name: "The Sapphire 1", sortOrder: 1 },
  { code: "sapphire-2", name: "The Sapphire 2", sortOrder: 2 },
  { code: "sapphire-3", name: "The Sapphire 3", sortOrder: 3 },
  { code: "sapphire-4", name: "The Sapphire 4", sortOrder: 4 },
  { code: "miami", name: "The Miami", sortOrder: 5 },
  { code: "sakura", name: "The Sakura", sortOrder: 6 },
  { code: "victoria", name: "The Victoria", sortOrder: 7 },
  { code: "tonkin", name: "The Tonkin", sortOrder: 8 },
  { code: "canopy", name: "The Canopy Residences", sortOrder: 9 },
  { code: "masteri", name: "Masteri West Heights", sortOrder: 10 },
  { code: "imperia", name: "Imperia The Sola Park", sortOrder: 11 },
  { code: "lumiere", name: "Lumiere Evergreen", sortOrder: 12 },
];

const BUILDINGS_DATA: { zoneCode: string; code: string; name: string }[] = [
  // Sapphire 1
  { zoneCode: "sapphire-1", code: "S101", name: "S1.01" },
  { zoneCode: "sapphire-1", code: "S102", name: "S1.02" },
  { zoneCode: "sapphire-1", code: "S103", name: "S1.03" },
  { zoneCode: "sapphire-1", code: "S104", name: "S1.04" },
  { zoneCode: "sapphire-1", code: "S105", name: "S1.05" },
  { zoneCode: "sapphire-1", code: "S106", name: "S1.06" },
  // Sapphire 2
  { zoneCode: "sapphire-2", code: "S201", name: "S2.01" },
  { zoneCode: "sapphire-2", code: "S202", name: "S2.02" },
  { zoneCode: "sapphire-2", code: "S203", name: "S2.03" },
  { zoneCode: "sapphire-2", code: "S204", name: "S2.04" },
  { zoneCode: "sapphire-2", code: "S205", name: "S2.05" },
  // Sapphire 3
  { zoneCode: "sapphire-3", code: "S301", name: "S3.01" },
  { zoneCode: "sapphire-3", code: "S302", name: "S3.02" },
  { zoneCode: "sapphire-3", code: "S303", name: "S3.03" },
  // Sapphire 4
  { zoneCode: "sapphire-4", code: "S401", name: "S4.01" },
  { zoneCode: "sapphire-4", code: "S402", name: "S4.02" },
  // Miami
  { zoneCode: "miami", code: "GS1", name: "GS1" },
  { zoneCode: "miami", code: "GS2", name: "GS2" },
  { zoneCode: "miami", code: "GS3", name: "GS3" },
  { zoneCode: "miami", code: "GS4", name: "GS4" },
  { zoneCode: "miami", code: "GS5", name: "GS5" },
  { zoneCode: "miami", code: "GS6", name: "GS6" },
  // Sakura
  { zoneCode: "sakura", code: "SK1", name: "SK1" },
  { zoneCode: "sakura", code: "SK2", name: "SK2" },
  { zoneCode: "sakura", code: "SK3", name: "SK3" },
  // Victoria
  { zoneCode: "victoria", code: "V1", name: "V1" },
  { zoneCode: "victoria", code: "V2", name: "V2" },
  { zoneCode: "victoria", code: "V3", name: "V3" },
  // Tonkin
  { zoneCode: "tonkin", code: "TK1", name: "TK1" },
  { zoneCode: "tonkin", code: "TK2", name: "TK2" },
  // Canopy
  { zoneCode: "canopy", code: "TC1", name: "TC1" },
  { zoneCode: "canopy", code: "TC2", name: "TC2" },
  { zoneCode: "canopy", code: "TC3", name: "TC3" },
  // Masteri West Heights
  { zoneCode: "masteri", code: "MWH-A", name: "Tòa A" },
  { zoneCode: "masteri", code: "MWH-B", name: "Tòa B" },
  { zoneCode: "masteri", code: "MWH-C", name: "Tòa C" },
  { zoneCode: "masteri", code: "MWH-D", name: "Tòa D" },
  // Imperia The Sola Park
  { zoneCode: "imperia", code: "ISP-A", name: "Tòa A" },
  { zoneCode: "imperia", code: "ISP-B", name: "Tòa B" },
  { zoneCode: "imperia", code: "ISP-C", name: "Tòa C" },
  { zoneCode: "imperia", code: "ISP-D", name: "Tòa D" },
  { zoneCode: "imperia", code: "ISP-E", name: "Tòa E" },
  // Lumiere Evergreen
  { zoneCode: "lumiere", code: "LE-A", name: "Tòa A" },
  { zoneCode: "lumiere", code: "LE-B", name: "Tòa B" },
];

const SAMPLE_PRODUCTS = [
  { name: "Bánh mì thịt", price: 15000, unit: "cái", category: "food", sortOrder: 1 },
  { name: "Bánh mì trứng", price: 12000, unit: "cái", category: "food", sortOrder: 2 },
  { name: "Bánh mì pate", price: 15000, unit: "cái", category: "food", sortOrder: 3 },
  { name: "Bánh mì chả lụa", price: 15000, unit: "cái", category: "food", sortOrder: 4 },
  { name: "Bánh mì gà", price: 20000, unit: "cái", category: "food", sortOrder: 5 },
  { name: "Xôi mặn", price: 15000, unit: "phần", category: "food", sortOrder: 6 },
  { name: "Xôi gà", price: 25000, unit: "phần", category: "food", sortOrder: 7 },
  { name: "Phở bò", price: 35000, unit: "phần", category: "food", sortOrder: 8 },
  { name: "Bún chả", price: 30000, unit: "phần", category: "food", sortOrder: 9 },
  { name: "Cơm tấm", price: 30000, unit: "phần", category: "food", sortOrder: 10 },
  { name: "Cơm gà", price: 35000, unit: "phần", category: "food", sortOrder: 11 },
  { name: "Trà sữa", price: 25000, unit: "ly", category: "drink", sortOrder: 12 },
  { name: "Cà phê đen", price: 15000, unit: "ly", category: "drink", sortOrder: 13 },
  { name: "Cà phê sữa", price: 18000, unit: "ly", category: "drink", sortOrder: 14 },
  { name: "Nước mía", price: 10000, unit: "ly", category: "drink", sortOrder: 15 },
  { name: "Nước dừa", price: 15000, unit: "ly", category: "drink", sortOrder: 16 },
  { name: "Trà đào", price: 20000, unit: "ly", category: "drink", sortOrder: 17 },
  { name: "Sinh tố bơ", price: 25000, unit: "ly", category: "drink", sortOrder: 18 },
  { name: "Khoai tây chiên", price: 15000, unit: "hộp", category: "snack", sortOrder: 19 },
  { name: "Gà rán (1 miếng)", price: 20000, unit: "cái", category: "food", sortOrder: 20 },
  { name: "Nem chua rán", price: 10000, unit: "cái", category: "snack", sortOrder: 21 },
  { name: "Bánh tráng trộn", price: 15000, unit: "phần", category: "snack", sortOrder: 22 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await runSeed();
    const status = result.ok ? "✅" : "ℹ️";
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khởi tạo dữ liệu</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f0f4f8; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    .success { color: #16a34a; }
    .info { color: #64748b; }
    .warning { color: #d97706; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.25rem 0; font-size: 0.875rem; }
    .btn { display: inline-block; margin-top: 1rem; padding: 0.5rem 1rem; background: #1a73e8; color: white; text-decoration: none; border-radius: 6px; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1 class="${result.ok ? 'success' : 'warning'}">${status} ${result.message || 'Thành công!'}</h1>
    ${result.ok ? `
    <p class="info">Dữ liệu đã được khởi tạo:</p>
    <ul>
      <li>${result.zones} phân khu</li>
      <li>${result.buildings} tòa nhà</li>
      <li>${result.products} sản phẩm mẫu</li>
      <li>Tài khoản admin: <strong>${result.adminEmail}</strong> / <strong>${result.adminPassword}</strong></li>
    </ul>
    <a href="/login" class="btn">Đăng nhập ngay</a>
    ` : ''}
    <p style="margin-top:1rem;font-size:0.75rem;color:#94a3b8;">${new Date().toLocaleString('vi-VN')}</p>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new NextResponse(
      `<html><body style="font-family:system-ui;padding:2rem"><h1>❌ Lỗi</h1><pre style="color:red">${msg}</pre></body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}

async function runSeed() {
  // Check if already seeded
  const existingZones = await db.select().from(zones).limit(1);
  if (existingZones.length > 0) {
    return {
      ok: false,
      message: "Dữ liệu đã được khởi tạo trước đó",
      zones: 0, buildings: 0, products: 0,
    };
  }

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await db.insert(users).values({
    name: "Quản lý",
    email: "admin@vinhomes.app",
    passwordHash,
    role: "admin",
    phone: "0912345678",
  });

  // Create zones
  for (const z of ZONES_DATA) {
    await db.insert(zones).values({
      code: z.code,
      name: z.name,
      sortOrder: z.sortOrder,
      description: `Phân khu ${z.name}`,
    });
  }

  // Get zone map
  const zoneRows = await db.select().from(zones);
  const zoneMap = new Map(zoneRows.map((z) => [z.code, z.id]));

  // Create buildings
  for (const b of BUILDINGS_DATA) {
    const zoneId = zoneMap.get(b.zoneCode);
    if (zoneId) {
      await db.insert(buildings).values({
        zoneId,
        code: b.code,
        name: b.name,
      });
    }
  }

  // Create sample products
  for (const p of SAMPLE_PRODUCTS) {
    await db.insert(products).values({
      name: p.name,
      price: String(p.price),
      unit: p.unit,
      category: p.category,
      sortOrder: p.sortOrder,
    });
  }

  return {
    ok: true,
    message: "Khởi tạo dữ liệu thành công!",
    zones: ZONES_DATA.length,
    buildings: BUILDINGS_DATA.length,
    products: SAMPLE_PRODUCTS.length,
    adminEmail: "admin@vinhomes.app",
    adminPassword: "admin123",
  };
}

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runSeed();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error seeding data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
