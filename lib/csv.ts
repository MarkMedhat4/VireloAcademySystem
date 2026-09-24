/**
 * CSV helpers for admin export. Cells that start with = + - @ are prefixed with a quote to
 * neutralise spreadsheet formula injection. A BOM is added so Excel opens Arabic text correctly.
 */
export function escapeCsvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Array<Array<unknown>>): string {
  const lines = [headers, ...rows].map((r) => r.map(escapeCsvCell).join(","));
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
