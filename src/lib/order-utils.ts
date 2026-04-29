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
      /(\d+)\s*(.+)/,
      /(.+?)\s*x\s*(\d+)/i,
      /(.+?)\s+(\d+)\s*(cái|hộp|chai|gói|kg|lít)?$/,
    ];

    let matched = false;
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let name: string, qty: number;
        if (pattern === patterns[0]) {
          qty = parseInt(match[1]);
          name = match[2].trim();
        } else if (pattern === patterns[1]) {
          name = match[1].trim();
          qty = parseInt(match[2]);
        } else {
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

/**
 * Get the start and end of a day offset from today.
 * 0 = today, 1 = tomorrow, -1 = yesterday
 */
export function getDayRange(offset: number): { start: Date; end: Date } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}
