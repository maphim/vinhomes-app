"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  timeAgo,
} from "@/lib/utils";
import { ZONES } from "@/lib/buildings";
import {
  Search,
  Plus,
  Filter,
  Eye,
  Package,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────── TYPES ───────────────────

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

interface Order {
  id: number;
  orderCode: string;
  status: string;
  total: string;
  note: string | null;
  deliveryDate: string | null;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  buildingId: number;
  buildingCode: string;
  buildingName: string;
  zoneName: string;
  driverId: number | null;
  driverName: string | null;
  items: OrderItem[];
}

/** Group orders by building code */
type BuildingGroup = {
  buildingCode: string;
  buildingName: string;
  zoneName: string;
  orders: Order[];
};

// ─────────────────── DAY OPTIONS ───────────────────

type DayFilter = "today" | "tomorrow" | "all";

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: "today", label: "Hôm nay" },
  { value: "tomorrow", label: "Ngày mai" },
  { value: "all", label: "Tất cả" },
];

function formatDayLabel(day: DayFilter): string {
  if (day === "today") return "hôm nay";
  if (day === "tomorrow") return "ngày mai";
  return "";
}

// ─────────────────── COMPONENT ───────────────────

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("today");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(
    new Set()
  );

  // New order form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [buildingCode, setBuildingCode] = useState("");
  const [aptNumber, setAptNumber] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const PAGE_SIZE = 100;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Fetch orders ──
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        search,
        status: statusFilter,
        zone: zoneFilter,
        day: dayFilter,
      });
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, zoneFilter, dayFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Group orders by building ──
  const buildingGroups = useMemo<BuildingGroup[]>(() => {
    const map = new Map<string, BuildingGroup>();
    for (const order of orders) {
      const key = `${order.zoneName}::${order.buildingCode}`;
      if (!map.has(key)) {
        map.set(key, {
          buildingCode: order.buildingCode,
          buildingName: order.buildingName,
          zoneName: order.zoneName,
          orders: [],
        });
      }
      map.get(key)!.orders.push(order);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.buildingCode.localeCompare(b.buildingCode)
    );
  }, [orders]);

  // Auto-expand buildings with active (non-terminal) orders
  useEffect(() => {
    const activeStatuses = new Set([
      "pending",
      "confirmed",
      "preparing",
      "delivering",
      "cash_received",
      "transfer_pending",
      "transferred",
    ]);
    const toExpand = new Set<string>();
    for (const group of buildingGroups) {
      if (group.orders.some((o) => activeStatuses.has(o.status))) {
        toExpand.add(group.buildingCode);
      }
    }
    setExpandedBuildings((prev) => {
      // Keep user-manually-collapsed buildings collapsed, but auto-expand new ones
      const next = new Set(prev);
      for (const code of toExpand) {
        next.add(code);
      }
      return next;
    });
  }, [buildingGroups]);

  // ── Toggle building expand/collapse ──
  const toggleBuilding = (code: string) => {
    setExpandedBuildings((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // ── Create order ──
  async function handleCreateOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName || !customerPhone || !buildingCode) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          buildingCode,
          apartmentNumber: aptNumber,
          note: orderNote,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi tạo đơn hàng");
      }
      toast.success("Tạo đơn hàng thành công");
      setShowNewDialog(false);
      setCustomerName("");
      setCustomerPhone("");
      setBuildingCode("");
      setAptNumber("");
      setOrderNote("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  // ── Status change ──
  async function handleStatusChange(orderId: number, newStatus: string) {
    const statusLabels: Record<string, string> = {
      confirmed: "xác nhận",
      preparing: "chuẩn bị",
      delivering: "giao hàng",
      cash_received: "nhận tiền mặt",
      transfer_pending: "chờ chuyển khoản",
      transferred: "chuyển khoản",
      delivered: "hoàn thành",
      cancelled: "hủy",
    };
    try {
      const res = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Lỗi cập nhật");
      toast.success(`Đã ${statusLabels[newStatus] || "cập nhật"} đơn hàng`);
      fetchOrders();
    } catch {
      toast.error("Không thể cập nhật đơn hàng");
    }
  }

  // ── Move order to next day ──
  async function handleMoveToNextDay(orderId: number) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];
    try {
      const res = await fetch(`/api/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, deliveryDate: dateStr }),
      });
      if (!res.ok) throw new Error("Lỗi chuyển ngày");
      toast.success(`Đã chuyển sang ngày ${dateStr}`);
      fetchOrders();
    } catch {
      toast.error("Không thể chuyển ngày");
    }
  }

  // ── Render order card ──
  function renderOrderCard(order: Order) {
    return (
      <Card
        key={order.id}
        className="border-0 shadow-sm hover:shadow-md transition-shadow"
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">
                  {order.orderCode}
                </span>
                <Badge
                  className={`text-xs ${getStatusColor(order.status)}`}
                >
                  {getStatusLabel(order.status)}
                </Badge>
                {order.driverName && (
                  <span className="text-xs text-muted-foreground">
                    🚚 {order.driverName}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium mt-1">
                {order.customerName}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.customerPhone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {order.buildingCode}
                  {order.note && ` • ${order.note.slice(0, 30)}`}
                </span>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {order.items.slice(0, 3).map((item) => (
                    <Badge
                      key={item.id}
                      variant="secondary"
                      className="text-xs"
                    >
                      {item.productName} x{item.quantity}
                    </Badge>
                  ))}
                  {order.items.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{order.items.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-primary text-sm">
                {formatCurrency(order.total)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {timeAgo(order.createdAt)}
              </p>
              <Dialog>
                <DialogTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 mt-1"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Đơn hàng {order.orderCode}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Khách hàng
                        </p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Số điện thoại
                        </p>
                        <p className="font-medium">{order.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Địa chỉ
                        </p>
                        <p className="font-medium">
                          {order.zoneName} - {order.buildingCode}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Trạng thái
                        </p>
                        <Badge
                          className={`text-xs ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Sản phẩm</p>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between text-sm py-1"
                            >
                              <span>
                                {item.productName} x{item.quantity}
                              </span>
                              <span className="font-medium">
                                {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold border-t pt-2">
                      <span>Tổng cộng</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick actions */}
          {order.status !== "delivered" &&
            order.status !== "cancelled" &&
            order.status !== "transferred" && (
              <div className="flex gap-1.5 mt-2 pt-2 border-t flex-wrap">
                {order.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        handleStatusChange(order.id, "confirmed")
                      }
                    >
                      ✓ Xác nhận
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive border-destructive/50"
                      onClick={() =>
                        handleStatusChange(order.id, "cancelled")
                      }
                    >
                      ✕ Hủy
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      handleStatusChange(order.id, "preparing")
                    }
                  >
                    Bắt đầu chuẩn bị
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      handleStatusChange(order.id, "delivering")
                    }
                  >
                    🚚 Bắt đầu giao
                  </Button>
                )}
                {order.status === "delivering" && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-emerald-600 border-emerald-300"
                      onClick={() =>
                        handleStatusChange(order.id, "cash_received")
                      }
                    >
                      💵 Nhận tiền mặt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-cyan-600 border-cyan-300"
                      onClick={() =>
                        handleStatusChange(order.id, "transfer_pending")
                      }
                    >
                      🏦 Chờ chuyển khoản
                    </Button>
                  </>
                )}
                {order.status === "cash_received" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-green-600 border-green-300"
                    onClick={() =>
                      handleStatusChange(order.id, "delivered")
                    }
                  >
                    📦 Đã giao
                  </Button>
                )}
                {order.status === "transfer_pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-teal-600 border-teal-300"
                    onClick={() =>
                      handleStatusChange(order.id, "transferred")
                    }
                  >
                    ✓ Đã nhận chuyển khoản
                  </Button>
                )}
                {/* Move to next day */}
                {dayFilter === "today" &&
                  (order.status === "pending" ||
                    order.status === "confirmed" ||
                    order.status === "preparing") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-amber-600 border-amber-300"
                      onClick={() => handleMoveToNextDay(order.id)}
                    >
                      ⏩ Chuyển mai
                    </Button>
                  )}
              </div>
            )}
        </CardContent>
      </Card>
    );
  }

  // ─── RENDER ───

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Đơn hàng</h1>
          <p className="text-muted-foreground text-xs">
            {dayFilter === "today"
              ? "Đơn hàng hôm nay"
              : dayFilter === "tomorrow"
              ? "Đơn hàng ngày mai"
              : "Tất cả đơn hàng"}{" "}
            · {total} đơn · {buildingGroups.length} tòa
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger>
            <Button className="gap-2 h-9 text-sm">
              <Plus className="w-4 h-4" />
              Tạo đơn
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo đơn hàng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Tên khách hàng *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Số điện thoại *</Label>
                  <Input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0912345678"
                    type="tel"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Tòa nhà *</Label>
                  <Select
                    value={buildingCode}
                    onValueChange={(v: string | null) =>
                      v && setBuildingCode(v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn tòa" />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-72">
                        {ZONES.map((zone) => (
                          <div key={zone.code}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {zone.nameVi}
                            </div>
                            {zone.buildings.map((b) => (
                              <SelectItem key={b.code} value={b.code}>
                                {b.code} - {b.name}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Số căn hộ</Label>
                  <Input
                    value={aptNumber}
                    onChange={(e) => setAptNumber(e.target.value)}
                    placeholder="1508"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú đơn hàng</Label>
                <Textarea
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Nhập sản phẩm và ghi chú..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewDialog(false)}
                >
                  Hủy
                </Button>
                <Button type="submit">Tạo đơn hàng</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Day toggle + Filters ── */}
      <div className="flex flex-col gap-2">
        {/* Day tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
          {DAY_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={dayFilter === opt.value ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs px-3"
              onClick={() => {
                setDayFilter(opt.value);
                setPage(1);
              }}
            >
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm mã đơn, tên, SĐT..."
              className="pl-9 h-9 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v: string | null) => {
              if (v !== null) setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-32 h-9 text-xs">
              <Filter className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xác nhận</SelectItem>
              <SelectItem value="confirmed">Đã xác nhận</SelectItem>
              <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
              <SelectItem value="delivering">Đang giao</SelectItem>
              <SelectItem value="cash_received">Đã nhận tiền mặt</SelectItem>
              <SelectItem value="transfer_pending">
                Chờ chuyển khoản
              </SelectItem>
              <SelectItem value="transferred">Đã chuyển khoản</SelectItem>
              <SelectItem value="delivered">Đã giao</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={zoneFilter}
            onValueChange={(v: string | null) => {
              if (v !== null) setZoneFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-40 h-9 text-xs">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <SelectValue placeholder="Phân khu" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                <SelectItem value="all">Tất cả phân khu</SelectItem>
                {ZONES.map((zone) => (
                  <SelectItem key={zone.code} value={zone.code}>
                    {zone.nameVi}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Orders grouped by building ── */}
      <div className="space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Đang tải...
            </CardContent>
          </Card>
        ) : buildingGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {dayFilter === "today"
                  ? "Chưa có đơn hàng hôm nay"
                  : dayFilter === "tomorrow"
                  ? "Chưa có đơn hàng ngày mai"
                  : "Chưa có đơn hàng nào"}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowNewDialog(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tạo đơn mới
              </Button>
            </CardContent>
          </Card>
        ) : (
          buildingGroups.map((group) => {
            const activeCount = group.orders.filter(
              (o) =>
                o.status !== "delivered" &&
                o.status !== "cancelled" &&
                o.status !== "transferred"
            ).length;
            const isExpanded = expandedBuildings.has(group.buildingCode);

            return (
              <div key={group.buildingCode}>
                {/* Building header */}
                <button
                  onClick={() => toggleBuilding(group.buildingCode)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">
                      {group.buildingCode}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {group.zoneName}
                    </span>
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {group.orders.length}
                    </Badge>
                    {activeCount > 0 && (
                      <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                        {activeCount} active
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                {/* Orders in this building */}
                {isExpanded && (
                  <div className="mt-2 space-y-2 pl-2 border-l-2 border-muted ml-2">
                    {/* Sort: active orders first, then by status priority, then by creation time */}
                    {[...group.orders]
                      .sort((a, b) => {
                        const statusOrder: Record<string, number> = {
                          pending: 1,
                          confirmed: 2,
                          preparing: 3,
                          delivering: 4,
                          cash_received: 5,
                          transfer_pending: 6,
                          transferred: 7,
                          delivered: 8,
                          cancelled: 9,
                        };
                        const aOrder =
                          statusOrder[a.status] || 99;
                        const bOrder =
                          statusOrder[b.status] || 99;
                        if (aOrder !== bOrder)
                          return aOrder - bOrder;
                        return (
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                        );
                      })
                      .map(renderOrderCard)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Pagination (only when many orders across many buildings) ── */}
      {totalPages > 1 && buildingGroups.length > 20 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
