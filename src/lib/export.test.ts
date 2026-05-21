import { describe, expect, it } from "vitest";
import { buildComplianceCsv } from "./export";

describe("compliance CSV export", () => {
  it("exports approved compliance rows and escapes CSV cells", () => {
    const csv = buildComplianceCsv([
      {
        arrivalDate: "2026-06-04",
        departureDate: "2026-06-11",
        guestName: 'Maria "M" Santos',
        nationality: "Spain",
        dateOfBirth: "1992-04-15",
        passportNumber: "ABC123456",
        propertyName: "Old Town Loft 2B",
      },
    ]);

    expect(csv).toContain("guest_name,date_of_birth,nationality,passport_number,arrival_date,departure_date,property_name");
    expect(csv).toContain('"Maria ""M"" Santos"');
    expect(csv).toContain('"1992-04-15"');
    expect(csv).toContain('"ABC123456"');
    expect(csv).toContain('"2026-06-11"');
  });
});
