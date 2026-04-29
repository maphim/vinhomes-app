# 📋 Session Summary — Vinhomes Sales Management PWA

## Project Info
- **Location:** `/home/oem/Documents/Workspace/vinhomes-app`
- **GitHub:** `https://github.com/maphim/vinhomes-app`
- **Vercel:** `https://vinhomes-app.vercel.app`
- **Stack:** Next.js 16 + TypeScript + Drizzle ORM + Neon/PostgreSQL + NextAuth v5 + shadcn/ui + Tailwind CSS

## Pages Built
| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ |
| Dashboard | `/dashboard` | ✅ |
| Orders | `/dashboard/orders` | ✅ |
| Customers | `/dashboard/customers` | ✅ |
| Products | `/dashboard/products` | ✅ |
| Drivers | `/dashboard/drivers` | ✅ |
| Import (NLP) | `/dashboard/import` | ✅ |
| Settings | `/dashboard/settings` | ✅ |

## API Routes
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth v5 credentials |
| `/api/orders` | GET/POST/PATCH | Order CRUD + status + pagination |
| `/api/customers` | GET/POST | Customer management |
| `/api/products` | GET/POST/PATCH | Product catalog |
| `/api/users` | GET/POST/PATCH | Driver accounts |
| `/api/import` | POST | NLP: parse text → create orders |
| `/api/seed` | GET/POST | Initialize sample data |
| `/api/setup` | GET | Diagnostic checks |

## Key Features
- **NLP Import:** Paste Vietnamese text → auto-extracts phone, building code, apartment, customer name, products
- **12 Zones, 40+ buildings** (Sapphire 1-4, Miami, Sakura, Victoria, Tonkin, Canopy, Masteri, Imperia, Lumiere)
- **PWA:** manifest.json + sw.js + install prompt
- **Auth:** JWT credentials provider, role-based (admin/driver)

## Database
Drizzle ORM + Neon PostgreSQL.
Tables: users, customers, zones, buildings, products, orders, orderItems, orderStatusHistory, accounts, sessions, verificationTokens.

## Current Issues
1. **Vercel not connected to GitHub** — needs re-import for auto-deploy
2. **Missing env vars on Vercel:**
   - `AUTH_SECRET = lXygc4x/3w0n1vrbSA1ISV+Zcmw1q3rPzty8hJSX/1M=`
   - `DATABASE_URL` (needs Neon Postgres Integration)
3. **Database tables + seed** — visit `/api/seed` after env vars set

## Login
- Email: `admin@vinhomes.app`
- Password: `admin123`
