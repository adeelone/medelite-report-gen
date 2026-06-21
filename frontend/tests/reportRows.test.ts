import { describe, expect, it } from "vitest";
import { reportRows } from "@/lib/server/report";
import type { FacilityData, ManualInputs } from "@/lib/types";

const facility: FacilityData = {
  ccn: "105447",
  provider_name: "CMS Legal Facility",
  provider_address: "100 Main St",
  city: "Miami",
  state: "FL",
  zip_code: "33101",
  location: "100 Main St, Miami, FL 33101",
  census_capacity: 100,
  overall_star_rating: null,
  health_inspection_rating: null,
  staffing_rating: null,
  quality_of_resident_care_rating: null,
  claims_metrics: {},
};

const blankManual: ManualInputs = {
  emr: "",
  current_census: "",
  patient_type: "",
  previous_coverage: false,
  previous_performance: "",
  medical_coverage: "",
  facility_name_override: "   ",
};

describe("reportRows", () => {
  it("keeps every report row and falls back cleanly when manual fields are blank", () => {
    const rows = reportRows({ facility, manual: blankManual });

    expect(rows).toHaveLength(25);
    expect(rows[0]).toEqual(["Name of Facility", "CMS Legal Facility"]);
    expect(rows).toContainEqual(["EMR", "N/A"]);
    expect(rows).toContainEqual(["Current Census", "N/A"]);
    expect(rows).toContainEqual(["Type of Patient", "N/A"]);
    expect(rows).toContainEqual(["Medical Coverage", "N/A"]);
  });
});
