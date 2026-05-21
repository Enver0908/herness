import { describe, expect, it } from "vitest";
import { buildComplianceCsv } from "./export";

describe("compliance CSV export", () => {
  it("exports approved compliance rows and escapes CSV cells", () => {
    const csv = buildComplianceCsv([
      {
        arrivalDate: "2026-06-04",
        guestName: 'Maria "M" Santos',
        nationality: "Spain",
        propertyName: "Old Town Loft 2B",
      },
    ]);

    expect(csv).toContain("guest_name,property_name,arrival_date,nationality");
    expect(csv).toContain('"Maria ""M"" Santos"');
  });
});
