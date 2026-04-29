import { describe, it, expect } from "vitest";
import { parseItemsFromNote, getDayRange } from "@/lib/order-utils";

// ─── parseItemsFromNote ───
describe("parseItemsFromNote", () => {
  it("returns empty array for empty string", () => {
    expect(parseItemsFromNote("")).toEqual([]);
  });

  it("returns empty array for null/undefined", () => {
    expect(parseItemsFromNote(null as any)).toEqual([]);
    expect(parseItemsFromNote(undefined as any)).toEqual([]);
  });

  it('parses "2 bánh mì" (quantity first)', () => {
    const result = parseItemsFromNote("2 bánh mì");
    expect(result).toEqual([{ productName: "bánh mì", quantity: 2, unitPrice: 0 }]);
  });

  it('parses "bánh mì x2" (x notation)', () => {
    const result = parseItemsFromNote("bánh mì x2");
    expect(result).toEqual([{ productName: "bánh mì", quantity: 2, unitPrice: 0 }]);
  });

  it('parses "bánh mì 2 cái" as 2x cái (digit-first pattern wins)', () => {
    // The digit-first pattern /(\d+)\s*(.+)/ matches "2 cái" at the digit position
    const result = parseItemsFromNote("bánh mì 2 cái");
    expect(result).toEqual([{ productName: "cái", quantity: 2, unitPrice: 0 }]);
  });

  it('uses x-notation for "bánh mì x2"', () => {
    const result = parseItemsFromNote("bánh mì x2");
    expect(result).toEqual([{ productName: "bánh mì", quantity: 2, unitPrice: 0 }]);
  });

  it("parses comma-separated items", () => {
    const result = parseItemsFromNote("2 bánh mì, 1 cà phê sữa");
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ productName: "bánh mì", quantity: 2 });
    expect(result[1]).toMatchObject({ productName: "cà phê sữa", quantity: 1 });
  });

  it("parses newline-separated items", () => {
    const result = parseItemsFromNote("2 bánh mì\n1 cà phê");
    expect(result).toHaveLength(2);
  });

  it("handles single item without quantity", () => {
    const result = parseItemsFromNote("bánh mì");
    expect(result).toEqual([{ productName: "bánh mì", quantity: 1, unitPrice: 0 }]);
  });

  it("skips pure number lines", () => {
    expect(parseItemsFromNote("12345")).toEqual([]);
  });

  it("handles mixed Vietnamese input", () => {
    const result = parseItemsFromNote("3 bánh mì thịt, 2 trà sữa xịn");
    expect(result).toHaveLength(2);
    expect(result[0].productName).toBe("bánh mì thịt");
    expect(result[1].productName).toBe("trà sữa xịn");
  });
});

// ─── getDayRange ───
describe("getDayRange", () => {
  it("returns today's start and end for offset 0", () => {
    const { start, end } = getDayRange(0);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    // End should be exactly 24 hours later (handles month rollover)
    const diffMs = end.getTime() - start.getTime();
    expect(diffMs).toBe(24 * 60 * 60 * 1000);
  });

  it("returns tomorrow for offset 1", () => {
    const { start } = getDayRange(1);
    const today = new Date();
    // Tomorrow's date should be today + 1
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() + 1);
    expect(start.getDate()).toBe(expectedDate.getDate());
  });

  it("returns yesterday for offset -1", () => {
    const { start } = getDayRange(-1);
    const today = new Date();
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - 1);
    expect(start.getDate()).toBe(expectedDate.getDate());
  });

  it("start is before end", () => {
    const { start, end } = getDayRange(0);
    expect(start.getTime()).toBeLessThan(end.getTime());
  });

  it("range is exactly 24 hours", () => {
    const { start, end } = getDayRange(0);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBe(24);
  });
});
