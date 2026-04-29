"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Database,
  RefreshCw,
  Smartphone,
  Globe,
  Download,
  Building2,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const [seeding, setSeeding] = useState(false);

  async function handleSeedData() {
    if (
      !confirm(
        "Thao tác này sẽ thêm dữ liệu mẫu (tài khoản admin, sản phẩm, phân khu). Tiếp tục?"
      )
    )
      return;

    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Lỗi seed dữ liệu");
      const data = await res.json();
      toast.success(
        `Đã khởi tạo dữ liệu: ${data.zones} phân khu, ${data.buildings} tòa nhà, ${data.products} sản phẩm`
      );
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground text-sm">
          Quản lý cấu hình ứng dụng
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5" />
            Dữ liệu
          </CardTitle>
          <CardDescription>
            Khởi tạo dữ liệu mẫu cho ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Dữ liệu sẽ được khởi tạo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Tài khoản admin: admin@vinhomes.app / admin123</li>
              <li>12 phân khu với tất cả tòa nhà tại Vinhomes Smart City</li>
              <li>Các sản phẩm mẫu thường bán tại chung cư</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={handleSeedData}
            disabled={seeding}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${seeding ? "animate-spin" : ""}`} />
            {seeding ? "Đang khởi tạo..." : "Khởi tạo dữ liệu"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Ứng dụng di động (PWA)
          </CardTitle>
          <CardDescription>
            Cài đặt ứng dụng lên màn hình chính để sử dụng như app native
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Hướng dẫn cài đặt:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Mở ứng dụng trên trình duyệt Chrome/Safari</li>
              <li>
                iOS: Nhấn nút Share (chia sẻ) &rarr; &quot;Add to Home Screen&quot;
              </li>
              <li>
                Android: Nhấn menu (3 chấm) &rarr; &quot;Install App&quot; hoặc
                &quot;Add to Home Screen&quot;
              </li>
            </ol>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              toast.success(
                "Trên điện thoại: dùng trình duyệt để thêm vào màn hình chính"
              );
            }}
          >
            <Download className="w-4 h-4" />
            Hướng dẫn cài đặt
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Vinhomes Smart City
          </CardTitle>
          <CardDescription>
            Thông tin về các phân khu trong ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Ứng dụng hỗ trợ 12 phân khu tại VinHomes Smart City:</p>
            <ul className="list-disc list-inside space-y-0.5 mt-2">
              <li>The Sapphire 1-4 (S101-S402)</li>
              <li>The Miami (GS1-GS6)</li>
              <li>The Sakura (SK1-SK3)</li>
              <li>The Victoria (V1-V3)</li>
              <li>The Tonkin (TK1-TK2)</li>
              <li>The Canopy Residences (TC1-TC3)</li>
              <li>Masteri West Heights (MWH-A đến D)</li>
              <li>Imperia The Sola Park (ISP-A đến E)</li>
              <li>Lumiere Evergreen (LE-A, LE-B)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
