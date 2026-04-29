import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  customers,
  orderItems,
  orderStatusHistory,
  buildings,
  zones,
  users,
} from "@/db/schema";
import { eq, like, or, sql, and, desc, gte, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateOrderCode, normalizePhone } from "@/lib/utils";

// ──────────────────── HELPERS ────────────────────

/** Get the start of a day offset from today. 0 = today, 1 = tomorrow, -1 = yesterday */
function getDayRange(offset: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

// ──────────────────── GET /api/orders ────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const zoneCode = url.searchParams.get("zone") || "all";
  // day: "today" | "tomorrow" | "all"  (default "today")
  const day = url.searchParams.get("day") || "today";
  const offset = (page - 1) * limit;

  try {
    const conditions: any[] = [];

    // ── Date filtering (uses createdAt; deliveryDate column support when DB migrated) ──
    if (day !== "all") {
      const dayOffset = day === "tomorrow" ? 1 : 0;
      const { start, end } = getDayRange(dayOffset);
      conditions.push(and(gte(orders.createdAt, start), lt(orders.createdAt, end)) as any);
    }

    // ── Search ──
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(orders.orderCode, searchPattern),
          like(customers.name, searchPattern),
          like(customers.phone, `%${search}%`),
        ) as any,
      );
    }

    // ── Status filter ──
    if (status !== "all") {
      conditions.push(eq(orders.status, status as any) as any);
    }

    // ── Zone filter ──
    if (zoneCode !== "all") {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${buildings} b 
                JOIN ${zones} z ON b.zone_id = z.id 
                WHERE b.id = ${orders.buildingId} 
                AND z.code = ${zoneCode})` as any,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // ── Main query with JOINs (no subquery) ──
    const [totalResult, ordersData] = await Promise.all([
      // Optimized count: use a subquery to avoid expensive count(distinct) with JOINs
      db
        .select({ count: sql<number>`count(*)` })
        .from(
          db
            .select({ id: orders.id })
            .from(orders)
            .leftJoin(customers, eq(orders.customerId, customers.id))
            .where(whereClause)
            .as("filtered_orders"),
        ),
      db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          status: orders.status,
          total: orders.total,
          note: orders.note,
          // deliveryDate: orders.deliveryDate, // requires DB migration
          createdAt: orders.createdAt,
          customerId: customers.id,
          customerName: customers.name,
          customerPhone: customers.phone,
          buildingId: buildings.id,
          buildingCode: buildings.code,
          buildingName: buildings.name,
          zoneId: zones.id,
          zoneName: zones.name,
          driverId: users.id,
          driverName: users.name,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(buildings, eq(orders.buildingId, buildings.id))
        .leftJoin(zones, eq(buildings.zoneId, zones.id))
        .leftJoin(users, eq(orders.assignedDriverId, users.id))
        .where(whereClause)
        .orderBy(
          buildings.code,
          desc(
            sql`CASE 
              WHEN ${orders.status} = 'pending' THEN 1
              WHEN ${orders.status} = 'confirmed' THEN 2
              WHEN ${orders.status} = 'preparing' THEN 3
              WHEN ${orders.status} = 'delivering' THEN 4
              WHEN ${orders.status} = 'cash_received' THEN 5
              WHEN ${orders.status} = 'transfer_pending' THEN 6
              WHEN ${orders.status} = 'transferred' THEN 7
              WHEN ${orders.status} = 'delivered' THEN 8
              WHEN ${orders.status} = 'cancelled' THEN 9
              ELSE 10
            END`,
          ),
          desc(orders.createdAt),
        )
        .limit(limit)
        .offset(offset),
    ]);

    // ── Batch fetch items ──
    const orderIds = ordersData.map((o) => o.id);
    let itemsMap: Record<number, any[]> = {};
    if (orderIds.length > 0) {
      const items = await db
        .select()
        .from(orderItems)
        .where(sql`${orderItems.orderId} IN (${sql.join(orderIds, sql`,`)})`);
      itemsMap = items.reduce((acc, item) => {
        if (!acc[item.orderId]) acc[item.orderId] = [];
        acc[item.orderId].push(item);
        return acc;
      }, {} as Record<number, any[]>);
    }

    const ordersWithItems = ordersData.map((o) => ({
      ...o,
      items: itemsMap[o.id] || [],
    }));

    return NextResponse.json({
      orders: ordersWithItems,
      total: Number(totalResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ──────────────────── POST /api/orders ────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      buildingCode,
      apartmentNumber,
      note,
      items: rawItems,
      deliveryDate,
    } = body;

    if (!customerName || !customerPhone || !buildingCode) {
      return NextResponse.json(
        { error: "Thiếu thông tin: tên, SĐT, tòa nhà" },
        { status: 400 },
      );
    }

    const phone = normalizePhone(customerPhone);

    // Find or create customer
    let customer = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .then((rows) => rows[0]);

    // Find building
    const building = await db
      .select()
      .from(buildings)
      .where(eq(buildings.code, buildingCode))
      .then((rows) => rows[0]);

    if (!building) {
      return NextResponse.json(
        { error: `Không tìm thấy tòa nhà: ${buildingCode}` },
        { status: 400 },
      );
    }

    if (customer) {
      await db
        .update(customers)
        .set({
          name: customerName,
          buildingId: building.id,
          apartmentNumber: apartmentNumber || customer.apartmentNumber,
          totalOrders: sql`${customers.totalOrders} + 1`,
        })
        .where(eq(customers.id, customer.id));
    } else {
      customer = await db
        .insert(customers)
        .values({
          name: customerName,
          phone,
          buildingId: building.id,
          apartmentNumber: apartmentNumber || null,
          totalOrders: 1,
        })
        .returning()
        .then((rows) => rows[0]);
    }

    const orderCode = generateOrderCode();

    // Parse items from note if no items provided
    let items = rawItems;
    if (!items || items.length === 0) {
      items = note ? parseItemsFromNote(note) : [];
    }

    // Calculate totals
    let subtotal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        const price = item.unitPrice || 0;
        const qty = item.quantity || 1;
        subtotal += price * qty;
      }
    }

    const deliveryFee = 0;
    const discount = 0;
    const total = subtotal + deliveryFee - discount;

    // Set default deliveryDate to today if not provided
    const defaultDeliveryDate = new Date()
      .toISOString()
      .split("T")[0];

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderCode,
        customerId: customer.id,
        buildingId: building.id,
        status: "pending",
        deliveryDate: deliveryDate || defaultDeliveryDate,
        note: note || null,
        subtotal: String(subtotal),
        deliveryFee: String(deliveryFee),
        discount: String(discount),
        total: String(total),
        paymentStatus: "unpaid",
      })
      .returning();

    // Create order items
    if (items && items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item: any) => {
          const productName = item.productName || item.name || "Sản phẩm";
          const unitPrice = item.unitPrice || item.price || 0;
          const quantity = item.quantity || 1;
          return {
            orderId: order.id,
            productId: item.productId || 1,
            productName,
            quantity,
            unitPrice: String(unitPrice),
            totalPrice: String(unitPrice * quantity),
          };
        }),
      );
    }

    // Create status history
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: "pending",
      changedByUserId: Number(session.user.id),
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ──────────────────── PATCH /api/orders ────────────────────

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, deliveryDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Thiếu ID đơn hàng" },
        { status: 400 },
      );
    }

    const currentOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .then((rows) => rows[0]);

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 },
      );
    }

    // Update order
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }
    }

    if (deliveryDate) {
      updateData.deliveryDate = deliveryDate;
    }

    await db.update(orders).set(updateData).where(eq(orders.id, id));

    // Create status history (only if status changed)
    if (status && status !== currentOrder.status) {
      await db.insert(orderStatusHistory).values({
        orderId: id,
        fromStatus: currentOrder.status as any,
        toStatus: status,
        changedByUserId: Number(session.user.id),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ──────────────────── HELPER: parse items from note ────────────────────

function parseItemsFromNote(note: string): any[] {
  if (!note) return [];

  const items: any[] = [];
  const lines = note
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const patterns = [
      /(\d+)\s*(.+)/,
      /(.+?)\s*x\s*(\d+)/i,
      /(.+?)\s+(\d+)\s*(cái|hộp|chai|gói|kg|lít)?$/,
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let name: string, qty: number;
        if (pattern === patterns[0]) {
          qty = parseInt(match[1]);
          name = match[2].trim();
        } else if (pattern === patterns[1]) {
          name = match[1].trim();
          qty = parseInt(match[2]);
        } else {
          name = match[1].trim();
          qty = parseInt(match[2]);
        }
        if (name.length > 1 && !/^\d+$/.test(name)) {
          items.push({ productName: name, quantity: qty, unitPrice: 0 });
          matched = true;
          break;
        }
      }
    }

    if (!matched && line.length > 2 && !/^\d+$/.test(line)) {
      items.push({ productName: line, quantity: 1, unitPrice: 0 });
    }
  }

  return items;
}
