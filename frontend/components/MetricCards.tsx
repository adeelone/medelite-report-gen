import React from "react";
import type { FacilityData } from "@/lib/types";

type Props = {
  facility: FacilityData | null;
};

export function MetricCards({ facility }: Props) {
  if (!facility) {
    return null;
  }

  const cards = [
    ["Overall", facility.overall_star_rating],
    ["Health Inspection", facility.health_inspection_rating],
    ["Staffing", facility.staffing_rating],
    ["Quality Care", facility.quality_of_resident_care_rating],
  ];

  return (
    <section className="metricCards" aria-label="Performance metric cards">
      {cards.map(([label, value]) => (
        <div className="metricCard" key={label}>
          <span>{label}</span>
          <strong>{value ?? "N/A"}</strong>
        </div>
      ))}
    </section>
  );
}
