import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drivers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "driver"))
    .orderBy(users.name);

  return NextResponse.json({ users: drivers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((rows) => rows[0]);

    if (existing) {
      return NextResponse.json(
        { error: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        phone,
        role: "driver",
      })
      .returning();

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
    }

    // Mass assignment protection: only allow whitelisted fields
    // Never allow role changes via this endpoint
    const ALLOWED_FIELDS = ['name', 'email', 'phone', 'isActive'];
    const sanitizedUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (ALLOWED_FIELDS.includes(key)) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    // Handle password separately: hash it and add to sanitized updates
    if (updates.password) {
      sanitizedUpdates.passwordHash = await bcrypt.hash(updates.password, 12);
    }

    await db.update(users).set(sanitizedUpdates).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
