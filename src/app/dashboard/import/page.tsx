"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Brain,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  orderCode?: string;
  customerName?: string;
  phone?: string;
  buildingCode?: string;
  items?: { name: string; quantity: number }[];
  error?: string;
  note: string;
}

export default function ImportPage() {
  const [text, setText] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!text.trim()) {
      toast.error("Vui lòng nhập nội dung đơn hàng");
      return;
    }

    setLoading(true);
    setResults([]);
    setSummary(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Lỗi nhập đơn hàng");
      }

      const data = await res.json();
      setResults(data.results);
      setSummary(data.summary);

      if (data.summary.success > 0) {
        toast.success(
          `Đã nhập thành công ${data.summary.success} đơn hàng`
        );
      }
      if (data.summary.failed > 0) {
        toast.error(`${data.summary.failed} đơn hàng bị lỗi`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setText("");
    setResults([]);
    setSummary(null);
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Nhập đơn hàng</h1>
        <p className="text-muted-foreground text-sm">
          Dán nội dung đơn hàng từ Zalo, Facebook, SMS để tự động tạo đơn
        </p>
      </div>

      {/* Examples */}
      <Card className="border-0 shadow-sm bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Ví dụ định dạng hỗ trợ:</p>
              <ul className="space-y-1 text-blue-800">
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Chị Lan 0912345678 S101 1508: 2 bánh mì, 3 trà sữa</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>Anh Tuấn 0987654321 GS2 - 1 cà phê đen - 2 bánh mỳ</strong>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span>•</span>
                  <span>
                    <strong>S201.2005: 5 bánh mì thịt, 2 trà đào</strong> (SĐT cũ sẽ được dùng lại)
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Dán nội dung đơn hàng vào đây...

Ví dụ:
Chị Lan 0912345678 S101 1508: 2 bánh mì, 3 trà sữa
Anh Tuấn 0987654321 GS2 - 1 cà phê đen - 2 bánh mỳ`}
            rows={8}
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={loading || !text.trim()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? "Đang xử lý..." : "Nhập đơn hàng"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={loading}
            >
              Xóa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm bg-blue-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{summary.total}</p>
              <p className="text-xs text-blue-600">Tổng cộng</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{summary.success}</p>
              <p className="text-xs text-green-600">Thành công</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-red-50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{summary.failed}</p>
              <p className="text-xs text-red-600">Lỗi</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Kết quả nhập đơn
            </CardTitle>
            <CardDescription>
              Hệ thống đã phân tích thông tin từ nội dung bạn nhập
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <Card
                    key={idx}
                    className={`border-l-4 ${
                      result.success
                        ? "border-l-green-500"
                        : "border-l-red-500"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {result.success && result.orderCode && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                {result.orderCode}
                              </Badge>
                            )}
                            {result.success && (
                              <Badge variant="outline" className="text-xs">
                                {result.buildingCode}
                              </Badge>
                            )}
                          </div>
                          {result.success ? (
                            <div className="mt-1 text-sm space-y-0.5">
                              <p className="font-medium">{result.customerName}</p>
                              <p className="text-muted-foreground">{result.phone}</p>
                              {result.items && result.items.length > 0 && (
                                <p className="text-muted-foreground">
                                  Sản phẩm:{" "}
                                  {result.items
                                    .map(
                                      (item) =>
                                        `${item.name} x${item.quantity}`
                                    )
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1">
                              <p className="text-sm text-red-600 font-medium">
                                {result.error}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                Nội dung: {result.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
