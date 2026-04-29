"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  formatDate,
  timeAgo,
  generateOrderCode,
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
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: number;
  orderCode: string;
  status: string;
  total: string;
  note: string | null;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  buildingCode: string;
  zoneName: string;
  driverName: string | null;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // New order form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [buildingCode, setBuildingCode] = useState("");
  const [aptNumber, setAptNumber] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        search,
        status: statusFilter,
        zone: zoneFilter,
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
  }, [page, search, statusFilter, zoneFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  async function handleStatusChange(orderId: number, newStatus: string) {
    const statusLabels: Record<string, string> = {
      confirmed: "xác nhận",
      preparing: "chuẩn bị",
      delivering: "giao hàng",
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Đơn hàng</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý đơn hàng tại Vinhomes Smart City
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger>
            <Button className="gap-2">
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
                  <Select value={buildingCode} onValueChange={(v: string | null) => v && setBuildingCode(v)}>
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

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm mã đơn, tên, SĐT..."
                className="pl-9"
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
              <SelectTrigger className="w-full sm:w-36">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ xác nhận</SelectItem>
                <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                <SelectItem value="preparing">Đang chuẩn bị</SelectItem>
                <SelectItem value="delivering">Đang giao</SelectItem>
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
              <SelectTrigger className="w-full sm:w-44">
                <MapPin className="w-4 h-4 mr-1" />
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
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-2">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Đang tải...
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có đơn hàng nào</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
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
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-sm font-medium">
                        {order.customerName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.zoneName} - {order.buildingCode}
                        </span>
                      </div>
                    </div>
                    {order.note && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        📝 {order.note}
                      </p>
                    )}
                    {order.items && order.items.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
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
                    <p className="font-bold text-primary">
                      {formatCurrency(order.total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {timeAgo(order.createdAt)}
                    </p>
                    <div className="flex gap-1 mt-2 justify-end">
                      <Dialog>
                        <DialogTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>
                              Đơn hàng {order.orderCode}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Khách hàng
                                </p>
                                <p className="font-medium">
                                  {order.customerName}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs">
                                  Số điện thoại
                                </p>
                                <p className="font-medium">
                                  {order.customerPhone}
                                </p>
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
                                <p className="text-sm font-medium mb-2">
                                  Sản phẩm
                                </p>
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
                </div>

                {/* Quick actions */}
                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="flex gap-1.5 mt-3 pt-2 border-t">
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-green-600 border-green-300"
                        onClick={() =>
                          handleStatusChange(order.id, "delivered")
                        }
                      >
                        ✓ Đã giao
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
