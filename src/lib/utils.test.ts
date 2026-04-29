import { describe, it, expect } from "vitest";
import {
  getStatusColor,
  getStatusLabel,
  formatCurrency,
  formatDate,
  formatDateShort,
  timeAgo,
  generateOrderCode,
  normalizePhone,
  isValidVietnamesePhone,
  cn,
} from "@/lib/utils";

// ─── getStatusColor ───
describe("getStatusColor", () => {
  it("returns yellow for pending", () => {
    expect(getStatusColor("pending")).toContain("bg-yellow");
  });

  it("returns green for delivered", () => {
    expect(getStatusColor("delivered")).toContain("bg-green");
  });

  it("returns red for cancelled", () => {
    expect(getStatusColor("cancelled")).toContain("bg-red");
  });

  it("returns emerald for cash_received", () => {
    expect(getStatusColor("cash_received")).toContain("bg-emerald");
  });

  it("returns cyan for transfer_pending", () => {
    expect(getStatusColor("transfer_pending")).toContain("bg-cyan");
  });

  it("returns teal for transferred", () => {
    expect(getStatusColor("transferred")).toContain("bg-teal");
  });

  it("returns gray fallback for unknown status", () => {
    expect(getStatusColor("unknown")).toContain("bg-gray");
  });

  it("covers all defined statuses without missing entries", () => {
    const statuses = [
      "pending", "confirmed", "preparing", "delivering",
      "cash_received", "transfer_pending", "transferred",
      "delivered", "cancelled",
    ];
    for (const s of statuses) {
      expect(getStatusColor(s)).not.toContain("bg-gray");
    }
  });
});

// ─── getStatusLabel ───
describe("getStatusLabel", () => {
  it("returns Vietnamese label for pending", () => {
    expect(getStatusLabel("pending")).toBe("Chờ xác nhận");
  });

  it("returns Vietnamese label for cash_received", () => {
    expect(getStatusLabel("cash_received")).toBe("Đã nhận tiền mặt");
  });

  it("returns Vietnamese label for transferred", () => {
    expect(getStatusLabel("transferred")).toBe("Đã chuyển khoản");
  });

  it("returns the raw status for unknown values", () => {
    expect(getStatusLabel("bogus")).toBe("bogus");
  });

  it("covers all defined statuses", () => {
    const statuses = [
      "pending", "confirmed", "preparing", "delivering",
      "cash_received", "transfer_pending", "transferred",
      "delivered", "cancelled",
    ];
    for (const s of statuses) {
      expect(getStatusLabel(s)).not.toBe(s);
    }
  });
});

// ─── formatCurrency ───
describe("formatCurrency", () => {
  it("formats a number as VND", () => {
    const result = formatCurrency(15000);
    expect(result).toContain("15.000");
    expect(result).toContain("₫");
  });

  it("handles string input", () => {
    const result = formatCurrency("25000");
    expect(result).toContain("25.000");
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });

  it("handles large numbers", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1.000.000");
  });
});

// ─── generateOrderCode ───
describe("generateOrderCode", () => {
  it("generates code with DH- prefix", () => {
    expect(generateOrderCode()).toMatch(/^DH-\d{6}-/);
  });

  it("generates codes in DH-yyMMdd-XXX format", () => {
    const code = generateOrderCode();
    expect(code).toMatch(/^DH-\d{6}-\d{3}$/);
  });

  it("generates diverse codes over multiple calls", () => {
    // Use a larger sample since 999 random values can have birthday-parity collisions
    const codes = new Set(Array.from({ length: 50 }, () => generateOrderCode()));
    expect(codes.size).toBeGreaterThanOrEqual(48); // allow up to 2 collisions
  });
});

// ─── normalizePhone ───
describe("normalizePhone", () => {
  it("removes +84 prefix and adds 0", () => {
    expect(normalizePhone("+84912345678")).toBe("0912345678");
  });

  it("keeps already normalized phone", () => {
    expect(normalizePhone("0912345678")).toBe("0912345678");
  });

  it("removes non-digit characters", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
  });
});

// ─── isValidVietnamesePhone ───
describe("isValidVietnamesePhone", () => {
  it("accepts valid Vietnamese mobile number", () => {
    expect(isValidVietnamesePhone("0912345678")).toBe(true);
  });

  it("accepts +84 format", () => {
    expect(isValidVietnamesePhone("+84912345678")).toBe(true);
  });

  it("rejects too short number", () => {
    expect(isValidVietnamesePhone("091234")).toBe(false);
  });

  it("rejects landline number", () => {
    expect(isValidVietnamesePhone("0241234567")).toBe(false);
  });
});

// ─── cn ───
describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
});

// ─── formatDate ───
describe("formatDate", () => {
  it("returns -- for null/undefined", () => {
    expect(formatDate(null)).toBe("--");
    expect(formatDate(undefined)).toBe("--");
  });

  it("formats a Date object", () => {
    const d = new Date(2026, 3, 30, 15, 30);
    expect(formatDate(d)).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });
});

// ─── formatDateShort ───
describe("formatDateShort", () => {
  it("returns -- for null", () => {
    expect(formatDateShort(null)).toBe("--");
  });

  it("formats a date as dd/MM", () => {
    const d = new Date(2026, 3, 30);
    expect(formatDateShort(d)).toBe("30/04");
  });
});

// ─── timeAgo ───
describe("timeAgo", () => {
  it("returns -- for null", () => {
    expect(timeAgo(null)).toBe("--");
  });

  it("returns relative time string", () => {
    const d = new Date();
    expect(timeAgo(d)).toContain("trước");
  });
});
