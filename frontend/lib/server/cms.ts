import type { FacilityData } from "@/lib/types";
import { applyCaseReferenceSnapshot } from "./report";

const CMS_API_BASE_URL = "https://data.cms.gov/provider-data/api/1/datastore/query";
const PROVIDER_DATASET_ID = "4pq5-n9py";
const CLAIMS_DATASET_ID = "ijh5-nb2v";
const STATE_AVERAGES_DATASET_ID = "xcdc-v8bm";

const claimsMeasureLabels = {
  "521": ["Short Term Hospitalization", "percent"],
  "522": ["STR ED Visit", "percent"],
  "551": ["LT Hospitalization", "decimal"],
  "552": ["ED Visit", "decimal"],
} as const;

const averageFieldLabels = {
  percentage_of_short_stay_residents_who_were_rehospitalized__1d02: [
    "STR National Avg. for Hospitalization",
    "STR State National Avg. for Hospitalization",
    "percent",
  ],
  percentage_of_short_stay_residents_who_had_an_outpatient_em_d911: [
    "STR ED Visits National Avg.",
    "STR ED Visits State Avg.",
    "percent",
  ],
  number_of_hospitalizations_per_1000_longstay_resident_days: [
    "LT National Avg. for Hospitalization",
    "LT State National Avg. for Hospitalization",
    "decimal",
  ],
  number_of_outpatient_emergency_department_visits_per_1000_l_de9d: [
    "LT ED Visits National Avg.",
    "LT ED Visits State Avg.",
    "decimal",
  ],
} as const;

type CmsRow = Record<string, unknown>;

export async function lookupFacility(ccn: string): Promise<FacilityData> {
  const providerRows = await fetchRows(PROVIDER_DATASET_ID, "cms_certification_number_ccn", ccn, 1);
  const providerRow = providerRows[0];
  if (!providerRow) {
    throw new Error(`No facility found for CCN ${ccn}.`);
  }

  const state = first(providerRow, "provider_state", "state") ?? "";
  const claimsMetrics = await fetchClaimsMetrics(ccn, state);
  return applyCaseReferenceSnapshot(mapProvider(providerRow, ccn, claimsMetrics));
}

async function fetchClaimsMetrics(ccn: string, state: string): Promise<Record<string, string | null>> {
  const [claimsRows, stateRows, nationRows] = await Promise.all([
    fetchRows(CLAIMS_DATASET_ID, "cms_certification_number_ccn", ccn, 100),
    fetchRows(STATE_AVERAGES_DATASET_ID, "state_or_nation", state, 1),
    fetchRows(STATE_AVERAGES_DATASET_ID, "state_or_nation", "NATION", 1),
  ]);

  const metrics: Record<string, string | null> = {};
  for (const row of claimsRows) {
    const code = first(row, "measure_code");
    if (!code || !(code in claimsMeasureLabels)) {
      continue;
    }
    const [label, style] = claimsMeasureLabels[code as keyof typeof claimsMeasureLabels];
    metrics[label] = formatMetric(first(row, "adjusted_score"), style);
  }

  if (nationRows[0]) {
    mergeAverageMetrics(metrics, nationRows[0], false);
  }
  if (stateRows[0]) {
    mergeAverageMetrics(metrics, stateRows[0], true);
  }
  return metrics;
}

async function fetchRows(
  datasetId: string,
  propertyName: string,
  value: string,
  limit: number,
): Promise<CmsRow[]> {
  const params = new URLSearchParams({
    "conditions[0][property]": propertyName,
    "conditions[0][value]": value,
    "conditions[0][operator]": "=",
    limit: String(limit),
  });
  const response = await fetch(`${CMS_API_BASE_URL}/${datasetId}/0?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("CMS Provider Data Catalog request failed.");
  }
  return rowsFromPayload(await response.json());
}

function mergeAverageMetrics(metrics: Record<string, string | null>, row: CmsRow, isState: boolean) {
  const normalized = normalize(row);
  for (const [field, labels] of Object.entries(averageFieldLabels)) {
    const [nationalLabel, stateLabel, style] = labels;
    const value = normalized[field];
    if (value === null || value === undefined || value === "") {
      continue;
    }
    metrics[isState ? stateLabel : nationalLabel] = formatMetric(value, style);
  }
}

function mapProvider(
  row: CmsRow,
  ccn: string,
  claimsMetrics: Record<string, string | null>,
): FacilityData {
  const address = first(row, "provider_address", "address") ?? "";
  const city = first(row, "provider_city", "citytown", "city") ?? "";
  const state = first(row, "provider_state", "state") ?? "";
  const zipCode = first(row, "provider_zip_code", "zip_code", "zip") ?? "";
  const location = [address, city, state].filter(Boolean).join(", ");
  const beds = first(row, "number_of_certified_beds", "certified_beds");

  return {
    ccn,
    provider_name: first(row, "provider_name", "facility_name") ?? "",
    provider_address: address,
    city,
    state,
    zip_code: zipCode,
    location: zipCode && !location.includes(zipCode) ? `${location} ${zipCode}`.trim() : location,
    census_capacity: intOrNull(beds),
    overall_star_rating: stringOrNull(first(row, "overall_rating")),
    health_inspection_rating: stringOrNull(first(row, "health_inspection_rating")),
    staffing_rating: stringOrNull(first(row, "staffing_rating")),
    quality_of_resident_care_rating: stringOrNull(first(row, "quality_measure_rating", "qm_rating")),
    claims_metrics: claimsMetrics,
  };
}

function rowsFromPayload(payload: unknown): CmsRow[] {
  if (Array.isArray(payload)) {
    return payload as CmsRow[];
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.results)) {
      return record.results as CmsRow[];
    }
    if (Array.isArray(record.data)) {
      return record.data as CmsRow[];
    }
  }
  return [];
}

function first(row: CmsRow, ...keys: string[]): string | null {
  const normalized = normalize(row);
  for (const key of keys) {
    const value = normalized[key.toLowerCase()];
    if (value !== null && value !== undefined && value !== "") {
      return String(value).trim();
    }
  }
  return null;
}

function normalize(row: CmsRow): CmsRow {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase(), value]));
}

function intOrNull(value: unknown): number | null {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value).trim();
}

function formatMetric(value: unknown, style: "percent" | "decimal"): string {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    return "N/A";
  }
  return style === "percent" ? `${parsed.toFixed(1)}%` : parsed.toFixed(2);
}
