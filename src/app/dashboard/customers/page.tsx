"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ZONES } from "@/lib/buildings";
import {
  Search,
  Plus,
  Phone,
  MapPin,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: number;
  name: string;
  phone: string;
  apartmentNumber: string | null;
  totalOrders: number;
  totalSpent: string;
  notes: string | null;
  createdAt: string;
  buildingCode: string | null;
  zoneName: string | null;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // New customer form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [buildingCode, setBuildingCode] = useState("");
  const [apt, setApt] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "20",
      });
      const res = await fetch(`/api/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers);
      setTotal(data.total);
    } catch {
      toast.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Vui lòng nhập tên và số điện thoại");
      return;
    }
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          buildingCode: buildingCode || undefined,
          apartmentNumber: apt || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Thêm khách hàng thành công");
      setShowNewDialog(false);
      setName("");
      setPhone("");
      setBuildingCode("");
      setApt("");
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Khách hàng</h1>
          <p className="text-muted-foreground text-sm">
            Danh sách khách hàng tại Vinhomes Smart City
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm khách hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm khách hàng mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên khách hàng *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label>Tòa nhà</Label>
                <Select value={buildingCode} onValueChange={(v: string | null) => v && setBuildingCode(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tòa nhà" />
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
              <div className="space-y-2">
                <Label>Số căn hộ</Label>
                <Input
                  value={apt}
                  onChange={(e) => setApt(e.target.value)}
                  placeholder="1508"
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
                <Button type="submit">Thêm</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm tên, số điện thoại..."
          className="pl-9"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Đang tải...
            </CardContent>
          </Card>
        ) : customers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có khách hàng nào</p>
            </CardContent>
          </Card>
        ) : (
          customers.map((customer) => (
            <Card key={customer.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{customer.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        {customer.phone}
                      </span>
                      {(customer.zoneName || customer.buildingCode) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {customer.zoneName} - {customer.buildingCode}
                          {customer.apartmentNumber && ` - #${customer.apartmentNumber}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="flex items-center gap-1 text-sm">
                      <ShoppingCart className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{customer.totalOrders}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm mt-0.5">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatCurrency(customer.totalSpent)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Trang {page} / {Math.ceil(total / 20)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
