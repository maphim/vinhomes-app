/**
 * Parse items from natural language note text (e.g. "2 bánh mì, 1 cà phê sữa")
 */
export function parseItemsFromNote(note: string): Array<{
  productName: string;
  quantity: number;
  unitPrice: number;
}> {
  if (!note) return [];

  const items: Array<{ productName: string; quantity: number; unitPrice: number }> = [];
  const lines = note
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const patterns = [
      /(.+?)\s+(\d+)\s*(cái|hộp|chai|gói|kg|lít|ly|cốc|phần)$/i,  // unit-suffix first
      /(.+?)\s*x\s*(\d+)/i,  // x-notation
      /(\d+)\s*(.+)/,  // digit-first last
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let name: string, qty: number;
        if (pattern === patterns[2]) {
          // digit-first: "2 bánh mì" -> qty=2, name="bánh mì"
          qty = parseInt(match[1]);
          name = match[2].trim();
        } else {
          // unit-suffix or x-notation: name=group1, qty=group2
          name = match[1].trim();
          qty = parseInt(match[2]);
        }
        if (name.length > 1 && !/^\d+$/.test(name)) {
          items.push({ productName: name, quantity: qty, unitPrice: 0 });
          matched = true;
          break;
        }
      }
    }

    if (!matched && line.length > 2 && !/^\d+$/.test(line)) {
      items.push({ productName: line, quantity: 1, unitPrice: 0 });
    }
  }

  return items;
}

export function getDayRange(offset: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
