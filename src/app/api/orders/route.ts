import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  orders,
  customers,
  orderItems,
  products,
  orderStatusHistory,
  buildings,
  zones,
} from "@/db/schema";
import { eq, like, or, sql, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateOrderCode, normalizePhone } from "@/lib/utils";

// GET /api/orders - list orders with filters + pagination
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const zoneCode = url.searchParams.get("zone") || "all";
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(orders.orderCode, searchPattern),
          like(customers.name, searchPattern),
          like(customers.phone, `%${search}%`)
        )
      );
    }

    if (status !== "all") {
      conditions.push(eq(orders.status, status as any));
    }

    if (zoneCode !== "all") {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM ${buildings} b 
                JOIN ${zones} z ON b.zone_id = z.id 
                WHERE b.id = ${orders.buildingId} 
                AND z.code = ${zoneCode})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult, ordersData] = await Promise.all([
      db
        .select({ count: sql<number>`count(distinct ${orders.id})` })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .where(whereClause),
      db
        .select({
          id: orders.id,
          orderCode: orders.orderCode,
          status: orders.status,
          total: orders.total,
          note: orders.note,
          createdAt: orders.createdAt,
          customerId: customers.id,
          customerName: customers.name,
          customerPhone: customers.phone,
          buildingCode: buildings.code,
          zoneName: zones.name,
          driverName: sql<string | null>`(SELECT u.name FROM users u WHERE u.id = ${orders.assignedDriverId})`,
        })
        .from(orders)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .leftJoin(buildings, eq(orders.buildingId, buildings.id))
        .leftJoin(zones, eq(buildings.zoneId, zones.id))
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    // Fetch items for each order
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
      { status: 500 }
    );
  }
}

// POST /api/orders - create a new order
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
    } = body;

    if (!customerName || !customerPhone || !buildingCode) {
      return NextResponse.json(
        { error: "Thiếu thông tin: tên, SĐT, tòa nhà" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    if (customer) {
      // Update customer info
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
      // Create new customer
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
      // Try to parse items from note
      if (note) {
        const parsedItems = parseItemsFromNote(note);
        items = parsedItems;
      } else {
        // Create a minimal order with just the basic info
        // Set a default total of 0
        items = [];
      }
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

    // Create order
    const [order] = await db
      .insert(orders)
      .values({
        orderCode,
        customerId: customer.id,
        buildingId: building.id,
        status: "pending",
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
        })
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
      { status: 500 }
    );
  }
}

// PATCH /api/orders - update order status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Thiếu ID hoặc trạng thái" },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Update order
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "delivered") {
      updateData.deliveredAt = new Date();
    }

    await db.update(orders).set(updateData).where(eq(orders.id, id));

    // Create status history
    await db.insert(orderStatusHistory).values({
      orderId: id,
      fromStatus: currentOrder.status as any,
      toStatus: status,
      changedByUserId: Number(session.user.id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Parse items from natural language note text
function parseItemsFromNote(note: string): any[] {
  if (!note) return [];

  const items: any[] = [];

  // Common product patterns in Vietnamese
  const lines = note.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Pattern: "2 bánh mì" or "bánh mì x2" or "bánh mì 2 cái"
    const patterns = [
      // "2 bánh mì" - quantity first
      /(\d+)\s*(.+)/,
      // "bánh mì x2" or "bánh mì x 2"
      /(.+?)\s*x\s*(\d+)/i,
      // "bánh mì 2" - quantity at end
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
        // Skip if name is just a number or too short
        if (name.length > 1 && !/^\d+$/.test(name)) {
          items.push({
            productName: name,
            quantity: qty,
            unitPrice: 0,
          });
          matched = true;
          break;
        }
      }
    }

    if (!matched && line.length > 2 && !/^\d+$/.test(line)) {
      // Single item without quantity
      items.push({
        productName: line,
        quantity: 1,
        unitPrice: 0,
      });
    }
  }

  return items;
}
