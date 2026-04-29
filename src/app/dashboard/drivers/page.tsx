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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils";
import { Truck, Plus, Mail, Phone, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setDrivers(data.users);
    } catch {
      toast.error("Không thể tải danh sách tài xế");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Thêm tài xế thành công");
      setShowNewDialog(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tài xế</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý tài khoản giao hàng cho gia đình
          </p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Thêm tài xế
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm tài xế mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Họ tên *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@email.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label>Mật khẩu *</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                />
              </div>
              <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  type="tel"
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

      <div className="space-y-2">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Đang tải...
            </CardContent>
          </Card>
        ) : drivers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có tài xế nào</p>
            </CardContent>
          </Card>
        ) : (
          drivers.map((driver) => (
            <Card key={driver.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {driver.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{driver.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {driver.role === "admin" ? "Quản lý" : "Tài xế"}
                      </Badge>
                      {!driver.isActive && (
                        <Badge variant="destructive" className="text-xs">
                          Đã khóa
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {driver.email}
                      </span>
                      {driver.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {driver.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Tham gia: {formatDate(driver.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
