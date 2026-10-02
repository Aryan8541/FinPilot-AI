import { describe, expect, it } from "vitest";
import { parseCSV } from "./csv-parser";

describe("parseCSV", () => {
  it("rejects oversized CSV imports before they are processed", () => {
    const rows = Array.from({ length: 5001 }, (_, index) => `1.00,2024-01-01,Import ${index}`);
    const csvText = `amount,date,description\n${rows.join("\n")}`;

    const result = parseCSV(csvText);

    expect(result.errors.some((error) => /exceeds|too large/i.test(error))).toBe(true);
  });
});
