import type { ComplianceExportRow } from "./types";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildComplianceCsv(rows: ComplianceExportRow[]) {
  const header = [
    "guest_name",
    "property_name",
    "arrival_date",
    "nationality",
  ].join(",");

  const body = rows.map((row) =>
    [
      row.guestName,
      row.propertyName,
      row.arrivalDate,
      row.nationality,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header, ...body].join("\n");
}
