import { auth } from "@/lib/auth";
import { db } from "@/db";
import { orders, customers, products, users, orderItems } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getStatusLabel } from "@/lib/utils";
import {
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(orders),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`orders.createdAt >= ${today}`),
  ]);

  const [totalCustomers, totalProducts, totalDrivers] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(customers),
    db.select({ count: sql<number>`count(*)` }).from(products),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "driver")),
  ]);

  const [pendingOrders, deliveringOrders, deliveredToday] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`status = 'pending'`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(sql`status = 'delivering'`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          sql`status = 'delivered'`,
          sql`${orders.deliveredAt} >= ${today}`
        )
      ),
  ]);

  // Recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      orderCode: orders.orderCode,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .orderBy(sql`${orders.createdAt} desc`)
    .limit(10);

  const stats = [
    {
      title: "Tổng đơn hàng",
      value: totalOrders[0]?.count ?? 0,
      icon: ShoppingCart,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Đơn hôm nay",
      value: todayOrders[0]?.count ?? 0,
      icon: Clock,
      color: "text-orange-600 bg-orange-100",
    },
    {
      title: "Đang giao",
      value: deliveringOrders[0]?.count ?? 0,
      icon: TrendingUp,
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Chờ xác nhận",
      value: pendingOrders[0]?.count ?? 0,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      title: "Đã giao hôm nay",
      value: deliveredToday[0]?.count ?? 0,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Khách hàng",
      value: totalCustomers[0]?.count ?? 0,
      icon: Users,
      color: "text-indigo-600 bg-indigo-100",
    },
    {
      title: "Sản phẩm",
      value: totalProducts[0]?.count ?? 0,
      icon: Package,
      color: "text-teal-600 bg-teal-100",
    },
    {
      title: "Tài xế",
      value: totalDrivers[0]?.count ?? 0,
      icon: Truck,
      color: "text-cyan-600 bg-cyan-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-muted-foreground">
          Xin chào, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg">Đơn hàng gần đây</CardTitle>
            <CardDescription>10 đơn hàng mới nhất</CardDescription>
          </div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-primary hover:underline"
          >
            Xem tất cả
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">
                Chưa có đơn hàng nào
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {order.orderCode}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {order.customerName} - {order.customerPhone}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-semibold">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Needed for the Truck icon
import { Truck } from "lucide-react";
