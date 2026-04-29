import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, buildings, zones } from "@/db/schema";
import { eq, like, or, sql, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          like(customers.name, pattern),
          like(customers.phone, pattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, customersData] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause),
      db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          apartmentNumber: customers.apartmentNumber,
          totalOrders: customers.totalOrders,
          totalSpent: customers.totalSpent,
          notes: customers.notes,
          createdAt: customers.createdAt,
          buildingCode: buildings.code,
          zoneName: zones.name,
        })
        .from(customers)
        .leftJoin(buildings, eq(customers.buildingId, buildings.id))
        .leftJoin(zones, eq(buildings.zoneId, zones.id))
        .where(whereClause)
        .orderBy(desc(customers.totalOrders))
        .limit(limit)
        .offset(offset),
    ]);

    return NextResponse.json({
      customers: customersData,
      total: Number(totalResult[0]?.count || 0),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      buildingCode,
      apartmentNumber,
      addressNote,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Thiếu tên hoặc số điện thoại" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // Check for existing customer
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, normalizedPhone))
      .then((rows) => rows[0]);

    if (existing) {
      return NextResponse.json(
        { error: "Số điện thoại đã tồn tại" },
        { status: 409 }
      );
    }

    let buildingId = null;
    if (buildingCode) {
      const building = await db
        .select()
        .from(buildings)
        .where(eq(buildings.code, buildingCode))
        .then((rows) => rows[0]);
      if (building) {
        buildingId = building.id;
      }
    }

    const [customer] = await db
      .insert(customers)
      .values({
        name,
        phone: normalizedPhone,
        buildingId,
        apartmentNumber: apartmentNumber || null,
        addressNote: addressNote || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
