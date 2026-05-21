import type { ComplianceExportRow } from "./types";

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function buildComplianceCsv(rows: ComplianceExportRow[]) {
  const header = [
    "guest_name",
    "date_of_birth",
    "nationality",
    "passport_number",
    "arrival_date",
    "departure_date",
    "property_name",
  ].join(",");

  const body = rows.map((row) =>
    [
      row.guestName,
      row.dateOfBirth ?? "",
      row.nationality,
      row.passportNumber ?? "",
      row.arrivalDate,
      row.departureDate ?? "",
      row.propertyName,
    ]
      .map(csvCell)
      .join(","),
  );

  return [header, ...body].join("\n");
}
