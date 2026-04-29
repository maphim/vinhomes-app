import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq, like, sql, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";

  try {
    const conditions = [eq(products.isAvailable, true)];
    if (search) {
      conditions.push(
        like(products.name, `%${search}%`)
      );
    }

    const data = await db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.sortOrder));

    return NextResponse.json({ products: data });
  } catch (error) {
    console.error("Error fetching products:", error);
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
    const { name, description, price, unit, category } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: "Thiếu tên hoặc giá sản phẩm" },
        { status: 400 }
      );
    }

    const [product] = await db
      .insert(products)
      .values({
        name,
        description: description || null,
        price: String(price),
        unit: unit || "cái",
        category: category || null,
      })
      .returning();

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing product ID" }, { status: 400 });
    }

    // Mass assignment protection: only allow whitelisted fields
    const ALLOWED_FIELDS = ['name', 'description', 'price', 'unit', 'category', 'isAvailable', 'sortOrder'];
    const sanitizedUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    await db.update(products).set(sanitizedUpdates).where(eq(products.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
