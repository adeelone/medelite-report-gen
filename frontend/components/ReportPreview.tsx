import React from "react";
import type { FacilityData, ManualInputs } from "@/lib/types";

const claimOrder = [
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

type Props = {
  facility: FacilityData | null;
  manual: ManualInputs;
};

export function ReportPreview({ facility, manual }: Props) {
  const overrideName = manual.facility_name_override.trim();
  const rows = facility
    ? [
        ["Name of Facility", overrideName || facility.provider_name],
        ["Location", facility.location],
        ["EMR", manual.emr],
        ["Census Capacity", display(facility.census_capacity)],
        ["Current Census", display(manual.current_census)],
        ["Type of Patient", manual.patient_type],
        ["Previous Coverage from Medelite", manual.previous_coverage ? "Yes" : "No"],
        ["Previous Provider Performance from Medelite", manual.previous_performance],
        ["Medical Coverage", manual.medical_coverage],
        ["Overall Star Rating", display(facility.overall_star_rating)],
        ["Health Inspection", display(facility.health_inspection_rating)],
        ["Staffing", display(facility.staffing_rating)],
        ["Quality of Resident Care", display(facility.quality_of_resident_care_rating)],
        ...claimOrder.map((label) => [label, display(facility.claims_metrics?.[label])]),
      ]
    : [];

  return (
    <section className="previewPanel">
      <div className="brandBlock">
        <div>INFINITE — Managed by MEDELITE</div>
        <strong>FACILITY ASSESSMENT SNAPSHOT</strong>
        <span>{facility?.state ?? ""}</span>
      </div>
      {facility ? (
        <table className="snapshotTable">
          <tbody>
            {rows.map(([label, value]) => (
              <tr key={label}>
                <th>{label}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="emptyState">Enter a CCN and run lookup to populate the snapshot.</div>
      )}
    </section>
  );
}

function display(value: unknown): string {
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
}
