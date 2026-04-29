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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Package, Coffee, Utensils, Wine, Cake, Star } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "food", label: "Đồ ăn", icon: Utensils },
  { value: "drink", label: "Đồ uống", icon: Coffee },
  { value: "snack", label: "Ăn vặt", icon: Cake },
  { value: "other", label: "Khác", icon: Package },
];

const UNITS = ["cái", "hộp", "chai", "gói", "kg", "lít", "ly", "cốc", "phần", "suất"];

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  unit: string;
  category: string | null;
  isAvailable: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("cái");
  const [category, setCategory] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function resetForm() {
    setName("");
    setDescription("");
    setPrice("");
    setUnit("cái");
    setCategory("");
    setEditingProduct(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Vui lòng nhập tên và giá sản phẩm");
      return;
    }
    try {
      const body = {
        name,
        description,
        price: parseInt(price.replace(/[.,\s]/g, "")),
        unit,
        category: category || undefined,
      };

      const url = editingProduct
        ? `/api/products`
        : `/api/products`;
      const method = editingProduct ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingProduct ? { id: editingProduct.id, ...body } : body
        ),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi");
      }
      toast.success(
        editingProduct ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công"
      );
      setShowNewDialog(false);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setPrice(product.price);
    setUnit(product.unit);
    setCategory(product.category || "");
    setShowNewDialog(true);
  }

  const filtered = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-muted-foreground text-sm">
            Danh mục sản phẩm kinh doanh
          </p>
        </div>
        <Dialog
          open={showNewDialog}
          onOpenChange={(open) => {
            setShowNewDialog(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger>
            <Button className="gap-2" onClick={() => resetForm()}>
              <Plus className="w-4 h-4" />
              Thêm sản phẩm
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bánh mì thịt"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Giá *</Label>
                  <Input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15000"
                    type="text"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Đơn vị</Label>
                  <Select value={unit} onValueChange={(v: string | null) => v && setUnit(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={category} onValueChange={(v: string | null) => v && setCategory(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả sản phẩm..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewDialog(false);
                    resetForm();
                  }}
                >
                  Hủy
                </Button>
                <Button type="submit">
                  {editingProduct ? "Cập nhật" : "Thêm"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm sản phẩm..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Chưa có sản phẩm nào</p>
          </div>
        ) : (
          filtered.map((product) => (
            <Card
              key={product.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleEdit(product)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.unit}
                      </Badge>
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          {CATEGORIES.find((c) => c.value === product.category)?.label ||
                            product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-primary flex-shrink-0 ml-2">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
