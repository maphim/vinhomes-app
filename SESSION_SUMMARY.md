# 📋 Session Summary — Vinhomes Sales Management PWA

## Project Info

- **Location:** `/home/oem/Documents/Workspace/vinhomes-app`
- **GitHub:** `https://github.com/maphim/vinhomes-app`
- **Vercel:** `https://vinhomes-app.vercel.app`
- **Stack:** Next.js 16 + TypeScript + Drizzle ORM + Neon/PostgreSQL + NextAuth v5 + shadcn/ui + Tailwind CSS v4

---

## SDLC Lifecycle Loop

Every feature or fix follows this **quality-gated loop** before reaching production:

```
  ┌─────────────────────────────────────────────────────┐
  │                                                      │
  │   ① Baseline Tests (vitest)                          │
  │      → establish current passing state                │
  │                                                      │
  │   ② Preserve Logic Check                              │
  │      → read + understand existing code before changes │
  │                                                      │
  │   ③ Refactor / Implement                              │
  │      → make the change                                │
  │                                                      │
  │   ④ Unit Tests (vitest)                               │
  │      → npm test — must stay green                     │
  │                                                      │
  │   ⑤ Coverage Check (vitest --coverage)                │
  │      → must not regress from baseline                 │
  │                                                      │
  │   ⑥ Optimization Pass                                 │
  │      → review for duplicated logic, perf, bundle      │
  │                                                      │
  │   ⑦ Playwright UX Audit                               │
  │      → e2e screenshots / manual UX code review        │
  │                                                      │
  │   ⑧ Regression Retest                                 │
  │      → tsc --noEmit + npm run build (full pipeline)   │
  │                                                      │
  │   ⑨ Final Output                                      │
  │      → git commit + push → Vercel auto-deploy         │
  │                                                      │
  └──────────────────────┬───────────────────────────────┘
                         │
                    🚀 Production
                 (Vercel auto-deploy
                  on push to main)
```

**Gates that block merging:**

- Any test failure → ❌ back to step ③
- Coverage regression → ❌ back to step ③
- TypeScript errors or build failure → ❌ back to step ③
- UX regression detected → ❌ back to step ③

---

## Pages Built

| Page         | Route                  | Status                                      |
| ------------ | ---------------------- | ------------------------------------------- |
| Login        | `/login`               | ✅                                          |
| Dashboard    | `/dashboard`           | ✅                                          |
| Orders       | `/dashboard/orders`    | ✅ _grouped by building with day filtering_ |
| Customers    | `/dashboard/customers` | ✅                                          |
| Products     | `/dashboard/products`  | ✅                                          |
| Drivers      | `/dashboard/drivers`   | ✅                                          |
| Import (NLP) | `/dashboard/import`    | ✅                                          |
| Settings     | `/dashboard/settings`  | ✅                                          |

## API Routes

| Route                     | Method         | Purpose                                          |
| ------------------------- | -------------- | ------------------------------------------------ |
| `/api/auth/[...nextauth]` | GET/POST       | NextAuth v5 credentials                          |
| `/api/orders`             | GET/POST/PATCH | Order CRUD + status + pagination + day filtering |
| `/api/customers`          | GET/POST       | Customer management                              |
| `/api/products`           | GET/POST/PATCH | Product catalog                                  |
| `/api/users`              | GET/POST/PATCH | Driver accounts                                  |
| `/api/import`             | POST           | NLP: parse text → create orders                  |
| `/api/migrate`            | GET/POST       | Manual DB schema migration UI                    |
| `/api/seed`               | GET/POST       | Initialize sample data                           |
| `/api/setup`              | GET            | Diagnostic checks (env vars, DB, tables)         |

---

## Key Features Implemented

### Order Status System (9 statuses)

```
pending → confirmed → preparing → delivering → cash_received → transferred → delivered
                                        ↘ transfer_pending ↗
                               cancelled at any point
```

