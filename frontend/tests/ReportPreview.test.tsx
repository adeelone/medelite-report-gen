import React from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportPreview } from "@/components/ReportPreview";
import type { FacilityData, ManualInputs } from "@/lib/types";

const facility: FacilityData = {
  ccn: "686123",
  provider_name: "Kendall Lakes Healthcare and Rehab Center",
  provider_address: "5280 SW 157th Ave",
  city: "Miami",
  state: "FL",
  zip_code: "33185",
  location: "5280 SW 157th Ave, Miami, FL",
  census_capacity: 120,
  overall_star_rating: "1",
  health_inspection_rating: "1",
  staffing_rating: "2",
  quality_of_resident_care_rating: "4",
  claims_metrics: {},
};

const manual: ManualInputs = {
  emr: "PCC",
  current_census: 112,
  patient_type: "Long-term & Short-term",
  previous_coverage: false,
  previous_performance: "About 30 patients/day",
  medical_coverage: "Optometry, PCP, Podiatry",
  facility_name_override: "   ",
};

describe("ReportPreview", () => {
  it("falls back to the CMS facility name when override is blank", () => {
    render(<ReportPreview facility={facility} manual={manual} />);

    const row = screen.getByRole("row", { name: /Name of Facility/i });
    expect(within(row).getByText("Kendall Lakes Healthcare and Rehab Center")).toBeInTheDocument();
  });
});
