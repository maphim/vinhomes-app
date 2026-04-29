import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";

// ────────────────────────── ENUMS ──────────────────────────

export const roleEnum = pgEnum("role", ["admin", "driver"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "delivering",
  "delivered",
  "cancelled",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "momo",
  "vnpay",
  "other",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "partial",
]);

// ────────────────────────── USERS ──────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  phone: varchar("phone", { length: 20 }),
  role: roleEnum("role").notNull().default("driver"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  sessions: many(sessions),
  accounts: many(accounts),
}));

// ────────────────────────── AUTH ──────────────────────────

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ────────────────────────── BUILDINGS / ZONES ──────────────────────────

export const zones = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const zonesRelations = relations(zones, ({ many }) => ({
  buildings: many(buildings),
}));

export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id")
    .notNull()
    .references(() => zones.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull(), // e.g. S101, GS2, V1, TK1
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const buildingsRelations = relations(buildings, ({ one, many }) => ({
  zone: one(zones, { fields: [buildings.zoneId], references: [zones.id] }),
  customers: many(customers),
  orders: many(orders),
}));

// ────────────────────────── CUSTOMERS ──────────────────────────

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  secondaryPhone: varchar("secondary_phone", { length: 20 }),
  buildingId: integer("building_id").references(() => buildings.id),
  apartmentNumber: varchar("apartment_number", { length: 50 }), // e.g. 1508
  floor: varchar("floor", { length: 10 }),
  addressNote: text("address_note"), // extra delivery instructions
  totalOrders: integer("total_orders").notNull().default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 0 }).notNull().default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  building: one(buildings, {
    fields: [customers.buildingId],
    references: [buildings.id],
  }),
  orders: many(orders),
}));

// ────────────────────────── PRODUCTS ──────────────────────────

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 0 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull().default("cái"),
  category: varchar("category", { length: 100 }),
  isAvailable: boolean("is_available").notNull().default(true),
  image: text("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// ────────────────────────── ORDERS ──────────────────────────

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderCode: varchar("order_code", { length: 50 }).notNull().unique(), // e.g. DH-240101-001
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  buildingId: integer("building_id")
    .notNull()
    .references(() => buildings.id),
  assignedDriverId: integer("assigned_driver_id").references(() => users.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  note: text("note"), // original note/comment from customer
  deliveryNote: text("delivery_note"),
  subtotal: decimal("subtotal", { precision: 12, scale: 0 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 12, scale: 0 }).notNull().default("0"),
  discount: decimal("discount", { precision: 12, scale: 0 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 0 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  source: varchar("source", { length: 50 }).default("manual"), // manual, import, zalo, facebook
  importedFromNote: boolean("imported_from_note").default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at", { mode: "date" }),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  building: one(buildings, {
    fields: [orders.buildingId],
    references: [buildings.id],
  }),
  assignedDriver: one(users, {
    fields: [orders.assignedDriverId],
    references: [users.id],
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
}));

// ────────────────────────── ORDER ITEMS ──────────────────────────

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  productName: varchar("product_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: decimal("unit_price", { precision: 12, scale: 0 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 0 }).notNull(),
  note: text("note"),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

// ────────────────────────── ORDER STATUS HISTORY ──────────────────────────

export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  changedByUserId: integer("changed_by_user_id").references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  changedBy: one(users, {
    fields: [orderStatusHistory.changedByUserId],
    references: [users.id],
  }),
}));
