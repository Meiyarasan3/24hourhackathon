export type CsvTable = {
  headers: string[];
  records: { row: number; values: Record<string, string> }[];
};

export function parseCsv(text: string): CsvTable {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0].trim() === "") {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const source = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      pushCell();
      continue;
    }
    if (char === "\n") {
      pushCell();
      pushRow();
      continue;
    }
    if (char === "\r") continue;
    cell += char;
  }
  pushCell();
  pushRow();

  const [headerRow, ...body] = rows;
  const headers = (headerRow ?? []).map((header) => header.trim());
  const records = body.map((values, index) => {
    const record: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      record[header] = (values[headerIndex] ?? "").trim();
    });
    return { row: index + 2, values: record };
  });

  return { headers, records };
}
