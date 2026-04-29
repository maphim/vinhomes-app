import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy HH:mm");
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: vi });
}


let _orderCounter = 0;

export function generateOrderCode(): string {
  const now = new Date();
  const dateStr = format(now, "yyMMdd");
  _orderCounter = (_orderCounter + 1) % 9999;
  const rand = _orderCounter.toString().padStart(4, "0");
  return `DH-${dateStr}-${rand}`;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    confirmed: "bg-blue-100 text-blue-800 border-blue-300",
    preparing: "bg-purple-100 text-purple-800 border-purple-300",
    delivering: "bg-orange-100 text-orange-800 border-orange-300",
    cash_received: "bg-emerald-100 text-emerald-800 border-emerald-300",
    transfer_pending: "bg-cyan-100 text-cyan-800 border-cyan-300",
    transferred: "bg-teal-100 text-teal-800 border-teal-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    preparing: "Đang chuẩn bị",
    delivering: "Đang giao",
    cash_received: "Đã nhận tiền mặt",
    transfer_pending: "Chờ chuyển khoản",
    transferred: "Đã chuyển khoản",
    delivered: "Đã giao",
    cancelled: "Đã hủy",
  };
  return map[status] || status;
}

export const VIETNAMESE_PHONE_REGEX =
  /^(?:\+84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

export function isValidVietnamesePhone(phone: string): boolean {
  return VIETNAMESE_PHONE_REGEX.test(phone);
}

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  // Convert +84 to 0
  if (cleaned.startsWith("84")) cleaned = "0" + cleaned.slice(2);
  return cleaned;
}
