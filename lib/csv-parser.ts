import Papa from "papaparse";

export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  data: CSVRow[];
  headers: string[];
  errors: string[];
}

export function parseCSV(csvText: string): CSVParseResult {
  const errors: string[] = [];

  const result = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push(`Row ${err.row}: ${err.message}`);
    });
  }

  return {
    data: result.data,
    headers: result.meta.fields || [],
    errors,
  };
}

export interface FieldMapping {
  amount: string;
  date: string;
  description: string;
  accountId: string;
  categoryId: string;
}

export function validateMapping(mapping: Partial<FieldMapping>): string[] {
  const errors: string[] = [];

  if (!mapping.amount) errors.push("Amount field is required");
  if (!mapping.date) errors.push("Date field is required");
  if (!mapping.description) errors.push("Description field is required");

  return errors;
}

export function mapRow(row: CSVRow, mapping: FieldMapping): {
  amount: string;
  date: string;
  description: string;
  accountId: string;
  categoryId: string;
} | null {
  try {
    const amount = row[mapping.amount]?.replace(/[$,]/g, "").trim() || "0";
    const date = row[mapping.date]?.trim();
    const description = row[mapping.description]?.trim() || "Unknown";

    if (!date || !amount) {
      return null;
    }

    return {
      amount,
      date,
      description,
      accountId: mapping.accountId,
      categoryId: mapping.categoryId,
    };
  } catch {
    return null;
  }
}
