import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, orderItems, orderStatusHistory, buildings, products } from "@/db/schema";
import { eq, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { generateOrderCode, normalizePhone, isValidVietnamesePhone } from "@/lib/utils";
export const dynamic = "force-dynamic";

/**
 * Parse a single note/comment into structured order data.
 * This handles various Vietnamese comment formats like:
 * - "Chị Lan 0912345678 S101 1508: 2 bánh mì, 3 trà sữa"
 * - "A101 - 2 bánh mì - 0987654321"
 * - "S201.2005: 1 cà phê đen, 2 bánh mỳ"
 */
function parseNote(note: string): {
  customerName?: string;
  phone?: string;
  buildingCode?: string;
  apartmentNumber?: string;
  items: { name: string; quantity: number }[];
  rawNote: string;
} {
  const result: {
    customerName?: string;
    phone?: string;
    buildingCode?: string;
    apartmentNumber?: string;
    items: { name: string; quantity: number }[];
    rawNote: string;
  } = {
    items: [],
    rawNote: note,
  };

  if (!note) return result;

  // 1. Extract phone number (Vietnamese format)
  const phoneRegex = /(0[3-9][0-9]{8,9})/;
  const phoneMatch = note.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
    note = note.replace(phoneMatch[0], "").trim();
  }

  // 2. Extract building code (e.g., S101, S201, GS2, V1, TK1, TC1, MWH-A)
  const buildingRegex = /\b(S\d{3}|GS[1-6]|SK[1-3]|V[1-3]|TK[1-2]|TC[1-3]|MWH-[A-D]|ISP-[A-E]|LE-[A-B])\b/i;
  const buildingMatch = note.match(buildingRegex);
  if (buildingMatch) {
    result.buildingCode = buildingMatch[1].toUpperCase();
    note = note.replace(buildingMatch[0], "").trim();
  }

  // 3. Extract apartment number (digits after building or standalone 3-4 digit number)
  const aptRegex = /(\d{3,4})/;
  const aptMatch = note.match(aptRegex);
  if (aptMatch) {
    result.apartmentNumber = aptMatch[1];
    note = note.replace(aptMatch[0], "").trim();
  }

  // 4. Extract customer name (try to get a meaningful name)
  // Look for common Vietnamese name patterns
  const namePatterns = [
    /(?:chị|anh|bác|cô|chú|ông|bà)\s+([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)/,
    /^([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*)\s*(?::|-|–)/,
  ];

  for (const pattern of namePatterns) {
    const match = note.match(pattern);
    if (match) {
      const fullMatch = match[0];
      result.customerName = match[1].trim();
      note = note.replace(fullMatch, "").trim();
      break;
    }
  }

  // 5. Extract items from the remaining text
  // Split by common delimiters
  const itemDelimiters = /[,;•\-–\n]+/;
  const parts = note.split(itemDelimiters).map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    // Try to match quantity + item patterns
    const itemPatterns = [
      // "2 bánh mì" or "1 cà phê"
      /^(\d+)\s+(.+)$/,
      // "bánh mì x2"
      /^(.+?)\s*x\s*(\d+)$/i,
      // "bánh mì 2 cái"
      /^(.+?)\s+(\d+)\s*(cái|hộp|chai|gói|kg|lít|ly|cốc|phần)$/i,
    ];

    let matched = false;
    for (const pat of itemPatterns) {
      const m = part.match(pat);
      if (m) {
        let name: string, qty: number;
        if (pat === itemPatterns[0]) {
          qty = parseInt(m[1]);
          name = m[2].trim();
        } else if (pat === itemPatterns[1]) {
          name = m[1].trim();
          qty = parseInt(m[2]);
        } else {
          name = m[1].trim();
          qty = parseInt(m[2]);
        }
        if (name && name.length > 1 && !/^\d+$/.test(name)) {
          result.items.push({ name, quantity: qty });
          matched = true;
          break;
        }
      }
    }

    // If no pattern matched, treat as a single item
    if (!matched && part.length > 2 && !/^\d+$/.test(part)) {
      // Check if the part is a name (capitalized words)
      const nameCheck = /^[A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*$/;
      if (!nameCheck.test(part)) {
        result.items.push({ name: part, quantity: 1 });
      }
    }
  }

  return result;
}

// POST /api/import - import orders from pasted text

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || text.trim().length < 5) {
      return NextResponse.json(
        { error: "Vui lòng nhập nội dung đơn hàng" },
        { status: 400 }
      );
    }

    // Split by multiple lines or orders
    const lines = text
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const results: {
      success: boolean;
      orderCode?: string;
      note: string;
      customerName?: string;
      phone?: string;
      buildingCode?: string;
      items?: any[];
      error?: string;
    }[] = [];

    let currentBatch: string[] = [];

    for (const line of lines) {
      // If line starts a new order (has phone or building code), save current batch
      const hasPhone = /0[3-9][0-9]{8,9}/.test(line);
      const hasBuilding = /\b(S\d{3}|GS[1-6]|SK[1-3]|V[1-3]|TK[1-2]|TC[1-3]|MWH-[A-D]|ISP-[A-E]|LE-[AB])\b/i.test(line);

      if ((hasPhone || hasBuilding) && currentBatch.length > 0) {
        // Process current batch
        const result = await processSingleOrder(currentBatch.join(" "), Number(session.user.id));
        results.push(result);
        currentBatch = [line];
      } else {
        currentBatch.push(line);
      }
    }

    // Process last batch
    if (currentBatch.length > 0) {
      const result = await processSingleOrder(currentBatch.join(" "), Number(session.user.id));
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("Error importing orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processSingleOrder(
  note: string,
  userId: number
): Promise<{
  success: boolean;
  orderCode?: string;
  note: string;
  customerName?: string;
  phone?: string;
  buildingCode?: string;
  items?: any[];
  error?: string;
}> {
  try {
    const parsed = parseNote(note);

    if (!parsed.phone) {
      return { success: false, note, error: "Không tìm thấy số điện thoại" };
    }

    if (!parsed.buildingCode) {
      return { success: false, note, error: "Không tìm thấy mã tòa nhà" };
    }

    if (parsed.items.length === 0) {
      return { success: false, note, error: "Không tìm thấy sản phẩm" };
    }

    const phone = normalizePhone(parsed.phone);

    if (!isValidVietnamesePhone(phone)) {
      return { success: false, note, error: "Số điện thoại không hợp lệ" };
    }

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
      .where(eq(buildings.code, parsed.buildingCode))
      .then((rows) => rows[0]);

    if (!building) {
      return {
        success: false,
        note,
        error: `Không tìm thấy tòa nhà: ${parsed.buildingCode}`,
      };
    }

    if (customer) {
      // Update customer info
      await db
        .update(customers)
        .set({
          name: parsed.customerName || customer.name,
          buildingId: building.id,
          apartmentNumber: parsed.apartmentNumber || customer.apartmentNumber,
          totalOrders: (customer.totalOrders ?? 0) + 1,
        })
        .where(eq(customers.id, customer.id));
    } else {
      // Create new customer
      customer = await db
        .insert(customers)
        .values({
          name: parsed.customerName || parsed.phone,
          phone,
          buildingId: building.id,
          apartmentNumber: parsed.apartmentNumber || null,
          totalOrders: 1,
        })
        .returning()
        .then((rows) => rows[0]);
    }

    const orderCode = generateOrderCode();

    // Calculate totals with 0 price (prices will be filled in later)
    const items = await Promise.all(
      parsed.items.map(async (item) => {
        let productId = 1;
        // Try to find matching product by name (case-insensitive)
        const [matchingProduct] = await db
          .select()
          .from(products)
          .where(like(products.name, `%${item.name}%`))
          .limit(1);
        if (matchingProduct) {
          productId = matchingProduct.id;
        }
        return {
          productName: item.name,
          quantity: item.quantity,
          unitPrice: "0",
          totalPrice: "0",
          productId,
        };
      })
    );

    const [order] = await db
      .insert(orders)
      .values({
        orderCode,
        customerId: customer.id,
        buildingId: building.id,
        status: "pending",
        note,
        subtotal: "0",
        total: "0",
        paymentStatus: "unpaid",
        source: "import",
        importedFromNote: true,
      })
      .returning();

    // Create order items
    await db.insert(orderItems).values(
      items.map((item) => ({
        ...item,
        orderId: order.id,
      }))
    );

    // Create status history
    await db.insert(orderStatusHistory).values({
      orderId: order.id,
      toStatus: "pending",
      changedByUserId: userId,
    });

    return {
      success: true,
      orderCode,
      note,
      customerName: parsed.customerName,
      phone: parsed.phone,
      buildingCode: parsed.buildingCode,
      items: parsed.items,
    };
  } catch (error: any) {
    return {
      success: false,
      note,
      error: error.message || "Lỗi xử lý",
    };
  }
}
