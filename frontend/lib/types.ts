export type ClaimsMetrics = Record<string, string | null | undefined>;

export type FacilityData = {
  ccn: string;
  provider_name: string;
  provider_address: string;
  city: string;
  state: string;
  zip_code: string;
  location: string;
  census_capacity: number | null;
  overall_star_rating: string | null;
  health_inspection_rating: string | null;
  staffing_rating: string | null;
  quality_of_resident_care_rating: string | null;
  claims_metrics: ClaimsMetrics;
};

export type ManualInputs = {
  emr: string;
  current_census: number | "";
  patient_type: string;
  previous_coverage: boolean;
  previous_performance: string;
  medical_coverage: string;
  facility_name_override: string;
};

export type ReportPayload = {
  facility: FacilityData;
  manual: ManualInputs;
};

export type ExportKind = "pdf" | "docx";