| Status             | Label            | Badge Color |
| ------------------ | ---------------- | ----------- |
| `pending`          | Chờ xác nhận     | 🟡 Yellow   |
| `confirmed`        | Đã xác nhận      | 🔵 Blue     |
| `preparing`        | Đang chuẩn bị    | 🟣 Purple   |
| `delivering`       | Đang giao        | 🟠 Orange   |
| `cash_received`    | Đã nhận tiền mặt | 🟢 Emerald  |
| `transfer_pending` | Chờ chuyển khoản | 🌐 Cyan     |
| `transferred`      | Đã chuyển khoản  | Teal        |
| `delivered`        | Đã giao          | 🟢 Green    |
| `cancelled`        | Đã hủy           | 🔴 Red      |

### Orders Page — Grouped by Building

- Orders grouped by **building code** with expandable/collapsible headers
- **Day tabs**: Hôm nay, Ngày mai, Tất cả
- Active orders auto-expand; completed orders collapsed by default
- **"Chuyển mai"** button moves pending orders to next day
- Status priority sorting within each building group

### Mobile UI

- **Top header bar** (md:hidden) with hamburger menu (left) + settings gear (right)
  - Hamburger opens sidebar sheet with full navigation + logout
  - Settings gear links to `/dashboard/settings`
  - Fixed at top, 48px height, `border-b` separator
- **Bottom tab bar** (md:hidden) with 6 tabs:
  Tổng quan, Đơn hàng, KH, Sản phẩm, Tài xế, Nhập
- Desktop sidebar hidden on mobile; bottom nav hidden on desktop
- `safe-area-bottom` CSS utility for iOS notch support
- `pt-12` on main content so page headings don't overlap the header bar

### Database Performance

- 5 new indexes on `orders` table (createdAt, status, buildingId, customerId, deliveryDate)
- API optimized: subquery → LEFT JOIN, count(distinct) → subquery count
- Default page size increased from 20 → 50

### Migration System

- **Auto on deploy**: `scripts/migrate.mjs` runs `drizzle-kit push` before `next build`
- **Manual via browser**: `https://vinhomes-app.vercel.app/api/migrate` — click "Run Migration"
- **Manual CLI**: `npm run migrate`

### Unit Tests

- **51 tests**, 2 test files
- **96.72% statement coverage** across util modules
- Framework: Vitest + @testing-library/react + jsdom
- Run: `npm test`

---

## Database Schema (Drizzle ORM + Neon PostgreSQL)

**Tables:** users, customers, zones, buildings, products, orders, orderItems, orderStatusHistory, accounts, sessions, verificationTokens

### Key Schema Details

- `orders.delivery_date` (date) — planned delivery day, nullable
- `order_status` enum: `pending | confirmed | preparing | delivering | cash_received | transfer_pending | transferred | delivered | cancelled`
- 5 performance indexes on orders table

---

## Login

- Email: `admin@vinhomes.app`
- Password: `admin123`

---

## Git History (Main Branch)

```
49fd56c fix(mobile): add proper top header bar, fix SheetTrigger render prop
e81d4a2 Add auto-migration on deploy + /api/migrate endpoint
70d96d8 Quality loop: unit tests (51/51, 96.72% coverage), extract order-utils
7a58c89 Fix: orders API backward-compatible with existing DB schema
b89c471 Add order statuses, delivery_date, mobile bottom nav, building groups
ddd4234 Add setup diagnostic page at /api/setup
ae14de1 Fix seed route: GET handler for browser access
513def0 Initial commit: Vinhomes Sales Management PWA
```

## Current Status

- ✅ All pages functional with full CRUD
- ✅ Orders with building grouping + day filtering
- ✅ Mobile responsive: top header + bottom nav + sheet sidebar
- ✅ Auto-migration on deploy configured
- ✅ Unit tests passing (51/51)
- ✅ TypeScript: 0 errors
- ✅ Production build: passes
- ✅ SDLC lifecycle loop documented and followed
- ❌ Needs Vercel redeploy (push to GitHub triggers auto-deploy if integration is connected)
- ❌ DB migration (auto-runs on deploy via migrate.mjs, or manual via /api/migrate)
