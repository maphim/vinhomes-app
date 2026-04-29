# 📋 Session Summary — Vinhomes Sales Management PWA

## Project Info
- **Location:** `/home/oem/Documents/Workspace/vinhomes-app`
- **GitHub:** `https://github.com/maphim/vinhomes-app`
- **Vercel:** `https://vinhomes-app.vercel.app`
- **Stack:** Next.js 16 + TypeScript + Drizzle ORM + Neon/PostgreSQL + NextAuth v5 + shadcn/ui + Tailwind CSS v4

## Pages Built
| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Orders | `/dashboard/orders` | ✅ *rewritten with building groups* |
| Customers | `/dashboard/customers` | ✅ |
| Products | `/dashboard/products` | ✅ |
| Drivers | `/dashboard/drivers` | ✅ |
| Import (NLP) | `/dashboard/import` | ✅ |
| Settings | `/dashboard/settings` | ✅ |

## API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth v5 credentials |
| `/api/orders` | GET/POST/PATCH | Order CRUD + status + pagination + day filtering |
| `/api/customers` | GET/POST | Customer management |
| `/api/products` | GET/POST/PATCH | Product catalog |
| `/api/users` | GET/POST/PATCH | Driver accounts |
| `/api/import` | POST | NLP: parse text → create orders |
| `/api/migrate` | GET/POST | **NEW** — manual DB schema migration UI |
| `/api/seed` | GET/POST | Initialize sample data |
| `/api/setup` | GET | Diagnostic checks (env vars, DB, tables) |

## Key Features Implemented

### Order Status System (9 statuses)
```
pending → confirmed → preparing → delivering → cash_received → transferred → delivered
                                        ↘ transfer_pending ↗
                               cancelled at any point
```

| Status | Label | Badge Color |
|--------|-------|-------------|
| `pending` | Chờ xác nhận | 🟡 Yellow |
| `confirmed` | Đã xác nhận | 🔵 Blue |
| `preparing` | Đang chuẩn bị | 🟣 Purple |
| `delivering` | Đang giao | 🟠 Orange |
| `cash_received` | Đã nhận tiền mặt | 🟢 Emerald |
| `transfer_pending` | Chờ chuyển khoản | 🌐 Cyan |
| `transferred` | Đã chuyển khoản | Teal |
| `delivered` | Đã giao | 🟢 Green |
| `cancelled` | Đã hủy | 🔴 Red |

### Orders Page — Grouped by Building
- Orders grouped by **building code** with expandable/collapsible headers
- **Day tabs**: Hôm nay, Ngày mai, Tất cả
- Active orders auto-expand; completed orders collapsed by default
- **"Chuyển mai"** button moves pending orders to next day
- Status priority sorting within each building group

### Mobile UI
- **Bottom tab bar** (md:hidden) with 6 tabs: Dashboard, Orders, Customers, Products, Drivers, Import
- Hamburger menu sheet for desktop sidebar on mobile
- `safe-area-bottom` CSS utility for iOS notch support

### Database Performance
- 5 new indexes on `orders` table (createdAt, status, buildingId, customerId, deliveryDate)
- API optimized: subquery → LEFT JOIN, count(distinct) → subquery count
- Default page size increased from 20 → 50

### Migration System (NEW)
- **Auto on deploy**: `scripts/migrate.mjs` runs `drizzle-kit push` before `next build`
- **Manual via browser**: `https://vinhomes-app.vercel.app/api/migrate` — click "Run Migration"
- **Manual CLI**: `npm run migrate`

### Unit Tests
- **51 tests**, 2 test files
- **96.72% statement coverage** across util modules
- Framework: Vitest + @testing-library/react + jsdom
- Run: `npm test`

## Database Schema (Drizzle ORM + Neon PostgreSQL)
**Tables:** users, customers, zones, buildings, products, orders, orderItems, orderStatusHistory, accounts, sessions, verificationTokens

### Key Schema Changes
- `orders.delivery_date` (date) — planned delivery day, nullable
- `order_status` enum: 9 values (was 6, added cash_received, transfer_pending, transferred)
- 5 performance indexes on orders table

## Login
- Email: `admin@vinhomes.app`
- Password: `admin123`

## Current Status
- ✅ Orders page working (needs Vercel redeploy to apply latest fixes)
- ✅ Auto-migration on deploy configured
- ✅ Unit tests passing (51/51)
- ✅ TypeScript: 0 errors
- ✅ Production build: passes
- ❌ Needs Vercel redeploy (push to GitHub triggers auto-deploy if integration is connected)
- ❌ DB migration (auto-runs on deploy via migrate.mjs, or manual via /api/migrate)
