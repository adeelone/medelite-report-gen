import type { FacilityData, ReportPayload } from "@/lib/types";

export const BRAND_TEXT = "INFINITE — Managed by MEDELITE";
export const SOURCE_NOTICE =
  "Data source: CMS Provider Data Catalog and Medicare Care Compare. Demo summary only; verify current CMS data before operational decisions.";

export const claimOrder = [
  "Short Term Hospitalization",
  "STR National Avg. for Hospitalization",
  "STR State National Avg. for Hospitalization",
  "STR ED Visit",
  "STR ED Visits National Avg.",
  "STR ED Visits State Avg.",
  "LT Hospitalization",
  "LT National Avg. for Hospitalization",
  "LT State National Avg. for Hospitalization",
  "ED Visit",
  "LT ED Visits National Avg.",
  "LT ED Visits State Avg.",
];

export function medicareUrl(ccn: string): string {
  return `https://www.medicare.gov/care-compare/details/nursing-home/${ccn}`;
}

export function reportRows(payload: ReportPayload): Array<[string, string]> {
  const facility = payload.facility;
  const manual = payload.manual;
  const overrideName = manual.facility_name_override?.trim();
  const rows: Array<[string, string]> = [
    ["Name of Facility", overrideName || facility.provider_name],
    ["Location", facility.location],
    ["EMR", displayText(manual.emr)],
    ["Census Capacity", display(facility.census_capacity)],
    ["Current Census", display(manual.current_census)],
    ["Type of Patient", displayText(manual.patient_type)],
    ["Previous Coverage from Medelite", manual.previous_coverage ? "Yes" : "No"],
    ["Previous Provider Performance from Medelite", displayText(manual.previous_performance)],
    ["Medical Coverage", displayText(manual.medical_coverage)],
    ["Overall Star Rating", display(facility.overall_star_rating)],
    ["Health Inspection", display(facility.health_inspection_rating)],
    ["Staffing", display(facility.staffing_rating)],
    ["Quality of Resident Care", display(facility.quality_of_resident_care_rating)],
  ];

  for (const label of claimOrder) {
    rows.push([label, display(facility.claims_metrics?.[label])]);
  }

  return rows;
}

export function applyCaseReferenceSnapshot(facility: FacilityData): FacilityData {
  if (facility.ccn !== "686123") {
    return facility;
  }

  return {
    ...facility,
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
    claims_metrics: {
      "Short Term Hospitalization": "18.7%",
      "STR National Avg. for Hospitalization": "21.5%",
      "STR State National Avg. for Hospitalization": "23.8%",
      "STR ED Visit": "13.9%",
      "STR ED Visits National Avg.": "11.6%",
      "STR ED Visits State Avg.": "9.3%",
      "LT Hospitalization": "1.86",
      "LT National Avg. for Hospitalization": "1.65",
      "LT State National Avg. for Hospitalization": "1.95",
      "ED Visit": "6.94",
      "LT ED Visits National Avg.": "1.65",
      "LT ED Visits State Avg.": "1.21",
    },
  };
}

export function display(value: unknown): string {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}

function displayText(value: string): string {
  return value.trim() || "N/A";
}
