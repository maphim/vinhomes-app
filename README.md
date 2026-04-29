# Vinhomes Bán Hàng - Ứng dụng quản lý bán & giao hàng tại Vinhomes Smart City

Ứng dụng PWA quản lý bán hàng cho gia đình tại khu đô thị Vinhomes Smart City (Tây Mỗ, Nam Từ Liêm, Hà Nội).

## 🚀 Tính năng

- **Quản lý đơn hàng**: Tạo, theo dõi, cập nhật trạng thái đơn hàng
- **Phân loại theo tòa nhà**: Lọc đơn hàng theo 12 phân khu & 40+ tòa nhà
- **Nhập đơn từ ghi chú**: Tự động trích xuất thông tin (SĐT, tòa nhà, sản phẩm) từ văn bản
- **Quản lý khách hàng**: Lưu thông tin, lịch sử mua hàng, SĐT Việt Nam
- **Quản lý sản phẩm**: Danh mục sản phẩm, giá, đơn vị
- **Tài xế**: Phân quyền cho các thành viên trong gia đình
- **PWA**: Cài đặt như app native trên điện thoại
- **Đồng bộ đa thiết bị**: Dùng chung dữ liệu qua database

## 🛠️ Công nghệ

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Drizzle ORM
- **Auth**: NextAuth.js v5 (Auth.js)
- **UI**: Tailwind CSS + shadcn/ui
- **PWA**: @serwist/next
- **Deploy**: Vercel

## 📋 Yêu cầu

- Node.js 18+
- PostgreSQL database (dùng [Neon](https://neon.tech) free tier)

## ⚡ Cài đặt

```bash
# Clone dự án
git clone <your-repo>
cd vinhomes-app

# Cài dependencies
npm install

# Tạo file .env từ mẫu
cp .env.example .env
```

### Cấu hình Database

1. Đăng ký [Neon](https://neon.tech) (free tier)
2. Tạo project, copy connection string
3. Thêm vào `.env`:
```
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/vinhomes?sslmode=require
```

### Cấu hình Auth Secret

```bash
# Tạo secret key
openssl rand -base64 32
# Thêm vào .env
AUTH_SECRET=<your-secret>
```

### Khởi tạo database

```bash
# Generate migration
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push

# Khởi động dev server
npm run dev
```

### Seed dữ liệu mẫu

Sau khi chạy ứng dụng, vào **Cài đặt → Khởi tạo dữ liệu** hoặc:
```bash
curl -X POST http://localhost:3000/api/seed
```

Tài khoản admin mặc định:
- Email: `admin@vinhomes.app`
- Mật khẩu: `admin123`

## 🏗️ Cấu trúc dự án

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Auth routes
│   │   ├── orders/        # Order CRUD
│   │   ├── customers/     # Customer CRUD
│   │   ├── products/      # Product CRUD
│   │   ├── users/         # User/driver management
│   │   ├── import/        # Order import from text
│   │   └── seed/          # Database seeding
│   ├── dashboard/
│   │   ├── page.tsx       # Dashboard home
│   │   ├── orders/        # Order management
│   │   ├── customers/     # Customer list
│   │   ├── products/      # Product catalog
│   │   ├── drivers/       # Driver accounts
│   │   ├── import/        # Import orders from text
│   │   └── settings/      # App settings
│   ├── login/
│   └── layout.tsx
├── components/
│   ├── shared/
│   │   ├── sidebar.tsx
│   │   ├── pwa-install.tsx
│   │   └── sw-register.tsx
│   └── ui/                # shadcn components
├── db/
│   ├── schema.ts          # Database schema
│   └── index.ts           # DB connection
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── buildings.ts       # Vinhomes building data
│   └── utils.ts           # Utility functions
└── types/
    └── auth.d.ts          # Auth type declarations
```

## 🏢 Phân khu Vinhomes Smart City

| Phân khu | Mã tòa |
|----------|--------|
| The Sapphire 1 | S101 - S106 |
| The Sapphire 2 | S201 - S205 |
| The Sapphire 3 | S301 - S303 |
| The Sapphire 4 | S401 - S402 |
| The Miami | GS1 - GS6 |
| The Sakura | SK1 - SK3 |
| The Victoria | V1 - V3 |
| The Tonkin | TK1 - TK2 |
| The Canopy Residences | TC1 - TC3 |
| Masteri West Heights | MWH-A đến D |
| Imperia The Sola Park | ISP-A đến E |
| Lumiere Evergreen | LE-A, LE-B |

## 📲 Triển khai lên Vercel

1. Push code lên GitHub
2. Truy cập [vercel.com](https://vercel.com)
3. Import repository
4. Thêm environment variables:
   - `DATABASE_URL` (từ Neon)
   - `AUTH_SECRET`
5. Deploy

## 🧠 Nhập đơn từ ghi chú

Tính năng cho phép dán nội dung tin nhắn từ Zalo/Facebook/SMS và tự động tạo đơn hàng.

**Định dạng hỗ trợ:**
```
Chị Lan 0912345678 S101 1508: 2 bánh mì, 3 trà sữa
Anh Tuấn 0987654321 GS2 - 1 cà phê đen
```

Hệ thống sẽ tự động:
1. Trích xuất số điện thoại (SĐT Việt Nam)
2. Nhận dạng mã tòa nhà (S101, GS2, V1...)
3. Phân tích sản phẩm & số lượng
4. Tạo hoặc cập nhật thông tin khách hàng
5. Tạo đơn hàng mới
